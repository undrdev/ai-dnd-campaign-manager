# Campaign API Endpoints Implementation

## Story
**As a** Game Master or Player  
**I want** RESTful API endpoints for campaign management  
**So that** I can create, manage, and participate in D&D campaigns through the web and mobile applications

## Acceptance Criteria
- [ ] Campaign CRUD endpoints with proper authorization
- [ ] Player invitation and management endpoints
- [ ] Session scheduling endpoints
- [ ] World state management endpoints
- [ ] Campaign search and filtering capabilities
- [ ] Proper HTTP status codes and error responses
- [ ] OpenAPI documentation generated
- [ ] Rate limiting and security headers configured

## Technical References
- **Technical Specification**: Section 2.1.2 Campaign Management - API Requirements
- **Service Specification**: Campaign Service - API Endpoints
- **API Specification**: Campaign API Contract
- **Playbook Reference**: Phase 2, Week 3, Day 1-3: Campaign API

## Implementation Details

### Campaign Controller
```csharp
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CampaignsController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ILogger<CampaignsController> _logger;

    public CampaignsController(IMediator mediator, ILogger<CampaignsController> logger)
    {
        _mediator = mediator;
        _logger = logger;
    }

    /// <summary>
    /// Create a new campaign
    /// </summary>
    [HttpPost]
    [Authorize(Policy = "RequireGameMasterRole")]
    [ProducesResponseType(typeof(CreateCampaignResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ValidationErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status429TooManyRequests)]
    public async Task<IActionResult> CreateCampaign([FromBody] CreateCampaignRequest request)
    {
        var command = new CreateCampaignCommand
        {
            Name = request.Name,
            Description = request.Description,
            GameMasterId = User.GetUserId(),
            Settings = request.Settings,
            TemplateId = request.TemplateId
        };

        var response = await _mediator.Send(command);

        return CreatedAtAction(
            nameof(GetCampaign),
            new { id = response.CampaignId },
            response);
    }

    /// <summary>
    /// Get campaign by ID
    /// </summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(CampaignDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetCampaign(Guid id)
    {
        var query = new GetCampaignQuery
        {
            CampaignId = id,
            UserId = User.GetUserId()
        };

        var campaign = await _mediator.Send(query);
        return Ok(campaign);
    }

    /// <summary>
    /// Get user's campaigns with filtering and pagination
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<CampaignSummaryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetUserCampaigns(
        [FromQuery] CampaignStatus? status = null,
        [FromQuery] string search = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var query = new GetUserCampaignsQuery
        {
            UserId = User.GetUserId(),
            Status = status,
            SearchTerm = search,
            Page = page,
            PageSize = Math.Min(pageSize, 100) // Limit page size
        };

        var campaigns = await _mediator.Send(query);
        return Ok(campaigns);
    }

    /// <summary>
    /// Update campaign details
    /// </summary>
    [HttpPut("{id:guid}")]
    [Authorize(Policy = "RequireGameMasterRole")]
    [ProducesResponseType(typeof(CampaignDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> UpdateCampaign(Guid id, [FromBody] UpdateCampaignRequest request)
    {
        var command = new UpdateCampaignCommand
        {
            CampaignId = id,
            GameMasterId = User.GetUserId(),
            Name = request.Name,
            Description = request.Description,
            Settings = request.Settings
        };

        var response = await _mediator.Send(command);
        return Ok(response);
    }

    /// <summary>
    /// Delete campaign
    /// </summary>
    [HttpDelete("{id:guid}")]
    [Authorize(Policy = "RequireGameMasterRole")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> DeleteCampaign(Guid id)
    {
        var command = new DeleteCampaignCommand
        {
            CampaignId = id,
            GameMasterId = User.GetUserId()
        };

        await _mediator.Send(command);
        return NoContent();
    }

    /// <summary>
    /// Invite player to campaign
    /// </summary>
    [HttpPost("{id:guid}/invitations")]
    [Authorize(Policy = "RequireGameMasterRole")]
    [ProducesResponseType(typeof(InvitePlayerResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> InvitePlayer(Guid id, [FromBody] InvitePlayerRequest request)
    {
        var command = new InvitePlayerCommand
        {
            CampaignId = id,
            GameMasterId = User.GetUserId(),
            PlayerEmail = request.Email,
            Role = request.Role,
            PersonalMessage = request.PersonalMessage
        };

        var response = await _mediator.Send(command);
        return CreatedAtAction(nameof(GetCampaignInvitations), new { id }, response);
    }

    /// <summary>
    /// Get campaign invitations
    /// </summary>
    [HttpGet("{id:guid}/invitations")]
    [Authorize(Policy = "RequireGameMasterRole")]
    [ProducesResponseType(typeof(List<CampaignInvitationDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetCampaignInvitations(Guid id)
    {
        var query = new GetCampaignInvitationsQuery
        {
            CampaignId = id,
            GameMasterId = User.GetUserId()
        };

        var invitations = await _mediator.Send(query);
        return Ok(invitations);
    }

    /// <summary>
    /// Accept campaign invitation
    /// </summary>
    [HttpPost("invitations/{invitationId:guid}/accept")]
    [ProducesResponseType(typeof(AcceptInvitationResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> AcceptInvitation(Guid invitationId)
    {
        var command = new AcceptInvitationCommand
        {
            InvitationId = invitationId,
            PlayerId = User.GetUserId()
        };

        var response = await _mediator.Send(command);
        return Ok(response);
    }

    /// <summary>
    /// Schedule a game session
    /// </summary>
    [HttpPost("{id:guid}/sessions")]
    [Authorize(Policy = "RequireGameMasterRole")]
    [ProducesResponseType(typeof(ScheduleSessionResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ScheduleSession(Guid id, [FromBody] ScheduleSessionRequest request)
    {
        var command = new ScheduleSessionCommand
        {
            CampaignId = id,
            GameMasterId = User.GetUserId(),
            ScheduledFor = request.ScheduledFor,
            Duration = request.Duration,
            Notes = request.Notes
        };

        var response = await _mediator.Send(command);
        return CreatedAtAction(nameof(GetCampaignSessions), new { id }, response);
    }

    /// <summary>
    /// Get campaign sessions
    /// </summary>
    [HttpGet("{id:guid}/sessions")]
    [ProducesResponseType(typeof(List<GameSessionDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetCampaignSessions(Guid id)
    {
        var query = new GetCampaignSessionsQuery
        {
            CampaignId = id,
            UserId = User.GetUserId()
        };

        var sessions = await _mediator.Send(query);
        return Ok(sessions);
    }

    /// <summary>
    /// Update world state
    /// </summary>
    [HttpPut("{id:guid}/world-state")]
    [Authorize(Policy = "RequireGameMasterRole")]
    [ProducesResponseType(typeof(WorldStateDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> UpdateWorldState(Guid id, [FromBody] UpdateWorldStateRequest request)
    {
        var command = new UpdateWorldStateCommand
        {
            CampaignId = id,
            GameMasterId = User.GetUserId(),
            GameTime = request.GameTime,
            CurrentLocation = request.CurrentLocation,
            Weather = request.Weather,
            Events = request.Events
        };

        var response = await _mediator.Send(command);
        return Ok(response);
    }
}
```

