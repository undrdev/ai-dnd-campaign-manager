# Dependency Injection Setup

## Overview
This document defines dependency injection patterns, service registration strategies, and configuration management for the D&D AI Campaign Management System using the built-in .NET DI container and service lifetime management.

---

## DI Architecture Overview

### Service Layer Structure
```
Application Services
├── Controllers (Scoped)
├── Business Services (Scoped)
├── Domain Services (Scoped)
├── Repositories (Scoped)
├── Infrastructure Services
│   ├── Caching (Singleton)
│   ├── Messaging (Singleton)
│   └── External APIs (Singleton)
└── Configuration (Singleton)
```

### Service Lifetimes Strategy
- **Transient**: Created each time requested (validators, mappers, lightweight services)
- **Scoped**: Created once per HTTP request (controllers, business services, repositories)
- **Singleton**: Created once for application lifetime (caches, configuration, expensive resources)

---

## Core DI Configuration

### Program.cs Setup
```csharp
// src/Services/CampaignService/CampaignService.API/Program.cs
using CampaignService.API.Configuration;
using CampaignService.Core;
using CampaignService.Infrastructure;
using Common.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

// Configure services
builder.Services.ConfigureCoreServices(builder.Configuration);
builder.Services.ConfigureInfrastructureServices(builder.Configuration);
builder.Services.ConfigureApplicationServices(builder.Configuration);

var app = builder.Build();

// Configure middleware pipeline
app.ConfigureMiddleware();

// Ensure database is created and migrated
using (var scope = app.Services.CreateScope())
{
    await scope.ServiceProvider.EnsureDatabaseAsync();
}

app.Run();
```

### Service Registration Extensions

#### Core Services Registration
```csharp
// src/Services/CampaignService/CampaignService.Core/ServiceCollectionExtensions.cs
using CampaignService.Core.Interfaces;
using CampaignService.Core.Services;
using CampaignService.Core.Validators;
using FluentValidation;
using Microsoft.Extensions.DependencyInjection;

namespace CampaignService.Core
{
    public static class ServiceCollectionExtensions
    {
        public static IServiceCollection ConfigureCoreServices(
            this IServiceCollection services, 
            IConfiguration configuration)
        {
            // Business Services - Scoped (per request)
            services.AddScoped<ICampaignService, Services.CampaignService>();
            services.AddScoped<ICampaignValidationService, CampaignValidationService>();
            services.AddScoped<ICampaignPermissionService, CampaignPermissionService>();
            services.AddScoped<ICampaignQueryService, CampaignQueryService>();
            
            // Domain Services - Scoped
            services.AddScoped<ICampaignDomainService, CampaignDomainService>();
            services.AddScoped<IPlayerInvitationService, PlayerInvitationService>();
            services.AddScoped<ICampaignEventService, CampaignEventService>();
            
            // Validators - Transient (lightweight, stateless)
            services.AddTransient<IValidator<CreateCampaignRequest>, CreateCampaignValidator>();
            services.AddTransient<IValidator<UpdateCampaignRequest>, UpdateCampaignValidator>();
            services.AddTransient<IValidator<InvitePlayerRequest>, InvitePlayerValidator>();
            
            // AutoMapper - Singleton (expensive to create, thread-safe)
            services.AddAutoMapper(typeof(CampaignMappingProfile));
            
            // FluentValidation
            services.AddValidatorsFromAssemblyContaining<CreateCampaignValidator>();
            
            // MediatR for CQRS pattern
            services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(typeof(ServiceCollectionExtensions).Assembly));
            
            return services;
        }
    }
}
```

#### Infrastructure Services Registration
```csharp
// src/Services/CampaignService/CampaignService.Infrastructure/ServiceCollectionExtensions.cs
using CampaignService.Core.Interfaces;
using CampaignService.Infrastructure.Data;
using CampaignService.Infrastructure.Repositories;
using CampaignService.Infrastructure.Services;
using Common.Infrastructure.Caching;
using Common.Infrastructure.Messaging;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace CampaignService.Infrastructure
{
    public static class ServiceCollectionExtensions
    {
        public static IServiceCollection ConfigureInfrastructureServices(
            this IServiceCollection services, 
            IConfiguration configuration)
        {
            // Database Context - Scoped (per request)
            services.AddDbContext<CampaignDbContext>(options =>
            {
                options.UseNpgsql(configuration.GetConnectionString("DefaultConnection"), npgsql =>
                {
                    npgsql.MigrationsAssembly("CampaignService.Infrastructure");
                    npgsql.CommandTimeout(30);
                    npgsql.EnableRetryOnFailure(3);
                });
                
                // Enable sensitive data logging in development
                if (configuration.GetValue<bool>("EnableSensitiveDataLogging"))
                {
                    options.EnableSensitiveDataLogging();
                }
            });
            
            // Repositories - Scoped (per request, tied to DbContext)
            services.AddScoped<ICampaignRepository, CampaignRepository>();
            services.AddScoped<IPlayerRepository, PlayerRepository>();
            services.AddScoped<ICampaignPlayerRepository, CampaignPlayerRepository>();
            services.AddScoped<IUnitOfWork, UnitOfWork>();
            
            // External Services - Singleton (thread-safe, expensive to create)
            services.AddSingleton<IEmailService, EmailService>();
            services.AddSingleton<IFileStorageService, S3FileStorageService>();
            
            // Caching - Singleton
            services.ConfigureCaching(configuration);
            
            // Messaging - Singleton
            services.ConfigureMessaging(configuration);
            
            // Health Checks
            services.AddHealthChecks()
                .AddDbContextCheck<CampaignDbContext>("database")
                .AddRedis(configuration.GetConnectionString("Redis"), "redis")
                .AddCheck<EmailServiceHealthCheck>("email");
            
            return services;
        }
    }
}
```

