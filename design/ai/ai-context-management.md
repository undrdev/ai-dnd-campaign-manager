# AI Context Management System

## Overview
This document defines the comprehensive context management system that provides AI models with relevant campaign information, maintains conversation continuity, manages long-term memory, and implements Retrieval-Augmented Generation (RAG) for intelligent, context-aware AI responses.

---

## Context Architecture

### **Context Management Pipeline**
```
┌─────────────────────────────────────────────────────────────────┐
│                      AI Request                                 │
└─────────────────────────────────────────────────────────────────┘
                                │
                    ┌───────────────────────┐
                    │   Context Resolver    │
                    │  (Determine Context   │
                    │    Requirements)      │
                    └───────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
┌───────────────┐    ┌─────────────────┐    ┌─────────────────┐
│Campaign Context│    │Session Context │    │ User Context    │
│   Retrieval    │    │   Retrieval    │    │  Retrieval      │
└───────────────┘    └─────────────────┘    └─────────────────┘
        │                       │                       │
        └───────────────────────┼───────────────────────┘
                                │
                    ┌───────────────────────┐
                    │  Vector Search &      │
                    │  Semantic Retrieval   │
                    │   (Pinecone/pgvector) │
                    └───────────────────────┘
                                │
                    ┌───────────────────────┐
                    │   Context Fusion      │
                    │   & Optimization      │
                    │  (Token Management)   │
                    └───────────────────────┘
                                │
                    ┌───────────────────────┐
                    │   Enhanced Prompt     │
                    │    Construction       │
                    └───────────────────────┘
```

### **Core Context Service Interface**
```csharp
public interface IContextService
{
    // Primary context operations
    Task<CampaignContext> GetCampaignContextAsync(Guid campaignId, ContextOptions options = null);
    Task<SessionContext> GetSessionContextAsync(Guid sessionId, ContextOptions options = null);
    Task<CharacterContext> GetCharacterContextAsync(Guid characterId, ContextOptions options = null);
    Task<NPCContext> GetNPCContextAsync(Guid npcId, ContextOptions options = null);
    Task<UserContext> GetUserContextAsync(Guid userId, ContextOptions options = null);
    
    // Context enhancement and fusion
    Task<EnhancedContext> BuildEnhancedContextAsync(AIRequest request, ContextOptions options = null);
    Task<string> GenerateContextPromptAsync(EnhancedContext context, string userQuery);
    
    // Memory management
    Task StoreInteractionMemoryAsync(InteractionMemory memory);
    Task<List<InteractionMemory>> RetrieveRelevantMemoriesAsync(string query, Guid campaignId, int limit = 10);
    Task UpdateEntityMemoryAsync(Guid entityId, EntityType entityType, string memoryUpdate);
    
    // Vector operations
    Task<List<VectorSearchResult>> SemanticSearchAsync(SemanticSearchRequest request);
    Task StoreEmbeddingAsync(EmbeddingData embedding);
    Task<List<EmbeddingData>> GetSimilarEmbeddingsAsync(float[] queryVector, int limit = 10);
    
    // Context optimization
    Task<OptimizedContext> OptimizeContextForTokenLimitAsync(EnhancedContext context, int maxTokens);
    Task<ContextCompressionResult> CompressContextAsync(EnhancedContext context, float compressionRatio);
}

public class ContextOptions
{
    public int MaxTokens { get; set; } = 4000;
    public int MaxMemories { get; set; } = 10;
    public int MaxRecentEvents { get; set; } = 20;
    public bool IncludePersonalities { get; set; } = true;
    public bool IncludeRelationships { get; set; } = true;
    public bool IncludeWorldState { get; set; } = true;
    public bool IncludeQuestContext { get; set; } = true;
    public bool IncludeCharacterDetails { get; set; } = true;
    public ContextPriority Priority { get; set; } = ContextPriority.Balanced;
    public List<string> ExcludedContextTypes { get; set; } = new();
    public Dictionary<string, object> CustomParameters { get; set; } = new();
}

public enum ContextPriority
{
    Recent,      // Prioritize recent events and interactions
    Relevant,    // Prioritize semantically relevant content
    Important,   // Prioritize important entities and events
    Balanced,    // Balance all factors
    Comprehensive // Include as much context as possible
}
```

