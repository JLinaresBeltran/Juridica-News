import React from 'react'
import { Star, Award, TrendingUp, Clock, User, Tag } from 'lucide-react'
import { MockArticle } from '@/data/mockArticles'

interface WeeklyHighlightsProps {
  articles: MockArticle[]
  className?: string
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('es-CO', { 
    day: 'numeric',
    month: 'short' 
  })
}

const getCategoryIcon = (category: string) => {
  const icons = {
    'Constitucional': '⚖️',
    'Civil': '🏛️', 
    'Penal': '👮',
    'Laboral': '👷',
    'Administrativo': '📋',
    'Tributario': '💰',
    'Comercial': '🏪',
    'Familia': '👨‍👩‍👧‍👦',
    'Internacional': '🌍'
  }
  return icons[category as keyof typeof icons] || '📄'
}

export const WeeklyHighlights: React.FC<WeeklyHighlightsProps> = ({ 
  articles, 
  className = '' 
}) => {
  const handleArticleClick = (slug: string) => {
    window.location.href = `/portal/articles/${slug}`
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-100 ${className}`}>
      {/* Header con diseño coherente pero distintivo */}
      <div className="p-4 sm:p-6 border-b border-gray-100 bg-gradient-to-r from-amber-50 to-orange-50">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-amber-600 p-2 rounded-lg">
            <Star className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Destacados de la Semana</h3>
            <p className="text-sm text-gray-600">Contenido curado por nuestro equipo editorial</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 text-sm text-amber-700">
          <span className="flex items-center gap-1">
            <Award className="w-4 h-4" />
            {articles.length} artículos seleccionados
          </span>
          <span>• Relevancia jurídica excepcional</span>
        </div>
      </div>

      {/* Lista de artículos con diseño coherente pero distintivo */}
      <div className="p-4 sm:p-6">
        <div className="space-y-4">
          {articles.map((article, index) => (
            <div
              key={article.id}
              onClick={() => handleArticleClick(article.slug)}
              className="bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors border-l-4 border-amber-500"
            >
              <div className="flex">
                {/* Imagen del artículo */}
                <div className="flex-shrink-0 w-32 sm:w-40 md:w-48">
                  <div className="w-full h-24 sm:h-28 md:h-32 relative">
                    <img
                      src={article.imageUrl}
                      alt={article.title}
                      className="w-full h-full object-cover rounded-l-lg"
                    />
                    {/* Badge de destacado */}
                    <div className="absolute top-2 left-2">
                      <div className="bg-amber-500 text-white px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
                        <Star className="w-3 h-3" />
                        #{index + 1}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contenido coherente con el resto */}
                <div className="flex-1 p-3 sm:p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-800">
                      ⭐ Destacado
                    </span>
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                      {article.category}
                    </span>
                  </div>
                  
                  <h4 className="text-sm sm:text-base font-semibold text-gray-900 line-clamp-2 mb-2">
                    {article.title}
                  </h4>
                  
                  <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 mb-3">
                    {article.excerpt}
                  </p>
                  
                  <div className="flex items-center text-xs text-gray-500 gap-3">
                    <span className="flex items-center gap-1">
                      <User size={12} />
                      {article.author}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {article.readTime}
                    </span>
                    <span className="flex items-center gap-1 ml-auto text-amber-600">
                      <Award size={12} />
                      Curado
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer simple y coherente */}
        <div className="mt-6 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800 text-center">
            📚 <strong>Selección Editorial:</strong> Artículos destacados por su relevancia jurídica excepcional
          </p>
        </div>
      </div>
    </div>
  )
}