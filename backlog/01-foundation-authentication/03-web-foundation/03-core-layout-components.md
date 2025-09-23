# Core Layout Components Implementation

## Story
**As a** developer  
**I want** reusable core layout components with responsive design and navigation  
**So that** I can build consistent user interfaces across the application

## Acceptance Criteria
- [ ] App header component with navigation and user menu
- [ ] Responsive layout system with breakpoint handling
- [ ] Loading states and error handling components
- [ ] Navigation menu with role-based visibility
- [ ] Footer component with links and information
- [ ] Sidebar component for dashboard layouts
- [ ] Breadcrumb navigation component
- [ ] Mobile-friendly navigation with hamburger menu

## Technical References
- **UI Specification**: Vue.js Web Application - Core Layout Components
- **Design System**: Cross-Platform Design System - Vue.js Implementation
- **Playbook Reference**: Phase 1, Week 2, Day 1-3: Core Layout Components
- **Responsive Design**: UI Responsive Design Patterns

## Implementation Details

### Layout Components Structure
```
components/
├── layout/
│   ├── AppHeader.vue        # Main application header
│   ├── AppSidebar.vue       # Sidebar navigation
│   ├── AppFooter.vue        # Application footer
│   ├── AppBreadcrumb.vue    # Breadcrumb navigation
│   └── AppLayout.vue        # Main layout wrapper
├── ui/
│   ├── AppLoading.vue       # Loading states
│   ├── AppError.vue         # Error display
│   └── AppNotification.vue  # Toast notifications
└── navigation/
    ├── MainNavigation.vue   # Primary navigation
    ├── UserMenu.vue         # User dropdown menu
    └── MobileMenu.vue       # Mobile navigation
```

### App Header Component
```vue
<!-- components/layout/AppHeader.vue -->
<template>
  <v-app-bar
    :elevation="0"
    class="app-header"
    :class="{ 'glass-effect': useGlassEffect }"
  >
    <div class="d-flex align-center w-100">
      <!-- Brand Section -->
      <div class="d-flex align-center">
        <NuxtLink to="/" class="brand-link">
          <v-img
            src="/logo.svg"
            alt="D&D AI"
            height="32"
            width="120"
            contain
          />
        </NuxtLink>
      </div>

      <!-- Main Navigation (Desktop) -->
      <MainNavigation
        v-if="!$vuetify.display.mobile"
        class="ml-8"
      />

      <v-spacer />

      <!-- Search -->
      <v-text-field
        v-model="searchQuery"
        prepend-inner-icon="mdi-magnify"
        placeholder="Search campaigns, characters..."
        variant="outlined"
        density="compact"
        hide-details
        class="search-field"
      />

      <!-- User Actions -->
      <div class="d-flex align-center ml-4">
        <UserMenu />
      </div>
    </div>
  </v-app-bar>
</template>
```

### Responsive Layout System
```vue
<!-- layouts/default.vue -->
<template>
  <v-app>
    <AppHeader />
    
    <!-- Mobile Navigation Drawer -->
    <v-navigation-drawer
      v-if="$vuetify.display.mobile"
      v-model="mobileNav"
      temporary
    >
      <MobileMenu @close="mobileNav = false" />
    </v-navigation-drawer>

    <!-- Desktop Sidebar -->
    <AppSidebar
      v-if="showSidebar && !$vuetify.display.mobile"
      :rail="railMode"
    />

    <!-- Main Content -->
    <v-main>
      <v-container
        :fluid="$vuetify.display.mobile"
        class="pa-4"
      >
        <AppBreadcrumb v-if="showBreadcrumb" />
        
        <Suspense>
          <slot />
          <template #fallback>
            <AppLoading />
          </template>
        </Suspense>
      </v-container>
    </v-main>

    <AppFooter />
  </v-app>
</template>
```

## AI Prompts for Implementation

### Primary Prompt
```
Create comprehensive Vue 3 layout components for a D&D campaign management application using Vuetify 3. Include responsive app header with navigation and user menu, sidebar navigation, footer, breadcrumb navigation, loading states, and error handling. Implement mobile-friendly navigation with hamburger menu, glass morphism effects, and proper accessibility features. Use TypeScript and Composition API.
```

### Secondary Prompts
```
Generate responsive Vue 3 app header component with brand logo, main navigation, search functionality, and user menu dropdown. Include mobile hamburger menu, glass morphism effects, and proper accessibility attributes.

Create Vue 3 sidebar navigation component with collapsible rail mode, role-based menu items, and responsive behavior. Include proper navigation highlighting and accessibility features.

Generate Vue 3 layout system with responsive breakpoints, loading states, error boundaries, and proper content organization using Vuetify 3 components.
```

