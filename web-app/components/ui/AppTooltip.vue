<template>
  <div ref="triggerRef" class="app-tooltip-trigger" @mouseenter="show" @mouseleave="hide" @focus="show" @blur="hide">
    <slot />
    
    <Teleport to="body">
      <Transition name="tooltip" appear>
        <div
          v-if="isVisible"
          ref="tooltipRef"
          :class="tooltipClasses"
          :style="tooltipStyles"
          role="tooltip"
          :aria-hidden="!isVisible"
        >
          <!-- Tooltip arrow -->
          <div :class="arrowClasses" />
          
          <!-- Tooltip content -->
          <div class="app-tooltip__content">
            <slot v-if="slots.content" name="content" />
            <span v-else-if="text">{{ text }}</span>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
interface Props {
  // Content
  text?: string
  
  // Positioning
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'top-start' | 'top-end' | 'bottom-start' | 'bottom-end'
  offset?: number
  
  // Behavior
  disabled?: boolean
  trigger?: 'hover' | 'focus' | 'click' | 'manual'
  delay?: number
  hideDelay?: number
  
  // Variants
  variant?: 'default' | 'dark' | 'light'
  size?: 'sm' | 'md' | 'lg'
  
  // Manual control
  modelValue?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  placement: 'top',
  offset: 8,
  disabled: false,
  trigger: 'hover',
  delay: 200,
  hideDelay: 0,
  variant: 'dark',
  size: 'md'
})

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  show: []
  hide: []
}>()

// Refs
const triggerRef = ref<HTMLElement>()
const tooltipRef = ref<HTMLElement>()

// State
const isVisible = ref(false)
const position = ref({ x: 0, y: 0 })

// Slots
const slots = useSlots()

// Timeouts for delays
let showTimeout: NodeJS.Timeout | null = null
let hideTimeout: NodeJS.Timeout | null = null

// Computed properties
const tooltipClasses = computed(() => [
  'app-tooltip',
  `app-tooltip--${props.variant}`,
  `app-tooltip--${props.size}`,
  `app-tooltip--${props.placement}`
])

const arrowClasses = computed(() => [
  'app-tooltip__arrow',
  `app-tooltip__arrow--${props.placement}`
])

const tooltipStyles = computed(() => ({
  left: `${position.value.x}px`,
  top: `${position.value.y}px`,
  zIndex: 9999
}))

// Methods
const calculatePosition = () => {
  if (!triggerRef.value || !tooltipRef.value) return

  const trigger = triggerRef.value.getBoundingClientRect()
  const tooltip = tooltipRef.value.getBoundingClientRect()
  const viewport = {
    width: window.innerWidth,
    height: window.innerHeight
  }

  let x = 0
  let y = 0

  // Calculate position based on placement
  switch (props.placement) {
    case 'top':
      x = trigger.left + trigger.width / 2 - tooltip.width / 2
      y = trigger.top - tooltip.height - props.offset
      break
    case 'top-start':
      x = trigger.left
      y = trigger.top - tooltip.height - props.offset
      break
    case 'top-end':
      x = trigger.right - tooltip.width
      y = trigger.top - tooltip.height - props.offset
      break
    case 'bottom':
      x = trigger.left + trigger.width / 2 - tooltip.width / 2
      y = trigger.bottom + props.offset
      break
    case 'bottom-start':
      x = trigger.left
      y = trigger.bottom + props.offset
      break
    case 'bottom-end':
      x = trigger.right - tooltip.width
      y = trigger.bottom + props.offset
      break
    case 'left':
      x = trigger.left - tooltip.width - props.offset
      y = trigger.top + trigger.height / 2 - tooltip.height / 2
      break
    case 'right':
      x = trigger.right + props.offset
      y = trigger.top + trigger.height / 2 - tooltip.height / 2
      break
  }

  // Viewport collision detection
  if (x < 0) x = 8
  if (x + tooltip.width > viewport.width) x = viewport.width - tooltip.width - 8
  if (y < 0) y = 8
  if (y + tooltip.height > viewport.height) y = viewport.height - tooltip.height - 8

  position.value = { x, y }
}

const show = () => {
  if (props.disabled || isVisible.value) return

  if (hideTimeout) {
    clearTimeout(hideTimeout)
    hideTimeout = null
  }

  showTimeout = setTimeout(() => {
    isVisible.value = true
    emit('update:modelValue', true)
    emit('show')
    
    nextTick(() => {
      calculatePosition()
    })
  }, props.delay)
}

const hide = () => {
  if (props.disabled) return

  if (showTimeout) {
    clearTimeout(showTimeout)
    showTimeout = null
  }

  hideTimeout = setTimeout(() => {
    isVisible.value = false
    emit('update:modelValue', false)
    emit('hide')
  }, props.hideDelay)
}

