/**
 * Utilidades para procesar imágenes generadas por AI
 * y adaptarlas a diferentes layouts del periódico
 */

export interface ImageVariant {
  url: string
  width: number
  height: number
  aspectRatio: string
  layout: 'vertical-large' | 'vertical-medium' | 'horizontal-compact' | 'featured'
}

/**
 * Genera URLs para diferentes variantes de una imagen base
 * Simula el procesamiento - en producción sería con un servicio real
 */
export function generateImageVariants(baseImageUrl: string): ImageVariant[] {
  return [
    {
      url: baseImageUrl, // En producción: baseImageUrl + '?w=1280&h=720&fit=crop'
      width: 1280,
      height: 720,
      aspectRatio: '16/9',
      layout: 'vertical-large'
    },
    {
      url: baseImageUrl, // En producción: baseImageUrl + '?w=960&h=540&fit=crop'
      width: 960,
      height: 540,
      aspectRatio: '16/9',
      layout: 'vertical-medium'
    },
    {
      url: baseImageUrl, // En producción: baseImageUrl + '?w=600&h=400&fit=crop'
      width: 600,
      height: 400,
      aspectRatio: '3/2',
      layout: 'horizontal-compact'
    },
    {
      url: baseImageUrl, // En producción: baseImageUrl + '?w=1920&h=1080&fit=crop'
      width: 1920,
      height: 1080,
      aspectRatio: '16/9',
      layout: 'featured'
    }
  ]
}

/**
 * Obtiene la mejor variante de imagen para un layout específico
 */
export function getBestImageVariant(
  baseImageUrl: string,
  layout: 'vertical' | 'horizontal' | 'featured',
  size: 'small' | 'medium' | 'large' = 'medium'
): ImageVariant {
  const variants = generateImageVariants(baseImageUrl)

  // Lógica para seleccionar la mejor variante
  if (layout === 'horizontal') {
    return variants.find(v => v.layout === 'horizontal-compact') || variants[0]
  }

  if (layout === 'featured') {
    return variants.find(v => v.layout === 'featured') || variants[0]
  }

  // Layout vertical
  if (size === 'large') {
    return variants.find(v => v.layout === 'vertical-large') || variants[0]
  } else {
    return variants.find(v => v.layout === 'vertical-medium') || variants[0]
  }
}

/**
 * Genera parámetros de estilo CSS para imágenes responsivas
 */
export function getResponsiveImageStyles(
  layout: 'vertical' | 'horizontal' | 'featured',
  size: 'small' | 'medium' | 'large' = 'medium'
): React.CSSProperties {
  const variant = getBestImageVariant('', layout, size)

  return {
    aspectRatio: variant.aspectRatio,
    objectFit: 'cover' as const,
    width: '100%',
    height: 'auto'
  }
}

/**
 * Calcula las dimensiones óptimas para diferentes contextos
 */
export const IMAGE_SPECS = {
  // Artículos principales (portada)
  HERO: {
    width: 1280,
    height: 720,
    aspectRatio: '16/9',
    minHeight: '12rem' // 192px
  },

  // Tarjetas compactas (sidebar, listas)
  COMPACT: {
    width: 600,
    height: 400,
    aspectRatio: '3/2',
    minHeight: '6rem' // 96px
  },

  // Artículos destacados
  FEATURED: {
    width: 1920,
    height: 1080,
    aspectRatio: '16/9',
    minHeight: '16rem' // 256px
  },

  // Para artículos medianos
  MEDIUM: {
    width: 960,
    height: 540,
    aspectRatio: '16/9',
    minHeight: '10rem' // 160px
  }
} as const

/**
 * Hook para obtener la URL de imagen optimizada
 */
export function useOptimizedImage(
  baseUrl: string,
  context: keyof typeof IMAGE_SPECS
) {
  const spec = IMAGE_SPECS[context]

  // En producción, esto generaría URLs con parámetros de optimización
  // Por ejemplo: cloudinary, imgix, etc.
  // return `${baseUrl}?w=${spec.width}&h=${spec.height}&fit=crop&q=85`

  return {
    url: baseUrl,
    ...spec
  }
}