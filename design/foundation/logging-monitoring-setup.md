# Logging & Monitoring Setup

## Overview
This document establishes comprehensive logging, monitoring, and observability standards for the D&D AI Campaign Management System using structured logging with Serilog, distributed tracing, and health monitoring.

---

## Structured Logging with Serilog

### Serilog Configuration
```csharp
// Program.cs
Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Information()
    .MinimumLevel.Override("Microsoft", LogEventLevel.Warning)
    .MinimumLevel.Override("System", LogEventLevel.Warning)
    .Enrich.FromLogContext()
    .Enrich.WithMachineName()
    .Enrich.WithEnvironmentName()
    .Enrich.WithProperty("Service", "CampaignService")
    .WriteTo.Console(new JsonFormatter())
    .WriteTo.File(
        path: "/logs/campaign-service-.log",
        formatter: new JsonFormatter(),
        rollingInterval: RollingInterval.Day,
        retainedFileCountLimit: 30)
    .WriteTo.Elasticsearch(new ElasticsearchSinkOptions(new Uri("http://elasticsearch:9200"))
    {
        IndexFormat = "dndai-logs-{0:yyyy.MM.dd}",
        AutoRegisterTemplate = true,
        NumberOfShards = 2,
        NumberOfReplicas = 1
    })
    .CreateLogger();

builder.Host.UseSerilog();
```

### Log Levels and Usage
```csharp
// Trace: Detailed internal flow
_logger.LogTrace("Entering method {MethodName} with parameters {Parameters}", 
    nameof(CreateCampaign), new { campaignId, userId });

// Debug: Diagnostic information
_logger.LogDebug("Processing campaign creation for user {UserId}", userId);

// Information: General application flow
_logger.LogInformation("Campaign {CampaignId} created successfully by user {UserId}", 
    campaignId, userId);

// Warning: Unexpected but recoverable events
_logger.LogWarning("Rate limit approaching for user {UserId}: {CurrentRequests}/{MaxRequests}", 
    userId, currentRequests, maxRequests);

// Error: Error events but application continues
_logger.LogError(ex, "Failed to create campaign for user {UserId}: {ErrorMessage}", 
    userId, ex.Message);

// Critical: Serious errors that might cause application termination
_logger.LogCritical(ex, "Database connection lost: {ErrorMessage}", ex.Message);
```

### Structured Logging Patterns
```csharp
public class CampaignService
{
    private readonly ILogger<CampaignService> _logger;

    public async Task<Campaign> CreateCampaignAsync(CreateCampaignRequest request, string userId)
    {
        using var activity = _logger.BeginScope(new Dictionary<string, object>
        {
            ["OperationId"] = Guid.NewGuid(),
            ["UserId"] = userId,
            ["Operation"] = "CreateCampaign"
        });

        var stopwatch = Stopwatch.StartNew();

        try
        {
            _logger.LogInformation("Starting campaign creation for user {UserId}", userId);

            // Validation
            if (string.IsNullOrEmpty(request.Name))
            {
                _logger.LogWarning("Campaign creation failed: missing name for user {UserId}", userId);
                throw new ValidationException("Campaign name is required");
            }

            // Business logic
            var campaign = new Campaign
            {
                Id = Guid.NewGuid().ToString(),
                Name = request.Name,
                UserId = userId,
                CreatedAt = DateTime.UtcNow
            };

            await _repository.AddAsync(campaign);

            stopwatch.Stop();
            _logger.LogInformation("Campaign {CampaignId} created successfully in {ElapsedMs}ms", 
                campaign.Id, stopwatch.ElapsedMilliseconds);

            return campaign;
        }
        catch (Exception ex)
        {
            stopwatch.Stop();
            _logger.LogError(ex, "Campaign creation failed for user {UserId} after {ElapsedMs}ms", 
                userId, stopwatch.ElapsedMilliseconds);
            throw;
        }
    }
}
```

