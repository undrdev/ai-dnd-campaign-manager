# Coding Standards

## Overview
This document defines coding standards and conventions for the D&D AI Campaign Management System to ensure consistency, maintainability, and code quality across all C# and Flutter components.

---

## General Principles

### Code Quality Pillars
1. **Readability**: Code should be self-documenting and easy to understand
2. **Consistency**: Follow established patterns throughout the codebase
3. **Maintainability**: Write code that is easy to modify and extend
4. **Performance**: Consider performance implications of coding decisions
5. **Security**: Follow secure coding practices

### SOLID Principles
- **Single Responsibility**: Each class should have one reason to change
- **Open/Closed**: Open for extension, closed for modification
- **Liskov Substitution**: Derived classes must be substitutable for base classes
- **Interface Segregation**: Clients shouldn't depend on interfaces they don't use
- **Dependency Inversion**: Depend on abstractions, not concretions

---

## C# Coding Standards

### Naming Conventions

#### Classes and Interfaces
```csharp
// Classes - PascalCase
public class CampaignService { }
public class UserRepository { }
public class AIProviderConfiguration { }

// Interfaces - PascalCase with 'I' prefix
public interface ICampaignService { }
public interface IUserRepository { }
public interface IAIProvider { }

// Abstract classes - PascalCase with 'Base' or descriptive suffix
public abstract class BaseRepository<T> { }
public abstract class AIProviderBase { }
```

#### Methods and Properties
```csharp
public class CampaignService
{
    // Properties - PascalCase
    public string CampaignName { get; set; }
    public DateTime CreatedAt { get; private set; }
    
    // Methods - PascalCase, use verbs
    public async Task<Campaign> CreateCampaignAsync(CreateCampaignRequest request)
    {
        // Method implementation
    }
    
    public bool IsValidCampaign(Campaign campaign)
    {
        // Validation logic
    }
}
```

#### Fields and Variables
```csharp
public class ExampleClass
{
    // Private fields - camelCase with underscore prefix
    private readonly ICampaignRepository _campaignRepository;
    private readonly ILogger<ExampleClass> _logger;
    private string _internalState;
    
    // Constants - PascalCase
    private const int MaxCampaignNameLength = 100;
    public const string DefaultCampaignStatus = "Active";
    
    // Static readonly - PascalCase
    private static readonly Dictionary<string, int> StatusCodes = new();
    
    public void ExampleMethod()
    {
        // Local variables - camelCase
        var campaignName = "My Campaign";
        var createdDate = DateTime.UtcNow;
        
        // Loop variables - single letter or descriptive
        for (int i = 0; i < campaigns.Count; i++)
        {
            var campaign = campaigns[i];
            // Process campaign
        }
        
        foreach (var user in users)
        {
            // Process user
        }
    }
}
```

### Class Structure Order
```csharp
public class ExampleClass : BaseClass, IInterface
{
    #region Constants
    private const string DefaultValue = "default";
    #endregion
    
    #region Fields
    private readonly IService _service;
    private string _privateField;
    #endregion
    
    #region Properties
    public string PublicProperty { get; set; }
    protected string ProtectedProperty { get; set; }
    private string PrivateProperty { get; set; }
    #endregion
    
    #region Constructors
    public ExampleClass(IService service)
    {
        _service = service ?? throw new ArgumentNullException(nameof(service));
    }
    #endregion
    
    #region Public Methods
    public void PublicMethod() { }
    #endregion
    
    #region Protected Methods
    protected virtual void ProtectedMethod() { }
    #endregion
    
    #region Private Methods
    private void PrivateMethod() { }
    #endregion
    
    #region Interface Implementation
    public void InterfaceMethod() { }
    #endregion
}
```

### Method Design Guidelines

