# Entity Framework Setup

## Overview
This document establishes comprehensive Entity Framework Core standards for the D&D AI Campaign Management System, including DbContext configuration, repository patterns, and migration strategies.

---

## DbContext Configuration

### Base DbContext Setup
```csharp
public class ApplicationDbContext : DbContext
{
    private readonly ICurrentUserService _currentUserService;
    private readonly IDateTimeService _dateTimeService;

    public ApplicationDbContext(
        DbContextOptions<ApplicationDbContext> options,
        ICurrentUserService currentUserService,
        IDateTimeService dateTimeService) : base(options)
    {
        _currentUserService = currentUserService;
        _dateTimeService = dateTimeService;
    }

    // DbSets
    public DbSet<Campaign> Campaigns { get; set; }
    public DbSet<Character> Characters { get; set; }
    public DbSet<NPC> NPCs { get; set; }
    public DbSet<User> Users { get; set; }
    public DbSet<Session> Sessions { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Apply all configurations from assembly
        modelBuilder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());

        // Configure soft delete global filter
        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            if (typeof(ISoftDeletable).IsAssignableFrom(entityType.ClrType))
            {
                var method = typeof(ApplicationDbContext)
                    .GetMethod(nameof(SetSoftDeleteFilter), BindingFlags.NonPublic | BindingFlags.Static)
                    ?.MakeGenericMethod(entityType.ClrType);
                
                method?.Invoke(null, new object[] { modelBuilder });
            }
        }
    }

    private static void SetSoftDeleteFilter<T>(ModelBuilder modelBuilder) where T : class, ISoftDeletable
    {
        modelBuilder.Entity<T>().HasQueryFilter(e => !e.IsDeleted);
    }

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        // Handle audit fields
        foreach (var entry in ChangeTracker.Entries<IAuditable>())
        {
            switch (entry.State)
            {
                case EntityState.Added:
                    entry.Entity.CreatedAt = _dateTimeService.UtcNow;
                    entry.Entity.CreatedBy = _currentUserService.UserId;
                    entry.Entity.UpdatedAt = _dateTimeService.UtcNow;
                    entry.Entity.UpdatedBy = _currentUserService.UserId;
                    break;

                case EntityState.Modified:
                    entry.Entity.UpdatedAt = _dateTimeService.UtcNow;
                    entry.Entity.UpdatedBy = _currentUserService.UserId;
                    break;
            }
        }

        // Handle soft delete
        foreach (var entry in ChangeTracker.Entries<ISoftDeletable>())
        {
            if (entry.State == EntityState.Deleted)
            {
                entry.State = EntityState.Modified;
                entry.Entity.IsDeleted = true;
                entry.Entity.DeletedAt = _dateTimeService.UtcNow;
            }
        }

        return await base.SaveChangesAsync(cancellationToken);
    }
}
```

### Entity Base Classes
```csharp
public interface IAuditable
{
    DateTime CreatedAt { get; set; }
    string CreatedBy { get; set; }
    DateTime UpdatedAt { get; set; }
    string UpdatedBy { get; set; }
}

public interface ISoftDeletable
{
    bool IsDeleted { get; set; }
    DateTime? DeletedAt { get; set; }
}

public abstract class BaseEntity : IAuditable
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public DateTime CreatedAt { get; set; }
    public string CreatedBy { get; set; }
    public DateTime UpdatedAt { get; set; }
    public string UpdatedBy { get; set; }
}

public abstract class SoftDeletableEntity : BaseEntity, ISoftDeletable
{
    public bool IsDeleted { get; set; }
    public DateTime? DeletedAt { get; set; }
}
```

### Entity Configurations
```csharp
public class CampaignConfiguration : IEntityTypeConfiguration<Campaign>
{
    public void Configure(EntityTypeBuilder<Campaign> builder)
    {
        builder.ToTable("campaigns");
        
        builder.HasKey(c => c.Id);
        builder.Property(c => c.Id).HasColumnName("id").HasMaxLength(50);
        
        builder.Property(c => c.Name)
            .HasColumnName("name")
            .HasMaxLength(200)
            .IsRequired();
            
        builder.Property(c => c.Description)
            .HasColumnName("description")
            .HasMaxLength(2000);
            
        builder.Property(c => c.Status)
            .HasColumnName("status")
            .HasConversion<string>()
            .HasMaxLength(50);
            
        builder.Property(c => c.MaxPlayers)
            .HasColumnName("max_players")
            .HasDefaultValue(4);
            
        builder.Property(c => c.Settings)
            .HasColumnName("settings")
            .HasConversion(
                v => JsonSerializer.Serialize(v, (JsonSerializerOptions)null),
                v => JsonSerializer.Deserialize<CampaignSettings>(v, (JsonSerializerOptions)null)
            );

        // Relationships
        builder.HasOne(c => c.DungeonMaster)
            .WithMany(u => u.DungeonMasterCampaigns)
            .HasForeignKey(c => c.DungeonMasterId)
            .OnDelete(DeleteBehavior.Restrict);
            
        builder.HasMany(c => c.Characters)
            .WithOne(ch => ch.Campaign)
            .HasForeignKey(ch => ch.CampaignId)
            .OnDelete(DeleteBehavior.Cascade);

        // Indexes
        builder.HasIndex(c => c.DungeonMasterId).HasDatabaseName("ix_campaigns_dungeon_master_id");
        builder.HasIndex(c => c.Status).HasDatabaseName("ix_campaigns_status");
        
        // Audit fields
        builder.Property(c => c.CreatedAt).HasColumnName("created_at");
        builder.Property(c => c.CreatedBy).HasColumnName("created_by").HasMaxLength(50);
        builder.Property(c => c.UpdatedAt).HasColumnName("updated_at");
        builder.Property(c => c.UpdatedBy).HasColumnName("updated_by").HasMaxLength(50);
    }
}
```

