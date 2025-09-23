# AI Testing Strategy & Validation Framework

## Overview
This document defines the comprehensive testing strategy for the AI system, including unit testing, integration testing, performance testing, quality validation, A/B testing, regression testing, and continuous validation to ensure reliable, high-quality AI outputs across all features and use cases.

---

## AI Testing Architecture

### **Multi-Layer Testing Pipeline**
```
┌─────────────────────────────────────────────────────────────────┐
│                    AI Feature Development                       │
└─────────────────────────────────────────────────────────────────┘
                                │
                    ┌───────────────────────┐
                    │   Unit Testing        │
                    │ (Individual AI        │
                    │  Components)          │
                    └───────────────────────┘
                                │
                    ┌───────────────────────┐
                    │   Integration         │
                    │   Testing             │
                    │ (AI Service           │
                    │  Interactions)        │
                    └───────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
┌───────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Quality     │    │   Performance   │    │   User          │
│   Testing     │    │   Testing       │    │   Acceptance    │
│ (Output       │    │ (Load, Stress,  │    │   Testing       │
│  Validation)  │    │  Response Time) │    │ (Real Users)    │
└───────────────┘    └─────────────────┘    └─────────────────┘
        │                       │                       │
        └───────────────────────┼───────────────────────┘
                                │
                    ┌───────────────────────┐
                    │   A/B Testing &       │
                    │   Experimentation     │
                    │ (Feature Comparison)  │
                    └───────────────────────┘
                                │
                    ┌───────────────────────┐
                    │   Regression          │
                    │   Testing             │
                    │ (Continuous           │
                    │  Validation)          │
                    └───────────────────────┘
                                │
                    ┌───────────────────────┐
                    │   Production          │
                    │   Monitoring          │
                    │ (Live Quality         │
                    │  Tracking)            │
                    └───────────────────────┘
```

### **Core AI Testing Interface**
```csharp
public interface IAITestingService
{
    // Test execution
    Task<TestSuiteResult> RunTestSuiteAsync(TestSuiteRequest request);
    Task<TestResult> RunSingleTestAsync(AITestCase testCase);
    Task<List<TestResult>> RunBatchTestsAsync(List<AITestCase> testCases);
    
    // Test case management
    Task<AITestCase> CreateTestCaseAsync(TestCaseCreationRequest request);
    Task<List<AITestCase>> GenerateTestCasesAsync(TestCaseGenerationRequest request);
    Task<AITestCase> UpdateTestCaseAsync(Guid testCaseId, TestCaseUpdate update);
    Task<List<AITestCase>> GetTestCasesAsync(TestCaseFilter filter);
    
    // Quality validation testing
    Task<QualityTestResult> RunQualityTestsAsync(QualityTestRequest request);
    Task<ConsistencyTestResult> RunConsistencyTestsAsync(ConsistencyTestRequest request);
    Task<RegressionTestResult> RunRegressionTestsAsync(RegressionTestRequest request);
    
    // Performance testing
    Task<PerformanceTestResult> RunPerformanceTestsAsync(PerformanceTestRequest request);
    Task<LoadTestResult> RunLoadTestsAsync(LoadTestRequest request);
    Task<StressTestResult> RunStressTestsAsync(StressTestRequest request);
    
    // A/B testing and experimentation
    Task<ABTestResult> RunABTestAsync(ABTestRequest request);
    Task<ExperimentResult> RunExperimentAsync(ExperimentRequest request);
    Task<List<TestVariant>> CreateTestVariantsAsync(VariantCreationRequest request);
    
    // Test data and benchmarks
    Task<TestDataSet> GenerateTestDataAsync(TestDataRequest request);
    Task<BenchmarkResult> RunBenchmarkAsync(BenchmarkRequest request);
    Task<List<TestScenario>> GetTestScenariosAsync(ScenarioFilter filter);
    
    // Reporting and analysis
    Task<TestReport> GenerateTestReportAsync(TestReportRequest request);
    Task<TestAnalytics> GetTestAnalyticsAsync(TimeSpan period);
    Task<QualityTrends> GetQualityTrendsAsync(TimeSpan period);
}

public enum TestType
{
    Unit,           // Individual component testing
    Integration,    // Service interaction testing
    Quality,        // Output quality validation
    Performance,    // Speed and efficiency testing
    Load,           // High volume testing
    Stress,         // Breaking point testing
    Regression,     // Change impact testing
    UserAcceptance, // Real user testing
    ABTest,         // Variant comparison testing
    Security,       // Safety and security testing
    Compliance      // D&D rules compliance testing
}

public enum TestPriority
{
    Critical,       // Must pass for release
    High,           // Important for quality
    Medium,         // Nice to have
    Low             // Optional validation
}

public class AITestCase
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public TestType Type { get; set; }
    public TestPriority Priority { get; set; }
    public List<string> Tags { get; set; } = new();
    
    // Test input
    public AIRequest TestInput { get; set; } = new();
    public Dictionary<string, object> TestContext { get; set; } = new();
    public List<string> TestDataSets { get; set; } = new();
    
    // Expected outcomes
    public List<ExpectedOutcome> ExpectedOutcomes { get; set; } = new();
    public QualityExpectations QualityExpectations { get; set; } = new();
    public PerformanceExpectations PerformanceExpectations { get; set; } = new();
    
    // Test configuration
    public int MaxRetries { get; set; } = 3;
    public TimeSpan Timeout { get; set; } = TimeSpan.FromMinutes(5);
    public bool IsEnabled { get; set; } = true;
    public string Environment { get; set; } = "Test";
    
    // Metadata
    public string CreatedBy { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime LastModified { get; set; }
    public int ExecutionCount { get; set; }
    public float SuccessRate { get; set; }
}

public class ExpectedOutcome
{
    public string Type { get; set; } = string.Empty; // Content, Quality, Performance, etc.
    public string Description { get; set; } = string.Empty;
    public ValidationRule ValidationRule { get; set; } = new();
    public float Weight { get; set; } = 1.0f;
    public bool IsRequired { get; set; } = true;
}

public class ValidationRule
{
    public string RuleType { get; set; } = string.Empty; // Contains, Matches, Range, etc.
    public Dictionary<string, object> Parameters { get; set; } = new();
    public float Threshold { get; set; } = 0.8f;
    public string ErrorMessage { get; set; } = string.Empty;
}
```

