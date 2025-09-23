# Database Indexes and Performance Optimization

## Overview
This document defines comprehensive indexing strategies, performance optimizations, and database tuning recommendations for the D&D AI Campaign Management System to ensure optimal performance at scale.

## Index Strategy Overview

### Indexing Principles
1. **Query-Driven Indexing**: Indexes designed based on actual query patterns
2. **Composite Index Optimization**: Multi-column indexes for complex queries
3. **Partial Indexes**: Conditional indexes for filtered queries
4. **JSONB Optimization**: GIN indexes for flexible JSON data
5. **Write Performance Balance**: Minimize index overhead on write operations

## Core Entity Index Optimization

### Users Table Enhanced Indexes
```sql
-- Enhanced user lookup indexes
CREATE INDEX CONCURRENTLY IX_Users_Email_Verified ON Users(Email) 
    WHERE IsDeleted = FALSE AND EmailVerified = TRUE;

CREATE INDEX CONCURRENTLY IX_Users_ActiveSubscription ON Users(SubscriptionTier, LastActiveAt) 
    WHERE IsDeleted = FALSE AND SubscriptionTier != 'Free';

CREATE INDEX CONCURRENTLY IX_Users_LoginActivity ON Users(LastLoginAt, Role) 
    WHERE IsDeleted = FALSE AND LastLoginAt > NOW() - INTERVAL '30 days';

-- Partial index for user search
CREATE INDEX CONCURRENTLY IX_Users_Search ON Users 
    USING gin(to_tsvector('english', DisplayName || ' ' || COALESCE(Email, ''))) 
    WHERE IsDeleted = FALSE;

-- Preferences optimization
CREATE INDEX CONCURRENTLY IX_Users_Preferences_Theme ON Users 
    USING gin((Preferences->'theme')) WHERE IsDeleted = FALSE;

CREATE INDEX CONCURRENTLY IX_Users_Preferences_Notifications ON Users 
    USING gin((Preferences->'notifications')) WHERE IsDeleted = FALSE;
```

### Campaigns Table Enhanced Indexes
```sql
-- Campaign discovery and filtering
CREATE INDEX CONCURRENTLY IX_Campaigns_PublicActive ON Campaigns(IsPublic, Status, LastPlayedAt) 
    WHERE IsDeleted = FALSE AND IsPublic = TRUE;

CREATE INDEX CONCURRENTLY IX_Campaigns_GMActiveCount ON Campaigns(GameMasterId, Status, PlayerCount) 
    WHERE IsDeleted = FALSE AND Status IN ('Active', 'Planning');

-- World state optimization
CREATE INDEX CONCURRENTLY IX_Campaigns_WorldState_Location ON Campaigns 
    USING gin((WorldState->'current_location')) WHERE IsDeleted = FALSE;

CREATE INDEX CONCURRENTLY IX_Campaigns_WorldState_Events ON Campaigns 
    USING gin((WorldState->'active_events')) WHERE IsDeleted = FALSE;

-- Campaign search
CREATE INDEX CONCURRENTLY IX_Campaigns_Search ON Campaigns 
    USING gin(to_tsvector('english', Name || ' ' || COALESCE(Description, ''))) 
    WHERE IsDeleted = FALSE;

-- Template discovery
CREATE INDEX CONCURRENTLY IX_Campaigns_Templates ON Campaigns(IsTemplate, TemplateCategory, CreatedAt) 
    WHERE IsDeleted = FALSE AND IsTemplate = TRUE;
```

