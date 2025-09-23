# Auth Service Implementation Specification

## Overview
The Auth Service manages authentication, authorization, user management, and subscription handling. This service implements OAuth 2.0/OpenID Connect, JWT token management, role-based permissions, and multi-factor authentication while ensuring consistency with established specifications.

## Service Architecture

### Technology Stack
- **Framework**: ASP.NET Core 8.0 with Identity
- **Database**: PostgreSQL with Entity Framework Core
- **Authentication**: OAuth 2.0/OpenID Connect, JWT Bearer tokens
- **Authorization**: Policy-based authorization with custom attributes
- **Caching**: Redis for token blacklisting and session management
- **External Auth**: Google, Discord, Microsoft OAuth providers
- **MFA**: TOTP (Time-based One-Time Password) via authenticator apps
- **Messaging**: MediatR for CQRS pattern
- **Testing**: xUnit, Moq, Testcontainers

### Project Structure
```
AuthService/
├── src/
│   ├── AuthService.Api/                # Web API layer
│   │   ├── Controllers/
│   │   ├── Middleware/
│   │   ├── Program.cs
│   │   └── appsettings.json
│   ├── AuthService.Application/        # Application layer
│   │   ├── Commands/
│   │   ├── Queries/
│   │   ├── Handlers/
│   │   ├── Services/
│   │   ├── Validators/
│   │   └── DTOs/
│   ├── AuthService.Domain/             # Domain layer
│   │   ├── Entities/
│   │   ├── ValueObjects/
│   │   ├── Events/
│   │   ├── Repositories/
│   │   └── Services/
│   └── AuthService.Infrastructure/     # Infrastructure layer
│       ├── Data/
│       ├── Repositories/
│       ├── Services/
│       ├── Identity/                   # Identity configuration
│       └── Configuration/
└── tests/
    ├── AuthService.UnitTests/
    ├── AuthService.IntegrationTests/
    └── AuthService.SecurityTests/       # Security-focused tests
```

## Domain Layer Implementation

### Core User Entity
Based on the database specification in `design/database/auth-security.md`:

