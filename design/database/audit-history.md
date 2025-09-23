# Audit Trail and History Tracking Database Schemas

## Overview
This document defines comprehensive audit trail and history tracking schemas for the D&D AI Campaign Management System, ensuring complete traceability, compliance, and change management.

## Audit Framework

### AuditLog Table
Central audit log for all system changes and user actions.

```sql
CREATE TABLE AuditLog (
    Id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Entity identification
    EntityType VARCHAR(100) NOT NULL,
    EntityId UUID NOT NULL,
    EntityName VARCHAR(200),
    
    -- Operation details
    Operation VARCHAR(20) NOT NULL CHECK (Operation IN ('CREATE', 'UPDATE', 'DELETE', 'VIEW', 'EXECUTE')),
    OperationDescription TEXT,
    
    -- User and session context
    UserId UUID REFERENCES Users(Id),
    UserDisplayName VARCHAR(100),
    UserRole VARCHAR(50),
    SessionId VARCHAR(100),
    ImpersonatedBy UUID REFERENCES Users(Id), -- For admin impersonation
    
    -- Request context
    RequestId VARCHAR(100),
    CorrelationId VARCHAR(100),
    IpAddress INET,
    UserAgent TEXT,
    
    -- Change details
    ChangeData JSONB NOT NULL DEFAULT '{}',
    OldValues JSONB,
    NewValues JSONB,
    
    -- System context
    ServiceName VARCHAR(100),
    ServerInstance VARCHAR(100),
    ApiEndpoint VARCHAR(200),
    HttpMethod VARCHAR(10),
    
    -- Audit metadata
    Severity VARCHAR(10) NOT NULL DEFAULT 'Info' CHECK (Severity IN ('Debug', 'Info', 'Warning', 'Error', 'Critical')),
    Category VARCHAR(50) NOT NULL,
    Tags JSONB DEFAULT '[]',
    
    -- Compliance and retention
    RetentionPeriod INTERVAL DEFAULT '7 years',
    IsPersonalData BOOLEAN NOT NULL DEFAULT FALSE,
    ComplianceFlags JSONB DEFAULT '[]',
    
    -- Performance tracking
    ProcessingTimeMs INTEGER,
    
    CreatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for AuditLog
CREATE INDEX IX_AuditLog_EntityType ON AuditLog(EntityType);
CREATE INDEX IX_AuditLog_EntityId ON AuditLog(EntityId);
CREATE INDEX IX_AuditLog_Operation ON AuditLog(Operation);
CREATE INDEX IX_AuditLog_UserId ON AuditLog(UserId) WHERE UserId IS NOT NULL;
CREATE INDEX IX_AuditLog_CreatedAt ON AuditLog(CreatedAt);
CREATE INDEX IX_AuditLog_Category ON AuditLog(Category);
CREATE INDEX IX_AuditLog_Severity ON AuditLog(Severity);

-- Composite indexes for common queries
CREATE INDEX IX_AuditLog_EntityTracking ON AuditLog(EntityType, EntityId, CreatedAt);
CREATE INDEX IX_AuditLog_UserActivity ON AuditLog(UserId, CreatedAt) WHERE UserId IS NOT NULL;
CREATE INDEX IX_AuditLog_SessionTracking ON AuditLog(SessionId, CreatedAt) WHERE SessionId IS NOT NULL;

-- JSONB indexes for change data
CREATE INDEX IX_AuditLog_ChangeData ON AuditLog USING GIN (ChangeData);
CREATE INDEX IX_AuditLog_Tags ON AuditLog USING GIN (Tags);
CREATE INDEX IX_AuditLog_ComplianceFlags ON AuditLog USING GIN (ComplianceFlags);

-- Partial indexes for performance
CREATE INDEX IX_AuditLog_PersonalData ON AuditLog(CreatedAt, EntityType) WHERE IsPersonalData = TRUE;
CREATE INDEX IX_AuditLog_HighSeverity ON AuditLog(CreatedAt, Severity) WHERE Severity IN ('Error', 'Critical');
```

### EntityHistory Table
Detailed change history for specific entities with versioning.