### Request/Response Models
```csharp
public class CreateCampaignRequest
{
    [Required]
    [StringLength(100, MinimumLength = 3)]
    public string Name { get; set; }

    [StringLength(1000)]
    public string Description { get; set; }

    [Required]
    public CampaignSettingsDto Settings { get; set; }

    public string TemplateId { get; set; }
}

public class CampaignSettingsDto
{
    [Range(1, 8)]
    public int MaxPlayers { get; set; } = 6;

    [Range(1, 20)]
    public int StartingLevel { get; set; } = 1;

    public bool IsPublic { get; set; } = false;
    public DifficultyLevel Difficulty { get; set; } = DifficultyLevel.Medium;
    public PlayStyle PlayStyle { get; set; } = PlayStyle.Balanced;
    public bool AllowMulticlassing { get; set; } = true;
    public List<string> AllowedRaces { get; set; } = new();
    public List<string> AllowedClasses { get; set; } = new();
}

public class InvitePlayerRequest
{
    [Required]
    [EmailAddress]
    public string Email { get; set; }

    [Required]
    public PlayerRole Role { get; set; } = PlayerRole.Player;

    [StringLength(500)]
    public string PersonalMessage { get; set; }
}

public class ScheduleSessionRequest
{
    [Required]
    public DateTime ScheduledFor { get; set; }

    [Required]
    [Range(typeof(TimeSpan), "00:30:00", "08:00:00")]
    public TimeSpan Duration { get; set; }

    [StringLength(1000)]
    public string Notes { get; set; }
}
```

## AI Prompts for Implementation

### Primary Prompt
```
Create comprehensive REST API endpoints for D&D campaign management using ASP.NET Core. Include CRUD operations for campaigns, player invitation system, session scheduling, and world state management. Implement proper authorization with role-based access control, input validation, error handling, and OpenAPI documentation. Use MediatR for CQRS pattern and include rate limiting and security headers.
```

### Secondary Prompts
```
Generate campaign controller with RESTful endpoints including proper HTTP status codes, request/response models, and comprehensive error handling. Include authorization policies and input validation.

Create request/response DTOs for campaign management with proper validation attributes and documentation comments for OpenAPI generation.

Generate error handling middleware and custom exception types for campaign management with proper HTTP status code mapping and user-friendly error messages.
```

