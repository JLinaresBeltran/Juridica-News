import { useState, useEffect } from 'react'
import {
  Tags,
  Hash,
  AlignLeft,
  Sparkles,
  Plus,
  X,
  Target,
  Eye,
  Search,
  CheckCircle,
  AlertCircle,
  Link,
  Settings,
  Brain,
  BarChart3,
  Info,
  FileText,
  Image as ImageIcon,
  Clock,
  Wand2
} from 'lucide-react'
import { clsx } from 'clsx'
import {
  generateSlug,
  generateArticleUrl,
  generateMetaDescription,
  extractKeywords,
  calculateReadingTime,
  validateSEOTitle,
  validateMetaDescription,
  validateAltText,
  validateSchemaDescription,
  getValidationColor,
  calculateSEOScore,
  calculateKeywordDensity,
  generateSchemaOrg,
  generateImageAltText
} from '../../utils/seoUtils'
import { aiService } from '../../services/aiService'

interface MetadataEditorProps {
  document: any
  articleTitle: string
  articleContent?: string
  onMetadataChange: (metadata: ArticleMetadata) => void
  initialMetadata?: ArticleMetadata
  imageMetaDescription?: string // Nueva prop para metadescripción de imagen generada
}

interface ArticleMetadata {
  description: string
  keywords: string[]
  section: string
  customTags: string[]

  // Meta Tag SEO para Google (65 caracteres)
  metaTitle: string          // <title> tag - para SERPs

  // Contenido Real del Artículo (sin límite estricto)
  realTitle: string          // <h1> - Título visible del artículo
  realSubtitle?: string      // <h2> - Subtítulo visible del artículo

  // Campos legacy para compatibilidad
  seoTitle: string           // Mantener para transición
  seoTitleOptimized?: string // "Título para Google" actual
  seoSubtitle?: string       // Campo H2 actual

  selectedTitleType?: 'seoTitle' | 'seoTitleOptimized'
  finalTitle?: string
  readingTime: number
  slug?: string
  canonicalUrl?: string
  imageAlt?: string
  imageDescription?: string
  schemaDescription?: string
}

const LEGAL_SECTIONS = [
  'Constitucional',
  'Administrativo',
  'Fiscal/Aduanero',
  'Societario',
  'Penal',
  'Civil/Familia',
  'Digital',
  'Laboral',
  'Regulatorio'
]

const SUGGESTED_KEYWORDS = [
  'jurisprudencia',
  'sentencia',
  'corte constitucional',
  'derechos fundamentales',
  'tutela',
  'precedente judicial',
  'control constitucionalidad',
  'contencioso administrativo',
  'régimen fiscal',
  'derecho aduanero',
  'derecho societario',
  'sistema acusatorio',
  'responsabilidad civil',
  'régimen familiar',
  'protección datos',
  'derecho laboral',
  'compliance regulatorio'
]

