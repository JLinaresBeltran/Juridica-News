/**
 * 🔄 Hook para Gestión de Sincronización
 * 
 * Proporciona una interfaz React para gestionar la sincronización
 * automática y manual entre frontend y backend.
 */

import { useState, useEffect, useCallback } from 'react'
import { syncService, SyncStatus, SyncConfig } from '@/services/syncService'

interface UseSyncReturn {
  status: SyncStatus
  config: SyncConfig
  actions: {
    start: () => void
    stop: () => void
    syncNow: () => Promise<boolean>
    configure: (config: Partial<SyncConfig>) => void
  }
  computed: {
    isHealthy: boolean
    lastSyncAgo: string
    nextSyncIn: string
    successRate: number
  }
}

/**
 * ✅ Hook principal para gestión de sincronización
 */
export const useSync = (): UseSyncReturn => {
  const [status, setStatus] = useState<SyncStatus>(syncService.getStatus())
  const [config, setConfig] = useState<SyncConfig>(syncService.getConfig())

  // ✅ Suscribirse a cambios de estado del servicio
  useEffect(() => {
    const unsubscribe = syncService.subscribe((newStatus) => {
      setStatus(newStatus)
    })

    return unsubscribe
  }, [])

  // ✅ Actions
  const start = useCallback(() => {
    syncService.start()
  }, [])

  const stop = useCallback(() => {
    syncService.stop()
  }, [])

  const syncNow = useCallback(async (): Promise<boolean> => {
    return await syncService.syncNow()
  }, [])

  const configure = useCallback((newConfig: Partial<SyncConfig>) => {
    syncService.configure(newConfig)
    setConfig(syncService.getConfig())
  }, [])

  // ✅ Computed values
  const computed = {
    isHealthy: status.errors.length === 0,
    
    lastSyncAgo: status.lastSync 
      ? formatTimeAgo(status.lastSync)
      : 'Nunca',
    
    nextSyncIn: status.nextSync && status.isActive
      ? formatTimeUntil(status.nextSync)
      : 'No programado',
    
    successRate: status.successfulSyncs + status.failedSyncs > 0
      ? Math.round((status.successfulSyncs / (status.successfulSyncs + status.failedSyncs)) * 100)
      : 100
  }

  return {
    status,
    config,
    actions: {
      start,
      stop,
      syncNow,
      configure
    },
    computed
  }
}

/**
 * 🚨 Hook simplificado para alertas de sincronización
 */
export const useSyncAlerts = () => {
  const { status, computed } = useSync()
  
  return {
    hasErrors: status.errors.length > 0,
    isOutOfSync: status.lastSync === null || 
                 (Date.now() - Date.parse(status.lastSync)) > (15 * 60 * 1000), // 15 min
    lowSuccessRate: computed.successRate < 80,
    errors: status.errors,
    isHealthy: computed.isHealthy && computed.successRate >= 80
  }
}

/**
 * ⚙️ Hook para configuración avanzada de sincronización
 */
export const useSyncConfig = () => {
  const { config, actions } = useSync()
  
  const presets = {
    // Configuración conservadora (para conexiones lentas)
    conservative: {
      intervalMs: 15 * 60 * 1000, // 15 minutos
      retryAttempts: 5,
      retryDelayMs: 60 * 1000, // 1 minuto
      backgroundSync: false,
    },
    
    // Configuración balanceada (por defecto)
    balanced: {
      intervalMs: 10 * 60 * 1000, // 10 minutos
      retryAttempts: 3,
      retryDelayMs: 30 * 1000, // 30 segundos
      backgroundSync: true,
    },
    
    // Configuración agresiva (para uso intensivo)
    aggressive: {
      intervalMs: 5 * 60 * 1000, // 5 minutos
      retryAttempts: 2,
      retryDelayMs: 15 * 1000, // 15 segundos
      backgroundSync: true,
    }
  }

  const applyPreset = useCallback((preset: keyof typeof presets) => {
    actions.configure(presets[preset])
  }, [actions])

  return {
    config,
    presets,
    applyPreset,
    configure: actions.configure
  }
}

/**
 * 🎛️ Hook para panel de control de sincronización
 */
export const useSyncDashboard = () => {
  const { status, config, actions, computed } = useSync()
  const [autoStart, setAutoStart] = useState(config.enabled)

  // Auto-start service si está habilitado
  useEffect(() => {
    if (autoStart && !status.isActive) {
      actions.start()
    } else if (!autoStart && status.isActive) {
      actions.stop()
    }
  }, [autoStart, status.isActive, actions])

  const toggleAutoStart = useCallback(() => {
    setAutoStart(prev => !prev)
  }, [])

  // Estadísticas computadas
  const stats = {
    totalOperations: status.successfulSyncs + status.failedSyncs,
    averageInterval: config.intervalMs / (1000 * 60), // en minutos
    uptime: status.isActive ? formatTimeSince(status.lastSync || new Date().toISOString()) : '0m',
    healthScore: computed.successRate
  }

  return {
    status,
    config,
    actions,
    computed,
    stats,
    autoStart,
    toggleAutoStart,
    
    // Quick actions
    quickSync: actions.syncNow,
    toggleSync: status.isActive ? actions.stop : actions.start,
  }
}

// ✅ Utility functions
function formatTimeAgo(timestamp: string): string {
  const diff = Date.now() - Date.parse(timestamp)
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  
  if (days > 0) return `${days}d`
  if (hours > 0) return `${hours}h`
  if (minutes > 0) return `${minutes}m`
  return 'Ahora'
}

function formatTimeUntil(timestamp: string): string {
  const diff = Date.parse(timestamp) - Date.now()
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(minutes / 60)
  
  if (diff <= 0) return 'Pendiente'
  if (hours > 0) return `${hours}h ${minutes % 60}m`
  return `${minutes}m`
}

function formatTimeSince(timestamp: string): string {
  const diff = Date.now() - Date.parse(timestamp)
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  
  if (days > 0) return `${days}d ${hours % 24}h`
  if (hours > 0) return `${hours}h ${minutes % 60}m`
  return `${minutes}m`
}