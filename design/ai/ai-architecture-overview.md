# AI Architecture Overview

## Overview
This document defines the comprehensive AI architecture for the D&D AI Campaign Management System, establishing the foundation for intelligent content generation, context-aware interactions, and subscription-tiered AI capabilities that power the core user experience.

---

## AI System Architecture

### **High-Level AI Architecture**
```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Applications                      │
│  Flutter Web │ Flutter Mobile │ Flutter Desktop │ External APIs │
└─────────────────────────────────────────────────────────────────┘
                                │
                        ┌───────────────┐
                        │  API Gateway  │
                        │ (Rate Limiting│
                        │  & Auth)      │
                        └───────────────┘
                                │
                    ┌───────────────────────┐
                    │    AI Gateway Service │
                    │   (Orchestration &    │
                    │   Provider Routing)   │
                    └───────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
┌───────────────┐    ┌─────────────────┐    ┌─────────────────┐
│Context Service│    │  Content Filter │    │ Usage Tracking  │
│(RAG & Memory) │    │   & Quality     │    │   & Analytics   │
└───────────────┘    └─────────────────┘    └─────────────────┘
        │                       │                       │
        │              ┌─────────────────┐              │
        │              │  Prompt Engine  │              │
        │              │  & Templates    │              │
        │              └─────────────────┘              │
        │                       │                       │
        └───────────────────────┼───────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
┌───────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   OpenAI API  │    │   Anthropic     │    │  Local Models   │
│  (GPT-4/4o)   │    │   (Claude)      │    │  (Ollama/vLLM)  │
└───────────────┘    └─────────────────┘    └─────────────────┘
        │                       │                       │
┌───────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Stability AI │    │   ElevenLabs    │    │   Pinecone      │
│   (Images)    │    │   (Voice)       │    │ (Vector Store)  │
└───────────────┘    └─────────────────┘    └─────────────────┘
```

### **Core AI Components**

#### **1. AI Gateway Service**
```csharp
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
}

public class AIGatewayService : IAIGatewayService
{
    private readonly IProviderRouter _providerRouter;
    private readonly IContextService _contextService;
    private readonly IContentFilter _contentFilter;
    private readonly IUsageTracker _usageTracker;
    private readonly IPromptEngine _promptEngine;
    private readonly ILogger<AIGatewayService> _logger;

    public async Task<AIResponse> GenerateContentAsync(AIRequest request)
    {
        // 1. Validate request and user permissions
        await ValidateRequestAsync(request);
        
        // 2. Check usage limits
        await _usageTracker.ValidateUsageLimitsAsync(request.UserId, request.Type);
        
        // 3. Route to appropriate provider
        var provider = await _providerRouter.SelectProviderAsync(request);
        
        // 4. Enhance with context if available
        var contextualRequest = await _contextService.EnhanceRequestAsync(request);
        
        // 5. Apply prompt engineering
        var engineeredRequest = await _promptEngine.ProcessRequestAsync(contextualRequest);
        
        // 6. Generate content
        var response = await provider.GenerateAsync(engineeredRequest);
        
        // 7. Apply content filtering and quality checks
        var filteredResponse = await _contentFilter.FilterResponseAsync(response);
        
        // 8. Track usage
        await _usageTracker.TrackUsageAsync(request.UserId, response.Usage);
        
        // 9. Store context for future use
        await _contextService.StoreInteractionAsync(request, filteredResponse);
        
        return filteredResponse;
    }
}
```

