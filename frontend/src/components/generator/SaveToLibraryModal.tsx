import { useState, useEffect } from 'react'
import {
  X,
  Save,
  Tag,
  Plus,
  Trash2,
  Globe,
  Lock,
  Sparkles,
  Check
} from 'lucide-react'
import { clsx } from 'clsx'

// Tipos para las etiquetas
interface ImageTag {
  id: string
  name: string
  category: 'legal-area' | 'theme' | 'style' | 'concept' | 'custom'
  color: string
  description?: string
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

interface SaveToLibraryModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (customTags: string[], isPublic: boolean, metaDescription?: string) => Promise<boolean>
  imageUrl: string
  prompt: string
  initialMetaDescription?: string // Nueva prop para metadescripción inicial
  isSaving?: boolean
}

export default function SaveToLibraryModal({
  isOpen,
  onClose,
  onSave,
  imageUrl,
  prompt,
  initialMetaDescription,
  isSaving = false
}: SaveToLibraryModalProps) {
  // Estados
  const [availableTags, setAvailableTags] = useState<TagsResponse | null>(null)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [customTag, setCustomTag] = useState('')
  const [metaDescription, setMetaDescription] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  // Cargar etiquetas disponibles al abrir modal
  useEffect(() => {
    if (isOpen && !availableTags) {
      loadAvailableTags()
    }
  }, [isOpen])

  // Resetear estados al abrir/cerrar
  useEffect(() => {
    if (isOpen) {
      setSelectedTags([])
      setCustomTag('')
      // Pre-llenar metadescripción si existe
      setMetaDescription(initialMetaDescription || '')
      setIsPublic(false)
      setError(null)
      setSaved(false)

      console.log('🔍 DEBUG: Modal SaveToLibrary abierto', {
        hasInitialMetaDescription: !!initialMetaDescription,
        initialMetaDescription,
        prompt: prompt.substring(0, 100) + '...'
      })
    }
  }, [isOpen, initialMetaDescription, prompt])

  // Función para cargar etiquetas disponibles
  const loadAvailableTags = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/storage/images/tags')
      if (!response.ok) throw new Error('Error cargando etiquetas')

      const data = await response.json()
      setAvailableTags(data.data)
    } catch (error) {
      console.error('Error cargando etiquetas:', error)
      setError('Error cargando etiquetas disponibles')
    } finally {
      setIsLoading(false)
    }
  }

  // Función para alternar etiqueta
  const toggleTag = (tagName: string) => {
    setSelectedTags(prev =>
      prev.includes(tagName)
        ? prev.filter(name => name !== tagName)
        : [...prev, tagName]
    )
  }

  // Función para agregar etiqueta personalizada
  const addCustomTag = () => {
    if (customTag.trim() && !selectedTags.includes(customTag.trim())) {
      setSelectedTags(prev => [...prev, customTag.trim()])
      setCustomTag('')
    }
  }

  // Función para remover etiqueta personalizada
  const removeCustomTag = (tag: string) => {
    setSelectedTags(prev => prev.filter(t => t !== tag))
  }

  // Función para guardar
  const handleSave = async () => {
    try {
      const success = await onSave(selectedTags, isPublic, metaDescription.trim() || undefined)
      if (success) {
        setSaved(true)
        setTimeout(() => {
          onClose()
        }, 1500)
      }
    } catch (error) {
      console.error('Error guardando en biblioteca:', error)
      setError('Error guardando imagen en biblioteca')
    }
  }

  // Manejar tecla Enter para agregar etiqueta
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addCustomTag()
    }
  }

  // Obtener etiquetas sugeridas basadas en el prompt
  const getSuggestedTags = () => {
    if (!availableTags) return []

    const allTags = [
      ...availableTags.predefined['legal-areas'],
      ...availableTags.predefined['themes'],
      ...availableTags.predefined['styles']
    ]

    const promptLower = prompt.toLowerCase()
    return allTags.filter(tag =>
      promptLower.includes(tag.name.toLowerCase()) ||
      tag.description?.toLowerCase().includes(promptLower)
    ).slice(0, 8)
  }

  if (!isOpen) return null

  if (saved) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            ¡Imagen guardada!
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            La imagen se ha guardado exitosamente en tu biblioteca
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-600">
          <div className="flex items-center space-x-3">
            <Save className="w-6 h-6 text-purple-600" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Guardar en Biblioteca
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Vista previa de la imagen */}
          <div className="flex space-x-4">
            <div className="w-32 h-20 flex-shrink-0 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-600">
              <img
                src={imageUrl}
                alt="Vista previa"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                Prompt de la imagen
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                {prompt}
              </p>
            </div>
          </div>

          {/* Meta Descripción de la Imagen */}
          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              <span>Metadescripción</span>
              <span className={clsx(
                "text-xs px-2 py-1 rounded-full",
                metaDescription.length <= 125
                  ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                  : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
              )}>
                {metaDescription.length}/125
              </span>
            </label>
            <textarea
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
              placeholder="Describe qué se ve en la imagen (ej: 'Oficina moderna con documentos legales sobre escritorio de madera')"
              rows={3}
              maxLength={125}
            />
            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Describe visualmente qué elementos aparecen en la imagen. Esto mejora el SEO y la accesibilidad.
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Configuración de visibilidad */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
              Visibilidad
            </h3>
            <div className="space-y-3">
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="visibility"
                  checked={!isPublic}
                  onChange={() => setIsPublic(false)}
                  className="mt-1 text-purple-600 focus:ring-purple-500"
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <Lock className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      Solo para este documento
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    La imagen solo estará disponible para reutilizar en este documento específico
                  </p>
                </div>
              </label>

              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="visibility"
                  checked={isPublic}
                  onChange={() => setIsPublic(true)}
                  className="mt-1 text-purple-600 focus:ring-purple-500"
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <Globe className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      Compartir con todos los documentos
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    La imagen estará disponible para reutilizar en cualquier documento
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Etiquetas sugeridas */}
          {!isLoading && availableTags && (
            <div>
              <div className="flex items-center space-x-2 mb-3">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                  Etiquetas sugeridas
                </h3>
              </div>

              {getSuggestedTags().length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {getSuggestedTags().map((tag) => (
                    <button
                      key={tag.id}
                      onClick={() => toggleTag(tag.name)}
                      className={clsx(
                        'px-3 py-1 rounded-full text-sm font-medium transition-colors',
                        selectedTags.includes(tag.name)
                          ? 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 ring-2 ring-purple-500'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      )}
                      style={selectedTags.includes(tag.name) ? { backgroundColor: tag.color + '20', borderColor: tag.color } : {}}
                    >
                      {tag.name}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No hay etiquetas sugeridas para este prompt
                </p>
              )}
            </div>
          )}

          {/* Etiquetas personalizadas */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
              Agregar etiquetas personalizadas
            </h3>
            <div className="flex space-x-2 mb-3">
              <input
                type="text"
                value={customTag}
                onChange={(e) => setCustomTag(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Escribe una etiqueta..."
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm"
              />
              <button
                onClick={addCustomTag}
                disabled={!customTag.trim() || selectedTags.includes(customTag.trim())}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Etiquetas seleccionadas */}
            {selectedTags.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Etiquetas seleccionadas ({selectedTags.length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedTags.map((tag) => {
                    const predefinedTag = availableTags && [
                      ...availableTags.predefined['legal-areas'],
                      ...availableTags.predefined['themes'],
                      ...availableTags.predefined['styles'],
                      ...availableTags.predefined['concepts']
                    ].find(t => t.name === tag)

                    return (
                      <span
                        key={tag}
                        className="inline-flex items-center space-x-1 px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-full text-sm"
                        style={predefinedTag ? { backgroundColor: predefinedTag.color + '20' } : {}}
                      >
                        <Tag className="w-3 h-3" />
                        <span>{tag}</span>
                        <button
                          onClick={() => removeCustomTag(tag)}
                          className="ml-1 hover:text-purple-900 dark:hover:text-purple-100 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {isLoading && (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mx-auto"></div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Cargando etiquetas...</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-600">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {selectedTags.length > 0 && (
              <span>{selectedTags.length} etiqueta{selectedTags.length !== 1 ? 's' : ''} seleccionada{selectedTags.length !== 1 ? 's' : ''}</span>
            )}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || isLoading}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Guardar en biblioteca</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}