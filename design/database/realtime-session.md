# Real-time Session and Collaboration Database Schemas

## Overview
This document defines database schemas for real-time collaboration, session management, combat tracking, and live gameplay features in the D&D AI Campaign Management System.

## Session Management

### GameSessions Table
Track active and historical game sessions.

```sql
CREATE TABLE GameSessions (
    Id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    CampaignId UUID NOT NULL REFERENCES Campaigns(Id) ON DELETE CASCADE,
    
    -- Session identification
    SessionName VARCHAR(200),
    SessionNumber INTEGER,
    
    -- Session type and status
    SessionType VARCHAR(20) NOT NULL DEFAULT 'Gameplay' CHECK (SessionType IN ('Gameplay', 'Planning', 'CharacterCreation', 'WorldBuilding')),
    Status VARCHAR(20) NOT NULL DEFAULT 'Planned' CHECK (Status IN ('Planned', 'Active', 'Paused', 'Ended', 'Cancelled')),
    
    -- Session timing
    ScheduledStartTime TIMESTAMPTZ,
    ActualStartTime TIMESTAMPTZ,
    EndTime TIMESTAMPTZ,
    PausedDuration INTERVAL DEFAULT '0 minutes',
    
    -- Session content
    SessionNotes TEXT,
    SessionSummary TEXT,
    Objectives JSONB DEFAULT '[]',
    Accomplishments JSONB DEFAULT '[]',
    
    -- Game state
    CurrentScene VARCHAR(200),
    CurrentLocation VARCHAR(200),
    GameTime VARCHAR(100), -- In-game date/time
    
    -- Session metadata
    MaxParticipants INTEGER DEFAULT 8,
    IsRecorded BOOLEAN NOT NULL DEFAULT FALSE,
    RecordingUrl VARCHAR(500),
    
    -- Session creator and management
    CreatedBy UUID NOT NULL REFERENCES Users(Id),
    GameMaster UUID NOT NULL REFERENCES Users(Id),
    
    CreatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UpdatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for GameSessions
CREATE INDEX IX_GameSessions_CampaignId ON GameSessions(CampaignId);
CREATE INDEX IX_GameSessions_Status ON GameSessions(Status);
CREATE INDEX IX_GameSessions_SessionType ON GameSessions(SessionType);
CREATE INDEX IX_GameSessions_ScheduledStartTime ON GameSessions(ScheduledStartTime);
CREATE INDEX IX_GameSessions_ActualStartTime ON GameSessions(ActualStartTime);
CREATE INDEX IX_GameSessions_CreatedBy ON GameSessions(CreatedBy);
CREATE INDEX IX_GameSessions_GameMaster ON GameSessions(GameMaster);

-- Composite index for active sessions
CREATE INDEX IX_GameSessions_Active ON GameSessions(CampaignId, Status, ActualStartTime) 
    WHERE Status IN ('Active', 'Paused');
```

### SessionParticipants Table
Track who participated in each session.

```sql
CREATE TABLE SessionParticipants (
    Id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    SessionId UUID NOT NULL REFERENCES GameSessions(Id) ON DELETE CASCADE,
    UserId UUID NOT NULL REFERENCES Users(Id),
    CharacterId UUID REFERENCES Characters(Id),
    
    -- Participation details
    Role VARCHAR(20) NOT NULL DEFAULT 'Player' CHECK (Role IN ('GameMaster', 'Player', 'Observer')),
    Status VARCHAR(20) NOT NULL DEFAULT 'Invited' CHECK (Status IN ('Invited', 'Joined', 'Left', 'Kicked', 'Disconnected')),
    
    -- Timing
    InvitedAt TIMESTAMPTZ,
    JoinedAt TIMESTAMPTZ,
    LeftAt TIMESTAMPTZ,
    LastActiveAt TIMESTAMPTZ,
    
    -- Participation metrics
    ActiveDuration INTERVAL DEFAULT '0 minutes',
    MessageCount INTEGER DEFAULT 0,
    ActionCount INTEGER DEFAULT 0,
    
    -- Connection info
    ConnectionId VARCHAR(100),
    DeviceType VARCHAR(20),
    ClientVersion VARCHAR(50),
    
    CreatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UpdatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(SessionId, UserId)
);

-- Indexes for SessionParticipants
CREATE INDEX IX_SessionParticipants_SessionId ON SessionParticipants(SessionId);
CREATE INDEX IX_SessionParticipants_UserId ON SessionParticipants(UserId);
CREATE INDEX IX_SessionParticipants_CharacterId ON SessionParticipants(CharacterId) WHERE CharacterId IS NOT NULL;
CREATE INDEX IX_SessionParticipants_Status ON SessionParticipants(Status);
CREATE INDEX IX_SessionParticipants_JoinedAt ON SessionParticipants(JoinedAt);
CREATE INDEX IX_SessionParticipants_ConnectionId ON SessionParticipants(ConnectionId) WHERE ConnectionId IS NOT NULL;
```

### SessionState Table
Store session state snapshots for recovery and persistence.

