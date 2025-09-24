<template>
  <div 
    :class="[
      'app-loading',
      {
        'app-loading--fullscreen': fullscreen,
        'app-loading--overlay': overlay
      }
    ]"
  >
    <!-- Background overlay for fullscreen/overlay modes -->
    <div 
      v-if="fullscreen || overlay" 
      class="app-loading__backdrop"
      :class="{ 'app-loading__backdrop--blur': blur }"
    />
    
    <!-- Loading content -->
    <div class="app-loading__content">
      <!-- Spinner -->
      <div class="app-loading__spinner">
        <VProgressCircular
          v-if="type === 'circular'"
          :size="spinnerSize"
          :width="spinnerWidth"
          :color="color"
          indeterminate
          class="mb-4"
        />
        
        <div v-else-if="type === 'dots'" class="loading-dots mb-4">
          <div 
            v-for="i in 3" 
            :key="i"
            class="loading-dot"
            :style="{ 
              backgroundColor: `var(--v-theme-${color})`,
              animationDelay: `${(i - 1) * 0.2}s`
            }"
          />
        </div>
        
        <div v-else-if="type === 'dice'" class="loading-dice mb-4">
          <VIcon 
            icon="mdi-dice-d20" 
            :size="spinnerSize"
            :color="color"
            class="dice-spin"
          />
        </div>
        
        <VProgressLinear
          v-else-if="type === 'linear'"
          :color="color"
          indeterminate
          height="4"
          class="mb-4"
          rounded
        />
      </div>
      
      <!-- Message -->
      <div v-if="message" class="app-loading__message">
        <h3 v-if="title" class="text-h6 font-weight-bold mb-2">
          {{ title }}
        </h3>
        <p class="text-body-1 text-center mb-0" :class="messageClass">
          {{ message }}
        </p>
      </div>
      
      <!-- Sub-message or tips -->
      <div v-if="subMessage" class="app-loading__sub-message">
        <p class="text-body-2 text-center text-neutral-600 mb-0">
          {{ subMessage }}
        </p>
      </div>
      
      <!-- Progress indicator (for determinate loading) -->
      <div v-if="progress !== undefined" class="app-loading__progress mt-4">
        <VProgressLinear
          :model-value="progress"
          :color="color"
          height="6"
          rounded
          class="mb-2"
        />
        <p class="text-caption text-center text-neutral-600 mb-0">
          {{ Math.round(progress) }}% Complete
        </p>
      </div>
      
      <!-- Cancel button (optional) -->
      <div v-if="cancellable" class="app-loading__actions mt-6">
        <VBtn
          variant="outlined"
          :color="color"
          @click="$emit('cancel')"
        >
          Cancel
        </VBtn>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  // Loading type
  type?: 'circular' | 'linear' | 'dots' | 'dice'
  
  // Display mode
  fullscreen?: boolean
  overlay?: boolean
  blur?: boolean
  
  // Appearance
  color?: string
  spinnerSize?: number | string
  spinnerWidth?: number
  
  // Content
  title?: string
  message?: string
  subMessage?: string
  
  // Progress (0-100 for determinate loading)
  progress?: number
  
  // Interaction
  cancellable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  type: 'circular',
  fullscreen: false,
  overlay: false,
  blur: false,
  color: 'primary',
  spinnerSize: 48,
  spinnerWidth: 4,
  cancellable: false
})

// Emits
defineEmits<{
  cancel: []
}>()

// Computed properties
const messageClass = computed(() => ({
  'text-neutral-600': !props.fullscreen && !props.overlay,
  'text-white': props.fullscreen || props.overlay
}))
</script>

<style scoped>
.app-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  min-height: 120px;
}

.app-loading--fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  min-height: 100vh;
}

.app-loading--overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  min-height: 100%;
}

.app-loading__backdrop {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  z-index: -1;
}

.app-loading__backdrop--blur {
  backdrop-filter: blur(4px);
}

.app-loading__content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 2rem;
  max-width: 400px;
  z-index: 1;
}

.app-loading__spinner {
  display: flex;
  align-items: center;
  justify-content: center;
}

.app-loading__message {
  margin-top: 1rem;
}

.app-loading__sub-message {
  margin-top: 0.5rem;
}

.app-loading__progress {
  width: 100%;
  max-width: 300px;
}

.app-loading__actions {
  display: flex;
  gap: 1rem;
}

/* Loading dots animation */
.loading-dots {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: center;
}

.loading-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  animation: loading-bounce 1.4s ease-in-out infinite both;
}

@keyframes loading-bounce {
  0%, 80%, 100% {
    transform: scale(0.6);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

/* Dice spinning animation */
.loading-dice {
  display: flex;
  align-items: center;
  justify-content: center;
}

.dice-spin {
  animation: dice-rotate 2s linear infinite;
}

@keyframes dice-rotate {
  0% {
    transform: rotate(0deg);
  }
  25% {
    transform: rotate(90deg) scale(1.1);
  }
  50% {
    transform: rotate(180deg);
  }
  75% {
    transform: rotate(270deg) scale(1.1);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* Responsive adjustments */
@media (max-width: 600px) {
  .app-loading__content {
    padding: 1rem;
    max-width: 300px;
  }
  
  .app-loading__message h3 {
    font-size: 1.25rem;
  }
}

/* Dark theme adjustments */
.app-loading--fullscreen .app-loading__content,
.app-loading--overlay .app-loading__content {
  color: white;
}

.app-loading--fullscreen .app-loading__message,
.app-loading--overlay .app-loading__message {
  color: white;
}
</style>
