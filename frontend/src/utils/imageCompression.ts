/**
 * Utilidades para comprimir imágenes manteniendo calidad
 */

export interface CompressionOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  format?: 'jpeg' | 'webp' | 'png'
}

/**
 * Comprime una imagen base64 manteniendo buena calidad pero reduciendo tamaño
 */
export const compressBase64Image = async (
  base64: string, 
  options: CompressionOptions = {}
): Promise<string> => {
  const {
    maxWidth = 1200,
    maxHeight = 800,
    quality = 0.85,
    format = 'jpeg'
  } = options

  return new Promise((resolve, reject) => {
    const img = new Image()
    
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      if (!ctx) {
        reject(new Error('No se pudo crear el contexto del canvas'))
        return
      }

      // Calcular nuevas dimensiones manteniendo aspect ratio
      let { width, height } = img
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width
        width = maxWidth
      }
      
      if (height > maxHeight) {
        width = (width * maxHeight) / height
        height = maxHeight
      }

      canvas.width = width
      canvas.height = height

      // Configurar calidad de renderizado
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'

      // Dibujar la imagen redimensionada
      ctx.drawImage(img, 0, 0, width, height)

      // Convertir a base64 comprimido
      const mimeType = `image/${format}`
      const compressedBase64 = canvas.toDataURL(mimeType, quality)
      
      console.log(`📸 Imagen comprimida: ${Math.round(base64.length / 1024)}KB → ${Math.round(compressedBase64.length / 1024)}KB`)
      
      resolve(compressedBase64)
    }

    img.onerror = () => {
      reject(new Error('Error cargando la imagen para comprimir'))
    }

    img.src = base64
  })
}

/**
 * Comprime múltiples imágenes en paralelo
 */
export const compressMultipleImages = async (
  images: string[],
  options: CompressionOptions = {}
): Promise<string[]> => {
  try {
    const compressed = await Promise.all(
      images.map(img => compressBase64Image(img, options))
    )
    return compressed
  } catch (error) {
    console.error('Error comprimiendo múltiples imágenes:', error)
    throw error
  }
}

/**
 * Verifica si una imagen base64 es muy grande
 */
export const isImageTooLarge = (base64: string, maxSizeKB: number = 500): boolean => {
  const sizeKB = base64.length / 1024
  return sizeKB > maxSizeKB
}