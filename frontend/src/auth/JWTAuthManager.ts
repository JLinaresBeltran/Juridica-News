import axios from 'axios'
import { useAuthStore } from '@/stores/authStore'
import {
  IAuthenticationManager,
  AuthenticationError,
  SessionExpiredError,
} from './IAuthenticationManager'
import { LoginResponse, User } from '../../../shared/types/user.types'

/**
 * Implementación de autenticación basada en JWT
 *
 * PRINCIPIO BLACK BOX:
 * - Encapsula toda la lógica de tokens JWT
 * - Gestiona refresh automático
 * - Maneja errores de autenticación
 * - El API client solo conoce la interfaz, no los detalles
 */
export class JWTAuthManager implements IAuthenticationManager {
  private readonly apiBaseUrl: string

  constructor(apiBaseUrl?: string) {
    this.apiBaseUrl = apiBaseUrl || import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'
  }

  /**
   * Obtener headers de autenticación
   */
  async getAuthHeaders(): Promise<Record<string, string>> {
    const { accessToken } = useAuthStore.getState()

    if (!accessToken) {
      return {}
    }

    return {
      'Authorization': `Bearer ${accessToken}`,
    }
  }

  /**
   * Manejar respuesta 401 (no autorizado)
   *
   * @returns true si se recuperó la sesión, false si debe hacer logout
   */
  async handleUnauthorized(): Promise<boolean> {
    const { refreshToken } = useAuthStore.getState()

    if (!refreshToken) {
      this.clearSession()
      return false
    }

    try {
      await this.refreshCredentials()
      return true // Se recuperó la sesión
    } catch (error) {
      console.error('Failed to refresh credentials:', error)
      this.clearSession()
      return false
    }
  }

  /**
   * Refrescar credenciales
   *
   * @throws AuthenticationError si falla el refresh
   */
  async refreshCredentials(): Promise<void> {
    const { refreshToken } = useAuthStore.getState()

    if (!refreshToken) {
      throw new SessionExpiredError()
    }

    try {
      // Llamada directa al backend (sin usar api instance para evitar interceptor loop)
      const response = await axios.post<{ data: LoginResponse }>(
        `${this.apiBaseUrl}/auth/refresh`,
        { refreshToken },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )

      const { user, accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data.data

      const { setAuth } = useAuthStore.getState()
      setAuth(user, newAccessToken, newRefreshToken)
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new SessionExpiredError()
      }
      throw new AuthenticationError(
        'Failed to refresh credentials',
        error
      )
    }
  }

  /**
   * Limpiar sesión
   */
  clearSession(): void {
    const { clearAuth } = useAuthStore.getState()
    clearAuth()

    // Redirect solo si no estamos ya en login
    if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
      window.location.href = '/login'
    }
  }

  /**
   * Verificar si está autenticado
   */
  isAuthenticated(): boolean {
    const { isAuthenticated } = useAuthStore.getState()
    return isAuthenticated
  }

  /**
   * Obtener información del usuario actual
   */
  async getCurrentUser(): Promise<User | null> {
    const { user } = useAuthStore.getState()
    return user
  }
}

/**
 * Singleton instance para uso global
 */
export const jwtAuthManager = new JWTAuthManager()
