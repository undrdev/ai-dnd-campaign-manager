<template>
  <FormField
    :label="label"
    :description="description"
    :helper-text="helperText"
    :validation-state="validationState"
    :validation-messages="validationMessages"
    :required="required"
    :disabled="disabled"
    :size="size"
  >
    <template #default="{ fieldId, hasError, ariaDescribedby }">
      <div :class="checkboxWrapperClasses">
        <!-- Checkbox input -->
        <input
          :id="fieldId"
          ref="checkboxRef"
          v-model="internalValue"
          type="checkbox"
          :class="checkboxClasses"
          :disabled="disabled"
          :required="required"
          :aria-label="ariaLabel"
          :aria-describedby="ariaDescribedby"
          :aria-invalid="hasError"
          :aria-required="required"
          @change="handleChange"
          @focus="handleFocus"
          @blur="handleBlur"
        />

        <!-- Custom checkbox visual -->
        <div :class="checkboxVisualClasses">
          <!-- Check icon -->
          <VIcon
            v-if="internalValue"
            icon="mdi-check"
            :size="checkIconSize"
            class="form-checkbox__check"
          />
          
          <!-- Indeterminate icon -->
          <VIcon
            v-else-if="indeterminate"
            icon="mdi-minus"
            :size="checkIconSize"
            class="form-checkbox__indeterminate"
          />
        </div>

        <!-- Label text -->
        <label
          v-if="text"
          :for="fieldId"
          :class="checkboxLabelClasses"
        >
          {{ text }}
        </label>
      </div>
    </template>
  </FormField>
</template>

<script setup lang="ts">
interface Props {
  // Value
  modelValue?: boolean
  
  // Content
  text?: string
  label?: string
  description?: string
  helperText?: string
  
  // Validation
  rules?: Array<(value: any) => boolean | string>
  validationMessages?: string[]
  validationState?: 'success' | 'warning' | 'error' | null
  
  // Variants
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error'
  size?: 'sm' | 'md' | 'lg'
  
  // States
  disabled?: boolean
  required?: boolean
  indeterminate?: boolean
  
  // Accessibility
  ariaLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  color: 'primary',
  size: 'md',
  disabled: false,
  required: false,
  indeterminate: false,
  validationMessages: () => []
})

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  change: [event: Event]
  focus: [event: FocusEvent]
  blur: [event: FocusEvent]
}>()

// Refs
const checkboxRef = ref<HTMLInputElement>()

// Internal value management
const internalValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// Validation state
const validationErrors = ref<string[]>([])
const hasError = computed(() => {
  return props.validationState === 'error' || validationErrors.value.length > 0
})

const hasSuccess = computed(() => props.validationState === 'success')
const hasWarning = computed(() => props.validationState === 'warning')

// Icon size based on checkbox size
const checkIconSize = computed(() => {
  const sizeMap = {
    sm: 14,
    md: 16,
    lg: 18
  }
  return sizeMap[props.size]
})

// Classes
const checkboxWrapperClasses = computed(() => [
  'form-checkbox__wrapper',
  `form-checkbox__wrapper--${props.size}`,
  {
    'form-checkbox__wrapper--disabled': props.disabled,
    'form-checkbox__wrapper--error': hasError.value,
    'form-checkbox__wrapper--success': hasSuccess.value,
    'form-checkbox__wrapper--warning': hasWarning.value,
    'form-checkbox__wrapper--with-text': props.text
  }
])

const checkboxClasses = computed(() => [
  'form-checkbox__input'
])

const checkboxVisualClasses = computed(() => [
  'form-checkbox__visual',
  `form-checkbox__visual--${props.color}`,
  `form-checkbox__visual--${props.size}`,
  {
    'form-checkbox__visual--checked': internalValue.value,
    'form-checkbox__visual--indeterminate': props.indeterminate,
    'form-checkbox__visual--disabled': props.disabled,
    'form-checkbox__visual--error': hasError.value,
    'form-checkbox__visual--success': hasSuccess.value,
    'form-checkbox__visual--warning': hasWarning.value
  }
])

const checkboxLabelClasses = computed(() => [
  'form-checkbox__label',
  `form-checkbox__label--${props.size}`,
  {
    'form-checkbox__label--disabled': props.disabled,
    'form-checkbox__label--error': hasError.value,
    'form-checkbox__label--success': hasSuccess.value,
    'form-checkbox__label--warning': hasWarning.value
  }
])

// Methods
const runValidation = (value: any) => {
  if (!props.rules) return

  validationErrors.value = []
  
  for (const rule of props.rules) {
    const result = rule(value)
    if (result !== true && typeof result === 'string') {
      validationErrors.value.push(result)
    }
  }
}

// Event handlers
const handleChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  internalValue.value = target.checked
  runValidation(target.checked)
  emit('change', event)
}

const handleFocus = (event: FocusEvent) => {
  emit('focus', event)
}

const handleBlur = (event: FocusEvent) => {
  emit('blur', event)
}

// Public methods
const focus = () => {
  checkboxRef.value?.focus()
}

const blur = () => {
  checkboxRef.value?.blur()
}

// Expose methods
defineExpose({
  focus,
  blur,
  checkboxRef
})

// Watch for external validation changes
watch(() => props.modelValue, (newValue) => {
  if (props.rules) {
    runValidation(newValue)
  }
}, { immediate: true })
</script>

