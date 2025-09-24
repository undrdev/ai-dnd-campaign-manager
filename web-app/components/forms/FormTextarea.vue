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
      <div :class="textareaWrapperClasses">
        <!-- Textarea element -->
        <textarea
          :id="fieldId"
          ref="textareaRef"
          v-model="internalValue"
          :class="textareaClasses"
          :placeholder="placeholder"
          :disabled="disabled"
          :readonly="readonly"
          :required="required"
          :rows="rows"
          :minlength="minlength"
          :maxlength="maxlength"
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

        <!-- Character count -->
        <div v-if="showCharacterCount" class="form-textarea__counter">
          {{ characterCount }}{{ maxlength ? `/${maxlength}` : '' }}
        </div>

        <!-- Resize handle (optional) -->
        <div v-if="!noResize" class="form-textarea__resize" />
      </div>
    </template>
  </FormField>
</template>

<script setup lang="ts">
interface Props {
  // Value
  modelValue?: string
  
  // Basic textarea props
  placeholder?: string
  label?: string
  description?: string
  helperText?: string
  
  // Validation
  rules?: Array<(value: any) => boolean | string>
  validationMessages?: string[]
  validationState?: 'success' | 'warning' | 'error' | null
  
  // Variants
  variant?: 'outlined' | 'filled' | 'underlined'
  size?: 'sm' | 'md' | 'lg'
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error'
  
  // States
  disabled?: boolean
  readonly?: boolean
  required?: boolean
  
  // Behavior
  showCharacterCount?: boolean
  autoResize?: boolean
  noResize?: boolean
  
  // HTML attributes
  rows?: number
  minlength?: number
  maxlength?: number
  
  // Accessibility
  ariaLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'outlined',
  size: 'md',
  color: 'primary',
  disabled: false,
  readonly: false,
  required: false,
  showCharacterCount: false,
  autoResize: false,
  noResize: false,
  rows: 4,
  validationMessages: () => []
})

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: string | undefined]
  input: [event: Event]
  change: [event: Event]
  focus: [event: FocusEvent]
  blur: [event: FocusEvent]
  keydown: [event: KeyboardEvent]
  keyup: [event: KeyboardEvent]
}>()

// Refs
const textareaRef = ref<HTMLTextAreaElement>()

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

// Character count
const characterCount = computed(() => {
  const value = internalValue.value
  return typeof value === 'string' ? value.length : 0
})

// Classes
const textareaWrapperClasses = computed(() => [
  'form-textarea__wrapper',
  `form-textarea__wrapper--${props.variant}`,
  `form-textarea__wrapper--${props.color}`,
  `form-textarea__wrapper--${props.size}`,
  {
    'form-textarea__wrapper--error': hasError.value,
    'form-textarea__wrapper--success': hasSuccess.value,
    'form-textarea__wrapper--warning': hasWarning.value,
    'form-textarea__wrapper--disabled': props.disabled,
    'form-textarea__wrapper--readonly': props.readonly,
    'form-textarea__wrapper--auto-resize': props.autoResize,
    'form-textarea__wrapper--no-resize': props.noResize
  }
])