### Characters Table Enhanced Indexes
```sql
-- Character queries by campaign and player
CREATE INDEX CONCURRENTLY IX_Characters_CampaignLevel ON Characters(CampaignId, Level, Status) 
    WHERE IsDeleted = FALSE;

CREATE INDEX CONCURRENTLY IX_Characters_PlayerActive ON Characters(PlayerId, Status, UpdatedAt) 
    WHERE IsDeleted = FALSE;

-- D&D specific queries
CREATE INDEX CONCURRENTLY IX_Characters_ClassLevel ON Characters(Class, Level) 
    WHERE IsDeleted = FALSE AND Status = 'Active';

CREATE INDEX CONCURRENTLY IX_Characters_RaceClass ON Characters(Race, Class) 
    WHERE IsDeleted = FALSE;

-- Combat and stats
CREATE INDEX CONCURRENTLY IX_Characters_CombatStats ON Characters(ArmorClass, HitPointsMax, Speed) 
    WHERE IsDeleted = FALSE AND Status = 'Active';

-- Ability scores optimization (for common queries)
CREATE INDEX CONCURRENTLY IX_Characters_Strength ON Characters 
    USING gin(((AbilityScores->'strength'->'total')::int)) 
    WHERE IsDeleted = FALSE;

CREATE INDEX CONCURRENTLY IX_Characters_Dexterity ON Characters 
    USING gin(((AbilityScores->'dexterity'->'total')::int)) 
    WHERE IsDeleted = FALSE;

-- Equipment search
CREATE INDEX CONCURRENTLY IX_Characters_Equipment ON Characters 
    USING gin(Equipment) WHERE IsDeleted = FALSE;

-- Spell search for spellcasters
CREATE INDEX CONCURRENTLY IX_Characters_Spells ON Characters 
    USING gin(Spells) WHERE IsDeleted = FALSE AND Spells IS NOT NULL;

-- Character search
CREATE INDEX CONCURRENTLY IX_Characters_Search ON Characters 
    USING gin(to_tsvector('english', Name || ' ' || COALESCE(BackstoryText, ''))) 
    WHERE IsDeleted = FALSE;
```

### NPCs Table Enhanced Indexes
```sql
-- NPC campaign queries
CREATE INDEX CONCURRENTLY IX_NPCs_CampaignType ON NPCs(CampaignId, NPCType, CurrentLocation) 
    WHERE IsDeleted = FALSE;

CREATE INDEX CONCURRENTLY IX_NPCs_LocationActive ON NPCs(CurrentLocation, Status) 
    WHERE IsDeleted = FALSE AND CurrentLocation IS NOT NULL;

-- Relationship queries
CREATE INDEX CONCURRENTLY IX_NPCs_PartyRelationship ON NPCs 
    USING gin((Relationships->'party_relationship')) WHERE IsDeleted = FALSE;

-- Knowledge and secrets
CREATE INDEX CONCURRENTLY IX_NPCs_Knowledge ON NPCs 
    USING gin(Knowledge) WHERE IsDeleted = FALSE;

CREATE INDEX CONCURRENTLY IX_NPCs_Secrets ON NPCs 
    USING gin((Knowledge->'secrets')) WHERE IsDeleted = FALSE;

-- Quest involvement
CREATE INDEX CONCURRENTLY IX_NPCs_QuestInvolvement ON NPCs 
    USING gin(QuestInvolvement) WHERE IsDeleted = FALSE;

-- AI generation tracking
CREATE INDEX CONCURRENTLY IX_NPCs_AIGenerated ON NPCs(AIGenerationMetadata->>'generated_by_ai', CreatedAt) 
    WHERE IsDeleted = FALSE AND AIGenerationMetadata IS NOT NULL;

-- NPC search
CREATE INDEX CONCURRENTLY IX_NPCs_Search ON NPCs 
    USING gin(to_tsvector('english', Name || ' ' || COALESCE(Description, '') || ' ' || COALESCE(Background, ''))) 
    WHERE IsDeleted = FALSE;
```

## Session and Real-time Indexes

### GameSessions Optimized Indexes
```sql
-- Active session management
CREATE INDEX CONCURRENTLY IX_GameSessions_ActiveCampaign ON GameSessions(CampaignId, Status, ActualStartTime) 
    WHERE Status IN ('Active', 'Paused');

-- Session scheduling
CREATE INDEX CONCURRENTLY IX_GameSessions_Scheduled ON GameSessions(ScheduledStartTime, Status) 
    WHERE Status = 'Planned' AND ScheduledStartTime IS NOT NULL;

-- Recent sessions for campaigns
CREATE INDEX CONCURRENTLY IX_GameSessions_RecentByCampaign ON GameSessions(CampaignId, ActualStartTime) 
    WHERE ActualStartTime IS NOT NULL AND ActualStartTime > NOW() - INTERVAL '30 days';

-- GM session history
CREATE INDEX CONCURRENTLY IX_GameSessions_GMHistory ON GameSessions(GameMaster, ActualStartTime, Status) 
    WHERE ActualStartTime IS NOT NULL;
```

