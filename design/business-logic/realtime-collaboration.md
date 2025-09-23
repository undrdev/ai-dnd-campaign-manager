# Real-time Collaboration Business Logic

## Overview
This document defines the comprehensive business logic for real-time collaboration within the D&D AI Campaign Management System. It covers live session management, synchronized state updates, conflict resolution, real-time communication, collaborative editing, and the orchestration of multiple users interacting simultaneously in a shared gaming environment.

## Domain Model

### Real-time Session Manager
```csharp
public class RealtimeSessionManager : IDomainService
{
    private readonly ISignalRHubContext _hubContext;
    private readonly ISessionStateRepository _sessionStateRepository;
    private readonly IConflictResolver _conflictResolver;
    private readonly IConnectionManager _connectionManager;
    private readonly IEventSynchronizer _eventSynchronizer;
    private readonly ILogger<RealtimeSessionManager> _logger;

    public async Task<Result<LiveSession>> StartLiveSessionAsync(StartLiveSessionRequest request)
    {
        // Validate session can be started
        var session = await _sessionRepository.GetByIdAsync(request.SessionId);
        if (session == null)
        {
            return Result.Failure<LiveSession>("Session not found");
        }

        if (session.Status != SessionStatus.Scheduled)
        {
            return Result.Failure<LiveSession>("Session must be scheduled to start live session");
        }

        // Create live session state
        var liveSession = LiveSession.Create(
            sessionId: request.SessionId,
            campaignId: session.CampaignId,
            dungeonMasterId: request.DungeonMasterId,
            maxParticipants: session.MaxParticipants
        );

        // Initialize session state
        var sessionState = await InitializeSessionStateAsync(session);
        liveSession.SetSessionState(sessionState);

        // Store live session
        await _sessionStateRepository.StoreLiveSessionAsync(liveSession);

        // Notify participants
        await NotifySessionStartedAsync(liveSession);

        _logger.LogInformation("Live session started: {SessionId}", request.SessionId);
        return Result.Success(liveSession);
    }

    public async Task<Result> JoinLiveSessionAsync(JoinSessionRequest request)
    {
        var liveSession = await _sessionStateRepository.GetLiveSessionAsync(request.SessionId);
        if (liveSession == null)
        {
            return Result.Failure("Live session not found");
        }

        // Validate user can join
        var validationResult = await ValidateUserCanJoinAsync(liveSession, request.UserId, request.CharacterId);
        if (validationResult.IsFailure)
        {
            return validationResult;
        }

        // Add participant
        var participant = SessionParticipant.Create(
            userId: request.UserId,
            characterId: request.CharacterId,
            role: request.Role,
            connectionId: request.ConnectionId
        );

        liveSession.AddParticipant(participant);

        // Add to SignalR group
        await _hubContext.Groups.AddToGroupAsync(request.ConnectionId, $"session_{request.SessionId}");

        // Send current session state to new participant
        await SendSessionStateToParticipantAsync(liveSession, participant);

        // Notify other participants
        await NotifyParticipantJoinedAsync(liveSession, participant);

        // Update connection tracking
        await _connectionManager.TrackConnectionAsync(request.ConnectionId, request.UserId, request.SessionId);

        return Result.Success();
    }

    public async Task<Result> ProcessRealtimeActionAsync(RealtimeActionRequest request)
    {
        var liveSession = await _sessionStateRepository.GetLiveSessionAsync(request.SessionId);
        if (liveSession == null)
        {
            return Result.Failure("Live session not found");
        }

        // Validate action
        var validationResult = await ValidateRealtimeActionAsync(liveSession, request);
        if (validationResult.IsFailure)
        {
            return validationResult;
        }

        // Check for conflicts
        var conflictResult = await _conflictResolver.CheckForConflictsAsync(liveSession, request);
        if (conflictResult.HasConflicts)
        {
            return await HandleActionConflictAsync(liveSession, request, conflictResult);
        }

        // Apply action to session state
        var actionResult = await ApplyActionToSessionStateAsync(liveSession, request);
        if (actionResult.IsFailure)
        {
            return actionResult;
        }

        // Synchronize state across all participants
        await SynchronizeSessionStateAsync(liveSession, request.ActionId);

        // Store action in history
        await StoreActionHistoryAsync(liveSession, request, actionResult.Value);

        return Result.Success();
    }
}

public class LiveSession : Entity, IAggregateRoot
{
    public string Id { get; private set; }
    public string SessionId { get; private set; }
    public string CampaignId { get; private set; }
    public string DungeonMasterId { get; private set; }
    public LiveSessionStatus Status { get; private set; }
    public DateTime StartedAt { get; private set; }
    public DateTime? EndedAt { get; private set; }
    public int MaxParticipants { get; private set; }
    public List<SessionParticipant> Participants { get; private set; } = new();
    public SessionState SessionState { get; private set; }
    public List<RealtimeAction> ActionHistory { get; private set; } = new();
    public Dictionary<string, object> SharedState { get; private set; } = new();
    public List<DomainEvent> DomainEvents { get; private set; } = new();

    public static LiveSession Create(string sessionId, string campaignId, string dungeonMasterId, int maxParticipants)
    {
        var liveSession = new LiveSession
        {
            Id = Guid.NewGuid().ToString(),
            SessionId = sessionId,
            CampaignId = campaignId,
            DungeonMasterId = dungeonMasterId,
            Status = LiveSessionStatus.Active,
            StartedAt = DateTime.UtcNow,
            MaxParticipants = maxParticipants
        };

        liveSession.AddDomainEvent(new LiveSessionStartedEvent(liveSession.Id, sessionId, campaignId));
        return liveSession;
    }

    public Result AddParticipant(SessionParticipant participant)
    {
        if (Participants.Count >= MaxParticipants)
        {
            return Result.Failure("Session is full");
        }

        if (Participants.Any(p => p.UserId == participant.UserId))
        {
            return Result.Failure("User is already in the session");
        }

        Participants.Add(participant);
        AddDomainEvent(new ParticipantJoinedEvent(Id, participant.UserId, participant.CharacterId));
        
        return Result.Success();
    }

    public Result RemoveParticipant(string userId, string reason = "")
    {
        var participant = Participants.FirstOrDefault(p => p.UserId == userId);
        if (participant == null)
        {
            return Result.Failure("Participant not found");
        }

        participant.Leave(reason);
        AddDomainEvent(new ParticipantLeftEvent(Id, userId, reason));
        
        return Result.Success();
    }

    public Result UpdateSessionState(SessionStateUpdate update)
    {
        var result = SessionState.ApplyUpdate(update);
        if (result.IsFailure)
        {
            return result;
        }

        AddDomainEvent(new SessionStateUpdatedEvent(Id, update.UpdateType, update.Data));
        return Result.Success();
    }

    public bool CanUserPerformAction(string userId, ActionType actionType)
    {
        var participant = Participants.FirstOrDefault(p => p.UserId == userId);
        if (participant == null || !participant.IsActive)
        {
            return false;
        }

        return actionType switch
        {
            ActionType.DMAction => userId == DungeonMasterId,
            ActionType.PlayerAction => participant.Role == ParticipantRole.Player,
            ActionType.ChatMessage => true,
            ActionType.DiceRoll => true,
            ActionType.MapInteraction => true,
            ActionType.CharacterUpdate => participant.CharacterId != null,
            _ => false
        };
    }
}

public class SessionParticipant : ValueObject
{
    public string UserId { get; private set; }
    public string? CharacterId { get; private set; }
    public ParticipantRole Role { get; private set; }
    public string ConnectionId { get; private set; }
    public DateTime JoinedAt { get; private set; }
    public DateTime? LeftAt { get; private set; }
    public bool IsActive { get; private set; }
    public ParticipantStatus Status { get; private set; }
    public Dictionary<string, object> UserState { get; private set; } = new();

    public static SessionParticipant Create(string userId, string? characterId, ParticipantRole role, string connectionId)
    {
        return new SessionParticipant
        {
            UserId = userId,
            CharacterId = characterId,
            Role = role,
            ConnectionId = connectionId,
            JoinedAt = DateTime.UtcNow,
            IsActive = true,
            Status = ParticipantStatus.Connected
        };
    }

    public void UpdateConnection(string newConnectionId)
    {
        ConnectionId = newConnectionId;
        Status = ParticipantStatus.Connected;
    }

    public void Disconnect()
    {
        Status = ParticipantStatus.Disconnected;
    }

    public void Leave(string reason = "")
    {
        IsActive = false;
        LeftAt = DateTime.UtcNow;
        Status = ParticipantStatus.Left;
    }
}

public enum LiveSessionStatus
{
    Starting,
    Active,
    Paused,
    Ending,
    Ended
}

public enum ParticipantRole
{
    DungeonMaster,
    Player,
    Observer,
    CoGameMaster
}

public enum ParticipantStatus
{
    Connected,
    Disconnected,
    Away,
    Left
}
```