```csharp
// Domain/Entities/User.cs
using AuthService.Domain.Events;
using AuthService.Domain.ValueObjects;

namespace AuthService.Domain.Entities
{
    public class User : AggregateRoot
    {
        public Guid Id { get; private set; }
        public string Email { get; private set; }
        public string DisplayName { get; private set; }
        public string? FirstName { get; private set; }
        public string? LastName { get; private set; }
        public string? AvatarUrl { get; private set; }
        
        // Authentication
        public string PasswordHash { get; private set; }
        public string? PasswordSalt { get; private set; }
        public DateTime? LastPasswordChange { get; private set; }
        public bool EmailConfirmed { get; private set; }
        public string? EmailConfirmationToken { get; private set; }
        
        // Account Status
        public UserStatus Status { get; private set; }
        public bool IsActive { get; private set; }
        public DateTime? LastLoginAt { get; private set; }
        public string? LastLoginIP { get; private set; }
        public int FailedLoginAttempts { get; private set; }
        public DateTime? LockoutEnd { get; private set; }
        
        // Multi-Factor Authentication
        public bool MfaEnabled { get; private set; }
        public string? MfaSecret { get; private set; }
        public List<string> MfaBackupCodes { get; private set; } = new();
        public DateTime? LastMfaSetup { get; private set; }
        
        // External Authentication
        public List<ExternalLogin> ExternalLogins { get; private set; } = new();
        
        // Subscription and Permissions
        public UserSubscription Subscription { get; private set; }
        public List<UserRole> Roles { get; private set; } = new();
        public List<UserPermission> DirectPermissions { get; private set; } = new();
        
        // Privacy and Preferences
        public UserPreferences Preferences { get; private set; }
        public PrivacySettings PrivacySettings { get; private set; }
        public bool HasAcceptedTerms { get; private set; }
        public DateTime? TermsAcceptedAt { get; private set; }
        public bool HasAcceptedPrivacyPolicy { get; private set; }
        public DateTime? PrivacyPolicyAcceptedAt { get; private set; }
        
        // Security and Audit
        public List<SecurityEvent> SecurityEvents { get; private set; } = new();
        public List<LoginHistory> LoginHistory { get; private set; } = new();
        
        // Referral System
        public string? ReferralCode { get; private set; }
        public Guid? ReferredBy { get; private set; }
        public int ReferralCount { get; private set; }
        
        // GDPR and Data Management
        public DateTime? DataRetentionDate { get; private set; }
        public bool IsDeleted { get; private set; }
        public DateTime? DeletedAt { get; private set; }
        
        // Audit fields
        public DateTime CreatedAt { get; private set; }
        public DateTime UpdatedAt { get; private set; }

        // Private constructor for EF Core
        private User() { }

        // Factory method for user registration
        public static User Register(
            string email,
            string displayName,
            string passwordHash,
            string? firstName = null,
            string? lastName = null,
            Guid? referredBy = null)
        {
            if (string.IsNullOrWhiteSpace(email))
                throw new ArgumentException("Email cannot be empty", nameof(email));
            
            if (string.IsNullOrWhiteSpace(displayName))
                throw new ArgumentException("Display name cannot be empty", nameof(displayName));
            
            if (string.IsNullOrWhiteSpace(passwordHash))
                throw new ArgumentException("Password hash cannot be empty", nameof(passwordHash));

            var user = new User
            {
                Id = Guid.NewGuid(),
                Email = email.ToLowerInvariant(),
                DisplayName = displayName,
                FirstName = firstName,
                LastName = lastName,
                PasswordHash = passwordHash,
                LastPasswordChange = DateTime.UtcNow,
                EmailConfirmed = false,
                EmailConfirmationToken = GenerateEmailConfirmationToken(),
                Status = UserStatus.PendingEmailConfirmation,
                IsActive = true,
                FailedLoginAttempts = 0,
                MfaEnabled = false,
                Subscription = UserSubscription.CreateFree(),
                Preferences = UserPreferences.Default(),
                PrivacySettings = PrivacySettings.Default(),
                HasAcceptedTerms = true,
                TermsAcceptedAt = DateTime.UtcNow,
                HasAcceptedPrivacyPolicy = true,
                PrivacyPolicyAcceptedAt = DateTime.UtcNow,
                ReferralCode = GenerateReferralCode(),
                ReferredBy = referredBy,
                ReferralCount = 0,
                IsDeleted = false,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            // Assign default role
            user.Roles.Add(UserRole.CreatePlayer());

            user.AddDomainEvent(new UserRegisteredEvent(user.Id, email, displayName, referredBy));

            return user;
        }

        // Factory method for external authentication
        public static User RegisterExternal(
            string email,
            string displayName,
            ExternalLoginInfo externalLogin,
            string? firstName = null,
            string? lastName = null,
            string? avatarUrl = null)
        {
            var user = new User
            {
                Id = Guid.NewGuid(),
                Email = email.ToLowerInvariant(),
                DisplayName = displayName,
                FirstName = firstName,
                LastName = lastName,
                AvatarUrl = avatarUrl,
                PasswordHash = string.Empty, // External auth doesn't use password
                EmailConfirmed = true, // Assume external providers have verified email
                Status = UserStatus.Active,
                IsActive = true,
                FailedLoginAttempts = 0,
                MfaEnabled = false,
                Subscription = UserSubscription.CreateFree(),
                Preferences = UserPreferences.Default(),
                PrivacySettings = PrivacySettings.Default(),
                HasAcceptedTerms = true,
                TermsAcceptedAt = DateTime.UtcNow,
                HasAcceptedPrivacyPolicy = true,
                PrivacyPolicyAcceptedAt = DateTime.UtcNow,
                ReferralCode = GenerateReferralCode(),
                ReferralCount = 0,
                IsDeleted = false,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            // Add external login
            user.ExternalLogins.Add(new ExternalLogin(
                externalLogin.Provider,
                externalLogin.ProviderKey,
                externalLogin.DisplayName,
                DateTime.UtcNow));

            // Assign default role
            user.Roles.Add(UserRole.CreatePlayer());

            user.AddDomainEvent(new UserRegisteredExternalEvent(
                user.Id, email, displayName, externalLogin.Provider));

            return user;
        }

        public void ConfirmEmail()
        {
            if (EmailConfirmed)
                throw new InvalidOperationException("Email is already confirmed");

            EmailConfirmed = true;
            EmailConfirmationToken = null;
            Status = UserStatus.Active;
            UpdatedAt = DateTime.UtcNow;

            AddDomainEvent(new EmailConfirmedEvent(Id, Email));
        }

        public void UpdatePassword(string newPasswordHash, IPasswordPolicy passwordPolicy)
        {
            if (string.IsNullOrWhiteSpace(newPasswordHash))
                throw new ArgumentException("Password hash cannot be empty", nameof(newPasswordHash));

            // Check if password was changed recently
            if (LastPasswordChange.HasValue && 
                DateTime.UtcNow - LastPasswordChange.Value < TimeSpan.FromHours(1))
            {
                throw new BusinessRuleViolationException("Password can only be changed once per hour");
            }

            PasswordHash = newPasswordHash;
            LastPasswordChange = DateTime.UtcNow;
            UpdatedAt = DateTime.UtcNow;

            // Reset failed login attempts
            FailedLoginAttempts = 0;
            LockoutEnd = null;

            AddSecurityEvent(SecurityEventType.PasswordChanged, "Password updated by user");
            AddDomainEvent(new PasswordChangedEvent(Id));
        }

        public LoginResult AttemptLogin(string ipAddress, ISecurityService securityService)
        {
            // Check if account is locked
            if (IsLockedOut())
            {
                AddSecurityEvent(SecurityEventType.LoginAttemptBlocked, 
                    $"Login attempt blocked - account locked until {LockoutEnd}", ipAddress);
                return LoginResult.AccountLocked(LockoutEnd.Value);
            }

            // Check if account is active
            if (!IsActive || Status != UserStatus.Active)
            {
                AddSecurityEvent(SecurityEventType.LoginAttemptBlocked, 
                    $"Login attempt blocked - account inactive (Status: {Status})", ipAddress);
                return LoginResult.AccountInactive();
            }

            // Check for suspicious activity
            var riskAssessment = securityService.AssessLoginRisk(this, ipAddress);
            if (riskAssessment.IsHighRisk)
            {
                AddSecurityEvent(SecurityEventType.SuspiciousActivity, 
                    $"High-risk login attempt: {riskAssessment.RiskFactors}", ipAddress);
                
                if (riskAssessment.RequiresMfa && !MfaEnabled)
                {
                    return LoginResult.MfaRequired();
                }
            }

            return LoginResult.Success();
        }

        public void RecordSuccessfulLogin(string ipAddress)
        {
            LastLoginAt = DateTime.UtcNow;
            LastLoginIP = ipAddress;
            FailedLoginAttempts = 0;
            LockoutEnd = null;
            UpdatedAt = DateTime.UtcNow;

            // Add to login history
            LoginHistory.Add(new LoginHistory(ipAddress, true, DateTime.UtcNow));

            // Limit login history to last 100 entries
            if (LoginHistory.Count > 100)
            {
                LoginHistory.RemoveRange(0, LoginHistory.Count - 100);
            }

            AddSecurityEvent(SecurityEventType.LoginSuccess, "Successful login", ipAddress);
            AddDomainEvent(new UserLoggedInEvent(Id, ipAddress));
        }

        public void RecordFailedLogin(string ipAddress, string reason)
        {
            FailedLoginAttempts++;
            
            // Lock account after 5 failed attempts
            if (FailedLoginAttempts >= 5)
            {
                LockoutEnd = DateTime.UtcNow.AddMinutes(30);
                AddSecurityEvent(SecurityEventType.AccountLocked, 
                    $"Account locked after {FailedLoginAttempts} failed attempts", ipAddress);
            }

            UpdatedAt = DateTime.UtcNow;

            // Add to login history
            LoginHistory.Add(new LoginHistory(ipAddress, false, DateTime.UtcNow, reason));

            AddSecurityEvent(SecurityEventType.LoginFailed, 
                $"Failed login attempt: {reason}", ipAddress);
            
            AddDomainEvent(new LoginFailedEvent(Id, ipAddress, reason, FailedLoginAttempts));
        }

        public void EnableMfa(string secret, List<string> backupCodes)
        {
            if (string.IsNullOrWhiteSpace(secret))
                throw new ArgumentException("MFA secret cannot be empty", nameof(secret));

            if (backupCodes?.Count != 10)
                throw new ArgumentException("Must provide exactly 10 backup codes", nameof(backupCodes));

            MfaEnabled = true;
            MfaSecret = secret;
            MfaBackupCodes = new List<string>(backupCodes);
            LastMfaSetup = DateTime.UtcNow;
            UpdatedAt = DateTime.UtcNow;

            AddSecurityEvent(SecurityEventType.MfaEnabled, "Multi-factor authentication enabled");
            AddDomainEvent(new MfaEnabledEvent(Id));
        }

        public void DisableMfa()
        {
            if (!MfaEnabled)
                throw new InvalidOperationException("MFA is not enabled");

            MfaEnabled = false;
            MfaSecret = null;
            MfaBackupCodes.Clear();
            UpdatedAt = DateTime.UtcNow;

            AddSecurityEvent(SecurityEventType.MfaDisabled, "Multi-factor authentication disabled");
            AddDomainEvent(new MfaDisabledEvent(Id));
        }

        public bool ValidateMfaCode(string code, IMfaService mfaService)
        {
            if (!MfaEnabled || string.IsNullOrWhiteSpace(MfaSecret))
                return false;

            // Check TOTP code
            if (mfaService.ValidateTotp(MfaSecret, code))
                return true;

            // Check backup codes
            if (MfaBackupCodes.Contains(code))
            {
                MfaBackupCodes.Remove(code);
                UpdatedAt = DateTime.UtcNow;
                
                AddSecurityEvent(SecurityEventType.MfaBackupCodeUsed, "MFA backup code used");
                return true;
            }

            return false;
        }

        public void AddRole(UserRole role)
        {
            if (role == null)
                throw new ArgumentNullException(nameof(role));

            if (Roles.Any(r => r.RoleId == role.RoleId))
                return; // Role already exists

            Roles.Add(role);
            UpdatedAt = DateTime.UtcNow;

            AddDomainEvent(new UserRoleAddedEvent(Id, role.RoleId));
        }

        public void RemoveRole(Guid roleId)
        {
            var role = Roles.FirstOrDefault(r => r.RoleId == roleId);
            if (role != null)
            {
                Roles.Remove(role);
                UpdatedAt = DateTime.UtcNow;

                AddDomainEvent(new UserRoleRemovedEvent(Id, roleId));
            }
        }

        public void UpdateSubscription(UserSubscription subscription)
        {
            var previousTier = Subscription.Tier;
            Subscription = subscription ?? throw new ArgumentNullException(nameof(subscription));
            UpdatedAt = DateTime.UtcNow;

            AddDomainEvent(new SubscriptionUpdatedEvent(Id, previousTier, subscription.Tier));
        }

        public void UpdatePreferences(UserPreferences preferences)
        {
            Preferences = preferences ?? throw new ArgumentNullException(nameof(preferences));
            UpdatedAt = DateTime.UtcNow;

            AddDomainEvent(new UserPreferencesUpdatedEvent(Id, preferences));
        }

        public void UpdatePrivacySettings(PrivacySettings privacySettings)
        {
            PrivacySettings = privacySettings ?? throw new ArgumentNullException(nameof(privacySettings));
            UpdatedAt = DateTime.UtcNow;

            AddDomainEvent(new PrivacySettingsUpdatedEvent(Id, privacySettings));
        }

        public void AcceptTerms(string version)
        {
            HasAcceptedTerms = true;
            TermsAcceptedAt = DateTime.UtcNow;
            UpdatedAt = DateTime.UtcNow;

            AddDomainEvent(new TermsAcceptedEvent(Id, version));
        }

        public void AcceptPrivacyPolicy(string version)
        {
            HasAcceptedPrivacyPolicy = true;
            PrivacyPolicyAcceptedAt = DateTime.UtcNow;
            UpdatedAt = DateTime.UtcNow;

            AddDomainEvent(new PrivacyPolicyAcceptedEvent(Id, version));
        }

        public void AddExternalLogin(ExternalLoginInfo loginInfo)
        {
            if (ExternalLogins.Any(el => el.Provider == loginInfo.Provider))
                throw new BusinessRuleViolationException($"External login for {loginInfo.Provider} already exists");

            ExternalLogins.Add(new ExternalLogin(
                loginInfo.Provider,
                loginInfo.ProviderKey,
                loginInfo.DisplayName,
                DateTime.UtcNow));

            UpdatedAt = DateTime.UtcNow;

            AddDomainEvent(new ExternalLoginAddedEvent(Id, loginInfo.Provider));
        }

        public void RemoveExternalLogin(string provider)
        {
            var externalLogin = ExternalLogins.FirstOrDefault(el => el.Provider == provider);
            if (externalLogin != null)
            {
                // Ensure user has a password if removing last external login
                if (ExternalLogins.Count == 1 && string.IsNullOrEmpty(PasswordHash))
                {
                    throw new BusinessRuleViolationException(
                        "Cannot remove last external login without setting a password");
                }

                ExternalLogins.Remove(externalLogin);
                UpdatedAt = DateTime.UtcNow;

                AddDomainEvent(new ExternalLoginRemovedEvent(Id, provider));
            }
        }

        public void SoftDelete(string reason)
        {
            IsDeleted = true;
            DeletedAt = DateTime.UtcNow;
            IsActive = false;
            Status = UserStatus.Deleted;
            DataRetentionDate = DateTime.UtcNow.AddDays(30); // 30-day retention period
            UpdatedAt = DateTime.UtcNow;

            AddSecurityEvent(SecurityEventType.AccountDeleted, $"Account deleted: {reason}");
            AddDomainEvent(new UserDeletedEvent(Id, reason));
        }

        public void Reactivate()
        {
            if (!IsDeleted)
                throw new InvalidOperationException("User is not deleted");

            IsDeleted = false;
            DeletedAt = null;
            IsActive = true;
            Status = UserStatus.Active;
            DataRetentionDate = null;
            UpdatedAt = DateTime.UtcNow;

            AddSecurityEvent(SecurityEventType.AccountReactivated, "Account reactivated");
            AddDomainEvent(new UserReactivatedEvent(Id));
        }

        public bool IsLockedOut()
        {
            return LockoutEnd.HasValue && LockoutEnd.Value > DateTime.UtcNow;
        }

        public bool HasPermission(string permission)
        {
            // Check direct permissions
            if (DirectPermissions.Any(p => p.Permission == permission))
                return true;

            // Check role permissions
            return Roles.Any(r => r.HasPermission(permission));
        }

        public List<string> GetAllPermissions()
        {
            var permissions = new HashSet<string>();

            // Add direct permissions
            foreach (var permission in DirectPermissions)
            {
                permissions.Add(permission.Permission);
            }

            // Add role permissions
            foreach (var role in Roles)
            {
                foreach (var permission in role.GetPermissions())
                {
                    permissions.Add(permission);
                }
            }

            return permissions.ToList();
        }

        private void AddSecurityEvent(SecurityEventType eventType, string description, string? ipAddress = null)
        {
            var securityEvent = new SecurityEvent(eventType, description, ipAddress, DateTime.UtcNow);
            SecurityEvents.Add(securityEvent);

            // Limit security events to last 1000 entries
            if (SecurityEvents.Count > 1000)
            {
                SecurityEvents.RemoveRange(0, SecurityEvents.Count - 1000);
            }
        }

        private static string GenerateEmailConfirmationToken()
        {
            return Guid.NewGuid().ToString("N");
        }

        private static string GenerateReferralCode()
        {
            const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
            var random = new Random();
            return new string(Enumerable.Repeat(chars, 8)
                .Select(s => s[random.Next(s.Length)]).ToArray());
        }
    }

    public enum UserStatus
    {
        PendingEmailConfirmation = 0,
        Active = 1,
        Inactive = 2,
        Suspended = 3,
        Deleted = 4
    }

    public enum SecurityEventType
    {
        LoginSuccess = 0,
        LoginFailed = 1,
        LoginAttemptBlocked = 2,
        PasswordChanged = 3,
        MfaEnabled = 4,
        MfaDisabled = 5,
        MfaBackupCodeUsed = 6,
        AccountLocked = 7,
        AccountDeleted = 8,
        AccountReactivated = 9,
        SuspiciousActivity = 10,
        PermissionChanged = 11
    }
}
```

