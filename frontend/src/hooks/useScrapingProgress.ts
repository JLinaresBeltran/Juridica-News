import { useState, useEffect, useRef } from 'react'
import { useAuthStore } from '../stores/authStore'

export interface ScrapingProgressEvent {
  jobId: string
  status: 'started' | 'processing' | 'completed' | 'error'
  message: string
  progress: number
  source?: string
  limit?: number
  documentsFound?: number
  documentsProcessed?: number
  downloadedCount?: number
  extractionTime?: number
  retry?: boolean
  attempt?: number
  maxRetries?: number
  waitTime?: number
  error?: string
}

interface UseScrapingProgressReturn {
  isConnected: boolean
  currentProgress: ScrapingProgressEvent | null
  connectionError: string | null
  clearProgress: () => void
}

export const useScrapingProgress = (): UseScrapingProgressReturn => {
  const [isConnected, setIsConnected] = useState(false)
  const [currentProgress, setCurrentProgress] = useState<ScrapingProgressEvent | null>(null)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  
  const eventSourceRef = useRef<EventSource | null>(null)
  const { token } = useAuthStore()

  const clearProgress = () => {
    setCurrentProgress(null)
  }

  useEffect(() => {
    if (!token) {
      return
    }

    const connectSSE = () => {
      try {
        // Create SSE connection with token in query params since EventSource doesn't support custom headers
        const sseUrl = new URL(`${import.meta.env.VITE_API_URL}/api/events/stream`)
        sseUrl.searchParams.set('token', token)
        
        const eventSource = new EventSource(sseUrl.toString())

        eventSourceRef.current = eventSource

        eventSource.onopen = () => {
          console.log('SSE connection opened')
          setIsConnected(true)
          setConnectionError(null)
        }

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            console.log('SSE message received:', data)
            
            // Handle different event types
            if (event.type === 'scraping_progress' || data.type === 'scraping_progress') {
              setCurrentProgress(data)
            }
          } catch (error) {
            console.warn('Failed to parse SSE message:', error)
          }
        }

        // Handle specific scraping progress events
        eventSource.addEventListener('scraping_progress', (event) => {
          try {
            const data = JSON.parse(event.data)
            console.log('Scraping progress event:', data)
            setCurrentProgress(data)
          } catch (error) {
            console.error('Failed to parse scraping progress event:', error)
          }
        })

        eventSource.addEventListener('connected', (event) => {
          try {
            const data = JSON.parse(event.data)
            console.log('SSE connected:', data)
          } catch (error) {
            console.warn('Failed to parse connected event:', error)
          }
        })

        eventSource.addEventListener('heartbeat', (event) => {
          // Heartbeat events to keep connection alive
          console.debug('SSE heartbeat received')
        })

        eventSource.onerror = (error) => {
          console.error('SSE connection error:', error)
          setIsConnected(false)
          setConnectionError('Error de conexión con el servidor')
          
          // Attempt to reconnect after a delay
          setTimeout(() => {
            if (eventSourceRef.current?.readyState === EventSource.CLOSED) {
              connectSSE()
            }
          }, 5000)
        }

        eventSource.onclose = () => {
          console.log('SSE connection closed')
          setIsConnected(false)
        }

      } catch (error) {
        console.error('Failed to create SSE connection:', error)
        setConnectionError('No se pudo establecer conexión con el servidor')
      }
    }

    connectSSE()

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
      setIsConnected(false)
      setCurrentProgress(null)
    }
  }, [token])

  return {
    isConnected,
    currentProgress,
    connectionError,
    clearProgress
  }
}