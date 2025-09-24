<template>
  <div id="app">
    <AppLayout
      :show-sidebar="showSidebar"
      :sidebar-permanent="sidebarPermanent"
      :show-breadcrumb="showBreadcrumb"
      :minimal-footer="minimalFooter"
      :show-theme-toggle="showThemeToggle"
      @toggle-theme="handleThemeToggle"
    >
      <NuxtPage />
    </AppLayout>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

const authStore = useAuthStore()
const route = useRoute()

// Layout configuration based on current route
const showSidebar = computed(() => {
  // Show sidebar for authenticated users, except on auth pages
  return authStore.isAuthenticated && !route.path.startsWith('/auth')
})

const sidebarPermanent = computed(() => {
  // Make sidebar permanent on dashboard and main app pages
  return authStore.isAuthenticated && ['/dashboard', '/campaigns', '/characters'].some(path => 
    route.path.startsWith(path)
  )
})

const showBreadcrumb = computed(() => {
  // Show breadcrumb for authenticated users, except on dashboard
  return authStore.isAuthenticated && route.path !== '/dashboard' && !route.path.startsWith('/auth')
})

const minimalFooter = computed(() => {
  // Use minimal footer on auth pages and dashboard
  return route.path.startsWith('/auth') || route.path === '/dashboard'
})

const showThemeToggle = computed(() => {
  // Show theme toggle FAB on all pages except auth
  return !route.path.startsWith('/auth')
})

// Theme handling
const handleThemeToggle = (isDark: boolean) => {
  // Additional theme toggle logic if needed
  console.log('Theme toggled to:', isDark ? 'dark' : 'light')
}

// Initialize auth state on app load
onMounted(() => {
  authStore.initializeAuth()
})

// Global app configuration
useHead({
  titleTemplate: (title) => {
    return title ? `${title} - D&D AI Campaign Manager` : 'D&D AI Campaign Manager'
  },
  meta: [
    {
      name: 'description',
      content: 'AI-powered D&D campaign management platform for Game Masters and players'
    },
    {
      name: 'keywords',
      content: 'D&D, Dungeons and Dragons, Campaign Manager, AI, Game Master, RPG'
    },
    {
      name: 'author',
      content: 'D&D AI Campaign Manager Team'
    },
    {
      property: 'og:type',
      content: 'website'
    },
    {
      property: 'og:title',
      content: 'D&D AI Campaign Manager'
    },
    {
      property: 'og:description',
      content: 'AI-powered D&D campaign management platform for Game Masters and players'
    },
    {
      name: 'twitter:card',
      content: 'summary_large_image'
    }
  ],
  link: [
    {
      rel: 'preconnect',
      href: 'https://fonts.googleapis.com'
    },
    {
      rel: 'preconnect',
      href: 'https://fonts.gstatic.com',
      crossorigin: ''
    },
    {
      rel: 'stylesheet',
      href: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Merriweather:wght@300;400;700&display=swap'
    }
  ]
})

// Global error handling
onErrorCaptured((error) => {
  console.error('Global error captured:', error)
  return false
})
</script>

<style>
/* Global styles are imported from assets/css/main.css */
/* Additional app-specific styles can be added here */

#app {
  min-height: 100vh;
}

/* Ensure proper scrolling behavior */
html {
  scroll-behavior: smooth;
}

/* Custom focus styles for better accessibility */
*:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
  border-radius: 4px;
}

/* Loading transition styles */
.page-enter-active,
.page-leave-active {
  transition: all 0.3s ease;
}

.page-enter-from,
.page-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

/* Layout transition styles */
.layout-enter-active,
.layout-leave-active {
  transition: all 0.3s ease;
}

.layout-enter-from,
.layout-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>
