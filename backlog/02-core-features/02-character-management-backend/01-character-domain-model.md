# Character Domain Model Implementation

## Story
**As a** Player  
**I want** a comprehensive D&D 5e compliant character domain model  
**So that** I can create, manage, and progress characters according to official D&D rules

## Acceptance Criteria
- [ ] Character aggregate root with D&D 5e compliance
- [ ] Ability scores with racial bonuses and modifiers
- [ ] Race, class, and background system implementation
- [ ] Equipment and inventory management
- [ ] Spell system integration for casters
- [ ] Character progression and leveling mechanics
- [ ] Proper validation of D&D 5e rules
- [ ] Domain events for character lifecycle

## Technical References
- **Technical Specification**: Section 2.1.3 Character Management - REQ-CHAR-001 to REQ-CHAR-005
- **Service Specification**: Character Service - Character Domain Model
- **Business Logic**: Character System - D&D 5e Rules Engine
- **Playbook Reference**: Phase 2, Week 3, Day 4-5: Character Service

## Implementation Details

### Character Aggregate Root
```csharp
public class Character : AggregateRoot<Guid>
{
    public string Name { get; private set; }
    public Guid PlayerId { get; private set; }
    public Guid? CampaignId { get; private set; }
    public int Level { get; private set; }
    public int ExperiencePoints { get; private set; }
    public CharacterStatus Status { get; private set; }
    
    // Core D&D 5e Properties
    public Race Race { get; private set; }
    public CharacterClass CharacterClass { get; private set; }
    public Background Background { get; private set; }
    public AbilityScores AbilityScores { get; private set; }
    public HitPoints HitPoints { get; private set; }
    public ArmorClass ArmorClass { get; private set; }
    
    // Collections
    private readonly List<Skill> _skills = new();
    private readonly List<Equipment> _equipment = new();
    private readonly List<Spell> _spells = new();
    private readonly List<ClassFeature> _classFeatures = new();
    private readonly List<Feat> _feats = new();
    
    public IReadOnlyCollection<Skill> Skills => _skills.AsReadOnly();
    public IReadOnlyCollection<Equipment> Equipment => _equipment.AsReadOnly();
    public IReadOnlyCollection<Spell> Spells => _spells.AsReadOnly();
    public IReadOnlyCollection<ClassFeature> ClassFeatures => _classFeatures.AsReadOnly();
    public IReadOnlyCollection<Feat> Feats => _feats.AsReadOnly();
    
    // Character Creation
    public static Character Create(
        string name,
        Guid playerId,
        Race race,
        CharacterClass characterClass,
        Background background,
        AbilityScores abilityScores)
    {
        var character = new Character
        {
            Id = Guid.NewGuid(),
            Name = name,
            PlayerId = playerId,
            Level = 1,
            ExperiencePoints = 0,
            Status = CharacterStatus.Active,
            Race = race,
            CharacterClass = characterClass,
            Background = background,
            AbilityScores = abilityScores.ApplyRacialBonuses(race)
        };
        
        character.InitializeStartingFeatures();
        character.CalculateDerivedStats();
        
        character.RaiseDomainEvent(new CharacterCreatedEvent(character.Id, playerId, name));
        
        return character;
    }
    
    // Level Progression
    public void GainExperience(int experienceGained)
    {
        if (experienceGained <= 0)
            throw new DomainException("Experience gained must be positive");
            
        ExperiencePoints += experienceGained;
        
        var newLevel = ExperienceTable.GetLevelForExperience(ExperiencePoints);
        if (newLevel > Level)
        {
            LevelUp(newLevel);
        }
        
        RaiseDomainEvent(new ExperienceGainedEvent(Id, experienceGained, ExperiencePoints));
    }
    
    public void LevelUp(int newLevel)
    {
        if (newLevel <= Level || newLevel > 20)
            throw new DomainException($"Invalid level progression: {Level} -> {newLevel}");
            
        var oldLevel = Level;
        Level = newLevel;
        
        // Apply level-up benefits
        ApplyLevelUpBenefits(oldLevel, newLevel);
        CalculateDerivedStats();
        
        RaiseDomainEvent(new CharacterLeveledUpEvent(Id, oldLevel, newLevel));
    }
    
    // Equipment Management
    public void EquipItem(Equipment item)
    {
        ValidateEquipment(item);
        
        // Unequip conflicting items
        UnequipConflictingItems(item);
        
        item.Equip();
        _equipment.Add(item);
        
        CalculateDerivedStats(); // Recalculate AC, bonuses, etc.
        
        RaiseDomainEvent(new ItemEquippedEvent(Id, item.Id, item.Name));
    }
    
    public void UnequipItem(Guid itemId)
    {
        var item = _equipment.FirstOrDefault(e => e.Id == itemId);
        if (item == null)
            throw new DomainException("Item not found in character's equipment");
            
        item.Unequip();
        CalculateDerivedStats();
        
        RaiseDomainEvent(new ItemUnequippedEvent(Id, itemId, item.Name));
    }
    
    // Spell Management (for casters)
    public void LearnSpell(Spell spell)
    {
        if (!CharacterClass.CanCastSpells)
            throw new DomainException($"{CharacterClass.Name} cannot cast spells");
            
        if (!CanLearnSpell(spell))
            throw new DomainException($"Cannot learn spell: {spell.Name}");
            
        _spells.Add(spell);
        
        RaiseDomainEvent(new SpellLearnedEvent(Id, spell.Id, spell.Name, spell.Level));
    }
    
    private void InitializeStartingFeatures()
    {
        // Add racial features
        foreach (var feature in Race.Features)
        {
            _classFeatures.Add(feature);
        }
        
        // Add class features for level 1
        foreach (var feature in CharacterClass.GetFeaturesForLevel(1))
        {
            _classFeatures.Add(feature);
        }
        
        // Add background features
        foreach (var feature in Background.Features)
        {
            _classFeatures.Add(feature);
        }
        
        // Initialize skills
        InitializeSkills();
    }
    
    private void CalculateDerivedStats()
    {
        // Calculate hit points
        HitPoints = CalculateHitPoints();
        
        // Calculate armor class
        ArmorClass = CalculateArmorClass();
        
        // Update skill modifiers
        UpdateSkillModifiers();
    }
}
```

