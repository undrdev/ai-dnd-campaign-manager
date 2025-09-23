# Content Generation Business Logic

## Overview
This document defines the comprehensive business logic for AI-powered content generation within the D&D AI Campaign Management System. It covers dynamic world building, quest generation, NPC creation, encounter design, treasure generation, and the orchestration of creative content that enhances the D&D experience while maintaining consistency with campaign lore and D&D 5e rules.

## Domain Model

### Content Generation Engine
```csharp
public class ContentGenerationEngine : IDomainService
{
    private readonly IAIProviderOrchestrator _providerOrchestrator;
    private readonly IContentTemplateRepository _templateRepository;
    private readonly IContentValidationService _validationService;
    private readonly IContentEnhancementService _enhancementService;
    private readonly IContentRepository _contentRepository;
    private readonly IUsageTracker _usageTracker;

    public async Task<Result<GeneratedContent>> GenerateContentAsync(ContentGenerationRequest request)
    {
        // Validate request
        var validationResult = await ValidateGenerationRequestAsync(request);
        if (validationResult.IsFailure)
        {
            return Result.Failure<GeneratedContent>(validationResult.Error);
        }

        // Build generation context
        var context = await BuildGenerationContextAsync(request);

        // Select content template if applicable
        var template = await SelectContentTemplateAsync(request.ContentType, context);

        // Generate base content
        var baseContentResult = await GenerateBaseContentAsync(request, context, template);
        if (baseContentResult.IsFailure)
        {
            return Result.Failure<GeneratedContent>(baseContentResult.Error);
        }

        // Enhance content based on quality requirements
        var enhancedContent = await EnhanceContentAsync(baseContentResult.Value, request.QualityLevel);

        // Validate and filter content
        var validatedContent = await _validationService.ValidateContentAsync(enhancedContent, request);
        if (validatedContent.IsFailure)
        {
            return Result.Failure<GeneratedContent>(validatedContent.Error);
        }

        // Store generated content
        await _contentRepository.StoreGeneratedContentAsync(validatedContent.Value);

        // Track usage
        await _usageTracker.TrackGenerationAsync(request, validatedContent.Value);

        return Result.Success(validatedContent.Value);
    }

    private async Task<Result<GeneratedContent>> GenerateBaseContentAsync(
        ContentGenerationRequest request,
        GenerationContext context,
        ContentTemplate? template)
    {
        // Select AI provider based on content type
        var provider = await _providerOrchestrator.SelectProviderAsync(request.ContentType, context);

        // Build generation prompt
        var prompt = await BuildGenerationPromptAsync(request, context, template);

        // Generate content
        var generationResult = await provider.GenerateContentAsync(prompt, context);
        if (generationResult.IsFailure)
        {
            return Result.Failure<GeneratedContent>(generationResult.Error);
        }

        // Parse and structure content
        var structuredContent = await ParseGeneratedContentAsync(generationResult.Value, request.ContentType);

        return Result.Success(structuredContent);
    }
}

public class ContentGenerationRequest
{
    public string RequestId { get; set; } = Guid.NewGuid().ToString();
    public ContentType ContentType { get; set; }
    public string CampaignId { get; set; }
    public string UserId { get; set; }
    public GenerationParameters Parameters { get; set; } = new();
    public ContentQuality QualityLevel { get; set; } = ContentQuality.Standard;
    public List<ContentConstraint> Constraints { get; set; } = new();
    public Dictionary<string, object> CustomData { get; set; } = new();
    public bool UseTemplate { get; set; } = true;
    public string? TemplateId { get; set; }
    public List<string> Tags { get; set; } = new();
}

public class GenerationParameters
{
    public int? PartyLevel { get; set; }
    public int? PartySize { get; set; }
    public DifficultyLevel? Difficulty { get; set; }
    public string? Theme { get; set; }
    public string? Tone { get; set; }
    public List<string> RequiredElements { get; set; } = new();
    public List<string> ExcludedElements { get; set; } = new();
    public Dictionary<string, object> CustomParameters { get; set; } = new();
}

public enum ContentType
{
    Quest,
    Location,
    NPC,
    Encounter,
    Treasure,
    MagicItem,
    Trap,
    Puzzle,
    Organization,
    Religion,
    Culture,
    History,
    Legend,
    Prophecy,
    Event,
    Plot,
    Subplot,
    Hook,
    Rumor,
    News
}

public enum DifficultyLevel
{
    Trivial,
    Easy,
    Medium,
    Hard,
    Deadly,
    Legendary
}
```

