# Testing Framework Setup

## Overview
This document establishes comprehensive testing standards for the D&D AI Campaign Management System using xUnit for unit testing, integration testing patterns, and test data management strategies.

---

## Unit Testing Patterns with xUnit

### Test Project Structure
```
tests/
├── UnitTests/
│   ├── DnDAI.CampaignService.Tests/
│   │   ├── Services/
│   │   ├── Controllers/
│   │   ├── Validators/
│   │   └── Helpers/
│   ├── DnDAI.CharacterService.Tests/
│   └── DnDAI.Common.Tests/
├── IntegrationTests/
│   ├── DnDAI.API.IntegrationTests/
│   └── DnDAI.Database.IntegrationTests/
└── EndToEndTests/
    └── DnDAI.E2E.Tests/
```

### Base Test Classes
```csharp
public abstract class UnitTestBase
{
    protected readonly IFixture _fixture;
    protected readonly Mock<ILogger> _mockLogger;

    protected UnitTestBase()
    {
        _fixture = new Fixture();
        _fixture.Behaviors.OfType<ThrowingRecursionBehavior>().ToList()
            .ForEach(b => _fixture.Behaviors.Remove(b));
        _fixture.Behaviors.Add(new OmitOnRecursionBehavior());
        
        _mockLogger = new Mock<ILogger>();
    }

    protected Mock<ILogger<T>> CreateMockLogger<T>()
    {
        return new Mock<ILogger<T>>();
    }
}

public abstract class ServiceTestBase<TService> : UnitTestBase
{
    protected readonly Mock<ILogger<TService>> _mockLogger;
    
    protected ServiceTestBase()
    {
        _mockLogger = CreateMockLogger<TService>();
    }
}
```

### Service Testing Patterns
```csharp
public class CampaignServiceTests : ServiceTestBase<CampaignService>
{
    private readonly Mock<ICampaignRepository> _mockRepository;
    private readonly Mock<ICacheService> _mockCache;
    private readonly Mock<IEventPublisher> _mockEventPublisher;
    private readonly CampaignService _service;

    public CampaignServiceTests()
    {
        _mockRepository = new Mock<ICampaignRepository>();
        _mockCache = new Mock<ICacheService>();
        _mockEventPublisher = new Mock<IEventPublisher>();
        
        _service = new CampaignService(
            _mockRepository.Object,
            _mockCache.Object,
            _mockEventPublisher.Object,
            _mockLogger.Object);
    }

    [Fact]
    public async Task GetCampaignAsync_ValidId_ReturnsCampaign()
    {
        // Arrange
        var campaignId = "test-campaign-id";
        var expectedCampaign = _fixture.Create<Campaign>();
        expectedCampaign.Id = campaignId;

        _mockRepository
            .Setup(r => r.GetByIdAsync(campaignId, default))
            .ReturnsAsync(expectedCampaign);

        // Act
        var result = await _service.GetCampaignAsync(campaignId);

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().Be(campaignId);
        result.Should().BeEquivalentTo(expectedCampaign);
        
        _mockRepository.Verify(r => r.GetByIdAsync(campaignId, default), Times.Once);
    }

    [Fact]
    public async Task GetCampaignAsync_InvalidId_ReturnsNull()
    {
        // Arrange
        var campaignId = "invalid-id";
        _mockRepository
            .Setup(r => r.GetByIdAsync(campaignId, default))
            .ReturnsAsync((Campaign)null);

        // Act
        var result = await _service.GetCampaignAsync(campaignId);

        // Assert
        result.Should().BeNull();
        _mockRepository.Verify(r => r.GetByIdAsync(campaignId, default), Times.Once);
    }

    [Fact]
    public async Task CreateCampaignAsync_ValidRequest_CreatesAndReturnsCampaign()
    {
        // Arrange
        var request = _fixture.Create<CreateCampaignRequest>();
        var userId = "test-user-id";
        var expectedCampaign = _fixture.Create<Campaign>();

        _mockRepository
            .Setup(r => r.AddAsync(It.IsAny<Campaign>(), default))
            .ReturnsAsync(expectedCampaign);

        // Act
        var result = await _service.CreateCampaignAsync(request, userId);

        // Assert
        result.Should().NotBeNull();
        result.Should().BeEquivalentTo(expectedCampaign);
        
        _mockRepository.Verify(r => r.AddAsync(It.IsAny<Campaign>(), default), Times.Once);
        _mockEventPublisher.Verify(p => p.PublishAsync(It.IsAny<CampaignCreatedEvent>(), default), Times.Once);
    }

    [Theory]
    [InlineData("")]
    [InlineData(null)]
    [InlineData("   ")]
    public async Task CreateCampaignAsync_InvalidName_ThrowsValidationException(string invalidName)
    {
        // Arrange
        var request = _fixture.Create<CreateCampaignRequest>();
        request.Name = invalidName;
        var userId = "test-user-id";

        // Act & Assert
        await _service.Invoking(s => s.CreateCampaignAsync(request, userId))
            .Should().ThrowAsync<ValidationException>()
            .WithMessage("*name*required*");
        
        _mockRepository.Verify(r => r.AddAsync(It.IsAny<Campaign>(), default), Times.Never);
    }
}
```