### SessionMessages Optimized Indexes
```sql
-- Message retrieval during sessions
CREATE INDEX CONCURRENTLY IX_SessionMessages_SessionTimeVisibility ON SessionMessages(SessionId, CreatedAt, Visibility) 
    WHERE IsDeleted = FALSE;

-- User message history
CREATE INDEX CONCURRENTLY IX_SessionMessages_UserHistory ON SessionMessages(SenderId, CreatedAt) 
    WHERE IsDeleted = FALSE;

-- Character dialogue tracking
CREATE INDEX CONCURRENTLY IX_SessionMessages_CharacterDialogue ON SessionMessages(CharacterId, MessageType, CreatedAt) 
    WHERE IsDeleted = FALSE AND CharacterId IS NOT NULL;

-- NPC dialogue tracking
CREATE INDEX CONCURRENTLY IX_SessionMessages_NPCDialogue ON SessionMessages(NPCId, MessageType, CreatedAt) 
    WHERE IsDeleted = FALSE AND NPCId IS NOT NULL;

-- AI-generated message tracking
CREATE INDEX CONCURRENTLY IX_SessionMessages_AIGenerated ON SessionMessages(AIGenerated, AIRequestId, CreatedAt) 
    WHERE AIGenerated = TRUE;

-- Message search
CREATE INDEX CONCURRENTLY IX_SessionMessages_Search ON SessionMessages 
    USING gin(to_tsvector('english', Content)) WHERE IsDeleted = FALSE;
```

### DiceRolls Performance Indexes
```sql
-- Session dice roll history
CREATE INDEX CONCURRENTLY IX_DiceRolls_SessionHistory ON DiceRolls(SessionId, CreatedAt, RollType);

-- Character roll statistics
CREATE INDEX CONCURRENTLY IX_DiceRolls_CharacterStats ON DiceRolls(CharacterId, RollType, Success) 
    WHERE CharacterId IS NOT NULL;

-- Critical hit/miss tracking
CREATE INDEX CONCURRENTLY IX_DiceRolls_Criticals ON DiceRolls(SessionId, CriticalHit, CriticalMiss, CreatedAt) 
    WHERE CriticalHit = TRUE OR CriticalMiss = TRUE;

-- Roll verification queries
CREATE INDEX CONCURRENTLY IX_DiceRolls_Verification ON DiceRolls(IsVerified, RollSource, CreatedAt);
```

## AI and Context Indexes

### AIRequests Performance Indexes
```sql
-- User AI usage tracking
CREATE INDEX CONCURRENTLY IX_AIRequests_UserUsage ON AIRequests(UserId, CreatedAt, Status, TotalCost) 
    WHERE Status = 'Completed';

-- Campaign AI usage
CREATE INDEX CONCURRENTLY IX_AIRequests_CampaignUsage ON AIRequests(CampaignId, RequestType, CreatedAt) 
    WHERE CampaignId IS NOT NULL AND Status = 'Completed';

-- Model performance tracking
CREATE INDEX CONCURRENTLY IX_AIRequests_ModelPerformance ON AIRequests(ModelId, Status, ProcessingTimeMs, CreatedAt);

-- Cost analysis
CREATE INDEX CONCURRENTLY IX_AIRequests_CostAnalysis ON AIRequests(UserId, CreatedAt, TotalCost, RequestType) 
    WHERE Status = 'Completed' AND TotalCost > 0;

-- Quality tracking
CREATE INDEX CONCURRENTLY IX_AIRequests_Quality ON AIRequests(ModelId, QualityScore, UserRating) 
    WHERE Status = 'Completed' AND QualityScore IS NOT NULL;

-- Error analysis
CREATE INDEX CONCURRENTLY IX_AIRequests_Errors ON AIRequests(Status, ErrorMessage, ModelId, CreatedAt) 
    WHERE Status = 'Failed';
```

### ContextEmbeddings Vector Indexes
```sql
-- Optimize vector similarity searches
CREATE INDEX CONCURRENTLY IX_ContextEmbeddings_VectorSimilarity ON ContextEmbeddings 
    USING ivfflat (Embedding vector_cosine_ops) WITH (lists = 1000);

-- Alternative index for different similarity metrics
CREATE INDEX CONCURRENTLY IX_ContextEmbeddings_VectorL2 ON ContextEmbeddings 
    USING ivfflat (Embedding vector_l2_ops) WITH (lists = 1000);

-- Content type and campaign filtering
CREATE INDEX CONCURRENTLY IX_ContextEmbeddings_CampaignContent ON ContextEmbeddings(CampaignId, ContentType, RelevanceScore);

-- Usage tracking for embeddings
CREATE INDEX CONCURRENTLY IX_ContextEmbeddings_Usage ON ContextEmbeddings(LastUsedAt, UsageCount) 
    WHERE LastUsedAt IS NOT NULL;
```

