# AI Integration Business Logic

## Overview
This document defines the comprehensive business logic for AI integration within the D&D AI Campaign Management System. It covers AI-powered content generation, intelligent NPC behavior, dynamic world building, context-aware assistance, and the orchestration of multiple AI providers to enhance the D&D experience.

## Domain Model

### AI Content Generation Engine
```csharp
public class AIContentGenerationEngine : IDomainService
{
    private readonly IAIProviderOrchestrator _providerOrchestrator;
    private readonly IContextManager _contextManager;
    private readonly IContentValidator _contentValidator;
    private readonly IContentRepository _contentRepository;
    private readonly IUsageTracker _usageTracker;

    public async Task<Result<GeneratedContent>> GenerateContentAsync(ContentGenerationRequest request)
    {
        // Validate request
        var validationResult = ValidateContentRequest(request);
        if (validationResult.IsFailure)
        {
            return Result.Failure<GeneratedContent>(validationResult.Error);
        }

        // Build context for AI generation
        var context = await _contextManager.BuildContextAsync(request);
        
        // Select optimal AI provider based on content type and context
        var provider = await _providerOrchestrator.SelectProviderAsync(request.ContentType, context);
        
        // Generate content
        var generationResult = await provider.GenerateContentAsync(request, context);
        if (generationResult.IsFailure)
        {
            return Result.Failure<GeneratedContent>(generationResult.Error);
        }

        // Validate and filter generated content
        var validatedContent = await _contentValidator.ValidateAndFilterAsync(generationResult.Value, request);
        if (validatedContent.IsFailure)
        {
            return Result.Failure<GeneratedContent>(validatedContent.Error);
        }

        // Track usage
        await _usageTracker.TrackUsageAsync(request, generationResult.Value, provider.ProviderId);

        // Store generated content
        await _contentRepository.StoreGeneratedContentAsync(validatedContent.Value);

        return Result.Success(validatedContent.Value);
    }
}

public class ContentGenerationRequest
{
    public string RequestId { get; set; } = Guid.NewGuid().ToString();
    public ContentType ContentType { get; set; }
    public string CampaignId { get; set; }
    public string UserId { get; set; }
    public GenerationParameters Parameters { get; set; }
    public List<string> ContextTags { get; set; } = new();
    public Dictionary<string, object> CustomProperties { get; set; } = new();
    public ContentQuality QualityLevel { get; set; } = ContentQuality.Standard;
    public bool AllowExplicitContent { get; set; } = false;
    public List<string> ExcludedTopics { get; set; } = new();
}

public enum ContentType
{
    NPCGeneration,
    LocationDescription,
    QuestGeneration,
    DialogueGeneration,
    CombatEncounter,
    TreasureGeneration,
    WorldBuilding,
    CharacterBackground,
    PlotHook,
    EnvironmentalDescription,
    MagicItem,
    Puzzle,
    Riddle,
    Prophecy,
    Lore
}

public enum ContentQuality
{
    Draft,
    Standard,
    Enhanced,
    Premium
}
```

