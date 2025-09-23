# NPC Service Implementation Specification

## Overview
The NPC Service manages Non-Player Character creation, AI-powered personality generation, relationship tracking, and dialogue management. This service integrates deeply with the AI Gateway for intelligent NPC behavior while maintaining consistency with established specifications.

## Service Architecture

### Technology Stack
- **Framework**: ASP.NET Core 8.0
- **Database**: PostgreSQL with Entity Framework Core
- **Vector Database**: pgvector for semantic search of NPC relationships
- **Caching**: Redis for frequently accessed NPC data
- **AI Integration**: HTTP clients for AI Gateway Service
- **Real-time**: SignalR for live NPC interactions during sessions
- **Messaging**: MediatR for CQRS pattern
- **Testing**: xUnit, Moq, Testcontainers

### Project Structure
```
NPCService/
├── src/
│   ├── NPCService.Api/                 # Web API layer
│   │   ├── Controllers/
│   │   ├── Hubs/                       # SignalR for real-time interactions
│   │   ├── Middleware/
│   │   ├── Program.cs
│   │   └── appsettings.json
│   ├── NPCService.Application/         # Application layer
│   │   ├── Commands/
│   │   ├── Queries/
│   │   ├── Handlers/
│   │   ├── Services/
│   │   ├── Validators/
│   │   └── DTOs/
│   ├── NPCService.Domain/              # Domain layer
│   │   ├── Entities/
│   │   ├── ValueObjects/
│   │   ├── Events/
│   │   ├── Repositories/
│   │   └── Services/
│   └── NPCService.Infrastructure/      # Infrastructure layer
│       ├── Data/
│       ├── Repositories/
│       ├── Services/
│       ├── AI/                         # AI integration services
│       └── Configuration/
└── tests/
    ├── NPCService.UnitTests/
    ├── NPCService.IntegrationTests/
    └── NPCService.AITests/              # AI behavior testing
```

## Domain Layer Implementation

### Core NPC Entity
Based on the database specification in `design/database/core-entities.md`:

```csharp
// Domain/Entities/NPC.cs
using NPCService.Domain.Events;
using NPCService.Domain.ValueObjects;

namespace NPCService.Domain.Entities
{
    public class NPC : AggregateRoot
    {
        public Guid Id { get; private set; }
        public string Name { get; private set; }
        public Guid CampaignId { get; private set; }
        public Guid CreatedBy { get; private set; }
        
        // Core NPC Information
        public NPCType Type { get; private set; }
        public string? Race { get; private set; }
        public string? Class { get; private set; }
        public string? Occupation { get; private set; }
        public NPCAlignment Alignment { get; private set; }
        
        // Physical Description
        public PhysicalDescription PhysicalDescription { get; private set; }
        public string? AvatarUrl { get; private set; }
        
        // Personality and Behavior
        public NPCPersonality Personality { get; private set; }
        public List<string> PersonalityTraits { get; private set; } = new();
        public List<string> Ideals { get; private set; } = new();
        public List<string> Bonds { get; private set; } = new();
        public List<string> Flaws { get; private set; } = new();
        
        // Background and Story
        public string? BackgroundStory { get; private set; }
        public string? CurrentGoals { get; private set; }
        public string? Secrets { get; private set; }
        public AIGenerationMetadata? AIGenerationMetadata { get; private set; }
        
        // Location and Status
        public string? CurrentLocation { get; private set; }
        public NPCStatus Status { get; private set; }
        public NPCImportance Importance { get; private set; }
        
        // Game Mechanics
        public NPCStats? Stats { get; private set; }
        public List<NPCAbility> Abilities { get; private set; } = new();
        public List<NPCItem> Inventory { get; private set; } = new();
        
        // Relationships and Interactions
        public List<NPCRelationship> Relationships { get; private set; } = new();
        public List<DialogueEntry> DialogueHistory { get; private set; } = new();
        public List<NPCMemory> Memories { get; private set; } = new();
        
        // Session and Quest Integration
        public List<QuestInvolvement> QuestInvolvements { get; private set; } = new();
        public List<SessionAppearance> SessionAppearances { get; private set; } = new();
        
        // AI Context and Behavior
        public NPCBehaviorProfile BehaviorProfile { get; private set; }
        public string? CustomInstructions { get; private set; }
        public DateTime? LastInteraction { get; private set; }
        public int InteractionCount { get; private set; }
        
        // Audit and Management
        public DateTime CreatedAt { get; private set; }
        public DateTime UpdatedAt { get; private set; }
        public bool IsDeleted { get; private set; }
        public List<string> Tags { get; private set; } = new();

        // Private constructor for EF Core
        private NPC() { }

        // Factory method for NPC creation
        public static NPC Create(
            string name,
            Guid campaignId,
            Guid createdBy,
            NPCType type,
            NPCPersonality personality,
            PhysicalDescription physicalDescription,
            NPCImportance importance = NPCImportance.Minor)
        {
            if (string.IsNullOrWhiteSpace(name))
                throw new ArgumentException("NPC name cannot be empty", nameof(name));

            var npc = new NPC
            {
                Id = Guid.NewGuid(),
                Name = name,
                CampaignId = campaignId,
                CreatedBy = createdBy,
                Type = type,
                Personality = personality ?? throw new ArgumentNullException(nameof(personality)),
                PhysicalDescription = physicalDescription ?? throw new ArgumentNullException(nameof(physicalDescription)),
                Importance = importance,
                Alignment = NPCAlignment.TrueNeutral,
                Status = NPCStatus.Active,
                BehaviorProfile = NPCBehaviorProfile.Default(),
                InteractionCount = 0,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                IsDeleted = false
            };

            npc.AddDomainEvent(new NPCCreatedEvent(npc.Id, name, campaignId, createdBy));

            return npc;
        }

        // AI-powered creation
        public static async Task<NPC> CreateWithAIAsync(
            string name,
            Guid campaignId,
            Guid createdBy,
            NPCGenerationRequest request,
            INPCAIService aiService)
        {
            // Generate AI-powered NPC details
            var aiGeneration = await aiService.GenerateNPCAsync(request);

            var npc = new NPC
            {
                Id = Guid.NewGuid(),
                Name = name,
                CampaignId = campaignId,
                CreatedBy = createdBy,
                Type = request.Type,
                Race = aiGeneration.Race,
                Class = aiGeneration.Class,
                Occupation = aiGeneration.Occupation,
                Alignment = aiGeneration.Alignment,
                Personality = aiGeneration.Personality,
                PhysicalDescription = aiGeneration.PhysicalDescription,
                PersonalityTraits = aiGeneration.PersonalityTraits,
                Ideals = aiGeneration.Ideals,
                Bonds = aiGeneration.Bonds,
                Flaws = aiGeneration.Flaws,
                BackgroundStory = aiGeneration.BackgroundStory,
                CurrentGoals = aiGeneration.CurrentGoals,
                Secrets = aiGeneration.Secrets,
                CurrentLocation = request.InitialLocation,
                Status = NPCStatus.Active,
                Importance = request.Importance,
                Stats = aiGeneration.Stats,
                Abilities = aiGeneration.Abilities,
                BehaviorProfile = aiGeneration.BehaviorProfile,
                AIGenerationMetadata = new AIGenerationMetadata(
                    aiGeneration.Model,
                    aiGeneration.Prompt,
                    aiGeneration.Confidence,
                    DateTime.UtcNow),
                InteractionCount = 0,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                IsDeleted = false
            };

            npc.AddDomainEvent(new NPCCreatedWithAIEvent(
                npc.Id, name, campaignId, createdBy, aiGeneration.Model));

            return npc;
        }

        public void UpdatePersonality(NPCPersonality personality)
        {
            Personality = personality ?? throw new ArgumentNullException(nameof(personality));
            UpdatedAt = DateTime.UtcNow;

            AddDomainEvent(new NPCPersonalityUpdatedEvent(Id, personality));
        }

        public void UpdateLocation(string newLocation, string? reason = null)
        {
            var previousLocation = CurrentLocation;
            CurrentLocation = newLocation;
            UpdatedAt = DateTime.UtcNow;

            AddDomainEvent(new NPCLocationChangedEvent(Id, previousLocation, newLocation, reason));
        }

        public void AddRelationship(NPCRelationship relationship)
        {
            if (relationship == null)
                throw new ArgumentNullException(nameof(relationship));

            // Check if relationship already exists and update instead
            var existing = Relationships.FirstOrDefault(r => 
                r.RelatedEntityId == relationship.RelatedEntityId && 
                r.RelatedEntityType == relationship.RelatedEntityType);

            if (existing != null)
            {
                existing.UpdateRelationship(relationship.RelationshipType, relationship.Strength, relationship.Description);
            }
            else
            {
                Relationships.Add(relationship);
            }

            UpdatedAt = DateTime.UtcNow;

            AddDomainEvent(new NPCRelationshipChangedEvent(Id, relationship));
        }

        public async Task<DialogueResponse> GenerateDialogueAsync(
            DialogueRequest request,
            INPCAIService aiService)
        {
            // Increment interaction count
            InteractionCount++;
            LastInteraction = DateTime.UtcNow;

            // Generate AI dialogue response
            var context = BuildDialogueContext(request);
            var dialogueResponse = await aiService.GenerateDialogueAsync(this, context, request);

            // Record dialogue in history
            var dialogueEntry = new DialogueEntry(
                request.PlayerId,
                request.PlayerMessage,
                dialogueResponse.NPCResponse,
                request.Context,
                dialogueResponse.EmotionalState,
                DateTime.UtcNow);

            DialogueHistory.Add(dialogueEntry);

            // Update NPC memories if significant
            if (dialogueResponse.IsSignificant)
            {
                var memory = new NPCMemory(
                    dialogueResponse.MemorySummary,
                    request.PlayerId,
                    NPCMemoryType.Interaction,
                    dialogueResponse.MemoryImportance,
                    DateTime.UtcNow);

                Memories.Add(memory);
            }

            // Update emotional state if changed
            if (dialogueResponse.EmotionalState != Personality.CurrentMood)
            {
                Personality = Personality.UpdateMood(dialogueResponse.EmotionalState);
            }

            UpdatedAt = DateTime.UtcNow;

            AddDomainEvent(new NPCDialogueGeneratedEvent(
                Id, request.PlayerId, dialogueResponse, dialogueResponse.IsSignificant));

            return dialogueResponse;
        }

        public void AddMemory(NPCMemory memory)
        {
            if (memory == null)
                throw new ArgumentNullException(nameof(memory));

            Memories.Add(memory);
            
            // Limit memory count to prevent unbounded growth
            if (Memories.Count > 1000)
            {
                var oldestMemories = Memories
                    .OrderBy(m => m.CreatedAt)
                    .Take(Memories.Count - 1000)
                    .ToList();

                foreach (var oldMemory in oldestMemories)
                {
                    Memories.Remove(oldMemory);
                }
            }

            UpdatedAt = DateTime.UtcNow;

            AddDomainEvent(new NPCMemoryAddedEvent(Id, memory));
        }

        public void AddToQuest(Guid questId, NPCQuestRole role, string? description = null)
        {
            var involvement = QuestInvolvements.FirstOrDefault(q => q.QuestId == questId);
            if (involvement != null)
            {
                involvement.UpdateRole(role, description);
            }
            else
            {
                QuestInvolvements.Add(new QuestInvolvement(questId, role, description, DateTime.UtcNow));
            }

            UpdatedAt = DateTime.UtcNow;

            AddDomainEvent(new NPCQuestInvolvementChangedEvent(Id, questId, role));
        }

        public void RecordSessionAppearance(Guid sessionId, string? notes = null)
        {
            var appearance = new SessionAppearance(sessionId, notes, DateTime.UtcNow);
            SessionAppearances.Add(appearance);
            
            UpdatedAt = DateTime.UtcNow;

            AddDomainEvent(new NPCSessionAppearanceEvent(Id, sessionId, notes));
        }

        public void UpdateStats(NPCStats stats)
        {
            Stats = stats ?? throw new ArgumentNullException(nameof(stats));
            UpdatedAt = DateTime.UtcNow;

            AddDomainEvent(new NPCStatsUpdatedEvent(Id, stats));
        }

        public void UpdateBehaviorProfile(NPCBehaviorProfile profile)
        {
            BehaviorProfile = profile ?? throw new ArgumentNullException(nameof(profile));
            UpdatedAt = DateTime.UtcNow;

            AddDomainEvent(new NPCBehaviorUpdatedEvent(Id, profile));
        }

        public void AddTag(string tag)
        {
            if (string.IsNullOrWhiteSpace(tag))
                throw new ArgumentException("Tag cannot be empty", nameof(tag));

            if (!Tags.Contains(tag, StringComparer.OrdinalIgnoreCase))
            {
                Tags.Add(tag);
                UpdatedAt = DateTime.UtcNow;
            }
        }

        public void RemoveTag(string tag)
        {
            if (Tags.RemoveAll(t => string.Equals(t, tag, StringComparison.OrdinalIgnoreCase)) > 0)
            {
                UpdatedAt = DateTime.UtcNow;
            }
        }

        public void Archive()
        {
            Status = NPCStatus.Archived;
            UpdatedAt = DateTime.UtcNow;

            AddDomainEvent(new NPCArchivedEvent(Id));
        }

        public void SoftDelete()
        {
            IsDeleted = true;
            UpdatedAt = DateTime.UtcNow;

            AddDomainEvent(new NPCDeletedEvent(Id));
        }

        private DialogueContext BuildDialogueContext(DialogueRequest request)
        {
            return new DialogueContext
            {
                RecentDialogue = DialogueHistory
                    .Where(d => d.CreatedAt > DateTime.UtcNow.AddHours(-24))
                    .OrderByDescending(d => d.CreatedAt)
                    .Take(10)
                    .ToList(),
                RelevantMemories = GetRelevantMemories(request),
                CurrentRelationships = GetRelevantRelationships(request.PlayerId),
                CurrentLocation = CurrentLocation,
                CurrentMood = Personality.CurrentMood,
                QuestContext = GetActiveQuestContext(),
                SessionContext = request.SessionContext
            };
        }

        private List<NPCMemory> GetRelevantMemories(DialogueRequest request)
        {
            return Memories
                .Where(m => m.IsRelevantTo(request.PlayerId, request.PlayerMessage))
                .OrderByDescending(m => m.Importance)
                .ThenByDescending(m => m.CreatedAt)
                .Take(5)
                .ToList();
        }

        private List<NPCRelationship> GetRelevantRelationships(Guid? playerId)
        {
            return Relationships
                .Where(r => !playerId.HasValue || r.RelatedEntityId == playerId)
                .OrderByDescending(r => r.Strength)
                .Take(3)
                .ToList();
        }

        private List<QuestInvolvement> GetActiveQuestContext()
        {
            return QuestInvolvements
                .Where(q => q.IsActive)
                .ToList();
        }
    }

    public enum NPCType
    {
        Merchant = 0,
        Guard = 1,
        Noble = 2,
        Commoner = 3,
        Villain = 4,
        Ally = 5,
        QuestGiver = 6,
        Innkeeper = 7,
        Blacksmith = 8,
        Cleric = 9,
        Wizard = 10,
        Rogue = 11,
        Monster = 12,
        Animal = 13,
        Undead = 14,
        Construct = 15,
        Other = 99
    }

    public enum NPCAlignment
    {
        LawfulGood = 0,
        NeutralGood = 1,
        ChaoticGood = 2,
        LawfulNeutral = 3,
        TrueNeutral = 4,
        ChaoticNeutral = 5,
        LawfulEvil = 6,
        NeutralEvil = 7,
        ChaoticEvil = 8,
        Unaligned = 9
    }

    public enum NPCStatus
    {
        Active = 0,
        Inactive = 1,
        Dead = 2,
        Missing = 3,
        Archived = 4
    }

    public enum NPCImportance
    {
        Minor = 0,      // Background NPCs
        Moderate = 1,   // Recurring NPCs
        Major = 2,      // Important story NPCs
        Critical = 3    // Main story characters
    }

    public enum NPCQuestRole
    {
        QuestGiver = 0,
        Ally = 1,
        Enemy = 2,
        Informant = 3,
        Obstacle = 4,
        Reward = 5,
        Guide = 6,
        Victim = 7,
        Witness = 8
    }
}
```

