import { NavLink, useLocation } from 'react-router-dom'
import { useMemo, useEffect, useState } from 'react'
import { 
  LayoutDashboard, 
  Clock, 
  CheckCircle, 
  Edit3, 
  Eye, 
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
// import { useEventStore } from '@/stores/eventStore' // Ya no se usa

// FUNCIÓN TEMPORAL - Eliminar datos mock, usar datos reales del backend
const MOCK_DATA_TOTALS = {
  totalReadyArticles: 0,     // readyArticles en ArticlesPage.tsx (inicialmente vacío)
  totalPublishedArticles: 0, // publishedArticles en PublishedArticlesPage.tsx (inicialmente vacío)
  totalArchivedDocuments: 0  // archivedDocuments en ArchivedArticlesPage.tsx (inicialmente vacío)
}

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
  
  const { approvedDocuments, rejectedDocuments, readyDocuments, publishedDocuments, archivedDocuments } = useCurationStore()
  // const subscribe = useEventStore(state => state.subscribe) // Ya no se usa
  
  // Estados para contadores reales de la API
  const [documentCounts, setDocumentCounts] = useState({
    PENDING: 0,
    APPROVED: 0,
    REJECTED: 0,
    READY: 0,
    PUBLISHED: 0,
    ARCHIVED: 0
  })
  
  // Cargar contadores de documentos desde la API
  useEffect(() => {
    const loadDocumentCounts = async () => {
      try {
        // Cargar contadores de cada estado
        const [pendingRes, approvedRes, rejectedRes] = await Promise.all([
          documentsService.getDocuments({ status: 'PENDING', limit: 1 }),
          documentsService.getDocuments({ status: 'APPROVED', limit: 1 }),
          documentsService.getDocuments({ status: 'REJECTED', limit: 1 })
        ])
        
        setDocumentCounts({
          PENDING: pendingRes.pagination.total,
          APPROVED: approvedRes.pagination.total,
          REJECTED: rejectedRes.pagination.total,
          READY: 0, // TODO: Cuando se implemente
          PUBLISHED: 0, // TODO: Cuando se implemente  
          ARCHIVED: 0 // TODO: Cuando se implemente
        })
        
        console.debug('🔄 Sidebar: Document counts loaded:', {
          PENDING: pendingRes.pagination.total,
          APPROVED: approvedRes.pagination.total,
          REJECTED: rejectedRes.pagination.total
        })
        
      } catch (error) {
        console.error('Error loading document counts:', error)
      }
    }
    
    loadDocumentCounts()
  }, [])

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
        { id: 'ready', label: 'Listos', icon: Send, path: '/articles?status=ready', count: () => readyDocuments.length },
        { id: 'published', label: 'Publicados', icon: FileText, path: '/articles?status=published', count: () => publishedDocuments.length },
        { id: 'archived', label: 'Archivados', icon: BarChart3, path: '/articles?status=archived', count: () => archivedDocuments.length },
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
                        {item.count && (
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

        {/* Toggle button */}
        <div className="p-2 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={toggleSidebar}
            className="w-full p-2 rounded-md text-gray-500 dark:text-gray-400 hover:text-[#3ff3f2] hover:bg-[#04315a] transition-all duration-200 flex items-center justify-center"
            title={sidebarCollapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <ChevronLeft className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </aside>
  )
}