---

## Repository Pattern Implementation

### Generic Repository Interface
```csharp
public interface IRepository<T> where T : BaseEntity
{
    Task<T> GetByIdAsync(string id, CancellationToken cancellationToken = default);
    Task<IEnumerable<T>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<IEnumerable<T>> FindAsync(Expression<Func<T, bool>> predicate, CancellationToken cancellationToken = default);
    Task<T> AddAsync(T entity, CancellationToken cancellationToken = default);
    Task<T> UpdateAsync(T entity, CancellationToken cancellationToken = default);
    Task DeleteAsync(string id, CancellationToken cancellationToken = default);
    Task<bool> ExistsAsync(string id, CancellationToken cancellationToken = default);
}

public class Repository<T> : IRepository<T> where T : BaseEntity
{
    protected readonly ApplicationDbContext _context;
    protected readonly DbSet<T> _dbSet;

    public Repository(ApplicationDbContext context)
    {
        _context = context;
        _dbSet = context.Set<T>();
    }

    public virtual async Task<T> GetByIdAsync(string id, CancellationToken cancellationToken = default)
    {
        return await _dbSet.FindAsync(new object[] { id }, cancellationToken);
    }

    public virtual async Task<IEnumerable<T>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _dbSet.ToListAsync(cancellationToken);
    }

    public virtual async Task<IEnumerable<T>> FindAsync(Expression<Func<T, bool>> predicate, CancellationToken cancellationToken = default)
    {
        return await _dbSet.Where(predicate).ToListAsync(cancellationToken);
    }

    public virtual async Task<T> AddAsync(T entity, CancellationToken cancellationToken = default)
    {
        await _dbSet.AddAsync(entity, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
        return entity;
    }

    public virtual async Task<T> UpdateAsync(T entity, CancellationToken cancellationToken = default)
    {
        _dbSet.Update(entity);
        await _context.SaveChangesAsync(cancellationToken);
        return entity;
    }

    public virtual async Task DeleteAsync(string id, CancellationToken cancellationToken = default)
    {
        var entity = await GetByIdAsync(id, cancellationToken);
        if (entity != null)
        {
            _dbSet.Remove(entity);
            await _context.SaveChangesAsync(cancellationToken);
        }
    }

    public virtual async Task<bool> ExistsAsync(string id, CancellationToken cancellationToken = default)
    {
        return await _dbSet.AnyAsync(e => e.Id == id, cancellationToken);
    }
}
```

### Specific Repository Implementation
```csharp
public interface ICampaignRepository : IRepository<Campaign>
{
    Task<IEnumerable<Campaign>> GetCampaignsByDungeonMasterAsync(string dungeonMasterId);
    Task<IEnumerable<Campaign>> GetActiveCampaignsAsync();
    Task<Campaign> GetCampaignWithCharactersAsync(string campaignId);
}

public class CampaignRepository : Repository<Campaign>, ICampaignRepository
{
    public CampaignRepository(ApplicationDbContext context) : base(context) { }

    public async Task<IEnumerable<Campaign>> GetCampaignsByDungeonMasterAsync(string dungeonMasterId)
    {
        return await _dbSet
            .Where(c => c.DungeonMasterId == dungeonMasterId)
            .Include(c => c.Characters)
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync();
    }

    public async Task<IEnumerable<Campaign>> GetActiveCampaignsAsync()
    {
        return await _dbSet
            .Where(c => c.Status == CampaignStatus.Active)
            .Include(c => c.DungeonMaster)
            .ToListAsync();
    }

    public async Task<Campaign> GetCampaignWithCharactersAsync(string campaignId)
    {
        return await _dbSet
            .Include(c => c.Characters)
            .Include(c => c.DungeonMaster)
            .FirstOrDefaultAsync(c => c.Id == campaignId);
    }
}
```

---

## Migration Strategy

### Database Initialization
```csharp
public static class DatabaseMigrationExtensions
{
    public static async Task<IHost> MigrateDatabaseAsync(this IHost host)
    {
        using var scope = host.Services.CreateScope();
        var services = scope.ServiceProvider;
        var logger = services.GetRequiredService<ILogger<Program>>();
        
        try
        {
            var context = services.GetRequiredService<ApplicationDbContext>();
            
            if (context.Database.IsRelational())
            {
                logger.LogInformation("Starting database migration...");
                await context.Database.MigrateAsync();
                logger.LogInformation("Database migration completed successfully");
                
                // Seed initial data
                await SeedInitialDataAsync(context, logger);
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "An error occurred while migrating the database");
            throw;
        }
        
        return host;
    }
}
```

### Database Seeding
```csharp
public class DatabaseInitializer
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<DatabaseInitializer> _logger;

    public async Task InitializeAsync()
    {
        try
        {
            // Ensure database is created
            if (_context.Database.IsRelational())
            {
                await _context.Database.MigrateAsync();
            }

            await SeedDataAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An error occurred while initializing the database");
            throw;
        }
    }

    private async Task SeedDataAsync()
    {
        // Check if data already exists
        if (await _context.Users.AnyAsync())
        {
            return;
        }

        // Seed system roles
        var roles = new[]
        {
            new Role { Name = "SystemAdmin", Description = "System Administrator" },
            new Role { Name = "DungeonMaster", Description = "Dungeon Master" },
            new Role { Name = "Player", Description = "Player" }
        };

        await _context.Roles.AddRangeAsync(roles);
        await _context.SaveChangesAsync();
    }
}
```

This comprehensive Entity Framework setup provides robust data access patterns, proper entity configuration, and migration strategies for the D&D AI Campaign Management System.
