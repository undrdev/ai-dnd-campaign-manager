<template>
  <div id="app">
    <VApp>
      <VMain>
        <NuxtPage />
      </VMain>
    </VApp>
  </div>
</template>

<script setup lang="ts">
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
