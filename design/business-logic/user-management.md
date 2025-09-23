# User Management Business Logic

## Overview
This document defines the comprehensive business logic for user management within the D&D AI Campaign Management System. It covers user registration, authentication, authorization, profile management, subscription handling, social features, privacy controls, data protection, encryption, and the complete user lifecycle from registration to account management with enterprise-grade security.

## Security and Data Protection Framework

### Data Classification System
```csharp
public enum DataClassification
{
    Public,        // Publicly visible information (username, public profile)
    Internal,      // System internal data (IDs, metadata)
    Confidential,  // User personal data (email, preferences)
    Restricted     // Highly sensitive data (payment info, private messages)
}

[AttributeUsage(AttributeTargets.Property | AttributeTargets.Field)]
public class DataClassificationAttribute : Attribute
{
    public DataClassification Classification { get; }
    public bool RequireEncryption { get; set; }
    public bool RequireAuditLog { get; set; } = true;
    public string[] AllowedRoles { get; set; } = new string[0];

    public DataClassificationAttribute(DataClassification classification)
    {
        Classification = classification;
        RequireEncryption = classification >= DataClassification.Confidential;
    }
}
```

### Encryption Service Interface
```csharp
public interface IEncryptionService
{
    Task<EncryptedData> EncryptAsync(string plaintext, EncryptionContext context);
    Task<string> DecryptAsync(EncryptedData encryptedData, EncryptionContext context);
    Task<EncryptedData> ReEncryptAsync(EncryptedData encryptedData, EncryptionContext newContext);
    Task RotateKeysAsync(string keyId);
    bool IsEncrypted(object data);
}

public class EncryptedData
{
    public string CipherText { get; set; }
    public string KeyId { get; set; }
    public string Algorithm { get; set; }
    public byte[] InitializationVector { get; set; }
    public string AuthenticationTag { get; set; }
    public DateTime EncryptedAt { get; set; }
}

public class EncryptionContext
{
    public string UserId { get; set; }
    public string TenantId { get; set; }
    public DataClassification DataClassification { get; set; }
    public string Purpose { get; set; } // "storage", "transmission", "search"
    public Dictionary<string, object> Metadata { get; set; } = new();
}
```

### Key Management System
```csharp
public interface IKeyManagementService
{
    Task<EncryptionKey> GetKeyAsync(string keyId, EncryptionContext context);
    Task<EncryptionKey> CreateKeyAsync(KeyCreationRequest request);
    Task RotateKeyAsync(string keyId);
    Task RevokeKeyAsync(string keyId, string reason);
    Task<List<EncryptionKey>> GetActiveKeysAsync();
    Task<bool> ValidateKeyAccessAsync(string keyId, string userId, string operation);
}

public class EncryptionKey
{
    public string Id { get; set; }
    public string Algorithm { get; set; } = "AES-256-GCM";
    public KeyStatus Status { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public string Purpose { get; set; }
    public DataClassification MinClassification { get; set; }
    public List<string> AuthorizedServices { get; set; } = new();
}

public enum KeyStatus
{
    Active,
    Rotating,
    Deprecated,
    Revoked
}

public interface IEncryptableEntity
{
    EncryptionMetadata EncryptionMetadata { get; }
}

public class EncryptionMetadata
{
    public Dictionary<string, FieldEncryptionInfo> EncryptedFields { get; private set; } = new();
    public string DefaultKeyId { get; set; }
    public DateTime LastKeyRotation { get; set; }
    public bool RequiresReEncryption { get; set; }

    public void UpdateFieldEncryption(string fieldName, string keyId = null)
    {
        EncryptedFields[fieldName] = new FieldEncryptionInfo
        {
            KeyId = keyId ?? DefaultKeyId,
            EncryptedAt = DateTime.UtcNow,
            Algorithm = "AES-256-GCM"
        };
    }

    public bool IsFieldEncrypted(string fieldName) => EncryptedFields.ContainsKey(fieldName);
}

public class FieldEncryptionInfo
{
    public string KeyId { get; set; }
    public DateTime EncryptedAt { get; set; }
    public string Algorithm { get; set; }
    public bool NeedsReEncryption { get; set; }
}

### Secure Data Deletion Service
```csharp
public interface ISecureDataDeletionService
{
    Task<Result> SecureDeleteUserDataAsync(string userId, DataDeletionRequest request);
    Task<Result> AnonymizeUserDataAsync(string userId, AnonymizationRequest request);
    Task<Result> ExportUserDataAsync(string userId, DataExportRequest request);
    Task<Result> ValidateDataRetentionComplianceAsync(string userId);
}

public class SecureDataDeletionService : ISecureDataDeletionService
{
    private readonly IUserRepository _userRepository;
    private readonly IEncryptionService _encryptionService;
    private readonly IKeyManagementService _keyManagementService;
    private readonly IAuditLogger _auditLogger;

    public async Task<Result> SecureDeleteUserDataAsync(string userId, DataDeletionRequest request)
    {
        var user = await _userRepository.GetByIdAsync(userId);
        if (user == null)
        {
            return Result.Failure("User not found");
        }

        // Validate deletion request
        var validationResult = await ValidateDeletionRequestAsync(user, request);
        if (validationResult.IsFailure)
        {
            return validationResult;
        }

        // Log deletion request
        await _auditLogger.LogDataDeletionAsync(userId, request);

        // Perform secure deletion based on data classification
        await SecureDeleteByClassificationAsync(user, request);

        // Revoke encryption keys for deleted data
        await RevokeUserEncryptionKeysAsync(userId);

        // Mark user as deleted
        user.Status = UserStatus.Deleted;
        await _userRepository.UpdateAsync(user);

        return Result.Success();
    }

    private async Task SecureDeleteByClassificationAsync(User user, DataDeletionRequest request)
    {
        // Delete/anonymize based on data classification and retention requirements
        foreach (var field in GetEncryptedFields(user))
        {
            var classification = GetFieldClassification(field);
            
            switch (classification)
            {
                case DataClassification.Restricted:
                    await SecureOverwriteFieldAsync(user, field);
                    break;
                case DataClassification.Confidential:
                    if (request.AnonymizeInsteadOfDelete)
                        await AnonymizeFieldAsync(user, field);
                    else
                        await SecureOverwriteFieldAsync(user, field);
                    break;
                case DataClassification.Internal:
                    // Keep for audit purposes with anonymization
                    await AnonymizeFieldAsync(user, field);
                    break;
                case DataClassification.Public:
                    // May be retained for legitimate business purposes
                    break;
            }
        }
    }
}

