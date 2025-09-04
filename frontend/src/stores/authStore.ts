import { create } from 'zustand'
import { persist, subscribeWithSelector } from 'zustand/middleware'
import { User } from '../../../shared/types/user.types'

interface AuthState {
  // State
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  
  // Actions
  setAuth: (user: User, accessToken: string, refreshToken: string) => void
  clearAuth: () => void
  setLoading: (loading: boolean) => void
  updateUser: (updates: Partial<User>) => void
}

export const useAuthStore = create<AuthState>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // Initial state
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
        
        // Actions
        setAuth: (user, accessToken, refreshToken) => {
          set({
            user,
            accessToken,
            refreshToken,
            isAuthenticated: true,
            isLoading: false,
          })
        },
        
        clearAuth: () => {
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
          })
        },
        
        setLoading: (loading) => {
          set({ isLoading: loading })
        },
        
        updateUser: (updates) => {
          const currentUser = get().user
          if (currentUser) {
            set({
              user: { ...currentUser, ...updates }
            })
          }
        },
      }),
      {
        name: 'auth-storage',
        partialize: (state) => ({
          user: state.user,
          accessToken: state.accessToken,
          refreshToken: state.refreshToken,
          isAuthenticated: state.isAuthenticated,
        }),
        version: 1,
        migrate: (persistedState: any, version) => {
          // Handle migration between versions if needed
          if (version === 0) {
            // Migration logic for version 0 -> 1
          }
          return persistedState
        },
      }
    )
  )
)

// Subscribe to auth changes to automatically manage token refresh
useAuthStore.subscribe(
  (state) => state.accessToken,
  (accessToken) => {
    if (accessToken) {
      // Set up automatic token refresh logic
      setupTokenRefresh()
    }
  }
)

// Token refresh setup
let refreshTimer: NodeJS.Timeout | null = null

const setupTokenRefresh = () => {
  // Clear existing timer
  if (refreshTimer) {
    clearTimeout(refreshTimer)
  }
  
  const { accessToken } = useAuthStore.getState()
  
  if (!accessToken) return
  
  try {
    // Decode token to get expiration time
    const payload = JSON.parse(atob(accessToken.split('.')[1]))
    const expirationTime = payload.exp * 1000 // Convert to milliseconds
    const currentTime = Date.now()
    const timeUntilExpiry = expirationTime - currentTime
    
    // Refresh token 5 minutes before expiry
    const refreshTime = Math.max(timeUntilExpiry - (5 * 60 * 1000), 0)
    
    if (refreshTime > 0) {
      refreshTimer = setTimeout(async () => {
        try {
          const { refreshUserToken } = await import('@/services/authService')
          await refreshUserToken()
        } catch (error) {
          console.error('Token refresh failed:', error)
          // Clear auth on refresh failure
          useAuthStore.getState().clearAuth()
        }
      }, refreshTime)
    }
  } catch (error) {
    console.error('Error setting up token refresh:', error)
  }
}

// Clear timer on logout
useAuthStore.subscribe(
  (state) => state.isAuthenticated,
  (isAuthenticated) => {
    if (!isAuthenticated && refreshTimer) {
      clearTimeout(refreshTimer)
      refreshTimer = null
    }
  }
)