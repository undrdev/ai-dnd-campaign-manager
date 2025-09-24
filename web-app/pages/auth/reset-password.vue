<template>
  <div class="min-h-screen d-flex align-center justify-center bg-gradient-to-br from-neutral-50 to-neutral-100">
    <VContainer class="py-12">
      <VRow justify="center">
        <VCol cols="12" sm="8" md="6" lg="4">
          <div class="text-center mb-8">
            <VIcon icon="mdi-lock-reset" size="64" color="primary" class="mb-4" />
            <h1 class="text-h4 font-weight-bold text-primary mb-2">
              Set New Password
            </h1>
            <p class="text-body-1 text-neutral-600">
              Enter your new password to complete the reset process
            </p>
          </div>

          <VCard elevation="3" class="pa-6">
            <!-- Success State -->
            <div v-if="resetSuccess" class="text-center">
              <VIcon icon="mdi-check-circle" size="64" color="success" class="mb-4" />
              <h2 class="text-h5 font-weight-bold text-success mb-4">
                Password Reset Successfully!
              </h2>
              <p class="text-body-1 text-neutral-600 mb-6">
                Your password has been updated. You can now sign in with your new password.
              </p>
              <VBtn
                color="primary"
                size="large"
                block
                elevation="2"
                @click="goToLogin"
              >
                <VIcon icon="mdi-login" class="mr-2" />
                Sign In Now
              </VBtn>
            </div>

            <!-- Error State -->
            <div v-else-if="tokenError" class="text-center">
              <VIcon icon="mdi-alert-circle" size="64" color="error" class="mb-4" />
              <h2 class="text-h5 font-weight-bold text-error mb-4">
                Invalid or Expired Link
              </h2>
              <p class="text-body-1 text-neutral-600 mb-6">
                This password reset link is invalid or has expired. Please request a new one.
              </p>
              <div class="d-flex flex-column gap-3">
                <VBtn
                  color="primary"
                  size="large"
                  block
                  elevation="2"
                  @click="requestNewReset"
                >
                  <VIcon icon="mdi-email-send" class="mr-2" />
                  Request New Reset Link
                </VBtn>
                <VBtn
                  color="neutral"
                  variant="text"
                  size="large"
                  block
                  @click="goToLogin"
                >
                  <VIcon icon="mdi-arrow-left" class="mr-2" />
                  Back to Sign In
                </VBtn>
              </div>
            </div>

            <!-- Form State -->
            <div v-else>
              <VForm
                ref="resetPasswordForm"
                v-model="isFormValid"
                @submit.prevent="handleResetPassword"
              >
                <!-- Error Alert -->
                <VAlert
                  v-if="errorMessage"
                  type="error"
                  variant="tonal"
                  class="mb-4"
                  closable
                  @click:close="errorMessage = ''"
                >
                  <template #prepend>
                    <VIcon icon="mdi-alert-circle" />
                  </template>
                  {{ errorMessage }}
                </VAlert>

                <VCardText class="pa-0">
                  <!-- New Password Field -->
                  <VTextField
                    v-model="passwords.newPassword"
                    label="New Password"
                    :type="showPassword ? 'text' : 'password'"
                    variant="outlined"
                    density="comfortable"
                    :rules="passwordRules"
                    :disabled="isLoading"
                    prepend-inner-icon="mdi-lock"
                    :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                    class="mb-4"
                    autocomplete="new-password"
                    required
                    @click:append-inner="showPassword = !showPassword"
                  />

                  <!-- Confirm Password Field -->
                  <VTextField
                    v-model="passwords.confirmPassword"
                    label="Confirm New Password"
                    :type="showConfirmPassword ? 'text' : 'password'"
                    variant="outlined"
                    density="comfortable"
                    :rules="confirmPasswordRules"
                    :disabled="isLoading"
                    prepend-inner-icon="mdi-lock-check"
                    :append-inner-icon="showConfirmPassword ? 'mdi-eye-off' : 'mdi-eye'"
                    class="mb-4"
                    autocomplete="new-password"
                    required
                    @click:append-inner="showConfirmPassword = !showConfirmPassword"
                  />

                  <!-- Password Strength Indicator -->
                  <div class="mb-6">
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

                  <!-- Submit Button -->
                  <VBtn
                    type="submit"
                    color="primary"
                    size="large"
                    block
                    :loading="isLoading"
                    :disabled="!isFormValid || isLoading"
                    class="mb-4"
                    elevation="2"
                  >
                    <VIcon icon="mdi-lock-reset" class="mr-2" />
                    Reset Password
                  </VBtn>

                  <!-- Back to Login -->
                  <VBtn
                    color="neutral"
                    variant="text"
                    size="large"
                    block
                    :disabled="isLoading"
                    @click="goToLogin"
                  >
                    <VIcon icon="mdi-arrow-left" class="mr-2" />
                    Back to Sign In
                  </VBtn>
                </VCardText>
              </VForm>
            </div>
          </VCard>

          <!-- Security Notice -->
          <div class="text-center mt-6">
            <p class="text-caption text-neutral-500">
              <VIcon icon="mdi-shield-check" size="16" class="mr-1" />
              For your security, you'll be signed out of all devices after password reset.
            </p>
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
  title: 'Reset Password',
  meta: [
    {
      name: 'description',
      content: 'Complete your password reset for D&D AI Campaign Manager. Set a new secure password to regain access to your account.'
    }
  ]
})

