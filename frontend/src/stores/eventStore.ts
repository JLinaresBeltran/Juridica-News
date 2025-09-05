import { create } from 'zustand'
import React from 'react'

export type EventType = 
  | 'DOCUMENTS_EXTRACTED' 
  | 'DOCUMENT_STATUS_CHANGED' 
  | 'REFRESH_PENDING_COUNT'
  | 'REFRESH_CURATION_LIST'
  | 'REFRESH_DASHBOARD_STATS'

interface EventData {
  timestamp: Date
  source?: string
  details?: any
}

interface EventState {
  subscribers: Map<EventType, Set<(data: EventData) => void>>
  
  // Actions
  subscribe: (eventType: EventType, callback: (data: EventData) => void) => () => void
  emit: (eventType: EventType, data?: Partial<EventData>) => void
  unsubscribe: (eventType: EventType, callback: (data: EventData) => void) => void
}

export const useEventStore = create<EventState>((set, get) => ({
  subscribers: new Map(),
  
  subscribe: (eventType: EventType, callback: (data: EventData) => void) => {
    const { subscribers } = get()
    
    if (!subscribers.has(eventType)) {
      subscribers.set(eventType, new Set())
    }
    
    subscribers.get(eventType)!.add(callback)
    
    // Retornar función de cleanup
    return () => {
      const currentSubscribers = get().subscribers
      const eventSubscribers = currentSubscribers.get(eventType)
      if (eventSubscribers) {
        eventSubscribers.delete(callback)
        if (eventSubscribers.size === 0) {
          currentSubscribers.delete(eventType)
        }
      }
    }
  },
  
  emit: (eventType: EventType, data: Partial<EventData> = {}) => {
    const { subscribers } = get()
    const eventSubscribers = subscribers.get(eventType)
    
    if (eventSubscribers && eventSubscribers.size > 0) {
      const eventData: EventData = {
        timestamp: new Date(),
        ...data
      }
      
      // Notificar a todos los suscriptores
      eventSubscribers.forEach(callback => {
        try {
          callback(eventData)
        } catch (error) {
          console.error(`Error in event callback for ${eventType}:`, error)
        }
      })
      
      console.debug(`🔔 Event emitted: ${eventType}`, eventData)
    }
  },
  
  unsubscribe: (eventType: EventType, callback: (data: EventData) => void) => {
    const { subscribers } = get()
    const eventSubscribers = subscribers.get(eventType)
    
    if (eventSubscribers) {
      eventSubscribers.delete(callback)
      if (eventSubscribers.size === 0) {
        subscribers.delete(eventType)
      }
    }
  }
}))

// Utility hooks para eventos específicos
export const useDocumentsExtractedEvent = (callback: (data: EventData) => void) => {
  const subscribe = useEventStore(state => state.subscribe)
  const unsubscribe = useEventStore(state => state.unsubscribe)
  
  React.useEffect(() => {
    const cleanup = subscribe('DOCUMENTS_EXTRACTED', callback)
    return cleanup
  }, [callback, subscribe])
}

// Helper function para emitir eventos comunes
export const emitDocumentsExtracted = (extractionDetails?: any) => {
  useEventStore.getState().emit('DOCUMENTS_EXTRACTED', {
    source: 'scraping_service',
    details: extractionDetails
  })
}

export const emitRefreshPendingCount = () => {
  useEventStore.getState().emit('REFRESH_PENDING_COUNT')
}

export const emitRefreshCurationList = () => {
  useEventStore.getState().emit('REFRESH_CURATION_LIST')
}

export const emitRefreshDashboardStats = () => {
  useEventStore.getState().emit('REFRESH_DASHBOARD_STATS')
}