### **Context Data Models**

#### **Enhanced Context Model**
```csharp
public class EnhancedContext
{
    public Guid RequestId { get; set; }
    public DateTime CreatedAt { get; set; }
    public ContextMetadata Metadata { get; set; } = new();
    
    // Primary context components
    public CampaignContext? Campaign { get; set; }
    public SessionContext? Session { get; set; }
    public List<CharacterContext> Characters { get; set; } = new();
    public List<NPCContext> NPCs { get; set; } = new();
    public UserContext? User { get; set; }
    
    // Semantic context
    public List<InteractionMemory> RelevantMemories { get; set; } = new();
    public List<VectorSearchResult> SemanticMatches { get; set; } = new();
    public List<ContextualEntity> RelatedEntities { get; set; } = new();
    
    // Temporal context
    public List<EventSummary> RecentEvents { get; set; } = new();
    public List<EventSummary> ImportantEvents { get; set; } = new();
    public TimelineContext Timeline { get; set; } = new();
    
    // Relationship context
    public RelationshipGraph Relationships { get; set; } = new();
    public List<SocialDynamic> SocialDynamics { get; set; } = new();
    
    // World context
    public WorldStateContext WorldState { get; set; } = new();
    public List<LocationContext> Locations { get; set; } = new();
    public List<QuestContext> Quests { get; set; } = new();
    
    // Token management
    public int EstimatedTokens { get; set; }
    public bool IsCompressed { get; set; }
    public float CompressionRatio { get; set; }
    
    // Context quality metrics
    public ContextQualityMetrics QualityMetrics { get; set; } = new();
}

public class ContextMetadata
{
    public string ContextVersion { get; set; } = "1.0";
    public ContextPriority Priority { get; set; }
    public List<string> IncludedContextTypes { get; set; } = new();
    public List<string> ExcludedContextTypes { get; set; } = new();
    public Dictionary<string, float> ContextWeights { get; set; } = new();
    public int MaxTokenLimit { get; set; }
    public bool UseSemanticSearch { get; set; } = true;
    public string OptimizationStrategy { get; set; } = "balanced";
}
```

#### **Campaign Context**
```csharp
public class CampaignContext
{
    public Guid CampaignId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public CampaignSettings Settings { get; set; } = new();
    
    // World information
    public WorldStateSnapshot WorldState { get; set; } = new();
    public List<LocationSummary> KeyLocations { get; set; } = new();
    public List<FactionSummary> Factions { get; set; } = new();
    public List<LoreSummary> ImportantLore { get; set; } = new();
    
    // Quest information
    public List<QuestSummary> ActiveQuests { get; set; } = new();
    public List<QuestSummary> CompletedQuests { get; set; } = new();
    public List<QuestHook> AvailableHooks { get; set; } = new();
    
    // Campaign tone and style
    public CampaignTone Tone { get; set; } = new();
    public List<string> Themes { get; set; } = new();
    public List<string> ContentGuidelines { get; set; } = new();
    
    // Temporal context
    public CampaignTimeline Timeline { get; set; } = new();
    public DateTime LastSessionDate { get; set; }
    public int TotalSessions { get; set; }
    
    // Context freshness
    public DateTime LastUpdated { get; set; }
    public List<string> RecentChanges { get; set; } = new();
}

public class WorldStateSnapshot
{
    public string CurrentSeason { get; set; } = string.Empty;
    public string CurrentLocation { get; set; } = string.Empty;
    public string PoliticalSituation { get; set; } = string.Empty;
    public string EconomicState { get; set; } = string.Empty;
    public List<string> OngoingEvents { get; set; } = new();
    public List<string> Rumors { get; set; } = new();
    public Dictionary<string, string> ImportantNPCStatus { get; set; } = new();
    public Dictionary<string, object> CustomWorldState { get; set; } = new();
}

public class CampaignTone
{
    public string PrimaryTone { get; set; } = "Balanced"; // Serious, Humorous, Dark, Heroic, etc.
    public float SeriousnessLevel { get; set; } = 0.5f; // 0.0 = Very Light, 1.0 = Very Serious
    public float ViolenceLevel { get; set; } = 0.3f; // Content violence level
    public float MysteryLevel { get; set; } = 0.4f; // How mysterious/secretive
    public float PoliticalComplexity { get; set; } = 0.3f; // Political intrigue level
    public List<string> PreferredNarrativeStyles { get; set; } = new();
    public List<string> AvoidedTopics { get; set; } = new();
}
```

