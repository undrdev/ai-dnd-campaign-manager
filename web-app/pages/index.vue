<template>
  <div class="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100">
    <!-- Hero Section -->
    <VContainer fluid class="pa-0">
      <VRow no-gutters class="min-h-screen align-center">
        <VCol cols="12" md="6" class="pa-8 pa-md-12">
          <div class="animate-fade-in">
            <!-- Logo/Brand -->
            <div class="mb-8">
              <VIcon icon="mdi-dice-d20" size="64" color="primary" class="mb-4" />
              <h1 class="text-h2 text-md-h1 font-weight-bold text-primary mb-2">
                D&D AI Campaign Manager
              </h1>
              <p class="text-h6 text-neutral-600 font-weight-regular">
                AI-powered campaign management for the modern Game Master
              </p>
            </div>

            <!-- Key Features -->
            <div class="mb-8">
              <VRow>
                <VCol cols="12" sm="6" class="mb-4">
                  <div class="d-flex align-center mb-2">
                    <VIcon icon="mdi-brain" color="secondary" class="mr-3" />
                    <span class="text-h6 font-weight-medium">AI-Powered</span>
                  </div>
                  <p class="text-body-2 text-neutral-600 ml-8">
                    Intelligent NPC generation, world building, and campaign assistance
                  </p>
                </VCol>
                <VCol cols="12" sm="6" class="mb-4">
                  <div class="d-flex align-center mb-2">
                    <VIcon icon="mdi-account-group" color="secondary" class="mr-3" />
                    <span class="text-h6 font-weight-medium">Collaborative</span>
                  </div>
                  <p class="text-body-2 text-neutral-600 ml-8">
                    Seamless player and GM collaboration with real-time updates
                  </p>
                </VCol>
                <VCol cols="12" sm="6" class="mb-4">
                  <div class="d-flex align-center mb-2">
                    <VIcon icon="mdi-devices" color="secondary" class="mr-3" />
                    <span class="text-h6 font-weight-medium">Cross-Platform</span>
                  </div>
                  <p class="text-body-2 text-neutral-600 ml-8">
                    Access your campaigns anywhere - web, mobile, or desktop
                  </p>
                </VCol>
                <VCol cols="12" sm="6" class="mb-4">
                  <div class="d-flex align-center mb-2">
                    <VIcon icon="mdi-chart-line" color="secondary" class="mr-3" />
                    <span class="text-h6 font-weight-medium">Analytics</span>
                  </div>
                  <p class="text-body-2 text-neutral-600 ml-8">
                    Track player engagement and campaign progression insights
                  </p>
                </VCol>
              </VRow>
            </div>

            <!-- CTA Buttons -->
            <div class="d-flex flex-column flex-sm-row gap-4">
              <VBtn
                color="primary"
                size="large"
                elevation="3"
                class="px-8"
                @click="navigateToRegister"
              >
                <VIcon icon="mdi-account-plus" class="mr-2" />
                Get Started Free
              </VBtn>
              <VBtn
                variant="outlined"
                color="primary"
                size="large"
                class="px-8"
                @click="navigateToLogin"
              >
                <VIcon icon="mdi-login" class="mr-2" />
                Sign In
              </VBtn>
            </div>
          </div>
        </VCol>

        <!-- Hero Image/Illustration -->
        <VCol cols="12" md="6" class="pa-0">
          <div class="h-100 d-flex align-center justify-center bg-gradient-to-br from-primary-lighten-1 to-primary">
            <div class="text-center text-white pa-8">
              <VIcon 
                icon="mdi-castle" 
                size="200" 
                class="opacity-80 mb-4 animate-pulse"
              />
              <h2 class="text-h4 font-weight-bold mb-4">
                Your Epic Adventure Awaits
              </h2>
              <p class="text-h6 opacity-90">
                Join thousands of Game Masters already using AI to enhance their campaigns
              </p>
            </div>
          </div>
        </VCol>
      </VRow>
    </VContainer>

    <!-- Features Section -->
    <VContainer class="py-16">
      <VRow>
        <VCol cols="12" class="text-center mb-12">
          <h2 class="text-h3 font-weight-bold text-primary mb-4">
            Everything You Need to Run Epic Campaigns
          </h2>
          <p class="text-h6 text-neutral-600 max-w-2xl mx-auto">
            From character creation to world building, our AI-powered tools help you create 
            unforgettable D&D experiences for your players.
          </p>
        </VCol>
      </VRow>

      <VRow>
        <VCol v-for="feature in features" :key="feature.title" cols="12" md="4" class="mb-8">
          <VCard class="h-100 transition-smooth hover:shadow-lg">
            <VCardText class="pa-6 text-center">
              <VIcon 
                :icon="feature.icon" 
                size="48" 
                color="primary" 
                class="mb-4"
              />
              <h3 class="text-h5 font-weight-bold mb-3">{{ feature.title }}</h3>
              <p class="text-body-1 text-neutral-600">{{ feature.description }}</p>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>
    </VContainer>

    <!-- Footer -->
    <VFooter class="bg-neutral-900 text-white pa-8">
      <VContainer>
        <VRow>
          <VCol cols="12" md="6">
            <div class="d-flex align-center mb-4">
              <VIcon icon="mdi-dice-d20" size="32" color="secondary" class="mr-3" />
              <span class="text-h6 font-weight-bold">D&D AI Campaign Manager</span>
            </div>
            <p class="text-body-2 opacity-80">
              Empowering Game Masters with AI-driven campaign management tools.
            </p>
          </VCol>
          <VCol cols="12" md="6" class="text-md-right">
            <p class="text-body-2 opacity-60">
              © 2025 D&D AI Campaign Manager. All rights reserved.
            </p>
          </VCol>
        </VRow>
      </VContainer>
    </VFooter>
  </div>
