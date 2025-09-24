/**
 * Role-based middleware to restrict access based on user roles
 * Usage: Add definePageMeta({ middleware: ['auth', 'role'], meta: { requiredRole: 'GameMaster' } })
 */
export default defineNuxtRouteMiddleware((to) => {
  const authStore = useAuthStore()
  
  // First check if user is authenticated (this middleware should run after auth middleware)
  if (!authStore.isAuthenticated || !authStore.user) {
    return navigateTo(`/auth/login?redirect=${encodeURIComponent(to.fullPath)}`)
  }
  
  // Get required role from page meta
  const requiredRole = to.meta?.requiredRole as string
  
  if (!requiredRole) {
    // No specific role required, allow access
    return
  }
  
  const userRole = authStore.user.role
  
  // Define role hierarchy (higher index = higher permissions)
  const roleHierarchy = ['Player', 'GameMaster', 'Admin']
  const userRoleIndex = roleHierarchy.indexOf(userRole)
  const requiredRoleIndex = roleHierarchy.indexOf(requiredRole)
  
  // Check if user has sufficient role
  if (userRoleIndex < requiredRoleIndex) {
    // User doesn't have required role, redirect to unauthorized page
    throw createError({
      statusCode: 403,
      statusMessage: `Access denied. ${requiredRole} role required.`
    })
  }
  
  // User has sufficient role, allow access
  return
})
