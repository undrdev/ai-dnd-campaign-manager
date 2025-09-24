<template>
  <div class="min-h-screen d-flex align-center justify-center bg-gradient-to-br from-neutral-50 to-neutral-100">
    <VContainer class="py-12">
      <VRow justify="center">
        <VCol cols="12" sm="8" md="6" lg="4">
          <!-- Loading State -->
          <div v-if="isVerifying" class="text-center">
            <VProgressCircular
              size="64"
              width="6"
              color="primary"
              indeterminate
              class="mb-6"
            />
            <h1 class="text-h4 font-weight-bold text-primary mb-4">
              Verifying Your Email
            </h1>
            <p class="text-body-1 text-neutral-600">
              Please wait while we verify your email address...
            </p>
          </div>

          <!-- Success State -->
          <div v-else-if="verificationSuccess" class="text-center">
            <VIcon icon="mdi-check-circle" size="80" color="success" class="mb-6 animate-scale" />
            <h1 class="text-h4 font-weight-bold text-success mb-4">
              Email Verified Successfully!
            </h1>
            <p class="text-body-1 text-neutral-600 mb-8">
              Your email address has been confirmed. You can now access all features of your D&D AI Campaign Manager account.
            </p>
            
            <VCard elevation="3" class="pa-6 mb-6">
              <VCardText class="pa-0">
                <div class="d-flex align-center mb-4">
                  <VAvatar color="primary" class="mr-4">
                    <VIcon icon="mdi-account-check" />
                  </VAvatar>
                  <div class="text-left">
                    <h3 class="text-h6 font-weight-bold">Account Activated</h3>
                    <p class="text-body-2 text-neutral-600 mb-0">
                      Welcome to the D&D AI community!
                    </p>
                  </div>
                </div>
                
                <VDivider class="mb-4" />
                
                <div class="text-left">
                  <h4 class="text-subtitle-1 font-weight-bold mb-3">What's Next?</h4>
                  <div class="d-flex align-center mb-2">
                    <VIcon icon="mdi-dice-d20" color="primary" size="20" class="mr-3" />
                    <span class="text-body-2">Create your first campaign</span>
                  </div>
                  <div class="d-flex align-center mb-2">
                    <VIcon icon="mdi-account-plus" color="primary" size="20" class="mr-3" />
                    <span class="text-body-2">Build epic characters</span>
                  </div>
                  <div class="d-flex align-center mb-2">
                    <VIcon icon="mdi-brain" color="primary" size="20" class="mr-3" />
                    <span class="text-body-2">Explore AI-powered tools</span>
                  </div>
                </div>
              </VCardText>
            </VCard>

            <div class="d-flex flex-column gap-3">
              <VBtn
                color="primary"
                size="large"
                block
                elevation="2"
                @click="goToDashboard"
              >
                <VIcon icon="mdi-view-dashboard" class="mr-2" />
                Go to Dashboard
              </VBtn>
              <VBtn
                color="secondary"
                variant="outlined"
                size="large"
                block
                @click="goToLogin"
              >
                <VIcon icon="mdi-login" class="mr-2" />
                Sign In Now
              </VBtn>
            </div>
          </div>

          <!-- Error State -->
          <div v-else class="text-center">
            <VIcon icon="mdi-alert-circle" size="80" color="error" class="mb-6" />
            <h1 class="text-h4 font-weight-bold text-error mb-4">
              Verification Failed
            </h1>
            <p class="text-body-1 text-neutral-600 mb-6">
              {{ errorMessage }}
            </p>

            <VCard elevation="3" class="pa-6 mb-6">
              <VCardText class="pa-0">
                <VAlert type="info" variant="tonal" class="mb-4">
                  <template #prepend>
                    <VIcon icon="mdi-information" />
                  </template>
                  <div class="text-left">
                    <p class="mb-2">
                      <strong>Common Issues:</strong>
                    </p>
                    <ul class="text-body-2">
                      <li>The verification link has expired (links expire after 24 hours)</li>
                      <li>The link has already been used</li>
                      <li>The email address has already been verified</li>
                    </ul>
                  </div>
                </VAlert>
              </VCardText>
            </VCard>

            <div class="d-flex flex-column gap-3">
              <VBtn
                color="primary"
                size="large"
                block
                elevation="2"
                :loading="isResending"
                @click="resendVerification"
              >
                <VIcon icon="mdi-email-send" class="mr-2" />
                Send New Verification Email
              </VBtn>
              <VBtn
                color="neutral"
                variant="outlined"
                size="large"
                block
                @click="goToLogin"
              >
                <VIcon icon="mdi-arrow-left" class="mr-2" />
                Back to Sign In
              </VBtn>
              <VBtn
                color="neutral"
                variant="text"
                size="small"
                href="mailto:support@dndai.com"
              >
                <VIcon icon="mdi-help-circle" class="mr-2" />
                Contact Support
              </VBtn>
            </div>
          </div>

          <!-- Security Notice -->
          <div class="text-center mt-8">
            <p class="text-caption text-neutral-500">
              <VIcon icon="mdi-shield-check" size="16" class="mr-1" />
              Email verification helps keep your account secure.
            </p>
          </div>
        </VCol>
      </VRow>
    </VContainer>
  </div>
