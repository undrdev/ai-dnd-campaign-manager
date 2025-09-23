# AI Prompt Engineering Framework

## Overview
This document defines the comprehensive prompt engineering framework for the D&D AI Campaign Management System, including template-based prompt generation, context injection strategies, output formatting controls, and specialized prompts for different AI use cases (NPC dialogue, world building, character creation, etc.).

---

## Prompt Engineering Architecture

### **Prompt Template System**
```
┌─────────────────────────────────────────────────────────────────┐
│                    AI Request Processing                        │
└─────────────────────────────────────────────────────────────────┘
                                │
                    ┌───────────────────────┐
                    │  Prompt Template      │
                    │     Selector          │
                    │  (Based on Request    │
                    │      Type)           │
                    └───────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
┌───────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Base Template │    │Context Injection│    │Output Formatter │
│   Loading     │    │   & Variable    │    │ & Constraints   │
│              │    │  Substitution   │    │                 │
└───────────────┘    └─────────────────┘    └─────────────────┘
        │                       │                       │
        └───────────────────────┼───────────────────────┘
                                │
                    ┌───────────────────────┐
                    │   Final Prompt        │
                    │   Construction        │
                    │  (System + User +     │
                    │   Context Messages)   │
                    └───────────────────────┘
                                │
                    ┌───────────────────────┐
                    │   Token Optimization  │
                    │   & Length Control    │
                    └───────────────────────┘
```

### **Core Prompt Engineering Interface**
```csharp
public interface IPromptEngine
{
    // Template management
    Task<PromptTemplate> GetTemplateAsync(PromptTemplateType type, string? variant = null);
    Task<List<PromptTemplate>> GetAllTemplatesAsync();
    Task RegisterTemplateAsync(PromptTemplate template);
    Task UpdateTemplateAsync(PromptTemplate template);
    
    // Prompt generation
    Task<GeneratedPrompt> GeneratePromptAsync(PromptRequest request);
    Task<GeneratedPrompt> GeneratePromptFromTemplateAsync(string templateId, Dictionary<string, object> variables);
    
    // Context integration
    Task<GeneratedPrompt> InjectContextAsync(GeneratedPrompt basePrompt, EnhancedContext context);
    Task<GeneratedPrompt> OptimizeForTokenLimitAsync(GeneratedPrompt prompt, int maxTokens);
    
    // Specialized prompt generation
    Task<GeneratedPrompt> GenerateNPCDialoguePromptAsync(NPCDialoguePromptRequest request);
    Task<GeneratedPrompt> GenerateWorldBuildingPromptAsync(WorldBuildingPromptRequest request);
    Task<GeneratedPrompt> GenerateCharacterCreationPromptAsync(CharacterCreationPromptRequest request);
    Task<GeneratedPrompt> GenerateQuestGenerationPromptAsync(QuestGenerationPromptRequest request);
    
    // Prompt validation and testing
    Task<PromptValidationResult> ValidatePromptAsync(GeneratedPrompt prompt);
    Task<PromptTestResult> TestPromptAsync(GeneratedPrompt prompt, AIProvider provider);
}

public enum PromptTemplateType
{
    // Core system prompts
    SystemBase,
    SystemNPC,
    SystemWorldBuilding,
    SystemCharacterCreation,
    SystemQuestGeneration,
    SystemRulesEngine,
    
    // Dialogue prompts
    NPCDialogue,
    NPCPersonality,
    NPCEmotionalState,
    NPCKnowledgeCheck,
    
    // Content generation prompts
    WorldDescription,
    LocationDescription,
    QuestGeneration,
    ItemDescription,
    SpellDescription,
    
    // Character prompts
    CharacterBackground,
    CharacterPersonality,
    CharacterMotivation,
    CharacterAppearance,
    
    // Utility prompts
    ContentSummary,
    ContextCompression,
    QualityAssurance,
    ContentModeration
}
```

