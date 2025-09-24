<template>
  <div class="min-h-screen d-flex align-center justify-center bg-gradient-to-br from-neutral-50 to-neutral-100">
    <VContainer fluid class="pa-0">
      <VRow no-gutters class="min-h-screen">
        <!-- Left Side - Branding/Hero -->
        <VCol cols="12" md="6" class="d-none d-md-flex">
          <div class="w-100 d-flex flex-column align-center justify-center bg-gradient-to-br from-primary to-primary-darken-1 text-white pa-12">
            <div class="text-center mb-8">
              <VIcon icon="mdi-dice-d20" size="80" class="mb-6 animate-pulse" />
              <h1 class="text-h3 font-weight-bold mb-4">
                Welcome Back, Adventurer!
              </h1>
              <p class="text-h6 opacity-90 mb-8">
                Your campaigns and characters await your return
              </p>
              <div class="d-flex align-center justify-center gap-4 opacity-80">
                <div class="text-center">
                  <VIcon icon="mdi-sword" size="24" class="mb-2" />
                  <p class="text-caption">Epic Campaigns</p>
                </div>
                <div class="text-center">
                  <VIcon icon="mdi-brain" size="24" class="mb-2" />
                  <p class="text-caption">AI-Powered</p>
                </div>
                <div class="text-center">
                  <VIcon icon="mdi-account-group" size="24" class="mb-2" />
                  <p class="text-caption">Collaborative</p>
                </div>
              </div>
            </div>
          </div>
        </VCol>

        <!-- Right Side - Login Form -->
        <VCol cols="12" md="6" class="d-flex align-center justify-center pa-8">
          <div class="w-100" style="max-width: 400px">
            <!-- Mobile Header -->
            <div class="d-md-none text-center mb-8">
              <VIcon icon="mdi-dice-d20" size="48" color="primary" class="mb-4" />
              <h1 class="text-h4 font-weight-bold text-primary mb-2">
                Sign In
              </h1>
              <p class="text-body-1 text-neutral-600">
                Welcome back to your campaigns
              </p>
            </div>

            <!-- Desktop Header -->
            <div class="d-none d-md-block text-center mb-8">
              <h1 class="text-h3 font-weight-bold text-primary mb-2">
                Sign In
              </h1>
              <p class="text-h6 text-neutral-600">
                Access your D&D campaigns and characters
              </p>
            </div>

            <!-- Login Form -->
            <form
              ref="loginForm"
              @submit.prevent="handleLogin"
            >
              <AppCard variant="elevated" size="md" class="pa-6">
                <!-- Error Alert -->
                <AppAlert
                  v-if="authStore.error"
                  v-model="showError"
                  type="error"
                  variant="tonal"
                  :text="authStore.error"
                  closable
                  class="mb-4"
                  @close="authStore.clearError()"
                />

                <!-- Success Alert -->
                <AppAlert
                  v-if="successMessage"
                  v-model="showSuccess"
                  type="success"
                  variant="tonal"
                  :text="successMessage"
                  class="mb-4"
                />

                <div class="pa-0">
                  <!-- Email Field -->
                  <FormField
                    label="Email Address"
                    :validation-messages="emailErrors"
                    required
                    class="mb-4"
                  >
                    <AppInput
                      v-model="credentials.email"
                      type="email"
                      placeholder="Enter your email address"
                      variant="outlined"
                      size="md"
                      :rules="emailRules"
                      :disabled="authStore.isLoading"
                      prepend-icon="mdi-email"
                      autocomplete="email"
                      required
                    />
                  </FormField>

                  <!-- Password Field -->
                  <FormField
                    label="Password"
                    :validation-messages="passwordErrors"
                    required
                    class="mb-4"
                  >
                    <AppInput
                      v-model="credentials.password"
                      type="password"
                      placeholder="Enter your password"
                      variant="outlined"
                      size="md"
                      :rules="passwordRules"
                      :disabled="authStore.isLoading"
                      prepend-icon="mdi-lock"
                      autocomplete="current-password"
                      required
                    />
                  </FormField>

                  <!-- Remember Me & Forgot Password -->
                  <div class="d-flex justify-space-between align-center mb-6">
                    <VCheckbox
                      v-model="credentials.rememberMe"
                      label="Remember me"
                      color="primary"
                      density="compact"
                      :disabled="authStore.isLoading"
                    />
                    <AppButton
                      variant="text"
                      color="primary"
                      size="sm"
                      :disabled="authStore.isLoading"
                      @click="navigateToForgotPassword"
                    >
                      Forgot password?
                    </AppButton>
                  </div>

                  <!-- Login Button -->
                  <AppButton
                    type="submit"
                    color="primary"
                    size="lg"
                    block
                    :loading="authStore.isLoading"
                    :disabled="!isFormValid || authStore.isLoading"
                    prepend-icon="mdi-login"
                    class="mb-4"
                  >
                    Sign In
                  </AppButton>

                  <!-- Divider -->
                  <VDivider class="my-6">
                    <span class="text-neutral-500 px-4">or</span>
                  </VDivider>

                  <!-- Register Link -->
                  <div class="text-center">
                    <p class="text-body-2 text-neutral-600 mb-2">
                      Don't have an account?
                    </p>
                    <AppButton
                      variant="outlined"
                      color="primary"
                      size="lg"
                      block
                      :disabled="authStore.isLoading"
                      prepend-icon="mdi-account-plus"
                      @click="navigateToRegister"
                    >
                      Create Account
                    </AppButton>
                  </div>
                </VCardText>
              </VCard>
            </VForm>

            <!-- Footer Links -->
            <div class="text-center mt-8">
              <p class="text-caption text-neutral-500">
                By signing in, you agree to our 
                <NuxtLink to="/terms" class="text-primary text-decoration-none">
                  Terms of Service
                </NuxtLink>
                and 
                <NuxtLink to="/privacy" class="text-primary text-decoration-none">
                  Privacy Policy
                </NuxtLink>
              </p>
            </div>
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
  title: 'Sign In',
  meta: [
    {
      name: 'description',
      content: 'Sign in to your D&D AI Campaign Manager account to access your campaigns, characters, and AI-powered tools.'
    }
  ]
})