### NPC AI Behavior System
```csharp
public class NPCAIBehaviorEngine : IDomainService
{
    private readonly IAIProviderOrchestrator _providerOrchestrator;
    private readonly INPCRepository _npcRepository;
    private readonly IPersonalityEngine _personalityEngine;
    private readonly IDialogueEngine _dialogueEngine;
    private readonly IEmotionEngine _emotionEngine;

    public async Task<Result<NPCResponse>> GenerateNPCResponseAsync(NPCInteractionRequest request)
    {
        // Get NPC data
        var npc = await _npcRepository.GetByIdAsync(request.NPCId);
        if (npc == null)
        {
            return Result.Failure<NPCResponse>("NPC not found");
        }

        // Build interaction context
        var context = await BuildInteractionContextAsync(npc, request);
        
        // Update NPC emotional state based on interaction
        var emotionalResponse = await _emotionEngine.ProcessInteractionAsync(npc, request, context);
        npc.UpdateEmotionalState(emotionalResponse);

        // Generate personality-driven response
        var personalityContext = await _personalityEngine.BuildPersonalityContextAsync(npc, context);
        
        // Generate dialogue response
        var dialogueRequest = new DialogueGenerationRequest
        {
            NPCId = npc.Id,
            PlayerInput = request.PlayerInput,
            Context = context,
            PersonalityContext = personalityContext,
            EmotionalState = npc.CurrentEmotionalState,
            RelationshipLevel = npc.GetRelationshipWith(request.PlayerId),
            ConversationHistory = await GetConversationHistoryAsync(npc.Id, request.PlayerId)
        };

        var dialogueResult = await _dialogueEngine.GenerateDialogueAsync(dialogueRequest);
        if (dialogueResult.IsFailure)
        {
            return Result.Failure<NPCResponse>(dialogueResult.Error);
        }

        // Update NPC memory and relationships
        await UpdateNPCMemoryAsync(npc, request, dialogueResult.Value);
        await UpdateRelationshipAsync(npc, request.PlayerId, request, dialogueResult.Value);

        // Create response
        var response = new NPCResponse
        {
            NPCId = npc.Id,
            Response = dialogueResult.Value,
            EmotionalState = npc.CurrentEmotionalState,
            RelationshipChange = npc.GetRelationshipChange(request.PlayerId),
            MemoryUpdates = npc.GetRecentMemoryUpdates(),
            SuggestedActions = await GenerateSuggestedActionsAsync(npc, context)
        };

        return Result.Success(response);
    }

    private async Task<InteractionContext> BuildInteractionContextAsync(NPC npc, NPCInteractionRequest request)
    {
        var campaign = await _campaignRepository.GetByIdAsync(npc.CampaignId);
        var location = await _locationRepository.GetByIdAsync(npc.CurrentLocationId);
        var player = await _characterRepository.GetByIdAsync(request.PlayerId);

        return new InteractionContext
        {
            Campaign = campaign,
            Location = location,
            NPC = npc,
            Player = player,
            CurrentTime = campaign.WorldState.CurrentTime,
            RecentEvents = await GetRecentEventsAsync(npc.CampaignId, TimeSpan.FromDays(7)),
            PartyComposition = await GetPartyCompositionAsync(campaign.Id),
            QuestStates = await GetActiveQuestStatesAsync(campaign.Id),
            WorldState = campaign.WorldState
        };
    }

    private async Task UpdateNPCMemoryAsync(NPC npc, NPCInteractionRequest request, DialogueResponse dialogue)
    {
        var memoryEntry = new NPCMemoryEntry
        {
            PlayerId = request.PlayerId,
            Interaction = request.PlayerInput,
            Response = dialogue.Response,
            EmotionalImpact = dialogue.EmotionalImpact,
            ImportanceLevel = CalculateImportanceLevel(request, dialogue),
            Timestamp = DateTime.UtcNow,
            Location = npc.CurrentLocationId,
            Witnesses = request.Witnesses
        };

        npc.AddMemory(memoryEntry);

        // Consolidate memories if needed
        if (npc.Memories.Count > npc.MaxMemories)
        {
            await ConsolidateMemoriesAsync(npc);
        }
    }
}

public class NPC : Entity, IAggregateRoot
{
    public string Id { get; private set; }
    public string Name { get; private set; }
    public string CampaignId { get; private set; }
    public NPCPersonality Personality { get; private set; }
    public EmotionalState CurrentEmotionalState { get; private set; }
    public string CurrentLocationId { get; private set; }
    public List<NPCMemoryEntry> Memories { get; private set; } = new();
    public Dictionary<string, Relationship> Relationships { get; private set; } = new();
    public List<NPCGoal> Goals { get; private set; } = new();
    public NPCKnowledge Knowledge { get; private set; }
    public NPCSchedule Schedule { get; private set; }
    public int MaxMemories { get; private set; } = 100;

    public void UpdateEmotionalState(EmotionalResponse response)
    {
        CurrentEmotionalState = CurrentEmotionalState.ApplyResponse(response);
        AddDomainEvent(new NPCEmotionalStateChangedEvent(Id, CurrentEmotionalState));
    }

    public Relationship GetRelationshipWith(string characterId)
    {
        return Relationships.GetValueOrDefault(characterId, Relationship.CreateNeutral());
    }

    public void UpdateRelationship(string characterId, RelationshipChange change)
    {
        if (!Relationships.ContainsKey(characterId))
        {
            Relationships[characterId] = Relationship.CreateNeutral();
        }

        var oldRelationship = Relationships[characterId];
        Relationships[characterId] = oldRelationship.ApplyChange(change);

        AddDomainEvent(new NPCRelationshipChangedEvent(Id, characterId, oldRelationship, Relationships[characterId]));
    }

    public void AddMemory(NPCMemoryEntry memory)
    {
        Memories.Add(memory);
        Memories = Memories.OrderByDescending(m => m.ImportanceLevel)
                          .ThenByDescending(m => m.Timestamp)
                          .ToList();

        AddDomainEvent(new NPCMemoryAddedEvent(Id, memory));
    }

    public List<NPCMemoryEntry> GetRelevantMemories(string playerId, int maxCount = 10)
    {
        return Memories.Where(m => m.PlayerId == playerId || m.ImportanceLevel >= ImportanceLevel.High)
                      .Take(maxCount)
                      .ToList();
    }
}

public class NPCPersonality : ValueObject
{
    public PersonalityTraits Traits { get; private set; }
    public List<string> Ideals { get; private set; }
    public List<string> Bonds { get; private set; }
    public List<string> Flaws { get; private set; }
    public CommunicationStyle CommunicationStyle { get; private set; }
    public int Openness { get; private set; } // 1-10
    public int Conscientiousness { get; private set; } // 1-10
    public int Extraversion { get; private set; } // 1-10
    public int Agreeableness { get; private set; } // 1-10
    public int Neuroticism { get; private set; } // 1-10

    public static NPCPersonality CreateFromAI(AIPersonalityGenerationResult aiResult)
    {
        return new NPCPersonality
        {
            Traits = PersonalityTraits.Parse(aiResult.Traits),
            Ideals = aiResult.Ideals,
            Bonds = aiResult.Bonds,
            Flaws = aiResult.Flaws,
            CommunicationStyle = CommunicationStyle.Parse(aiResult.CommunicationStyle),
            Openness = aiResult.BigFiveScores.Openness,
            Conscientiousness = aiResult.BigFiveScores.Conscientiousness,
            Extraversion = aiResult.BigFiveScores.Extraversion,
            Agreeableness = aiResult.BigFiveScores.Agreeableness,
            Neuroticism = aiResult.BigFiveScores.Neuroticism
        };
    }

    public double GetCompatibilityWith(NPCPersonality other)
    {
        // Calculate personality compatibility using Big Five model
        var opennessDiff = Math.Abs(Openness - other.Openness);
        var conscientiousnessDiff = Math.Abs(Conscientiousness - other.Conscientiousness);
        var extraversionDiff = Math.Abs(Extraversion - other.Extraversion);
        var agreeablenessDiff = Math.Abs(Agreeableness - other.Agreeableness);
        var neuroticismDiff = Math.Abs(Neuroticism - other.Neuroticism);

        var totalDiff = opennessDiff + conscientiousnessDiff + extraversionDiff + agreeablenessDiff + neuroticismDiff;
        var maxPossibleDiff = 45.0; // 9 * 5 traits

        return 1.0 - (totalDiff / maxPossibleDiff);
    }
}

public class EmotionalState : ValueObject
{
    public int Happiness { get; private set; } // -10 to 10
    public int Anger { get; private set; } // 0 to 10
    public int Fear { get; private set; } // 0 to 10
    public int Sadness { get; private set; } // 0 to 10
    public int Surprise { get; private set; } // 0 to 10
    public int Disgust { get; private set; } // 0 to 10
    public int Trust { get; private set; } // -10 to 10
    public int Anticipation { get; private set; } // 0 to 10

    public static EmotionalState CreateNeutral()
    {
        return new EmotionalState
        {
            Happiness = 0,
            Anger = 0,
            Fear = 0,
            Sadness = 0,
            Surprise = 0,
            Disgust = 0,
            Trust = 0,
            Anticipation = 0
        };
    }

    public EmotionalState ApplyResponse(EmotionalResponse response)
    {
        return new EmotionalState
        {
            Happiness = Math.Max(-10, Math.Min(10, Happiness + response.HappinessChange)),
            Anger = Math.Max(0, Math.Min(10, Anger + response.AngerChange)),
            Fear = Math.Max(0, Math.Min(10, Fear + response.FearChange)),
            Sadness = Math.Max(0, Math.Min(10, Sadness + response.SadnessChange)),
            Surprise = Math.Max(0, Math.Min(10, Surprise + response.SurpriseChange)),
            Disgust = Math.Max(0, Math.Min(10, Disgust + response.DisgustChange)),
            Trust = Math.Max(-10, Math.Min(10, Trust + response.TrustChange)),
            Anticipation = Math.Max(0, Math.Min(10, Anticipation + response.AnticipationChange))
        };
    }

    public string GetPrimaryEmotion()
    {
        var emotions = new Dictionary<string, int>
        {
            { "Happy", Happiness },
            { "Angry", Anger },
            { "Fearful", Fear },
            { "Sad", Sadness },
            { "Surprised", Surprise },
            { "Disgusted", Disgust },
            { "Trusting", Trust },
            { "Anticipating", Anticipation }
        };

        return emotions.OrderByDescending(e => Math.Abs(e.Value)).First().Key;
    }
}
```