```sql
CREATE TABLE SessionState (
    Id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    SessionId UUID NOT NULL REFERENCES GameSessions(Id) ON DELETE CASCADE,
    
    -- State versioning
    Version INTEGER NOT NULL DEFAULT 1,
    StateType VARCHAR(20) NOT NULL DEFAULT 'Snapshot' CHECK (StateType IN ('Snapshot', 'Checkpoint', 'Backup', 'Recovery')),
    
    -- State data
    WorldState JSONB NOT NULL DEFAULT '{}',
    CharacterStates JSONB NOT NULL DEFAULT '{}',
    NPCStates JSONB NOT NULL DEFAULT '{}',
    CombatState JSONB DEFAULT NULL,
    MapState JSONB DEFAULT NULL,
    
    -- Initiative and turn order
    InitiativeOrder JSONB DEFAULT NULL,
    CurrentTurn JSONB DEFAULT NULL,
    RoundNumber INTEGER DEFAULT NULL,
    
    -- Session context
    ActiveScene VARCHAR(200),
    SceneDescription TEXT,
    VisibleToPlayers JSONB DEFAULT '{}',
    
    -- State metadata
    Description TEXT,
    CreatedBy UUID REFERENCES Users(Id),
    IsAutoSave BOOLEAN NOT NULL DEFAULT FALSE,
    
    CreatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(SessionId, Version)
);

-- Indexes for SessionState
CREATE INDEX IX_SessionState_SessionId ON SessionState(SessionId);
CREATE INDEX IX_SessionState_Version ON SessionState(SessionId, Version);
CREATE INDEX IX_SessionState_StateType ON SessionState(StateType);
CREATE INDEX IX_SessionState_CreatedAt ON SessionState(CreatedAt);
CREATE INDEX IX_SessionState_IsAutoSave ON SessionState(IsAutoSave);

-- JSONB indexes for state queries
CREATE INDEX IX_SessionState_WorldState ON SessionState USING GIN (WorldState);
CREATE INDEX IX_SessionState_CombatState ON SessionState USING GIN (CombatState) WHERE CombatState IS NOT NULL;
```

## Real-time Communication

### SessionMessages Table
Store all chat messages and communications during sessions.

```sql
CREATE TABLE SessionMessages (
    Id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    SessionId UUID NOT NULL REFERENCES GameSessions(Id) ON DELETE CASCADE,
    SenderId UUID NOT NULL REFERENCES Users(Id),
    
    -- Message classification
    MessageType VARCHAR(20) NOT NULL DEFAULT 'Chat' CHECK (MessageType IN ('Chat', 'Action', 'Whisper', 'OOC', 'System', 'DiceRoll', 'AIGenerated')),
    Visibility VARCHAR(20) NOT NULL DEFAULT 'All' CHECK (Visibility IN ('All', 'GM', 'Players', 'Private', 'Whisper')),
    
    -- Message content
    Content TEXT NOT NULL,
    FormattedContent TEXT,
    
    -- Speaker information
    SpeakerType VARCHAR(20) NOT NULL DEFAULT 'Player' CHECK (SpeakerType IN ('Player', 'Character', 'NPC', 'GM', 'System', 'AI')),
    SpeakerName VARCHAR(100),
    CharacterId UUID REFERENCES Characters(Id),
    NPCId UUID REFERENCES NPCs(Id),
    
    -- Whisper/private message targets
    TargetUsers JSONB DEFAULT '[]',
    
    -- Message metadata
    Language VARCHAR(10) DEFAULT 'en',
    Mood VARCHAR(20),
    EmotionalTone VARCHAR(20),
    
    -- Dice roll information (if applicable)
    DiceRoll JSONB DEFAULT NULL,
    
    -- AI generation metadata (if applicable)
    AIGenerated BOOLEAN NOT NULL DEFAULT FALSE,
    AIRequestId UUID REFERENCES AIRequests(Id),
    
    -- Message status
    IsEdited BOOLEAN NOT NULL DEFAULT FALSE,
    EditedAt TIMESTAMPTZ,
    IsDeleted BOOLEAN NOT NULL DEFAULT FALSE,
    DeletedAt TIMESTAMPTZ,
    
    CreatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UpdatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for SessionMessages
CREATE INDEX IX_SessionMessages_SessionId ON SessionMessages(SessionId);
CREATE INDEX IX_SessionMessages_SenderId ON SessionMessages(SenderId);
CREATE INDEX IX_SessionMessages_MessageType ON SessionMessages(MessageType);
CREATE INDEX IX_SessionMessages_Visibility ON SessionMessages(Visibility);
CREATE INDEX IX_SessionMessages_SpeakerType ON SessionMessages(SpeakerType);
CREATE INDEX IX_SessionMessages_CharacterId ON SessionMessages(CharacterId) WHERE CharacterId IS NOT NULL;
CREATE INDEX IX_SessionMessages_NPCId ON SessionMessages(NPCId) WHERE NPCId IS NOT NULL;
CREATE INDEX IX_SessionMessages_CreatedAt ON SessionMessages(CreatedAt);
CREATE INDEX IX_SessionMessages_AIGenerated ON SessionMessages(AIGenerated) WHERE AIGenerated = TRUE;

-- Composite index for message retrieval
CREATE INDEX IX_SessionMessages_Retrieval ON SessionMessages(SessionId, CreatedAt, Visibility) WHERE IsDeleted = FALSE;
```

### DiceRolls Table
Track all dice rolls made during sessions.

