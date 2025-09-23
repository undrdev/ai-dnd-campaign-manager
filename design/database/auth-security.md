# Authentication and Security Database Schemas

## Overview
This document defines database schemas for authentication, authorization, security logging, and subscription management in the D&D AI Campaign Management System.

## Authentication Tables

### UserCredentials Table
Extended authentication information and security settings with field-level encryption.

```sql
CREATE TABLE UserCredentials (
    Id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    UserId UUID NOT NULL REFERENCES Users(Id) ON DELETE CASCADE,
    
    -- Password management (encrypted at rest)
    PasswordHash BYTEA NOT NULL, -- Encrypted with AES-256-GCM
    PasswordSalt BYTEA NOT NULL, -- Encrypted with AES-256-GCM
    PasswordAlgorithm VARCHAR(50) NOT NULL DEFAULT 'bcrypt',
    PasswordChangedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PasswordResetRequired BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Encryption metadata
    PasswordHashKeyId VARCHAR(255) NOT NULL,
    PasswordSaltKeyId VARCHAR(255) NOT NULL,
    PasswordHashIV BYTEA NOT NULL,
    PasswordSaltIV BYTEA NOT NULL,
    PasswordHashAuthTag BYTEA NOT NULL,
    PasswordSaltAuthTag BYTEA NOT NULL,
    
    -- Multi-factor authentication
    MFAEnabled BOOLEAN NOT NULL DEFAULT FALSE,
    MFASecret VARCHAR(255), -- TOTP secret
    MFABackupCodes JSONB, -- Array of backup codes
    MFALastUsedAt TIMESTAMPTZ,
    
    -- Account security
    FailedLoginAttempts INTEGER NOT NULL DEFAULT 0,
    LastFailedLoginAt TIMESTAMPTZ,
    AccountLockedUntil TIMESTAMPTZ,
    SecurityQuestions JSONB,
    
    -- Email verification
    EmailVerificationToken VARCHAR(255),
    EmailVerificationExpires TIMESTAMPTZ,
    EmailVerificationAttempts INTEGER NOT NULL DEFAULT 0,
    
    -- Password reset
    PasswordResetToken VARCHAR(255),
    PasswordResetExpires TIMESTAMPTZ,
    PasswordResetAttempts INTEGER NOT NULL DEFAULT 0,
    
    CreatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UpdatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(UserId)
);

-- Indexes for UserCredentials
CREATE INDEX IX_UserCredentials_UserId ON UserCredentials(UserId);
CREATE INDEX IX_UserCredentials_EmailVerificationToken ON UserCredentials(EmailVerificationToken) 
    WHERE EmailVerificationToken IS NOT NULL;
CREATE INDEX IX_UserCredentials_PasswordResetToken ON UserCredentials(PasswordResetToken) 
    WHERE PasswordResetToken IS NOT NULL;
CREATE INDEX IX_UserCredentials_AccountLockedUntil ON UserCredentials(AccountLockedUntil) 
    WHERE AccountLockedUntil IS NOT NULL;
```

### SocialLogins Table
External authentication provider connections.

```sql
CREATE TABLE SocialLogins (
    Id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    UserId UUID NOT NULL REFERENCES Users(Id) ON DELETE CASCADE,
    Provider VARCHAR(50) NOT NULL CHECK (Provider IN ('Google', 'Discord', 'Microsoft', 'Apple', 'Facebook')),
    ProviderUserId VARCHAR(255) NOT NULL,
    ProviderEmail VARCHAR(255),
    ProviderDisplayName VARCHAR(255),
    
    -- OAuth tokens (encrypted)
    AccessToken TEXT,
    RefreshToken TEXT,
    TokenExpiresAt TIMESTAMPTZ,
    Scope TEXT,
    
    -- Provider-specific data
    ProviderData JSONB,
    
    -- Status
    IsActive BOOLEAN NOT NULL DEFAULT TRUE,
    
    CreatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UpdatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    LastUsedAt TIMESTAMPTZ,
    
    UNIQUE(Provider, ProviderUserId),
    UNIQUE(UserId, Provider)
);

-- Indexes for SocialLogins
CREATE INDEX IX_SocialLogins_UserId ON SocialLogins(UserId);
CREATE INDEX IX_SocialLogins_Provider ON SocialLogins(Provider);
CREATE INDEX IX_SocialLogins_ProviderUserId ON SocialLogins(Provider, ProviderUserId);
CREATE INDEX IX_SocialLogins_IsActive ON SocialLogins(IsActive);
```

### LoginAttempts Table
Track login attempts for security monitoring and rate limiting.

```sql
CREATE TABLE LoginAttempts (
    Id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    Email VARCHAR(255),
    UserId UUID REFERENCES Users(Id),
    
    -- Attempt details
    Success BOOLEAN NOT NULL,
    FailureReason VARCHAR(100),
    
    -- Request information
    IpAddress INET NOT NULL,
    UserAgent TEXT,
    DeviceFingerprint VARCHAR(255),
    
    -- Geographic information
    Country VARCHAR(2),
    Region VARCHAR(100),
    City VARCHAR(100),
    
    -- Security flags
    SuspiciousActivity BOOLEAN NOT NULL DEFAULT FALSE,
    RiskScore INTEGER DEFAULT 0 CHECK (RiskScore >= 0 AND RiskScore <= 100),
    
    CreatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for LoginAttempts
CREATE INDEX IX_LoginAttempts_Email ON LoginAttempts(Email);
CREATE INDEX IX_LoginAttempts_UserId ON LoginAttempts(UserId);
CREATE INDEX IX_LoginAttempts_IpAddress ON LoginAttempts(IpAddress);
CREATE INDEX IX_LoginAttempts_Success ON LoginAttempts(Success);
CREATE INDEX IX_LoginAttempts_CreatedAt ON LoginAttempts(CreatedAt);
CREATE INDEX IX_LoginAttempts_SuspiciousActivity ON LoginAttempts(SuspiciousActivity) WHERE SuspiciousActivity = TRUE;

-- Partial index for recent failed attempts
CREATE INDEX IX_LoginAttempts_RecentFailures ON LoginAttempts(Email, CreatedAt) 
    WHERE Success = FALSE AND CreatedAt > NOW() - INTERVAL '1 hour';
```

