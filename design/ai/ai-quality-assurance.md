# AI Quality Assurance & Validation System

## Overview
This document defines the comprehensive AI quality assurance system that validates AI outputs for accuracy, consistency, creativity, D&D compliance, narrative coherence, and user satisfaction while providing automated quality scoring and continuous improvement mechanisms.

---

## Quality Assurance Architecture

### **Multi-Dimensional Quality Pipeline**
```
┌─────────────────────────────────────────────────────────────────┐
│                    AI Response Generated                        │
└─────────────────────────────────────────────────────────────────┘
                                │
                    ┌───────────────────────┐
                    │   Pre-Quality         │
                    │   Assessment          │
                    │ (Basic Validation)    │
                    └───────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
┌───────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Technical   │    │   Content       │    │   D&D Rules     │
│   Quality     │    │   Quality       │    │   Compliance    │
│  (Format,     │    │ (Coherence,     │    │  (5e Rules,     │
│   Structure)  │    │  Creativity)    │    │   Consistency)  │
└───────────────┘    └─────────────────┘    └─────────────────┘
        │                       │                       │
        └───────────────────────┼───────────────────────┘
                                │
                    ┌───────────────────────┐
                    │   Narrative           │
                    │   Quality             │
                    │  (Story Consistency,  │
                    │   Character Voice)    │
                    └───────────────────────┘
                                │
                    ┌───────────────────────┐
                    │   User Experience     │
                    │   Quality             │
                    │  (Engagement,         │
                    │   Usefulness)         │
                    └───────────────────────┘
                                │
                    ┌───────────────────────┐
                    │   Aggregate Quality   │
                    │   Score & Decision    │
                    │  (Accept/Reject/      │
                    │   Regenerate)         │
                    └───────────────────────┘
```

### **Core Quality Assurance Interface**
```csharp
public interface IQualityAssuranceService
{
    // Primary quality assessment
    Task<QualityAssessmentResult> AssessQualityAsync(QualityAssessmentRequest request);
    Task<List<QualityAssessmentResult>> AssessBatchQualityAsync(List<QualityAssessmentRequest> requests);
    
    // Specialized quality validators
    Task<TechnicalQualityResult> ValidateTechnicalQualityAsync(TechnicalQualityRequest request);
    Task<ContentQualityResult> ValidateContentQualityAsync(ContentQualityRequest request);
    Task<DnDComplianceResult> ValidateDnDComplianceAsync(DnDComplianceRequest request);
    Task<NarrativeQualityResult> ValidateNarrativeQualityAsync(NarrativeQualityRequest request);
    Task<UserExperienceResult> ValidateUserExperienceAsync(UserExperienceRequest request);
    
    // Quality scoring and metrics
    Task<QualityScore> CalculateQualityScoreAsync(AIResponse response, QualityContext context);
    Task<QualityMetrics> GetQualityMetricsAsync(Guid campaignId, TimeSpan period);
    Task<QualityTrends> GetQualityTrendsAsync(TimeSpan period);
    
    // Quality improvement
    Task<QualityImprovementSuggestions> GetImprovementSuggestionsAsync(QualityAssessmentResult assessment);
    Task<RegenerationRecommendation> GetRegenerationRecommendationAsync(QualityAssessmentResult assessment);
    Task UpdateQualityFeedbackAsync(Guid responseId, UserQualityFeedback feedback);
    
    // Quality benchmarking
    Task<QualityBenchmark> GetQualityBenchmarkAsync(AIRequestType requestType, SubscriptionTier tier);
    Task<QualityComparison> CompareQualityAsync(List<AIResponse> responses, QualityContext context);
    Task<ProviderQualityAnalysis> AnalyzeProviderQualityAsync(string providerId, TimeSpan period);
}

public enum QualityDimension
{
    Technical,      // Format, structure, completeness
    Content,        // Coherence, creativity, relevance
    DnDCompliance, // Rules accuracy, lore consistency
    Narrative,      // Story flow, character voice
    UserExperience, // Engagement, usefulness
    Safety,         // Content appropriateness
    Originality,    // Uniqueness, creativity
    Consistency     // Internal and external consistency
}

public enum QualityLevel
{
    Poor,           // 0.0 - 0.3
    BelowAverage,   // 0.3 - 0.5
    Average,        // 0.5 - 0.7
    Good,           // 0.7 - 0.85
    Excellent,      // 0.85 - 0.95
    Outstanding     // 0.95 - 1.0
}

public class QualityAssessmentRequest
{
    public AIResponse Response { get; set; } = new();
    public AIRequest OriginalRequest { get; set; } = new();
    public QualityContext Context { get; set; } = new();
    public List<QualityDimension> DimensionsToAssess { get; set; } = new();
    public QualityAssessmentMode Mode { get; set; } = QualityAssessmentMode.Comprehensive;
    public bool IncludeDetailedFeedback { get; set; } = true;
    public bool IncludeImprovementSuggestions { get; set; } = true;
}

public enum QualityAssessmentMode
{
    Quick,          // Basic quality checks only
    Standard,       // Standard quality assessment
    Comprehensive,  // Full quality analysis
    Detailed        // Maximum detail with all metrics
}

public class QualityContext
{
    public Guid CampaignId { get; set; }
    public Guid UserId { get; set; }
    public SubscriptionTier UserTier { get; set; }
    public CampaignContext? Campaign { get; set; }
    public List<AIResponse> PreviousResponses { get; set; } = new();
    public Dictionary<string, object> AdditionalContext { get; set; } = new();
    public QualityExpectations Expectations { get; set; } = new();
}

public class QualityExpectations
{
    public float MinimumAcceptableScore { get; set; } = 0.6f;
    public float TargetScore { get; set; } = 0.8f;
    public List<QualityDimension> CriticalDimensions { get; set; } = new();
    public Dictionary<QualityDimension, float> DimensionWeights { get; set; } = new();
    public bool RequireExcellenceInCriticalDimensions { get; set; } = true;
}
```

