# Audit Service Implementation Specification

## Overview
The Audit Service provides comprehensive security logging, compliance tracking, and forensic analysis for the D&D AI Campaign Management System. It ensures regulatory compliance (GDPR, CCPA, COPPA), maintains detailed audit trails, and supports security incident investigation.

## Service Architecture

### Technology Stack
- **Framework**: ASP.NET Core 8.0
- **Database**: PostgreSQL for structured audit data
- **Search Engine**: Elasticsearch for log search and analysis
- **Time Series DB**: InfluxDB for security metrics
- **Message Queue**: Apache Kafka for audit event streaming
- **Encryption**: AES-256-GCM for audit log encryption
- **Compliance**: Built-in GDPR, CCPA, COPPA support
- **Monitoring**: Grafana dashboards for security monitoring

### Project Structure
```
AuditService/
├── src/
│   ├── AuditService.Api/                  # Web API layer
│   │   ├── Controllers/
│   │   │   ├── AuditController.cs         # Audit log API
│   │   │   ├── ComplianceController.cs    # Compliance reporting
│   │   │   └── SecurityController.cs      # Security monitoring
│   │   ├── BackgroundServices/
│   │   │   ├── AuditProcessorService.cs   # Audit processing
│   │   │   └── ComplianceReportService.cs # Compliance reports
│   ├── AuditService.Application/          # Application layer
│   │   ├── Commands/
│   │   │   ├── LogAuditEventCommand.cs    # Audit logging
│   │   │   ├── ProcessDataRequestCommand.cs # Data subject requests
│   │   │   └── GenerateComplianceReportCommand.cs
│   │   ├── Queries/
│   │   │   ├── SearchAuditLogsQuery.cs    # Audit log search
│   │   │   ├── GetComplianceStatusQuery.cs # Compliance status
│   │   │   └── GetSecurityMetricsQuery.cs # Security metrics
│   │   ├── Services/
│   │   │   ├── ComplianceEngine/          # Compliance processing
│   │   │   ├── SecurityAnalysis/          # Security analysis
│   │   │   ├── DataSubjectRights/         # GDPR data rights
│   │   │   └── ForensicAnalysis/          # Incident investigation
│   ├── AuditService.Domain/               # Domain layer
│   │   ├── Entities/
│   │   │   ├── AuditEvent.cs              # Audit events
│   │   │   ├── ComplianceRecord.cs        # Compliance records
│   │   │   ├── DataSubjectRequest.cs      # Data subject requests
│   │   │   └── SecurityIncident.cs        # Security incidents
│   │   ├── ValueObjects/
│   │   │   ├── AuditContext.cs            # Audit context
│   │   │   ├── ComplianceMetadata.cs      # Compliance metadata
│   │   │   └── SecurityClassification.cs  # Security levels
│   └── AuditService.Infrastructure/       # Infrastructure layer
│       ├── Data/
│       ├── Logging/
│       │   ├── EncryptedAuditLogger.cs    # Encrypted logging
│       │   └── ElasticsearchAuditStore.cs # Searchable audit store
│       ├── Compliance/
│       │   ├── GDPRComplianceEngine.cs    # GDPR compliance
│       │   ├── CCPAComplianceEngine.cs    # CCPA compliance
│       │   └── COPPAComplianceEngine.cs   # COPPA compliance
│       └── Security/
│           ├── ThreatDetectionEngine.cs   # Threat detection
│           └── ForensicAnalysisEngine.cs  # Forensic analysis
```

## Domain Model

### Core Entities