## Authorization and Permissions

### Roles Table
System and campaign-specific roles.

```sql
CREATE TABLE Roles (
    Id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    Name VARCHAR(100) NOT NULL,
    DisplayName VARCHAR(100) NOT NULL,
    Description TEXT,
    
    -- Role scope
    Scope VARCHAR(20) NOT NULL DEFAULT 'System' CHECK (Scope IN ('System', 'Campaign')),
    
    -- Role hierarchy
    ParentRoleId UUID REFERENCES Roles(Id),
    HierarchyLevel INTEGER NOT NULL DEFAULT 0,
    
    -- Role properties
    IsBuiltIn BOOLEAN NOT NULL DEFAULT FALSE,
    IsActive BOOLEAN NOT NULL DEFAULT TRUE,
    
    CreatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UpdatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(Name, Scope)
);

-- Insert built-in system roles
INSERT INTO Roles (Name, DisplayName, Description, Scope, IsBuiltIn) VALUES
('SystemAdmin', 'System Administrator', 'Full system administration access', 'System', TRUE),
('Player', 'Player', 'Basic player access', 'System', TRUE),
('GameMaster', 'Game Master', 'Campaign management access', 'System', TRUE),
('CampaignPlayer', 'Campaign Player', 'Player in specific campaign', 'Campaign', TRUE),
('CampaignGM', 'Campaign Game Master', 'GM of specific campaign', 'Campaign', TRUE),
('CampaignCoGM', 'Campaign Co-Game Master', 'Assistant GM of specific campaign', 'Campaign', TRUE),
('CampaignObserver', 'Campaign Observer', 'Read-only campaign access', 'Campaign', TRUE);

-- Indexes for Roles
CREATE INDEX IX_Roles_Name ON Roles(Name);
CREATE INDEX IX_Roles_Scope ON Roles(Scope);
CREATE INDEX IX_Roles_IsActive ON Roles(IsActive);
CREATE INDEX IX_Roles_ParentRoleId ON Roles(ParentRoleId);
```

### Permissions Table
Granular permissions for system operations.

```sql
CREATE TABLE Permissions (
    Id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    Name VARCHAR(100) NOT NULL UNIQUE,
    DisplayName VARCHAR(100) NOT NULL,
    Description TEXT,
    Category VARCHAR(50) NOT NULL,
    
    -- Permission properties
    IsBuiltIn BOOLEAN NOT NULL DEFAULT FALSE,
    IsActive BOOLEAN NOT NULL DEFAULT TRUE,
    
    CreatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert built-in permissions
INSERT INTO Permissions (Name, DisplayName, Description, Category, IsBuiltIn) VALUES
-- User management
('users.view', 'View Users', 'View user profiles and information', 'User Management', TRUE),
('users.edit', 'Edit Users', 'Edit user profiles and settings', 'User Management', TRUE),
('users.delete', 'Delete Users', 'Delete user accounts', 'User Management', TRUE),

-- Campaign management
('campaigns.create', 'Create Campaigns', 'Create new campaigns', 'Campaign Management', TRUE),
('campaigns.view', 'View Campaigns', 'View campaign information', 'Campaign Management', TRUE),
('campaigns.edit', 'Edit Campaigns', 'Edit campaign settings and content', 'Campaign Management', TRUE),
('campaigns.delete', 'Delete Campaigns', 'Delete campaigns', 'Campaign Management', TRUE),
('campaigns.invite', 'Invite Players', 'Invite players to campaigns', 'Campaign Management', TRUE),
('campaigns.manage_players', 'Manage Players', 'Add/remove players from campaigns', 'Campaign Management', TRUE),

-- Character management
('characters.create', 'Create Characters', 'Create new characters', 'Character Management', TRUE),
('characters.view', 'View Characters', 'View character information', 'Character Management', TRUE),
('characters.edit_own', 'Edit Own Characters', 'Edit own characters', 'Character Management', TRUE),
('characters.edit_any', 'Edit Any Characters', 'Edit any character in campaign', 'Character Management', TRUE),
('characters.delete', 'Delete Characters', 'Delete characters', 'Character Management', TRUE),

-- NPC management
('npcs.create', 'Create NPCs', 'Create new NPCs', 'NPC Management', TRUE),
('npcs.view', 'View NPCs', 'View NPC information', 'NPC Management', TRUE),
('npcs.edit', 'Edit NPCs', 'Edit NPC information and stats', 'NPC Management', TRUE),
('npcs.delete', 'Delete NPCs', 'Delete NPCs', 'NPC Management', TRUE),

-- AI features
('ai.basic', 'Basic AI Features', 'Access to basic AI generation', 'AI Features', TRUE),
('ai.advanced', 'Advanced AI Features', 'Access to advanced AI generation', 'AI Features', TRUE),
('ai.premium', 'Premium AI Features', 'Access to premium AI models', 'AI Features', TRUE),

-- Session management
('sessions.start', 'Start Sessions', 'Start game sessions', 'Session Management', TRUE),
('sessions.manage', 'Manage Sessions', 'Control session flow and state', 'Session Management', TRUE),
('sessions.participate', 'Participate in Sessions', 'Join and participate in sessions', 'Session Management', TRUE);

-- Indexes for Permissions
CREATE INDEX IX_Permissions_Name ON Permissions(Name);
CREATE INDEX IX_Permissions_Category ON Permissions(Category);
CREATE INDEX IX_Permissions_IsActive ON Permissions(IsActive);
```

