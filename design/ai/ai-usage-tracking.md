# AI Usage Tracking & Rate Limiting System

## Overview
This document defines the comprehensive AI usage tracking and rate limiting system that monitors AI consumption across subscription tiers, enforces usage limits, tracks costs, provides analytics, and ensures fair resource allocation while preventing abuse.

---

## Usage Tracking Architecture

### **Multi-Tier Tracking System**
```
┌─────────────────────────────────────────────────────────────────┐
│                    AI Request Initiated                        │
└─────────────────────────────────────────────────────────────────┘
                                │
                    ┌───────────────────────┐
                    │   Pre-Request         │
                    │   Validation          │
                    │ (Limits & Quotas)     │
                    └───────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
┌───────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Rate Limit  │    │  Quota Check    │    │  Cost Estimate  │
│   Validation  │    │  (Monthly/Daily)│    │  & Approval     │
└───────────────┘    └─────────────────┘    └─────────────────┘
        │                       │                       │
        └───────────────────────┼───────────────────────┘
                                │
                    ┌───────────────────────┐
                    │   AI Request          │
                    │   Processing          │
                    └───────────────────────┘
                                │
                    ┌───────────────────────┐
                    │   Post-Request        │
                    │   Usage Recording     │
                    │  (Tokens, Cost, Time) │
                    └───────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
┌───────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Real-time   │    │   Persistent    │    │   Analytics     │
│   Cache       │    │   Storage       │    │   Aggregation   │
│   (Redis)     │    │  (Database)     │    │   (Time Series) │
└───────────────┘    └─────────────────┘    └─────────────────┘
```

### **Core Usage Tracking Interface**
```csharp
public interface IUsageTracker
{
    // Pre-request validation
    Task<UsageValidationResult> ValidateUsageAsync(Guid userId, AIRequestType requestType, int estimatedTokens = 0);
    Task<RateLimitResult> CheckRateLimitAsync(Guid userId, AIRequestType requestType);
    Task<QuotaCheckResult> CheckQuotaAsync(Guid userId, QuotaPeriod period);
    
    // Usage recording
    Task RecordUsageAsync(UsageRecord record);
    Task RecordBatchUsageAsync(List<UsageRecord> records);
    Task UpdateUsageAsync(string requestId, UsageUpdate update);
    
    // Usage queries
    Task<UserUsageStats> GetUserUsageStatsAsync(Guid userId, TimeSpan period);
    Task<UsageSummary> GetUsageSummaryAsync(Guid userId, DateTime startDate, DateTime endDate);
    Task<List<UsageRecord>> GetUsageHistoryAsync(Guid userId, int limit = 100);
    Task<SystemUsageStats> GetSystemUsageStatsAsync(TimeSpan period);
    
    // Subscription integration
    Task<SubscriptionUsageStatus> GetSubscriptionUsageStatusAsync(Guid userId);
    Task UpdateSubscriptionLimitsAsync(Guid userId, SubscriptionTier newTier);
    Task<UsageProjection> ProjectUsageAsync(Guid userId, int daysAhead);
    
    // Rate limiting
    Task<RateLimitStatus> GetRateLimitStatusAsync(Guid userId);
    Task ResetRateLimitAsync(Guid userId, AIRequestType? requestType = null);
    Task<List<RateLimitViolation>> GetRateLimitViolationsAsync(Guid userId, TimeSpan period);
    
    // Analytics and reporting
    Task<UsageAnalytics> GetUsageAnalyticsAsync(UsageAnalyticsRequest request);
    Task<List<TopUser>> GetTopUsersAsync(TimeSpan period, int limit = 10);
    Task<CostAnalysis> GetCostAnalysisAsync(TimeSpan period);
}

public enum QuotaPeriod
{
    Hourly,
    Daily,
    Weekly,
    Monthly,
    Yearly
}

public enum AIRequestType
{
    GeneralText,
    NPCDialogue,
    WorldBuilding,
    CharacterCreation,
    QuestGeneration,
    ImageGeneration,
    VoiceSynthesis,
    ContextSearch,
    ContentModeration
}

public class UsageRecord
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public Guid UserId { get; set; }
    public Guid? CampaignId { get; set; }
    public string RequestId { get; set; } = string.Empty;
    
    // Request details
    public AIRequestType RequestType { get; set; }
    public string ProviderId { get; set; } = string.Empty;
    public string ModelId { get; set; } = string.Empty;
    public SubscriptionTier UserTier { get; set; }
    
    // Usage metrics
    public int PromptTokens { get; set; }
    public int CompletionTokens { get; set; }
    public int TotalTokens { get; set; }
    public decimal EstimatedCost { get; set; }
    public decimal ActualCost { get; set; }
    public TimeSpan ProcessingTime { get; set; }
    
    // Request context
    public string RequestSource { get; set; } = string.Empty; // Web, Mobile, API
    public string UserAgent { get; set; } = string.Empty;
    public string IPAddress { get; set; } = string.Empty;
    public Dictionary<string, object> RequestMetadata { get; set; } = new();
    
    // Quality and outcome
    public bool WasSuccessful { get; set; } = true;
    public string ErrorCode { get; set; } = string.Empty;
    public float? QualityScore { get; set; }
    public bool WasFiltered { get; set; }
    public List<string> AppliedFilters { get; set; } = new();
    
    // Timestamps
    public DateTime RequestedAt { get; set; }
    public DateTime CompletedAt { get; set; }
    public DateTime RecordedAt { get; set; } = DateTime.UtcNow;
}

public class UsageValidationResult
{
    public bool IsAllowed { get; set; }
    public string Reason { get; set; } = string.Empty;
    public RateLimitStatus RateLimitStatus { get; set; } = new();
    public QuotaStatus QuotaStatus { get; set; } = new();
    public decimal EstimatedCost { get; set; }
    public SubscriptionLimits CurrentLimits { get; set; } = new();
    public DateTime? NextAllowedTime { get; set; }
}

public class RateLimitStatus
{
    public bool IsWithinLimit { get; set; }
    public int CurrentCount { get; set; }
    public int Limit { get; set; }
    public TimeSpan WindowSize { get; set; }
    public DateTime WindowStart { get; set; }
    public DateTime WindowEnd { get; set; }
    public TimeSpan TimeUntilReset { get; set; }
    public Dictionary<AIRequestType, RateLimitInfo> TypeSpecificLimits { get; set; } = new();
}

public class QuotaStatus
{
    public bool IsWithinQuota { get; set; }
    public int CurrentUsage { get; set; }
    public int Quota { get; set; }
    public QuotaPeriod Period { get; set; }
    public DateTime PeriodStart { get; set; }
    public DateTime PeriodEnd { get; set; }
    public float UtilizationPercentage => Quota > 0 ? (float)CurrentUsage / Quota * 100 : 0;
}
```

