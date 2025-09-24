<template>
  <VMenu offset-y min-width="280">
    <template #activator="{ props }">
      <VBtn
        v-bind="props"
        variant="text"
        class="user-menu-trigger"
      >
        <VAvatar size="36" :color="avatarColor">
          <VImg
            v-if="user?.profileImage"
            :src="user.profileImage"
            :alt="userFullName"
          />
          <span v-else class="text-h6 font-weight-bold">
            {{ userInitials }}
          </span>
        </VAvatar>
        
        <VIcon 
          icon="mdi-chevron-down" 
          size="16" 
          class="ml-2 transition-transform"
          :class="{ 'rotate-180': false }"
        />
      </VBtn>
    </template>
    
    <VCard elevation="8" class="user-menu-card">
      <!-- User Info Header -->
      <VCardText class="pb-0">
        <div class="d-flex align-center mb-3">
          <VAvatar size="48" :color="avatarColor" class="mr-3">
            <VImg
              v-if="user?.profileImage"
              :src="user.profileImage"
              :alt="userFullName"
            />
            <span v-else class="text-h6 font-weight-bold">
              {{ userInitials }}
            </span>
          </VAvatar>
          
          <div class="flex-grow-1">
            <h3 class="text-h6 font-weight-bold mb-1">
              {{ userFullName }}
            </h3>
            <p class="text-body-2 text-neutral-600 mb-1">
              {{ user?.email }}
            </p>
            <div class="d-flex align-center gap-2">
              <VChip
                :color="roleColor"
                size="small"
                variant="tonal"
              >
                <VIcon :icon="roleIcon" size="14" class="mr-1" />
                {{ user?.role }}
              </VChip>
              <VChip
                :color="subscriptionColor"
                size="small"
                variant="tonal"
              >
                <VIcon :icon="subscriptionIcon" size="14" class="mr-1" />
                {{ user?.subscriptionTier }}
              </VChip>
            </div>
          </div>
        </div>
      </VCardText>
      
      <VDivider />
      
      <!-- Menu Items -->
      <VList density="compact" class="py-2">
        <!-- Profile Section -->
        <VListItem
          prepend-icon="mdi-account"
          title="Profile Settings"
          subtitle="Manage your account"
          @click="navigateToProfile"
        />
        
        <VListItem
          prepend-icon="mdi-bell"
          title="Notifications"
          subtitle="Manage notifications"
          @click="navigateToNotifications"
        >
          <template #append>
            <VChip
              v-if="unreadNotifications > 0"
              color="error"
              size="x-small"
              class="ml-2"
            >
              {{ unreadNotifications }}
            </VChip>
          </template>
        </VListItem>
        
        <VDivider class="my-2" />
        
        <!-- Subscription Section -->
        <VListItem
          :prepend-icon="subscriptionIcon"
          :title="subscriptionTitle"
          :subtitle="subscriptionSubtitle"
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
        
        <VDivider class="my-2" />
        
        <!-- App Settings -->
        <VListItem
          prepend-icon="mdi-cog"
          title="Settings"
          subtitle="App preferences"
          @click="navigateToSettings"
        />
        
        <VListItem
          prepend-icon="mdi-help-circle"
          title="Help & Support"
          subtitle="Get help"
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
        
        <VDivider class="my-2" />
        
        <!-- Admin Section (if admin) -->
        <template v-if="isAdmin">
          <VListItem
            prepend-icon="mdi-shield-account"
            title="Admin Panel"
            subtitle="System administration"
            @click="navigateToAdmin"
          />
          <VDivider class="my-2" />
        </template>
        
        <!-- Logout -->
        <VListItem
          prepend-icon="mdi-logout"
          title="Sign Out"
          class="text-error"
          @click="handleLogout"
        />
      </VList>
    </VCard>
  </VMenu>
</template>

<script setup lang="ts">
// Store and router
const authStore = useAuthStore()
const router = useRouter()
const { $vuetify } = useNuxtApp()

// User data
const user = computed(() => authStore.user)

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
  const colors = ['primary', 'secondary', 'success', 'info', 'warning']
  const index = (user.value?.firstName?.charCodeAt(0) || 0) % colors.length
  return colors[index]
})