#### **AuditEvent Entity**
```csharp
public class AuditEvent : Entity, IAggregateRoot
{
    public Guid Id { get; private set; }
    public string EventType { get; private set; }
    public string Action { get; private set; }
    public string Resource { get; private set; }
    public AuditResult Result { get; private set; }
    public SecurityClassification Classification { get; private set; }
    
    // Context information
    public AuditContext Context { get; private set; }
    public Guid? UserId { get; private set; }
    public string? UserEmail { get; private set; }
    public string? IpAddress { get; private set; }
    public string? UserAgent { get; private set; }
    public string? SessionId { get; private set; }
    
    // Request details
    public string? RequestId { get; private set; }
    public string? ApiEndpoint { get; private set; }
    public string? HttpMethod { get; private set; }
    public int? HttpStatusCode { get; private set; }
    
    // Data and changes
    public Dictionary<string, object> BeforeState { get; private set; } = new();
    public Dictionary<string, object> AfterState { get; private set; } = new();
    public List<string> ChangedFields { get; private set; } = new();
    
    // Compliance and legal
    public List<ComplianceFramework> ApplicableFrameworks { get; private set; } = new();
    public DataProcessingLawfulBasis? LawfulBasis { get; private set; }
    public bool ContainsPII { get; private set; }
    public bool ContainsSensitiveData { get; private set; }
    
    // Timing and performance
    public DateTime Timestamp { get; private set; }
    public TimeSpan? Duration { get; private set; }
    
    // Error information
    public string? ErrorMessage { get; private set; }
    public string? StackTrace { get; private set; }
    
    // Integrity and encryption
    public string IntegrityHash { get; private set; }
    public bool IsEncrypted { get; private set; }
    public string? EncryptionKeyId { get; private set; }

    protected AuditEvent() { } // EF Constructor

    public AuditEvent(
        string eventType,
        string action,
        string resource,
        AuditResult result,
        AuditContext context,
        SecurityClassification classification = SecurityClassification.Internal)
    {
        Id = Guid.NewGuid();
        EventType = eventType;
        Action = action;
        Resource = resource;
        Result = result;
        Context = context;
        Classification = classification;
        Timestamp = DateTime.UtcNow;
        
        GenerateIntegrityHash();
        
        AddDomainEvent(new AuditEventCreatedEvent(Id, eventType, action, classification));
    }

    public void SetUserContext(Guid userId, string userEmail, string? sessionId = null)
    {
        UserId = userId;
        UserEmail = userEmail;
        SessionId = sessionId;
        
        // PII detected
        ContainsPII = true;
        ApplicableFrameworks.Add(ComplianceFramework.GDPR);
        ApplicableFrameworks.Add(ComplianceFramework.CCPA);
    }

    public void SetRequestContext(string requestId, string apiEndpoint, string httpMethod, int httpStatusCode)
    {
        RequestId = requestId;
        ApiEndpoint = apiEndpoint;
        HttpMethod = httpMethod;
        HttpStatusCode = httpStatusCode;
    }

    public void SetNetworkContext(string ipAddress, string userAgent)
    {
        IpAddress = ipAddress;
        UserAgent = userAgent;
    }

    public void SetDataChanges(Dictionary<string, object> beforeState, Dictionary<string, object> afterState)
    {
        BeforeState = beforeState;
        AfterState = afterState;
        
        // Identify changed fields
        ChangedFields = beforeState.Keys
            .Union(afterState.Keys)
            .Where(key => !beforeState.ContainsKey(key) || 
                         !afterState.ContainsKey(key) || 
                         !Equals(beforeState[key], afterState[key]))
            .ToList();
            
        // Check for sensitive data
        ContainsSensitiveData = CheckForSensitiveData(beforeState) || CheckForSensitiveData(afterState);
    }

    public void SetError(string errorMessage, string? stackTrace = null)
    {
        ErrorMessage = errorMessage;
        StackTrace = stackTrace;
        Result = AuditResult.Failure;
    }

    public void SetDuration(TimeSpan duration)
    {
        Duration = duration;
    }

    public void SetLawfulBasis(DataProcessingLawfulBasis lawfulBasis)
    {
        LawfulBasis = lawfulBasis;
        
        if (!ApplicableFrameworks.Contains(ComplianceFramework.GDPR))
        {
            ApplicableFrameworks.Add(ComplianceFramework.GDPR);
        }
    }

    public void Encrypt(string encryptionKeyId)
    {
        IsEncrypted = true;
        EncryptionKeyId = encryptionKeyId;
        
        // In a real implementation, sensitive fields would be encrypted here
        if (ContainsPII || ContainsSensitiveData)
        {
            Classification = SecurityClassification.Confidential;
        }
    }

    public bool RequiresRetention(DateTime currentDate)
    {
        var retentionPeriod = GetRetentionPeriod();
        return Timestamp.Add(retentionPeriod) > currentDate;
    }

    public TimeSpan GetRetentionPeriod()
    {
        // Compliance-driven retention periods
        if (ApplicableFrameworks.Contains(ComplianceFramework.GDPR) && ContainsPII)
        {
            return TimeSpan.FromDays(2555); // 7 years for GDPR
        }
        
        if (Classification == SecurityClassification.Confidential)
        {
            return TimeSpan.FromDays(2190); // 6 years for confidential data
        }
        
        return TimeSpan.FromDays(1095); // 3 years default
    }

    private void GenerateIntegrityHash()
    {
        var hashInput = $"{EventType}|{Action}|{Resource}|{Result}|{Timestamp:O}|{UserId}";
        using var sha256 = System.Security.Cryptography.SHA256.Create();
        var hashBytes = sha256.ComputeHash(System.Text.Encoding.UTF8.GetBytes(hashInput));
        IntegrityHash = Convert.ToBase64String(hashBytes);
    }

    private bool CheckForSensitiveData(Dictionary<string, object> data)
    {
        var sensitiveFields = new[] { "password", "ssn", "credit_card", "bank_account", "api_key", "token" };
        return data.Keys.Any(key => sensitiveFields.Any(field => 
            key.ToLower().Contains(field)));
    }
}
```