```sql
CREATE TABLE EntityHistory (
    Id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Entity identification
    EntityType VARCHAR(100) NOT NULL,
    EntityId UUID NOT NULL,
    
    -- Version tracking
    Version INTEGER NOT NULL,
    PreviousVersion INTEGER,
    
    -- Change metadata
    ChangeType VARCHAR(20) NOT NULL CHECK (ChangeType IN ('Created', 'Updated', 'Deleted', 'Restored', 'Archived')),
    ChangeReason VARCHAR(200),
    ChangeSummary TEXT,
    
    -- Complete entity snapshot
    EntitySnapshot JSONB NOT NULL,
    
    -- Field-level changes
    FieldChanges JSONB NOT NULL DEFAULT '[]',
    
    -- User and context
    ChangedBy UUID REFERENCES Users(Id),
    ChangedByName VARCHAR(100),
    ChangeContext JSONB DEFAULT '{}',
    
    -- Related audit entry
    AuditLogId UUID REFERENCES AuditLog(Id),
    
    -- Validation and integrity
    ChecksumBefore VARCHAR(64),
    ChecksumAfter VARCHAR(64),
    IsValid BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- Business context
    BusinessReason TEXT,
    ApprovalRequired BOOLEAN NOT NULL DEFAULT FALSE,
    ApprovedBy UUID REFERENCES Users(Id),
    ApprovedAt TIMESTAMPTZ,
    
    CreatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(EntityType, EntityId, Version),
    CHECK (Version > 0),
    CHECK (PreviousVersion IS NULL OR PreviousVersion < Version)
);

-- Indexes for EntityHistory
CREATE INDEX IX_EntityHistory_EntityType ON EntityHistory(EntityType);
CREATE INDEX IX_EntityHistory_EntityId ON EntityHistory(EntityId);
CREATE INDEX IX_EntityHistory_Version ON EntityHistory(EntityType, EntityId, Version);
CREATE INDEX IX_EntityHistory_ChangeType ON EntityHistory(ChangeType);
CREATE INDEX IX_EntityHistory_ChangedBy ON EntityHistory(ChangedBy) WHERE ChangedBy IS NOT NULL;
CREATE INDEX IX_EntityHistory_CreatedAt ON EntityHistory(CreatedAt);
CREATE INDEX IX_EntityHistory_AuditLogId ON EntityHistory(AuditLogId) WHERE AuditLogId IS NOT NULL;

-- Composite index for entity timeline
CREATE INDEX IX_EntityHistory_Timeline ON EntityHistory(EntityType, EntityId, CreatedAt);

-- JSONB indexes
CREATE INDEX IX_EntityHistory_EntitySnapshot ON EntityHistory USING GIN (EntitySnapshot);
CREATE INDEX IX_EntityHistory_FieldChanges ON EntityHistory USING GIN (FieldChanges);
CREATE INDEX IX_EntityHistory_ChangeContext ON EntityHistory USING GIN (ChangeContext);
```

## Specialized Audit Tables

### CampaignAuditLog Table
Specialized audit log for campaign-related changes.

```sql
CREATE TABLE CampaignAuditLog (
    Id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    CampaignId UUID NOT NULL REFERENCES Campaigns(Id) ON DELETE CASCADE,
    AuditLogId UUID NOT NULL REFERENCES AuditLog(Id) ON DELETE CASCADE,
    
    -- Campaign-specific context
    SessionId UUID REFERENCES GameSessions(Id),
    SceneName VARCHAR(200),
    GameTime VARCHAR(100),
    
    -- Player context
    AffectedCharacters JSONB DEFAULT '[]',
    AffectedNPCs JSONB DEFAULT '[]',
    
    -- Change impact
    ImpactLevel VARCHAR(20) NOT NULL DEFAULT 'Low' CHECK (ImpactLevel IN ('Low', 'Medium', 'High', 'Critical')),
    ImpactDescription TEXT,
    
    -- Gameplay context
    IsGameplayAction BOOLEAN NOT NULL DEFAULT FALSE,
    ActionCategory VARCHAR(50),
    
    -- Visibility
    VisibleToPlayers BOOLEAN NOT NULL DEFAULT TRUE,
    PlayerNotificationSent BOOLEAN NOT NULL DEFAULT FALSE,
    
    CreatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(AuditLogId)
);

-- Indexes for CampaignAuditLog
CREATE INDEX IX_CampaignAuditLog_CampaignId ON CampaignAuditLog(CampaignId);
CREATE INDEX IX_CampaignAuditLog_SessionId ON CampaignAuditLog(SessionId) WHERE SessionId IS NOT NULL;
CREATE INDEX IX_CampaignAuditLog_ImpactLevel ON CampaignAuditLog(ImpactLevel);
CREATE INDEX IX_CampaignAuditLog_IsGameplayAction ON CampaignAuditLog(IsGameplayAction);
CREATE INDEX IX_CampaignAuditLog_CreatedAt ON CampaignAuditLog(CreatedAt);

-- Composite index for campaign timeline
CREATE INDEX IX_CampaignAuditLog_Timeline ON CampaignAuditLog(CampaignId, CreatedAt);
```

### CharacterProgressionHistory Table
Track character advancement and changes over time.

