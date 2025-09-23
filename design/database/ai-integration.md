# AI Integration Database Schemas

## Overview
This document defines database schemas for AI integration, content generation, usage tracking, and context management in the D&D AI Campaign Management System.

## AI Provider Management

### AIProviders Table
Configuration for different AI service providers.

```sql
CREATE TABLE AIProviders (
    Id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    Name VARCHAR(100) NOT NULL UNIQUE,
    DisplayName VARCHAR(100) NOT NULL,
    Description TEXT,
    
    -- Provider configuration
    ProviderType VARCHAR(50) NOT NULL CHECK (ProviderType IN ('OpenAI', 'Anthropic', 'Google', 'Azure', 'Custom')),
    BaseUrl VARCHAR(500),
    ApiVersion VARCHAR(20),
    
    -- Capabilities
    SupportedFeatures JSONB NOT NULL DEFAULT '[]',
    ModelCapabilities JSONB NOT NULL DEFAULT '{}',
    
    -- Configuration
    DefaultModel VARCHAR(100),
    MaxTokens INTEGER DEFAULT 4000,
    DefaultTemperature DECIMAL(3,2) DEFAULT 0.7,
    
    -- Status and priority
    IsActive BOOLEAN NOT NULL DEFAULT TRUE,
    Priority INTEGER NOT NULL DEFAULT 0,
    HealthStatus VARCHAR(20) NOT NULL DEFAULT 'Unknown' CHECK (HealthStatus IN ('Healthy', 'Degraded', 'Unhealthy', 'Unknown')),
    LastHealthCheck TIMESTAMPTZ,
    
    -- Rate limiting
    RateLimitRpm INTEGER, -- Requests per minute
    RateLimitTpm INTEGER, -- Tokens per minute
    
    CreatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UpdatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default AI providers
INSERT INTO AIProviders (Name, DisplayName, Description, ProviderType, SupportedFeatures, ModelCapabilities, DefaultModel) VALUES
('openai', 'OpenAI', 'OpenAI GPT models for text generation', 'OpenAI', 
 '["text_generation", "dialogue", "world_building", "character_creation"]',
 '{"gpt-4": {"max_tokens": 8192, "cost_per_1k_tokens": 0.03}, "gpt-3.5-turbo": {"max_tokens": 4096, "cost_per_1k_tokens": 0.002}}',
 'gpt-3.5-turbo'),
('anthropic', 'Anthropic Claude', 'Anthropic Claude models for creative content', 'Anthropic',
 '["text_generation", "dialogue", "world_building", "character_creation", "long_context"]',
 '{"claude-3-opus": {"max_tokens": 200000, "cost_per_1k_tokens": 0.015}, "claude-3-sonnet": {"max_tokens": 200000, "cost_per_1k_tokens": 0.003}}',
 'claude-3-sonnet');

-- Indexes for AIProviders
CREATE INDEX IX_AIProviders_Name ON AIProviders(Name);
CREATE INDEX IX_AIProviders_ProviderType ON AIProviders(ProviderType);
CREATE INDEX IX_AIProviders_IsActive ON AIProviders(IsActive);
CREATE INDEX IX_AIProviders_Priority ON AIProviders(Priority) WHERE IsActive = TRUE;
```

### AIModels Table
Specific AI models and their configurations.

```sql
CREATE TABLE AIModels (
    Id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ProviderId UUID NOT NULL REFERENCES AIProviders(Id) ON DELETE CASCADE,
    Name VARCHAR(100) NOT NULL,
    DisplayName VARCHAR(100) NOT NULL,
    Description TEXT,
    
    -- Model specifications
    ModelVersion VARCHAR(50),
    MaxTokens INTEGER NOT NULL,
    ContextWindow INTEGER NOT NULL,
    
    -- Pricing
    CostPer1kInputTokens DECIMAL(10,6),
    CostPer1kOutputTokens DECIMAL(10,6),
    Currency VARCHAR(3) DEFAULT 'USD',
    
    -- Capabilities and features
    Capabilities JSONB NOT NULL DEFAULT '[]',
    SupportedLanguages JSONB NOT NULL DEFAULT '["en"]',
    
    -- Performance characteristics
    AverageResponseTimeMs INTEGER,
    QualityScore DECIMAL(3,2) DEFAULT 0.0 CHECK (QualityScore >= 0.0 AND QualityScore <= 1.0),
    
    -- Subscription tier requirements
    RequiredSubscriptionTier VARCHAR(20) CHECK (RequiredSubscriptionTier IN ('Free', 'DungeonArchitect', 'CampaignWeaver', 'GuildMaster')),
    
    -- Status
    IsActive BOOLEAN NOT NULL DEFAULT TRUE,
    IsDefault BOOLEAN NOT NULL DEFAULT FALSE,
    
    CreatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UpdatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(ProviderId, Name)
);

-- Insert default models
INSERT INTO AIModels (ProviderId, Name, DisplayName, Description, MaxTokens, ContextWindow, CostPer1kInputTokens, CostPer1kOutputTokens, Capabilities, RequiredSubscriptionTier, IsDefault) 
SELECT p.Id, 'gpt-3.5-turbo', 'GPT-3.5 Turbo', 'Fast and efficient model for basic AI features', 4096, 4096, 0.0015, 0.002, 
       '["text_generation", "dialogue", "basic_creativity"]', 'Free', TRUE
FROM AIProviders p WHERE p.Name = 'openai';

INSERT INTO AIModels (ProviderId, Name, DisplayName, Description, MaxTokens, ContextWindow, CostPer1kInputTokens, CostPer1kOutputTokens, Capabilities, RequiredSubscriptionTier)
SELECT p.Id, 'gpt-4', 'GPT-4', 'Advanced model for complex creative tasks', 8192, 8192, 0.03, 0.06,
       '["text_generation", "dialogue", "advanced_creativity", "complex_reasoning"]', 'CampaignWeaver'
FROM AIProviders p WHERE p.Name = 'openai';

-- Indexes for AIModels
CREATE INDEX IX_AIModels_ProviderId ON AIModels(ProviderId);
CREATE INDEX IX_AIModels_Name ON AIModels(Name);
CREATE INDEX IX_AIModels_IsActive ON AIModels(IsActive);
CREATE INDEX IX_AIModels_RequiredSubscriptionTier ON AIModels(RequiredSubscriptionTier);
CREATE INDEX IX_AIModels_IsDefault ON AIModels(IsDefault) WHERE IsDefault = TRUE;
```

