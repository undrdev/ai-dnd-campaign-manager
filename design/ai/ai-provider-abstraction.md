# AI Provider Abstraction Layer

## Overview
This document defines the AI provider abstraction layer that enables seamless integration with multiple AI services (OpenAI, Anthropic, local models, etc.) while providing intelligent routing, failover, cost optimization, and subscription-aware model selection.

---

## Provider Architecture

### **Multi-Provider Strategy**
```
┌─────────────────────────────────────────────────────────────────┐
│                    AI Gateway Service                          │
└─────────────────────────────────────────────────────────────────┘
                                │
                    ┌───────────────────────┐
                    │   Provider Router     │
                    │  (Load Balancing &    │
                    │   Intelligent Route)  │
                    └───────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
┌───────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Primary Tier  │    │ Secondary Tier  │    │  Fallback Tier  │
│   Providers   │    │   Providers     │    │   Providers     │
└───────────────┘    └─────────────────┘    └─────────────────┘
        │                       │                       │
┌───────┼───────┐    ┌─────┼─────┐      ┌─────────┼─────────┐
│       │       │    │     │     │      │         │         │
│ OpenAI│Claude │    │Local│Azure│      │ Backup  │ Cache   │
│  API  │  API  │    │Model│ AI  │      │Provider │Response │
└───────┴───────┘    └─────┴─────┘      └─────────┴─────────┘
```

### **Core Provider Interface**
```csharp
public interface IAIProvider
{
    // Provider identification
    string ProviderId { get; }
    string DisplayName { get; }
    string Version { get; }
    AIProviderType Type { get; }
    AIProviderCapabilities Capabilities { get; }
    
    // Generation methods
    Task<AIResponse> GenerateAsync(AIRequest request, CancellationToken cancellationToken = default);
    Task<StreamingAIResponse> StreamAsync(AIRequest request, CancellationToken cancellationToken = default);
    
    // Specialized methods
    Task<ImageGenerationResponse> GenerateImageAsync(ImageGenerationRequest request, CancellationToken cancellationToken = default);
    Task<VoiceSynthesisResponse> SynthesizeVoiceAsync(VoiceSynthesisRequest request, CancellationToken cancellationToken = default);
    Task<EmbeddingResponse> GenerateEmbeddingsAsync(EmbeddingRequest request, CancellationToken cancellationToken = default);
    Task<ModerationResponse> ModerateContentAsync(ModerationRequest request, CancellationToken cancellationToken = default);
    
    // Provider health and metrics
    Task<ProviderHealthStatus> CheckHealthAsync();
    Task<ProviderMetrics> GetMetricsAsync(TimeSpan period);
    Task<decimal> EstimateCostAsync(AIRequest request);
    Task<ProviderLimits> GetCurrentLimitsAsync();
    
    // Configuration and lifecycle
    Task InitializeAsync(ProviderConfiguration configuration);
    Task<bool> ValidateConfigurationAsync(ProviderConfiguration configuration);
    void Dispose();
}

public enum AIProviderType
{
    CloudAPI,      // OpenAI, Anthropic, etc.
    LocalModel,    // Ollama, vLLM, etc.
    Hybrid,        // Azure OpenAI, AWS Bedrock
    Specialized    // Image gen, voice synthesis only
}

public class AIProviderCapabilities
{
    // Core capabilities
    public bool SupportsTextGeneration { get; set; }
    public bool SupportsImageGeneration { get; set; }
    public bool SupportsVoiceSynthesis { get; set; }
    public bool SupportsEmbeddings { get; set; }
    public bool SupportsModeration { get; set; }
    public bool SupportsStreaming { get; set; }
    public bool SupportsFunctionCalling { get; set; }
    public bool SupportsVision { get; set; }
    
    // Technical specifications
    public int MaxContextTokens { get; set; }
    public int MaxOutputTokens { get; set; }
    public int MaxBatchSize { get; set; }
    public TimeSpan MaxRequestDuration { get; set; }
    
    // Supported models and features
    public List<ModelInfo> SupportedModels { get; set; } = new();
    public List<string> SupportedLanguages { get; set; } = new();
    public List<string> SupportedFormats { get; set; } = new();
    
    // Pricing and limits
    public ProviderPricing Pricing { get; set; } = new();
    public ProviderLimits DefaultLimits { get; set; } = new();
    
    // Quality and performance characteristics
    public ProviderQualityProfile QualityProfile { get; set; } = new();
}

public class ModelInfo
{
    public string ModelId { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public ModelType Type { get; set; }
    public int ContextWindow { get; set; }
    public decimal InputPricePerToken { get; set; }
    public decimal OutputPricePerToken { get; set; }
    public bool IsRecommended { get; set; }
    public DateTime? DeprecationDate { get; set; }
    public List<string> Strengths { get; set; } = new();
    public List<string> Limitations { get; set; } = new();
}

public enum ModelType
{
    TextGeneration,
    TextEmbedding,
    ImageGeneration,
    ImageAnalysis,
    VoiceSynthesis,
    VoiceRecognition,
    Moderation,
    MultiModal
}
```

