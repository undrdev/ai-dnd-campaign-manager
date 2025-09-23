# Notification Service Implementation Specification

## Overview
The Notification Service manages all user communications for the D&D AI Campaign Management System, including real-time notifications, email campaigns, push notifications, in-app alerts, and communication preferences. It provides a unified notification platform with multi-channel delivery, personalization, and comprehensive tracking.

## Service Architecture

### Technology Stack
- **Framework**: ASP.NET Core 8.0
- **Database**: PostgreSQL with Entity Framework Core
- **Message Queue**: Redis for notification queuing and delivery
- **Email Service**: SendGrid / AWS SES for transactional and marketing emails
- **Push Notifications**: Firebase Cloud Messaging (FCM) for mobile push notifications
- **Real-time**: SignalR for instant in-app notifications
- **Template Engine**: Razor for email templates, custom template system for notifications
- **Caching**: Redis for user preferences and notification history
- **Background Processing**: Hangfire for scheduled notifications and retries
- **Monitoring**: Prometheus metrics and structured logging

### Project Structure
```
NotificationService/
├── src/
│   ├── NotificationService.Api/           # Web API layer
│   │   ├── Controllers/
│   │   │   ├── NotificationController.cs  # Notification management
│   │   │   ├── PreferencesController.cs   # User preferences
│   │   │   ├── TemplateController.cs      # Template management
│   │   │   └── WebhookController.cs       # External webhook handling
│   │   ├── Hubs/
│   │   │   └── NotificationHub.cs         # SignalR real-time notifications
│   │   ├── BackgroundServices/
│   │   │   ├── NotificationProcessorService.cs
│   │   │   └── DeliveryRetryService.cs
│   │   ├── Program.cs
│   │   └── appsettings.json
│   ├── NotificationService.Application/   # Application layer
│   │   ├── Commands/
│   │   │   ├── SendNotificationCommand.cs
│   │   │   ├── SendBulkNotificationCommand.cs
│   │   │   ├── ScheduleNotificationCommand.cs
│   │   │   └── UpdatePreferencesCommand.cs
│   │   ├── Queries/
│   │   │   ├── GetNotificationHistoryQuery.cs
│   │   │   ├── GetUserPreferencesQuery.cs
│   │   │   └── GetNotificationStatsQuery.cs
│   │   ├── Handlers/
│   │   ├── Services/
│   │   │   ├── EmailDelivery/              # Email service integration
│   │   │   ├── PushNotifications/          # Mobile push notifications
│   │   │   ├── InAppNotifications/         # Real-time in-app notifications
│   │   │   ├── TemplateEngine/             # Template processing
│   │   │   ├── PersonalizationEngine/      # Content personalization
│   │   │   └── DeliveryTracking/           # Delivery and engagement tracking
│   │   └── DTOs/
│   ├── NotificationService.Domain/        # Domain layer
│   │   ├── Entities/
│   │   │   ├── Notification.cs
│   │   │   ├── NotificationTemplate.cs
│   │   │   ├── UserPreferences.cs
│   │   │   ├── DeliveryAttempt.cs
│   │   │   └── NotificationCampaign.cs
│   │   ├── ValueObjects/
│   │   │   ├── NotificationContent.cs
│   │   │   ├── DeliveryChannel.cs
│   │   │   ├── RecipientInfo.cs
│   │   │   └── SchedulingInfo.cs
│   │   ├── Events/
│   │   ├── Repositories/
│   │   └── Services/
│   └── NotificationService.Infrastructure/ # Infrastructure layer
│       ├── Data/
│       ├── Repositories/
│       ├── Delivery/
│       │   ├── EmailDeliveryService.cs     # SendGrid/SES integration
│       │   ├── PushDeliveryService.cs      # FCM integration
│       │   ├── InAppDeliveryService.cs     # SignalR integration
│       │   └── SMSDeliveryService.cs       # SMS integration (future)
│       ├── Templates/
│       │   ├── RazorTemplateEngine.cs      # Email template rendering
│       │   └── NotificationTemplateEngine.cs # Notification templates
│       ├── Personalization/
│       │   └── PersonalizationService.cs   # Content personalization
│       └── Tracking/
│           ├── DeliveryTrackingService.cs  # Delivery tracking
│           └── EngagementTrackingService.cs # Click/open tracking
└── tests/
    ├── NotificationService.UnitTests/
    ├── NotificationService.IntegrationTests/
    └── NotificationService.DeliveryTests/
```

## Domain Model

### Core Entities

#### **Notification Entity**
```csharp
public class Notification : Entity, IAggregateRoot
{
    public Guid Id { get; private set; }
    public string Title { get; private set; }
    public NotificationContent Content { get; private set; }
    public NotificationType Type { get; private set; }
    public NotificationCategory Category { get; private set; }
    public NotificationPriority Priority { get; private set; }
    public NotificationStatus Status { get; private set; }
    
    // Recipients
    public List<RecipientInfo> Recipients { get; private set; } = new();
    public List<DeliveryChannel> DeliveryChannels { get; private set; } = new();
    
    // Scheduling
    public SchedulingInfo? SchedulingInfo { get; private set; }
    public DateTime? ScheduledFor { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public Guid CreatedBy { get; private set; }
    
    // Template and personalization
    public Guid? TemplateId { get; private set; }
    public Dictionary<string, object> PersonalizationData { get; private set; } = new();
    
    // Campaign association
    public Guid? CampaignId { get; private set; }
    public Guid? DnDCampaignId { get; private set; }
    public Guid? SessionId { get; private set; }
    
    // Delivery tracking
    public List<DeliveryAttempt> DeliveryAttempts { get; private set; } = new();
    public DateTime? FirstDeliveredAt { get; private set; }
    public DateTime? LastDeliveredAt { get; private set; }
    public int TotalRecipients { get; private set; }
    public int SuccessfulDeliveries { get; private set; }
    public int FailedDeliveries { get; private set; }
    
    // Engagement tracking
    public int OpenCount { get; private set; }
    public int ClickCount { get; private set; }
    public DateTime? FirstOpenedAt { get; private set; }
    public DateTime? LastClickedAt { get; private set; }

    protected Notification() { } // EF Constructor

    public Notification(
        string title,
        NotificationContent content,
        NotificationType type,
        NotificationCategory category,
        Guid createdBy,
        NotificationPriority priority = NotificationPriority.Normal)
    {
        Id = Guid.NewGuid();
        Title = title;
        Content = content;
        Type = type;
        Category = category;
        Priority = priority;
        Status = NotificationStatus.Draft;
        CreatedAt = DateTime.UtcNow;
        CreatedBy = createdBy;
        
        AddDomainEvent(new NotificationCreatedEvent(Id, type, category));
    }

    public void AddRecipient(RecipientInfo recipient)
    {
        if (Recipients.Any(r => r.UserId == recipient.UserId))
            return; // Already added
            
        Recipients.Add(recipient);
        TotalRecipients = Recipients.Count;
        
        AddDomainEvent(new RecipientAddedEvent(Id, recipient.UserId));
    }

    public void AddRecipients(IEnumerable<RecipientInfo> recipients)
    {
        foreach (var recipient in recipients)
        {
            AddRecipient(recipient);
        }
    }

    public void SetScheduling(SchedulingInfo schedulingInfo, DateTime? scheduledFor = null)
    {
        SchedulingInfo = schedulingInfo;
        ScheduledFor = scheduledFor ?? schedulingInfo.CalculateNextDelivery();
        
        if (ScheduledFor.HasValue)
        {
            Status = NotificationStatus.Scheduled;
            AddDomainEvent(new NotificationScheduledEvent(Id, ScheduledFor.Value));
        }
    }

    public void SetTemplate(Guid templateId, Dictionary<string, object>? personalizationData = null)
    {
        TemplateId = templateId;
        if (personalizationData != null)
        {
            PersonalizationData = personalizationData;
        }
    }

    public void AddDeliveryChannel(DeliveryChannel channel)
    {
        if (!DeliveryChannels.Contains(channel))
        {
            DeliveryChannels.Add(channel);
        }
    }

    public void Send()
    {
        if (Status != NotificationStatus.Draft && Status != NotificationStatus.Scheduled)
        {
            throw new InvalidOperationException($"Cannot send notification in status {Status}");
        }

        Status = NotificationStatus.Sending;
        AddDomainEvent(new NotificationSendingEvent(Id, Recipients.Count));
    }

    public void RecordDeliveryAttempt(DeliveryAttempt attempt)
    {
        DeliveryAttempts.Add(attempt);
        
        if (attempt.IsSuccessful)
        {
            SuccessfulDeliveries++;
            
            if (FirstDeliveredAt == null)
            {
                FirstDeliveredAt = attempt.AttemptedAt;
            }
            LastDeliveredAt = attempt.AttemptedAt;
        }
        else
        {
            FailedDeliveries++;
        }

        // Update overall status
        UpdateStatus();
        
        AddDomainEvent(new DeliveryAttemptRecordedEvent(Id, attempt.RecipientUserId, 
                                                       attempt.Channel, attempt.IsSuccessful));
    }

    public void RecordOpen(Guid userId, string? userAgent = null, string? ipAddress = null)
    {
        OpenCount++;
        
        if (FirstOpenedAt == null)
        {
            FirstOpenedAt = DateTime.UtcNow;
        }

        AddDomainEvent(new NotificationOpenedEvent(Id, userId, userAgent, ipAddress));
    }

    public void RecordClick(Guid userId, string clickedUrl, string? userAgent = null, string? ipAddress = null)
    {
        ClickCount++;
        LastClickedAt = DateTime.UtcNow;
        
        AddDomainEvent(new NotificationClickedEvent(Id, userId, clickedUrl, userAgent, ipAddress));
    }

    private void UpdateStatus()
    {
        if (SuccessfulDeliveries == 0 && FailedDeliveries > 0)
        {
            Status = NotificationStatus.Failed;
        }
        else if (SuccessfulDeliveries > 0 && FailedDeliveries == 0)
        {
            Status = NotificationStatus.Delivered;
        }
        else if (SuccessfulDeliveries > 0 && FailedDeliveries > 0)
        {
            Status = NotificationStatus.PartiallyDelivered;
        }
    }

    public void Cancel()
    {
        if (Status == NotificationStatus.Scheduled)
        {
            Status = NotificationStatus.Cancelled;
            AddDomainEvent(new NotificationCancelledEvent(Id));
        }
    }

    public bool CanBeSent()
    {
        return Status == NotificationStatus.Draft || Status == NotificationStatus.Scheduled;
    }

    public bool ShouldRetryDelivery(DeliveryChannel channel)
    {
        var channelAttempts = DeliveryAttempts
            .Where(a => a.Channel == channel && !a.IsSuccessful)
            .Count();
            
        return channelAttempts < GetMaxRetries(channel);
    }

    private int GetMaxRetries(DeliveryChannel channel)
    {
        return channel switch
        {
            DeliveryChannel.Email => 3,
            DeliveryChannel.Push => 2,
            DeliveryChannel.InApp => 1,
            DeliveryChannel.SMS => 2,
            _ => 1
        };
    }
}
```

