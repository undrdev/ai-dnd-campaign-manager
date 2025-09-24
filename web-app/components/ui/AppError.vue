<template>
  <div 
    :class="[
      'app-error',
      {
        'app-error--fullscreen': fullscreen,
        'app-error--compact': compact
      }
    ]"
  >
    <VCard 
      :elevation="fullscreen ? 0 : 3"
      :class="[
        'app-error__card',
        {
          'app-error__card--fullscreen': fullscreen
        }
      ]"
    >
      <VCardText class="text-center pa-8">
        <!-- Error Icon -->
        <div class="app-error__icon mb-6">
          <VIcon
            :icon="errorIcon"
            :size="compact ? 48 : 80"
            :color="errorColor"
            class="mb-2"
          />
        </div>
        
        <!-- Error Title -->
        <h2 
          :class="[
            'font-weight-bold mb-4',
            compact ? 'text-h6' : 'text-h4'
          ]"
          :style="{ color: `var(--v-theme-${errorColor})` }"
        >
          {{ errorTitle }}
        </h2>
        
        <!-- Error Message -->
        <p 
          :class="[
            'text-neutral-600 mb-6',
            compact ? 'text-body-2' : 'text-body-1'
          ]"
        >
          {{ errorMessage }}
        </p>
        
        <!-- Error Details (expandable) -->
        <div v-if="errorDetails && showDetails" class="app-error__details mb-6">
          <VExpansionPanels variant="accordion" class="elevation-0">
            <VExpansionPanel>
              <VExpansionPanelTitle class="text-body-2 font-weight-medium">
                <VIcon icon="mdi-information" class="mr-2" size="16" />
                Error Details
              </VExpansionPanelTitle>
              <VExpansionPanelText>
                <div class="app-error__details-content">
                  <pre class="text-caption text-left">{{ formattedErrorDetails }}</pre>
                </div>
              </VExpansionPanelText>
            </VExpansionPanel>
          </VExpansionPanels>
        </div>
        
        <!-- Suggested Actions -->
        <div v-if="suggestions.length > 0" class="app-error__suggestions mb-6">
          <h3 class="text-h6 font-weight-medium mb-4">Try these solutions:</h3>
          <VList density="compact" class="bg-transparent">
            <VListItem
              v-for="(suggestion, index) in suggestions"
              :key="index"
              class="px-0"
            >
              <template #prepend>
                <VIcon 
                  icon="mdi-lightbulb" 
                  size="16" 
                  color="warning" 
                  class="mr-3"
                />
              </template>
              <VListItemTitle class="text-body-2">
                {{ suggestion }}
              </VListItemTitle>
            </VListItem>
          </VList>
        </div>
        
        <!-- Action Buttons -->
        <div class="app-error__actions">
          <div class="d-flex flex-column flex-sm-row gap-3 justify-center">
            <!-- Primary Action -->
            <VBtn
              v-if="primaryAction"
              :color="primaryAction.color || 'primary'"
              :variant="primaryAction.variant || 'flat'"
              :size="compact ? 'default' : 'large'"
              :loading="primaryAction.loading"
              @click="handlePrimaryAction"
            >
              <VIcon v-if="primaryAction.icon" :icon="primaryAction.icon" class="mr-2" />
              {{ primaryAction.text }}
            </VBtn>
            
            <!-- Secondary Actions -->
            <VBtn
              v-for="action in secondaryActions"
              :key="action.text"
              :color="action.color || 'neutral'"
              :variant="action.variant || 'outlined'"
              :size="compact ? 'default' : 'large'"
              :loading="action.loading"
              @click="action.handler"
            >
              <VIcon v-if="action.icon" :icon="action.icon" class="mr-2" />
              {{ action.text }}
            </VBtn>
          </div>
          
          <!-- Additional Actions -->
          <div v-if="showAdditionalActions" class="mt-4">
            <VBtn
              variant="text"
              size="small"
              @click="toggleDetails"
            >
              <VIcon 
                :icon="showDetails ? 'mdi-chevron-up' : 'mdi-chevron-down'" 
                class="mr-1" 
              />
              {{ showDetails ? 'Hide' : 'Show' }} Details
            </VBtn>
            
            <VBtn
              v-if="reportable"
              variant="text"
              size="small"
              color="neutral"
              class="ml-2"
              @click="reportError"
            >
              <VIcon icon="mdi-bug" class="mr-1" />
              Report Issue
            </VBtn>
          </div>
        </div>
      </VCardText>
    </VCard>
  </div>
</template>

<script setup lang="ts">
interface ErrorAction {
  text: string
  handler: () => void
  icon?: string
  color?: string
  variant?: 'flat' | 'outlined' | 'text'
  loading?: boolean
}

interface Props {
  // Error content
  title?: string
  message?: string
  error?: Error | string | object
  
  // Error type/severity
  type?: 'error' | 'warning' | 'info' | '404' | '500' | 'network' | 'auth'
  
  // Display options
  fullscreen?: boolean
  compact?: boolean
  reportable?: boolean
  
  // Actions
  primaryAction?: ErrorAction
  secondaryActions?: ErrorAction[]
  
  // Suggestions
  suggestions?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  type: 'error',
  fullscreen: false,
  compact: false,
  reportable: true,
  secondaryActions: () => [],
  suggestions: () => []
})

