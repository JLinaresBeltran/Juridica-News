import { useState, useMemo, useCallback, useEffect } from 'react'
import { 
  FileText, 
  AlertCircle, 
  CheckCircle, 
  XCircle, 
  Download, 
  Eye, 
  Filter,
  Search,
  Calendar,
  Building,
  Scale,
  AlertTriangle,
  Grid3X3,
  List,
  ChevronDown,
  ChevronRight,
  Archive,
  Loader2
} from 'lucide-react'
import { getEntityColors, getStatusColors, getAreaColors } from '../../constants/entityColors'
import { clsx } from 'clsx'
import { DocumentPreviewModal } from '../../components/curation/DocumentPreviewModal'
import { useCurationStore } from '../../stores/curationStore'
import { useEventStore } from '../../stores/eventStore'
import documentsService, { type Document as ApiDocument, type DocumentsResponse } from '../../services/documentsService'

// Definir tipos de fuentes de documentos
interface DocumentSource {
  id: string
  name: string
  icon: any
  color: string
  bgColor: string
  count: number
  available: number
  unavailable: number
}

// Definir estructura de documento
interface Document {
  id: string
  source: string
  title: string
  type: string
  publicationDate: string
  identifier: string
  status: 'available' | 'unavailable'
  area: string
  summary?: string
  url?: string
  extractionDate: string
  magistradoPonente?: string
  expediente?: string
  tema?: string
  decision?: string
}

// FUNCIÓN TEMPORAL - Fuentes de documentos con contadores en 0 después del reset
const documentSources: DocumentSource[] = [
  {
    id: 'corte-constitucional',
    ...getEntityColors('corte-constitucional'),
    count: 0,
    available: 0,
    unavailable: 0
  },
  {
    id: 'corte-suprema-civil',
    ...getEntityColors('corte-suprema-civil'),
    count: 0,
    available: 0,
    unavailable: 0
  },
  {
    id: 'corte-suprema-penal',
    ...getEntityColors('corte-suprema-penal'),
    count: 0,
    available: 0,
    unavailable: 0
  },
  {
    id: 'corte-suprema-laboral',
    ...getEntityColors('corte-suprema-laboral'),
    count: 0,
    available: 0,
    unavailable: 0
  },
  {
    id: 'dian',
    ...getEntityColors('dian'),
    count: 0,
    available: 0,
    unavailable: 0
  },
  {
    id: 'super-servicios',
    ...getEntityColors('super-servicios'),
    count: 0,
    available: 0,
    unavailable: 0
  }
]

