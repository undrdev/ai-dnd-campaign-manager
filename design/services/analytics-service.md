# Analytics Service Implementation Specification

## Overview
The Analytics Service provides comprehensive data collection, processing, and reporting for the D&D AI Campaign Management System. It tracks user behavior, system performance, business metrics, and provides actionable insights for product improvement and business intelligence.

## Service Architecture

### Technology Stack
- **Framework**: ASP.NET Core 8.0
- **Database**: PostgreSQL for structured analytics data
- **Time Series DB**: InfluxDB for metrics and time-series data
- **Data Warehouse**: Azure Synapse Analytics / AWS Redshift for large-scale analytics
- **Stream Processing**: Apache Kafka + Apache Spark for real-time analytics
- **Caching**: Redis for query caching and session analytics
- **Visualization**: Grafana for dashboards, custom React components for user-facing analytics
- **Background Processing**: Hangfire for data aggregation jobs
- **Machine Learning**: ML.NET for predictive analytics

### Project Structure
```
AnalyticsService/
├── src/
│   ├── AnalyticsService.Api/              # Web API layer
│   │   ├── Controllers/
│   │   │   ├── AnalyticsController.cs     # General analytics API
│   │   │   ├── MetricsController.cs       # System metrics
│   │   │   ├── ReportsController.cs       # Reporting API
│   │   │   └── DashboardController.cs     # Dashboard data
│   │   ├── BackgroundServices/
│   │   │   ├── DataAggregationService.cs  # Data aggregation jobs
│   │   │   └── ReportGenerationService.cs # Scheduled reports
│   ├── AnalyticsService.Application/      # Application layer
│   │   ├── Commands/
│   │   │   ├── TrackEventCommand.cs       # Event tracking
│   │   │   ├── RecordMetricCommand.cs     # Metric recording
│   │   │   └── GenerateReportCommand.cs   # Report generation
│   │   ├── Queries/
│   │   │   ├── GetUserAnalyticsQuery.cs   # User analytics
│   │   │   ├── GetCampaignStatsQuery.cs   # Campaign statistics
│   │   │   └── GetSystemMetricsQuery.cs   # System performance
│   │   ├── Services/
│   │   │   ├── EventProcessing/           # Event processing
│   │   │   ├── MetricsAggregation/        # Metrics aggregation
│   │   │   ├── ReportGeneration/          # Report generation
│   │   │   └── PredictiveAnalytics/       # ML-powered insights
│   ├── AnalyticsService.Domain/           # Domain layer
│   │   ├── Entities/
│   │   │   ├── Event.cs                   # Analytics events
│   │   │   ├── Metric.cs                  # System metrics
│   │   │   ├── Report.cs                  # Generated reports
│   │   │   └── UserSession.cs             # User sessions
│   │   ├── ValueObjects/
│   │   │   ├── EventProperties.cs         # Event metadata
│   │   │   ├── MetricValue.cs             # Metric values
│   │   │   └── TimeRange.cs               # Time range queries
│   └── AnalyticsService.Infrastructure/   # Infrastructure layer
│       ├── Data/
│       ├── EventStore/
│       │   ├── PostgreSQLEventStore.cs    # Event storage
│       │   └── InfluxDBMetricStore.cs     # Metrics storage
│       ├── Processing/
│       │   ├── KafkaEventProcessor.cs     # Stream processing
│       │   └── SparkAggregationEngine.cs  # Data aggregation
│       └── Reporting/
│           ├── ReportEngine.cs            # Report generation
│           └── DashboardService.cs        # Dashboard data
```

## Domain Model

### Core Entities

#### **Event Entity**
```csharp
public class Event : Entity
{
    public Guid Id { get; private set; }
    public string EventName { get; private set; }
    public string Category { get; private set; }
    public Guid? UserId { get; private set; }
    public Guid? SessionId { get; private set; }
    public Guid? CampaignId { get; private set; }
    public EventProperties Properties { get; private set; }
    public DateTime Timestamp { get; private set; }
    public string? UserAgent { get; private set; }
    public string? IpAddress { get; private set; }
    public string? Platform { get; private set; }
    public string? Version { get; private set; }

    public Event(string eventName, string category, EventProperties properties, Guid? userId = null)
    {
        Id = Guid.NewGuid();
        EventName = eventName;
        Category = category;
        Properties = properties;
        UserId = userId;
        Timestamp = DateTime.UtcNow;
    }

    public void EnrichWithContext(string? userAgent, string? ipAddress, string? platform, string? version)
    {
        UserAgent = userAgent;
        IpAddress = ipAddress;
        Platform = platform;
        Version = version;
    }
}
```