#### **DataSubjectRequest Entity**
```csharp
public class DataSubjectRequest : Entity, IAggregateRoot
{
    public Guid Id { get; private set; }
    public string RequestType { get; private set; }
    public DataSubjectRequestStatus Status { get; private set; }
    public ComplianceFramework Framework { get; private set; }
    
    // Subject information
    public Guid SubjectUserId { get; private set; }
    public string SubjectEmail { get; private set; }
    public string? SubjectName { get; private set; }
    
    // Request details
    public string Description { get; private set; }
    public List<string> RequestedData { get; private set; } = new();
    public string? SpecificRequirements { get; private set; }
    
    // Processing information
    public DateTime RequestedAt { get; private set; }
    public DateTime? ProcessedAt { get; private set; }
    public DateTime DueDate { get; private set; }
    public Guid? ProcessedBy { get; private set; }
    
    // Legal basis and verification
    public DataProcessingLawfulBasis? LawfulBasis { get; private set; }
    public bool IsVerified { get; private set; }
    public DateTime? VerifiedAt { get; private set; }
    public string? VerificationMethod { get; private set; }
    
    // Response and delivery
    public string? ResponseData { get; private set; }
    public string? DeliveryMethod { get; private set; }
    public bool IsDelivered { get; private set; }
    public DateTime? DeliveredAt { get; private set; }
    
    // Compliance tracking
    public List<string> ProcessingSteps { get; private set; } = new();
    public Dictionary<string, string> ComplianceMetadata { get; private set; } = new();

    protected DataSubjectRequest() { } // EF Constructor

    public DataSubjectRequest(
        string requestType,
        Guid subjectUserId,
        string subjectEmail,
        string description,
        ComplianceFramework framework)
    {
        Id = Guid.NewGuid();
        RequestType = requestType;
        SubjectUserId = subjectUserId;
        SubjectEmail = subjectEmail;
        Description = description;
        Framework = framework;
        Status = DataSubjectRequestStatus.Received;
        RequestedAt = DateTime.UtcNow;
        DueDate = CalculateDueDate(framework);
        
        ProcessingSteps.Add($"Request received at {RequestedAt:yyyy-MM-dd HH:mm:ss}");
        
        AddDomainEvent(new DataSubjectRequestCreatedEvent(Id, requestType, framework));
    }

    public void Verify(string verificationMethod)
    {
        IsVerified = true;
        VerifiedAt = DateTime.UtcNow;
        VerificationMethod = verificationMethod;
        Status = DataSubjectRequestStatus.Verified;
        
        ProcessingSteps.Add($"Request verified using {verificationMethod} at {VerifiedAt:yyyy-MM-dd HH:mm:ss}");
        
        AddDomainEvent(new DataSubjectRequestVerifiedEvent(Id, verificationMethod));
    }

    public void StartProcessing(Guid processedBy)
    {
        ProcessedBy = processedBy;
        Status = DataSubjectRequestStatus.Processing;
        
        ProcessingSteps.Add($"Processing started by user {processedBy} at {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss}");
        
        AddDomainEvent(new DataSubjectRequestProcessingStartedEvent(Id, processedBy));
    }

    public void Complete(string responseData, string deliveryMethod)
    {
        ResponseData = responseData;
        DeliveryMethod = deliveryMethod;
        ProcessedAt = DateTime.UtcNow;
        Status = DataSubjectRequestStatus.Completed;
        
        ProcessingSteps.Add($"Processing completed at {ProcessedAt:yyyy-MM-dd HH:mm:ss}");
        
        AddDomainEvent(new DataSubjectRequestCompletedEvent(Id, deliveryMethod));
    }

    public void Deliver()
    {
        IsDelivered = true;
        DeliveredAt = DateTime.UtcNow;
        Status = DataSubjectRequestStatus.Delivered;
        
        ProcessingSteps.Add($"Response delivered at {DeliveredAt:yyyy-MM-dd HH:mm:ss}");
        
        AddDomainEvent(new DataSubjectRequestDeliveredEvent(Id));
    }

    public bool IsOverdue()
    {
        return DateTime.UtcNow > DueDate && Status != DataSubjectRequestStatus.Completed;
    }

    public TimeSpan GetTimeRemaining()
    {
        return DueDate - DateTime.UtcNow;
    }

    private DateTime CalculateDueDate(ComplianceFramework framework)
    {
        var daysToAdd = framework switch
        {
            ComplianceFramework.GDPR => 30,    // 30 days for GDPR
            ComplianceFramework.CCPA => 45,    // 45 days for CCPA
            ComplianceFramework.COPPA => 30,   // 30 days for COPPA
            _ => 30
        };
        
        return RequestedAt.AddDays(daysToAdd);
    }
}
```