### RolePermissions Table
Junction table linking roles to permissions.

```sql
CREATE TABLE RolePermissions (
    Id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    RoleId UUID NOT NULL REFERENCES Roles(Id) ON DELETE CASCADE,
    PermissionId UUID NOT NULL REFERENCES Permissions(Id) ON DELETE CASCADE,
    
    -- Permission modifiers
    Granted BOOLEAN NOT NULL DEFAULT TRUE,
    Conditions JSONB, -- Optional conditions for permission
    
    CreatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(RoleId, PermissionId)
);

-- Indexes for RolePermissions
CREATE INDEX IX_RolePermissions_RoleId ON RolePermissions(RoleId);
CREATE INDEX IX_RolePermissions_PermissionId ON RolePermissions(PermissionId);
CREATE INDEX IX_RolePermissions_Granted ON RolePermissions(Granted);
```

### UserRoles Table
User role assignments (system and campaign-specific).

```sql
CREATE TABLE UserRoles (
    Id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    UserId UUID NOT NULL REFERENCES Users(Id) ON DELETE CASCADE,
    RoleId UUID NOT NULL REFERENCES Roles(Id) ON DELETE CASCADE,
    
    -- Context for campaign-specific roles
    CampaignId UUID REFERENCES Campaigns(Id) ON DELETE CASCADE,
    
    -- Assignment details
    AssignedBy UUID REFERENCES Users(Id),
    AssignedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ExpiresAt TIMESTAMPTZ,
    
    -- Status
    IsActive BOOLEAN NOT NULL DEFAULT TRUE,
    
    CreatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CHECK ((CampaignId IS NULL AND EXISTS (SELECT 1 FROM Roles WHERE Id = RoleId AND Scope = 'System')) OR
           (CampaignId IS NOT NULL AND EXISTS (SELECT 1 FROM Roles WHERE Id = RoleId AND Scope = 'Campaign')))
);

-- Indexes for UserRoles
CREATE INDEX IX_UserRoles_UserId ON UserRoles(UserId);
CREATE INDEX IX_UserRoles_RoleId ON UserRoles(RoleId);
CREATE INDEX IX_UserRoles_CampaignId ON UserRoles(CampaignId) WHERE CampaignId IS NOT NULL;
CREATE INDEX IX_UserRoles_IsActive ON UserRoles(IsActive);
CREATE INDEX IX_UserRoles_ExpiresAt ON UserRoles(ExpiresAt) WHERE ExpiresAt IS NOT NULL;
```

## Subscription Management

### SubscriptionPlans Table
Available subscription tiers and their features.

```sql
CREATE TABLE SubscriptionPlans (
    Id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    Name VARCHAR(50) NOT NULL UNIQUE,
    DisplayName VARCHAR(100) NOT NULL,
    Description TEXT,
    
    -- Pricing
    PriceMonthly DECIMAL(10,2),
    PriceYearly DECIMAL(10,2),
    Currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    
    -- Features and limits
    Features JSONB NOT NULL DEFAULT '{}',
    Limits JSONB NOT NULL DEFAULT '{}',
    
    -- Plan properties
    IsActive BOOLEAN NOT NULL DEFAULT TRUE,
    IsDefault BOOLEAN NOT NULL DEFAULT FALSE,
    SortOrder INTEGER NOT NULL DEFAULT 0,
    
    CreatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UpdatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default subscription plans
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

-- Indexes for SubscriptionPlans
CREATE INDEX IX_SubscriptionPlans_Name ON SubscriptionPlans(Name);
CREATE INDEX IX_SubscriptionPlans_IsActive ON SubscriptionPlans(IsActive);
CREATE INDEX IX_SubscriptionPlans_IsDefault ON SubscriptionPlans(IsDefault);
```

### UserSubscriptions Table
User subscription history and current status.