// Emits
const emit = defineEmits<{
  retry: []
  report: [error: any]
}>()

// Reactive state
const showDetails = ref(false)

// Computed properties
const errorIcon = computed(() => {
  switch (props.type) {
    case '404':
      return 'mdi-file-question'
    case '500':
      return 'mdi-server-network-off'
    case 'network':
      return 'mdi-wifi-off'
    case 'auth':
      return 'mdi-account-lock'
    case 'warning':
      return 'mdi-alert'
    case 'info':
      return 'mdi-information'
    default:
      return 'mdi-alert-circle'
  }
})

const errorColor = computed(() => {
  switch (props.type) {
    case 'warning':
      return 'warning'
    case 'info':
      return 'info'
    case '404':
    case 'network':
      return 'neutral'
    default:
      return 'error'
  }
})

const errorTitle = computed(() => {
  if (props.title) return props.title
  
  switch (props.type) {
    case '404':
      return 'Page Not Found'
    case '500':
      return 'Server Error'
    case 'network':
      return 'Connection Problem'
    case 'auth':
      return 'Authentication Required'
    case 'warning':
      return 'Warning'
    case 'info':
      return 'Information'
    default:
      return 'Something went wrong'
  }
})

const errorMessage = computed(() => {
  if (props.message) return props.message
  
  switch (props.type) {
    case '404':
      return "The page you're looking for doesn't exist or has been moved."
    case '500':
      return 'An internal server error occurred. Please try again later.'
    case 'network':
      return 'Unable to connect to the server. Please check your internet connection.'
    case 'auth':
      return 'You need to sign in to access this resource.'
    case 'warning':
      return 'Please review the information and try again.'
    case 'info':
      return 'Here is some important information for you.'
    default:
      return 'An unexpected error occurred. Please try again or contact support if the problem persists.'
  }
})

const errorDetails = computed(() => {
  if (!props.error) return null
  
  if (typeof props.error === 'string') {
    return props.error
  }
  
  if (props.error instanceof Error) {
    return {
      name: props.error.name,
      message: props.error.message,
      stack: props.error.stack
    }
  }
  
  return props.error
})

const formattedErrorDetails = computed(() => {
  if (!errorDetails.value) return ''
  
  if (typeof errorDetails.value === 'string') {
    return errorDetails.value
  }
  
  return JSON.stringify(errorDetails.value, null, 2)
})

const showAdditionalActions = computed(() => {
  return errorDetails.value || props.reportable
})

// Methods
const handlePrimaryAction = () => {
  if (props.primaryAction?.handler) {
    props.primaryAction.handler()
  } else {
    // Default action is retry
    emit('retry')
  }
}

const toggleDetails = () => {
  showDetails.value = !showDetails.value
}

const reportError = () => {
  emit('report', {
    type: props.type,
    title: errorTitle.value,
    message: errorMessage.value,
    error: props.error,
    url: window.location.href,
    userAgent: navigator.userAgent,
    timestamp: new Date().toISOString()
  })
}

// Default suggestions based on error type
const defaultSuggestions = computed(() => {
  if (props.suggestions.length > 0) return props.suggestions
  
  switch (props.type) {
    case '404':
      return [
        'Check the URL for typos',
        'Go back to the previous page',
        'Visit the home page'
      ]
    case 'network':
      return [
        'Check your internet connection',
        'Try refreshing the page',
        'Wait a moment and try again'
      ]
    case 'auth':
      return [
        'Sign in to your account',
        'Check if your session has expired',
        'Clear your browser cache'
      ]
    case '500':
      return [
        'Wait a few minutes and try again',
        'Contact support if the issue persists',
        'Try a different browser'
      ]
    default:
      return [
        'Refresh the page',
        'Try again in a few moments',
        'Contact support if the problem continues'
      ]
  }
})

const suggestions = computed(() => defaultSuggestions.value)
</script>

<style scoped>
.app-error {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  padding: 2rem;
}

.app-error--fullscreen {
  min-height: 100vh;
  padding: 0;
}

.app-error--compact {
  min-height: 200px;
  padding: 1rem;
}

.app-error__card {
  width: 100%;
  max-width: 600px;
}

.app-error__card--fullscreen {
  height: 100vh;
  max-width: none;
  border-radius: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.app-error__icon {
  opacity: 0.8;
}

.app-error__details-content {
  background: rgba(0, 0, 0, 0.02);
  border-radius: 8px;
  padding: 1rem;
  max-height: 200px;
  overflow-y: auto;
}

.app-error__details-content pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
}

.app-error__suggestions {
  text-align: left;
  max-width: 400px;
  margin: 0 auto;
}

.app-error__actions {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.gap-3 {
  gap: 0.75rem;
}

/* Responsive adjustments */
@media (max-width: 600px) {
  .app-error {
    padding: 1rem;
    min-height: 300px;
  }
  
  .app-error--compact {
    min-height: 150px;
    padding: 0.5rem;
  }
  
  .app-error__card {
    max-width: none;
  }
  
  :deep(.v-card-text) {
    padding: 1.5rem !important;
  }
}

/* Dark theme adjustments */
:deep(.theme--dark) .app-error__details-content {
  background: rgba(255, 255, 255, 0.05);
}
</style>
