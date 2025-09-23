# AI Content Filtering & Safety System

## Overview
This document defines the comprehensive content filtering and safety system that ensures AI-generated content meets community standards, maintains age-appropriate content, prevents harmful outputs, and provides configurable safety levels for different campaign types and user preferences.

---

## Content Safety Architecture

### **Multi-Layer Safety Pipeline**
```
┌─────────────────────────────────────────────────────────────────┐
│                    AI Response Generation                       │
└─────────────────────────────────────────────────────────────────┘
                                │
                    ┌───────────────────────┐
                    │   Pre-Generation      │
                    │   Safety Checks       │
                    │ (Prompt Analysis)     │
                    └───────────────────────┘
                                │
                    ┌───────────────────────┐
                    │   AI Provider         │
                    │   Generation          │
                    └───────────────────────┘
                                │
                    ┌───────────────────────┐
                    │   Post-Generation     │
                    │   Content Filtering   │
                    │   (Multi-Stage)       │
                    └───────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
┌───────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Provider    │    │   Rule-Based    │    │   ML-Based      │
│  Moderation   │    │   Filtering     │    │  Classification │
│   (OpenAI)    │    │  (Keywords)     │    │  (Custom Model) │
└───────────────┘    └─────────────────┘    └─────────────────┘
        │                       │                       │
        └───────────────────────┼───────────────────────┘
                                │
                    ┌───────────────────────┐
                    │   Content Quality     │
                    │   & Consistency       │
                    │     Validation        │
                    └───────────────────────┘
                                │
                    ┌───────────────────────┐
                    │   Campaign-Specific   │
                    │   Safety Settings     │
                    │    Application        │
                    └───────────────────────┘
                                │
                    ┌───────────────────────┐
                    │   Final Content       │
                    │   Delivery or         │
                    │   Rejection           │
                    └───────────────────────┘
```

### **Core Content Filter Interface**
```csharp
public interface IContentFilter
{
    // Primary filtering methods
    Task<ContentFilterResult> FilterContentAsync(string content, ContentFilterRequest request);
    Task<ContentFilterResult> FilterAIResponseAsync(AIResponse response, ContentFilterContext context);
    Task<PromptSafetyResult> ValidatePromptSafetyAsync(string prompt, PromptSafetyContext context);
    
    // Batch processing
    Task<List<ContentFilterResult>> FilterMultipleAsync(List<string> contents, ContentFilterRequest request);
    
    // Configuration and rules management
    Task<List<ContentFilterRule>> GetActiveRulesAsync(ContentSafetyLevel safetyLevel);
    Task UpdateFilterRulesAsync(List<ContentFilterRule> rules);
    Task<ContentSafetySettings> GetSafetySettingsAsync(Guid campaignId);
    
    // Reporting and analytics
    Task ReportViolationAsync(ContentViolationReport report);
    Task<ContentModerationStats> GetModerationStatsAsync(TimeSpan period);
    Task<List<ContentViolation>> GetRecentViolationsAsync(int limit = 100);
}

public enum ContentSafetyLevel
{
    Minimal,     // Basic safety only (adult content allowed)
    Moderate,    // Standard safety (some mature themes allowed)
    Strict,      // High safety (family-friendly content only)
    Custom       // Campaign-specific rules
}

public enum ViolationType
{
    // Content violations
    ExplicitSexualContent,
    GraphicViolence,
    HateSpeech,
    Harassment,
    SelfHarm,
    IllegalActivity,
    
    // D&D specific violations
    MetaGaming,
    RuleBreaking,
    CharacterInconsistency,
    WorldInconsistency,
    
    // Quality violations
    LowQuality,
    Nonsensical,
    OffTopic,
    Repetitive,
    
    // Technical violations
    TokenLimit,
    FormatViolation,
    LanguageViolation
}

public class ContentFilterResult
{
    public bool IsAllowed { get; set; }
    public string FilteredContent { get; set; } = string.Empty;
    public string OriginalContent { get; set; } = string.Empty;
    public List<ContentViolation> Violations { get; set; } = new();
    public ContentSafetyScore SafetyScore { get; set; } = new();
    public List<string> AppliedFilters { get; set; } = new();
    public bool WasModified { get; set; }
    public string ModificationReason { get; set; } = string.Empty;
    public DateTime ProcessedAt { get; set; }
    public Dictionary<string, object> Metadata { get; set; } = new();
}

public class ContentViolation
{
    public ViolationType Type { get; set; }
    public string Description { get; set; } = string.Empty;
    public float Severity { get; set; } // 0.0 to 1.0
    public float Confidence { get; set; } // 0.0 to 1.0
    public string ViolatingText { get; set; } = string.Empty;
    public int StartIndex { get; set; }
    public int Length { get; set; }
    public string FilterSource { get; set; } = string.Empty; // Which filter detected this
    public bool IsBlocking { get; set; } // Whether this violation blocks content
    public string SuggestedReplacement { get; set; } = string.Empty;
}

public class ContentSafetyScore
{
    public float OverallScore { get; set; } // 0.0 (unsafe) to 1.0 (safe)
    public Dictionary<ViolationType, float> CategoryScores { get; set; } = new();
    public float Confidence { get; set; }
    public string RiskAssessment { get; set; } = string.Empty;
}
```

