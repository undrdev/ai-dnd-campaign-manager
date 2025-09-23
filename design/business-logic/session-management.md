# Session Management Business Logic

## Overview
This document defines the comprehensive business logic for session management within the D&D AI Campaign Management System. It covers session lifecycle, scheduling, preparation, execution, post-session processing, session templates, recurring sessions, and the integration of AI assistance throughout the session workflow.

## Domain Model

### Session Entity
```csharp
public class Session : Entity, IAggregateRoot
{
    public string Id { get; private set; }
    public string CampaignId { get; private set; }
    public string Name { get; private set; }
    public string Description { get; private set; }
    public SessionType Type { get; private set; }
    public DateTime ScheduledStartTime { get; private set; }
    public DateTime ScheduledEndTime { get; private set; }
    public DateTime? ActualStartTime { get; private set; }
    public DateTime? ActualEndTime { get; private set; }
    public SessionStatus Status { get; private set; }
    public string ScheduledBy { get; private set; }
    public int MaxParticipants { get; private set; }
    public List<SessionParticipant> ExpectedParticipants { get; private set; } = new();
    public List<SessionParticipant> ActualParticipants { get; private set; } = new();
    public SessionPreparation Preparation { get; private set; }
    public SessionExecution? Execution { get; private set; }
    public SessionSummary? Summary { get; private set; }
    public RecurrencePattern? RecurrencePattern { get; private set; }
    public List<SessionNote> Notes { get; private set; } = new();
    public List<SessionResource> Resources { get; private set; } = new();
    public SessionSettings Settings { get; private set; }
    public List<DomainEvent> DomainEvents { get; private set; } = new();

    public static Session Create(CreateSessionRequest request)
    {
        var session = new Session
        {
            Id = Guid.NewGuid().ToString(),
            CampaignId = request.CampaignId,
            Name = request.Name,
            Description = request.Description,
            Type = request.Type,
            ScheduledStartTime = request.ScheduledStartTime,
            ScheduledEndTime = request.ScheduledEndTime,
            Status = SessionStatus.Scheduled,
            ScheduledBy = request.ScheduledBy,
            MaxParticipants = request.MaxParticipants,
            Settings = request.Settings ?? SessionSettings.CreateDefault(),
            Preparation = SessionPreparation.Create()
        };

        session.AddDomainEvent(new SessionCreatedEvent(session.Id, session.CampaignId, session.ScheduledStartTime));
        return session;
    }

    public Result Start(string startedBy)
    {
        if (Status != SessionStatus.Scheduled && Status != SessionStatus.Ready)
        {
            return Result.Failure("Session must be scheduled or ready to start");
        }

        if (ActualParticipants.Count == 0)
        {
            return Result.Failure("Cannot start session without participants");
        }

        Status = SessionStatus.InProgress;
        ActualStartTime = DateTime.UtcNow;
        Execution = SessionExecution.Create(Id, startedBy);

        AddDomainEvent(new SessionStartedEvent(Id, CampaignId, startedBy, ActualParticipants.Count));
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
        
        if (Execution != null)
        {
            Execution.End(endedBy);
        }

        if (!string.IsNullOrEmpty(summary))
        {
            Summary = SessionSummary.Create(Id, summary, endedBy);
        }

        AddDomainEvent(new SessionEndedEvent(Id, CampaignId, endedBy, GetSessionDuration()));
        return Result.Success();
    }

    public Result AddParticipant(string userId, string? characterId = null, ParticipantRole role = ParticipantRole.Player)
    {
        if (ActualParticipants.Count >= MaxParticipants)
        {
            return Result.Failure("Session is full");
        }

        if (ActualParticipants.Any(p => p.UserId == userId))
        {
            return Result.Failure("User is already participating in this session");
        }

        var participant = SessionParticipant.Create(userId, characterId, role);
        ActualParticipants.Add(participant);

        AddDomainEvent(new ParticipantJoinedSessionEvent(Id, userId, characterId, role));
        return Result.Success();
    }

    public Result RemoveParticipant(string userId, string reason = "")
    {
        var participant = ActualParticipants.FirstOrDefault(p => p.UserId == userId);
        if (participant == null)
        {
            return Result.Failure("Participant not found");
        }

        participant.Leave(reason);
        AddDomainEvent(new ParticipantLeftSessionEvent(Id, userId, reason));
        return Result.Success();
    }

    public TimeSpan GetSessionDuration()
    {
        if (ActualStartTime.HasValue && ActualEndTime.HasValue)
        {
            return ActualEndTime.Value - ActualStartTime.Value;
        }
        
        if (ActualStartTime.HasValue)
        {
            return DateTime.UtcNow - ActualStartTime.Value;
        }
        
        return ScheduledEndTime - ScheduledStartTime;
    }

    public bool IsUserExpected(string userId)
    {
        return ExpectedParticipants.Any(p => p.UserId == userId);
    }

    public bool CanUserJoin(string userId)
    {
        return IsUserExpected(userId) && 
               !ActualParticipants.Any(p => p.UserId == userId) && 
               ActualParticipants.Count < MaxParticipants;
    }
}

public enum SessionStatus
{
    Scheduled,
    Preparing,
    Ready,
    InProgress,
    Paused,
    Completed,
    Cancelled,
    Postponed
}

public enum SessionType
{
    Regular,
    OneShot,
    CharacterCreation,
    SessionZero,
    Combat,
    Roleplay,
    Exploration,
    WorldBuilding,
    Epilogue
}

public class SessionSettings : ValueObject
{
    public bool AllowLateJoins { get; private set; }
    public bool RecordSession { get; private set; }
    public bool AllowSpectators { get; private set; }
    public bool EnableAIAssistance { get; private set; }
    public bool AutoGenerateNotes { get; private set; }
    public bool EnableRealTimeSync { get; private set; }
    public int MaxSpectators { get; private set; }
    public TimeSpan LateJoinGracePeriod { get; private set; }
    public List<string> EnabledFeatures { get; private set; } = new();
    public Dictionary<string, object> CustomSettings { get; private set; } = new();

    public static SessionSettings CreateDefault()
    {
        return new SessionSettings
        {
            AllowLateJoins = true,
            RecordSession = false,
            AllowSpectators = false,
            EnableAIAssistance = true,
            AutoGenerateNotes = true,
            EnableRealTimeSync = true,
            MaxSpectators = 5,
            LateJoinGracePeriod = TimeSpan.FromMinutes(15),
            EnabledFeatures = new List<string> { "dice-rolling", "chat", "character-sheets", "maps" }
        };
    }
}
```