#### **2. AI Provider Interface**
```csharp
public interface IAIProvider
{
    string ProviderId { get; }
    string DisplayName { get; }
    AIProviderCapabilities Capabilities { get; }
    
    // Core generation methods
    Task<AIResponse> GenerateAsync(AIRequest request);
    Task<StreamingAIResponse> StreamAsync(AIRequest request);
    Task<AIResponse> GenerateWithFunctionsAsync(AIFunctionRequest request);
    
    // Specialized methods
    Task<ImageGenerationResponse> GenerateImageAsync(ImageGenerationRequest request);
    Task<VoiceSynthesisResponse> SynthesizeVoiceAsync(VoiceSynthesisRequest request);
    Task<EmbeddingResponse> GenerateEmbeddingsAsync(EmbeddingRequest request);
    
    // Provider management
    Task<bool> IsHealthyAsync();
    Task<AIProviderMetrics> GetMetricsAsync();
    Task<decimal> EstimateCostAsync(AIRequest request);
}

public class AIProviderCapabilities
{
    public bool SupportsTextGeneration { get; set; }
    public bool SupportsImageGeneration { get; set; }
    public bool SupportsVoiceSynthesis { get; set; }
    public bool SupportsStreaming { get; set; }
    public bool SupportsFunctionCalling { get; set; }
    public bool SupportsEmbeddings { get; set; }
    
    public int MaxContextTokens { get; set; }
    public int MaxOutputTokens { get; set; }
    public List<string> SupportedModels { get; set; }
    public List<string> SupportedLanguages { get; set; }
    
    public AIProviderPricing Pricing { get; set; }
    public AIProviderLimits Limits { get; set; }
}

// OpenAI Provider Implementation
public class OpenAIProvider : IAIProvider
{
    private readonly OpenAIClient _client;
    private readonly ILogger<OpenAIProvider> _logger;
    
    public string ProviderId => "openai";
    public string DisplayName => "OpenAI";
    
    public AIProviderCapabilities Capabilities => new()
    {
        SupportsTextGeneration = true,
        SupportsImageGeneration = true,
        SupportsStreaming = true,
        SupportsFunctionCalling = true,
        SupportsEmbeddings = true,
        MaxContextTokens = 128000, // GPT-4 Turbo
        MaxOutputTokens = 4096,
        SupportedModels = new() { "gpt-4o", "gpt-4-turbo", "gpt-3.5-turbo", "dall-e-3" },
        SupportedLanguages = new() { "en", "es", "fr", "de", "it", "pt", "ru", "ja", "ko", "zh" }
    };

    public async Task<AIResponse> GenerateAsync(AIRequest request)
    {
        try
        {
            var chatRequest = new ChatCompletionRequest
            {
                Model = SelectOptimalModel(request),
                Messages = ConvertToOpenAIMessages(request.Messages),
                Temperature = request.Parameters.Temperature ?? 0.7f,
                MaxTokens = request.Parameters.MaxTokens ?? 2000,
                TopP = request.Parameters.TopP ?? 1.0f,
                FrequencyPenalty = request.Parameters.FrequencyPenalty ?? 0.0f,
                PresencePenalty = request.Parameters.PresencePenalty ?? 0.0f,
                User = request.UserId.ToString()
            };

            if (request.Functions?.Any() == true)
            {
                chatRequest.Functions = ConvertToOpenAIFunctions(request.Functions);
                chatRequest.FunctionCall = request.FunctionCallStrategy;
            }

            var response = await _client.ChatCompletions.CreateAsync(chatRequest);
            
            return new AIResponse
            {
                Content = response.Choices[0].Message.Content,
                FinishReason = response.Choices[0].FinishReason,
                Usage = new AIUsage
                {
                    PromptTokens = response.Usage.PromptTokens,
                    CompletionTokens = response.Usage.CompletionTokens,
                    TotalTokens = response.Usage.TotalTokens,
                    EstimatedCost = CalculateCost(response.Usage, chatRequest.Model)
                },
                ProviderId = ProviderId,
                Model = chatRequest.Model,
                RequestId = response.Id,
                CreatedAt = DateTime.UtcNow
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "OpenAI API call failed for user {UserId}", request.UserId);
            throw new AIProviderException($"OpenAI generation failed: {ex.Message}", ex);
        }
    }

    private string SelectOptimalModel(AIRequest request)
    {
        // Model selection logic based on request complexity and user subscription
        return request.RequiresAdvancedReasoning ? "gpt-4o" : "gpt-3.5-turbo";
    }
}
```

