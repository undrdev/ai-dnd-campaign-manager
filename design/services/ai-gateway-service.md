# AI Gateway Service Implementation Specification

## Overview
The AI Gateway Service is the comprehensive orchestration platform for all AI functionality across the D&D Campaign Management System. It integrates provider abstraction, advanced context management, subscription-aware routing, multi-dimensional quality assurance, comprehensive testing, real-time monitoring, and specialized AI services to deliver intelligent, scalable, and subscription-tiered AI experiences.

## Integration with AI Specifications
This service now integrates with all detailed AI specifications:
- **AI Provider Abstraction**: Multi-provider routing with intelligent selection
- **AI Context Management**: Vector-based context retrieval and campaign knowledge fusion
- **AI Quality Assurance**: Multi-dimensional validation and quality scoring
- **AI Subscription Integration**: Tier-based feature access and model selection
- **AI Testing Strategy**: Comprehensive validation and continuous testing
- **AI Monitoring**: Real-time performance monitoring and observability
- **AI Content Filtering**: Multi-layer safety and D&D-specific validation
- **Specialized AI Services**: NPC generation, character creation, world building

## Service Architecture

### Technology Stack
- **Framework**: ASP.NET Core 8.0
- **Database**: PostgreSQL with Entity Framework Core
- **Vector Database**: pgvector/Pinecone for semantic search and context storage
- **Caching**: Redis with TLS and distributed locking
- **AI Providers**: OpenAI, Anthropic, Google, Azure OpenAI, Stability AI, ElevenLabs, local models
- **Message Queue**: Redis for async AI processing and priority queuing
- **Monitoring**: Prometheus, Grafana, Jaeger for comprehensive observability
- **Testing**: xUnit, Moq, specialized AI validation frameworks
- **Quality Assurance**: Multi-dimensional validation with automated scoring
- **Subscription Integration**: Tier-based feature gating and model selection

### Project Structure
```
AIGatewayService/
├── src/
│   ├── AIGatewayService.Api/           # Web API layer
│   │   ├── Controllers/
│   │   ├── Middleware/
│   │   ├── Program.cs
│   │   └── appsettings.json
│   ├── AIGatewayService.Application/   # Application layer
│   │   ├── Commands/
│   │   ├── Queries/
│   │   ├── Handlers/
│   │   ├── Services/
│   │   │   ├── NPCGeneration/         # NPC generation services
│   │   │   ├── CharacterGeneration/   # Character creation services
│   │   │   ├── WorldBuilding/         # World building services
│   │   │   ├── QualityAssurance/      # Quality validation services
│   │   │   ├── SubscriptionIntegration/ # Subscription services
│   │   │   └── Monitoring/            # Monitoring services
│   │   ├── Validators/
│   │   └── DTOs/
│   ├── AIGatewayService.Domain/        # Domain layer
│   │   ├── Entities/
│   │   ├── ValueObjects/
│   │   ├── Events/
│   │   ├── Repositories/
│   │   └── Services/
│   └── AIGatewayService.Infrastructure/ # Infrastructure layer
│       ├── Data/
│       ├── Repositories/
│       ├── Services/
│       ├── AI/                         # AI provider implementations
│       │   ├── Providers/
│       │   │   ├── OpenAI/
│       │   │   ├── Anthropic/
│       │   │   ├── Google/
│       │   │   ├── Azure/
│       │   │   ├── StabilityAI/        # Image generation
│       │   │   ├── ElevenLabs/         # Voice synthesis
│       │   │   └── LocalModels/        # Local model support
│       │   ├── QualityAssurance/       # Quality validation
│       │   ├── ContentFiltering/       # Safety filters
│       │   ├── ContextManagement/      # Vector context
│       │   └── SubscriptionGating/     # Tier enforcement
│       └── Configuration/
└── tests/
    ├── AIGatewayService.UnitTests/
    ├── AIGatewayService.IntegrationTests/
    └── AIGatewayService.AIValidationTests/
```

## Domain Layer Implementation

### Core AI Request Entity
Based on the database specification in `design/database/ai-integration.md`:

```csharp
// Domain/Entities/AIRequest.cs
using AIGatewayService.Domain.Events;
using AIGatewayService.Domain.ValueObjects;

namespace AIGatewayService.Domain.Entities
{
    public class AIRequest : AggregateRoot
    {
        public Guid Id { get; private set; }
        public Guid UserId { get; private set; }
        public Guid? CampaignId { get; private set; }
        public Guid? SessionId { get; private set; }
        
        // Request Information
        public AIRequestType RequestType { get; private set; }
        public string RequestCategory { get; private set; }
        public AIProvider Provider { get; private set; }
        public string Model { get; private set; }
        public AIRequestPriority Priority { get; private set; }
        
        // Content and Context
        public string UserPrompt { get; private set; }
        public string SystemPrompt { get; private set; }
        public AIContext Context { get; private set; }
        public List<AIMessage> Messages { get; private set; } = new();
        
        // Response and Processing
        public string? Response { get; private set; }
        public AIProcessingStatus Status { get; private set; }
        public AIQualityMetrics? QualityMetrics { get; private set; }
        public List<AIContentFilter> ContentFilters { get; private set; } = new();
        
        // Usage and Billing
        public AIUsageMetrics UsageMetrics { get; private set; }
        public decimal Cost { get; private set; }
        public string? BillingReference { get; private set; }
        
        // Performance and Reliability
        public DateTime RequestedAt { get; private set; }
        public DateTime? StartedAt { get; private set; }
        public DateTime? CompletedAt { get; private set; }
        public TimeSpan? ProcessingDuration { get; private set; }
        public int RetryCount { get; private set; }
        public string? ErrorMessage { get; private set; }
        public string? ErrorCode { get; private set; }
        
        // Audit and Compliance
        public bool IsLogged { get; private set; }
        public bool IsCached { get; private set; }
        public string? CacheKey { get; private set; }
        public DateTime? CacheExpiry { get; private set; }
        public AIComplianceInfo ComplianceInfo { get; private set; }

        // Private constructor for EF Core
        private AIRequest() { }

        // Factory method for creating AI requests
        public static AIRequest Create(
            Guid userId,
            AIRequestType requestType,
            string userPrompt,
            AIContext context,
            Guid? campaignId = null,
            Guid? sessionId = null,
            AIRequestPriority priority = AIRequestPriority.Normal)
        {
            if (string.IsNullOrWhiteSpace(userPrompt))
                throw new ArgumentException("User prompt cannot be empty", nameof(userPrompt));

            var request = new AIRequest
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                CampaignId = campaignId,
                SessionId = sessionId,
                RequestType = requestType,
                RequestCategory = GetCategoryFromType(requestType),
                Priority = priority,
                UserPrompt = userPrompt,
                Context = context ?? throw new ArgumentNullException(nameof(context)),
                Status = AIProcessingStatus.Queued,
                UsageMetrics = AIUsageMetrics.Empty(),
                Cost = 0m,
                RequestedAt = DateTime.UtcNow,
                RetryCount = 0,
                IsLogged = ShouldLogRequest(requestType),
                ComplianceInfo = AIComplianceInfo.Create(userId, requestType)
            };

            request.AddDomainEvent(new AIRequestCreatedEvent(request.Id, userId, requestType, campaignId));

            return request;
        }

        public void AssignProvider(AIProvider provider, string model, IAIProviderSelector selector)
        {
            // Validate provider can handle this request type
            if (!selector.CanHandleRequest(provider, RequestType))
                throw new InvalidOperationException($"Provider {provider} cannot handle request type {RequestType}");

            Provider = provider;
            Model = model;
            SystemPrompt = selector.GenerateSystemPrompt(RequestType, Context);

            AddDomainEvent(new AIProviderAssignedEvent(Id, provider, model));
        }

        public void StartProcessing()
        {
            if (Status != AIProcessingStatus.Queued)
                throw new InvalidOperationException($"Cannot start processing request in status {Status}");

            Status = AIProcessingStatus.Processing;
            StartedAt = DateTime.UtcNow;

            AddDomainEvent(new AIProcessingStartedEvent(Id, Provider, Model));
        }

        public void CompleteSuccessfully(
            string response,
            AIUsageMetrics usageMetrics,
            decimal cost,
            AIQualityMetrics qualityMetrics,
            List<AIContentFilter>? contentFilters = null)
        {
            if (Status != AIProcessingStatus.Processing)
                throw new InvalidOperationException($"Cannot complete request in status {Status}");

            Response = response ?? throw new ArgumentNullException(nameof(response));
            Status = AIProcessingStatus.Completed;
            CompletedAt = DateTime.UtcNow;
            ProcessingDuration = CompletedAt.Value - (StartedAt ?? RequestedAt);
            UsageMetrics = usageMetrics ?? throw new ArgumentNullException(nameof(usageMetrics));
            Cost = cost;
            QualityMetrics = qualityMetrics;
            ContentFilters = contentFilters ?? new List<AIContentFilter>();

            AddDomainEvent(new AIRequestCompletedEvent(
                Id, UserId, RequestType, response, usageMetrics, cost, ProcessingDuration.Value));
        }

        public void Fail(string errorMessage, string? errorCode = null)
        {
            Status = AIProcessingStatus.Failed;
            CompletedAt = DateTime.UtcNow;
            ProcessingDuration = CompletedAt.Value - (StartedAt ?? RequestedAt);
            ErrorMessage = errorMessage;
            ErrorCode = errorCode;

            AddDomainEvent(new AIRequestFailedEvent(Id, UserId, RequestType, errorMessage, errorCode));
        }

        public void Retry(string reason)
        {
            if (RetryCount >= 3)
                throw new InvalidOperationException("Maximum retry count exceeded");

            RetryCount++;
            Status = AIProcessingStatus.Queued;
            StartedAt = null;
            CompletedAt = null;
            ProcessingDuration = null;
            ErrorMessage = null;
            ErrorCode = null;

            AddDomainEvent(new AIRequestRetryEvent(Id, RetryCount, reason));
        }

        public void Cancel(string reason)
        {
            if (Status == AIProcessingStatus.Completed || Status == AIProcessingStatus.Failed)
                throw new InvalidOperationException($"Cannot cancel request in status {Status}");

            Status = AIProcessingStatus.Cancelled;
            CompletedAt = DateTime.UtcNow;
            ErrorMessage = $"Cancelled: {reason}";

            AddDomainEvent(new AIRequestCancelledEvent(Id, reason));
        }

        public void SetCacheInfo(string cacheKey, DateTime expiry)
        {
            IsCached = true;
            CacheKey = cacheKey;
            CacheExpiry = expiry;
        }

        public void AddMessage(AIMessage message)
        {
            if (message == null)
                throw new ArgumentNullException(nameof(message));

            Messages.Add(message);
        }

        public bool CanRetry()
        {
            return Status == AIProcessingStatus.Failed && 
                   RetryCount < 3 && 
                   IsRetryableError();
        }

        public bool IsExpired(TimeSpan timeout)
        {
            return DateTime.UtcNow - RequestedAt > timeout;
        }

        public bool ShouldCache()
        {
            return RequestType switch
            {
                AIRequestType.NPCGeneration => true,
                AIRequestType.WorldBuilding => true,
                AIRequestType.QuestGeneration => true,
                AIRequestType.CharacterBackground => true,
                AIRequestType.NPCDialogue => false, // Too context-specific
                AIRequestType.CampaignSearch => false, // Real-time data
                _ => false
            };
        }

        private bool IsRetryableError()
        {
            return ErrorCode switch
            {
                "RATE_LIMITED" => true,
                "TIMEOUT" => true,
                "TEMPORARY_FAILURE" => true,
                "PROVIDER_UNAVAILABLE" => true,
                "INVALID_REQUEST" => false,
                "CONTENT_POLICY_VIOLATION" => false,
                _ => true
            };
        }

        private static string GetCategoryFromType(AIRequestType requestType)
        {
            return requestType switch
            {
                AIRequestType.NPCGeneration => "Generation",
                AIRequestType.NPCDialogue => "Interaction",
                AIRequestType.WorldBuilding => "Generation",
                AIRequestType.QuestGeneration => "Generation",
                AIRequestType.CharacterBackground => "Generation",
                AIRequestType.CampaignSearch => "Search",
                AIRequestType.ContentModeration => "Moderation",
                _ => "General"
            };
        }

        private static bool ShouldLogRequest(AIRequestType requestType)
        {
            // Log all requests except dialogue for privacy
            return requestType != AIRequestType.NPCDialogue;
        }
    }

    public enum AIRequestType
    {
        // Legacy types (maintained for backward compatibility)
        NPCGeneration = 0,
        NPCDialogue = 1,
        WorldBuilding = 2,
        QuestGeneration = 3,
        CharacterBackground = 4,
        CampaignSearch = 5,
        ContentModeration = 6,
        ImageGeneration = 7,
        VoiceSynthesis = 8,
        TextSummary = 9,
        LanguageTranslation = 10,
        
        // Enhanced NPC capabilities
        NPCPersonalityGeneration = 11,
        NPCRelationshipAnalysis = 12,
        NPCBehaviorPrediction = 13,
        NPCEmotionalResponse = 14,
        NPCGroupReactions = 15,
        
        // Character creation capabilities
        CharacterCreation = 16,
        CharacterPersonalityGeneration = 17,
        CharacterBackgroundEnhancement = 18,
        CharacterMotivationGeneration = 19,
        CharacterAppearanceGeneration = 20,
        
        // World building enhancements
        SettlementGeneration = 21,
        DungeonGeneration = 22,
        LoreGeneration = 23,
        HistoryGeneration = 24,
        CultureGeneration = 25,
        ReligionGeneration = 26,
        QuestChainGeneration = 27,
        LocationDetailGeneration = 28,
        
        // Content analysis and quality
        QualityAssessment = 29,
        ContentAnalysis = 30,
        NarrativeCoherence = 31,
        DnDComplianceCheck = 32,
        
        // Specialized features
        CampaignIntegration = 33,
        ContextEnrichment = 34,
        SemanticSearch = 35,
        PersonalityCompatibility = 36,
        SocialNetworkAnalysis = 37
    }

    public enum AIProvider
    {
        OpenAI = 0,
        Anthropic = 1,
        Google = 2,
        AzureOpenAI = 3,
        LocalModel = 4,
        StabilityAI = 5,        // Image generation
        ElevenLabs = 6,         // Voice synthesis
        Cohere = 7,             // Additional text provider
        HuggingFace = 8,        // Open source models
        Ollama = 9,             // Local model runner
        Fallback = 99
    }

    public enum AIProcessingStatus
    {
        Queued = 0,
        Processing = 1,
        Completed = 2,
        Failed = 3,
        Cancelled = 4,
        Cached = 5
    }

    public enum AIRequestPriority
    {
        Low = 0,
        Normal = 1,
        High = 2,
        Critical = 3
    }
}
```

