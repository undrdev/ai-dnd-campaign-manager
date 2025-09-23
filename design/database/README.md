# D&D AI Campaign Management System - Database Design

## Overview
This directory contains comprehensive database design specifications for the D&D AI Campaign Management System. The database is designed to support a scalable, AI-enhanced tabletop gaming platform with real-time collaboration, comprehensive audit trails, and production-ready performance.

## Database Architecture

### Technology Stack
- **Primary Database**: PostgreSQL 15+
- **ORM**: Entity Framework Core 8.0+
- **Caching**: Redis for distributed caching
- **Vector Search**: pgvector extension for AI embeddings
- **Full-Text Search**: PostgreSQL native text search
- **Migration Management**: Custom migration framework with EF Core

### Design Principles
1. **AI-First Design**: Optimized for AI content generation and context management
2. **D&D 5e Compliance**: Native support for official D&D rules and mechanics
3. **Real-time Collaboration**: Built for concurrent multi-user gameplay
4. **Audit-Complete**: Full change tracking and compliance support
5. **Performance-Optimized**: Designed for sub-second response times at scale
6. **GDPR-Compliant**: Privacy-first design with data protection features

## Database Schemas

### [Core Entities](./core-entities.md)
**Primary domain models and relationships**
- **Users**: Account management with preferences and subscription tracking
- **Campaigns**: Campaign management with JSONB world state storage
- **Characters**: D&D 5e compliant character sheets with progression tracking
- **NPCs**: AI-enhanced NPCs with personality and relationship management
- **Supporting Tables**: Sessions, players, interactions, and junction tables

**Key Features:**
- Flexible JSONB storage for D&D data that varies by edition
- Comprehensive business rules and constraints
- Optimized indexes for common query patterns
- Soft delete support with audit trails

### [Authentication & Security](./auth-security.md)
**Complete security and user management system**
- **Authentication**: Multi-factor auth, social login, JWT token management
- **Authorization**: Role-based permissions with campaign-specific scoping
- **Subscription Management**: Tiered plans with usage tracking and billing
- **Security Monitoring**: Login attempts, security events, and threat detection
- **Rate Limiting**: API protection with tier-based limits

**Key Features:**
- OAuth 2.0 / OpenID Connect support
- Granular permission system
- Automated security event logging
- GDPR-compliant data processing tracking

### [AI Integration](./ai-integration.md)
**AI-powered content generation and context management**
- **AI Providers**: Multi-provider support (OpenAI, Anthropic, etc.)
- **Content Generation**: Request tracking with usage analytics and billing
- **Context Management**: Campaign context with vector embeddings for semantic search
- **Usage Analytics**: Performance metrics and cost optimization
- **Content Moderation**: Automated filtering and quality assurance

**Key Features:**
- Vector similarity search using pgvector
- Comprehensive AI usage tracking for billing
- Content caching to reduce API costs
- Quality scoring and user feedback integration

### [Real-time Collaboration](./realtime-session.md)
**Live gameplay and session management**
- **Session Management**: Game sessions with state persistence and recovery
- **Real-time Communication**: Chat, dice rolls, and system messages
- **Combat System**: Initiative tracking, turn management, and action logging
- **Map Integration**: Battle maps with token positioning and fog of war
- **Connection Management**: WebSocket connections with heartbeat monitoring

**Key Features:**
- SignalR WebSocket support for real-time updates
- Combat encounter management with D&D 5e rules
- Conflict resolution for concurrent edits
- Session state snapshots for recovery

### [Audit & History Tracking](./audit-history.md)
**Comprehensive change tracking and compliance**
- **Universal Audit Log**: All system changes with detailed context
- **Entity History**: Version-controlled entity snapshots
- **Campaign-Specific Auditing**: Gameplay action tracking
- **Character Progression**: Level-up and advancement history
- **Privacy Compliance**: GDPR data processing logs and privacy requests

**Key Features:**
- Automatic audit triggers on all core tables
- Field-level change tracking
- Data retention policies with automated cleanup
- Privacy request management (data export, deletion)

### [Performance & Indexing](./indexes-performance.md)
**Database optimization and performance tuning**
- **Strategic Indexing**: Query-optimized indexes for all common patterns
- **JSONB Optimization**: GIN indexes for flexible JSON data queries
- **Vector Search**: Optimized ivfflat indexes for AI embeddings
- **Composite Indexes**: Multi-column indexes for complex analytics
- **Performance Monitoring**: Query analysis and optimization tools

**Key Features:**
- Partial indexes for filtered queries
- Materialized views for analytics
- Automated index maintenance procedures
- Performance monitoring dashboards

### [Migration Strategy](./migration-strategy.md)
**Database versioning and deployment management**
- **Migration Framework**: Version-controlled schema changes
- **Data Seeding**: Reference data and initial content
- **Environment Management**: Development, staging, and production setups
- **Rollback Support**: Safe migration rollbacks with down scripts
- **CI/CD Integration**: Automated deployment pipeline integration

**Key Features:**
- Comprehensive D&D 5e reference data seeding
- Production migration safety checks
- Large table migration utilities
- Automated backup integration

## Data Relationships