#### Application Services Registration
```csharp
// src/Services/CampaignService/CampaignService.API/Configuration/ServiceCollectionExtensions.cs
using CampaignService.API.Filters;
using CampaignService.API.Middleware;
using Common.Core.Authentication;
using Common.Core.Authorization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.OpenApi.Models;

namespace CampaignService.API.Configuration
{
    public static class ServiceCollectionExtensions
    {
        public static IServiceCollection ConfigureApplicationServices(
            this IServiceCollection services, 
            IConfiguration configuration)
        {
            // Controllers with API behavior
            services.AddControllers(options =>
            {
                options.Filters.Add<ValidationFilter>();
                options.Filters.Add<ExceptionFilter>();
                options.Filters.Add<AuditFilter>();
            })
            .ConfigureApiBehaviorOptions(options =>
            {
                options.SuppressModelStateInvalidFilter = true; // Handle validation manually
            });
            
            // API Versioning
            services.AddApiVersioning(options =>
            {
                options.DefaultApiVersion = new ApiVersion(1, 0);
                options.AssumeDefaultVersionWhenUnspecified = true;
                options.ApiVersionReader = new UrlSegmentApiVersionReader();
            });
            
            // Swagger/OpenAPI
            services.AddSwaggerGen(c =>
            {
                c.SwaggerDoc("v1", new OpenApiInfo
                {
                    Title = "Campaign Service API",
                    Version = "v1",
                    Description = "D&D Campaign Management Service"
                });
                
                // JWT Authentication in Swagger
                c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
                {
                    Description = "JWT Authorization header using the Bearer scheme",
                    Name = "Authorization",
                    In = ParameterLocation.Header,
                    Type = SecuritySchemeType.Http,
                    Scheme = "bearer",
                    BearerFormat = "JWT"
                });
                
                c.AddSecurityRequirement(new OpenApiSecurityRequirement
                {
                    {
                        new OpenApiSecurityScheme
                        {
                            Reference = new OpenApiReference
                            {
                                Type = ReferenceType.SecurityScheme,
                                Id = "Bearer"
                            }
                        },
                        Array.Empty<string>()
                    }
                });
            });
            
            // Authentication & Authorization
            services.ConfigureAuthentication(configuration);
            services.ConfigureAuthorization(configuration);
            
            // CORS
            services.AddCors(options =>
            {
                options.AddPolicy("AllowedOrigins", policy =>
                {
                    var allowedOrigins = configuration.GetSection("Cors:AllowedOrigins").Get<string[]>();
                    policy.WithOrigins(allowedOrigins ?? new[] { "http://localhost:3000" })
                          .AllowAnyHeader()
                          .AllowAnyMethod()
                          .AllowCredentials();
                });
            });
            
            // Rate Limiting
            services.AddRateLimiter(configuration);
            
            // Background Services - Singleton
            services.AddHostedService<CampaignCleanupService>();
            services.AddHostedService<EventProcessingService>();
            
            return services;
        }
    }
}
```

---

## Shared Services Configuration

### Common Infrastructure Services
```csharp
// src/Shared/Common/Common.Infrastructure/ServiceCollectionExtensions.cs
using Common.Infrastructure.Caching;
using Common.Infrastructure.Messaging;
using Common.Infrastructure.Logging;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Configuration;
using StackExchange.Redis;
using MassTransit;
using Serilog;

namespace Common.Infrastructure
{
    public static class ServiceCollectionExtensions
    {
        public static IServiceCollection ConfigureCaching(
            this IServiceCollection services, 
            IConfiguration configuration)
        {
            var redisConnectionString = configuration.GetConnectionString("Redis");
            
            if (!string.IsNullOrEmpty(redisConnectionString))
            {
                // Redis Distributed Cache - Singleton
                services.AddSingleton<IConnectionMultiplexer>(provider =>
                {
                    var connectionString = configuration.GetConnectionString("Redis");
                    return ConnectionMultiplexer.Connect(connectionString);
                });
                
                services.AddStackExchangeRedisCache(options =>
                {
                    options.Configuration = redisConnectionString;
                    options.InstanceName = "DnDCampaign";
                });
                
                // Custom cache service - Singleton
                services.AddSingleton<ICacheService, RedisCacheService>();
            }
            else
            {
                // Fallback to in-memory cache for development
                services.AddMemoryCache();
                services.AddSingleton<ICacheService, MemoryCacheService>();
            }
            
            return services;
        }
        
        public static IServiceCollection ConfigureMessaging(
            this IServiceCollection services, 
            IConfiguration configuration)
        {
            var messagingConfig = configuration.GetSection("Messaging").Get<MessagingConfiguration>();
            
            services.AddMassTransit(x =>
            {
                // Add consumers from all assemblies
                x.AddConsumers(typeof(ServiceCollectionExtensions).Assembly);
                
                if (messagingConfig?.UseRabbitMq == true)
                {
                    x.UsingRabbitMq((context, cfg) =>
                    {
                        cfg.Host(messagingConfig.RabbitMq.Host, messagingConfig.RabbitMq.VirtualHost, h =>
                        {
                            h.Username(messagingConfig.RabbitMq.Username);
                            h.Password(messagingConfig.RabbitMq.Password);
                        });
                        
                        cfg.ConfigureEndpoints(context);
                    });
                }
                else
                {
                    // Fallback to in-memory for development
                    x.UsingInMemory((context, cfg) =>
                    {
                        cfg.ConfigureEndpoints(context);
                    });
                }
            });
            
            // Event Bus abstraction - Scoped
            services.AddScoped<IEventBus, MassTransitEventBus>();
            
            return services;
        }
        
        public static IServiceCollection ConfigureLogging(
            this IServiceCollection services, 
            IConfiguration configuration)
        {
            // Configure Serilog
            Log.Logger = new LoggerConfiguration()
                .ReadFrom.Configuration(configuration)
                .CreateLogger();
            
            services.AddLogging(builder =>
            {
                builder.ClearProviders();
                builder.AddSerilog();
            });
            
            return services;
        }
    }
}
```