#### **NotificationTemplate Entity**
```csharp
public class NotificationTemplate : Entity, IAggregateRoot
{
    public Guid Id { get; private set; }
    public string Name { get; private set; }
    public string Description { get; private set; }
    public NotificationType Type { get; private set; }
    public NotificationCategory Category { get; private set; }
    public TemplateStatus Status { get; private set; }
    
    // Template content for different channels
    public TemplateContent EmailTemplate { get; private set; }
    public TemplateContent PushTemplate { get; private set; }
    public TemplateContent InAppTemplate { get; private set; }
    public TemplateContent SMSTemplate { get; private set; }
    
    // Personalization
    public List<string> RequiredVariables { get; private set; } = new();
    public List<string> OptionalVariables { get; private set; } = new();
    public Dictionary<string, object> DefaultValues { get; private set; } = new();
    
    // Metadata
    public DateTime CreatedAt { get; private set; }
    public Guid CreatedBy { get; private set; }
    public DateTime? LastModifiedAt { get; private set; }
    public Guid? LastModifiedBy { get; private set; }
    public int Version { get; private set; }
    
    // Usage tracking
    public int UsageCount { get; private set; }
    public DateTime? LastUsedAt { get; private set; }

    protected NotificationTemplate() { } // EF Constructor

    public NotificationTemplate(
        string name,
        string description,
        NotificationType type,
        NotificationCategory category,
        Guid createdBy)
    {
        Id = Guid.NewGuid();
        Name = name;
        Description = description;
        Type = type;
        Category = category;
        CreatedBy = createdBy;
        CreatedAt = DateTime.UtcNow;
        Status = TemplateStatus.Draft;
        Version = 1;
        
        // Initialize empty templates
        EmailTemplate = new TemplateContent();
        PushTemplate = new TemplateContent();
        InAppTemplate = new TemplateContent();
        SMSTemplate = new TemplateContent();
        
        AddDomainEvent(new NotificationTemplateCreatedEvent(Id, name, type));
    }

    public void UpdateEmailTemplate(string subject, string htmlBody, string? textBody = null)
    {
        EmailTemplate = new TemplateContent
        {
            Subject = subject,
            HtmlBody = htmlBody,
            TextBody = textBody ?? ExtractTextFromHtml(htmlBody),
            LastModifiedAt = DateTime.UtcNow
        };
        
        UpdateModificationInfo();
    }

    public void UpdatePushTemplate(string title, string body, string? icon = null, Dictionary<string, string>? data = null)
    {
        PushTemplate = new TemplateContent
        {
            Title = title,
            Body = body,
            Icon = icon,
            Data = data ?? new Dictionary<string, string>(),
            LastModifiedAt = DateTime.UtcNow
        };
        
        UpdateModificationInfo();
    }

    public void UpdateInAppTemplate(string title, string message, string? actionUrl = null, string? iconUrl = null)
    {
        InAppTemplate = new TemplateContent
        {
            Title = title,
            Body = message,
            ActionUrl = actionUrl,
            IconUrl = iconUrl,
            LastModifiedAt = DateTime.UtcNow
        };
        
        UpdateModificationInfo();
    }

    public void UpdateSMSTemplate(string message)
    {
        if (message.Length > 160)
        {
            throw new InvalidOperationException("SMS template message cannot exceed 160 characters");
        }

        SMSTemplate = new TemplateContent
        {
            Body = message,
            LastModifiedAt = DateTime.UtcNow
        };
        
        UpdateModificationInfo();
    }

    public void SetRequiredVariables(IEnumerable<string> variables)
    {
        RequiredVariables = variables.ToList();
        UpdateModificationInfo();
    }

    public void SetOptionalVariables(IEnumerable<string> variables)
    {
        OptionalVariables = variables.ToList();
        UpdateModificationInfo();
    }

    public void SetDefaultValues(Dictionary<string, object> defaultValues)
    {
        DefaultValues = defaultValues;
        UpdateModificationInfo();
    }

    public void Publish()
    {
        if (Status == TemplateStatus.Draft)
        {
            Status = TemplateStatus.Published;
            AddDomainEvent(new NotificationTemplatePublishedEvent(Id, Version));
        }
    }

    public void Archive()
    {
        Status = TemplateStatus.Archived;
        AddDomainEvent(new NotificationTemplateArchivedEvent(Id));
    }

    public void RecordUsage()
    {
        UsageCount++;
        LastUsedAt = DateTime.UtcNow;
    }

    public bool ValidatePersonalizationData(Dictionary<string, object> data)
    {
        // Check that all required variables are present
        return RequiredVariables.All(variable => data.ContainsKey(variable));
    }

    public Dictionary<string, object> MergeWithDefaults(Dictionary<string, object> data)
    {
        var merged = new Dictionary<string, object>(DefaultValues);
        
        foreach (var kvp in data)
        {
            merged[kvp.Key] = kvp.Value;
        }
        
        return merged;
    }

    private void UpdateModificationInfo()
    {
        LastModifiedAt = DateTime.UtcNow;
        // LastModifiedBy would be set by the application layer
    }

    private string ExtractTextFromHtml(string htmlBody)
    {
        // Simple HTML to text conversion
        // In a real implementation, use a proper HTML parser
        return System.Text.RegularExpressions.Regex.Replace(htmlBody, "<.*?>", string.Empty);
    }
}
```

