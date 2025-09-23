# Accessibility Specifications

## Overview
This document defines comprehensive accessibility standards for the D&D AI Campaign Management System, ensuring WCAG 2.1 AA compliance and inclusive design principles across all Flutter platforms (web, mobile, desktop).

---

## Accessibility Architecture

### **Flutter Accessibility Framework**
```dart
class DnDAIAccessibility {
  // Accessibility service configuration
  static void configureAccessibility() {
    // Enable Flutter's accessibility features
    WidgetsFlutterBinding.ensureInitialized();
    
    // Configure semantic announcements
    SemanticsService.announce(
      'D&D AI Campaign Manager loaded',
      TextDirection.ltr,
    );
    
    // Set up accessibility preferences
    _setupAccessibilityPreferences();
    
    // Initialize screen reader support
    _initializeScreenReaderSupport();
  }
  
  static void _setupAccessibilityPreferences() {
    final prefs = AccessibilityPreferences.instance;
    
    // Text scaling preferences
    prefs.setTextScaleFactor(
      MediaQuery.of(navigatorKey.currentContext!).textScaleFactor,
    );
    
    // High contrast mode
    prefs.setHighContrastMode(
      MediaQuery.of(navigatorKey.currentContext!).highContrast,
    );
    
    // Reduced motion preferences
    prefs.setReduceAnimations(
      MediaQuery.of(navigatorKey.currentContext!).disableAnimations,
    );
  }
  
  static void _initializeScreenReaderSupport() {
    // Configure semantic tree for screen readers
    SemanticsBinding.instance.ensureSemantics();
    
    // Set up focus management
    FocusManager.instance.highlightStrategy = FocusHighlightStrategy.alwaysTraditional;
    
    // Configure announcement priorities
    _setupAnnouncementPriorities();
  }
}
```

### **Accessibility Provider**
```dart
class AccessibilityProvider extends ChangeNotifier {
  bool _isScreenReaderEnabled = false;
  bool _isHighContrastEnabled = false;
  bool _isReducedMotionEnabled = false;
  double _textScaleFactor = 1.0;
  bool _isKeyboardNavigationEnabled = false;
  
  // Getters
  bool get isScreenReaderEnabled => _isScreenReaderEnabled;
  bool get isHighContrastEnabled => _isHighContrastEnabled;
  bool get isReducedMotionEnabled => _isReducedMotionEnabled;
  double get textScaleFactor => _textScaleFactor;
  bool get isKeyboardNavigationEnabled => _isKeyboardNavigationEnabled;
  
  void updateAccessibilitySettings(MediaQueryData mediaQuery) {
    final oldScreenReader = _isScreenReaderEnabled;
    final oldHighContrast = _isHighContrastEnabled;
    final oldReducedMotion = _isReducedMotionEnabled;
    final oldTextScale = _textScaleFactor;
    
    _isScreenReaderEnabled = mediaQuery.accessibleNavigation;
    _isHighContrastEnabled = mediaQuery.highContrast;
    _isReducedMotionEnabled = mediaQuery.disableAnimations;
    _textScaleFactor = mediaQuery.textScaleFactor;
    _isKeyboardNavigationEnabled = _detectKeyboardNavigation();
    
    if (oldScreenReader != _isScreenReaderEnabled ||
        oldHighContrast != _isHighContrastEnabled ||
        oldReducedMotion != _isReducedMotionEnabled ||
        oldTextScale != _textScaleFactor) {
      notifyListeners();
      _announceAccessibilityChange();
    }
  }
  
  bool _detectKeyboardNavigation() {
    // Platform-specific keyboard navigation detection
    if (kIsWeb) {
      return js.context['navigator']['maxTouchPoints'] == 0;
    }
    return Platform.isWindows || Platform.isLinux || Platform.isMacOS;
  }
  
  void _announceAccessibilityChange() {
    String announcement = 'Accessibility settings updated';
    if (_isHighContrastEnabled) {
      announcement += '. High contrast enabled';
    }
    if (_isReducedMotionEnabled) {
      announcement += '. Reduced motion enabled';
    }
    
    SemanticsService.announce(announcement, TextDirection.ltr);
  }
}
```

---

## Semantic Structure

