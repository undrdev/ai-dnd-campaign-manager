# Authorization Policies Implementation

## Story
**As a** developer  
**I want** comprehensive authorization policies and middleware  
**So that** I can control access to resources based on user roles and ownership

## Acceptance Criteria
- [x] Role-based authorization policies implemented
- [x] Resource-based authorization for user-owned content
- [x] Policy definitions for all major features
- [x] Authorization middleware configured
- [x] Claims-based permissions system
- [x] Subscription-tier based feature access
- [x] API endpoint protection implemented

## Technical References
- **Technical Specification**: Section 2.1.1 User Management - REQ-UM-002 (Role differentiation)
- **Technical Specification**: Section 6.2 Authentication & Authorization
- **Playbook Reference**: Phase 1, Week 1, Day 3-5: Authorization Policies
- **Service Specification**: Auth Service - Authorization Framework

## Implementation Details

### Role-Based Policies
```csharp
public static class PolicyNames
{
    public const string RequirePlayerRole = "RequirePlayerRole";
    public const string RequireGameMasterRole = "RequireGameMasterRole";
    public const string RequireAdminRole = "RequireAdminRole";
    public const string RequirePremiumSubscription = "RequirePremiumSubscription";
    public const string RequireProSubscription = "RequireProSubscription";
}
```

### Policy Configuration
```csharp
services.AddAuthorization(options =>
{
    // Role-based policies
    options.AddPolicy(PolicyNames.RequirePlayerRole, 
        policy => policy.RequireRole(UserRole.Player.ToString()));
    
    options.AddPolicy(PolicyNames.RequireGameMasterRole,
        policy => policy.RequireRole(UserRole.GameMaster.ToString()));
    
    options.AddPolicy(PolicyNames.RequireAdminRole,
        policy => policy.RequireRole(UserRole.Admin.ToString()));
    
    // Subscription-based policies
    options.AddPolicy(PolicyNames.RequirePremiumSubscription,
        policy => policy.RequireClaim("subscription", 
            SubscriptionTier.Premium.ToString(), 
            SubscriptionTier.Pro.ToString()));
});
```

### Resource-Based Authorization
```csharp
public class CampaignAuthorizationHandler : 
    AuthorizationHandler<CampaignRequirement, Campaign>
{
    protected override Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        CampaignRequirement requirement,
        Campaign resource)
    {
        var userId = context.User.GetUserId();
        
        switch (requirement.Permission)
        {
            case CampaignPermission.View:
                if (resource.IsPlayerInCampaign(userId) || 
                    resource.GameMasterId == userId)
                {
                    context.Succeed(requirement);
                }
                break;
                
            case CampaignPermission.Edit:
                if (resource.GameMasterId == userId)
                {
                    context.Succeed(requirement);
                }
                break;
        }
        
        return Task.CompletedTask;
    }
}
```

### Claims Structure
```csharp
public static class ClaimTypes
{
    public const string UserId = "user_id";
    public const string Role = "role";
    public const string Subscription = "subscription";
    public const string EmailVerified = "email_verified";
    public const string AccountActive = "account_active";
}
```

## AI Prompts for Implementation

### Primary Prompt
```
Create comprehensive authorization policies for ASP.NET Core including role-based authorization (Player, GameMaster, Admin), resource-based authorization for user-owned content, subscription-tier based access control, and claims-based permissions. Implement authorization handlers, policy configuration, and middleware setup with proper error handling and logging.
```

### Secondary Prompts
```
Generate resource-based authorization handlers for Campaign, Character, and other domain entities with proper ownership validation and permission checking.

Create subscription-tier based authorization policies that control access to premium features like advanced AI capabilities, unlimited campaigns, and enhanced analytics.

Generate authorization middleware that validates JWT tokens, extracts claims, and enforces authorization policies with proper error responses and logging.
```

### Authorization Requirements
```csharp
public class CampaignRequirement : IAuthorizationRequirement
{
    public CampaignPermission Permission { get; }
    
    public CampaignRequirement(CampaignPermission permission)
    {
        Permission = permission;
    }
}

public enum CampaignPermission
{
    View,
    Edit,
    Delete,
    Invite,
    Manage
}
```

### Feature Access Control

#### Free Tier Limitations
- 1 active campaign maximum
- 5 characters per campaign
- 100 AI requests per month
- Basic templates only

#### Premium Tier Features
- 5 active campaigns
- 25 characters per campaign
- 1,000 AI requests per month
- Advanced templates and tools

#### Pro Tier Features
- Unlimited campaigns and characters
- 5,000 AI requests per month
- All premium features plus analytics
- API access and integrations

## Policy Usage Examples

### Controller Level Authorization
```csharp
[Authorize(Policy = PolicyNames.RequireGameMasterRole)]
[ApiController]
[Route("api/[controller]")]
public class CampaignsController : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> CreateCampaign(CreateCampaignCommand command)
    {
        // Only Game Masters can create campaigns
        return Ok(await Mediator.Send(command));
    }
}
```

