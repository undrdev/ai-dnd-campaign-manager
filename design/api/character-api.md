# Character Management API Specification

## Overview
The Character API provides D&D 5e compliant character creation, management, and progression tracking with AI-assisted background generation.

## Base URL
```
https://api.dndai.com/characters/v1
```

## Authentication
All endpoints require a valid JWT token:
```
Authorization: Bearer <jwt_token>
```

## Common Models

### Character Model
```json
{
  "id": "uuid",
  "name": "Thorin Ironforge",
  "player_id": "uuid",
  "campaign_id": "uuid",
  "race": {
    "name": "Dwarf",
    "subrace": "Mountain Dwarf",
    "traits": [
      {
        "name": "Darkvision",
        "description": "You can see in dim light within 60 feet as if it were bright light"
      },
      {
        "name": "Dwarven Resilience",
        "description": "Advantage against poison saves and resistance to poison damage"
      }
    ],
    "ability_score_increases": {
      "constitution": 2,
      "strength": 2
    },
    "size": "Medium",
    "speed": 25,
    "languages": ["Common", "Dwarvish"]
  },
  "class": {
    "name": "Fighter",
    "subclass": "Champion",
    "hit_die": 10,
    "primary_ability": ["Strength", "Dexterity"],
    "saving_throw_proficiencies": ["Strength", "Constitution"],
    "skill_proficiencies": 2,
    "features": [
      {
        "name": "Fighting Style",
        "description": "Defense: +1 AC while wearing armor",
        "level_gained": 1
      },
      {
        "name": "Second Wind",
        "description": "Regain 1d10 + fighter level hit points as bonus action",
        "level_gained": 1,
        "uses_per_rest": "short"
      }
    ]
  },
  "level": 3,
  "experience_points": 900,
  "ability_scores": {
    "strength": {
      "base": 15,
      "racial_bonus": 2,
      "total": 17,
      "modifier": 3
    },
    "dexterity": {
      "base": 13,
      "racial_bonus": 0,
      "total": 13,
      "modifier": 1
    },
    "constitution": {
      "base": 14,
      "racial_bonus": 2,
      "total": 16,
      "modifier": 3
    },
    "intelligence": {
      "base": 10,
      "racial_bonus": 0,
      "total": 10,
      "modifier": 0
    },
    "wisdom": {
      "base": 12,
      "racial_bonus": 0,
      "total": 12,
      "modifier": 1
    },
    "charisma": {
      "base": 8,
      "racial_bonus": 0,
      "total": 8,
      "modifier": -1
    }
  },
  "proficiency_bonus": 2,
  "skills": [
    {
      "name": "Athletics",
      "ability": "strength",
      "proficient": true,
      "bonus": 5
    },
    {
      "name": "Intimidation",
      "ability": "charisma",
      "proficient": true,
      "bonus": 1
    }
  ],
  "background": {
    "name": "Soldier",
    "description": "You had a military career before becoming an adventurer",
    "skill_proficiencies": ["Athletics", "Intimidation"],
    "language_proficiencies": ["One of your choice"],
    "tool_proficiencies": ["One type of gaming set", "Vehicles (land)"],
    "equipment": [
      "Insignia of rank",
      "Trophy from fallen enemy",
      "Deck of cards",
      "Common clothes",
      "Belt pouch with 10 gp"
    ],
    "feature": {
      "name": "Military Rank",
      "description": "You have a military rank from your career. Soldiers loyal to your former organization still recognize your authority."
    }
  },
  "hit_points": {
    "maximum": 31,
    "current": 31,
    "temporary": 0
  },
  "armor_class": 18,
  "speed": 25,
  "equipment": [
    {
      "id": "uuid",
      "name": "Chain Mail",
      "type": "armor",
      "armor_class": 16,
      "equipped": true,
      "quantity": 1,
      "weight": 55
    },
    {
      "id": "uuid",
      "name": "Shield",
      "type": "shield",
      "armor_class_bonus": 2,
      "equipped": true,
      "quantity": 1,
      "weight": 6
    },
    {
      "id": "uuid",
      "name": "Longsword",
      "type": "weapon",
      "damage": "1d8",
      "damage_type": "slashing",
      "properties": ["versatile"],
      "equipped": true,
      "quantity": 1,
      "weight": 3
    }
  ],
  "spells": [],
  "notes": "A gruff but loyal dwarf fighter with a strong sense of honor",
  "ai_generated_background": {
    "backstory": "Born in the mountain halls of Ironpeak, Thorin served in the Dwarven Guard...",
    "personality_traits": ["I'm always ready for a fight", "I speak my mind directly"],
    "ideals": ["Honor above all else"],
    "bonds": ["My old unit is like family to me"],
    "flaws": ["I have trouble trusting outsiders"]
  },
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T11:45:00Z"
}
```