```sql
CREATE TABLE DiceRolls (
    Id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    SessionId UUID NOT NULL REFERENCES GameSessions(Id) ON DELETE CASCADE,
    RollerId UUID NOT NULL REFERENCES Users(Id),
    CharacterId UUID REFERENCES Characters(Id),
    
    -- Roll details
    RollType VARCHAR(50) NOT NULL CHECK (RollType IN ('Attack', 'Damage', 'SavingThrow', 'AbilityCheck', 'SkillCheck', 'Initiative', 'Custom')),
    DiceExpression VARCHAR(200) NOT NULL,
    
    -- Roll context
    TargetNumber INTEGER,
    Advantage BOOLEAN DEFAULT FALSE,
    Disadvantage BOOLEAN DEFAULT FALSE,
    Modifier INTEGER DEFAULT 0,
    
    -- Ability/skill information
    Ability VARCHAR(20),
    Skill VARCHAR(50),
    ProficiencyBonus INTEGER DEFAULT 0,
    
    -- Target information
    TargetType VARCHAR(20) CHECK (TargetType IN ('Character', 'NPC', 'AC', 'DC', 'None')),
    TargetId UUID,
    TargetAC INTEGER,
    TargetDC INTEGER,
    
    -- Roll results
    IndividualRolls JSONB NOT NULL DEFAULT '[]',
    Modifiers JSONB NOT NULL DEFAULT '[]',
    TotalResult INTEGER NOT NULL,
    
    -- Roll interpretation
    Success BOOLEAN,
    CriticalHit BOOLEAN DEFAULT FALSE,
    CriticalMiss BOOLEAN DEFAULT FALSE,
    ResultDescription TEXT,
    
    -- Visibility and verification
    Visibility VARCHAR(20) NOT NULL DEFAULT 'All' CHECK (Visibility IN ('All', 'GM', 'Private')),
    IsVerified BOOLEAN NOT NULL DEFAULT TRUE,
    RollSource VARCHAR(20) NOT NULL DEFAULT 'Manual' CHECK (RollSource IN ('Manual', 'Automated', 'System')),
    
    -- Roll metadata
    Context TEXT,
    Tags JSONB DEFAULT '[]',
    
    CreatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for DiceRolls
CREATE INDEX IX_DiceRolls_SessionId ON DiceRolls(SessionId);
CREATE INDEX IX_DiceRolls_RollerId ON DiceRolls(RollerId);
CREATE INDEX IX_DiceRolls_CharacterId ON DiceRolls(CharacterId) WHERE CharacterId IS NOT NULL;
CREATE INDEX IX_DiceRolls_RollType ON DiceRolls(RollType);
CREATE INDEX IX_DiceRolls_CreatedAt ON DiceRolls(CreatedAt);
CREATE INDEX IX_DiceRolls_Success ON DiceRolls(Success) WHERE Success IS NOT NULL;
CREATE INDEX IX_DiceRolls_CriticalHit ON DiceRolls(CriticalHit) WHERE CriticalHit = TRUE;

-- JSONB indexes
CREATE INDEX IX_DiceRolls_IndividualRolls ON DiceRolls USING GIN (IndividualRolls);
CREATE INDEX IX_DiceRolls_Tags ON DiceRolls USING GIN (Tags);
```

## Combat Management

### CombatEncounters Table
Track combat encounters and their state.

```sql
CREATE TABLE CombatEncounters (
    Id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    SessionId UUID NOT NULL REFERENCES GameSessions(Id) ON DELETE CASCADE,
    CampaignId UUID NOT NULL REFERENCES Campaigns(Id) ON DELETE CASCADE,
    
    -- Encounter details
    Name VARCHAR(200),
    Description TEXT,
    EncounterType VARCHAR(20) NOT NULL DEFAULT 'Combat' CHECK (EncounterType IN ('Combat', 'Social', 'Exploration', 'Puzzle', 'Chase')),
    
    -- Combat status
    Status VARCHAR(20) NOT NULL DEFAULT 'Planned' CHECK (Status IN ('Planned', 'Active', 'Paused', 'Completed', 'Fled', 'Cancelled')),
    
    -- Encounter difficulty
    DifficultyRating VARCHAR(20) CHECK (DifficultyRating IN ('Trivial', 'Easy', 'Medium', 'Hard', 'Deadly')),
    EstimatedDuration INTEGER, -- minutes
    
    -- Combat mechanics
    InitiativeRolled BOOLEAN NOT NULL DEFAULT FALSE,
    CurrentRound INTEGER DEFAULT 0,
    CurrentTurnOrder INTEGER DEFAULT 0,
    
    -- Environment and conditions
    Location VARCHAR(200),
    Environment JSONB DEFAULT '{}',
    Weather VARCHAR(50),
    Lighting VARCHAR(20),
    Terrain JSONB DEFAULT '[]',
    
    -- Map and positioning
    MapId UUID,
    MapData JSONB,
    GridSize INTEGER DEFAULT 5, -- feet per square
    
    -- Timing
    StartedAt TIMESTAMPTZ,
    EndedAt TIMESTAMPTZ,
    PausedDuration INTERVAL DEFAULT '0 minutes',
    
    -- Results
    Outcome VARCHAR(20) CHECK (Outcome IN ('Victory', 'Defeat', 'Retreat', 'Negotiation', 'Other')),
    ExperienceAwarded INTEGER DEFAULT 0,
    TreasureAwarded JSONB DEFAULT '[]',
    
    -- Encounter notes
    GMNotes TEXT,
    PlayerNotes TEXT,
    
    CreatedBy UUID NOT NULL REFERENCES Users(Id),
    CreatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UpdatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for CombatEncounters
CREATE INDEX IX_CombatEncounters_SessionId ON CombatEncounters(SessionId);
CREATE INDEX IX_CombatEncounters_CampaignId ON CombatEncounters(CampaignId);
CREATE INDEX IX_CombatEncounters_Status ON CombatEncounters(Status);
CREATE INDEX IX_CombatEncounters_EncounterType ON CombatEncounters(EncounterType);
CREATE INDEX IX_CombatEncounters_StartedAt ON CombatEncounters(StartedAt);
CREATE INDEX IX_CombatEncounters_CreatedBy ON CombatEncounters(CreatedBy);

-- Active encounter index
CREATE UNIQUE INDEX IX_CombatEncounters_ActiveSession ON CombatEncounters(SessionId) 
    WHERE Status IN ('Active', 'Paused');
```

