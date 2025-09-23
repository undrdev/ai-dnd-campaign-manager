# Comprehensive Testing Strategy - D&D AI Campaign Management System

## Overview
This document defines the comprehensive testing strategy for the D&D AI Campaign Management System, ensuring high quality, reliability, and performance across all components including AI services, microservices, Flutter applications, and infrastructure.

## Testing Philosophy

### Quality Goals
- **80%+ Code Coverage** across all services
- **Zero Critical Bugs** in production
- **Sub-200ms API Response Times** for 95% of requests
- **Sub-30s AI Response Times** for 95% of AI requests
- **99.9% Uptime** for core services
- **Cross-Platform Consistency** across Flutter web, mobile, and desktop

### Testing Pyramid Strategy
```
    /\
   /  \     E2E Tests (5%)
  /____\    Integration Tests (25%)
 /______\   Unit Tests (70%)
```

## 1. Unit Testing Strategy

### 1.1 Framework and Tools
- **Backend**: xUnit, Moq, FluentAssertions, AutoFixture
- **Flutter**: flutter_test, mockito, test_coverage
- **AI Services**: Custom AI validation frameworks

### 1.2 Unit Testing Standards

#### **Backend Services Unit Testing**
```csharp
// Example: Campaign Service Unit Test
[Fact]
public async Task CreateCampaignAsync_ValidRequest_ReturnsCampaignDto()
{
    // Arrange
    var request = _fixture.Build<CreateCampaignRequest>()
        .With(x => x.Name, "Test Campaign")
        .With(x => x.MaxPlayers, 6)
        .Create();
    
    var expectedCampaign = _fixture.Build<Campaign>()
        .With(x => x.Name, request.Name)
        .Create();

    _mockRepository
        .Setup(x => x.AddAsync(It.IsAny<Campaign>(), It.IsAny<CancellationToken>()))
        .ReturnsAsync(expectedCampaign);

    // Act
    var result = await _campaignService.CreateCampaignAsync(request);

    // Assert
    result.Should().NotBeNull();
    result.Name.Should().Be(request.Name);
    result.MaxPlayers.Should().Be(request.MaxPlayers);
    
    _mockRepository.Verify(x => x.AddAsync(
        It.Is<Campaign>(c => c.Name == request.Name), 
        It.IsAny<CancellationToken>()), Times.Once);
}
```

#### **AI Services Unit Testing**
```csharp
[Fact]
public async Task GenerateNPCPersonalityAsync_ValidRequest_ReturnsQualityPersonality()
{
    // Arrange
    var request = new NPCPersonalityRequest
    {
        NPCRole = "Tavern Keeper",
        CampaignTheme = "High Fantasy",
        PersonalityComplexity = PersonalityComplexity.Rich
    };

    var mockQualityService = new Mock<IQualityAssuranceService>();
    mockQualityService
        .Setup(x => x.AssessQualityAsync(It.IsAny<QualityAssessmentRequest>()))
        .ReturnsAsync(new QualityAssessmentResult 
        { 
            OverallScore = 0.85, 
            Decision = QualityDecision.Accept 
        });

    // Act
    var result = await _npcGenerationService.GeneratePersonalityAsync(request);

    // Assert
    result.Should().NotBeNull();
    result.Personality.Should().NotBeNullOrEmpty();
    result.QualityScore.Should().BeGreaterThan(0.7);
    result.Traits.Should().HaveCountGreaterThan(3);
    
    // Verify AI-specific validations
    result.Personality.Should().NotContain("inappropriate");
    result.Should().PassDnDContentValidation();
}
```

#### **Flutter Unit Testing**
```dart
// Example: Campaign Provider Unit Test
void main() {
  group('CampaignProvider Tests', () {
    late CampaignProvider campaignProvider;
    late MockCampaignRepository mockRepository;
    late MockCacheService mockCache;

    setUp(() {
      mockRepository = MockCampaignRepository();
      mockCache = MockCacheService();
      campaignProvider = CampaignProvider(mockRepository, mockCache);
    });

    testWidgets('loadCampaigns should update state correctly', (tester) async {
      // Arrange
      final campaigns = [
        Campaign(id: '1', name: 'Test Campaign 1'),
        Campaign(id: '2', name: 'Test Campaign 2'),
      ];
      
      when(mockRepository.getCampaigns(any))
          .thenAnswer((_) async => campaigns);

      // Act
      await campaignProvider.loadCampaigns('user-id');

      // Assert
      expect(campaignProvider.state, isA<AsyncData<List<Campaign>>>());
      expect(campaignProvider.state.value, hasLength(2));
      expect(campaignProvider.state.value![0].name, 'Test Campaign 1');
      
      verify(mockRepository.getCampaigns('user-id')).called(1);
    });
  });
}
```