### Value Objects

#### **AuditContext**
```csharp
public class AuditContext : ValueObject
{
    public string Service { get; private set; }
    public string Component { get; private set; }
    public string? CorrelationId { get; private set; }
    public Dictionary<string, string> AdditionalContext { get; private set; } = new();

    public AuditContext(string service, string component, string? correlationId = null)
    {
        Service = service;
        Component = component;
        CorrelationId = correlationId;
    }

    public AuditContext WithAdditionalContext(Dictionary<string, string> context)
    {
        return new AuditContext(Service, Component, CorrelationId)
        {
            AdditionalContext = context
        };
    }

    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return Service;
        yield return Component;
        yield return CorrelationId ?? string.Empty;
        
        foreach (var kvp in AdditionalContext.OrderBy(x => x.Key))
        {
            yield return kvp.Key;
            yield return kvp.Value;
        }
    }
}
```

### Enumerations

```csharp
public enum AuditResult
{
    Success = 1,
    Failure = 2,
    Warning = 3,
    Information = 4
}

public enum SecurityClassification
{
    Public = 1,
    Internal = 2,
    Confidential = 3,
    Restricted = 4
}

public enum ComplianceFramework
{
    GDPR = 1,
    CCPA = 2,
    COPPA = 3,
    HIPAA = 4,
    SOX = 5
}

public enum DataSubjectRequestStatus
{
    Received = 1,
    Verified = 2,
    Processing = 3,
    Completed = 4,
    Delivered = 5,
    Rejected = 6
}

public enum DataProcessingLawfulBasis
{
    Consent = 1,
    Contract = 2,
    LegalObligation = 3,
    VitalInterests = 4,
    PublicTask = 5,
    LegitimateInterests = 6
}
```

## Application Layer

### Commands and Handlers