### **Prompt Template Models**
```csharp
public class PromptTemplate
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public PromptTemplateType Type { get; set; }
    public string Version { get; set; } = "1.0";
    
    // Template content
    public string SystemMessage { get; set; } = string.Empty;
    public string UserMessageTemplate { get; set; } = string.Empty;
    public List<PromptMessage> AdditionalMessages { get; set; } = new();
    
    // Template variables and constraints
    public List<PromptVariable> Variables { get; set; } = new();
    public PromptConstraints Constraints { get; set; } = new();
    public PromptMetadata Metadata { get; set; } = new();
    
    // Output formatting
    public OutputFormat OutputFormat { get; set; } = new();
    public List<string> RequiredFields { get; set; } = new();
    public Dictionary<string, object> ValidationRules { get; set; } = new();
    
    // Usage and optimization
    public PromptUsageStats UsageStats { get; set; } = new();
    public List<string> Tags { get; set; } = new();
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class PromptVariable
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public VariableType Type { get; set; }
    public bool IsRequired { get; set; } = true;
    public object? DefaultValue { get; set; }
    public List<string> AllowedValues { get; set; } = new();
    public VariableConstraints Constraints { get; set; } = new();
}

public enum VariableType
{
    String,
    Integer,
    Float,
    Boolean,
    Array,
    Object,
    Context,
    Template
}

public class PromptConstraints
{
    public int? MaxTokens { get; set; }
    public int? MinTokens { get; set; }
    public float? Temperature { get; set; }
    public float? TopP { get; set; }
    public List<string> StopSequences { get; set; } = new();
    public List<string> RequiredKeywords { get; set; } = new();
    public List<string> ForbiddenKeywords { get; set; } = new();
    public ContentSafetyLevel SafetyLevel { get; set; } = ContentSafetyLevel.Moderate;
}

public class GeneratedPrompt
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string TemplateId { get; set; } = string.Empty;
    public PromptTemplateType Type { get; set; }
    
    // Generated messages
    public List<PromptMessage> Messages { get; set; } = new();
    public string SystemMessage { get; set; } = string.Empty;
    public string UserMessage { get; set; } = string.Empty;
    
    // Generation metadata
    public Dictionary<string, object> Variables { get; set; } = new();
    public EnhancedContext? Context { get; set; }
    public int EstimatedTokens { get; set; }
    public DateTime GeneratedAt { get; set; }
    
    // Optimization and constraints
    public PromptConstraints Constraints { get; set; } = new();
    public OutputFormat OutputFormat { get; set; } = new();
    public bool WasOptimized { get; set; }
    public string OptimizationNotes { get; set; } = string.Empty;
}

public class PromptMessage
{
    public string Role { get; set; } = string.Empty; // system, user, assistant, function
    public string Content { get; set; } = string.Empty;
    public string? Name { get; set; }
    public Dictionary<string, object> Metadata { get; set; } = new();
}
```

### **Specialized Prompt Templates**

