/**
 * Utilidades SEO para generar URLs, slugs y optimizaciones
 * Incluye cálculo de Score SEO, densidad de keywords y Schema.org
 */

// Función para generar slugs SEO-friendly
export const generateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .normalize('NFD') // Descomponer caracteres acentuados
    .replace(/[\u0300-\u036f]/g, '') // Remover diacríticos
    .replace(/[^\w\s-]/g, '') // Remover caracteres especiales excepto espacios y guiones
    .trim()
    .replace(/\s+/g, '-') // Reemplazar espacios con guiones
    .replace(/-+/g, '-') // Remover guiones múltiples
    .replace(/^-|-$/g, '') // Remover guiones al inicio y final
}

// Función para generar URL de artículo SEO-friendly
export const generateArticleUrl = (title: string, section: string, id?: string): string => {
  const titleSlug = generateSlug(title)
  const sectionSlug = generateSlug(section)

  // Limitar el slug del título a 60 caracteres para URLs más limpias
  const shortTitleSlug = titleSlug.length > 60
    ? titleSlug.substring(0, 60).replace(/-[^-]*$/, '')
    : titleSlug

  // Estructura: /seccion/titulo-del-articulo
  return `/${sectionSlug}/${shortTitleSlug}${id ? `-${id}` : ''}`
}

// Función avanzada para optimizar URLs automáticamente
export const optimizeArticleUrl = (
  title: string,
  section: string,
  currentUrl?: string
): { url: string; optimizations: string[] } => {
  const optimizations: string[] = []

  // 1. Generar slug base optimizado
  let titleSlug = generateSlug(title)
  const sectionSlug = generateSlug(section)

  // 2. Remover palabras irrelevantes para SEO (stop words jurídicas)
  const stopWords = [
    'analisis', 'revision', 'estudio', 'comentario', 'sobre', 'acerca',
    'mediante', 'respecto', 'referente', 'relativo', 'por', 'para',
    'con', 'sin', 'desde', 'hasta', 'entre', 'ante', 'bajo', 'tras'
  ]

  const originalSlug = titleSlug
  stopWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi')
    if (regex.test(titleSlug)) {
      titleSlug = titleSlug.replace(regex, '').replace(/-+/g, '-').replace(/^-|-$/g, '')
      optimizations.push(`Removida palabra irrelevante: "${word}"`)
    }
  })

  // 3. Optimizar para keywords jurídicas importantes
  const legalKeywords = [
    'sentencia', 'tutela', 'constitucional', 'corte', 'derecho',
    'precedente', 'jurisprudencia', 'fallo', 'decision'
  ]

  const hasLegalKeyword = legalKeywords.some(keyword =>
    titleSlug.includes(keyword.toLowerCase())
  )

  if (!hasLegalKeyword && title.toLowerCase().includes('sentencia')) {
    optimizations.push('Mantenida palabra clave jurídica: "sentencia"')
  }

  // 4. Acortar si es muy largo (máximo 50 caracteres para el slug del título)
  const maxTitleLength = 50
  if (titleSlug.length > maxTitleLength) {
    const originalLength = titleSlug.length
    // Cortar en la última palabra completa antes del límite
    titleSlug = titleSlug.substring(0, maxTitleLength).replace(/-[^-]*$/, '')
    optimizations.push(`Acortada URL de ${originalLength} a ${titleSlug.length} caracteres`)
  }

  // 5. Optimizar estructura jerárquica
  const optimizedUrl = `/${sectionSlug}/${titleSlug}`

  // 6. Validar que no haya caracteres problemáticos
  if (optimizedUrl.includes('--')) {
    optimizations.push('Corregidos guiones dobles')
  }

  // 7. Verificar si hay mejoras vs URL actual
  if (currentUrl && currentUrl !== optimizedUrl) {
    optimizations.push('URL mejorada para mejor SEO')
  } else if (currentUrl === optimizedUrl) {
    optimizations.push('URL ya está optimizada')
  }

  return {
    url: optimizedUrl,
    optimizations
  }
}

