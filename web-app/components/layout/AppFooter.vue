<template>
  <VFooter 
    :color="color"
    :class="[
      'app-footer',
      {
        'app-footer--minimal': minimal,
        'app-footer--sticky': sticky
      }
    ]"
  >
    <VContainer :fluid="!constrained">
      <!-- Minimal Footer -->
      <div v-if="minimal" class="d-flex align-center justify-space-between flex-wrap">
        <div class="d-flex align-center">
          <VIcon icon="mdi-dice-d20" size="20" :color="iconColor" class="mr-2" />
          <span :class="textClass">
            © {{ currentYear }} {{ appName }}
          </span>
        </div>
        
        <div class="d-flex align-center gap-4">
          <NuxtLink 
            to="/privacy" 
            :class="linkClass"
            class="text-decoration-none"
          >
            Privacy
          </NuxtLink>
          <NuxtLink 
            to="/terms" 
            :class="linkClass"
            class="text-decoration-none"
          >
            Terms
          </NuxtLink>
        </div>
      </div>

      <!-- Full Footer -->
      <div v-else>
        <VRow>
          <!-- Brand Section -->
          <VCol cols="12" md="4" class="mb-6 mb-md-0">
            <div class="d-flex align-center mb-4">
              <VIcon icon="mdi-dice-d20" size="32" :color="iconColor" class="mr-3" />
              <div>
                <h3 :class="['text-h6 font-weight-bold', textClass]">
                  {{ appName }}
                </h3>
                <p :class="['text-caption mb-0', subtextClass]">
                  AI-Powered Campaign Management
                </p>
              </div>
            </div>
            
            <p :class="['text-body-2 mb-4', subtextClass]">
              Enhance your D&D campaigns with intelligent tools for Game Masters and players. 
              Create epic adventures with AI assistance.
            </p>
            
            <!-- Social Links -->
            <div class="d-flex gap-2">
              <VBtn
                v-for="social in socialLinks"
                :key="social.name"
                :icon="social.icon"
                :href="social.url"
                :aria-label="social.name"
                variant="text"
                :color="iconColor"
                size="small"
                target="_blank"
                rel="noopener noreferrer"
              />
            </div>
          </VCol>
          
          <!-- Quick Links -->
          <VCol cols="6" md="2" class="mb-6 mb-md-0">
            <h4 :class="['text-subtitle-1 font-weight-bold mb-4', textClass]">
              Product
            </h4>
            <VList :color="color" density="compact" class="bg-transparent">
              <VListItem
                v-for="link in productLinks"
                :key="link.text"
                :to="link.to"
                :href="link.href"
                :target="link.external ? '_blank' : undefined"
                :rel="link.external ? 'noopener noreferrer' : undefined"
                class="px-0 py-1"
              >
                <VListItemTitle :class="linkClass">
                  {{ link.text }}
                </VListItemTitle>
              </VListItem>
            </VList>
          </VCol>
          
          <!-- Resources -->
          <VCol cols="6" md="2" class="mb-6 mb-md-0">
            <h4 :class="['text-subtitle-1 font-weight-bold mb-4', textClass]">
              Resources
            </h4>
            <VList :color="color" density="compact" class="bg-transparent">
              <VListItem
                v-for="link in resourceLinks"
                :key="link.text"
                :to="link.to"
                :href="link.href"
                :target="link.external ? '_blank' : undefined"
                :rel="link.external ? 'noopener noreferrer' : undefined"
                class="px-0 py-1"
              >
                <VListItemTitle :class="linkClass">
                  {{ link.text }}
                </VListItemTitle>
              </VListItem>
            </VList>
          </VCol>
          
          <!-- Support -->
          <VCol cols="6" md="2" class="mb-6 mb-md-0">
            <h4 :class="['text-subtitle-1 font-weight-bold mb-4', textClass]">
              Support
            </h4>
            <VList :color="color" density="compact" class="bg-transparent">
              <VListItem
                v-for="link in supportLinks"
                :key="link.text"
                :to="link.to"
                :href="link.href"
                :target="link.external ? '_blank' : undefined"
                :rel="link.external ? 'noopener noreferrer' : undefined"
                class="px-0 py-1"
              >
                <VListItemTitle :class="linkClass">
                  {{ link.text }}
                </VListItemTitle>
              </VListItem>
            </VList>
          </VCol>
          
          <!-- Newsletter Signup -->
          <VCol cols="6" md="2">
            <h4 :class="['text-subtitle-1 font-weight-bold mb-4', textClass]">
              Stay Updated
            </h4>
            <p :class="['text-body-2 mb-4', subtextClass]">
              Get the latest updates and D&D tips
            </p>
            
            <VForm @submit.prevent="handleNewsletterSignup">
              <VTextField
                v-model="newsletterEmail"
                placeholder="Enter your email"
                variant="outlined"
                density="compact"
                hide-details
                :color="inputColor"
                class="mb-2"
              >
                <template #append-inner>
                  <VBtn
                    type="submit"
                    :color="buttonColor"
                    variant="flat"
                    size="small"
                    :loading="newsletterLoading"
                  >
                    <VIcon icon="mdi-send" size="16" />
                  </VBtn>
                </template>
              </VTextField>
            </VForm>
            
            <p class="text-caption text-neutral-500 mt-2">
              We respect your privacy. Unsubscribe anytime.
            </p>
          </VCol>
        </VRow>
        
        <VDivider :color="dividerColor" class="my-6" />
        
        <!-- Bottom Section -->
        <VRow align="center">
          <VCol cols="12" md="6">
            <p :class="['text-body-2 mb-2 mb-md-0', subtextClass]">
              © {{ currentYear }} {{ appName }}. All rights reserved.
            </p>
          </VCol>
          
          <VCol cols="12" md="6" class="text-md-right">
            <div class="d-flex flex-wrap justify-center justify-md-end gap-4">
              <NuxtLink 
                to="/privacy" 
                :class="linkClass"
                class="text-decoration-none text-body-2"
              >
                Privacy Policy
              </NuxtLink>
              <NuxtLink 
                to="/terms" 
                :class="linkClass"
                class="text-decoration-none text-body-2"
              >
                Terms of Service
              </NuxtLink>
              <NuxtLink 
                to="/cookies" 
                :class="linkClass"
                class="text-decoration-none text-body-2"
              >
                Cookie Policy
              </NuxtLink>
            </div>
          </VCol>
        </VRow>
      </div>
    </VContainer>
  </VFooter>
