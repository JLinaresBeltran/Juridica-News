import { useState } from 'react'
import { 
  Eye, 
  Send, 
  Calendar,
  Clock,
  User,
  FileText,
  Image as ImageIcon,
  Tags,
  Globe,
  Share2,
  CheckCircle,
  AlertTriangle
} from 'lucide-react'
import { clsx } from 'clsx'
import { useCurationStore } from '../../stores/curationStore'

interface GeneratedArticle {
  title: string
  subtitle?: string
  titleStyle?: string
  content: string
  image?: string
  imagePrompt?: string
  imageMetaDescription?: string | null
  generatedTitleSets?: Array<{
    metaTitle: string
    realTitle: string
    realSubtitle?: string
  }>
  generatedTitles?: string[]
  generatedSubtitles?: string[]
  titlesStyle?: string
  titlesModel?: string
  metadata: {
    description: string
    keywords: string[]
    section: string
    customTags: string[]
    seoTitle: string
    seoSubtitle?: string
    metaTitle?: string
    realTitle?: string
    realSubtitle?: string
    readingTime: number
    slug?: string
    canonicalUrl?: string
    imageAlt?: string
    imageDescription?: string
    schemaDescription?: string
  }
}

interface PublishingPreviewProps {
  document: any
  generatedArticle: GeneratedArticle
  onPublish: (publishData: PublishData) => void
}

interface PublishData {
  publishDate: string
  publishTime: string
  section: string
  featured: boolean
  socialSharing: boolean
  newsletter: boolean
}

const PUBLICATION_SECTIONS = [
  { id: 'constitucional', name: 'Constitucional', description: 'Análisis de jurisprudencia constitucional' },
  { id: 'civil', name: 'Civil', description: 'Derecho civil y comercial' },
  { id: 'penal', name: 'Penal', description: 'Derecho penal y criminología' },
  { id: 'laboral', name: 'Laboral', description: 'Derecho del trabajo y seguridad social' },
  { id: 'administrativo', name: 'Administrativo', description: 'Derecho administrativo y público' },
  { id: 'tributario', name: 'Tributario', description: 'Derecho fiscal y tributario' }
]