### Character Summary Model
```json
{
  "id": "uuid",
  "name": "Thorin Ironforge",
  "player": {
    "id": "uuid",
    "display_name": "Alice Smith"
  },
  "campaign": {
    "id": "uuid",
    "name": "The Lost Mines of Phandelver"
  },
  "race": "Mountain Dwarf",
  "class": "Fighter",
  "level": 3,
  "armor_class": 18,
  "hit_points": {
    "current": 31,
    "maximum": 31
  },
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T11:45:00Z"
}
```

## Endpoints

### GET /characters
Get list of characters for the current user.

**Query Parameters:**
- `campaign_id`: Filter by campaign UUID (optional)
- `level_min`: Minimum character level (optional)
- `level_max`: Maximum character level (optional)
- `class`: Filter by character class (optional)
- `race`: Filter by character race (optional)
- `limit`: Number of characters to return (1-50) - default: 20
- `offset`: Number of characters to skip - default: 0
- `sort`: Sort order ("created_desc", "updated_desc", "name_asc", "level_desc") - default: "updated_desc"

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "characters": [
      {
        "id": "uuid",
        "name": "Thorin Ironforge",
        "campaign": {
          "id": "uuid",
          "name": "The Lost Mines of Phandelver"
        },
        "race": "Mountain Dwarf",
        "class": "Fighter",
        "level": 3,
        "armor_class": 18,
        "hit_points": {
          "current": 31,
          "maximum": 31
        },
        "created_at": "2024-01-15T10:30:00Z",
        "updated_at": "2024-01-15T11:45:00Z"
      }
    ],
    "pagination": {
      "total": 5,
      "limit": 20,
      "offset": 0,
      "has_more": false
    }
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "request_id": "req_123456789"
}
```

### POST /characters
Create a new character.

**Request Body:**
```json
{
  "name": "Thorin Ironforge",
  "campaign_id": "uuid",
  "race": {
    "name": "Dwarf",
    "subrace": "Mountain Dwarf"
  },
  "class": {
    "name": "Fighter",
    "subclass": null
  },
  "background": {
    "name": "Soldier"
  },
  "ability_scores": {
    "method": "point_buy", // "point_buy", "standard_array", "rolled"
    "scores": {
      "strength": 15,
      "dexterity": 13,
      "constitution": 14,
      "intelligence": 10,
      "wisdom": 12,
      "charisma": 8
    }
  },
  "starting_equipment": {
    "method": "equipment_pack", // "equipment_pack", "gold_buy", "custom"
    "pack_name": "Fighter Pack"
  },
  "generate_ai_background": true,
  "personality_prompts": {
    "personality_trait_1": "I'm always ready for a fight",
    "ideal": "Honor above all else",
    "bond": "My old military unit",
    "flaw": "I have trouble trusting outsiders"
  }
}
```

**Validation Rules:**
- `name`: Required, 2-50 characters, unique per campaign
- `campaign_id`: Required, valid UUID, user must be member
- `race.name`: Required, valid D&D 5e race
- `race.subrace`: Optional, valid subrace for chosen race
- `class.name`: Required, valid D&D 5e class
- `ability_scores.scores`: Must total 72 for point buy, validate ranges
- Free users limited to 1 character per campaign

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "character": {
      // Full character object with calculated stats
      "id": "uuid",
      "name": "Thorin Ironforge",
      // ... complete character data
    }
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "request_id": "req_123456789"
}
```

