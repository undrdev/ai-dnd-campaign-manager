<template>
  <div class="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100">
    <!-- App Bar -->
    <VAppBar color="primary" density="comfortable" elevation="2">
      <VAppBarTitle class="d-flex align-center">
        <VIcon icon="mdi-dice-d20" size="32" class="mr-3" />
        <span class="font-weight-bold">D&D AI Campaign Manager</span>
      </VAppBarTitle>
      
      <VSpacer />
      
      <!-- User Menu -->
      <VMenu>
        <template #activator="{ props }">
          <VBtn
            v-bind="props"
            icon
            variant="text"
            class="mr-2"
          >
            <VAvatar size="36" color="secondary">
              <span class="text-h6 font-weight-bold">
                {{ userInitials }}
              </span>
            </VAvatar>
          </VBtn>
        </template>
        
        <VCard min-width="250">
          <VCardText class="pb-0">
            <div class="d-flex align-center mb-3">
              <VAvatar size="40" color="secondary" class="mr-3">
                <span class="text-h6 font-weight-bold">
                  {{ userInitials }}
                </span>
              </VAvatar>
              <div>
                <p class="text-body-1 font-weight-bold mb-0">
                  {{ authStore.fullName }}
                </p>
                <p class="text-caption text-neutral-600 mb-0">
                  {{ authStore.user?.email }}
                </p>
              </div>
            </div>
            
            <VChip
              :color="subscriptionColor"
              size="small"
              variant="tonal"
              class="mb-3"
            >
              <VIcon :icon="subscriptionIcon" size="16" class="mr-1" />
              {{ authStore.user?.subscriptionTier }}
            </VChip>
          </VCardText>
          
          <VDivider />
          
          <VList density="compact">
            <VListItem
              prepend-icon="mdi-account"
              title="Profile Settings"
              @click="goToProfile"
            />
            <VListItem
              prepend-icon="mdi-crown"
              title="Subscription"
              @click="goToSubscription"
            />
            <VListItem
              prepend-icon="mdi-cog"
              title="Settings"
              @click="goToSettings"
            />
            <VDivider />
            <VListItem
              prepend-icon="mdi-logout"
              title="Sign Out"
              @click="handleLogout"
            />
          </VList>
        </VCard>
      </VMenu>
    </VAppBar>

    <!-- Main Content -->
    <VMain class="pa-6">
      <VContainer fluid>
        <!-- Welcome Section -->
        <VRow>
          <VCol cols="12">
            <VCard elevation="3" class="pa-6 mb-6">
              <div class="d-flex align-center justify-space-between flex-wrap">
                <div>
                  <h1 class="text-h4 font-weight-bold text-primary mb-2">
                    Welcome back, {{ authStore.user?.firstName }}!
                  </h1>
                  <p class="text-h6 text-neutral-600 mb-0">
                    Ready to continue your epic adventures?
                  </p>
                </div>
                <div class="text-center">
                  <VIcon icon="mdi-castle" size="64" color="primary" class="opacity-80" />
                </div>
              </div>
            </VCard>
          </VCol>
        </VRow>

        <!-- Quick Actions -->
        <VRow>
          <VCol cols="12" md="4">
            <VCard elevation="2" class="h-100 transition-smooth hover:shadow-lg" @click="createCampaign">
              <VCardText class="text-center pa-6">
                <VIcon icon="mdi-plus-circle" size="48" color="primary" class="mb-4" />
                <h3 class="text-h5 font-weight-bold mb-3">Create Campaign</h3>
                <p class="text-body-2 text-neutral-600">
                  Start a new D&D campaign with AI-powered tools
                </p>
              </VCardText>
            </VCard>
          </VCol>
          
          <VCol cols="12" md="4">
            <VCard elevation="2" class="h-100 transition-smooth hover:shadow-lg" @click="createCharacter">
              <VCardText class="text-center pa-6">
                <VIcon icon="mdi-account-plus" size="48" color="secondary" class="mb-4" />
                <h3 class="text-h5 font-weight-bold mb-3">Create Character</h3>
                <p class="text-body-2 text-neutral-600">
                  Build your next epic character with detailed stats
                </p>
              </VCardText>
            </VCard>
          </VCol>
          
          <VCol cols="12" md="4">
            <VCard elevation="2" class="h-100 transition-smooth hover:shadow-lg" @click="exploreAI">
              <VCardText class="text-center pa-6">
                <VIcon icon="mdi-brain" size="48" color="info" class="mb-4" />
                <h3 class="text-h5 font-weight-bold mb-3">AI Tools</h3>
                <p class="text-body-2 text-neutral-600">
                  Explore AI-powered NPCs, quests, and world building
                </p>
              </VCardText>
            </VCard>
          </VCol>
        </VRow>

        <!-- Recent Activity -->
        <VRow class="mt-6">
          <VCol cols="12">
            <h2 class="text-h5 font-weight-bold mb-4">Recent Activity</h2>
            <VCard elevation="2">
              <VCardText class="text-center pa-12">
                <VIcon icon="mdi-history" size="64" color="neutral" class="mb-4 opacity-60" />
                <h3 class="text-h6 font-weight-bold mb-3">No Recent Activity</h3>
                <p class="text-body-2 text-neutral-600 mb-4">
                  Your campaigns and characters will appear here once you start creating them.
                </p>
                <VBtn color="primary" variant="outlined" @click="createCampaign">
                  <VIcon icon="mdi-plus" class="mr-2" />
                  Get Started
                </VBtn>
              </VCardText>
            </VCard>
          </VCol>
        </VRow>
      </VContainer>
    </VMain>
  </div>