## AI Context Management

### Context Manager
```csharp
public class AIContextManager : IDomainService
{
    private readonly ICampaignRepository _campaignRepository;
    private readonly ICharacterRepository _characterRepository;
    private readonly INPCRepository _npcRepository;
    private readonly ISessionRepository _sessionRepository;
    private readonly IVectorDatabase _vectorDatabase;
    private readonly IEmbeddingService _embeddingService;

    public async Task<AIContext> BuildContextAsync(ContentGenerationRequest request)
    {
        var context = new AIContext
        {
            RequestId = request.RequestId,
            ContentType = request.ContentType,
            CampaignId = request.CampaignId,
            UserId = request.UserId
        };

        // Get campaign context
        var campaign = await _campaignRepository.GetByIdAsync(request.CampaignId);
        if (campaign != null)
        {
            context.Campaign = await BuildCampaignContextAsync(campaign);
        }

        // Get relevant characters
        context.Characters = await BuildCharacterContextAsync(request.CampaignId, request.ContextTags);

        // Get relevant NPCs
        context.NPCs = await BuildNPCContextAsync(request.CampaignId, request.ContextTags);

        // Get recent session history
        context.RecentSessions = await BuildSessionHistoryContextAsync(request.CampaignId, TimeSpan.FromDays(30));

        // Get relevant world knowledge
        context.WorldKnowledge = await BuildWorldKnowledgeContextAsync(request);

        // Get content-specific context
        context.SpecificContext = await BuildSpecificContextAsync(request);

        return context;
    }

    private async Task<CampaignContext> BuildCampaignContextAsync(Campaign campaign)
    {
        return new CampaignContext
        {
            Name = campaign.Name,
            Description = campaign.Description,
            Settings = campaign.Settings,
            WorldState = campaign.WorldState,
            Theme = await ExtractCampaignThemeAsync(campaign),
            ToneAndStyle = await ExtractToneAndStyleAsync(campaign),
            ImportantEvents = await GetImportantEventsAsync(campaign.Id),
            ActivePlotlines = await GetActivePlotlinesAsync(campaign.Id)
        };
    }

    private async Task<List<CharacterContext>> BuildCharacterContextAsync(string campaignId, List<string> contextTags)
    {
        var characters = await _characterRepository.GetByCampaignIdAsync(campaignId);
        var characterContexts = new List<CharacterContext>();

        foreach (var character in characters)
        {
            // Check if character is relevant to context
            if (IsCharacterRelevant(character, contextTags))
            {
                characterContexts.Add(new CharacterContext
                {
                    Id = character.Id,
                    Name = character.Name,
                    Class = character.PrimaryClass.Name,
                    Race = character.Race.Name,
                    Background = character.Background.Name,
                    Personality = character.Personality,
                    RecentActions = await GetRecentCharacterActionsAsync(character.Id),
                    Relationships = await GetCharacterRelationshipsAsync(character.Id),
                    Goals = await GetCharacterGoalsAsync(character.Id)
                });
            }
        }

        return characterContexts;
    }

    public async Task<List<RelevantKnowledge>> SearchRelevantKnowledgeAsync(string query, string campaignId, int maxResults = 10)
    {
        // Generate embedding for the query
        var queryEmbedding = await _embeddingService.GenerateEmbeddingAsync(query);

        // Search vector database for relevant content
        var searchResults = await _vectorDatabase.SearchSimilarAsync(
            queryEmbedding,
            new VectorSearchOptions
            {
                MaxResults = maxResults,
                MinSimilarity = 0.7f,
                Filters = new Dictionary<string, object>
                {
                    { "campaign_id", campaignId }
                }
            });

        var relevantKnowledge = new List<RelevantKnowledge>();

        foreach (var result in searchResults)
        {
            relevantKnowledge.Add(new RelevantKnowledge
            {
                Content = result.Content,
                ContentType = result.Metadata["content_type"].ToString(),
                Relevance = result.Similarity,
                Source = result.Metadata["source"].ToString(),
                LastUpdated = DateTime.Parse(result.Metadata["last_updated"].ToString())
            });
        }

        return relevantKnowledge.OrderByDescending(k => k.Relevance).ToList();
    }

    public async Task StoreKnowledgeAsync(string content, string contentType, string campaignId, Dictionary<string, object> metadata)
    {
        // Generate embedding for the content
        var embedding = await _embeddingService.GenerateEmbeddingAsync(content);

        // Prepare metadata
        var enrichedMetadata = new Dictionary<string, object>(metadata)
        {
            { "campaign_id", campaignId },
            { "content_type", contentType },
            { "created_at", DateTime.UtcNow },
            { "last_updated", DateTime.UtcNow }
        };

        // Store in vector database
        await _vectorDatabase.StoreAsync(new VectorEntry
        {
            Id = Guid.NewGuid().ToString(),
            Content = content,
            Embedding = embedding,
            Metadata = enrichedMetadata
        });
    }
}

public class AIContext
{
    public string RequestId { get; set; }
    public ContentType ContentType { get; set; }
    public string CampaignId { get; set; }
    public string UserId { get; set; }
    public CampaignContext Campaign { get; set; }
    public List<CharacterContext> Characters { get; set; } = new();
    public List<NPCContext> NPCs { get; set; } = new();
    public List<SessionContext> RecentSessions { get; set; } = new();
    public List<RelevantKnowledge> WorldKnowledge { get; set; } = new();
    public Dictionary<string, object> SpecificContext { get; set; } = new();
    public List<string> ContentConstraints { get; set; } = new();
    public List<string> StyleGuidelines { get; set; } = new();
}

public class CampaignContext
{
    public string Name { get; set; }
    public string Description { get; set; }
    public CampaignSettings Settings { get; set; }
    public WorldState WorldState { get; set; }
    public string Theme { get; set; }
    public string ToneAndStyle { get; set; }
    public List<ImportantEvent> ImportantEvents { get; set; } = new();
    public List<Plotline> ActivePlotlines { get; set; } = new();
}
```