## Real-time State Synchronization

### Session State Manager
```csharp
public class SessionStateManager : IDomainService
{
    private readonly IMemoryCache _stateCache;
    private readonly IEventSynchronizer _eventSynchronizer;
    private readonly IConflictResolver _conflictResolver;
    private readonly ISignalRHubContext _hubContext;

    public async Task<Result> SynchronizeStateUpdateAsync(LiveSession session, SessionStateUpdate update)
    {
        // Apply optimistic locking
        var currentVersion = session.SessionState.Version;
        if (update.ExpectedVersion != currentVersion)
        {
            // Version conflict detected
            var conflictResult = await _conflictResolver.ResolveVersionConflictAsync(session, update);
            if (conflictResult.IsFailure)
            {
                return conflictResult;
            }
            update = conflictResult.Value;
        }

        // Apply update to session state
        var applyResult = session.SessionState.ApplyUpdate(update);
        if (applyResult.IsFailure)
        {
            return applyResult;
        }

        // Update cache
        await UpdateStateCacheAsync(session);

        // Broadcast update to all participants
        await BroadcastStateUpdateAsync(session, update);

        return Result.Success();
    }

    public async Task<Result> HandleConcurrentUpdatesAsync(LiveSession session, List<SessionStateUpdate> updates)
    {
        // Sort updates by timestamp
        var sortedUpdates = updates.OrderBy(u => u.Timestamp).ToList();
        
        // Apply operational transformation if needed
        var transformedUpdates = await ApplyOperationalTransformAsync(sortedUpdates);

        // Apply updates sequentially
        foreach (var update in transformedUpdates)
        {
            var result = await SynchronizeStateUpdateAsync(session, update);
            if (result.IsFailure)
            {
                // Rollback previous updates if one fails
                await RollbackUpdatesAsync(session, transformedUpdates.TakeWhile(u => u != update));
                return result;
            }
        }

        return Result.Success();
    }

    private async Task<List<SessionStateUpdate>> ApplyOperationalTransformAsync(List<SessionStateUpdate> updates)
    {
        var transformedUpdates = new List<SessionStateUpdate>();
        
        for (int i = 0; i < updates.Count; i++)
        {
            var currentUpdate = updates[i];
            
            // Transform current update against all previous updates
            for (int j = 0; j < i; j++)
            {
                var previousUpdate = transformedUpdates[j];
                currentUpdate = await TransformUpdateAsync(currentUpdate, previousUpdate);
            }
            
            transformedUpdates.Add(currentUpdate);
        }
        
        return transformedUpdates;
    }

    private async Task<SessionStateUpdate> TransformUpdateAsync(SessionStateUpdate update, SessionStateUpdate against)
    {
        // Apply operational transformation rules based on update types
        return (update.UpdateType, against.UpdateType) switch
        {
            (StateUpdateType.CharacterPosition, StateUpdateType.CharacterPosition) => 
                await TransformPositionUpdatesAsync(update, against),
            
            (StateUpdateType.InitiativeOrder, StateUpdateType.InitiativeOrder) => 
                await TransformInitiativeUpdatesAsync(update, against),
            
            (StateUpdateType.MapState, StateUpdateType.MapState) => 
                await TransformMapUpdatesAsync(update, against),
            
            (StateUpdateType.CombatState, StateUpdateType.CombatState) => 
                await TransformCombatUpdatesAsync(update, against),
            
            _ => update // No transformation needed for non-conflicting update types
        };
    }
}

public class SessionState : ValueObject
{
    public int Version { get; private set; }
    public DateTime LastUpdated { get; private set; }
    public CombatState? CombatState { get; private set; }
    public MapState MapState { get; private set; }
    public List<CharacterState> CharacterStates { get; private set; } = new();
    public ChatState ChatState { get; private set; }
    public DiceRollHistory DiceRollHistory { get; private set; }
    public Dictionary<string, object> CustomState { get; private set; } = new();

    public Result ApplyUpdate(SessionStateUpdate update)
    {
        try
        {
            var result = update.UpdateType switch
            {
                StateUpdateType.CombatState => ApplyCombatStateUpdate(update),
                StateUpdateType.MapState => ApplyMapStateUpdate(update),
                StateUpdateType.CharacterPosition => ApplyCharacterPositionUpdate(update),
                StateUpdateType.CharacterHealth => ApplyCharacterHealthUpdate(update),
                StateUpdateType.InitiativeOrder => ApplyInitiativeOrderUpdate(update),
                StateUpdateType.ChatMessage => ApplyChatMessageUpdate(update),
                StateUpdateType.DiceRoll => ApplyDiceRollUpdate(update),
                StateUpdateType.CustomState => ApplyCustomStateUpdate(update),
                _ => Result.Failure($"Unknown update type: {update.UpdateType}")
            };

            if (result.IsSuccess)
            {
                Version++;
                LastUpdated = DateTime.UtcNow;
            }

            return result;
        }
        catch (Exception ex)
        {
            return Result.Failure($"Failed to apply state update: {ex.Message}");
        }
    }

    private Result ApplyCombatStateUpdate(SessionStateUpdate update)
    {
        var combatUpdate = update.GetData<CombatStateUpdate>();
        if (combatUpdate == null)
        {
            return Result.Failure("Invalid combat state update data");
        }

        if (CombatState == null && combatUpdate.Action == CombatAction.StartCombat)
        {
            CombatState = CombatState.Create(combatUpdate.Participants);
        }
        else if (CombatState != null)
        {
            var result = CombatState.ApplyUpdate(combatUpdate);
            if (result.IsFailure)
            {
                return result;
            }

            if (combatUpdate.Action == CombatAction.EndCombat)
            {
                CombatState = null;
            }
        }
        else
        {
            return Result.Failure("Invalid combat state transition");
        }

        return Result.Success();
    }

    private Result ApplyMapStateUpdate(SessionStateUpdate update)
    {
        var mapUpdate = update.GetData<MapStateUpdate>();
        if (mapUpdate == null)
        {
            return Result.Failure("Invalid map state update data");
        }

        return MapState.ApplyUpdate(mapUpdate);
    }

    private Result ApplyCharacterPositionUpdate(SessionStateUpdate update)
    {
        var positionUpdate = update.GetData<CharacterPositionUpdate>();
        if (positionUpdate == null)
        {
            return Result.Failure("Invalid character position update data");
        }

        var characterState = CharacterStates.FirstOrDefault(cs => cs.CharacterId == positionUpdate.CharacterId);
        if (characterState == null)
        {
            return Result.Failure("Character not found in session");
        }

        // Validate movement
        var movementResult = ValidateCharacterMovement(characterState, positionUpdate);
        if (movementResult.IsFailure)
        {
            return movementResult;
        }

        characterState.UpdatePosition(positionUpdate.NewPosition);
        return Result.Success();
    }

    private Result ValidateCharacterMovement(CharacterState characterState, CharacterPositionUpdate positionUpdate)
    {
        // Check if character has movement remaining
        if (characterState.MovementUsed >= characterState.MaxMovement)
        {
            return Result.Failure("Character has no movement remaining");
        }

        // Calculate distance
        var distance = CalculateDistance(characterState.Position, positionUpdate.NewPosition);
        var remainingMovement = characterState.MaxMovement - characterState.MovementUsed;

        if (distance > remainingMovement)
        {
            return Result.Failure($"Movement distance {distance} exceeds remaining movement {remainingMovement}");
        }

        // Check for obstacles
        if (MapState.HasObstaclesBetween(characterState.Position, positionUpdate.NewPosition))
        {
            return Result.Failure("Path is blocked by obstacles");
        }

        return Result.Success();
    }
}

public class SessionStateUpdate
{
    public string UpdateId { get; set; } = Guid.NewGuid().ToString();
    public StateUpdateType UpdateType { get; set; }
    public string UserId { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public int ExpectedVersion { get; set; }
    public Dictionary<string, object> Data { get; set; } = new();
    public string? Reason { get; set; }

    public T? GetData<T>() where T : class
    {
        if (Data.ContainsKey(typeof(T).Name))
        {
            return Data[typeof(T).Name] as T;
        }
        return null;
    }

    public void SetData<T>(T data) where T : class
    {
        Data[typeof(T).Name] = data;
    }
}

public enum StateUpdateType
{
    CombatState,
    MapState,
    CharacterPosition,
    CharacterHealth,
    InitiativeOrder,
    ChatMessage,
    DiceRoll,
    CustomState
}
```

