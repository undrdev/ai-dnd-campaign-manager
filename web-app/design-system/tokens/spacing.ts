/**
 * Design Tokens - Spacing
 * D&D AI Campaign Manager
 * 
 * Comprehensive spacing system based on 4px grid
 * Provides consistent spacing throughout the application
 */

// Base unit (4px grid system)
const baseUnit = 4

// Core spacing scale (in pixels, converted to rem)
export const spacing = {
  0: '0rem',                    // 0px
  px: '0.0625rem',             // 1px
  0.5: '0.125rem',             // 2px
  1: '0.25rem',                // 4px
  1.5: '0.375rem',             // 6px
  2: '0.5rem',                 // 8px
  2.5: '0.625rem',             // 10px
  3: '0.75rem',                // 12px
  3.5: '0.875rem',             // 14px
  4: '1rem',                   // 16px
  5: '1.25rem',                // 20px
  6: '1.5rem',                 // 24px
  7: '1.75rem',                // 28px
  8: '2rem',                   // 32px
  9: '2.25rem',                // 36px
  10: '2.5rem',                // 40px
  11: '2.75rem',               // 44px
  12: '3rem',                  // 48px
  14: '3.5rem',                // 56px
  16: '4rem',                  // 64px
  20: '5rem',                  // 80px
  24: '6rem',                  // 96px
  28: '7rem',                  // 112px
  32: '8rem',                  // 128px
  36: '9rem',                  // 144px
  40: '10rem',                 // 160px
  44: '11rem',                 // 176px
  48: '12rem',                 // 192px
  52: '13rem',                 // 208px
  56: '14rem',                 // 224px
  60: '15rem',                 // 240px
  64: '16rem',                 // 256px
  72: '18rem',                 // 288px
  80: '20rem',                 // 320px
  96: '24rem'                  // 384px
} as const

// Semantic spacing (for specific use cases)
export const semanticSpacing = {
  // Component internal spacing
  component: {
    xs: spacing[1],      // 4px
    sm: spacing[2],      // 8px
    md: spacing[4],      // 16px
    lg: spacing[6],      // 24px
    xl: spacing[8]       // 32px
  },

  // Layout spacing
  layout: {
    xs: spacing[4],      // 16px
    sm: spacing[6],      // 24px
    md: spacing[8],      // 32px
    lg: spacing[12],     // 48px
    xl: spacing[16],     // 64px
    '2xl': spacing[20],  // 80px
    '3xl': spacing[24]   // 96px
  },

  // Section spacing
  section: {
    xs: spacing[8],      // 32px
    sm: spacing[12],     // 48px
    md: spacing[16],     // 64px
    lg: spacing[24],     // 96px
    xl: spacing[32],     // 128px
    '2xl': spacing[40],  // 160px
    '3xl': spacing[48]   // 192px
  },

  // Container spacing
  container: {
    xs: spacing[4],      // 16px
    sm: spacing[6],      // 24px
    md: spacing[8],      // 32px
    lg: spacing[12],     // 48px
    xl: spacing[16]      // 64px
  }
} as const

// Inset spacing (for padding)
export const insets = {
  // Button padding
  button: {
    sm: {
      x: spacing[3],     // 12px horizontal
      y: spacing[2]      // 8px vertical
    },
    md: {
      x: spacing[4],     // 16px horizontal
      y: spacing[2.5]    // 10px vertical
    },
    lg: {
      x: spacing[6],     // 24px horizontal
      y: spacing[3]      // 12px vertical
    },
    xl: {
      x: spacing[8],     // 32px horizontal
      y: spacing[4]      // 16px vertical
    }
  },

  // Input padding
  input: {
    sm: {
      x: spacing[3],     // 12px horizontal
      y: spacing[2]      // 8px vertical
    },
    md: {
      x: spacing[4],     // 16px horizontal
      y: spacing[3]      // 12px vertical
    },
    lg: {
      x: spacing[4],     // 16px horizontal
      y: spacing[4]      // 16px vertical
    }
  },

  // Card padding
  card: {
    sm: spacing[4],      // 16px all sides
    md: spacing[6],      // 24px all sides
    lg: spacing[8],      // 32px all sides
    xl: spacing[10]      // 40px all sides
  },

  // Modal padding
  modal: {
    sm: spacing[6],      // 24px all sides
    md: spacing[8],      // 32px all sides
    lg: spacing[10]      // 40px all sides
  },

  // Page padding
  page: {
    x: {
      mobile: spacing[4],  // 16px horizontal on mobile
      tablet: spacing[6],  // 24px horizontal on tablet
      desktop: spacing[8]  // 32px horizontal on desktop
    },
    y: {
      mobile: spacing[6],  // 24px vertical on mobile
      tablet: spacing[8],  // 32px vertical on tablet
      desktop: spacing[10] // 40px vertical on desktop
    }
  }
} as const