### InitiativeOrder Table
Track initiative order for combat encounters.

```sql
CREATE TABLE InitiativeOrder (
    Id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    EncounterId UUID NOT NULL REFERENCES CombatEncounters(Id) ON DELETE CASCADE,
    
    -- Participant identification
    ParticipantType VARCHAR(20) NOT NULL CHECK (ParticipantType IN ('PlayerCharacter', 'NPC', 'Monster', 'Summon', 'Hazard')),
    CharacterId UUID REFERENCES Characters(Id),
    NPCId UUID REFERENCES NPCs(Id),
    
    -- Initiative details
    InitiativeRoll INTEGER NOT NULL,
    InitiativeModifier INTEGER NOT NULL DEFAULT 0,
    InitiativeTotal INTEGER NOT NULL,
    TurnOrder INTEGER NOT NULL,
    
    -- Participant status
    Name VARCHAR(100) NOT NULL,
    IsActive BOOLEAN NOT NULL DEFAULT TRUE,
    IsVisible BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- Combat stats (snapshot at encounter start)
    ArmorClass INTEGER,
    HitPointsMax INTEGER,
    HitPointsCurrent INTEGER,
    HitPointsTemporary INTEGER DEFAULT 0,
    Speed INTEGER DEFAULT 30,
    
    -- Position and movement
    PositionX INTEGER,
    PositionY INTEGER,
    MovementUsed INTEGER DEFAULT 0,
    
    -- Turn tracking
    HasActed BOOLEAN NOT NULL DEFAULT FALSE,
    HasBonusAction BOOLEAN NOT NULL DEFAULT TRUE,
    HasReaction BOOLEAN NOT NULL DEFAULT TRUE,
    HasMovement BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- Conditions and effects
    Conditions JSONB DEFAULT '[]',
    TemporaryEffects JSONB DEFAULT '[]',
    
    -- Turn notes
    TurnNotes TEXT,
    
    CreatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UpdatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CHECK ((ParticipantType = 'PlayerCharacter' AND CharacterId IS NOT NULL) OR
           (ParticipantType IN ('NPC', 'Monster') AND NPCId IS NOT NULL) OR
           (ParticipantType IN ('Summon', 'Hazard')))
);

-- Indexes for InitiativeOrder
CREATE INDEX IX_InitiativeOrder_EncounterId ON InitiativeOrder(EncounterId);
CREATE INDEX IX_InitiativeOrder_CharacterId ON InitiativeOrder(CharacterId) WHERE CharacterId IS NOT NULL;
CREATE INDEX IX_InitiativeOrder_NPCId ON InitiativeOrder(NPCId) WHERE NPCId IS NOT NULL;
CREATE INDEX IX_InitiativeOrder_TurnOrder ON InitiativeOrder(EncounterId, TurnOrder);
CREATE INDEX IX_InitiativeOrder_IsActive ON InitiativeOrder(IsActive);

-- Composite index for turn management
CREATE INDEX IX_InitiativeOrder_TurnManagement ON InitiativeOrder(EncounterId, TurnOrder, IsActive);
```

### CombatActions Table
Log all actions taken during combat.