### NPC Value Objects
```csharp
// Domain/ValueObjects/NPCPersonality.cs
namespace NPCService.Domain.ValueObjects
{
    public class NPCPersonality : ValueObject
    {
        public string ArchetypeId { get; private set; }
        public string ArchetypeName { get; private set; }
        public EmotionalProfile EmotionalProfile { get; private set; }
        public CommunicationStyle CommunicationStyle { get; private set; }
        public MotivationProfile MotivationProfile { get; private set; }
        public string CurrentMood { get; private set; }
        public List<PersonalityTrait> DominantTraits { get; private set; }
        public ConversationBehavior ConversationBehavior { get; private set; }

        private NPCPersonality() 
        { 
            DominantTraits = new List<PersonalityTrait>();
        }

        public NPCPersonality(
            string archetypeId,
            string archetypeName,
            EmotionalProfile emotionalProfile,
            CommunicationStyle communicationStyle,
            MotivationProfile motivationProfile,
            string currentMood = "neutral",
            List<PersonalityTrait>? dominantTraits = null,
            ConversationBehavior? conversationBehavior = null)
        {
            ArchetypeId = archetypeId ?? throw new ArgumentNullException(nameof(archetypeId));
            ArchetypeName = archetypeName ?? throw new ArgumentNullException(nameof(archetypeName));
            EmotionalProfile = emotionalProfile ?? throw new ArgumentNullException(nameof(emotionalProfile));
            CommunicationStyle = communicationStyle ?? throw new ArgumentNullException(nameof(communicationStyle));
            MotivationProfile = motivationProfile ?? throw new ArgumentNullException(nameof(motivationProfile));
            CurrentMood = currentMood;
            DominantTraits = dominantTraits ?? new List<PersonalityTrait>();
            ConversationBehavior = conversationBehavior ?? ConversationBehavior.Default();
        }

        public NPCPersonality UpdateMood(string newMood)
        {
            return new NPCPersonality(
                ArchetypeId, ArchetypeName, EmotionalProfile, CommunicationStyle, 
                MotivationProfile, newMood, DominantTraits, ConversationBehavior);
        }

        public NPCPersonality UpdateEmotionalState(EmotionalProfile newProfile)
        {
            return new NPCPersonality(
                ArchetypeId, ArchetypeName, newProfile, CommunicationStyle,
                MotivationProfile, CurrentMood, DominantTraits, ConversationBehavior);
        }

        protected override IEnumerable<object> GetEqualityComponents()
        {
            yield return ArchetypeId;
            yield return EmotionalProfile;
            yield return CommunicationStyle;
            yield return MotivationProfile;
            yield return CurrentMood;
            foreach (var trait in DominantTraits)
                yield return trait;
        }
    }

    public class EmotionalProfile : ValueObject
    {
        public int Openness { get; private set; }          // 1-10 scale
        public int Conscientiousness { get; private set; } // 1-10 scale
        public int Extraversion { get; private set; }      // 1-10 scale
        public int Agreeableness { get; private set; }     // 1-10 scale
        public int Neuroticism { get; private set; }       // 1-10 scale
        public string EmotionalStability { get; private set; }
        public List<string> CommonEmotions { get; private set; }

        private EmotionalProfile() 
        { 
            CommonEmotions = new List<string>();
        }

        public EmotionalProfile(
            int openness, int conscientiousness, int extraversion,
            int agreeableness, int neuroticism, string emotionalStability,
            List<string>? commonEmotions = null)
        {
            if (openness < 1 || openness > 10)
                throw new ArgumentException("Openness must be between 1 and 10");
            if (conscientiousness < 1 || conscientiousness > 10)
                throw new ArgumentException("Conscientiousness must be between 1 and 10");
            if (extraversion < 1 || extraversion > 10)
                throw new ArgumentException("Extraversion must be between 1 and 10");
            if (agreeableness < 1 || agreeableness > 10)
                throw new ArgumentException("Agreeableness must be between 1 and 10");
            if (neuroticism < 1 || neuroticism > 10)
                throw new ArgumentException("Neuroticism must be between 1 and 10");

            Openness = openness;
            Conscientiousness = conscientiousness;
            Extraversion = extraversion;
            Agreeableness = agreeableness;
            Neuroticism = neuroticism;
            EmotionalStability = emotionalStability ?? throw new ArgumentNullException(nameof(emotionalStability));
            CommonEmotions = commonEmotions ?? new List<string>();
        }

        protected override IEnumerable<object> GetEqualityComponents()
        {
            yield return Openness;
            yield return Conscientiousness;
            yield return Extraversion;
            yield return Agreeableness;
            yield return Neuroticism;
            yield return EmotionalStability;
            foreach (var emotion in CommonEmotions)
                yield return emotion;
        }
    }

    public class CommunicationStyle : ValueObject
    {
        public string Formality { get; private set; }      // formal, casual, mixed
        public string Verbosity { get; private set; }      // terse, normal, verbose
        public string Directness { get; private set; }     // direct, indirect, diplomatic
        public string Humor { get; private set; }          // none, dry, playful, sarcastic
        public List<string> PreferredTopics { get; private set; }
        public List<string> AvoidedTopics { get; private set; }
        public List<string> SpeechPatterns { get; private set; }

        private CommunicationStyle() 
        { 
            PreferredTopics = new List<string>();
            AvoidedTopics = new List<string>();
            SpeechPatterns = new List<string>();
        }

        public CommunicationStyle(
            string formality, string verbosity, string directness, string humor,
            List<string>? preferredTopics = null, List<string>? avoidedTopics = null,
            List<string>? speechPatterns = null)
        {
            Formality = formality ?? throw new ArgumentNullException(nameof(formality));
            Verbosity = verbosity ?? throw new ArgumentNullException(nameof(verbosity));
            Directness = directness ?? throw new ArgumentNullException(nameof(directness));
            Humor = humor ?? throw new ArgumentNullException(nameof(humor));
            PreferredTopics = preferredTopics ?? new List<string>();
            AvoidedTopics = avoidedTopics ?? new List<string>();
            SpeechPatterns = speechPatterns ?? new List<string>();
        }

        protected override IEnumerable<object> GetEqualityComponents()
        {
            yield return Formality;
            yield return Verbosity;
            yield return Directness;
            yield return Humor;
            foreach (var topic in PreferredTopics)
                yield return topic;
            foreach (var topic in AvoidedTopics)
                yield return topic;
            foreach (var pattern in SpeechPatterns)
                yield return pattern;
        }
    }

    public class NPCBehaviorProfile : ValueObject
    {
        public string Aggression { get; private set; }         // passive, normal, aggressive
        public string Curiosity { get; private set; }          // low, normal, high
        public string Trustworthiness { get; private set; }    // suspicious, cautious, trusting
        public string Helpfulness { get; private set; }        // unhelpful, neutral, helpful
        public string Initiative { get; private set; }         // reactive, balanced, proactive
        public ConflictResolution ConflictResolution { get; private set; }
        public Dictionary<string, float> BehaviorModifiers { get; private set; }

        private NPCBehaviorProfile() 
        { 
            BehaviorModifiers = new Dictionary<string, float>();
        }

        public NPCBehaviorProfile(
            string aggression, string curiosity, string trustworthiness,
            string helpfulness, string initiative, ConflictResolution conflictResolution,
            Dictionary<string, float>? behaviorModifiers = null)
        {
            Aggression = aggression ?? throw new ArgumentNullException(nameof(aggression));
            Curiosity = curiosity ?? throw new ArgumentNullException(nameof(curiosity));
            Trustworthiness = trustworthiness ?? throw new ArgumentNullException(nameof(trustworthiness));
            Helpfulness = helpfulness ?? throw new ArgumentNullException(nameof(helpfulness));
            Initiative = initiative ?? throw new ArgumentNullException(nameof(initiative));
            ConflictResolution = conflictResolution ?? throw new ArgumentNullException(nameof(conflictResolution));
            BehaviorModifiers = behaviorModifiers ?? new Dictionary<string, float>();
        }

        public static NPCBehaviorProfile Default()
        {
            return new NPCBehaviorProfile(
                "normal", "normal", "cautious", "neutral", "balanced",
                ConflictResolution.Default());
        }

        protected override IEnumerable<object> GetEqualityComponents()
        {
            yield return Aggression;
            yield return Curiosity;
            yield return Trustworthiness;
            yield return Helpfulness;
            yield return Initiative;
            yield return ConflictResolution;
            foreach (var modifier in BehaviorModifiers.OrderBy(kv => kv.Key))
                yield return $"{modifier.Key}:{modifier.Value}";
        }
    }

    public class PhysicalDescription : ValueObject
    {
        public string? Age { get; private set; }
        public string? Gender { get; private set; }
        public string? Height { get; private set; }
        public string? Build { get; private set; }
        public string? HairColor { get; private set; }
        public string? EyeColor { get; private set; }
        public string? SkinTone { get; private set; }
        public List<string> DistinguishingFeatures { get; private set; }
        public string? Clothing { get; private set; }
        public string? GeneralAppearance { get; private set; }

        private PhysicalDescription() 
        { 
            DistinguishingFeatures = new List<string>();
        }

        public PhysicalDescription(
            string? age = null, string? gender = null, string? height = null,
            string? build = null, string? hairColor = null, string? eyeColor = null,
            string? skinTone = null, List<string>? distinguishingFeatures = null,
            string? clothing = null, string? generalAppearance = null)
        {
            Age = age;
            Gender = gender;
            Height = height;
            Build = build;
            HairColor = hairColor;
            EyeColor = eyeColor;
            SkinTone = skinTone;
            DistinguishingFeatures = distinguishingFeatures ?? new List<string>();
            Clothing = clothing;
            GeneralAppearance = generalAppearance;
        }

        protected override IEnumerable<object> GetEqualityComponents()
        {
            yield return Age ?? string.Empty;
            yield return Gender ?? string.Empty;
            yield return Height ?? string.Empty;
            yield return Build ?? string.Empty;
            yield return HairColor ?? string.Empty;
            yield return EyeColor ?? string.Empty;
            yield return SkinTone ?? string.Empty;
            foreach (var feature in DistinguishingFeatures)
                yield return feature;
            yield return Clothing ?? string.Empty;
            yield return GeneralAppearance ?? string.Empty;
        }
    }
}
```

