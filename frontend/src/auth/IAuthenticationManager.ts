import { User } from '../../../shared/types/user.types'

/**
 * Interfaz para gestión de autenticación
 *
 * PRINCIPIO BLACK BOX:
 * - JWT, OAuth2, Session: todas son estrategias intercambiables
 * - El API client solo conoce la interfaz
 */

export type { User }

export class AuthenticationError extends Error {
  public cause?: Error

  constructor(message: string, cause?: Error) {
    super(message)
    this.name = 'AuthenticationError'
    this.cause = cause
  }
}

export class SessionExpiredError extends AuthenticationError {
  constructor() {
    super('Session has expired')
    this.name = 'SessionExpiredError'
  }
}

export interface IAuthenticationManager {
  /**
   * Obtener headers de autenticación
   *
   * @returns Headers HTTP con credenciales
   */
  getAuthHeaders(): Promise<Record<string, string>>

  /**
   * Manejar respuesta 401 (no autorizado)
   *
   * @returns true si se recuperó la sesión, false si debe hacer logout
   */
  handleUnauthorized(): Promise<boolean>

  /**
   * Refrescar credenciales
   *
   * @throws AuthenticationError si falla el refresh
   */
  refreshCredentials(): Promise<void>

  /**
   * Limpiar sesión
   */
  clearSession(): void

  /**
   * Verificar si está autenticado
   *
   * @returns true si hay sesión válida
   */
  isAuthenticated(): boolean

  /**
   * Obtener información del usuario actual
   *
   * @returns Usuario autenticado o null
   */
  getCurrentUser(): Promise<User | null>
}
