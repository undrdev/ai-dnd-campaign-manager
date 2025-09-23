# NPC Management API Specification

## Overview
The NPC API provides comprehensive NPC management with AI-powered generation, personality tracking, relationship management, and dialogue history for immersive campaign experiences.

## Base URL
```
https://api.dndai.com/npcs/v1
```

## Authentication
All endpoints require a valid JWT token:
```
Authorization: Bearer <jwt_token>
```

## Common Models

### NPC Model
```json
{
  "id": "uuid",
  "name": "Toblen Stonehill",
  "campaign_id": "uuid",
  "created_by": "uuid",
  "npc_type": "friendly", // "friendly", "neutral", "hostile", "ally", "enemy", "quest_giver"
  "race": "Human",
  "gender": "Male",
  "age": 45,
  "occupation": "Innkeeper",
  "location": {
    "current": "Stonehill Inn, Phandalin",
    "typical": "Stonehill Inn",
    "movement_pattern": "stationary" // "stationary", "local", "traveling", "following_party"
  },
  "appearance": {
    "description": "A portly man with graying hair and worried eyes, constantly wiping his hands on a stained apron",
    "height": "5'8\"",
    "build": "stocky",
    "distinctive_features": [
      "Nervous hand-wringing",
      "Stained apron",
      "Worried expression"
    ],
    "clothing": "Simple innkeeper attire",
    "equipment": ["Keys to inn rooms", "Coin purse", "Bar rag"]
  },
  "personality": {
    "traits": [
      "Cautious about sharing information",
      "Gossipy but well-meaning",
      "Protective of his business and customers"
    ],
    "ideals": ["Hospitality", "Community safety"],
    "bonds": ["The Stonehill Inn", "The people of Phandalin"],
    "flaws": ["Tends to worry excessively", "Sometimes shares too much gossip"],
    "alignment": "Neutral Good",
    "mannerisms": [
      "Leans in when sharing information",
      "Glances around nervously when discussing dangers",
      "Constantly cleaning glasses or wiping surfaces"
    ],
    "speech_pattern": {
      "accent": "Local Phandalin accent",
      "vocabulary": "Common folk, simple words",
      "tone": "Warm but cautious",
      "quirks": ["Says 'aye' frequently", "Calls customers 'friend'"]
    }
  },
  "background": {
    "history": "Has run the Stonehill Inn for 15 years after inheriting it from his father",
    "family": {
      "spouse": "Trilena Stonehill",
      "children": ["Pip Stonehill (son, age 10)"],
      "parents": ["Deceased father who built the inn"],
      "siblings": []
    },
    "education": "Basic literacy, innkeeping skills",
    "notable_events": [
      "Survived goblin raid 10 years ago",
      "Helped establish Phandalin's current prosperity"
    ]
  },
  "relationships": {
    "allies": [
      {
        "name": "Sister Garaele",
        "relationship": "Friend and neighbor",
        "description": "Shrine keeper, exchanges information"
      },
      {
        "name": "Harbin Wester",
        "relationship": "Business associate",
        "description": "Townmaster, occasional customer"
      }
    ],
    "enemies": [],
    "neutral": [
      {
        "name": "Linene Graywind",
        "relationship": "Business competitor",
        "description": "Runs Lionshield Coster, friendly rivalry"
      }
    ],
    "party_relationship": {
      "status": "neutral", // "hostile", "unfriendly", "neutral", "friendly", "ally"
      "trust_level": 3, // 1-5 scale
      "first_impression": "Cautiously welcoming",
      "relationship_notes": "Provided information about goblin troubles"
    }
  },
  "capabilities": {
    "combat_stats": {
      "armor_class": 10,
      "hit_points": 4,
      "speed": 30,
      "ability_scores": {
        "strength": 10,
        "dexterity": 10,
        "constitution": 10,
        "intelligence": 12,
        "wisdom": 14,
        "charisma": 13
      },
      "skills": [
        {"name": "Insight", "bonus": 4},
        {"name": "Persuasion", "bonus": 3}
      ],
      "challenge_rating": 0
    },
    "special_abilities": [],
    "spells": [],
    "languages": ["Common"],
    "proficiencies": ["Brewer's supplies", "Vehicles (land)"]
  },
  "knowledge": {
    "secrets": [
      "Knows about secret meetings between townmaster and mysterious figures",
      "Aware of hidden passage in inn's basement"
    ],
    "rumors": [
      "Goblins have been more organized lately",
      "Strange lights seen in Tresendar Manor ruins",
      "Merchants reporting unusual goblin tactics"
    ],
    "expertise": [
      "Local geography and safe travel routes",
      "Town politics and relationships",
      "Recent events and gossip"
    ],
    "contacts": [
      "Traveling merchants who stay at inn",
      "Local farmers and craftspeople",
      "Occasional adventuring parties"
    ]
  },
  "dialogue_history": [
    {
      "session_id": "uuid",
      "session_date": "2024-01-14T19:00:00Z",
      "interactions": [
        {
          "timestamp": "2024-01-14T19:15:00Z",
          "speaker": "party",
          "content": "We need rooms for the night",
          "context": "Party arrival at inn"
        },
        {
          "timestamp": "2024-01-14T19:15:30Z",
          "speaker": "npc",
          "content": "Welcome to the Stonehill Inn, friends! Aye, I've got rooms available. Two silver per night, meals included.",
          "mood": "welcoming",
          "information_shared": ["room_rates", "meal_inclusion"]
        }
      ]
    }
  ],
  "quest_involvement": [
    {
      "quest_id": "uuid",
      "quest_name": "Find Gundren Rockseeker",
      "role": "information_source",
      "information_provided": [
        "Gundren was expected three days ago",
        "He was traveling with Lionshield Coster guards",
        "Route typically taken via Triboar Trail"
      ]
    }
  ],
  "ai_generation_metadata": {
    "generated_by_ai": true,
    "generation_prompt": "Create a worried innkeeper who knows about local troubles",
    "generation_date": "2024-01-15T10:00:00Z",
    "last_ai_update": "2024-01-15T10:30:00Z",
    "consistency_notes": "Maintain worried but helpful demeanor"
  },
  "status": {
    "current_mood": "worried", // "happy", "sad", "angry", "worried", "excited", "neutral"
    "health_status": "healthy",
    "current_activity": "running_inn",
    "availability": "always_available_at_inn"
  },
  "created_at": "2024-01-15T10:00:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

### NPC Summary Model
```json
{
  "id": "uuid",
  "name": "Toblen Stonehill",
  "campaign": {
    "id": "uuid",
    "name": "The Lost Mines of Phandelver"
  },
  "npc_type": "friendly",
  "race": "Human",
  "occupation": "Innkeeper",
  "location": "Stonehill Inn, Phandalin",
  "party_relationship": "neutral",
  "last_interaction": "2024-01-14T19:00:00Z",
  "created_at": "2024-01-15T10:00:00Z"
}
```

## Endpoints

### GET /npcs
Get list of NPCs for a campaign.

**Query Parameters:**
- `campaign_id`: Campaign UUID (required)
- `npc_type`: Filter by NPC type ("friendly", "neutral", "hostile", "ally", "enemy", "quest_giver")
- `location`: Filter by current location
- `relationship`: Filter by party relationship status
- `race`: Filter by NPC race
- `occupation`: Filter by occupation
- `limit`: Number of NPCs to return (1-50) - default: 20
- `offset`: Number of NPCs to skip - default: 0
- `sort`: Sort order ("created_desc", "updated_desc", "name_asc", "last_interaction_desc") - default: "name_asc"

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "npcs": [
      {
        "id": "uuid",
        "name": "Toblen Stonehill",
        "npc_type": "friendly",
        "race": "Human",
        "occupation": "Innkeeper",
        "location": "Stonehill Inn, Phandalin",
        "party_relationship": "neutral",
        "trust_level": 3,
        "last_interaction": "2024-01-14T19:00:00Z",
        "created_at": "2024-01-15T10:00:00Z"
      }
    ],
    "summary": {
      "total_npcs": 15,
      "by_type": {
        "friendly": 8,
        "neutral": 4,
        "hostile": 2,
        "ally": 1
      },
      "by_relationship": {
        "ally": 2,
        "friendly": 6,
        "neutral": 5,
        "unfriendly": 1,
        "hostile": 1
      }
    },
    "pagination": {
      "total": 15,
      "limit": 20,
      "offset": 0,
      "has_more": false
    }
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "request_id": "req_123456789"
}
```

