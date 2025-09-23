# Campaign Management Business Logic

## Overview
This document defines the comprehensive business logic for campaign management in the D&D AI Campaign Management System. It covers campaign lifecycle, world state management, player collaboration, session orchestration, and the complex rules governing how campaigns operate within the D&D 5e framework.

## Domain Model

### Campaign Entity
```csharp
public class Campaign : IAggregateRoot, IAuditable, ISoftDeletable
{
    public string Id { get; private set; }
    public string Name { get; private set; }
    public string Description { get; private set; }
    public CampaignSettings Settings { get; private set; }
    public WorldState WorldState { get; private set; }
    public CampaignStatus Status { get; private set; }
    public DateTime? StartDate { get; private set; }
    public DateTime? EndDate { get; private set; }
    public string DungeonMasterId { get; private set; }
    public int MaxPlayers { get; private set; }
    public int CurrentPlayerCount { get; private set; }
    public List<CampaignPlayer> Players { get; private set; }
    public List<Session> Sessions { get; private set; }
    public List<CampaignInvitation> Invitations { get; private set; }
    public CampaignTemplate? Template { get; private set; }
    public List<DomainEvent> DomainEvents { get; private set; }

    // Business Methods
    public Result InvitePlayer(string playerId, string invitedBy, PlayerRole role);
    public Result AcceptInvitation(string playerId, string invitationId);
    public Result RemovePlayer(string playerId, string removedBy, string reason);
    public Result StartCampaign();
    public Result EndCampaign(string reason);
    public Result ScheduleSession(SessionScheduleRequest request);
    public Result UpdateWorldState(WorldStateUpdate update);
    public Result ApplyTemplate(CampaignTemplate template);
}

public enum CampaignStatus
{
    Draft,
    Recruiting,
    Active,
    OnHold,
    Completed,
    Cancelled
}

public enum PlayerRole
{
    Player,
    CoGameMaster,
    Observer
}
```

### Campaign Settings
```csharp
public class CampaignSettings : ValueObject
{
    public DnDEdition Edition { get; private set; }
    public List<AllowedSourceBook> AllowedSourceBooks { get; private set; }
    public CharacterCreationRules CharacterCreationRules { get; private set; }
    public CombatRules CombatRules { get; private set; }
    public RestingRules RestingRules { get; private set; }
    public DeathRules DeathRules { get; private set; }
    public MagicItemRules MagicItemRules { get; private set; }
    public ExperienceRules ExperienceRules { get; private set; }
    public HomebrewRules HomebrewRules { get; private set; }
    public AIAssistanceSettings AISettings { get; private set; }
    public PrivacySettings PrivacySettings { get; private set; }
    public CollaborationSettings CollaborationSettings { get; private set; }

    public static CampaignSettings CreateDefault(DnDEdition edition)
    {
        return new CampaignSettings
        {
            Edition = edition,
            AllowedSourceBooks = GetDefaultSourceBooks(edition),
            CharacterCreationRules = CharacterCreationRules.CreateStandard(),
            CombatRules = CombatRules.CreateStandard(),
            RestingRules = RestingRules.CreateStandard(),
            DeathRules = DeathRules.CreateStandard(),
            MagicItemRules = MagicItemRules.CreateStandard(),
            ExperienceRules = ExperienceRules.CreateMilestone(),
            HomebrewRules = HomebrewRules.CreateEmpty(),
            AISettings = AIAssistanceSettings.CreateBalanced(),
            PrivacySettings = PrivacySettings.CreateDefault(),
            CollaborationSettings = CollaborationSettings.CreateOpen()
        };
    }
}

public class CharacterCreationRules : ValueObject
{
    public AbilityScoreMethod AbilityScoreMethod { get; private set; }
    public int StartingLevel { get; private set; }
    public bool AllowMulticlassing { get; private set; }
    public bool AllowFeats { get; private set; }
    public bool AllowVariantHuman { get; private set; }
    public bool AllowCustomLineage { get; private set; }
    public StartingEquipmentMethod StartingEquipment { get; private set; }
    public int StartingGoldAmount { get; private set; }
    public List<RestrictedClass> RestrictedClasses { get; private set; }
    public List<RestrictedRace> RestrictedRaces { get; private set; }
    public List<RestrictedBackground> RestrictedBackgrounds { get; private set; }
    public bool RequireDMApproval { get; private set; }
}

public enum AbilityScoreMethod
{
    StandardArray,
    PointBuy,
    RolledStats,
    CustomArray
}

public enum StartingEquipmentMethod
{
    ClassEquipment,
    StartingGold,
    Hybrid
}
```