## Audit and Security Indexes

### AuditLog Performance Indexes
```sql
-- User activity tracking
CREATE INDEX CONCURRENTLY IX_AuditLog_UserActivity ON AuditLog(UserId, CreatedAt, Operation) 
    WHERE UserId IS NOT NULL;

-- Entity change tracking
CREATE INDEX CONCURRENTLY IX_AuditLog_EntityChanges ON AuditLog(EntityType, EntityId, CreatedAt);

-- Security event monitoring
CREATE INDEX CONCURRENTLY IX_AuditLog_SecurityEvents ON AuditLog(Category, Severity, CreatedAt) 
    WHERE Severity IN ('Error', 'Critical');

-- Compliance queries
CREATE INDEX CONCURRENTLY IX_AuditLog_PersonalData ON AuditLog(IsPersonalData, CreatedAt, EntityType) 
    WHERE IsPersonalData = TRUE;

-- Change data search
CREATE INDEX CONCURRENTLY IX_AuditLog_ChangeData ON AuditLog USING gin(ChangeData);
```

### SecurityEvents Specialized Indexes
```sql
-- Real-time security monitoring
CREATE INDEX CONCURRENTLY IX_SecurityEvents_RealTime ON SecurityEvents(Severity, Status, CreatedAt) 
    WHERE Status = 'Open';

-- User security incidents
CREATE INDEX CONCURRENTLY IX_SecurityEvents_UserIncidents ON SecurityEvents(UserId, Severity, CreatedAt) 
    WHERE UserId IS NOT NULL;

-- IP-based threat detection
CREATE INDEX CONCURRENTLY IX_SecurityEvents_IPThreats ON SecurityEvents(IpAddress, EventType, CreatedAt) 
    WHERE IpAddress IS NOT NULL;

-- Geographic security patterns
CREATE INDEX CONCURRENTLY IX_SecurityEvents_Geographic ON SecurityEvents(Country, Region, EventType, CreatedAt);
```

## Composite Indexes for Complex Queries

### Campaign Analytics Indexes
```sql
-- Campaign engagement metrics
CREATE INDEX CONCURRENTLY IX_Campaign_Engagement ON Campaigns(GameMasterId, Status, LastPlayedAt, PlayerCount) 
    WHERE IsDeleted = FALSE;

-- Player participation analysis
CREATE INDEX CONCURRENTLY IX_Player_Participation ON CampaignPlayers(UserId, Status, JoinedAt, CharacterCount);

-- Session activity patterns
CREATE INDEX CONCURRENTLY IX_Session_Activity ON GameSessions(CampaignId, SessionType, ActualStartTime, EndTime) 
    WHERE ActualStartTime IS NOT NULL;
```

### AI Usage Analytics Indexes
```sql
-- Subscription tier usage patterns
CREATE INDEX CONCURRENTLY IX_AI_SubscriptionUsage ON AIRequests(UserId, CreatedAt, RequestType, TotalCost) 
    WHERE Status = 'Completed';

-- Model comparison analytics
CREATE INDEX CONCURRENTLY IX_AI_ModelComparison ON AIRequests(ModelId, RequestType, ProcessingTimeMs, QualityScore) 
    WHERE Status = 'Completed';

-- Campaign AI integration
CREATE INDEX CONCURRENTLY IX_AI_CampaignIntegration ON AIRequests(CampaignId, RequestType, CreatedAt, Status) 
    WHERE CampaignId IS NOT NULL;
```

## Performance Monitoring Views

### Query Performance Monitoring
```sql
-- Materialized view for query performance tracking
CREATE MATERIALIZED VIEW QueryPerformanceStats AS
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched,
    CASE WHEN idx_scan > 0 THEN idx_tup_read::float / idx_scan ELSE 0 END as avg_tuples_per_scan
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

CREATE UNIQUE INDEX IX_QueryPerformanceStats_Index ON QueryPerformanceStats(schemaname, tablename, indexname);

-- Refresh function
CREATE OR REPLACE FUNCTION refresh_query_performance_stats()
RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY QueryPerformanceStats;
END;
$$ LANGUAGE plpgsql;
```