public class DataDeletionRequest
{
    public string UserId { get; set; }
    public string Reason { get; set; }
    public bool AnonymizeInsteadOfDelete { get; set; }
    public List<string> SpecificFields { get; set; } = new();
    public bool IsGDPRRequest { get; set; }
    public bool IsUserInitiated { get; set; }
    public DateTime RequestedAt { get; set; } = DateTime.UtcNow;
}
```

## Domain Model

### User Entity
```csharp
public class User : Entity, IAggregateRoot, IEncryptableEntity
{
    [DataClassification(DataClassification.Internal)]
    public string Id { get; private set; }
    
    [DataClassification(DataClassification.Public)]
    public string Username { get; private set; }
    
    [DataClassification(DataClassification.Confidential, RequireEncryption = true)]
    public EncryptedData Email { get; private set; }
    
    [DataClassification(DataClassification.Public)]
    public string DisplayName { get; private set; }
    
    [DataClassification(DataClassification.Internal)]
    public UserStatus Status { get; private set; }
    
    [DataClassification(DataClassification.Internal)]
    public DateTime CreatedAt { get; private set; }
    
    [DataClassification(DataClassification.Internal)]
    public DateTime? LastLoginAt { get; private set; }
    
    [DataClassification(DataClassification.Confidential)]
    public UserProfile Profile { get; private set; }
    
    [DataClassification(DataClassification.Confidential)]
    public UserPreferences Preferences { get; private set; }
    
    [DataClassification(DataClassification.Restricted)]
    public UserSubscription? Subscription { get; private set; }
    
    [DataClassification(DataClassification.Internal)]
    public List<UserRole> Roles { get; private set; } = new();
    
    [DataClassification(DataClassification.Internal)]
    public List<UserPermission> Permissions { get; private set; } = new();
    
    [DataClassification(DataClassification.Internal)]
    public List<UserSession> Sessions { get; private set; } = new();
    
    [DataClassification(DataClassification.Internal)]
    public UserStatistics Statistics { get; private set; }
    
    [DataClassification(DataClassification.Confidential)]
    public PrivacySettings PrivacySettings { get; private set; }
    
    [DataClassification(DataClassification.Internal)]
    public List<UserNotification> Notifications { get; private set; } = new();
    
    [DataClassification(DataClassification.Internal)]
    public List<DomainEvent> DomainEvents { get; private set; } = new();

    // Encryption tracking
    public EncryptionMetadata EncryptionMetadata { get; private set; }
    
    // Secure email access
    public async Task<string> GetEmailAsync(IEncryptionService encryptionService, EncryptionContext context)
    {
        return await encryptionService.DecryptAsync(Email, context);
    }
    
    public async Task SetEmailAsync(string email, IEncryptionService encryptionService, EncryptionContext context)
    {
        Email = await encryptionService.EncryptAsync(email, context);
        EncryptionMetadata.UpdateFieldEncryption(nameof(Email));
    }

    public static User Create(string username, string email, string displayName)
    {
        var user = new User
        {
            Id = Guid.NewGuid().ToString(),
            Username = username.ToLowerInvariant(),
            Email = email.ToLowerInvariant(),
            DisplayName = displayName,
            Status = UserStatus.Active,
            CreatedAt = DateTime.UtcNow,
            Profile = UserProfile.CreateDefault(),
            Preferences = UserPreferences.CreateDefault(),
            Statistics = UserStatistics.Create(),
            PrivacySettings = PrivacySettings.CreateDefault()
        };

        // Add default role
        user.Roles.Add(UserRole.Player);

        user.AddDomainEvent(new UserCreatedEvent(user.Id, user.Username, user.Email));
        return user;
    }

    public Result UpdateProfile(UpdateUserProfileRequest request)
    {
        // Validate profile updates
        var validationResult = ValidateProfileUpdate(request);
        if (validationResult.IsFailure)
        {
            return validationResult;
        }

        var oldProfile = Profile;
        Profile = Profile.Update(request);

        AddDomainEvent(new UserProfileUpdatedEvent(Id, oldProfile, Profile));
        return Result.Success();
    }

    public Result ChangePassword(string currentPassword, string newPassword, IPasswordHasher passwordHasher)
    {
        // Verify current password
        if (!passwordHasher.VerifyPassword(currentPassword, Profile.PasswordHash))
        {
            return Result.Failure("Current password is incorrect");
        }

        // Validate new password
        var passwordValidation = ValidatePassword(newPassword);
        if (passwordValidation.IsFailure)
        {
            return passwordValidation;
        }

        // Hash new password
        var newPasswordHash = passwordHasher.HashPassword(newPassword);
        Profile.UpdatePasswordHash(newPasswordHash);

        AddDomainEvent(new UserPasswordChangedEvent(Id));
        return Result.Success();
    }

    public Result Subscribe(SubscriptionPlan plan, PaymentMethod paymentMethod)
    {
        if (Subscription?.IsActive == true)
        {
            return Result.Failure("User already has an active subscription");
        }

        Subscription = UserSubscription.Create(Id, plan, paymentMethod);
        
        // Grant subscription permissions
        GrantSubscriptionPermissions(plan);

        AddDomainEvent(new UserSubscribedEvent(Id, plan.Id, plan.Type));
        return Result.Success();
    }

    public Result CancelSubscription(string reason = "")
    {
        if (Subscription?.IsActive != true)
        {
            return Result.Failure("No active subscription to cancel");
        }

        Subscription.Cancel(reason);

        // Revoke subscription permissions
        RevokeSubscriptionPermissions();

        AddDomainEvent(new UserSubscriptionCancelledEvent(Id, reason));
        return Result.Success();
    }

    public Result AddRole(UserRole role)
    {
        if (Roles.Contains(role))
        {
            return Result.Failure("User already has this role");
        }

        Roles.Add(role);
        AddDomainEvent(new UserRoleAddedEvent(Id, role));
        return Result.Success();
    }

    public Result RemoveRole(UserRole role)
    {
        if (!Roles.Contains(role))
        {
            return Result.Failure("User does not have this role");
        }

        if (role == UserRole.Player && Roles.Count == 1)
        {
            return Result.Failure("Cannot remove the last role from a user");
        }

        Roles.Remove(role);
        AddDomainEvent(new UserRoleRemovedEvent(Id, role));
        return Result.Success();
    }

    public bool HasPermission(string permission)
    {
        return Permissions.Any(p => p.Permission == permission && p.IsActive);
    }

    public bool CanCreateCampaigns()
    {
        return HasRole(UserRole.DungeonMaster) || HasPermission("campaigns.create");
    }

    public bool CanJoinCampaigns()
    {
        return Status == UserStatus.Active && (HasRole(UserRole.Player) || HasRole(UserRole.DungeonMaster));
    }

    public int GetMaxActiveCampaigns()
    {
        if (Subscription?.IsActive == true)
        {
            return Subscription.Plan.MaxCampaigns;
        }
        return 3; // Free tier limit
    }

