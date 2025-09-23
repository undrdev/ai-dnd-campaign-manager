# Redis Advanced Features

## Overview
This document defines advanced Redis features including distributed locking, cache analytics, and performance monitoring for the D&D AI Campaign Management System.

---

## Distributed Locking Service

### Interface and Implementation
```csharp
public interface IDistributedLockService
{
    Task<IDistributedLock> AcquireLockAsync(string key, TimeSpan expiration, TimeSpan? timeout = null);
    Task<bool> TryAcquireLockAsync(string key, TimeSpan expiration, out IDistributedLock distributedLock);
    Task ReleaseLockAsync(IDistributedLock distributedLock);
}

public interface IDistributedLock : IDisposable
{
    string Key { get; }
    string Value { get; }
    DateTime AcquiredAt { get; }
    TimeSpan Expiration { get; }
    bool IsAcquired { get; }
    Task ExtendAsync(TimeSpan additionalTime);
    Task ReleaseAsync();
}

public class RedisDistributedLockService : IDistributedLockService
{
    private readonly IDatabase _database;
    private readonly ILogger<RedisDistributedLockService> _logger;
    private const string LockKeyPrefix = "lock:";

    public RedisDistributedLockService(IConnectionMultiplexer redis, ILogger<RedisDistributedLockService> logger)
    {
        _database = redis.GetDatabase();
        _logger = logger;
    }

    public async Task<IDistributedLock> AcquireLockAsync(string key, TimeSpan expiration, TimeSpan? timeout = null)
    {
        var lockKey = LockKeyPrefix + key;
        var lockValue = Guid.NewGuid().ToString();
        var timeoutTime = DateTime.UtcNow.Add(timeout ?? TimeSpan.FromSeconds(30));

        while (DateTime.UtcNow < timeoutTime)
        {
            var acquired = await _database.StringSetAsync(lockKey, lockValue, expiration, When.NotExists);
            if (acquired)
            {
                _logger.LogDebug("Acquired distributed lock: {Key}", key);
                return new RedisDistributedLock(_database, lockKey, lockValue, DateTime.UtcNow, expiration, _logger);
            }

            await Task.Delay(100); // Wait before retry
        }

        throw new TimeoutException($"Failed to acquire lock '{key}' within timeout period");
    }

    public async Task<bool> TryAcquireLockAsync(string key, TimeSpan expiration, out IDistributedLock distributedLock)
    {
        try
        {
            distributedLock = await AcquireLockAsync(key, expiration, TimeSpan.FromMilliseconds(100));
            return true;
        }
        catch (TimeoutException)
        {
            distributedLock = null;
            return false;
        }
    }

    public async Task ReleaseLockAsync(IDistributedLock distributedLock)
    {
        if (distributedLock != null)
        {
            await distributedLock.ReleaseAsync();
        }
    }
}

public class RedisDistributedLock : IDistributedLock
{
    private readonly IDatabase _database;
    private readonly ILogger _logger;
    private bool _disposed = false;

    public string Key { get; }
    public string Value { get; }
    public DateTime AcquiredAt { get; }
    public TimeSpan Expiration { get; private set; }
    public bool IsAcquired { get; private set; } = true;

    public RedisDistributedLock(IDatabase database, string key, string value, DateTime acquiredAt, TimeSpan expiration, ILogger logger)
    {
        _database = database;
        Key = key;
        Value = value;
        AcquiredAt = acquiredAt;
        Expiration = expiration;
        _logger = logger;
    }

    public async Task ExtendAsync(TimeSpan additionalTime)
    {
        if (!IsAcquired) throw new InvalidOperationException("Lock is not acquired");

        const string script = @"
            if redis.call('GET', KEYS[1]) == ARGV[1] then
                return redis.call('EXPIRE', KEYS[1], ARGV[2])
            else
                return 0
            end";

        var result = await _database.ScriptEvaluateAsync(script, 
            new RedisKey[] { Key }, 
            new RedisValue[] { Value, (int)additionalTime.TotalSeconds });
        
        if (result == 1)
        {
            Expiration = Expiration.Add(additionalTime);
            _logger.LogDebug("Extended lock: {Key} for {AdditionalTime}", Key, additionalTime);
        }
        else
        {
            IsAcquired = false;
            throw new InvalidOperationException("Failed to extend lock - lock may have been released by another process");
        }
    }

    public async Task ReleaseAsync()
    {
        if (!IsAcquired) return;

        const string script = @"
            if redis.call('GET', KEYS[1]) == ARGV[1] then
                return redis.call('DEL', KEYS[1])
            else
                return 0
            end";

        var result = await _database.ScriptEvaluateAsync(script, 
            new RedisKey[] { Key }, 
            new RedisValue[] { Value });
        
        IsAcquired = false;

        if (result == 0)
        {
            _logger.LogWarning("Failed to release lock {Key} - may have already expired", Key);
        }
        else
        {
            _logger.LogDebug("Released distributed lock: {Key}", Key);
        }
    }

    public void Dispose()
    {
        if (!_disposed)
        {
            try
            {
                ReleaseAsync().GetAwaiter().GetResult();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error releasing lock during disposal: {Key}", Key);
            }
            finally
            {
                _disposed = true;
            }
        }
    }
}
```

