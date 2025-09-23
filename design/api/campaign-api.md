# Campaign Management API Specification

## Overview
The Campaign API provides comprehensive campaign management functionality including creation, collaboration, session tracking, and world state management.

## Base URL
```
https://api.dndai.com/campaigns/v1
```

## Authentication
All endpoints require a valid JWT token:
```
Authorization: Bearer <jwt_token>
```

## Common Models

### Campaign Model
```json
{
  "id": "uuid",
  "name": "The Lost Mines of Phandelver",
  "description": "A classic D&D adventure for new players",
  "game_master_id": "uuid",
  "status": "Active", // "Planning", "Active", "Paused", "Completed", "Archived"
  "settings": {
    "max_players": 6,
    "level_range": {
      "min": 1,
      "max": 5
    },
    "ruleset": "D&D 5e",
    "content_rating": "PG-13",
    "ai_assistance_level": "Standard", // "None", "Basic", "Standard", "Advanced"
    "house_rules": [
      "Critical hits double all damage dice",
      "Flanking grants advantage"
    ]
  },
  "world_state": {
    "current_date": "1491-09-15",
    "current_location": "Phandalin",
    "active_events": [
      {
        "id": "uuid",
        "name": "Goblin raids increasing",
        "description": "Local merchants report more frequent goblin attacks",
        "status": "ongoing"
      }
    ],
    "global_flags": {
      "sildar_rescued": true,
      "goblin_ambush_defeated": true,
      "cragmaw_hideout_discovered": false
    }
  },
  "player_count": 4,
  "session_count": 8,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-15T10:30:00Z",
  "last_played_at": "2024-01-14T19:00:00Z"
}
```

### Campaign Summary Model
```json
{
  "id": "uuid",
  "name": "The Lost Mines of Phandelver",
  "description": "A classic D&D adventure...",
  "game_master": {
    "id": "uuid",
    "display_name": "John Doe"
  },
  "status": "Active",
  "player_count": 4,
  "max_players": 6,
  "session_count": 8,
  "last_played_at": "2024-01-14T19:00:00Z",
  "created_at": "2024-01-01T00:00:00Z"
}
```

## Endpoints

### GET /campaigns
Get list of campaigns for the current user.

**Query Parameters:**
- `role`: Filter by user role in campaign ("player", "gm", "all") - default: "all"
- `status`: Filter by campaign status - default: all active statuses
- `limit`: Number of campaigns to return (1-50) - default: 20
- `offset`: Number of campaigns to skip - default: 0
- `sort`: Sort order ("created_desc", "updated_desc", "name_asc", "last_played_desc") - default: "updated_desc"

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "campaigns": [
      {
        "id": "uuid",
        "name": "The Lost Mines of Phandelver",
        "description": "A classic D&D adventure...",
        "game_master": {
          "id": "uuid",
          "display_name": "John Doe"
        },
        "status": "Active",
        "player_count": 4,
        "max_players": 6,
        "session_count": 8,
        "user_role": "player", // "player", "gm"
        "last_played_at": "2024-01-14T19:00:00Z",
        "created_at": "2024-01-01T00:00:00Z"
      }
    ],
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

### POST /campaigns
Create a new campaign.

**Request Body:**
```json
{
  "name": "The Lost Mines of Phandelver",
  "description": "A classic D&D adventure for new players exploring the town of Phandalin",
  "settings": {
    "max_players": 6,
    "level_range": {
      "min": 1,
      "max": 5
    },
    "ruleset": "D&D 5e",
    "content_rating": "PG-13",
    "ai_assistance_level": "Standard",
    "house_rules": [
      "Critical hits double all damage dice"
    ]
  },
  "world_state": {
    "current_date": "1491-09-15",
    "current_location": "Phandalin"
  },
  "template_id": "uuid" // Optional: create from template
}
```