### **Semantic Widgets**
```dart
class AccessibleWidget extends StatelessWidget {
  final Widget child;
  final String? semanticLabel;
  final String? semanticHint;
  final String? semanticValue;
  final bool excludeSemantics;
  final bool isButton;
  final bool isHeader;
  final bool isLiveRegion;
  final VoidCallback? onTap;

  const AccessibleWidget({
    Key? key,
    required this.child,
    this.semanticLabel,
    this.semanticHint,
    this.semanticValue,
    this.excludeSemantics = false,
    this.isButton = false,
    this.isHeader = false,
    this.isLiveRegion = false,
    this.onTap,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    if (excludeSemantics) {
      return ExcludeSemantics(child: child);
    }

    return Semantics(
      label: semanticLabel,
      hint: semanticHint,
      value: semanticValue,
      button: isButton,
      header: isHeader,
      liveRegion: isLiveRegion,
      onTap: onTap,
      child: child,
    );
  }
}

// Specialized semantic widgets
class AccessibleButton extends StatelessWidget {
  final String label;
  final String? hint;
  final VoidCallback? onPressed;
  final Widget child;
  final bool loading;

  const AccessibleButton({
    Key? key,
    required this.label,
    this.hint,
    this.onPressed,
    required this.child,
    this.loading = false,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: loading ? '$label, loading' : label,
      hint: hint,
      button: true,
      enabled: onPressed != null && !loading,
      onTap: onPressed,
      child: ExcludeSemantics(
        child: child,
      ),
    );
  }
}

class AccessibleTextField extends StatefulWidget {
  final String label;
  final String? hint;
  final String? errorText;
  final bool required;
  final TextEditingController? controller;
  final ValueChanged<String>? onChanged;
  final bool obscureText;

  const AccessibleTextField({
    Key? key,
    required this.label,
    this.hint,
    this.errorText,
    this.required = false,
    this.controller,
    this.onChanged,
    this.obscureText = false,
  }) : super(key: key);

  @override
  State<AccessibleTextField> createState() => _AccessibleTextFieldState();
}

class _AccessibleTextFieldState extends State<AccessibleTextField> {
  late FocusNode _focusNode;
  
  @override
  void initState() {
    super.initState();
    _focusNode = FocusNode();
    _focusNode.addListener(_onFocusChange);
  }

  @override
  Widget build(BuildContext context) {
    final accessibilityProvider = context.watch<AccessibilityProvider>();
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Label with required indicator
        Semantics(
          label: widget.required ? '${widget.label}, required' : widget.label,
          child: Text(
            widget.label + (widget.required ? ' *' : ''),
            style: Theme.of(context).textTheme.labelMedium?.copyWith(
              fontSize: Theme.of(context).textTheme.labelMedium!.fontSize! * 
                        accessibilityProvider.textScaleFactor,
            ),
          ),
        ),
        
        const SizedBox(height: 4),
        
        // Text field with semantic annotations
        Semantics(
          textField: true,
          label: widget.label,
          hint: widget.hint,
          value: widget.controller?.text,
          child: TextField(
            controller: widget.controller,
            onChanged: widget.onChanged,
            obscureText: widget.obscureText,
            focusNode: _focusNode,
            decoration: InputDecoration(
              hintText: widget.hint,
              errorText: widget.errorText,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
                borderSide: BorderSide(
                  color: widget.errorText != null
                      ? Theme.of(context).colorScheme.error
                      : Theme.of(context).dividerColor,
                  width: accessibilityProvider.isHighContrastEnabled ? 2 : 1,
                ),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
                borderSide: BorderSide(
                  color: Theme.of(context).colorScheme.primary,
                  width: 2,
                ),
              ),
              errorBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
                borderSide: BorderSide(
                  color: Theme.of(context).colorScheme.error,
                  width: 2,
                ),
              ),
            ),
            style: TextStyle(
              fontSize: Theme.of(context).textTheme.bodyMedium!.fontSize! * 
                        accessibilityProvider.textScaleFactor,
            ),
          ),
        ),
        
        // Error message with semantic announcement
        if (widget.errorText != null) ...[
          const SizedBox(height: 4),
          Semantics(
            liveRegion: true,
            child: Text(
              widget.errorText!,
              style: TextStyle(
                color: Theme.of(context).colorScheme.error,
                fontSize: Theme.of(context).textTheme.bodySmall!.fontSize! * 
                          accessibilityProvider.textScaleFactor,
              ),
            ),
          ),
        ],
      ],
    );
  }

  void _onFocusChange() {
    if (_focusNode.hasFocus && widget.hint != null) {
      // Announce hint when field gains focus
      SemanticsService.announce(
        '${widget.label}. ${widget.hint}',
        TextDirection.ltr,
      );
    }
  }

  @override
  void dispose() {
    _focusNode.dispose();
    super.dispose();
  }
}
```