#### **Session Context**
```csharp
public class SessionContext
{
    public Guid SessionId { get; set; }
    public Guid CampaignId { get; set; }
    public DateTime SessionDate { get; set; }
    public SessionStatus Status { get; set; }
    public TimeSpan Duration { get; set; }
    
    // Current session state
    public string CurrentScene { get; set; } = string.Empty;
    public string CurrentLocation { get; set; } = string.Empty;
    public List<Guid> ActiveCharacters { get; set; } = new();
    public List<Guid> PresentNPCs { get; set; } = new();
    
    // Session events and interactions
    public List<SessionEvent> Events { get; set; } = new();
    public List<DialogueExchange> RecentDialogue { get; set; } = new();
    public List<CombatEncounter> CombatHistory { get; set; } = new();
    public List<SkillCheck> SkillChecks { get; set; } = new();
    
    // Current objectives and focus
    public string CurrentObjective { get; set; } = string.Empty;
    public List<string> SessionGoals { get; set; } = new();
    public string GMNotes { get; set; } = string.Empty;
    
    // Mood and atmosphere
    public SessionMood CurrentMood { get; set; } = new();
    public List<string> AtmosphericElements { get; set; } = new();
    
    // Continuity tracking
    public List<string> UnresolvedPlotThreads { get; set; } = new();
    public List<string> ImportantDecisions { get; set; } = new();
    public Dictionary<string, object> SessionState { get; set; } = new();
}

public class SessionEvent
{
    public Guid EventId { get; set; }
    public DateTime Timestamp { get; set; }
    public EventType Type { get; set; }
    public string Summary { get; set; } = string.Empty;
    public string DetailedDescription { get; set; } = string.Empty;
    public List<Guid> InvolvedCharacters { get; set; } = new();
    public List<Guid> InvolvedNPCs { get; set; } = new();
    public string Location { get; set; } = string.Empty;
    public EventImportance Importance { get; set; }
    public Dictionary<string, object> EventData { get; set; } = new();
}

public enum EventType
{
    Dialogue,
    Combat,
    Exploration,
    SocialInteraction,
    QuestProgress,
    Discovery,
    Decision,
    Consequence,
    Revelation,
    Mystery
}

public enum EventImportance
{
    Trivial,
    Minor,
    Moderate,
    Important,
    Critical,
    CampaignDefining
}
```

