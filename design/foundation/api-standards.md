# API Standards

## Overview
This document establishes comprehensive standards for REST API design, error handling, and response formatting across all microservices in the D&D AI Campaign Management System.

---

## REST API Conventions

### URL Structure
```
Base URL: https://api.dndai.com/v1
Service Pattern: /{service}/{version}/{resource}

Examples:
GET    /campaigns/v1/campaigns
POST   /campaigns/v1/campaigns
GET    /campaigns/v1/campaigns/{id}
PUT    /campaigns/v1/campaigns/{id}
DELETE /campaigns/v1/campaigns/{id}
PATCH  /campaigns/v1/campaigns/{id}
```

### HTTP Methods
- **GET**: Retrieve resources (idempotent, cacheable)
- **POST**: Create new resources
- **PUT**: Update entire resource (idempotent)
- **PATCH**: Partial resource update
- **DELETE**: Remove resources (idempotent)
- **HEAD**: Get headers only
- **OPTIONS**: Get allowed methods

### Resource Naming
- Use **plural nouns** for collections: `/campaigns`, `/characters`
- Use **singular nouns** for single resources: `/campaigns/{id}`
- Use **kebab-case** for multi-word resources: `/character-sheets`
- Avoid verbs in URLs (use HTTP methods instead)

### Query Parameters
```
Filtering:    ?status=active&type=oneshot
Sorting:      ?sort=created_at&order=desc
Pagination:   ?page=1&limit=20&offset=0
Fields:       ?fields=id,name,description
Search:       ?search=dragon&search_fields=name,description
```

### Versioning Strategy
- **URL Path Versioning**: `/v1/campaigns`
- **Header Versioning**: `API-Version: 1.0`
- **Accept Header**: `Accept: application/vnd.dndai.v1+json`

---

## HTTP Status Codes

### Success Codes
- **200 OK**: Successful GET, PUT, PATCH
- **201 Created**: Successful POST with resource creation
- **202 Accepted**: Async operation accepted
- **204 No Content**: Successful DELETE or PUT with no response body

### Client Error Codes
- **400 Bad Request**: Invalid request syntax or parameters
- **401 Unauthorized**: Missing or invalid authentication
- **403 Forbidden**: Valid auth but insufficient permissions
- **404 Not Found**: Resource doesn't exist
- **405 Method Not Allowed**: HTTP method not supported
- **409 Conflict**: Resource conflict (duplicate, concurrent modification)
- **422 Unprocessable Entity**: Valid syntax but semantic errors
- **429 Too Many Requests**: Rate limit exceeded

### Server Error Codes
- **500 Internal Server Error**: Generic server error
- **502 Bad Gateway**: Invalid response from upstream
- **503 Service Unavailable**: Service temporarily unavailable
- **504 Gateway Timeout**: Upstream timeout

---

## Request/Response Headers

### Standard Request Headers
```http
Content-Type: application/json
Accept: application/json
Authorization: Bearer {jwt_token}
X-Request-ID: {uuid}
X-Client-Version: 1.2.3
User-Agent: DnDAI-Mobile/1.2.3 (iOS 15.0)
```

### Standard Response Headers
```http
Content-Type: application/json; charset=utf-8
X-Request-ID: {uuid}
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
Cache-Control: no-cache, no-store, must-revalidate
```

---

## Error Handling Patterns

### Standard Error Response Format
```json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "One or more validation errors occurred.",
    "details": "The request contains invalid data.",
    "timestamp": "2024-01-15T10:30:00Z",
    "request_id": "req_123456789",
    "path": "/campaigns/v1/campaigns",
    "method": "POST",
    "validation_errors": [
      {
        "field": "name",
        "code": "REQUIRED",
        "message": "Campaign name is required."
      },
      {
        "field": "max_players",
        "code": "RANGE",
        "message": "Maximum players must be between 1 and 8."
      }
    ]
  }
}
```

### Error Code Categories
```
Business Logic Errors:
- CAMPAIGN_NOT_FOUND
- CHARACTER_ALREADY_EXISTS
- INSUFFICIENT_PERMISSIONS
- SUBSCRIPTION_EXPIRED

Validation Errors:
- VALIDATION_FAILED
- REQUIRED_FIELD_MISSING
- INVALID_FORMAT
- VALUE_OUT_OF_RANGE

System Errors:
- INTERNAL_SERVER_ERROR
- SERVICE_UNAVAILABLE
- DATABASE_CONNECTION_FAILED
- EXTERNAL_SERVICE_ERROR
```

### Exception Handling Middleware
```csharp
public class GlobalExceptionHandlingMiddleware
{
    public async Task InvokeAsync(HttpContext context, RequestDelegate next)
    {
        try
        {
            await next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private static async Task HandleExceptionAsync(HttpContext context, Exception ex)
    {
        var response = ex switch
        {
            ValidationException => CreateErrorResponse(400, "VALIDATION_FAILED", ex.Message),
            NotFoundException => CreateErrorResponse(404, "RESOURCE_NOT_FOUND", ex.Message),
            UnauthorizedException => CreateErrorResponse(401, "UNAUTHORIZED", ex.Message),
            ForbiddenException => CreateErrorResponse(403, "FORBIDDEN", ex.Message),
            ConflictException => CreateErrorResponse(409, "CONFLICT", ex.Message),
            _ => CreateErrorResponse(500, "INTERNAL_SERVER_ERROR", "An unexpected error occurred.")
        };

        context.Response.StatusCode = response.StatusCode;
        context.Response.ContentType = "application/json";
        await context.Response.WriteAsync(JsonSerializer.Serialize(response.Body));
    }
}
```

---