### **Navigation Semantics**
```dart
class AccessibleNavigation extends StatelessWidget {
  final List<NavigationItem> items;
  final int currentIndex;
  final ValueChanged<int> onTap;
  final NavigationType type;

  const AccessibleNavigation({
    Key? key,
    required this.items,
    required this.currentIndex,
    required this.onTap,
    required this.type,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Semantics(
      container: true,
      label: 'Main navigation',
      child: _buildNavigationByType(context),
    );
  }

  Widget _buildNavigationByType(BuildContext context) {
    switch (type) {
      case NavigationType.bottom:
        return _buildBottomNavigation(context);
      case NavigationType.rail:
        return _buildNavigationRail(context);
      case NavigationType.drawer:
        return _buildNavigationDrawer(context);
    }
  }

  Widget _buildBottomNavigation(BuildContext context) {
    return NavigationBar(
      selectedIndex: currentIndex,
      onDestinationSelected: (index) {
        _announceNavigation(items[index].label);
        onTap(index);
      },
      destinations: items.asMap().entries.map((entry) {
        final index = entry.key;
        final item = entry.value;
        
        return NavigationDestination(
          icon: Semantics(
            excludeSemantics: true,
            child: Icon(item.icon),
          ),
          selectedIcon: Semantics(
            excludeSemantics: true,
            child: Icon(item.selectedIcon ?? item.icon),
          ),
          label: item.label,
          tooltip: '${item.label} tab${index == currentIndex ? ', selected' : ''}',
        );
      }).toList(),
    );
  }

  Widget _buildNavigationRail(BuildContext context) {
    return Semantics(
      container: true,
      label: 'Navigation rail',
      child: NavigationRail(
        selectedIndex: currentIndex,
        onDestinationSelected: (index) {
          _announceNavigation(items[index].label);
          onTap(index);
        },
        destinations: items.asMap().entries.map((entry) {
          final index = entry.key;
          final item = entry.value;
          
          return NavigationRailDestination(
            icon: Semantics(
              label: '${item.label}${index == currentIndex ? ', selected' : ''}',
              button: true,
              child: Icon(item.icon),
            ),
            selectedIcon: Semantics(
              label: '${item.label}, selected',
              button: true,
              child: Icon(item.selectedIcon ?? item.icon),
            ),
            label: Text(item.label),
          );
        }).toList(),
      ),
    );
  }

  void _announceNavigation(String label) {
    SemanticsService.announce(
      'Navigated to $label',
      TextDirection.ltr,
    );
  }
}
```

---

## Focus Management