### Usage Examples
```csharp
public class CampaignService
{
    private readonly IDistributedLockService _lockService;
    private readonly ICampaignRepository _repository;

    public async Task<Campaign> UpdateCampaignWithLockAsync(string campaignId, UpdateCampaignRequest request)
    {
        var lockKey = $"campaign:update:{campaignId}";
        
        using var distributedLock = await _lockService.AcquireLockAsync(
            lockKey, 
            TimeSpan.FromMinutes(5), 
            TimeSpan.FromSeconds(30));

        try
        {
            // Critical section - only one process can update this campaign
            var campaign = await _repository.GetByIdAsync(campaignId);
            campaign.Update(request);
            await _repository.SaveAsync(campaign);
            
            // Extend lock if operation takes longer than expected
            if (DateTime.UtcNow - distributedLock.AcquiredAt > TimeSpan.FromMinutes(3))
            {
                await distributedLock.ExtendAsync(TimeSpan.FromMinutes(2));
            }
            
            return campaign;
        }
        catch (Exception)
        {
            // Lock will be automatically released via using statement
            throw;
        }
    }
}
```

---

## Cache Analytics Service

### Interface and Models
```csharp
public interface ICacheAnalyticsService
{
    Task RecordCacheHitAsync(string key, TimeSpan responseTime);
    Task RecordCacheMissAsync(string key, TimeSpan responseTime);
    Task RecordCacheSetAsync(string key, int sizeBytes);
    Task RecordCacheInvalidationAsync(string key, string reason);
    Task<CacheAnalytics> GetAnalyticsAsync(TimeSpan period);
    Task<List<HotKey>> GetHotKeysAsync(int limit = 100);
    Task<List<CacheEfficiencyMetric>> GetEfficiencyMetricsAsync();
    Task<CacheHealthReport> GetHealthReportAsync();
}

public class CacheAnalytics
{
    public TimeSpan Period { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public long TotalHits { get; set; }
    public long TotalMisses { get; set; }
    public double HitRatio { get; set; }
    public TimeSpan AverageHitTime { get; set; }
    public TimeSpan AverageMissTime { get; set; }
    public List<HotKey> TopKeys { get; set; }
    public long MemoryUsage { get; set; }
    public Dictionary<string, CategoryMetrics> CategoryMetrics { get; set; }
}

public class HotKey
{
    public string Key { get; set; }
    public string Category { get; set; }
    public long AccessCount { get; set; }
    public long HitCount { get; set; }
    public long MissCount { get; set; }
    public DateTime LastAccessed { get; set; }
    public double HitRatio => HitCount + MissCount > 0 ? (double)HitCount / (HitCount + MissCount) : 0;
}

public class CategoryMetrics
{
    public string Category { get; set; }
    public long Hits { get; set; }
    public long Misses { get; set; }
    public double HitRatio => Hits + Misses > 0 ? (double)Hits / (Hits + Misses) : 0;
    public TimeSpan AverageResponseTime { get; set; }
    public long MemoryUsage { get; set; }
}

public class CacheHealthReport
{
    public bool IsHealthy { get; set; }
    public double OverallHitRatio { get; set; }
    public TimeSpan AverageResponseTime { get; set; }
    public long MemoryUsageBytes { get; set; }
    public double MemoryUsagePercent { get; set; }
    public int ActiveConnections { get; set; }
    public List<string> Warnings { get; set; } = new();
    public List<string> Recommendations { get; set; } = new();
}
```

