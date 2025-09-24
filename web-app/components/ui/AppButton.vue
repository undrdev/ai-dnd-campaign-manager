<template>
  <component
    :is="tag"
    :class="buttonClasses"
    :disabled="disabled || loading"
    :type="type"
    :to="to"
    :href="href"
    :target="target"
    :rel="rel"
    :aria-label="ariaLabel"
    :aria-describedby="ariaDescribedby"
    :aria-expanded="ariaExpanded"
    :aria-pressed="ariaPressed"
    @click="handleClick"
    @focus="handleFocus"
    @blur="handleBlur"
  >
    <!-- Loading spinner -->
    <div
      v-if="loading"
      class="app-button__loading"
      :class="{ 'app-button__loading--absolute': !loadingText }"
    >
      <svg
        class="app-button__spinner"
        :class="`app-button__spinner--${size}`"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-dasharray="31.416"
          stroke-dashoffset="31.416"
          class="app-button__spinner-circle"
        />
      </svg>
    </div>

    <!-- Button content -->
    <div
      class="app-button__content"
      :class="{
        'app-button__content--loading': loading && !loadingText,
        'app-button__content--hidden': loading && loadingText
      }"
    >
      <!-- Leading icon -->
      <VIcon
        v-if="prependIcon && !loading"
        :icon="prependIcon"
        :size="iconSize"
        class="app-button__icon app-button__icon--prepend"
      />

      <!-- Button text/content -->
      <span v-if="loading && loadingText" class="app-button__text">
        {{ loadingText }}
      </span>
      <span v-else-if="slots.default" class="app-button__text">
        <slot />
      </span>
      <span v-else-if="text" class="app-button__text">
        {{ text }}
      </span>

      <!-- Trailing icon -->
      <VIcon
        v-if="appendIcon && !loading"
        :icon="appendIcon"
        :size="iconSize"
        class="app-button__icon app-button__icon--append"
      />
    </div>

    <!-- Ripple effect -->
    <div v-if="!disabled && !noRipple" class="app-button__ripple" />
  </component>
</template>

<script setup lang="ts">
interface Props {
  // Content
  text?: string
  loadingText?: string
  
  // Icons
  prependIcon?: string
  appendIcon?: string
  
  // Variants
  variant?: 'filled' | 'outlined' | 'text' | 'tonal' | 'elevated'
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'dnd-red' | 'dnd-bronze' | 'dnd-purple' | 'dnd-green'
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  
  // States
  disabled?: boolean
  loading?: boolean
  active?: boolean
  
  // Behavior
  type?: 'button' | 'submit' | 'reset'
  block?: boolean
  rounded?: boolean
  pill?: boolean
  square?: boolean
  noRipple?: boolean
  
  // Navigation (for router-link or anchor)
  to?: string | object
  href?: string
  target?: string
  rel?: string
  
  // Accessibility
  ariaLabel?: string
  ariaDescribedby?: string
  ariaExpanded?: boolean | string
  ariaPressed?: boolean | string
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'filled',
  color: 'primary',
  size: 'md',
  type: 'button',
  disabled: false,
  loading: false,
  active: false,
  block: false,
  rounded: false,
  pill: false,
  square: false,
  noRipple: false
})

// Emits
const emit = defineEmits<{
  click: [event: Event]
  focus: [event: FocusEvent]
  blur: [event: FocusEvent]
}>()

// Determine the component tag
const tag = computed(() => {
  if (props.to) return 'NuxtLink'
  if (props.href) return 'a'
  return 'button'
})

// Icon size based on button size
const iconSize = computed(() => {
  const sizeMap = {
    xs: 14,
    sm: 16,
    md: 18,
    lg: 20,
    xl: 22
  }
  return sizeMap[props.size]
})

// Slots
const slots = useSlots()

