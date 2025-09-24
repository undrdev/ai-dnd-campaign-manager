<template>
  <div class="min-h-screen d-flex align-center justify-center bg-gradient-to-br from-neutral-50 to-neutral-100">
    <VContainer fluid class="pa-0">
      <VRow no-gutters class="min-h-screen">
        <!-- Left Side - Branding/Hero -->
        <VCol cols="12" md="6" class="d-none d-md-flex">
          <div class="w-100 d-flex flex-column align-center justify-center bg-gradient-to-br from-secondary to-secondary-darken-1 text-white pa-12">
            <div class="text-center mb-8">
              <VIcon icon="mdi-account-plus" size="80" class="mb-6 animate-bounce" />
              <h1 class="text-h3 font-weight-bold mb-4">
                Begin Your Adventure!
              </h1>
              <p class="text-h6 opacity-90 mb-8">
                Join thousands of Game Masters and players already using AI to enhance their campaigns
              </p>
              <div class="d-flex align-center justify-center gap-6 opacity-80">
                <div class="text-center">
                  <VIcon icon="mdi-castle" size="32" class="mb-2" />
                  <p class="text-body-2">Epic Campaigns</p>
                </div>
                <div class="text-center">
                  <VIcon icon="mdi-robot" size="32" class="mb-2" />
                  <p class="text-body-2">AI Assistance</p>
                </div>
                <div class="text-center">
                  <VIcon icon="mdi-crown" size="32" class="mb-2" />
                  <p class="text-body-2">Be the DM</p>
                </div>
              </div>
            </div>
          </div>
        </VCol>

        <!-- Right Side - Registration Form -->
        <VCol cols="12" md="6" class="d-flex align-center justify-center pa-8">
          <div class="w-100" style="max-width: 450px">
            <!-- Mobile Header -->
            <div class="d-md-none text-center mb-6">
              <VIcon icon="mdi-dice-d20" size="48" color="primary" class="mb-4" />
              <h1 class="text-h4 font-weight-bold text-primary mb-2">
                Create Account
              </h1>
              <p class="text-body-1 text-neutral-600">
                Start your D&D journey today
              </p>
            </div>

            <!-- Desktop Header -->
            <div class="d-none d-md-block text-center mb-6">
              <h1 class="text-h3 font-weight-bold text-primary mb-2">
                Create Account
              </h1>
              <p class="text-h6 text-neutral-600">
                Join the AI-powered D&D community
              </p>
            </div>

            <!-- Registration Form -->
            <VForm
              ref="registerForm"
              v-model="isFormValid"
              @submit.prevent="handleRegister"
            >
              <VCard elevation="3" class="pa-6">
                <!-- Error Alert -->
                <VAlert
                  v-if="authStore.error"
                  type="error"
                  variant="tonal"
                  class="mb-4"
                  closable
                  @click:close="authStore.clearError()"
                >
                  <template #prepend>
                    <VIcon icon="mdi-alert-circle" />
                  </template>
                  {{ authStore.error }}
                </VAlert>

                <VCardText class="pa-0">
                  <!-- Name Fields -->
                  <VRow>
                    <VCol cols="6">
                      <VTextField
                        v-model="userData.firstName"
                        label="First Name"
                        variant="outlined"
                        density="comfortable"
                        :rules="firstNameRules"
                        :disabled="authStore.isLoading"
                        prepend-inner-icon="mdi-account"
                        autocomplete="given-name"
                        required
                      />
                    </VCol>
                    <VCol cols="6">
                      <VTextField
                        v-model="userData.lastName"
                        label="Last Name"
                        variant="outlined"
                        density="comfortable"
                        :rules="lastNameRules"
                        :disabled="authStore.isLoading"
                        prepend-inner-icon="mdi-account"
                        autocomplete="family-name"
                        required
                      />
                    </VCol>
                  </VRow>

                  <!-- Email Field -->
                  <VTextField
                    v-model="userData.email"
                    label="Email Address"
                    type="email"
                    variant="outlined"
                    density="comfortable"
                    :rules="emailRules"
                    :disabled="authStore.isLoading"
                    prepend-inner-icon="mdi-email"
                    class="mb-4"
                    autocomplete="email"
                    required
                  />

                  <!-- Password Field -->
                  <VTextField
                    v-model="userData.password"
                    label="Password"
                    :type="showPassword ? 'text' : 'password'"
                    variant="outlined"
                    density="comfortable"
                    :rules="passwordRules"
                    :disabled="authStore.isLoading"
                    prepend-inner-icon="mdi-lock"
                    :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                    class="mb-4"
                    autocomplete="new-password"
                    required
                    @click:append-inner="showPassword = !showPassword"
                  />

                  <!-- Confirm Password Field -->
                  <VTextField
                    v-model="userData.confirmPassword"
                    label="Confirm Password"
                    :type="showConfirmPassword ? 'text' : 'password'"
                    variant="outlined"
                    density="comfortable"
                    :rules="confirmPasswordRules"
                    :disabled="authStore.isLoading"
                    prepend-inner-icon="mdi-lock-check"
                    :append-inner-icon="showConfirmPassword ? 'mdi-eye-off' : 'mdi-eye'"
                    class="mb-4"
                    autocomplete="new-password"
                    required
                    @click:append-inner="showConfirmPassword = !showConfirmPassword"
                  />

                  <!-- Password Strength Indicator -->
                  <div class="mb-4">
                    <div class="d-flex align-center mb-2">
                      <span class="text-caption text-neutral-600">Password Strength:</span>
                      <VChip
                        :color="passwordStrength.color"
                        size="small"
                        class="ml-2"
                      >
                        {{ passwordStrength.text }}
                      </VChip>
                    </div>
                    <VProgressLinear
                      :model-value="passwordStrength.value"
                      :color="passwordStrength.color"
                      height="4"
                      class="mb-2"
                    />
                    <div class="text-caption text-neutral-600">
                      <div v-for="requirement in passwordRequirements" :key="requirement.text" class="d-flex align-center">
                        <VIcon
                          :icon="requirement.met ? 'mdi-check' : 'mdi-close'"
                          :color="requirement.met ? 'success' : 'error'"
                          size="16"
                          class="mr-2"
                        />
                        <span :class="requirement.met ? 'text-success' : 'text-error'">
                          {{ requirement.text }}
                        </span>
                      </div>
                    </div>
                  </div>

                  <!-- Terms and Conditions -->
                  <VCheckbox
                    v-model="userData.acceptTerms"
                    color="primary"
                    density="compact"
                    :disabled="authStore.isLoading"
                    :rules="termsRules"
                    class="mb-4"
                  >
                    <template #label>
                      <span class="text-body-2">
                        I agree to the 
                        <NuxtLink to="/terms" class="text-primary text-decoration-none" target="_blank">
                          Terms of Service
                        </NuxtLink>
                        and 
                        <NuxtLink to="/privacy" class="text-primary text-decoration-none" target="_blank">
                          Privacy Policy
                        </NuxtLink>
                      </span>
                    </template>
                  </VCheckbox>

                  <!-- Register Button -->
                  <VBtn
                    type="submit"
                    color="primary"
                    size="large"
                    block
                    :loading="authStore.isLoading"
                    :disabled="!isFormValid || authStore.isLoading"
                    class="mb-4"
                    elevation="2"
                  >
                    <VIcon icon="mdi-account-plus" class="mr-2" />
                    Create Account
                  </VBtn>

                  <!-- Divider -->
                  <VDivider class="my-6">
                    <span class="text-neutral-500 px-4">or</span>
                  </VDivider>

                  <!-- Login Link -->
                  <div class="text-center">
                    <p class="text-body-2 text-neutral-600 mb-2">
                      Already have an account?
                    </p>
                    <VBtn
                      variant="outlined"
                      color="primary"
                      size="large"
                      block
                      :disabled="authStore.isLoading"
                      @click="navigateToLogin"
                    >
                      <VIcon icon="mdi-login" class="mr-2" />
                      Sign In
                    </VBtn>
                  </div>
                </VCardText>
              </VCard>
            </VForm>
          </div>
        </VCol>
      </VRow>
    </VContainer>
  </div>