### **Provider Implementations**

#### **OpenAI Provider**
```csharp
public class OpenAIProvider : IAIProvider, IDisposable
{
    private readonly OpenAIClient _client;
    private readonly ILogger<OpenAIProvider> _logger;
    private readonly IMemoryCache _cache;
    private readonly OpenAIConfiguration _config;
    private readonly SemaphoreSlim _rateLimitSemaphore;

    public string ProviderId => "openai";
    public string DisplayName => "OpenAI";
    public string Version => "v1";
    public AIProviderType Type => AIProviderType.CloudAPI;

    public AIProviderCapabilities Capabilities => new()
    {
        SupportsTextGeneration = true,
        SupportsImageGeneration = true,
        SupportsEmbeddings = true,
        SupportsModeration = true,
        SupportsStreaming = true,
        SupportsFunctionCalling = true,
        SupportsVision = true,
        MaxContextTokens = 128000,
        MaxOutputTokens = 4096,
        MaxBatchSize = 100,
        MaxRequestDuration = TimeSpan.FromMinutes(10),
        SupportedModels = new()
        {
            new ModelInfo
            {
                ModelId = "gpt-4o",
                DisplayName = "GPT-4 Omni",
                Description = "Most capable multimodal model",
                Type = ModelType.TextGeneration,
                ContextWindow = 128000,
                InputPricePerToken = 0.000005m,
                OutputPricePerToken = 0.000015m,
                IsRecommended = true,
                Strengths = new() { "Reasoning", "Code", "Multimodal", "Latest knowledge" },
                Limitations = new() { "High cost", "Rate limits" }
            },
            new ModelInfo
            {
                ModelId = "gpt-4-turbo",
                DisplayName = "GPT-4 Turbo",
                Description = "High performance text model",
                Type = ModelType.TextGeneration,
                ContextWindow = 128000,
                InputPricePerToken = 0.00001m,
                OutputPricePerToken = 0.00003m,
                IsRecommended = false,
                Strengths = new() { "Reasoning", "Code", "Large context" },
                Limitations = new() { "No vision", "Higher cost than 3.5" }
            },
            new ModelInfo
            {
                ModelId = "gpt-3.5-turbo",
                DisplayName = "GPT-3.5 Turbo",
                Description = "Fast and cost-effective",
                Type = ModelType.TextGeneration,
                ContextWindow = 16385,
                InputPricePerToken = 0.0000005m,
                OutputPricePerToken = 0.0000015m,
                IsRecommended = true,
                Strengths = new() { "Speed", "Cost-effective", "Good quality" },
                Limitations = new() { "Limited reasoning", "Smaller context" }
            },
            new ModelInfo
            {
                ModelId = "dall-e-3",
                DisplayName = "DALL-E 3",
                Description = "Advanced image generation",
                Type = ModelType.ImageGeneration,
                ContextWindow = 4000,
                InputPricePerToken = 0.04m, // Per image
                OutputPricePerToken = 0,
                IsRecommended = true,
                Strengths = new() { "High quality", "Prompt adherence", "Style variety" },
                Limitations = new() { "Slow generation", "High cost", "Content policy" }
            }
        },
        SupportedLanguages = new() { "en", "es", "fr", "de", "it", "pt", "ru", "ja", "ko", "zh" },
        SupportedFormats = new() { "text", "json", "markdown", "code" }
    };

    public async Task<AIResponse> GenerateAsync(AIRequest request, CancellationToken cancellationToken = default)
    {
        await _rateLimitSemaphore.WaitAsync(cancellationToken);
        
        try
        {
            var model = SelectOptimalModel(request);
            var messages = ConvertMessages(request.Messages);
            
            var chatRequest = new ChatCompletionRequest
            {
                Model = model.ModelId,
                Messages = messages,
                Temperature = request.Parameters.Temperature ?? 0.7f,
                MaxTokens = Math.Min(
                    request.Parameters.MaxTokens ?? 2000, 
                    model.ContextWindow - EstimatePromptTokens(messages)
                ),
                TopP = request.Parameters.TopP ?? 1.0f,
                FrequencyPenalty = request.Parameters.FrequencyPenalty ?? 0.0f,
                PresencePenalty = request.Parameters.PresencePenalty ?? 0.0f,
                Stop = request.Parameters.Stop?.ToArray(),
                User = request.UserId.ToString(),
                Stream = false
            };

            // Add function calling if supported and requested
            if (request.Functions?.Any() == true && model.Type == ModelType.TextGeneration)
            {
                chatRequest.Functions = ConvertFunctions(request.Functions);
                chatRequest.FunctionCall = request.FunctionCallStrategy ?? "auto";
            }

            var stopwatch = Stopwatch.StartNew();
            var response = await _client.ChatCompletions.CreateAsync(chatRequest, cancellationToken);
            stopwatch.Stop();

            var choice = response.Choices.FirstOrDefault();
            if (choice == null)
            {
                throw new AIProviderException("No response choices returned from OpenAI");
            }

            var aiResponse = new AIResponse
            {
                Content = choice.Message.Content ?? string.Empty,
                FunctionCall = choice.Message.FunctionCall?.ToString(),
                FinishReason = choice.FinishReason ?? "unknown",
                Usage = new AIUsage
                {
                    PromptTokens = response.Usage.PromptTokens,
                    CompletionTokens = response.Usage.CompletionTokens,
                    TotalTokens = response.Usage.TotalTokens,
                    EstimatedCost = CalculateCost(response.Usage, model),
                    ProcessingTime = stopwatch.Elapsed
                },
                ProviderId = ProviderId,
                Model = model.ModelId,
                RequestId = response.Id,
                CreatedAt = DateTime.UtcNow,
                Metadata = new()
                {
                    ["system_fingerprint"] = response.SystemFingerprint,
                    ["model_version"] = model.Version,
                    ["provider_type"] = Type.ToString()
                }
            };

            // Log successful request
            _logger.LogInformation(
                "OpenAI request completed: Model={Model}, Tokens={TotalTokens}, Cost={Cost}, Duration={Duration}ms",
                model.ModelId, response.Usage.TotalTokens, aiResponse.Usage.EstimatedCost, stopwatch.ElapsedMilliseconds);

            return aiResponse;
        }
        catch (OpenAIException ex)
        {
            _logger.LogError(ex, "OpenAI API error: {Message}", ex.Message);
            throw new AIProviderException($"OpenAI API error: {ex.Message}", ex)
            {
                ProviderId = ProviderId,
                ErrorCode = ex.ErrorCode,
                IsRetryable = IsRetryableError(ex)
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error calling OpenAI API");
            throw new AIProviderException($"OpenAI provider error: {ex.Message}", ex)
            {
                ProviderId = ProviderId,
                IsRetryable = false
            };
        }
        finally
        {
            _rateLimitSemaphore.Release();
        }
    }

    public async Task<StreamingAIResponse> StreamAsync(AIRequest request, CancellationToken cancellationToken = default)
    {
        await _rateLimitSemaphore.WaitAsync(cancellationToken);
        
        try
        {
            var model = SelectOptimalModel(request);
            var messages = ConvertMessages(request.Messages);
            
            var chatRequest = new ChatCompletionRequest
            {
                Model = model.ModelId,
                Messages = messages,
                Temperature = request.Parameters.Temperature ?? 0.7f,
                MaxTokens = request.Parameters.MaxTokens ?? 2000,
                Stream = true,
                User = request.UserId.ToString()
            };

            var streamResponse = _client.ChatCompletions.CreateStreamAsync(chatRequest, cancellationToken);
            
            return new StreamingAIResponse
            {
                ProviderId = ProviderId,
                Model = model.ModelId,
                Stream = ConvertToAIStream(streamResponse, model),
                RequestId = Guid.NewGuid().ToString(),
                CreatedAt = DateTime.UtcNow
            };
        }
        finally
        {
            _rateLimitSemaphore.Release();
        }
    }

    private ModelInfo SelectOptimalModel(AIRequest request)
    {
        var availableModels = Capabilities.SupportedModels
            .Where(m => m.Type == ModelType.TextGeneration)
            .ToList();

        // Selection logic based on request characteristics
        if (request.RequiresAdvancedReasoning)
        {
            return availableModels.FirstOrDefault(m => m.ModelId == "gpt-4o") 
                ?? availableModels.FirstOrDefault(m => m.ModelId == "gpt-4-turbo")
                ?? availableModels.First();
        }

        // For simple requests, prefer cost-effective models
        var estimatedTokens = EstimateRequestTokens(request);
        if (estimatedTokens < 1000)
        {
            return availableModels.FirstOrDefault(m => m.ModelId == "gpt-3.5-turbo")
                ?? availableModels.First();
        }

        // Default to recommended model
        return availableModels.FirstOrDefault(m => m.IsRecommended)
            ?? availableModels.First();
    }

    private decimal CalculateCost(Usage usage, ModelInfo model)
    {
        return (usage.PromptTokens * model.InputPricePerToken) +
               (usage.CompletionTokens * model.OutputPricePerToken);
    }

    private bool IsRetryableError(OpenAIException ex)
    {
        return ex.ErrorCode switch
        {
            "rate_limit_exceeded" => true,
            "server_error" => true,
            "timeout" => true,
            "insufficient_quota" => false,
            "invalid_request_error" => false,
            _ => false
        };
    }

    public async Task<ProviderHealthStatus> CheckHealthAsync()
    {
        try
        {
            var testRequest = new AIRequest
            {
                UserId = Guid.Empty,
                Type = AIRequestType.GeneralText,
                Messages = new() { new AIMessage { Role = "user", Content = "Hello" } },
                Parameters = new AIParameters { MaxTokens = 5, Temperature = 0 }
            };

            var stopwatch = Stopwatch.StartNew();
            await GenerateAsync(testRequest);
            stopwatch.Stop();

            return new ProviderHealthStatus
            {
                ProviderId = ProviderId,
                IsHealthy = true,
                ResponseTime = stopwatch.Elapsed,
                LastChecked = DateTime.UtcNow,
                Details = "Provider responding normally"
            };
        }
        catch (Exception ex)
        {
            return new ProviderHealthStatus
            {
                ProviderId = ProviderId,
                IsHealthy = false,
                ResponseTime = TimeSpan.Zero,
                LastChecked = DateTime.UtcNow,
                Details = $"Health check failed: {ex.Message}",
                Error = ex.Message
            };
        }
    }

    public void Dispose()
    {
        _rateLimitSemaphore?.Dispose();
        _client?.Dispose();
    }
}
```

