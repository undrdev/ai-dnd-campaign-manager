# Database Migration and Seeding Strategy

## Overview
This document defines the comprehensive database migration and seeding strategy for the D&D AI Campaign Management System, including version management, data migration procedures, and initial data seeding.

## Migration Framework

### Migration Management Table
```sql
CREATE TABLE DatabaseMigrations (
    Id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    MigrationId VARCHAR(100) NOT NULL UNIQUE,
    MigrationName VARCHAR(200) NOT NULL,
    Version VARCHAR(20) NOT NULL,
    
    -- Migration metadata
    Description TEXT,
    MigrationType VARCHAR(20) NOT NULL DEFAULT 'Schema' CHECK (MigrationType IN ('Schema', 'Data', 'Index', 'Function', 'Seed')),
    
    -- Execution details
    ExecutedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ExecutionTimeMs INTEGER,
    ExecutedBy VARCHAR(100) DEFAULT CURRENT_USER,
    
    -- Migration content
    UpScript TEXT NOT NULL,
    DownScript TEXT,
    
    -- Dependencies
    Dependencies JSONB DEFAULT '[]',
    
    -- Status tracking
    Status VARCHAR(20) NOT NULL DEFAULT 'Applied' CHECK (Status IN ('Applied', 'Failed', 'RolledBack')),
    ErrorMessage TEXT,
    
    -- Checksums for integrity
    UpScriptChecksum VARCHAR(64),
    DownScriptChecksum VARCHAR(64),
    
    CreatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for migration tracking
CREATE INDEX IX_DatabaseMigrations_Version ON DatabaseMigrations(Version);
CREATE INDEX IX_DatabaseMigrations_MigrationType ON DatabaseMigrations(MigrationType);
CREATE INDEX IX_DatabaseMigrations_Status ON DatabaseMigrations(Status);
CREATE INDEX IX_DatabaseMigrations_ExecutedAt ON DatabaseMigrations(ExecutedAt);
```

## Migration Versioning Strategy

### Version Numbering Schema
```
Format: YYYY.MM.DD.HH.MM.SS[.Sequence]
Examples:
- 2024.01.15.10.30.00    - Initial schema
- 2024.01.15.10.30.01    - Add indexes
- 2024.01.16.09.15.00    - User table modifications
- 2024.01.16.09.15.01    - User table data migration
```

### Migration Categories
1. **Schema Migrations**: Table structure changes
2. **Data Migrations**: Data transformations and updates
3. **Index Migrations**: Index creation and optimization
4. **Function Migrations**: Stored procedures and functions
5. **Seed Migrations**: Initial data population

## Core Migration Scripts

### 001 - Initial Schema Migration
```sql
-- Migration: 2024.01.15.10.30.00 - Initial Core Schema
-- Description: Create core tables for users, campaigns, characters, and NPCs

-- Users table
CREATE TABLE Users (
    Id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    Email VARCHAR(255) NOT NULL UNIQUE,
    EmailVerified BOOLEAN NOT NULL DEFAULT FALSE,
    PasswordHash VARCHAR(255) NOT NULL,
    DisplayName VARCHAR(100) NOT NULL,
    Role VARCHAR(20) NOT NULL DEFAULT 'Player',
    SubscriptionTier VARCHAR(20) NOT NULL DEFAULT 'Free',
    AvatarUrl VARCHAR(500),
    Timezone VARCHAR(50) DEFAULT 'UTC',
    Preferences JSONB NOT NULL DEFAULT '{}',
    CreatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UpdatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    LastLoginAt TIMESTAMPTZ,
    LastActiveAt TIMESTAMPTZ,
    IsDeleted BOOLEAN NOT NULL DEFAULT FALSE,
    DeletedAt TIMESTAMPTZ,
    DeletedBy UUID REFERENCES Users(Id)
);

-- Campaigns table
CREATE TABLE Campaigns (
    Id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    Name VARCHAR(200) NOT NULL,
    Description TEXT,
    GameMasterId UUID NOT NULL REFERENCES Users(Id),
    Status VARCHAR(20) NOT NULL DEFAULT 'Planning',
    Settings JSONB NOT NULL DEFAULT '{}',
    WorldState JSONB NOT NULL DEFAULT '{}',
    PlayerCount INTEGER NOT NULL DEFAULT 0,
    SessionCount INTEGER NOT NULL DEFAULT 0,
    TemplateId UUID,
    IsTemplate BOOLEAN NOT NULL DEFAULT FALSE,
    TemplateCategory VARCHAR(50),
    IsPublic BOOLEAN NOT NULL DEFAULT FALSE,
    ShareCode VARCHAR(20) UNIQUE,
    CreatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UpdatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    LastPlayedAt TIMESTAMPTZ,
    IsDeleted BOOLEAN NOT NULL DEFAULT FALSE,
    DeletedAt TIMESTAMPTZ,
    DeletedBy UUID REFERENCES Users(Id)
);

-- Continue with other core tables...
-- [Additional table definitions from core-entities.md]

-- Record migration
INSERT INTO DatabaseMigrations (
    MigrationId, MigrationName, Version, Description, MigrationType,
    UpScript, UpScriptChecksum
) VALUES (
    '2024.01.15.10.30.00',
    'Initial Core Schema',
    '1.0.0',
    'Create core tables for users, campaigns, characters, and NPCs',
    'Schema',
    '-- [Full up script content]',
    md5('-- [Full up script content]')
);
```