### **Focus Management System**
```dart
class FocusManagementService {
  static final FocusNode _trapFocusNode = FocusNode();
  static final List<FocusNode> _focusHistory = [];
  
  // Focus trap for modals and dialogs
  static void trapFocus(BuildContext context, List<FocusNode> focusableNodes) {
    if (focusableNodes.isEmpty) return;
    
    // Set initial focus
    focusableNodes.first.requestFocus();
    
    // Listen for tab navigation
    RawKeyboard.instance.addListener((RawKeyEvent event) {
      if (event is RawKeyDownEvent && 
          event.logicalKey == LogicalKeyboardKey.tab) {
        _handleTabNavigation(event, focusableNodes);
      }
    });
  }
  
  static void _handleTabNavigation(
    RawKeyDownEvent event, 
    List<FocusNode> focusableNodes,
  ) {
    final currentFocus = FocusScope.of(navigatorKey.currentContext!).focusedChild;
    final currentIndex = focusableNodes.indexOf(currentFocus as FocusNode);
    
    if (event.isShiftPressed) {
      // Shift+Tab - previous element
      final previousIndex = currentIndex > 0 ? currentIndex - 1 : focusableNodes.length - 1;
      focusableNodes[previousIndex].requestFocus();
    } else {
      // Tab - next element
      final nextIndex = currentIndex < focusableNodes.length - 1 ? currentIndex + 1 : 0;
      focusableNodes[nextIndex].requestFocus();
    }
  }
  
  // Skip links for keyboard navigation
  static Widget buildSkipLink({
    required String label,
    required String targetId,
    required VoidCallback onActivated,
  }) {
    return Positioned(
      top: -40,
      left: 6,
      child: Focus(
        onFocusChange: (hasFocus) {
          if (hasFocus) {
            // Move skip link into view
            Scrollable.ensureVisible(
              navigatorKey.currentContext!,
              alignment: 0.0,
            );
          }
        },
        child: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: Theme.of(navigatorKey.currentContext!).colorScheme.primary,
            borderRadius: BorderRadius.circular(4),
          ),
          child: InkWell(
            onTap: onActivated,
            child: Text(
              label,
              style: TextStyle(
                color: Theme.of(navigatorKey.currentContext!).colorScheme.onPrimary,
                decoration: TextDecoration.underline,
              ),
            ),
          ),
        ),
      ),
    );
  }
  
  // Focus restoration
  static void saveFocus(FocusNode node) {
    _focusHistory.add(node);
  }
  
  static void restoreFocus() {
    if (_focusHistory.isNotEmpty) {
      final lastFocus = _focusHistory.removeLast();
      lastFocus.requestFocus();
    }
  }
}
```

### **Keyboard Navigation**
```dart
class KeyboardNavigationWidget extends StatefulWidget {
  final Widget child;
  final List<KeyboardShortcut> shortcuts;
  final bool trapFocus;

  const KeyboardNavigationWidget({
    Key? key,
    required this.child,
    this.shortcuts = const [],
    this.trapFocus = false,
  }) : super(key: key);

  @override
  State<KeyboardNavigationWidget> createState() => _KeyboardNavigationWidgetState();
}

class _KeyboardNavigationWidgetState extends State<KeyboardNavigationWidget> {
  final FocusNode _focusNode = FocusNode();
  final List<FocusNode> _childFocusNodes = [];

  @override
  Widget build(BuildContext context) {
    return Focus(
      focusNode: _focusNode,
      onKey: _handleKeyEvent,
      child: Shortcuts(
        shortcuts: _buildShortcuts(),
        child: Actions(
          actions: _buildActions(),
          child: widget.child,
        ),
      ),
    );
  }

  KeyEventResult _handleKeyEvent(FocusNode node, RawKeyEvent event) {
    if (event is RawKeyDownEvent) {
      // Escape key handling
      if (event.logicalKey == LogicalKeyboardKey.escape) {
        _handleEscape();
        return KeyEventResult.handled;
      }
      
      // Arrow key navigation
      if (event.logicalKey == LogicalKeyboardKey.arrowDown ||
          event.logicalKey == LogicalKeyboardKey.arrowUp ||
          event.logicalKey == LogicalKeyboardKey.arrowLeft ||
          event.logicalKey == LogicalKeyboardKey.arrowRight) {
        return _handleArrowNavigation(event.logicalKey);
      }
    }
    
    return KeyEventResult.ignored;
  }

  Map<ShortcutActivator, Intent> _buildShortcuts() {
    final shortcuts = <ShortcutActivator, Intent>{};
    
    for (final shortcut in widget.shortcuts) {
      shortcuts[shortcut.activator] = shortcut.intent;
    }
    
    return shortcuts;
  }

  Map<Type, Action<Intent>> _buildActions() {
    final actions = <Type, Action<Intent>>{};
    
    for (final shortcut in widget.shortcuts) {
      actions[shortcut.intent.runtimeType] = CallbackAction<Intent>(
        onInvoke: (intent) => shortcut.callback(),
      );
    }
    
    return actions;
  }

  void _handleEscape() {
    // Close modals, cancel operations, etc.
    if (Navigator.canPop(context)) {
      Navigator.pop(context);
    }
  }

  KeyEventResult _handleArrowNavigation(LogicalKeyboardKey key) {
    // Implement directional navigation logic
    final focusedChild = FocusScope.of(context).focusedChild;
    
    if (focusedChild != null) {
      switch (key) {
        case LogicalKeyboardKey.arrowDown:
          return _moveFocusDown(focusedChild);
        case LogicalKeyboardKey.arrowUp:
          return _moveFocusUp(focusedChild);
        case LogicalKeyboardKey.arrowLeft:
          return _moveFocusLeft(focusedChild);
        case LogicalKeyboardKey.arrowRight:
          return _moveFocusRight(focusedChild);
      }
    }
    
    return KeyEventResult.ignored;
  }

  KeyEventResult _moveFocusDown(FocusNode currentFocus) {
    final nextFocus = currentFocus.nextFocus();
    if (nextFocus != null) {
      nextFocus.requestFocus();
      return KeyEventResult.handled;
    }
    return KeyEventResult.ignored;
  }

  KeyEventResult _moveFocusUp(FocusNode currentFocus) {
    final previousFocus = currentFocus.previousFocus();
    if (previousFocus != null) {
      previousFocus.requestFocus();
      return KeyEventResult.handled;
    }
    return KeyEventResult.ignored;
  }

  KeyEventResult _moveFocusLeft(FocusNode currentFocus) {
    // Implement left navigation logic
    return KeyEventResult.ignored;
  }

  KeyEventResult _moveFocusRight(FocusNode currentFocus) {
    // Implement right navigation logic
    return KeyEventResult.ignored;
  }

  @override
  void dispose() {
    _focusNode.dispose();
    for (final node in _childFocusNodes) {
      node.dispose();
    }
    super.dispose();
  }
}

// Keyboard shortcut definition
class KeyboardShortcut {
  final ShortcutActivator activator;
  final Intent intent;
  final VoidCallback callback;
  final String description;

  const KeyboardShortcut({
    required this.activator,
    required this.intent,
    required this.callback,
    required this.description,
  });
}
```

