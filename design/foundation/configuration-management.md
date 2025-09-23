# Configuration Management

## Overview
This document establishes comprehensive configuration management standards for the D&D AI Campaign Management System, including environment-specific settings, secret management, and feature flags implementation.

---

## Environment-specific Settings

### Configuration Structure
```csharp
// Base configuration model
public class AppSettings
{
    public DatabaseSettings Database { get; set; } = new();
    public RedisSettings Redis { get; set; } = new();
    public JwtSettings Jwt { get; set; } = new();
    public ExternalApiSettings ExternalApis { get; set; } = new();
    public FeatureFlagSettings FeatureFlags { get; set; } = new();
    public LoggingSettings Logging { get; set; } = new();
}

public class DatabaseSettings
{
    public string ConnectionString { get; set; }
    public int CommandTimeout { get; set; } = 30;
    public bool EnableSensitiveDataLogging { get; set; } = false;
    public int MaxRetryCount { get; set; } = 3;
}

public class ExternalApiSettings
{
    public OpenAISettings OpenAI { get; set; } = new();
    public AnthropicSettings Anthropic { get; set; } = new();
}

public class OpenAISettings
{
    public string ApiKey { get; set; }
    public string BaseUrl { get; set; } = "https://api.openai.com/v1";
    public string DefaultModel { get; set; } = "gpt-4";
    public int MaxTokens { get; set; } = 4000;
    public double Temperature { get; set; } = 0.7;
}
```

### Environment Configuration Files
```json
// appsettings.json (Base configuration)
{
  "Database": {
    "CommandTimeout": 30,
    "MaxRetryCount": 3
  },
  "Jwt": {
    "Issuer": "https://api.dndai.com",
    "Audience": "https://app.dndai.com",
    "AccessTokenExpirationMinutes": 15,
    "RefreshTokenExpirationDays": 7
  },
  "ExternalApis": {
    "OpenAI": {
      "BaseUrl": "https://api.openai.com/v1",
      "DefaultModel": "gpt-4",
      "MaxTokens": 4000,
      "Temperature": 0.7
    }
  },
  "FeatureFlags": {
    "EnableAdvancedAI": false,
    "EnableRealTimeChat": true,
    "MaxCampaignsPerUser": 5
  }
}

// appsettings.Development.json
{
  "Database": {
    "ConnectionString": "Host=localhost;Database=dndai_dev;Username=dev_user;Password=dev_pass",
    "EnableSensitiveDataLogging": true
  },
  "Logging": {
    "LogLevel": {
      "Default": "Debug",
      "DnDAI": "Trace"
    }
  }
}

// appsettings.Production.json
{
  "Database": {
    "CommandTimeout": 60,
    "MaxRetryCount": 5
  },
  "Logging": {
    "LogLevel": {
      "Default": "Warning",
      "DnDAI": "Information"
    }
  },
  "FeatureFlags": {
    "EnableAdvancedAI": true,
    "MaxCampaignsPerUser": 10
  }
}
```

### Configuration Registration
```csharp
// Program.cs
public static void Main(string[] args)
{
    var builder = WebApplication.CreateBuilder(args);
    
    // Configure configuration sources
    builder.Configuration
        .SetBasePath(Directory.GetCurrentDirectory())
        .AddJsonFile("appsettings.json", optional: false, reloadOnChange: true)
        .AddJsonFile($"appsettings.{builder.Environment.EnvironmentName}.json", 
            optional: true, reloadOnChange: true)
        .AddEnvironmentVariables()
        .AddUserSecrets<Program>(optional: true)
        .AddCommandLine(args);

    // Register configuration sections
    builder.Services.Configure<AppSettings>(builder.Configuration);
    builder.Services.Configure<DatabaseSettings>(builder.Configuration.GetSection("Database"));
    builder.Services.Configure<JwtSettings>(builder.Configuration.GetSection("Jwt"));
    builder.Services.Configure<ExternalApiSettings>(builder.Configuration.GetSection("ExternalApis"));

    // Validate configuration on startup
    builder.Services.AddSingleton<IValidateOptions<DatabaseSettings>, DatabaseSettingsValidator>();
    builder.Services.AddSingleton<IValidateOptions<JwtSettings>, JwtSettingsValidator>();

    var app = builder.Build();
    app.Run();
}
```

### Configuration Validation
```csharp
public class DatabaseSettingsValidator : IValidateOptions<DatabaseSettings>
{
    public ValidateOptionsResult Validate(string name, DatabaseSettings options)
    {
        var failures = new List<string>();

        if (string.IsNullOrEmpty(options.ConnectionString))
        {
            failures.Add("Database connection string is required");
        }

        if (options.CommandTimeout <= 0)
        {
            failures.Add("Command timeout must be greater than 0");
        }

        return failures.Count > 0
            ? ValidateOptionsResult.Fail(failures)
            : ValidateOptionsResult.Success;
    }
}
```

---

## Secret Management (API Keys, Connection Strings)

### Azure Key Vault Integration
```csharp
// Azure Key Vault configuration
public static class KeyVaultExtensions
{
    public static IConfigurationBuilder AddAzureKeyVault(
        this IConfigurationBuilder builder,
        IConfiguration configuration)
    {
        var keyVaultUrl = configuration["KeyVault:Url"];
        if (!string.IsNullOrEmpty(keyVaultUrl))
        {
            var credential = new DefaultAzureCredential();
            builder.AddAzureKeyVault(new Uri(keyVaultUrl), credential);
        }
        
        return builder;
    }
}
```