### 002 - Authentication Schema Migration
```sql
-- Migration: 2024.01.15.11.00.00 - Authentication and Security Schema
-- Description: Add authentication, security, and audit tables

-- UserCredentials table
CREATE TABLE UserCredentials (
    Id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    UserId UUID NOT NULL REFERENCES Users(Id) ON DELETE CASCADE,
    PasswordHash VARCHAR(255) NOT NULL,
    PasswordSalt VARCHAR(255) NOT NULL,
    PasswordAlgorithm VARCHAR(50) NOT NULL DEFAULT 'bcrypt',
    PasswordChangedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PasswordResetRequired BOOLEAN NOT NULL DEFAULT FALSE,
    MFAEnabled BOOLEAN NOT NULL DEFAULT FALSE,
    MFASecret VARCHAR(255),
    MFABackupCodes JSONB,
    MFALastUsedAt TIMESTAMPTZ,
    FailedLoginAttempts INTEGER NOT NULL DEFAULT 0,
    LastFailedLoginAt TIMESTAMPTZ,
    AccountLockedUntil TIMESTAMPTZ,
    SecurityQuestions JSONB,
    EmailVerificationToken VARCHAR(255),
    EmailVerificationExpires TIMESTAMPTZ,
    EmailVerificationAttempts INTEGER NOT NULL DEFAULT 0,
    PasswordResetToken VARCHAR(255),
    PasswordResetExpires TIMESTAMPTZ,
    PasswordResetAttempts INTEGER NOT NULL DEFAULT 0,
    CreatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UpdatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(UserId)
);

-- Continue with other auth/security tables...
-- [Additional auth table definitions from auth-security.md]

-- Record migration
INSERT INTO DatabaseMigrations (
    MigrationId, MigrationName, Version, Description, MigrationType,
    UpScript, UpScriptChecksum
) VALUES (
    '2024.01.15.11.00.00',
    'Authentication and Security Schema',
    '1.1.0',
    'Add authentication, security, and audit tables',
    'Schema',
    '-- [Full auth schema script]',
    md5('-- [Full auth schema script]')
);
```

### 003 - AI Integration Schema Migration
```sql
-- Migration: 2024.01.15.12.00.00 - AI Integration Schema
-- Description: Add AI providers, requests, and context management tables

-- AIProviders table
CREATE TABLE AIProviders (
    Id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    Name VARCHAR(100) NOT NULL UNIQUE,
    DisplayName VARCHAR(100) NOT NULL,
    Description TEXT,
    ProviderType VARCHAR(50) NOT NULL,
    BaseUrl VARCHAR(500),
    ApiVersion VARCHAR(20),
    SupportedFeatures JSONB NOT NULL DEFAULT '[]',
    ModelCapabilities JSONB NOT NULL DEFAULT '{}',
    DefaultModel VARCHAR(100),
    MaxTokens INTEGER DEFAULT 4000,
    DefaultTemperature DECIMAL(3,2) DEFAULT 0.7,
    IsActive BOOLEAN NOT NULL DEFAULT TRUE,
    Priority INTEGER NOT NULL DEFAULT 0,
    HealthStatus VARCHAR(20) NOT NULL DEFAULT 'Unknown',
    LastHealthCheck TIMESTAMPTZ,
    RateLimitRpm INTEGER,
    RateLimitTpm INTEGER,
    CreatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UpdatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Continue with other AI tables...
-- [Additional AI table definitions from ai-integration.md]

-- Record migration
INSERT INTO DatabaseMigrations (
    MigrationId, MigrationName, Version, Description, MigrationType,
    UpScript, UpScriptChecksum
) VALUES (
    '2024.01.15.12.00.00',
    'AI Integration Schema',
    '1.2.0',
    'Add AI providers, requests, and context management tables',
    'Schema',
    '-- [Full AI schema script]',
    md5('-- [Full AI schema script]')
);
```