### D&D 5e Value Objects
```csharp
public class AbilityScores : ValueObject
{
    public int Strength { get; private set; }
    public int Dexterity { get; private set; }
    public int Constitution { get; private set; }
    public int Intelligence { get; private set; }
    public int Wisdom { get; private set; }
    public int Charisma { get; private set; }
    
    public AbilityScores(int str, int dex, int con, int intel, int wis, int cha)
    {
        ValidateAbilityScore(str, nameof(Strength));
        ValidateAbilityScore(dex, nameof(Dexterity));
        ValidateAbilityScore(con, nameof(Constitution));
        ValidateAbilityScore(intel, nameof(Intelligence));
        ValidateAbilityScore(wis, nameof(Wisdom));
        ValidateAbilityScore(cha, nameof(Charisma));
        
        Strength = str;
        Dexterity = dex;
        Constitution = con;
        Intelligence = intel;
        Wisdom = wis;
        Charisma = cha;
    }
    
    public AbilityScores ApplyRacialBonuses(Race race)
    {
        return new AbilityScores(
            Strength + race.StrengthBonus,
            Dexterity + race.DexterityBonus,
            Constitution + race.ConstitutionBonus,
            Intelligence + race.IntelligenceBonus,
            Wisdom + race.WisdomBonus,
            Charisma + race.CharismaBonus
        );
    }
    
    public int GetModifier(AbilityType ability)
    {
        var score = ability switch
        {
            AbilityType.Strength => Strength,
            AbilityType.Dexterity => Dexterity,
            AbilityType.Constitution => Constitution,
            AbilityType.Intelligence => Intelligence,
            AbilityType.Wisdom => Wisdom,
            AbilityType.Charisma => Charisma,
            _ => throw new ArgumentException($"Invalid ability type: {ability}")
        };
        
        return (score - 10) / 2;
    }
    
    private static void ValidateAbilityScore(int score, string abilityName)
    {
        if (score < 3 || score > 20)
            throw new DomainException($"{abilityName} must be between 3 and 20");
    }
}

public class Race : ValueObject
{
    public string Name { get; private set; }
    public string Subrace { get; private set; }
    public int Size { get; private set; }
    public int Speed { get; private set; }
    
    // Racial ability score improvements
    public int StrengthBonus { get; private set; }
    public int DexterityBonus { get; private set; }
    public int ConstitutionBonus { get; private set; }
    public int IntelligenceBonus { get; private set; }
    public int WisdomBonus { get; private set; }
    public int CharismaBonus { get; private set; }
    
    public IReadOnlyCollection<RacialFeature> Features { get; private set; }
    public IReadOnlyCollection<Language> Languages { get; private set; }
    public IReadOnlyCollection<Proficiency> Proficiencies { get; private set; }
    
    // Common D&D 5e races
    public static Race Human => new Race("Human", "", 30, 1, 1, 1, 1, 1, 1, new List<RacialFeature>(), new List<Language>(), new List<Proficiency>());
    public static Race Elf => new Race("Elf", "", 30, 0, 2, 0, 0, 0, 0, new List<RacialFeature>(), new List<Language>(), new List<Proficiency>());
    public static Race Dwarf => new Race("Dwarf", "", 25, 0, 0, 2, 0, 0, 0, new List<RacialFeature>(), new List<Language>(), new List<Proficiency>());
    public static Race Halfling => new Race("Halfling", "", 25, 0, 2, 0, 0, 0, 0, new List<RacialFeature>(), new List<Language>(), new List<Proficiency>());
}

public class CharacterClass : ValueObject
{
    public string Name { get; private set; }
    public string Subclass { get; private set; }
    public int HitDie { get; private set; }
    public AbilityType PrimaryAbility { get; private set; }
    public AbilityType[] SavingThrowProficiencies { get; private set; }
    public bool CanCastSpells { get; private set; }
    public SpellcastingType SpellcastingType { get; private set; }
    
    public IReadOnlyCollection<ClassFeature> GetFeaturesForLevel(int level)
    {
        // Implementation to return class features for specific level
        return new List<ClassFeature>();
    }
    
    // Common D&D 5e classes
    public static CharacterClass Fighter => new CharacterClass("Fighter", "", 10, AbilityType.Strength, new[] { AbilityType.Strength, AbilityType.Constitution }, false, SpellcastingType.None);
    public static CharacterClass Wizard => new CharacterClass("Wizard", "", 6, AbilityType.Intelligence, new[] { AbilityType.Intelligence, AbilityType.Wisdom }, true, SpellcastingType.Full);
    public static CharacterClass Rogue => new CharacterClass("Rogue", "", 8, AbilityType.Dexterity, new[] { AbilityType.Dexterity, AbilityType.Intelligence }, false, SpellcastingType.None);
}
```

