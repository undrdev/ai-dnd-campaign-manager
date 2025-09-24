<template>
  <component
    :is="tag"
    :class="avatarClasses"
    :to="to"
    :href="href"
    :target="target"
    :rel="rel"
    :role="role"
    :aria-label="ariaLabel"
    :tabindex="interactive ? 0 : undefined"
    @click="handleClick"
    @keydown="handleKeydown"
  >
    <!-- Image avatar -->
    <img
      v-if="src && !imageError"
      :src="src"
      :alt="alt"
      :loading="loading"
      class="app-avatar__image"
      @error="handleImageError"
      @load="handleImageLoad"
    />
    
    <!-- Icon avatar -->
    <VIcon
      v-else-if="icon"
      :icon="icon"
      :size="iconSize"
      class="app-avatar__icon"
    />
    
    <!-- Text avatar (initials) -->
    <span v-else-if="text || initials" class="app-avatar__text">
      {{ displayText }}
    </span>
    
    <!-- Placeholder avatar -->
    <VIcon
      v-else
      icon="mdi-account"
      :size="iconSize"
      class="app-avatar__icon app-avatar__icon--placeholder"
    />

    <!-- Status indicator -->
    <div
      v-if="status"
      :class="statusClasses"
      :aria-label="statusLabel"
      role="img"
    >
      <div v-if="status === 'online'" class="app-avatar__status-dot" />
      <VIcon
        v-else-if="statusIcon"
        :icon="statusIcon"
        size="12"
        class="app-avatar__status-icon"
      />
    </div>

    <!-- Badge overlay -->
    <div v-if="badge" class="app-avatar__badge">
      <AppBadge
        :variant="badgeVariant"
        :color="badgeColor"
        :size="badgeSize"
        :text="badge"
      />
    </div>

    <!-- Loading overlay -->
      <div v-if="imageLoading" class="app-avatar__loading">
        <VIcon
          icon="mdi-loading"
          :size="Math.floor(numericSize * 0.4)"
          class="app-avatar__loading-icon"
        />
      </div>
  </component>
</template>

<script setup lang="ts">
interface Props {
  // Content
  src?: string
  alt?: string
  text?: string
  icon?: string
  
  // Variants
  variant?: 'circular' | 'rounded' | 'square'
  size?: number | 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'random'
  
  // Status indicator
  status?: 'online' | 'offline' | 'away' | 'busy' | 'custom'
  statusColor?: string
  statusIcon?: string
  
  // Badge
  badge?: string | number
  badgeVariant?: 'filled' | 'outlined' | 'dot'
  badgeColor?: string
  badgeSize?: 'xs' | 'sm' | 'md'
  
  // Behavior
  interactive?: boolean
  clickable?: boolean
  
  // Navigation
  to?: string | object
  href?: string
  target?: string
  rel?: string
  
  // Image loading
  loading?: 'lazy' | 'eager'
  
  // Accessibility
  role?: string
  ariaLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'circular',
  size: 'md',
  color: 'primary',
  interactive: false,
  clickable: false,
  loading: 'lazy',
  badgeVariant: 'filled',
  badgeColor: 'primary',
  badgeSize: 'xs'
})

// Emits
const emit = defineEmits<{
  click: [event: Event]
  'image-load': [event: Event]
  'image-error': [event: Event]
}>()

// State
const imageError = ref(false)
const imageLoading = ref(false)

// Computed properties
const tag = computed(() => {
  if (props.to) return 'NuxtLink'
  if (props.href) return 'a'
  return 'div'
})

const interactive = computed(() => {
  return props.interactive || props.clickable || props.to || props.href
})

// Size handling
const numericSize = computed(() => {
  if (typeof props.size === 'number') return props.size
  
  const sizeMap = {
    xs: 24,
    sm: 32,
    md: 40,
    lg: 48,
    xl: 56
  }
  
  return sizeMap[props.size]
})

const iconSize = computed(() => {
  return Math.floor(numericSize.value * 0.6)
})

// Text handling
const initials = computed(() => {
  if (props.text) {
    return props.text
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase()
  }
  return ''
})

const displayText = computed(() => {
  return props.text || initials.value
})

// Color generation for text avatars
const backgroundColorFromText = computed(() => {
  if (props.color !== 'random') return null
  
  const text = displayText.value
  if (!text) return null
  
  // Generate a consistent color based on text
  let hash = 0
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash)
  }
  
  const hue = Math.abs(hash) % 360
  return `hsl(${hue}, 65%, 50%)`
})

// Status handling
const statusIcon = computed(() => {
  if (props.statusIcon) return props.statusIcon
  
  switch (props.status) {
    case 'offline': return 'mdi-minus-circle'
    case 'away': return 'mdi-clock'
    case 'busy': return 'mdi-minus-circle'
    default: return null
  }
})

const statusLabel = computed(() => {
  switch (props.status) {
    case 'online': return 'Online'
    case 'offline': return 'Offline'
    case 'away': return 'Away'
    case 'busy': return 'Busy'
    default: return 'Status'
  }
})

// Classes
const avatarClasses = computed(() => [
  'app-avatar',
  `app-avatar--${props.variant}`,
  `app-avatar--${props.color}`,
  {
    'app-avatar--interactive': interactive.value,
    'app-avatar--clickable': props.clickable,
    'app-avatar--with-status': props.status,
    'app-avatar--with-badge': props.badge,
    'app-avatar--loading': imageLoading.value
  }
])

const statusClasses = computed(() => [
  'app-avatar__status',
  `app-avatar__status--${props.status}`,
  {
    'app-avatar__status--with-color': props.statusColor
  }
])

