# File Service Implementation Specification

## Overview
The File Service manages all file operations for the D&D AI Campaign Management System, including character portraits, campaign maps, AI-generated images, audio files, and document attachments. It provides secure, scalable file storage with CDN integration and comprehensive asset management.

## Service Architecture

### Technology Stack
- **Framework**: ASP.NET Core 8.0
- **Storage**: Azure Blob Storage / AWS S3 with local development support
- **CDN**: Azure CDN / CloudFront for global content delivery
- **Image Processing**: ImageSharp for resizing and optimization
- **Audio Processing**: FFMpeg for audio format conversion
- **Database**: PostgreSQL with Entity Framework Core
- **Caching**: Redis for metadata caching
- **Security**: JWT authentication with role-based authorization
- **Monitoring**: Prometheus metrics and structured logging

### Project Structure
```
FileService/
├── src/
│   ├── FileService.Api/                # Web API layer
│   │   ├── Controllers/
│   │   │   ├── FileController.cs       # File upload/download
│   │   │   ├── ImageController.cs      # Image-specific operations
│   │   │   ├── AudioController.cs      # Audio file management
│   │   │   └── AssetController.cs      # Asset management
│   │   ├── Middleware/
│   │   │   ├── FileValidationMiddleware.cs
│   │   │   └── VirusScanningScanMiddleware.cs
│   │   ├── Program.cs
│   │   └── appsettings.json
│   ├── FileService.Application/        # Application layer
│   │   ├── Commands/
│   │   │   ├── UploadFileCommand.cs
│   │   │   ├── ProcessImageCommand.cs
│   │   │   ├── GenerateAIImageCommand.cs
│   │   │   └── DeleteFileCommand.cs
│   │   ├── Queries/
│   │   │   ├── GetFileQuery.cs
│   │   │   ├── GetUserFilesQuery.cs
│   │   │   └── GetAssetMetadataQuery.cs
│   │   ├── Handlers/
│   │   ├── Services/
│   │   │   ├── FileProcessing/         # File processing services
│   │   │   ├── ImageGeneration/        # AI image generation
│   │   │   ├── AudioProcessing/        # Audio handling
│   │   │   └── AssetManagement/        # Asset organization
│   │   └── DTOs/
│   ├── FileService.Domain/             # Domain layer
│   │   ├── Entities/
│   │   │   ├── FileAsset.cs
│   │   │   ├── ImageAsset.cs
│   │   │   ├── AudioAsset.cs
│   │   │   └── AssetCollection.cs
│   │   ├── ValueObjects/
│   │   │   ├── FileMetadata.cs
│   │   │   ├── ImageDimensions.cs
│   │   │   └── StorageLocation.cs
│   │   ├── Events/
│   │   ├── Repositories/
│   │   └── Services/
│   └── FileService.Infrastructure/     # Infrastructure layer
│       ├── Data/
│       ├── Repositories/
│       ├── Storage/
│       │   ├── BlobStorageService.cs   # Cloud storage
│       │   ├── LocalStorageService.cs  # Development storage
│       │   └── CDNService.cs           # CDN integration
│       ├── ImageProcessing/
│       │   ├── ImageSharpProcessor.cs
│       │   └── AIImageGenerator.cs
│       ├── AudioProcessing/
│       │   └── FFMpegProcessor.cs
│       └── Security/
│           ├── VirusScanningService.cs
│           └── FileValidationService.cs
└── tests/
    ├── FileService.UnitTests/
    ├── FileService.IntegrationTests/
    └── FileService.PerformanceTests/
```

## Domain Model

### Core Entities

#### **FileAsset Entity**
```csharp
public class FileAsset : Entity, IAggregateRoot
{
    public string Id { get; private set; }
    public string FileName { get; private set; }
    public string OriginalFileName { get; private set; }
    public string ContentType { get; private set; }
    public long FileSize { get; private set; }
    public string StoragePath { get; private set; }
    public string CDNUrl { get; private set; }
    public FileAssetType AssetType { get; private set; }
    public FileAssetCategory Category { get; private set; }
    public Guid UploadedBy { get; private set; }
    public DateTime UploadedAt { get; private set; }
    public FileAssetStatus Status { get; private set; }
    public FileMetadata Metadata { get; private set; }
    public List<string> Tags { get; private set; } = new();
    
    // Security and compliance
    public bool IsVirusScanned { get; private set; }
    public bool IsVirusClean { get; private set; }
    public DateTime? VirusScannedAt { get; private set; }
    public bool IsEncrypted { get; private set; }
    public string? EncryptionKeyId { get; private set; }
    
    // Access control
    public FileAccessLevel AccessLevel { get; private set; }
    public List<Guid> AuthorizedUsers { get; private set; } = new();
    public List<Guid> AuthorizedCampaigns { get; private set; } = new();
    
    // Usage tracking
    public int DownloadCount { get; private set; }
    public DateTime? LastAccessedAt { get; private set; }
    public long BandwidthUsed { get; private set; }

    protected FileAsset() { } // EF Constructor

    public FileAsset(
        string fileName,
        string originalFileName,
        string contentType,
        long fileSize,
        string storagePath,
        FileAssetType assetType,
        FileAssetCategory category,
        Guid uploadedBy,
        FileAccessLevel accessLevel = FileAccessLevel.Private)
    {
        Id = Guid.NewGuid().ToString();
        FileName = fileName;
        OriginalFileName = originalFileName;
        ContentType = contentType;
        FileSize = fileSize;
        StoragePath = storagePath;
        AssetType = assetType;
        Category = category;
        UploadedBy = uploadedBy;
        UploadedAt = DateTime.UtcNow;
        Status = FileAssetStatus.Uploaded;
        AccessLevel = accessLevel;
        Metadata = new FileMetadata();
        
        AddDomainEvent(new FileUploadedEvent(Id, uploadedBy, assetType));
    }

    public void MarkVirusScanned(bool isClean)
    {
        IsVirusScanned = true;
        IsVirusClean = isClean;
        VirusScannedAt = DateTime.UtcNow;
        
        Status = isClean ? FileAssetStatus.Available : FileAssetStatus.Quarantined;
        
        AddDomainEvent(new FileVirusScannedEvent(Id, isClean));
    }

    public void SetCDNUrl(string cdnUrl)
    {
        CDNUrl = cdnUrl;
        Status = FileAssetStatus.Available;
        
        AddDomainEvent(new FileCDNProcessedEvent(Id, cdnUrl));
    }

    public void TrackAccess(long bytesTransferred = 0)
    {
        DownloadCount++;
        LastAccessedAt = DateTime.UtcNow;
        BandwidthUsed += bytesTransferred;
        
        AddDomainEvent(new FileAccessedEvent(Id, UploadedBy, bytesTransferred));
    }

    public void AddTag(string tag)
    {
        if (!Tags.Contains(tag, StringComparer.OrdinalIgnoreCase))
        {
            Tags.Add(tag.ToLower());
        }
    }

    public void GrantAccess(Guid userId)
    {
        if (!AuthorizedUsers.Contains(userId))
        {
            AuthorizedUsers.Add(userId);
        }
    }

    public void GrantCampaignAccess(Guid campaignId)
    {
        if (!AuthorizedCampaigns.Contains(campaignId))
        {
            AuthorizedCampaigns.Add(campaignId);
        }
    }

    public bool CanAccess(Guid userId, List<Guid> userCampaigns = null)
    {
        if (AccessLevel == FileAccessLevel.Public) return true;
        if (UploadedBy == userId) return true;
        if (AuthorizedUsers.Contains(userId)) return true;
        
        if (userCampaigns != null && AuthorizedCampaigns.Any(c => userCampaigns.Contains(c)))
            return true;
            
        return false;
    }

    public void Delete()
    {
        Status = FileAssetStatus.Deleted;
        AddDomainEvent(new FileDeletedEvent(Id, UploadedBy));
    }
}
```

