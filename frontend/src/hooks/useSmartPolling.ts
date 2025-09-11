import { useCallback, useEffect, useRef, useState } from 'react'

export type PollingTrigger = 
  | 'analyze' 
  | 'preview' 
  | 'approve' 
  | 'reject' 
  | 'navigate'
  | 'windowFocus'
  | 'background'

export interface SmartPollingConfig {
  // Triggers que activan el polling
  eventTriggers: PollingTrigger[]
  
  // Intervalo de polling de respaldo (en ms)
  backgroundInterval: number
  
  // Detectar actividad de lectura para pausar polling
  readingDetection: boolean
  
  // Tiempo de inactividad para considerar "leyendo" (en ms)
  readingThreshold: number
  
  // Refrescar al enfocar ventana
  windowFocusRefresh: boolean
  
  // Función de polling a ejecutar
  pollingFunction: (preserveScroll?: boolean) => Promise<void>
}

export interface SmartPollingState {
  isPolling: boolean
  isReading: boolean
  lastPollTime: Date | null
  triggerCount: number
}

const DEFAULT_CONFIG: Partial<SmartPollingConfig> = {
  eventTriggers: ['analyze', 'preview', 'approve', 'reject', 'navigate', 'windowFocus'],
  backgroundInterval: 10 * 60 * 1000, // 10 minutos
  readingDetection: true,
  readingThreshold: 3 * 1000, // 3 segundos de inactividad = leyendo
  windowFocusRefresh: true
}

