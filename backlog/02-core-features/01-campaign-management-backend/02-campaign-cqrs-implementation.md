# Campaign CQRS Implementation

## Story
**As a** developer  
**I want** CQRS command and query handlers for campaign management  
**So that** I can separate read and write operations with proper validation and event handling

## Acceptance Criteria
- [ ] Command handlers for campaign creation, updates, and player management
- [ ] Query handlers for campaign retrieval and search
- [ ] Proper validation using FluentValidation
- [ ] Event handlers for cross-service communication
- [ ] Repository pattern implementation
- [ ] Caching strategy for read operations
- [ ] Error handling and logging
- [ ] Performance optimization for queries

## Technical References
- **Technical Specification**: Section 2.1.2 Campaign Management - CQRS Implementation
- **Service Specification**: Campaign Service - CQRS Implementation
- **Architecture Pattern**: CQRS with MediatR
- **Playbook Reference**: Phase 2, Week 3, Day 1-3: Campaign CQRS Implementation

## Implementation Details

### Command Handlers

#### Create Campaign Command
```csharp
public class CreateCampaignCommand : IRequest<CreateCampaignResponse>
{
    public string Name { get; set; }
    public string Description { get; set; }
    public Guid GameMasterId { get; set; }
    public CampaignSettingsDto Settings { get; set; }
    public string TemplateId { get; set; }
}

public class CreateCampaignCommandHandler : IRequestHandler<CreateCampaignCommand, CreateCampaignResponse>
{
    private readonly ICampaignRepository _campaignRepository;
    private readonly IUserRepository _userRepository;
    private readonly ISubscriptionService _subscriptionService;
    private readonly ILogger<CreateCampaignCommandHandler> _logger;

    public CreateCampaignCommandHandler(
        ICampaignRepository campaignRepository,
        IUserRepository userRepository,
        ISubscriptionService subscriptionService,
        ILogger<CreateCampaignCommandHandler> logger)
    {
        _campaignRepository = campaignRepository;
        _userRepository = userRepository;
        _subscriptionService = subscriptionService;
        _logger = logger;
    }

    public async Task<CreateCampaignResponse> Handle(CreateCampaignCommand request, CancellationToken cancellationToken)
    {
        // Validate Game Master exists and has permission
        var gameMaster = await _userRepository.GetByIdAsync(request.GameMasterId);
        if (gameMaster == null || gameMaster.Role != UserRole.GameMaster)
        {
            throw new ValidationException("Only Game Masters can create campaigns");
        }

        // Check subscription limits
        var activeCampaigns = await _campaignRepository.GetActiveCampaignCountAsync(request.GameMasterId);
        var subscriptionLimits = await _subscriptionService.GetLimitsAsync(request.GameMasterId);
        
        if (activeCampaigns >= subscriptionLimits.MaxActiveCampaigns)
        {
            throw new SubscriptionLimitException("Maximum active campaigns reached for subscription tier");
        }

        // Create campaign
        var campaign = Campaign.Create(
            request.Name,
            request.Description,
            request.GameMasterId,
            CampaignSettings.FromDto(request.Settings));

        // Apply template if specified
        if (!string.IsNullOrEmpty(request.TemplateId))
        {
            await ApplyTemplateAsync(campaign, request.TemplateId);
        }

        await _campaignRepository.AddAsync(campaign);
        await _campaignRepository.SaveChangesAsync();

        _logger.LogInformation("Campaign {CampaignId} created by GM {GameMasterId}", 
            campaign.Id, request.GameMasterId);

        return new CreateCampaignResponse
        {
            CampaignId = campaign.Id,
            Name = campaign.Name,
            Status = campaign.Status
        };
    }
}
```