#### **UserPreferences Entity**
```csharp
public class UserPreferences : Entity
{
    public Guid Id { get; private set; }
    public Guid UserId { get; private set; }
    
    // Channel preferences
    public bool EmailEnabled { get; private set; } = true;
    public bool PushEnabled { get; private set; } = true;
    public bool InAppEnabled { get; private set; } = true;
    public bool SMSEnabled { get; private set; } = false;
    
    // Category preferences
    public Dictionary<NotificationCategory, ChannelPreferences> CategoryPreferences { get; private set; } = new();
    
    // Scheduling preferences
    public TimeZoneInfo TimeZone { get; private set; }
    public QuietHours? QuietHours { get; private set; }
    public List<DayOfWeek> PreferredDays { get; private set; } = new();
    public TimeSpan? PreferredTime { get; private set; }
    
    // Frequency preferences
    public NotificationFrequency EmailFrequency { get; private set; } = NotificationFrequency.Immediate;
    public NotificationFrequency PushFrequency { get; private set; } = NotificationFrequency.Immediate;
    public bool DigestEnabled { get; private set; } = false;
    public DigestFrequency DigestFrequency { get; private set; } = DigestFrequency.Daily;
    public TimeSpan DigestTime { get; private set; } = new TimeSpan(9, 0, 0); // 9 AM
    
    // Contact information
    public string? PhoneNumber { get; private set; }
    public bool PhoneNumberVerified { get; private set; } = false;
    public string? PushToken { get; private set; }
    public string? DeviceId { get; private set; }
    
    // Metadata
    public DateTime CreatedAt { get; private set; }
    public DateTime LastUpdatedAt { get; private set; }

    protected UserPreferences() { } // EF Constructor

    public UserPreferences(Guid userId, string timeZoneId = "UTC")
    {
        Id = Guid.NewGuid();
        UserId = userId;
        TimeZone = TimeZoneInfo.FindSystemTimeZoneById(timeZoneId);
        CreatedAt = DateTime.UtcNow;
        LastUpdatedAt = DateTime.UtcNow;
        
        InitializeDefaultCategoryPreferences();
    }

    public void UpdateChannelPreferences(bool email, bool push, bool inApp, bool sms = false)
    {
        EmailEnabled = email;
        PushEnabled = push;
        InAppEnabled = inApp;
        SMSEnabled = sms;
        LastUpdatedAt = DateTime.UtcNow;
    }

    public void UpdateCategoryPreferences(NotificationCategory category, ChannelPreferences preferences)
    {
        CategoryPreferences[category] = preferences;
        LastUpdatedAt = DateTime.UtcNow;
    }

    public void SetTimeZone(string timeZoneId)
    {
        TimeZone = TimeZoneInfo.FindSystemTimeZoneById(timeZoneId);
        LastUpdatedAt = DateTime.UtcNow;
    }

    public void SetQuietHours(TimeSpan startTime, TimeSpan endTime)
    {
        QuietHours = new QuietHours(startTime, endTime);
        LastUpdatedAt = DateTime.UtcNow;
    }

    public void SetPreferredSchedule(IEnumerable<DayOfWeek> preferredDays, TimeSpan? preferredTime = null)
    {
        PreferredDays = preferredDays.ToList();
        PreferredTime = preferredTime;
        LastUpdatedAt = DateTime.UtcNow;
    }

    public void UpdateFrequencyPreferences(NotificationFrequency emailFreq, NotificationFrequency pushFreq)
    {
        EmailFrequency = emailFreq;
        PushFrequency = pushFreq;
        LastUpdatedAt = DateTime.UtcNow;
    }

    public void EnableDigest(DigestFrequency frequency, TimeSpan time)
    {
        DigestEnabled = true;
        DigestFrequency = frequency;
        DigestTime = time;
        LastUpdatedAt = DateTime.UtcNow;
    }

    public void DisableDigest()
    {
        DigestEnabled = false;
        LastUpdatedAt = DateTime.UtcNow;
    }

    public void SetPhoneNumber(string phoneNumber, bool verified = false)
    {
        PhoneNumber = phoneNumber;
        PhoneNumberVerified = verified;
        LastUpdatedAt = DateTime.UtcNow;
    }

    public void VerifyPhoneNumber()
    {
        PhoneNumberVerified = true;
        LastUpdatedAt = DateTime.UtcNow;
    }

    public void UpdatePushToken(string pushToken, string? deviceId = null)
    {
        PushToken = pushToken;
        if (!string.IsNullOrEmpty(deviceId))
        {
            DeviceId = deviceId;
        }
        LastUpdatedAt = DateTime.UtcNow;
    }

    public bool ShouldReceiveNotification(NotificationCategory category, DeliveryChannel channel, DateTime scheduledTime)
    {
        // Check if channel is globally enabled
        var channelEnabled = channel switch
        {
            DeliveryChannel.Email => EmailEnabled,
            DeliveryChannel.Push => PushEnabled,
            DeliveryChannel.InApp => InAppEnabled,
            DeliveryChannel.SMS => SMSEnabled,
            _ => false
        };

        if (!channelEnabled) return false;

        // Check category-specific preferences
        if (CategoryPreferences.TryGetValue(category, out var categoryPrefs))
        {
            var categoryChannelEnabled = channel switch
            {
                DeliveryChannel.Email => categoryPrefs.EmailEnabled,
                DeliveryChannel.Push => categoryPrefs.PushEnabled,
                DeliveryChannel.InApp => categoryPrefs.InAppEnabled,
                DeliveryChannel.SMS => categoryPrefs.SMSEnabled,
                _ => false
            };

            if (!categoryChannelEnabled) return false;
        }

        // Check quiet hours
        if (QuietHours != null && IsInQuietHours(scheduledTime))
        {
            return false;
        }

        return true;
    }

    public bool IsInQuietHours(DateTime dateTime)
    {
        if (QuietHours == null) return false;

        var userTime = TimeZoneInfo.ConvertTimeFromUtc(dateTime, TimeZone);
        var timeOfDay = userTime.TimeOfDay;

        return QuietHours.IsInQuietPeriod(timeOfDay);
    }

    private void InitializeDefaultCategoryPreferences()
    {
        var categories = Enum.GetValues<NotificationCategory>();
        foreach (var category in categories)
        {
            CategoryPreferences[category] = new ChannelPreferences
            {
                EmailEnabled = GetDefaultEmailEnabled(category),
                PushEnabled = GetDefaultPushEnabled(category),
                InAppEnabled = true, // Always enabled by default
                SMSEnabled = false   // Always disabled by default
            };
        }
    }

    private bool GetDefaultEmailEnabled(NotificationCategory category)
    {
        return category switch
        {
            NotificationCategory.Security => true,
            NotificationCategory.Account => true,
            NotificationCategory.Campaign => true,
            NotificationCategory.Session => false, // Too frequent for email
            NotificationCategory.Social => false,
            NotificationCategory.Marketing => false,
            NotificationCategory.System => true,
            _ => false
        };
    }

    private bool GetDefaultPushEnabled(NotificationCategory category)
    {
        return category switch
        {
            NotificationCategory.Security => true,
            NotificationCategory.Account => true,
            NotificationCategory.Campaign => true,
            NotificationCategory.Session => true,
            NotificationCategory.Social => true,
            NotificationCategory.Marketing => false,
            NotificationCategory.System => false,
            _ => false
        };
    }
}
```

### Value Objects

