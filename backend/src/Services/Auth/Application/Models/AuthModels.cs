using DndAI.Shared.Domain.Enums;

namespace DndAI.Services.Auth.Application.Models;

/// <summary>
/// User registration request model
/// </summary>
public record RegisterRequest(
    string Email,
    string Password,
    string ConfirmPassword,
    string FirstName,
    string LastName,
    bool AcceptTerms,
    UserRole Role = UserRole.Player,
    SubscriptionTier SubscriptionTier = SubscriptionTier.Free);

/// <summary>
/// User login request model
/// </summary>
public record LoginRequest(
    string Email,
    string Password,
    bool RememberMe = false);

/// <summary>
/// Password reset request model
/// </summary>
public record ForgotPasswordRequest(string Email);

/// <summary>
/// Password reset confirmation model
/// </summary>
public record ResetPasswordRequest(
    string Email,
    string Token,
    string NewPassword,
    string ConfirmPassword);

/// <summary>
/// Token refresh request model
/// </summary>
public record RefreshTokenRequest(string RefreshToken);

/// <summary>
/// Email verification request model
/// </summary>
public record VerifyEmailRequest(
    Guid UserId,
    string Token);

/// <summary>
/// Authentication response model
/// </summary>
public record AuthResponse(
    bool Success,
    string Message,
    string? AccessToken = null,
    string? RefreshToken = null,
    DateTime? ExpiresAt = null,
    UserDto? User = null,
    Dictionary<string, string[]>? Errors = null);

/// <summary>
/// User data transfer object
/// </summary>
public record UserDto(
    Guid Id,
    string Email,
    string UserName,
    string FirstName,
    string LastName,
    UserRole Role,
    SubscriptionTier SubscriptionTier,
    bool IsActive,
    bool EmailConfirmed,
    DateTime CreatedAt,
    DateTime? LastLoginAt);

/// <summary>
/// Standard error response model
/// </summary>
public record ErrorResponse(
    string Message,
    string Code,
    Dictionary<string, string[]>? Errors = null);

/// <summary>
/// Success response model
/// </summary>
public record SuccessResponse(
    bool Success,
    string Message,
    object? Data = null);

/// <summary>
/// Authentication error codes
/// </summary>
public static class AuthErrorCodes
{
    public const string InvalidCredentials = "AUTH001";
    public const string AccountNotVerified = "AUTH002";
    public const string AccountLocked = "AUTH003";
    public const string InvalidToken = "AUTH004";
    public const string TokenExpired = "AUTH005";
    public const string EmailAlreadyExists = "AUTH006";
    public const string UserNotFound = "AUTH007";
    public const string InvalidInput = "AUTH008";
    public const string TooManyAttempts = "AUTH009";
    public const string TermsNotAccepted = "AUTH010";
}