## AI Content Generation

### AIRequests Table
Track all AI generation requests for billing and analytics.

```sql
CREATE TABLE AIRequests (
    Id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    UserId UUID NOT NULL REFERENCES Users(Id),
    CampaignId UUID REFERENCES Campaigns(Id),
    
    -- Request classification
    RequestType VARCHAR(50) NOT NULL CHECK (RequestType IN ('npc_generation', 'dialogue', 'world_content', 'quest', 'character_background', 'custom')),
    ContentCategory VARCHAR(50),
    
    -- AI model used
    ProviderId UUID NOT NULL REFERENCES AIProviders(Id),
    ModelId UUID NOT NULL REFERENCES AIModels(Id),
    ModelName VARCHAR(100) NOT NULL,
    
    -- Request details
    Prompt TEXT NOT NULL,
    SystemPrompt TEXT,
    Context JSONB,
    Parameters JSONB DEFAULT '{}',
    
    -- Response details
    ResponseText TEXT,
    ResponseStructured JSONB,
    
    -- Usage metrics
    InputTokens INTEGER NOT NULL DEFAULT 0,
    OutputTokens INTEGER NOT NULL DEFAULT 0,
    TotalTokens INTEGER NOT NULL DEFAULT 0,
    
    -- Cost calculation
    InputCost DECIMAL(10,6) DEFAULT 0,
    OutputCost DECIMAL(10,6) DEFAULT 0,
    TotalCost DECIMAL(10,6) DEFAULT 0,
    Currency VARCHAR(3) DEFAULT 'USD',
    
    -- Quality and performance
    ProcessingTimeMs INTEGER,
    QualityScore DECIMAL(3,2) CHECK (QualityScore IS NULL OR (QualityScore >= 0.0 AND QualityScore <= 1.0)),
    UserRating INTEGER CHECK (UserRating IS NULL OR (UserRating >= 1 AND UserRating <= 5)),
    
    -- Status and error handling
    Status VARCHAR(20) NOT NULL DEFAULT 'Pending' CHECK (Status IN ('Pending', 'Processing', 'Completed', 'Failed', 'Filtered')),
    ErrorMessage TEXT,
    RetryCount INTEGER NOT NULL DEFAULT 0,
    
    -- Content filtering
    ContentFiltered BOOLEAN NOT NULL DEFAULT FALSE,
    FilterReason TEXT,
    SafetyFlags JSONB DEFAULT '[]',
    
    -- Request metadata
    ClientInfo JSONB,
    RequestId VARCHAR(100),
    
    CreatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CompletedAt TIMESTAMPTZ,
    UpdatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for AIRequests
CREATE INDEX IX_AIRequests_UserId ON AIRequests(UserId);
CREATE INDEX IX_AIRequests_CampaignId ON AIRequests(CampaignId) WHERE CampaignId IS NOT NULL;
CREATE INDEX IX_AIRequests_RequestType ON AIRequests(RequestType);
CREATE INDEX IX_AIRequests_ProviderId ON AIRequests(ProviderId);
CREATE INDEX IX_AIRequests_ModelId ON AIRequests(ModelId);
CREATE INDEX IX_AIRequests_Status ON AIRequests(Status);
CREATE INDEX IX_AIRequests_CreatedAt ON AIRequests(CreatedAt);
CREATE INDEX IX_AIRequests_CompletedAt ON AIRequests(CompletedAt) WHERE CompletedAt IS NOT NULL;

-- Composite indexes for common queries
CREATE INDEX IX_AIRequests_UserDate ON AIRequests(UserId, CreatedAt);
CREATE INDEX IX_AIRequests_CampaignType ON AIRequests(CampaignId, RequestType) WHERE CampaignId IS NOT NULL;
CREATE INDEX IX_AIRequests_CostTracking ON AIRequests(UserId, CreatedAt, TotalCost) WHERE Status = 'Completed';
```