### 1.3 Coverage Requirements
- **Minimum Coverage**: 80% line coverage
- **Critical Paths**: 95% coverage for authentication, payment, AI services
- **Exception Handling**: 100% coverage for error scenarios
- **Business Logic**: 90% coverage for domain services

### 1.4 Test Categories
- **Happy Path Tests**: Standard successful scenarios
- **Edge Case Tests**: Boundary conditions and limits
- **Error Handling Tests**: Exception scenarios and recovery
- **Security Tests**: Authorization and input validation
- **Performance Tests**: Response time and resource usage

## 2. Integration Testing Strategy

### 2.1 Service Integration Testing

#### **Database Integration Testing**
```csharp
[Collection("Database")]
public class CampaignRepositoryIntegrationTests : IClassFixture<DatabaseFixture>
{
    private readonly DatabaseFixture _fixture;

    public CampaignRepositoryIntegrationTests(DatabaseFixture fixture)
    {
        _fixture = fixture;
    }

    [Fact]
    public async Task AddAsync_ValidCampaign_PersistsToDatabase()
    {
        // Arrange
        using var context = _fixture.CreateContext();
        var repository = new CampaignRepository(context);
        var campaign = new Campaign("Test Campaign", "user-id", 6);

        // Act
        var result = await repository.AddAsync(campaign);
        await context.SaveChangesAsync();

        // Assert
        var savedCampaign = await context.Campaigns
            .FirstOrDefaultAsync(c => c.Id == result.Id);
        
        savedCampaign.Should().NotBeNull();
        savedCampaign!.Name.Should().Be("Test Campaign");
        savedCampaign.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(10));
    }
}
```

#### **API Integration Testing**
```csharp
[Collection("WebApplication")]
public class CampaignControllerIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;

    public CampaignControllerIntegrationTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
        _client = _factory.CreateClient();
    }

    [Fact]
    public async Task CreateCampaign_ValidRequest_ReturnsCreatedCampaign()
    {
        // Arrange
        var request = new CreateCampaignRequest
        {
            Name = "Integration Test Campaign",
            MaxPlayers = 6,
            Setting = "Forgotten Realms"
        };

        var token = await GetAuthTokenAsync();
        _client.DefaultRequestHeaders.Authorization = 
            new AuthenticationHeaderValue("Bearer", token);

        // Act
        var response = await _client.PostAsJsonAsync("/api/v1/campaigns", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created);
        
        var campaign = await response.Content.ReadFromJsonAsync<CampaignDto>();
        campaign.Should().NotBeNull();
        campaign!.Name.Should().Be(request.Name);
        campaign.Id.Should().NotBeEmpty();
        
        // Verify database persistence
        var dbCampaign = await GetCampaignFromDatabaseAsync(campaign.Id);
        dbCampaign.Should().NotBeNull();
    }
}
```

#### **AI Services Integration Testing**
```csharp
[Collection("AI")]
public class AIGatewayIntegrationTests : IClassFixture<AITestFixture>
{
    private readonly AITestFixture _fixture;

    [Fact]
    public async Task GenerateNPCDialogue_RealAIProvider_ReturnsQualityContent()
    {
        // Arrange
        var request = new GenerateAIContentCommand
        {
            RequestType = AIRequestType.NPCDialogue,
            UserPrompt = "The tavern keeper greets the adventurers warmly",
            UserId = Guid.NewGuid(),
            Priority = AIRequestPriority.Normal
        };

        // Act
        var result = await _fixture.AIGatewayService.Handle(request, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Response.Should().NotBeNullOrEmpty();
        result.Response.Length.Should().BeGreaterThan(20);
        
        // AI-specific validations
        result.Response.Should().NotContain("inappropriate");
        result.Response.Should().ContainDialogueMarkers();
        result.UsageMetrics.TotalTokens.Should().BeGreaterThan(0);
        result.ProcessingTime.Should().BeLessThan(TimeSpan.FromSeconds(30));
        
        // Quality validation
        var qualityScore = await _fixture.QualityService
            .AssessQualityAsync(result.Response, AIRequestType.NPCDialogue);
        qualityScore.OverallScore.Should().BeGreaterThan(0.6);
    }
}
```

