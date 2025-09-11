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
  Scale
} from 'lucide-react'
import { clsx } from 'clsx'
import ImageModelSelector, { ImageAIModel } from '../common/ImageModelSelector'
import aiService from '../../services/aiService'
import { compressBase64Image, isImageTooLarge } from '../../utils/imageCompression'

// Import AIModel type for analysis request
type AIModel = 'gpt4o-mini' | 'gemini'

interface ImageGeneratorProps {
  document: any
  onImageGenerated: (imageUrl: string, prompt: string) => void
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
      persona: `Fotografía editorial de ${analysis.grupoEtnico && analysis.grupoEtnico !== 'profesional colombiano' ? `${analysis.profesional || 'profesional legal'} de origen ${analysis.grupoEtnico}` : `${analysis.profesional || 'profesional del derecho'}`} en ${safeScenario || 'despacho judicial moderno'}. Toma de perfil o tres cuartos, manos trabajando con documentos, vestimenta ejecutiva formal, iluminación profesional dramática, enfoque en la actividad profesional, sin mostrar rostro completo frontalmente.`,
      
      paisaje: `Vista arquitectónica de ${safeScenario || 'palacio de justicia colombiano'}. Arquitectura judicial moderna colombiana, perspectiva profesional, iluminación natural diurna, colores institucionales sobrios, estilo fotografía editorial arquitectónica.`,
      
      elemento: `Primer plano editorial de ${analysis.objetoLegal || 'documentos jurídicos oficiales'} sobre escritorio de madera. Manos profesionales interactuando con los elementos, iluminación dramática profesional, colores institucionales sobrios, enfoque macro, estilo fotografía editorial corporativa legal.`
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
    
    if (!articleContent || articleContent.trim().length === 0) {
      console.log('❌ No hay artículo generado para crear el prompt de imagen')
      setGenerationError('Primero debes generar un artículo antes de crear el prompt para la imagen')
      return
    }
    
    setIsGeneratingPrompt(true)
    setGenerationError(null)
    
    try {
      console.log('🚀 INICIANDO ANÁLISIS INTELIGENTE DEL ARTÍCULO')
      console.log('📄 Tipo de imagen seleccionado:', selectedImageType)
      console.log('📄 Contenido del artículo:', {
        length: articleContent.length,
        preview: articleContent.substring(0, 200) + '...'
      })
      
      // ✅ LLAMADA REAL AL BACKEND PARA ANÁLISIS INTELIGENTE
      try {
        console.log('🔗 Llamando a AI para análisis inteligente del artículo...')
        
        const analysisRequest = {
          documentId: document.id,
          model: 'gpt4o-mini' as AIModel,
          maxWords: 200,
          tone: 'professional' as const,
          customInstructions: `Analiza este artículo jurídico y extrae elementos SEGUROS Y APROPIADOS para una imagen editorial profesional de tipo "${selectedImageType}".

ARTÍCULO:
${articleContent}

DIRECTRICES IMPORTANTES:
- NO incluir referencias a menores de edad, niños, violencia explícita o contenido sensible
- Enfocar ÚNICAMENTE en aspectos institucionales, legales y profesionales
- Generar elementos apropiados para medios editoriales corporativos

ANÁLISIS REQUERIDO:

1. PROFESIONAL: Tipo de profesional legal (magistrado, juez, abogado, funcionario judicial, registrador, etc.)

2. GRUPO ÉTNICO: Solo si se menciona EXPLÍCITAMENTE en el artículo (afrocolombianos, indígenas, etc.)
   - Si NO se menciona: usar "profesional colombiano" (sin especificar raza)

3. ESCENARIO: Ambiente institucional apropiado (tribunal supremo, palacio de justicia, despacho judicial, notaría, registro civil, etc.)

4. ELEMENTO LEGAL: Objeto jurídico profesional (códigos legales, documentos oficiales, sello judicial, balanza, martillo judicial, etc.)

5. TEMA: Área legal específica (derecho constitucional, civil, penal, administrativo, etc.)

6. TONO: Ambiente institucional (serio, profesional, solemne, formal, etc.)

FORMATO DE RESPUESTA JSON:
{
  "profesional": "tipo de profesional legal",
  "grupoEtnico": "grupo específico mencionado o profesional colombiano",
  "escenario": "ambiente institucional apropiado",
  "objetoLegal": "elemento jurídico profesional",
  "tema": "área legal específica",
  "tono": "ambiente institucional profesional"
}`
        }
        
        console.log('📤 Enviando artículo para análisis inteligente:', {
          articleLength: articleContent.length,
          imageType: selectedImageType,
          model: 'gpt4o-mini'
        })
        
        const result = await aiService.generateArticle(analysisRequest)
        
        console.log('✅ ANÁLISIS RECIBIDO DEL BACKEND:', {
          modelUsed: result.modelUsed,
          analysisContent: result.content
        })
        
        // Intentar parsear el JSON del análisis
        let analysis: any = {}
        try {
          const jsonMatch = result.content.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            analysis = JSON.parse(jsonMatch[0])
            console.log('✅ ANÁLISIS PARSEADO:', analysis)
          } else {
            throw new Error('No se encontró JSON válido en la respuesta')
          }
        } catch (parseError) {
          console.warn('❌ Error parseando análisis, usando fallback:', parseError)
          throw parseError
        }
        
        // Generar prompt usando la plantilla apropiada
        const finalPrompt = getTemplateByType(selectedImageType, analysis)
        
        console.log('✅ PROMPT FINAL GENERADO:', {
          imageType: selectedImageType,
          promptLength: finalPrompt.length,
          finalPrompt: finalPrompt
        })
        
        setGeneratedPrompt(finalPrompt)
        setCustomPrompt(finalPrompt)
        
        console.log('✅ PROMPT INTELIGENTE ESTABLECIDO EN LA INTERFAZ')
        return // Salir exitosamente con AI real
        
      } catch (apiError) {
        console.warn('❌ Error en análisis inteligente, usando fallback local:', apiError)
      }
      
