# AI World Building & Quest Generation System

## Overview
This document defines the comprehensive AI-powered world building and quest generation system that creates immersive campaign worlds, dynamic locations, engaging quests, rich lore, and interconnected storylines that adapt to player actions and maintain narrative consistency.

---

## World Building AI Architecture

### **World Generation Pipeline**
```
┌─────────────────────────────────────────────────────────────────┐
│                    World Building Request                       │
└─────────────────────────────────────────────────────────────────┘
                                │
                    ┌───────────────────────┐
                    │   Campaign Context    │
                    │   Analysis            │
                    │ (Theme, Tone, Scale,  │
                    │  Player Preferences)  │
                    └───────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
┌───────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   World       │    │   Location      │    │   Quest         │
│   Foundation  │    │   Generation    │    │   Generation    │
│  (Geography,  │    │ (Cities, Dungeons, │  │ (Hooks, NPCs,  │
│   History)    │    │  Wilderness)    │    │  Objectives)    │
└───────────────┘    └─────────────────┘    └─────────────────┘
        │                       │                       │
        └───────────────────────┼───────────────────────┘
                                │
                    ┌───────────────────────┐
                    │   Narrative           │
                    │   Integration         │
                    │  (Lore, Connections,  │
                    │   Plot Threads)       │
                    └───────────────────────┘
                                │
                    ┌───────────────────────┐
                    │   Dynamic             │
                    │   Adaptation          │
                    │  (Player Response,    │
                    │   World Evolution)    │
                    └───────────────────────┘
```

