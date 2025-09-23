# Core Entity Database Schemas

## Overview
This document defines the core entity schemas for the D&D AI Campaign Management System, including Users, Campaigns, Characters, and NPCs with their relationships and constraints.

## Database Technology
- **Primary Database**: PostgreSQL 15+
- **ORM**: Entity Framework Core 8.0+
- **Schema Management**: EF Core Migrations
- **Indexing Strategy**: Optimized for read-heavy workloads with complex queries

## Core Entities

### Users Table
Primary user account information and preferences.

```sql
CREATE TABLE Users (
    Id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    Email VARCHAR(255) NOT NULL UNIQUE,
    EmailVerified BOOLEAN NOT NULL DEFAULT FALSE,
    PasswordHash VARCHAR(255) NOT NULL,
    DisplayName VARCHAR(100) NOT NULL,
    Role VARCHAR(20) NOT NULL DEFAULT 'Player' CHECK (Role IN ('Player', 'GameMaster', 'Admin')),
    SubscriptionTier VARCHAR(20) NOT NULL DEFAULT 'Free' CHECK (SubscriptionTier IN ('Free', 'DungeonArchitect', 'CampaignWeaver', 'GuildMaster')),
    AvatarUrl VARCHAR(500),
    Timezone VARCHAR(50) DEFAULT 'UTC',
    
    -- Preferences stored as JSONB for flexibility
    Preferences JSONB NOT NULL DEFAULT '{}',
    
    -- Audit fields
    CreatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UpdatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    LastLoginAt TIMESTAMPTZ,
    LastActiveAt TIMESTAMPTZ,
    
    -- Soft delete
    IsDeleted BOOLEAN NOT NULL DEFAULT FALSE,
    DeletedAt TIMESTAMPTZ,
    DeletedBy UUID REFERENCES Users(Id)
);

-- Indexes for Users
CREATE INDEX IX_Users_Email ON Users(Email) WHERE IsDeleted = FALSE;
CREATE INDEX IX_Users_Role ON Users(Role) WHERE IsDeleted = FALSE;
CREATE INDEX IX_Users_SubscriptionTier ON Users(SubscriptionTier) WHERE IsDeleted = FALSE;
CREATE INDEX IX_Users_CreatedAt ON Users(CreatedAt) WHERE IsDeleted = FALSE;
CREATE INDEX IX_Users_LastActiveAt ON Users(LastActiveAt) WHERE IsDeleted = FALSE;

-- Preferences JSONB indexes for common queries
CREATE INDEX IX_Users_Preferences_Theme ON Users USING GIN ((Preferences->'theme')) WHERE IsDeleted = FALSE;
CREATE INDEX IX_Users_Preferences_Notifications ON Users USING GIN ((Preferences->'notifications')) WHERE IsDeleted = FALSE;
```

### UserSessions Table
Track user login sessions and JWT token management.

```sql
CREATE TABLE UserSessions (
    Id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    UserId UUID NOT NULL REFERENCES Users(Id) ON DELETE CASCADE,
    RefreshToken VARCHAR(255) NOT NULL UNIQUE,
    RefreshTokenHash VARCHAR(255) NOT NULL,
    DeviceInfo JSONB,
    IpAddress INET,
    UserAgent TEXT,
    
    CreatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ExpiresAt TIMESTAMPTZ NOT NULL,
    LastUsedAt TIMESTAMPTZ,
    IsRevoked BOOLEAN NOT NULL DEFAULT FALSE,
    RevokedAt TIMESTAMPTZ,
    RevokedReason VARCHAR(100)
);

-- Indexes for UserSessions
CREATE INDEX IX_UserSessions_UserId ON UserSessions(UserId);
CREATE INDEX IX_UserSessions_RefreshToken ON UserSessions(RefreshToken) WHERE IsRevoked = FALSE;
CREATE INDEX IX_UserSessions_ExpiresAt ON UserSessions(ExpiresAt) WHERE IsRevoked = FALSE;
CREATE INDEX IX_UserSessions_CreatedAt ON UserSessions(CreatedAt);
```

### Campaigns Table
Core campaign information and world state.

