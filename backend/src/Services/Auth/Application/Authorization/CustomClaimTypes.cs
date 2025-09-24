namespace DndAI.Services.Auth.Application.Authorization;

/// <summary>
/// Custom claim types used for authorization throughout the application
/// </summary>
public static class CustomClaimTypes
{
    /// <summary>
    /// User's unique identifier
    /// </summary>
    public const string UserId = "user_id";
    
    /// <summary>
    /// User's role in the system (Player, GameMaster, Admin)
    /// </summary>
    public const string Role = "role";
    
    /// <summary>
    /// User's subscription tier (Free, Premium, Pro)
    /// </summary>
    public const string SubscriptionTier = "subscription_tier";
    
    /// <summary>
    /// Whether the user's email is verified
    /// </summary>
    public const string EmailVerified = "email_verified";
    
    /// <summary>
    /// Whether the user's account is active
    /// </summary>
    public const string AccountActive = "is_active";
    
    /// <summary>
    /// User's first name
    /// </summary>
    public const string FirstName = "first_name";
    
    /// <summary>
    /// User's last name
    /// </summary>
    public const string LastName = "last_name";
    
    /// <summary>
    /// Number of campaigns the user owns
    /// </summary>
    public const string CampaignCount = "campaign_count";
    
    /// <summary>
    /// Number of AI requests used this month
    /// </summary>
    public const string AiRequestsUsed = "ai_requests_used";
    
    /// <summary>
    /// Maximum AI requests allowed for the user's subscription tier
    /// </summary>
    public const string AiRequestsLimit = "ai_requests_limit";
}