### 2.2 Cross-Service Integration Testing

#### **Real-time Collaboration Testing**
```csharp
[Fact]
public async Task SessionUpdate_MultipleClients_SynchronizesCorrectly()
{
    // Arrange
    var sessionId = Guid.NewGuid();
    var client1 = await CreateSignalRClientAsync("user1");
    var client2 = await CreateSignalRClientAsync("user2");
    
    var receivedUpdates = new List<SessionUpdateDto>();
    client2.On<SessionUpdateDto>("SessionUpdated", update => receivedUpdates.Add(update));

    // Act
    await client1.InvokeAsync("UpdateSessionState", sessionId, new
    {
        CurrentScene = "Tavern",
        ActiveNPCs = new[] { "Innkeeper", "Mysterious Stranger" }
    });

    // Assert
    await Task.Delay(1000); // Allow for propagation
    receivedUpdates.Should().HaveCount(1);
    receivedUpdates[0].SessionId.Should().Be(sessionId);
    receivedUpdates[0].CurrentScene.Should().Be("Tavern");
}
```

### 2.3 Flutter Integration Testing

#### **Widget Integration Testing**
```dart
void main() {
  group('Campaign Creation Flow Integration Tests', () {
    testWidgets('Complete campaign creation flow', (tester) async {
      // Arrange
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            campaignRepositoryProvider.overrideWithValue(mockRepository),
          ],
          child: MaterialApp(home: CreateCampaignScreen()),
        ),
      );

      // Act - Fill form
      await tester.enterText(find.byKey(Key('campaign_name_field')), 'Test Campaign');
      await tester.enterText(find.byKey(Key('max_players_field')), '6');
      await tester.tap(find.byKey(Key('setting_dropdown')));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Forgotten Realms'));
      await tester.pumpAndSettle();
      
      // Submit form
      await tester.tap(find.byKey(Key('create_campaign_button')));
      await tester.pumpAndSettle();

      // Assert
      expect(find.text('Campaign created successfully!'), findsOneWidget);
      verify(mockRepository.createCampaign(any)).called(1);
    });
  });
}
```

## 3. End-to-End Testing Strategy

### 3.1 E2E Testing Framework
- **Web**: Playwright with TypeScript
- **Mobile**: Flutter integration_test package
- **Cross-Platform**: Shared test scenarios

### 3.2 Critical User Journeys

#### **Journey 1: Complete Campaign Setup**
```typescript
// Playwright E2E Test
test('Complete campaign setup journey', async ({ page }) => {
  // 1. User Registration
  await page.goto('/register');
  await page.fill('[data-testid="email"]', 'test@example.com');
  await page.fill('[data-testid="password"]', 'SecurePassword123!');
  await page.click('[data-testid="register-button"]');
  
  // 2. Email Verification (mock)
  await mockEmailVerification(page);
  
  // 3. Subscription Selection
  await page.click('[data-testid="select-tier-dungeon-architect"]');
  await page.fill('[data-testid="card-number"]', '4242424242424242');
  await page.click('[data-testid="subscribe-button"]');
  
  // 4. Campaign Creation
  await page.click('[data-testid="create-campaign"]');
  await page.fill('[data-testid="campaign-name"]', 'My First Campaign');
  await page.selectOption('[data-testid="setting"]', 'forgotten-realms');
  await page.click('[data-testid="create-button"]');
  
  // 5. AI Character Creation
  await page.click('[data-testid="create-character"]');
  await page.fill('[data-testid="character-concept"]', 'A brave elven ranger');
  await page.click('[data-testid="generate-with-ai"]');
  
  // Wait for AI generation
  await page.waitForSelector('[data-testid="character-generated"]', { timeout: 30000 });
  
  // 6. First Session
  await page.click('[data-testid="start-session"]');
  await page.fill('[data-testid="scene-description"]', 'The party enters a dark forest');
  await page.click('[data-testid="generate-npcs"]');
  
  // Verify complete flow
  expect(await page.textContent('[data-testid="session-status"]')).toBe('Active');
  expect(await page.locator('[data-testid="generated-npc"]').count()).toBeGreaterThan(0);
});
```

