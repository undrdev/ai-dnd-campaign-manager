<template>
  <VNavigationDrawer
    :model-value="modelValue"
    :permanent="permanent"
    :rail="rail"
    :width="width"
    :rail-width="railWidth"
    location="left"
    class="app-sidebar"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <!-- Sidebar Header -->
    <div class="app-sidebar__header pa-4">
      <div v-if="!rail" class="d-flex align-center justify-space-between">
        <div class="d-flex align-center">
          <VIcon icon="mdi-dice-d20" size="32" color="primary" class="mr-3" />
          <div>
            <h2 class="text-h6 font-weight-bold">{{ title }}</h2>
            <p v-if="subtitle" class="text-caption text-neutral-600 mb-0">
              {{ subtitle }}
            </p>
          </div>
        </div>
        
        <VBtn
          v-if="collapsible"
          icon
          variant="text"
          size="small"
          @click="toggleRail"
        >
          <VIcon icon="mdi-chevron-left" />
        </VBtn>
      </div>
      
      <div v-else class="text-center">
        <VBtn
          v-if="collapsible"
          icon
          variant="text"
          color="primary"
          @click="toggleRail"
        >
          <VIcon icon="mdi-dice-d20" />
        </VBtn>
      </div>
    </div>

    <VDivider />

    <!-- Quick Actions (when expanded) -->
    <div v-if="!rail && quickActions.length > 0" class="pa-4">
      <h3 class="text-body-2 font-weight-bold text-uppercase text-neutral-500 mb-3">
        Quick Actions
      </h3>
      <div class="d-flex flex-column gap-2">
        <VBtn
          v-for="action in quickActions"
          :key="action.text"
          :color="action.color || 'primary'"
          :variant="action.variant || 'tonal'"
          :prepend-icon="action.icon"
          size="small"
          block
          @click="action.handler"
        >
          {{ action.text }}
        </VBtn>
      </div>
    </div>

    <!-- Navigation Menu -->
    <VList 
      :density="rail ? 'compact' : 'default'" 
      class="app-sidebar__nav"
    >
      <!-- Main Navigation Items -->
      <template v-for="item in filteredNavItems" :key="item.path">
        <!-- Regular Item -->
        <VListItem
          v-if="!item.children"
          :prepend-icon="item.icon"
          :title="item.label"
          :value="item.path"
          :active="isActiveRoute(item.path)"
          :class="{ 'v-list-item--active': isActiveRoute(item.path) }"
          @click="navigateTo(item.path)"
        >
          <template #append>
            <VChip
              v-if="item.badge && !rail"
              :color="item.badgeColor || 'primary'"
              size="small"
              variant="tonal"
            >
              {{ item.badge }}
            </VChip>
          </template>
        </VListItem>
        
        <!-- Group with Children -->
        <VListGroup
          v-else
          :value="item.path"
          :prepend-icon="item.icon"
        >
          <template #activator="{ props }">
            <VListItem
              v-bind="props"
              :title="item.label"
            >
              <template #append>
                <VChip
                  v-if="item.badge && !rail"
                  :color="item.badgeColor || 'primary'"
                  size="small"
                  variant="tonal"
                >
                  {{ item.badge }}
                </VChip>
              </template>
            </VListItem>
          </template>
          
          <VListItem
            v-for="child in item.children"
            :key="child.path"
            :prepend-icon="child.icon"
            :title="child.label"
            :value="child.path"
            :active="isActiveRoute(child.path)"
            @click="navigateTo(child.path)"
          >
            <template #append>
              <VChip
                v-if="child.badge && !rail"
                :color="child.badgeColor || 'primary'"
                size="small"
                variant="tonal"
              >
                {{ child.badge }}
              </VChip>
            </template>
          </VListItem>
        </VListGroup>
      </template>
    </VList>

    <!-- Footer Actions -->
    <template #append>
      <div class="app-sidebar__footer pa-4">
        <VDivider class="mb-4" />
        
        <!-- User Info (when expanded) -->
        <div v-if="!rail && authStore.user" class="mb-4">
          <div class="d-flex align-center">
            <VAvatar size="32" :color="avatarColor" class="mr-3">
              <span class="text-body-2 font-weight-bold">
                {{ userInitials }}
              </span>
            </VAvatar>
            <div class="flex-grow-1">
              <p class="text-body-2 font-weight-medium mb-0">
                {{ userFullName }}
              </p>
              <p class="text-caption text-neutral-600 mb-0">
                {{ authStore.user.role }}
              </p>
            </div>
          </div>
        </div>
        
        <!-- Footer Actions -->
        <div class="d-flex flex-column gap-2">
          <VBtn
            v-if="!rail"
            variant="outlined"
            size="small"
            prepend-icon="mdi-help-circle"
            block
            @click="navigateToHelp"
          >
            Help & Support
          </VBtn>
          
          <VBtn
            v-if="rail"
            icon
            variant="text"
            size="small"
            @click="navigateToHelp"
          >
            <VIcon icon="mdi-help-circle" />
          </VBtn>
        </div>
      </div>
    </template>
  </VNavigationDrawer>
