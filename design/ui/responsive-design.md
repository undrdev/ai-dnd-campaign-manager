# Flutter Responsive Design Patterns

## Overview
This document defines comprehensive responsive design patterns for the Flutter-based D&D AI Campaign Management System, ensuring optimal user experiences across all screen sizes and platforms while maintaining consistent functionality.

---

## Flutter Responsive Architecture

### **Responsive Framework Setup**
```dart
// pubspec.yaml dependencies
dependencies:
  flutter:
    sdk: flutter
  responsive_framework: ^1.1.1
  flutter_screenutil: ^5.9.0
  adaptive_theme: ^3.4.1

// Main app configuration
class DnDAIApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return ScreenUtilInit(
      designSize: const Size(1440, 900), // Desktop design baseline
      minTextAdapt: true,
      splitScreenMode: true,
      builder: (context, child) {
        return ResponsiveWrapper.builder(
          MaterialApp.router(
            title: 'D&D AI Campaign Manager',
            routerConfig: AppRouter.router,
            theme: DnDAITheme.lightTheme,
            darkTheme: DnDAITheme.darkTheme,
          ),
          maxWidth: 2560,
          minWidth: 320,
          defaultScale: true,
          breakpoints: [
            const ResponsiveBreakpoint.resize(320, name: MOBILE),
            const ResponsiveBreakpoint.autoScale(600, name: TABLET),
            const ResponsiveBreakpoint.resize(1024, name: DESKTOP),
            const ResponsiveBreakpoint.autoScale(1440, name: 'XL'),
            const ResponsiveBreakpoint.resize(2560, name: '4K'),
          ],
        );
      },
    );
  }
}
```

### **Breakpoint System**
```dart
class ResponsiveBreakpoints {
  // Screen size breakpoints
  static const double mobile = 320;
  static const double mobileLarge = 480;
  static const double tablet = 768;
  static const double desktop = 1024;
  static const double desktopLarge = 1440;
  static const double ultraWide = 1920;
  static const double fourK = 2560;

  // Component breakpoints
  static const double compactNav = 768;
  static const double sidebarVisible = 1024;
  static const double multiColumn = 1200;
  static const double wideLayout = 1440;

  // Touch target sizes
  static const double minTouchTarget = 44;
  static const double recommendedTouchTarget = 48;
  static const double largeTouchTarget = 56;

  // Content width constraints
  static const double maxContentWidth = 1200;
  static const double maxReadingWidth = 800;
  static const double sidebarWidth = 280;
  static const double compactSidebarWidth = 64;
}

// Responsive helper class
class ResponsiveHelper {
  static bool isMobile(BuildContext context) =>
      MediaQuery.of(context).size.width < ResponsiveBreakpoints.tablet;

  static bool isTablet(BuildContext context) {
    final width = MediaQuery.of(context).size.width;
    return width >= ResponsiveBreakpoints.tablet && 
           width < ResponsiveBreakpoints.desktop;
  }

  static bool isDesktop(BuildContext context) =>
      MediaQuery.of(context).size.width >= ResponsiveBreakpoints.desktop;

  static bool shouldShowSidebar(BuildContext context) =>
      MediaQuery.of(context).size.width >= ResponsiveBreakpoints.sidebarVisible;

  static bool shouldUseMultiColumn(BuildContext context) =>
      MediaQuery.of(context).size.width >= ResponsiveBreakpoints.multiColumn;

  static double getContentPadding(BuildContext context) {
    if (isMobile(context)) return 16;
    if (isTablet(context)) return 24;
    return 32;
  }

  static int getGridColumns(BuildContext context) {
    final width = MediaQuery.of(context).size.width;
    if (width < 600) return 1;
    if (width < 900) return 2;
    if (width < 1200) return 3;
    return 4;
  }
}
```

---

## Responsive Layout Patterns

