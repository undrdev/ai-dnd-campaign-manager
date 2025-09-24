using Microsoft.AspNetCore.Authorization;

namespace DndAI.Services.Auth.Application.Authorization.Requirements;

/// <summary>
/// Authorization requirement for campaign-related operations
/// </summary>
public class CampaignRequirement : IAuthorizationRequirement
{
    public CampaignPermission Permission { get; }
    
    public CampaignRequirement(CampaignPermission permission)
    {
        Permission = permission;
    }
}

/// <summary>
/// Permissions that can be granted for campaign operations
/// </summary>
public enum CampaignPermission
{
    /// <summary>
    /// Can view campaign details and participate in sessions
    /// </summary>
    View,
    
    /// <summary>
    /// Can edit campaign settings, add content, manage sessions
    /// </summary>
    Edit,
    
    /// <summary>
    /// Can delete the campaign permanently
    /// </summary>
    Delete,
    
    /// <summary>
    /// Can invite players to join the campaign
    /// </summary>
    Invite,
    
    /// <summary>
    /// Can manage campaign members, roles, and permissions
    /// </summary>
    Manage
}