    public void RecordLogin(string ipAddress, string userAgent)
    {
        LastLoginAt = DateTime.UtcNow;
        Statistics.IncrementLoginCount();
        
        var session = UserSession.Create(Id, ipAddress, userAgent);
        Sessions.Add(session);

        AddDomainEvent(new UserLoggedInEvent(Id, ipAddress));
    }

    private bool HasRole(UserRole role)
    {
        return Roles.Contains(role);
    }

    private void GrantSubscriptionPermissions(SubscriptionPlan plan)
    {
        foreach (var permission in plan.IncludedPermissions)
        {
            if (!Permissions.Any(p => p.Permission == permission))
            {
                Permissions.Add(UserPermission.Create(permission, PermissionSource.Subscription));
            }
        }
    }

    private void RevokeSubscriptionPermissions()
    {
        var subscriptionPermissions = Permissions.Where(p => p.Source == PermissionSource.Subscription).ToList();
        foreach (var permission in subscriptionPermissions)
        {
            Permissions.Remove(permission);
        }
    }
}

public enum UserStatus
{
    Active,
    Inactive,
    Suspended,
    Banned,
    PendingVerification,
    Deleted
}

public enum UserRole
{
    Player,
    DungeonMaster,
    Administrator,
    Moderator,
    ContentCreator,
    Beta
}
```

## User Registration and Authentication

### User Registration Service
```csharp
public class UserRegistrationService : IDomainService
{
    private readonly IUserRepository _userRepository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IEmailService _emailService;
    private readonly IUsernameValidator _usernameValidator;
    private readonly IEmailValidator _emailValidator;

    public async Task<Result<User>> RegisterUserAsync(RegisterUserRequest request)
    {
        // Validate registration request
        var validationResult = await ValidateRegistrationRequestAsync(request);
        if (validationResult.IsFailure)
        {
            return Result.Failure<User>(validationResult.Error);
        }

        // Check if username is available
        var usernameAvailable = await IsUsernameAvailableAsync(request.Username);
        if (!usernameAvailable)
        {
            return Result.Failure<User>("Username is already taken");
        }

        // Check if email is available
        var emailAvailable = await IsEmailAvailableAsync(request.Email);
        if (!emailAvailable)
        {
            return Result.Failure<User>("Email is already registered");
        }

        // Create user
        var user = User.Create(request.Username, request.Email, request.DisplayName);

        // Set password
        var passwordHash = _passwordHasher.HashPassword(request.Password);
        user.Profile.SetPasswordHash(passwordHash);

        // Set additional profile information
        if (!string.IsNullOrEmpty(request.FirstName))
        {
            user.Profile.SetFirstName(request.FirstName);
        }
        if (!string.IsNullOrEmpty(request.LastName))
        {
            user.Profile.SetLastName(request.LastName);
        }
        if (request.DateOfBirth.HasValue)
        {
            user.Profile.SetDateOfBirth(request.DateOfBirth.Value);
        }

        // Set initial preferences
        if (request.Preferences != null)
        {
            user.Preferences.Update(request.Preferences);
        }

        // Store user
        await _userRepository.AddAsync(user);

        // Send verification email
        if (request.RequireEmailVerification)
        {
            await SendEmailVerificationAsync(user);
        }

        return Result.Success(user);
    }

    public async Task<Result> VerifyEmailAsync(string userId, string verificationToken)
    {
        var user = await _userRepository.GetByIdAsync(userId);
        if (user == null)
        {
            return Result.Failure("User not found");
        }

        if (user.Profile.IsEmailVerified)
        {
            return Result.Failure("Email is already verified");
        }

        // Validate verification token
        var tokenValid = await ValidateVerificationTokenAsync(userId, verificationToken);
        if (!tokenValid)
        {
            return Result.Failure("Invalid or expired verification token");
        }

        // Mark email as verified
        user.Profile.MarkEmailVerified();
        user.Status = UserStatus.Active;

        await _userRepository.UpdateAsync(user);

        return Result.Success();
    }

    private async Task<Result> ValidateRegistrationRequestAsync(RegisterUserRequest request)
    {
        // Username validation
        if (!_usernameValidator.IsValid(request.Username))
        {
            return Result.Failure("Invalid username format");
        }

        // Email validation
        if (!_emailValidator.IsValid(request.Email))
        {
            return Result.Failure("Invalid email format");
        }

        // Password validation
        var passwordValidation = ValidatePassword(request.Password);
        if (passwordValidation.IsFailure)
        {
            return passwordValidation;
        }

        // Age validation if date of birth provided
        if (request.DateOfBirth.HasValue)
        {
            var age = DateTime.UtcNow.Year - request.DateOfBirth.Value.Year;
            if (age < 13)
            {
                return Result.Failure("Users must be at least 13 years old");
            }
        }

        return Result.Success();
    }

    private Result ValidatePassword(string password)
    {
        if (string.IsNullOrEmpty(password))
        {
            return Result.Failure("Password is required");
        }

        if (password.Length < 8)
        {
            return Result.Failure("Password must be at least 8 characters long");
        }

        if (!password.Any(char.IsUpper))
        {
            return Result.Failure("Password must contain at least one uppercase letter");
        }

        if (!password.Any(char.IsLower))
        {
            return Result.Failure("Password must contain at least one lowercase letter");
        }

        if (!password.Any(char.IsDigit))
        {
            return Result.Failure("Password must contain at least one digit");
        }

        if (!password.Any(c => !char.IsLetterOrDigit(c)))
        {
            return Result.Failure("Password must contain at least one special character");
        }

        return Result.Success();
    }

    private async Task SendEmailVerificationAsync(User user)
    {
        var verificationToken = GenerateVerificationToken();
        await StoreVerificationTokenAsync(user.Id, verificationToken);

        var verificationLink = $"https://dndai.app/verify-email?userId={user.Id}&token={verificationToken}";
        
        await _emailService.SendEmailAsync(new EmailRequest
        {
            To = user.Email,
            Subject = "Verify your D&D AI account",
            TemplateId = "email-verification",
            TemplateData = new Dictionary<string, object>
            {
                ["username"] = user.Username,
                ["verificationLink"] = verificationLink
            }
        });
    }
}

public class RegisterUserRequest
{
    public string Username { get; set; }
    public string Email { get; set; }
    public string Password { get; set; }
    public string DisplayName { get; set; }
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public DateTime? DateOfBirth { get; set; }
    public UserPreferences? Preferences { get; set; }
    public bool RequireEmailVerification { get; set; } = true;
    public bool AcceptTermsOfService { get; set; }
    public bool AcceptPrivacyPolicy { get; set; }
}
```

## User Profile Management

### User Profile Service
```csharp
public class UserProfileService : IDomainService
{
    private readonly IUserRepository _userRepository;
    private readonly IFileStorageService _fileStorageService;
    private readonly IImageProcessingService _imageProcessingService;

