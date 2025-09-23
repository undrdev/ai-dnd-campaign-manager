# Flutter App Setup

## Overview
This document establishes comprehensive Flutter development standards for the D&D AI Campaign Management System mobile application, including project structure, state management with Riverpod, and platform-specific configurations.

---

## Flutter Project Structure

### Project Organization
```
lib/
├── main.dart
├── app/
│   ├── app.dart
│   ├── routes/
│   │   ├── app_router.dart
│   │   └── route_names.dart
│   ├── themes/
│   │   ├── app_theme.dart
│   │   ├── dark_theme.dart
│   │   └── light_theme.dart
│   └── constants/
│       ├── app_constants.dart
│       ├── api_endpoints.dart
│       └── asset_paths.dart
├── core/
│   ├── di/
│   │   └── injection_container.dart
│   ├── errors/
│   │   ├── failures.dart
│   │   └── exceptions.dart
│   ├── network/
│   │   ├── api_client.dart
│   │   ├── network_info.dart
│   │   └── interceptors/
│   ├── utils/
│   │   ├── validators.dart
│   │   ├── formatters.dart
│   │   └── extensions/
│   └── platform/
│       ├── device_info.dart
│       └── permissions.dart
├── features/
│   ├── authentication/
│   ├── campaigns/
│   ├── characters/
│   ├── sessions/
│   └── profile/
└── shared/
    ├── data/
    ├── domain/
    ├── presentation/
    └── widgets/
```

### Feature Structure (Clean Architecture)
```
features/campaigns/
├── data/
│   ├── datasources/
│   │   ├── campaign_local_data_source.dart
│   │   └── campaign_remote_data_source.dart
│   ├── models/
│   │   ├── campaign_model.dart
│   │   └── campaign_response_model.dart
│   └── repositories/
│       └── campaign_repository_impl.dart
├── domain/
│   ├── entities/
│   │   └── campaign.dart
│   ├── repositories/
│   │   └── campaign_repository.dart
│   └── usecases/
│       ├── get_campaigns.dart
│       ├── create_campaign.dart
│       └── update_campaign.dart
└── presentation/
    ├── providers/
    │   ├── campaign_provider.dart
    │   └── campaign_state.dart
    ├── pages/
    │   ├── campaigns_page.dart
    │   ├── campaign_details_page.dart
    │   └── create_campaign_page.dart
    └── widgets/
        ├── campaign_card.dart
        ├── campaign_form.dart
        └── campaign_list.dart
```

### Core Configuration
```dart
// main.dart
void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize dependencies
  await setupDependencies();
  
  runApp(
    ProviderScope(
      child: DnDAIApp(),
    ),
  );
}

// app/app.dart
class DnDAIApp extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider);
    final themeMode = ref.watch(themeModeProvider);
    
    return MaterialApp.router(
      title: 'D&D AI Campaign Manager',
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: themeMode,
      routerConfig: router,
      debugShowCheckedModeBanner: false,
    );
  }
}
```

---

## State Management Patterns (Riverpod/Bloc)

### Riverpod Setup and Configuration
```dart
// core/di/injection_container.dart
final getIt = GetIt.instance;

Future<void> setupDependencies() async {
  // External
  getIt.registerLazySingleton(() => http.Client());
  getIt.registerLazySingleton(() => SharedPreferences.getInstance());
  
  // Core
  getIt.registerLazySingleton<NetworkInfo>(() => NetworkInfoImpl());
  getIt.registerLazySingleton<ApiClient>(() => ApiClientImpl(getIt()));
  
  // Data sources
  getIt.registerLazySingleton<CampaignRemoteDataSource>(
    () => CampaignRemoteDataSourceImpl(getIt()),
  );
  getIt.registerLazySingleton<CampaignLocalDataSource>(
    () => CampaignLocalDataSourceImpl(getIt()),
  );
  
  // Repositories
  getIt.registerLazySingleton<CampaignRepository>(
    () => CampaignRepositoryImpl(
      remoteDataSource: getIt(),
      localDataSource: getIt(),
      networkInfo: getIt(),
    ),
  );
  
  // Use cases
  getIt.registerLazySingleton(() => GetCampaigns(getIt()));
  getIt.registerLazySingleton(() => CreateCampaign(getIt()));
}

// Providers
final campaignRepositoryProvider = Provider<CampaignRepository>((ref) {
  return getIt<CampaignRepository>();
});

final getCampaignsProvider = Provider<GetCampaigns>((ref) {
  return getIt<GetCampaigns>();
});
```

### State Management with Riverpod
```dart
// Campaign State
@freezed
class CampaignState with _$CampaignState {
  const factory CampaignState.initial() = _Initial;
  const factory CampaignState.loading() = _Loading;
  const factory CampaignState.loaded(List<Campaign> campaigns) = _Loaded;
  const factory CampaignState.error(String message) = _Error;
}

// Campaign Provider
final campaignProvider = StateNotifierProvider<CampaignNotifier, CampaignState>((ref) {
  return CampaignNotifier(
    getCampaigns: ref.read(getCampaignsProvider),
    createCampaign: ref.read(createCampaignProvider),
  );
});

class CampaignNotifier extends StateNotifier<CampaignState> {
  final GetCampaigns _getCampaigns;
  final CreateCampaign _createCampaign;
  
  CampaignNotifier({
    required GetCampaigns getCampaigns,
    required CreateCampaign createCampaign,
  }) : _getCampaigns = getCampaigns,
       _createCampaign = createCampaign,
       super(const CampaignState.initial());

  Future<void> loadCampaigns() async {
    state = const CampaignState.loading();
    
    final result = await _getCampaigns(NoParams());
    
    result.fold(
      (failure) => state = CampaignState.error(failure.message),
      (campaigns) => state = CampaignState.loaded(campaigns),
    );
  }

  Future<void> createCampaign(CreateCampaignParams params) async {
    final result = await _createCampaign(params);
    
    result.fold(
      (failure) => state = CampaignState.error(failure.message),
      (campaign) {
        // Reload campaigns to include the new one
        loadCampaigns();
      },
    );
  }
}
```