## Data Seeding Strategy

### Seed Data Categories
1. **System Configuration**: Default settings and configurations
2. **Reference Data**: D&D 5e rules, classes, races, spells
3. **Default Templates**: Campaign templates and starter content
4. **Test Data**: Development and testing datasets

### System Configuration Seeds
```sql
-- Seed: Default Subscription Plans
INSERT INTO SubscriptionPlans (Name, DisplayName, Description, PriceMonthly, PriceYearly, Features, Limits, IsDefault) VALUES
('Free', 'Free', 'Basic features for casual players', 0.00, 0.00, 
 '{"campaigns": 1, "characters_per_campaign": 1, "ai_basic": true}',
 '{"ai_requests_monthly": 50, "storage_gb": 1}', TRUE),
 
('DungeonArchitect', 'Dungeon Architect', 'Enhanced features for active players', 9.99, 99.99,
 '{"campaigns": 5, "characters_per_campaign": 3, "ai_advanced": true, "voice_synthesis": false}',
 '{"ai_requests_monthly": 500, "storage_gb": 10}', FALSE),
 
('CampaignWeaver', 'Campaign Weaver', 'Advanced features for dedicated GMs', 19.99, 199.99,
 '{"campaigns": 15, "characters_per_campaign": 5, "ai_premium": true, "voice_synthesis": true, "api_access": false}',
 '{"ai_requests_monthly": 2000, "storage_gb": 50}', FALSE),
 
('GuildMaster', 'Guild Master', 'Professional features for communities', 39.99, 399.99,
 '{"campaigns": -1, "characters_per_campaign": -1, "ai_premium": true, "voice_synthesis": true, "api_access": true, "priority_support": true}',
 '{"ai_requests_monthly": 10000, "storage_gb": 200}', FALSE);

-- Seed: Default AI Providers
INSERT INTO AIProviders (Name, DisplayName, Description, ProviderType, SupportedFeatures, ModelCapabilities, DefaultModel) VALUES
('openai', 'OpenAI', 'OpenAI GPT models for text generation', 'OpenAI', 
 '["text_generation", "dialogue", "world_building", "character_creation"]',
 '{"gpt-4": {"max_tokens": 8192, "cost_per_1k_tokens": 0.03}, "gpt-3.5-turbo": {"max_tokens": 4096, "cost_per_1k_tokens": 0.002}}',
 'gpt-3.5-turbo'),
('anthropic', 'Anthropic Claude', 'Anthropic Claude models for creative content', 'Anthropic',
 '["text_generation", "dialogue", "world_building", "character_creation", "long_context"]',
 '{"claude-3-opus": {"max_tokens": 200000, "cost_per_1k_tokens": 0.015}, "claude-3-sonnet": {"max_tokens": 200000, "cost_per_1k_tokens": 0.003}}',
 'claude-3-sonnet');

-- Seed: Default Roles and Permissions
INSERT INTO Roles (Name, DisplayName, Description, Scope, IsBuiltIn) VALUES
('SystemAdmin', 'System Administrator', 'Full system administration access', 'System', TRUE),
('Player', 'Player', 'Basic player access', 'System', TRUE),
('GameMaster', 'Game Master', 'Campaign management access', 'System', TRUE),
('CampaignPlayer', 'Campaign Player', 'Player in specific campaign', 'Campaign', TRUE),
('CampaignGM', 'Campaign Game Master', 'GM of specific campaign', 'Campaign', TRUE),
('CampaignCoGM', 'Campaign Co-Game Master', 'Assistant GM of specific campaign', 'Campaign', TRUE),
('CampaignObserver', 'Campaign Observer', 'Read-only campaign access', 'Campaign', TRUE);

-- [Continue with permissions and role assignments...]
```

