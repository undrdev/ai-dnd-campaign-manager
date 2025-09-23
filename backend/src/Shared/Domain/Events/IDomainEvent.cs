using MediatR;

namespace DndAI.Shared.Domain.Events;

public interface IDomainEvent : INotification
{
    DateTime OccurredOn { get; }
}