// Button classes
const buttonClasses = computed(() => {
  return [
    'app-button',
    `app-button--${props.variant}`,
    `app-button--${props.color}`,
    `app-button--${props.size}`,
    {
      'app-button--disabled': props.disabled,
      'app-button--loading': props.loading,
      'app-button--active': props.active,
      'app-button--block': props.block,
      'app-button--rounded': props.rounded,
      'app-button--pill': props.pill,
      'app-button--square': props.square,
      'app-button--icon-only': !props.text && !slots.default && (props.prependIcon || props.appendIcon)
    }
  ]
})

// Event handlers
const handleClick = (event: Event) => {
  if (!props.disabled && !props.loading) {
    emit('click', event)
  }
}

const handleFocus = (event: FocusEvent) => {
  emit('focus', event)
}

const handleBlur = (event: FocusEvent) => {
  emit('blur', event)
}
</script>

<style scoped>
/* Base button styles using design tokens */
.app-button {
  /* Layout */
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  vertical-align: middle;
  
  /* Typography */
  font-family: var(--font-family-sans);
  font-weight: var(--font-weight-medium);
  text-decoration: none;
  text-align: center;
  white-space: nowrap;
  user-select: none;
  
  /* Interaction */
  cursor: pointer;
  border: 1px solid transparent;
  outline: none;
  overflow: hidden;
  
  /* Animation */
  transition: var(--transition-all-normal);
  
  /* Accessibility */
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
}

/* Size variants */
.app-button--xs {
  height: 28px;
  padding: 0 var(--spacing-3);
  font-size: var(--font-size-xs);
  line-height: var(--line-height-tight);
  border-radius: var(--border-radius-sm);
  gap: var(--spacing-1);
}

.app-button--sm {
  height: 32px;
  padding: 0 var(--spacing-4);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-tight);
  border-radius: var(--border-radius-md);
  gap: var(--spacing-1-5);
}

.app-button--md {
  height: 40px;
  padding: 0 var(--spacing-6);
  font-size: var(--font-size-base);
  line-height: var(--line-height-normal);
  border-radius: var(--border-radius-lg);
  gap: var(--spacing-2);
}

.app-button--lg {
  height: 48px;
  padding: 0 var(--spacing-8);
  font-size: var(--font-size-lg);
  line-height: var(--line-height-normal);
  border-radius: var(--border-radius-xl);
  gap: var(--spacing-2-5);
}

.app-button--xl {
  height: 56px;
  padding: 0 var(--spacing-10);
  font-size: var(--font-size-xl);
  line-height: var(--line-height-normal);
  border-radius: var(--border-radius-xl);
  gap: var(--spacing-3);
}

/* Color variants - Filled */
.app-button--filled.app-button--primary {
  background-color: var(--color-primary);
  color: var(--color-on-primary);
}

.app-button--filled.app-button--primary:hover {
  background-color: var(--color-primary-600);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.12);
}

.app-button--filled.app-button--secondary {
  background-color: var(--color-secondary);
  color: var(--color-on-secondary);
}

.app-button--filled.app-button--secondary:hover {
  background-color: var(--color-secondary-600);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.12);
}

.app-button--filled.app-button--success {
  background-color: var(--color-success);
  color: var(--color-on-success);
}

.app-button--filled.app-button--warning {
  background-color: var(--color-warning);
  color: var(--color-on-warning);
}

.app-button--filled.app-button--error {
  background-color: var(--color-error);
  color: var(--color-on-error);
}

.app-button--filled.app-button--info {
  background-color: var(--color-info);
  color: var(--color-on-info);
}

/* D&D themed colors */
.app-button--filled.app-button--dnd-red {
  background-color: var(--color-dnd-red-500);
  color: white;
}

.app-button--filled.app-button--dnd-bronze {
  background-color: var(--color-dnd-bronze-500);
  color: white;
}

.app-button--filled.app-button--dnd-purple {
  background-color: var(--color-dnd-purple-500);
  color: white;
}