    public async Task<Result> UpdateProfileAsync(string userId, UpdateUserProfileRequest request)
    {
        var user = await _userRepository.GetByIdAsync(userId);
        if (user == null)
        {
            return Result.Failure("User not found");
        }

        var result = user.UpdateProfile(request);
        if (result.IsFailure)
        {
            return result;
        }

        await _userRepository.UpdateAsync(user);
        return Result.Success();
    }

    public async Task<Result> UpdateAvatarAsync(string userId, IFormFile avatarFile)
    {
        var user = await _userRepository.GetByIdAsync(userId);
        if (user == null)
        {
            return Result.Failure("User not found");
        }

        // Validate file
        var validationResult = ValidateAvatarFile(avatarFile);
        if (validationResult.IsFailure)
        {
            return validationResult;
        }

        // Process image
        var processedImage = await _imageProcessingService.ProcessAvatarImageAsync(avatarFile);
        if (processedImage.IsFailure)
        {
            return Result.Failure($"Failed to process avatar image: {processedImage.Error}");
        }

        // Upload to storage
        var uploadResult = await _fileStorageService.UploadFileAsync(
            processedImage.Value,
            $"avatars/{userId}/{Guid.NewGuid()}.jpg",
            "image/jpeg"
        );

        if (uploadResult.IsFailure)
        {
            return Result.Failure($"Failed to upload avatar: {uploadResult.Error}");
        }

        // Update user profile
        user.Profile.SetAvatarUrl(uploadResult.Value.Url);
        await _userRepository.UpdateAsync(user);

        return Result.Success();
    }

    public async Task<Result> UpdatePreferencesAsync(string userId, UserPreferences preferences)
    {
        var user = await _userRepository.GetByIdAsync(userId);
        if (user == null)
        {
            return Result.Failure("User not found");
        }

        user.Preferences.Update(preferences);
        await _userRepository.UpdateAsync(user);

        return Result.Success();
    }

    public async Task<Result> UpdatePrivacySettingsAsync(string userId, PrivacySettings privacySettings)
    {
        var user = await _userRepository.GetByIdAsync(userId);
        if (user == null)
        {
            return Result.Failure("User not found");
        }

        user.PrivacySettings.Update(privacySettings);
        await _userRepository.UpdateAsync(user);

        return Result.Success();
    }

    private Result ValidateAvatarFile(IFormFile file)
    {
        if (file == null || file.Length == 0)
        {
            return Result.Failure("No file provided");
        }

        if (file.Length > 5 * 1024 * 1024) // 5MB limit
        {
            return Result.Failure("Avatar file size cannot exceed 5MB");
        }

        var allowedTypes = new[] { "image/jpeg", "image/jpg", "image/png", "image/gif" };
        if (!allowedTypes.Contains(file.ContentType.ToLowerInvariant()))
        {
            return Result.Failure("Avatar must be a JPEG, PNG, or GIF image");
        }

        return Result.Success();
    }
}

public class UserProfile : ValueObject, IEncryptableEntity
{
    [DataClassification(DataClassification.Confidential, RequireEncryption = true)]
    public EncryptedData? FirstName { get; private set; }
    
    [DataClassification(DataClassification.Confidential, RequireEncryption = true)]
    public EncryptedData? LastName { get; private set; }
    
    [DataClassification(DataClassification.Restricted, RequireEncryption = true)]
    public EncryptedData? DateOfBirth { get; private set; }
    
    [DataClassification(DataClassification.Confidential, RequireEncryption = true)]
    public EncryptedData? Bio { get; private set; }
    
    [DataClassification(DataClassification.Confidential, RequireEncryption = true)]
    public EncryptedData? Location { get; private set; }
    
    [DataClassification(DataClassification.Public)]
    public string? Website { get; private set; }
    
    [DataClassification(DataClassification.Public)]
    public string? AvatarUrl { get; private set; }
    
    [DataClassification(DataClassification.Restricted, RequireEncryption = true)]
    public EncryptedData PasswordHash { get; private set; }
    
    [DataClassification(DataClassification.Internal)]
    public bool IsEmailVerified { get; private set; }
    
    [DataClassification(DataClassification.Internal)]
    public DateTime? EmailVerifiedAt { get; private set; }
    
    [DataClassification(DataClassification.Confidential)]
    public List<SocialLink> SocialLinks { get; private set; } = new();
    
    [DataClassification(DataClassification.Confidential)]
    public Dictionary<string, object> CustomFields { get; private set; } = new();
    
    // Encryption metadata
    public EncryptionMetadata EncryptionMetadata { get; private set; }

    // Secure field access methods
    public async Task<string?> GetFirstNameAsync(IEncryptionService encryptionService, EncryptionContext context)
    {
        return FirstName != null ? await encryptionService.DecryptAsync(FirstName, context) : null;
    }
    
    public async Task<string?> GetLastNameAsync(IEncryptionService encryptionService, EncryptionContext context)
    {
        return LastName != null ? await encryptionService.DecryptAsync(LastName, context) : null;
    }
    
    public async Task<DateTime?> GetDateOfBirthAsync(IEncryptionService encryptionService, EncryptionContext context)
    {
        if (DateOfBirth == null) return null;
        var decrypted = await encryptionService.DecryptAsync(DateOfBirth, context);
        return DateTime.Parse(decrypted);
    }
    
    public async Task SetFirstNameAsync(string? firstName, IEncryptionService encryptionService, EncryptionContext context)
    {
        FirstName = firstName != null ? await encryptionService.EncryptAsync(firstName, context) : null;
        EncryptionMetadata.UpdateFieldEncryption(nameof(FirstName));
    }

    public static UserProfile CreateDefault()
    {
        return new UserProfile
        {
            IsEmailVerified = false,
            SocialLinks = new List<SocialLink>(),
            CustomFields = new Dictionary<string, object>()
        };
    }

    public UserProfile Update(UpdateUserProfileRequest request)
    {
        return new UserProfile
        {
            FirstName = request.FirstName ?? FirstName,
            LastName = request.LastName ?? LastName,
            DateOfBirth = request.DateOfBirth ?? DateOfBirth,
            Bio = request.Bio ?? Bio,
            Location = request.Location ?? Location,
            Website = request.Website ?? Website,
            AvatarUrl = AvatarUrl, // Avatar updated separately
            PasswordHash = PasswordHash, // Password updated separately
            IsEmailVerified = IsEmailVerified,
            EmailVerifiedAt = EmailVerifiedAt,
            SocialLinks = request.SocialLinks ?? SocialLinks,
            CustomFields = request.CustomFields ?? CustomFields
        };
    }