</template>

<script setup lang="ts">
// Page metadata
useHead({
  title: 'Verify Email',
  meta: [
    {
      name: 'description',
      content: 'Verify your email address for D&D AI Campaign Manager to activate your account and access all features.'
    }
  ]
})

// Store
const authStore = useAuthStore()

// Router
const router = useRouter()
const route = useRoute()

// State
const isVerifying = ref(true)
const verificationSuccess = ref(false)
const isResending = ref(false)
const errorMessage = ref('')

// Token and user ID from URL
const token = computed(() => route.query.token as string)
const userId = computed(() => route.query.userId as string)

// Methods
const verifyEmail = async () => {
  if (!token.value || !userId.value) {
    errorMessage.value = 'Invalid verification link. The link may be malformed or incomplete.'
    isVerifying.value = false
    return
  }

  try {
    const config = useRuntimeConfig()
    
    const response = await $fetch<{
      success: boolean
      message?: string
    }>('/api/auth/verify-email', {
      baseURL: config.public.apiBaseUrl,
      method: 'POST',
      body: {
        userId: userId.value,
        token: token.value
      }
    })

    if (response.success) {
      verificationSuccess.value = true
    } else {
      throw new Error(response.message || 'Email verification failed')
    }
    
  } catch (error: any) {
    console.error('Email verification error:', error)
    
    // Handle different error types
    if (error.status === 400) {
      if (error.data?.code === 'AUTH004') {
        errorMessage.value = 'This verification link has expired or is invalid. Please request a new verification email.'
      } else if (error.data?.code === 'AUTH007') {
        errorMessage.value = 'User not found. The verification link may be for a different account.'
      } else {
        errorMessage.value = error.data?.message || 'The verification link is invalid or has already been used.'
      }
    } else {
      errorMessage.value = 'An error occurred during verification. Please try again or contact support.'
    }
  } finally {
    isVerifying.value = false
  }
}

const resendVerification = async () => {
  isResending.value = true
  
  try {
    // For now, just redirect to a page where they can request new verification
    // In a real app, you might extract email from the token or ask user to enter it
    router.push('/auth/login?message=verification-resent')
  } catch (error) {
    console.error('Resend verification error:', error)
  } finally {
    isResending.value = false
  }
}

const goToDashboard = () => {
  if (authStore.isAuthenticated) {
    router.push('/dashboard')
  } else {
    // User needs to sign in first
    router.push('/auth/login?verified=true')
  }
}

const goToLogin = () => {
  if (verificationSuccess.value) {
    router.push('/auth/login?verified=true')
  } else {
    router.push('/auth/login')
  }
}

// Start verification on mount
onMounted(() => {
  verifyEmail()
})
</script>

<style scoped>
.min-h-screen {
  min-height: 100vh;
}

.gap-3 {
  gap: 0.75rem;
}

/* Animation for success icon */
@keyframes scale {
  0% {
    transform: scale(0.8);
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
  }
}

.animate-scale {
  animation: scale 0.6s ease-out;
}

/* Custom focus styles for better accessibility */
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

/* List styling */
ul {
  padding-left: 1.2rem;
}

ul li {
  margin-bottom: 0.25rem;
}
</style>