## Quest Generation System

### Quest Generator
```csharp
public class QuestGenerator : IDomainService
{
    private readonly IAIContentService _aiContentService;
    private readonly IQuestTemplateRepository _questTemplateRepository;
    private readonly ILocationRepository _locationRepository;
    private readonly INPCRepository _npcRepository;

    public async Task<Result<Quest>> GenerateQuestAsync(QuestGenerationRequest request)
    {
        // Build quest context
        var context = await BuildQuestContextAsync(request);

        // Generate quest structure
        var questStructure = await GenerateQuestStructureAsync(request, context);
        if (questStructure.IsFailure)
        {
            return Result.Failure<Quest>(questStructure.Error);
        }

        // Generate quest details
        var questDetails = await GenerateQuestDetailsAsync(questStructure.Value, request, context);
        if (questDetails.IsFailure)
        {
            return Result.Failure<Quest>(questDetails.Error);
        }

        // Create quest entity
        var quest = Quest.Create(
            campaignId: request.CampaignId,
            title: questDetails.Value.Title,
            description: questDetails.Value.Description,
            questType: questDetails.Value.Type,
            difficulty: request.Difficulty,
            estimatedDuration: questDetails.Value.EstimatedDuration
        );

        // Set quest structure
        quest.SetStructure(questStructure.Value);

        // Add quest objectives
        foreach (var objective in questDetails.Value.Objectives)
        {
            quest.AddObjective(objective);
        }

        // Add quest rewards
        foreach (var reward in questDetails.Value.Rewards)
        {
            quest.AddReward(reward);
        }

        // Generate related NPCs if needed
        if (request.GenerateNPCs)
        {
            var npcsResult = await GenerateQuestNPCsAsync(quest, context);
            if (npcsResult.IsSuccess)
            {
                quest.SetRelatedNPCs(npcsResult.Value);
            }
        }

        // Generate quest locations if needed
        if (request.GenerateLocations)
        {
            var locationsResult = await GenerateQuestLocationsAsync(quest, context);
            if (locationsResult.IsSuccess)
            {
                quest.SetRelatedLocations(locationsResult.Value);
            }
        }

        return Result.Success(quest);
    }

    private async Task<Result<QuestStructure>> GenerateQuestStructureAsync(
        QuestGenerationRequest request, 
        QuestGenerationContext context)
    {
        var structureRequest = new ContentGenerationRequest
        {
            ContentType = ContentType.Quest,
            CampaignId = request.CampaignId,
            UserId = request.UserId,
            Parameters = new GenerationParameters
            {
                PartyLevel = request.PartyLevel,
                PartySize = request.PartySize,
                Difficulty = request.Difficulty,
                Theme = request.Theme,
                RequiredElements = request.RequiredElements,
                ExcludedElements = request.ExcludedElements
            }
        };

        var aiContext = await BuildAIContextFromQuestContext(context);
        var structureResult = await _aiContentService.GenerateContentAsync(structureRequest, aiContext);

        if (structureResult.IsFailure)
        {
            return Result.Failure<QuestStructure>(structureResult.Error);
        }

        var questStructure = QuestStructure.ParseFromAI(structureResult.Value);
        return Result.Success(questStructure);
    }

    private async Task<Result<List<QuestNPC>>> GenerateQuestNPCsAsync(Quest quest, QuestGenerationContext context)
    {
        var npcs = new List<QuestNPC>();

        foreach (var npcRole in quest.Structure.RequiredNPCRoles)
        {
            var npcRequest = new NPCGenerationRequest
            {
                CampaignId = quest.CampaignId,
                Role = npcRole,
                QuestContext = quest,
                GenerationContext = context
            };

            var npcResult = await GenerateQuestNPCAsync(npcRequest);
            if (npcResult.IsSuccess)
            {
                npcs.Add(npcResult.Value);
            }
        }

        return Result.Success(npcs);
    }

    private async Task<Result<QuestNPC>> GenerateQuestNPCAsync(NPCGenerationRequest request)
    {
        var npcGenerationRequest = new ContentGenerationRequest
        {
            ContentType = ContentType.NPC,
            CampaignId = request.CampaignId,
            Parameters = new GenerationParameters
            {
                CustomParameters = new Dictionary<string, object>
                {
                    ["role"] = request.Role,
                    ["questContext"] = request.QuestContext,
                    ["importance"] = DetermineNPCImportance(request.Role)
                }
            }
        };

        var aiContext = await BuildAIContextFromQuestContext(request.GenerationContext);
        var npcResult = await _aiContentService.GenerateContentAsync(npcGenerationRequest, aiContext);

        if (npcResult.IsFailure)
        {
            return Result.Failure<QuestNPC>(npcResult.Error);
        }

        var questNPC = QuestNPC.CreateFromAI(npcResult.Value, request.Role);
        return Result.Success(questNPC);
    }
}

public class Quest : Entity, IAggregateRoot
{
    public string Id { get; private set; }
    public string CampaignId { get; private set; }
    public string Title { get; private set; }
    public string Description { get; private set; }
    public QuestType Type { get; private set; }
    public QuestStatus Status { get; private set; }
    public DifficultyLevel Difficulty { get; private set; }
    public TimeSpan EstimatedDuration { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime? StartedAt { get; private set; }
    public DateTime? CompletedAt { get; private set; }
    public QuestStructure Structure { get; private set; }
    public List<QuestObjective> Objectives { get; private set; } = new();
    public List<QuestReward> Rewards { get; private set; } = new();
    public List<QuestNPC> RelatedNPCs { get; private set; } = new();
    public List<QuestLocation> RelatedLocations { get; private set; } = new();
    public List<QuestEvent> Events { get; private set; } = new();
    public Dictionary<string, object> Metadata { get; private set; } = new();
    public List<DomainEvent> DomainEvents { get; private set; } = new();

    public static Quest Create(
        string campaignId,
        string title,
        string description,
        QuestType questType,
        DifficultyLevel difficulty,
        TimeSpan estimatedDuration)
    {
        var quest = new Quest
        {
            Id = Guid.NewGuid().ToString(),
            CampaignId = campaignId,
            Title = title,
            Description = description,
            Type = questType,
            Status = QuestStatus.NotStarted,
            Difficulty = difficulty,
            EstimatedDuration = estimatedDuration,
            CreatedAt = DateTime.UtcNow
        };

        quest.AddDomainEvent(new QuestCreatedEvent(quest.Id, campaignId, title));
        return quest;
    }

    public Result Start()
    {
        if (Status != QuestStatus.NotStarted)
        {
            return Result.Failure("Quest has already been started");
        }

        Status = QuestStatus.InProgress;
        StartedAt = DateTime.UtcNow;

        AddDomainEvent(new QuestStartedEvent(Id, CampaignId));
        return Result.Success();
    }

    public Result Complete()
    {
        if (Status != QuestStatus.InProgress)
        {
            return Result.Failure("Quest must be in progress to complete");
        }

        if (!AllObjectivesCompleted())
        {
            return Result.Failure("Not all objectives have been completed");
        }

        Status = QuestStatus.Completed;
        CompletedAt = DateTime.UtcNow;

        AddDomainEvent(new QuestCompletedEvent(Id, CampaignId, GetCompletionTime()));
        return Result.Success();
    }

    public Result AddObjective(QuestObjective objective)
    {
        if (Objectives.Any(o => o.Id == objective.Id))
        {
            return Result.Failure("Objective already exists");
        }

        Objectives.Add(objective);
        AddDomainEvent(new QuestObjectiveAddedEvent(Id, objective.Id, objective.Description));
        return Result.Success();
    }

    public Result CompleteObjective(string objectiveId)
    {
        var objective = Objectives.FirstOrDefault(o => o.Id == objectiveId);
        if (objective == null)
        {
            return Result.Failure("Objective not found");
        }

        objective.Complete();
        AddDomainEvent(new QuestObjectiveCompletedEvent(Id, objectiveId));
        
        // Check if quest is complete
        if (AllObjectivesCompleted() && Status == QuestStatus.InProgress)
        {
            Complete();
        }

        return Result.Success();
    }

    private bool AllObjectivesCompleted()
    {
        return Objectives.All(o => o.Status == ObjectiveStatus.Completed);
    }

    private TimeSpan GetCompletionTime()
    {
        if (StartedAt.HasValue && CompletedAt.HasValue)
        {
            return CompletedAt.Value - StartedAt.Value;
        }
        return TimeSpan.Zero;
    }
}

public class QuestStructure : ValueObject
{
    public QuestArchetype Archetype { get; private set; }
    public List<QuestAct> Acts { get; private set; } = new();
    public List<string> RequiredNPCRoles { get; private set; } = new();
    public List<string> RequiredLocationTypes { get; private set; } = new();
    public List<QuestBranch> Branches { get; private set; } = new();
    public Dictionary<string, object> StructureData { get; private set; } = new();

    public static QuestStructure ParseFromAI(GeneratedContent content)
    {
        var structureData = content.GetStructuredData<QuestStructureData>();
        
        return new QuestStructure
        {
            Archetype = Enum.Parse<QuestArchetype>(structureData.Archetype),
            Acts = structureData.Acts.Select(a => QuestAct.Create(a.Name, a.Description, a.Objectives)).ToList(),
            RequiredNPCRoles = structureData.RequiredNPCRoles,
            RequiredLocationTypes = structureData.RequiredLocationTypes,
            Branches = structureData.Branches.Select(b => QuestBranch.Create(b.Name, b.Condition, b.Outcomes)).ToList(),
            StructureData = structureData.CustomData
        };
    }
}

public enum QuestType
{
    Main,
    Side,
    Personal,
    Faction,
    Exploration,
    Investigation,
    Rescue,
    Delivery,
    Assassination,
    Diplomacy,
    Ritual,
    Tournament
}

public enum QuestStatus
{
    NotStarted,
    InProgress,
    Completed,
    Failed,
    Abandoned,
    OnHold
}

public enum QuestArchetype
{
    HeroJourney,
    Investigation,
    Heist,
    Rescue,
    Exploration,
    Political,
    Romance,
    Mystery,
    Survival,
    Tournament
}
```