#### **ImageAsset Entity (Specialized)**
```csharp
public class ImageAsset : FileAsset
{
    public ImageDimensions Dimensions { get; private set; }
    public List<ImageVariant> Variants { get; private set; } = new();
    public ImageGenerationSource GenerationSource { get; private set; }
    public string? AIPrompt { get; private set; }
    public string? AIProvider { get; private set; }
    public DateTime? AIGeneratedAt { get; private set; }

    protected ImageAsset() { } // EF Constructor

    public ImageAsset(
        string fileName,
        string originalFileName,
        long fileSize,
        string storagePath,
        FileAssetCategory category,
        Guid uploadedBy,
        ImageDimensions dimensions,
        FileAccessLevel accessLevel = FileAccessLevel.Private)
        : base(fileName, originalFileName, "image/jpeg", fileSize, storagePath, 
               FileAssetType.Image, category, uploadedBy, accessLevel)
    {
        Dimensions = dimensions;
        GenerationSource = ImageGenerationSource.UserUpload;
    }

    public static ImageAsset CreateAIGenerated(
        string fileName,
        long fileSize,
        string storagePath,
        FileAssetCategory category,
        Guid requestedBy,
        ImageDimensions dimensions,
        string aiPrompt,
        string aiProvider,
        FileAccessLevel accessLevel = FileAccessLevel.Private)
    {
        var image = new ImageAsset(fileName, fileName, fileSize, storagePath, 
                                  category, requestedBy, dimensions, accessLevel)
        {
            GenerationSource = ImageGenerationSource.AIGenerated,
            AIPrompt = aiPrompt,
            AIProvider = aiProvider,
            AIGeneratedAt = DateTime.UtcNow
        };

        image.AddTag("ai-generated");
        image.AddTag(aiProvider.ToLower());
        image.AddDomainEvent(new AIImageGeneratedEvent(image.Id, requestedBy, aiPrompt));

        return image;
    }

    public void AddVariant(ImageVariant variant)
    {
        var existingVariant = Variants.FirstOrDefault(v => v.Size == variant.Size);
        if (existingVariant != null)
        {
            Variants.Remove(existingVariant);
        }
        
        Variants.Add(variant);
        AddDomainEvent(new ImageVariantCreatedEvent(Id, variant.Size, variant.StoragePath));
    }

    public ImageVariant? GetVariant(ImageSize size)
    {
        return Variants.FirstOrDefault(v => v.Size == size);
    }

    public ImageVariant GetBestVariant(ImageSize requestedSize)
    {
        var exactMatch = Variants.FirstOrDefault(v => v.Size == requestedSize);
        if (exactMatch != null) return exactMatch;

        // Return the closest larger size
        var largerVariants = Variants.Where(v => (int)v.Size > (int)requestedSize).OrderBy(v => v.Size);
        return largerVariants.FirstOrDefault() ?? Variants.OrderByDescending(v => v.Size).First();
    }
}
```

#### **AudioAsset Entity (Specialized)**
```csharp
public class AudioAsset : FileAsset
{
    public TimeSpan Duration { get; private set; }
    public int SampleRate { get; private set; }
    public int BitRate { get; private set; }
    public int Channels { get; private set; }
    public AudioFormat Format { get; private set; }
    public AudioGenerationSource GenerationSource { get; private set; }
    public string? TranscriptionText { get; private set; }
    public string? AIPrompt { get; private set; }
    public string? VoiceModel { get; private set; }

    protected AudioAsset() { } // EF Constructor

    public AudioAsset(
        string fileName,
        string originalFileName,
        long fileSize,
        string storagePath,
        FileAssetCategory category,
        Guid uploadedBy,
        TimeSpan duration,
        AudioFormat format,
        FileAccessLevel accessLevel = FileAccessLevel.Private)
        : base(fileName, originalFileName, GetContentType(format), fileSize, storagePath, 
               FileAssetType.Audio, category, uploadedBy, accessLevel)
    {
        Duration = duration;
        Format = format;
        GenerationSource = AudioGenerationSource.UserUpload;
    }

    public static AudioAsset CreateAIGenerated(
        string fileName,
        long fileSize,
        string storagePath,
        FileAssetCategory category,
        Guid requestedBy,
        TimeSpan duration,
        AudioFormat format,
        string aiPrompt,
        string voiceModel,
        FileAccessLevel accessLevel = FileAccessLevel.Private)
    {
        var audio = new AudioAsset(fileName, fileName, fileSize, storagePath, 
                                  category, requestedBy, duration, format, accessLevel)
        {
            GenerationSource = AudioGenerationSource.AIGenerated,
            AIPrompt = aiPrompt,
            VoiceModel = voiceModel
        };

        audio.AddTag("ai-generated");
        audio.AddTag("voice-synthesis");
        audio.AddDomainEvent(new AIAudioGeneratedEvent(audio.Id, requestedBy, aiPrompt, voiceModel));

        return audio;
    }

    public void SetTranscription(string transcriptionText)
    {
        TranscriptionText = transcriptionText;
        AddTag("transcribed");
        AddDomainEvent(new AudioTranscribedEvent(Id, transcriptionText));
    }

    private static string GetContentType(AudioFormat format)
    {
        return format switch
        {
            AudioFormat.MP3 => "audio/mpeg",
            AudioFormat.WAV => "audio/wav",
            AudioFormat.OGG => "audio/ogg",
            AudioFormat.M4A => "audio/mp4",
            _ => "audio/mpeg"
        };
    }
}
```

### Value Objects

