<template>
  <div :class="diceRollerClasses">
    <!-- Dice selection -->
    <div class="dice-roller__selection">
      <h3 v-if="title" class="dice-roller__title">
        {{ title }}
      </h3>
      
      <!-- Dice types -->
      <div class="dice-roller__types">
        <button
          v-for="die in diceTypes"
          :key="die.sides"
          :class="getDiceButtonClasses(die)"
          :aria-label="`${die.count}d${die.sides} dice`"
          @click="toggleDice(die)"
        >
          <VIcon :icon="die.icon" :size="diceIconSize" />
          <span class="dice-button__label">
            {{ die.count > 0 ? die.count : '' }}d{{ die.sides }}
          </span>
        </button>
      </div>
      
      <!-- Modifier input -->
      <div class="dice-roller__modifier">
        <AppInput
          v-model="modifier"
          type="number"
          placeholder="Modifier"
          size="sm"
          variant="outlined"
          :min="-99"
          :max="99"
          prepend-icon="mdi-plus-minus"
          class="dice-roller__modifier-input"
        />
      </div>
    </div>

    <!-- Roll display -->
    <div class="dice-roller__display">
      <!-- Current roll expression -->
      <div class="dice-roller__expression">
        <span class="dice-roller__expression-text">
          {{ rollExpression || 'Select dice to roll' }}
        </span>
      </div>
      
      <!-- Roll button -->
      <AppButton
        :disabled="!canRoll || rolling"
        :loading="rolling"
        color="dnd-red"
        size="lg"
        pill
        class="dice-roller__roll-button"
        @click="rollDice"
      >
        <VIcon icon="mdi-dice-multiple" size="20" />
        {{ rolling ? 'Rolling...' : 'Roll!' }}
      </AppButton>
    </div>

    <!-- Results -->
    <Transition name="dice-result" appear>
      <div v-if="lastResult" class="dice-roller__result">
        <div class="dice-roller__result-header">
          <h4 class="dice-roller__result-title">Result</h4>
          <div :class="resultValueClasses">
            {{ lastResult.total }}
          </div>
        </div>
        
        <!-- Detailed breakdown -->
        <div v-if="showBreakdown && lastResult.breakdown.length > 0" class="dice-roller__breakdown">
          <div class="dice-roller__breakdown-header">
            <button
              type="button"
              class="dice-roller__breakdown-toggle"
              @click="breakdownExpanded = !breakdownExpanded"
            >
              <VIcon
                :icon="breakdownExpanded ? 'mdi-chevron-up' : 'mdi-chevron-down'"
                size="16"
              />
              Breakdown
            </button>
          </div>
          
          <Transition name="breakdown-expand">
            <div v-if="breakdownExpanded" class="dice-roller__breakdown-content">
              <div
                v-for="(group, index) in lastResult.breakdown"
                :key="index"
                class="dice-roller__breakdown-group"
              >
                <div class="dice-roller__breakdown-label">
                  {{ group.count }}d{{ group.sides }}:
                </div>
                <div class="dice-roller__breakdown-rolls">
                  <span
                    v-for="(roll, rollIndex) in group.rolls"
                    :key="rollIndex"
                    :class="getDiceRollClasses(roll, group.sides)"
                  >
                    {{ roll }}
                  </span>
                </div>
                <div class="dice-roller__breakdown-subtotal">
                  = {{ group.total }}
                </div>
              </div>
              
              <div v-if="lastResult.modifier !== 0" class="dice-roller__breakdown-modifier">
                <div class="dice-roller__breakdown-label">Modifier:</div>
                <div class="dice-roller__breakdown-value">
                  {{ lastResult.modifier > 0 ? '+' : '' }}{{ lastResult.modifier }}
                </div>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </Transition>

    <!-- Roll history -->
    <div v-if="showHistory && history.length > 0" class="dice-roller__history">
      <div class="dice-roller__history-header">
        <h4 class="dice-roller__history-title">Recent Rolls</h4>
        <button
          type="button"
          class="dice-roller__history-clear"
          @click="clearHistory"
        >
          <VIcon icon="mdi-delete" size="16" />
          Clear
        </button>
      </div>
      
      <div class="dice-roller__history-list">
        <div
          v-for="(result, index) in history.slice(-5)"
          :key="result.id"
          class="dice-roller__history-item"
        >
          <span class="dice-roller__history-expression">{{ result.expression }}</span>
          <span class="dice-roller__history-total">{{ result.total }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface DiceType {
  sides: number
  count: number
  icon: string
}

interface RollBreakdown {
  count: number
  sides: number
  rolls: number[]
  total: number
}

interface RollResult {
  id: string
  expression: string
  total: number
  modifier: number
  breakdown: RollBreakdown[]
  timestamp: Date
}

interface Props {
  title?: string
  size?: 'sm' | 'md' | 'lg'
  showBreakdown?: boolean
  showHistory?: boolean
  maxHistory?: number
  preset?: 'standard' | 'advantage' | 'damage'
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  showBreakdown: true,
  showHistory: true,
  maxHistory: 10,
  preset: 'standard'
})

