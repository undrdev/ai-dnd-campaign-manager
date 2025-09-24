<template>
  <Transition name="alert" appear>
    <div
      v-if="modelValue"
      :class="alertClasses"
      role="alert"
      :aria-live="ariaLive"
      :aria-atomic="true"
    >
      <!-- Icon -->
      <div v-if="showIcon" class="app-alert__icon">
        <VIcon :icon="alertIcon" :size="iconSize" />
      </div>

      <!-- Content -->
      <div class="app-alert__content">
        <!-- Title -->
        <div v-if="title" class="app-alert__title">
          {{ title }}
        </div>

        <!-- Message -->
        <div class="app-alert__message">
          <slot v-if="slots.default" />
          <span v-else-if="text">{{ text }}</span>
        </div>

        <!-- Actions -->
        <div v-if="slots.actions || actions.length > 0" class="app-alert__actions">
          <slot v-if="slots.actions" name="actions" />
          <template v-else>
            <AppButton
              v-for="action in actions"
              :key="action.key"
              :variant="action.variant || 'text'"
              :color="action.color || color"
              :size="actionButtonSize"
              @click="handleActionClick(action)"
            >
              {{ action.text }}
            </AppButton>
          </template>
        </div>
      </div>

      <!-- Close button -->
      <button
        v-if="closable"
        type="button"
        class="app-alert__close"
        :aria-label="closeLabel"
        @click="handleClose"
      >
        <VIcon icon="mdi-close" :size="closeIconSize" />
      </button>
    </div>
  </Transition>
</template>

<script setup lang="ts">
interface AlertAction {
  key: string
  text: string
  variant?: 'filled' | 'outlined' | 'text' | 'tonal'
  color?: string
  handler?: () => void | Promise<void>
}

interface Props {
  // Visibility
  modelValue?: boolean
  
  // Content
  title?: string
  text?: string
  
  // Variants
  type?: 'info' | 'success' | 'warning' | 'error'
  variant?: 'filled' | 'outlined' | 'tonal'
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info'
  size?: 'sm' | 'md' | 'lg'
  
  // Visual elements
  icon?: string
  showIcon?: boolean
  
  // Behavior
  closable?: boolean
  persistent?: boolean
  timeout?: number
  
  // Actions
  actions?: AlertAction[]
  
  // Accessibility
  closeLabel?: string
  ariaLive?: 'polite' | 'assertive' | 'off'
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: true,
  type: 'info',
  variant: 'filled',
  size: 'md',
  showIcon: true,
  closable: false,
  persistent: false,
  actions: () => [],
  closeLabel: 'Close alert',
  ariaLive: 'polite'
})

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'close': []
  'action': [action: AlertAction]
  'timeout': []
}>()

// Timeout handling
let timeoutId: NodeJS.Timeout | null = null

// Computed properties
const color = computed(() => {
  if (props.color) return props.color
  
  // Map types to colors
  const typeColorMap = {
    info: 'info',
    success: 'success',
    warning: 'warning',
    error: 'error'
  }
  
  return typeColorMap[props.type] || 'info'
})

const alertIcon = computed(() => {
  if (props.icon) return props.icon
  
  // Default icons based on type
  const typeIconMap = {
    info: 'mdi-information',
    success: 'mdi-check-circle',
    warning: 'mdi-alert',
    error: 'mdi-alert-circle'
  }
  
  return typeIconMap[props.type] || 'mdi-information'
})

const iconSize = computed(() => {
  const sizeMap = {
    sm: 18,
    md: 20,
    lg: 22
  }
  return sizeMap[props.size]
})

const closeIconSize = computed(() => {
  const sizeMap = {
    sm: 16,
    md: 18,
    lg: 20
  }
  return sizeMap[props.size]
})

const actionButtonSize = computed(() => {
  const sizeMap = {
    sm: 'xs',
    md: 'sm',
    lg: 'md'
  }
  return sizeMap[props.size] as 'xs' | 'sm' | 'md'
})

// Slots
const slots = useSlots()

const alertClasses = computed(() => [
  'app-alert',
  `app-alert--${props.variant}`,
  `app-alert--${color.value}`,
  `app-alert--${props.size}`,
  {
    'app-alert--with-icon': props.showIcon,
    'app-alert--closable': props.closable,
    'app-alert--with-title': props.title,
    'app-alert--with-actions': slots.actions || props.actions.length > 0
  }
])

// Methods
const handleClose = () => {
  if (timeoutId) {
    clearTimeout(timeoutId)
    timeoutId = null
  }
  
  emit('update:modelValue', false)
  emit('close')
}

const handleActionClick = async (action: AlertAction) => {
  emit('action', action)
  
  if (action.handler) {
    try {
      await action.handler()
    } catch (error) {
      console.error('Alert action handler error:', error)
    }
  }
}

const startTimeout = () => {
  if (!props.timeout || props.persistent) return
  
  timeoutId = setTimeout(() => {
    emit('timeout')
    handleClose()
  }, props.timeout)
}

const stopTimeout = () => {
  if (timeoutId) {
    clearTimeout(timeoutId)
    timeoutId = null
  }
}

// Lifecycle
watch(() => props.modelValue, (isVisible) => {
  if (isVisible && props.timeout && !props.persistent) {
    startTimeout()
  } else {
    stopTimeout()
  }
}, { immediate: true })

onUnmounted(() => {
  stopTimeout()
})
</script>

<style scoped>
/* Base alert styles using design tokens */
.app-alert {
  display: flex;
  align-items: flex-start;
  border-radius: var(--border-radius-lg);
  font-family: var(--font-family-sans);
  position: relative;
  overflow: hidden;
}

