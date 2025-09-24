import { useState, useMemo } from 'react'
import {
  Send,
  CheckCircle,
  Calendar,
  FileText,
  Settings,
  BarChart3,
  Clock,
  Share2,
  Globe,
  User,
  ImageIcon,
  Tags,
  Undo2,
  Eye,
  X
} from 'lucide-react'
import { clsx } from 'clsx'
import { getEntityColors, getAreaColors } from '../../constants/entityColors'
import { useCurationStore } from '../../stores/curationStore'
import PublicationControls from '../../components/articles/PublicationControls'
import { ArticlePublicationSettings } from '@/types/publication.types'
import { api } from '@/services/api'

export default function ArticlesPage() {
  const [selectedArticle, setSelectedArticle] = useState<string | null>(null)
  const [previewArticle, setPreviewArticle] = useState<any>(null)
  const [isPublishing, setIsPublishing] = useState(false)
  const [publicationSettings, setPublicationSettings] = useState<Record<string, ArticlePublicationSettings>>({})
  const { readyDocuments, undoReady, publishDocument } = useCurationStore()
  
  // Transformar readyDocuments a formato que espera la vista con campos editados
  const readyArticles = readyDocuments.map(doc => ({
    id: doc.id,
    // ✅ Usar títulos editados: realTitle > title > fallback
    title: doc.articleData?.metadata?.realTitle || doc.articleData?.title || `Análisis jurídico: ${doc.title}`,
    subtitle: doc.articleData?.metadata?.realSubtitle || doc.articleData?.subtitle || '',
    metaTitle: doc.articleData?.metadata?.metaTitle || '',
    section: doc.articleData?.metadata?.section || doc.area,
    entity: doc.source,
    publicationDate: doc.publicationDate,
    extractionDate: doc.extractionDate,
    wordCount: doc.articleData?.content ? doc.articleData.content.split(' ').length : 0,
    readingTime: doc.articleData?.metadata?.readingTime || 3,
    keywords: doc.articleData?.metadata?.keywords?.length || 0,
    hasImage: !!doc.articleData?.image,
    // ✅ Metadescripción separada (NO mostrar en artículo)
    metaDescription: doc.articleData?.metadata?.description || '',
    content: doc.articleData?.content || '',
    tags: doc.articleData?.metadata?.keywords || [],
    customTags: doc.articleData?.metadata?.customTags || [],
    publishConfig: {
      publishDate: new Date().toISOString().split('T')[0],
      publishTime: '08:00',
      featured: false,
      socialSharing: true,
      newsletter: true
    }
  }))
  
  const selectedArticleData = useMemo(() => {
    return readyArticles.find(article => article.id === selectedArticle)
  }, [selectedArticle, readyArticles])

  const handlePublicationSettingsChange = (articleId: string, settings: ArticlePublicationSettings) => {
    setPublicationSettings(prev => ({
      ...prev,
      [articleId]: settings
    }))
  }

  const canPublishArticle = useMemo(() => {
    if (!selectedArticleData) return false

    const settings = publicationSettings[selectedArticleData.id]
    if (!settings) return false

    // Validar que al menos una opción esté seleccionada
    return settings.isGeneral ||
           settings.isUltimasNoticias ||
           settings.entidadSeleccionada ||
           settings.isDestacadoSemana
  }, [selectedArticleData, publicationSettings])

  const handlePublishArticle = async () => {
    if (!selectedArticleData || isPublishing || !canPublishArticle) return

    setIsPublishing(true)

    try {
      const settings = publicationSettings[selectedArticleData.id]
      console.log('Publishing article with settings:', settings)

      // Paso 1: Generar contenido del artículo con IA
      console.log('Generating article content...')
      const generateResponse = await api.post('/ai/generate-article', {
        documentId: selectedArticleData.id,
        model: 'gpt4o-mini',
        maxWords: 600,
        tone: 'professional',
        customInstructions: 'Genera un artículo en estilo formal y profesional'
      })

      const generatedContent = generateResponse.data.data // Extract the actual generated content
      console.log('Article content generated:', generatedContent)

      // Paso 2: Crear el artículo desde el documento aprobado con el contenido generado
      const createArticleResponse = await api.post('/articles', {
        sourceDocumentId: selectedArticleData.id,
        title: selectedArticleData.title,
        content: generatedContent.content,
        summary: generatedContent.summary || generatedContent.content.substring(0, 300), // Use first 300 chars as summary if no summary provided
        targetLength: 600,
        tone: 'PROFESSIONAL'
      })

      const newArticle = createArticleResponse.data.data
      console.log('Article created:', newArticle)

      // Paso 3: Publicar el artículo
      await api.post(`/articles/${newArticle.id}/publish`)

      console.log('Article published successfully')

      // Paso 4: Configurar las opciones de publicación del artículo
      await api.put(`/articles/${newArticle.id}/publication-settings`, settings)

      console.log('Publication settings updated')

      // Paso 4: Actualizar el frontend
      publishDocument(selectedArticleData.id, false) // No sync to backend, ya lo hicimos
      setSelectedArticle(null)

      // Limpiar configuración
      setPublicationSettings(prev => {
        const newSettings = { ...prev }
        delete newSettings[selectedArticleData.id]
        return newSettings
      })

      alert('¡Artículo publicado exitosamente!')

    } catch (error) {
      console.error('Error publishing article:', error)
      alert(`Error al publicar el artículo: ${error.message}`)
    } finally {
      setIsPublishing(false)
    }
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Artículos listos para publicar</h1>
        </div>
      </div>

      {/* Lista de artículos */}
      <div className="card dark:bg-gray-800">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            Artículos ({readyArticles.length})
          </h3>
        </div>
        <div className="card-body p-0">
          <div className="space-y-0">
            {readyArticles.map((article, index) => {
              const sourceInfo = getEntityColors(article.entity)
              
              return (
                <div 
                  key={article.id}
                  className={clsx(
                    'p-6 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 cursor-pointer',
                    selectedArticle === article.id ? 'bg-blue-50 dark:bg-blue-900 dark:bg-opacity-20' : '',
                    index !== readyArticles.length - 1 ? 'border-b' : ''
                  )}
                  onClick={() => setSelectedArticle(article.id)}
                >
                  <div className="flex items-start justify-between">
                    {/* Imagen en miniatura a la izquierda */}
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="flex-shrink-0">
                        <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600">
                          {article.hasImage ? (
                            <img
                              src={readyDocuments.find(d => d.id === article.id)?.articleData?.image || '/api/placeholder/64/64'}
                              alt={article.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.src = '/api/placeholder/64/64'
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Contenido principal */}
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
                            getAreaColors(article.section).bgColor,
                            getAreaColors(article.section).textColor
                          )}>
                            {getAreaColors(article.section).name}
                          </span>
                          <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                            ✓ Listo para publicar
                          </span>
                        </div>

                        {/* Sección principal con información del artículo - formato moderno */}
                        <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border-l-2 border-green-600">
                          
                          {/* Título del artículo generado */}
                          <div className="space-y-2">
                            <div className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                              {article.title}
                            </div>

                            {/* Subtítulo si existe */}
                            {article.subtitle && (
                              <div className="font-medium text-base text-gray-700 dark:text-gray-300">
                                {article.subtitle}
                              </div>
                            )}


                            {/* Información del documento fuente */}
                            <div className="text-sm text-gray-600 dark:text-gray-300">
                              <span className="font-medium">Fuente:</span> {readyDocuments.find(d => d.id === article.id)?.type} No. {readyDocuments.find(d => d.id === article.id)?.identifier}
                            </div>
                            
                            {/* Tiempo de lectura */}
                            <div className="text-sm text-gray-600 dark:text-gray-300">
                              <span className="font-medium">Lectura:</span> {article.readingTime} min
                            </div>
                          </div>

                          {/* Configuración de publicación integrada */}
                          {selectedArticle === article.id && (
                            <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-600 space-y-4">
                              {/* Configuración básica de publicación */}
                              <div>
                                <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-3 flex items-center space-x-2">
                                  <Settings className="w-4 h-4" />
                                  <span>Configuración básica</span>
                                </h5>

                                <div className="grid grid-cols-2 gap-3 mb-4">
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                      Fecha
                                    </label>
                                    <input
                                      type="date"
                                      value={article.publishConfig.publishDate}
                                      onChange={() => {}} // TODO: Implementar actualización
                                      className="w-full p-2 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                      Hora
                                    </label>
                                    <input
                                      type="time"
                                      value={article.publishConfig.publishTime}
                                      onChange={() => {}} // TODO: Implementar actualización
                                      className="w-full p-2 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                    />
                                  </div>
                                </div>

                                <div className="space-y-2 mb-4">
                                  <div className="flex items-center space-x-2">
                                    <input
                                      type="checkbox"
                                      checked={article.publishConfig.featured}
                                      onChange={() => {}} // TODO: Implementar actualización
                                      className="w-3 h-3 text-primary-600 border-gray-300 rounded"
                                    />
                                    <span className="text-xs text-gray-900 dark:text-gray-100">Artículo destacado</span>
                                  </div>

                                  <div className="flex items-center space-x-2">
                                    <input
                                      type="checkbox"
                                      checked={article.publishConfig.socialSharing}
                                      onChange={() => {}} // TODO: Implementar actualización
                                      className="w-3 h-3 text-primary-600 border-gray-300 rounded"
                                    />
                                    <span className="text-xs text-gray-900 dark:text-gray-100">Compartir en redes sociales</span>
                                  </div>

                                  <div className="flex items-center space-x-2">
                                    <input
                                      type="checkbox"
                                      checked={article.publishConfig.newsletter}
                                      onChange={() => {}} // TODO: Implementar actualización
                                      className="w-3 h-3 text-primary-600 border-gray-300 rounded"
                                    />
                                    <span className="text-xs text-gray-900 dark:text-gray-100">Incluir en newsletter</span>
                                  </div>
                                </div>
                              </div>

                              {/* Controles de publicación en portal */}
                              <PublicationControls
                                articleId={article.id}
                                initialSettings={publicationSettings[article.id]}
                                onSettingsChange={(settings) => handlePublicationSettingsChange(article.id, settings)}
                                isPublishing={isPublishing}
                              />
                            </div>
                          )}
                        </div>

                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center space-x-2 ml-6">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setPreviewArticle(article)
                        }}
                        className="flex items-center space-x-1 px-3 py-2 text-sm bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg transition-colors"
                        title="Previsualizar artículo"
                      >
                        <Eye className="w-4 h-4" />
                        <span>Previsualizar</span>
                      </button>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          if (window.confirm('¿Estás seguro de que quieres mover este artículo de vuelta a "Aprobados"?')) {
                            undoReady(article.id)
                            setSelectedArticle(null) // Deseleccionar si estaba seleccionado
                          }
                        }}
                        className="flex items-center space-x-1 px-3 py-2 text-sm bg-yellow-100 text-yellow-700 hover:bg-yellow-200 rounded-lg transition-colors"
                        title="Mover de vuelta a Aprobados"
                      >
                        <Undo2 className="w-4 h-4" />
                        <span>Revertir</span>
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Botón de publicación cuando hay artículo seleccionado */}
      {selectedArticleData && (
        <div className="flex flex-col items-center space-y-3">
          {!canPublishArticle && (
            <div className="text-sm text-amber-600 dark:text-amber-400 text-center">
              <span>⚠️ Selecciona al menos una sección donde aparecerá el artículo en el portal</span>
            </div>
          )}

          <button
            onClick={handlePublishArticle}
            disabled={isPublishing || !canPublishArticle}
            className={clsx(
              "px-8 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg",
              isPublishing || !canPublishArticle
                ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                : "bg-[#04315a] text-[#3ff3f2] hover:bg-[#062847] hover:shadow-xl"
            )}
          >
            {isPublishing ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Publicando...</span>
              </>
            ) : (
              <>
                <Globe className="w-5 h-5" />
                <span>Publicar Artículo</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Modal de previsualización */}
      {previewArticle && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setPreviewArticle(null)} />
          
          <div className="fixed inset-0 overflow-hidden">
            <div className="flex items-center justify-center min-h-full p-4">
              <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-4xl h-[90vh] flex flex-col">
                
                {/* Header del modal */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Vista previa del artículo</h3>
                  <button
                    onClick={() => setPreviewArticle(null)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                {/* Contenido del artículo como si estuviera publicado */}
                <div className="flex-1 overflow-auto">
                  <article className="max-w-3xl mx-auto p-6">
                    {/* Header del artículo - Igual que en "Aprobar" */}
                    <header className="p-6">
                      {/* Etiquetas: Constitucional y Personalizada */}
                      <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400 mb-3">
                        <span className="px-2 py-1 bg-[#3ff3f2] bg-opacity-20 text-[#04315a] dark:bg-[#04315a] dark:text-[#3ff3f2] rounded">
                          {previewArticle.section}
                        </span>
                        {previewArticle.customTags && previewArticle.customTags.length > 0 && (
                          <>
                            <span>•</span>
                            {previewArticle.customTags.slice(0, 1).map((tag) => (
                              <span key={tag} className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded">
                                {tag}
                              </span>
                            ))}
                          </>
                        )}
                      </div>

                      {/* Título H1 Real */}
                      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 leading-tight">
                        {previewArticle.title}
                      </h1>

                      {/* Fecha y tiempo de lectura */}
                      <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400 mb-6">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(previewArticle.publishConfig.publishDate).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}</span>
                        </div>
                        <span>•</span>
                        <span>{previewArticle.readingTime} min de lectura</span>
                      </div>
                    </header>

                    {/* Imagen del artículo - Igual que en "Aprobar" */}
                    {previewArticle.hasImage && (
                      <div className="relative bg-gray-100 dark:bg-gray-700" style={{ aspectRatio: '16/9', maxHeight: '300px' }}>
                        <img
                          src={readyDocuments.find(d => d.id === previewArticle.id)?.articleData?.image || '/api/placeholder/800/400'}
                          alt={previewArticle.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    {/* Subtítulo H2 debajo de imagen - Igual que en "Aprobar" */}
                    {previewArticle.subtitle && (
                      <div className="px-6 pt-6">
                        <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4 leading-snug">
                          {previewArticle.subtitle}
                        </h2>
                      </div>
                    )}

                    {/* Contenido del artículo - Igual que en "Aprobar" */}
                    <div className="px-6 pb-6">
                      <div className="prose max-w-none">
                        <div className="text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-line">
                          {previewArticle.content}
                        </div>
                      </div>

                      {/* Palabras clave, documento fuente y área legal - Igual que en "Aprobar" */}
                      <div className="mt-8 pt-6 border-t dark:border-gray-700">
                        {/* Solo palabras clave */}
                        {previewArticle.tags && previewArticle.tags.length > 0 && (
                          <div className="mb-4">
                            <div className="flex flex-wrap gap-2">
                              {previewArticle.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-sm"
                                >
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Solo documento fuente y área legal */}
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          <p><strong>Documento fuente:</strong> {readyDocuments.find(d => d.id === previewArticle.id)?.identifier} - {readyDocuments.find(d => d.id === previewArticle.id)?.type}</p>
                          <p><strong>Área Legal:</strong> {readyDocuments.find(d => d.id === previewArticle.id)?.area}</p>
                        </div>
                      </div>
                    </div>
                  </article>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}