</template>

<script setup lang="ts">
// Page metadata and middleware
definePageMeta({
  middleware: 'auth',
  title: 'Dashboard'
})

useHead({
  title: 'Dashboard',
  meta: [
    {
      name: 'description',
      content: 'Your D&D AI Campaign Manager dashboard. Create campaigns, build characters, and explore AI-powered tools.'
    }
  ]
})

// Store
const authStore = useAuthStore()

// Router
const router = useRouter()

// Computed properties
const userInitials = computed(() => {
  if (!authStore.user) return 'U'
  const first = authStore.user.firstName.charAt(0).toUpperCase()
  const last = authStore.user.lastName.charAt(0).toUpperCase()
  return `${first}${last}`
})

const subscriptionColor = computed(() => {
  const tier = authStore.user?.subscriptionTier
  switch (tier) {
    case 'Pro':
      return 'success'
    case 'Premium':
      return 'warning'
    default:
      return 'neutral'
  }
})

const subscriptionIcon = computed(() => {
  const tier = authStore.user?.subscriptionTier
  switch (tier) {
    case 'Pro':
      return 'mdi-crown'
    case 'Premium':
      return 'mdi-star'
    default:
      return 'mdi-account'
  }
})

// Methods
const handleLogout = async () => {
  try {
    await authStore.logout()
    // Logout method handles redirect
  } catch (error) {
    console.error('Logout error:', error)
  }
}

const createCampaign = () => {
  // Check if user can create campaigns (GameMaster or Admin role)
  if (authStore.canCreateCampaigns) {
    router.push('/campaigns/create')
  } else {
    // Show upgrade prompt or role change request
    router.push('/upgrade?feature=create-campaigns')
  }
}

const createCharacter = () => {
  router.push('/characters/create')
}

const exploreAI = () => {
  router.push('/ai-tools')
}

const goToProfile = () => {
  router.push('/profile')
}

const goToSubscription = () => {
  router.push('/subscription')
}

const goToSettings = () => {
  router.push('/settings')
}

// Initialize auth on mount
onMounted(async () => {
  try {
    await authStore.initializeAuth()
  } catch (error) {
    console.error('Auth initialization error:', error)
  }
})
</script>

<style scoped>
.min-h-screen {
  min-height: 100vh;
}

/* Custom hover effects */
.hover\:shadow-lg:hover {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  transform: translateY(-2px);
}

.transition-smooth {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Card click cursor */
.v-card:hover {
  cursor: pointer;
}

/* Accessibility improvements */
.v-card:focus-visible {
  outline: 2px solid var(--v-theme-primary);
  outline-offset: 2px;
}

/* Responsive adjustments */
@media (max-width: 960px) {
  .text-h4 {
    font-size: 2rem !important;
  }
  
  .text-h5 {
    font-size: 1.5rem !important;
  }
}
</style>
