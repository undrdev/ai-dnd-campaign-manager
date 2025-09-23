using DndAI.Shared.Domain.Common;

namespace DndAI.Shared.Domain.Entities;

public class Campaign : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public string Setting { get; set; } = string.Empty;
    public string SystemVersion { get; set; } = "D&D 5e";
    public bool IsActive { get; set; } = true;
    public DateTime? LastSessionAt { get; set; }
    public Guid DungeonMasterId { get; set; }
    
    // Navigation properties
    public virtual User DungeonMaster { get; set; } = null!;
    public virtual ICollection<Character> Characters { get; set; } = new List<Character>();
    public virtual ICollection<CampaignPlayer> Players { get; set; } = new List<CampaignPlayer>();
}