#### **NPC Context**
```csharp
public class NPCContext
{
    public Guid NPCId { get; set; }
    public string Name { get; set; } = string.Empty;
    public Guid CampaignId { get; set; }
    
    // Core NPC information
    public NPCPersonality Personality { get; set; } = new();
    public NPCBackground Background { get; set; } = new();
    public NPCAppearance Appearance { get; set; } = new();
    public NPCStats Stats { get; set; } = new();
    
    // Relationships and social context
    public List<NPCRelationship> Relationships { get; set; } = new();
    public List<CharacterRelationship> PlayerRelationships { get; set; } = new();
    public string SocialRole { get; set; } = string.Empty;
    public string Reputation { get; set; } = string.Empty;
    
    // Dialogue and interaction history
    public List<DialogueMemory> DialogueHistory { get; set; } = new();
    public List<InteractionMemory> InteractionHistory { get; set; } = new();
    public string CurrentMood { get; set; } = string.Empty;
    public List<string> CurrentConcerns { get; set; } = new();
    
    // Knowledge and awareness
    public List<string> KnownSecrets { get; set; } = new();
    public List<string> Rumors { get; set; } = new();
    public Dictionary<string, int> KnowledgeAreas { get; set; } = new(); // Area -> Expertise Level
    public List<string> RecentEvents { get; set; } = new();
    
    // Goals and motivations
    public List<NPCGoal> Goals { get; set; } = new();
    public List<string> Motivations { get; set; } = new();
    public List<string> Fears { get; set; } = new();
    public string CurrentPriority { get; set; } = string.Empty;
    
    // Behavioral patterns
    public NPCBehaviorProfile BehaviorProfile { get; set; } = new();
    public List<ConversationTopic> PreferredTopics { get; set; } = new();
    public List<ConversationTopic> AvoidedTopics { get; set; } = new();
    
    // Context metadata
    public DateTime LastInteraction { get; set; }
    public string CurrentLocation { get; set; } = string.Empty;
    public NPCAvailability Availability { get; set; } = new();
}

public class NPCPersonality
{
    // Big Five personality traits (0.0 to 1.0 scale)
    public float Openness { get; set; } = 0.5f;
    public float Conscientiousness { get; set; } = 0.5f;
    public float Extraversion { get; set; } = 0.5f;
    public float Agreeableness { get; set; } = 0.5f;
    public float Neuroticism { get; set; } = 0.5f;
    
    // D&D specific traits
    public List<string> PersonalityTraits { get; set; } = new();
    public List<string> Ideals { get; set; } = new();
    public List<string> Bonds { get; set; } = new();
    public List<string> Flaws { get; set; } = new();
    
    // Behavioral tendencies
    public SpeechPattern SpeechPattern { get; set; } = new();
    public List<string> Mannerisms { get; set; } = new();
    public string TypicalMood { get; set; } = string.Empty;
    public float TrustLevel { get; set; } = 0.5f; // How trusting they are
    public float Loyalty { get; set; } = 0.5f; // How loyal they are
}

public class SpeechPattern
{
    public string Accent { get; set; } = string.Empty;
    public string VocabularyLevel { get; set; } = "Average"; // Simple, Average, Complex, Archaic
    public float Formality { get; set; } = 0.5f; // 0.0 = Very Casual, 1.0 = Very Formal
    public List<string> CatchPhrases { get; set; } = new();
    public List<string> CommonWords { get; set; } = new();
    public string SpeechTempo { get; set; } = "Normal"; // Slow, Normal, Fast, Rapid
    public bool UsesProfanity { get; set; } = false;
    public List<string> CulturalExpressions { get; set; } = new();
}
```

