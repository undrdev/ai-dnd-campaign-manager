# User Flows and Journey Mapping

## Overview
This document defines comprehensive user flows and journey mappings for the D&D AI Campaign Management System, covering all critical user interactions across web, mobile, and desktop platforms while maintaining the web-first subscription model.

---

## User Flow Architecture

### **Flow Categories**
```dart
class UserFlowCategories {
  // Authentication & Onboarding
  static const String authentication = 'auth';
  static const String onboarding = 'onboarding';
  static const String subscription = 'subscription';
  
  // Core Gameplay Flows
  static const String campaignManagement = 'campaigns';
  static const String characterManagement = 'characters';
  static const String sessionManagement = 'sessions';
  
  // Real-time Collaboration
  static const String liveSession = 'live_session';
  static const String realTimeChat = 'real_time_chat';
  static const String combatManagement = 'combat';
  
  // AI Integration
  static const String aiContentGeneration = 'ai_content';
  static const String npcInteraction = 'npc_interaction';
  static const String worldBuilding = 'world_building';
  
  // Social Features
  static const String groupManagement = 'groups';
  static const String playerInvitation = 'invitations';
  static const String communityFeatures = 'community';
}
```

### **Flow State Management**
```dart
class UserFlowState {
  final String flowId;
  final String currentStep;
  final Map<String, dynamic> flowData;
  final DateTime startedAt;
  final List<String> completedSteps;
  final List<String> availableActions;
  final bool canGoBack;
  final bool canSkip;

  const UserFlowState({
    required this.flowId,
    required this.currentStep,
    required this.flowData,
    required this.startedAt,
    required this.completedSteps,
    required this.availableActions,
    this.canGoBack = true,
    this.canSkip = false,
  });
}

// Flow navigation controller
class UserFlowController extends ChangeNotifier {
  UserFlowState? _currentFlow;
  final List<UserFlowState> _flowHistory = [];

  UserFlowState? get currentFlow => _currentFlow;
  
  void startFlow(String flowId, {Map<String, dynamic>? initialData}) {
    _currentFlow = UserFlowState(
      flowId: flowId,
      currentStep: _getInitialStep(flowId),
      flowData: initialData ?? {},
      startedAt: DateTime.now(),
      completedSteps: [],
      availableActions: _getAvailableActions(flowId, _getInitialStep(flowId)),
    );
    notifyListeners();
  }
  
  void nextStep(String stepId, {Map<String, dynamic>? stepData}) {
    if (_currentFlow == null) return;
    
    final updatedData = Map<String, dynamic>.from(_currentFlow!.flowData);
    if (stepData != null) {
      updatedData.addAll(stepData);
    }
    
    _currentFlow = UserFlowState(
      flowId: _currentFlow!.flowId,
      currentStep: stepId,
      flowData: updatedData,
      startedAt: _currentFlow!.startedAt,
      completedSteps: [..._currentFlow!.completedSteps, _currentFlow!.currentStep],
      availableActions: _getAvailableActions(_currentFlow!.flowId, stepId),
    );
    
    notifyListeners();
  }
  
  void completeFlow() {
    if (_currentFlow != null) {
      _flowHistory.add(_currentFlow!);
      _currentFlow = null;
      notifyListeners();
    }
  }
}
```

---

## Authentication & Onboarding Flows