#### Invite Player Command
```csharp
public class InvitePlayerCommand : IRequest<InvitePlayerResponse>
{
    public Guid CampaignId { get; set; }
    public Guid GameMasterId { get; set; }
    public string PlayerEmail { get; set; }
    public PlayerRole Role { get; set; }
    public string PersonalMessage { get; set; }
}

public class InvitePlayerCommandHandler : IRequestHandler<InvitePlayerCommand, InvitePlayerResponse>
{
    private readonly ICampaignRepository _campaignRepository;
    private readonly IUserRepository _userRepository;
    private readonly INotificationService _notificationService;

    public async Task<InvitePlayerResponse> Handle(InvitePlayerCommand request, CancellationToken cancellationToken)
    {
        var campaign = await _campaignRepository.GetByIdAsync(request.CampaignId);
        if (campaign == null)
            throw new NotFoundException($"Campaign {request.CampaignId} not found");

        // Authorize GM
        if (campaign.GameMasterId != request.GameMasterId)
            throw new UnauthorizedException("Only the Game Master can invite players");

        // Find or create user account for player
        var player = await _userRepository.GetByEmailAsync(request.PlayerEmail);
        var playerId = player?.Id ?? Guid.NewGuid();

        // Invite player to campaign
        campaign.InvitePlayer(playerId, request.PlayerEmail, request.Role);

        await _campaignRepository.SaveChangesAsync();

        // Send invitation notification
        await _notificationService.SendPlayerInvitationAsync(
            request.PlayerEmail, 
            campaign.Name, 
            request.PersonalMessage);

        return new InvitePlayerResponse
        {
            InvitationId = campaign.Invitations.Last().Id,
            PlayerEmail = request.PlayerEmail,
            ExpiresAt = DateTime.UtcNow.AddDays(7)
        };
    }
}
```

### Query Handlers

#### Get Campaign Query
```csharp
public class GetCampaignQuery : IRequest<CampaignDto>
{
    public Guid CampaignId { get; set; }
    public Guid UserId { get; set; }
}

public class GetCampaignQueryHandler : IRequestHandler<GetCampaignQuery, CampaignDto>
{
    private readonly ICampaignRepository _campaignRepository;
    private readonly IMemoryCache _cache;
    private readonly IAuthorizationService _authorizationService;

    public async Task<CampaignDto> Handle(GetCampaignQuery request, CancellationToken cancellationToken)
    {
        // Try cache first
        var cacheKey = $"campaign:{request.CampaignId}:user:{request.UserId}";
        if (_cache.TryGetValue(cacheKey, out CampaignDto cachedCampaign))
        {
            return cachedCampaign;
        }

        var campaign = await _campaignRepository.GetByIdWithDetailsAsync(request.CampaignId);
        if (campaign == null)
            throw new NotFoundException($"Campaign {request.CampaignId} not found");

        // Authorize access
        var hasAccess = campaign.GameMasterId == request.UserId || 
                       campaign.Players.Any(p => p.PlayerId == request.UserId);
        
        if (!hasAccess)
            throw new UnauthorizedException("Access denied to campaign");

        var campaignDto = CampaignDto.FromDomain(campaign, request.UserId);

        // Cache for 5 minutes
        _cache.Set(cacheKey, campaignDto, TimeSpan.FromMinutes(5));

        return campaignDto;
    }
}
```

#### Get User Campaigns Query
```csharp
public class GetUserCampaignsQuery : IRequest<PagedResult<CampaignSummaryDto>>
{
    public Guid UserId { get; set; }
    public CampaignStatus? Status { get; set; }
    public string SearchTerm { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}

public class GetUserCampaignsQueryHandler : IRequestHandler<GetUserCampaignsQuery, PagedResult<CampaignSummaryDto>>
{
    private readonly ICampaignRepository _campaignRepository;

    public async Task<PagedResult<CampaignSummaryDto>> Handle(GetUserCampaignsQuery request, CancellationToken cancellationToken)
    {
        var campaigns = await _campaignRepository.GetUserCampaignsAsync(
            request.UserId,
            request.Status,
            request.SearchTerm,
            request.Page,
            request.PageSize);

        var campaignDtos = campaigns.Items.Select(c => CampaignSummaryDto.FromDomain(c, request.UserId));

        return new PagedResult<CampaignSummaryDto>
        {
            Items = campaignDtos.ToList(),
            TotalCount = campaigns.TotalCount,
            Page = request.Page,
            PageSize = request.PageSize
        };
    }
}
```

## AI Prompts for Implementation