```sql
CREATE TABLE CharacterProgressionHistory (
    Id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    CharacterId UUID NOT NULL REFERENCES Characters(Id) ON DELETE CASCADE,
    CampaignId UUID NOT NULL REFERENCES Campaigns(Id) ON DELETE CASCADE,
    
    -- Progression event
    EventType VARCHAR(30) NOT NULL CHECK (EventType IN ('LevelUp', 'AbilityScoreImprovement', 'FeatGained', 'SpellLearned', 'EquipmentChange', 'StatusChange')),
    EventDescription TEXT NOT NULL,
    
    -- Level and experience tracking
    PreviousLevel INTEGER,
    NewLevel INTEGER,
    PreviousExperience INTEGER,
    NewExperience INTEGER,
    ExperienceGained INTEGER DEFAULT 0,
    
    -- Specific changes
    AbilityScoreChanges JSONB DEFAULT '{}',
    SkillChanges JSONB DEFAULT '{}',
    FeatureChanges JSONB DEFAULT '{}',
    SpellChanges JSONB DEFAULT '{}',
    EquipmentChanges JSONB DEFAULT '{}',
    
    -- Hit points and stats
    HitPointsGained INTEGER DEFAULT 0,
    NewMaxHitPoints INTEGER,
    StatChanges JSONB DEFAULT '{}',
    
    -- Context
    SessionId UUID REFERENCES GameSessions(Id),
    TriggeredBy VARCHAR(200), -- What caused the change
    AppliedBy UUID NOT NULL REFERENCES Users(Id),
    
    -- Validation
    IsValidProgression BOOLEAN NOT NULL DEFAULT TRUE,
    ValidationNotes TEXT,
    
    -- Rollback support
    CanRollback BOOLEAN NOT NULL DEFAULT TRUE,
    RolledBackAt TIMESTAMPTZ,
    RolledBackBy UUID REFERENCES Users(Id),
    
    CreatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for CharacterProgressionHistory
CREATE INDEX IX_CharacterProgressionHistory_CharacterId ON CharacterProgressionHistory(CharacterId);
CREATE INDEX IX_CharacterProgressionHistory_CampaignId ON CharacterProgressionHistory(CampaignId);
CREATE INDEX IX_CharacterProgressionHistory_EventType ON CharacterProgressionHistory(EventType);
CREATE INDEX IX_CharacterProgressionHistory_SessionId ON CharacterProgressionHistory(SessionId) WHERE SessionId IS NOT NULL;
CREATE INDEX IX_CharacterProgressionHistory_CreatedAt ON CharacterProgressionHistory(CreatedAt);

-- Timeline index
CREATE INDEX IX_CharacterProgressionHistory_Timeline ON CharacterProgressionHistory(CharacterId, CreatedAt);

-- JSONB indexes for change tracking
CREATE INDEX IX_CharacterProgressionHistory_AbilityChanges ON CharacterProgressionHistory USING GIN (AbilityScoreChanges);
CREATE INDEX IX_CharacterProgressionHistory_SpellChanges ON CharacterProgressionHistory USING GIN (SpellChanges);
```

### NPCInteractionHistory Table
Extended interaction history with relationship tracking.

```sql
CREATE TABLE NPCInteractionHistory (
    Id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    NPCId UUID NOT NULL REFERENCES NPCs(Id) ON DELETE CASCADE,
    CampaignId UUID NOT NULL REFERENCES Campaigns(Id) ON DELETE CASCADE,
    SessionId UUID REFERENCES GameSessions(Id),
    
    -- Interaction details
    InteractionType VARCHAR(30) NOT NULL,
    InteractionSummary TEXT NOT NULL,
    DetailedLog JSONB NOT NULL DEFAULT '{}',
    
    -- Participants
    ParticipatingCharacters JSONB NOT NULL DEFAULT '[]',
    PrimaryInteractor UUID REFERENCES Users(Id),
    
    -- Relationship changes
    RelationshipBefore JSONB,
    RelationshipAfter JSONB,
    RelationshipDelta JSONB,
    TrustChange INTEGER DEFAULT 0,
    
    -- Information exchange
    InformationShared JSONB DEFAULT '[]',
    SecretsRevealed JSONB DEFAULT '[]',
    QuestInvolvementChanges JSONB DEFAULT '[]',
    
    -- NPC state changes
    NPCMoodBefore VARCHAR(20),
    NPCMoodAfter VARCHAR(20),
    NPCLocationBefore VARCHAR(200),
    NPCLocationAfter VARCHAR(200),
    
    -- Mechanical effects
    ExperienceAwarded INTEGER DEFAULT 0,
    ItemsExchanged JSONB DEFAULT '[]',
    MoneyExchanged JSONB DEFAULT '{}',
    
    -- Context and environment
    Location VARCHAR(200),
    GameTime VARCHAR(100),
    Witnesses JSONB DEFAULT '[]',
    EnvironmentalFactors JSONB DEFAULT '[]',
    
    -- AI involvement
    AIAssisted BOOLEAN NOT NULL DEFAULT FALSE,
    AIRequestId UUID REFERENCES AIRequests(Id),
    AIGeneratedContent JSONB,
    
    -- Outcome and consequences
    ImmediateOutcome TEXT,
    LongTermConsequences TEXT,
    PlotHooksGenerated JSONB DEFAULT '[]',
    
    CreatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for NPCInteractionHistory
CREATE INDEX IX_NPCInteractionHistory_NPCId ON NPCInteractionHistory(NPCId);
CREATE INDEX IX_NPCInteractionHistory_CampaignId ON NPCInteractionHistory(CampaignId);
CREATE INDEX IX_NPCInteractionHistory_SessionId ON NPCInteractionHistory(SessionId) WHERE SessionId IS NOT NULL;
CREATE INDEX IX_NPCInteractionHistory_InteractionType ON NPCInteractionHistory(InteractionType);
CREATE INDEX IX_NPCInteractionHistory_PrimaryInteractor ON NPCInteractionHistory(PrimaryInteractor) WHERE PrimaryInteractor IS NOT NULL;
CREATE INDEX IX_NPCInteractionHistory_CreatedAt ON NPCInteractionHistory(CreatedAt);

-- Timeline and relationship tracking
CREATE INDEX IX_NPCInteractionHistory_Timeline ON NPCInteractionHistory(NPCId, CreatedAt);
CREATE INDEX IX_NPCInteractionHistory_TrustChange ON NPCInteractionHistory(NPCId, TrustChange) WHERE TrustChange != 0;

-- JSONB indexes
CREATE INDEX IX_NPCInteractionHistory_DetailedLog ON NPCInteractionHistory USING GIN (DetailedLog);
CREATE INDEX IX_NPCInteractionHistory_InformationShared ON NPCInteractionHistory USING GIN (InformationShared);
```

