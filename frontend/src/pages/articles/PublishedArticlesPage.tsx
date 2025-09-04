import { useState } from 'react'
import { 
  Calendar,
  Building,
  Tag,
  Clock,
  ExternalLink,
  Search,
  Filter,
  ChevronDown,
  Eye,
  Grid3X3,
  List
} from 'lucide-react'
import { clsx } from 'clsx'
import { getAreaColors, getEntityColors } from '../../constants/entityColors'
import { useCurationStore } from '../../stores/curationStore'

const LEGAL_AREAS = ['Todos', 'Laboral', 'Constitucional', 'Civil', 'Penal', 'Tributario', 'Ambiental', 'Financiero', 'Administrativo']
const ENTITIES = ['Todas', 'Corte Constitucional', 'Corte Suprema de Justicia', 'Consejo de Estado', 'DIAN', 'Ministerio de Ambiente', 'Superintendencia Financiera']

export default function PublishedArticlesPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedArea, setSelectedArea] = useState('Todos')
  const [selectedEntity, setSelectedEntity] = useState('Todas')
  const [timeFilter, setTimeFilter] = useState('all') // all, day, week, month
  const [viewMode, setViewMode] = useState('grid') // grid, list
  const [sortBy, setSortBy] = useState('recent') // recent, views, area

  const { publishedDocuments } = useCurationStore()

  // Transformar publishedDocuments a formato que espera la vista
  const publishedArticles = publishedDocuments.map(doc => ({
    id: doc.id,
    title: doc.articleData?.title || `Análisis jurídico: ${doc.title}`,
    area: doc.area,
    entity: doc.source,
    publicationDate: doc.publicationDate,
    extractionDate: doc.extractionDate,
    publishedDate: doc.publishedAt || new Date().toISOString(),
    publishedTime: new Date(doc.publishedAt || new Date()).toTimeString().slice(0, 5),
    url: `#/article/${doc.id}`, // URL del artículo público
    views: Math.floor(Math.random() * 1000) + 50, // Mock de vistas por ahora
    description: doc.articleData?.metadata?.description || doc.summary || '',
    keywords: doc.articleData?.metadata?.keywords || [],
    image: doc.articleData?.image
  }))

  // Filtrar artículos
  const filteredArticles = publishedArticles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesArea = selectedArea === 'Todos' || article.area === selectedArea
    const matchesEntity = selectedEntity === 'Todas' || article.entity === selectedEntity
    
    // Filtro por tiempo
    let matchesTime = true
    if (timeFilter !== 'all') {
      const articleDate = new Date(article.publishedDate + ' ' + article.publishedTime)
      const now = new Date()
      
      switch (timeFilter) {
        case 'day':
          const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
          matchesTime = articleDate >= yesterday
          break
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          matchesTime = articleDate >= weekAgo
          break
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          matchesTime = articleDate >= monthAgo
          break
      }
    }
    
    return matchesSearch && matchesArea && matchesEntity && matchesTime
  })

  // Ordenar artículos
  const sortedArticles = [...filteredArticles].sort((a, b) => {
    switch (sortBy) {
      case 'views':
        return b.views - a.views
      case 'area':
        return a.area.localeCompare(b.area)
      default: // recent
        return new Date(b.publishedDate + ' ' + b.publishedTime).getTime() - 
               new Date(a.publishedDate + ' ' + a.publishedTime).getTime()
    }
  })

  return (
    <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Artículos publicados</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {sortedArticles.length} artículo{sortedArticles.length !== 1 ? 's' : ''} publicado{sortedArticles.length !== 1 ? 's' : ''}
          </p>
        </div>
        
        {/* Toggle de vista */}
        <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          <button
            onClick={() => setViewMode('grid')}
            className={clsx(
              'p-2 rounded-md transition-all duration-200',
              viewMode === 'grid'
                ? 'bg-white dark:bg-gray-600 text-[#04315a] dark:text-[#3ff3f2] shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            )}
            title="Vista en cuadrícula"
          >
            <Grid3X3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={clsx(
              'p-2 rounded-md transition-all duration-200',
              viewMode === 'list'
                ? 'bg-white dark:bg-gray-600 text-[#04315a] dark:text-[#3ff3f2] shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            )}
            title="Vista en lista"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Búsqueda */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar artículos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#04315a] focus:border-[#04315a] bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>

          {/* Filtro por tiempo */}
          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#04315a] focus:border-[#04315a] bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="all">Todos los tiempos</option>
            <option value="day">Últimas 24 horas</option>
            <option value="week">Última semana</option>
            <option value="month">Último mes</option>
          </select>

          {/* Área del derecho */}
          <select
            value={selectedArea}
            onChange={(e) => setSelectedArea(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#04315a] focus:border-[#04315a] bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            {LEGAL_AREAS.map(area => (
              <option key={area} value={area}>{area}</option>
            ))}
          </select>

          {/* Entidad */}
          <select
            value={selectedEntity}
            onChange={(e) => setSelectedEntity(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#04315a] focus:border-[#04315a] bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            {ENTITIES.map(entity => (
              <option key={entity} value={entity}>{entity}</option>
            ))}
          </select>

          {/* Ordenar por */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#04315a] focus:border-[#04315a] bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="recent">Más recientes</option>
            <option value="views">Más vistos</option>
            <option value="area">Por área</option>
          </select>
        </div>
      </div>

      {/* Contenido de artículos */}
      {viewMode === 'grid' ? (
        /* Vista en cuadrícula */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedArticles.map((article) => (
            <div
              key={article.id}
              className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-6 hover:shadow-lg transition-all duration-200 hover:border-[#04315a] group"
            >
              {/* Header de la tarjeta */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={clsx(
                    "px-2 py-1 rounded-full text-xs font-medium",
                    getAreaColors(article.area.toUpperCase()).bgColor,
                    getAreaColors(article.area.toUpperCase()).textColor,
                    getAreaColors(article.area.toUpperCase()).darkBgColor,
                    getAreaColors(article.area.toUpperCase()).darkTextColor
                  )}>
                    {getAreaColors(article.area.toUpperCase()).name}
                  </span>
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300">
                    {article.entity}
                  </span>
                </div>
                <div className="flex items-center space-x-1 text-gray-500 dark:text-gray-400">
                  <Eye className="w-4 h-4" />
                  <span className="text-sm">{article.views.toLocaleString()}</span>
                </div>
              </div>

              {/* Título */}
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-lg leading-tight mb-4 group-hover:text-[#04315a] dark:group-hover:text-[#3ff3f2] transition-colors">
                {article.title}
              </h3>

              {/* Información de publicación */}
              <div className="space-y-3">
                <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <div>
                    <span>
                      <strong>Web Oficial:</strong> {new Date(article.publicationDate).toLocaleDateString('es-ES', {
                        year: '2-digit',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      })}
                    </span>
                  </div>
                  <div>
                    <span>
                      <strong>Extracción:</strong> {new Date(article.extractionDate).toLocaleDateString('es-ES', {
                        year: '2-digit',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      })}
                    </span>
                  </div>
                  <div>
                    <span>
                      <strong>Publicado:</strong> {new Date(article.publishedDate).toLocaleDateString('es-ES', {
                        year: '2-digit',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Botón de ver artículo */}
              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => window.open(article.url, '_blank')}
                  className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-[#04315a] hover:text-[#3ff3f2] rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 text-sm font-medium"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Ver artículo</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Vista en lista */
        <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 divide-y dark:divide-gray-700">
          {sortedArticles.map((article) => (
            <div
              key={article.id}
              className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  {/* Header con etiquetas */}
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className={clsx(
                      "px-2 py-1 rounded-full text-xs font-medium",
                      getAreaColors(article.area.toUpperCase()).bgColor,
                      getAreaColors(article.area.toUpperCase()).textColor,
                      getAreaColors(article.area.toUpperCase()).darkBgColor,
                      getAreaColors(article.area.toUpperCase()).darkTextColor
                    )}>
                      {getAreaColors(article.area.toUpperCase()).name}
                    </span>
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300">
                      {article.entity}
                    </span>
                  </div>
                  
                  {/* Título */}
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-xl leading-tight mb-3 hover:text-[#04315a] dark:hover:text-[#3ff3f2] transition-colors">
                    {article.title}
                  </h3>
                  
                  {/* Información */}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <div>
                      <span>
                        <strong>Web Oficial:</strong> {new Date(article.publicationDate).toLocaleDateString('es-ES', {
                          year: '2-digit',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true
                        })}
                      </span>
                    </div>
                    <div>
                      <span><strong>Extracción:</strong> {new Date(article.extractionDate).toLocaleDateString('es-ES', {
                        year: '2-digit',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      })}</span>
                    </div>
                    <div>
                      <span><strong>Publicado:</strong> {new Date(article.publishedDate).toLocaleDateString('es-ES', {
                        year: '2-digit',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      })}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Eye className="w-4 h-4" />
                      <span>{article.views.toLocaleString()} vistas</span>
                    </div>
                  </div>
                </div>
                
                {/* Botón de acción */}
                <div className="ml-4 flex-shrink-0">
                  <button
                    onClick={() => window.open(article.url, '_blank')}
                    className="px-4 py-2 bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-[#04315a] hover:text-[#3ff3f2] rounded-lg transition-all duration-200 flex items-center space-x-2 text-sm font-medium"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Ver artículo</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Estado vacío */}
      {sortedArticles.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 dark:text-gray-500 mb-4">
            <Search className="w-12 h-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No se encontraron artículos
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Intenta ajustar los filtros de búsqueda
          </p>
        </div>
      )}
    </div>
  )
}