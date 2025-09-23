using DndAI.Shared.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace DndAI.Shared.Application.Interfaces;

public interface IApplicationDbContext
{
    DbSet<User> Users { get; }
    DbSet<Campaign> Campaigns { get; }
    DbSet<Character> Characters { get; }
    DbSet<CampaignPlayer> CampaignPlayers { get; }
    
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