```sql
CREATE TABLE Campaigns (
    Id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    Name VARCHAR(200) NOT NULL,
    Description TEXT,
    GameMasterId UUID NOT NULL REFERENCES Users(Id),
    Status VARCHAR(20) NOT NULL DEFAULT 'Planning' CHECK (Status IN ('Planning', 'Active', 'Paused', 'Completed', 'Archived')),
    
    -- Campaign settings stored as JSONB for flexibility
    Settings JSONB NOT NULL DEFAULT '{}',
    
    -- World state information
    WorldState JSONB NOT NULL DEFAULT '{}',
    
    -- Statistics
    PlayerCount INTEGER NOT NULL DEFAULT 0,
    SessionCount INTEGER NOT NULL DEFAULT 0,
    
    -- Template information
    TemplateId UUID,
    IsTemplate BOOLEAN NOT NULL DEFAULT FALSE,
    TemplateCategory VARCHAR(50),
    
    -- Sharing and visibility
    IsPublic BOOLEAN NOT NULL DEFAULT FALSE,
    ShareCode VARCHAR(20) UNIQUE,
    
    -- Audit fields
    CreatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UpdatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    LastPlayedAt TIMESTAMPTZ,
    
    -- Soft delete
    IsDeleted BOOLEAN NOT NULL DEFAULT FALSE,
    DeletedAt TIMESTAMPTZ,
    DeletedBy UUID REFERENCES Users(Id)
);

-- Indexes for Campaigns
CREATE INDEX IX_Campaigns_GameMasterId ON Campaigns(GameMasterId) WHERE IsDeleted = FALSE;
CREATE INDEX IX_Campaigns_Status ON Campaigns(Status) WHERE IsDeleted = FALSE;
CREATE INDEX IX_Campaigns_CreatedAt ON Campaigns(CreatedAt) WHERE IsDeleted = FALSE;
CREATE INDEX IX_Campaigns_LastPlayedAt ON Campaigns(LastPlayedAt) WHERE IsDeleted = FALSE;
CREATE INDEX IX_Campaigns_IsTemplate ON Campaigns(IsTemplate) WHERE IsDeleted = FALSE;
CREATE INDEX IX_Campaigns_ShareCode ON Campaigns(ShareCode) WHERE IsDeleted = FALSE AND ShareCode IS NOT NULL;

-- JSONB indexes for campaign settings and world state
CREATE INDEX IX_Campaigns_Settings ON Campaigns USING GIN (Settings) WHERE IsDeleted = FALSE;
CREATE INDEX IX_Campaigns_WorldState ON Campaigns USING GIN (WorldState) WHERE IsDeleted = FALSE;
CREATE INDEX IX_Campaigns_Settings_MaxPlayers ON Campaigns USING GIN ((Settings->'max_players')) WHERE IsDeleted = FALSE;
CREATE INDEX IX_Campaigns_WorldState_Location ON Campaigns USING GIN ((WorldState->'current_location')) WHERE IsDeleted = FALSE;
```

### CampaignPlayers Table
Junction table for campaign membership with roles and permissions.

```sql
CREATE TABLE CampaignPlayers (
    Id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    CampaignId UUID NOT NULL REFERENCES Campaigns(Id) ON DELETE CASCADE,
    UserId UUID NOT NULL REFERENCES Users(Id) ON DELETE CASCADE,
    Role VARCHAR(20) NOT NULL DEFAULT 'Player' CHECK (Role IN ('Player', 'CoGM', 'Observer')),
    Status VARCHAR(20) NOT NULL DEFAULT 'Active' CHECK (Status IN ('Invited', 'Active', 'Inactive', 'Removed')),
    
    -- Player-specific campaign data
    CharacterCount INTEGER NOT NULL DEFAULT 0,
    Permissions JSONB DEFAULT '{}',
    Notes TEXT,
    
    -- Invitation tracking
    InvitedBy UUID REFERENCES Users(Id),
    InvitedAt TIMESTAMPTZ,
    JoinedAt TIMESTAMPTZ,
    
    -- Audit fields
    CreatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UpdatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(CampaignId, UserId)
);

-- Indexes for CampaignPlayers
CREATE INDEX IX_CampaignPlayers_CampaignId ON CampaignPlayers(CampaignId);
CREATE INDEX IX_CampaignPlayers_UserId ON CampaignPlayers(UserId);
CREATE INDEX IX_CampaignPlayers_Status ON CampaignPlayers(Status);
CREATE INDEX IX_CampaignPlayers_Role ON CampaignPlayers(Role);
CREATE INDEX IX_CampaignPlayers_JoinedAt ON CampaignPlayers(JoinedAt);
```

