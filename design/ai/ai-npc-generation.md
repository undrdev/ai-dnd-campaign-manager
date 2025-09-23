# AI NPC Generation & Dialogue System

## Overview
This document defines the comprehensive AI-powered NPC generation and dialogue system that creates dynamic, personality-driven NPCs with consistent behavior, memorable dialogue, relationship tracking, and intelligent responses that enhance the D&D campaign experience.

---

## NPC AI Architecture

### **NPC Intelligence Pipeline**
```
┌─────────────────────────────────────────────────────────────────┐
│                    NPC Interaction Request                     │
└─────────────────────────────────────────────────────────────────┘
                                │
                    ┌───────────────────────┐
                    │   NPC Context         │
                    │   Resolution          │
                    │ (Personality, Memory, │
                    │  Relationships)       │
                    └───────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
┌───────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Personality  │    │   Relationship  │    │   Emotional     │
│   Engine      │    │   Dynamics      │    │   State         │
│              │    │   Analysis      │    │   Management    │
└───────────────┘    └─────────────────┘    └─────────────────┘
        │                       │                       │
        └───────────────────────┼───────────────────────┘
                                │
                    ┌───────────────────────┐
                    │   Dialogue            │
                    │   Generation          │
                    │  (Context-Aware AI)   │
                    └───────────────────────┘
                                │
                    ┌───────────────────────┐
                    │   Response            │
                    │   Post-Processing     │
                    │  (Consistency Check)  │
                    └───────────────────────┘
                                │
                    ┌───────────────────────┐
                    │   Memory Update       │
                    │   & Learning          │
                    │  (Interaction Store)  │
                    └───────────────────────┘
```

