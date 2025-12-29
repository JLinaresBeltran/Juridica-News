/**
 * Authentication Adapters - Black Box Architecture
 *
 * Este módulo exporta todas las interfaces e implementaciones de autenticación.
 *
 * PRINCIPIO BLACK BOX:
 * - IAuthenticationManager: Interfaz única para autenticación
 * - JWTAuthManager: Implementación para producción (JWT)
 * - MockAuthManager: Implementación para testing
 *
 * Uso:
 * ```typescript
 * import { jwtAuthManager } from '@/auth'
 * import { setAuthManager } from '@/services/api'
 *
 * // Producción: usar JWTAuthManager (default)
 * const authManager = jwtAuthManager
 *
 * // Testing: usar MockAuthManager
 * import { createMockAuthManager } from '@/auth'
 * setAuthManager(createMockAuthManager.authenticated())
 * ```
 */

// Interfaces y tipos
export type { IAuthenticationManager } from './IAuthenticationManager'
export type { User } from '../../../shared/types/user.types'

export {
  AuthenticationError,
  SessionExpiredError,
} from './IAuthenticationManager'

// Implementación JWT (producción)
export {
  JWTAuthManager,
  jwtAuthManager,
} from './JWTAuthManager'

// Implementación Mock (testing)
export {
  MockAuthManager,
  createMockAuthManager,
  mockUser,
} from './MockAuthManager'

export type { MockAuthConfig } from './MockAuthManager'
