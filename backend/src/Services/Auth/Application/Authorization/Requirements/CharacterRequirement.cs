using Microsoft.AspNetCore.Authorization;

namespace DndAI.Services.Auth.Application.Authorization.Requirements;

/// <summary>
/// Authorization requirement for character-related operations
/// </summary>
public class CharacterRequirement : IAuthorizationRequirement
{
    public CharacterPermission Permission { get; }
    
    public CharacterRequirement(CharacterPermission permission)
    {
        Permission = permission;
    }
}

/// <summary>
/// Permissions that can be granted for character operations
/// </summary>
public enum CharacterPermission
{
    /// <summary>
    /// Can view character details and stats
    /// </summary>
    View,
    
    /// <summary>
    /// Can edit character details, stats, and equipment
    /// </summary>
    Edit,
    
    /// <summary>
    /// Can delete the character permanently
    /// </summary>
    Delete,
    
    /// <summary>
    /// Can share character with other players or campaigns
    /// </summary>
    Share
}