#### **Metric Entity**
```csharp
public class Metric : Entity
{
    public Guid Id { get; private set; }
    public string Name { get; private set; }
    public MetricType Type { get; private set; }
    public MetricValue Value { get; private set; }
    public Dictionary<string, string> Tags { get; private set; } = new();
    public DateTime Timestamp { get; private set; }
    public TimeSpan? Duration { get; private set; }
    public string? Source { get; private set; }

    public Metric(string name, MetricType type, MetricValue value, Dictionary<string, string>? tags = null)
    {
        Id = Guid.NewGuid();
        Name = name;
        Type = type;
        Value = value;
        Tags = tags ?? new Dictionary<string, string>();
        Timestamp = DateTime.UtcNow;
    }
}

public enum MetricType
{
    Counter = 1,
    Gauge = 2,
    Histogram = 3,
    Timer = 4
}
```

#### **UserSession Entity**
```csharp
public class UserSession : Entity
{
    public Guid Id { get; private set; }
    public Guid UserId { get; private set; }
    public DateTime StartTime { get; private set; }
    public DateTime? EndTime { get; private set; }
    public TimeSpan? Duration => EndTime?.Subtract(StartTime);
    public string Platform { get; private set; }
    public string? UserAgent { get; private set; }
    public string? IpAddress { get; private set; }
    public List<string> PagesVisited { get; private set; } = new();
    public List<string> ActionsPerformed { get; private set; } = new();
    public int EventCount { get; private set; }
    public bool IsActive => EndTime == null;

    public void RecordPageVisit(string page)
    {
        if (!PagesVisited.Contains(page))
        {
            PagesVisited.Add(page);
        }
    }

    public void RecordAction(string action)
    {
        ActionsPerformed.Add(action);
        EventCount++;
    }

    public void EndSession()
    {
        EndTime = DateTime.UtcNow;
    }
}
```

## Application Layer

### Commands and Handlers

#### **Track Event Command**
```csharp
public record TrackEventCommand : IRequest<TrackEventResponse>
{
    public string EventName { get; init; } = string.Empty;
    public string Category { get; init; } = string.Empty;
    public Guid? UserId { get; init; }
    public Guid? SessionId { get; init; }
    public Guid? CampaignId { get; init; }
    public Dictionary<string, object> Properties { get; init; } = new();
    public string? UserAgent { get; init; }
    public string? IpAddress { get; init; }
    public string? Platform { get; init; }
}

public class TrackEventCommandHandler : IRequestHandler<TrackEventCommand, TrackEventResponse>
{
    private readonly IEventRepository _eventRepository;
    private readonly IEventProcessor _eventProcessor;
    private readonly IUserSessionService _sessionService;

    public async Task<TrackEventResponse> Handle(TrackEventCommand request, CancellationToken cancellationToken)
    {
        // Create event
        var eventProperties = new EventProperties(request.Properties);
        var analyticsEvent = new Event(request.EventName, request.Category, eventProperties, request.UserId);
        
        analyticsEvent.EnrichWithContext(request.UserAgent, request.IpAddress, request.Platform, "1.0");
        
        if (request.SessionId.HasValue)
        {
            analyticsEvent.SessionId = request.SessionId.Value;
        }
        
        if (request.CampaignId.HasValue)
        {
            analyticsEvent.CampaignId = request.CampaignId.Value;
        }

        // Store event
        await _eventRepository.AddAsync(analyticsEvent, cancellationToken);
        
        // Update user session
        if (request.UserId.HasValue)
        {
            await _sessionService.RecordEventAsync(request.UserId.Value, request.EventName);
        }

        // Process for real-time analytics
        await _eventProcessor.ProcessEventAsync(analyticsEvent);

        return new TrackEventResponse
        {
            EventId = analyticsEvent.Id,
            Timestamp = analyticsEvent.Timestamp
        };
    }
}
```

