using DndAI.Shared.Domain.Enums;

namespace DndAI.Shared.Domain.Events;

public class UserSubscriptionChangedEvent : DomainEvent
{
    public UserSubscriptionChangedEvent(Guid userId, SubscriptionTier oldTier, SubscriptionTier newTier)
    {
        UserId = userId;
        OldTier = oldTier;
        NewTier = newTier;
    }

    public Guid UserId { get; }
    public SubscriptionTier OldTier { get; }
    public SubscriptionTier NewTier { get; }
}