// Función para generar meta description optimizada
export const generateMetaDescription = (content: string, maxLength = 160): string => {
  // Remover HTML tags si los hay
  const cleanContent = content.replace(/<[^>]*>/g, '')

  if (cleanContent.length <= maxLength) {
    return cleanContent
  }

  // Cortar en la palabra más cercana al límite
  const truncated = cleanContent.substring(0, maxLength)
  const lastSpace = truncated.lastIndexOf(' ')

  return lastSpace > 0
    ? truncated.substring(0, lastSpace) + '...'
    : truncated + '...'
}

// Función para extraer palabras clave del contenido
export const extractKeywords = (title: string, content: string, section: string): string[] => {
  const sectionKeywords: Record<string, string[]> = {
    'constitucional': ['tutela', 'derechos fundamentales', 'constitución', 'precedente constitucional'],
    'administrativo': ['contencioso administrativo', 'acto administrativo', 'procedimiento gubernamental'],
    'fiscal/aduanero': ['régimen fiscal', 'procedimiento tributario', 'derecho aduanero', 'impuestos'],
    'societario': ['derecho empresarial', 'sociedades', 'mercado de valores', 'M&A'],
    'penal': ['sistema acusatorio', 'procedimiento penal', 'política criminal', 'código penal'],
    'civil/familia': ['obligaciones', 'contratos', 'responsabilidad civil', 'régimen familiar'],
    'digital': ['protección datos', 'ciberderecho', 'comercio electrónico', 'propiedad intelectual'],
    'laboral': ['derecho laboral', 'seguridad social', 'pensiones', 'contrato trabajo'],
    'regulatorio': ['compliance', 'sectores regulados', 'derecho financiero', 'telecomunicaciones'],
    'opinión': ['análisis jurídico', 'opinión legal', 'comentario jurídico', 'editorial']
  }

  const baseKeywords = ['jurisprudencia', 'derecho', 'colombia', 'análisis legal']
  const sectionSpecific = sectionKeywords[section.toLowerCase()] || []

  // Extraer palabras importantes del título
  const titleWords = title.toLowerCase()
    .split(' ')
    .filter(word => word.length > 3)
    .filter(word => !['para', 'desde', 'hasta', 'entre', 'sobre', 'ante'].includes(word))

  return [...baseKeywords, ...sectionSpecific, ...titleWords.slice(0, 3)]
}

// Función para generar nombre de archivo de imagen SEO
export const generateImageFilename = (title: string, type: 'article' | 'thumbnail' = 'article'): string => {
  const slug = generateSlug(title)
  const shortSlug = slug.length > 40 ? slug.substring(0, 40) : slug
  return `${shortSlug}-${type}`
}

// Función para generar alt text para imágenes
export const generateImageAltText = (title: string, section: string, imageType?: string): string => {
  const sectionNames: Record<string, string> = {
    'constitucional': 'constitucional',
    'administrativo': 'administrativo',
    'fiscal/aduanero': 'fiscal y aduanero',
    'societario': 'societario',
    'penal': 'penal',
    'civil/familia': 'civil y familia',
    'digital': 'derecho digital',
    'laboral': 'laboral',
    'regulatorio': 'regulatorio',
    'opinión': 'opinión jurídica'
  }

  const sectionName = sectionNames[section.toLowerCase()] || section
  const imageContext = imageType ? ` ${imageType}` : ''

  return `Imagen relacionada con ${title} - Análisis de derecho ${sectionName}${imageContext}`
}

// Función para generar breadcrumbs SEO
export const generateBreadcrumbs = (section: string, articleTitle?: string) => {
  const breadcrumbs = [
    { name: 'Inicio', url: '/portal' },
    { name: section, url: `/${generateSlug(section)}` }
  ]

  if (articleTitle) {
    breadcrumbs.push({
      name: articleTitle,
      url: generateArticleUrl(articleTitle, section)
    })
  }

  return breadcrumbs
}