## Session Preparation System

### Session Preparation Manager
```csharp
public class SessionPreparationManager : IDomainService
{
    private readonly IAIContentService _aiContentService;
    private readonly ITemplateRepository _templateRepository;
    private readonly IResourceRepository _resourceRepository;
    private readonly ICampaignRepository _campaignRepository;
    private readonly ICharacterRepository _characterRepository;

    public async Task<Result> PrepareSessionAsync(Session session, SessionPreparationRequest request)
    {
        var preparation = session.Preparation;

        // Generate session agenda if requested
        if (request.GenerateAgenda)
        {
            var agendaResult = await GenerateSessionAgendaAsync(session, request.AgendaPrompts);
            if (agendaResult.IsSuccess)
            {
                preparation.SetAgenda(agendaResult.Value);
            }
        }

        // Prepare encounters
        if (request.PrepareEncounters)
        {
            var encountersResult = await PrepareEncountersAsync(session, request.EncounterRequirements);
            if (encountersResult.IsSuccess)
            {
                preparation.SetEncounters(encountersResult.Value);
            }
        }

        // Generate NPCs if needed
        if (request.GenerateNPCs && request.NPCRequirements.Any())
        {
            var npcsResult = await GenerateSessionNPCsAsync(session, request.NPCRequirements);
            if (npcsResult.IsSuccess)
            {
                preparation.SetNPCs(npcsResult.Value);
            }
        }

        // Prepare handouts and resources
        if (request.PrepareHandouts)
        {
            var handoutsResult = await PrepareHandoutsAsync(session, request.HandoutRequirements);
            if (handoutsResult.IsSuccess)
            {
                preparation.SetHandouts(handoutsResult.Value);
            }
        }

        // Generate random encounters table
        if (request.GenerateRandomEncounters)
        {
            var randomEncountersResult = await GenerateRandomEncountersTableAsync(session);
            if (randomEncountersResult.IsSuccess)
            {
                preparation.SetRandomEncounters(randomEncountersResult.Value);
            }
        }

        // Prepare session notes template
        if (request.PrepareNotesTemplate)
        {
            var notesTemplateResult = await GenerateNotesTemplateAsync(session);
            if (notesTemplateResult.IsSuccess)
            {
                preparation.SetNotesTemplate(notesTemplateResult.Value);
            }
        }

        // Mark preparation as complete
        preparation.MarkComplete();
        session.Status = SessionStatus.Ready;

        session.AddDomainEvent(new SessionPreparedEvent(session.Id, preparation.GetPreparationSummary()));
        return Result.Success();
    }

    private async Task<Result<SessionAgenda>> GenerateSessionAgendaAsync(Session session, List<string> prompts)
    {
        var campaign = await _campaignRepository.GetByIdAsync(session.CampaignId);
        if (campaign == null)
        {
            return Result.Failure<SessionAgenda>("Campaign not found");
        }

        var agendaRequest = new ContentGenerationRequest
        {
            ContentType = ContentType.SessionAgenda,
            CampaignId = session.CampaignId,
            Parameters = new GenerationParameters
            {
                SessionType = session.Type,
                ExpectedDuration = session.GetSessionDuration(),
                ParticipantCount = session.ExpectedParticipants.Count,
                CustomPrompts = prompts
            }
        };

        var context = await BuildSessionContext(session, campaign);
        var agendaResult = await _aiContentService.GenerateContentAsync(agendaRequest, context);

        if (agendaResult.IsFailure)
        {
            return Result.Failure<SessionAgenda>(agendaResult.Error);
        }

        var agenda = SessionAgenda.CreateFromAI(agendaResult.Value);
        return Result.Success(agenda);
    }

    private async Task<Result<List<SessionEncounter>>> PrepareEncountersAsync(Session session, List<EncounterRequirement> requirements)
    {
        var encounters = new List<SessionEncounter>();

        foreach (var requirement in requirements)
        {
            var encounterResult = await GenerateEncounterAsync(session, requirement);
            if (encounterResult.IsSuccess)
            {
                encounters.Add(encounterResult.Value);
            }
        }

        return Result.Success(encounters);
    }

    private async Task<Result<SessionEncounter>> GenerateEncounterAsync(Session session, EncounterRequirement requirement)
    {
        var campaign = await _campaignRepository.GetByIdAsync(session.CampaignId);
        var characters = await _characterRepository.GetByCampaignIdAsync(session.CampaignId);

        var encounterRequest = new ContentGenerationRequest
        {
            ContentType = ContentType.CombatEncounter,
            CampaignId = session.CampaignId,
            Parameters = new GenerationParameters
            {
                EncounterType = requirement.Type,
                DifficultyLevel = requirement.Difficulty,
                PartyLevel = characters.Any() ? (int)characters.Average(c => c.Level) : 1,
                PartySize = characters.Count,
                Environment = requirement.Environment,
                Objectives = requirement.Objectives
            }
        };

        var context = await BuildSessionContext(session, campaign);
        var encounterResult = await _aiContentService.GenerateContentAsync(encounterRequest, context);

        if (encounterResult.IsFailure)
        {
            return Result.Failure<SessionEncounter>(encounterResult.Error);
        }

        var encounter = SessionEncounter.CreateFromAI(encounterResult.Value, requirement);
        return Result.Success(encounter);
    }

    private async Task<AIContext> BuildSessionContext(Session session, Campaign campaign)
    {
        return new AIContext
        {
            CampaignId = session.CampaignId,
            Campaign = await BuildCampaignContextAsync(campaign),
            SessionType = session.Type,
            ExpectedParticipants = session.ExpectedParticipants.Count,
            SessionDuration = session.GetSessionDuration(),
            PreviousSession = await GetPreviousSessionSummaryAsync(session.CampaignId),
            WorldState = campaign.WorldState,
            ActivePlotlines = await GetActivePlotlinesAsync(campaign.Id)
        };
    }
}

public class SessionPreparation : ValueObject
{
    public bool IsComplete { get; private set; }
    public DateTime? CompletedAt { get; private set; }
    public SessionAgenda? Agenda { get; private set; }
    public List<SessionEncounter> Encounters { get; private set; } = new();
    public List<SessionNPC> NPCs { get; private set; } = new();
    public List<SessionHandout> Handouts { get; private set; } = new();
    public RandomEncountersTable? RandomEncounters { get; private set; }
    public SessionNotesTemplate? NotesTemplate { get; private set; }
    public List<SessionResource> Resources { get; private set; } = new();
    public Dictionary<string, object> CustomPreparation { get; private set; } = new();

    public static SessionPreparation Create()
    {
        return new SessionPreparation
        {
            IsComplete = false
        };
    }

    public void SetAgenda(SessionAgenda agenda)
    {
        Agenda = agenda;
    }

    public void SetEncounters(List<SessionEncounter> encounters)
    {
        Encounters = encounters;
    }

    public void SetNPCs(List<SessionNPC> npcs)
    {
        NPCs = npcs;
    }

    public void SetHandouts(List<SessionHandout> handouts)
    {
        Handouts = handouts;
    }

    public void SetRandomEncounters(RandomEncountersTable randomEncounters)
    {
        RandomEncounters = randomEncounters;
    }

    public void SetNotesTemplate(SessionNotesTemplate notesTemplate)
    {
        NotesTemplate = notesTemplate;
    }

    public void MarkComplete()
    {
        IsComplete = true;
        CompletedAt = DateTime.UtcNow;
    }

    public PreparationSummary GetPreparationSummary()
    {
        return new PreparationSummary
        {
            HasAgenda = Agenda != null,
            EncounterCount = Encounters.Count,
            NPCCount = NPCs.Count,
            HandoutCount = Handouts.Count,
            HasRandomEncounters = RandomEncounters != null,
            HasNotesTemplate = NotesTemplate != null,
            ResourceCount = Resources.Count,
            CompletedAt = CompletedAt
        };
    }
}

public class SessionAgenda : ValueObject
{
    public string Title { get; private set; }
    public TimeSpan EstimatedDuration { get; private set; }
    public List<AgendaItem> Items { get; private set; } = new();
    public string? Introduction { get; private set; }
    public string? Conclusion { get; private set; }
    public List<string> KeyObjectives { get; private set; } = new();
    public List<string> ImportantReminders { get; private set; } = new();

    public static SessionAgenda CreateFromAI(GeneratedContent content)
    {
        var agendaData = content.GetStructuredData<SessionAgendaData>();
        
        return new SessionAgenda
        {
            Title = agendaData.Title,
            EstimatedDuration = agendaData.EstimatedDuration,
            Items = agendaData.Items.Select(i => AgendaItem.Create(i.Title, i.Description, i.EstimatedDuration, i.Type)).ToList(),
            Introduction = agendaData.Introduction,
            Conclusion = agendaData.Conclusion,
            KeyObjectives = agendaData.KeyObjectives,
            ImportantReminders = agendaData.ImportantReminders
        };
    }
}

public class AgendaItem : ValueObject
{
    public string Title { get; private set; }
    public string Description { get; private set; }
    public TimeSpan EstimatedDuration { get; private set; }
    public AgendaItemType Type { get; private set; }
    public int Order { get; private set; }
    public bool IsOptional { get; private set; }
    public List<string> RequiredResources { get; private set; } = new();

    public static AgendaItem Create(string title, string description, TimeSpan duration, AgendaItemType type)
    {
        return new AgendaItem
        {
            Title = title,
            Description = description,
            EstimatedDuration = duration,
            Type = type
        };
    }
}

public enum AgendaItemType
{
    Introduction,
    Recap,
    Roleplay,
    Combat,
    Exploration,
    Puzzle,
    SocialEncounter,
    Investigation,
    Break,
    Conclusion
}
```

