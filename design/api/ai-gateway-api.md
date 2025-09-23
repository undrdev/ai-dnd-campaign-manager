# AI Gateway API Specification

## Overview
The AI Gateway API provides intelligent content generation for D&D campaigns including NPC dialogue, world-building, quest creation, and character background generation with context-aware responses.

## Base URL
```
https://api.dndai.com/ai/v1
```

## Authentication
All endpoints require a valid JWT token:
```
Authorization: Bearer <jwt_token>
```

## Common Models

### AI Request Model
```json
{
  "prompt": "Generate a mysterious tavern keeper NPC",
  "context": {
    "campaign_id": "uuid",
    "campaign_context": {
      "setting": "Forgotten Realms",
      "tone": "dark_fantasy",
      "current_location": "Phandalin",
      "active_events": ["goblin_raids_increasing"],
      "recent_history": [
        "Party defeated goblin ambush",
        "Rescued Sildar Hallwinter"
      ]
    },
    "character_context": [
      {
        "name": "Thorin",
        "class": "Fighter",
        "level": 3,
        "personality": "gruff but honorable"
      }
    ]
  },
  "parameters": {
    "max_tokens": 500,
    "temperature": 0.7,
    "model_tier": "standard" // "basic", "standard", "premium"
  },
  "content_filters": {
    "enable_safety_filter": true,
    "enable_rule_compliance": true,
    "content_rating": "PG-13"
  }
}
```

### AI Response Model
```json
{
  "id": "uuid",
  "content": {
    "text": "Generated content...",
    "structured_data": {
      // Type-specific structured response
    }
  },
  "metadata": {
    "model_used": "gpt-4",
    "tokens_used": 450,
    "processing_time_ms": 2300,
    "content_quality_score": 0.87,
    "safety_flags": [],
    "rule_compliance_flags": []
  },
  "usage_info": {
    "cost": 0.02,
    "tokens_remaining": 4550,
    "requests_remaining": 95
  },
  "created_at": "2024-01-15T10:30:00Z"
}
```

### Campaign Context Model
```json
{
  "campaign_id": "uuid",
  "setting": {
    "name": "Forgotten Realms",
    "genre": "high_fantasy",
    "tone": "heroic_adventure",
    "content_rating": "PG-13"
  },
  "world_state": {
    "current_date": "1491-09-15",
    "current_location": "Phandalin",
    "weather": "Clear autumn day",
    "time_of_day": "afternoon"
  },
  "active_elements": {
    "quests": [
      {
        "name": "Find Gundren Rockseeker",
        "status": "in_progress",
        "key_npcs": ["Sildar Hallwinter"],
        "locations": ["Goblin Ambush Site", "Cragmaw Hideout"]
      }
    ],
    "npcs": [
      {
        "name": "Sildar Hallwinter",
        "role": "Lord's Alliance Agent",
        "relationship": "ally",
        "last_interaction": "Rescued from goblins"
      }
    ],
    "events": [
      "Goblin raids on trade routes increasing",
      "Mysterious disappearances near Triboar Trail"
    ]
  },
  "party_composition": [
    {
      "name": "Thorin",
      "class": "Fighter",
      "level": 3,
      "personality_summary": "Gruff dwarf with military background"
    }
  ],
  "recent_history": [
    {
      "session_date": "2024-01-14",
      "summary": "Party defeated goblin ambush, rescued Sildar",
      "key_events": ["combat_victory", "npc_rescue"],
      "decisions_made": ["chose_to_help_sildar", "decided_to_track_goblins"]
    }
  ]
}
```

## Content Generation Endpoints

### POST /generate/npc
Generate an NPC with personality, background, and dialogue capabilities.

