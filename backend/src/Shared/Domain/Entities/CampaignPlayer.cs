using DndAI.Shared.Domain.Common;
using DndAI.Shared.Domain.Enums;

namespace DndAI.Shared.Domain.Entities;

public class CampaignPlayer : BaseEntity
{
    public Guid CampaignId { get; set; }
    public Guid PlayerId { get; set; }
    public CampaignRole Role { get; set; } = CampaignRole.Player;
    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
    public bool IsActive { get; set; } = true;
    public string? Notes { get; set; }
    
    // Navigation properties
    public virtual Campaign Campaign { get; set; } = null!;
    public virtual User Player { get; set; } = null!;
}