### **User Registration Flow**
```dart
class RegistrationFlow {
  static const String flowId = 'user_registration';
  
  static const List<String> steps = [
    'welcome',
    'account_creation',
    'email_verification',
    'profile_setup',
    'subscription_selection',
    'onboarding_complete',
  ];
  
  static Map<String, UserFlowStep> getSteps() {
    return {
      'welcome': UserFlowStep(
        id: 'welcome',
        title: 'Welcome to D&D AI',
        description: 'Your AI-powered campaign management system',
        widget: WelcomeScreen(),
        actions: [
          FlowAction(
            id: 'get_started',
            label: 'Get Started',
            isPrimary: true,
            nextStep: 'account_creation',
          ),
          FlowAction(
            id: 'sign_in',
            label: 'Already have an account?',
            isPrimary: false,
            flowRedirect: 'user_login',
          ),
        ],
      ),
      
      'account_creation': UserFlowStep(
        id: 'account_creation',
        title: 'Create Your Account',
        description: 'Set up your D&D AI account',
        widget: AccountCreationScreen(),
        validation: AccountCreationValidator(),
        actions: [
          FlowAction(
            id: 'create_account',
            label: 'Create Account',
            isPrimary: true,
            nextStep: 'email_verification',
            requiresValidation: true,
          ),
          FlowAction(
            id: 'back',
            label: 'Back',
            isPrimary: false,
            nextStep: 'welcome',
          ),
        ],
      ),
      
      'email_verification': UserFlowStep(
        id: 'email_verification',
        title: 'Verify Your Email',
        description: 'Check your email and click the verification link',
        widget: EmailVerificationScreen(),
        actions: [
          FlowAction(
            id: 'email_verified',
            label: 'Continue',
            isPrimary: true,
            nextStep: 'profile_setup',
            requiresValidation: true,
          ),
          FlowAction(
            id: 'resend_email',
            label: 'Resend Email',
            isPrimary: false,
            actionType: FlowActionType.api,
          ),
        ],
      ),
      
      'profile_setup': UserFlowStep(
        id: 'profile_setup',
        title: 'Set Up Your Profile',
        description: 'Tell us about your D&D experience',
        widget: ProfileSetupScreen(),
        validation: ProfileSetupValidator(),
        actions: [
          FlowAction(
            id: 'save_profile',
            label: 'Continue',
            isPrimary: true,
            nextStep: 'subscription_selection',
            requiresValidation: true,
          ),
          FlowAction(
            id: 'skip_profile',
            label: 'Skip for Now',
            isPrimary: false,
            nextStep: 'subscription_selection',
          ),
        ],
      ),
      
      'subscription_selection': UserFlowStep(
        id: 'subscription_selection',
        title: 'Choose Your Plan',
        description: 'Select the plan that fits your gaming needs',
        widget: SubscriptionSelectionScreen(),
        platformRestriction: PlatformRestriction.webOnly,
        actions: [
          FlowAction(
            id: 'select_free',
            label: 'Start with Free',
            isPrimary: false,
            nextStep: 'onboarding_complete',
          ),
          FlowAction(
            id: 'select_paid',
            label: 'Choose Premium',
            isPrimary: true,
            nextStep: 'payment_setup',
          ),
        ],
      ),
      
      'onboarding_complete': UserFlowStep(
        id: 'onboarding_complete',
        title: 'Welcome to D&D AI!',
        description: 'You\'re all set to start your adventure',
        widget: OnboardingCompleteScreen(),
        actions: [
          FlowAction(
            id: 'start_journey',
            label: 'Start My Journey',
            isPrimary: true,
            flowComplete: true,
            navigationTarget: '/dashboard',
          ),
        ],
      ),
    };
  }
}
```

### **Login Flow**
```dart
class LoginFlow {
  static const String flowId = 'user_login';
  
  static Map<String, UserFlowStep> getSteps() {
    return {
      'login_method': UserFlowStep(
        id: 'login_method',
        title: 'Sign In',
        description: 'Access your D&D AI account',
        widget: LoginMethodScreen(),
        actions: [
          FlowAction(
            id: 'email_login',
            label: 'Continue with Email',
            isPrimary: true,
            nextStep: 'email_login',
          ),
          FlowAction(
            id: 'google_login',
            label: 'Continue with Google',
            isPrimary: false,
            actionType: FlowActionType.oauth,
            oauthProvider: 'google',
          ),
          FlowAction(
            id: 'apple_login',
            label: 'Continue with Apple',
            isPrimary: false,
            actionType: FlowActionType.oauth,
            oauthProvider: 'apple',
            platformRestriction: PlatformRestriction.iosOnly,
          ),
        ],
      ),
      
      'email_login': UserFlowStep(
        id: 'email_login',
        title: 'Sign In with Email',
        description: 'Enter your credentials',
        widget: EmailLoginScreen(),
        validation: EmailLoginValidator(),
        actions: [
          FlowAction(
            id: 'sign_in',
            label: 'Sign In',
            isPrimary: true,
            requiresValidation: true,
            actionType: FlowActionType.api,
            onSuccess: 'login_success',
            onError: 'login_error',
          ),
          FlowAction(
            id: 'forgot_password',
            label: 'Forgot Password?',
            isPrimary: false,
            flowRedirect: 'password_reset',
          ),
        ],
      ),
      
      'mfa_verification': UserFlowStep(
        id: 'mfa_verification',
        title: 'Two-Factor Authentication',
        description: 'Enter your authentication code',
        widget: MFAVerificationScreen(),
        validation: MFAValidator(),
        actions: [
          FlowAction(
            id: 'verify_mfa',
            label: 'Verify',
            isPrimary: true,
            requiresValidation: true,
            actionType: FlowActionType.api,
            onSuccess: 'login_success',
          ),
          FlowAction(
            id: 'use_backup_code',
            label: 'Use Backup Code',
            isPrimary: false,
            nextStep: 'backup_code_verification',
          ),
        ],
      ),
    };
  }
}
```

