# Project Structure Standards

## Overview
This document defines the standardized project structure for the D&D AI Campaign Management System, including solution organization, folder conventions, and naming standards.

---

## Solution Architecture

### High-Level Structure
```
DnDAICampaignManager/
├── src/
│   ├── Services/              # Microservices
│   ├── Shared/               # Shared libraries
│   ├── Gateway/              # API Gateway
│   └── Client/               # Flutter application
├── tests/
│   ├── UnitTests/            # Unit test projects
│   ├── IntegrationTests/     # Integration test projects
│   └── EndToEndTests/        # E2E test projects
├── infrastructure/
│   ├── docker/               # Docker configurations
│   ├── kubernetes/           # K8s manifests
│   └── terraform/            # Infrastructure as code
├── docs/
│   ├── api/                  # API documentation
│   ├── architecture/         # Architecture diagrams
│   └── deployment/           # Deployment guides
├── scripts/
│   ├── build/                # Build scripts
│   ├── deployment/           # Deployment scripts
│   └── database/             # Database migration scripts
└── tools/
    ├── codegen/              # Code generation tools
    └── utilities/            # Development utilities
```

---

## Microservices Structure

### Service Organization
Each microservice follows this structure:

```
src/Services/{ServiceName}/
├── {ServiceName}.API/
│   ├── Controllers/
│   ├── Middleware/
│   ├── Filters/
│   ├── Configuration/
│   ├── Program.cs
│   └── appsettings.{env}.json
├── {ServiceName}.Core/
│   ├── Entities/
│   ├── Interfaces/
│   ├── Services/
│   ├── Exceptions/
│   └── Models/
├── {ServiceName}.Infrastructure/
│   ├── Data/
│   │   ├── Contexts/
│   │   ├── Repositories/
│   │   ├── Configurations/
│   │   └── Migrations/
│   ├── ExternalServices/
│   ├── Messaging/
│   └── Caching/
└── {ServiceName}.Contracts/
    ├── Requests/
    ├── Responses/
    ├── Events/
    └── DTOs/
```

### Specific Services
```
src/Services/
├── CampaignService/          # Campaign management
├── CharacterService/         # Character sheets & progression
├── NPCService/               # NPC management
├── AIGateway/                # AI orchestration service
├── UserService/              # User management & auth
├── BillingService/           # Subscription & usage tracking
└── NotificationService/      # Real-time notifications
```

---

## Shared Libraries Structure

### Shared Components
```
src/Shared/
├── Common/
│   ├── Common.Core/
│   │   ├── Interfaces/
│   │   ├── Models/
│   │   ├── Exceptions/
│   │   ├── Extensions/
│   │   └── Utilities/
│   ├── Common.Infrastructure/
│   │   ├── Data/
│   │   ├── Messaging/
│   │   ├── Caching/
│   │   ├── Logging/
│   │   └── HealthChecks/
│   └── Common.Contracts/
│       ├── Events/
│       ├── Commands/
│       └── Queries/
├── DnD/
│   ├── DnD.Rules/            # D&D 5e rules engine
│   ├── DnD.Data/             # D&D reference data
│   └── DnD.Validation/       # D&D rule validation
└── Security/
    ├── Authentication/
    ├── Authorization/
    └── Encryption/
```

---

## API Gateway Structure

```
src/Gateway/
├── APIGateway/
│   ├── Configuration/
│   │   ├── ocelot.json
│   │   ├── ocelot.Development.json
│   │   └── ocelot.Production.json
│   ├── Middleware/
│   │   ├── AuthenticationMiddleware.cs
│   │   ├── RateLimitingMiddleware.cs
│   │   └── LoggingMiddleware.cs
│   ├── Filters/
│   ├── Program.cs
│   └── appsettings.json
└── LoadBalancer/
    └── nginx.conf
```

---

## Flutter Client Structure

```
src/Client/
├── dnd_campaign_manager/
│   ├── lib/
│   │   ├── main.dart
│   │   ├── app/
│   │   │   ├── app.dart
│   │   │   ├── routes/
│   │   │   └── themes/
│   │   ├── core/
│   │   │   ├── constants/
│   │   │   ├── errors/
│   │   │   ├── network/
│   │   │   ├── platform/
│   │   │   └── utils/
│   │   ├── features/
│   │   │   ├── authentication/
│   │   │   ├── campaigns/
│   │   │   ├── characters/
│   │   │   ├── npcs/
│   │   │   └── sessions/
│   │   ├── shared/
│   │   │   ├── data/
│   │   │   ├── domain/
│   │   │   ├── presentation/
│   │   │   └── widgets/
│   │   └── injection_container.dart
│   ├── test/
│   ├── integration_test/
│   ├── assets/
│   │   ├── images/
│   │   ├── fonts/
│   │   └── data/
│   ├── android/
│   ├── ios/
│   ├── web/
│   ├── windows/
│   ├── macos/
│   ├── linux/
│   ├── pubspec.yaml
│   └── README.md
```

### Flutter Feature Structure
Each feature follows clean architecture:

```
features/{feature_name}/
├── data/
│   ├── datasources/
│   │   ├── {feature}_local_data_source.dart
│   │   └── {feature}_remote_data_source.dart
│   ├── models/
│   ├── repositories/
│   └── {feature}_repository_impl.dart
├── domain/
│   ├── entities/
│   ├── repositories/
│   └── usecases/
└── presentation/
    ├── bloc/ or providers/
    ├── pages/
    └── widgets/
```

---

## Testing Structure