## Session Execution System

### Session Execution Manager
```csharp
public class SessionExecutionManager : IDomainService
{
    private readonly IRealtimeSessionManager _realtimeManager;
    private readonly IAIAssistantService _aiAssistant;
    private readonly ISessionNotesService _notesService;
    private readonly IEventTracker _eventTracker;

    public async Task<Result> ExecuteSessionAsync(Session session)
    {
        if (session.Status != SessionStatus.Ready)
        {
            return Result.Failure("Session must be ready to execute");
        }

        // Initialize session execution
        var execution = SessionExecution.Create(session.Id, session.ScheduledBy);
        session.Execution = execution;

        // Start real-time session if enabled
        if (session.Settings.EnableRealTimeSync)
        {
            var liveSessionResult = await _realtimeManager.StartLiveSessionAsync(new StartLiveSessionRequest
            {
                SessionId = session.Id,
                DungeonMasterId = session.ScheduledBy,
                MaxParticipants = session.MaxParticipants
            });

            if (liveSessionResult.IsSuccess)
            {
                execution.SetLiveSessionId(liveSessionResult.Value.Id);
            }
        }

        // Initialize AI assistant if enabled
        if (session.Settings.EnableAIAssistance)
        {
            await _aiAssistant.InitializeForSessionAsync(session.Id);
        }

        // Start automatic note-taking if enabled
        if (session.Settings.AutoGenerateNotes)
        {
            await _notesService.StartAutomaticNoteTakingAsync(session.Id);
        }

        // Begin event tracking
        await _eventTracker.StartTrackingAsync(session.Id);

        session.AddDomainEvent(new SessionExecutionStartedEvent(session.Id, execution.Id));
        return Result.Success();
    }

    public async Task<Result> ProcessSessionEventAsync(SessionEvent sessionEvent)
    {
        // Track the event
        await _eventTracker.TrackEventAsync(sessionEvent);

        // Process event based on type
        var result = sessionEvent.Type switch
        {
            SessionEventType.CombatStarted => await ProcessCombatStartedAsync(sessionEvent),
            SessionEventType.CombatEnded => await ProcessCombatEndedAsync(sessionEvent),
            SessionEventType.NPCIntroduced => await ProcessNPCIntroducedAsync(sessionEvent),
            SessionEventType.QuestCompleted => await ProcessQuestCompletedAsync(sessionEvent),
            SessionEventType.LevelUp => await ProcessLevelUpAsync(sessionEvent),
            SessionEventType.ImportantDecision => await ProcessImportantDecisionAsync(sessionEvent),
            SessionEventType.PlotAdvancement => await ProcessPlotAdvancementAsync(sessionEvent),
            _ => Result.Success()
        };

        // Generate AI insights if enabled
        if (result.IsSuccess)
        {
            await GenerateEventInsightsAsync(sessionEvent);
        }

        return result;
    }

    private async Task<Result> ProcessCombatStartedAsync(SessionEvent sessionEvent)
    {
        var combatData = sessionEvent.GetData<CombatStartedData>();
        if (combatData == null)
        {
            return Result.Failure("Invalid combat started data");
        }

        // Initialize combat tracking
        var combatTracker = new CombatTracker(sessionEvent.SessionId, combatData.Participants);
        
        // Store combat state
        await _eventTracker.UpdateCombatStateAsync(sessionEvent.SessionId, combatTracker);

        // Generate AI combat assistance if enabled
        await _aiAssistant.ProvideCombatAssistanceAsync(sessionEvent.SessionId, combatData);

        return Result.Success();
    }

    private async Task GenerateEventInsightsAsync(SessionEvent sessionEvent)
    {
        var insightRequest = new ContentGenerationRequest
        {
            ContentType = ContentType.SessionInsight,
            CampaignId = sessionEvent.CampaignId,
            Parameters = new GenerationParameters
            {
                EventType = sessionEvent.Type,
                EventData = sessionEvent.Data,
                SessionContext = await GetCurrentSessionContextAsync(sessionEvent.SessionId)
            }
        };

        var insightResult = await _aiAssistant.GenerateInsightAsync(insightRequest);
        if (insightResult.IsSuccess)
        {
            await _notesService.AddInsightAsync(sessionEvent.SessionId, insightResult.Value);
        }
    }
}

public class SessionExecution : ValueObject
{
    public string Id { get; private set; }
    public string SessionId { get; private set; }
    public string StartedBy { get; private set; }
    public DateTime StartedAt { get; private set; }
    public DateTime? EndedAt { get; private set; }
    public string? EndedBy { get; private set; }
    public ExecutionStatus Status { get; private set; }
    public string? LiveSessionId { get; private set; }
    public List<SessionEvent> Events { get; private set; } = new();
    public ExecutionMetrics Metrics { get; private set; }
    public Dictionary<string, object> RuntimeData { get; private set; } = new();

    public static SessionExecution Create(string sessionId, string startedBy)
    {
        return new SessionExecution
        {
            Id = Guid.NewGuid().ToString(),
            SessionId = sessionId,
            StartedBy = startedBy,
            StartedAt = DateTime.UtcNow,
            Status = ExecutionStatus.Running,
            Metrics = ExecutionMetrics.Create()
        };
    }

    public void SetLiveSessionId(string liveSessionId)
    {
        LiveSessionId = liveSessionId;
    }

    public void AddEvent(SessionEvent sessionEvent)
    {
        Events.Add(sessionEvent);
        Metrics.UpdateFromEvent(sessionEvent);
    }

    public void End(string endedBy)
    {
        EndedBy = endedBy;
        EndedAt = DateTime.UtcNow;
        Status = ExecutionStatus.Completed;
        Metrics.Finalize(GetDuration());
    }

    public TimeSpan GetDuration()
    {
        var endTime = EndedAt ?? DateTime.UtcNow;
        return endTime - StartedAt;
    }
}

public class SessionEvent : Entity
{
    public string Id { get; private set; }
    public string SessionId { get; private set; }
    public string CampaignId { get; private set; }
    public SessionEventType Type { get; private set; }
    public DateTime Timestamp { get; private set; }
    public string? UserId { get; private set; }
    public string? CharacterId { get; private set; }
    public Dictionary<string, object> Data { get; private set; } = new();
    public EventImportance Importance { get; private set; }
    public List<string> Tags { get; private set; } = new();

    public static SessionEvent Create(string sessionId, string campaignId, SessionEventType type, string? userId = null)
    {
        return new SessionEvent
        {
            Id = Guid.NewGuid().ToString(),
            SessionId = sessionId,
            CampaignId = campaignId,
            Type = type,
            Timestamp = DateTime.UtcNow,
            UserId = userId,
            Importance = DetermineImportance(type)
        };
    }

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

    private static EventImportance DetermineImportance(SessionEventType type)
    {
        return type switch
        {
            SessionEventType.QuestCompleted => EventImportance.High,
            SessionEventType.CharacterDeath => EventImportance.Critical,
            SessionEventType.LevelUp => EventImportance.High,
            SessionEventType.ImportantDecision => EventImportance.High,
            SessionEventType.PlotAdvancement => EventImportance.High,
            SessionEventType.CombatStarted => EventImportance.Medium,
            SessionEventType.NPCIntroduced => EventImportance.Medium,
            SessionEventType.DiceRoll => EventImportance.Low,
            SessionEventType.ChatMessage => EventImportance.Low,
            _ => EventImportance.Medium
        };
    }
}

public enum SessionEventType
{
    SessionStarted,
    SessionEnded,
    PlayerJoined,
    PlayerLeft,
    CombatStarted,
    CombatEnded,
    NPCIntroduced,
    QuestStarted,
    QuestCompleted,
    LevelUp,
    CharacterDeath,
    ImportantDecision,
    PlotAdvancement,
    LocationChanged,
    DiceRoll,
    ChatMessage,
    CustomEvent
}

public enum EventImportance
{
    Low,
    Medium,
    High,
    Critical
}

public enum ExecutionStatus
{
    Starting,
    Running,
    Paused,
    Completed,
    Aborted
}
```

