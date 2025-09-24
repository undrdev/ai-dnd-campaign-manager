/**
 * Subscription-based middleware to restrict access based on subscription tiers
 * Usage: Add definePageMeta({ middleware: ['auth', 'subscription'], meta: { requiredTier: 'Premium' } })
 */
export default defineNuxtRouteMiddleware((to) => {
  const authStore = useAuthStore()
  
  // First check if user is authenticated
  if (!authStore.isAuthenticated || !authStore.user) {
    return navigateTo(`/auth/login?redirect=${encodeURIComponent(to.fullPath)}`)
  }
  
  // Get required subscription tier from page meta
  const requiredTier = to.meta?.requiredTier as string
  
  if (!requiredTier) {
    // No specific tier required, allow access
    return
  }
  
  const userTier = authStore.user.subscriptionTier
  
  // Define tier hierarchy (higher index = higher tier)
  const tierHierarchy = ['Free', 'Premium', 'Pro']
  const userTierIndex = tierHierarchy.indexOf(userTier)
  const requiredTierIndex = tierHierarchy.indexOf(requiredTier)
  
  // Check if user has sufficient subscription tier
  if (userTierIndex < requiredTierIndex) {
    // User doesn't have required tier, redirect to upgrade page
    return navigateTo(`/upgrade?required=${requiredTier}&redirect=${encodeURIComponent(to.fullPath)}`)
  }
  
  // User has sufficient tier, allow access
  return
})