### AIContentCache Table
Cache AI-generated content to avoid duplicate requests.

```sql
CREATE TABLE AIContentCache (
    Id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Cache key components
    ContentType VARCHAR(50) NOT NULL,
    PromptHash VARCHAR(64) NOT NULL, -- SHA-256 hash of normalized prompt
    ContextHash VARCHAR(64), -- SHA-256 hash of context
    ModelName VARCHAR(100) NOT NULL,
    ParametersHash VARCHAR(64), -- Hash of generation parameters
    
    -- Cached content
    ResponseText TEXT,
    ResponseStructured JSONB,
    
    -- Cache metadata
    OriginalRequestId UUID REFERENCES AIRequests(Id),
    HitCount INTEGER NOT NULL DEFAULT 0,
    QualityScore DECIMAL(3,2),
    
    -- Cache management
    ExpiresAt TIMESTAMPTZ,
    LastAccessedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CreatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Unique constraint for cache key
    UNIQUE(ContentType, PromptHash, ContextHash, ModelName, ParametersHash)
);

-- Indexes for AIContentCache
CREATE INDEX IX_AIContentCache_ContentType ON AIContentCache(ContentType);
CREATE INDEX IX_AIContentCache_ExpiresAt ON AIContentCache(ExpiresAt) WHERE ExpiresAt IS NOT NULL;
CREATE INDEX IX_AIContentCache_LastAccessedAt ON AIContentCache(LastAccessedAt);
CREATE INDEX IX_AIContentCache_HitCount ON AIContentCache(HitCount);
```

## Campaign Context Management

### CampaignContexts Table
Store and version campaign context for AI generation.

```sql
CREATE TABLE CampaignContexts (
    Id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    CampaignId UUID NOT NULL REFERENCES Campaigns(Id) ON DELETE CASCADE,
    
    -- Context versioning
    Version INTEGER NOT NULL DEFAULT 1,
    ParentVersionId UUID REFERENCES CampaignContexts(Id),
    
    -- Context content
    WorldState JSONB NOT NULL DEFAULT '{}',
    ActiveQuests JSONB NOT NULL DEFAULT '[]',
    RelevantNPCs JSONB NOT NULL DEFAULT '[]',
    RecentEvents JSONB NOT NULL DEFAULT '[]',
    PlayerCharacters JSONB NOT NULL DEFAULT '[]',
    LocationContext JSONB NOT NULL DEFAULT '{}',
    
    -- Context metadata
    ContextSummary TEXT,
    TokenCount INTEGER DEFAULT 0,
    LastUsedAt TIMESTAMPTZ,
    UsageCount INTEGER NOT NULL DEFAULT 0,
    
    -- Context quality
    CompletenessScore DECIMAL(3,2) DEFAULT 0.0 CHECK (CompletenessScore >= 0.0 AND CompletenessScore <= 1.0),
    RelevanceScore DECIMAL(3,2) DEFAULT 0.0 CHECK (RelevanceScore >= 0.0 AND RelevanceScore <= 1.0),
    
    CreatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UpdatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(CampaignId, Version)
);

-- Indexes for CampaignContexts
CREATE INDEX IX_CampaignContexts_CampaignId ON CampaignContexts(CampaignId);
CREATE INDEX IX_CampaignContexts_Version ON CampaignContexts(CampaignId, Version);
CREATE INDEX IX_CampaignContexts_LastUsedAt ON CampaignContexts(LastUsedAt);
CREATE INDEX IX_CampaignContexts_UsageCount ON CampaignContexts(UsageCount);

-- JSONB indexes for context searches
CREATE INDEX IX_CampaignContexts_WorldState ON CampaignContexts USING GIN (WorldState);
CREATE INDEX IX_CampaignContexts_ActiveQuests ON CampaignContexts USING GIN (ActiveQuests);
CREATE INDEX IX_CampaignContexts_RelevantNPCs ON CampaignContexts USING GIN (RelevantNPCs);
```

### ContextEmbeddings Table
Store vector embeddings for semantic search of campaign content.