## Session Notes and Summary System

### Session Notes Manager
```csharp
public class SessionNotesManager : IDomainService
{
    private readonly IAIContentService _aiContentService;
    private readonly ISessionNotesRepository _notesRepository;
    private readonly IEventTracker _eventTracker;

    public async Task<Result> StartAutomaticNoteTakingAsync(string sessionId)
    {
        var notesTaker = AutomaticNotesTaker.Create(sessionId);
        await _notesRepository.StoreNotesTakerAsync(notesTaker);

        return Result.Success();
    }

    public async Task<Result> AddManualNoteAsync(string sessionId, string userId, string content, NoteType noteType)
    {
        var note = SessionNote.CreateManual(sessionId, userId, content, noteType);
        await _notesRepository.AddNoteAsync(note);

        return Result.Success();
    }

    public async Task<Result> AddInsightAsync(string sessionId, GeneratedContent insight)
    {
        var note = SessionNote.CreateFromInsight(sessionId, insight);
        await _notesRepository.AddNoteAsync(note);

        return Result.Success();
    }

    public async Task<Result<SessionSummary>> GenerateSessionSummaryAsync(string sessionId)
    {
        // Get session data
        var session = await _sessionRepository.GetByIdAsync(sessionId);
        if (session == null)
        {
            return Result.Failure<SessionSummary>("Session not found");
        }

        // Get all session events
        var events = await _eventTracker.GetSessionEventsAsync(sessionId);
        
        // Get all session notes
        var notes = await _notesRepository.GetSessionNotesAsync(sessionId);

        // Generate AI summary
        var summaryRequest = new ContentGenerationRequest
        {
            ContentType = ContentType.SessionSummary,
            CampaignId = session.CampaignId,
            Parameters = new GenerationParameters
            {
                SessionEvents = events,
                SessionNotes = notes,
                SessionDuration = session.GetSessionDuration(),
                ParticipantCount = session.ActualParticipants.Count
            }
        };

        var summaryResult = await _aiContentService.GenerateContentAsync(summaryRequest);
        if (summaryResult.IsFailure)
        {
            return Result.Failure<SessionSummary>(summaryResult.Error);
        }

        // Create session summary
        var summary = SessionSummary.CreateFromAI(sessionId, summaryResult.Value, events, notes);
        
        // Store summary
        await _notesRepository.StoreSummaryAsync(summary);

        return Result.Success(summary);
    }

    public async Task<Result> UpdateCampaignFromSessionAsync(string sessionId)
    {
        var summary = await _notesRepository.GetSessionSummaryAsync(sessionId);
        if (summary == null)
        {
            return Result.Failure("Session summary not found");
        }

        var session = await _sessionRepository.GetByIdAsync(sessionId);
        var campaign = await _campaignRepository.GetByIdAsync(session.CampaignId);

        // Update world state based on session events
        foreach (var stateChange in summary.WorldStateChanges)
        {
            var result = campaign.WorldState.ApplyChange(stateChange);
            if (result.IsFailure)
            {
                // Log warning but continue with other changes
                continue;
            }
        }

        // Update character progression
        foreach (var progression in summary.CharacterProgressions)
        {
            var character = await _characterRepository.GetByIdAsync(progression.CharacterId);
            if (character != null)
            {
                await ApplyCharacterProgressionAsync(character, progression);
            }
        }

        // Update quest states
        foreach (var questUpdate in summary.QuestUpdates)
        {
            await UpdateQuestStateAsync(campaign.Id, questUpdate);
        }

        // Add new NPCs introduced in session
        foreach (var npc in summary.NewNPCs)
        {
            await _npcRepository.AddAsync(npc.ToCampaignNPC(campaign.Id));
        }

        // Store campaign updates
        await _campaignRepository.UpdateAsync(campaign);

        return Result.Success();
    }
}

public class SessionSummary : Entity
{
    public string Id { get; private set; }
    public string SessionId { get; private set; }
    public string Title { get; private set; }
    public string Overview { get; private set; }
    public List<KeyMoment> KeyMoments { get; private set; } = new();
    public List<CharacterProgression> CharacterProgressions { get; private set; } = new();
    public List<WorldStateChange> WorldStateChanges { get; private set; } = new();
    public List<QuestUpdate> QuestUpdates { get; private set; } = new();
    public List<SessionNPC> NewNPCs { get; private set; } = new();
    public List<ImportantDecision> ImportantDecisions { get; private set; } = new();
    public string? NextSessionHints { get; private set; }
    public DateTime GeneratedAt { get; private set; }
    public string GeneratedBy { get; private set; }
    public SummaryMetrics Metrics { get; private set; }

    public static SessionSummary CreateFromAI(string sessionId, GeneratedContent content, List<SessionEvent> events, List<SessionNote> notes)
    {
        var summaryData = content.GetStructuredData<SessionSummaryData>();
        
        return new SessionSummary
        {
            Id = Guid.NewGuid().ToString(),
            SessionId = sessionId,
            Title = summaryData.Title,
            Overview = summaryData.Overview,
            KeyMoments = summaryData.KeyMoments.Select(km => KeyMoment.Create(km.Title, km.Description, km.Timestamp, km.Importance)).ToList(),
            CharacterProgressions = ExtractCharacterProgressions(events, summaryData),
            WorldStateChanges = summaryData.WorldStateChanges,
            QuestUpdates = summaryData.QuestUpdates,
            NewNPCs = summaryData.NewNPCs,
            ImportantDecisions = summaryData.ImportantDecisions,
            NextSessionHints = summaryData.NextSessionHints,
            GeneratedAt = DateTime.UtcNow,
            GeneratedBy = "AI",
            Metrics = SummaryMetrics.CalculateFromData(events, notes, summaryData)
        };
    }

    private static List<CharacterProgression> ExtractCharacterProgressions(List<SessionEvent> events, SessionSummaryData summaryData)
    {
        var progressions = new List<CharacterProgression>();

        // Extract level-ups from events
        var levelUpEvents = events.Where(e => e.Type == SessionEventType.LevelUp);
        foreach (var levelUpEvent in levelUpEvents)
        {
            var levelUpData = levelUpEvent.GetData<LevelUpData>();
            if (levelUpData != null)
            {
                progressions.Add(new CharacterProgression
                {
                    CharacterId = levelUpEvent.CharacterId,
                    Type = ProgressionType.LevelUp,
                    Description = $"Leveled up to level {levelUpData.NewLevel}",
                    Data = levelUpData
                });
            }
        }

        // Add other progressions from AI summary
        progressions.AddRange(summaryData.CharacterProgressions);

        return progressions;
    }
}

public class SessionNote : Entity
{
    public string Id { get; private set; }
    public string SessionId { get; private set; }
    public string? UserId { get; private set; }
    public string Content { get; private set; }
    public NoteType Type { get; private set; }
    public DateTime Timestamp { get; private set; }
    public bool IsAIGenerated { get; private set; }
    public List<string> Tags { get; private set; } = new();
    public Dictionary<string, object> Metadata { get; private set; } = new();

    public static SessionNote CreateManual(string sessionId, string userId, string content, NoteType type)
    {
        return new SessionNote
        {
            Id = Guid.NewGuid().ToString(),
            SessionId = sessionId,
            UserId = userId,
            Content = content,
            Type = type,
            Timestamp = DateTime.UtcNow,
            IsAIGenerated = false
        };
    }

    public static SessionNote CreateFromInsight(string sessionId, GeneratedContent insight)
    {
        return new SessionNote
        {
            Id = Guid.NewGuid().ToString(),
            SessionId = sessionId,
            Content = insight.RawContent,
            Type = NoteType.AIInsight,
            Timestamp = DateTime.UtcNow,
            IsAIGenerated = true,
            Tags = insight.Tags.Select(t => t.Name).ToList()
        };
    }

    public void AddTag(string tag)
    {
        if (!Tags.Contains(tag))
        {
            Tags.Add(tag);
        }
    }
}

public enum NoteType
{
    General,
    Combat,
    Roleplay,
    Investigation,
    Decision,
    Plot,
    Character,
    World,
    Quest,
    AIInsight,
    Reminder
}

public class KeyMoment : ValueObject
{
    public string Title { get; private set; }
    public string Description { get; private set; }
    public DateTime Timestamp { get; private set; }
    public EventImportance Importance { get; private set; }
    public List<string> ParticipantIds { get; private set; } = new();

    public static KeyMoment Create(string title, string description, DateTime timestamp, EventImportance importance)
    {
        return new KeyMoment
        {
            Title = title,
            Description = description,
            Timestamp = timestamp,
            Importance = importance
        };
    }
}
```