// Router
const router = useRouter()
const route = useRoute()

// Form state
const resetPasswordForm = ref()
const isFormValid = ref(false)
const isLoading = ref(false)
const resetSuccess = ref(false)
const tokenError = ref(false)
const errorMessage = ref('')
const showPassword = ref(false)
const showConfirmPassword = ref(false)

// Form data
const passwords = reactive({
  newPassword: '',
  confirmPassword: ''
})

// Token and user ID from URL
const token = computed(() => route.query.token as string)
const userId = computed(() => route.query.userId as string)

// Validation rules
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
  (v: string) => v === passwords.newPassword || 'Passwords do not match'
]

// Password strength computation
const passwordRequirements = computed(() => [
  { text: 'At least 8 characters', met: passwords.newPassword.length >= 8 },
  { text: 'One uppercase letter', met: /[A-Z]/.test(passwords.newPassword) },
  { text: 'One lowercase letter', met: /[a-z]/.test(passwords.newPassword) },
  { text: 'One number', met: /[0-9]/.test(passwords.newPassword) },
  { text: 'One special character', met: /[^a-zA-Z0-9]/.test(passwords.newPassword) }
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
const handleResetPassword = async () => {
  if (!isFormValid.value) return

  isLoading.value = true
  errorMessage.value = ''

  try {
    const config = useRuntimeConfig()
    
    const response = await $fetch<{
      success: boolean
      message?: string
    }>('/api/auth/reset-password', {
      baseURL: config.public.apiBaseUrl,
      method: 'POST',
      body: {
        userId: userId.value,
        token: token.value,
        newPassword: passwords.newPassword,
        confirmNewPassword: passwords.confirmPassword
      }
    })

    if (response.success) {
      resetSuccess.value = true
    } else {
      throw new Error(response.message || 'Password reset failed')
    }
    
  } catch (error: any) {
    console.error('Reset password error:', error)
    
    // Check if it's a token validation error
    if (error.status === 400 && error.data?.code === 'AUTH004') {
      tokenError.value = true
    } else {
      errorMessage.value = error.data?.message || 'An error occurred. Please try again.'
    }
  } finally {
    isLoading.value = false
  }
}

const goToLogin = () => {
  if (resetSuccess.value) {
    router.push('/auth/login?reset=true')
  } else {
    router.push('/auth/login')
  }
}

const requestNewReset = () => {
  router.push('/auth/forgot-password')
}

// Validate token on mount
onMounted(() => {
  if (!token.value || !userId.value) {
    tokenError.value = true
  }
})
</script>

<style scoped>
.min-h-screen {
  min-height: 100vh;
}

.gap-3 {
  gap: 0.75rem;
}

/* Custom focus styles for better accessibility */
.v-text-field:focus-within {
  outline: 2px solid var(--v-theme-primary);
  outline-offset: 2px;
}

/* Accessibility improvements */
.v-btn:focus-visible {
  outline: 2px solid var(--v-theme-primary);
  outline-offset: 2px;
}

/* Responsive adjustments */
@media (max-width: 600px) {
  .text-h4 {
    font-size: 1.5rem !important;
  }
  
  .text-h5 {
    font-size: 1.25rem !important;
  }
}
</style>