### Primary Prompt
```
Create comprehensive CQRS command and query handlers for D&D campaign management using MediatR. Include CreateCampaign, InvitePlayer, ScheduleSession commands and GetCampaign, GetUserCampaigns queries. Implement proper validation using FluentValidation, authorization checks, subscription limit enforcement, caching strategy, and error handling. Use repository pattern and include domain event handling.
```

### Secondary Prompts
```
Generate campaign command handlers with proper business logic validation, subscription limit checking, and domain event publishing. Include error handling and logging.

Create campaign query handlers with caching strategy, authorization checks, and performance optimization. Include pagination and search functionality.

Generate FluentValidation validators for campaign commands with proper business rule validation and error messages.
```

### Validation Implementation
```csharp
public class CreateCampaignCommandValidator : AbstractValidator<CreateCampaignCommand>
{
    public CreateCampaignCommandValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Campaign name is required")
            .MaximumLength(100).WithMessage("Campaign name cannot exceed 100 characters")
            .Must(BeUniqueForUser).WithMessage("Campaign name must be unique for the Game Master");

        RuleFor(x => x.Description)
            .MaximumLength(1000).WithMessage("Description cannot exceed 1000 characters");

        RuleFor(x => x.GameMasterId)
            .NotEmpty().WithMessage("Game Master ID is required");

        RuleFor(x => x.Settings)
            .NotNull().WithMessage("Campaign settings are required")
            .SetValidator(new CampaignSettingsValidator());
    }

    private bool BeUniqueForUser(CreateCampaignCommand command, string name)
    {
        // Implementation to check name uniqueness
        return true; // Placeholder
    }
}

public class CampaignSettingsValidator : AbstractValidator<CampaignSettingsDto>
{
    public CampaignSettingsValidator()
    {
        RuleFor(x => x.MaxPlayers)
            .GreaterThan(0).WithMessage("Maximum players must be greater than 0")
            .LessThanOrEqualTo(8).WithMessage("Maximum players cannot exceed 8");

        RuleFor(x => x.StartingLevel)
            .GreaterThanOrEqualTo(1).WithMessage("Starting level must be at least 1")
            .LessThanOrEqualTo(20).WithMessage("Starting level cannot exceed 20");
    }
}
```

### Event Handlers
```csharp
public class PlayerInvitedEventHandler : INotificationHandler<PlayerInvitedEvent>
{
    private readonly INotificationService _notificationService;
    private readonly IEmailService _emailService;

    public async Task Handle(PlayerInvitedEvent notification, CancellationToken cancellationToken)
    {
        // Send email invitation
        await _emailService.SendPlayerInvitationEmailAsync(
            notification.Email,
            notification.CampaignId,
            notification.Role);

        // Create in-app notification if user exists
        await _notificationService.CreateInvitationNotificationAsync(
            notification.PlayerId,
            notification.CampaignId);
    }
}
```

### Repository Interface
```csharp
public interface ICampaignRepository : IRepository<Campaign>
{
    Task<Campaign> GetByIdWithDetailsAsync(Guid id);
    Task<PagedResult<Campaign>> GetUserCampaignsAsync(Guid userId, CampaignStatus? status, string searchTerm, int page, int pageSize);
    Task<int> GetActiveCampaignCountAsync(Guid gameMasterId);
    Task<List<Campaign>> GetCampaignsByGameMasterAsync(Guid gameMasterId);
    Task<bool> IsPlayerInCampaignAsync(Guid campaignId, Guid playerId);
}
```

## Definition of Done
- [ ] All command handlers implement proper business logic and validation
- [ ] Query handlers include caching and performance optimization
- [ ] FluentValidation validators cover all business rules
- [ ] Event handlers process domain events correctly
- [ ] Repository implementation supports all required queries
- [ ] Authorization checks prevent unauthorized access
- [ ] Subscription limits are properly enforced
- [ ] Error handling provides meaningful messages
- [ ] Unit tests cover all handlers and edge cases

## Dependencies
- **Depends on**: 01-campaign-domain-model.md, Epic 1 - Authentication Service
- **Blocks**: Campaign API endpoints implementation

## Estimated Effort
**10 hours** - CQRS implementation and testing