#### **NPC Dialogue System Prompt**
```csharp
public static class NPCDialoguePrompts
{
    public const string SYSTEM_PROMPT = @"
# NPC Dialogue System

You are an advanced NPC (Non-Player Character) dialogue system for a D&D 5e campaign. Your role is to embody NPCs with consistent personalities, maintain campaign continuity, and provide engaging interactions that enhance the storytelling experience.

## Core Principles
1. **Personality Consistency**: Always maintain the NPC's established personality traits, speech patterns, and behavioral tendencies
2. **World Awareness**: Stay aware of the campaign world, current events, and the NPC's place within the larger narrative
3. **Relationship Dynamics**: Reflect the NPC's relationships with player characters and other NPCs in dialogue
4. **Emotional Intelligence**: Respond appropriately to the emotional context and social dynamics of interactions
5. **D&D Authenticity**: Maintain the fantasy setting and D&D 5e lore consistency

## Dialogue Guidelines
- **Stay In Character**: Never break character or reference being an AI
- **Show, Don't Tell**: Express personality through actions, word choice, and reactions rather than explicit statements
- **Maintain Consistency**: Remember previous interactions and maintain continuity
- **Respect Boundaries**: Follow content guidelines and maintain appropriate tone for the campaign
- **Enhance Story**: Look for opportunities to advance plot, reveal character depth, or create memorable moments

## Response Format
Structure your responses as:
```
[Optional: Brief action or emotional state]
""Dialogue content in character""
[Optional: Additional actions or reactions]
```

## Context Awareness
You have access to:
- NPC personality profile and background
- Current campaign context and world state
- Relationship history with player characters
- Recent events and ongoing storylines
- NPC's current emotional state and concerns

Always consider this context when crafting responses.
";

    public const string USER_MESSAGE_TEMPLATE = @"
## NPC Profile
**Name**: {{npc_name}}
**Role**: {{npc_role}}
**Current Location**: {{current_location}}
**Current Mood**: {{current_mood}}

### Personality
{{#personality_traits}}
- {{.}}
{{/personality_traits}}

### Current Concerns
{{#current_concerns}}
- {{.}}
{{/current_concerns}}

### Relationship with {{character_name}}
**Relationship Type**: {{relationship_type}}
**Disposition**: {{relationship_disposition}}
**Trust Level**: {{trust_level}}/10
**Recent Interactions**: {{recent_interaction_summary}}

## Current Situation
**Scene**: {{current_scene}}
**Atmosphere**: {{scene_atmosphere}}
**Other Present**: {{other_npcs_present}}

## Player Character's Action/Statement
{{player_input}}

## Additional Context
{{#if quest_context}}
**Related Quest**: {{quest_context}}
{{/if}}

{{#if recent_events}}
**Recent Events**:
{{#recent_events}}
- {{.}}
{{/recent_events}}
{{/if}}

---
Respond as {{npc_name}}, maintaining their personality and considering all the context provided. Keep the response natural and engaging while advancing the interaction meaningfully.
";
}
```

#### **World Building Prompt Templates**
```csharp
public static class WorldBuildingPrompts
{
    public const string LOCATION_GENERATION_SYSTEM = @"
# D&D Location Generation System

You are a master world-builder specializing in creating immersive D&D 5e locations. Your role is to generate detailed, atmospheric locations that feel authentic to the fantasy setting while serving the campaign's narrative needs.

## Generation Principles
1. **Atmospheric Immersion**: Create vivid sensory descriptions that transport players
2. **Functional Design**: Ensure locations serve clear narrative or mechanical purposes
3. **Layered Detail**: Provide immediate impressions, deeper exploration details, and hidden secrets
4. **Cultural Authenticity**: Reflect the appropriate cultural, historical, and magical context
5. **Adventure Potential**: Include hooks, mysteries, or challenges appropriate to the location type

## Location Components
Always include these elements:
- **Initial Impression**: What characters notice immediately
- **Sensory Details**: Sights, sounds, smells, textures, atmosphere
- **Notable Features**: Interesting architectural, natural, or magical elements
- **Inhabitants**: Who lives, works, or frequents this location
- **History & Significance**: Background that explains why this place matters
- **Adventure Hooks**: Potential plot threads, mysteries, or challenges
- **Practical Details**: Layout, accessibility, resources available

## Tone Considerations
- Match the campaign's established tone and themes
- Consider the danger level appropriate for the party
- Balance wonder and practicality
- Include both obvious and subtle details for different levels of investigation

## Output Format
Structure your response as a comprehensive location description with clear sections for easy reference during play.
";

    public const string QUEST_GENERATION_SYSTEM = @"
# D&D Quest Generation System

You are an expert quest designer for D&D 5e campaigns. Your role is to create engaging, well-structured quests that provide meaningful choices, appropriate challenges, and satisfying narrative progression.

## Quest Design Principles
1. **Clear Motivation**: Establish compelling reasons for characters to undertake the quest
2. **Meaningful Stakes**: Ensure success or failure has significant consequences
3. **Player Agency**: Provide multiple approaches and meaningful choices
4. **Scalable Challenge**: Design encounters appropriate for the party level
5. **Narrative Integration**: Connect to existing campaign themes and storylines

## Quest Structure
Include these components:
- **Hook**: How the quest is presented to the players
- **Objective**: Clear primary goal with potential secondary objectives
- **Obstacles**: Challenges that must be overcome (combat, social, exploration, puzzle)
- **NPCs**: Key characters involved in the quest
- **Locations**: Where the quest takes place
- **Rewards**: Appropriate compensation (XP, gold, items, story advancement)
- **Consequences**: What happens based on success, failure, or player choices
- **Complications**: Potential twists or unexpected developments

## Challenge Scaling
Consider party level when designing:
- Combat encounters (CR appropriate challenges)
- Skill check DCs (scaling with proficiency)
- Resource management (time, supplies, spell slots)
- Social complexity (relationship dynamics, political implications)

Design quests that can be adapted if players approach them unexpectedly.
";
}
```