</template>

<script setup lang="ts">
// Page metadata
useHead({
  title: 'Home',
  meta: [
    {
      name: 'description',
      content: 'AI-powered D&D campaign management platform. Create, manage, and enhance your tabletop RPG campaigns with intelligent tools and collaborative features.'
    }
  ]
})

// Features data
const features = ref([
  {
    title: 'AI NPC Generation',
    icon: 'mdi-account-multiple',
    description: 'Create rich, detailed NPCs with unique personalities, backstories, and dialogue patterns using advanced AI.'
  },
  {
    title: 'Dynamic World Building',
    icon: 'mdi-earth',
    description: 'Generate immersive locations, quests, and storylines that adapt to your players\' choices and actions.'
  },
  {
    title: 'Character Management',
    icon: 'mdi-account-details',
    description: 'Comprehensive character sheets, progression tracking, and automated calculations for all your players.'
  },
  {
    title: 'Session Planning',
    icon: 'mdi-calendar-check',
    description: 'Plan and organize your sessions with AI-assisted encounter building and story arc management.'
  },
  {
    title: 'Real-time Collaboration',
    icon: 'mdi-share-variant',
    description: 'Share campaigns, characters, and resources with your players in real-time across all devices.'
  },
  {
    title: 'Campaign Analytics',
    icon: 'mdi-chart-box',
    description: 'Track player engagement, story progression, and campaign statistics to improve your games.'
  }
])

// Navigation methods
const navigateToRegister = () => {
  navigateTo('/auth/register')
}

const navigateToLogin = () => {
  navigateTo('/auth/login')
}
</script>

<style scoped>
.max-w-2xl {
  max-width: 42rem;
}

.gap-4 {
  gap: 1rem;
}

/* Custom hover effects */
.hover\:shadow-lg:hover {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

/* Responsive text sizing */
@media (max-width: 960px) {
  .text-md-h1 {
    font-size: 2.5rem !important;
  }
}
</style>