### Table Size Monitoring
```sql
-- Materialized view for table size tracking
CREATE MATERIALIZED VIEW TableSizeStats AS
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as index_size,
    (SELECT reltuples FROM pg_class WHERE relname = tablename) as estimated_rows
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

CREATE UNIQUE INDEX IX_TableSizeStats_Table ON TableSizeStats(schemaname, tablename);
```

## Index Maintenance Functions

### Index Usage Analysis
```sql
-- Function to analyze index usage
CREATE OR REPLACE FUNCTION analyze_index_usage(min_scans INTEGER DEFAULT 100)
RETURNS TABLE(
    table_name TEXT,
    index_name TEXT,
    index_scans BIGINT,
    tuples_read BIGINT,
    tuples_fetched BIGINT,
    index_size TEXT,
    usage_ratio DECIMAL(5,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        i.tablename::TEXT,
        i.indexname::TEXT,
        i.idx_scan,
        i.idx_tup_read,
        i.idx_tup_fetch,
        pg_size_pretty(pg_relation_size(i.indexrelname::regclass))::TEXT,
        CASE WHEN i.idx_scan > 0 THEN 
            ROUND((i.idx_tup_fetch::decimal / i.idx_tup_read) * 100, 2)
        ELSE 0 END
    FROM pg_stat_user_indexes i
    JOIN pg_index x ON i.indexrelid = x.indexrelid
    WHERE i.schemaname = 'public'
    AND i.idx_scan >= min_scans
    ORDER BY i.idx_scan DESC;
END;
$$ LANGUAGE plpgsql;
```

### Unused Index Detection
```sql
-- Function to find unused indexes
CREATE OR REPLACE FUNCTION find_unused_indexes(min_size_mb INTEGER DEFAULT 1)
RETURNS TABLE(
    schema_name TEXT,
    table_name TEXT,
    index_name TEXT,
    index_size TEXT,
    index_scans BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        i.schemaname::TEXT,
        i.tablename::TEXT,
        i.indexname::TEXT,
        pg_size_pretty(pg_relation_size(i.indexrelname::regclass))::TEXT,
        i.idx_scan
    FROM pg_stat_user_indexes i
    JOIN pg_index x ON i.indexrelid = x.indexrelid
    WHERE i.schemaname = 'public'
    AND i.idx_scan = 0
    AND pg_relation_size(i.indexrelname::regclass) > min_size_mb * 1024 * 1024
    AND NOT x.indisunique  -- Don't suggest removing unique indexes
    ORDER BY pg_relation_size(i.indexrelname::regclass) DESC;
END;
$$ LANGUAGE plpgsql;
```

### Index Maintenance Procedures
```sql
-- Function to rebuild fragmented indexes
CREATE OR REPLACE FUNCTION rebuild_fragmented_indexes(fragmentation_threshold DECIMAL DEFAULT 30.0)
RETURNS TABLE(index_name TEXT, action_taken TEXT) AS $$
DECLARE
    index_record RECORD;
    fragmentation DECIMAL;
BEGIN
    FOR index_record IN 
        SELECT i.schemaname, i.tablename, i.indexname, i.indexrelid
        FROM pg_stat_user_indexes i
        WHERE i.schemaname = 'public'
        AND i.idx_scan > 1000  -- Only consider frequently used indexes
    LOOP
        -- Calculate fragmentation (simplified approach)
        -- In practice, you'd use more sophisticated fragmentation detection
        
        -- For demonstration, rebuild indexes larger than 100MB that are heavily used
        IF pg_relation_size(index_record.indexrelid) > 100 * 1024 * 1024 THEN
            EXECUTE format('REINDEX INDEX CONCURRENTLY %I.%I', 
                          index_record.schemaname, index_record.indexname);
            
            RETURN QUERY SELECT index_record.indexname::TEXT, 'Rebuilt due to size and usage'::TEXT;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;
```

## Database Configuration Optimization

