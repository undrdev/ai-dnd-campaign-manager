namespace DndAI.Shared.Domain.Events;

public class UserEmailVerifiedEvent : DomainEvent
{
    public UserEmailVerifiedEvent(Guid userId, string email)
    {
        UserId = userId;
        Email = email;
    }

    public Guid UserId { get; }
    public string Email { get; }
}