### D&D 5e Reference Data Seeds
```sql
-- Seed: Character Races
CREATE TABLE IF NOT EXISTS CharacterRaces (
    Id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    Name VARCHAR(50) NOT NULL UNIQUE,
    Subrace VARCHAR(50),
    Description TEXT,
    AbilityScoreIncreases JSONB NOT NULL DEFAULT '{}',
    Traits JSONB NOT NULL DEFAULT '[]',
    Size VARCHAR(20) NOT NULL DEFAULT 'Medium',
    Speed INTEGER NOT NULL DEFAULT 30,
    Languages JSONB NOT NULL DEFAULT '[]',
    Proficiencies JSONB NOT NULL DEFAULT '{}',
    Source VARCHAR(50) NOT NULL DEFAULT 'PHB',
    IsOfficial BOOLEAN NOT NULL DEFAULT TRUE
);

INSERT INTO CharacterRaces (Name, Subrace, Description, AbilityScoreIncreases, Traits, Languages, Source) VALUES
('Human', 'Variant', 'Versatile and ambitious', 
 '{"any_two": 1}', 
 '["Extra Language", "Extra Skill", "Feat"]',
 '["Common", "One of your choice"]', 'PHB'),
 
('Elf', 'High Elf', 'Graceful and magical', 
 '{"dexterity": 2, "intelligence": 1}',
 '["Darkvision", "Keen Senses", "Fey Ancestry", "Trance", "Elf Weapon Training", "Cantrip"]',
 '["Common", "Elvish"]', 'PHB'),
 
('Dwarf', 'Mountain Dwarf', 'Hardy and traditional',
 '{"constitution": 2, "strength": 2}',
 '["Darkvision", "Dwarven Resilience", "Dwarven Combat Training", "Stonecunning", "Armor Proficiency"]',
 '["Common", "Dwarvish"]', 'PHB'),
 
('Halfling', 'Lightfoot', 'Small and brave',
 '{"dexterity": 2, "charisma": 1}',
 '["Lucky", "Brave", "Halfling Nimbleness", "Naturally Stealthy"]',
 '["Common", "Halfling"]', 'PHB');

-- Continue with all official races...

-- Seed: Character Classes
CREATE TABLE IF NOT EXISTS CharacterClasses (
    Id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    Name VARCHAR(50) NOT NULL UNIQUE,
    Description TEXT,
    HitDie INTEGER NOT NULL,
    PrimaryAbility JSONB NOT NULL DEFAULT '[]',
    SavingThrowProficiencies JSONB NOT NULL DEFAULT '[]',
    SkillProficiencies JSONB NOT NULL DEFAULT '{}',
    ArmorProficiencies JSONB NOT NULL DEFAULT '[]',
    WeaponProficiencies JSONB NOT NULL DEFAULT '[]',
    ToolProficiencies JSONB NOT NULL DEFAULT '[]',
    StartingEquipment JSONB NOT NULL DEFAULT '[]',
    ClassFeatures JSONB NOT NULL DEFAULT '[]',
    Subclasses JSONB NOT NULL DEFAULT '[]',
    SpellcastingAbility VARCHAR(20),
    Source VARCHAR(50) NOT NULL DEFAULT 'PHB',
    IsOfficial BOOLEAN NOT NULL DEFAULT TRUE
);

INSERT INTO CharacterClasses (Name, Description, HitDie, PrimaryAbility, SavingThrowProficiencies, SkillProficiencies, Source) VALUES
('Fighter', 'A master of martial combat, skilled with a variety of weapons and armor', 10,
 '["Strength", "Dexterity"]', '["Strength", "Constitution"]',
 '{"count": 2, "options": ["Acrobatics", "Animal Handling", "Athletics", "History", "Insight", "Intimidation", "Perception", "Survival"]}',
 'PHB'),
 
('Wizard', 'A scholarly magic-user capable of manipulating the structures of reality', 6,
 '["Intelligence"]', '["Intelligence", "Wisdom"]',
 '{"count": 2, "options": ["Arcana", "History", "Insight", "Investigation", "Medicine", "Religion"]}',
 'PHB'),
 
('Rogue', 'A scoundrel who uses stealth and trickery to accomplish goals', 8,
 '["Dexterity"]', '["Dexterity", "Intelligence"]',
 '{"count": 4, "options": ["Acrobatics", "Athletics", "Deception", "Insight", "Intimidation", "Investigation", "Perception", "Performance", "Persuasion", "Sleight of Hand", "Stealth"]}',
 'PHB');

-- Continue with all official classes...
```