## Campaign Lifecycle Management

### Campaign Creation Process
```csharp
public class CampaignCreationService : IDomainService
{
    private readonly ICampaignRepository _campaignRepository;
    private readonly ITemplateRepository _templateRepository;
    private readonly IUserRepository _userRepository;
    private readonly IDomainEventPublisher _eventPublisher;

    public async Task<Result<Campaign>> CreateCampaignAsync(CreateCampaignRequest request)
    {
        // Validate DM permissions
        var dm = await _userRepository.GetByIdAsync(request.DungeonMasterId);
        if (dm == null || !dm.CanCreateCampaigns())
        {
            return Result.Failure<Campaign>("User does not have permission to create campaigns");
        }

        // Check campaign limits
        var existingCampaigns = await _campaignRepository.GetActiveCampaignsByDMAsync(request.DungeonMasterId);
        if (existingCampaigns.Count >= dm.MaxActiveCampaigns)
        {
            return Result.Failure<Campaign>("Maximum active campaigns reached");
        }

        // Create campaign
        var campaign = Campaign.Create(
            name: request.Name,
            description: request.Description,
            dungeonMasterId: request.DungeonMasterId,
            maxPlayers: request.MaxPlayers,
            settings: request.Settings ?? CampaignSettings.CreateDefault(DnDEdition.FifthEdition)
        );

        // Apply template if specified
        if (request.TemplateId != null)
        {
            var template = await _templateRepository.GetByIdAsync(request.TemplateId);
            if (template != null)
            {
                var templateResult = campaign.ApplyTemplate(template);
                if (templateResult.IsFailure)
                {
                    return Result.Failure<Campaign>(templateResult.Error);
                }
            }
        }

        // Initialize world state
        campaign.InitializeWorldState();

        // Save campaign
        await _campaignRepository.AddAsync(campaign);

        // Publish domain events
        await _eventPublisher.PublishEventsAsync(campaign.DomainEvents);

        return Result.Success(campaign);
    }
}

public class CreateCampaignRequest
{
    public string Name { get; set; }
    public string Description { get; set; }
    public string DungeonMasterId { get; set; }
    public int MaxPlayers { get; set; }
    public CampaignSettings? Settings { get; set; }
    public string? TemplateId { get; set; }
    public bool StartImmediately { get; set; }
}
```

### Campaign Status Transitions
```csharp
public class CampaignStatusService : IDomainService
{
    public Result<CampaignStatus> ValidateStatusTransition(CampaignStatus from, CampaignStatus to, Campaign campaign)
    {
        return (from, to) switch
        {
            // Draft transitions
            (CampaignStatus.Draft, CampaignStatus.Recruiting) => ValidateRecruitingTransition(campaign),
            (CampaignStatus.Draft, CampaignStatus.Active) => ValidateDirectActivation(campaign),
            (CampaignStatus.Draft, CampaignStatus.Cancelled) => Result.Success(to),

            // Recruiting transitions
            (CampaignStatus.Recruiting, CampaignStatus.Active) => ValidateActivation(campaign),
            (CampaignStatus.Recruiting, CampaignStatus.Draft) => Result.Success(to),
            (CampaignStatus.Recruiting, CampaignStatus.Cancelled) => Result.Success(to),

            // Active transitions
            (CampaignStatus.Active, CampaignStatus.OnHold) => Result.Success(to),
            (CampaignStatus.Active, CampaignStatus.Completed) => ValidateCompletion(campaign),
            (CampaignStatus.Active, CampaignStatus.Cancelled) => Result.Success(to),

            // OnHold transitions
            (CampaignStatus.OnHold, CampaignStatus.Active) => ValidateReactivation(campaign),
            (CampaignStatus.OnHold, CampaignStatus.Completed) => ValidateCompletion(campaign),
            (CampaignStatus.OnHold, CampaignStatus.Cancelled) => Result.Success(to),

            // Terminal states (no transitions allowed)
            (CampaignStatus.Completed, _) => Result.Failure<CampaignStatus>("Cannot transition from completed campaign"),
            (CampaignStatus.Cancelled, _) => Result.Failure<CampaignStatus>("Cannot transition from cancelled campaign"),

            _ => Result.Failure<CampaignStatus>($"Invalid status transition from {from} to {to}")
        };
    }

    private Result<CampaignStatus> ValidateRecruitingTransition(Campaign campaign)
    {
        if (string.IsNullOrEmpty(campaign.Name))
            return Result.Failure<CampaignStatus>("Campaign must have a name");

        if (string.IsNullOrEmpty(campaign.Description))
            return Result.Failure<CampaignStatus>("Campaign must have a description");

        if (campaign.MaxPlayers < 1 || campaign.MaxPlayers > 8)
            return Result.Failure<CampaignStatus>("Campaign must allow 1-8 players");

        return Result.Success(CampaignStatus.Recruiting);
    }

    private Result<CampaignStatus> ValidateActivation(Campaign campaign)
    {
        if (campaign.CurrentPlayerCount < 1)
            return Result.Failure<CampaignStatus>("Campaign must have at least one player");

        if (campaign.Sessions.Count == 0)
            return Result.Failure<CampaignStatus>("Campaign must have at least one scheduled session");

        return Result.Success(CampaignStatus.Active);
    }
}
```

