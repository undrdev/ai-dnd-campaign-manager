# Real-time Service Implementation Specification

## Overview
The Real-time Service orchestrates live collaboration during D&D sessions through SignalR WebSocket connections. It manages session state synchronization, conflict resolution, live communication, dice rolling, combat tracking, and ensures consistent real-time experiences across all connected clients.

## Service Architecture

### Technology Stack
- **Framework**: ASP.NET Core 8.0 with SignalR
- **Database**: PostgreSQL with Entity Framework Core
- **Caching**: Redis for session state and connection management
- **Message Queue**: Redis Streams for reliable message delivery
- **Conflict Resolution**: Custom CRDT-based algorithms
- **Real-time**: SignalR with WebSocket transport
- **Scaling**: Redis backplane for multi-instance support
- **Testing**: xUnit, Moq, SignalR test framework

### Project Structure
```
RealtimeService/
├── src/
│   ├── RealtimeService.Api/            # Web API and SignalR layer
│   │   ├── Hubs/                       # SignalR hubs
│   │   ├── Controllers/
│   │   ├── Middleware/
│   │   ├── Program.cs
│   │   └── appsettings.json
│   ├── RealtimeService.Application/    # Application layer
│   │   ├── Commands/
│   │   ├── Queries/
│   │   ├── Handlers/
│   │   ├── Services/
│   │   └── DTOs/
│   ├── RealtimeService.Domain/         # Domain layer
│   │   ├── Entities/
│   │   ├── ValueObjects/
│   │   ├── Events/
│   │   ├── Repositories/
│   │   └── Services/
│   └── RealtimeService.Infrastructure/ # Infrastructure layer
│       ├── Data/
│       ├── Repositories/
│       ├── Services/
│       ├── SignalR/                    # SignalR implementations
│       └── Configuration/
└── tests/
    ├── RealtimeService.UnitTests/
    ├── RealtimeService.IntegrationTests/
    └── RealtimeService.RealtimeTests/   # Real-time specific tests
```

## Domain Layer Implementation

### Core Session Entity
Based on the database specification in `design/database/realtime-session.md`:

```csharp
// Domain/Entities/LiveSession.cs
using RealtimeService.Domain.Events;
using RealtimeService.Domain.ValueObjects;

namespace RealtimeService.Domain.Entities
{
    public class LiveSession : AggregateRoot
    {
        public Guid Id { get; private set; }
        public Guid CampaignId { get; private set; }
        public Guid GameMasterId { get; private set; }
        public string SessionName { get; private set; }
        public string? Description { get; private set; }
        
        // Session State
        public SessionStatus Status { get; private set; }
        public SessionPhase CurrentPhase { get; private set; }
        public DateTime? ScheduledStartTime { get; private set; }
        public DateTime? ActualStartTime { get; private set; }
        public DateTime? EndTime { get; private set; }
        public TimeSpan? Duration { get; private set; }
        
        // Participants and Connections
        public List<SessionParticipant> Participants { get; private set; } = new();
        public List<ActiveConnection> ActiveConnections { get; private set; } = new();
        public int MaxParticipants { get; private set; }
        
        // Session Content and State
        public SessionState SessionState { get; private set; }
        public List<SessionEvent> Events { get; private set; } = new();
        public List<ChatMessage> ChatMessages { get; private set; } = new();
        public List<DiceRoll> DiceRolls { get; private set; } = new();
        
        // Combat and Initiative
        public CombatState? CombatState { get; private set; }
        public List<InitiativeEntry> Initiative { get; private set; } = new();
        public int? CurrentTurn { get; private set; }
        public int? Round { get; private set; }
        
        // Maps and Visual State
        public MapState? MapState { get; private set; }
        public List<Token> Tokens { get; private set; } = new();
        public List<MapAnnotation> MapAnnotations { get; private set; } = new();
        
        // Conflict Resolution
        public List<StateConflict> PendingConflicts { get; private set; } = new();
        public int StateVersion { get; private set; }
        public Dictionary<string, object> ConflictResolutionData { get; private set; } = new();
        
        // Session Settings
        public SessionSettings Settings { get; private set; }
        public List<string> EnabledFeatures { get; private set; } = new();
        
        // Audit and Tracking
        public DateTime CreatedAt { get; private set; }
        public DateTime UpdatedAt { get; private set; }
        public bool IsRecorded { get; private set; }
        public string? RecordingPath { get; private set; }

        // Private constructor for EF Core
        private LiveSession() { }

        // Factory method for creating live sessions
        public static LiveSession Create(
            Guid campaignId,
            Guid gameMasterId,
            string sessionName,
            string? description = null,
            DateTime? scheduledStartTime = null,
            SessionSettings? settings = null)
        {
            if (string.IsNullOrWhiteSpace(sessionName))
                throw new ArgumentException("Session name cannot be empty", nameof(sessionName));

            var session = new LiveSession
            {
                Id = Guid.NewGuid(),
                CampaignId = campaignId,
                GameMasterId = gameMasterId,
                SessionName = sessionName,
                Description = description,
                Status = SessionStatus.Scheduled,
                CurrentPhase = SessionPhase.PreSession,
                ScheduledStartTime = scheduledStartTime,
                MaxParticipants = 8, // Default D&D party size
                SessionState = SessionState.Default(),
                Settings = settings ?? SessionSettings.Default(),
                StateVersion = 1,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                IsRecorded = settings?.RecordSession ?? false
            };

            // Add GM as first participant
            session.AddParticipant(gameMasterId, ParticipantRole.GameMaster);

            session.AddDomainEvent(new LiveSessionCreatedEvent(session.Id, campaignId, gameMasterId, sessionName));

            return session;
        }

        public void Start(string? notes = null)
        {
            if (Status != SessionStatus.Scheduled && Status != SessionStatus.Waiting)
                throw new InvalidOperationException($"Cannot start session in status {Status}");

            Status = SessionStatus.Active;
            CurrentPhase = SessionPhase.InSession;
            ActualStartTime = DateTime.UtcNow;
            UpdatedAt = DateTime.UtcNow;

            AddSessionEvent(SessionEventType.SessionStarted, "Session started", notes);
            AddDomainEvent(new LiveSessionStartedEvent(Id, ActualStartTime.Value));
        }

        public void End(string? notes = null)
        {
            if (Status != SessionStatus.Active)
                throw new InvalidOperationException($"Cannot end session in status {Status}");

            Status = SessionStatus.Completed;
            CurrentPhase = SessionPhase.PostSession;
            EndTime = DateTime.UtcNow;
            Duration = EndTime.Value - (ActualStartTime ?? CreatedAt);
            UpdatedAt = DateTime.UtcNow;

            // End combat if active
            if (CombatState?.IsActive == true)
            {
                EndCombat("Session ended");
            }

            AddSessionEvent(SessionEventType.SessionEnded, "Session ended", notes);
            AddDomainEvent(new LiveSessionEndedEvent(Id, EndTime.Value, Duration.Value));
        }

        public void Pause(string reason)
        {
            if (Status != SessionStatus.Active)
                throw new InvalidOperationException($"Cannot pause session in status {Status}");

            Status = SessionStatus.Paused;
            UpdatedAt = DateTime.UtcNow;

            AddSessionEvent(SessionEventType.SessionPaused, "Session paused", reason);
            AddDomainEvent(new LiveSessionPausedEvent(Id, reason));
        }

        public void Resume(string? notes = null)
        {
            if (Status != SessionStatus.Paused)
                throw new InvalidOperationException($"Cannot resume session in status {Status}");

            Status = SessionStatus.Active;
            UpdatedAt = DateTime.UtcNow;

            AddSessionEvent(SessionEventType.SessionResumed, "Session resumed", notes);
            AddDomainEvent(new LiveSessionResumedEvent(Id));
        }

        public void AddParticipant(Guid userId, ParticipantRole role, string? characterName = null)
        {
            if (Participants.Any(p => p.UserId == userId && p.Status == ParticipantStatus.Active))
                throw new InvalidOperationException("User is already an active participant");

            if (Participants.Count(p => p.Status == ParticipantStatus.Active) >= MaxParticipants)
                throw new InvalidOperationException("Session has reached maximum participant capacity");

            var participant = new SessionParticipant(userId, role, characterName, DateTime.UtcNow);
            Participants.Add(participant);
            UpdatedAt = DateTime.UtcNow;

            AddSessionEvent(SessionEventType.ParticipantJoined, $"Participant joined as {role}", characterName);
            AddDomainEvent(new ParticipantJoinedSessionEvent(Id, userId, role, characterName));
        }

        public void RemoveParticipant(Guid userId, string reason)
        {
            var participant = Participants.FirstOrDefault(p => p.UserId == userId && p.Status == ParticipantStatus.Active);
            if (participant == null)
                throw new InvalidOperationException("User is not an active participant");

            participant.Leave(reason);
            UpdatedAt = DateTime.UtcNow;

            // Disconnect user's connections
            var userConnections = ActiveConnections.Where(c => c.UserId == userId).ToList();
            foreach (var connection in userConnections)
            {
                connection.Disconnect("Participant removed");
            }

            AddSessionEvent(SessionEventType.ParticipantLeft, "Participant left", reason);
            AddDomainEvent(new ParticipantLeftSessionEvent(Id, userId, reason));
        }

        public void AddConnection(string connectionId, Guid userId, string userAgent, string ipAddress)
        {
            var participant = Participants.FirstOrDefault(p => p.UserId == userId && p.Status == ParticipantStatus.Active);
            if (participant == null)
                throw new InvalidOperationException("User is not an active participant");

            // Disconnect existing connections for this user if single connection mode
            if (Settings.SingleConnectionPerUser)
            {
                var existingConnections = ActiveConnections.Where(c => c.UserId == userId && c.IsConnected).ToList();
                foreach (var existing in existingConnections)
                {
                    existing.Disconnect("New connection established");
                }
            }

            var connection = new ActiveConnection(connectionId, userId, userAgent, ipAddress, DateTime.UtcNow);
            ActiveConnections.Add(connection);
            UpdatedAt = DateTime.UtcNow;

            AddDomainEvent(new ParticipantConnectedEvent(Id, userId, connectionId));
        }

        public void RemoveConnection(string connectionId, string reason)
        {
            var connection = ActiveConnections.FirstOrDefault(c => c.ConnectionId == connectionId);
            if (connection != null)
            {
                connection.Disconnect(reason);
                UpdatedAt = DateTime.UtcNow;

                AddDomainEvent(new ParticipantDisconnectedEvent(Id, connection.UserId, connectionId, reason));
            }
        }

        public void SendChatMessage(Guid senderId, string message, ChatMessageType messageType = ChatMessageType.General)
        {
            if (string.IsNullOrWhiteSpace(message))
                throw new ArgumentException("Message cannot be empty", nameof(message));

            var participant = Participants.FirstOrDefault(p => p.UserId == senderId && p.Status == ParticipantStatus.Active);
            if (participant == null)
                throw new InvalidOperationException("Sender is not an active participant");

            var chatMessage = new ChatMessage(senderId, message, messageType, DateTime.UtcNow);
            ChatMessages.Add(chatMessage);
            
            // Limit chat history
            if (ChatMessages.Count > 1000)
            {
                ChatMessages.RemoveRange(0, ChatMessages.Count - 1000);
            }

            UpdatedAt = DateTime.UtcNow;
            IncrementStateVersion();

            AddDomainEvent(new ChatMessageSentEvent(Id, senderId, message, messageType));
        }

        public DiceRollResult RollDice(Guid rollerId, DiceExpression diceExpression, string? context = null, bool isSecret = false)
        {
            var participant = Participants.FirstOrDefault(p => p.UserId == rollerId && p.Status == ParticipantStatus.Active);
            if (participant == null)
                throw new InvalidOperationException("Roller is not an active participant");

            var rollResult = diceExpression.Roll();
            var diceRoll = new DiceRoll(
                rollerId, 
                diceExpression.ToString(), 
                rollResult.Total, 
                rollResult.IndividualRolls, 
                context, 
                isSecret, 
                DateTime.UtcNow);

            DiceRolls.Add(diceRoll);
            
            // Limit dice roll history
            if (DiceRolls.Count > 500)
            {
                DiceRolls.RemoveRange(0, DiceRolls.Count - 500);
            }

            UpdatedAt = DateTime.UtcNow;
            IncrementStateVersion();

            AddDomainEvent(new DiceRolledEvent(Id, rollerId, diceExpression.ToString(), rollResult, context, isSecret));

            return rollResult;
        }

        public void StartCombat(List<InitiativeEntry> initiativeOrder)
        {
            if (CombatState?.IsActive == true)
                throw new InvalidOperationException("Combat is already active");

            if (!initiativeOrder.Any())
                throw new ArgumentException("Initiative order cannot be empty", nameof(initiativeOrder));

            CombatState = new CombatState(true, DateTime.UtcNow);
            Initiative = new List<InitiativeEntry>(initiativeOrder.OrderByDescending(i => i.Initiative));
            CurrentTurn = 0;
            Round = 1;
            UpdatedAt = DateTime.UtcNow;
            IncrementStateVersion();

            AddSessionEvent(SessionEventType.CombatStarted, "Combat started", $"{Initiative.Count} combatants");
            AddDomainEvent(new CombatStartedEvent(Id, Initiative));
        }

        public void NextTurn()
        {
            if (CombatState?.IsActive != true)
                throw new InvalidOperationException("Combat is not active");

            CurrentTurn = (CurrentTurn + 1) % Initiative.Count;
            
            if (CurrentTurn == 0)
            {
                Round++;
                AddSessionEvent(SessionEventType.CombatRoundAdvanced, $"Advanced to round {Round}");
            }

            var currentCombatant = Initiative[CurrentTurn.Value];
            UpdatedAt = DateTime.UtcNow;
            IncrementStateVersion();

            AddDomainEvent(new CombatTurnChangedEvent(Id, CurrentTurn.Value, currentCombatant, Round.Value));
        }

        public void EndCombat(string? reason = null)
        {
            if (CombatState?.IsActive != true)
                throw new InvalidOperationException("Combat is not active");

            CombatState = CombatState.End();
            CurrentTurn = null;
            UpdatedAt = DateTime.UtcNow;
            IncrementStateVersion();

            AddSessionEvent(SessionEventType.CombatEnded, "Combat ended", reason);
            AddDomainEvent(new CombatEndedEvent(Id, reason, Round ?? 1));
        }

        public void UpdateMapState(MapState newMapState, Guid updatedBy)
        {
            var participant = Participants.FirstOrDefault(p => p.UserId == updatedBy && p.Status == ParticipantStatus.Active);
            if (participant == null)
                throw new InvalidOperationException("Updater is not an active participant");

            // Only GM can update map state by default
            if (participant.Role != ParticipantRole.GameMaster && !Settings.AllowPlayerMapUpdates)
                throw new UnauthorizedAccessException("Only Game Master can update map state");

            MapState = newMapState;
            UpdatedAt = DateTime.UtcNow;
            IncrementStateVersion();

            AddDomainEvent(new MapStateUpdatedEvent(Id, updatedBy, newMapState));
        }

        public void AddToken(Token token, Guid addedBy)
        {
            var participant = Participants.FirstOrDefault(p => p.UserId == addedBy && p.Status == ParticipantStatus.Active);
            if (participant == null)
                throw new InvalidOperationException("User is not an active participant");

            Tokens.Add(token);
            UpdatedAt = DateTime.UtcNow;
            IncrementStateVersion();

            AddDomainEvent(new TokenAddedEvent(Id, addedBy, token));
        }

        public void UpdateToken(Guid tokenId, TokenPosition newPosition, Guid updatedBy)
        {
            var participant = Participants.FirstOrDefault(p => p.UserId == updatedBy && p.Status == ParticipantStatus.Active);
            if (participant == null)
                throw new InvalidOperationException("User is not an active participant");

            var token = Tokens.FirstOrDefault(t => t.Id == tokenId);
            if (token == null)
                throw new InvalidOperationException("Token not found");

            // Check if user can move this token
            if (!CanUserMoveToken(participant, token))
                throw new UnauthorizedAccessException("User cannot move this token");

            token.UpdatePosition(newPosition);
            UpdatedAt = DateTime.UtcNow;
            IncrementStateVersion();

            AddDomainEvent(new TokenMovedEvent(Id, updatedBy, tokenId, newPosition));
        }

        public void ResolveConflict(StateConflict conflict, ConflictResolution resolution, Guid resolvedBy)
        {
            var existingConflict = PendingConflicts.FirstOrDefault(c => c.Id == conflict.Id);
            if (existingConflict == null)
                throw new InvalidOperationException("Conflict not found");

            existingConflict.Resolve(resolution, resolvedBy);
            UpdatedAt = DateTime.UtcNow;
            IncrementStateVersion();

            AddDomainEvent(new ConflictResolvedEvent(Id, conflict.Id, resolution, resolvedBy));
        }

        public void AddStateConflict(StateConflict conflict)
        {
            PendingConflicts.Add(conflict);
            UpdatedAt = DateTime.UtcNow;

            AddDomainEvent(new StateConflictDetectedEvent(Id, conflict));
        }

        private void AddSessionEvent(SessionEventType eventType, string description, string? details = null)
        {
            var sessionEvent = new SessionEvent(eventType, description, details, DateTime.UtcNow);
            Events.Add(sessionEvent);

            // Limit event history
            if (Events.Count > 1000)
            {
                Events.RemoveRange(0, Events.Count - 1000);
            }
        }

        private void IncrementStateVersion()
        {
            StateVersion++;
        }

        private bool CanUserMoveToken(SessionParticipant participant, Token token)
        {
            // GM can move any token
            if (participant.Role == ParticipantRole.GameMaster)
                return true;

            // Players can only move their own character tokens
            return token.OwnerId == participant.UserId;
        }

        public List<string> GetConnectedUserIds()
        {
            return ActiveConnections
                .Where(c => c.IsConnected)
                .Select(c => c.UserId.ToString())
                .Distinct()
                .ToList();
        }

        public int GetActiveParticipantCount()
        {
            return Participants.Count(p => p.Status == ParticipantStatus.Active);
        }

        public int GetConnectedParticipantCount()
        {
            var connectedUserIds = ActiveConnections
                .Where(c => c.IsConnected)
                .Select(c => c.UserId)
                .Distinct();

            return Participants
                .Where(p => p.Status == ParticipantStatus.Active && connectedUserIds.Contains(p.UserId))
                .Count();
        }
    }

    public enum SessionStatus
    {
        Scheduled = 0,
        Waiting = 1,
        Active = 2,
        Paused = 3,
        Completed = 4,
        Cancelled = 5
    }

    public enum SessionPhase
    {
        PreSession = 0,
        InSession = 1,
        PostSession = 2
    }

    public enum ParticipantRole
    {
        Player = 0,
        GameMaster = 1,
        Observer = 2,
        CoGameMaster = 3
    }

    public enum ParticipantStatus
    {
        Active = 0,
        Disconnected = 1,
        Left = 2,
        Kicked = 3
    }

    public enum SessionEventType
    {
        SessionStarted = 0,
        SessionEnded = 1,
        SessionPaused = 2,
        SessionResumed = 3,
        ParticipantJoined = 4,
        ParticipantLeft = 5,
        CombatStarted = 6,
        CombatEnded = 7,
        CombatRoundAdvanced = 8,
        MapUpdated = 9,
        TokenMoved = 10,
        DiceRolled = 11,
        ChatMessage = 12
    }

    public enum ChatMessageType
    {
        General = 0,
        InCharacter = 1,
        OutOfCharacter = 2,
        Whisper = 3,
        System = 4,
        Combat = 5,
        DiceRoll = 6
    }
}
```