```sql
CREATE TABLE CombatActions (
    Id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    EncounterId UUID NOT NULL REFERENCES CombatEncounters(Id) ON DELETE CASCADE,
    InitiativeOrderId UUID NOT NULL REFERENCES InitiativeOrder(Id) ON DELETE CASCADE,
    
    -- Action timing
    Round INTEGER NOT NULL,
    TurnInRound INTEGER NOT NULL,
    ActionSequence INTEGER NOT NULL DEFAULT 1,
    
    -- Action classification
    ActionType VARCHAR(20) NOT NULL CHECK (ActionType IN ('Action', 'BonusAction', 'Reaction', 'Movement', 'FreeAction', 'LegendaryAction')),
    ActionCategory VARCHAR(50) NOT NULL CHECK (ActionCategory IN ('Attack', 'Cast', 'Dash', 'Dodge', 'Help', 'Hide', 'Ready', 'Search', 'UseObject', 'Custom')),
    
    -- Action details
    ActionName VARCHAR(100) NOT NULL,
    ActionDescription TEXT,
    
    -- Target information
    TargetType VARCHAR(20) CHECK (TargetType IN ('Character', 'NPC', 'Area', 'Self', 'None')),
    TargetId UUID,
    TargetPosition JSONB,
    
    -- Attack details (if applicable)
    AttackRoll INTEGER,
    AttackHit BOOLEAN,
    DamageRolls JSONB DEFAULT '[]',
    DamageTotal INTEGER DEFAULT 0,
    DamageType VARCHAR(20),
    
    -- Spell/ability details (if applicable)
    SpellName VARCHAR(100),
    SpellLevel INTEGER,
    SpellSlotUsed BOOLEAN DEFAULT FALSE,
    AbilityName VARCHAR(100),
    AbilityRecharge VARCHAR(20),
    
    -- Movement details (if applicable)
    MovementFrom JSONB,
    MovementTo JSONB,
    MovementDistance INTEGER DEFAULT 0,
    ProvokedOpportunityAttacks BOOLEAN DEFAULT FALSE,
    
    -- Action results
    Success BOOLEAN,
    CriticalHit BOOLEAN DEFAULT FALSE,
    ResultDescription TEXT,
    
    -- Resource usage
    ResourcesUsed JSONB DEFAULT '{}',
    
    -- Action metadata
    UserId UUID NOT NULL REFERENCES Users(Id),
    IsPlayerAction BOOLEAN NOT NULL DEFAULT TRUE,
    
    CreatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for CombatActions
CREATE INDEX IX_CombatActions_EncounterId ON CombatActions(EncounterId);
CREATE INDEX IX_CombatActions_InitiativeOrderId ON CombatActions(InitiativeOrderId);
CREATE INDEX IX_CombatActions_Round ON CombatActions(EncounterId, Round);
CREATE INDEX IX_CombatActions_ActionType ON CombatActions(ActionType);
CREATE INDEX IX_CombatActions_ActionCategory ON CombatActions(ActionCategory);
CREATE INDEX IX_CombatActions_UserId ON CombatActions(UserId);
CREATE INDEX IX_CombatActions_CreatedAt ON CombatActions(CreatedAt);

-- Composite index for action sequence
CREATE INDEX IX_CombatActions_Sequence ON CombatActions(EncounterId, Round, TurnInRound, ActionSequence);
```

## Map and Visual State

### SessionMaps Table
Track maps used in sessions and their state.

```sql
CREATE TABLE SessionMaps (
    Id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    SessionId UUID NOT NULL REFERENCES GameSessions(Id) ON DELETE CASCADE,
    
    -- Map identification
    MapName VARCHAR(200) NOT NULL,
    MapType VARCHAR(20) NOT NULL DEFAULT 'Battle' CHECK (MapType IN ('Battle', 'Exploration', 'World', 'Reference')),
    
    -- Map data
    MapImageUrl VARCHAR(500),
    MapData JSONB NOT NULL DEFAULT '{}',
    
    -- Grid configuration
    GridEnabled BOOLEAN NOT NULL DEFAULT TRUE,
    GridSize INTEGER DEFAULT 5, -- feet per square
    GridColor VARCHAR(7) DEFAULT '#000000',
    GridOpacity DECIMAL(3,2) DEFAULT 0.5,
    
    -- Map dimensions
    Width INTEGER NOT NULL,
    Height INTEGER NOT NULL,
    Scale DECIMAL(5,2) DEFAULT 1.0,
    
    -- Visibility settings
    FogOfWar JSONB DEFAULT '{}',
    RevealedAreas JSONB DEFAULT '[]',
    HiddenAreas JSONB DEFAULT '[]',
    
    -- Active status
    IsActive BOOLEAN NOT NULL DEFAULT FALSE,
    DisplayOrder INTEGER DEFAULT 0,
    
    -- Map metadata
    Description TEXT,
    CreatedBy UUID NOT NULL REFERENCES Users(Id),
    
    CreatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UpdatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for SessionMaps
CREATE INDEX IX_SessionMaps_SessionId ON SessionMaps(SessionId);
CREATE INDEX IX_SessionMaps_MapType ON SessionMaps(MapType);
CREATE INDEX IX_SessionMaps_IsActive ON SessionMaps(IsActive);
CREATE INDEX IX_SessionMaps_CreatedBy ON SessionMaps(CreatedBy);

-- Unique active map per session
CREATE UNIQUE INDEX IX_SessionMaps_ActivePerSession ON SessionMaps(SessionId) WHERE IsActive = TRUE;
```

### MapTokens Table
Track character and object tokens on maps.

```sql
CREATE TABLE MapTokens (
    Id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    SessionMapId UUID NOT NULL REFERENCES SessionMaps(Id) ON DELETE CASCADE,
    
    -- Token identification
    TokenType VARCHAR(20) NOT NULL CHECK (TokenType IN ('PlayerCharacter', 'NPC', 'Monster', 'Object', 'Marker', 'Effect')),
    Name VARCHAR(100) NOT NULL,
    
    -- Entity references
    CharacterId UUID REFERENCES Characters(Id),
    NPCId UUID REFERENCES NPCs(Id),
    
    -- Position and size
    PositionX DECIMAL(8,2) NOT NULL,
    PositionY DECIMAL(8,2) NOT NULL,
    SizeWidth DECIMAL(8,2) DEFAULT 1.0,
    SizeHeight DECIMAL(8,2) DEFAULT 1.0,
    
    -- Visual properties
    ImageUrl VARCHAR(500),
    Color VARCHAR(7) DEFAULT '#000000',
    Shape VARCHAR(20) DEFAULT 'Circle' CHECK (Shape IN ('Circle', 'Square', 'Rectangle', 'Custom')),
    Opacity DECIMAL(3,2) DEFAULT 1.0,
    
    -- Token status
    IsVisible BOOLEAN NOT NULL DEFAULT TRUE,
    IsMovable BOOLEAN NOT NULL DEFAULT TRUE,
    IsLocked BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Combat-specific properties
    Initiative INTEGER,
    HasActed BOOLEAN DEFAULT FALSE,
    Conditions JSONB DEFAULT '[]',
    
    -- Visibility permissions
    VisibleToPlayers BOOLEAN NOT NULL DEFAULT TRUE,
    VisibleToGM BOOLEAN NOT NULL DEFAULT TRUE,
    VisibleToOwner BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- Token metadata
    Notes TEXT,
    CreatedBy UUID NOT NULL REFERENCES Users(Id),
    
    CreatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UpdatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for MapTokens
CREATE INDEX IX_MapTokens_SessionMapId ON MapTokens(SessionMapId);
CREATE INDEX IX_MapTokens_TokenType ON MapTokens(TokenType);
CREATE INDEX IX_MapTokens_CharacterId ON MapTokens(CharacterId) WHERE CharacterId IS NOT NULL;
CREATE INDEX IX_MapTokens_NPCId ON MapTokens(NPCId) WHERE NPCId IS NOT NULL;
CREATE INDEX IX_MapTokens_Position ON MapTokens(SessionMapId, PositionX, PositionY);
CREATE INDEX IX_MapTokens_IsVisible ON MapTokens(IsVisible);
CREATE INDEX IX_MapTokens_CreatedBy ON MapTokens(CreatedBy);
```