### Characters Table
Player character information with D&D 5e data.

```sql
CREATE TABLE Characters (
    Id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    Name VARCHAR(100) NOT NULL,
    PlayerId UUID NOT NULL REFERENCES Users(Id),
    CampaignId UUID NOT NULL REFERENCES Campaigns(Id) ON DELETE CASCADE,
    
    -- Basic character information
    Race VARCHAR(50) NOT NULL,
    Subrace VARCHAR(50),
    Class VARCHAR(50) NOT NULL,
    Subclass VARCHAR(50),
    Background VARCHAR(50) NOT NULL,
    Level INTEGER NOT NULL DEFAULT 1 CHECK (Level >= 1 AND Level <= 20),
    ExperiencePoints INTEGER NOT NULL DEFAULT 0,
    
    -- Core stats stored as JSONB for flexibility
    AbilityScores JSONB NOT NULL DEFAULT '{}',
    Skills JSONB NOT NULL DEFAULT '{}',
    SavingThrows JSONB NOT NULL DEFAULT '{}',
    
    -- Combat stats
    ArmorClass INTEGER NOT NULL DEFAULT 10,
    HitPointsMax INTEGER NOT NULL,
    HitPointsCurrent INTEGER NOT NULL,
    HitPointsTemporary INTEGER NOT NULL DEFAULT 0,
    Speed INTEGER NOT NULL DEFAULT 30,
    ProficiencyBonus INTEGER NOT NULL DEFAULT 2,
    
    -- Character features and traits
    Features JSONB NOT NULL DEFAULT '[]',
    Traits JSONB NOT NULL DEFAULT '[]',
    Languages JSONB NOT NULL DEFAULT '[]',
    Proficiencies JSONB NOT NULL DEFAULT '{}',
    
    -- Equipment and inventory
    Equipment JSONB NOT NULL DEFAULT '[]',
    Currency JSONB NOT NULL DEFAULT '{"cp":0,"sp":0,"ep":0,"gp":0,"pp":0}',
    
    -- Spellcasting (if applicable)
    Spells JSONB DEFAULT NULL,
    SpellSlots JSONB DEFAULT NULL,
    
    -- Character personality and background
    PersonalityTraits TEXT,
    Ideals TEXT,
    Bonds TEXT,
    Flaws TEXT,
    BackstoryText TEXT,
    
    -- AI-generated content
    AIGeneratedBackground JSONB,
    
    -- Character appearance and notes
    Appearance TEXT,
    Notes TEXT,
    AvatarUrl VARCHAR(500),
    
    -- Character status
    Status VARCHAR(20) NOT NULL DEFAULT 'Active' CHECK (Status IN ('Active', 'Inactive', 'Dead', 'Retired')),
    
    -- Audit fields
    CreatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UpdatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Soft delete
    IsDeleted BOOLEAN NOT NULL DEFAULT FALSE,
    DeletedAt TIMESTAMPTZ,
    DeletedBy UUID REFERENCES Users(Id),
    
    -- Constraints
    UNIQUE(CampaignId, Name),
    CHECK (HitPointsCurrent >= 0),
    CHECK (HitPointsCurrent <= HitPointsMax + HitPointsTemporary)
);

-- Indexes for Characters
CREATE INDEX IX_Characters_PlayerId ON Characters(PlayerId) WHERE IsDeleted = FALSE;
CREATE INDEX IX_Characters_CampaignId ON Characters(CampaignId) WHERE IsDeleted = FALSE;
CREATE INDEX IX_Characters_Name ON Characters(Name) WHERE IsDeleted = FALSE;
CREATE INDEX IX_Characters_Race ON Characters(Race) WHERE IsDeleted = FALSE;
CREATE INDEX IX_Characters_Class ON Characters(Class) WHERE IsDeleted = FALSE;
CREATE INDEX IX_Characters_Level ON Characters(Level) WHERE IsDeleted = FALSE;
CREATE INDEX IX_Characters_Status ON Characters(Status) WHERE IsDeleted = FALSE;
CREATE INDEX IX_Characters_CreatedAt ON Characters(CreatedAt) WHERE IsDeleted = FALSE;

-- JSONB indexes for character data
CREATE INDEX IX_Characters_AbilityScores ON Characters USING GIN (AbilityScores) WHERE IsDeleted = FALSE;
CREATE INDEX IX_Characters_Skills ON Characters USING GIN (Skills) WHERE IsDeleted = FALSE;
CREATE INDEX IX_Characters_Equipment ON Characters USING GIN (Equipment) WHERE IsDeleted = FALSE;
CREATE INDEX IX_Characters_Spells ON Characters USING GIN (Spells) WHERE IsDeleted = FALSE AND Spells IS NOT NULL;
```

