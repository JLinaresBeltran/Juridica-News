import { useState, useMemo, useCallback } from 'react'
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
  Archive
} from 'lucide-react'
import { getEntityColors, getStatusColors, getAreaColors } from '../../constants/entityColors'
import { clsx } from 'clsx'
import { DocumentPreviewModal } from '../../components/curation/DocumentPreviewModal'
import { useCurationStore } from '../../stores/curationStore'

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

// Mock data para fuentes de documentos - ahora usa el sistema de colores centralizado
const documentSources: DocumentSource[] = [
  {
    id: 'corte-constitucional',
    ...getEntityColors('corte-constitucional'),
    count: 15,
    available: 12,
    unavailable: 3
  },
  {
    id: 'corte-suprema-civil',
    ...getEntityColors('corte-suprema-civil'),
    count: 8,
    available: 6,
    unavailable: 2
  },
  {
    id: 'corte-suprema-penal',
    ...getEntityColors('corte-suprema-penal'),
    count: 12,
    available: 9,
    unavailable: 3
  },
  {
    id: 'corte-suprema-laboral',
    ...getEntityColors('corte-suprema-laboral'),
    count: 6,
    available: 5,
    unavailable: 1
  },
  {
    id: 'dian',
    ...getEntityColors('dian'),
    count: 9,
    available: 7,
    unavailable: 2
  },
  {
    id: 'super-servicios',
    ...getEntityColors('super-servicios'),
    count: 4,
    available: 4,
    unavailable: 0
  }
]