#### **FileMetadata**
```csharp
public class FileMetadata : ValueObject
{
    public Dictionary<string, string> Properties { get; private set; } = new();
    public string? Description { get; private set; }
    public List<string> Keywords { get; private set; } = new();
    public string? Source { get; private set; }
    public string? License { get; private set; }
    public string? Attribution { get; private set; }

    public FileMetadata() { }

    public FileMetadata(
        string? description = null,
        string? source = null,
        string? license = null,
        string? attribution = null)
    {
        Description = description;
        Source = source;
        License = license;
        Attribution = attribution;
    }

    public void SetProperty(string key, string value)
    {
        Properties[key] = value;
    }

    public string? GetProperty(string key)
    {
        return Properties.TryGetValue(key, out var value) ? value : null;
    }

    public void AddKeyword(string keyword)
    {
        if (!Keywords.Contains(keyword, StringComparer.OrdinalIgnoreCase))
        {
            Keywords.Add(keyword.ToLower());
        }
    }

    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return Description ?? string.Empty;
        yield return Source ?? string.Empty;
        yield return License ?? string.Empty;
        yield return Attribution ?? string.Empty;
        
        foreach (var kvp in Properties.OrderBy(p => p.Key))
        {
            yield return kvp.Key;
            yield return kvp.Value;
        }
        
        foreach (var keyword in Keywords.OrderBy(k => k))
        {
            yield return keyword;
        }
    }
}
```

#### **ImageDimensions & ImageVariant**
```csharp
public class ImageDimensions : ValueObject
{
    public int Width { get; private set; }
    public int Height { get; private set; }
    public double AspectRatio => (double)Width / Height;

    public ImageDimensions(int width, int height)
    {
        if (width <= 0) throw new ArgumentException("Width must be positive", nameof(width));
        if (height <= 0) throw new ArgumentException("Height must be positive", nameof(height));
        
        Width = width;
        Height = height;
    }

    public bool IsPortrait => Height > Width;
    public bool IsLandscape => Width > Height;
    public bool IsSquare => Width == Height;

    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return Width;
        yield return Height;
    }
}

public class ImageVariant : ValueObject
{
    public ImageSize Size { get; private set; }
    public string StoragePath { get; private set; }
    public string CDNUrl { get; private set; }
    public ImageDimensions Dimensions { get; private set; }
    public long FileSize { get; private set; }
    public DateTime CreatedAt { get; private set; }

    public ImageVariant(
        ImageSize size,
        string storagePath,
        string cdnUrl,
        ImageDimensions dimensions,
        long fileSize)
    {
        Size = size;
        StoragePath = storagePath;
        CDNUrl = cdnUrl;
        Dimensions = dimensions;
        FileSize = fileSize;
        CreatedAt = DateTime.UtcNow;
    }

    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return Size;
        yield return StoragePath;
        yield return Dimensions;
    }
}
```

### Enumerations

```csharp
public enum FileAssetType
{
    Image = 1,
    Audio = 2,
    Video = 3,
    Document = 4,
    Archive = 5,
    Other = 99
}

public enum FileAssetCategory
{
    CharacterPortrait = 1,
    NPCPortrait = 2,
    CampaignMap = 3,
    BattleMap = 4,
    LocationImage = 5,
    ItemImage = 6,
    CreatureImage = 7,
    BackgroundMusic = 8,
    SoundEffect = 9,
    VoiceActing = 10,
    CampaignDocument = 11,
    CharacterSheet = 12,
    SessionNotes = 13,
    Other = 99
}

public enum FileAssetStatus
{
    Uploaded = 1,
    Processing = 2,
    VirusScanning = 3,
    Available = 4,
    Quarantined = 5,
    Deleted = 6,
    Archived = 7
}

public enum FileAccessLevel
{
    Private = 1,      // Only owner
    Campaign = 2,     // Campaign members
    Friends = 3,      // Friends list
    Public = 4        // Anyone
}

public enum ImageSize
{
    Thumbnail = 1,    // 150x150
    Small = 2,        // 300x300
    Medium = 3,       // 600x600
    Large = 4,        // 1200x1200
    Original = 5      // Original size
}

public enum ImageGenerationSource
{
    UserUpload = 1,
    AIGenerated = 2,
    SystemGenerated = 3
}

public enum AudioFormat
{
    MP3 = 1,
    WAV = 2,
    OGG = 3,
    M4A = 4
}

public enum AudioGenerationSource
{
    UserUpload = 1,
    AIGenerated = 2,
    Recording = 3
}
```

## Application Layer

### Commands and Handlers