**Request Body:**
```json
{
  "prompt": "Create a mysterious tavern keeper who knows about the goblin raids",
  "npc_type": "tavern_keeper", // "merchant", "guard", "noble", "commoner", "villain", "ally"
  "context": {
    "campaign_id": "uuid",
    "location": "Stonehill Inn, Phandalin",
    "role_in_story": "information_source",
    "relationship_to_party": "neutral"
  },
  "parameters": {
    "detail_level": "full", // "brief", "standard", "full"
    "include_stats": true,
    "include_dialogue_examples": true,
    "personality_depth": "complex" // "simple", "standard", "complex"
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "npc": {
      "name": "Toblen Stonehill",
      "race": "Human",
      "gender": "Male",
      "age": 45,
      "occupation": "Innkeeper",
      "appearance": {
        "description": "A portly man with graying hair and worried eyes, constantly wiping his hands on a stained apron",
        "distinctive_features": ["Nervous hand-wringing", "Speaks in hushed tones about recent events"]
      },
      "personality": {
        "traits": ["Cautious", "Gossipy", "Protective of his business"],
        "mannerisms": ["Leans in when sharing information", "Glances around nervously"],
        "speech_pattern": "Speaks quietly with local accent",
        "motivations": ["Keep his inn safe", "Maintain good relationships with everyone"],
        "fears": ["Goblin attacks on his inn", "Losing customers"]
      },
      "background": {
        "history": "Has run the Stonehill Inn for 15 years, knows everyone in town",
        "connections": ["Sister Garaele (shrine keeper)", "Harbin Wester (townmaster)"],
        "secrets": ["Knows about secret meetings between townmaster and mysterious hooded figures"],
        "resources": ["Information network", "Safe place to stay", "Local contacts"]
      },
      "dialogue_examples": [
        {
          "situation": "greeting_new_customers",
          "dialogue": "Welcome to the Stonehill Inn! Though I must warn you, these are troubled times. The roads aren't safe like they used to be."
        },
        {
          "situation": "asked_about_goblin_raids",
          "dialogue": "Aye, the goblins have been getting bolder. Poor Gundren Rockseeker... we haven't seen him for days. His escort never made it to town either."
        }
      ],
      "stats": {
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
        "skills": ["Insight +4", "Persuasion +3"],
        "challenge_rating": 0
      }
    },
    "integration_notes": {
      "plot_hooks": [
        "Can provide information about missing merchants",
        "Offers safe place to rest and plan",
        "Connects party with other important NPCs"
      ],
      "roleplay_tips": [
        "Speak quietly when sharing sensitive information",
        "Show concern for the party's safety",
        "Offer practical help (rooms, meals, local knowledge)"
      ]
    }
  },
  "metadata": {
    "tokens_used": 680,
    "processing_time_ms": 3200,
    "content_quality_score": 0.91
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "request_id": "req_123456789"
}
```

### POST /generate/dialogue
Generate contextual dialogue for existing NPCs.

**Request Body:**
```json
{
  "npc_id": "uuid",
  "situation": "party_asks_about_missing_merchant",
  "context": {
    "campaign_id": "uuid",
    "party_members": ["Thorin", "Elara", "Finn"],
    "previous_interactions": [
      "Party stayed at inn last night",
      "Innkeeper warned about road dangers"
    ],
    "current_mood": "worried",
    "time_of_day": "morning"
  },
  "dialogue_type": "information_sharing", // "greeting", "information_sharing", "negotiation", "combat_taunt", "farewell"
  "parameters": {
    "response_length": "medium", // "brief", "medium", "extended"
    "include_actions": true,
    "emotional_tone": "concerned"
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "dialogue": {
      "spoken_text": "Aye, Gundren Rockseeker... good dwarf, that one. He was supposed to arrive three days ago with his wagon full of mining supplies. His guards, the Lionshield Coster boys, they never showed up either. I fear the worst, I do.",
      "actions": [
        "Toblen wrings his hands nervously",
        "He glances toward the door as if expecting trouble",
        "Leans closer and lowers his voice"
      ],
      "emotional_state": "worried",
      "information_revealed": [
        "Gundren was carrying mining supplies",
        "He had Lionshield Coster guards",
        "They're three days overdue"
      ],
      "follow_up_opportunities": [
        "Ask about the route Gundren was taking",
        "Inquire about other missing travelers",
        "Request directions to where Gundren might be"
      ]
    },
    "context_updates": {
      "npc_mood": "increasingly worried",
      "relationship_change": "slightly more trusting",
      "information_shared": ["gundren_details", "guard_company"]
    }
  },
  "metadata": {
    "tokens_used": 320,
    "processing_time_ms": 1800
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "request_id": "req_123456789"
}
```

### POST /generate/world-content
Generate world-building content like locations, events, and lore.