</template>

<script setup lang="ts">
// Page metadata and middleware
definePageMeta({
  middleware: 'guest'
})

useHead({
  title: 'Create Account',
  meta: [
    {
      name: 'description',
      content: 'Create your D&D AI Campaign Manager account to start building epic campaigns with AI-powered tools and collaborative features.'
    }
  ]
})

// Store
const authStore = useAuthStore()

// Router
const router = useRouter()

// Form state
const registerForm = ref()
const isFormValid = ref(false)
const showPassword = ref(false)
const showConfirmPassword = ref(false)

// Form data
const userData = reactive({
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: '',
  acceptTerms: false
})

// Validation rules
const firstNameRules = [
  (v: string) => !!v || 'First name is required',
  (v: string) => v.length <= 50 || 'First name must be less than 50 characters'
]

const lastNameRules = [
  (v: string) => !!v || 'Last name is required',
  (v: string) => v.length <= 50 || 'Last name must be less than 50 characters'
]

const emailRules = [
  (v: string) => !!v || 'Email is required',
  (v: string) => /.+@.+\..+/.test(v) || 'Email must be valid'
]

const passwordRules = [
  (v: string) => !!v || 'Password is required',
  (v: string) => v.length >= 8 || 'Password must be at least 8 characters',
  (v: string) => /[A-Z]/.test(v) || 'Password must contain at least one uppercase letter',
  (v: string) => /[a-z]/.test(v) || 'Password must contain at least one lowercase letter',
  (v: string) => /[0-9]/.test(v) || 'Password must contain at least one number',
  (v: string) => /[^a-zA-Z0-9]/.test(v) || 'Password must contain at least one special character'
]