// Mock data para documentos - 10 documentos pendientes para pruebas
const mockDocuments: Document[] = [
  {
    id: '1',
    source: 'corte-constitucional',
    title: 'Sentencia C-055/2025 sobre derechos fundamentales en el trabajo',
    type: 'Sentencia',
    publicationDate: '2025-01-15T09:30:00Z',
    identifier: 'C-055/2025',
    status: 'available',
    area: 'CONSTITUCIONAL',
    summary: 'La Corte declara exequible el artículo 23 de la Ley de reforma laboral que establece limitaciones a los derechos de asociación sindical en empresas de menos de 50 trabajadores.',
    url: 'https://example.com/doc1',
    extractionDate: '2025-01-16T14:20:00Z',
    magistradoPonente: 'Dr. Carlos Bernal Pulido',
    expediente: 'D-15234',
    tema: 'Derechos fundamentales en el trabajo - Asociación sindical',
    decision: 'Declarar EXEQUIBLE'
  },
  {
    id: '2',
    source: 'corte-constitucional',
    title: 'Auto 001/2025 sobre admisión de demanda inconstitucional',
    type: 'Auto',
    publicationDate: '2025-01-10T11:15:00Z',
    identifier: 'Auto 001/2025',
    status: 'unavailable',
    area: 'CONSTITUCIONAL',
    extractionDate: '2025-01-11T16:45:00Z',
    magistradoPonente: 'Dra. Diana Fajardo Rivera',
    expediente: 'D-15001',
    tema: 'Admisión de demanda - Control constitucional',
    summary: 'Auto mediante el cual se admite la demanda de inconstitucionalidad contra varios artículos del Código de Procedimiento Administrativo y de lo Contencioso Administrativo.',
    decision: 'ADMITIR la demanda'
  },
  {
    id: '3',
    source: 'corte-suprema-civil',
    title: 'Sentencia STC-001/2025 sobre contratos de arrendamiento',
    type: 'Sentencia',
    publicationDate: '2025-01-12T08:00:00Z',
    identifier: 'STC-001/2025',
    status: 'available',
    area: 'CIVIL',
    summary: 'Criterios para determinar cláusulas abusivas en contratos de arrendamiento habitacional urbano. Análisis de equilibrio contractual.',
    url: 'https://example.com/doc3',
    extractionDate: '2025-01-13T13:30:00Z',
    magistradoPonente: 'Dr. Luis Armando Tolosa Villabona',
    expediente: '11001-31-03-001-2024-00456-01',
    tema: 'Contratos de arrendamiento - Cláusulas abusivas',
    decision: 'CASAR la sentencia de segunda instancia'
  },
  {
    id: '4',
    source: 'corte-suprema-penal',
    title: 'Sentencia SP-045/2025 sobre delitos contra la administración pública',
    type: 'Sentencia',
    publicationDate: '2025-01-08T15:20:00Z',
    identifier: 'SP-045/2025',
    status: 'available',
    area: 'PENAL',
    summary: 'Análisis de los elementos configurativos del delito de cohecho y establecimiento de criterios jurisprudenciales para la configuración del delito en el marco de la administración pública.',
    url: 'https://example.com/doc4',
    extractionDate: '2025-01-09T10:15:00Z',
    magistradoPonente: 'Dr. José Francisco Acuña Vizcaya',
    expediente: '52750',
    tema: 'Delitos contra la administración pública - Cohecho',
    decision: 'CASAR parcialmente la sentencia'
  },
  {
    id: '5',
    source: 'corte-suprema-laboral',
    title: 'Sentencia SL-012/2025 sobre estabilidad laboral reforzada',
    type: 'Sentencia',
    publicationDate: '2025-01-05T14:45:00Z',
    identifier: 'SL-012/2025',
    status: 'available',
    area: 'LABORAL',
    summary: 'Criterios para determinar la procedencia de reintegro por fuero sindical y análisis de la estabilidad laboral reforzada en casos de discriminación por actividades sindicales.',
    url: 'https://example.com/doc5',
    extractionDate: '2025-01-06T09:20:00Z',
    magistradoPonente: 'Dra. Clara Cecilia Dueñas Quevedo',
    expediente: 'SL-001-2024-00123',
    tema: 'Estabilidad laboral reforzada - Fuero sindical - Discriminación laboral',
    decision: 'ORDENAR el reintegro inmediato'
  },
  {
    id: '6',
    source: 'dian',
    title: 'Resolución DIAN 000123/2025 sobre facturación electrónica',
    type: 'Resolución',
    publicationDate: '2025-01-03T12:30:00Z',
    identifier: 'Res. 000123/2025',
    status: 'unavailable',
    area: 'TRIBUTARIO',
    extractionDate: '2025-01-04T17:10:00Z',
    magistradoPonente: 'Dr. Luis Carlos Reyes López',
    expediente: 'DIAN-FE-2025-001',
    tema: 'Facturación electrónica - Obligaciones tributarias - Medios tecnológicos',
    summary: 'Resolución que establece nuevos requisitos técnicos y procedimentales para la implementación de la facturación electrónica en empresas del régimen simplificado.',
    decision: 'ESTABLECER nuevos requisitos'
  },
  {
    id: '7',
    source: 'super-servicios',
    title: 'Circular Externa 001/2025 sobre servicios públicos domiciliarios',
    type: 'Circular',
    publicationDate: '2025-01-02T10:00:00Z',
    identifier: 'CE-001/2025',
    status: 'available',
    area: 'ADMINISTRATIVO',
    summary: 'Nuevas directrices para la prestación de servicios públicos en zonas rurales y criterios de calidad en la prestación de servicios esenciales.',
    url: 'https://example.com/doc7',
    extractionDate: '2025-01-02T15:30:00Z',
    magistradoPonente: 'Dr. Jorge Armando Otálora Gómez',
    expediente: 'SSPD-2025-001',
    tema: 'Servicios públicos domiciliarios - Zonas rurales - Calidad del servicio',
    decision: 'IMPLEMENTAR nuevas directrices'
  },
  {
    id: '8',
    source: 'corte-constitucional',
    title: 'Sentencia T-089/2025 sobre derecho fundamental a la salud',
    type: 'Sentencia',
    publicationDate: '2025-01-18T16:00:00Z',
    identifier: 'T-089/2025',
    status: 'available',
    area: 'CONSTITUCIONAL',
    summary: 'Tutela que ordena el suministro inmediato de medicamentos no incluidos en el POS para el tratamiento de una enfermedad huérfana. Se establece jurisprudencia sobre el acceso a tratamientos especializados.',
    url: 'https://example.com/doc8',
    extractionDate: '2025-01-19T11:25:00Z',
    magistradoPonente: 'Dra. Cristina Pardo Schlesinger',
    expediente: 'T-8.456.789',
    tema: 'Derecho fundamental a la salud - Enfermedades huérfanas - Medicamentos no POS',
    decision: 'CONCEDER la tutela y ORDENAR suministro'
  },
  {
    id: '9',
    source: 'super-financiera',
    title: 'Circular Externa 005/2025 sobre regulación fintech',
    type: 'Circular Externa',
    publicationDate: '2025-01-20T09:15:00Z',
    identifier: 'CE-005/2025',
    status: 'available',
    area: 'FINANCIERO',
    summary: 'Nuevas regulaciones para empresas de tecnología financiera en Colombia. Establece requisitos de licenciamiento y supervisión para plataformas de pagos digitales.',
    url: 'https://example.com/doc9',
    extractionDate: '2025-01-21T14:40:00Z',
    magistradoPonente: 'Dr. César Ferrari Quimbaya',
    expediente: 'SFC-REG-2025-001',
    tema: 'Regulación financiera - Fintech - Pagos digitales',
    decision: 'ESTABLECER marco regulatorio'
  },
  {
    id: '10',
    source: 'consejo-estado',
    title: 'Sentencia No. 2025-00001 sobre contratación pública',
    type: 'Sentencia',
    publicationDate: '2025-01-22T13:30:00Z',
    identifier: '2025-00001',
    status: 'available',
    area: 'ADMINISTRATIVO',
    summary: 'Análisis sobre la aplicación del principio de transparencia en procesos de contratación estatal. Criterios para evaluar ofertas en licitaciones públicas.',
    url: 'https://example.com/doc10',
    extractionDate: '2025-01-23T10:50:00Z',
    magistradoPonente: 'Dr. William Hernández Gómez',
    expediente: 'CE-SEC3-EXP-2024-11250',
    tema: 'Contratación pública - Transparencia - Licitaciones',
    decision: 'ANULAR el proceso licitatorio'
  }
]

