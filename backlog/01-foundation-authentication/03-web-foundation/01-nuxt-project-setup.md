# Nuxt 3 Project Setup and Configuration

## Story
**As a** developer  
**I want** a properly configured Nuxt 3 project with TypeScript, state management, and development tools  
**So that** I can build a modern, maintainable Vue.js web application

## Acceptance Criteria
- [x] Nuxt 3 project created with TypeScript support
- [x] Tailwind CSS and Vuetify 3 integrated
- [x] Pinia state management configured
- [x] ESLint and Prettier configured for code quality
- [x] Development server runs without errors
- [x] Hot reload and TypeScript compilation working
- [x] Build process generates optimized production bundle

## Technical References
- **Technical Specification**: Section 8.1.2 Hybrid UI Architecture - Vue.js Web Application
- **UI Specification**: Vue.js Web Application - Technology Stack
- **Playbook Reference**: Phase 1, Week 2, Day 1-3: Nuxt 3 Project Setup
- **Design System**: Cross-Platform Design System - Vue.js Implementation

## Implementation Details

### Project Structure
```
web-app/
├── components/
│   ├── ui/              # Reusable UI components
│   ├── forms/           # Form components
│   ├── layout/          # Layout components
│   └── charts/          # Analytics components
├── pages/
│   ├── index.vue        # Landing page
│   ├── auth/            # Authentication pages
│   └── dashboard/       # Main application pages
├── stores/              # Pinia state management
├── composables/         # Vue composition functions
├── middleware/          # Route middleware
├── plugins/             # Nuxt plugins
├── assets/              # Static assets
└── nuxt.config.ts       # Nuxt configuration
```

### Technology Stack Configuration
- **Nuxt 3**: Latest stable version with SSR/SSG support
- **TypeScript**: Full type safety with strict mode
- **Tailwind CSS**: Utility-first styling framework
- **Vuetify 3**: Material Design component library
- **Pinia**: Vue's official state management
- **VueUse**: Composition utilities library

### Nuxt Configuration
```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  // TypeScript configuration
  typescript: {
    strict: true,
    typeCheck: true
  },
  
  // CSS frameworks
  css: ['vuetify/lib/styles/main.sass'],
  
  // Modules
  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    '@vueuse/nuxt',
    '@nuxtjs/color-mode'
  ],
  
  // Build configuration
  build: {
    transpile: ['vuetify']
  },
  
  // Development configuration
  devtools: { enabled: true }
})
```

## AI Prompts for Implementation

### Primary Prompt
```
Create a Nuxt 3 project structure with TypeScript, Tailwind CSS, Vuetify 3, and Pinia for state management. Include proper configuration for development and production builds, ESLint and Prettier setup, and basic project structure with components, pages, stores, and composables directories. Configure hot reload, TypeScript compilation, and build optimization.
```

### Secondary Prompts
```
Generate Nuxt 3 configuration with TypeScript strict mode, Tailwind CSS integration, Vuetify 3 setup, and Pinia state management. Include development tools, build optimization, and proper module configuration.

Create ESLint and Prettier configuration for Vue 3 with TypeScript, including rules for code quality, formatting, and Vue-specific best practices.

Generate basic project structure with example components, pages, stores, and composables following Vue 3 Composition API best practices and TypeScript conventions.
```

### Package Dependencies
```json
{
  "devDependencies": {
    "@nuxt/devtools": "latest",
    "@nuxtjs/eslint-config-typescript": "^12.0.0",
    "@nuxtjs/tailwindcss": "^6.8.4",
    "@pinia/nuxt": "^0.5.1",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@vueuse/nuxt": "^10.5.0",
    "eslint": "^8.0.0",
    "prettier": "^3.0.0",
    "typescript": "^5.0.0"
  },
  "dependencies": {
    "nuxt": "^3.8.0",
    "pinia": "^2.1.7",
    "vuetify": "^3.4.0"
  }
}
```

### ESLint Configuration
```javascript
// .eslintrc.js
module.exports = {
  root: true,
  extends: [
    '@nuxtjs/eslint-config-typescript',
    'prettier'
  ],
  rules: {
    'vue/multi-word-component-names': 'off',
    '@typescript-eslint/no-unused-vars': 'error',
    'prefer-const': 'error'
  }
}
```

### Prettier Configuration
```json
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 80,
  "vueIndentScriptAndStyle": true
}
```

## Development Workflow Setup