    public void SetPasswordHash(string passwordHash)
    {
        PasswordHash = passwordHash;
    }

    public void SetAvatarUrl(string avatarUrl)
    {
        AvatarUrl = avatarUrl;
    }

    public void MarkEmailVerified()
    {
        IsEmailVerified = true;
        EmailVerifiedAt = DateTime.UtcNow;
    }

    public string GetFullName()
    {
        if (!string.IsNullOrEmpty(FirstName) && !string.IsNullOrEmpty(LastName))
        {
            return $"{FirstName} {LastName}";
        }
        return FirstName ?? LastName ?? "";
    }

    public int? GetAge()
    {
        if (DateOfBirth.HasValue)
        {
            var today = DateTime.Today;
            var age = today.Year - DateOfBirth.Value.Year;
            if (DateOfBirth.Value.Date > today.AddYears(-age))
            {
                age--;
            }
            return age;
        }
        return null;
    }
}

public class UpdateUserProfileRequest
{
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public DateTime? DateOfBirth { get; set; }
    public string? Bio { get; set; }
    public string? Location { get; set; }
    public string? Website { get; set; }
    public List<SocialLink>? SocialLinks { get; set; }
    public Dictionary<string, object>? CustomFields { get; set; }
}

public class SocialLink : ValueObject
{
    public SocialPlatform Platform { get; private set; }
    public string Url { get; private set; }
    public string? DisplayName { get; private set; }

    public static SocialLink Create(SocialPlatform platform, string url, string? displayName = null)
    {
        return new SocialLink
        {
            Platform = platform,
            Url = url,
            DisplayName = displayName
        };
    }
}

public enum SocialPlatform
{
    Twitter,
    Discord,
    Twitch,
    YouTube,
    Instagram,
    TikTok,
    Reddit,
    Other
}
```

## Subscription Management

### Subscription Service
```csharp
public class SubscriptionService : IDomainService
{
    private readonly IUserRepository _userRepository;
    private readonly IPaymentService _paymentService;
    private readonly ISubscriptionPlanRepository _planRepository;
    private readonly INotificationService _notificationService;

    public async Task<Result> SubscribeUserAsync(string userId, string planId, PaymentMethodRequest paymentMethod)
    {
        var user = await _userRepository.GetByIdAsync(userId);
        if (user == null)
        {
            return Result.Failure("User not found");
        }

        var plan = await _planRepository.GetByIdAsync(planId);
        if (plan == null)
        {
            return Result.Failure("Subscription plan not found");
        }

        // Process payment
        var paymentResult = await _paymentService.ProcessSubscriptionPaymentAsync(user, plan, paymentMethod);
        if (paymentResult.IsFailure)
        {
            return Result.Failure($"Payment failed: {paymentResult.Error}");
        }

        // Create payment method
        var userPaymentMethod = PaymentMethod.Create(
            paymentMethod.Type,
            paymentMethod.Token,
            paymentResult.Value.PaymentMethodId
        );

        // Subscribe user
        var subscriptionResult = user.Subscribe(plan, userPaymentMethod);
        if (subscriptionResult.IsFailure)
        {
            // Refund payment if subscription creation fails
            await _paymentService.RefundPaymentAsync(paymentResult.Value.PaymentId);
            return subscriptionResult;
        }

        await _userRepository.UpdateAsync(user);

        // Send confirmation
        await _notificationService.SendSubscriptionConfirmationAsync(user, plan);

        return Result.Success();
    }

    public async Task<Result> CancelSubscriptionAsync(string userId, string reason = "")
    {
        var user = await _userRepository.GetByIdAsync(userId);
        if (user == null)
        {
            return Result.Failure("User not found");
        }

        var cancellationResult = user.CancelSubscription(reason);
        if (cancellationResult.IsFailure)
        {
            return cancellationResult;
        }

        // Cancel recurring payment
        if (user.Subscription?.PaymentMethod?.ExternalId != null)
        {
            await _paymentService.CancelRecurringPaymentAsync(user.Subscription.PaymentMethod.ExternalId);
        }

        await _userRepository.UpdateAsync(user);

        // Send cancellation confirmation
        await _notificationService.SendSubscriptionCancellationAsync(user);

        return Result.Success();
    }

    public async Task<Result> UpdateSubscriptionAsync(string userId, string newPlanId)
    {
        var user = await _userRepository.GetByIdAsync(userId);
        if (user == null)
        {
            return Result.Failure("User not found");
        }

        if (user.Subscription?.IsActive != true)
        {
            return Result.Failure("No active subscription to update");
        }

        var newPlan = await _planRepository.GetByIdAsync(newPlanId);
        if (newPlan == null)
        {
            return Result.Failure("New subscription plan not found");
        }

        var currentPlan = user.Subscription.Plan;
        
        // Calculate prorated amount
        var proratedAmount = CalculateProratedAmount(currentPlan, newPlan, user.Subscription);

        // Process payment difference if upgrading
        if (proratedAmount > 0)
        {
            var paymentResult = await _paymentService.ProcessProrationPaymentAsync(
                user,
                proratedAmount,
                user.Subscription.PaymentMethod
            );

            if (paymentResult.IsFailure)
            {
                return Result.Failure($"Prorated payment failed: {paymentResult.Error}");
            }
        }

        // Update subscription
        user.Subscription.UpdatePlan(newPlan, proratedAmount);

        // Update user permissions
        user.UpdateSubscriptionPermissions(newPlan);

        await _userRepository.UpdateAsync(user);

        // Send update confirmation
        await _notificationService.SendSubscriptionUpdateAsync(user, currentPlan, newPlan);

        return Result.Success();
    }

    public async Task ProcessSubscriptionRenewalAsync(string subscriptionId)
    {
        var user = await _userRepository.GetBySubscriptionIdAsync(subscriptionId);
        if (user?.Subscription == null)
        {
            return;
        }

        // Process renewal payment
        var renewalResult = await _paymentService.ProcessRenewalPaymentAsync(
            user,
            user.Subscription.Plan,
            user.Subscription.PaymentMethod
        );

        if (renewalResult.IsFailure)
        {
            // Handle failed renewal
            await HandleFailedRenewalAsync(user, renewalResult.Error);
            return;
        }

        // Renew subscription
        user.Subscription.Renew(renewalResult.Value.PaymentId);
        await _userRepository.UpdateAsync(user);

        // Send renewal confirmation
        await _notificationService.SendSubscriptionRenewalAsync(user);
    }

    private async Task HandleFailedRenewalAsync(User user, string error)
    {
        user.Subscription.MarkRenewalFailed(error);
        await _userRepository.UpdateAsync(user);

        // Send payment failure notification
        await _notificationService.SendPaymentFailureAsync(user, error);

        // Start grace period or suspend subscription based on policy
        await StartSubscriptionGracePeriodAsync(user);
    }

