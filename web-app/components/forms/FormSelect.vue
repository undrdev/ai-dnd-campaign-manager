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
      <div :class="selectWrapperClasses" @click="toggleDropdown">
        <!-- Leading icon -->
        <div v-if="prependIcon" class="form-select__icon form-select__icon--prepend">
          <VIcon :icon="prependIcon" :size="iconSize" />
        </div>

        <!-- Select display -->
        <div class="form-select__display">
          <input
            :id="fieldId"
            ref="hiddenInput"
            :value="internalValue"
            type="hidden"
            :required="required"
            :aria-label="ariaLabel"
            :aria-describedby="ariaDescribedby"
            :aria-invalid="hasError"
            :aria-required="required"
          />
          
          <div
            :class="selectFieldClasses"
            :tabindex="disabled ? -1 : 0"
            role="combobox"
            :aria-expanded="isOpen"
            :aria-haspopup="true"
            :aria-labelledby="fieldId + '-label'"
            @keydown="handleKeydown"
            @focus="handleFocus"
            @blur="handleBlur"
          >
            <span v-if="displayValue" class="form-select__value">
              {{ displayValue }}
            </span>
            <span v-else class="form-select__placeholder">
              {{ placeholder }}
            </span>
          </div>
        </div>

        <!-- Dropdown arrow -->
        <div class="form-select__icon form-select__icon--append">
          <VIcon
            :icon="isOpen ? 'mdi-chevron-up' : 'mdi-chevron-down'"
            :size="iconSize"
            class="form-select__arrow"
          />
        </div>

        <!-- Dropdown menu -->
        <Transition name="select-dropdown">
          <div
            v-if="isOpen"
            ref="dropdownRef"
            :class="dropdownClasses"
            role="listbox"
            :aria-labelledby="fieldId + '-label'"
          >
            <!-- Search input (if searchable) -->
            <div v-if="searchable" class="form-select__search">
              <AppInput
                v-model="searchQuery"
                placeholder="Search options..."
                size="sm"
                variant="outlined"
                prepend-icon="mdi-magnify"
                @keydown.stop
              />
            </div>

            <!-- Options list -->
            <div class="form-select__options">
              <!-- No options message -->
              <div
                v-if="filteredOptions.length === 0"
                class="form-select__no-options"
              >
                {{ searchQuery ? 'No matching options' : 'No options available' }}
              </div>

              <!-- Option items -->
              <div
                v-for="(option, index) in filteredOptions"
                :key="getOptionKey(option, index)"
                :class="getOptionClasses(option, index)"
                role="option"
                :aria-selected="isOptionSelected(option)"
                @click="selectOption(option)"
                @mouseenter="highlightedIndex = index"
              >
                <!-- Option icon -->
                <div v-if="option.icon" class="form-select__option-icon">
                  <VIcon :icon="option.icon" size="16" />
                </div>

                <!-- Option content -->
                <div class="form-select__option-content">
                  <div class="form-select__option-label">
                    {{ getOptionLabel(option) }}
                  </div>
                  <div v-if="getOptionDescription(option)" class="form-select__option-description">
                    {{ getOptionDescription(option) }}
                  </div>
                </div>

                <!-- Selection indicator -->
                <div v-if="isOptionSelected(option)" class="form-select__option-check">
                  <VIcon icon="mdi-check" size="16" />
                </div>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </template>
  </FormField>
</template>

<script setup lang="ts">
interface SelectOption {
  label: string
  value: any
  description?: string
  icon?: string
  disabled?: boolean
  group?: string
}

interface Props {
  // Value
  modelValue?: any
  
  // Options
  options: SelectOption[] | string[] | number[]
  
  // Basic select props
  placeholder?: string
  label?: string
  description?: string
  helperText?: string
  
  // Icons
  prependIcon?: string
  
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
  required?: boolean
  
  // Behavior
  searchable?: boolean
  clearable?: boolean
  multiple?: boolean
  
  // Accessibility
  ariaLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'outlined',
  size: 'md',
  color: 'primary',
  disabled: false,
  required: false,
  searchable: false,
  clearable: false,
  multiple: false,
  validationMessages: () => [],
  placeholder: 'Select an option'
})

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: any]
  change: [value: any]
  focus: [event: FocusEvent]
  blur: [event: FocusEvent]
  open: []
  close: []
}>()

// Refs
const hiddenInput = ref<HTMLInputElement>()
const dropdownRef = ref<HTMLDivElement>()

// State
const isOpen = ref(false)
const searchQuery = ref('')
const highlightedIndex = ref(-1)
const validationErrors = ref<string[]>([])

// Internal value management
const internalValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// Validation state
const hasError = computed(() => {
  return props.validationState === 'error' || validationErrors.value.length > 0
})

const hasSuccess = computed(() => props.validationState === 'success')
const hasWarning = computed(() => props.validationState === 'warning')

// Icon size based on select size
const iconSize = computed(() => {
  const sizeMap = {
    sm: 16,
    md: 18,
    lg: 20
  }
  return sizeMap[props.size]
})