## Player Management

### Player Invitation System
```csharp
public class PlayerInvitationService : IDomainService
{
    private readonly IUserRepository _userRepository;
    private readonly INotificationService _notificationService;
    private readonly IEmailService _emailService;

    public async Task<Result<CampaignInvitation>> InvitePlayerAsync(
        Campaign campaign, 
        string playerId, 
        string invitedBy, 
        PlayerRole role)
    {
        // Validate campaign can accept new players
        if (campaign.Status != CampaignStatus.Recruiting && campaign.Status != CampaignStatus.Draft)
        {
            return Result.Failure<CampaignInvitation>("Campaign is not accepting new players");
        }

        if (campaign.CurrentPlayerCount >= campaign.MaxPlayers)
        {
            return Result.Failure<CampaignInvitation>("Campaign is full");
        }

        // Check if player is already in campaign or invited
        if (campaign.Players.Any(p => p.PlayerId == playerId))
        {
            return Result.Failure<CampaignInvitation>("Player is already in the campaign");
        }

        if (campaign.Invitations.Any(i => i.PlayerId == playerId && i.Status == InvitationStatus.Pending))
        {
            return Result.Failure<CampaignInvitation>("Player already has a pending invitation");
        }

        // Validate player exists and can join campaigns
        var player = await _userRepository.GetByIdAsync(playerId);
        if (player == null)
        {
            return Result.Failure<CampaignInvitation>("Player not found");
        }

        if (!player.CanJoinCampaigns())
        {
            return Result.Failure<CampaignInvitation>("Player cannot join campaigns");
        }

        // Check player's campaign limits
        var playerActiveCampaigns = await GetPlayerActiveCampaignsAsync(playerId);
        if (playerActiveCampaigns.Count >= player.MaxActiveCampaigns)
        {
            return Result.Failure<CampaignInvitation>("Player has reached maximum active campaigns");
        }

        // Create invitation
        var invitation = CampaignInvitation.Create(
            campaignId: campaign.Id,
            playerId: playerId,
            invitedBy: invitedBy,
            role: role,
            expiresAt: DateTime.UtcNow.AddDays(7)
        );

        campaign.AddInvitation(invitation);

        // Send notification
        await _notificationService.SendInvitationNotificationAsync(invitation);
        await _emailService.SendInvitationEmailAsync(invitation);

        return Result.Success(invitation);
    }

    public async Task<Result> AcceptInvitationAsync(string campaignId, string playerId, string invitationId)
    {
        var campaign = await _campaignRepository.GetByIdAsync(campaignId);
        if (campaign == null)
        {
            return Result.Failure("Campaign not found");
        }

        var invitation = campaign.Invitations.FirstOrDefault(i => i.Id == invitationId);
        if (invitation == null)
        {
            return Result.Failure("Invitation not found");
        }

        if (invitation.PlayerId != playerId)
        {
            return Result.Failure("Invitation does not belong to this player");
        }

        if (invitation.Status != InvitationStatus.Pending)
        {
            return Result.Failure("Invitation is no longer valid");
        }

        if (invitation.ExpiresAt < DateTime.UtcNow)
        {
            invitation.Expire();
            return Result.Failure("Invitation has expired");
        }

        // Final validation checks
        if (campaign.CurrentPlayerCount >= campaign.MaxPlayers)
        {
            return Result.Failure("Campaign is now full");
        }

        var player = await _userRepository.GetByIdAsync(playerId);
        var playerActiveCampaigns = await GetPlayerActiveCampaignsAsync(playerId);
        if (playerActiveCampaigns.Count >= player.MaxActiveCampaigns)
        {
            return Result.Failure("You have reached your maximum active campaigns");
        }

        // Accept invitation
        invitation.Accept();
        
        var campaignPlayer = CampaignPlayer.Create(
            playerId: playerId,
            role: invitation.Role,
            joinedAt: DateTime.UtcNow
        );

        campaign.AddPlayer(campaignPlayer);

        // Publish events
        campaign.AddDomainEvent(new PlayerJoinedCampaignEvent(campaign.Id, playerId, invitation.Role));

        return Result.Success();
    }
}

public class CampaignInvitation : Entity
{
    public string Id { get; private set; }
    public string CampaignId { get; private set; }
    public string PlayerId { get; private set; }
    public string InvitedBy { get; private set; }
    public PlayerRole Role { get; private set; }
    public InvitationStatus Status { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime ExpiresAt { get; private set; }
    public DateTime? AcceptedAt { get; private set; }
    public DateTime? DeclinedAt { get; private set; }
    public string? DeclineReason { get; private set; }

    public void Accept()
    {
        if (Status != InvitationStatus.Pending)
            throw new InvalidOperationException("Can only accept pending invitations");
        
        Status = InvitationStatus.Accepted;
        AcceptedAt = DateTime.UtcNow;
    }

    public void Decline(string reason)
    {
        if (Status != InvitationStatus.Pending)
            throw new InvalidOperationException("Can only decline pending invitations");
        
        Status = InvitationStatus.Declined;
        DeclinedAt = DateTime.UtcNow;
        DeclineReason = reason;
    }

    public void Expire()
    {
        if (Status == InvitationStatus.Pending)
        {
            Status = InvitationStatus.Expired;
        }
    }
}

public enum InvitationStatus
{
    Pending,
    Accepted,
    Declined,
    Expired,
    Cancelled
}
```