### Authentication & Authorization Configuration
```csharp
// src/Shared/Common/Common.Core/Authentication/ServiceCollectionExtensions.cs
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using System.Text;

namespace Common.Core.Authentication
{
    public static class ServiceCollectionExtensions
    {
        public static IServiceCollection ConfigureAuthentication(
            this IServiceCollection services, 
            IConfiguration configuration)
        {
            var jwtConfig = configuration.GetSection("Jwt").Get<JwtConfiguration>();
            
            services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            })
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtConfig.SecretKey)),
                    ValidateIssuer = true,
                    ValidIssuer = jwtConfig.Issuer,
                    ValidateAudience = true,
                    ValidAudience = jwtConfig.Audience,
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.FromMinutes(5)
                };
                
                options.Events = new JwtBearerEvents
                {
                    OnAuthenticationFailed = context =>
                    {
                        var logger = context.HttpContext.RequestServices.GetRequiredService<ILogger<JwtBearerEvents>>();
                        logger.LogError(context.Exception, "JWT authentication failed");
                        return Task.CompletedTask;
                    },
                    OnTokenValidated = context =>
                    {
                        var logger = context.HttpContext.RequestServices.GetRequiredService<ILogger<JwtBearerEvents>>();
                        logger.LogDebug("JWT token validated for user {UserId}", context.Principal?.Identity?.Name);
                        return Task.CompletedTask;
                    }
                };
            });
            
            // JWT Service - Singleton
            services.AddSingleton<IJwtService, JwtService>();
            
            // Current User Service - Scoped (per request)
            services.AddScoped<ICurrentUserService, CurrentUserService>();
            
            return services;
        }
        
        public static IServiceCollection ConfigureAuthorization(
            this IServiceCollection services, 
            IConfiguration configuration)
        {
            services.AddAuthorization(options =>
            {
                // Role-based policies
                options.AddPolicy("GameMasterOnly", policy => 
                    policy.RequireRole("GameMaster", "Admin"));
                
                options.AddPolicy("PlayerOrGameMaster", policy => 
                    policy.RequireRole("Player", "GameMaster", "Admin"));
                
                // Resource-based policies
                options.AddPolicy("CampaignOwner", policy => 
                    policy.Requirements.Add(new CampaignOwnerRequirement()));
                
                options.AddPolicy("CampaignMember", policy => 
                    policy.Requirements.Add(new CampaignMemberRequirement()));
                
                // Subscription-based policies
                options.AddPolicy("PremiumFeatures", policy => 
                    policy.Requirements.Add(new SubscriptionRequirement("Premium", "Enterprise")));
            });
            
            // Authorization handlers - Scoped
            services.AddScoped<IAuthorizationHandler, CampaignOwnerAuthorizationHandler>();
            services.AddScoped<IAuthorizationHandler, CampaignMemberAuthorizationHandler>();
            services.AddScoped<IAuthorizationHandler, SubscriptionAuthorizationHandler>();
            
            return services;
        }
    }
}
```

---

## Service Interface Definitions

### Core Service Interfaces
```csharp
// src/Services/CampaignService/CampaignService.Core/Interfaces/ICampaignService.cs
using CampaignService.Core.Models;
using Common.Core.Models;

namespace CampaignService.Core.Interfaces
{
    public interface ICampaignService
    {
        Task<Result<CampaignDto>> CreateCampaignAsync(CreateCampaignRequest request, CancellationToken cancellationToken = default);
        Task<Result<CampaignDto>> GetCampaignByIdAsync(Guid campaignId, CancellationToken cancellationToken = default);
        Task<Result<IEnumerable<CampaignSummaryDto>>> GetUserCampaignsAsync(Guid userId, CancellationToken cancellationToken = default);
        Task<Result<CampaignDto>> UpdateCampaignAsync(Guid campaignId, UpdateCampaignRequest request, CancellationToken cancellationToken = default);
        Task<Result> DeleteCampaignAsync(Guid campaignId, CancellationToken cancellationToken = default);
        Task<Result> InvitePlayerAsync(Guid campaignId, InvitePlayerRequest request, CancellationToken cancellationToken = default);
    }
    
    public interface ICampaignRepository
    {
        Task<Campaign?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
        Task<Campaign?> GetByIdWithPlayersAsync(Guid id, CancellationToken cancellationToken = default);
        Task<IEnumerable<Campaign>> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken = default);
        Task<Campaign> CreateAsync(Campaign campaign, CancellationToken cancellationToken = default);
        Task<Campaign> UpdateAsync(Campaign campaign, CancellationToken cancellationToken = default);
        Task DeleteAsync(Guid id, CancellationToken cancellationToken = default);
        Task<bool> ExistsAsync(Guid id, CancellationToken cancellationToken = default);
    }
    
    public interface IUnitOfWork : IDisposable
    {
        ICampaignRepository Campaigns { get; }
        IPlayerRepository Players { get; }
        ICampaignPlayerRepository CampaignPlayers { get; }
        
        Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
        Task BeginTransactionAsync(CancellationToken cancellationToken = default);
        Task CommitTransactionAsync(CancellationToken cancellationToken = default);
        Task RollbackTransactionAsync(CancellationToken cancellationToken = default);
    }
}
```