### **Adaptive Navigation Pattern**
```dart
class AdaptiveNavigation extends StatefulWidget {
  final Widget child;
  final List<NavigationItem> items;

  const AdaptiveNavigation({
    Key? key,
    required this.child,
    required this.items,
  }) : super(key: key);

  @override
  State<AdaptiveNavigation> createState() => _AdaptiveNavigationState();
}

class _AdaptiveNavigationState extends State<AdaptiveNavigation> {
  int _selectedIndex = 0;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        // Mobile: Bottom Navigation
        if (constraints.maxWidth < ResponsiveBreakpoints.tablet) {
          return _buildMobileLayout();
        }
        
        // Tablet: Navigation Rail
        if (constraints.maxWidth < ResponsiveBreakpoints.desktop) {
          return _buildTabletLayout();
        }
        
        // Desktop: Full Sidebar
        return _buildDesktopLayout();
      },
    );
  }

  Widget _buildMobileLayout() {
    return Scaffold(
      body: widget.child,
      bottomNavigationBar: NavigationBar(
        selectedIndex: _selectedIndex,
        onDestinationSelected: _onDestinationSelected,
        destinations: widget.items
            .take(5) // Limit to 5 items on mobile
            .map((item) => NavigationDestination(
                  icon: Icon(item.icon),
                  selectedIcon: Icon(item.selectedIcon ?? item.icon),
                  label: item.label,
                ))
            .toList(),
      ),
    );
  }

  Widget _buildTabletLayout() {
    return Scaffold(
      body: Row(
        children: [
          NavigationRail(
            selectedIndex: _selectedIndex,
            onDestinationSelected: _onDestinationSelected,
            extended: constraints.maxWidth > 1000,
            destinations: widget.items
                .map((item) => NavigationRailDestination(
                      icon: Icon(item.icon),
                      selectedIcon: Icon(item.selectedIcon ?? item.icon),
                      label: Text(item.label),
                    ))
                .toList(),
          ),
          const VerticalDivider(thickness: 1, width: 1),
          Expanded(child: widget.child),
        ],
      ),
    );
  }

  Widget _buildDesktopLayout() {
    return Scaffold(
      body: Row(
        children: [
          SizedBox(
            width: ResponsiveBreakpoints.sidebarWidth,
            child: NavigationSidebar(
              items: widget.items,
              selectedIndex: _selectedIndex,
              onDestinationSelected: _onDestinationSelected,
            ),
          ),
          const VerticalDivider(thickness: 1, width: 1),
          Expanded(child: widget.child),
        ],
      ),
    );
  }

  void _onDestinationSelected(int index) {
    setState(() {
      _selectedIndex = index;
    });
    // Handle navigation
    context.go(widget.items[index].route);
  }
}
```

### **Responsive Grid Pattern**
```dart
class ResponsiveGrid extends StatelessWidget {
  final List<Widget> children;
  final double? spacing;
  final double? runSpacing;
  final EdgeInsetsGeometry? padding;

  const ResponsiveGrid({
    Key? key,
    required this.children,
    this.spacing = 16,
    this.runSpacing = 16,
    this.padding,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final columns = _getColumnCount(constraints.maxWidth);
        final itemWidth = (constraints.maxWidth - 
            (spacing! * (columns - 1))) / columns;

        return Padding(
          padding: padding ?? EdgeInsets.all(ResponsiveHelper.getContentPadding(context)),
          child: Wrap(
            spacing: spacing!,
            runSpacing: runSpacing!,
            children: children.map((child) {
              return SizedBox(
                width: itemWidth,
                child: child,
              );
            }).toList(),
          ),
        );
      },
    );
  }

  int _getColumnCount(double width) {
    if (width < 600) return 1;
    if (width < 900) return 2;
    if (width < 1200) return 3;
    if (width < 1600) return 4;
    return 5;
  }
}
```

