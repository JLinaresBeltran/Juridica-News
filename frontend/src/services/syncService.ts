/**
 * 🔄 Servicio de Sincronización Automática
 * 
 * Gestiona la sincronización periódica entre el estado local
 * y el backend, con estrategias de reconexión y manejo de errores.
 */

import { useAuthStore } from '@/stores/authStore'
import { useCurationStore } from '@/stores/curationStore'
import { persistenceValidator } from '@/utils/persistenceValidator'

export interface SyncConfig {
  enabled: boolean
  intervalMs: number
  retryAttempts: number
  retryDelayMs: number
  backgroundSync: boolean
  syncOnFocus: boolean
  syncOnOnline: boolean
}

export interface SyncStatus {
  isActive: boolean
  lastSync: string | null
  nextSync: string | null
  errors: string[]
  successfulSyncs: number
  failedSyncs: number
}

class SyncService {
  private static instance: SyncService
  private syncTimer: NodeJS.Timeout | null = null
  private retryTimer: NodeJS.Timeout | null = null
  private isOnline = navigator.onlineState !== false
  private isDocumentVisible = !document.hidden
  
  private config: SyncConfig = {
    enabled: true,
    intervalMs: 10 * 60 * 1000, // 10 minutos
    retryAttempts: 3,
    retryDelayMs: 30 * 1000, // 30 segundos
    backgroundSync: true,
    syncOnFocus: true,
    syncOnOnline: true
  }

  private status: SyncStatus = {
    isActive: false,
    lastSync: null,
    nextSync: null,
    errors: [],
    successfulSyncs: 0,
    failedSyncs: 0
  }

  private listeners: ((status: SyncStatus) => void)[] = []

  static getInstance(): SyncService {
    if (!SyncService.instance) {
      SyncService.instance = new SyncService()
    }
    return SyncService.instance
  }

  constructor() {
    this.setupEventListeners()
  }

  /**
   * ⚙️ Configurar service de sincronización
   */
  configure(newConfig: Partial<SyncConfig>): void {
    this.config = { ...this.config, ...newConfig }
    
    // Reiniciar si ya está activo
    if (this.status.isActive) {
      this.stop()
      this.start()
    }
    
    console.log('🔧 SyncService configurado:', this.config)
  }

  /**
   * ▶️ Iniciar sincronización automática
   */
  start(): void {
    if (this.status.isActive || !this.config.enabled) return

    this.status.isActive = true
    this.scheduleNextSync()
    
    console.log('🚀 SyncService iniciado')
    this.notifyListeners()
  }

  /**
   * ⏹️ Detener sincronización automática
   */
  stop(): void {
    if (this.syncTimer) {
      clearTimeout(this.syncTimer)
      this.syncTimer = null
    }
    
    if (this.retryTimer) {
      clearTimeout(this.retryTimer)
      this.retryTimer = null
    }

    this.status.isActive = false
    this.status.nextSync = null
    
    console.log('⏹️ SyncService detenido')
    this.notifyListeners()
  }

  /**
   * 🔄 Ejecutar sincronización manual
   */
  async syncNow(): Promise<boolean> {
    console.log('🔄 Iniciando sincronización manual')
    
    try {
      const success = await this.performSync()
      
      if (success) {
        this.status.lastSync = new Date().toISOString()
        this.status.successfulSyncs++
        this.status.errors = []
        console.log('✅ Sincronización manual exitosa')
      } else {
        this.status.failedSyncs++
        console.warn('⚠️ Sincronización manual falló')
      }
      
      this.notifyListeners()
      return success
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido'
      this.status.errors.push(errorMsg)
      this.status.failedSyncs++
      
      console.error('❌ Error en sincronización manual:', error)
      this.notifyListeners()
      return false
    }
  }

  /**
   * 📅 Programar próxima sincronización
   */
  private scheduledNextSync(): void {
    if (!this.status.isActive || !this.config.enabled) return

    // Calcular delay basado en estado de la aplicación
    let delay = this.config.intervalMs

    // Reducir intervalo si hay errores recientes
    if (this.status.errors.length > 0) {
      delay = Math.min(delay, 2 * 60 * 1000) // Máximo 2 minutos si hay errores
    }

    // Aumentar intervalo si está en background
    if (!this.isDocumentVisible && this.config.backgroundSync) {
      delay *= 2 // Duplicar intervalo en background
    }

    // Reducir intervalo si recién volvió online
    if (this.isOnline && this.config.syncOnOnline) {
      delay = Math.min(delay, 30 * 1000) // Sincronizar en 30s si recién volvió online
    }

    this.status.nextSync = new Date(Date.now() + delay).toISOString()

    this.syncTimer = setTimeout(async () => {
      await this.performScheduledSync()
      this.scheduledNextSync() // Programar la siguiente
    }, delay)

    console.log(`⏰ Próxima sincronización programada para: ${this.status.nextSync}`)
    this.notifyListeners()
  }

  /**
   * 📅 Corregir nombre del método
   */
  private scheduleNextSync(): void {
    this.scheduledNextSync()
  }

