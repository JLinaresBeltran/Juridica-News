import { useState } from 'react'
import { 
  CheckCircle,
  Calendar,
  FileText,
  Building,
  Scale,
  Search,
  Download,
  ExternalLink,
  Archive
} from 'lucide-react'
import { clsx } from 'clsx'
import { useCurationStore } from '../../stores/curationStore'
import ArticleGeneratorModal from '../../components/articles/ArticleGeneratorModal'
import { getEntityColors, getStatusColors, getAreaColors } from '../../constants/entityColors'

// Ya no necesitamos esta definición local - usamos el sistema centralizado

export default function ApprovedDocumentsPage() {
  const searchTerm = '' // Search functionality removed
  const [selectedDocument, setSelectedDocument] = useState(null)
  const [isGeneratorModalOpen, setIsGeneratorModalOpen] = useState(false)
  const { approvedDocuments, undoApproval, archiveDocument } = useCurationStore()

  const filteredDocuments = approvedDocuments // Search functionality removed

  const handleDocumentClick = (doc) => {
    setSelectedDocument(doc)
    setIsGeneratorModalOpen(true)
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

      {/* Documents List */}
      {filteredDocuments.length > 0 ? (
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
                              {doc.type} No. {doc.identifier}
                            </div>
                            {/* Información adicional específica de aprobados */}
                            <div className="text-sm text-gray-600 dark:text-gray-300">
                              <span className="font-medium">Fuente:</span> {sourceInfo?.name}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-300">
                              <span className="font-medium">Aprobado:</span> {new Date(doc.approvedAt!).toLocaleDateString('es-ES')}
                            </div>
                          </div>

                          {/* Tema incluido en el fondo gris */}
                          {doc.title && (
                            <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
                              <span className="font-medium text-gray-900 dark:text-gray-100">Tema:</span>
                              <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{doc.title}</p>
                            </div>
                          )}

                          {/* Resumen incluido en el fondo gris */}
                          {doc.summary && (
                            <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
                              <span className="font-medium text-gray-900 dark:text-gray-100">Resumen:</span>
                              <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 leading-relaxed">{doc.summary}</p>
                            </div>
                          )}

                          {/* Estado de publicación incluido en el fondo gris */}
                          <div className="mt-4 pt-3 border-t border-gray-200">
                            <span className="font-medium text-gray-900 dark:text-gray-100">Estado:</span>
                            <span className="text-sm text-green-700 dark:text-green-400 ml-2">Aprobado para publicación</span>
                          </div>
                        </div>

                        {/* Información adicional */}
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

      {/* Article Generator Modal */}
      <ArticleGeneratorModal
        isOpen={isGeneratorModalOpen}
        onClose={() => {
          setIsGeneratorModalOpen(false)
          setSelectedDocument(null)
        }}
        document={selectedDocument}
      />
    </div>
  )
}