      // ✅ FALLBACK LOCAL CON PLANTILLAS POR TIPO
      console.log('⚠️ Usando fallback local con plantillas por tipo')
      
      // Crear análisis básico del artículo localmente
      const articleTitle = articleContent.match(/^#\s*(.+)$/m)?.[1] || 'Artículo jurídico'
      const isAfroCase = /afrocolombian|afrodescendient|negro|negra/i.test(articleContent)
      const isIndigenousCase = /indígena|indígenas|ancestral|territorio|resguardo/i.test(articleContent)
      const isEnvironmentalCase = /agua|río|ambiente|minería|deforest|contamina/i.test(articleContent)
      
      const fallbackAnalysis = {
        profesional: /juez|magistrado/i.test(articleContent) ? 'magistrado' : 
                     /abogad/i.test(articleContent) ? 'abogado' : 
                     /registrador/i.test(articleContent) ? 'registrador' :
                     'profesional legal',
        grupoEtnico: isAfroCase ? 'afrocolombianos' : 
                     isIndigenousCase ? 'indígenas colombianos' : 
                     'profesional colombiano',
        escenario: /corte|tribunal supremo/i.test(articleContent) ? 'palacio de justicia' :
                   /juzgado/i.test(articleContent) ? 'despacho judicial' :
                   /notaría/i.test(articleContent) ? 'oficina notarial' :
                   'institución jurídica profesional',
        objetoLegal: /martillo|mazo/i.test(articleContent) ? 'martillo judicial' :
                     /document|código/i.test(articleContent) ? 'documentos jurídicos oficiales' :
                     /balanza|justicia/i.test(articleContent) ? 'balanza de la justicia' :
                     'elementos legales profesionales',
        tema: articleTitle,
        tono: isEnvironmentalCase ? 'esperanzador y natural' :
              /conflicto|violencia/i.test(articleContent) ? 'serio y solemne' :
              'profesional y formal',
        paletaColores: isEnvironmentalCase ? 'verdes naturales y azules' :
                       isAfroCase ? 'tonos cálidos y dorados' :
                       isIndigenousCase ? 'tonos tierra y naturales' :
                       'azules institucionales y grises elegantes'
      }
      
      const generatedPromptText = getTemplateByType(selectedImageType, fallbackAnalysis)
      
      console.log('✅ PROMPT GENERADO:', {
        model: selectedModel,
        promptLength: generatedPromptText.length,
        promptPreview: generatedPromptText.substring(0, 100) + '...',
        fullPrompt: generatedPromptText
      })
      
      setGeneratedPrompt(generatedPromptText)
      setCustomPrompt(generatedPromptText)
      
      console.log('✅ PROMPT ESTABLECIDO EN LA INTERFAZ')
      
    } catch (error) {
      console.error('❌ ERROR GENERANDO PROMPT:', error)
      console.error('❌ Detalles del error:', {
        message: error instanceof Error ? error.message : 'Error desconocido',
        type: typeof error
      })
      setGenerationError('Error al generar descripción automática')
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
        style: 'professional',
        count: 1
      })
      
      if (result && result.images && result.images.length > 0) {
        const generatedImage = result.images[0]
        let imageUrl = generatedImage.url
        
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
        
        onImageGenerated(imageUrl, generatedImage.prompt)

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
        <div className="grid grid-cols-1 gap-3">
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

      {/* Generación automática de prompt */}
      <div className="w-full">
        <div className="flex items-center justify-between mb-4">
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
      </div>

      {/* Descripción de la imagen */}
      {generatedPrompt && (
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 dark:text-gray-100">Descripción de la imagen</h4>
          <textarea
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            className="w-full min-w-full h-24 p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#04315a] focus:border-[#04315a] resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
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
          <div className="flex flex-col space-y-4 w-full">
            {generatedImages.map((imageData, index) => (
              <div
                key={imageData.timestamp}
                onClick={() => {
                  setCurrentImage(imageData.url)
                  setCurrentImageModel(imageData.isUploaded ? 'Foto cargada' : 
                    imageData.model === 'dalle' ? 'DALL-E 3' : 
                    imageData.model === 'gemini' ? 'Gemini Imagen' : 
                    imageData.model || 'No especificado')
                  onImageGenerated(imageData.url, imageData.prompt)
                }}
                className={clsx(
                  "relative w-full min-w-full h-48 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden cursor-pointer transition-all",
                  currentImage === imageData.url
                    ? 'ring-2 ring-[#04315a] shadow-lg'
                    : 'hover:ring-2 hover:ring-gray-300 dark:hover:ring-gray-500'
                )}
                style={{ width: '100%', minWidth: '100%' }}
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