**Validation Rules:**
- `name`: Required, 3-100 characters
- `description`: Optional, max 1000 characters
- `settings.max_players`: Required, 1-12
- `settings.level_range.min/max`: Required, 1-20, min ≤ max
- `settings.ruleset`: Required, enum ["D&D 5e", "Pathfinder", "Custom"]
- `settings.content_rating`: Required, enum ["G", "PG", "PG-13", "R"]
- `settings.ai_assistance_level`: Required, enum based on user subscription

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "campaign": {
      "id": "uuid",
      "name": "The Lost Mines of Phandelver",
      "description": "A classic D&D adventure for new players",
      "game_master_id": "uuid",
      "status": "Planning",
      "settings": {
        "max_players": 6,
        "level_range": {
          "min": 1,
          "max": 5
        },
        "ruleset": "D&D 5e",
        "content_rating": "PG-13",
        "ai_assistance_level": "Standard"
      },
      "world_state": {
        "current_date": "1491-09-15",
        "current_location": "Phandalin",
        "active_events": [],
        "global_flags": {}
      },
      "player_count": 0,
      "session_count": 0,
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "request_id": "req_123456789"
}
```

**Error Responses:**
- `400 Bad Request`: Validation errors
- `403 Forbidden`: User has reached campaign creation limit
- `402 Payment Required`: Feature requires subscription upgrade

### GET /campaigns/{id}
Get detailed campaign information.

**Path Parameters:**
- `id`: Campaign UUID

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "campaign": {
      "id": "uuid",
      "name": "The Lost Mines of Phandelver",
      "description": "A classic D&D adventure...",
      "game_master": {
        "id": "uuid",
        "display_name": "John Doe",
        "email": "john@example.com"
      },
      "status": "Active",
      "settings": {
        "max_players": 6,
        "level_range": {
          "min": 1,
          "max": 5
        },
        "ruleset": "D&D 5e",
        "content_rating": "PG-13",
        "ai_assistance_level": "Standard",
        "house_rules": [
          "Critical hits double all damage dice"
        ]
      },
      "world_state": {
        "current_date": "1491-09-15",
        "current_location": "Phandalin",
        "active_events": [
          {
            "id": "uuid",
            "name": "Goblin raids increasing",
            "description": "Local merchants report more frequent attacks",
            "status": "ongoing",
            "created_at": "2024-01-10T15:00:00Z"
          }
        ],
        "global_flags": {
          "sildar_rescued": true,
          "goblin_ambush_defeated": true
        }
      },
      "players": [
        {
          "user": {
            "id": "uuid",
            "display_name": "Alice Smith"
          },
          "joined_at": "2024-01-02T10:00:00Z",
          "role": "player",
          "status": "active"
        }
      ],
      "session_count": 8,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-15T10:30:00Z",
      "last_played_at": "2024-01-14T19:00:00Z"
    },
    "user_permissions": [
      "view_campaign",
      "edit_campaign",
      "invite_players",
      "start_session"
    ]
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "request_id": "req_123456789"
}
```

**Error Responses:**
- `404 Not Found`: Campaign does not exist
- `403 Forbidden`: User does not have access to campaign

### PUT /campaigns/{id}
Update campaign information.

**Path Parameters:**
- `id`: Campaign UUID

**Request Body:**
```json
{
  "name": "The Lost Mines of Phandelver - Updated",
  "description": "Updated description...",
  "settings": {
    "max_players": 8,
    "house_rules": [
      "Critical hits double all damage dice",
      "Flanking grants advantage"
    ]
  },
  "world_state": {
    "current_date": "1491-09-16",
    "current_location": "Cragmaw Hideout",
    "global_flags": {
      "sildar_rescued": true,
      "goblin_ambush_defeated": true,
      "cragmaw_hideout_discovered": true
    }
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "campaign": {
      // Updated campaign object
    }
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "request_id": "req_123456789"
}
```

**Error Responses:**
- `400 Bad Request`: Validation errors
- `404 Not Found`: Campaign does not exist
- `403 Forbidden`: User is not the game master

### DELETE /campaigns/{id}
Delete a campaign (soft delete).