### NPCs Table
Non-player character information with AI-generated content.

```sql
CREATE TABLE NPCs (
    Id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    Name VARCHAR(100) NOT NULL,
    CampaignId UUID NOT NULL REFERENCES Campaigns(Id) ON DELETE CASCADE,
    CreatedBy UUID NOT NULL REFERENCES Users(Id),
    
    -- Basic NPC information
    NPCType VARCHAR(20) NOT NULL DEFAULT 'Neutral' CHECK (NPCType IN ('Friendly', 'Neutral', 'Hostile', 'Ally', 'Enemy', 'QuestGiver')),
    Race VARCHAR(50),
    Gender VARCHAR(20),
    Age INTEGER,
    Occupation VARCHAR(100),
    
    -- Location and movement
    CurrentLocation VARCHAR(200),
    TypicalLocation VARCHAR(200),
    MovementPattern VARCHAR(20) DEFAULT 'Stationary' CHECK (MovementPattern IN ('Stationary', 'Local', 'Traveling', 'FollowingParty')),
    
    -- Appearance and personality
    Appearance JSONB NOT NULL DEFAULT '{}',
    Personality JSONB NOT NULL DEFAULT '{}',
    Background JSONB NOT NULL DEFAULT '{}',
    
    -- Relationships and social connections
    Relationships JSONB NOT NULL DEFAULT '{}',
    
    -- Combat and mechanical information
    CombatStats JSONB,
    Capabilities JSONB NOT NULL DEFAULT '{}',
    
    -- Knowledge and secrets
    Knowledge JSONB NOT NULL DEFAULT '{}',
    
    -- Quest involvement
    QuestInvolvement JSONB NOT NULL DEFAULT '[]',
    
    -- Current status and state
    CurrentMood VARCHAR(20) DEFAULT 'Neutral',
    HealthStatus VARCHAR(20) DEFAULT 'Healthy',
    CurrentActivity VARCHAR(100),
    Availability VARCHAR(50) DEFAULT 'Available',
    
    -- AI generation metadata
    AIGenerationMetadata JSONB,
    
    -- Audit fields
    CreatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UpdatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Soft delete
    IsDeleted BOOLEAN NOT NULL DEFAULT FALSE,
    DeletedAt TIMESTAMPTZ,
    DeletedBy UUID REFERENCES Users(Id)
);

-- Indexes for NPCs
CREATE INDEX IX_NPCs_CampaignId ON NPCs(CampaignId) WHERE IsDeleted = FALSE;
CREATE INDEX IX_NPCs_CreatedBy ON NPCs(CreatedBy) WHERE IsDeleted = FALSE;
CREATE INDEX IX_NPCs_NPCType ON NPCs(NPCType) WHERE IsDeleted = FALSE;
CREATE INDEX IX_NPCs_Name ON NPCs(Name) WHERE IsDeleted = FALSE;
CREATE INDEX IX_NPCs_Race ON NPCs(Race) WHERE IsDeleted = FALSE;
CREATE INDEX IX_NPCs_Occupation ON NPCs(Occupation) WHERE IsDeleted = FALSE;
CREATE INDEX IX_NPCs_CurrentLocation ON NPCs(CurrentLocation) WHERE IsDeleted = FALSE;
CREATE INDEX IX_NPCs_CreatedAt ON NPCs(CreatedAt) WHERE IsDeleted = FALSE;

-- JSONB indexes for NPC data
CREATE INDEX IX_NPCs_Personality ON NPCs USING GIN (Personality) WHERE IsDeleted = FALSE;
CREATE INDEX IX_NPCs_Relationships ON NPCs USING GIN (Relationships) WHERE IsDeleted = FALSE;
CREATE INDEX IX_NPCs_Knowledge ON NPCs USING GIN (Knowledge) WHERE IsDeleted = FALSE;
CREATE INDEX IX_NPCs_QuestInvolvement ON NPCs USING GIN (QuestInvolvement) WHERE IsDeleted = FALSE;
```

