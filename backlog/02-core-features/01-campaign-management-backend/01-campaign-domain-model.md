# Campaign Domain Model Implementation

## Story
**As a** Game Master  
**I want** a comprehensive campaign domain model with world state management  
**So that** I can create and manage D&D campaigns with persistent world states and player management

## Acceptance Criteria
- [ ] Campaign aggregate root with proper business logic
- [ ] Player invitation and management system
- [ ] Session scheduling and tracking
- [ ] World state management (time, location, events)
- [ ] Campaign templates and settings
- [ ] Domain events for cross-service communication
- [ ] Proper validation and business rules enforcement
- [ ] Audit trail for all campaign changes

## Technical References
- **Technical Specification**: Section 2.1.2 Campaign Management - REQ-CM-001 to REQ-CM-005
- **Service Specification**: Campaign Service - Campaign Domain Model
- **Business Logic**: Campaign Management - Domain Models
- **Playbook Reference**: Phase 2, Week 3, Day 1-3: Campaign Service

## Implementation Details

### Campaign Aggregate Root
```csharp
public class Campaign : AggregateRoot<Guid>
{
    public string Name { get; private set; }
    public string Description { get; private set; }
    public Guid GameMasterId { get; private set; }
    public CampaignStatus Status { get; private set; }
    public CampaignSettings Settings { get; private set; }
    public WorldState WorldState { get; private set; }
    
    // Collections
    private readonly List<CampaignPlayer> _players = new();
    private readonly List<CampaignInvitation> _invitations = new();
    private readonly List<GameSession> _sessions = new();
    
    public IReadOnlyCollection<CampaignPlayer> Players => _players.AsReadOnly();
    public IReadOnlyCollection<CampaignInvitation> Invitations => _invitations.AsReadOnly();
    public IReadOnlyCollection<GameSession> Sessions => _sessions.AsReadOnly();
    
    // Business Methods
    public void InvitePlayer(Guid playerId, string email, PlayerRole role)
    {
        // Business logic for player invitation
        ValidateInvitation(playerId, email, role);
        
        var invitation = new CampaignInvitation(
            Id, playerId, email, role, DateTime.UtcNow.AddDays(7));
            
        _invitations.Add(invitation);
        
        RaiseDomainEvent(new PlayerInvitedEvent(Id, playerId, email, role));
    }
    
    public void AcceptInvitation(Guid invitationId, Guid playerId)
    {
        var invitation = _invitations.FirstOrDefault(i => i.Id == invitationId);
        if (invitation == null || invitation.IsExpired)
            throw new DomainException("Invalid or expired invitation");
            
        var player = new CampaignPlayer(Id, playerId, invitation.Role);
        _players.Add(player);
        _invitations.Remove(invitation);
        
        RaiseDomainEvent(new PlayerJoinedCampaignEvent(Id, playerId, invitation.Role));
    }
    
    public void ScheduleSession(DateTime scheduledFor, TimeSpan duration, string notes)
    {
        ValidateSessionScheduling(scheduledFor);
        
        var session = new GameSession(Id, scheduledFor, duration, notes);
        _sessions.Add(session);
        
        RaiseDomainEvent(new SessionScheduledEvent(Id, session.Id, scheduledFor));
    }
    
    public void UpdateWorldState(GameTime gameTime, Location currentLocation, 
        WeatherCondition weather, IEnumerable<WorldEvent> events)
    {
        WorldState = WorldState.Update(gameTime, currentLocation, weather, events);
        RaiseDomainEvent(new WorldStateUpdatedEvent(Id, WorldState));
    }
}
```

### Supporting Value Objects
```csharp
public class WorldState : ValueObject
{
    public GameTime CurrentTime { get; private set; }
    public Location CurrentLocation { get; private set; }
    public WeatherCondition Weather { get; private set; }
    public IReadOnlyCollection<WorldEvent> RecentEvents { get; private set; }
    
    public WorldState Update(GameTime gameTime, Location location, 
        WeatherCondition weather, IEnumerable<WorldEvent> events)
    {
        return new WorldState(gameTime, location, weather, events.ToList());
    }
}

public class GameTime : ValueObject
{
    public int Year { get; private set; }
    public int Month { get; private set; }
    public int Day { get; private set; }
    public int Hour { get; private set; }
    
    public GameTime AddDays(int days) => new GameTime(Year, Month, Day + days, Hour);
    public GameTime AddHours(int hours) => new GameTime(Year, Month, Day, Hour + hours);
}

public class CampaignSettings : ValueObject
{
    public bool IsPublic { get; private set; }
    public int MaxPlayers { get; private set; }
    public DifficultyLevel Difficulty { get; private set; }
    public PlayStyle PlayStyle { get; private set; }
    public List<string> AllowedRaces { get; private set; }
    public List<string> AllowedClasses { get; private set; }
    public bool AllowMulticlassing { get; private set; }
    public int StartingLevel { get; private set; }
}
```