### Real-time Value Objects
```csharp
// Domain/ValueObjects/SessionState.cs
namespace RealtimeService.Domain.ValueObjects
{
    public class SessionState : ValueObject
    {
        public string CurrentScene { get; private set; }
        public string? CurrentLocation { get; private set; }
        public Dictionary<string, object> SharedState { get; private set; }
        public List<string> ActiveEffects { get; private set; }
        public Dictionary<string, string> Variables { get; private set; }
        public DateTime LastUpdated { get; private set; }

        private SessionState() 
        { 
            SharedState = new Dictionary<string, object>();
            ActiveEffects = new List<string>();
            Variables = new Dictionary<string, string>();
        }

        public SessionState(
            string currentScene,
            string? currentLocation = null,
            Dictionary<string, object>? sharedState = null,
            List<string>? activeEffects = null,
            Dictionary<string, string>? variables = null)
        {
            CurrentScene = currentScene ?? throw new ArgumentNullException(nameof(currentScene));
            CurrentLocation = currentLocation;
            SharedState = sharedState ?? new Dictionary<string, object>();
            ActiveEffects = activeEffects ?? new List<string>();
            Variables = variables ?? new Dictionary<string, string>();
            LastUpdated = DateTime.UtcNow;
        }

        public static SessionState Default()
        {
            return new SessionState("Pre-session");
        }

        public SessionState UpdateScene(string newScene, string? newLocation = null)
        {
            return new SessionState(
                newScene,
                newLocation ?? CurrentLocation,
                SharedState,
                ActiveEffects,
                Variables);
        }

        public SessionState SetVariable(string key, string value)
        {
            var newVariables = new Dictionary<string, string>(Variables)
            {
                [key] = value
            };

            return new SessionState(
                CurrentScene,
                CurrentLocation,
                SharedState,
                ActiveEffects,
                newVariables);
        }

        public SessionState AddEffect(string effect)
        {
            var newEffects = new List<string>(ActiveEffects);
            if (!newEffects.Contains(effect))
                newEffects.Add(effect);

            return new SessionState(
                CurrentScene,
                CurrentLocation,
                SharedState,
                newEffects,
                Variables);
        }

        public SessionState RemoveEffect(string effect)
        {
            var newEffects = new List<string>(ActiveEffects);
            newEffects.Remove(effect);

            return new SessionState(
                CurrentScene,
                CurrentLocation,
                SharedState,
                newEffects,
                Variables);
        }

        protected override IEnumerable<object> GetEqualityComponents()
        {
            yield return CurrentScene;
            yield return CurrentLocation ?? string.Empty;
            foreach (var kvp in SharedState.OrderBy(kv => kv.Key))
                yield return $"{kvp.Key}:{kvp.Value}";
            foreach (var effect in ActiveEffects)
                yield return effect;
            foreach (var variable in Variables.OrderBy(kv => kv.Key))
                yield return $"{variable.Key}:{variable.Value}";
        }
    }

    public class DiceExpression : ValueObject
    {
        public int Count { get; private set; }
        public int Sides { get; private set; }
        public int Modifier { get; private set; }
        public DiceType DiceType { get; private set; }

        private DiceExpression() { }

        public DiceExpression(int count, int sides, int modifier = 0, DiceType diceType = DiceType.Standard)
        {
            if (count <= 0)
                throw new ArgumentException("Dice count must be positive", nameof(count));
            if (sides <= 0)
                throw new ArgumentException("Dice sides must be positive", nameof(sides));

            Count = count;
            Sides = sides;
            Modifier = modifier;
            DiceType = diceType;
        }

        public static DiceExpression Parse(string expression)
        {
            // Parse expressions like "1d20+5", "2d6", "1d20-2"
            var regex = new Regex(@"(\d+)d(\d+)([+-]\d+)?", RegexOptions.IgnoreCase);
            var match = regex.Match(expression.Trim());

            if (!match.Success)
                throw new ArgumentException($"Invalid dice expression: {expression}");

            var count = int.Parse(match.Groups[1].Value);
            var sides = int.Parse(match.Groups[2].Value);
            var modifier = 0;

            if (match.Groups[3].Success)
            {
                modifier = int.Parse(match.Groups[3].Value);
            }

            return new DiceExpression(count, sides, modifier);
        }

        public DiceRollResult Roll()
        {
            var random = new Random();
            var rolls = new List<int>();

            for (int i = 0; i < Count; i++)
            {
                rolls.Add(random.Next(1, Sides + 1));
            }

            var total = rolls.Sum() + Modifier;

            return new DiceRollResult(rolls, total, Modifier);
        }

        public override string ToString()
        {
            var expression = $"{Count}d{Sides}";
            if (Modifier > 0)
                expression += $"+{Modifier}";
            else if (Modifier < 0)
                expression += $"{Modifier}";

            return expression;
        }

        protected override IEnumerable<object> GetEqualityComponents()
        {
            yield return Count;
            yield return Sides;
            yield return Modifier;
            yield return DiceType;
        }
    }

    public class DiceRollResult : ValueObject
    {
        public List<int> IndividualRolls { get; private set; }
        public int Total { get; private set; }
        public int Modifier { get; private set; }
        public int RollTotal => IndividualRolls.Sum();

        private DiceRollResult() 
        { 
            IndividualRolls = new List<int>();
        }

        public DiceRollResult(List<int> individualRolls, int total, int modifier)
        {
            IndividualRolls = individualRolls ?? throw new ArgumentNullException(nameof(individualRolls));
            Total = total;
            Modifier = modifier;
        }

        protected override IEnumerable<object> GetEqualityComponents()
        {
            foreach (var roll in IndividualRolls)
                yield return roll;
            yield return Total;
            yield return Modifier;
        }
    }

    public enum DiceType
    {
        Standard = 0,
        Advantage = 1,
        Disadvantage = 2
    }

    public class Token : ValueObject
    {
        public Guid Id { get; private set; }
        public string Name { get; private set; }
        public Guid? OwnerId { get; private set; }
        public TokenType Type { get; private set; }
        public TokenPosition Position { get; private set; }
        public string? ImageUrl { get; private set; }
        public TokenSize Size { get; private set; }
        public bool IsVisible { get; private set; }
        public Dictionary<string, object> Properties { get; private set; }

        private Token() 
        { 
            Properties = new Dictionary<string, object>();
        }

        public Token(
            string name,
            TokenType type,
            TokenPosition position,
            Guid? ownerId = null,
            string? imageUrl = null,
            TokenSize size = TokenSize.Medium,
            bool isVisible = true,
            Dictionary<string, object>? properties = null)
        {
            Id = Guid.NewGuid();
            Name = name ?? throw new ArgumentNullException(nameof(name));
            Type = type;
            Position = position ?? throw new ArgumentNullException(nameof(position));
            OwnerId = ownerId;
            ImageUrl = imageUrl;
            Size = size;
            IsVisible = isVisible;
            Properties = properties ?? new Dictionary<string, object>();
        }

        public Token UpdatePosition(TokenPosition newPosition)
        {
            return new Token(Name, Type, newPosition, OwnerId, ImageUrl, Size, IsVisible, Properties)
            {
                Id = Id
            };
        }

        protected override IEnumerable<object> GetEqualityComponents()
        {
            yield return Id;
            yield return Name;
            yield return OwnerId ?? Guid.Empty;
            yield return Type;
            yield return Position;
            yield return Size;
            yield return IsVisible;
        }
    }

    public class TokenPosition : ValueObject
    {
        public int X { get; private set; }
        public int Y { get; private set; }
        public int? Z { get; private set; } // For elevation
        public float Rotation { get; private set; }

        private TokenPosition() { }

        public TokenPosition(int x, int y, int? z = null, float rotation = 0f)
        {
            X = x;
            Y = y;
            Z = z;
            Rotation = rotation;
        }

        protected override IEnumerable<object> GetEqualityComponents()
        {
            yield return X;
            yield return Y;
            yield return Z ?? 0;
            yield return Rotation;
        }
    }

    public enum TokenType
    {
        PlayerCharacter = 0,
        NPC = 1,
        Monster = 2,
        Object = 3,
        Marker = 4
    }

    public enum TokenSize
    {
        Tiny = 0,
        Small = 1,
        Medium = 2,
        Large = 3,
        Huge = 4,
        Gargantuan = 5
    }
}
```