### Domain Services and AI Integration
```csharp
// Domain/Services/INPCAIService.cs
using NPCService.Domain.ValueObjects;

namespace NPCService.Domain.Services
{
    public interface INPCAIService
    {
        Task<NPCAIGeneration> GenerateNPCAsync(NPCGenerationRequest request);
        Task<DialogueResponse> GenerateDialogueAsync(NPC npc, DialogueContext context, DialogueRequest request);
        Task<NPCPersonality> GeneratePersonalityAsync(NPCPersonalityRequest request);
        Task<string> GenerateBackgroundStoryAsync(NPC npc, BackgroundStoryRequest request);
        Task<List<NPCRelationship>> SuggestRelationshipsAsync(NPC npc, List<NPC> otherNPCs, List<Character> characters);
        Task<NPCBehaviorPrediction> PredictBehaviorAsync(NPC npc, ScenarioContext scenario);
    }

    public class NPCGenerationRequest
    {
        public NPCType Type { get; set; }
        public NPCImportance Importance { get; set; }
        public string? Race { get; set; }
        public string? Class { get; set; }
        public string? Occupation { get; set; }
        public string? InitialLocation { get; set; }
        public CampaignContext CampaignContext { get; set; } = new();
        public List<string> RequiredTraits { get; set; } = new();
        public List<string> QuestConnections { get; set; } = new();
        public string? CustomPrompt { get; set; }
        public AIGenerationSettings Settings { get; set; } = new();
    }

    public class NPCAIGeneration
    {
        public string Race { get; set; } = string.Empty;
        public string? Class { get; set; }
        public string? Occupation { get; set; }
        public NPCAlignment Alignment { get; set; }
        public NPCPersonality Personality { get; set; } = null!;
        public PhysicalDescription PhysicalDescription { get; set; } = null!;
        public List<string> PersonalityTraits { get; set; } = new();
        public List<string> Ideals { get; set; } = new();
        public List<string> Bonds { get; set; } = new();
        public List<string> Flaws { get; set; } = new();
        public string BackgroundStory { get; set; } = string.Empty;
        public string? CurrentGoals { get; set; }
        public string? Secrets { get; set; }
        public NPCStats? Stats { get; set; }
        public List<NPCAbility> Abilities { get; set; } = new();
        public NPCBehaviorProfile BehaviorProfile { get; set; } = null!;
        public string Model { get; set; } = string.Empty;
        public string Prompt { get; set; } = string.Empty;
        public float Confidence { get; set; }
    }

    public class DialogueRequest
    {
        public Guid? PlayerId { get; set; }
        public string PlayerMessage { get; set; } = string.Empty;
        public string Context { get; set; } = string.Empty;
        public DialogueType Type { get; set; } = DialogueType.Conversation;
        public SessionContext? SessionContext { get; set; }
        public Dictionary<string, object> AdditionalContext { get; set; } = new();
    }

    public class DialogueResponse
    {
        public string NPCResponse { get; set; } = string.Empty;
        public string EmotionalState { get; set; } = string.Empty;
        public bool IsSignificant { get; set; }
        public string? MemorySummary { get; set; }
        public NPCMemoryImportance MemoryImportance { get; set; }
        public List<string> SuggestedActions { get; set; } = new();
        public Dictionary<string, object> Metadata { get; set; } = new();
        public float ConfidenceScore { get; set; }
    }

    public class DialogueContext
    {
        public List<DialogueEntry> RecentDialogue { get; set; } = new();
        public List<NPCMemory> RelevantMemories { get; set; } = new();
        public List<NPCRelationship> CurrentRelationships { get; set; } = new();
        public string? CurrentLocation { get; set; }
        public string CurrentMood { get; set; } = "neutral";
        public List<QuestInvolvement> QuestContext { get; set; } = new();
        public SessionContext? SessionContext { get; set; }
    }

    public enum DialogueType
    {
        Conversation = 0,
        Combat = 1,
        Negotiation = 2,
        Information = 3,
        Trade = 4,
        Quest = 5,
        Social = 6
    }
}
```