const textareaClasses = computed(() => [
  'form-textarea__field'
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

const autoResizeTextarea = () => {
  if (!props.autoResize || !textareaRef.value) return
  
  const textarea = textareaRef.value
  textarea.style.height = 'auto'
  textarea.style.height = `${textarea.scrollHeight}px`
}

// Event handlers
const handleInput = (event: Event) => {
  const target = event.target as HTMLTextAreaElement
  internalValue.value = target.value
  runValidation(target.value)
  
  if (props.autoResize) {
    autoResizeTextarea()
  }
  
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
  textareaRef.value?.focus()
}

const blur = () => {
  textareaRef.value?.blur()
}

const select = () => {
  textareaRef.value?.select()
}

// Expose methods
defineExpose({
  focus,
  blur,
  select,
  textareaRef
})

// Watch for external validation changes
watch(() => props.modelValue, (newValue) => {
  if (props.rules) {
    runValidation(newValue)
  }
  
  if (props.autoResize) {
    nextTick(() => autoResizeTextarea())
  }
}, { immediate: true })

// Initialize auto-resize
onMounted(() => {
  if (props.autoResize) {
    autoResizeTextarea()
  }
})
</script>

<style scoped>
/* Base textarea wrapper styles using design tokens */
.form-textarea__wrapper {
  position: relative;
  display: flex;
  flex-direction: column;
  background-color: var(--color-surface);
  border-radius: var(--border-radius-lg);
  transition: var(--transition-all-normal);
}

/* Size variants */
.form-textarea__wrapper--sm {
  padding: var(--spacing-2) var(--spacing-3);
}

.form-textarea__wrapper--md {
  padding: var(--spacing-3) var(--spacing-4);
}

.form-textarea__wrapper--lg {
  padding: var(--spacing-4) var(--spacing-5);
}

/* Variant styles */
.form-textarea__wrapper--outlined {
  border: 1px solid var(--color-outline);
}

.form-textarea__wrapper--outlined:focus-within {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 1px var(--color-primary);
}

.form-textarea__wrapper--filled {
  background-color: var(--color-surface-variant);
  border: 1px solid transparent;
}

.form-textarea__wrapper--filled:focus-within {
  background-color: var(--color-surface);
  border-color: var(--color-primary);
}

.form-textarea__wrapper--underlined {
  background-color: transparent;
  border: none;
  border-bottom: 1px solid var(--color-outline);
  border-radius: 0;
  padding-left: 0;
  padding-right: 0;
}

.form-textarea__wrapper--underlined:focus-within {
  border-bottom-color: var(--color-primary);
  border-bottom-width: 2px;
}

/* Color variants */
.form-textarea__wrapper--primary:focus-within {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 1px var(--color-primary);
}

.form-textarea__wrapper--secondary:focus-within {
  border-color: var(--color-secondary);
  box-shadow: 0 0 0 1px var(--color-secondary);
}

.form-textarea__wrapper--success:focus-within {
  border-color: var(--color-success);
  box-shadow: 0 0 0 1px var(--color-success);
}

.form-textarea__wrapper--warning:focus-within {
  border-color: var(--color-warning);
  box-shadow: 0 0 0 1px var(--color-warning);
}

.form-textarea__wrapper--error:focus-within {
  border-color: var(--color-error);
  box-shadow: 0 0 0 1px var(--color-error);
}

/* State styles */
.form-textarea__wrapper--error {
  border-color: var(--color-error);
}

.form-textarea__wrapper--success {
  border-color: var(--color-success);
}

.form-textarea__wrapper--warning {
  border-color: var(--color-warning);
}

.form-textarea__wrapper--disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background-color: var(--color-surface-variant);
}

.form-textarea__wrapper--readonly {
  background-color: var(--color-surface-variant);
}

/* Resize behavior */
.form-textarea__wrapper--auto-resize .form-textarea__field {
  resize: none;
  overflow-y: hidden;
}

.form-textarea__wrapper--no-resize .form-textarea__field {
  resize: none;
}

/* Textarea field styles */
.form-textarea__field {
  width: 100%;
  font-family: var(--font-family-sans);
  font-size: var(--font-size-base);
  color: var(--color-on-surface);
  background: transparent;
  border: none;
  outline: none;
  resize: vertical;
  line-height: var(--line-height-relaxed);
  min-height: 80px;
}

.form-textarea__wrapper--sm .form-textarea__field {
  font-size: var(--font-size-sm);
  min-height: 60px;
}

.form-textarea__wrapper--lg .form-textarea__field {
  font-size: var(--font-size-lg);
  min-height: 100px;
}

.form-textarea__field::placeholder {
  color: var(--color-on-surface-variant);
  opacity: 0.7;
}

.form-textarea__field:disabled {
  cursor: not-allowed;
}

.form-textarea__field:read-only {
  cursor: default;
}

/* Character counter */
.form-textarea__counter {
  align-self: flex-end;
  font-size: var(--font-size-xs);
  color: var(--color-on-surface-variant);
  margin-top: var(--spacing-1);
  line-height: 1;
}

.form-textarea__wrapper--sm .form-textarea__counter {
  font-size: 11px;
}

/* Resize handle (visual indicator) */
.form-textarea__resize {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 16px;
  height: 16px;
  background: linear-gradient(
    -45deg,
    transparent 0%,
    transparent 25%,
    var(--color-outline) 25%,
    var(--color-outline) 50%,
    transparent 50%,
    transparent 75%,
    var(--color-outline) 75%
  );
  pointer-events: none;
  opacity: 0.5;
}

.form-textarea__wrapper--no-resize .form-textarea__resize {
  display: none;
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .form-textarea__wrapper--outlined {
    border-width: 2px;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .form-textarea__wrapper {
    transition: none;
  }
}
</style>