// Emits
const emit = defineEmits<{
  roll: [result: RollResult]
  'dice-change': [dice: DiceType[]]
}>()

// State
const modifier = ref(0)
const rolling = ref(false)
const lastResult = ref<RollResult | null>(null)
const history = ref<RollResult[]>([])
const breakdownExpanded = ref(false)

// Dice types based on preset
const baseDiceTypes: DiceType[] = [
  { sides: 4, count: 0, icon: 'mdi-dice-d4' },
  { sides: 6, count: 0, icon: 'mdi-dice-d6' },
  { sides: 8, count: 0, icon: 'mdi-dice-d8' },
  { sides: 10, count: 0, icon: 'mdi-dice-d10' },
  { sides: 12, count: 0, icon: 'mdi-dice-d12' },
  { sides: 20, count: 0, icon: 'mdi-dice-d20' }
]

const diceTypes = ref<DiceType[]>([...baseDiceTypes])

// Computed properties
const diceIconSize = computed(() => {
  const sizeMap = {
    sm: 20,
    md: 24,
    lg: 28
  }
  return sizeMap[props.size]
})

const canRoll = computed(() => {
  return diceTypes.value.some(die => die.count > 0)
})

const rollExpression = computed(() => {
  const diceParts = diceTypes.value
    .filter(die => die.count > 0)
    .map(die => `${die.count}d${die.sides}`)
  
  if (diceParts.length === 0) return ''
  
  let expression = diceParts.join(' + ')
  
  if (modifier.value !== 0) {
    expression += modifier.value > 0 ? ` + ${modifier.value}` : ` - ${Math.abs(modifier.value)}`
  }
  
  return expression
})

const diceRollerClasses = computed(() => [
  'dice-roller',
  `dice-roller--${props.size}`
])

const resultValueClasses = computed(() => [
  'dice-roller__result-value',
  {
    'dice-roller__result-value--critical': lastResult.value && isCritical(lastResult.value),
    'dice-roller__result-value--fumble': lastResult.value && isFumble(lastResult.value)
  }
])

// Methods
const toggleDice = (die: DiceType) => {
  const index = diceTypes.value.findIndex(d => d.sides === die.sides)
  if (index !== -1) {
    if (diceTypes.value[index].count < 9) {
      diceTypes.value[index].count++
    } else {
      diceTypes.value[index].count = 0
    }
    emit('dice-change', diceTypes.value)
  }
}

const getDiceButtonClasses = (die: DiceType) => [
  'dice-roller__dice-button',
  {
    'dice-roller__dice-button--selected': die.count > 0,
    'dice-roller__dice-button--multiple': die.count > 1
  }
]

const getDiceRollClasses = (roll: number, sides: number) => [
  'dice-roller__breakdown-roll',
  {
    'dice-roller__breakdown-roll--max': roll === sides,
    'dice-roller__breakdown-roll--min': roll === 1
  }
]

const rollSingleDie = (sides: number): number => {
  return Math.floor(Math.random() * sides) + 1
}