#### **3. Context Management System**
```csharp
public interface IContextService
{
    // Context retrieval
    Task<CampaignContext> GetCampaignContextAsync(Guid campaignId, int maxTokens = 4000);
    Task<CharacterContext> GetCharacterContextAsync(Guid characterId);
    Task<NPCContext> GetNPCContextAsync(Guid npcId);
    Task<SessionContext> GetSessionContextAsync(Guid sessionId);
    
    // Context enhancement
    Task<AIRequest> EnhanceRequestAsync(AIRequest request);
    Task<string> BuildContextPromptAsync(CampaignContext context, string userPrompt);
    
    // Memory management
    Task StoreInteractionAsync(AIRequest request, AIResponse response);
    Task<List<InteractionMemory>> GetRelevantMemoriesAsync(string query, Guid campaignId, int limit = 10);
    Task UpdateEntityMemoryAsync(Guid entityId, string entityType, string memoryContent);
    
    // Vector operations
    Task<List<VectorSearchResult>> SemanticSearchAsync(string query, Guid campaignId, int limit = 10);
    Task StoreEmbeddingAsync(string content, Dictionary<string, object> metadata);
}

public class ContextService : IContextService
{
    private readonly IVectorDatabase _vectorDb;
    private readonly ICampaignRepository _campaignRepo;
    private readonly ICharacterRepository _characterRepo;
    private readonly INPCRepository _npcRepo;
    private readonly ISessionRepository _sessionRepo;
    private readonly IAIProvider _embeddingProvider;
    private readonly IMemoryCache _cache;

    public async Task<CampaignContext> GetCampaignContextAsync(Guid campaignId, int maxTokens = 4000)
    {
        var cacheKey = $"campaign_context_{campaignId}_{maxTokens}";
        if (_cache.TryGetValue(cacheKey, out CampaignContext cached))
        {
            return cached;
        }

        var campaign = await _campaignRepo.GetByIdAsync(campaignId);
        var activeQuests = await _campaignRepo.GetActiveQuestsAsync(campaignId);
        var recentSessions = await _sessionRepo.GetRecentSessionsAsync(campaignId, limit: 3);
        var keyNPCs = await _npcRepo.GetKeyNPCsAsync(campaignId);
        var playerCharacters = await _characterRepo.GetByCampaignIdAsync(campaignId);

        // Get relevant memories through vector search
        var campaignSummary = await BuildCampaignSummaryAsync(campaign);
        var relevantMemories = await GetRelevantMemoriesAsync(campaignSummary, campaignId, limit: 10);

        var context = new CampaignContext
        {
            CampaignId = campaignId,
            CampaignName = campaign.Name,
            CampaignDescription = campaign.Description,
            WorldState = campaign.WorldState,
            ActiveQuests = activeQuests.Select(q => new QuestSummary(q)).ToList(),
            RecentEvents = recentSessions.SelectMany(s => s.Events).OrderByDescending(e => e.Timestamp).Take(20).ToList(),
            KeyNPCs = keyNPCs.Select(npc => new NPCSummary(npc)).ToList(),
            PlayerCharacters = playerCharacters.Select(c => new CharacterSummary(c)).ToList(),
            RelevantMemories = relevantMemories,
            LastUpdated = DateTime.UtcNow
        };

        // Compress context to fit within token limits
        var compressedContext = await CompressContextAsync(context, maxTokens);
        
        _cache.Set(cacheKey, compressedContext, TimeSpan.FromMinutes(10));
        return compressedContext;
    }

    public async Task<AIRequest> EnhanceRequestAsync(AIRequest request)
    {
        if (request.CampaignId.HasValue)
        {
            var context = await GetCampaignContextAsync(request.CampaignId.Value);
            var contextPrompt = await BuildContextPromptAsync(context, request.Messages.Last().Content);
            
            // Replace or enhance the user's message with context
            var enhancedMessages = new List<AIMessage>(request.Messages);
            enhancedMessages[^1] = new AIMessage
            {
                Role = "user",
                Content = contextPrompt,
                Metadata = request.Messages.Last().Metadata
            };

            return request with { Messages = enhancedMessages };
        }

        return request;
    }

    public async Task<string> BuildContextPromptAsync(CampaignContext context, string userPrompt)
    {
        var contextBuilder = new StringBuilder();
        
        // Campaign overview
        contextBuilder.AppendLine($"Campaign: {context.CampaignName}");
        contextBuilder.AppendLine($"Description: {context.CampaignDescription}");
        contextBuilder.AppendLine();
        
        // Current world state
        if (context.WorldState != null)
        {
            contextBuilder.AppendLine("Current World State:");
            contextBuilder.AppendLine(context.WorldState.Summary);
            contextBuilder.AppendLine();
        }
        
        // Active quests
        if (context.ActiveQuests.Any())
        {
            contextBuilder.AppendLine("Active Quests:");
            foreach (var quest in context.ActiveQuests.Take(3))
            {
                contextBuilder.AppendLine($"- {quest.Name}: {quest.CurrentObjective}");
            }
            contextBuilder.AppendLine();
        }
        
        // Key NPCs
        if (context.KeyNPCs.Any())
        {
            contextBuilder.AppendLine("Key NPCs:");
            foreach (var npc in context.KeyNPCs.Take(5))
            {
                contextBuilder.AppendLine($"- {npc.Name}: {npc.Role} - {npc.PersonalityTrait}");
            }
            contextBuilder.AppendLine();
        }
        
        // Player characters
        if (context.PlayerCharacters.Any())
        {
            contextBuilder.AppendLine("Player Characters:");
            foreach (var character in context.PlayerCharacters)
            {
                contextBuilder.AppendLine($"- {character.Name} ({character.Race} {character.Class}, Level {character.Level})");
            }
            contextBuilder.AppendLine();
        }
        
        // Recent events
        if (context.RecentEvents.Any())
        {
            contextBuilder.AppendLine("Recent Events:");
            foreach (var evt in context.RecentEvents.Take(5))
            {
                contextBuilder.AppendLine($"- {evt.Summary}");
            }
            contextBuilder.AppendLine();
        }
        
        // Relevant memories
        if (context.RelevantMemories.Any())
        {
            contextBuilder.AppendLine("Relevant Context:");
            foreach (var memory in context.RelevantMemories.Take(3))
            {
                contextBuilder.AppendLine($"- {memory.Content}");
            }
            contextBuilder.AppendLine();
        }
        
        // User's actual prompt
        contextBuilder.AppendLine("User Request:");
        contextBuilder.AppendLine(userPrompt);
        
        return contextBuilder.ToString();
    }

    private async Task<CampaignContext> CompressContextAsync(CampaignContext context, int maxTokens)
    {
        // Estimate current token usage (rough approximation: 4 chars per token)
        var currentContent = context.ToString();
        var estimatedTokens = currentContent.Length / 4;
        
        if (estimatedTokens <= maxTokens)
        {
            return context;
        }
        
        // Compression strategy: prioritize recent and important information
        var compressionRatio = (double)maxTokens / estimatedTokens;
        
        return new CampaignContext
        {
            CampaignId = context.CampaignId,
            CampaignName = context.CampaignName,
            CampaignDescription = TruncateText(context.CampaignDescription, (int)(200 * compressionRatio)),
            WorldState = context.WorldState != null ? new WorldState
            {
                Summary = TruncateText(context.WorldState.Summary, (int)(500 * compressionRatio))
            } : null,
            ActiveQuests = context.ActiveQuests.Take((int)(3 * compressionRatio)).ToList(),
            RecentEvents = context.RecentEvents.Take((int)(10 * compressionRatio)).ToList(),
            KeyNPCs = context.KeyNPCs.Take((int)(5 * compressionRatio)).ToList(),
            PlayerCharacters = context.PlayerCharacters, // Always include all PCs
            RelevantMemories = context.RelevantMemories.Take((int)(3 * compressionRatio)).ToList(),
            LastUpdated = context.LastUpdated
        };
    }

    private string TruncateText(string text, int maxLength)
    {
        if (string.IsNullOrEmpty(text) || text.Length <= maxLength)
        {
            return text;
        }
        
        return text.Substring(0, maxLength - 3) + "...";
    }
}
```

