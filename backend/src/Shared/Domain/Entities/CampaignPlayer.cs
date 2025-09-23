using DndAI.Shared.Domain.Common;

namespace DndAI.Shared.Domain.Entities;

public class CampaignPlayer : BaseEntity
{
    public Guid CampaignId { get; set; }
    public Guid PlayerId { get; set; }
    public string Role { get; set; } = "Player"; // Player, Co-DM, Observer
    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
    public bool IsActive { get; set; } = true;
    
    // Navigation properties
    public virtual Campaign Campaign { get; set; } = null!;
    public virtual User Player { get; set; } = null!;
}