## Location Generation System

### Location Generator
```csharp
public class LocationGenerator : IDomainService
{
    private readonly IAIContentService _aiContentService;
    private readonly ILocationTemplateRepository _templateRepository;
    private readonly IGeographyService _geographyService;

    public async Task<Result<Location>> GenerateLocationAsync(LocationGenerationRequest request)
    {
        // Build location context
        var context = await BuildLocationContextAsync(request);

        // Generate location details
        var locationDetails = await GenerateLocationDetailsAsync(request, context);
        if (locationDetails.IsFailure)
        {
            return Result.Failure<Location>(locationDetails.Error);
        }

        // Create location entity
        var location = Location.Create(
            campaignId: request.CampaignId,
            name: locationDetails.Value.Name,
            locationType: locationDetails.Value.Type,
            description: locationDetails.Value.Description
        );

        // Set geographic details
        location.SetGeography(locationDetails.Value.Geography);

        // Add location features
        foreach (var feature in locationDetails.Value.Features)
        {
            location.AddFeature(feature);
        }

        // Generate inhabitants if requested
        if (request.GenerateInhabitants)
        {
            var inhabitantsResult = await GenerateLocationInhabitantsAsync(location, context);
            if (inhabitantsResult.IsSuccess)
            {
                location.SetInhabitants(inhabitantsResult.Value);
            }
        }

        // Generate points of interest
        if (request.GeneratePointsOfInterest)
        {
            var poisResult = await GeneratePointsOfInterestAsync(location, context);
            if (poisResult.IsSuccess)
            {
                location.SetPointsOfInterest(poisResult.Value);
            }
        }

        // Generate local rumors and hooks
        if (request.GenerateHooks)
        {
            var hooksResult = await GenerateLocationHooksAsync(location, context);
            if (hooksResult.IsSuccess)
            {
                location.SetLocalHooks(hooksResult.Value);
            }
        }

        return Result.Success(location);
    }

    private async Task<Result<LocationDetails>> GenerateLocationDetailsAsync(
        LocationGenerationRequest request,
        LocationGenerationContext context)
    {
        var generationRequest = new ContentGenerationRequest
        {
            ContentType = ContentType.Location,
            CampaignId = request.CampaignId,
            UserId = request.UserId,
            Parameters = new GenerationParameters
            {
                CustomParameters = new Dictionary<string, object>
                {
                    ["locationType"] = request.LocationType,
                    ["size"] = request.Size,
                    ["climate"] = request.Climate,
                    ["culture"] = request.Culture,
                    ["economicLevel"] = request.EconomicLevel,
                    ["government"] = request.Government,
                    ["population"] = request.Population
                }
            }
        };

        var aiContext = await BuildAIContextFromLocationContext(context);
        var detailsResult = await _aiContentService.GenerateContentAsync(generationRequest, aiContext);

        if (detailsResult.IsFailure)
        {
            return Result.Failure<LocationDetails>(detailsResult.Error);
        }

        var locationDetails = LocationDetails.ParseFromAI(detailsResult.Value);
        return Result.Success(locationDetails);
    }

    private async Task<Result<List<LocationInhabitant>>> GenerateLocationInhabitantsAsync(
        Location location,
        LocationGenerationContext context)
    {
        var inhabitants = new List<LocationInhabitant>();

        // Generate key NPCs based on location type and size
        var keyNPCRoles = DetermineKeyNPCRoles(location.Type, location.Size);

        foreach (var role in keyNPCRoles)
        {
            var npcRequest = new NPCGenerationRequest
            {
                CampaignId = location.CampaignId,
                Role = role,
                LocationContext = location,
                Importance = DetermineNPCImportance(role, location.Type)
            };

            var npcResult = await GenerateLocationNPCAsync(npcRequest);
            if (npcResult.IsSuccess)
            {
                inhabitants.Add(LocationInhabitant.Create(npcResult.Value, role));
            }
        }

        // Generate population demographics
        var demographics = await GeneratePopulationDemographicsAsync(location, context);
        if (demographics.IsSuccess)
        {
            foreach (var demographic in demographics.Value)
            {
                inhabitants.Add(LocationInhabitant.CreateDemographic(demographic));
            }
        }

        return Result.Success(inhabitants);
    }

    private async Task<Result<List<PointOfInterest>>> GeneratePointsOfInterestAsync(
        Location location,
        LocationGenerationContext context)
    {
        var poisRequest = new ContentGenerationRequest
        {
            ContentType = ContentType.Location,
            CampaignId = location.CampaignId,
            Parameters = new GenerationParameters
            {
                CustomParameters = new Dictionary<string, object>
                {
                    ["subType"] = "pointsOfInterest",
                    ["location"] = location,
                    ["count"] = DeterminePointsOfInterestCount(location.Type, location.Size)
                }
            }
        };

        var aiContext = await BuildAIContextFromLocationContext(context);
        var poisResult = await _aiContentService.GenerateContentAsync(poisRequest, aiContext);

        if (poisResult.IsFailure)
        {
            return Result.Failure<List<PointOfInterest>>(poisResult.Error);
        }

        var pointsOfInterest = ParsePointsOfInterestFromAI(poisResult.Value);
        return Result.Success(pointsOfInterest);
    }
}

public class Location : Entity, IAggregateRoot
{
    public string Id { get; private set; }
    public string CampaignId { get; private set; }
    public string Name { get; private set; }
    public LocationType Type { get; private set; }
    public string Description { get; private set; }
    public LocationSize Size { get; private set; }
    public Geography Geography { get; private set; }
    public List<LocationFeature> Features { get; private set; } = new();
    public List<LocationInhabitant> Inhabitants { get; private set; } = new();
    public List<PointOfInterest> PointsOfInterest { get; private set; } = new();
    public List<LocationHook> LocalHooks { get; private set; } = new();
    public EconomicProfile Economy { get; private set; }
    public Government Government { get; private set; }
    public Culture Culture { get; private set; }
    public Dictionary<string, object> Metadata { get; private set; } = new();
    public List<DomainEvent> DomainEvents { get; private set; } = new();

    public static Location Create(string campaignId, string name, LocationType locationType, string description)
    {
        var location = new Location
        {
            Id = Guid.NewGuid().ToString(),
            CampaignId = campaignId,
            Name = name,
            Type = locationType,
            Description = description
        };

        location.AddDomainEvent(new LocationCreatedEvent(location.Id, campaignId, name, locationType));
        return location;
    }

    public void SetGeography(Geography geography)
    {
        Geography = geography;
    }

    public Result AddFeature(LocationFeature feature)
    {
        if (Features.Any(f => f.Name.Equals(feature.Name, StringComparison.OrdinalIgnoreCase)))
        {
            return Result.Failure("Feature already exists");
        }

        Features.Add(feature);
        AddDomainEvent(new LocationFeatureAddedEvent(Id, feature.Name, feature.Type));
        return Result.Success();
    }

    public void SetInhabitants(List<LocationInhabitant> inhabitants)
    {
        Inhabitants = inhabitants;
    }

    public void SetPointsOfInterest(List<PointOfInterest> pointsOfInterest)
    {
        PointsOfInterest = pointsOfInterest;
    }

    public void SetLocalHooks(List<LocationHook> hooks)
    {
        LocalHooks = hooks;
    }

    public List<LocationInhabitant> GetKeyNPCs()
    {
        return Inhabitants.Where(i => i.IsKeyNPC).ToList();
    }

    public List<PointOfInterest> GetPointsOfInterestByType(PointOfInterestType type)
    {
        return PointsOfInterest.Where(poi => poi.Type == type).ToList();
    }
}

public enum LocationType
{
    City,
    Town,
    Village,
    Hamlet,
    Castle,
    Fortress,
    Temple,
    Dungeon,
    Ruins,
    Forest,
    Mountain,
    Desert,
    Swamp,
    Coast,
    Island,
    Cave,
    Tower,
    Manor,
    Tavern,
    Shop,
    Guild,
    Academy,
    Library,
    Market,
    Port,
    Crossroads
}

public enum LocationSize
{
    Tiny,
    Small,
    Medium,
    Large,
    Huge,
    Gargantuan
}

public class Geography : ValueObject
{
    public Climate Climate { get; private set; }
    public Terrain Terrain { get; private set; }
    public List<string> NearbyLandmarks { get; private set; } = new();
    public List<string> NaturalResources { get; private set; } = new();
    public string? WaterSource { get; private set; }
    public int Elevation { get; private set; }
    public Dictionary<string, object> GeographicFeatures { get; private set; } = new();

    public static Geography Create(Climate climate, Terrain terrain, int elevation = 0)
    {
        return new Geography
        {
            Climate = climate,
            Terrain = terrain,
            Elevation = elevation
        };
    }
}

public enum Climate
{
    Arctic,
    Temperate,
    Tropical,
    Desert,
    Mediterranean,
    Continental,
    Oceanic,
    Subarctic,
    Humid,
    Arid
}

public enum Terrain
{
    Plains,
    Hills,
    Mountains,
    Forest,
    Desert,
    Swamp,
    Coast,
    River,
    Lake,
    Island,
    Canyon,
    Plateau,
    Valley,
    Tundra
}
```