### AsyncValue Pattern
```dart
// For simpler state management
final campaignsProvider = FutureProvider<List<Campaign>>((ref) async {
  final getCampaigns = ref.read(getCampaignsProvider);
  final result = await getCampaigns(NoParams());
  
  return result.fold(
    (failure) => throw Exception(failure.message),
    (campaigns) => campaigns,
  );
});

// Usage in widgets
class CampaignsPage extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final campaignsAsync = ref.watch(campaignsProvider);
    
    return Scaffold(
      appBar: AppBar(title: Text('Campaigns')),
      body: campaignsAsync.when(
        data: (campaigns) => CampaignsList(campaigns: campaigns),
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stack) => ErrorWidget(error.toString()),
      ),
    );
  }
}
```

### Form State Management
```dart
// Form providers for campaign creation
final campaignNameProvider = StateProvider<String>((ref) => '');
final campaignDescriptionProvider = StateProvider<String>((ref) => '');
final maxPlayersProvider = StateProvider<int>((ref) => 4);

final campaignFormProvider = Provider<CreateCampaignParams>((ref) {
  return CreateCampaignParams(
    name: ref.watch(campaignNameProvider),
    description: ref.watch(campaignDescriptionProvider),
    maxPlayers: ref.watch(maxPlayersProvider),
  );
});

final campaignFormValidProvider = Provider<bool>((ref) {
  final name = ref.watch(campaignNameProvider);
  final maxPlayers = ref.watch(maxPlayersProvider);
  
  return name.isNotEmpty && maxPlayers > 0 && maxPlayers <= 8;
});

// Form widget
class CreateCampaignForm extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isValid = ref.watch(campaignFormValidProvider);
    
    return Column(
      children: [
        TextFormField(
          decoration: InputDecoration(labelText: 'Campaign Name'),
          onChanged: (value) => ref.read(campaignNameProvider.notifier).state = value,
        ),
        TextFormField(
          decoration: InputDecoration(labelText: 'Description'),
          onChanged: (value) => ref.read(campaignDescriptionProvider.notifier).state = value,
        ),
        ElevatedButton(
          onPressed: isValid ? () => _submitForm(ref) : null,
          child: Text('Create Campaign'),
        ),
      ],
    );
  }
  
  void _submitForm(WidgetRef ref) {
    final params = ref.read(campaignFormProvider);
    ref.read(campaignProvider.notifier).createCampaign(params);
  }
}
```

---

## Platform-specific Configurations

### Build Configuration
```yaml
# pubspec.yaml
name: dnd_campaign_manager
description: AI-powered D&D campaign management application
version: 1.0.0+1

environment:
  sdk: '>=3.0.0 <4.0.0'
  flutter: ">=3.10.0"

dependencies:
  flutter:
    sdk: flutter
  
  # State Management
  flutter_riverpod: ^2.4.0
  
  # Navigation
  go_router: ^12.0.0
  
  # Network
  dio: ^5.3.0
  retrofit: ^4.0.0
  
  # Local Storage
  shared_preferences: ^2.2.0
  hive_flutter: ^1.1.0
  
  # JSON Serialization
  json_annotation: ^4.8.0
  freezed_annotation: ^2.4.0
  
  # UI
  flutter_screenutil: ^5.9.0
  cached_network_image: ^3.3.0
  
  # Utils
  equatable: ^2.0.5
  dartz: ^0.10.1
  get_it: ^7.6.0
  
dev_dependencies:
  flutter_test:
    sdk: flutter
  
  # Code Generation
  build_runner: ^2.4.0
  json_serializable: ^6.7.0
  freezed: ^2.4.0
  
  # Testing
  mockito: ^5.4.0
  
flutter:
  uses-material-design: true
  
  assets:
    - assets/images/
    - assets/icons/
    - assets/data/
```

### Theme Configuration
```dart
// app/themes/app_theme.dart
class AppTheme {
  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.fromSeed(
        seedColor: const Color(0xFF8B5A3C), // D&D brown theme
        brightness: Brightness.light,
      ),
      appBarTheme: const AppBarTheme(
        centerTitle: true,
        elevation: 0,
      ),
      cardTheme: CardTheme(
        elevation: 2,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
      ),
    );
  }
  
  static ThemeData get darkTheme {
    return ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.fromSeed(
        seedColor: const Color(0xFF8B5A3C),
        brightness: Brightness.dark,
      ),
    );
  }
}
```

This comprehensive Flutter setup provides a solid foundation for the D&D AI Campaign Management System mobile application with clean architecture, proper state management, and platform-specific optimizations.