---

## Color and Contrast

### **High Contrast Theme**
```dart
class HighContrastTheme {
  static ThemeData buildHighContrastTheme({required bool isDark}) {
    final baseTheme = isDark ? ThemeData.dark() : ThemeData.light();
    
    return baseTheme.copyWith(
      colorScheme: _buildHighContrastColorScheme(isDark),
      textTheme: _buildHighContrastTextTheme(baseTheme.textTheme, isDark),
      buttonTheme: _buildHighContrastButtonTheme(isDark),
      inputDecorationTheme: _buildHighContrastInputTheme(isDark),
      cardTheme: _buildHighContrastCardTheme(isDark),
    );
  }

  static ColorScheme _buildHighContrastColorScheme(bool isDark) {
    if (isDark) {
      return const ColorScheme.dark(
        primary: Color(0xFFFFFFFF),
        onPrimary: Color(0xFF000000),
        secondary: Color(0xFFFFFF00),
        onSecondary: Color(0xFF000000),
        surface: Color(0xFF000000),
        onSurface: Color(0xFFFFFFFF),
        background: Color(0xFF000000),
        onBackground: Color(0xFFFFFFFF),
        error: Color(0xFFFF0000),
        onError: Color(0xFFFFFFFF),
      );
    } else {
      return const ColorScheme.light(
        primary: Color(0xFF000000),
        onPrimary: Color(0xFFFFFFFF),
        secondary: Color(0xFF0000FF),
        onSecondary: Color(0xFFFFFFFF),
        surface: Color(0xFFFFFFFF),
        onSurface: Color(0xFF000000),
        background: Color(0xFFFFFFFF),
        onBackground: Color(0xFF000000),
        error: Color(0xFFFF0000),
        onError: Color(0xFFFFFFFF),
      );
    }
  }

  static TextTheme _buildHighContrastTextTheme(TextTheme baseTheme, bool isDark) {
    final color = isDark ? Colors.white : Colors.black;
    
    return baseTheme.copyWith(
      displayLarge: baseTheme.displayLarge?.copyWith(
        color: color,
        fontWeight: FontWeight.bold,
      ),
      displayMedium: baseTheme.displayMedium?.copyWith(
        color: color,
        fontWeight: FontWeight.bold,
      ),
      headlineLarge: baseTheme.headlineLarge?.copyWith(
        color: color,
        fontWeight: FontWeight.bold,
      ),
      bodyLarge: baseTheme.bodyLarge?.copyWith(
        color: color,
        fontWeight: FontWeight.w500,
      ),
      bodyMedium: baseTheme.bodyMedium?.copyWith(
        color: color,
        fontWeight: FontWeight.w500,
      ),
    );
  }

  static ButtonThemeData _buildHighContrastButtonTheme(bool isDark) {
    return ButtonThemeData(
      buttonColor: isDark ? Colors.white : Colors.black,
      textTheme: ButtonTextTheme.primary,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(4),
        side: BorderSide(
          color: isDark ? Colors.white : Colors.black,
          width: 2,
        ),
      ),
    );
  }

  static InputDecorationTheme _buildHighContrastInputTheme(bool isDark) {
    return InputDecorationTheme(
      border: OutlineInputBorder(
        borderSide: BorderSide(
          color: isDark ? Colors.white : Colors.black,
          width: 2,
        ),
      ),
      focusedBorder: OutlineInputBorder(
        borderSide: BorderSide(
          color: isDark ? Colors.yellow : Colors.blue,
          width: 3,
        ),
      ),
      errorBorder: OutlineInputBorder(
        borderSide: const BorderSide(
          color: Colors.red,
          width: 2,
        ),
      ),
    );
  }

  static CardTheme _buildHighContrastCardTheme(bool isDark) {
    return CardTheme(
      color: isDark ? Colors.black : Colors.white,
      shadowColor: isDark ? Colors.white.withOpacity(0.3) : Colors.black.withOpacity(0.3),
      elevation: 4,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(8),
        side: BorderSide(
          color: isDark ? Colors.white : Colors.black,
          width: 2,
        ),
      ),
    );
  }
}
```