#### **Character Creation Prompt Templates**
```csharp
public static class CharacterCreationPrompts
{
    public const string BACKGROUND_GENERATION_SYSTEM = @"
# D&D Character Background Generation System

You are a character background specialist for D&D 5e. Your role is to create rich, detailed character backgrounds that provide depth, motivation, and campaign integration opportunities while respecting player creative input.

## Background Creation Principles
1. **Personal History**: Develop a compelling personal story with formative events
2. **Motivation Clarity**: Establish clear drives, goals, and aspirations
3. **Relationship Web**: Create meaningful connections to NPCs, organizations, and locations
4. **Conflict Potential**: Include elements that can create interesting complications
5. **Campaign Integration**: Ensure the background fits the campaign setting and themes

## Background Components
Always include:
- **Early Life**: Childhood, family, formative experiences
- **Defining Moment**: Key event that shaped the character's worldview
- **Recent History**: What the character was doing before becoming an adventurer
- **Personality Formation**: How experiences shaped traits, ideals, bonds, and flaws
- **Skills & Knowledge**: What the character learned and how
- **Relationships**: Important people in the character's life
- **Secrets & Mysteries**: Hidden aspects that can drive future storylines
- **Goals & Motivations**: What drives the character forward

## Integration Considerations
- Connect to campaign themes and setting
- Provide GM hooks for future storylines
- Balance tragic and positive elements
- Ensure the background supports the chosen class and race
- Create opportunities for character growth and development

## Tone Guidelines
- Match the campaign's established tone
- Avoid overly tragic or overpowered backgrounds
- Focus on human elements that create emotional investment
- Include both strengths and vulnerabilities
- Emphasize potential for heroic growth

Generate backgrounds that feel authentic and provide rich material for both player roleplay and GM storytelling.
";

    public const string PERSONALITY_DEVELOPMENT_TEMPLATE = @"
## Character Foundation
**Name**: {{character_name}}
**Race**: {{character_race}}
**Class**: {{character_class}}
**Background**: {{character_background}}
**Level**: {{character_level}}

## Player Input
**Player's Vision**: {{player_vision}}
**Key Traits Requested**: {{requested_traits}}
**Important Relationships**: {{requested_relationships}}
**Personal Goals**: {{personal_goals}}

## Campaign Context
**Campaign Setting**: {{campaign_setting}}
**Campaign Themes**: {{campaign_themes}}
**Starting Location**: {{starting_location}}
**Party Composition**: {{party_members}}

## Development Focus
Please develop a comprehensive personality profile including:

1. **Core Personality Traits** (3-4 distinct traits that define behavior)
2. **Ideals** (What principles guide their decisions?)
3. **Bonds** (What/who do they care most about?)
4. **Flaws** (What weaknesses create interesting complications?)
5. **Mannerisms** (Distinctive behaviors, speech patterns, habits)
6. **Fears & Phobias** (What makes them uncomfortable or afraid?)
7. **Motivations** (What drives them to adventure?)
8. **Moral Compass** (How do they approach ethical dilemmas?)

## Background Integration
Weave the personality naturally into their background, showing how experiences shaped their worldview. Include specific examples of how these traits might manifest in gameplay situations.

Create a character who feels authentic, relatable, and ready for heroic adventure while providing rich material for roleplay and character development.
";
}
```

