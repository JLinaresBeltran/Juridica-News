import { api } from './api'
import { useAuthStore } from '@/stores/authStore'
import { 
  LoginRequest, 
  LoginResponse, 
  RegisterRequest,
  UpdateProfileRequest,
  User 
} from '../../../shared/types/user.types'

export const authService = {
  /**
   * Login user
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await api.post<{ data: LoginResponse }>('/auth/login', credentials)
    return response.data.data
  },

  /**
   * Register new user
   */
  async register(userData: RegisterRequest): Promise<LoginResponse> {
    const response = await api.post<{ data: LoginResponse }>('/auth/register', userData)
    return response.data.data
  },

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<LoginResponse> {
    const response = await api.post<{ data: LoginResponse }>('/auth/refresh', {
      refreshToken
    })
    return response.data.data
  },

  /**
   * Get current user profile
   */
  async getProfile(): Promise<User> {
    const response = await api.get<{ data: User }>('/auth/profile')
    return response.data.data
  },

  /**
   * Update user profile
   */
  async updateProfile(updates: UpdateProfileRequest): Promise<User> {
    const response = await api.put<{ data: User }>('/auth/profile', updates)
    return response.data.data
  },

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    await api.post('/auth/logout')
  },
}

/**
 * Login helper that updates auth store
 */
export const loginUser = async (credentials: LoginRequest): Promise<User> => {
  const { setAuth, setLoading } = useAuthStore.getState()
  
  setLoading(true)
  
  try {
    const loginResponse = await authService.login(credentials)
    
    setAuth(
      loginResponse.user,
      loginResponse.accessToken,
      loginResponse.refreshToken
    )
    
    return loginResponse.user
  } catch (error) {
    setLoading(false)
    throw error
  }
}

/**
 * Register helper that updates auth store
 */
export const registerUser = async (userData: RegisterRequest): Promise<User> => {
  const { setAuth, setLoading } = useAuthStore.getState()
  
  setLoading(true)
  
  try {
    const registerResponse = await authService.register(userData)
    
    setAuth(
      registerResponse.user,
      registerResponse.accessToken,
      registerResponse.refreshToken
    )
    
    return registerResponse.user
  } catch (error) {
    setLoading(false)
    throw error
  }
}

/**
 * Refresh token helper
 */
export const refreshUserToken = async (): Promise<void> => {
  const { refreshToken, setAuth, clearAuth } = useAuthStore.getState()
  
  if (!refreshToken) {
    throw new Error('No refresh token available')
  }
  
  try {
    const refreshResponse = await authService.refreshToken(refreshToken)
    
    setAuth(
      refreshResponse.user,
      refreshResponse.accessToken,
      refreshResponse.refreshToken
    )
  } catch (error) {
    // Clear auth on refresh failure
    clearAuth()
    throw error
  }
}

/**
 * Logout helper that clears auth store
 */
export const logoutUser = async (): Promise<void> => {
  const { clearAuth } = useAuthStore.getState()
  
  try {
    await authService.logout()
  } catch (error) {
    // Log error but still clear auth
    console.error('Logout error:', error)
  } finally {
    clearAuth()
  }
}

/**
 * Update profile helper
 */
export const updateUserProfile = async (updates: UpdateProfileRequest): Promise<User> => {
  const { updateUser } = useAuthStore.getState()
  
  try {
    const updatedUser = await authService.updateProfile(updates)
    updateUser(updatedUser)
    return updatedUser
  } catch (error) {
    throw error
  }
}

/**
 * Check if user is authenticated and token is valid
 */
export const checkAuthStatus = async (): Promise<boolean> => {
  const { accessToken, clearAuth } = useAuthStore.getState()
  
  if (!accessToken) {
    return false
  }
  
  try {
    // Verify token by fetching profile
    await authService.getProfile()
    return true
  } catch (error) {
    // Token is invalid, clear auth
    clearAuth()
    return false
  }
}