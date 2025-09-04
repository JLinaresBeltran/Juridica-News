import { useState, useRef, useEffect } from 'react'
import { 
  Image, 
  Sparkles, 
  RefreshCw, 
  Download,
  Crop,
  Loader,
  Settings,
  Eye,
  Scissors
} from 'lucide-react'
import { clsx } from 'clsx'

interface ImageGeneratorProps {
  document: any
  onImageGenerated: (imageUrl: string, prompt: string) => void
  generatedImage?: string
}

const AI_MODELS = [
  {
    id: 'gemini',
    name: 'Gemini',
    description: 'Ideal para imágenes jurídicas y conceptuales',
    capabilities: ['Conceptual', 'Profesional', 'Jurídico']
  },
  {
    id: 'dalle',
    name: 'DALL-E 3',
    description: 'Excelente para imágenes conceptuales y abstractas',
    capabilities: ['Conceptual', 'Abstracto', 'Creativo']
  }
]

const PRESET_PROMPTS = [
  'Imagen conceptual de justicia y derecho, estilo profesional, colores azul y dorado',
  'Ilustración moderna de una balanza de la justicia con elementos colombianos',
  'Diseño gráfico minimalista representando jurisprudencia constitucional',
  'Imagen editorial sobre derecho civil, estilo periodístico profesional'
]

interface GeneratedImageData {
  url: string
  prompt: string
  timestamp: number
  model?: string
  isUploaded?: boolean
}