// Función para calcular tiempo de lectura
export const calculateReadingTime = (content: string): number => {
  const wordsPerMinute = 200 // Promedio en español
  const words = content.trim().split(/\s+/).length
  const minutes = Math.ceil(words / wordsPerMinute)
  return Math.max(1, minutes) // Mínimo 1 minuto
}

// Función para obtener color de validación basado en rangos optimizados
export const getValidationColor = (length: number, optimal: number): { color: string; bgColor: string; status: string } => {
  const percentage = (length / optimal) * 100

  if (length === 0) {
    return {
      color: 'text-gray-500 dark:text-gray-400',
      bgColor: 'bg-gray-100 dark:bg-gray-800',
      status: 'Vacío'
    }
  }

  // 🔵 Azul (Perfecto): 95-100% del óptimo
  if (percentage >= 95 && percentage <= 100) {
    return {
      color: 'text-blue-700 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900',
      status: 'Perfecto'
    }
  }

  // 🟢 Verde (Óptimo): 70-95% del óptimo
  if (percentage >= 70 && percentage < 95) {
    return {
      color: 'text-green-700 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900',
      status: 'Óptimo'
    }
  }

  // 🟡 Amarillo (Regular): 30-70% del óptimo o 85-100% del límite
  if ((percentage >= 30 && percentage < 70) || (percentage > 100 && percentage <= 115)) {
    return {
      color: 'text-yellow-700 dark:text-yellow-400',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900',
      status: percentage > 100 ? 'Algo largo' : 'Regular'
    }
  }

  // 🔴 Rojo (Malo): 0-30% del óptimo o >115% del límite
  return {
    color: 'text-red-700 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900',
    status: percentage > 115 ? 'Muy largo' : 'Muy corto'
  }
}

// Función para validar título SEO con nuevos rangos
export const validateSEOTitle = (title: string): { isValid: boolean; issues: string[]; validation: any } => {
  const issues: string[] = []
  const optimal = 65
  const validation = getValidationColor(title.length, optimal)

  if (title.length < 20) {
    issues.push('El título es muy corto (mínimo 20 caracteres)')
  }

  if (title.length > 75) {
    issues.push('El título es muy largo (máximo 75 caracteres)')
  }

  if (!title.includes('|') && !title.includes('-') && title.length > 0) {
    issues.push('Considera agregar separador para incluir marca (| o -)')
  }

  return {
    isValid: issues.length === 0 && validation.status !== 'Muy corto' && validation.status !== 'Muy largo',
    issues,
    validation
  }
}

// Función para validar meta description con nuevos rangos
export const validateMetaDescription = (description: string): { isValid: boolean; issues: string[]; validation: any } => {
  const issues: string[] = []
  const optimal = 160
  const validation = getValidationColor(description.length, optimal)

  if (description.length < 100) {
    issues.push('La descripción es muy corta (mínimo 100 caracteres)')
  }

  if (description.length > 180) {
    issues.push('La descripción es muy larga (máximo 180 caracteres)')
  }

  if (!description.includes('.') && description.length > 0) {
    issues.push('La descripción debería ser una oración completa')
  }

  return {
    isValid: issues.length === 0 && validation.status !== 'Muy corto' && validation.status !== 'Muy largo',
    issues,
    validation
  }
}

// Función para validar Alt Text con nuevos rangos
export const validateAltText = (altText: string): { validation: any } => {
  const optimal = 125
  const validation = getValidationColor(altText.length, optimal)

  return { validation }
}