### Navigation Menu Structure
```typescript
// composables/useNavigation.ts
export const useNavigation = () => {
  const { user } = useAuthStore()
  
  const navigationItems = computed(() => [
    {
      title: 'Dashboard',
      icon: 'mdi-view-dashboard',
      to: '/dashboard',
      roles: ['Player', 'GameMaster', 'Admin']
    },
    {
      title: 'Campaigns',
      icon: 'mdi-castle',
      to: '/campaigns',
      roles: ['Player', 'GameMaster', 'Admin']
    },
    {
      title: 'Characters',
      icon: 'mdi-account-group',
      to: '/characters',
      roles: ['Player', 'GameMaster', 'Admin']
    },
    {
      title: 'Analytics',
      icon: 'mdi-chart-line',
      to: '/admin/analytics',
      roles: ['Admin'],
      subscription: ['Premium', 'Pro']
    }
  ])
  
  const filteredNavigation = computed(() =>
    navigationItems.value.filter(item => {
      const hasRole = item.roles.includes(user.value?.role)
      const hasSubscription = !item.subscription || 
        item.subscription.includes(user.value?.subscriptionTier)
      return hasRole && hasSubscription
    })
  )
  
  return { navigationItems: filteredNavigation }
}
```

### Responsive Breakpoints
```typescript
// composables/useBreakpoints.ts
export const useBreakpoints = () => {
  const { name } = useDisplay()
  
  const isMobile = computed(() => name.value === 'xs' || name.value === 'sm')
  const isTablet = computed(() => name.value === 'md')
  const isDesktop = computed(() => name.value === 'lg' || name.value === 'xl')
  
  const showSidebar = computed(() => !isMobile.value)
  const railMode = computed(() => isTablet.value)
  
  return {
    isMobile,
    isTablet,
    isDesktop,
    showSidebar,
    railMode
  }
}
```

### Loading and Error Components
```vue
<!-- components/ui/AppLoading.vue -->
<template>
  <div class="loading-container">
    <v-progress-circular
      :size="size"
      :width="4"
      color="primary"
      indeterminate
    />
    <p v-if="message" class="mt-4 text-center">
      {{ message }}
    </p>
  </div>
</template>

<!-- components/ui/AppError.vue -->
<template>
  <v-alert
    :type="type"
    :title="title"
    :text="message"
    :closable="dismissible"
    class="mb-4"
  >
    <template v-if="showRetry" #append>
      <v-btn
        variant="outlined"
        size="small"
        @click="$emit('retry')"
      >
        Retry
      </v-btn>
    </template>
  </v-alert>
</template>
```

## Glass Morphism Effects
```scss
// assets/styles/glass-effects.scss
.glass-effect {
  backdrop-filter: blur(20px) saturate(180%);
  background: rgba(var(--v-theme-surface), 0.8) !important;
  border: 1px solid rgba(var(--v-theme-outline), 0.12);
  
  &.premium {
    background: rgba(255, 255, 255, 0.1) !important;
    backdrop-filter: blur(20px) saturate(180%);
    border: 1px solid rgba(255, 255, 255, 0.2);
  }
}
```

## Accessibility Features
- **Keyboard Navigation**: Full keyboard accessibility for all interactive elements
- **Screen Reader Support**: Proper ARIA labels and semantic HTML
- **Focus Management**: Clear focus indicators and logical tab order
- **Color Contrast**: WCAG 2.1 AA compliant color combinations
- **Responsive Text**: Scalable fonts that respect user preferences

## Definition of Done
- [ ] App header displays correctly on all screen sizes
- [ ] Navigation menu shows appropriate items based on user role
- [ ] Mobile navigation works with hamburger menu
- [ ] Sidebar navigation collapses appropriately on tablet
- [ ] Loading states display during data fetching
- [ ] Error states provide helpful feedback to users
- [ ] Breadcrumb navigation shows current page context
- [ ] All components are fully accessible
- [ ] Glass morphism effects work correctly
- [ ] Layout adapts properly to different content types

## Dependencies
- **Depends on**: 01-nuxt-project-setup.md, 02-authentication-ui.md
- **Integrates with**: All application pages and features
- **Blocks**: Dashboard and feature implementation

## Estimated Effort
**6 hours** - Layout component implementation and responsive design
