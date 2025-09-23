# Caching Strategy

## Overview
This document establishes comprehensive caching strategies for the D&D AI Campaign Management System using Redis for distributed caching, cache invalidation patterns, and performance optimization techniques.

---

## Redis Setup and Patterns

### Redis Configuration with Security
```csharp
// Redis configuration in Program.cs with security
services.AddStackExchangeRedisCache(options =>
{
    var redisConfig = builder.Configuration.GetSection("Redis").Get<RedisConfiguration>();
    options.Configuration = BuildSecureRedisConnectionString(redisConfig);
    options.InstanceName = "DnDAI";
});

// Secure Redis connection multiplexer
services.AddSingleton<IConnectionMultiplexer>(provider =>
{
    var redisConfig = builder.Configuration.GetSection("Redis").Get<RedisConfiguration>();
    var connectionString = BuildSecureRedisConnectionString(redisConfig);
    
    var configurationOptions = ConfigurationOptions.Parse(connectionString);
    configurationOptions.AbortOnConnectFail = false;
    configurationOptions.ConnectRetry = 3;
    configurationOptions.ConnectTimeout = 5000;
    configurationOptions.SyncTimeout = 5000;
    configurationOptions.AsyncTimeout = 5000;
    configurationOptions.KeepAlive = 60;
    
    // Security configurations
    configurationOptions.Ssl = redisConfig.UseSsl;
    configurationOptions.SslHost = redisConfig.SslHost;
    configurationOptions.CertificateValidation = ValidateRedisServerCertificate;
    
    return ConnectionMultiplexer.Connect(configurationOptions);
});

services.AddScoped<ICacheService, SecureRedisCacheService>();
services.AddScoped<IDistributedCacheService, DistributedCacheService>();
services.AddScoped<ICacheAnalyticsService, CacheAnalyticsService>();
services.AddScoped<IDistributedLockService, RedisDistributedLockService>();

// Redis configuration model
public class RedisConfiguration
{
    public string ConnectionString { get; set; }
    public string Password { get; set; }
    public bool UseSsl { get; set; } = true;
    public string SslHost { get; set; }
    public int Database { get; set; } = 0;
    public string ClientName { get; set; } = "DnDAI";
    public int ConnectTimeout { get; set; } = 5000;
    public int SyncTimeout { get; set; } = 5000;
    public bool AbortOnConnectFail { get; set; } = false;
    public int ConnectRetry { get; set; } = 3;
    public string CertificatePath { get; set; }
}

private static string BuildSecureRedisConnectionString(RedisConfiguration config)
{
    var builder = new StringBuilder();
    builder.Append(config.ConnectionString);
    
    if (!string.IsNullOrEmpty(config.Password))
    {
        builder.Append($",password={config.Password}");
    }
    
    builder.Append($",ssl={config.UseSsl}");
    builder.Append($",sslHost={config.SslHost}");
    builder.Append($",connectTimeout={config.ConnectTimeout}");
    builder.Append($",syncTimeout={config.SyncTimeout}");
    builder.Append($",abortConnect={config.AbortOnConnectFail}");
    builder.Append($",connectRetry={config.ConnectRetry}");
    builder.Append($",name={config.ClientName}");
    
    return builder.ToString();
}

private static bool ValidateRedisServerCertificate(object sender, X509Certificate certificate, X509Chain chain, SslPolicyErrors sslPolicyErrors)
{
    // Implement custom certificate validation logic
    // For production, validate against known certificate thumbprints
    if (sslPolicyErrors == SslPolicyErrors.None)
        return true;
    
    // Log certificate validation issues
    var logger = serviceProvider.GetService<ILogger<Program>>();
    logger?.LogWarning("Redis SSL certificate validation failed: {Errors}", sslPolicyErrors);
    
    // In production, return false for invalid certificates
    return Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") == "Development";
}
```