## AI Prompts for Implementation

### Primary Prompt
```
Create a comprehensive Campaign domain model for D&D 5e using Domain-Driven Design principles. Include Campaign aggregate root with player management, session scheduling, world state tracking, and campaign settings. Implement proper business logic, validation rules, and domain events. Use C# with Entity Framework Core and include value objects for GameTime, Location, and WorldState. Follow CQRS pattern with proper encapsulation and business rule enforcement.
```

### Secondary Prompts
```
Generate Campaign aggregate root with player invitation system, session management, and world state tracking. Include proper validation, business rules, and domain events for cross-service communication.

Create value objects for D&D campaign management including GameTime, Location, WorldState, and CampaignSettings with proper validation and business logic.

Generate domain events for campaign lifecycle including PlayerInvited, PlayerJoined, SessionScheduled, and WorldStateUpdated with proper event handling patterns.
```

### Domain Events
```csharp
public class PlayerInvitedEvent : DomainEvent
{
    public Guid CampaignId { get; }
    public Guid PlayerId { get; }
    public string Email { get; }
    public PlayerRole Role { get; }
    
    public PlayerInvitedEvent(Guid campaignId, Guid playerId, string email, PlayerRole role)
    {
        CampaignId = campaignId;
        PlayerId = playerId;
        Email = email;
        Role = role;
    }
}

public class SessionScheduledEvent : DomainEvent
{
    public Guid CampaignId { get; }
    public Guid SessionId { get; }
    public DateTime ScheduledFor { get; }
    
    public SessionScheduledEvent(Guid campaignId, Guid sessionId, DateTime scheduledFor)
    {
        CampaignId = campaignId;
        SessionId = sessionId;
        ScheduledFor = scheduledFor;
    }
}
```

### Business Rules
1. **Campaign Creation**: Only Game Masters can create campaigns
2. **Player Limits**: Campaigns cannot exceed maximum player count
3. **Invitation Expiry**: Invitations expire after 7 days
4. **Session Scheduling**: Sessions cannot be scheduled in the past
5. **World State**: Only active sessions can update world state
6. **Player Roles**: Players can only have one role per campaign

### Entity Framework Configuration
```csharp
public class CampaignConfiguration : IEntityTypeConfiguration<Campaign>
{
    public void Configure(EntityTypeBuilder<Campaign> builder)
    {
        builder.HasKey(c => c.Id);
        builder.Property(c => c.Name).HasMaxLength(100).IsRequired();
        builder.Property(c => c.Description).HasMaxLength(1000);
        
        builder.OwnsOne(c => c.Settings, settings =>
        {
            settings.Property(s => s.MaxPlayers).HasDefaultValue(6);
            settings.Property(s => s.StartingLevel).HasDefaultValue(1);
        });
        
        builder.OwnsOne(c => c.WorldState, worldState =>
        {
            worldState.OwnsOne(ws => ws.CurrentTime);
            worldState.OwnsOne(ws => ws.CurrentLocation);
        });
        
        builder.HasMany<CampaignPlayer>()
            .WithOne()
            .HasForeignKey(cp => cp.CampaignId);
            
        builder.HasMany<CampaignInvitation>()
            .WithOne()
            .HasForeignKey(ci => ci.CampaignId);
    }
}
```

## Definition of Done
- [ ] Campaign aggregate root properly encapsulates business logic
- [ ] Player invitation and management system works correctly
- [ ] Session scheduling validates business rules
- [ ] World state management tracks campaign progress
- [ ] Domain events are raised for all state changes
- [ ] Entity Framework configuration maps domain model correctly
- [ ] All business rules are validated and enforced
- [ ] Unit tests cover all domain logic and edge cases

## Dependencies
- **Depends on**: Epic 1 - Foundation & Authentication (User management)
- **Blocks**: Campaign API endpoints and UI implementation

## Estimated Effort
**8 hours** - Domain modeling and business logic implementation
