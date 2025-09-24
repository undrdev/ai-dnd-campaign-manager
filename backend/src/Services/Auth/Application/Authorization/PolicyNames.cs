namespace DndAI.Services.Auth.Application.Authorization;

/// <summary>
/// Constants for authorization policy names used throughout the application
/// </summary>
public static class PolicyNames
{
    // Role-based policies
    public const string RequirePlayerRole = "RequirePlayerRole";
    public const string RequireGameMasterRole = "RequireGameMasterRole";
    public const string RequireAdminRole = "RequireAdminRole";
    
    // Subscription-tier based policies
    public const string RequirePremiumSubscription = "RequirePremiumSubscription";
    public const string RequireProSubscription = "RequireProSubscription";
    
    // Feature-based policies
    public const string CanCreateCampaigns = "CanCreateCampaigns";
    public const string CanManageUsers = "CanManageUsers";
    public const string CanAccessAnalytics = "CanAccessAnalytics";
    public const string CanUseAdvancedAI = "CanUseAdvancedAI";
    
    // Account status policies
    public const string RequireVerifiedEmail = "RequireVerifiedEmail";
    public const string RequireActiveAccount = "RequireActiveAccount";
    
    // Resource-based policies
    public const string CanViewCampaign = "CanViewCampaign";
    public const string CanEditCampaign = "CanEditCampaign";
    public const string CanDeleteCampaign = "CanDeleteCampaign";
    public const string CanInviteToCampaign = "CanInviteToCampaign";
    public const string CanManageCampaign = "CanManageCampaign";
    
    public const string CanViewCharacter = "CanViewCharacter";
    public const string CanEditCharacter = "CanEditCharacter";
    public const string CanDeleteCharacter = "CanDeleteCharacter";
}