### Queries and Handlers

#### **Get User Analytics Query**
```csharp
public record GetUserAnalyticsQuery : IRequest<UserAnalyticsResponse>
{
    public Guid UserId { get; init; }
    public DateTime StartDate { get; init; }
    public DateTime EndDate { get; init; }
    public List<string> Metrics { get; init; } = new();
}

public class GetUserAnalyticsQueryHandler : IRequestHandler<GetUserAnalyticsQuery, UserAnalyticsResponse>
{
    private readonly IAnalyticsRepository _repository;
    private readonly ICacheService _cacheService;

    public async Task<UserAnalyticsResponse> Handle(GetUserAnalyticsQuery request, CancellationToken cancellationToken)
    {
        var cacheKey = $"user_analytics:{request.UserId}:{request.StartDate:yyyyMMdd}:{request.EndDate:yyyyMMdd}";
        var cachedResult = await _cacheService.GetAsync<UserAnalyticsResponse>(cacheKey);
        
        if (cachedResult != null)
        {
            return cachedResult;
        }

        var analytics = await _repository.GetUserAnalyticsAsync(
            request.UserId, 
            request.StartDate, 
            request.EndDate, 
            request.Metrics);

        var response = new UserAnalyticsResponse
        {
            UserId = request.UserId,
            Period = new TimeRange(request.StartDate, request.EndDate),
            SessionCount = analytics.SessionCount,
            TotalSessionDuration = analytics.TotalSessionDuration,
            AverageSessionDuration = analytics.AverageSessionDuration,
            EventCount = analytics.EventCount,
            CampaignsCreated = analytics.CampaignsCreated,
            CharactersCreated = analytics.CharactersCreated,
            AIGenerationsUsed = analytics.AIGenerationsUsed,
            MostUsedFeatures = analytics.MostUsedFeatures,
            ActivityByDay = analytics.ActivityByDay
        };

        await _cacheService.SetAsync(cacheKey, response, TimeSpan.FromMinutes(15));
        return response;
    }
}
```

## Infrastructure Layer

### Event Processing

#### **Event Processor**
```csharp
public interface IEventProcessor
{
    Task ProcessEventAsync(Event analyticsEvent);
    Task ProcessBatchAsync(List<Event> events);
}

public class KafkaEventProcessor : IEventProcessor
{
    private readonly IProducer<string, string> _producer;
    private readonly ILogger<KafkaEventProcessor> _logger;

    public async Task ProcessEventAsync(Event analyticsEvent)
    {
        try
        {
            var message = new Message<string, string>
            {
                Key = analyticsEvent.UserId?.ToString() ?? "anonymous",
                Value = JsonSerializer.Serialize(new
                {
                    id = analyticsEvent.Id,
                    eventName = analyticsEvent.EventName,
                    category = analyticsEvent.Category,
                    userId = analyticsEvent.UserId,
                    sessionId = analyticsEvent.SessionId,
                    campaignId = analyticsEvent.CampaignId,
                    properties = analyticsEvent.Properties.ToDictionary(),
                    timestamp = analyticsEvent.Timestamp,
                    userAgent = analyticsEvent.UserAgent,
                    platform = analyticsEvent.Platform
                })
            };

            await _producer.ProduceAsync("analytics-events", message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to process event {EventId}", analyticsEvent.Id);
            throw;
        }
    }
}
```

### Metrics Aggregation