### **Core World Building Interface**
```csharp
public interface IWorldBuildingService
{
    // World Creation
    Task<WorldGenerationResult> GenerateWorldAsync(WorldGenerationRequest request);
    Task<RegionGenerationResult> GenerateRegionAsync(RegionGenerationRequest request);
    Task<SettlementGenerationResult> GenerateSettlementAsync(SettlementGenerationRequest request);
    Task<DungeonGenerationResult> GenerateDungeonAsync(DungeonGenerationRequest request);
    
    // Location Details
    Task<LocationDetailResult> GenerateLocationDetailsAsync(LocationDetailRequest request);
    Task<EstablishmentResult> GenerateEstablishmentAsync(EstablishmentRequest request);
    Task<WildernessAreaResult> GenerateWildernessAreaAsync(WildernessAreaRequest request);
    
    // Quest Generation
    Task<QuestGenerationResult> GenerateQuestAsync(QuestGenerationRequest request);
    Task<QuestChainResult> GenerateQuestChainAsync(QuestChainRequest request);
    Task<List<QuestHook>> GenerateQuestHooksAsync(QuestHookRequest request);
    Task<SideQuestResult> GenerateSideQuestAsync(SideQuestRequest request);
    
    // Lore and History
    Task<LoreGenerationResult> GenerateLoreAsync(LoreGenerationRequest request);
    Task<HistoryGenerationResult> GenerateHistoryAsync(HistoryGenerationRequest request);
    Task<CultureGenerationResult> GenerateCultureAsync(CultureGenerationRequest request);
    Task<ReligionGenerationResult> GenerateReligionAsync(ReligionGenerationRequest request);
    
    // Dynamic Systems
    Task<EventGenerationResult> GenerateRandomEventAsync(EventGenerationRequest request);
    Task<RumorGenerationResult> GenerateRumorsAsync(RumorGenerationRequest request);
    Task<ConsequenceResult> GenerateConsequencesAsync(ConsequenceRequest request);
    Task<WorldEvolutionResult> EvolveWorldAsync(WorldEvolutionRequest request);
    
    // Integration and Validation
    Task<WorldConsistencyResult> ValidateWorldConsistencyAsync(Guid campaignId);
    Task<NarrativeIntegrationResult> IntegrateNarrativeElementsAsync(NarrativeIntegrationRequest request);
    Task<List<WorldSuggestion>> GetWorldExpansionSuggestionsAsync(Guid campaignId);
}

public enum WorldScale
{
    Village,      // Single settlement and surroundings
    Region,       // Multiple settlements, local area
    Kingdom,      // Large political entity
    Continent,    // Multiple kingdoms/regions
    World,        // Entire world/plane
    Multiverse    // Multiple planes/worlds
}

public enum WorldTone
{
    Heroic,       // Classic heroic fantasy
    Dark,         // Gritty, dangerous world
    Whimsical,    // Light-hearted, magical
    Realistic,    // Grounded, political
    Epic,         // Grand scale, legendary
    Horror,       // Dark, terrifying elements
    Mystery,      // Intrigue and secrets
    Adventure     // Exploration focused
}

public enum QuestComplexity
{
    Simple,       // Single objective, clear path
    Standard,     // Multiple steps, some choices
    Complex,      // Branching paths, multiple solutions
    Epic          // Campaign-spanning, world-changing
}

public class WorldGenerationRequest
{
    public Guid CampaignId { get; set; }
    public Guid RequestedBy { get; set; }
    
    // World parameters
    public string? WorldName { get; set; }
    public WorldScale Scale { get; set; } = WorldScale.Region;
    public WorldTone Tone { get; set; } = WorldTone.Heroic;
    public string? Theme { get; set; }
    public List<string> RequiredElements { get; set; } = new();
    public List<string> ForbiddenElements { get; set; } = new();
    
    // Generation preferences
    public float CreativityLevel { get; set; } = 0.7f;
    public float RealismLevel { get; set; } = 0.5f;
    public float MagicLevel { get; set; } = 0.6f;
    public float TechnologyLevel { get; set; } = 0.3f;
    public float PoliticalComplexity { get; set; } = 0.5f;
    
    // Player integration
    public List<Guid> PlayerCharacterIds { get; set; } = new();
    public bool IntegrateCharacterBackgrounds { get; set; } = true;
    public bool CreatePersonalQuestHooks { get; set; } = true;
    
    // Content specifications
    public int DesiredSettlementCount { get; set; } = 5;
    public int DesiredDungeonCount { get; set; } = 3;
    public int DesiredQuestCount { get; set; } = 10;
    public bool GenerateHistory { get; set; } = true;
    public bool GenerateCultures { get; set; } = true;
    public bool GenerateReligions { get; set; } = true;
    
    public SubscriptionTier UserTier { get; set; }
    public WorldGenerationComplexity Complexity { get; set; } = WorldGenerationComplexity.Standard;
}

public enum WorldGenerationComplexity
{
    Basic,        // Simple world with minimal detail
    Standard,     // Good detail level for most campaigns
    Detailed,     // Rich world with extensive lore
    Masterwork    // Extremely detailed world-building
}
```

