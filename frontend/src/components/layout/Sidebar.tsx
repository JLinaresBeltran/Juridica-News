import { NavLink, useLocation } from 'react-router-dom'
import { useEffect, useState, useCallback, useRef } from 'react'
import {
  LayoutDashboard,
  Clock,
  CheckCircle,
  Send,
  FileText,
  BarChart3,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { useAppStore } from '@/stores/appStore'
import { useCurationStore } from '@/stores/curationStore'
import { clsx } from 'clsx'
import documentsService from '@/services/documentsService'
import { articlesService } from '@/services/articlesService'
import { documentEvents } from '@/utils/documentEvents' // ✅ Event emitter
import { useAuthStore } from '@/stores/authStore' // ✅ Para SSE connection

interface NavItem {
  id: string
  label: string
  icon: any
  path: string
  count?: number | (() => number)
}

interface NavSection {
  title: string
  items: NavItem[]
}

export function Sidebar() {
  const location = useLocation()
  const { sidebarCollapsed, toggleSidebar } = useAppStore(state => ({
    sidebarCollapsed: state.uiPreferences.sidebarCollapsed,
    toggleSidebar: state.toggleSidebar
  }))

  const { archivedDocuments } = useCurationStore()
  const { accessToken } = useAuthStore() // ✅ Token para SSE
  const eventSourceRef = useRef<EventSource | null>(null) // ✅ Ref para conexión SSE

  // Estados para contadores reales de la API
  const [documentCounts, setDocumentCounts] = useState({
    PENDING: 0,
    APPROVED: 0,
    REJECTED: 0,
    READY: 0,
    PUBLISHED: 0,
    ARCHIVED: 0
  })

  // ✅ Función para cargar contadores desde la API (memoizada para reutilización)
  const loadDocumentCounts = useCallback(async () => {
    console.debug('🔄 Sidebar: Recargando contadores...')
    try {
      // Cargar contadores de cada estado en paralelo
      const [pendingRes, approvedRes, rejectedRes, readyRes, publishedRes] = await Promise.all([
        documentsService.getDocuments({ status: 'PENDING', limit: 1 }),
        documentsService.getDocuments({ status: 'APPROVED', limit: 1 }),
        documentsService.getDocuments({ status: 'REJECTED', limit: 1 }),
        articlesService.getArticles({ status: 'READY', limit: 1 }),
        articlesService.getArticles({ status: 'PUBLISHED', limit: 1 })
      ])

      const newCounts = {
        PENDING: pendingRes.pagination.total,
        APPROVED: approvedRes.pagination.total,
        REJECTED: rejectedRes.pagination.total,
        READY: readyRes.total || 0, // ✅ Real desde API
        PUBLISHED: publishedRes.total || 0, // ✅ Real desde API
        ARCHIVED: archivedDocuments.length // Del store local por ahora
      }

      setDocumentCounts(newCounts)

      console.debug('✅ Sidebar: Contadores actualizados:', newCounts)

    } catch (error) {
      console.error('Error loading document counts:', error)
    }
  }, [archivedDocuments.length])

  // ✅ Cargar contadores iniciales y suscribirse a eventos de cambios
  useEffect(() => {
    // Carga inicial
    loadDocumentCounts()

    // Wrapper para log específico de document:published
    const handlePublished = () => {
      console.debug('📡 Sidebar recibió evento document:published, recargando contadores...')
      loadDocumentCounts()
    }

    // Suscribirse a eventos de cambios en documentos
    documentEvents.on('document:approved', loadDocumentCounts)
    documentEvents.on('document:rejected', loadDocumentCounts)
    documentEvents.on('document:ready', loadDocumentCounts)
    documentEvents.on('document:published', handlePublished)
    documentEvents.on('document:updated', loadDocumentCounts)

    // Cleanup: desuscribirse al desmontar
    return () => {
      documentEvents.off('document:approved', loadDocumentCounts)
      documentEvents.off('document:rejected', loadDocumentCounts)
      documentEvents.off('document:ready', loadDocumentCounts)
      documentEvents.off('document:published', handlePublished)
      documentEvents.off('document:updated', loadDocumentCounts)
    }
  }, [loadDocumentCounts])

  // ✅ Listener SSE para evento 'documents_extracted' desde el backend
  useEffect(() => {
    if (!accessToken) {
      console.debug('⚠️ Sidebar SSE: No hay accessToken, saltando conexión')
      return
    }

    const connectSSE = () => {
      try {
        // Crear conexión SSE con token en query params
        const sseUrl = new URL(`${import.meta.env.VITE_API_URL}/api/events/stream`)
        sseUrl.searchParams.set('token', accessToken)

        console.debug('🔌 Sidebar: Conectando a SSE...', sseUrl.toString())

        const eventSource = new EventSource(sseUrl.toString())
        eventSourceRef.current = eventSource

        // Log cuando se conecta exitosamente
        eventSource.addEventListener('connected', (event) => {
          console.debug('✅ Sidebar SSE: Conectado exitosamente', event.data)
        })

        // Listener específico para 'documents_extracted'
        eventSource.addEventListener('documents_extracted', (event) => {
          try {
            const data = JSON.parse(event.data)
            console.log('📡 SSE Event "documents_extracted" received in Sidebar:', data)

            // Recargar contadores cuando se extraen nuevos documentos
            console.debug('🔄 Sidebar: Recargando contadores por evento documents_extracted...')
            loadDocumentCounts()
          } catch (error) {
            console.error('Error parsing documents_extracted event:', error)
          }
        })

        // Log todos los eventos para debugging
        eventSource.onmessage = (event) => {
          console.debug('📨 Sidebar SSE: Mensaje genérico recibido:', event)
        }

        eventSource.onerror = (error) => {
          console.error('❌ SSE connection error in Sidebar:', error)

          // Intentar reconectar después de un delay
          setTimeout(() => {
            if (eventSourceRef.current?.readyState === EventSource.CLOSED) {
              console.debug('🔄 Sidebar SSE: Intentando reconectar...')
              connectSSE()
            }
          }, 5000)
        }

      } catch (error) {
        console.error('Failed to create SSE connection in Sidebar:', error)
      }
    }

    connectSSE()

    // Cleanup: cerrar conexión SSE al desmontar
    return () => {
      if (eventSourceRef.current) {
        console.debug('🔌 Sidebar SSE: Cerrando conexión')
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
    }
  }, [accessToken, loadDocumentCounts])

  const navigationSections: NavSection[] = [
    {
      title: 'Principal',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
      ]
    },
    {
      title: 'Revisión',
      items: [
        { id: 'pending', label: 'Pendientes', icon: Clock, path: '/curation', count: documentCounts.PENDING },
        { id: 'approved', label: 'Aprobados', icon: CheckCircle, path: '/approved', count: documentCounts.APPROVED },
      ]
    },
    {
      title: 'Editorial',
      items: [
        { id: 'ready', label: 'Listos', icon: Send, path: '/articles?status=ready', count: documentCounts.READY },
        { id: 'published', label: 'Publicados', icon: FileText, path: '/articles?status=published', count: documentCounts.PUBLISHED },
        { id: 'archived', label: 'Archivados', icon: BarChart3, path: '/articles?status=archived', count: documentCounts.ARCHIVED },
      ]
    }
  ]

  // Helper function para determinar si un item está activo
  const isItemActive = (itemPath: string) => {
    const currentFullPath = location.pathname + location.search;
    
    // Casos especiales
    if (itemPath === '/dashboard' && (location.pathname === '/' || location.pathname === '/dashboard')) {
      return true;
    }
    
    // Para rutas con query parameters, comparación exacta
    if (itemPath.includes('?')) {
      return currentFullPath === itemPath;
    }
    
    // Para rutas sin query parameters, solo comparar pathname
    return location.pathname === itemPath && !location.search;
  }

  return (
    <aside 
      className={clsx(
        'fixed left-0 top-16 h-[calc(100vh-4rem)] bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 z-40',
        sidebarCollapsed ? 'w-16' : 'w-[220px]'
      )}
    >
      <div className="flex flex-col h-full">
        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-6 overflow-y-auto">
          {navigationSections.map((section) => (
            <div key={section.title}>
              {!sidebarCollapsed && (
                <h3 className="px-3 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
                  {section.title}
                </h3>
              )}
              
              <div className="space-y-1">
                {section.items.map((item) => (
                  <NavLink
                    key={item.id}
                    to={item.path}
                    className={() => clsx(
                      'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all duration-200',
                      isItemActive(item.path)
                        ? 'bg-[#04315a] text-[#3ff3f2] border-r-2 border-[#3ff3f2]'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-[#04315a] hover:text-[#3ff3f2] hover:border-r-2 hover:border-[#3ff3f2]'
                    )}
                    title={sidebarCollapsed ? item.label : undefined}
                  >
                    <item.icon 
                      className={clsx(
                        'flex-shrink-0 w-5 h-5',
                        sidebarCollapsed ? 'mx-auto' : 'mr-3'
                      )} 
                    />
                    
                    {!sidebarCollapsed && (
                      <>
                        <span className="flex-1">{item.label}</span>
                        {item.count !== undefined && (
                          <span className={clsx(
                            "text-xs px-2 py-0.5 rounded-full transition-all duration-200",
                            isItemActive(item.path)
                              ? "bg-[#3ff3f2] text-[#04315a]"
                              : "bg-gray-100 text-gray-600 group-hover:bg-[#3ff3f2] group-hover:text-[#04315a]"
                          )}>
                            {typeof item.count === 'function' ? item.count() : item.count}
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Toggle Button */}
        <div className="p-2 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={toggleSidebar}
            className="w-full p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
            title={sidebarCollapsed ? 'Expandir sidebar' : 'Contraer sidebar'}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-5 h-5 mx-auto" />
            ) : (
              <ChevronLeft className="w-5 h-5 mx-auto" />
            )}
          </button>
        </div>
      </div>
    </aside>
  )
}