// Estado para documentos reales de la API
interface RealDocument extends Document {
  curatedBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

const mockDocuments: Document[] = []

export default function CurationPage() {
  const [selectedSource, setSelectedSource] = useState<string | null>(null)
  const searchTerm = '' // Removed search functionality
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'unavailable'>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [expandedSources, setExpandedSources] = useState<Set<string>>(new Set())
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [refreshCounter, setRefreshCounter] = useState(0)
  
  // Estados para documentos reales
  const [realDocuments, setRealDocuments] = useState<RealDocument[]>([])
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  
  // Zustand stores
  const { 
    approveDocument, 
    rejectDocument, 
    isDocumentApproved, 
    isDocumentRejected,
    clearAll,
    resetToInitialState
  } = useCurationStore()
  const subscribe = useEventStore(state => state.subscribe)
  
  // Cargar documentos pendientes de la API
  const loadPendingDocuments = useCallback(async () => {
    try {
      setIsLoadingDocuments(true)
      const response = await documentsService.getDocuments({
        status: 'PENDING',
        limit: 100
      })
      
      // Mapear documentos de la API al formato esperado por la UI
      const mappedDocs: RealDocument[] = response.data.map((doc: ApiDocument) => ({
        id: doc.id,
        source: mapBackendSource(doc.source),
        title: doc.title,
        type: doc.documentType,
        publicationDate: doc.publicationDate,
        identifier: doc.externalId || doc.id,
        status: 'available' as const,
        area: mapLegalArea(doc.legalArea),
        summary: doc.summary || '',
        url: doc.url,
        extractionDate: doc.extractedAt || doc.createdAt,
        curatedBy: (doc as any).curatedBy
      }))
      
      setRealDocuments(mappedDocs)
      setLastUpdated(new Date())
      
      // Actualizar contadores de fuentes
      updateSourceCounts(mappedDocs)
      
    } catch (error) {
      console.error('Error cargando documentos:', error)
    } finally {
      setIsLoadingDocuments(false)
    }
  }, [])
  
  // Funciones de mapeo
  const mapBackendSource = (source: string): string => {
    const sourceMap: Record<string, string> = {
      'corte_constitucional': 'corte-constitucional',
      'consejo_estado': 'consejo-estado',
      'corte_suprema': 'corte-suprema-civil'
    }
    return sourceMap[source] || source
  }
  
  const mapLegalArea = (area: string): string => {
    const areaMap: Record<string, string> = {
      'CONSTITUTIONAL': 'constitucional',
      'CIVIL': 'civil',
      'PENAL': 'penal',
      'LABORAL': 'laboral',
      'ADMINISTRATIVO': 'administrativo'
    }
    return areaMap[area] || area
  }
  
  // Actualizar contadores de fuentes con documentos reales
  const updateSourceCounts = (documents: RealDocument[]) => {
    documentSources.forEach(source => {
      const docsForSource = documents.filter(doc => doc.source === source.id)
      source.count = docsForSource.length
      source.available = docsForSource.filter(doc => doc.status === 'available').length
      source.unavailable = docsForSource.filter(doc => doc.status === 'unavailable').length
    })
    
    // No trigger refresh counter to avoid infinite loop
    // setRefreshCounter(prev => prev + 1) // REMOVED TO FIX INFINITE LOOP
  }
  
  // Efecto para cargar documentos al montar el componente
  useEffect(() => {
    loadPendingDocuments()
    
    // Suscribirse a eventos de extracción para actualización inmediata
    const unsubscribeExtraction = subscribe('DOCUMENTS_EXTRACTED', () => {
      console.debug('🔔 CurationPage: Documents extracted event received, refreshing list')
      loadPendingDocuments()
    })
    
    const unsubscribeRefresh = subscribe('REFRESH_CURATION_LIST', () => {
      console.debug('🔔 CurationPage: Refresh curation list event received')
      loadPendingDocuments()
    })
    
    // Recargar cada 30 segundos (backup)
    const interval = setInterval(loadPendingDocuments, 30000)
    
    return () => {
      clearInterval(interval)
      unsubscribeExtraction()
      unsubscribeRefresh()
    }
  }, [loadPendingDocuments, subscribe])
  
  // Efecto para recargar cuando cambie el refreshCounter (desde otras páginas)
  useEffect(() => {
    if (refreshCounter > 0) {
      loadPendingDocuments()
    }
  }, [refreshCounter])

  // Filtrar documentos por fuente seleccionada (usar documentos reales)
  const filteredDocuments = useMemo(() => {
    let docs = realDocuments.length > 0 ? realDocuments : mockDocuments

    // Excluir documentos aprobados y rechazados de la vista principal
    docs = docs.filter(doc => !isDocumentApproved(doc.id) && !isDocumentRejected(doc.id))

    if (selectedSource) {
      docs = docs.filter(doc => doc.source === selectedSource)
    }

    // Search functionality removed

    if (statusFilter !== 'all') {
      docs = docs.filter(doc => doc.status === statusFilter)
    }

    return docs
  }, [realDocuments, selectedSource, statusFilter, isDocumentApproved, isDocumentRejected, refreshCounter])

  const handleDocumentAction = (docId: string, action: 'approve' | 'reject' | 'preview') => {
    const document = (realDocuments.length > 0 ? realDocuments : mockDocuments).find(doc => doc.id === docId)
    
    if (action === 'preview' && document) {
      setSelectedDocument(document)
      setIsPreviewModalOpen(true)
    } else if (action === 'approve') {
      handleApproveDocument(docId)
    } else if (action === 'reject') {
      handleRejectDocument(docId)
    }
  }

  const handleApproveDocument = async (docId: string) => {
    const document = (realDocuments.length > 0 ? realDocuments : mockDocuments).find(doc => doc.id === docId)
    if (document) {
      approveDocument(document)
      console.log(`Documento ${docId} aprobado`)
      // Forzar re-render inmediato
      setRefreshCounter(prev => prev + 1)
      // Cerrar modal automáticamente después de aprobar
      handleClosePreview()
    }
  }

  const handleRejectDocument = async (docId: string) => {
    const document = (realDocuments.length > 0 ? realDocuments : mockDocuments).find(doc => doc.id === docId)
    if (document) {
      rejectDocument(document, 'Rechazado desde curación')
      console.log(`Documento ${docId} rechazado`)
      // Forzar re-render inmediato
      setRefreshCounter(prev => prev + 1)
      // Cerrar modal automáticamente después de rechazar
      handleClosePreview()
    }
  }

  const handleClosePreview = () => {
    setIsPreviewModalOpen(false)
    setSelectedDocument(null)
  }

  const toggleSourceExpansion = (sourceId: string) => {
    const newExpanded = new Set(expandedSources)
    if (newExpanded.has(sourceId)) {
      newExpanded.delete(sourceId)
    } else {
      newExpanded.add(sourceId)
    }
    setExpandedSources(newExpanded)
  }

  const getDocumentsBySource = useCallback((sourceId: string) => {
    const docs = realDocuments.length > 0 ? realDocuments : mockDocuments
    return docs.filter(doc => {
      const matchesSource = doc.source === sourceId
      const matchesSearch = true
      const matchesStatus = statusFilter === 'all' || doc.status === statusFilter
      const notProcessed = !isDocumentApproved(doc.id) && !isDocumentRejected(doc.id)
      
      return matchesSource && matchesSearch && matchesStatus && notProcessed
    })
  }, [statusFilter, isDocumentApproved, isDocumentRejected, refreshCounter])

  // Función para calcular contadores dinámicos por fuente
  const getSourceStats = useCallback((sourceId: string) => {
    // Usar documentos reales si están disponibles, sino usar mock
    const documentsToUse = realDocuments.length > 0 ? realDocuments : mockDocuments
    const allSourceDocs = documentsToUse.filter(doc => doc.source === sourceId)
    const activeSourceDocs = allSourceDocs.filter(doc => 
      !isDocumentApproved(doc.id) && !isDocumentRejected(doc.id)
    )
    
    return {
      total: activeSourceDocs.length,
      available: activeSourceDocs.filter(doc => doc.status === 'available').length,
      unavailable: activeSourceDocs.filter(doc => doc.status === 'unavailable').length
    }
  }, [realDocuments, isDocumentApproved, isDocumentRejected, refreshCounter])

  return (
    <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex justify-center items-center">
        {/* Filtros globales y toggle de vista */}
        <div className="flex items-center space-x-6">
          {/* Botón para limpiar todo */}
          <button
            onClick={() => {
              if (window.confirm('¿Estás seguro de que quieres reiniciar todos los datos y limpiar el localStorage? Esta acción no se puede deshacer.')) {
                resetToInitialState()
                setRefreshCounter(prev => prev + 1)
              }
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 hover:bg-[#04315a] hover:text-[#3ff3f2] rounded-lg transition-all duration-200"
            title="Reiniciar todos los datos"
          >
            <Archive className="w-4 h-4" />
            <span>Reset</span>
          </button>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="pl-10 pr-8 py-2.5 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-[#04315a] focus:border-[#04315a] appearance-none cursor-pointer min-w-[180px] text-sm font-medium"
          >
            <option value="all">Todos los estados</option>
            <option value="available">Disponibles</option>
            <option value="unavailable">No disponibles</option>
          </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>

          {/* Toggle de vista */}
          <div className="flex items-center border border-gray-300 rounded-lg">
            <button
              onClick={() => setViewMode('grid')}
              className={clsx(
                'p-2 rounded-l-lg transition-all duration-200',
                viewMode === 'grid'
                  ? 'bg-[#04315a] text-[#3ff3f2]'
                  : 'text-gray-600 hover:bg-[#04315a] hover:text-[#3ff3f2]'
              )}
              title="Vista de cuadrícula"
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={clsx(
                'p-2 rounded-r-lg transition-all duration-200',
                viewMode === 'list'
                  ? 'bg-[#04315a] text-[#3ff3f2]'
                  : 'text-gray-600 hover:bg-[#04315a] hover:text-[#3ff3f2]'
              )}
              title="Vista de lista"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Vista condicional: Grid o Lista */}
      {viewMode === 'grid' ? (
        /* Vista de Cuadrícula */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {documentSources.map((source) => {
            const stats = getSourceStats(source.id)
            return (
            <div 
              key={source.id}
              className={clsx(
                'card dark:bg-gray-800 cursor-pointer transition-all duration-200 hover:shadow-lg',
                selectedSource === source.id ? 'ring-2 ring-primary-500 bg-primary-50 dark:bg-gray-700' : ''
              )}
              onClick={() => setSelectedSource(selectedSource === source.id ? null : source.id)}
            >
              <div className="card-body">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${source.bgColor}`}>
                      <source.icon className={`w-6 h-6 ${source.color}`} />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-gray-100">{source.name}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-300">{stats.total} documentos</p>
                    </div>
                  </div>
                </div>
                
              </div>
            </div>
            );
          })}
        </div>
      ) : (
        /* Vista de Lista - Accordion */
        <div className="space-y-4">
          {documentSources.map((source) => {
            const sourceDocuments = getDocumentsBySource(source.id)
            const stats = getSourceStats(source.id)
            const isExpanded = expandedSources.has(source.id)
            
            return (
              <div key={source.id} className="card dark:bg-gray-800">
                <div 
                  className="card-body cursor-pointer"
                  onClick={() => toggleSourceExpansion(source.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${source.bgColor}`}>
                        <source.icon className={`w-6 h-6 ${source.color}`} />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-gray-100">{source.name}</h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-300 mt-1">
                          <span>{sourceDocuments.length} documentos disponibles</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Contenido expandible */}
                {isExpanded && (
                  <div className="border-t border-gray-200">
                    <div className="p-0">
                      {sourceDocuments.length > 0 ? (
                        <div className="space-y-0">
                          {sourceDocuments.map((doc, index) => (
                            <div 
                              key={doc.id}
                              className={clsx(
                                'p-6 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700',
                                index !== sourceDocuments.length - 1 ? 'border-b' : ''
                              )}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                  {/* Etiquetas fuera del fondo gris */}
                                  <div className="flex items-center space-x-2 mb-3">
                                    <div className={clsx(
                                      'flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium',
                                      getStatusColors(doc.status).bgColor,
                                      getStatusColors(doc.status).textColor
                                    )}>
                                      {(() => {
                                        const StatusIcon = getStatusColors(doc.status).icon
                                        return <StatusIcon className="w-3 h-3" />
                                      })()}
                                      <span>{getStatusColors(doc.status).name}</span>
                                    </div>
                                    <span className={clsx(
                                      'text-xs px-2 py-1 rounded',
                                      getAreaColors(doc.area).bgColor,
                                      getAreaColors(doc.area).textColor
                                    )}>
                                      {getAreaColors(doc.area).name}
                                    </span>
                                  </div>

                                  {/* Sección principal con fondo gris */}
                                  <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border-l-2 border-primary-600">
                                    
                                    {/* Nombre del documento */}
                                    <div className="space-y-2">
                                      <div className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                                        {doc.type} No. {doc.identifier}
                                      </div>
                                      {doc.magistradoPonente && (
                                        <div className="text-sm text-gray-600 dark:text-gray-300">
                                          <span className="font-medium">Magistrado P.:</span> {doc.magistradoPonente}
                                        </div>
                                      )}
                                      {doc.expediente && (
                                        <div className="text-sm text-gray-600 dark:text-gray-300">
                                          <span className="font-medium">Expediente No.:</span> {doc.expediente}
                                        </div>
                                      )}
                                    </div>

                                    {/* Tema incluido en el fondo gris */}
                                    {doc.tema && (
                                      <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
                                        <span className="font-medium text-gray-900 dark:text-gray-100">Tema:</span>
                                        <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{doc.tema}</p>
                                      </div>
                                    )}

                                    {/* Resumen incluido en el fondo gris */}
                                    {doc.summary && (
                                      <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
                                        <span className="font-medium text-gray-900 dark:text-gray-100">Resumen:</span>
                                        <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 leading-relaxed">{doc.summary}</p>
                                      </div>
                                    )}

                                    {/* Decisión incluida en el fondo gris */}
                                    {doc.decision && (
                                      <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
                                        <span className="font-medium text-gray-900 dark:text-gray-100">Decisión:</span>
                                        <span className="text-sm text-gray-700 dark:text-gray-300 ml-2">{doc.decision}</span>
                                      </div>
                                    )}
                                  </div>

                                  {/* PRIORIDAD 3: Información adicional */}
                                  <div className="space-y-1 text-xs text-gray-500">
                                    <div>
                                      <span><strong>Web Oficial:</strong> {new Date(doc.publicationDate).toLocaleDateString('es-ES', {
                                        year: '2-digit',
                                        month: '2-digit',
                                        day: '2-digit',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        hour12: true
                                      })}</span>
                                    </div>
                                    <div>
                                      <span><strong>Extracción:</strong> {new Date(doc.extractionDate).toLocaleDateString('es-ES', {
                                        year: 'numeric',
                                        month: '2-digit',
                                        day: '2-digit', 
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        hour12: true
                                      })}</span>
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Acciones Minimalistas */}
                                <div className="flex flex-col space-y-2 ml-6">
                                  {doc.status === 'available' && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleDocumentAction(doc.id, 'preview')
                                      }}
                                      className="px-4 py-2 text-xs text-gray-600 border border-gray-300 rounded-full hover:bg-[#04315a] hover:border-[#3ff3f2] hover:text-[#3ff3f2] transition-all duration-200"
                                      title="Vista previa"
                                    >
                                      <Eye className="w-3 h-3 mr-1 inline" />
                                      Previsualizar
                                    </button>
                                  )}
                                  
                                  <div className="flex space-x-2">
                                    {doc.status === 'available' && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleDocumentAction(doc.id, 'approve')
                                        }}
                                        className="px-4 py-2 text-xs text-primary-700 border border-primary-300 rounded-full hover:bg-[#04315a] hover:border-[#3ff3f2] hover:text-[#3ff3f2] transition-all duration-200"
                                        title="Aprobar documento"
                                      >
                                        <CheckCircle className="w-3 h-3 mr-1 inline" />
                                        Aprobar
                                      </button>
                                    )}
                                    
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleDocumentAction(doc.id, 'reject')
                                      }}
                                      className="px-4 py-2 text-xs text-gray-700 border border-gray-300 rounded-full hover:bg-[#04315a] hover:border-[#3ff3f2] hover:text-[#3ff3f2] transition-all duration-200"
                                      title="Rechazar documento"
                                    >
                                      <XCircle className="w-3 h-3 mr-1 inline" />
                                      Rechazar
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-6 text-center text-gray-500">
                          <FileText className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                          <p>No hay documentos que coincidan con los filtros</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Mensaje para vista de cuadrícula cuando no hay fuente seleccionada */}
      {viewMode === 'grid' && !selectedSource && (
        <div className="text-center py-12">
          <Filter className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            Selecciona una fuente de documentos
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Haz clic en cualquier fuente para ver sus documentos pendientes de curación
          </p>
        </div>
      )}

      {/* Lista de documentos para vista de cuadrícula */}
      {viewMode === 'grid' && selectedSource && (
        <div className="card dark:bg-gray-800">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
              Documentos de {documentSources.find(s => s.id === selectedSource)?.name}
              {isLoadingDocuments && <Loader2 className="w-4 h-4 animate-spin text-primary-600" />}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-300">
              {isLoadingDocuments ? 'Cargando...' : `${filteredDocuments.length} documentos disponibles`}
              {lastUpdated && !isLoadingDocuments && (
                <span className="ml-2 text-xs text-green-600">
                  • Actualizado {lastUpdated.toLocaleTimeString()}
                </span>
              )}
            </p>
          </div>
          
          <div className="card-body p-0">
            {isLoadingDocuments ? (
              <div className="p-8 text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary-600" />
                <p className="text-gray-500">Cargando documentos pendientes...</p>
              </div>
            ) : (
              <div className="space-y-0">
                {filteredDocuments.map((doc, index) => (
                <div 
                  key={doc.id}
                  className={clsx(
                    'p-6 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700',
                    index !== filteredDocuments.length - 1 ? 'border-b' : ''
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      {/* Etiquetas fuera del fondo gris */}
                      <div className="flex items-center space-x-2 mb-3">
                        <div className={clsx(
                          'flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium',
                          getStatusColors(doc.status).bgColor,
                          getStatusColors(doc.status).textColor
                        )}>
                          {(() => {
                            const StatusIcon = getStatusColors(doc.status).icon
                            return <StatusIcon className="w-3 h-3" />
                          })()}
                          <span>{getStatusColors(doc.status).name}</span>
                        </div>
                        <span className={clsx(
                          'text-xs px-2 py-1 rounded',
                          getAreaColors(doc.area).bgColor,
                          getAreaColors(doc.area).textColor
                        )}>
                          {getAreaColors(doc.area).name}
                        </span>
                      </div>

                      {/* Sección principal con fondo gris */}
                      <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border-l-2 border-primary-600">
                        
                        {/* Nombre del documento */}
                        <div className="space-y-2">
                          <div className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                            {doc.type} No. {doc.identifier}
                          </div>
                          {doc.magistradoPonente && (
                            <div className="text-sm text-gray-600 dark:text-gray-300">
                              <span className="font-medium">Magistrado P.:</span> {doc.magistradoPonente}
                            </div>
                          )}
                          {doc.expediente && (
                            <div className="text-sm text-gray-600 dark:text-gray-300">
                              <span className="font-medium">Expediente No.:</span> {doc.expediente}
                            </div>
                          )}
                        </div>

                        {/* Tema incluido en el fondo gris */}
                        {doc.tema && (
                          <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
                            <span className="font-medium text-gray-900 dark:text-gray-100">Tema:</span>
                            <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{doc.tema}</p>
                          </div>
                        )}

                        {/* Resumen incluido en el fondo gris */}
                        {doc.summary && (
                          <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
                            <span className="font-medium text-gray-900 dark:text-gray-100">Resumen:</span>
                            <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 leading-relaxed">{doc.summary}</p>
                          </div>
                        )}

                        {/* Decisión incluida en el fondo gris */}
                        {doc.decision && (
                          <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
                            <span className="font-medium text-gray-900 dark:text-gray-100">Decisión:</span>
                            <span className="text-sm text-gray-700 dark:text-gray-300 ml-2">{doc.decision}</span>
                          </div>
                        )}
                      </div>

                      {/* PRIORIDAD 3: Información adicional */}
                      <div className="space-y-1 text-xs text-gray-500">
                        <div>
                          <span><strong>Web Oficial:</strong> {new Date(doc.publicationDate).toLocaleDateString('es-ES', {
                            year: '2-digit',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true
                          })}</span>
                        </div>
                        <div>
                          <span><strong>Extracción:</strong> {new Date(doc.extractionDate).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit', 
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true
                          })}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Acciones Minimalistas */}
                    <div className="flex flex-col space-y-2 ml-6">
                      {doc.status === 'available' && (
                        <button
                          onClick={() => handleDocumentAction(doc.id, 'preview')}
                          className="px-4 py-2 text-xs text-gray-600 border border-gray-300 rounded-full hover:bg-[#04315a] hover:border-[#3ff3f2] hover:text-[#3ff3f2] transition-all duration-200"
                          title="Vista previa"
                        >
                          <Eye className="w-3 h-3 mr-1 inline" />
                          Previsualizar
                        </button>
                      )}
                      
                      <div className="flex space-x-2">
                        {doc.status === 'available' && (
                          <button
                            onClick={() => handleDocumentAction(doc.id, 'approve')}
                            className="px-4 py-2 text-xs text-primary-700 border border-primary-300 rounded-full hover:bg-[#04315a] hover:border-[#3ff3f2] hover:text-[#3ff3f2] transition-all duration-200"
                            title="Aprobar documento"
                          >
                            <CheckCircle className="w-3 h-3 mr-1 inline" />
                            Aprobar
                          </button>
                        )}
                        
                        <button
                          onClick={() => handleDocumentAction(doc.id, 'reject')}
                          className="px-4 py-2 text-xs text-gray-700 border border-gray-300 rounded-full hover:bg-[#04315a] hover:border-[#3ff3f2] hover:text-[#3ff3f2] transition-all duration-200"
                          title="Rechazar documento"
                        >
                          <XCircle className="w-3 h-3 mr-1 inline" />
                          Rechazar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Document Preview Modal */}
      <DocumentPreviewModal
        isOpen={isPreviewModalOpen}
        onClose={handleClosePreview}
        document={selectedDocument}
        onApprove={handleApproveDocument}
        onReject={handleRejectDocument}
      />
    </div>
  )
}