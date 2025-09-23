using DndAI.Shared.Domain.Common;

namespace DndAI.Shared.Domain.Entities;

public class User : BaseEntity
{
    public string Email { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? ProfileImageUrl { get; set; }
    public bool IsEmailVerified { get; set; }
    public DateTime? LastLoginAt { get; set; }
    public string SubscriptionTier { get; set; } = "Free";
    public bool IsActive { get; set; } = true;
    
    // Navigation properties
    public virtual ICollection<Campaign> Campaigns { get; set; } = new List<Campaign>();
    public virtual ICollection<Character> Characters { get; set; } = new List<Character>();
}
