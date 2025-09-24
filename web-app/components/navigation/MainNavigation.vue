<template>
  <div class="d-flex align-center">
    <!-- Navigation Tabs -->
    <VTabs
      v-model="activeTab"
      color="white"
      slider-color="secondary"
      density="compact"
      class="main-navigation"
    >
      <VTab
        v-for="item in visibleNavItems"
        :key="item.path"
        :value="item.path"
        :prepend-icon="item.icon"
        class="text-none font-weight-medium"
        @click="navigateTo(item.path)"
      >
        {{ item.label }}
      </VTab>
    </VTabs>

    <!-- More Menu (for additional items) -->
    <VMenu v-if="moreNavItems.length > 0" offset-y>
      <template #activator="{ props }">
        <VBtn
          v-bind="props"
          icon
          variant="text"
          color="white"
          class="ml-2"
        >
          <VIcon icon="mdi-dots-horizontal" />
        </VBtn>
      </template>
      
      <VList density="compact">
        <VListItem
          v-for="item in moreNavItems"
          :key="item.path"
          :prepend-icon="item.icon"
          :title="item.label"
          @click="navigateTo(item.path)"
        />
      </VList>
    </VMenu>
  </div>
</template>

<script setup lang="ts">
interface NavigationItem {
  path: string
  label: string
  icon: string
  roles?: string[]
  subscriptionTiers?: string[]
  exact?: boolean
}

// Store and router
const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

// Navigation items configuration
const navigationItems: NavigationItem[] = [
  {
    path: '/dashboard',
    label: 'Dashboard',
    icon: 'mdi-view-dashboard',
    exact: true
  },
  {
    path: '/campaigns',
    label: 'Campaigns',
    icon: 'mdi-castle',
    roles: ['GameMaster', 'Admin']
  },
  {
    path: '/characters',
    label: 'Characters',
    icon: 'mdi-account-group'
  },
  {
    path: '/ai-tools',
    label: 'AI Tools',
    icon: 'mdi-brain',
    subscriptionTiers: ['Premium', 'Pro']
  },
  {
    path: '/library',
    label: 'Library',
    icon: 'mdi-book-open-page-variant'
  },
  {
    path: '/analytics',
    label: 'Analytics',
    icon: 'mdi-chart-line',
    subscriptionTiers: ['Pro'],
    roles: ['GameMaster', 'Admin']
  },
  {
    path: '/settings',
    label: 'Settings',
    icon: 'mdi-cog'
  }
]

// Computed properties
const filteredNavItems = computed(() => {
  return navigationItems.filter(item => {
    // Check role requirements
    if (item.roles && item.roles.length > 0) {
      const userRole = authStore.user?.role
      if (!userRole || !item.roles.includes(userRole)) {
        return false
      }
    }

    // Check subscription tier requirements
    if (item.subscriptionTiers && item.subscriptionTiers.length > 0) {
      const userTier = authStore.user?.subscriptionTier
      if (!userTier || !item.subscriptionTiers.includes(userTier)) {
        return false
      }
    }

    return true
  })
})

// Split items for main tabs and more menu based on screen size
const maxVisibleItems = computed(() => {
  // Adjust based on screen size
  return 5 // Can be made reactive based on screen width
})

const visibleNavItems = computed(() => {
  return filteredNavItems.value.slice(0, maxVisibleItems.value)
})

const moreNavItems = computed(() => {
  return filteredNavItems.value.slice(maxVisibleItems.value)
})

// Active tab tracking
const activeTab = computed(() => {
  const currentPath = route.path
  
  // Find exact match first
  const exactMatch = navigationItems.find(item => 
    item.exact ? item.path === currentPath : currentPath.startsWith(item.path)
  )
  
  if (exactMatch) {
    return exactMatch.path
  }
  
  // Find best match by longest path
  const matches = navigationItems
    .filter(item => currentPath.startsWith(item.path))
    .sort((a, b) => b.path.length - a.path.length)
  
  return matches[0]?.path || '/dashboard'
})

// Methods
const navigateTo = (path: string) => {
  if (route.path !== path) {
    router.push(path)
  }
}

// Watch for route changes to update active tab
watch(() => route.path, () => {
  // Active tab is computed, so it will update automatically
})
</script>

<style scoped>
.main-navigation {
  height: 48px;
}

/* Custom tab styling for the header */
:deep(.v-tab) {
  color: rgba(255, 255, 255, 0.8) !important;
  font-size: 0.875rem;
  min-width: auto;
  padding: 0 16px;
}

:deep(.v-tab--selected) {
  color: white !important;
}

:deep(.v-tab:hover) {
  color: white !important;
  background-color: rgba(255, 255, 255, 0.1);
}

:deep(.v-tabs__slider) {
  background-color: var(--v-theme-secondary) !important;
  height: 3px;
}

/* Icon spacing */
:deep(.v-tab .v-icon) {
  margin-right: 8px;
}

/* Responsive adjustments */
@media (max-width: 1200px) {
  :deep(.v-tab) {
    padding: 0 12px;
    font-size: 0.8125rem;
  }
}

@media (max-width: 960px) {
  :deep(.v-tab) {
    padding: 0 8px;
  }
  
  :deep(.v-tab .v-icon) {
    margin-right: 4px;
  }
}
</style>