#### **Journey 2: Real-time Collaboration Session**
```typescript
test('Real-time collaboration session', async ({ browser }) => {
  // Create two browser contexts (DM and Player)
  const dmContext = await browser.newContext();
  const playerContext = await browser.newContext();
  
  const dmPage = await dmContext.newPage();
  const playerPage = await playerContext.newPage();
  
  // DM starts session
  await dmPage.goto('/campaigns/test-campaign/session');
  await dmPage.click('[data-testid="start-session"]');
  
  // Player joins session
  await playerPage.goto('/campaigns/test-campaign/session');
  await playerPage.waitForSelector('[data-testid="session-active"]');
  
  // DM updates scene
  await dmPage.fill('[data-testid="scene-update"]', 'A dragon appears!');
  await dmPage.click('[data-testid="broadcast-update"]');
  
  // Verify player receives update
  await playerPage.waitForSelector('[data-testid="scene-text"]');
  expect(await playerPage.textContent('[data-testid="scene-text"]')).toContain('A dragon appears!');
  
  // Player rolls dice
  await playerPage.click('[data-testid="roll-d20"]');
  
  // Verify DM sees roll result
  await dmPage.waitForSelector('[data-testid="dice-roll-result"]');
  const rollResult = await dmPage.textContent('[data-testid="dice-roll-result"]');
  expect(rollResult).toMatch(/\d{1,2}/); // Should be a number 1-20
});
```

### 3.3 Cross-Platform E2E Testing

#### **Flutter Cross-Platform Tests**
```dart
void main() {
  group('Cross-Platform Campaign Management', () {
    testWidgets('Campaign sync across platforms', (tester) async {
      // Test on different screen sizes
      await tester.binding.setSurfaceSize(Size(1920, 1080)); // Desktop
      await testCampaignCreation(tester);
      
      await tester.binding.setSurfaceSize(Size(375, 812)); // Mobile
      await testCampaignCreation(tester);
      
      await tester.binding.setSurfaceSize(Size(768, 1024)); // Tablet
      await testCampaignCreation(tester);
    });
  });
}

Future<void> testCampaignCreation(WidgetTester tester) async {
  await tester.pumpWidget(TestApp());
  
  // Test responsive layout
  final createButton = find.byKey(Key('create_campaign_button'));
  expect(createButton, findsOneWidget);
  
  await tester.tap(createButton);
  await tester.pumpAndSettle();
  
  // Verify form adapts to screen size
  final nameField = find.byKey(Key('campaign_name_field'));
  expect(nameField, findsOneWidget);
  
  final nameFieldWidget = tester.widget<TextField>(nameField);
  expect(nameFieldWidget.decoration, isNotNull);
}
```

## 4. AI-Specific Testing Strategy

### 4.1 AI Content Quality Testing

#### **Content Validation Framework**
```csharp
public class AIContentValidator
{
    public async Task<ValidationResult> ValidateNPCDialogue(string dialogue)
    {
        var results = new List<ValidationError>();
        
        // Length validation
        if (dialogue.Length < 10 || dialogue.Length > 1000)
            results.Add(new ValidationError("Dialogue length out of bounds"));
        
        // Content appropriateness
        if (await ContainsInappropriateContent(dialogue))
            results.Add(new ValidationError("Contains inappropriate content"));
        
        // D&D context validation
        if (!await ValidateDnDContext(dialogue))
            results.Add(new ValidationError("Not appropriate for D&D context"));
        
        // Dialogue format validation
        if (!ContainsDialogueMarkers(dialogue))
            results.Add(new ValidationError("Missing proper dialogue formatting"));
        
        return new ValidationResult(results);
    }

    private async Task<bool> ValidateDnDContext(string content)
    {
        var dndKeywords = new[] { "adventure", "quest", "magic", "tavern", "guild", "dungeon" };
        var modernKeywords = new[] { "smartphone", "internet", "car", "electricity" };
        
        var hasFantasyContext = dndKeywords.Any(k => content.ToLower().Contains(k));
        var hasModernContext = modernKeywords.Any(k => content.ToLower().Contains(k));
        
        return hasFantasyContext && !hasModernContext;
    }
}
```