#### **NotificationContent**
```csharp
public class NotificationContent : ValueObject
{
    public string Title { get; private set; }
    public string Message { get; private set; }
    public string? HtmlMessage { get; private set; }
    public string? ActionUrl { get; private set; }
    public string? ImageUrl { get; private set; }
    public string? IconUrl { get; private set; }
    public Dictionary<string, string> Data { get; private set; } = new();
    public List<NotificationAction> Actions { get; private set; } = new();

    public NotificationContent(string title, string message, string? htmlMessage = null)
    {
        if (string.IsNullOrWhiteSpace(title))
            throw new ArgumentException("Title cannot be empty", nameof(title));
        if (string.IsNullOrWhiteSpace(message))
            throw new ArgumentException("Message cannot be empty", nameof(message));

        Title = title;
        Message = message;
        HtmlMessage = htmlMessage;
    }

    public NotificationContent WithActionUrl(string actionUrl)
    {
        return new NotificationContent(Title, Message, HtmlMessage) { ActionUrl = actionUrl };
    }

    public NotificationContent WithImageUrl(string imageUrl)
    {
        return new NotificationContent(Title, Message, HtmlMessage) 
        { 
            ActionUrl = ActionUrl,
            ImageUrl = imageUrl 
        };
    }

    public NotificationContent WithIconUrl(string iconUrl)
    {
        return new NotificationContent(Title, Message, HtmlMessage) 
        { 
            ActionUrl = ActionUrl,
            ImageUrl = ImageUrl,
            IconUrl = iconUrl 
        };
    }

    public NotificationContent WithData(Dictionary<string, string> data)
    {
        return new NotificationContent(Title, Message, HtmlMessage) 
        { 
            ActionUrl = ActionUrl,
            ImageUrl = ImageUrl,
            IconUrl = IconUrl,
            Data = data 
        };
    }

    public NotificationContent WithActions(IEnumerable<NotificationAction> actions)
    {
        return new NotificationContent(Title, Message, HtmlMessage) 
        { 
            ActionUrl = ActionUrl,
            ImageUrl = ImageUrl,
            IconUrl = IconUrl,
            Data = Data,
            Actions = actions.ToList()
        };
    }

    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return Title;
        yield return Message;
        yield return HtmlMessage ?? string.Empty;
        yield return ActionUrl ?? string.Empty;
        yield return ImageUrl ?? string.Empty;
        yield return IconUrl ?? string.Empty;
        
        foreach (var kvp in Data.OrderBy(x => x.Key))
        {
            yield return kvp.Key;
            yield return kvp.Value;
        }
        
        foreach (var action in Actions.OrderBy(x => x.Id))
        {
            yield return action;
        }
    }
}

public class NotificationAction : ValueObject
{
    public string Id { get; private set; }
    public string Title { get; private set; }
    public string ActionUrl { get; private set; }
    public NotificationActionType ActionType { get; private set; }

    public NotificationAction(string id, string title, string actionUrl, NotificationActionType actionType = NotificationActionType.Link)
    {
        Id = id;
        Title = title;
        ActionUrl = actionUrl;
        ActionType = actionType;
    }

    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return Id;
        yield return Title;
        yield return ActionUrl;
        yield return ActionType;
    }
}
```

#### **RecipientInfo & DeliveryAttempt**
```csharp
public class RecipientInfo : ValueObject
{
    public Guid UserId { get; private set; }
    public string Email { get; private set; }
    public string? DisplayName { get; private set; }
    public string? PhoneNumber { get; private set; }
    public string? PushToken { get; private set; }
    public Dictionary<string, object> PersonalizationData { get; private set; } = new();

    public RecipientInfo(Guid userId, string email, string? displayName = null)
    {
        UserId = userId;
        Email = email;
        DisplayName = displayName;
    }

    public RecipientInfo WithPhoneNumber(string phoneNumber)
    {
        return new RecipientInfo(UserId, Email, DisplayName) { PhoneNumber = phoneNumber };
    }

    public RecipientInfo WithPushToken(string pushToken)
    {
        return new RecipientInfo(UserId, Email, DisplayName) 
        { 
            PhoneNumber = PhoneNumber,
            PushToken = pushToken 
        };
    }

    public RecipientInfo WithPersonalizationData(Dictionary<string, object> data)
    {
        return new RecipientInfo(UserId, Email, DisplayName) 
        { 
            PhoneNumber = PhoneNumber,
            PushToken = PushToken,
            PersonalizationData = data 
        };
    }

    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return UserId;
        yield return Email;
        yield return DisplayName ?? string.Empty;
    }
}

public class DeliveryAttempt : ValueObject
{
    public Guid RecipientUserId { get; private set; }
    public DeliveryChannel Channel { get; private set; }
    public DateTime AttemptedAt { get; private set; }
    public bool IsSuccessful { get; private set; }
    public string? ErrorMessage { get; private set; }
    public string? ExternalId { get; private set; } // Provider-specific ID
    public TimeSpan ProcessingTime { get; private set; }
    public Dictionary<string, string> Metadata { get; private set; } = new();

    public DeliveryAttempt(
        Guid recipientUserId,
        DeliveryChannel channel,
        bool isSuccessful,
        string? errorMessage = null,
        string? externalId = null,
        TimeSpan? processingTime = null)
    {
        RecipientUserId = recipientUserId;
        Channel = channel;
        AttemptedAt = DateTime.UtcNow;
        IsSuccessful = isSuccessful;
        ErrorMessage = errorMessage;
        ExternalId = externalId;
        ProcessingTime = processingTime ?? TimeSpan.Zero;
    }

    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return RecipientUserId;
        yield return Channel;
        yield return AttemptedAt;
        yield return IsSuccessful;
        yield return ErrorMessage ?? string.Empty;
    }
}
```

### Enumerations

```csharp
public enum NotificationType
{
    Transactional = 1,  // Account, security, system notifications
    Marketing = 2,      // Promotional, feature announcements
    Campaign = 3,       // D&D campaign-related notifications
    Social = 4,         // Friend requests, mentions, comments
    System = 5          // System maintenance, updates
}

public enum NotificationCategory
{
    Security = 1,       // Password changes, login alerts
    Account = 2,        // Profile updates, subscription changes
    Campaign = 3,       // Campaign invites, updates, session reminders
    Session = 4,        // Session starting, player actions, dice rolls
    Social = 5,         // Friend requests, mentions, shares
    Marketing = 6,      // Feature announcements, promotions
    System = 7,         // Maintenance, updates, outages
    AI = 8             // AI generation completed, quality issues
}

public enum NotificationPriority
{
    Low = 1,
    Normal = 2,
    High = 3,
    Critical = 4
}

public enum NotificationStatus
{
    Draft = 1,
    Scheduled = 2,
    Sending = 3,
    Delivered = 4,
    PartiallyDelivered = 5,
    Failed = 6,
    Cancelled = 7
}

public enum DeliveryChannel
{
    Email = 1,
    Push = 2,
    InApp = 3,
    SMS = 4
}

public enum TemplateStatus
{
    Draft = 1,
    Published = 2,
    Archived = 3
}

public enum NotificationFrequency
{
    Immediate = 1,
    Hourly = 2,
    Daily = 3,
    Weekly = 4,
    Never = 5
}

public enum DigestFrequency
{
    Daily = 1,
    Weekly = 2,
    Monthly = 3
}

public enum NotificationActionType
{
    Link = 1,
    Button = 2,
    Dismiss = 3
}
```

## Application Layer

### Commands and Handlers

