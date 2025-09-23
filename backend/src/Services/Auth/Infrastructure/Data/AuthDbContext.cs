using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using DndAI.Shared.Domain.Entities;
using DndAI.Shared.Domain.Enums;

namespace DndAI.Services.Auth.Infrastructure.Data;

/// <summary>
/// Database context for the Authentication service
/// Extends IdentityDbContext to provide ASP.NET Core Identity functionality
/// </summary>
public class AuthDbContext : IdentityDbContext<User, IdentityRole<Guid>, Guid>
{
    public AuthDbContext(DbContextOptions<AuthDbContext> options) : base(options)
    {
    }

    // DbSets for domain entities
    public DbSet<UserProfile> UserProfiles { get; set; }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // Configure User entity
        builder.Entity<User>(entity =>
        {
            entity.ToTable("Users");
            
            // Configure properties
            entity.Property(e => e.FirstName)
                .IsRequired()
                .HasMaxLength(50);
                
            entity.Property(e => e.LastName)
                .IsRequired()
                .HasMaxLength(50);
                
            entity.Property(e => e.AvatarUrl)
                .HasMaxLength(500);
                
            entity.Property(e => e.Role)
                .HasConversion<int>()
                .IsRequired();
                
            entity.Property(e => e.SubscriptionTier)
                .HasConversion<int>()
                .IsRequired();
                
            entity.Property(e => e.CreatedAt)
                .IsRequired()
                .HasDefaultValueSql("CURRENT_TIMESTAMP");
                
            // Indexes
            entity.HasIndex(e => e.Email).IsUnique();
            entity.HasIndex(e => e.Role);
            entity.HasIndex(e => e.SubscriptionTier);
            entity.HasIndex(e => e.IsActive);
            entity.HasIndex(e => e.CreatedAt);
        });

        // Configure UserProfile entity
        builder.Entity<UserProfile>(entity =>
        {
            entity.ToTable("UserProfiles");
            
            entity.Property(e => e.Bio)
                .HasMaxLength(1000);
                
            entity.Property(e => e.Timezone)
                .HasMaxLength(50);
                
            entity.Property(e => e.PreferredLanguage)
                .HasMaxLength(10)
                .HasDefaultValue("en-US");
                
            entity.Property(e => e.ExperienceLevel)
                .HasConversion<int>()
                .IsRequired();
                
            entity.Property(e => e.FavoriteClasses)
                .HasMaxLength(200);
                
            entity.Property(e => e.PlayStyle)
                .HasMaxLength(100);
                
            entity.Property(e => e.SocialLinks)
                .HasColumnType("jsonb"); // PostgreSQL JSONB for social links
                
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

        // Configure Identity tables with custom names
        builder.Entity<IdentityRole<Guid>>().ToTable("Roles");
        builder.Entity<IdentityUserRole<Guid>>().ToTable("UserRoles");
        builder.Entity<IdentityUserClaim<Guid>>().ToTable("UserClaims");
        builder.Entity<IdentityUserLogin<Guid>>().ToTable("UserLogins");
        builder.Entity<IdentityUserToken<Guid>>().ToTable("UserTokens");
        builder.Entity<IdentityRoleClaim<Guid>>().ToTable("RoleClaims");

        // Seed default roles
        SeedRoles(builder);
    }

    private static void SeedRoles(ModelBuilder builder)
    {
        var roles = new[]
        {
            new IdentityRole<Guid>
            {
                Id = Guid.NewGuid(),
                Name = "Player",
                NormalizedName = "PLAYER",
                ConcurrencyStamp = Guid.NewGuid().ToString()
            },
            new IdentityRole<Guid>
            {
                Id = Guid.NewGuid(),
                Name = "GameMaster",
                NormalizedName = "GAMEMASTER",
                ConcurrencyStamp = Guid.NewGuid().ToString()
            },
            new IdentityRole<Guid>
            {
                Id = Guid.NewGuid(),
                Name = "Admin",
                NormalizedName = "ADMIN",
                ConcurrencyStamp = Guid.NewGuid().ToString()
            }
        };

        builder.Entity<IdentityRole<Guid>>().HasData(roles);
    }
}