### Campaign Template Seeds
```sql
-- Seed: Default Campaign Templates
INSERT INTO Campaigns (
    Name, Description, GameMasterId, IsTemplate, TemplateCategory, Settings, WorldState
) 
SELECT 
    'Lost Mine of Phandelver',
    'A classic D&D adventure perfect for new players and DMs. Explore the frontier town of Phandalin and uncover the secrets of Wave Echo Cave.',
    (SELECT Id FROM Users WHERE Role = 'Admin' LIMIT 1),
    TRUE,
    'Official Adventures',
    jsonb_build_object(
        'max_players', 6,
        'level_range', jsonb_build_object('min', 1, 'max', 5),
        'ruleset', 'D&D 5e',
        'content_rating', 'PG-13',
        'estimated_sessions', 12,
        'difficulty', 'Beginner Friendly'
    ),
    jsonb_build_object(
        'setting', 'Sword Coast',
        'starting_location', 'Neverwinter',
        'current_location', 'Goblin Ambush Site',
        'key_locations', jsonb_build_array(
            'Neverwinter', 'Triboar Trail', 'Phandalin', 'Cragmaw Hideout', 
            'Redbrand Hideout', 'Old Owl Well', 'Wyvern Tor', 'Cragmaw Castle', 'Wave Echo Cave'
        )
    )
WHERE NOT EXISTS (SELECT 1 FROM Campaigns WHERE Name = 'Lost Mine of Phandelver' AND IsTemplate = TRUE);

-- Add more official adventure templates...
```

## Migration Execution Framework

### Migration Runner Function
```sql
-- Function to execute migrations
CREATE OR REPLACE FUNCTION execute_migration(
    migration_id VARCHAR(100),
    migration_name VARCHAR(200),
    version VARCHAR(20),
    description TEXT,
    migration_type VARCHAR(20),
    up_script TEXT,
    down_script TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    start_time TIMESTAMPTZ;
    end_time TIMESTAMPTZ;
    execution_time INTEGER;
    migration_exists BOOLEAN;
BEGIN
    -- Check if migration already exists
    SELECT EXISTS(
        SELECT 1 FROM DatabaseMigrations WHERE MigrationId = migration_id
    ) INTO migration_exists;
    
    IF migration_exists THEN
        RAISE NOTICE 'Migration % already executed', migration_id;
        RETURN FALSE;
    END IF;
    
    -- Record start time
    start_time := NOW();
    
    -- Execute the migration script
    BEGIN
        EXECUTE up_script;
        
        -- Record successful execution
        end_time := NOW();
        execution_time := EXTRACT(EPOCH FROM (end_time - start_time)) * 1000;
        
        INSERT INTO DatabaseMigrations (
            MigrationId, MigrationName, Version, Description, MigrationType,
            ExecutedAt, ExecutionTimeMs, UpScript, DownScript,
            UpScriptChecksum, DownScriptChecksum, Status
        ) VALUES (
            migration_id, migration_name, version, description, migration_type,
            start_time, execution_time, up_script, down_script,
            md5(up_script), COALESCE(md5(down_script), NULL), 'Applied'
        );
        
        RAISE NOTICE 'Migration % executed successfully in %ms', migration_id, execution_time;
        RETURN TRUE;
        
    EXCEPTION WHEN OTHERS THEN
        -- Record failed execution
        end_time := NOW();
        execution_time := EXTRACT(EPOCH FROM (end_time - start_time)) * 1000;
        
        INSERT INTO DatabaseMigrations (
            MigrationId, MigrationName, Version, Description, MigrationType,
            ExecutedAt, ExecutionTimeMs, UpScript, DownScript,
            UpScriptChecksum, DownScriptChecksum, Status, ErrorMessage
        ) VALUES (
            migration_id, migration_name, version, description, migration_type,
            start_time, execution_time, up_script, down_script,
            md5(up_script), COALESCE(md5(down_script), NULL), 'Failed', SQLERRM
        );
        
        RAISE EXCEPTION 'Migration % failed: %', migration_id, SQLERRM;
        RETURN FALSE;
    END;
END;
$$ LANGUAGE plpgsql;
```