### Infrastructure Service Interfaces
```csharp
// src/Shared/Common/Common.Core/Interfaces/IServices.cs
namespace Common.Core.Interfaces
{
    public interface ICacheService
    {
        Task<T?> GetAsync<T>(string key, CancellationToken cancellationToken = default) where T : class;
        Task SetAsync<T>(string key, T value, TimeSpan? expiration = null, CancellationToken cancellationToken = default) where T : class;
        Task RemoveAsync(string key, CancellationToken cancellationToken = default);
        Task RemovePatternAsync(string pattern, CancellationToken cancellationToken = default);
    }
    
    public interface IEventBus
    {
        Task PublishAsync<T>(T @event, CancellationToken cancellationToken = default) where T : class;
        Task SendAsync<T>(T command, CancellationToken cancellationToken = default) where T : class;
    }
    
    public interface ICurrentUserService
    {
        Guid UserId { get; }
        string Email { get; }
        string DisplayName { get; }
        IEnumerable<string> Roles { get; }
        bool IsInRole(string role);
        bool IsAuthenticated { get; }
    }
    
    public interface IJwtService
    {
        string GenerateToken(UserClaims userClaims);
        string GenerateRefreshToken();
        ClaimsPrincipal GetPrincipalFromExpiredToken(string token);
        bool ValidateToken(string token);
    }
}
```

---

## Configuration Models

### Service Configuration Models
```csharp
// src/Shared/Common/Common.Core/Configuration/ServiceConfiguration.cs
namespace Common.Core.Configuration
{
    public class JwtConfiguration
    {
        public const string SectionName = "Jwt";
        
        public string SecretKey { get; set; } = string.Empty;
        public string Issuer { get; set; } = string.Empty;
        public string Audience { get; set; } = string.Empty;
        public int ExpirationMinutes { get; set; } = 60;
        public int RefreshTokenExpirationDays { get; set; } = 7;
    }
    
    public class MessagingConfiguration
    {
        public const string SectionName = "Messaging";
        
        public bool UseRabbitMq { get; set; } = false;
        public RabbitMqConfiguration RabbitMq { get; set; } = new();
    }
    
    public class RabbitMqConfiguration
    {
        public string Host { get; set; } = "localhost";
        public string VirtualHost { get; set; } = "/";
        public string Username { get; set; } = "guest";
        public string Password { get; set; } = "guest";
        public int Port { get; set; } = 5672;
    }
    
    public class CachingConfiguration
    {
        public const string SectionName = "Caching";
        
        public string Provider { get; set; } = "Memory"; // Memory, Redis
        public int DefaultExpirationMinutes { get; set; } = 30;
        public RedisConfiguration Redis { get; set; } = new();
    }
    
    public class RedisConfiguration
    {
        public string ConnectionString { get; set; } = string.Empty;
        public string InstanceName { get; set; } = "DnDCampaign";
        public int Database { get; set; } = 0;
    }
}
```

---

## Service Implementation Examples

### Business Service Implementation
```csharp
// src/Services/CampaignService/CampaignService.Core/Services/CampaignService.cs
using AutoMapper;
using CampaignService.Core.Interfaces;
using CampaignService.Core.Models;
using Common.Core.Interfaces;
using Common.Core.Models;
using FluentValidation;
using Microsoft.Extensions.Logging;

namespace CampaignService.Core.Services
{
    public class CampaignService : ICampaignService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;
        private readonly ILogger<CampaignService> _logger;
        private readonly IValidator<CreateCampaignRequest> _createValidator;
        private readonly IValidator<UpdateCampaignRequest> _updateValidator;
        private readonly ICurrentUserService _currentUser;
        private readonly IEventBus _eventBus;
        private readonly ICacheService _cache;
        
        public CampaignService(
            IUnitOfWork unitOfWork,
            IMapper mapper,
            ILogger<CampaignService> logger,
            IValidator<CreateCampaignRequest> createValidator,
            IValidator<UpdateCampaignRequest> updateValidator,
            ICurrentUserService currentUser,
            IEventBus eventBus,
            ICacheService cache)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
            _logger = logger;
            _createValidator = createValidator;
            _updateValidator = updateValidator;
            _currentUser = currentUser;
            _eventBus = eventBus;
            _cache = cache;
        }
        
        public async Task<Result<CampaignDto>> CreateCampaignAsync(
            CreateCampaignRequest request, 
            CancellationToken cancellationToken = default)
        {
            _logger.LogInformation("Creating campaign '{CampaignName}' for user {UserId}", 
                request.Name, _currentUser.UserId);
            
            // Validate request
            var validationResult = await _createValidator.ValidateAsync(request, cancellationToken);
            if (!validationResult.IsValid)
            {
                return Result<CampaignDto>.Failure(validationResult.Errors.First().ErrorMessage);
            }
            
            try
            {
                // Check if campaign name already exists for user
                var existingCampaigns = await _unitOfWork.Campaigns.GetByUserIdAsync(_currentUser.UserId, cancellationToken);
                if (existingCampaigns.Any(c => c.Name.Equals(request.Name, StringComparison.OrdinalIgnoreCase)))
                {
                    return Result<CampaignDto>.Failure("A campaign with this name already exists");
                }
                
                // Create campaign entity
                var campaign = new Campaign
                {
                    Name = request.Name,
                    Description = request.Description,
                    GameMasterId = _currentUser.UserId,
                    MaxPlayers = request.MaxPlayers,
                    Setting = request.Setting,
                    Status = CampaignStatus.Planning,
                    CreatedAt = DateTime.UtcNow
                };
                
                // Save to database
                var createdCampaign = await _unitOfWork.Campaigns.CreateAsync(campaign, cancellationToken);
                await _unitOfWork.SaveChangesAsync(cancellationToken);
                
                // Clear cache
                await _cache.RemovePatternAsync($"campaigns:user:{_currentUser.UserId}*", cancellationToken);
                
                // Publish event
                await _eventBus.PublishAsync(new CampaignCreatedEvent
                {
                    CampaignId = createdCampaign.Id,
                    GameMasterId = createdCampaign.GameMasterId,
                    CampaignName = createdCampaign.Name
                }, cancellationToken);
                
                var result = _mapper.Map<CampaignDto>(createdCampaign);
                
                _logger.LogInformation("Successfully created campaign {CampaignId} '{CampaignName}'", 
                    createdCampaign.Id, createdCampaign.Name);
                
                return Result<CampaignDto>.Success(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to create campaign '{CampaignName}' for user {UserId}", 
                    request.Name, _currentUser.UserId);
                return Result<CampaignDto>.Failure("Failed to create campaign due to an internal error");
            }
        }
        
        // Other methods...
    }
}
```

