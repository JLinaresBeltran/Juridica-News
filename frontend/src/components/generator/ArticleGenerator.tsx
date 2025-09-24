import { useState, useEffect } from 'react'
import {
  Sparkles,
  RefreshCw,
  Check,
  BookOpen,
  Zap,
  GraduationCap,
  FileText,
  Eye,
  Clock,
  Brain
} from 'lucide-react'
import { clsx } from 'clsx'
import ModelSelector from '../common/ModelSelector'
import type { AIModel } from '../common/ModelSelector'

interface TitleSet {
  metaTitle: string
  realTitle: string
  realSubtitle?: string
}

interface ArticleGeneratorProps {
  document: any
  onArticleGenerated: (article: string, style: string) => void
  onTitleSelected: (metaTitle: string, title: string, subtitle: string, style: string) => void
  onTitlesGenerated: (titleSets: TitleSet[], style: string, model: string) => void
  generatedArticle?: string
  selectedTitle?: string
  selectedSubtitle?: string
  selectedMetaTitle?: string
  // Props para persistencia de títulos
  persistedTitleSets?: TitleSet[]
  persistedTitles?: string[]
  persistedSubtitles?: string[]
  persistedTitlesStyle?: string
  persistedTitlesModel?: string
}

// Componente para vista previa del documento original
function DocumentViewer({ url, title, documentType }: { url: string; title: string; documentType: string }) {
  const [viewerError, setViewerError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Solo Google Docs y LibreOffice Online
  const viewers = [
    {
      name: 'Google Docs',
      url: url.includes('https://') ? `https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true` : null,
      allowIframe: true
    },
    {
      name: 'LibreOffice Online',
      url: url.includes('https://') ? `https://www.viewdocs.com/viewer?url=${encodeURIComponent(url)}` : null,
      allowIframe: false,
      openInNewWindow: true
    }
  ].filter(viewer => viewer.url);

  const currentViewer = viewers[0]; // Usar Google Docs por defecto

  const handleViewerLoad = () => {
    setIsLoading(false);
    setViewerError(false);
  };

  const handleViewerError = () => {
    setIsLoading(false);
    setViewerError(true);
  };

  if (viewerError) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400 p-4">
        <FileText className="w-12 h-12 mb-3" />
        <h4 className="text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
          Vista previa no disponible
        </h4>
        <button
          onClick={() => window.open(url, '_blank')}
          className="text-xs px-3 py-1 bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors"
        >
          Abrir en Nueva Pestaña
        </button>
      </div>
    );
  }

  return (
    <div className="relative h-full">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-gray-800">
          <div className="text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto mb-2"></div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Cargando vista previa...</p>
          </div>
        </div>
      )}
      {currentViewer && currentViewer.allowIframe && (
        <iframe
          src={currentViewer.url}
          className="w-full h-full"
          title={`Vista previa de ${title}`}
          onLoad={handleViewerLoad}
          onError={handleViewerError}
          style={{ border: 'none' }}
        />
      )}
    </div>
  );
}

const ARTICLE_STYLES = {
  serious: {
    name: 'Serio y Profesional',
    description: 'Formal y directo para audiencia especializada',
    icon: BookOpen,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200'
  },
  catchy: {
    name: 'Capcioso',
    description: 'Atractivo y diseñado para generar clics',
    icon: Zap,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200'
  },
  educational: {
    name: 'Educativo',
    description: 'Informativo y claro para el público general',
    icon: GraduationCap,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200'
  }
}

