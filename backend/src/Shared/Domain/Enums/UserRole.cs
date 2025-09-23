namespace DndAI.Shared.Domain.Enums;

/// <summary>
/// Defines the different roles a user can have in the system
/// </summary>
public enum UserRole
{
    /// <summary>
    /// Standard player who can join campaigns and manage characters
    /// </summary>
    Player = 1,
    
    /// <summary>
    /// Game Master who can create and manage campaigns
    /// </summary>
    GameMaster = 2,
    
    /// <summary>
    /// System administrator with full access
    /// </summary>
    Admin = 3
}
