/**
 * Design Tokens - Main Export
 * D&D AI Campaign Manager
 * 
 * Central hub for all design tokens with CSS custom properties generation
 * and TypeScript type definitions
 */

import colorTokens, { colors, lightTheme, darkTheme, colorUtils } from './colors'
import typographyTokens, { 
  fontFamilies, 
  fontWeights, 
  fontSizes, 
  lineHeights, 
  letterSpacing, 
  typography, 
  dndTypography,
  typographyUtils 
} from './typography'
import spacingTokens, { 
  spacing, 
  semanticSpacing, 
  insets, 
  gaps, 
  borderRadius, 
  dndSpacing,
  responsiveSpacing,
  spacingUtils 
} from './spacing'
import animationTokens, { 
  durations, 
  cssDurations, 
  easings, 
  animations, 
  dndAnimations, 
  transitions,
  animationUtils 
} from './animation'

// Re-export all tokens
export {
  // Colors
  colors,
  lightTheme,
  darkTheme,
  colorUtils,

  // Typography
  fontFamilies,
  fontWeights,
  fontSizes,
  lineHeights,
  letterSpacing,
  typography,
  dndTypography,
  typographyUtils,

  // Spacing
  spacing,
  semanticSpacing,
  insets,
  gaps,
  borderRadius,
  dndSpacing,
  responsiveSpacing,
  spacingUtils,

  // Animation
  durations,
  cssDurations,
  easings,
  animations,
  dndAnimations,
  transitions,
  animationUtils
}

// Combined design tokens object
export const designTokens = {
  colors: colorTokens,
  typography: typographyTokens,
  spacing: spacingTokens,
  animation: animationTokens
} as const

// CSS Custom Properties Generator
export const generateCSSCustomProperties = (theme: 'light' | 'dark' = 'light') => {
  const themeColors = theme === 'light' ? lightTheme : darkTheme
  
  const cssVars: Record<string, string> = {}

  // Color variables
  Object.entries(themeColors).forEach(([key, value]) => {
    cssVars[`--color-${key}`] = value
  })

  // Color palette variables
  Object.entries(colors).forEach(([colorFamily, colorValues]) => {
    if (typeof colorValues === 'object' && colorValues !== null) {
      Object.entries(colorValues).forEach(([shade, value]) => {
        cssVars[`--color-${colorFamily}-${shade}`] = value
      })
    }
  })

  // Typography variables
  Object.entries(fontSizes).forEach(([key, value]) => {
    cssVars[`--font-size-${key}`] = value
  })

  Object.entries(fontWeights).forEach(([key, value]) => {
    cssVars[`--font-weight-${key}`] = value.toString()
  })

  Object.entries(lineHeights).forEach(([key, value]) => {
    cssVars[`--line-height-${key}`] = value.toString()
  })

  Object.entries(letterSpacing).forEach(([key, value]) => {
    cssVars[`--letter-spacing-${key}`] = value
  })

  // Font family variables
  Object.entries(fontFamilies).forEach(([key, value]) => {
    cssVars[`--font-family-${key}`] = value.join(', ')
  })

  // Spacing variables
  Object.entries(spacing).forEach(([key, value]) => {
    cssVars[`--spacing-${key}`] = value
  })

  // Border radius variables
  Object.entries(borderRadius).forEach(([key, value]) => {
    cssVars[`--border-radius-${key}`] = value
  })

  // Animation variables
  Object.entries(cssDurations).forEach(([key, value]) => {
    cssVars[`--duration-${key}`] = value
  })

  Object.entries(easings).forEach(([key, value]) => {
    cssVars[`--easing-${key}`] = value
  })

  return cssVars
}

// Generate CSS string for custom properties
export const generateCSSString = (theme: 'light' | 'dark' = 'light'): string => {
  const cssVars = generateCSSCustomProperties(theme)
  const cssEntries = Object.entries(cssVars)
    .map(([key, value]) => `  ${key}: ${value};`)
    .join('\n')
  
  return `:root {\n${cssEntries}\n}`
}

// TypeScript type definitions for design tokens
export type ColorToken = keyof typeof colors
export type ColorShade = keyof typeof colors.primary
export type ThemeColor = keyof typeof lightTheme
export type FontFamily = keyof typeof fontFamilies
export type FontWeight = keyof typeof fontWeights
export type FontSize = keyof typeof fontSizes
export type LineHeight = keyof typeof lineHeights
export type LetterSpacing = keyof typeof letterSpacing
export type SpacingToken = keyof typeof spacing
export type SemanticSpacing = keyof typeof semanticSpacing
export type BorderRadius = keyof typeof borderRadius
export type Duration = keyof typeof durations
export type Easing = keyof typeof easings
export type TypographyStyle = keyof typeof typography
export type DNDTypographyStyle = keyof typeof dndTypography

// Design token theme interface
export interface DesignTokenTheme {
  colors: typeof lightTheme | typeof darkTheme
  typography: {
    fontFamilies: typeof fontFamilies
    fontWeights: typeof fontWeights
    fontSizes: typeof fontSizes
    lineHeights: typeof lineHeights
    letterSpacing: typeof letterSpacing
  }
  spacing: typeof spacing
  animation: {
    durations: typeof cssDurations
    easings: typeof easings
  }
}

// Theme configuration
export const createTheme = (mode: 'light' | 'dark' = 'light'): DesignTokenTheme => ({
  colors: mode === 'light' ? lightTheme : darkTheme,
  typography: {
    fontFamilies,
    fontWeights,
    fontSizes,
    lineHeights,
    letterSpacing
  },
  spacing,
  animation: {
    durations: cssDurations,
    easings
  }
})

// Utility functions for using design tokens
export const tokenUtils = {
  /**
   * Get color token value
   */
  getColor: (token: string, theme: 'light' | 'dark' = 'light'): string => {
    const themeColors = theme === 'light' ? lightTheme : darkTheme
    return (themeColors as any)[token] || token
  },

  /**
   * Get spacing token value
   */
  getSpacing: (token: keyof typeof spacing): string => {
    return spacing[token]
  },

  /**
   * Get typography style
   */
  getTypography: (category: keyof typeof typography, size: string): any => {
    return (typography[category] as any)[size]
  },

  /**
   * Get animation duration
   */
  getDuration: (speed: keyof typeof cssDurations): string => {
    return cssDurations[speed]
  },

  /**
   * Get easing function
   */
  getEasing: (type: keyof typeof easings): string => {
    return easings[type]
  },

  /**
   * Create CSS custom property reference
   */
  cssVar: (property: string): string => {
    return `var(--${property})`
  },

  /**
   * Create CSS custom property with fallback
   */
  cssVarWithFallback: (property: string, fallback: string): string => {
    return `var(--${property}, ${fallback})`
  }
}

// Default export
export default designTokens