## Connection Management

### RealtimeConnections Table
Track active WebSocket connections for real-time features.

```sql
CREATE TABLE RealtimeConnections (
    Id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    UserId UUID NOT NULL REFERENCES Users(Id),
    SessionId UUID REFERENCES GameSessions(Id),
    
    -- Connection details
    ConnectionId VARCHAR(100) NOT NULL UNIQUE,
    ConnectionType VARCHAR(20) NOT NULL DEFAULT 'WebSocket' CHECK (ConnectionType IN ('WebSocket', 'HTTP', 'Mobile')),
    
    -- Client information
    ClientType VARCHAR(20) NOT NULL CHECK (ClientType IN ('Web', 'Mobile', 'Desktop', 'API')),
    ClientVersion VARCHAR(50),
    UserAgent TEXT,
    
    -- Connection status
    Status VARCHAR(20) NOT NULL DEFAULT 'Connected' CHECK (Status IN ('Connected', 'Disconnected', 'Reconnecting', 'Error')),
    LastHeartbeat TIMESTAMPTZ,
    
    -- Network information
    IpAddress INET,
    Country VARCHAR(2),
    Region VARCHAR(100),
    
    -- Connection metrics
    ConnectTime TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    DisconnectTime TIMESTAMPTZ,
    TotalDuration INTERVAL,
    MessagesSent INTEGER DEFAULT 0,
    MessagesReceived INTEGER DEFAULT 0,
    
    -- Disconnect reason
    DisconnectReason VARCHAR(100),
    
    CreatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UpdatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for RealtimeConnections
CREATE INDEX IX_RealtimeConnections_UserId ON RealtimeConnections(UserId);
CREATE INDEX IX_RealtimeConnections_SessionId ON RealtimeConnections(SessionId) WHERE SessionId IS NOT NULL;
CREATE INDEX IX_RealtimeConnections_ConnectionId ON RealtimeConnections(ConnectionId);
CREATE INDEX IX_RealtimeConnections_Status ON RealtimeConnections(Status);
CREATE INDEX IX_RealtimeConnections_LastHeartbeat ON RealtimeConnections(LastHeartbeat) WHERE Status = 'Connected';
CREATE INDEX IX_RealtimeConnections_ConnectTime ON RealtimeConnections(ConnectTime);

-- Active connections index
CREATE INDEX IX_RealtimeConnections_Active ON RealtimeConnections(SessionId, Status, LastHeartbeat) 
    WHERE Status = 'Connected';
```

### ConnectionEvents Table
Log connection events for debugging and analytics.

```sql
CREATE TABLE ConnectionEvents (
    Id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ConnectionId VARCHAR(100) NOT NULL,
    UserId UUID REFERENCES Users(Id),
    SessionId UUID REFERENCES GameSessions(Id),
    
    -- Event details
    EventType VARCHAR(50) NOT NULL CHECK (EventType IN ('Connected', 'Disconnected', 'Reconnected', 'Error', 'Heartbeat', 'MessageSent', 'MessageReceived')),
    EventData JSONB DEFAULT '{}',
    
    -- Error information (if applicable)
    ErrorCode VARCHAR(50),
    ErrorMessage TEXT,
    
    -- Performance metrics
    ResponseTimeMs INTEGER,
    PayloadSize INTEGER,
    
    CreatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for ConnectionEvents
CREATE INDEX IX_ConnectionEvents_ConnectionId ON ConnectionEvents(ConnectionId);
CREATE INDEX IX_ConnectionEvents_UserId ON ConnectionEvents(UserId) WHERE UserId IS NOT NULL;
CREATE INDEX IX_ConnectionEvents_SessionId ON ConnectionEvents(SessionId) WHERE SessionId IS NOT NULL;
CREATE INDEX IX_ConnectionEvents_EventType ON ConnectionEvents(EventType);
CREATE INDEX IX_ConnectionEvents_CreatedAt ON ConnectionEvents(CreatedAt);

-- Partitioning by date for performance
CREATE TABLE ConnectionEvents_Y2024M01 PARTITION OF ConnectionEvents
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
-- Additional partitions would be created as needed
```

## Conflict Resolution