### Error Handling Middleware
```csharp
public class CampaignExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<CampaignExceptionHandlingMiddleware> _logger;

    public CampaignExceptionHandlingMiddleware(RequestDelegate next, ILogger<CampaignExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/json";

        var response = new ErrorResponse();

        switch (exception)
        {
            case NotFoundException notFoundEx:
                context.Response.StatusCode = StatusCodes.Status404NotFound;
                response.Message = notFoundEx.Message;
                response.Code = "CAMPAIGN_NOT_FOUND";
                break;

            case UnauthorizedException unauthorizedEx:
                context.Response.StatusCode = StatusCodes.Status403Forbidden;
                response.Message = unauthorizedEx.Message;
                response.Code = "ACCESS_DENIED";
                break;

            case ValidationException validationEx:
                context.Response.StatusCode = StatusCodes.Status400BadRequest;
                response.Message = "Validation failed";
                response.Code = "VALIDATION_ERROR";
                response.Errors = validationEx.Errors.ToDictionary(
                    kvp => kvp.Key,
                    kvp => kvp.Value.ToArray());
                break;

            case SubscriptionLimitException subscriptionEx:
                context.Response.StatusCode = StatusCodes.Status402PaymentRequired;
                response.Message = subscriptionEx.Message;
                response.Code = "SUBSCRIPTION_LIMIT_EXCEEDED";
                break;

            default:
                context.Response.StatusCode = StatusCodes.Status500InternalServerError;
                response.Message = "An internal server error occurred";
                response.Code = "INTERNAL_SERVER_ERROR";
                _logger.LogError(exception, "Unhandled exception occurred");
                break;
        }

        var jsonResponse = JsonSerializer.Serialize(response);
        await context.Response.WriteAsync(jsonResponse);
    }
}
```

### OpenAPI Configuration
```csharp
public static class OpenApiConfiguration
{
    public static void AddCampaignOpenApi(this IServiceCollection services)
    {
        services.AddSwaggerGen(options =>
        {
            options.SwaggerDoc("v1", new OpenApiInfo
            {
                Title = "D&D Campaign Management API",
                Version = "v1",
                Description = "API for managing D&D campaigns, players, and sessions"
            });

            options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
            {
                Description = "JWT Authorization header using the Bearer scheme",
                Name = "Authorization",
                In = ParameterLocation.Header,
                Type = SecuritySchemeType.ApiKey,
                Scheme = "Bearer"
            });

            options.AddSecurityRequirement(new OpenApiSecurityRequirement
            {
                {
                    new OpenApiSecurityScheme
                    {
                        Reference = new OpenApiReference
                        {
                            Type = ReferenceType.SecurityScheme,
                            Id = "Bearer"
                        }
                    },
                    Array.Empty<string>()
                }
            });

            var xmlFile = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
            var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
            options.IncludeXmlComments(xmlPath);
        });
    }
}
```

### Rate Limiting Configuration
```csharp
public static class RateLimitingConfiguration
{
    public static void AddCampaignRateLimiting(this IServiceCollection services)
    {
        services.AddRateLimiter(options =>
        {
            options.AddFixedWindowLimiter("CampaignCreation", limiterOptions =>
            {
                limiterOptions.PermitLimit = 5;
                limiterOptions.Window = TimeSpan.FromHours(1);
                limiterOptions.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
                limiterOptions.QueueLimit = 2;
            });

            options.AddSlidingWindowLimiter("CampaignApi", limiterOptions =>
            {
                limiterOptions.PermitLimit = 100;
                limiterOptions.Window = TimeSpan.FromMinutes(1);
                limiterOptions.SegmentsPerWindow = 4;
                limiterOptions.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
                limiterOptions.QueueLimit = 10;
            });
        });
    }
}
```

## Definition of Done
- [ ] All campaign CRUD endpoints implemented and tested
- [ ] Player invitation system works end-to-end
- [ ] Session scheduling endpoints functional
- [ ] World state management endpoints working
- [ ] Proper authorization and validation implemented
- [ ] Error handling provides meaningful responses
- [ ] OpenAPI documentation generated correctly
- [ ] Rate limiting prevents API abuse
- [ ] Integration tests cover all endpoints
- [ ] Performance meets requirements (<200ms response time)

## Dependencies
- **Depends on**: 01-campaign-domain-model.md, 02-campaign-cqrs-implementation.md
- **Integrates with**: Authentication service, Notification service
- **Blocks**: Campaign UI implementation

## Estimated Effort
**6 hours** - API endpoint implementation and testing