## Real-time Communication

### Chat System
```csharp
public class RealtimeChatManager : IDomainService
{
    private readonly ISignalRHubContext _hubContext;
    private readonly IChatRepository _chatRepository;
    private readonly IContentModerationService _moderationService;
    private readonly IMessageEncryptionService _encryptionService;

    public async Task<Result> SendChatMessageAsync(SendChatMessageRequest request)
    {
        // Validate user is in session
        var liveSession = await _sessionStateRepository.GetLiveSessionAsync(request.SessionId);
        if (liveSession == null)
        {
            return Result.Failure("Live session not found");
        }

        var participant = liveSession.Participants.FirstOrDefault(p => p.UserId == request.UserId);
        if (participant == null || !participant.IsActive)
        {
            return Result.Failure("User is not an active participant in this session");
        }

        // Create chat message
        var message = ChatMessage.Create(
            sessionId: request.SessionId,
            userId: request.UserId,
            content: request.Content,
            messageType: request.MessageType,
            targetUserId: request.TargetUserId
        );

        // Apply content moderation
        var moderationResult = await _moderationService.ModerateMessageAsync(message.Content);
        if (moderationResult.HasViolations)
        {
            message.Flag(moderationResult.Violations);
            // Still allow the message but mark it as flagged
        }

        // Encrypt private messages
        if (message.MessageType == ChatMessageType.Private && !string.IsNullOrEmpty(request.TargetUserId))
        {
            message.Content = await _encryptionService.EncryptMessageAsync(message.Content, request.TargetUserId);
        }

        // Store message
        await _chatRepository.StoreChatMessageAsync(message);

        // Broadcast message based on type
        await BroadcastChatMessageAsync(liveSession, message);

        // Update session chat state
        liveSession.SessionState.ChatState.AddMessage(message);

        return Result.Success();
    }

    private async Task BroadcastChatMessageAsync(LiveSession session, ChatMessage message)
    {
        var groupName = $"session_{session.SessionId}";

        switch (message.MessageType)
        {
            case ChatMessageType.Public:
                await _hubContext.Clients.Group(groupName).SendAsync("ReceiveChatMessage", message);
                break;

            case ChatMessageType.Private:
                if (!string.IsNullOrEmpty(message.TargetUserId))
                {
                    var targetParticipant = session.Participants.FirstOrDefault(p => p.UserId == message.TargetUserId);
                    if (targetParticipant != null)
                    {
                        await _hubContext.Clients.Client(targetParticipant.ConnectionId).SendAsync("ReceivePrivateMessage", message);
                        
                        // Also send to sender
                        var senderParticipant = session.Participants.FirstOrDefault(p => p.UserId == message.UserId);
                        if (senderParticipant != null)
                        {
                            await _hubContext.Clients.Client(senderParticipant.ConnectionId).SendAsync("ReceivePrivateMessage", message);
                        }
                    }
                }
                break;

            case ChatMessageType.DMOnly:
                var dmParticipant = session.Participants.FirstOrDefault(p => p.UserId == session.DungeonMasterId);
                if (dmParticipant != null)
                {
                    await _hubContext.Clients.Client(dmParticipant.ConnectionId).SendAsync("ReceiveDMMessage", message);
                }
                break;

            case ChatMessageType.OutOfCharacter:
                await _hubContext.Clients.Group(groupName).SendAsync("ReceiveOOCMessage", message);
                break;

            case ChatMessageType.System:
                await _hubContext.Clients.Group(groupName).SendAsync("ReceiveSystemMessage", message);
                break;
        }
    }
}

public class ChatMessage : Entity
{
    public string Id { get; private set; }
    public string SessionId { get; private set; }
    public string UserId { get; private set; }
    public string? CharacterId { get; private set; }
    public string Content { get; set; }
    public ChatMessageType MessageType { get; private set; }
    public string? TargetUserId { get; private set; }
    public DateTime Timestamp { get; private set; }
    public bool IsFlagged { get; private set; }
    public List<string> Flags { get; private set; } = new();
    public bool IsEncrypted { get; private set; }
    public Dictionary<string, object> Metadata { get; private set; } = new();

    public static ChatMessage Create(string sessionId, string userId, string content, ChatMessageType messageType, string? targetUserId = null)
    {
        return new ChatMessage
        {
            Id = Guid.NewGuid().ToString(),
            SessionId = sessionId,
            UserId = userId,
            Content = content,
            MessageType = messageType,
            TargetUserId = targetUserId,
            Timestamp = DateTime.UtcNow
        };
    }

    public void Flag(List<string> violations)
    {
        IsFlagged = true;
        Flags.AddRange(violations);
    }

    public void SetCharacter(string characterId)
    {
        CharacterId = characterId;
    }

    public void Encrypt()
    {
        IsEncrypted = true;
    }
}

public enum ChatMessageType
{
    Public,
    Private,
    DMOnly,
    OutOfCharacter,
    System,
    RollResult,
    ActionResult
}
```