const rollDice = async () => {
  if (!canRoll.value || rolling.value) return
  
  rolling.value = true
  
  // Add rolling animation delay
  await new Promise(resolve => setTimeout(resolve, 800))
  
  const breakdown: RollBreakdown[] = []
  let total = 0
  
  // Roll each type of dice
  for (const die of diceTypes.value) {
    if (die.count > 0) {
      const rolls: number[] = []
      for (let i = 0; i < die.count; i++) {
        rolls.push(rollSingleDie(die.sides))
      }
      
      const subtotal = rolls.reduce((sum, roll) => sum + roll, 0)
      total += subtotal
      
      breakdown.push({
        count: die.count,
        sides: die.sides,
        rolls,
        total: subtotal
      })
    }
  }
  
  // Add modifier
  total += modifier.value
  
  const result: RollResult = {
    id: `roll-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    expression: rollExpression.value,
    total,
    modifier: modifier.value,
    breakdown,
    timestamp: new Date()
  }
  
  lastResult.value = result
  
  // Add to history
  history.value.push(result)
  if (history.value.length > props.maxHistory) {
    history.value.shift()
  }
  
  rolling.value = false
  breakdownExpanded.value = true
  
  emit('roll', result)
}

const isCritical = (result: RollResult): boolean => {
  // Check if any d20 rolled a 20
  return result.breakdown.some(group => 
    group.sides === 20 && group.rolls.some(roll => roll === 20)
  )
}

const isFumble = (result: RollResult): boolean => {
  // Check if any d20 rolled a 1
  return result.breakdown.some(group => 
    group.sides === 20 && group.rolls.some(roll => roll === 1)
  )
}

const clearHistory = () => {
  history.value = []
}

// Initialize preset
const initializePreset = () => {
  switch (props.preset) {
    case 'advantage':
      diceTypes.value[5].count = 2 // 2d20
      break
    case 'damage':
      diceTypes.value[1].count = 1 // 1d6
      break
    // 'standard' uses default empty state
  }
}

// Initialize on mount
onMounted(() => {
  initializePreset()
})
</script>

<style scoped>
/* Base dice roller styles using design tokens */
.dice-roller {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
  padding: var(--spacing-4);
  background-color: var(--color-surface);
  border-radius: var(--border-radius-xl);
  border: 1px solid var(--color-outline);
}

.dice-roller--sm {
  gap: var(--spacing-3);
  padding: var(--spacing-3);
}

.dice-roller--lg {
  gap: var(--spacing-6);
  padding: var(--spacing-6);
}

/* Title */
.dice-roller__title {
  margin: 0 0 var(--spacing-3) 0;
  font-family: var(--font-family-serif);
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-dnd-red-600);
  text-align: center;
}

/* Selection area */
.dice-roller__selection {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.dice-roller__types {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
  gap: var(--spacing-2);
}

.dice-roller__dice-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-1);
  padding: var(--spacing-3) var(--spacing-2);
  background-color: var(--color-surface-variant);
  border: 2px solid var(--color-outline);
  border-radius: var(--border-radius-lg);
  color: var(--color-on-surface-variant);
  cursor: pointer;
  transition: var(--transition-all-normal);
  min-height: 70px;
}

.dice-roller__dice-button:hover {
  background-color: var(--color-dnd-red-100);
  border-color: var(--color-dnd-red-300);
  color: var(--color-dnd-red-700);
  transform: translateY(-2px);
}

.dice-roller__dice-button--selected {
  background-color: var(--color-dnd-red-500);
  border-color: var(--color-dnd-red-600);
  color: white;
}

.dice-roller__dice-button--selected:hover {
  background-color: var(--color-dnd-red-600);
  border-color: var(--color-dnd-red-700);
}

.dice-roller__dice-button--multiple {
  box-shadow: 0 0 0 3px rgba(var(--color-dnd-red-rgb), 0.3);
}

.dice-button__label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  line-height: 1;
}

/* Modifier input */
.dice-roller__modifier {
  display: flex;
  justify-content: center;
}

.dice-roller__modifier-input {
  max-width: 120px;
}

/* Roll display */
.dice-roller__display {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-3);
  padding: var(--spacing-4);
  background: linear-gradient(135deg, var(--color-dnd-red-50), var(--color-dnd-bronze-50));
  border-radius: var(--border-radius-lg);
  border: 1px solid var(--color-dnd-red-200);
}

.dice-roller__expression {
  text-align: center;
}

.dice-roller__expression-text {
  font-family: var(--font-family-code);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-medium);
  color: var(--color-dnd-red-700);
  padding: var(--spacing-2) var(--spacing-4);
  background-color: rgba(255, 255, 255, 0.7);
  border-radius: var(--border-radius-md);
  border: 1px solid var(--color-dnd-red-200);
}

.dice-roller__roll-button {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  min-width: 120px;
}

/* Results */
.dice-roller__result {
  padding: var(--spacing-4);
  background-color: var(--color-surface-container);
  border-radius: var(--border-radius-lg);
  border: 1px solid var(--color-outline);
}

.dice-roller__result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-3);
}

.dice-roller__result-title {
  margin: 0;
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-on-surface);
}

.dice-roller__result-value {
  font-family: var(--font-family-serif);
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.dice-roller__result-value--critical {
  color: var(--color-dnd-green-600);
  animation: critical-glow 1s ease-out;
}

.dice-roller__result-value--fumble {
  color: var(--color-error);
  animation: fumble-shake 0.5s ease-out;
}

/* Breakdown */
.dice-roller__breakdown {
  margin-top: var(--spacing-3);
  border-top: 1px solid var(--color-outline);
  padding-top: var(--spacing-3);
}

.dice-roller__breakdown-header {
  margin-bottom: var(--spacing-2);
}

.dice-roller__breakdown-toggle {
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
  padding: var(--spacing-1) 0;
  background: transparent;
  border: none;
  color: var(--color-on-surface-variant);
  cursor: pointer;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

.dice-roller__breakdown-toggle:hover {
  color: var(--color-on-surface);
}

.dice-roller__breakdown-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.dice-roller__breakdown-group {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: var(--spacing-2);
  align-items: center;
  padding: var(--spacing-2);
  background-color: var(--color-surface);
  border-radius: var(--border-radius-md);
}

.dice-roller__breakdown-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-on-surface-variant);
  white-space: nowrap;
}

.dice-roller__breakdown-rolls {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-1);
  justify-content: center;
}

.dice-roller__breakdown-roll {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background-color: var(--color-surface-variant);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-on-surface);
}

.dice-roller__breakdown-roll--max {
  background-color: var(--color-success);
  color: var(--color-on-success);
}

.dice-roller__breakdown-roll--min {
  background-color: var(--color-error);
  color: var(--color-on-error);
}

.dice-roller__breakdown-subtotal {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-on-surface);
  text-align: right;
}

.dice-roller__breakdown-modifier {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: var(--spacing-2);
  align-items: center;
  padding: var(--spacing-2);
  background-color: var(--color-primary-container);
  border-radius: var(--border-radius-md);
}

.dice-roller__breakdown-value {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-on-primary-container);
  text-align: right;
}

/* History */
.dice-roller__history {
  padding: var(--spacing-3);
  background-color: var(--color-surface-variant);
  border-radius: var(--border-radius-lg);
}

.dice-roller__history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-2);
}

.dice-roller__history-title {
  margin: 0;
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--color-on-surface-variant);
}

.dice-roller__history-clear {
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
  padding: var(--spacing-1) var(--spacing-2);
  background: transparent;
  border: none;
  border-radius: var(--border-radius-sm);
  color: var(--color-on-surface-variant);
  cursor: pointer;
  font-size: var(--font-size-xs);
}

.dice-roller__history-clear:hover {
  background-color: rgba(var(--color-error-rgb), 0.1);
  color: var(--color-error);
}

.dice-roller__history-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

.dice-roller__history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-1-5) var(--spacing-2);
  background-color: var(--color-surface);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-sm);
}

.dice-roller__history-expression {
  font-family: var(--font-family-code);
  color: var(--color-on-surface-variant);
}

.dice-roller__history-total {
  font-weight: var(--font-weight-semibold);
  color: var(--color-on-surface);
}

/* Animations */
@keyframes critical-glow {
  0%, 100% { text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); }
  50% { text-shadow: 0 0 20px var(--color-dnd-green-400); }
}

@keyframes fumble-shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}

/* Transitions */
.dice-result-enter-active {
  transition: all var(--duration-normal) var(--easing-emphasized-decelerate);
}

.dice-result-enter-from {
  opacity: 0;
  transform: scale(0.9) translateY(-20px);
}

.breakdown-expand-enter-active,
.breakdown-expand-leave-active {
  transition: all var(--duration-short) var(--easing-standard);
  overflow: hidden;
}

.breakdown-expand-enter-from,
.breakdown-expand-leave-to {
  opacity: 0;
  max-height: 0;
}

.breakdown-expand-enter-to,
.breakdown-expand-leave-from {
  opacity: 1;
  max-height: 500px;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .dice-roller__types {
    grid-template-columns: repeat(3, 1fr);
  }
  
  .dice-roller__dice-button {
    min-height: 60px;
    padding: var(--spacing-2);
  }
  
  .dice-roller__expression-text {
    font-size: var(--font-size-base);
  }
  
  .dice-roller__result-value {
    font-size: var(--font-size-2xl);
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .dice-roller__dice-button,
  .dice-result-enter-active,
  .breakdown-expand-enter-active,
  .breakdown-expand-leave-active {
    transition: none;
  }
  
  .dice-roller__dice-button:hover {
    transform: none;
  }
  
  .dice-roller__result-value--critical,
  .dice-roller__result-value--fumble {
    animation: none;
  }
}
</style>