</template>

<script setup lang="ts">
interface SidebarAction {
  text: string
  icon: string
  handler: () => void
  color?: string
  variant?: 'flat' | 'tonal' | 'outlined' | 'text'
}

interface NavigationItem {
  path: string
  label: string
  icon: string
  badge?: string
  badgeColor?: string
  roles?: string[]
  subscriptionTiers?: string[]
  children?: NavigationItem[]
  exact?: boolean
}

interface Props {
  modelValue: boolean
  permanent?: boolean
  rail?: boolean
  collapsible?: boolean
  width?: number
  railWidth?: number
  title?: string
  subtitle?: string
  quickActions?: SidebarAction[]
}

const props = withDefaults(defineProps<Props>(), {
  permanent: false,
  rail: false,
  collapsible: true,
  width: 280,
  railWidth: 72,
  title: 'D&D Campaign Manager',
  quickActions: () => []
})

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'update:rail': [value: boolean]
}>()

// Store and router
const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

// Sidebar navigation items
const navigationItems: NavigationItem[] = [
  {
    path: '/dashboard',
    label: 'Dashboard',
    icon: 'mdi-view-dashboard',
    exact: true
  },
  {
    path: '/campaigns',
    label: 'Campaigns',
    icon: 'mdi-castle',
    roles: ['GameMaster', 'Admin'],
    badge: '3',
    children: [
      {
        path: '/campaigns/active',
        label: 'Active Campaigns',
        icon: 'mdi-play-circle',
        badge: '2',
        badgeColor: 'success'
      },
      {
        path: '/campaigns/archived',
        label: 'Archived',
        icon: 'mdi-archive'
      },
      {
        path: '/campaigns/templates',
        label: 'Templates',
        icon: 'mdi-content-copy'
      }
    ]
  },
  {
    path: '/characters',
    label: 'Characters',
    icon: 'mdi-account-group',
    badge: '5',
    children: [
      {
        path: '/characters/active',
        label: 'Active Characters',
        icon: 'mdi-account-check',
        badge: '3',
        badgeColor: 'success'
      },
      {
        path: '/characters/retired',
        label: 'Retired',
        icon: 'mdi-account-off'
      },
      {
        path: '/characters/templates',
        label: 'Templates',
        icon: 'mdi-content-copy'
      }
    ]
  },
  {
    path: '/ai-tools',
    label: 'AI Tools',
    icon: 'mdi-brain',
    subscriptionTiers: ['Premium', 'Pro'],
    badge: 'Pro',
    badgeColor: 'warning',
    children: [
      {
        path: '/ai-tools/npc-generator',
        label: 'NPC Generator',
        icon: 'mdi-account-plus'
      },
      {
        path: '/ai-tools/world-builder',
        label: 'World Builder',
        icon: 'mdi-earth'
      },
      {
        path: '/ai-tools/quest-generator',
        label: 'Quest Generator',
        icon: 'mdi-map-marker-path'
      }
    ]
  },
  {
    path: '/library',
    label: 'Content Library',
    icon: 'mdi-book-open-page-variant',
    children: [
      {
        path: '/library/spells',
        label: 'Spells',
        icon: 'mdi-auto-fix'
      },
      {
        path: '/library/items',
        label: 'Items',
        icon: 'mdi-sword'
      },
      {
        path: '/library/monsters',
        label: 'Monsters',
        icon: 'mdi-ghost'
      }
    ]
  },
  {
    path: '/sessions',
    label: 'Game Sessions',
    icon: 'mdi-calendar-clock',
    children: [
      {
        path: '/sessions/upcoming',
        label: 'Upcoming',
        icon: 'mdi-calendar-plus',
        badge: '2',
        badgeColor: 'info'
      },
      {
        path: '/sessions/history',
        label: 'Session History',
        icon: 'mdi-history'
      }
    ]
  },
  {
    path: '/analytics',
    label: 'Analytics',
    icon: 'mdi-chart-line',
    subscriptionTiers: ['Pro'],
    roles: ['GameMaster', 'Admin']
  }
]