### **Color Contrast Validation**
```dart
class ContrastValidator {
  // WCAG 2.1 contrast ratios
  static const double minimumNormalText = 4.5;
  static const double minimumLargeText = 3.0;
  static const double enhancedNormalText = 7.0;
  static const double enhancedLargeText = 4.5;

  static double calculateContrastRatio(Color foreground, Color background) {
    final fgLuminance = _calculateLuminance(foreground);
    final bgLuminance = _calculateLuminance(background);
    
    final lighter = math.max(fgLuminance, bgLuminance);
    final darker = math.min(fgLuminance, bgLuminance);
    
    return (lighter + 0.05) / (darker + 0.05);
  }

  static double _calculateLuminance(Color color) {
    final r = _linearizeComponent(color.red / 255.0);
    final g = _linearizeComponent(color.green / 255.0);
    final b = _linearizeComponent(color.blue / 255.0);
    
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  static double _linearizeComponent(double component) {
    if (component <= 0.03928) {
      return component / 12.92;
    } else {
      return math.pow((component + 0.055) / 1.055, 2.4).toDouble();
    }
  }

  static bool meetsWCAGAA(Color foreground, Color background, {bool isLargeText = false}) {
    final ratio = calculateContrastRatio(foreground, background);
    final minimum = isLargeText ? minimumLargeText : minimumNormalText;
    return ratio >= minimum;
  }

  static bool meetsWCAGAAA(Color foreground, Color background, {bool isLargeText = false}) {
    final ratio = calculateContrastRatio(foreground, background);
    final minimum = isLargeText ? enhancedLargeText : enhancedNormalText;
    return ratio >= minimum;
  }
}
```

---

## Screen Reader Support

