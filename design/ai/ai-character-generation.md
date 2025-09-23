# AI Character Generation & Development System

## Overview
This document defines the comprehensive AI-powered character creation and development system that assists players in creating rich, D&D 5e-compliant characters with detailed backgrounds, compelling motivations, and integrated campaign connections while maintaining player agency and creativity.

---

## Character AI Architecture

### **Character Generation Pipeline**
```
┌─────────────────────────────────────────────────────────────────┐
│                Player Character Creation Request                │
└─────────────────────────────────────────────────────────────────┘
                                │
                    ┌───────────────────────┐
                    │   Player Input        │
                    │   Analysis            │
                    │ (Preferences, Ideas,  │
                    │  Campaign Context)    │
                    └───────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
┌───────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   D&D 5e      │    │   Background    │    │   Personality   │
│   Rules       │    │   Generation    │    │   Development   │
│  Validation   │    │   & History     │    │   & Traits      │
└───────────────┘    └─────────────────┘    └─────────────────┘
        │                       │                       │
        └───────────────────────┼───────────────────────┘
                                │
                    ┌───────────────────────┐
                    │   Campaign            │
                    │   Integration         │
                    │  (NPCs, Quests,      │
                    │   World Connections)  │
                    └───────────────────────┘
                                │
                    ┌───────────────────────┐
                    │   Character           │
                    │   Optimization        │
                    │  (Balance, Viability) │
                    └───────────────────────┘
                                │
                    ┌───────────────────────┐
                    │   Final Character     │
                    │   Assembly &          │
                    │   Validation          │
                    └───────────────────────┘
```

### **Core Character AI Interface**
```csharp
public interface ICharacterGenerationService
{
    // Character Creation
    Task<CharacterGenerationResult> GenerateCharacterAsync(CharacterGenerationRequest request);
    Task<CharacterBackgroundResult> GenerateBackgroundAsync(BackgroundGenerationRequest request);
    Task<CharacterPersonalityResult> GeneratePersonalityAsync(PersonalityGenerationRequest request);
    Task<CharacterAppearanceResult> GenerateAppearanceAsync(AppearanceGenerationRequest request);
    
    // Character Development
    Task<CharacterEvolutionResult> EvolveCharacterAsync(CharacterEvolutionRequest request);
    Task<CharacterMotivationResult> GenerateMotivationsAsync(MotivationGenerationRequest request);
    Task<CharacterRelationshipResult> GenerateRelationshipsAsync(RelationshipGenerationRequest request);
    
    // Campaign Integration
    Task<CampaignIntegrationResult> IntegrateWithCampaignAsync(CampaignIntegrationRequest request);
    Task<List<QuestHook>> GeneratePersonalQuestHooksAsync(PersonalQuestHookRequest request);
    Task<List<NPCConnection>> GenerateNPCConnectionsAsync(NPCConnectionRequest request);
    
    // Character Optimization
    Task<CharacterOptimizationResult> OptimizeCharacterBuildAsync(OptimizationRequest request);
    Task<CharacterValidationResult> ValidateCharacterAsync(CharacterValidationRequest request);
    Task<List<CharacterSuggestion>> GetCharacterSuggestionsAsync(SuggestionRequest request);
    
    // Interactive Creation
    Task<CharacterCreationStep> GetNextCreationStepAsync(Guid sessionId);
    Task<CharacterCreationResult> ProcessCreationStepAsync(Guid sessionId, CreationStepResponse response);
    Task<CharacterCreationSession> StartInteractiveCreationAsync(InteractiveCreationRequest request);
}

public enum CharacterCreationMode
{
    Guided,        // Step-by-step guided creation
    Assisted,      // AI suggestions with player control
    Collaborative, // Back-and-forth with AI
    Quick,         // Rapid generation with minimal input
    Advanced       // Full customization with AI enhancement
}

public enum CharacterComplexity
{
    Simple,        // Basic stats and minimal background
    Standard,      // Full character with moderate background
    Detailed,      // Rich background with relationships
    Epic           // Legendary background with campaign integration
}

public class CharacterGenerationRequest
{
    public Guid UserId { get; set; }
    public Guid CampaignId { get; set; }
    public CharacterCreationMode Mode { get; set; } = CharacterCreationMode.Assisted;
    public CharacterComplexity Complexity { get; set; } = CharacterComplexity.Standard;
    
    // Player preferences
    public string? PlayerVision { get; set; }
    public List<string> DesiredTraits { get; set; } = new();
    public List<string> UnwantedTraits { get; set; } = new();
    public List<string> PreferredThemes { get; set; } = new();
    public List<string> AvoidedThemes { get; set; } = new();
    
    // D&D 5e specifications
    public string? PreferredRace { get; set; }
    public string? PreferredClass { get; set; }
    public string? PreferredBackground { get; set; }
    public int Level { get; set; } = 1;
    public AbilityScoreMethod ScoreMethod { get; set; } = AbilityScoreMethod.StandardArray;
    
    // Campaign integration preferences
    public bool IntegrateWithCampaign { get; set; } = true;
    public bool CreateNPCConnections { get; set; } = true;
    public bool GenerateQuestHooks { get; set; } = true;
    public List<string> ImportantCampaignElements { get; set; } = new();
    
    // Generation parameters
    public float CreativityLevel { get; set; } = 0.7f;
    public bool GenerateAppearance { get; set; } = true;
    public bool GeneratePersonality { get; set; } = true;
    public bool GenerateBackstory { get; set; } = true;
    public bool GenerateMotivations { get; set; } = true;
    public SubscriptionTier UserTier { get; set; }
    
    // Interactive session
    public Guid? SessionId { get; set; }
    public Dictionary<string, object> SessionData { get; set; } = new();
}

public enum AbilityScoreMethod
{
    StandardArray,
    PointBuy,
    RolledStats,
    Custom
}
```