### NPCInteractions Table
Track dialogue and interactions between NPCs and players.

```sql
CREATE TABLE NPCInteractions (
    Id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    NPCId UUID NOT NULL REFERENCES NPCs(Id) ON DELETE CASCADE,
    SessionId UUID, -- Reference to game session
    InteractionType VARCHAR(20) NOT NULL CHECK (InteractionType IN ('Dialogue', 'Combat', 'Trade', 'Quest', 'Social')),
    
    -- Interaction participants
    PartyMembers JSONB NOT NULL DEFAULT '[]',
    PrimarySpeaker UUID REFERENCES Users(Id),
    
    -- Interaction content
    PlayerMessage TEXT,
    NPCResponse TEXT,
    NPCActions JSONB DEFAULT '[]',
    NPCMood VARCHAR(20),
    
    -- Context information
    Location VARCHAR(200),
    GameTime VARCHAR(50),
    Circumstances TEXT,
    
    -- Information shared
    InformationShared JSONB DEFAULT '[]',
    SecretsRevealed JSONB DEFAULT '[]',
    
    -- Relationship impact
    RelationshipChanges JSONB DEFAULT '{}',
    TrustLevelChange INTEGER DEFAULT 0,
    
    -- Mechanical effects
    ExperienceGained INTEGER DEFAULT 0,
    ItemsExchanged JSONB DEFAULT '[]',
    QuestUpdates JSONB DEFAULT '[]',
    
    CreatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for NPCInteractions
CREATE INDEX IX_NPCInteractions_NPCId ON NPCInteractions(NPCId);
CREATE INDEX IX_NPCInteractions_SessionId ON NPCInteractions(SessionId);
CREATE INDEX IX_NPCInteractions_PrimarySpeaker ON NPCInteractions(PrimarySpeaker);
CREATE INDEX IX_NPCInteractions_InteractionType ON NPCInteractions(InteractionType);
CREATE INDEX IX_NPCInteractions_CreatedAt ON NPCInteractions(CreatedAt);
```

## Entity Relationships

### Primary Relationships
```sql
-- User can be GM of multiple campaigns
ALTER TABLE Campaigns ADD CONSTRAINT FK_Campaigns_GameMaster 
    FOREIGN KEY (GameMasterId) REFERENCES Users(Id);

-- User can be player in multiple campaigns
ALTER TABLE CampaignPlayers ADD CONSTRAINT FK_CampaignPlayers_Campaign
    FOREIGN KEY (CampaignId) REFERENCES Campaigns(Id) ON DELETE CASCADE;
ALTER TABLE CampaignPlayers ADD CONSTRAINT FK_CampaignPlayers_User
    FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE;

-- Character belongs to one player and one campaign
ALTER TABLE Characters ADD CONSTRAINT FK_Characters_Player
    FOREIGN KEY (PlayerId) REFERENCES Users(Id);
ALTER TABLE Characters ADD CONSTRAINT FK_Characters_Campaign
    FOREIGN KEY (CampaignId) REFERENCES Campaigns(Id) ON DELETE CASCADE;

-- NPC belongs to one campaign and is created by one user
ALTER TABLE NPCs ADD CONSTRAINT FK_NPCs_Campaign
    FOREIGN KEY (CampaignId) REFERENCES Campaigns(Id) ON DELETE CASCADE;
ALTER TABLE NPCs ADD CONSTRAINT FK_NPCs_CreatedBy
    FOREIGN KEY (CreatedBy) REFERENCES Users(Id);

-- NPC interactions reference NPCs and users
ALTER TABLE NPCInteractions ADD CONSTRAINT FK_NPCInteractions_NPC
    FOREIGN KEY (NPCId) REFERENCES NPCs(Id) ON DELETE CASCADE;
ALTER TABLE NPCInteractions ADD CONSTRAINT FK_NPCInteractions_PrimarySpeaker
    FOREIGN KEY (PrimarySpeaker) REFERENCES Users(Id);
```

