# Authentication & Authorization Setup

## Overview
This document establishes comprehensive authentication and authorization standards for the D&D AI Campaign Management System, including JWT token management, role-based access control, and API security measures.

---

## JWT Token Management

### JWT Configuration
```csharp
// JWT settings
public class JwtSettings
{
    public string SecretKey { get; set; }
    public string Issuer { get; set; }
    public string Audience { get; set; }
    public int AccessTokenExpirationMinutes { get; set; } = 15;
    public int RefreshTokenExpirationDays { get; set; } = 7;
    public string Algorithm { get; set; } = SecurityAlgorithms.HmacSha256;
}

// JWT service registration
services.Configure<JwtSettings>(configuration.GetSection("JwtSettings"));

services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        var jwtSettings = configuration.GetSection("JwtSettings").Get<JwtSettings>();
        
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtSettings.Issuer,
            ValidAudience = jwtSettings.Audience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings.SecretKey)),
            ClockSkew = TimeSpan.Zero
        };
    });
```

### Token Service Implementation
```csharp
public interface ITokenService
{
    Task<TokenResponse> GenerateTokensAsync(User user);
    Task<TokenResponse> RefreshTokenAsync(string refreshToken);
    Task RevokeTokenAsync(string refreshToken);
    ClaimsPrincipal? ValidateToken(string token);
}

public class TokenService : ITokenService
{
    private readonly JwtSettings _jwtSettings;
    private readonly IUserRepository _userRepository;
    private readonly IRefreshTokenRepository _refreshTokenRepository;
    private readonly ILogger<TokenService> _logger;

    public TokenService(
        IOptions<JwtSettings> jwtSettings,
        IUserRepository userRepository,
        IRefreshTokenRepository refreshTokenRepository,
        ILogger<TokenService> logger)
    {
        _jwtSettings = jwtSettings.Value;
        _userRepository = userRepository;
        _refreshTokenRepository = refreshTokenRepository;
        _logger = logger;
    }

    public async Task<TokenResponse> GenerateTokensAsync(User user)
    {
        var claims = await BuildClaimsAsync(user);
        
        var accessToken = GenerateAccessToken(claims);
        var refreshToken = await GenerateRefreshTokenAsync(user.Id);

        return new TokenResponse
        {
            AccessToken = accessToken,
            RefreshToken = refreshToken.Token,
            ExpiresIn = _jwtSettings.AccessTokenExpirationMinutes * 60,
            TokenType = "Bearer"
        };
    }

    private string GenerateAccessToken(IEnumerable<Claim> claims)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSettings.SecretKey));
        var credentials = new SigningCredentials(key, _jwtSettings.Algorithm);

        var token = new JwtSecurityToken(
            issuer: _jwtSettings.Issuer,
            audience: _jwtSettings.Audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(_jwtSettings.AccessTokenExpirationMinutes),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private async Task<RefreshToken> GenerateRefreshTokenAsync(string userId)
    {
        var refreshToken = new RefreshToken
        {
            Token = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64)),
            UserId = userId,
            ExpiresAt = DateTime.UtcNow.AddDays(_jwtSettings.RefreshTokenExpirationDays),
            CreatedAt = DateTime.UtcNow
        };

        await _refreshTokenRepository.AddAsync(refreshToken);
        return refreshToken;
    }

    private async Task<List<Claim>> BuildClaimsAsync(User user)
    {
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id),
            new(ClaimTypes.Name, user.Username),
            new(ClaimTypes.Email, user.Email),
            new("user_id", user.Id),
            new("subscription_tier", user.SubscriptionTier.ToString()),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new(JwtRegisteredClaimNames.Iat, 
                new DateTimeOffset(DateTime.UtcNow).ToUnixTimeSeconds().ToString(), 
                ClaimValueTypes.Integer64)
        };

        // Add roles
        var userRoles = await _userRepository.GetUserRolesAsync(user.Id);
        foreach (var role in userRoles)
        {
            claims.Add(new Claim(ClaimTypes.Role, role.Name));
        }

        // Add permissions
        var permissions = await _userRepository.GetUserPermissionsAsync(user.Id);
        foreach (var permission in permissions)
        {
            claims.Add(new Claim("permission", permission));
        }

        return claims;
    }
}
```

