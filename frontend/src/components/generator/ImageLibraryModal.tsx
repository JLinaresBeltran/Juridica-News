import { useState, useEffect, useMemo } from 'react'
import {
  X,
  Search,
  Filter,
  Download,
  Tag,
  Calendar,
  Cpu,
  Eye,
  RotateCcw,
  Heart,
  Hash,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  Grid3X3,
  List,
  User,
  Building,
  Scale,
  Sparkles
} from 'lucide-react'
import { clsx } from 'clsx'
import { getImageUrl } from '@/services/api'

// Tipos para las etiquetas e imágenes
interface ImageTag {
  id: string
  name: string
  category: 'legal-area' | 'theme' | 'style' | 'concept' | 'custom'
  color: string
  description?: string
}

interface LibraryImage {
  id: string
  imageId: string
  filename: string
  url: string
  prompt: string
  metaDescription?: string
  style: string
  model: string
  tags: ImageTag[]
  size: number
  dimensions: { width: number; height: number }
  usageCount: number
  isPublic: boolean
  createdAt: string
  lastUsedAt?: string
  document?: {
    id: string
    title: string
    legalArea: string
    temaPrincipal: string
  }
}

interface LibraryResponse {
  images: LibraryImage[]
  pagination: {
    total: number
    limit: number
    offset: number
    hasNext: boolean
  }
  filters: {
    tags?: string[]
    search?: string
    style?: string
    model?: string
  }
}

interface TagsResponse {
  predefined: {
    'legal-areas': ImageTag[]
    'themes': ImageTag[]
    'styles': ImageTag[]
    'concepts': ImageTag[]
  }
  custom: ImageTag[]
}

interface ImageLibraryModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectImage: (imageUrl: string, prompt: string, imageId: string, metaDescription?: string) => void
  currentDocumentId?: string
}

const STYLE_ICONS = {
  'persona': User,
  'paisaje': Building,
  'elemento': Scale
}

const MODEL_COLORS = {
  'dalle': '#10B981',
  'gemini': '#8B5CF6'
}

const VIEW_MODES = [
  { id: 'grid', name: 'Galería', icon: Grid3X3 },
  { id: 'list', name: 'Lista', icon: List }
]

// Función utilitaria para formatear tamaño de archivo
const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