### Entity Relationship Overview
```
Users (1) ──→ (M) Campaigns ──→ (M) Characters
  │                │                 │
  │                └──→ (M) NPCs     │
  │                     │            │
  └──→ (M) GameSessions ─┴──→ (M) SessionMessages
           │
           └──→ (M) CombatEncounters ──→ (M) DiceRolls
```

### Key Relationships
- **Users** can be Game Masters of multiple **Campaigns**
- **Users** can be Players in multiple **Campaigns** (many-to-many via CampaignPlayers)
- **Characters** belong to one Player and one Campaign
- **NPCs** belong to one Campaign and can interact with multiple Characters
- **GameSessions** belong to one Campaign and track real-time gameplay
- **AI Integration** spans across all entities for content generation

## Performance Characteristics

### Scalability Targets
- **Concurrent Users**: 10,000+ simultaneous users
- **Database Size**: 100GB+ with partitioning support
- **Query Performance**: <200ms for 95th percentile
- **Real-time Updates**: <100ms propagation time
- **AI Requests**: 10,000+ requests per minute

### Optimization Strategies
1. **Read Replicas**: Geographic distribution for global access
2. **Connection Pooling**: PgBouncer for connection management
3. **Caching Layers**: Redis for session state and frequently accessed data
4. **Partitioning**: Time-based partitioning for large audit tables
5. **Materialized Views**: Pre-computed analytics and reports

## Security and Compliance

### Data Protection
- **Encryption**: AES-256 encryption for sensitive data at rest
- **TLS 1.3**: All data encrypted in transit
- **Field-Level Security**: Sensitive fields with additional protection
- **Access Controls**: Row-level security for multi-tenant data

### Compliance Features
- **GDPR**: Right to access, portability, rectification, and erasure
- **Audit Trails**: Complete change history for compliance reporting
- **Data Retention**: Automated cleanup based on retention policies
- **Privacy by Design**: Minimal data collection with explicit consent

## Development and Deployment

### Local Development Setup
1. **PostgreSQL 15+** with pgvector extension
2. **Redis** for caching and session storage
3. **Entity Framework Core** for ORM
4. **Migration Runner** for schema management

### Production Deployment
1. **High Availability**: PostgreSQL cluster with automatic failover
2. **Monitoring**: Comprehensive metrics and alerting
3. **Backup Strategy**: Automated backups with point-in-time recovery
4. **Disaster Recovery**: Cross-region replication and failover procedures

## Getting Started

### For Developers
1. Review the [Core Entities](./core-entities.md) for the primary data model
2. Understand [Authentication & Security](./auth-security.md) for user management
3. Explore [AI Integration](./ai-integration.md) for intelligent features
4. Study [Real-time Collaboration](./realtime-session.md) for live gameplay

### For Database Administrators
1. Start with [Performance & Indexing](./indexes-performance.md) for optimization
2. Review [Migration Strategy](./migration-strategy.md) for deployment procedures
3. Understand [Audit & History Tracking](./audit-history.md) for compliance
4. Configure monitoring and alerting based on performance specifications

### For AI Implementation
Each schema includes:
- Complete table definitions with constraints
- Business rule documentation
- Sample data and relationships
- Performance optimization guidelines
- Integration patterns and best practices

## Support and Maintenance

### Monitoring Requirements
- **Query Performance**: Track slow queries and optimization opportunities
- **Index Usage**: Monitor index effectiveness and maintenance needs
- **Storage Growth**: Track table sizes and partition management
- **Connection Patterns**: Optimize connection pooling and resource usage

### Maintenance Procedures
- **Weekly**: Index maintenance and statistics updates
- **Monthly**: Partition creation and old data archival
- **Quarterly**: Performance review and optimization
- **Annually**: Full backup testing and disaster recovery drills

## Contributing

When modifying database schemas:
1. Update the relevant specification document
2. Create migration scripts with rollback procedures
3. Update indexes and performance optimizations
4. Add appropriate audit triggers
5. Test with realistic data volumes
6. Document any breaking changes

## Architecture Decisions

### Why PostgreSQL?
- **JSONB Support**: Native JSON storage with indexing for D&D data flexibility
- **Vector Extensions**: pgvector for AI embedding similarity search
- **Full-Text Search**: Native text search capabilities
- **ACID Compliance**: Strong consistency guarantees for financial data
- **Extensibility**: Rich ecosystem of extensions and tools

### Why Entity Framework Core?
- **Code-First Migrations**: Version-controlled schema management
- **LINQ Support**: Type-safe queries with compile-time checking
- **Change Tracking**: Automatic audit trail generation
- **Performance**: Optimized queries with lazy loading and caching
- **Cross-Platform**: Runs on Windows, Linux, and macOS

### Design Trade-offs
- **JSONB vs Relational**: Flexibility for D&D data vs query performance
- **Normalization vs Performance**: Some denormalization for read optimization
- **Real-time vs Consistency**: Eventual consistency for some real-time features
- **Storage vs Compute**: Pre-computed values vs on-the-fly calculations

This database design provides a solid foundation for building a scalable, AI-enhanced D&D campaign management system that can grow from hundreds to hundreds of thousands of users while maintaining performance and data integrity.