// Event handlers
const handleClick = (event: Event) => {
  if (interactive.value) {
    emit('click', event)
  }
}

const handleKeydown = (event: KeyboardEvent) => {
  if (interactive.value && (event.key === 'Enter' || event.key === ' ')) {
    event.preventDefault()
    handleClick(event)
  }
}

const handleImageError = (event: Event) => {
  imageError.value = true
  imageLoading.value = false
  emit('image-error', event)
}

const handleImageLoad = (event: Event) => {
  imageLoading.value = false
  emit('image-load', event)
}

// Watch for src changes
watch(() => props.src, () => {
  imageError.value = false
  if (props.src) {
    imageLoading.value = true
  }
}, { immediate: true })
</script>

<style scoped>
/* Base avatar styles using design tokens */
.app-avatar {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
  background-color: var(--color-surface-variant);
  color: var(--color-on-surface-variant);
  font-family: var(--font-family-sans);
  font-weight: var(--font-weight-medium);
  text-decoration: none;
  outline: none;
  transition: var(--transition-all-normal);
  
  /* Dynamic size */
  width: v-bind('numericSize + "px"');
  height: v-bind('numericSize + "px"');
  font-size: v-bind('Math.floor(numericSize * 0.4) + "px"');
}

/* Variant styles */
.app-avatar--circular {
  border-radius: var(--border-radius-full);
}

.app-avatar--rounded {
  border-radius: var(--border-radius-lg);
}

.app-avatar--square {
  border-radius: var(--border-radius-sm);
}

/* Color variants */
.app-avatar--primary {
  background-color: var(--color-primary-container);
  color: var(--color-on-primary-container);
}

.app-avatar--secondary {
  background-color: var(--color-secondary-container);
  color: var(--color-on-secondary-container);
}

.app-avatar--success {
  background-color: var(--color-success-container);
  color: var(--color-on-success-container);
}

.app-avatar--warning {
  background-color: var(--color-warning-container);
  color: var(--color-on-warning-container);
}

.app-avatar--error {
  background-color: var(--color-error-container);
  color: var(--color-on-error-container);
}

.app-avatar--info {
  background-color: var(--color-info-container);
  color: var(--color-on-info-container);
}

.app-avatar--neutral {
  background-color: var(--color-surface-variant);
  color: var(--color-on-surface-variant);
}

.app-avatar--random {
  background-color: v-bind('backgroundColorFromText');
  color: white;
}

/* Interactive states */
.app-avatar--interactive {
  cursor: pointer;
}

.app-avatar--interactive:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.12);
}

.app-avatar--interactive:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.app-avatar--clickable:active {
  transform: scale(0.95);
}

/* Avatar content */
.app-avatar__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.app-avatar__icon {
  flex-shrink: 0;
}

.app-avatar__icon--placeholder {
  opacity: 0.6;
}

.app-avatar__text {
  font-weight: var(--font-weight-semibold);
  line-height: 1;
  text-align: center;
  user-select: none;
}

/* Status indicator */
.app-avatar__status {
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 14px;
  height: 14px;
  border-radius: var(--border-radius-full);
  border: 2px solid var(--color-surface);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
}

.app-avatar__status--online {
  background-color: var(--color-success);
}

.app-avatar__status--offline {
  background-color: var(--color-outline);
}

.app-avatar__status--away {
  background-color: var(--color-warning);
}

.app-avatar__status--busy {
  background-color: var(--color-error);
}

.app-avatar__status--custom {
  background-color: v-bind('props.statusColor || "var(--color-primary)"');
}

.app-avatar__status--with-color {
  background-color: v-bind('props.statusColor');
}

.app-avatar__status-dot {
  width: 8px;
  height: 8px;
  border-radius: var(--border-radius-full);
  background-color: currentColor;
}

.app-avatar__status-icon {
  color: white;
}

/* Badge overlay */
.app-avatar__badge {
  position: absolute;
  top: -4px;
  right: -4px;
  z-index: 2;
}

/* Loading overlay */
.app-avatar__loading {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(var(--color-surface-rgb), 0.8);
  border-radius: inherit;
}

.app-avatar__loading-icon {
  animation: spin 1s linear infinite;
  opacity: 0.7;
}

/* Size-specific adjustments */
.app-avatar[style*="24px"] .app-avatar__status {
  width: 10px;
  height: 10px;
  bottom: -1px;
  right: -1px;
}

.app-avatar[style*="24px"] .app-avatar__status-dot {
  width: 6px;
  height: 6px;
}

.app-avatar[style*="56px"] .app-avatar__status,
.app-avatar[style*="64px"] .app-avatar__status {
  width: 18px;
  height: 18px;
  bottom: -3px;
  right: -3px;
}

.app-avatar[style*="56px"] .app-avatar__status-dot,
.app-avatar[style*="64px"] .app-avatar__status-dot {
  width: 10px;
  height: 10px;
}

/* Animations */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Group avatars (when used in a group) */
.app-avatar-group .app-avatar {
  border: 2px solid var(--color-surface);
  margin-left: -8px;
}

.app-avatar-group .app-avatar:first-child {
  margin-left: 0;
}

.app-avatar-group .app-avatar:hover {
  z-index: 1;
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .app-avatar {
    border: 2px solid var(--color-outline);
  }
  
  .app-avatar__status {
    border-width: 3px;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .app-avatar,
  .app-avatar__loading-icon {
    transition: none;
    animation: none;
  }
  
  .app-avatar--interactive:hover {
    transform: none;
  }
}
</style>