### POST /npcs
Create a new NPC.

**Request Body:**
```json
{
  "name": "Toblen Stonehill",
  "campaign_id": "uuid",
  "npc_type": "friendly",
  "basic_info": {
    "race": "Human",
    "gender": "Male",
    "age": 45,
    "occupation": "Innkeeper"
  },
  "location": {
    "current": "Stonehill Inn, Phandalin",
    "typical": "Stonehill Inn"
  },
  "generation_options": {
    "use_ai_generation": true,
    "generation_prompt": "Create a worried innkeeper who knows about local goblin troubles",
    "detail_level": "full", // "basic", "standard", "full"
    "include_combat_stats": true,
    "include_relationships": true,
    "personality_depth": "complex" // "simple", "standard", "complex"
  },
  "manual_details": {
    "appearance_description": "A portly man with graying hair...",
    "personality_traits": ["Cautious", "Gossipy"],
    "background_notes": "Has run the inn for 15 years"
  }
}
```

**Validation Rules:**
- `name`: Required, 2-100 characters, unique per campaign
- `campaign_id`: Required, valid UUID, user must have GM access
- `npc_type`: Required, valid enum value
- `basic_info.race`: Required if not using AI generation
- Free users limited to 10 NPCs per campaign

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "npc": {
      // Full NPC object with AI-generated or manual details
    },
    "ai_generation_info": {
      "tokens_used": 680,
      "generation_time_ms": 3200,
      "content_quality_score": 0.91
    }
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "request_id": "req_123456789"
}
```

**Error Responses:**
- `400 Bad Request`: Validation errors
- `403 Forbidden`: NPC limit reached, not campaign GM
- `404 Not Found`: Campaign not found
- `402 Payment Required`: AI generation requires subscription

### GET /npcs/{id}
Get detailed NPC information.

**Path Parameters:**
- `id`: NPC UUID

**Query Parameters:**
- `include_dialogue_history`: Include full dialogue history (default: false)
- `include_relationships`: Include detailed relationship information (default: true)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "npc": {
      // Full NPC object
    },
    "user_permissions": [
      "view_npc",
      "edit_npc",
      "delete_npc",
      "generate_dialogue"
    ]
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "request_id": "req_123456789"
}
```