### Migration Rollback Function
```sql
-- Function to rollback migrations
CREATE OR REPLACE FUNCTION rollback_migration(migration_id VARCHAR(100))
RETURNS BOOLEAN AS $$
DECLARE
    migration_record RECORD;
    start_time TIMESTAMPTZ;
    end_time TIMESTAMPTZ;
    execution_time INTEGER;
BEGIN
    -- Get migration record
    SELECT * INTO migration_record
    FROM DatabaseMigrations
    WHERE MigrationId = migration_id AND Status = 'Applied';
    
    IF migration_record IS NULL THEN
        RAISE EXCEPTION 'Migration % not found or not in applied state', migration_id;
    END IF;
    
    IF migration_record.DownScript IS NULL THEN
        RAISE EXCEPTION 'Migration % has no rollback script', migration_id;
    END IF;
    
    -- Record start time
    start_time := NOW();
    
    -- Execute rollback script
    BEGIN
        EXECUTE migration_record.DownScript;
        
        -- Update migration status
        end_time := NOW();
        execution_time := EXTRACT(EPOCH FROM (end_time - start_time)) * 1000;
        
        UPDATE DatabaseMigrations
        SET Status = 'RolledBack',
            UpdatedAt = NOW()
        WHERE MigrationId = migration_id;
        
        RAISE NOTICE 'Migration % rolled back successfully in %ms', migration_id, execution_time;
        RETURN TRUE;
        
    EXCEPTION WHEN OTHERS THEN
        RAISE EXCEPTION 'Migration % rollback failed: %', migration_id, SQLERRM;
        RETURN FALSE;
    END;
END;
$$ LANGUAGE plpgsql;
```

## Environment-Specific Migrations

### Development Environment Setup
```sql
-- Development-specific migrations and seed data
CREATE OR REPLACE FUNCTION setup_development_environment()
RETURNS VOID AS $$
BEGIN
    -- Create test users
    INSERT INTO Users (Email, DisplayName, Role, PasswordHash, EmailVerified) VALUES
    ('admin@dndai.dev', 'Dev Admin', 'Admin', '$2b$12$test_hash_admin', TRUE),
    ('gm@dndai.dev', 'Test Game Master', 'GameMaster', '$2b$12$test_hash_gm', TRUE),
    ('player@dndai.dev', 'Test Player', 'Player', '$2b$12$test_hash_player', TRUE);
    
    -- Create test campaigns
    INSERT INTO Campaigns (Name, Description, GameMasterId, Status, Settings)
    SELECT 
        'Development Test Campaign',
        'A campaign for development and testing purposes',
        u.Id,
        'Active',
        jsonb_build_object(
            'max_players', 6,
            'level_range', jsonb_build_object('min', 1, 'max', 20),
            'ruleset', 'D&D 5e',
            'content_rating', 'PG-13'
        )
    FROM Users u WHERE u.Email = 'gm@dndai.dev';
    
    -- Create test characters
    INSERT INTO Characters (Name, PlayerId, CampaignId, Race, Class, Level, AbilityScores, HitPointsMax, HitPointsCurrent, ArmorClass)
    SELECT 
        'Test Fighter',
        p.Id,
        c.Id,
        'Human',
        'Fighter',
        3,
        jsonb_build_object(
            'strength', jsonb_build_object('total', 16, 'modifier', 3),
            'dexterity', jsonb_build_object('total', 14, 'modifier', 2),
            'constitution', jsonb_build_object('total', 15, 'modifier', 2),
            'intelligence', jsonb_build_object('total', 10, 'modifier', 0),
            'wisdom', jsonb_build_object('total', 12, 'modifier', 1),
            'charisma', jsonb_build_object('total', 8, 'modifier', -1)
        ),
        25, 25, 18
    FROM Users p, Campaigns c 
    WHERE p.Email = 'player@dndai.dev' AND c.Name = 'Development Test Campaign';
    
    RAISE NOTICE 'Development environment setup completed';
END;
$$ LANGUAGE plpgsql;
```