### **Adaptive Content Layout**
```dart
class AdaptiveContentLayout extends StatelessWidget {
  final Widget? sidebar;
  final Widget content;
  final Widget? aside;
  final bool forceMobile;

  const AdaptiveContentLayout({
    Key? key,
    this.sidebar,
    required this.content,
    this.aside,
    this.forceMobile = false,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final isMobile = forceMobile || 
            constraints.maxWidth < ResponsiveBreakpoints.tablet;
        final showSidebar = !isMobile && sidebar != null;
        final showAside = constraints.maxWidth >= ResponsiveBreakpoints.wideLayout && 
            aside != null;

        if (isMobile) {
          return _buildMobileLayout();
        }

        return _buildDesktopLayout(showSidebar, showAside);
      },
    );
  }

  Widget _buildMobileLayout() {
    return Column(
      children: [
        Expanded(child: content),
      ],
    );
  }

  Widget _buildDesktopLayout(bool showSidebar, bool showAside) {
    return Row(
      children: [
        if (showSidebar) ...[
          SizedBox(
            width: ResponsiveBreakpoints.sidebarWidth,
            child: sidebar!,
          ),
          const VerticalDivider(thickness: 1, width: 1),
        ],
        Expanded(child: content),
        if (showAside) ...[
          const VerticalDivider(thickness: 1, width: 1),
          SizedBox(
            width: 320,
            child: aside!,
          ),
        ],
      ],
    );
  }
}
```

---

## Responsive Components

### **Adaptive Button**
```dart
class AdaptiveButton extends StatelessWidget {
  final String text;
  final IconData? icon;
  final VoidCallback? onPressed;
  final ButtonStyle? style;
  final bool compact;

  const AdaptiveButton({
    Key? key,
    required this.text,
    this.icon,
    this.onPressed,
    this.style,
    this.compact = false,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final isMobile = ResponsiveHelper.isMobile(context);
        final shouldShowIcon = icon != null && !compact;
        final shouldShowText = !compact || !isMobile;

        if (shouldShowIcon && shouldShowText) {
          return ElevatedButton.icon(
            onPressed: onPressed,
            icon: Icon(icon),
            label: Text(text),
            style: _getButtonStyle(context),
          );
        } else if (shouldShowText) {
          return ElevatedButton(
            onPressed: onPressed,
            style: _getButtonStyle(context),
            child: Text(text),
          );
        } else if (shouldShowIcon) {
          return IconButton(
            onPressed: onPressed,
            icon: Icon(icon),
            style: IconButton.styleFrom(
              minimumSize: Size(
                ResponsiveBreakpoints.minTouchTarget,
                ResponsiveBreakpoints.minTouchTarget,
              ),
            ),
          );
        }

        return ElevatedButton(
          onPressed: onPressed,
          style: _getButtonStyle(context),
          child: Text(text),
        );
      },
    );
  }

  ButtonStyle _getButtonStyle(BuildContext context) {
    final isMobile = ResponsiveHelper.isMobile(context);
    
    return ElevatedButton.styleFrom(
      minimumSize: Size(
        0,
        isMobile 
          ? ResponsiveBreakpoints.recommendedTouchTarget
          : 40,
      ),
      padding: EdgeInsets.symmetric(
        horizontal: isMobile ? 16 : 12,
        vertical: isMobile ? 12 : 8,
      ),
    ).merge(style);
  }
}
```

### **Responsive Card**
```dart
class ResponsiveCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry? padding;
  final EdgeInsetsGeometry? margin;
  final double? elevation;
  final bool adaptivePadding;

  const ResponsiveCard({
    Key? key,
    required this.child,
    this.padding,
    this.margin,
    this.elevation,
    this.adaptivePadding = true,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: elevation,
      margin: margin ?? EdgeInsets.all(
        ResponsiveHelper.isMobile(context) ? 8 : 12,
      ),
      child: Padding(
        padding: padding ?? (adaptivePadding 
          ? EdgeInsets.all(ResponsiveHelper.getContentPadding(context))
          : const EdgeInsets.all(16)
        ),
        child: child,
      ),
    );
  }
}
```