const confirmPasswordRules = [
  (v: string) => !!v || 'Please confirm your password',
  (v: string) => v === userData.password || 'Passwords do not match'
]

const termsRules = [
  (v: boolean) => v || 'You must accept the terms and conditions'
]

// Password strength computation
const passwordRequirements = computed(() => [
  { text: 'At least 8 characters', met: userData.password.length >= 8 },
  { text: 'One uppercase letter', met: /[A-Z]/.test(userData.password) },
  { text: 'One lowercase letter', met: /[a-z]/.test(userData.password) },
  { text: 'One number', met: /[0-9]/.test(userData.password) },
  { text: 'One special character', met: /[^a-zA-Z0-9]/.test(userData.password) }
])

const passwordStrength = computed(() => {
  const metRequirements = passwordRequirements.value.filter(req => req.met).length
  const percentage = (metRequirements / passwordRequirements.value.length) * 100

  if (percentage === 0) {
    return { value: 0, color: 'error', text: 'Very Weak' }
  } else if (percentage <= 40) {
    return { value: percentage, color: 'error', text: 'Weak' }
  } else if (percentage <= 60) {
    return { value: percentage, color: 'warning', text: 'Fair' }
  } else if (percentage <= 80) {
    return { value: percentage, color: 'info', text: 'Good' }
  } else {
    return { value: percentage, color: 'success', text: 'Strong' }
  }
})

// Methods
const handleRegister = async () => {
  if (!isFormValid.value) return

  try {
    const result = await authStore.register(userData)
    
    if (result.success) {
      // Redirect to login with success message
      router.push('/auth/login?registered=true')
    }
  } catch (error) {
    console.error('Registration error:', error)
  }
}

const navigateToLogin = () => {
  router.push('/auth/login')
}

// Redirect if already authenticated
watch(() => authStore.isAuthenticated, (isAuth) => {
  if (isAuth) {
    router.push('/dashboard')
  }
}, { immediate: true })
</script>

<style scoped>
.min-h-screen {
  min-height: 100vh;
}

.gap-6 {
  gap: 1.5rem;
}

/* Custom focus styles for better accessibility */
.v-text-field:focus-within,
.v-checkbox:focus-within {
  outline: 2px solid var(--v-theme-primary);
  outline-offset: 2px;
}

/* Animation for the account plus icon */
@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-10px);
  }
  60% {
    transform: translateY(-5px);
  }
}

.animate-bounce {
  animation: bounce 2s ease-in-out infinite;
}

/* Responsive adjustments */
@media (max-width: 960px) {
  .text-h3 {
    font-size: 2rem !important;
  }
  
  .text-h4 {
    font-size: 1.5rem !important;
  }
}

/* Accessibility improvements */
.v-btn:focus-visible {
  outline: 2px solid var(--v-theme-primary);
  outline-offset: 2px;
}
</style>
