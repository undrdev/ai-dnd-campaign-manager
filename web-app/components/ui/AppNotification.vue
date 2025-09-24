<template>
  <VSnackbar
    v-model="internalShow"
    :color="notificationColor"
    :timeout="timeout"
    :location="location"
    :multi-line="multiLine"
    :vertical="vertical"
    :elevation="elevation"
    :rounded="rounded"
    :class="[
      'app-notification',
      `app-notification--${type}`,
      {
        'app-notification--persistent': persistent,
        'app-notification--with-action': hasAction
      }
    ]"
    @update:model-value="handleUpdate"
  >
    <div class="d-flex align-center">
      <!-- Icon -->
      <VIcon 
        v-if="showIcon" 
        :icon="notificationIcon" 
        :size="iconSize"
        class="mr-3 flex-shrink-0" 
      />
      
      <!-- Content -->
      <div class="flex-grow-1 app-notification__content">
        <div v-if="title" class="app-notification__title font-weight-bold mb-1">
          {{ title }}
        </div>
        <div class="app-notification__message">
          {{ message }}
        </div>
        <div v-if="details" class="app-notification__details text-caption mt-1 opacity-80">
          {{ details }}
        </div>
      </div>
      
      <!-- Action Button -->
      <VBtn
        v-if="actionText && actionHandler"
        :color="actionColor || 'white'"
        :variant="actionVariant || 'text'"
        :size="actionSize || 'small'"
        class="ml-3 flex-shrink-0"
        @click="handleAction"
      >
        <VIcon v-if="actionIcon" :icon="actionIcon" class="mr-1" size="16" />
        {{ actionText }}
      </VBtn>
    </div>
    
    <!-- Close Button -->
    <template #actions>
      <VBtn
        v-if="closable"
        color="white"
        variant="text"
        icon="mdi-close"
        size="small"
        @click="close"
      />
    </template>
  </VSnackbar>
</template>

<script setup lang="ts">
interface Props {
  // Content
  title?: string
  message: string
  details?: string
  
  // Appearance
  type?: 'success' | 'error' | 'warning' | 'info' | 'default'
  color?: string
  showIcon?: boolean
  iconSize?: string | number
  
  // Behavior
  modelValue?: boolean
  timeout?: number
  persistent?: boolean
  closable?: boolean
  
  // Layout
  location?: 'top' | 'bottom' | 'left' | 'right' | 'center' | 'top left' | 'top right' | 'bottom left' | 'bottom right'
  multiLine?: boolean
  vertical?: boolean
  elevation?: number | string
  rounded?: boolean | string
  
  // Action
  actionText?: string
  actionIcon?: string
  actionHandler?: () => void
  actionColor?: string
  actionVariant?: 'flat' | 'outlined' | 'text'
  actionSize?: 'small' | 'default' | 'large'
}

const props = withDefaults(defineProps<Props>(), {
  type: 'default',
  showIcon: true,
  iconSize: 20,
  modelValue: false,
  timeout: 5000,
  persistent: false,
  closable: true,
  location: 'top',
  multiLine: false,
  vertical: false,
  elevation: 6,
  rounded: true
})

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'close': []
  'action': []
}>()

// Internal state
const internalShow = ref(props.modelValue)

// Computed properties
const notificationColor = computed(() => {
  if (props.color) return props.color
  
  switch (props.type) {
    case 'success':
      return 'success'
    case 'error':
      return 'error'
    case 'warning':
      return 'warning'
    case 'info':
      return 'info'
    default:
      return 'neutral-800'
  }
})

const notificationIcon = computed(() => {
  switch (props.type) {
    case 'success':
      return 'mdi-check-circle'
    case 'error':
      return 'mdi-alert-circle'
    case 'warning':
      return 'mdi-alert'
    case 'info':
      return 'mdi-information'
    default:
      return 'mdi-bell'
  }
})

const hasAction = computed(() => {
  return !!(props.actionText && props.actionHandler)
})

// Methods
const handleUpdate = (value: boolean) => {
  internalShow.value = value
  emit('update:modelValue', value)
  
  if (!value) {
    emit('close')
  }
}

const close = () => {
  internalShow.value = false
  emit('update:modelValue', false)
  emit('close')
}

const handleAction = () => {
  if (props.actionHandler) {
    props.actionHandler()
  }
  emit('action')
  
  // Optionally close notification after action
  // close()
}

// Watch for external changes
watch(() => props.modelValue, (newValue) => {
  internalShow.value = newValue
})

// Auto-show when component is created with content
onMounted(() => {
  if (props.message && !props.modelValue) {
    internalShow.value = true
    emit('update:modelValue', true)
  }
})
</script>

<style scoped>
.app-notification {
  /* Base notification styles */
}

.app-notification--success {
  /* Success-specific styles */
}

.app-notification--error {
  /* Error-specific styles */
}

.app-notification--warning {
  /* Warning-specific styles */
}

.app-notification--info {
  /* Info-specific styles */
}

.app-notification--persistent {
  /* Persistent notification styles */
}

.app-notification--with-action {
  /* Styles when action button is present */
}

.app-notification__content {
  line-height: 1.4;
}

.app-notification__title {
  font-size: 0.875rem;
  line-height: 1.2;
}

.app-notification__message {
  font-size: 0.875rem;
  line-height: 1.4;
}

.app-notification__details {
  font-size: 0.75rem;
  line-height: 1.3;
}

/* Custom snackbar content styling */
:deep(.v-snackbar__content) {
  padding: 16px 16px 16px 16px;
}

:deep(.v-snackbar--multi-line .v-snackbar__content) {
  padding: 16px;
}

:deep(.v-snackbar--vertical .v-snackbar__content) {
  align-items: flex-start;
  flex-direction: column;
}

/* Action button styling */
:deep(.v-btn--size-small) {
  font-size: 0.75rem;
  min-width: auto;
}

/* Icon alignment */
:deep(.v-icon) {
  align-self: flex-start;
}

/* Responsive adjustments */
@media (max-width: 600px) {
  .app-notification__title {
    font-size: 0.8125rem;
  }
  
  .app-notification__message {
    font-size: 0.8125rem;
  }
  
  .app-notification__details {
    font-size: 0.6875rem;
  }
  
  :deep(.v-snackbar__content) {
    padding: 12px;
  }
}

/* Animation enhancements */
:deep(.v-snackbar__wrapper) {
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

/* Custom colors for different types */
.app-notification--success :deep(.v-snackbar__wrapper) {
  background: linear-gradient(135deg, var(--v-theme-success), var(--v-theme-success-darken-1));
}

.app-notification--error :deep(.v-snackbar__wrapper) {
  background: linear-gradient(135deg, var(--v-theme-error), var(--v-theme-error-darken-1));
}

.app-notification--warning :deep(.v-snackbar__wrapper) {
  background: linear-gradient(135deg, var(--v-theme-warning), var(--v-theme-warning-darken-1));
}

.app-notification--info :deep(.v-snackbar__wrapper) {
  background: linear-gradient(135deg, var(--v-theme-info), var(--v-theme-info-darken-1));
}
</style>