### Log Context Enrichment
```csharp
// Custom enrichers
public class RequestEnricher : ILogEventEnricher
{
    public void Enrich(LogEvent logEvent, ILogEventPropertyFactory factory)
    {
        var httpContext = httpContextAccessor.HttpContext;
        if (httpContext != null)
        {
            logEvent.AddPropertyIfAbsent(factory.CreateProperty("RequestId", 
                httpContext.TraceIdentifier));
            logEvent.AddPropertyIfAbsent(factory.CreateProperty("UserId", 
                httpContext.User?.FindFirst("sub")?.Value));
            logEvent.AddPropertyIfAbsent(factory.CreateProperty("UserAgent", 
                httpContext.Request.Headers["User-Agent"].ToString()));
            logEvent.AddPropertyIfAbsent(factory.CreateProperty("ClientIP", 
                httpContext.Connection.RemoteIpAddress?.ToString()));
        }
    }
}

// Middleware for request logging
public class RequestLoggingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<RequestLoggingMiddleware> _logger;

    public async Task InvokeAsync(HttpContext context)
    {
        var stopwatch = Stopwatch.StartNew();
        var requestId = context.TraceIdentifier;

        _logger.LogInformation("HTTP {Method} {Path} started", 
            context.Request.Method, context.Request.Path);

        try
        {
            await _next(context);
        }
        finally
        {
            stopwatch.Stop();
            _logger.LogInformation("HTTP {Method} {Path} responded {StatusCode} in {ElapsedMs}ms",
                context.Request.Method,
                context.Request.Path,
                context.Response.StatusCode,
                stopwatch.ElapsedMilliseconds);
        }
    }
}
```

---

## Monitoring and Observability

### Application Metrics with Prometheus
```csharp
// Metrics configuration
services.AddSingleton<IMetricsRoot>(provider =>
{
    var metrics = new MetricsBuilder()
        .Configuration.Configure(options =>
        {
            options.GlobalTags.Add("service", "campaign-service");
            options.GlobalTags.Add("environment", environment);
        })
        .Report.ToPrometheusMetrics()
        .Build();
    
    return metrics;
});

// Custom metrics
public class CampaignMetrics
{
    private readonly IMetricsRoot _metrics;
    
    public CampaignMetrics(IMetricsRoot metrics)
    {
        _metrics = metrics;
        
        CampaignsCreated = _metrics.Measure.Counter.Options("campaigns_created_total", 
            "Total number of campaigns created");
        
        CampaignCreationDuration = _metrics.Measure.Timer.Options("campaign_creation_duration_ms",
            "Duration of campaign creation operations");
            
        ActiveCampaigns = _metrics.Measure.Gauge.Options("active_campaigns_count",
            "Number of currently active campaigns");
    }
    
    public ICounter CampaignsCreated { get; }
    public ITimer CampaignCreationDuration { get; }
    public IGauge ActiveCampaigns { get; }
}

// Usage in service
public async Task<Campaign> CreateCampaignAsync(CreateCampaignRequest request)
{
    using var timer = _metrics.CampaignCreationDuration.NewContext();
    
    try
    {
        var campaign = await CreateCampaignInternalAsync(request);
        
        _metrics.CampaignsCreated.Increment(new MetricTags("status", "success"));
        _metrics.ActiveCampaigns.Increment();
        
        return campaign;
    }
    catch (Exception ex)
    {
        _metrics.CampaignsCreated.Increment(new MetricTags("status", "error"));
        throw;
    }
}
```

### Distributed Tracing with OpenTelemetry
```csharp
// OpenTelemetry configuration
services.AddOpenTelemetry()
    .WithTracing(builder => builder
        .SetSampler(new TraceIdRatioBasedSampler(0.1))
        .AddSource("DnDAI.CampaignService")
        .AddAspNetCoreInstrumentation(options =>
        {
            options.RecordException = true;
            options.Filter = (httpContext) => 
                !httpContext.Request.Path.StartsWithSegments("/health");
        })
        .AddHttpClientInstrumentation()
        .AddEntityFrameworkCoreInstrumentation()
        .AddJaegerExporter(options =>
        {
            options.AgentHost = "jaeger";
            options.AgentPort = 6831;
        }));

// Custom activity source
public class CampaignService
{
    private static readonly ActivitySource ActivitySource = new("DnDAI.CampaignService");
    
    public async Task<Campaign> CreateCampaignAsync(CreateCampaignRequest request)
    {
        using var activity = ActivitySource.StartActivity("CreateCampaign");
        activity?.SetTag("user.id", request.UserId);
        activity?.SetTag("campaign.name", request.Name);
        
        try
        {
            var campaign = await CreateCampaignInternalAsync(request);
            activity?.SetTag("campaign.id", campaign.Id);
            activity?.SetStatus(ActivityStatusCode.Ok);
            return campaign;
        }
        catch (Exception ex)
        {
            activity?.SetStatus(ActivityStatusCode.Error, ex.Message);
            throw;
        }
    }
}
```

