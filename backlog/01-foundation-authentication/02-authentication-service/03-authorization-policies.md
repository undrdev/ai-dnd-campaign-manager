# Authorization Policies Implementation

## Story
**As a** developer  
**I want** comprehensive authorization policies and middleware  
**So that** I can control access to resources based on user roles and ownership

## Acceptance Criteria
- [ ] Role-based authorization policies implemented
- [ ] Resource-based authorization for user-owned content
- [ ] Policy definitions for all major features
- [ ] Authorization middleware configured
- [ ] Claims-based permissions system
- [ ] Subscription-tier based feature access
- [ ] API endpoint protection implemented

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
- [ ] All role-based policies are properly configured
- [ ] Resource-based authorization works for owned content
- [ ] Subscription-tier access control is implemented
- [ ] Authorization middleware validates tokens correctly
- [ ] Claims are properly extracted and validated
- [ ] Authorization failures return appropriate HTTP status codes
- [ ] Policy enforcement is consistent across all endpoints
- [ ] Unit tests cover all authorization scenarios

## Dependencies
- **Depends on**: 01-user-management-domain.md, 02-authentication-endpoints.md
- **Blocks**: All protected API endpoints in other services

## Estimated Effort
**6 hours** - Authorization policy implementation and testing
