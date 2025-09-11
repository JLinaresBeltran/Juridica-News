import React from 'react'
import { ChevronRight, Clock, AlertCircle, Building2 } from 'lucide-react'
import { JudicialEntity } from '@/data/judicialEntities'

interface JudicialEntityCardProps {
  entity: JudicialEntity
  isSelected?: boolean
  onClick: () => void
}

const getColorClasses = (color: string) => {
  const colors = {
    blue: { bg: 'bg-blue-100', text: 'text-blue-800', accent: 'bg-blue-600' },
    red: { bg: 'bg-red-100', text: 'text-red-800', accent: 'bg-red-600' },
    green: { bg: 'bg-green-100', text: 'text-green-800', accent: 'bg-green-600' },
    purple: { bg: 'bg-purple-100', text: 'text-purple-800', accent: 'bg-purple-600' },
    orange: { bg: 'bg-orange-100', text: 'text-orange-800', accent: 'bg-orange-600' },
    indigo: { bg: 'bg-indigo-100', text: 'text-indigo-800', accent: 'bg-indigo-600' },
    teal: { bg: 'bg-teal-100', text: 'text-teal-800', accent: 'bg-teal-600' },
    pink: { bg: 'bg-pink-100', text: 'text-pink-800', accent: 'bg-pink-600' }
  }
  return colors[color as keyof typeof colors] || colors.blue
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('es-CO', { 
    month: 'short', 
    day: 'numeric' 
  })
}

export const JudicialEntityCard: React.FC<JudicialEntityCardProps> = ({ 
  entity, 
  isSelected = false, 
  onClick 
}) => {
  const colors = getColorClasses(entity.color)

  return (
    <article 
      className={`bg-white rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer border border-gray-100 hover:bg-gray-50 ${
        isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex">
        {/* Ícono de entidad (reemplaza la imagen) */}
        <div className="flex-shrink-0 w-32 sm:w-40 md:w-48">
          <div className="w-full h-24 sm:h-28 md:h-32 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 rounded-l-lg">
            <div className={`${colors.accent} w-16 h-16 sm:w-20 sm:h-20 rounded-lg flex items-center justify-center shadow-lg`}>
              <span className="text-white font-bold text-lg sm:text-xl">
                {entity.acronym}
              </span>
            </div>
          </div>
        </div>
        
        {/* Contenido (igual que ArticleCard horizontal) */}
        <div className="flex-1 p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors.bg} ${colors.text}`}>
              {entity.type.charAt(0).toUpperCase() + entity.type.slice(1)}
            </span>
            <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
              {entity.articleCount} noticias
            </span>
          </div>
          
          <h3 className="text-sm sm:text-base font-semibold text-gray-900 line-clamp-2 mb-2">
            {entity.name}
          </h3>
          
          <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 mb-3">
            {entity.description}
          </p>
          
          <div className="flex items-center text-xs text-gray-500 gap-3">
            <span className="flex items-center gap-1">
              <Building2 size={12} />
              Sistema Judicial
            </span>
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {formatDate(entity.lastUpdate)}
            </span>
            <span className="flex items-center gap-1 ml-auto">
              <ChevronRight size={12} />
              {isSelected ? 'Expandido' : 'Ver noticias'}
            </span>
          </div>
        </div>
      </div>
    </article>
  )
}

interface JudicialEntityNewsProps {
  entity: JudicialEntity
  onClose: () => void
}

const getPriorityIcon = (priority: 'alta' | 'media' | 'baja') => {
  switch (priority) {
    case 'alta':
      return <AlertCircle className="w-3 h-3 text-red-500" />
    case 'media':
      return <Clock className="w-3 h-3 text-yellow-500" />
    case 'baja':
      return <div className="w-3 h-3 rounded-full bg-gray-300"></div>
  }
}

export const JudicialEntityNews: React.FC<JudicialEntityNewsProps> = ({ 
  entity, 
  onClose 
}) => {
  const colors = getColorClasses(entity.color)

  return (
    <div className="mt-4 bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`${colors.accent} w-8 h-8 rounded flex items-center justify-center`}>
            <span className="text-white font-bold text-sm">{entity.acronym}</span>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">
              Noticias de {entity.name}
            </h4>
            <p className="text-sm text-gray-600">
              {entity.articleCount} artículos disponibles
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Lista de noticias */}
      <div className="space-y-3">
        {entity.articles.map((article) => (
          <div
            key={article.id}
            className="p-3 border border-gray-200 rounded hover:bg-gray-50 cursor-pointer transition-colors"
            onClick={() => {
              // TODO: Navegar al artículo
              console.log('Navegar a artículo:', article.id)
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {getPriorityIcon(article.priority)}
                  <span className="text-xs text-gray-500">
                    {formatDate(article.date)}
                  </span>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${colors.bg} ${colors.text}`}>
                    {article.priority.toUpperCase()}
                  </span>
                </div>
                <h5 className="font-medium text-sm text-gray-900 mb-1">
                  {article.title}
                </h5>
                <p className="text-xs text-gray-600">
                  {article.excerpt}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-gray-200 flex items-center justify-between">
        <span className="text-xs text-gray-500">
          Última actualización: {formatDate(entity.lastUpdate)}
        </span>
        <button 
          className={`text-xs ${colors.text} hover:underline font-medium`}
          onClick={() => {
            console.log('Ver todas las noticias de:', entity.name)
          }}
        >
          Ver todas las noticias →
        </button>
      </div>
    </div>
  )
}