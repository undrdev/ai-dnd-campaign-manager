<template>
  <component
    :is="tag"
    :class="cardClasses"
    :to="to"
    :href="href"
    :target="target"
    :rel="rel"
    :role="role"
    :tabindex="interactive ? 0 : undefined"
    @click="handleClick"
    @keydown="handleKeydown"
  >
    <!-- Glass morphism background overlay -->
    <div v-if="glass" class="app-card__glass" />
    
    <!-- Header section -->
    <div v-if="$slots.header || title || subtitle || actions" class="app-card__header">
      <div v-if="$slots.header" class="app-card__header-content">
        <slot name="header" />
      </div>
      <div v-else class="app-card__header-content">
        <!-- Avatar or icon -->
        <div v-if="avatar || icon" class="app-card__avatar">
          <img v-if="avatar" :src="avatar" :alt="avatarAlt" class="app-card__avatar-image" />
          <VIcon v-else-if="icon" :icon="icon" :size="iconSize" :color="iconColor" />
        </div>
        
        <!-- Title and subtitle -->
        <div class="app-card__title-section">
          <h3 v-if="title" :class="titleClasses">
            {{ title }}
          </h3>
          <p v-if="subtitle" :class="subtitleClasses">
            {{ subtitle }}
          </p>
        </div>
        
        <!-- Header actions -->
        <div v-if="$slots.actions" class="app-card__actions">
          <slot name="actions" />
        </div>
      </div>
    </div>

    <!-- Media section -->
    <div v-if="$slots.media || image" class="app-card__media">
      <slot v-if="$slots.media" name="media" />
      <img v-else-if="image" :src="image" :alt="imageAlt" class="app-card__image" />
    </div>

    <!-- Content section -->
    <div v-if="$slots.default || content" class="app-card__content">
      <slot v-if="$slots.default" />
      <p v-else-if="content" class="app-card__text">
        {{ content }}
      </p>
    </div>

    <!-- Footer section -->
    <div v-if="$slots.footer" class="app-card__footer">
      <slot name="footer" />
    </div>

    <!-- Badge overlay -->
    <div v-if="badge" class="app-card__badge">
      <AppBadge
        :variant="badgeVariant"
        :color="badgeColor"
        :size="badgeSize"
      >
        {{ badge }}
      </AppBadge>
    </div>

    <!-- Loading overlay -->
    <div v-if="loading" class="app-card__loading">
      <AppLoading
        type="circular"
        :size="48"
        color="primary"
      />
    </div>

    <!-- Hover effect overlay -->
    <div v-if="hover && !disabled" class="app-card__hover" />
  </component>
</template>

<script setup lang="ts">
interface Props {
  // Content
  title?: string
  subtitle?: string
  content?: string
  
  // Media
  image?: string
  imageAlt?: string
  avatar?: string
  avatarAlt?: string
  icon?: string
  iconColor?: string
  
  // Variants
  variant?: 'elevated' | 'outlined' | 'filled' | 'tonal'
  color?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info'
  size?: 'sm' | 'md' | 'lg'
  
  // Visual effects
  glass?: boolean
  hover?: boolean
  rounded?: boolean
  shadow?: boolean
  border?: boolean
  
  // States
  loading?: boolean
  disabled?: boolean
  selected?: boolean
  
  // Behavior
  interactive?: boolean
  clickable?: boolean
  
  // Navigation
  to?: string | object
  href?: string
  target?: string
  rel?: string
  
  // Badge
  badge?: string
  badgeVariant?: 'filled' | 'outlined' | 'dot'
  badgeColor?: string
  badgeSize?: 'sm' | 'md' | 'lg'
  
  // Accessibility
  role?: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'elevated',
  color: 'default',
  size: 'md',
  glass: false,
  hover: true,
  rounded: true,
  shadow: true,
  border: false,
  loading: false,
  disabled: false,
  selected: false,
  interactive: false,
  clickable: false,
  badgeVariant: 'filled',
  badgeColor: 'primary',
  badgeSize: 'sm'
})

// Emits
const emit = defineEmits<{
  click: [event: Event]
}>()

// Determine the component tag
const tag = computed(() => {
  if (props.to) return 'NuxtLink'
  if (props.href) return 'a'
  return 'div'
})

// Interactive state
const interactive = computed(() => {
  return props.interactive || props.clickable || props.to || props.href
})

// Icon size based on card size
const iconSize = computed(() => {
  const sizeMap = {
    sm: 20,
    md: 24,
    lg: 28
  }
  return sizeMap[props.size]
})

// Title classes
const titleClasses = computed(() => [
  'app-card__title',
  {
    'app-card__title--sm': props.size === 'sm',
    'app-card__title--md': props.size === 'md',
    'app-card__title--lg': props.size === 'lg'
  }
])

// Subtitle classes
const subtitleClasses = computed(() => [
  'app-card__subtitle',
  {
    'app-card__subtitle--sm': props.size === 'sm',
    'app-card__subtitle--md': props.size === 'md',
    'app-card__subtitle--lg': props.size === 'lg'
  }
])

// Card classes
const cardClasses = computed(() => [
  'app-card',
  `app-card--${props.variant}`,
  `app-card--${props.color}`,
  `app-card--${props.size}`,
  {
    'app-card--glass': props.glass,
    'app-card--hover': props.hover && !props.disabled,
    'app-card--rounded': props.rounded,
    'app-card--shadow': props.shadow,
    'app-card--border': props.border,
    'app-card--loading': props.loading,
    'app-card--disabled': props.disabled,
    'app-card--selected': props.selected,
    'app-card--interactive': interactive.value,
    'app-card--clickable': props.clickable
  }
])

