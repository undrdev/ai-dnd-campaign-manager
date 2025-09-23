# Common API Models and Error Handling Specification

## Overview
This document defines shared data models, error handling patterns, and common response formats used across all APIs in the D&D AI Campaign Management System.

## Base Response Formats

### Success Response Structure
All successful API responses follow this standardized format:

```json
{
  "success": true,
  "data": {
    // Endpoint-specific response data
  },
  "metadata": {
    "timestamp": "2024-01-15T10:30:00Z",
    "request_id": "req_123456789",
    "api_version": "v1",
    "processing_time_ms": 150
  },
  "pagination": {
    // Only included for paginated responses
    "total": 100,
    "limit": 20,
    "offset": 0,
    "has_more": true,
    "next_offset": 20
  }
}
```

### Error Response Structure
All error responses follow this standardized format:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "One or more validation errors occurred.",
    "details": "The request contains invalid data that could not be processed.",
    "timestamp": "2024-01-15T10:30:00Z",
    "request_id": "req_123456789",
    "path": "/campaigns/v1/campaigns",
    "method": "POST",
    "correlation_id": "corr_987654321"
  },
  "validation_errors": [
    {
      "field": "name",
      "code": "REQUIRED",
      "message": "Campaign name is required.",
      "attempted_value": null
    },
    {
      "field": "settings.max_players",
      "code": "RANGE",
      "message": "Maximum players must be between 1 and 12.",
      "attempted_value": 15,
      "constraints": {
        "min": 1,
        "max": 12
      }
    }
  ],
  "metadata": {
    "api_version": "v1",
    "documentation_url": "https://docs.dndai.com/api/errors#VALIDATION_FAILED",
    "support_reference": "Contact support with request_id: req_123456789"
  }
}
```

## Common Data Models

### User Models

#### User Summary
```json
{
  "id": "uuid",
  "display_name": "John Doe",
  "email": "john@example.com",
  "role": "Player", // "Player", "GameMaster", "Admin"
  "avatar_url": "https://cdn.dndai.com/avatars/user_123.jpg",
  "subscription_tier": "Free", // "Free", "DungeonArchitect", "CampaignWeaver", "GuildMaster"
  "created_at": "2024-01-01T00:00:00Z",
  "last_active_at": "2024-01-15T10:30:00Z"
}
```

#### User Preferences
```json
{
  "theme": "dark", // "light", "dark", "auto"
  "notifications": {
    "email": true,
    "push": false,
    "in_app": true,
    "campaign_updates": true,
    "session_reminders": true,
    "ai_generation_complete": false
  },
  "privacy": {
    "profile_visibility": "friends", // "public", "friends", "private"
    "activity_sharing": false,
    "show_online_status": true
  },
  "gameplay": {
    "auto_roll_damage": false,
    "show_dice_animations": true,
    "confirm_destructive_actions": true,
    "default_dice_visibility": "all" // "all", "gm_only", "private"
  },
  "ai_assistance": {
    "auto_generate_descriptions": true,
    "content_rating_filter": "PG-13",
    "personality_consistency": "high", // "low", "medium", "high"
    "response_length_preference": "medium" // "brief", "medium", "detailed"
  }
}
```

### Subscription Models

#### Subscription Info
```json
{
  "tier": "DungeonArchitect",
  "status": "active", // "active", "cancelled", "expired", "trial"
  "billing_cycle": "monthly", // "monthly", "yearly"
  "current_period": {
    "start": "2024-01-01T00:00:00Z",
    "end": "2024-01-31T23:59:59Z"
  },
  "next_billing_date": "2024-02-01T00:00:00Z",
  "features": {
    "campaigns_limit": 5,
    "characters_per_campaign": 3,
    "ai_requests_per_month": 500,
    "storage_gb": 10,
    "premium_ai_models": true,
    "voice_synthesis": false,
    "api_access": false
  },
  "usage_current_period": {
    "campaigns_created": 2,
    "ai_requests_used": 145,
    "storage_used_gb": 2.3
  }
}
```

### Geographic and Location Models

#### Address
```json
{
  "street_address": "123 Main St",
  "city": "Seattle",
  "state_province": "WA",
  "postal_code": "98101",
  "country": "US",
  "timezone": "America/Los_Angeles"
}
```

#### Location Context (In-Game)
```json
{
  "name": "Stonehill Inn",
  "type": "building", // "building", "outdoor", "dungeon", "wilderness", "city", "region"
  "parent_location": "Phandalin",
  "coordinates": {
    "x": 45.5231,
    "y": -122.6765
  },
  "description": "A cozy inn with stone walls and a thatched roof",
  "notable_features": [
    "Common room with fireplace",
    "Private guest rooms upstairs",
    "Stable for horses"
  ],
  "connected_locations": [
    {
      "name": "Phandalin Town Square",
      "direction": "north",
      "distance": "2 minutes walk"
    }
  ]
}
```

### Time and Date Models

#### Game Time
```json
{
  "campaign_date": "1491-09-15",
  "time_of_day": "14:30",
  "season": "autumn",
  "weather": {
    "condition": "clear", // "clear", "cloudy", "rainy", "stormy", "snowy"
    "temperature": "mild", // "cold", "cool", "mild", "warm", "hot"
    "visibility": "good" // "poor", "limited", "good", "excellent"
  },
  "moon_phase": "waxing_gibbous",
  "special_events": [
    "Harvest Festival begins tomorrow"
  ]
}
```

#### Real Time Tracking
```json
{
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T11:45:00Z",
  "last_accessed_at": "2024-01-15T12:00:00Z",
  "timezone": "UTC",
  "user_timezone": "America/New_York"
}
```

### Audit and History Models

#### Audit Entry
```json
{
  "id": "uuid",
  "entity_type": "Campaign",
  "entity_id": "uuid",
  "action": "UPDATE", // "CREATE", "UPDATE", "DELETE", "VIEW"
  "user_id": "uuid",
  "user_name": "John Doe",
  "changes": {
    "field_name": {
      "old_value": "Old Value",
      "new_value": "New Value"
    }
  },
  "metadata": {
    "ip_address": "192.168.1.100",
    "user_agent": "Mozilla/5.0...",
    "session_id": "sess_123456",
    "api_endpoint": "/campaigns/v1/campaigns/uuid"
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### Change History
```json
{
  "entity_id": "uuid",
  "entity_type": "Character",
  "history": [
    {
      "version": 1,
      "timestamp": "2024-01-15T10:00:00Z",
      "changed_by": "uuid",
      "change_type": "level_up",
      "summary": "Leveled up from 2 to 3",
      "details": {
        "level": {"old": 2, "new": 3},
        "hit_points": {"old": 18, "new": 25},
        "features_gained": ["Second Wind improvement"]
      }
    }
  ]
}
```

### File and Media Models

#### File Reference
```json
{
  "id": "uuid",
  "filename": "character_portrait.jpg",
  "original_filename": "my_character.jpg",
  "content_type": "image/jpeg",
  "size_bytes": 245760,
  "url": "https://cdn.dndai.com/files/uuid/character_portrait.jpg",
  "thumbnail_url": "https://cdn.dndai.com/files/uuid/character_portrait_thumb.jpg",
  "upload_date": "2024-01-15T10:30:00Z",
  "uploaded_by": "uuid",
  "metadata": {
    "width": 800,
    "height": 600,
    "alt_text": "Portrait of Thorin Ironforge",
    "tags": ["character", "portrait", "dwarf"]
  }
}
```

### Dice and Random Generation Models

#### Dice Roll
```json
{
  "id": "uuid",
  "expression": "1d20+5",
  "roller": {
    "user_id": "uuid",
    "character_name": "Thorin Ironforge"
  },
  "roll_type": "attack", // "attack", "damage", "saving_throw", "ability_check", "skill_check", "custom"
  "context": {
    "ability": "strength",
    "skill": null,
    "target_ac": 15,
    "advantage": false,
    "disadvantage": false
  },
  "results": {
    "individual_rolls": [
      {
        "die_type": "d20",
        "result": 15
      }
    ],
    "modifiers": [
      {
        "source": "strength_modifier",
        "value": 3
      },
      {
        "source": "proficiency_bonus",
        "value": 2
      }
    ],
    "total": 20
  },
  "interpretation": {
    "success": true,
    "critical_hit": false,
    "critical_miss": false,
    "description": "Attack hits AC 15"
  },
  "visibility": "all", // "all", "gm_only", "private"
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Standard Error Codes

### Authentication and Authorization
| Code | HTTP Status | Description |
|------|-------------|-------------|
| `AUTH_TOKEN_MISSING` | 401 | Authorization token not provided |
| `AUTH_TOKEN_INVALID` | 401 | Authorization token is invalid or malformed |
| `AUTH_TOKEN_EXPIRED` | 401 | Authorization token has expired |
| `INSUFFICIENT_PERMISSIONS` | 403 | User lacks required permissions |
| `ACCOUNT_SUSPENDED` | 403 | User account has been suspended |
| `SUBSCRIPTION_REQUIRED` | 402 | Feature requires active subscription |

### Validation Errors
| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_FAILED` | 400 | Request validation failed |
| `REQUIRED_FIELD_MISSING` | 400 | Required field is missing |
| `INVALID_FORMAT` | 400 | Field format is invalid |
| `VALUE_OUT_OF_RANGE` | 400 | Numeric value outside allowed range |
| `INVALID_ENUM_VALUE` | 400 | Enum field has invalid value |
| `DUPLICATE_VALUE` | 409 | Value must be unique but already exists |

### Resource Errors
| Code | HTTP Status | Description |
|------|-------------|-------------|
| `RESOURCE_NOT_FOUND` | 404 | Requested resource does not exist |
| `RESOURCE_CONFLICT` | 409 | Resource state conflicts with operation |
| `RESOURCE_LOCKED` | 423 | Resource is locked by another operation |
| `PRECONDITION_FAILED` | 412 | Request preconditions not met |

### Rate Limiting
| Code | HTTP Status | Description |
|------|-------------|-------------|
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests in time window |
| `QUOTA_EXCEEDED` | 429 | Monthly/daily quota exceeded |
| `CONCURRENT_LIMIT_EXCEEDED` | 429 | Too many concurrent requests |

### System Errors
| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INTERNAL_SERVER_ERROR` | 500 | Unexpected server error occurred |
| `SERVICE_UNAVAILABLE` | 503 | Service temporarily unavailable |
| `DATABASE_ERROR` | 500 | Database operation failed |
| `EXTERNAL_SERVICE_ERROR` | 502 | External service (AI, payment) failed |
| `TIMEOUT_ERROR` | 504 | Operation timed out |

### Business Logic Errors
| Code | HTTP Status | Description |
|------|-------------|-------------|
| `CAMPAIGN_FULL` | 409 | Campaign has reached maximum players |
| `CHARACTER_LIMIT_REACHED` | 409 | User has reached character limit |
| `INVALID_GAME_STATE` | 409 | Operation invalid for current game state |
| `SESSION_EXPIRED` | 410 | Game session has expired |
| `AI_CONTENT_FILTERED` | 422 | AI-generated content was filtered |

## Pagination Models

### Pagination Request
```json
{
  "limit": 20,
  "offset": 0,
  "sort": "created_desc",
  "filter": {
    "field_name": "value",
    "date_range": {
      "start": "2024-01-01T00:00:00Z",
      "end": "2024-01-31T23:59:59Z"
    }
  }
}
```

### Pagination Response
```json
{
  "pagination": {
    "total": 150,
    "limit": 20,
    "offset": 40,
    "has_more": true,
    "has_previous": true,
    "next_offset": 60,
    "previous_offset": 20,
    "total_pages": 8,
    "current_page": 3
  }
}
```

## Search and Filter Models

### Search Request
```json
{
  "query": "goblin",
  "filters": {
    "entity_types": ["npc", "event", "location"],
    "campaign_id": "uuid",
    "date_range": {
      "start": "2024-01-01T00:00:00Z",
      "end": "2024-01-31T23:59:59Z"
    },
    "tags": ["combat", "important"]
  },
  "sort": {
    "field": "relevance",
    "direction": "desc"
  },
  "limit": 10
}
```

### Search Result
```json
{
  "id": "uuid",
  "type": "npc",
  "title": "Goblin Leader",
  "content": "A fierce goblin who leads raids on merchant caravans...",
  "relevance_score": 0.95,
  "highlights": [
    "A fierce <mark>goblin</mark> who leads raids..."
  ],
  "metadata": {
    "campaign_id": "uuid",
    "created_at": "2024-01-10T15:00:00Z",
    "tags": ["combat", "villain"],
    "location": "Cragmaw Hideout"
  }
}
```

## Validation Models

### Field Validation Rule
```json
{
  "field": "email",
  "rules": [
    {
      "type": "required",
      "message": "Email address is required"
    },
    {
      "type": "email_format",
      "message": "Please enter a valid email address"
    },
    {
      "type": "max_length",
      "value": 255,
      "message": "Email address cannot exceed 255 characters"
    }
  ]
}
```

### Validation Result
```json
{
  "is_valid": false,
  "errors": [
    {
      "field": "email",
      "code": "INVALID_FORMAT",
      "message": "Please enter a valid email address",
      "attempted_value": "not-an-email"
    }
  ]
}
```

## API Versioning

### Version Header
```
API-Version: v1
Accept-Version: v1
```

### Version in URL
```
https://api.dndai.com/campaigns/v1/campaigns
https://api.dndai.com/characters/v1/characters
```

### Deprecation Notice
```json
{
  "success": true,
  "data": { /* response data */ },
  "deprecation": {
    "deprecated": true,
    "sunset_date": "2024-06-01T00:00:00Z",
    "replacement_version": "v2",
    "migration_guide": "https://docs.dndai.com/api/migration/v1-to-v2"
  }
}
```

## Implementation Guidelines

### Error Handling Best Practices
1. **Consistent Format**: All errors use the standard error response format
2. **Meaningful Messages**: Error messages are user-friendly and actionable
3. **Proper HTTP Status Codes**: Use appropriate status codes for different error types
4. **Correlation IDs**: Include correlation IDs for tracing across services
5. **Documentation Links**: Provide links to relevant documentation

### Response Optimization
1. **Field Selection**: Support field selection to reduce payload size
2. **Compression**: Use gzip compression for large responses
3. **Caching Headers**: Include appropriate cache headers
4. **Pagination**: Always paginate large result sets
5. **Partial Updates**: Support PATCH for partial resource updates

### Security Considerations
1. **Input Sanitization**: Sanitize all input data
2. **Output Encoding**: Properly encode output to prevent XSS
3. **Rate Limiting**: Implement rate limiting on all endpoints
4. **Audit Logging**: Log all significant operations
5. **Error Information**: Don't expose sensitive information in errors
6. **Field-Level Encryption**: Encrypt Confidential and Restricted data
7. **Data Classification**: Validate data classification on all endpoints
8. **TLS 1.3 Minimum**: Require TLS 1.3 for all API communications
9. **Compliance Validation**: Validate GDPR/CCPA consent before data access
10. **Secure Key Management**: Use proper key rotation and escrow

## Data Classification and Encryption Standards

### Encryption Response Format
All API responses containing encrypted data must include encryption metadata:

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "username": "public_data",
      "email": "ENCRYPTED:AES256:eyJjaXBoZXIiOiJBRVMtMjU2LUVDQ...",
      "display_name": "public_data",
      "profile": {
        "first_name": "ENCRYPTED:AES256:eyJjaXBoZXIiOiJBRVMtMjU2LUVDQ...",
        "last_name": "ENCRYPTED:AES256:eyJjaXBoZXIiOiJBRVMtMjU2LUVDQ...",
        "bio": "ENCRYPTED:AES256:eyJjaXBoZXIiOiJBRVMtMjU2LUVDQ..."
      }
    }
  },
  "encryption_metadata": {
    "encrypted_fields": ["email", "profile.first_name", "profile.last_name", "profile.bio"],
    "key_id": "user-pii-2024-01",
    "algorithm": "AES-256-GCM",
    "classification_level": "Confidential"
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "request_id": "req_123456789"
}
```

### Data Classification Headers
APIs must include data classification in response headers:

```
X-Data-Classification: Confidential
X-Encryption-Key-Id: user-pii-2024-01
X-Encryption-Algorithm: AES-256-GCM
X-Compliance-Flags: GDPR,CCPA
```

### Secure Request Pattern
For requests containing sensitive data:

```json
{
  "data": {
    "email": "ENCRYPT_BEFORE_SEND:user@example.com",
    "first_name": "ENCRYPT_BEFORE_SEND:John"
  },
  "encryption_context": {
    "user_id": "current_user_id",
    "purpose": "profile_update",
    "data_classification": "Confidential"
  }
}
```

### Field-Level Encryption Implementation
```csharp
[HttpGet]
[RequireDataClassification(DataClassification.Confidential)]
[RequirePermission("users.view_pii")]
public async Task<IActionResult> GetUserProfile(string userId)
{
    // Implementation validates:
    // 1. User has permission to access Confidential data
    // 2. GDPR consent is valid for EU users
    // 3. Audit log entry is created
    // 4. Data is encrypted before transmission
    
    var user = await _userService.GetUserAsync(userId);
    var response = await _encryptionService.EncryptSensitiveFieldsAsync(user);
    
    return Ok(response);
}
```

### Compliance Integration Requirements
1. **GDPR Validation**: Check consent before accessing EU user data
2. **CCPA Compliance**: Respect opt-out preferences for California users
3. **COPPA Protection**: Additional verification for users under 13
4. **Audit Trail**: Log all access to classified data
5. **Right to be Forgotten**: Support secure data deletion
6. **Data Portability**: Enable encrypted data export

### Encryption Standards
- **Algorithm**: AES-256-GCM for symmetric encryption
- **Key Exchange**: RSA-4096 or ECDSA P-384
- **Key Rotation**: Automatic rotation every 90 days
- **Key Storage**: Hardware Security Module (HSM) or Azure Key Vault
- **Transport**: TLS 1.3 minimum requirement
- **At-Rest**: Database-level encryption with customer-managed keys