// Función para validar Meta Descripción de Imagen SEO (campo único)
export const validateImageSEO = (imageDescription?: string): {
  validation: any;
  issues: string[];
  points: number;
} => {
  const issues: string[] = []
  let points = 0
  const maxPoints = 15

  // Validar Meta Description de Imagen (100% del score - 15 puntos máximo)
  const imageDescValidation = imageDescription ? getValidationColor(imageDescription.length, 125) : getValidationColor(0, 125)

  if (imageDescription) {
    if (imageDescValidation.status === 'Perfecto') {
      points = 15
    } else if (imageDescValidation.status === 'Óptimo') {
      points = 12
    } else if (imageDescValidation.status === 'Regular' || imageDescValidation.status === 'Algo largo') {
      points = 8
    } else {
      points = 3
      issues.push('Meta descripción de imagen requiere optimización de longitud')
    }
  } else {
    issues.push('Meta descripción de imagen requerida para SEO de imagen')
  }

  return {
    validation: imageDescValidation,
    issues,
    points
  }
}

// Función para validar Schema.org Description con nuevos rangos
export const validateSchemaDescription = (description: string): { validation: any } => {
  const optimal = 200
  const validation = getValidationColor(description.length, optimal)

  return { validation }
}

// Función para calcular Score SEO general con nuevos rangos
export const calculateSEOScore = (metadata: {
  seoTitle?: string
  description?: string
  keywords: string[]
  slug?: string
  imageDescription?: string
  section: string
}): { score: number; details: { category: string; points: number; maxPoints: number; issues: string[]; validation?: any }[] } => {
  const details = [
    {
      category: 'Título SEO',
      points: 0,
      maxPoints: 25,
      issues: [] as string[],
      validation: undefined as any
    },
    {
      category: 'Meta Description',
      points: 0,
      maxPoints: 25,
      issues: [] as string[],
      validation: undefined as any
    },
    {
      category: 'Keywords',
      points: 0,
      maxPoints: 20,
      issues: [] as string[]
    },
    {
      category: 'Meta Descripción Imagen',
      points: 0,
      maxPoints: 15,
      issues: [] as string[],
      validation: undefined as any
    }
  ]

  // Evaluar título SEO con nuevos rangos
  if (metadata.seoTitle) {
    const titleValidation = validateSEOTitle(metadata.seoTitle)
    details[0].validation = titleValidation.validation

    if (titleValidation.validation.status === 'Perfecto') {
      details[0].points = 25
    } else if (titleValidation.validation.status === 'Óptimo') {
      details[0].points = 22
    } else if (titleValidation.validation.status === 'Regular' || titleValidation.validation.status === 'Algo largo') {
      details[0].points = 15
    } else {
      details[0].points = 5
    }
    details[0].issues = titleValidation.issues
  } else {
    details[0].issues.push('Título SEO requerido')
    details[0].validation = getValidationColor(0, 65)
  }

  // Evaluar meta description con nuevos rangos
  if (metadata.description) {
    const descValidation = validateMetaDescription(metadata.description)
    details[1].validation = descValidation.validation

    if (descValidation.validation.status === 'Perfecto') {
      details[1].points = 25
    } else if (descValidation.validation.status === 'Óptimo') {
      details[1].points = 22
    } else if (descValidation.validation.status === 'Regular' || descValidation.validation.status === 'Algo largo') {
      details[1].points = 15
    } else {
      details[1].points = 5
    }
    details[1].issues = descValidation.issues
  } else {
    details[1].issues.push('Meta description requerida')
    details[1].validation = getValidationColor(0, 160)
  }

  // Evaluar keywords (sin cambios)
  if (metadata.keywords.length >= 3) {
    details[2].points = 20
  } else if (metadata.keywords.length >= 1) {
    details[2].points = 12
    details[2].issues.push('Se recomiendan al menos 3 keywords')
  } else {
    details[2].issues.push('Keywords requeridas')
  }

  // Evaluar Meta Descripción de Imagen SEO (campo único)
  const imageSEOValidation = validateImageSEO(metadata.imageDescription)
  details[3].validation = imageSEOValidation.validation
  details[3].points = imageSEOValidation.points
  details[3].issues = imageSEOValidation.issues

  const totalPoints = details.reduce((sum, detail) => sum + detail.points, 0)
  const maxPoints = details.reduce((sum, detail) => sum + detail.maxPoints, 0)
  const score = Math.round((totalPoints / maxPoints) * 100)

  return { score, details }
}