**Error Responses:**
- `400 Bad Request`: Validation errors, invalid ability scores
- `403 Forbidden`: Character limit reached for campaign
- `404 Not Found`: Campaign not found or no access
- `409 Conflict`: Character name already exists in campaign

### GET /characters/{id}
Get detailed character information.

**Path Parameters:**
- `id`: Character UUID

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "character": {
      // Full character object
    },
    "user_permissions": [
      "view_character",
      "edit_character",
      "delete_character"
    ]
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "request_id": "req_123456789"
}
```

**Error Responses:**
- `404 Not Found`: Character does not exist
- `403 Forbidden`: User does not have access to character

### PUT /characters/{id}
Update character information.

**Path Parameters:**
- `id`: Character UUID

**Request Body:**
```json
{
  "name": "Thorin Ironforge the Bold",
  "level": 4,
  "experience_points": 2700,
  "hit_points": {
    "maximum": 38,
    "current": 35,
    "temporary": 0
  },
  "ability_scores": {
    "strength": {
      "base": 16, // ASI at level 4
      "racial_bonus": 2,
      "total": 18,
      "modifier": 4
    }
  },
  "equipment": [
    {
      "id": "uuid",
      "name": "Plate Armor",
      "type": "armor",
      "armor_class": 18,
      "equipped": true,
      "quantity": 1,
      "weight": 65
    }
  ],
  "notes": "Updated character notes..."
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "character": {
      // Updated character object
    }
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "request_id": "req_123456789"
}
```

**Error Responses:**
- `400 Bad Request`: Validation errors, invalid level progression
- `404 Not Found`: Character does not exist
- `403 Forbidden`: User cannot edit character

### DELETE /characters/{id}
Delete a character (soft delete).

**Path Parameters:**
- `id`: Character UUID

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "message": "Character successfully deleted"
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "request_id": "req_123456789"
}
```

**Error Responses:**
- `404 Not Found`: Character does not exist
- `403 Forbidden`: User cannot delete character
- `409 Conflict`: Cannot delete character in active session

### POST /characters/{id}/level-up
Level up a character with validation.

**Path Parameters:**
- `id`: Character UUID

**Request Body:**
```json
{
  "new_level": 4,
  "hit_points_gained": 7, // Rolled or average
  "ability_score_improvement": {
    "strength": 1,
    "constitution": 1
  },
  "new_features": [
    {
      "name": "Ability Score Improvement",
      "description": "Increase two ability scores by 1 each"
    }
  ],
  "spell_selections": [], // If applicable
  "skill_selections": [] // If applicable
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "character": {
      // Updated character with new level
    },
    "level_up_summary": {
      "previous_level": 3,
      "new_level": 4,
      "hit_points_gained": 7,
      "new_features": [
        "Ability Score Improvement"
      ]
    }
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "request_id": "req_123456789"
}
```

### POST /characters/{id}/generate-background
Generate AI-powered character background.

**Path Parameters:**
- `id`: Character UUID

**Request Body:**
```json
{
  "personality_prompts": {
    "personality_trait_1": "I'm always ready for a fight",
    "personality_trait_2": "I speak my mind directly",
    "ideal": "Honor above all else",
    "bond": "My old military unit is like family to me",
    "flaw": "I have trouble trusting outsiders"
  },
  "background_elements": {
    "hometown": "Ironpeak Mountains",
    "family": "Large dwarven clan",
    "motivation": "Seeking redemption for past failure"
  },
  "tone": "serious", // "serious", "humorous", "dramatic", "mysterious"
  "length": "medium" // "short", "medium", "long"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "ai_generated_background": {
      "backstory": "Born in the mountain halls of Ironpeak, Thorin served with distinction in the Dwarven Guard...",
      "personality_traits": [
        "I'm always ready for a fight",
        "I speak my mind directly, sometimes too bluntly"
      ],
      "ideals": ["Honor above all else"],
      "bonds": ["My old unit is like family to me"],
      "flaws": ["I have trouble trusting outsiders"],
      "appearance_description": "A stocky dwarf with braided beard and battle scars",
      "mannerisms": "Constantly adjusts armor straps when nervous",
      "relationships": {
        "allies": ["Captain Balin Stonebeard - former commander"],
        "enemies": ["The orc warband that ambushed his unit"],
        "family": ["Dain Ironforge - younger brother"]
      }
    },
    "token_usage": {
      "tokens_used": 450,
      "cost": 0.02
    }
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "request_id": "req_123456789"
}
```