// Normalize options to consistent format
const normalizedOptions = computed(() => {
  return props.options.map((option, index) => {
    if (typeof option === 'string' || typeof option === 'number') {
      return {
        label: String(option),
        value: option,
        key: `option-${index}`
      }
    }
    return {
      ...option,
      key: `option-${index}`
    }
  })
})

// Filter options based on search
const filteredOptions = computed(() => {
  if (!props.searchable || !searchQuery.value) {
    return normalizedOptions.value
  }

  const query = searchQuery.value.toLowerCase()
  return normalizedOptions.value.filter(option =>
    option.label.toLowerCase().includes(query) ||
    (option.description && option.description.toLowerCase().includes(query))
  )
})

// Display value
const displayValue = computed(() => {
  if (internalValue.value == null) return ''
  
  const selectedOption = normalizedOptions.value.find(
    option => option.value === internalValue.value
  )
  
  return selectedOption ? selectedOption.label : String(internalValue.value)
})

// Classes
const selectWrapperClasses = computed(() => [
  'form-select__wrapper',
  `form-select__wrapper--${props.variant}`,
  `form-select__wrapper--${props.color}`,
  `form-select__wrapper--${props.size}`,
  {
    'form-select__wrapper--open': isOpen.value,
    'form-select__wrapper--error': hasError.value,
    'form-select__wrapper--success': hasSuccess.value,
    'form-select__wrapper--warning': hasWarning.value,
    'form-select__wrapper--disabled': props.disabled,
    'form-select__wrapper--with-prepend': props.prependIcon
  }
])

const selectFieldClasses = computed(() => [
  'form-select__field',
  {
    'form-select__field--placeholder': !displayValue.value
  }
])

const dropdownClasses = computed(() => [
  'form-select__dropdown',
  `form-select__dropdown--${props.size}`
])

// Methods
const getOptionKey = (option: any, index: number) => {
  return option.key || `option-${index}`
}

const getOptionLabel = (option: any) => {
  return option.label || String(option.value)
}

const getOptionDescription = (option: any) => {
  return option.description
}

const isOptionSelected = (option: any) => {
  return option.value === internalValue.value
}

const getOptionClasses = (option: any, index: number) => [
  'form-select__option',
  {
    'form-select__option--selected': isOptionSelected(option),
    'form-select__option--highlighted': highlightedIndex.value === index,
    'form-select__option--disabled': option.disabled
  }
]

const toggleDropdown = () => {
  if (props.disabled) return
  
  if (isOpen.value) {
    closeDropdown()
  } else {
    openDropdown()
  }
}

const openDropdown = () => {
  isOpen.value = true
  searchQuery.value = ''
  highlightedIndex.value = -1
  emit('open')
  
  nextTick(() => {
    // Position dropdown
    positionDropdown()
  })
}

const closeDropdown = () => {
  isOpen.value = false
  highlightedIndex.value = -1
  emit('close')
}

const selectOption = (option: any) => {
  if (option.disabled) return
  
  internalValue.value = option.value
  emit('change', option.value)
  closeDropdown()
}

const positionDropdown = () => {
  // Basic positioning logic - could be enhanced with floating-ui
  if (!dropdownRef.value) return
  
  const dropdown = dropdownRef.value
  const rect = dropdown.getBoundingClientRect()
  const viewportHeight = window.innerHeight
  
  // If dropdown would go below viewport, show above
  if (rect.bottom > viewportHeight) {
    dropdown.style.top = 'auto'
    dropdown.style.bottom = '100%'
  }
}

// Event handlers
const handleKeydown = (event: KeyboardEvent) => {
  switch (event.key) {
    case 'Enter':
    case ' ':
      event.preventDefault()
      if (!isOpen.value) {
        openDropdown()
      } else if (highlightedIndex.value >= 0) {
        selectOption(filteredOptions.value[highlightedIndex.value])
      }
      break
      
    case 'Escape':
      event.preventDefault()
      closeDropdown()
      break
      
    case 'ArrowDown':
      event.preventDefault()
      if (!isOpen.value) {
        openDropdown()
      } else {
        highlightedIndex.value = Math.min(
          highlightedIndex.value + 1,
          filteredOptions.value.length - 1
        )
      }
      break
      
    case 'ArrowUp':
      event.preventDefault()
      if (isOpen.value) {
        highlightedIndex.value = Math.max(highlightedIndex.value - 1, 0)
      }
      break
  }
}

const handleFocus = (event: FocusEvent) => {
  emit('focus', event)
}

const handleBlur = (event: FocusEvent) => {
  // Delay blur to allow click on dropdown
  setTimeout(() => {
    if (!dropdownRef.value?.contains(event.relatedTarget as Node)) {
      closeDropdown()
    }
  }, 100)
  
  emit('blur', event)
}

// Click outside handler
const handleClickOutside = (event: MouseEvent) => {
  if (isOpen.value && !dropdownRef.value?.contains(event.target as Node)) {
    closeDropdown()
  }
}

// Lifecycle
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
/* Base select wrapper styles using design tokens */
.form-select__wrapper {
  position: relative;
  display: flex;
  align-items: center;
  background-color: var(--color-surface);
  border-radius: var(--border-radius-lg);
  transition: var(--transition-all-normal);
  cursor: pointer;
}

