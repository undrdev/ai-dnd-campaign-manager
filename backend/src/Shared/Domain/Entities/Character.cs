using DndAI.Shared.Domain.Common;

namespace DndAI.Shared.Domain.Entities;

public class Character : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Class { get; set; } = string.Empty;
    public string Race { get; set; } = string.Empty;
    public int Level { get; set; } = 1;
    public string Background { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public string? Backstory { get; set; }
    public string? PersonalityTraits { get; set; }
    public string? Ideals { get; set; }
    public string? Bonds { get; set; }
    public string? Flaws { get; set; }
    
    // Stats
    public int Strength { get; set; }
    public int Dexterity { get; set; }
    public int Constitution { get; set; }
    public int Intelligence { get; set; }
    public int Wisdom { get; set; }
    public int Charisma { get; set; }
    
    // Foreign keys
    public Guid PlayerId { get; set; }
    public Guid? CampaignId { get; set; }
    
    // Navigation properties
    public virtual User Player { get; set; } = null!;
    public virtual Campaign? Campaign { get; set; }
}