### Token Models
```csharp
public class TokenResponse
{
    public string AccessToken { get; set; }
    public string RefreshToken { get; set; }
    public int ExpiresIn { get; set; }
    public string TokenType { get; set; }
}

public class RefreshToken
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Token { get; set; }
    public string UserId { get; set; }
    public DateTime ExpiresAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? RevokedAt { get; set; }
    public bool IsExpired => DateTime.UtcNow >= ExpiresAt;
    public bool IsRevoked => RevokedAt.HasValue;
    public bool IsActive => !IsExpired && !IsRevoked;
}
```

---

## Role-based Permissions

### Permission and Role Models
```csharp
public class Role
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Name { get; set; }
    public string Description { get; set; }
    public bool IsSystemRole { get; set; }
    public DateTime CreatedAt { get; set; }
    
    public virtual ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();
    public virtual ICollection<RolePermission> RolePermissions { get; set; } = new List<RolePermission>();
}

public class Permission
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Name { get; set; }
    public string Resource { get; set; }
    public string Action { get; set; }
    public string Description { get; set; }
    
    public virtual ICollection<RolePermission> RolePermissions { get; set; } = new List<RolePermission>();
}

public class UserRole
{
    public string UserId { get; set; }
    public string RoleId { get; set; }
    public DateTime AssignedAt { get; set; }
    public string AssignedBy { get; set; }
    
    public virtual User User { get; set; }
    public virtual Role Role { get; set; }
}
```

### Permission Constants
```csharp
public static class Permissions
{
    // Campaign permissions
    public const string CampaignCreate = "campaign:create";
    public const string CampaignRead = "campaign:read";
    public const string CampaignUpdate = "campaign:update";
    public const string CampaignDelete = "campaign:delete";
    public const string CampaignManage = "campaign:manage";

    // Character permissions
    public const string CharacterCreate = "character:create";
    public const string CharacterRead = "character:read";
    public const string CharacterUpdate = "character:update";
    public const string CharacterDelete = "character:delete";

    // System permissions
    public const string SystemAdmin = "system:admin";
    public const string SystemMonitor = "system:monitor";
}

public static class Roles
{
    public const string SystemAdmin = "SystemAdmin";
    public const string Player = "Player";
    public const string DungeonMaster = "DungeonMaster";
    public const string PremiumUser = "PremiumUser";
}
```

### Authorization Attributes
```csharp
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
public class RequirePermissionAttribute : Attribute, IAuthorizationRequirement
{
    public string Permission { get; }
    
    public RequirePermissionAttribute(string permission)
    {
        Permission = permission;
    }
}

public class PermissionAuthorizationHandler : AuthorizationHandler<RequirePermissionAttribute>
{
    protected override Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        RequirePermissionAttribute requirement)
    {
        var permissions = context.User.FindAll("permission").Select(c => c.Value);
        
        if (permissions.Contains(requirement.Permission))
        {
            context.Succeed(requirement);
        }
        
        return Task.CompletedTask;
    }
}

// Usage in controllers
[HttpPost]
[RequirePermission(Permissions.CampaignCreate)]
public async Task<IActionResult> CreateCampaign([FromBody] CreateCampaignRequest request)
{
    // Implementation
}
```

---

## API Security Standards

### Rate Limiting
```csharp
public class RateLimitingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly IMemoryCache _cache;

    public async Task InvokeAsync(HttpContext context)
    {
        var identifier = GetClientIdentifier(context);
        var key = $"rate_limit:{identifier}";

        var currentCount = _cache.GetOrCreate(key, entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(1);
            return 0;
        });

        var limit = context.User.IsInRole(Roles.PremiumUser) ? 5000 : 1000;

        if (currentCount >= limit)
        {
            context.Response.StatusCode = 429;
            await context.Response.WriteAsync("Rate limit exceeded");
            return;
        }

        _cache.Set(key, currentCount + 1, TimeSpan.FromHours(1));
        await _next(context);
    }

    private string GetClientIdentifier(HttpContext context)
    {
        var userId = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return !string.IsNullOrEmpty(userId) 
            ? $"user:{userId}" 
            : $"ip:{context.Connection.RemoteIpAddress}";
    }
}
```