/* Size variants */
.form-select__wrapper--sm {
  height: 32px;
  padding: 0 var(--spacing-3);
}

.form-select__wrapper--md {
  height: 40px;
  padding: 0 var(--spacing-4);
}

.form-select__wrapper--lg {
  height: 48px;
  padding: 0 var(--spacing-5);
}

/* Variant styles */
.form-select__wrapper--outlined {
  border: 1px solid var(--color-outline);
}

.form-select__wrapper--outlined:focus-within,
.form-select__wrapper--outlined.form-select__wrapper--open {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 1px var(--color-primary);
}

.form-select__wrapper--filled {
  background-color: var(--color-surface-variant);
  border: 1px solid transparent;
}

.form-select__wrapper--filled:focus-within,
.form-select__wrapper--filled.form-select__wrapper--open {
  background-color: var(--color-surface);
  border-color: var(--color-primary);
}

.form-select__wrapper--underlined {
  background-color: transparent;
  border: none;
  border-bottom: 1px solid var(--color-outline);
  border-radius: 0;
}

.form-select__wrapper--underlined:focus-within,
.form-select__wrapper--underlined.form-select__wrapper--open {
  border-bottom-color: var(--color-primary);
  border-bottom-width: 2px;
}

/* State styles */
.form-select__wrapper--error {
  border-color: var(--color-error);
}

.form-select__wrapper--success {
  border-color: var(--color-success);
}

.form-select__wrapper--warning {
  border-color: var(--color-warning);
}

.form-select__wrapper--disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background-color: var(--color-surface-variant);
}

/* Icon styles */
.form-select__icon {
  display: flex;
  align-items: center;
  color: var(--color-on-surface-variant);
}

.form-select__icon--prepend {
  margin-right: var(--spacing-2);
}

.form-select__icon--append {
  margin-left: var(--spacing-2);
}

.form-select__arrow {
  transition: var(--transition-transform);
}

.form-select__wrapper--open .form-select__arrow {
  transform: rotate(180deg);
}

/* Display area */
.form-select__display {
  flex: 1;
  min-width: 0;
}

.form-select__field {
  width: 100%;
  font-family: var(--font-family-sans);
  font-size: var(--font-size-base);
  color: var(--color-on-surface);
  outline: none;
  cursor: pointer;
}

.form-select__wrapper--sm .form-select__field {
  font-size: var(--font-size-sm);
}

.form-select__wrapper--lg .form-select__field {
  font-size: var(--font-size-lg);
}

.form-select__field--placeholder,
.form-select__placeholder {
  color: var(--color-on-surface-variant);
  opacity: 0.7;
}

.form-select__value {
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Dropdown */
.form-select__dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 1000;
  background-color: var(--color-surface);
  border: 1px solid var(--color-outline);
  border-radius: var(--border-radius-lg);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  max-height: 200px;
  overflow: hidden;
  margin-top: var(--spacing-1);
}

.form-select__dropdown--sm {
  max-height: 160px;
}

.form-select__dropdown--lg {
  max-height: 240px;
}

/* Search */
.form-select__search {
  padding: var(--spacing-2);
  border-bottom: 1px solid var(--color-outline);
}

/* Options */
.form-select__options {
  overflow-y: auto;
  max-height: inherit;
}

.form-select__no-options {
  padding: var(--spacing-3) var(--spacing-4);
  text-align: center;
  color: var(--color-on-surface-variant);
  font-size: var(--font-size-sm);
}

.form-select__option {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  padding: var(--spacing-2) var(--spacing-4);
  cursor: pointer;
  transition: var(--transition-colors);
}

.form-select__option:hover,
.form-select__option--highlighted {
  background-color: var(--color-surface-variant);
}

.form-select__option--selected {
  background-color: var(--color-primary-container);
  color: var(--color-on-primary-container);
}

.form-select__option--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.form-select__option-icon {
  flex-shrink: 0;
}

.form-select__option-content {
  flex: 1;
  min-width: 0;
}

.form-select__option-label {
  font-size: var(--font-size-base);
  line-height: var(--line-height-tight);
}

.form-select__option-description {
  font-size: var(--font-size-xs);
  color: var(--color-on-surface-variant);
  line-height: var(--line-height-normal);
}

.form-select__option-check {
  flex-shrink: 0;
  color: var(--color-primary);
}

/* Transitions */
.select-dropdown-enter-active,
.select-dropdown-leave-active {
  transition: all var(--duration-short) var(--easing-standard);
  transform-origin: top;
}

.select-dropdown-enter-from,
.select-dropdown-leave-to {
  opacity: 0;
  transform: scaleY(0.8) translateY(-10px);
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .form-select__wrapper--outlined {
    border-width: 2px;
  }
  
  .form-select__dropdown {
    border-width: 2px;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .form-select__wrapper,
  .form-select__arrow,
  .form-select__option,
  .select-dropdown-enter-active,
  .select-dropdown-leave-active {
    transition: none;
  }
}
</style>
