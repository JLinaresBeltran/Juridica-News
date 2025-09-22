import { useState, useEffect } from 'react'
import { generateImageAltText, generateImageFilename } from '../../utils/seoUtils'

interface SEOImageProps {
  src: string
  title: string
  section: string
  imageType?: 'article' | 'thumbnail' | 'hero' | 'gallery'
  className?: string
  width?: number
  height?: number
  priority?: boolean
  lazy?: boolean
  sizes?: string
  alt?: string // Alt text personalizado opcional
}

export default function SEOImage({
  src,
  title,
  section,
  imageType = 'article',
  className = '',
  width,
  height,
  priority = false,
  lazy = true,
  sizes,
  alt
}: SEOImageProps) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)

  // Generar alt text SEO optimizado
  const altText = alt || generateImageAltText(title, section, imageType)

  // Generar nombre de archivo sugerido (para logging/debug)
  const suggestedFilename = generateImageFilename(title, imageType)

  // Estados para lazy loading
  const [inView, setInView] = useState(!lazy || priority)

  useEffect(() => {
    if (!lazy || priority) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )

    const imgElement = document.getElementById(`seo-img-${suggestedFilename}`)
    if (imgElement) {
      observer.observe(imgElement)
    }

    return () => observer.disconnect()
  }, [lazy, priority, suggestedFilename])

  // Función para manejar carga de imagen
  const handleImageLoad = () => {
    setImageLoaded(true)
    setImageError(false)
  }

  // Función para manejar error de imagen
  const handleImageError = () => {
    setImageError(true)
    setImageLoaded(false)
    console.warn(`Error cargando imagen SEO: ${src}`)
  }

  // Función para generar srcSet responsivo
  const generateSrcSet = (baseSrc: string): string => {
    if (baseSrc.startsWith('data:') || baseSrc.startsWith('blob:')) {
      return '' // No generar srcSet para data URLs o blob URLs
    }

    // Si la imagen es de un servicio externo (DALL-E, etc.)
    if (baseSrc.includes('oaidalleapiprodscus') || baseSrc.includes('external')) {
      return '' // No modificar URLs externas
    }

    // Para imágenes locales, generar diferentes tamaños
    const baseUrl = baseSrc.replace(/\.[^/.]+$/, '') // Remover extensión
    const extension = baseSrc.split('.').pop() || 'jpg'

    return [
      `${baseUrl}-320w.${extension} 320w`,
      `${baseUrl}-640w.${extension} 640w`,
      `${baseUrl}-1024w.${extension} 1024w`,
      `${baseUrl}-1200w.${extension} 1200w`
    ].join(', ')
  }

  // Generar sizes automáticamente si no se especifica
  const defaultSizes = sizes || (() => {
    switch (imageType) {
      case 'hero':
        return '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
      case 'thumbnail':
        return '(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 200px'
      case 'gallery':
        return '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 400px'
      default:
        return '(max-width: 768px) 100vw, (max-width: 1200px) 75vw, 800px'
    }
  })()

  // Imagen placeholder mientras carga
  const PlaceholderDiv = () => (
    <div
      className={`bg-gray-200 dark:bg-gray-700 animate-pulse flex items-center justify-center ${className}`}
      style={{ width, height }}
    >
      <div className="text-gray-400 text-sm">
        {imageType === 'thumbnail' ? '📄' : '🖼️'}
      </div>
    </div>
  )

  // Imagen de error/fallback
  const ErrorDiv = () => (
    <div
      className={`bg-gray-100 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center ${className}`}
      style={{ width, height }}
    >
      <div className="text-center text-gray-500 dark:text-gray-400 p-4">
        <div className="text-2xl mb-2">📄</div>
        <div className="text-xs">Imagen no disponible</div>
      </div>
    </div>
  )

  // No renderizar imagen hasta que esté en viewport (lazy loading)
  if (!inView) {
    return <PlaceholderDiv />
  }

  // Mostrar error si la imagen falló
  if (imageError) {
    return <ErrorDiv />
  }

  return (
    <>
      <img
        id={`seo-img-${suggestedFilename}`}
        src={src}
        alt={altText}
        className={`transition-opacity duration-300 ${
          imageLoaded ? 'opacity-100' : 'opacity-0'
        } ${className}`}
        width={width}
        height={height}
        srcSet={generateSrcSet(src)}
        sizes={defaultSizes}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        onLoad={handleImageLoad}
        onError={handleImageError}
        style={{
          maxWidth: '100%',
          height: 'auto',
          ...(!imageLoaded && { display: 'none' })
        }}
      />

      {/* Mostrar placeholder mientras carga */}
      {!imageLoaded && <PlaceholderDiv />}

      {/* Schema.org markup para la imagen */}
      {imageLoaded && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "ImageObject",
              "url": src,
              "description": altText,
              "width": width,
              "height": height,
              "encodingFormat": src.split('.').pop()?.toUpperCase() || "JPEG"
            })
          }}
        />
      )}
    </>
  )
}

// Hook para optimizar imágenes automáticamente
export const useOptimizedImage = (src: string, title: string, section: string) => {
  return {
    src,
    alt: generateImageAltText(title, section),
    filename: generateImageFilename(title)
  }
}

// Componente especializado para imágenes de artículos
export const ArticleImage = (props: Omit<SEOImageProps, 'imageType'>) => (
  <SEOImage {...props} imageType="article" />
)

// Componente especializado para thumbnails
export const ThumbnailImage = (props: Omit<SEOImageProps, 'imageType'>) => (
  <SEOImage {...props} imageType="thumbnail" />
)

// Componente especializado para imágenes hero
export const HeroImage = (props: Omit<SEOImageProps, 'imageType'>) => (
  <SEOImage {...props} imageType="hero" priority={true} />
)