### Implementation
```csharp
public class CacheAnalyticsService : ICacheAnalyticsService
{
    private readonly IDatabase _database;
    private readonly IConnectionMultiplexer _redis;
    private readonly ILogger<CacheAnalyticsService> _logger;
    private const string AnalyticsKeyPrefix = "analytics:cache:";

    public CacheAnalyticsService(IConnectionMultiplexer redis, ILogger<CacheAnalyticsService> logger)
    {
        _redis = redis;
        _database = redis.GetDatabase();
        _logger = logger;
    }

    public async Task RecordCacheHitAsync(string key, TimeSpan responseTime)
    {
        var category = GetKeyCategory(key);
        var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
        
        var tasks = new List<Task>
        {
            IncrementCounterAsync("hits:total"),
            IncrementCounterAsync($"hits:category:{category}"),
            RecordResponseTimeAsync($"hit_times:{category}", responseTime),
            UpdateHotKeyAsync(key, "hit"),
            RecordTimestampedMetricAsync("hits", timestamp)
        };

        await Task.WhenAll(tasks);
    }

    public async Task RecordCacheMissAsync(string key, TimeSpan responseTime)
    {
        var category = GetKeyCategory(key);
        var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
        
        var tasks = new List<Task>
        {
            IncrementCounterAsync("misses:total"),
            IncrementCounterAsync($"misses:category:{category}"),
            RecordResponseTimeAsync($"miss_times:{category}", responseTime),
            UpdateHotKeyAsync(key, "miss"),
            RecordTimestampedMetricAsync("misses", timestamp)
        };

        await Task.WhenAll(tasks);
    }

    public async Task<CacheAnalytics> GetAnalyticsAsync(TimeSpan period)
    {
        var endTime = DateTime.UtcNow;
        var startTime = endTime.Subtract(period);

        var analytics = new CacheAnalytics
        {
            Period = period,
            StartTime = startTime,
            EndTime = endTime,
            TotalHits = await GetCounterValueAsync("hits:total"),
            TotalMisses = await GetCounterValueAsync("misses:total"),
            TopKeys = await GetHotKeysAsync(10),
            MemoryUsage = await GetMemoryUsageAsync(),
            CategoryMetrics = await GetCategoryMetricsAsync()
        };

        analytics.HitRatio = analytics.TotalHits + analytics.TotalMisses > 0 
            ? (double)analytics.TotalHits / (analytics.TotalHits + analytics.TotalMisses) 
            : 0;

        return analytics;
    }

    public async Task<List<HotKey>> GetHotKeysAsync(int limit = 100)
    {
        var hotKeys = new List<HotKey>();
        var categories = new[] { "user", "campaign", "character", "dnd", "ai", "session" };

        foreach (var category in categories)
        {
            var hotKeyKey = $"{AnalyticsKeyPrefix}hotkeys:{category}";
            var keyData = await _database.HashGetAllAsync(hotKeyKey);
            
            foreach (var kvp in keyData)
            {
                var keyName = kvp.Name;
                var stats = JsonSerializer.Deserialize<HotKeyStats>(kvp.Value);
                
                hotKeys.Add(new HotKey
                {
                    Key = keyName,
                    Category = category,
                    AccessCount = stats.TotalAccess,
                    HitCount = stats.Hits,
                    MissCount = stats.Misses,
                    LastAccessed = stats.LastAccessed
                });
            }
        }

        return hotKeys.OrderByDescending(h => h.AccessCount).Take(limit).ToList();
    }

    public async Task<CacheHealthReport> GetHealthReportAsync()
    {
        var analytics = await GetAnalyticsAsync(TimeSpan.FromHours(1));
        var serverInfo = await GetServerInfoAsync();
        
        var healthReport = new CacheHealthReport
        {
            OverallHitRatio = analytics.HitRatio,
            MemoryUsageBytes = analytics.MemoryUsage,
            MemoryUsagePercent = serverInfo.MemoryUsagePercent,
            ActiveConnections = serverInfo.ConnectedClients,
            AverageResponseTime = CalculateAverageResponseTime(analytics)
        };

        // Health assessment
        healthReport.IsHealthy = 
            healthReport.OverallHitRatio > 0.7 && 
            healthReport.MemoryUsagePercent < 80 && 
            healthReport.AverageResponseTime < TimeSpan.FromMilliseconds(10);

        // Generate warnings and recommendations
        if (healthReport.OverallHitRatio < 0.5)
        {
            healthReport.Warnings.Add("Low cache hit ratio detected");
            healthReport.Recommendations.Add("Review cache key patterns and expiration times");
        }

        if (healthReport.MemoryUsagePercent > 80)
        {
            healthReport.Warnings.Add("High memory usage");
            healthReport.Recommendations.Add("Consider increasing Redis memory or implementing cache eviction policies");
        }

        if (healthReport.AverageResponseTime > TimeSpan.FromMilliseconds(50))
        {
            healthReport.Warnings.Add("High cache response times");
            healthReport.Recommendations.Add("Check Redis server performance and network latency");
        }

        return healthReport;
    }

    private async Task IncrementCounterAsync(string key)
    {
        var fullKey = $"{AnalyticsKeyPrefix}{key}";
        await _database.StringIncrementAsync(fullKey);
        await _database.KeyExpireAsync(fullKey, TimeSpan.FromDays(7)); // Keep analytics for 7 days
    }

    private async Task<long> GetCounterValueAsync(string key)
    {
        var fullKey = $"{AnalyticsKeyPrefix}{key}";
        var value = await _database.StringGetAsync(fullKey);
        return value.HasValue ? (long)value : 0;
    }

    private async Task UpdateHotKeyAsync(string key, string operation)
    {
        var category = GetKeyCategory(key);
        var hotKeyKey = $"{AnalyticsKeyPrefix}hotkeys:{category}";
        
        var existingData = await _database.HashGetAsync(hotKeyKey, key);
        var stats = existingData.HasValue 
            ? JsonSerializer.Deserialize<HotKeyStats>(existingData) 
            : new HotKeyStats();

        stats.TotalAccess++;
        stats.LastAccessed = DateTime.UtcNow;
        
        if (operation == "hit")
            stats.Hits++;
        else if (operation == "miss")
            stats.Misses++;

        var serializedStats = JsonSerializer.Serialize(stats);
        await _database.HashSetAsync(hotKeyKey, key, serializedStats);
        await _database.KeyExpireAsync(hotKeyKey, TimeSpan.FromDays(1));
    }

    private string GetKeyCategory(string key)
    {
        if (key.StartsWith("user:")) return "user";
        if (key.StartsWith("campaign:")) return "campaign";
        if (key.StartsWith("character:")) return "character";
        if (key.StartsWith("dnd:")) return "dnd";
        if (key.StartsWith("ai:")) return "ai";
        if (key.StartsWith("session:")) return "session";
        return "other";
    }

    private class HotKeyStats
    {
        public long TotalAccess { get; set; }
        public long Hits { get; set; }
        public long Misses { get; set; }
        public DateTime LastAccessed { get; set; }
    }
}
```