---

## Campaign Management Flows

### **Campaign Creation Flow**
```dart
class CampaignCreationFlow {
  static const String flowId = 'campaign_creation';
  
  static Map<String, UserFlowStep> getSteps() {
    return {
      'campaign_template': UserFlowStep(
        id: 'campaign_template',
        title: 'Choose Campaign Type',
        description: 'Start with a template or create from scratch',
        widget: CampaignTemplateScreen(),
        actions: [
          FlowAction(
            id: 'use_template',
            label: 'Use Template',
            isPrimary: true,
            nextStep: 'template_selection',
          ),
          FlowAction(
            id: 'create_custom',
            label: 'Create Custom',
            isPrimary: false,
            nextStep: 'basic_info',
          ),
          FlowAction(
            id: 'ai_generate',
            label: 'AI Generate',
            isPrimary: false,
            nextStep: 'ai_generation',
            subscriptionRequired: 'premium',
          ),
        ],
      ),
      
      'basic_info': UserFlowStep(
        id: 'basic_info',
        title: 'Campaign Basics',
        description: 'Set up your campaign\'s core information',
        widget: CampaignBasicInfoScreen(),
        validation: CampaignBasicInfoValidator(),
        actions: [
          FlowAction(
            id: 'continue',
            label: 'Continue',
            isPrimary: true,
            nextStep: 'world_settings',
            requiresValidation: true,
          ),
          FlowAction(
            id: 'save_draft',
            label: 'Save Draft',
            isPrimary: false,
            actionType: FlowActionType.api,
            keepInFlow: true,
          ),
        ],
      ),
      
      'world_settings': UserFlowStep(
        id: 'world_settings',
        title: 'World Settings',
        description: 'Configure your campaign world',
        widget: WorldSettingsScreen(),
        actions: [
          FlowAction(
            id: 'continue',
            label: 'Continue',
            isPrimary: true,
            nextStep: 'player_setup',
          ),
          FlowAction(
            id: 'generate_world',
            label: 'AI Generate World',
            isPrimary: false,
            actionType: FlowActionType.api,
            subscriptionRequired: 'premium',
            keepInFlow: true,
          ),
        ],
      ),
      
      'player_setup': UserFlowStep(
        id: 'player_setup',
        title: 'Invite Players',
        description: 'Add players to your campaign',
        widget: PlayerSetupScreen(),
        actions: [
          FlowAction(
            id: 'send_invites',
            label: 'Send Invitations',
            isPrimary: true,
            nextStep: 'campaign_preview',
            actionType: FlowActionType.api,
          ),
          FlowAction(
            id: 'skip_invites',
            label: 'Skip for Now',
            isPrimary: false,
            nextStep: 'campaign_preview',
          ),
        ],
      ),
      
      'campaign_preview': UserFlowStep(
        id: 'campaign_preview',
        title: 'Campaign Preview',
        description: 'Review your campaign before publishing',
        widget: CampaignPreviewScreen(),
        actions: [
          FlowAction(
            id: 'publish_campaign',
            label: 'Publish Campaign',
            isPrimary: true,
            actionType: FlowActionType.api,
            onSuccess: 'campaign_created',
          ),
          FlowAction(
            id: 'save_draft',
            label: 'Save as Draft',
            isPrimary: false,
            actionType: FlowActionType.api,
            onSuccess: 'draft_saved',
          ),
        ],
      ),
      
      'campaign_created': UserFlowStep(
        id: 'campaign_created',
        title: 'Campaign Created!',
        description: 'Your campaign is ready for adventure',
        widget: CampaignCreatedScreen(),
        actions: [
          FlowAction(
            id: 'view_campaign',
            label: 'View Campaign',
            isPrimary: true,
            flowComplete: true,
            navigationTarget: '/campaigns/{campaignId}',
          ),
          FlowAction(
            id: 'create_another',
            label: 'Create Another',
            isPrimary: false,
            flowRestart: true,
          ),
        ],
      ),
    };
  }
}
```

