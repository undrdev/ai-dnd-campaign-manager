import { defineStore } from 'pinia'

export interface User {
  id: string
  email: string
  username: string
  firstName: string
  lastName: string
  role: 'Player' | 'GameMaster' | 'Admin'
  subscriptionTier: 'Free' | 'Premium' | 'Pro'
  isActive: boolean
  emailConfirmed: boolean
  createdAt: string
  lastLoginAt?: string
}

export interface AuthState {
  user: User | null
  token: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

export interface LoginCredentials {
  email: string
  password: string
  rememberMe?: boolean
}

export interface RegisterData {
  email: string
  password: string
  confirmPassword: string
  firstName: string
  lastName: string
  acceptTerms: boolean
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    token: null,
    refreshToken: null,
    isAuthenticated: false,
    isLoading: false,
    error: null
  }),

  getters: {
    isLoggedIn: (state): boolean => {
      return state.isAuthenticated && !!state.token && !!state.user
    },
    
    userRole: (state): string | null => {
      return state.user?.role || null
    },
    
    subscriptionTier: (state): string | null => {
      return state.user?.subscriptionTier || null
    },
    
    isGameMaster: (state): boolean => {
      return state.user?.role === 'GameMaster' || state.user?.role === 'Admin'
    },
    
    isAdmin: (state): boolean => {
      return state.user?.role === 'Admin'
    },
    
    canCreateCampaigns: (state): boolean => {
      return state.user?.role === 'GameMaster' || state.user?.role === 'Admin'
    },
    
    hasPremiumAccess: (state): boolean => {
      return state.user?.subscriptionTier === 'Premium' || state.user?.subscriptionTier === 'Pro'
    },
    
    hasProAccess: (state): boolean => {
      return state.user?.subscriptionTier === 'Pro'
    },
    
    fullName: (state): string => {
      if (!state.user) return ''
      return `${state.user.firstName} ${state.user.lastName}`.trim()
    }
  },

  actions: {
    async login(credentials: LoginCredentials) {
      this.isLoading = true
      this.error = null
      
      try {
        const config = useRuntimeConfig()
        const response = await $fetch<{
          success: boolean
          message: string
          accessToken?: string
          refreshToken?: string
          user?: User
        }>('/api/auth/login', {
          baseURL: config.public.apiBaseUrl,
          method: 'POST',
          body: credentials
        })

        if (response.success && response.accessToken && response.user) {
          this.token = response.accessToken
          this.refreshToken = response.refreshToken || null
          this.user = response.user
          this.isAuthenticated = true
          
          // Store tokens in cookies for persistence
          const tokenCookie = useCookie<string | null>('auth-token', {
            default: () => null,
            maxAge: 60 * 60 * 24 * 7, // 7 days
            secure: true,
            sameSite: 'strict'
          })
          
          const refreshTokenCookie = useCookie<string | null>('refresh-token', {
            default: () => null,
            maxAge: 60 * 60 * 24 * 7, // 7 days
            secure: true,
            sameSite: 'strict'
          })
          
          tokenCookie.value = this.token
          refreshTokenCookie.value = this.refreshToken
          
          return { success: true, message: response.message }
        } else {
          throw new Error(response.message || 'Login failed')
        }
      } catch (error: any) {
        this.error = error.message || 'An error occurred during login'
        return { success: false, message: this.error }
      } finally {
        this.isLoading = false
      }
    },

    async register(userData: RegisterData) {
      this.isLoading = true
      this.error = null
      
      try {
        const config = useRuntimeConfig()
        const response = await $fetch<{
          success: boolean
          message: string
          user?: User
        }>('/api/auth/register', {
          baseURL: config.public.apiBaseUrl,
          method: 'POST',
          body: userData
        })

        if (response.success) {
          return { success: true, message: response.message }
        } else {
          throw new Error(response.message || 'Registration failed')
        }
      } catch (error: any) {
        this.error = error.message || 'An error occurred during registration'
        return { success: false, message: this.error }
      } finally {
        this.isLoading = false
      }
    },

    async logout() {
      try {
        if (this.refreshToken) {
          const config = useRuntimeConfig()
          await $fetch('/api/auth/logout', {
            baseURL: config.public.apiBaseUrl,
            method: 'POST',
            headers: {
              Authorization: `Bearer ${this.token}`
            },
            body: {
              refreshToken: this.refreshToken
            }
          })
        }
      } catch (error) {
        console.warn('Error during logout:', error)
      } finally {
        // Clear state regardless of API call success
        this.user = null
        this.token = null
        this.refreshToken = null
        this.isAuthenticated = false
        this.error = null
        
        // Clear cookies
        const tokenCookie = useCookie<string | null>('auth-token')
        const refreshTokenCookie = useCookie<string | null>('refresh-token')
        tokenCookie.value = null
        refreshTokenCookie.value = null
        
        // Redirect to home page
        await navigateTo('/')
      }
    },

    async refreshAccessToken() {
      if (!this.refreshToken) {
        throw new Error('No refresh token available')
      }
      
      try {
        const config = useRuntimeConfig()
        const response = await $fetch<{
          success: boolean
          accessToken?: string
          refreshToken?: string
          user?: User
        }>('/api/auth/refresh-token', {
          baseURL: config.public.apiBaseUrl,
          method: 'POST',
          body: {
            refreshToken: this.refreshToken
          }
        })

        if (response.success && response.accessToken) {
          this.token = response.accessToken
          this.refreshToken = response.refreshToken || this.refreshToken
          
          if (response.user) {
            this.user = response.user
          }
          
          // Update cookies
          const tokenCookie = useCookie<string | null>('auth-token')
          const refreshTokenCookie = useCookie<string | null>('refresh-token')
          tokenCookie.value = this.token
          refreshTokenCookie.value = this.refreshToken
          
          return true
        } else {
          throw new Error('Token refresh failed')
        }
      } catch (error) {
        // If refresh fails, logout user
        await this.logout()
        throw error
      }
    },

    async initializeAuth() {
      // Check for stored tokens on app initialization
      const tokenCookie = useCookie<string | null>('auth-token')
      const refreshTokenCookie = useCookie<string | null>('refresh-token')
      
      if (tokenCookie.value && refreshTokenCookie.value) {
        this.token = tokenCookie.value
        this.refreshToken = refreshTokenCookie.value
        
        try {
          // Try to get user profile with current token
          const config = useRuntimeConfig()
          const userData = await $fetch<User>('/api/auth/profile', {
            baseURL: config.public.apiBaseUrl,
            headers: {
              Authorization: `Bearer ${this.token}`
            }
          })
          
          this.user = userData
          this.isAuthenticated = true
        } catch (error) {
          // Token might be expired, try to refresh
          try {
            await this.refreshAccessToken()
          } catch (refreshError) {
            // Refresh failed, clear everything
            await this.logout()
          }
        }
      }
    },

    clearError() {
      this.error = null
    }
  }
})