// Watch for manual control
watch(() => props.modelValue, (value) => {
  if (value !== undefined) {
    if (value && !isVisible.value) {
      show()
    } else if (!value && isVisible.value) {
      hide()
    }
  }
})

// Cleanup on unmount
onUnmounted(() => {
  if (showTimeout) clearTimeout(showTimeout)
  if (hideTimeout) clearTimeout(hideTimeout)
})

// Handle window resize
const handleResize = () => {
  if (isVisible.value) {
    calculatePosition()
  }
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
  window.addEventListener('scroll', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('scroll', handleResize)
})
</script>

<style scoped>
/* Tooltip trigger wrapper */
.app-tooltip-trigger {
  display: inline-block;
}

/* Base tooltip styles using design tokens */
.app-tooltip {
  position: fixed;
  pointer-events: none;
  border-radius: var(--border-radius-lg);
  font-family: var(--font-family-sans);
  font-weight: var(--font-weight-medium);
  line-height: var(--line-height-tight);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  z-index: 9999;
}

/* Size variants */
.app-tooltip--sm {
  padding: var(--spacing-1-5) var(--spacing-2);
  font-size: var(--font-size-xs);
  max-width: 200px;
}

.app-tooltip--md {
  padding: var(--spacing-2) var(--spacing-3);
  font-size: var(--font-size-sm);
  max-width: 280px;
}

.app-tooltip--lg {
  padding: var(--spacing-3) var(--spacing-4);
  font-size: var(--font-size-base);
  max-width: 360px;
}

/* Variant styles */
.app-tooltip--dark {
  background-color: var(--color-neutral-800);
  color: white;
}

.app-tooltip--light {
  background-color: var(--color-surface);
  color: var(--color-on-surface);
  border: 1px solid var(--color-outline);
}

.app-tooltip--default {
  background-color: var(--color-surface-variant);
  color: var(--color-on-surface-variant);
  border: 1px solid var(--color-outline);
}

/* Tooltip content */
.app-tooltip__content {
  word-wrap: break-word;
  hyphens: auto;
}

/* Tooltip arrow */
.app-tooltip__arrow {
  position: absolute;
  width: 8px;
  height: 8px;
  transform: rotate(45deg);
}

.app-tooltip--dark .app-tooltip__arrow {
  background-color: var(--color-neutral-800);
}

.app-tooltip--light .app-tooltip__arrow {
  background-color: var(--color-surface);
  border: 1px solid var(--color-outline);
}

.app-tooltip--default .app-tooltip__arrow {
  background-color: var(--color-surface-variant);
  border: 1px solid var(--color-outline);
}

/* Arrow positioning */
.app-tooltip--top .app-tooltip__arrow,
.app-tooltip--top-start .app-tooltip__arrow,
.app-tooltip--top-end .app-tooltip__arrow {
  bottom: -4px;
  border-top: none;
  border-left: none;
}

.app-tooltip--top .app-tooltip__arrow {
  left: 50%;
  transform: translateX(-50%) rotate(45deg);
}

.app-tooltip--top-start .app-tooltip__arrow {
  left: 12px;
}

.app-tooltip--top-end .app-tooltip__arrow {
  right: 12px;
}

.app-tooltip--bottom .app-tooltip__arrow,
.app-tooltip--bottom-start .app-tooltip__arrow,
.app-tooltip--bottom-end .app-tooltip__arrow {
  top: -4px;
  border-bottom: none;
  border-right: none;
}

.app-tooltip--bottom .app-tooltip__arrow {
  left: 50%;
  transform: translateX(-50%) rotate(45deg);
}

.app-tooltip--bottom-start .app-tooltip__arrow {
  left: 12px;
}

.app-tooltip--bottom-end .app-tooltip__arrow {
  right: 12px;
}

.app-tooltip--left .app-tooltip__arrow {
  right: -4px;
  top: 50%;
  transform: translateY(-50%) rotate(45deg);
  border-left: none;
  border-bottom: none;
}

.app-tooltip--right .app-tooltip__arrow {
  left: -4px;
  top: 50%;
  transform: translateY(-50%) rotate(45deg);
  border-right: none;
  border-top: none;
}

/* Transitions */
.tooltip-enter-active,
.tooltip-leave-active {
  transition: all var(--duration-short) var(--easing-standard);
}

.tooltip-enter-from,
.tooltip-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .app-tooltip--light,
  .app-tooltip--default {
    border-width: 2px;
  }
  
  .app-tooltip__content {
    font-weight: var(--font-weight-semibold);
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .tooltip-enter-active,
  .tooltip-leave-active {
    transition: none;
  }
  
  .tooltip-enter-from,
  .tooltip-leave-to {
    transform: none;
  }
}
</style>
