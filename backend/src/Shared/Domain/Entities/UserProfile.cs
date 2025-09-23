using DndAI.Shared.Domain.Common;

namespace DndAI.Shared.Domain.Entities;

/// <summary>
/// Extended profile information for a user
/// </summary>
public class UserProfile : BaseEntity
{
    /// <summary>
    /// The user this profile belongs to
    /// </summary>
    public required Guid UserId { get; set; }
    
    /// <summary>
    /// User's bio or description
    /// </summary>
    public string? Bio { get; set; }
    
    /// <summary>
    /// User's preferred timezone
    /// </summary>
    public string? Timezone { get; set; }
    
    /// <summary>
    /// User's preferred language/locale
    /// </summary>
    public string? PreferredLanguage { get; set; } = "en-US";
    
    /// <summary>
    /// Whether to receive email notifications
    /// </summary>
    public bool EmailNotifications { get; set; } = true;
    
    /// <summary>
    /// Whether to receive push notifications
    /// </summary>
    public bool PushNotifications { get; set; } = true;
    
    /// <summary>
    /// User's experience level with D&D
    /// </summary>
    public ExperienceLevel ExperienceLevel { get; set; } = ExperienceLevel.Beginner;
    
    /// <summary>
    /// User's favorite D&D classes (comma-separated)
    /// </summary>
    public string? FavoriteClasses { get; set; }
    
    /// <summary>
    /// User's preferred play style
    /// </summary>
    public string? PlayStyle { get; set; }
    
    /// <summary>
    /// Social media or website links (JSON)
    /// </summary>
    public string? SocialLinks { get; set; }
    
    /// <summary>
    /// Whether the profile is public
    /// </summary>
    public bool IsPublic { get; set; } = false;
    
    // Navigation properties
    
    /// <summary>
    /// The user this profile belongs to
    /// </summary>
    public virtual User User { get; set; } = null!;
}

/// <summary>
/// User's experience level with D&D
/// </summary>
public enum ExperienceLevel
{
    Beginner = 1,
    Intermediate = 2,
    Advanced = 3,
    Expert = 4
}