## Business Rules and Constraints

### User Constraints
```sql
-- Email format validation
ALTER TABLE Users ADD CONSTRAINT CK_Users_Email_Format 
    CHECK (Email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Display name length
ALTER TABLE Users ADD CONSTRAINT CK_Users_DisplayName_Length
    CHECK (LENGTH(DisplayName) >= 2 AND LENGTH(DisplayName) <= 100);
```

### Campaign Constraints
```sql
-- Campaign name length
ALTER TABLE Campaigns ADD CONSTRAINT CK_Campaigns_Name_Length
    CHECK (LENGTH(Name) >= 3 AND LENGTH(Name) <= 200);

-- Player count consistency
ALTER TABLE Campaigns ADD CONSTRAINT CK_Campaigns_PlayerCount_NonNegative
    CHECK (PlayerCount >= 0);
```

### Character Constraints
```sql
-- Character name length
ALTER TABLE Characters ADD CONSTRAINT CK_Characters_Name_Length
    CHECK (LENGTH(Name) >= 2 AND LENGTH(Name) <= 100);

-- Level bounds
ALTER TABLE Characters ADD CONSTRAINT CK_Characters_Level_Bounds
    CHECK (Level >= 1 AND Level <= 20);

-- Experience points non-negative
ALTER TABLE Characters ADD CONSTRAINT CK_Characters_ExperiencePoints_NonNegative
    CHECK (ExperiencePoints >= 0);

-- Hit points constraints
ALTER TABLE Characters ADD CONSTRAINT CK_Characters_HitPoints_Valid
    CHECK (HitPointsCurrent >= 0 AND HitPointsCurrent <= HitPointsMax + HitPointsTemporary);
```

### NPC Constraints
```sql
-- NPC name length
ALTER TABLE NPCs ADD CONSTRAINT CK_NPCs_Name_Length
    CHECK (LENGTH(Name) >= 2 AND LENGTH(Name) <= 100);

-- Age constraints (if specified)
ALTER TABLE NPCs ADD CONSTRAINT CK_NPCs_Age_Valid
    CHECK (Age IS NULL OR (Age >= 0 AND Age <= 10000));
```

## Data Types and JSONB Schemas

### User Preferences Schema
```json
{
  "theme": "dark",
  "notifications": {
    "email": true,
    "push": false,
    "in_app": true,
    "campaign_updates": true,
    "session_reminders": true
  },
  "privacy": {
    "profile_visibility": "friends",
    "activity_sharing": false,
    "show_online_status": true
  },
  "gameplay": {
    "auto_roll_damage": false,
    "show_dice_animations": true,
    "confirm_destructive_actions": true
  }
}
```

### Campaign Settings Schema
```json
{
  "max_players": 6,
  "level_range": {
    "min": 1,
    "max": 5
  },
  "ruleset": "D&D 5e",
  "content_rating": "PG-13",
  "ai_assistance_level": "Standard",
  "house_rules": [
    "Critical hits double all damage dice"
  ],
  "dice_rolling": {
    "allow_player_rolls": true,
    "require_gm_confirmation": false,
    "show_dc": false
  }
}
```