### Repository Implementation
```csharp
// src/Services/CampaignService/CampaignService.Infrastructure/Repositories/CampaignRepository.cs
using CampaignService.Core.Entities;
using CampaignService.Core.Interfaces;
using CampaignService.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace CampaignService.Infrastructure.Repositories
{
    public class CampaignRepository : ICampaignRepository
    {
        private readonly CampaignDbContext _context;
        
        public CampaignRepository(CampaignDbContext context)
        {
            _context = context;
        }
        
        public async Task<Campaign?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
        {
            return await _context.Campaigns
                .AsNoTracking()
                .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);
        }
        
        public async Task<Campaign?> GetByIdWithPlayersAsync(Guid id, CancellationToken cancellationToken = default)
        {
            return await _context.Campaigns
                .Include(c => c.Players)
                .ThenInclude(cp => cp.Player)
                .AsNoTracking()
                .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);
        }
        
        public async Task<IEnumerable<Campaign>> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken = default)
        {
            return await _context.Campaigns
                .Where(c => c.GameMasterId == userId || c.Players.Any(cp => cp.PlayerId == userId))
                .AsNoTracking()
                .ToListAsync(cancellationToken);
        }
        
        public async Task<Campaign> CreateAsync(Campaign campaign, CancellationToken cancellationToken = default)
        {
            _context.Campaigns.Add(campaign);
            return campaign;
        }
        
        public async Task<Campaign> UpdateAsync(Campaign campaign, CancellationToken cancellationToken = default)
        {
            _context.Campaigns.Update(campaign);
            return campaign;
        }
        
        public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
        {
            var campaign = await _context.Campaigns.FindAsync(new object[] { id }, cancellationToken);
            if (campaign != null)
            {
                _context.Campaigns.Remove(campaign);
            }
        }
        
        public async Task<bool> ExistsAsync(Guid id, CancellationToken cancellationToken = default)
        {
            return await _context.Campaigns
                .AsNoTracking()
                .AnyAsync(c => c.Id == id, cancellationToken);
        }
    }
}
```

---

## Testing DI Configuration

### Test Service Configuration
```csharp
// tests/CampaignService.Tests/Helpers/TestServiceCollection.cs
using CampaignService.Core;
using CampaignService.Infrastructure;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace CampaignService.Tests.Helpers
{
    public static class TestServiceCollection
    {
        public static IServiceCollection CreateTestServices()
        {
            var services = new ServiceCollection();
            var configuration = CreateTestConfiguration();
            
            // Add test-specific services
            services.AddLogging(builder => builder.AddDebug());
            
            // Add in-memory database
            services.AddDbContext<CampaignDbContext>(options =>
                options.UseInMemoryDatabase($"TestDb_{Guid.NewGuid()}"));
            
            // Add core services
            services.ConfigureCoreServices(configuration);
            
            // Override infrastructure services with test implementations
            services.ConfigureTestInfrastructureServices(configuration);
            
            return services;
        }
        
        private static IConfiguration CreateTestConfiguration()
        {
            var configBuilder = new ConfigurationBuilder()
                .AddInMemoryCollection(new Dictionary<string, string>
                {
                    ["ConnectionStrings:DefaultConnection"] = "InMemory",
                    ["ConnectionStrings:Redis"] = "",
                    ["Jwt:SecretKey"] = "test-secret-key-for-unit-tests-only",
                    ["Jwt:Issuer"] = "TestIssuer",
                    ["Jwt:Audience"] = "TestAudience",
                    ["Jwt:ExpirationMinutes"] = "60"
                });
            
            return configBuilder.Build();
        }
        
        private static IServiceCollection ConfigureTestInfrastructureServices(
            this IServiceCollection services, 
            IConfiguration configuration)
        {
            // Replace real services with test doubles
            services.AddSingleton<IEmailService, MockEmailService>();
            services.AddSingleton<IFileStorageService, MockFileStorageService>();
            services.AddSingleton<ICacheService, MockCacheService>();
            services.AddSingleton<IEventBus, MockEventBus>();
            
            // Add repositories normally (they use in-memory database)
            services.AddScoped<ICampaignRepository, CampaignRepository>();
            services.AddScoped<IUnitOfWork, UnitOfWork>();
            
            return services;
        }
    }
}
```