### **Character Creation Flow**
```dart
class CharacterCreationFlow {
  static const String flowId = 'character_creation';
  
  static Map<String, UserFlowStep> getSteps() {
    return {
      'creation_method': UserFlowStep(
        id: 'creation_method',
        title: 'Create Your Character',
        description: 'Choose how you\'d like to build your character',
        widget: CharacterCreationMethodScreen(),
        actions: [
          FlowAction(
            id: 'manual_creation',
            label: 'Manual Creation',
            isPrimary: true,
            nextStep: 'race_selection',
          ),
          FlowAction(
            id: 'quick_build',
            label: 'Quick Build',
            isPrimary: false,
            nextStep: 'quick_build_options',
          ),
          FlowAction(
            id: 'ai_assisted',
            label: 'AI Assisted',
            isPrimary: false,
            nextStep: 'ai_character_prompt',
            subscriptionRequired: 'premium',
          ),
        ],
      ),
      
      'race_selection': UserFlowStep(
        id: 'race_selection',
        title: 'Choose Your Race',
        description: 'Select your character\'s race and subrace',
        widget: RaceSelectionScreen(),
        validation: RaceSelectionValidator(),
        actions: [
          FlowAction(
            id: 'continue',
            label: 'Continue',
            isPrimary: true,
            nextStep: 'class_selection',
            requiresValidation: true,
          ),
          FlowAction(
            id: 'random_race',
            label: 'Random Race',
            isPrimary: false,
            actionType: FlowActionType.random,
            keepInFlow: true,
          ),
        ],
      ),
      
      'class_selection': UserFlowStep(
        id: 'class_selection',
        title: 'Choose Your Class',
        description: 'Select your character\'s class and subclass',
        widget: ClassSelectionScreen(),
        validation: ClassSelectionValidator(),
        actions: [
          FlowAction(
            id: 'continue',
            label: 'Continue',
            isPrimary: true,
            nextStep: 'ability_scores',
            requiresValidation: true,
          ),
          FlowAction(
            id: 'class_guide',
            label: 'Class Guide',
            isPrimary: false,
            actionType: FlowActionType.modal,
            modalWidget: ClassGuideModal(),
          ),
        ],
      ),
      
      'ability_scores': UserFlowStep(
        id: 'ability_scores',
        title: 'Ability Scores',
        description: 'Set your character\'s ability scores',
        widget: AbilityScoresScreen(),
        validation: AbilityScoresValidator(),
        actions: [
          FlowAction(
            id: 'continue',
            label: 'Continue',
            isPrimary: true,
            nextStep: 'skills_selection',
            requiresValidation: true,
          ),
          FlowAction(
            id: 'roll_scores',
            label: 'Roll for Stats',
            isPrimary: false,
            actionType: FlowActionType.dice,
            keepInFlow: true,
          ),
          FlowAction(
            id: 'standard_array',
            label: 'Use Standard Array',
            isPrimary: false,
            actionType: FlowActionType.preset,
            keepInFlow: true,
          ),
        ],
      ),
      
      'background_personality': UserFlowStep(
        id: 'background_personality',
        title: 'Background & Personality',
        description: 'Define your character\'s background and personality',
        widget: BackgroundPersonalityScreen(),
        actions: [
          FlowAction(
            id: 'continue',
            label: 'Continue',
            isPrimary: true,
            nextStep: 'equipment_selection',
          ),
          FlowAction(
            id: 'ai_generate_background',
            label: 'AI Generate',
            isPrimary: false,
            actionType: FlowActionType.ai,
            subscriptionRequired: 'premium',
            keepInFlow: true,
          ),
        ],
      ),
      
      'character_complete': UserFlowStep(
        id: 'character_complete',
        title: 'Character Created!',
        description: 'Your character is ready for adventure',
        widget: CharacterCompleteScreen(),
        actions: [
          FlowAction(
            id: 'view_character',
            label: 'View Character Sheet',
            isPrimary: true,
            flowComplete: true,
            navigationTarget: '/characters/{characterId}',
          ),
          FlowAction(
            id: 'create_another',
            label: 'Create Another Character',
            isPrimary: false,
            flowRestart: true,
          ),
        ],
      ),
    };
  }
}
```