---

## Cache Performance Optimization

### Optimization Service
```csharp
public class CacheOptimizationService
{
    private readonly ICacheService _cacheService;
    private readonly ICacheAnalyticsService _analyticsService;
    private readonly IDistributedLockService _lockService;
    private readonly ILogger<CacheOptimizationService> _logger;

    public async Task OptimizeCacheAsync()
    {
        _logger.LogInformation("Starting cache optimization");

        var lockKey = "cache:optimization";
        if (await _lockService.TryAcquireLockAsync(lockKey, TimeSpan.FromMinutes(30), out var distributedLock))
        {
            using (distributedLock)
            {
                await Task.WhenAll(
                    OptimizeHotKeysAsync(),
                    CleanupExpiredKeysAsync(),
                    OptimizeMemoryUsageAsync(),
                    AdjustExpirationTimesAsync()
                );
            }
        }
        else
        {
            _logger.LogInformation("Cache optimization already in progress, skipping");
        }

        _logger.LogInformation("Cache optimization completed");
    }

    private async Task OptimizeHotKeysAsync()
    {
        var hotKeys = await _analyticsService.GetHotKeysAsync(50);
        
        foreach (var hotKey in hotKeys.Where(k => k.AccessCount > 1000))
        {
            // Extend expiration for frequently accessed keys
            var currentExpiration = await _cacheService.GetExpirationAsync(hotKey.Key);
            if (currentExpiration.HasValue && currentExpiration.Value < TimeSpan.FromHours(2))
            {
                var newExpiration = CalculateOptimalExpiration(hotKey);
                await _cacheService.SetExpirationAsync(hotKey.Key, newExpiration);
                _logger.LogDebug("Optimized expiration for hot key: {Key} to {Expiration}", hotKey.Key, newExpiration);
            }
        }
    }

    private async Task CleanupExpiredKeysAsync()
    {
        var cleanupPatterns = new[] 
        { 
            "temp:*", 
            "session:expired:*", 
            "ai:response:old:*",
            "analytics:cache:*" // Cleanup old analytics data
        };
        
        foreach (var pattern in cleanupPatterns)
        {
            await _cacheService.RemoveByPatternAsync(pattern);
        }
    }

    private TimeSpan CalculateOptimalExpiration(HotKey hotKey)
    {
        // Dynamic expiration based on access patterns
        if (hotKey.AccessCount > 10000) return TimeSpan.FromHours(6);
        if (hotKey.AccessCount > 5000) return TimeSpan.FromHours(4);
        if (hotKey.AccessCount > 1000) return TimeSpan.FromHours(2);
        return TimeSpan.FromHours(1);
    }
}
```

This advanced Redis configuration provides enterprise-grade distributed locking, comprehensive cache analytics, and intelligent performance optimization for the D&D AI Campaign Management System.
