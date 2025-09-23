using DndAI.Shared.Application.Interfaces;
using DndAI.Shared.Domain.Common;
using DndAI.Shared.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace DndAI.Shared.Infrastructure.Persistence;

public class ApplicationDbContext : DbContext, IApplicationDbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<UserProfile> UserProfiles => Set<UserProfile>();
    public DbSet<Campaign> Campaigns => Set<Campaign>();
    public DbSet<Character> Characters => Set<Character>();
    public DbSet<CampaignPlayer> CampaignPlayers => Set<CampaignPlayer>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Configure User entity (extends IdentityUser<Guid>)
        modelBuilder.Entity<User>(entity =>
        {
            entity.Property(e => e.FirstName).HasMaxLength(50).IsRequired();
            entity.Property(e => e.LastName).HasMaxLength(50).IsRequired();
            entity.Property(e => e.AvatarUrl).HasMaxLength(500);
            entity.Property(e => e.Role).HasConversion<int>().IsRequired();
            entity.Property(e => e.SubscriptionTier).HasConversion<int>().IsRequired();
            
            // Additional indexes
            entity.HasIndex(e => e.Role);
            entity.HasIndex(e => e.SubscriptionTier);
            entity.HasIndex(e => e.IsActive);
            entity.HasIndex(e => e.CreatedAt);
        });

        // Configure UserProfile entity
        modelBuilder.Entity<UserProfile>(entity =>
        {
            entity.Property(e => e.Bio).HasMaxLength(1000);
            entity.Property(e => e.Timezone).HasMaxLength(50);
            entity.Property(e => e.PreferredLanguage).HasMaxLength(10).HasDefaultValue("en-US");
            entity.Property(e => e.ExperienceLevel).HasConversion<int>().IsRequired();
            entity.Property(e => e.FavoriteClasses).HasMaxLength(200);
            entity.Property(e => e.PlayStyle).HasMaxLength(100);
            entity.Property(e => e.SocialLinks).HasColumnType("jsonb");
            
            // Relationships
            entity.HasOne(e => e.User)
                .WithOne(u => u.Profile)
                .HasForeignKey<UserProfile>(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
                
            // Indexes
            entity.HasIndex(e => e.UserId).IsUnique();
            entity.HasIndex(e => e.ExperienceLevel);
            entity.HasIndex(e => e.IsPublic);
        });

        // Configure Campaign entity
        modelBuilder.Entity<Campaign>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).HasMaxLength(200).IsRequired();
            entity.Property(e => e.Description).HasMaxLength(2000);
            entity.Property(e => e.Setting).HasMaxLength(500);
            entity.Property(e => e.SystemVersion).HasMaxLength(50);
            
            entity.HasOne(e => e.DungeonMaster)
                  .WithMany(u => u.OwnedCampaigns)
                  .HasForeignKey(e => e.DungeonMasterId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // Configure Character entity
        modelBuilder.Entity<Character>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).HasMaxLength(100).IsRequired();
            entity.Property(e => e.Class).HasMaxLength(50).IsRequired();
            entity.Property(e => e.Race).HasMaxLength(50).IsRequired();
            entity.Property(e => e.Background).HasMaxLength(100);
            entity.Property(e => e.Backstory).HasMaxLength(5000);
            entity.Property(e => e.PersonalityTraits).HasMaxLength(1000);
            entity.Property(e => e.Ideals).HasMaxLength(1000);
            entity.Property(e => e.Bonds).HasMaxLength(1000);
            entity.Property(e => e.Flaws).HasMaxLength(1000);
            
            entity.HasOne(e => e.Player)
                  .WithMany(u => u.Characters)
                  .HasForeignKey(e => e.PlayerId)
                  .OnDelete(DeleteBehavior.Cascade);
                  
            entity.HasOne(e => e.Campaign)
                  .WithMany(c => c.Characters)
                  .HasForeignKey(e => e.CampaignId)
                  .OnDelete(DeleteBehavior.SetNull);
        });

        // Configure CampaignPlayer entity
        modelBuilder.Entity<CampaignPlayer>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Role).HasConversion<int>().IsRequired();
            entity.Property(e => e.Notes).HasMaxLength(500);
            
            entity.HasOne(e => e.Campaign)
                  .WithMany(c => c.Players)
                  .HasForeignKey(e => e.CampaignId)
                  .OnDelete(DeleteBehavior.Cascade);
                  
            entity.HasOne(e => e.Player)
                  .WithMany(u => u.CampaignMemberships)
                  .HasForeignKey(e => e.PlayerId)
                  .OnDelete(DeleteBehavior.Cascade);
                  
            entity.HasIndex(e => new { e.CampaignId, e.PlayerId }).IsUnique();
        });
    }

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        foreach (var entry in ChangeTracker.Entries<AuditableEntity>())
        {
            switch (entry.State)
            {
                case EntityState.Added:
                    entry.Entity.CreatedAt = DateTime.UtcNow;
                    break;
                case EntityState.Modified:
                    entry.Entity.UpdatedAt = DateTime.UtcNow;
                    break;
            }
        }

        return await base.SaveChangesAsync(cancellationToken);
    }
}
