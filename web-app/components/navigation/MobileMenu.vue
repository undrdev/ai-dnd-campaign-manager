<template>
  <VNavigationDrawer
    :model-value="modelValue"
    location="left"
    temporary
    width="300"
    class="mobile-menu"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <!-- Header -->
    <VList class="pa-0">
      <VListItem class="px-4 py-6 bg-primary">
        <template #prepend>
          <VAvatar size="48" :color="avatarColor">
            <span class="text-h6 font-weight-bold text-white">
              {{ userInitials }}
            </span>
          </VAvatar>
        </template>
        
        <VListItemTitle class="text-white font-weight-bold">
          {{ userFullName }}
        </VListItemTitle>
        <VListItemSubtitle class="text-white opacity-80">
          {{ user?.email }}
        </VListItemSubtitle>
        
        <template #append>
          <VBtn
            icon
            variant="text"
            color="white"
            size="small"
            @click="$emit('update:modelValue', false)"
          >
            <VIcon icon="mdi-close" />
          </VBtn>
        </template>
      </VListItem>
    </VList>

    <!-- Search Bar -->
    <div class="pa-4">
      <VTextField
        v-model="searchQuery"
        prepend-inner-icon="mdi-magnify"
        placeholder="Search campaigns, characters..."
        variant="outlined"
        density="compact"
        hide-details
        @keyup.enter="handleSearch"
      />
    </div>

    <VDivider />

    <!-- Navigation Items -->
    <VList density="compact" class="py-2">
      <VListItem
        v-for="item in filteredNavItems"
        :key="item.path"
        :prepend-icon="item.icon"
        :title="item.label"
        :active="isActiveRoute(item.path)"
        @click="navigateTo(item.path)"
      >
        <template v-if="item.badge" #append>
          <VChip
            :color="item.badgeColor || 'primary'"
            size="small"
            variant="tonal"
          >
            {{ item.badge }}
          </VChip>
        </template>
      </VListItem>
    </VList>

    <VDivider />

    <!-- Account Section -->
    <VList density="compact" class="py-2">
      <VListSubheader class="text-uppercase text-neutral-500 font-weight-bold">
        Account
      </VListSubheader>
      
      <VListItem
        prepend-icon="mdi-account"
        title="Profile Settings"
        @click="navigateToProfile"
      />
      
      <VListItem
        prepend-icon="mdi-bell"
        title="Notifications"
        @click="navigateToNotifications"
      >
        <template #append>
          <VChip
            v-if="unreadNotifications > 0"
            color="error"
            size="small"
          >
            {{ unreadNotifications }}
          </VChip>
        </template>
      </VListItem>
      
      <VListItem
        :prepend-icon="subscriptionIcon"
        :title="subscriptionTitle"
        @click="navigateToSubscription"
      >
        <template #append>
          <VChip
            v-if="user?.subscriptionTier === 'Free'"
            color="primary"
            size="small"
            variant="tonal"
          >
            Upgrade
          </VChip>
        </template>
      </VListItem>
    </VList>

    <VDivider />

    <!-- Settings Section -->
    <VList density="compact" class="py-2">
      <VListSubheader class="text-uppercase text-neutral-500 font-weight-bold">
        Settings
      </VListSubheader>
      
      <VListItem
        prepend-icon="mdi-cog"
        title="App Settings"
        @click="navigateToSettings"
      />
      
      <VListItem
        prepend-icon="mdi-help-circle"
        title="Help & Support"
        @click="navigateToHelp"
      />
      
      <!-- Theme Toggle -->
      <VListItem
        :prepend-icon="themeIcon"
        :title="themeTitle"
        @click="toggleTheme"
      >
        <template #append>
          <VSwitch
            :model-value="isDarkTheme"
            color="primary"
            density="compact"
            hide-details
            @update:model-value="toggleTheme"
          />
        </template>
      </VListItem>
      
      <!-- Admin Panel (if admin) -->
      <VListItem
        v-if="isAdmin"
        prepend-icon="mdi-shield-account"
        title="Admin Panel"
        @click="navigateToAdmin"
      />
    </VList>

    <!-- Footer -->
    <template #append>
      <div class="pa-4">
        <VDivider class="mb-4" />
        
        <!-- App Info -->
        <div class="text-center mb-4">
          <VIcon icon="mdi-dice-d20" size="24" color="primary" class="mb-2" />
          <div class="text-caption text-neutral-600">
            {{ appName }}
          </div>
          <div class="text-caption text-neutral-500">
            Version {{ appVersion }}
          </div>
        </div>
        
        <!-- Logout Button -->
        <VBtn
          color="error"
          variant="outlined"
          block
          prepend-icon="mdi-logout"
          @click="handleLogout"
        >
          Sign Out
        </VBtn>
      </div>
    </template>
  </VNavigationDrawer>
</template>

<script setup lang="ts">
interface NavigationItem {
  path: string
  label: string
  icon: string
  roles?: string[]
  subscriptionTiers?: string[]
  badge?: string
  badgeColor?: string
  exact?: boolean
}