</template>

<script setup lang="ts">
interface FooterLink {
  text: string
  to?: string
  href?: string
  external?: boolean
}

interface SocialLink {
  name: string
  icon: string
  url: string
}

interface Props {
  minimal?: boolean
  sticky?: boolean
  constrained?: boolean
  color?: string
}

const props = withDefaults(defineProps<Props>(), {
  minimal: false,
  sticky: false,
  constrained: true,
  color: 'neutral-900'
})

// Config and state
const config = useRuntimeConfig()
const appName = config.public.appName || 'D&D AI Campaign Manager'

const newsletterEmail = ref('')
const newsletterLoading = ref(false)

// Computed properties
const currentYear = computed(() => new Date().getFullYear())

const isDarkFooter = computed(() => {
  return props.color === 'neutral-900' || props.color === 'primary' || props.color.includes('dark')
})

const textClass = computed(() => 
  isDarkFooter.value ? 'text-white' : 'text-neutral-900'
)

const subtextClass = computed(() => 
  isDarkFooter.value ? 'text-white' : 'text-neutral-600'
)

const linkClass = computed(() => 
  isDarkFooter.value ? 'text-white' : 'text-neutral-600'
)

const iconColor = computed(() => 
  isDarkFooter.value ? 'white' : 'primary'
)

const inputColor = computed(() => 
  isDarkFooter.value ? 'white' : 'primary'
)