### PUT /npcs/{id}
Update NPC information.

**Path Parameters:**
- `id`: NPC UUID

**Request Body:**
```json
{
  "name": "Toblen Stonehill",
  "location": {
    "current": "Barthen's Provisions",
    "typical": "Stonehill Inn"
  },
  "personality": {
    "traits": ["Less worried after recent events"],
    "current_mood": "relieved"
  },
  "relationships": {
    "party_relationship": {
      "status": "friendly",
      "trust_level": 4,
      "relationship_notes": "Grateful for party's help with goblin problem"
    }
  },
  "knowledge": {
    "new_rumors": ["Trade routes are becoming safer"],
    "updated_secrets": []
  },
  "status": {
    "current_mood": "relieved",
    "current_activity": "celebrating_safer_roads"
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "npc": {
      // Updated NPC object
    }
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "request_id": "req_123456789"
}
```

### DELETE /npcs/{id}
Delete an NPC (soft delete).

**Path Parameters:**
- `id`: NPC UUID

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "message": "NPC successfully deleted"
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "request_id": "req_123456789"
}
```

**Error Responses:**
- `409 Conflict`: Cannot delete NPC involved in active quests

### POST /npcs/{id}/interact
Record an interaction with an NPC and update relationship.

**Path Parameters:**
- `id`: NPC UUID

**Request Body:**
```json
{
  "session_id": "uuid",
  "interaction": {
    "party_speaker": "Thorin",
    "party_message": "Tell us about the goblin troubles",
    "context": "asking_for_information",
    "party_mood": "concerned"
  },
  "npc_response": {
    "message": "Aye, the goblins have been getting bolder...",
    "mood": "worried",
    "information_shared": ["goblin_increased_activity", "missing_merchants"],
    "actions": ["leans in closer", "glances around nervously"]
  },
  "relationship_changes": {
    "trust_change": 1,
    "new_status": "friendly"
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "interaction_recorded": true,
    "updated_relationship": {
      "status": "friendly",
      "trust_level": 4,
      "relationship_notes": "Shared important information about goblins"
    },
    "npc_state_changes": {
      "mood_change": "worried_to_helpful",
      "new_knowledge_shared": 2
    }
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "request_id": "req_123456789"
}
```

### POST /npcs/{id}/generate-dialogue
Generate contextual dialogue for the NPC.

**Path Parameters:**
- `id`: NPC UUID

**Request Body:**
```json
{
  "situation": "party_asks_about_missing_merchant",
  "context": {
    "party_members": ["Thorin", "Elara"],
    "current_location": "Stonehill Inn",
    "time_of_day": "evening",
    "recent_events": ["party_defeated_goblins"],
    "party_reputation": "helpful_strangers"
  },
  "dialogue_parameters": {
    "response_length": "medium",
    "emotional_tone": "concerned_but_hopeful",
    "information_to_share": ["merchant_route", "goblin_patterns"],
    "include_actions": true
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "dialogue": {
      "spoken_text": "Aye, you've done us all a great service dealing with those goblins! Poor Gundren Rockseeker... he was supposed to arrive days ago with his mining supplies. But with you clearing out that ambush site, maybe we'll see him yet!",
      "actions": [
        "Toblen's worried expression brightens considerably",
        "He sets down a free round of ale for the party",
        "Leans forward with renewed hope in his eyes"
      ],
      "emotional_state": "hopeful",
      "body_language": "relaxed_posture",
      "voice_tone": "grateful_and_optimistic"
    },
    "information_shared": [
      "gundren_was_carrying_mining_supplies",
      "expected_arrival_timeline",
      "connection_between_party_actions_and_hope"
    ],
    "relationship_impact": {
      "trust_increase": 1,
      "status_change": "neutral_to_friendly",
      "future_interactions": "more_open_and_helpful"
    },
    "follow_up_opportunities": [
      "Ask about Gundren's usual route",
      "Inquire about mining operations",
      "Request information about other missing travelers"
    ]
  },
  "metadata": {
    "tokens_used": 320,
    "processing_time_ms": 1800,
    "consistency_score": 0.94
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "request_id": "req_123456789"
}
```

### GET /npcs/{id}/relationships
Get detailed relationship information for an NPC.

**Path Parameters:**
- `id`: NPC UUID

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "relationships": {
      "with_party": {
        "overall_status": "friendly",
        "trust_level": 4,
        "individual_relationships": [
          {
            "character_name": "Thorin",
            "relationship": "respectful",
            "notes": "Appreciates direct approach"
          }
        ],
        "relationship_history": [
          {
            "date": "2024-01-14",
            "event": "First meeting",
            "status_change": "stranger_to_neutral"
          },
          {
            "date": "2024-01-15",
            "event": "Party helped with goblin problem",
            "status_change": "neutral_to_friendly"
          }
        ]
      },
      "with_other_npcs": [
        {
          "npc_name": "Sister Garaele",
          "relationship_type": "friend",
          "description": "Long-time friend and neighbor",
          "interactions": "Regular social visits"
        }
      ],
      "faction_affiliations": [
        {
          "faction": "Phandalin Merchants",
          "role": "member",
          "standing": "good"
        }
      ]
    }
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "request_id": "req_123456789"
}
```

### POST /npcs/bulk-update
Update multiple NPCs at once (for GM efficiency).

**Request Body:**
```json
{
  "campaign_id": "uuid",
  "updates": [
    {
      "npc_id": "uuid",
      "location": {"current": "Town Square"},
      "status": {"current_mood": "excited"}
    },
    {
      "npc_id": "uuid",
      "relationships": {
        "party_relationship": {"trust_level": 5}
      }
    }
  ],
  "bulk_changes": {
    "global_event": "goblin_threat_ended",
    "mood_shift": "general_relief",
    "apply_to_all": false
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "updated_npcs": 2,
    "failed_updates": 0,
    "summary": {
      "location_changes": 1,
      "relationship_changes": 1,
      "mood_changes": 2
    }
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "request_id": "req_123456789"
}
```

## Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|---------|
| GET /npcs | 100 requests | 1 hour |
| POST /npcs | 20 requests | 1 hour |
| PUT /npcs/{id} | 100 requests | 1 hour |
| POST /npcs/{id}/generate-dialogue | 50 requests | 1 hour |
| POST /npcs/{id}/interact | 200 requests | 1 hour |

## Error Codes

| Code | Description |
|------|-------------|
| `NPC_NOT_FOUND` | NPC does not exist |
| `NPC_LIMIT_REACHED` | User has reached NPC creation limit |
| `INVALID_NPC_TYPE` | Invalid NPC type specified |
| `RELATIONSHIP_UPDATE_FAILED` | Failed to update NPC relationships |
| `DIALOGUE_GENERATION_FAILED` | AI dialogue generation failed |
| `INCONSISTENT_NPC_STATE` | NPC state conflicts with campaign |
| `ACTIVE_QUEST_CONFLICT` | Cannot modify NPC involved in active quest |

## Implementation Notes

### AI Integration
- Generate NPCs with consistent personalities and backgrounds
- Maintain dialogue consistency across interactions
- Update NPC knowledge based on campaign events
- Generate contextual responses based on party relationships

### Relationship Tracking
- Track individual party member relationships
- Update trust levels based on interactions
- Maintain relationship history for consistency
- Support faction and group relationships

### Database Requirements
- NPC table with JSONB fields for flexible personality data
- NPCInteraction table for dialogue history
- NPCRelationship table for complex relationship tracking
- Indexes on campaign_id, npc_type, location, party_relationship

### Performance Optimization
- Cache frequently accessed NPCs (5 minutes TTL)
- Bulk operations for GM efficiency
- Lazy loading of dialogue history
- Relationship calculation caching