### Test Organization
```
tests/
├── UnitTests/
│   ├── Services/
│   │   ├── CampaignService.Tests/
│   │   ├── CharacterService.Tests/
│   │   └── AIGateway.Tests/
│   └── Shared/
│       ├── Common.Tests/
│       └── DnD.Tests/
├── IntegrationTests/
│   ├── API.IntegrationTests/
│   ├── Database.IntegrationTests/
│   └── ExternalServices.IntegrationTests/
└── EndToEndTests/
    ├── WebAPI.E2ETests/
    ├── Mobile.E2ETests/
    └── Performance.Tests/
```

---

## Naming Conventions

### Project Naming
- **Format**: `{Company}.{Product}.{Service}.{Layer}`
- **Example**: `DnDAI.CampaignManager.CampaignService.API`
- **Test Projects**: `{ProjectName}.Tests`

### Namespace Conventions
```csharp
// Service projects
namespace DnDAI.CampaignManager.CampaignService.Core.Entities
namespace DnDAI.CampaignManager.CampaignService.API.Controllers

// Shared projects
namespace DnDAI.CampaignManager.Common.Core.Interfaces
namespace DnDAI.CampaignManager.DnD.Rules.Validation

// Test projects
namespace DnDAI.CampaignManager.CampaignService.Tests.Services
```

### File and Folder Conventions
- **PascalCase**: Classes, interfaces, enums, methods, properties
- **camelCase**: Local variables, method parameters, private fields
- **kebab-case**: Configuration files, Docker files, scripts
- **SCREAMING_SNAKE_CASE**: Constants, environment variables

### Class Naming Patterns
- **Interfaces**: `IServiceName`, `IRepositoryName`
- **Implementations**: `ServiceName`, `RepositoryName`
- **Controllers**: `{Entity}Controller`
- **DTOs**: `{Entity}Dto`, `Create{Entity}Request`, `{Entity}Response`
- **Entities**: `{EntityName}` (singular)
- **Exceptions**: `{Scenario}Exception`

### Database Conventions
- **Tables**: `snake_case`, plural (`campaigns`, `character_sheets`)
- **Columns**: `snake_case`, singular (`campaign_id`, `created_at`)
- **Foreign Keys**: `{referenced_table}_id`
- **Indexes**: `idx_{table}_{columns}`
- **Constraints**: `ck_{table}_{column}`, `uq_{table}_{columns}`

---

## Docker Structure

### Container Organization
```
infrastructure/docker/
├── services/
│   ├── campaign-service/
│   │   ├── Dockerfile
│   │   └── .dockerignore
│   ├── character-service/
│   │   ├── Dockerfile
│   │   └── .dockerignore
│   └── api-gateway/
│       ├── Dockerfile
│       └── .dockerignore
├── databases/
│   ├── postgresql/
│   │   ├── Dockerfile
│   │   └── init-scripts/
│   └── redis/
│       └── redis.conf
├── docker-compose.yml
├── docker-compose.override.yml
└── docker-compose.prod.yml
```

---

## Configuration Files

### Location Standards
- **Development**: `appsettings.Development.json`
- **Testing**: `appsettings.Testing.json`
- **Staging**: `appsettings.Staging.json`
- **Production**: `appsettings.Production.json`
- **User Secrets**: For development API keys and sensitive data

### Environment Variables
```bash
# Format: {SERVICE}_{COMPONENT}_{SETTING}
CAMPAIGNSERVICE_DATABASE_CONNECTIONSTRING
AIGATEWAY_OPENAI_APIKEY
REDIS_CACHE_CONNECTIONSTRING
```

---

## Build Artifacts

### Output Structure
```
artifacts/
├── services/
│   ├── campaign-service/
│   ├── character-service/
│   └── ai-gateway/
├── gateway/
│   └── api-gateway/
├── client/
│   ├── android/
│   ├── ios/
│   └── web/
└── infrastructure/
    ├── docker-images/
    └── k8s-manifests/
```

---

## Version Control Structure

### Git Repository Organization
```
.git/
.gitignore
.gitattributes
README.md
CONTRIBUTING.md
LICENSE
CHANGELOG.md
```

### Branch Naming
- **Feature**: `feature/{ticket-id}-{short-description}`
- **Bugfix**: `bugfix/{ticket-id}-{short-description}`
- **Release**: `release/{version-number}`
- **Hotfix**: `hotfix/{ticket-id}-{short-description}`

---

## Documentation Standards

### API Documentation
- **Location**: `docs/api/{service-name}/`
- **Format**: OpenAPI 3.0 (Swagger)
- **Generation**: Automated from controller attributes

### Architecture Documentation
- **Location**: `docs/architecture/`
- **Diagrams**: PlantUML or Mermaid format
- **ADRs**: Architecture Decision Records

### Code Documentation
- **XML Comments**: Required for all public APIs
- **README files**: Required for each service and major component
- **Inline Comments**: For complex business logic only

---

## Compliance and Standards

### Code Quality
- **EditorConfig**: Consistent formatting across IDEs
- **StyleCop**: C# style rule enforcement
- **SonarQube**: Code quality analysis
- **Security Scanning**: Automated vulnerability detection

### Performance Standards
- **Response Time**: API endpoints < 200ms (95th percentile)
- **Memory Usage**: < 512MB per service container
- **CPU Usage**: < 70% average per service
- **Database**: Query execution < 100ms average

This structure provides a solid foundation for the entire development team to work consistently and efficiently across the D&D AI Campaign Management System.