## Dice Rolling System

### Real-time Dice Manager
```csharp
public class RealtimeDiceManager : IDomainService
{
    private readonly IDiceRoller _diceRoller;
    private readonly ISignalRHubContext _hubContext;
    private readonly IDiceRollRepository _rollRepository;
    private readonly IRulesEngine _rulesEngine;

    public async Task<Result<DiceRollResult>> RollDiceAsync(RollDiceRequest request)
    {
        // Validate user is in session
        var liveSession = await _sessionStateRepository.GetLiveSessionAsync(request.SessionId);
        if (liveSession == null)
        {
            return Result.Failure<DiceRollResult>("Live session not found");
        }

        var participant = liveSession.Participants.FirstOrDefault(p => p.UserId == request.UserId);
        if (participant == null || !participant.IsActive)
        {
            return Result.Failure<DiceRollResult>("User is not an active participant");
        }

        // Validate dice expression
        if (!IsValidDiceExpression(request.DiceExpression))
        {
            return Result.Failure<DiceRollResult>("Invalid dice expression");
        }

        // Roll the dice
        var rollResult = await _diceRoller.RollDiceAsync(request.DiceExpression);

        // Apply modifiers if specified
        if (request.Modifiers.Any())
        {
            rollResult = ApplyModifiers(rollResult, request.Modifiers);
        }

        // Create dice roll record
        var diceRoll = DiceRoll.Create(
            sessionId: request.SessionId,
            userId: request.UserId,
            characterId: request.CharacterId,
            diceExpression: request.DiceExpression,
            result: rollResult,
            rollType: request.RollType,
            purpose: request.Purpose
        );

        // Apply advantage/disadvantage if specified
        if (request.RollType != RollType.Normal)
        {
            var advantageRoll = await _diceRoller.RollDiceAsync(request.DiceExpression);
            diceRoll.SetAdvantageRoll(advantageRoll, request.RollType);
        }

        // Store roll
        await _rollRepository.StoreDiceRollAsync(diceRoll);

        // Update session state
        liveSession.SessionState.DiceRollHistory.AddRoll(diceRoll);

        // Broadcast roll result
        await BroadcastDiceRollAsync(liveSession, diceRoll);

        // Handle special roll types (skill checks, saving throws, etc.)
        if (request.RollType != RollType.Normal)
        {
            await HandleSpecialRollAsync(liveSession, diceRoll, request);
        }

        return Result.Success(new DiceRollResult
        {
            DiceRoll = diceRoll,
            Result = rollResult,
            Success = DetermineRollSuccess(diceRoll, request)
        });
    }

    private async Task BroadcastDiceRollAsync(LiveSession session, DiceRoll diceRoll)
    {
        var groupName = $"session_{session.SessionId}";
        
        // Create broadcast message
        var rollMessage = new DiceRollBroadcast
        {
            RollId = diceRoll.Id,
            UserId = diceRoll.UserId,
            CharacterId = diceRoll.CharacterId,
            DiceExpression = diceRoll.DiceExpression,
            Result = diceRoll.Result,
            RollType = diceRoll.RollType,
            Purpose = diceRoll.Purpose,
            Timestamp = diceRoll.Timestamp,
            IsVisible = DetermineRollVisibility(diceRoll, session)
        };

        // Broadcast to appropriate audience
        if (diceRoll.IsPrivate)
        {
            // Send only to DM
            var dmParticipant = session.Participants.FirstOrDefault(p => p.UserId == session.DungeonMasterId);
            if (dmParticipant != null)
            {
                await _hubContext.Clients.Client(dmParticipant.ConnectionId).SendAsync("ReceiveDiceRoll", rollMessage);
            }

            // Send to roller
            var rollerParticipant = session.Participants.FirstOrDefault(p => p.UserId == diceRoll.UserId);
            if (rollerParticipant != null)
            {
                await _hubContext.Clients.Client(rollerParticipant.ConnectionId).SendAsync("ReceiveDiceRoll", rollMessage);
            }
        }
        else
        {
            // Broadcast to all participants
            await _hubContext.Clients.Group(groupName).SendAsync("ReceiveDiceRoll", rollMessage);
        }

        // Create chat message for the roll
        var chatMessage = CreateDiceRollChatMessage(diceRoll, rollMessage.IsVisible);
        await BroadcastChatMessageAsync(session, chatMessage);
    }

    private async Task HandleSpecialRollAsync(LiveSession session, DiceRoll diceRoll, RollDiceRequest request)
    {
        if (request.Purpose == RollPurpose.SkillCheck && request.SkillType.HasValue)
        {
            var character = await _characterRepository.GetByIdAsync(diceRoll.CharacterId);
            if (character != null)
            {
                var skillResult = await _rulesEngine.MakeSkillCheckAsync(
                    character, 
                    request.SkillType.Value, 
                    request.DifficultyClass ?? 15);

                diceRoll.SetSkillCheckResult(skillResult);
                
                // Broadcast skill check result
                await BroadcastSkillCheckResultAsync(session, diceRoll, skillResult);
            }
        }
        else if (request.Purpose == RollPurpose.SavingThrow && request.AbilityType.HasValue)
        {
            var character = await _characterRepository.GetByIdAsync(diceRoll.CharacterId);
            if (character != null)
            {
                var saveResult = await _rulesEngine.MakeSavingThrowAsync(
                    character, 
                    request.AbilityType.Value, 
                    request.DifficultyClass ?? 15);

                diceRoll.SetSavingThrowResult(saveResult);
                
                // Broadcast saving throw result
                await BroadcastSavingThrowResultAsync(session, diceRoll, saveResult);
            }
        }
    }
}

public class DiceRoll : Entity
{
    public string Id { get; private set; }
    public string SessionId { get; private set; }
    public string UserId { get; private set; }
    public string? CharacterId { get; private set; }
    public string DiceExpression { get; private set; }
    public DiceResult Result { get; private set; }
    public DiceResult? AdvantageRoll { get; private set; }
    public RollType RollType { get; private set; }
    public RollPurpose Purpose { get; private set; }
    public DateTime Timestamp { get; private set; }
    public bool IsPrivate { get; private set; }
    public int? DifficultyClass { get; private set; }
    public RollResult? SkillCheckResult { get; private set; }
    public RollResult? SavingThrowResult { get; private set; }
    public Dictionary<string, object> Metadata { get; private set; } = new();

    public static DiceRoll Create(
        string sessionId, 
        string userId, 
        string? characterId, 
        string diceExpression, 
        DiceResult result, 
        RollType rollType, 
        RollPurpose purpose)
    {
        return new DiceRoll
        {
            Id = Guid.NewGuid().ToString(),
            SessionId = sessionId,
            UserId = userId,
            CharacterId = characterId,
            DiceExpression = diceExpression,
            Result = result,
            RollType = rollType,
            Purpose = purpose,
            Timestamp = DateTime.UtcNow
        };
    }

    public void SetAdvantageRoll(DiceResult advantageRoll, RollType rollType)
    {
        AdvantageRoll = advantageRoll;
        
        // Determine final result based on advantage/disadvantage
        if (rollType == RollType.Advantage)
        {
            Result = Result.Total > advantageRoll.Total ? Result : advantageRoll;
        }
        else if (rollType == RollType.Disadvantage)
        {
            Result = Result.Total < advantageRoll.Total ? Result : advantageRoll;
        }
    }

    public void SetPrivate(bool isPrivate = true)
    {
        IsPrivate = isPrivate;
    }

    public void SetDifficultyClass(int dc)
    {
        DifficultyClass = dc;
    }

    public void SetSkillCheckResult(RollResult result)
    {
        SkillCheckResult = result;
    }

    public void SetSavingThrowResult(RollResult result)
    {
        SavingThrowResult = result;
    }
}

public enum RollPurpose
{
    General,
    SkillCheck,
    AbilityCheck,
    SavingThrow,
    AttackRoll,
    DamageRoll,
    Initiative,
    HitPoints,
    SpellAttack,
    DeathSave
}
```

