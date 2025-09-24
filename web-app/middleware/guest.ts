/**
 * Guest middleware to redirect authenticated users away from auth pages
 * Prevents authenticated users from accessing login, register, etc.
 */
export default defineNuxtRouteMiddleware(() => {
  const authStore = useAuthStore()
  
  // If user is already authenticated, redirect to dashboard
  if (authStore.isAuthenticated) {
    return navigateTo('/dashboard')
  }
  
  // User is not authenticated, allow access to auth pages
  return
})