### Integration Test Setup
```csharp
// tests/CampaignService.IntegrationTests/Infrastructure/TestWebApplicationFactory.cs
using CampaignService.API;
using CampaignService.Infrastructure.Data;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace CampaignService.IntegrationTests.Infrastructure
{
    public class TestWebApplicationFactory<TProgram> : WebApplicationFactory<TProgram> where TProgram : class
    {
        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.ConfigureServices(services =>
            {
                // Remove the real database service
                var descriptor = services.SingleOrDefault(d => d.ServiceType == typeof(DbContextOptions<CampaignDbContext>));
                if (descriptor != null)
                    services.Remove(descriptor);
                
                // Add in-memory database for testing
                services.AddDbContext<CampaignDbContext>(options =>
                {
                    options.UseInMemoryDatabase($"InMemoryDbForTesting_{Guid.NewGuid()}");
                });
                
                // Override external services with test implementations
                services.AddSingleton<IEmailService, MockEmailService>();
                services.AddSingleton<IEventBus, MockEventBus>();
                
                // Build service provider and seed database
                var serviceProvider = services.BuildServiceProvider();
                using var scope = serviceProvider.CreateScope();
                var context = scope.ServiceProvider.GetRequiredService<CampaignDbContext>();
                var logger = scope.ServiceProvider.GetRequiredService<ILogger<TestWebApplicationFactory<TProgram>>>();
                
                try
                {
                    SeedTestData(context);
                }
                catch (Exception ex)
                {
                    logger.LogError(ex, "An error occurred seeding the database with test data");
                }
            });
            
            builder.UseEnvironment("Testing");
        }
        
        private static void SeedTestData(CampaignDbContext context)
        {
            // Add test data for integration tests
            var testUser = new User
            {
                Id = Guid.Parse("11111111-1111-1111-1111-111111111111"),
                Email = "testgm@example.com",
                DisplayName = "Test GM",
                Role = UserRole.GameMaster
            };
            
            var testCampaign = new Campaign
            {
                Id = Guid.Parse("22222222-2222-2222-2222-222222222222"),
                Name = "Test Campaign",
                Description = "A campaign for testing",
                GameMasterId = testUser.Id,
                Status = CampaignStatus.Active,
                CreatedAt = DateTime.UtcNow
            };
            
            context.Users.Add(testUser);
            context.Campaigns.Add(testCampaign);
            context.SaveChanges();
        }
    }
}
```

---

## Advanced DI Patterns

### Factory Pattern with DI
```csharp
// src/Services/AIGateway/AIGateway.Core/Factories/IAIProviderFactory.cs
using AIGateway.Core.Interfaces;

namespace AIGateway.Core.Factories
{
    public interface IAIProviderFactory
    {
        IAIProvider CreateProvider(string providerName);
        IEnumerable<IAIProvider> CreateAllProviders();
    }
    
    public class AIProviderFactory : IAIProviderFactory
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<AIProviderFactory> _logger;
        
        public AIProviderFactory(IServiceProvider serviceProvider, ILogger<AIProviderFactory> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }
        
        public IAIProvider CreateProvider(string providerName)
        {
            return providerName.ToLowerInvariant() switch
            {
                "openai" => _serviceProvider.GetRequiredService<OpenAIProvider>(),
                "anthropic" => _serviceProvider.GetRequiredService<AnthropicProvider>(),
                "azure" => _serviceProvider.GetRequiredService<AzureOpenAIProvider>(),
                _ => throw new ArgumentException($"Unknown AI provider: {providerName}", nameof(providerName))
            };
        }
        
        public IEnumerable<IAIProvider> CreateAllProviders()
        {
            return _serviceProvider.GetServices<IAIProvider>();
        }
    }
    
    // Registration
    public static IServiceCollection AddAIProviders(this IServiceCollection services, IConfiguration configuration)
    {
        // Register all AI providers
        services.AddSingleton<OpenAIProvider>();
        services.AddSingleton<AnthropicProvider>();
        services.AddSingleton<AzureOpenAIProvider>();
        
        // Register them as IAIProvider for enumeration
        services.AddSingleton<IAIProvider, OpenAIProvider>(provider => provider.GetRequiredService<OpenAIProvider>());
        services.AddSingleton<IAIProvider, AnthropicProvider>(provider => provider.GetRequiredService<AnthropicProvider>());
        services.AddSingleton<IAIProvider, AzureOpenAIProvider>(provider => provider.GetRequiredService<AzureOpenAIProvider>());
        
        // Register factory
        services.AddSingleton<IAIProviderFactory, AIProviderFactory>();
        
        return services;
    }
}
```

