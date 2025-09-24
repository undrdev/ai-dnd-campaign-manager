/**
 * Design Tokens - Typography
 * D&D AI Campaign Manager
 * 
 * Typography scale with D&D-themed font families and proper hierarchy
 * Optimized for readability and fantasy aesthetics
 */

// Font Families
export const fontFamilies = {
  // Primary font for body text (clean, readable)
  sans: [
    'Inter',
    '-apple-system',
    'BlinkMacSystemFont',
    'Segoe UI',
    'Roboto',
    'Oxygen',
    'Ubuntu',
    'Cantarell',
    'sans-serif'
  ],

  // Secondary font for headings (elegant, fantasy-inspired)
  serif: [
    'Merriweather',
    'Georgia',
    'Cambria',
    'Times New Roman',
    'serif'
  ],

  // Display font for special headings (fantasy, decorative)
  display: [
    'Cinzel Decorative',
    'Cinzel',
    'Trajan Pro',
    'serif'
  ],

  // Monospace for code and data
  mono: [
    'JetBrains Mono',
    'Fira Code',
    'Monaco',
    'Consolas',
    'Liberation Mono',
    'Courier New',
    'monospace'
  ]
} as const

// Font Weights
export const fontWeights = {
  thin: 100,
  extralight: 200,
  light: 300,
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  extrabold: 800,
  black: 900
} as const

// Font Sizes (rem-based for scalability)
export const fontSizes = {
  xs: '0.75rem',      // 12px
  sm: '0.875rem',     // 14px
  base: '1rem',       // 16px
  lg: '1.125rem',     // 18px
  xl: '1.25rem',      // 20px
  '2xl': '1.5rem',    // 24px
  '3xl': '1.875rem',  // 30px
  '4xl': '2.25rem',   // 36px
  '5xl': '3rem',      // 48px
  '6xl': '3.75rem',   // 60px
  '7xl': '4.5rem',    // 72px
  '8xl': '6rem',      // 96px
  '9xl': '8rem'       // 128px
} as const

// Line Heights
export const lineHeights = {
  none: 1,
  tight: 1.25,
  snug: 1.375,
  normal: 1.5,
  relaxed: 1.625,
  loose: 2
} as const

// Letter Spacing
export const letterSpacing = {
  tighter: '-0.05em',
  tight: '-0.025em',
  normal: '0em',
  wide: '0.025em',
  wider: '0.05em',
  widest: '0.1em'
} as const

// Typography Scale (semantic names)
export const typography = {
  // Display styles (for hero sections, landing pages)
  display: {
    large: {
      fontFamily: fontFamilies.display.join(', '),
      fontSize: fontSizes['6xl'],
      fontWeight: fontWeights.bold,
      lineHeight: lineHeights.tight,
      letterSpacing: letterSpacing.tight
    },
    medium: {
      fontFamily: fontFamilies.display.join(', '),
      fontSize: fontSizes['5xl'],
      fontWeight: fontWeights.bold,
      lineHeight: lineHeights.tight,
      letterSpacing: letterSpacing.tight
    },
    small: {
      fontFamily: fontFamilies.display.join(', '),
      fontSize: fontSizes['4xl'],
      fontWeight: fontWeights.semibold,
      lineHeight: lineHeights.snug,
      letterSpacing: letterSpacing.normal
    }
  },

  // Headline styles (for page titles, section headers)
  headline: {
    large: {
      fontFamily: fontFamilies.serif.join(', '),
      fontSize: fontSizes['3xl'],
      fontWeight: fontWeights.bold,
      lineHeight: lineHeights.snug,
      letterSpacing: letterSpacing.tight
    },
    medium: {
      fontFamily: fontFamilies.serif.join(', '),
      fontSize: fontSizes['2xl'],
      fontWeight: fontWeights.bold,
      lineHeight: lineHeights.snug,
      letterSpacing: letterSpacing.normal
    },
    small: {
      fontFamily: fontFamilies.serif.join(', '),
      fontSize: fontSizes.xl,
      fontWeight: fontWeights.semibold,
      lineHeight: lineHeights.normal,
      letterSpacing: letterSpacing.normal
    }
  },

  // Title styles (for card titles, component headers)
  title: {
    large: {
      fontFamily: fontFamilies.sans.join(', '),
      fontSize: fontSizes.lg,
      fontWeight: fontWeights.semibold,
      lineHeight: lineHeights.normal,
      letterSpacing: letterSpacing.normal
    },
    medium: {
      fontFamily: fontFamilies.sans.join(', '),
      fontSize: fontSizes.base,
      fontWeight: fontWeights.semibold,
      lineHeight: lineHeights.normal,
      letterSpacing: letterSpacing.normal
    },
    small: {
      fontFamily: fontFamilies.sans.join(', '),
      fontSize: fontSizes.sm,
      fontWeight: fontWeights.medium,
      lineHeight: lineHeights.normal,
      letterSpacing: letterSpacing.normal
    }
  },

  // Body styles (for main content, paragraphs)
  body: {
    large: {
      fontFamily: fontFamilies.sans.join(', '),
      fontSize: fontSizes.lg,
      fontWeight: fontWeights.normal,
      lineHeight: lineHeights.relaxed,
      letterSpacing: letterSpacing.normal
    },
    medium: {
      fontFamily: fontFamilies.sans.join(', '),
      fontSize: fontSizes.base,
      fontWeight: fontWeights.normal,
      lineHeight: lineHeights.normal,
      letterSpacing: letterSpacing.normal
    },
    small: {
      fontFamily: fontFamilies.sans.join(', '),
      fontSize: fontSizes.sm,
      fontWeight: fontWeights.normal,
      lineHeight: lineHeights.normal,
      letterSpacing: letterSpacing.normal
    }
  },

  // Label styles (for form labels, UI labels)
  label: {
    large: {
      fontFamily: fontFamilies.sans.join(', '),
      fontSize: fontSizes.base,
      fontWeight: fontWeights.medium,
      lineHeight: lineHeights.normal,
      letterSpacing: letterSpacing.normal
    },
    medium: {
      fontFamily: fontFamilies.sans.join(', '),
      fontSize: fontSizes.sm,
      fontWeight: fontWeights.medium,
      lineHeight: lineHeights.normal,
      letterSpacing: letterSpacing.normal
    },
    small: {
      fontFamily: fontFamilies.sans.join(', '),
      fontSize: fontSizes.xs,
      fontWeight: fontWeights.medium,
      lineHeight: lineHeights.normal,
      letterSpacing: letterSpacing.wide
    }
  },

  // Caption styles (for small text, metadata)
  caption: {
    large: {
      fontFamily: fontFamilies.sans.join(', '),
      fontSize: fontSizes.sm,
      fontWeight: fontWeights.normal,
      lineHeight: lineHeights.normal,
      letterSpacing: letterSpacing.normal
    },
    medium: {
      fontFamily: fontFamilies.sans.join(', '),
      fontSize: fontSizes.xs,
      fontWeight: fontWeights.normal,
      lineHeight: lineHeights.normal,
      letterSpacing: letterSpacing.normal
    },
    small: {
      fontFamily: fontFamilies.sans.join(', '),
      fontSize: fontSizes.xs,
      fontWeight: fontWeights.light,
      lineHeight: lineHeights.snug,
      letterSpacing: letterSpacing.wide
    }
  },

  // Code styles (for code blocks, inline code)
  code: {
    large: {
      fontFamily: fontFamilies.mono.join(', '),
      fontSize: fontSizes.base,
      fontWeight: fontWeights.normal,
      lineHeight: lineHeights.relaxed,
      letterSpacing: letterSpacing.normal
    },
    medium: {
      fontFamily: fontFamilies.mono.join(', '),
      fontSize: fontSizes.sm,
      fontWeight: fontWeights.normal,
      lineHeight: lineHeights.normal,
      letterSpacing: letterSpacing.normal
    },
    small: {
      fontFamily: fontFamilies.mono.join(', '),
      fontSize: fontSizes.xs,
      fontWeight: fontWeights.normal,
      lineHeight: lineHeights.normal,
      letterSpacing: letterSpacing.normal
    }
  }
} as const

