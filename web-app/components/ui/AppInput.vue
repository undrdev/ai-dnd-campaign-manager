<template>
  <div :class="wrapperClasses">
    <!-- Label -->
    <label
      v-if="label"
      :for="inputId"
      :class="labelClasses"
    >
      {{ label }}
      <span v-if="required" class="app-input__required" aria-label="required">*</span>
    </label>

    <!-- Input wrapper -->
    <div :class="inputWrapperClasses">
      <!-- Leading icon -->
      <div v-if="prependIcon" class="app-input__icon app-input__icon--prepend">
        <VIcon :icon="prependIcon" :size="iconSize" />
      </div>

      <!-- Input element -->
      <input
        :id="inputId"
        ref="inputRef"
        v-model="internalValue"
        :class="inputClasses"
        :type="type"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :required="required"
        :min="min"
        :max="max"
        :step="step"
        :minlength="minlength"
        :maxlength="maxlength"
        :pattern="pattern"
        :autocomplete="autocomplete"
        :autocapitalize="autocapitalize"
        :spellcheck="spellcheck"
        :aria-label="ariaLabel"
        :aria-describedby="ariaDescribedby"
        :aria-invalid="hasError"
        :aria-required="required"
        @input="handleInput"
        @change="handleChange"
        @focus="handleFocus"
        @blur="handleBlur"
        @keydown="handleKeydown"
        @keyup="handleKeyup"
      />

      <!-- Trailing content -->
      <div v-if="appendIcon || clearable || showPasswordToggle" class="app-input__trailing">
        <!-- Clear button -->
        <button
          v-if="clearable && internalValue && !disabled && !readonly"
          type="button"
          class="app-input__clear"
          :aria-label="clearLabel"
          @click="clearValue"
        >
          <VIcon icon="mdi-close" :size="iconSize" />
        </button>

        <!-- Password toggle -->
        <button
          v-if="showPasswordToggle"
          type="button"
          class="app-input__password-toggle"
          :aria-label="passwordVisible ? 'Hide password' : 'Show password'"
          @click="togglePasswordVisibility"
        >
          <VIcon :icon="passwordVisible ? 'mdi-eye-off' : 'mdi-eye'" :size="iconSize" />
        </button>

        <!-- Trailing icon -->
        <div v-if="appendIcon" class="app-input__icon app-input__icon--append">
          <VIcon :icon="appendIcon" :size="iconSize" />
        </div>
      </div>

      <!-- Loading spinner -->
      <div v-if="loading" class="app-input__loading">
        <svg
          class="app-input__spinner"
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
            class="app-input__spinner-circle"
          />
        </svg>
      </div>
    </div>

    <!-- Helper text, validation message, or character count -->
    <div v-if="helperText || validationMessage || showCharacterCount" class="app-input__footer">
      <!-- Validation message (highest priority) -->
      <div v-if="validationMessage" :class="validationClasses">
        <VIcon
          v-if="validationIcon"
          :icon="validationIcon"
          size="14"
          class="app-input__validation-icon"
        />
        {{ validationMessage }}
      </div>
      
      <!-- Helper text -->
      <div v-else-if="helperText" class="app-input__helper">
        {{ helperText }}
      </div>

      <!-- Character count -->
      <div v-if="showCharacterCount" class="app-input__counter">
        {{ characterCount }}{{ maxlength ? `/${maxlength}` : '' }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  // Value
  modelValue?: string | number
  
  // Basic input props
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search'
  placeholder?: string
  label?: string
  helperText?: string
  
  // Icons
  prependIcon?: string
  appendIcon?: string
  
  // Validation
  rules?: Array<(value: any) => boolean | string>
  validationMessage?: string
  validationState?: 'success' | 'warning' | 'error' | null
  
  // Variants
  variant?: 'outlined' | 'filled' | 'underlined'
  size?: 'sm' | 'md' | 'lg'
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error'
  
  // States
  disabled?: boolean
  readonly?: boolean
  loading?: boolean
  required?: boolean
  
  // Behavior
  clearable?: boolean
  showCharacterCount?: boolean
  
  // HTML attributes
  min?: number | string
  max?: number | string
  step?: number | string
  minlength?: number
  maxlength?: number
  pattern?: string
  autocomplete?: string
  autocapitalize?: string
  spellcheck?: boolean
  
  // Accessibility
  ariaLabel?: string
  ariaDescribedby?: string
  
  // Labels
  clearLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  variant: 'outlined',
  size: 'md',
  color: 'primary',
  disabled: false,
  readonly: false,
  loading: false,
  required: false,
  clearable: false,
  showCharacterCount: false,
  spellcheck: true,
  clearLabel: 'Clear input'
})

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: string | number | undefined]
  input: [event: Event]
  change: [event: Event]
  focus: [event: FocusEvent]
  blur: [event: FocusEvent]
  keydown: [event: KeyboardEvent]
  keyup: [event: KeyboardEvent]
  clear: []
}>()