const buttonColor = computed(() => 
  isDarkFooter.value ? 'secondary' : 'primary'
)

const dividerColor = computed(() => 
  isDarkFooter.value ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.12)'
)

// Navigation links
const productLinks: FooterLink[] = [
  { text: 'Features', to: '/features' },
  { text: 'Pricing', to: '/pricing' },
  { text: 'AI Tools', to: '/ai-tools' },
  { text: 'Templates', to: '/templates' },
  { text: 'Integrations', to: '/integrations' }
]

const resourceLinks: FooterLink[] = [
  { text: 'Documentation', to: '/docs' },
  { text: 'API Reference', to: '/api-docs' },
  { text: 'Tutorials', to: '/tutorials' },
  { text: 'Blog', to: '/blog' },
  { text: 'Community', href: 'https://discord.gg/dndai', external: true }
]

const supportLinks: FooterLink[] = [
  { text: 'Help Center', to: '/help' },
  { text: 'Contact Us', to: '/contact' },
  { text: 'Bug Reports', to: '/bugs' },
  { text: 'Feature Requests', to: '/feature-requests' },
  { text: 'Status Page', href: 'https://status.dndai.com', external: true }
]

const socialLinks: SocialLink[] = [
  {
    name: 'Discord',
    icon: 'mdi-discord',
    url: 'https://discord.gg/dndai'
  },
  {
    name: 'Twitter',
    icon: 'mdi-twitter',
    url: 'https://twitter.com/dndai'
  },
  {
    name: 'YouTube',
    icon: 'mdi-youtube',
    url: 'https://youtube.com/@dndai'
  },
  {
    name: 'GitHub',
    icon: 'mdi-github',
    url: 'https://github.com/dndai'
  }
]

// Methods
const handleNewsletterSignup = async () => {
  if (!newsletterEmail.value || !isValidEmail(newsletterEmail.value)) {
    return
  }
  
  newsletterLoading.value = true
  
  try {
    // In a real app, this would call an API
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Show success message
    console.log('Newsletter signup:', newsletterEmail.value)
    newsletterEmail.value = ''
    
    // You could show a success toast here
  } catch (error) {
    console.error('Newsletter signup error:', error)
    // You could show an error toast here
  } finally {
    newsletterLoading.value = false
  }
}

const isValidEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}
</script>

<style scoped>
.app-footer {
  margin-top: auto;
}

.app-footer--minimal {
  padding: 1rem 0;
}

.app-footer--sticky {
  position: sticky;
  bottom: 0;
  z-index: 10;
}

.gap-2 {
  gap: 0.5rem;
}

.gap-4 {
  gap: 1rem;
}

/* Link hover effects */
:deep(.v-list-item:hover) {
  background-color: rgba(255, 255, 255, 0.05);
}

:deep(.v-list-item:hover .v-list-item-title) {
  color: var(--v-theme-secondary) !important;
}

/* Social button hover effects */
:deep(.v-btn:hover) {
  background-color: rgba(255, 255, 255, 0.1);
  transform: translateY(-2px);
}

/* Newsletter input styling */
:deep(.v-text-field .v-field) {
  border-radius: 8px;
}

:deep(.v-text-field--variant-outlined .v-field__outline) {
  color: rgba(255, 255, 255, 0.3);
}

:deep(.v-text-field--variant-outlined .v-field__input) {
  color: white;
}

:deep(.v-text-field--variant-outlined .v-field__input::placeholder) {
  color: rgba(255, 255, 255, 0.7);
}

/* Responsive adjustments */
@media (max-width: 960px) {
  .app-footer {
    text-align: center;
  }
  
  :deep(.v-col) {
    margin-bottom: 2rem;
  }
  
  .gap-4 {
    gap: 0.5rem;
  }
}

/* Smooth transitions */
.app-footer * {
  transition: all 0.2s ease;
}

/* Custom link styling */
a:hover {
  color: var(--v-theme-secondary) !important;
}
</style>