#### **Metrics Aggregation Engine**
```csharp
public interface IMetricsAggregationEngine
{
    Task AggregateHourlyMetricsAsync(DateTime hour);
    Task AggregateDailyMetricsAsync(DateTime date);
    Task AggregateWeeklyMetricsAsync(DateTime weekStart);
    Task AggregateMonthlyMetricsAsync(DateTime monthStart);
}

public class SparkAggregationEngine : IMetricsAggregationEngine
{
    private readonly IInfluxDBClient _influxClient;
    private readonly ILogger<SparkAggregationEngine> _logger;

    public async Task AggregateHourlyMetricsAsync(DateTime hour)
    {
        var queries = new[]
        {
            // Active users per hour
            $@"
            SELECT COUNT(DISTINCT user_id) as active_users
            FROM events 
            WHERE timestamp >= '{hour:yyyy-MM-dd HH:00:00}' 
            AND timestamp < '{hour.AddHours(1):yyyy-MM-dd HH:00:00}'",
            
            // Events per hour by category
            $@"
            SELECT category, COUNT(*) as event_count
            FROM events 
            WHERE timestamp >= '{hour:yyyy-MM-dd HH:00:00}' 
            AND timestamp < '{hour.AddHours(1):yyyy-MM-dd HH:00:00}'
            GROUP BY category",
            
            // AI generation usage
            $@"
            SELECT COUNT(*) as ai_generations
            FROM events 
            WHERE event_name = 'ai_content_generated'
            AND timestamp >= '{hour:yyyy-MM-dd HH:00:00}' 
            AND timestamp < '{hour.AddHours(1):yyyy-MM-dd HH:00:00}'"
        };

        foreach (var query in queries)
        {
            try
            {
                // Execute aggregation query and store results in InfluxDB
                await ExecuteAggregationQuery(query, hour);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to execute aggregation query for hour {Hour}", hour);
            }
        }
    }
}
```

## API Controllers

### Analytics Controller

```csharp
[ApiController]
[Route("api/v1/analytics")]
[Authorize]
public class AnalyticsController : ControllerBase
{
    private readonly IMediator _mediator;

    /// <summary>
    /// Track an analytics event
    /// </summary>
    [HttpPost("events")]
    public async Task<ActionResult<TrackEventResponse>> TrackEvent([FromBody] TrackEventRequest request)
    {
        var command = new TrackEventCommand
        {
            EventName = request.EventName,
            Category = request.Category,
            UserId = User.GetUserId(),
            SessionId = request.SessionId,
            CampaignId = request.CampaignId,
            Properties = request.Properties,
            UserAgent = Request.Headers.UserAgent,
            IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString(),
            Platform = request.Platform
        };

        var result = await _mediator.Send(command);
        return Ok(result);
    }

    /// <summary>
    /// Get user analytics
    /// </summary>
    [HttpGet("users/{userId}")]
    public async Task<ActionResult<UserAnalyticsResponse>> GetUserAnalytics(
        Guid userId, 
        [FromQuery] DateTime startDate, 
        [FromQuery] DateTime endDate,
        [FromQuery] List<string> metrics)
    {
        // Ensure user can only access their own analytics or is admin
        var currentUserId = User.GetUserId();
        if (userId != currentUserId && !User.IsInRole("Admin"))
        {
            return Forbid();
        }

        var query = new GetUserAnalyticsQuery
        {
            UserId = userId,
            StartDate = startDate,
            EndDate = endDate,
            Metrics = metrics
        };

        var result = await _mediator.Send(query);
        return Ok(result);
    }

    /// <summary>
    /// Get campaign analytics
    /// </summary>
    [HttpGet("campaigns/{campaignId}")]
    public async Task<ActionResult<CampaignAnalyticsResponse>> GetCampaignAnalytics(
        Guid campaignId,
        [FromQuery] DateTime startDate,
        [FromQuery] DateTime endDate)
    {
        var query = new GetCampaignAnalyticsQuery
        {
            CampaignId = campaignId,
            StartDate = startDate,
            EndDate = endDate,
            RequestedBy = User.GetUserId()
        };

        var result = await _mediator.Send(query);
        return Ok(result);
    }

    /// <summary>
    /// Get system metrics (admin only)
    /// </summary>
    [HttpGet("system")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<SystemMetricsResponse>> GetSystemMetrics(
        [FromQuery] DateTime startDate,
        [FromQuery] DateTime endDate,
        [FromQuery] string aggregation = "hourly")
    {
        var query = new GetSystemMetricsQuery
        {
            StartDate = startDate,
            EndDate = endDate,
            Aggregation = aggregation
        };

        var result = await _mediator.Send(query);
        return Ok(result);
    }
}
```