```sql
CREATE TABLE ContextEmbeddings (
    Id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    CampaignId UUID NOT NULL REFERENCES Campaigns(Id) ON DELETE CASCADE,
    
    -- Content reference
    ContentType VARCHAR(50) NOT NULL CHECK (ContentType IN ('npc', 'location', 'event', 'quest', 'item', 'lore', 'session_note')),
    ContentId UUID NOT NULL,
    ContentText TEXT NOT NULL,
    
    -- Embedding data
    Embedding VECTOR(1536), -- OpenAI ada-002 embedding size
    EmbeddingModel VARCHAR(100) NOT NULL DEFAULT 'text-embedding-ada-002',
    
    -- Metadata
    Metadata JSONB DEFAULT '{}',
    Tags JSONB DEFAULT '[]',
    
    -- Relevance and usage
    RelevanceScore DECIMAL(3,2) DEFAULT 1.0 CHECK (RelevanceScore >= 0.0 AND RelevanceScore <= 1.0),
    LastUsedAt TIMESTAMPTZ,
    UsageCount INTEGER NOT NULL DEFAULT 0,
    
    CreatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UpdatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(CampaignId, ContentType, ContentId)
);

-- Indexes for ContextEmbeddings
CREATE INDEX IX_ContextEmbeddings_CampaignId ON ContextEmbeddings(CampaignId);
CREATE INDEX IX_ContextEmbeddings_ContentType ON ContextEmbeddings(ContentType);
CREATE INDEX IX_ContextEmbeddings_ContentId ON ContextEmbeddings(ContentId);
CREATE INDEX IX_ContextEmbeddings_LastUsedAt ON ContextEmbeddings(LastUsedAt);

-- Vector similarity index for semantic search
CREATE INDEX IX_ContextEmbeddings_Similarity ON ContextEmbeddings USING ivfflat (Embedding vector_cosine_ops) WITH (lists = 100);

-- JSONB indexes for metadata searches
CREATE INDEX IX_ContextEmbeddings_Metadata ON ContextEmbeddings USING GIN (Metadata);
CREATE INDEX IX_ContextEmbeddings_Tags ON ContextEmbeddings USING GIN (Tags);
```

### ContextSearches Table
Track semantic searches for analytics and improvement.

```sql
CREATE TABLE ContextSearches (
    Id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    CampaignId UUID NOT NULL REFERENCES Campaigns(Id) ON DELETE CASCADE,
    UserId UUID NOT NULL REFERENCES Users(Id),
    
    -- Search details
    Query TEXT NOT NULL,
    SearchType VARCHAR(50) NOT NULL CHECK (SearchType IN ('semantic', 'keyword', 'hybrid')),
    Filters JSONB DEFAULT '{}',
    
    -- Results
    ResultCount INTEGER NOT NULL DEFAULT 0,
    Results JSONB DEFAULT '[]',
    ProcessingTimeMs INTEGER,
    
    -- User interaction
    ClickedResults JSONB DEFAULT '[]',
    UserSatisfaction INTEGER CHECK (UserSatisfaction IS NULL OR (UserSatisfaction >= 1 AND UserSatisfaction <= 5)),
    
    CreatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for ContextSearches
CREATE INDEX IX_ContextSearches_CampaignId ON ContextSearches(CampaignId);
CREATE INDEX IX_ContextSearches_UserId ON ContextSearches(UserId);
CREATE INDEX IX_ContextSearches_SearchType ON ContextSearches(SearchType);
CREATE INDEX IX_ContextSearches_CreatedAt ON ContextSearches(CreatedAt);
```

## AI Usage Analytics

### AIUsageMetrics Table
Aggregate AI usage metrics for reporting and billing.

```sql
CREATE TABLE AIUsageMetrics (
    Id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    UserId UUID NOT NULL REFERENCES Users(Id),
    
    -- Time period
    PeriodType VARCHAR(10) NOT NULL CHECK (PeriodType IN ('Hour', 'Day', 'Week', 'Month')),
    PeriodStart TIMESTAMPTZ NOT NULL,
    PeriodEnd TIMESTAMPTZ NOT NULL,
    
    -- Usage counters
    TotalRequests INTEGER NOT NULL DEFAULT 0,
    SuccessfulRequests INTEGER NOT NULL DEFAULT 0,
    FailedRequests INTEGER NOT NULL DEFAULT 0,
    FilteredRequests INTEGER NOT NULL DEFAULT 0,
    
    -- Token usage
    TotalInputTokens BIGINT NOT NULL DEFAULT 0,
    TotalOutputTokens BIGINT NOT NULL DEFAULT 0,
    TotalTokens BIGINT NOT NULL DEFAULT 0,
    
    -- Cost tracking
    TotalCost DECIMAL(10,6) NOT NULL DEFAULT 0,
    Currency VARCHAR(3) DEFAULT 'USD',
    
    -- Performance metrics
    AverageResponseTimeMs INTEGER,
    MedianResponseTimeMs INTEGER,
    P95ResponseTimeMs INTEGER,
    
    -- Quality metrics
    AverageQualityScore DECIMAL(3,2),
    AverageUserRating DECIMAL(3,2),
    
    -- Request type breakdown
    RequestTypeBreakdown JSONB NOT NULL DEFAULT '{}',
    ModelUsageBreakdown JSONB NOT NULL DEFAULT '{}',
    
    CreatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UpdatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(UserId, PeriodType, PeriodStart)
);

-- Indexes for AIUsageMetrics
CREATE INDEX IX_AIUsageMetrics_UserId ON AIUsageMetrics(UserId);
CREATE INDEX IX_AIUsageMetrics_PeriodType ON AIUsageMetrics(PeriodType);
CREATE INDEX IX_AIUsageMetrics_PeriodStart ON AIUsageMetrics(PeriodStart);
CREATE INDEX IX_AIUsageMetrics_TotalCost ON AIUsageMetrics(TotalCost);
```