### Production Migration Safeguards
```sql
-- Function to validate production migrations
CREATE OR REPLACE FUNCTION validate_production_migration(migration_script TEXT)
RETURNS TABLE(is_safe BOOLEAN, warnings TEXT[], blockers TEXT[]) AS $$
DECLARE
    warning_list TEXT[] := '{}';
    blocker_list TEXT[] := '{}';
    is_migration_safe BOOLEAN := TRUE;
BEGIN
    -- Check for dangerous operations
    IF migration_script ~* 'DROP\s+TABLE' THEN
        blocker_list := array_append(blocker_list, 'Contains DROP TABLE statement');
        is_migration_safe := FALSE;
    END IF;
    
    IF migration_script ~* 'DROP\s+COLUMN' THEN
        warning_list := array_append(warning_list, 'Contains DROP COLUMN statement');
    END IF;
    
    IF migration_script ~* 'ALTER\s+COLUMN.*DROP\s+NOT\s+NULL' THEN
        warning_list := array_append(warning_list, 'Removes NOT NULL constraint');
    END IF;
    
    IF migration_script ~* 'CREATE\s+INDEX(?!\s+CONCURRENTLY)' THEN
        warning_list := array_append(warning_list, 'Creates index without CONCURRENTLY (may lock table)');
    END IF;
    
    IF migration_script ~* 'ALTER\s+TABLE.*ADD\s+CONSTRAINT.*FOREIGN\s+KEY' THEN
        warning_list := array_append(warning_list, 'Adds foreign key constraint (may lock table)');
    END IF;
    
    -- Check for missing rollback procedures
    IF migration_script !~* 'DOWN\s*SCRIPT' AND migration_script ~* 'CREATE|ALTER|DROP' THEN
        warning_list := array_append(warning_list, 'No rollback script provided for schema changes');
    END IF;
    
    RETURN QUERY SELECT is_migration_safe, warning_list, blocker_list;
END;
$$ LANGUAGE plpgsql;
```

## Data Migration Utilities

### Large Table Migration Helper
```sql
-- Function for safe large table migrations
CREATE OR REPLACE FUNCTION migrate_large_table(
    table_name TEXT,
    migration_query TEXT,
    batch_size INTEGER DEFAULT 1000,
    sleep_duration INTERVAL DEFAULT '100 milliseconds'
)
RETURNS INTEGER AS $$
DECLARE
    total_rows INTEGER := 0;
    batch_count INTEGER := 0;
    rows_processed INTEGER;
BEGIN
    -- Get total row count
    EXECUTE format('SELECT COUNT(*) FROM %I', table_name) INTO total_rows;
    
    RAISE NOTICE 'Starting migration of % rows from table %', total_rows, table_name;
    
    LOOP
        -- Process batch
        EXECUTE format('%s LIMIT %s OFFSET %s', migration_query, batch_size, batch_count * batch_size);
        
        GET DIAGNOSTICS rows_processed = ROW_COUNT;
        
        IF rows_processed = 0 THEN
            EXIT;
        END IF;
        
        batch_count := batch_count + 1;
        
        RAISE NOTICE 'Processed batch % (%/% rows)', batch_count, batch_count * batch_size, total_rows;
        
        -- Sleep to reduce load
        PERFORM pg_sleep(EXTRACT(EPOCH FROM sleep_duration));
    END LOOP;
    
    RAISE NOTICE 'Migration completed: % batches processed', batch_count;
    RETURN batch_count;
END;
$$ LANGUAGE plpgsql;
```

### Data Consistency Checker
```sql
-- Function to check data consistency after migrations
CREATE OR REPLACE FUNCTION check_data_consistency()
RETURNS TABLE(table_name TEXT, check_name TEXT, status TEXT, details TEXT) AS $$
BEGIN
    -- Check user data consistency
    RETURN QUERY
    SELECT 'Users'::TEXT, 'Email Uniqueness'::TEXT, 
           CASE WHEN COUNT(*) = COUNT(DISTINCT Email) THEN 'PASS' ELSE 'FAIL' END,
           format('%s total emails, %s unique emails', COUNT(*), COUNT(DISTINCT Email))::TEXT
    FROM Users WHERE IsDeleted = FALSE;
    
    -- Check campaign player counts
    RETURN QUERY
    SELECT 'Campaigns'::TEXT, 'Player Count Accuracy'::TEXT,
           CASE WHEN inconsistent_count = 0 THEN 'PASS' ELSE 'FAIL' END,
           format('%s campaigns with incorrect player counts', inconsistent_count)::TEXT
    FROM (
        SELECT COUNT(*) as inconsistent_count
        FROM Campaigns c
        LEFT JOIN (
            SELECT CampaignId, COUNT(*) as actual_count
            FROM CampaignPlayers
            WHERE Status = 'Active'
            GROUP BY CampaignId
        ) cp ON c.Id = cp.CampaignId
        WHERE c.PlayerCount != COALESCE(cp.actual_count, 0)
        AND c.IsDeleted = FALSE
    ) consistency_check;
    
    -- Check character level progression
    RETURN QUERY
    SELECT 'Characters'::TEXT, 'Level Progression'::TEXT,
           CASE WHEN invalid_count = 0 THEN 'PASS' ELSE 'FAIL' END,
           format('%s characters with invalid level progression', invalid_count)::TEXT
    FROM (
        SELECT COUNT(*) as invalid_count
        FROM Characters
        WHERE (Level < 1 OR Level > 20)
        AND IsDeleted = FALSE
    ) level_check;
    
    -- Add more consistency checks as needed...
END;
$$ LANGUAGE plpgsql;
```