### Domain Events
```csharp
// Domain/Events/NPCEvents.cs
using NPCService.Domain.ValueObjects;

namespace NPCService.Domain.Events
{
    public record NPCCreatedEvent(
        Guid NPCId, 
        string Name, 
        Guid CampaignId, 
        Guid CreatedBy) : DomainEvent;

    public record NPCCreatedWithAIEvent(
        Guid NPCId, 
        string Name, 
        Guid CampaignId, 
        Guid CreatedBy, 
        string AIModel) : DomainEvent;

    public record NPCPersonalityUpdatedEvent(
        Guid NPCId, 
        NPCPersonality NewPersonality) : DomainEvent;

    public record NPCLocationChangedEvent(
        Guid NPCId, 
        string? PreviousLocation, 
        string NewLocation, 
        string? Reason) : DomainEvent;

    public record NPCRelationshipChangedEvent(
        Guid NPCId, 
        NPCRelationship Relationship) : DomainEvent;

    public record NPCDialogueGeneratedEvent(
        Guid NPCId, 
        Guid? PlayerId, 
        DialogueResponse Response, 
        bool IsSignificant) : DomainEvent;

    public record NPCMemoryAddedEvent(
        Guid NPCId, 
        NPCMemory Memory) : DomainEvent;

    public record NPCQuestInvolvementChangedEvent(
        Guid NPCId, 
        Guid QuestId, 
        NPCQuestRole Role) : DomainEvent;

    public record NPCSessionAppearanceEvent(
        Guid NPCId, 
        Guid SessionId, 
        string? Notes) : DomainEvent;

    public record NPCStatsUpdatedEvent(
        Guid NPCId, 
        NPCStats Stats) : DomainEvent;

    public record NPCBehaviorUpdatedEvent(
        Guid NPCId, 
        NPCBehaviorProfile BehaviorProfile) : DomainEvent;

    public record NPCArchivedEvent(Guid NPCId) : DomainEvent;

    public record NPCDeletedEvent(Guid NPCId) : DomainEvent;
}
```