### **Prompt Engine Implementation**
```csharp
public class PromptEngine : IPromptEngine
{
    private readonly IPromptTemplateRepository _templateRepo;
    private readonly IContextService _contextService;
    private readonly ITokenEstimator _tokenEstimator;
    private readonly ILogger<PromptEngine> _logger;
    private readonly IMemoryCache _cache;
    private readonly PromptConfiguration _config;

    public async Task<GeneratedPrompt> GeneratePromptAsync(PromptRequest request)
    {
        // Get the appropriate template
        var template = await GetTemplateAsync(request.Type, request.Variant);
        
        // Prepare variables from request
        var variables = PrepareVariables(request, template);
        
        // Generate base prompt from template
        var basePrompt = await GenerateFromTemplateAsync(template, variables);
        
        // Inject context if available
        if (request.Context != null)
        {
            basePrompt = await InjectContextAsync(basePrompt, request.Context);
        }
        
        // Apply constraints and optimization
        if (request.MaxTokens.HasValue && basePrompt.EstimatedTokens > request.MaxTokens.Value)
        {
            basePrompt = await OptimizeForTokenLimitAsync(basePrompt, request.MaxTokens.Value);
        }
        
        // Validate the final prompt
        var validation = await ValidatePromptAsync(basePrompt);
        if (!validation.IsValid)
        {
            _logger.LogWarning("Generated prompt failed validation: {Issues}", 
                string.Join(", ", validation.Issues));
        }
        
        return basePrompt;
    }

    public async Task<GeneratedPrompt> GenerateNPCDialoguePromptAsync(NPCDialoguePromptRequest request)
    {
        var template = await GetTemplateAsync(PromptTemplateType.NPCDialogue);
        
        var variables = new Dictionary<string, object>
        {
            ["npc_name"] = request.NPC.Name,
            ["npc_role"] = request.NPC.SocialRole ?? "Unknown",
            ["current_location"] = request.NPC.CurrentLocation ?? "Unknown location",
            ["current_mood"] = request.NPC.CurrentMood ?? "Neutral",
            ["personality_traits"] = request.NPC.Personality?.PersonalityTraits ?? new List<string>(),
            ["current_concerns"] = request.NPC.CurrentConcerns ?? new List<string>(),
            ["character_name"] = request.PlayerCharacter?.Name ?? "Adventurer",
            ["relationship_type"] = GetRelationshipType(request.NPC, request.PlayerCharacter?.CharacterId),
            ["relationship_disposition"] = GetRelationshipDisposition(request.NPC, request.PlayerCharacter?.CharacterId),
            ["trust_level"] = GetTrustLevel(request.NPC, request.PlayerCharacter?.CharacterId),
            ["recent_interaction_summary"] = GetRecentInteractionSummary(request.NPC, request.PlayerCharacter?.CharacterId),
            ["current_scene"] = request.SceneContext?.Description ?? "General interaction",
            ["scene_atmosphere"] = request.SceneContext?.Atmosphere ?? "Neutral",
            ["other_npcs_present"] = request.SceneContext?.OtherNPCs ?? new List<string>(),
            ["player_input"] = request.PlayerInput,
            ["quest_context"] = request.QuestContext,
            ["recent_events"] = request.RecentEvents ?? new List<string>()
        };

        var prompt = await GenerateFromTemplateAsync(template, variables);
        
        // Add NPC-specific system message
        prompt.SystemMessage = NPCDialoguePrompts.SYSTEM_PROMPT;
        
        // Apply NPC-specific constraints
        prompt.Constraints.Temperature = CalculateNPCTemperature(request.NPC);
        prompt.Constraints.MaxTokens = 500; // Keep dialogue responses concise
        
        return prompt;
    }

    public async Task<GeneratedPrompt> GenerateWorldBuildingPromptAsync(WorldBuildingPromptRequest request)
    {
        PromptTemplate template;
        
        switch (request.ContentType)
        {
            case WorldBuildingContentType.Location:
                template = await GetTemplateAsync(PromptTemplateType.LocationDescription);
                break;
            case WorldBuildingContentType.Quest:
                template = await GetTemplateAsync(PromptTemplateType.QuestGeneration);
                break;
            default:
                template = await GetTemplateAsync(PromptTemplateType.WorldDescription);
                break;
        }

        var variables = new Dictionary<string, object>
        {
            ["content_type"] = request.ContentType.ToString(),
            ["campaign_setting"] = request.CampaignContext?.Name ?? "Generic Fantasy",
            ["campaign_tone"] = request.CampaignContext?.Tone?.PrimaryTone ?? "Balanced",
            ["party_level"] = request.PartyLevel,
            ["location_type"] = request.LocationType ?? "Unknown",
            ["danger_level"] = request.DangerLevel ?? "Moderate",
            ["themes"] = request.CampaignContext?.Themes ?? new List<string>(),
            ["existing_lore"] = request.ExistingLore ?? new List<string>(),
            ["requirements"] = request.SpecificRequirements ?? new List<string>(),
            ["avoid_elements"] = request.ElementsToAvoid ?? new List<string>()
        };

        var prompt = await GenerateFromTemplateAsync(template, variables);
        
        // Apply world-building specific constraints
        prompt.Constraints.Temperature = 0.8f; // Higher creativity for world building
        prompt.Constraints.MaxTokens = request.MaxLength ?? 1500;
        
        return prompt;
    }

    private async Task<GeneratedPrompt> GenerateFromTemplateAsync(PromptTemplate template, Dictionary<string, object> variables)
    {
        var prompt = new GeneratedPrompt
        {
            TemplateId = template.Id,
            Type = template.Type,
            Variables = variables,
            GeneratedAt = DateTime.UtcNow,
            Constraints = template.Constraints,
            OutputFormat = template.OutputFormat
        };

        // Process system message
        prompt.SystemMessage = await ProcessTemplateString(template.SystemMessage, variables);
        
        // Process user message template
        var userMessage = await ProcessTemplateString(template.UserMessageTemplate, variables);
        
        // Build messages list
        prompt.Messages = new List<PromptMessage>
        {
            new() { Role = "system", Content = prompt.SystemMessage }
        };
        
        // Add additional template messages
        foreach (var additionalMessage in template.AdditionalMessages)
        {
            var processedContent = await ProcessTemplateString(additionalMessage.Content, variables);
            prompt.Messages.Add(new PromptMessage
            {
                Role = additionalMessage.Role,
                Content = processedContent,
                Name = additionalMessage.Name,
                Metadata = additionalMessage.Metadata
            });
        }
        
        // Add user message
        prompt.Messages.Add(new PromptMessage { Role = "user", Content = userMessage });
        prompt.UserMessage = userMessage;
        
        // Estimate tokens
        prompt.EstimatedTokens = await _tokenEstimator.EstimateTokensAsync(prompt.Messages);
        
        return prompt;
    }

    private async Task<string> ProcessTemplateString(string template, Dictionary<string, object> variables)
    {
        // Use Handlebars.NET or similar templating engine
        var handlebars = Handlebars.Create();
        
        // Register custom helpers for D&D-specific formatting
        handlebars.RegisterHelper("capitalize", (writer, context, parameters) =>
        {
            if (parameters.Length > 0 && parameters[0] is string str)
            {
                writer.WriteSafeString(char.ToUpper(str[0]) + str.Substring(1).ToLower());
            }
        });
        
        handlebars.RegisterHelper("pluralize", (writer, context, parameters) =>
        {
            if (parameters.Length > 1 && parameters[0] is int count && parameters[1] is string word)
            {
                writer.WriteSafeString(count == 1 ? word : word + "s");
            }
        });
        
        var compiledTemplate = handlebars.Compile(template);
        return compiledTemplate(variables);
    }

    private float CalculateNPCTemperature(NPCContext npc)
    {
        // Adjust temperature based on NPC personality
        float baseTemperature = 0.7f;
        
        if (npc.Personality != null)
        {
            // More extraverted NPCs get higher temperature (more varied responses)
            baseTemperature += (npc.Personality.Extraversion - 0.5f) * 0.2f;
            
            // More neurotic NPCs get higher temperature (more unpredictable)
            baseTemperature += (npc.Personality.Neuroticism - 0.5f) * 0.1f;
            
            // More open NPCs get higher temperature (more creative responses)
            baseTemperature += (npc.Personality.Openness - 0.5f) * 0.15f;
        }
        
        return Math.Clamp(baseTemperature, 0.1f, 1.0f);
    }
}
```

This comprehensive prompt engineering framework ensures consistent, high-quality AI outputs tailored to specific D&D use cases while maintaining flexibility and optimization capabilities.
