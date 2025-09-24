using DndAI.Shared.Domain.Entities;
using System.Security.Claims;

namespace DndAI.Services.Auth.Application.Interfaces;

/// <summary>
/// Service for generating and validating JWT tokens
/// </summary>
public interface IJwtTokenService
{
    /// <summary>
    /// Generates an access token for the user
    /// </summary>
    Task<string> GenerateAccessTokenAsync(User user);

    /// <summary>
    /// Generates a refresh token for the user
    /// </summary>
    Task<string> GenerateRefreshTokenAsync(User user);

    /// <summary>
    /// Validates an access token and returns the claims principal
    /// </summary>
    Task<ClaimsPrincipal?> ValidateAccessTokenAsync(string token);

    /// <summary>
    /// Validates a refresh token and returns the user ID
    /// </summary>
    Task<Guid?> ValidateRefreshTokenAsync(string refreshToken);

    /// <summary>
    /// Revokes a refresh token
    /// </summary>
    Task RevokeRefreshTokenAsync(string refreshToken);

    /// <summary>
    /// Gets the user ID from an access token
    /// </summary>
    Task<Guid?> GetUserIdFromTokenAsync(string token);

    /// <summary>
    /// Gets the token expiration time
    /// </summary>
    DateTime GetTokenExpiration(string token);

    /// <summary>
    /// Generates claims for a user
    /// </summary>
    Task<IEnumerable<Claim>> GenerateClaimsAsync(User user);
}