    private decimal CalculateProratedAmount(SubscriptionPlan currentPlan, SubscriptionPlan newPlan, UserSubscription subscription)
    {
        var daysRemaining = (subscription.ExpiresAt - DateTime.UtcNow).Days;
        var totalDaysInPeriod = subscription.BillingCycle == BillingCycle.Monthly ? 30 : 365;
        
        var currentPlanDailyRate = currentPlan.Price / totalDaysInPeriod;
        var newPlanDailyRate = newPlan.Price / totalDaysInPeriod;
        
        var refundAmount = currentPlanDailyRate * daysRemaining;
        var newChargeAmount = newPlanDailyRate * daysRemaining;
        
        return newChargeAmount - refundAmount;
    }
}

public class UserSubscription : ValueObject
{
    public string Id { get; private set; }
    public string UserId { get; private set; }
    public SubscriptionPlan Plan { get; private set; }
    public PaymentMethod PaymentMethod { get; private set; }
    public SubscriptionStatus Status { get; private set; }
    public DateTime StartedAt { get; private set; }
    public DateTime ExpiresAt { get; private set; }
    public DateTime? CancelledAt { get; private set; }
    public string? CancellationReason { get; private set; }
    public BillingCycle BillingCycle { get; private set; }
    public List<SubscriptionPayment> Payments { get; private set; } = new();
    public bool IsActive => Status == SubscriptionStatus.Active && ExpiresAt > DateTime.UtcNow;

    public static UserSubscription Create(string userId, SubscriptionPlan plan, PaymentMethod paymentMethod)
    {
        var subscription = new UserSubscription
        {
            Id = Guid.NewGuid().ToString(),
            UserId = userId,
            Plan = plan,
            PaymentMethod = paymentMethod,
            Status = SubscriptionStatus.Active,
            StartedAt = DateTime.UtcNow,
            BillingCycle = plan.DefaultBillingCycle
        };

        subscription.ExpiresAt = subscription.CalculateExpirationDate();
        return subscription;
    }

    public void Cancel(string reason)
    {
        Status = SubscriptionStatus.Cancelled;
        CancelledAt = DateTime.UtcNow;
        CancellationReason = reason;
    }

    public void Renew(string paymentId)
    {
        var payment = SubscriptionPayment.Create(paymentId, Plan.Price, BillingCycle);
        Payments.Add(payment);
        
        ExpiresAt = CalculateExpirationDate();
        Status = SubscriptionStatus.Active;
    }

    public void UpdatePlan(SubscriptionPlan newPlan, decimal proratedAmount)
    {
        Plan = newPlan;
        
        if (proratedAmount != 0)
        {
            var payment = SubscriptionPayment.CreateProrated(proratedAmount, "Plan Change");
            Payments.Add(payment);
        }
    }

    public void MarkRenewalFailed(string error)
    {
        Status = SubscriptionStatus.PaymentFailed;
        // Could add failure details here
    }

    private DateTime CalculateExpirationDate()
    {
        return BillingCycle switch
        {
            BillingCycle.Monthly => StartedAt.AddMonths(1),
            BillingCycle.Yearly => StartedAt.AddYears(1),
            _ => StartedAt.AddMonths(1)
        };
    }
}

public class SubscriptionPlan : Entity
{
    public string Id { get; private set; }
    public string Name { get; private set; }
    public string Description { get; private set; }
    public decimal Price { get; private set; }
    public BillingCycle DefaultBillingCycle { get; private set; }
    public int MaxCampaigns { get; private set; }
    public int MaxCharacters { get; private set; }
    public bool UnlimitedAI { get; private set; }
    public bool PremiumFeatures { get; private set; }
    public List<string> IncludedPermissions { get; private set; } = new();
    public bool IsActive { get; private set; }

    public static SubscriptionPlan CreateFree()
    {
        return new SubscriptionPlan
        {
            Id = "free",
            Name = "Free",
            Description = "Basic D&D campaign management",
            Price = 0,
            DefaultBillingCycle = BillingCycle.Monthly,
            MaxCampaigns = 3,
            MaxCharacters = 5,
            UnlimitedAI = false,
            PremiumFeatures = false,
            IsActive = true,
            IncludedPermissions = new List<string>
            {
                "campaigns.create.basic",
                "characters.create.basic",
                "ai.generate.limited"
            }
        };
    }

    public static SubscriptionPlan CreatePremium()
    {
        return new SubscriptionPlan
        {
            Id = "premium",
            Name = "Premium",
            Description = "Advanced D&D campaign management with unlimited AI",
            Price = 9.99m,
            DefaultBillingCycle = BillingCycle.Monthly,
            MaxCampaigns = -1, // Unlimited
            MaxCharacters = -1, // Unlimited
            UnlimitedAI = true,
            PremiumFeatures = true,
            IsActive = true,
            IncludedPermissions = new List<string>
            {
                "campaigns.create.unlimited",
                "characters.create.unlimited",
                "ai.generate.unlimited",
                "content.premium",
                "analytics.advanced"
            }
        };
    }
}

public enum SubscriptionStatus
{
    Active,
    Cancelled,
    Expired,
    PaymentFailed,
    Suspended
}

public enum BillingCycle
{
    Monthly,
    Yearly
}
```

## Social Features and Friend System

### Social Service
```csharp
public class SocialService : IDomainService
{
    private readonly IUserRepository _userRepository;
    private readonly IFriendshipRepository _friendshipRepository;
    private readonly INotificationService _notificationService;

    public async Task<Result> SendFriendRequestAsync(string fromUserId, string toUserId)
    {
        if (fromUserId == toUserId)
        {
            return Result.Failure("Cannot send friend request to yourself");
        }

        var fromUser = await _userRepository.GetByIdAsync(fromUserId);
        var toUser = await _userRepository.GetByIdAsync(toUserId);

        if (fromUser == null || toUser == null)
        {
            return Result.Failure("User not found");
        }

        // Check if friendship already exists
        var existingFriendship = await _friendshipRepository.GetFriendshipAsync(fromUserId, toUserId);
        if (existingFriendship != null)
        {
            return Result.Failure("Friendship request already exists or users are already friends");
        }

        // Check privacy settings
        if (!toUser.PrivacySettings.AllowFriendRequests)
        {
            return Result.Failure("User is not accepting friend requests");
        }

        // Create friendship request
        var friendship = Friendship.CreateRequest(fromUserId, toUserId);
        await _friendshipRepository.AddAsync(friendship);

        // Send notification
        await _notificationService.SendFriendRequestNotificationAsync(toUser, fromUser);

        return Result.Success();
    }

