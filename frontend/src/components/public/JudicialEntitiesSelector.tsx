import React, { useState } from 'react'
import { ChevronRight, Clock, AlertCircle, Building2, Scale } from 'lucide-react'
import { JudicialEntity, judicialEntities, getTopEntitiesByActivity } from '@/data/judicialEntities'

interface JudicialEntitiesSelectorProps {
  className?: string
}

const getColorClasses = (color: string) => {
  const colors = {
    blue: { 
      bg: 'bg-blue-50', 
      border: 'border-blue-200', 
      text: 'text-blue-800', 
      accent: 'bg-blue-600',
      hover: 'hover:bg-blue-100' 
    },
    red: { 
      bg: 'bg-red-50', 
      border: 'border-red-200', 
      text: 'text-red-800', 
      accent: 'bg-red-600',
      hover: 'hover:bg-red-100' 
    },
    green: { 
      bg: 'bg-green-50', 
      border: 'border-green-200', 
      text: 'text-green-800', 
      accent: 'bg-green-600',
      hover: 'hover:bg-green-100' 
    },
    purple: { 
      bg: 'bg-purple-50', 
      border: 'border-purple-200', 
      text: 'text-purple-800', 
      accent: 'bg-purple-600',
      hover: 'hover:bg-purple-100' 
    },
    orange: { 
      bg: 'bg-orange-50', 
      border: 'border-orange-200', 
      text: 'text-orange-800', 
      accent: 'bg-orange-600',
      hover: 'hover:bg-orange-100' 
    },
    indigo: { 
      bg: 'bg-indigo-50', 
      border: 'border-indigo-200', 
      text: 'text-indigo-800', 
      accent: 'bg-indigo-600',
      hover: 'hover:bg-indigo-100' 
    },
    teal: { 
      bg: 'bg-teal-50', 
      border: 'border-teal-200', 
      text: 'text-teal-800', 
      accent: 'bg-teal-600',
      hover: 'hover:bg-teal-100' 
    },
    pink: { 
      bg: 'bg-pink-50', 
      border: 'border-pink-200', 
      text: 'text-pink-800', 
      accent: 'bg-pink-600',
      hover: 'hover:bg-pink-100' 
    }
  }
  return colors[color as keyof typeof colors] || colors.blue
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

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('es-CO', { 
    month: 'short', 
    day: 'numeric' 
  })
}

export const JudicialEntitiesSelector: React.FC<JudicialEntitiesSelectorProps> = ({ 
  className = '' 
}) => {
  const [selectedEntity, setSelectedEntity] = useState<JudicialEntity | null>(null)
  const topEntities = getTopEntitiesByActivity(8)

  const handleEntityClick = (entity: JudicialEntity) => {
    setSelectedEntity(selectedEntity?.id === entity.id ? null : entity)
  }

  return (
    <div className={`${className}`}>
      {/* Grid de entidades */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {topEntities.map((entity) => {
          const colors = getColorClasses(entity.color)
          const isSelected = selectedEntity?.id === entity.id
          
          return (
            <div
              key={entity.id}
              onClick={() => handleEntityClick(entity)}
              className={`
                ${colors.bg} ${colors.border} ${colors.hover}
                border-2 rounded-lg p-4 cursor-pointer transition-all duration-200
                ${isSelected ? 'ring-2 ring-offset-2 ring-gray-400 scale-105' : 'hover:shadow-md'}
              `}
            >
              {/* Header de la entidad */}
              <div className="flex items-start justify-between mb-3">
                <div className={`${colors.accent} w-10 h-10 rounded-lg flex items-center justify-center`}>
                  <span className="text-white font-bold text-sm">
                    {entity.acronym}
                  </span>
                </div>
                <div className="text-right">
                  <span className={`text-xs font-medium ${colors.text}`}>
                    {entity.articleCount} noticias
                  </span>
                  <div className="text-xs text-gray-500">
                    {formatDate(entity.lastUpdate)}
                  </div>
                </div>
              </div>

              {/* Nombre y descripción */}
              <div>
                <h3 className={`font-semibold text-sm ${colors.text} mb-1 leading-tight`}>
                  {entity.name}
                </h3>
                <p className="text-xs text-gray-600 line-clamp-2">
                  {entity.description}
                </p>
              </div>

              {/* Indicador de selección */}
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-1">
                  <Building2 className={`w-3 h-3 ${colors.text}`} />
                  <span className={`text-xs capitalize ${colors.text}`}>
                    {entity.type}
                  </span>
                </div>
                <ChevronRight className={`w-4 h-4 ${colors.text} transition-transform duration-200 ${
                  isSelected ? 'rotate-90' : ''
                }`} />
              </div>
            </div>
          )
        })}
      </div>

      {/* Panel de noticias de la entidad seleccionada */}
      {selectedEntity && (
        <div className="mt-6 bg-white border-2 border-gray-200 rounded-lg p-4 sm:p-6 shadow-md">
          <div className="flex items-center gap-3 mb-4">
            <div className={`${getColorClasses(selectedEntity.color).accent} w-8 h-8 rounded flex items-center justify-center`}>
              <Scale className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg">
                {selectedEntity.name}
              </h3>
              <p className="text-sm text-gray-600">
                {selectedEntity.description}
              </p>
            </div>
          </div>

          {/* Lista de artículos sin imágenes */}
          <div className="space-y-3">
            {selectedEntity.articles.map((article) => (
              <div
                key={article.id}
                className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
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
                    </div>
                    <h4 className="font-semibold text-sm text-gray-900 mb-1">
                      {article.title}
                    </h4>
                    <p className="text-xs text-gray-600">
                      {article.excerpt}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                </div>
              </div>
            ))}
          </div>

          {/* Footer del panel */}
          <div className="mt-4 pt-3 border-t border-gray-200 flex items-center justify-between">
            <span className="text-xs text-gray-500">
              Última actualización: {formatDate(selectedEntity.lastUpdate)}
            </span>
            <button 
              className={`text-xs ${getColorClasses(selectedEntity.color).text} hover:underline font-medium`}
              onClick={() => {
                // TODO: Ver todas las noticias de la entidad
                console.log('Ver todas las noticias de:', selectedEntity.name)
              }}
            >
              Ver todas las noticias →
            </button>
          </div>
        </div>
      )}

      {/* Mensaje inicial */}
      {!selectedEntity && (
        <div className="text-center py-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <Building2 className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600 mb-1">
            <strong>Selecciona una entidad judicial</strong>
          </p>
          <p className="text-xs text-gray-500">
            Haz clic en cualquier entidad para ver sus noticias más recientes
          </p>
        </div>
      )}
    </div>
  )
}