#### **Upload File Command**
```csharp
public record UploadFileCommand : IRequest<UploadFileResponse>
{
    public IFormFile File { get; init; } = null!;
    public FileAssetCategory Category { get; init; }
    public FileAccessLevel AccessLevel { get; init; } = FileAccessLevel.Private;
    public string? Description { get; init; }
    public List<string> Tags { get; init; } = new();
    public Guid? CampaignId { get; init; }
    public Guid UserId { get; init; }
}

public class UploadFileCommandHandler : IRequestHandler<UploadFileCommand, UploadFileResponse>
{
    private readonly IFileAssetRepository _repository;
    private readonly IStorageService _storageService;
    private readonly IFileValidationService _validationService;
    private readonly IVirusScanningService _virusScanningService;
    private readonly IImageProcessingService _imageProcessingService;
    private readonly ILogger<UploadFileCommandHandler> _logger;

    public async Task<UploadFileResponse> Handle(UploadFileCommand request, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Processing file upload for user {UserId}, category {Category}", 
            request.UserId, request.Category);

        // 1. Validate file
        var validationResult = await _validationService.ValidateFileAsync(request.File);
        if (!validationResult.IsValid)
        {
            throw new FileValidationException(validationResult.Errors);
        }

        // 2. Generate unique filename and storage path
        var fileExtension = Path.GetExtension(request.File.FileName);
        var uniqueFileName = $"{Guid.NewGuid()}{fileExtension}";
        var storagePath = GenerateStoragePath(request.Category, request.UserId, uniqueFileName);

        // 3. Upload to storage
        using var stream = request.File.OpenReadStream();
        var uploadResult = await _storageService.UploadAsync(storagePath, stream, request.File.ContentType);

        // 4. Create file asset entity
        var fileAsset = CreateFileAsset(request, uniqueFileName, storagePath, uploadResult.Size);
        
        // 5. Set metadata
        if (!string.IsNullOrEmpty(request.Description))
        {
            fileAsset.Metadata.Description = request.Description;
        }

        foreach (var tag in request.Tags)
        {
            fileAsset.AddTag(tag);
        }

        // 6. Grant campaign access if specified
        if (request.CampaignId.HasValue)
        {
            fileAsset.GrantCampaignAccess(request.CampaignId.Value);
        }

        // 7. Save to database
        await _repository.AddAsync(fileAsset, cancellationToken);
        await _repository.UnitOfWork.SaveEntitiesAsync(cancellationToken);

        // 8. Start background processing
        _ = Task.Run(async () =>
        {
            try
            {
                // Virus scanning
                var scanResult = await _virusScanningService.ScanFileAsync(uploadResult.StoragePath);
                fileAsset.MarkVirusScanned(scanResult.IsClean);

                // Image processing (if image)
                if (fileAsset is ImageAsset imageAsset)
                {
                    await ProcessImageVariantsAsync(imageAsset);
                }

                // Update CDN URL
                var cdnUrl = await _storageService.GetCDNUrlAsync(storagePath);
                fileAsset.SetCDNUrl(cdnUrl);

                await _repository.UnitOfWork.SaveEntitiesAsync(CancellationToken.None);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Background processing failed for file {FileId}", fileAsset.Id);
            }
        }, cancellationToken);

        return new UploadFileResponse
        {
            FileId = fileAsset.Id,
            FileName = fileAsset.FileName,
            FileSize = fileAsset.FileSize,
            ContentType = fileAsset.ContentType,
            Status = fileAsset.Status,
            UploadedAt = fileAsset.UploadedAt
        };
    }

    private FileAsset CreateFileAsset(UploadFileCommand request, string fileName, string storagePath, long fileSize)
    {
        var assetType = DetermineAssetType(request.File.ContentType);
        
        return assetType switch
        {
            FileAssetType.Image => CreateImageAsset(request, fileName, storagePath, fileSize),
            FileAssetType.Audio => CreateAudioAsset(request, fileName, storagePath, fileSize),
            _ => new FileAsset(fileName, request.File.FileName, request.File.ContentType, 
                              fileSize, storagePath, assetType, request.Category, 
                              request.UserId, request.AccessLevel)
        };
    }

    private ImageAsset CreateImageAsset(UploadFileCommand request, string fileName, string storagePath, long fileSize)
    {
        // Extract image dimensions (this would be done during validation)
        var dimensions = ExtractImageDimensions(request.File);
        
        return new ImageAsset(fileName, request.File.FileName, fileSize, storagePath, 
                             request.Category, request.UserId, dimensions, request.AccessLevel);
    }

    private async Task ProcessImageVariantsAsync(ImageAsset imageAsset)
    {
        var sizes = new[] { ImageSize.Thumbnail, ImageSize.Small, ImageSize.Medium, ImageSize.Large };
        
        foreach (var size in sizes)
        {
            if (size == ImageSize.Original) continue;
            
            var variant = await _imageProcessingService.CreateVariantAsync(imageAsset, size);
            imageAsset.AddVariant(variant);
        }
    }
}
```

#### **Generate AI Image Command**
```csharp
public record GenerateAIImageCommand : IRequest<GenerateAIImageResponse>
{
    public string Prompt { get; init; } = string.Empty;
    public string Style { get; init; } = "fantasy";
    public ImageSize Size { get; init; } = ImageSize.Medium;
    public FileAssetCategory Category { get; init; }
    public FileAccessLevel AccessLevel { get; init; } = FileAccessLevel.Private;
    public Guid? CampaignId { get; init; }
    public Guid UserId { get; init; }
}

public class GenerateAIImageCommandHandler : IRequestHandler<GenerateAIImageCommand, GenerateAIImageResponse>
{
    private readonly IAIImageGenerationService _aiImageService;
    private readonly IFileAssetRepository _repository;
    private readonly IStorageService _storageService;
    private readonly ISubscriptionService _subscriptionService;
    private readonly ILogger<GenerateAIImageCommandHandler> _logger;

    public async Task<GenerateAIImageResponse> Handle(GenerateAIImageCommand request, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Generating AI image for user {UserId} with prompt: {Prompt}", 
            request.UserId, request.Prompt);

        // 1. Check subscription limits
        var canGenerate = await _subscriptionService.CanGenerateAIImageAsync(request.UserId);
        if (!canGenerate)
        {
            throw new SubscriptionLimitExceededException("AI image generation limit exceeded");
        }

        // 2. Generate image using AI service
        var generationResult = await _aiImageService.GenerateImageAsync(new AIImageRequest
        {
            Prompt = request.Prompt,
            Style = request.Style,
            Size = GetImageDimensions(request.Size),
            UserId = request.UserId
        });

        // 3. Upload generated image to storage
        var fileName = $"ai_generated_{Guid.NewGuid()}.png";
        var storagePath = GenerateStoragePath(request.Category, request.UserId, fileName);
        
        using var imageStream = new MemoryStream(generationResult.ImageData);
        var uploadResult = await _storageService.UploadAsync(storagePath, imageStream, "image/png");

        // 4. Create image asset
        var imageAsset = ImageAsset.CreateAIGenerated(
            fileName,
            uploadResult.Size,
            storagePath,
            request.Category,
            request.UserId,
            generationResult.Dimensions,
            request.Prompt,
            generationResult.Provider,
            request.AccessLevel);

        // 5. Grant campaign access if specified
        if (request.CampaignId.HasValue)
        {
            imageAsset.GrantCampaignAccess(request.CampaignId.Value);
        }

        // 6. Save to database
        await _repository.AddAsync(imageAsset, cancellationToken);
        await _repository.UnitOfWork.SaveEntitiesAsync(cancellationToken);

        // 7. Track usage
        await _subscriptionService.TrackAIImageGenerationAsync(request.UserId);

        // 8. Start background processing for variants
        _ = Task.Run(async () =>
        {
            try
            {
                await ProcessImageVariantsAsync(imageAsset);
                
                var cdnUrl = await _storageService.GetCDNUrlAsync(storagePath);
                imageAsset.SetCDNUrl(cdnUrl);
                
                await _repository.UnitOfWork.SaveEntitiesAsync(CancellationToken.None);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Background processing failed for AI image {FileId}", imageAsset.Id);
            }
        }, cancellationToken);

        return new GenerateAIImageResponse
        {
            FileId = imageAsset.Id,
            FileName = imageAsset.FileName,
            Prompt = request.Prompt,
            Provider = generationResult.Provider,
            Dimensions = generationResult.Dimensions,
            GeneratedAt = imageAsset.AIGeneratedAt!.Value,
            Status = imageAsset.Status
        };
    }
}
```

### Queries and Handlers