// Event handlers
const handleClick = (event: Event) => {
  if (!props.disabled && !props.loading) {
    emit('click', event)
  }
}

const handleKeydown = (event: KeyboardEvent) => {
  if (interactive.value && (event.key === 'Enter' || event.key === ' ')) {
    event.preventDefault()
    handleClick(event)
  }
}
</script>

<style scoped>
/* Base card styles using design tokens */
.app-card {
  position: relative;
  display: flex;
  flex-direction: column;
  background-color: var(--color-surface);
  border-radius: var(--border-radius-lg);
  overflow: hidden;
  transition: var(--transition-all-normal);
  
  /* Accessibility */
  outline: none;
}

/* Size variants */
.app-card--sm {
  min-height: 120px;
}

.app-card--md {
  min-height: 200px;
}

.app-card--lg {
  min-height: 300px;
}

/* Variant styles */
.app-card--elevated {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24);
}

.app-card--outlined {
  border: 1px solid var(--color-outline);
  box-shadow: none;
}

.app-card--filled {
  background-color: var(--color-surface-variant);
  box-shadow: none;
}

.app-card--tonal {
  background-color: var(--color-surface-container);
  box-shadow: none;
}

/* Color variants */
.app-card--primary {
  border-color: var(--color-primary);
}

.app-card--primary.app-card--filled {
  background-color: var(--color-primary-container);
  color: var(--color-on-primary-container);
}

.app-card--secondary {
  border-color: var(--color-secondary);
}

.app-card--secondary.app-card--filled {
  background-color: var(--color-secondary-container);
  color: var(--color-on-secondary-container);
}

/* Glass morphism effect */
.app-card--glass {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.app-card--glass::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
}

.app-card__glass {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
  pointer-events: none;
}

/* Visual modifiers */
.app-card--rounded {
  border-radius: var(--border-radius-xl);
}

.app-card--shadow {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.app-card--border {
  border: 1px solid var(--color-outline);
}

/* Interactive states */
.app-card--interactive {
  cursor: pointer;
}

.app-card--hover:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
}

.app-card--clickable:active {
  transform: scale(0.98);
}

.app-card--selected {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(var(--color-primary-rgb), 0.2);
}

.app-card--disabled {
  opacity: 0.6;
  cursor: not-allowed;
  pointer-events: none;
}

.app-card--loading {
  pointer-events: none;
}

/* Card sections */
.app-card__header {
  padding: var(--spacing-4) var(--spacing-6) var(--spacing-2);
  border-bottom: 1px solid rgba(var(--color-outline-rgb), 0.2);
}

.app-card__header-content {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-3);
}

.app-card__avatar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.app-card__avatar-image {
  width: 40px;
  height: 40px;
  border-radius: var(--border-radius-full);
  object-fit: cover;
}

.app-card__title-section {
  flex: 1;
  min-width: 0;
}

.app-card__title {
  margin: 0 0 var(--spacing-1) 0;
  font-family: var(--font-family-serif);
  font-weight: var(--font-weight-bold);
  color: var(--color-on-surface);
  line-height: var(--line-height-tight);
}

.app-card__title--sm {
  font-size: var(--font-size-lg);
}

.app-card__title--md {
  font-size: var(--font-size-xl);
}

.app-card__title--lg {
  font-size: var(--font-size-2xl);
}

.app-card__subtitle {
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--color-on-surface-variant);
  line-height: var(--line-height-normal);
}

.app-card__subtitle--sm {
  font-size: var(--font-size-xs);
}

.app-card__subtitle--md {
  font-size: var(--font-size-sm);
}

.app-card__subtitle--lg {
  font-size: var(--font-size-base);
}

.app-card__actions {
  flex-shrink: 0;
  display: flex;
  gap: var(--spacing-2);
}

.app-card__media {
  position: relative;
  overflow: hidden;
}

.app-card__image {
  width: 100%;
  height: 200px;
  object-fit: cover;
  display: block;
}

.app-card__content {
  flex: 1;
  padding: var(--spacing-4) var(--spacing-6);
}

.app-card__text {
  margin: 0;
  font-size: var(--font-size-base);
  line-height: var(--line-height-relaxed);
  color: var(--color-on-surface);
}

.app-card__footer {
  padding: var(--spacing-2) var(--spacing-6) var(--spacing-4);
  border-top: 1px solid rgba(var(--color-outline-rgb), 0.2);
}

/* Badge overlay */
.app-card__badge {
  position: absolute;
  top: var(--spacing-3);
  right: var(--spacing-3);
  z-index: 1;
}

/* Loading overlay */
.app-card__loading {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(var(--color-surface-rgb), 0.8);
  z-index: 2;
}

/* Hover effect overlay */
.app-card__hover {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
  opacity: 0;
  transition: var(--transition-opacity);
  pointer-events: none;
}

.app-card--hover:hover .app-card__hover {
  opacity: 1;
}

/* Focus styles for accessibility */
.app-card--interactive:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* Dark theme adjustments */
.dark .app-card--glass {
  background: rgba(0, 0, 0, 0.2);
  border-color: rgba(255, 255, 255, 0.1);
}

.dark .app-card__glass {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02));
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .app-card--outlined {
    border-width: 2px;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .app-card,
  .app-card__hover {
    transition: none;
  }
  
  .app-card--hover:hover {
    transform: none;
  }
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .app-card__header {
    padding: var(--spacing-3) var(--spacing-4) var(--spacing-2);
  }
  
  .app-card__content {
    padding: var(--spacing-3) var(--spacing-4);
  }
  
  .app-card__footer {
    padding: var(--spacing-2) var(--spacing-4) var(--spacing-3);
  }
  
  .app-card__image {
    height: 160px;
  }
}
</style>