## NPC Generation System

### NPC Generator
```csharp
public class NPCGenerator : IDomainService
{
    private readonly IAIContentService _aiContentService;
    private readonly IPersonalityGenerator _personalityGenerator;
    private readonly INameGenerator _nameGenerator;
    private readonly IAppearanceGenerator _appearanceGenerator;

    public async Task<Result<NPC>> GenerateNPCAsync(NPCGenerationRequest request)
    {
        // Build NPC context
        var context = await BuildNPCContextAsync(request);

        // Generate basic NPC details
        var npcDetails = await GenerateNPCDetailsAsync(request, context);
        if (npcDetails.IsFailure)
        {
            return Result.Failure<NPC>(npcDetails.Error);
        }

        // Create NPC entity
        var npc = NPC.Create(
            campaignId: request.CampaignId,
            name: npcDetails.Value.Name,
            race: npcDetails.Value.Race,
            npcClass: npcDetails.Value.Class,
            role: request.Role
        );

        // Set appearance
        npc.SetAppearance(npcDetails.Value.Appearance);

        // Generate personality
        var personalityResult = await _personalityGenerator.GeneratePersonalityAsync(npc, context);
        if (personalityResult.IsSuccess)
        {
            npc.SetPersonality(personalityResult.Value);
        }

        // Generate backstory
        if (request.GenerateBackstory)
        {
            var backstoryResult = await GenerateNPCBackstoryAsync(npc, context);
            if (backstoryResult.IsSuccess)
            {
                npc.SetBackstory(backstoryResult.Value);
            }
        }

        // Generate relationships
        if (request.GenerateRelationships)
        {
            var relationshipsResult = await GenerateNPCRelationshipsAsync(npc, context);
            if (relationshipsResult.IsSuccess)
            {
                npc.SetRelationships(relationshipsResult.Value);
            }
        }

        // Generate motivations and goals
        if (request.GenerateMotivations)
        {
            var motivationsResult = await GenerateNPCMotivationsAsync(npc, context);
            if (motivationsResult.IsSuccess)
            {
                npc.SetMotivations(motivationsResult.Value);
            }
        }

        // Generate dialogue patterns
        if (request.GenerateDialogue)
        {
            var dialogueResult = await GenerateDialoguePatternsAsync(npc, context);
            if (dialogueResult.IsSuccess)
            {
                npc.SetDialoguePatterns(dialogueResult.Value);
            }
        }

        return Result.Success(npc);
    }

    private async Task<Result<NPCDetails>> GenerateNPCDetailsAsync(
        NPCGenerationRequest request,
        NPCGenerationContext context)
    {
        var generationRequest = new ContentGenerationRequest
        {
            ContentType = ContentType.NPC,
            CampaignId = request.CampaignId,
            UserId = request.UserId,
            Parameters = new GenerationParameters
            {
                CustomParameters = new Dictionary<string, object>
                {
                    ["role"] = request.Role,
                    ["importance"] = request.Importance,
                    ["age"] = request.Age,
                    ["gender"] = request.Gender,
                    ["race"] = request.Race,
                    ["class"] = request.Class,
                    ["location"] = request.LocationContext,
                    ["questContext"] = request.QuestContext
                }
            }
        };

        var aiContext = await BuildAIContextFromNPCContext(context);
        var detailsResult = await _aiContentService.GenerateContentAsync(generationRequest, aiContext);

        if (detailsResult.IsFailure)
        {
            return Result.Failure<NPCDetails>(detailsResult.Error);
        }

        var npcDetails = NPCDetails.ParseFromAI(detailsResult.Value);
        return Result.Success(npcDetails);
    }

    private async Task<Result<NPCBackstory>> GenerateNPCBackstoryAsync(NPC npc, NPCGenerationContext context)
    {
        var backstoryRequest = new ContentGenerationRequest
        {
            ContentType = ContentType.NPC,
            CampaignId = npc.CampaignId,
            Parameters = new GenerationParameters
            {
                CustomParameters = new Dictionary<string, object>
                {
                    ["subType"] = "backstory",
                    ["npc"] = npc,
                    ["depth"] = context.BackstoryDepth ?? BackstoryDepth.Medium
                }
            }
        };

        var aiContext = await BuildAIContextFromNPCContext(context);
        var backstoryResult = await _aiContentService.GenerateContentAsync(backstoryRequest, aiContext);

        if (backstoryResult.IsFailure)
        {
            return Result.Failure<NPCBackstory>(backstoryResult.Error);
        }

        var backstory = NPCBackstory.ParseFromAI(backstoryResult.Value);
        return Result.Success(backstory);
    }

    private async Task<Result<List<NPCRelationship>>> GenerateNPCRelationshipsAsync(
        NPC npc,
        NPCGenerationContext context)
    {
        var relationshipsRequest = new ContentGenerationRequest
        {
            ContentType = ContentType.NPC,
            CampaignId = npc.CampaignId,
            Parameters = new GenerationParameters
            {
                CustomParameters = new Dictionary<string, object>
                {
                    ["subType"] = "relationships",
                    ["npc"] = npc,
                    ["existingNPCs"] = context.ExistingNPCs,
                    ["relationshipCount"] = DetermineRelationshipCount(npc.Role, npc.Importance)
                }
            }
        };

        var aiContext = await BuildAIContextFromNPCContext(context);
        var relationshipsResult = await _aiContentService.GenerateContentAsync(relationshipsRequest, aiContext);

        if (relationshipsResult.IsFailure)
        {
            return Result.Failure<List<NPCRelationship>>(relationshipsResult.Error);
        }

        var relationships = ParseNPCRelationshipsFromAI(relationshipsResult.Value);
        return Result.Success(relationships);
    }

    private async Task<Result<NPCMotivations>> GenerateNPCMotivationsAsync(NPC npc, NPCGenerationContext context)
    {
        var motivationsRequest = new ContentGenerationRequest
        {
            ContentType = ContentType.NPC,
            CampaignId = npc.CampaignId,
            Parameters = new GenerationParameters
            {
                CustomParameters = new Dictionary<string, object>
                {
                    ["subType"] = "motivations",
                    ["npc"] = npc,
                    ["role"] = npc.Role,
                    ["personality"] = npc.Personality
                }
            }
        };

        var aiContext = await BuildAIContextFromNPCContext(context);
        var motivationsResult = await _aiContentService.GenerateContentAsync(motivationsRequest, aiContext);

        if (motivationsResult.IsFailure)
        {
            return Result.Failure<NPCMotivations>(motivationsResult.Error);
        }

        var motivations = NPCMotivations.ParseFromAI(motivationsResult.Value);
        return Result.Success(motivations);
    }
}

public class NPCGenerationRequest
{
    public string CampaignId { get; set; }
    public string UserId { get; set; }
    public string Role { get; set; }
    public NPCImportance Importance { get; set; } = NPCImportance.Minor;
    public string? Race { get; set; }
    public string? Class { get; set; }
    public string? Gender { get; set; }
    public AgeCategory? Age { get; set; }
    public Location? LocationContext { get; set; }
    public Quest? QuestContext { get; set; }
    public bool GenerateBackstory { get; set; } = true;
    public bool GenerateRelationships { get; set; } = true;
    public bool GenerateMotivations { get; set; } = true;
    public bool GenerateDialogue { get; set; } = true;
    public List<string> RequiredTraits { get; set; } = new();
    public List<string> ExcludedTraits { get; set; } = new();
}

public enum NPCImportance
{
    Background,
    Minor,
    Moderate,
    Major,
    Critical
}

public enum AgeCategory
{
    Child,
    YoungAdult,
    Adult,
    MiddleAged,
    Elderly,
    Ancient
}

public enum BackstoryDepth
{
    Minimal,
    Basic,
    Medium,
    Detailed,
    Comprehensive
}

public class NPCBackstory : ValueObject
{
    public string Origin { get; private set; }
    public List<BackstoryEvent> MajorEvents { get; private set; } = new();
    public List<string> FormativeExperiences { get; private set; } = new();
    public List<string> Secrets { get; private set; } = new();
    public string? Family { get; private set; }
    public string? Education { get; private set; }
    public List<string> PreviousOccupations { get; private set; } = new();
    public Dictionary<string, object> CustomBackstoryElements { get; private set; } = new();

    public static NPCBackstory ParseFromAI(GeneratedContent content)
    {
        var backstoryData = content.GetStructuredData<NPCBackstoryData>();
        
        return new NPCBackstory
        {
            Origin = backstoryData.Origin,
            MajorEvents = backstoryData.MajorEvents.Select(e => BackstoryEvent.Create(e.Description, e.Age, e.Impact)).ToList(),
            FormativeExperiences = backstoryData.FormativeExperiences,
            Secrets = backstoryData.Secrets,
            Family = backstoryData.Family,
            Education = backstoryData.Education,
            PreviousOccupations = backstoryData.PreviousOccupations,
            CustomBackstoryElements = backstoryData.CustomElements
        };
    }
}

public class BackstoryEvent : ValueObject
{
    public string Description { get; private set; }
    public int Age { get; private set; }
    public EventImpact Impact { get; private set; }
    public List<string> ConsequencesI { get; private set; } = new();

    public static BackstoryEvent Create(string description, int age, EventImpact impact)
    {
        return new BackstoryEvent
        {
            Description = description,
            Age = age,
            Impact = impact
        };
    }
}

public enum EventImpact
{
    Minor,
    Moderate,
    Major,
    LifeChanging
}
```

This Content Generation business logic specification provides:

1. **Comprehensive Content Generation Engine** - Orchestrates all types of D&D content creation with AI assistance
2. **Quest Generation System** - Creates complete quests with objectives, NPCs, locations, and branching narratives
3. **Location Generation System** - Generates detailed locations with geography, inhabitants, and points of interest
4. **NPC Generation System** - Creates rich NPCs with personalities, backstories, relationships, and motivations
5. **Template-Based Generation** - Uses templates for consistent, high-quality content creation
6. **Context-Aware Generation** - Builds rich context from campaign data for relevant content
7. **Quality Control** - Validates and enhances generated content based on requirements
8. **Integration Points** - Seamless integration with campaign management and AI services

The specification ensures high-quality, contextually relevant content generation that enhances the D&D experience while maintaining consistency with campaign lore and game rules.

<function_calls>
<invoke name="todo_write">
<parameter name="merge">true
