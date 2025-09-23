using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using DndAI.Shared.Domain.Entities;
using DndAI.Shared.Domain.Enums;
using DndAI.Shared.Domain.Events;
using DndAI.Services.Auth.Application.Interfaces;
using DndAI.Services.Auth.Infrastructure.Data;
using MediatR;

namespace DndAI.Services.Auth.Application.Services;

/// <summary>
/// Implementation of user management service
/// </summary>
public class UserService : IUserService
{
    private readonly UserManager<User> _userManager;
    private readonly SignInManager<User> _signInManager;
    private readonly AuthDbContext _context;
    private readonly IMediator _mediator;
    private readonly ILogger<UserService> _logger;

    public UserService(
        UserManager<User> userManager,
        SignInManager<User> signInManager,
        AuthDbContext context,
        IMediator mediator,
        ILogger<UserService> logger)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _context = context;
        _mediator = mediator;
        _logger = logger;
    }

    public async Task<IdentityResult> RegisterUserAsync(RegisterUserRequest request)
    {
        _logger.LogInformation("Attempting to register user with email: {Email}", request.Email);

        var user = new User
        {
            FirstName = request.FirstName,
            LastName = request.LastName,
            UserName = request.Email,
            Email = request.Email,
            Role = request.Role,
            SubscriptionTier = request.SubscriptionTier,
            CreatedAt = DateTime.UtcNow,
            IsActive = true
        };

        var result = await _userManager.CreateAsync(user, request.Password);

        if (result.Succeeded)
        {
            _logger.LogInformation("User {Email} registered successfully with ID: {UserId}", 
                request.Email, user.Id);

            // Publish domain event
            await _mediator.Publish(new UserRegisteredEvent(user.Id, user.Email!));

            // Create default user profile
            var profile = new UserProfile
            {
                UserId = user.Id,
                PreferredLanguage = "en-US",
                ExperienceLevel = ExperienceLevel.Beginner,
                EmailNotifications = true,
                PushNotifications = true,
                IsPublic = false
            };

            _context.UserProfiles.Add(profile);
            await _context.SaveChangesAsync();
        }
        else
        {
            _logger.LogWarning("Failed to register user {Email}: {Errors}", 
                request.Email, string.Join(", ", result.Errors.Select(e => e.Description)));
        }

        return result;
    }

    public async Task<IdentityResult> ConfirmEmailAsync(Guid userId, string token)
    {
        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user == null)
        {
            return IdentityResult.Failed(new IdentityError 
            { 
                Code = "UserNotFound", 
                Description = "User not found." 
            });
        }

        var result = await _userManager.ConfirmEmailAsync(user, token);
        
        if (result.Succeeded)
        {
            _logger.LogInformation("Email confirmed for user: {UserId}", userId);
            await _mediator.Publish(new UserEmailVerifiedEvent(user.Id, user.Email!));
        }

        return result;
    }

    public async Task<SignInResult> SignInAsync(string email, string password, bool rememberMe = false)
    {
        _logger.LogInformation("Attempting sign in for user: {Email}", email);

        var user = await _userManager.FindByEmailAsync(email);
        if (user == null)
        {
            return SignInResult.Failed;
        }

        var result = await _signInManager.PasswordSignInAsync(user, password, rememberMe, lockoutOnFailure: true);

        if (result.Succeeded)
        {
            user.LastLoginAt = DateTime.UtcNow;
            await _userManager.UpdateAsync(user);
            _logger.LogInformation("Successful sign in for user: {UserId}", user.Id);
        }
        else
        {
            _logger.LogWarning("Failed sign in attempt for user: {Email}", email);
        }

        return result;
    }

    public async Task SignOutAsync()
    {
        await _signInManager.SignOutAsync();
        _logger.LogInformation("User signed out");
    }

    public async Task<IdentityResult> ChangePasswordAsync(Guid userId, string currentPassword, string newPassword)
    {
        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user == null)
        {
            return IdentityResult.Failed(new IdentityError 
            { 
                Code = "UserNotFound", 
                Description = "User not found." 
            });
        }

        var result = await _userManager.ChangePasswordAsync(user, currentPassword, newPassword);
        
        if (result.Succeeded)
        {
            _logger.LogInformation("Password changed for user: {UserId}", userId);
        }

        return result;
    }

    public async Task<IdentityResult> ResetPasswordAsync(Guid userId, string token, string newPassword)
    {
        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user == null)
        {
            return IdentityResult.Failed(new IdentityError 
            { 
                Code = "UserNotFound", 
                Description = "User not found." 
            });
        }

        var result = await _userManager.ResetPasswordAsync(user, token, newPassword);
        
        if (result.Succeeded)
        {
            _logger.LogInformation("Password reset for user: {UserId}", userId);
        }

        return result;
    }

    public async Task<string> GeneratePasswordResetTokenAsync(Guid userId)
    {
        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user == null)
        {
            throw new ArgumentException("User not found", nameof(userId));
        }

        return await _userManager.GeneratePasswordResetTokenAsync(user);
    }

    public async Task<string> GenerateEmailConfirmationTokenAsync(Guid userId)
    {
        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user == null)
        {
            throw new ArgumentException("User not found", nameof(userId));
        }

        return await _userManager.GenerateEmailConfirmationTokenAsync(user);
    }

    public async Task<IdentityResult> UpdateUserAsync(User user)
    {
        user.ProfileUpdatedAt = DateTime.UtcNow;
        var result = await _userManager.UpdateAsync(user);
        
        if (result.Succeeded)
        {
            _logger.LogInformation("User profile updated: {UserId}", user.Id);
        }

        return result;
    }

    public async Task<IdentityResult> UpdateUserRoleAsync(Guid userId, UserRole newRole)
    {
        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user == null)
        {
            return IdentityResult.Failed(new IdentityError 
            { 
                Code = "UserNotFound", 
                Description = "User not found." 
            });
        }

        var oldRole = user.Role;
        user.Role = newRole;
        
        var result = await _userManager.UpdateAsync(user);
        
        if (result.Succeeded)
        {
            _logger.LogInformation("User role updated from {OldRole} to {NewRole} for user: {UserId}", 
                oldRole, newRole, userId);
            
            await _mediator.Publish(new UserRoleChangedEvent(userId, oldRole, newRole));
        }

        return result;
    }

    public async Task<IdentityResult> UpdateSubscriptionTierAsync(Guid userId, SubscriptionTier newTier)
    {
        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user == null)
        {
            return IdentityResult.Failed(new IdentityError 
            { 
                Code = "UserNotFound", 
                Description = "User not found." 
            });
        }

        var oldTier = user.SubscriptionTier;
        user.SubscriptionTier = newTier;
        
        var result = await _userManager.UpdateAsync(user);
        
        if (result.Succeeded)
        {
            _logger.LogInformation("Subscription tier updated from {OldTier} to {NewTier} for user: {UserId}", 
                oldTier, newTier, userId);
            
            await _mediator.Publish(new UserSubscriptionChangedEvent(userId, oldTier, newTier));
        }

        return result;
    }

    public async Task<User?> GetUserByIdAsync(Guid userId)
    {
        return await _userManager.FindByIdAsync(userId.ToString());
    }

    public async Task<User?> GetUserByEmailAsync(string email)
    {
        return await _userManager.FindByEmailAsync(email);
    }

    public async Task<IdentityResult> DeleteUserAsync(Guid userId)
    {
        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user == null)
        {
            return IdentityResult.Failed(new IdentityError 
            { 
                Code = "UserNotFound", 
                Description = "User not found." 
            });
        }

        // Soft delete - mark as inactive
        user.IsActive = false;
        var result = await _userManager.UpdateAsync(user);
        
        if (result.Succeeded)
        {
            _logger.LogInformation("User account deactivated: {UserId}", userId);
        }

        return result;
    }

    public async Task<bool> IsEmailAvailableAsync(string email)
    {
        var user = await _userManager.FindByEmailAsync(email);
        return user == null;
    }

    public async Task<UserProfile?> GetUserProfileAsync(Guid userId)
    {
        return await _context.UserProfiles
            .FirstOrDefaultAsync(p => p.UserId == userId);
    }

    public async Task<bool> UpdateUserProfileAsync(UserProfile profile)
    {
        try
        {
            profile.UpdatedAt = DateTime.UtcNow;
            _context.UserProfiles.Update(profile);
            await _context.SaveChangesAsync();
            
            _logger.LogInformation("User profile updated: {UserId}", profile.UserId);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to update user profile: {UserId}", profile.UserId);
            return false;
        }
    }
}