## Session Templates and Recurring Sessions

### Session Template Manager
```csharp
public class SessionTemplateManager : IDomainService
{
    private readonly ITemplateRepository _templateRepository;
    private readonly IAIContentService _aiContentService;

    public async Task<Result<SessionTemplate>> CreateTemplateAsync(CreateSessionTemplateRequest request)
    {
        var template = SessionTemplate.Create(
            name: request.Name,
            description: request.Description,
            sessionType: request.SessionType,
            createdBy: request.CreatedBy
        );

        // Set template structure
        template.SetStructure(request.Structure);

        // Set preparation requirements
        template.SetPreparationRequirements(request.PreparationRequirements);

        // Set default settings
        template.SetDefaultSettings(request.DefaultSettings);

        // Generate AI enhancements if requested
        if (request.GenerateAIEnhancements)
        {
            var enhancementsResult = await GenerateTemplateEnhancementsAsync(template);
            if (enhancementsResult.IsSuccess)
            {
                template.AddAIEnhancements(enhancementsResult.Value);
            }
        }

        await _templateRepository.StoreTemplateAsync(template);
        return Result.Success(template);
    }

    public async Task<Result<Session>> CreateSessionFromTemplateAsync(string templateId, CreateSessionFromTemplateRequest request)
    {
        var template = await _templateRepository.GetTemplateAsync(templateId);
        if (template == null)
        {
            return Result.Failure<Session>("Template not found");
        }

        // Create session from template
        var sessionRequest = new CreateSessionRequest
        {
            CampaignId = request.CampaignId,
            Name = string.IsNullOrEmpty(request.Name) ? template.GenerateSessionName() : request.Name,
            Description = template.GenerateDescription(request.CustomParameters),
            Type = template.SessionType,
            ScheduledStartTime = request.ScheduledStartTime,
            ScheduledEndTime = request.ScheduledEndTime,
            ScheduledBy = request.ScheduledBy,
            MaxParticipants = request.MaxParticipants,
            Settings = template.DefaultSettings.MergeWith(request.SettingsOverrides)
        };

        var session = Session.Create(sessionRequest);

        // Apply template structure
        await ApplyTemplateStructureAsync(session, template, request.CustomParameters);

        // Generate template-specific preparation
        if (template.PreparationRequirements.Any())
        {
            await GenerateTemplatePreparationAsync(session, template, request.CustomParameters);
        }

        return Result.Success(session);
    }

    public async Task<Result> SetupRecurringSessionsAsync(SetupRecurringSessionsRequest request)
    {
        var template = await _templateRepository.GetTemplateAsync(request.TemplateId);
        if (template == null)
        {
            return Result.Failure("Template not found");
        }

        var recurrencePattern = RecurrencePattern.Create(
            frequency: request.Frequency,
            interval: request.Interval,
            daysOfWeek: request.DaysOfWeek,
            startDate: request.StartDate,
            endDate: request.EndDate,
            maxOccurrences: request.MaxOccurrences
        );

        var sessions = new List<Session>();
        var occurrences = recurrencePattern.GenerateOccurrences();

        foreach (var occurrence in occurrences)
        {
            var sessionRequest = new CreateSessionFromTemplateRequest
            {
                CampaignId = request.CampaignId,
                Name = template.GenerateSessionName(occurrence),
                ScheduledStartTime = occurrence.StartTime,
                ScheduledEndTime = occurrence.EndTime,
                ScheduledBy = request.ScheduledBy,
                MaxParticipants = request.MaxParticipants,
                CustomParameters = request.DefaultParameters
            };

            var sessionResult = await CreateSessionFromTemplateAsync(request.TemplateId, sessionRequest);
            if (sessionResult.IsSuccess)
            {
                sessionResult.Value.SetRecurrencePattern(recurrencePattern);
                sessions.Add(sessionResult.Value);
            }
        }

        // Store all sessions
        foreach (var session in sessions)
        {
            await _sessionRepository.AddAsync(session);
        }

        return Result.Success();
    }
}

public class SessionTemplate : Entity
{
    public string Id { get; private set; }
    public string Name { get; private set; }
    public string Description { get; private set; }
    public SessionType SessionType { get; private set; }
    public string CreatedBy { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public bool IsPublic { get; private set; }
    public TemplateStructure Structure { get; private set; }
    public List<PreparationRequirement> PreparationRequirements { get; private set; } = new();
    public SessionSettings DefaultSettings { get; private set; }
    public List<TemplateParameter> Parameters { get; private set; } = new();
    public AIEnhancements? AIEnhancements { get; private set; }
    public int UsageCount { get; private set; }
    public double Rating { get; private set; }

    public static SessionTemplate Create(string name, string description, SessionType sessionType, string createdBy)
    {
        return new SessionTemplate
        {
            Id = Guid.NewGuid().ToString(),
            Name = name,
            Description = description,
            SessionType = sessionType,
            CreatedBy = createdBy,
            CreatedAt = DateTime.UtcNow,
            IsPublic = false,
            UsageCount = 0,
            Rating = 0.0
        };
    }

    public void SetStructure(TemplateStructure structure)
    {
        Structure = structure;
    }

    public void SetPreparationRequirements(List<PreparationRequirement> requirements)
    {
        PreparationRequirements = requirements;
    }

    public void SetDefaultSettings(SessionSettings settings)
    {
        DefaultSettings = settings;
    }

    public void AddAIEnhancements(AIEnhancements enhancements)
    {
        AIEnhancements = enhancements;
    }

    public string GenerateSessionName(SessionOccurrence? occurrence = null)
    {
        if (occurrence != null)
        {
            return $"{Name} - {occurrence.StartTime:MMM dd, yyyy}";
        }
        return Name;
    }

    public string GenerateDescription(Dictionary<string, object> customParameters)
    {
        var description = Description;
        
        // Replace parameter placeholders
        foreach (var parameter in Parameters)
        {
            var value = customParameters.GetValueOrDefault(parameter.Name, parameter.DefaultValue);
            description = description.Replace($"{{{parameter.Name}}}", value?.ToString() ?? "");
        }

        return description;
    }

    public void IncrementUsage()
    {
        UsageCount++;
    }
}

public class RecurrencePattern : ValueObject
{
    public RecurrenceFrequency Frequency { get; private set; }
    public int Interval { get; private set; }
    public List<DayOfWeek> DaysOfWeek { get; private set; } = new();
    public DateTime StartDate { get; private set; }
    public DateTime? EndDate { get; private set; }
    public int? MaxOccurrences { get; private set; }

    public static RecurrencePattern Create(
        RecurrenceFrequency frequency,
        int interval,
        List<DayOfWeek> daysOfWeek,
        DateTime startDate,
        DateTime? endDate = null,
        int? maxOccurrences = null)
    {
        return new RecurrencePattern
        {
            Frequency = frequency,
            Interval = interval,
            DaysOfWeek = daysOfWeek,
            StartDate = startDate,
            EndDate = endDate,
            MaxOccurrences = maxOccurrences
        };
    }

    public List<SessionOccurrence> GenerateOccurrences()
    {
        var occurrences = new List<SessionOccurrence>();
        var currentDate = StartDate;
        var count = 0;

        while (ShouldContinue(currentDate, count))
        {
            if (IsValidOccurrenceDate(currentDate))
            {
                occurrences.Add(new SessionOccurrence
                {
                    StartTime = currentDate,
                    EndTime = currentDate.AddHours(3) // Default 3-hour sessions
                });
                count++;
            }

            currentDate = GetNextDate(currentDate);
        }

        return occurrences;
    }

    private bool ShouldContinue(DateTime currentDate, int count)
    {
        if (EndDate.HasValue && currentDate > EndDate.Value)
            return false;

        if (MaxOccurrences.HasValue && count >= MaxOccurrences.Value)
            return false;

        return true;
    }

    private bool IsValidOccurrenceDate(DateTime date)
    {
        return Frequency switch
        {
            RecurrenceFrequency.Weekly => DaysOfWeek.Contains(date.DayOfWeek),
            RecurrenceFrequency.Daily => true,
            RecurrenceFrequency.Monthly => true,
            _ => true
        };
    }

    private DateTime GetNextDate(DateTime currentDate)
    {
        return Frequency switch
        {
            RecurrenceFrequency.Daily => currentDate.AddDays(Interval),
            RecurrenceFrequency.Weekly => currentDate.AddDays(7 * Interval),
            RecurrenceFrequency.Monthly => currentDate.AddMonths(Interval),
            _ => currentDate.AddDays(1)
        };
    }
}

public enum RecurrenceFrequency
{
    Daily,
    Weekly,
    Monthly
}

public class SessionOccurrence
{
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
}
```

This Session Management business logic specification provides:

1. **Complete Session Lifecycle Management** - From creation through execution to post-session processing
2. **Session Preparation System** - AI-powered agenda generation, encounter preparation, and resource management
3. **Session Execution Framework** - Real-time execution tracking with event processing and AI assistance
4. **Comprehensive Notes System** - Automatic note-taking, AI insights, and summary generation
5. **Session Templates** - Reusable session structures with parameterization and AI enhancements
6. **Recurring Sessions** - Flexible recurrence patterns for regular campaign sessions
7. **Integration Points** - Seamless integration with real-time collaboration, AI services, and campaign management
8. **Event-Driven Architecture** - Rich domain events for session lifecycle and integration

The specification ensures efficient session management while providing AI-powered assistance and maintaining comprehensive session history for campaign continuity.

<function_calls>
<invoke name="todo_write">
<parameter name="merge">true