#### **AI Performance Testing**
```csharp
[Fact]
public async Task AIGeneration_PerformanceTest_MeetsResponseTimeRequirements()
{
    // Arrange
    var requests = GenerateTestRequests(100);
    var stopwatch = new Stopwatch();
    var responseTimes = new List<TimeSpan>();

    // Act
    foreach (var request in requests)
    {
        stopwatch.Restart();
        var response = await _aiGatewayService.GenerateContentAsync(request);
        stopwatch.Stop();
        
        responseTimes.Add(stopwatch.Elapsed);
        
        // Verify response quality
        response.Should().NotBeNull();
        response.Response.Should().NotBeNullOrEmpty();
    }

    // Assert
    var averageTime = responseTimes.Average(t => t.TotalSeconds);
    var p95Time = responseTimes.OrderBy(t => t).Skip((int)(responseTimes.Count * 0.95)).First();
    
    averageTime.Should().BeLessThan(15); // Average < 15 seconds
    p95Time.TotalSeconds.Should().BeLessThan(30); // 95th percentile < 30 seconds
}
```

### 4.2 AI Provider Testing

#### **Provider Failover Testing**
```csharp
[Fact]
public async Task AIProvider_FailoverTest_SwitchesToBackupProvider()
{
    // Arrange
    var primaryProvider = Mock.Of<IAIProvider>();
    var backupProvider = Mock.Of<IAIProvider>();
    
    Mock.Get(primaryProvider)
        .Setup(p => p.GenerateContentAsync(It.IsAny<AIRequest>()))
        .ThrowsAsync(new AIProviderException("Primary provider unavailable"));
    
    Mock.Get(backupProvider)
        .Setup(p => p.GenerateContentAsync(It.IsAny<AIRequest>()))
        .ReturnsAsync(new AIProviderResponse { IsSuccess = true, Response = "Backup response" });

    var providerSelector = new AIProviderSelector(new[] { primaryProvider, backupProvider });
    
    // Act
    var result = await _aiGatewayService.GenerateContentAsync(new AIRequest());
    
    // Assert
    result.Response.Should().Be("Backup response");
    Mock.Get(primaryProvider).Verify(p => p.GenerateContentAsync(It.IsAny<AIRequest>()), Times.Once);
    Mock.Get(backupProvider).Verify(p => p.GenerateContentAsync(It.IsAny<AIRequest>()), Times.Once);
}
```

## 5. Performance Testing Strategy

### 5.1 Load Testing

#### **API Load Testing (Artillery.js)**
```yaml
# load-test-config.yml
config:
  target: 'https://api.dndai.local'
  phases:
    - duration: 300  # 5 minutes
      arrivalRate: 10  # 10 requests per second
    - duration: 600  # 10 minutes  
      arrivalRate: 50  # 50 requests per second
    - duration: 300  # 5 minutes
      arrivalRate: 100 # 100 requests per second
  processor: "./test-processor.js"

scenarios:
  - name: "Campaign API Load Test"
    weight: 40
    flow:
      - post:
          url: "/api/v1/auth/login"
          json:
            email: "{{ $randomEmail() }}"
            password: "TestPassword123!"
          capture:
            - json: "$.token"
              as: "authToken"
      - get:
          url: "/api/v1/campaigns"
          headers:
            Authorization: "Bearer {{ authToken }}"
      - post:
          url: "/api/v1/campaigns"
          headers:
            Authorization: "Bearer {{ authToken }}"
          json:
            name: "Load Test Campaign {{ $randomString() }}"
            maxPlayers: 6

  - name: "AI Generation Load Test"
    weight: 30
    flow:
      - post:
          url: "/api/v1/ai/generate"
          headers:
            Authorization: "Bearer {{ authToken }}"
          json:
            requestType: "NPCGeneration"
            userPrompt: "Generate a tavern keeper"
            priority: "Normal"
```

#### **Database Performance Testing**
```csharp
[Fact]
public async Task Database_ConcurrentOperations_MaintainsPerformance()
{
    // Arrange
    var concurrentTasks = new List<Task>();
    var responseTimeThreshold = TimeSpan.FromMilliseconds(200);
    
    // Act - Simulate 100 concurrent database operations
    for (int i = 0; i < 100; i++)
    {
        var task = Task.Run(async () =>
        {
            var stopwatch = Stopwatch.StartNew();
            
            // Perform database operation
            var campaigns = await _campaignRepository.GetByUserIdAsync("user-id");
            
            stopwatch.Stop();
            return stopwatch.Elapsed;
        });
        
        concurrentTasks.Add(task);
    }
    
    var responseTimes = await Task.WhenAll(concurrentTasks.Cast<Task<TimeSpan>>());
    
    // Assert
    var averageTime = responseTimes.Average(t => t.TotalMilliseconds);
    var maxTime = responseTimes.Max();
    
    averageTime.Should().BeLessThan(responseTimeThreshold.TotalMilliseconds);
    maxTime.Should().BeLessThan(TimeSpan.FromSeconds(1));
}
```

