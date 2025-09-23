using DndAI.Shared.Domain.Enums;

namespace DndAI.Shared.Domain.Events;

public class UserRoleChangedEvent : DomainEvent
{
    public UserRoleChangedEvent(Guid userId, UserRole oldRole, UserRole newRole)
    {
        UserId = userId;
        OldRole = oldRole;
        NewRole = newRole;
    }

    public Guid UserId { get; }
    public UserRole OldRole { get; }
    public UserRole NewRole { get; }
}
