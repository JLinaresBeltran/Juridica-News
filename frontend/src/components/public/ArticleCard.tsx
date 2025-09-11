import React from 'react'
import { Clock } from 'lucide-react'
import { MockArticle } from '@/data/mockArticles'

interface ArticleCardProps {
  article: MockArticle
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

export const ArticleCard: React.FC<ArticleCardProps> = ({ 
  article, 
  layout = 'vertical', 
  size = 'medium',
  className = '' 
}) => {

  const handleClick = () => {
    // Navegación a la página del artículo individual
    window.location.href = `/portal/articles/${article.slug}`
  }

  // Layout horizontal (imagen izquierda, contenido derecha)
  if (layout === 'horizontal') {
    return (
      <article 
        className={`bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-gray-100 ${className}`}
        onClick={handleClick}
      >
        <div className="flex">
          <div className="flex-shrink-0 w-36 bg-gray-50 rounded-l-lg overflow-hidden">
            <img
              src={article.imageUrl}
              alt={article.title}
              className="w-full h-auto object-contain"
              style={{ aspectRatio: '3/2' }}
            />
          </div>
          <div className="flex-1 px-4 py-3 sm:px-5 sm:py-4">
            <h3 className="text-sm sm:text-base font-semibold text-gray-900 line-clamp-2 mb-3">
              {article.title}
            </h3>
            <div className="flex items-center text-xs text-gray-500 gap-3">
              <span className="flex items-center gap-1">
                <Clock size={12} />
                {article.readTime}
              </span>
              <span>
                {formatDate(article.publishedAt)}
              </span>
            </div>
          </div>
        </div>
      </article>
    )
  }

  // Layout destacado (más grande, con más información)
  if (layout === 'featured') {
    return (
      <article 
        className={`bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer border border-gray-200 ${className}`}
        onClick={handleClick}
      >
        <div className="relative bg-gray-50 rounded-t-lg overflow-hidden">
          <img
            src={article.imageUrl}
            alt={article.title}
            className="w-full h-auto object-contain"
            style={{ aspectRatio: '16/9' }}
          />
        </div>
        <div className="px-5 py-4 sm:px-6 sm:py-5">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">
            {article.title}
          </h3>
          <div className="flex items-center text-sm text-gray-500 gap-4">
            <span className="flex items-center gap-1">
              <Clock size={14} />
              {article.readTime}
            </span>
            <span>
              {formatDate(article.publishedAt)}
            </span>
          </div>
        </div>
      </article>
    )
  }

  // Layout minimal (solo título, fecha y tiempo de lectura)
  if (layout === 'minimal') {
    return (
      <article 
        className={`bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-all cursor-pointer px-5 py-4 hover:shadow-sm ${className}`}
        onClick={handleClick}
      >
        <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 mb-2 hover:text-blue-600 transition-colors">
          {article.title}
        </h3>
        <div className="flex items-center text-xs text-gray-500 gap-3">
          <span className="flex items-center gap-1">
            <Clock size={12} />
            {article.readTime}
          </span>
          <span>
            {formatDate(article.publishedAt)}
          </span>
        </div>
      </article>
    )
  }

  // Layout vertical por defecto
  return (
    <article 
      className={`bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-gray-100 ${className}`}
      onClick={handleClick}
    >
      <div className="relative bg-gray-50 rounded-t-lg overflow-hidden">
        <img
          src={article.imageUrl}
          alt={article.title}
          className="w-full h-auto object-contain"
          style={{ 
            aspectRatio: '16/9',
            minHeight: size === 'small' ? '8rem' : size === 'large' ? '12rem' : '10rem'
          }}
        />
      </div>
      <div className={`px-4 py-3 ${size === 'large' ? 'sm:px-5 sm:py-4' : ''}`}>
        <h3 className={`font-semibold text-gray-900 line-clamp-2 mb-3 ${
          size === 'small' ? 'text-sm' : size === 'large' ? 'text-lg' : 'text-base'
        }`}>
          {article.title}
        </h3>
        <div className="flex items-center text-xs text-gray-500 gap-3">
          <span className="flex items-center gap-1">
            <Clock size={12} />
            {article.readTime}
          </span>
          <span>
            {formatDate(article.publishedAt)}
          </span>
        </div>
      </div>
    </article>
  )
}