### 5.2 Real-time Performance Testing

#### **SignalR Connection Testing**
```csharp
[Fact]
public async Task SignalR_1000ConcurrentConnections_MaintainsPerformance()
{
    // Arrange
    var connections = new List<HubConnection>();
    var messageReceiveCount = 0;
    var resetEvent = new ManualResetEventSlim(false);
    
    // Act - Create 1000 concurrent connections
    for (int i = 0; i < 1000; i++)
    {
        var connection = new HubConnectionBuilder()
            .WithUrl("https://localhost:5001/session-hub")
            .Build();
            
        connection.On<string>("MessageReceived", message =>
        {
            Interlocked.Increment(ref messageReceiveCount);
            if (messageReceiveCount == 1000)
                resetEvent.Set();
        });
        
        await connection.StartAsync();
        connections.Add(connection);
    }
    
    // Send broadcast message
    await connections[0].InvokeAsync("BroadcastMessage", "Performance test message");
    
    // Assert
    var messageReceived = resetEvent.Wait(TimeSpan.FromSeconds(30));
    messageReceived.Should().BeTrue();
    messageReceiveCount.Should().Be(1000);
    
    // Cleanup
    foreach (var connection in connections)
    {
        await connection.DisposeAsync();
    }
}
```

## 6. Security Testing Strategy

### 6.1 Authentication & Authorization Testing

#### **JWT Security Testing**
```csharp
[Fact]
public async Task JWT_ExpiredToken_ReturnsUnauthorized()
{
    // Arrange
    var expiredToken = GenerateExpiredJWT();
    _client.DefaultRequestHeaders.Authorization = 
        new AuthenticationHeaderValue("Bearer", expiredToken);

    // Act
    var response = await _client.GetAsync("/api/v1/campaigns");

    // Assert
    response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
}

[Fact]
public async Task API_UnauthorizedAccess_ReturnsUnauthorized()
{
    // Arrange - No authorization header

    // Act
    var response = await _client.GetAsync("/api/v1/campaigns");

    // Assert
    response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
}

[Theory]
[InlineData("/api/v1/admin/users")]
[InlineData("/api/v1/admin/analytics")]
public async Task AdminEndpoints_NonAdminUser_ReturnsForbidden(string endpoint)
{
    // Arrange
    var userToken = await GetUserTokenAsync("regular-user");
    _client.DefaultRequestHeaders.Authorization = 
        new AuthenticationHeaderValue("Bearer", userToken);

    // Act
    var response = await _client.GetAsync(endpoint);

    // Assert
    response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
}
```

### 6.2 Input Validation Testing

#### **SQL Injection Prevention**
```csharp
[Theory]
[InlineData("'; DROP TABLE Campaigns; --")]
[InlineData("' OR '1'='1")]
[InlineData("<script>alert('xss')</script>")]
public async Task CreateCampaign_MaliciousInput_RejectsSafely(string maliciousInput)
{
    // Arrange
    var request = new CreateCampaignRequest
    {
        Name = maliciousInput,
        MaxPlayers = 6
    };

    // Act
    var response = await _client.PostAsJsonAsync("/api/v1/campaigns", request);

    // Assert
    response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    
    // Verify database integrity
    var campaigns = await _dbContext.Campaigns.ToListAsync();
    campaigns.Should().NotContain(c => c.Name.Contains("DROP TABLE"));
}
```

## 7. Test Data Management

### 7.1 Test Data Builders

#### **Campaign Test Data Builder**
```csharp
public class CampaignBuilder
{
    private string _name = "Test Campaign";
    private string _userId = "test-user-id";
    private int _maxPlayers = 6;
    private CampaignSetting _setting = CampaignSetting.ForgottenRealms;
    private List<Character> _characters = new();

    public CampaignBuilder WithName(string name)
    {
        _name = name;
        return this;
    }

    public CampaignBuilder WithUser(string userId)
    {
        _userId = userId;
        return this;
    }

    public CampaignBuilder WithMaxPlayers(int maxPlayers)
    {
        _maxPlayers = maxPlayers;
        return this;
    }

    public CampaignBuilder WithCharacter(Character character)
    {
        _characters.Add(character);
        return this;
    }

    public Campaign Build()
    {
        var campaign = new Campaign(_name, _userId, _maxPlayers)
        {
            Setting = _setting
        };

        foreach (var character in _characters)
        {
            campaign.AddCharacter(character);
        }

        return campaign;
    }
}
```