```sql
CREATE TABLE UserSubscriptions (
    Id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    UserId UUID NOT NULL REFERENCES Users(Id) ON DELETE CASCADE,
    PlanId UUID NOT NULL REFERENCES SubscriptionPlans(Id),
    
    -- Subscription details
    Status VARCHAR(20) NOT NULL DEFAULT 'Active' CHECK (Status IN ('Active', 'Cancelled', 'Expired', 'Trial', 'PastDue', 'Suspended')),
    BillingCycle VARCHAR(10) NOT NULL CHECK (BillingCycle IN ('Monthly', 'Yearly')),
    
    -- Dates
    StartDate TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    EndDate TIMESTAMPTZ,
    TrialEndDate TIMESTAMPTZ,
    NextBillingDate TIMESTAMPTZ,
    CancelledAt TIMESTAMPTZ,
    
    -- Pricing at time of subscription
    Amount DECIMAL(10,2) NOT NULL,
    Currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    
    -- Payment provider integration
    PaymentProviderId VARCHAR(100), -- Stripe customer ID, etc.
    PaymentProviderSubscriptionId VARCHAR(100),
    
    -- Subscription metadata
    Metadata JSONB DEFAULT '{}',
    
    CreatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UpdatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for UserSubscriptions
CREATE INDEX IX_UserSubscriptions_UserId ON UserSubscriptions(UserId);
CREATE INDEX IX_UserSubscriptions_PlanId ON UserSubscriptions(PlanId);
CREATE INDEX IX_UserSubscriptions_Status ON UserSubscriptions(Status);
CREATE INDEX IX_UserSubscriptions_NextBillingDate ON UserSubscriptions(NextBillingDate) WHERE NextBillingDate IS NOT NULL;
CREATE INDEX IX_UserSubscriptions_PaymentProviderSubscriptionId ON UserSubscriptions(PaymentProviderSubscriptionId) WHERE PaymentProviderSubscriptionId IS NOT NULL;

-- Unique constraint for active subscriptions
CREATE UNIQUE INDEX IX_UserSubscriptions_ActiveUser ON UserSubscriptions(UserId) 
    WHERE Status IN ('Active', 'Trial', 'PastDue');
```

### UsageTracking Table
Track user usage against subscription limits.

```sql
CREATE TABLE UsageTracking (
    Id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    UserId UUID NOT NULL REFERENCES Users(Id) ON DELETE CASCADE,
    
    -- Usage period
    PeriodStart TIMESTAMPTZ NOT NULL,
    PeriodEnd TIMESTAMPTZ NOT NULL,
    
    -- Usage counters
    AIRequestsUsed INTEGER NOT NULL DEFAULT 0,
    StorageUsedBytes BIGINT NOT NULL DEFAULT 0,
    CampaignsCreated INTEGER NOT NULL DEFAULT 0,
    CharactersCreated INTEGER NOT NULL DEFAULT 0,
    
    -- Detailed usage breakdown
    UsageDetails JSONB NOT NULL DEFAULT '{}',
    
    CreatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UpdatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(UserId, PeriodStart)
);

-- Indexes for UsageTracking
CREATE INDEX IX_UsageTracking_UserId ON UsageTracking(UserId);
CREATE INDEX IX_UsageTracking_PeriodStart ON UsageTracking(PeriodStart);
CREATE INDEX IX_UsageTracking_PeriodEnd ON UsageTracking(PeriodEnd);
```

## Security Audit and Logging

### SecurityEvents Table
Log security-related events for monitoring and compliance.

```sql
CREATE TABLE SecurityEvents (
    Id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    UserId UUID REFERENCES Users(Id),
    
    -- Event classification
    EventType VARCHAR(50) NOT NULL,
    Severity VARCHAR(10) NOT NULL CHECK (Severity IN ('Low', 'Medium', 'High', 'Critical')),
    Category VARCHAR(50) NOT NULL,
    
    -- Event details
    Description TEXT NOT NULL,
    Details JSONB DEFAULT '{}',
    
    -- Context information
    IpAddress INET,
    UserAgent TEXT,
    RequestId VARCHAR(100),
    SessionId VARCHAR(100),
    
    -- Geographic information
    Country VARCHAR(2),
    Region VARCHAR(100),
    City VARCHAR(100),
    
    -- System information
    ServiceName VARCHAR(100),
    ServerInstance VARCHAR(100),
    
    -- Resolution status
    Status VARCHAR(20) NOT NULL DEFAULT 'Open' CHECK (Status IN ('Open', 'Investigating', 'Resolved', 'Dismissed')),
    ResolvedBy UUID REFERENCES Users(Id),
    ResolvedAt TIMESTAMPTZ,
    ResolutionNotes TEXT,
    
    CreatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for SecurityEvents
CREATE INDEX IX_SecurityEvents_UserId ON SecurityEvents(UserId);
CREATE INDEX IX_SecurityEvents_EventType ON SecurityEvents(EventType);
CREATE INDEX IX_SecurityEvents_Severity ON SecurityEvents(Severity);
CREATE INDEX IX_SecurityEvents_Category ON SecurityEvents(Category);
CREATE INDEX IX_SecurityEvents_CreatedAt ON SecurityEvents(CreatedAt);
CREATE INDEX IX_SecurityEvents_Status ON SecurityEvents(Status);
CREATE INDEX IX_SecurityEvents_IpAddress ON SecurityEvents(IpAddress);

-- Partial index for unresolved high-severity events
CREATE INDEX IX_SecurityEvents_HighSeverityOpen ON SecurityEvents(CreatedAt, Severity) 
    WHERE Status = 'Open' AND Severity IN ('High', 'Critical');
```

### DataAccessLog Table
Log access to sensitive data for compliance and auditing.