**Request Body:**
```json
{
  "content_type": "location", // "location", "event", "lore", "organization", "item"
  "prompt": "Create a mysterious ancient ruin near Phandalin",
  "context": {
    "campaign_id": "uuid",
    "region": "Sword Coast",
    "proximity_to_party": "1_day_travel",
    "discovery_method": "local_rumors"
  },
  "parameters": {
    "detail_level": "full",
    "include_maps": false,
    "include_encounters": true,
    "difficulty_level": "appropriate_for_level_3"
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "location": {
      "name": "The Sundered Tower",
      "type": "ancient_ruin",
      "description": "A crumbling stone tower that once served as a wizard's observatory, now partially collapsed and overgrown with thorny vines. Strange blue lights occasionally flicker in the upper windows on moonless nights.",
      "history": "Built 300 years ago by the wizard Aldric Moonwhisper, who studied celestial magic. Abandoned after a magical experiment went wrong, causing the tower to partially collapse.",
      "current_state": "Dangerous but explorable",
      "notable_features": [
        "Collapsed eastern wall revealing interior chambers",
        "Intact spiral staircase leading to upper floors",
        "Basement laboratory with active magical circles",
        "Observatory dome with damaged but functional telescope"
      ],
      "inhabitants": [
        "2-3 Stirges (nest in the rafters)",
        "1 Ochre Jelly (in the basement)",
        "Spectral presence of Aldric (non-hostile, information source)"
      ],
      "treasures": [
        "Spell scrolls hidden in secret compartment",
        "Potion of Healing in alchemical supplies",
        "Star Chart (valuable to scholars)",
        "Moonstone worth 50 gp"
      ],
      "plot_connections": [
        "Star charts might reveal location of other ruins",
        "Aldric's spirit knows about ancient threats",
        "Connection to larger magical mystery in region"
      ]
    },
    "encounters": [
      {
        "name": "Stirge Nest",
        "location": "Upper floor rafters",
        "difficulty": "Easy",
        "description": "3 stirges attack when party disturbs their nest",
        "tactical_notes": "Stirges have advantage in dim light"
      }
    ],
    "rumors": [
      "Local farmers avoid the area after dark",
      "Blue lights seen dancing in the ruins",
      "Old wizard's ghost still guards his treasures"
    ]
  },
  "metadata": {
    "tokens_used": 520,
    "processing_time_ms": 2800
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "request_id": "req_123456789"
}
```

### POST /generate/quest
Generate quest content with objectives, NPCs, and rewards.

**Request Body:**
```json
{
  "quest_type": "investigation", // "combat", "exploration", "social", "investigation", "rescue"
  "prompt": "Create a mystery involving disappearing livestock near Phandalin",
  "context": {
    "campaign_id": "uuid",
    "party_level": 3,
    "estimated_sessions": 2,
    "connection_to_main_plot": "minor_side_quest"
  },
  "parameters": {
    "include_npcs": true,
    "include_locations": true,
    "include_encounters": true,
    "difficulty": "moderate"
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "quest": {
      "name": "The Beast of Barthen's Fields",
      "type": "investigation",
      "summary": "Livestock have been mysteriously disappearing from farms around Phandalin. The party must investigate the disappearances and deal with the threat.",
      "hook": "Elmar Barthen approaches the party, desperate for help after losing half his livestock to a mysterious predator.",
      "objectives": [
        {
          "description": "Investigate the missing livestock reports",
          "type": "investigation",
          "completion_criteria": "Gather clues from 3 affected farms"
        },
        {
          "description": "Track the creature to its lair",
          "type": "exploration",
          "completion_criteria": "Follow tracks to the creature's den"
        },
        {
          "description": "Confront the beast",
          "type": "combat",
          "completion_criteria": "Defeat or drive off the owlbear"
        }
      ],
      "key_npcs": [
        {
          "name": "Elmar Barthen",
          "role": "Quest giver",
          "description": "Worried merchant whose livestock are being taken",
          "location": "Barthen's Provisions"
        },
        {
          "name": "Old Martha",
          "role": "Witness",
          "description": "Elderly farmer who saw the creature",
          "information": "Describes large, bear-like creature with owl features"
        }
      ],
      "locations": [
        {
          "name": "Barthen's Farm",
          "description": "Well-maintained farm with obvious signs of struggle",
          "clues": ["Large claw marks", "Tufts of brown feathers", "Disturbed ground"]
        },
        {
          "name": "Forest Den",
          "description": "Natural cave in hillside, littered with bones",
          "encounter": "Owlbear lair with 2 cubs"
        }
      ],
      "encounters": [
        {
          "name": "Owlbear Mother",
          "type": "combat",
          "difficulty": "Hard",
          "notes": "Protecting cubs, may retreat if reduced to 1/4 health"
        }
      ],
      "rewards": {
        "experience": 900,
        "gold": 150,
        "items": ["Potion of Animal Friendship"],
        "reputation": "+1 with Phandalin merchants"
      },
      "complications": [
        "Owlbear has cubs - party must decide their fate",
        "Creature was driven from deeper forest by something worse",
        "Farmer offers to adopt cubs if spared"
      ]
    }
  },
  "metadata": {
    "tokens_used": 720,
    "processing_time_ms": 3500
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "request_id": "req_123456789"
}
```