.app-button--filled.app-button--dnd-green {
  background-color: var(--color-dnd-green-500);
  color: white;
}

/* Outlined variant */
.app-button--outlined {
  background-color: transparent;
  border: 1px solid var(--color-outline);
}

.app-button--outlined.app-button--primary {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.app-button--outlined.app-button--primary:hover {
  background-color: var(--color-primary-container);
}

/* Text variant */
.app-button--text {
  background-color: transparent;
  border: none;
}

.app-button--text.app-button--primary {
  color: var(--color-primary);
}

.app-button--text.app-button--primary:hover {
  background-color: rgba(var(--color-primary-rgb), 0.08);
}

/* Tonal variant */
.app-button--tonal.app-button--primary {
  background-color: var(--color-primary-container);
  color: var(--color-on-primary-container);
}

.app-button--tonal.app-button--primary:hover {
  background-color: var(--color-primary-200);
}

/* Elevated variant */
.app-button--elevated {
  background-color: var(--color-surface);
  color: var(--color-primary);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24);
}

.app-button--elevated:hover {
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.16), 0 3px 6px rgba(0, 0, 0, 0.23);
  transform: translateY(-1px);
}

/* States */
.app-button--disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

.app-button--loading {
  cursor: wait;
}

.app-button--active {
  transform: scale(0.98);
}

/* Layout modifiers */
.app-button--block {
  display: flex;
  width: 100%;
}

.app-button--rounded {
  border-radius: var(--border-radius-2xl);
}

.app-button--pill {
  border-radius: var(--border-radius-full);
}

.app-button--square {
  border-radius: 0;
}

.app-button--icon-only {
  width: var(--spacing-10);
  padding: 0;
}

.app-button--icon-only.app-button--xs {
  width: 28px;
}

.app-button--icon-only.app-button--sm {
  width: 32px;
}

.app-button--icon-only.app-button--md {
  width: 40px;
}

.app-button--icon-only.app-button--lg {
  width: 48px;
}

.app-button--icon-only.app-button--xl {
  width: 56px;
}

/* Content and loading states */
.app-button__content {
  display: flex;
  align-items: center;
  justify-content: center;
  transition: var(--transition-opacity);
}

.app-button__content--loading {
  opacity: 0.3;
}

.app-button__content--hidden {
  opacity: 0;
}

.app-button__text {
  flex: 1;
  line-height: 1;
}

.app-button__icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
}

/* Loading spinner */
.app-button__loading {
  display: flex;
  align-items: center;
  justify-content: center;
}

.app-button__loading--absolute {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.app-button__spinner {
  animation: spin var(--duration-slower) linear infinite;
}

.app-button__spinner--xs {
  width: 14px;
  height: 14px;
}

.app-button__spinner--sm {
  width: 16px;
  height: 16px;
}

.app-button__spinner--md {
  width: 18px;
  height: 18px;
}

.app-button__spinner--lg {
  width: 20px;
  height: 20px;
}

.app-button__spinner--xl {
  width: 22px;
  height: 22px;
}

.app-button__spinner-circle {
  animation: spinner-dash 1.5s ease-in-out infinite;
}

/* Ripple effect */
.app-button__ripple {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: inherit;
  overflow: hidden;
  pointer-events: none;
}

/* Animations */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes spinner-dash {
  0% {
    stroke-dasharray: 1, 150;
    stroke-dashoffset: 0;
  }
  50% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -35;
  }
  100% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -124;
  }
}

/* Focus styles for accessibility */
.app-button:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* Active/pressed state */
.app-button:active:not(.app-button--disabled) {
  transform: scale(0.98);
}

/* Hover effects */
.app-button:hover:not(.app-button--disabled):not(.app-button--loading) {
  filter: brightness(1.05);
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .app-button--outlined,
  .app-button--text {
    border-width: 2px;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .app-button,
  .app-button__content,
  .app-button__spinner {
    transition: none;
    animation: none;
  }
}
</style>