## Data Change Tracking

### FieldChangeLog Table
Granular field-level change tracking for sensitive data.

```sql
CREATE TABLE FieldChangeLog (
    Id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Entity reference
    EntityType VARCHAR(100) NOT NULL,
    EntityId UUID NOT NULL,
    
    -- Field details
    FieldName VARCHAR(100) NOT NULL,
    FieldPath VARCHAR(200), -- For nested JSON fields
    
    -- Change details
    OldValue TEXT,
    NewValue TEXT,
    OldValueHash VARCHAR(64), -- For sensitive data
    NewValueHash VARCHAR(64),
    
    -- Data type and validation
    DataType VARCHAR(50),
    IsEncrypted BOOLEAN NOT NULL DEFAULT FALSE,
    IsSensitive BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Change context
    ChangeReason VARCHAR(200),
    ChangedBy UUID REFERENCES Users(Id),
    ChangeSource VARCHAR(50), -- API, UI, System, Migration, etc.
    
    -- Related records
    AuditLogId UUID REFERENCES AuditLog(Id),
    EntityHistoryId UUID REFERENCES EntityHistory(Id),
    
    -- Validation and integrity
    IsValid BOOLEAN NOT NULL DEFAULT TRUE,
    ValidationErrors JSONB DEFAULT '[]',
    
    CreatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for FieldChangeLog
CREATE INDEX IX_FieldChangeLog_EntityType ON FieldChangeLog(EntityType);
CREATE INDEX IX_FieldChangeLog_EntityId ON FieldChangeLog(EntityId);
CREATE INDEX IX_FieldChangeLog_FieldName ON FieldChangeLog(FieldName);
CREATE INDEX IX_FieldChangeLog_ChangedBy ON FieldChangeLog(ChangedBy) WHERE ChangedBy IS NOT NULL;
CREATE INDEX IX_FieldChangeLog_CreatedAt ON FieldChangeLog(CreatedAt);
CREATE INDEX IX_FieldChangeLog_IsSensitive ON FieldChangeLog(IsSensitive) WHERE IsSensitive = TRUE;

-- Composite indexes
CREATE INDEX IX_FieldChangeLog_EntityField ON FieldChangeLog(EntityType, EntityId, FieldName, CreatedAt);
CREATE INDEX IX_FieldChangeLog_AuditRef ON FieldChangeLog(AuditLogId) WHERE AuditLogId IS NOT NULL;
```

### DataRetentionPolicy Table
Define data retention policies for different data types.

```sql
CREATE TABLE DataRetentionPolicy (
    Id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Policy identification
    PolicyName VARCHAR(100) NOT NULL UNIQUE,
    Description TEXT,
    
    -- Scope
    EntityTypes JSONB NOT NULL DEFAULT '[]',
    DataCategories JSONB NOT NULL DEFAULT '[]',
    
    -- Retention rules
    RetentionPeriod INTERVAL NOT NULL,
    ArchiveAfter INTERVAL,
    DeleteAfter INTERVAL,
    
    -- Conditions
    RetentionConditions JSONB DEFAULT '{}',
    
    -- Legal and compliance
    LegalBasis VARCHAR(100),
    ComplianceRequirements JSONB DEFAULT '[]',
    
    -- Policy status
    IsActive BOOLEAN NOT NULL DEFAULT TRUE,
    EffectiveFrom TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    EffectiveTo TIMESTAMPTZ,
    
    -- Approval and governance
    ApprovedBy UUID REFERENCES Users(Id),
    ApprovedAt TIMESTAMPTZ,
    ReviewDate TIMESTAMPTZ,
    
    CreatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UpdatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default retention policies
INSERT INTO DataRetentionPolicy (PolicyName, Description, EntityTypes, RetentionPeriod, LegalBasis) VALUES
('User_Personal_Data', 'Personal user information retention', '["Users", "UserCredentials"]', '7 years', 'GDPR Article 6'),
('Audit_Logs_Standard', 'Standard audit log retention', '["AuditLog", "EntityHistory"]', '7 years', 'SOX Compliance'),
('Session_Data', 'Game session and interaction data', '["GameSessions", "SessionMessages"]', '3 years', 'Business Requirements'),
('Financial_Records', 'Billing and subscription data', '["UserSubscriptions", "PaymentHistory"]', '10 years', 'Tax Requirements'),
('AI_Usage_Data', 'AI request and usage tracking', '["AIRequests", "AIUsageMetrics"]', '2 years', 'Business Analytics');

-- Indexes for DataRetentionPolicy
CREATE INDEX IX_DataRetentionPolicy_IsActive ON DataRetentionPolicy(IsActive);
CREATE INDEX IX_DataRetentionPolicy_EffectiveFrom ON DataRetentionPolicy(EffectiveFrom);
CREATE INDEX IX_DataRetentionPolicy_ReviewDate ON DataRetentionPolicy(ReviewDate) WHERE ReviewDate IS NOT NULL;
```