### AI Context and Usage Value Objects
```csharp
// Domain/ValueObjects/AIContext.cs
namespace AIGatewayService.Domain.ValueObjects
{
    public class AIContext : ValueObject
    {
        public string CampaignName { get; private set; }
        public string? CampaignSetting { get; private set; }
        public string? ContentRating { get; private set; }
        public List<string> ActiveQuests { get; private set; }
        public List<string> RecentEvents { get; private set; }
        public List<string> ImportantNPCs { get; private set; }
        public Dictionary<string, object> CustomContext { get; private set; }
        public AIContextMetadata Metadata { get; private set; }

        private AIContext() 
        { 
            ActiveQuests = new List<string>();
            RecentEvents = new List<string>();
            ImportantNPCs = new List<string>();
            CustomContext = new Dictionary<string, object>();
        }

        public AIContext(
            string campaignName,
            string? campaignSetting = null,
            string? contentRating = null,
            List<string>? activeQuests = null,
            List<string>? recentEvents = null,
            List<string>? importantNPCs = null,
            Dictionary<string, object>? customContext = null,
            AIContextMetadata? metadata = null)
        {
            CampaignName = campaignName ?? throw new ArgumentNullException(nameof(campaignName));
            CampaignSetting = campaignSetting;
            ContentRating = contentRating ?? "PG-13";
            ActiveQuests = activeQuests ?? new List<string>();
            RecentEvents = recentEvents ?? new List<string>();
            ImportantNPCs = importantNPCs ?? new List<string>();
            CustomContext = customContext ?? new Dictionary<string, object>();
            Metadata = metadata ?? AIContextMetadata.Default();
        }

        public string ToPromptContext(int maxTokens = 1000)
        {
            var contextBuilder = new StringBuilder();
            
            contextBuilder.AppendLine($"Campaign: {CampaignName}");
            
            if (!string.IsNullOrEmpty(CampaignSetting))
                contextBuilder.AppendLine($"Setting: {CampaignSetting}");
            
            contextBuilder.AppendLine($"Content Rating: {ContentRating}");

            if (ActiveQuests.Any())
            {
                contextBuilder.AppendLine("Active Quests:");
                foreach (var quest in ActiveQuests.Take(3))
                    contextBuilder.AppendLine($"- {quest}");
            }

            if (RecentEvents.Any())
            {
                contextBuilder.AppendLine("Recent Events:");
                foreach (var eventItem in RecentEvents.Take(5))
                    contextBuilder.AppendLine($"- {eventItem}");
            }

            if (ImportantNPCs.Any())
            {
                contextBuilder.AppendLine("Important NPCs:");
                foreach (var npc in ImportantNPCs.Take(5))
                    contextBuilder.AppendLine($"- {npc}");
            }

            var context = contextBuilder.ToString();
            
            // Truncate if too long (rough token estimation: 1 token ≈ 4 characters)
            if (context.Length > maxTokens * 4)
            {
                context = context.Substring(0, maxTokens * 4) + "...";
            }

            return context;
        }

        public AIContext AddQuest(string quest)
        {
            var newQuests = new List<string>(ActiveQuests) { quest };
            return new AIContext(CampaignName, CampaignSetting, ContentRating, 
                newQuests, RecentEvents, ImportantNPCs, CustomContext, Metadata);
        }

        public AIContext AddEvent(string eventDescription)
        {
            var newEvents = new List<string> { eventDescription };
            newEvents.AddRange(RecentEvents.Take(9)); // Keep last 10 events
            
            return new AIContext(CampaignName, CampaignSetting, ContentRating,
                ActiveQuests, newEvents, ImportantNPCs, CustomContext, Metadata);
        }

        public AIContext AddNPC(string npcName)
        {
            var newNPCs = new List<string>(ImportantNPCs);
            if (!newNPCs.Contains(npcName))
                newNPCs.Add(npcName);
            
            return new AIContext(CampaignName, CampaignSetting, ContentRating,
                ActiveQuests, RecentEvents, newNPCs, CustomContext, Metadata);
        }

        protected override IEnumerable<object> GetEqualityComponents()
        {
            yield return CampaignName;
            yield return CampaignSetting ?? string.Empty;
            yield return ContentRating ?? string.Empty;
            foreach (var quest in ActiveQuests)
                yield return quest;
            foreach (var eventItem in RecentEvents)
                yield return eventItem;
            foreach (var npc in ImportantNPCs)
                yield return npc;
            yield return Metadata;
        }
    }

    public class AIUsageMetrics : ValueObject
    {
        public int PromptTokens { get; private set; }
        public int CompletionTokens { get; private set; }
        public int TotalTokens { get; private set; }
        public TimeSpan ProcessingTime { get; private set; }
        public int RequestCount { get; private set; }
        public string ModelUsed { get; private set; }

        private AIUsageMetrics() { }

        public AIUsageMetrics(
            int promptTokens,
            int completionTokens,
            TimeSpan processingTime,
            string modelUsed,
            int requestCount = 1)
        {
            if (promptTokens < 0)
                throw new ArgumentException("Prompt tokens cannot be negative", nameof(promptTokens));
            if (completionTokens < 0)
                throw new ArgumentException("Completion tokens cannot be negative", nameof(completionTokens));

            PromptTokens = promptTokens;
            CompletionTokens = completionTokens;
            TotalTokens = promptTokens + completionTokens;
            ProcessingTime = processingTime;
            ModelUsed = modelUsed ?? throw new ArgumentNullException(nameof(modelUsed));
            RequestCount = requestCount;
        }

        public static AIUsageMetrics Empty()
        {
            return new AIUsageMetrics(0, 0, TimeSpan.Zero, "unknown");
        }

        public decimal CalculateCost(AIProvider provider)
        {
            return provider switch
            {
                AIProvider.OpenAI => CalculateOpenAICost(),
                AIProvider.Anthropic => CalculateAnthropicCost(),
                AIProvider.Google => CalculateGoogleCost(),
                AIProvider.AzureOpenAI => CalculateAzureCost(),
                AIProvider.LocalModel => 0m,
                _ => 0m
            };
        }

        private decimal CalculateOpenAICost()
        {
            // GPT-4 pricing (example - should be configurable)
            const decimal promptCostPer1K = 0.03m;
            const decimal completionCostPer1K = 0.06m;

            return (PromptTokens / 1000m * promptCostPer1K) + 
                   (CompletionTokens / 1000m * completionCostPer1K);
        }

        private decimal CalculateAnthropicCost()
        {
            // Claude pricing (example)
            const decimal costPer1K = 0.008m;
            return TotalTokens / 1000m * costPer1K;
        }

        private decimal CalculateGoogleCost()
        {
            // Gemini pricing (example)
            const decimal costPer1K = 0.001m;
            return TotalTokens / 1000m * costPer1K;
        }

        private decimal CalculateAzureCost()
        {
            // Azure OpenAI pricing (same as OpenAI)
            return CalculateOpenAICost();
        }

        protected override IEnumerable<object> GetEqualityComponents()
        {
            yield return PromptTokens;
            yield return CompletionTokens;
            yield return ProcessingTime;
            yield return ModelUsed;
            yield return RequestCount;
        }
    }

    public class AIQualityMetrics : ValueObject
    {
        public float Relevance { get; private set; }        // 0.0 - 1.0
        public float Coherence { get; private set; }        // 0.0 - 1.0
        public float Creativity { get; private set; }       // 0.0 - 1.0
        public float Appropriateness { get; private set; }  // 0.0 - 1.0
        public float OverallScore { get; private set; }     // 0.0 - 1.0
        public List<string> QualityFlags { get; private set; }
        public string? QualityNotes { get; private set; }

        private AIQualityMetrics() 
        { 
            QualityFlags = new List<string>();
        }

        public AIQualityMetrics(
            float relevance,
            float coherence,
            float creativity,
            float appropriateness,
            List<string>? qualityFlags = null,
            string? qualityNotes = null)
        {
            if (relevance < 0 || relevance > 1)
                throw new ArgumentException("Relevance must be between 0 and 1", nameof(relevance));
            if (coherence < 0 || coherence > 1)
                throw new ArgumentException("Coherence must be between 0 and 1", nameof(coherence));
            if (creativity < 0 || creativity > 1)
                throw new ArgumentException("Creativity must be between 0 and 1", nameof(creativity));
            if (appropriateness < 0 || appropriateness > 1)
                throw new ArgumentException("Appropriateness must be between 0 and 1", nameof(appropriateness));

            Relevance = relevance;
            Coherence = coherence;
            Creativity = creativity;
            Appropriateness = appropriateness;
            OverallScore = (relevance + coherence + creativity + appropriateness) / 4f;
            QualityFlags = qualityFlags ?? new List<string>();
            QualityNotes = qualityNotes;
        }

        public bool IsHighQuality => OverallScore >= 0.8f;
        public bool IsAcceptableQuality => OverallScore >= 0.6f;
        public bool HasQualityIssues => QualityFlags.Any();

        protected override IEnumerable<object> GetEqualityComponents()
        {
            yield return Relevance;
            yield return Coherence;
            yield return Creativity;
            yield return Appropriateness;
            foreach (var flag in QualityFlags)
                yield return flag;
            yield return QualityNotes ?? string.Empty;
        }
    }

    public class AIContentFilter : ValueObject
    {
        public string FilterType { get; private set; }
        public string FilterResult { get; private set; }
        public float ConfidenceScore { get; private set; }
        public string? Details { get; private set; }
        public bool IsBlocked { get; private set; }

        private AIContentFilter() { }

        public AIContentFilter(
            string filterType,
            string filterResult,
            float confidenceScore,
            string? details = null,
            bool isBlocked = false)
        {
            FilterType = filterType ?? throw new ArgumentNullException(nameof(filterType));
            FilterResult = filterResult ?? throw new ArgumentNullException(nameof(filterResult));
            ConfidenceScore = confidenceScore;
            Details = details;
            IsBlocked = isBlocked;
        }

        protected override IEnumerable<object> GetEqualityComponents()
        {
            yield return FilterType;
            yield return FilterResult;
            yield return ConfidenceScore;
            yield return Details ?? string.Empty;
            yield return IsBlocked;
        }
    }
}
```

### Enhanced AI Service Interfaces