#### Method Signatures
```csharp
// Good: Clear, descriptive names with proper async suffix
public async Task<ApiResponse<Campaign>> CreateCampaignAsync(
    CreateCampaignRequest request, 
    CancellationToken cancellationToken = default)

// Good: Boolean methods should ask questions
public bool IsValidEmail(string email)
public bool HasPermission(string userId, Permission permission)
public bool CanExecuteCommand(ICommand command)

// Good: Use meaningful parameter names
public void UpdateCharacterStats(
    Guid characterId, 
    int newLevel, 
    Dictionary<string, int> abilityScores)

// Bad: Unclear names and poor parameter structure
public void Update(Guid id, int val, object data)
```

#### Return Types and Null Handling
```csharp
// Use nullable reference types appropriately
public Campaign? FindCampaignByName(string name)
{
    return campaigns.FirstOrDefault(c => c.Name == name);
}

// Use Result pattern for operations that can fail
public class Result<T>
{
    public bool IsSuccess { get; }
    public T? Value { get; }
    public string? ErrorMessage { get; }
    
    private Result(bool isSuccess, T? value, string? errorMessage)
    {
        IsSuccess = isSuccess;
        Value = value;
        ErrorMessage = errorMessage;
    }
    
    public static Result<T> Success(T value) => new(true, value, null);
    public static Result<T> Failure(string error) => new(false, default, error);
}

// Usage
public async Task<Result<Campaign>> CreateCampaignAsync(CreateCampaignRequest request)
{
    try
    {
        var campaign = await _repository.CreateAsync(request.ToCampaign());
        return Result<Campaign>.Success(campaign);
    }
    catch (ValidationException ex)
    {
        return Result<Campaign>.Failure(ex.Message);
    }
}
```

### Error Handling Standards

#### Exception Handling
```csharp
// Custom exceptions with proper inheritance
public class CampaignNotFoundException : Exception
{
    public Guid CampaignId { get; }
    
    public CampaignNotFoundException(Guid campaignId) 
        : base($"Campaign with ID '{campaignId}' was not found.")
    {
        CampaignId = campaignId;
    }
    
    public CampaignNotFoundException(Guid campaignId, Exception innerException) 
        : base($"Campaign with ID '{campaignId}' was not found.", innerException)
    {
        CampaignId = campaignId;
    }
}

// Proper exception handling in methods
public async Task<Campaign> GetCampaignAsync(Guid campaignId)
{
    if (campaignId == Guid.Empty)
        throw new ArgumentException("Campaign ID cannot be empty.", nameof(campaignId));
    
    try
    {
        var campaign = await _repository.GetByIdAsync(campaignId);
        
        if (campaign == null)
            throw new CampaignNotFoundException(campaignId);
            
        return campaign;
    }
    catch (DatabaseException ex)
    {
        _logger.LogError(ex, "Database error while retrieving campaign {CampaignId}", campaignId);
        throw new CampaignServiceException("Failed to retrieve campaign due to database error.", ex);
    }
}
```

#### Logging Standards
```csharp
public class CampaignService
{
    private readonly ILogger<CampaignService> _logger;
    
    public async Task<Campaign> CreateCampaignAsync(CreateCampaignRequest request)
    {
        _logger.LogInformation("Creating campaign '{CampaignName}' for user {UserId}", 
            request.Name, request.UserId);
        
        try
        {
            var campaign = await _repository.CreateAsync(request.ToCampaign());
            
            _logger.LogInformation("Successfully created campaign {CampaignId} '{CampaignName}'", 
                campaign.Id, campaign.Name);
            
            return campaign;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create campaign '{CampaignName}' for user {UserId}", 
                request.Name, request.UserId);
            throw;
        }
    }
}

// Log levels usage:
// LogTrace: Very detailed information, typically only of interest when diagnosing problems
// LogDebug: Information useful to developers, not typically enabled in production
// LogInformation: General information about application flow
// LogWarning: Unexpected or unusual events that don't stop the application
// LogError: Errors and exceptions that cannot be handled
// LogCritical: Critical errors that cause the entire application or system to fail
```

### Dependency Injection Patterns