export default function ImageLibraryModal({
  isOpen,
  onClose,
  onSelectImage,
  currentDocumentId
}: ImageLibraryModalProps) {
  // Estados principales
  const [images, setImages] = useState<LibraryImage[]>([])
  const [availableTags, setAvailableTags] = useState<TagsResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Estados de filtros y búsqueda
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [selectedStyle, setSelectedStyle] = useState<string>('')
  const [selectedModel, setSelectedModel] = useState<string>('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Estados de paginación
  const [currentPage, setCurrentPage] = useState(0)
  const [totalImages, setTotalImages] = useState(0)
  const [hasNextPage, setHasNextPage] = useState(false)

  // Estados de vista previa
  const [selectedImage, setSelectedImage] = useState<LibraryImage | null>(null)
  const [showImagePreview, setShowImagePreview] = useState(false)

  // Cargar etiquetas disponibles al abrir modal
  useEffect(() => {
    if (isOpen && !availableTags) {
      loadAvailableTags()
    }
  }, [isOpen])

  // Cargar imágenes cuando cambian los filtros
  useEffect(() => {
    if (isOpen) {
      loadImages()
    }
  }, [isOpen, searchTerm, selectedTags, selectedStyle, selectedModel, currentPage])

  // Función para cargar etiquetas disponibles
  const loadAvailableTags = async () => {
    try {
      const response = await fetch('/api/storage/images/tags')
      if (!response.ok) throw new Error('Error cargando etiquetas')

      const data = await response.json()
      setAvailableTags(data.data)
    } catch (error) {
      console.error('Error cargando etiquetas:', error)
      setError('Error cargando etiquetas disponibles')
    }
  }

  // Función para cargar imágenes con filtros
  const loadImages = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()

      // Agregar filtros
      if (searchTerm) params.append('search', searchTerm)
      if (selectedStyle) params.append('style', selectedStyle)
      if (selectedModel) params.append('model', selectedModel)
      if (currentDocumentId) params.append('documentId', currentDocumentId)

      selectedTags.forEach(tag => params.append('tags', tag))

      // Paginación
      params.append('limit', '12')
      params.append('offset', (currentPage * 12).toString())

      const response = await fetch(`/api/storage/images/library?${params.toString()}`)
      if (!response.ok) throw new Error('Error cargando imágenes')

      const data: { success: boolean; data: LibraryResponse } = await response.json()

      setImages(data.data.images)
      setTotalImages(data.data.pagination.total)
      setHasNextPage(data.data.pagination.hasNext)

    } catch (error) {
      console.error('Error cargando imágenes:', error)
      setError('Error cargando biblioteca de imágenes')
    } finally {
      setIsLoading(false)
    }
  }

  // Función para marcar imagen como usada
  const markImageAsUsed = async (imageId: string) => {
    try {
      await fetch(`/api/storage/images/${imageId}/use`, {
        method: 'POST'
      })
    } catch (error) {
      console.error('Error marcando imagen como usada:', error)
    }
  }

  // Función para seleccionar imagen
  const handleSelectImage = async (image: LibraryImage) => {
    await markImageAsUsed(image.id)
    console.log('🔍 ImageLibraryModal - Imagen seleccionada:', {
      url: image.url,
      prompt: image.prompt,
      imageId: image.imageId,
      metaDescription: image.metaDescription
    })
    onSelectImage(image.url, image.prompt, image.imageId, image.metaDescription)
    onClose()
  }

  // Función para resetear filtros
  const resetFilters = () => {
    setSearchTerm('')
    setSelectedTags([])
    setSelectedStyle('')
    setSelectedModel('')
    setCurrentPage(0)
  }

  // Función para alternar etiqueta
  const toggleTag = (tagId: string) => {
    setSelectedTags(prev =>
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    )
    setCurrentPage(0) // Resetear página al cambiar filtros
  }

  // Etiquetas agrupadas por categoría
  const groupedTags = useMemo(() => {
    if (!availableTags) return {}

    return {
      'Áreas Legales': availableTags.predefined['legal-areas'] || [],
      'Temas': availableTags.predefined['themes'] || [],
      'Estilos': availableTags.predefined['styles'] || [],
      'Personalizadas': availableTags.custom || []
    }
  }, [availableTags])


  // Formatear fecha
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-7xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-600">
          <div className="flex items-center space-x-3">
            <ImageIcon className="w-6 h-6 text-purple-600" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Biblioteca de Imágenes
            </h2>
            {totalImages > 0 && (
              <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-full text-sm">
                {totalImages} imágenes
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filtros y búsqueda */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-600 space-y-4">
          {/* Barra de búsqueda */}
          <div className="flex space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar en prompts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>

            {/* Filtros rápidos */}
            <select
              value={selectedStyle}
              onChange={(e) => setSelectedStyle(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Todos los estilos</option>
              <option value="persona">Persona</option>
              <option value="paisaje">Paisaje</option>
              <option value="elemento">Elemento</option>
            </select>

            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Todos los modelos</option>
              <option value="dalle">DALL-E</option>
              <option value="gemini">Gemini</option>
            </select>

            {/* Modo de vista */}
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              {VIEW_MODES.map((mode) => {
                const Icon = mode.icon
                return (
                  <button
                    key={mode.id}
                    onClick={() => setViewMode(mode.id as 'grid' | 'list')}
                    className={clsx(
                      'p-2 rounded-md transition-colors',
                      viewMode === mode.id
                        ? 'bg-white dark:bg-gray-600 text-purple-600 dark:text-purple-400 shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                    )}
                    title={mode.name}
                  >
                    <Icon className="w-4 h-4" />
                  </button>
                )
              })}
            </div>

            {/* Botón resetear */}
            {(searchTerm || selectedTags.length > 0 || selectedStyle || selectedModel) && (
              <button
                onClick={resetFilters}
                className="flex items-center space-x-2 px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                title="Limpiar filtros"
              >
                <RotateCcw className="w-4 h-4" />
                <span className="text-sm">Limpiar</span>
              </button>
            )}
          </div>

          {/* Etiquetas */}
          {availableTags && (
            <div className="space-y-3">
              {Object.entries(groupedTags).map(([category, tags]) => (
                tags.length > 0 && (
                  <div key={category}>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {category}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {tags.slice(0, 10).map((tag) => (
                        <button
                          key={tag.id}
                          onClick={() => toggleTag(tag.id)}
                          className={clsx(
                            'px-3 py-1 rounded-full text-sm font-medium transition-colors',
                            selectedTags.includes(tag.id)
                              ? 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 ring-2 ring-purple-500'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                          )}
                          style={selectedTags.includes(tag.id) ? { backgroundColor: tag.color + '20', borderColor: tag.color } : {}}
                        >
                          {tag.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              ))}
            </div>
          )}
        </div>

        {/* Contenido principal */}
        <div className="flex-1 overflow-hidden flex">
          {/* Lista/Grid de imágenes */}
          <div className="flex-1 overflow-y-auto p-6">
            {error && (
              <div className="text-center py-8">
                <p className="text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                <p className="text-gray-600 dark:text-gray-400 mt-2">Cargando imágenes...</p>
              </div>
            ) : images.length === 0 && !error ? (
              <div className="text-center py-12">
                <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  No se encontraron imágenes con los filtros aplicados
                </p>
              </div>
            ) : (
              <>
                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {images.map((image) => (
                      <ImageCard
                        key={image.id}
                        image={image}
                        onSelect={() => handleSelectImage(image)}
                        onPreview={() => {
                          setSelectedImage(image)
                          setShowImagePreview(true)
                        }}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {images.map((image) => (
                      <ImageListItem
                        key={image.id}
                        image={image}
                        onSelect={() => handleSelectImage(image)}
                        onPreview={() => {
                          setSelectedImage(image)
                          setShowImagePreview(true)
                        }}
                      />
                    ))}
                  </div>
                )}

                {/* Paginación */}
                {totalImages > 12 && (
                  <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200 dark:border-gray-600">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Mostrando {(currentPage * 12) + 1}-{Math.min((currentPage + 1) * 12, totalImages)} de {totalImages}
                    </p>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                        disabled={currentPage === 0}
                        className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setCurrentPage(prev => prev + 1)}
                        disabled={!hasNextPage}
                        className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modal de vista previa */}
      {showImagePreview && selectedImage && (
        <ImagePreviewModal
          image={selectedImage}
          onClose={() => setShowImagePreview(false)}
          onSelect={() => handleSelectImage(selectedImage)}
        />
      )}
    </div>
  )
}

// Componente para tarjeta de imagen en grid
function ImageCard({
  image,
  onSelect,
  onPreview
}: {
  image: LibraryImage
  onSelect: () => void
  onPreview: () => void
}) {
  const StyleIcon = STYLE_ICONS[image.style as keyof typeof STYLE_ICONS] || Scale

  return (
    <div className="group relative bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden hover:shadow-lg transition-shadow">
      {/* Imagen */}
      <div className="relative aspect-video overflow-hidden">
        <img
          src={getImageUrl(image.url)}
          alt={image.prompt}
          className="w-full h-full object-cover cursor-pointer transition-transform group-hover:scale-105"
          onClick={onPreview}
        />

        {/* Overlay con acciones */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
          <div className="flex space-x-2">
            <button
              onClick={onPreview}
              className="p-2 bg-white dark:bg-gray-800 rounded-full text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={onSelect}
              className="p-2 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition-colors"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Indicadores */}
        <div className="absolute top-2 left-2 flex space-x-1">
          <span
            className="px-2 py-1 text-xs font-medium text-white rounded-full"
            style={{ backgroundColor: MODEL_COLORS[image.model as keyof typeof MODEL_COLORS] }}
          >
            {image.model.toUpperCase()}
          </span>
        </div>

        <div className="absolute top-2 right-2">
          <StyleIcon className="w-4 h-4 text-white" />
        </div>

        {/* Contador de usos */}
        {image.usageCount > 0 && (
          <div className="absolute bottom-2 right-2 flex items-center space-x-1 px-2 py-1 bg-black bg-opacity-50 rounded-full">
            <Heart className="w-3 h-3 text-white" />
            <span className="text-xs text-white">{image.usageCount}</span>
          </div>
        )}
      </div>

      {/* Información */}
      <div className="p-3">
        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
          {image.metaDescription || image.prompt}
        </p>

        {/* Tags */}
        {image.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {image.tags.slice(0, 3).map((tag) => (
              <span
                key={tag.id}
                className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-full"
                style={{ backgroundColor: tag.color + '20' }}
              >
                {tag.name}
              </span>
            ))}
            {image.tags.length > 3 && (
              <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-full">
                +{image.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Metadatos */}
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>{formatFileSize(image.size)}</span>
          <span>{image.dimensions.width}×{image.dimensions.height}</span>
        </div>
      </div>
    </div>
  )
}

// Componente para item de imagen en lista
function ImageListItem({
  image,
  onSelect,
  onPreview
}: {
  image: LibraryImage
  onSelect: () => void
  onPreview: () => void
}) {
  const StyleIcon = STYLE_ICONS[image.style as keyof typeof STYLE_ICONS] || Scale

  return (
    <div className="flex items-center space-x-4 p-4 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow">
      {/* Thumbnail */}
      <div className="relative w-20 h-12 flex-shrink-0 overflow-hidden rounded-md cursor-pointer" onClick={onPreview}>
        <img
          src={getImageUrl(image.url)}
          alt={image.prompt}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Información */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-900 dark:text-white line-clamp-1 mb-1">
          {image.metaDescription || image.prompt}
        </p>
        <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
          <span className="flex items-center space-x-1">
            <StyleIcon className="w-3 h-3" />
            <span>{image.style}</span>
          </span>
          <span
            className="px-2 py-1 rounded-full text-white"
            style={{ backgroundColor: MODEL_COLORS[image.model as keyof typeof MODEL_COLORS] }}
          >
            {image.model.toUpperCase()}
          </span>
          <span>{formatFileSize(image.size)}</span>
          <span>{image.dimensions.width}×{image.dimensions.height}</span>
          {image.usageCount > 0 && (
            <span className="flex items-center space-x-1">
              <Heart className="w-3 h-3" />
              <span>{image.usageCount}</span>
            </span>
          )}
        </div>
      </div>

      {/* Acciones */}
      <div className="flex space-x-2 flex-shrink-0">
        <button
          onClick={onPreview}
          className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
          title="Vista previa"
        >
          <Eye className="w-4 h-4" />
        </button>
        <button
          onClick={onSelect}
          className="p-2 bg-purple-600 text-white hover:bg-purple-700 rounded-lg transition-colors"
          title="Usar imagen"
        >
          <Download className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// Modal de vista previa de imagen
function ImagePreviewModal({
  image,
  onClose,
  onSelect
}: {
  image: LibraryImage
  onClose: () => void
  onSelect: () => void
}) {

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60] p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-600">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Vista Previa
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-hidden flex">
          {/* Imagen */}
          <div className="flex-1 flex items-center justify-center p-6 bg-gray-50 dark:bg-gray-900">
            <img
              src={getImageUrl(image.url)}
              alt={image.prompt}
              className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
            />
          </div>

          {/* Panel de información */}
          <div className="w-80 p-6 border-l border-gray-200 dark:border-gray-600 overflow-y-auto">
            <div className="space-y-4">
              {/* Meta Descripción */}
              {image.metaDescription && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Descripción de la Imagen
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    {image.metaDescription}
                  </p>
                </div>
              )}

              {/* Prompt */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Prompt Técnico
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed font-mono text-xs">
                  {image.prompt}
                </p>
              </div>

              {/* Metadatos */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Detalles
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Modelo:</span>
                    <span
                      className="px-2 py-1 rounded text-white text-xs"
                      style={{ backgroundColor: MODEL_COLORS[image.model as keyof typeof MODEL_COLORS] }}
                    >
                      {image.model.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Estilo:</span>
                    <span className="text-gray-900 dark:text-white">{image.style}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Tamaño:</span>
                    <span className="text-gray-900 dark:text-white">{formatFileSize(image.size)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Dimensiones:</span>
                    <span className="text-gray-900 dark:text-white">
                      {image.dimensions.width}×{image.dimensions.height}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Usos:</span>
                    <span className="text-gray-900 dark:text-white">{image.usageCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Creada:</span>
                    <span className="text-gray-900 dark:text-white">{formatDate(image.createdAt)}</span>
                  </div>
                </div>
              </div>

              {/* Etiquetas */}
              {image.tags.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Etiquetas
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {image.tags.map((tag) => (
                      <span
                        key={tag.id}
                        className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-full"
                        style={{ backgroundColor: tag.color + '20' }}
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Documento origen */}
              {image.document && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Documento Origen
                  </h4>
                  <div className="text-sm space-y-1">
                    <p className="text-gray-900 dark:text-white font-medium">
                      {image.document.title}
                    </p>
                    <p className="text-gray-500 dark:text-gray-400">
                      {image.document.legalArea}
                    </p>
                    {image.document.temaPrincipal && (
                      <p className="text-gray-500 dark:text-gray-400">
                        {image.document.temaPrincipal}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Botón de seleccionar */}
              <button
                onClick={onSelect}
                className="w-full mt-6 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
              >
                Usar esta imagen
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}