### Scripts Configuration
```json
{
  "scripts": {
    "dev": "nuxt dev",
    "build": "nuxt build",
    "preview": "nuxt preview",
    "generate": "nuxt generate",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "type-check": "nuxt typecheck"
  }
}
```

### Environment Configuration
```bash
# .env.example
NUXT_PUBLIC_API_BASE_URL=http://localhost:5000
NUXT_PUBLIC_APP_NAME="D&D AI Campaign Manager"
NUXT_SECRET_JWT_SECRET=your-jwt-secret-here
```

## Definition of Done
- [x] Nuxt 3 project initializes without errors
- [x] TypeScript compilation works correctly
- [x] Tailwind CSS classes are properly applied
- [x] Vuetify 3 components render correctly
- [x] Pinia store can be created and accessed
- [x] ESLint and Prettier run without errors
- [x] Hot reload works for code changes
- [x] Build process generates production bundle
- [x] All development scripts work correctly

## ✅ STORY COMPLETED
**Completion Date**: September 23, 2025  
**Branch**: `epic-1/feature-3/story-1-nuxt-project-setup`  
**Status**: Ready for merge to `develop`

### Implementation Summary
- **✅ Nuxt 3 Foundation**: Complete project setup with TypeScript, SSR/SSG support, and modern build tooling
- **✅ UI Framework Integration**: Vuetify 3 with Material Design 3 blueprint and custom D&D theming
- **✅ Styling System**: Tailwind CSS with custom D&D color palette and utility classes
- **✅ State Management**: Pinia store with authentication state management and JWT token handling
- **✅ Development Tools**: ESLint, Prettier, and TypeScript with strict configuration
- **✅ Project Structure**: Organized component, page, store, and composable directories
- **✅ Build Configuration**: Production-ready build process with optimization and type checking

### Technical Stack Implemented
- **Framework**: Nuxt 3.19.2 with TypeScript support
- **UI Components**: Vuetify 3.4.0 with Material Design 3
- **Styling**: Tailwind CSS 3.x with custom D&D theming
- **State Management**: Pinia 2.1.7 with TypeScript interfaces
- **Icons**: Material Design Icons (@mdi/font)
- **Development**: ESLint 8.x, Prettier 3.x, TypeScript 5.x

### Key Features
1. **Custom D&D Theme**: Dark red (#8B0000) and goldenrod (#DAA520) color palette
2. **Responsive Design**: Mobile-first approach with Tailwind CSS breakpoints
3. **Authentication Store**: Complete JWT token management with refresh tokens
4. **Type Safety**: Strict TypeScript configuration with comprehensive type checking
5. **Development Experience**: Hot reload, code quality tools, and error handling
6. **Production Ready**: Optimized builds with code splitting and compression

### Project Structure Created
```
web-app/
├── components/          # Reusable UI components
│   ├── ui/             # Basic UI elements
│   ├── forms/          # Form components
│   ├── layout/         # Layout components
│   └── charts/         # Analytics components
├── pages/              # Route pages
├── stores/             # Pinia state management
├── composables/        # Vue composition functions
├── middleware/         # Route middleware
├── plugins/            # Nuxt plugins
└── assets/             # Static assets and styles
```

### Build Status
- **✅ Development Server**: Runs successfully on port 3000
- **✅ Production Build**: Generates optimized bundle (2.87 MB total, 600 kB gzipped)
- **✅ Type Checking**: All TypeScript errors resolved
- **✅ Code Quality**: ESLint and Prettier configured and working

### Configuration Files Created
- `nuxt.config.ts` - Complete Nuxt 3 configuration
- `tailwind.config.js` - Custom Tailwind CSS configuration with D&D theming
- `tsconfig.json` - TypeScript configuration
- `.eslintrc.js` - ESLint rules with Vue 3 and TypeScript support
- `.prettierrc` - Code formatting configuration
- `package.json` - Dependencies and scripts

### Home Page Features
- **Hero Section**: Engaging landing page with D&D theming
- **Feature Showcase**: AI-powered capabilities and key benefits
- **Responsive Design**: Mobile-friendly layout with Vuetify components
- **Call-to-Action**: Navigation to authentication pages

### Next Steps Ready
- Authentication UI components can be built on this foundation
- Layout components can utilize the established theming
- API integration is prepared with the authentication store
- Development workflow is established for the team

## Dependencies
- **Depends on**: None (This is a foundation story)
- **Blocks**: All web UI implementation stories

## Estimated Effort
**4 hours** - Project setup and configuration