### PostgreSQL Configuration Recommendations
```sql
-- Function to check current database configuration
CREATE OR REPLACE FUNCTION check_db_configuration()
RETURNS TABLE(setting_name TEXT, current_value TEXT, recommended_value TEXT, description TEXT) AS $$
BEGIN
    RETURN QUERY
    WITH config_recommendations AS (
        SELECT 'shared_buffers'::text as setting, '25% of RAM'::text as recommended, 'Database cache size'::text as desc
        UNION ALL SELECT 'effective_cache_size', '75% of RAM', 'OS cache size estimate'
        UNION ALL SELECT 'work_mem', '4MB-256MB', 'Memory for sorts and hash tables'
        UNION ALL SELECT 'maintenance_work_mem', '256MB-2GB', 'Memory for maintenance operations'
        UNION ALL SELECT 'checkpoint_completion_target', '0.9', 'Checkpoint completion target'
        UNION ALL SELECT 'wal_buffers', '16MB', 'WAL buffer size'
        UNION ALL SELECT 'default_statistics_target', '100', 'Statistics collection target'
        UNION ALL SELECT 'random_page_cost', '1.1', 'Random page cost for SSDs'
        UNION ALL SELECT 'effective_io_concurrency', '200', 'IO concurrency for SSDs'
    )
    SELECT 
        r.setting::TEXT,
        current_setting(r.setting)::TEXT,
        r.recommended::TEXT,
        r.desc::TEXT
    FROM config_recommendations r;
END;
$$ LANGUAGE plpgsql;
```

### Connection Pooling Recommendations
```sql
-- Function to analyze connection patterns
CREATE OR REPLACE FUNCTION analyze_connection_patterns()
RETURNS TABLE(
    database_name TEXT,
    active_connections INTEGER,
    idle_connections INTEGER,
    max_connections_used INTEGER,
    avg_connection_duration INTERVAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        datname::TEXT,
        COUNT(*) FILTER (WHERE state = 'active')::INTEGER,
        COUNT(*) FILTER (WHERE state = 'idle')::INTEGER,
        COUNT(*)::INTEGER,
        AVG(NOW() - backend_start)::INTERVAL
    FROM pg_stat_activity
    WHERE datname IS NOT NULL
    GROUP BY datname;
END;
$$ LANGUAGE plpgsql;
```

## Partitioning Strategy

### Time-based Partitioning Implementation
```sql
-- Function to create time-based partitions automatically
CREATE OR REPLACE FUNCTION create_time_partitions(
    table_name TEXT,
    partition_column TEXT,
    interval_type TEXT DEFAULT 'month',
    partitions_ahead INTEGER DEFAULT 3
)
RETURNS VOID AS $$
DECLARE
    partition_date DATE;
    partition_start DATE;
    partition_end DATE;
    partition_name TEXT;
    interval_val INTERVAL;
BEGIN
    -- Determine interval
    interval_val := CASE interval_type
        WHEN 'day' THEN '1 day'::interval
        WHEN 'week' THEN '1 week'::interval
        WHEN 'month' THEN '1 month'::interval
        WHEN 'year' THEN '1 year'::interval
        ELSE '1 month'::interval
    END;
    
    -- Create partitions for future periods
    FOR i IN 0..partitions_ahead LOOP
        partition_start := date_trunc(interval_type, NOW() + (i * interval_val));
        partition_end := partition_start + interval_val;
        
        partition_name := table_name || '_' || 
                         CASE interval_type
                             WHEN 'day' THEN to_char(partition_start, 'YYYY_MM_DD')
                             WHEN 'week' THEN to_char(partition_start, 'YYYY_"W"WW')
                             WHEN 'month' THEN to_char(partition_start, 'YYYY_MM')
                             WHEN 'year' THEN to_char(partition_start, 'YYYY')
                         END;
        
        -- Check if partition exists
        IF NOT EXISTS (
            SELECT 1 FROM pg_class WHERE relname = lower(partition_name)
        ) THEN
            EXECUTE format('CREATE TABLE %I PARTITION OF %I FOR VALUES FROM (%L) TO (%L)',
                          partition_name, table_name, partition_start, partition_end);
            
            -- Create indexes on partition
            EXECUTE format('CREATE INDEX IX_%s_%s ON %I (%I)',
                          partition_name, partition_column, partition_name, partition_column);
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;
```

## Performance Monitoring and Alerting