### 7.2 Test Database Management

#### **Database Fixture**
```csharp
public class DatabaseFixture : IDisposable
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ApplicationDbContext _context;

    public DatabaseFixture()
    {
        var services = new ServiceCollection();
        services.AddDbContext<ApplicationDbContext>(options =>
            options.UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString()));

        _serviceProvider = services.BuildServiceProvider();
        _context = _serviceProvider.GetRequiredService<ApplicationDbContext>();
        
        SeedTestData();
    }

    public ApplicationDbContext CreateContext()
    {
        return _serviceProvider.GetRequiredService<ApplicationDbContext>();
    }

    private void SeedTestData()
    {
        // Seed common test data
        var testUser = new User("test@example.com", "Test User");
        _context.Users.Add(testUser);
        
        var testCampaign = new Campaign("Seed Campaign", testUser.Id, 6);
        _context.Campaigns.Add(testCampaign);
        
        _context.SaveChanges();
    }

    public void Dispose()
    {
        _context.Dispose();
        _serviceProvider.GetRequiredService<IServiceScope>().Dispose();
    }
}
```

## 8. Continuous Integration Testing

### 8.1 GitHub Actions Testing Pipeline

```yaml
# .github/workflows/test.yml
name: Comprehensive Testing

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        dotnet-version: ['8.0.x']
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup .NET
      uses: actions/setup-dotnet@v3
      with:
        dotnet-version: ${{ matrix.dotnet-version }}
    
    - name: Restore dependencies
      run: dotnet restore
    
    - name: Build
      run: dotnet build --no-restore
    
    - name: Run Unit Tests
      run: |
        dotnet test --no-build --verbosity normal \
          --collect:"XPlat Code Coverage" \
          --results-directory ./coverage
    
    - name: Generate Coverage Report
      run: |
        dotnet tool install -g dotnet-reportgenerator-globaltool
        reportgenerator \
          -reports:"coverage/**/coverage.cobertura.xml" \
          -targetdir:"coverage/report" \
          -reporttypes:"Html;Cobertura"
    
    - name: Upload Coverage to Codecov
      uses: codecov/codecov-action@v3
      with:
        directory: ./coverage/report
        fail_ci_if_error: true

  integration-tests:
    runs-on: ubuntu-latest
    needs: unit-tests
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: dndai_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
      
      redis:
        image: redis:7-alpine
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup .NET
      uses: actions/setup-dotnet@v3
      with:
        dotnet-version: '8.0.x'
    
    - name: Run Integration Tests
      env:
        ConnectionStrings__DefaultConnection: "Host=localhost;Database=dndai_test;Username=postgres;Password=postgres"
        ConnectionStrings__Redis: "localhost:6379"
      run: |
        dotnet test tests/IntegrationTests \
          --verbosity normal \
          --logger "trx;LogFileName=integration-tests.trx"

  flutter-tests:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Flutter
      uses: subosito/flutter-action@v2
      with:
        flutter-version: '3.16.0'
        channel: 'stable'
    
    - name: Install dependencies
      run: flutter pub get
      working-directory: ./src/Client/dnd_ai_flutter
    
    - name: Analyze code
      run: flutter analyze
      working-directory: ./src/Client/dnd_ai_flutter
    
    - name: Run tests
      run: flutter test --coverage
      working-directory: ./src/Client/dnd_ai_flutter
    
    - name: Upload Flutter coverage
      uses: codecov/codecov-action@v3
      with:
        file: ./src/Client/dnd_ai_flutter/coverage/lcov.info

  e2e-tests:
    runs-on: ubuntu-latest
    needs: [integration-tests, flutter-tests]
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
    
    - name: Install Playwright
      run: |
        npm install -g @playwright/test
        playwright install
    
    - name: Start services
      run: |
        docker-compose -f docker-compose.test.yml up -d
        sleep 30  # Wait for services to be ready
    
    - name: Run E2E Tests
      run: playwright test
      working-directory: ./tests/e2e
    
    - name: Upload E2E Results
      uses: actions/upload-artifact@v3
      if: always()
      with:
        name: playwright-report
        path: tests/e2e/playwright-report/

  performance-tests:
    runs-on: ubuntu-latest
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
    
    - name: Install Artillery
      run: npm install -g artillery
    
    - name: Run Load Tests
      run: |
        artillery run tests/performance/load-test-config.yml \
          --output performance-report.json
    
    - name: Generate Performance Report
      run: |
        artillery report performance-report.json \
          --output performance-report.html
    
    - name: Upload Performance Report
      uses: actions/upload-artifact@v3
      with:
        name: performance-report
        path: performance-report.html
```

