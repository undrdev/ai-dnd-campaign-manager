/**
 * Design Tokens - Animation & Motion
 * D&D AI Campaign Manager
 * 
 * Animation system with timing functions, durations, and D&D-themed effects
 * Provides smooth, engaging interactions throughout the application
 */

// Animation durations (in milliseconds and CSS values)
export const durations = {
  instant: 0,
  fast: 150,
  normal: 250,
  slow: 350,
  slower: 500,
  slowest: 750
} as const

// CSS duration values
export const cssDurations = {
  instant: '0ms',
  fast: '150ms',
  normal: '250ms',
  slow: '350ms',
  slower: '500ms',
  slowest: '750ms'
} as const

// Easing functions (timing functions)
export const easings = {
  // Standard easing
  linear: 'linear',
  ease: 'ease',
  easeIn: 'ease-in',
  easeOut: 'ease-out',
  easeInOut: 'ease-in-out',

  // Custom cubic bezier curves
  smooth: 'cubic-bezier(0.25, 0.8, 0.25, 1)',
  snappy: 'cubic-bezier(0.4, 0, 0.2, 1)',
  bouncy: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  elastic: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',

  // Material Design easing
  standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
  decelerate: 'cubic-bezier(0, 0, 0.2, 1)',
  accelerate: 'cubic-bezier(0.4, 0, 1, 1)',
  sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',

  // D&D themed easing
  magical: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  heroic: 'cubic-bezier(0.23, 1, 0.32, 1)',
  dramatic: 'cubic-bezier(0.6, -0.28, 0.735, 0.045)'
} as const

// Animation presets for common UI interactions
export const animations = {
  // Fade animations
  fade: {
    in: {
      duration: cssDurations.normal,
      timingFunction: easings.easeOut,
      fillMode: 'both' as const,
      keyframes: {
        from: { opacity: 0 },
        to: { opacity: 1 }
      }
    },
    out: {
      duration: cssDurations.normal,
      timingFunction: easings.easeIn,
      fillMode: 'both' as const,
      keyframes: {
        from: { opacity: 1 },
        to: { opacity: 0 }
      }
    }
  },

  // Slide animations
  slide: {
    inFromLeft: {
      duration: cssDurations.normal,
      timingFunction: easings.smooth,
      fillMode: 'both' as const,
      keyframes: {
        from: { transform: 'translateX(-100%)', opacity: 0 },
        to: { transform: 'translateX(0)', opacity: 1 }
      }
    },
    inFromRight: {
      duration: cssDurations.normal,
      timingFunction: easings.smooth,
      fillMode: 'both' as const,
      keyframes: {
        from: { transform: 'translateX(100%)', opacity: 0 },
        to: { transform: 'translateX(0)', opacity: 1 }
      }
    },
    inFromTop: {
      duration: cssDurations.normal,
      timingFunction: easings.smooth,
      fillMode: 'both' as const,
      keyframes: {
        from: { transform: 'translateY(-100%)', opacity: 0 },
        to: { transform: 'translateY(0)', opacity: 1 }
      }
    },
    inFromBottom: {
      duration: cssDurations.normal,
      timingFunction: easings.smooth,
      fillMode: 'both' as const,
      keyframes: {
        from: { transform: 'translateY(100%)', opacity: 0 },
        to: { transform: 'translateY(0)', opacity: 1 }
      }
    }
  },

  // Scale animations
  scale: {
    in: {
      duration: cssDurations.normal,
      timingFunction: easings.bouncy,
      fillMode: 'both' as const,
      keyframes: {
        from: { transform: 'scale(0.8)', opacity: 0 },
        to: { transform: 'scale(1)', opacity: 1 }
      }
    },
    out: {
      duration: cssDurations.fast,
      timingFunction: easings.easeIn,
      fillMode: 'both' as const,
      keyframes: {
        from: { transform: 'scale(1)', opacity: 1 },
        to: { transform: 'scale(0.8)', opacity: 0 }
      }
    },
    hover: {
      duration: cssDurations.fast,
      timingFunction: easings.easeOut,
      keyframes: {
        to: { transform: 'scale(1.05)' }
      }
    }
  },

  // Rotation animations
  rotate: {
    spin: {
      duration: '1s',
      timingFunction: easings.linear,
      iterationCount: 'infinite' as const,
      keyframes: {
        from: { transform: 'rotate(0deg)' },
        to: { transform: 'rotate(360deg)' }
      }
    },
    bounce: {
      duration: cssDurations.slower,
      timingFunction: easings.bouncy,
      keyframes: {
        '0%, 100%': { transform: 'rotate(0deg)' },
        '50%': { transform: 'rotate(10deg)' }
      }
    }
  },

  // Pulse animations
  pulse: {
    soft: {
      duration: '2s',
      timingFunction: easings.easeInOut,
      iterationCount: 'infinite' as const,
      keyframes: {
        '0%, 100%': { opacity: 1 },
        '50%': { opacity: 0.7 }
      }
    },
    strong: {
      duration: '1s',
      timingFunction: easings.easeInOut,
      iterationCount: 'infinite' as const,
      keyframes: {
        '0%, 100%': { transform: 'scale(1)' },
        '50%': { transform: 'scale(1.1)' }
      }
    }
  }
} as const