export default function PublishingPreview({ 
  document, 
  generatedArticle, 
  onPublish 
}: PublishingPreviewProps) {
  const { moveToReady } = useCurationStore()
  const [publishData, setPublishData] = useState<PublishData>({
    publishDate: new Date().toISOString().split('T')[0],
    publishTime: '08:00',
    section: generatedArticle.metadata.section.toLowerCase(),
    featured: false,
    socialSharing: true,
    newsletter: true
  })
  
  const [isPublishing, setIsPublishing] = useState(false)
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  const validateArticle = () => {
    // En la sección "Aprobar" no hay validaciones restrictivas
    // Solo verificaciones básicas que no deberían fallar
    const errors: string[] = []

    const articleTitle = generatedArticle.metadata.realTitle || generatedArticle.title
    const hasContent = generatedArticle.content && generatedArticle.content.trim()

    // Solo validaciones críticas que indican un error del sistema
    if (!articleTitle || !articleTitle.trim()) {
      errors.push('Error del sistema: El artículo no tiene título')
    }

    if (!hasContent) {
      errors.push('Error del sistema: El artículo no tiene contenido')
    }

    setValidationErrors(errors)
    return errors.length === 0
  }

  const handlePublish = async () => {
    if (!validateArticle()) return
    
    setIsPublishing(true)
    try {
      console.log('Aprobando artículo para publicación:', {
        article: generatedArticle,
        publishData,
        sourceDocument: document
      })
      
      // Simulación de aprobación
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Mover documento de "Aprobados" a "Listos"
      moveToReady(document, generatedArticle)
      
      onPublish(publishData)
    } catch (error) {
      console.error('Error aprobando artículo:', error)
    } finally {
      setIsPublishing(false)
    }
  }

  const estimatedReadingTime = generatedArticle.metadata.readingTime || 3
  const wordCount = generatedArticle.content.split(' ').length || 0

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex flex-col space-y-8 w-full">
        {/* Vista previa del artículo */}
        <div className="w-full">
          
          <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg overflow-hidden shadow-sm">
            {/* Header del artículo */}
            <div className="p-6">
              {/* Etiquetas: Constitucional y Personalizada */}
              <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400 mb-3">
                <span className="px-2 py-1 bg-[#3ff3f2] bg-opacity-20 text-[#04315a] dark:bg-[#04315a] dark:text-[#3ff3f2] rounded">
                  {generatedArticle.metadata.section}
                </span>
                {generatedArticle.metadata.customTags && generatedArticle.metadata.customTags.length > 0 && (
                  <>
                    <span>•</span>
                    {generatedArticle.metadata.customTags.slice(0, 1).map((tag) => (
                      <span key={tag} className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded">
                        {tag}
                      </span>
                    ))}
                  </>
                )}
              </div>

              {/* Título H1 Real */}
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 leading-tight">
                {generatedArticle.metadata.realTitle || generatedArticle.title}
              </h1>

              {/* Fecha y tiempo de lectura */}
              <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400 mb-6">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(publishData.publishDate).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}</span>
                </div>
                <span>•</span>
                <span>{estimatedReadingTime} min de lectura</span>
              </div>
            </div>

            {/* Imagen del artículo */}
            {generatedArticle.image && (
              <div className="relative bg-gray-100 dark:bg-gray-700" style={{ aspectRatio: '16/9', maxHeight: '300px' }}>
                <img
                  src={generatedArticle.image}
                  alt={generatedArticle.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Subtítulo debajo de la imagen */}
            {(generatedArticle.metadata.realSubtitle || generatedArticle.subtitle) && (
              <div className="px-6 pt-6">
                <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4 leading-snug">
                  {generatedArticle.metadata.realSubtitle || generatedArticle.subtitle}
                </h2>
              </div>
            )}

            {/* Contenido del artículo */}
            <div className="px-6 pb-6">
              <div className="prose max-w-none">
                <div className="text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-line">
                  {generatedArticle.content}
                </div>
              </div>

              {/* Palabras clave, documento fuente y área legal */}
              <div className="mt-8 pt-6 border-t dark:border-gray-700">
                {/* Solo palabras clave */}
                {generatedArticle.metadata.keywords && generatedArticle.metadata.keywords.length > 0 && (
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-2">
                      {generatedArticle.metadata.keywords.map((keyword) => (
                        <span
                          key={keyword}
                          className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-sm"
                        >
                          #{keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Solo documento fuente y área legal */}
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  <p><strong>Documento fuente:</strong> {document.identifier} - {document.type}</p>
                  <p><strong>Área Legal:</strong> {document.area}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Panel de aprobación */}
        <div className="space-y-6 w-full">
          {/* Solo mostrar errores críticos del sistema */}
          {validationErrors.length > 0 && (
            <div className="bg-red-50 dark:bg-red-900 dark:bg-opacity-20 border border-red-200 dark:border-red-700 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h5 className="font-medium text-red-900 dark:text-red-300 mb-2">
                    Error del sistema detectado:
                  </h5>
                  <ul className="text-sm text-red-700 dark:text-red-400 space-y-1">
                    {validationErrors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                  <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                    Por favor, regresa a las secciones anteriores para corregir estos problemas.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Botón de aprobación */}
          <button
            onClick={handlePublish}
            disabled={isPublishing || validationErrors.length > 0}
            className={clsx(
              'w-full px-6 py-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2',
              isPublishing || validationErrors.length > 0
                ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                : 'bg-[#04315a] text-[#3ff3f2] hover:bg-[#062847] shadow-lg hover:shadow-xl'
            )}
          >
            {isPublishing ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#3ff3f2]"></div>
                <span>Aprobando...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                <span>Aprobar Artículo</span>
              </>
            )}
          </button>

        </div>
      </div>
    </div>
  )
}