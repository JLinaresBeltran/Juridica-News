import React, { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { JudicialEntity, getTopEntitiesByActivity } from '@/data/judicialEntities'

interface JudicialEntitiesTimelineProps {
  className?: string
}

const getBrandStyles = () => {
  return {
    line: { borderColor: '#04315a' },
    bg: { backgroundColor: '#04315a0a' }, // 04315a con transparencia
    text: { color: '#04315a' },
    accent: { color: '#40f3f2' }
  }
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('es-CO', { 
    day: 'numeric',
    month: 'long'
  })
}

export const JudicialEntitiesTimeline: React.FC<JudicialEntitiesTimelineProps> = ({ 
  className = '' 
}) => {
  const [selectedEntity, setSelectedEntity] = useState<JudicialEntity | null>(null)
  const topEntities = getTopEntitiesByActivity(6) // 6 entidades principales

  const handleEntityClick = (entity: JudicialEntity) => {
    setSelectedEntity(selectedEntity?.id === entity.id ? null : entity)
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-100 p-6 ${className}`}>
      <div className="space-y-0">
        {topEntities.map((entity, index) => {
          const brandStyles = getBrandStyles()
          const isSelected = selectedEntity?.id === entity.id
          const isLast = index === topEntities.length - 1
          
          return (
            <div key={entity.id}>
              {/* Item de la entidad */}
              <div 
                onClick={() => handleEntityClick(entity)}
                className="flex cursor-pointer group hover:bg-gray-50 -mx-2 px-2 py-3 rounded transition-colors"
              >
                {/* Línea vertical con colores de marca */}
                <div className="flex flex-col items-center mr-4">
                  <div className="w-1 h-12 border-l-4 rounded" style={brandStyles.line}></div>
                </div>
                
                {/* Contenido de la entidad */}
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-base font-semibold group-hover:font-bold transition-all" style={{ color: '#04315a' }}>
                        {entity.name}
                      </h4>
                      <p className="text-sm text-gray-600 mt-0.5">
                        Última publicación {formatDate(entity.lastUpdate)}
                      </p>
                    </div>
                    
                    {/* Chevron indicador */}
                    <div className="flex items-center">
                      {isSelected ? (
                        <ChevronDown className="w-4 h-4" style={{ color: '#04315a' }} />
                      ) : (
                        <ChevronRight className="w-4 h-4" style={{ color: '#04315a' }} />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Panel expandible de noticias */}
              {isSelected && (
                <div className="ml-6 mb-4">
                  <div className="border-l-4 pl-4 py-3 rounded-r" style={{ ...brandStyles.bg, ...brandStyles.line }}>
                    <h5 className="font-medium mb-2" style={brandStyles.text}>
                      Noticias recientes
                    </h5>
                    
                    <div className="space-y-2">
                      {entity.articles.slice(0, 3).map((article) => (
                        <div
                          key={article.id}
                          onClick={(e) => {
                            e.stopPropagation()
                            console.log('Navegar a artículo:', article.id)
                          }}
                          className="bg-white p-3 rounded border hover:shadow-sm cursor-pointer transition-all"
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs text-gray-500">
                              {formatDate(article.date)}
                            </span>
                            <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                              article.priority === 'alta' ? 'bg-red-100 text-red-700' :
                              article.priority === 'media' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {article.priority}
                            </span>
                          </div>
                          <h6 className="font-medium text-sm mb-1" style={{ color: '#04315a' }}>
                            {article.title}
                          </h6>
                          <p className="text-xs text-gray-600 line-clamp-2">
                            {article.excerpt}
                          </p>
                        </div>
                      ))}
                    </div>
                    
                    <button 
                      className="text-xs hover:underline font-medium mt-2"
                      style={brandStyles.text}
                      onClick={(e) => {
                        e.stopPropagation()
                        console.log('Ver todas las noticias de:', entity.name)
                      }}
                    >
                      Ver todas las noticias ({entity.articleCount}) →
                    </button>
                  </div>
                </div>
              )}

              {/* Línea separadora (excepto para el último item) */}
              {!isLast && !isSelected && (
                <div className="ml-6 border-b border-gray-200 my-0"></div>
              )}
            </div>
          )
        })}
      </div>
      
    </div>
  )
}