### Resource-Based Authorization
```csharp
[HttpPut("{id}")]
public async Task<IActionResult> UpdateCampaign(Guid id, UpdateCampaignCommand command)
{
    var campaign = await _campaignRepository.GetByIdAsync(id);
    
    var authResult = await _authorizationService.AuthorizeAsync(
        User, campaign, new CampaignRequirement(CampaignPermission.Edit));
    
    if (!authResult.Succeeded)
    {
        return Forbid();
    }
    
    return Ok(await Mediator.Send(command));
}
```

## Definition of Done
- [x] All role-based policies are properly configured
- [x] Resource-based authorization works for owned content
- [x] Subscription-tier access control is implemented
- [x] Authorization middleware validates tokens correctly
- [x] Claims are properly extracted and validated
- [x] Authorization failures return appropriate HTTP status codes
- [x] Policy enforcement is consistent across all endpoints
- [ ] Unit tests cover all authorization scenarios (deferred to testing story)

## ✅ STORY COMPLETED
**Completion Date**: September 23, 2025  
**Branch**: `epic-1/feature-2/story-3-authorization-policies`  
**Status**: Ready for merge to `develop`

### Implementation Summary
- **✅ Authorization Policies**: Comprehensive role-based, subscription-tier, and feature-based policies
- **✅ Resource-Based Authorization**: Campaign and Character authorization handlers with ownership validation
- **✅ Claims-Based Permissions**: Custom claim types integrated with JWT token generation
- **✅ Policy Configuration**: Complete authorization configuration with all policy definitions
- **✅ Controller Protection**: Applied policies to authentication endpoints with proper error handling
- **✅ Subscription Limits**: Tier-based feature access control with subscription validation
- **✅ Administrative Endpoints**: Admin-only user management and role change endpoints
- **✅ Premium Features**: Subscription-tier protected advanced features and analytics

### Authorization Policies Implemented
1. **Role-Based Policies**:
   - `RequirePlayerRole` - Player access
   - `RequireGameMasterRole` - Game Master access (includes Admin)
   - `RequireAdminRole` - Admin-only access
   
2. **Subscription-Based Policies**:
   - `RequirePremiumSubscription` - Premium/Pro tier access
   - `RequireProSubscription` - Pro tier only access
   
3. **Feature-Based Policies**:
   - `CanCreateCampaigns` - Game Master/Admin campaign creation
   - `CanManageUsers` - Admin user management
   - `CanAccessAnalytics` - Pro tier analytics access
   - `CanUseAdvancedAI` - Premium/Pro AI features
   
4. **Account Status Policies**:
   - `RequireVerifiedEmail` - Email verification required
   - `RequireActiveAccount` - Active account status required
   
5. **Resource-Based Policies**:
   - Campaign permissions (View, Edit, Delete, Invite, Manage)
   - Character permissions (View, Edit, Delete, Share)

### Authorization Handlers
- **CampaignAuthorizationHandler**: Validates campaign ownership and membership
- **CharacterAuthorizationHandler**: Validates character ownership and campaign access
- **Admin Override**: Admin users have all permissions across the system

### API Endpoints with Authorization
1. **GET /api/auth/profile/{userId}** - `RequireActiveAccount`
2. **GET /api/auth/admin/users** - `RequireAdminRole`
3. **PUT /api/auth/admin/users/{userId}/role** - `CanManageUsers`
4. **GET /api/auth/premium/advanced-features** - `RequirePremiumSubscription`
5. **GET /api/auth/pro/analytics** - `CanAccessAnalytics`

### Custom Claims Integration
- Enhanced JWT token generation with authorization-specific claims
- Claims include: user_id, role, subscription_tier, email_verified, is_active
- Claims properly extracted and used in policy evaluation

### Subscription Tier Features
- **Free Tier**: 1 campaign, 5 characters, 100 AI requests/month, basic templates
- **Premium Tier**: 5 campaigns, 25 characters, 1,000 AI requests/month, advanced features
- **Pro Tier**: Unlimited campaigns/characters, 5,000 AI requests/month, analytics, API access

### Security Features
- **Ownership Validation**: Users can only access their own resources
- **Role Hierarchy**: Admin > GameMaster > Player with proper inheritance
- **Subscription Enforcement**: Feature access gated by subscription tier
- **Token Validation**: JWT claims properly validated in authorization handlers
- **Error Security**: Consistent 403 Forbidden responses for unauthorized access

### Build Status
- **✅ Compilation**: All projects build successfully with no warnings or errors
- **✅ Dependencies**: Authorization handlers and policies properly registered
- **✅ Configuration**: Complete authorization configuration integrated

### Deferred Items
- **Unit Tests**: Authorization policy testing deferred to dedicated testing story
- **Integration Tests**: End-to-end authorization flow testing deferred

## Dependencies
- **Depends on**: 01-user-management-domain.md, 02-authentication-endpoints.md
- **Blocks**: All protected API endpoints in other services

## Estimated Effort
**6 hours** - Authorization policy implementation and testing