## Background Services

### Data Aggregation Service

```csharp
public class DataAggregationService : BackgroundService
{
    private readonly IMetricsAggregationEngine _aggregationEngine;
    private readonly ILogger<DataAggregationService> _logger;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var currentHour = DateTime.UtcNow.Date.AddHours(DateTime.UtcNow.Hour);
                var previousHour = currentHour.AddHours(-1);

                // Aggregate data for the previous hour
                await _aggregationEngine.AggregateHourlyMetricsAsync(previousHour);

                // If it's the first hour of the day, aggregate daily metrics
                if (currentHour.Hour == 0)
                {
                    var yesterday = currentHour.AddDays(-1);
                    await _aggregationEngine.AggregateDailyMetricsAsync(yesterday);
                }

                // If it's Monday, aggregate weekly metrics
                if (currentHour.DayOfWeek == DayOfWeek.Monday && currentHour.Hour == 0)
                {
                    var lastWeek = currentHour.AddDays(-7);
                    await _aggregationEngine.AggregateWeeklyMetricsAsync(lastWeek);
                }

                // If it's the first day of the month, aggregate monthly metrics
                if (currentHour.Day == 1 && currentHour.Hour == 0)
                {
                    var lastMonth = currentHour.AddMonths(-1);
                    await _aggregationEngine.AggregateMonthlyMetricsAsync(lastMonth);
                }

                // Wait for the next hour
                var nextRun = currentHour.AddHours(1);
                var delay = nextRun - DateTime.UtcNow;
                
                if (delay > TimeSpan.Zero)
                {
                    await Task.Delay(delay, stoppingToken);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in data aggregation service");
                await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken);
            }
        }
    }
}
```

## Configuration

### Configuration Settings

```json
{
  "Analytics": {
    "EnableRealTimeProcessing": true,
    "BatchSize": 1000,
    "RetentionDays": {
      "RawEvents": 90,
      "HourlyAggregates": 365,
      "DailyAggregates": 1095,
      "MonthlyAggregates": -1
    }
  },
  "Kafka": {
    "BootstrapServers": "localhost:9092",
    "Topics": {
      "Events": "analytics-events",
      "Metrics": "analytics-metrics"
    }
  },
  "InfluxDB": {
    "Url": "http://localhost:8086",
    "Database": "dndai_analytics",
    "Username": "analytics_user",
    "Password": "analytics_password"
  },
  "Spark": {
    "MasterUrl": "spark://localhost:7077",
    "ApplicationName": "DnDAI-Analytics"
  }
}
```

## Key Analytics Events

### User Behavior Events
- `user_registered` - New user registration
- `user_login` - User login
- `user_logout` - User logout
- `page_view` - Page/screen view
- `feature_used` - Feature usage tracking

### Campaign Events
- `campaign_created` - New campaign created
- `campaign_joined` - User joined campaign
- `session_started` - Game session started
- `session_ended` - Game session ended
- `dice_rolled` - Dice roll performed

### AI Events
- `ai_content_generated` - AI content generated
- `ai_generation_failed` - AI generation failed
- `ai_content_rated` - User rated AI content
- `ai_provider_switched` - AI provider failover

### System Events
- `api_request` - API request made
- `error_occurred` - System error
- `performance_metric` - Performance measurement

## Summary

The Analytics Service provides:

1. **Comprehensive Event Tracking** - User behavior, system events, business metrics
2. **Real-time Processing** - Stream processing with Kafka and Spark
3. **Multi-dimensional Analytics** - User, campaign, system, and AI analytics
4. **Automated Aggregation** - Hourly, daily, weekly, and monthly rollups
5. **Performance Monitoring** - System metrics and performance tracking
6. **User Privacy** - Privacy-compliant analytics with data retention policies
7. **Scalable Architecture** - Handles high-volume event processing
8. **Business Intelligence** - Actionable insights for product and business decisions
9. **Custom Reporting** - Flexible reporting and dashboard capabilities
10. **Predictive Analytics** - ML-powered insights and recommendations

The service provides the data foundation for making informed product decisions, optimizing user experience, and driving business growth while maintaining user privacy and system performance.