### AIModelPerformance Table
Track performance metrics for different AI models.

```sql
CREATE TABLE AIModelPerformance (
    Id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ModelId UUID NOT NULL REFERENCES AIModels(Id),
    
    -- Time period
    PeriodStart TIMESTAMPTZ NOT NULL,
    PeriodEnd TIMESTAMPTZ NOT NULL,
    
    -- Usage statistics
    RequestCount INTEGER NOT NULL DEFAULT 0,
    SuccessRate DECIMAL(5,2) NOT NULL DEFAULT 0.0,
    ErrorRate DECIMAL(5,2) NOT NULL DEFAULT 0.0,
    FilterRate DECIMAL(5,2) NOT NULL DEFAULT 0.0,
    
    -- Performance metrics
    AverageResponseTimeMs INTEGER,
    MedianResponseTimeMs INTEGER,
    P95ResponseTimeMs INTEGER,
    P99ResponseTimeMs INTEGER,
    
    -- Quality metrics
    AverageQualityScore DECIMAL(3,2),
    AverageUserRating DECIMAL(3,2),
    UserSatisfactionRate DECIMAL(5,2),
    
    -- Cost efficiency
    AverageCostPerRequest DECIMAL(10,6),
    CostEfficiencyScore DECIMAL(3,2),
    
    -- Error breakdown
    ErrorBreakdown JSONB DEFAULT '{}',
    
    CreatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(ModelId, PeriodStart)
);

-- Indexes for AIModelPerformance
CREATE INDEX IX_AIModelPerformance_ModelId ON AIModelPerformance(ModelId);
CREATE INDEX IX_AIModelPerformance_PeriodStart ON AIModelPerformance(PeriodStart);
CREATE INDEX IX_AIModelPerformance_SuccessRate ON AIModelPerformance(SuccessRate);
CREATE INDEX IX_AIModelPerformance_AverageQualityScore ON AIModelPerformance(AverageQualityScore);
```

## Content Quality and Moderation

### ContentModerationRules Table
Define rules for AI content filtering and moderation.

```sql
CREATE TABLE ContentModerationRules (
    Id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    Name VARCHAR(100) NOT NULL UNIQUE,
    Description TEXT,
    
    -- Rule configuration
    RuleType VARCHAR(50) NOT NULL CHECK (RuleType IN ('keyword', 'pattern', 'ai_classifier', 'custom')),
    Pattern TEXT,
    Keywords JSONB DEFAULT '[]',
    
    -- Content categories to check
    ContentTypes JSONB DEFAULT '[]',
    Severity VARCHAR(10) NOT NULL CHECK (Severity IN ('Low', 'Medium', 'High', 'Critical')),
    
    -- Actions
    Action VARCHAR(20) NOT NULL CHECK (Action IN ('Flag', 'Filter', 'Reject', 'Review')),
    AutoApprove BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Scope
    ApplicableRatings JSONB DEFAULT '["G", "PG", "PG-13", "R"]',
    
    -- Rule status
    IsActive BOOLEAN NOT NULL DEFAULT TRUE,
    Priority INTEGER NOT NULL DEFAULT 0,
    
    CreatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UpdatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default moderation rules
INSERT INTO ContentModerationRules (Name, Description, RuleType, Keywords, ContentTypes, Severity, Action, ApplicableRatings) VALUES
('NSFW_Content', 'Filter explicit sexual content', 'keyword', 
 '["explicit", "sexual", "nsfw", "adult"]', 
 '["npc_generation", "dialogue", "world_content"]', 'High', 'Filter', '["G", "PG", "PG-13"]'),
('Violence_Extreme', 'Filter extreme violence descriptions', 'keyword',
 '["torture", "dismember", "gore", "brutal"]',
 '["npc_generation", "dialogue", "world_content"]', 'Medium', 'Review', '["G", "PG"]'),
('Discrimination', 'Filter discriminatory content', 'keyword',
 '["racist", "sexist", "homophobic", "discriminatory"]',
 '["npc_generation", "dialogue", "world_content"]', 'Critical', 'Reject', '["G", "PG", "PG-13", "R"]');

-- Indexes for ContentModerationRules
CREATE INDEX IX_ContentModerationRules_RuleType ON ContentModerationRules(RuleType);
CREATE INDEX IX_ContentModerationRules_IsActive ON ContentModerationRules(IsActive);
CREATE INDEX IX_ContentModerationRules_Priority ON ContentModerationRules(Priority) WHERE IsActive = TRUE;
```

### ContentModerationLog Table
Log all content moderation actions for audit and improvement.