// Refs
const inputRef = ref<HTMLInputElement>()

// Generate unique ID for accessibility
const inputId = ref(`app-input-${Math.random().toString(36).substr(2, 9)}`)

// Internal value management
const internalValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// Password visibility toggle
const passwordVisible = ref(false)
const showPasswordToggle = computed(() => props.type === 'password')

// Current input type (for password toggle)
const currentType = computed(() => {
  if (props.type === 'password' && passwordVisible.value) {
    return 'text'
  }
  return props.type
})

// Validation state
const validationErrors = ref<string[]>([])
const hasError = computed(() => {
  return props.validationState === 'error' || validationErrors.value.length > 0
})

const hasSuccess = computed(() => props.validationState === 'success')
const hasWarning = computed(() => props.validationState === 'warning')

// Character count
const characterCount = computed(() => {
  const value = internalValue.value
  return typeof value === 'string' ? value.length : 0
})

// Icon size based on input size
const iconSize = computed(() => {
  const sizeMap = {
    sm: 16,
    md: 18,
    lg: 20
  }
  return sizeMap[props.size]
})

// Validation icon
const validationIcon = computed(() => {
  if (hasError.value) return 'mdi-alert-circle'
  if (hasWarning.value) return 'mdi-alert'
  if (hasSuccess.value) return 'mdi-check-circle'
  return null
})

// Classes
const wrapperClasses = computed(() => [
  'app-input',
  `app-input--${props.size}`,
  {
    'app-input--disabled': props.disabled,
    'app-input--readonly': props.readonly,
    'app-input--loading': props.loading,
    'app-input--error': hasError.value,
    'app-input--success': hasSuccess.value,
    'app-input--warning': hasWarning.value
  }
])

const labelClasses = computed(() => [
  'app-input__label',
  {
    'app-input__label--required': props.required,
    'app-input__label--error': hasError.value,
    'app-input__label--success': hasSuccess.value,
    'app-input__label--warning': hasWarning.value
  }
])

const inputWrapperClasses = computed(() => [
  'app-input__wrapper',
  `app-input__wrapper--${props.variant}`,
  `app-input__wrapper--${props.color}`,
  {
    'app-input__wrapper--focused': false, // Will be managed by focus/blur
    'app-input__wrapper--with-prepend': props.prependIcon,
    'app-input__wrapper--with-append': props.appendIcon || props.clearable || showPasswordToggle.value
  }
])

const inputClasses = computed(() => [
  'app-input__field'
])

