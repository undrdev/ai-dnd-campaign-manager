using DndAI.Services.Auth.Application.Authorization;
using DndAI.Services.Auth.Application.Authorization.Handlers;
using DndAI.Services.Auth.Application.Authorization.Requirements;
using DndAI.Shared.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.DependencyInjection;

namespace DndAI.Services.Auth.Infrastructure.Configuration;

/// <summary>
/// Configuration for authorization policies and handlers
/// </summary>
public static class AuthorizationConfiguration
{
    public static IServiceCollection AddAuthorizationPolicies(this IServiceCollection services)
    {
        services.AddAuthorization(options =>
        {
            // Role-based policies
            options.AddPolicy(PolicyNames.RequirePlayerRole, policy =>
                policy.RequireClaim(CustomClaimTypes.Role, UserRole.Player.ToString()));

            options.AddPolicy(PolicyNames.RequireGameMasterRole, policy =>
                policy.RequireClaim(CustomClaimTypes.Role, 
                    UserRole.GameMaster.ToString(), 
                    UserRole.Admin.ToString()));

            options.AddPolicy(PolicyNames.RequireAdminRole, policy =>
                policy.RequireClaim(CustomClaimTypes.Role, UserRole.Admin.ToString()));

            // Subscription-tier based policies
            options.AddPolicy(PolicyNames.RequirePremiumSubscription, policy =>
                policy.RequireClaim(CustomClaimTypes.SubscriptionTier, 
                    SubscriptionTier.Premium.ToString(), 
                    SubscriptionTier.Pro.ToString()));

            options.AddPolicy(PolicyNames.RequireProSubscription, policy =>
                policy.RequireClaim(CustomClaimTypes.SubscriptionTier, SubscriptionTier.Pro.ToString()));

            // Feature-based policies
            options.AddPolicy(PolicyNames.CanCreateCampaigns, policy =>
                policy.RequireAssertion(context =>
                {
                    var role = context.User.FindFirst(CustomClaimTypes.Role)?.Value;
                    return role == UserRole.GameMaster.ToString() || role == UserRole.Admin.ToString();
                }));

            options.AddPolicy(PolicyNames.CanManageUsers, policy =>
                policy.RequireClaim(CustomClaimTypes.Role, UserRole.Admin.ToString()));

            options.AddPolicy(PolicyNames.CanAccessAnalytics, policy =>
                policy.RequireAssertion(context =>
                {
                    var role = context.User.FindFirst(CustomClaimTypes.Role)?.Value;
                    var subscription = context.User.FindFirst(CustomClaimTypes.SubscriptionTier)?.Value;
                    
                    // Admins always have access
                    if (role == UserRole.Admin.ToString())
                        return true;
                    
                    // Pro subscribers have access
                    if (subscription == SubscriptionTier.Pro.ToString())
                        return true;
                    
                    return false;
                }));

            options.AddPolicy(PolicyNames.CanUseAdvancedAI, policy =>
                policy.RequireAssertion(context =>
                {
                    var subscription = context.User.FindFirst(CustomClaimTypes.SubscriptionTier)?.Value;
                    
                    // Premium and Pro subscribers have access to advanced AI
                    return subscription == SubscriptionTier.Premium.ToString() || 
                           subscription == SubscriptionTier.Pro.ToString();
                }));

            // Account status policies
            options.AddPolicy(PolicyNames.RequireVerifiedEmail, policy =>
                policy.RequireClaim(CustomClaimTypes.EmailVerified, "True"));

            options.AddPolicy(PolicyNames.RequireActiveAccount, policy =>
                policy.RequireClaim(CustomClaimTypes.AccountActive, "True"));

            // Resource-based policies (these will be used with IAuthorizationService)
            options.AddPolicy(PolicyNames.CanViewCampaign, policy =>
                policy.Requirements.Add(new CampaignRequirement(CampaignPermission.View)));

            options.AddPolicy(PolicyNames.CanEditCampaign, policy =>
                policy.Requirements.Add(new CampaignRequirement(CampaignPermission.Edit)));

            options.AddPolicy(PolicyNames.CanDeleteCampaign, policy =>
                policy.Requirements.Add(new CampaignRequirement(CampaignPermission.Delete)));

            options.AddPolicy(PolicyNames.CanInviteToCampaign, policy =>
                policy.Requirements.Add(new CampaignRequirement(CampaignPermission.Invite)));

            options.AddPolicy(PolicyNames.CanManageCampaign, policy =>
                policy.Requirements.Add(new CampaignRequirement(CampaignPermission.Manage)));

            options.AddPolicy(PolicyNames.CanViewCharacter, policy =>
                policy.Requirements.Add(new CharacterRequirement(CharacterPermission.View)));

            options.AddPolicy(PolicyNames.CanEditCharacter, policy =>
                policy.Requirements.Add(new CharacterRequirement(CharacterPermission.Edit)));

            options.AddPolicy(PolicyNames.CanDeleteCharacter, policy =>
                policy.Requirements.Add(new CharacterRequirement(CharacterPermission.Delete)));
        });

        // Register authorization handlers
        services.AddScoped<IAuthorizationHandler, CampaignAuthorizationHandler>();
        services.AddScoped<IAuthorizationHandler, CharacterAuthorizationHandler>();

        return services;
    }

    /// <summary>
    /// Extension method to get subscription limits based on tier
    /// </summary>
    public static class SubscriptionLimits
    {
        public static (int maxCampaigns, int maxCharactersPerCampaign, int maxAiRequestsPerMonth) GetLimits(SubscriptionTier tier)
        {
            return tier switch
            {
                SubscriptionTier.Free => (1, 5, 100),
                SubscriptionTier.Premium => (5, 25, 1000),
                SubscriptionTier.Pro => (int.MaxValue, int.MaxValue, 5000),
                _ => (1, 5, 100) // Default to free tier limits
            };
        }

        public static bool HasFeatureAccess(SubscriptionTier tier, string feature)
        {
            return feature switch
            {
                "advanced_templates" => tier >= SubscriptionTier.Premium,
                "analytics" => tier == SubscriptionTier.Pro,
                "api_access" => tier == SubscriptionTier.Pro,
                "unlimited_campaigns" => tier == SubscriptionTier.Pro,
                "advanced_ai" => tier >= SubscriptionTier.Premium,
                _ => true // Basic features available to all
            };
        }
    }
}