### Character Ability Scores Schema
```json
{
  "strength": {
    "base": 15,
    "racial_bonus": 2,
    "other_bonuses": 0,
    "total": 17,
    "modifier": 3
  },
  "dexterity": {
    "base": 13,
    "racial_bonus": 0,
    "other_bonuses": 0,
    "total": 13,
    "modifier": 1
  }
}
```

### NPC Personality Schema
```json
{
  "traits": [
    "Cautious about sharing information",
    "Protective of customers"
  ],
  "ideals": ["Hospitality", "Community safety"],
  "bonds": ["The Stonehill Inn", "People of Phandalin"],
  "flaws": ["Tends to worry excessively"],
  "alignment": "Neutral Good",
  "mannerisms": [
    "Leans in when sharing information",
    "Constantly cleaning glasses"
  ],
  "speech_pattern": {
    "accent": "Local",
    "vocabulary": "Common folk",
    "tone": "Warm but cautious",
    "quirks": ["Says 'aye' frequently"]
  }
}
```

## Performance Considerations

### Partitioning Strategy
```sql
-- Partition large tables by campaign for better performance
CREATE TABLE NPCInteractions_Partitioned (
    LIKE NPCInteractions INCLUDING ALL
) PARTITION BY HASH (CampaignId);

-- Create partitions
CREATE TABLE NPCInteractions_Part1 PARTITION OF NPCInteractions_Partitioned
    FOR VALUES WITH (MODULUS 4, REMAINDER 0);
CREATE TABLE NPCInteractions_Part2 PARTITION OF NPCInteractions_Partitioned
    FOR VALUES WITH (MODULUS 4, REMAINDER 1);
-- ... continue for remaining partitions
```

### Query Optimization
```sql
-- Materialized view for campaign statistics
CREATE MATERIALIZED VIEW CampaignStats AS
SELECT 
    c.Id as CampaignId,
    c.Name,
    c.PlayerCount,
    COUNT(ch.Id) as CharacterCount,
    COUNT(n.Id) as NPCCount,
    COUNT(DISTINCT ni.Id) as InteractionCount,
    MAX(c.LastPlayedAt) as LastActivity
FROM Campaigns c
LEFT JOIN Characters ch ON c.Id = ch.CampaignId AND ch.IsDeleted = FALSE
LEFT JOIN NPCs n ON c.Id = n.CampaignId AND n.IsDeleted = FALSE
LEFT JOIN NPCInteractions ni ON n.Id = ni.NPCId
WHERE c.IsDeleted = FALSE
GROUP BY c.Id, c.Name, c.PlayerCount;

CREATE UNIQUE INDEX IX_CampaignStats_CampaignId ON CampaignStats(CampaignId);
```

## Triggers and Automation

### Update Timestamps
```sql
-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.UpdatedAt = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to all tables with UpdatedAt
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON Users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON Campaigns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_characters_updated_at BEFORE UPDATE ON Characters
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_npcs_updated_at BEFORE UPDATE ON NPCs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Campaign Player Count Maintenance
```sql
-- Function to update campaign player count
CREATE OR REPLACE FUNCTION update_campaign_player_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.Status = 'Active' THEN
        UPDATE Campaigns 
        SET PlayerCount = PlayerCount + 1 
        WHERE Id = NEW.CampaignId;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.Status != 'Active' AND NEW.Status = 'Active' THEN
            UPDATE Campaigns 
            SET PlayerCount = PlayerCount + 1 
            WHERE Id = NEW.CampaignId;
        ELSIF OLD.Status = 'Active' AND NEW.Status != 'Active' THEN
            UPDATE Campaigns 
            SET PlayerCount = PlayerCount - 1 
            WHERE Id = NEW.CampaignId;
        END IF;
    ELSIF TG_OP = 'DELETE' AND OLD.Status = 'Active' THEN
        UPDATE Campaigns 
        SET PlayerCount = PlayerCount - 1 
        WHERE Id = OLD.CampaignId;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_campaign_player_count_trigger
    AFTER INSERT OR UPDATE OR DELETE ON CampaignPlayers
    FOR EACH ROW EXECUTE FUNCTION update_campaign_player_count();
```