### Controller Testing Patterns
```csharp
public class CampaignsControllerTests : UnitTestBase
{
    private readonly Mock<ICampaignService> _mockService;
    private readonly Mock<IMapper> _mockMapper;
    private readonly CampaignsController _controller;

    public CampaignsControllerTests()
    {
        _mockService = new Mock<ICampaignService>();
        _mockMapper = new Mock<IMapper>();
        
        _controller = new CampaignsController(_mockService.Object, _mockMapper.Object);
        
        // Setup user context
        var user = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.NameIdentifier, "test-user-id"),
            new Claim(ClaimTypes.Name, "testuser")
        }));
        
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = user }
        };
    }

    [Fact]
    public async Task GetCampaign_ValidId_ReturnsOkWithCampaign()
    {
        // Arrange
        var campaignId = "test-campaign-id";
        var campaign = _fixture.Create<Campaign>();
        var campaignResponse = _fixture.Create<CampaignResponse>();

        _mockService.Setup(s => s.GetCampaignAsync(campaignId))
            .ReturnsAsync(campaign);
        
        _mockMapper.Setup(m => m.Map<CampaignResponse>(campaign))
            .Returns(campaignResponse);

        // Act
        var result = await _controller.GetCampaign(campaignId);

        // Assert
        result.Should().BeOfType<OkObjectResult>();
        var okResult = result as OkObjectResult;
        okResult.Value.Should().BeEquivalentTo(campaignResponse);
    }

    [Fact]
    public async Task GetCampaign_NotFound_ReturnsNotFound()
    {
        // Arrange
        var campaignId = "non-existent-id";
        _mockService.Setup(s => s.GetCampaignAsync(campaignId))
            .ReturnsAsync((Campaign)null);

        // Act
        var result = await _controller.GetCampaign(campaignId);

        // Assert
        result.Should().BeOfType<NotFoundResult>();
    }

    [Fact]
    public async Task CreateCampaign_ValidRequest_ReturnsCreated()
    {
        // Arrange
        var request = _fixture.Create<CreateCampaignRequest>();
        var campaign = _fixture.Create<Campaign>();
        var response = _fixture.Create<CampaignResponse>();

        _mockService.Setup(s => s.CreateCampaignAsync(request, "test-user-id"))
            .ReturnsAsync(campaign);
        
        _mockMapper.Setup(m => m.Map<CampaignResponse>(campaign))
            .Returns(response);

        // Act
        var result = await _controller.CreateCampaign(request);

        // Assert
        result.Should().BeOfType<CreatedAtActionResult>();
        var createdResult = result as CreatedAtActionResult;
        createdResult.Value.Should().BeEquivalentTo(response);
    }
}
```

---

## Integration Testing Setup

### Test Host Configuration
```csharp
public class IntegrationTestBase : IClassFixture<WebApplicationFactory<Program>>
{
    protected readonly WebApplicationFactory<Program> _factory;
    protected readonly HttpClient _client;
    protected readonly IServiceScope _scope;
    protected readonly ApplicationDbContext _context;

    protected IntegrationTestBase(WebApplicationFactory<Program> factory)
    {
        _factory = factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                // Remove the real database
                services.RemoveAll(typeof(DbContextOptions<ApplicationDbContext>));
                services.RemoveAll(typeof(ApplicationDbContext));

                // Add in-memory database
                services.AddDbContext<ApplicationDbContext>(options =>
                {
                    options.UseInMemoryDatabase("TestDb");
                });

                // Replace external dependencies with test doubles
                services.RemoveAll(typeof(IEmailService));
                services.AddScoped<IEmailService, MockEmailService>();
            });

            builder.UseEnvironment("Testing");
        });

        _client = _factory.CreateClient();
        _scope = _factory.Services.CreateScope();
        _context = _scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    }

    protected async Task<string> GetJwtTokenAsync(string userId = "test-user")
    {
        var tokenService = _scope.ServiceProvider.GetRequiredService<ITokenService>();
        var user = new User { Id = userId, Username = "testuser", Email = "test@example.com" };
        var tokenResponse = await tokenService.GenerateTokensAsync(user);
        return tokenResponse.AccessToken;
    }

    protected void SetAuthorizationHeader(string token)
    {
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
    }

    public void Dispose()
    {
        _scope?.Dispose();
        _client?.Dispose();
    }
}
```

---

## Test Data Management

### Test Data Builders
```csharp
public class CampaignBuilder
{
    private Campaign _campaign;

    public CampaignBuilder()
    {
        _campaign = new Campaign
        {
            Id = Guid.NewGuid().ToString(),
            Name = "Default Campaign",
            Description = "Default description",
            Status = CampaignStatus.Active,
            MaxPlayers = 4,
            DungeonMasterId = "default-dm-id",
            CreatedAt = DateTime.UtcNow
        };
    }

    public CampaignBuilder WithId(string id)
    {
        _campaign.Id = id;
        return this;
    }

    public CampaignBuilder WithName(string name)
    {
        _campaign.Name = name;
        return this;
    }

    public CampaignBuilder WithDungeonMaster(string dmId)
    {
        _campaign.DungeonMasterId = dmId;
        return this;
    }

    public Campaign Build() => _campaign;
}
```

### Test Data Factories
```csharp
public static class TestDataFactory
{
    public static User CreateUser(string id = null, string email = null)
    {
        return new User
        {
            Id = id ?? Guid.NewGuid().ToString(),
            Username = $"testuser_{Random.Shared.Next(1000, 9999)}",
            Email = email ?? $"test{Random.Shared.Next(1000, 9999)}@example.com",
            EmailConfirmed = true,
            CreatedAt = DateTime.UtcNow
        };
    }

    public static Campaign CreateCampaign(string dmId = null, string name = null)
    {
        return new Campaign
        {
            Id = Guid.NewGuid().ToString(),
            Name = name ?? $"Test Campaign {Random.Shared.Next(1000, 9999)}",
            Description = "Test campaign description",
            Status = CampaignStatus.Active,
            MaxPlayers = 4,
            DungeonMasterId = dmId ?? Guid.NewGuid().ToString(),
            CreatedAt = DateTime.UtcNow
        };
    }
}
```

This comprehensive testing framework setup provides robust unit testing, integration testing, and test data management for the D&D AI Campaign Management System.