// D&D-specific animations
export const dndAnimations = {
  // Dice rolling animation
  diceRoll: {
    duration: '1s',
    timingFunction: easings.bouncy,
    keyframes: {
      '0%': { transform: 'rotate(0deg) scale(1)' },
      '25%': { transform: 'rotate(90deg) scale(1.1)' },
      '50%': { transform: 'rotate(180deg) scale(1)' },
      '75%': { transform: 'rotate(270deg) scale(1.1)' },
      '100%': { transform: 'rotate(360deg) scale(1)' }
    }
  },

  // Magical sparkle effect
  sparkle: {
    duration: '1.5s',
    timingFunction: easings.magical,
    iterationCount: 'infinite' as const,
    keyframes: {
      '0%, 100%': { 
        opacity: 0.3, 
        transform: 'scale(0.8) rotate(0deg)' 
      },
      '50%': { 
        opacity: 1, 
        transform: 'scale(1.2) rotate(180deg)' 
      }
    }
  },

  // Spell casting effect
  spellCast: {
    duration: cssDurations.slower,
    timingFunction: easings.magical,
    keyframes: {
      '0%': { 
        transform: 'scale(1) rotate(0deg)',
        filter: 'brightness(1) hue-rotate(0deg)'
      },
      '50%': { 
        transform: 'scale(1.1) rotate(5deg)',
        filter: 'brightness(1.3) hue-rotate(90deg)'
      },
      '100%': { 
        transform: 'scale(1) rotate(0deg)',
        filter: 'brightness(1) hue-rotate(0deg)'
      }
    }
  },

  // Critical hit effect
  criticalHit: {
    duration: cssDurations.slow,
    timingFunction: easings.dramatic,
    keyframes: {
      '0%': { 
        transform: 'scale(1)',
        filter: 'brightness(1) saturate(1)'
      },
      '30%': { 
        transform: 'scale(1.2)',
        filter: 'brightness(1.5) saturate(1.5)'
      },
      '60%': { 
        transform: 'scale(0.95)',
        filter: 'brightness(1.2) saturate(1.2)'
      },
      '100%': { 
        transform: 'scale(1)',
        filter: 'brightness(1) saturate(1)'
      }
    }
  },

  // Level up celebration
  levelUp: {
    duration: '2s',
    timingFunction: easings.heroic,
    keyframes: {
      '0%': { 
        transform: 'scale(1) translateY(0)',
        opacity: 1
      },
      '20%': { 
        transform: 'scale(1.1) translateY(-10px)',
        opacity: 1
      },
      '40%': { 
        transform: 'scale(1.05) translateY(-5px)',
        opacity: 1
      },
      '60%': { 
        transform: 'scale(1.15) translateY(-15px)',
        opacity: 1
      },
      '80%': { 
        transform: 'scale(1.02) translateY(-2px)',
        opacity: 1
      },
      '100%': { 
        transform: 'scale(1) translateY(0)',
        opacity: 1
      }
    }
  },

  // Health bar animation
  healthChange: {
    duration: cssDurations.normal,
    timingFunction: easings.smooth,
    keyframes: {
      '0%': { transform: 'scaleX(0)' },
      '100%': { transform: 'scaleX(1)' }
    }
  }
} as const