### **Core NPC AI Interface**
```csharp
public interface INPCGenerationService
{
    // NPC Creation
    Task<GeneratedNPC> GenerateNPCAsync(NPCGenerationRequest request);
    Task<List<GeneratedNPC>> GenerateBulkNPCsAsync(BulkNPCGenerationRequest request);
    Task<GeneratedNPC> EnhanceExistingNPCAsync(Guid npcId, NPCEnhancementRequest request);
    
    // Dialogue Generation
    Task<NPCDialogueResponse> GenerateDialogueAsync(NPCDialogueRequest request);
    Task<NPCDialogueResponse> GenerateEmotionalResponseAsync(EmotionalDialogueRequest request);
    Task<NPCDialogueResponse> GenerateKnowledgeResponseAsync(KnowledgeDialogueRequest request);
    
    // Personality Management
    Task<PersonalityProfile> GeneratePersonalityAsync(PersonalityGenerationRequest request);
    Task<PersonalityProfile> EvolvePersonalityAsync(Guid npcId, PersonalityEvolutionRequest request);
    Task<PersonalityCompatibility> AnalyzePersonalityCompatibilityAsync(Guid npcId1, Guid npcId2);
    
    // Relationship Dynamics
    Task<RelationshipUpdate> UpdateRelationshipAsync(Guid npcId, Guid targetId, InteractionContext context);
    Task<List<RelationshipSuggestion>> GenerateRelationshipSuggestionsAsync(Guid campaignId);
    Task<SocialNetworkAnalysis> AnalyzeSocialNetworkAsync(Guid campaignId);
    
    // Behavioral Patterns
    Task<BehaviorPrediction> PredictNPCBehaviorAsync(Guid npcId, ScenarioContext scenario);
    Task<List<NPCReaction>> GenerateGroupReactionsAsync(List<Guid> npcIds, EventContext eventContext);
    Task<NPCInitiative> GenerateNPCInitiativeAsync(Guid npcId, CampaignContext context);
}

public enum NPCArchetype
{
    // Social roles
    Leader,
    Follower,
    Mediator,
    Rebel,
    Mentor,
    Student,
    
    // Personality archetypes
    Hero,
    Villain,
    Trickster,
    Sage,
    Innocent,
    Explorer,
    Caregiver,
    Ruler,
    Creator,
    Magician,
    
    // D&D specific
    Noble,
    Commoner,
    Merchant,
    Guard,
    Scholar,
    Priest,
    Adventurer,
    Criminal,
    Artisan,
    Performer
}

public enum EmotionalState
{
    Neutral,
    Happy,
    Sad,
    Angry,
    Fearful,
    Surprised,
    Disgusted,
    Contemptuous,
    Excited,
    Anxious,
    Confident,
    Suspicious,
    Grateful,
    Guilty,
    Proud,
    Ashamed,
    Curious,
    Bored
}

public class NPCGenerationRequest
{
    public Guid CampaignId { get; set; }
    public string? Name { get; set; } // Optional - will generate if not provided
    public NPCArchetype? Archetype { get; set; }
    public string? Role { get; set; } // Social/professional role
    public string? Location { get; set; }
    
    // Generation parameters
    public NPCComplexity Complexity { get; set; } = NPCComplexity.Standard;
    public List<string> RequiredTraits { get; set; } = new();
    public List<string> ForbiddenTraits { get; set; } = new();
    public List<string> PreferredTopics { get; set; } = new();
    public List<string> AvoidedTopics { get; set; } = new();
    
    // Relationship specifications
    public List<NPCRelationshipSeed> RelationshipSeeds { get; set; } = new();
    public List<Guid> MustKnowCharacters { get; set; } = new();
    public List<Guid> MustNotKnowCharacters { get; set; } = new();
    
    // Campaign integration
    public List<string> RelevantQuests { get; set; } = new();
    public List<string> KnownSecrets { get; set; } = new();
    public List<string> ImportantKnowledge { get; set; } = new();
    
    // AI generation settings
    public float CreativityLevel { get; set; } = 0.7f;
    public bool GenerateBackstory { get; set; } = true;
    public bool GenerateAppearance { get; set; } = true;
    public bool GenerateQuirks { get; set; } = true;
    public SubscriptionTier UserTier { get; set; }
}

public enum NPCComplexity
{
    Simple,     // Basic personality, limited dialogue
    Standard,   // Full personality, good dialogue variety
    Complex,    // Rich personality, extensive dialogue, relationships
    Legendary   // Highly detailed, dynamic personality evolution
}
```

