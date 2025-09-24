<template>
  <Teleport to="body">
    <Transition
      name="modal-backdrop"
      appear
      @after-enter="onBackdropEnter"
      @before-leave="onBackdropLeave"
    >
      <div
        v-if="modelValue"
        ref="backdropRef"
        class="app-modal__backdrop"
        :class="backdropClasses"
        @click="handleBackdropClick"
        @keydown="handleKeydown"
      >
        <Transition
          name="modal-content"
          appear
          @after-enter="onContentEnter"
        >
          <div
            v-if="modelValue"
            ref="modalRef"
            :class="modalClasses"
            role="dialog"
            :aria-modal="true"
            :aria-labelledby="titleId"
            :aria-describedby="contentId"
            tabindex="-1"
          >
            <!-- Modal header -->
            <header v-if="$slots.header || title || closable" class="app-modal__header">
              <div v-if="$slots.header" class="app-modal__header-content">
                <slot name="header" />
              </div>
              <div v-else class="app-modal__header-content">
                <h2 v-if="title" :id="titleId" class="app-modal__title">
                  {{ title }}
                </h2>
                <p v-if="subtitle" class="app-modal__subtitle">
                  {{ subtitle }}
                </p>
              </div>
              
              <button
                v-if="closable"
                type="button"
                class="app-modal__close"
                :aria-label="closeLabel"
                @click="handleClose"
              >
                <VIcon icon="mdi-close" size="20" />
              </button>
            </header>

            <!-- Modal content -->
            <div
              :id="contentId"
              class="app-modal__content"
              :class="contentClasses"
            >
              <slot />
            </div>

            <!-- Modal footer -->
            <footer v-if="$slots.footer || actions.length > 0" class="app-modal__footer">
              <slot v-if="$slots.footer" name="footer" />
              <div v-else class="app-modal__actions">
                <AppButton
                  v-for="action in actions"
                  :key="action.key"
                  :variant="action.variant || 'filled'"
                  :color="action.color || 'primary'"
                  :size="action.size || 'md'"
                  :disabled="action.disabled"
                  :loading="action.loading"
                  @click="handleActionClick(action)"
                >
                  {{ action.text }}
                </AppButton>
              </div>
            </footer>

            <!-- Loading overlay -->
            <div v-if="loading" class="app-modal__loading">
              <AppLoading
                type="circular"
                :size="48"
                color="primary"
              />
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
interface ModalAction {
  key: string
  text: string
  variant?: 'filled' | 'outlined' | 'text' | 'tonal' | 'elevated'
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  handler?: () => void | Promise<void>
}

interface Props {
  // Visibility
  modelValue: boolean
  
  // Content
  title?: string
  subtitle?: string
  
  // Behavior
  persistent?: boolean
  closable?: boolean
  escapeClose?: boolean
  clickOutsideClose?: boolean
  
  // Variants
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'fullscreen'
  variant?: 'default' | 'glass' | 'card'
  
  // States
  loading?: boolean
  
  // Actions
  actions?: ModalAction[]
  
  // Styling
  maxWidth?: string
  maxHeight?: string
  
  // Accessibility
  closeLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  persistent: false,
  closable: true,
  escapeClose: true,
  clickOutsideClose: true,
  size: 'md',
  variant: 'default',
  loading: false,
  actions: () => [],
  closeLabel: 'Close modal'
})

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'close': []
  'action': [action: ModalAction]
  'backdrop-click': []
  'escape': []
}>()

// Refs
const backdropRef = ref<HTMLDivElement>()
const modalRef = ref<HTMLDivElement>()

// Generate unique IDs for accessibility
const titleId = ref(`modal-title-${Math.random().toString(36).substr(2, 9)}`)
const contentId = ref(`modal-content-${Math.random().toString(36).substr(2, 9)}`)

// Previous focus element for restoration
const previousFocus = ref<HTMLElement>()

