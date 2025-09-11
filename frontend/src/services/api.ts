import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios'
import { toast } from 'react-hot-toast'
import { useAuthStore } from '@/stores/authStore'

// API configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'

// Create axios instance
export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 segundos para operaciones de IA
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor - Add auth token
api.interceptors.request.use(
  (config) => {
    const { accessToken } = useAuthStore.getState()
    
    // Log all requests for debugging
    console.log('🌐 API REQUEST:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      fullUrl: `${config.baseURL}${config.url}`,
      hasAuth: !!accessToken,
      data: config.data
    })
    
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`
    }
    
    return config
  },
  (error) => {
    console.error('🚨 API REQUEST ERROR:', error)
    return Promise.reject(error)
  }
)

// Response interceptor - Handle errors and token refresh
api.interceptors.response.use(
  (response) => {
    return response
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean }
    
    // Handle 401 errors (unauthorized)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      
      const { refreshToken, clearAuth } = useAuthStore.getState()
      
      if (refreshToken) {
        try {
          // Try to refresh token
          const { refreshUserToken } = await import('./authService')
          await refreshUserToken()
          
          // Retry original request with new token
          const { accessToken } = useAuthStore.getState()
          if (accessToken && originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`
            return api(originalRequest)
          }
        } catch (refreshError) {
          // Refresh failed, clear auth and redirect to login
          clearAuth()
          
          // Only show toast if not already on login page
          if (!window.location.pathname.includes('/login')) {
            toast.error('Your session has expired. Please log in again.')
            window.location.href = '/login'
          }
          
          return Promise.reject(refreshError)
        }
      } else {
        // No refresh token, clear auth
        clearAuth()
        
        if (!window.location.pathname.includes('/login')) {
          toast.error('Please log in to continue.')
          window.location.href = '/login'
        }
      }
    }
    
    // Handle other HTTP errors
    if (error.response) {
      const errorMessage = error.response.data?.message || error.response.data?.error
      
      switch (error.response.status) {
        case 400:
          if (errorMessage) {
            toast.error(errorMessage)
          }
          break
        case 403:
          toast.error('You don\'t have permission to perform this action.')
          break
        case 404:
          toast.error('The requested resource was not found.')
          break
        case 409:
          if (errorMessage) {
            toast.error(errorMessage)
          }
          break
        case 429:
          toast.error('Too many requests. Please try again later.')
          break
        case 500:
        case 502:
        case 503:
        case 504:
          toast.error('Server error. Please try again later.')
          break
        default:
          if (errorMessage) {
            toast.error(errorMessage)
          } else {
            toast.error('An unexpected error occurred.')
          }
      }
    } else if (error.request) {
      // Network error
      toast.error('Network error. Please check your connection.')
    } else {
      // Other error
      toast.error('An unexpected error occurred.')
    }
    
    return Promise.reject(error)
  }
)

// API helper functions
export const apiHelpers = {
  /**
   * Handle API errors consistently
   */
  handleError: (error: any) => {
    console.error('API Error:', error)
    
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message)
    }
    
    if (error.message) {
      throw new Error(error.message)
    }
    
    throw new Error('An unexpected error occurred')
  },

  /**
   * Create URL with query parameters
   */
  createUrl: (endpoint: string, params?: Record<string, any>): string => {
    if (!params) return endpoint
    
    const searchParams = new URLSearchParams()
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(v => searchParams.append(key, String(v)))
        } else {
          searchParams.append(key, String(value))
        }
      }
    })
    
    const queryString = searchParams.toString()
    return queryString ? `${endpoint}?${queryString}` : endpoint
  },

  /**
   * Upload file with progress
   */
  uploadFile: async (
    endpoint: string, 
    file: File, 
    additionalData?: Record<string, any>,
    onProgress?: (progress: number) => void
  ) => {
    const formData = new FormData()
    formData.append('file', file)
    
    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value)
      })
    }
    
    return api.post(endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onProgress(progress)
        }
      },
    })
  },
}

export default api