```sql
CREATE TABLE DataAccessLog (
    Id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    UserId UUID REFERENCES Users(Id),
    
    -- Access details
    ResourceType VARCHAR(50) NOT NULL, -- 'Campaign', 'Character', 'NPC', etc.
    ResourceId UUID NOT NULL,
    Operation VARCHAR(20) NOT NULL CHECK (Operation IN ('CREATE', 'READ', 'UPDATE', 'DELETE')),
    
    -- Access context
    AccessMethod VARCHAR(20) NOT NULL CHECK (AccessMethod IN ('API', 'Web', 'Mobile', 'System')),
    Endpoint VARCHAR(200),
    
    -- Request information
    IpAddress INET,
    UserAgent TEXT,
    RequestId VARCHAR(100),
    
    -- Data accessed
    FieldsAccessed JSONB,
    DataSnapshot JSONB, -- For sensitive operations
    
    -- Result
    Success BOOLEAN NOT NULL,
    ErrorMessage TEXT,
    
    CreatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for DataAccessLog
CREATE INDEX IX_DataAccessLog_UserId ON DataAccessLog(UserId);
CREATE INDEX IX_DataAccessLog_ResourceType ON DataAccessLog(ResourceType);
CREATE INDEX IX_DataAccessLog_ResourceId ON DataAccessLog(ResourceId);
CREATE INDEX IX_DataAccessLog_Operation ON DataAccessLog(Operation);
CREATE INDEX IX_DataAccessLog_CreatedAt ON DataAccessLog(CreatedAt);
CREATE INDEX IX_DataAccessLog_Success ON DataAccessLog(Success);

-- Composite index for resource access patterns
CREATE INDEX IX_DataAccessLog_ResourceAccess ON DataAccessLog(ResourceType, ResourceId, Operation, CreatedAt);
```

## Rate Limiting and Throttling

### RateLimitRules Table
Define rate limiting rules for different operations.

```sql
CREATE TABLE RateLimitRules (
    Id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    Name VARCHAR(100) NOT NULL UNIQUE,
    Description TEXT,
    
    -- Rule scope
    Scope VARCHAR(20) NOT NULL CHECK (Scope IN ('Global', 'User', 'IP', 'Subscription')),
    ResourceType VARCHAR(50), -- API endpoint, operation type, etc.
    
    -- Limit configuration
    RequestsPerMinute INTEGER,
    RequestsPerHour INTEGER,
    RequestsPerDay INTEGER,
    RequestsPerMonth INTEGER,
    
    -- Burst allowance
    BurstLimit INTEGER,
    
    -- Subscription tier overrides
    SubscriptionOverrides JSONB DEFAULT '{}',
    
    -- Rule properties
    IsActive BOOLEAN NOT NULL DEFAULT TRUE,
    Priority INTEGER NOT NULL DEFAULT 0,
    
    CreatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UpdatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default rate limit rules
INSERT INTO RateLimitRules (Name, Description, Scope, ResourceType, RequestsPerMinute, RequestsPerHour, RequestsPerDay, SubscriptionOverrides) VALUES
('API_General', 'General API rate limit', 'User', 'API', 100, 1000, 10000, 
 '{"DungeonArchitect": {"RequestsPerHour": 5000}, "CampaignWeaver": {"RequestsPerHour": 15000}, "GuildMaster": {"RequestsPerHour": 50000}}'),
('AI_Generation', 'AI content generation limit', 'User', 'AI', 5, 50, 200,
 '{"DungeonArchitect": {"RequestsPerHour": 100}, "CampaignWeaver": {"RequestsPerHour": 400}, "GuildMaster": {"RequestsPerHour": 2000}}'),
('Login_Attempts', 'Login attempt rate limit', 'IP', 'Auth', 10, 50, 200, '{}');

-- Indexes for RateLimitRules
CREATE INDEX IX_RateLimitRules_Scope ON RateLimitRules(Scope);
CREATE INDEX IX_RateLimitRules_ResourceType ON RateLimitRules(ResourceType);
CREATE INDEX IX_RateLimitRules_IsActive ON RateLimitRules(IsActive);
```

### RateLimitUsage Table
Track current usage against rate limits.

```sql
CREATE TABLE RateLimitUsage (
    Id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    RuleId UUID NOT NULL REFERENCES RateLimitRules(Id) ON DELETE CASCADE,
    
    -- Usage identifier (user ID, IP address, etc.)
    Identifier VARCHAR(255) NOT NULL,
    
    -- Time windows
    WindowStart TIMESTAMPTZ NOT NULL,
    WindowEnd TIMESTAMPTZ NOT NULL,
    WindowType VARCHAR(10) NOT NULL CHECK (WindowType IN ('Minute', 'Hour', 'Day', 'Month')),
    
    -- Usage counters
    RequestCount INTEGER NOT NULL DEFAULT 0,
    LastRequestAt TIMESTAMPTZ,
    
    -- Violations
    ViolationCount INTEGER NOT NULL DEFAULT 0,
    LastViolationAt TIMESTAMPTZ,
    
    CreatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UpdatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(RuleId, Identifier, WindowStart, WindowType)
);

-- Indexes for RateLimitUsage
CREATE INDEX IX_RateLimitUsage_RuleId ON RateLimitUsage(RuleId);
CREATE INDEX IX_RateLimitUsage_Identifier ON RateLimitUsage(Identifier);
CREATE INDEX IX_RateLimitUsage_WindowStart ON RateLimitUsage(WindowStart);
CREATE INDEX IX_RateLimitUsage_WindowEnd ON RateLimitUsage(WindowEnd);
CREATE INDEX IX_RateLimitUsage_LastRequestAt ON RateLimitUsage(LastRequestAt);

-- Composite index for rate limit checks
CREATE INDEX IX_RateLimitUsage_Check ON RateLimitUsage(RuleId, Identifier, WindowType, WindowEnd);
```

## Security Functions and Procedures