#### Constructor Injection
```csharp
public class CampaignController : ControllerBase
{
    private readonly ICampaignService _campaignService;
    private readonly ILogger<CampaignController> _logger;
    private readonly IMapper _mapper;
    
    public CampaignController(
        ICampaignService campaignService,
        ILogger<CampaignController> logger,
        IMapper mapper)
    {
        _campaignService = campaignService ?? throw new ArgumentNullException(nameof(campaignService));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        _mapper = mapper ?? throw new ArgumentNullException(nameof(mapper));
    }
}
```

#### Service Registration
```csharp
// Program.cs or Startup.cs
public void ConfigureServices(IServiceCollection services)
{
    // Scoped services (per request)
    services.AddScoped<ICampaignService, CampaignService>();
    services.AddScoped<ICampaignRepository, CampaignRepository>();
    
    // Singleton services (application lifetime)
    services.AddSingleton<ICacheService, RedisCacheService>();
    services.AddSingleton<IConfiguration>(configuration);
    
    // Transient services (new instance each time)
    services.AddTransient<IEmailService, EmailService>();
    services.AddTransient<IValidator<CreateCampaignRequest>, CreateCampaignValidator>();
}
```

### Async/Await Patterns

#### Proper Async Usage
```csharp
// Good: Proper async/await usage
public async Task<Campaign> CreateCampaignAsync(CreateCampaignRequest request)
{
    var existingCampaign = await _repository.FindByNameAsync(request.Name);
    if (existingCampaign != null)
        throw new DuplicateCampaignNameException(request.Name);
    
    var campaign = new Campaign(request.Name, request.Description);
    await _repository.SaveAsync(campaign);
    
    await _eventBus.PublishAsync(new CampaignCreatedEvent(campaign.Id));
    
    return campaign;
}

// Good: ConfigureAwait for library code
public async Task<T> GetFromCacheAsync<T>(string key)
{
    var cachedValue = await _cache.GetStringAsync(key).ConfigureAwait(false);
    return cachedValue != null ? JsonSerializer.Deserialize<T>(cachedValue) : default;
}

// Bad: Blocking on async code
public Campaign CreateCampaign(CreateCampaignRequest request)
{
    return CreateCampaignAsync(request).Result; // DON'T DO THIS
}

// Bad: Unnecessary async/await
public async Task<string> GetCampaignNameAsync(Guid id)
{
    return await Task.FromResult($"Campaign_{id}"); // Should be synchronous
}
```

### LINQ and Collections

#### LINQ Guidelines
```csharp
// Good: Clear, readable LINQ
var activeCampaigns = campaigns
    .Where(c => c.Status == CampaignStatus.Active)
    .OrderBy(c => c.CreatedAt)
    .Select(c => new CampaignSummaryDto
    {
        Id = c.Id,
        Name = c.Name,
        PlayerCount = c.Players.Count
    })
    .ToList();

// Good: Use appropriate LINQ methods
var hasActiveCampaigns = campaigns.Any(c => c.Status == CampaignStatus.Active);
var campaignNames = campaigns.Select(c => c.Name).ToHashSet();

// Bad: Overly complex single-line LINQ
var result = campaigns.Where(c => c.Status == CampaignStatus.Active).SelectMany(c => c.Players).Where(p => p.Level > 5).GroupBy(p => p.Class).ToDictionary(g => g.Key, g => g.Count());
```

---

## Flutter/Dart Standards

### Naming Conventions
```dart
// Classes and enums - PascalCase
class CampaignService {}
enum CampaignStatus { active, completed, archived }

// Variables, functions, parameters - camelCase
String campaignName = 'My Campaign';
int playerCount = 4;

void createCampaign(String name, String description) {}

// Constants - lowerCamelCase
const int maxCampaignNameLength = 100;
const String defaultCampaignStatus = 'active';

// Private members - underscore prefix
class CampaignService {
  String _internalState;
  void _privateMethod() {}
}

// Files and directories - snake_case
// campaign_service.dart
// create_campaign_page.dart
// campaign_list_widget.dart
```

