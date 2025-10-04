import React, { useState, useCallback, useEffect, useRef } from 'react'
import { getDefaultArticleImage } from '@/types/publicArticle.types'

interface ResponsiveImageProps {
  src: string
  alt: string
  aspectRatio?: 'square' | '4/3' | '3/2' | '16/9' | '21/9'
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down'
  className?: string
  loading?: 'eager' | 'lazy'
  placeholder?: boolean
  sizes?: string
  category?: string
  priority?: boolean
  onLoad?: () => void
  onError?: () => void
}

const aspectRatioMap = {
  'square': '100%',
  '4/3': '75%',
  '3/2': '66.67%',
  '16/9': '56.25%',
  '21/9': '42.86%'
}

export const ResponsiveImage: React.FC<ResponsiveImageProps> = ({
  src,
  alt,
  aspectRatio = '16/9',
  objectFit = 'contain',
  className = '',
  loading = 'lazy',
  placeholder = true,
  sizes,
  category,
  priority = false,
  onLoad,
  onError
}) => {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [imageSrc, setImageSrc] = useState(src)
  const [isInView, setIsInView] = useState(!loading || loading === 'eager')
  const imgRef = useRef<HTMLImageElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Update image source when prop changes
  useEffect(() => {
    if (src !== imageSrc && !hasError) {
      setImageSrc(src)
      setIsLoading(true)
      setHasError(false)
    }
  }, [src, imageSrc, hasError])

  // Enhanced Intersection Observer for lazy loading optimization
  useEffect(() => {
    if (loading === 'lazy' && !priority && containerRef.current) {
      const observer = new IntersectionObserver(
        (entries) => {
          const [entry] = entries
          if (entry.isIntersecting) {
            setIsInView(true)
            observer.disconnect()
          }
        },
        {
          rootMargin: '100px', // Load image 100px before it comes into view
          threshold: 0.1
        }
      )

      observer.observe(containerRef.current)
      return () => observer.disconnect()
    }
  }, [loading, priority])

  const handleLoad = useCallback(() => {
    setIsLoading(false)
    onLoad?.()
  }, [onLoad])

  const handleError = useCallback(() => {
    setIsLoading(false)
    setHasError(true)

    // Intelligent fallback strategy
    // Si hay categoría, intentar imagen por defecto, sino usar data URI
    if (category) {
      const fallbackImage = getDefaultArticleImage(category)

      // Avoid infinite loop by checking if we're already using fallback
      if (imageSrc !== fallbackImage) {
        setImageSrc(fallbackImage)
        setIsLoading(true) // Reset loading state for fallback image
        setHasError(false) // Reset error state for retry
      }
    }
    // No intentar cargar placeholder físico - dejar que se muestre el estado de error

    onError?.()
  }, [onError, category, imageSrc])

  const paddingBottom = aspectRatioMap[aspectRatio]
  const shouldShowImage = isInView || loading === 'eager' || priority

  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden rounded-lg bg-gray-50 ${className}`}
    >
      <div
        className="relative w-full"
        style={{ paddingBottom }}
      >
        {/* Enhanced loading placeholder with shimmer effect */}
        {placeholder && isLoading && (
          <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200px_100%] animate-shimmer flex items-center justify-center">
            <div className="text-center text-gray-400 opacity-80">
              <div className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 animate-pulse">
                <svg
                  className="w-full h-full"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <p className="text-xs opacity-70">Cargando imagen...</p>
            </div>
          </div>
        )}

        {/* Enhanced error state with better UX */}
        {hasError && !isLoading && (
          <div className="absolute inset-0 bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center">
            <div className="text-center text-gray-400 px-4">
              <div className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2">
                <svg
                  className="w-full h-full"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <p className="text-xs text-center leading-relaxed">
                {category
                  ? `Usando imagen por defecto de ${category}`
                  : 'Imagen no disponible'
                }
              </p>
            </div>
          </div>
        )}

        {/* Optimized image with advanced loading strategies */}
        {shouldShowImage && (
          <img
            ref={imgRef}
            src={imageSrc}
            alt={alt}
            className={`absolute inset-0 w-full h-full transition-all duration-500 ease-out ${
              isLoading || hasError ? 'opacity-0' : 'opacity-100'
            } ${priority ? 'image-critical' : 'image-optimized'}`}
            style={{
              objectFit,
              objectPosition: 'center',
              willChange: isLoading ? 'opacity' : 'auto',
            }}
            loading={priority ? 'eager' : loading}
            decoding={priority ? 'sync' : 'async'}
            sizes={sizes || `(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw`}
            fetchpriority={priority ? 'high' : 'auto'}
            onLoad={handleLoad}
            onError={handleError}
          />
        )}
      </div>
    </div>
  )
}