#### **Get User Files Query**
```csharp
public record GetUserFilesQuery : IRequest<GetUserFilesResponse>
{
    public Guid UserId { get; init; }
    public FileAssetType? AssetType { get; init; }
    public FileAssetCategory? Category { get; init; }
    public List<string> Tags { get; init; } = new();
    public string? SearchTerm { get; init; }
    public int Page { get; init; } = 1;
    public int PageSize { get; init; } = 20;
    public string SortBy { get; init; } = "UploadedAt";
    public bool SortDescending { get; init; } = true;
}

public class GetUserFilesQueryHandler : IRequestHandler<GetUserFilesQuery, GetUserFilesResponse>
{
    private readonly IFileAssetRepository _repository;
    private readonly ICacheService _cacheService;
    private readonly ILogger<GetUserFilesQueryHandler> _logger;

    public async Task<GetUserFilesResponse> Handle(GetUserFilesQuery request, CancellationToken cancellationToken)
    {
        var cacheKey = $"user_files:{request.UserId}:{request.GetHashCode()}";
        var cachedResult = await _cacheService.GetAsync<GetUserFilesResponse>(cacheKey);
        
        if (cachedResult != null)
        {
            return cachedResult;
        }

        var specification = new UserFilesSpecification(request);
        var files = await _repository.GetPagedAsync(specification, request.Page, request.PageSize);
        var totalCount = await _repository.CountAsync(specification);

        var response = new GetUserFilesResponse
        {
            Files = files.Select(f => new FileAssetDto
            {
                Id = f.Id,
                FileName = f.FileName,
                OriginalFileName = f.OriginalFileName,
                ContentType = f.ContentType,
                FileSize = f.FileSize,
                CDNUrl = f.CDNUrl,
                AssetType = f.AssetType,
                Category = f.Category,
                Status = f.Status,
                UploadedAt = f.UploadedAt,
                Tags = f.Tags,
                DownloadCount = f.DownloadCount,
                LastAccessedAt = f.LastAccessedAt,
                
                // Image-specific properties
                Dimensions = f is ImageAsset img ? new ImageDimensionsDto 
                { 
                    Width = img.Dimensions.Width, 
                    Height = img.Dimensions.Height 
                } : null,
                IsAIGenerated = f is ImageAsset imgAI && imgAI.GenerationSource == ImageGenerationSource.AIGenerated,
                
                // Audio-specific properties
                Duration = f is AudioAsset audio ? audio.Duration : null,
                Format = f is AudioAsset audioFmt ? audioFmt.Format.ToString() : null
            }).ToList(),
            
            TotalCount = totalCount,
            Page = request.Page,
            PageSize = request.PageSize,
            TotalPages = (int)Math.Ceiling((double)totalCount / request.PageSize)
        };

        await _cacheService.SetAsync(cacheKey, response, TimeSpan.FromMinutes(5));
        return response;
    }
}
```

## Infrastructure Layer

### Storage Services

#### **Blob Storage Service**
```csharp
public interface IStorageService
{
    Task<StorageUploadResult> UploadAsync(string path, Stream stream, string contentType);
    Task<Stream> DownloadAsync(string path);
    Task<bool> DeleteAsync(string path);
    Task<string> GetCDNUrlAsync(string path);
    Task<StorageMetadata> GetMetadataAsync(string path);
    Task<bool> ExistsAsync(string path);
}

public class BlobStorageService : IStorageService
{
    private readonly BlobServiceClient _blobServiceClient;
    private readonly IConfiguration _configuration;
    private readonly ILogger<BlobStorageService> _logger;
    private readonly string _containerName;

    public BlobStorageService(
        BlobServiceClient blobServiceClient,
        IConfiguration configuration,
        ILogger<BlobStorageService> logger)
    {
        _blobServiceClient = blobServiceClient;
        _configuration = configuration;
        _logger = logger;
        _containerName = configuration["Storage:ContainerName"] ?? "dndai-assets";
    }

    public async Task<StorageUploadResult> UploadAsync(string path, Stream stream, string contentType)
    {
        try
        {
            var containerClient = _blobServiceClient.GetBlobContainerClient(_containerName);
            var blobClient = containerClient.GetBlobClient(path);

            var uploadOptions = new BlobUploadOptions
            {
                HttpHeaders = new BlobHttpHeaders
                {
                    ContentType = contentType,
                    CacheControl = "public, max-age=31536000" // 1 year
                },
                Metadata = new Dictionary<string, string>
                {
                    ["uploaded_at"] = DateTime.UtcNow.ToString("O"),
                    ["content_type"] = contentType
                }
            };

            var response = await blobClient.UploadAsync(stream, uploadOptions);

            return new StorageUploadResult
            {
                StoragePath = path,
                Size = stream.Length,
                ETag = response.Value.ETag.ToString(),
                LastModified = response.Value.LastModified,
                Success = true
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to upload file to blob storage: {Path}", path);
            throw new StorageException($"Failed to upload file: {ex.Message}", ex);
        }
    }

    public async Task<Stream> DownloadAsync(string path)
    {
        try
        {
            var containerClient = _blobServiceClient.GetBlobContainerClient(_containerName);
            var blobClient = containerClient.GetBlobClient(path);

            var response = await blobClient.DownloadStreamingAsync();
            return response.Value.Content;
        }
        catch (RequestFailedException ex) when (ex.Status == 404)
        {
            throw new FileNotFoundException($"File not found: {path}");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to download file from blob storage: {Path}", path);
            throw new StorageException($"Failed to download file: {ex.Message}", ex);
        }
    }

    public async Task<string> GetCDNUrlAsync(string path)
    {
        var cdnBaseUrl = _configuration["CDN:BaseUrl"];
        if (string.IsNullOrEmpty(cdnBaseUrl))
        {
            // Fallback to blob URL if CDN not configured
            var containerClient = _blobServiceClient.GetBlobContainerClient(_containerName);
            var blobClient = containerClient.GetBlobClient(path);
            return blobClient.Uri.ToString();
        }

        return $"{cdnBaseUrl.TrimEnd('/')}/{path}";
    }

    public async Task<bool> ExistsAsync(string path)
    {
        try
        {
            var containerClient = _blobServiceClient.GetBlobContainerClient(_containerName);
            var blobClient = containerClient.GetBlobClient(path);
            var response = await blobClient.ExistsAsync();
            return response.Value;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to check if file exists: {Path}", path);
            return false;
        }
    }
}
```

### Image Processing Service

