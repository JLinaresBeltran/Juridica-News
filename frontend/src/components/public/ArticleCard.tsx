import React from 'react'
import { Link } from 'react-router-dom'
import { Clock, User } from 'lucide-react'
import { PublicArticle, getDefaultArticleImage } from '@/types/publicArticle.types'
import { ResponsiveImage } from '@/components/ui/ResponsiveImage'

interface ArticleCardProps {
  article: PublicArticle
  layout?: 'horizontal' | 'vertical' | 'featured' | 'minimal'
  size?: 'small' | 'medium' | 'large'
  className?: string
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const formatReadingTime = (readingTime: number): string => {
  return `${readingTime} min`
}

export const ArticleCard: React.FC<ArticleCardProps> = ({
  article,
  layout = 'vertical',
  size = 'medium',
  className = ''
}) => {

  // Generate SEO-optimized article URL
  const articleUrl = `/portal/articles/${article.slug}`

  // Get image URL with fallback hierarchy
  const getImageUrl = (): string => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

    // 1. Usar imageUrl si está disponible (ya procesado por backend)
    if (article.imageUrl) {
      // Si ya tiene el host completo, usarla tal como está
      if (article.imageUrl.startsWith('http')) {
        return article.imageUrl
      }
      // Si es relativa, agregar el host del backend
      return `${API_URL}${article.imageUrl}`
    }

    // 2. Usar primera imagen de generatedImages si está disponible
    if (article.generatedImages && article.generatedImages.length > 0) {
      const firstImage = article.generatedImages[0]

      // Priorizar URL procesada por backend
      if (firstImage.url) {
        // Si ya tiene el host completo, usarla tal como está
        if (firstImage.url.startsWith('http')) {
          return firstImage.url
        }
        // Si es relativa, agregar el host del backend
        return `${API_URL}${firstImage.url}`
      }

      // Fallback a filename si está disponible
      if (firstImage.filename) {
        return `${API_URL}/api/storage/images/${firstImage.filename}`
      }

      // Usar fallbackUrl si está definida
      if (firstImage.fallbackUrl && firstImage.fallbackUrl !== 'base64-image') {
        return firstImage.fallbackUrl
      }
    }

    // 3. Imagen por defecto basada en categoría
    return getDefaultArticleImage(article.category)
  }

  const imageUrl = getImageUrl()

  // Layout horizontal (imagen izquierda, contenido derecha)
  if (layout === 'horizontal') {
    return (
      <Link
        to={articleUrl}
        className={`block bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-100 ${className}`}
        title={`Leer artículo completo: ${article.title}`}
        aria-label={`Artículo sobre ${article.category}: ${article.title}`}
      >
        <article>
        <div className="flex">
          <div className="flex-shrink-0 w-36">
            <ResponsiveImage
              src={imageUrl}
              alt={article.title}
              aspectRatio="4/3"
              objectFit="cover"
              className="rounded-l-lg"
              category={article.category}
              sizes="(max-width: 768px) 144px, 144px"
            />
          </div>
          <div className="flex-1 px-4 py-3 sm:px-5 sm:py-4">
            <h3 className="text-sm sm:text-base font-semibold text-gray-900 line-clamp-2 mb-3">
              {article.title}
            </h3>
            <div className="flex items-center text-xs text-gray-500 gap-3">
              <span className="flex items-center gap-1">
                <Clock size={12} />
                {formatReadingTime(article.readingTime)}
              </span>
              <span>
                {formatDate(article.publishedAt)}
              </span>
            </div>
          </div>
        </div>
        </article>
      </Link>
    )
  }

  // Layout destacado (más grande, con más información)
  if (layout === 'featured') {
    return (
      <Link
        to={articleUrl}
        className={`block bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200 ${className}`}
        title={`Leer artículo destacado: ${article.title}`}
        aria-label={`Artículo destacado sobre ${article.category}: ${article.title}`}
      >
        <article>
        <ResponsiveImage
          src={imageUrl}
          alt={article.title}
          aspectRatio="16/9"
          objectFit="cover"
          className="rounded-t-lg"
          category={article.category}
          priority={true}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        <div className="px-5 py-4 sm:px-6 sm:py-5">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">
            {article.title}
          </h3>
          <div className="flex items-center text-sm text-gray-500 gap-4">
            <span className="flex items-center gap-1">
              <Clock size={14} />
              {formatReadingTime(article.readingTime)}
            </span>
            <span>
              {formatDate(article.publishedAt)}
            </span>
            {article.author && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <User size={12} />
                  {article.author.firstName} {article.author.lastName}
                </span>
              </>
            )}
          </div>
        </div>
        </article>
      </Link>
    )
  }

  // Layout minimal (solo título, fecha y tiempo de lectura)
  if (layout === 'minimal') {
    return (
      <Link
        to={articleUrl}
        className={`block bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-all px-5 py-4 hover:shadow-sm ${className}`}
        title={`Leer artículo: ${article.title}`}
        aria-label={`Artículo sobre ${article.category}: ${article.title}`}
      >
        <article>
        <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 mb-2 hover:text-blue-600 transition-colors">
          {article.title}
        </h3>
        <div className="flex items-center text-xs text-gray-500 gap-3">
          <span className="flex items-center gap-1">
            <Clock size={12} />
            {formatReadingTime(article.readingTime)}
          </span>
          <span>
            {formatDate(article.publishedAt)}
          </span>
        </div>
        </article>
      </Link>
    )
  }

  // Layout vertical por defecto
  return (
    <Link
      to={articleUrl}
      className={`block bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-100 ${className}`}
      title={`Leer artículo completo: ${article.title}`}
      aria-label={`Artículo sobre ${article.category}: ${article.title}`}
    >
      <article>
      <ResponsiveImage
        src={imageUrl}
        alt={article.title}
        aspectRatio="16/9"
        objectFit="cover"
        className="rounded-t-lg"
        category={article.category}
        sizes={
          size === 'small'
            ? "(max-width: 768px) 100vw, 300px"
            : size === 'large'
            ? "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 400px"
            : "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 350px"
        }
      />
      <div className={`px-4 py-3 ${size === 'large' ? 'sm:px-5 sm:py-4' : ''}`}>
        <h3 className={`font-semibold text-gray-900 line-clamp-2 mb-3 ${
          size === 'small' ? 'text-sm' : size === 'large' ? 'text-lg' : 'text-base'
        }`}>
          {article.title}
        </h3>
        <div className="flex items-center text-xs text-gray-500 gap-3">
          <span className="flex items-center gap-1">
            <Clock size={12} />
            {formatReadingTime(article.readingTime)}
          </span>
          <span>
            {formatDate(article.publishedAt)}
          </span>
        </div>
      </div>
      </article>
    </Link>
  )
}