## 9. Test Reporting and Metrics

### 9.1 Quality Gates

#### **Coverage Requirements**
- **Overall Code Coverage**: 80% minimum
- **Critical Path Coverage**: 95% minimum (auth, payments, AI)
- **New Code Coverage**: 90% minimum

#### **Performance Requirements**
- **API Response Time**: 95% of requests < 200ms
- **AI Response Time**: 95% of requests < 30s
- **Database Query Time**: 95% of queries < 100ms
- **Page Load Time**: 95% of pages < 3s

#### **Quality Requirements**
- **Zero Critical Security Issues**
- **Zero High-Priority Bugs**
- **AI Content Quality Score**: > 0.7 average

### 9.2 Test Reporting Dashboard

#### **Metrics Collection**
```csharp
public class TestMetricsCollector
{
    public async Task RecordTestMetrics(TestResult result)
    {
        var metrics = new TestMetrics
        {
            TestName = result.TestName,
            TestType = result.TestType,
            Duration = result.Duration,
            Status = result.Status,
            Coverage = result.Coverage,
            Timestamp = DateTime.UtcNow
        };

        await _metricsRepository.SaveAsync(metrics);
        
        // Send to monitoring system
        await _monitoringService.RecordMetric("test_execution", new
        {
            test_type = result.TestType,
            status = result.Status.ToString().ToLower(),
            duration_ms = result.Duration.TotalMilliseconds
        });
    }
}
```

## 10. Test Environment Management

### 10.1 Environment Configuration

#### **Test Environment Setup**
```yaml
# docker-compose.test.yml
version: '3.8'

services:
  postgres-test:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: dndai_test
      POSTGRES_USER: test_user
      POSTGRES_PASSWORD: test_password
    ports:
      - "5433:5432"
    volumes:
      - postgres_test_data:/var/lib/postgresql/data

  redis-test:
    image: redis:7-alpine
    ports:
      - "6380:6379"
    command: redis-server --requirepass test_password

  ai-gateway-test:
    build:
      context: ./src/Services/AIGatewayService
      dockerfile: Dockerfile.test
    environment:
      - ASPNETCORE_ENVIRONMENT=Testing
      - ConnectionStrings__DefaultConnection=Host=postgres-test;Database=dndai_test;Username=test_user;Password=test_password
      - ConnectionStrings__Redis=redis-test:6379
      - AI__OpenAI__ApiKey=test-key
    depends_on:
      - postgres-test
      - redis-test
    ports:
      - "5001:80"

volumes:
  postgres_test_data:
```

### 10.2 Test Data Reset Strategy

#### **Database Reset Between Tests**
```csharp
public class DatabaseResetFixture : IDisposable
{
    private readonly IServiceProvider _serviceProvider;

    public async Task ResetDatabaseAsync()
    {
        using var scope = _serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        
        // Clear all tables
        await context.Database.ExecuteSqlRawAsync("TRUNCATE TABLE campaigns, characters, npcs, users RESTART IDENTITY CASCADE");
        
        // Reseed essential data
        await SeedEssentialDataAsync(context);
    }

    private async Task SeedEssentialDataAsync(ApplicationDbContext context)
    {
        // Add essential reference data
        var spells = await LoadDnDSpellDataAsync();
        context.Spells.AddRange(spells);
        
        var classes = await LoadDnDClassDataAsync();
        context.Classes.AddRange(classes);
        
        await context.SaveChangesAsync();
    }
}
```

## Summary

This comprehensive testing strategy ensures:

1. **Quality Assurance**: 80%+ code coverage with focus on critical paths
2. **Performance Validation**: Load testing for 1,000+ concurrent users
3. **Security Testing**: Authentication, authorization, and input validation
4. **AI-Specific Testing**: Content quality, provider failover, and performance
5. **Cross-Platform Testing**: Flutter web, mobile, and desktop consistency
6. **Real-time Testing**: SignalR connection and synchronization validation
7. **Automated CI/CD**: Continuous testing pipeline with quality gates

The strategy covers all aspects from unit tests to end-to-end user journeys, ensuring the D&D AI Campaign Management System meets all quality, performance, and reliability requirements.