## Backup and Recovery Integration

### Pre-Migration Backup
```sql
-- Function to create backup before major migrations
CREATE OR REPLACE FUNCTION create_pre_migration_backup(migration_id VARCHAR(100))
RETURNS TEXT AS $$
DECLARE
    backup_name TEXT;
    backup_command TEXT;
BEGIN
    backup_name := format('pre_migration_%s_%s', migration_id, to_char(NOW(), 'YYYY_MM_DD_HH24_MI_SS'));
    
    -- This would integrate with your backup system
    -- Example for pg_dump (adjust for your environment)
    backup_command := format('pg_dump -Fc -f /backups/%s.backup %s', backup_name, current_database());
    
    -- In practice, this would be handled by your deployment system
    RAISE NOTICE 'Backup command: %', backup_command;
    RAISE NOTICE 'Execute this command before running migration %', migration_id;
    
    RETURN backup_name;
END;
$$ LANGUAGE plpgsql;
```

## Migration Monitoring and Reporting

### Migration Status Dashboard
```sql
-- View for migration status overview
CREATE OR REPLACE VIEW MigrationStatusDashboard AS
SELECT 
    dm.Version,
    dm.MigrationName,
    dm.MigrationType,
    dm.Status,
    dm.ExecutedAt,
    dm.ExecutionTimeMs,
    CASE 
        WHEN dm.Status = 'Failed' THEN dm.ErrorMessage
        ELSE NULL
    END as ErrorDetails,
    CASE 
        WHEN dm.DownScript IS NOT NULL THEN 'Yes'
        ELSE 'No'
    END as HasRollback
FROM DatabaseMigrations dm
ORDER BY dm.ExecutedAt DESC;

-- Function to generate migration report
CREATE OR REPLACE FUNCTION generate_migration_report()
RETURNS TABLE(
    total_migrations INTEGER,
    successful_migrations INTEGER,
    failed_migrations INTEGER,
    rolled_back_migrations INTEGER,
    avg_execution_time_ms NUMERIC,
    latest_version TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_migrations,
        COUNT(*) FILTER (WHERE Status = 'Applied')::INTEGER as successful_migrations,
        COUNT(*) FILTER (WHERE Status = 'Failed')::INTEGER as failed_migrations,
        COUNT(*) FILTER (WHERE Status = 'RolledBack')::INTEGER as rolled_back_migrations,
        ROUND(AVG(ExecutionTimeMs), 2) as avg_execution_time_ms,
        MAX(Version) as latest_version
    FROM DatabaseMigrations;
END;
$$ LANGUAGE plpgsql;
```

## Continuous Integration Integration

### CI/CD Migration Script
```bash
#!/bin/bash
# migrate.sh - Database migration script for CI/CD

set -e

DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-dndai}
DB_USER=${DB_USER:-postgres}
MIGRATION_DIR=${MIGRATION_DIR:-./migrations}

echo "Starting database migration process..."
echo "Target: $DB_HOST:$DB_PORT/$DB_NAME"

# Check database connectivity
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT 1;" > /dev/null

# Create migration tracking table if it doesn't exist
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f ./scripts/create_migration_table.sql

# Run pending migrations
for migration_file in $MIGRATION_DIR/*.sql; do
    if [ -f "$migration_file" ]; then
        migration_id=$(basename "$migration_file" .sql)
        echo "Processing migration: $migration_id"
        
        # Check if migration already applied
        applied=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT EXISTS(SELECT 1 FROM DatabaseMigrations WHERE MigrationId = '$migration_id');")
        
        if [ "$applied" = " f" ]; then
            echo "Applying migration: $migration_id"
            psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "$migration_file"
            echo "Migration $migration_id completed successfully"
        else
            echo "Migration $migration_id already applied, skipping"
        fi
    fi
done

echo "Database migration process completed successfully"
```

This comprehensive migration and seeding strategy provides a robust foundation for managing database schema evolution, data migrations, and environment-specific setup for the D&D AI Campaign Management System.