### **AI Testing Service Implementation**
```csharp
public class AITestingService : IAITestingService
{
    private readonly IAIGatewayService _aiGateway;
    private readonly IQualityAssuranceService _qualityService;
    private readonly ITestCaseRepository _testRepository;
    private readonly ITestDataGenerator _testDataGenerator;
    private readonly ITestResultAnalyzer _resultAnalyzer;
    private readonly ILogger<AITestingService> _logger;

    public async Task<TestSuiteResult> RunTestSuiteAsync(TestSuiteRequest request)
    {
        _logger.LogInformation("Starting test suite execution: {SuiteName}", request.SuiteName);

        var result = new TestSuiteResult
        {
            SuiteId = request.SuiteId,
            SuiteName = request.SuiteName,
            StartTime = DateTime.UtcNow
        };

        try
        {
            // Get test cases for the suite
            var testCases = await GetTestCasesForSuiteAsync(request);
            result.TotalTests = testCases.Count;

            // Group tests by priority for execution order
            var criticalTests = testCases.Where(t => t.Priority == TestPriority.Critical).ToList();
            var highPriorityTests = testCases.Where(t => t.Priority == TestPriority.High).ToList();
            var mediumPriorityTests = testCases.Where(t => t.Priority == TestPriority.Medium).ToList();
            var lowPriorityTests = testCases.Where(t => t.Priority == TestPriority.Low).ToList();

            // Execute critical tests first (must all pass)
            if (criticalTests.Any())
            {
                var criticalResults = await ExecuteTestBatchAsync(criticalTests, "Critical Tests");
                result.TestResults.AddRange(criticalResults);
                result.CriticalTestsPassed = criticalResults.Count(r => r.IsSuccess);
                result.CriticalTestsFailed = criticalResults.Count(r => !r.IsSuccess);

                // Stop execution if critical tests fail
                if (result.CriticalTestsFailed > 0 && request.StopOnCriticalFailure)
                {
                    result.IsSuccess = false;
                    result.EndTime = DateTime.UtcNow;
                    result.Summary = $"Test suite stopped due to {result.CriticalTestsFailed} critical test failures";
                    return result;
                }
            }

            // Execute high priority tests
            if (highPriorityTests.Any())
            {
                var highPriorityResults = await ExecuteTestBatchAsync(highPriorityTests, "High Priority Tests");
                result.TestResults.AddRange(highPriorityResults);
            }

            // Execute medium priority tests (can run in parallel)
            if (mediumPriorityTests.Any())
            {
                var mediumPriorityResults = await ExecuteTestBatchParallelAsync(mediumPriorityTests, "Medium Priority Tests");
                result.TestResults.AddRange(mediumPriorityResults);
            }

            // Execute low priority tests (can run in parallel)
            if (lowPriorityTests.Any())
            {
                var lowPriorityResults = await ExecuteTestBatchParallelAsync(lowPriorityTests, "Low Priority Tests");
                result.TestResults.AddRange(lowPriorityResults);
            }

            // Calculate final results
            result.TestsPassed = result.TestResults.Count(r => r.IsSuccess);
            result.TestsFailed = result.TestResults.Count(r => !r.IsSuccess);
            result.TestsSkipped = result.TotalTests - result.TestsPassed - result.TestsFailed;
            result.SuccessRate = result.TotalTests > 0 ? (float)result.TestsPassed / result.TotalTests : 0f;
            result.IsSuccess = result.TestsFailed == 0 || (result.SuccessRate >= request.MinimumSuccessRate);
            result.EndTime = DateTime.UtcNow;
            result.Duration = result.EndTime - result.StartTime;

            // Generate summary
            result.Summary = GenerateTestSuiteSummary(result);

            // Store results
            await _testRepository.StoreTestSuiteResultAsync(result);

            _logger.LogInformation("Test suite completed: {Success}, {Passed}/{Total} tests passed",
                result.IsSuccess, result.TestsPassed, result.TotalTests);

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Test suite execution failed: {SuiteName}", request.SuiteName);
            
            result.IsSuccess = false;
            result.EndTime = DateTime.UtcNow;
            result.Duration = result.EndTime - result.StartTime;
            result.Summary = $"Test suite failed with error: {ex.Message}";
            
            return result;
        }
    }

    public async Task<TestResult> RunSingleTestAsync(AITestCase testCase)
    {
        _logger.LogDebug("Executing test case: {TestName}", testCase.Name);

        var result = new TestResult
        {
            TestCaseId = testCase.Id,
            TestName = testCase.Name,
            StartTime = DateTime.UtcNow
        };

        try
        {
            // Execute the AI request
            var aiResponse = await _aiGateway.GenerateContentAsync(testCase.TestInput);
            result.AIResponse = aiResponse;

            // Validate expected outcomes
            var validationResults = await ValidateExpectedOutcomesAsync(aiResponse, testCase.ExpectedOutcomes);
            result.ValidationResults = validationResults;

            // Run quality assessment if specified
            if (testCase.QualityExpectations != null)
            {
                var qualityResult = await _qualityService.AssessQualityAsync(new QualityAssessmentRequest
                {
                    Response = aiResponse,
                    OriginalRequest = testCase.TestInput,
                    Context = new QualityContext
                    {
                        Expectations = testCase.QualityExpectations
                    }
                });
                result.QualityAssessment = qualityResult;
            }

            // Check performance expectations
            if (testCase.PerformanceExpectations != null)
            {
                var performanceResult = ValidatePerformanceExpectations(aiResponse, testCase.PerformanceExpectations);
                result.PerformanceValidation = performanceResult;
            }

            // Determine overall success
            result.IsSuccess = DetermineTestSuccess(result, testCase);
            result.Score = CalculateTestScore(result, testCase);

            result.EndTime = DateTime.UtcNow;
            result.Duration = result.EndTime - result.StartTime;

            // Update test case statistics
            await UpdateTestCaseStatisticsAsync(testCase.Id, result.IsSuccess);

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Test case execution failed: {TestName}", testCase.Name);
            
            result.IsSuccess = false;
            result.ErrorMessage = ex.Message;
            result.EndTime = DateTime.UtcNow;
            result.Duration = result.EndTime - result.StartTime;
            
            return result;
        }
    }

    public async Task<QualityTestResult> RunQualityTestsAsync(QualityTestRequest request)
    {
        var result = new QualityTestResult
        {
            TestType = "Quality Validation",
            StartTime = DateTime.UtcNow
        };

        try
        {
            // Generate test cases for quality validation
            var qualityTestCases = await GenerateQualityTestCasesAsync(request);
            result.TotalTests = qualityTestCases.Count;

            var testResults = new List<TestResult>();

            // Execute quality tests
            foreach (var testCase in qualityTestCases)
            {
                var testResult = await RunSingleTestAsync(testCase);
                testResults.Add(testResult);
                
                // Collect quality metrics
                if (testResult.QualityAssessment != null)
                {
                    result.QualityScores.Add(testResult.QualityAssessment.OverallScore);
                    result.QualityDimensions.Add(testResult.TestName, new Dictionary<string, float>
                    {
                        ["Technical"] = testResult.QualityAssessment.TechnicalQuality?.Score ?? 0f,
                        ["Content"] = testResult.QualityAssessment.ContentQuality?.Score ?? 0f,
                        ["DnDCompliance"] = testResult.QualityAssessment.DnDCompliance?.Score ?? 0f,
                        ["Narrative"] = testResult.QualityAssessment.NarrativeQuality?.Score ?? 0f,
                        ["UserExperience"] = testResult.QualityAssessment.UserExperienceQuality?.Score ?? 0f
                    });
                }
            }

            result.TestResults = testResults;
            result.TestsPassed = testResults.Count(r => r.IsSuccess);
            result.TestsFailed = testResults.Count(r => !r.IsSuccess);
            result.AverageQualityScore = result.QualityScores.Any() ? result.QualityScores.Average() : 0f;
            result.MinQualityScore = result.QualityScores.Any() ? result.QualityScores.Min() : 0f;
            result.MaxQualityScore = result.QualityScores.Any() ? result.QualityScores.Max() : 0f;
            
            result.IsSuccess = result.TestsFailed == 0 && result.AverageQualityScore >= request.MinimumAverageScore;
            result.EndTime = DateTime.UtcNow;
            result.Duration = result.EndTime - result.StartTime;

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Quality test execution failed");
            
            result.IsSuccess = false;
            result.ErrorMessage = ex.Message;
            result.EndTime = DateTime.UtcNow;
            result.Duration = result.EndTime - result.StartTime;
            
            return result;
        }
    }

    public async Task<PerformanceTestResult> RunPerformanceTestsAsync(PerformanceTestRequest request)
    {
        var result = new PerformanceTestResult
        {
            TestType = "Performance Testing",
            StartTime = DateTime.UtcNow,
            ConcurrentUsers = request.ConcurrentUsers,
            TestDuration = request.TestDuration
        };

        try
        {
            var performanceTasks = new List<Task<PerformanceMetric>>();
            
            // Create concurrent tasks to simulate load
            for (int i = 0; i < request.ConcurrentUsers; i++)
            {
                var userTask = SimulateUserLoadAsync(request, i);
                performanceTasks.Add(userTask);
            }

            // Wait for all tasks to complete or timeout
            var completedTasks = await Task.WhenAll(performanceTasks);
            result.PerformanceMetrics = completedTasks.ToList();

            // Calculate performance statistics
            var responseTimes = result.PerformanceMetrics.Select(m => m.ResponseTime.TotalMilliseconds).ToList();
            result.AverageResponseTime = TimeSpan.FromMilliseconds(responseTimes.Average());
            result.MedianResponseTime = TimeSpan.FromMilliseconds(responseTimes.OrderBy(x => x).Skip(responseTimes.Count / 2).First());
            result.P95ResponseTime = TimeSpan.FromMilliseconds(responseTimes.OrderBy(x => x).Skip((int)(responseTimes.Count * 0.95)).First());
            result.P99ResponseTime = TimeSpan.FromMilliseconds(responseTimes.OrderBy(x => x).Skip((int)(responseTimes.Count * 0.99)).First());

            result.SuccessfulRequests = result.PerformanceMetrics.Count(m => m.IsSuccessful);
            result.FailedRequests = result.PerformanceMetrics.Count(m => !m.IsSuccessful);
            result.SuccessRate = (float)result.SuccessfulRequests / result.PerformanceMetrics.Count;

            result.ThroughputPerSecond = result.SuccessfulRequests / request.TestDuration.TotalSeconds;
            
            result.IsSuccess = result.SuccessRate >= request.MinimumSuccessRate &&
                              result.AverageResponseTime <= request.MaxAverageResponseTime &&
                              result.P95ResponseTime <= request.MaxP95ResponseTime;

            result.EndTime = DateTime.UtcNow;
            result.Duration = result.EndTime - result.StartTime;

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Performance test execution failed");
            
            result.IsSuccess = false;
            result.ErrorMessage = ex.Message;
            result.EndTime = DateTime.UtcNow;
            result.Duration = result.EndTime - result.StartTime;
            
            return result;
        }
    }

    private async Task<List<AITestCase>> GenerateQualityTestCasesAsync(QualityTestRequest request)
    {
        var testCases = new List<AITestCase>();

        // Generate test cases for each AI request type
        foreach (var requestType in request.RequestTypes)
        {
            // Generate positive test cases (expected good outputs)
            var positiveTests = await GeneratePositiveTestCasesAsync(requestType, request.TestCount / 2);
            testCases.AddRange(positiveTests);

            // Generate negative test cases (edge cases, potential failures)
            var negativeTests = await GenerateNegativeTestCasesAsync(requestType, request.TestCount / 2);
            testCases.AddRange(negativeTests);
        }

        return testCases;
    }

    private async Task<List<AITestCase>> GeneratePositiveTestCasesAsync(AIRequestType requestType, int count)
    {
        var testCases = new List<AITestCase>();

        for (int i = 0; i < count; i++)
        {
            var testCase = new AITestCase
            {
                Id = Guid.NewGuid(),
                Name = $"{requestType}_Positive_Test_{i + 1}",
                Description = $"Positive test case for {requestType} request type",
                Type = TestType.Quality,
                Priority = TestPriority.High,
                Tags = new List<string> { requestType.ToString(), "Positive", "Quality" }
            };

            // Generate appropriate test input based on request type
            testCase.TestInput = await GenerateTestInputAsync(requestType, TestScenario.Positive);

            // Set quality expectations
            testCase.QualityExpectations = new QualityExpectations
            {
                MinimumAcceptableScore = 0.7f,
                TargetScore = 0.85f,
                CriticalDimensions = GetCriticalDimensionsForRequestType(requestType)
            };

            // Set expected outcomes
            testCase.ExpectedOutcomes = GenerateExpectedOutcomes(requestType, TestScenario.Positive);

            testCases.Add(testCase);
        }

        return testCases;
    }

    private async Task<PerformanceMetric> SimulateUserLoadAsync(PerformanceTestRequest request, int userId)
    {
        var metric = new PerformanceMetric
        {
            UserId = userId,
            StartTime = DateTime.UtcNow
        };

        try
        {
            // Generate a test request
            var testInput = await GenerateTestInputAsync(request.RequestType, TestScenario.Performance);
            
            // Execute the AI request
            var response = await _aiGateway.GenerateContentAsync(testInput);
            
            metric.EndTime = DateTime.UtcNow;
            metric.ResponseTime = metric.EndTime - metric.StartTime;
            metric.IsSuccessful = !string.IsNullOrEmpty(response.Content);
            metric.TokensUsed = response.Usage.TotalTokens;
            metric.Cost = response.Usage.EstimatedCost;

            return metric;
        }
        catch (Exception ex)
        {
            metric.EndTime = DateTime.UtcNow;
            metric.ResponseTime = metric.EndTime - metric.StartTime;
            metric.IsSuccessful = false;
            metric.ErrorMessage = ex.Message;
            
            return metric;
        }
    }

    private bool DetermineTestSuccess(TestResult result, AITestCase testCase)
    {
        // Check if all required validation results passed
        var requiredValidationsPassed = result.ValidationResults
            .Where(v => v.IsRequired)
            .All(v => v.IsValid);

        if (!requiredValidationsPassed)
            return false;

        // Check quality expectations if specified
        if (testCase.QualityExpectations != null && result.QualityAssessment != null)
        {
            if (result.QualityAssessment.OverallScore < testCase.QualityExpectations.MinimumAcceptableScore)
                return false;
        }

        // Check performance expectations if specified
        if (testCase.PerformanceExpectations != null && result.PerformanceValidation != null)
        {
            if (!result.PerformanceValidation.IsValid)
                return false;
        }

        return true;
    }
}

// Supporting data models
public class TestSuiteResult
{
    public Guid SuiteId { get; set; }
    public string SuiteName { get; set; } = string.Empty;
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public TimeSpan Duration { get; set; }
    
    public int TotalTests { get; set; }
    public int TestsPassed { get; set; }
    public int TestsFailed { get; set; }
    public int TestsSkipped { get; set; }
    public int CriticalTestsPassed { get; set; }
    public int CriticalTestsFailed { get; set; }
    
    public float SuccessRate { get; set; }
    public bool IsSuccess { get; set; }
    public string Summary { get; set; } = string.Empty;
    
    public List<TestResult> TestResults { get; set; } = new();
    public Dictionary<string, object> Metrics { get; set; } = new();
}

public class TestResult
{
    public Guid TestCaseId { get; set; }
    public string TestName { get; set; } = string.Empty;
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public TimeSpan Duration { get; set; }
    
    public bool IsSuccess { get; set; }
    public float Score { get; set; }
    public string? ErrorMessage { get; set; }
    
    public AIResponse? AIResponse { get; set; }
    public List<ValidationResult> ValidationResults { get; set; } = new();
    public QualityAssessmentResult? QualityAssessment { get; set; }
    public PerformanceValidationResult? PerformanceValidation { get; set; }
    
    public Dictionary<string, object> AdditionalMetrics { get; set; } = new();
}

public class PerformanceTestResult
{
    public string TestType { get; set; } = string.Empty;
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public TimeSpan Duration { get; set; }
    
    public int ConcurrentUsers { get; set; }
    public TimeSpan TestDuration { get; set; }
    public int SuccessfulRequests { get; set; }
    public int FailedRequests { get; set; }
    public float SuccessRate { get; set; }
    
    public TimeSpan AverageResponseTime { get; set; }
    public TimeSpan MedianResponseTime { get; set; }
    public TimeSpan P95ResponseTime { get; set; }
    public TimeSpan P99ResponseTime { get; set; }
    public double ThroughputPerSecond { get; set; }
    
    public List<PerformanceMetric> PerformanceMetrics { get; set; } = new();
    public bool IsSuccess { get; set; }
    public string? ErrorMessage { get; set; }
}

public class PerformanceMetric
{
    public int UserId { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public TimeSpan ResponseTime { get; set; }
    public bool IsSuccessful { get; set; }
    public int TokensUsed { get; set; }
    public decimal Cost { get; set; }
    public string? ErrorMessage { get; set; }
}

public class QualityTestResult
{
    public string TestType { get; set; } = string.Empty;
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public TimeSpan Duration { get; set; }
    
    public int TotalTests { get; set; }
    public int TestsPassed { get; set; }
    public int TestsFailed { get; set; }
    public bool IsSuccess { get; set; }
    
    public List<float> QualityScores { get; set; } = new();
    public float AverageQualityScore { get; set; }
    public float MinQualityScore { get; set; }
    public float MaxQualityScore { get; set; }
    
    public Dictionary<string, Dictionary<string, float>> QualityDimensions { get; set; } = new();
    public List<TestResult> TestResults { get; set; } = new();
    public string? ErrorMessage { get; set; }
}

public enum TestScenario
{
    Positive,       // Expected good case
    Negative,       // Edge case or error condition
    Performance,    // Load/stress testing
    Boundary,       // Limit testing
    Security,       // Safety testing
    Regression      // Change validation
}

public class PerformanceExpectations
{
    public TimeSpan MaxResponseTime { get; set; } = TimeSpan.FromSeconds(10);
    public TimeSpan TargetResponseTime { get; set; } = TimeSpan.FromSeconds(5);
    public int MaxTokens { get; set; } = 4000;
    public decimal MaxCost { get; set; } = 1.00m;
    public float MinSuccessRate { get; set; } = 0.95f;
}

public class ValidationResult
{
    public string ValidationType { get; set; } = string.Empty;
    public bool IsValid { get; set; }
    public bool IsRequired { get; set; }
    public float Score { get; set; }
    public string? ErrorMessage { get; set; }
    public Dictionary<string, object> Details { get; set; } = new();
}
```

This comprehensive AI testing strategy provides thorough validation of AI systems through multiple testing layers, ensuring reliability, quality, performance, and user satisfaction while supporting continuous improvement and regression detection.