#### **4. Subscription-Tiered AI Access**
```csharp
public class AISubscriptionService
{
    public static readonly Dictionary<SubscriptionTier, AISubscriptionLimits> TierLimits = new()
    {
        [SubscriptionTier.Free] = new AISubscriptionLimits
        {
            MonthlyRequests = 50,
            MaxTokensPerRequest = 1000,
            AllowedModels = new[] { "gpt-3.5-turbo" },
            Features = new[] { AIFeature.BasicTextGeneration },
            MaxContextTokens = 2000,
            RateLimitPerMinute = 5,
            PriorityLevel = 1
        },
        
        [SubscriptionTier.DungeonArchitect] = new AISubscriptionLimits
        {
            MonthlyRequests = 500,
            MaxTokensPerRequest = 2000,
            AllowedModels = new[] { "gpt-3.5-turbo", "gpt-4" },
            Features = new[] { AIFeature.BasicTextGeneration, AIFeature.CharacterGeneration, AIFeature.NPCDialogue },
            MaxContextTokens = 4000,
            RateLimitPerMinute = 15,
            PriorityLevel = 2
        },
        
        [SubscriptionTier.CampaignWeaver] = new AISubscriptionLimits
        {
            MonthlyRequests = 2000,
            MaxTokensPerRequest = 4000,
            AllowedModels = new[] { "gpt-3.5-turbo", "gpt-4", "gpt-4o" },
            Features = new[] { 
                AIFeature.BasicTextGeneration, 
                AIFeature.CharacterGeneration, 
                AIFeature.NPCDialogue,
                AIFeature.WorldBuilding,
                AIFeature.QuestGeneration,
                AIFeature.ImageGeneration
            },
            MaxContextTokens = 8000,
            RateLimitPerMinute = 30,
            PriorityLevel = 3
        },
        
        [SubscriptionTier.GuildMaster] = new AISubscriptionLimits
        {
            MonthlyRequests = 10000,
            MaxTokensPerRequest = 8000,
            AllowedModels = new[] { "gpt-3.5-turbo", "gpt-4", "gpt-4o", "claude-3-opus" },
            Features = Enum.GetValues<AIFeature>(), // All features
            MaxContextTokens = 16000,
            RateLimitPerMinute = 100,
            PriorityLevel = 4
        }
    };

    public static AISubscriptionLimits GetLimitsForUser(SubscriptionTier tier)
    {
        return TierLimits.GetValueOrDefault(tier, TierLimits[SubscriptionTier.Free]);
    }
}

public class AISubscriptionLimits
{
    public int MonthlyRequests { get; set; }
    public int MaxTokensPerRequest { get; set; }
    public string[] AllowedModels { get; set; }
    public AIFeature[] Features { get; set; }
    public int MaxContextTokens { get; set; }
    public int RateLimitPerMinute { get; set; }
    public int PriorityLevel { get; set; }
}

public enum AIFeature
{
    BasicTextGeneration,
    CharacterGeneration,
    NPCDialogue,
    WorldBuilding,
    QuestGeneration,
    ImageGeneration,
    VoiceSynthesis,
    AdvancedContext,
    FunctionCalling,
    StreamingResponses
}
```