#### **Anthropic Claude Provider**
```csharp
public class AnthropicProvider : IAIProvider, IDisposable
{
    private readonly AnthropicClient _client;
    private readonly ILogger<AnthropicProvider> _logger;
    private readonly AnthropicConfiguration _config;

    public string ProviderId => "anthropic";
    public string DisplayName => "Anthropic Claude";
    public string Version => "v1";
    public AIProviderType Type => AIProviderType.CloudAPI;

    public AIProviderCapabilities Capabilities => new()
    {
        SupportsTextGeneration = true,
        SupportsImageGeneration = false,
        SupportsEmbeddings = false,
        SupportsModeration = true,
        SupportsStreaming = true,
        SupportsFunctionCalling = true,
        SupportsVision = true,
        MaxContextTokens = 200000,
        MaxOutputTokens = 8192,
        SupportedModels = new()
        {
            new ModelInfo
            {
                ModelId = "claude-3-5-sonnet-20241022",
                DisplayName = "Claude 3.5 Sonnet",
                Description = "Most intelligent model with vision",
                Type = ModelType.TextGeneration,
                ContextWindow = 200000,
                InputPricePerToken = 0.000003m,
                OutputPricePerToken = 0.000015m,
                IsRecommended = true,
                Strengths = new() { "Reasoning", "Analysis", "Code", "Vision", "Large context" },
                Limitations = new() { "No image generation", "Higher cost" }
            },
            new ModelInfo
            {
                ModelId = "claude-3-haiku-20240307",
                DisplayName = "Claude 3 Haiku",
                Description = "Fastest and most cost-effective",
                Type = ModelType.TextGeneration,
                ContextWindow = 200000,
                InputPricePerToken = 0.00000025m,
                OutputPricePerToken = 0.00000125m,
                IsRecommended = false,
                Strengths = new() { "Speed", "Cost-effective", "Good for simple tasks" },
                Limitations = new() { "Less capable reasoning", "Shorter responses" }
            }
        },
        SupportedLanguages = new() { "en", "es", "fr", "de", "it", "pt", "ru", "ja", "ko", "zh" }
    };

    public async Task<AIResponse> GenerateAsync(AIRequest request, CancellationToken cancellationToken = default)
    {
        try
        {
            var model = SelectOptimalModel(request);
            var messages = ConvertToClaudeMessages(request.Messages);
            
            var claudeRequest = new MessageRequest
            {
                Model = model.ModelId,
                Messages = messages,
                MaxTokens = request.Parameters.MaxTokens ?? 2000,
                Temperature = request.Parameters.Temperature ?? 0.7f,
                TopP = request.Parameters.TopP ?? 1.0f,
                StopSequences = request.Parameters.Stop?.ToArray()
            };

            var stopwatch = Stopwatch.StartNew();
            var response = await _client.Messages.CreateAsync(claudeRequest, cancellationToken);
            stopwatch.Stop();

            var content = response.Content.FirstOrDefault()?.Text ?? string.Empty;

            return new AIResponse
            {
                Content = content,
                FinishReason = response.StopReason ?? "unknown",
                Usage = new AIUsage
                {
                    PromptTokens = response.Usage.InputTokens,
                    CompletionTokens = response.Usage.OutputTokens,
                    TotalTokens = response.Usage.InputTokens + response.Usage.OutputTokens,
                    EstimatedCost = CalculateCost(response.Usage, model),
                    ProcessingTime = stopwatch.Elapsed
                },
                ProviderId = ProviderId,
                Model = model.ModelId,
                RequestId = response.Id,
                CreatedAt = DateTime.UtcNow
            };
        }
        catch (AnthropicException ex)
        {
            _logger.LogError(ex, "Anthropic API error: {Message}", ex.Message);
            throw new AIProviderException($"Anthropic API error: {ex.Message}", ex)
            {
                ProviderId = ProviderId,
                IsRetryable = IsRetryableError(ex)
            };
        }
    }

    private ModelInfo SelectOptimalModel(AIRequest request)
    {
        var availableModels = Capabilities.SupportedModels.ToList();
        
        // For complex reasoning tasks, use Sonnet
        if (request.RequiresAdvancedReasoning || request.Messages.Any(m => m.Content.Length > 5000))
        {
            return availableModels.FirstOrDefault(m => m.ModelId.Contains("sonnet"))
                ?? availableModels.First();
        }
        
        // For simple tasks, use Haiku for speed and cost
        return availableModels.FirstOrDefault(m => m.ModelId.Contains("haiku"))
            ?? availableModels.First();
    }
}
```

