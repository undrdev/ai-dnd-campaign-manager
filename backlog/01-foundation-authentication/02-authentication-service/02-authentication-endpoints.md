# Authentication API Endpoints

## Story
**As a** user  
**I want** secure authentication endpoints for registration, login, and password management  
**So that** I can create an account, sign in securely, and manage my credentials

## Acceptance Criteria
- [ ] User registration endpoint with email verification
- [ ] Login endpoint with JWT token generation
- [ ] Password reset flow implementation
- [ ] Token refresh mechanism
- [ ] Email verification endpoint
- [ ] Logout endpoint with token invalidation
- [ ] Proper error handling and validation responses

## Technical References
- **Technical Specification**: Section 2.1.1 User Management - REQ-UM-001, REQ-UM-002
- **Technical Specification**: Section 6.2 Authentication & Authorization - JWT Implementation
- **Playbook Reference**: Phase 1, Week 1, Day 3-5: Authentication Endpoints
- **Service Specification**: Auth Service - Authentication API

## Implementation Details

### API Endpoints

#### 1. User Registration
```
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "username": "player123",
  "password": "SecurePass123!",
  "confirmPassword": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "acceptTerms": true
}
```

#### 2. User Login
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "rememberMe": false
}
```

#### 3. Password Reset Request
```
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```

#### 4. Token Refresh
```
POST /api/auth/refresh-token
Content-Type: application/json

{
  "refreshToken": "refresh_token_here"
}
```

### JWT Token Configuration
```csharp
public class JwtSettings
{
    public string SecretKey { get; set; }
    public string Issuer { get; set; }
    public string Audience { get; set; }
    public int AccessTokenExpirationMinutes { get; set; } = 60;
    public int RefreshTokenExpirationDays { get; set; } = 7;
}
```

### Response Models
```csharp
public class AuthResponse
{
    public bool Success { get; set; }
    public string Message { get; set; }
    public string AccessToken { get; set; }
    public string RefreshToken { get; set; }
    public DateTime ExpiresAt { get; set; }
    public UserDto User { get; set; }
}

public class UserDto
{
    public Guid Id { get; set; }
    public string Email { get; set; }
    public string Username { get; set; }
    public string FirstName { get; set; }
    public string LastName { get; set; }
    public UserRole Role { get; set; }
    public SubscriptionTier SubscriptionTier { get; set; }
}
```

## AI Prompts for Implementation

### Primary Prompt
```
Create complete authentication API endpoints for ASP.NET Core using ASP.NET Core Identity and JWT tokens. Include user registration with email verification, login with JWT generation, password reset flow, token refresh mechanism, and proper validation. Implement proper error handling, rate limiting, and security best practices. Include request/response models and comprehensive validation.
```

### Secondary Prompts
```
Generate JWT token service with access token and refresh token generation, validation, and revocation. Include proper claims management, token expiration handling, and security best practices.

Create email service integration for user verification and password reset emails with proper templating, error handling, and delivery confirmation.

Generate comprehensive input validation for authentication endpoints using FluentValidation with proper error messages and security considerations.
```

### Validation Requirements

#### Registration Validation
- Email format and uniqueness validation
- Password strength requirements (8+ chars, mixed case, numbers, symbols)
- Username availability and format validation
- Terms acceptance validation
- Rate limiting (5 attempts per hour per IP)

#### Login Validation
- Account existence validation
- Email verification requirement
- Account lockout after failed attempts
- Rate limiting (10 attempts per hour per IP)

### Security Considerations
1. **Password Hashing**: Use ASP.NET Core Identity's default password hasher
2. **JWT Security**: Strong secret key, appropriate expiration times
3. **Rate Limiting**: Prevent brute force attacks
4. **Input Sanitization**: Prevent injection attacks
5. **HTTPS Only**: All authentication endpoints require HTTPS

## Error Handling

### Standard Error Responses
```csharp
public class ErrorResponse
{
    public string Message { get; set; }
    public string Code { get; set; }
    public Dictionary<string, string[]> Errors { get; set; }
}
```

### Error Codes
- `AUTH001`: Invalid credentials
- `AUTH002`: Account not verified
- `AUTH003`: Account locked
- `AUTH004`: Invalid token
- `AUTH005`: Token expired

## Definition of Done
- [ ] All authentication endpoints return proper responses
- [ ] JWT tokens are generated and validated correctly
- [ ] Email verification flow works end-to-end
- [ ] Password reset flow works end-to-end
- [ ] Rate limiting prevents abuse
- [ ] Validation errors are properly formatted
- [ ] Security headers are properly set
- [ ] API documentation is complete
- [ ] Unit and integration tests pass

## Dependencies
- **Depends on**: 01-user-management-domain.md, 02-setup-database-infrastructure.md
- **Integrates with**: Email service (to be implemented later)
- **Blocks**: Web application authentication integration

## Estimated Effort
**8 hours** - API endpoint implementation and testing
