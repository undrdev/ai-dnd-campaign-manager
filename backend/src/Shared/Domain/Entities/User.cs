using Microsoft.AspNetCore.Identity;
using DndAI.Shared.Domain.Enums;
using DndAI.Shared.Domain.Common;

namespace DndAI.Shared.Domain.Entities;

/// <summary>
/// Represents a user in the D&D Campaign Manager system
/// Extends IdentityUser to integrate with ASP.NET Core Identity
/// </summary>
public class User : IdentityUser<Guid>
{
    /// <summary>
    /// User's first name
    /// </summary>
    public required string FirstName { get; set; }
    
    /// <summary>
    /// User's last name
    /// </summary>
    public required string LastName { get; set; }
    
    /// <summary>
    /// Optional URL to user's avatar image
    /// </summary>
    public string? AvatarUrl { get; set; }
    
    /// <summary>
    /// User's role in the system (Player, GameMaster, Admin)
    /// </summary>
    public UserRole Role { get; set; } = UserRole.Player;
    
    /// <summary>
    /// User's subscription tier (Free, Premium, Pro)
    /// </summary>
    public SubscriptionTier SubscriptionTier { get; set; } = SubscriptionTier.Free;
    
    /// <summary>
    /// When the user account was created
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    /// <summary>
    /// Last time the user logged in
    /// </summary>
    public DateTime? LastLoginAt { get; set; }
    
    /// <summary>
    /// Whether the user account is active
    /// </summary>
    public bool IsActive { get; set; } = true;
    
    /// <summary>
    /// When the user last updated their profile
    /// </summary>
    public DateTime? ProfileUpdatedAt { get; set; }
    
    /// <summary>
    /// Terms of service acceptance timestamp
    /// </summary>
    public DateTime? TermsAcceptedAt { get; set; }
    
    /// <summary>
    /// Privacy policy acceptance timestamp
    /// </summary>
    public DateTime? PrivacyPolicyAcceptedAt { get; set; }
    
    // Navigation properties
    
    /// <summary>
    /// Campaigns this user owns as DM
    /// </summary>
    public virtual ICollection<Campaign> OwnedCampaigns { get; set; } = new List<Campaign>();
    
    /// <summary>
    /// Characters created by this user
    /// </summary>
    public virtual ICollection<Character> Characters { get; set; } = new List<Character>();
    
    /// <summary>
    /// Campaign memberships (as player or co-DM)
    /// </summary>
    public virtual ICollection<CampaignPlayer> CampaignMemberships { get; set; } = new List<CampaignPlayer>();
    
    /// <summary>
    /// User's detailed profile information
    /// </summary>
    public virtual UserProfile? Profile { get; set; }
    
    // Computed properties
    
    /// <summary>
    /// User's full name
    /// </summary>
    public string FullName => $"{FirstName} {LastName}";
    
    /// <summary>
    /// Whether the user has accepted current terms
    /// </summary>
    public bool HasAcceptedCurrentTerms => TermsAcceptedAt.HasValue;
    
    /// <summary>
    /// Whether the user is a Game Master or Admin
    /// </summary>
    public bool CanCreateCampaigns => Role == UserRole.GameMaster || Role == UserRole.Admin;
    
    /// <summary>
    /// Whether the user has administrative privileges
    /// </summary>
    public bool IsAdmin => Role == UserRole.Admin;
}