### StateConflicts Table
Track and resolve concurrent edit conflicts.

```sql
CREATE TABLE StateConflicts (
    Id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    SessionId UUID NOT NULL REFERENCES GameSessions(Id) ON DELETE CASCADE,
    
    -- Conflict identification
    ConflictType VARCHAR(50) NOT NULL CHECK (ConflictType IN ('CharacterState', 'NPCState', 'MapPosition', 'CombatAction', 'SessionState')),
    EntityType VARCHAR(50) NOT NULL,
    EntityId UUID NOT NULL,
    
    -- Conflicting changes
    ConflictingChanges JSONB NOT NULL DEFAULT '[]',
    
    -- Resolution details
    Status VARCHAR(20) NOT NULL DEFAULT 'Pending' CHECK (Status IN ('Pending', 'Resolved', 'Escalated', 'Ignored')),
    ResolutionMethod VARCHAR(20) CHECK (ResolutionMethod IN ('AutoGM', 'AutoLatest', 'Manual', 'UserChoice')),
    ResolvedValue JSONB,
    
    -- Users involved
    ConflictUsers JSONB NOT NULL DEFAULT '[]',
    ResolvedBy UUID REFERENCES Users(Id),
    
    -- Timing
    DetectedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ResolvedAt TIMESTAMPTZ,
    
    -- Resolution notes
    ResolutionNotes TEXT,
    
    CreatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for StateConflicts
CREATE INDEX IX_StateConflicts_SessionId ON StateConflicts(SessionId);
CREATE INDEX IX_StateConflicts_ConflictType ON StateConflicts(ConflictType);
CREATE INDEX IX_StateConflicts_EntityType ON StateConflicts(EntityType);
CREATE INDEX IX_StateConflicts_EntityId ON StateConflicts(EntityId);
CREATE INDEX IX_StateConflicts_Status ON StateConflicts(Status);
CREATE INDEX IX_StateConflicts_DetectedAt ON StateConflicts(DetectedAt);

-- Pending conflicts index
CREATE INDEX IX_StateConflicts_Pending ON StateConflicts(SessionId, DetectedAt) WHERE Status = 'Pending';
```

## Real-time Functions and Procedures

### Session Management Functions
```sql
-- Function to start a game session
CREATE OR REPLACE FUNCTION start_game_session(
    session_uuid UUID,
    gm_user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    session_record RECORD;
BEGIN
    -- Get session details
    SELECT * INTO session_record
    FROM GameSessions
    WHERE Id = session_uuid AND Status IN ('Planned', 'Paused');
    
    IF session_record IS NULL THEN
        RAISE EXCEPTION 'Session not found or not in valid state to start';
    END IF;
    
    -- Verify GM permissions
    IF session_record.GameMaster != gm_user_id THEN
        RAISE EXCEPTION 'User does not have permission to start this session';
    END IF;
    
    -- Update session status
    UPDATE GameSessions
    SET Status = 'Active',
        ActualStartTime = NOW(),
        UpdatedAt = NOW()
    WHERE Id = session_uuid;
    
    -- Create initial session state snapshot
    INSERT INTO SessionState (SessionId, StateType, Description, CreatedBy, IsAutoSave)
    VALUES (session_uuid, 'Checkpoint', 'Session started', gm_user_id, TRUE);
    
    -- Update campaign last played time
    UPDATE Campaigns
    SET LastPlayedAt = NOW(),
        UpdatedAt = NOW()
    WHERE Id = session_record.CampaignId;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;
```

### Combat Management Functions
```sql
-- Function to start combat encounter
CREATE OR REPLACE FUNCTION start_combat_encounter(
    encounter_uuid UUID,
    gm_user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    encounter_record RECORD;
    participant RECORD;
BEGIN
    -- Get encounter details
    SELECT * INTO encounter_record
    FROM CombatEncounters
    WHERE Id = encounter_uuid AND Status = 'Planned';
    
    IF encounter_record IS NULL THEN
        RAISE EXCEPTION 'Encounter not found or not in planned state';
    END IF;
    
    -- Update encounter status
    UPDATE CombatEncounters
    SET Status = 'Active',
        StartedAt = NOW(),
        CurrentRound = 1,
        UpdatedAt = NOW()
    WHERE Id = encounter_uuid;
    
    -- Reset turn tracking for all participants
    UPDATE InitiativeOrder
    SET HasActed = FALSE,
        HasBonusAction = TRUE,
        HasReaction = TRUE,
        HasMovement = TRUE,
        MovementUsed = 0,
        UpdatedAt = NOW()
    WHERE EncounterId = encounter_uuid;
    
    -- Create combat state snapshot
    INSERT INTO SessionState (SessionId, StateType, Description, CreatedBy, IsAutoSave, CombatState)
    SELECT encounter_record.SessionId, 'Checkpoint', 'Combat started', gm_user_id, TRUE,
           jsonb_build_object(
               'encounter_id', encounter_uuid,
               'round', 1,
               'turn_order', 0,
               'started_at', NOW()
           );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;
```