#### **ImageSharp Processor**
```csharp
public interface IImageProcessingService
{
    Task<ImageVariant> CreateVariantAsync(ImageAsset originalImage, ImageSize targetSize);
    Task<ImageDimensions> GetImageDimensionsAsync(Stream imageStream);
    Task<Stream> ResizeImageAsync(Stream imageStream, int width, int height, ImageFormat format = ImageFormat.Jpeg);
    Task<Stream> OptimizeImageAsync(Stream imageStream, int quality = 85);
}

public class ImageSharpProcessor : IImageProcessingService
{
    private readonly IStorageService _storageService;
    private readonly ILogger<ImageSharpProcessor> _logger;

    public async Task<ImageVariant> CreateVariantAsync(ImageAsset originalImage, ImageSize targetSize)
    {
        try
        {
            var targetDimensions = GetTargetDimensions(originalImage.Dimensions, targetSize);
            var variantFileName = GenerateVariantFileName(originalImage.FileName, targetSize);
            var variantPath = GenerateVariantStoragePath(originalImage.StoragePath, targetSize);

            // Download original image
            using var originalStream = await _storageService.DownloadAsync(originalImage.StoragePath);
            
            // Resize image
            using var resizedStream = await ResizeImageAsync(originalStream, 
                targetDimensions.Width, targetDimensions.Height);
            
            // Upload variant
            var uploadResult = await _storageService.UploadAsync(variantPath, resizedStream, "image/jpeg");
            
            // Get CDN URL
            var cdnUrl = await _storageService.GetCDNUrlAsync(variantPath);

            return new ImageVariant(targetSize, variantPath, cdnUrl, targetDimensions, uploadResult.Size);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create image variant {Size} for {ImageId}", 
                targetSize, originalImage.Id);
            throw;
        }
    }

    public async Task<Stream> ResizeImageAsync(Stream imageStream, int width, int height, ImageFormat format = ImageFormat.Jpeg)
    {
        using var image = await Image.LoadAsync(imageStream);
        
        // Calculate dimensions maintaining aspect ratio
        var resizeOptions = new ResizeOptions
        {
            Size = new Size(width, height),
            Mode = ResizeMode.Max // Maintain aspect ratio, fit within bounds
        };

        image.Mutate(x => x.Resize(resizeOptions));

        var outputStream = new MemoryStream();
        
        switch (format)
        {
            case ImageFormat.Jpeg:
                await image.SaveAsJpegAsync(outputStream, new JpegEncoder { Quality = 85 });
                break;
            case ImageFormat.Png:
                await image.SaveAsPngAsync(outputStream);
                break;
            case ImageFormat.WebP:
                await image.SaveAsWebpAsync(outputStream, new WebpEncoder { Quality = 85 });
                break;
            default:
                await image.SaveAsJpegAsync(outputStream, new JpegEncoder { Quality = 85 });
                break;
        }

        outputStream.Position = 0;
        return outputStream;
    }

    public async Task<ImageDimensions> GetImageDimensionsAsync(Stream imageStream)
    {
        using var image = await Image.LoadAsync(imageStream);
        return new ImageDimensions(image.Width, image.Height);
    }

    private ImageDimensions GetTargetDimensions(ImageDimensions original, ImageSize targetSize)
    {
        var maxDimension = targetSize switch
        {
            ImageSize.Thumbnail => 150,
            ImageSize.Small => 300,
            ImageSize.Medium => 600,
            ImageSize.Large => 1200,
            _ => Math.Max(original.Width, original.Height)
        };

        if (original.Width <= maxDimension && original.Height <= maxDimension)
        {
            return original; // Don't upscale
        }

        var ratio = Math.Min((double)maxDimension / original.Width, (double)maxDimension / original.Height);
        return new ImageDimensions(
            (int)(original.Width * ratio),
            (int)(original.Height * ratio));
    }
}
```

### AI Image Generation Service

#### **AI Image Generator**
```csharp
public interface IAIImageGenerationService
{
    Task<AIImageGenerationResult> GenerateImageAsync(AIImageRequest request);
    Task<bool> IsAvailableAsync();
    Task<AIImageGenerationUsage> GetUsageAsync(Guid userId, TimeSpan period);
}

public class AIImageGenerationService : IAIImageGenerationService
{
    private readonly IConfiguration _configuration;
    private readonly HttpClient _httpClient;
    private readonly ILogger<AIImageGenerationService> _logger;
    private readonly ISubscriptionService _subscriptionService;

    public async Task<AIImageGenerationResult> GenerateImageAsync(AIImageRequest request)
    {
        try
        {
            // Check subscription tier for quality settings
            var userTier = await _subscriptionService.GetUserTierAsync(request.UserId);
            var generationSettings = GetGenerationSettings(userTier);

            // Enhance prompt based on D&D context
            var enhancedPrompt = EnhanceDnDPrompt(request.Prompt, request.Style);

            // Call AI provider (e.g., DALL-E, Midjourney, Stable Diffusion)
            var providerRequest = new
            {
                prompt = enhancedPrompt,
                size = FormatImageSize(request.Size),
                quality = generationSettings.Quality,
                style = request.Style,
                n = 1
            };

            var response = await _httpClient.PostAsJsonAsync("/v1/images/generations", providerRequest);
            response.EnsureSuccessStatusCode();

            var result = await response.Content.ReadFromJsonAsync<AIProviderImageResponse>();
            
            // Download generated image
            var imageData = await DownloadImageDataAsync(result!.Data[0].Url);

            return new AIImageGenerationResult
            {
                ImageData = imageData,
                Dimensions = request.Size,
                Provider = "OpenAI-DALL-E",
                Prompt = enhancedPrompt,
                OriginalPrompt = request.Prompt,
                Style = request.Style,
                GeneratedAt = DateTime.UtcNow,
                TokensUsed = EstimateTokenUsage(enhancedPrompt),
                Cost = CalculateCost(generationSettings.Quality, request.Size)
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "AI image generation failed for user {UserId}", request.UserId);
            throw new AIImageGenerationException("Failed to generate AI image", ex);
        }
    }

    private string EnhanceDnDPrompt(string originalPrompt, string style)
    {
        var styleEnhancements = style.ToLower() switch
        {
            "fantasy" => "fantasy art, dungeons and dragons style, medieval fantasy",
            "realistic" => "photorealistic, detailed, high quality",
            "cartoon" => "cartoon style, animated, colorful",
            "dark" => "dark fantasy, gothic, atmospheric",
            _ => "fantasy art"
        };

        return $"{originalPrompt}, {styleEnhancements}, high quality, detailed, professional artwork";
    }

    private async Task<byte[]> DownloadImageDataAsync(string imageUrl)
    {
        var response = await _httpClient.GetAsync(imageUrl);
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadAsByteArrayAsync();
    }

    private AIGenerationSettings GetGenerationSettings(SubscriptionTier tier)
    {
        return tier switch
        {
            SubscriptionTier.Free => new AIGenerationSettings { Quality = "standard", MaxGenerationsPerDay = 5 },
            SubscriptionTier.DungeonArchitect => new AIGenerationSettings { Quality = "hd", MaxGenerationsPerDay = 50 },
            SubscriptionTier.CampaignWeaver => new AIGenerationSettings { Quality = "hd", MaxGenerationsPerDay = 200 },
            SubscriptionTier.GuildMaster => new AIGenerationSettings { Quality = "hd", MaxGenerationsPerDay = 1000 },
            _ => new AIGenerationSettings { Quality = "standard", MaxGenerationsPerDay = 5 }
        };
    }
}
```

