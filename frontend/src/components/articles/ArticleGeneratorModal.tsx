import { useState, useEffect } from 'react'
import { 
  X, 
  FileText, 
  Eye, 
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Save,
  Scale,
  Building,
  User,
  Calendar,
  ExternalLink,
  AlertCircle
} from 'lucide-react'
import { clsx } from 'clsx'
import { getEntityColors } from '../../constants/entityColors'
import TitleGenerator from '../generator/TitleGenerator'
import ImageGenerator from '../generator/ImageGenerator'
import MetadataEditor from '../generator/MetadataEditor'
import PublishingPreview from '../generator/PublishingPreview'
import ModelSelector, { AIModel } from '../common/ModelSelector'
import documentsService from '../../services/documentsService'
import aiService from '../../services/aiService'

interface Document {
  id: string
  title: string
  source: string
  type: string
  identifier: string
  area: string
  summary?: string
  url?: string
  publicationDate: string
  extractionDate: string
  approvedAt?: string
}

interface ArticleGeneratorModalProps {
  isOpen: boolean
  onClose: () => void
  document: Document | null
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
    customTags?: string[]
    seoTitle?: string
    readingTime?: number
  }
}

const GENERATION_STEPS = [
  { id: 'preview', name: 'Previsualización', description: 'Vista dividida de trabajo' },
  { id: 'titles', name: 'Títulos', description: 'Generar opciones de títulos' },
  { id: 'image', name: 'Imagen', description: 'Generar imagen principal' },
  { id: 'metadata', name: 'Metadata', description: 'Configurar SEO y etiquetas' },
  { id: 'publish', name: 'Aprobar', description: 'Revisión final y aprobación' }
]

