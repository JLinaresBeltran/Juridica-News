import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'

import App from './App.tsx'
import './index.css'

// ✅ FIX: Importar servicios de persistencia
import { persistenceValidator } from './utils/persistenceValidator'
import { syncService } from './services/syncService'

// Create a query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: (failureCount, error: any) => {
        // Don't retry on authentication errors
        if (error?.response?.status === 401) return false
        // Retry up to 2 times for other errors
        return failureCount < 2
      },
    },
    mutations: {
      retry: false,
    },
  },
})

// ✅ FIX: Inicializar servicios de persistencia
const initializePersistenceServices = () => {
  // Inicializar validador de persistencia
  setTimeout(() => {
    persistenceValidator.startAutoValidation()
    console.log('🔍 PersistenceValidator iniciado')
  }, 2000)

  // Inicializar servicio de sincronización (solo en producción o si se requiere)
  setTimeout(() => {
    if (process.env.NODE_ENV === 'production' || 
        localStorage.getItem('enable-sync') === 'true') {
      syncService.start()
      console.log('🔄 SyncService iniciado')
    }
  }, 5000)
}

// Inicializar servicios después de que React se monte
initializePersistenceServices()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter future={{
      v7_startTransition: true,
      v7_relativeSplatPath: true
    }}>
      <QueryClientProvider client={queryClient}>
        <App />
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#ffffff',
              color: '#1e293b',
              border: '1px solid #e2e8f0',
              borderRadius: '0.5rem',
              boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#ffffff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#ffffff',
              },
            },
          }}
        />
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>,
)