### **NPC Generation Service Implementation**
```csharp
public class NPCGenerationService : INPCGenerationService
{
    private readonly IAIGatewayService _aiGateway;
    private readonly IPromptEngine _promptEngine;
    private readonly INPCRepository _npcRepository;
    private readonly IPersonalityEngine _personalityEngine;
    private readonly IRelationshipEngine _relationshipEngine;
    private readonly IContextService _contextService;
    private readonly INPCMemoryService _memoryService;
    private readonly ILogger<NPCGenerationService> _logger;

    public async Task<GeneratedNPC> GenerateNPCAsync(NPCGenerationRequest request)
    {
        _logger.LogInformation("Generating NPC for campaign {CampaignId} with archetype {Archetype}", 
            request.CampaignId, request.Archetype);

        try
        {
            // Step 1: Generate core personality
            var personalityRequest = new PersonalityGenerationRequest
            {
                Archetype = request.Archetype,
                RequiredTraits = request.RequiredTraits,
                ForbiddenTraits = request.ForbiddenTraits,
                Complexity = request.Complexity,
                CreativityLevel = request.CreativityLevel
            };
            
            var personality = await GeneratePersonalityAsync(personalityRequest);

            // Step 2: Generate appearance and basic info
            var appearanceAndInfo = await GenerateAppearanceAndInfoAsync(request, personality);

            // Step 3: Generate backstory
            var backstory = request.GenerateBackstory 
                ? await GenerateBackstoryAsync(request, personality, appearanceAndInfo)
                : new NPCBackstory();

            // Step 4: Generate knowledge and secrets
            var knowledge = await GenerateKnowledgeBaseAsync(request, personality, backstory);

            // Step 5: Generate initial relationships
            var relationships = await GenerateInitialRelationshipsAsync(request, personality);

            // Step 6: Generate speech patterns and mannerisms
            var speechPattern = await GenerateSpeechPatternAsync(personality, backstory);
            var mannerisms = request.GenerateQuirks 
                ? await GenerateMannerismsAsync(personality, backstory)
                : new List<string>();

            // Step 7: Create the complete NPC
            var npc = new GeneratedNPC
            {
                Id = Guid.NewGuid(),
                Name = appearanceAndInfo.Name,
                CampaignId = request.CampaignId,
                Archetype = request.Archetype ?? DetermineArchetype(personality),
                
                // Core attributes
                Personality = personality,
                Appearance = appearanceAndInfo.Appearance,
                Background = backstory,
                KnowledgeBase = knowledge,
                
                // Social attributes
                SocialRole = request.Role ?? appearanceAndInfo.SuggestedRole,
                Relationships = relationships,
                SpeechPattern = speechPattern,
                Mannerisms = mannerisms,
                
                // Behavioral attributes
                CurrentLocation = request.Location ?? "Unknown",
                CurrentMood = EmotionalState.Neutral,
                EnergyLevel = 0.5f,
                StressLevel = 0.3f,
                
                // AI attributes
                Complexity = request.Complexity,
                GeneratedAt = DateTime.UtcNow,
                LastInteraction = DateTime.UtcNow,
                InteractionCount = 0,
                
                // Memory system
                ShortTermMemory = new List<NPCMemory>(),
                LongTermMemory = new List<NPCMemory>(),
                EmotionalMemories = new List<EmotionalMemory>()
            };

            // Step 8: Store in repository
            await _npcRepository.CreateAsync(npc);

            // Step 9: Initialize memory system
            await _memoryService.InitializeNPCMemoryAsync(npc.Id, npc);

            _logger.LogInformation("Successfully generated NPC {NPCName} ({NPCId}) for campaign {CampaignId}",
                npc.Name, npc.Id, request.CampaignId);

            return npc;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to generate NPC for campaign {CampaignId}", request.CampaignId);
            throw;
        }
    }

    public async Task<NPCDialogueResponse> GenerateDialogueAsync(NPCDialogueRequest request)
    {
        var npc = await _npcRepository.GetByIdAsync(request.NPCId);
        if (npc == null)
        {
            throw new NPCNotFoundException($"NPC {request.NPCId} not found");
        }

        // Step 1: Analyze current emotional and social context
        var emotionalContext = await AnalyzeEmotionalContextAsync(npc, request);
        var socialContext = await AnalyzeSocialContextAsync(npc, request);
        var relationshipContext = await AnalyzeRelationshipContextAsync(npc, request);

        // Step 2: Retrieve relevant memories
        var relevantMemories = await _memoryService.GetRelevantMemoriesAsync(
            npc.Id, request.PlayerInput, limit: 5);

        // Step 3: Update NPC's emotional state based on context
        var updatedEmotionalState = await UpdateEmotionalStateAsync(npc, emotionalContext, request);

        // Step 4: Generate dialogue using AI with full context
        var dialoguePrompt = await _promptEngine.GenerateNPCDialoguePromptAsync(new NPCDialoguePromptRequest
        {
            NPC = npc,
            PlayerCharacter = request.PlayerCharacter,
            PlayerInput = request.PlayerInput,
            SceneContext = request.SceneContext,
            EmotionalContext = emotionalContext,
            SocialContext = socialContext,
            RelationshipContext = relationshipContext,
            RelevantMemories = relevantMemories,
            QuestContext = request.QuestContext,
            RecentEvents = request.RecentEvents
        });

        var aiResponse = await _aiGateway.GenerateContentAsync(new AIRequest
        {
            UserId = request.RequestedBy,
            CampaignId = request.CampaignId,
            Type = AIRequestType.NPCDialogue,
            Messages = dialoguePrompt.Messages,
            Parameters = new AIParameters
            {
                Temperature = CalculateDialogueTemperature(npc, emotionalContext),
                MaxTokens = GetMaxTokensForComplexity(npc.Complexity),
                TopP = 0.9f
            }
        });

        // Step 5: Post-process the dialogue
        var processedDialogue = await PostProcessDialogueAsync(aiResponse.Content, npc, request);

        // Step 6: Update NPC memory with this interaction
        await _memoryService.RecordInteractionAsync(npc.Id, new NPCInteractionMemory
        {
            PlayerCharacterId = request.PlayerCharacter?.CharacterId,
            PlayerInput = request.PlayerInput,
            NPCResponse = processedDialogue.DialogueText,
            EmotionalState = updatedEmotionalState,
            SceneContext = request.SceneContext?.Description ?? string.Empty,
            Timestamp = DateTime.UtcNow,
            Importance = CalculateInteractionImportance(request, processedDialogue)
        });

        // Step 7: Update relationships if applicable
        if (request.PlayerCharacter != null)
        {
            await UpdateRelationshipFromInteractionAsync(npc.Id, request.PlayerCharacter.CharacterId, 
                request, processedDialogue);
        }

        // Step 8: Create response
        var response = new NPCDialogueResponse
        {
            NPCId = npc.Id,
            NPCName = npc.Name,
            DialogueText = processedDialogue.DialogueText,
            Actions = processedDialogue.Actions,
            EmotionalState = updatedEmotionalState,
            Mood = processedDialogue.Mood,
            BodyLanguage = processedDialogue.BodyLanguage,
            VoiceTone = processedDialogue.VoiceTone,
            
            // Metadata
            GeneratedAt = DateTime.UtcNow,
            TokensUsed = aiResponse.Usage.TotalTokens,
            ProcessingTime = aiResponse.Usage.ProcessingTime,
            QualityScore = processedDialogue.QualityScore,
            
            // Context information
            RelationshipChange = processedDialogue.RelationshipChange,
            MemoryImportance = CalculateInteractionImportance(request, processedDialogue),
            SuggestedFollowUps = processedDialogue.SuggestedFollowUps
        };

        return response;
    }

    private async Task<PersonalityProfile> GeneratePersonalityAsync(PersonalityGenerationRequest request)
    {
        var prompt = await _promptEngine.GeneratePromptAsync(new PromptRequest
        {
            Type = PromptTemplateType.NPCPersonality,
            Variables = new Dictionary<string, object>
            {
                ["archetype"] = request.Archetype?.ToString() ?? "Random",
                ["required_traits"] = request.RequiredTraits,
                ["forbidden_traits"] = request.ForbiddenTraits,
                ["complexity"] = request.Complexity.ToString(),
                ["creativity_level"] = request.CreativityLevel
            }
        });

        var aiResponse = await _aiGateway.GenerateContentAsync(new AIRequest
        {
            UserId = Guid.Empty, // System request
            Type = AIRequestType.GeneralText,
            Messages = prompt.Messages,
            Parameters = new AIParameters
            {
                Temperature = request.CreativityLevel,
                MaxTokens = GetTokensForComplexity(request.Complexity)
            }
        });

        // Parse the AI response into a structured personality profile
        var personality = await ParsePersonalityFromAIResponse(aiResponse.Content);
        
        // Validate and enhance the personality
        personality = await ValidateAndEnhancePersonality(personality, request);
        
        return personality;
    }

    private async Task<EmotionalContext> AnalyzeEmotionalContextAsync(GeneratedNPC npc, NPCDialogueRequest request)
    {
        var context = new EmotionalContext
        {
            BaseEmotionalState = npc.CurrentMood,
            StressLevel = npc.StressLevel,
            EnergyLevel = npc.EnergyLevel
        };

        // Analyze player input for emotional triggers
        context.PlayerInputEmotion = await AnalyzePlayerInputEmotionAsync(request.PlayerInput);
        
        // Check for personality-based emotional responses
        context.PersonalityTriggeredEmotions = AnalyzePersonalityTriggers(npc.Personality, request);
        
        // Consider recent events
        if (request.RecentEvents?.Any() == true)
        {
            context.EventTriggeredEmotions = await AnalyzeEventEmotionalImpactAsync(npc, request.RecentEvents);
        }

        // Factor in relationship dynamics
        if (request.PlayerCharacter != null)
        {
            var relationship = npc.Relationships.FirstOrDefault(r => r.CharacterId == request.PlayerCharacter.CharacterId);
            if (relationship != null)
            {
                context.RelationshipEmotionalModifier = CalculateRelationshipEmotionalModifier(relationship);
            }
        }

        return context;
    }

    private async Task<ProcessedDialogue> PostProcessDialogueAsync(string rawDialogue, GeneratedNPC npc, NPCDialogueRequest request)
    {
        var processed = new ProcessedDialogue
        {
            DialogueText = rawDialogue
        };

        // Step 1: Parse actions and dialogue
        var (dialogue, actions) = ParseDialogueAndActions(rawDialogue);
        processed.DialogueText = dialogue;
        processed.Actions = actions;

        // Step 2: Apply speech pattern modifications
        processed.DialogueText = ApplySpeechPattern(processed.DialogueText, npc.SpeechPattern);

        // Step 3: Ensure personality consistency
        var consistencyScore = await ValidatePersonalityConsistency(processed.DialogueText, npc.Personality);
        processed.QualityScore = consistencyScore;

        // Step 4: Generate contextual body language and tone
        processed.BodyLanguage = GenerateBodyLanguage(npc, request);
        processed.VoiceTone = GenerateVoiceTone(npc, request);
        processed.Mood = DetermineMoodFromDialogue(processed.DialogueText, npc.CurrentMood);

        // Step 5: Analyze potential relationship impact
        if (request.PlayerCharacter != null)
        {
            processed.RelationshipChange = AnalyzeRelationshipImpact(processed, npc, request);
        }

        // Step 6: Generate follow-up suggestions
        processed.SuggestedFollowUps = GenerateFollowUpSuggestions(processed, npc, request);

        // Step 7: Content filtering
        var filterResult = await ValidateContentAppropriatenessAsync(processed.DialogueText);
        if (!filterResult.IsAppropriate)
        {
            processed.DialogueText = filterResult.FilteredContent;
            processed.QualityScore *= 0.8f; // Reduce quality score for filtered content
        }

        return processed;
    }

    private float CalculateDialogueTemperature(GeneratedNPC npc, EmotionalContext context)
    {
        float baseTemperature = 0.7f;
        
        // Adjust based on personality traits
        if (npc.Personality != null)
        {
            // More extroverted NPCs get higher temperature (more varied responses)
            baseTemperature += (npc.Personality.Extraversion - 0.5f) * 0.2f;
            
            // More neurotic NPCs get higher temperature (more unpredictable)
            baseTemperature += (npc.Personality.Neuroticism - 0.5f) * 0.1f;
            
            // More open NPCs get higher temperature (more creative responses)
            baseTemperature += (npc.Personality.Openness - 0.5f) * 0.15f;
        }
        
        // Adjust based on emotional state
        switch (context.BaseEmotionalState)
        {
            case EmotionalState.Excited:
            case EmotionalState.Angry:
                baseTemperature += 0.1f;
                break;
            case EmotionalState.Sad:
            case EmotionalState.Fearful:
                baseTemperature -= 0.1f;
                break;
            case EmotionalState.Anxious:
                baseTemperature += 0.15f;
                break;
        }
        
        // Adjust based on stress and energy
        baseTemperature += (npc.StressLevel - 0.5f) * 0.1f;
        baseTemperature += (npc.EnergyLevel - 0.5f) * 0.05f;
        
        return Math.Clamp(baseTemperature, 0.1f, 1.0f);
    }

    private string ApplySpeechPattern(string dialogue, SpeechPattern speechPattern)
    {
        if (speechPattern == null) return dialogue;
        
        var modified = dialogue;
        
        // Apply formality level
        if (speechPattern.Formality < 0.3f)
        {
            modified = ApplyCasualSpeech(modified);
        }
        else if (speechPattern.Formality > 0.7f)
        {
            modified = ApplyFormalSpeech(modified);
        }
        
        // Insert catchphrases occasionally
        if (speechPattern.CatchPhrases?.Any() == true && Random.Shared.NextDouble() < 0.3)
        {
            var catchphrase = speechPattern.CatchPhrases[Random.Shared.Next(speechPattern.CatchPhrases.Count)];
            modified = InsertCatchphrase(modified, catchphrase);
        }
        
        // Apply accent markers if specified
        if (!string.IsNullOrEmpty(speechPattern.Accent))
        {
            modified = ApplyAccentMarkers(modified, speechPattern.Accent);
        }
        
        // Apply cultural expressions
        if (speechPattern.CulturalExpressions?.Any() == true && Random.Shared.NextDouble() < 0.2)
        {
            var expression = speechPattern.CulturalExpressions[Random.Shared.Next(speechPattern.CulturalExpressions.Count)];
            modified = InsertCulturalExpression(modified, expression);
        }
        
        return modified;
    }
}

// Supporting data models
public class GeneratedNPC
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public Guid CampaignId { get; set; }
    public NPCArchetype Archetype { get; set; }
    
    // Core attributes
    public PersonalityProfile Personality { get; set; } = new();
    public NPCAppearance Appearance { get; set; } = new();
    public NPCBackstory Background { get; set; } = new();
    public NPCKnowledgeBase KnowledgeBase { get; set; } = new();
    
    // Social attributes
    public string SocialRole { get; set; } = string.Empty;
    public List<NPCRelationship> Relationships { get; set; } = new();
    public SpeechPattern SpeechPattern { get; set; } = new();
    public List<string> Mannerisms { get; set; } = new();
    
    // Current state
    public string CurrentLocation { get; set; } = string.Empty;
    public EmotionalState CurrentMood { get; set; } = EmotionalState.Neutral;
    public float EnergyLevel { get; set; } = 0.5f; // 0.0 to 1.0
    public float StressLevel { get; set; } = 0.3f; // 0.0 to 1.0
    
    // Behavioral patterns
    public List<BehaviorPattern> BehaviorPatterns { get; set; } = new();
    public List<EmotionalTrigger> EmotionalTriggers { get; set; } = new();
    public List<ConversationTopic> PreferredTopics { get; set; } = new();
    public List<ConversationTopic> AvoidedTopics { get; set; } = new();
    
    // AI and generation metadata
    public NPCComplexity Complexity { get; set; }
    public DateTime GeneratedAt { get; set; }
    public DateTime LastInteraction { get; set; }
    public int InteractionCount { get; set; }
    public float AverageInteractionQuality { get; set; }
    
    // Memory systems
    public List<NPCMemory> ShortTermMemory { get; set; } = new();
    public List<NPCMemory> LongTermMemory { get; set; } = new();
    public List<EmotionalMemory> EmotionalMemories { get; set; } = new();
}

public class PersonalityProfile
{
    // Big Five personality traits (0.0 to 1.0)
    public float Openness { get; set; } = 0.5f;
    public float Conscientiousness { get; set; } = 0.5f;
    public float Extraversion { get; set; } = 0.5f;
    public float Agreeableness { get; set; } = 0.5f;
    public float Neuroticism { get; set; } = 0.5f;
    
    // D&D personality traits
    public List<string> PersonalityTraits { get; set; } = new();
    public List<string> Ideals { get; set; } = new();
    public List<string> Bonds { get; set; } = new();
    public List<string> Flaws { get; set; } = new();
    
    // Behavioral tendencies
    public float Confidence { get; set; } = 0.5f;
    public float Empathy { get; set; } = 0.5f;
    public float Curiosity { get; set; } = 0.5f;
    public float Impulsiveness { get; set; } = 0.5f;
    public float Loyalty { get; set; } = 0.5f;
    public float Trustworthiness { get; set; } = 0.5f;
    public float Ambition { get; set; } = 0.5f;
    public float Patience { get; set; } = 0.5f;
    
    // Social preferences
    public float SocialComfort { get; set; } = 0.5f; // Comfort in social situations
    public float AuthorityRespect { get; set; } = 0.5f; // Respect for authority
    public float ConflictAvoidance { get; set; } = 0.5f; // Tendency to avoid conflict
    public float HelpfulnessLevel { get; set; } = 0.5f; // Willingness to help others
    
    // Communication style
    public float Directness { get; set; } = 0.5f; // How direct/blunt they are
    public float Eloquence { get; set; } = 0.5f; // How well-spoken they are
    public float Humor { get; set; } = 0.5f; // Use of humor in conversation
    public float Sarcasm { get; set; } = 0.3f; // Tendency toward sarcasm
}

public class NPCDialogueResponse
{
    public Guid NPCId { get; set; }
    public string NPCName { get; set; } = string.Empty;
    public string DialogueText { get; set; } = string.Empty;
    public List<string> Actions { get; set; } = new();
    
    // Emotional and behavioral context
    public EmotionalState EmotionalState { get; set; }
    public string Mood { get; set; } = string.Empty;
    public string BodyLanguage { get; set; } = string.Empty;
    public string VoiceTone { get; set; } = string.Empty;
    
    // Metadata
    public DateTime GeneratedAt { get; set; }
    public int TokensUsed { get; set; }
    public TimeSpan ProcessingTime { get; set; }
    public float QualityScore { get; set; }
    
    // Relationship and memory impact
    public RelationshipChange? RelationshipChange { get; set; }
    public float MemoryImportance { get; set; }
    public List<string> SuggestedFollowUps { get; set; } = new();
    
    // Additional context
    public bool TriggeredEmotionalResponse { get; set; }
    public List<string> ReferencedMemories { get; set; } = new();
    public List<string> NewInformation { get; set; } = new();
}

public class EmotionalContext
{
    public EmotionalState BaseEmotionalState { get; set; }
    public float StressLevel { get; set; }
    public float EnergyLevel { get; set; }
    public EmotionalState PlayerInputEmotion { get; set; }
    public List<EmotionalState> PersonalityTriggeredEmotions { get; set; } = new();
    public List<EmotionalState> EventTriggeredEmotions { get; set; } = new();
    public float RelationshipEmotionalModifier { get; set; } = 0f;
}

public class NPCMemory
{
    public Guid Id { get; set; }
    public Guid NPCId { get; set; }
    public string Content { get; set; } = string.Empty;
    public MemoryType Type { get; set; }
    public float Importance { get; set; } // 0.0 to 1.0
    public DateTime CreatedAt { get; set; }
    public DateTime LastAccessedAt { get; set; }
    public int AccessCount { get; set; }
    public float EmotionalIntensity { get; set; }
    public List<string> AssociatedKeywords { get; set; } = new();
    public Dictionary<string, object> Metadata { get; set; } = new();
}

public enum MemoryType
{
    Interaction,
    Observation,
    Information,
    Emotional,
    Relationship,
    Event,
    Secret,
    Goal,
    Fear,
    Desire
}
```

This comprehensive NPC generation system creates dynamic, personality-driven NPCs with consistent behavior, intelligent dialogue, and evolving relationships that enhance the D&D campaign experience through sophisticated AI-powered interactions.