## AI Provider Orchestration

### Provider Orchestrator
```csharp
public class AIProviderOrchestrator : IDomainService
{
    private readonly Dictionary<string, IAIProvider> _providers;
    private readonly IProviderSelector _providerSelector;
    private readonly ILoadBalancer _loadBalancer;
    private readonly IFailoverManager _failoverManager;
    private readonly IUsageTracker _usageTracker;
    private readonly ILogger<AIProviderOrchestrator> _logger;

    public AIProviderOrchestrator(
        IEnumerable<IAIProvider> providers,
        IProviderSelector providerSelector,
        ILoadBalancer loadBalancer,
        IFailoverManager failoverManager,
        IUsageTracker usageTracker,
        ILogger<AIProviderOrchestrator> logger)
    {
        _providers = providers.ToDictionary(p => p.ProviderId, p => p);
        _providerSelector = providerSelector;
        _loadBalancer = loadBalancer;
        _failoverManager = failoverManager;
        _usageTracker = usageTracker;
        _logger = logger;
    }

    public async Task<IAIProvider> SelectProviderAsync(ContentType contentType, AIContext context)
    {
        // Get provider selection criteria
        var criteria = new ProviderSelectionCriteria
        {
            ContentType = contentType,
            QualityRequirement = context.QualityRequirement,
            LatencyRequirement = context.LatencyRequirement,
            CostConstraint = context.CostConstraint,
            SpecialRequirements = context.SpecialRequirements
        };

        // Get suitable providers
        var suitableProviders = await _providerSelector.GetSuitableProvidersAsync(criteria);
        if (!suitableProviders.Any())
        {
            throw new InvalidOperationException("No suitable AI providers available");
        }

        // Apply load balancing
        var selectedProvider = await _loadBalancer.SelectProviderAsync(suitableProviders);

        _logger.LogInformation("Selected AI provider {Provider} for content type {ContentType}", 
            selectedProvider.ProviderId, contentType);

        return selectedProvider;
    }

    public async Task<Result<GeneratedContent>> GenerateWithFailoverAsync(
        ContentGenerationRequest request, 
        AIContext context)
    {
        var providers = await GetOrderedProvidersAsync(request.ContentType, context);
        Exception lastException = null;

        foreach (var provider in providers)
        {
            try
            {
                _logger.LogDebug("Attempting content generation with provider {Provider}", provider.ProviderId);

                var result = await provider.GenerateContentAsync(request, context);
                if (result.IsSuccess)
                {
                    await _usageTracker.TrackSuccessfulUsageAsync(provider.ProviderId, request, result.Value);
                    return result;
                }

                lastException = new Exception(result.Error);
                await _usageTracker.TrackFailedUsageAsync(provider.ProviderId, request, result.Error);
            }
            catch (Exception ex)
            {
                lastException = ex;
                await _usageTracker.TrackFailedUsageAsync(provider.ProviderId, request, ex.Message);
                _logger.LogWarning(ex, "Provider {Provider} failed for request {RequestId}", 
                    provider.ProviderId, request.RequestId);

                // Mark provider as potentially unhealthy
                await _failoverManager.ReportProviderIssueAsync(provider.ProviderId, ex);
            }
        }

        return Result.Failure<GeneratedContent>(
            $"All AI providers failed. Last error: {lastException?.Message ?? "Unknown error"}");
    }

    private async Task<List<IAIProvider>> GetOrderedProvidersAsync(ContentType contentType, AIContext context)
    {
        var criteria = new ProviderSelectionCriteria
        {
            ContentType = contentType,
            QualityRequirement = context.QualityRequirement,
            LatencyRequirement = context.LatencyRequirement,
            CostConstraint = context.CostConstraint
        };

        var suitableProviders = await _providerSelector.GetSuitableProvidersAsync(criteria);
        
        // Order by preference and health status
        return suitableProviders
            .Where(p => _failoverManager.IsProviderHealthy(p.ProviderId))
            .OrderByDescending(p => p.GetCapabilityScore(contentType))
            .ThenBy(p => _loadBalancer.GetProviderLoad(p.ProviderId))
            .ToList();
    }
}

public interface IAIProvider
{
    string ProviderId { get; }
    string ProviderName { get; }
    List<ContentType> SupportedContentTypes { get; }
    ProviderCapabilities Capabilities { get; }
    
    Task<Result<GeneratedContent>> GenerateContentAsync(ContentGenerationRequest request, AIContext context);
    Task<ProviderStatus> GetStatusAsync();
    Task<UsageStatistics> GetUsageStatisticsAsync();
    double GetCapabilityScore(ContentType contentType);
}

public class OpenAIProvider : IAIProvider
{
    public string ProviderId => "openai";
    public string ProviderName => "OpenAI";
    public List<ContentType> SupportedContentTypes => new()
    {
        ContentType.NPCGeneration,
        ContentType.DialogueGeneration,
        ContentType.QuestGeneration,
        ContentType.LocationDescription,
        ContentType.WorldBuilding,
        ContentType.CharacterBackground,
        ContentType.PlotHook,
        ContentType.Lore
    };

    public ProviderCapabilities Capabilities { get; private set; }

    private readonly IOpenAIClient _client;
    private readonly ILogger<OpenAIProvider> _logger;

    public async Task<Result<GeneratedContent>> GenerateContentAsync(
        ContentGenerationRequest request, 
        AIContext context)
    {
        try
        {
            // Build prompt based on content type and context
            var prompt = await BuildPromptAsync(request, context);
            
            // Configure generation parameters
            var parameters = ConfigureGenerationParameters(request);
            
            // Call OpenAI API
            var response = await _client.GenerateCompletionAsync(new CompletionRequest
            {
                Prompt = prompt,
                MaxTokens = parameters.MaxTokens,
                Temperature = parameters.Temperature,
                TopP = parameters.TopP,
                FrequencyPenalty = parameters.FrequencyPenalty,
                PresencePenalty = parameters.PresencePenalty,
                Stop = parameters.StopSequences
            });

            // Parse and structure the response
            var generatedContent = await ParseResponseAsync(response, request.ContentType);
            
            return Result.Success(generatedContent);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "OpenAI content generation failed for request {RequestId}", request.RequestId);
            return Result.Failure<GeneratedContent>($"OpenAI generation failed: {ex.Message}");
        }
    }

    private async Task<string> BuildPromptAsync(ContentGenerationRequest request, AIContext context)
    {
        var promptBuilder = new PromptBuilder();
        
        // Add system context
        promptBuilder.AddSystemContext($"You are an expert D&D 5e Dungeon Master assistant helping to generate {request.ContentType}.");
        
        // Add campaign context
        if (context.Campaign != null)
        {
            promptBuilder.AddCampaignContext(context.Campaign);
        }
        
        // Add character context
        if (context.Characters.Any())
        {
            promptBuilder.AddCharacterContext(context.Characters);
        }
        
        // Add specific instructions based on content type
        promptBuilder.AddContentTypeInstructions(request.ContentType);
        
        // Add generation parameters
        promptBuilder.AddGenerationParameters(request.Parameters);
        
        // Add constraints
        if (request.ExcludedTopics.Any())
        {
            promptBuilder.AddConstraints($"Do not include content related to: {string.Join(", ", request.ExcludedTopics)}");
        }
        
        return promptBuilder.Build();
    }

    public double GetCapabilityScore(ContentType contentType)
    {
        return contentType switch
        {
            ContentType.NPCGeneration => 0.95,
            ContentType.DialogueGeneration => 0.98,
            ContentType.QuestGeneration => 0.90,
            ContentType.LocationDescription => 0.85,
            ContentType.WorldBuilding => 0.88,
            ContentType.CharacterBackground => 0.92,
            ContentType.PlotHook => 0.87,
            ContentType.Lore => 0.89,
            _ => 0.0
        };
    }
}
```

