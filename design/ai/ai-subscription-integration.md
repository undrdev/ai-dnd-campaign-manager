# AI Subscription Integration System

## Overview
This document defines the comprehensive integration between AI features and subscription tiers, including feature gating, usage limits, quality tiers, priority queuing, and seamless upgrade/downgrade handling to provide differentiated AI experiences based on subscription levels.

---

## Subscription-AI Integration Architecture

### **Tiered AI Feature System**
```
┌─────────────────────────────────────────────────────────────────┐
│                    User AI Request                              │
└─────────────────────────────────────────────────────────────────┘
                                │
                    ┌───────────────────────┐
                    │   Subscription        │
                    │   Tier Detection      │
                    │  (Free, Architect,    │
                    │   Weaver, Master)     │
                    └───────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
┌───────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Feature     │    │   Usage Limit   │    │   Quality       │
│   Access      │    │   Validation    │    │   Tier          │
│   Control     │    │ (Requests, Tokens,│  │   Selection     │
│              │    │   Cost Limits)   │    │                 │
└───────────────┘    └─────────────────┘    └─────────────────┘
        │                       │                       │
        └───────────────────────┼───────────────────────┘
                                │
                    ┌───────────────────────┐
                    │   Priority Queue      │
                    │   Management          │
                    │  (Request Routing     │
                    │   & Processing)       │
                    └───────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
┌───────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   AI Provider │    │   Response      │    │   Usage         │
│   Selection   │    │   Enhancement   │    │   Tracking      │
│  (Best models │    │  (Post-process  │    │  & Billing      │
│   for tier)   │    │   for tier)     │    │   Integration   │
└───────────────┘    └─────────────────┘    └─────────────────┘
```

### **Core Subscription Integration Interface**
```csharp
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
    
    // Analytics and reporting
    Task<SubscriptionUsageAnalytics> GetUsageAnalyticsAsync(Guid userId, TimeSpan period);
    Task<TierPerformanceMetrics> GetTierPerformanceMetricsAsync(SubscriptionTier tier, TimeSpan period);
    Task<RevenueAnalytics> GetRevenueAnalyticsAsync(TimeSpan period);
}

public enum AIFeatureType
{
    // Basic features
    BasicTextGeneration,
    BasicCharacterCreation,
    
    // Advanced features
    NPCDialogueGeneration,
    WorldBuilding,
    QuestGeneration,
    CharacterBackgroundGeneration,
    
    // Premium features
    AdvancedNPCPersonalities,
    ComplexWorldGeneration,
    EpicQuestChains,
    ImageGeneration,
    VoiceSynthesis,
    
    // Master features
    UnlimitedGeneration,
    PriorityProcessing,
    AdvancedAnalytics,
    CustomModels,
    APIAccess
}

public enum QualityTier
{
    Basic,      // Standard models, basic quality
    Enhanced,   // Better models, improved quality
    Premium,    // Best models, highest quality
    Ultimate    // Cutting-edge models, maximum quality
}

public enum PriorityLevel
{
    Low = 1,        // Free tier
    Normal = 2,     // Dungeon Architect
    High = 3,       // Campaign Weaver
    Critical = 4    // Guild Master
}

public class SubscriptionAILimits
{
    public SubscriptionTier Tier { get; set; }
    public string TierName { get; set; } = string.Empty;
    public string TierDescription { get; set; } = string.Empty;
    
    // Usage limits
    public int MonthlyRequestLimit { get; set; }
    public int DailyRequestLimit { get; set; }
    public int HourlyRequestLimit { get; set; }
    public int MaxTokensPerRequest { get; set; }
    public decimal MonthlySpendLimit { get; set; }
    
    // Feature access
    public List<AIFeatureType> AvailableFeatures { get; set; } = new();
    public List<AIFeatureType> RestrictedFeatures { get; set; } = new();
    public Dictionary<AIFeatureType, FeatureLimitations> FeatureLimitations { get; set; } = new();
    
    // Quality and performance
    public QualityTier QualityTier { get; set; }
    public PriorityLevel Priority { get; set; }
    public TimeSpan MaxProcessingTime { get; set; }
    public List<string> AvailableModels { get; set; } = new();
    
    // Advanced features
    public bool HasPrioritySupport { get; set; }
    public bool HasAdvancedAnalytics { get; set; }
    public bool HasAPIAccess { get; set; }
    public bool HasCustomization { get; set; }
    public int ConcurrentRequestLimit { get; set; }
}

public class FeatureLimitations
{
    public bool IsAvailable { get; set; }
    public int? UsageLimit { get; set; }
    public TimeSpan? Cooldown { get; set; }
    public List<string> Restrictions { get; set; } = new();
    public string? UpgradeMessage { get; set; }
}
```