#### **Send Notification Command**
```csharp
public record SendNotificationCommand : IRequest<SendNotificationResponse>
{
    public string Title { get; init; } = string.Empty;
    public string Message { get; init; } = string.Empty;
    public string? HtmlMessage { get; init; }
    public NotificationType Type { get; init; }
    public NotificationCategory Category { get; init; }
    public NotificationPriority Priority { get; init; } = NotificationPriority.Normal;
    public List<Guid> RecipientUserIds { get; init; } = new();
    public List<DeliveryChannel> DeliveryChannels { get; init; } = new();
    public Guid? TemplateId { get; init; }
    public Dictionary<string, object> PersonalizationData { get; init; } = new();
    public DateTime? ScheduleFor { get; init; }
    public Guid? CampaignId { get; init; }
    public Guid? SessionId { get; init; }
    public Guid SentBy { get; init; }
}

public class SendNotificationCommandHandler : IRequestHandler<SendNotificationCommand, SendNotificationResponse>
{
    private readonly INotificationRepository _notificationRepository;
    private readonly IUserPreferencesRepository _preferencesRepository;
    private readonly INotificationTemplateRepository _templateRepository;
    private readonly INotificationDeliveryService _deliveryService;
    private readonly IPersonalizationService _personalizationService;
    private readonly ILogger<SendNotificationCommandHandler> _logger;

    public async Task<SendNotificationResponse> Handle(SendNotificationCommand request, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Processing notification send request for {RecipientCount} recipients", 
            request.RecipientUserIds.Count);

        // 1. Create notification content
        var content = new NotificationContent(request.Title, request.Message, request.HtmlMessage);
        
        // 2. Create notification entity
        var notification = new Notification(
            request.Title,
            content,
            request.Type,
            request.Category,
            request.SentBy,
            request.Priority);

        // 3. Set template if provided
        if (request.TemplateId.HasValue)
        {
            var template = await _templateRepository.GetByIdAsync(request.TemplateId.Value, cancellationToken);
            if (template == null)
            {
                throw new TemplateNotFoundException($"Template {request.TemplateId} not found");
            }
            
            notification.SetTemplate(request.TemplateId.Value, request.PersonalizationData);
            template.RecordUsage();
        }

        // 4. Set campaign/session association
        if (request.CampaignId.HasValue)
        {
            notification.DnDCampaignId = request.CampaignId;
        }
        if (request.SessionId.HasValue)
        {
            notification.SessionId = request.SessionId;
        }

        // 5. Add delivery channels
        foreach (var channel in request.DeliveryChannels)
        {
            notification.AddDeliveryChannel(channel);
        }

        // 6. Process recipients with preferences
        var recipients = await ProcessRecipientsAsync(request.RecipientUserIds, request.PersonalizationData);
        notification.AddRecipients(recipients);

        // 7. Handle scheduling
        if (request.ScheduleFor.HasValue)
        {
            var schedulingInfo = new SchedulingInfo(SchedulingType.OneTime, request.ScheduleFor.Value);
            notification.SetScheduling(schedulingInfo, request.ScheduleFor.Value);
        }

        // 8. Save notification
        await _notificationRepository.AddAsync(notification, cancellationToken);
        await _notificationRepository.UnitOfWork.SaveEntitiesAsync(cancellationToken);

        // 9. Send immediately or schedule
        if (!request.ScheduleFor.HasValue)
        {
            await SendNotificationAsync(notification);
        }

        return new SendNotificationResponse
        {
            NotificationId = notification.Id,
            Status = notification.Status,
            RecipientCount = notification.TotalRecipients,
            ScheduledFor = notification.ScheduledFor
        };
    }

    private async Task<List<RecipientInfo>> ProcessRecipientsAsync(
        List<Guid> userIds, 
        Dictionary<string, object> basePersonalizationData)
    {
        var recipients = new List<RecipientInfo>();

        foreach (var userId in userIds)
        {
            var userInfo = await GetUserInfoAsync(userId);
            if (userInfo == null) continue;

            // Merge base personalization data with user-specific data
            var personalizationData = new Dictionary<string, object>(basePersonalizationData);
            await _personalizationService.EnrichUserDataAsync(userId, personalizationData);

            var recipient = new RecipientInfo(userId, userInfo.Email, userInfo.DisplayName)
                .WithPersonalizationData(personalizationData);

            if (!string.IsNullOrEmpty(userInfo.PhoneNumber))
            {
                recipient = recipient.WithPhoneNumber(userInfo.PhoneNumber);
            }

            if (!string.IsNullOrEmpty(userInfo.PushToken))
            {
                recipient = recipient.WithPushToken(userInfo.PushToken);
            }

            recipients.Add(recipient);
        }

        return recipients;
    }

    private async Task SendNotificationAsync(Notification notification)
    {
        notification.Send();
        
        // Queue for delivery
        await _deliveryService.QueueNotificationAsync(notification);
        
        await _notificationRepository.UnitOfWork.SaveEntitiesAsync(CancellationToken.None);
    }
}
```

#### **Schedule Recurring Notification Command**
```csharp
public record ScheduleRecurringNotificationCommand : IRequest<ScheduleRecurringNotificationResponse>
{
    public string Title { get; init; } = string.Empty;
    public string Message { get; init; } = string.Empty;
    public NotificationType Type { get; init; }
    public NotificationCategory Category { get; init; }
    public List<Guid> RecipientUserIds { get; init; } = new();
    public List<DeliveryChannel> DeliveryChannels { get; init; } = new();
    public RecurrencePattern RecurrencePattern { get; init; } = null!;
    public DateTime StartDate { get; init; }
    public DateTime? EndDate { get; init; }
    public Guid? TemplateId { get; init; }
    public Guid CreatedBy { get; init; }
}

public class ScheduleRecurringNotificationCommandHandler : IRequestHandler<ScheduleRecurringNotificationCommand, ScheduleRecurringNotificationResponse>
{
    private readonly INotificationCampaignRepository _campaignRepository;
    private readonly IBackgroundJobScheduler _jobScheduler;
    private readonly ILogger<ScheduleRecurringNotificationCommandHandler> _logger;

    public async Task<ScheduleRecurringNotificationResponse> Handle(ScheduleRecurringNotificationCommand request, CancellationToken cancellationToken)
    {
        // Create notification campaign for recurring notifications
        var campaign = new NotificationCampaign(
            $"Recurring: {request.Title}",
            request.Type,
            request.Category,
            request.CreatedBy);

        campaign.SetRecurrence(request.RecurrencePattern, request.StartDate, request.EndDate);
        campaign.SetTemplate(request.TemplateId);
        campaign.SetRecipients(request.RecipientUserIds);
        campaign.SetDeliveryChannels(request.DeliveryChannels);

        await _campaignRepository.AddAsync(campaign, cancellationToken);
        await _campaignRepository.UnitOfWork.SaveEntitiesAsync(cancellationToken);

        // Schedule recurring job
        var jobId = await _jobScheduler.ScheduleRecurringJobAsync(
            $"notification-campaign-{campaign.Id}",
            () => ProcessRecurringNotificationAsync(campaign.Id),
            request.RecurrencePattern.ToCronExpression());

        campaign.SetScheduledJobId(jobId);
        await _campaignRepository.UnitOfWork.SaveEntitiesAsync(cancellationToken);

        return new ScheduleRecurringNotificationResponse
        {
            CampaignId = campaign.Id,
            JobId = jobId,
            NextExecutionTime = request.RecurrencePattern.GetNextOccurrence(request.StartDate)
        };
    }

    public async Task ProcessRecurringNotificationAsync(Guid campaignId)
    {
        var campaign = await _campaignRepository.GetByIdAsync(campaignId);
        if (campaign == null || !campaign.IsActive)
        {
            return;
        }

        // Create and send individual notification
        var notification = campaign.CreateNotificationInstance();
        
        // Process through normal notification flow
        // This would delegate to SendNotificationCommandHandler
    }
}
```

### Query Handlers