### Decorator Pattern with DI
```csharp
// src/Shared/Common/Common.Core/Decorators/CachingDecorator.cs
using Common.Core.Interfaces;
using Microsoft.Extensions.Logging;
using System.Text.Json;

namespace Common.Core.Decorators
{
    public class CachingCampaignServiceDecorator : ICampaignService
    {
        private readonly ICampaignService _inner;
        private readonly ICacheService _cache;
        private readonly ILogger<CachingCampaignServiceDecorator> _logger;
        
        public CachingCampaignServiceDecorator(
            ICampaignService inner,
            ICacheService cache,
            ILogger<CachingCampaignServiceDecorator> logger)
        {
            _inner = inner;
            _cache = cache;
            _logger = logger;
        }
        
        public async Task<Result<CampaignDto>> GetCampaignByIdAsync(Guid campaignId, CancellationToken cancellationToken = default)
        {
            var cacheKey = $"campaign:{campaignId}";
            
            // Try cache first
            var cached = await _cache.GetAsync<CampaignDto>(cacheKey, cancellationToken);
            if (cached != null)
            {
                _logger.LogDebug("Campaign {CampaignId} found in cache", campaignId);
                return Result<CampaignDto>.Success(cached);
            }
            
            // Get from service
            var result = await _inner.GetCampaignByIdAsync(campaignId, cancellationToken);
            
            // Cache successful results
            if (result.IsSuccess && result.Value != null)
            {
                await _cache.SetAsync(cacheKey, result.Value, TimeSpan.FromMinutes(15), cancellationToken);
                _logger.LogDebug("Campaign {CampaignId} cached for 15 minutes", campaignId);
            }
            
            return result;
        }
        
        public async Task<Result<CampaignDto>> CreateCampaignAsync(CreateCampaignRequest request, CancellationToken cancellationToken = default)
        {
            var result = await _inner.CreateCampaignAsync(request, cancellationToken);
            
            // Invalidate user campaigns cache
            if (result.IsSuccess)
            {
                await _cache.RemovePatternAsync($"campaigns:user:*", cancellationToken);
            }
            
            return result;
        }
        
        // Delegate other methods to inner service
        public Task<Result<IEnumerable<CampaignSummaryDto>>> GetUserCampaignsAsync(Guid userId, CancellationToken cancellationToken = default)
            => _inner.GetUserCampaignsAsync(userId, cancellationToken);
        
        public Task<Result<CampaignDto>> UpdateCampaignAsync(Guid campaignId, UpdateCampaignRequest request, CancellationToken cancellationToken = default)
            => _inner.UpdateCampaignAsync(campaignId, request, cancellationToken);
        
        public Task<Result> DeleteCampaignAsync(Guid campaignId, CancellationToken cancellationToken = default)
            => _inner.DeleteCampaignAsync(campaignId, cancellationToken);
        
        public Task<Result> InvitePlayerAsync(Guid campaignId, InvitePlayerRequest request, CancellationToken cancellationToken = default)
            => _inner.InvitePlayerAsync(campaignId, request, cancellationToken);
    }
    
    // Registration with decorator
    public static IServiceCollection AddCampaignServiceWithCaching(this IServiceCollection services)
    {
        services.AddScoped<CampaignService.Core.Services.CampaignService>();
        services.AddScoped<ICampaignService>(provider =>
        {
            var inner = provider.GetRequiredService<CampaignService.Core.Services.CampaignService>();
            var cache = provider.GetRequiredService<ICacheService>();
            var logger = provider.GetRequiredService<ILogger<CachingCampaignServiceDecorator>>();
            
            return new CachingCampaignServiceDecorator(inner, cache, logger);
        });
        
        return services;
    }
}
```

### Options Pattern Integration
```csharp
// src/Services/CampaignService/CampaignService.Core/Configuration/CampaignServiceOptions.cs
using System.ComponentModel.DataAnnotations;

namespace CampaignService.Core.Configuration
{
    public class CampaignServiceOptions
    {
        public const string SectionName = "CampaignService";
        
        [Required]
        [Range(1, 20)]
        public int MaxCampaignsPerUser { get; set; } = 5;
        
        [Required]
        [Range(1, 10)]
        public int MaxPlayersPerCampaign { get; set; } = 6;
        
        [Required]
        [Range(1, 365)]
        public int InvitationExpirationDays { get; set; } = 7;
        
        public bool EnableCampaignTemplates { get; set; } = true;
        public bool EnableAdvancedPermissions { get; set; } = false;
        public bool RequireEmailVerification { get; set; } = true;
    }
    
    // Service using options
    public class CampaignService : ICampaignService
    {
        private readonly CampaignServiceOptions _options;
        
        public CampaignService(IOptionsMonitor<CampaignServiceOptions> options)
        {
            _options = options.CurrentValue;
            
            // Subscribe to option changes
            options.OnChange(newOptions => _options = newOptions);
        }
        
        public async Task<Result<CampaignDto>> CreateCampaignAsync(CreateCampaignRequest request, CancellationToken cancellationToken = default)
        {
            // Use options in business logic
            var userCampaignCount = await GetUserCampaignCountAsync(_currentUser.UserId);
            if (userCampaignCount >= _options.MaxCampaignsPerUser)
            {
                return Result<CampaignDto>.Failure($"Maximum of {_options.MaxCampaignsPerUser} campaigns allowed per user");
            }
            
            // Rest of implementation...
        }
    }
    
    // Registration with validation
    public static IServiceCollection AddCampaignServiceOptions(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<CampaignServiceOptions>(configuration.GetSection(CampaignServiceOptions.SectionName));
        
        // Add options validation
        services.PostConfigure<CampaignServiceOptions>(options =>
        {
            var validationContext = new ValidationContext(options);
            var validationResults = new List<ValidationResult>();
            
            if (!Validator.TryValidateObject(options, validationContext, validationResults, validateAllProperties: true))
            {
                var errors = string.Join(", ", validationResults.Select(r => r.ErrorMessage));
                throw new InvalidOperationException($"CampaignServiceOptions validation failed: {errors}");
            }
        });
        
        return services;
    }
}
```

---

## Health Checks Integration