### Performance Monitoring
```csharp
// Custom performance counters
public class PerformanceMiddleware
{
    private readonly RequestDelegate _next;
    private readonly IMetricsRoot _metrics;
    private readonly ILogger<PerformanceMiddleware> _logger;

    public async Task InvokeAsync(HttpContext context)
    {
        var stopwatch = Stopwatch.StartNew();
        var endpoint = context.Request.Path.ToString();

        try
        {
            await _next(context);
        }
        finally
        {
            stopwatch.Stop();
            var duration = stopwatch.ElapsedMilliseconds;

            // Log slow requests
            if (duration > 1000)
            {
                _logger.LogWarning("Slow request detected: {Method} {Path} took {Duration}ms",
                    context.Request.Method, context.Request.Path, duration);
            }

            // Record metrics
            _metrics.Measure.Timer.Instance("http_request_duration_ms")
                .Record(duration, new MetricTags(
                    "method", context.Request.Method,
                    "endpoint", endpoint,
                    "status", context.Response.StatusCode.ToString()));
        }
    }
}
```

---

## Health Check Implementations

### Basic Health Checks
```csharp
// Health check configuration
services.AddHealthChecks()
    .AddCheck("self", () => HealthCheckResult.Healthy("Service is running"))
    .AddDbContextCheck<CampaignDbContext>("database")
    .AddRedis(connectionString: "localhost:6379", name: "redis")
    .AddUrlGroup(new Uri("http://character-service/health"), "character-service")
    .AddCheck<ExternalApiHealthCheck>("external-api")
    .AddCheck<DiskSpaceHealthCheck>("disk-space");

// Health check endpoints
app.MapHealthChecks("/health", new HealthCheckOptions
{
    ResponseWriter = UIResponseWriter.WriteHealthCheckUIResponse
});

app.MapHealthChecks("/health/ready", new HealthCheckOptions
{
    Predicate = check => check.Tags.Contains("ready"),
    ResponseWriter = UIResponseWriter.WriteHealthCheckUIResponse
});

app.MapHealthChecks("/health/live", new HealthCheckOptions
{
    Predicate = _ => false,
    ResponseWriter = UIResponseWriter.WriteHealthCheckUIResponse
});
```

### Custom Health Checks
```csharp
public class ExternalApiHealthCheck : IHealthCheck
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<ExternalApiHealthCheck> _logger;

    public ExternalApiHealthCheck(HttpClient httpClient, ILogger<ExternalApiHealthCheck> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
    }

    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context, 
        CancellationToken cancellationToken = default)
    {
        try
        {
            var stopwatch = Stopwatch.StartNew();
            var response = await _httpClient.GetAsync("/api/v1/health", cancellationToken);
            stopwatch.Stop();

            if (response.IsSuccessStatusCode)
            {
                var data = new Dictionary<string, object>
                {
                    ["response_time_ms"] = stopwatch.ElapsedMilliseconds,
                    ["status_code"] = (int)response.StatusCode
                };

                return stopwatch.ElapsedMilliseconds < 5000
                    ? HealthCheckResult.Healthy("External API is responsive", data)
                    : HealthCheckResult.Degraded("External API is slow", data);
            }

            return HealthCheckResult.Unhealthy($"External API returned {response.StatusCode}");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Health check failed for external API");
            return HealthCheckResult.Unhealthy("External API is unreachable", ex);
        }
    }
}

public class DiskSpaceHealthCheck : IHealthCheck
{
    private readonly ILogger<DiskSpaceHealthCheck> _logger;
    private const long MinimumFreeBytesThreshold = 1_000_000_000; // 1GB

    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var drives = DriveInfo.GetDrives()
                .Where(d => d.IsReady && d.DriveType == DriveType.Fixed);

            var data = new Dictionary<string, object>();
            var isHealthy = true;

            foreach (var drive in drives)
            {
                var freeSpaceGB = drive.AvailableFreeSpace / 1_000_000_000.0;
                var totalSpaceGB = drive.TotalSize / 1_000_000_000.0;
                var usagePercent = (totalSpaceGB - freeSpaceGB) / totalSpaceGB * 100;

                data[$"drive_{drive.Name.Replace("\\", "_")}_free_gb"] = Math.Round(freeSpaceGB, 2);
                data[$"drive_{drive.Name.Replace("\\", "_")}_usage_percent"] = Math.Round(usagePercent, 2);

                if (drive.AvailableFreeSpace < MinimumFreeBytesThreshold)
                {
                    isHealthy = false;
                }
            }

            return isHealthy
                ? HealthCheckResult.Healthy("Sufficient disk space available", data)
                : HealthCheckResult.Unhealthy("Low disk space detected", data);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Disk space health check failed");
            return HealthCheckResult.Unhealthy("Unable to check disk space", ex);
        }
    }
}
```