### **Screen Reader Announcements**
```dart
class ScreenReaderService {
  static void announcePageChange(String pageName) {
    SemanticsService.announce(
      'Navigated to $pageName page',
      TextDirection.ltr,
    );
  }
  
  static void announceAction(String action) {
    SemanticsService.announce(
      action,
      TextDirection.ltr,
    );
  }
  
  static void announceError(String error) {
    SemanticsService.announce(
      'Error: $error',
      TextDirection.ltr,
      Assertiveness.assertive,
    );
  }
  
  static void announceSuccess(String message) {
    SemanticsService.announce(
      'Success: $message',
      TextDirection.ltr,
      Assertiveness.polite,
    );
  }
  
  static void announceLoading(String context) {
    SemanticsService.announce(
      'Loading $context',
      TextDirection.ltr,
      Assertiveness.polite,
    );
  }
  
  static void announceLoadingComplete(String context) {
    SemanticsService.announce(
      '$context loaded',
      TextDirection.ltr,
      Assertiveness.polite,
    );
  }
  
  // D&D specific announcements
  static void announceDiceRoll(DiceResult result) {
    final announcement = 'Rolled ${result.diceType.name}: ${result.total}. ${result.breakdown}';
    SemanticsService.announce(
      announcement,
      TextDirection.ltr,
      Assertiveness.assertive,
    );
  }
  
  static void announceCombatTurn(String characterName) {
    SemanticsService.announce(
      'It is now $characterName\'s turn',
      TextDirection.ltr,
      Assertiveness.assertive,
    );
  }
  
  static void announceHealthChange(String characterName, int currentHP, int maxHP) {
    final percentage = (currentHP / maxHP * 100).round();
    SemanticsService.announce(
      '$characterName health: $currentHP out of $maxHP. $percentage percent',
      TextDirection.ltr,
      Assertiveness.polite,
    );
  }
}
```

### **Live Regions**
```dart
class LiveRegion extends StatefulWidget {
  final Widget child;
  final String? initialAnnouncement;
  final Assertiveness assertiveness;
  final bool atomic;

  const LiveRegion({
    Key? key,
    required this.child,
    this.initialAnnouncement,
    this.assertiveness = Assertiveness.polite,
    this.atomic = false,
  }) : super(key: key);

  @override
  State<LiveRegion> createState() => _LiveRegionState();
}

class _LiveRegionState extends State<LiveRegion> {
  String? _lastAnnouncement;

  @override
  void initState() {
    super.initState();
    if (widget.initialAnnouncement != null) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _announce(widget.initialAnnouncement!);
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Semantics(
      liveRegion: true,
      child: widget.child,
    );
  }

  void announce(String message) {
    if (message != _lastAnnouncement) {
      _announce(message);
      _lastAnnouncement = message;
    }
  }

  void _announce(String message) {
    SemanticsService.announce(
      message,
      TextDirection.ltr,
      widget.assertiveness,
    );
  }
}
```

---

## Testing and Validation