### **Usage Tracker Implementation**
```csharp
public class UsageTracker : IUsageTracker
{
    private readonly IUsageRepository _repository;
    private readonly IRateLimitService _rateLimitService;
    private readonly ISubscriptionService _subscriptionService;
    private readonly ICacheService _cache;
    private readonly ILogger<UsageTracker> _logger;
    private readonly UsageTrackingConfiguration _config;
    private readonly IEventPublisher _eventPublisher;

    public async Task<UsageValidationResult> ValidateUsageAsync(Guid userId, AIRequestType requestType, int estimatedTokens = 0)
    {
        var result = new UsageValidationResult();
        
        try
        {
            // Get user's current subscription limits
            var subscription = await _subscriptionService.GetUserSubscriptionAsync(userId);
            result.CurrentLimits = GetSubscriptionLimits(subscription.Tier);
            
            // Check rate limits
            result.RateLimitStatus = await CheckRateLimitAsync(userId, requestType);
            if (!result.RateLimitStatus.IsWithinLimit)
            {
                result.IsAllowed = false;
                result.Reason = $"Rate limit exceeded. Try again in {result.RateLimitStatus.TimeUntilReset:mm\\:ss}";
                return result;
            }
            
            // Check monthly quota
            var quotaResult = await CheckQuotaAsync(userId, QuotaPeriod.Monthly);
            result.QuotaStatus = quotaResult.Status;
            if (!quotaResult.IsWithinQuota)
            {
                result.IsAllowed = false;
                result.Reason = $"Monthly quota exceeded ({quotaResult.Status.CurrentUsage}/{quotaResult.Status.Quota} requests)";
                return result;
            }
            
            // Estimate cost and check against limits
            result.EstimatedCost = await EstimateRequestCostAsync(requestType, estimatedTokens, subscription.Tier);
            var monthlySpend = await GetMonthlySpendAsync(userId);
            var spendLimit = result.CurrentLimits.MonthlySpendLimit;
            
            if (spendLimit.HasValue && (monthlySpend + result.EstimatedCost) > spendLimit.Value)
            {
                result.IsAllowed = false;
                result.Reason = $"Monthly spend limit would be exceeded (${monthlySpend + result.EstimatedCost:F2}/${spendLimit:F2})";
                return result;
            }
            
            // Check feature availability for subscription tier
            if (!IsFeatureAvailableForTier(requestType, subscription.Tier))
            {
                result.IsAllowed = false;
                result.Reason = $"Feature '{requestType}' not available for {subscription.Tier} tier";
                return result;
            }
            
            result.IsAllowed = true;
            result.Reason = "Request approved";
            
            _logger.LogDebug(
                "Usage validation completed for user {UserId}: {IsAllowed} - {Reason}",
                userId, result.IsAllowed, result.Reason);
            
            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating usage for user {UserId}", userId);
            
            // Fail-safe: deny request if validation fails
            result.IsAllowed = false;
            result.Reason = "Unable to validate usage limits";
            return result;
        }
    }

    public async Task<RateLimitResult> CheckRateLimitAsync(Guid userId, AIRequestType requestType)
    {
        var cacheKey = $"rate_limit:{userId}:{requestType}";
        var windowSize = GetRateLimitWindow(requestType);
        var limit = await GetRateLimitForUserAsync(userId, requestType);
        
        var current = await _rateLimitService.GetCurrentCountAsync(cacheKey, windowSize);
        var isWithinLimit = current < limit;
        
        var result = new RateLimitResult
        {
            IsWithinLimit = isWithinLimit,
            CurrentCount = current,
            Limit = limit,
            WindowSize = windowSize,
            RemainingRequests = Math.Max(0, limit - current)
        };
        
        if (!isWithinLimit)
        {
            // Record rate limit violation
            await RecordRateLimitViolationAsync(userId, requestType, current, limit);
            
            // Publish event for monitoring
            await _eventPublisher.PublishAsync(new RateLimitExceededEvent
            {
                UserId = userId,
                RequestType = requestType,
                CurrentCount = current,
                Limit = limit,
                Timestamp = DateTime.UtcNow
            });
        }
        
        return result;
    }

    public async Task RecordUsageAsync(UsageRecord record)
    {
        try
        {
            // Validate record
            if (!IsValidUsageRecord(record))
            {
                _logger.LogWarning("Invalid usage record received: {RecordId}", record.Id);
                return;
            }
            
            // Store in database
            await _repository.CreateUsageRecordAsync(record);
            
            // Update real-time cache counters
            await UpdateRealTimeCountersAsync(record);
            
            // Update rate limit counters
            await _rateLimitService.IncrementCountAsync(
                $"rate_limit:{record.UserId}:{record.RequestType}",
                GetRateLimitWindow(record.RequestType));
            
            // Update aggregated statistics
            await UpdateAggregatedStatsAsync(record);
            
            // Check for usage alerts
            await CheckUsageAlertsAsync(record);
            
            // Publish usage event for real-time monitoring
            await _eventPublisher.PublishAsync(new UsageRecordedEvent
            {
                UsageRecord = record,
                Timestamp = DateTime.UtcNow
            });
            
            _logger.LogDebug(
                "Usage recorded for user {UserId}: {Tokens} tokens, ${Cost:F4}",
                record.UserId, record.TotalTokens, record.ActualCost);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error recording usage for record {RecordId}", record.Id);
            
            // Store in dead letter queue for retry
            await StoreFailedRecordAsync(record, ex.Message);
        }
    }

    public async Task<UserUsageStats> GetUserUsageStatsAsync(Guid userId, TimeSpan period)
    {
        var cacheKey = $"user_stats:{userId}:{period.TotalHours}h";
        
        if (await _cache.ExistsAsync(cacheKey))
        {
            return await _cache.GetAsync<UserUsageStats>(cacheKey);
        }
        
        var startDate = DateTime.UtcNow.Subtract(period);
        var records = await _repository.GetUserUsageAsync(userId, startDate, DateTime.UtcNow);
        
        var stats = new UserUsageStats
        {
            UserId = userId,
            Period = period,
            StartDate = startDate,
            EndDate = DateTime.UtcNow,
            TotalRequests = records.Count,
            TotalTokens = records.Sum(r => r.TotalTokens),
            TotalCost = records.Sum(r => r.ActualCost),
            SuccessfulRequests = records.Count(r => r.WasSuccessful),
            FailedRequests = records.Count(r => !r.WasSuccessful),
            AverageTokensPerRequest = records.Any() ? (int)records.Average(r => r.TotalTokens) : 0,
            AverageProcessingTime = records.Any() ? 
                TimeSpan.FromMilliseconds(records.Average(r => r.ProcessingTime.TotalMilliseconds)) : 
                TimeSpan.Zero,
            RequestsByType = records.GroupBy(r => r.RequestType)
                .ToDictionary(g => g.Key, g => new RequestTypeStats
                {
                    Count = g.Count(),
                    TotalTokens = g.Sum(r => r.TotalTokens),
                    TotalCost = g.Sum(r => r.ActualCost),
                    AverageTokens = (int)g.Average(r => r.TotalTokens),
                    SuccessRate = (float)g.Count(r => r.WasSuccessful) / g.Count()
                }),
            HourlyDistribution = records.GroupBy(r => r.RequestedAt.Hour)
                .ToDictionary(g => g.Key, g => g.Count()),
            QualityMetrics = new QualityMetrics
            {
                AverageQualityScore = records.Where(r => r.QualityScore.HasValue)
                    .Average(r => r.QualityScore.Value),
                FilteredContentPercentage = (float)records.Count(r => r.WasFiltered) / records.Count * 100
            }
        };
        
        // Cache for 5 minutes
        await _cache.SetAsync(cacheKey, stats, TimeSpan.FromMinutes(5));
        
        return stats;
    }

    private async Task UpdateRealTimeCountersAsync(UsageRecord record)
    {
        var tasks = new List<Task>();
        
        // Update user counters
        tasks.Add(_cache.IncrementAsync($"user_requests:{record.UserId}:daily", 1, TimeSpan.FromDays(1)));
        tasks.Add(_cache.IncrementAsync($"user_tokens:{record.UserId}:daily", record.TotalTokens, TimeSpan.FromDays(1)));
        tasks.Add(_cache.IncrementAsync($"user_cost:{record.UserId}:daily", (long)(record.ActualCost * 10000), TimeSpan.FromDays(1)));
        
        // Update monthly counters
        tasks.Add(_cache.IncrementAsync($"user_requests:{record.UserId}:monthly", 1, TimeSpan.FromDays(30)));
        tasks.Add(_cache.IncrementAsync($"user_tokens:{record.UserId}:monthly", record.TotalTokens, TimeSpan.FromDays(30)));
        tasks.Add(_cache.IncrementAsync($"user_cost:{record.UserId}:monthly", (long)(record.ActualCost * 10000), TimeSpan.FromDays(30)));
        
        // Update system-wide counters
        tasks.Add(_cache.IncrementAsync("system_requests:daily", 1, TimeSpan.FromDays(1)));
        tasks.Add(_cache.IncrementAsync("system_tokens:daily", record.TotalTokens, TimeSpan.FromDays(1)));
        tasks.Add(_cache.IncrementAsync("system_cost:daily", (long)(record.ActualCost * 10000), TimeSpan.FromDays(1)));
        
        // Update provider-specific counters
        tasks.Add(_cache.IncrementAsync($"provider_requests:{record.ProviderId}:daily", 1, TimeSpan.FromDays(1)));
        tasks.Add(_cache.IncrementAsync($"provider_cost:{record.ProviderId}:daily", (long)(record.ActualCost * 10000), TimeSpan.FromDays(1)));
        
        await Task.WhenAll(tasks);
    }

    private async Task CheckUsageAlertsAsync(UsageRecord record)
    {
        var userId = record.UserId;
        var subscription = await _subscriptionService.GetUserSubscriptionAsync(userId);
        var limits = GetSubscriptionLimits(subscription.Tier);
        
        // Check if user is approaching monthly limit
        var monthlyUsage = await GetMonthlyUsageAsync(userId);
        var monthlyLimit = limits.MonthlyRequestLimit;
        
        if (monthlyLimit.HasValue)
        {
            var utilizationPercentage = (float)monthlyUsage.TotalRequests / monthlyLimit.Value * 100;
            
            if (utilizationPercentage >= 80 && utilizationPercentage < 90)
            {
                await _eventPublisher.PublishAsync(new UsageAlertEvent
                {
                    UserId = userId,
                    AlertType = UsageAlertType.ApproachingLimit,
                    Message = $"You've used {utilizationPercentage:F1}% of your monthly AI requests",
                    CurrentUsage = monthlyUsage.TotalRequests,
                    Limit = monthlyLimit.Value,
                    Timestamp = DateTime.UtcNow
                });
            }
            else if (utilizationPercentage >= 90)
            {
                await _eventPublisher.PublishAsync(new UsageAlertEvent
                {
                    UserId = userId,
                    AlertType = UsageAlertType.NearLimit,
                    Message = $"You've used {utilizationPercentage:F1}% of your monthly AI requests",
                    CurrentUsage = monthlyUsage.TotalRequests,
                    Limit = monthlyLimit.Value,
                    Timestamp = DateTime.UtcNow
                });
            }
        }
        
        // Check cost alerts
        var monthlyCost = monthlyUsage.TotalCost;
        var costLimit = limits.MonthlySpendLimit;
        
        if (costLimit.HasValue)
        {
            var costUtilization = (float)(monthlyCost / costLimit.Value) * 100;
            
            if (costUtilization >= 80)
            {
                await _eventPublisher.PublishAsync(new UsageAlertEvent
                {
                    UserId = userId,
                    AlertType = UsageAlertType.CostAlert,
                    Message = $"You've spent ${monthlyCost:F2} of your ${costLimit:F2} monthly budget",
                    CurrentCost = monthlyCost,
                    CostLimit = costLimit.Value,
                    Timestamp = DateTime.UtcNow
                });
            }
        }
    }

    private SubscriptionLimits GetSubscriptionLimits(SubscriptionTier tier)
    {
        return tier switch
        {
            SubscriptionTier.Free => new SubscriptionLimits
            {
                MonthlyRequestLimit = 50,
                DailyRequestLimit = 5,
                RateLimitPerMinute = 2,
                MonthlySpendLimit = 5.00m,
                AllowedRequestTypes = new[] { AIRequestType.GeneralText, AIRequestType.CharacterCreation },
                MaxTokensPerRequest = 1000,
                PriorityLevel = 1
            },
            SubscriptionTier.DungeonArchitect => new SubscriptionLimits
            {
                MonthlyRequestLimit = 500,
                DailyRequestLimit = 25,
                RateLimitPerMinute = 10,
                MonthlySpendLimit = 25.00m,
                AllowedRequestTypes = new[] { 
                    AIRequestType.GeneralText, 
                    AIRequestType.CharacterCreation,
                    AIRequestType.NPCDialogue,
                    AIRequestType.WorldBuilding
                },
                MaxTokensPerRequest = 2000,
                PriorityLevel = 2
            },
            SubscriptionTier.CampaignWeaver => new SubscriptionLimits
            {
                MonthlyRequestLimit = 2000,
                DailyRequestLimit = 100,
                RateLimitPerMinute = 30,
                MonthlySpendLimit = 100.00m,
                AllowedRequestTypes = Enum.GetValues<AIRequestType>(),
                MaxTokensPerRequest = 4000,
                PriorityLevel = 3
            },
            SubscriptionTier.GuildMaster => new SubscriptionLimits
            {
                MonthlyRequestLimit = null, // Unlimited
                DailyRequestLimit = 500,
                RateLimitPerMinute = 100,
                MonthlySpendLimit = null, // Unlimited
                AllowedRequestTypes = Enum.GetValues<AIRequestType>(),
                MaxTokensPerRequest = 8000,
                PriorityLevel = 4
            },
            _ => throw new ArgumentException($"Unknown subscription tier: {tier}")
        };
    }
}

// Usage analytics and reporting
public class UsageAnalyticsService : IUsageAnalyticsService
{
    private readonly IUsageRepository _repository;
    private readonly ITimeSeriesDatabase _timeSeriesDb;
    private readonly ILogger<UsageAnalyticsService> _logger;

    public async Task<UsageAnalytics> GetUsageAnalyticsAsync(UsageAnalyticsRequest request)
    {
        var analytics = new UsageAnalytics
        {
            Period = new DateRange(request.StartDate, request.EndDate),
            GeneratedAt = DateTime.UtcNow
        };

        // Overall metrics
        var allRecords = await _repository.GetUsageRecordsAsync(request.StartDate, request.EndDate, request.Filters);
        
        analytics.OverallMetrics = new OverallUsageMetrics
        {
            TotalRequests = allRecords.Count,
            TotalTokens = allRecords.Sum(r => r.TotalTokens),
            TotalCost = allRecords.Sum(r => r.ActualCost),
            UniqueUsers = allRecords.Select(r => r.UserId).Distinct().Count(),
            SuccessRate = allRecords.Any() ? (float)allRecords.Count(r => r.WasSuccessful) / allRecords.Count : 0,
            AverageProcessingTime = allRecords.Any() ? 
                TimeSpan.FromMilliseconds(allRecords.Average(r => r.ProcessingTime.TotalMilliseconds)) : 
                TimeSpan.Zero
        };

        // Time series data
        analytics.TimeSeriesData = await GenerateTimeSeriesDataAsync(allRecords, request.Granularity);
        
        // Request type breakdown
        analytics.RequestTypeBreakdown = allRecords.GroupBy(r => r.RequestType)
            .ToDictionary(g => g.Key, g => new RequestTypeAnalytics
            {
                RequestCount = g.Count(),
                TotalTokens = g.Sum(r => r.TotalTokens),
                TotalCost = g.Sum(r => r.ActualCost),
                AverageTokens = (int)g.Average(r => r.TotalTokens),
                SuccessRate = (float)g.Count(r => r.WasSuccessful) / g.Count(),
                AverageProcessingTime = TimeSpan.FromMilliseconds(g.Average(r => r.ProcessingTime.TotalMilliseconds))
            });

        // Provider performance
        analytics.ProviderPerformance = allRecords.GroupBy(r => r.ProviderId)
            .ToDictionary(g => g.Key, g => new ProviderAnalytics
            {
                RequestCount = g.Count(),
                TotalCost = g.Sum(r => r.ActualCost),
                AverageLatency = TimeSpan.FromMilliseconds(g.Average(r => r.ProcessingTime.TotalMilliseconds)),
                SuccessRate = (float)g.Count(r => r.WasSuccessful) / g.Count(),
                ErrorRate = (float)g.Count(r => !r.WasSuccessful) / g.Count()
            });

        // Subscription tier analysis
        analytics.SubscriptionTierAnalysis = allRecords.GroupBy(r => r.UserTier)
            .ToDictionary(g => g.Key, g => new SubscriptionTierAnalytics
            {
                UserCount = g.Select(r => r.UserId).Distinct().Count(),
                RequestCount = g.Count(),
                TotalRevenue = g.Sum(r => r.ActualCost),
                AverageRequestsPerUser = g.Count() / (float)g.Select(r => r.UserId).Distinct().Count()
            });

        return analytics;
    }

    private async Task<Dictionary<DateTime, TimeSeriesDataPoint>> GenerateTimeSeriesDataAsync(
        List<UsageRecord> records, TimeGranularity granularity)
    {
        var groupingFunction = granularity switch
        {
            TimeGranularity.Hour => (UsageRecord r) => new DateTime(r.RequestedAt.Year, r.RequestedAt.Month, r.RequestedAt.Day, r.RequestedAt.Hour, 0, 0),
            TimeGranularity.Day => (UsageRecord r) => r.RequestedAt.Date,
            TimeGranularity.Week => (UsageRecord r) => r.RequestedAt.Date.AddDays(-(int)r.RequestedAt.DayOfWeek),
            TimeGranularity.Month => (UsageRecord r) => new DateTime(r.RequestedAt.Year, r.RequestedAt.Month, 1),
            _ => throw new ArgumentException($"Unsupported granularity: {granularity}")
        };

        return records.GroupBy(groupingFunction)
            .ToDictionary(g => g.Key, g => new TimeSeriesDataPoint
            {
                Timestamp = g.Key,
                RequestCount = g.Count(),
                TokenCount = g.Sum(r => r.TotalTokens),
                Cost = g.Sum(r => r.ActualCost),
                UniqueUsers = g.Select(r => r.UserId).Distinct().Count(),
                SuccessRate = (float)g.Count(r => r.WasSuccessful) / g.Count(),
                AverageLatency = TimeSpan.FromMilliseconds(g.Average(r => r.ProcessingTime.TotalMilliseconds))
            });
    }
}
```

This comprehensive usage tracking system provides detailed monitoring, rate limiting, quota management, and analytics while integrating seamlessly with the subscription system to enforce tier-based limits and provide valuable insights for both users and administrators.
