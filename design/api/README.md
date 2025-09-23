# D&D AI Campaign Management System - API Specifications

## Overview
This directory contains comprehensive API specifications for the D&D AI Campaign Management System. Each specification is designed to be AI-friendly with detailed schemas, validation rules, and implementation guidance.

## API Specifications

### Core APIs

#### [Authentication API](./auth-api.md)
- User registration, login, logout, and profile management
- JWT token management with refresh capabilities
- Multi-factor authentication and social login support
- Rate limiting and security considerations

#### [Campaign Management API](./campaign-api.md)
- Full CRUD operations for D&D campaigns
- Player invitation and collaboration features
- World state tracking and session management
- Campaign templates and sharing capabilities

#### [Character Management API](./character-api.md)
- D&D 5e compliant character creation and progression
- AI-powered background generation
- Equipment, spell, and skill management
- Level-up validation and ability score improvements

#### [NPC Management API](./npc-api.md)
- Comprehensive NPC creation with AI assistance
- Personality tracking and relationship management
- Dialogue history and interaction recording
- Dynamic NPC state updates based on campaign events

#### [AI Gateway API](./ai-gateway-api.md)
- Content generation for NPCs, locations, quests, and lore
- Context-aware dialogue generation
- Campaign knowledge search and management
- Usage tracking and subscription tier enforcement

#### [Real-time Collaboration API](./realtime-api.md)
- SignalR WebSocket connections for live sessions
- Combat initiative and turn management
- Real-time dice rolling and chat
- Map updates and visual synchronization
- Conflict resolution for concurrent edits

### Supporting Documentation

#### [Common Models and Error Handling](./common-models.md)
- Standardized response formats and error structures
- Shared data models used across all APIs
- Validation patterns and business rule definitions
- Pagination, search, and filtering models

## API Design Principles

### AI-Friendly Design
- **Complete Schemas**: Every endpoint includes full request/response schemas with exact field types
- **Validation Rules**: Detailed validation constraints that AI can understand and implement
- **Business Logic**: Clear documentation of business rules and edge cases
- **Error Handling**: Comprehensive error codes with specific resolution guidance

### D&D 5e Integration
- **Rule Compliance**: All character and gameplay mechanics follow official D&D 5e rules
- **Validation Endpoints**: Dedicated endpoints for validating D&D rule compliance
- **Content Generation**: AI-powered content that maintains D&D setting consistency

### RESTful Standards
- **HTTP Methods**: Proper use of GET, POST, PUT, DELETE for resource operations
- **Status Codes**: Appropriate HTTP status codes for all response types
- **Resource Naming**: Consistent and intuitive resource naming conventions
- **Versioning**: Clear API versioning strategy with deprecation handling

### Performance and Scalability
- **Pagination**: All list endpoints support pagination with configurable limits
- **Caching**: Cache headers and strategies for optimal performance
- **Rate Limiting**: Tier-based rate limiting to prevent abuse
- **Bulk Operations**: Efficient bulk update capabilities for GM workflows

## Authentication and Authorization

### JWT Token Structure
All APIs use JWT tokens with the following claims:
- `sub`: User ID
- `email`: User email address
- `role`: User role (Player, GameMaster, Admin)
- `subscription_tier`: Current subscription level
- `permissions`: Array of specific permissions

### Permission Model
- **Campaign-level**: Permissions scoped to specific campaigns
- **Resource-level**: Fine-grained permissions for characters, NPCs, etc.
- **Subscription-based**: Features gated by subscription tier

## Rate Limiting

### Tier-based Limits
| Tier | API Calls/Hour | AI Requests/Hour | Concurrent Connections |
|------|----------------|------------------|----------------------|
| Free | 1,000 | 10 | 2 |
| DungeonArchitect | 5,000 | 50 | 5 |
| CampaignWeaver | 15,000 | 200 | 10 |
| GuildMaster | 50,000 | 1,000 | 25 |

## Error Handling

### Standard Error Format
All APIs use a consistent error response format with:
- Standardized error codes
- Human-readable error messages
- Detailed validation error information
- Correlation IDs for support tracking
- Links to relevant documentation

### Common Error Scenarios
- Authentication and authorization failures
- Validation errors with field-specific details
- Rate limiting and quota exceeded
- Resource conflicts and business rule violations
- External service failures (AI providers, payment processing)

## Implementation Guidelines

### Database Design
- **Entity Framework**: All APIs designed for Entity Framework Core
- **Audit Trails**: Built-in change tracking for all entities
- **Soft Deletes**: Logical deletion with recovery capabilities
- **Optimistic Concurrency**: Conflict detection for concurrent edits

### Caching Strategy
- **Redis**: Distributed caching for session state and frequently accessed data
- **TTL Policies**: Appropriate cache expiration based on data volatility
- **Cache Invalidation**: Event-driven cache invalidation on data changes

### Monitoring and Observability
- **Structured Logging**: Consistent logging format across all services
- **Metrics Collection**: Performance and business metrics tracking
- **Distributed Tracing**: Request correlation across microservices
- **Health Checks**: Comprehensive health monitoring for all dependencies

## Development Workflow

### API-First Development
1. **Specification First**: Define API contracts before implementation
2. **Mock Servers**: Generate mock servers from specifications for parallel development
3. **Contract Testing**: Validate implementations against specifications
4. **Documentation Generation**: Auto-generate documentation from specifications

### Testing Strategy
- **Unit Tests**: Comprehensive unit test coverage for all business logic
- **Integration Tests**: End-to-end API testing with real dependencies
- **Contract Tests**: Validate API contracts between services
- **Performance Tests**: Load testing for scalability validation

## Getting Started

### For Developers
1. Review the [Common Models](./common-models.md) for shared patterns
2. Start with [Authentication API](./auth-api.md) for user management
3. Implement [Campaign API](./campaign-api.md) for core functionality
4. Add [Character API](./character-api.md) for D&D mechanics
5. Integrate [AI Gateway API](./ai-gateway-api.md) for intelligent features

### For AI Implementation
Each specification includes:
- Complete request/response examples
- Validation rules and constraints
- Business logic documentation
- Error handling patterns
- Implementation notes with database requirements

### For Testing
- Use the provided schemas for automated testing
- Implement the standard error handling patterns
- Follow the rate limiting specifications
- Test with the documented edge cases and error scenarios

## Support and Documentation

### Additional Resources
- **OpenAPI/Swagger**: Machine-readable API specifications available
- **Postman Collections**: Pre-built API collections for testing
- **SDK Documentation**: Client library documentation and examples
- **Migration Guides**: Version upgrade and migration documentation

### Getting Help
- **API Documentation**: Comprehensive online documentation
- **Developer Support**: Technical support for API integration
- **Community Forum**: Developer community for questions and discussions
- **GitHub Issues**: Bug reports and feature requests