// Gap spacing (for flexbox/grid gaps)
export const gaps = {
  xs: spacing[1],        // 4px
  sm: spacing[2],        // 8px
  md: spacing[4],        // 16px
  lg: spacing[6],        // 24px
  xl: spacing[8],        // 32px
  '2xl': spacing[10],    // 40px
  '3xl': spacing[12]     // 48px
} as const

// Border radius (related to spacing system)
export const borderRadius = {
  none: '0',
  sm: '0.125rem',        // 2px
  md: '0.25rem',         // 4px
  lg: '0.375rem',        // 6px
  xl: '0.5rem',          // 8px
  '2xl': '0.75rem',      // 12px
  '3xl': '1rem',         // 16px
  full: '9999px'
} as const

// D&D-specific spacing
export const dndSpacing = {
  // Character sheet spacing
  characterSheet: {
    statBlock: spacing[4],      // 16px between stat blocks
    section: spacing[6],        // 24px between sections
    ability: spacing[2],        // 8px between abilities
    skill: spacing[1]           // 4px between skills
  },

  // Campaign layout spacing
  campaign: {
    header: spacing[8],         // 32px campaign header padding
    sidebar: spacing[6],        // 24px sidebar padding
    content: spacing[8],        // 32px content padding
    card: spacing[6]            // 24px card padding
  },

  // Dice and game elements
  dice: {
    gap: spacing[2],            // 8px between dice
    padding: spacing[3],        // 12px dice padding
    margin: spacing[4]          // 16px dice margin
  },

  // Map and battle grid
  battleMap: {
    grid: spacing[8],           // 32px grid size
    token: spacing[6],          // 24px token size
    padding: spacing[4]         // 16px map padding
  }
} as const

// Responsive spacing utilities
export const responsiveSpacing = {
  // Container max-widths
  container: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px'
  },

  // Responsive padding classes
  padding: {
    responsive: {
      mobile: spacing[4],       // 16px on mobile
      tablet: spacing[6],       // 24px on tablet
      desktop: spacing[8]       // 32px on desktop
    }
  },

  // Responsive margins
  margin: {
    responsive: {
      mobile: spacing[4],       // 16px on mobile
      tablet: spacing[6],       // 24px on tablet
      desktop: spacing[8]       // 32px on desktop
    }
  }
} as const

// Spacing utilities
export const spacingUtils = {
  /**
   * Convert spacing token to pixels
   */
  toPx: (spacingValue: string): number => {
    return parseFloat(spacingValue) * 16 // Convert rem to px (assuming 16px base)
  },

  /**
   * Convert pixels to rem
   */
  toRem: (px: number): string => {
    return `${px / 16}rem`
  },

  /**
   * Generate responsive spacing
   */
  responsive: (mobile: string, tablet?: string, desktop?: string): string => {
    const t = tablet || mobile
    const d = desktop || tablet || mobile
    return `clamp(${mobile}, 2.5vw, ${d})`
  },

  /**
   * Calculate spacing for grid layouts
   */
  gridSpacing: (columns: number, gap: string, containerWidth: string): string => {
    const gapValue = parseFloat(gap)
    const containerValue = parseFloat(containerWidth)
    const totalGap = gapValue * (columns - 1)
    const itemWidth = (containerValue - totalGap) / columns
    return `${itemWidth}px`
  },

  /**
   * Get spacing value by key
   */
  get: (key: keyof typeof spacing): string => {
    return spacing[key]
  }
}

// Export all spacing tokens
export default {
  spacing,
  semanticSpacing,
  insets,
  gaps,
  borderRadius,
  dndSpacing,
  responsiveSpacing,
  spacingUtils
}
