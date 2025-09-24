# Design System Documentation
## D&D AI Campaign Manager

This design system provides a comprehensive set of design tokens for consistent styling across the entire application.

## 📁 Structure

```
design-system/
├── tokens/
│   ├── colors.ts          # Color palette and theme definitions
│   ├── typography.ts      # Font families, sizes, weights, and styles
│   ├── spacing.ts         # Spacing scale and semantic spacing
│   ├── animation.ts       # Animation durations, easing, and presets
│   ├── tokens.css         # CSS custom properties
│   └── index.ts           # Main export and utilities
└── README.md              # This documentation
```

## 🎨 Design Tokens

### Colors

Our color system is built around D&D themes with semantic variants:

#### Primary Colors (Mystical Blue)
- Used for primary actions, links, and key UI elements
- Range: `primary-50` to `primary-950`
- Main color: `primary-600` (#4f46e5)

#### Secondary Colors (Legendary Gold)
- Used for secondary actions and accents
- Range: `secondary-50` to `secondary-950`
- Main color: `secondary-600` (#d97706)

#### D&D Themed Colors
- **Dragon Red**: `dnd-red-500` (#8b0000)
- **Elven Green**: `dnd-green-500` (#22c55e)
- **Dwarven Bronze**: `dnd-bronze-500` (#cd7c32)
- **Arcane Purple**: `dnd-purple-500` (#a855f7)

#### Semantic Colors
- **Success**: Green tones for positive actions
- **Warning**: Orange/yellow tones for caution
- **Error**: Red tones for errors and danger
- **Info**: Blue tones for information

#### Special Colors
- **Dice Colors**: Unique colors for each die type (d4, d6, d8, d10, d12, d20)
- **Rarity Colors**: D&D item rarity system (common, uncommon, rare, epic, legendary, artifact)

### Typography

#### Font Families
- **Sans**: `Inter` - Clean, readable font for body text and UI
- **Serif**: `Merriweather` - Elegant font for headings and emphasis
- **Display**: `Cinzel Decorative` - Fantasy-inspired font for special headings
- **Mono**: `JetBrains Mono` - Monospace font for code and data

#### Typography Scale
- **Display**: Hero sections and landing pages (large, medium, small)
- **Headline**: Page titles and section headers (large, medium, small)
- **Title**: Card titles and component headers (large, medium, small)
- **Body**: Main content and paragraphs (large, medium, small)
- **Label**: Form labels and UI labels (large, medium, small)
- **Caption**: Small text and metadata (large, medium, small)
- **Code**: Code blocks and inline code (large, medium, small)

#### D&D-Specific Typography
- **Campaign Title**: Uppercase display font for campaign names
- **Character Name**: Serif font for character names
- **Spell Name**: Italic serif font for spell names
- **Stat Block**: Monospace font for character stats
- **Dice Notation**: Bold monospace for dice rolls
- **Flavor Text**: Italic serif for descriptive text

### Spacing

Based on a 4px grid system for consistent spacing:

#### Core Scale
- Range: `0` to `96` (0px to 384px)
- Base unit: 4px
- Examples: `spacing-4` (16px), `spacing-8` (32px)

#### Semantic Spacing
- **Component**: Internal component spacing (xs to xl)
- **Layout**: Layout-level spacing (xs to 3xl)
- **Section**: Section spacing (xs to 3xl)
- **Container**: Container padding (xs to xl)

#### Specialized Spacing
- **Button Insets**: Padding for different button sizes
- **Input Insets**: Padding for form inputs
- **Card Insets**: Padding for card components
- **D&D Specific**: Character sheets, battle maps, dice layouts

### Animation

#### Durations
- **Instant**: 0ms
- **Fast**: 150ms
- **Normal**: 250ms (default)
- **Slow**: 350ms
- **Slower**: 500ms
- **Slowest**: 750ms

#### Easing Functions
- **Standard**: `cubic-bezier(0.4, 0, 0.2, 1)`
- **Smooth**: `cubic-bezier(0.25, 0.8, 0.25, 1)`
- **Bouncy**: `cubic-bezier(0.68, -0.55, 0.265, 1.55)`
- **D&D Themed**: Magical, heroic, dramatic easing curves

#### Animation Presets
- **Fade**: In/out animations
- **Slide**: Directional slide animations
- **Scale**: Scale in/out with bounce
- **Rotate**: Spin and bounce rotations
- **Pulse**: Soft and strong pulse effects

#### D&D-Specific Animations
- **Dice Roll**: Bouncy dice rolling animation
- **Spell Cast**: Magical casting effect with color shifts
- **Critical Hit**: Dramatic impact animation
- **Level Up**: Celebratory level-up animation
- **Health Change**: Smooth health bar transitions

## 🚀 Usage

### TypeScript/JavaScript

```typescript
import { colors, typography, spacing, animations } from '~/design-system/tokens'

// Use color tokens
const primaryColor = colors.primary[600]
const backgroundColor = lightTheme.background

// Use typography tokens
const headingStyle = typography.headline.large
const bodyFont = fontFamilies.sans.join(', ')

// Use spacing tokens
const padding = spacing[4] // 16px
const margin = semanticSpacing.layout.md // 32px

// Use animation tokens
const duration = cssDurations.normal // 250ms
const easing = easings.smooth
```

### CSS Custom Properties

```css
/* Colors */
.my-component {
  background-color: var(--color-primary);
  color: var(--color-on-primary);
  border: 1px solid var(--color-outline);
}

/* Typography */
.my-heading {
  font-family: var(--font-family-serif);
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-tight);
}

/* Spacing */
.my-card {
  padding: var(--spacing-6);
  margin: var(--spacing-4);
  border-radius: var(--border-radius-lg);
}

/* Animation */
.my-button {
  transition: var(--transition-all-normal);
}

.my-button:hover {
  transform: scale(1.05);
  transition: var(--transition-transform);
}
```

### Utility Classes

```html
<!-- Colors -->
<div class="bg-primary text-on-primary">Primary background</div>
<div class="text-dnd-red">Dragon red text</div>
<div class="text-rarity-legendary">Legendary item</div>

<!-- Typography -->
<h1 class="font-display font-bold">Display heading</h1>
<p class="font-sans font-normal">Body text</p>

<!-- Animation -->
<div class="transition-all hover:scale-105">Animated element</div>
```

## 🌙 Theme Support

The design system supports both light and dark themes:

### Light Theme
- Clean, bright appearance
- High contrast for readability
- D&D colors optimized for light backgrounds

### Dark Theme
- Dark, immersive appearance
- Reduced eye strain
- D&D colors optimized for dark backgrounds

### Theme Switching

```typescript
// Programmatically switch themes
import { createTheme } from '~/design-system/tokens'

const lightTheme = createTheme('light')
const darkTheme = createTheme('dark')
```

```css
/* CSS theme switching */
:root {
  /* Light theme variables */
}

[data-theme="dark"] {
  /* Dark theme overrides */
}
```

## 🎲 D&D-Specific Features

### Dice Colors
Each die type has its own color for easy identification:
- d4: Red (#ff6b6b)
- d6: Teal (#4ecdc4)
- d8: Blue (#45b7d1)
- d10: Green (#96ceb4)
- d12: Yellow (#feca57)
- d20: Pink (#ff9ff3)

### Rarity System
Item rarities follow D&D conventions:
- Common: Gray
- Uncommon: Green
- Rare: Blue
- Epic: Purple
- Legendary: Orange
- Artifact: Red

### Character Sheet Spacing
Specialized spacing for D&D character sheets:
- Stat blocks: 16px spacing
- Sections: 24px spacing
- Abilities: 8px spacing
- Skills: 4px spacing

## 🔧 Customization

### Adding New Tokens

1. **Colors**: Add to `tokens/colors.ts` in the appropriate section
2. **Typography**: Add to `tokens/typography.ts` with proper type definitions
3. **Spacing**: Add to `tokens/spacing.ts` following the 4px grid
4. **Animation**: Add to `tokens/animation.ts` with timing and easing

### Generating CSS

The system automatically generates CSS custom properties:

```typescript
import { generateCSSString } from '~/design-system/tokens'

// Generate CSS for light theme
const lightCSS = generateCSSString('light')

// Generate CSS for dark theme
const darkCSS = generateCSSString('dark')
```

## 📊 Token Reference

### Complete Token List

#### Colors (100+ tokens)
- Primary palette: 11 shades
- Secondary palette: 11 shades
- D&D themed: 4 color families
- Semantic colors: 4 types with containers
- Neutral grays: 11 shades
- Special colors: dice, rarity, transparent

#### Typography (50+ tokens)
- 4 font families
- 9 font weights
- 13 font sizes
- 6 line heights
- 6 letter spacing values
- 7 typography categories with 3 sizes each

#### Spacing (40+ tokens)
- 32 core spacing values
- 4 semantic spacing categories
- Border radius values
- D&D-specific spacing

#### Animation (30+ tokens)
- 6 duration values
- 12 easing functions
- 5 animation categories
- 5 D&D-specific animations
- Transition presets

## 🎯 Best Practices

1. **Use semantic tokens** when possible (e.g., `color-primary` vs `color-blue-600`)
2. **Follow the spacing scale** - stick to the 4px grid system
3. **Use appropriate typography** - match font families to content type
4. **Animate meaningfully** - use D&D-themed animations for game elements
5. **Test both themes** - ensure designs work in light and dark modes
6. **Maintain contrast** - all color combinations meet WCAG 2.1 AA standards

## 🔍 Tools & Utilities

The design system includes utility functions for:
- Color manipulation and contrast checking
- Responsive spacing calculations
- Typography style generation
- Animation timing calculations
- CSS custom property generation

This comprehensive design system ensures visual consistency while providing the flexibility needed for a rich D&D campaign management experience.
