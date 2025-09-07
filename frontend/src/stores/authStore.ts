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
          // ✅ FIX: Incluir isLoading para persistencia completa
          isLoading: state.isLoading,
        }),
        version: 2, // ✅ Increment version for migration
        migrate: (persistedState: any, version) => {
          // Handle migration between versions
          if (version === 0 || version === 1) {
            // Migration logic for version 0/1 -> 2
            return {
              ...persistedState,
              isLoading: false, // Default value for new field
            }
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
    // ✅ FIX: Validar formato del token antes de decodificar
    const tokenParts = accessToken.split('.')
    if (tokenParts.length !== 3) {
      console.error('Invalid JWT token format')
      useAuthStore.getState().clearAuth()
      return
    }

    // ✅ FIX: Decodificación segura con manejo de errores
    let payload: any
    try {
      const base64Payload = tokenParts[1]
      // Agregar padding si es necesario para base64
      const paddedPayload = base64Payload + '='.repeat((4 - base64Payload.length % 4) % 4)
      payload = JSON.parse(atob(paddedPayload))
    } catch (decodeError) {
      console.error('Failed to decode JWT token:', decodeError)
      useAuthStore.getState().clearAuth()
      return
    }

    // ✅ FIX: Validar campos requeridos del payload
    if (!payload.exp || typeof payload.exp !== 'number') {
      console.error('Invalid JWT token: missing or invalid exp field')
      useAuthStore.getState().clearAuth()
      return
    }

    const expirationTime = payload.exp * 1000 // Convert to milliseconds
    const currentTime = Date.now()
    const timeUntilExpiry = expirationTime - currentTime
    
    // ✅ FIX: Verificar si el token ya expiró
    if (timeUntilExpiry <= 0) {
      console.warn('JWT token already expired, clearing auth')
      useAuthStore.getState().clearAuth()
      return
    }
    
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
    } else {
      // Si falta menos de 5 minutos, intentar refresh inmediatamente
      setTimeout(async () => {
        try {
          const { refreshUserToken } = await import('@/services/authService')
          await refreshUserToken()
        } catch (error) {
          console.error('Immediate token refresh failed:', error)
          useAuthStore.getState().clearAuth()
        }
      }, 1000) // Esperar 1 segundo para evitar loops
    }
  } catch (error) {
    console.error('Error setting up token refresh:', error)
    // En caso de error crítico, limpiar autenticación
    useAuthStore.getState().clearAuth()
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