export default function ArticleGeneratorModal({ 
  isOpen, 
  onClose, 
  document 
}: ArticleGeneratorModalProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedModel, setSelectedModel] = useState<AIModel>('gpt4o-mini')
  const [generationError, setGenerationError] = useState<string | null>(null)
  const [generatedArticle, setGeneratedArticle] = useState<GeneratedArticle>({
    title: '',
    titleStyle: '',
    content: '',
    image: '',
    imagePrompt: '',
    metadata: {
      description: '',
      keywords: [],
      section: document?.area || 'Constitucional',
      customTags: [],
      seoTitle: '',
      readingTime: 3
    }
  })
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [documentContent, setDocumentContent] = useState<string>('')
  const [isLoadingContent, setIsLoadingContent] = useState(false)
  const [showModelSelector, setShowModelSelector] = useState(false)
  const [justGenerated, setJustGenerated] = useState(false)

  // Ya no necesitamos cargar contenido específico, el iframe renderizará el PDF directamente

  // Función helper para guardar el estado completo
  const saveCurrentState = (stepOverride?: number) => {
    if (!document) return
    
    const storageKey = `article-draft-${document.id}`
    const articleData = {
      ...generatedArticle,
      currentStep: stepOverride !== undefined ? stepOverride : currentStep,
      lastModified: new Date().toISOString()
    }
    
    localStorage.setItem(storageKey, JSON.stringify(articleData))
    setLastSaved(new Date())
    console.log(`Estado completo guardado (paso ${articleData.currentStep})`)
  }

  // Auto-save functionality
  useEffect(() => {
    if (!isOpen || !document) return

    // Auto-save every 30 seconds if there's content
    const hasContent = generatedArticle.title || generatedArticle.content || 
                      generatedArticle.metadata.keywords.length > 0
    
    if (hasContent) {
      const autoSaveInterval = setInterval(() => {
        console.log('Auto-saving...')
        saveCurrentState()
      }, 30000) // 30 segundos
      return () => clearInterval(autoSaveInterval)
    }
  }, [isOpen, document]) // Remover generatedArticle y currentStep para evitar bucle

  // Load saved draft when modal opens
  useEffect(() => {
    if (isOpen && document) {
      const storageKey = `article-draft-${document.id}`
      const savedDraft = localStorage.getItem(storageKey)
      
      if (savedDraft) {
        try {
          const parsedDraft = JSON.parse(savedDraft)
          setGeneratedArticle({
            title: parsedDraft.title || '',
            titleStyle: parsedDraft.titleStyle || '',
            content: parsedDraft.content || '',
            image: parsedDraft.image || '',
            imagePrompt: parsedDraft.imagePrompt || '',
            metadata: parsedDraft.metadata || {
              description: '',
              keywords: [],
              section: document?.area || 'Constitucional',
              customTags: [],
              seoTitle: '',
              readingTime: 5
            }
          })
          setCurrentStep(parsedDraft.currentStep || 0)
          setLastSaved(new Date(parsedDraft.lastModified))
          setJustGenerated(parsedDraft.justGenerated || false)
          console.log('Borrador cargado desde localStorage')
        } catch (error) {
          console.error('Error cargando borrador:', error)
          // Reset to default if parsing fails
          setCurrentStep(0)
          setGeneratedArticle({
            title: '',
            titleStyle: '',
            content: '',
            image: '',
            imagePrompt: '',
            metadata: {
              description: '',
              keywords: [],
              section: document?.area || 'Constitucional',
              customTags: [],
              seoTitle: '',
              readingTime: 5
            }
          })
        }
      } else {
        // Reset to default if no saved draft
        setCurrentStep(0)
        setGeneratedArticle({
          title: '',
          titleStyle: '',
          content: '',
          image: '',
          imagePrompt: '',
          metadata: {
            description: '',
            keywords: [],
            section: document?.area || 'Constitucional',
            customTags: [],
            seoTitle: '',
            readingTime: 3
          }
        })
      }
    }
  }, [isOpen, document])

  const handleStepClick = (stepIndex: number) => {
    console.log('🎯 STEP CLICK:', { stepIndex, currentStep, stepName: GENERATION_STEPS[stepIndex]?.name })
    
    // Permitir navegación libre entre pasos
    setCurrentStep(stepIndex)
    
    // Guardar inmediatamente el paso actual
    saveCurrentState(stepIndex)
  }

  const handleStartGeneration = async () => {
    console.log('🎯 BOTÓN GENERAR ARTÍCULO CLICKEADO')
    console.log('🔍 Estado inicial:', {
      selectedModel,
      isGenerating,
      document: document?.id
    })

    if (!selectedModel) {
      console.log('❌ No hay modelo seleccionado - mostrando selector')
      setShowModelSelector(true)
      return
    }

    if (!document?.id) {
      console.log('❌ No hay documento seleccionado')
      setGenerationError('No se ha seleccionado un documento')
      return
    }

    console.log('🚀 INICIANDO GENERACIÓN DE ARTÍCULO')
    console.log('📄 Documento completo:', document)
    console.log('🤖 Modelo seleccionado:', selectedModel)

    setIsGenerating(true)
    setGenerationError(null)
    setJustGenerated(false) // Reset indicador de generación
    
    try {
      console.log('🔗 Llamando a aiService.generateArticle...')
      
      // Llamada real a la API para generar artículo
      const result = await aiService.generateArticle({
        documentId: document!.id,
        model: selectedModel,
        maxWords: 500,
        tone: 'professional',
        customInstructions: 'Enfócate en las implicaciones prácticas para abogados colombianos'
      })
      
      console.log('✅ RESPUESTA DE API RECIBIDA:', {
        wordCount: result.wordCount,
        modelUsed: result.modelUsed,
        contentLength: result.content.length,
        hasContent: !!result.content
      })
      
      // Actualizar el artículo generado con datos reales
      const newGeneratedArticle = {
        ...generatedArticle,
        content: result.content,
        metadata: {
          ...generatedArticle.metadata,
          description: `Análisis detallado de ${document?.identifier}`,
          keywords: [document?.area.toLowerCase() || '', 'jurisprudencia', 'análisis legal'],
          seoTitle: `Análisis jurídico: ${document?.title}`,
          readingTime: Math.ceil(result.wordCount / 200) // Estimación de lectura
        }
      }
      
      setGeneratedArticle(newGeneratedArticle)
      setJustGenerated(true)
      
      // Guardar inmediatamente el contenido generado (sobrescribir localStorage)
      const storageKey = `article-draft-${document!.id}`
      localStorage.setItem(storageKey, JSON.stringify({
        ...newGeneratedArticle,
        currentStep,
        lastModified: new Date().toISOString(),
        justGenerated: true
      }))
      setLastSaved(new Date())
      
      // Resetear el indicador después de unos segundos
      setTimeout(() => setJustGenerated(false), 3000)

      console.log(`✅ ARTÍCULO GUARDADO EN ESTADO: ${result.wordCount} palabras con ${result.modelUsed}`)
      console.log('📝 CONTENIDO EN EL ESTADO:', {
        contentPreview: result.content.substring(0, 200) + '...',
        fullLength: result.content.length,
        state: 'UPDATED_SUCCESSFULLY'
      })
      
    } catch (error) {
      console.error('❌ ERROR GENERANDO ARTÍCULO:', error)
      console.error('❌ Detalles del error:', {
        message: error instanceof Error ? error.message : 'Error desconocido',
        stack: error instanceof Error ? error.stack : undefined,
        type: typeof error
      })
      setGenerationError(error instanceof Error ? aiService.formatErrorMessage(error) : 'Error desconocido')
    } finally {
      console.log('🏁 Finalizando generación...')
      setIsGenerating(false)
    }
  }

  // Handlers para los componentes
  const handleTitleSelected = (title: string, style: string) => {
    setGeneratedArticle(prev => {
      const updated = {
        ...prev,
        title,
        titleStyle: style,
        metadata: {
          ...prev.metadata,
          seoTitle: title
        }
      }
      
      // Guardar inmediatamente después del cambio
      // setTimeout(() => saveCurrentState(), 100) // Comentado para evitar bucle
      
      return updated
    })
  }

  const handleImageGenerated = (imageUrl: string, prompt: string) => {
    setGeneratedArticle(prev => {
      const updated = {
        ...prev,
        image: imageUrl,
        imagePrompt: prompt
      }
      
      // Guardar inmediatamente después del cambio
      // setTimeout(() => saveCurrentState(), 100) // Comentado para evitar bucle
      
      return updated
    })
  }

  const handleMetadataChange = (metadata: any) => {
    setGeneratedArticle(prev => {
      const updated = {
        ...prev,
        metadata: {
          ...prev.metadata,
          ...metadata
        }
      }
      
      // Guardar inmediatamente después del cambio
      // setTimeout(() => saveCurrentState(), 100) // Comentado para evitar bucle
      
      return updated
    })
  }

  const handlePublish = async (publishData: any) => {
    console.log('Artículo publicado:', {
      article: generatedArticle,
      publishData,
      sourceDocument: document
    })
    // TODO: Llamada a API de publicación
    onClose()
  }

  if (!isOpen || !document) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      
      <div className="fixed inset-0 overflow-hidden">
        <div className="flex items-center justify-center min-h-full p-2">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-[98vw] h-[98vh] flex flex-col">
            
            {/* Header con información del documento en tarjetas */}
            <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 relative">
              {/* Botón cerrar estilo macOS absoluto */}
              <button
                onClick={onClose}
                className="absolute left-3 top-3 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors group z-20"
              >
                <X className="w-2 h-2 text-black opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
              
              <div className="flex space-x-4">
                {/* Primera tarjeta: Fuente, Documento, Área y Magistrado P. - Con circunferencia para el botón */}
                <div 
                  className="w-[40%] bg-white dark:bg-gray-700 p-3 border dark:border-gray-600 shadow-sm relative"
                  style={{
                    borderTopLeftRadius: '0px',
                    borderTopRightRadius: '8px',
                    borderBottomLeftRadius: '8px',
                    borderBottomRightRadius: '8px',
                    clipPath: 'polygon(0 20px, 20px 0, 100% 0, 100% 100%, 0 100%)'
                  }}
                >
                  <div className="grid grid-cols-2 gap-3 ml-6 items-center h-full">
                    {/* Fuente */}
                    <div className="flex items-center space-x-2">
                      <div className={`p-1.5 rounded ${getEntityColors(document.source).bgColor} ${getEntityColors(document.source).darkBgColor}`}>
                        <Scale className={`w-3 h-3 ${getEntityColors(document.source).textColor} ${getEntityColors(document.source).darkTextColor}`} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs text-gray-500 dark:text-gray-400">Fuente</div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {document.source.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </div>
                      </div>
                    </div>

                    {/* Documento */}
                    <div className="flex items-center space-x-2">
                      <div className="p-1.5 bg-primary-100 dark:bg-primary-900 rounded">
                        <FileText className="w-3 h-3 text-primary-600 dark:text-primary-300" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs text-gray-500 dark:text-gray-400">Documento</div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {document.identifier}
                        </div>
                      </div>
                    </div>

                    {/* Área */}
                    <div className="flex items-center space-x-2">
                      <div className="p-1.5 bg-primary-100 dark:bg-primary-900 rounded">
                        <Building className="w-3 h-3 text-primary-600 dark:text-primary-300" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs text-gray-500 dark:text-gray-400">Área</div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {document.area}
                        </div>
                      </div>
                    </div>

                    {/* Magistrado Ponente */}
                    <div className="flex items-center space-x-2">
                      <div className="p-1.5 bg-primary-100 dark:bg-primary-900 rounded">
                        <User className="w-3 h-3 text-primary-600 dark:text-primary-300" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs text-gray-500 dark:text-gray-400">Magistrado P.</div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {document.magistradoPonente || 'No especificado'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Segunda tarjeta: Tema, Resumen y Decisión - Más ancha */}
                <div className="w-[60%] bg-white dark:bg-gray-700 p-3 rounded-lg border dark:border-gray-600 shadow-sm">
                  <div className="space-y-3">
                    {/* Tema */}
                    <div className="flex items-start space-x-2">
                      <div className="p-1.5 bg-primary-100 dark:bg-primary-900 rounded mt-0.5 flex items-center justify-center min-w-[24px] h-6">
                        <span className="text-xs font-bold text-primary-600 dark:text-primary-300">T</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2">
                          {document.title}
                        </div>
                      </div>
                    </div>

                    {/* Resumen - Priorizar resumen IA */}
                    {(document.resumenIA || document.summary) && (
                      <div className="flex items-start space-x-2">
                        <div className="p-1.5 bg-primary-100 dark:bg-primary-900 rounded mt-0.5 flex items-center justify-center min-w-[24px] h-6">
                          <span className="text-xs font-bold text-primary-600 dark:text-primary-300">R</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-gray-700 dark:text-gray-300 line-clamp-3 leading-relaxed">
                            {document.resumenIA || document.summary}
                            {document.resumenIA && (
                              <span className="ml-2 px-1 py-0.5 text-xs bg-green-100 text-green-700 rounded">IA</span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Decisión */}
                    <div className="flex items-start space-x-2">
                      <div className="p-1.5 bg-primary-100 dark:bg-primary-900 rounded mt-0.5 flex items-center justify-center min-w-[24px] h-6">
                        <span className="text-xs font-bold text-primary-600 dark:text-primary-300">D</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {document.decision || `${document.type} ${document.identifier}`}
                          {document.decision && (
                            <span className="ml-2 px-1 py-0.5 text-xs bg-purple-100 text-purple-700 rounded">IA</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Contenido del paso actual */}
            <div className="flex-1 overflow-hidden">
              {currentStep === 0 && (
                <div className="h-full flex flex-col">
                  {/* Vista dividida desde el inicio */}
                  <div className="flex-1 flex">
                    {/* Panel izquierdo - Editor de artículo */}
                    <div className="w-1/2 border-r border-gray-200 dark:border-gray-700 flex flex-col">
                      <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm">Editor de Artículo</h4>
                          {selectedModel && (
                            <span className="text-xs bg-[#04315a] text-[#3ff3f2] px-2 py-1 rounded-full">
                              {selectedModel === 'gpt4o-mini' ? 'GPT-4o Mini' : 'Gemini'}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setShowModelSelector(true)}
                            className="flex items-center space-x-1 px-2 py-1 rounded text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                          >
                            <span>{selectedModel ? 'Cambiar modelo' : 'Seleccionar modelo'}</span>
                          </button>
                          <button
                            onClick={handleStartGeneration}
                            disabled={isGenerating}
                            className={clsx(
                              'flex items-center space-x-2 px-2 py-1 rounded text-xs font-medium transition-all duration-200',
                              isGenerating
                                ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                                : 'bg-[#04315a] text-[#3ff3f2] hover:bg-[#062847] shadow-sm hover:shadow-md'
                            )}
                          >
                            {isGenerating ? (
                              <>
                                <div className="animate-spin rounded-full h-2.5 w-2.5 border-b-2 border-gray-400 dark:border-gray-500"></div>
                                <span>Generando...</span>
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-2.5 h-2.5" />
                                <span>Generar Artículo</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                      <div className="flex-1 p-3 flex flex-col">
                        {/* Error de generación */}
                        {generationError && (
                          <div className="mb-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                            <div className="flex items-start space-x-2">
                              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                              <div className="text-sm text-red-700 dark:text-red-300">
                                <p className="font-medium">Error al generar artículo</p>
                                <p className="mt-1">{generationError}</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Indicador de generación exitosa */}
                        {justGenerated && generatedArticle.content && (
                          <div className="mb-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                            <div className="flex items-start space-x-2">
                              <Sparkles className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                              <div className="text-sm text-green-700 dark:text-green-300">
                                <p className="font-medium">¡Artículo generado exitosamente!</p>
                                <p className="mt-1">Contenido generado con IA - {generatedArticle.content.length} caracteres</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Campo de contenido */}
                        <textarea
                          value={generatedArticle.content}
                          onChange={(e) => {
                            setGeneratedArticle(prev => ({
                              ...prev,
                              content: e.target.value
                            }))
                            // Guardar después de un pequeño delay para evitar múltiples guardados
                            // setTimeout(() => saveCurrentState(), 500) // Comentado para evitar bucle
                          }}
                          className="w-full flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#04315a] focus:border-[#04315a] resize-none text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                          placeholder={selectedModel ? "Haz clic en 'Generar Artículo' para comenzar o escribe directamente aquí..." : "Primero selecciona un modelo de IA para generar el artículo..."}
                        />
                      </div>
                    </div>

                    {/* Panel derecho - Visor PDF */}
                    <div className="w-1/2 flex flex-col">
                      <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm">Documento Original</h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400">{document.type} {document.identifier}</p>
                      </div>
                      <div className="flex-1 p-3 bg-gray-100 dark:bg-gray-800">
                        <div className="h-full bg-white dark:bg-gray-700 rounded-lg border dark:border-gray-600 flex flex-col">
                          {/* Header con info del documento */}
                          <div className="flex-shrink-0 px-3 py-2 border-b border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800">
                            <div className="flex items-center justify-between">
                              <div className="text-xs text-gray-600 dark:text-gray-400">
                                Vista previa del documento PDF
                              </div>
                              {document.url && (
                                <a 
                                  href={document.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                >
                                  Abrir original
                                </a>
                              )}
                            </div>
                          </div>
                          
                          {/* Visor PDF del documento original */}
                          <div className="flex-1 bg-white dark:bg-gray-800 overflow-hidden">
                            {document.url ? (
                              <iframe
                                src={document.url}
                                className="w-full h-full border-0"
                                title={`Documento PDF: ${document.identifier}`}
                              />
                            ) : (
                              <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                                <FileText className="w-16 h-16 text-gray-400 mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                                  PDF no disponible
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                  No se encontró la URL del documento original
                                </p>
                                {/* Información básica como fallback */}
                                <div className="max-w-sm space-y-3 text-left">
                                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                                    <div className="font-medium text-blue-900 dark:text-blue-100">
                                      {document.numeroSentencia || `${document.type} ${document.identifier}`}
                                    </div>
                                  </div>
                                  {document.magistradoPonente && (
                                    <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded text-sm">
                                      <strong>Magistrado Ponente:</strong> {document.magistradoPonente}
                                    </div>
                                  )}
                                  {document.temaPrincipal && (
                                    <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded text-sm">
                                      <strong>Tema Principal:</strong> {document.temaPrincipal}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Paso 1: Generación de títulos */}
              {currentStep === 1 && (
                <div className="p-4 h-full overflow-auto">
                  <TitleGenerator
                    document={document}
                    onTitleSelected={handleTitleSelected}
                    selectedTitle={generatedArticle.title}
                  />
                </div>
              )}

              {/* Paso 2: Generación de imagen */}
              {currentStep === 2 && (
                <div className="p-4 h-full overflow-auto">
                  <ImageGenerator
                    document={document}
                    onImageGenerated={handleImageGenerated}
                    generatedImage={generatedArticle.image}
                    articleContent={generatedArticle.content}
                  />
                </div>
              )}

              {/* Paso 3: Editor de metadata */}
              {currentStep === 3 && (
                <div className="p-4 h-full overflow-auto">
                  <MetadataEditor
                    document={document}
                    articleTitle={generatedArticle.title}
                    onMetadataChange={handleMetadataChange}
                    initialMetadata={generatedArticle.metadata}
                  />
                </div>
              )}

              {/* Paso 4: Vista previa y publicación */}
              {currentStep === 4 && (
                <div className="p-4 h-full overflow-auto">
                  <PublishingPreview
                    document={document}
                    generatedArticle={generatedArticle}
                    onPublish={handlePublish}
                  />
                </div>
              )}
            </div>

            {/* Barra de progreso en la parte inferior */}
            <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-6 py-4">
              <div className="flex items-end justify-between">
                {/* Guardado automáticamente en la esquina inferior izquierda */}
                <div className="self-end">
                  {lastSaved && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Guardado automáticamente: {lastSaved.toLocaleTimeString('es-ES', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  )}
                </div>
                
                {/* Pasos centrados */}
                <div className="flex items-end justify-center space-x-4">
                {GENERATION_STEPS.map((step, index) => (
                  <div key={step.id} className="flex items-center">
                    <div className="flex flex-col items-center space-y-2">
                      <div className="text-xs font-medium text-gray-600 dark:text-gray-400 text-center">
                        {step.name}
                      </div>
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          console.log('🎯 BOTÓN CLICKEADO:', { index, stepName: step.name })
                          handleStepClick(index)
                        }}
                        className={clsx(
                          'flex items-center justify-center w-10 h-10 rounded-full text-sm font-medium transition-all duration-300 hover:scale-110 cursor-pointer relative z-10',
                          index < currentStep 
                            ? 'bg-[#04315a] text-[#3ff3f2] hover:bg-[#062847]' 
                            : index === currentStep
                            ? 'bg-[#3ff3f2] text-[#04315a] border-2 border-[#04315a] hover:bg-cyan-100'
                            : 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-[#04315a] hover:text-[#3ff3f2] transition-colors cursor-pointer'
                        )}
                        title={step.name}
                      >
                        {index + 1}
                      </button>
                    </div>
                    
                    {index < GENERATION_STEPS.length - 1 && (
                      <div className={clsx(
                        'w-16 h-1 mx-3 transition-all duration-300 rounded mt-5',
                        index < currentStep ? 'bg-[#04315a]' : 'bg-gray-300 dark:bg-gray-600'
                      )} />
                    )}
                  </div>
                ))}
                </div>
                
                {/* Espacio vacío para equilibrar el layout */}
                <div className="self-end w-24"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de selección de modelo */}
      {showModelSelector && (
        <div className="fixed inset-0 z-60 overflow-hidden">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowModelSelector(false)} />
          
          <div className="fixed inset-0 overflow-hidden flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                    Seleccionar Modelo de IA
                  </h3>
                  <button
                    onClick={() => setShowModelSelector(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="mb-6">
                  <ModelSelector
                    selectedModel={selectedModel}
                    onModelSelect={(model) => {
                      setSelectedModel(model)
                      setShowModelSelector(false)
                      setGenerationError(null) // Limpiar errores previos
                    }}
                    purpose="article"
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowModelSelector(false)}
                    className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => setShowModelSelector(false)}
                    disabled={!selectedModel}
                    className={clsx(
                      'px-4 py-2 text-sm rounded-lg transition-colors',
                      selectedModel
                        ? 'bg-[#04315a] text-[#3ff3f2] hover:bg-[#062847]'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                    )}
                  >
                    Confirmar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}