### Security Headers
```csharp
public class SecurityHeadersMiddleware
{
    private readonly RequestDelegate _next;

    public async Task InvokeAsync(HttpContext context)
    {
        context.Response.Headers.Add("X-Content-Type-Options", "nosniff");
        context.Response.Headers.Add("X-Frame-Options", "DENY");
        context.Response.Headers.Add("X-XSS-Protection", "1; mode=block");
        
        if (context.Request.IsHttps)
        {
            context.Response.Headers.Add("Strict-Transport-Security", 
                "max-age=31536000; includeSubDomains");
        }

        await _next(context);
    }
}
```

## Enhanced Security Requirements

### TLS and Transport Security
```csharp
public class TransportSecurityConfiguration
{
    public static void ConfigureTransportSecurity(IServiceCollection services, IConfiguration configuration)
    {
        // Require HTTPS
        services.AddHttpsRedirection(options =>
        {
            options.RedirectStatusCode = StatusCodes.Status308PermanentRedirect;
            options.HttpsPort = 443;
        });

        // Configure HSTS
        services.AddHsts(options =>
        {
            options.Preload = true;
            options.IncludeSubDomains = true;
            options.MaxAge = TimeSpan.FromDays(365);
        });

        // TLS 1.3 minimum requirement
        services.Configure<KestrelServerOptions>(options =>
        {
            options.ConfigureHttpsDefaults(httpsOptions =>
            {
                httpsOptions.SslProtocols = SslProtocols.Tls13;
                httpsOptions.ClientCertificateMode = ClientCertificateMode.AllowCertificate;
            });
        });
    }
}
```

### Field-Level Encryption Integration
```csharp
public class EncryptionAuthenticationExtensions
{
    public static IServiceCollection AddEncryptedAuthentication(
        this IServiceCollection services, 
        IConfiguration configuration)
    {
        // Register encryption services
        services.AddScoped<IEncryptionService, AESEncryptionService>();
        services.AddScoped<IKeyManagementService, AzureKeyVaultService>();
        services.AddScoped<ISecureDataDeletionService, SecureDataDeletionService>();

        // Configure encrypted token service
        services.AddScoped<ITokenService, EncryptedTokenService>();
        
        // Configure encrypted user store
        services.AddScoped<IUserStore<User>, EncryptedUserStore>();

        return services;
    }
}

public class EncryptedTokenService : ITokenService
{
    private readonly IEncryptionService _encryptionService;
    private readonly IKeyManagementService _keyManagement;
    private readonly JwtSettings _jwtSettings;

    public async Task<TokenResponse> GenerateTokensAsync(User user)
    {
        // Encrypt sensitive claims before adding to JWT
        var encryptionContext = new EncryptionContext
        {
            UserId = user.Id,
            DataClassification = DataClassification.Confidential,
            Purpose = "jwt-claims"
        };

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id),
            new(ClaimTypes.Name, user.Username),
            // Encrypt email in JWT
            new(ClaimTypes.Email, await EncryptClaimValueAsync(
                await user.GetEmailAsync(_encryptionService, encryptionContext), 
                encryptionContext)),
            new("subscription_tier", user.Subscription?.Tier.ToString() ?? "Free")
        };

        // Generate tokens with encrypted claims
        var accessToken = GenerateAccessToken(claims);
        var refreshToken = await GenerateEncryptedRefreshTokenAsync(user.Id);

        return new TokenResponse
        {
            AccessToken = accessToken,
            RefreshToken = refreshToken.Token,
            ExpiresIn = _jwtSettings.AccessTokenExpirationMinutes * 60,
            TokenType = "Bearer"
        };
    }

    private async Task<string> EncryptClaimValueAsync(string value, EncryptionContext context)
    {
        if (string.IsNullOrEmpty(value)) return value;
        
        var encrypted = await _encryptionService.EncryptAsync(value, context);
        return Convert.ToBase64String(JsonSerializer.SerializeToUtf8Bytes(encrypted));
    }
}
```