## Compliance and Privacy

### DataProcessingLog Table
Track data processing activities for GDPR compliance.

```sql
CREATE TABLE DataProcessingLog (
    Id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Subject identification
    DataSubjectId UUID REFERENCES Users(Id),
    DataSubjectType VARCHAR(50) NOT NULL DEFAULT 'User',
    
    -- Processing details
    ProcessingActivity VARCHAR(100) NOT NULL,
    ProcessingPurpose VARCHAR(200) NOT NULL,
    LegalBasis VARCHAR(100) NOT NULL,
    
    -- Data categories
    DataCategories JSONB NOT NULL DEFAULT '[]',
    PersonalDataTypes JSONB NOT NULL DEFAULT '[]',
    SensitiveDataTypes JSONB DEFAULT '[]',
    
    -- Processing context
    ProcessorName VARCHAR(100),
    ProcessingLocation VARCHAR(100),
    DataSource VARCHAR(100),
    DataDestination VARCHAR(100),
    
    -- Consent and authorization
    ConsentGiven BOOLEAN,
    ConsentTimestamp TIMESTAMPTZ,
    ConsentVersion VARCHAR(50),
    ConsentWithdrawable BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- Data sharing
    ThirdPartySharing BOOLEAN NOT NULL DEFAULT FALSE,
    ThirdParties JSONB DEFAULT '[]',
    DataTransferMechanism VARCHAR(100),
    
    -- Retention and deletion
    RetentionPeriod INTERVAL,
    ScheduledDeletionDate TIMESTAMPTZ,
    ActualDeletionDate TIMESTAMPTZ,
    DeletionMethod VARCHAR(50),
    
    -- Security measures
    SecurityMeasures JSONB DEFAULT '[]',
    EncryptionUsed BOOLEAN NOT NULL DEFAULT FALSE,
    AccessControls JSONB DEFAULT '[]',
    
    -- Compliance metadata
    DataProtectionImpactAssessment BOOLEAN DEFAULT FALSE,
    RiskLevel VARCHAR(20) DEFAULT 'Low' CHECK (RiskLevel IN ('Low', 'Medium', 'High')),
    ComplianceNotes TEXT,
    
    CreatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UpdatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for DataProcessingLog
CREATE INDEX IX_DataProcessingLog_DataSubjectId ON DataProcessingLog(DataSubjectId) WHERE DataSubjectId IS NOT NULL;
CREATE INDEX IX_DataProcessingLog_ProcessingActivity ON DataProcessingLog(ProcessingActivity);
CREATE INDEX IX_DataProcessingLog_LegalBasis ON DataProcessingLog(LegalBasis);
CREATE INDEX IX_DataProcessingLog_ConsentGiven ON DataProcessingLog(ConsentGiven) WHERE ConsentGiven IS NOT NULL;
CREATE INDEX IX_DataProcessingLog_ScheduledDeletionDate ON DataProcessingLog(ScheduledDeletionDate) WHERE ScheduledDeletionDate IS NOT NULL;
CREATE INDEX IX_DataProcessingLog_CreatedAt ON DataProcessingLog(CreatedAt);

-- JSONB indexes
CREATE INDEX IX_DataProcessingLog_DataCategories ON DataProcessingLog USING GIN (DataCategories);
CREATE INDEX IX_DataProcessingLog_PersonalDataTypes ON DataProcessingLog USING GIN (PersonalDataTypes);
```

### PrivacyRequests Table
Track data subject rights requests (GDPR Article 15-22).