### User Secrets (Development)
```bash
# Initialize user secrets
dotnet user-secrets init

# Set secrets
dotnet user-secrets set "Database:ConnectionString" "Host=localhost;Database=dndai_dev;Username=dev_user;Password=dev_password"
dotnet user-secrets set "ExternalApis:OpenAI:ApiKey" "sk-development-api-key"
dotnet user-secrets set "Jwt:SecretKey" "your-super-secret-jwt-key-here-32-chars-minimum"
```

### Environment Variables
```bash
# Production environment variables
export DNDAI_DATABASE_CONNECTIONSTRING="Host=prod-db;Database=dndai_prod;Username=prod_user;Password=prod_password"
export DNDAI_JWT_SECRETKEY="production-jwt-secret-key-very-secure"
export DNDAI_OPENAI_APIKEY="sk-production-openai-key"
```

---

## Feature Flags Setup

### Feature Flag Configuration
```csharp
public class FeatureFlagSettings
{
    public bool EnableAdvancedAI { get; set; } = false;
    public bool EnableRealTimeChat { get; set; } = true;
    public bool EnableFileUploads { get; set; } = true;
    public bool EnableBetaFeatures { get; set; } = false;
    public int MaxCampaignsPerUser { get; set; } = 5;
    public int MaxCharactersPerCampaign { get; set; } = 8;
    public Dictionary<string, object> DynamicFlags { get; set; } = new();
}

public interface IFeatureFlagService
{
    bool IsEnabled(string flagName);
    bool IsEnabled(string flagName, string userId);
    T GetValue<T>(string flagName, T defaultValue = default);
    Task<bool> IsEnabledAsync(string flagName);
    Task<bool> IsEnabledAsync(string flagName, string userId);
}

public class FeatureFlagService : IFeatureFlagService
{
    private readonly IOptionsMonitor<FeatureFlagSettings> _options;
    private readonly IDistributedCache _cache;
    private readonly ILogger<FeatureFlagService> _logger;

    public FeatureFlagService(
        IOptionsMonitor<FeatureFlagSettings> options,
        IDistributedCache cache,
        ILogger<FeatureFlagService> logger)
    {
        _options = options;
        _cache = cache;
        _logger = logger;
    }

    public bool IsEnabled(string flagName)
    {
        return IsEnabledAsync(flagName).GetAwaiter().GetResult();
    }

    public async Task<bool> IsEnabledAsync(string flagName)
    {
        try
        {
            // First check cache
            var cacheKey = $"feature_flag:{flagName}";
            var cachedValue = await _cache.GetStringAsync(cacheKey);
            
            if (!string.IsNullOrEmpty(cachedValue))
            {
                return bool.Parse(cachedValue);
            }

            // Check configuration
            var settings = _options.CurrentValue;
            var isEnabled = GetFlagFromSettings(settings, flagName);

            // Cache for 5 minutes
            await _cache.SetStringAsync(cacheKey, isEnabled.ToString(), 
                new DistributedCacheEntryOptions
                {
                    AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(5)
                });

            return isEnabled;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking feature flag {FlagName}", flagName);
            return false; // Fail closed
        }
    }

    private bool GetFlagFromSettings(FeatureFlagSettings settings, string flagName)
    {
        // Use reflection to get property value
        var property = typeof(FeatureFlagSettings).GetProperty(flagName);
        if (property != null && property.PropertyType == typeof(bool))
        {
            return (bool)property.GetValue(settings);
        }

        // Check dynamic flags
        if (settings.DynamicFlags.TryGetValue(flagName, out var value) && value is bool boolValue)
        {
            return boolValue;
        }

        return false;
    }
}
```

### Feature Flag Attributes
```csharp
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
public class FeatureFlagAttribute : Attribute, IAuthorizationRequirement
{
    public string FlagName { get; }
    public bool RequireEnabled { get; }

    public FeatureFlagAttribute(string flagName, bool requireEnabled = true)
    {
        FlagName = flagName;
        RequireEnabled = requireEnabled;
    }
}

public class FeatureFlagAuthorizationHandler : AuthorizationHandler<FeatureFlagAttribute>
{
    private readonly IFeatureFlagService _featureFlagService;

    public FeatureFlagAuthorizationHandler(IFeatureFlagService featureFlagService)
    {
        _featureFlagService = featureFlagService;
    }

    protected override async Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        FeatureFlagAttribute requirement)
    {
        var userId = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        
        bool isEnabled;
        if (!string.IsNullOrEmpty(userId))
        {
            isEnabled = await _featureFlagService.IsEnabledAsync(requirement.FlagName, userId);
        }
        else
        {
            isEnabled = await _featureFlagService.IsEnabledAsync(requirement.FlagName);
        }

        if (isEnabled == requirement.RequireEnabled)
        {
            context.Succeed(requirement);
        }
    }
}

// Usage in controllers
[HttpPost("advanced-generation")]
[FeatureFlag("EnableAdvancedAI")]
public async Task<IActionResult> GenerateAdvancedContent([FromBody] AdvancedGenerationRequest request)
{
    // This endpoint is only available when EnableAdvancedAI flag is true
    return Ok();
}
```

This comprehensive configuration management setup provides robust, secure, and flexible configuration handling for the D&D AI Campaign Management System.
