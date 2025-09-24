<template>
  <VApp :theme="theme.global.name.value">
    <!-- App Header -->
    <AppHeader 
      @toggle-mobile-drawer="toggleMobileDrawer"
    />

    <!-- Mobile Navigation Drawer -->
    <MobileMenu 
      v-model="mobileDrawer"
    />

    <!-- Desktop Sidebar (if enabled) -->
    <AppSidebar
      v-if="showSidebar"
      v-model="sidebarOpen"
      :permanent="sidebarPermanent"
      :rail="sidebarRail"
      :collapsible="sidebarCollapsible"
      @update:rail="sidebarRail = $event"
    />

    <!-- Main Content Area -->
    <VMain :class="mainClass">
      <VContainer 
        :fluid="fluidContainer"
        :class="[
          'main-container',
          {
            'main-container--with-sidebar': showSidebar && sidebarOpen,
            'main-container--padded': padded
          }
        ]"
      >
        <!-- Breadcrumb Navigation -->
        <div v-if="showBreadcrumb" class="mb-6">
          <AppBreadcrumb 
            :items="breadcrumbItems"
            :actions="breadcrumbActions"
          />
        </div>

        <!-- Page Loading State -->
        <AppLoading
          v-if="loading"
          :type="loadingType"
          :title="loadingTitle"
          :message="loadingMessage"
          :progress="loadingProgress"
          :cancellable="loadingCancellable"
          @cancel="$emit('cancel-loading')"
        />

        <!-- Error State -->
        <AppError
          v-else-if="error"
          :type="errorType"
          :title="errorTitle"
          :message="errorMessage"
          :error="errorDetails"
          :primary-action="errorPrimaryAction"
          :secondary-actions="errorSecondaryActions"
          :suggestions="errorSuggestions"
          @retry="$emit('retry')"
          @report="$emit('report-error', $event)"
        />

        <!-- Main Content Slot -->
        <div v-else class="main-content">
          <slot />
        </div>
      </VContainer>
    </VMain>

    <!-- App Footer -->
    <AppFooter 
      :minimal="minimalFooter"
      :color="footerColor"
    />

    <!-- Global Notification System -->
    <VSnackbar
      v-model="notification.show"
      :color="notification.color"
      :timeout="notification.timeout"
      :location="notification.location"
      :multi-line="notification.multiLine"
    >
      <div class="d-flex align-center">
        <VIcon 
          v-if="notification.icon" 
          :icon="notification.icon" 
          class="mr-3" 
        />
        <div class="flex-grow-1">
          <div v-if="notification.title" class="font-weight-bold">
            {{ notification.title }}
          </div>
          {{ notification.message }}
        </div>
        <VBtn
          v-if="notification.action"
          :color="notification.actionColor || 'white'"
          variant="text"
          size="small"
          @click="notification.action.handler"
        >
          {{ notification.action.text }}
        </VBtn>
      </div>
      
      <template #actions>
        <VBtn
          color="white"
          variant="text"
          icon="mdi-close"
          size="small"
          @click="notification.show = false"
        />
      </template>
    </VSnackbar>

    <!-- Theme Toggle FAB (optional) -->
    <VFab
      v-if="showThemeToggle"
      :icon="themeIcon"
      location="bottom end"
      size="small"
      :color="theme.global.current.value.dark ? 'warning' : 'primary'"
      @click="toggleTheme"
    />
  </VApp>
</template>

<script setup lang="ts">
interface BreadcrumbItem {
  title: string
  to?: string
  href?: string
  icon?: string
  disabled?: boolean
  exact?: boolean
}

interface BreadcrumbAction {
  text: string
  icon?: string
  handler: () => void
  color?: string
  variant?: 'flat' | 'outlined' | 'text'
}

interface ErrorAction {
  text: string
  handler: () => void
  icon?: string
  color?: string
  variant?: 'flat' | 'outlined' | 'text'
  loading?: boolean
}

interface NotificationAction {
  text: string
  handler: () => void
}

interface Notification {
  show: boolean
  title?: string
  message: string
  color?: string
  icon?: string
  timeout?: number
  location?: 'top' | 'bottom' | 'left' | 'right'
  multiLine?: boolean
  action?: NotificationAction
  actionColor?: string
}

interface Props {
  // Layout configuration
  showSidebar?: boolean
  sidebarPermanent?: boolean
  sidebarCollapsible?: boolean
  fluidContainer?: boolean
  padded?: boolean
  minimalFooter?: boolean
  footerColor?: string
  
  // Content state
  loading?: boolean
  loadingType?: 'circular' | 'linear' | 'dots' | 'dice'
  loadingTitle?: string
  loadingMessage?: string
  loadingProgress?: number
  loadingCancellable?: boolean
  