    public async Task<Result> AcceptFriendRequestAsync(string userId, string friendshipId)
    {
        var friendship = await _friendshipRepository.GetByIdAsync(friendshipId);
        if (friendship == null)
        {
            return Result.Failure("Friend request not found");
        }

        if (friendship.ToUserId != userId)
        {
            return Result.Failure("Cannot accept friend request for another user");
        }

        var acceptResult = friendship.Accept();
        if (acceptResult.IsFailure)
        {
            return acceptResult;
        }

        await _friendshipRepository.UpdateAsync(friendship);

        // Notify both users
        var fromUser = await _userRepository.GetByIdAsync(friendship.FromUserId);
        var toUser = await _userRepository.GetByIdAsync(friendship.ToUserId);

        await _notificationService.SendFriendRequestAcceptedNotificationAsync(fromUser, toUser);

        return Result.Success();
    }

    public async Task<Result> DeclineFriendRequestAsync(string userId, string friendshipId)
    {
        var friendship = await _friendshipRepository.GetByIdAsync(friendshipId);
        if (friendship == null)
        {
            return Result.Failure("Friend request not found");
        }

        if (friendship.ToUserId != userId)
        {
            return Result.Failure("Cannot decline friend request for another user");
        }

        var declineResult = friendship.Decline();
        if (declineResult.IsFailure)
        {
            return declineResult;
        }

        await _friendshipRepository.UpdateAsync(friendship);
        return Result.Success();
    }

    public async Task<Result> RemoveFriendAsync(string userId, string friendId)
    {
        var friendship = await _friendshipRepository.GetFriendshipAsync(userId, friendId);
        if (friendship == null)
        {
            return Result.Failure("Friendship not found");
        }

        if (friendship.Status != FriendshipStatus.Accepted)
        {
            return Result.Failure("Users are not friends");
        }

        friendship.Remove();
        await _friendshipRepository.UpdateAsync(friendship);

        return Result.Success();
    }

    public async Task<List<User>> GetFriendsAsync(string userId)
    {
        var friendships = await _friendshipRepository.GetUserFriendshipsAsync(userId, FriendshipStatus.Accepted);
        var friendIds = friendships.Select(f => f.GetOtherUserId(userId)).ToList();
        
        var friends = new List<User>();
        foreach (var friendId in friendIds)
        {
            var friend = await _userRepository.GetByIdAsync(friendId);
            if (friend != null)
            {
                friends.Add(friend);
            }
        }

        return friends;
    }

    public async Task<List<User>> SearchUsersAsync(string query, string requestingUserId, int limit = 20)
    {
        var users = await _userRepository.SearchUsersAsync(query, limit);
        
        // Filter based on privacy settings
        var filteredUsers = new List<User>();
        foreach (var user in users)
        {
            if (user.Id == requestingUserId)
                continue;

            if (user.PrivacySettings.ProfileVisibility == ProfileVisibility.Public ||
                (user.PrivacySettings.ProfileVisibility == ProfileVisibility.Friends && 
                 await AreFriendsAsync(requestingUserId, user.Id)))
            {
                filteredUsers.Add(user);
            }
        }

        return filteredUsers;
    }

    private async Task<bool> AreFriendsAsync(string userId1, string userId2)
    {
        var friendship = await _friendshipRepository.GetFriendshipAsync(userId1, userId2);
        return friendship?.Status == FriendshipStatus.Accepted;
    }
}

public class Friendship : Entity
{
    public string Id { get; private set; }
    public string FromUserId { get; private set; }
    public string ToUserId { get; private set; }
    public FriendshipStatus Status { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime? AcceptedAt { get; private set; }
    public DateTime? DeclinedAt { get; private set; }

    public static Friendship CreateRequest(string fromUserId, string toUserId)
    {
        return new Friendship
        {
            Id = Guid.NewGuid().ToString(),
            FromUserId = fromUserId,
            ToUserId = toUserId,
            Status = FriendshipStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };
    }

    public Result Accept()
    {
        if (Status != FriendshipStatus.Pending)
        {
            return Result.Failure("Can only accept pending friend requests");
        }

        Status = FriendshipStatus.Accepted;
        AcceptedAt = DateTime.UtcNow;
        return Result.Success();
    }

    public Result Decline()
    {
        if (Status != FriendshipStatus.Pending)
        {
            return Result.Failure("Can only decline pending friend requests");
        }

        Status = FriendshipStatus.Declined;
        DeclinedAt = DateTime.UtcNow;
        return Result.Success();
    }

    public void Remove()
    {
        Status = FriendshipStatus.Removed;
    }

    public string GetOtherUserId(string userId)
    {
        return userId == FromUserId ? ToUserId : FromUserId;
    }
}

public enum FriendshipStatus
{
    Pending,
    Accepted,
    Declined,
    Removed,
    Blocked
}
```

## Privacy and Security

### Privacy Settings
```csharp
public class PrivacySettings : ValueObject
{
    public ProfileVisibility ProfileVisibility { get; private set; }
    public bool AllowFriendRequests { get; private set; }
    public bool ShowOnlineStatus { get; private set; }
    public bool AllowDirectMessages { get; private set; }
    public bool ShareGameActivity { get; private set; }
    public bool AllowCampaignInvites { get; private set; }
    public DataRetentionPreference DataRetention { get; private set; }
    public bool AllowAnalytics { get; private set; }
    public bool AllowMarketing { get; private set; }
    public Dictionary<string, bool> CustomPrivacySettings { get; private set; } = new();

    // Enhanced GDPR Compliance
    public GDPRConsent GDPRConsent { get; private set; }
    public CCPAConsent CCPAConsent { get; private set; }
    public COPPAConsent? COPPAConsent { get; private set; }
    public DataProcessingPurposes AllowedProcessingPurposes { get; private set; }
    public bool AllowDataPortability { get; private set; } = true;
    public bool AllowDataRectification { get; private set; } = true;
    public bool AllowDataErasure { get; private set; } = true;
    public bool AllowProcessingRestriction { get; private set; } = true;
    public bool AllowAutomatedDecisionMaking { get; private set; } = false;
    public DateTime? ConsentWithdrawnAt { get; private set; }
    public List<ConsentRecord> ConsentHistory { get; private set; } = new();

    public static PrivacySettings CreateDefault()
    {
        return new PrivacySettings
        {
            ProfileVisibility = ProfileVisibility.Friends,
            AllowFriendRequests = true,
            ShowOnlineStatus = true,
            AllowDirectMessages = true,
            ShareGameActivity = true,
            AllowCampaignInvites = true,
            DataRetention = DataRetentionPreference.Standard,
            AllowAnalytics = true,
            AllowMarketing = false
        };
    }

