/**
 * Design Tokens - Colors
 * D&D AI Campaign Manager
 * 
 * Comprehensive color system with D&D theming and semantic variants
 * WCAG 2.1 AA compliant contrast ratios
 */

export const colors = {
  // Primary Brand Colors (D&D Mystical Blue)
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
    950: '#1e1b4b'
  },

  // Secondary Colors (D&D Legendary Gold)
  secondary: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b', // Main secondary color
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
    950: '#451a03'
  },

  // D&D Themed Colors
  dnd: {
    // Dragon Red
    red: {
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      300: '#fca5a5',
      400: '#f87171',
      500: '#8b0000', // D&D Classic Red
      600: '#dc2626',
      700: '#b91c1c',
      800: '#991b1b',
      900: '#7f1d1d',
      950: '#450a0a'
    },

    // Elven Green
    green: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e',
      600: '#16a34a',
      700: '#15803d',
      800: '#166534',
      900: '#14532d',
      950: '#052e16'
    },

    // Dwarven Bronze
    bronze: {
      50: '#fdf8f0',
      100: '#faebd7',
      200: '#f4d4a7',
      300: '#ecb176',
      400: '#e08d3c',
      500: '#cd7c32', // Main bronze
      600: '#b8651f',
      700: '#9a4f1a',
      800: '#7d3f1a',
      900: '#663318',
      950: '#381a0b'
    },

    // Arcane Purple
    purple: {
      50: '#faf5ff',
      100: '#f3e8ff',
      200: '#e9d5ff',
      300: '#d8b4fe',
      400: '#c084fc',
      500: '#a855f7',
      600: '#9333ea',
      700: '#7c3aed',
      800: '#6b21a8',
      900: '#581c87',
      950: '#3b0764'
    }
  },

  // Semantic Colors
  semantic: {
    // Success (Nature/Life)
    success: {
      50: '#ecfdf5',
      100: '#d1fae5',
      200: '#a7f3d0',
      300: '#6ee7b7',
      400: '#34d399',
      500: '#10b981',
      600: '#059669',
      700: '#047857',
      800: '#065f46',
      900: '#064e3b',
      950: '#022c22'
    },

    // Warning (Fire/Caution)
    warning: {
      50: '#fffbeb',
      100: '#fef3c7',
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24',
      500: '#f59e0b',
      600: '#d97706',
      700: '#b45309',
      800: '#92400e',
      900: '#78350f',
      950: '#451a03'
    },

    // Error (Danger/Death)
    error: {
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      300: '#fca5a5',
      400: '#f87171',
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c',
      800: '#991b1b',
      900: '#7f1d1d',
      950: '#450a0a'
    },

    // Info (Magic/Knowledge)
    info: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
      950: '#172554'
    }
  },

  // Neutral Grays
  neutral: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
    950: '#0a0a0a'
  },

  // Special Colors
  special: {
    // Transparent
    transparent: 'transparent',
    current: 'currentColor',

    // White and Black
    white: '#ffffff',
    black: '#000000',

    // D&D Dice Colors
    dice: {
      d4: '#ff6b6b',    // Red
      d6: '#4ecdc4',    // Teal
      d8: '#45b7d1',    // Blue
      d10: '#96ceb4',   // Green
      d12: '#feca57',   // Yellow
      d20: '#ff9ff3'    // Pink
    },

    // Rarity Colors (D&D Item Rarities)
    rarity: {
      common: '#9e9e9e',     // Gray
      uncommon: '#4caf50',   // Green
      rare: '#2196f3',       // Blue
      epic: '#9c27b0',       // Purple
      legendary: '#ff9800',  // Orange
      artifact: '#f44336'    // Red
    }
  }
} as const