const roleColor = computed(() => {
  const role = user.value?.role
  switch (role) {
    case 'Admin':
      return 'error'
    case 'GameMaster':
      return 'warning'
    case 'Player':
      return 'info'
    default:
      return 'neutral'
  }
})

const roleIcon = computed(() => {
  const role = user.value?.role
  switch (role) {
    case 'Admin':
      return 'mdi-shield-crown'
    case 'GameMaster':
      return 'mdi-sword'
    case 'Player':
      return 'mdi-account'
    default:
      return 'mdi-account'
  }
})

const subscriptionColor = computed(() => {
  const tier = user.value?.subscriptionTier
  switch (tier) {
    case 'Pro':
      return 'success'
    case 'Premium':
      return 'warning'
    case 'Free':
      return 'neutral'
    default:
      return 'neutral'
  }
})

const subscriptionIcon = computed(() => {
  const tier = user.value?.subscriptionTier
  switch (tier) {
    case 'Pro':
      return 'mdi-crown'
    case 'Premium':
      return 'mdi-star'
    case 'Free':
      return 'mdi-account'
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
      return 'Premium Subscription'
    case 'Free':
      return 'Free Plan'
    default:
      return 'Subscription'
  }
})

const subscriptionSubtitle = computed(() => {
  const tier = user.value?.subscriptionTier
  switch (tier) {
    case 'Pro':
      return 'All features unlocked'
    case 'Premium':
      return 'Advanced features'
    case 'Free':
      return 'Upgrade for more features'
    default:
      return 'Manage subscription'
  }
})

const isAdmin = computed(() => user.value?.role === 'Admin')

// Theme management
const isDarkTheme = ref(false)

const themeIcon = computed(() => isDarkTheme.value ? 'mdi-weather-night' : 'mdi-weather-sunny')
const themeTitle = computed(() => isDarkTheme.value ? 'Dark Theme' : 'Light Theme')

// Mock notification count (in real app, this would come from a store)
const unreadNotifications = ref(3)

// Methods
const navigateToProfile = () => {
  router.push('/profile')
}

const navigateToNotifications = () => {
  router.push('/notifications')
}

const navigateToSubscription = () => {
  router.push('/subscription')
}

const navigateToSettings = () => {
  router.push('/settings')
}

const navigateToHelp = () => {
  router.push('/help')
}

const navigateToAdmin = () => {
  router.push('/admin')
}

const toggleTheme = () => {
  isDarkTheme.value = !isDarkTheme.value
  // In a real app, this would update the global theme
  // $vuetify.theme.global.name = isDarkTheme.value ? 'dndDarkTheme' : 'dndTheme'
}

const handleLogout = async () => {
  try {
    await authStore.logout()
    // The auth store handles the redirect
  } catch (error) {
    console.error('Logout error:', error)
  }
}

// Initialize theme on mount
onMounted(() => {
  // Get theme from localStorage or system preference
  isDarkTheme.value = false // Default to light theme
})
</script>

<style scoped>
.user-menu-trigger {
  color: white !important;
  text-transform: none;
}

.user-menu-card {
  min-width: 280px;
  max-width: 320px;
}

.gap-2 {
  gap: 0.5rem;
}

/* Smooth rotation animation */
.transition-transform {
  transition: transform 0.2s ease;
}

.rotate-180 {
  transform: rotate(180deg);
}

/* Custom list item styling */
:deep(.v-list-item) {
  border-radius: 8px;
  margin: 2px 8px;
}

:deep(.v-list-item:hover) {
  background-color: rgba(0, 0, 0, 0.04);
}

:deep(.v-list-item.text-error:hover) {
  background-color: rgba(244, 67, 54, 0.08);
}

/* Avatar styling */
:deep(.v-avatar) {
  border: 2px solid rgba(255, 255, 255, 0.2);
}

/* Switch styling */
:deep(.v-switch) {
  flex: none;
}

/* Chip styling */
:deep(.v-chip) {
  font-size: 0.75rem;
}
</style>