### Cache Service Interface
```csharp
public interface ICacheService
{
    Task<T> GetAsync<T>(string key) where T : class;
    Task<string> GetStringAsync(string key);
    Task SetAsync<T>(string key, T value, TimeSpan? expiration = null) where T : class;
    Task SetStringAsync(string key, string value, TimeSpan? expiration = null);
    Task RemoveAsync(string key);
    Task RemoveByPatternAsync(string pattern);
    Task<bool> ExistsAsync(string key);
    Task<TimeSpan?> GetExpirationAsync(string key);
    Task SetExpirationAsync(string key, TimeSpan expiration);
}

public class RedisCacheService : ICacheService
{
    private readonly IDatabase _database;
    private readonly IConnectionMultiplexer _redis;
    private readonly ILogger<RedisCacheService> _logger;
    private readonly JsonSerializerOptions _jsonOptions;

    public RedisCacheService(
        IConnectionMultiplexer redis,
        ILogger<RedisCacheService> logger)
    {
        _redis = redis;
        _database = redis.GetDatabase();
        _logger = logger;
        _jsonOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            WriteIndented = false
        };
    }

    public async Task<T> GetAsync<T>(string key) where T : class
    {
        try
        {
            var value = await _database.StringGetAsync(key);
            if (!value.HasValue)
                return null;

            return JsonSerializer.Deserialize<T>(value, _jsonOptions);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting cache value for key: {Key}", key);
            return null;
        }
    }

    public async Task<string> GetStringAsync(string key)
    {
        try
        {
            return await _database.StringGetAsync(key);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting cache string for key: {Key}", key);
            return null;
        }
    }

    public async Task SetAsync<T>(string key, T value, TimeSpan? expiration = null) where T : class
    {
        try
        {
            var serializedValue = JsonSerializer.Serialize(value, _jsonOptions);
            await _database.StringSetAsync(key, serializedValue, expiration);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error setting cache value for key: {Key}", key);
        }
    }

    public async Task SetStringAsync(string key, string value, TimeSpan? expiration = null)
    {
        try
        {
            await _database.StringSetAsync(key, value, expiration);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error setting cache string for key: {Key}", key);
        }
    }

    public async Task RemoveAsync(string key)
    {
        try
        {
            await _database.KeyDeleteAsync(key);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error removing cache key: {Key}", key);
        }
    }

    public async Task RemoveByPatternAsync(string pattern)
    {
        try
        {
            var server = _redis.GetServer(_redis.GetEndPoints().First());
            var keys = server.Keys(pattern: pattern);
            var keyArray = keys.ToArray();
            
            if (keyArray.Length > 0)
            {
                await _database.KeyDeleteAsync(keyArray);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error removing cache keys by pattern: {Pattern}", pattern);
        }
    }

    public async Task<bool> ExistsAsync(string key)
    {
        try
        {
            return await _database.KeyExistsAsync(key);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking cache key existence: {Key}", key);
            return false;
        }
    }

    public async Task<TimeSpan?> GetExpirationAsync(string key)
    {
        try
        {
            return await _database.KeyTimeToLiveAsync(key);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting cache key expiration: {Key}", key);
            return null;
        }
    }

    public async Task SetExpirationAsync(string key, TimeSpan expiration)
    {
        try
        {
            await _database.KeyExpireAsync(key, expiration);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error setting cache key expiration: {Key}", key);
        }
    }
}
```

---

## Cache Invalidation Strategies

### Cache Key Patterns
```csharp
public static class CacheKeys
{
    // User-related caches
    public const string UserProfile = "user:profile:{0}";
    public const string UserCampaigns = "user:campaigns:{0}";
    public const string UserCharacters = "user:characters:{0}";
    
    // Campaign-related caches
    public const string Campaign = "campaign:{0}";
    public const string CampaignCharacters = "campaign:characters:{0}";
    public const string CampaignSessions = "campaign:sessions:{0}";
    
    // Character-related caches
    public const string Character = "character:{0}";
    public const string CharacterStats = "character:stats:{0}";
    
    // AI-related caches
    public const string AIResponse = "ai:response:{0}";
    public const string NPCGeneration = "npc:generation:{0}";
    
    // Session data
    public const string ActiveSession = "session:active:{0}";
    public const string SessionData = "session:data:{0}";
    
    // D&D reference data
    public const string SpellList = "dnd:spells";
    public const string ClassFeatures = "dnd:class:{0}:features";
    public const string RaceTraits = "dnd:race:{0}:traits";
}
```

