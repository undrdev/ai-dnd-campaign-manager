# Setup Database Infrastructure

## Story
**As a** developer  
**I want** a properly configured database infrastructure with PostgreSQL and Redis  
**So that** I can store application data reliably and implement caching/session management

## Acceptance Criteria
- [ ] PostgreSQL database configured with proper connection pooling
- [ ] Entity Framework Core configured with migrations
- [ ] Redis configured for caching and session storage
- [ ] Database migration strategy implemented
- [ ] Connection string management configured
- [ ] Health checks implemented for both databases

## Technical References
- **Technical Specification**: Section 4.1 Database Architecture - PostgreSQL Primary Database
- **Technical Specification**: Section 4.2 Caching Strategy - Redis Implementation
- **Playbook Reference**: Phase 1, Week 1, Day 1-2: Database Setup
- **Service Specifications**: All services require database connectivity

## Implementation Details

### PostgreSQL Configuration
- **Version**: PostgreSQL 16+
- **Connection Pooling**: Npgsql with connection pooling
- **Schema Management**: Entity Framework Core migrations
- **Audit Trail**: Created/Modified timestamps on all entities

### Redis Configuration
- **Version**: Redis 7+
- **Use Cases**: Session storage, caching, real-time data
- **Configuration**: Distributed cache implementation
- **Persistence**: RDB + AOF for data durability

### Entity Framework Configuration
```csharp
// Example configuration structure
public class ApplicationDbContext : DbContext
{
    // DbSets for each aggregate root
    // Audit trail implementation
    // Soft delete configuration
}
```

## AI Prompts for Implementation

### Primary Prompt
```
Create Entity Framework Core configuration for PostgreSQL with proper connection pooling, migration setup, and audit trail functionality. Include DbContext configuration, connection string management, and health checks. Also configure Redis for distributed caching and session storage with proper connection management.
```

### Secondary Prompts
```
Generate Entity Framework Core migration strategy with proper naming conventions, rollback procedures, and environment-specific configurations.

Create Redis configuration for distributed caching including serialization, expiration policies, and connection resilience with health checks.

Generate database health check endpoints that validate both PostgreSQL and Redis connectivity with proper error handling and logging.
```

## Environment Configuration

### Development Environment
```yaml
# docker-compose.yml excerpt
postgres:
  image: postgres:16
  environment:
    POSTGRES_DB: dndai_dev
    POSTGRES_USER: developer
    POSTGRES_PASSWORD: dev_password
  ports:
    - "5432:5432"

redis:
  image: redis:7-alpine
  ports:
    - "6379:6379"
```

### Connection Strings
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Database=dndai_dev;Username=developer;Password=dev_password;Pooling=true;MaxPoolSize=100;",
    "Redis": "localhost:6379"
  }
}
```

## Definition of Done
- [ ] PostgreSQL database starts successfully
- [ ] Redis cache starts successfully  
- [ ] Entity Framework migrations run without errors
- [ ] Connection pooling is properly configured
- [ ] Health checks return healthy status
- [ ] Audit trail captures created/modified timestamps
- [ ] All database operations are logged appropriately

## Dependencies
- **Depends on**: 01-setup-dotnet-solution.md
- **Blocks**: All authentication and service implementation stories

## Estimated Effort
**3 hours** - Database setup and configuration