### File Validation Service

#### **Security and Validation**
```csharp
public interface IFileValidationService
{
    Task<FileValidationResult> ValidateFileAsync(IFormFile file);
    Task<bool> IsAllowedFileTypeAsync(string contentType, FileAssetCategory category);
    Task<bool> IsFileSizeValidAsync(long fileSize, FileAssetCategory category);
}

public class FileValidationService : IFileValidationService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<FileValidationService> _logger;

    private readonly Dictionary<FileAssetCategory, FileTypeRestrictions> _restrictions = new()
    {
        [FileAssetCategory.CharacterPortrait] = new FileTypeRestrictions
        {
            AllowedContentTypes = new[] { "image/jpeg", "image/png", "image/webp" },
            MaxFileSize = 10 * 1024 * 1024, // 10MB
            MinWidth = 100,
            MaxWidth = 4096,
            MinHeight = 100,
            MaxHeight = 4096
        },
        [FileAssetCategory.CampaignMap] = new FileTypeRestrictions
        {
            AllowedContentTypes = new[] { "image/jpeg", "image/png", "image/webp" },
            MaxFileSize = 50 * 1024 * 1024, // 50MB
            MinWidth = 500,
            MaxWidth = 8192,
            MinHeight = 500,
            MaxHeight = 8192
        },
        [FileAssetCategory.BackgroundMusic] = new FileTypeRestrictions
        {
            AllowedContentTypes = new[] { "audio/mpeg", "audio/wav", "audio/ogg", "audio/mp4" },
            MaxFileSize = 100 * 1024 * 1024, // 100MB
            MaxDuration = TimeSpan.FromMinutes(30)
        },
        [FileAssetCategory.CampaignDocument] = new FileTypeRestrictions
        {
            AllowedContentTypes = new[] { "application/pdf", "text/plain", "application/msword", 
                                         "application/vnd.openxmlformats-officedocument.wordprocessingml.document" },
            MaxFileSize = 25 * 1024 * 1024 // 25MB
        }
    };

    public async Task<FileValidationResult> ValidateFileAsync(IFormFile file)
    {
        var errors = new List<string>();

        // Basic validations
        if (file == null || file.Length == 0)
        {
            errors.Add("File is empty or not provided");
            return new FileValidationResult(false, errors);
        }

        // File name validation
        if (string.IsNullOrWhiteSpace(file.FileName))
        {
            errors.Add("File name is required");
        }

        if (file.FileName.Length > 255)
        {
            errors.Add("File name is too long (max 255 characters)");
        }

        // Check for dangerous file extensions
        var extension = Path.GetExtension(file.FileName).ToLower();
        var dangerousExtensions = new[] { ".exe", ".bat", ".cmd", ".scr", ".pif", ".vbs", ".js" };
        if (dangerousExtensions.Contains(extension))
        {
            errors.Add($"File type '{extension}' is not allowed for security reasons");
        }

        // Content type validation
        if (string.IsNullOrWhiteSpace(file.ContentType))
        {
            errors.Add("Content type is required");
        }

        // File signature validation (magic number check)
        var isValidSignature = await ValidateFileSignatureAsync(file);
        if (!isValidSignature)
        {
            errors.Add("File signature does not match the declared content type");
        }

        // Scan for embedded threats
        var hasThreats = await ScanForEmbeddedThreatsAsync(file);
        if (hasThreats)
        {
            errors.Add("File contains potentially malicious content");
        }

        return new FileValidationResult(errors.Count == 0, errors);
    }

    private async Task<bool> ValidateFileSignatureAsync(IFormFile file)
    {
        using var stream = file.OpenReadStream();
        var buffer = new byte[8];
        await stream.ReadAsync(buffer, 0, buffer.Length);

        // Check magic numbers for common file types
        return file.ContentType.ToLower() switch
        {
            "image/jpeg" => buffer[0] == 0xFF && buffer[1] == 0xD8,
            "image/png" => buffer[0] == 0x89 && buffer[1] == 0x50 && buffer[2] == 0x4E && buffer[3] == 0x47,
            "image/webp" => buffer[0] == 0x52 && buffer[1] == 0x49 && buffer[2] == 0x46 && buffer[3] == 0x46,
            "application/pdf" => buffer[0] == 0x25 && buffer[1] == 0x50 && buffer[2] == 0x44 && buffer[3] == 0x46,
            "audio/mpeg" => (buffer[0] == 0xFF && (buffer[1] & 0xE0) == 0xE0) || // MP3
                           (buffer[0] == 0x49 && buffer[1] == 0x44 && buffer[2] == 0x33), // ID3
            _ => true // Allow unknown types to pass signature check
        };
    }

    private async Task<bool> ScanForEmbeddedThreatsAsync(IFormFile file)
    {
        // Implement threat scanning logic
        // This could integrate with services like Windows Defender, ClamAV, or cloud-based scanners
        
        using var stream = file.OpenReadStream();
        var buffer = new byte[1024];
        var bytesRead = await stream.ReadAsync(buffer);
        
        // Simple heuristic checks for common threat patterns
        var content = System.Text.Encoding.UTF8.GetString(buffer, 0, bytesRead);
        
        var threatPatterns = new[]
        {
            "<script", "javascript:", "vbscript:", "onload=", "onerror=",
            "eval(", "document.write", "window.location", "document.cookie"
        };

        return threatPatterns.Any(pattern => 
            content.Contains(pattern, StringComparison.OrdinalIgnoreCase));
    }
}
```

## API Controllers

### File Controller