### Password Security Functions
```sql
-- Function to check password strength
CREATE OR REPLACE FUNCTION check_password_strength(password TEXT)
RETURNS TABLE(is_strong BOOLEAN, issues TEXT[]) AS $$
DECLARE
    issues_array TEXT[] := '{}';
    is_valid BOOLEAN := TRUE;
BEGIN
    -- Check minimum length
    IF LENGTH(password) < 8 THEN
        issues_array := array_append(issues_array, 'Password must be at least 8 characters long');
        is_valid := FALSE;
    END IF;
    
    -- Check for uppercase letter
    IF password !~ '[A-Z]' THEN
        issues_array := array_append(issues_array, 'Password must contain at least one uppercase letter');
        is_valid := FALSE;
    END IF;
    
    -- Check for lowercase letter
    IF password !~ '[a-z]' THEN
        issues_array := array_append(issues_array, 'Password must contain at least one lowercase letter');
        is_valid := FALSE;
    END IF;
    
    -- Check for number
    IF password !~ '[0-9]' THEN
        issues_array := array_append(issues_array, 'Password must contain at least one number');
        is_valid := FALSE;
    END IF;
    
    -- Check for special character
    IF password !~ '[^A-Za-z0-9]' THEN
        issues_array := array_append(issues_array, 'Password must contain at least one special character');
        is_valid := FALSE;
    END IF;
    
    RETURN QUERY SELECT is_valid, issues_array;
END;
$$ LANGUAGE plpgsql;
```

### Account Security Functions
```sql
-- Function to handle failed login attempts
CREATE OR REPLACE FUNCTION handle_failed_login(user_email TEXT, client_ip INET)
RETURNS TABLE(account_locked BOOLEAN, lock_duration INTERVAL) AS $$
DECLARE
    user_record RECORD;
    failed_attempts INTEGER;
    lock_duration_result INTERVAL := NULL;
BEGIN
    -- Get user credentials
    SELECT uc.*, u.Id as user_id INTO user_record
    FROM UserCredentials uc
    JOIN Users u ON uc.UserId = u.Id
    WHERE u.Email = user_email;
    
    IF user_record IS NULL THEN
        RETURN QUERY SELECT FALSE, lock_duration_result;
        RETURN;
    END IF;
    
    -- Increment failed attempts
    UPDATE UserCredentials 
    SET FailedLoginAttempts = FailedLoginAttempts + 1,
        LastFailedLoginAt = NOW()
    WHERE Id = user_record.Id;
    
    failed_attempts := user_record.FailedLoginAttempts + 1;
    
    -- Determine lock duration based on attempts
    IF failed_attempts >= 10 THEN
        lock_duration_result := INTERVAL '24 hours';
    ELSIF failed_attempts >= 5 THEN
        lock_duration_result := INTERVAL '1 hour';
    ELSIF failed_attempts >= 3 THEN
        lock_duration_result := INTERVAL '15 minutes';
    END IF;
    
    -- Apply account lock if needed
    IF lock_duration_result IS NOT NULL THEN
        UPDATE UserCredentials 
        SET AccountLockedUntil = NOW() + lock_duration_result
        WHERE Id = user_record.Id;
        
        RETURN QUERY SELECT TRUE, lock_duration_result;
    ELSE
        RETURN QUERY SELECT FALSE, lock_duration_result;
    END IF;
END;
$$ LANGUAGE plpgsql;
```

## Data Retention and Cleanup

### Automated Cleanup Procedures
```sql
-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM UserSessions 
    WHERE ExpiresAt < NOW() OR 
          (IsRevoked = TRUE AND RevokedAt < NOW() - INTERVAL '30 days');
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old login attempts
CREATE OR REPLACE FUNCTION cleanup_old_login_attempts()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM LoginAttempts 
    WHERE CreatedAt < NOW() - INTERVAL '90 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old security events
CREATE OR REPLACE FUNCTION cleanup_old_security_events()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM SecurityEvents 
    WHERE CreatedAt < NOW() - INTERVAL '2 years' 
    AND Status IN ('Resolved', 'Dismissed')
    AND Severity NOT IN ('High', 'Critical');
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;
```

## Triggers for Security Automation

### Automatic Security Event Logging
```sql
-- Function to log security events
CREATE OR REPLACE FUNCTION log_security_event()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' AND TG_TABLE_NAME = 'UserCredentials' THEN
        -- Log password changes
        IF OLD.PasswordHash != NEW.PasswordHash THEN
            INSERT INTO SecurityEvents (UserId, EventType, Severity, Category, Description, Details)
            VALUES (NEW.UserId, 'PasswordChanged', 'Medium', 'Authentication', 
                   'User password was changed', 
                   jsonb_build_object('changed_at', NOW()));
        END IF;
        
        -- Log account lockouts
        IF OLD.AccountLockedUntil IS NULL AND NEW.AccountLockedUntil IS NOT NULL THEN
            INSERT INTO SecurityEvents (UserId, EventType, Severity, Category, Description, Details)
            VALUES (NEW.UserId, 'AccountLocked', 'High', 'Security', 
                   'User account was locked due to failed login attempts',
                   jsonb_build_object('locked_until', NEW.AccountLockedUntil, 
                                    'failed_attempts', NEW.FailedLoginAttempts));
        END IF;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER security_event_trigger
    AFTER UPDATE ON UserCredentials
    FOR EACH ROW EXECUTE FUNCTION log_security_event();
```

## Encryption and Key Management

### EncryptionKeys Table
Centralized encryption key management for field-level encryption.