### **Provider Router and Load Balancer**
```csharp
public interface IProviderRouter
{
    Task<IAIProvider> SelectProviderAsync(AIRequest request);
    Task<List<IAIProvider>> GetAvailableProvidersAsync(AIRequestType requestType);
    Task<IAIProvider> GetFallbackProviderAsync(AIRequest request, string failedProviderId);
    Task UpdateProviderHealthAsync(string providerId, ProviderHealthStatus health);
}

public class ProviderRouter : IProviderRouter
{
    private readonly IEnumerable<IAIProvider> _providers;
    private readonly IProviderHealthMonitor _healthMonitor;
    private readonly IProviderCostOptimizer _costOptimizer;
    private readonly ILogger<ProviderRouter> _logger;
    private readonly IMemoryCache _routingCache;

    public async Task<IAIProvider> SelectProviderAsync(AIRequest request)
    {
        var cacheKey = $"provider_route_{request.Type}_{request.UserId}";
        if (_routingCache.TryGetValue(cacheKey, out IAIProvider cachedProvider))
        {
            if (await _healthMonitor.IsHealthyAsync(cachedProvider.ProviderId))
            {
                return cachedProvider;
            }
        }

        var availableProviders = await GetAvailableProvidersAsync(request.Type);
        if (!availableProviders.Any())
        {
            throw new NoAvailableProvidersException($"No providers available for request type: {request.Type}");
        }

        // Multi-factor selection algorithm
        var selectedProvider = await SelectOptimalProviderAsync(request, availableProviders);
        
        // Cache the selection for a short period
        _routingCache.Set(cacheKey, selectedProvider, TimeSpan.FromMinutes(5));
        
        _logger.LogInformation(
            "Selected provider {ProviderId} for request type {RequestType} from user {UserId}",
            selectedProvider.ProviderId, request.Type, request.UserId);

        return selectedProvider;
    }

    private async Task<IAIProvider> SelectOptimalProviderAsync(AIRequest request, List<IAIProvider> providers)
    {
        var scoredProviders = new List<(IAIProvider Provider, double Score)>();

        foreach (var provider in providers)
        {
            var score = await CalculateProviderScoreAsync(provider, request);
            scoredProviders.Add((provider, score));
        }

        // Select the highest scoring provider
        var selected = scoredProviders
            .OrderByDescending(p => p.Score)
            .First();

        return selected.Provider;
    }

    private async Task<double> CalculateProviderScoreAsync(IAIProvider provider, AIRequest request)
    {
        double score = 0;

        // Health factor (40% weight)
        var health = await _healthMonitor.GetHealthStatusAsync(provider.ProviderId);
        score += health.IsHealthy ? 40 : 0;
        if (health.ResponseTime < TimeSpan.FromSeconds(2))
            score += 10; // Bonus for fast response

        // Cost factor (25% weight)
        var estimatedCost = await provider.EstimateCostAsync(request);
        var costScore = _costOptimizer.CalculateCostScore(estimatedCost, request.Type);
        score += costScore * 0.25;

        // Capability match (20% weight)
        var capabilityScore = CalculateCapabilityScore(provider.Capabilities, request);
        score += capabilityScore * 0.20;

        // Load balancing factor (10% weight)
        var loadScore = await CalculateLoadScore(provider);
        score += loadScore * 0.10;

        // User preference factor (5% weight)
        var preferenceScore = await GetUserPreferenceScore(provider.ProviderId, request.UserId);
        score += preferenceScore * 0.05;

        return score;
    }

    private double CalculateCapabilityScore(AIProviderCapabilities capabilities, AIRequest request)
    {
        double score = 0;

        // Check if provider supports the required features
        switch (request.Type)
        {
            case AIRequestType.NPCDialogue:
                score += capabilities.SupportsTextGeneration ? 50 : 0;
                score += capabilities.SupportsFunctionCalling ? 20 : 0;
                break;
            case AIRequestType.ImageGeneration:
                score += capabilities.SupportsImageGeneration ? 70 : 0;
                break;
            case AIRequestType.WorldDescription:
                score += capabilities.SupportsTextGeneration ? 40 : 0;
                score += capabilities.MaxContextTokens > 8000 ? 30 : 0;
                break;
        }

        // Bonus for advanced features
        if (capabilities.SupportsStreaming && request.Parameters.MaxTokens > 1000)
            score += 10;

        return Math.Min(score, 100);
    }
}
```

This comprehensive AI provider abstraction layer enables the system to intelligently route requests across multiple AI providers while optimizing for cost, performance, and capabilities based on the specific needs of each request and user subscription tier.