### SignalR Hub Implementation
```csharp
// Infrastructure/SignalR/SessionHub.cs
using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Authorization;
using RealtimeService.Application.Services;
using RealtimeService.Domain.ValueObjects;

namespace RealtimeService.Infrastructure.SignalR
{
    [Authorize]
    public class SessionHub : Hub<ISessionClient>
    {
        private readonly ISessionService _sessionService;
        private readonly IConnectionManager _connectionManager;
        private readonly ILogger<SessionHub> _logger;

        public SessionHub(
            ISessionService sessionService,
            IConnectionManager connectionManager,
            ILogger<SessionHub> logger)
        {
            _sessionService = sessionService;
            _connectionManager = connectionManager;
            _logger = logger;
        }

        public async Task JoinSession(string sessionId)
        {
            var userId = GetUserId();
            var sessionGuid = Guid.Parse(sessionId);

            _logger.LogInformation("User {UserId} joining session {SessionId} with connection {ConnectionId}", 
                userId, sessionId, Context.ConnectionId);

            try
            {
                // Validate user can join session
                var canJoin = await _sessionService.CanUserJoinSessionAsync(sessionGuid, userId);
                if (!canJoin)
                {
                    await Clients.Caller.OnError("Access denied", "You do not have permission to join this session");
                    return;
                }

                // Add connection to session
                await _sessionService.AddConnectionAsync(sessionGuid, Context.ConnectionId, userId, 
                    Context.GetHttpContext()?.Request.Headers.UserAgent ?? "Unknown",
                    Context.GetHttpContext()?.Connection.RemoteIpAddress?.ToString() ?? "Unknown");

                // Join SignalR group
                await Groups.AddToGroupAsync(Context.ConnectionId, $"session_{sessionId}");

                // Register connection
                await _connectionManager.RegisterConnectionAsync(Context.ConnectionId, userId, sessionGuid);

                // Send current session state
                var sessionState = await _sessionService.GetSessionStateAsync(sessionGuid);
                await Clients.Caller.OnSessionStateUpdated(sessionState);

                // Notify other participants
                await Clients.OthersInGroup($"session_{sessionId}")
                    .OnParticipantConnected(userId.ToString(), Context.ConnectionId);

                _logger.LogInformation("User {UserId} successfully joined session {SessionId}", userId, sessionId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error joining session {SessionId} for user {UserId}", sessionId, userId);
                await Clients.Caller.OnError("Join failed", ex.Message);
            }
        }

        public async Task LeaveSession(string sessionId)
        {
            var userId = GetUserId();
            var sessionGuid = Guid.Parse(sessionId);

            _logger.LogInformation("User {UserId} leaving session {SessionId}", userId, sessionId);

            try
            {
                // Remove connection from session
                await _sessionService.RemoveConnectionAsync(sessionGuid, Context.ConnectionId, "User left");

                // Leave SignalR group
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"session_{sessionId}");

                // Unregister connection
                await _connectionManager.UnregisterConnectionAsync(Context.ConnectionId);

                // Notify other participants
                await Clients.OthersInGroup($"session_{sessionId}")
                    .OnParticipantDisconnected(userId.ToString(), Context.ConnectionId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error leaving session {SessionId} for user {UserId}", sessionId, userId);
            }
        }

        public async Task SendChatMessage(string sessionId, string message, string messageType = "General")
        {
            var userId = GetUserId();
            var sessionGuid = Guid.Parse(sessionId);

            try
            {
                var chatMessageType = Enum.Parse<ChatMessageType>(messageType, true);
                var result = await _sessionService.SendChatMessageAsync(sessionGuid, userId, message, chatMessageType);

                // Broadcast to all session participants
                await Clients.Group($"session_{sessionId}")
                    .OnChatMessageReceived(result.MessageId, userId.ToString(), message, messageType, result.Timestamp);

                _logger.LogDebug("Chat message sent in session {SessionId} by user {UserId}", sessionId, userId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending chat message in session {SessionId}", sessionId);
                await Clients.Caller.OnError("Message failed", ex.Message);
            }
        }

        public async Task RollDice(string sessionId, string diceExpression, string? context = null, bool isSecret = false)
        {
            var userId = GetUserId();
            var sessionGuid = Guid.Parse(sessionId);

            try
            {
                var dice = DiceExpression.Parse(diceExpression);
                var result = await _sessionService.RollDiceAsync(sessionGuid, userId, dice, context, isSecret);

                // Broadcast dice roll result
                var recipients = isSecret 
                    ? Clients.Caller 
                    : Clients.Group($"session_{sessionId}");

                await recipients.OnDiceRolled(
                    result.RollId,
                    userId.ToString(),
                    diceExpression,
                    result.Result.IndividualRolls,
                    result.Result.Total,
                    context,
                    isSecret,
                    result.Timestamp);

                _logger.LogDebug("Dice rolled in session {SessionId}: {Expression} = {Total}", 
                    sessionId, diceExpression, result.Result.Total);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error rolling dice in session {SessionId}", sessionId);
                await Clients.Caller.OnError("Dice roll failed", ex.Message);
            }
        }

        public async Task UpdateTokenPosition(string sessionId, string tokenId, int x, int y, float rotation = 0f)
        {
            var userId = GetUserId();
            var sessionGuid = Guid.Parse(sessionId);
            var tokenGuid = Guid.Parse(tokenId);

            try
            {
                var newPosition = new TokenPosition(x, y, rotation: rotation);
                await _sessionService.UpdateTokenPositionAsync(sessionGuid, tokenGuid, newPosition, userId);

                // Broadcast token movement
                await Clients.Group($"session_{sessionId}")
                    .OnTokenMoved(tokenId, x, y, rotation, userId.ToString());

                _logger.LogDebug("Token {TokenId} moved in session {SessionId} to ({X}, {Y})", 
                    tokenId, sessionId, x, y);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error moving token in session {SessionId}", sessionId);
                await Clients.Caller.OnError("Token move failed", ex.Message);
            }
        }

        public async Task StartCombat(string sessionId, List<InitiativeEntryDto> initiativeOrder)
        {
            var userId = GetUserId();
            var sessionGuid = Guid.Parse(sessionId);

            try
            {
                // Only GM can start combat
                var isGM = await _sessionService.IsUserGameMasterAsync(sessionGuid, userId);
                if (!isGM)
                {
                    await Clients.Caller.OnError("Access denied", "Only Game Master can start combat");
                    return;
                }

                var initiative = initiativeOrder.Select(i => new InitiativeEntry(
                    i.Name, i.Initiative, i.IsPlayer, Guid.Parse(i.Id))).ToList();

                await _sessionService.StartCombatAsync(sessionGuid, initiative);

                // Broadcast combat start
                await Clients.Group($"session_{sessionId}")
                    .OnCombatStarted(initiativeOrder);

                _logger.LogInformation("Combat started in session {SessionId} with {Count} combatants", 
                    sessionId, initiative.Count);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error starting combat in session {SessionId}", sessionId);
                await Clients.Caller.OnError("Combat start failed", ex.Message);
            }
        }

        public async Task NextTurn(string sessionId)
        {
            var userId = GetUserId();
            var sessionGuid = Guid.Parse(sessionId);

            try
            {
                // Only GM can advance turns
                var isGM = await _sessionService.IsUserGameMasterAsync(sessionGuid, userId);
                if (!isGM)
                {
                    await Clients.Caller.OnError("Access denied", "Only Game Master can advance turns");
                    return;
                }

                var result = await _sessionService.NextTurnAsync(sessionGuid);

                // Broadcast turn change
                await Clients.Group($"session_{sessionId}")
                    .OnTurnChanged(result.CurrentTurn, result.CurrentCombatant, result.Round);

                _logger.LogDebug("Turn advanced in session {SessionId} to {Combatant}", 
                    sessionId, result.CurrentCombatant);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error advancing turn in session {SessionId}", sessionId);
                await Clients.Caller.OnError("Turn advance failed", ex.Message);
            }
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var userId = GetUserId();
            
            try
            {
                var connectionInfo = await _connectionManager.GetConnectionInfoAsync(Context.ConnectionId);
                if (connectionInfo != null)
                {
                    await _sessionService.RemoveConnectionAsync(
                        connectionInfo.SessionId, 
                        Context.ConnectionId, 
                        exception?.Message ?? "Disconnected");

                    await _connectionManager.UnregisterConnectionAsync(Context.ConnectionId);

                    // Notify session participants
                    await Clients.Group($"session_{connectionInfo.SessionId}")
                        .OnParticipantDisconnected(userId.ToString(), Context.ConnectionId);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error handling disconnection for user {UserId}", userId);
            }

            await base.OnDisconnectedAsync(exception);
        }

        private Guid GetUserId()
        {
            var userIdClaim = Context.User?.FindFirst("sub") ?? Context.User?.FindFirst("id");
            if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out var userId))
                throw new UnauthorizedAccessException("Invalid user ID");

            return userId;
        }
    }

    // Client interface for strongly-typed SignalR
    public interface ISessionClient
    {
        Task OnSessionStateUpdated(object sessionState);
        Task OnParticipantConnected(string userId, string connectionId);
        Task OnParticipantDisconnected(string userId, string connectionId);
        Task OnChatMessageReceived(string messageId, string senderId, string message, string messageType, DateTime timestamp);
        Task OnDiceRolled(string rollId, string rollerId, string expression, List<int> rolls, int total, string? context, bool isSecret, DateTime timestamp);
        Task OnTokenMoved(string tokenId, int x, int y, float rotation, string movedBy);
        Task OnCombatStarted(List<InitiativeEntryDto> initiative);
        Task OnTurnChanged(int currentTurn, string currentCombatant, int round);
        Task OnCombatEnded(string? reason, int finalRound);
        Task OnMapStateUpdated(object mapState);
        Task OnError(string errorType, string message);
        Task OnConflictDetected(string conflictId, string conflictType, object conflictData);
    }

    public class InitiativeEntryDto
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public int Initiative { get; set; }
        public bool IsPlayer { get; set; }
    }
}
```

This Real-time Service specification provides:

1. **Comprehensive Session Management** - Complete live session lifecycle with state tracking
2. **Advanced SignalR Integration** - Strongly-typed hubs with real-time communication
3. **Conflict Resolution** - CRDT-based algorithms for handling concurrent updates
4. **Combat System** - Initiative tracking, turn management, and combat state
5. **Interactive Features** - Dice rolling, chat, token movement, map updates
6. **Connection Management** - Robust connection tracking and recovery
7. **State Synchronization** - Consistent state across all connected clients
8. **Performance Optimization** - Redis backplane for scaling and caching
9. **API Consistency** - Aligns with `design/api/realtime-api.md` specifications
10. **Database Alignment** - Matches schema from `design/database/realtime-session.md`

The implementation provides a complete real-time collaboration system that enables seamless D&D session experiences with live updates, interactive features, and robust conflict resolution.

<function_calls>
<invoke name="todo_write">
<parameter name="merge">true