```sql
CREATE TABLE EncryptionKeys (
    Id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    KeyId VARCHAR(255) NOT NULL UNIQUE,
    KeyVersion INTEGER NOT NULL DEFAULT 1,
    
    -- Key properties
    Algorithm VARCHAR(50) NOT NULL DEFAULT 'AES-256-GCM',
    KeySize INTEGER NOT NULL DEFAULT 256,
    Purpose VARCHAR(100) NOT NULL, -- 'user-data', 'pii', 'payment', 'messages'
    
    -- Key material (encrypted with master key)
    EncryptedKeyMaterial BYTEA NOT NULL,
    KeyDerivationSalt BYTEA NOT NULL,
    
    -- Key lifecycle
    Status VARCHAR(20) NOT NULL DEFAULT 'Active' CHECK (Status IN ('Active', 'Rotating', 'Deprecated', 'Revoked')),
    CreatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ActivatedAt TIMESTAMPTZ,
    ExpiresAt TIMESTAMPTZ,
    RevokedAt TIMESTAMPTZ,
    RevokedReason TEXT,
    
    -- Access control
    MinDataClassification VARCHAR(20) NOT NULL DEFAULT 'Confidential' 
        CHECK (MinDataClassification IN ('Public', 'Internal', 'Confidential', 'Restricted')),
    AuthorizedServices JSONB DEFAULT '[]',
    
    -- Rotation tracking
    PreviousKeyId VARCHAR(255) REFERENCES EncryptionKeys(KeyId),
    NextKeyId VARCHAR(255) REFERENCES EncryptionKeys(KeyId),
    RotationSchedule INTERVAL,
    LastRotatedAt TIMESTAMPTZ,
    
    -- Compliance and audit
    ComplianceRequirements JSONB DEFAULT '{}',
    AuditLevel VARCHAR(20) NOT NULL DEFAULT 'Standard' 
        CHECK (AuditLevel IN ('Minimal', 'Standard', 'Enhanced', 'Full')),
    
    -- Usage tracking
    UsageCount BIGINT NOT NULL DEFAULT 0,
    LastUsedAt TIMESTAMPTZ,
    
    CreatedBy UUID REFERENCES Users(Id),
    UpdatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for EncryptionKeys
CREATE INDEX IX_EncryptionKeys_KeyId ON EncryptionKeys(KeyId);
CREATE INDEX IX_EncryptionKeys_Status ON EncryptionKeys(Status);
CREATE INDEX IX_EncryptionKeys_Purpose ON EncryptionKeys(Purpose);
CREATE INDEX IX_EncryptionKeys_ExpiresAt ON EncryptionKeys(ExpiresAt) WHERE ExpiresAt IS NOT NULL;
CREATE INDEX IX_EncryptionKeys_CreatedAt ON EncryptionKeys(CreatedAt);

-- Insert default encryption keys
INSERT INTO EncryptionKeys (KeyId, Purpose, MinDataClassification, AuthorizedServices, ComplianceRequirements) VALUES
('user-pii-2024-01', 'user-data', 'Confidential', 
 '["user-service", "auth-service", "profile-service"]',
 '{"gdpr": true, "ccpa": true, "retention_days": 2555}'),
('user-restricted-2024-01', 'pii', 'Restricted', 
 '["user-service", "auth-service"]',
 '{"gdpr": true, "ccpa": true, "retention_days": 2555, "encryption_required": true}'),
('payment-data-2024-01', 'payment', 'Restricted', 
 '["payment-service", "subscription-service"]',
 '{"pci_dss": true, "retention_days": 2555, "secure_deletion": true}'),
('message-encryption-2024-01', 'messages', 'Confidential', 
 '["chat-service", "realtime-service"]',
 '{"end_to_end": true, "forward_secrecy": true}');
```

### FieldEncryptionMetadata Table
Track which fields are encrypted and with which keys.

```sql
CREATE TABLE FieldEncryptionMetadata (
    Id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    EntityType VARCHAR(100) NOT NULL, -- 'User', 'UserProfile', etc.
    EntityId UUID NOT NULL,
    FieldName VARCHAR(100) NOT NULL,
    
    -- Encryption details
    KeyId VARCHAR(255) NOT NULL REFERENCES EncryptionKeys(KeyId),
    Algorithm VARCHAR(50) NOT NULL DEFAULT 'AES-256-GCM',
    EncryptedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Data classification
    DataClassification VARCHAR(20) NOT NULL 
        CHECK (DataClassification IN ('Public', 'Internal', 'Confidential', 'Restricted')),
    
    -- Rotation and compliance
    NeedsReEncryption BOOLEAN NOT NULL DEFAULT FALSE,
    LastReEncryptedAt TIMESTAMPTZ,
    ComplianceFlags JSONB DEFAULT '{}',
    
    -- Audit trail
    EncryptedBy UUID REFERENCES Users(Id),
    CreatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(EntityType, EntityId, FieldName)
);

-- Indexes for FieldEncryptionMetadata
CREATE INDEX IX_FieldEncryptionMetadata_EntityType ON FieldEncryptionMetadata(EntityType);
CREATE INDEX IX_FieldEncryptionMetadata_EntityId ON FieldEncryptionMetadata(EntityId);
CREATE INDEX IX_FieldEncryptionMetadata_KeyId ON FieldEncryptionMetadata(KeyId);
CREATE INDEX IX_FieldEncryptionMetadata_NeedsReEncryption ON FieldEncryptionMetadata(NeedsReEncryption) 
    WHERE NeedsReEncryption = TRUE;
CREATE INDEX IX_FieldEncryptionMetadata_DataClassification ON FieldEncryptionMetadata(DataClassification);
```