/* Size variants */
.app-alert--sm {
  padding: var(--spacing-3);
  gap: var(--spacing-2);
}

.app-alert--md {
  padding: var(--spacing-4);
  gap: var(--spacing-3);
}

.app-alert--lg {
  padding: var(--spacing-5);
  gap: var(--spacing-4);
}

/* Filled variant */
.app-alert--filled.app-alert--info {
  background-color: var(--color-info);
  color: var(--color-on-info);
  border: 1px solid var(--color-info);
}

.app-alert--filled.app-alert--success {
  background-color: var(--color-success);
  color: var(--color-on-success);
  border: 1px solid var(--color-success);
}

.app-alert--filled.app-alert--warning {
  background-color: var(--color-warning);
  color: var(--color-on-warning);
  border: 1px solid var(--color-warning);
}

.app-alert--filled.app-alert--error {
  background-color: var(--color-error);
  color: var(--color-on-error);
  border: 1px solid var(--color-error);
}

.app-alert--filled.app-alert--primary {
  background-color: var(--color-primary);
  color: var(--color-on-primary);
  border: 1px solid var(--color-primary);
}

.app-alert--filled.app-alert--secondary {
  background-color: var(--color-secondary);
  color: var(--color-on-secondary);
  border: 1px solid var(--color-secondary);
}

/* Outlined variant */
.app-alert--outlined {
  background-color: var(--color-surface);
  border: 1px solid;
}

.app-alert--outlined.app-alert--info {
  border-color: var(--color-info);
  color: var(--color-info);
}

.app-alert--outlined.app-alert--success {
  border-color: var(--color-success);
  color: var(--color-success);
}

.app-alert--outlined.app-alert--warning {
  border-color: var(--color-warning);
  color: var(--color-warning);
}

.app-alert--outlined.app-alert--error {
  border-color: var(--color-error);
  color: var(--color-error);
}

.app-alert--outlined.app-alert--primary {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.app-alert--outlined.app-alert--secondary {
  border-color: var(--color-secondary);
  color: var(--color-secondary);
}

/* Tonal variant */
.app-alert--tonal.app-alert--info {
  background-color: var(--color-info-container);
  color: var(--color-on-info-container);
  border: 1px solid var(--color-info);
}

.app-alert--tonal.app-alert--success {
  background-color: var(--color-success-container);
  color: var(--color-on-success-container);
  border: 1px solid var(--color-success);
}

.app-alert--tonal.app-alert--warning {
  background-color: var(--color-warning-container);
  color: var(--color-on-warning-container);
  border: 1px solid var(--color-warning);
}

.app-alert--tonal.app-alert--error {
  background-color: var(--color-error-container);
  color: var(--color-on-error-container);
  border: 1px solid var(--color-error);
}

.app-alert--tonal.app-alert--primary {
  background-color: var(--color-primary-container);
  color: var(--color-on-primary-container);
  border: 1px solid var(--color-primary);
}

.app-alert--tonal.app-alert--secondary {
  background-color: var(--color-secondary-container);
  color: var(--color-on-secondary-container);
  border: 1px solid var(--color-secondary);
}

/* Icon */
.app-alert__icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  margin-top: 1px; /* Align with text baseline */
}

/* Content */
.app-alert__content {
  flex: 1;
  min-width: 0;
}

.app-alert__title {
  font-weight: var(--font-weight-semibold);
  margin-bottom: var(--spacing-1);
  line-height: var(--line-height-tight);
}

.app-alert--sm .app-alert__title {
  font-size: var(--font-size-sm);
}

.app-alert--md .app-alert__title {
  font-size: var(--font-size-base);
}

.app-alert--lg .app-alert__title {
  font-size: var(--font-size-lg);
}

.app-alert__message {
  line-height: var(--line-height-normal);
}

.app-alert--sm .app-alert__message {
  font-size: var(--font-size-sm);
}

.app-alert--md .app-alert__message {
  font-size: var(--font-size-base);
}

.app-alert--lg .app-alert__message {
  font-size: var(--font-size-lg);
}

.app-alert__actions {
  display: flex;
  gap: var(--spacing-2);
  margin-top: var(--spacing-2);
  flex-wrap: wrap;
}

/* Close button */
.app-alert__close {
  position: absolute;
  top: var(--spacing-2);
  right: var(--spacing-2);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  background: transparent;
  border: none;
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  transition: var(--transition-colors);
  opacity: 0.7;
}

.app-alert__close:hover {
  opacity: 1;
  background-color: rgba(255, 255, 255, 0.1);
}

.app-alert--outlined .app-alert__close:hover,
.app-alert--tonal .app-alert__close:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.app-alert__close:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 2px;
}

/* Layout adjustments for closable alerts */
.app-alert--closable {
  padding-right: var(--spacing-10);
}

.app-alert--closable.app-alert--sm {
  padding-right: var(--spacing-8);
}

.app-alert--closable.app-alert--lg {
  padding-right: var(--spacing-12);
}

/* Transitions */
.alert-enter-active,
.alert-leave-active {
  transition: all var(--duration-normal) var(--easing-standard);
}

.alert-enter-from,
.alert-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.95);
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .app-alert__actions {
    flex-direction: column;
  }
  
  .app-alert--sm {
    padding: var(--spacing-2-5);
  }
  
  .app-alert--md {
    padding: var(--spacing-3);
  }
  
  .app-alert--lg {
    padding: var(--spacing-4);
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .app-alert--outlined {
    border-width: 2px;
  }
  
  .app-alert__title {
    font-weight: var(--font-weight-bold);
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .app-alert__close,
  .alert-enter-active,
  .alert-leave-active {
    transition: none;
  }
  
  .alert-enter-from,
  .alert-leave-to {
    transform: none;
  }
}
</style>