// Light Theme Color Mappings
export const lightTheme = {
  // Surface colors
  background: colors.neutral[50],
  surface: colors.special.white,
  surfaceVariant: colors.neutral[100],
  surfaceContainer: colors.neutral[50],
  surfaceContainerHigh: colors.neutral[100],
  surfaceContainerLow: colors.neutral[50],

  // Content colors
  onBackground: colors.neutral[900],
  onSurface: colors.neutral[900],
  onSurfaceVariant: colors.neutral[600],
  onPrimary: colors.special.white,
  onSecondary: colors.neutral[900],

  // Primary colors
  primary: colors.primary[600],
  primaryContainer: colors.primary[100],
  onPrimaryContainer: colors.primary[900],

  // Secondary colors
  secondary: colors.secondary[600],
  secondaryContainer: colors.secondary[100],
  onSecondaryContainer: colors.secondary[900],

  // Semantic colors
  success: colors.semantic.success[600],
  onSuccess: colors.special.white,
  successContainer: colors.semantic.success[100],
  onSuccessContainer: colors.semantic.success[900],

  warning: colors.semantic.warning[600],
  onWarning: colors.special.white,
  warningContainer: colors.semantic.warning[100],
  onWarningContainer: colors.semantic.warning[900],

  error: colors.semantic.error[600],
  onError: colors.special.white,
  errorContainer: colors.semantic.error[100],
  onErrorContainer: colors.semantic.error[900],

  info: colors.semantic.info[600],
  onInfo: colors.special.white,
  infoContainer: colors.semantic.info[100],
  onInfoContainer: colors.semantic.info[900],

  // Border and outline
  outline: colors.neutral[300],
  outlineVariant: colors.neutral[200],
  border: colors.neutral[200],

  // Inverse colors
  inverseSurface: colors.neutral[900],
  onInverseSurface: colors.neutral[100],
  inversePrimary: colors.primary[300]
} as const

// Dark Theme Color Mappings
export const darkTheme = {
  // Surface colors
  background: colors.neutral[950],
  surface: colors.neutral[900],
  surfaceVariant: colors.neutral[800],
  surfaceContainer: colors.neutral[900],
  surfaceContainerHigh: colors.neutral[800],
  surfaceContainerLow: colors.neutral[950],

  // Content colors
  onBackground: colors.neutral[100],
  onSurface: colors.neutral[100],
  onSurfaceVariant: colors.neutral[400],
  onPrimary: colors.neutral[900],
  onSecondary: colors.neutral[900],

  // Primary colors
  primary: colors.primary[400],
  primaryContainer: colors.primary[800],
  onPrimaryContainer: colors.primary[100],

  // Secondary colors
  secondary: colors.secondary[400],
  secondaryContainer: colors.secondary[800],
  onSecondaryContainer: colors.secondary[100],

  // Semantic colors
  success: colors.semantic.success[400],
  onSuccess: colors.neutral[900],
  successContainer: colors.semantic.success[800],
  onSuccessContainer: colors.semantic.success[100],

  warning: colors.semantic.warning[400],
  onWarning: colors.neutral[900],
  warningContainer: colors.semantic.warning[800],
  onWarningContainer: colors.semantic.warning[100],

  error: colors.semantic.error[400],
  onError: colors.neutral[900],
  errorContainer: colors.semantic.error[800],
  onErrorContainer: colors.semantic.error[100],

  info: colors.semantic.info[400],
  onInfo: colors.neutral[900],
  infoContainer: colors.semantic.info[800],
  onInfoContainer: colors.semantic.info[100],

  // Border and outline
  outline: colors.neutral[600],
  outlineVariant: colors.neutral[700],
  border: colors.neutral[700],

  // Inverse colors
  inverseSurface: colors.neutral[100],
  onInverseSurface: colors.neutral[900],
  inversePrimary: colors.primary[600]
} as const

// Color utility functions
export const colorUtils = {
  /**
   * Get color with opacity
   */
  withOpacity: (color: string, opacity: number): string => {
    const hex = color.replace('#', '')
    const r = parseInt(hex.substring(0, 2), 16)
    const g = parseInt(hex.substring(2, 4), 16)
    const b = parseInt(hex.substring(4, 6), 16)
    return `rgba(${r}, ${g}, ${b}, ${opacity})`
  },

  /**
   * Get contrast color (black or white) for given background
   */
  getContrastColor: (backgroundColor: string): string => {
    // Simple luminance calculation
    const hex = backgroundColor.replace('#', '')
    const r = parseInt(hex.substring(0, 2), 16)
    const g = parseInt(hex.substring(2, 4), 16)
    const b = parseInt(hex.substring(4, 6), 16)
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    return luminance > 0.5 ? colors.special.black : colors.special.white
  },

  /**
   * Get D&D rarity color
   */
  getRarityColor: (rarity: keyof typeof colors.special.rarity): string => {
    return colors.special.rarity[rarity]
  },

  /**
   * Get dice color by type
   */
  getDiceColor: (diceType: keyof typeof colors.special.dice): string => {
    return colors.special.dice[diceType]
  }
}

// Export all color tokens
export default {
  colors,
  lightTheme,
  darkTheme,
  colorUtils
}