```sql
CREATE TABLE ContentModerationLog (
    Id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    AIRequestId UUID NOT NULL REFERENCES AIRequests(Id),
    RuleId UUID REFERENCES ContentModerationRules(Id),
    
    -- Moderation details
    ModerationType VARCHAR(20) NOT NULL CHECK (ModerationType IN ('Automatic', 'Manual', 'Appeal')),
    Action VARCHAR(20) NOT NULL CHECK (Action IN ('Approved', 'Flagged', 'Filtered', 'Rejected')),
    Confidence DECIMAL(3,2) CHECK (Confidence >= 0.0 AND Confidence <= 1.0),
    
    -- Content details
    OriginalContent TEXT,
    FlaggedSegments JSONB DEFAULT '[]',
    ModifiedContent TEXT,
    
    -- Moderation reason
    Reason TEXT NOT NULL,
    RuleViolations JSONB DEFAULT '[]',
    
    -- Review information
    ReviewedBy UUID REFERENCES Users(Id),
    ReviewNotes TEXT,
    ReviewDecision VARCHAR(20) CHECK (ReviewDecision IN ('Upheld', 'Overturned', 'Modified')),
    
    -- Appeal information
    AppealSubmitted BOOLEAN NOT NULL DEFAULT FALSE,
    AppealReason TEXT,
    AppealDecision VARCHAR(20) CHECK (AppealDecision IN ('Approved', 'Denied', 'Pending')),
    
    CreatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ReviewedAt TIMESTAMPTZ,
    AppealedAt TIMESTAMPTZ
);

-- Indexes for ContentModerationLog
CREATE INDEX IX_ContentModerationLog_AIRequestId ON ContentModerationLog(AIRequestId);
CREATE INDEX IX_ContentModerationLog_RuleId ON ContentModerationLog(RuleId);
CREATE INDEX IX_ContentModerationLog_ModerationType ON ContentModerationLog(ModerationType);
CREATE INDEX IX_ContentModerationLog_Action ON ContentModerationLog(Action);
CREATE INDEX IX_ContentModerationLog_ReviewedBy ON ContentModerationLog(ReviewedBy) WHERE ReviewedBy IS NOT NULL;
CREATE INDEX IX_ContentModerationLog_CreatedAt ON ContentModerationLog(CreatedAt);
```

## AI Performance Optimization

### AIPromptTemplates Table
Store and version AI prompt templates for consistency and optimization.

```sql
CREATE TABLE AIPromptTemplates (
    Id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    Name VARCHAR(100) NOT NULL,
    Description TEXT,
    
    -- Template content
    SystemPrompt TEXT,
    UserPromptTemplate TEXT NOT NULL,
    
    -- Template metadata
    ContentType VARCHAR(50) NOT NULL,
    Version INTEGER NOT NULL DEFAULT 1,
    ParentTemplateId UUID REFERENCES AIPromptTemplates(Id),
    
    -- Template parameters
    RequiredParameters JSONB DEFAULT '[]',
    OptionalParameters JSONB DEFAULT '[]',
    DefaultParameters JSONB DEFAULT '{}',
    
    -- Performance metrics
    UsageCount INTEGER NOT NULL DEFAULT 0,
    SuccessRate DECIMAL(5,2) DEFAULT 0.0,
    AverageQualityScore DECIMAL(3,2),
    AverageResponseTime INTEGER,
    
    -- Template status
    Status VARCHAR(20) NOT NULL DEFAULT 'Draft' CHECK (Status IN ('Draft', 'Active', 'Deprecated', 'Archived')),
    IsDefault BOOLEAN NOT NULL DEFAULT FALSE,
    
    CreatedBy UUID NOT NULL REFERENCES Users(Id),
    CreatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UpdatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(Name, Version)
);

-- Insert default prompt templates
INSERT INTO AIPromptTemplates (Name, Description, SystemPrompt, UserPromptTemplate, ContentType, Status, IsDefault, CreatedBy)
SELECT 'NPC_Generation_Basic', 'Basic NPC generation template', 
       'You are a helpful D&D assistant that creates NPCs for tabletop campaigns. Create realistic, interesting NPCs that fit the campaign setting.',
       'Create a {{npc_type}} NPC for a D&D campaign. Setting: {{setting}}. Location: {{location}}. The NPC should be {{personality_hint}}.',
       'npc_generation', 'Active', TRUE, u.Id
FROM Users u WHERE u.Role = 'Admin' LIMIT 1;

-- Indexes for AIPromptTemplates
CREATE INDEX IX_AIPromptTemplates_Name ON AIPromptTemplates(Name);
CREATE INDEX IX_AIPromptTemplates_ContentType ON AIPromptTemplates(ContentType);
CREATE INDEX IX_AIPromptTemplates_Status ON AIPromptTemplates(Status);
CREATE INDEX IX_AIPromptTemplates_IsDefault ON AIPromptTemplates(IsDefault) WHERE IsDefault = TRUE;
CREATE INDEX IX_AIPromptTemplates_UsageCount ON AIPromptTemplates(UsageCount);
```

## AI Functions and Procedures