#### **Get Notification History Query**
```csharp
public record GetNotificationHistoryQuery : IRequest<GetNotificationHistoryResponse>
{
    public Guid? UserId { get; init; }
    public NotificationType? Type { get; init; }
    public NotificationCategory? Category { get; init; }
    public DateTime? StartDate { get; init; }
    public DateTime? EndDate { get; init; }
    public int Page { get; init; } = 1;
    public int PageSize { get; init; } = 20;
}

public class GetNotificationHistoryQueryHandler : IRequestHandler<GetNotificationHistoryQuery, GetNotificationHistoryResponse>
{
    private readonly INotificationRepository _repository;
    private readonly ICacheService _cacheService;

    public async Task<GetNotificationHistoryResponse> Handle(GetNotificationHistoryQuery request, CancellationToken cancellationToken)
    {
        var specification = new NotificationHistorySpecification(request);
        var notifications = await _repository.GetPagedAsync(specification, request.Page, request.PageSize);
        var totalCount = await _repository.CountAsync(specification);

        var response = new GetNotificationHistoryResponse
        {
            Notifications = notifications.Select(n => new NotificationHistoryDto
            {
                Id = n.Id,
                Title = n.Title,
                Message = n.Content.Message,
                Type = n.Type,
                Category = n.Category,
                Priority = n.Priority,
                Status = n.Status,
                CreatedAt = n.CreatedAt,
                ScheduledFor = n.ScheduledFor,
                TotalRecipients = n.TotalRecipients,
                SuccessfulDeliveries = n.SuccessfulDeliveries,
                FailedDeliveries = n.FailedDeliveries,
                OpenCount = n.OpenCount,
                ClickCount = n.ClickCount
            }).ToList(),
            
            TotalCount = totalCount,
            Page = request.Page,
            PageSize = request.PageSize,
            TotalPages = (int)Math.Ceiling((double)totalCount / request.PageSize)
        };

        return response;
    }
}
```

## Infrastructure Layer

### Delivery Services

#### **Email Delivery Service**
```csharp
public interface IEmailDeliveryService
{
    Task<DeliveryResult> SendEmailAsync(EmailMessage message);
    Task<DeliveryResult> SendBulkEmailAsync(List<EmailMessage> messages);
    Task<DeliveryStatus> GetDeliveryStatusAsync(string externalId);
    Task HandleWebhookAsync(string payload, string signature);
}

public class SendGridEmailDeliveryService : IEmailDeliveryService
{
    private readonly ISendGridClient _sendGridClient;
    private readonly IConfiguration _configuration;
    private readonly ILogger<SendGridEmailDeliveryService> _logger;

    public async Task<DeliveryResult> SendEmailAsync(EmailMessage message)
    {
        try
        {
            var sendGridMessage = new SendGridMessage
            {
                From = new EmailAddress(
                    _configuration["SendGrid:FromEmail"], 
                    _configuration["SendGrid:FromName"]),
                Subject = message.Subject,
                HtmlContent = message.HtmlBody,
                PlainTextContent = message.TextBody
            };

            sendGridMessage.AddTo(message.ToEmail, message.ToName);

            // Add custom headers for tracking
            sendGridMessage.AddCustomArg("notification_id", message.NotificationId.ToString());
            sendGridMessage.AddCustomArg("user_id", message.RecipientUserId.ToString());
            sendGridMessage.AddCategory(message.Category.ToString());

            // Add tracking settings
            sendGridMessage.SetOpenTracking(true);
            sendGridMessage.SetClickTracking(true, true);

            var response = await _sendGridClient.SendEmailAsync(sendGridMessage);

            return new DeliveryResult
            {
                IsSuccessful = response.IsSuccessStatusCode,
                ExternalId = ExtractMessageId(response.Headers),
                ErrorMessage = response.IsSuccessStatusCode ? null : await response.Body.ReadAsStringAsync(),
                ProcessingTime = TimeSpan.FromMilliseconds(100) // Approximate
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send email via SendGrid to {Email}", message.ToEmail);
            return new DeliveryResult
            {
                IsSuccessful = false,
                ErrorMessage = ex.Message
            };
        }
    }

    public async Task<DeliveryResult> SendBulkEmailAsync(List<EmailMessage> messages)
    {
        var sendGridMessages = messages.Select(msg => new SendGridMessage
        {
            From = new EmailAddress(_configuration["SendGrid:FromEmail"], _configuration["SendGrid:FromName"]),
            Subject = msg.Subject,
            HtmlContent = msg.HtmlBody,
            PlainTextContent = msg.TextBody,
            Personalizations = new List<Personalization>
            {
                new Personalization
                {
                    Tos = new List<EmailAddress> { new EmailAddress(msg.ToEmail, msg.ToName) }
                }
            }
        }).ToList();

        try
        {
            var response = await _sendGridClient.SendEmailAsync(sendGridMessages);
            
            return new DeliveryResult
            {
                IsSuccessful = response.IsSuccessStatusCode,
                ErrorMessage = response.IsSuccessStatusCode ? null : await response.Body.ReadAsStringAsync()
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send bulk email via SendGrid");
            return new DeliveryResult
            {
                IsSuccessful = false,
                ErrorMessage = ex.Message
            };
        }
    }

    public async Task HandleWebhookAsync(string payload, string signature)
    {
        // Verify webhook signature
        if (!VerifyWebhookSignature(payload, signature))
        {
            throw new UnauthorizedAccessException("Invalid webhook signature");
        }

        var events = JsonSerializer.Deserialize<List<SendGridEvent>>(payload);
        
        foreach (var eventData in events!)
        {
            await ProcessWebhookEventAsync(eventData);
        }
    }

    private async Task ProcessWebhookEventAsync(SendGridEvent eventData)
    {
        if (!Guid.TryParse(eventData.NotificationId, out var notificationId))
            return;

        if (!Guid.TryParse(eventData.UserId, out var userId))
            return;

        switch (eventData.Event.ToLower())
        {
            case "delivered":
                await RecordDeliveryAsync(notificationId, userId, true);
                break;
            case "bounce":
            case "dropped":
                await RecordDeliveryAsync(notificationId, userId, false, eventData.Reason);
                break;
            case "open":
                await RecordOpenAsync(notificationId, userId, eventData.UserAgent, eventData.Ip);
                break;
            case "click":
                await RecordClickAsync(notificationId, userId, eventData.Url, eventData.UserAgent, eventData.Ip);
                break;
        }
    }
}
```