#### **Core AI Gateway Interface (Enhanced)**
```csharp
// Domain/Services/IAIGatewayService.cs
using AIGatewayService.Domain.ValueObjects;

namespace AIGatewayService.Domain.Services
{
    /// <summary>
    /// Enhanced AI Gateway Service that orchestrates all AI capabilities
    /// </summary>
    public interface IAIGatewayService
    {
        // Core AI operations
        Task<AIResponse> GenerateContentAsync(AIRequest request);
        Task<AIResponse> GenerateWithContextAsync(AIRequest request, CampaignContext context);
        Task<StreamingAIResponse> StreamContentAsync(AIRequest request);
        
        // Specialized AI operations
        Task<NPCDialogueResponse> GenerateNPCDialogueAsync(NPCDialogueRequest request);
        Task<WorldContentResponse> GenerateWorldContentAsync(WorldContentRequest request);
        Task<CharacterBackgroundResponse> GenerateCharacterBackgroundAsync(CharacterBackgroundRequest request);
        Task<QuestContentResponse> GenerateQuestContentAsync(QuestContentRequest request);
        
        // Provider management
        Task<List<AIProvider>> GetAvailableProvidersAsync();
        Task<AIProviderStatus> GetProviderStatusAsync(string providerId);
        Task<AIUsageStats> GetUsageStatsAsync(Guid userId, TimeSpan period);
        
        // Quality and validation
        Task<QualityAssessmentResult> AssessContentQualityAsync(string content, AIRequestType requestType);
        Task<ContentFilterResult> FilterContentAsync(string content, CampaignContext context);
        
        // Subscription integration
        Task<FeatureAccessResult> CheckFeatureAccessAsync(Guid userId, AIFeatureType featureType);
        Task<ModelSelectionResult> SelectOptimalModelAsync(Guid userId, AIRequest request);
    }
}
```

#### **Specialized AI Service Interfaces**
```csharp
// Domain/Services/ISpecializedAIServices.cs
namespace AIGatewayService.Domain.Services
{
    /// <summary>
    /// NPC Generation and Dialogue Service
    /// </summary>
    public interface INPCGenerationService
    {
        // NPC Creation
        Task<GeneratedNPC> GenerateNPCAsync(NPCGenerationRequest request);
        Task<List<GeneratedNPC>> GenerateBulkNPCsAsync(BulkNPCGenerationRequest request);
        Task<GeneratedNPC> EnhanceExistingNPCAsync(Guid npcId, NPCEnhancementRequest request);
        
        // Dialogue Generation
        Task<NPCDialogueResponse> GenerateDialogueAsync(NPCDialogueRequest request);
        Task<NPCDialogueResponse> GenerateEmotionalResponseAsync(EmotionalDialogueRequest request);
        Task<NPCDialogueResponse> GenerateKnowledgeResponseAsync(KnowledgeDialogueRequest request);
        
        // Personality Management
        Task<PersonalityProfile> GeneratePersonalityAsync(PersonalityGenerationRequest request);
        Task<PersonalityProfile> EvolvePersonalityAsync(Guid npcId, PersonalityEvolutionRequest request);
        Task<PersonalityCompatibility> AnalyzePersonalityCompatibilityAsync(Guid npcId1, Guid npcId2);
        
        // Relationship Dynamics
        Task<RelationshipUpdate> UpdateRelationshipAsync(Guid npcId, Guid targetId, InteractionContext context);
        Task<List<RelationshipSuggestion>> GenerateRelationshipSuggestionsAsync(Guid campaignId);
        Task<SocialNetworkAnalysis> AnalyzeSocialNetworkAsync(Guid campaignId);
        
        // Behavioral Patterns
        Task<BehaviorPrediction> PredictNPCBehaviorAsync(Guid npcId, ScenarioContext scenario);
        Task<List<NPCReaction>> GenerateGroupReactionsAsync(List<Guid> npcIds, EventContext eventContext);
        Task<NPCInitiative> GenerateNPCInitiativeAsync(Guid npcId, CampaignContext context);
    }

    /// <summary>
    /// Character Generation and Development Service
    /// </summary>
    public interface ICharacterGenerationService
    {
        // Character Creation
        Task<CharacterGenerationResult> GenerateCharacterAsync(CharacterGenerationRequest request);
        Task<CharacterBackgroundResult> GenerateBackgroundAsync(BackgroundGenerationRequest request);
        Task<CharacterPersonalityResult> GeneratePersonalityAsync(PersonalityGenerationRequest request);
        Task<CharacterAppearanceResult> GenerateAppearanceAsync(AppearanceGenerationRequest request);
        
        // Character Development
        Task<CharacterEvolutionResult> EvolveCharacterAsync(CharacterEvolutionRequest request);
        Task<CharacterMotivationResult> GenerateMotivationsAsync(MotivationGenerationRequest request);
        Task<CharacterRelationshipResult> GenerateRelationshipsAsync(RelationshipGenerationRequest request);
        
        // Campaign Integration
        Task<CampaignIntegrationResult> IntegrateWithCampaignAsync(CampaignIntegrationRequest request);
        Task<List<QuestHook>> GeneratePersonalQuestHooksAsync(PersonalQuestHookRequest request);
        Task<List<NPCConnection>> GenerateNPCConnectionsAsync(NPCConnectionRequest request);
        
        // Character Optimization
        Task<CharacterOptimizationResult> OptimizeCharacterBuildAsync(OptimizationRequest request);
        Task<CharacterValidationResult> ValidateCharacterAsync(CharacterValidationRequest request);
        Task<List<CharacterSuggestion>> GetCharacterSuggestionsAsync(SuggestionRequest request);
    }

    /// <summary>
    /// World Building and Quest Generation Service
    /// </summary>
    public interface IWorldBuildingService
    {
        // World Creation
        Task<WorldGenerationResult> GenerateWorldAsync(WorldGenerationRequest request);
        Task<RegionGenerationResult> GenerateRegionAsync(RegionGenerationRequest request);
        Task<SettlementGenerationResult> GenerateSettlementAsync(SettlementGenerationRequest request);
        Task<DungeonGenerationResult> GenerateDungeonAsync(DungeonGenerationRequest request);
        
        // Location Details
        Task<LocationDetailResult> GenerateLocationDetailsAsync(LocationDetailRequest request);
        Task<EstablishmentResult> GenerateEstablishmentAsync(EstablishmentRequest request);
        Task<WildernessAreaResult> GenerateWildernessAreaAsync(WildernessAreaRequest request);
        
        // Quest Generation
        Task<QuestGenerationResult> GenerateQuestAsync(QuestGenerationRequest request);
        Task<QuestChainResult> GenerateQuestChainAsync(QuestChainRequest request);
        Task<List<QuestHook>> GenerateQuestHooksAsync(QuestHookRequest request);
        Task<SideQuestResult> GenerateSideQuestAsync(SideQuestRequest request);
        
        // Lore and History
        Task<LoreGenerationResult> GenerateLoreAsync(LoreGenerationRequest request);
        Task<HistoryGenerationResult> GenerateHistoryAsync(HistoryGenerationRequest request);
        Task<CultureGenerationResult> GenerateCultureAsync(CultureGenerationRequest request);
        Task<ReligionGenerationResult> GenerateReligionAsync(ReligionGenerationRequest request);
        
        // Dynamic Systems
        Task<EventGenerationResult> GenerateRandomEventAsync(EventGenerationRequest request);
        Task<RumorGenerationResult> GenerateRumorsAsync(RumorGenerationRequest request);
        Task<ConsequenceResult> GenerateConsequencesAsync(ConsequenceRequest request);
        Task<WorldEvolutionResult> EvolveWorldAsync(WorldEvolutionRequest request);
    }
}
```