## Response Formatting Standards

### Success Response Format
```json
{
  "data": {
    "id": "camp_123456789",
    "name": "The Lost Mine of Phandelver",
    "description": "A classic D&D 5e adventure",
    "status": "active",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  },
  "meta": {
    "request_id": "req_123456789",
    "timestamp": "2024-01-15T10:30:00Z",
    "version": "1.0"
  }
}
```

### Collection Response Format
```json
{
  "data": [
    {
      "id": "camp_123456789",
      "name": "The Lost Mine of Phandelver"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "total_pages": 8,
    "has_next": true,
    "has_previous": false
  },
  "meta": {
    "request_id": "req_123456789",
    "timestamp": "2024-01-15T10:30:00Z",
    "version": "1.0"
  }
}
```

### Empty Collection Response
```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 0,
    "total_pages": 0,
    "has_next": false,
    "has_previous": false
  },
  "meta": {
    "request_id": "req_123456789",
    "timestamp": "2024-01-15T10:30:00Z",
    "version": "1.0"
  }
}
```

---

## Data Transfer Objects (DTOs)

### Request DTOs
```csharp
public class CreateCampaignRequest
{
    [Required]
    [StringLength(100, MinimumLength = 3)]
    public string Name { get; set; }

    [StringLength(1000)]
    public string Description { get; set; }

    [Range(1, 8)]
    public int MaxPlayers { get; set; } = 4;

    [Required]
    public CampaignType Type { get; set; }

    public List<string> Tags { get; set; } = new();
}

public class UpdateCampaignRequest
{
    [StringLength(100, MinimumLength = 3)]
    public string? Name { get; set; }

    [StringLength(1000)]
    public string? Description { get; set; }

    [Range(1, 8)]
    public int? MaxPlayers { get; set; }

    public CampaignStatus? Status { get; set; }
}
```

### Response DTOs
```csharp
public class CampaignResponse
{
    public string Id { get; set; }
    public string Name { get; set; }
    public string Description { get; set; }
    public CampaignStatus Status { get; set; }
    public int MaxPlayers { get; set; }
    public int CurrentPlayers { get; set; }
    public List<string> Tags { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public UserSummaryResponse DungeonMaster { get; set; }
}
```

---

## Authentication & Authorization

### JWT Token Format
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### API Key Authentication
```http
X-API-Key: dndai_live_sk_1234567890abcdef
```

### Rate Limiting
```
Authenticated Users:   1000 requests/hour
Anonymous Users:       100 requests/hour
Premium Users:         5000 requests/hour
```

---

## Caching Strategy

### Cache Headers
```http
# Cacheable responses
Cache-Control: public, max-age=300
ETag: "33a64df551425fcc55e4d42a148795d9f25f89d4"

# Non-cacheable responses
Cache-Control: no-cache, no-store, must-revalidate
Pragma: no-cache
```

### Conditional Requests
```http
# Client sends
If-None-Match: "33a64df551425fcc55e4d42a148795d9f25f89d4"

# Server responds
304 Not Modified (if unchanged)
200 OK (if changed)
```

---

## API Documentation

### OpenAPI/Swagger Configuration
```csharp
services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "D&D AI Campaign Manager API",
        Version = "v1",
        Description = "RESTful API for managing D&D campaigns",
        Contact = new OpenApiContact
        {
            Name = "API Support",
            Email = "api-support@dndai.com"
        }
    });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT"
    });
});
```

### Controller Documentation
```csharp
[ApiController]
[Route("api/v1/[controller]")]
[Produces("application/json")]
public class CampaignsController : ControllerBase
{
    /// <summary>
    /// Creates a new campaign
    /// </summary>
    /// <param name="request">Campaign creation details</param>
    /// <returns>Created campaign</returns>
    /// <response code="201">Campaign created successfully</response>
    /// <response code="400">Invalid request data</response>
    /// <response code="401">Unauthorized</response>
    [HttpPost]
    [ProducesResponseType(typeof(CampaignResponse), 201)]
    [ProducesResponseType(typeof(ErrorResponse), 400)]
    public async Task<IActionResult> CreateCampaign([FromBody] CreateCampaignRequest request)
    {
        // Implementation
    }
}
```

---

## Performance Standards

### Response Time Targets
- **GET requests**: < 200ms (95th percentile)
- **POST/PUT requests**: < 500ms (95th percentile)
- **Complex queries**: < 1000ms (95th percentile)

### Pagination Standards
- **Default page size**: 20 items
- **Maximum page size**: 100 items
- **Use cursor-based pagination** for large datasets

### Compression
- **Enable gzip compression** for responses > 1KB
- **Use appropriate Content-Encoding headers**

---

## Testing Standards

### API Testing Requirements
- **Unit tests** for all controllers and services
- **Integration tests** for complete API workflows
- **Contract tests** for API compatibility
- **Load tests** for performance validation

### Test Data Management
```csharp
[Fact]
public async Task CreateCampaign_ValidRequest_ReturnsCreatedCampaign()
{
    // Arrange
    var request = new CreateCampaignRequest
    {
        Name = "Test Campaign",
        Description = "Test Description",
        MaxPlayers = 4,
        Type = CampaignType.Standard
    };

    // Act
    var response = await _client.PostAsJsonAsync("/api/v1/campaigns", request);

    // Assert
    response.StatusCode.Should().Be(HttpStatusCode.Created);
    var campaign = await response.Content.ReadFromJsonAsync<CampaignResponse>();
    campaign.Name.Should().Be("Test Campaign");
}
```

This comprehensive API standards document ensures consistency, reliability, and maintainability across all microservices in the D&D AI Campaign Management System.