// D&D-specific typography styles
export const dndTypography = {
  // Campaign title style
  campaignTitle: {
    fontFamily: fontFamilies.display.join(', '),
    fontSize: fontSizes['4xl'],
    fontWeight: fontWeights.bold,
    lineHeight: lineHeights.tight,
    letterSpacing: letterSpacing.tight,
    textTransform: 'uppercase' as const
  },

  // Character name style
  characterName: {
    fontFamily: fontFamilies.serif.join(', '),
    fontSize: fontSizes['2xl'],
    fontWeight: fontWeights.bold,
    lineHeight: lineHeights.snug,
    letterSpacing: letterSpacing.normal
  },

  // Spell name style
  spellName: {
    fontFamily: fontFamilies.serif.join(', '),
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.semibold,
    lineHeight: lineHeights.normal,
    letterSpacing: letterSpacing.normal,
    fontStyle: 'italic' as const
  },

  // Stat block style
  statBlock: {
    fontFamily: fontFamilies.mono.join(', '),
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.snug,
    letterSpacing: letterSpacing.normal
  },

  // Dice notation style
  dice: {
    fontFamily: fontFamilies.mono.join(', '),
    fontSize: fontSizes.base,
    fontWeight: fontWeights.bold,
    lineHeight: lineHeights.normal,
    letterSpacing: letterSpacing.normal
  },

  // Flavor text style
  flavorText: {
    fontFamily: fontFamilies.serif.join(', '),
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.normal,
    lineHeight: lineHeights.relaxed,
    letterSpacing: letterSpacing.normal,
    fontStyle: 'italic' as const
  }
} as const

// Typography utilities
export const typographyUtils = {
  /**
   * Generate CSS font shorthand
   */
  generateFontShorthand: (style: any): string => {
    const { fontWeight, fontSize, lineHeight, fontFamily } = style
    return `${fontWeight} ${fontSize}/${lineHeight} ${fontFamily}`
  },

  /**
   * Get responsive font size
   */
  getResponsiveFontSize: (baseSize: keyof typeof fontSizes, scaleFactor: number = 0.875): string => {
    const base = parseFloat(fontSizes[baseSize])
    const mobile = base * scaleFactor
    return `clamp(${mobile}rem, ${base}rem, ${base}rem)`
  },

  /**
   * Calculate optimal line height for font size
   */
  getOptimalLineHeight: (fontSize: string): number => {
    const size = parseFloat(fontSize)
    if (size <= 0.875) return 1.5      // Small text
    if (size <= 1.125) return 1.4      // Body text
    if (size <= 1.5) return 1.3        // Large text
    return 1.2                          // Display text
  }
}

// Export all typography tokens
export default {
  fontFamilies,
  fontWeights,
  fontSizes,
  lineHeights,
  letterSpacing,
  typography,
  dndTypography,
  typographyUtils
}