#### **Log Audit Event Command**
```csharp
public record LogAuditEventCommand : IRequest<LogAuditEventResponse>
{
    public string EventType { get; init; } = string.Empty;
    public string Action { get; init; } = string.Empty;
    public string Resource { get; init; } = string.Empty;
    public AuditResult Result { get; init; }
    public string Service { get; init; } = string.Empty;
    public string Component { get; init; } = string.Empty;
    public Guid? UserId { get; init; }
    public string? UserEmail { get; init; }
    public string? IpAddress { get; init; }
    public string? UserAgent { get; init; }
    public string? RequestId { get; init; }
    public string? ApiEndpoint { get; init; }
    public string? HttpMethod { get; init; }
    public int? HttpStatusCode { get; init; }
    public Dictionary<string, object> BeforeState { get; init; } = new();
    public Dictionary<string, object> AfterState { get; init; } = new();
    public string? ErrorMessage { get; init; }
    public TimeSpan? Duration { get; init; }
    public SecurityClassification Classification { get; init; } = SecurityClassification.Internal;
}

public class LogAuditEventCommandHandler : IRequestHandler<LogAuditEventCommand, LogAuditEventResponse>
{
    private readonly IAuditEventRepository _repository;
    private readonly IEncryptionService _encryptionService;
    private readonly IComplianceEngine _complianceEngine;
    private readonly IAuditEventPublisher _eventPublisher;

    public async Task<LogAuditEventResponse> Handle(LogAuditEventCommand request, CancellationToken cancellationToken)
    {
        // Create audit context
        var context = new AuditContext(request.Service, request.Component, request.RequestId);
        
        // Create audit event
        var auditEvent = new AuditEvent(
            request.EventType,
            request.Action,
            request.Resource,
            request.Result,
            context,
            request.Classification);

        // Set user context if provided
        if (request.UserId.HasValue && !string.IsNullOrEmpty(request.UserEmail))
        {
            auditEvent.SetUserContext(request.UserId.Value, request.UserEmail);
        }

        // Set request context if provided
        if (!string.IsNullOrEmpty(request.ApiEndpoint))
        {
            auditEvent.SetRequestContext(
                request.RequestId ?? string.Empty,
                request.ApiEndpoint,
                request.HttpMethod ?? string.Empty,
                request.HttpStatusCode ?? 0);
        }

        // Set network context if provided
        if (!string.IsNullOrEmpty(request.IpAddress))
        {
            auditEvent.SetNetworkContext(request.IpAddress, request.UserAgent ?? string.Empty);
        }

        // Set data changes if provided
        if (request.BeforeState.Any() || request.AfterState.Any())
        {
            auditEvent.SetDataChanges(request.BeforeState, request.AfterState);
        }

        // Set error information if provided
        if (!string.IsNullOrEmpty(request.ErrorMessage))
        {
            auditEvent.SetError(request.ErrorMessage);
        }

        // Set duration if provided
        if (request.Duration.HasValue)
        {
            auditEvent.SetDuration(request.Duration.Value);
        }

        // Apply compliance rules
        await _complianceEngine.ApplyComplianceRulesAsync(auditEvent);

        // Encrypt if necessary
        if (auditEvent.ContainsPII || auditEvent.ContainsSensitiveData)
        {
            var keyId = await _encryptionService.GetCurrentKeyIdAsync("audit-logs");
            auditEvent.Encrypt(keyId);
        }

        // Store audit event
        await _repository.AddAsync(auditEvent, cancellationToken);
        await _repository.UnitOfWork.SaveEntitiesAsync(cancellationToken);

        // Publish for real-time processing
        await _eventPublisher.PublishAsync(auditEvent);

        return new LogAuditEventResponse
        {
            AuditEventId = auditEvent.Id,
            Timestamp = auditEvent.Timestamp,
            IntegrityHash = auditEvent.IntegrityHash
        };
    }
}
```

## Infrastructure Layer

### Compliance Engines

