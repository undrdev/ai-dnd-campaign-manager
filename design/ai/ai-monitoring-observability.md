# AI Monitoring & Observability System

## Overview
This document defines the comprehensive monitoring and observability system for AI services, including performance monitoring, quality tracking, cost analysis, usage analytics, alert management, and real-time dashboards to ensure optimal AI system operation and continuous improvement.

---

## AI Monitoring Architecture

### **Multi-Layer Observability Stack**
```
┌─────────────────────────────────────────────────────────────────┐
│                    AI Service Operations                        │
└─────────────────────────────────────────────────────────────────┘
                                │
                    ┌───────────────────────┐
                    │   Metrics Collection  │
                    │ (Performance, Quality,│
                    │  Usage, Errors)       │
                    └───────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
┌───────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Real-time   │    │   Time Series   │    │   Log           │
│   Metrics     │    │   Database      │    │   Aggregation   │
│  (Prometheus) │    │  (InfluxDB)     │    │ (Elasticsearch) │
└───────────────┘    └─────────────────┘    └─────────────────┘
        │                       │                       │
        └───────────────────────┼───────────────────────┘
                                │
                    ┌───────────────────────┐
                    │   Analytics &         │
                    │   Visualization       │
                    │  (Grafana, Custom     │
                    │   Dashboards)         │
                    └───────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
┌───────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Alerting    │    │   Anomaly       │    │   Reporting     │
│   System      │    │   Detection     │    │   & Analytics   │
│(Alertmanager) │    │  (ML-based)     │    │  (Business      │
└───────────────┘    └─────────────────┘    │   Intelligence) │
                                            └─────────────────┘
```

### **Core AI Monitoring Interface**
```csharp
public interface IAIMonitoringService
{
    // Metrics collection and tracking
    Task RecordMetricAsync(AIMetric metric);
    Task RecordBatchMetricsAsync(List<AIMetric> metrics);
    Task<List<AIMetric>> GetMetricsAsync(MetricsQuery query);
    Task<MetricsSummary> GetMetricsSummaryAsync(MetricsSummaryRequest request);
    
    // Performance monitoring
    Task<PerformanceMetrics> GetPerformanceMetricsAsync(TimeSpan period);
    Task<List<PerformanceAlert>> GetPerformanceAlertsAsync(AlertFilter filter);
    Task<ProviderPerformanceComparison> CompareProviderPerformanceAsync(TimeSpan period);
    
    // Quality monitoring
    Task<QualityMetrics> GetQualityMetricsAsync(TimeSpan period);
    Task<QualityTrendAnalysis> GetQualityTrendsAsync(TimeSpan period);
    Task<List<QualityAlert>> GetQualityAlertsAsync(AlertFilter filter);
    
    // Cost monitoring
    Task<CostMetrics> GetCostMetricsAsync(TimeSpan period);
    Task<CostProjection> GetCostProjectionAsync(int daysAhead);
    Task<List<CostAlert>> GetCostAlertsAsync(AlertFilter filter);
    Task<CostOptimizationSuggestions> GetCostOptimizationSuggestionsAsync();
    
    // Usage analytics
    Task<UsageAnalytics> GetUsageAnalyticsAsync(UsageAnalyticsRequest request);
    Task<UserBehaviorAnalytics> GetUserBehaviorAnalyticsAsync(TimeSpan period);
    Task<FeatureUsageAnalytics> GetFeatureUsageAnalyticsAsync(TimeSpan period);
    
    // Health monitoring
    Task<SystemHealthStatus> GetSystemHealthAsync();
    Task<List<HealthCheck>> RunHealthChecksAsync();
    Task<ServiceAvailability> GetServiceAvailabilityAsync(TimeSpan period);
    
    // Alerting and notifications
    Task CreateAlertRuleAsync(AlertRule rule);
    Task<List<Alert>> GetActiveAlertsAsync();
    Task AcknowledgeAlertAsync(Guid alertId, string acknowledgedBy);
    Task<AlertConfiguration> GetAlertConfigurationAsync();
    
    // Dashboards and reporting
    Task<Dashboard> GetDashboardAsync(string dashboardId);
    Task<List<Dashboard>> GetAvailableDashboardsAsync();
    Task<Report> GenerateReportAsync(ReportRequest request);
}

public enum MetricType
{
    Counter,        // Incrementing counter (requests, errors)
    Gauge,          // Current value (active connections, queue size)
    Histogram,      // Distribution of values (response times, costs)
    Summary         // Quantiles and totals (percentiles)
}

public enum AlertSeverity
{
    Info,           // Informational
    Warning,        // Warning condition
    Critical,       // Critical issue
    Emergency       // System down
}

public class AIMetric
{
    public string Name { get; set; } = string.Empty;
    public MetricType Type { get; set; }
    public double Value { get; set; }
    public DateTime Timestamp { get; set; }
    public Dictionary<string, string> Labels { get; set; } = new();
    public Dictionary<string, object> Metadata { get; set; } = new();
}

public class MetricsQuery
{
    public string MetricName { get; set; } = string.Empty;
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public Dictionary<string, string> LabelFilters { get; set; } = new();
    public string AggregationFunction { get; set; } = "avg"; // avg, sum, min, max, count
    public TimeSpan? GroupByInterval { get; set; }
    public int? Limit { get; set; }
}
```

