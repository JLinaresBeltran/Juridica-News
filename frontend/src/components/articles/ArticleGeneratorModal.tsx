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
  Calendar
} from 'lucide-react'
import { clsx } from 'clsx'
import { getEntityColors } from '../../constants/entityColors'
import TitleGenerator from '../generator/TitleGenerator'
import ImageGenerator from '../generator/ImageGenerator'
import MetadataEditor from '../generator/MetadataEditor'
import PublishingPreview from '../generator/PublishingPreview'

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
      const autoSaveInterval = setInterval(() => saveCurrentState(), 30000)
      return () => clearInterval(autoSaveInterval)
    }
  }, [generatedArticle, currentStep, isOpen, document])

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
    // Permitir navegación libre entre pasos
    setCurrentStep(stepIndex)
    
    // Guardar inmediatamente el paso actual
    saveCurrentState(stepIndex)
  }

  const handleStartGeneration = async () => {
    setIsGenerating(true)
    try {
      // TODO: Llamada a la API para generar artículo inicial
      console.log('Iniciando generación de artículo para:', document?.title)
      
      // Simulación de generación
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Generar contenido básico
      setGeneratedArticle(prev => ({
        ...prev,
        title: `Análisis jurídico: ${document?.title}`,
        content: `Este artículo analiza las implicaciones jurídicas de ${document?.title}.\n\nEl ${document?.type} ${document?.identifier} establece criterios importantes para el desarrollo del derecho ${document?.area.toLowerCase()} en Colombia.\n\nEn esta decisión, se aborda específicamente: ${document?.summary || 'los aspectos fundamentales de la jurisprudencia aplicable al caso'}.\n\nLas implicaciones de esta decisión son múltiples y requieren un análisis detallado para comprender su alcance en el sistema jurídico colombiano.\n\n## Contexto jurídico\n\nLa decisión judicial que nos ocupa se enmarca en el desarrollo jurisprudencial reciente en materia de ${document?.area.toLowerCase()}, estableciendo precedentes importantes para casos similares.\n\n## Análisis del fallo\n\nLos magistrados han considerado varios aspectos fundamentales en su decisión, incluyendo la interpretación de los principios constitucionales aplicables y la coherencia con la jurisprudencia previa.\n\n## Implicaciones prácticas\n\nEsta decisión tendrá efectos significativos en la práctica jurídica, especialmente para profesionales del derecho que manejen casos similares en el futuro.`,
        metadata: {
          ...prev.metadata,
          description: `Análisis detallado de ${document?.identifier}`,
          keywords: [document?.area.toLowerCase() || '', 'jurisprudencia', 'análisis legal'],
          seoTitle: `Análisis jurídico: ${document?.title}`,
          readingTime: 3
        }
      }))
      
      // No avanzar automáticamente, mantener en el paso actual
    } catch (error) {
      console.error('Error generando artículo:', error)
    } finally {
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
      setTimeout(() => saveCurrentState(), 100)
      
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
      setTimeout(() => saveCurrentState(), 100)
      
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
      setTimeout(() => saveCurrentState(), 100)
      
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

                    {/* Resumen */}
                    {document.summary && (
                      <div className="flex items-start space-x-2">
                        <div className="p-1.5 bg-primary-100 dark:bg-primary-900 rounded mt-0.5 flex items-center justify-center min-w-[24px] h-6">
                          <span className="text-xs font-bold text-primary-600 dark:text-primary-300">R</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-gray-700 dark:text-gray-300 line-clamp-3 leading-relaxed">
                            {document.summary}
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
                          {document.type} {document.identifier}
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
                        <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm">Editor de Artículo</h4>
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
                      <div className="flex-1 p-3 flex flex-col">
                        {/* Campo de contenido */}
                        <textarea
                          value={generatedArticle.content}
                          onChange={(e) => {
                            setGeneratedArticle(prev => ({
                              ...prev,
                              content: e.target.value
                            }))
                            // Guardar después de un pequeño delay para evitar múltiples guardados
                            setTimeout(() => saveCurrentState(), 500)
                          }}
                          className="w-full flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#04315a] focus:border-[#04315a] resize-none text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                          placeholder="Haz clic en 'Generar Artículo' para comenzar o escribe directamente aquí..."
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
                        <div className="h-full bg-white dark:bg-gray-700 rounded-lg border dark:border-gray-600 flex items-center justify-center">
                          {document.url ? (
                            <iframe
                              src={`${document.url}#toolbar=0&navpanes=0&scrollbar=0`}
                              className="w-full h-full rounded-lg"
                              title="Documento original"
                            />
                          ) : (
                            <div className="text-center text-gray-500 dark:text-gray-400">
                              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
                              <p className="text-sm">Vista previa del documento</p>
                              <div className="mt-4 text-xs bg-gray-50 dark:bg-gray-600 p-4 rounded-lg max-w-md">
                                <p className="text-gray-700 dark:text-gray-300"><strong>Tipo:</strong> {document.type}</p>
                                <p className="text-gray-700 dark:text-gray-300"><strong>ID:</strong> {document.identifier}</p>
                                <p className="text-gray-700 dark:text-gray-300"><strong>Área:</strong> {document.area}</p>
                                <p className="text-gray-700 dark:text-gray-300"><strong>Fecha:</strong> {new Date(document.publicationDate).toLocaleDateString('es-ES')}</p>
                                {document.summary && (
                                  <div className="mt-2">
                                    <p className="text-gray-700 dark:text-gray-300"><strong>Resumen:</strong></p>
                                    <p className="mt-1 text-gray-600 dark:text-gray-400 leading-relaxed">{document.summary}</p>
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
                        onClick={() => handleStepClick(index)}
                        className={clsx(
                          'flex items-center justify-center w-10 h-10 rounded-full text-sm font-medium transition-all duration-300 hover:scale-110 cursor-pointer',
                          index < currentStep 
                            ? 'bg-[#04315a] text-[#3ff3f2] hover:bg-[#062847]' 
                            : index === currentStep
                            ? 'bg-[#3ff3f2] text-[#04315a] border-2 border-[#04315a] hover:bg-cyan-100'
                            : 'bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-500'
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
    </div>
  )
}