### Widget Structure
```dart
class CreateCampaignPage extends StatefulWidget {
  const CreateCampaignPage({
    Key? key,
    required this.userId,
  }) : super(key: key);
  
  final String userId;
  
  @override
  State<CreateCampaignPage> createState() => _CreateCampaignPageState();
}

class _CreateCampaignPageState extends State<CreateCampaignPage> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _descriptionController = TextEditingController();
  
  @override
  void dispose() {
    _nameController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Create Campaign')),
      body: _buildForm(),
    );
  }
  
  Widget _buildForm() {
    return Form(
      key: _formKey,
      child: Column(
        children: [
          _buildNameField(),
          _buildDescriptionField(),
          _buildSubmitButton(),
        ],
      ),
    );
  }
}
```

---

## Documentation Standards

### XML Documentation (C#)
```csharp
/// <summary>
/// Creates a new campaign for the specified user.
/// </summary>
/// <param name="request">The campaign creation request containing name and description.</param>
/// <param name="cancellationToken">Cancellation token for the operation.</param>
/// <returns>A task that represents the asynchronous operation. The task result contains the created campaign.</returns>
/// <exception cref="ArgumentNullException">Thrown when <paramref name="request"/> is null.</exception>
/// <exception cref="DuplicateCampaignNameException">Thrown when a campaign with the same name already exists.</exception>
/// <exception cref="ValidationException">Thrown when the request contains invalid data.</exception>
public async Task<Campaign> CreateCampaignAsync(
    CreateCampaignRequest request, 
    CancellationToken cancellationToken = default)
{
    // Implementation
}
```

### Inline Comments
```csharp
public class CampaignService
{
    public async Task<Campaign> CreateCampaignAsync(CreateCampaignRequest request)
    {
        // Validate the request before processing
        await ValidateCreateCampaignRequest(request);
        
        // Check for duplicate campaign names within the user's campaigns
        var existingCampaign = await _repository
            .FindByUserAndNameAsync(request.UserId, request.Name);
        
        if (existingCampaign != null)
        {
            throw new DuplicateCampaignNameException(request.Name);
        }
        
        // Create and persist the new campaign
        var campaign = new Campaign
        {
            Name = request.Name,
            Description = request.Description,
            UserId = request.UserId,
            CreatedAt = DateTime.UtcNow
        };
        
        return await _repository.SaveAsync(campaign);
    }
}
```

---

## Code Formatting Standards

### EditorConfig Settings
```ini
# .editorconfig
root = true

[*]
charset = utf-8
end_of_line = crlf
insert_final_newline = true
trim_trailing_whitespace = true

[*.cs]
indent_style = space
indent_size = 4
max_line_length = 120

# C# specific formatting rules
dotnet_sort_system_directives_first = true
dotnet_separate_import_directive_groups = false

csharp_new_line_before_open_brace = all
csharp_new_line_before_else = true
csharp_new_line_before_catch = true
csharp_new_line_before_finally = true

[*.dart]
indent_style = space
indent_size = 2
max_line_length = 80

[*.{json,yml,yaml}]
indent_style = space
indent_size = 2

[*.md]
trim_trailing_whitespace = false
```

### Code Formatting Examples
```csharp
// Good: Proper spacing and formatting
public async Task<Result<Campaign>> CreateCampaignAsync(
    CreateCampaignRequest request,
    CancellationToken cancellationToken = default)
{
    if (request == null)
        throw new ArgumentNullException(nameof(request));
    
    var validation = await _validator.ValidateAsync(request, cancellationToken);
    if (!validation.IsValid)
    {
        return Result<Campaign>.Failure(validation.Errors.First().ErrorMessage);
    }
    
    try
    {
        var campaign = await _repository.CreateAsync(request.ToCampaign());
        await _eventBus.PublishAsync(new CampaignCreatedEvent(campaign.Id));
        
        return Result<Campaign>.Success(campaign);
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Failed to create campaign");
        return Result<Campaign>.Failure("Campaign creation failed");
    }
}
```