#### **Quality Assurance and Monitoring Services**
```csharp
// Domain/Services/IQualityAndMonitoringServices.cs
namespace AIGatewayService.Domain.Services
{
    /// <summary>
    /// AI Quality Assurance Service
    /// </summary>
    public interface IQualityAssuranceService
    {
        // Primary quality assessment
        Task<QualityAssessmentResult> AssessQualityAsync(QualityAssessmentRequest request);
        Task<List<QualityAssessmentResult>> AssessBatchQualityAsync(List<QualityAssessmentRequest> requests);
        
        // Specialized quality validators
        Task<TechnicalQualityResult> ValidateTechnicalQualityAsync(TechnicalQualityRequest request);
        Task<ContentQualityResult> ValidateContentQualityAsync(ContentQualityRequest request);
        Task<DnDComplianceResult> ValidateDnDComplianceAsync(DnDComplianceRequest request);
        Task<NarrativeQualityResult> ValidateNarrativeQualityAsync(NarrativeQualityRequest request);
        Task<UserExperienceResult> ValidateUserExperienceAsync(UserExperienceRequest request);
        
        // Quality scoring and metrics
        Task<QualityScore> CalculateQualityScoreAsync(AIResponse response, QualityContext context);
        Task<QualityMetrics> GetQualityMetricsAsync(Guid campaignId, TimeSpan period);
        Task<QualityTrends> GetQualityTrendsAsync(TimeSpan period);
        
        // Quality improvement
        Task<QualityImprovementSuggestions> GetImprovementSuggestionsAsync(QualityAssessmentResult assessment);
        Task<RegenerationRecommendation> GetRegenerationRecommendationAsync(QualityAssessmentResult assessment);
        Task UpdateQualityFeedbackAsync(Guid responseId, UserQualityFeedback feedback);
    }

    /// <summary>
    /// AI Monitoring and Observability Service
    /// </summary>
    public interface IAIMonitoringService
    {
        // Metrics collection and tracking
        Task RecordMetricAsync(AIMetric metric);
        Task RecordBatchMetricsAsync(List<AIMetric> metrics);
        Task<List<AIMetric>> GetMetricsAsync(MetricsQuery query);
        Task<MetricsSummary> GetMetricsSummaryAsync(MetricsSummaryRequest request);
        
        // Performance monitoring
        Task<PerformanceMetrics> GetPerformanceMetricsAsync(TimeSpan period);
        Task<List<PerformanceAlert>> GetPerformanceAlertsAsync(AlertFilter filter);
        Task<ProviderPerformanceComparison> CompareProviderPerformanceAsync(TimeSpan period);
        
        // Quality monitoring
        Task<QualityMetrics> GetQualityMetricsAsync(TimeSpan period);
        Task<QualityTrendAnalysis> GetQualityTrendsAsync(TimeSpan period);
        Task<List<QualityAlert>> GetQualityAlertsAsync(AlertFilter filter);
        
        // Cost monitoring
        Task<CostMetrics> GetCostMetricsAsync(TimeSpan period);
        Task<CostProjection> GetCostProjectionAsync(int daysAhead);
        Task<List<CostAlert>> GetCostAlertsAsync(AlertFilter filter);
        Task<CostOptimizationSuggestions> GetCostOptimizationSuggestionsAsync();
        
        // Health monitoring
        Task<SystemHealthStatus> GetSystemHealthAsync();
        Task<List<HealthCheck>> RunHealthChecksAsync();
        Task<ServiceAvailability> GetServiceAvailabilityAsync(TimeSpan period);
        
        // Alerting and notifications
        Task CreateAlertRuleAsync(AlertRule rule);
        Task<List<Alert>> GetActiveAlertsAsync();
        Task AcknowledgeAlertAsync(Guid alertId, string acknowledgedBy);
    }

    /// <summary>
    /// Subscription Integration Service
    /// </summary>
    public interface ISubscriptionAIService
    {
        // Feature access control
        Task<FeatureAccessResult> CheckFeatureAccessAsync(Guid userId, AIFeatureType featureType);
        Task<List<AIFeatureType>> GetAvailableFeaturesAsync(Guid userId);
        Task<FeatureLimitations> GetFeatureLimitationsAsync(Guid userId, AIFeatureType featureType);
        
        // Usage validation and enforcement
        Task<UsageValidationResult> ValidateUsageAsync(Guid userId, AIUsageRequest request);
        Task<UsageLimits> GetCurrentUsageLimitsAsync(Guid userId);
        Task<UsageStatus> GetUsageStatusAsync(Guid userId);
        
        // Quality tier management
        Task<QualityTier> GetQualityTierAsync(Guid userId);
        Task<ModelSelectionResult> SelectOptimalModelAsync(Guid userId, AIRequest request);
        Task<QualityEnhancementResult> ApplyQualityEnhancementsAsync(AIResponse response, Guid userId);
        
        // Priority and queuing
        Task<PriorityLevel> GetRequestPriorityAsync(Guid userId);
        Task<QueuePosition> GetQueuePositionAsync(Guid userId, string requestId);
        Task<ProcessingTimeEstimate> EstimateProcessingTimeAsync(Guid userId, AIRequest request);
        
        // Subscription management integration
        Task HandleSubscriptionChangeAsync(Guid userId, SubscriptionTier oldTier, SubscriptionTier newTier);
        Task<UpgradeRecommendation> GetUpgradeRecommendationAsync(Guid userId);
        Task<List<SubscriptionBenefit>> GetSubscriptionBenefitsAsync(SubscriptionTier tier);
    }
}
```

### AI Provider Domain Service
```csharp
// Domain/Services/IAIProviderSelector.cs
using AIGatewayService.Domain.ValueObjects;

namespace AIGatewayService.Domain.Services
{
    public interface IAIProviderSelector
    {
        AIProvider SelectBestProvider(AIRequestType requestType, AIContext context, AIRequestPriority priority);
        bool CanHandleRequest(AIProvider provider, AIRequestType requestType);
        string GetBestModel(AIProvider provider, AIRequestType requestType);
        string GenerateSystemPrompt(AIRequestType requestType, AIContext context);
        AIProvider GetFallbackProvider(AIProvider failedProvider, AIRequestType requestType);
    }

    public interface IAIProviderService
    {
        Task<AIProviderResponse> ProcessRequestAsync(AIRequest request, CancellationToken cancellationToken);
        Task<bool> IsProviderHealthyAsync(AIProvider provider);
        Task<AIProviderCapabilities> GetProviderCapabilitiesAsync(AIProvider provider);
        Task<AIProviderUsage> GetProviderUsageAsync(AIProvider provider, DateTime from, DateTime to);
    }

    public class AIProviderResponse
    {
        public bool IsSuccess { get; set; }
        public string? Response { get; set; }
        public AIUsageMetrics? UsageMetrics { get; set; }
        public decimal Cost { get; set; }
        public AIQualityMetrics? QualityMetrics { get; set; }
        public List<AIContentFilter> ContentFilters { get; set; } = new();
        public string? ErrorMessage { get; set; }
        public string? ErrorCode { get; set; }
        public TimeSpan ProcessingTime { get; set; }
    }

    public class AIProviderCapabilities
    {
        public AIProvider Provider { get; set; }
        public List<AIRequestType> SupportedRequestTypes { get; set; } = new();
        public List<string> AvailableModels { get; set; } = new();
        public int MaxTokens { get; set; }
        public bool SupportsStreaming { get; set; }
        public bool SupportsImages { get; set; }
        public bool SupportsVision { get; set; }
        public bool SupportsFunctionCalling { get; set; }
        public decimal CostPerToken { get; set; }
        public TimeSpan TypicalResponseTime { get; set; }
    }

    public interface IAIUsageTracker
    {
        Task<AIUsageSummary> GetUserUsageAsync(Guid userId, DateTime from, DateTime to);
        Task<bool> CanUserMakeRequestAsync(Guid userId, AIRequestType requestType);
        Task TrackUsageAsync(Guid userId, AIUsageMetrics usage, decimal cost);
        Task<AIUsageLimits> GetUserLimitsAsync(Guid userId);
    }

    public class AIUsageSummary
    {
        public Guid UserId { get; set; }
        public DateTime From { get; set; }
        public DateTime To { get; set; }
        public int TotalRequests { get; set; }
        public int TotalTokens { get; set; }
        public decimal TotalCost { get; set; }
        public Dictionary<AIRequestType, int> RequestsByType { get; set; } = new();
        public Dictionary<AIProvider, int> RequestsByProvider { get; set; } = new();
    }

    public class AIUsageLimits
    {
        public int MaxRequestsPerHour { get; set; }
        public int MaxRequestsPerDay { get; set; }
        public int MaxTokensPerDay { get; set; }
        public decimal MaxCostPerDay { get; set; }
        public Dictionary<AIRequestType, int> RequestLimitsByType { get; set; } = new();
        public bool HasAdvancedFeatures { get; set; }
    }
}
```

