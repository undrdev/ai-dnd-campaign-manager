<template>
  <div class="min-h-screen d-flex align-center justify-center bg-gradient-to-br from-neutral-50 to-neutral-100">
    <VContainer class="py-12">
      <VRow justify="center">
        <VCol cols="12" sm="8" md="6" lg="4">
          <div class="text-center mb-8">
            <VIcon icon="mdi-lock-reset" size="64" color="primary" class="mb-4" />
            <h1 class="text-h4 font-weight-bold text-primary mb-2">
              Reset Password
            </h1>
            <p class="text-body-1 text-neutral-600">
              Enter your email address and we'll send you a link to reset your password
            </p>
          </div>

          <VCard elevation="3" class="pa-6">
            <!-- Success State -->
            <div v-if="emailSent" class="text-center">
              <VIcon icon="mdi-email-check" size="64" color="success" class="mb-4" />
              <h2 class="text-h5 font-weight-bold text-success mb-4">
                Check Your Email
              </h2>
              <p class="text-body-1 text-neutral-600 mb-6">
                We've sent a password reset link to <strong>{{ submittedEmail }}</strong>
              </p>
              <VAlert type="info" variant="tonal" class="mb-6">
                <template #prepend>
                  <VIcon icon="mdi-information" />
                </template>
                <div class="text-left">
                  <p class="mb-2">
                    <strong>Didn't receive the email?</strong>
                  </p>
                  <ul class="text-body-2">
                    <li>Check your spam/junk folder</li>
                    <li>Make sure you entered the correct email address</li>
                    <li>Wait a few minutes for the email to arrive</li>
                  </ul>
                </div>
              </VAlert>
              <div class="d-flex flex-column gap-3">
                <VBtn
                  color="primary"
                  variant="outlined"
                  block
                  :loading="isLoading"
                  @click="resendEmail"
                >
                  <VIcon icon="mdi-email-send" class="mr-2" />
                  Resend Email
                </VBtn>
                <VBtn
                  color="neutral"
                  variant="text"
                  block
                  @click="backToLogin"
                >
                  <VIcon icon="mdi-arrow-left" class="mr-2" />
                  Back to Sign In
                </VBtn>
              </div>
            </div>

            <!-- Form State -->
            <div v-else>
              <VForm
                ref="forgotPasswordForm"
                v-model="isFormValid"
                @submit.prevent="handleForgotPassword"
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
                  <!-- Email Field -->
                  <VTextField
                    v-model="email"
                    label="Email Address"
                    type="email"
                    variant="outlined"
                    density="comfortable"
                    :rules="emailRules"
                    :disabled="isLoading"
                    prepend-inner-icon="mdi-email"
                    class="mb-6"
                    autocomplete="email"
                    autofocus
                    required
                  />

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
                    <VIcon icon="mdi-email-send" class="mr-2" />
                    Send Reset Link
                  </VBtn>

                  <!-- Back to Login -->
                  <VBtn
                    color="neutral"
                    variant="text"
                    size="large"
                    block
                    :disabled="isLoading"
                    @click="backToLogin"
                  >
                    <VIcon icon="mdi-arrow-left" class="mr-2" />
                    Back to Sign In
                  </VBtn>
                </VCardText>
              </VForm>
            </div>
          </VCard>

          <!-- Help Section -->
          <VCard v-if="!emailSent" variant="tonal" color="info" class="mt-6 pa-4">
            <VCardText class="pa-0">
              <div class="d-flex align-start">
                <VIcon icon="mdi-help-circle" color="info" class="mr-3 mt-1" />
                <div>
                  <h3 class="text-h6 font-weight-bold mb-2">Need Help?</h3>
                  <p class="text-body-2 mb-3">
                    If you're having trouble accessing your account, our support team is here to help.
                  </p>
                  <VBtn
                    color="info"
                    variant="text"
                    size="small"
                    href="mailto:support@dndai.com"
                  >
                    <VIcon icon="mdi-email" class="mr-2" />
                    Contact Support
                  </VBtn>
                </div>
              </div>
            </VCardText>
          </VCard>

          <!-- Security Notice -->
          <div class="text-center mt-6">
            <p class="text-caption text-neutral-500">
              <VIcon icon="mdi-shield-check" size="16" class="mr-1" />
              Your security is important to us. Password reset links expire in 1 hour.
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
      content: 'Reset your D&D AI Campaign Manager password. Enter your email address to receive a secure password reset link.'
    }
  ]
})

// Router
const router = useRouter()

// Form state
const forgotPasswordForm = ref()
const isFormValid = ref(false)
const isLoading = ref(false)
const emailSent = ref(false)
const submittedEmail = ref('')
const errorMessage = ref('')

// Form data
const email = ref('')

// Validation rules
const emailRules = [
  (v: string) => !!v || 'Email is required',
  (v: string) => /.+@.+\..+/.test(v) || 'Email must be valid'
]

// Methods
const handleForgotPassword = async () => {
  if (!isFormValid.value) return

  isLoading.value = true
  errorMessage.value = ''

  try {
    // Simulate API call to request password reset
    const config = useRuntimeConfig()
    
    const response = await $fetch('/api/auth/forgot-password', {
      baseURL: config.public.apiBaseUrl,
      method: 'POST',
      body: {
        email: email.value
      }
    })

    // Always show success message for security reasons
    // (don't reveal if email exists or not)
    submittedEmail.value = email.value
    emailSent.value = true
    
  } catch (error: any) {
    console.error('Forgot password error:', error)
    errorMessage.value = error.data?.message || 'An error occurred. Please try again later.'
  } finally {
    isLoading.value = false
  }
}

const resendEmail = async () => {
  isLoading.value = true
  
  try {
    await handleForgotPassword()
  } finally {
    isLoading.value = false
  }
}

const backToLogin = () => {
  router.push('/auth/login')
}

// Auto-fill email from query parameter
onMounted(() => {
  const route = useRoute()
  if (route.query.email) {
    email.value = route.query.email as string
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