### Service Health Checks
```csharp
// src/Shared/Common/Common.Infrastructure/HealthChecks/ServiceHealthChecks.cs
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.DependencyInjection;
using Common.Core.Interfaces;

namespace Common.Infrastructure.HealthChecks
{
    public class DatabaseHealthCheck : IHealthCheck
    {
        private readonly CampaignDbContext _context;
        
        public DatabaseHealthCheck(CampaignDbContext context)
        {
            _context = context;
        }
        
        public async Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken cancellationToken = default)
        {
            try
            {
                await _context.Database.ExecuteSqlRawAsync("SELECT 1", cancellationToken);
                return HealthCheckResult.Healthy("Database is accessible");
            }
            catch (Exception ex)
            {
                return HealthCheckResult.Unhealthy("Database is not accessible", ex);
            }
        }
    }
    
    public class CacheHealthCheck : IHealthCheck
    {
        private readonly ICacheService _cache;
        
        public CacheHealthCheck(ICacheService cache)
        {
            _cache = cache;
        }
        
        public async Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken cancellationToken = default)
        {
            try
            {
                var testKey = "healthcheck";
                var testValue = DateTime.UtcNow.ToString();
                
                await _cache.SetAsync(testKey, testValue, TimeSpan.FromSeconds(30), cancellationToken);
                var retrieved = await _cache.GetAsync<string>(testKey, cancellationToken);
                
                if (retrieved == testValue)
                {
                    await _cache.RemoveAsync(testKey, cancellationToken);
                    return HealthCheckResult.Healthy("Cache is working correctly");
                }
                
                return HealthCheckResult.Degraded("Cache retrieved value doesn't match");
            }
            catch (Exception ex)
            {
                return HealthCheckResult.Unhealthy("Cache is not accessible", ex);
            }
        }
    }
    
    public class EventBusHealthCheck : IHealthCheck
    {
        private readonly IEventBus _eventBus;
        
        public EventBusHealthCheck(IEventBus eventBus)
        {
            _eventBus = eventBus;
        }
        
        public async Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken cancellationToken = default)
        {
            try
            {
                // Try to publish a health check event
                await _eventBus.PublishAsync(new HealthCheckEvent { Timestamp = DateTime.UtcNow }, cancellationToken);
                return HealthCheckResult.Healthy("Event bus is accessible");
            }
            catch (Exception ex)
            {
                return HealthCheckResult.Unhealthy("Event bus is not accessible", ex);
            }
        }
    }
    
    // Registration
    public static IServiceCollection AddServiceHealthChecks(this IServiceCollection services)
    {
        services.AddHealthChecks()
            .AddCheck<DatabaseHealthCheck>("database", tags: new[] { "database", "ready" })
            .AddCheck<CacheHealthCheck>("cache", tags: new[] { "cache", "ready" })
            .AddCheck<EventBusHealthCheck>("eventbus", tags: new[] { "messaging", "ready" });
        
        return services;
    }
}
```

---

## Performance Optimization

### Service Pooling
```csharp
// src/Shared/Common/Common.Infrastructure/Pooling/ServicePooling.cs
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.ObjectPool;

namespace Common.Infrastructure.Pooling
{
    public class ExpensiveServicePool
    {
        private readonly ObjectPool<ExpensiveService> _pool;
        
        public ExpensiveServicePool(ObjectPool<ExpensiveService> pool)
        {
            _pool = pool;
        }
        
        public async Task<T> ExecuteAsync<T>(Func<ExpensiveService, Task<T>> operation)
        {
            var service = _pool.Get();
            try
            {
                return await operation(service);
            }
            finally
            {
                _pool.Return(service);
            }
        }
    }
    
    public class ExpensiveServicePooledObjectPolicy : IPooledObjectPolicy<ExpensiveService>
    {
        private readonly IServiceProvider _serviceProvider;
        
        public ExpensiveServicePooledObjectPolicy(IServiceProvider serviceProvider)
        {
            _serviceProvider = serviceProvider;
        }
        
        public ExpensiveService Create()
        {
            return _serviceProvider.GetRequiredService<ExpensiveService>();
        }
        
        public bool Return(ExpensiveService obj)
        {
            // Reset object state if needed
            obj.Reset();
            return true;
        }
    }
    
    // Registration
    public static IServiceCollection AddServicePooling(this IServiceCollection services)
    {
        services.AddSingleton<IPooledObjectPolicy<ExpensiveService>, ExpensiveServicePooledObjectPolicy>();
        services.AddSingleton(provider =>
        {
            var policy = provider.GetRequiredService<IPooledObjectPolicy<ExpensiveService>>();
            return new DefaultObjectPool<ExpensiveService>(policy, maximumRetained: 10);
        });
        services.AddSingleton<ExpensiveServicePool>();
        
        return services;
    }
}
```

### Scoped Service Optimization
```csharp
// src/Shared/Common/Common.Core/Services/ServiceScopeFactory.cs
using Microsoft.Extensions.DependencyInjection;

namespace Common.Core.Services
{
    public interface IServiceScopeFactory<T> where T : class
    {
        Task<TResult> ExecuteInScopeAsync<TResult>(Func<T, Task<TResult>> operation);
        Task ExecuteInScopeAsync(Func<T, Task> operation);
    }
    
    public class ServiceScopeFactory<T> : IServiceScopeFactory<T> where T : class
    {
        private readonly IServiceScopeFactory _serviceScopeFactory;
        
        public ServiceScopeFactory(IServiceScopeFactory serviceScopeFactory)
        {
            _serviceScopeFactory = serviceScopeFactory;
        }
        
        public async Task<TResult> ExecuteInScopeAsync<TResult>(Func<T, Task<TResult>> operation)
        {
            using var scope = _serviceScopeFactory.CreateScope();
            var service = scope.ServiceProvider.GetRequiredService<T>();
            return await operation(service);
        }
        
        public async Task ExecuteInScopeAsync(Func<T, Task> operation)
        {
            using var scope = _serviceScopeFactory.CreateScope();
            var service = scope.ServiceProvider.GetRequiredService<T>();
            await operation(service);
        }
    }
    
    // Registration
    public static IServiceCollection AddServiceScopeFactories(this IServiceCollection services)
    {
        services.AddScoped(typeof(IServiceScopeFactory<>), typeof(ServiceScopeFactory<>));
        return services;
    }
}
```

This comprehensive dependency injection setup provides a solid foundation for managing services, configuration, and cross-cutting concerns across the entire D&D AI Campaign Management System.