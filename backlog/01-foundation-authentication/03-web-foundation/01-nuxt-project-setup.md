# Nuxt 3 Project Setup and Configuration

## Story
**As a** developer  
**I want** a properly configured Nuxt 3 project with TypeScript, state management, and development tools  
**So that** I can build a modern, maintainable Vue.js web application

## Acceptance Criteria
- [ ] Nuxt 3 project created with TypeScript support
- [ ] Tailwind CSS and Vuetify 3 integrated
- [ ] Pinia state management configured
- [ ] ESLint and Prettier configured for code quality
- [ ] Development server runs without errors
- [ ] Hot reload and TypeScript compilation working
- [ ] Build process generates optimized production bundle

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
- [ ] Nuxt 3 project initializes without errors
- [ ] TypeScript compilation works correctly
- [ ] Tailwind CSS classes are properly applied
- [ ] Vuetify 3 components render correctly
- [ ] Pinia store can be created and accessed
- [ ] ESLint and Prettier run without errors
- [ ] Hot reload works for code changes
- [ ] Build process generates production bundle
- [ ] All development scripts work correctly

## Dependencies
- **Depends on**: None (This is a foundation story)
- **Blocks**: All web UI implementation stories

## Estimated Effort
**4 hours** - Project setup and configuration
