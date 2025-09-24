namespace DndAI.Services.Auth.Infrastructure.Configuration;

/// <summary>
/// JWT token configuration settings
/// </summary>
public class JwtSettings
{
    public const string SectionName = "Authentication:Jwt";

    /// <summary>
    /// Secret key for signing JWT tokens
    /// </summary>
    public required string SecretKey { get; set; }

    /// <summary>
    /// JWT token issuer
    /// </summary>
    public required string Issuer { get; set; }

    /// <summary>
    /// JWT token audience
    /// </summary>
    public required string Audience { get; set; }

    /// <summary>
    /// Access token expiration time in minutes
    /// </summary>
    public int AccessTokenExpirationMinutes { get; set; } = 60;

    /// <summary>
    /// Refresh token expiration time in days
    /// </summary>
    public int RefreshTokenExpirationDays { get; set; } = 7;

    /// <summary>
    /// Whether to validate the token issuer
    /// </summary>
    public bool ValidateIssuer { get; set; } = true;

    /// <summary>
    /// Whether to validate the token audience
    /// </summary>
    public bool ValidateAudience { get; set; } = true;

    /// <summary>
    /// Whether to validate the token lifetime
    /// </summary>
    public bool ValidateLifetime { get; set; } = true;

    /// <summary>
    /// Whether to validate the issuer signing key
    /// </summary>
    public bool ValidateIssuerSigningKey { get; set; } = true;

    /// <summary>
    /// Clock skew tolerance for token validation
    /// </summary>
    public TimeSpan ClockSkew { get; set; } = TimeSpan.Zero;
}