  /**
   * 🔄 Ejecutar sincronización programada
   */
  private async performScheduledSync(): Promise<void> {
    console.log('⏰ Ejecutando sincronización programada')
    
    try {
      // No sincronizar si no hay conectividad
      if (!this.isOnline) {
        console.log('📴 Sin conexión, saltando sincronización')
        return
      }

      // No sincronizar si no está autenticado
      const authState = useAuthStore.getState()
      if (!authState.isAuthenticated) {
        console.log('🔐 No autenticado, saltando sincronización')
        return
      }

      const success = await this.performSync()
      
      if (success) {
        this.status.lastSync = new Date().toISOString()
        this.status.successfulSyncs++
        this.status.errors = this.status.errors.slice(-2) // Mantener solo últimos 2 errores
        console.log('✅ Sincronización programada exitosa')
      } else {
        this.status.failedSyncs++
        await this.handleSyncFailure('Sincronización programada falló')
      }
      
    } catch (error) {
      console.error('❌ Error en sincronización programada:', error)
      await this.handleSyncFailure(error instanceof Error ? error.message : 'Error desconocido')
    }
    
    this.notifyListeners()
  }

  /**
   * 🔄 Ejecutar proceso de sincronización
   */
  private async performSync(): Promise<boolean> {
    const authState = useAuthStore.getState()
    const curationState = useCurationStore.getState()

    // Verificar que el usuario esté autenticado
    if (!authState.isAuthenticated || !authState.accessToken) {
      console.warn('No se puede sincronizar: usuario no autenticado')
      return false
    }

    try {
      // 1. Sincronizar datos de curación
      await curationState.syncWithBackend()
      
      // 2. Validar integridad después de sync
      const healthReport = await persistenceValidator.validateIntegrity()
      
      if (!healthReport.overall.isHealthy) {
        console.warn('⚠️ Issues de integridad detectados después del sync:', healthReport)
        return false
      }

      return true
    } catch (error) {
      console.error('Error durante sincronización:', error)
      return false
    }
  }

  /**
   * ❌ Manejar fallo de sincronización con retry
   */
  private async handleSyncFailure(errorMessage: string): Promise<void> {
    this.status.errors.push(`${new Date().toISOString()}: ${errorMessage}`)
    
    // Limitar errores almacenados
    if (this.status.errors.length > 10) {
      this.status.errors = this.status.errors.slice(-5)
    }

    // Implementar retry con backoff exponencial
    if (this.status.failedSyncs < this.config.retryAttempts) {
      const retryDelay = this.config.retryDelayMs * Math.pow(2, this.status.failedSyncs - 1)
      
      console.log(`🔄 Reintentando sincronización en ${retryDelay}ms (intento ${this.status.failedSyncs}/${this.config.retryAttempts})`)
      
      this.retryTimer = setTimeout(async () => {
        await this.syncNow()
      }, retryDelay)
    } else {
      console.error(`❌ Máximo de reintentos alcanzado (${this.config.retryAttempts})`)
    }
  }

  /**
   * 👂 Configurar event listeners
   */
  private setupEventListeners(): void {
    // Online/offline detection
    window.addEventListener('online', () => {
      console.log('🌐 Conexión restaurada')
      this.isOnline = true
      
      if (this.config.syncOnOnline && this.status.isActive) {
        // Sincronizar inmediatamente al volver online
        setTimeout(() => this.syncNow(), 1000)
      }
    })

    window.addEventListener('offline', () => {
      console.log('📴 Conexión perdida')
      this.isOnline = false
    })

    // Visibility change detection
    document.addEventListener('visibilitychange', () => {
      const wasVisible = this.isDocumentVisible
      this.isDocumentVisible = !document.hidden
      
      if (!wasVisible && this.isDocumentVisible) {
        console.log('👁️ Aplicación visible nuevamente')
        
        if (this.config.syncOnFocus && this.status.isActive) {
          // Sincronizar después de volver a ser visible
          setTimeout(() => this.syncNow(), 2000)
        }
      }
    })

    // Page unload - intentar sync final
    window.addEventListener('beforeunload', () => {
      if (this.status.isActive) {
        // Sync síncrono de emergencia (limitado por el navegador)
        navigator.sendBeacon && this.performEmergencySync()
      }
    })
  }

  /**
   * 🚨 Sincronización de emergencia al cerrar
   */
  private performEmergencySync(): void {
    try {
      const curationState = useCurationStore.getState()
      const hasUnsyncedChanges = curationState.lastSync === null || 
                                Date.now() - Date.parse(curationState.lastSync) > this.config.intervalMs

      if (hasUnsyncedChanges) {
        console.log('🚨 Intentando sincronización de emergencia')
        // Aquí podrías usar sendBeacon para enviar datos críticos
      }
    } catch (error) {
      console.error('Error en sincronización de emergencia:', error)
    }
  }

  /**
   * 👂 Suscribirse a cambios de estado
   */
  subscribe(listener: (status: SyncStatus) => void): () => void {
    this.listeners.push(listener)
    
    return () => {
      const index = this.listeners.indexOf(listener)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  /**
   * 📢 Notificar listeners sobre cambios
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener({ ...this.status }))
  }

  /**
   * 📊 Obtener estado actual
   */
  getStatus(): SyncStatus {
    return { ...this.status }
  }

  /**
   * ⚙️ Obtener configuración actual
   */
  getConfig(): SyncConfig {
    return { ...this.config }
  }
}

// ✅ Exportar instancia singleton
export const syncService = SyncService.getInstance()

// ✅ Auto-inicializar en producción
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
  // Inicializar después de que la app se haya cargado
  setTimeout(() => {
    syncService.start()
  }, 5000) // 5 segundos de delay para permitir que todo se inicialice
}