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

export default function ArticlesPage() {
  const [selectedArticle, setSelectedArticle] = useState<string | null>(null)
  const [previewArticle, setPreviewArticle] = useState<any>(null)
  const [isPublishing, setIsPublishing] = useState(false)
  const { readyDocuments, undoReady, publishDocument } = useCurationStore()
  
  // Transformar readyDocuments a formato que espera la vista
  const readyArticles = readyDocuments.map(doc => ({
    id: doc.id,
    title: doc.articleData?.title || `Análisis jurídico: ${doc.title}`,
    section: doc.area,
    entity: doc.source,
    publicationDate: doc.publicationDate,
    extractionDate: doc.extractionDate,
    wordCount: doc.articleData?.content ? doc.articleData.content.split(' ').length : 0,
    readingTime: doc.articleData?.metadata?.readingTime || 3,
    keywords: doc.articleData?.metadata?.keywords?.length || 0,
    hasImage: !!doc.articleData?.image,
    description: doc.articleData?.metadata?.description || doc.summary || '',
    content: doc.articleData?.content || '',
    tags: doc.articleData?.metadata?.keywords || [],
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

  const handlePublishArticle = async () => {
    if (!selectedArticleData || isPublishing) return
    
    setIsPublishing(true)
    
    try {
      // Por ahora solo manejamos la lógica del frontend hasta que el backend esté funcionando
      // TODO: Implementar llamada real al API cuando el backend esté estable
      
      // Simular un delay de red para mostrar que algo está pasando
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Mover el documento a la lista de publicados
      publishDocument(selectedArticleData.id)
      setSelectedArticle(null)
      alert('¡Artículo publicado exitosamente!')
      
    } catch (error) {
      console.error('Error:', error)
      alert('Error al publicar el artículo. Intenta de nuevo.')
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
                            <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
                              <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-3 flex items-center space-x-2">
                                <Settings className="w-4 h-4" />
                                <span>Configuración de publicación</span>
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
        <div className="flex justify-center">
          <button 
            onClick={handlePublishArticle}
            disabled={isPublishing}
            className={clsx(
              "px-8 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl",
              isPublishing
                ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                : "bg-[#04315a] text-[#3ff3f2] hover:bg-[#062847]"
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
                    {/* Header del artículo */}
                    <header className="mb-8">
                      <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
                        <span className="px-3 py-1 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded-full">
                          {previewArticle.section}
                        </span>
                        <span>•</span>
                        <span>{previewArticle.readingTime} min de lectura</span>
                      </div>
                      
                      <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4 leading-tight">
                        {previewArticle.title}
                      </h1>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400 mb-6">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(previewArticle.publishConfig.publishDate).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}</span>
                        </div>
                      </div>
                    </header>

                    {/* Imagen del artículo */}
                    {previewArticle.hasImage && (
                      <div className="mb-8">
                        <img
                          src={readyDocuments.find(d => d.id === previewArticle.id)?.articleData?.image || '/api/placeholder/800/400'}
                          alt={previewArticle.title}
                          className="w-full h-64 object-cover rounded-lg"
                        />
                      </div>
                    )}

                    {/* Contenido */}
                    <div className="prose prose-lg max-w-none dark:prose-invert">
                      {previewArticle.description && (
                        <p className="text-xl text-gray-700 dark:text-gray-300 font-medium mb-8 leading-relaxed">
                          {previewArticle.description}
                        </p>
                      )}
                      
                      <div className="text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-line">
                        {previewArticle.content}
                      </div>
                    </div>

                    {/* Tags */}
                    {previewArticle.tags && previewArticle.tags.length > 0 && (
                      <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex flex-wrap gap-2">
                          {previewArticle.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
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