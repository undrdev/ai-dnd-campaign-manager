<template>
  <span
    :class="badgeClasses"
    :role="role"
    :aria-label="ariaLabel"
  >
    <!-- Icon -->
    <VIcon
      v-if="icon && variant !== 'dot'"
      :icon="icon"
      :size="iconSize"
      class="app-badge__icon"
    />
    
    <!-- Content -->
    <span v-if="variant !== 'dot' && (text || slots.default)" class="app-badge__content">
      <slot v-if="slots.default" />
      <span v-else-if="text">{{ text }}</span>
    </span>
    
    <!-- Pulse animation for dot variant -->
    <span v-if="pulse && variant === 'dot'" class="app-badge__pulse" />
  </span>
</template>

<script setup lang="ts">
interface Props {
  // Content
  text?: string | number
  icon?: string
  
  // Variants
  variant?: 'filled' | 'outlined' | 'dot'
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'dnd-red' | 'dnd-bronze' | 'dnd-purple' | 'dnd-green'
  size?: 'xs' | 'sm' | 'md' | 'lg'
  
  // Visual effects
  rounded?: boolean
  pulse?: boolean
  
  // Accessibility
  role?: string
  ariaLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'filled',
  color: 'primary',
  size: 'sm',
  rounded: false,
  pulse: false,
  role: 'status'
})

// Icon size based on badge size
const iconSize = computed(() => {
  const sizeMap = {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16
  }
  return sizeMap[props.size]
})

// Slots
const slots = useSlots()

// Badge classes
const badgeClasses = computed(() => [
  'app-badge',
  `app-badge--${props.variant}`,
  `app-badge--${props.color}`,
  `app-badge--${props.size}`,
  {
    'app-badge--rounded': props.rounded,
    'app-badge--pulse': props.pulse,
    'app-badge--with-icon': props.icon && props.variant !== 'dot',
    'app-badge--icon-only': props.icon && !props.text && !slots.default && props.variant !== 'dot'
  }
])
</script>

<style scoped>
/* Base badge styles using design tokens */
.app-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  vertical-align: top;
  font-family: var(--font-family-sans);
  font-weight: var(--font-weight-medium);
  white-space: nowrap;
  position: relative;
  overflow: hidden;
}

/* Size variants */
.app-badge--xs {
  height: 16px;
  padding: 0 var(--spacing-1-5);
  font-size: var(--font-size-xs);
  line-height: 1;
  border-radius: var(--border-radius-sm);
  gap: var(--spacing-1);
}

.app-badge--xs.app-badge--dot {
  width: 8px;
  height: 8px;
  padding: 0;
  border-radius: var(--border-radius-full);
}

.app-badge--sm {
  height: 20px;
  padding: 0 var(--spacing-2);
  font-size: var(--font-size-xs);
  line-height: 1;
  border-radius: var(--border-radius-md);
  gap: var(--spacing-1);
}

.app-badge--sm.app-badge--dot {
  width: 10px;
  height: 10px;
  padding: 0;
  border-radius: var(--border-radius-full);
}

.app-badge--md {
  height: 24px;
  padding: 0 var(--spacing-3);
  font-size: var(--font-size-sm);
  line-height: 1;
  border-radius: var(--border-radius-lg);
  gap: var(--spacing-1-5);
}

.app-badge--md.app-badge--dot {
  width: 12px;
  height: 12px;
  padding: 0;
  border-radius: var(--border-radius-full);
}

.app-badge--lg {
  height: 28px;
  padding: 0 var(--spacing-4);
  font-size: var(--font-size-sm);
  line-height: 1;
  border-radius: var(--border-radius-lg);
  gap: var(--spacing-2);
}

.app-badge--lg.app-badge--dot {
  width: 14px;
  height: 14px;
  padding: 0;
  border-radius: var(--border-radius-full);
}

/* Icon-only badges */
.app-badge--icon-only {
  padding: 0;
  aspect-ratio: 1;
}

/* Filled variant colors */
.app-badge--filled.app-badge--primary {
  background-color: var(--color-primary);
  color: var(--color-on-primary);
}

.app-badge--filled.app-badge--secondary {
  background-color: var(--color-secondary);
  color: var(--color-on-secondary);
}

.app-badge--filled.app-badge--success {
  background-color: var(--color-success);
  color: var(--color-on-success);
}

.app-badge--filled.app-badge--warning {
  background-color: var(--color-warning);
  color: var(--color-on-warning);
}

.app-badge--filled.app-badge--error {
  background-color: var(--color-error);
  color: var(--color-on-error);
}

.app-badge--filled.app-badge--info {
  background-color: var(--color-info);
  color: var(--color-on-info);
}

.app-badge--filled.app-badge--neutral {
  background-color: var(--color-surface-variant);
  color: var(--color-on-surface-variant);
}

/* D&D themed colors */
.app-badge--filled.app-badge--dnd-red {
  background-color: var(--color-dnd-red-500);
  color: white;
}

.app-badge--filled.app-badge--dnd-bronze {
  background-color: var(--color-dnd-bronze-500);
  color: white;
}

.app-badge--filled.app-badge--dnd-purple {
  background-color: var(--color-dnd-purple-500);
  color: white;
}

.app-badge--filled.app-badge--dnd-green {
  background-color: var(--color-dnd-green-500);
  color: white;
}

/* Outlined variant colors */
.app-badge--outlined {
  background-color: transparent;
  border: 1px solid;
}

.app-badge--outlined.app-badge--primary {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.app-badge--outlined.app-badge--secondary {
  border-color: var(--color-secondary);
  color: var(--color-secondary);
}

.app-badge--outlined.app-badge--success {
  border-color: var(--color-success);
  color: var(--color-success);
}

.app-badge--outlined.app-badge--warning {
  border-color: var(--color-warning);
  color: var(--color-warning);
}

.app-badge--outlined.app-badge--error {
  border-color: var(--color-error);
  color: var(--color-error);
}

.app-badge--outlined.app-badge--info {
  border-color: var(--color-info);
  color: var(--color-info);
}

.app-badge--outlined.app-badge--neutral {
  border-color: var(--color-outline);
  color: var(--color-on-surface);
}

/* Rounded modifier */
.app-badge--rounded:not(.app-badge--dot) {
  border-radius: var(--border-radius-full);
}

/* Pulse animation */
.app-badge--pulse {
  animation: badge-pulse 2s infinite;
}

.app-badge__pulse {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: inherit;
  background-color: inherit;
  animation: badge-pulse-ring 2s infinite;
}

/* Badge content */
.app-badge__content {
  flex: 1;
  display: flex;
  align-items: center;
  min-width: 0;
}

.app-badge__icon {
  flex-shrink: 0;
}

/* Animations */
@keyframes badge-pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

@keyframes badge-pulse-ring {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  100% {
    transform: scale(2);
    opacity: 0;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .app-badge--pulse,
  .app-badge__pulse {
    animation: none;
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .app-badge--outlined {
    border-width: 2px;
  }
}
</style>
