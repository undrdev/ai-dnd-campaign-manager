using DndAI.Services.Auth.Application.Authorization.Requirements;
using DndAI.Shared.Domain.Entities;
using DndAI.Shared.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Logging;
using System.Security.Claims;

namespace DndAI.Services.Auth.Application.Authorization.Handlers;

/// <summary>
/// Authorization handler for character-related operations
/// </summary>
public class CharacterAuthorizationHandler : AuthorizationHandler<CharacterRequirement, Character>
{
    private readonly ILogger<CharacterAuthorizationHandler> _logger;

    public CharacterAuthorizationHandler(ILogger<CharacterAuthorizationHandler> logger)
    {
        _logger = logger;
    }

    protected override Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        CharacterRequirement requirement,
        Character resource)
    {
        var userId = GetUserId(context.User);
        if (userId == null)
        {
            _logger.LogWarning("Authorization failed: User ID not found in claims");
            return Task.CompletedTask;
        }

        var userRole = GetUserRole(context.User);
        
        _logger.LogDebug("Evaluating character authorization for user {UserId}, permission {Permission}, character {CharacterId}", 
            userId, requirement.Permission, resource.Id);

        // Admin users have all permissions
        if (userRole == UserRole.Admin)
        {
            _logger.LogDebug("Authorization granted: User {UserId} is admin", userId);
            context.Succeed(requirement);
            return Task.CompletedTask;
        }

        switch (requirement.Permission)
        {
            case CharacterPermission.View:
                if (CanViewCharacter(userId.Value, resource))
                {
                    context.Succeed(requirement);
                }
                break;
                
            case CharacterPermission.Edit:
            case CharacterPermission.Delete:
            case CharacterPermission.Share:
                if (CanEditCharacter(userId.Value, resource))
                {
                    context.Succeed(requirement);
                }
                break;
        }

        if (!context.HasSucceeded)
        {
            _logger.LogWarning("Authorization denied for user {UserId}, permission {Permission}, character {CharacterId}", 
                userId, requirement.Permission, resource.Id);
        }

        return Task.CompletedTask;
    }

    private bool CanViewCharacter(Guid userId, Character character)
    {
        // Character owner can always view
        if (character.PlayerId == userId)
        {
            return true;
        }

        // Campaign DM can view characters in their campaigns
        if (character.Campaign?.DungeonMasterId == userId)
        {
            return true;
        }

        // Other players in the same campaign can view (if campaign allows it)
        // This could be extended with campaign-specific visibility settings
        if (character.Campaign?.Players?.Any(p => p.PlayerId == userId && p.IsActive) == true)
        {
            return true;
        }

        return false;
    }

    private bool CanEditCharacter(Guid userId, Character character)
    {
        // Only the character owner can edit
        return character.PlayerId == userId;
    }

    private Guid? GetUserId(ClaimsPrincipal user)
    {
        var userIdClaim = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (Guid.TryParse(userIdClaim, out var userId))
        {
            return userId;
        }
        return null;
    }

    private UserRole? GetUserRole(ClaimsPrincipal user)
    {
        var roleClaim = user.FindFirst(CustomClaimTypes.Role)?.Value;
        if (Enum.TryParse<UserRole>(roleClaim, out var role))
        {
            return role;
        }
        return null;
    }
}