### **Subscription AI Service Implementation**
```csharp
public class SubscriptionAIService : ISubscriptionAIService
{
    private readonly ISubscriptionService _subscriptionService;
    private readonly IUsageTracker _usageTracker;
    private readonly IAIGatewayService _aiGateway;
    private readonly IPriorityQueueService _priorityQueue;
    private readonly IModelSelectionService _modelSelection;
    private readonly IQualityEnhancementService _qualityEnhancement;
    private readonly ILogger<SubscriptionAIService> _logger;

    // Define subscription tier limits
    private static readonly Dictionary<SubscriptionTier, SubscriptionAILimits> TierLimits = new()
    {
        [SubscriptionTier.Free] = new SubscriptionAILimits
        {
            Tier = SubscriptionTier.Free,
            TierName = "Free",
            TierDescription = "Basic AI features for getting started",
            
            // Usage limits
            MonthlyRequestLimit = 50,
            DailyRequestLimit = 5,
            HourlyRequestLimit = 2,
            MaxTokensPerRequest = 1000,
            MonthlySpendLimit = 5.00m,
            
            // Feature access
            AvailableFeatures = new()
            {
                AIFeatureType.BasicTextGeneration,
                AIFeatureType.BasicCharacterCreation
            },
            RestrictedFeatures = new()
            {
                AIFeatureType.NPCDialogueGeneration,
                AIFeatureType.WorldBuilding,
                AIFeatureType.QuestGeneration,
                AIFeatureType.ImageGeneration,
                AIFeatureType.VoiceSynthesis,
                AIFeatureType.AdvancedNPCPersonalities,
                AIFeatureType.ComplexWorldGeneration,
                AIFeatureType.EpicQuestChains,
                AIFeatureType.UnlimitedGeneration,
                AIFeatureType.PriorityProcessing,
                AIFeatureType.AdvancedAnalytics,
                AIFeatureType.CustomModels,
                AIFeatureType.APIAccess
            },
            
            // Quality and performance
            QualityTier = QualityTier.Basic,
            Priority = PriorityLevel.Low,
            MaxProcessingTime = TimeSpan.FromMinutes(5),
            AvailableModels = new() { "gpt-3.5-turbo" },
            ConcurrentRequestLimit = 1,
            
            // Advanced features
            HasPrioritySupport = false,
            HasAdvancedAnalytics = false,
            HasAPIAccess = false,
            HasCustomization = false
        },
        
        [SubscriptionTier.DungeonArchitect] = new SubscriptionAILimits
        {
            Tier = SubscriptionTier.DungeonArchitect,
            TierName = "Dungeon Architect",
            TierDescription = "Enhanced AI features for serious game masters",
            
            // Usage limits
            MonthlyRequestLimit = 500,
            DailyRequestLimit = 25,
            HourlyRequestLimit = 10,
            MaxTokensPerRequest = 2000,
            MonthlySpendLimit = 25.00m,
            
            // Feature access
            AvailableFeatures = new()
            {
                AIFeatureType.BasicTextGeneration,
                AIFeatureType.BasicCharacterCreation,
                AIFeatureType.NPCDialogueGeneration,
                AIFeatureType.WorldBuilding,
                AIFeatureType.CharacterBackgroundGeneration
            },
            RestrictedFeatures = new()
            {
                AIFeatureType.QuestGeneration,
                AIFeatureType.ImageGeneration,
                AIFeatureType.VoiceSynthesis,
                AIFeatureType.AdvancedNPCPersonalities,
                AIFeatureType.ComplexWorldGeneration,
                AIFeatureType.EpicQuestChains,
                AIFeatureType.UnlimitedGeneration,
                AIFeatureType.PriorityProcessing,
                AIFeatureType.AdvancedAnalytics,
                AIFeatureType.CustomModels,
                AIFeatureType.APIAccess
            },
            
            // Quality and performance
            QualityTier = QualityTier.Enhanced,
            Priority = PriorityLevel.Normal,
            MaxProcessingTime = TimeSpan.FromMinutes(3),
            AvailableModels = new() { "gpt-3.5-turbo", "gpt-4" },
            ConcurrentRequestLimit = 2,
            
            // Advanced features
            HasPrioritySupport = false,
            HasAdvancedAnalytics = false,
            HasAPIAccess = false,
            HasCustomization = false
        },
        
        [SubscriptionTier.CampaignWeaver] = new SubscriptionAILimits
        {
            Tier = SubscriptionTier.CampaignWeaver,
            TierName = "Campaign Weaver",
            TierDescription = "Advanced AI features for professional game masters",
            
            // Usage limits
            MonthlyRequestLimit = 2000,
            DailyRequestLimit = 100,
            HourlyRequestLimit = 30,
            MaxTokensPerRequest = 4000,
            MonthlySpendLimit = 100.00m,
            
            // Feature access
            AvailableFeatures = new()
            {
                AIFeatureType.BasicTextGeneration,
                AIFeatureType.BasicCharacterCreation,
                AIFeatureType.NPCDialogueGeneration,
                AIFeatureType.WorldBuilding,
                AIFeatureType.QuestGeneration,
                AIFeatureType.CharacterBackgroundGeneration,
                AIFeatureType.AdvancedNPCPersonalities,
                AIFeatureType.ImageGeneration
            },
            RestrictedFeatures = new()
            {
                AIFeatureType.VoiceSynthesis,
                AIFeatureType.ComplexWorldGeneration,
                AIFeatureType.EpicQuestChains,
                AIFeatureType.UnlimitedGeneration,
                AIFeatureType.PriorityProcessing,
                AIFeatureType.AdvancedAnalytics,
                AIFeatureType.CustomModels,
                AIFeatureType.APIAccess
            },
            
            // Quality and performance
            QualityTier = QualityTier.Premium,
            Priority = PriorityLevel.High,
            MaxProcessingTime = TimeSpan.FromMinutes(2),
            AvailableModels = new() { "gpt-3.5-turbo", "gpt-4", "gpt-4o", "claude-3-sonnet" },
            ConcurrentRequestLimit = 5,
            
            // Advanced features
            HasPrioritySupport = true,
            HasAdvancedAnalytics = true,
            HasAPIAccess = false,
            HasCustomization = true
        },
        
        [SubscriptionTier.GuildMaster] = new SubscriptionAILimits
        {
            Tier = SubscriptionTier.GuildMaster,
            TierName = "Guild Master",
            TierDescription = "Ultimate AI experience with unlimited access",
            
            // Usage limits (essentially unlimited)
            MonthlyRequestLimit = int.MaxValue,
            DailyRequestLimit = 1000,
            HourlyRequestLimit = 100,
            MaxTokensPerRequest = 8000,
            MonthlySpendLimit = decimal.MaxValue,
            
            // Feature access (all features)
            AvailableFeatures = Enum.GetValues<AIFeatureType>().ToList(),
            RestrictedFeatures = new(),
            
            // Quality and performance
            QualityTier = QualityTier.Ultimate,
            Priority = PriorityLevel.Critical,
            MaxProcessingTime = TimeSpan.FromMinutes(1),
            AvailableModels = new() { "gpt-3.5-turbo", "gpt-4", "gpt-4o", "claude-3-opus", "claude-3-5-sonnet" },
            ConcurrentRequestLimit = 10,
            
            // Advanced features
            HasPrioritySupport = true,
            HasAdvancedAnalytics = true,
            HasAPIAccess = true,
            HasCustomization = true
        }
    };

    public async Task<FeatureAccessResult> CheckFeatureAccessAsync(Guid userId, AIFeatureType featureType)
    {
        try
        {
            var subscription = await _subscriptionService.GetUserSubscriptionAsync(userId);
            var limits = GetLimitsForTier(subscription.Tier);
            
            var result = new FeatureAccessResult
            {
                FeatureType = featureType,
                IsAvailable = limits.AvailableFeatures.Contains(featureType),
                SubscriptionTier = subscription.Tier
            };

            if (!result.IsAvailable)
            {
                result.RestrictionReason = GetRestrictionReason(featureType, subscription.Tier);
                result.UpgradeRecommendation = GetUpgradeRecommendationForFeature(featureType, subscription.Tier);
            }
            else
            {
                // Check if there are any limitations on this feature
                if (limits.FeatureLimitations.TryGetValue(featureType, out var limitations))
                {
                    result.Limitations = limitations;
                    
                    // Check current usage against limitations
                    if (limitations.UsageLimit.HasValue)
                    {
                        var currentUsage = await GetFeatureUsageAsync(userId, featureType);
                        result.RemainingUsage = Math.Max(0, limitations.UsageLimit.Value - currentUsage);
                        result.IsAvailable = result.RemainingUsage > 0;
                        
                        if (!result.IsAvailable)
                        {
                            result.RestrictionReason = $"Feature usage limit reached ({limitations.UsageLimit.Value} per month)";
                        }
                    }
                }
            }

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to check feature access for user {UserId}, feature {FeatureType}", 
                userId, featureType);
            
            return new FeatureAccessResult
            {
                FeatureType = featureType,
                IsAvailable = false,
                RestrictionReason = "Unable to verify feature access"
            };
        }
    }

    public async Task<UsageValidationResult> ValidateUsageAsync(Guid userId, AIUsageRequest request)
    {
        var result = new UsageValidationResult
        {
            IsAllowed = true,
            UserId = userId
        };

        try
        {
            var subscription = await _subscriptionService.GetUserSubscriptionAsync(userId);
            var limits = GetLimitsForTier(subscription.Tier);
            
            // Check monthly request limit
            var monthlyUsage = await _usageTracker.GetMonthlyUsageAsync(userId);
            if (monthlyUsage.TotalRequests >= limits.MonthlyRequestLimit)
            {
                result.IsAllowed = false;
                result.RestrictionReason = $"Monthly request limit exceeded ({limits.MonthlyRequestLimit})";
                result.UpgradeRecommendation = GetUpgradeRecommendationForUsage(subscription.Tier);
                return result;
            }

            // Check daily request limit
            var dailyUsage = await _usageTracker.GetDailyUsageAsync(userId);
            if (dailyUsage.TotalRequests >= limits.DailyRequestLimit)
            {
                result.IsAllowed = false;
                result.RestrictionReason = $"Daily request limit exceeded ({limits.DailyRequestLimit})";
                result.NextAllowedTime = DateTime.UtcNow.Date.AddDays(1);
                return result;
            }

            // Check hourly request limit
            var hourlyUsage = await _usageTracker.GetHourlyUsageAsync(userId);
            if (hourlyUsage.TotalRequests >= limits.HourlyRequestLimit)
            {
                result.IsAllowed = false;
                result.RestrictionReason = $"Hourly request limit exceeded ({limits.HourlyRequestLimit})";
                result.NextAllowedTime = DateTime.UtcNow.AddHours(1);
                return result;
            }

            // Check token limit per request
            if (request.EstimatedTokens > limits.MaxTokensPerRequest)
            {
                result.IsAllowed = false;
                result.RestrictionReason = $"Request exceeds token limit ({limits.MaxTokensPerRequest} tokens)";
                result.SuggestedAction = "Reduce request complexity or upgrade subscription";
                return result;
            }

            // Check monthly spend limit
            var estimatedCost = await EstimateRequestCostAsync(request, subscription.Tier);
            if (monthlyUsage.TotalCost + estimatedCost > limits.MonthlySpendLimit)
            {
                result.IsAllowed = false;
                result.RestrictionReason = $"Monthly spend limit would be exceeded (${limits.MonthlySpendLimit})";
                result.UpgradeRecommendation = GetUpgradeRecommendationForUsage(subscription.Tier);
                return result;
            }

            // Check concurrent request limit
            var activeRequests = await _usageTracker.GetActiveRequestCountAsync(userId);
            if (activeRequests >= limits.ConcurrentRequestLimit)
            {
                result.IsAllowed = false;
                result.RestrictionReason = $"Concurrent request limit exceeded ({limits.ConcurrentRequestLimit})";
                result.SuggestedAction = "Wait for current requests to complete";
                return result;
            }

            // Set usage information
            result.RemainingMonthlyRequests = limits.MonthlyRequestLimit - monthlyUsage.TotalRequests;
            result.RemainingDailyRequests = limits.DailyRequestLimit - dailyUsage.TotalRequests;
            result.RemainingHourlyRequests = limits.HourlyRequestLimit - hourlyUsage.TotalRequests;
            result.EstimatedCost = estimatedCost;
            result.Priority = limits.Priority;

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to validate usage for user {UserId}", userId);
            
            result.IsAllowed = false;
            result.RestrictionReason = "Unable to validate usage limits";
            return result;
        }
    }

    public async Task<ModelSelectionResult> SelectOptimalModelAsync(Guid userId, AIRequest request)
    {
        var subscription = await _subscriptionService.GetUserSubscriptionAsync(userId);
        var limits = GetLimitsForTier(subscription.Tier);
        
        var result = new ModelSelectionResult
        {
            QualityTier = limits.QualityTier,
            Priority = limits.Priority
        };

        // Select model based on subscription tier and request type
        var availableModels = limits.AvailableModels;
        var selectedModel = await SelectBestModelForRequest(request, availableModels, limits.QualityTier);
        
        result.SelectedModel = selectedModel;
        result.ModelCapabilities = await GetModelCapabilitiesAsync(selectedModel);
        
        // Apply tier-specific enhancements
        result.EnhancedParameters = ApplyTierEnhancements(request.Parameters, limits);
        
        return result;
    }

    public async Task<QualityEnhancementResult> ApplyQualityEnhancementsAsync(AIResponse response, Guid userId)
    {
        var subscription = await _subscriptionService.GetUserSubscriptionAsync(userId);
        var limits = GetLimitsForTier(subscription.Tier);
        
        var result = new QualityEnhancementResult
        {
            OriginalResponse = response,
            QualityTier = limits.QualityTier
        };

        // Apply tier-specific quality enhancements
        switch (limits.QualityTier)
        {
            case QualityTier.Basic:
                result.EnhancedResponse = response; // No enhancements
                break;
                
            case QualityTier.Enhanced:
                result.EnhancedResponse = await ApplyBasicEnhancementsAsync(response);
                break;
                
            case QualityTier.Premium:
                result.EnhancedResponse = await ApplyAdvancedEnhancementsAsync(response);
                break;
                
            case QualityTier.Ultimate:
                result.EnhancedResponse = await ApplyUltimateEnhancementsAsync(response);
                break;
        }

        result.EnhancementsApplied = GetAppliedEnhancements(limits.QualityTier);
        return result;
    }

    public async Task HandleSubscriptionChangeAsync(Guid userId, SubscriptionTier oldTier, SubscriptionTier newTier)
    {
        _logger.LogInformation("Handling subscription change for user {UserId}: {OldTier} -> {NewTier}", 
            userId, oldTier, newTier);

        try
        {
            var oldLimits = GetLimitsForTier(oldTier);
            var newLimits = GetLimitsForTier(newTier);

            // Handle upgrade
            if (newTier > oldTier)
            {
                await HandleSubscriptionUpgradeAsync(userId, oldLimits, newLimits);
            }
            // Handle downgrade
            else if (newTier < oldTier)
            {
                await HandleSubscriptionDowngradeAsync(userId, oldLimits, newLimits);
            }

            // Update user's AI settings
            await UpdateUserAISettingsAsync(userId, newLimits);

            // Send notification about changes
            await NotifyUserOfSubscriptionChangeAsync(userId, oldTier, newTier);

            _logger.LogInformation("Successfully handled subscription change for user {UserId}", userId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to handle subscription change for user {UserId}", userId);
            throw;
        }
    }

    private async Task HandleSubscriptionUpgradeAsync(Guid userId, SubscriptionAILimits oldLimits, SubscriptionAILimits newLimits)
    {
        // Grant immediate access to new features
        var newFeatures = newLimits.AvailableFeatures.Except(oldLimits.AvailableFeatures).ToList();
        if (newFeatures.Any())
        {
            await GrantFeatureAccessAsync(userId, newFeatures);
        }

        // Increase priority for pending requests
        await _priorityQueue.UpgradePendingRequestsAsync(userId, newLimits.Priority);

        // Reset usage limits to new tier
        await _usageTracker.UpdateUsageLimitsAsync(userId, newLimits);

        // Enable premium features immediately
        await EnablePremiumFeaturesAsync(userId, newLimits);
    }

    private async Task HandleSubscriptionDowngradeAsync(Guid userId, SubscriptionAILimits oldLimits, SubscriptionAILimits newLimits)
    {
        // Check current usage against new limits
        var currentUsage = await _usageTracker.GetCurrentUsageAsync(userId);
        
        // If user is over new limits, apply grace period
        if (currentUsage.MonthlyRequests > newLimits.MonthlyRequestLimit)
        {
            await ApplyUsageGracePeriodAsync(userId, currentUsage, newLimits);
        }

        // Revoke access to features not available in new tier
        var revokedFeatures = oldLimits.AvailableFeatures.Except(newLimits.AvailableFeatures).ToList();
        if (revokedFeatures.Any())
        {
            await RevokeFeatureAccessAsync(userId, revokedFeatures);
        }

        // Lower priority for pending requests
        await _priorityQueue.DowngradePendingRequestsAsync(userId, newLimits.Priority);

        // Disable premium features
        await DisablePremiumFeaturesAsync(userId, revokedFeatures);
    }

    private SubscriptionAILimits GetLimitsForTier(SubscriptionTier tier)
    {
        return TierLimits.TryGetValue(tier, out var limits) ? limits : TierLimits[SubscriptionTier.Free];
    }

    private async Task<string> SelectBestModelForRequest(AIRequest request, List<string> availableModels, QualityTier qualityTier)
    {
        // Model selection logic based on request type and quality tier
        var preferredModels = qualityTier switch
        {
            QualityTier.Basic => new[] { "gpt-3.5-turbo" },
            QualityTier.Enhanced => new[] { "gpt-4", "gpt-3.5-turbo" },
            QualityTier.Premium => new[] { "gpt-4o", "claude-3-sonnet", "gpt-4" },
            QualityTier.Ultimate => new[] { "gpt-4o", "claude-3-opus", "claude-3-5-sonnet" },
            _ => new[] { "gpt-3.5-turbo" }
        };

        // Find the best available model for this request
        foreach (var preferredModel in preferredModels)
        {
            if (availableModels.Contains(preferredModel))
            {
                return preferredModel;
            }
        }

        // Fallback to first available model
        return availableModels.First();
    }
}

// Supporting data models
public class FeatureAccessResult
{
    public AIFeatureType FeatureType { get; set; }
    public bool IsAvailable { get; set; }
    public SubscriptionTier SubscriptionTier { get; set; }
    public string? RestrictionReason { get; set; }
    public FeatureLimitations? Limitations { get; set; }
    public int? RemainingUsage { get; set; }
    public UpgradeRecommendation? UpgradeRecommendation { get; set; }
}

public class UsageValidationResult
{
    public Guid UserId { get; set; }
    public bool IsAllowed { get; set; }
    public string? RestrictionReason { get; set; }
    public string? SuggestedAction { get; set; }
    public DateTime? NextAllowedTime { get; set; }
    
    // Remaining usage
    public int RemainingMonthlyRequests { get; set; }
    public int RemainingDailyRequests { get; set; }
    public int RemainingHourlyRequests { get; set; }
    public decimal EstimatedCost { get; set; }
    public PriorityLevel Priority { get; set; }
    
    public UpgradeRecommendation? UpgradeRecommendation { get; set; }
}

public class ModelSelectionResult
{
    public string SelectedModel { get; set; } = string.Empty;
    public QualityTier QualityTier { get; set; }
    public PriorityLevel Priority { get; set; }
    public ModelCapabilities? ModelCapabilities { get; set; }
    public AIParameters? EnhancedParameters { get; set; }
    public string SelectionReason { get; set; } = string.Empty;
}

public class QualityEnhancementResult
{
    public AIResponse OriginalResponse { get; set; } = new();
    public AIResponse EnhancedResponse { get; set; } = new();
    public QualityTier QualityTier { get; set; }
    public List<string> EnhancementsApplied { get; set; } = new();
    public float QualityImprovement { get; set; }
}

public class UpgradeRecommendation
{
    public SubscriptionTier RecommendedTier { get; set; }
    public string RecommendationReason { get; set; } = string.Empty;
    public List<string> BenefitsGained { get; set; } = new();
    public decimal MonthlyCost { get; set; }
    public decimal CostSavings { get; set; }
    public string UpgradeUrl { get; set; } = string.Empty;
}

public class SubscriptionBenefit
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public AIFeatureType? RelatedFeature { get; set; }
    public string Value { get; set; } = string.Empty; // e.g., "500 requests/month"
    public bool IsHighlight { get; set; }
}

public class AIUsageRequest
{
    public AIRequestType RequestType { get; set; }
    public int EstimatedTokens { get; set; }
    public AIFeatureType? FeatureType { get; set; }
    public Dictionary<string, object> Parameters { get; set; } = new();
}

public class ModelCapabilities
{
    public string ModelId { get; set; } = string.Empty;
    public int MaxTokens { get; set; }
    public bool SupportsStreaming { get; set; }
    public bool SupportsFunctionCalling { get; set; }
    public bool SupportsVision { get; set; }
    public List<string> Strengths { get; set; } = new();
    public List<string> OptimalUseCases { get; set; } = new();
}
```

This comprehensive subscription integration system provides seamless, tier-appropriate AI experiences while enforcing usage limits, managing feature access, and encouraging appropriate upgrades based on user needs and usage patterns.