```sql
CREATE TABLE PrivacyRequests (
    Id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Request identification
    RequestNumber VARCHAR(50) NOT NULL UNIQUE,
    RequestType VARCHAR(30) NOT NULL CHECK (RequestType IN ('DataAccess', 'DataPortability', 'DataRectification', 'DataErasure', 'ProcessingRestriction', 'ObjectToProcessing')),
    
    -- Data subject information
    DataSubjectId UUID REFERENCES Users(Id),
    DataSubjectEmail VARCHAR(255),
    DataSubjectName VARCHAR(200),
    
    -- Request details
    RequestDescription TEXT,
    RequestScope JSONB DEFAULT '[]', -- Which data categories
    RequestReason TEXT,
    
    -- Verification
    IdentityVerified BOOLEAN NOT NULL DEFAULT FALSE,
    VerificationMethod VARCHAR(50),
    VerificationDate TIMESTAMPTZ,
    VerificationNotes TEXT,
    
    -- Processing status
    Status VARCHAR(30) NOT NULL DEFAULT 'Received' CHECK (Status IN ('Received', 'UnderReview', 'IdentityVerification', 'Processing', 'Completed', 'Rejected', 'Withdrawn')),
    AssignedTo UUID REFERENCES Users(Id),
    
    -- Response details
    ResponseSentDate TIMESTAMPTZ,
    ResponseMethod VARCHAR(50),
    ResponseDetails TEXT,
    
    -- Compliance tracking
    ReceivedDate TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    DueDate TIMESTAMPTZ NOT NULL, -- 30 days from receipt
    CompletedDate TIMESTAMPTZ,
    ExtensionRequested BOOLEAN NOT NULL DEFAULT FALSE,
    ExtensionReason TEXT,
    
    -- Data export (for portability requests)
    ExportFileUrl VARCHAR(500),
    ExportFormat VARCHAR(20),
    ExportSize BIGINT,
    
    -- Deletion tracking (for erasure requests)
    DataDeletedDate TIMESTAMPTZ,
    DeletionConfirmation TEXT,
    ResidualDataReason TEXT,
    
    -- Internal notes and communication
    InternalNotes TEXT,
    CommunicationLog JSONB DEFAULT '[]',
    
    CreatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UpdatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger to set due date
CREATE OR REPLACE FUNCTION set_privacy_request_due_date()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.DueDate IS NULL THEN
        NEW.DueDate := NEW.ReceivedDate + INTERVAL '30 days';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER privacy_request_due_date_trigger
    BEFORE INSERT ON PrivacyRequests
    FOR EACH ROW EXECUTE FUNCTION set_privacy_request_due_date();

-- Indexes for PrivacyRequests
CREATE INDEX IX_PrivacyRequests_RequestNumber ON PrivacyRequests(RequestNumber);
CREATE INDEX IX_PrivacyRequests_DataSubjectId ON PrivacyRequests(DataSubjectId) WHERE DataSubjectId IS NOT NULL;
CREATE INDEX IX_PrivacyRequests_RequestType ON PrivacyRequests(RequestType);
CREATE INDEX IX_PrivacyRequests_Status ON PrivacyRequests(Status);
CREATE INDEX IX_PrivacyRequests_AssignedTo ON PrivacyRequests(AssignedTo) WHERE AssignedTo IS NOT NULL;
CREATE INDEX IX_PrivacyRequests_DueDate ON PrivacyRequests(DueDate);
CREATE INDEX IX_PrivacyRequests_CreatedAt ON PrivacyRequests(CreatedAt);

-- Overdue requests index
CREATE INDEX IX_PrivacyRequests_Overdue ON PrivacyRequests(DueDate, Status) 
    WHERE Status NOT IN ('Completed', 'Rejected', 'Withdrawn') AND DueDate < NOW();
```

## Audit Functions and Procedures

### Generic Audit Functions
```sql
-- Function to create audit log entries
CREATE OR REPLACE FUNCTION create_audit_log(
    entity_type VARCHAR(100),
    entity_id UUID,
    entity_name VARCHAR(200),
    operation VARCHAR(20),
    user_id UUID,
    old_values JSONB DEFAULT NULL,
    new_values JSONB DEFAULT NULL,
    change_description TEXT DEFAULT NULL,
    category VARCHAR(50) DEFAULT 'General',
    severity VARCHAR(10) DEFAULT 'Info'
)
RETURNS UUID AS $$
DECLARE
    audit_id UUID;
    change_data JSONB;
BEGIN
    -- Build change data
    change_data := jsonb_build_object(
        'operation', operation,
        'entity_type', entity_type,
        'entity_id', entity_id,
        'description', change_description
    );
    
    -- Add old/new values if provided
    IF old_values IS NOT NULL THEN
        change_data := change_data || jsonb_build_object('old_values', old_values);
    END IF;
    
    IF new_values IS NOT NULL THEN
        change_data := change_data || jsonb_build_object('new_values', new_values);
    END IF;
    
    -- Insert audit log entry
    INSERT INTO AuditLog (
        EntityType, EntityId, EntityName, Operation, UserId,
        ChangeData, OldValues, NewValues, OperationDescription,
        Category, Severity
    )
    VALUES (
        entity_type, entity_id, entity_name, operation, user_id,
        change_data, old_values, new_values, change_description,
        category, severity
    )
    RETURNING Id INTO audit_id;
    
    RETURN audit_id;
END;
$$ LANGUAGE plpgsql;
```

