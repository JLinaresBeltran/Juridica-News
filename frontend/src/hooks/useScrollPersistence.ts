import { useRef, useCallback, useEffect } from 'react'

interface ScrollPersistenceOptions {
  key?: string
  debounceMs?: number
}

export const useScrollPersistence = (options: ScrollPersistenceOptions = {}) => {
  const { key = 'default', debounceMs = 100 } = options
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const savedScrollPosition = useRef<number>(0)
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null)
  const isRestoring = useRef<boolean>(false)
  const restoreTimeout = useRef<NodeJS.Timeout | null>(null)
  const frozenScrollPosition = useRef<number | null>(null)

  // Función para congelar la posición de scroll (usada durante operaciones críticas)
  const freezeScrollPosition = useCallback((position: number) => {
    frozenScrollPosition.current = position
    savedScrollPosition.current = position
    
    // Descongelar después de 3 segundos
    setTimeout(() => {
      frozenScrollPosition.current = null
    }, 3000)
  }, [])

  // Guardar posición de scroll (buscar el contenedor scrolleable real)
  const saveScrollPosition = useCallback(() => {
    // Si hay una posición congelada, no sobrescribir
    if (frozenScrollPosition.current !== null) {
      return
    }
    
    // Si estamos en proceso de restauración, ignorar los eventos de scroll temporalmente
    if (isRestoring.current) {
      return
    }
    
    let scrollY = 0
    
    // Buscar el contenedor scrolleable real
    const mainContainer = document.querySelector('main > div.h-full.overflow-auto')
    if (mainContainer) {
      scrollY = mainContainer.scrollTop
    } else {
      // Fallback a window scroll
      scrollY = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0
    }
    
    savedScrollPosition.current = scrollY
    
    // Opcional: guardar en sessionStorage para persistencia entre recargas
    try {
      sessionStorage.setItem(`scroll_position_${key}`, savedScrollPosition.current.toString())
    } catch (error) {
      // Ignorar errores de storage
    }
  }, [key])

  // Restaurar posición de scroll con retry automático y espera por renderizado completo
  const restoreScrollPosition = useCallback(() => {
    if (savedScrollPosition.current > 0) {
      const position = savedScrollPosition.current
      
      // Activar flag de restauración para ignorar eventos de scroll temporalmente
      isRestoring.current = true
      
      // Limpiar timeout anterior si existe
      if (restoreTimeout.current) {
        clearTimeout(restoreTimeout.current)
      }
      
      // Programar desactivación del flag después de que termine la restauración
      restoreTimeout.current = setTimeout(() => {
        isRestoring.current = false
      }, 2000) // 2 segundos para asegurar que todas las restauraciones terminen
      
      // Función que espera a que el contenido esté completamente renderizado
      const waitForContent = (callback: () => void, maxAttempts = 20) => {
        let attempts = 0
        const checkContent = () => {
          attempts++
          const mainContainer = document.querySelector('main > div.h-full.overflow-auto') as HTMLElement
          const hasContent = mainContainer && mainContainer.scrollHeight > mainContainer.clientHeight
          
          if (hasContent || attempts >= maxAttempts) {
            callback()
          } else {
            setTimeout(checkContent, 50)
          }
        }
        checkContent()
      }
      
      // Función para intentar restaurar con retry
      const attemptRestore = (attempt = 1) => {
        if (attempt > 10) {
          return
        }
        
        // Buscar el contenedor scrolleable real
        const mainContainer = document.querySelector('main > div.h-full.overflow-auto') as HTMLElement
        if (mainContainer) {
          mainContainer.scrollTop = position
          
          // Verificar si el scroll se aplicó correctamente después de un delay
          setTimeout(() => {
            const actualPosition = mainContainer.scrollTop
            const difference = Math.abs(actualPosition - position)
            
            if (difference > 20 && attempt < 10) {
              setTimeout(() => attemptRestore(attempt + 1), 200)
            }
          }, 100)
        } else {
          // Fallback a window scroll
          window.scrollTo(0, position)
        }
      }
      
      // Esperar a que el contenido esté renderizado antes de restaurar
      waitForContent(() => {
        attemptRestore()
      })
    }
  }, [])

  // Restaurar desde sessionStorage al montar
  const restoreFromSessionStorage = useCallback(() => {
    try {
      const saved = sessionStorage.getItem(`scroll_position_${key}`)
      if (saved) {
        const position = parseInt(saved, 10)
        savedScrollPosition.current = position
        restoreScrollPosition()
      }
    } catch (error) {
      // Ignorar errores de storage
    }
  }, [key, restoreScrollPosition])

  // Manejar scroll con debounce
  const handleScroll = useCallback(() => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current)
    }
    
    debounceTimeout.current = setTimeout(() => {
      saveScrollPosition()
    }, debounceMs)
  }, [saveScrollPosition, debounceMs])

  // Limpiar timeouts al desmontar
  useEffect(() => {
    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current)
      }
      if (restoreTimeout.current) {
        clearTimeout(restoreTimeout.current)
      }
    }
  }, [])

  // Hook para usar antes de operaciones que pueden afectar el scroll
  const preserveScroll = useCallback(async (operation: () => Promise<void> | void) => {
    saveScrollPosition()
    
    try {
      await operation()
    } finally {
      // Restaurar después de que React haya re-renderizado con múltiples intentos
      setTimeout(restoreScrollPosition, 100)
      setTimeout(restoreScrollPosition, 300)
      setTimeout(restoreScrollPosition, 500)
    }
  }, [saveScrollPosition, restoreScrollPosition])

  // Función específica para forzar guardado cuando sea necesario - con sistema de congelación
  const forceScrollSave = useCallback(() => {
    let currentPosition = 0
    
    // Buscar el contenedor scrolleable real
    const mainContainer = document.querySelector('main > div.h-full.overflow-auto') as HTMLElement
    if (mainContainer) {
      currentPosition = mainContainer.scrollTop
    } else {
      // Fallback a window scroll
      currentPosition = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0
    }
    
    // Usar el sistema de congelación para proteger la posición
    freezeScrollPosition(currentPosition)
    
    try {
      sessionStorage.setItem(`scroll_position_${key}`, currentPosition.toString())
    } catch (error) {
      // Ignorar errores de storage
    }
  }, [key, freezeScrollPosition])

  return {
    scrollContainerRef,
    saveScrollPosition,
    restoreScrollPosition,
    restoreFromSessionStorage,
    handleScroll,
    preserveScroll,
    forceScrollSave,
    freezeScrollPosition
  }
}