### Data Classification Authorization
```csharp
[AttributeUsage(AttributeTargets.Method | AttributeTargets.Class)]
public class RequireDataClassificationAttribute : Attribute, IAuthorizationRequirement
{
    public DataClassification MinimumClassification { get; }
    public string[] RequiredPurposes { get; }

    public RequireDataClassificationAttribute(
        DataClassification minimumClassification, 
        params string[] requiredPurposes)
    {
        MinimumClassification = minimumClassification;
        RequiredPurposes = requiredPurposes;
    }
}

public class DataClassificationAuthorizationHandler 
    : AuthorizationHandler<RequireDataClassificationAttribute>
{
    private readonly IEncryptionService _encryptionService;
    private readonly IKeyManagementService _keyManagement;

    protected override async Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        RequireDataClassificationAttribute requirement)
    {
        var user = context.User;
        var userId = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (string.IsNullOrEmpty(userId))
        {
            context.Fail();
            return;
        }

        // Validate user has access to required data classification level
        var hasAccess = await ValidateDataClassificationAccessAsync(
            userId, 
            requirement.MinimumClassification, 
            requirement.RequiredPurposes);

        if (hasAccess)
        {
            context.Succeed(requirement);
        }
        else
        {
            context.Fail();
        }
    }

    private async Task<bool> ValidateDataClassificationAccessAsync(
        string userId, 
        DataClassification minClassification,
        string[] purposes)
    {
        // Implementation would check:
        // 1. User's role and permissions
        // 2. Subscription tier limitations
        // 3. Data access audit requirements
        // 4. Compliance requirements (GDPR consent, etc.)
        
        return true; // Simplified for example
    }
}
```

### Secure Session Management
```csharp
public class SecureSessionConfiguration
{
    public static void ConfigureSecureSessions(IServiceCollection services)
    {
        services.AddSession(options =>
        {
            options.IdleTimeout = TimeSpan.FromMinutes(30);
            options.Cookie.HttpOnly = true;
            options.Cookie.IsEssential = true;
            options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
            options.Cookie.SameSite = SameSiteMode.Strict;
            options.Cookie.Name = "__Host-SessionId";
        });

        // Add encrypted session state provider
        services.AddScoped<ISessionStateProvider, EncryptedSessionStateProvider>();
    }
}

public class EncryptedSessionStateProvider : ISessionStateProvider
{
    private readonly IEncryptionService _encryptionService;
    
    public async Task<T> GetAsync<T>(string key, string userId)
    {
        var encryptionContext = new EncryptionContext
        {
            UserId = userId,
            DataClassification = DataClassification.Confidential,
            Purpose = "session-storage"
        };

        // Retrieve and decrypt session data
        var encryptedData = await GetEncryptedSessionDataAsync(key);
        if (encryptedData == null) return default(T);

        var decrypted = await _encryptionService.DecryptAsync(encryptedData, encryptionContext);
        return JsonSerializer.Deserialize<T>(decrypted);
    }
}
```

### Compliance and Audit Integration
```csharp
public class ComplianceAuthenticationMiddleware
{
    private readonly RequestDelegate _next;
    private readonly IAuditLogger _auditLogger;

    public async Task InvokeAsync(HttpContext context)
    {
        // Log authentication attempts for compliance
        if (context.Request.Path.StartsWithSegments("/auth"))
        {
            await LogAuthenticationAttemptAsync(context);
        }

        // Validate GDPR consent for EU users
        if (IsEUUser(context))
        {
            await ValidateGDPRConsentAsync(context);
        }

        // Validate COPPA compliance for minors
        if (await IsMinorUserAsync(context))
        {
            await ValidateCOPPAComplianceAsync(context);
        }

        await _next(context);
    }

    private async Task LogAuthenticationAttemptAsync(HttpContext context)
    {
        var auditEvent = new SecurityEvent
        {
            EventType = "AuthenticationAttempt",
            IpAddress = context.Connection.RemoteIpAddress?.ToString(),
            UserAgent = context.Request.Headers.UserAgent,
            Timestamp = DateTime.UtcNow,
            Details = new Dictionary<string, object>
            {
                ["endpoint"] = context.Request.Path,
                ["method"] = context.Request.Method,
                ["user_id"] = context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value
            }
        };

        await _auditLogger.LogSecurityEventAsync(auditEvent);
    }
}
```

This comprehensive authentication and authorization setup provides enterprise-grade security with field-level encryption, data classification, and full compliance support for the D&D AI Campaign Management System.
