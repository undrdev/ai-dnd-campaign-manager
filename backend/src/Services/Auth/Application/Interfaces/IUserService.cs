using DndAI.Shared.Domain.Entities;
using DndAI.Shared.Domain.Enums;
using Microsoft.AspNetCore.Identity;

namespace DndAI.Services.Auth.Application.Interfaces;

/// <summary>
/// Service for user management operations
/// </summary>
public interface IUserService
{
    /// <summary>
    /// Registers a new user
    /// </summary>
    Task<IdentityResult> RegisterUserAsync(RegisterUserRequest request);
    
    /// <summary>
    /// Confirms user email
    /// </summary>
    Task<IdentityResult> ConfirmEmailAsync(Guid userId, string token);
    
    /// <summary>
    /// Authenticates a user
    /// </summary>
    Task<SignInResult> SignInAsync(string email, string password, bool rememberMe = false);
    
    /// <summary>
    /// Signs out the current user
    /// </summary>
    Task SignOutAsync();
    
    /// <summary>
    /// Changes user password
    /// </summary>
    Task<IdentityResult> ChangePasswordAsync(Guid userId, string currentPassword, string newPassword);
    
    /// <summary>
    /// Resets user password
    /// </summary>
    Task<IdentityResult> ResetPasswordAsync(Guid userId, string token, string newPassword);
    
    /// <summary>
    /// Generates password reset token
    /// </summary>
    Task<string> GeneratePasswordResetTokenAsync(Guid userId);
    
    /// <summary>
    /// Generates email confirmation token
    /// </summary>
    Task<string> GenerateEmailConfirmationTokenAsync(Guid userId);
    
    /// <summary>
    /// Updates user profile
    /// </summary>
    Task<IdentityResult> UpdateUserAsync(User user);
    
    /// <summary>
    /// Updates user role
    /// </summary>
    Task<IdentityResult> UpdateUserRoleAsync(Guid userId, UserRole newRole);
    
    /// <summary>
    /// Updates subscription tier
    /// </summary>
    Task<IdentityResult> UpdateSubscriptionTierAsync(Guid userId, SubscriptionTier newTier);
    
    /// <summary>
    /// Gets user by ID
    /// </summary>
    Task<User?> GetUserByIdAsync(Guid userId);
    
    /// <summary>
    /// Gets user by email
    /// </summary>
    Task<User?> GetUserByEmailAsync(string email);
    
    /// <summary>
    /// Deletes user account
    /// </summary>
    Task<IdentityResult> DeleteUserAsync(Guid userId);
    
    /// <summary>
    /// Checks if email is available
    /// </summary>
    Task<bool> IsEmailAvailableAsync(string email);
    
    /// <summary>
    /// Gets user's profile
    /// </summary>
    Task<UserProfile?> GetUserProfileAsync(Guid userId);
    
    /// <summary>
    /// Updates user profile
    /// </summary>
    Task<bool> UpdateUserProfileAsync(UserProfile profile);
}

/// <summary>
/// Request model for user registration
/// </summary>
public record RegisterUserRequest(
    string FirstName,
    string LastName,
    string Email,
    string Password,
    UserRole Role = UserRole.Player,
    SubscriptionTier SubscriptionTier = SubscriptionTier.Free);