    public PrivacySettings Update(PrivacySettings newSettings)
    {
        return new PrivacySettings
        {
            ProfileVisibility = newSettings.ProfileVisibility,
            AllowFriendRequests = newSettings.AllowFriendRequests,
            ShowOnlineStatus = newSettings.ShowOnlineStatus,
            AllowDirectMessages = newSettings.AllowDirectMessages,
            ShareGameActivity = newSettings.ShareGameActivity,
            AllowCampaignInvites = newSettings.AllowCampaignInvites,
            DataRetention = newSettings.DataRetention,
            AllowAnalytics = newSettings.AllowAnalytics,
            AllowMarketing = newSettings.AllowMarketing,
            CustomPrivacySettings = newSettings.CustomPrivacySettings
        };
    }
}

public enum ProfileVisibility
{
    Public,
    Friends,
    Private
}

public enum DataRetentionPreference
{
    Minimal,      // Keep only essential data
    Standard,     // Keep data for normal operation
    Extended      // Keep detailed history and analytics
}

public class GDPRConsent : ValueObject
{
    public bool ProcessingConsent { get; private set; }
    public bool MarketingConsent { get; private set; }
    public bool ProfilingConsent { get; private set; }
    public bool ThirdPartyDataSharingConsent { get; private set; }
    public DateTime ConsentGivenAt { get; private set; }
    public string ConsentVersion { get; private set; }
    public string LegalBasis { get; private set; }
    public bool IsWithdrawn { get; private set; }
    public DateTime? WithdrawnAt { get; private set; }

    public static GDPRConsent CreateDefault()
    {
        return new GDPRConsent
        {
            ProcessingConsent = false,
            MarketingConsent = false,
            ProfilingConsent = false,
            ThirdPartyDataSharingConsent = false,
            ConsentGivenAt = DateTime.UtcNow,
            ConsentVersion = "1.0",
            LegalBasis = "Consent"
        };
    }
}

public class CCPAConsent : ValueObject
{
    public bool OptOutOfSale { get; private set; }
    public bool OptOutOfTargetedAdvertising { get; private set; }
    public bool OptOutOfProfiling { get; private set; }
    public DateTime ConsentGivenAt { get; private set; }
    public string ConsentVersion { get; private set; }

    public static CCPAConsent CreateDefault()
    {
        return new CCPAConsent
        {
            OptOutOfSale = true,
            OptOutOfTargetedAdvertising = true,
            OptOutOfProfiling = true,
            ConsentGivenAt = DateTime.UtcNow,
            ConsentVersion = "1.0"
        };
    }
}

public class COPPAConsent : ValueObject
{
    public bool ParentalConsentGiven { get; private set; }
    public string ParentEmail { get; private set; }
    public DateTime ConsentGivenAt { get; private set; }
    public ConsentMethod ConsentMethod { get; private set; }
    public string ConsentDocumentId { get; private set; }
}

public enum ConsentMethod
{
    Email,
    Phone,
    PostalMail,
    DigitalSignature,
    VideoConference
}

public class DataProcessingPurposes : ValueObject
{
    public bool ServiceProvision { get; private set; } = true;
    public bool Analytics { get; private set; }
    public bool Marketing { get; private set; }
    public bool Personalization { get; private set; }
    public bool SecurityAndFraud { get; private set; } = true;
    public bool LegalCompliance { get; private set; } = true;
    public bool ResearchAndDevelopment { get; private set; }
    public bool ThirdPartyIntegrations { get; private set; }
}

public class ConsentRecord : ValueObject
{
    public string ConsentType { get; private set; }
    public bool ConsentGiven { get; private set; }
    public DateTime Timestamp { get; private set; }
    public string IpAddress { get; private set; }
    public string UserAgent { get; private set; }
    public string ConsentVersion { get; private set; }
    public string LegalBasis { get; private set; }
    public Dictionary<string, object> ConsentDetails { get; private set; } = new();
}

public class UserPreferences : ValueObject
{
    public string Theme { get; private set; } = "dark";
    public string Language { get; private set; } = "en";
    public string Timezone { get; private set; } = "UTC";
    public bool EmailNotifications { get; private set; } = true;
    public bool PushNotifications { get; private set; } = true;
    public NotificationPreferences NotificationSettings { get; private set; }
    public GameplayPreferences GameplaySettings { get; private set; }
    public AccessibilityPreferences AccessibilitySettings { get; private set; }
    public Dictionary<string, object> CustomPreferences { get; private set; } = new();

    public static UserPreferences CreateDefault()
    {
        return new UserPreferences
        {
            NotificationSettings = NotificationPreferences.CreateDefault(),
            GameplaySettings = GameplayPreferences.CreateDefault(),
            AccessibilitySettings = AccessibilityPreferences.CreateDefault()
        };
    }

    public UserPreferences Update(UserPreferences newPreferences)
    {
        return new UserPreferences
        {
            Theme = newPreferences.Theme ?? Theme,
            Language = newPreferences.Language ?? Language,
            Timezone = newPreferences.Timezone ?? Timezone,
            EmailNotifications = newPreferences.EmailNotifications,
            PushNotifications = newPreferences.PushNotifications,
            NotificationSettings = newPreferences.NotificationSettings ?? NotificationSettings,
            GameplaySettings = newPreferences.GameplaySettings ?? GameplaySettings,
            AccessibilitySettings = newPreferences.AccessibilitySettings ?? AccessibilitySettings,
            CustomPreferences = newPreferences.CustomPreferences ?? CustomPreferences
        };
    }
}

public class NotificationPreferences : ValueObject
{
    public bool CampaignInvites { get; private set; } = true;
    public bool SessionReminders { get; private set; } = true;
    public bool FriendRequests { get; private set; } = true;
    public bool DirectMessages { get; private set; } = true;
    public bool SystemUpdates { get; private set; } = true;
    public bool MarketingEmails { get; private set; } = false;

    public static NotificationPreferences CreateDefault()
    {
        return new NotificationPreferences();
    }
}
```

This User Management business logic specification provides:

1. **Complete User Lifecycle Management** - Registration, verification, profile management, and account lifecycle
2. **Robust Authentication System** - Secure password handling, email verification, and session management
3. **Subscription Management** - Full subscription lifecycle with payment processing and plan changes
4. **Social Features** - Friend system with privacy controls and user discovery
5. **Privacy and Security** - Comprehensive privacy settings and data protection
6. **User Preferences** - Customizable user experience with themes, notifications, and accessibility
7. **Role-Based Authorization** - Flexible permission system with subscription-based features
8. **Event-Driven Architecture** - Domain events for user actions and integrations

The specification ensures secure, compliant, and user-friendly account management while providing rich social features and subscription capabilities for the D&D AI Campaign Management System.

<function_calls>
<invoke name="todo_write">
<parameter name="merge">true
