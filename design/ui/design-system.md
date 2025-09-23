# Cross-Platform Design System - D&D AI Campaign Management System

## Overview
This document defines a comprehensive cross-platform design system that works seamlessly across Vue.js web applications and React Native mobile applications, ensuring consistent user experiences while leveraging platform-specific capabilities.

## Design Philosophy

### **Core Principles**
1. **Platform-Adaptive**: Respect native platform conventions while maintaining brand consistency
2. **Accessibility-First**: WCAG 2.1 AA compliance across all platforms
3. **D&D Immersion**: Fantasy-themed aesthetics with modern usability
4. **Liquid Glass Effects**: Modern glassmorphism for premium feel
5. **Performance-Optimized**: Lightweight and efficient across all platforms

### **Cross-Platform Strategy**
The design system uses shared design tokens that are implemented differently on each platform while maintaining visual consistency:

- **Vue.js Web**: CSS variables, SCSS mixins, Tailwind utilities
- **React Native Mobile**: JavaScript objects, StyleSheet API, native components
- **Shared Tokens**: Colors, typography, spacing, motion curves

## Design Tokens

### **Color Palette**
```typescript
// Shared color definitions
export const colors = {
  // Primary Brand Colors (D&D Blue)
  primary: {
    50: '#f0f4ff',
    100: '#e0eaff',
    200: '#c7d9ff',
    300: '#a5c0ff',
    400: '#8199ff',
    500: '#6366f1', // Main brand color
    600: '#4f46e5',
    700: '#4338ca',
    800: '#3730a3',
    900: '#312e81',
  },
  
  // Secondary Colors (D&D Gold)
  secondary: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b', // D&D gold
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },
  
  // Semantic Colors
  success: {
    50: '#ecfdf5',
    500: '#10b981',
    900: '#064e3b',
  },
  
  error: {
    50: '#fef2f2',
    500: '#ef4444',
    900: '#7f1d1d',
  },
  
  warning: {
    50: '#fffbeb',
    500: '#f59e0b',
    900: '#78350f',
  },
  
  // Neutral Colors
  neutral: {
    0: '#ffffff',
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
    950: '#0a0a0a',
  },
  
  // D&D Themed Colors
  fantasy: {
    dragon: '#8b0000',      // Deep red
    magic: '#4b0082',       // Indigo
    nature: '#228b22',      // Forest green
    divine: '#ffd700',      // Gold
    arcane: '#9370db',      // Medium purple
    shadow: '#2f2f2f',      // Dark gray
    parchment: '#f5f5dc',   // Beige
  },
};
```

### **Typography Scale**
```typescript
// Shared typography system
export const typography = {
  // Font Families
  fonts: {
    // Web fonts (Vue.js)
    web: {
      primary: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      heading: '"Cinzel", serif', // D&D fantasy font
      mono: '"JetBrains Mono", "Consolas", monospace',
    },
    
    // Native fonts (React Native)
    native: {
      ios: {
        primary: 'SF Pro Text',
        heading: 'SF Pro Display',
        mono: 'SF Mono',
      },
      android: {
        primary: 'Roboto',
        heading: 'Roboto',
        mono: 'Roboto Mono',
      },
    },
  },
  
  // Font Sizes
  sizes: {
    xs: { web: '0.75rem', native: 12 },
    sm: { web: '0.875rem', native: 14 },
    base: { web: '1rem', native: 16 },
    lg: { web: '1.125rem', native: 18 },
    xl: { web: '1.25rem', native: 20 },
    '2xl': { web: '1.5rem', native: 24 },
    '3xl': { web: '1.875rem', native: 30 },
    '4xl': { web: '2.25rem', native: 36 },
    '5xl': { web: '3rem', native: 48 },
  },
  
  // Font Weights
  weights: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },
  
  // Line Heights
  lineHeights: {
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },
};
```

### **Spacing System**
```typescript
// Shared spacing scale (4px base unit)
export const spacing = {
  0: 0,
  1: 4,     // 4px
  2: 8,     // 8px
  3: 12,    // 12px
  4: 16,    // 16px
  5: 20,    // 20px
  6: 24,    // 24px
  8: 32,    // 32px
  10: 40,   // 40px
  11: 44,   // 44px (minimum touch target)
  12: 48,   // 48px
  16: 64,   // 64px
  20: 80,   // 80px
  24: 96,   // 96px
  32: 128,  // 128px
  40: 160,  // 160px
  48: 192,  // 192px
  64: 256,  // 256px
  80: 320,  // 320px
  96: 384,  // 384px
};
```

