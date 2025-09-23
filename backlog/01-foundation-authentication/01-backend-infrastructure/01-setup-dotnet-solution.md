# Setup .NET Solution Structure

## Story
**As a** developer  
**I want** a properly structured .NET 8 microservices solution  
**So that** I can build scalable, maintainable services with shared functionality

## Acceptance Criteria
- [ ] .NET 8 solution created with proper folder structure
- [ ] Shared libraries created (Domain, Infrastructure, Application)
- [ ] Common NuGet packages configured (MediatR, FluentValidation, Serilog, EF Core)
- [ ] Solution builds successfully without errors
- [ ] Common middleware and error handling configured
- [ ] Logging infrastructure properly configured

## Technical References
- **Technical Specification**: Section 3.1 High-Level Architecture - Microservices Layer
- **Playbook Reference**: Phase 1, Week 1, Day 1-2: Project Setup & Shared Infrastructure
- **Architecture Pattern**: Domain-Driven Design with CQRS/MediatR

## Implementation Details

### Solution Structure
```
backend/
├── src/
│   ├── Services/
│   │   ├── Auth/
│   │   ├── Campaign/
│   │   ├── Character/
│   │   ├── AIGateway/
│   │   └── Notification/
│   ├── ApiGateway/
│   └── Shared/
│       ├── Domain/
│       ├── Infrastructure/
│       └── Application/
├── tests/
└── docker/
```

### Shared Libraries
1. **Shared.Domain**
   - Common domain entities and value objects
   - Domain events and interfaces
   - Common exceptions

2. **Shared.Infrastructure**
   - Database context configuration
   - External service integrations
   - Common repositories

3. **Shared.Application**
   - CQRS command/query handlers
   - Common behaviors (validation, logging)
   - Application services interfaces

### Required NuGet Packages
- MediatR (>= 12.0.0) - CQRS pattern implementation
- FluentValidation (>= 11.0.0) - Input validation
- Serilog (>= 3.0.0) - Structured logging
- Microsoft.EntityFrameworkCore (>= 8.0.0) - ORM
- Microsoft.AspNetCore.Identity (>= 8.0.0) - Authentication

## AI Prompts for Implementation

### Primary Prompt
```
Create a .NET 8 solution structure for a microservices architecture with the following services: Auth, Campaign, Character, AIGateway, and Notification. Include shared libraries for common functionality including Domain, Infrastructure, and Application layers. Configure common NuGet packages: MediatR, FluentValidation, Serilog, Entity Framework Core. Include proper folder structure, project references, and common middleware setup.
```

### Secondary Prompts
```
Generate shared domain entities and value objects for a D&D campaign management system including User, Campaign, Character, and common audit fields.

Create common infrastructure configuration for Entity Framework Core with PostgreSQL, including connection string management, migration setup, and audit trail functionality.

Generate MediatR pipeline behaviors for validation, logging, and error handling that can be shared across all microservices.
```

## Definition of Done
- [ ] Solution compiles without warnings or errors
- [ ] All shared libraries have proper project references
- [ ] Common middleware is configured and tested
- [ ] Logging writes to console and structured format
- [ ] Code follows established naming conventions
- [ ] Documentation updated with solution structure

## Dependencies
- None (This is the foundation story)

## Estimated Effort
**2 hours** - Initial setup and configuration