#### **GDPR Compliance Engine**
```csharp
public interface IGDPRComplianceEngine
{
    Task<GDPRComplianceStatus> AssessComplianceAsync(AuditEvent auditEvent);
    Task<DataSubjectRightsResponse> ProcessDataSubjectRightAsync(DataSubjectRequest request);
    Task<ConsentAuditResult> AuditConsentAsync(Guid userId);
    Task<DataPortabilityResult> ExportUserDataAsync(Guid userId);
    Task<DataErasureResult> EraseUserDataAsync(Guid userId, string reason);
}

public class GDPRComplianceEngine : IGDPRComplianceEngine
{
    private readonly IAuditEventRepository _auditRepository;
    private readonly IUserDataService _userDataService;
    private readonly IConsentService _consentService;

    public async Task<GDPRComplianceStatus> AssessComplianceAsync(AuditEvent auditEvent)
    {
        var status = new GDPRComplianceStatus
        {
            AuditEventId = auditEvent.Id,
            IsCompliant = true,
            Issues = new List<string>()
        };

        // Check if PII processing has lawful basis
        if (auditEvent.ContainsPII && auditEvent.LawfulBasis == null)
        {
            status.IsCompliant = false;
            status.Issues.Add("PII processing without documented lawful basis");
        }

        // Check consent for consent-based processing
        if (auditEvent.LawfulBasis == DataProcessingLawfulBasis.Consent && auditEvent.UserId.HasValue)
        {
            var hasValidConsent = await _consentService.HasValidConsentAsync(
                auditEvent.UserId.Value, 
                auditEvent.Resource);
                
            if (!hasValidConsent)
            {
                status.IsCompliant = false;
                status.Issues.Add("Processing based on consent without valid consent record");
            }
        }

        // Check data minimization
        if (auditEvent.Action == "READ" && auditEvent.AfterState.Count > 10)
        {
            status.Issues.Add("Potential data minimization concern - large data retrieval");
        }

        // Check retention compliance
        if (!auditEvent.RequiresRetention(DateTime.UtcNow))
        {
            status.Issues.Add("Data may exceed retention period");
        }

        return status;
    }

    public async Task<DataPortabilityResult> ExportUserDataAsync(Guid userId)
    {
        var userData = await _userDataService.GetAllUserDataAsync(userId);
        var auditEvents = await _auditRepository.GetUserAuditEventsAsync(userId);

        var exportData = new
        {
            PersonalData = userData,
            ActivityLog = auditEvents.Select(e => new
            {
                e.Timestamp,
                e.Action,
                e.Resource,
                e.Result
            }),
            ExportedAt = DateTime.UtcNow,
            ExportFormat = "JSON",
            DataController = "D&D AI Campaign Manager"
        };

        var exportJson = JsonSerializer.Serialize(exportData, new JsonSerializerOptions 
        { 
            WriteIndented = true 
        });

        return new DataPortabilityResult
        {
            Success = true,
            ExportData = exportJson,
            Format = "JSON",
            ExportedAt = DateTime.UtcNow
        };
    }
}
```

### Security Analysis

