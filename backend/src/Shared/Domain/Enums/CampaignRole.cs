namespace DndAI.Shared.Domain.Enums;

/// <summary>
/// User's role within a specific campaign
/// </summary>
public enum CampaignRole
{
    /// <summary>
    /// Player in the campaign
    /// </summary>
    Player = 1,
    
    /// <summary>
    /// Game Master of the campaign
    /// </summary>
    GameMaster = 2,
    
    /// <summary>
    /// Co-Game Master with limited GM privileges
    /// </summary>
    CoGameMaster = 3,
    
    /// <summary>
    /// Observer who can view but not participate
    /// </summary>
    Observer = 4
}
