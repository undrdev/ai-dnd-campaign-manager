# Authentication API Specification

## Overview
The Authentication API provides secure user authentication, authorization, and session management for the D&D AI Campaign Management System.

## Base URL
```
https://api.dndai.com/auth/v1
```

## Authentication
Most endpoints require a valid JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

## Common Response Formats

### Success Response
```json
{
  "success": true,
  "data": { /* endpoint-specific data */ },
  "timestamp": "2024-01-15T10:30:00Z",
  "request_id": "req_123456789"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": "Additional error details",
    "timestamp": "2024-01-15T10:30:00Z",
    "request_id": "req_123456789",
    "path": "/auth/v1/login",
    "method": "POST",
    "validation_errors": [
      {
        "field": "email",
        "code": "INVALID_FORMAT",
        "message": "Email format is invalid"
      }
    ]
  }
}
```

## Endpoints

### POST /register
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "display_name": "John Doe",
  "role": "Player", // "Player" or "GameMaster"
  "terms_accepted": true,
  "marketing_consent": false
}
```

**Validation Rules:**
- `email`: Required, valid email format, unique
- `password`: Required, min 8 chars, must contain uppercase, lowercase, number, special char
- `display_name`: Required, 2-50 characters, alphanumeric and spaces only
- `role`: Required, enum ["Player", "GameMaster"]
- `terms_accepted`: Required, must be true

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "display_name": "John Doe",
      "role": "Player",
      "subscription_tier": "Free",
      "created_at": "2024-01-15T10:30:00Z",
      "email_verified": false
    },
    "tokens": {
      "access_token": "jwt_access_token",
      "refresh_token": "jwt_refresh_token",
      "expires_in": 3600,
      "token_type": "Bearer"
    }
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "request_id": "req_123456789"
}
```

**Error Responses:**
- `400 Bad Request`: Validation errors, email already exists
- `429 Too Many Requests`: Rate limit exceeded

### POST /login
Authenticate user with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "remember_me": true
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "display_name": "John Doe",
      "role": "Player",
      "subscription_tier": "Free",
      "last_login_at": "2024-01-15T10:30:00Z",
      "email_verified": true
    },
    "tokens": {
      "access_token": "jwt_access_token",
      "refresh_token": "jwt_refresh_token",
      "expires_in": 3600,
      "token_type": "Bearer"
    }
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "request_id": "req_123456789"
}
```

**Error Responses:**
- `400 Bad Request`: Invalid credentials, validation errors
- `401 Unauthorized`: Account locked, email not verified
- `429 Too Many Requests`: Too many failed login attempts

### POST /refresh
Refresh access token using refresh token.

**Request Body:**
```json
{
  "refresh_token": "jwt_refresh_token"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "tokens": {
      "access_token": "new_jwt_access_token",
      "refresh_token": "new_jwt_refresh_token",
      "expires_in": 3600,
      "token_type": "Bearer"
    }
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "request_id": "req_123456789"
}
```

**Error Responses:**
- `400 Bad Request`: Invalid refresh token
- `401 Unauthorized`: Refresh token expired or revoked

### POST /logout
Logout user and revoke tokens.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "refresh_token": "jwt_refresh_token"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "message": "Successfully logged out"
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "request_id": "req_123456789"
}
```

### GET /profile
Get current user profile information.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "display_name": "John Doe",
      "role": "Player",
      "subscription_tier": "Free",
      "created_at": "2024-01-15T10:30:00Z",
      "last_login_at": "2024-01-15T10:30:00Z",
      "email_verified": true,
      "preferences": {
        "theme": "dark",
        "notifications": {
          "email": true,
          "push": false,
          "in_app": true
        },
        "privacy": {
          "profile_visibility": "friends",
          "activity_sharing": false
        }
      },
      "usage_stats": {
        "campaigns_joined": 3,
        "characters_created": 5,
        "ai_requests_this_month": 45,
        "ai_requests_remaining": 155
      }
    }
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "request_id": "req_123456789"
}
```

### PUT /profile
Update user profile information.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "display_name": "John Smith",
  "preferences": {
    "theme": "light",
    "notifications": {
      "email": false,
      "push": true,
      "in_app": true
    },
    "privacy": {
      "profile_visibility": "public",
      "activity_sharing": true
    }
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "display_name": "John Smith",
      "role": "Player",
      "subscription_tier": "Free",
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T11:30:00Z",
      "preferences": {
        "theme": "light",
        "notifications": {
          "email": false,
          "push": true,
          "in_app": true
        },
        "privacy": {
          "profile_visibility": "public",
          "activity_sharing": true
        }
      }
    }
  },
  "timestamp": "2024-01-15T11:30:00Z",
  "request_id": "req_123456789"
}
```

## JWT Token Structure

### Access Token Claims
```json
{
  "sub": "user_id",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "Player",
  "subscription_tier": "Free",
  "permissions": ["view_campaign", "edit_own_character"],
  "iat": 1642248600,
  "exp": 1642252200,
  "iss": "dndai-auth",
  "aud": "dndai-api"
}
```

### Refresh Token Claims
```json
{
  "sub": "user_id",
  "type": "refresh",
  "iat": 1642248600,
  "exp": 1644840600,
  "iss": "dndai-auth",
  "aud": "dndai-api"
}
```

## Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|---------|
| POST /register | 5 requests | 1 hour |
| POST /login | 10 requests | 15 minutes |
| POST /refresh | 20 requests | 1 hour |
| GET /profile | 100 requests | 1 hour |
| PUT /profile | 10 requests | 1 hour |

## Error Codes

| Code | Description |
|------|-------------|
| `VALIDATION_FAILED` | Request validation failed |
| `EMAIL_ALREADY_EXISTS` | Email address already registered |
| `INVALID_CREDENTIALS` | Invalid email or password |
| `ACCOUNT_LOCKED` | Account temporarily locked due to failed attempts |
| `EMAIL_NOT_VERIFIED` | Email address not verified |
| `TOKEN_EXPIRED` | JWT token has expired |
| `TOKEN_INVALID` | JWT token is invalid or malformed |
| `REFRESH_TOKEN_REVOKED` | Refresh token has been revoked |
| `RATE_LIMIT_EXCEEDED` | Too many requests |
| `INSUFFICIENT_PERMISSIONS` | User lacks required permissions |

## Implementation Notes

### Security Considerations
- All passwords must be hashed using bcrypt with salt rounds ≥ 12
- JWT tokens should use RS256 algorithm with rotating keys
- Implement account lockout after 5 failed login attempts
- Rate limiting should be implemented per IP address and per user
- All endpoints must validate CSRF tokens for state-changing operations

### Database Requirements
- User table with indexes on email, created_at
- RefreshToken table for token revocation tracking
- LoginAttempt table for rate limiting and security monitoring
- UserSession table for active session tracking

### Monitoring & Logging
- Log all authentication events (login, logout, failed attempts)
- Monitor for suspicious patterns (multiple failed logins, unusual locations)
- Track token usage and refresh patterns
- Alert on security events (account lockouts, token anomalies)