export default function MetadataEditor({
  document,
  articleTitle,
  articleContent,
  onMetadataChange,
  initialMetadata,
  imageMetaDescription
}: MetadataEditorProps) {
  const [metadata, setMetadata] = useState<ArticleMetadata>(
    initialMetadata || {
      description: '',
      keywords: [],
      section: document?.area || 'Constitucional',
      customTags: [],

      // Nuevos campos SEO diferenciados
      metaTitle: '',  // <title> tag para Google
      realTitle: articleTitle || '',  // <h1> título visible
      realSubtitle: '',  // <h2> subtítulo visible

      // Campos legacy para compatibilidad
      seoTitle: articleTitle || '',
      seoTitleOptimized: articleTitle || '',
      seoSubtitle: '',

      selectedTitleType: 'seoTitle',
      finalTitle: articleTitle || '',
      readingTime: 3
    }
  )
  
  const [newKeyword, setNewKeyword] = useState('')
  const [newTag, setNewTag] = useState('')
  const [isGeneratingMeta, setIsGeneratingMeta] = useState(false)
  const [metadataGenerationSuccess, setMetadataGenerationSuccess] = useState(false)
  const [preservedImageDescription, setPreservedImageDescription] = useState<string | null>(null)
  const [seoValidation, setSeoValidation] = useState({
    title: { isValid: true, issues: [] as string[] },
    description: { isValid: true, issues: [] as string[] }
  })
  const [seoScore, setSeoScore] = useState({ score: 0, details: [] as any[] })

  // Sincronizar con props iniciales
  useEffect(() => {
    if (initialMetadata) {
      setMetadata(initialMetadata)
    }
  }, [initialMetadata])

  // Actualizar título SEO cuando cambie el título del artículo (independiente de initialMetadata)
  useEffect(() => {
    if (articleTitle) {
      setMetadata(prev => ({
        ...prev,
        seoTitle: articleTitle,
        seoTitleOptimized: articleTitle,
        finalTitle: articleTitle,
        selectedTitleType: prev.selectedTitleType || 'seoTitle'
      }))
    }
  }, [articleTitle])

  // Sincronizar metadescripción de imagen cuando llegue desde ImageGenerator
  useEffect(() => {
    console.log('🔍 DEBUG: useEffect imageMetaDescription triggered', {
      imageMetaDescription,
      hasImageMetaDescription: !!imageMetaDescription,
      length: imageMetaDescription?.length || 0,
      currentImageDescription: metadata.imageDescription,
      preservedImageDescription
    })

    if (imageMetaDescription) {
      console.log('🖼️ Actualizando metadescripción de imagen desde ImageGenerator:', imageMetaDescription)

      // Preservar en estado adicional para proteger contra sobrescritura
      setPreservedImageDescription(imageMetaDescription)

      setMetadata(prev => {
        const newMetadata = {
          ...prev,
          imageDescription: imageMetaDescription
        }
        console.log('🔄 ACTUALIZANDO METADATA CON NUEVA IMAGEN DESCRIPCIÓN', {
          previousImageDescription: prev.imageDescription,
          newImageDescription: imageMetaDescription,
          resultingMetadata: newMetadata.imageDescription
        })
        return newMetadata
      })
    }
  }, [imageMetaDescription])

  // Auto-ajustar altura de textareas cuando cambie el contenido
  useEffect(() => {
    const adjustTextareaHeight = (textarea: HTMLTextAreaElement | null) => {
      if (textarea) {
        textarea.style.height = 'auto'
        textarea.style.height = textarea.scrollHeight + 'px'
      }
    }

    // Ajustar después de que el DOM se actualice
    const timeoutId = setTimeout(() => {
      const textareas = window.document.querySelectorAll('textarea[data-auto-resize]')
      textareas.forEach(textarea => adjustTextareaHeight(textarea as HTMLTextAreaElement))
    }, 100)

    return () => clearTimeout(timeoutId)
  }, [metadata.metaTitle, metadata.realTitle, metadata.realSubtitle, metadata.seoTitle, metadata.seoSubtitle, metadata.seoTitleOptimized, metadata.description, metadata.imageAlt, metadata.schemaDescription])

  // Notificar cambios al componente padre con debounce mejorado para auto-guardado
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      onMetadataChange(metadata)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [metadata, onMetadataChange])

  const generateMetadata = async () => {
    setIsGeneratingMeta(true)
    try {
      console.log('🎯 Generando metadata SEO con IA experta:', articleTitle)

      // Verificar que tenemos el contenido del artículo
      if (!articleContent || articleContent.trim().length < 100) {
        console.warn('⚠️ No hay contenido suficiente del artículo para generar metadata')
        // Fallback a generación local si no hay contenido
        await generateMetadataFallback()
        return
      }

      console.log('📄 Usando contenido del artículo:', {
        contentLength: articleContent.length,
        contentPreview: articleContent.substring(0, 200) + '...'
      })

      // Llamar al servicio de IA para generar metadata
      const generatedMetadata = await aiService.generateMetadata({
        articleContent: articleContent,
        articleTitle: articleTitle,
        section: metadata.section,
        model: 'gpt4o-mini' // Usar GPT-4o-mini por defecto para mejor calidad SEO
      })

      console.log('✅ Metadata generada por IA:', generatedMetadata)

      // Generar campos adicionales localmente
      const slug = generateSlug(articleTitle)
      const articleUrl = generateArticleUrl(articleTitle, metadata.section)
      const canonicalUrl = `https://linea-judicial.com${articleUrl}`
      const estimatedReadingTime = calculateReadingTime(articleContent)
      const autoImageAlt = generateImageAltText(articleTitle, metadata.section, 'article')
      const autoImageDescription = `Imagen relacionada con el artículo sobre ${articleTitle} en el área de ${metadata.section}. Análisis jurídico especializado que incluye revisión de precedentes y implicaciones legales. Publicado en Línea Judicial.`

      console.log('🤖 DEBUG: generateMetadata - Estado de metadescripción imagen', {
        currentImageDescription: metadata.imageDescription,
        preservedImageDescription,
        hasImageMetaDescription: !!imageMetaDescription,
        imageMetaDescription,
        autoImageDescription,
        finalWillUse: preservedImageDescription || metadata.imageDescription || autoImageDescription,
        strategy: 'PRESERVAR metadescripción de IA'
      })

      // Combinar metadata de IA con campos locales
      // 🚨 PROBLEMA: Esto sobrescribe la metadescripción real de la imagen
      const completeMetadata = {
        description: generatedMetadata.description,
        keywords: [generatedMetadata.primaryKeyword, ...generatedMetadata.keywords],
        schemaDescription: generatedMetadata.schemaDescription,
        readingTime: estimatedReadingTime,
        slug: articleUrl,
        canonicalUrl,
        imageAlt: autoImageAlt,
        // 🔧 CORRECCIÓN: Priorizar metadescripción preservada de imagen de IA
        imageDescription: (() => {
          const result = preservedImageDescription || metadata.imageDescription || autoImageDescription
          console.log('🤖 GENERACIÓN DE METADATA CON IA: Seleccionando imageDescription', {
            preservedImageDescription,
            currentMetadataImageDescription: metadata.imageDescription,
            autoImageDescription,
            finalResult: result
          })
          return result
        })()
      }

      setMetadata(prev => ({
        ...prev,
        ...completeMetadata
      }))

      // Validar automáticamente después de generar
      validateMetadata(metadata.seoTitle || articleTitle, generatedMetadata.description)

      // Mostrar mensaje de éxito
      setMetadataGenerationSuccess(true)
      setTimeout(() => setMetadataGenerationSuccess(false), 3000)

      console.log('💾 Metadata actualizada exitosamente')

    } catch (error) {
      console.error('❌ Error generando metadata con IA:', error)
      // Fallback a generación local en caso de error
      await generateMetadataFallback()
    } finally {
      setIsGeneratingMeta(false)
    }
  }

  // Función de fallback para generar metadata localmente
  const generateMetadataFallback = async () => {
    console.log('🔄 Usando generación local como fallback')
    
    // Simulación de tiempo de procesamiento
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Generar URL SEO-friendly
    const slug = generateSlug(articleTitle)
    const articleUrl = generateArticleUrl(articleTitle, metadata.section)
    const canonicalUrl = `https://linea-judicial.com${articleUrl}`

    // Generar meta description optimizada
    const contentSample = articleContent || `Análisis jurídico completo sobre ${document?.identifier || articleTitle}. Revisamos las implicaciones legales, precedentes y efectos de esta decisión judicial en el sistema jurídico colombiano. Incluye análisis detallado de ${metadata.section.toLowerCase()} y jurisprudencia relacionada.`
    const optimizedDescription = generateMetaDescription(contentSample, 155)

    // Extraer keywords automáticamente
    const autoKeywords = extractKeywords(articleTitle, contentSample, metadata.section)

    // Calcular tiempo de lectura estimado
    const estimatedReadingTime = calculateReadingTime(contentSample)

    // Generar metadata de imagen automáticamente
    const autoImageAlt = generateImageAltText(articleTitle, metadata.section, 'article')
    const autoImageDescription = `Imagen relacionada con el artículo sobre ${articleTitle} en el área de ${metadata.section}. Análisis jurídico especializado que incluye revisión de precedentes y implicaciones legales. Publicado en Línea Judicial.`

    console.log('🔄 DEBUG: generateMetadataFallback - Estado de metadescripción imagen', {
      currentImageDescription: metadata.imageDescription,
      preservedImageDescription,
      hasImageMetaDescription: !!imageMetaDescription,
      imageMetaDescription,
      autoImageDescription,
      finalWillUse: preservedImageDescription || metadata.imageDescription || autoImageDescription,
      strategy: 'PRESERVAR metadescripción de IA (fallback)'
    })

    const autoGeneratedMeta = {
      description: optimizedDescription,
      keywords: autoKeywords,
      readingTime: estimatedReadingTime,
      slug: articleUrl,
      canonicalUrl,
      imageAlt: autoImageAlt,
      // 🔧 CORRECCIÓN: Priorizar metadescripción preservada de imagen de IA
      imageDescription: (() => {
        const result = preservedImageDescription || metadata.imageDescription || autoImageDescription
        console.log('🔧 GENERACIÓN DE METADATA: Seleccionando imageDescription', {
          preservedImageDescription,
          currentMetadataImageDescription: metadata.imageDescription,
          autoImageDescription,
          finalResult: result
        })
        return result
      })(),
      schemaDescription: optimizedDescription.substring(0, 200) // Usar descripción truncada para schema
    }

    setMetadata(prev => ({
      ...prev,
      ...autoGeneratedMeta
    }))

    // Validar automáticamente después de generar
    validateMetadata(metadata.seoTitle || articleTitle, optimizedDescription)
  }

  // Función para validar metadata SEO con nuevos colores
  const validateMetadata = (title: string, description: string) => {
    const titleValidation = validateSEOTitle(title)
    const descriptionValidation = validateMetaDescription(description)

    setSeoValidation({
      title: titleValidation,
      description: descriptionValidation
    })
  }

  // Efecto para validar en tiempo real y calcular score SEO
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (metadata.seoTitle && metadata.description) {
        validateMetadata(metadata.seoTitle, metadata.description)
      }

      // Calcular score SEO
      const scoreData = calculateSEOScore({
        seoTitle: metadata.seoTitleOptimized,
        description: metadata.description,
        keywords: metadata.keywords,
        slug: metadata.slug,
        imageAlt: metadata.imageAlt,
        section: metadata.section
      })
      setSeoScore(scoreData)
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [metadata])

  const addKeyword = (keyword: string) => {
    if (keyword.trim() && !metadata.keywords.includes(keyword.trim().toLowerCase())) {
      setMetadata(prev => ({
        ...prev,
        keywords: [...prev.keywords, keyword.trim().toLowerCase()]
      }))
      setNewKeyword('')
    }
  }

  const removeKeyword = (keywordToRemove: string) => {
    setMetadata(prev => ({
      ...prev,
      keywords: prev.keywords.filter(k => k !== keywordToRemove)
    }))
  }

  const addCustomTag = (tag: string) => {
    if (tag.trim() && !metadata.customTags.includes(tag.trim())) {
      setMetadata(prev => ({
        ...prev,
        customTags: [...prev.customTags, tag.trim()]
      }))
      setNewTag('')
    }
  }

  const removeCustomTag = (tagToRemove: string) => {
    setMetadata(prev => ({
      ...prev,
      customTags: prev.customTags.filter(t => t !== tagToRemove)
    }))
  }

  const updateField = (field: keyof ArticleMetadata, value: any) => {
    setMetadata(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Función para calcular densidad de keywords (mantenida para compatibilidad)
  const calculateKeywordDensity = (text: string, keyword: string) => {
    if (!text || !keyword) return {
      count: 0, density: 0, percentage: '0%', status: 'absent', color: 'text-red-600 dark:text-red-400'
    }

    const cleanText = text.toLowerCase()
    const cleanKeyword = keyword.toLowerCase()
    const words = cleanText.split(/\s+/).filter(word => word.length > 0)
    const totalWords = words.length

    if (totalWords === 0) return {
      count: 0, density: 0, percentage: '0%', status: 'absent', color: 'text-red-600 dark:text-red-400'
    }

    let count = 0
    const keywordWords = cleanKeyword.split(/\s+/)

    if (keywordWords.length === 1) {
      count = words.filter(word => word === cleanKeyword).length
    } else {
      const regex = new RegExp(cleanKeyword.replace(/\s+/g, '\\s+'), 'g')
      const matches = cleanText.match(regex)
      count = matches ? matches.length : 0
    }

    const density = (count / totalWords) * 100
    const percentage = density.toFixed(1) + '%'

    let status: 'optimal' | 'low' | 'high' | 'absent'
    let color: string

    if (count === 0) {
      status = 'absent'
      color = 'text-red-600 dark:text-red-400'
    } else if (density >= 0.5 && density <= 2.0) {
      status = 'optimal'
      color = 'text-green-600 dark:text-green-400'
    } else if (density < 0.5) {
      status = 'low'
      color = 'text-amber-600 dark:text-amber-400'
    } else {
      status = 'high'
      color = 'text-red-600 dark:text-red-400'
    }

    return { count, density, percentage, status, color }
  }

  // Función para optimizar título automáticamente (calibrado para 65 caracteres)
  const optimizeTitleForSEO = () => {
    // Buscar el título desde múltiples fuentes
    const sourceTitle = articleTitle ||
                       metadata.seoTitle ||
                       metadata.seoTitleOptimized ||
                       document?.title

    console.log('🔍 Fuentes de título disponibles:', {
      articleTitle,
      'metadata.seoTitle': metadata.seoTitle,
      'metadata.seoTitleOptimized': metadata.seoTitleOptimized,
      'document.title': document?.title,
      'sourceTitle seleccionado': sourceTitle
    })

    if (!sourceTitle) {
      console.log('❌ No hay ningún título disponible para optimizar')
      return
    }

    console.log('🔧 Optimizando título:', sourceTitle, 'Longitud:', sourceTitle.length)

    // Optimizar el título para SEO manteniendo palabras clave importantes
    let optimizedTitle = sourceTitle

    // Remover palabras menos importantes si es muy largo
    if (optimizedTitle.length > 65) {
      console.log('📏 Título muy largo, aplicando optimización...')

      // Palabras a reducir para acortar
      const wordsToShorten = [
        'de la', 'del', 'de los', 'de las',
        'para la', 'para el', 'para los', 'para las',
        'en la', 'en el', 'en los', 'en las',
        'sobre la', 'sobre el', 'sobre los', 'sobre las',
        'análisis', 'revisión', 'estudio', 'mediante', 'respecto'
      ]

      const beforeWordRemoval = optimizedTitle
      wordsToShorten.forEach(phrase => {
        const beforeReplace = optimizedTitle
        optimizedTitle = optimizedTitle.replace(new RegExp(phrase, 'gi'), '')
        if (beforeReplace !== optimizedTitle) {
          console.log('🗑️ Eliminada frase:', phrase, 'Nueva longitud:', optimizedTitle.length)
        }
      })

      // Limpiar espacios dobles
      optimizedTitle = optimizedTitle.replace(/\s+/g, ' ').trim()
      console.log('🧹 Después de limpiar palabras:', beforeWordRemoval.length, '→', optimizedTitle.length)

      // Si aún es muy largo, cortar en palabras completas cerca del límite de 65
      if (optimizedTitle.length > 65) {
        console.log('✂️ Cortando título, longitud actual:', optimizedTitle.length)
        const words = optimizedTitle.split(' ')
        let truncated = ''
        const originalLength = optimizedTitle.length

        for (const word of words) {
          const testLength = truncated ? (truncated + ' ' + word).length : word.length
          if (testLength <= 62) { // 62 para dejar espacio a "..."
            truncated += (truncated ? ' ' : '') + word
          } else {
            console.log('🛑 Palabra que no cabe:', word, 'Longitud actual:', testLength)
            break
          }
        }

        // Siempre agregar puntos suspensivos si se cortó el texto
        if (truncated.length < originalLength) {
          optimizedTitle = truncated + '...'
          console.log('✂️ Texto cortado y puntos agregados. Final:', optimizedTitle.length, 'caracteres')
        } else {
          optimizedTitle = truncated
          console.log('✅ No se necesitó cortar más')
        }
      }
    } else {
      console.log('✅ Título ya está dentro del límite de 65 caracteres')
      // Aún así, copiar el título al campo optimizado y seleccionarlo
    }

    console.log('✨ Título optimizado:', optimizedTitle, 'Nueva longitud:', optimizedTitle.length)

    // Actualizar múltiples campos en una sola operación
    setMetadata(prev => ({
      ...prev,
      seoTitleOptimized: optimizedTitle,
      selectedTitleType: 'seoTitleOptimized',
      finalTitle: optimizedTitle
    }))

    console.log('💾 Estado actualizado con título optimizado')
  }

  // Componente para el indicador circular de score SEO
  const SEOScoreIndicator = ({ score }: { score: number }) => {
    const radius = 35
    const circumference = 2 * Math.PI * radius
    const strokeDashoffset = circumference - (score / 100) * circumference

    const getScoreColor = (score: number) => {
      if (score >= 95) return 'text-blue-600 dark:text-blue-400'
      if (score >= 70) return 'text-green-600 dark:text-green-400'
      if (score >= 30) return 'text-amber-600 dark:text-amber-400'
      return 'text-red-600 dark:text-red-400'
    }

    const getStrokeColor = (score: number) => {
      if (score >= 95) return '#2563eb'  // Azul más intenso (Perfecto)
      if (score >= 70) return '#059669'  // Verde más intenso (Óptimo)
      if (score >= 30) return '#d97706'  // Ámbar más intenso (Regular)
      return '#dc2626'                   // Rojo más intenso (Malo)
    }

    const getBackgroundGradient = (score: number) => {
      if (score >= 95) return 'from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/30'
      if (score >= 70) return 'from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/30'
      if (score >= 30) return 'from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/30'
      return 'from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/30'
    }

    return (
      <div className={clsx('relative w-24 h-24 rounded-full bg-gradient-to-br', getBackgroundGradient(score), 'flex items-center justify-center shadow-lg')}>
        <svg className="w-20 h-20 transform -rotate-90">
          <circle
            cx="40"
            cy="40"
            r={radius}
            stroke="#e5e7eb"
            strokeWidth="6"
            fill="transparent"
            className="dark:stroke-gray-600"
          />
          <circle
            cx="40"
            cy="40"
            r={radius}
            stroke={getStrokeColor(score)}
            strokeWidth="6"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-700 ease-out drop-shadow-sm"
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={clsx('text-xl font-bold', getScoreColor(score))}>
            {score}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col space-y-6 animate-in fade-in duration-300">

      {/* Layout de 3 columnas con grupos funcionales */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6 xl:gap-8">
        {/* GRUPO 1: INFORMACIÓN BÁSICA */}
        <div className="space-y-6 animate-in slide-in-from-left duration-500">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Información Básica</h3>
            </div>

            {/* URL del Artículo */}
            <div className="space-y-4">

              {/* Sección */}
              <div>
                <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  <Hash className="w-4 h-4" />
                  <span>Sección</span>
                </label>
                <select
                  value={metadata.section}
                  onChange={(e) => updateField('section', e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#04315a] focus:border-[#04315a] bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                >
                  {LEGAL_SECTIONS.map((section) => (
                    <option key={section} value={section}>
                      {section}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tiempo de lectura */}
              <div>
                <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  <Clock className="w-4 h-4" />
                  <span>Tiempo de lectura: {metadata.readingTime} min</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={metadata.readingTime}
                  onChange={(e) => updateField('readingTime', parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #04315a 0%, #04315a ${((metadata.readingTime - 1) / 4) * 100}%, #e5e7eb ${((metadata.readingTime - 1) / 4) * 100}%, #e5e7eb 100%)`
                  }}
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span>1 min</span>
                  <span>3 min</span>
                  <span>5 min</span>
                </div>
              </div>

              {/* Títulos SEO */}
              <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                {/* Meta Title para Google */}
                <div>
                  <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Search className="w-4 h-4" />
                    <span>Meta Title (Google)</span>
                    <span className="text-xs px-2 py-1 rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300 font-mono">
                      &lt;title&gt;
                    </span>
                    <span className={clsx(
                      "text-xs px-2 py-1 rounded-full",
                      (() => {
                        const validation = getValidationColor(metadata.metaTitle?.length || 0, 65)
                        return `${validation.bgColor} ${validation.color}`
                      })()
                    )}>
                      {metadata.metaTitle?.length || 0}/65 | {getValidationColor(metadata.metaTitle?.length || 0, 65).status}
                    </span>
                  </label>
                  <div className="relative">
                    <textarea
                      value={metadata.metaTitle || ''}
                      onChange={(e) => {
                        const newValue = e.target.value
                        updateField('metaTitle', newValue)
                        e.target.style.height = 'auto'
                        e.target.style.height = e.target.scrollHeight + 'px'
                      }}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#04315a] focus:border-[#04315a] bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 resize-none overflow-hidden"
                      placeholder="Título corto para atraer clics en Google (65 caracteres máx)"
                      rows={2}
                      data-auto-resize
                      style={{ minHeight: 'auto', height: 'auto' }}
                      onInput={(e) => {
                        const target = e.target as HTMLTextAreaElement
                        target.style.height = 'auto'
                        target.style.height = target.scrollHeight + 'px'
                      }}
                    />
                  </div>
                  <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Aparece en pestañas del navegador y resultados de búsqueda de Google
                  </div>
                </div>

                {/* Título Real H1 */}
                <div>
                  <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <FileText className="w-4 h-4" />
                    <span>Título Real del Artículo</span>
                    <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 font-mono">
                      H1
                    </span>
                  </label>
                  <div className="relative">
                    <textarea
                      value={metadata.realTitle || ''}
                      onChange={(e) => {
                        const newValue = e.target.value
                        updateField('realTitle', newValue)
                        // Sincronizar con campo legacy
                        updateField('seoTitle', newValue)
                        e.target.style.height = 'auto'
                        e.target.style.height = e.target.scrollHeight + 'px'
                      }}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#04315a] focus:border-[#04315a] bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 resize-none overflow-hidden"
                      placeholder="Título descriptivo y completo que verán los lectores (sin límite de caracteres)"
                      rows={2}
                      data-auto-resize
                      style={{ minHeight: 'auto', height: 'auto' }}
                      onInput={(e) => {
                        const target = e.target as HTMLTextAreaElement
                        target.style.height = 'auto'
                        target.style.height = target.scrollHeight + 'px'
                      }}
                    />
                  </div>
                  <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Encabezado principal visible del artículo - puede ser descriptivo y completo
                  </div>
                </div>

                {/* Subtítulo Real H2 */}
                <div>
                  <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <FileText className="w-4 h-4" />
                    <span>Subtítulo del Artículo</span>
                    <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 font-mono">
                      H2
                    </span>
                  </label>
                  <div className="relative">
                    <textarea
                      value={metadata.realSubtitle || ''}
                      onChange={(e) => {
                        const newValue = e.target.value
                        updateField('realSubtitle', newValue)
                        // Sincronizar con campo legacy
                        updateField('seoSubtitle', newValue)
                        e.target.style.height = 'auto'
                        e.target.style.height = e.target.scrollHeight + 'px'
                      }}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#04315a] focus:border-[#04315a] bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 resize-none overflow-hidden"
                      placeholder="Subtítulo que complementa y expande el H1 (sin límite de caracteres)"
                      rows={2}
                      data-auto-resize
                      style={{ minHeight: 'auto', height: 'auto' }}
                      onInput={(e) => {
                        const target = e.target as HTMLTextAreaElement
                        target.style.height = 'auto'
                        target.style.height = target.scrollHeight + 'px'
                      }}
                    />
                  </div>
                  <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Subtítulo visible que aporta contexto adicional e implicaciones
                  </div>
                </div>


                {/* URL del Artículo */}
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    <Link className="w-4 h-4" />
                    <span>URL del Artículo</span>
                  </label>
                  <div className="space-y-2">
                    <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                      linea-judicial.com
                    </div>
                    <input
                      type="text"
                      value={metadata.slug || generateArticleUrl(articleTitle, metadata.section)}
                      onChange={(e) => updateField('slug', e.target.value)}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#04315a] focus:border-[#04315a] text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-mono"
                      placeholder="/seccion/titulo-del-articulo"
                    />
                    <div className="mt-2">
                      <button
                        onClick={() => {
                          // TODO: Implementar optimización automática de URL
                          console.log('🔗 Optimizando URL automáticamente...', {
                            currentSlug: metadata.slug,
                            articleTitle: articleTitle,
                            section: metadata.section
                          })
                        }}
                        className="inline-flex items-center space-x-2 px-3 py-1 text-xs bg-[#04315a] text-[#3ff3f2] rounded-md hover:bg-[#062847] transition-colors"
                      >
                        <Wand2 className="w-3 h-3" />
                        <span>Ajustar URL</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Meta Descripción de Imagen */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  <ImageIcon className="w-4 h-4" />
                  <span>Meta Descripción de Imagen</span>
                  {imageMetaDescription && (
                    <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                      IA
                    </span>
                  )}
                  <span className={clsx(
                    "text-xs px-2 py-1 rounded-full",
                    (() => {
                      const validation = getValidationColor(metadata.imageDescription?.length || 0, 125)
                      return `${validation.bgColor} ${validation.color}`
                    })()
                  )}>
                    {metadata.imageDescription?.length || 0}/125 | {getValidationColor(metadata.imageDescription?.length || 0, 125).status}
                  </span>
                </label>
                <textarea
                  value={metadata.imageDescription || ''}
                  onChange={(e) => {
                    const newValue = e.target.value
                    updateField('imageDescription', newValue)
                    // Auto-ajustar altura
                    setTimeout(() => {
                      e.target.style.height = 'auto'
                      e.target.style.height = e.target.scrollHeight + 'px'
                    }, 0)
                  }}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#04315a] focus:border-[#04315a] bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 resize-none overflow-hidden"
                  placeholder="Descripción SEO para la imagen generada (125 caracteres máx)"
                  rows={2}
                  data-auto-resize
                  style={{ minHeight: '60px' }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement
                    target.style.height = 'auto'
                    target.style.height = target.scrollHeight + 'px'
                  }}
                />
                <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {imageMetaDescription ?
                    'Metadescripción generada automáticamente con IA para la imagen seleccionada. Puedes editarla.' :
                    'Descripción SEO que se utilizará al guardar imágenes generadas en la biblioteca'
                  }
                </div>
              </div>

              {/* Etiquetas personalizadas */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  <Tags className="w-4 h-4" />
                  <span>Etiquetas Personalizadas</span>
                </label>
                <div className="space-y-3">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addCustomTag(newTag)}
                      className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#04315a] focus:border-[#04315a] text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      placeholder="Nueva etiqueta"
                    />
                    <button
                      onClick={() => addCustomTag(newTag)}
                      className="px-3 py-2 bg-gray-600 dark:bg-gray-500 text-white rounded-lg hover:bg-gray-700 dark:hover:bg-gray-400 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {metadata.customTags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {metadata.customTags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center space-x-1 px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full text-sm"
                        >
                          <span>{tag}</span>
                          <button
                            onClick={() => removeCustomTag(tag)}
                            className="hover:text-gray-900 dark:hover:text-gray-100"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* GRUPO 2: GENERACIÓN AUTOMÁTICA CON IA */}
        <div className="space-y-6 animate-in slide-in-from-bottom duration-500 delay-150">

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="space-y-6">
              {/* Botón principal de IA - Estilo prototipo */}
              <div className="space-y-3">
                <button
                  onClick={generateMetadata}
                  disabled={isGeneratingMeta || !articleContent}
                  className={clsx(
                    'w-full py-4 px-6 rounded-lg font-semibold text-lg transition-all duration-200',
                    isGeneratingMeta
                      ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                      : !articleContent
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-[#04315a] to-[#3ff3f2] text-white hover:from-[#3ff3f2] hover:to-[#04315a] transform hover:-translate-y-0.5 shadow-lg hover:shadow-xl'
                  )}
                >
                  <div className="flex items-center justify-center space-x-3">
                    {isGeneratingMeta ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600"></div>
                        <span>Produciendo con IA...</span>
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-5 h-5" />
                        <span>Producir</span>
                      </>
                    )}
                  </div>
                </button>

                {/* Mensaje de éxito */}
                {metadataGenerationSuccess && (
                  <div className="flex items-center justify-center space-x-2 text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-3 rounded-lg animate-in fade-in duration-300">
                    <CheckCircle className="w-4 h-4" />
                    <span>¡Metadata SEO generada exitosamente con IA!</span>
                  </div>
                )}

                {/* Mensaje informativo si no hay contenido */}
                {!articleContent && (
                  <div className="flex items-center justify-center space-x-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-2 rounded-lg">
                    <Info className="w-3 h-3" />
                    <span>Genera primero el artículo para usar IA</span>
                  </div>
                )}

                {/* Descripción de la funcionalidad */}
                <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  <p>Genera automáticamente:</p>
                  <p>• Metadescripción optimizada (≤160 chars)</p>
                  <p>• Keyword principal y palabras clave</p>
                  <p>• Descripción Schema.org (≤200 chars)</p>
                </div>
              </div>

              {/* Meta Description */}
              <div>
                <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  <AlignLeft className="w-4 h-4" />
                  <span>Meta Description</span>
                  <span className={clsx(
                    "text-xs px-2 py-1 rounded-full",
                    (() => {
                      const validation = getValidationColor(metadata.description?.length || 0, 160)
                      return `${validation.bgColor} ${validation.color}`
                    })()
                  )}>
                    {metadata.description?.length || 0}/160 | {getValidationColor(metadata.description?.length || 0, 160).status}
                  </span>
                </label>
                <textarea
                  value={metadata.description}
                  onChange={(e) => {
                    updateField('description', e.target.value)
                    e.target.style.height = 'auto'
                    e.target.style.height = e.target.scrollHeight + 'px'
                  }}
                  className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#04315a] focus:border-[#04315a] bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 resize-none overflow-hidden"
                  placeholder="Descripción que aparecerá en Google (120-160 chars)"
                  rows={3}
                  data-auto-resize
                  style={{ minHeight: 'auto', height: 'auto' }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement
                    target.style.height = 'auto'
                    target.style.height = target.scrollHeight + 'px'
                  }}
                />
                {!seoValidation.description.isValid && (
                  <div className="mt-2 space-y-1">
                    {seoValidation.description.issues.map((issue, i) => (
                      <div key={i} className="flex items-center space-x-2 text-xs text-yellow-600 dark:text-yellow-400">
                        <AlertCircle className="w-3 h-3" />
                        <span>{issue}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Vista previa real de Google Search */}
              <div>
                <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  <Search className="w-4 h-4" />
                  <span>Vista Previa en Google</span>
                </label>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 font-['arial',sans-serif]">
                  <div className="space-y-1">
                    {/* Título clickeable de Google */}
                    <div className="text-[#1a0dab] dark:text-[#8ab4f8] text-xl leading-6 cursor-pointer hover:underline font-normal">
                      {(metadata.selectedTitleType === 'seoTitleOptimized' ? metadata.seoTitleOptimized : metadata.seoTitle) || articleTitle}
                    </div>

                    {/* URL verde de Google */}
                    <div className="text-[#006621] dark:text-[#99c794] text-sm">
                      <div className="flex items-center space-x-1">
                        <span>https://linea-judicial.com</span>
                        <span>›</span>
                        <span>{metadata.section.toLowerCase().replace(/\s+/g, '-')}</span>
                        <span>›</span>
                        <span className="truncate max-w-[200px]">
                          {metadata.slug ? metadata.slug.split('/').pop() : generateSlug(articleTitle).substring(0, 30)}
                        </span>
                      </div>
                    </div>

                    {/* Fecha de publicación */}
                    <div className="text-[#70757a] dark:text-gray-400 text-sm">
                      {new Date().toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </div>

                    {/* Meta description */}
                    <div className="text-[#4d5156] dark:text-gray-300 text-sm leading-5 mt-1">
                      {metadata.description || `Análisis jurídico sobre ${articleTitle}. Revisamos las implicaciones legales y precedentes de esta decisión judicial en el área de ${metadata.section.toLowerCase()}.`}
                    </div>

                    {/* Enlaces adicionales simulados (sitelinks) */}
                    <div className="mt-3 space-y-1">
                      <div className="text-xs text-[#70757a] dark:text-gray-400">
                        Enlaces del sitio
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="text-[#1a0dab] dark:text-[#8ab4f8] hover:underline cursor-pointer truncate">
                          Jurisprudencia {metadata.section}
                        </div>
                        <div className="text-[#1a0dab] dark:text-[#8ab4f8] hover:underline cursor-pointer truncate">
                          Análisis Recientes
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Palabras clave principales */}
              <div>
                <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  <Target className="w-4 h-4" />
                  <span>Palabras Clave</span>
                  <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                    {metadata.keywords.length} keywords
                  </span>
                </label>

                <div className="space-y-3">
                  {/* Keyword principal */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                      Keyword Principal
                    </label>
                    <input
                      type="text"
                      value={metadata.keywords[0] || ''}
                      onChange={(e) => {
                        const newKeywords = [...metadata.keywords]
                        if (e.target.value) {
                          newKeywords[0] = e.target.value.toLowerCase()
                        } else {
                          newKeywords.shift()
                        }
                        updateField('keywords', newKeywords)
                      }}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#04315a] focus:border-[#04315a] text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      placeholder="e.g. tutela derechos fundamentales"
                    />
                    <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Palabra clave principal para posicionamiento
                    </div>
                  </div>

                  {/* Agregar keywords */}
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newKeyword}
                      onChange={(e) => setNewKeyword(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addKeyword(newKeyword)}
                      className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#04315a] focus:border-[#04315a] text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      placeholder="Agregar palabra clave"
                    />
                    <button
                      onClick={() => addKeyword(newKeyword)}
                      className="px-3 py-2 bg-[#04315a] text-[#3ff3f2] rounded-lg hover:bg-[#062847] transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Lista de keywords actuales */}
                  {metadata.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {metadata.keywords.map((keyword, index) => (
                        <span
                          key={keyword}
                          className={clsx(
                            "inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm",
                            index === 0
                              ? "bg-[#04315a] text-[#3ff3f2] ring-2 ring-[#04315a] ring-opacity-20"
                              : "bg-[#3ff3f2] bg-opacity-20 text-[#04315a] dark:bg-[#04315a] dark:text-[#3ff3f2]"
                          )}
                        >
                          {index === 0 && <Target className="w-3 h-3" />}
                          <span>{keyword}</span>
                          <button
                            onClick={() => removeKeyword(keyword)}
                            className="hover:bg-white hover:bg-opacity-20 rounded-full p-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Keywords sugeridas */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                      Sugerencias
                    </label>
                    <div className="flex flex-wrap gap-1">
                      {SUGGESTED_KEYWORDS
                        .filter(keyword => !metadata.keywords.includes(keyword))
                        .slice(0, 8)
                        .map((keyword) => (
                          <button
                            key={keyword}
                            onClick={() => addKeyword(keyword)}
                            className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                          >
                            + {keyword}
                          </button>
                        ))
                      }
                    </div>
                  </div>
                </div>
              </div>

              {/* Schema.org Description */}
              <div>
                <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  <FileText className="w-4 h-4" />
                  <span>Descripción Schema.org</span>
                  <div className="relative group">
                    <Info className="w-4 h-4 text-gray-400 hover:text-blue-500 cursor-help transition-colors" />
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-50">
                      <div className="bg-gray-900 text-white text-xs rounded-lg p-3 shadow-lg max-w-xs">
                        <div className="font-semibold mb-1">¿Qué es Schema.org?</div>
                        <div>Es un lenguaje de marcado estructurado que ayuda a Google y otros motores a entender mejor tu contenido para mostrar rich snippets (fragmentos enriquecidos) en los resultados de búsqueda.</div>
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                      </div>
                    </div>
                  </div>
                  <span className={clsx(
                    "text-xs px-2 py-1 rounded-full",
                    (() => {
                      const validation = validateSchemaDescription(metadata.schemaDescription || '')
                      return `${validation.validation.bgColor} ${validation.validation.color}`
                    })()
                  )}>
                    {metadata.schemaDescription?.length || 0}/200 | {validateSchemaDescription(metadata.schemaDescription || '').validation.status}
                  </span>
                </label>
                <textarea
                  value={metadata.schemaDescription || ''}
                  onChange={(e) => {
                    updateField('schemaDescription', e.target.value)
                    e.target.style.height = 'auto'
                    e.target.style.height = e.target.scrollHeight + 'px'
                  }}
                  className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#04315a] focus:border-[#04315a] bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 resize-none overflow-hidden"
                  placeholder="Descripción optimizada para rich snippets de Google (200 chars)"
                  rows={3}
                  data-auto-resize
                  style={{ minHeight: 'auto', height: 'auto' }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement
                    target.style.height = 'auto'
                    target.style.height = target.scrollHeight + 'px'
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* GRUPO 3: DIAGNÓSTICO SEO */}
        <div className="space-y-6 animate-in slide-in-from-right duration-500 delay-300">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Diagnóstico SEO</h3>
            </div>

            <div className="space-y-6">
              {/* Score SEO General con indicador circular */}
              <div className="text-center">
                <div className="mb-4">
                  <SEOScoreIndicator score={seoScore.score} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Score SEO: {seoScore.score}/100
                  </h4>
                  <p className={clsx(
                    "text-sm font-medium",
                    seoScore.score >= 95 ? "text-blue-600 dark:text-blue-400" :
                    seoScore.score >= 70 ? "text-green-600 dark:text-green-400" :
                    seoScore.score >= 30 ? "text-amber-600 dark:text-amber-400" :
                    "text-red-600 dark:text-red-400"
                  )}>
                    {seoScore.score >= 95 ? "Perfecto" :
                     seoScore.score >= 70 ? "Excelente" :
                     seoScore.score >= 30 ? "Regular" : "Necesita mejoras"}
                  </p>
                </div>
              </div>

              {/* Desglose detallado del score */}
              <div>
                <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Desglose del Score</h5>
                <div className="space-y-3">
                  {seoScore.details.map((detail, index) => {
                    const percentage = (detail.points / detail.maxPoints) * 100
                    return (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-gray-700 dark:text-gray-300">{detail.category}</span>
                          <span className={clsx(
                            "font-semibold",
                            (() => {
                              // Colores específicos para Keywords basados en puntuación real
                              if (detail.category === 'Keywords') {
                                if (detail.points >= 18) return "text-green-600 dark:text-green-400"  // 18-20 puntos
                                if (detail.points >= 12) return "text-amber-600 dark:text-amber-400"  // 12-17 puntos
                                return "text-red-600 dark:text-red-400"  // 0-11 puntos
                              }
                              // Colores generales para otras categorías
                              if (percentage >= 80) return "text-green-600 dark:text-green-400"
                              if (percentage >= 60) return "text-amber-600 dark:text-amber-400"
                              return "text-red-600 dark:text-red-400"
                            })()
                          )}>
                            {detail.points}/{detail.maxPoints}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className={clsx(
                              "h-2 rounded-full transition-all duration-500",
                              (() => {
                                // Colores específicos para Keywords basados en puntuación real
                                if (detail.category === 'Keywords') {
                                  if (detail.points >= 18) return "bg-green-500"  // 18-20 puntos = verde
                                  if (detail.points >= 12) return "bg-amber-500"  // 12-17 puntos = ámbar
                                  return "bg-red-500"  // 0-11 puntos = rojo
                                }
                                // Colores para otras categorías basados en validation status
                                if (detail.validation?.status === 'Perfecto') return "bg-blue-500"
                                if (detail.validation?.status === 'Óptimo') return "bg-green-500"
                                if (detail.validation?.status === 'Regular' || detail.validation?.status === 'Algo largo') return "bg-amber-500"
                                return "bg-red-500"
                              })()
                            )}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        {detail.issues.length > 0 && (
                          <div className="space-y-1">
                            {detail.issues.map((issue, i) => (
                              <div key={i} className="flex items-start space-x-2 text-xs text-gray-600 dark:text-gray-400">
                                <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0 text-amber-500" />
                                <span>{issue}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>


              {/* Análisis Semántico SEO */}
              {metadata.keywords[0] && (
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                    <Brain className="w-4 h-4 mr-2" />
                    Análisis Semántico SEO
                  </h5>

                  <div className="text-center py-6">
                    <div className="mb-4">
                      <div className="w-16 h-16 mx-auto bg-[#04315a] bg-opacity-10 rounded-full flex items-center justify-center">
                        <Brain className="w-8 h-8 text-[#04315a]" />
                      </div>
                    </div>
                    <div className="space-y-2 mb-6">
                      <h6 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        Diagnóstico Inteligente de Keywords
                      </h6>
                      <p className="text-xs text-gray-600 dark:text-gray-400 max-w-xs mx-auto">
                        Análisis completo de densidad, variaciones semánticas y cobertura LSI usando IA
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        // TODO: Implementar llamada a IA para análisis semántico
                        console.log('🧠 Iniciando diagnóstico semántico con IA...', {
                          primaryKeyword: metadata.keywords[0],
                          content: {
                            seoTitle: metadata.seoTitle,
                            seoTitleOptimized: metadata.seoTitleOptimized,
                            description: metadata.description,
                            imageAlt: metadata.imageAlt,
                            schemaDescription: metadata.schemaDescription
                          }
                        })
                      }}
                      className="inline-flex items-center space-x-2 px-4 py-2 bg-[#04315a] text-[#3ff3f2] rounded-lg hover:bg-[#062847] transition-colors font-medium text-sm"
                    >
                      <Wand2 className="w-4 h-4" />
                      <span>Diagnosticar</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Problemas detectados y sugerencias */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                  <Info className="w-4 h-4 mr-2" />
                  Sugerencias de Mejora
                </h5>
                <div className="space-y-2">
                  {seoScore.score < 100 && (
                    <>
                      {!metadata.seoTitle && (
                        <div className="flex items-start space-x-2 text-xs text-amber-600 dark:text-amber-400">
                          <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          <span>Añade un título SEO optimizado</span>
                        </div>
                      )}
                      {!metadata.description && (
                        <div className="flex items-start space-x-2 text-xs text-amber-600 dark:text-amber-400">
                          <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          <span>Añade una meta descripción de 120-160 caracteres</span>
                        </div>
                      )}
                      {metadata.keywords.length < 3 && (
                        <div className="flex items-start space-x-2 text-xs text-amber-600 dark:text-amber-400">
                          <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          <span>Agrega al menos 3 palabras clave relevantes</span>
                        </div>
                      )}
                      {!metadata.imageAlt && (
                        <div className="flex items-start space-x-2 text-xs text-amber-600 dark:text-amber-400">
                          <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          <span>Añade Alt Text para la imagen del artículo</span>
                        </div>
                      )}
                      {seoScore.score >= 80 && (
                        <div className="flex items-start space-x-2 text-xs text-green-600 dark:text-green-400">
                          <CheckCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          <span>¡Excelente! Tu artículo está bien optimizado para SEO</span>
                        </div>
                      )}
                    </>
                  )}

                  {seoScore.score === 100 && (
                    <div className="flex items-start space-x-2 text-xs text-green-600 dark:text-green-400">
                      <CheckCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      <span>¡Perfecto! Tu artículo tiene una optimización SEO excelente</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}