## Content Validation and Filtering

### Content Validator
```csharp
public class AIContentValidator : IDomainService
{
    private readonly IContentModerationService _moderationService;
    private readonly IDnDRulesValidator _rulesValidator;
    private readonly IQualityAssessmentService _qualityService;
    private readonly ICampaignRepository _campaignRepository;

    public async Task<Result<GeneratedContent>> ValidateAndFilterAsync(
        GeneratedContent content, 
        ContentGenerationRequest request)
    {
        // Content moderation check
        var moderationResult = await _moderationService.ModerateContentAsync(content.RawContent);
        if (moderationResult.HasViolations && !request.AllowExplicitContent)
        {
            return Result.Failure<GeneratedContent>(
                $"Content violates moderation policies: {string.Join(", ", moderationResult.Violations)}");
        }

        // D&D rules compliance check
        var rulesValidation = await _rulesValidator.ValidateContentAsync(content, request.ContentType);
        if (rulesValidation.HasViolations)
        {
            // Try to fix minor rule violations
            var fixedContent = await _rulesValidator.FixRuleViolationsAsync(content, rulesValidation.Violations);
            if (fixedContent.IsSuccess)
            {
                content = fixedContent.Value;
            }
            else if (rulesValidation.HasMajorViolations)
            {
                return Result.Failure<GeneratedContent>(
                    $"Content has major D&D rule violations: {string.Join(", ", rulesValidation.MajorViolations)}");
            }
        }

        // Quality assessment
        var qualityScore = await _qualityService.AssessQualityAsync(content, request);
        if (qualityScore < GetMinimumQualityThreshold(request.QualityLevel))
        {
            return Result.Failure<GeneratedContent>(
                $"Content quality score {qualityScore:F2} below minimum threshold");
        }

        // Campaign-specific validation
        var campaign = await _campaignRepository.GetByIdAsync(request.CampaignId);
        if (campaign != null)
        {
            var campaignValidation = await ValidateAgainstCampaignSettingsAsync(content, campaign.Settings);
            if (campaignValidation.IsFailure)
            {
                return Result.Failure<GeneratedContent>(campaignValidation.Error);
            }
        }

        // Apply content filtering if needed
        var filteredContent = await ApplyContentFiltersAsync(content, request);

        // Set validation metadata
        filteredContent.ValidationResult = new ContentValidationResult
        {
            ModerationPassed = !moderationResult.HasViolations,
            RulesCompliant = !rulesValidation.HasMajorViolations,
            QualityScore = qualityScore,
            ValidatedAt = DateTime.UtcNow,
            Warnings = rulesValidation.MinorViolations.Concat(moderationResult.Warnings).ToList()
        };

        return Result.Success(filteredContent);
    }

    private async Task<GeneratedContent> ApplyContentFiltersAsync(
        GeneratedContent content, 
        ContentGenerationRequest request)
    {
        var filteredContent = content.DeepCopy();

        // Apply excluded topics filter
        if (request.ExcludedTopics.Any())
        {
            filteredContent.RawContent = await RemoveExcludedTopicsAsync(
                filteredContent.RawContent, 
                request.ExcludedTopics);
        }

        // Apply campaign-appropriate language filter
        filteredContent.RawContent = await ApplyLanguageFilterAsync(
            filteredContent.RawContent, 
            request.CampaignId);

        // Apply content enhancement based on quality level
        if (request.QualityLevel >= ContentQuality.Enhanced)
        {
            filteredContent = await EnhanceContentQualityAsync(filteredContent);
        }

        return filteredContent;
    }

    private double GetMinimumQualityThreshold(ContentQuality qualityLevel)
    {
        return qualityLevel switch
        {
            ContentQuality.Draft => 0.3,
            ContentQuality.Standard => 0.6,
            ContentQuality.Enhanced => 0.8,
            ContentQuality.Premium => 0.9,
            _ => 0.6
        };
    }
}

public class GeneratedContent
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public ContentType ContentType { get; set; }
    public string RawContent { get; set; }
    public Dictionary<string, object> StructuredData { get; set; } = new();
    public List<ContentTag> Tags { get; set; } = new();
    public ContentMetadata Metadata { get; set; }
    public ContentValidationResult? ValidationResult { get; set; }
    public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
    public string ProviderId { get; set; }
    public int TokensUsed { get; set; }
    public TimeSpan GenerationTime { get; set; }

    public T GetStructuredData<T>() where T : class
    {
        if (StructuredData.ContainsKey(typeof(T).Name))
        {
            return StructuredData[typeof(T).Name] as T;
        }
        return null;
    }

    public void SetStructuredData<T>(T data) where T : class
    {
        StructuredData[typeof(T).Name] = data;
    }
}

public class ContentValidationResult
{
    public bool ModerationPassed { get; set; }
    public bool RulesCompliant { get; set; }
    public double QualityScore { get; set; }
    public DateTime ValidatedAt { get; set; }
    public List<string> Warnings { get; set; } = new();
    public List<string> Enhancements { get; set; } = new();
}
```

This AI Integration business logic specification provides:

1. **AI Content Generation Engine** - Orchestrates content creation with validation and context awareness
2. **NPC AI Behavior System** - Sophisticated NPC personality, emotion, and dialogue systems
3. **AI Context Management** - Builds rich context from campaign data and vector knowledge base
4. **AI Provider Orchestration** - Multi-provider support with failover and load balancing
5. **Content Validation and Filtering** - Comprehensive content moderation and D&D rules compliance
6. **Intelligent Memory Systems** - NPC memory consolidation and relationship tracking
7. **Quality Assessment** - Automated content quality scoring and enhancement
8. **Vector Knowledge Base** - Semantic search and knowledge storage for context building

The specification ensures AI-generated content is high-quality, appropriate, and seamlessly integrated with the D&D campaign experience.

<function_calls>
<invoke name="todo_write">
<parameter name="merge">true
