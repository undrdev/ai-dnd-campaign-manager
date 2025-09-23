# Setup API Gateway with YARP

## Story
**As a** developer  
**I want** a properly configured API Gateway using YARP (Yet Another Reverse Proxy)  
**So that** I can route requests to microservices, implement rate limiting, and enforce security policies

## Acceptance Criteria
- [ ] YARP API Gateway configured and running
- [ ] Route configuration for all planned microservices
- [ ] Rate limiting implemented per user/IP
- [ ] Security policies configured (CORS, headers)
- [ ] Service discovery setup for local development
- [ ] Health check aggregation implemented
- [ ] Request/response logging configured

## Technical References
- **Technical Specification**: Section 3.1 High-Level Architecture - API Gateway Layer
- **Technical Specification**: Section 6.1 Security Architecture - API Gateway Security
- **Playbook Reference**: Phase 1, Week 1, Day 1-2: API Gateway Setup
- **Performance Requirements**: REQ-PERF-002 - Support 100+ concurrent sessions

## Implementation Details

### YARP Configuration Structure
```json
{
  "ReverseProxy": {
    "Routes": {
      "auth-route": {
        "ClusterId": "auth-cluster",
        "Match": {
          "Path": "/api/auth/{**catch-all}"
        }
      },
      "campaign-route": {
        "ClusterId": "campaign-cluster", 
        "Match": {
          "Path": "/api/campaigns/{**catch-all}"
        }
      }
    },
    "Clusters": {
      "auth-cluster": {
        "Destinations": {
          "destination1": {
            "Address": "http://auth-service:80/"
          }
        }
      }
    }
  }
}
```

### Security Policies
- **CORS**: Configured for web and mobile origins
- **Rate Limiting**: 1000 requests per hour per user
- **Security Headers**: HSTS, CSP, X-Frame-Options
- **Authentication**: JWT token validation

### Service Routes
1. **Auth Service**: `/api/auth/*`
2. **Campaign Service**: `/api/campaigns/*`
3. **Character Service**: `/api/characters/*`
4. **AI Gateway Service**: `/api/ai/*`
5. **Notification Service**: `/api/notifications/*`

## AI Prompts for Implementation

### Primary Prompt
```
Create a YARP (Yet Another Reverse Proxy) API Gateway configuration for a microservices architecture with routes for Auth, Campaign, Character, AIGateway, and Notification services. Include rate limiting, CORS configuration, security headers, JWT authentication middleware, and health check aggregation. Configure proper request/response logging and error handling.
```

### Secondary Prompts
```
Generate rate limiting policies for API Gateway that implement per-user quotas, IP-based limiting, and subscription tier-based rate limits with proper error responses.

Create API Gateway middleware for JWT token validation, request logging, error handling, and security header injection with proper dependency injection setup.

Generate health check configuration that aggregates health status from all downstream services with circuit breaker patterns and proper monitoring.
```

## Middleware Pipeline Configuration
```csharp
// Example middleware pipeline
app.UseRouting();
app.UseCors("AllowSpecificOrigins");
app.UseAuthentication();
app.UseAuthorization();
app.UseRateLimiter();
app.MapReverseProxy();
```

## Rate Limiting Configuration
- **Anonymous Users**: 100 requests/hour
- **Authenticated Users**: 1000 requests/hour  
- **Premium Users**: 5000 requests/hour
- **AI Endpoints**: Subscription-based limits

## Definition of Done
- [ ] API Gateway starts and accepts requests
- [ ] All service routes are properly configured
- [ ] Rate limiting blocks excessive requests
- [ ] CORS allows legitimate cross-origin requests
- [ ] JWT tokens are properly validated
- [ ] Health checks aggregate service status
- [ ] Request/response logging captures necessary data
- [ ] Security headers are properly set

## Dependencies
- **Depends on**: 01-setup-dotnet-solution.md
- **Integrates with**: All microservice implementations

## Estimated Effort
**4 hours** - API Gateway configuration and testing
