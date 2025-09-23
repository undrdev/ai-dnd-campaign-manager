# Database Design Standards

## Overview
This document defines database design standards, Entity Framework conventions, and data management practices for the D&D AI Campaign Management System using PostgreSQL as the primary database.

---

## Database Architecture

### Database Structure
```
Primary Database: PostgreSQL 15+
├── Schemas
│   ├── public (default)         # Core application tables
│   ├── auth                     # Authentication and authorization
│   ├── billing                  # Subscription and usage tracking
│   ├── ai                       # AI-related data and context
│   └── audit                    # Audit logs and compliance
├── Extensions
│   ├── uuid-ossp               # UUID generation
│   ├── pgcrypto                # Encryption functions
│   └── vector (optional)        # Vector similarity search
└── Connection Pools
    ├── Read-Write (Primary)
    ├── Read-Only (Replicas)
    └── Analytics (Reporting)
```

### Schema Organization
```sql
-- Core application schema (public)
public.users
public.campaigns
public.characters
public.npcs
public.sessions

-- Authentication schema
auth.user_tokens
auth.refresh_tokens
auth.permissions

-- Billing schema
billing.subscriptions
billing.usage_records
billing.invoices

-- AI schema
ai.context_cache
ai.usage_logs
ai.provider_metrics

-- Audit schema
audit.data_changes
audit.user_actions
audit.system_events
```

---

## Naming Conventions

### Table Naming
```sql
-- Use snake_case, plural nouns
campaigns               ✓ Good
campaign_players       ✓ Good (junction table)
user_campaign_roles    ✓ Good (descriptive junction)

-- Avoid
Campaign               ✗ PascalCase
campaign               ✗ Singular
tblCampaigns          ✗ Hungarian notation
```

### Column Naming
```sql
-- Use snake_case, descriptive names
CREATE TABLE campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by_user_id UUID NOT NULL,
    is_active BOOLEAN DEFAULT true,
    player_count INTEGER DEFAULT 0,
    max_players INTEGER DEFAULT 6
);

-- Boolean columns - use is_, has_, can_, should_ prefixes
is_active              ✓ Good
has_premium_features   ✓ Good
can_invite_players     ✓ Good

-- Date/time columns - use descriptive suffixes
created_at             ✓ Good
updated_at             ✓ Good
deleted_at             ✓ Good
expires_on             ✓ Good (date only)
```

### Foreign Key Naming
```sql
-- Format: {referenced_table}_id
user_id                ✓ References users.id
campaign_id            ✓ References campaigns.id
created_by_user_id     ✓ Descriptive when needed

-- Junction tables
CREATE TABLE campaign_players (
    campaign_id UUID NOT NULL,
    user_id UUID NOT NULL,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    role VARCHAR(20) DEFAULT 'player',
    PRIMARY KEY (campaign_id, user_id)
);
```

### Index Naming
```sql
-- Format: idx_{table}_{columns}
CREATE INDEX idx_campaigns_created_by_user_id ON campaigns(created_by_user_id);
CREATE INDEX idx_campaigns_created_at ON campaigns(created_at);
CREATE INDEX idx_campaigns_status_created_at ON campaigns(status, created_at);

-- Unique indexes: uq_{table}_{columns}
CREATE UNIQUE INDEX uq_campaigns_name_user_id ON campaigns(name, created_by_user_id);

-- Partial indexes for common filters
CREATE INDEX idx_campaigns_active ON campaigns(created_at) 
WHERE is_active = true;
```

### Constraint Naming
```sql
-- Primary keys: pk_{table}
ALTER TABLE campaigns ADD CONSTRAINT pk_campaigns PRIMARY KEY (id);

-- Foreign keys: fk_{table}_{referenced_table}
ALTER TABLE campaigns 
ADD CONSTRAINT fk_campaigns_users 
FOREIGN KEY (created_by_user_id) REFERENCES users(id);

-- Check constraints: ck_{table}_{column}
ALTER TABLE campaigns 
ADD CONSTRAINT ck_campaigns_player_count 
CHECK (player_count >= 0 AND player_count <= max_players);

-- Unique constraints: uq_{table}_{columns}
ALTER TABLE campaigns 
ADD CONSTRAINT uq_campaigns_name_user 
UNIQUE (name, created_by_user_id);
```

---

## Core Table Designs