export function useSmartPolling(config: SmartPollingConfig) {
  const fullConfig = { ...DEFAULT_CONFIG, ...config } as SmartPollingConfig
  
  // Estados del hook
  const [state, setState] = useState<SmartPollingState>({
    isPolling: false,
    isReading: false,
    lastPollTime: null,
    triggerCount: 0
  })
  
  // Referencias para timers y estado
  const backgroundTimer = useRef<NodeJS.Timeout | null>(null)
  const readingTimer = useRef<NodeJS.Timeout | null>(null)
  const lastMouseMove = useRef<number>(Date.now())
  const isPollingRef = useRef(false)
  
  // Función para ejecutar polling con protección contra duplicados
  const executePoll = useCallback(async (
    trigger: PollingTrigger, 
    preserveScroll = false
  ) => {
    // Evitar polling simultáneo
    if (isPollingRef.current) {
      console.debug('🔄 SmartPolling: Polling ya en progreso, saltando')
      return
    }
    
    try {
      isPollingRef.current = true
      setState(prev => ({ 
        ...prev, 
        isPolling: true, 
        triggerCount: prev.triggerCount + 1 
      }))
      
      console.debug(`🔄 SmartPolling: Ejecutando polling por trigger "${trigger}"`)
      
      await fullConfig.pollingFunction(preserveScroll)
      
      setState(prev => ({ 
        ...prev, 
        lastPollTime: new Date() 
      }))
      
    } catch (error) {
      console.error('❌ SmartPolling: Error en polling:', error)
    } finally {
      isPollingRef.current = false
      setState(prev => ({ ...prev, isPolling: false }))
    }
  }, [fullConfig])
  
  // Detector de actividad de lectura
  const handleMouseMove = useCallback(() => {
    lastMouseMove.current = Date.now()
    
    // Si estaba leyendo, marcar como no leyendo
    if (state.isReading) {
      setState(prev => ({ ...prev, isReading: false }))
    }
    
    // Reiniciar timer de detección de lectura
    if (readingTimer.current) {
      clearTimeout(readingTimer.current)
    }
    
    if (fullConfig.readingDetection) {
      readingTimer.current = setTimeout(() => {
        setState(prev => ({ ...prev, isReading: true }))
        console.debug('📖 SmartPolling: Usuario leyendo - pausando polling background')
      }, fullConfig.readingThreshold)
    }
  }, [state.isReading, fullConfig.readingDetection, fullConfig.readingThreshold])
  
  // Polling de respaldo (solo si no está leyendo)
  const setupBackgroundPolling = useCallback(() => {
    if (backgroundTimer.current) {
      clearInterval(backgroundTimer.current)
    }
    
    backgroundTimer.current = setInterval(() => {
      // No hacer polling si el usuario está leyendo
      if (state.isReading) {
        console.debug('📖 SmartPolling: Saltando polling background - usuario leyendo')
        return
      }
      
      console.debug('⏰ SmartPolling: Ejecutando polling background')
      executePoll('background', true) // Preservar scroll en polling background
    }, fullConfig.backgroundInterval)
  }, [executePoll, fullConfig.backgroundInterval, state.isReading])
  
  // Handler para visibilidad de ventana
  const handleVisibilityChange = useCallback(() => {
    if (document.visibilityState === 'visible' && fullConfig.windowFocusRefresh) {
      // Verificar si han pasado más de 5 minutos desde último poll
      const timeSinceLastPoll = state.lastPollTime 
        ? Date.now() - state.lastPollTime.getTime()
        : Infinity
      
      if (timeSinceLastPoll > 5 * 60 * 1000) { // 5 minutos
        console.debug('👁️ SmartPolling: Ventana enfocada después de inactividad, refrescando')
        executePoll('windowFocus', true)
      }
    }
  }, [executePoll, fullConfig.windowFocusRefresh, state.lastPollTime])
  
  // Función pública para disparar polling por eventos
  const triggerPoll = useCallback((trigger: PollingTrigger, preserveScroll = false) => {
    if (fullConfig.eventTriggers.includes(trigger)) {
      executePoll(trigger, preserveScroll)
    } else {
      console.debug(`🚫 SmartPolling: Trigger "${trigger}" no está habilitado`)
    }
  }, [executePoll, fullConfig.eventTriggers])
  
  // Configurar event listeners y timers
  useEffect(() => {
    // Detector de mouse para lectura
    if (fullConfig.readingDetection) {
      document.addEventListener('mousemove', handleMouseMove, { passive: true })
      document.addEventListener('scroll', handleMouseMove, { passive: true })
    }
    
    // Detector de visibilidad de ventana
    if (fullConfig.windowFocusRefresh) {
      document.addEventListener('visibilitychange', handleVisibilityChange)
    }
    
    // Configurar polling de respaldo
    setupBackgroundPolling()
    
    return () => {
      // Limpiar event listeners
      if (fullConfig.readingDetection) {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('scroll', handleMouseMove)
      }
      
      if (fullConfig.windowFocusRefresh) {
        document.removeEventListener('visibilitychange', handleVisibilityChange)
      }
      
      // Limpiar timers
      if (backgroundTimer.current) {
        clearInterval(backgroundTimer.current)
      }
      if (readingTimer.current) {
        clearTimeout(readingTimer.current)
      }
    }
  }, [
    fullConfig.readingDetection,
    fullConfig.windowFocusRefresh,
    handleMouseMove,
    handleVisibilityChange,
    setupBackgroundPolling
  ])
  
  // Debug info
  useEffect(() => {
    console.debug('🔧 SmartPolling: Configuración activa', {
      triggers: fullConfig.eventTriggers,
      backgroundInterval: `${fullConfig.backgroundInterval / 1000}s`,
      readingDetection: fullConfig.readingDetection,
      windowFocusRefresh: fullConfig.windowFocusRefresh
    })
  }, [fullConfig])
  
  return {
    // Estado del polling
    state,
    
    // Función para disparar polling manualmente
    triggerPoll,
    
    // Utilidades
    isReading: state.isReading,
    isPolling: state.isPolling,
    lastPollTime: state.lastPollTime,
    
    // Stats para debugging
    stats: {
      triggerCount: state.triggerCount,
      timeSinceLastPoll: state.lastPollTime 
        ? Date.now() - state.lastPollTime.getTime()
        : null
    }
  }
}