// Función para calcular densidad de keyword principal
export const calculateKeywordDensity = (content: string, keyword: string): number => {
  if (!keyword || !content) return 0

  const words = content.toLowerCase().split(/\s+/)
  const keywordWords = keyword.toLowerCase().split(/\s+/)
  const keywordPhrase = keywordWords.join(' ')

  let matches = 0
  for (let i = 0; i <= words.length - keywordWords.length; i++) {
    const phrase = words.slice(i, i + keywordWords.length).join(' ')
    if (phrase === keywordPhrase) {
      matches++
    }
  }

  const density = (matches / words.length) * 100
  return Math.round(density * 100) / 100
}

// Función para generar Schema.org JSON-LD optimizado para rich snippets
export const generateSchemaOrg = (metadata: {
  seoTitle?: string
  description?: string
  keywords: string[]
  section: string
  readingTime: number
  slug?: string
  imageAlt?: string
  articleTitle: string
  schemaDescription?: string
}) => {
  const canonicalUrl = `https://linea-judicial.com${metadata.slug || ''}`
  const title = metadata.seoTitle || metadata.articleTitle

  // Descripción optimizada para Schema.org (máximo 200 caracteres)
  const schemaDesc = metadata.schemaDescription ||
    (metadata.description && metadata.description.length <= 200
      ? metadata.description
      : `Análisis jurídico especializado sobre ${metadata.articleTitle}. Contenido profesional en ${metadata.section.toLowerCase()}.`
    )

  // Schema.org optimizado para rich snippets jurídicos
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': canonicalUrl,
    headline: title.length > 110 ? title.substring(0, 110) : title,
    description: schemaDesc.length > 200 ? schemaDesc.substring(0, 197) + '...' : schemaDesc,
    image: {
      '@type': 'ImageObject',
      url: `https://linea-judicial.com/images/articles/${generateSlug(metadata.articleTitle)}.jpg`,
      description: metadata.imageAlt || `Imagen del artículo: ${title}`
    },
    author: {
      '@type': 'Organization',
      name: 'Línea Judicial',
      url: 'https://linea-judicial.com'
    },
    publisher: {
      '@type': 'Organization',
      name: 'Línea Judicial',
      logo: {
        '@type': 'ImageObject',
        url: 'https://linea-judicial.com/logo.png',
        width: 600,
        height: 60
      }
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': canonicalUrl
    },
    url: canonicalUrl,
    datePublished: new Date().toISOString(),
    dateModified: new Date().toISOString(),
    articleSection: metadata.section,
    keywords: metadata.keywords.slice(0, 10).join(', '),
    wordCount: metadata.readingTime * 200,
    timeRequired: `PT${metadata.readingTime}M`,
    inLanguage: 'es-CO',
    genre: 'Legal Analysis',
    about: {
      '@type': 'LegalDocument',
      name: `Análisis de ${metadata.section}`,
      description: `Contenido jurídico especializado en ${metadata.section.toLowerCase()}`
    },
    isPartOf: {
      '@type': 'WebSite',
      name: 'Línea Judicial',
      url: 'https://linea-judicial.com'
    }
  }
}

// Función para validar Schema.org
export const validateSchemaOrg = (schema: any): { isValid: boolean; length: number; issues: string[] } => {
  const schemaString = JSON.stringify(schema, null, 0)
  const issues: string[] = []

  if (schemaString.length > 8000) {
    issues.push('Schema muy largo (máximo 8000 caracteres)')
  }

  if (!schema.headline) {
    issues.push('Falta headline (título)')
  }

  if (!schema.description) {
    issues.push('Falta description')
  }

  if (schema.description && schema.description.length > 200) {
    issues.push('Description muy larga (máximo 200 caracteres)')
  }

  return {
    isValid: issues.length === 0,
    length: schemaString.length,
    issues
  }
}