export default function CurationPage() {
  const [selectedSource, setSelectedSource] = useState<string | null>(null)
  const searchTerm = '' // Removed search functionality
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'unavailable'>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [expandedSources, setExpandedSources] = useState<Set<string>>(new Set())
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [refreshCounter, setRefreshCounter] = useState(0)
  
  // Zustand store
  const { 
    approveDocument, 
    rejectDocument, 
    isDocumentApproved, 
    isDocumentRejected,
    clearAll,
    resetToInitialState
  } = useCurationStore()

  // Filtrar documentos por fuente seleccionada
  const filteredDocuments = useMemo(() => {
    let docs = mockDocuments

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
  }, [selectedSource, statusFilter, isDocumentApproved, isDocumentRejected, refreshCounter])

  const handleDocumentAction = (docId: string, action: 'approve' | 'reject' | 'preview') => {
    const document = mockDocuments.find(doc => doc.id === docId)
    
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
    const document = mockDocuments.find(doc => doc.id === docId)
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
    const document = mockDocuments.find(doc => doc.id === docId)
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
    return mockDocuments.filter(doc => {
      const matchesSource = doc.source === sourceId
      const matchesSearch = true
      const matchesStatus = statusFilter === 'all' || doc.status === statusFilter
      const notProcessed = !isDocumentApproved(doc.id) && !isDocumentRejected(doc.id)
      
      return matchesSource && matchesSearch && matchesStatus && notProcessed
    })
  }, [statusFilter, isDocumentApproved, isDocumentRejected, refreshCounter])

  // Función para calcular contadores dinámicos por fuente
  const getSourceStats = useCallback((sourceId: string) => {
    const allSourceDocs = mockDocuments.filter(doc => doc.source === sourceId)
    const activeSourceDocs = allSourceDocs.filter(doc => 
      !isDocumentApproved(doc.id) && !isDocumentRejected(doc.id)
    )
    
    return {
      total: activeSourceDocs.length,
      available: activeSourceDocs.filter(doc => doc.status === 'available').length,
      unavailable: activeSourceDocs.filter(doc => doc.status === 'unavailable').length
    }
  }, [isDocumentApproved, isDocumentRejected, refreshCounter])

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
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              Documentos de {documentSources.find(s => s.id === selectedSource)?.name}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-300">
              {filteredDocuments.length} documentos disponibles
            </p>
          </div>
          
          <div className="card-body p-0">
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