// Store
const authStore = useAuthStore()

// Router
const router = useRouter()
const route = useRoute()

// Form state
const loginForm = ref()
const isFormValid = ref(false)
const showPassword = ref(false)
const successMessage = ref('')
const showError = ref(true)
const showSuccess = ref(true)

// Validation errors
const emailErrors = ref<string[]>([])
const passwordErrors = ref<string[]>([])

// Form validation
const validateForm = () => {
  emailErrors.value = []
  passwordErrors.value = []
  
  // Run email rules
  for (const rule of emailRules) {
    const result = rule(credentials.email)
    if (result !== true) {
      emailErrors.value.push(result)
    }
  }
  
  // Run password rules
  for (const rule of passwordRules) {
    const result = rule(credentials.password)
    if (result !== true) {
      passwordErrors.value.push(result)
    }
  }
  
  isFormValid.value = emailErrors.value.length === 0 && passwordErrors.value.length === 0
}

// Form data
const credentials = reactive({
  email: '',
  password: '',
  rememberMe: false
})

// Validation rules
const emailRules = [
  (v: string) => !!v || 'Email is required',
  (v: string) => /.+@.+\..+/.test(v) || 'Email must be valid'
]

const passwordRules = [
  (v: string) => !!v || 'Password is required',
  (v: string) => v.length >= 8 || 'Password must be at least 8 characters'
]

// Methods
const handleLogin = async () => {
  validateForm()
  if (!isFormValid.value) return

  try {
    const result = await authStore.login(credentials)
    
    if (result.success) {
      successMessage.value = 'Login successful! Redirecting...'
      
      // Redirect to intended page or dashboard
      const redirectTo = route.query.redirect as string || '/dashboard'
      
      setTimeout(() => {
        router.push(redirectTo)
      }, 1000)
    }
  } catch (error) {
    console.error('Login error:', error)
  }
}

const navigateToRegister = () => {
  router.push('/auth/register')
}

const navigateToForgotPassword = () => {
  router.push('/auth/forgot-password')
}

// Check for success messages from registration
onMounted(() => {
  if (route.query.registered === 'true') {
    successMessage.value = 'Registration successful! Please sign in with your credentials.'
  }
  if (route.query.verified === 'true') {
    successMessage.value = 'Email verified successfully! You can now sign in.'
  }
  if (route.query.reset === 'true') {
    successMessage.value = 'Password reset successfully! Please sign in with your new password.'
  }
})

// Redirect if already authenticated
watch(() => authStore.isAuthenticated, (isAuth) => {
  if (isAuth) {
    const redirectTo = route.query.redirect as string || '/dashboard'
    router.push(redirectTo)
  }
}, { immediate: true })
</script>

<style scoped>
.min-h-screen {
  min-height: 100vh;
}

.gap-4 {
  gap: 1rem;
}

/* Custom focus styles for better accessibility */
.v-text-field:focus-within {
  outline: 2px solid var(--v-theme-primary);
  outline-offset: 2px;
}

/* Animation for the D20 icon */
@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

.animate-pulse {
  animation: pulse 2s ease-in-out infinite;
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

.v-checkbox:focus-within {
  outline: 2px solid var(--v-theme-primary);
  outline-offset: 2px;
}
</style>