**Path Parameters:**
- `id`: Campaign UUID

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "message": "Campaign successfully deleted"
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "request_id": "req_123456789"
}
```

**Error Responses:**
- `404 Not Found`: Campaign does not exist
- `403 Forbidden`: User is not the game master
- `409 Conflict`: Cannot delete active campaign with ongoing sessions

### POST /campaigns/{id}/invite
Invite a player to join the campaign.

**Path Parameters:**
- `id`: Campaign UUID

**Request Body:**
```json
{
  "email": "player@example.com",
  "message": "Join my D&D campaign!",
  "expires_in_hours": 168 // 7 days default
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "invitation": {
      "id": "uuid",
      "campaign_id": "uuid",
      "email": "player@example.com",
      "invited_by": {
        "id": "uuid",
        "display_name": "John Doe"
      },
      "message": "Join my D&D campaign!",
      "status": "pending",
      "expires_at": "2024-01-22T10:30:00Z",
      "created_at": "2024-01-15T10:30:00Z"
    }
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "request_id": "req_123456789"
}
```

**Error Responses:**
- `400 Bad Request`: Invalid email, campaign full
- `404 Not Found`: Campaign does not exist
- `403 Forbidden`: User cannot invite players
- `409 Conflict`: User already invited or in campaign

### GET /campaigns/{id}/players
Get list of players in the campaign.

**Path Parameters:**
- `id`: Campaign UUID

**Query Parameters:**
- `include_pending`: Include pending invitations (default: false)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "players": [
      {
        "user": {
          "id": "uuid",
          "display_name": "Alice Smith",
          "avatar_url": "https://..."
        },
        "joined_at": "2024-01-02T10:00:00Z",
        "role": "player",
        "status": "active",
        "character_count": 1
      }
    ],
    "invitations": [
      {
        "id": "uuid",
        "email": "newplayer@example.com",
        "status": "pending",
        "expires_at": "2024-01-22T10:30:00Z",
        "created_at": "2024-01-15T10:30:00Z"
      }
    ],
    "summary": {
      "active_players": 4,
      "pending_invitations": 1,
      "max_players": 6,
      "slots_available": 1
    }
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "request_id": "req_123456789"
}
```

### DELETE /campaigns/{id}/players/{user_id}
Remove a player from the campaign.

**Path Parameters:**
- `id`: Campaign UUID
- `user_id`: User UUID to remove

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "message": "Player successfully removed from campaign"
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "request_id": "req_123456789"
}
```

**Error Responses:**
- `404 Not Found`: Campaign or user not found
- `403 Forbidden`: User cannot remove players
- `409 Conflict`: Cannot remove player with active character in ongoing session

## Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|---------|
| GET /campaigns | 100 requests | 1 hour |
| POST /campaigns | 10 requests | 1 hour |
| PUT /campaigns/{id} | 50 requests | 1 hour |
| POST /campaigns/{id}/invite | 20 requests | 1 hour |

## Error Codes

| Code | Description |
|------|-------------|
| `CAMPAIGN_NOT_FOUND` | Campaign does not exist |
| `CAMPAIGN_FULL` | Campaign has reached maximum players |
| `CAMPAIGN_LIMIT_REACHED` | User has reached campaign creation limit |
| `INVALID_CAMPAIGN_STATUS` | Operation not allowed for current status |
| `PLAYER_ALREADY_INVITED` | Player already has pending invitation |
| `PLAYER_ALREADY_MEMBER` | Player is already in campaign |
| `INSUFFICIENT_SUBSCRIPTION` | Feature requires subscription upgrade |
| `ACTIVE_SESSION_CONFLICT` | Cannot perform operation during active session |

## Implementation Notes

### Business Rules
- Free users can create 1 campaign, paid users get more based on tier
- Game masters have full control over their campaigns
- Players can leave campaigns voluntarily
- Campaign deletion requires confirmation and grace period
- Active sessions prevent certain destructive operations

### Database Requirements
- Campaign table with indexes on game_master_id, status, created_at
- CampaignPlayer junction table for many-to-many relationships
- CampaignInvitation table for pending invitations
- WorldState JSONB column for flexible state storage
- Audit trail for all campaign modifications

### Caching Strategy
- Cache campaign summaries for list views (5 minutes TTL)
- Cache detailed campaign data (2 minutes TTL)
- Invalidate cache on any campaign modifications
- Use Redis for session-based real-time state