## World State Management

### World State Entity
```csharp
public class WorldState : Entity
{
    public string CampaignId { get; private set; }
    public GameTime CurrentTime { get; private set; }
    public Location CurrentLocation { get; private set; }
    public Weather CurrentWeather { get; private set; }
    public List<WorldLocation> Locations { get; private set; }
    public List<WorldNPC> NPCs { get; private set; }
    public List<WorldEvent> Events { get; private set; }
    public List<QuestLine> QuestLines { get; private set; }
    public Dictionary<string, object> CustomProperties { get; private set; }
    public int Version { get; private set; }
    public DateTime LastUpdated { get; private set; }

    public Result UpdateTime(TimeSpan advancement, string updatedBy)
    {
        var newTime = CurrentTime.Advance(advancement);
        if (newTime.IsFailure)
        {
            return newTime.Error;
        }

        CurrentTime = newTime.Value;
        LastUpdated = DateTime.UtcNow;
        Version++;

        AddDomainEvent(new WorldTimeAdvancedEvent(CampaignId, CurrentTime, advancement, updatedBy));
        return Result.Success();
    }

    public Result UpdateLocation(string locationId, string updatedBy)
    {
        var location = Locations.FirstOrDefault(l => l.Id == locationId);
        if (location == null)
        {
            return Result.Failure("Location not found");
        }

        var previousLocation = CurrentLocation;
        CurrentLocation = location.ToLocation();
        LastUpdated = DateTime.UtcNow;
        Version++;

        AddDomainEvent(new PartyLocationChangedEvent(CampaignId, previousLocation, CurrentLocation, updatedBy));
        return Result.Success();
    }

    public Result UpdateWeather(WeatherCondition weather, string updatedBy)
    {
        var previousWeather = CurrentWeather;
        CurrentWeather = Weather.Create(weather, CurrentTime);
        LastUpdated = DateTime.UtcNow;
        Version++;

        AddDomainEvent(new WeatherChangedEvent(CampaignId, previousWeather, CurrentWeather, updatedBy));
        return Result.Success();
    }

    public Result AddLocation(WorldLocation location, string addedBy)
    {
        if (Locations.Any(l => l.Name.Equals(location.Name, StringComparison.OrdinalIgnoreCase)))
        {
            return Result.Failure("Location with this name already exists");
        }

        Locations.Add(location);
        LastUpdated = DateTime.UtcNow;
        Version++;

        AddDomainEvent(new LocationAddedEvent(CampaignId, location, addedBy));
        return Result.Success();
    }
}

public class GameTime : ValueObject
{
    public int Year { get; private set; }
    public int Month { get; private set; }
    public int Day { get; private set; }
    public int Hour { get; private set; }
    public int Minute { get; private set; }
    public Calendar Calendar { get; private set; }

    public Result<GameTime> Advance(TimeSpan timeSpan)
    {
        try
        {
            var totalMinutes = (int)timeSpan.TotalMinutes;
            var newMinute = Minute + totalMinutes;
            
            var newHour = Hour + (newMinute / 60);
            newMinute = newMinute % 60;
            
            var newDay = Day + (newHour / 24);
            newHour = newHour % 24;
            
            var newMonth = Month;
            var newYear = Year;
            
            while (newDay > Calendar.GetDaysInMonth(newYear, newMonth))
            {
                newDay -= Calendar.GetDaysInMonth(newYear, newMonth);
                newMonth++;
                if (newMonth > Calendar.MonthsInYear)
                {
                    newMonth = 1;
                    newYear++;
                }
            }

            return Result.Success(new GameTime
            {
                Year = newYear,
                Month = newMonth,
                Day = newDay,
                Hour = newHour,
                Minute = newMinute,
                Calendar = Calendar
            });
        }
        catch (Exception ex)
        {
            return Result.Failure<GameTime>($"Invalid time advancement: {ex.Message}");
        }
    }

    public string ToDisplayString()
    {
        return $"{Calendar.GetMonthName(Month)} {Day}, {Year} at {Hour:D2}:{Minute:D2}";
    }
}

public class Calendar : ValueObject
{
    public string Name { get; private set; }
    public int MonthsInYear { get; private set; }
    public List<CalendarMonth> Months { get; private set; }
    public int DaysInWeek { get; private set; }
    public List<string> DayNames { get; private set; }

    public static Calendar CreateGregorianCalendar()
    {
        return new Calendar
        {
            Name = "Gregorian",
            MonthsInYear = 12,
            Months = new List<CalendarMonth>
            {
                new("January", 31),
                new("February", 28), // Leap years handled separately
                new("March", 31),
                new("April", 30),
                new("May", 31),
                new("June", 30),
                new("July", 31),
                new("August", 31),
                new("September", 30),
                new("October", 31),
                new("November", 30),
                new("December", 31)
            },
            DaysInWeek = 7,
            DayNames = new List<string> { "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday" }
        };
    }

    public static Calendar CreateFaerunCalendar()
    {
        return new Calendar
        {
            Name = "Calendar of Harptos",
            MonthsInYear = 12,
            Months = new List<CalendarMonth>
            {
                new("Hammer", 30),
                new("Alturiak", 30),
                new("Ches", 30),
                new("Tarsakh", 30),
                new("Mirtul", 30),
                new("Kythorn", 30),
                new("Flamerule", 30),
                new("Eleasis", 30),
                new("Eleint", 30),
                new("Marpenoth", 30),
                new("Uktar", 30),
                new("Nightal", 30)
            },
            DaysInWeek = 10,
            DayNames = new List<string> { "1st-day", "2nd-day", "3rd-day", "4th-day", "5th-day", "6th-day", "7th-day", "8th-day", "9th-day", "10th-day" }
        };
    }
}
```

