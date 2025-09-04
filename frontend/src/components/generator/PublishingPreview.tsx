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

interface PublishingPreviewProps {
  document: any
  generatedArticle: {
    title: string
    content: string
    image?: string
    metadata: {
      description: string
      keywords: string[]
      section: string
      customTags?: string[]
      seoTitle?: string
      readingTime?: number
    }
  }
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
    const errors: string[] = []
    
    if (!generatedArticle.title.trim()) {
      errors.push('El artículo debe tener un título')
    }
    
    if (!generatedArticle.content.trim()) {
      errors.push('El artículo debe tener contenido')
    }
    
    if (!generatedArticle.metadata.description.trim()) {
      errors.push('El artículo debe tener una descripción')
    }
    
    if (generatedArticle.metadata.keywords.length === 0) {
      errors.push('El artículo debe tener al menos una palabra clave')
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
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Vista previa del artículo */}
        <div className="lg:col-span-2">
          
          <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg overflow-hidden shadow-sm">
            {/* Header del artículo */}
            <div className="p-6 border-b dark:border-gray-700">
              <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400 mb-3">
                <span className="px-2 py-1 bg-[#3ff3f2] bg-opacity-20 text-[#04315a] dark:bg-[#04315a] dark:text-[#3ff3f2] rounded">
                  {generatedArticle.metadata.section}
                </span>
                <span>•</span>
                <span>{estimatedReadingTime} min de lectura</span>
              </div>
              
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 leading-tight">
                {generatedArticle.title}
              </h1>
              
              <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(publishData.publishDate).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}</span>
                </div>
              </div>
            </div>

            {/* Imagen del artículo */}
            {generatedArticle.image && (
              <div className="relative h-64 bg-gray-100 dark:bg-gray-700">
                <img
                  src={generatedArticle.image}
                  alt={generatedArticle.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Contenido */}
            <div className="p-6">
              <div className="prose max-w-none">
                <p className="text-lg text-gray-700 dark:text-gray-300 font-medium mb-6">
                  {generatedArticle.metadata.description}
                </p>
                
                <div className="text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-line">
                  {generatedArticle.content}
                </div>
              </div>

              {/* Tags y metadata */}
              <div className="mt-8 pt-6 border-t dark:border-gray-700">
                <div className="flex flex-wrap gap-2 mb-4">
                  {generatedArticle.metadata.keywords.slice(0, 5).map((keyword) => (
                    <span
                      key={keyword}
                      className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-sm"
                    >
                      #{keyword}
                    </span>
                  ))}
                </div>
                
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  <p className="dark:text-gray-400"><strong>Documento fuente:</strong> {document.identifier} - {document.type}</p>
                  <p className="dark:text-gray-400"><strong>Área:</strong> {document.area}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Panel de configuración */}
        <div className="space-y-6">
          {/* Validación */}
          {validationErrors.length > 0 && (
            <div className="bg-red-50 dark:bg-red-900 dark:bg-opacity-20 border border-red-200 dark:border-red-700 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h5 className="font-medium text-red-900 dark:text-red-300 mb-2">
                    Corregir antes de publicar:
                  </h5>
                  <ul className="text-sm text-red-700 dark:text-red-400 space-y-1">
                    {validationErrors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}


          {/* Botón de publicación */}
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
                <span>Aprobar</span>
              </>
            )}
          </button>

        </div>
      </div>
    </div>
  )
}