#### **Push Notification Service**
```csharp
public interface IPushNotificationService
{
    Task<DeliveryResult> SendPushNotificationAsync(PushMessage message);
    Task<DeliveryResult> SendBulkPushNotificationAsync(List<PushMessage> messages);
    Task<DeliveryResult> SendTopicNotificationAsync(string topic, PushMessage message);
}

public class FirebasePushNotificationService : IPushNotificationService
{
    private readonly FirebaseMessaging _firebaseMessaging;
    private readonly ILogger<FirebasePushNotificationService> _logger;

    public async Task<DeliveryResult> SendPushNotificationAsync(PushMessage message)
    {
        try
        {
            var firebaseMessage = new Message
            {
                Token = message.DeviceToken,
                Notification = new FirebaseAdmin.Messaging.Notification
                {
                    Title = message.Title,
                    Body = message.Body,
                    ImageUrl = message.ImageUrl
                },
                Data = new Dictionary<string, string>(message.Data)
                {
                    ["notification_id"] = message.NotificationId.ToString(),
                    ["user_id"] = message.RecipientUserId.ToString(),
                    ["category"] = message.Category.ToString()
                },
                Android = new AndroidConfig
                {
                    Priority = message.Priority switch
                    {
                        NotificationPriority.High => Priority.High,
                        NotificationPriority.Critical => Priority.High,
                        _ => Priority.Normal
                    },
                    Notification = new AndroidNotification
                    {
                        ChannelId = GetAndroidChannelId(message.Category),
                        Priority = NotificationPriority.Default,
                        DefaultSound = true
                    }
                },
                Apns = new ApnsConfig
                {
                    Aps = new Aps
                    {
                        Alert = new ApsAlert
                        {
                            Title = message.Title,
                            Body = message.Body
                        },
                        Badge = message.BadgeCount,
                        Sound = "default",
                        Category = message.Category.ToString().ToLower()
                    }
                }
            };

            var response = await _firebaseMessaging.SendAsync(firebaseMessage);

            return new DeliveryResult
            {
                IsSuccessful = true,
                ExternalId = response,
                ProcessingTime = TimeSpan.FromMilliseconds(200)
            };
        }
        catch (FirebaseMessagingException ex)
        {
            _logger.LogError(ex, "Failed to send push notification via Firebase to token {Token}", message.DeviceToken);
            
            return new DeliveryResult
            {
                IsSuccessful = false,
                ErrorMessage = ex.Message,
                ShouldRetry = ShouldRetryFirebaseError(ex.MessagingErrorCode)
            };
        }
    }

    public async Task<DeliveryResult> SendBulkPushNotificationAsync(List<PushMessage> messages)
    {
        var firebaseMessages = messages.Select(msg => new Message
        {
            Token = msg.DeviceToken,
            Notification = new FirebaseAdmin.Messaging.Notification
            {
                Title = msg.Title,
                Body = msg.Body,
                ImageUrl = msg.ImageUrl
            },
            Data = new Dictionary<string, string>(msg.Data)
            {
                ["notification_id"] = msg.NotificationId.ToString(),
                ["user_id"] = msg.RecipientUserId.ToString()
            }
        }).ToList();

        try
        {
            var response = await _firebaseMessaging.SendAllAsync(firebaseMessages);

            return new DeliveryResult
            {
                IsSuccessful = response.FailureCount == 0,
                SuccessCount = response.SuccessCount,
                FailureCount = response.FailureCount,
                ErrorMessage = response.FailureCount > 0 ? "Some messages failed" : null
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send bulk push notifications via Firebase");
            return new DeliveryResult
            {
                IsSuccessful = false,
                ErrorMessage = ex.Message
            };
        }
    }

    private string GetAndroidChannelId(NotificationCategory category)
    {
        return category switch
        {
            NotificationCategory.Security => "security_alerts",
            NotificationCategory.Campaign => "campaign_updates",
            NotificationCategory.Session => "session_notifications",
            NotificationCategory.Social => "social_interactions",
            _ => "general_notifications"
        };
    }

    private bool ShouldRetryFirebaseError(MessagingErrorCode errorCode)
    {
        return errorCode switch
        {
            MessagingErrorCode.Unavailable => true,
            MessagingErrorCode.Internal => true,
            MessagingErrorCode.InvalidRegistrationToken => false,
            MessagingErrorCode.RegistrationTokenNotRegistered => false,
            _ => false
        };
    }
}
```

#### **In-App Notification Service**
```csharp
public interface IInAppNotificationService
{
    Task<DeliveryResult> SendInAppNotificationAsync(InAppMessage message);
    Task<DeliveryResult> SendToUserAsync(Guid userId, InAppMessage message);
    Task<DeliveryResult> SendToCampaignAsync(Guid campaignId, InAppMessage message);
    Task MarkAsReadAsync(Guid notificationId, Guid userId);
    Task<List<InAppNotificationDto>> GetUnreadNotificationsAsync(Guid userId);
}

public class SignalRInAppNotificationService : IInAppNotificationService
{
    private readonly IHubContext<NotificationHub> _hubContext;
    private readonly IInAppNotificationRepository _repository;
    private readonly ILogger<SignalRInAppNotificationService> _logger;

    public async Task<DeliveryResult> SendInAppNotificationAsync(InAppMessage message)
    {
        try
        {
            // Store in database for persistence
            var inAppNotification = new InAppNotification
            {
                Id = Guid.NewGuid(),
                NotificationId = message.NotificationId,
                UserId = message.RecipientUserId,
                Title = message.Title,
                Message = message.Message,
                ActionUrl = message.ActionUrl,
                IconUrl = message.IconUrl,
                Category = message.Category,
                Priority = message.Priority,
                CreatedAt = DateTime.UtcNow,
                IsRead = false
            };

            await _repository.AddAsync(inAppNotification);

            // Send via SignalR
            await _hubContext.Clients.User(message.RecipientUserId.ToString())
                .SendAsync("ReceiveNotification", new
                {
                    id = inAppNotification.Id,
                    notificationId = message.NotificationId,
                    title = message.Title,
                    message = message.Message,
                    actionUrl = message.ActionUrl,
                    iconUrl = message.IconUrl,
                    category = message.Category.ToString(),
                    priority = message.Priority.ToString(),
                    createdAt = inAppNotification.CreatedAt,
                    data = message.Data
                });

            return new DeliveryResult
            {
                IsSuccessful = true,
                ExternalId = inAppNotification.Id.ToString(),
                ProcessingTime = TimeSpan.FromMilliseconds(50)
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send in-app notification to user {UserId}", message.RecipientUserId);
            return new DeliveryResult
            {
                IsSuccessful = false,
                ErrorMessage = ex.Message
            };
        }
    }

    public async Task<DeliveryResult> SendToUserAsync(Guid userId, InAppMessage message)
    {
        message.RecipientUserId = userId;
        return await SendInAppNotificationAsync(message);
    }

    public async Task<DeliveryResult> SendToCampaignAsync(Guid campaignId, InAppMessage message)
    {
        try
        {
            // Get all users in the campaign
            var campaignUsers = await GetCampaignUsersAsync(campaignId);
            
            var tasks = campaignUsers.Select(userId =>
            {
                var userMessage = message with { RecipientUserId = userId };
                return SendInAppNotificationAsync(userMessage);
            });

            var results = await Task.WhenAll(tasks);
            var successCount = results.Count(r => r.IsSuccessful);

            return new DeliveryResult
            {
                IsSuccessful = successCount > 0,
                SuccessCount = successCount,
                FailureCount = results.Length - successCount
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send in-app notification to campaign {CampaignId}", campaignId);
            return new DeliveryResult
            {
                IsSuccessful = false,
                ErrorMessage = ex.Message
            };
        }
    }

    public async Task<List<InAppNotificationDto>> GetUnreadNotificationsAsync(Guid userId)
    {
        var notifications = await _repository.GetUnreadByUserIdAsync(userId);
        
        return notifications.Select(n => new InAppNotificationDto
        {
            Id = n.Id,
            NotificationId = n.NotificationId,
            Title = n.Title,
            Message = n.Message,
            ActionUrl = n.ActionUrl,
            IconUrl = n.IconUrl,
            Category = n.Category,
            Priority = n.Priority,
            CreatedAt = n.CreatedAt,
            IsRead = n.IsRead
        }).ToList();
    }

    public async Task MarkAsReadAsync(Guid notificationId, Guid userId)
    {
        await _repository.MarkAsReadAsync(notificationId, userId);
    }

    private async Task<List<Guid>> GetCampaignUsersAsync(Guid campaignId)
    {
        // This would integrate with the Campaign Service to get campaign members
        // For now, returning empty list as placeholder
        return new List<Guid>();
    }
}
```

## API Controllers

### Notification Controller