### **Animation & Motion**
```typescript
// Shared animation system
export const motion = {
  // Duration (milliseconds)
  duration: {
    fast: 150,
    normal: 250,
    slow: 350,
    slower: 500,
  },
  
  // Easing curves
  easing: {
    linear: 'linear',
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
    
    // Custom D&D themed curves
    magical: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)', // Bounce effect
    heroic: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',    // Smooth and confident
    dramatic: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)', // Dramatic entrance
  },
};
```

## Platform Implementations

### **Vue.js Web Implementation**
```scss
// assets/styles/design-tokens.scss
:root {
  // Color tokens
  --color-primary-50: #f0f4ff;
  --color-primary-500: #6366f1;
  --color-primary-900: #312e81;
  
  // Typography tokens
  --font-family-primary: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --font-family-heading: "Cinzel", serif;
  
  // Spacing tokens
  --spacing-1: 4px;
  --spacing-4: 16px;
  --spacing-8: 32px;
  
  // Motion tokens
  --duration-fast: 150ms;
  --duration-normal: 250ms;
  --easing-ease-out: ease-out;
}

// Liquid glass effect mixin
@mixin liquid-glass($intensity: 0.1, $blur: 20px) {
  backdrop-filter: blur($blur) saturate(180%);
  background: rgba(255, 255, 255, $intensity);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

// Responsive breakpoint mixin
@mixin responsive($breakpoint) {
  @if $breakpoint == mobile {
    @media (max-width: 767px) { @content; }
  }
  @if $breakpoint == tablet {
    @media (min-width: 768px) and (max-width: 1023px) { @content; }
  }
  @if $breakpoint == desktop {
    @media (min-width: 1024px) { @content; }
  }
}
```

### **React Native Implementation**
```typescript
// design-system/tokens.ts
export const tokens = {
  colors: {
    primary: {
      50: '#f0f4ff',
      500: '#6366f1',
      900: '#312e81',
    },
    secondary: {
      50: '#fffbeb',
      500: '#f59e0b',
      900: '#78350f',
    },
    neutral: {
      0: '#ffffff',
      500: '#6b7280',
      900: '#111827',
    },
  },
  
  spacing: {
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    5: 20,
    6: 24,
    8: 32,
    11: 44, // Minimum touch target
  },
  
  typography: {
    sizes: {
      sm: 14,
      base: 16,
      lg: 18,
      xl: 20,
    },
    weights: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
  },
  
  motion: {
    duration: {
      fast: 150,
      normal: 250,
      slow: 350,
    },
  },
};
```

## Core Components

### **Vue.js Glass Button Component**
```vue
<template>
  <button
    :class="[
      'glass-button',
      `glass-button--${variant}`,
      `glass-button--${size}`,
      { 'glass-button--disabled': disabled }
    ]"
    :disabled="disabled"
    @click="$emit('click', $event)"
  >
    <v-icon v-if="prependIcon" :icon="prependIcon" />
    <span class="glass-button__text">
      <slot />
    </span>
    <v-icon v-if="appendIcon" :icon="appendIcon" />
  </button>
</template>

<script setup lang="ts">
interface Props {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  prependIcon?: string;
  appendIcon?: string;
}

withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  disabled: false,
});

defineEmits<{
  click: [event: MouseEvent];
}>();
</script>

<style scoped lang="scss">
.glass-button {
  @include liquid-glass(0.1, 20px);
  
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-2);
  
  font-family: var(--font-family-primary);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--duration-fast) var(--easing-ease-out);
  
  &:hover:not(&--disabled) {
    transform: translateY(-2px);
    box-shadow: 
      0 12px 40px rgba(0, 0, 0, 0.15),
      inset 0 1px 0 rgba(255, 255, 255, 0.3);
  }
  
  // Variants
  &--primary {
    background: linear-gradient(135deg, 
      rgba(99, 102, 241, 0.2) 0%, 
      rgba(79, 70, 229, 0.2) 100%);
    color: var(--color-primary-500);
    border-color: rgba(99, 102, 241, 0.3);
  }
  
  // Sizes
  &--md {
    padding: var(--spacing-3) var(--spacing-6);
    font-size: var(--font-size-base);
    min-height: var(--spacing-11); // 44px minimum touch target
  }
  
  // Disabled state
  &--disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}
</style>
```