---

## Live Session Flow

### **Session Management Flow**
```dart
class LiveSessionFlow {
  static const String flowId = 'live_session';
  
  static Map<String, UserFlowStep> getSteps() {
    return {
      'session_preparation': UserFlowStep(
        id: 'session_preparation',
        title: 'Prepare Session',
        description: 'Set up your gaming session',
        widget: SessionPreparationScreen(),
        actions: [
          FlowAction(
            id: 'start_session',
            label: 'Start Session',
            isPrimary: true,
            nextStep: 'session_lobby',
            actionType: FlowActionType.api,
          ),
          FlowAction(
            id: 'schedule_session',
            label: 'Schedule for Later',
            isPrimary: false,
            actionType: FlowActionType.modal,
            modalWidget: SessionSchedulingModal(),
          ),
        ],
      ),
      
      'session_lobby': UserFlowStep(
        id: 'session_lobby',
        title: 'Session Lobby',
        description: 'Waiting for players to join',
        widget: SessionLobbyScreen(),
        realTimeUpdates: true,
        actions: [
          FlowAction(
            id: 'begin_adventure',
            label: 'Begin Adventure',
            isPrimary: true,
            nextStep: 'active_session',
            requiresCondition: 'min_players_joined',
          ),
          FlowAction(
            id: 'invite_players',
            label: 'Invite More Players',
            isPrimary: false,
            actionType: FlowActionType.modal,
            modalWidget: PlayerInvitationModal(),
          ),
        ],
      ),
      
      'active_session': UserFlowStep(
        id: 'active_session',
        title: 'Live Session',
        description: 'Your D&D session is now active',
        widget: ActiveSessionScreen(),
        realTimeUpdates: true,
        persistentActions: [
          FlowAction(
            id: 'pause_session',
            label: 'Pause',
            actionType: FlowActionType.api,
            keepInFlow: true,
          ),
          FlowAction(
            id: 'end_session',
            label: 'End Session',
            actionType: FlowActionType.confirmation,
            nextStep: 'session_wrap_up',
          ),
        ],
      ),
      
      'combat_encounter': UserFlowStep(
        id: 'combat_encounter',
        title: 'Combat Encounter',
        description: 'Initiative and combat management',
        widget: CombatEncounterScreen(),
        realTimeUpdates: true,
        parentStep: 'active_session',
        actions: [
          FlowAction(
            id: 'end_combat',
            label: 'End Combat',
            isPrimary: true,
            nextStep: 'active_session',
            actionType: FlowActionType.api,
          ),
          FlowAction(
            id: 'add_combatant',
            label: 'Add Combatant',
            isPrimary: false,
            actionType: FlowActionType.modal,
            modalWidget: AddCombatantModal(),
          ),
        ],
      ),
      
      'session_wrap_up': UserFlowStep(
        id: 'session_wrap_up',
        title: 'Session Complete',
        description: 'Review and save your session',
        widget: SessionWrapUpScreen(),
        actions: [
          FlowAction(
            id: 'save_session',
            label: 'Save & Continue',
            isPrimary: true,
            flowComplete: true,
            navigationTarget: '/campaigns/{campaignId}',
            actionType: FlowActionType.api,
          ),
          FlowAction(
            id: 'generate_recap',
            label: 'Generate AI Recap',
            isPrimary: false,
            actionType: FlowActionType.ai,
            subscriptionRequired: 'premium',
            keepInFlow: true,
          ),
        ],
      ),
    };
  }
}
```

---

## Platform-Specific Flow Adaptations

### **Mobile Flow Adaptations**
```dart
class MobileFlowAdaptations {
  static UserFlowStep adaptForMobile(UserFlowStep step) {
    return step.copyWith(
      widget: _wrapInMobileScaffold(step.widget),
      actions: _adaptActionsForMobile(step.actions),
      navigation: MobileNavigationPattern.bottomSheet,
      gestureSupport: true,
    );
  }
  
  static Widget _wrapInMobileScaffold(Widget widget) {
    return MobileFlowScaffold(
      child: widget,
      showProgress: true,
      allowSwipeNavigation: true,
    );
  }
  
  static List<FlowAction> _adaptActionsForMobile(List<FlowAction> actions) {
    return actions.map((action) {
      if (action.isPrimary) {
        return action.copyWith(
          displayStyle: FlowActionStyle.fullWidthButton,
          minHeight: 48, // Touch-friendly height
        );
      }
      return action;
    }).toList();
  }
}
```