### KeyRotationLog Table
Audit trail for key rotation activities.

```sql
CREATE TABLE KeyRotationLog (
    Id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    OldKeyId VARCHAR(255) NOT NULL,
    NewKeyId VARCHAR(255) NOT NULL,
    
    -- Rotation details
    RotationType VARCHAR(20) NOT NULL CHECK (RotationType IN ('Scheduled', 'Emergency', 'Compliance', 'Compromise')),
    RotationReason TEXT,
    
    -- Progress tracking
    Status VARCHAR(20) NOT NULL DEFAULT 'Started' 
        CHECK (Status IN ('Started', 'InProgress', 'Completed', 'Failed', 'Rolled Back')),
    
    -- Statistics
    TotalRecordsToRotate BIGINT,
    RecordsRotated BIGINT DEFAULT 0,
    RecordsFailed BIGINT DEFAULT 0,
    
    -- Timing
    StartedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CompletedAt TIMESTAMPTZ,
    EstimatedCompletionAt TIMESTAMPTZ,
    
    -- Error handling
    ErrorMessage TEXT,
    FailedRecords JSONB,
    
    -- Audit
    InitiatedBy UUID REFERENCES Users(Id),
    ApprovedBy UUID REFERENCES Users(Id)
);

-- Indexes for KeyRotationLog
CREATE INDEX IX_KeyRotationLog_OldKeyId ON KeyRotationLog(OldKeyId);
CREATE INDEX IX_KeyRotationLog_NewKeyId ON KeyRotationLog(NewKeyId);
CREATE INDEX IX_KeyRotationLog_Status ON KeyRotationLog(Status);
CREATE INDEX IX_KeyRotationLog_StartedAt ON KeyRotationLog(StartedAt);
```

### DataClassificationRules Table
Define data classification rules and encryption requirements.

```sql
CREATE TABLE DataClassificationRules (
    Id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    EntityType VARCHAR(100) NOT NULL,
    FieldName VARCHAR(100) NOT NULL,
    
    -- Classification
    DataClassification VARCHAR(20) NOT NULL 
        CHECK (DataClassification IN ('Public', 'Internal', 'Confidential', 'Restricted')),
    
    -- Encryption requirements
    RequireEncryption BOOLEAN NOT NULL DEFAULT FALSE,
    RequireFieldLevelEncryption BOOLEAN NOT NULL DEFAULT FALSE,
    RequireEndToEndEncryption BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Key requirements
    RequiredKeyPurpose VARCHAR(100),
    MinKeySize INTEGER DEFAULT 256,
    RequiredAlgorithm VARCHAR(50) DEFAULT 'AES-256-GCM',
    
    -- Compliance requirements
    GDPRApplicable BOOLEAN NOT NULL DEFAULT FALSE,
    CCPAApplicable BOOLEAN NOT NULL DEFAULT FALSE,
    COPPAApplicable BOOLEAN NOT NULL DEFAULT FALSE,
    PCIDSSApplicable BOOLEAN NOT NULL DEFAULT FALSE,
    HIPAAApplicable BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Retention and deletion
    RetentionPeriodDays INTEGER,
    RequireSecureDeletion BOOLEAN NOT NULL DEFAULT FALSE,
    RequireAuditTrail BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- Access control
    AllowedRoles JSONB DEFAULT '[]',
    RequireExplicitConsent BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Metadata
    Description TEXT,
    CreatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UpdatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CreatedBy UUID REFERENCES Users(Id),
    
    UNIQUE(EntityType, FieldName)
);

-- Insert default classification rules
INSERT INTO DataClassificationRules (EntityType, FieldName, DataClassification, RequireEncryption, GDPRApplicable, CCPAApplicable, Description) VALUES
('User', 'Email', 'Confidential', TRUE, TRUE, TRUE, 'User email address - PII requiring encryption'),
('UserProfile', 'FirstName', 'Confidential', TRUE, TRUE, TRUE, 'User first name - PII requiring encryption'),
('UserProfile', 'LastName', 'Confidential', TRUE, TRUE, TRUE, 'User last name - PII requiring encryption'),
('UserProfile', 'DateOfBirth', 'Restricted', TRUE, TRUE, TRUE, 'Date of birth - highly sensitive PII'),
('UserProfile', 'Bio', 'Confidential', TRUE, TRUE, TRUE, 'User biography - personal information'),
('UserProfile', 'Location', 'Confidential', TRUE, TRUE, TRUE, 'User location - personal information'),
('UserCredentials', 'PasswordHash', 'Restricted', TRUE, FALSE, FALSE, 'Password hash - authentication credential'),
('UserSubscription', 'PaymentMethodId', 'Restricted', TRUE, FALSE, FALSE, 'Payment method reference - financial data'),
('ChatMessage', 'Content', 'Confidential', TRUE, TRUE, TRUE, 'Chat message content - private communications');

-- Indexes for DataClassificationRules
CREATE INDEX IX_DataClassificationRules_EntityType ON DataClassificationRules(EntityType);
CREATE INDEX IX_DataClassificationRules_DataClassification ON DataClassificationRules(DataClassification);
CREATE INDEX IX_DataClassificationRules_RequireEncryption ON DataClassificationRules(RequireEncryption);
```