### Health Check Dashboard
```csharp
// Health check UI configuration
services.AddHealthChecksUI(options =>
{
    options.AddHealthCheckEndpoint("Campaign Service", "http://campaign-service/health");
    options.AddHealthCheckEndpoint("Character Service", "http://character-service/health");
    options.AddHealthCheckEndpoint("AI Gateway", "http://ai-gateway/health");
    options.AddHealthCheckEndpoint("API Gateway", "http://api-gateway/health");
    
    options.SetEvaluationTimeInSeconds(30);
    options.SetMinimumSecondsBetweenFailureNotifications(60);
})
.AddInMemoryStorage();

app.MapHealthChecksUI(options =>
{
    options.UIPath = "/health-ui";
    options.ApiPath = "/health-ui-api";
});
```

---

## Alerting and Notifications

### Prometheus Alert Rules
```yaml
# prometheus-rules.yml
groups:
  - name: dndai-alerts
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value }} errors per second"

      - alert: HighResponseTime
        expr: histogram_quantile(0.95, rate(http_request_duration_ms_bucket[5m])) > 1000
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High response time detected"
          description: "95th percentile response time is {{ $value }}ms"

      - alert: ServiceDown
        expr: up == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Service is down"
          description: "{{ $labels.instance }} has been down for more than 1 minute"

      - alert: DatabaseConnectionFailure
        expr: health_check_status{check="database"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Database connection failure"
          description: "Unable to connect to database"
```

### Log-based Alerts
```csharp
// Serilog configuration for alerts
.WriteTo.Conditional(
    evt => evt.Level >= LogEventLevel.Error,
    wt => wt.Http("http://alertmanager:9093/api/v1/alerts", 
        textFormatter: new JsonFormatter()))
```

---

## Monitoring Stack Configuration

### Docker Compose for Monitoring
```yaml
# docker-compose.monitoring.yml
version: '3.8'
services:
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - ./monitoring/rules:/etc/prometheus/rules

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana-storage:/var/lib/grafana
      - ./monitoring/grafana/dashboards:/etc/grafana/provisioning/dashboards
      - ./monitoring/grafana/datasources:/etc/grafana/provisioning/datasources

  jaeger:
    image: jaegertracing/all-in-one:latest
    ports:
      - "16686:16686"
      - "6831:6831/udp"
    environment:
      - COLLECTOR_OTLP_ENABLED=true

  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.5.0
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
    ports:
      - "9200:9200"

  kibana:
    image: docker.elastic.co/kibana/kibana:8.5.0
    ports:
      - "5601:5601"
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200

volumes:
  grafana-storage:
```

---

## Performance Baselines and SLAs

### Service Level Objectives (SLOs)
- **Availability**: 99.9% uptime
- **Response Time**: 
  - 95th percentile < 200ms for read operations
  - 95th percentile < 500ms for write operations
- **Error Rate**: < 0.1% of all requests
- **Throughput**: Handle 1000 requests/second per service

### Key Performance Indicators (KPIs)
- Request latency percentiles (50th, 95th, 99th)
- Error rates by endpoint and status code
- Database query performance
- Cache hit/miss ratios
- Resource utilization (CPU, memory, disk)
- Queue depths and processing times

This comprehensive logging and monitoring setup ensures full observability across the D&D AI Campaign Management System, enabling proactive issue detection and resolution.