### **AI Monitoring Service Implementation**
```csharp
public class AIMonitoringService : IAIMonitoringService
{
    private readonly IMetricsCollector _metricsCollector;
    private readonly ITimeSeriesDatabase _timeSeriesDb;
    private readonly IAlertingService _alertingService;
    private readonly IAnomalyDetectionService _anomalyDetection;
    private readonly IDashboardService _dashboardService;
    private readonly ILogger<AIMonitoringService> _logger;

    public async Task RecordMetricAsync(AIMetric metric)
    {
        try
        {
            // Validate metric
            if (!IsValidMetric(metric))
            {
                _logger.LogWarning("Invalid metric received: {MetricName}", metric.Name);
                return;
            }

            // Store in time series database
            await _timeSeriesDb.WriteMetricAsync(metric);

            // Update real-time metrics
            await _metricsCollector.UpdateMetricAsync(metric);

            // Check for anomalies
            await _anomalyDetection.CheckForAnomaliesAsync(metric);

            // Trigger alerts if necessary
            await CheckAlertConditionsAsync(metric);

            _logger.LogDebug("Recorded metric: {MetricName} = {Value}", metric.Name, metric.Value);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to record metric: {MetricName}", metric.Name);
        }
    }

    public async Task<PerformanceMetrics> GetPerformanceMetricsAsync(TimeSpan period)
    {
        var endTime = DateTime.UtcNow;
        var startTime = endTime.Subtract(period);

        var metrics = new PerformanceMetrics
        {
            Period = period,
            StartTime = startTime,
            EndTime = endTime
        };

        try
        {
            // Response time metrics
            var responseTimeQuery = new MetricsQuery
            {
                MetricName = "ai_response_time_seconds",
                StartTime = startTime,
                EndTime = endTime,
                AggregationFunction = "avg"
            };
            var responseTimeData = await _timeSeriesDb.QueryMetricsAsync(responseTimeQuery);
            metrics.AverageResponseTime = TimeSpan.FromSeconds(responseTimeData.Average(d => d.Value));
            metrics.P95ResponseTime = TimeSpan.FromSeconds(CalculatePercentile(responseTimeData.Select(d => d.Value), 0.95));
            metrics.P99ResponseTime = TimeSpan.FromSeconds(CalculatePercentile(responseTimeData.Select(d => d.Value), 0.99));

            // Request rate metrics
            var requestRateQuery = new MetricsQuery
            {
                MetricName = "ai_requests_total",
                StartTime = startTime,
                EndTime = endTime,
                AggregationFunction = "sum"
            };
            var requestRateData = await _timeSeriesDb.QueryMetricsAsync(requestRateQuery);
            metrics.RequestsPerSecond = requestRateData.Sum(d => d.Value) / period.TotalSeconds;

            // Error rate metrics
            var errorRateQuery = new MetricsQuery
            {
                MetricName = "ai_errors_total",
                StartTime = startTime,
                EndTime = endTime,
                AggregationFunction = "sum"
            };
            var errorRateData = await _timeSeriesDb.QueryMetricsAsync(errorRateQuery);
            var totalErrors = errorRateData.Sum(d => d.Value);
            var totalRequests = requestRateData.Sum(d => d.Value);
            metrics.ErrorRate = totalRequests > 0 ? (float)(totalErrors / totalRequests) : 0f;

            // Token usage metrics
            var tokenUsageQuery = new MetricsQuery
            {
                MetricName = "ai_tokens_used_total",
                StartTime = startTime,
                EndTime = endTime,
                AggregationFunction = "sum"
            };
            var tokenUsageData = await _timeSeriesDb.QueryMetricsAsync(tokenUsageQuery);
            metrics.TotalTokensUsed = (long)tokenUsageData.Sum(d => d.Value);
            metrics.AverageTokensPerRequest = totalRequests > 0 ? metrics.TotalTokensUsed / totalRequests : 0;

            // Provider performance breakdown
            metrics.ProviderPerformance = await GetProviderPerformanceBreakdownAsync(startTime, endTime);

            // Request type breakdown
            metrics.RequestTypePerformance = await GetRequestTypePerformanceBreakdownAsync(startTime, endTime);

            return metrics;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get performance metrics");
            throw;
        }
    }

    public async Task<QualityMetrics> GetQualityMetricsAsync(TimeSpan period)
    {
        var endTime = DateTime.UtcNow;
        var startTime = endTime.Subtract(period);

        var metrics = new QualityMetrics
        {
            Period = period,
            StartTime = startTime,
            EndTime = endTime
        };

        try
        {
            // Overall quality score
            var qualityScoreQuery = new MetricsQuery
            {
                MetricName = "ai_quality_score",
                StartTime = startTime,
                EndTime = endTime,
                AggregationFunction = "avg"
            };
            var qualityScoreData = await _timeSeriesDb.QueryMetricsAsync(qualityScoreQuery);
            metrics.AverageQualityScore = (float)qualityScoreData.Average(d => d.Value);
            metrics.MinQualityScore = (float)qualityScoreData.Min(d => d.Value);
            metrics.MaxQualityScore = (float)qualityScoreData.Max(d => d.Value);

            // Quality dimension breakdown
            var dimensions = new[] { "technical", "content", "dnd_compliance", "narrative", "user_experience" };
            foreach (var dimension in dimensions)
            {
                var dimensionQuery = new MetricsQuery
                {
                    MetricName = $"ai_quality_{dimension}_score",
                    StartTime = startTime,
                    EndTime = endTime,
                    AggregationFunction = "avg"
                };
                var dimensionData = await _timeSeriesDb.QueryMetricsAsync(dimensionQuery);
                if (dimensionData.Any())
                {
                    metrics.QualityDimensions[dimension] = (float)dimensionData.Average(d => d.Value);
                }
            }

            // Content filtering metrics
            var filteredContentQuery = new MetricsQuery
            {
                MetricName = "ai_content_filtered_total",
                StartTime = startTime,
                EndTime = endTime,
                AggregationFunction = "sum"
            };
            var filteredContentData = await _timeSeriesDb.QueryMetricsAsync(filteredContentQuery);
            var totalFiltered = filteredContentData.Sum(d => d.Value);
            
            var totalRequestsQuery = new MetricsQuery
            {
                MetricName = "ai_requests_total",
                StartTime = startTime,
                EndTime = endTime,
                AggregationFunction = "sum"
            };
            var totalRequestsData = await _timeSeriesDb.QueryMetricsAsync(totalRequestsQuery);
            var totalRequests = totalRequestsData.Sum(d => d.Value);
            
            metrics.ContentFilterRate = totalRequests > 0 ? (float)(totalFiltered / totalRequests) : 0f;

            // User satisfaction metrics (from feedback)
            var satisfactionQuery = new MetricsQuery
            {
                MetricName = "ai_user_satisfaction_score",
                StartTime = startTime,
                EndTime = endTime,
                AggregationFunction = "avg"
            };
            var satisfactionData = await _timeSeriesDb.QueryMetricsAsync(satisfactionQuery);
            if (satisfactionData.Any())
            {
                metrics.UserSatisfactionScore = (float)satisfactionData.Average(d => d.Value);
            }

            return metrics;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get quality metrics");
            throw;
        }
    }

    public async Task<CostMetrics> GetCostMetricsAsync(TimeSpan period)
    {
        var endTime = DateTime.UtcNow;
        var startTime = endTime.Subtract(period);

        var metrics = new CostMetrics
        {
            Period = period,
            StartTime = startTime,
            EndTime = endTime
        };

        try
        {
            // Total cost
            var costQuery = new MetricsQuery
            {
                MetricName = "ai_cost_usd_total",
                StartTime = startTime,
                EndTime = endTime,
                AggregationFunction = "sum"
            };
            var costData = await _timeSeriesDb.QueryMetricsAsync(costQuery);
            metrics.TotalCost = (decimal)costData.Sum(d => d.Value);

            // Cost per request
            var requestsQuery = new MetricsQuery
            {
                MetricName = "ai_requests_total",
                StartTime = startTime,
                EndTime = endTime,
                AggregationFunction = "sum"
            };
            var requestsData = await _timeSeriesDb.QueryMetricsAsync(requestsQuery);
            var totalRequests = requestsData.Sum(d => d.Value);
            metrics.CostPerRequest = totalRequests > 0 ? metrics.TotalCost / (decimal)totalRequests : 0m;

            // Cost by provider
            var providers = new[] { "openai", "anthropic", "local" };
            foreach (var provider in providers)
            {
                var providerCostQuery = new MetricsQuery
                {
                    MetricName = "ai_cost_usd_total",
                    StartTime = startTime,
                    EndTime = endTime,
                    LabelFilters = new Dictionary<string, string> { ["provider"] = provider },
                    AggregationFunction = "sum"
                };
                var providerCostData = await _timeSeriesDb.QueryMetricsAsync(providerCostQuery);
                if (providerCostData.Any())
                {
                    metrics.CostByProvider[provider] = (decimal)providerCostData.Sum(d => d.Value);
                }
            }

            // Cost by request type
            var requestTypes = Enum.GetNames<AIRequestType>();
            foreach (var requestType in requestTypes)
            {
                var typeCostQuery = new MetricsQuery
                {
                    MetricName = "ai_cost_usd_total",
                    StartTime = startTime,
                    EndTime = endTime,
                    LabelFilters = new Dictionary<string, string> { ["request_type"] = requestType },
                    AggregationFunction = "sum"
                };
                var typeCostData = await _timeSeriesDb.QueryMetricsAsync(typeCostQuery);
                if (typeCostData.Any())
                {
                    metrics.CostByRequestType[requestType] = (decimal)typeCostData.Sum(d => d.Value);
                }
            }

            // Daily cost trend
            var dailyCostQuery = new MetricsQuery
            {
                MetricName = "ai_cost_usd_total",
                StartTime = startTime,
                EndTime = endTime,
                AggregationFunction = "sum",
                GroupByInterval = TimeSpan.FromDays(1)
            };
            var dailyCostData = await _timeSeriesDb.QueryMetricsAsync(dailyCostQuery);
            metrics.DailyCostTrend = dailyCostData.ToDictionary(
                d => d.Timestamp.Date,
                d => (decimal)d.Value
            );

            return metrics;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get cost metrics");
            throw;
        }
    }

    public async Task<SystemHealthStatus> GetSystemHealthAsync()
    {
        var health = new SystemHealthStatus
        {
            CheckedAt = DateTime.UtcNow
        };

        try
        {
            // Run all health checks
            var healthChecks = await RunHealthChecksAsync();
            health.HealthChecks = healthChecks;

            // Determine overall health
            var criticalFailures = healthChecks.Count(hc => !hc.IsHealthy && hc.Severity == HealthCheckSeverity.Critical);
            var warnings = healthChecks.Count(hc => !hc.IsHealthy && hc.Severity == HealthCheckSeverity.Warning);

            if (criticalFailures > 0)
            {
                health.OverallStatus = HealthStatus.Critical;
                health.StatusMessage = $"{criticalFailures} critical health check(s) failing";
            }
            else if (warnings > 0)
            {
                health.OverallStatus = HealthStatus.Warning;
                health.StatusMessage = $"{warnings} warning(s) detected";
            }
            else
            {
                health.OverallStatus = HealthStatus.Healthy;
                health.StatusMessage = "All systems operational";
            }

            // Calculate uptime
            health.Uptime = await CalculateSystemUptimeAsync();

            // Get current load metrics
            health.CurrentLoad = await GetCurrentSystemLoadAsync();

            return health;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get system health");
            
            health.OverallStatus = HealthStatus.Critical;
            health.StatusMessage = $"Health check failed: {ex.Message}";
            
            return health;
        }
    }

    private async Task<List<HealthCheck>> RunHealthChecksAsync()
    {
        var healthChecks = new List<HealthCheck>();

        // AI Provider health checks
        var providerChecks = await RunProviderHealthChecksAsync();
        healthChecks.AddRange(providerChecks);

        // Database health checks
        var databaseChecks = await RunDatabaseHealthChecksAsync();
        healthChecks.AddRange(databaseChecks);

        // Cache health checks
        var cacheChecks = await RunCacheHealthChecksAsync();
        healthChecks.AddRange(cacheChecks);

        // Service health checks
        var serviceChecks = await RunServiceHealthChecksAsync();
        healthChecks.AddRange(serviceChecks);

        // Resource health checks
        var resourceChecks = await RunResourceHealthChecksAsync();
        healthChecks.AddRange(resourceChecks);

        return healthChecks;
    }

    private async Task<List<HealthCheck>> RunProviderHealthChecksAsync()
    {
        var checks = new List<HealthCheck>();

        // Check each AI provider
        var providers = new[] { "openai", "anthropic", "local" };
        
        foreach (var provider in providers)
        {
            try
            {
                var check = new HealthCheck
                {
                    Name = $"AI Provider: {provider}",
                    Category = "AI Providers",
                    Severity = HealthCheckSeverity.Critical
                };

                // Test provider with a simple request
                var testResponse = await TestProviderHealthAsync(provider);
                
                check.IsHealthy = testResponse.IsSuccessful;
                check.ResponseTime = testResponse.ResponseTime;
                check.Details = testResponse.Details;
                
                if (!check.IsHealthy)
                {
                    check.ErrorMessage = testResponse.ErrorMessage;
                }

                checks.Add(check);
            }
            catch (Exception ex)
            {
                checks.Add(new HealthCheck
                {
                    Name = $"AI Provider: {provider}",
                    Category = "AI Providers",
                    Severity = HealthCheckSeverity.Critical,
                    IsHealthy = false,
                    ErrorMessage = ex.Message
                });
            }
        }

        return checks;
    }

    private async Task CheckAlertConditionsAsync(AIMetric metric)
    {
        // Get alert rules for this metric
        var alertRules = await GetAlertRulesForMetricAsync(metric.Name);
        
        foreach (var rule in alertRules)
        {
            var shouldAlert = await EvaluateAlertRuleAsync(rule, metric);
            
            if (shouldAlert && !await IsAlertSuppressedAsync(rule.Id))
            {
                await TriggerAlertAsync(rule, metric);
            }
        }
    }

    private async Task TriggerAlertAsync(AlertRule rule, AIMetric metric)
    {
        var alert = new Alert
        {
            Id = Guid.NewGuid(),
            RuleId = rule.Id,
            RuleName = rule.Name,
            Severity = rule.Severity,
            Message = FormatAlertMessage(rule, metric),
            TriggeringMetric = metric,
            TriggeredAt = DateTime.UtcNow,
            Status = AlertStatus.Active
        };

        await _alertingService.TriggerAlertAsync(alert);
        
        _logger.LogWarning("Alert triggered: {AlertName} - {Message}", rule.Name, alert.Message);
    }
}

// Supporting data models
public class PerformanceMetrics
{
    public TimeSpan Period { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    
    // Response time metrics
    public TimeSpan AverageResponseTime { get; set; }
    public TimeSpan MedianResponseTime { get; set; }
    public TimeSpan P95ResponseTime { get; set; }
    public TimeSpan P99ResponseTime { get; set; }
    
    // Throughput metrics
    public double RequestsPerSecond { get; set; }
    public double RequestsPerMinute { get; set; }
    public double RequestsPerHour { get; set; }
    
    // Error metrics
    public float ErrorRate { get; set; }
    public long TotalErrors { get; set; }
    public Dictionary<string, long> ErrorsByType { get; set; } = new();
    
    // Resource usage
    public long TotalTokensUsed { get; set; }
    public double AverageTokensPerRequest { get; set; }
    public double TokensPerSecond { get; set; }
    
    // Provider breakdown
    public Dictionary<string, ProviderPerformanceMetrics> ProviderPerformance { get; set; } = new();
    
    // Request type breakdown
    public Dictionary<string, RequestTypePerformanceMetrics> RequestTypePerformance { get; set; } = new();
}

public class QualityMetrics
{
    public TimeSpan Period { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    
    // Overall quality
    public float AverageQualityScore { get; set; }
    public float MinQualityScore { get; set; }
    public float MaxQualityScore { get; set; }
    public float QualityScoreStdDev { get; set; }
    
    // Quality dimensions
    public Dictionary<string, float> QualityDimensions { get; set; } = new();
    
    // Content filtering
    public float ContentFilterRate { get; set; }
    public long TotalContentFiltered { get; set; }
    public Dictionary<string, long> FilterReasonBreakdown { get; set; } = new();
    
    // User feedback
    public float UserSatisfactionScore { get; set; }
    public long TotalUserFeedback { get; set; }
    public Dictionary<int, long> SatisfactionDistribution { get; set; } = new(); // 1-5 star distribution
    
    // Quality trends
    public List<QualityDataPoint> QualityTrend { get; set; } = new();
}

public class CostMetrics
{
    public TimeSpan Period { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    
    // Total cost metrics
    public decimal TotalCost { get; set; }
    public decimal CostPerRequest { get; set; }
    public decimal CostPerToken { get; set; }
    public decimal CostPerUser { get; set; }
    
    // Cost breakdown
    public Dictionary<string, decimal> CostByProvider { get; set; } = new();
    public Dictionary<string, decimal> CostByRequestType { get; set; } = new();
    public Dictionary<string, decimal> CostBySubscriptionTier { get; set; } = new();
    
    // Cost trends
    public Dictionary<DateTime, decimal> DailyCostTrend { get; set; } = new();
    public Dictionary<DateTime, decimal> HourlyCostTrend { get; set; } = new();
    
    // Cost efficiency metrics
    public decimal CostPerSuccessfulRequest { get; set; }
    public decimal CostPerQualityPoint { get; set; }
    public float CostEfficiencyScore { get; set; }
}

public class SystemHealthStatus
{
    public DateTime CheckedAt { get; set; }
    public HealthStatus OverallStatus { get; set; }
    public string StatusMessage { get; set; } = string.Empty;
    public TimeSpan Uptime { get; set; }
    public SystemLoadMetrics CurrentLoad { get; set; } = new();
    public List<HealthCheck> HealthChecks { get; set; } = new();
}

public class HealthCheck
{
    public string Name { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public bool IsHealthy { get; set; }
    public HealthCheckSeverity Severity { get; set; }
    public TimeSpan ResponseTime { get; set; }
    public string? ErrorMessage { get; set; }
    public Dictionary<string, object> Details { get; set; } = new();
    public DateTime CheckedAt { get; set; } = DateTime.UtcNow;
}

public enum HealthStatus
{
    Healthy,
    Warning,
    Critical,
    Unknown
}

public enum HealthCheckSeverity
{
    Info,
    Warning,
    Critical
}

public class SystemLoadMetrics
{
    public float CpuUsagePercent { get; set; }
    public float MemoryUsagePercent { get; set; }
    public long ActiveConnections { get; set; }
    public long QueuedRequests { get; set; }
    public double RequestsPerSecond { get; set; }
    public double ErrorsPerSecond { get; set; }
}

public class Alert
{
    public Guid Id { get; set; }
    public Guid RuleId { get; set; }
    public string RuleName { get; set; } = string.Empty;
    public AlertSeverity Severity { get; set; }
    public string Message { get; set; } = string.Empty;
    public AIMetric TriggeringMetric { get; set; } = new();
    public DateTime TriggeredAt { get; set; }
    public DateTime? AcknowledgedAt { get; set; }
    public string? AcknowledgedBy { get; set; }
    public DateTime? ResolvedAt { get; set; }
    public AlertStatus Status { get; set; }
    public Dictionary<string, object> Context { get; set; } = new();
}

public enum AlertStatus
{
    Active,
    Acknowledged,
    Resolved,
    Suppressed
}

public class AlertRule
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string MetricName { get; set; } = string.Empty;
    public AlertSeverity Severity { get; set; }
    public string Condition { get; set; } = string.Empty; // e.g., "> 0.95", "< 0.5"
    public TimeSpan EvaluationWindow { get; set; }
    public TimeSpan? CooldownPeriod { get; set; }
    public bool IsEnabled { get; set; } = true;
    public List<string> NotificationChannels { get; set; } = new();
    public Dictionary<string, string> Labels { get; set; } = new();
}
```

This comprehensive monitoring and observability system provides real-time visibility into AI system performance, quality, costs, and health, enabling proactive management and continuous optimization of AI services.