// Transition presets
export const transitions = {
  // All properties
  all: {
    fast: `all ${cssDurations.fast} ${easings.easeOut}`,
    normal: `all ${cssDurations.normal} ${easings.easeOut}`,
    slow: `all ${cssDurations.slow} ${easings.easeOut}`
  },

  // Specific properties
  opacity: {
    fast: `opacity ${cssDurations.fast} ${easings.easeOut}`,
    normal: `opacity ${cssDurations.normal} ${easings.easeOut}`,
    slow: `opacity ${cssDurations.slow} ${easings.easeOut}`
  },

  transform: {
    fast: `transform ${cssDurations.fast} ${easings.smooth}`,
    normal: `transform ${cssDurations.normal} ${easings.smooth}`,
    slow: `transform ${cssDurations.slow} ${easings.smooth}`
  },

  colors: {
    fast: `color ${cssDurations.fast} ${easings.easeOut}, background-color ${cssDurations.fast} ${easings.easeOut}, border-color ${cssDurations.fast} ${easings.easeOut}`,
    normal: `color ${cssDurations.normal} ${easings.easeOut}, background-color ${cssDurations.normal} ${easings.easeOut}, border-color ${cssDurations.normal} ${easings.easeOut}`,
    slow: `color ${cssDurations.slow} ${easings.easeOut}, background-color ${cssDurations.slow} ${easings.easeOut}, border-color ${cssDurations.slow} ${easings.easeOut}`
  },

  // Layout properties
  layout: {
    fast: `width ${cssDurations.fast} ${easings.smooth}, height ${cssDurations.fast} ${easings.smooth}, padding ${cssDurations.fast} ${easings.smooth}, margin ${cssDurations.fast} ${easings.smooth}`,
    normal: `width ${cssDurations.normal} ${easings.smooth}, height ${cssDurations.normal} ${easings.smooth}, padding ${cssDurations.normal} ${easings.smooth}, margin ${cssDurations.normal} ${easings.smooth}`,
    slow: `width ${cssDurations.slow} ${easings.smooth}, height ${cssDurations.slow} ${easings.smooth}, padding ${cssDurations.slow} ${easings.smooth}, margin ${cssDurations.slow} ${easings.smooth}`
  }
} as const

// Animation utilities
export const animationUtils = {
  /**
   * Generate keyframe animation CSS
   */
  generateKeyframes: (name: string, keyframes: Record<string, any>): string => {
    const keyframeEntries = Object.entries(keyframes)
      .map(([key, value]) => {
        const properties = Object.entries(value as Record<string, any>)
          .map(([prop, val]) => `${prop}: ${val};`)
          .join(' ')
        return `${key} { ${properties} }`
      })
      .join(' ')
    
    return `@keyframes ${name} { ${keyframeEntries} }`
  },

  /**
   * Create animation shorthand
   */
  createAnimation: (
    name: string,
    duration: string = cssDurations.normal,
    timingFunction: string = easings.easeOut,
    delay: string = '0s',
    iterationCount: string = '1',
    direction: string = 'normal',
    fillMode: string = 'both'
  ): string => {
    return `${name} ${duration} ${timingFunction} ${delay} ${iterationCount} ${direction} ${fillMode}`
  },

  /**
   * Get stagger delay for list animations
   */
  getStaggerDelay: (index: number, baseDelay: number = 50): string => {
    return `${baseDelay * index}ms`
  },

  /**
   * Create spring animation
   */
  spring: (tension: number = 300, friction: number = 10): string => {
    const damping = friction / (2 * Math.sqrt(tension))
    const frequency = Math.sqrt(tension) / (2 * Math.PI)
    return `cubic-bezier(${0.25 + damping}, ${0.46 - frequency}, ${0.45 + frequency}, ${0.94 - damping})`
  }
}

// Export all animation tokens
export default {
  durations,
  cssDurations,
  easings,
  animations,
  dndAnimations,
  transitions,
  animationUtils
}