### Connection Management Functions
```sql
-- Function to handle connection heartbeat
CREATE OR REPLACE FUNCTION update_connection_heartbeat(
    connection_id_param VARCHAR(100)
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE RealtimeConnections
    SET LastHeartbeat = NOW(),
        UpdatedAt = NOW()
    WHERE ConnectionId = connection_id_param AND Status = 'Connected';
    
    -- Log heartbeat event
    INSERT INTO ConnectionEvents (ConnectionId, EventType, CreatedAt)
    VALUES (connection_id_param, 'Heartbeat', NOW());
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up stale connections
CREATE OR REPLACE FUNCTION cleanup_stale_connections()
RETURNS INTEGER AS $$
DECLARE
    cleanup_count INTEGER;
BEGIN
    -- Mark connections as disconnected if no heartbeat in 5 minutes
    UPDATE RealtimeConnections
    SET Status = 'Disconnected',
        DisconnectTime = NOW(),
        DisconnectReason = 'Heartbeat timeout',
        TotalDuration = NOW() - ConnectTime,
        UpdatedAt = NOW()
    WHERE Status = 'Connected' 
      AND LastHeartbeat < NOW() - INTERVAL '5 minutes';
    
    GET DIAGNOSTICS cleanup_count = ROW_COUNT;
    
    -- Clean up old connection records (older than 7 days)
    DELETE FROM RealtimeConnections
    WHERE Status = 'Disconnected' 
      AND DisconnectTime < NOW() - INTERVAL '7 days';
    
    RETURN cleanup_count;
END;
$$ LANGUAGE plpgsql;
```

## Real-time Triggers

### Session State Triggers
```sql
-- Function to create automatic session snapshots
CREATE OR REPLACE FUNCTION create_session_snapshot()
RETURNS TRIGGER AS $$
BEGIN
    -- Create snapshot every 10 minutes during active sessions
    IF NEW.Status = 'Active' AND (OLD.Status != 'Active' OR OLD.UpdatedAt < NOW() - INTERVAL '10 minutes') THEN
        INSERT INTO SessionState (SessionId, StateType, Description, IsAutoSave)
        VALUES (NEW.Id, 'Snapshot', 'Automatic snapshot', TRUE);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER session_snapshot_trigger
    AFTER UPDATE ON GameSessions
    FOR EACH ROW EXECUTE FUNCTION create_session_snapshot();
```

### Connection Event Triggers
```sql
-- Function to log connection status changes
CREATE OR REPLACE FUNCTION log_connection_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Log connection events
    IF TG_OP = 'INSERT' THEN
        INSERT INTO ConnectionEvents (ConnectionId, UserId, SessionId, EventType, EventData)
        VALUES (NEW.ConnectionId, NEW.UserId, NEW.SessionId, 'Connected',
                jsonb_build_object('client_type', NEW.ClientType, 'ip_address', NEW.IpAddress));
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' AND OLD.Status != NEW.Status THEN
        INSERT INTO ConnectionEvents (ConnectionId, UserId, SessionId, EventType, EventData)
        VALUES (NEW.ConnectionId, NEW.UserId, NEW.SessionId, 
                CASE WHEN NEW.Status = 'Disconnected' THEN 'Disconnected'
                     WHEN NEW.Status = 'Connected' AND OLD.Status = 'Reconnecting' THEN 'Reconnected'
                     ELSE NEW.Status END,
                jsonb_build_object('previous_status', OLD.Status, 'reason', NEW.DisconnectReason));
        RETURN NEW;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER connection_event_trigger
    AFTER INSERT OR UPDATE ON RealtimeConnections
    FOR EACH ROW EXECUTE FUNCTION log_connection_change();
```

## Performance Optimization

### Materialized Views for Session Analytics
```sql
-- Materialized view for session statistics
CREATE MATERIALIZED VIEW SessionAnalytics AS
SELECT 
    s.Id as SessionId,
    s.CampaignId,
    s.SessionType,
    s.Status,
    s.ActualStartTime,
    s.EndTime,
    COALESCE(s.EndTime - s.ActualStartTime - s.PausedDuration, NOW() - s.ActualStartTime - s.PausedDuration) as ActiveDuration,
    COUNT(DISTINCT sp.UserId) as ParticipantCount,
    COUNT(DISTINCT sm.Id) as MessageCount,
    COUNT(DISTINCT dr.Id) as DiceRollCount,
    COUNT(DISTINCT ce.Id) as CombatEncounterCount,
    AVG(sp.ActiveDuration) as AvgParticipantDuration
FROM GameSessions s
LEFT JOIN SessionParticipants sp ON s.Id = sp.SessionId AND sp.Status = 'Joined'
LEFT JOIN SessionMessages sm ON s.Id = sm.SessionId AND sm.IsDeleted = FALSE
LEFT JOIN DiceRolls dr ON s.Id = dr.SessionId
LEFT JOIN CombatEncounters ce ON s.Id = ce.SessionId
WHERE s.ActualStartTime IS NOT NULL
GROUP BY s.Id, s.CampaignId, s.SessionType, s.Status, s.ActualStartTime, s.EndTime, s.PausedDuration;

CREATE UNIQUE INDEX IX_SessionAnalytics_SessionId ON SessionAnalytics(SessionId);
CREATE INDEX IX_SessionAnalytics_CampaignId ON SessionAnalytics(CampaignId);
```

### Partitioning Strategy for Large Tables
```sql
-- Partition SessionMessages by month
CREATE TABLE SessionMessages_Y2024M01 PARTITION OF SessionMessages
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE SessionMessages_Y2024M02 PARTITION OF SessionMessages
    FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

-- Partition DiceRolls by month
CREATE TABLE DiceRolls_Y2024M01 PARTITION OF DiceRolls
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

-- Partition ConnectionEvents by month (already shown above)
```
