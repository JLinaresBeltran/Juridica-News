import React, { useState } from 'react'
import { ChevronDown, ChevronRight, Building2, Clock, AlertCircle } from 'lucide-react'
import { JudicialEntity, getTopEntitiesByActivity } from '@/data/judicialEntities'

interface JudicialEntitiesListProps {
  className?: string
}

const getColorClasses = (color: string) => {
  const colors = {
    blue: { bg: 'bg-blue-100', text: 'text-blue-800', accent: 'bg-blue-600', dot: 'bg-blue-500' },
    red: { bg: 'bg-red-100', text: 'text-red-800', accent: 'bg-red-600', dot: 'bg-red-500' },
    green: { bg: 'bg-green-100', text: 'text-green-800', accent: 'bg-green-600', dot: 'bg-green-500' },
    purple: { bg: 'bg-purple-100', text: 'text-purple-800', accent: 'bg-purple-600', dot: 'bg-purple-500' },
    orange: { bg: 'bg-orange-100', text: 'text-orange-800', accent: 'bg-orange-600', dot: 'bg-orange-500' },
    indigo: { bg: 'bg-indigo-100', text: 'text-indigo-800', accent: 'bg-indigo-600', dot: 'bg-indigo-500' },
    teal: { bg: 'bg-teal-100', text: 'text-teal-800', accent: 'bg-teal-600', dot: 'bg-teal-500' },
    pink: { bg: 'bg-pink-100', text: 'text-pink-800', accent: 'bg-pink-600', dot: 'bg-pink-500' }
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

export const JudicialEntitiesList: React.FC<JudicialEntitiesListProps> = ({ 
  className = '' 
}) => {
  const [selectedEntity, setSelectedEntity] = useState<JudicialEntity | null>(null)
  const topEntities = getTopEntitiesByActivity(8)

  const handleEntityClick = (entity: JudicialEntity) => {
    setSelectedEntity(selectedEntity?.id === entity.id ? null : entity)
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-100 ${className}`}>
      {/* Header de la tarjeta */}
      <div className="p-4 sm:p-6 border-b border-gray-100">
        <div className="flex items-center gap-3 mb-2">
          <Building2 className="w-5 h-5 text-red-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            Entidades del Sistema Judicial
          </h3>
        </div>
        <p className="text-sm text-gray-600">
          Selecciona cualquier entidad para ver sus noticias más recientes
        </p>
      </div>

      {/* Lista de entidades */}
      <div className="p-4 sm:p-6">
        <div className="space-y-3">
          {topEntities.map((entity, index) => {
            const colors = getColorClasses(entity.color)
            const isSelected = selectedEntity?.id === entity.id
            
            return (
              <div key={entity.id}>
                {/* Item de entidad */}
                <div 
                  onClick={() => handleEntityClick(entity)}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors group"
                >
                  {/* Viñeta colorizada */}
                  <div className={`w-3 h-3 rounded-full ${colors.dot} flex-shrink-0`}></div>
                  
                  {/* Sigla de la entidad */}
                  <div className={`${colors.accent} w-12 h-8 rounded flex items-center justify-center flex-shrink-0`}>
                    <span className="text-white font-bold text-xs">
                      {entity.acronym}
                    </span>
                  </div>
                  
                  {/* Información de la entidad */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-gray-900 truncate">
                        {entity.name}
                      </h4>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded ${colors.bg} ${colors.text} flex-shrink-0`}>
                        {entity.articleCount}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 truncate">
                      {entity.description}
                    </p>
                  </div>
                  
                  {/* Fecha y chevron */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-gray-500 hidden sm:block">
                      {formatDate(entity.lastUpdate)}
                    </span>
                    {isSelected ? (
                      <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                    )}
                  </div>
                </div>

                {/* Panel expandible de noticias */}
                {isSelected && (
                  <div className={`ml-7 mt-2 p-4 ${colors.bg} border border-gray-200 rounded-lg`}>
                    <div className="mb-3">
                      <h5 className={`font-semibold ${colors.text} mb-1`}>
                        Noticias recientes de {entity.name}
                      </h5>
                      <p className="text-xs text-gray-600">
                        {entity.articles.length} artículos disponibles
                      </p>
                    </div>

                    {/* Lista compacta de noticias */}
                    <div className="space-y-2">
                      {entity.articles.map((article) => (
                        <div
                          key={article.id}
                          onClick={() => {
                            console.log('Navegar a artículo:', article.id)
                          }}
                          className="bg-white p-3 rounded border hover:shadow-sm cursor-pointer transition-all"
                        >
                          <div className="flex items-start gap-2">
                            {getPriorityIcon(article.priority)}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs text-gray-500">
                                  {formatDate(article.date)}
                                </span>
                                <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                                  article.priority === 'alta' ? 'bg-red-100 text-red-700' :
                                  article.priority === 'media' ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-gray-100 text-gray-600'
                                }`}>
                                  {article.priority.toUpperCase()}
                                </span>
                              </div>
                              <h6 className="font-medium text-sm text-gray-900 mb-1 line-clamp-1">
                                {article.title}
                              </h6>
                              <p className="text-xs text-gray-600 line-clamp-2">
                                {article.excerpt}
                              </p>
                            </div>
                            <ChevronRight className="w-3 h-3 text-gray-400 flex-shrink-0 mt-1" />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Footer del panel */}
                    <div className="mt-3 pt-2 border-t border-gray-300 flex items-center justify-between">
                      <span className="text-xs text-gray-600">
                        Actualizado: {formatDate(entity.lastUpdate)}
                      </span>
                      <button 
                        className={`text-xs ${colors.text} hover:underline font-medium`}
                        onClick={(e) => {
                          e.stopPropagation()
                          console.log('Ver todas las noticias de:', entity.name)
                        }}
                      >
                        Ver todas →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Footer de la tarjeta */}
      <div className="p-4 sm:p-6 border-t border-gray-100 bg-gray-50 rounded-b-lg">
        <div className="text-center">
          <p className="text-xs text-gray-600 mb-2">
            <strong>Sistema Judicial Colombiano</strong>
          </p>
          <div className="flex flex-wrap justify-center gap-3 text-xs text-gray-500">
            <span>• Cortes Constitucionales</span>
            <span>• Tribunales Superiores</span>
            <span>• Superintendencias</span>
            <span>• Ministerio Público</span>
          </div>
        </div>
      </div>
    </div>
  )
}