### Authentication Value Objects
```csharp
// Domain/ValueObjects/UserSubscription.cs
namespace AuthService.Domain.ValueObjects
{
    public class UserSubscription : ValueObject
    {
        public SubscriptionTier Tier { get; private set; }
        public string TierName { get; private set; }
        public SubscriptionStatus Status { get; private set; }
        public DateTime? SubscriptionStart { get; private set; }
        public DateTime? SubscriptionEnd { get; private set; }
        public DateTime? NextBillingDate { get; private set; }
        public decimal? MonthlyPrice { get; private set; }
        public string? ExternalSubscriptionId { get; private set; }
        public SubscriptionLimits Limits { get; private set; }
        public bool AutoRenew { get; private set; }

        private UserSubscription() { }

        public UserSubscription(
            SubscriptionTier tier,
            string tierName,
            SubscriptionStatus status,
            DateTime? subscriptionStart = null,
            DateTime? subscriptionEnd = null,
            DateTime? nextBillingDate = null,
            decimal? monthlyPrice = null,
            string? externalSubscriptionId = null,
            SubscriptionLimits? limits = null,
            bool autoRenew = true)
        {
            Tier = tier;
            TierName = tierName ?? throw new ArgumentNullException(nameof(tierName));
            Status = status;
            SubscriptionStart = subscriptionStart;
            SubscriptionEnd = subscriptionEnd;
            NextBillingDate = nextBillingDate;
            MonthlyPrice = monthlyPrice;
            ExternalSubscriptionId = externalSubscriptionId;
            Limits = limits ?? SubscriptionLimits.ForTier(tier);
            AutoRenew = autoRenew;
        }

        public static UserSubscription CreateFree()
        {
            return new UserSubscription(
                SubscriptionTier.Free,
                "Free",
                SubscriptionStatus.Active,
                subscriptionStart: DateTime.UtcNow,
                monthlyPrice: 0m,
                autoRenew: false);
        }

        public static UserSubscription CreatePaid(
            SubscriptionTier tier,
            string externalSubscriptionId,
            decimal monthlyPrice)
        {
            var tierName = tier switch
            {
                SubscriptionTier.DungeonArchitect => "Dungeon Architect",
                SubscriptionTier.CampaignWeaver => "Campaign Weaver",
                SubscriptionTier.GuildMaster => "Guild Master",
                _ => throw new ArgumentException($"Invalid paid tier: {tier}")
            };

            return new UserSubscription(
                tier,
                tierName,
                SubscriptionStatus.Active,
                subscriptionStart: DateTime.UtcNow,
                nextBillingDate: DateTime.UtcNow.AddMonths(1),
                monthlyPrice: monthlyPrice,
                externalSubscriptionId: externalSubscriptionId);
        }

        public UserSubscription Upgrade(SubscriptionTier newTier, decimal newPrice, string externalSubscriptionId)
        {
            if (newTier <= Tier)
                throw new ArgumentException("Can only upgrade to a higher tier");

            var tierName = newTier switch
            {
                SubscriptionTier.DungeonArchitect => "Dungeon Architect",
                SubscriptionTier.CampaignWeaver => "Campaign Weaver",
                SubscriptionTier.GuildMaster => "Guild Master",
                _ => throw new ArgumentException($"Invalid tier: {newTier}")
            };

            return new UserSubscription(
                newTier,
                tierName,
                Status,
                SubscriptionStart,
                SubscriptionEnd,
                NextBillingDate,
                newPrice,
                externalSubscriptionId,
                SubscriptionLimits.ForTier(newTier),
                AutoRenew);
        }

        public UserSubscription Cancel()
        {
            return new UserSubscription(
                Tier,
                TierName,
                SubscriptionStatus.Cancelled,
                SubscriptionStart,
                SubscriptionEnd ?? DateTime.UtcNow.AddMonths(1), // Grace period
                NextBillingDate,
                MonthlyPrice,
                ExternalSubscriptionId,
                Limits,
                false);
        }

        public bool IsActive => Status == SubscriptionStatus.Active;
        public bool IsCancelled => Status == SubscriptionStatus.Cancelled;
        public bool IsExpired => SubscriptionEnd.HasValue && SubscriptionEnd.Value < DateTime.UtcNow;

        protected override IEnumerable<object> GetEqualityComponents()
        {
            yield return Tier;
            yield return Status;
            yield return SubscriptionStart ?? DateTime.MinValue;
            yield return SubscriptionEnd ?? DateTime.MinValue;
            yield return MonthlyPrice ?? 0m;
            yield return ExternalSubscriptionId ?? string.Empty;
        }
    }

    public class SubscriptionLimits : ValueObject
    {
        public int MaxCampaigns { get; private set; }
        public int MaxCharactersPerCampaign { get; private set; }
        public int MaxNPCsPerCampaign { get; private set; }
        public int AIRequestsPerMonth { get; private set; }
        public bool AdvancedAIFeatures { get; private set; }
        public bool PremiumSupport { get; private set; }
        public bool EarlyAccess { get; private set; }
        public int CloudStorageGB { get; private set; }

        private SubscriptionLimits() { }

        public SubscriptionLimits(
            int maxCampaigns,
            int maxCharactersPerCampaign,
            int maxNPCsPerCampaign,
            int aiRequestsPerMonth,
            bool advancedAIFeatures,
            bool premiumSupport,
            bool earlyAccess,
            int cloudStorageGB)
        {
            MaxCampaigns = maxCampaigns;
            MaxCharactersPerCampaign = maxCharactersPerCampaign;
            MaxNPCsPerCampaign = maxNPCsPerCampaign;
            AIRequestsPerMonth = aiRequestsPerMonth;
            AdvancedAIFeatures = advancedAIFeatures;
            PremiumSupport = premiumSupport;
            EarlyAccess = earlyAccess;
            CloudStorageGB = cloudStorageGB;
        }

        public static SubscriptionLimits ForTier(SubscriptionTier tier) => tier switch
        {
            SubscriptionTier.Free => new SubscriptionLimits(1, 1, 10, 50, false, false, false, 1),
            SubscriptionTier.DungeonArchitect => new SubscriptionLimits(5, 3, 50, 500, false, false, false, 5),
            SubscriptionTier.CampaignWeaver => new SubscriptionLimits(15, 5, 200, 2000, true, true, false, 25),
            SubscriptionTier.GuildMaster => new SubscriptionLimits(int.MaxValue, int.MaxValue, int.MaxValue, int.MaxValue, true, true, true, 100),
            _ => throw new ArgumentException($"Invalid subscription tier: {tier}")
        };

        protected override IEnumerable<object> GetEqualityComponents()
        {
            yield return MaxCampaigns;
            yield return MaxCharactersPerCampaign;
            yield return MaxNPCsPerCampaign;
            yield return AIRequestsPerMonth;
            yield return AdvancedAIFeatures;
            yield return PremiumSupport;
            yield return EarlyAccess;
            yield return CloudStorageGB;
        }
    }

    public enum SubscriptionTier
    {
        Free = 0,
        DungeonArchitect = 1,
        CampaignWeaver = 2,
        GuildMaster = 3
    }

    public enum SubscriptionStatus
    {
        Active = 0,
        Cancelled = 1,
        Expired = 2,
        PastDue = 3,
        Paused = 4
    }

    public class LoginResult : ValueObject
    {
        public bool IsSuccess { get; private set; }
        public LoginFailureReason? FailureReason { get; private set; }
        public string? Message { get; private set; }
        public DateTime? LockoutEnd { get; private set; }
        public bool RequiresMfa { get; private set; }

        private LoginResult() { }

        private LoginResult(bool isSuccess, LoginFailureReason? failureReason = null, 
            string? message = null, DateTime? lockoutEnd = null, bool requiresMfa = false)
        {
            IsSuccess = isSuccess;
            FailureReason = failureReason;
            Message = message;
            LockoutEnd = lockoutEnd;
            RequiresMfa = requiresMfa;
        }

        public static LoginResult Success() => new(true);
        public static LoginResult AccountLocked(DateTime lockoutEnd) => 
            new(false, LoginFailureReason.AccountLocked, "Account is locked", lockoutEnd);
        public static LoginResult AccountInactive() => 
            new(false, LoginFailureReason.AccountInactive, "Account is inactive");
        public static LoginResult InvalidCredentials() => 
            new(false, LoginFailureReason.InvalidCredentials, "Invalid credentials");
        public static LoginResult MfaRequired() => 
            new(false, LoginFailureReason.MfaRequired, "Multi-factor authentication required", requiresMfa: true);

        protected override IEnumerable<object> GetEqualityComponents()
        {
            yield return IsSuccess;
            yield return FailureReason ?? LoginFailureReason.InvalidCredentials;
            yield return Message ?? string.Empty;
            yield return LockoutEnd ?? DateTime.MinValue;
            yield return RequiresMfa;
        }
    }

    public enum LoginFailureReason
    {
        InvalidCredentials = 0,
        AccountLocked = 1,
        AccountInactive = 2,
        MfaRequired = 3,
        EmailNotConfirmed = 4
    }
}
```

