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
  Scissors,
  AlertCircle,
  User,
  Building,
  Scale,
  Layout,
  Smartphone,
  BookOpen,
  Save
} from 'lucide-react'
import { clsx } from 'clsx'
import ImageModelSelector, { ImageAIModel } from '../common/ImageModelSelector'
import aiService from '../../services/aiService'
import { compressBase64Image, isImageTooLarge } from '../../utils/imageCompression'
import { ImageSectionPreview } from './ImageSectionPreview'
import ImageLibraryModal from './ImageLibraryModal'
import SaveToLibraryModal from './SaveToLibraryModal'

// Import AIModel type for analysis request
type AIModel = 'gpt4o-mini' | 'gemini'

interface ImageGeneratorProps {
  document: any
  onImageGenerated: (imageUrl: string, prompt: string, metaDescription?: string) => void
  generatedImage?: string
  articleContent?: string // Contenido del artículo generado
}


const IMAGE_TYPES = [
  {
    id: 'persona',
    name: 'Persona',
    description: 'Foto de persona relacionada con el caso',
    icon: User,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200'
  },
  {
    id: 'paisaje',
    name: 'Paisaje/Escenario',
    description: 'Lugar o ambiente donde ocurre la acción',
    icon: Building,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200'
  },
  {
    id: 'elemento',
    name: 'Elemento/Objeto Legal',
    description: 'Primer plano de objeto jurídico relevante',
    icon: Scale,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200'
  }
]


interface GeneratedImageData {
  url: string
  prompt: string
  metaDescription?: string
  timestamp: number
  model?: string
  isUploaded?: boolean
}

