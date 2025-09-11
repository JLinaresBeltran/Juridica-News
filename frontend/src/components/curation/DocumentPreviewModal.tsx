import { useState, useEffect } from 'react'
import { 
  X, 
  CheckCircle, 
  XCircle, 
  FileText
} from 'lucide-react'
import { clsx } from 'clsx'
import { getEntityColors, getStatusColors, getAreaColors } from '../../constants/entityColors'
import ArticleGenerator from '../generator/ArticleGenerator'
import ImageGenerator from '../generator/ImageGenerator'
import MetadataEditor from '../generator/MetadataEditor'
import PublishingPreview from '../generator/PublishingPreview'
import documentsService from '../../services/documentsService'

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
  // Campos del análisis IA
  magistradoPonente?: string
  salaRevision?: string
  expediente?: string
  numeroSentencia?: string
  temaPrincipal?: string
  resumenIA?: string
  decision?: string
}

interface GeneratedArticle {
  title: string
  titleStyle?: string
  content: string
  image?: string
  imagePrompt?: string
  metadata: {
    description: string
    keywords: string[]
    section: string
    customTags: string[]
    seoTitle: string
    readingTime: number
  }
}

interface DocumentPreviewModalProps {
  isOpen: boolean
  onClose: () => void
  document: Document | null
  onApprove?: (docId: string) => void
  onReject?: (docId: string) => void
  showActions?: boolean
  currentStep?: number
  onStepChange?: (step: number) => void
  mode?: 'preview' | 'generation' // 'preview' para pendientes, 'generation' para aprobados
}

// Ya no necesitamos esta definición - usamos el sistema centralizado