### **Quality Assurance Service Implementation**
```csharp
public class QualityAssuranceService : IQualityAssuranceService
{
    private readonly ITechnicalQualityValidator _technicalValidator;
    private readonly IContentQualityValidator _contentValidator;
    private readonly IDnDComplianceValidator _dndValidator;
    private readonly INarrativeQualityValidator _narrativeValidator;
    private readonly IUserExperienceValidator _uxValidator;
    private readonly IQualityMetricsCollector _metricsCollector;
    private readonly IQualityRepository _qualityRepository;
    private readonly ILogger<QualityAssuranceService> _logger;

    public async Task<QualityAssessmentResult> AssessQualityAsync(QualityAssessmentRequest request)
    {
        _logger.LogInformation("Starting quality assessment for response {ResponseId}", 
            request.Response.RequestId);

        var result = new QualityAssessmentResult
        {
            ResponseId = request.Response.RequestId,
            AssessedAt = DateTime.UtcNow,
            Mode = request.Mode
        };

        try
        {
            // Parallel execution of quality validators for performance
            var validationTasks = new List<Task>();
            
            // Technical Quality Assessment
            if (ShouldAssessDimension(QualityDimension.Technical, request))
            {
                validationTasks.Add(Task.Run(async () =>
                {
                    result.TechnicalQuality = await _technicalValidator.ValidateAsync(new TechnicalQualityRequest
                    {
                        Response = request.Response,
                        OriginalRequest = request.OriginalRequest,
                        Context = request.Context
                    });
                }));
            }

            // Content Quality Assessment
            if (ShouldAssessDimension(QualityDimension.Content, request))
            {
                validationTasks.Add(Task.Run(async () =>
                {
                    result.ContentQuality = await _contentValidator.ValidateAsync(new ContentQualityRequest
                    {
                        Response = request.Response,
                        OriginalRequest = request.OriginalRequest,
                        Context = request.Context,
                        PreviousResponses = request.Context.PreviousResponses
                    });
                }));
            }

            // D&D Compliance Assessment
            if (ShouldAssessDimension(QualityDimension.DnDCompliance, request))
            {
                validationTasks.Add(Task.Run(async () =>
                {
                    result.DnDCompliance = await _dndValidator.ValidateAsync(new DnDComplianceRequest
                    {
                        Response = request.Response,
                        OriginalRequest = request.OriginalRequest,
                        CampaignContext = request.Context.Campaign
                    });
                }));
            }

            // Narrative Quality Assessment
            if (ShouldAssessDimension(QualityDimension.Narrative, request))
            {
                validationTasks.Add(Task.Run(async () =>
                {
                    result.NarrativeQuality = await _narrativeValidator.ValidateAsync(new NarrativeQualityRequest
                    {
                        Response = request.Response,
                        OriginalRequest = request.OriginalRequest,
                        Context = request.Context,
                        PreviousResponses = request.Context.PreviousResponses
                    });
                }));
            }

            // User Experience Assessment
            if (ShouldAssessDimension(QualityDimension.UserExperience, request))
            {
                validationTasks.Add(Task.Run(async () =>
                {
                    result.UserExperienceQuality = await _uxValidator.ValidateAsync(new UserExperienceRequest
                    {
                        Response = request.Response,
                        OriginalRequest = request.OriginalRequest,
                        Context = request.Context,
                        UserTier = request.Context.UserTier
                    });
                }));
            }

            // Wait for all validations to complete
            await Task.WhenAll(validationTasks);

            // Calculate aggregate quality score
            result.OverallScore = CalculateOverallQualityScore(result, request.Context.Expectations);
            result.QualityLevel = DetermineQualityLevel(result.OverallScore);

            // Generate quality decision
            result.Decision = DetermineQualityDecision(result, request.Context.Expectations);

            // Generate improvement suggestions if requested
            if (request.IncludeImprovementSuggestions)
            {
                result.ImprovementSuggestions = await GenerateImprovementSuggestionsAsync(result);
            }

            // Generate detailed feedback if requested
            if (request.IncludeDetailedFeedback)
            {
                result.DetailedFeedback = GenerateDetailedFeedback(result);
            }

            // Store quality assessment for analytics
            await _qualityRepository.StoreAssessmentAsync(result);

            // Update quality metrics
            await _metricsCollector.RecordQualityAssessmentAsync(result);

            _logger.LogInformation("Quality assessment completed: Score={Score:F2}, Level={Level}, Decision={Decision}",
                result.OverallScore, result.QualityLevel, result.Decision);

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Quality assessment failed for response {ResponseId}", 
                request.Response.RequestId);
            
            // Return a failed assessment
            result.IsSuccessful = false;
            result.ErrorMessage = ex.Message;
            result.Decision = QualityDecision.Reject;
            
            return result;
        }
    }

    private float CalculateOverallQualityScore(QualityAssessmentResult result, QualityExpectations expectations)
    {
        var scores = new Dictionary<QualityDimension, float>();
        var weights = expectations.DimensionWeights.Any() 
            ? expectations.DimensionWeights 
            : GetDefaultDimensionWeights();

        // Collect dimension scores
        if (result.TechnicalQuality != null)
            scores[QualityDimension.Technical] = result.TechnicalQuality.Score;
        
        if (result.ContentQuality != null)
            scores[QualityDimension.Content] = result.ContentQuality.Score;
        
        if (result.DnDCompliance != null)
            scores[QualityDimension.DnDCompliance] = result.DnDCompliance.Score;
        
        if (result.NarrativeQuality != null)
            scores[QualityDimension.Narrative] = result.NarrativeQuality.Score;
        
        if (result.UserExperienceQuality != null)
            scores[QualityDimension.UserExperience] = result.UserExperienceQuality.Score;

        // Calculate weighted average
        float totalWeightedScore = 0f;
        float totalWeight = 0f;

        foreach (var (dimension, score) in scores)
        {
            var weight = weights.GetValueOrDefault(dimension, 1.0f);
            totalWeightedScore += score * weight;
            totalWeight += weight;
        }

        return totalWeight > 0 ? totalWeightedScore / totalWeight : 0f;
    }

    private QualityDecision DetermineQualityDecision(QualityAssessmentResult result, QualityExpectations expectations)
    {
        // Check if overall score meets minimum threshold
        if (result.OverallScore < expectations.MinimumAcceptableScore)
        {
            return QualityDecision.Reject;
        }

        // Check critical dimensions if required
        if (expectations.RequireExcellenceInCriticalDimensions && expectations.CriticalDimensions.Any())
        {
            foreach (var criticalDimension in expectations.CriticalDimensions)
            {
                var dimensionScore = GetDimensionScore(result, criticalDimension);
                if (dimensionScore < 0.8f) // Require excellence in critical dimensions
                {
                    return QualityDecision.RegenerateWithFocus;
                }
            }
        }

        // Determine final decision based on overall score
        if (result.OverallScore >= expectations.TargetScore)
        {
            return QualityDecision.Accept;
        }
        else if (result.OverallScore >= expectations.MinimumAcceptableScore)
        {
            return QualityDecision.AcceptWithWarnings;
        }
        else
        {
            return QualityDecision.Regenerate;
        }
    }

    private async Task<List<QualityImprovementSuggestion>> GenerateImprovementSuggestionsAsync(QualityAssessmentResult result)
    {
        var suggestions = new List<QualityImprovementSuggestion>();

        // Technical quality improvements
        if (result.TechnicalQuality?.Score < 0.7f)
        {
            suggestions.AddRange(await GenerateTechnicalImprovementSuggestions(result.TechnicalQuality));
        }

        // Content quality improvements
        if (result.ContentQuality?.Score < 0.7f)
        {
            suggestions.AddRange(await GenerateContentImprovementSuggestions(result.ContentQuality));
        }

        // D&D compliance improvements
        if (result.DnDCompliance?.Score < 0.8f) // Higher threshold for D&D compliance
        {
            suggestions.AddRange(await GenerateDnDImprovementSuggestions(result.DnDCompliance));
        }

        // Narrative quality improvements
        if (result.NarrativeQuality?.Score < 0.7f)
        {
            suggestions.AddRange(await GenerateNarrativeImprovementSuggestions(result.NarrativeQuality));
        }

        // User experience improvements
        if (result.UserExperienceQuality?.Score < 0.7f)
        {
            suggestions.AddRange(await GenerateUXImprovementSuggestions(result.UserExperienceQuality));
        }

        return suggestions.OrderByDescending(s => s.Impact).ToList();
    }
}

// Specialized Quality Validators
public class TechnicalQualityValidator : ITechnicalQualityValidator
{
    public async Task<TechnicalQualityResult> ValidateAsync(TechnicalQualityRequest request)
    {
        var result = new TechnicalQualityResult();
        var issues = new List<QualityIssue>();

        // Format validation
        var formatScore = ValidateFormat(request.Response.Content);
        result.FormatScore = formatScore.Score;
        issues.AddRange(formatScore.Issues);

        // Structure validation
        var structureScore = ValidateStructure(request.Response.Content, request.OriginalRequest.Type);
        result.StructureScore = structureScore.Score;
        issues.AddRange(structureScore.Issues);

        // Completeness validation
        var completenessScore = ValidateCompleteness(request.Response, request.OriginalRequest);
        result.CompletenessScore = completenessScore.Score;
        issues.AddRange(completenessScore.Issues);

        // Length appropriateness
        var lengthScore = ValidateLength(request.Response.Content, request.OriginalRequest.Type);
        result.LengthScore = lengthScore.Score;
        issues.AddRange(lengthScore.Issues);

        // Calculate overall technical score
        result.Score = (result.FormatScore + result.StructureScore + result.CompletenessScore + result.LengthScore) / 4f;
        result.Issues = issues;
        result.IsValid = result.Score >= 0.6f && !issues.Any(i => i.Severity == QualityIssueSeverity.Critical);

        return result;
    }

    private ValidationResult ValidateFormat(string content)
    {
        var result = new ValidationResult();
        var issues = new List<QualityIssue>();

        // Check for proper sentence structure
        var sentences = content.Split('.', '!', '?').Where(s => !string.IsNullOrWhiteSpace(s)).ToList();
        var wellFormedSentences = sentences.Count(s => IsWellFormedSentence(s.Trim()));
        
        if (sentences.Any())
        {
            result.Score = (float)wellFormedSentences / sentences.Count;
            
            if (result.Score < 0.8f)
            {
                issues.Add(new QualityIssue
                {
                    Type = QualityIssueType.Format,
                    Severity = QualityIssueSeverity.Minor,
                    Description = $"Only {wellFormedSentences}/{sentences.Count} sentences are well-formed",
                    Suggestion = "Improve sentence structure and grammar"
                });
            }
        }
        else
        {
            result.Score = 0f;
            issues.Add(new QualityIssue
            {
                Type = QualityIssueType.Format,
                Severity = QualityIssueSeverity.Critical,
                Description = "Content contains no recognizable sentences",
                Suggestion = "Generate properly structured text with complete sentences"
            });
        }

        result.Issues = issues;
        return result;
    }

    private bool IsWellFormedSentence(string sentence)
    {
        return sentence.Length > 3 &&
               char.IsUpper(sentence[0]) &&
               sentence.Split(' ').Length >= 3 &&
               !sentence.Contains("  "); // No double spaces
    }
}

public class ContentQualityValidator : IContentQualityValidator
{
    private readonly IAIGatewayService _aiGateway;
    private readonly IPromptEngine _promptEngine;

    public async Task<ContentQualityResult> ValidateAsync(ContentQualityRequest request)
    {
        var result = new ContentQualityResult();
        var issues = new List<QualityIssue>();

        // Coherence validation
        var coherenceScore = await ValidateCoherenceAsync(request.Response.Content);
        result.CoherenceScore = coherenceScore.Score;
        issues.AddRange(coherenceScore.Issues);

        // Creativity validation
        var creativityScore = await ValidateCreativityAsync(request.Response.Content, request.Context);
        result.CreativityScore = creativityScore.Score;
        issues.AddRange(creativityScore.Issues);

        // Relevance validation
        var relevanceScore = ValidateRelevance(request.Response.Content, request.OriginalRequest);
        result.RelevanceScore = relevanceScore.Score;
        issues.AddRange(relevanceScore.Issues);

        // Originality validation
        var originalityScore = await ValidateOriginalityAsync(request.Response.Content, request.PreviousResponses);
        result.OriginalityScore = originalityScore.Score;
        issues.AddRange(originalityScore.Issues);

        // Engagement validation
        var engagementScore = ValidateEngagement(request.Response.Content, request.OriginalRequest.Type);
        result.EngagementScore = engagementScore.Score;
        issues.AddRange(engagementScore.Issues);

        // Calculate overall content score
        result.Score = (result.CoherenceScore + result.CreativityScore + result.RelevanceScore + 
                       result.OriginalityScore + result.EngagementScore) / 5f;
        result.Issues = issues;
        result.IsValid = result.Score >= 0.6f;

        return result;
    }

    private async Task<ValidationResult> ValidateCoherenceAsync(string content)
    {
        // Use AI to assess coherence
        var prompt = $"Rate the coherence and logical flow of this text on a scale of 0.0 to 1.0. " +
                    $"Consider sentence transitions, logical progression, and overall clarity. " +
                    $"Respond with just the numeric score followed by a brief explanation.\n\nText: {content}";

        try
        {
            var aiResponse = await _aiGateway.GenerateContentAsync(new AIRequest
            {
                UserId = Guid.Empty,
                Type = AIRequestType.GeneralText,
                Messages = new List<AIMessage> { new() { Role = "user", Content = prompt } },
                Parameters = new AIParameters { Temperature = 0.1f, MaxTokens = 200 }
            });

            var score = ExtractScoreFromResponse(aiResponse.Content);
            var explanation = ExtractExplanationFromResponse(aiResponse.Content);

            var result = new ValidationResult { Score = score };
            
            if (score < 0.7f)
            {
                result.Issues.Add(new QualityIssue
                {
                    Type = QualityIssueType.Coherence,
                    Severity = score < 0.4f ? QualityIssueSeverity.Major : QualityIssueSeverity.Minor,
                    Description = $"Content coherence is low: {explanation}",
                    Suggestion = "Improve logical flow and sentence transitions"
                });
            }

            return result;
        }
        catch (Exception ex)
        {
            // Fallback to simple coherence check
            return FallbackCoherenceValidation(content);
        }
    }

    private ValidationResult FallbackCoherenceValidation(string content)
    {
        var sentences = content.Split('.', '!', '?').Where(s => !string.IsNullOrWhiteSpace(s)).ToList();
        
        // Simple heuristics for coherence
        var coherenceScore = 1.0f;
        var issues = new List<QualityIssue>();

        // Check for excessive repetition
        var repetitionScore = CalculateRepetitionScore(sentences);
        if (repetitionScore > 0.3f)
        {
            coherenceScore -= repetitionScore * 0.5f;
            issues.Add(new QualityIssue
            {
                Type = QualityIssueType.Coherence,
                Severity = QualityIssueSeverity.Minor,
                Description = "Content contains excessive repetition",
                Suggestion = "Reduce repetitive phrases and vary sentence structure"
            });
        }

        // Check for abrupt topic changes
        var topicChangeScore = CalculateTopicChangeScore(sentences);
        if (topicChangeScore > 0.4f)
        {
            coherenceScore -= topicChangeScore * 0.3f;
            issues.Add(new QualityIssue
            {
                Type = QualityIssueType.Coherence,
                Severity = QualityIssueSeverity.Minor,
                Description = "Content has abrupt topic changes",
                Suggestion = "Add better transitions between topics"
            });
        }

        return new ValidationResult
        {
            Score = Math.Max(0f, coherenceScore),
            Issues = issues
        };
    }
}

public class DnDComplianceValidator : IDnDComplianceValidator
{
    private readonly IDnDRulesEngine _rulesEngine;
    private readonly IDnDLoreValidator _loreValidator;

    public async Task<DnDComplianceResult> ValidateAsync(DnDComplianceRequest request)
    {
        var result = new DnDComplianceResult();
        var issues = new List<QualityIssue>();

        // Rules compliance validation
        var rulesScore = await ValidateRulesComplianceAsync(request.Response.Content);
        result.RulesComplianceScore = rulesScore.Score;
        issues.AddRange(rulesScore.Issues);

        // Lore consistency validation
        var loreScore = await ValidateLoreConsistencyAsync(request.Response.Content, request.CampaignContext);
        result.LoreConsistencyScore = loreScore.Score;
        issues.AddRange(loreScore.Issues);

        // Terminology validation
        var terminologyScore = ValidateTerminology(request.Response.Content);
        result.TerminologyScore = terminologyScore.Score;
        issues.AddRange(terminologyScore.Issues);

        // Setting appropriateness
        var settingScore = ValidateSettingAppropriateness(request.Response.Content, request.CampaignContext);
        result.SettingScore = settingScore.Score;
        issues.AddRange(settingScore.Issues);

        // Calculate overall D&D compliance score
        result.Score = (result.RulesComplianceScore + result.LoreConsistencyScore + 
                       result.TerminologyScore + result.SettingScore) / 4f;
        result.Issues = issues;
        result.IsValid = result.Score >= 0.8f; // Higher threshold for D&D compliance

        return result;
    }

    private async Task<ValidationResult> ValidateRulesComplianceAsync(string content)
    {
        var result = new ValidationResult();
        var issues = new List<QualityIssue>();

        // Check for rule violations using the rules engine
        var ruleViolations = await _rulesEngine.ValidateContentAsync(content);
        
        var totalViolations = ruleViolations.Count;
        var criticalViolations = ruleViolations.Count(v => v.Severity == RuleViolationSeverity.Critical);
        var majorViolations = ruleViolations.Count(v => v.Severity == RuleViolationSeverity.Major);

        // Calculate score based on violations
        result.Score = 1.0f;
        result.Score -= criticalViolations * 0.3f; // Critical violations heavily penalized
        result.Score -= majorViolations * 0.15f;   // Major violations moderately penalized
        result.Score -= (totalViolations - criticalViolations - majorViolations) * 0.05f; // Minor violations lightly penalized
        result.Score = Math.Max(0f, result.Score);

        // Convert rule violations to quality issues
        foreach (var violation in ruleViolations)
        {
            issues.Add(new QualityIssue
            {
                Type = QualityIssueType.RulesCompliance,
                Severity = MapRuleViolationSeverity(violation.Severity),
                Description = violation.Description,
                Suggestion = violation.Suggestion,
                Location = violation.Location
            });
        }

        result.Issues = issues;
        return result;
    }
}

// Supporting data models
public class QualityAssessmentResult
{
    public string ResponseId { get; set; } = string.Empty;
    public DateTime AssessedAt { get; set; }
    public QualityAssessmentMode Mode { get; set; }
    public bool IsSuccessful { get; set; } = true;
    public string? ErrorMessage { get; set; }
    
    // Dimension-specific results
    public TechnicalQualityResult? TechnicalQuality { get; set; }
    public ContentQualityResult? ContentQuality { get; set; }
    public DnDComplianceResult? DnDCompliance { get; set; }
    public NarrativeQualityResult? NarrativeQuality { get; set; }
    public UserExperienceResult? UserExperienceQuality { get; set; }
    
    // Overall assessment
    public float OverallScore { get; set; }
    public QualityLevel QualityLevel { get; set; }
    public QualityDecision Decision { get; set; }
    
    // Feedback and suggestions
    public List<QualityImprovementSuggestion> ImprovementSuggestions { get; set; } = new();
    public string DetailedFeedback { get; set; } = string.Empty;
    public List<string> Strengths { get; set; } = new();
    public List<string> Weaknesses { get; set; } = new();
}

public class TechnicalQualityResult
{
    public float Score { get; set; }
    public bool IsValid { get; set; }
    public float FormatScore { get; set; }
    public float StructureScore { get; set; }
    public float CompletenessScore { get; set; }
    public float LengthScore { get; set; }
    public List<QualityIssue> Issues { get; set; } = new();
}

public class ContentQualityResult
{
    public float Score { get; set; }
    public bool IsValid { get; set; }
    public float CoherenceScore { get; set; }
    public float CreativityScore { get; set; }
    public float RelevanceScore { get; set; }
    public float OriginalityScore { get; set; }
    public float EngagementScore { get; set; }
    public List<QualityIssue> Issues { get; set; } = new();
}

public class QualityIssue
{
    public QualityIssueType Type { get; set; }
    public QualityIssueSeverity Severity { get; set; }
    public string Description { get; set; } = string.Empty;
    public string Suggestion { get; set; } = string.Empty;
    public string? Location { get; set; }
    public float Impact { get; set; }
}

public enum QualityIssueType
{
    Format,
    Structure,
    Completeness,
    Length,
    Coherence,
    Creativity,
    Relevance,
    Originality,
    Engagement,
    RulesCompliance,
    LoreConsistency,
    Terminology,
    Setting,
    CharacterVoice,
    PlotConsistency,
    Usability,
    Accessibility
}

public enum QualityIssueSeverity
{
    Minor,      // Cosmetic issues, doesn't affect functionality
    Moderate,   // Noticeable issues that may impact experience
    Major,      // Significant issues that impact quality
    Critical    // Severe issues that make content unusable
}

public enum QualityDecision
{
    Accept,                 // Content meets quality standards
    AcceptWithWarnings,     // Content acceptable but has minor issues
    Regenerate,            // Content should be regenerated
    RegenerateWithFocus,   // Regenerate focusing on specific dimensions
    Reject                 // Content fails quality standards
}

public class QualityImprovementSuggestion
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public QualityDimension TargetDimension { get; set; }
    public float Impact { get; set; } // Expected improvement impact
    public string Implementation { get; set; } = string.Empty;
    public int Priority { get; set; }
}
```

This comprehensive quality assurance system provides multi-dimensional validation of AI outputs, ensuring they meet high standards for technical quality, content quality, D&D compliance, narrative coherence, and user experience while providing detailed feedback and improvement suggestions.
