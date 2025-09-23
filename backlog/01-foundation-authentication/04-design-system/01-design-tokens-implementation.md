# Design Tokens Implementation

## Story
**As a** developer  
**I want** a comprehensive design token system with colors, typography, and spacing  
**So that** I can maintain visual consistency across the entire application

## Acceptance Criteria
- [ ] Color palette defined with D&D-themed colors and semantic variants
- [ ] Typography scale implemented with proper font families
- [ ] Spacing system based on 4px grid implemented
- [ ] Animation and motion tokens defined
- [ ] CSS custom properties generated for all tokens
- [ ] Dark mode support with proper color variations
- [ ] TypeScript types for all design tokens
- [ ] Documentation for design token usage

## Technical References
- **Design System**: Cross-Platform Design System - Design Tokens
- **UI Specification**: Vue.js Web Application - Design System
- **Playbook Reference**: Phase 1, Week 2, Day 4-5: Design System Implementation
- **Color Requirements**: WCAG 2.1 AA contrast compliance

## Implementation Details

### Color Token Structure
```typescript
// design-system/tokens/colors.ts
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
} as const
```

### Typography Tokens
```typescript
// design-system/tokens/typography.ts
export const typography = {
  // Font Families
  fonts: {
    primary: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    heading: '"Cinzel", serif', // D&D fantasy font
    mono: '"JetBrains Mono", "Consolas", monospace',
  },
  
  // Font Sizes (rem values)
  sizes: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
    '5xl': '3rem',    // 48px
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
} as const
```

### Spacing Tokens
```typescript
// design-system/tokens/spacing.ts
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
} as const
```

## AI Prompts for Implementation

### Primary Prompt
```
Create a comprehensive design token system for a D&D-themed web application using TypeScript. Include color palette with primary (D&D blue), secondary (D&D gold), fantasy-themed colors, semantic colors, and neutral grays. Define typography scale with font families, sizes, weights, and line heights. Create spacing system based on 4px grid. Generate CSS custom properties and TypeScript types. Include dark mode support and WCAG 2.1 AA contrast compliance.
```

### Secondary Prompts
```
Generate CSS custom properties from TypeScript design tokens with proper naming conventions and dark mode variants. Include color, typography, spacing, and animation tokens.

Create TypeScript utility types and helper functions for design token usage with proper type safety and IntelliSense support.

Generate Tailwind CSS configuration that uses design tokens as the foundation for utility classes with proper color, spacing, and typography scales.
```

### CSS Custom Properties Generation
```scss
// assets/styles/design-tokens.scss
:root {
  // Color tokens
  --color-primary-50: #{colors.primary.50};
  --color-primary-500: #{colors.primary.500};
  --color-primary-900: #{colors.primary.900};
  
  --color-secondary-50: #{colors.secondary.50};
  --color-secondary-500: #{colors.secondary.500};
  --color-secondary-900: #{colors.secondary.900};
  
  // Typography tokens
  --font-family-primary: #{typography.fonts.primary};
  --font-family-heading: #{typography.fonts.heading};
  --font-family-mono: #{typography.fonts.mono};
  
  --font-size-xs: #{typography.sizes.xs};
  --font-size-sm: #{typography.sizes.sm};
  --font-size-base: #{typography.sizes.base};
  --font-size-lg: #{typography.sizes.lg};
  
  // Spacing tokens
  --spacing-1: #{spacing[1]}px;
  --spacing-2: #{spacing[2]}px;
  --spacing-4: #{spacing[4]}px;
  --spacing-8: #{spacing[8]}px;
  --spacing-16: #{spacing[16]}px;
  
  // Animation tokens
  --duration-fast: 150ms;
  --duration-normal: 250ms;
  --duration-slow: 350ms;
  
  --easing-ease-out: ease-out;
  --easing-ease-in-out: ease-in-out;
}

// Dark mode overrides
[data-theme="dark"] {
  --color-neutral-0: #{colors.neutral[950]};
  --color-neutral-50: #{colors.neutral[900]};
  --color-neutral-100: #{colors.neutral[800]};
  // ... other dark mode overrides
}
```

### Tailwind Configuration
```javascript
// tailwind.config.js
import { colors, typography, spacing } from './design-system/tokens'

export default {
  content: [
    "./components/**/*.{js,vue,ts}",
    "./layouts/**/*.vue",
    "./pages/**/*.vue",
    "./plugins/**/*.{js,ts}",
    "./nuxt.config.{js,ts}",
    "./app.vue"
  ],
  theme: {
    extend: {
      colors: {
        primary: colors.primary,
        secondary: colors.secondary,
        fantasy: colors.fantasy,
        neutral: colors.neutral,
        success: colors.success,
        error: colors.error,
        warning: colors.warning,
      },
      fontFamily: {
        sans: [typography.fonts.primary],
        serif: [typography.fonts.heading],
        mono: [typography.fonts.mono],
      },
      fontSize: typography.sizes,
      fontWeight: typography.weights,
      lineHeight: typography.lineHeights,
      spacing: spacing,
    },
  },
  plugins: [],
}
```

### TypeScript Type Definitions
```typescript
// types/design-tokens.ts
export type ColorScale = {
  50: string
  100: string
  200: string
  300: string
  400: string
  500: string
  600: string
  700: string
  800: string
  900: string
}

export type SemanticColor = {
  50: string
  500: string
  900: string
}

export type FontSize = keyof typeof typography.sizes
export type FontWeight = keyof typeof typography.weights
export type Spacing = keyof typeof spacing
export type ColorToken = keyof typeof colors
```

## Animation and Motion Tokens
```typescript
// design-system/tokens/motion.ts
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
} as const
```

## Definition of Done
- [ ] All design tokens are properly defined in TypeScript
- [ ] CSS custom properties are generated correctly
- [ ] Tailwind CSS configuration uses design tokens
- [ ] Dark mode color variants work correctly
- [ ] Typography scale provides good visual hierarchy
- [ ] Spacing system maintains consistent rhythm
- [ ] Color combinations meet WCAG 2.1 AA contrast requirements
- [ ] TypeScript types provide proper IntelliSense
- [ ] Documentation explains token usage and conventions

## Dependencies
- **Depends on**: 01-nuxt-project-setup.md
- **Blocks**: All UI component implementations

## Estimated Effort
**4 hours** - Design token definition and implementation