### Context Management Functions
```sql
-- Function to update campaign context
CREATE OR REPLACE FUNCTION update_campaign_context(campaign_uuid UUID)
RETURNS UUID AS $$
DECLARE
    context_id UUID;
    new_version INTEGER;
BEGIN
    -- Get the next version number
    SELECT COALESCE(MAX(Version), 0) + 1 INTO new_version
    FROM CampaignContexts 
    WHERE CampaignId = campaign_uuid;
    
    -- Create new context version
    INSERT INTO CampaignContexts (CampaignId, Version, WorldState, ActiveQuests, RelevantNPCs, RecentEvents, PlayerCharacters)
    SELECT 
        campaign_uuid,
        new_version,
        c.WorldState,
        COALESCE(jsonb_agg(DISTINCT jsonb_build_object(
            'id', q.Id,
            'name', q.Name,
            'status', q.Status
        )) FILTER (WHERE q.Id IS NOT NULL), '[]'::jsonb) as active_quests,
        COALESCE(jsonb_agg(DISTINCT jsonb_build_object(
            'id', n.Id,
            'name', n.Name,
            'type', n.NPCType,
            'location', n.CurrentLocation
        )) FILTER (WHERE n.Id IS NOT NULL), '[]'::jsonb) as relevant_npcs,
        '[]'::jsonb as recent_events,
        COALESCE(jsonb_agg(DISTINCT jsonb_build_object(
            'id', ch.Id,
            'name', ch.Name,
            'class', ch.Class,
            'level', ch.Level
        )) FILTER (WHERE ch.Id IS NOT NULL), '[]'::jsonb) as player_characters
    FROM Campaigns c
    LEFT JOIN Quests q ON c.Id = q.CampaignId AND q.Status IN ('Active', 'InProgress')
    LEFT JOIN NPCs n ON c.Id = n.CampaignId AND n.IsDeleted = FALSE
    LEFT JOIN Characters ch ON c.Id = ch.CampaignId AND ch.IsDeleted = FALSE AND ch.Status = 'Active'
    WHERE c.Id = campaign_uuid
    GROUP BY c.Id, c.WorldState
    RETURNING Id INTO context_id;
    
    RETURN context_id;
END;
$$ LANGUAGE plpgsql;
```

### Usage Tracking Functions
```sql
-- Function to track AI usage
CREATE OR REPLACE FUNCTION track_ai_usage(
    user_uuid UUID,
    request_uuid UUID,
    tokens_used INTEGER,
    cost_incurred DECIMAL(10,6)
)
RETURNS VOID AS $$
DECLARE
    current_period_start TIMESTAMPTZ;
    current_period_end TIMESTAMPTZ;
BEGIN
    -- Calculate current month period
    current_period_start := date_trunc('month', NOW());
    current_period_end := current_period_start + INTERVAL '1 month' - INTERVAL '1 second';
    
    -- Update or insert usage tracking
    INSERT INTO UsageTracking (UserId, PeriodStart, PeriodEnd, AIRequestsUsed, UsageDetails)
    VALUES (
        user_uuid,
        current_period_start,
        current_period_end,
        1,
        jsonb_build_object(
            'total_tokens', tokens_used,
            'total_cost', cost_incurred,
            'last_request', request_uuid
        )
    )
    ON CONFLICT (UserId, PeriodStart)
    DO UPDATE SET
        AIRequestsUsed = UsageTracking.AIRequestsUsed + 1,
        UsageDetails = jsonb_set(
            jsonb_set(
                jsonb_set(
                    UsageTracking.UsageDetails,
                    '{total_tokens}',
                    to_jsonb((UsageTracking.UsageDetails->>'total_tokens')::INTEGER + tokens_used)
                ),
                '{total_cost}',
                to_jsonb((UsageTracking.UsageDetails->>'total_cost')::DECIMAL + cost_incurred)
            ),
            '{last_request}',
            to_jsonb(request_uuid)
        ),
        UpdatedAt = NOW();
END;
$$ LANGUAGE plpgsql;
```

### Content Caching Functions
```sql
-- Function to get cached AI content
CREATE OR REPLACE FUNCTION get_cached_content(
    content_type_param VARCHAR(50),
    prompt_hash_param VARCHAR(64),
    context_hash_param VARCHAR(64),
    model_name_param VARCHAR(100),
    parameters_hash_param VARCHAR(64)
)
RETURNS TABLE(response_text TEXT, response_structured JSONB) AS $$
BEGIN
    -- Update hit count and last accessed time
    UPDATE AIContentCache 
    SET HitCount = HitCount + 1,
        LastAccessedAt = NOW()
    WHERE ContentType = content_type_param
      AND PromptHash = prompt_hash_param
      AND (ContextHash = context_hash_param OR (ContextHash IS NULL AND context_hash_param IS NULL))
      AND ModelName = model_name_param
      AND ParametersHash = parameters_hash_param
      AND (ExpiresAt IS NULL OR ExpiresAt > NOW());
    
    -- Return cached content if found
    RETURN QUERY
    SELECT c.ResponseText, c.ResponseStructured
    FROM AIContentCache c
    WHERE c.ContentType = content_type_param
      AND c.PromptHash = prompt_hash_param
      AND (c.ContextHash = context_hash_param OR (c.ContextHash IS NULL AND context_hash_param IS NULL))
      AND c.ModelName = model_name_param
      AND c.ParametersHash = parameters_hash_param
      AND (c.ExpiresAt IS NULL OR c.ExpiresAt > NOW());
END;
$$ LANGUAGE plpgsql;
```