### Domain Services
```csharp
// Domain/Services/ISecurityService.cs
using AuthService.Domain.ValueObjects;

namespace AuthService.Domain.Services
{
    public interface ISecurityService
    {
        RiskAssessment AssessLoginRisk(User user, string ipAddress);
        Task<bool> IsPasswordCompromisedAsync(string password);
        string HashPassword(string password);
        bool VerifyPassword(string password, string hash);
        Task<bool> ValidatePasswordPolicyAsync(string password, User user);
        Task<SecurityRecommendation> GetSecurityRecommendationsAsync(User user);
    }

    public class RiskAssessment
    {
        public bool IsHighRisk { get; set; }
        public bool RequiresMfa { get; set; }
        public List<string> RiskFactors { get; set; } = new();
        public int RiskScore { get; set; } // 0-100
    }

    public class SecurityRecommendation
    {
        public bool ShouldEnableMfa { get; set; }
        public bool ShouldUpdatePassword { get; set; }
        public bool ShouldReviewLogins { get; set; }
        public List<string> Recommendations { get; set; } = new();
    }

    public interface IMfaService
    {
        string GenerateSecret();
        List<string> GenerateBackupCodes();
        bool ValidateTotp(string secret, string code);
        string GenerateQrCodeUri(string secret, string userEmail, string issuer);
    }

    public interface ITokenService
    {
        Task<TokenResult> GenerateTokensAsync(User user, string? deviceId = null);
        Task<TokenResult> RefreshTokensAsync(string refreshToken);
        Task RevokeTokenAsync(string token);
        Task RevokeAllUserTokensAsync(Guid userId);
        Task<bool> IsTokenValidAsync(string token);
        Task<TokenClaims?> ValidateTokenAsync(string token);
    }

    public class TokenResult
    {
        public string AccessToken { get; set; } = string.Empty;
        public string RefreshToken { get; set; } = string.Empty;
        public DateTime AccessTokenExpiry { get; set; }
        public DateTime RefreshTokenExpiry { get; set; }
        public string TokenType { get; set; } = "Bearer";
    }

    public class TokenClaims
    {
        public Guid UserId { get; set; }
        public string Email { get; set; } = string.Empty;
        public List<string> Roles { get; set; } = new();
        public List<string> Permissions { get; set; } = new();
        public SubscriptionTier SubscriptionTier { get; set; }
        public DateTime IssuedAt { get; set; }
        public DateTime ExpiresAt { get; set; }
        public string? DeviceId { get; set; }
    }
}
```