### **Adaptive Dialog**
```dart
class AdaptiveDialog extends StatelessWidget {
  final String title;
  final Widget content;
  final List<Widget>? actions;
  final bool fullScreenOnMobile;

  const AdaptiveDialog({
    Key? key,
    required this.title,
    required this.content,
    this.actions,
    this.fullScreenOnMobile = false,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final isMobile = ResponsiveHelper.isMobile(context);

    if (isMobile && fullScreenOnMobile) {
      return _buildFullScreenDialog(context);
    }

    return AlertDialog(
      title: Text(title),
      content: ConstrainedBox(
        constraints: BoxConstraints(
          maxWidth: isMobile ? double.infinity : 400,
          maxHeight: MediaQuery.of(context).size.height * 0.8,
        ),
        child: content,
      ),
      actions: actions,
      actionsPadding: EdgeInsets.all(
        isMobile ? 16 : 12,
      ),
    );
  }

  Widget _buildFullScreenDialog(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(title),
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: () => Navigator.of(context).pop(),
        ),
        actions: actions?.take(2).toList(), // Limit actions in app bar
      ),
      body: Padding(
        padding: EdgeInsets.all(ResponsiveHelper.getContentPadding(context)),
        child: content,
      ),
    );
  }
}
```

---

## Typography Scaling

### **Responsive Typography**
```dart
class ResponsiveText extends StatelessWidget {
  final String text;
  final TextStyle? style;
  final TextAlign? textAlign;
  final int? maxLines;
  final TextOverflow? overflow;
  final double? scaleFactor;

  const ResponsiveText(
    this.text, {
    Key? key,
    this.style,
    this.textAlign,
    this.maxLines,
    this.overflow,
    this.scaleFactor,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isMobile = ResponsiveHelper.isMobile(context);
    
    // Adjust font size based on screen size
    final adjustedStyle = (style ?? theme.textTheme.bodyMedium)?.copyWith(
      fontSize: _getAdjustedFontSize(context, style?.fontSize),
    );

    return Text(
      text,
      style: adjustedStyle,
      textAlign: textAlign,
      maxLines: maxLines,
      overflow: overflow,
      textScaleFactor: scaleFactor ?? (isMobile ? 1.0 : 0.95),
    );
  }

  double? _getAdjustedFontSize(BuildContext context, double? originalSize) {
    if (originalSize == null) return null;
    
    final screenWidth = MediaQuery.of(context).size.width;
    
    if (screenWidth < ResponsiveBreakpoints.mobile) {
      return originalSize * 0.9; // Smaller on very small screens
    } else if (screenWidth > ResponsiveBreakpoints.desktopLarge) {
      return originalSize * 1.1; // Larger on large screens
    }
    
    return originalSize;
  }
}
```

### **Responsive Theme Extension**
```dart
extension ResponsiveTheme on ThemeData {
  TextTheme get responsiveTextTheme {
    return textTheme.copyWith(
      displayLarge: textTheme.displayLarge?.copyWith(
        fontSize: _scaleFont(textTheme.displayLarge?.fontSize),
      ),
      displayMedium: textTheme.displayMedium?.copyWith(
        fontSize: _scaleFont(textTheme.displayMedium?.fontSize),
      ),
      headlineLarge: textTheme.headlineLarge?.copyWith(
        fontSize: _scaleFont(textTheme.headlineLarge?.fontSize),
      ),
      // Continue for all text styles...
    );
  }

  double? _scaleFont(double? fontSize) {
    if (fontSize == null) return null;
    // Implement responsive font scaling logic
    return fontSize;
  }
}
```

---

## Input and Touch Targets