## AI Prompts for Implementation

### Primary Prompt
```
Create a comprehensive D&D 5e character domain model using Domain-Driven Design principles. Include Character aggregate root with ability scores, race/class/background system, equipment management, spell system for casters, and character progression mechanics. Implement proper D&D 5e rules validation, racial bonuses, class features, and level progression. Use C# with proper encapsulation, business logic, and domain events.
```

### Secondary Prompts
```
Generate D&D 5e ability score system with racial bonuses, modifiers calculation, and proper validation. Include common races (Human, Elf, Dwarf, Halfling) with their racial features and bonuses.

Create D&D 5e character class system with hit dice, spell casting capabilities, saving throw proficiencies, and class features. Include common classes like Fighter, Wizard, Rogue, and Cleric.

Generate character equipment and inventory management system with proper validation, equipment slots, armor class calculation, and magical item support.
```

### Point Buy System Implementation
```csharp
public static class PointBuySystem
{
    private static readonly Dictionary<int, int> PointCosts = new()
    {
        { 8, 0 }, { 9, 1 }, { 10, 2 }, { 11, 3 }, { 12, 4 }, { 13, 5 },
        { 14, 7 }, { 15, 9 }
    };
    
    public const int TotalPoints = 27;
    public const int MinScore = 8;
    public const int MaxScore = 15;
    
    public static bool IsValidPointBuy(AbilityScores scores)
    {
        var totalCost = CalculatePointCost(scores);
        return totalCost == TotalPoints;
    }
    
    public static int CalculatePointCost(AbilityScores scores)
    {
        return PointCosts[scores.Strength] +
               PointCosts[scores.Dexterity] +
               PointCosts[scores.Constitution] +
               PointCosts[scores.Intelligence] +
               PointCosts[scores.Wisdom] +
               PointCosts[scores.Charisma];
    }
}
```