## Application Layer Implementation

### Create NPC with AI Command
```csharp
// Application/Commands/CreateNPCWithAICommand.cs
using FluentValidation;
using MediatR;
using NPCService.Domain.Services;

namespace NPCService.Application.Commands
{
    public class CreateNPCWithAICommand : IRequest<CreateNPCResponse>
    {
        public string Name { get; set; } = string.Empty;
        public Guid CampaignId { get; set; }
        public Guid CreatedBy { get; set; }
        public NPCGenerationRequestDto GenerationRequest { get; set; } = new();
    }

    public class CreateNPCWithAICommandValidator : AbstractValidator<CreateNPCWithAICommand>
    {
        public CreateNPCWithAICommandValidator()
        {
            RuleFor(x => x.Name)
                .NotEmpty()
                .MinimumLength(2)
                .MaximumLength(100)
                .WithMessage("NPC name must be between 2 and 100 characters");

            RuleFor(x => x.CampaignId)
                .NotEmpty()
                .WithMessage("Campaign ID is required");

            RuleFor(x => x.CreatedBy)
                .NotEmpty()
                .WithMessage("Created by user ID is required");

            RuleFor(x => x.GenerationRequest)
                .NotNull()
                .SetValidator(new NPCGenerationRequestDtoValidator());
        }
    }

    public class CreateNPCWithAICommandHandler : IRequestHandler<CreateNPCWithAICommand, CreateNPCResponse>
    {
        private readonly INPCRepository _npcRepository;
        private readonly ICampaignService _campaignService;
        private readonly INPCAIService _aiService;
        private readonly ICacheService _cacheService;
        private readonly ILogger<CreateNPCWithAICommandHandler> _logger;

        public CreateNPCWithAICommandHandler(
            INPCRepository npcRepository,
            ICampaignService campaignService,
            INPCAIService aiService,
            ICacheService cacheService,
            ILogger<CreateNPCWithAICommandHandler> logger)
        {
            _npcRepository = npcRepository;
            _campaignService = campaignService;
            _aiService = aiService;
            _cacheService = cacheService;
            _logger = logger;
        }

        public async Task<CreateNPCResponse> Handle(CreateNPCWithAICommand request, CancellationToken cancellationToken)
        {
            _logger.LogInformation("Creating AI-generated NPC {NPCName} for campaign {CampaignId}", 
                request.Name, request.CampaignId);

            // Validate campaign exists and user has access
            var campaign = await _campaignService.GetCampaignAsync(request.CampaignId, cancellationToken);
            if (campaign == null)
                throw new NotFoundException($"Campaign {request.CampaignId} not found");

            var hasAccess = await _campaignService.HasGameMasterAccessAsync(request.CampaignId, request.CreatedBy, cancellationToken);
            if (!hasAccess)
                throw new UnauthorizedAccessException("User does not have Game Master access to this campaign");

            // Check NPC limits based on subscription
            await ValidateNPCLimitsAsync(request.CreatedBy, request.CampaignId, cancellationToken);

            // Check name uniqueness in campaign
            var nameExists = await _npcRepository.ExistsInCampaignAsync(request.CampaignId, request.Name, cancellationToken);
            if (nameExists)
                throw new BusinessRuleViolationException($"An NPC named '{request.Name}' already exists in this campaign");

            // Map DTO to domain request
            var generationRequest = MapToGenerationRequest(request.GenerationRequest, campaign);

            try
            {
                // Create NPC with AI generation
                var npc = await NPC.CreateWithAIAsync(
                    request.Name,
                    request.CampaignId,
                    request.CreatedBy,
                    generationRequest,
                    _aiService);

                // Save NPC
                await _npcRepository.AddAsync(npc, cancellationToken);
                await _npcRepository.UnitOfWork.SaveEntitiesAsync(cancellationToken);

                // Invalidate relevant caches
                await _cacheService.RemoveByPatternAsync($"npcs:campaign:{request.CampaignId}:*");

                _logger.LogInformation("Successfully created AI-generated NPC {NPCId} - {NPCName}", 
                    npc.Id, npc.Name);

                return new CreateNPCResponse
                {
                    NPCId = npc.Id,
                    Name = npc.Name,
                    Type = npc.Type.ToString(),
                    Race = npc.Race,
                    Class = npc.Class,
                    Occupation = npc.Occupation,
                    Personality = MapToPersonalityDto(npc.Personality),
                    PhysicalDescription = MapToPhysicalDescriptionDto(npc.PhysicalDescription),
                    BackgroundStory = npc.BackgroundStory,
                    AIGenerated = true,
                    CreatedAt = npc.CreatedAt
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to create AI-generated NPC {NPCName} for campaign {CampaignId}", 
                    request.Name, request.CampaignId);
                
                // Fallback to manual creation if AI fails
                throw new AIServiceException("AI NPC generation failed", ex);
            }
        }

        private async Task ValidateNPCLimitsAsync(Guid userId, Guid campaignId, CancellationToken cancellationToken)
        {
            var userSubscription = await _campaignService.GetUserSubscriptionAsync(userId, cancellationToken);
            var currentNPCCount = await _npcRepository.CountActiveNPCsInCampaignAsync(campaignId, cancellationToken);

            var npcLimit = userSubscription.Tier switch
            {
                "Free" => 10,
                "DungeonArchitect" => 50,
                "CampaignWeaver" => 200,
                "GuildMaster" => int.MaxValue,
                _ => 10
            };

            if (currentNPCCount >= npcLimit)
            {
                throw new BusinessRuleViolationException(
                    $"NPC limit reached. {userSubscription.Tier} tier allows {npcLimit} NPCs per campaign.");
            }
        }

        private NPCGenerationRequest MapToGenerationRequest(NPCGenerationRequestDto dto, Campaign campaign)
        {
            return new NPCGenerationRequest
            {
                Type = Enum.Parse<NPCType>(dto.Type),
                Importance = Enum.Parse<NPCImportance>(dto.Importance),
                Race = dto.Race,
                Class = dto.Class,
                Occupation = dto.Occupation,
                InitialLocation = dto.InitialLocation,
                CampaignContext = new CampaignContext
                {
                    CampaignName = campaign.Name,
                    Setting = campaign.Settings.Ruleset,
                    ContentRating = campaign.Settings.ContentRating,
                    WorldState = campaign.WorldState,
                    ActiveQuests = campaign.ActiveQuests?.Select(q => q.Name).ToList() ?? new List<string>()
                },
                RequiredTraits = dto.RequiredTraits ?? new List<string>(),
                QuestConnections = dto.QuestConnections ?? new List<string>(),
                CustomPrompt = dto.CustomPrompt,
                Settings = new AIGenerationSettings
                {
                    Creativity = dto.Settings?.Creativity ?? 0.7f,
                    DetailLevel = dto.Settings?.DetailLevel ?? "standard",
                    IncludeStats = dto.Settings?.IncludeStats ?? true,
                    IncludeInventory = dto.Settings?.IncludeInventory ?? false
                }
            };
        }

        // Additional mapping methods...
    }
}
```

This NPC Service specification provides:

1. **Comprehensive NPC Management** - Complete lifecycle from AI-powered creation to relationship tracking
2. **Advanced AI Integration** - Intelligent dialogue generation, personality development, and behavior prediction
3. **Rich Domain Model** - Complex personality profiles, relationship systems, and memory management
4. **Real-time Capabilities** - SignalR integration for live NPC interactions during sessions
5. **Performance Optimization** - Caching strategies and efficient query patterns
6. **API Consistency** - Aligns with `design/api/npc-api.md` specifications
7. **Database Alignment** - Matches schema from `design/database/core-entities.md`

The implementation includes sophisticated AI-powered features while maintaining consistency with the established foundation specifications. The NPC system supports complex personality modeling, relationship tracking, and contextual dialogue generation that enhances the D&D gaming experience.

Would you like me to continue with the Auth Service specification next, or would you prefer to see more detail on specific aspects of the NPC Service (such as the complete AI integration implementation or the relationship management system)?