export function DocumentPreviewModal({ 
  isOpen, 
  onClose, 
  document: selectedDoc, 
  onApprove, 
  onReject,
  showActions = true,
  currentStep = 0,
  onStepChange,
  mode = 'generation'
}: DocumentPreviewModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedArticle, setGeneratedArticle] = useState<GeneratedArticle>({
    title: '',
    titleStyle: '',
    content: '',
    image: '',
    imagePrompt: '',
    metadata: {
      description: '',
      keywords: [],
      section: 'Constitucional',
      customTags: [],
      seoTitle: '',
      readingTime: 3
    }
  })
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  // Función helper para guardar el estado completo
  const saveCurrentState = (stepOverride?: number) => {
    if (!selectedDoc) return
    
    const storageKey = `article-draft-${selectedDoc.id}`
    
    // Crear una copia de los datos optimizada para localStorage
    const articleDataForStorage = {
      ...generatedArticle,
      // Permitir imágenes más grandes ahora que tenemos compresión (hasta 500KB)
      image: generatedArticle.image && generatedArticle.image.length > 500000 ? '[IMAGE_TOO_LARGE_FOR_STORAGE]' : generatedArticle.image,
      currentStep: stepOverride !== undefined ? stepOverride : currentStep,
      lastModified: new Date().toISOString()
    }
    
    try {
      localStorage.setItem(storageKey, JSON.stringify(articleDataForStorage))
      setLastSaved(new Date())
      console.log(`Estado completo guardado (paso ${articleDataForStorage.currentStep})`)
    } catch (error) {
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        console.warn('⚠️ LocalStorage quota exceeded, limpiando y reintentando')
        
        // Limpiar localStorage y reintentar
        cleanupLocalStorage()
        
        // Intentar guardar sin ninguna imagen
        const minimalData = {
          ...articleDataForStorage,
          image: undefined
        }
        try {
          localStorage.setItem(storageKey, JSON.stringify(minimalData))
          setLastSaved(new Date())
          console.log(`Estado mínimo guardado después de limpiar (paso ${minimalData.currentStep})`)
        } catch (secondError) {
          console.error('❌ No se pudo guardar ni el estado mínimo después de limpiar:', secondError)
        }
      } else {
        console.error('❌ Error guardando estado:', error)
      }
    }
  }

  // Función para limpiar localStorage si está lleno
  const cleanupLocalStorage = () => {
    try {
      // Obtener todas las claves relacionadas con drafts
      const draftKeys = Object.keys(localStorage).filter(key => key.startsWith('article-draft-'))
      console.log(`🧹 Limpiando ${draftKeys.length} drafts del localStorage`)
      
      // Eliminar todos los drafts viejos
      draftKeys.forEach(key => {
        localStorage.removeItem(key)
      })
      
      console.log('✅ LocalStorage limpiado')
    } catch (error) {
      console.error('❌ Error limpiando localStorage:', error)
    }
  }

  // Auto-save functionality
  useEffect(() => {
    if (!isOpen || !selectedDoc) return

    // Auto-save every 30 seconds if there's content
    const hasContent = generatedArticle.title || generatedArticle.content || 
                      generatedArticle.metadata.keywords.length > 0
    
    if (!hasContent) return

    const interval = setInterval(() => {
      saveCurrentState()
    }, 30000)

    return () => clearInterval(interval)
  }, [generatedArticle, currentStep, isOpen, selectedDoc])

  // Update metadata section when document changes
  useEffect(() => {
    if (selectedDoc?.area) {
      setGeneratedArticle(prev => ({
        ...prev,
        metadata: {
          ...prev.metadata,
          section: selectedDoc.area
        }
      }))
    }
  }, [selectedDoc?.area])

  // Load saved draft on open (only once when modal opens, not on step changes)
  useEffect(() => {
    if (!isOpen || !selectedDoc) return

    const storageKey = `article-draft-${selectedDoc.id}`
    const savedData = localStorage.getItem(storageKey)
    
    if (savedData) {
      try {
        const parsedDraft = JSON.parse(savedData)
        setGeneratedArticle(parsedDraft)
        // Solo restaurar el paso si el currentStep actual es 0 (inicio)
        if (onStepChange && parsedDraft.currentStep !== undefined && currentStep === 0) {
          onStepChange(parsedDraft.currentStep)
        }
        setLastSaved(new Date(parsedDraft.lastModified))
        console.log('✅ Borrador cargado desde localStorage')
      } catch (error) {
        console.error('Error parsing saved draft:', error)
      }
    }
  }, [isOpen, selectedDoc]) // Removido currentStep de las dependencias

  // Save state when stepping
  useEffect(() => {
    if (selectedDoc && isOpen) {
      saveCurrentState()
    }
  }, [currentStep])

  // Event handlers for each step
  const handleArticleGenerated = (article: string, style: string = '') => {
    setGeneratedArticle(prev => ({
      ...prev,
      content: article,
      titleStyle: style
    }))
  }

  const handleTitleSelected = (title: string, style: string = '') => {
    setGeneratedArticle(prev => ({
      ...prev,
      title,
      titleStyle: style
    }))
  }

  const handleImageGenerated = (imageUrl: string, prompt: string = '') => {
    setGeneratedArticle(prev => ({
      ...prev,
      image: imageUrl,
      imagePrompt: prompt
    }))
  }

  const handleMetadataChange = (metadata: GeneratedArticle['metadata']) => {
    setGeneratedArticle(prev => ({
      ...prev,
      metadata
    }))
  }

  const handlePublish = async (articleData: GeneratedArticle) => {
    if (!selectedDoc) return

    try {
      setIsGenerating(true)
      
      // Here you would typically call an API to publish the article
      console.log('Publishing article:', articleData)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Clear the draft after successful publish
      const storageKey = `article-draft-${selectedDoc.id}`
      localStorage.removeItem(storageKey)
      
      // Close modal
      onClose()
      
    } catch (error) {
      console.error('Error publishing article:', error)
    } finally {
      setIsGenerating(false)
    }
  }

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
    if (!selectedDoc || !onApprove) return
    
    setIsLoading(true)
    try {
      // Verificar si hay un artículo generado completo
      const hasGeneratedArticle = generatedArticle.title && generatedArticle.content;
      
      console.log('🎯 Aprobando documento:', {
        id: selectedDoc.id,
        hasGeneratedArticle,
        articleTitle: generatedArticle.title?.substring(0, 50),
        contentLength: generatedArticle.content?.length || 0
      });

      // Si hay artículo generado, pasar los datos junto con la aprobación
      if (hasGeneratedArticle) {
        await onApprove(selectedDoc.id, {
          title: generatedArticle.title,
          content: generatedArticle.content,
          image: generatedArticle.image,
          keywords: generatedArticle.metadata.keywords.join(', '),
          metaTitle: generatedArticle.metadata.metaTitle,
          publicationSection: generatedArticle.metadata.publicationSection
        });
      } else {
        await onApprove(selectedDoc.id);
      }
      
      // No cerramos aquí, dejamos que CurationPage maneje el cierre
    } catch (error) {
      console.error('Error approving document:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleReject = async () => {
    if (!selectedDoc || !onReject) return
    
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

            {/* Floating Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 p-2 hover:bg-black hover:bg-opacity-10 dark:hover:bg-white dark:hover:bg-opacity-10 rounded-lg transition-colors text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
              disabled={isLoading}
            >
              <X className="w-6 h-6" />
            </button>

            {/* Article Generation Progress Bar - Solo mostrar en modo generation */}
            {mode === 'generation' && (
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">

                {/* Progress Steps */}
                <div className="flex items-center justify-center space-x-2">
                {[
                  { id: 'preview', name: 'Previsualización', description: 'Vista dividida de trabajo' },
                  { id: 'article', name: 'Artículo', description: 'Generar y editar artículo' },
                  { id: 'image', name: 'Imagen', description: 'Generar imagen principal' },
                  { id: 'metadata', name: 'Metadata', description: 'Configurar SEO y etiquetas' },
                  { id: 'publish', name: 'Aprobar', description: 'Revisión final y aprobación' }
                ].map((step, index) => (
                  <div key={step.id} className="flex items-center">
                    <div className="flex flex-col items-center">
                      <button
                        onClick={() => onStepChange && onStepChange(index)}
                        className={clsx(
                          'w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-medium transition-colors hover:scale-105',
                          index < currentStep 
                            ? 'bg-green-500 border-green-500 text-white' // Completado
                            : index === currentStep 
                            ? 'bg-[#04315a] border-[#04315a] text-white' // Actual
                            : 'border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500 hover:border-gray-400' // Pendiente
                        )}
                        title={step.description}
                        disabled={!onStepChange}
                      >
                        {index < currentStep ? (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          index + 1
                        )}
                      </button>
                      <div className={clsx(
                        'mt-1 text-xs font-medium',
                        index < currentStep 
                          ? 'text-green-600 dark:text-green-400' // Completado
                          : index === currentStep 
                          ? 'text-[#04315a] dark:text-[#3ff3f2]' // Actual
                          : 'text-gray-400 dark:text-gray-500' // Pendiente
                      )}>
                        {step.name}
                      </div>
                    </div>
                    {index < 4 && (
                      <div className={clsx(
                        'w-8 h-0.5 mx-2 mt-[-16px]',
                        index < currentStep 
                          ? 'bg-green-500' // Línea completada
                          : 'bg-gray-300 dark:bg-gray-600' // Línea pendiente
                      )} />
                    )}
                  </div>
                ))}
              </div>
            </div>
            )}

            {/* Content - Changes based on current step */}
            <div className="flex-1 flex overflow-hidden">

              {/* Modo Preview: Solo previsualización para Pendientes */}
              {mode === 'preview' && (
                <>
                  {/* Document Preview - 65% width */}
                  <div className="w-[65%] bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col">
                    <div className="flex-1 overflow-auto p-6">
                      {selectedDoc.url ? (
                        <div className="h-full">
                          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600 h-full flex flex-col">
                            {/* PDF Viewer Header - Solo título */}
                            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-750 rounded-t-lg">
                              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">Vista Previa del Documento</h4>
                            </div>
                            
                            {/* PDF Content */}
                            <div className="flex-1 bg-gray-100 dark:bg-gray-800">
                              <iframe
                                src={`https://docs.google.com/gview?url=${encodeURIComponent(selectedDoc.url)}&embedded=true`}
                                className="w-full h-full"
                                title={`Vista previa de ${selectedDoc.title}`}
                                onError={(e) => {
                                  const iframe = e.target as HTMLIFrameElement;
                                  iframe.style.display = 'none';
                                  const parent = iframe.parentElement;
                                  if (parent) {
                                    parent.innerHTML = `
                                      <div class="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400 p-8">
                                        <svg class="w-16 h-16 mb-4" fill="currentColor" viewBox="0 0 20 20">
                                          <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clip-rule="evenodd"></path>
                                        </svg>
                                        <h4 class="text-lg font-medium mb-2 text-gray-900 dark:text-gray-100">Vista previa no disponible</h4>
                                        <p class="text-center text-gray-600 dark:text-gray-300 mb-4">No se puede mostrar la vista previa del documento en este momento.</p>
                                        <button 
                                          onclick="window.open('${selectedDoc.url}', '_blank')"
                                          class="inline-flex items-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                                        >
                                          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                                          </svg>
                                          Ver Documento
                                        </button>
                                      </div>
                                    `;
                                  }
                                }}
                              />
                            </div>
                          </div>
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

                  {/* Metadata Panel - 35% width */}
                  <div className="w-[35%] bg-white dark:bg-gray-800 flex flex-col">
                    <div className="flex-1 overflow-auto p-4">
                      <div className="space-y-4">
                        {/* All the metadata sections */}
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

                        {/* Main Document Info */}
                        <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border-l-2 border-primary-600">
                          <div className="mb-3">
                            <h4 className="font-semibold text-base text-gray-900 dark:text-gray-100">
                              {selectedDoc.numeroSentencia || `${selectedDoc.type} No. ${selectedDoc.identifier}`}
                            </h4>
                          </div>
                          <div className="space-y-1.5 mb-3">
                            {selectedDoc.magistradoPonente && (
                              <div className="text-xs text-gray-600 dark:text-gray-300">
                                <span className="font-medium">Magistrado P.:</span> {selectedDoc.magistradoPonente}
                              </div>
                            )}
                            {selectedDoc.salaRevision && (
                              <div className="text-xs text-gray-600 dark:text-gray-300">
                                <span className="font-medium">Sala de Revisión:</span> {selectedDoc.salaRevision}
                              </div>
                            )}
                            {selectedDoc.expediente && (
                              <div className="text-xs text-gray-600 dark:text-gray-300">
                                <span className="font-medium">No. de expediente:</span> {selectedDoc.expediente}
                              </div>
                            )}
                          </div>
                          {selectedDoc.temaPrincipal && (
                            <div className="pt-2 border-t border-gray-200 dark:border-gray-600 mb-3">
                              <span className="font-medium text-sm text-gray-900 dark:text-gray-100">Tema Principal:</span>
                              <p className="text-xs text-gray-700 dark:text-gray-300 mt-1 leading-relaxed">{selectedDoc.temaPrincipal}</p>
                            </div>
                          )}
                          {(selectedDoc.resumenIA || selectedDoc.summary) && (
                            <div className="pt-2 border-t border-gray-200 dark:border-gray-600 mb-3">
                              <span className="font-medium text-sm text-gray-900 dark:text-gray-100">Resumen:</span>
                              <p className="text-xs text-gray-700 dark:text-gray-300 mt-1 leading-relaxed">
                                {selectedDoc.resumenIA || selectedDoc.summary}
                              </p>
                            </div>
                          )}
                          {selectedDoc.decision && (
                            <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
                              <span className="font-medium text-sm text-gray-900 dark:text-gray-100">Decisión:</span>
                              <span className="text-xs text-gray-700 dark:text-gray-300 ml-2">{selectedDoc.decision}</span>
                            </div>
                          )}
                        </div>

                        {/* Action Buttons para modo preview */}
                        {showActions && (
                          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <div className="flex flex-col space-y-2">
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
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Modo Generation: Pasos completos para Aprobados */}
              {mode === 'generation' && currentStep === 0 && (
                <>
                  {/* Document Preview - 65% width */}
                  <div className="w-[65%] bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col">
                    <div className="flex-1 overflow-auto p-6">
                      {selectedDoc.url ? (
                        <div className="h-full">
                          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600 h-full flex flex-col">
                            {/* PDF Viewer Header - Solo título */}
                            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-750 rounded-t-lg">
                              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">Vista Previa del Documento</h4>
                            </div>
                            
                            {/* PDF Content */}
                            <div className="flex-1 bg-gray-100 dark:bg-gray-800">
                              <iframe
                                src={`https://docs.google.com/gview?url=${encodeURIComponent(selectedDoc.url)}&embedded=true`}
                                className="w-full h-full"
                                title={`Vista previa de ${selectedDoc.title}`}
                                onError={(e) => {
                                  const iframe = e.target as HTMLIFrameElement;
                                  iframe.style.display = 'none';
                                  const parent = iframe.parentElement;
                                  if (parent) {
                                    parent.innerHTML = `
                                      <div class="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400 p-8">
                                        <svg class="w-16 h-16 mb-4" fill="currentColor" viewBox="0 0 20 20">
                                          <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clip-rule="evenodd"></path>
                                        </svg>
                                        <h4 class="text-lg font-medium mb-2 text-gray-900 dark:text-gray-100">Vista previa no disponible</h4>
                                        <p class="text-center text-gray-600 dark:text-gray-300 mb-4">No se puede mostrar la vista previa del documento en este momento.</p>
                                        <button 
                                          onclick="window.open('${selectedDoc.url}', '_blank')"
                                          class="inline-flex items-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                                        >
                                          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                                          </svg>
                                          Ver Documento
                                        </button>
                                      </div>
                                    `;
                                  }
                                }}
                              />
                            </div>
                          </div>
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

                  {/* Metadata Panel - 35% width */}
                  <div className="w-[35%] bg-white dark:bg-gray-800 flex flex-col">
                    <div className="flex-1 overflow-auto p-4">
                      <div className="space-y-4">
                        {/* All the metadata sections */}
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

                        {/* Main Document Info */}
                        <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border-l-2 border-primary-600">
                          <div className="mb-3">
                            <h4 className="font-semibold text-base text-gray-900 dark:text-gray-100">
                              {selectedDoc.numeroSentencia || `${selectedDoc.type} No. ${selectedDoc.identifier}`}
                            </h4>
                          </div>
                          <div className="space-y-1.5 mb-3">
                            {selectedDoc.magistradoPonente && (
                              <div className="text-xs text-gray-600 dark:text-gray-300">
                                <span className="font-medium">Magistrado P.:</span> {selectedDoc.magistradoPonente}
                              </div>
                            )}
                            {selectedDoc.salaRevision && (
                              <div className="text-xs text-gray-600 dark:text-gray-300">
                                <span className="font-medium">Sala de Revisión:</span> {selectedDoc.salaRevision}
                              </div>
                            )}
                            {selectedDoc.expediente && (
                              <div className="text-xs text-gray-600 dark:text-gray-300">
                                <span className="font-medium">No. de expediente:</span> {selectedDoc.expediente}
                              </div>
                            )}
                          </div>
                          {selectedDoc.temaPrincipal && (
                            <div className="pt-2 border-t border-gray-200 dark:border-gray-600 mb-3">
                              <span className="font-medium text-sm text-gray-900 dark:text-gray-100">Tema Principal:</span>
                              <p className="text-xs text-gray-700 dark:text-gray-300 mt-1 leading-relaxed">{selectedDoc.temaPrincipal}</p>
                            </div>
                          )}
                          {(selectedDoc.resumenIA || selectedDoc.summary) && (
                            <div className="pt-2 border-t border-gray-200 dark:border-gray-600 mb-3">
                              <span className="font-medium text-sm text-gray-900 dark:text-gray-100">Resumen:</span>
                              <p className="text-xs text-gray-700 dark:text-gray-300 mt-1 leading-relaxed">
                                {selectedDoc.resumenIA || selectedDoc.summary}
                              </p>
                            </div>
                          )}
                          {selectedDoc.decision && (
                            <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
                              <span className="font-medium text-sm text-gray-900 dark:text-gray-100">Decisión:</span>
                              <span className="text-xs text-gray-700 dark:text-gray-300 ml-2">{selectedDoc.decision}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Paso 1: Generación de artículo */}
              {mode === 'generation' && currentStep === 1 && selectedDoc && (
                <div className="w-full h-full bg-white dark:bg-gray-800">
                  <div className="p-6 h-full overflow-auto w-full">
                    <ArticleGenerator
                      document={selectedDoc}
                      onArticleGenerated={handleArticleGenerated}
                      onTitleSelected={handleTitleSelected}
                      generatedArticle={generatedArticle.content}
                      selectedTitle={generatedArticle.title}
                    />
                  </div>
                </div>
              )}

              {/* Paso 2: Generación de imagen */}
              {mode === 'generation' && currentStep === 2 && selectedDoc && (
                <div className="w-full h-full bg-white dark:bg-gray-800">
                  <div className="p-6 h-full overflow-auto w-full">
                    <ImageGenerator
                      document={selectedDoc}
                      onImageGenerated={handleImageGenerated}
                      generatedImage={generatedArticle.image}
                      articleContent={generatedArticle.content}
                    />
                  </div>
                </div>
              )}

              {/* Paso 3: Editor de metadata */}
              {mode === 'generation' && currentStep === 3 && selectedDoc && (
                <div className="h-full bg-white dark:bg-gray-800">
                  <div className="p-6 h-full overflow-auto">
                    <MetadataEditor
                      document={selectedDoc}
                      articleTitle={generatedArticle.title}
                      onMetadataChange={handleMetadataChange}
                      initialMetadata={generatedArticle.metadata}
                    />
                  </div>
                </div>
              )}

              {/* Paso 4: Vista previa y publicación */}
              {mode === 'generation' && currentStep === 4 && selectedDoc && (
                <div className="h-full bg-white dark:bg-gray-800">
                  <div className="p-6 h-full overflow-auto">
                    <PublishingPreview
                      document={selectedDoc}
                      generatedArticle={generatedArticle}
                      onPublish={handlePublish}
                      isPublishing={isGenerating}
                    />
                  </div>
                </div>
              )}

              {/* Fallback para pasos sin documento o casos inesperados */}
              {(mode === 'generation' && currentStep > 0 && !selectedDoc) && (
                <div className="h-full bg-white dark:bg-gray-800 flex items-center justify-center">
                  <div className="text-center">
                    <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Documento no disponible</h4>
                    <p className="text-gray-500 dark:text-gray-400">No se puede procesar el paso sin un documento seleccionado</p>
                  </div>
                </div>
              )}

            </div>

            {/* Action Buttons - Solo mostrar si showActions es true y en modo generation */}
            {showActions && mode === 'generation' && (
              <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                <div className="flex flex-col space-y-2">
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
            )}
          </div>
        </div>
      </div>
    </div>
  )
}