### Users Table
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255), -- NULL for OAuth users
    role VARCHAR(20) DEFAULT 'player', -- player, gm, admin
    subscription_tier VARCHAR(20) DEFAULT 'free',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    preferences JSONB DEFAULT '{}',
    
    -- Constraints
    CONSTRAINT uq_users_email UNIQUE (email),
    CONSTRAINT ck_users_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT ck_users_role CHECK (role IN ('player', 'gm', 'admin')),
    CONSTRAINT ck_users_subscription_tier CHECK (subscription_tier IN ('free', 'basic', 'premium', 'enterprise'))
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_subscription_tier ON users(subscription_tier);
CREATE INDEX idx_users_created_at ON users(created_at);
```

### Campaigns Table
```sql
CREATE TABLE campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    game_master_id UUID NOT NULL,
    status VARCHAR(20) DEFAULT 'planning', -- planning, active, paused, completed, archived
    setting VARCHAR(50) DEFAULT 'forgotten_realms',
    max_players INTEGER DEFAULT 6,
    current_session INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_played_at TIMESTAMP WITH TIME ZONE,
    is_public BOOLEAN DEFAULT false,
    world_state JSONB DEFAULT '{}',
    campaign_rules JSONB DEFAULT '{}',
    
    -- Constraints
    CONSTRAINT fk_campaigns_game_master FOREIGN KEY (game_master_id) REFERENCES users(id),
    CONSTRAINT uq_campaigns_name_gm UNIQUE (name, game_master_id),
    CONSTRAINT ck_campaigns_status CHECK (status IN ('planning', 'active', 'paused', 'completed', 'archived')),
    CONSTRAINT ck_campaigns_max_players CHECK (max_players > 0 AND max_players <= 10)
);

-- Indexes
CREATE INDEX idx_campaigns_game_master_id ON campaigns(game_master_id);
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_created_at ON campaigns(created_at);
CREATE INDEX idx_campaigns_last_played ON campaigns(last_played_at) WHERE last_played_at IS NOT NULL;
```

### Characters Table
```sql
CREATE TABLE characters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    player_id UUID NOT NULL,
    campaign_id UUID NOT NULL,
    race VARCHAR(50) NOT NULL,
    character_class VARCHAR(50) NOT NULL,
    level INTEGER DEFAULT 1,
    experience_points INTEGER DEFAULT 0,
    hit_points_current INTEGER NOT NULL,
    hit_points_maximum INTEGER NOT NULL,
    armor_class INTEGER DEFAULT 10,
    proficiency_bonus INTEGER DEFAULT 2,
    ability_scores JSONB NOT NULL, -- {str: 10, dex: 14, con: 12, int: 13, wis: 15, cha: 8}
    skills JSONB DEFAULT '{}',
    equipment JSONB DEFAULT '[]',
    spells JSONB DEFAULT '[]',
    background TEXT,
    personality_traits TEXT,
    ideals TEXT,
    bonds TEXT,
    flaws TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    
    -- Constraints
    CONSTRAINT fk_characters_player FOREIGN KEY (player_id) REFERENCES users(id),
    CONSTRAINT fk_characters_campaign FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
    CONSTRAINT uq_characters_name_campaign UNIQUE (name, campaign_id),
    CONSTRAINT ck_characters_level CHECK (level >= 1 AND level <= 20),
    CONSTRAINT ck_characters_hp CHECK (hit_points_current >= 0 AND hit_points_current <= hit_points_maximum),
    CONSTRAINT ck_characters_ac CHECK (armor_class >= 1 AND armor_class <= 30)
);

-- Indexes
CREATE INDEX idx_characters_player_id ON characters(player_id);
CREATE INDEX idx_characters_campaign_id ON characters(campaign_id);
CREATE INDEX idx_characters_level ON characters(level);
CREATE INDEX idx_characters_active ON characters(campaign_id) WHERE is_active = true;
```

### NPCs Table
```sql
CREATE TABLE npcs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    campaign_id UUID NOT NULL,
    race VARCHAR(50),
    occupation VARCHAR(100),
    location VARCHAR(100),
    description TEXT,
    personality_traits JSONB DEFAULT '[]',
    goals_motivations TEXT,
    relationships JSONB DEFAULT '{}',
    dialogue_history JSONB DEFAULT '[]',
    stats JSONB DEFAULT '{}', -- Optional combat stats
    notes TEXT,
    is_major_npc BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by_ai BOOLEAN DEFAULT false,
    ai_personality_seed TEXT, -- For AI consistency
    
    -- Constraints
    CONSTRAINT fk_npcs_campaign FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_npcs_campaign_id ON npcs(campaign_id);