### **Web-Only Flow Restrictions**
```dart
class WebOnlyFlowEnforcement {
  static bool canAccessFlow(String flowId, PlatformType platform) {
    final webOnlyFlows = [
      'subscription_management',
      'billing_management',
      'admin_dashboard',
      'api_management',
      'bulk_operations',
    ];
    
    if (webOnlyFlows.contains(flowId)) {
      return platform == PlatformType.web;
    }
    
    return true;
  }
  
  static Widget buildPlatformRestrictionScreen(String flowId) {
    return PlatformRestrictionScreen(
      title: 'Web Only Feature',
      description: 'This feature is only available on the web platform for enhanced functionality and security.',
      actions: [
        FlowAction(
          id: 'open_web',
          label: 'Open in Web Browser',
          isPrimary: true,
          actionType: FlowActionType.externalUrl,
          url: 'https://dndai.app/$flowId',
        ),
        FlowAction(
          id: 'go_back',
          label: 'Go Back',
          isPrimary: false,
          actionType: FlowActionType.navigation,
          navigationTarget: '/dashboard',
        ),
      ],
    );
  }
}
```

---

## Flow Analytics and Optimization

### **Flow Tracking**
```dart
class FlowAnalytics {
  static void trackFlowStart(String flowId, Map<String, dynamic> context) {
    AnalyticsService.track('flow_started', {
      'flow_id': flowId,
      'platform': PlatformDetector.currentPlatform.name,
      'user_id': AuthService.currentUser?.id,
      'session_id': SessionManager.currentSessionId,
      'context': context,
    });
  }
  
  static void trackStepTransition(
    String flowId,
    String fromStep,
    String toStep,
    Duration stepDuration,
  ) {
    AnalyticsService.track('flow_step_transition', {
      'flow_id': flowId,
      'from_step': fromStep,
      'to_step': toStep,
      'step_duration_ms': stepDuration.inMilliseconds,
      'platform': PlatformDetector.currentPlatform.name,
    });
  }
  
  static void trackFlowCompletion(
    String flowId,
    Duration totalDuration,
    bool successful,
  ) {
    AnalyticsService.track('flow_completed', {
      'flow_id': flowId,
      'total_duration_ms': totalDuration.inMilliseconds,
      'successful': successful,
      'platform': PlatformDetector.currentPlatform.name,
    });
  }
  
  static void trackFlowAbandonment(
    String flowId,
    String lastStep,
    Duration timeSpent,
  ) {
    AnalyticsService.track('flow_abandoned', {
      'flow_id': flowId,
      'last_step': lastStep,
      'time_spent_ms': timeSpent.inMilliseconds,
      'platform': PlatformDetector.currentPlatform.name,
    });
  }
}
```

### **A/B Testing Integration**
```dart
class FlowABTesting {
  static UserFlowStep getOptimizedStep(String flowId, String stepId) {
    final experiment = ABTestingService.getActiveExperiment('$flowId.$stepId');
    
    if (experiment != null) {
      final variant = experiment.getVariantForUser(AuthService.currentUser?.id);
      return _applyVariant(flowId, stepId, variant);
    }
    
    return FlowRegistry.getStep(flowId, stepId);
  }
  
  static UserFlowStep _applyVariant(
    String flowId,
    String stepId,
    ABTestVariant variant,
  ) {
    final baseStep = FlowRegistry.getStep(flowId, stepId);
    
    switch (variant.type) {
      case ABTestType.buttonText:
        return baseStep.copyWith(
          actions: baseStep.actions.map((action) {
            if (action.id == variant.targetActionId) {
              return action.copyWith(label: variant.value);
            }
            return action;
          }).toList(),
        );
        
      case ABTestType.stepOrder:
        return baseStep.copyWith(
          actions: _reorderActions(baseStep.actions, variant.value),
        );
        
      case ABTestType.contentVariation:
        return baseStep.copyWith(
          description: variant.value,
        );
        
      default:
        return baseStep;
    }
  }
}
```

This comprehensive user flow specification ensures smooth, intuitive user experiences across all platforms while maintaining the web-first subscription model and providing detailed analytics for continuous optimization.