### **Accessibility Testing Framework**
```dart
class AccessibilityTester {
  static Future<AccessibilityReport> runAccessibilityAudit(Widget widget) async {
    final report = AccessibilityReport();
    
    // Create test environment
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: widget,
        ),
      ),
    );
    
    // Test semantic structure
    await _testSemanticStructure(tester, report);
    
    // Test focus management
    await _testFocusManagement(tester, report);
    
    // Test keyboard navigation
    await _testKeyboardNavigation(tester, report);
    
    // Test color contrast
    await _testColorContrast(tester, report);
    
    // Test text scaling
    await _testTextScaling(tester, report);
    
    return report;
  }
  
  static Future<void> _testSemanticStructure(
    WidgetTester tester,
    AccessibilityReport report,
  ) async {
    final semanticsNodes = tester.binding.pipelineOwner.semanticsOwner?.rootSemanticsNode;
    
    if (semanticsNodes != null) {
      _validateSemanticTree(semanticsNodes, report);
    }
  }
  
  static void _validateSemanticTree(SemanticsNode node, AccessibilityReport report) {
    // Check for proper labeling
    if (node.hasFlag(SemanticsFlag.isButton) && 
        (node.label == null || node.label!.isEmpty)) {
      report.addIssue(AccessibilityIssue(
        severity: AccessibilitySeverity.error,
        message: 'Button without accessible label found',
        node: node,
      ));
    }
    
    // Check for proper heading hierarchy
    if (node.hasFlag(SemanticsFlag.isHeader)) {
      // Validate heading levels
      _validateHeadingHierarchy(node, report);
    }
    
    // Recursively check children
    node.visitChildren((child) {
      _validateSemanticTree(child, report);
      return true;
    });
  }
  
  static Future<void> _testColorContrast(
    WidgetTester tester,
    AccessibilityReport report,
  ) async {
    // Find all text widgets and check contrast
    final textWidgets = find.byType(Text);
    
    for (int i = 0; i < textWidgets.evaluate().length; i++) {
      final textWidget = tester.widget<Text>(textWidgets.at(i));
      final renderObject = tester.renderObject(textWidgets.at(i));
      
      if (textWidget.style != null && renderObject is RenderParagraph) {
        final textColor = textWidget.style!.color ?? Colors.black;
        final backgroundColor = _getBackgroundColor(renderObject);
        
        if (backgroundColor != null) {
          final contrastRatio = ContrastValidator.calculateContrastRatio(
            textColor,
            backgroundColor,
          );
          
          final isLargeText = (textWidget.style?.fontSize ?? 14) >= 18;
          
          if (!ContrastValidator.meetsWCAGAA(textColor, backgroundColor, isLargeText: isLargeText)) {
            report.addIssue(AccessibilityIssue(
              severity: AccessibilitySeverity.error,
              message: 'Text does not meet WCAG AA contrast requirements. Ratio: ${contrastRatio.toStringAsFixed(2)}',
              widget: textWidget,
            ));
          }
        }
      }
    }
  }
  
  static Future<void> _testTextScaling(
    WidgetTester tester,
    AccessibilityReport report,
  ) async {
    // Test with different text scale factors
    final scaleFactors = [1.0, 1.5, 2.0, 3.0];
    
    for (final scaleFactor in scaleFactors) {
      await tester.binding.defaultBinaryMessenger.setMockMethodCallHandler(
        SystemChannels.textInput,
        (call) async {
          if (call.method == 'TextInput.setClient') {
            return null;
          }
          return null;
        },
      );
      
      await tester.pumpWidget(
        MediaQuery(
          data: MediaQueryData(textScaleFactor: scaleFactor),
          child: MaterialApp(
            home: Scaffold(
              body: widget,
            ),
          ),
        ),
      );
      
      // Check for text overflow
      final overflowWidgets = find.byType(Text);
      for (int i = 0; i < overflowWidgets.evaluate().length; i++) {
        final renderObject = tester.renderObject(overflowWidgets.at(i)) as RenderParagraph;
        
        if (renderObject.hasVisualOverflow) {
          report.addIssue(AccessibilityIssue(
            severity: AccessibilitySeverity.warning,
            message: 'Text overflow detected at ${scaleFactor}x scale factor',
            widget: tester.widget(overflowWidgets.at(i)),
          ));
        }
      }
    }
  }
}

class AccessibilityReport {
  final List<AccessibilityIssue> issues = [];
  
  void addIssue(AccessibilityIssue issue) {
    issues.add(issue);
  }
  
  bool get hasErrors => issues.any((issue) => issue.severity == AccessibilitySeverity.error);
  bool get hasWarnings => issues.any((issue) => issue.severity == AccessibilitySeverity.warning);
  
  @override
  String toString() {
    final buffer = StringBuffer();
    buffer.writeln('Accessibility Report');
    buffer.writeln('===================');
    
    final errors = issues.where((i) => i.severity == AccessibilitySeverity.error);
    final warnings = issues.where((i) => i.severity == AccessibilitySeverity.warning);
    
    buffer.writeln('Errors: ${errors.length}');
    buffer.writeln('Warnings: ${warnings.length}');
    buffer.writeln();
    
    for (final issue in issues) {
      buffer.writeln('${issue.severity.name.toUpperCase()}: ${issue.message}');
    }
    
    return buffer.toString();
  }
}

class AccessibilityIssue {
  final AccessibilitySeverity severity;
  final String message;
  final SemanticsNode? node;
  final Widget? widget;

  AccessibilityIssue({
    required this.severity,
    required this.message,
    this.node,
    this.widget,
  });
}

enum AccessibilitySeverity { error, warning, info }
```

This comprehensive accessibility specification ensures that the D&D AI Campaign Management System is fully accessible to users with diverse abilities, meeting WCAG 2.1 AA standards while providing an excellent user experience for everyone.
