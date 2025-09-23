namespace DndAI.Shared.Domain.Events;

public class UserRegisteredEvent : DomainEvent
{
    public UserRegisteredEvent(Guid userId, string email)
    {
        UserId = userId;
        Email = email;
    }

    public Guid UserId { get; }
    public string Email { get; }
}