### Cache Invalidation Service
```csharp
public interface ICacheInvalidationService
{
    Task InvalidateUserCacheAsync(string userId);
    Task InvalidateCampaignCacheAsync(string campaignId);
    Task InvalidateCharacterCacheAsync(string characterId);
    Task InvalidatePatternAsync(string pattern);
    Task InvalidateMultipleAsync(params string[] keys);
}

public class CacheInvalidationService : ICacheInvalidationService
{
    private readonly ICacheService _cacheService;
    private readonly ILogger<CacheInvalidationService> _logger;

    public CacheInvalidationService(
        ICacheService cacheService,
        ILogger<CacheInvalidationService> logger)
    {
        _cacheService = cacheService;
        _logger = logger;
    }

    public async Task InvalidateUserCacheAsync(string userId)
    {
        _logger.LogInformation("Invalidating user cache for user: {UserId}", userId);
        
        var keysToInvalidate = new[]
        {
            string.Format(CacheKeys.UserProfile, userId),
            string.Format(CacheKeys.UserCampaigns, userId),
            string.Format(CacheKeys.UserCharacters, userId)
        };

        await InvalidateMultipleAsync(keysToInvalidate);
    }

    public async Task InvalidateCampaignCacheAsync(string campaignId)
    {
        _logger.LogInformation("Invalidating campaign cache for campaign: {CampaignId}", campaignId);
        
        var keysToInvalidate = new[]
        {
            string.Format(CacheKeys.Campaign, campaignId),
            string.Format(CacheKeys.CampaignCharacters, campaignId),
            string.Format(CacheKeys.CampaignSessions, campaignId)
        };

        await InvalidateMultipleAsync(keysToInvalidate);
        
        // Also invalidate user campaign lists for all campaign members
        await InvalidatePatternAsync($"user:campaigns:*");
    }

    public async Task InvalidateCharacterCacheAsync(string characterId)
    {
        _logger.LogInformation("Invalidating character cache for character: {CharacterId}", characterId);
        
        var keysToInvalidate = new[]
        {
            string.Format(CacheKeys.Character, characterId),
            string.Format(CacheKeys.CharacterStats, characterId)
        };

        await InvalidateMultipleAsync(keysToInvalidate);
    }

    public async Task InvalidatePatternAsync(string pattern)
    {
        try
        {
            await _cacheService.RemoveByPatternAsync(pattern);
            _logger.LogInformation("Invalidated cache pattern: {Pattern}", pattern);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error invalidating cache pattern: {Pattern}", pattern);
        }
    }

    public async Task InvalidateMultipleAsync(params string[] keys)
    {
        var tasks = keys.Select(key => _cacheService.RemoveAsync(key));
        await Task.WhenAll(tasks);
        
        _logger.LogInformation("Invalidated {Count} cache keys", keys.Length);
    }
}
```

### Event-Driven Cache Invalidation
```csharp
public class CacheInvalidationEventHandler
{
    private readonly ICacheInvalidationService _cacheInvalidation;
    private readonly ILogger<CacheInvalidationEventHandler> _logger;

    public CacheInvalidationEventHandler(
        ICacheInvalidationService cacheInvalidation,
        ILogger<CacheInvalidationEventHandler> logger)
    {
        _cacheInvalidation = cacheInvalidation;
        _logger = logger;
    }

    [EventHandler]
    public async Task Handle(CampaignUpdatedEvent @event)
    {
        await _cacheInvalidation.InvalidateCampaignCacheAsync(@event.CampaignId);
        await _cacheInvalidation.InvalidateUserCacheAsync(@event.UpdatedBy);
    }

    [EventHandler]
    public async Task Handle(CharacterUpdatedEvent @event)
    {
        await _cacheInvalidation.InvalidateCharacterCacheAsync(@event.CharacterId);
        await _cacheInvalidation.InvalidateCampaignCacheAsync(@event.CampaignId);
        await _cacheInvalidation.InvalidateUserCacheAsync(@event.PlayerId);
    }

    [EventHandler]
    public async Task Handle(UserProfileUpdatedEvent @event)
    {
        await _cacheInvalidation.InvalidateUserCacheAsync(@event.UserId);
    }
}
```

---

## Performance Optimization

### Cache-Aside Pattern
```csharp
public class CampaignService
{
    private readonly ICampaignRepository _repository;
    private readonly ICacheService _cache;
    private readonly ICacheInvalidationService _cacheInvalidation;

    public async Task<Campaign> GetCampaignAsync(string campaignId)
    {
        var cacheKey = string.Format(CacheKeys.Campaign, campaignId);
        
        // Try to get from cache first
        var cachedCampaign = await _cache.GetAsync<Campaign>(cacheKey);
        if (cachedCampaign != null)
        {
            return cachedCampaign;
        }

        // If not in cache, get from database
        var campaign = await _repository.GetByIdAsync(campaignId);
        if (campaign != null)
        {
            // Cache for 30 minutes
            await _cache.SetAsync(cacheKey, campaign, TimeSpan.FromMinutes(30));
        }

        return campaign;
    }

    public async Task<Campaign> UpdateCampaignAsync(string campaignId, UpdateCampaignRequest request)
    {
        var campaign = await _repository.UpdateCampaignAsync(campaignId, request);
        
        // Invalidate cache after update
        await _cacheInvalidation.InvalidateCampaignCacheAsync(campaignId);
        
        return campaign;
    }
}
```

