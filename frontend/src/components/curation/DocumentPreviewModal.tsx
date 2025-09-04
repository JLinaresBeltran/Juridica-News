import { useState, useEffect } from 'react'
import { 
  X, 
  CheckCircle, 
  XCircle, 
  FileText
} from 'lucide-react'
import { clsx } from 'clsx'
import { getEntityColors, getStatusColors, getAreaColors } from '../../constants/entityColors'

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

interface DocumentPreviewModalProps {
  isOpen: boolean
  onClose: () => void
  document: Document | null
  onApprove: (docId: string) => void
  onReject: (docId: string) => void
}

// Ya no necesitamos esta definición - usamos el sistema centralizado

export function DocumentPreviewModal({ 
  isOpen, 
  onClose, 
  document: selectedDoc, 
  onApprove, 
  onReject 
}: DocumentPreviewModalProps) {
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      if (window.document?.documentElement) {
        window.document.documentElement.style.overflow = 'hidden'
      }
      window.addEventListener('keydown', handleEscape)
    } else {
      if (window.document?.documentElement) {
        window.document.documentElement.style.overflow = 'unset'
      }
    }

    return () => {
      if (window.document?.documentElement) {
        window.document.documentElement.style.overflow = 'unset'
      }
      window.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  const handleApprove = async () => {
    if (!selectedDoc) return
    
    setIsLoading(true)
    try {
      await onApprove(selectedDoc.id)
      // No cerramos aquí, dejamos que CurationPage maneje el cierre
    } catch (error) {
      console.error('Error approving document:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleReject = async () => {
    if (!selectedDoc) return
    
    setIsLoading(true)
    try {
      await onReject(selectedDoc.id)
      // No cerramos aquí, dejamos que CurationPage maneje el cierre
    } catch (error) {
      console.error('Error rejecting document:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen || !selectedDoc) return null

  const sourceInfo = getEntityColors(selectedDoc.source)
  const SourceIcon = sourceInfo.icon

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 overflow-hidden">
        <div className="flex items-center justify-center min-h-full p-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-[98vw] h-[96vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <div className={clsx('p-2 rounded-lg', sourceInfo.bgColor)}>
                  <SourceIcon className={clsx('w-6 h-6', sourceInfo.textColor)} />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Vista Previa del Documento</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{sourceInfo.name}</p>
                </div>
              </div>
              
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-500 dark:text-gray-400"
                disabled={isLoading}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 flex overflow-hidden">
              {/* Document Preview - 60% width */}
              <div className="flex-1 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col">
                <div className="flex-1 overflow-auto p-6">
                  {selectedDoc.url ? (
                    <div className="h-full">
                      <iframe
                        src={selectedDoc.url}
                        className="w-full h-full border border-gray-300 rounded-lg"
                        title={`Vista previa de ${selectedDoc.title}`}
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
                      <FileText className="w-16 h-16 mb-4" />
                      <h4 className="text-lg font-medium mb-2 text-gray-900 dark:text-gray-100">Documento no disponible</h4>
                      <p className="text-center text-gray-600 dark:text-gray-300">
                        El documento no está disponible para vista previa en este momento.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Metadata Panel - 40% width */}
              <div className="w-2/5 bg-white dark:bg-gray-800 flex flex-col">
                <div className="flex-1 overflow-auto p-6">
                  <div className="space-y-6">
                    {/* Status and Area - Similar to cards */}
                    <div className="flex items-center space-x-2">
                      <div className={clsx(
                        'flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium',
                        getStatusColors(selectedDoc.status).bgColor,
                        getStatusColors(selectedDoc.status).textColor
                      )}>
                        {(() => {
                          const StatusIcon = getStatusColors(selectedDoc.status).icon
                          return <StatusIcon className="w-3 h-3" />
                        })()}
                        <span>{getStatusColors(selectedDoc.status).name}</span>
                      </div>
                      <span className={clsx(
                        'text-xs px-2 py-1 rounded',
                        getAreaColors(selectedDoc.area).bgColor,
                        getAreaColors(selectedDoc.area).textColor
                      )}>
                        {getAreaColors(selectedDoc.area).name}
                      </span>
                    </div>

                    {/* Main Document Info - Gray Background like cards */}
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border-l-2 border-primary-600">
                      {/* Document Title */}
                      <div className="mb-4">
                        <h4 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                          {selectedDoc.type} No. {selectedDoc.identifier}
                        </h4>
                      </div>

                      {/* Magistrado and Expediente */}
                      <div className="space-y-2 mb-4">
                        {selectedDoc.magistradoPonente && (
                          <div className="text-sm text-gray-600 dark:text-gray-300">
                            <span className="font-medium">Magistrado P.:</span> {selectedDoc.magistradoPonente}
                          </div>
                        )}
                        {selectedDoc.expediente && (
                          <div className="text-sm text-gray-600 dark:text-gray-300">
                            <span className="font-medium">Expediente No.:</span> {selectedDoc.expediente}
                          </div>
                        )}
                      </div>

                      {/* Tema */}
                      {selectedDoc.tema && (
                        <div className="pt-3 border-t border-gray-200 dark:border-gray-600 mb-4">
                          <span className="font-medium text-gray-900 dark:text-gray-100">Tema:</span>
                          <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{selectedDoc.tema}</p>
                        </div>
                      )}

                      {/* Resumen */}
                      {selectedDoc.summary && (
                        <div className="pt-3 border-t border-gray-200 dark:border-gray-600 mb-4">
                          <span className="font-medium text-gray-900 dark:text-gray-100">Resumen:</span>
                          <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 leading-relaxed">{selectedDoc.summary}</p>
                        </div>
                      )}

                      {/* Decisión */}
                      {selectedDoc.decision && (
                        <div className="pt-3 border-t border-gray-200 dark:border-gray-600">
                          <span className="font-medium text-gray-900 dark:text-gray-100">Decisión:</span>
                          <span className="text-sm text-gray-700 dark:text-gray-300 ml-2">{selectedDoc.decision}</span>
                        </div>
                      )}
                    </div>

                    {/* Dates - Outside gray background */}
                    <div className="space-y-1 text-xs text-gray-500 dark:text-gray-400">
                      <div>
                        <span><strong>Web Oficial:</strong> {new Date(selectedDoc.publicationDate).toLocaleDateString('es-ES', {
                          year: '2-digit',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true
                        })}</span>
                      </div>
                      <div>
                        <span><strong>Extracción:</strong> {new Date(selectedDoc.extractionDate).toLocaleDateString('es-ES', {
                          year: '2-digit',
                          month: '2-digit',
                          day: '2-digit', 
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true
                        })}</span>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Action Buttons - Minimalist style like cards */}
                <div className="border-t border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex flex-col space-y-3">
                    {selectedDoc.status === 'available' && (
                      <button
                        onClick={handleApprove}
                        disabled={isLoading}
                        className={clsx(
                          'px-4 py-2 text-sm text-primary-700 border border-primary-300 rounded-full transition-all duration-200',
                          'hover:bg-[#04315a] hover:border-[#3ff3f2] hover:text-[#3ff3f2]',
                          'disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2'
                        )}
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>{isLoading ? 'Procesando...' : 'Aprobar'}</span>
                      </button>
                    )}
                    
                    <button
                      onClick={handleReject}
                      disabled={isLoading}
                      className={clsx(
                        'px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-full transition-all duration-200',
                        'hover:bg-[#04315a] hover:border-[#3ff3f2] hover:text-[#3ff3f2]',
                        'disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2'
                      )}
                    >
                      <XCircle className="w-4 h-4" />
                      <span>{isLoading ? 'Procesando...' : 'Rechazar'}</span>
                    </button>
                    
                    <button
                      onClick={onClose}
                      disabled={isLoading}
                      className={clsx(
                        'px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-full transition-all duration-200',
                        'hover:bg-[#04315a] hover:border-[#3ff3f2] hover:text-[#3ff3f2]',
                        'disabled:opacity-50 disabled:cursor-not-allowed'
                      )}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}