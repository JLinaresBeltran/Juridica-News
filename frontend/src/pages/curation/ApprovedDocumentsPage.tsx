import { useState, useEffect, useCallback } from 'react'
import {
  CheckCircle,
  Calendar,
  FileText,
  Building,
  Scale,
  Search,
  Download,
  ExternalLink,
  Archive,
  Edit3
} from 'lucide-react'
import { clsx } from 'clsx'
import { useCurationStore } from '../../stores/curationStore'
import documentsService from '../../services/documentsService'
import { DocumentPreviewModal } from '../../components/curation/DocumentPreviewModal'
import { getEntityColors, getStatusColors, getAreaColors } from '../../constants/entityColors'
import { documentEvents } from '@/utils/documentEvents'

// Ya no necesitamos esta definición local - usamos el sistema centralizado

export default function ApprovedDocumentsPage() {
  const searchTerm = '' // Search functionality removed
  const [selectedDocument, setSelectedDocument] = useState(null)
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false)
  const [approvedDocuments, setApprovedDocuments] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentStep, setCurrentStep] = useState(0)
  const { undoApproval, archiveDocument } = useCurationStore()

  // Funciones de mapeo (definidas antes de useCallback para evitar problemas de hoisting)
  const mapBackendSource = (source: string): string => {
    const sourceMap: Record<string, string> = {
      'corte_constitucional': 'corte-constitucional',
      'consejo_estado': 'consejo-estado',
      'corte_suprema': 'corte-suprema-civil',
      'test_local': 'corte-constitucional'
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

  // ✅ FIX: Función para cargar documentos aprobados desde la API
  const loadApprovedDocuments = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await documentsService.getDocuments({
        status: 'APPROVED',
        limit: 100
      })

      // Mapear documentos de la API al formato esperado por la UI
      const mappedDocs = response.data.map((doc) => ({
        id: doc.id,
        source: mapBackendSource(doc.source),
        title: doc.title,
        type: doc.documentType,
        publicationDate: doc.publicationDate,
        identifier: doc.externalId || doc.id,
        status: 'available' as const,
        area: mapLegalArea(doc.legalArea),
        summary: doc.summary || '',
        url: doc.url, // ✅ URL del PDF original
        extractionDate: doc.extractedAt || doc.createdAt,
        approvedAt: doc.updatedAt, // Usar updatedAt como fecha de aprobación

        // ✅ INCLUIR todos los campos de análisis IA para las tarjetas
        numeroSentencia: doc.numeroSentencia,
        magistradoPonente: doc.magistradoPonente,
        salaRevision: doc.salaRevision,
        expediente: doc.expediente,
        temaPrincipal: doc.temaPrincipal,
        resumenIA: doc.resumenIA,
        decision: doc.decision,
        aiAnalysisStatus: doc.aiAnalysisStatus,
        aiAnalysisDate: doc.aiAnalysisDate,
        aiModel: doc.aiModel,
        fragmentosAnalisis: doc.fragmentosAnalisis
      }))

      console.log('✅ Documentos aprobados mapeados:', mappedDocs.map(doc => ({
        id: doc.id,
        title: doc.title,
        url: doc.url,
        hasAiData: {
          numeroSentencia: !!doc.numeroSentencia,
          magistradoPonente: !!doc.magistradoPonente,
          temaPrincipal: !!doc.temaPrincipal,
          resumenIA: !!doc.resumenIA
        }
      })))

      setApprovedDocuments(mappedDocs)
      console.log('✅ Documentos aprobados cargados:', mappedDocs.length)

    } catch (error) {
      console.error('Error cargando documentos aprobados:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Cargar al montar y escuchar eventos para recargar
  useEffect(() => {
    loadApprovedDocuments()

    // ✅ FIX: Escuchar eventos para recargar cuando un documento cambie de estado
    documentEvents.on('document:ready', loadApprovedDocuments)
    documentEvents.on('document:approved', loadApprovedDocuments)

    return () => {
      documentEvents.off('document:ready', loadApprovedDocuments)
      documentEvents.off('document:approved', loadApprovedDocuments)
    }
  }, [loadApprovedDocuments])

  const filteredDocuments = approvedDocuments // Search functionality removed

  const handleDocumentClick = (doc) => {
    setSelectedDocument(doc)
    setIsPreviewModalOpen(true)
  }

  const handleArchiveDocument = (e, docId) => {
    e.stopPropagation() // Evitar que se abra el modal
    
    const doc = approvedDocuments.find(d => d.id === docId)
    if (!doc) return

    const reason = window.prompt('¿Por qué razón deseas archivar este documento?', 'Documento no requerido para publicación')
    
    if (reason && reason.trim()) {
      // Simular usuario actual (en una app real vendría de auth)
      const currentUser = 'Usuario Sistema'
      
      archiveDocument(doc, reason.trim(), currentUser)
      console.log('Documento archivado:', docId, 'Razón:', reason)
    }
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex justify-center items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Documentos Aprobados</h1>
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">Cargando documentos aprobados...</p>
        </div>
      ) : 
      
      /* Documents List */
      filteredDocuments.length > 0 ? (
        <div className="card dark:bg-gray-800">
          <div className="card-body p-0">
            <div className="space-y-0">
              {filteredDocuments.map((doc, index) => {
                const sourceInfo = getEntityColors(doc.source)

                return (
                  <div 
                    key={doc.id}
                    onClick={() => handleDocumentClick(doc)}
                    className={clsx(
                      'p-6 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors duration-200',
                      index !== filteredDocuments.length - 1 ? 'border-b' : ''
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        {/* Etiquetas dinámicas de fuente */}
                        <div className="flex items-center space-x-2 mb-3">
                          <div className={clsx(
                            'flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium border',
                            sourceInfo.bgColor,
                            sourceInfo.textColor,
                            sourceInfo.borderColor
                          )}>
                            <sourceInfo.icon className="w-4 h-4" />
                            <span>{sourceInfo.name}</span>
                          </div>
                          <span className={clsx(
                            'text-xs px-2 py-1 rounded',
                            getAreaColors(doc.area).bgColor,
                            getAreaColors(doc.area).textColor
                          )}>
                            {getAreaColors(doc.area).name}
                          </span>
                        </div>

                        {/* Sección principal con fondo gris - formato de sentencias */}
                        <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border-l-2 border-primary-600">
                          
                          {/* Nombre del documento */}
                          <div className="space-y-2">
                            <div className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                              {doc.numeroSentencia || `${doc.type} No. ${doc.identifier}`}
                            </div>
                            
                            {/* ✅ FIX: Mostrar información de IA */}
                            {doc.magistradoPonente && (
                              <div className="text-sm text-gray-600 dark:text-gray-300">
                                <span className="font-medium">Magistrado Ponente:</span> {doc.magistradoPonente}
                              </div>
                            )}
                            {doc.salaRevision && (
                              <div className="text-sm text-gray-600 dark:text-gray-300">
                                <span className="font-medium">Sala de Revisión:</span> {doc.salaRevision}
                              </div>
                            )}
                            {doc.expediente && (
                              <div className="text-sm text-gray-600 dark:text-gray-300">
                                <span className="font-medium">No. de expediente:</span> {doc.expediente}
                              </div>
                            )}
                            
                            {/* Información adicional específica de aprobados */}
                            <div className="text-sm text-gray-600 dark:text-gray-300">
                              <span className="font-medium">Aprobado:</span> {new Date(doc.approvedAt!).toLocaleDateString('es-ES')}
                            </div>
                          </div>

                          {/* ✅ FIX: Tema Principal - Análisis de IA */}
                          {doc.temaPrincipal && (
                            <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="font-medium text-gray-900 dark:text-gray-100">Tema Principal:</span>
                                <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">IA</span>
                              </div>
                              <p className="text-sm text-gray-700 dark:text-gray-300">{doc.temaPrincipal}</p>
                            </div>
                          )}

                          {/* ✅ FIX: Resumen de IA prioritario */}
                          {doc.resumenIA ? (
                            <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="font-medium text-gray-900 dark:text-gray-100">Resumen:</span>
                                <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full flex items-center space-x-1">
                                  <span>IA</span>
                                  {doc.aiModel && <span className="text-xs">({doc.aiModel})</span>}
                                </span>
                              </div>
                              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{doc.resumenIA}</p>
                            </div>
                          ) : doc.summary && (
                            <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
                              <span className="font-medium text-gray-900 dark:text-gray-100">Resumen:</span>
                              <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 leading-relaxed">{doc.summary}</p>
                            </div>
                          )}

                          {/* ✅ FIX: Decisión - Análisis de IA */}
                          {doc.decision && (
                            <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="font-medium text-gray-900 dark:text-gray-100">Decisión:</span>
                                <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded-full">IA</span>
                              </div>
                              <p className="text-sm text-gray-700 dark:text-gray-300">{doc.decision}</p>
                            </div>
                          )}

                        </div>

                        {/* Información adicional */}
                        <div className="space-y-1 text-xs text-gray-500">
                          <div>
                            <span><strong>Publicación:</strong> {new Date(doc.publicationDate).toLocaleDateString('es-ES', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric'
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
                      
                      {/* Actions */}
                      <div className="flex items-center space-x-2 ml-6">
                        <button
                          onClick={(e) => handleArchiveDocument(e, doc.id)}
                          className="flex items-center space-x-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                          title="Archivar documento"
                        >
                          <Archive className="w-4 h-4" />
                          <span>Archivar</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No hay documentos aprobados
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Los documentos aprobados aparecerán aquí
          </p>
        </div>
      )}

      {/* Document Preview Modal */}
      <DocumentPreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => {
          setIsPreviewModalOpen(false)
          setSelectedDocument(null)
          setCurrentStep(0) // Reiniciar al paso inicial
        }}
        document={selectedDocument}
        showActions={false} // No mostrar botones en aprobados
        currentStep={currentStep}
        onStepChange={(step) => {
          console.log('Cambio a paso:', step)
          setCurrentStep(step)
        }}
        mode="generation"
      />

    </div>
  )
}