---

## Data Models

### **Core AI Request/Response Models**
```csharp
public record AIRequest
{
    public Guid UserId { get; init; }
    public Guid? CampaignId { get; init; }
    public AIRequestType Type { get; init; }
    public List<AIMessage> Messages { get; init; } = new();
    public AIParameters Parameters { get; init; } = new();
    public List<AIFunction>? Functions { get; init; }
    public string? FunctionCallStrategy { get; init; }
    public Dictionary<string, object> Metadata { get; init; } = new();
    public bool RequiresAdvancedReasoning { get; init; }
    public int Priority { get; init; } = 1;
}

public record AIResponse
{
    public string Content { get; init; } = string.Empty;
    public string? FunctionCall { get; init; }
    public string FinishReason { get; init; } = string.Empty;
    public AIUsage Usage { get; init; } = new();
    public string ProviderId { get; init; } = string.Empty;
    public string Model { get; init; } = string.Empty;
    public string RequestId { get; init; } = string.Empty;
    public DateTime CreatedAt { get; init; }
    public Dictionary<string, object> Metadata { get; init; } = new();
    public double? QualityScore { get; init; }
    public List<string> ContentWarnings { get; init; } = new();
}

public record AIMessage
{
    public string Role { get; init; } = string.Empty; // system, user, assistant, function
    public string Content { get; init; } = string.Empty;
    public string? Name { get; init; } // For function messages
    public Dictionary<string, object> Metadata { get; init; } = new();
}

public record AIParameters
{
    public float? Temperature { get; init; }
    public int? MaxTokens { get; init; }
    public float? TopP { get; init; }
    public float? FrequencyPenalty { get; init; }
    public float? PresencePenalty { get; init; }
    public List<string>? Stop { get; init; }
    public string? LogitBias { get; init; }
}

public record AIUsage
{
    public int PromptTokens { get; init; }
    public int CompletionTokens { get; init; }
    public int TotalTokens { get; init; }
    public decimal EstimatedCost { get; init; }
    public TimeSpan ProcessingTime { get; init; }
}

public enum AIRequestType
{
    GeneralText,
    NPCDialogue,
    WorldDescription,
    CharacterBackground,
    QuestGeneration,
    RulesClarification,
    CombatDescription,
    LocationDescription,
    ItemDescription,
    SpellDescription,
    ImageGeneration,
    VoiceSynthesis
}
```

This AI architecture provides a robust, scalable, and subscription-aware foundation for all AI-powered features in the D&D Campaign Management System. The modular design allows for easy provider switching, comprehensive context management, and fine-grained usage control based on subscription tiers.

Next, I'll create the AI provider abstraction specification to detail the multi-provider support system.