## Conflict Resolution

### Conflict Resolver
```csharp
public class RealtimeConflictResolver : IDomainService
{
    private readonly ILogger<RealtimeConflictResolver> _logger;

    public async Task<ConflictResult> CheckForConflictsAsync(LiveSession session, RealtimeActionRequest request)
    {
        var conflicts = new List<Conflict>();

        // Check for concurrent state modifications
        var stateConflicts = await CheckStateConflictsAsync(session, request);
        conflicts.AddRange(stateConflicts);

        // Check for resource conflicts (movement, actions, etc.)
        var resourceConflicts = await CheckResourceConflictsAsync(session, request);
        conflicts.AddRange(resourceConflicts);

        // Check for turn order conflicts
        var turnConflicts = await CheckTurnOrderConflictsAsync(session, request);
        conflicts.AddRange(turnConflicts);

        return new ConflictResult
        {
            HasConflicts = conflicts.Any(),
            Conflicts = conflicts,
            CanAutoResolve = conflicts.All(c => c.CanAutoResolve),
            ResolutionStrategy = DetermineResolutionStrategy(conflicts)
        };
    }

    public async Task<Result<SessionStateUpdate>> ResolveVersionConflictAsync(LiveSession session, SessionStateUpdate update)
    {
        var currentState = session.SessionState;
        
        // Get the state at the expected version
        var expectedState = await GetStateAtVersionAsync(session.Id, update.ExpectedVersion);
        if (expectedState == null)
        {
            return Result.Failure<SessionStateUpdate>("Cannot resolve conflict: expected state version not found");
        }

        // Apply three-way merge
        var mergeResult = await PerformThreeWayMergeAsync(expectedState, currentState, update);
        if (mergeResult.IsFailure)
        {
            return Result.Failure<SessionStateUpdate>($"Merge conflict: {mergeResult.Error}");
        }

        // Create resolved update
        var resolvedUpdate = new SessionStateUpdate
        {
            UpdateId = Guid.NewGuid().ToString(),
            UpdateType = update.UpdateType,
            UserId = update.UserId,
            Timestamp = DateTime.UtcNow,
            ExpectedVersion = currentState.Version,
            Data = mergeResult.Value.Data,
            Reason = $"Conflict resolution for {update.UpdateId}"
        };

        return Result.Success(resolvedUpdate);
    }

    private async Task<Result<SessionStateUpdate>> PerformThreeWayMergeAsync(
        SessionState baseState, 
        SessionState currentState, 
        SessionStateUpdate incomingUpdate)
    {
        return incomingUpdate.UpdateType switch
        {
            StateUpdateType.CharacterPosition => await MergeCharacterPositionUpdatesAsync(baseState, currentState, incomingUpdate),
            StateUpdateType.CombatState => await MergeCombatStateUpdatesAsync(baseState, currentState, incomingUpdate),
            StateUpdateType.MapState => await MergeMapStateUpdatesAsync(baseState, currentState, incomingUpdate),
            _ => Result.Success(incomingUpdate) // No merge needed for other types
        };
    }

    private async Task<Result<SessionStateUpdate>> MergeCharacterPositionUpdatesAsync(
        SessionState baseState, 
        SessionState currentState, 
        SessionStateUpdate incomingUpdate)
    {
        var positionUpdate = incomingUpdate.GetData<CharacterPositionUpdate>();
        if (positionUpdate == null)
        {
            return Result.Failure<SessionStateUpdate>("Invalid position update data");
        }

        // Check if character position was modified in current state
        var baseCharacterState = baseState.CharacterStates.FirstOrDefault(cs => cs.CharacterId == positionUpdate.CharacterId);
        var currentCharacterState = currentState.CharacterStates.FirstOrDefault(cs => cs.CharacterId == positionUpdate.CharacterId);

        if (baseCharacterState == null || currentCharacterState == null)
        {
            return Result.Failure<SessionStateUpdate>("Character not found in state");
        }

        // If positions are the same in base and current, accept incoming update
        if (baseCharacterState.Position.Equals(currentCharacterState.Position))
        {
            return Result.Success(incomingUpdate);
        }

        // If positions differ, we have a conflict
        // Apply conflict resolution strategy (e.g., timestamp-based, DM override, etc.)
        var resolutionStrategy = DeterminePositionConflictStrategy(baseCharacterState, currentCharacterState, positionUpdate);
        
        return resolutionStrategy switch
        {
            ConflictResolutionStrategy.AcceptIncoming => Result.Success(incomingUpdate),
            ConflictResolutionStrategy.RejectIncoming => Result.Failure<SessionStateUpdate>("Position update rejected due to conflict"),
            ConflictResolutionStrategy.FindCompromise => await FindPositionCompromiseAsync(currentCharacterState, positionUpdate),
            _ => Result.Failure<SessionStateUpdate>("Unknown conflict resolution strategy")
        };
    }

    private ConflictResolutionStrategy DeterminePositionConflictStrategy(
        CharacterState baseState, 
        CharacterState currentState, 
        CharacterPositionUpdate incomingUpdate)
    {
        // If the incoming update is from the DM, it takes precedence
        if (incomingUpdate.IsDMOverride)
        {
            return ConflictResolutionStrategy.AcceptIncoming;
        }

        // If the current position was set by DM, reject incoming player update
        if (currentState.LastUpdatedByDM)
        {
            return ConflictResolutionStrategy.RejectIncoming;
        }

        // Try to find a compromise position
        return ConflictResolutionStrategy.FindCompromise;
    }

    private async Task<Result<SessionStateUpdate>> FindPositionCompromiseAsync(
        CharacterState currentState, 
        CharacterPositionUpdate incomingUpdate)
    {
        // Find a valid position that's close to both the current and incoming positions
        var currentPosition = currentState.Position;
        var incomingPosition = incomingUpdate.NewPosition;

        // Calculate midpoint
        var compromisePosition = new Position
        {
            X = (currentPosition.X + incomingPosition.X) / 2,
            Y = (currentPosition.Y + incomingPosition.Y) / 2,
            Z = (currentPosition.Z + incomingPosition.Z) / 2
        };

        // Validate compromise position
        if (await IsValidPositionAsync(compromisePosition))
        {
            var compromiseUpdate = new SessionStateUpdate
            {
                UpdateType = StateUpdateType.CharacterPosition,
                UserId = "system",
                Data = new Dictionary<string, object>
                {
                    [nameof(CharacterPositionUpdate)] = new CharacterPositionUpdate
                    {
                        CharacterId = incomingUpdate.CharacterId,
                        NewPosition = compromisePosition,
                        IsDMOverride = false
                    }
                }
            };

            return Result.Success(compromiseUpdate);
        }

        // If compromise position is invalid, reject the incoming update
        return Result.Failure<SessionStateUpdate>("Cannot find valid compromise position");
    }
}

public class ConflictResult
{
    public bool HasConflicts { get; set; }
    public List<Conflict> Conflicts { get; set; } = new();
    public bool CanAutoResolve { get; set; }
    public ConflictResolutionStrategy ResolutionStrategy { get; set; }
}

public class Conflict
{
    public ConflictType Type { get; set; }
    public string Description { get; set; }
    public List<string> AffectedUsers { get; set; } = new();
    public bool CanAutoResolve { get; set; }
    public Dictionary<string, object> ConflictData { get; set; } = new();
}

public enum ConflictType
{
    StateVersion,
    ResourceContention,
    TurnOrder,
    PositionOverlap,
    ActionSequence
}

public enum ConflictResolutionStrategy
{
    AcceptIncoming,
    RejectIncoming,
    FindCompromise,
    RequireManualResolution,
    TimestampBased,
    AuthorityBased
}
```

This Real-time Collaboration business logic specification provides:

1. **Real-time Session Management** - Complete live session lifecycle with participant management
2. **State Synchronization** - Optimistic locking, operational transformation, and conflict resolution
3. **Real-time Communication** - Chat system with moderation, encryption, and different message types
4. **Dice Rolling System** - Collaborative dice rolling with advantage/disadvantage and special roll handling
5. **Conflict Resolution** - Sophisticated conflict detection and resolution strategies
6. **Connection Management** - Robust connection tracking and reconnection handling
7. **Event Broadcasting** - Efficient SignalR-based real-time updates to all participants
8. **Collaborative State Management** - Shared session state with concurrent update handling

The specification ensures smooth real-time collaboration while maintaining data consistency and providing excellent user experience during live D&D sessions.

<function_calls>
<invoke name="todo_write">
<parameter name="merge">true