// Classes
const backdropClasses = computed(() => [
  'app-modal__backdrop',
  {
    'app-modal__backdrop--glass': props.variant === 'glass'
  }
])

const modalClasses = computed(() => [
  'app-modal',
  `app-modal--${props.size}`,
  `app-modal--${props.variant}`,
  {
    'app-modal--loading': props.loading,
    'app-modal--fullscreen': props.size === 'fullscreen'
  }
])

const contentClasses = computed(() => [
  'app-modal__content-inner',
  {
    'app-modal__content-inner--scrollable': props.size !== 'fullscreen'
  }
])

// Methods
const handleClose = () => {
  if (!props.persistent) {
    emit('update:modelValue', false)
    emit('close')
  }
}

const handleBackdropClick = (event: MouseEvent) => {
  if (event.target === backdropRef.value && props.clickOutsideClose) {
    emit('backdrop-click')
    handleClose()
  }
}

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && props.escapeClose) {
    emit('escape')
    handleClose()
  }
  
  // Handle tab trapping
  if (event.key === 'Tab') {
    trapFocus(event)
  }
}

const handleActionClick = async (action: ModalAction) => {
  emit('action', action)
  
  if (action.handler) {
    try {
      await action.handler()
    } catch (error) {
      console.error('Modal action handler error:', error)
    }
  }
}

// Focus management
const trapFocus = (event: KeyboardEvent) => {
  if (!modalRef.value) return

  const focusableElements = modalRef.value.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  )
  
  const firstElement = focusableElements[0] as HTMLElement
  const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

  if (event.shiftKey && document.activeElement === firstElement) {
    event.preventDefault()
    lastElement?.focus()
  } else if (!event.shiftKey && document.activeElement === lastElement) {
    event.preventDefault()
    firstElement?.focus()
  }
}

const focusModal = () => {
  nextTick(() => {
    // Focus the first focusable element or the modal itself
    const focusableElement = modalRef.value?.querySelector(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as HTMLElement
    
    if (focusableElement) {
      focusableElement.focus()
    } else {
      modalRef.value?.focus()
    }
  })
}

const restoreFocus = () => {
  if (previousFocus.value) {
    previousFocus.value.focus()
    previousFocus.value = undefined
  }
}

// Lifecycle hooks
const onBackdropEnter = () => {
  // Store current focus
  previousFocus.value = document.activeElement as HTMLElement
  
  // Prevent body scroll
  document.body.style.overflow = 'hidden'
  
  // Focus modal
  focusModal()
}

const onBackdropLeave = () => {
  // Restore body scroll
  document.body.style.overflow = ''
  
  // Restore focus
  restoreFocus()
}

const onContentEnter = () => {
  // Additional content enter logic if needed
}

// Watch for modelValue changes
watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    // Modal is opening
    nextTick(() => {
      focusModal()
    })
  }
})

// Cleanup on unmount
onUnmounted(() => {
  document.body.style.overflow = ''
  restoreFocus()
})
</script>

<style scoped>
/* Backdrop styles */
.app-modal__backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: var(--spacing-4);
  overflow-y: auto;
}