export default function ImageGenerator({ 
  document, 
  onImageGenerated, 
  generatedImage,
  articleContent 
}: ImageGeneratorProps) {
  const [selectedModel, setSelectedModel] = useState<ImageAIModel>('dalle')
  const [selectedCapability, setSelectedCapability] = useState('')
  const [selectedImageType, setSelectedImageType] = useState<string>('persona')
  const [generatedPrompt, setGeneratedPrompt] = useState('')
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false)
  const [customPrompt, setCustomPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [currentImage, setCurrentImage] = useState(generatedImage || '')
  const [generatedImages, setGeneratedImages] = useState<GeneratedImageData[]>([])
  const [currentImageModel, setCurrentImageModel] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [generationError, setGenerationError] = useState<string | null>(null)
  const [showLibraryModal, setShowLibraryModal] = useState(false)
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [imageToSave, setImageToSave] = useState<{ url: string; prompt: string; imageId: string; metaDescription?: string } | null>(null)
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, imageX: 0, imageY: 0 })
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const MAX_IMAGES = 4

  // Función para guardar imagen en biblioteca
  const handleSaveToLibrary = (imageUrl: string, prompt: string, imageId: string) => {
    // Buscar la metadescripción de la imagen en las imágenes generadas
    const imageWithMeta = generatedImages.find(img => img.url === imageUrl)

    console.log('🔍 DEBUG: Preparando imagen para guardar', {
      imageUrl: imageUrl.substring(0, 50) + '...',
      prompt: prompt.substring(0, 100) + '...',
      imageId,
      foundImageWithMeta: !!imageWithMeta,
      metaDescription: imageWithMeta?.metaDescription
    })

    setImageToSave({
      url: imageUrl,
      prompt,
      imageId,
      metaDescription: imageWithMeta?.metaDescription || null
    })
    setShowSaveModal(true)
  }

  // Función para realizar el guardado
  const performSaveToLibrary = async (customTags: string[], isPublic: boolean, metaDescription?: string): Promise<boolean> => {
    if (!imageToSave) return false

    try {
      // Determinar el estilo basado en el tipo de imagen seleccionado
      const style = selectedImageType === 'persona' ? 'persona' :
                   selectedImageType === 'paisaje' ? 'paisaje' : 'elemento'

      const requestBody = {
        imageUrl: imageToSave.url,
        prompt: imageToSave.prompt,
        model: currentImageModel || selectedModel,
        style,
        documentId: document?.id,
        customTags,
        isPublic,
        metaDescription: metaDescription?.trim() || imageToSave.metaDescription || null
      }

      console.log('🔍 DEBUG: Enviando petición de guardado:', requestBody)

      const response = await fetch('/api/storage/images/save-from-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error guardando imagen')
      }

      const result = await response.json()
      console.log('Imagen guardada exitosamente:', result)
      return true
    } catch (error) {
      console.error('Error guardando imagen en biblioteca:', error)
      return false
    }
  }

  // Función para seleccionar imagen de biblioteca
  const handleSelectFromLibrary = (imageUrl: string, prompt: string, imageId: string, metaDescription?: string) => {
    // Crear objeto de imagen similar al generado
    const libraryImage: GeneratedImageData = {
      url: imageUrl,
      prompt,
      timestamp: Date.now(),
      model: 'library', // Indicar que viene de biblioteca
      isUploaded: false
    }

    // Agregar a la lista de imágenes generadas
    setGeneratedImages(prev => {
      const newImages = [...prev, libraryImage]
      if (newImages.length > MAX_IMAGES) {
        newImages.shift() // Remover la más antigua si excede el límite
      }
      return newImages
    })

    // Establecer como imagen actual
    setCurrentImage(imageUrl)
    setGeneratedPrompt(prompt)
    setCustomPrompt(prompt)
    console.log('🔍 ImageGenerator - handleSelectFromLibrary recibido:', {
      imageUrl,
      prompt,
      imageId,
      metaDescription
    })
    onImageGenerated(imageUrl, prompt, metaDescription || null)

    // Guardar en localStorage
    if (document?.id) {
      const storageKey = `image-generator-${document.id}`
      const newImages = [...generatedImages, libraryImage]
      if (newImages.length > MAX_IMAGES) {
        newImages.shift()
      }
      localStorage.setItem(storageKey, JSON.stringify(newImages))
    }
  }

  // Handlers para arrastre de imagen
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
    setDragStart({
      x: e.clientX,
      y: e.clientY,
      imageX: 0, // Siempre mantener X en 0
      imageY: imagePosition.y
    })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return

    const deltaY = e.clientY - dragStart.y

    // Limitar el arrastre solo vertical
    const maxOffset = 100 // píxeles
    const newY = Math.max(-maxOffset, Math.min(maxOffset, dragStart.imageY + deltaY))

    setImagePosition({ x: 0, y: newY })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Resetear posición cuando cambia la imagen
  useEffect(() => {
    setImagePosition({ x: 0, y: 0 })
  }, [currentImage])

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


  // Función para validar y sanitizar contenido sensible
  const validateContentSafety = (analysis: any) => {
    const sensitiveTerms = [
      'niño', 'niña', 'menor', 'infante', 'bebé', 'adolescente',
      'familia', 'hijo', 'hija', 'padre', 'madre', 'hermano', 'hermana',
      'violencia', 'abuso', 'maltrato', 'conflicto armado', 'guerra',
      'muerte', 'fallecimiento', 'víctima', 'acusado', 'delito grave'
    ]

    const content = JSON.stringify(analysis).toLowerCase()
    const hasSensitiveContent = sensitiveTerms.some(term => content.includes(term))

    if (hasSensitiveContent) {
      console.warn('Contenido sensible detectado, aplicando filtros adicionales')
      return {
        ...analysis,
        profesional: 'profesional legal especializado',
        escenario: 'institución jurídica colombiana',
        objetoLegal: 'documentos legales oficiales',
        grupoEtnico: 'profesional colombiano',
        tono: 'profesional y formal'
      }
    }

    return analysis
  }

  // Plantillas por tipo de imagen
  const getTemplateByType = (imageType: string, analysis: any) => {
    // Función para filtrar contenido sensible
    const filterSensitiveContent = (text: string) => {
      const sensitivePatterns = [
        /\bmenor(es)?\b/gi,
        /\bniñ[oa]s?\b/gi,
        /\binfant(es)?\b/gi,
        /\bmadre.*víctima\b/gi,
        /\bviolencia\b/gi,
        /\babuso\b/gi,
        /\bmaltrato\b/gi
      ]
      
      let filtered = text
      sensitivePatterns.forEach(pattern => {
        filtered = filtered.replace(pattern, '')
      })
      
      return filtered.replace(/\s+/g, ' ').trim()
    }

    // Obtener contenido seguro sin elementos sensibles
    const safeScenario = filterSensitiveContent(analysis.escenario || 'ambiente jurídico profesional')
    
    const templates = {
      persona: `Fotografía documental profesional en blanco y negro o color natural, tomada con lente 50mm, iluminación natural suave. Silueta de ${analysis.profesional || 'profesional del derecho'} trabajando en ${safeScenario || 'tribunal colombiano'}, enfocándose únicamente en las manos sosteniendo documentos legales, vestimenta formal ejecutiva, escritorio de madera con códigos legales y jurisprudencia. Composición horizontal, estilo foto periodística, sin rostros visibles, enfoque en actividad profesional jurídica. Realista, no ilustración.`,

      paisaje: `Fotografía arquitectónica documental de ${safeScenario || 'palacio de justicia colombiano'}, tomada con dron o trípode, lente gran angular 24mm, iluminación natural diurna. Fachada institucional colombiana, detalles arquitectónicos judiciales, entrada principal con columnas, banderas nacionales, ambiente solemne y profesional. Composición amplia, estilo foto periodística de arquitectura institucional, colores naturales, enfoque en majestuosidad jurídica. Realista, no renderizado 3D.`,

      elemento: `Fotografía macro documental de ${analysis.objetoLegal || 'documentos jurídicos oficiales'} sobre escritorio profesional, tomada con lente macro 100mm, iluminación de estudio suave con reflectores. Primer plano de códigos legales colombianos, sentencias impresas, sello judicial oficial, composición centrada, enfoque selectivo en elementos jurídicos, colores institucionales sobrios. Estilo foto periodística forense, realista, no ilustración artística.`
    }
    
    return templates[imageType as keyof typeof templates] || templates.elemento
  }

  const generatePrompt = async () => {
    console.log('🎯 BOTÓN "GENERAR PROMPT" CLICKEADO')
    console.log('📋 Estado inicial:', {
      selectedModel,
      selectedCapability,
      selectedImageType,
      document: document?.id,
      hasArticleContent: !!articleContent,
      articleContentLength: articleContent?.length || 0
    })

    setIsGeneratingPrompt(true)
    setGenerationError(null)

    try {
      console.log('🚀 INICIANDO GENERACIÓN DE PROMPT INTELIGENTE CON NUEVO SISTEMA')
      console.log('📄 Tipo de imagen seleccionado:', selectedImageType)

      // ✅ NUEVO SISTEMA: Llamada directa al endpoint de imágenes sin prompt para generar uno inteligente
      console.log('🔗 Llamando al nuevo sistema de generación inteligente de prompts...')

      // Hacer una llamada solo para generar el prompt (sin generar imagen real)
      const promptRequest = {
        documentId: document.id,
        model: selectedModel,
        style: selectedImageType, // Usar el tipo de imagen seleccionado
        count: 1,
        // NO incluir 'prompt' para que se genere automáticamente
      }

      console.log('📤 Enviando request para generar prompt:', promptRequest)

      const result = await aiService.generateImages(promptRequest)

      if (result && result.images && result.images.length > 0) {
        const generatedImagePrompt = result.images[0].prompt

        console.log('✅ PROMPT INTELIGENTE GENERADO:', {
          promptLength: generatedImagePrompt.length,
          promptPreview: generatedImagePrompt.substring(0, 200) + '...',
          fullPrompt: generatedImagePrompt
        })

        // Establecer el prompt generado en la interfaz
        setGeneratedPrompt(generatedImagePrompt)
        setCustomPrompt(generatedImagePrompt)

        console.log('✅ PROMPT ESTABLECIDO EN LA INTERFAZ')
        return // Salir exitosamente

      } else {
        throw new Error('No se pudo generar el prompt inteligente')
      }

    } catch (error) {
      console.warn('❌ Error con nuevo sistema, usando fallback local:', error)

      // ✅ FALLBACK LOCAL: Generar prompt simple basado en el tipo de imagen
      console.log('⚠️ Usando fallback local simple')

      const fallbackPrompts = {
        persona: `Professional legal consultation scene with individuals shown from back view, blurred faces preserving anonymity, modern office setting, corporate attire, legal documents on desk`,
        paisaje: `Modern administrative office with professional lighting, contemporary institutional architecture, clean professional environment related to legal proceedings`,
        elemento: `Close-up of official legal documents on professional desk, administrative paperwork, soft professional lighting, high quality editorial style`
      }

      const fallbackPrompt = fallbackPrompts[selectedImageType as keyof typeof fallbackPrompts] || fallbackPrompts.paisaje

      console.log('✅ PROMPT FALLBACK GENERADO:', fallbackPrompt)

      setGeneratedPrompt(fallbackPrompt)
      setCustomPrompt(fallbackPrompt)

      console.log('✅ PROMPT FALLBACK ESTABLECIDO EN LA INTERFAZ')
      setGenerationError('Prompt generado con sistema local (IA no disponible)')
  } finally {
      console.log('🏁 Finalizando generación de prompt...')
      setIsGeneratingPrompt(false)
    }
  }

  const generateImage = async () => {
    if (!customPrompt.trim() || generatedImages.length >= MAX_IMAGES) return
    
    setIsGenerating(true)
    setGenerationError(null)
    
    try {
      console.log('Generando imagen con:', { model: selectedModel, prompt: customPrompt })
      
      // Llamada real a la API para generar imágenes
      const result = await aiService.generateImages({
        documentId: document.id,
        model: selectedModel,
        prompt: customPrompt,
        style: selectedImageType, // Usar el tipo de imagen seleccionado
        count: 1
      })
      
      if (result && result.images && result.images.length > 0) {
        const generatedImage = result.images[0]
        let imageUrl = generatedImage.url

        console.log('🎨 DEBUG: Imagen recibida del backend:', {
          id: generatedImage.id,
          prompt: generatedImage.prompt?.substring(0, 100) + '...',
          hasMetaDescription: !!generatedImage.metaDescription,
          metaDescription: generatedImage.metaDescription,
          model: generatedImage.model,
          allKeys: Object.keys(generatedImage)
        })
        
        // Comprimir imagen si es muy grande (especialmente para Gemini base64)
        if (isImageTooLarge(imageUrl, 300)) { // Si es mayor a 300KB
          console.log('🗜️ Imagen muy grande, comprimiendo...')
          try {
            imageUrl = await compressBase64Image(imageUrl, {
              maxWidth: 1024,
              maxHeight: 768,
              quality: 0.85,
              format: 'jpeg'
            })
            console.log('✅ Imagen comprimida exitosamente')
          } catch (compressionError) {
            console.warn('⚠️ Error comprimiendo imagen, usando original:', compressionError)
            // Usar imagen original si falla la compresión
          }
        }
        
        // Nueva imagen generada
        const newImageData: GeneratedImageData = {
          url: imageUrl,
          prompt: generatedImage.prompt,
          metaDescription: generatedImage.metaDescription,
          timestamp: Date.now(),
          model: selectedModel
        }
        
        // Actualizar imagen actual (la que está en el input)
        setCurrentImage(imageUrl)
        setCurrentImageModel(selectedModel === 'dalle' ? 'DALL-E 3' : selectedModel === 'gemini' ? 'Gemini Imagen' : selectedModel)
        
        // Agregar a la lista de imágenes generadas (máximo 4)
        setGeneratedImages(prev => {
          const updated = [newImageData, ...prev].slice(0, MAX_IMAGES)
          return updated
        })

        onImageGenerated(imageUrl, generatedImage.prompt, generatedImage.metaDescription)

        console.log(`✅ Imagen generada exitosamente con ${result.modelUsed}`)
      } else {
        // Si no hay imágenes en la respuesta, mostrar error
        const errorMessage = result?.error || `No se pudo generar la imagen con ${selectedModel}. Por favor intenta de nuevo.`
        console.error('❌ Error: No se generaron imágenes:', errorMessage)
        setGenerationError(errorMessage)
      }
      
    } catch (error) {
      console.error('Error generando imagen:', error)
      setGenerationError(error instanceof Error ? aiService.formatErrorMessage(error) : 'Error desconocido')
    } finally {
      setIsGenerating(false)
    }
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
        
        onImageGenerated(imageUrl, 'Imagen subida por el usuario', null)
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
    <div className="h-full flex flex-col space-y-6">
      {/* Selector de modelo */}
      <div className="w-full">
        <ImageModelSelector
          selectedModel={selectedModel}
          onModelSelect={setSelectedModel}
          compact={true}
          className="justify-center"
        />
      </div>

      {/* Selector de tipo de imagen */}
      <div className="w-full">
        <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-4">Tipo de imagen</h4>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {IMAGE_TYPES.map((imageType) => {
            const isSelected = selectedImageType === imageType.id
            
            return (
              <div
                key={imageType.id}
                onClick={() => setSelectedImageType(imageType.id)}
                className={clsx(
                  'relative w-full p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-lg',
                  isSelected 
                    ? `${imageType.borderColor} ${imageType.bgColor} shadow-md` 
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-800'
                )}
              >
                <div className="flex items-center space-x-3">
                  <div className={clsx(
                    'p-2 rounded-lg',
                    isSelected ? imageType.bgColor : 'bg-gray-100 dark:bg-gray-700'
                  )}>
                    <imageType.icon className={clsx(
                      'w-5 h-5',
                      isSelected ? imageType.color : 'text-gray-600 dark:text-gray-400'
                    )} />
                  </div>
                  <div className="flex-1">
                    <h4 className={clsx(
                      'font-medium mb-1',
                      isSelected ? imageType.color : 'text-gray-900 dark:text-gray-100'
                    )}>
                      {imageType.name}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {imageType.description}
                    </p>
                  </div>
                </div>
                {isSelected && (
                  <div className="absolute top-2 right-2">
                    <div className="w-6 h-6 bg-[#04315a] rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-[#3ff3f2] rounded-full"></div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Error de generación */}
      {generationError && (
        <div className="w-full p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-red-700 dark:text-red-300">
              <p className="font-medium">Error al generar imagen</p>
              <p className="mt-1">{generationError}</p>
            </div>
          </div>
        </div>
      )}

      {/* Opciones de generación e imágenes */}
      <div className="w-full space-y-4">
        {/* Generación automática de prompt */}
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-gray-900 dark:text-gray-100">Generar descripción automática</h4>
          <button
            onClick={generatePrompt}
            disabled={isGeneratingPrompt}
            className={clsx(
              'px-4 py-2 rounded-lg font-medium transition-all duration-200',
              isGeneratingPrompt
                ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                : 'bg-[#04315a] text-[#3ff3f2] hover:bg-[#062847]'
            )}
          >
            {isGeneratingPrompt ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400 dark:border-gray-500"></div>
                <span>Generando...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4" />
                <span>Generar Prompt</span>
              </div>
            )}
          </button>
        </div>

        {/* Opciones avanzadas */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-600">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          >
            <Settings className="w-4 h-4" />
            <span>Opciones avanzadas</span>
          </button>

          {/* Botón para limpiar imágenes - solo si hay imágenes */}
          {generatedImages.length > 0 && (
            <button
              onClick={() => {
                // Limpiar localStorage para este documento
                if (document?.id) {
                  const storageKey = `image-generator-${document.id}`
                  localStorage.removeItem(storageKey)
                }
                // Resetear estados
                setCurrentImage('')
                setGeneratedImages([])
                setCurrentImageModel('')
                setGeneratedPrompt('')
                setCustomPrompt('')
                onImageGenerated('', '', null)
                console.log('Imágenes eliminadas del localStorage')
              }}
              className="flex items-center space-x-2 text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Limpiar imágenes</span>
            </button>
          )}
        </div>

        {/* Biblioteca de imágenes - en opciones avanzadas */}
        {showAdvanced && (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600 space-y-4">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Biblioteca de imágenes
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Botón para abrir biblioteca */}
              <button
                onClick={() => setShowLibraryModal(true)}
                className="flex items-center justify-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <BookOpen className="w-4 h-4" />
                <span>Biblioteca de Imágenes</span>
              </button>

              {/* Botón para guardar imagen actual - solo si hay imagen actual */}
              {currentImage && (
                <button
                  onClick={() => handleSaveToLibrary(currentImage, customPrompt || generatedPrompt, 'current')}
                  className="flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>Guardar en Biblioteca</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Subir imagen existente - en opciones avanzadas */}
        {showAdvanced && (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
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
                disabled={generatedImages.length >= MAX_IMAGES}
                className={clsx(
                  "flex flex-col items-center space-y-2 transition-colors",
                  generatedImages.length >= MAX_IMAGES
                    ? "text-gray-400 dark:text-gray-500 cursor-not-allowed"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                )}
              >
                <Image className="w-8 h-8" />
                <span className="text-sm">
                  {generatedImages.length >= MAX_IMAGES
                    ? `Límite alcanzado (${MAX_IMAGES} imágenes)`
                    : "Seleccionar archivo"
                  }
                </span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Descripción de la imagen */}
      {generatedPrompt && (
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 dark:text-gray-100">Descripción de la imagen</h4>
          <textarea
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            className="w-full min-w-full h-24 p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#04315a] focus:border-[#04315a] resize bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            placeholder="Describe la imagen que quieres generar..."
            style={{ width: '100%', minWidth: '100%' }}
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
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900 dark:text-gray-100">Imagen generada</h4>
          <div className="relative bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
            <div className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 rounded-lg border border-blue-300 dark:border-blue-500 shadow-sm max-w-4xl mx-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Layout className="w-3 h-3 text-blue-600" />
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">📰 Principal - 16:9</span>
                  </div>
                  <div className="bg-white dark:bg-gray-700 rounded-md p-3 shadow-sm border border-blue-200 dark:border-blue-600">
                    <div
                      className="relative overflow-hidden rounded-lg cursor-ns-resize"
                      style={{ aspectRatio: '16/9' }}
                      onMouseDown={handleMouseDown}
                      onMouseMove={handleMouseMove}
                      onMouseUp={handleMouseUp}
                      onMouseLeave={handleMouseUp}
                    >
                      <img
                        src={currentImage}
                        alt={generatedImages.find(img => img.url === currentImage)?.prompt || 'Imagen generada'}
                        className="select-none"
                        style={{
                          width: '100%',
                          height: 'auto',
                          objectFit: 'cover',
                          transform: `translate(0px, ${imagePosition.y}px)`,
                          transition: isDragging ? 'none' : 'transform 0.2s ease'
                        }}
                        draggable={false}
                      />
                    </div>
                    <div className="pt-1 text-center">
                      <h5 className="text-xs font-medium text-gray-900 dark:text-gray-100 line-clamp-1">Principal {isDragging && '(Arrastrando...)'}</h5>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Smartphone className="w-3 h-3 text-green-600" />
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">📱 Compacta - 3:2</span>
                  </div>
                  <div className="bg-white dark:bg-gray-700 rounded-md p-3 shadow-sm border border-blue-200 dark:border-blue-600">
                    <div className="flex space-x-2">
                      <div className="flex-shrink-0 w-24 h-16 bg-gray-100 rounded overflow-hidden" style={{ aspectRatio: '3/2' }}>
                        <img
                          src={currentImage}
                          alt={generatedImages.find(img => img.url === currentImage)?.prompt || 'Imagen generada'}
                          className=""
                          style={{
                            width: '110%',
                            height: 'auto',
                            objectFit: 'cover',
                            transform: `translate(0px, ${imagePosition.y * 0.15}px)`,
                            transition: isDragging ? 'none' : 'transform 0.2s ease'
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h5 className="text-xs font-medium text-gray-900 dark:text-gray-100 line-clamp-1">Compacta</h5>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-2 bg-blue-50 dark:bg-blue-900/20 rounded-md p-1.5 border border-blue-200 dark:border-blue-800">
                <div className="text-xs text-blue-700 dark:text-blue-300 text-center">
                  1792×1024px • Recorte automático
                </div>
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
        </div>
      )}

      {/* Imágenes generadas */}
      {generatedImages.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900 dark:text-gray-100">
            Imágenes generadas ({generatedImages.length}/{MAX_IMAGES})
          </h4>
          <div className="flex flex-wrap gap-3">
            {generatedImages.map((imageData, index) => (
              <div
                key={imageData.timestamp}
                onClick={() => {
                  console.log('🖱️ DEBUG: Imagen seleccionada desde galería', {
                    url: imageData.url.substring(0, 50) + '...',
                    prompt: imageData.prompt?.substring(0, 100) + '...' || 'No prompt',
                    hasMetaDescription: !!imageData.metaDescription,
                    metaDescription: imageData.metaDescription,
                    model: imageData.model
                  })

                  setCurrentImage(imageData.url)
                  setCurrentImageModel(imageData.isUploaded ? 'Foto cargada' :
                    imageData.model === 'dalle' ? 'DALL-E 3' :
                    imageData.model === 'gemini' ? 'Gemini Imagen' :
                    imageData.model || 'No especificado')
                  onImageGenerated(imageData.url, imageData.prompt, imageData.metaDescription)
                }}
                className={clsx(
                  "relative bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden cursor-pointer transition-all",
                  currentImage === imageData.url
                    ? 'ring-2 ring-[#04315a] shadow-lg'
                    : 'hover:ring-2 hover:ring-gray-300 dark:hover:ring-gray-500'
                )}
                style={{ width: '200px', aspectRatio: '16/9' }}
              >
                <img
                  src={imageData.url}
                  alt={`Imagen generada ${index + 1}`}
                  className="w-full h-full object-cover"
                  style={{ aspectRatio: '16/9' }}
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

      {/* Modales de biblioteca */}
      <ImageLibraryModal
        isOpen={showLibraryModal}
        onClose={() => setShowLibraryModal(false)}
        onSelectImage={handleSelectFromLibrary}
        document={document}
      />

      <SaveToLibraryModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onSave={performSaveToLibrary}
        imageUrl={imageToSave?.url || ''}
        prompt={imageToSave?.prompt || ''}
        initialMetaDescription={imageToSave?.metaDescription}
        isSaving={false}
      />
    </div>
  )
}