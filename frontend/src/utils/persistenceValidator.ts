/**
 * 🔧 Middleware de Validación de Integridad para Persistencia
 * 
 * Valida consistencia entre datos locales y backend,
 * detecta corrupciones y proporciona auto-recuperación.
 */

import { useAuthStore } from '@/stores/authStore'
import { useAppStore } from '@/stores/appStore'
import { useCurationStore } from '@/stores/curationStore'
import { api } from '@/services/api'

interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  timestamp: string
}

interface IntegrityReport {
  auth: ValidationResult
  app: ValidationResult
  curation: ValidationResult
  overall: {
    isHealthy: boolean
    criticalIssues: number
    warningCount: number
    lastCheck: string
  }
}

export class PersistenceValidator {
  private static instance: PersistenceValidator
  private checkInterval: NodeJS.Timeout | null = null
  private readonly CHECK_INTERVAL_MS = 30 * 60 * 1000 // 30 minutos - Reducido para evitar interrupciones
  
  static getInstance(): PersistenceValidator {
    if (!PersistenceValidator.instance) {
      PersistenceValidator.instance = new PersistenceValidator()
    }
    return PersistenceValidator.instance
  }

  /**
   * ✅ Inicializar validador automático
   */
  startAutoValidation(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
    }

    this.checkInterval = setInterval(async () => {
      try {
        const report = await this.validateIntegrity()
        
        if (!report.overall.isHealthy) {
          console.warn('🚨 Persistencia: Issues detectados', report)
          this.handleIntegrityIssues(report)
        } else {
          console.log('✅ Persistencia: Estado saludable', report.overall)
        }
      } catch (error) {
        console.error('Error en validación automática:', error)
      }
    }, this.CHECK_INTERVAL_MS)