### Entity History Functions
```sql
-- Function to create entity history snapshot
CREATE OR REPLACE FUNCTION create_entity_history(
    entity_type VARCHAR(100),
    entity_id UUID,
    entity_snapshot JSONB,
    change_type VARCHAR(20),
    changed_by UUID,
    change_reason VARCHAR(200) DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    history_id UUID;
    current_version INTEGER;
    previous_version INTEGER;
    field_changes JSONB;
    previous_snapshot JSONB;
BEGIN
    -- Get current version
    SELECT COALESCE(MAX(Version), 0) INTO current_version
    FROM EntityHistory
    WHERE EntityType = entity_type AND EntityId = entity_id;
    
    previous_version := current_version;
    current_version := current_version + 1;
    
    -- Get previous snapshot for comparison
    IF previous_version > 0 THEN
        SELECT EntitySnapshot INTO previous_snapshot
        FROM EntityHistory
        WHERE EntityType = entity_type AND EntityId = entity_id AND Version = previous_version;
        
        -- Calculate field changes
        field_changes := calculate_field_changes(previous_snapshot, entity_snapshot);
    ELSE
        field_changes := '[]'::jsonb;
    END IF;
    
    -- Insert history record
    INSERT INTO EntityHistory (
        EntityType, EntityId, Version, PreviousVersion,
        ChangeType, ChangeReason, EntitySnapshot, FieldChanges,
        ChangedBy, ChecksumAfter
    )
    VALUES (
        entity_type, entity_id, current_version, 
        CASE WHEN previous_version = 0 THEN NULL ELSE previous_version END,
        change_type, change_reason, entity_snapshot, field_changes,
        changed_by, md5(entity_snapshot::text)
    )
    RETURNING Id INTO history_id;
    
    RETURN history_id;
END;
$$ LANGUAGE plpgsql;

-- Helper function to calculate field changes
CREATE OR REPLACE FUNCTION calculate_field_changes(
    old_data JSONB,
    new_data JSONB
)
RETURNS JSONB AS $$
DECLARE
    changes JSONB := '[]'::jsonb;
    key TEXT;
    old_value JSONB;
    new_value JSONB;
BEGIN
    -- Check for changed and new fields
    FOR key IN SELECT jsonb_object_keys(new_data)
    LOOP
        old_value := old_data -> key;
        new_value := new_data -> key;
        
        IF old_value IS DISTINCT FROM new_value THEN
            changes := changes || jsonb_build_array(
                jsonb_build_object(
                    'field', key,
                    'old_value', old_value,
                    'new_value', new_value,
                    'change_type', CASE 
                        WHEN old_value IS NULL THEN 'added'
                        WHEN new_value IS NULL THEN 'removed'
                        ELSE 'modified'
                    END
                )
            );
        END IF;
    END LOOP;
    
    -- Check for removed fields
    FOR key IN SELECT jsonb_object_keys(old_data)
    LOOP
        IF NOT (new_data ? key) THEN
            changes := changes || jsonb_build_array(
                jsonb_build_object(
                    'field', key,
                    'old_value', old_data -> key,
                    'new_value', NULL,
                    'change_type', 'removed'
                )
            );
        END IF;
    END LOOP;
    
    RETURN changes;
END;
$$ LANGUAGE plpgsql;
```

### Data Retention Functions
```sql
-- Function to apply data retention policies
CREATE OR REPLACE FUNCTION apply_data_retention_policies()
RETURNS TABLE(policy_name TEXT, entities_processed INTEGER, entities_archived INTEGER, entities_deleted INTEGER) AS $$
DECLARE
    policy_record RECORD;
    processed_count INTEGER;
    archived_count INTEGER;
    deleted_count INTEGER;
BEGIN
    FOR policy_record IN 
        SELECT * FROM DataRetentionPolicy 
        WHERE IsActive = TRUE 
        AND (EffectiveTo IS NULL OR EffectiveTo > NOW())
    LOOP
        processed_count := 0;
        archived_count := 0;
        deleted_count := 0;
        
        -- Apply policy based on entity types
        -- This is a simplified example - real implementation would be more complex
        IF 'AuditLog' = ANY(SELECT jsonb_array_elements_text(policy_record.EntityTypes)) THEN
            -- Archive old audit logs
            UPDATE AuditLog 
            SET Tags = COALESCE(Tags, '[]'::jsonb) || '["archived"]'::jsonb
            WHERE CreatedAt < NOW() - policy_record.ArchiveAfter
            AND NOT (Tags @> '["archived"]'::jsonb);
            
            GET DIAGNOSTICS archived_count = ROW_COUNT;
            
            -- Delete very old audit logs if policy allows
            IF policy_record.DeleteAfter IS NOT NULL THEN
                DELETE FROM AuditLog
                WHERE CreatedAt < NOW() - policy_record.DeleteAfter
                AND Tags @> '["archived"]'::jsonb;
                
                GET DIAGNOSTICS deleted_count = ROW_COUNT;
            END IF;
        END IF;
        
        processed_count := archived_count + deleted_count;
        
        RETURN QUERY SELECT policy_record.PolicyName, processed_count, archived_count, deleted_count;
    END LOOP;
END;
$$ LANGUAGE plpgsql;
```

## Audit Triggers

