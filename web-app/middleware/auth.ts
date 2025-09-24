/**
 * Authentication middleware to protect routes that require user authentication
 * Redirects unauthenticated users to the login page with the intended destination
 */
export default defineNuxtRouteMiddleware((to) => {
  const authStore = useAuthStore()
  
  // Check if user is authenticated
  if (!authStore.isAuthenticated) {
    // Store the intended destination for redirect after login
    const redirectPath = to.fullPath
    
    // Redirect to login with the intended destination as a query parameter
    return navigateTo(`/auth/login?redirect=${encodeURIComponent(redirectPath)}`)
  }
  
  // User is authenticated, allow access
  return
})