### Experience and Level System
```csharp
public static class ExperienceTable
{
    private static readonly Dictionary<int, int> LevelThresholds = new()
    {
        { 1, 0 }, { 2, 300 }, { 3, 900 }, { 4, 2700 }, { 5, 6500 },
        { 6, 14000 }, { 7, 23000 }, { 8, 34000 }, { 9, 48000 }, { 10, 64000 },
        { 11, 85000 }, { 12, 100000 }, { 13, 120000 }, { 14, 140000 }, { 15, 165000 },
        { 16, 195000 }, { 17, 225000 }, { 18, 265000 }, { 19, 305000 }, { 20, 355000 }
    };
    
    public static int GetLevelForExperience(int experience)
    {
        var level = 1;
        foreach (var threshold in LevelThresholds.OrderByDescending(kvp => kvp.Key))
        {
            if (experience >= threshold.Value)
            {
                level = threshold.Key;
                break;
            }
        }
        return level;
    }
    
    public static int GetExperienceForLevel(int level)
    {
        return LevelThresholds.TryGetValue(level, out var experience) ? experience : 0;
    }
}
```

### Domain Events
```csharp
public class CharacterCreatedEvent : DomainEvent
{
    public Guid CharacterId { get; }
    public Guid PlayerId { get; }
    public string CharacterName { get; }
    
    public CharacterCreatedEvent(Guid characterId, Guid playerId, string characterName)
    {
        CharacterId = characterId;
        PlayerId = playerId;
        CharacterName = characterName;
    }
}

public class CharacterLeveledUpEvent : DomainEvent
{
    public Guid CharacterId { get; }
    public int OldLevel { get; }
    public int NewLevel { get; }
    
    public CharacterLeveledUpEvent(Guid characterId, int oldLevel, int newLevel)
    {
        CharacterId = characterId;
        OldLevel = oldLevel;
        NewLevel = newLevel;
    }
}
```

## Definition of Done
- [ ] Character aggregate root properly encapsulates D&D 5e rules
- [ ] Ability score system with racial bonuses works correctly
- [ ] Race, class, and background systems are implemented
- [ ] Equipment management calculates AC and bonuses correctly
- [ ] Spell system works for spellcasting classes
- [ ] Character progression and leveling mechanics function properly
- [ ] Point buy system validates ability score allocation
- [ ] Domain events are raised for all character lifecycle changes
- [ ] All D&D 5e business rules are validated and enforced
- [ ] Unit tests cover all domain logic and edge cases

## Dependencies
- **Depends on**: Epic 1 - Foundation & Authentication (User management)
- **Blocks**: Character API endpoints and UI implementation

## Estimated Effort
**12 hours** - Complex D&D 5e domain modeling and rules implementation