<style scoped>
/* Base checkbox wrapper styles using design tokens */
.form-checkbox__wrapper {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-2);
  cursor: pointer;
  transition: var(--transition-colors);
}

.form-checkbox__wrapper--disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

/* Size variants */
.form-checkbox__wrapper--sm {
  gap: var(--spacing-1-5);
}

.form-checkbox__wrapper--lg {
  gap: var(--spacing-3);
}

/* Hidden native checkbox */
.form-checkbox__input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

/* Custom checkbox visual */
.form-checkbox__visual {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid var(--color-outline);
  border-radius: var(--border-radius-sm);
  background-color: var(--color-surface);
  transition: var(--transition-all-normal);
  flex-shrink: 0;
}

/* Size variants for visual */
.form-checkbox__visual--sm {
  width: 16px;
  height: 16px;
}

.form-checkbox__visual--md {
  width: 20px;
  height: 20px;
}

.form-checkbox__visual--lg {
  width: 24px;
  height: 24px;
}

/* Color variants - unchecked */
.form-checkbox__visual--primary {
  border-color: var(--color-outline);
}

.form-checkbox__visual--secondary {
  border-color: var(--color-outline);
}

.form-checkbox__visual--success {
  border-color: var(--color-success);
}

.form-checkbox__visual--warning {
  border-color: var(--color-warning);
}

.form-checkbox__visual--error {
  border-color: var(--color-error);
}

/* Checked state */
.form-checkbox__visual--checked.form-checkbox__visual--primary {
  background-color: var(--color-primary);
  border-color: var(--color-primary);
  color: var(--color-on-primary);
}

.form-checkbox__visual--checked.form-checkbox__visual--secondary {
  background-color: var(--color-secondary);
  border-color: var(--color-secondary);
  color: var(--color-on-secondary);
}

.form-checkbox__visual--checked.form-checkbox__visual--success {
  background-color: var(--color-success);
  border-color: var(--color-success);
  color: var(--color-on-success);
}

.form-checkbox__visual--checked.form-checkbox__visual--warning {
  background-color: var(--color-warning);
  border-color: var(--color-warning);
  color: var(--color-on-warning);
}

.form-checkbox__visual--checked.form-checkbox__visual--error {
  background-color: var(--color-error);
  border-color: var(--color-error);
  color: var(--color-on-error);
}

/* Indeterminate state */
.form-checkbox__visual--indeterminate.form-checkbox__visual--primary {
  background-color: var(--color-primary);
  border-color: var(--color-primary);
  color: var(--color-on-primary);
}

.form-checkbox__visual--indeterminate.form-checkbox__visual--secondary {
  background-color: var(--color-secondary);
  border-color: var(--color-secondary);
  color: var(--color-on-secondary);
}

/* Validation states */
.form-checkbox__visual--error {
  border-color: var(--color-error);
}

.form-checkbox__visual--success {
  border-color: var(--color-success);
}

.form-checkbox__visual--warning {
  border-color: var(--color-warning);
}

/* Disabled state */
.form-checkbox__visual--disabled {
  background-color: var(--color-surface-variant);
  border-color: var(--color-outline);
  color: var(--color-on-surface-variant);
}

/* Focus styles */
.form-checkbox__input:focus + .form-checkbox__visual {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.form-checkbox__input:focus + .form-checkbox__visual--error {
  outline-color: var(--color-error);
}

.form-checkbox__input:focus + .form-checkbox__visual--success {
  outline-color: var(--color-success);
}

.form-checkbox__input:focus + .form-checkbox__visual--warning {
  outline-color: var(--color-warning);
}

/* Hover styles */
.form-checkbox__wrapper:not(.form-checkbox__wrapper--disabled):hover .form-checkbox__visual {
  border-color: var(--color-primary);
  background-color: rgba(var(--color-primary-rgb), 0.05);
}

.form-checkbox__wrapper:not(.form-checkbox__wrapper--disabled):hover .form-checkbox__visual--checked {
  background-color: var(--color-primary-600);
}

/* Check and indeterminate icons */
.form-checkbox__check,
.form-checkbox__indeterminate {
  transition: var(--transition-opacity);
}

/* Label styles */
.form-checkbox__label {
  font-family: var(--font-family-sans);
  color: var(--color-on-surface);
  cursor: pointer;
  line-height: var(--line-height-normal);
  user-select: none;
}

.form-checkbox__label--sm {
  font-size: var(--font-size-sm);
}

.form-checkbox__label--md {
  font-size: var(--font-size-base);
}

.form-checkbox__label--lg {
  font-size: var(--font-size-lg);
}

.form-checkbox__label--disabled {
  cursor: not-allowed;
  color: var(--color-on-surface-variant);
}

.form-checkbox__label--error {
  color: var(--color-error);
}

.form-checkbox__label--success {
  color: var(--color-success);
}

.form-checkbox__label--warning {
  color: var(--color-warning);
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .form-checkbox__visual {
    border-width: 3px;
  }
  
  .form-checkbox__label {
    font-weight: var(--font-weight-medium);
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .form-checkbox__wrapper,
  .form-checkbox__visual,
  .form-checkbox__check,
  .form-checkbox__indeterminate {
    transition: none;
  }
}
</style>