```csharp
[ApiController]
[Route("api/v1/files")]
[Authorize]
public class FileController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ILogger<FileController> _logger;

    public FileController(IMediator mediator, ILogger<FileController> logger)
    {
        _mediator = mediator;
        _logger = logger;
    }

    /// <summary>
    /// Upload a file
    /// </summary>
    [HttpPost("upload")]
    [RequestSizeLimit(100_000_000)] // 100MB
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<UploadFileResponse>> UploadFile([FromForm] UploadFileRequest request)
    {
        try
        {
            var userId = User.GetUserId();
            
            var command = new UploadFileCommand
            {
                File = request.File,
                Category = request.Category,
                AccessLevel = request.AccessLevel,
                Description = request.Description,
                Tags = request.Tags ?? new List<string>(),
                CampaignId = request.CampaignId,
                UserId = userId
            };

            var result = await _mediator.Send(command);
            
            return CreatedAtAction(nameof(GetFile), new { id = result.FileId }, result);
        }
        catch (FileValidationException ex)
        {
            return BadRequest(new { error = "File validation failed", details = ex.Errors });
        }
        catch (SubscriptionLimitExceededException ex)
        {
            return StatusCode(402, new { error = ex.Message });
        }
    }

    /// <summary>
    /// Get file information
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<FileAssetDto>> GetFile(string id)
    {
        var userId = User.GetUserId();
        var query = new GetFileQuery { FileId = id, UserId = userId };
        
        var result = await _mediator.Send(query);
        
        if (result == null)
        {
            return NotFound();
        }

        return Ok(result);
    }

    /// <summary>
    /// Download file content
    /// </summary>
    [HttpGet("{id}/download")]
    public async Task<IActionResult> DownloadFile(string id)
    {
        var userId = User.GetUserId();
        var query = new DownloadFileQuery { FileId = id, UserId = userId };
        
        var result = await _mediator.Send(query);
        
        if (result == null)
        {
            return NotFound();
        }

        return File(result.Content, result.ContentType, result.FileName);
    }

    /// <summary>
    /// Get user's files
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<GetUserFilesResponse>> GetUserFiles([FromQuery] GetUserFilesRequest request)
    {
        var userId = User.GetUserId();
        
        var query = new GetUserFilesQuery
        {
            UserId = userId,
            AssetType = request.AssetType,
            Category = request.Category,
            Tags = request.Tags ?? new List<string>(),
            SearchTerm = request.SearchTerm,
            Page = request.Page,
            PageSize = Math.Min(request.PageSize, 100), // Max 100 per page
            SortBy = request.SortBy,
            SortDescending = request.SortDescending
        };

        var result = await _mediator.Send(query);
        return Ok(result);
    }

    /// <summary>
    /// Delete a file
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteFile(string id)
    {
        var userId = User.GetUserId();
        var command = new DeleteFileCommand { FileId = id, UserId = userId };
        
        await _mediator.Send(command);
        return NoContent();
    }

    /// <summary>
    /// Update file metadata
    /// </summary>
    [HttpPut("{id}/metadata")]
    public async Task<IActionResult> UpdateFileMetadata(string id, [FromBody] UpdateFileMetadataRequest request)
    {
        var userId = User.GetUserId();
        var command = new UpdateFileMetadataCommand
        {
            FileId = id,
            UserId = userId,
            Description = request.Description,
            Tags = request.Tags,
            AccessLevel = request.AccessLevel
        };

        await _mediator.Send(command);
        return NoContent();
    }
}
```

### AI Image Generation Controller

```csharp
[ApiController]
[Route("api/v1/files/ai/images")]
[Authorize]
public class AIImageController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ILogger<AIImageController> _logger;

    /// <summary>
    /// Generate an AI image
    /// </summary>
    [HttpPost("generate")]
    public async Task<ActionResult<GenerateAIImageResponse>> GenerateImage([FromBody] GenerateAIImageRequest request)
    {
        try
        {
            var userId = User.GetUserId();
            
            var command = new GenerateAIImageCommand
            {
                Prompt = request.Prompt,
                Style = request.Style,
                Size = request.Size,
                Category = request.Category,
                AccessLevel = request.AccessLevel,
                CampaignId = request.CampaignId,
                UserId = userId
            };

            var result = await _mediator.Send(command);
            
            return CreatedAtAction(nameof(FileController.GetFile), "File", new { id = result.FileId }, result);
        }
        catch (SubscriptionLimitExceededException ex)
        {
            return StatusCode(402, new { error = ex.Message, upgradeUrl = "/subscription/upgrade" });
        }
        catch (AIImageGenerationException ex)
        {
            return StatusCode(500, new { error = "AI image generation failed", details = ex.Message });
        }
    }

    /// <summary>
    /// Get AI image generation history
    /// </summary>
    [HttpGet("history")]
    public async Task<ActionResult<GetAIImageHistoryResponse>> GetGenerationHistory([FromQuery] GetAIImageHistoryRequest request)
    {
        var userId = User.GetUserId();
        var query = new GetAIImageHistoryQuery
        {
            UserId = userId,
            Page = request.Page,
            PageSize = Math.Min(request.PageSize, 50)
        };

        var result = await _mediator.Send(query);
        return Ok(result);
    }

    /// <summary>
    /// Get AI generation usage statistics
    /// </summary>
    [HttpGet("usage")]
    public async Task<ActionResult<AIImageUsageResponse>> GetUsageStatistics()
    {
        var userId = User.GetUserId();
        var query = new GetAIImageUsageQuery { UserId = userId };
        
        var result = await _mediator.Send(query);
        return Ok(result);
    }
}
```

## Configuration and Deployment

### Configuration Settings

```json
{
  "Storage": {
    "Provider": "AzureBlob", // AzureBlob, AWSS3, Local
    "ContainerName": "dndai-assets",
    "ConnectionString": "DefaultEndpointsProtocol=https;AccountName=...",
    "MaxFileSize": 104857600, // 100MB
    "AllowedFileTypes": ["image/jpeg", "image/png", "image/webp", "audio/mpeg", "audio/wav", "application/pdf"]
  },
  "CDN": {
    "BaseUrl": "https://cdn.dndai.com",
    "CacheTTL": "31536000" // 1 year
  },
  "ImageProcessing": {
    "EnableVariants": true,
    "Quality": 85,
    "Formats": ["jpeg", "webp"],
    "Sizes": {
      "Thumbnail": "150x150",
      "Small": "300x300",
      "Medium": "600x600",
      "Large": "1200x1200"
    }
  },
  "AIImageGeneration": {
    "Provider": "OpenAI", // OpenAI, StabilityAI, Midjourney
    "ApiKey": "your-api-key",
    "DefaultStyle": "fantasy",
    "MaxDailyGenerations": {
      "Free": 5,
      "DungeonArchitect": 50,
      "CampaignWeaver": 200,
      "GuildMaster": 1000
    }
  },
  "Security": {
    "EnableVirusScanning": true,
    "VirusScanningProvider": "WindowsDefender", // WindowsDefender, ClamAV, CloudService
    "EnableEncryption": true,
    "EncryptionKey": "your-encryption-key"
  }
}
```

## Summary

The File Service provides:

1. **Comprehensive File Management** - Upload, download, delete, and organize files
2. **AI Image Generation** - Integration with AI providers for character portraits and assets
3. **Advanced Image Processing** - Automatic variant generation and optimization
4. **Audio File Support** - Background music, sound effects, and voice synthesis
5. **Security Features** - Virus scanning, file validation, and access control
6. **CDN Integration** - Global content delivery for optimal performance
7. **Subscription Integration** - Tier-based limits and features
8. **Cross-Platform Support** - Works with Flutter web, mobile, and desktop
9. **Scalable Storage** - Cloud storage with local development support
10. **Comprehensive Monitoring** - Usage tracking and performance metrics

The service is designed to handle all asset management needs for the D&D AI Campaign Management System while maintaining security, performance, and scalability.