CREATE INDEX idx_npcs_location ON npcs(campaign_id, location);
CREATE INDEX idx_npcs_major ON npcs(campaign_id) WHERE is_major_npc = true;
CREATE INDEX idx_npcs_active ON npcs(campaign_id) WHERE is_active = true;
```

---

## Entity Framework Configuration

### DbContext Setup
```csharp
public class DnDCampaignDbContext : DbContext
{
    public DnDCampaignDbContext(DbContextOptions<DnDCampaignDbContext> options) 
        : base(options) { }
    
    // DbSets
    public DbSet<User> Users => Set<User>();
    public DbSet<Campaign> Campaigns => Set<Campaign>();
    public DbSet<Character> Characters => Set<Character>();
    public DbSet<NPC> NPCs => Set<NPC>();
    public DbSet<Session> Sessions => Set<Session>();
    
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        
        // Apply all configurations from assembly
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(DnDCampaignDbContext).Assembly);
        
        // Global query filters for soft delete
        modelBuilder.Entity<User>().HasQueryFilter(u => u.IsActive);
        modelBuilder.Entity<Character>().HasQueryFilter(c => c.IsActive);
        
        // Configure PostgreSQL specific features
        modelBuilder.HasDefaultSchema("public");
        modelBuilder.HasPostgresExtension("uuid-ossp");
        modelBuilder.HasPostgresExtension("pgcrypto");
    }
    
    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        if (!optionsBuilder.IsConfigured)
        {
            // This should only be used for design-time tools
            optionsBuilder.UseNpgsql("Host=localhost;Database=dndcampaign;Username=postgres;Password=password");
        }
        
        // Configure for PostgreSQL
        optionsBuilder.UseNpgsql(options =>
        {
            options.MigrationsHistoryTable("__ef_migrations_history");
        });
        
        // Enable sensitive data logging in development only
        #if DEBUG
        optionsBuilder.EnableSensitiveDataLogging();
        #endif
    }
}
```

### Entity Configuration Examples
```csharp
// User entity configuration
public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.ToTable("users");
        
        builder.HasKey(u => u.Id);
        builder.Property(u => u.Id)
            .HasColumnName("id")
            .HasDefaultValueSql("gen_random_uuid()");
        
        builder.Property(u => u.Email)
            .HasColumnName("email")
            .HasMaxLength(255)
            .IsRequired();
        
        builder.Property(u => u.DisplayName)
            .HasColumnName("display_name")
            .HasMaxLength(100)
            .IsRequired();
        
        builder.Property(u => u.Role)
            .HasColumnName("role")
            .HasMaxLength(20)
            .HasDefaultValue("player")
            .HasConversion<string>();
        
        builder.Property(u => u.SubscriptionTier)
            .HasColumnName("subscription_tier")
            .HasMaxLength(20)
            .HasDefaultValue("free")
            .HasConversion<string>();
        
        builder.Property(u => u.Preferences)
            .HasColumnName("preferences")
            .HasColumnType("jsonb")
            .HasDefaultValueSql("'{}'::jsonb");
        
        builder.Property(u => u.CreatedAt)
            .HasColumnName("created_at")
            .HasDefaultValueSql("NOW()");
        
        builder.Property(u => u.UpdatedAt)
            .HasColumnName("updated_at")
            .HasDefaultValueSql("NOW()");
        
        // Indexes
        builder.HasIndex(u => u.Email)
            .IsUnique()
            .HasDatabaseName("idx_users_email");
        
        builder.HasIndex(u => u.SubscriptionTier)
            .HasDatabaseName("idx_users_subscription_tier");
    }
}

