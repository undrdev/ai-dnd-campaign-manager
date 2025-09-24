using DndAI.Services.Auth.Application.Authorization.Requirements;
using DndAI.Shared.Domain.Entities;
using DndAI.Shared.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Logging;
using System.Security.Claims;

namespace DndAI.Services.Auth.Application.Authorization.Handlers;

/// <summary>
/// Authorization handler for campaign-related operations
/// </summary>
public class CampaignAuthorizationHandler : AuthorizationHandler<CampaignRequirement, Campaign>
{
    private readonly ILogger<CampaignAuthorizationHandler> _logger;

    public CampaignAuthorizationHandler(ILogger<CampaignAuthorizationHandler> logger)
    {
        _logger = logger;
    }

    protected override Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        CampaignRequirement requirement,
        Campaign resource)
    {
        var userId = GetUserId(context.User);
        if (userId == null)
        {
            _logger.LogWarning("Authorization failed: User ID not found in claims");
            return Task.CompletedTask;
        }

        var userRole = GetUserRole(context.User);
        
        _logger.LogDebug("Evaluating campaign authorization for user {UserId}, permission {Permission}, campaign {CampaignId}", 
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
            case CampaignPermission.View:
                if (CanViewCampaign(userId.Value, resource))
                {
                    context.Succeed(requirement);
                }
                break;
                
            case CampaignPermission.Edit:
            case CampaignPermission.Invite:
            case CampaignPermission.Manage:
                if (CanEditCampaign(userId.Value, resource))
                {
                    context.Succeed(requirement);
                }
                break;
                
            case CampaignPermission.Delete:
                if (CanDeleteCampaign(userId.Value, resource))
                {
                    context.Succeed(requirement);
                }
                break;
        }

        if (!context.HasSucceeded)
        {
            _logger.LogWarning("Authorization denied for user {UserId}, permission {Permission}, campaign {CampaignId}", 
                userId, requirement.Permission, resource.Id);
        }

        return Task.CompletedTask;
    }

    private bool CanViewCampaign(Guid userId, Campaign campaign)
    {
        // Campaign owner can always view
        if (campaign.DungeonMasterId == userId)
        {
            return true;
        }

        // Players in the campaign can view
        if (campaign.Players?.Any(p => p.PlayerId == userId && p.IsActive) == true)
        {
            return true;
        }

        return false;
    }

    private bool CanEditCampaign(Guid userId, Campaign campaign)
    {
        // Only the campaign owner (DM) can edit
        return campaign.DungeonMasterId == userId;
    }

    private bool CanDeleteCampaign(Guid userId, Campaign campaign)
    {
        // Only the campaign owner (DM) can delete
        return campaign.DungeonMasterId == userId;
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