// Props and emits
interface Props {
  modelValue: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

// Store and router
const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

// Config
const config = useRuntimeConfig()
const appName = config.public.appName || 'D&D AI Campaign Manager'
const appVersion = '1.0.0' // In real app, this could come from package.json

// User data
const user = computed(() => authStore.user)

// Reactive state
const searchQuery = ref('')
const isDarkTheme = ref(false)

// Navigation items (same as MainNavigation but with additional mobile-specific items)
const navigationItems: NavigationItem[] = [
  {
    path: '/dashboard',
    label: 'Dashboard',
    icon: 'mdi-view-dashboard',
    exact: true
  },
  {
    path: '/campaigns',
    label: 'My Campaigns',
    icon: 'mdi-castle',
    roles: ['GameMaster', 'Admin'],
    badge: '3'
  },
  {
    path: '/characters',
    label: 'My Characters',
    icon: 'mdi-account-group',
    badge: '5'
  },
  {
    path: '/ai-tools',
    label: 'AI Tools',
    icon: 'mdi-brain',
    subscriptionTiers: ['Premium', 'Pro'],
    badge: 'New',
    badgeColor: 'success'
  },
  {
    path: '/library',
    label: 'Content Library',
    icon: 'mdi-book-open-page-variant'
  },
  {
    path: '/sessions',
    label: 'Game Sessions',
    icon: 'mdi-calendar-clock'
  },
  {
    path: '/analytics',
    label: 'Campaign Analytics',
    icon: 'mdi-chart-line',
    subscriptionTiers: ['Pro'],
    roles: ['GameMaster', 'Admin']
  }
]

// Computed properties
const userFullName = computed(() => {
  if (!user.value) return 'User'
  return `${user.value.firstName} ${user.value.lastName}`.trim() || 'User'
})

const userInitials = computed(() => {
  if (!user.value) return 'U'
  const first = user.value.firstName?.charAt(0).toUpperCase() || ''
  const last = user.value.lastName?.charAt(0).toUpperCase() || ''
  return `${first}${last}` || 'U'
})

const avatarColor = computed(() => {
  const colors = ['secondary', 'success', 'info', 'warning']
  const index = (user.value?.firstName?.charCodeAt(0) || 0) % colors.length
  return colors[index]
})

const filteredNavItems = computed(() => {
  return navigationItems.filter(item => {
    // Check role requirements
    if (item.roles && item.roles.length > 0) {
      const userRole = user.value?.role
      if (!userRole || !item.roles.includes(userRole)) {
        return false
      }
    }

    // Check subscription tier requirements
    if (item.subscriptionTiers && item.subscriptionTiers.length > 0) {
      const userTier = user.value?.subscriptionTier
      if (!userTier || !item.subscriptionTiers.includes(userTier)) {
        return false
      }
    }

    return true
  })
})

const subscriptionIcon = computed(() => {
  const tier = user.value?.subscriptionTier
  switch (tier) {
    case 'Pro':
      return 'mdi-crown'
    case 'Premium':
      return 'mdi-star'
    default:
      return 'mdi-account'
  }
})

const subscriptionTitle = computed(() => {
  const tier = user.value?.subscriptionTier
  switch (tier) {
    case 'Pro':
      return 'Pro Subscription'
    case 'Premium':
      return 'Premium Plan'
    default:
      return 'Free Plan'
  }
})

const isAdmin = computed(() => user.value?.role === 'Admin')

const themeIcon = computed(() => isDarkTheme.value ? 'mdi-weather-night' : 'mdi-weather-sunny')
const themeTitle = computed(() => isDarkTheme.value ? 'Dark Theme' : 'Light Theme')

// Mock notification count
const unreadNotifications = ref(3)

// Methods
const navigateTo = (path: string) => {
  router.push(path)
  emit('update:modelValue', false) // Close drawer after navigation
}

const isActiveRoute = (path: string) => {
  const currentPath = route.path
  return path === '/dashboard' 
    ? currentPath === path 
    : currentPath.startsWith(path)
}

const handleSearch = () => {
  if (searchQuery.value.trim()) {
    router.push(`/search?q=${encodeURIComponent(searchQuery.value)}`)
    emit('update:modelValue', false)
  }
}

const navigateToProfile = () => navigateTo('/profile')
const navigateToNotifications = () => navigateTo('/notifications')
const navigateToSubscription = () => navigateTo('/subscription')
const navigateToSettings = () => navigateTo('/settings')
const navigateToHelp = () => navigateTo('/help')
const navigateToAdmin = () => navigateTo('/admin')

const toggleTheme = () => {
  isDarkTheme.value = !isDarkTheme.value
  // In a real app, this would update the global theme
}

const handleLogout = async () => {
  try {
    await authStore.logout()
    emit('update:modelValue', false)
  } catch (error) {
    console.error('Logout error:', error)
  }
}
</script>

<style scoped>
.mobile-menu {
  z-index: 1000;
}

/* Header styling */
:deep(.v-list-item.bg-primary) {
  background: linear-gradient(135deg, var(--v-theme-primary), var(--v-theme-primary-darken-1));
}

/* Navigation item styling */
:deep(.v-list-item) {
  border-radius: 8px;
  margin: 2px 12px;
}

:deep(.v-list-item:hover) {
  background-color: rgba(0, 0, 0, 0.04);
}

:deep(.v-list-item--active) {
  background-color: rgba(var(--v-theme-primary-rgb), 0.08);
  color: var(--v-theme-primary);
}

:deep(.v-list-item--active .v-icon) {
  color: var(--v-theme-primary);
}

/* Subheader styling */
:deep(.v-list-subheader) {
  font-size: 0.75rem;
  letter-spacing: 0.5px;
  padding-top: 16px;
  padding-bottom: 8px;
}

/* Switch styling */
:deep(.v-switch) {
  flex: none;
}

/* Footer styling */
:deep(.v-navigation-drawer__append) {
  border-top: 1px solid rgba(0, 0, 0, 0.12);
}

/* Badge styling */
:deep(.v-chip) {
  font-size: 0.75rem;
  height: 20px;
}
</style>
