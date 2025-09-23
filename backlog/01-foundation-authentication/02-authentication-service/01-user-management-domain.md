# User Management Domain Implementation

## Story
**As a** developer  
**I want** a complete user management domain with proper entities, roles, and business logic  
**So that** I can support user registration, authentication, and role-based authorization

## Acceptance Criteria
- [x] User entity created with proper properties and validation
- [x] Role system implemented (Player, GameMaster, Admin)
- [x] ASP.NET Core Identity integration configured
- [x] Password policies implemented and enforced
- [x] User profile management capabilities
- [x] Audit trail for user actions implemented

## Technical References
- **Technical Specification**: Section 2.1.1 User Management - REQ-UM-001 to REQ-UM-005
- **Technical Specification**: Section 6.2 Authentication & Authorization
- **Playbook Reference**: Phase 1, Week 1, Day 3-5: User Management
- **Service Specification**: Auth Service - User Domain Model

## Implementation Details

### User Entity Structure
```csharp
public class User : IdentityUser<Guid>
{
    public string FirstName { get; set; }
    public string LastName { get; set; }
    public string? AvatarUrl { get; set; }
    public UserRole Role { get; set; }
    public SubscriptionTier SubscriptionTier { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? LastLoginAt { get; set; }
    public bool IsActive { get; set; }
    
    // Navigation properties
    public ICollection<UserCampaign> Campaigns { get; set; }
    public UserProfile Profile { get; set; }
}
```

### Role System
```csharp
public enum UserRole
{
    Player = 1,
    GameMaster = 2,
    Admin = 3
}

public enum SubscriptionTier
{
    Free = 1,
    Premium = 2,
    Pro = 3
}
```

### Business Rules
1. **Email Uniqueness**: Each email can only be associated with one account
2. **Username Requirements**: 3-20 characters, alphanumeric and underscores only
3. **Password Policy**: Minimum 8 characters, must contain uppercase, lowercase, number
4. **Role Assignments**: Users can only have one primary role
5. **Account Activation**: Email verification required for new accounts

## AI Prompts for Implementation

### Primary Prompt
```
Create a complete user management domain for ASP.NET Core Identity with custom User entity extending IdentityUser<Guid>. Include user roles (Player, GameMaster, Admin), subscription tiers (Free, Premium, Pro), user profile management, and proper validation. Implement password policies, email verification, and audit trail functionality with Entity Framework Core configuration.
```

### Secondary Prompts
```
Generate ASP.NET Core Identity configuration with custom user entity, role management, password policies, and email confirmation requirements. Include proper DbContext configuration and migration setup.

Create user domain services for profile management, role assignment, subscription management, and account activation with proper business rule validation.

Generate user-related value objects and domain events for user registration, login, role changes, and subscription updates with proper error handling.
```

### Domain Services Required
1. **UserRegistrationService**: Handle user registration flow
2. **UserProfileService**: Manage user profile updates
3. **RoleManagementService**: Handle role assignments and permissions
4. **SubscriptionService**: Manage subscription tiers and limits

### Domain Events
- `UserRegisteredEvent`
- `UserEmailVerifiedEvent`
- `UserRoleChangedEvent`
- `UserSubscriptionChangedEvent`
- `UserProfileUpdatedEvent`

## Validation Rules

### Registration Validation
- Email format validation
- Password strength requirements
- Username availability check
- Terms of service acceptance

### Profile Validation
- Name length limits (2-50 characters)
- Avatar URL format validation
- Profile completeness checks

## Definition of Done
- [x] User entity properly inherits from IdentityUser<Guid>
- [x] All user roles and subscription tiers are defined
- [x] Password policies are enforced
- [x] Email validation is implemented
- [x] User profile management works correctly
- [x] Domain events are properly published
- [x] All business rules are validated
- [ ] Unit tests cover all domain logic (deferred to testing story)

## ✅ STORY COMPLETED
**Completion Date**: September 23, 2025  
**Branch**: `epic-1/feature-2/story-1-user-management-domain`  
**Status**: Ready for merge to `develop`

### Implementation Summary
- **✅ Enhanced User Entity**: Moved to Shared.Domain, extends IdentityUser<Guid> with D&D-specific properties
- **✅ Type-Safe Enums**: UserRole, SubscriptionTier, CampaignRole, ExperienceLevel for data integrity
- **✅ ASP.NET Core Identity**: Full integration with custom AuthDbContext and Identity configuration
- **✅ Advanced Password Policies**: Custom validator with business rules, common password detection, sequential character prevention
- **✅ User Management Service**: Complete CRUD operations with domain event publishing
- **✅ Domain Events**: UserRegistered, UserEmailVerified, UserRoleChanged, UserSubscriptionChanged
- **✅ Entity Relationships**: Proper EF Core configuration for User, UserProfile, Campaign, Character relationships
- **✅ Build Verification**: All projects compile successfully with no errors

### Architectural Decisions
- **Single Source of Truth**: User entity centralized in Shared.Domain instead of service-specific
- **Identity Integration**: Leverages ASP.NET Core Identity for authentication while maintaining domain model
- **Event-Driven**: Domain events enable cross-service communication and audit trails
- **Type Safety**: Enums prevent invalid data states throughout the system

## Dependencies
- **Depends on**: 01-setup-dotnet-solution.md, 02-setup-database-infrastructure.md
- **Blocks**: Authentication endpoints and authorization implementation

## Estimated Effort
**6 hours** - Domain modeling and business logic implementation