    console.log('🔍 PersistenceValidator: Auto-validación iniciada')
  }

  /**
   * ⛔ Detener validación automática
   */
  stopAutoValidation(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }
    console.log('⛔ PersistenceValidator: Auto-validación detenida')
  }

  /**
   * 🔍 Validar integridad completa del sistema
   */
  async validateIntegrity(): Promise<IntegrityReport> {
    const timestamp = new Date().toISOString()
    
    try {
      const [authResult, appResult, curationResult] = await Promise.all([
        this.validateAuthStore(),
        this.validateAppStore(),
        this.validateCurationStore(),
      ])

      const criticalIssues = [authResult, appResult, curationResult]
        .filter(result => !result.isValid).length

      const warningCount = [authResult, appResult, curationResult]
        .reduce((sum, result) => sum + result.warnings.length, 0)

      return {
        auth: authResult,
        app: appResult,
        curation: curationResult,
        overall: {
          isHealthy: criticalIssues === 0,
          criticalIssues,
          warningCount,
          lastCheck: timestamp
        }
      }
    } catch (error) {
      console.error('Error validando integridad:', error)
      throw error
    }
  }

  /**
   * 🔐 Validar AuthStore
   */
  private async validateAuthStore(): Promise<ValidationResult> {
    const errors: string[] = []
    const warnings: string[] = []
    const state = useAuthStore.getState()

    try {
      // ✅ Validar consistencia de tokens
      if (state.isAuthenticated && !state.accessToken) {
        errors.push('Usuario autenticado pero sin token de acceso')
      }

      if (state.accessToken && !state.refreshToken) {
        warnings.push('Token de acceso presente pero falta refresh token')
      }

      if (state.accessToken && !state.user) {
        errors.push('Token presente pero datos de usuario ausentes')
      }

      // ✅ Validar formato del token
      if (state.accessToken) {
        try {
          const tokenParts = state.accessToken.split('.')
          if (tokenParts.length !== 3) {
            errors.push('Formato de JWT inválido')
          } else {
            // Validar expiración
            const payload = JSON.parse(atob(tokenParts[1]))
            if (payload.exp && payload.exp * 1000 < Date.now()) {
              warnings.push('Token de acceso expirado')
            }
          }
        } catch {
          errors.push('Token JWT corrupto')
        }
      }

      // ✅ Validar sincronización con backend si hay token
      if (state.accessToken && state.isAuthenticated) {
        try {
          await api.get('/auth/profile')
        } catch (error) {
          errors.push('Token inválido según backend')
        }
      }

    } catch (error) {
      errors.push(`Error validando auth: ${error instanceof Error ? error.message : 'Unknown'}`)
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      timestamp: new Date().toISOString()
    }
  }

  /**
   * 🎨 Validar AppStore
   */
  private async validateAppStore(): Promise<ValidationResult> {
    const errors: string[] = []
    const warnings: string[] = []
    const state = useAppStore.getState()

    try {
      // ✅ Validar estructura de preferencias
      const { uiPreferences, editorState } = state

      if (!uiPreferences.theme || !['light', 'dark', 'system'].includes(uiPreferences.theme)) {
        errors.push('Tema de UI inválido')
      }

      if (uiPreferences.splitViewRatio < 0.1 || uiPreferences.splitViewRatio > 0.9) {
        warnings.push('Ratio de split view fuera de rango recomendado')
      }

      // ✅ Validar consistencia del editor
      if (editorState.activeArticleId && !editorState.openArticles.includes(editorState.activeArticleId)) {
        errors.push('Artículo activo no está en la lista de artículos abiertos')
      }

      if (editorState.openArticles.length > 10) {
        warnings.push('Muchos artículos abiertos - puede afectar rendimiento')
      }

      // ✅ Validar valores numéricos
      if (editorState.pdfZoomLevel < 0.1 || editorState.pdfZoomLevel > 5) {
        warnings.push('Nivel de zoom PDF fuera de rango')
      }

    } catch (error) {
      errors.push(`Error validando app: ${error instanceof Error ? error.message : 'Unknown'}`)
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      timestamp: new Date().toISOString()
    }
  }

  /**
   * 📋 Validar CurationStore
   */
  private async validateCurationStore(): Promise<ValidationResult> {
    const errors: string[] = []
    const warnings: string[] = []
    const state = useCurationStore.getState()

    try {
      // ✅ Validar que no haya duplicados entre arrays
      const allDocIds = [
        ...state.approvedDocuments.map(d => d.id),
        ...state.rejectedDocuments.map(d => d.id),
        ...state.readyDocuments.map(d => d.id),
        ...state.publishedDocuments.map(d => d.id),
      ]

      const uniqueIds = new Set(allDocIds)
      if (allDocIds.length !== uniqueIds.size) {
        errors.push('Documentos duplicados entre estados diferentes')
      }

      // ✅ Validar timestamps
      const allDocs = [
        ...state.approvedDocuments,
        ...state.rejectedDocuments,
        ...state.readyDocuments,
        ...state.publishedDocuments,
      ]

      for (const doc of allDocs) {
        if (!doc.id || !doc.title) {
          errors.push(`Documento con campos requeridos faltantes: ${doc.id}`)
        }

        if (!doc.extractionDate || isNaN(Date.parse(doc.extractionDate))) {
          warnings.push(`Fecha de extracción inválida para documento: ${doc.id}`)
        }
      }

      // ✅ Validar sincronización reciente
      if (state.lastSync) {
        const lastSyncTime = Date.parse(state.lastSync)
        const hoursSinceSync = (Date.now() - lastSyncTime) / (1000 * 60 * 60)
        
        if (hoursSinceSync > 24) {
          warnings.push('Sincronización con backend antigua (>24h)')
        }
      } else {
        warnings.push('Nunca se ha sincronizado con backend')
      }

      // ✅ Detectar errores de sincronización persistentes
      if (state.syncError) {
        errors.push(`Error de sincronización activo: ${state.syncError}`)
      }

    } catch (error) {
      errors.push(`Error validando curación: ${error instanceof Error ? error.message : 'Unknown'}`)
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      timestamp: new Date().toISOString()
    }
  }

  /**
   * 🛠️ Manejar issues de integridad detectados
   */
  private async handleIntegrityIssues(report: IntegrityReport): Promise<void> {
    console.group('🛠️ Manejando issues de integridad')
    
    // ✅ Auto-resolver issues críticos de AuthStore
    if (!report.auth.isValid) {
      console.warn('Resolviendo issues de autenticación...')
      for (const error of report.auth.errors) {
        if (error.includes('Token JWT corrupto') || error.includes('Token inválido según backend')) {
          console.log('Limpiando autenticación corrupta')
          useAuthStore.getState().clearAuth()
          break
        }
      }
    }

    // ✅ Auto-resolver issues de AppStore
    if (!report.app.isValid) {
      console.warn('Resolviendo issues de aplicación...')
      const appState = useAppStore.getState()
      
      for (const error of report.app.errors) {
        if (error.includes('Artículo activo no está en la lista')) {
          console.log('Corrigiendo inconsistencia de artículo activo')
          appState.updateEditorState({ activeArticleId: null })
        }
        
        if (error.includes('Tema de UI inválido')) {
          console.log('Restaurando tema por defecto')
          appState.updateUIPreferences({ theme: 'system' })
        }
      }
    }

    // ✅ Auto-resolver issues de CurationStore
    if (!report.curation.isValid) {
      console.warn('Resolviendo issues de curación...')
      const curationState = useCurationStore.getState()
      
      for (const error of report.curation.errors) {
        if (error.includes('Error de sincronización activo')) {
          console.log('Intentando re-sincronización automática')
          try {
            await curationState.syncWithBackend()
          } catch (syncError) {
            console.error('Re-sincronización falló:', syncError)
          }
        }
      }
    }

    console.groupEnd()
  }

  /**
   * 🧹 Limpiar datos corruptos
   */
  async cleanupCorruptedData(): Promise<void> {
    console.log('🧹 Iniciando limpieza de datos corruptos...')
    
    try {
      // Validar y limpiar localStorage
      const storageKeys = ['auth-storage', 'app-storage', 'curation-storage']
      
      for (const key of storageKeys) {
        try {
          const data = localStorage.getItem(key)
          if (data) {
            JSON.parse(data) // Validar que es JSON válido
          }
        } catch {
          console.warn(`Removiendo datos corruptos de ${key}`)
          localStorage.removeItem(key)
        }
      }
      
      console.log('✅ Limpieza completada')
    } catch (error) {
      console.error('Error durante limpieza:', error)
    }
  }

  /**
   * 📊 Generar reporte de salud del sistema
   */
  async generateHealthReport(): Promise<IntegrityReport> {
    const report = await this.validateIntegrity()
    
    console.group('📊 Reporte de Salud del Sistema de Persistencia')
    console.log(`Estado General: ${report.overall.isHealthy ? '✅ Saludable' : '⚠️ Con Issues'}`)
    console.log(`Issues Críticos: ${report.overall.criticalIssues}`)
    console.log(`Advertencias: ${report.overall.warningCount}`)
    console.log(`Última Verificación: ${report.overall.lastCheck}`)
    
    if (!report.auth.isValid) {
      console.warn('🔐 Auth Issues:', report.auth.errors)
    }
    if (!report.app.isValid) {
      console.warn('🎨 App Issues:', report.app.errors) 
    }
    if (!report.curation.isValid) {
      console.warn('📋 Curation Issues:', report.curation.errors)
    }
    
    console.groupEnd()
    
    return report
  }
}

// ✅ Exportar instancia singleton
export const persistenceValidator = PersistenceValidator.getInstance()

// ✅ Auto-inicializar en desarrollo
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // Inicializar después de un pequeño delay para permitir que los stores se carguen
  setTimeout(() => {
    persistenceValidator.startAutoValidation()
  }, 2000)
}