### **React Native Glass Button Component**
```typescript
// components/ui/GlassButton.tsx
import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { tokens } from '../../design-system/tokens';

interface GlassButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
}

export const GlassButton: React.FC<GlassButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  onPress,
  style,
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        styles[`button${variant.charAt(0).toUpperCase() + variant.slice(1)}`],
        styles[`button${size.charAt(0).toUpperCase() + size.slice(1)}`],
        disabled && styles.buttonDisabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      accessible={true}
      accessibilityRole="button"
    >
      <BlurView
        intensity={80}
        tint="light"
        style={styles.blurContainer}
      >
        <Text style={[
          styles.text,
          styles[`text${variant.charAt(0).toUpperCase() + variant.slice(1)}`],
          styles[`text${size.charAt(0).toUpperCase() + size.slice(1)}`],
        ]}>
          {children}
        </Text>
      </BlurView>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  
  blurContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Variants
  buttonPrimary: {
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  
  // Sizes
  buttonMd: {
    paddingHorizontal: tokens.spacing[6],
    paddingVertical: tokens.spacing[3],
    minHeight: tokens.spacing[11], // 44px minimum touch target
  },
  
  // Text styles
  text: {
    fontWeight: tokens.typography.weights.semibold,
    textAlign: 'center',
  },
  
  textPrimary: {
    color: tokens.colors.primary[500],
  },
  
  textMd: {
    fontSize: tokens.typography.sizes.base,
  },
  
  // Disabled state
  buttonDisabled: {
    opacity: 0.5,
  },
});
```

## Responsive Breakpoints

### **Shared Breakpoint System**
```typescript
// Shared responsive breakpoints
export const breakpoints = {
  mobile: 0,      // 0px and up
  tablet: 768,    // 768px and up
  desktop: 1024,  // 1024px and up
  wide: 1440,     // 1440px and up
};

// Vue.js implementation
export const useBreakpoints = () => {
  const { width } = useWindowSize();
  
  const isMobile = computed(() => width.value < breakpoints.tablet);
  const isTablet = computed(() => 
    width.value >= breakpoints.tablet && width.value < breakpoints.desktop
  );
  const isDesktop = computed(() => width.value >= breakpoints.desktop);
  
  return { isMobile, isTablet, isDesktop };
};

// React Native implementation
export const useBreakpoints = () => {
  const { width } = useWindowDimensions();
  
  const isMobile = width < breakpoints.tablet;
  const isTablet = width >= breakpoints.tablet && width < breakpoints.desktop;
  const isDesktop = width >= breakpoints.desktop;
  
  return { isMobile, isTablet, isDesktop };
};
```

## Accessibility Standards

### **WCAG 2.1 AA Compliance**
```typescript
// Shared accessibility utilities
export const a11y = {
  // Color contrast ratios
  contrast: {
    normal: 4.5,  // AA standard for normal text
    large: 3,     // AA standard for large text
    enhanced: 7,  // AAA standard
  },
  
  // Minimum touch targets
  touchTarget: {
    minimum: 44,  // 44x44px minimum
    recommended: 48, // 48x48px recommended
  },
  
  // Focus indicators
  focus: {
    width: 2,
    color: tokens.colors.primary[500],
    offset: 2,
  },
};
```

### **Platform-Specific Accessibility**

**Vue.js Semantic HTML & ARIA:**
```vue
<button
  :class="buttonClasses"
  :aria-label="ariaLabel"
  :aria-describedby="describedBy"
  :disabled="disabled"
  type="button"
  @click="handleClick"
>
  <slot />
</button>
```

**React Native Accessibility:**
```typescript
<TouchableOpacity
  accessible={true}
  accessibilityRole="button"
  accessibilityLabel={accessibilityLabel}
  accessibilityHint={accessibilityHint}
  accessibilityState={{ disabled }}
  onPress={onPress}
>
  {children}
</TouchableOpacity>
```

This cross-platform design system ensures consistent, accessible, and beautiful user experiences across both Vue.js web and React Native mobile applications while respecting platform conventions and leveraging modern design patterns.