### Domain Events
```csharp
// Domain/Events/UserEvents.cs
using AuthService.Domain.ValueObjects;

namespace AuthService.Domain.Events
{
    public record UserRegisteredEvent(
        Guid UserId, 
        string Email, 
        string DisplayName, 
        Guid? ReferredBy) : DomainEvent;

    public record UserRegisteredExternalEvent(
        Guid UserId, 
        string Email, 
        string DisplayName, 
        string Provider) : DomainEvent;

    public record EmailConfirmedEvent(Guid UserId, string Email) : DomainEvent;

    public record PasswordChangedEvent(Guid UserId) : DomainEvent;

    public record UserLoggedInEvent(Guid UserId, string IpAddress) : DomainEvent;

    public record LoginFailedEvent(
        Guid UserId, 
        string IpAddress, 
        string Reason, 
        int FailedAttempts) : DomainEvent;

    public record MfaEnabledEvent(Guid UserId) : DomainEvent;

    public record MfaDisabledEvent(Guid UserId) : DomainEvent;

    public record UserRoleAddedEvent(Guid UserId, Guid RoleId) : DomainEvent;

    public record UserRoleRemovedEvent(Guid UserId, Guid RoleId) : DomainEvent;

    public record SubscriptionUpdatedEvent(
        Guid UserId, 
        SubscriptionTier PreviousTier, 
        SubscriptionTier NewTier) : DomainEvent;

    public record UserPreferencesUpdatedEvent(
        Guid UserId, 
        UserPreferences Preferences) : DomainEvent;

    public record PrivacySettingsUpdatedEvent(
        Guid UserId, 
        PrivacySettings PrivacySettings) : DomainEvent;

    public record TermsAcceptedEvent(Guid UserId, string Version) : DomainEvent;

    public record PrivacyPolicyAcceptedEvent(Guid UserId, string Version) : DomainEvent;

    public record ExternalLoginAddedEvent(Guid UserId, string Provider) : DomainEvent;

    public record ExternalLoginRemovedEvent(Guid UserId, string Provider) : DomainEvent;

    public record UserDeletedEvent(Guid UserId, string Reason) : DomainEvent;

    public record UserReactivatedEvent(Guid UserId) : DomainEvent;

    public record SuspiciousActivityDetectedEvent(
        Guid UserId, 
        string Activity, 
        string IpAddress, 
        int RiskScore) : DomainEvent;
}
```