### **Touch-Optimized Form Fields**
```dart
class ResponsiveTextField extends StatelessWidget {
  final String? labelText;
  final String? hintText;
  final TextEditingController? controller;
  final ValueChanged<String>? onChanged;
  final bool obscureText;
  final TextInputType? keyboardType;
  final Widget? prefixIcon;
  final Widget? suffixIcon;

  const ResponsiveTextField({
    Key? key,
    this.labelText,
    this.hintText,
    this.controller,
    this.onChanged,
    this.obscureText = false,
    this.keyboardType,
    this.prefixIcon,
    this.suffixIcon,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final isMobile = ResponsiveHelper.isMobile(context);
    
    return TextField(
      controller: controller,
      onChanged: onChanged,
      obscureText: obscureText,
      keyboardType: keyboardType,
      style: TextStyle(
        fontSize: isMobile ? 16 : 14, // Prevent zoom on iOS
      ),
      decoration: InputDecoration(
        labelText: labelText,
        hintText: hintText,
        prefixIcon: prefixIcon,
        suffixIcon: suffixIcon,
        contentPadding: EdgeInsets.symmetric(
          horizontal: 16,
          vertical: isMobile ? 16 : 12,
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
        ),
      ),
    );
  }
}
```

### **Adaptive Touch Targets**
```dart
class AdaptiveTouchTarget extends StatelessWidget {
  final Widget child;
  final VoidCallback? onTap;
  final double? minSize;

  const AdaptiveTouchTarget({
    Key? key,
    required this.child,
    this.onTap,
    this.minSize,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final isMobile = ResponsiveHelper.isMobile(context);
    final targetSize = minSize ?? (isMobile 
      ? ResponsiveBreakpoints.recommendedTouchTarget
      : 32);

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Container(
        constraints: BoxConstraints(
          minWidth: targetSize,
          minHeight: targetSize,
        ),
        alignment: Alignment.center,
        child: child,
      ),
    );
  }
}
```

---

## Performance Considerations

### **Responsive Image Loading**
```dart
class ResponsiveImage extends StatelessWidget {
  final String assetPath;
  final String? semanticLabel;
  final BoxFit? fit;
  final double? width;
  final double? height;

  const ResponsiveImage({
    Key? key,
    required this.assetPath,
    this.semanticLabel,
    this.fit,
    this.width,
    this.height,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final devicePixelRatio = MediaQuery.of(context).devicePixelRatio;
        final screenWidth = MediaQuery.of(context).size.width;
        
        // Choose appropriate image resolution
        String imagePath = assetPath;
        if (devicePixelRatio > 2.0 && screenWidth > ResponsiveBreakpoints.desktop) {
          imagePath = assetPath.replaceAll('.png', '@3x.png');
        } else if (devicePixelRatio > 1.5) {
          imagePath = assetPath.replaceAll('.png', '@2x.png');
        }

        return Image.asset(
          imagePath,
          semanticLabel: semanticLabel,
          fit: fit,
          width: width,
          height: height,
          frameBuilder: (context, child, frame, wasSynchronouslyLoaded) {
            if (wasSynchronouslyLoaded) return child;
            
            return AnimatedOpacity(
              opacity: frame == null ? 0 : 1,
              duration: const Duration(milliseconds: 300),
              curve: Curves.easeOut,
              child: child,
            );
          },
        );
      },
    );
  }
}
```

### **Conditional Rendering**
```dart
class ConditionalBuilder extends StatelessWidget {
  final bool Function(BuildContext) condition;
  final Widget Function(BuildContext) builder;
  final Widget Function(BuildContext)? fallback;

  const ConditionalBuilder({
    Key? key,
    required this.condition,
    required this.builder,
    this.fallback,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    if (condition(context)) {
      return builder(context);
    }
    
    return fallback?.call(context) ?? const SizedBox.shrink();
  }
}

// Usage example
ConditionalBuilder(
  condition: (context) => ResponsiveHelper.isDesktop(context),
  builder: (context) => DesktopSidebar(),
  fallback: (context) => MobileDrawer(),
)
```

This comprehensive responsive design system ensures that the Flutter D&D AI Campaign Management System provides optimal user experiences across all screen sizes while maintaining consistent functionality and visual hierarchy. The patterns prioritize touch accessibility on mobile devices while taking advantage of larger screen real estate on tablets and desktops.