### **Character Generation Service Implementation**
```csharp
public class CharacterGenerationService : ICharacterGenerationService
{
    private readonly IAIGatewayService _aiGateway;
    private readonly IPromptEngine _promptEngine;
    private readonly IDnDRulesEngine _rulesEngine;
    private readonly ICampaignService _campaignService;
    private readonly INPCService _npcService;
    private readonly ICharacterRepository _characterRepository;
    private readonly ICharacterCreationSessionService _sessionService;
    private readonly ILogger<CharacterGenerationService> _logger;

    public async Task<CharacterGenerationResult> GenerateCharacterAsync(CharacterGenerationRequest request)
    {
        _logger.LogInformation("Starting character generation for user {UserId} in campaign {CampaignId}", 
            request.UserId, request.CampaignId);

        try
        {
            var result = new CharacterGenerationResult
            {
                RequestId = Guid.NewGuid(),
                GeneratedAt = DateTime.UtcNow
            };

            // Step 1: Analyze player input and campaign context
            var analysisContext = await AnalyzePlayerInputAsync(request);
            var campaignContext = await GetCampaignContextAsync(request.CampaignId);

            // Step 2: Generate core character concept
            var characterConcept = await GenerateCharacterConceptAsync(request, analysisContext, campaignContext);
            result.CharacterConcept = characterConcept;

            // Step 3: Generate D&D 5e mechanical aspects
            var mechanicalAspects = await GenerateMechanicalAspectsAsync(request, characterConcept);
            result.MechanicalAspects = mechanicalAspects;

            // Step 4: Generate personality and traits
            if (request.GeneratePersonality)
            {
                var personalityResult = await GeneratePersonalityAsync(new PersonalityGenerationRequest
                {
                    CharacterConcept = characterConcept,
                    PlayerPreferences = analysisContext.PlayerPreferences,
                    CampaignTone = campaignContext.Tone,
                    Complexity = request.Complexity,
                    CreativityLevel = request.CreativityLevel
                });
                result.Personality = personalityResult.Personality;
            }

            // Step 5: Generate appearance
            if (request.GenerateAppearance)
            {
                var appearanceResult = await GenerateAppearanceAsync(new AppearanceGenerationRequest
                {
                    Race = mechanicalAspects.Race,
                    Class = mechanicalAspects.Class,
                    Personality = result.Personality,
                    PlayerPreferences = analysisContext.PlayerPreferences,
                    CreativityLevel = request.CreativityLevel
                });
                result.Appearance = appearanceResult.Appearance;
            }

            // Step 6: Generate backstory
            if (request.GenerateBackstory)
            {
                var backstoryResult = await GenerateBackgroundAsync(new BackgroundGenerationRequest
                {
                    CharacterConcept = characterConcept,
                    MechanicalAspects = mechanicalAspects,
                    Personality = result.Personality,
                    CampaignContext = campaignContext,
                    Complexity = request.Complexity,
                    IntegrateWithCampaign = request.IntegrateWithCampaign
                });
                result.Background = backstoryResult.Background;
            }

            // Step 7: Generate motivations and goals
            if (request.GenerateMotivations)
            {
                var motivationResult = await GenerateMotivationsAsync(new MotivationGenerationRequest
                {
                    CharacterConcept = characterConcept,
                    Personality = result.Personality,
                    Background = result.Background,
                    CampaignContext = campaignContext
                });
                result.Motivations = motivationResult.Motivations;
            }

            // Step 8: Campaign integration
            if (request.IntegrateWithCampaign)
            {
                var integrationResult = await IntegrateWithCampaignAsync(new CampaignIntegrationRequest
                {
                    Character = result,
                    CampaignId = request.CampaignId,
                    CreateNPCConnections = request.CreateNPCConnections,
                    GenerateQuestHooks = request.GenerateQuestHooks
                });
                result.CampaignIntegration = integrationResult;
            }

            // Step 9: Character optimization and validation
            var optimizationResult = await OptimizeCharacterBuildAsync(new OptimizationRequest
            {
                Character = result,
                OptimizationGoals = analysisContext.OptimizationGoals,
                PlayerExperience = analysisContext.PlayerExperience
            });
            result.OptimizationSuggestions = optimizationResult.Suggestions;

            // Step 10: Final validation
            var validationResult = await ValidateCharacterAsync(new CharacterValidationRequest
            {
                Character = result,
                CampaignRules = campaignContext.Rules,
                Level = request.Level
            });
            result.ValidationResult = validationResult;

            result.IsSuccessful = validationResult.IsValid;
            result.QualityScore = CalculateOverallQualityScore(result);

            _logger.LogInformation("Character generation completed: {IsSuccessful}, Quality: {QualityScore:F2}",
                result.IsSuccessful, result.QualityScore);

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Character generation failed for user {UserId}", request.UserId);
            throw;
        }
    }

    public async Task<CharacterBackgroundResult> GenerateBackgroundAsync(BackgroundGenerationRequest request)
    {
        var prompt = await _promptEngine.GeneratePromptAsync(new PromptRequest
        {
            Type = PromptTemplateType.CharacterBackground,
            Variables = new Dictionary<string, object>
            {
                ["character_concept"] = request.CharacterConcept?.Description ?? "Generic adventurer",
                ["race"] = request.MechanicalAspects?.Race ?? "Human",
                ["class"] = request.MechanicalAspects?.Class ?? "Fighter",
                ["background"] = request.MechanicalAspects?.Background ?? "Folk Hero",
                ["personality_traits"] = request.Personality?.PersonalityTraits ?? new List<string>(),
                ["campaign_setting"] = request.CampaignContext?.Setting ?? "Generic Fantasy",
                ["campaign_themes"] = request.CampaignContext?.Themes ?? new List<string>(),
                ["integration_level"] = request.IntegrateWithCampaign ? "High" : "Low",
                ["complexity"] = request.Complexity.ToString()
            }
        });

        var aiResponse = await _aiGateway.GenerateContentAsync(new AIRequest
        {
            UserId = Guid.Empty, // System request
            CampaignId = request.CampaignContext?.CampaignId,
            Type = AIRequestType.CharacterCreation,
            Messages = prompt.Messages,
            Parameters = new AIParameters
            {
                Temperature = 0.8f, // Higher creativity for backgrounds
                MaxTokens = GetTokensForComplexity(request.Complexity)
            }
        });

        // Parse and structure the AI response
        var background = await ParseBackgroundFromAIResponse(aiResponse.Content, request);
        
        // Enhance with campaign-specific elements
        if (request.IntegrateWithCampaign && request.CampaignContext != null)
        {
            background = await EnhanceWithCampaignElements(background, request.CampaignContext);
        }

        // Validate background consistency
        var validationResult = await ValidateBackgroundConsistency(background, request);

        return new CharacterBackgroundResult
        {
            Background = background,
            ValidationResult = validationResult,
            TokensUsed = aiResponse.Usage.TotalTokens,
            GeneratedAt = DateTime.UtcNow,
            QualityScore = CalculateBackgroundQuality(background, validationResult)
        };
    }

    public async Task<CharacterPersonalityResult> GeneratePersonalityAsync(PersonalityGenerationRequest request)
    {
        var prompt = await _promptEngine.GeneratePromptAsync(new PromptRequest
        {
            Type = PromptTemplateType.CharacterPersonality,
            Variables = new Dictionary<string, object>
            {
                ["character_concept"] = request.CharacterConcept?.Description ?? "Generic character",
                ["player_preferences"] = request.PlayerPreferences?.DesiredTraits ?? new List<string>(),
                ["avoided_traits"] = request.PlayerPreferences?.UnwantedTraits ?? new List<string>(),
                ["campaign_tone"] = request.CampaignTone?.PrimaryTone ?? "Balanced",
                ["complexity"] = request.Complexity.ToString(),
                ["creativity_level"] = request.CreativityLevel
            }
        });

        var aiResponse = await _aiGateway.GenerateContentAsync(new AIRequest
        {
            UserId = Guid.Empty,
            Type = AIRequestType.CharacterCreation,
            Messages = prompt.Messages,
            Parameters = new AIParameters
            {
                Temperature = request.CreativityLevel,
                MaxTokens = 1000
            }
        });

        var personality = await ParsePersonalityFromAIResponse(aiResponse.Content);
        
        // Apply D&D 5e personality structure
        personality = await ApplyDnDPersonalityStructure(personality);
        
        // Ensure personality coherence
        personality = await EnsurePersonalityCoherence(personality);

        return new CharacterPersonalityResult
        {
            Personality = personality,
            TokensUsed = aiResponse.Usage.TotalTokens,
            GeneratedAt = DateTime.UtcNow,
            QualityScore = CalculatePersonalityQuality(personality)
        };
    }

    public async Task<CampaignIntegrationResult> IntegrateWithCampaignAsync(CampaignIntegrationRequest request)
    {
        var result = new CampaignIntegrationResult();
        
        // Get campaign details
        var campaign = await _campaignService.GetCampaignAsync(request.CampaignId);
        var existingNPCs = await _npcService.GetCampaignNPCsAsync(request.CampaignId);
        
        // Generate NPC connections
        if (request.CreateNPCConnections)
        {
            result.NPCConnections = await GenerateNPCConnectionsAsync(new NPCConnectionRequest
            {
                Character = request.Character,
                CampaignNPCs = existingNPCs,
                ConnectionCount = DetermineConnectionCount(request.Character.Complexity)
            });
        }

        // Generate personal quest hooks
        if (request.GenerateQuestHooks)
        {
            result.QuestHooks = await GeneratePersonalQuestHooksAsync(new PersonalQuestHookRequest
            {
                Character = request.Character,
                Campaign = campaign,
                NPCConnections = result.NPCConnections,
                HookCount = DetermineQuestHookCount(request.Character.Complexity)
            });
        }

        // Generate world connections
        result.WorldConnections = await GenerateWorldConnectionsAsync(request.Character, campaign);
        
        // Generate secrets and mysteries
        result.Secrets = await GenerateCharacterSecretsAsync(request.Character, campaign);

        return result;
    }

    private async Task<CharacterConcept> GenerateCharacterConceptAsync(
        CharacterGenerationRequest request, 
        PlayerInputAnalysis analysis, 
        CampaignContext campaignContext)
    {
        var prompt = await _promptEngine.GeneratePromptAsync(new PromptRequest
        {
            Type = PromptTemplateType.CharacterConcept,
            Variables = new Dictionary<string, object>
            {
                ["player_vision"] = request.PlayerVision ?? "Open to suggestions",
                ["desired_traits"] = request.DesiredTraits,
                ["preferred_themes"] = request.PreferredThemes,
                ["campaign_setting"] = campaignContext.Setting,
                ["campaign_themes"] = campaignContext.Themes,
                ["player_experience"] = analysis.PlayerExperience,
                ["creativity_level"] = request.CreativityLevel
            }
        });

        var aiResponse = await _aiGateway.GenerateContentAsync(new AIRequest
        {
            UserId = request.UserId,
            CampaignId = request.CampaignId,
            Type = AIRequestType.CharacterCreation,
            Messages = prompt.Messages,
            Parameters = new AIParameters
            {
                Temperature = request.CreativityLevel,
                MaxTokens = 800
            }
        });

        return await ParseCharacterConceptFromAIResponse(aiResponse.Content);
    }

    private async Task<MechanicalAspects> GenerateMechanicalAspectsAsync(
        CharacterGenerationRequest request, 
        CharacterConcept concept)
    {
        var aspects = new MechanicalAspects();

        // Determine race
        aspects.Race = request.PreferredRace ?? await SuggestOptimalRace(concept, request);
        
        // Determine class
        aspects.Class = request.PreferredClass ?? await SuggestOptimalClass(concept, request);
        
        // Determine background
        aspects.Background = request.PreferredBackground ?? await SuggestOptimalBackground(concept, aspects.Class);
        
        // Generate ability scores
        aspects.AbilityScores = await GenerateAbilityScores(request.ScoreMethod, aspects.Race, aspects.Class);
        
        // Generate starting equipment
        aspects.StartingEquipment = await GenerateStartingEquipment(aspects.Class, aspects.Background);
        
        // Generate skills
        aspects.Skills = await GenerateSkills(aspects.Class, aspects.Background, concept);
        
        // Validate D&D 5e compliance
        var validationResult = await _rulesEngine.ValidateCharacterMechanicsAsync(aspects, request.Level);
        if (!validationResult.IsValid)
        {
            aspects = await AdjustMechanicsForCompliance(aspects, validationResult);
        }

        return aspects;
    }

    private async Task<string> SuggestOptimalRace(CharacterConcept concept, CharacterGenerationRequest request)
    {
        var raceAnalysis = await AnalyzeConceptForRace(concept);
        var campaignRaces = await GetAvailableRaces(request.CampaignId);
        
        // Score each race based on concept fit
        var raceScores = new Dictionary<string, float>();
        foreach (var race in campaignRaces)
        {
            var score = await CalculateRaceConceptFit(race, concept, raceAnalysis);
            raceScores[race] = score;
        }
        
        // Return the best fitting race
        return raceScores.OrderByDescending(kvp => kvp.Value).First().Key;
    }

    private async Task<CharacterBackground> ParseBackgroundFromAIResponse(string aiResponse, BackgroundGenerationRequest request)
    {
        // Use structured parsing to extract background elements
        var background = new CharacterBackground();
        
        try
        {
            // Parse using regex patterns and NLP techniques
            background.EarlyLife = ExtractSection(aiResponse, "Early Life", "Childhood");
            background.FormativeEvent = ExtractSection(aiResponse, "Formative Event", "Defining Moment");
            background.RecentHistory = ExtractSection(aiResponse, "Recent History", "Before Adventure");
            background.Family = ExtractSection(aiResponse, "Family", "Relatives");
            background.Relationships = ExtractRelationships(aiResponse);
            background.Secrets = ExtractSecrets(aiResponse);
            background.Goals = ExtractGoals(aiResponse);
            background.Fears = ExtractFears(aiResponse);
            background.Skills = ExtractSkills(aiResponse);
            background.Languages = ExtractLanguages(aiResponse);
            
            // Generate summary if not explicitly provided
            if (string.IsNullOrEmpty(background.Summary))
            {
                background.Summary = GenerateBackgroundSummary(background);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to parse structured background, using fallback parsing");
            background = await FallbackBackgroundParsing(aiResponse, request);
        }
        
        return background;
    }
}

// Supporting data models
public class CharacterGenerationResult
{
    public Guid RequestId { get; set; }
    public bool IsSuccessful { get; set; }
    public float QualityScore { get; set; }
    public DateTime GeneratedAt { get; set; }
    
    // Generated character components
    public CharacterConcept CharacterConcept { get; set; } = new();
    public MechanicalAspects MechanicalAspects { get; set; } = new();
    public CharacterPersonality Personality { get; set; } = new();
    public CharacterAppearance Appearance { get; set; } = new();
    public CharacterBackground Background { get; set; } = new();
    public CharacterMotivations Motivations { get; set; } = new();
    public CampaignIntegration CampaignIntegration { get; set; } = new();
    
    // Generation metadata
    public List<CharacterSuggestion> OptimizationSuggestions { get; set; } = new();
    public CharacterValidationResult ValidationResult { get; set; } = new();
    public int TotalTokensUsed { get; set; }
    public TimeSpan GenerationTime { get; set; }
    
    // Alternative options
    public List<CharacterConcept> AlternativeConcepts { get; set; } = new();
    public List<string> AlternativeRaces { get; set; } = new();
    public List<string> AlternativeClasses { get; set; } = new();
}

public class CharacterConcept
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string CoreTheme { get; set; } = string.Empty;
    public List<string> KeyConcepts { get; set; } = new();
    public string ArchetypeRole { get; set; } = string.Empty;
    public string PersonalityArchetype { get; set; } = string.Empty;
    public List<string> ConceptTags { get; set; } = new();
    public float ConceptStrength { get; set; } = 0.5f;
    public bool IsUnique { get; set; }
    public bool FitsCampaign { get; set; }
}

public class MechanicalAspects
{
    public string Race { get; set; } = string.Empty;
    public string Subrace { get; set; } = string.Empty;
    public string Class { get; set; } = string.Empty;
    public string Subclass { get; set; } = string.Empty;
    public string Background { get; set; } = string.Empty;
    
    public AbilityScores AbilityScores { get; set; } = new();
    public List<string> Skills { get; set; } = new();
    public List<string> Languages { get; set; } = new();
    public List<string> Proficiencies { get; set; } = new();
    public List<Equipment> StartingEquipment { get; set; } = new();
    public List<string> Spells { get; set; } = new();
    public List<string> Features { get; set; } = new();
    
    public int HitPoints { get; set; }
    public int ArmorClass { get; set; }
    public int Speed { get; set; }
    public int ProficiencyBonus { get; set; }
}

public class CharacterPersonality
{
    // D&D 5e personality structure
    public List<string> PersonalityTraits { get; set; } = new();
    public List<string> Ideals { get; set; } = new();
    public List<string> Bonds { get; set; } = new();
    public List<string> Flaws { get; set; } = new();
    
    // Extended personality aspects
    public string CorePersonality { get; set; } = string.Empty;
    public List<string> Quirks { get; set; } = new();
    public List<string> Mannerisms { get; set; } = new();
    public string SpeechPattern { get; set; } = string.Empty;
    public string EmotionalTendency { get; set; } = string.Empty;
    public string SocialStyle { get; set; } = string.Empty;
    
    // Psychological profile
    public float Confidence { get; set; } = 0.5f;
    public float Empathy { get; set; } = 0.5f;
    public float Impulsiveness { get; set; } = 0.5f;
    public float Curiosity { get; set; } = 0.5f;
    public float Loyalty { get; set; } = 0.5f;
    public float Ambition { get; set; } = 0.5f;
    
    // Behavioral patterns
    public string ConflictResolution { get; set; } = string.Empty;
    public string LeadershipStyle { get; set; } = string.Empty;
    public string StressResponse { get; set; } = string.Empty;
    public string MotivationalDrive { get; set; } = string.Empty;
}

public class CharacterBackground
{
    public string Summary { get; set; } = string.Empty;
    public string EarlyLife { get; set; } = string.Empty;
    public string FormativeEvent { get; set; } = string.Empty;
    public string RecentHistory { get; set; } = string.Empty;
    
    // Relationships
    public string Family { get; set; } = string.Empty;
    public List<ImportantRelationship> Relationships { get; set; } = new();
    public List<string> Allies { get; set; } = new();
    public List<string> Enemies { get; set; } = new();
    
    // Character development
    public List<string> Goals { get; set; } = new();
    public List<string> Fears { get; set; } = new();
    public List<string> Secrets { get; set; } = new();
    public List<string> Regrets { get; set; } = new();
    public List<string> Achievements { get; set; } = new();
    
    // Skills and knowledge
    public List<string> Skills { get; set; } = new();
    public List<string> Languages { get; set; } = new();
    public List<string> KnowledgeAreas { get; set; } = new();
    public List<string> Connections { get; set; } = new();
    
    // Campaign integration
    public List<string> CampaignConnections { get; set; } = new();
    public List<string> LocalReputation { get; set; } = new();
    public string HomeTown { get; set; } = string.Empty;
}

public class CharacterMotivations
{
    public string PrimaryMotivation { get; set; } = string.Empty;
    public List<string> SecondaryMotivations { get; set; } = new();
    public string LongTermGoal { get; set; } = string.Empty;
    public List<string> ShortTermGoals { get; set; } = new();
    public string PersonalQuest { get; set; } = string.Empty;
    public string WhatDrivesYou { get; set; } = string.Empty;
    public string GreatestFear { get; set; } = string.Empty;
    public string GreatestDesire { get; set; } = string.Empty;
    public List<string> ValuesAndBeliefs { get; set; } = new();
    public string MoralCode { get; set; } = string.Empty;
}

public class CampaignIntegration
{
    public List<NPCConnection> NPCConnections { get; set; } = new();
    public List<QuestHook> QuestHooks { get; set; } = new();
    public List<WorldConnection> WorldConnections { get; set; } = new();
    public List<string> Secrets { get; set; } = new();
    public List<string> Rumors { get; set; } = new();
    public string LocalReputation { get; set; } = string.Empty;
    public List<string> ImportantLocations { get; set; } = new();
    public List<string> Organizations { get; set; } = new();
}

public class NPCConnection
{
    public Guid? NPCId { get; set; }
    public string NPCName { get; set; } = string.Empty;
    public string RelationshipType { get; set; } = string.Empty;
    public string RelationshipDescription { get; set; } = string.Empty;
    public string History { get; set; } = string.Empty;
    public string CurrentStatus { get; set; } = string.Empty;
    public float RelationshipStrength { get; set; } = 0.5f;
    public bool IsPositive { get; set; } = true;
    public List<string> SharedSecrets { get; set; } = new();
    public string PotentialPlotHook { get; set; } = string.Empty;
}

public class QuestHook
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string PersonalConnection { get; set; } = string.Empty;
    public QuestType Type { get; set; }
    public QuestUrgency Urgency { get; set; }
    public List<string> RequiredSkills { get; set; } = new();
    public List<string> PotentialRewards { get; set; } = new();
    public List<string> RelatedNPCs { get; set; } = new();
    public string TriggerCondition { get; set; } = string.Empty;
}

public enum QuestType
{
    Personal,
    Family,
    Revenge,
    Redemption,
    Discovery,
    Protection,
    Achievement,
    Mystery,
    Romance,
    Duty
}

public enum QuestUrgency
{
    Immediate,
    Soon,
    Eventual,
    Ongoing,
    Conditional
}
```

This comprehensive character generation system provides AI-assisted character creation that maintains player agency while offering intelligent suggestions, D&D 5e compliance, rich backgrounds, and seamless campaign integration.