// Campaign entity configuration
public class CampaignConfiguration : IEntityTypeConfiguration<Campaign>
{
    public void Configure(EntityTypeBuilder<Campaign> builder)
    {
        builder.ToTable("campaigns");
        
        builder.HasKey(c => c.Id);
        builder.Property(c => c.Id)
            .HasColumnName("id")
            .HasDefaultValueSql("gen_random_uuid()");
        
        builder.Property(c => c.Name)
            .HasColumnName("name")
            .HasMaxLength(100)
            .IsRequired();
        
        builder.Property(c => c.WorldState)
            .HasColumnName("world_state")
            .HasColumnType("jsonb")
            .HasDefaultValueSql("'{}'::jsonb");
        
        // Relationships
        builder.HasOne(c => c.GameMaster)
            .WithMany(u => u.CampaignsAsGM)
            .HasForeignKey(c => c.GameMasterId)
            .HasConstraintName("fk_campaigns_game_master");
        
        builder.HasMany(c => c.Characters)
            .WithOne(ch => ch.Campaign)
            .HasForeignKey(ch => ch.CampaignId)
            .OnDelete(DeleteBehavior.Cascade);
        
        // Indexes
        builder.HasIndex(c => c.GameMasterId)
            .HasDatabaseName("idx_campaigns_game_master_id");
        
        builder.HasIndex(c => new { c.Name, c.GameMasterId })
            .IsUnique()
            .HasDatabaseName("uq_campaigns_name_gm");
    }
}
```

### Entity Base Classes
```csharp
// Base entity with common properties
public abstract class BaseEntity
{
    public Guid Id { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

// Auditable entity for tracking changes
public abstract class AuditableEntity : BaseEntity
{
    public Guid? CreatedByUserId { get; set; }
    public Guid? UpdatedByUserId { get; set; }
    public virtual User? CreatedByUser { get; set; }
    public virtual User? UpdatedByUser { get; set; }
}

// Soft delete entity
public abstract class SoftDeleteEntity : AuditableEntity
{
    public bool IsActive { get; set; } = true;
    public DateTime? DeletedAt { get; set; }
    public Guid? DeletedByUserId { get; set; }
    public virtual User? DeletedByUser { get; set; }
}
```

---

## Migration Management

### Migration Standards
```csharp
// Migration naming: {DateTime}_{DescriptiveAction}
// Example: 20241201120000_CreateCampaignsTable.cs

[Migration("20241201120000")]
public partial class CreateCampaignsTable : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "campaigns",
            columns: table => new
            {
                id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                description = table.Column<string>(type: "text", nullable: true),
                game_master_id = table.Column<Guid>(type: "uuid", nullable: false),
                status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "planning"),
                created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()")
            },
            constraints: table =>
            {
                table.PrimaryKey("pk_campaigns", x => x.id);
                table.ForeignKey(
                    name: "fk_campaigns_game_master",
                    column: x => x.game_master_id,
                    principalTable: "users",
                    principalColumn: "id",
                    onDelete: ReferentialAction.Restrict);
                table.CheckConstraint("ck_campaigns_status", "status IN ('planning', 'active', 'paused', 'completed', 'archived')");
            });
        
        migrationBuilder.CreateIndex(
            name: "idx_campaigns_game_master_id",
            table: "campaigns",
            column: "game_master_id");
        
        migrationBuilder.CreateIndex(
            name: "uq_campaigns_name_gm",
            table: "campaigns",
            columns: new[] { "name", "game_master_id" },
            unique: true);
    }
    
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "campaigns");
    }
}
```

### Migration Scripts Organization
```
scripts/database/
├── migrations/
│   ├── 001_initial_schema.sql
│   ├── 002_add_ai_tables.sql
│   └── 003_add_billing_tables.sql
├── seed-data/
│   ├── development/
│   │   ├── users.sql
│   │   ├── campaigns.sql
│   │   └── characters.sql
│   ├── testing/
│   │   └── test-data.sql
│   └── production/
│       └── reference-data.sql
└── maintenance/
    ├── cleanup-old-data.sql
    ├── rebuild-indexes.sql
    └── update-statistics.sql
```

---

## JSONB Usage Guidelines

### Structured JSONB Schemas
```sql
-- Character ability scores
ability_scores JSONB CHECK (
    ability_scores ? 'str' AND
    ability_scores ? 'dex' AND
    ability_scores ? 'con' AND
    ability_scores ? 'int' AND
    ability_scores ? 'wis' AND
    ability_scores ? 'cha'
);

-- Example data
INSERT INTO characters (name, ability_scores) VALUES 
('Gandalf', '{"str": 10, "dex": 11, "con": 12, "int": 18, "wis": 16, "cha": 15}');

-- Querying JSONB data
SELECT name, (ability_scores->>'int')::integer as intelligence 
FROM characters 
WHERE (ability_scores->>'int')::integer > 15;