## Application Layer Implementation

### User Registration Command
```csharp
// Application/Commands/RegisterUserCommand.cs
using FluentValidation;
using MediatR;
using AuthService.Domain.Services;

namespace AuthService.Application.Commands
{
    public class RegisterUserCommand : IRequest<RegisterUserResponse>
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public bool AcceptTerms { get; set; }
        public bool AcceptPrivacyPolicy { get; set; }
        public string? ReferralCode { get; set; }
    }

    public class RegisterUserCommandValidator : AbstractValidator<RegisterUserCommand>
    {
        public RegisterUserCommandValidator()
        {
            RuleFor(x => x.Email)
                .NotEmpty()
                .EmailAddress()
                .MaximumLength(254)
                .WithMessage("Valid email address is required");

            RuleFor(x => x.Password)
                .NotEmpty()
                .MinimumLength(8)
                .MaximumLength(128)
                .Matches(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\da-zA-Z]).{8,}$")
                .WithMessage("Password must be at least 8 characters with uppercase, lowercase, number, and special character");

            RuleFor(x => x.DisplayName)
                .NotEmpty()
                .MinimumLength(2)
                .MaximumLength(50)
                .WithMessage("Display name must be between 2 and 50 characters");

            RuleFor(x => x.FirstName)
                .MaximumLength(50)
                .WithMessage("First name cannot exceed 50 characters");

            RuleFor(x => x.LastName)
                .MaximumLength(50)
                .WithMessage("Last name cannot exceed 50 characters");

            RuleFor(x => x.AcceptTerms)
                .Equal(true)
                .WithMessage("You must accept the terms of service");

            RuleFor(x => x.AcceptPrivacyPolicy)
                .Equal(true)
                .WithMessage("You must accept the privacy policy");
        }
    }

    public class RegisterUserCommandHandler : IRequestHandler<RegisterUserCommand, RegisterUserResponse>
    {
        private readonly IUserRepository _userRepository;
        private readonly ISecurityService _securityService;
        private readonly IEmailService _emailService;
        private readonly ICacheService _cacheService;
        private readonly ILogger<RegisterUserCommandHandler> _logger;

        public RegisterUserCommandHandler(
            IUserRepository userRepository,
            ISecurityService securityService,
            IEmailService emailService,
            ICacheService cacheService,
            ILogger<RegisterUserCommandHandler> logger)
        {
            _userRepository = userRepository;
            _securityService = securityService;
            _emailService = emailService;
            _cacheService = cacheService;
            _logger = logger;
        }

        public async Task<RegisterUserResponse> Handle(RegisterUserCommand request, CancellationToken cancellationToken)
        {
            _logger.LogInformation("Registering new user with email {Email}", request.Email);

            // Check if email already exists
            var existingUser = await _userRepository.GetByEmailAsync(request.Email, cancellationToken);
            if (existingUser != null)
                throw new BusinessRuleViolationException("An account with this email address already exists");

            // Check if password is compromised
            var isCompromised = await _securityService.IsPasswordCompromisedAsync(request.Password);
            if (isCompromised)
                throw new BusinessRuleViolationException("This password has been found in data breaches and cannot be used");

            // Hash password
            var passwordHash = _securityService.HashPassword(request.Password);

            // Handle referral code
            Guid? referredBy = null;
            if (!string.IsNullOrWhiteSpace(request.ReferralCode))
            {
                var referrer = await _userRepository.GetByReferralCodeAsync(request.ReferralCode, cancellationToken);
                if (referrer != null)
                {
                    referredBy = referrer.Id;
                }
            }

            // Create user
            var user = User.Register(
                request.Email,
                request.DisplayName,
                passwordHash,
                request.FirstName,
                request.LastName,
                referredBy);

            // Save user
            await _userRepository.AddAsync(user, cancellationToken);
            await _userRepository.UnitOfWork.SaveEntitiesAsync(cancellationToken);

            // Send confirmation email
            await _emailService.SendEmailConfirmationAsync(user.Email, user.EmailConfirmationToken!, user.DisplayName);

            // Update referrer if applicable
            if (referredBy.HasValue)
            {
                await UpdateReferrerAsync(referredBy.Value, cancellationToken);
            }

            // Clear any cached data
            await _cacheService.RemoveByPatternAsync($"user:email:{request.Email}");

            _logger.LogInformation("Successfully registered user {UserId} with email {Email}", user.Id, user.Email);

            return new RegisterUserResponse
            {
                UserId = user.Id,
                Email = user.Email,
                DisplayName = user.DisplayName,
                EmailConfirmationRequired = !user.EmailConfirmed,
                Message = "Registration successful. Please check your email to confirm your account."
            };
        }

        private async Task UpdateReferrerAsync(Guid referrerId, CancellationToken cancellationToken)
        {
            var referrer = await _userRepository.GetByIdAsync(referrerId, cancellationToken);
            if (referrer != null)
            {
                referrer.IncrementReferralCount();
                await _userRepository.UnitOfWork.SaveEntitiesAsync(cancellationToken);
            }
        }
    }

    public class RegisterUserResponse
    {
        public Guid UserId { get; set; }
        public string Email { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
        public bool EmailConfirmationRequired { get; set; }
        public string Message { get; set; } = string.Empty;
    }
}
```

This Auth Service specification provides:

1. **Complete Authentication System** - OAuth 2.0/OpenID Connect, JWT tokens, external providers
2. **Advanced Security Features** - MFA, password policies, risk assessment, breach detection
3. **Comprehensive User Management** - Registration, profile management, preferences
4. **Subscription Management** - Tier-based limits, billing integration
5. **Role-Based Authorization** - Flexible permission system with roles and direct permissions
6. **Security Monitoring** - Login tracking, suspicious activity detection, audit trails
7. **GDPR Compliance** - Data retention, deletion, privacy settings
8. **API Consistency** - Aligns with `design/api/auth-api.md` specifications
9. **Database Alignment** - Matches schema from `design/database/auth-security.md`

The implementation includes sophisticated security measures, comprehensive audit trails, and follows established patterns from the foundation specifications.

Would you like me to continue with the AI Gateway Service specification next, or would you prefer to see more detail on specific aspects of the Auth Service (such as the complete JWT token management or the role-based authorization system)?