---

## Performance Guidelines

### Efficient Collection Usage
```csharp
// Good: Use appropriate collection types
var userIds = new HashSet<Guid>(); // For uniqueness and fast lookups
var userCampaigns = new Dictionary<Guid, List<Campaign>>(); // For key-value mapping

// Good: Use LINQ efficiently
var activeCampaigns = campaigns.Where(c => c.IsActive).ToList();
var campaignCount = campaigns.Count(c => c.IsActive); // Don't use .Where().Count()

// Good: Avoid multiple enumeration
var processedCampaigns = campaigns.Where(FilterCampaigns).ToList();
foreach (var campaign in processedCampaigns) { /* process */ }
```

### Memory Management
```csharp
// Good: Proper disposal pattern
public class CampaignService : IDisposable
{
    private readonly HttpClient _httpClient;
    private bool _disposed = false;
    
    public void Dispose()
    {
        Dispose(true);
        GC.SuppressFinalize(this);
    }
    
    protected virtual void Dispose(bool disposing)
    {
        if (!_disposed && disposing)
        {
            _httpClient?.Dispose();
        }
        _disposed = true;
    }
}

// Good: Use using statements for disposables
using var fileStream = new FileStream(filePath, FileMode.Open);
var content = await fileStream.ReadToEndAsync();
```

---

## Security Guidelines

### Input Validation
```csharp
public class CreateCampaignValidator : AbstractValidator<CreateCampaignRequest>
{
    public CreateCampaignValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty()
            .MaximumLength(100)
            .Matches("^[a-zA-Z0-9\\s\\-_]+$") // Only allow safe characters
            .WithMessage("Campaign name contains invalid characters");
        
        RuleFor(x => x.Description)
            .MaximumLength(1000);
        
        RuleFor(x => x.UserId)
            .NotEmpty()
            .Must(BeValidGuid)
            .WithMessage("Invalid user ID format");
    }
    
    private bool BeValidGuid(Guid guid)
    {
        return guid != Guid.Empty;
    }
}
```

### Secure Data Handling
```csharp
// Good: Use secure string handling for sensitive data
public class AuthenticationService
{
    private readonly IConfiguration _configuration;
    
    public async Task<string> GenerateTokenAsync(User user)
    {
        var secretKey = _configuration["Jwt:SecretKey"];
        // Use secure key handling - never log sensitive data
        
        var tokenHandler = new JwtSecurityTokenHandler();
        var key = Encoding.ASCII.GetBytes(secretKey);
        
        // Token generation logic...
    }
}
```

---

## Testing Standards

### Unit Test Structure
```csharp
[TestClass]
public class CampaignServiceTests
{
    [TestMethod]
    public async Task CreateCampaignAsync_WithValidRequest_ReturnsCampaign()
    {
        // Arrange
        var mockRepository = new Mock<ICampaignRepository>();
        var mockValidator = new Mock<IValidator<CreateCampaignRequest>>();
        var service = new CampaignService(mockRepository.Object, mockValidator.Object);
        
        var request = new CreateCampaignRequest
        {
            Name = "Test Campaign",
            Description = "Test Description",
            UserId = Guid.NewGuid()
        };
        
        mockValidator.Setup(v => v.ValidateAsync(It.IsAny<CreateCampaignRequest>(), default))
            .ReturnsAsync(new ValidationResult());
        
        // Act
        var result = await service.CreateCampaignAsync(request);
        
        // Assert
        Assert.IsNotNull(result);
        Assert.AreEqual(request.Name, result.Name);
        mockRepository.Verify(r => r.CreateAsync(It.IsAny<Campaign>()), Times.Once);
    }
}
```

This coding standards document ensures consistency and quality across the entire codebase for both C# backend services and Flutter mobile application.