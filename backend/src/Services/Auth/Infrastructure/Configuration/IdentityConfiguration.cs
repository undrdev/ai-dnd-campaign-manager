using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using DndAI.Shared.Domain.Entities;
using DndAI.Services.Auth.Infrastructure.Data;

namespace DndAI.Services.Auth.Infrastructure.Configuration;

/// <summary>
/// Configuration for ASP.NET Core Identity
/// </summary>
public static class IdentityConfiguration
{
    /// <summary>
    /// Configures ASP.NET Core Identity services
    /// </summary>
    public static IServiceCollection AddIdentityConfiguration(
        this IServiceCollection services, 
        IConfiguration configuration)
    {
        // Add Entity Framework DbContext
        services.AddDbContext<AuthDbContext>(options =>
            options.UseNpgsql(
                configuration.GetConnectionString("DefaultConnection"),
                builder => builder.MigrationsAssembly(typeof(AuthDbContext).Assembly.FullName)));

        // Configure Identity
        services.AddIdentity<User, IdentityRole<Guid>>(options =>
        {
            // Password settings
            options.Password.RequireDigit = true;
            options.Password.RequireLowercase = true;
            options.Password.RequireNonAlphanumeric = true;
            options.Password.RequireUppercase = true;
            options.Password.RequiredLength = 8;
            options.Password.RequiredUniqueChars = 4;

            // Lockout settings
            options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(5);
            options.Lockout.MaxFailedAccessAttempts = 5;
            options.Lockout.AllowedForNewUsers = true;

            // User settings
            options.User.AllowedUserNameCharacters =
                "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-._@+";
            options.User.RequireUniqueEmail = true;

            // Sign in settings
            options.SignIn.RequireConfirmedEmail = true;
            options.SignIn.RequireConfirmedPhoneNumber = false;
            options.SignIn.RequireConfirmedAccount = true;
        })
        .AddEntityFrameworkStores<AuthDbContext>()
        .AddDefaultTokenProviders();

        // Configure application cookie
        services.ConfigureApplicationCookie(options =>
        {
            options.Cookie.HttpOnly = true;
            options.ExpireTimeSpan = TimeSpan.FromMinutes(60);
            options.LoginPath = "/api/auth/login";
            options.LogoutPath = "/api/auth/logout";
            options.AccessDeniedPath = "/api/auth/access-denied";
            options.SlidingExpiration = true;
            options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
            options.Cookie.SameSite = SameSiteMode.Strict;
        });

        // Add custom password validators
        services.AddScoped<IPasswordValidator<User>, CustomPasswordValidator>();

        // Configure JWT settings
        services.Configure<JwtSettings>(configuration.GetSection(JwtSettings.SectionName));

        // Register application services
        services.AddScoped<DndAI.Services.Auth.Application.Interfaces.IUserService, 
                          DndAI.Services.Auth.Application.Services.UserService>();
        services.AddScoped<DndAI.Services.Auth.Application.Interfaces.IJwtTokenService,
                          DndAI.Services.Auth.Application.Services.JwtTokenService>();

        // Register validators
        services.AddScoped<DndAI.Services.Auth.Application.Validators.RegisterRequestValidator>();
        services.AddScoped<DndAI.Services.Auth.Application.Validators.LoginRequestValidator>();
        services.AddScoped<DndAI.Services.Auth.Application.Validators.ForgotPasswordRequestValidator>();
        services.AddScoped<DndAI.Services.Auth.Application.Validators.ResetPasswordRequestValidator>();
        services.AddScoped<DndAI.Services.Auth.Application.Validators.RefreshTokenRequestValidator>();
        services.AddScoped<DndAI.Services.Auth.Application.Validators.VerifyEmailRequestValidator>();

        // Add authorization policies
        services.AddAuthorizationPolicies();

        return services;
    }
}

/// <summary>
/// Custom password validator with additional business rules
/// </summary>
public class CustomPasswordValidator : IPasswordValidator<User>
{
    public Task<IdentityResult> ValidateAsync(UserManager<User> manager, User user, string? password)
    {
        var errors = new List<IdentityError>();

        if (string.IsNullOrEmpty(password))
        {
            errors.Add(new IdentityError
            {
                Code = "PasswordRequired",
                Description = "Password is required."
            });
            return Task.FromResult(IdentityResult.Failed(errors.ToArray()));
        }

        // Check for common passwords
        var commonPasswords = new[]
        {
            "password", "123456", "password123", "admin", "qwerty",
            "letmein", "welcome", "monkey", "dragon", "master"
        };

        if (commonPasswords.Any(cp => password.ToLowerInvariant().Contains(cp)))
        {
            errors.Add(new IdentityError
            {
                Code = "CommonPassword",
                Description = "Password cannot contain common words or patterns."
            });
        }

        // Check if password contains user information
        if (!string.IsNullOrEmpty(user.FirstName) && 
            password.ToLowerInvariant().Contains(user.FirstName.ToLowerInvariant()))
        {
            errors.Add(new IdentityError
            {
                Code = "PasswordContainsUserInfo",
                Description = "Password cannot contain your first name."
            });
        }

        if (!string.IsNullOrEmpty(user.LastName) && 
            password.ToLowerInvariant().Contains(user.LastName.ToLowerInvariant()))
        {
            errors.Add(new IdentityError
            {
                Code = "PasswordContainsUserInfo",
                Description = "Password cannot contain your last name."
            });
        }

        if (!string.IsNullOrEmpty(user.Email) && 
            password.ToLowerInvariant().Contains(user.Email.Split('@')[0].ToLowerInvariant()))
        {
            errors.Add(new IdentityError
            {
                Code = "PasswordContainsUserInfo",
                Description = "Password cannot contain your email username."
            });
        }

        // Check for sequential characters
        if (HasSequentialCharacters(password))
        {
            errors.Add(new IdentityError
            {
                Code = "SequentialCharacters",
                Description = "Password cannot contain sequential characters (e.g., 123, abc)."
            });
        }

        return Task.FromResult(errors.Count == 0 
            ? IdentityResult.Success 
            : IdentityResult.Failed(errors.ToArray()));
    }

    private static bool HasSequentialCharacters(string password)
    {
        for (int i = 0; i < password.Length - 2; i++)
        {
            if (char.IsDigit(password[i]) && char.IsDigit(password[i + 1]) && char.IsDigit(password[i + 2]))
            {
                if (password[i + 1] == password[i] + 1 && password[i + 2] == password[i] + 2)
                    return true;
            }
            
            if (char.IsLetter(password[i]) && char.IsLetter(password[i + 1]) && char.IsLetter(password[i + 2]))
            {
                if (password[i + 1] == password[i] + 1 && password[i + 2] == password[i] + 2)
                    return true;
            }
        }
        return false;
    }
}