```csharp
[ApiController]
[Route("api/v1/notifications")]
[Authorize]
public class NotificationController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ILogger<NotificationController> _logger;

    /// <summary>
    /// Send a notification
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<SendNotificationResponse>> SendNotification([FromBody] SendNotificationRequest request)
    {
        var userId = User.GetUserId();
        
        var command = new SendNotificationCommand
        {
            Title = request.Title,
            Message = request.Message,
            HtmlMessage = request.HtmlMessage,
            Type = request.Type,
            Category = request.Category,
            Priority = request.Priority,
            RecipientUserIds = request.RecipientUserIds,
            DeliveryChannels = request.DeliveryChannels,
            TemplateId = request.TemplateId,
            PersonalizationData = request.PersonalizationData ?? new Dictionary<string, object>(),
            ScheduleFor = request.ScheduleFor,
            CampaignId = request.CampaignId,
            SessionId = request.SessionId,
            SentBy = userId
        };

        var result = await _mediator.Send(command);
        return CreatedAtAction(nameof(GetNotification), new { id = result.NotificationId }, result);
    }

    /// <summary>
    /// Get notification details
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<NotificationDto>> GetNotification(Guid id)
    {
        var query = new GetNotificationQuery { NotificationId = id };
        var result = await _mediator.Send(query);
        
        if (result == null)
        {
            return NotFound();
        }

        return Ok(result);
    }

    /// <summary>
    /// Get notification history
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<GetNotificationHistoryResponse>> GetNotificationHistory([FromQuery] GetNotificationHistoryRequest request)
    {
        var query = new GetNotificationHistoryQuery
        {
            UserId = request.UserId,
            Type = request.Type,
            Category = request.Category,
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            Page = request.Page,
            PageSize = Math.Min(request.PageSize, 100)
        };

        var result = await _mediator.Send(query);
        return Ok(result);
    }

    /// <summary>
    /// Get user's unread in-app notifications
    /// </summary>
    [HttpGet("unread")]
    public async Task<ActionResult<List<InAppNotificationDto>>> GetUnreadNotifications()
    {
        var userId = User.GetUserId();
        var query = new GetUnreadNotificationsQuery { UserId = userId };
        
        var result = await _mediator.Send(query);
        return Ok(result);
    }

    /// <summary>
    /// Mark notification as read
    /// </summary>
    [HttpPost("{id}/read")]
    public async Task<IActionResult> MarkAsRead(Guid id)
    {
        var userId = User.GetUserId();
        var command = new MarkNotificationReadCommand { NotificationId = id, UserId = userId };
        
        await _mediator.Send(command);
        return NoContent();
    }

    /// <summary>
    /// Cancel a scheduled notification
    /// </summary>
    [HttpPost("{id}/cancel")]
    public async Task<IActionResult> CancelNotification(Guid id)
    {
        var userId = User.GetUserId();
        var command = new CancelNotificationCommand { NotificationId = id, UserId = userId };
        
        await _mediator.Send(command);
        return NoContent();
    }

    /// <summary>
    /// Get notification statistics
    /// </summary>
    [HttpGet("stats")]
    public async Task<ActionResult<NotificationStatsResponse>> GetNotificationStats([FromQuery] NotificationStatsRequest request)
    {
        var query = new GetNotificationStatsQuery
        {
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            GroupBy = request.GroupBy
        };

        var result = await _mediator.Send(query);
        return Ok(result);
    }
}
```

### User Preferences Controller

```csharp
[ApiController]
[Route("api/v1/notifications/preferences")]
[Authorize]
public class PreferencesController : ControllerBase
{
    private readonly IMediator _mediator;

    /// <summary>
    /// Get user notification preferences
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<UserPreferencesDto>> GetPreferences()
    {
        var userId = User.GetUserId();
        var query = new GetUserPreferencesQuery { UserId = userId };
        
        var result = await _mediator.Send(query);
        return Ok(result);
    }

    /// <summary>
    /// Update user notification preferences
    /// </summary>
    [HttpPut]
    public async Task<IActionResult> UpdatePreferences([FromBody] UpdatePreferencesRequest request)
    {
        var userId = User.GetUserId();
        var command = new UpdateUserPreferencesCommand
        {
            UserId = userId,
            EmailEnabled = request.EmailEnabled,
            PushEnabled = request.PushEnabled,
            InAppEnabled = request.InAppEnabled,
            SMSEnabled = request.SMSEnabled,
            CategoryPreferences = request.CategoryPreferences,
            TimeZone = request.TimeZone,
            QuietHours = request.QuietHours,
            DigestEnabled = request.DigestEnabled,
            DigestFrequency = request.DigestFrequency,
            DigestTime = request.DigestTime
        };

        await _mediator.Send(command);
        return NoContent();
    }

    /// <summary>
    /// Update push notification token
    /// </summary>
    [HttpPost("push-token")]
    public async Task<IActionResult> UpdatePushToken([FromBody] UpdatePushTokenRequest request)
    {
        var userId = User.GetUserId();
        var command = new UpdatePushTokenCommand
        {
            UserId = userId,
            PushToken = request.PushToken,
            DeviceId = request.DeviceId
        };

        await _mediator.Send(command);
        return NoContent();
    }
}
```

## SignalR Hub

### Notification Hub

```csharp
[Authorize]
public class NotificationHub : Hub
{
    private readonly IInAppNotificationService _notificationService;
    private readonly ILogger<NotificationHub> _logger;

    public NotificationHub(
        IInAppNotificationService notificationService,
        ILogger<NotificationHub> logger)
    {
        _notificationService = notificationService;
        _logger = logger;
    }

    public override async Task OnConnectedAsync()
    {
        var userId = Context.UserIdentifier;
        _logger.LogInformation("User {UserId} connected to notification hub", userId);

        // Send any unread notifications
        if (Guid.TryParse(userId, out var userGuid))
        {
            var unreadNotifications = await _notificationService.GetUnreadNotificationsAsync(userGuid);
            
            foreach (var notification in unreadNotifications)
            {
                await Clients.Caller.SendAsync("ReceiveNotification", notification);
            }
        }

        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = Context.UserIdentifier;
        _logger.LogInformation("User {UserId} disconnected from notification hub", userId);
        
        await base.OnDisconnectedAsync(exception);
    }

    public async Task JoinCampaignGroup(string campaignId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"campaign_{campaignId}");
        _logger.LogInformation("User {UserId} joined campaign group {CampaignId}", 
            Context.UserIdentifier, campaignId);
    }

    public async Task LeaveCampaignGroup(string campaignId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"campaign_{campaignId}");
        _logger.LogInformation("User {UserId} left campaign group {CampaignId}", 
            Context.UserIdentifier, campaignId);
    }

    public async Task MarkNotificationRead(string notificationId)
    {
        if (Guid.TryParse(Context.UserIdentifier, out var userId) && 
            Guid.TryParse(notificationId, out var notifId))
        {
            await _notificationService.MarkAsReadAsync(notifId, userId);
        }
    }
}
```

## Configuration and Deployment

### Configuration Settings

```json
{
  "NotificationService": {
    "DefaultFromEmail": "noreply@dndai.com",
    "DefaultFromName": "D&D AI Campaign Manager",
    "MaxRecipientsPerNotification": 10000,
    "MaxRetryAttempts": 3,
    "RetryDelay": "00:05:00"
  },
  "Email": {
    "Provider": "SendGrid",
    "SendGrid": {
      "ApiKey": "your-sendgrid-api-key",
      "WebhookSecret": "your-webhook-secret"
    },
    "Templates": {
      "WelcomeEmail": "d-welcome-template-id",
      "CampaignInvite": "d-campaign-invite-template-id",
      "SessionReminder": "d-session-reminder-template-id"
    }
  },
  "PushNotifications": {
    "Provider": "Firebase",
    "Firebase": {
      "ProjectId": "your-firebase-project-id",
      "ServiceAccountPath": "path/to/service-account.json"
    },
    "Channels": {
      "Security": "security_alerts",
      "Campaign": "campaign_updates",
      "Session": "session_notifications",
      "Social": "social_interactions",
      "General": "general_notifications"
    }
  },
  "InApp": {
    "SignalR": {
      "HubPath": "/notification-hub",
      "MaxConnectionsPerUser": 5
    },
    "RetentionDays": 30
  },
  "Scheduling": {
    "BackgroundJobProvider": "Hangfire",
    "ProcessingInterval": "00:01:00",
    "MaxConcurrentJobs": 10
  }
}
```

## Summary

The Notification Service provides:

1. **Multi-Channel Delivery** - Email, push notifications, in-app notifications, and SMS
2. **Template Management** - Reusable templates with personalization
3. **User Preferences** - Granular control over notification settings
4. **Real-time Delivery** - SignalR integration for instant in-app notifications
5. **Scheduling & Automation** - One-time and recurring notification campaigns
6. **Delivery Tracking** - Comprehensive tracking of delivery, opens, and clicks
7. **Personalization Engine** - Dynamic content based on user data and context
8. **Webhook Integration** - Handle delivery status updates from external providers
9. **Performance Optimization** - Bulk sending, caching, and efficient queuing
10. **Comprehensive Analytics** - Detailed statistics and engagement metrics

The service integrates seamlessly with the D&D AI Campaign Management System to provide contextual, timely, and personalized notifications that enhance the user experience while respecting user preferences and privacy.