### Universal Audit Trigger
```sql
-- Function to handle universal auditing
CREATE OR REPLACE FUNCTION universal_audit_trigger()
RETURNS TRIGGER AS $$
DECLARE
    audit_id UUID;
    entity_name VARCHAR(200);
    old_values JSONB;
    new_values JSONB;
    operation VARCHAR(20);
    user_id UUID;
BEGIN
    -- Determine operation
    operation := TG_OP;
    
    -- Get current user ID from session variable or default to system
    user_id := COALESCE(current_setting('app.current_user_id', true)::UUID, 
                       '00000000-0000-0000-0000-000000000000'::UUID);
    
    -- Extract entity name based on table
    entity_name := CASE TG_TABLE_NAME
        WHEN 'Users' THEN COALESCE(NEW.DisplayName, OLD.DisplayName)
        WHEN 'Campaigns' THEN COALESCE(NEW.Name, OLD.Name)
        WHEN 'Characters' THEN COALESCE(NEW.Name, OLD.Name)
        WHEN 'NPCs' THEN COALESCE(NEW.Name, OLD.Name)
        ELSE COALESCE(NEW.Id::TEXT, OLD.Id::TEXT)
    END;
    
    -- Prepare old and new values
    IF TG_OP = 'DELETE' THEN
        old_values := to_jsonb(OLD);
        new_values := NULL;
    ELSIF TG_OP = 'INSERT' THEN
        old_values := NULL;
        new_values := to_jsonb(NEW);
    ELSE -- UPDATE
        old_values := to_jsonb(OLD);
        new_values := to_jsonb(NEW);
    END IF;
    
    -- Create audit log entry
    audit_id := create_audit_log(
        TG_TABLE_NAME,
        COALESCE(NEW.Id, OLD.Id),
        entity_name,
        operation,
        user_id,
        old_values,
        new_values,
        'Automatic audit log entry',
        'Data Change',
        'Info'
    );
    
    -- Create entity history for significant tables
    IF TG_TABLE_NAME IN ('Users', 'Campaigns', 'Characters', 'NPCs') AND TG_OP != 'DELETE' THEN
        PERFORM create_entity_history(
            TG_TABLE_NAME,
            NEW.Id,
            new_values,
            CASE TG_OP 
                WHEN 'INSERT' THEN 'Created'
                WHEN 'UPDATE' THEN 'Updated'
            END,
            user_id,
            'Automatic entity history'
        );
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Apply audit triggers to core tables
CREATE TRIGGER audit_users_trigger
    AFTER INSERT OR UPDATE OR DELETE ON Users
    FOR EACH ROW EXECUTE FUNCTION universal_audit_trigger();

CREATE TRIGGER audit_campaigns_trigger
    AFTER INSERT OR UPDATE OR DELETE ON Campaigns
    FOR EACH ROW EXECUTE FUNCTION universal_audit_trigger();

CREATE TRIGGER audit_characters_trigger
    AFTER INSERT OR UPDATE OR DELETE ON Characters
    FOR EACH ROW EXECUTE FUNCTION universal_audit_trigger();

CREATE TRIGGER audit_npcs_trigger
    AFTER INSERT OR UPDATE OR DELETE ON NPCs
    FOR EACH ROW EXECUTE FUNCTION universal_audit_trigger();
```

## Data Archival and Cleanup

### Archival Tables
```sql
-- Archived audit logs
CREATE TABLE AuditLog_Archive (
    LIKE AuditLog INCLUDING ALL
);

-- Archived entity history
CREATE TABLE EntityHistory_Archive (
    LIKE EntityHistory INCLUDING ALL
);

-- Function to archive old audit data
CREATE OR REPLACE FUNCTION archive_audit_data(archive_before_date TIMESTAMPTZ)
RETURNS TABLE(audit_logs_archived INTEGER, entity_history_archived INTEGER) AS $$
DECLARE
    audit_count INTEGER;
    history_count INTEGER;
BEGIN
    -- Archive old audit logs
    WITH moved_audits AS (
        DELETE FROM AuditLog 
        WHERE CreatedAt < archive_before_date
        RETURNING *
    )
    INSERT INTO AuditLog_Archive SELECT * FROM moved_audits;
    
    GET DIAGNOSTICS audit_count = ROW_COUNT;
    
    -- Archive old entity history
    WITH moved_history AS (
        DELETE FROM EntityHistory 
        WHERE CreatedAt < archive_before_date
        RETURNING *
    )
    INSERT INTO EntityHistory_Archive SELECT * FROM moved_history;
    
    GET DIAGNOSTICS history_count = ROW_COUNT;
    
    RETURN QUERY SELECT audit_count, history_count;
END;
$$ LANGUAGE plpgsql;
```

## Performance Optimization

### Partitioning for Audit Tables
```sql
-- Partition AuditLog by month
ALTER TABLE AuditLog PARTITION BY RANGE (CreatedAt);

CREATE TABLE AuditLog_Y2024M01 PARTITION OF AuditLog
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE AuditLog_Y2024M02 PARTITION OF AuditLog
    FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

-- Create function to automatically create monthly partitions
CREATE OR REPLACE FUNCTION create_monthly_audit_partitions()
RETURNS VOID AS $$
DECLARE
    start_date DATE;
    end_date DATE;
    partition_name TEXT;
BEGIN
    -- Create partitions for next 3 months
    FOR i IN 0..2 LOOP
        start_date := date_trunc('month', NOW() + (i || ' months')::interval)::date;
        end_date := start_date + INTERVAL '1 month';
        partition_name := 'AuditLog_Y' || EXTRACT(YEAR FROM start_date) || 'M' || 
                         LPAD(EXTRACT(MONTH FROM start_date)::TEXT, 2, '0');
        
        -- Check if partition already exists
        IF NOT EXISTS (
            SELECT 1 FROM pg_class WHERE relname = lower(partition_name)
        ) THEN
            EXECUTE format('CREATE TABLE %I PARTITION OF AuditLog FOR VALUES FROM (%L) TO (%L)',
                          partition_name, start_date, end_date);
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;
```