export default function ArticleGenerator({
  document,
  onArticleGenerated,
  onTitleSelected,
  onTitlesGenerated,
  generatedArticle = '',
  selectedTitle = '',
  selectedSubtitle = '',
  selectedMetaTitle = '',
  persistedTitleSets = [],
  persistedTitles = [],
  persistedSubtitles = [],
  persistedTitlesStyle = '',
  persistedTitlesModel = ''
}: ArticleGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [isGeneratingTitles, setIsGeneratingTitles] = useState(false)
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null)
  const [articleText, setArticleText] = useState(generatedArticle)
  const [generatedTitleSets, setGeneratedTitleSets] = useState<TitleSet[]>([])
  const [generatedTitles, setGeneratedTitles] = useState<string[]>([])
  const [generatedSubtitles, setGeneratedSubtitles] = useState<string[]>([])
  const [selectedModel, setSelectedModel] = useState<AIModel>('')
  const [showEditMode, setShowEditMode] = useState(false)
  const [showPreview, setShowPreview] = useState(false) // Control de vista previa

  // Estados locales para la vista previa editable
  const [localTitle, setLocalTitle] = useState(selectedTitle)
  const [localSubtitle, setLocalSubtitle] = useState(selectedSubtitle)
  const [localMetaTitle, setLocalMetaTitle] = useState(selectedMetaTitle)

  // Actualizar el texto cuando cambie el artículo generado externamente
  useEffect(() => {
    setArticleText(generatedArticle)
  }, [generatedArticle])

  // Sincronizar estados locales con props cuando cambien
  useEffect(() => {
    setLocalTitle(selectedTitle)
    setLocalSubtitle(selectedSubtitle)
    setLocalMetaTitle(selectedMetaTitle)
  }, [selectedTitle, selectedSubtitle, selectedMetaTitle])

  // Cargar titleSets persistidos cuando se reciban desde el modal padre
  useEffect(() => {
    if (persistedTitleSets && persistedTitleSets.length > 0) {
      console.log('📥 ArticleGenerator: Cargando titleSets persistidos:', persistedTitleSets)
      setGeneratedTitleSets(persistedTitleSets)
      setSelectedStyle(persistedTitlesStyle || null)
      if (persistedTitlesModel) {
        setSelectedModel(persistedTitlesModel as AIModel)
      }
    }
    // Fallback: cargar formato anterior
    else if (persistedTitles && persistedTitles.length > 0) {
      console.log('📥 ArticleGenerator: Cargando títulos legacy:', persistedTitles)
      setGeneratedTitles(persistedTitles)
      setGeneratedSubtitles(persistedSubtitles || [])
      setSelectedStyle(persistedTitlesStyle || null)
      if (persistedTitlesModel) {
        setSelectedModel(persistedTitlesModel as AIModel)
      }
    }
  }, [persistedTitleSets, persistedTitles, persistedSubtitles, persistedTitlesStyle, persistedTitlesModel])

  // Cargar modelo preferido del localStorage al montar
  useEffect(() => {
    const savedModel = localStorage.getItem('preferredAIModel') as AIModel
    if (savedModel && (savedModel === 'gpt4o-mini' || savedModel === 'gemini')) {
      setSelectedModel(savedModel)
    } else {
      // Por defecto, usar GPT-4o Mini
      setSelectedModel('gpt4o-mini')
    }
  }, [])

  // Guardar modelo seleccionado en localStorage cuando cambie
  useEffect(() => {
    if (selectedModel) {
      localStorage.setItem('preferredAIModel', selectedModel)
    }
  }, [selectedModel])

  const generateArticle = async (styleKey: string) => {
    setIsGenerating(true)
    setSelectedStyle(styleKey)

    // Reset estados previos al generar nuevo artículo
    setGeneratedTitleSets([])
    setGeneratedTitles([])
    setGeneratedSubtitles([])
    onTitleSelected('', '', '', '')
    setShowPreview(false)

    try {
      console.log('🚀 GENERANDO ARTÍCULO REAL CON AI - Estilo:', styleKey)
      console.log('📄 Documento para generación:', document)
      
      // LLAMADA REAL A LA API
      const { aiService } = await import('../../services/aiService')
      
      const result = await aiService.generateArticle({
        documentId: document.id,
        model: selectedModel,
        maxWords: 600,
        tone: styleKey === 'serious' ? 'professional' : styleKey === 'educational' ? 'accessible' : 'professional', // Por defecto profesional
        customInstructions: `Genera un artículo en estilo ${styleKey === 'serious' ? 'formal y profesional' : styleKey === 'catchy' ? 'atractivo y dinámico' : 'educativo y claro'}`
      })
      
      console.log('✅ ARTÍCULO GENERADO POR AI:', {
        wordCount: result.wordCount,
        modelUsed: result.modelUsed,
        contentLength: result.content.length
      })
      
      const generatedText = result.content
      setArticleText(generatedText)
      onArticleGenerated(generatedText, styleKey)
      
      
    } catch (error) {
      console.error('❌ ERROR EN GENERACIÓN CON AI:', error)

      // No usar fallback, manejar error directamente
      alert('Error al generar el artículo. Por favor, intenta nuevamente.')
    } finally {
      setIsGenerating(false)
    }
  }

  const generateTitlesForStyle = async (styleKey: string) => {
    if (!articleText) {
      alert('Primero debes generar un artículo antes de crear títulos')
      return
    }

    if (!selectedModel) {
      alert('Primero debes seleccionar un modelo de IA')
      return
    }

    setIsGeneratingTitles(true)
    setSelectedStyle(styleKey)

    // Reset vista previa al regenerar títulos
    setShowPreview(false)
    onTitleSelected('', '', '', '') // Limpiar meta title, título y subtítulo seleccionado previo

    try {
      console.log('🚀 GENERANDO TÍTULOS REALES CON AI - Estilo:', styleKey)
      
      // LLAMADA REAL A LA API PARA TÍTULOS
      const { aiService } = await import('../../services/aiService')
      
      const result = await aiService.generateTitles({
        documentId: document.id,
        model: selectedModel,
        style: styleKey as 'serious' | 'catchy' | 'educational',
        count: 3,
        articleContent: articleText, // Pasar el contenido del artículo generado
        includeSubtitle: true // Incluir subtítulos H2
      })

      console.log('✅ TÍTULOS GENERADOS POR AI:', result.titles)
      console.log('✅ SUBTÍTULOS GENERADOS POR AI:', result.subtitles)
      console.log('✅ TITLE SETS GENERADOS POR AI:', result.titleSets)

      // Priorizar titleSets si están disponibles
      if (result.titleSets && result.titleSets.length > 0) {
        setGeneratedTitleSets(result.titleSets)
        // Notificar al modal padre para persistencia
        onTitlesGenerated(result.titleSets, styleKey, selectedModel)
      } else {
        // Fallback: formato anterior
        setGeneratedTitles(result.titles)
        setGeneratedSubtitles(result.subtitles || [])
        // Convertir a titleSets para compatibilidad
        const legacyTitleSets: TitleSet[] = result.titles.map((title, index) => ({
          metaTitle: title.substring(0, 65), // Truncar para meta title
          realTitle: title,
          realSubtitle: result.subtitles?.[index] || ''
        }))
        onTitlesGenerated(legacyTitleSets, styleKey, selectedModel)
      }
      
    } catch (error) {
      console.error('❌ ERROR EN GENERACIÓN DE TÍTULOS CON AI:', error)

      // No usar fallback, manejar error directamente
      alert('Error al generar los títulos. Por favor, intenta nuevamente.')
    } finally {
      setIsGeneratingTitles(false)
    }
  }

  const handleTitleSelect = async (titleSetIndex: number) => {
    if (selectedStyle) {
      // Priorizar titleSets si están disponibles
      if (generatedTitleSets.length > 0) {
        const selectedTitleSet = generatedTitleSets[titleSetIndex]
        onTitleSelected(
          selectedTitleSet.metaTitle,
          selectedTitleSet.realTitle,
          selectedTitleSet.realSubtitle || '',
          selectedStyle
        )

        // Guardar la selección en el backend
        try {
          const { aiService } = await import('../../services/aiService')
          await aiService.selectTitle({
            documentId: document.id,
            selectedTitle: selectedTitleSet.realTitle,
            style: selectedStyle as 'serious' | 'catchy' | 'educational'
          })
          console.log('✅ TitleSet seleccionado:', selectedTitleSet)
        } catch (error) {
          console.error('❌ Error guardando título seleccionado:', error)
        }
      } else {
        // Fallback: formato anterior
        const title = generatedTitles[titleSetIndex] || ''
        const subtitle = generatedSubtitles[titleSetIndex] || ''
        onTitleSelected(
          title.substring(0, 65), // Meta title truncado
          title,
          subtitle,
          selectedStyle
        )
      }
    }
  }

  const handleArticleChange = (text: string) => {
    setArticleText(text)
    if (selectedStyle) {
      onArticleGenerated(text, selectedStyle)
    }
  }

  if (isGenerating) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#04315a] mx-auto mb-4"></div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          Generando artículo con IA...
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Creando contenido personalizado basado en la sentencia
        </p>
      </div>
    )
  }

  // Si hay artículo generado, título seleccionado Y el usuario quiere ver la previsualización
  if (articleText && selectedTitle && showPreview) {
    return (
      <div className="h-full flex">
        {/* Panel izquierdo: Documento original (50%) */}
        <div className="w-1/2 border-r border-gray-200 dark:border-gray-700 flex flex-col">
          <div className="p-4 bg-gray-50 dark:bg-gray-750 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Documento Original
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {document.identifier || 'Documento fuente'}
            </p>
          </div>
          <div className="flex-1 overflow-hidden">
            {document.url ? (
              <DocumentViewer
                url={document.url}
                title={document.title}
                documentType={document.type}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                <div className="text-center">
                  <FileText className="w-12 h-12 mx-auto mb-3" />
                  <p className="text-sm">Documento no disponible</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Panel derecho: Vista previa final del artículo (50%) */}
        <div className="w-1/2 flex flex-col">
          <div className="p-4 bg-gray-50 dark:bg-gray-750 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Vista Previa del Artículo
            </h3>
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {articleText.split(' ').length} palabras • Estilo: {selectedStyle && ARTICLE_STYLES[selectedStyle as keyof typeof ARTICLE_STYLES].name}
              </p>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowPreview(false)}
                  className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Volver a Edición
                </button>
                <button
                  onClick={() => {
                    setArticleText('')
                    onArticleGenerated('', '')
                    onTitleSelected('', '', '', '')
                    setShowPreview(false)
                  }}
                  className="text-xs px-2 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                >
                  Regenerar Todo
                </button>
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-auto p-6 bg-white dark:bg-gray-800">
            {/* Vista previa como aparecería en el sitio web */}
            <article className="max-w-none prose prose-lg dark:prose-invert">
              {/* Metadatos SEO (editables) */}
              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-2">
                  Meta Title SEO (editable)
                </div>
                <input
                  type="text"
                  value={localMetaTitle || ''}
                  onChange={(e) => {
                    setLocalMetaTitle(e.target.value)
                    onTitleSelected(e.target.value, localTitle, localSubtitle, selectedStyle || '')
                  }}
                  className="w-full px-2 py-1 text-xs font-mono bg-white dark:bg-gray-700 border border-blue-300 dark:border-blue-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Meta title para Google (máx 65 caracteres)"
                  maxLength={65}
                />
                <div className="text-blue-600 dark:text-blue-400 mt-1 text-xs">
                  {(localMetaTitle || '').length}/65 caracteres
                </div>
              </div>

              {/* Título principal H1 (editable) */}
              <div className="mb-4">
                <input
                  type="text"
                  value={localTitle}
                  onChange={(e) => {
                    setLocalTitle(e.target.value)
                    onTitleSelected(localMetaTitle, e.target.value, localSubtitle, selectedStyle || '')
                  }}
                  className="w-full text-3xl font-bold text-gray-900 dark:text-gray-100 bg-transparent border-b-2 border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none transition-colors leading-tight py-2"
                  placeholder="Título principal del artículo (H1)"
                />
              </div>

              {/* Subtítulo H2 (editable) */}
              <div className="mb-6">
                <input
                  type="text"
                  value={localSubtitle || ''}
                  onChange={(e) => {
                    setLocalSubtitle(e.target.value)
                    onTitleSelected(localMetaTitle, localTitle, e.target.value, selectedStyle || '')
                  }}
                  className="w-full text-xl font-semibold text-gray-700 dark:text-gray-300 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none transition-colors leading-snug py-2"
                  placeholder="Subtítulo del artículo (H2) - opcional"
                />
              </div>

              {/* Metadatos del artículo */}
              <div className="space-y-4 mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                  <span className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>{Math.ceil(articleText.split(' ').length / 200)} min de lectura</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <FileText className="w-4 h-4" />
                    <span>{articleText.split(' ').length} palabras</span>
                  </span>
                  {selectedStyle && (
                    <span className="flex items-center space-x-1">
                      <Brain className="w-4 h-4" />
                      <span>Estilo {ARTICLE_STYLES[selectedStyle as keyof typeof ARTICLE_STYLES].name}</span>
                    </span>
                  )}
                </div>

                {/* Información adicional del documento */}
                <div className="grid grid-cols-2 gap-4 text-xs">
                  {document.area && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">
                      <span className="font-medium text-blue-700 dark:text-blue-300">Área Legal:</span>
                      <span className="ml-1 text-blue-600 dark:text-blue-400">{document.area}</span>
                    </div>
                  )}

                  {document.numeroSentencia && (
                    <div className="bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded">
                      <span className="font-medium text-green-700 dark:text-green-300">Sentencia:</span>
                      <span className="ml-1 text-green-600 dark:text-green-400">{document.numeroSentencia}</span>
                    </div>
                  )}

                  {document.expediente && (
                    <div className="bg-purple-50 dark:bg-purple-900/20 px-2 py-1 rounded">
                      <span className="font-medium text-purple-700 dark:text-purple-300">Expediente:</span>
                      <span className="ml-1 text-purple-600 dark:text-purple-400">{document.expediente}</span>
                    </div>
                  )}

                  {document.magistradoPonente && (
                    <div className="bg-orange-50 dark:bg-orange-900/20 px-2 py-1 rounded">
                      <span className="font-medium text-orange-700 dark:text-orange-300">Magistrado:</span>
                      <span className="ml-1 text-orange-600 dark:text-orange-400">{document.magistradoPonente}</span>
                    </div>
                  )}

                  {document.temaPrincipal && (
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1 rounded col-span-2">
                      <span className="font-medium text-indigo-700 dark:text-indigo-300">Tema:</span>
                      <span className="ml-1 text-indigo-600 dark:text-indigo-400">{document.temaPrincipal}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Contenido del artículo */}
              <div
                className="prose prose-lg dark:prose-invert max-w-none text-gray-800 dark:text-gray-200 leading-relaxed"
                style={{
                  whiteSpace: 'pre-wrap',
                  lineHeight: '1.7'
                }}
              >
                {articleText}
              </div>

              {/* Información adicional del documento fuente */}
              <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Documento Fuente
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {document.title || document.identifier}
                  </p>
                  {document.entity && (
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      {document.entity}
                    </p>
                  )}
                </div>
              </div>
            </article>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-6 w-full">
      {/* Selector de Modelo y Botón de Generación - Layout Horizontal Minimalista */}
      <div className="flex items-center justify-center space-x-4">
        <ModelSelector
          selectedModel={selectedModel}
          onModelSelect={setSelectedModel}
          purpose="article"
          compact={true}
          className=""
        />
        <button
          onClick={() => generateArticle(selectedStyle || 'serious')}
          disabled={!selectedModel}
          className={clsx(
            "inline-flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium",
            selectedModel
              ? "bg-[#04315a] text-white hover:bg-[#3ff3f2] hover:text-[#04315a]"
              : "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
          )}
        >
          <Sparkles className="w-4 h-4" />
          <span>Generar Artículo</span>
        </button>
      </div>

      {/* Una sola columna que ocupa todo el ancho */}
      <div className="flex-1 w-full space-y-6">
        {/* Textarea del artículo */}
        <div className="w-full">
          {articleText ? (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100">
                Artículo Generado (Editable)
              </label>
              <textarea
                value={articleText}
                onChange={(e) => handleArticleChange(e.target.value)}
                className="w-full min-h-64 p-4 border border-gray-300 dark:border-gray-600 rounded-lg resize-y focus:ring-2 focus:ring-[#04315a] focus:border-[#04315a] bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                placeholder="El artículo generado aparecerá aquí..."
                style={{ width: '100%', minWidth: '100%', minHeight: '16rem' }}
              />
            </div>
          ) : (
            <div className="h-96 flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
              <div className="text-center">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  Haz clic en "Generar Artículo" para comenzar
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Sección de estilos y títulos - Solo si hay artículo */}
        {articleText && (
          <div className="w-full space-y-6">
            <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 text-center">
              Ahora selecciona un estilo para generar títulos
            </h4>
            
            {/* Loading de títulos */}
            {isGeneratingTitles && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#04315a] mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">Generando títulos...</p>
              </div>
            )}

            {!isGeneratingTitles && (
              <div className="grid grid-cols-3 gap-3 w-full">
                {Object.entries(ARTICLE_STYLES).map(([styleKey, style]) => {
                  const isSelected = selectedStyle === styleKey
                  
                  return (
                    <div
                      key={styleKey}
                      onClick={() => generateTitlesForStyle(styleKey)}
                      className={clsx(
                        'relative p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-lg',
                        isSelected
                          ? `${style.borderColor} ${style.bgColor} shadow-md`
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-800'
                      )}
                    >
                      <div className="flex items-start space-x-2">
                        <div className={clsx(
                          'p-1.5 rounded-lg',
                          isSelected ? style.bgColor : 'bg-gray-100 dark:bg-gray-700'
                        )}>
                          <style.icon className={clsx(
                            'w-4 h-4',
                            isSelected ? style.color : 'text-gray-600 dark:text-gray-400'
                          )} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className={clsx(
                            'font-medium mb-1 text-sm',
                            isSelected ? style.color : 'text-gray-900 dark:text-gray-100'
                          )}>
                            {style.name}
                          </h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight">
                            {style.description}
                          </p>
                        </div>
                      </div>
                      {isSelected && (
                        <div className="absolute top-2 right-2">
                          <div className="w-6 h-6 bg-[#04315a] rounded-full flex items-center justify-center">
                            <Check className="w-4 h-4 text-[#3ff3f2]" />
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* Títulos y Subtítulos generados */}
            {(generatedTitleSets.length > 0 || generatedTitles.length > 0) && (
              <div className="space-y-4 w-full">
                <div className="bg-[#04315a] bg-opacity-5 border border-[#04315a] border-opacity-20 rounded-lg p-4 text-center">
                  <h4 className="text-lg font-medium text-[#04315a] dark:text-[#3ff3f2] mb-1">
                    3 Conjuntos SEO Completos - Estilo: {selectedStyle && ARTICLE_STYLES[selectedStyle as keyof typeof ARTICLE_STYLES].name}
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Meta Title + Título Real (H1) + Subtítulo (H2) - Diferenciación SEO correcta
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {(generatedTitleSets.length > 0 ? generatedTitleSets :
                    // Fallback: crear titleSets desde formato legacy
                    generatedTitles.map((title, index) => ({
                      metaTitle: title.substring(0, 65),
                      realTitle: title,
                      realSubtitle: generatedSubtitles[index] || ''
                    }))
                  ).map((titleSet, index) => {
                    const isSelected = selectedTitle === titleSet.realTitle

                    return (
                      <div
                        key={index}
                        onClick={() => handleTitleSelect(index)}
                        className={clsx(
                          'p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-md',
                          isSelected
                            ? 'border-[#04315a] bg-[#3ff3f2] bg-opacity-10 shadow-md'
                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-800'
                        )}
                      >
                        <div className="flex flex-col space-y-3">
                          {/* Meta Title */}
                          <div>
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="text-xs px-2 py-1 rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300 font-mono">
                                &lt;title&gt;
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {titleSet.metaTitle.length}/65
                              </span>
                            </div>
                            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 leading-relaxed">
                              {titleSet.metaTitle}
                            </p>
                          </div>

                          {/* Título Real H1 */}
                          <div>
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 font-mono">
                                H1
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {titleSet.realTitle.length} chars
                              </span>
                            </div>
                            <p className="text-sm font-bold text-gray-900 dark:text-gray-100 leading-relaxed">
                              {titleSet.realTitle}
                            </p>
                          </div>

                          {/* Subtítulo H2 */}
                          {titleSet.realSubtitle && (
                            <div>
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 font-mono">
                                  H2
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {titleSet.realSubtitle.length} chars
                                </span>
                              </div>
                              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 leading-relaxed">
                                {titleSet.realSubtitle}
                              </p>
                            </div>
                          )}

                          {/* Indicador de selección */}
                          {isSelected && (
                            <div className="flex justify-end">
                              <div className="w-5 h-5 bg-[#04315a] rounded-full flex items-center justify-center">
                                <Check className="w-3 h-3 text-[#3ff3f2]" />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="text-center space-y-3">
                  {/* Botón de Previsualización - Solo aparece si hay título seleccionado */}
                  {selectedTitle && (
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                      <button
                        onClick={() => setShowPreview(true)}
                        className="inline-flex items-center space-x-2 px-6 py-3 bg-[#04315a] text-[#3ff3f2] rounded-lg hover:bg-[#3ff3f2] hover:text-[#04315a] transition-colors font-medium"
                      >
                        <Eye className="w-5 h-5" />
                        <span>Ver Previsualización</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}