**Error Responses:**
- `402 Payment Required`: AI usage limit exceeded
- `403 Forbidden`: User cannot use AI features

### GET /characters/validation/rules
Get D&D 5e character creation and progression rules.

**Query Parameters:**
- `race`: Get rules for specific race (optional)
- `class`: Get rules for specific class (optional)
- `level`: Get rules for specific level (optional)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "races": [
      {
        "name": "Dwarf",
        "subraces": ["Hill Dwarf", "Mountain Dwarf"],
        "ability_score_increases": {
          "constitution": 2
        },
        "traits": ["Darkvision", "Dwarven Resilience", "Stonecunning"],
        "size": "Medium",
        "speed": 25,
        "languages": ["Common", "Dwarvish"]
      }
    ],
    "classes": [
      {
        "name": "Fighter",
        "hit_die": 10,
        "primary_ability": ["Strength", "Dexterity"],
        "saving_throw_proficiencies": ["Strength", "Constitution"],
        "skill_proficiencies": {
          "count": 2,
          "options": ["Acrobatics", "Animal Handling", "Athletics", "History", "Insight", "Intimidation", "Perception", "Survival"]
        },
        "subclasses": ["Champion", "Battle Master", "Eldritch Knight"]
      }
    ],
    "ability_score_generation": {
      "point_buy": {
        "total_points": 27,
        "costs": {
          "8": 0, "9": 1, "10": 2, "11": 3, "12": 4, "13": 5,
          "14": 7, "15": 9
        }
      },
      "standard_array": [15, 14, 13, 12, 10, 8]
    }
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "request_id": "req_123456789"
}
```

## Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|---------|
| GET /characters | 100 requests | 1 hour |
| POST /characters | 20 requests | 1 hour |
| PUT /characters/{id} | 100 requests | 1 hour |
| POST /characters/{id}/generate-background | 10 requests | 1 hour |

## Error Codes

| Code | Description |
|------|-------------|
| `CHARACTER_NOT_FOUND` | Character does not exist |
| `CHARACTER_LIMIT_REACHED` | User has reached character limit for campaign |
| `INVALID_ABILITY_SCORES` | Ability scores don't meet D&D 5e rules |
| `INVALID_LEVEL_PROGRESSION` | Level up doesn't follow D&D 5e rules |
| `CHARACTER_NAME_EXISTS` | Character name already exists in campaign |
| `INVALID_EQUIPMENT` | Equipment selection violates rules |
| `AI_USAGE_EXCEEDED` | AI background generation limit reached |
| `ACTIVE_SESSION_CONFLICT` | Cannot modify character during active session |

## Implementation Notes

### D&D 5e Validation
- Validate all ability score generation methods (point buy, standard array)
- Enforce racial ability score increases and trait restrictions
- Validate class features, spell selections, and skill proficiencies
- Check equipment weight limits and proficiency requirements
- Ensure level progression follows official rules

### AI Integration
- Generate backgrounds using character race, class, and user prompts
- Maintain consistency with campaign setting and tone
- Track AI token usage for billing purposes
- Provide fallback content if AI service unavailable

### Database Requirements
- Character table with complex JSON fields for flexible D&D data
- CharacterProgression table for level-up history
- Equipment table with relationships to characters
- Validation rules stored as configuration data
- Indexes on player_id, campaign_id, level, class, race

### Caching Strategy
- Cache D&D rules data (long TTL - 1 day)
- Cache character summaries (5 minutes TTL)
- Invalidate cache on character updates
- Use Redis for session-based character state during gameplay