### Performance Metrics Collection
```sql
-- Function to collect performance metrics
CREATE OR REPLACE FUNCTION collect_performance_metrics()
RETURNS TABLE(
    metric_name TEXT,
    metric_value NUMERIC,
    metric_unit TEXT,
    collected_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 'active_connections'::TEXT, COUNT(*)::NUMERIC, 'connections'::TEXT, NOW()
    FROM pg_stat_activity WHERE state = 'active'
    
    UNION ALL
    
    SELECT 'cache_hit_ratio', 
           ROUND((sum(blks_hit) * 100.0 / NULLIF(sum(blks_hit + blks_read), 0)), 2),
           'percent', NOW()
    FROM pg_stat_database
    
    UNION ALL
    
    SELECT 'checkpoint_frequency',
           (SELECT checkpoints_timed + checkpoints_req FROM pg_stat_bgwriter),
           'checkpoints', NOW()
    
    UNION ALL
    
    SELECT 'average_query_time',
           (SELECT mean_time FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 1),
           'milliseconds', NOW();
END;
$$ LANGUAGE plpgsql;
```

### Automated Index Maintenance
```sql
-- Function for automated index maintenance
CREATE OR REPLACE FUNCTION automated_index_maintenance()
RETURNS TABLE(maintenance_action TEXT, details TEXT) AS $$
DECLARE
    maintenance_log TEXT[];
BEGIN
    -- Reindex heavily fragmented indexes
    PERFORM rebuild_fragmented_indexes();
    maintenance_log := array_append(maintenance_log, 'Rebuilt fragmented indexes');
    
    -- Update statistics for tables with significant changes
    PERFORM pg_stat_reset_single_table_counters(oid) 
    FROM pg_class 
    WHERE relname IN (
        SELECT tablename FROM pg_stat_user_tables 
        WHERE n_mod_since_analyze > 1000
    );
    maintenance_log := array_append(maintenance_log, 'Updated table statistics');
    
    -- Create missing partitions
    PERFORM create_time_partitions('AuditLog', 'CreatedAt', 'month', 3);
    PERFORM create_time_partitions('SessionMessages', 'CreatedAt', 'month', 3);
    maintenance_log := array_append(maintenance_log, 'Created missing partitions');
    
    -- Return maintenance actions
    FOR i IN 1..array_length(maintenance_log, 1) LOOP
        RETURN QUERY SELECT 'maintenance'::TEXT, maintenance_log[i]::TEXT;
    END LOOP;
END;
$$ LANGUAGE plpgsql;
```

## Monitoring Scheduled Jobs

### Create Maintenance Schedule
```sql
-- Table to track maintenance schedules
CREATE TABLE MaintenanceSchedule (
    Id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    TaskName VARCHAR(100) NOT NULL,
    TaskType VARCHAR(50) NOT NULL,
    Schedule VARCHAR(100) NOT NULL, -- Cron-like schedule
    LastRun TIMESTAMPTZ,
    NextRun TIMESTAMPTZ,
    IsEnabled BOOLEAN NOT NULL DEFAULT TRUE,
    Parameters JSONB DEFAULT '{}',
    CreatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default maintenance tasks
INSERT INTO MaintenanceSchedule (TaskName, TaskType, Schedule, NextRun) VALUES
('Index Maintenance', 'index_maintenance', '0 2 * * 0', NOW() + INTERVAL '1 week'), -- Weekly at 2 AM Sunday
('Statistics Update', 'statistics_update', '0 1 * * *', NOW() + INTERVAL '1 day'), -- Daily at 1 AM
('Partition Creation', 'partition_creation', '0 3 1 * *', NOW() + INTERVAL '1 month'), -- Monthly at 3 AM on 1st
('Performance Metrics', 'performance_metrics', '*/15 * * * *', NOW() + INTERVAL '15 minutes'); -- Every 15 minutes

-- Indexes
CREATE INDEX IX_MaintenanceSchedule_NextRun ON MaintenanceSchedule(NextRun) WHERE IsEnabled = TRUE;
CREATE INDEX IX_MaintenanceSchedule_TaskType ON MaintenanceSchedule(TaskType);
```

This comprehensive indexing and performance optimization specification provides the foundation for a high-performance D&D AI Campaign Management System that can scale to thousands of users while maintaining sub-second response times for complex queries.