export default function ImageGenerator({ 
  document, 
  onImageGenerated, 
  generatedImage 
}: ImageGeneratorProps) {
  const [selectedModel, setSelectedModel] = useState('')
  const [selectedCapability, setSelectedCapability] = useState('')
  const [generatedPrompt, setGeneratedPrompt] = useState('')
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false)
  const [customPrompt, setCustomPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [currentImage, setCurrentImage] = useState(generatedImage || '')
  const [generatedImages, setGeneratedImages] = useState<GeneratedImageData[]>([])
  const [currentImageModel, setCurrentImageModel] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const MAX_IMAGES = 4

  // Función para guardar estado en localStorage
  const saveImageState = () => {
    if (document?.id) {
      const storageKey = `image-generator-${document.id}`
      const imageState = {
        selectedModel,
        selectedCapability,
        generatedPrompt,
        customPrompt,
        currentImage,
        generatedImages,
        currentImageModel,
        lastModified: new Date().toISOString()
      }
      localStorage.setItem(storageKey, JSON.stringify(imageState))
      console.log('Estado del generador de imágenes guardado')
    }
  }

  // Cargar estado guardado al montar el componente
  useEffect(() => {
    if (document?.id) {
      const storageKey = `image-generator-${document.id}`
      const savedState = localStorage.getItem(storageKey)
      
      if (savedState) {
        try {
          const parsedState = JSON.parse(savedState)
          setSelectedModel(parsedState.selectedModel || '')
          setSelectedCapability(parsedState.selectedCapability || '')
          setGeneratedPrompt(parsedState.generatedPrompt || '')
          setCustomPrompt(parsedState.customPrompt || '')
          setCurrentImage(parsedState.currentImage || '')
          setGeneratedImages(parsedState.generatedImages || [])
          setCurrentImageModel(parsedState.currentImageModel || '')
          console.log('Estado del generador de imágenes cargado:', parsedState)
        } catch (error) {
          console.error('Error cargando estado del generador de imágenes:', error)
        }
      }
    }
  }, [document?.id])

  // Guardar estado cuando cambie cualquier valor importante
  useEffect(() => {
    if (document?.id && (selectedModel || selectedCapability || generatedPrompt || customPrompt || currentImage)) {
      const timeoutId = setTimeout(() => {
        saveImageState()
      }, 500)
      return () => clearTimeout(timeoutId)
    }
  }, [selectedModel, selectedCapability, generatedPrompt, customPrompt, currentImage, generatedImages, currentImageModel])

  const generateDefaultPrompt = () => {
    if (document) {
      return `Imagen editorial profesional sobre ${document.area.toLowerCase()}, relacionada con ${document.type} ${document.identifier}, estilo jurídico moderno, colores institucionales`
    }
    return ''
  }

  const generatePrompt = async () => {
    setIsGeneratingPrompt(true)
    try {
      console.log('Generando prompt con:', { model: selectedModel, capability: selectedCapability })
      
      // Simulación de generación de prompt
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      const promptTemplates = {
        gemini: {
          'Conceptual': `Imagen conceptual de ${document.area.toLowerCase()}, representando ${document.identifier}, estilo jurídico profesional, colores institucionales azul y dorado`,
          'Profesional': `Fotografía editorial profesional sobre ${document.area.toLowerCase()}, ${document.identifier}, estilo corporativo, iluminación suave`,
          'Jurídico': `Ilustración jurídica moderna de ${document.area.toLowerCase()}, ${document.identifier}, elementos de justicia, estilo minimalista`
        },
        dalle: {
          'Conceptual': `Arte conceptual abstracto representando ${document.area.toLowerCase()}, ${document.identifier}, estilo contemporáneo, paleta azul y dorado`,
          'Abstracto': `Composición abstracta sobre ${document.area.toLowerCase()}, formas geométricas, ${document.identifier}, estilo moderno`,
          'Creativo': `Ilustración creativa de ${document.area.toLowerCase()}, ${document.identifier}, estilo artístico único, colores vibrantes`
        }
      }
      
      const prompt = promptTemplates[selectedModel as keyof typeof promptTemplates]?.[selectedCapability] || generateDefaultPrompt()
      setGeneratedPrompt(prompt)
      setCustomPrompt(prompt)
      
    } catch (error) {
      console.error('Error generando prompt:', error)
    } finally {
      setIsGeneratingPrompt(false)
    }
  }

  const generateImage = async () => {
    if (!customPrompt.trim() || generatedImages.length >= MAX_IMAGES) return
    
    setIsGenerating(true)
    try {
      console.log('Generando imagen con:', { model: selectedModel, prompt: customPrompt })
      
      // Simulación de generación de imagen
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      // Mock de URL de imagen generada
      const mockImageUrl = `https://picsum.photos/800/400?random=${Date.now()}`
      
      // Nueva imagen generada
      const newImageData: GeneratedImageData = {
        url: mockImageUrl,
        prompt: customPrompt,
        timestamp: Date.now(),
        model: selectedModel
      }
      
      // Actualizar imagen actual (la que está en el input)
      setCurrentImage(mockImageUrl)
      setCurrentImageModel(AI_MODELS.find(m => m.id === selectedModel)?.name || selectedModel)
      
      // Agregar a la lista de imágenes generadas (máximo 4)
      setGeneratedImages(prev => {
        const updated = [newImageData, ...prev].slice(0, MAX_IMAGES)
        return updated
      })
      
      onImageGenerated(mockImageUrl, customPrompt)
      
    } catch (error) {
      console.error('Error generando imagen:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handlePresetPrompt = (preset: string) => {
    setCustomPrompt(preset)
    generateImage(preset)
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && generatedImages.length < MAX_IMAGES) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string
        
        // Nueva imagen subida
        const newImageData: GeneratedImageData = {
          url: imageUrl,
          prompt: 'Imagen subida por el usuario',
          timestamp: Date.now(),
          isUploaded: true
        }
        
        // Actualizar imagen actual
        setCurrentImage(imageUrl)
        setCurrentImageModel('Foto cargada')
        
        // Agregar a la lista de imágenes generadas
        setGeneratedImages(prev => {
          const updated = [newImageData, ...prev].slice(0, MAX_IMAGES)
          return updated
        })
        
        onImageGenerated(imageUrl, 'Imagen subida por el usuario')
      }
      reader.readAsDataURL(file)
    }
  }

  const downloadImage = () => {
    if (currentImage) {
      const link = document.createElement('a')
      link.href = currentImage
      link.download = `article-image-${document?.identifier || 'generated'}.jpg`
      link.click()
    }
  }

  return (
    <div className="space-y-6">
      {/* Selección de modelo de IA */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {AI_MODELS.map((model) => (
          <div
            key={model.id}
            className={clsx(
              'p-6 rounded-lg border-2 transition-all duration-200',
              selectedModel === model.id 
                ? 'border-[#04315a] bg-[#3ff3f2] bg-opacity-10' 
                : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800'
            )}
          >
            <div className="flex items-start space-x-3 mb-4">
              <div className={clsx(
                'w-4 h-4 rounded mt-1',
                selectedModel === model.id ? 'bg-[#04315a]' : 'bg-gray-300 dark:bg-gray-600'
              )} />
              <div className="flex-1">
                <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-1">{model.name}</h5>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{model.description}</p>
                
                {/* Etiquetas seleccionables */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {model.capabilities.map((cap) => (
                    <button
                      key={cap}
                      onClick={() => {
                        setSelectedModel(model.id)
                        setSelectedCapability(cap)
                      }}
                      className={clsx(
                        'px-3 py-1 text-xs rounded-full border transition-colors',
                        selectedModel === model.id && selectedCapability === cap
                          ? 'bg-[#04315a] text-[#3ff3f2] border-[#04315a]'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600'
                      )}
                    >
                      {cap}
                    </button>
                  ))}
                </div>
                
                {/* Botón generar prompt */}
                {selectedModel === model.id && selectedCapability && (
                  <button
                    onClick={generatePrompt}
                    disabled={isGeneratingPrompt}
                    className={clsx(
                      'w-full px-4 py-2 rounded-lg font-medium transition-all duration-200',
                      isGeneratingPrompt
                        ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                        : 'bg-[#04315a] text-[#3ff3f2] hover:bg-[#062847]'
                    )}
                  >
                    {isGeneratingPrompt ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400 dark:border-gray-500"></div>
                        <span>Generando...</span>
                      </div>
                    ) : (
                      'Generar Prompt'
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Descripción de la imagen */}
      {generatedPrompt && (
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 dark:text-gray-100">Descripción de la imagen</h4>
          <textarea
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            className="w-full h-24 p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#04315a] focus:border-[#04315a] resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            placeholder="Describe la imagen que quieres generar..."
          />
          
          {/* Botón de generación */}
          <div className="text-center">
            <button
              onClick={generateImage}
              disabled={isGenerating || !customPrompt.trim() || generatedImages.length >= MAX_IMAGES}
              className={clsx(
                'px-8 py-3 rounded-lg font-medium transition-all duration-200',
                isGenerating || !customPrompt.trim() || generatedImages.length >= MAX_IMAGES
                  ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                  : 'bg-[#04315a] text-[#3ff3f2] hover:bg-[#062847] shadow-lg hover:shadow-xl'
              )}
            >
              {isGenerating ? (
                <div className="flex items-center space-x-2">
                  <Loader className="animate-spin w-5 h-5" />
                  <span>Generando imagen...</span>
                </div>
              ) : generatedImages.length >= MAX_IMAGES ? (
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5" />
                  <span>Límite alcanzado ({MAX_IMAGES} imágenes)</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5" />
                  <span>Generar Imagen</span>
                </div>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Vista previa de imagen actual */}
      {currentImage && (
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 dark:text-gray-100">Imagen generada</h4>
          <div className="relative bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
            <img
              src={currentImage}
              alt="Imagen generada para el artículo"
              className="w-full h-64 object-cover"
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center opacity-0 hover:opacity-100">
              <div className="flex space-x-2">
                <button
                  onClick={() => window.open(currentImage, '_blank')}
                  className="p-2 bg-white bg-opacity-90 rounded-lg hover:bg-opacity-100 transition-all"
                  title="Vista previa completa"
                >
                  <Eye className="w-4 h-4 text-gray-700" />
                </button>
                <button
                  onClick={downloadImage}
                  className="p-2 bg-white bg-opacity-90 rounded-lg hover:bg-opacity-100 transition-all"
                  title="Descargar imagen"
                >
                  <Download className="w-4 h-4 text-gray-700" />
                </button>
                <button
                  className="p-2 bg-white bg-opacity-90 rounded-lg hover:bg-opacity-100 transition-all"
                  title="Herramientas de recorte"
                >
                  <Crop className="w-4 h-4 text-gray-700" />
                </button>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Imagen actual ({generatedImages.length}/{MAX_IMAGES} generadas)
            </div>
            
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Modelo: {currentImageModel || 'No especificado'}
            </div>
          </div>
          
          {/* Opciones avanzadas debajo de la imagen */}
          <div className="pt-4 border-t">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-4"
            >
              <Settings className="w-4 h-4" />
              <span>Opciones avanzadas</span>
            </button>
            
            {showAdvanced && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Subir imagen existente
                </label>
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center space-y-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                  >
                    <Image className="w-8 h-8" />
                    <span className="text-sm">Seleccionar archivo</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Imágenes generadas */}
      {generatedImages.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 dark:text-gray-100">
            Imágenes generadas ({generatedImages.length}/{MAX_IMAGES})
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {generatedImages.map((imageData, index) => (
              <div
                key={imageData.timestamp}
                onClick={() => {
                  setCurrentImage(imageData.url)
                  setCurrentImageModel(imageData.isUploaded ? 'Foto cargada' : AI_MODELS.find(m => m.id === imageData.model)?.name || 'No especificado')
                  onImageGenerated(imageData.url, imageData.prompt)
                }}
                className={clsx(
                  "relative aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden cursor-pointer transition-all",
                  currentImage === imageData.url
                    ? 'ring-2 ring-[#04315a] shadow-lg'
                    : 'hover:ring-2 hover:ring-gray-300 dark:hover:ring-gray-500'
                )}
              >
                <img
                  src={imageData.url}
                  alt={`Imagen generada ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-all flex items-end justify-end p-2">
                  <div className="bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded opacity-0 hover:opacity-100 transition-opacity">
                    #{index + 1}
                  </div>
                </div>
                {/* Indicador de imagen actual */}
                {currentImage === imageData.url && (
                  <div className="absolute top-2 right-2">
                    <div className="w-3 h-3 bg-[#04315a] rounded-full border-2 border-white"></div>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {/* Información adicional */}
          <div className="text-center text-sm text-gray-500 dark:text-gray-400">
            {generatedImages.length >= MAX_IMAGES ? (
              <span>Se ha alcanzado el máximo de {MAX_IMAGES} imágenes. Haz clic en cualquier imagen para seleccionarla.</span>
            ) : (
              <span>Haz clic en cualquier imagen para seleccionarla como imagen principal del artículo.</span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}