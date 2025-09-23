# Character API Endpoints Implementation

## Story
**As a** Player  
**I want** RESTful API endpoints for character management  
**So that** I can create, manage, and progress D&D 5e characters through the application

## Acceptance Criteria
- [ ] Character CRUD endpoints with D&D 5e validation
- [ ] Character creation with point buy system
- [ ] Character progression and leveling endpoints
- [ ] Equipment management endpoints
- [ ] Spell management for casters
- [ ] Character sheet generation endpoint
- [ ] Proper authorization and validation
- [ ] OpenAPI documentation

## Technical References
- **Technical Specification**: Section 2.1.3 Character Management - API Requirements
- **Service Specification**: Character Service - API Endpoints
- **Playbook Reference**: Phase 2, Week 3, Day 4-5: Character API

## Implementation Details

### Character Controller
```csharp
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CharactersController : ControllerBase
{
    private readonly IMediator _mediator;

    /// <summary>
    /// Create a new character
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(CreateCharacterResponse), StatusCodes.Status201Created)]
    public async Task<IActionResult> CreateCharacter([FromBody] CreateCharacterRequest request)
    {
        var command = new CreateCharacterCommand
        {
            Name = request.Name,
            PlayerId = User.GetUserId(),
            Race = request.Race,
            CharacterClass = request.CharacterClass,
            Background = request.Background,
            AbilityScores = request.AbilityScores
        };

        var response = await _mediator.Send(command);
        return CreatedAtAction(nameof(GetCharacter), new { id = response.CharacterId }, response);
    }

    /// <summary>
    /// Get character by ID
    /// </summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(CharacterDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetCharacter(Guid id)
    {
        var query = new GetCharacterQuery { CharacterId = id, PlayerId = User.GetUserId() };
        var character = await _mediator.Send(query);
        return Ok(character);
    }

    /// <summary>
    /// Level up character
    /// </summary>
    [HttpPost("{id:guid}/level-up")]
    [ProducesResponseType(typeof(LevelUpResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> LevelUp(Guid id, [FromBody] LevelUpRequest request)
    {
        var command = new LevelUpCharacterCommand
        {
            CharacterId = id,
            PlayerId = User.GetUserId(),
            NewLevel = request.NewLevel,
            HitPointIncrease = request.HitPointIncrease,
            SelectedFeatures = request.SelectedFeatures
        };

        var response = await _mediator.Send(command);
        return Ok(response);
    }

    /// <summary>
    /// Equip item
    /// </summary>
    [HttpPost("{id:guid}/equipment")]
    [ProducesResponseType(typeof(EquipItemResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> EquipItem(Guid id, [FromBody] EquipItemRequest request)
    {
        var command = new EquipItemCommand
        {
            CharacterId = id,
            PlayerId = User.GetUserId(),
            ItemId = request.ItemId
        };

        var response = await _mediator.Send(command);
        return Ok(response);
    }
}
```

## AI Prompts for Implementation

### Primary Prompt
```
Create comprehensive REST API endpoints for D&D 5e character management using ASP.NET Core. Include character creation with point buy validation, character progression, equipment management, spell management for casters, and character sheet generation. Implement proper D&D 5e rules validation, authorization, and error handling.
```

## Definition of Done
- [ ] All character CRUD endpoints implemented
- [ ] D&D 5e rules validation working
- [ ] Character progression endpoints functional
- [ ] Equipment management working
- [ ] Authorization prevents unauthorized access
- [ ] OpenAPI documentation complete
- [ ] Integration tests pass

## Dependencies
- **Depends on**: 01-character-domain-model.md
- **Blocks**: Character UI implementation

## Estimated Effort
**8 hours** - API implementation and testing