#### **Threat Detection Engine**
```csharp
public interface IThreatDetectionEngine
{
    Task<ThreatAnalysisResult> AnalyzeAuditEventAsync(AuditEvent auditEvent);
    Task<List<SecurityAlert>> DetectAnomaliesAsync(TimeSpan timeWindow);
    Task<RiskScore> CalculateUserRiskScoreAsync(Guid userId);
}

public class ThreatDetectionEngine : IThreatDetectionEngine
{
    private readonly IAuditEventRepository _repository;
    private readonly ISecurityMetricsService _metricsService;

    public async Task<ThreatAnalysisResult> AnalyzeAuditEventAsync(AuditEvent auditEvent)
    {
        var result = new ThreatAnalysisResult
        {
            AuditEventId = auditEvent.Id,
            ThreatLevel = ThreatLevel.Low,
            DetectedThreats = new List<DetectedThreat>()
        };

        // Detect brute force attempts
        if (auditEvent.Action == "LOGIN" && auditEvent.Result == AuditResult.Failure)
        {
            var recentFailures = await GetRecentLoginFailuresAsync(auditEvent.IpAddress);
            if (recentFailures > 5)
            {
                result.DetectedThreats.Add(new DetectedThreat
                {
                    Type = "BRUTE_FORCE_ATTEMPT",
                    Severity = ThreatSeverity.High,
                    Description = $"Multiple login failures from IP {auditEvent.IpAddress}"
                });
                result.ThreatLevel = ThreatLevel.High;
            }
        }

        // Detect unusual data access patterns
        if (auditEvent.Action == "READ" && auditEvent.UserId.HasValue)
        {
            var userBaseline = await GetUserAccessBaselineAsync(auditEvent.UserId.Value);
            if (IsUnusualAccess(auditEvent, userBaseline))
            {
                result.DetectedThreats.Add(new DetectedThreat
                {
                    Type = "UNUSUAL_DATA_ACCESS",
                    Severity = ThreatSeverity.Medium,
                    Description = "User accessing data outside normal patterns"
                });
                result.ThreatLevel = ThreatLevel.Medium;
            }
        }

        // Detect privilege escalation
        if (auditEvent.Action == "UPDATE" && auditEvent.Resource.Contains("role"))
        {
            result.DetectedThreats.Add(new DetectedThreat
            {
                Type = "PRIVILEGE_ESCALATION",
                Severity = ThreatSeverity.Critical,
                Description = "Role or permission modification detected"
            });
            result.ThreatLevel = ThreatLevel.Critical;
        }

        return result;
    }

    private async Task<int> GetRecentLoginFailuresAsync(string? ipAddress)
    {
        if (string.IsNullOrEmpty(ipAddress)) return 0;

        var since = DateTime.UtcNow.AddMinutes(-15);
        return await _repository.CountAsync(e => 
            e.Action == "LOGIN" && 
            e.Result == AuditResult.Failure && 
            e.IpAddress == ipAddress && 
            e.Timestamp >= since);
    }
}
```

## API Controllers

### Audit Controller

```csharp
[ApiController]
[Route("api/v1/audit")]
[Authorize(Roles = "Admin,SecurityOfficer")]
public class AuditController : ControllerBase
{
    private readonly IMediator _mediator;

    /// <summary>
    /// Search audit logs
    /// </summary>
    [HttpGet("search")]
    public async Task<ActionResult<SearchAuditLogsResponse>> SearchAuditLogs([FromQuery] SearchAuditLogsRequest request)
    {
        var query = new SearchAuditLogsQuery
        {
            SearchTerm = request.SearchTerm,
            EventType = request.EventType,
            UserId = request.UserId,
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            Classification = request.Classification,
            Page = request.Page,
            PageSize = Math.Min(request.PageSize, 1000) // Max 1000 for security
        };

        var result = await _mediator.Send(query);
        return Ok(result);
    }

    /// <summary>
    /// Get security metrics
    /// </summary>
    [HttpGet("security/metrics")]
    public async Task<ActionResult<SecurityMetricsResponse>> GetSecurityMetrics([FromQuery] SecurityMetricsRequest request)
    {
        var query = new GetSecurityMetricsQuery
        {
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            MetricTypes = request.MetricTypes
        };

        var result = await _mediator.Send(query);
        return Ok(result);
    }

    /// <summary>
    /// Get compliance status
    /// </summary>
    [HttpGet("compliance/status")]
    public async Task<ActionResult<ComplianceStatusResponse>> GetComplianceStatus([FromQuery] ComplianceStatusRequest request)
    {
        var query = new GetComplianceStatusQuery
        {
            Framework = request.Framework,
            StartDate = request.StartDate,
            EndDate = request.EndDate
        };

        var result = await _mediator.Send(query);
        return Ok(result);
    }
}
```

### Compliance Controller

