<template>
  <div :class="fieldClasses">
    <!-- Field label -->
    <label
      v-if="label"
      :for="fieldId"
      :class="labelClasses"
    >
      {{ label }}
      <span v-if="required" class="form-field__required" aria-label="required">*</span>
    </label>

    <!-- Field description -->
    <p v-if="description" class="form-field__description">
      {{ description }}
    </p>

    <!-- Field content -->
    <div class="form-field__content">
      <slot
        :field-id="fieldId"
        :has-error="hasError"
        :aria-describedby="ariaDescribedby"
      />
    </div>

    <!-- Validation messages and helper text -->
    <div v-if="helperText || validationMessages.length > 0" class="form-field__footer">
      <!-- Validation messages (highest priority) -->
      <ul v-if="validationMessages.length > 0" class="form-field__validation">
        <li
          v-for="(message, index) in validationMessages"
          :key="index"
          :class="validationClasses"
        >
          <VIcon
            v-if="validationIcon"
            :icon="validationIcon"
            size="14"
            class="form-field__validation-icon"
          />
          {{ message }}
        </li>
      </ul>
      
      <!-- Helper text -->
      <p v-else-if="helperText" class="form-field__helper">
        {{ helperText }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  // Field identification
  name?: string
  label?: string
  description?: string
  helperText?: string
  
  // Validation
  validationState?: 'success' | 'warning' | 'error' | null
  validationMessages?: string[]
  
  // States
  required?: boolean
  disabled?: boolean
  
  // Layout
  size?: 'sm' | 'md' | 'lg'
  
  // Accessibility
  ariaLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  validationMessages: () => [],
  size: 'md'
})

// Generate unique ID for accessibility
const fieldId = ref(`form-field-${Math.random().toString(36).substr(2, 9)}`)

// Computed properties
const hasError = computed(() => {
  return props.validationState === 'error' || props.validationMessages.length > 0
})

const hasSuccess = computed(() => props.validationState === 'success')
const hasWarning = computed(() => props.validationState === 'warning')

// Validation icon
const validationIcon = computed(() => {
  if (hasError.value) return 'mdi-alert-circle'
  if (hasWarning.value) return 'mdi-alert'
  if (hasSuccess.value) return 'mdi-check-circle'
  return null
})

// ARIA describedby for accessibility
const ariaDescribedby = computed(() => {
  const ids = []
  
  if (props.description) {
    ids.push(`${fieldId.value}-description`)
  }
  
  if (props.helperText) {
    ids.push(`${fieldId.value}-helper`)
  }
  
  if (props.validationMessages.length > 0) {
    ids.push(`${fieldId.value}-validation`)
  }
  
  return ids.length > 0 ? ids.join(' ') : undefined
})

// Classes
const fieldClasses = computed(() => [
  'form-field',
  `form-field--${props.size}`,
  {
    'form-field--required': props.required,
    'form-field--disabled': props.disabled,
    'form-field--error': hasError.value,
    'form-field--success': hasSuccess.value,
    'form-field--warning': hasWarning.value
  }
])

const labelClasses = computed(() => [
  'form-field__label',
  {
    'form-field__label--required': props.required,
    'form-field__label--error': hasError.value,
    'form-field__label--success': hasSuccess.value,
    'form-field__label--warning': hasWarning.value
  }
])

const validationClasses = computed(() => [
  'form-field__validation-item',
  {
    'form-field__validation-item--error': hasError.value,
    'form-field__validation-item--success': hasSuccess.value,
    'form-field__validation-item--warning': hasWarning.value
  }
])
</script>

<style scoped>
/* Base form field styles using design tokens */
.form-field {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1-5);
  margin-bottom: var(--spacing-4);
}

/* Size variants */
.form-field--sm {
  gap: var(--spacing-1);
  margin-bottom: var(--spacing-3);
}

.form-field--lg {
  gap: var(--spacing-2);
  margin-bottom: var(--spacing-6);
}

/* Label styles */
.form-field__label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-on-surface);
  line-height: var(--line-height-tight);
  margin-bottom: var(--spacing-0-5);
}

.form-field--sm .form-field__label {
  font-size: var(--font-size-xs);
}

.form-field--lg .form-field__label {
  font-size: var(--font-size-base);
}

.form-field__label--error {
  color: var(--color-error);
}

.form-field__label--success {
  color: var(--color-success);
}

.form-field__label--warning {
  color: var(--color-warning);
}

.form-field__required {
  color: var(--color-error);
  margin-left: var(--spacing-0-5);
}

/* Description styles */
.form-field__description {
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--color-on-surface-variant);
  line-height: var(--line-height-normal);
}

.form-field--sm .form-field__description {
  font-size: var(--font-size-xs);
}

.form-field--lg .form-field__description {
  font-size: var(--font-size-base);
}

/* Content wrapper */
.form-field__content {
  position: relative;
}

/* Footer content */
.form-field__footer {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
  min-height: 20px;
}

.form-field__helper {
  margin: 0;
  font-size: var(--font-size-xs);
  color: var(--color-on-surface-variant);
  line-height: var(--line-height-normal);
}

.form-field--sm .form-field__helper {
  font-size: 11px;
}

.form-field--lg .form-field__helper {
  font-size: var(--font-size-sm);
}

/* Validation messages */
.form-field__validation {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-0-5);
}

.form-field__validation-item {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-1);
  font-size: var(--font-size-xs);
  line-height: var(--line-height-normal);
}

.form-field--sm .form-field__validation-item {
  font-size: 11px;
}

.form-field--lg .form-field__validation-item {
  font-size: var(--font-size-sm);
}

.form-field__validation-item--error {
  color: var(--color-error);
}

.form-field__validation-item--success {
  color: var(--color-success);
}

.form-field__validation-item--warning {
  color: var(--color-warning);
}

.form-field__validation-icon {
  flex-shrink: 0;
  margin-top: 1px; /* Align with text baseline */
}

/* State styles */
.form-field--disabled {
  opacity: 0.6;
  pointer-events: none;
}

/* Focus-within styles for nested form controls */
.form-field:focus-within .form-field__label {
  color: var(--color-primary);
}

.form-field--error:focus-within .form-field__label {
  color: var(--color-error);
}

.form-field--success:focus-within .form-field__label {
  color: var(--color-success);
}

.form-field--warning:focus-within .form-field__label {
  color: var(--color-warning);
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .form-field {
    margin-bottom: var(--spacing-3);
  }
  
  .form-field--lg {
    margin-bottom: var(--spacing-4);
  }
  
  .form-field__label,
  .form-field__description {
    font-size: var(--font-size-sm);
  }
  
  .form-field--lg .form-field__label,
  .form-field--lg .form-field__description {
    font-size: var(--font-size-base);
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .form-field__label {
    font-weight: var(--font-weight-semibold);
  }
  
  .form-field__validation-item {
    font-weight: var(--font-weight-medium);
  }
}
</style>