### **Content Filter Implementation**
```csharp
public class ContentFilter : IContentFilter
{
    private readonly IProviderModerationService _providerModeration;
    private readonly IRuleBasedFilter _ruleBasedFilter;
    private readonly IMLContentClassifier _mlClassifier;
    private readonly IContentQualityValidator _qualityValidator;
    private readonly ICampaignSettingsService _campaignSettings;
    private readonly IContentFilterRepository _filterRepo;
    private readonly ILogger<ContentFilter> _logger;
    private readonly ContentFilterConfiguration _config;

    public async Task<ContentFilterResult> FilterContentAsync(string content, ContentFilterRequest request)
    {
        var result = new ContentFilterResult
        {
            OriginalContent = content,
            FilteredContent = content,
            ProcessedAt = DateTime.UtcNow
        };

        try
        {
            // Stage 1: Pre-processing validation
            if (string.IsNullOrWhiteSpace(content))
            {
                result.IsAllowed = false;
                result.Violations.Add(new ContentViolation
                {
                    Type = ViolationType.LowQuality,
                    Description = "Empty or whitespace-only content",
                    Severity = 1.0f,
                    Confidence = 1.0f,
                    IsBlocking = true
                });
                return result;
            }

            // Stage 2: Provider-based moderation (OpenAI, etc.)
            if (_config.UseProviderModeration)
            {
                var providerResult = await _providerModeration.ModerateContentAsync(content);
                ProcessProviderModerationResult(result, providerResult);
                
                if (providerResult.IsBlocked && _config.BlockOnProviderViolation)
                {
                    result.IsAllowed = false;
                    return result;
                }
            }

            // Stage 3: Rule-based filtering
            var ruleBasedResult = await _ruleBasedFilter.FilterAsync(content, request.SafetyLevel);
            ProcessRuleBasedResult(result, ruleBasedResult);

            // Stage 4: ML-based classification
            if (_config.UseMLClassification)
            {
                var mlResult = await _mlClassifier.ClassifyContentAsync(content);
                ProcessMLClassificationResult(result, mlResult);
            }

            // Stage 5: D&D-specific validation
            var dndValidation = await ValidateDnDContentAsync(content, request);
            ProcessDnDValidationResult(result, dndValidation);

            // Stage 6: Quality validation
            var qualityResult = await _qualityValidator.ValidateQualityAsync(content, request);
            ProcessQualityValidationResult(result, qualityResult);

            // Stage 7: Campaign-specific rules
            if (request.CampaignId.HasValue)
            {
                var campaignResult = await ApplyCampaignSpecificRulesAsync(content, request.CampaignId.Value);
                ProcessCampaignRulesResult(result, campaignResult);
            }

            // Final decision and content modification
            result.IsAllowed = DetermineFinalAllowance(result);
            
            if (result.IsAllowed && result.WasModified)
            {
                result.FilteredContent = ApplyContentModifications(result);
            }

            // Calculate overall safety score
            result.SafetyScore = CalculateSafetyScore(result);

            // Log the filtering result
            _logger.LogInformation(
                "Content filtering completed: Allowed={IsAllowed}, Violations={ViolationCount}, Score={SafetyScore}",
                result.IsAllowed, result.Violations.Count, result.SafetyScore.OverallScore);

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during content filtering");
            
            // Fail-safe: block content if filtering fails
            result.IsAllowed = false;
            result.Violations.Add(new ContentViolation
            {
                Type = ViolationType.TokenLimit, // Generic technical violation
                Description = $"Content filtering error: {ex.Message}",
                Severity = 1.0f,
                Confidence = 1.0f,
                IsBlocking = true
            });
            
            return result;
        }
    }

    private async Task<DnDContentValidationResult> ValidateDnDContentAsync(string content, ContentFilterRequest request)
    {
        var result = new DnDContentValidationResult();
        
        // Check for meta-gaming content
        if (ContainsMetaGamingReferences(content))
        {
            result.Violations.Add(new ContentViolation
            {
                Type = ViolationType.MetaGaming,
                Description = "Content contains meta-gaming references",
                Severity = 0.6f,
                Confidence = 0.8f,
                IsBlocking = false // Usually just a warning
            });
        }

        // Validate D&D 5e rule consistency
        var ruleViolations = await ValidateRuleConsistencyAsync(content);
        result.Violations.AddRange(ruleViolations);

        // Check character consistency if character context is provided
        if (request.CharacterContext != null)
        {
            var characterViolations = ValidateCharacterConsistency(content, request.CharacterContext);
            result.Violations.AddRange(characterViolations);
        }

        // Validate world consistency if campaign context is provided
        if (request.CampaignContext != null)
        {
            var worldViolations = await ValidateWorldConsistencyAsync(content, request.CampaignContext);
            result.Violations.AddRange(worldViolations);
        }

        return result;
    }

    private bool ContainsMetaGamingReferences(string content)
    {
        var metaGamingPatterns = new[]
        {
            @"\b(dice|d\d+|roll|RNG|random number)\b",
            @"\b(HP|health points|hit points)\b",
            @"\b(AC|armor class)\b",
            @"\b(stats?|statistics?)\b",
            @"\b(level|XP|experience points?)\b",
            @"\b(DM|GM|game master|dungeon master)\b",
            @"\b(player|character sheet)\b",
            @"\b(out of character|OOC)\b"
        };

        foreach (var pattern in metaGamingPatterns)
        {
            if (Regex.IsMatch(content, pattern, RegexOptions.IgnoreCase))
            {
                return true;
            }
        }

        return false;
    }

    private async Task<List<ContentViolation>> ValidateRuleConsistencyAsync(string content)
    {
        var violations = new List<ContentViolation>();
        
        // Check for impossible spell combinations
        var spellViolations = await ValidateSpellConsistencyAsync(content);
        violations.AddRange(spellViolations);
        
        // Check for impossible ability score references
        var abilityViolations = ValidateAbilityScoreReferences(content);
        violations.AddRange(abilityViolations);
        
        // Check for class/race impossibilities
        var classRaceViolations = ValidateClassRaceConsistency(content);
        violations.AddRange(classRaceViolations);
        
        return violations;
    }

    private List<ContentViolation> ValidateCharacterConsistency(string content, CharacterContext character)
    {
        var violations = new List<ContentViolation>();
        
        // Check if content contradicts established character traits
        if (character.PersonalityTraits?.Any() == true)
        {
            foreach (var trait in character.PersonalityTraits)
            {
                if (ContradictsTrait(content, trait))
                {
                    violations.Add(new ContentViolation
                    {
                        Type = ViolationType.CharacterInconsistency,
                        Description = $"Content contradicts established personality trait: {trait}",
                        Severity = 0.7f,
                        Confidence = 0.6f,
                        IsBlocking = false
                    });
                }
            }
        }
        
        // Check class-specific behavior consistency
        if (!string.IsNullOrEmpty(character.Class))
        {
            var classBehaviorViolations = ValidateClassBehavior(content, character.Class);
            violations.AddRange(classBehaviorViolations);
        }
        
        return violations;
    }
}

// Campaign-specific safety settings
public class CampaignSafetySettings
{
    public Guid CampaignId { get; set; }
    public ContentSafetyLevel SafetyLevel { get; set; } = ContentSafetyLevel.Moderate;
    
    // Content restrictions
    public bool AllowMatureThemes { get; set; } = true;
    public bool AllowViolence { get; set; } = true;
    public bool AllowProfanity { get; set; } = false;
    public bool AllowRomance { get; set; } = true;
    public bool AllowHorrorElements { get; set; } = true;
    
    // D&D specific settings
    public bool EnforceRuleCompliance { get; set; } = true;
    public bool AllowMetaGaming { get; set; } = false;
    public bool RequireCharacterConsistency { get; set; } = true;
    public bool RequireWorldConsistency { get; set; } = true;
    
    // Custom rules
    public List<string> BannedWords { get; set; } = new();
    public List<string> BannedTopics { get; set; } = new();
    public List<string> RequiredElements { get; set; } = new();
    
    // Quality standards
    public int MinimumContentLength { get; set; } = 10;
    public int MaximumContentLength { get; set; } = 2000;
    public bool RequireProperGrammar { get; set; } = false;
    
    // Moderation settings
    public bool AutoRejectViolations { get; set; } = false;
    public bool NotifyGMOfViolations { get; set; } = true;
    public bool LogAllContent { get; set; } = false;
    
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

// Rule-based filter implementation
public class RuleBasedFilter : IRuleBasedFilter
{
    private readonly IContentFilterRepository _repository;
    private readonly ILogger<RuleBasedFilter> _logger;

    public async Task<RuleBasedFilterResult> FilterAsync(string content, ContentSafetyLevel safetyLevel)
    {
        var result = new RuleBasedFilterResult();
        var rules = await _repository.GetActiveRulesAsync(safetyLevel);
        
        foreach (var rule in rules)
        {
            var ruleResult = await ApplyRuleAsync(content, rule);
            if (ruleResult.HasViolation)
            {
                result.Violations.AddRange(ruleResult.Violations);
                
                if (rule.Action == FilterAction.Block)
                {
                    result.IsBlocked = true;
                }
                else if (rule.Action == FilterAction.Replace)
                {
                    content = ApplyReplacement(content, rule);
                    result.WasModified = true;
                }
            }
        }
        
        result.ProcessedContent = content;
        return result;
    }

    private async Task<RuleApplicationResult> ApplyRuleAsync(string content, ContentFilterRule rule)
    {
        var result = new RuleApplicationResult();
        
        switch (rule.Type)
        {
            case FilterRuleType.Keyword:
                result = ApplyKeywordRule(content, rule);
                break;
            case FilterRuleType.Regex:
                result = ApplyRegexRule(content, rule);
                break;
            case FilterRuleType.Semantic:
                result = await ApplySemanticRuleAsync(content, rule);
                break;
            case FilterRuleType.Length:
                result = ApplyLengthRule(content, rule);
                break;
        }
        
        return result;
    }

    private RuleApplicationResult ApplyKeywordRule(string content, ContentFilterRule rule)
    {
        var result = new RuleApplicationResult();
        var keywords = rule.Parameters["keywords"] as List<string> ?? new List<string>();
        
        foreach (var keyword in keywords)
        {
            var matches = Regex.Matches(content, $@"\b{Regex.Escape(keyword)}\b", RegexOptions.IgnoreCase);
            
            if (matches.Count > 0)
            {
                result.HasViolation = true;
                result.Violations.Add(new ContentViolation
                {
                    Type = rule.ViolationType,
                    Description = $"Contains banned keyword: {keyword}",
                    Severity = rule.Severity,
                    Confidence = 0.9f,
                    ViolatingText = keyword,
                    IsBlocking = rule.Action == FilterAction.Block
                });
            }
        }
        
        return result;
    }
}

// Content quality validator
public class ContentQualityValidator : IContentQualityValidator
{
    public async Task<ContentQualityResult> ValidateQualityAsync(string content, ContentFilterRequest request)
    {
        var result = new ContentQualityResult();
        
        // Length validation
        if (content.Length < request.MinLength)
        {
            result.Violations.Add(new ContentViolation
            {
                Type = ViolationType.LowQuality,
                Description = $"Content too short (minimum {request.MinLength} characters)",
                Severity = 0.5f,
                Confidence = 1.0f,
                IsBlocking = true
            });
        }
        
        if (content.Length > request.MaxLength)
        {
            result.Violations.Add(new ContentViolation
            {
                Type = ViolationType.TokenLimit,
                Description = $"Content too long (maximum {request.MaxLength} characters)",
                Severity = 0.8f,
                Confidence = 1.0f,
                IsBlocking = true
            });
        }
        
        // Repetition detection
        var repetitionScore = CalculateRepetitionScore(content);
        if (repetitionScore > 0.7f)
        {
            result.Violations.Add(new ContentViolation
            {
                Type = ViolationType.Repetitive,
                Description = "Content contains excessive repetition",
                Severity = repetitionScore,
                Confidence = 0.8f,
                IsBlocking = false
            });
        }
        
        // Coherence validation
        var coherenceScore = await CalculateCoherenceScoreAsync(content);
        if (coherenceScore < 0.3f)
        {
            result.Violations.Add(new ContentViolation
            {
                Type = ViolationType.Nonsensical,
                Description = "Content lacks coherence or meaning",
                Severity = 1.0f - coherenceScore,
                Confidence = 0.7f,
                IsBlocking = true
            });
        }
        
        result.QualityScore = CalculateOverallQualityScore(content, result.Violations);
        return result;
    }

    private float CalculateRepetitionScore(string content)
    {
        var sentences = content.Split('.', '!', '?')
            .Where(s => !string.IsNullOrWhiteSpace(s))
            .Select(s => s.Trim())
            .ToList();
        
        if (sentences.Count < 2) return 0f;
        
        var duplicates = sentences.GroupBy(s => s.ToLower())
            .Where(g => g.Count() > 1)
            .Sum(g => g.Count() - 1);
        
        return (float)duplicates / sentences.Count;
    }

    private async Task<float> CalculateCoherenceScoreAsync(string content)
    {
        // Use sentence embeddings to calculate coherence
        // This would integrate with a sentence similarity model
        // For now, return a simple heuristic based on sentence structure
        
        var sentences = content.Split('.', '!', '?')
            .Where(s => !string.IsNullOrWhiteSpace(s))
            .ToList();
        
        if (sentences.Count < 2) return 1.0f;
        
        // Simple coherence heuristic: check for proper sentence structure
        var wellFormedSentences = sentences.Count(s => 
            s.Trim().Length > 5 && 
            char.IsUpper(s.Trim()[0]) &&
            s.Split(' ').Length > 2);
        
        return (float)wellFormedSentences / sentences.Count;
    }
}
```

This comprehensive content filtering system ensures that AI-generated content is safe, appropriate, and consistent with D&D campaign requirements while providing flexible configuration options for different campaign styles and safety preferences.