### Domain Events
```csharp
// Domain/Events/AIEvents.cs
using AIGatewayService.Domain.ValueObjects;

namespace AIGatewayService.Domain.Events
{
    public record AIRequestCreatedEvent(
        Guid RequestId, 
        Guid UserId, 
        AIRequestType RequestType, 
        Guid? CampaignId) : DomainEvent;

    public record AIProviderAssignedEvent(
        Guid RequestId, 
        AIProvider Provider, 
        string Model) : DomainEvent;

    public record AIProcessingStartedEvent(
        Guid RequestId, 
        AIProvider Provider, 
        string Model) : DomainEvent;

    public record AIRequestCompletedEvent(
        Guid RequestId, 
        Guid UserId, 
        AIRequestType RequestType, 
        string Response, 
        AIUsageMetrics UsageMetrics, 
        decimal Cost, 
        TimeSpan ProcessingTime) : DomainEvent;

    public record AIRequestFailedEvent(
        Guid RequestId, 
        Guid UserId, 
        AIRequestType RequestType, 
        string ErrorMessage, 
        string? ErrorCode) : DomainEvent;

    public record AIRequestRetryEvent(
        Guid RequestId, 
        int RetryCount, 
        string Reason) : DomainEvent;

    public record AIRequestCancelledEvent(
        Guid RequestId, 
        string Reason) : DomainEvent;

    public record AIUsageLimitExceededEvent(
        Guid UserId, 
        AIRequestType RequestType, 
        string LimitType, 
        int CurrentUsage, 
        int Limit) : DomainEvent;

    public record AIProviderHealthChangedEvent(
        AIProvider Provider, 
        bool IsHealthy, 
        string? Details) : DomainEvent;

    public record AIContentFilterTriggeredEvent(
        Guid RequestId, 
        Guid UserId, 
        string FilterType, 
        string FilterResult, 
        bool IsBlocked) : DomainEvent;
}
```

## Application Layer Implementation