## Context Management Endpoints

### GET /context/{campaign_id}
Retrieve current campaign context for AI generation.

**Path Parameters:**
- `campaign_id`: Campaign UUID

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "context": {
      // Campaign context object
    },
    "context_summary": {
      "total_npcs": 15,
      "active_quests": 3,
      "recent_events": 8,
      "party_level_range": "3-4",
      "last_updated": "2024-01-15T10:30:00Z"
    }
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "request_id": "req_123456789"
}
```

### POST /context/search
Search campaign knowledge base for relevant context.

**Request Body:**
```json
{
  "campaign_id": "uuid",
  "query": "information about goblin raids",
  "search_types": ["npcs", "events", "locations", "items"],
  "max_results": 10,
  "relevance_threshold": 0.7
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "type": "event",
        "title": "Goblin Ambush on Triboar Trail",
        "content": "Party was ambushed by goblins while escorting supplies...",
        "relevance_score": 0.95,
        "related_entities": ["Sildar Hallwinter", "Gundren Rockseeker"]
      }
    ],
    "search_metadata": {
      "query_processed": "goblin raids attacks",
      "total_matches": 5,
      "search_time_ms": 150
    }
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "request_id": "req_123456789"
}
```

## Usage and Billing Endpoints

### GET /usage
Get current AI usage statistics for the user.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "current_period": {
      "start_date": "2024-01-01T00:00:00Z",
      "end_date": "2024-01-31T23:59:59Z",
      "requests_made": 145,
      "requests_limit": 500,
      "tokens_used": 45000,
      "tokens_limit": 100000,
      "cost_incurred": 12.50,
      "cost_limit": 50.00
    },
    "by_feature": {
      "npc_generation": {
        "requests": 45,
        "tokens": 15000,
        "cost": 5.25
      },
      "dialogue_generation": {
        "requests": 78,
        "tokens": 18000,
        "cost": 4.50
      },
      "world_content": {
        "requests": 22,
        "tokens": 12000,
        "cost": 2.75
      }
    },
    "subscription_info": {
      "tier": "DungeonArchitect",
      "renewal_date": "2024-02-01T00:00:00Z",
      "upgrade_available": true
    }
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "request_id": "req_123456789"
}
```

## Rate Limiting

| Endpoint | Basic Tier | Standard Tier | Premium Tier |
|----------|------------|---------------|--------------|
| POST /generate/npc | 10/hour | 50/hour | 200/hour |
| POST /generate/dialogue | 30/hour | 150/hour | 500/hour |
| POST /generate/world-content | 5/hour | 25/hour | 100/hour |
| POST /generate/quest | 3/hour | 15/hour | 50/hour |

## Error Codes

| Code | Description |
|------|-------------|
| `AI_USAGE_EXCEEDED` | User has exceeded AI usage limits |
| `CONTENT_FILTERED` | Generated content was filtered for safety |
| `CONTEXT_TOO_LARGE` | Campaign context exceeds token limits |
| `INVALID_PROMPT` | Prompt contains invalid or dangerous content |
| `MODEL_UNAVAILABLE` | Requested AI model is temporarily unavailable |
| `GENERATION_FAILED` | AI generation failed after retries |
| `INSUFFICIENT_SUBSCRIPTION` | Feature requires subscription upgrade |

## Implementation Notes

### Content Safety
- All generated content passes through safety filters
- Rule compliance checking for D&D 5e accuracy
- Content rating enforcement based on campaign settings
- Automatic retry with modified prompts if content is filtered

### Context Management
- Campaign context is automatically updated from game events
- Vector embeddings for semantic search of campaign knowledge
- Context compression for large campaigns to fit token limits
- Relevance scoring for context inclusion

### Performance Optimization
- Response caching for similar prompts and contexts
- Async processing for long-running generation tasks
- Model selection based on complexity and subscription tier
- Fallback models if primary AI service unavailable

### Usage Tracking
- Token usage tracking for accurate billing
- Request rate limiting per subscription tier
- Cost estimation before generation
- Usage analytics for optimization