const validationClasses = computed(() => [
  'app-input__validation',
  {
    'app-input__validation--error': hasError.value,
    'app-input__validation--success': hasSuccess.value,
    'app-input__validation--warning': hasWarning.value
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

const togglePasswordVisibility = () => {
  passwordVisible.value = !passwordVisible.value
}

const clearValue = () => {
  internalValue.value = ''
  emit('clear')
  inputRef.value?.focus()
}

// Event handlers
const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  const value = props.type === 'number' ? target.valueAsNumber : target.value
  internalValue.value = value
  runValidation(value)
  emit('input', event)
}

const handleChange = (event: Event) => {
  emit('change', event)
}

const handleFocus = (event: FocusEvent) => {
  emit('focus', event)
}

const handleBlur = (event: FocusEvent) => {
  emit('blur', event)
}

const handleKeydown = (event: KeyboardEvent) => {
  emit('keydown', event)
}

const handleKeyup = (event: KeyboardEvent) => {
  emit('keyup', event)
}

// Public methods
const focus = () => {
  inputRef.value?.focus()
}

const blur = () => {
  inputRef.value?.blur()
}

const select = () => {
  inputRef.value?.select()
}

// Expose methods
defineExpose({
  focus,
  blur,
  select,
  inputRef
})

// Watch for external validation changes
watch(() => props.modelValue, (newValue) => {
  if (props.rules) {
    runValidation(newValue)
  }
}, { immediate: true })
</script>

<style scoped>
/* Base input styles using design tokens */
.app-input {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

/* Label styles */
.app-input__label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-on-surface);
  line-height: var(--line-height-tight);
}

.app-input__label--error {
  color: var(--color-error);
}

.app-input__label--success {
  color: var(--color-success);
}

.app-input__label--warning {
  color: var(--color-warning);
}

.app-input__required {
  color: var(--color-error);
  margin-left: var(--spacing-0-5);
}

/* Input wrapper styles */
.app-input__wrapper {
  position: relative;
  display: flex;
  align-items: center;
  background-color: var(--color-surface);
  border-radius: var(--border-radius-lg);
  transition: var(--transition-all-normal);
}

/* Size variants */
.app-input--sm .app-input__wrapper {
  height: 32px;
  padding: 0 var(--spacing-3);
}

.app-input--md .app-input__wrapper {
  height: 40px;
  padding: 0 var(--spacing-4);
}

.app-input--lg .app-input__wrapper {
  height: 48px;
  padding: 0 var(--spacing-5);
}

/* Variant styles */
.app-input__wrapper--outlined {
  border: 1px solid var(--color-outline);
}

.app-input__wrapper--outlined:focus-within {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 1px var(--color-primary);
}

.app-input__wrapper--filled {
  background-color: var(--color-surface-variant);
  border: 1px solid transparent;
}

.app-input__wrapper--filled:focus-within {
  background-color: var(--color-surface);
  border-color: var(--color-primary);
}

.app-input__wrapper--underlined {
  background-color: transparent;
  border: none;
  border-bottom: 1px solid var(--color-outline);
  border-radius: 0;
}

.app-input__wrapper--underlined:focus-within {
  border-bottom-color: var(--color-primary);
  border-bottom-width: 2px;
}

/* Color variants */
.app-input__wrapper--primary:focus-within {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 1px var(--color-primary);
}

.app-input__wrapper--secondary:focus-within {
  border-color: var(--color-secondary);
  box-shadow: 0 0 0 1px var(--color-secondary);
}

.app-input__wrapper--success:focus-within {
  border-color: var(--color-success);
  box-shadow: 0 0 0 1px var(--color-success);
}

.app-input__wrapper--warning:focus-within {
  border-color: var(--color-warning);
  box-shadow: 0 0 0 1px var(--color-warning);
}

.app-input__wrapper--error:focus-within {
  border-color: var(--color-error);
  box-shadow: 0 0 0 1px var(--color-error);
}

/* State styles */
.app-input--error .app-input__wrapper {
  border-color: var(--color-error);
}

.app-input--success .app-input__wrapper {
  border-color: var(--color-success);
}

.app-input--warning .app-input__wrapper {
  border-color: var(--color-warning);
}

.app-input--disabled .app-input__wrapper {
  opacity: 0.6;
  cursor: not-allowed;
  background-color: var(--color-surface-variant);
}

.app-input--readonly .app-input__wrapper {
  background-color: var(--color-surface-variant);
}

.app-input--loading .app-input__wrapper {
  cursor: wait;
}

/* Input field styles */
.app-input__field {
  flex: 1;
  width: 100%;
  height: 100%;
  font-family: var(--font-family-sans);
  font-size: var(--font-size-base);
  color: var(--color-on-surface);
  background: transparent;
  border: none;
  outline: none;
  padding: 0;
}

.app-input--sm .app-input__field {
  font-size: var(--font-size-sm);
}

.app-input--lg .app-input__field {
  font-size: var(--font-size-lg);
}

.app-input__field::placeholder {
  color: var(--color-on-surface-variant);
  opacity: 0.7;
}

.app-input__field:disabled {
  cursor: not-allowed;
}

.app-input__field:read-only {
  cursor: default;
}

/* Icon styles */
.app-input__icon {
  display: flex;
  align-items: center;
  color: var(--color-on-surface-variant);
}

.app-input__icon--prepend {
  margin-right: var(--spacing-2);
}

.app-input__icon--append {
  margin-left: var(--spacing-2);
}

/* Trailing content */
.app-input__trailing {
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
  margin-left: var(--spacing-2);
}

.app-input__clear,
.app-input__password-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-1);
  background: transparent;
  border: none;
  border-radius: var(--border-radius-sm);
  color: var(--color-on-surface-variant);
  cursor: pointer;
  transition: var(--transition-colors);
}

.app-input__clear:hover,
.app-input__password-toggle:hover {
  background-color: rgba(var(--color-on-surface-rgb), 0.08);
  color: var(--color-on-surface);
}

/* Loading spinner */
.app-input__loading {
  display: flex;
  align-items: center;
  margin-left: var(--spacing-2);
}

.app-input__spinner {
  width: 16px;
  height: 16px;
  color: var(--color-primary);
  animation: spin 1s linear infinite;
}

.app-input__spinner-circle {
  animation: spinner-dash 1.5s ease-in-out infinite;
}

/* Footer content */
.app-input__footer {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--spacing-2);
  min-height: 20px;
}

.app-input__helper {
  font-size: var(--font-size-xs);
  color: var(--color-on-surface-variant);
  line-height: var(--line-height-normal);
}

.app-input__validation {
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
  font-size: var(--font-size-xs);
  line-height: var(--line-height-normal);
}

.app-input__validation--error {
  color: var(--color-error);
}

.app-input__validation--success {
  color: var(--color-success);
}

.app-input__validation--warning {
  color: var(--color-warning);
}

.app-input__validation-icon {
  flex-shrink: 0;
}

.app-input__counter {
  font-size: var(--font-size-xs);
  color: var(--color-on-surface-variant);
  line-height: var(--line-height-normal);
  white-space: nowrap;
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

/* High contrast mode support */
@media (prefers-contrast: high) {
  .app-input__wrapper--outlined {
    border-width: 2px;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .app-input__wrapper,
  .app-input__clear,
  .app-input__password-toggle,
  .app-input__spinner {
    transition: none;
    animation: none;
  }
}
</style>
