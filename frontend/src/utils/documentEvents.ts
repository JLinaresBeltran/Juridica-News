/**
 * Event Emitter para notificaciones de cambios en documentos
 * Permite comunicación entre componentes sin dependencias directas
 */

type DocumentEventType =
  | 'document:approved'
  | 'document:rejected'
  | 'document:ready'
  | 'document:published'
  | 'document:updated'

type Callback = () => void

class DocumentEventEmitter {
  private listeners: Map<DocumentEventType, Set<Callback>> = new Map()

  /**
   * Suscribirse a un evento
   */
  on(event: DocumentEventType, callback: Callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(callback)
  }

  /**
   * Desuscribirse de un evento
   */
  off(event: DocumentEventType, callback: Callback) {
    this.listeners.get(event)?.delete(callback)
  }

  /**
   * Emitir un evento (llamar a todos los listeners)
   */
  emit(event: DocumentEventType) {
    const callbacks = this.listeners.get(event)
    console.debug(`📡 DocumentEvent emitted: ${event}, listeners: ${callbacks?.size || 0}`)
    if (callbacks) {
      callbacks.forEach(cb => {
        try {
          cb()
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error)
        }
      })
    }
  }

  /**
   * Limpiar todos los listeners de un evento
   */
  clear(event?: DocumentEventType) {
    if (event) {
      this.listeners.delete(event)
    } else {
      this.listeners.clear()
    }
  }
}

// Instancia singleton global
export const documentEvents = new DocumentEventEmitter()