### Cache Configuration Best Practices
```csharp
public class CacheConfiguration
{
    public static readonly Dictionary<string, CacheOptions> CacheSettings = new()
    {
        // User data - medium duration, high access
        ["user:*"] = new CacheOptions
        {
            Expiration = TimeSpan.FromMinutes(30),
            SlidingExpiration = TimeSpan.FromMinutes(10),
            Priority = CacheItemPriority.High
        },
        
        // Campaign data - long duration, medium access
        ["campaign:*"] = new CacheOptions
        {
            Expiration = TimeSpan.FromHours(1),
            SlidingExpiration = TimeSpan.FromMinutes(30),
            Priority = CacheItemPriority.Normal
        },
        
        // D&D reference data - very long duration, high access
        ["dnd:*"] = new CacheOptions
        {
            Expiration = TimeSpan.FromDays(1),
            SlidingExpiration = TimeSpan.FromHours(6),
            Priority = CacheItemPriority.NeverRemove
        }
    };
}
```

---

## Advanced Caching Patterns

### Write-Through Caching
```csharp
public class WriteThroughCacheService : ICacheService
{
    private readonly ICacheService _cacheService;
    private readonly IRepository _repository;
    private readonly ILogger<WriteThroughCacheService> _logger;

    public async Task<T> GetOrSetAsync<T>(string key, Func<Task<T>> factory, TimeSpan? expiration = null) where T : class
    {
        // Try cache first
        var cachedValue = await _cacheService.GetAsync<T>(key);
        if (cachedValue != null)
        {
            return cachedValue;
        }

        // Get from source and cache immediately
        var value = await factory();
        if (value != null)
        {
            await _cacheService.SetAsync(key, value, expiration);
        }

        return value;
    }

    public async Task SetWithPersistenceAsync<T>(string key, T value, TimeSpan? expiration = null) where T : class
    {
        // Write to both cache and persistent storage
        var tasks = new List<Task>
        {
            _cacheService.SetAsync(key, value, expiration),
            _repository.SaveAsync(key, value)
        };

        await Task.WhenAll(tasks);
    }
}
```

### Cache Warming Service
```csharp
public interface ICacheWarmingService
{
    Task WarmCacheAsync(CacheWarmingStrategy strategy);
    Task WarmCriticalDataAsync();
    Task WarmUserSpecificDataAsync(string userId);
    Task ScheduleWarmingAsync(string cronExpression);
}

public class CacheWarmingService : ICacheWarmingService
{
    private readonly ICacheService _cacheService;
    private readonly IRepository _repository;
    private readonly ILogger<CacheWarmingService> _logger;

    public async Task WarmCriticalDataAsync()
    {
        _logger.LogInformation("Starting critical data cache warming");

        var warmingTasks = new List<Task>
        {
            WarmDnDReferenceDataAsync(),
            WarmActiveSessionsAsync(),
            WarmPopularCampaignsAsync(),
            WarmSystemConfigurationAsync()
        };

        await Task.WhenAll(warmingTasks);
        _logger.LogInformation("Critical data cache warming completed");
    }

    private async Task WarmDnDReferenceDataAsync()
    {
        // Warm spell data
        var spells = await _repository.GetAllSpellsAsync();
        await _cacheService.SetAsync(CacheKeys.SpellList, spells, TimeSpan.FromDays(1));

        // Warm class features
        var classes = await _repository.GetAllClassesAsync();
        foreach (var dndClass in classes)
        {
            var features = await _repository.GetClassFeaturesAsync(dndClass.Id);
            var key = string.Format(CacheKeys.ClassFeatures, dndClass.Id);
            await _cacheService.SetAsync(key, features, TimeSpan.FromDays(1));
        }
    }

    private async Task WarmActiveSessionsAsync()
    {
        var activeSessions = await _repository.GetActiveSessionsAsync();
        foreach (var session in activeSessions)
        {
            var key = string.Format(CacheKeys.ActiveSession, session.Id);
            await _cacheService.SetAsync(key, session, TimeSpan.FromHours(2));
        }
    }
}
```