### **World Building Service Implementation**
```csharp
public class WorldBuildingService : IWorldBuildingService
{
    private readonly IAIGatewayService _aiGateway;
    private readonly IPromptEngine _promptEngine;
    private readonly IWorldRepository _worldRepository;
    private readonly IQuestRepository _questRepository;
    private readonly ICharacterService _characterService;
    private readonly IWorldConsistencyValidator _consistencyValidator;
    private readonly INameGenerator _nameGenerator;
    private readonly ILogger<WorldBuildingService> _logger;

    public async Task<WorldGenerationResult> GenerateWorldAsync(WorldGenerationRequest request)
    {
        _logger.LogInformation("Starting world generation for campaign {CampaignId} with scale {Scale}", 
            request.CampaignId, request.Scale);

        try
        {
            var result = new WorldGenerationResult
            {
                RequestId = Guid.NewGuid(),
                GeneratedAt = DateTime.UtcNow
            };

            // Step 1: Generate world foundation
            var worldFoundation = await GenerateWorldFoundationAsync(request);
            result.WorldFoundation = worldFoundation;

            // Step 2: Generate geography and regions
            var geography = await GenerateGeographyAsync(request, worldFoundation);
            result.Geography = geography;

            // Step 3: Generate history and timeline
            if (request.GenerateHistory)
            {
                var history = await GenerateHistoryAsync(new HistoryGenerationRequest
                {
                    WorldFoundation = worldFoundation,
                    Geography = geography,
                    Complexity = request.Complexity,
                    TimeDepth = GetHistoryDepthForScale(request.Scale)
                });
                result.History = history.History;
            }

            // Step 4: Generate cultures and societies
            if (request.GenerateCultures)
            {
                var cultures = await GenerateCulturesAsync(request, worldFoundation, geography);
                result.Cultures = cultures;
            }

            // Step 5: Generate religions and pantheons
            if (request.GenerateReligions)
            {
                var religions = await GenerateReligionsAsync(request, worldFoundation, result.Cultures);
                result.Religions = religions;
            }

            // Step 6: Generate settlements
            var settlements = await GenerateSettlementsAsync(request, worldFoundation, geography, result.Cultures);
            result.Settlements = settlements;

            // Step 7: Generate dungeons and points of interest
            var dungeons = await GenerateDungeonsAsync(request, geography, result.History);
            result.Dungeons = dungeons;

            // Step 8: Generate initial quests
            var quests = await GenerateInitialQuestsAsync(request, result);
            result.Quests = quests;

            // Step 9: Character background integration
            if (request.IntegrateCharacterBackgrounds && request.PlayerCharacterIds.Any())
            {
                var integration = await IntegrateCharacterBackgroundsAsync(request.PlayerCharacterIds, result);
                result.CharacterIntegration = integration;
            }

            // Step 10: Generate interconnections and plot threads
            var connections = await GenerateWorldConnectionsAsync(result);
            result.Connections = connections;

            // Step 11: Validate consistency
            var consistencyResult = await _consistencyValidator.ValidateWorldAsync(result);
            result.ConsistencyValidation = consistencyResult;

            // Step 12: Store world data
            await _worldRepository.SaveWorldAsync(request.CampaignId, result);

            result.IsSuccessful = true;
            result.QualityScore = CalculateWorldQuality(result);

            _logger.LogInformation("World generation completed successfully for campaign {CampaignId}", 
                request.CampaignId);

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "World generation failed for campaign {CampaignId}", request.CampaignId);
            throw;
        }
    }

    public async Task<QuestGenerationResult> GenerateQuestAsync(QuestGenerationRequest request)
    {
        var prompt = await _promptEngine.GeneratePromptAsync(new PromptRequest
        {
            Type = PromptTemplateType.QuestGeneration,
            Variables = new Dictionary<string, object>
            {
                ["quest_type"] = request.QuestType.ToString(),
                ["complexity"] = request.Complexity.ToString(),
                ["party_level"] = request.PartyLevel,
                ["party_size"] = request.PartySize,
                ["campaign_context"] = request.CampaignContext,
                ["world_context"] = request.WorldContext,
                ["available_npcs"] = request.AvailableNPCs,
                ["available_locations"] = request.AvailableLocations,
                ["player_preferences"] = request.PlayerPreferences,
                ["forbidden_elements"] = request.ForbiddenElements,
                ["required_skills"] = request.RequiredSkills,
                ["estimated_duration"] = request.EstimatedDuration
            }
        });

        var aiResponse = await _aiGateway.GenerateContentAsync(new AIRequest
        {
            UserId = request.RequestedBy,
            CampaignId = request.CampaignId,
            Type = AIRequestType.QuestGeneration,
            Messages = prompt.Messages,
            Parameters = new AIParameters
            {
                Temperature = 0.8f, // Higher creativity for quest generation
                MaxTokens = GetTokensForQuestComplexity(request.Complexity)
            }
        });

        // Parse and structure the quest
        var quest = await ParseQuestFromAIResponse(aiResponse.Content, request);
        
        // Validate quest balance and feasibility
        var validation = await ValidateQuestBalance(quest, request);
        
        // Generate supporting elements
        var supportingElements = await GenerateQuestSupportingElements(quest, request);

        return new QuestGenerationResult
        {
            Quest = quest,
            SupportingElements = supportingElements,
            ValidationResult = validation,
            TokensUsed = aiResponse.Usage.TotalTokens,
            GeneratedAt = DateTime.UtcNow,
            QualityScore = CalculateQuestQuality(quest, validation)
        };
    }

    public async Task<SettlementGenerationResult> GenerateSettlementAsync(SettlementGenerationRequest request)
    {
        var prompt = await _promptEngine.GeneratePromptAsync(new PromptRequest
        {
            Type = PromptTemplateType.SettlementGeneration,
            Variables = new Dictionary<string, object>
            {
                ["settlement_type"] = request.SettlementType.ToString(),
                ["size"] = request.Size.ToString(),
                ["population"] = request.Population,
                ["primary_industry"] = request.PrimaryIndustry ?? "Mixed",
                ["government_type"] = request.GovernmentType ?? "Council",
                ["culture_context"] = request.CultureContext,
                ["geography_context"] = request.GeographyContext,
                ["history_context"] = request.HistoryContext,
                ["trade_routes"] = request.TradeRoutes,
                ["threats"] = request.Threats,
                ["notable_features"] = request.NotableFeatures,
                ["complexity"] = request.Complexity.ToString()
            }
        });

        var aiResponse = await _aiGateway.GenerateContentAsync(new AIRequest
        {
            UserId = request.RequestedBy,
            CampaignId = request.CampaignId,
            Type = AIRequestType.WorldBuilding,
            Messages = prompt.Messages,
            Parameters = new AIParameters
            {
                Temperature = 0.75f,
                MaxTokens = GetTokensForSettlementComplexity(request.Complexity)
            }
        });

        // Parse settlement data
        var settlement = await ParseSettlementFromAIResponse(aiResponse.Content, request);
        
        // Generate NPCs for the settlement
        var npcs = await GenerateSettlementNPCsAsync(settlement, request);
        settlement.NotableNPCs = npcs;
        
        // Generate establishments
        var establishments = await GenerateEstablishmentsAsync(settlement, request);
        settlement.Establishments = establishments;
        
        // Generate local rumors and plot hooks
        var rumors = await GenerateSettlementRumorsAsync(settlement, request);
        settlement.Rumors = rumors;

        return new SettlementGenerationResult
        {
            Settlement = settlement,
            TokensUsed = aiResponse.Usage.TotalTokens,
            GeneratedAt = DateTime.UtcNow,
            QualityScore = CalculateSettlementQuality(settlement)
        };
    }

    private async Task<WorldFoundation> GenerateWorldFoundationAsync(WorldGenerationRequest request)
    {
        var prompt = await _promptEngine.GeneratePromptAsync(new PromptRequest
        {
            Type = PromptTemplateType.WorldFoundation,
            Variables = new Dictionary<string, object>
            {
                ["world_name"] = request.WorldName ?? "Generate a name",
                ["scale"] = request.Scale.ToString(),
                ["tone"] = request.Tone.ToString(),
                ["theme"] = request.Theme ?? "Fantasy adventure",
                ["required_elements"] = request.RequiredElements,
                ["forbidden_elements"] = request.ForbiddenElements,
                ["creativity_level"] = request.CreativityLevel,
                ["realism_level"] = request.RealismLevel,
                ["magic_level"] = request.MagicLevel,
                ["technology_level"] = request.TechnologyLevel,
                ["political_complexity"] = request.PoliticalComplexity
            }
        });

        var aiResponse = await _aiGateway.GenerateContentAsync(new AIRequest
        {
            UserId = request.RequestedBy,
            CampaignId = request.CampaignId,
            Type = AIRequestType.WorldBuilding,
            Messages = prompt.Messages,
            Parameters = new AIParameters
            {
                Temperature = request.CreativityLevel,
                MaxTokens = 1500
            }
        });

        return await ParseWorldFoundationFromAIResponse(aiResponse.Content, request);
    }

    private async Task<List<Quest>> GenerateInitialQuestsAsync(WorldGenerationRequest request, WorldGenerationResult worldResult)
    {
        var quests = new List<Quest>();
        var questCount = Math.Min(request.DesiredQuestCount, GetMaxQuestsForTier(request.UserTier));
        
        // Generate main campaign quest
        var mainQuest = await GenerateMainCampaignQuestAsync(request, worldResult);
        quests.Add(mainQuest);
        
        // Generate side quests
        var sideQuestCount = Math.Max(0, questCount - 1);
        for (int i = 0; i < sideQuestCount; i++)
        {
            var questType = DetermineQuestType(i, sideQuestCount, worldResult);
            var sideQuest = await GenerateSideQuestAsync(request, worldResult, questType);
            quests.Add(sideQuest);
        }
        
        // Generate personal character quests if requested
        if (request.CreatePersonalQuestHooks && request.PlayerCharacterIds.Any())
        {
            foreach (var characterId in request.PlayerCharacterIds)
            {
                var personalQuest = await GeneratePersonalQuestAsync(characterId, worldResult);
                quests.Add(personalQuest);
            }
        }
        
        return quests;
    }

    private async Task<Quest> ParseQuestFromAIResponse(string aiResponse, QuestGenerationRequest request)
    {
        var quest = new Quest
        {
            Id = Guid.NewGuid(),
            CampaignId = request.CampaignId,
            Type = request.QuestType,
            Complexity = request.Complexity,
            PartyLevel = request.PartyLevel,
            GeneratedAt = DateTime.UtcNow
        };

        try
        {
            // Parse structured quest elements
            quest.Title = ExtractQuestTitle(aiResponse);
            quest.Summary = ExtractQuestSummary(aiResponse);
            quest.Description = ExtractQuestDescription(aiResponse);
            quest.Objectives = ExtractQuestObjectives(aiResponse);
            quest.Rewards = ExtractQuestRewards(aiResponse);
            quest.Prerequisites = ExtractQuestPrerequisites(aiResponse);
            quest.Complications = ExtractQuestComplications(aiResponse);
            quest.NPCs = ExtractQuestNPCs(aiResponse);
            quest.Locations = ExtractQuestLocations(aiResponse);
            quest.EstimatedDuration = ExtractEstimatedDuration(aiResponse);
            quest.DifficultyRating = CalculateQuestDifficulty(quest, request);
            
            // Generate quest structure
            quest.Phases = await GenerateQuestPhasesAsync(quest, request);
            quest.AlternativeSolutions = await GenerateAlternativeSolutionsAsync(quest, request);
            quest.PotentialConsequences = await GenerateQuestConsequencesAsync(quest, request);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to parse structured quest, using fallback parsing");
            quest = await FallbackQuestParsing(aiResponse, request);
        }
        
        return quest;
    }

    private async Task<List<QuestPhase>> GenerateQuestPhasesAsync(Quest quest, QuestGenerationRequest request)
    {
        var phases = new List<QuestPhase>();
        
        switch (quest.Complexity)
        {
            case QuestComplexity.Simple:
                phases.Add(new QuestPhase
                {
                    Name = "Complete Objective",
                    Description = quest.Objectives.FirstOrDefault()?.Description ?? "Complete the quest",
                    RequiredActions = new List<string> { "Achieve primary objective" },
                    Challenges = await GeneratePhaseChallengesAsync(quest, request, 1)
                });
                break;
                
            case QuestComplexity.Standard:
                phases.AddRange(await GenerateStandardQuestPhasesAsync(quest, request));
                break;
                
            case QuestComplexity.Complex:
                phases.AddRange(await GenerateComplexQuestPhasesAsync(quest, request));
                break;
                
            case QuestComplexity.Epic:
                phases.AddRange(await GenerateEpicQuestPhasesAsync(quest, request));
                break;
        }
        
        return phases;
    }

    private int GetMaxQuestsForTier(SubscriptionTier tier)
    {
        return tier switch
        {
            SubscriptionTier.Free => 3,
            SubscriptionTier.DungeonArchitect => 8,
            SubscriptionTier.CampaignWeaver => 15,
            SubscriptionTier.GuildMaster => 25,
            _ => 5
        };
    }

    private int GetTokensForQuestComplexity(QuestComplexity complexity)
    {
        return complexity switch
        {
            QuestComplexity.Simple => 800,
            QuestComplexity.Standard => 1500,
            QuestComplexity.Complex => 2500,
            QuestComplexity.Epic => 4000,
            _ => 1500
        };
    }
}

// Supporting data models
public class WorldGenerationResult
{
    public Guid RequestId { get; set; }
    public bool IsSuccessful { get; set; }
    public float QualityScore { get; set; }
    public DateTime GeneratedAt { get; set; }
    
    // World components
    public WorldFoundation WorldFoundation { get; set; } = new();
    public WorldGeography Geography { get; set; } = new();
    public WorldHistory History { get; set; } = new();
    public List<Culture> Cultures { get; set; } = new();
    public List<Religion> Religions { get; set; } = new();
    public List<Settlement> Settlements { get; set; } = new();
    public List<Dungeon> Dungeons { get; set; } = new();
    public List<Quest> Quests { get; set; } = new();
    
    // Integration and connections
    public CharacterBackgroundIntegration CharacterIntegration { get; set; } = new();
    public WorldConnections Connections { get; set; } = new();
    public WorldConsistencyValidation ConsistencyValidation { get; set; } = new();
    
    // Generation metadata
    public int TotalTokensUsed { get; set; }
    public TimeSpan GenerationTime { get; set; }
    public List<string> GenerationWarnings { get; set; } = new();
}

public class WorldFoundation
{
    public string Name { get; set; } = string.Empty;
    public string CoreConcept { get; set; } = string.Empty;
    public string PrimaryTheme { get; set; } = string.Empty;
    public WorldTone Tone { get; set; }
    public WorldScale Scale { get; set; }
    
    // World characteristics
    public float MagicLevel { get; set; } = 0.6f;
    public float TechnologyLevel { get; set; } = 0.3f;
    public float PoliticalComplexity { get; set; } = 0.5f;
    public float DangerLevel { get; set; } = 0.5f;
    
    // Core elements
    public List<string> DefiningFeatures { get; set; } = new();
    public List<string> UniqueElements { get; set; } = new();
    public List<string> CentralConflicts { get; set; } = new();
    public List<string> MajorThemes { get; set; } = new();
    
    // Cosmological details
    public string CosmologyType { get; set; } = "Standard D&D";
    public List<Plane> ConnectedPlanes { get; set; } = new();
    public string MagicSystem { get; set; } = "Standard D&D Magic";
    public List<string> GodsAndDeities { get; set; } = new();
}

public class Quest
{
    public Guid Id { get; set; }
    public Guid CampaignId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Summary { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    
    // Quest properties
    public QuestType Type { get; set; }
    public QuestComplexity Complexity { get; set; }
    public int PartyLevel { get; set; }
    public int DifficultyRating { get; set; }
    public TimeSpan EstimatedDuration { get; set; }
    
    // Quest structure
    public List<QuestObjective> Objectives { get; set; } = new();
    public List<QuestPhase> Phases { get; set; } = new();
    public List<string> Prerequisites { get; set; } = new();
    public List<string> Complications { get; set; } = new();
    
    // Quest elements
    public List<QuestNPC> NPCs { get; set; } = new();
    public List<QuestLocation> Locations { get; set; } = new();
    public List<QuestReward> Rewards { get; set; } = new();
    public List<QuestItem> RequiredItems { get; set; } = new();
    
    // Narrative elements
    public List<string> AlternativeSolutions { get; set; } = new();
    public List<string> PotentialConsequences { get; set; } = new();
    public List<string> PlotTwists { get; set; } = new();
    public List<string> Themes { get; set; } = new();
    
    // Generation metadata
    public DateTime GeneratedAt { get; set; }
    public bool IsPersonalQuest { get; set; }
    public Guid? RelatedCharacterId { get; set; }
    public float QualityScore { get; set; }
}

public class Settlement
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public SettlementType Type { get; set; }
    public SettlementSize Size { get; set; }
    public int Population { get; set; }
    
    // Location and geography
    public string Location { get; set; } = string.Empty;
    public string GeographicFeatures { get; set; } = string.Empty;
    public string Climate { get; set; } = string.Empty;
    public List<string> NaturalResources { get; set; } = new();
    
    // Government and society
    public string GovernmentType { get; set; } = string.Empty;
    public string Leader { get; set; } = string.Empty;
    public string PrimaryIndustry { get; set; } = string.Empty;
    public List<string> TradeGoods { get; set; } = new();
    public string Culture { get; set; } = string.Empty;
    
    // Notable features
    public List<Establishment> Establishments { get; set; } = new();
    public List<SettlementNPC> NotableNPCs { get; set; } = new();
    public List<string> NotableBuildings { get; set; } = new();
    public List<string> Landmarks { get; set; } = new();
    
    // Adventure elements
    public List<string> Rumors { get; set; } = new();
    public List<string> LocalProblems { get; set; } = new();
    public List<string> Opportunities { get; set; } = new();
    public List<string> Secrets { get; set; } = new();
    
    // Connections
    public List<string> TradeRoutes { get; set; } = new();
    public List<string> AlliedSettlements { get; set; } = new();
    public List<string> RivalSettlements { get; set; } = new();
    public List<string> Threats { get; set; } = new();
}

public enum SettlementType
{
    Village,
    Town,
    City,
    Metropolis,
    Outpost,
    Fort,
    TradingPost,
    Port,
    Capital,
    Ruins
}

public enum SettlementSize
{
    Hamlet,      // < 100
    Village,     // 100-1000
    Town,        // 1000-5000
    City,        // 5000-25000
    Metropolis   // > 25000
}

public class QuestObjective
{
    public string Description { get; set; } = string.Empty;
    public bool IsRequired { get; set; } = true;
    public bool IsCompleted { get; set; } = false;
    public List<string> CompletionCriteria { get; set; } = new();
    public List<string> Hints { get; set; } = new();
    public int Priority { get; set; } = 1;
}

public class QuestPhase
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public List<string> RequiredActions { get; set; } = new();
    public List<QuestChallenge> Challenges { get; set; } = new();
    public List<string> PossibleOutcomes { get; set; } = new();
    public bool IsOptional { get; set; } = false;
}

public class QuestChallenge
{
    public string Type { get; set; } = string.Empty; // Combat, Social, Exploration, Puzzle
    public string Description { get; set; } = string.Empty;
    public int DifficultyClass { get; set; }
    public List<string> RequiredSkills { get; set; } = new();
    public List<string> AlternativeApproaches { get; set; } = new();
    public string SuccessOutcome { get; set; } = string.Empty;
    public string FailureOutcome { get; set; } = string.Empty;
}

public enum QuestType
{
    MainStory,
    SideQuest,
    Personal,
    Fetch,
    Escort,
    Kill,
    Rescue,
    Investigate,
    Explore,
    Social,
    Puzzle,
    Survival,
    Heist,
    Mystery,
    Romance,
    Revenge
}
```

This comprehensive world building system creates rich, interconnected campaign worlds with dynamic quests, detailed locations, and narrative elements that adapt to player actions while maintaining consistency and providing endless adventure possibilities.
