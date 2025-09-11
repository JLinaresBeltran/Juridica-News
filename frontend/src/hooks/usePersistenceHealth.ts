/**
 * 🩺 Hook para Monitoreo de Salud de Persistencia
 * 
 * Proporciona una interfaz React para monitorear y gestionar
 * la integridad de los datos persistentes del sistema.
 */

import { useState, useEffect, useCallback } from 'react'
import { persistenceValidator } from '@/utils/persistenceValidator'

interface HealthStatus {
  isHealthy: boolean
  isChecking: boolean
  lastCheck: string | null
  criticalIssues: number
  warningCount: number
  errors: string[]
  warnings: string[]
}

interface PersistenceHealthActions {
  checkHealth: () => Promise<void>
  forceSync: () => Promise<void>
  cleanupData: () => Promise<void>
  startAutoCheck: () => void
  stopAutoCheck: () => void
}

export interface UsePersistenceHealthReturn {
  health: HealthStatus
  actions: PersistenceHealthActions
}

/**
 * ✅ Hook principal para gestión de salud de persistencia
 */
export const usePersistenceHealth = (): UsePersistenceHealthReturn => {
  const [health, setHealth] = useState<HealthStatus>({
    isHealthy: true,
    isChecking: false,
    lastCheck: null,
    criticalIssues: 0,
    warningCount: 0,
    errors: [],
    warnings: []
  })

  /**
   * 🔍 Verificar salud del sistema
   */
  const checkHealth = useCallback(async () => {
    setHealth(prev => ({ ...prev, isChecking: true }))
    
    try {
      const report = await persistenceValidator.validateIntegrity()
      
      const allErrors: string[] = [
        ...report.auth.errors,
        ...report.app.errors,
        ...report.curation.errors
      ]
      
      const allWarnings: string[] = [
        ...report.auth.warnings,
        ...report.app.warnings,
        ...report.curation.warnings
      ]

      setHealth({
        isHealthy: report.overall.isHealthy,
        isChecking: false,
        lastCheck: report.overall.lastCheck,
        criticalIssues: report.overall.criticalIssues,
        warningCount: report.overall.warningCount,
        errors: allErrors,
        warnings: allWarnings
      })
    } catch (error) {
      console.error('Error checking persistence health:', error)
      setHealth(prev => ({
        ...prev,
        isChecking: false,
        errors: ['Error verificando salud del sistema']
      }))
    }
  }, [])

  /**
   * 🔄 Forzar sincronización completa
   */
  const forceSync = useCallback(async () => {
    setHealth(prev => ({ ...prev, isChecking: true }))
    
    try {
      // Importar stores dinámicamente para evitar dependencias circulares
      const { useCurationStore } = await import('@/stores/curationStore')
      const curationState = useCurationStore.getState()
      
      // Forzar sincronización
      await curationState.syncWithBackend()
      
      // Verificar salud después de sincronizar
      await checkHealth()
    } catch (error) {
      console.error('Error during force sync:', error)
      setHealth(prev => ({
        ...prev,
        isChecking: false,
        errors: [...prev.errors, 'Error sincronizando con backend']
      }))
    }
  }, [checkHealth])

  /**
   * 🧹 Limpiar datos corruptos
   */
  const cleanupData = useCallback(async () => {
    setHealth(prev => ({ ...prev, isChecking: true }))
    
    try {
      await persistenceValidator.cleanupCorruptedData()
      await checkHealth()
    } catch (error) {
      console.error('Error during cleanup:', error)
      setHealth(prev => ({
        ...prev,
        isChecking: false,
        errors: [...prev.errors, 'Error limpiando datos']
      }))
    }
  }, [checkHealth])

  /**
   * ▶️ Iniciar verificación automática
   */
  const startAutoCheck = useCallback(() => {
    persistenceValidator.startAutoValidation()
  }, [])

  /**
   * ⏹️ Detener verificación automática
   */
  const stopAutoCheck = useCallback(() => {
    persistenceValidator.stopAutoValidation()
  }, [])

  // ✅ Verificación inicial al montar el hook
  useEffect(() => {
    checkHealth()
  }, [checkHealth])

  // ✅ Configurar listeners para cambios en stores (opcional)
  useEffect(() => {
    // Aquí podrías agregar listeners a los stores para verificar salud
    // cuando cambien, pero puede ser demasiado intensivo.
    // Por ahora dejamos la verificación manual y automática por timer.
    
    return () => {
      // Cleanup si es necesario
    }
  }, [])

  return {
    health,
    actions: {
      checkHealth,
      forceSync,
      cleanupData,
      startAutoCheck,
      stopAutoCheck
    }
  }
}

/**
 * 🚨 Hook simplificado para componentes que solo necesitan alertas
 */
export const usePersistenceAlerts = () => {
  const { health } = usePersistenceHealth()
  
  return {
    hasErrors: health.errors.length > 0,
    hasWarnings: health.warnings.length > 0,
    criticalIssues: health.criticalIssues,
    isHealthy: health.isHealthy,
    errors: health.errors,
    warnings: health.warnings
  }
}

/**
 * 📊 Hook para dashboard de salud del sistema
 */
export const usePersistenceDashboard = () => {
  const { health, actions } = usePersistenceHealth()
  const [autoRefresh, setAutoRefresh] = useState(false)

  // Auto-refresh ELIMINADO - Solo verificación manual para evitar interrupciones
  // useEffect(() => {
  //   if (!autoRefresh) return
  //   const interval = setInterval(() => {
  //     actions.checkHealth()
  //   }, 30000)
  //   return () => clearInterval(interval)
  // }, [autoRefresh, actions])

  const toggleAutoRefresh = useCallback(() => {
    setAutoRefresh(prev => !prev)
  }, [])

  return {
    health,
    actions,
    autoRefresh,
    toggleAutoRefresh,
    
    // Stats computados
    healthPercentage: health.criticalIssues === 0 ? 100 : 
                     Math.max(0, 100 - (health.criticalIssues * 25) - (health.warningCount * 5)),
    
    statusText: health.isHealthy ? 'Sistema Saludable' :
                health.criticalIssues > 0 ? 'Issues Críticos Detectados' :
                'Advertencias Menores',
    
    statusColor: health.isHealthy ? 'green' :
                 health.criticalIssues > 0 ? 'red' : 'yellow'
  }
}