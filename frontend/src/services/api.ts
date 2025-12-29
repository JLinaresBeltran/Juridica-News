import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios'
import { toast } from 'react-hot-toast'
import { IAuthenticationManager } from '@/auth/IAuthenticationManager'
import { jwtAuthManager } from '@/auth/JWTAuthManager'

// API configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'

/**
 * Authentication manager para el API client
 *
 * PRINCIPIO BLACK BOX:
 * - Puede ser JWTAuthManager (producción) o MockAuthManager (testing)
 * - El API client no conoce la implementación, solo la interfaz
 */
let authManager: IAuthenticationManager = jwtAuthManager

/**
 * Configurar el authentication manager (útil para testing)
 */
export const setAuthManager = (manager: IAuthenticationManager): void => {
  authManager = manager
}

/**
 * Obtener el authentication manager actual
 */
export const getAuthManager = (): IAuthenticationManager => {
  return authManager
}

// Create axios instance
export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000, // 2 minutos para operaciones de IA (análisis completo)
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor - Add auth token
api.interceptors.request.use(
  async (config) => {
    // Obtener headers de autenticación desde el manager
    const headers = await authManager.getAuthHeaders()
    Object.assign(config.headers, headers)

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor - Handle errors and token refresh
api.interceptors.response.use(
  (response) => {
    return response
  },
  async (error: AxiosError) => {
    // ✅ Ignorar errores de cancelación (AbortController)
    if (error.name === 'CanceledError' || error.code === 'ERR_CANCELED') {
      return Promise.reject(error)
    }

    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean }

    // Handle 401 errors (unauthorized)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      // Delegar al authentication manager
      const recovered = await authManager.handleUnauthorized()

      if (recovered) {
        // Retry original request with new token
        const headers = await authManager.getAuthHeaders()
        if (originalRequest.headers) {
          Object.assign(originalRequest.headers, headers)
        }
        return api(originalRequest)
      } else {
        // No se pudo recuperar la sesión
        if (!window.location.pathname.includes('/login')) {
          toast.error('Your session has expired. Please log in again.')
        }
        return Promise.reject(error)
      }
    }

    // Handle other HTTP errors
    if (error.response) {
      const errorData = error.response.data as any
      const errorMessage = errorData?.message || errorData?.error

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

// Utility function to convert relative URLs to absolute URLs
export const getImageUrl = (relativeUrl: string): string => {
  if (!relativeUrl) return ''

  // If already absolute URL, return as is
  if (relativeUrl.startsWith('http://') || relativeUrl.startsWith('https://')) {
    return relativeUrl
  }

  // Get base URL without /api suffix for serving static files
  const baseUrl = API_BASE_URL.replace('/api', '')

  // If URL already includes /api/, use it directly with base URL
  if (relativeUrl.startsWith('/api/')) {
    return `${baseUrl}${relativeUrl}`
  }

  // If URL starts with /storage/images/, it's a direct static file path
  if (relativeUrl.startsWith('/storage/images/')) {
    return `${baseUrl}/api${relativeUrl}`
  }

  // For relative filenames only (e.g., "image.jpg"), construct full path
  if (!relativeUrl.startsWith('/')) {
    return `${baseUrl}/api/storage/images/${relativeUrl}`
  }

  // Default: treat as relative URL and append to base
  return `${baseUrl}${relativeUrl}`
}

export default api