### Generate AI Content Command
```csharp
// Application/Commands/GenerateAIContentCommand.cs
using FluentValidation;
using MediatR;
using AIGatewayService.Domain.Services;

namespace AIGatewayService.Application.Commands
{
    public class GenerateAIContentCommand : IRequest<GenerateAIContentResponse>
    {
        public Guid UserId { get; set; }
        public Guid? CampaignId { get; set; }
        public Guid? SessionId { get; set; }
        public AIRequestType RequestType { get; set; }
        public string UserPrompt { get; set; } = string.Empty;
        public AIContextDto? Context { get; set; }
        public AIRequestPriority Priority { get; set; } = AIRequestPriority.Normal;
        public Dictionary<string, object> Parameters { get; set; } = new();
    }

    public class GenerateAIContentCommandValidator : AbstractValidator<GenerateAIContentCommand>
    {
        public GenerateAIContentCommandValidator()
        {
            RuleFor(x => x.UserId)
                .NotEmpty()
                .WithMessage("User ID is required");

            RuleFor(x => x.UserPrompt)
                .NotEmpty()
                .MinimumLength(10)
                .MaximumLength(4000)
                .WithMessage("User prompt must be between 10 and 4000 characters");

            RuleFor(x => x.RequestType)
                .IsInEnum()
                .WithMessage("Valid request type is required");

            RuleFor(x => x.Context)
                .SetValidator(new AIContextDtoValidator())
                .When(x => x.Context != null);
        }
    }

    public class GenerateAIContentCommandHandler : IRequestHandler<GenerateAIContentCommand, GenerateAIContentResponse>
    {
        private readonly IAIRequestRepository _requestRepository;
        private readonly IAIUsageTracker _usageTracker;
        private readonly IAIProviderSelector _providerSelector;
        private readonly IAIProviderService _providerService;
        private readonly ICacheService _cacheService;
        private readonly IQualityAssuranceService _qualityAssuranceService;
        private readonly ISubscriptionAIService _subscriptionService;
        private readonly IAIMonitoringService _monitoringService;
        private readonly INPCGenerationService _npcGenerationService;
        private readonly ICharacterGenerationService _characterGenerationService;
        private readonly IWorldBuildingService _worldBuildingService;
        private readonly ILogger<GenerateAIContentCommandHandler> _logger;

        public GenerateAIContentCommandHandler(
            IAIRequestRepository requestRepository,
            IAIUsageTracker usageTracker,
            IAIProviderSelector providerSelector,
            IAIProviderService providerService,
            ICacheService cacheService,
            IQualityAssuranceService qualityAssuranceService,
            ISubscriptionAIService subscriptionService,
            IAIMonitoringService monitoringService,
            INPCGenerationService npcGenerationService,
            ICharacterGenerationService characterGenerationService,
            IWorldBuildingService worldBuildingService,
            ILogger<GenerateAIContentCommandHandler> logger)
        {
            _requestRepository = requestRepository;
            _usageTracker = usageTracker;
            _providerSelector = providerSelector;
            _providerService = providerService;
            _cacheService = cacheService;
            _qualityAssuranceService = qualityAssuranceService;
            _subscriptionService = subscriptionService;
            _monitoringService = monitoringService;
            _npcGenerationService = npcGenerationService;
            _characterGenerationService = characterGenerationService;
            _worldBuildingService = worldBuildingService;
            _logger = logger;
        }

        public async Task<GenerateAIContentResponse> Handle(GenerateAIContentCommand request, CancellationToken cancellationToken)
        {
            _logger.LogInformation("Processing AI content generation request for user {UserId}, type {RequestType}", 
                request.UserId, request.RequestType);

            // Enhanced subscription and usage validation
            var featureAccessResult = await _subscriptionService.CheckFeatureAccessAsync(
                request.UserId, MapRequestTypeToFeature(request.RequestType));
            
            if (!featureAccessResult.IsAvailable)
            {
                throw new AIFeatureAccessDeniedException(
                    $"Feature {request.RequestType} not available for user's subscription tier: {featureAccessResult.RestrictionReason}");
            }

            var usageValidationResult = await _subscriptionService.ValidateUsageAsync(
                request.UserId, 
                new AIUsageRequest 
                { 
                    RequestType = request.RequestType, 
                    EstimatedTokens = EstimateTokenUsage(request.UserPrompt),
                    FeatureType = MapRequestTypeToFeature(request.RequestType)
                });
            
            if (!usageValidationResult.IsAllowed)
            {
                throw new AIUsageLimitExceededException(
                    $"Usage validation failed: {usageValidationResult.RestrictionReason}");
            }

            // Check cache first for cacheable requests
            var cacheKey = GenerateCacheKey(request);
            if (IsCacheableRequest(request.RequestType))
            {
                var cachedResponse = await _cacheService.GetAsync<GenerateAIContentResponse>(cacheKey);
                if (cachedResponse != null)
                {
                    _logger.LogInformation("Returning cached response for request type {RequestType}", request.RequestType);
                    return cachedResponse;
                }
            }

            // Create AI request entity
            var context = MapToAIContext(request.Context);
            var aiRequest = AIRequest.Create(
                request.UserId,
                request.RequestType,
                request.UserPrompt,
                context,
                request.CampaignId,
                request.SessionId,
                request.Priority);

            // Route to specialized AI services for enhanced capabilities
            if (IsSpecializedRequest(request.RequestType))
            {
                return await HandleSpecializedRequestAsync(request, context, cancellationToken);
            }

            // Enhanced provider selection with subscription awareness
            var modelSelectionResult = await _subscriptionService.SelectOptimalModelAsync(request.UserId, aiRequest);
            var provider = modelSelectionResult.SelectedModel.Contains("gpt") ? AIProvider.OpenAI :
                          modelSelectionResult.SelectedModel.Contains("claude") ? AIProvider.Anthropic :
                          AIProvider.OpenAI; // fallback
            
            aiRequest.AssignProvider(provider, modelSelectionResult.SelectedModel, _providerSelector);

            // Save request
            await _requestRepository.AddAsync(aiRequest, cancellationToken);
            await _requestRepository.UnitOfWork.SaveEntitiesAsync(cancellationToken);

            try
            {
                // Start processing
                aiRequest.StartProcessing();
                
                // Process with provider
                var providerResponse = await _providerService.ProcessRequestAsync(aiRequest, cancellationToken);

                if (providerResponse.IsSuccess)
                {
                    // Enhanced quality assurance validation
                    var qualityAssessment = await _qualityAssuranceService.AssessQualityAsync(
                        new QualityAssessmentRequest
                        {
                            Response = new AIResponse 
                            { 
                                Content = providerResponse.Response!, 
                                RequestId = aiRequest.Id.ToString() 
                            },
                            OriginalRequest = aiRequest,
                            Context = new QualityContext 
                            { 
                                UserId = request.UserId,
                                CampaignId = request.CampaignId ?? Guid.Empty,
                                UserTier = usageValidationResult.Priority switch
                                {
                                    PriorityLevel.Low => SubscriptionTier.Free,
                                    PriorityLevel.Normal => SubscriptionTier.DungeonArchitect,
                                    PriorityLevel.High => SubscriptionTier.CampaignWeaver,
                                    PriorityLevel.Critical => SubscriptionTier.GuildMaster,
                                    _ => SubscriptionTier.Free
                                }
                            }
                        });

                    // Apply quality decision
                    if (qualityAssessment.Decision == QualityDecision.Reject)
                    {
                        throw new AIQualityException("Generated content failed quality assessment");
                    }
                    else if (qualityAssessment.Decision == QualityDecision.Regenerate)
                    {
                        // Trigger regeneration with improved parameters
                        return await RegenerateWithQualityImprovementsAsync(request, qualityAssessment, cancellationToken);
                    }

                    // Apply subscription-tier quality enhancements
                    var enhancementResult = await _subscriptionService.ApplyQualityEnhancementsAsync(
                        new AIResponse { Content = providerResponse.Response! }, request.UserId);

                    // Complete successfully with enhanced content
                    aiRequest.CompleteSuccessfully(
                        enhancementResult.EnhancedResponse.Content,
                        providerResponse.UsageMetrics!,
                        providerResponse.Cost,
                        new AIQualityMetrics(
                            qualityAssessment.OverallScore,
                            qualityAssessment.OverallScore,
                            qualityAssessment.OverallScore,
                            qualityAssessment.OverallScore),
                        providerResponse.ContentFilters);

                    // Track usage and record monitoring metrics
                    await _usageTracker.TrackUsageAsync(
                        request.UserId, 
                        providerResponse.UsageMetrics!, 
                        providerResponse.Cost);

                    // Record comprehensive monitoring metrics
                    await _monitoringService.RecordMetricAsync(new AIMetric
                    {
                        Name = "ai_request_completed",
                        Type = MetricType.Counter,
                        Value = 1,
                        Timestamp = DateTime.UtcNow,
                        Labels = new Dictionary<string, string>
                        {
                            ["request_type"] = request.RequestType.ToString(),
                            ["provider"] = provider.ToString(),
                            ["user_tier"] = usageValidationResult.Priority.ToString(),
                            ["quality_score"] = qualityAssessment.OverallScore.ToString("F2")
                        }
                    });

                    await _monitoringService.RecordMetricAsync(new AIMetric
                    {
                        Name = "ai_response_time_seconds",
                        Type = MetricType.Histogram,
                        Value = aiRequest.ProcessingDuration!.Value.TotalSeconds,
                        Timestamp = DateTime.UtcNow,
                        Labels = new Dictionary<string, string>
                        {
                            ["request_type"] = request.RequestType.ToString(),
                            ["provider"] = provider.ToString()
                        }
                    });

                    await _monitoringService.RecordMetricAsync(new AIMetric
                    {
                        Name = "ai_cost_usd_total",
                        Type = MetricType.Counter,
                        Value = (double)providerResponse.Cost,
                        Timestamp = DateTime.UtcNow,
                        Labels = new Dictionary<string, string>
                        {
                            ["request_type"] = request.RequestType.ToString(),
                            ["provider"] = provider.ToString(),
                            ["user_tier"] = usageValidationResult.Priority.ToString()
                        }
                    });

                    // Cache if appropriate
                    if (aiRequest.ShouldCache())
                    {
                        var cacheExpiry = GetCacheExpiry(request.RequestType);
                        aiRequest.SetCacheInfo(cacheKey, cacheExpiry);
                        
                        var responseToCache = CreateResponse(aiRequest, providerResponse);
                        await _cacheService.SetAsync(cacheKey, responseToCache, cacheExpiry - DateTime.UtcNow);
                    }

                    // Save updated request
                    await _requestRepository.UnitOfWork.SaveEntitiesAsync(cancellationToken);

                    _logger.LogInformation("Successfully completed AI request {RequestId} for user {UserId}", 
                        aiRequest.Id, request.UserId);

                    return CreateResponse(aiRequest, providerResponse);
                }
                else
                {
                    // Handle failure with retry logic
                    if (aiRequest.CanRetry())
                    {
                        var fallbackProvider = _providerSelector.GetFallbackProvider(provider, request.RequestType);
                        if (fallbackProvider != provider)
                        {
                            aiRequest.Retry($"Retrying with fallback provider {fallbackProvider}");
                            var fallbackModel = _providerSelector.GetBestModel(fallbackProvider, request.RequestType);
                            aiRequest.AssignProvider(fallbackProvider, fallbackModel, _providerSelector);
                            
                            // Retry with fallback
                            aiRequest.StartProcessing();
                            var retryResponse = await _providerService.ProcessRequestAsync(aiRequest, cancellationToken);
                            
                            if (retryResponse.IsSuccess)
                            {
                                aiRequest.CompleteSuccessfully(
                                    retryResponse.Response!,
                                    retryResponse.UsageMetrics!,
                                    retryResponse.Cost,
                                    retryResponse.QualityMetrics!,
                                    retryResponse.ContentFilters);

                                await _usageTracker.TrackUsageAsync(
                                    request.UserId, 
                                    retryResponse.UsageMetrics!, 
                                    retryResponse.Cost);

                                await _requestRepository.UnitOfWork.SaveEntitiesAsync(cancellationToken);

                                return CreateResponse(aiRequest, retryResponse);
                            }
                        }
                    }

                    // Final failure
                    aiRequest.Fail(providerResponse.ErrorMessage!, providerResponse.ErrorCode);
                    await _requestRepository.UnitOfWork.SaveEntitiesAsync(cancellationToken);

                    throw new AIProcessingException($"AI request failed: {providerResponse.ErrorMessage}");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing AI request {RequestId}", aiRequest.Id);
                
                aiRequest.Fail(ex.Message, "PROCESSING_ERROR");
                await _requestRepository.UnitOfWork.SaveEntitiesAsync(cancellationToken);
                
                throw;
            }
        }

        // Enhanced helper methods for specialized AI services
        private bool IsSpecializedRequest(AIRequestType requestType)
        {
            return requestType switch
            {
                AIRequestType.NPCPersonalityGeneration or
                AIRequestType.NPCRelationshipAnalysis or
                AIRequestType.NPCBehaviorPrediction or
                AIRequestType.NPCEmotionalResponse or
                AIRequestType.NPCGroupReactions => true,
                
                AIRequestType.CharacterCreation or
                AIRequestType.CharacterPersonalityGeneration or
                AIRequestType.CharacterBackgroundEnhancement or
                AIRequestType.CharacterMotivationGeneration or
                AIRequestType.CharacterAppearanceGeneration => true,
                
                AIRequestType.SettlementGeneration or
                AIRequestType.DungeonGeneration or
                AIRequestType.LoreGeneration or
                AIRequestType.HistoryGeneration or
                AIRequestType.CultureGeneration or
                AIRequestType.ReligionGeneration or
                AIRequestType.QuestChainGeneration => true,
                
                _ => false
            };
        }

        private async Task<GenerateAIContentResponse> HandleSpecializedRequestAsync(
            GenerateAIContentCommand request, 
            AIContext context, 
            CancellationToken cancellationToken)
        {
            return request.RequestType switch
            {
                // NPC Generation Services
                AIRequestType.NPCPersonalityGeneration => await HandleNPCPersonalityGenerationAsync(request, cancellationToken),
                AIRequestType.NPCDialogue => await HandleNPCDialogueAsync(request, context, cancellationToken),
                AIRequestType.NPCRelationshipAnalysis => await HandleNPCRelationshipAnalysisAsync(request, cancellationToken),
                AIRequestType.NPCBehaviorPrediction => await HandleNPCBehaviorPredictionAsync(request, cancellationToken),
                
                // Character Generation Services  
                AIRequestType.CharacterCreation => await HandleCharacterCreationAsync(request, context, cancellationToken),
                AIRequestType.CharacterPersonalityGeneration => await HandleCharacterPersonalityAsync(request, cancellationToken),
                AIRequestType.CharacterBackgroundEnhancement => await HandleCharacterBackgroundAsync(request, context, cancellationToken),
                
                // World Building Services
                AIRequestType.SettlementGeneration => await HandleSettlementGenerationAsync(request, context, cancellationToken),
                AIRequestType.DungeonGeneration => await HandleDungeonGenerationAsync(request, context, cancellationToken),
                AIRequestType.QuestChainGeneration => await HandleQuestChainGenerationAsync(request, context, cancellationToken),
                AIRequestType.LoreGeneration => await HandleLoreGenerationAsync(request, context, cancellationToken),
                
                _ => throw new NotSupportedException($"Specialized handling for {request.RequestType} not implemented")
            };
        }

        private AIFeatureType MapRequestTypeToFeature(AIRequestType requestType)
        {
            return requestType switch
            {
                AIRequestType.NPCGeneration or AIRequestType.NPCDialogue => AIFeatureType.NPCDialogueGeneration,
                AIRequestType.NPCPersonalityGeneration => AIFeatureType.AdvancedNPCPersonalities,
                AIRequestType.CharacterCreation or AIRequestType.CharacterBackground => AIFeatureType.BasicCharacterCreation,
                AIRequestType.CharacterPersonalityGeneration => AIFeatureType.CharacterBackgroundGeneration,
                AIRequestType.WorldBuilding or AIRequestType.SettlementGeneration => AIFeatureType.WorldBuilding,
                AIRequestType.QuestGeneration or AIRequestType.QuestChainGeneration => AIFeatureType.QuestGeneration,
                AIRequestType.DungeonGeneration => AIFeatureType.ComplexWorldGeneration,
                AIRequestType.ImageGeneration => AIFeatureType.ImageGeneration,
                AIRequestType.VoiceSynthesis => AIFeatureType.VoiceSynthesis,
                _ => AIFeatureType.BasicTextGeneration
            };
        }

        private int EstimateTokenUsage(string prompt)
        {
            // Rough estimation: 1 token ≈ 4 characters
            return Math.Max(prompt.Length / 4, 10);
        }

        private string GenerateCacheKey(GenerateAIContentCommand request)
        {
            var keyData = $"{request.RequestType}:{request.UserPrompt}:{request.Context?.GetHashCode() ?? 0}";
            return $"ai_content:{keyData.GetHashCode():X}";
        }

        private bool IsCacheableRequest(AIRequestType requestType)
        {
            return requestType switch
            {
                AIRequestType.NPCGeneration => true,
                AIRequestType.WorldBuilding => true,
                AIRequestType.QuestGeneration => true,
                AIRequestType.CharacterBackground => true,
                _ => false
            };
        }

        private DateTime GetCacheExpiry(AIRequestType requestType)
        {
            var cacheHours = requestType switch
            {
                AIRequestType.NPCGeneration => 24,
                AIRequestType.WorldBuilding => 12,
                AIRequestType.QuestGeneration => 6,
                AIRequestType.CharacterBackground => 48,
                _ => 1
            };

            return DateTime.UtcNow.AddHours(cacheHours);
        }

        private AIContext MapToAIContext(AIContextDto? contextDto)
        {
            if (contextDto == null)
                return new AIContext("Default Campaign");

            return new AIContext(
                contextDto.CampaignName,
                contextDto.CampaignSetting,
                contextDto.ContentRating,
                contextDto.ActiveQuests,
                contextDto.RecentEvents,
                contextDto.ImportantNPCs,
                contextDto.CustomContext);
        }

        private GenerateAIContentResponse CreateResponse(AIRequest aiRequest, AIProviderResponse providerResponse)
        {
            return new GenerateAIContentResponse
            {
                RequestId = aiRequest.Id,
                Response = aiRequest.Response!,
                UsageMetrics = new AIUsageMetricsDto
                {
                    PromptTokens = aiRequest.UsageMetrics.PromptTokens,
                    CompletionTokens = aiRequest.UsageMetrics.CompletionTokens,
                    TotalTokens = aiRequest.UsageMetrics.TotalTokens,
                    ProcessingTime = aiRequest.ProcessingDuration!.Value,
                    Cost = aiRequest.Cost
                },
                QualityMetrics = aiRequest.QualityMetrics != null ? new AIQualityMetricsDto
                {
                    OverallScore = aiRequest.QualityMetrics.OverallScore,
                    Relevance = aiRequest.QualityMetrics.Relevance,
                    Coherence = aiRequest.QualityMetrics.Coherence,
                    Creativity = aiRequest.QualityMetrics.Creativity,
                    Appropriateness = aiRequest.QualityMetrics.Appropriateness,
                    QualityFlags = aiRequest.QualityMetrics.QualityFlags
                } : null,
                Provider = aiRequest.Provider.ToString(),
                Model = aiRequest.Model,
                IsCached = aiRequest.IsCached,
                ProcessedAt = aiRequest.CompletedAt!.Value
            };
        }
    }

    public class GenerateAIContentResponse
    {
        public Guid RequestId { get; set; }
        public string Response { get; set; } = string.Empty;
        public AIUsageMetricsDto UsageMetrics { get; set; } = new();
        public AIQualityMetricsDto? QualityMetrics { get; set; }
        public string Provider { get; set; } = string.Empty;
        public string Model { get; set; } = string.Empty;
        public bool IsCached { get; set; }
        public DateTime ProcessedAt { get; set; }
    }

    public class AIUsageLimitExceededException : Exception
    {
        public AIUsageLimitExceededException(string message) : base(message) { }
    }

    public class AIProcessingException : Exception
    {
        public AIProcessingException(string message) : base(message) { }
        public AIProcessingException(string message, Exception innerException) : base(message, innerException) { }
    }

    public class AIFeatureAccessDeniedException : Exception
    {
        public AIFeatureAccessDeniedException(string message) : base(message) { }
    }

    public class AIQualityException : Exception
    {
        public AIQualityException(string message) : base(message) { }
    }
}
```