```csharp
[ApiController]
[Route("api/v1/compliance")]
[Authorize]
public class ComplianceController : ControllerBase
{
    private readonly IMediator _mediator;

    /// <summary>
    /// Submit data subject request (GDPR, CCPA, etc.)
    /// </summary>
    [HttpPost("data-subject-requests")]
    public async Task<ActionResult<SubmitDataSubjectRequestResponse>> SubmitDataSubjectRequest([FromBody] SubmitDataSubjectRequestRequest request)
    {
        var userId = User.GetUserId();
        var userEmail = User.GetEmail();
        
        var command = new SubmitDataSubjectRequestCommand
        {
            RequestType = request.RequestType,
            SubjectUserId = userId,
            SubjectEmail = userEmail,
            Description = request.Description,
            Framework = request.Framework,
            RequestedData = request.RequestedData
        };

        var result = await _mediator.Send(command);
        return CreatedAtAction(nameof(GetDataSubjectRequest), new { id = result.RequestId }, result);
    }

    /// <summary>
    /// Get data subject request status
    /// </summary>
    [HttpGet("data-subject-requests/{id}")]
    public async Task<ActionResult<DataSubjectRequestDto>> GetDataSubjectRequest(Guid id)
    {
        var userId = User.GetUserId();
        var query = new GetDataSubjectRequestQuery { RequestId = id, RequestedBy = userId };
        
        var result = await _mediator.Send(query);
        if (result == null)
        {
            return NotFound();
        }

        return Ok(result);
    }

    /// <summary>
    /// Get user's consent history
    /// </summary>
    [HttpGet("consent/history")]
    public async Task<ActionResult<ConsentHistoryResponse>> GetConsentHistory()
    {
        var userId = User.GetUserId();
        var query = new GetConsentHistoryQuery { UserId = userId };
        
        var result = await _mediator.Send(query);
        return Ok(result);
    }

    /// <summary>
    /// Export user data (GDPR Article 20)
    /// </summary>
    [HttpPost("export")]
    public async Task<ActionResult<ExportUserDataResponse>> ExportUserData([FromBody] ExportUserDataRequest request)
    {
        var userId = User.GetUserId();
        var command = new ExportUserDataCommand
        {
            UserId = userId,
            Format = request.Format,
            IncludeActivityLog = request.IncludeActivityLog
        };

        var result = await _mediator.Send(command);
        return Ok(result);
    }
}
```

## Configuration

### Configuration Settings

```json
{
  "AuditService": {
    "EncryptionEnabled": true,
    "IntegrityCheckingEnabled": true,
    "RetentionPolicy": {
      "DefaultRetentionDays": 1095,
      "PIIRetentionDays": 2555,
      "SecurityEventRetentionDays": 2190
    },
    "ComplianceFrameworks": ["GDPR", "CCPA", "COPPA"],
    "ThreatDetection": {
      "Enabled": true,
      "RealTimeAnalysis": true,
      "AlertThresholds": {
        "LoginFailures": 5,
        "DataAccessAnomaly": 3,
        "PrivilegeEscalation": 1
      }
    }
  },
  "Elasticsearch": {
    "Url": "https://localhost:9200",
    "IndexPrefix": "dndai-audit",
    "Username": "audit_user",
    "Password": "audit_password"
  },
  "Compliance": {
    "GDPR": {
      "DataSubjectRequestDeadlineDays": 30,
      "ConsentValidityDays": 365,
      "DataRetentionDays": 2555
    },
    "CCPA": {
      "DataSubjectRequestDeadlineDays": 45,
      "DataRetentionDays": 1095
    }
  }
}
```

## Summary

The Audit Service provides:

1. **Comprehensive Audit Logging** - All system activities with integrity protection
2. **Compliance Management** - GDPR, CCPA, COPPA compliance automation
3. **Data Subject Rights** - Automated handling of data export, deletion, and rectification
4. **Security Monitoring** - Real-time threat detection and analysis
5. **Forensic Analysis** - Detailed investigation capabilities for security incidents
6. **Encrypted Storage** - Secure storage of sensitive audit data
7. **Retention Management** - Automated data retention and deletion
8. **Compliance Reporting** - Automated compliance status reports
9. **Anomaly Detection** - ML-powered detection of unusual patterns
10. **Legal Documentation** - Comprehensive audit trails for legal requirements

The service ensures regulatory compliance while providing security teams with the tools needed to monitor, investigate, and respond to security events effectively.