.app-modal__backdrop--glass {
  background-color: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

/* Modal container styles */
.app-modal {
  position: relative;
  display: flex;
  flex-direction: column;
  background-color: var(--color-surface);
  border-radius: var(--border-radius-xl);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  max-height: calc(100vh - var(--spacing-8));
  overflow: hidden;
  margin: auto;
}

/* Size variants */
.app-modal--xs {
  width: 100%;
  max-width: 320px;
}

.app-modal--sm {
  width: 100%;
  max-width: 480px;
}

.app-modal--md {
  width: 100%;
  max-width: 640px;
}

.app-modal--lg {
  width: 100%;
  max-width: 800px;
}

.app-modal--xl {
  width: 100%;
  max-width: 1200px;
}

.app-modal--fullscreen {
  width: 100vw;
  height: 100vh;
  max-width: none;
  max-height: none;
  border-radius: 0;
  margin: 0;
}

/* Variant styles */
.app-modal--glass {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.app-modal--card {
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

/* Header styles */
.app-modal__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: var(--spacing-6) var(--spacing-6) var(--spacing-4);
  border-bottom: 1px solid var(--color-outline);
  gap: var(--spacing-4);
}

.app-modal__header-content {
  flex: 1;
  min-width: 0;
}

.app-modal__title {
  margin: 0 0 var(--spacing-1) 0;
  font-family: var(--font-family-serif);
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-on-surface);
  line-height: var(--line-height-tight);
}

.app-modal__subtitle {
  margin: 0;
  font-size: var(--font-size-base);
  color: var(--color-on-surface-variant);
  line-height: var(--line-height-normal);
}

.app-modal__close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  background: transparent;
  border: none;
  border-radius: var(--border-radius-md);
  color: var(--color-on-surface-variant);
  cursor: pointer;
  transition: var(--transition-colors);
  flex-shrink: 0;
}

.app-modal__close:hover {
  background-color: rgba(var(--color-on-surface-rgb), 0.08);
  color: var(--color-on-surface);
}

.app-modal__close:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* Content styles */
.app-modal__content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.app-modal__content-inner {
  padding: var(--spacing-6);
  color: var(--color-on-surface);
  line-height: var(--line-height-relaxed);
}

.app-modal__content-inner--scrollable {
  overflow-y: auto;
  max-height: 60vh;
}

/* Footer styles */
.app-modal__footer {
  padding: var(--spacing-4) var(--spacing-6) var(--spacing-6);
  border-top: 1px solid var(--color-outline);
}

.app-modal__actions {
  display: flex;
  gap: var(--spacing-3);
  justify-content: flex-end;
}

/* Loading overlay */
.app-modal__loading {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(var(--color-surface-rgb), 0.8);
  z-index: 1;
}

/* Transition animations */
.modal-backdrop-enter-active,
.modal-backdrop-leave-active {
  transition: opacity var(--duration-normal) var(--easing-standard);
}

.modal-backdrop-enter-from,
.modal-backdrop-leave-to {
  opacity: 0;
}

.modal-content-enter-active {
  transition: all var(--duration-normal) var(--easing-emphasized-decelerate);
}

.modal-content-leave-active {
  transition: all var(--duration-short) var(--easing-emphasized-accelerate);
}

.modal-content-enter-from {
  opacity: 0;
  transform: scale(0.9) translateY(-20px);
}

.modal-content-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(-10px);
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .app-modal__backdrop {
    padding: var(--spacing-2);
  }
  
  .app-modal--xs,
  .app-modal--sm,
  .app-modal--md,
  .app-modal--lg,
  .app-modal--xl {
    width: 100%;
    max-width: none;
    margin: 0;
  }
  
  .app-modal__header {
    padding: var(--spacing-4) var(--spacing-4) var(--spacing-3);
  }
  
  .app-modal__content-inner {
    padding: var(--spacing-4);
  }
  
  .app-modal__footer {
    padding: var(--spacing-3) var(--spacing-4) var(--spacing-4);
  }
  
  .app-modal__actions {
    flex-direction: column-reverse;
  }
  
  .app-modal__title {
    font-size: var(--font-size-xl);
  }
}

/* Dark theme adjustments */
.dark .app-modal--glass {
  background: rgba(0, 0, 0, 0.2);
  border-color: rgba(255, 255, 255, 0.1);
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .app-modal {
    border: 2px solid var(--color-outline);
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .modal-backdrop-enter-active,
  .modal-backdrop-leave-active,
  .modal-content-enter-active,
  .modal-content-leave-active {
    transition: none;
  }
  
  .modal-content-enter-from,
  .modal-content-leave-to {
    transform: none;
  }
}
</style>