## Enhanced AI Gateway Service Capabilities

This updated AI Gateway Service specification now provides comprehensive integration with all AI specifications:

### **🎯 Core Enhancements**
1. **Multi-Provider AI Abstraction** - Support for OpenAI, Anthropic, Google, Azure OpenAI, Stability AI, ElevenLabs, and local models
2. **Subscription-Aware Routing** - Intelligent provider and model selection based on subscription tiers
3. **Multi-Dimensional Quality Assurance** - Technical, content, D&D compliance, narrative, and UX validation
4. **Specialized AI Services Integration** - Direct integration with NPC, character, and world building services
5. **Advanced Context Management** - Vector-based context retrieval and campaign knowledge fusion
6. **Comprehensive Monitoring** - Real-time metrics collection and observability
7. **Enhanced Content Filtering** - Multi-layer safety with D&D-specific validation
8. **Intelligent Caching** - Redis-based caching with TLS and distributed locking

### **🚀 Advanced Features**
9. **Quality-Driven Regeneration** - Automatic content regeneration based on quality assessment
10. **Tier-Based Quality Enhancement** - Subscription-specific content improvements
11. **Priority Queue Management** - Request prioritization based on subscription levels
12. **Feature Access Control** - Granular feature gating per subscription tier
13. **Cost Optimization** - Intelligent provider routing for cost efficiency
14. **Performance Analytics** - Comprehensive usage and performance tracking
15. **Specialized Request Routing** - Direct routing to specialized AI services for enhanced capabilities
16. **Circuit Breaker Patterns** - Provider health monitoring and failover strategies

### **🔗 Integration Points**
- **AI Provider Abstraction**: `design/ai/ai-provider-abstraction.md`
- **AI Quality Assurance**: `design/ai/ai-quality-assurance.md`  
- **AI Subscription Integration**: `design/ai/ai-subscription-integration.md`
- **AI Monitoring**: `design/ai/ai-monitoring-observability.md`
- **AI Testing Strategy**: `design/ai/ai-testing-strategy.md`
- **AI Context Management**: `design/ai/ai-context-management.md`
- **AI Content Filtering**: `design/ai/ai-content-filtering.md`
- **Specialized AI Services**: `design/ai/ai-npc-generation.md`, `design/ai/ai-character-generation.md`, `design/ai/ai-world-building.md`

### **📊 Request Types Expansion**
The service now supports **37 different AI request types**, including:
- **Enhanced NPC capabilities** (5 types): Personality generation, relationship analysis, behavior prediction
- **Character creation capabilities** (5 types): Full character creation, personality, backgrounds, motivations
- **World building enhancements** (8 types): Settlements, dungeons, lore, history, cultures, religions
- **Quality and analysis** (4 types): Quality assessment, content analysis, D&D compliance
- **Specialized features** (5 types): Campaign integration, context enrichment, semantic search

### **🎮 D&D-Specific Intelligence**
- **Meta-gaming detection** and prevention
- **D&D 5e rule consistency** validation
- **Character personality coherence** checking
- **Campaign tone and theme** consistency
- **NPC relationship dynamics** and evolution
- **World-building coherence** validation

The enhanced AI Gateway Service now serves as a **comprehensive AI orchestration platform** that seamlessly integrates all advanced AI capabilities while maintaining backward compatibility and providing subscription-appropriate experiences for all user tiers.

This transformation elevates the service from a basic AI proxy to a sophisticated, enterprise-grade AI platform specifically designed for D&D campaign management with intelligent routing, quality assurance, and specialized AI capabilities.