## AI Triggers and Automation

### Automatic Context Updates
```sql
-- Function to trigger context updates
CREATE OR REPLACE FUNCTION trigger_context_update()
RETURNS TRIGGER AS $$
BEGIN
    -- Update campaign context when relevant entities change
    IF TG_TABLE_NAME IN ('Characters', 'NPCs', 'Quests') THEN
        -- Async context update (would be handled by background job in practice)
        INSERT INTO ContextUpdateQueue (CampaignId, Reason, Priority)
        VALUES (
            COALESCE(NEW.CampaignId, OLD.CampaignId),
            TG_TABLE_NAME || '_' || TG_OP,
            CASE WHEN TG_TABLE_NAME = 'Characters' THEN 1 ELSE 2 END
        )
        ON CONFLICT (CampaignId) DO UPDATE SET
            UpdatedAt = NOW(),
            Priority = LEAST(ContextUpdateQueue.Priority, EXCLUDED.Priority);
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to relevant tables
CREATE TRIGGER context_update_characters
    AFTER INSERT OR UPDATE OR DELETE ON Characters
    FOR EACH ROW EXECUTE FUNCTION trigger_context_update();

CREATE TRIGGER context_update_npcs
    AFTER INSERT OR UPDATE OR DELETE ON NPCs
    FOR EACH ROW EXECUTE FUNCTION trigger_context_update();
```

### Usage Metrics Aggregation
```sql
-- Function to aggregate AI usage metrics
CREATE OR REPLACE FUNCTION aggregate_ai_usage_metrics()
RETURNS VOID AS $$
DECLARE
    metric_period TIMESTAMPTZ;
    period_start TIMESTAMPTZ;
    period_end TIMESTAMPTZ;
BEGIN
    -- Aggregate daily metrics for yesterday
    metric_period := date_trunc('day', NOW() - INTERVAL '1 day');
    period_start := metric_period;
    period_end := period_start + INTERVAL '1 day' - INTERVAL '1 second';
    
    INSERT INTO AIUsageMetrics (
        UserId, PeriodType, PeriodStart, PeriodEnd,
        TotalRequests, SuccessfulRequests, FailedRequests, FilteredRequests,
        TotalInputTokens, TotalOutputTokens, TotalTokens, TotalCost,
        AverageResponseTimeMs, RequestTypeBreakdown, ModelUsageBreakdown
    )
    SELECT 
        UserId,
        'Day',
        period_start,
        period_end,
        COUNT(*) as total_requests,
        COUNT(*) FILTER (WHERE Status = 'Completed') as successful_requests,
        COUNT(*) FILTER (WHERE Status = 'Failed') as failed_requests,
        COUNT(*) FILTER (WHERE Status = 'Filtered') as filtered_requests,
        SUM(InputTokens) as total_input_tokens,
        SUM(OutputTokens) as total_output_tokens,
        SUM(TotalTokens) as total_tokens,
        SUM(TotalCost) as total_cost,
        AVG(ProcessingTimeMs)::INTEGER as avg_response_time,
        jsonb_object_agg(RequestType, request_type_count) as request_type_breakdown,
        jsonb_object_agg(ModelName, model_count) as model_usage_breakdown
    FROM (
        SELECT 
            UserId, RequestType, ModelName, Status,
            InputTokens, OutputTokens, TotalTokens, TotalCost, ProcessingTimeMs,
            COUNT(*) OVER (PARTITION BY UserId, RequestType) as request_type_count,
            COUNT(*) OVER (PARTITION BY UserId, ModelName) as model_count
        FROM AIRequests
        WHERE CreatedAt >= period_start AND CreatedAt <= period_end
    ) grouped_data
    GROUP BY UserId
    ON CONFLICT (UserId, PeriodType, PeriodStart) DO UPDATE SET
        TotalRequests = EXCLUDED.TotalRequests,
        SuccessfulRequests = EXCLUDED.SuccessfulRequests,
        FailedRequests = EXCLUDED.FailedRequests,
        FilteredRequests = EXCLUDED.FilteredRequests,
        TotalInputTokens = EXCLUDED.TotalInputTokens,
        TotalOutputTokens = EXCLUDED.TotalOutputTokens,
        TotalTokens = EXCLUDED.TotalTokens,
        TotalCost = EXCLUDED.TotalCost,
        AverageResponseTimeMs = EXCLUDED.AverageResponseTimeMs,
        RequestTypeBreakdown = EXCLUDED.RequestTypeBreakdown,
        ModelUsageBreakdown = EXCLUDED.ModelUsageBreakdown,
        UpdatedAt = NOW();
END;
$$ LANGUAGE plpgsql;
```