// Computed properties
const filteredNavItems = computed(() => {
  return navigationItems.filter(item => {
    // Check role requirements
    if (item.roles && item.roles.length > 0) {
      const userRole = authStore.user?.role
      if (!userRole || !item.roles.includes(userRole)) {
        return false
      }
    }

    // Check subscription tier requirements
    if (item.subscriptionTiers && item.subscriptionTiers.length > 0) {
      const userTier = authStore.user?.subscriptionTier
      if (!userTier || !item.subscriptionTiers.includes(userTier)) {
        return false
      }
    }

    return true
  })
})

const userFullName = computed(() => {
  if (!authStore.user) return 'User'
  return `${authStore.user.firstName} ${authStore.user.lastName}`.trim() || 'User'
})

const userInitials = computed(() => {
  if (!authStore.user) return 'U'
  const first = authStore.user.firstName?.charAt(0).toUpperCase() || ''
  const last = authStore.user.lastName?.charAt(0).toUpperCase() || ''
  return `${first}${last}` || 'U'
})

const avatarColor = computed(() => {
  const colors = ['primary', 'secondary', 'success', 'info', 'warning']
  const index = (authStore.user?.firstName?.charCodeAt(0) || 0) % colors.length
  return colors[index]
})

// Methods
const navigateTo = (path: string) => {
  if (route.path !== path) {
    router.push(path)
  }
  
  // Close sidebar on mobile after navigation
  if (!props.permanent) {
    emit('update:modelValue', false)
  }
}

const isActiveRoute = (path: string) => {
  const currentPath = route.path
  return path === '/dashboard' 
    ? currentPath === path 
    : currentPath.startsWith(path)
}

const toggleRail = () => {
  emit('update:rail', !props.rail)
}

const navigateToHelp = () => {
  navigateTo('/help')
}
</script>

<style scoped>
.app-sidebar {
  border-right: 1px solid rgba(0, 0, 0, 0.12);
}

.app-sidebar__header {
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.app-sidebar__nav {
  flex: 1;
  overflow-y: auto;
}

.app-sidebar__footer {
  border-top: 1px solid rgba(0, 0, 0, 0.08);
}

.gap-2 {
  gap: 0.5rem;
}

/* Navigation item styling */
:deep(.v-list-item) {
  border-radius: 8px;
  margin: 2px 12px;
}

:deep(.v-list-item:hover) {
  background-color: rgba(0, 0, 0, 0.04);
}

:deep(.v-list-item--active) {
  background-color: rgba(var(--v-theme-primary-rgb), 0.08);
  color: var(--v-theme-primary);
}

:deep(.v-list-item--active .v-icon) {
  color: var(--v-theme-primary);
}

:deep(.v-list-item--active .v-list-item-title) {
  color: var(--v-theme-primary);
  font-weight: 600;
}

/* Group styling */
:deep(.v-list-group__items) {
  padding-left: 16px;
}

:deep(.v-list-group__items .v-list-item) {
  margin-left: 24px;
  margin-right: 12px;
}

/* Rail mode adjustments */
:deep(.v-navigation-drawer--rail) {
  .v-list-item {
    justify-content: center;
    margin: 4px 8px;
  }
  
  .v-list-item__prepend {
    margin-inline-end: 0;
  }
}

/* Badge styling */
:deep(.v-chip) {
  font-size: 0.75rem;
  height: 20px;
}

/* Scrollbar styling */
.app-sidebar__nav::-webkit-scrollbar {
  width: 6px;
}

.app-sidebar__nav::-webkit-scrollbar-track {
  background: transparent;
}

.app-sidebar__nav::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
}

.app-sidebar__nav::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.3);
}
</style>