  // Error state
  error?: boolean
  errorType?: 'error' | 'warning' | 'info' | '404' | '500' | 'network' | 'auth'
  errorTitle?: string
  errorMessage?: string
  errorDetails?: any
  errorPrimaryAction?: ErrorAction
  errorSecondaryActions?: ErrorAction[]
  errorSuggestions?: string[]
  
  // Breadcrumb
  showBreadcrumb?: boolean
  breadcrumbItems?: BreadcrumbItem[]
  breadcrumbActions?: BreadcrumbAction[]
  
  // Theme
  showThemeToggle?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showSidebar: true,
  sidebarPermanent: false,
  sidebarCollapsible: true,
  fluidContainer: false,
  padded: true,
  minimalFooter: false,
  footerColor: 'neutral-900',
  loading: false,
  loadingType: 'circular',
  loadingCancellable: false,
  error: false,
  errorType: 'error',
  errorSecondaryActions: () => [],
  errorSuggestions: () => [],
  showBreadcrumb: true,
  breadcrumbItems: () => [],
  breadcrumbActions: () => [],
  showThemeToggle: false
})

// Emits
const emit = defineEmits<{
  'cancel-loading': []
  'retry': []
  'report-error': [error: any]
  'toggle-sidebar': [open: boolean]
  'toggle-theme': [dark: boolean]
}>()

// Vuetify theme
import { useTheme } from 'vuetify'
const theme = useTheme()
const { $vuetify } = useNuxtApp() as any

// Reactive state
const mobileDrawer = ref(false)
const sidebarOpen = ref(true)
const sidebarRail = ref(false)

// Notification system
const notification = reactive<Notification>({
  show: false,
  message: '',
  timeout: 5000,
  location: 'top'
})

// Computed properties
const mainClass = computed(() => ({
  'main--with-sidebar': props.showSidebar && sidebarOpen.value && !sidebarRail.value,
  'main--with-rail': props.showSidebar && sidebarOpen.value && sidebarRail.value
}))

const themeIcon = computed(() => 
  theme.global.current.value.dark ? 'mdi-white-balance-sunny' : 'mdi-weather-night'
)

// Methods
const toggleMobileDrawer = () => {
  mobileDrawer.value = !mobileDrawer.value
}

const toggleTheme = () => {
  const newTheme = theme.global.current.value.dark ? 'dndLight' : 'dndDark'
  theme.global.name.value = newTheme
  
  // Store theme preference
  localStorage.setItem('theme', newTheme)
  
  emit('toggle-theme', !theme.global.current.value.dark)
}

// Notification methods
const showNotification = (options: Partial<Notification>) => {
  Object.assign(notification, {
    show: true,
    timeout: 5000,
    location: 'top',
    ...options
  })
}

const hideNotification = () => {
  notification.show = false
}

// Sidebar methods
const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value
  emit('toggle-sidebar', sidebarOpen.value)
}

const setSidebarRail = (rail: boolean) => {
  sidebarRail.value = rail
}

// Responsive handling
const handleResize = () => {
  if ($vuetify.display.mobile.value) {
    sidebarOpen.value = false
  } else if (props.sidebarPermanent) {
    sidebarOpen.value = true
  }
}

// Watch for mobile changes
watch(() => $vuetify.display.mobile.value, (isMobile) => {
  if (isMobile) {
    sidebarOpen.value = false
  } else if (props.sidebarPermanent) {
    sidebarOpen.value = true
  }
})

// Initialize theme from localStorage
onMounted(() => {
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme) {
    theme.global.name.value = savedTheme
  }
  
  // Handle initial responsive state
  handleResize()
  
  // Add resize listener
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

// Expose methods for parent components
defineExpose({
  showNotification,
  hideNotification,
  toggleSidebar,
  setSidebarRail,
  toggleTheme
})
</script>

<style scoped>
.main-container {
  min-height: calc(100vh - 64px - 120px); /* Adjust based on header and footer height */
  transition: all 0.3s ease;
}

.main-container--padded {
  padding-top: 2rem;
  padding-bottom: 2rem;
}

.main-container--with-sidebar {
  /* Additional styles when sidebar is open */
}

.main-content {
  width: 100%;
}

/* Main area adjustments for sidebar */
:deep(.v-main) {
  transition: all 0.3s ease;
}

.main--with-sidebar :deep(.v-main) {
  /* Styles when sidebar is expanded */
}

.main--with-rail :deep(.v-main) {
  /* Styles when sidebar is in rail mode */
}

/* Responsive adjustments */
@media (max-width: 960px) {
  .main-container--padded {
    padding-top: 1rem;
    padding-bottom: 1rem;
  }
}

/* Smooth transitions */
* {
  transition: margin 0.3s ease, padding 0.3s ease;
}

/* Custom notification styling */
:deep(.v-snackbar__content) {
  padding: 16px;
}

/* FAB positioning */
:deep(.v-fab) {
  margin: 16px;
}

/* Loading and error state styling */
.main-content {
  position: relative;
}
</style>