-- Indexing JSONB fields
CREATE INDEX idx_characters_intelligence ON characters USING GIN ((ability_scores->>'int'));
```

### JSONB Best Practices
```csharp
// Entity configuration for JSONB
public class CharacterConfiguration : IEntityTypeConfiguration<Character>
{
    public void Configure(EntityTypeBuilder<Character> builder)
    {
        // Configure JSONB properties with proper conversion
        builder.Property(c => c.AbilityScores)
            .HasColumnType("jsonb")
            .HasConversion(
                v => JsonSerializer.Serialize(v, (JsonSerializerOptions)null),
                v => JsonSerializer.Deserialize<Dictionary<string, int>>(v, (JsonSerializerOptions)null)
            );
        
        builder.Property(c => c.Equipment)
            .HasColumnType("jsonb")
            .HasConversion(
                v => JsonSerializer.Serialize(v, (JsonSerializerOptions)null),
                v => JsonSerializer.Deserialize<List<EquipmentItem>>(v, (JsonSerializerOptions)null)
            );
    }
}
```

---

## Performance Optimization

### Indexing Strategy
```sql
-- B-tree indexes for equality and range queries
CREATE INDEX idx_campaigns_created_at ON campaigns(created_at);
CREATE INDEX idx_characters_level ON characters(level);

-- Composite indexes for common query patterns
CREATE INDEX idx_campaigns_status_created_at ON campaigns(status, created_at);
CREATE INDEX idx_characters_campaign_level ON characters(campaign_id, level DESC);

-- Partial indexes for filtered queries
CREATE INDEX idx_campaigns_active ON campaigns(created_at) 
WHERE status = 'active';

-- GIN indexes for JSONB and text search
CREATE INDEX idx_characters_abilities ON characters USING GIN (ability_scores);
CREATE INDEX idx_npcs_personality ON npcs USING GIN (personality_traits);

-- Expression indexes for computed values
CREATE INDEX idx_characters_modifier_str ON characters(((ability_scores->>'str')::integer - 10) / 2);
```

### Query Optimization
```sql
-- Use EXPLAIN ANALYZE to optimize queries
EXPLAIN ANALYZE 
SELECT c.name, u.display_name, count(ch.id) as character_count
FROM campaigns c
JOIN users u ON c.game_master_id = u.id
LEFT JOIN characters ch ON c.id = ch.campaign_id AND ch.is_active = true
WHERE c.status = 'active' AND c.created_at > NOW() - INTERVAL '30 days'
GROUP BY c.id, c.name, u.display_name
ORDER BY character_count DESC
LIMIT 10;
```

### Connection Management
```csharp
// Configure connection pooling
services.AddDbContext<DnDCampaignDbContext>(options =>
{
    options.UseNpgsql(connectionString, npgsqlOptions =>
    {
        npgsqlOptions.CommandTimeout(30);
        npgsqlOptions.EnableRetryOnFailure(3);
    });
}, ServiceLifetime.Scoped);

// Configure connection pool settings
services.Configure<NpgsqlConnectionPoolOptions>(options =>
{
    options.MinPoolSize = 5;
    options.MaxPoolSize = 100;
    options.ConnectionIdleLifetime = TimeSpan.FromMinutes(15);
});
```

---

## Backup and Maintenance

### Backup Strategy
```bash
#!/bin/bash
# Daily backup script
DB_NAME="dndcampaign"
BACKUP_DIR="/backups/postgresql"
DATE=$(date +%Y%m%d_%H%M%S)

# Create full backup
pg_dump -h localhost -U postgres -d $DB_NAME -F c -f "$BACKUP_DIR/full_backup_$DATE.backup"

# Create schema-only backup
pg_dump -h localhost -U postgres -d $DB_NAME -s -f "$BACKUP_DIR/schema_backup_$DATE.sql"

# Cleanup old backups (keep 30 days)
find $BACKUP_DIR -name "*.backup" -mtime +30 -delete
```

### Maintenance Tasks
```sql
-- Regular maintenance queries
-- Analyze table statistics
ANALYZE campaigns;
ANALYZE characters;
ANALYZE npcs;

-- Vacuum to reclaim space
VACUUM ANALYZE campaigns;

-- Check for bloat
SELECT schemaname, tablename, 
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as index_size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

This database design standards document provides comprehensive guidelines for consistent, performant, and maintainable database design using PostgreSQL and Entity Framework Core