### **Context Service Implementation**
```csharp
public class ContextService : IContextService
{
    private readonly IVectorDatabase _vectorDb;
    private readonly ICampaignRepository _campaignRepo;
    private readonly ISessionRepository _sessionRepo;
    private readonly ICharacterRepository _characterRepo;
    private readonly INPCRepository _npcRepo;
    private readonly IUserRepository _userRepo;
    private readonly IEmbeddingService _embeddingService;
    private readonly IMemoryCache _cache;
    private readonly ILogger<ContextService> _logger;
    private readonly ContextConfiguration _config;

    public async Task<EnhancedContext> BuildEnhancedContextAsync(AIRequest request, ContextOptions options = null)
    {
        options ??= new ContextOptions();
        var context = new EnhancedContext
        {
            RequestId = Guid.NewGuid(),
            CreatedAt = DateTime.UtcNow,
            Metadata = new ContextMetadata
            {
                Priority = options.Priority,
                MaxTokenLimit = options.MaxTokens,
                IncludedContextTypes = GetIncludedContextTypes(request, options),
                OptimizationStrategy = GetOptimizationStrategy(options.Priority)
            }
        };

        // Parallel context retrieval for performance
        var contextTasks = new List<Task>();
        
        // Campaign context
        if (request.CampaignId.HasValue)
        {
            contextTasks.Add(Task.Run(async () =>
            {
                context.Campaign = await GetCampaignContextAsync(request.CampaignId.Value, options);
            }));
        }

        // Session context
        if (request.SessionId.HasValue)
        {
            contextTasks.Add(Task.Run(async () =>
            {
                context.Session = await GetSessionContextAsync(request.SessionId.Value, options);
            }));
        }

        // User context
        contextTasks.Add(Task.Run(async () =>
        {
            context.User = await GetUserContextAsync(request.UserId, options);
        }));

        // Character contexts
        if (request.CharacterIds?.Any() == true)
        {
            contextTasks.Add(Task.Run(async () =>
            {
                var characterTasks = request.CharacterIds.Select(id => GetCharacterContextAsync(id, options));
                context.Characters = (await Task.WhenAll(characterTasks)).ToList();
            }));
        }

        // NPC contexts
        if (request.NPCIds?.Any() == true)
        {
            contextTasks.Add(Task.Run(async () =>
            {
                var npcTasks = request.NPCIds.Select(id => GetNPCContextAsync(id, options));
                context.NPCs = (await Task.WhenAll(npcTasks)).ToList();
            }));
        }

        await Task.WhenAll(contextTasks);

        // Semantic search for relevant memories and context
        if (options.MaxMemories > 0 && request.CampaignId.HasValue)
        {
            var query = ExtractQueryFromRequest(request);
            context.RelevantMemories = await RetrieveRelevantMemoriesAsync(query, request.CampaignId.Value, options.MaxMemories);
            
            if (context.Metadata.UseSemanticSearch)
            {
                var searchRequest = new SemanticSearchRequest
                {
                    Query = query,
                    CampaignId = request.CampaignId.Value,
                    Limit = 10,
                    MinimumSimilarity = 0.7f
                };
                context.SemanticMatches = await SemanticSearchAsync(searchRequest);
            }
        }

        // Build relationship graph
        await BuildRelationshipGraphAsync(context);

        // Estimate token usage
        context.EstimatedTokens = EstimateContextTokens(context);

        // Optimize context if it exceeds token limits
        if (context.EstimatedTokens > options.MaxTokens)
        {
            var optimizedContext = await OptimizeContextForTokenLimitAsync(context, options.MaxTokens);
            context = optimizedContext.EnhancedContext;
            context.IsCompressed = optimizedContext.WasCompressed;
            context.CompressionRatio = optimizedContext.CompressionRatio;
        }

        // Calculate quality metrics
        context.QualityMetrics = CalculateContextQuality(context);

        _logger.LogInformation(
            "Built enhanced context for request {RequestId}: {TokenCount} tokens, {ContextTypes} context types",
            context.RequestId, context.EstimatedTokens, string.Join(", ", context.Metadata.IncludedContextTypes));

        return context;
    }

    public async Task<string> GenerateContextPromptAsync(EnhancedContext context, string userQuery)
    {
        var promptBuilder = new StringBuilder();
        
        // System context header
        promptBuilder.AppendLine("# Campaign Context");
        promptBuilder.AppendLine($"*Generated at {context.CreatedAt:yyyy-MM-dd HH:mm:ss} UTC*");
        promptBuilder.AppendLine();

        // Campaign information
        if (context.Campaign != null)
        {
            promptBuilder.AppendLine("## Campaign Information");
            promptBuilder.AppendLine($"**Campaign**: {context.Campaign.Name}");
            
            if (!string.IsNullOrEmpty(context.Campaign.Description))
            {
                promptBuilder.AppendLine($"**Description**: {context.Campaign.Description}");
            }
            
            if (context.Campaign.Tone != null)
            {
                promptBuilder.AppendLine($"**Tone**: {context.Campaign.Tone.PrimaryTone} (Seriousness: {context.Campaign.Tone.SeriousnessLevel:P0})");
            }
            
            if (context.Campaign.Themes?.Any() == true)
            {
                promptBuilder.AppendLine($"**Themes**: {string.Join(", ", context.Campaign.Themes)}");
            }
            promptBuilder.AppendLine();
        }

        // Current world state
        if (context.Campaign?.WorldState != null)
        {
            promptBuilder.AppendLine("## Current World State");
            var ws = context.Campaign.WorldState;
            
            if (!string.IsNullOrEmpty(ws.CurrentLocation))
                promptBuilder.AppendLine($"**Current Location**: {ws.CurrentLocation}");
            
            if (!string.IsNullOrEmpty(ws.CurrentSeason))
                promptBuilder.AppendLine($"**Season**: {ws.CurrentSeason}");
            
            if (!string.IsNullOrEmpty(ws.PoliticalSituation))
                promptBuilder.AppendLine($"**Political Situation**: {ws.PoliticalSituation}");
            
            if (ws.OngoingEvents?.Any() == true)
            {
                promptBuilder.AppendLine("**Ongoing Events**:");
                foreach (var evt in ws.OngoingEvents.Take(3))
                {
                    promptBuilder.AppendLine($"- {evt}");
                }
            }
            promptBuilder.AppendLine();
        }

        // Active quests
        if (context.Campaign?.ActiveQuests?.Any() == true)
        {
            promptBuilder.AppendLine("## Active Quests");
            foreach (var quest in context.Campaign.ActiveQuests.Take(3))
            {
                promptBuilder.AppendLine($"**{quest.Name}**: {quest.CurrentObjective}");
                if (!string.IsNullOrEmpty(quest.Description))
                {
                    promptBuilder.AppendLine($"  *{quest.Description}*");
                }
            }
            promptBuilder.AppendLine();
        }

        // Key NPCs
        if (context.NPCs?.Any() == true)
        {
            promptBuilder.AppendLine("## Key NPCs");
            foreach (var npc in context.NPCs.Take(5))
            {
                promptBuilder.AppendLine($"**{npc.Name}**");
                
                if (npc.Personality?.PersonalityTraits?.Any() == true)
                {
                    promptBuilder.AppendLine($"  *Personality*: {string.Join(", ", npc.Personality.PersonalityTraits.Take(2))}");
                }
                
                if (!string.IsNullOrEmpty(npc.SocialRole))
                {
                    promptBuilder.AppendLine($"  *Role*: {npc.SocialRole}");
                }
                
                if (!string.IsNullOrEmpty(npc.CurrentMood))
                {
                    promptBuilder.AppendLine($"  *Current Mood*: {npc.CurrentMood}");
                }
                
                if (npc.PlayerRelationships?.Any() == true)
                {
                    var relationships = npc.PlayerRelationships.Take(2)
                        .Select(r => $"{r.CharacterName}: {r.RelationshipType} ({r.Disposition})")
                        .ToList();
                    promptBuilder.AppendLine($"  *Relationships*: {string.Join(", ", relationships)}");
                }
            }
            promptBuilder.AppendLine();
        }

        // Player characters
        if (context.Characters?.Any() == true)
        {
            promptBuilder.AppendLine("## Player Characters");
            foreach (var character in context.Characters)
            {
                promptBuilder.AppendLine($"**{character.Name}** ({character.Race} {character.Class}, Level {character.Level})");
                
                if (character.PersonalityTraits?.Any() == true)
                {
                    promptBuilder.AppendLine($"  *Personality*: {string.Join(", ", character.PersonalityTraits.Take(2))}");
                }
                
                if (!string.IsNullOrEmpty(character.CurrentGoal))
                {
                    promptBuilder.AppendLine($"  *Current Goal*: {character.CurrentGoal}");
                }
            }
            promptBuilder.AppendLine();
        }

        // Recent events
        if (context.Session?.Events?.Any() == true)
        {
            promptBuilder.AppendLine("## Recent Events");
            var recentEvents = context.Session.Events
                .OrderByDescending(e => e.Timestamp)
                .Take(5);
            
            foreach (var evt in recentEvents)
            {
                var timeAgo = DateTime.UtcNow - evt.Timestamp;
                var timeDescription = timeAgo.TotalMinutes < 60 
                    ? $"{(int)timeAgo.TotalMinutes}m ago"
                    : $"{(int)timeAgo.TotalHours}h ago";
                
                promptBuilder.AppendLine($"**{timeDescription}**: {evt.Summary}");
            }
            promptBuilder.AppendLine();
        }

        // Relevant memories
        if (context.RelevantMemories?.Any() == true)
        {
            promptBuilder.AppendLine("## Relevant Context");
            foreach (var memory in context.RelevantMemories.Take(3))
            {
                promptBuilder.AppendLine($"- {memory.Content}");
            }
            promptBuilder.AppendLine();
        }

        // User's current query
        promptBuilder.AppendLine("## Current Request");
        promptBuilder.AppendLine(userQuery);
        
        // Context generation instructions
        promptBuilder.AppendLine();
        promptBuilder.AppendLine("---");
        promptBuilder.AppendLine("*Please respond in character and maintain consistency with the established campaign context, NPC personalities, and ongoing storylines.*");

        return promptBuilder.ToString();
    }

    private async Task BuildRelationshipGraphAsync(EnhancedContext context)
    {
        var relationships = new RelationshipGraph();
        
        // Build NPC-NPC relationships
        foreach (var npc in context.NPCs)
        {
            foreach (var relationship in npc.Relationships)
            {
                relationships.AddRelationship(new Relationship
                {
                    FromEntityId = npc.NPCId,
                    FromEntityType = EntityType.NPC,
                    ToEntityId = relationship.RelatedNPCId,
                    ToEntityType = EntityType.NPC,
                    RelationshipType = relationship.RelationshipType,
                    Strength = relationship.Strength,
                    Description = relationship.Description
                });
            }
        }
        
        // Build Character-NPC relationships
        foreach (var character in context.Characters)
        {
            foreach (var npc in context.NPCs)
            {
                var playerRel = npc.PlayerRelationships?.FirstOrDefault(r => r.CharacterId == character.CharacterId);
                if (playerRel != null)
                {
                    relationships.AddRelationship(new Relationship
                    {
                        FromEntityId = character.CharacterId,
                        FromEntityType = EntityType.Character,
                        ToEntityId = npc.NPCId,
                        ToEntityType = EntityType.NPC,
                        RelationshipType = playerRel.RelationshipType,
                        Strength = playerRel.Strength,
                        Description = playerRel.Description
                    });
                }
            }
        }
        
        context.Relationships = relationships;
    }

    private int EstimateContextTokens(EnhancedContext context)
    {
        // Rough token estimation (4 characters per token average)
        int totalChars = 0;
        
        // Campaign context
        if (context.Campaign != null)
        {
            totalChars += context.Campaign.Name.Length;
            totalChars += context.Campaign.Description.Length;
            totalChars += context.Campaign.ActiveQuests.Sum(q => q.Name.Length + q.Description.Length + q.CurrentObjective.Length);
        }
        
        // Session context
        if (context.Session != null)
        {
            totalChars += context.Session.Events.Sum(e => e.Summary.Length + e.DetailedDescription.Length);
            totalChars += context.Session.CurrentScene.Length;
            totalChars += context.Session.CurrentObjective.Length;
        }
        
        // Character contexts
        totalChars += context.Characters.Sum(c => 
            c.Name.Length + 
            c.Background.Length + 
            (c.PersonalityTraits?.Sum(t => t.Length) ?? 0));
        
        // NPC contexts
        totalChars += context.NPCs.Sum(n => 
            n.Name.Length + 
            n.Background.Background.Length + 
            (n.Personality.PersonalityTraits?.Sum(t => t.Length) ?? 0) +
            n.DialogueHistory.Sum(d => d.Content.Length));
        
        // Memories
        totalChars += context.RelevantMemories.Sum(m => m.Content.Length);
        
        return (int)(totalChars / 4.0 * 1.2); // Add 20% buffer for formatting
    }
}
```

This comprehensive context management system provides the AI with rich, relevant, and well-structured information about the campaign world, enabling more intelligent and contextually appropriate responses while managing token limits effectively.
