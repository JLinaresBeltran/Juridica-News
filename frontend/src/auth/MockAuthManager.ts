import {
  IAuthenticationManager,
  SessionExpiredError,
} from './IAuthenticationManager'
import { User, UserRole, UserStatus } from '../../../shared/types/user.types'

/**
 * Configuración del MockAuthManager
 */
export interface MockAuthConfig {
  authenticated?: boolean
  token?: string
  user?: User
  failOnRefresh?: boolean
  refreshDelay?: number
  sessionExpired?: boolean
}

/**
 * Implementación mock de autenticación para testing
 *
 * PRINCIPIO BLACK BOX:
 * - Permite testing sin backend real
 * - Simula comportamientos específicos (fallos, delays)
 * - Completamente intercambiable con JWTAuthManager
 */
export class MockAuthManager implements IAuthenticationManager {
  private authenticated: boolean
  private token: string | null
  private user: User | null
  private failOnRefresh: boolean
  private refreshDelay: number
  private sessionExpired: boolean

  constructor(config: MockAuthConfig = {}) {
    this.authenticated = config.authenticated ?? false
    this.token = config.token ?? null
    this.user = config.user ?? null
    this.failOnRefresh = config.failOnRefresh ?? false
    this.refreshDelay = config.refreshDelay ?? 0
    this.sessionExpired = config.sessionExpired ?? false
  }

  /**
   * Obtener headers de autenticación
   */
  async getAuthHeaders(): Promise<Record<string, string>> {
    if (!this.authenticated || !this.token) {
      return {}
    }

    return {
      'Authorization': `Bearer ${this.token}`,
    }
  }

  /**
   * Manejar respuesta 401 (no autorizado)
   */
  async handleUnauthorized(): Promise<boolean> {
    if (this.sessionExpired) {
      this.clearSession()
      return false
    }

    if (this.failOnRefresh) {
      this.clearSession()
      return false
    }

    try {
      await this.refreshCredentials()
      return true
    } catch (error) {
      this.clearSession()
      return false
    }
  }

  /**
   * Refrescar credenciales
   */
  async refreshCredentials(): Promise<void> {
    // Simular delay si está configurado
    if (this.refreshDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.refreshDelay))
    }

    if (this.failOnRefresh) {
      throw new SessionExpiredError()
    }

    if (this.sessionExpired) {
      throw new SessionExpiredError()
    }

    // Simular refresh exitoso
    this.token = `mock-refreshed-token-${Date.now()}`
    this.authenticated = true
  }

  /**
   * Limpiar sesión
   */
  clearSession(): void {
    this.authenticated = false
    this.token = null
    this.user = null
  }

  /**
   * Verificar si está autenticado
   */
  isAuthenticated(): boolean {
    return this.authenticated
  }

  /**
   * Obtener información del usuario actual
   */
  async getCurrentUser(): Promise<User | null> {
    return this.user
  }

  // --- Métodos de testing para simular estados ---

  /**
   * Simular login exitoso
   */
  simulateLogin(user: User, token: string): void {
    this.user = user
    this.token = token
    this.authenticated = true
  }

  /**
   * Simular logout
   */
  simulateLogout(): void {
    this.clearSession()
  }

  /**
   * Simular sesión expirada
   */
  simulateSessionExpired(): void {
    this.sessionExpired = true
  }

  /**
   * Simular fallo en refresh
   */
  simulateRefreshFailure(): void {
    this.failOnRefresh = true
  }

  /**
   * Resetear a configuración inicial
   */
  reset(config: MockAuthConfig = {}): void {
    this.authenticated = config.authenticated ?? false
    this.token = config.token ?? null
    this.user = config.user ?? null
    this.failOnRefresh = config.failOnRefresh ?? false
    this.refreshDelay = config.refreshDelay ?? 0
    this.sessionExpired = config.sessionExpired ?? false
  }
}

/**
 * Mock user por defecto para testing
 */
export const mockUser: User = {
  id: 'mock-user-1',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  role: UserRole.EDITOR,
  status: UserStatus.ACTIVE,
  loginCount: 0,
  articlesCreated: 0,
  articlesPublished: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

/**
 * Factory para crear mocks con configuraciones comunes
 */
export const createMockAuthManager = {
  /**
   * Usuario autenticado
   */
  authenticated: (): MockAuthManager => {
    return new MockAuthManager({
      authenticated: true,
      token: 'mock-token-123',
      user: mockUser,
    })
  },

  /**
   * Usuario no autenticado
   */
  unauthenticated: (): MockAuthManager => {
    return new MockAuthManager({
      authenticated: false,
    })
  },

  /**
   * Sesión expirada
   */
  sessionExpired: (): MockAuthManager => {
    return new MockAuthManager({
      authenticated: true,
      token: 'expired-token',
      user: mockUser,
      sessionExpired: true,
    })
  },

  /**
   * Refresh falla
   */
  refreshFails: (): MockAuthManager => {
    return new MockAuthManager({
      authenticated: true,
      token: 'mock-token',
      user: mockUser,
      failOnRefresh: true,
    })
  },

  /**
   * Refresh con delay
   */
  refreshWithDelay: (delay: number): MockAuthManager => {
    return new MockAuthManager({
      authenticated: true,
      token: 'mock-token',
      user: mockUser,
      refreshDelay: delay,
    })
  },
}
