<template>
  <VAppBar
    :elevation="2"
    color="primary"
    density="comfortable"
    class="app-header"
  >
    <!-- Mobile Menu Button -->
    <VAppBarNavIcon
      v-if="$vuetify.display.mobile"
      @click="toggleMobileDrawer"
      class="d-md-none"
    >
      <VIcon icon="mdi-menu" />
    </VAppBarNavIcon>

    <!-- Logo and Brand -->
    <VAppBarTitle class="d-flex align-center cursor-pointer" @click="navigateToHome">
      <VIcon icon="mdi-dice-d20" size="32" class="mr-3" />
      <div class="d-flex flex-column">
        <span class="text-h6 font-weight-bold">{{ appName }}</span>
        <span v-if="!$vuetify.display.mobile" class="text-caption opacity-80">
          AI-Powered Campaign Management
        </span>
      </div>
    </VAppBarTitle>

    <VSpacer />

    <!-- Desktop Navigation -->
    <template v-if="!$vuetify.display.mobile && authStore.isAuthenticated">
      <MainNavigation />
    </template>

    <!-- Search Bar (Desktop) -->
    <VTextField
      v-if="!$vuetify.display.mobile && authStore.isAuthenticated"
      v-model="searchQuery"
      prepend-inner-icon="mdi-magnify"
      placeholder="Search campaigns, characters..."
      variant="outlined"
      density="compact"
      hide-details
      class="mx-4"
      style="max-width: 300px;"
      @keyup.enter="handleSearch"
    />

    <!-- Notifications -->
    <VBtn
      v-if="authStore.isAuthenticated"
      icon
      variant="text"
      class="mr-2"
      @click="toggleNotifications"
    >
      <VBadge
        :content="notificationCount"
        :model-value="notificationCount > 0"
        color="error"
        offset-x="10"
        offset-y="10"
      >
        <VIcon icon="mdi-bell" />
      </VBadge>
    </VBtn>

    <!-- User Menu -->
    <UserMenu v-if="authStore.isAuthenticated" />

    <!-- Auth Buttons (Not Authenticated) -->
    <div v-else class="d-flex gap-2">
      <VBtn
        color="secondary"
        variant="outlined"
        @click="navigateToLogin"
      >
        Sign In
      </VBtn>
      <VBtn
        color="secondary"
        variant="flat"
        @click="navigateToRegister"
      >
        Get Started
      </VBtn>
    </div>
  </VAppBar>

  <!-- Notifications Drawer -->
  <VNavigationDrawer
    v-model="notificationsDrawer"
    location="right"
    temporary
    width="400"
  >
    <VList>
      <VListItem>
        <VListItemTitle class="text-h6 font-weight-bold">
          Notifications
        </VListItemTitle>
        <template #append>
          <VBtn
            icon="mdi-close"
            variant="text"
            size="small"
            @click="notificationsDrawer = false"
          />
        </template>
      </VListItem>
      <VDivider />
      
      <!-- Notification Items -->
      <VListItem
        v-for="notification in notifications"
        :key="notification.id"
        :class="{ 'bg-blue-50': !notification.read }"
        @click="markAsRead(notification.id)"
      >
        <template #prepend>
          <VAvatar :color="notification.type" size="small">
            <VIcon :icon="notification.icon" size="16" />
          </VAvatar>
        </template>
        <VListItemTitle class="text-body-2">
          {{ notification.title }}
        </VListItemTitle>
        <VListItemSubtitle class="text-caption">
          {{ notification.message }}
        </VListItemSubtitle>
        <template #append>
          <span class="text-caption text-neutral-500">
            {{ formatTime(notification.createdAt) }}
          </span>
        </template>
      </VListItem>

      <!-- Empty State -->
      <VListItem v-if="notifications.length === 0" class="text-center py-8">
        <VListItemTitle class="text-neutral-500">
          <VIcon icon="mdi-bell-off" size="48" class="mb-2 opacity-60" />
          <div>No notifications</div>
        </VListItemTitle>
      </VListItem>
    </VList>
  </VNavigationDrawer>
</template>

<script setup lang="ts">
interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  icon: string
  title: string
  message: string
  read: boolean
  createdAt: Date
}

// Props
interface Props {
  modelValue?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false
})

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'toggle-mobile-drawer': []
}>()

// Store and router
const authStore = useAuthStore()
const router = useRouter()
const { $vuetify } = useNuxtApp()

// Config
const config = useRuntimeConfig()
const appName = config.public.appName || 'D&D AI Campaign Manager'

// Reactive state
const searchQuery = ref('')
const notificationsDrawer = ref(false)

// Mock notifications (in real app, this would come from a store/API)
const notifications = ref<Notification[]>([
  {
    id: '1',
    type: 'info',
    icon: 'mdi-account-plus',
    title: 'New Player Joined',
    message: 'Sarah joined your campaign "The Lost Mines"',
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 30) // 30 minutes ago
  },
  {
    id: '2',
    type: 'success',
    icon: 'mdi-dice-d20',
    title: 'Session Complete',
    message: 'Session 5 of "Dragon Heist" has been completed',
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2) // 2 hours ago
  }
])

// Computed
const notificationCount = computed(() => 
  notifications.value.filter(n => !n.read).length
)

// Methods
const toggleMobileDrawer = () => {
  emit('toggle-mobile-drawer')
}

const navigateToHome = () => {
  if (authStore.isAuthenticated) {
    router.push('/dashboard')
  } else {
    router.push('/')
  }
}

const navigateToLogin = () => {
  router.push('/auth/login')
}

const navigateToRegister = () => {
  router.push('/auth/register')
}

const handleSearch = () => {
  if (searchQuery.value.trim()) {
    router.push(`/search?q=${encodeURIComponent(searchQuery.value)}`)
  }
}

const toggleNotifications = () => {
  notificationsDrawer.value = !notificationsDrawer.value
}

const markAsRead = (notificationId: string) => {
  const notification = notifications.value.find(n => n.id === notificationId)
  if (notification) {
    notification.read = true
  }
}

const formatTime = (date: Date) => {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (minutes < 60) {
    return `${minutes}m ago`
  } else if (hours < 24) {
    return `${hours}h ago`
  } else {
    return `${days}d ago`
  }
}

// Watch for mobile drawer changes
watch(() => props.modelValue, (newValue) => {
  if (newValue !== undefined) {
    // Handle mobile drawer state if needed
  }
})
</script>

<style scoped>
.app-header {
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
}

.cursor-pointer {
  cursor: pointer;
}

.gap-2 {
  gap: 0.5rem;
}

/* Ensure proper z-index for notifications */
:deep(.v-overlay__content) {
  z-index: 2001;
}

/* Custom search field styling */
:deep(.v-field--variant-outlined .v-field__outline) {
  color: rgba(255, 255, 255, 0.3);
}

:deep(.v-field--variant-outlined .v-field__input) {
  color: white;
}

:deep(.v-field--variant-outlined .v-field__input::placeholder) {
  color: rgba(255, 255, 255, 0.7);
}

/* Notification badge positioning */
:deep(.v-badge__badge) {
  font-size: 0.75rem;
  min-width: 18px;
  height: 18px;
}
</style>
