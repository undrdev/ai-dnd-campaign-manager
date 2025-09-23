# Real-time Collaboration API Specification

## Overview
The Real-time API provides live collaboration capabilities for D&D sessions using SignalR WebSocket connections, enabling synchronized gameplay, real-time updates, and seamless multiplayer experiences.

## Base URL
```
WebSocket: wss://api.dndai.com/realtime/v1/hub
HTTP Fallback: https://api.dndai.com/realtime/v1
```

## Authentication
All connections require a valid JWT token:
```
Connection: Bearer <jwt_token>
Query Parameter: ?access_token=<jwt_token>
```

## Connection Management

### Hub Connection
```javascript
// Client connection example
const connection = new signalR.HubConnectionBuilder()
    .withUrl("wss://api.dndai.com/realtime/v1/hub", {
        accessTokenFactory: () => getJwtToken()
    })
    .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: retryContext => {
            return Math.min(1000 * Math.pow(2, retryContext.previousRetryCount), 30000);
        }
    })
    .configureLogging(signalR.LogLevel.Information)
    .build();
```

### Connection Events
```json
{
  "ConnectionStarted": {
    "user_id": "uuid",
    "connection_id": "string",
    "timestamp": "2024-01-15T10:30:00Z"
  },
  "ConnectionClosed": {
    "user_id": "uuid",
    "connection_id": "string",
    "reason": "client_disconnect",
    "timestamp": "2024-01-15T10:30:00Z"
  },
  "Reconnected": {
    "user_id": "uuid",
    "connection_id": "string",
    "previous_connection_id": "string",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

## Session Management

### Join Session
Join a campaign session for real-time collaboration.

**Client Method:**
```javascript
await connection.invoke("JoinSession", {
    campaign_id: "uuid",
    character_id: "uuid", // Optional for players
    session_type: "gameplay" // "gameplay", "planning", "character_creation"
});
```

**Server Response:**
```json
{
  "success": true,
  "session_info": {
    "session_id": "uuid",
    "campaign_id": "uuid",
    "session_type": "gameplay",
    "status": "active", // "waiting", "active", "paused", "ended"
    "participants": [
      {
        "user_id": "uuid",
        "display_name": "Alice",
        "role": "player",
        "character": {
          "id": "uuid",
          "name": "Thorin Ironforge"
        },
        "connection_status": "connected",
        "last_activity": "2024-01-15T10:30:00Z"
      },
      {
        "user_id": "uuid",
        "display_name": "Bob",
        "role": "gm",
        "connection_status": "connected",
        "last_activity": "2024-01-15T10:30:00Z"
      }
    ],
    "session_state": {
      "current_scene": "Stonehill Inn",
      "active_initiative": false,
      "shared_notes": "Party is investigating goblin troubles",
      "active_map": "phandalin_map_id"
    }
  }
}
```

### Leave Session
```javascript
await connection.invoke("LeaveSession", {
    session_id: "uuid",
    reason: "player_disconnect" // "player_disconnect", "session_end", "kicked"
});
```

## Real-time Events

### Campaign State Updates

#### World State Change
Broadcast when campaign world state changes.

**Server Event:** `WorldStateChanged`
```json
{
  "campaign_id": "uuid",
  "session_id": "uuid",
  "changes": {
    "current_location": {
      "old_value": "Triboar Trail",
      "new_value": "Phandalin",
      "changed_by": "uuid",
      "timestamp": "2024-01-15T10:30:00Z"
    },
    "global_flags": {
      "added": {
        "goblin_ambush_defeated": true
      },
      "updated": {},
      "removed": []
    },
    "active_events": {
      "added": [
        {
          "id": "uuid",
          "name": "Celebration in Phandalin",
          "description": "Town celebrates defeat of goblin threat"
        }
      ],
      "updated": [],
      "removed": ["goblin_raids_increasing"]
    }
  },
  "change_summary": "Party arrived in Phandalin after defeating goblin ambush"
}
```

#### Character State Update
```json
{
  "event": "CharacterStateChanged",
  "data": {
    "character_id": "uuid",
    "player_id": "uuid",
    "changes": {
      "hit_points": {
        "old_value": 25,
        "new_value": 31,
        "change_reason": "healing_potion"
      },
      "location": {
        "old_value": "Triboar Trail",
        "new_value": "Phandalin"
      },
      "conditions": {
        "added": [],
        "removed": ["exhausted"]
      }
    },
    "changed_by": "uuid",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

### Combat System

#### Initiative Tracking
```javascript
// Start initiative
await connection.invoke("StartInitiative", {
    session_id: "uuid",
    participants: [
        {
            "character_id": "uuid",
            "character_name": "Thorin",
            "initiative_roll": 15,
            "participant_type": "player_character"
        },
        {
            "npc_id": "uuid",
            "npc_name": "Goblin Leader",
            "initiative_roll": 12,
            "participant_type": "npc"
        }
    ]
});
```

**Server Event:** `InitiativeStarted`
```json
{
  "session_id": "uuid",
  "initiative_order": [
    {
      "id": "uuid",
      "name": "Thorin",
      "type": "player_character",
      "initiative": 15,
      "hit_points": {
        "current": 31,
        "maximum": 31
      },
      "armor_class": 18,
      "conditions": []
    },
    {
      "id": "uuid",
      "name": "Goblin Leader",
      "type": "npc",
      "initiative": 12,
      "hit_points": {
        "current": 11,
        "maximum": 11
      },
      "armor_class": 15,
      "conditions": []
    }
  ],
  "current_turn": {
    "participant_id": "uuid",
    "participant_name": "Thorin",
    "turn_start": "2024-01-15T10:30:00Z"
  },
  "round_number": 1
}
```

#### Turn Management
```javascript
// End current turn
await connection.invoke("EndTurn", {
    session_id: "uuid",
    participant_id: "uuid",
    actions_taken: [
        {
            "action_type": "attack",
            "target": "goblin_leader",
            "result": "hit",
            "damage": 8
        },
        {
            "action_type": "move",
            "from": "A1",
            "to": "B2"
        }
    ]
});
```

**Server Event:** `TurnChanged`
```json
{
  "session_id": "uuid",
  "previous_turn": {
    "participant_id": "uuid",
    "participant_name": "Thorin",
    "actions_summary": ["Attacked Goblin Leader for 8 damage", "Moved to B2"]
  },
  "current_turn": {
    "participant_id": "uuid",
    "participant_name": "Goblin Leader",
    "turn_start": "2024-01-15T10:30:00Z"
  },
  "round_number": 1,
  "initiative_updates": [
    {
      "participant_id": "goblin_leader_uuid",
      "hit_points": {
        "current": 3,
        "maximum": 11
      },
      "conditions": ["bloodied"]
    }
  ]
}
```

### Dice Rolling

#### Roll Dice
```javascript
await connection.invoke("RollDice", {
    session_id: "uuid",
    roller_id: "uuid",
    roll_type: "attack", // "attack", "damage", "saving_throw", "ability_check", "skill_check", "custom"
    dice_expression: "1d20+5",
    context: {
        "ability": "strength",
        "skill": "athletics",
        "target": "goblin_leader",
        "advantage": false,
        "disadvantage": false
    },
    visibility: "all" // "all", "gm_only", "private"
});
```

**Server Event:** `DiceRolled`
```json
{
  "session_id": "uuid",
  "roll_id": "uuid",
  "roller": {
    "user_id": "uuid",
    "display_name": "Alice",
    "character_name": "Thorin"
  },
  "roll_details": {
    "expression": "1d20+5",
    "roll_type": "attack",
    "individual_rolls": [
      {
        "die_type": "d20",
        "result": 15,
        "modifier": 5
      }
    ],
    "total": 20,
    "context": {
      "ability": "strength",
      "target": "goblin_leader",
      "advantage": false
    }
  },
  "result_interpretation": {
    "success": true,
    "critical": false,
    "description": "Attack hits AC 15"
  },
  "visibility": "all",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Chat and Communication

#### Send Message
```javascript
await connection.invoke("SendMessage", {
    session_id: "uuid",
    message: {
        "type": "chat", // "chat", "action", "whisper", "ooc", "system"
        "content": "I search the room for traps",
        "speaker": {
            "type": "character", // "character", "player", "gm"
            "name": "Thorin Ironforge"
        },
        "target": null, // For whispers: user_id
        "metadata": {
            "action_type": "investigation",
            "roll_required": true
        }
    }
});
```

**Server Event:** `MessageReceived`
```json
{
  "session_id": "uuid",
  "message_id": "uuid",
  "sender": {
    "user_id": "uuid",
    "display_name": "Alice",
    "character_name": "Thorin Ironforge"
  },
  "message": {
    "type": "chat",
    "content": "I search the room for traps",
    "speaker": {
      "type": "character",
      "name": "Thorin Ironforge"
    },
    "formatting": {
      "color": "#4A90E2",
      "style": "character_speech"
    }
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "visibility": "all"
}
```

#### AI-Generated Response
When GM requests AI assistance for NPC dialogue or descriptions.

**Server Event:** `AIResponseGenerated`
```json
{
  "session_id": "uuid",
  "ai_response": {
    "type": "npc_dialogue",
    "npc": {
      "id": "uuid",
      "name": "Toblen Stonehill"
    },
    "content": {
      "spoken_text": "Welcome to the Stonehill Inn, friends! You look like you've had quite the adventure.",
      "actions": ["Toblen wipes his hands on his apron", "He gestures toward empty tables"],
      "mood": "welcoming"
    },
    "context_used": {
      "party_condition": "travel_worn",
      "time_of_day": "evening",
      "recent_events": ["goblin_encounter"]
    }
  },
  "generation_metadata": {
    "tokens_used": 120,
    "processing_time_ms": 1500
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Map and Visual Updates

#### Update Map
```javascript
await connection.invoke("UpdateMap", {
    session_id: "uuid",
    map_changes: {
        "active_map": "phandalin_inn_interior",
        "character_positions": {
            "thorin_uuid": {"x": 5, "y": 8},
            "elara_uuid": {"x": 6, "y": 8}
        },
        "revealed_areas": [
            {"x": 4, "y": 7, "width": 4, "height": 3}
        ],
        "markers": {
            "added": [
                {
                    "id": "uuid",
                    "type": "point_of_interest",
                    "position": {"x": 10, "y": 12},
                    "label": "Secret Door",
                    "visibility": "gm_only"
                }
            ],
            "removed": ["old_marker_uuid"]
        }
    }
});
```

**Server Event:** `MapUpdated`
```json
{
  "session_id": "uuid",
  "map_state": {
    "active_map": "phandalin_inn_interior",
    "character_positions": {
      "thorin_uuid": {"x": 5, "y": 8},
      "elara_uuid": {"x": 6, "y": 8}
    },
    "revealed_areas": [
      {"x": 0, "y": 0, "width": 15, "height": 15}
    ],
    "active_markers": [
      {
        "id": "uuid",
        "type": "point_of_interest",
        "position": {"x": 10, "y": 12},
        "label": "Secret Door",
        "visibility": "gm_only"
      }
    ]
  },
  "changes_summary": "Characters moved to inn interior, new POI added",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Session State Management

### Save Session State
```javascript
await connection.invoke("SaveSessionState", {
    session_id: "uuid",
    state_data: {
        "current_scene": "Stonehill Inn - Common Room",
        "party_status": "resting",
        "active_npcs": ["toblen_stonehill", "pip_stonehill"],
        "scene_notes": "Party has just arrived and is getting rooms",
        "pending_actions": [
            {
                "character": "thorin",
                "action": "investigate_rumors",
                "status": "pending"
            }
        ]
    },
    "auto_save": false
});
```

### Load Session State
```javascript
await connection.invoke("LoadSessionState", {
    session_id: "uuid",
    state_version: "latest" // "latest", specific timestamp
});
```

## Conflict Resolution

### Handle Concurrent Edits
When multiple users try to modify the same data simultaneously.

**Server Event:** `ConflictDetected`
```json
{
  "session_id": "uuid",
  "conflict_id": "uuid",
  "conflict_type": "character_state_edit",
  "conflicting_changes": [
    {
      "user_id": "uuid",
      "user_name": "Alice",
      "change": {
        "field": "hit_points.current",
        "old_value": 25,
        "new_value": 20,
        "reason": "took_damage"
      },
      "timestamp": "2024-01-15T10:30:00Z"
    },
    {
      "user_id": "uuid",
      "user_name": "Bob (GM)",
      "change": {
        "field": "hit_points.current",
        "old_value": 25,
        "new_value": 31,
        "reason": "healing_applied"
      },
      "timestamp": "2024-01-15T10:30:05Z"
    }
  ],
  "resolution_options": [
    "accept_latest",
    "accept_gm_version",
    "manual_resolve"
  ]
}
```

### Resolve Conflict
```javascript
await connection.invoke("ResolveConflict", {
    conflict_id: "uuid",
    resolution: "manual_resolve",
    final_value: {
        "hit_points": {
            "current": 26,
            "reason": "Applied healing then damage"
        }
    },
    resolved_by: "uuid"
});
```

## Error Handling

### Connection Errors
```json
{
  "error_type": "connection_failed",
  "code": "AUTH_TOKEN_EXPIRED",
  "message": "Authentication token has expired",
  "details": {
    "expired_at": "2024-01-15T10:00:00Z",
    "current_time": "2024-01-15T10:30:00Z"
  },
  "retry_after": 0,
  "requires_reconnection": true
}
```

### Session Errors
```json
{
  "error_type": "session_error",
  "code": "SESSION_NOT_FOUND",
  "message": "The requested session does not exist or has ended",
  "session_id": "uuid",
  "suggested_action": "refresh_session_list"
}
```

## Rate Limiting and Performance

### Connection Limits
- **Concurrent Connections per User**: 3
- **Messages per Connection**: 100/minute
- **Data Transfer per Connection**: 1MB/minute
- **Session Duration**: 8 hours maximum

### Message Priorities
```json
{
  "high_priority": ["dice_rolls", "combat_actions", "turn_changes"],
  "medium_priority": ["chat_messages", "character_updates"],
  "low_priority": ["map_updates", "ambient_notifications"]
}
```

## Implementation Notes

### SignalR Hub Configuration
```csharp
[Authorize]
public class GameSessionHub : Hub
{
    public async Task JoinSession(JoinSessionRequest request)
    {
        // Validate user permissions
        // Add to session group
        // Broadcast user joined
        // Send current session state
    }
    
    public async Task SendMessage(SendMessageRequest request)
    {
        // Validate message content
        // Apply rate limiting
        // Broadcast to session group
        // Log for history
    }
}
```

### Connection Management
- Automatic reconnection with exponential backoff
- Connection state persistence during brief disconnections
- Graceful handling of network interruptions
- Connection pooling for performance

### Data Synchronization
- Event sourcing for session state changes
- Conflict detection and resolution mechanisms
- Optimistic locking for concurrent edits
- State snapshots for recovery

### Security Considerations
- JWT token validation on connection
- Per-session authorization checks
- Rate limiting per connection
- Input sanitization and validation
- Audit logging of all actions