## Session Management

### Session Scheduling and Management
```csharp
public class SessionManagementService : IDomainService
{
    private readonly ISessionRepository _sessionRepository;
    private readonly ICalendarService _calendarService;
    private readonly INotificationService _notificationService;

    public async Task<Result<Session>> ScheduleSessionAsync(Campaign campaign, ScheduleSessionRequest request)
    {
        // Validate scheduling permissions
        if (!campaign.CanUserScheduleSessions(request.ScheduledBy))
        {
            return Result.Failure<Session>("User does not have permission to schedule sessions");
        }

        // Validate session timing
        if (request.StartTime <= DateTime.UtcNow)
        {
            return Result.Failure<Session>("Session cannot be scheduled in the past");
        }

        if (request.EndTime <= request.StartTime)
        {
            return Result.Failure<Session>("Session end time must be after start time");
        }

        var duration = request.EndTime - request.StartTime;
        if (duration > TimeSpan.FromHours(8))
        {
            return Result.Failure<Session>("Session cannot exceed 8 hours");
        }

        // Check for conflicts
        var conflicts = await _sessionRepository.GetConflictingSessionsAsync(
            campaign.Id, 
            request.StartTime, 
            request.EndTime);

        if (conflicts.Any())
        {
            return Result.Failure<Session>("Session conflicts with existing sessions");
        }

        // Create session
        var session = Session.Create(
            campaignId: campaign.Id,
            name: request.Name,
            description: request.Description,
            startTime: request.StartTime,
            endTime: request.EndTime,
            scheduledBy: request.ScheduledBy,
            sessionType: request.SessionType,
            isRecurring: request.IsRecurring,
            recurrencePattern: request.RecurrencePattern
        );

        // Add to campaign
        campaign.AddSession(session);

        // Send calendar invites
        await _calendarService.SendCalendarInvitesAsync(session, campaign.Players);

        // Notify players
        await _notificationService.NotifySessionScheduledAsync(session, campaign.Players);

        return Result.Success(session);
    }

    public async Task<Result> StartSessionAsync(string sessionId, string startedBy)
    {
        var session = await _sessionRepository.GetByIdAsync(sessionId);
        if (session == null)
        {
            return Result.Failure("Session not found");
        }

        var campaign = await _campaignRepository.GetByIdAsync(session.CampaignId);
        if (campaign == null)
        {
            return Result.Failure("Campaign not found");
        }

        if (!campaign.CanUserManageSessions(startedBy))
        {
            return Result.Failure("User does not have permission to start sessions");
        }

        var result = session.Start(startedBy);
        if (result.IsFailure)
        {
            return result;
        }

        // Initialize session state
        var sessionState = SessionState.Initialize(session.Id, campaign.WorldState);
        session.SetSessionState(sessionState);

        // Notify players
        await _notificationService.NotifySessionStartedAsync(session, campaign.Players);

        return Result.Success();
    }
}

public class Session : Entity, IAggregateRoot
{
    public string Id { get; private set; }
    public string CampaignId { get; private set; }
    public string Name { get; private set; }
    public string Description { get; private set; }
    public DateTime ScheduledStartTime { get; private set; }
    public DateTime ScheduledEndTime { get; private set; }
    public DateTime? ActualStartTime { get; private set; }
    public DateTime? ActualEndTime { get; private set; }
    public SessionStatus Status { get; private set; }
    public SessionType Type { get; private set; }
    public string ScheduledBy { get; private set; }
    public bool IsRecurring { get; private set; }
    public RecurrencePattern? RecurrencePattern { get; private set; }
    public SessionState? SessionState { get; private set; }
    public List<SessionPlayer> Players { get; private set; }
    public List<SessionNote> Notes { get; private set; }
    public List<DomainEvent> DomainEvents { get; private set; }

    public Result Start(string startedBy)
    {
        if (Status != SessionStatus.Scheduled)
        {
            return Result.Failure("Can only start scheduled sessions");
        }

        Status = SessionStatus.InProgress;
        ActualStartTime = DateTime.UtcNow;

        AddDomainEvent(new SessionStartedEvent(Id, CampaignId, startedBy));
        return Result.Success();
    }

    public Result End(string endedBy, string? summary = null)
    {
        if (Status != SessionStatus.InProgress)
        {
            return Result.Failure("Can only end sessions that are in progress");
        }

        Status = SessionStatus.Completed;
        ActualEndTime = DateTime.UtcNow;

        if (!string.IsNullOrEmpty(summary))
        {
            AddNote(SessionNote.CreateSummary(summary, endedBy));
        }

        AddDomainEvent(new SessionEndedEvent(Id, CampaignId, endedBy));
        return Result.Success();
    }
}

public enum SessionStatus
{
    Scheduled,
    InProgress,
    Completed,
    Cancelled,
    Postponed
}

public enum SessionType
{
    Regular,
    OneShot,
    CharacterCreation,
    WorldBuilding,
    Combat,
    Roleplay,
    Exploration
}
```

This Campaign Management business logic specification provides:

1. **Complete Domain Model** - Campaign entity with all business rules and invariants
2. **Campaign Lifecycle Management** - Creation, status transitions, and validation rules
3. **Player Management** - Invitation system with comprehensive validation
4. **World State Management** - Time, location, weather, and world event tracking
5. **Session Management** - Scheduling, conflict detection, and session lifecycle
6. **Business Rules Enforcement** - Validation at every step with clear error messages
7. **Event-Driven Architecture** - Domain events for integration and notifications
8. **Rich Domain Logic** - Complex business rules specific to D&D campaign management

The specification ensures data consistency, business rule enforcement, and provides a solid foundation for implementing the campaign management features.

<function_calls>
<invoke name="todo_write">
<parameter name="merge">true
