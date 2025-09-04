import { 
  FileText, 
  Clock, 
  CheckCircle, 
  Edit3, 
  TrendingUp,
  Users,
  Calendar,
  Download,
  Trash2,
  XCircle,
  ChevronDown
} from 'lucide-react'
import { useState } from 'react'
import { useCurationStore } from '../../stores/curationStore'
import { getEntityColors } from '../../constants/entityColors'
import { clsx } from 'clsx'

// Mock data
const stats = [
  {
    name: 'Pendientes',
    value: '42',
    change: '+12%',
    changeType: 'increase',
    icon: Clock,
    color: 'text-[#3ff3f2] bg-[#04315a]',
  },
  {
    name: 'Aprobados',
    value: '8',
    change: '-5%',
    changeType: 'decrease', 
    icon: Edit3,
    color: 'text-[#3ff3f2] bg-[#04315a]',
  },
  {
    name: 'Publicados',
    value: '23',
    change: '+18%',
    changeType: 'increase',
    icon: CheckCircle,
    color: 'text-[#3ff3f2] bg-[#04315a]',
  },
  {
    name: 'Total Artículos',
    value: '156',
    change: '+8%',
    changeType: 'increase',
    icon: FileText,
    color: 'text-[#3ff3f2] bg-[#04315a]',
  },
]

const recentActivity = [
  {
    id: '1',
    type: 'document_curated',
    title: 'Nuevo Real Decreto sobre contratos laborales',
    time: 'hace 2 horas',
    user: 'María González',
  },
  {
    id: '2', 
    type: 'article_published',
    title: 'Análisis: Cambios en la Ley de Sociedades',
    time: 'hace 4 horas',
    user: 'Carlos Ruiz',
  },
  {
    id: '3',
    type: 'ai_generation',
    title: 'IA generó contenido para artículo sobre GDPR',
    time: 'hace 6 horas',
    user: 'Sistema IA',
  },
]

// Ya no necesitamos esta definición local - usamos el sistema centralizado

export default function DashboardPage() {
  const [showRejectedModal, setShowRejectedModal] = useState(false)
  const [timeFilter, setTimeFilter] = useState('mes')
  const { rejectedDocuments, undoRejection } = useCurationStore()
  return (
    <div className="p-3 pr-4 md:p-5 md:pr-6 lg:p-6 lg:pr-8 space-y-5 md:space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0">
        <div className="min-w-0">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base">Resumen del sistema editorial</p>
        </div>
        <div className="flex items-center space-x-3 md:space-x-4">
          {/* Time Filter */}
          <div className="relative">
            <select 
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 pr-8 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#04315a] focus:border-[#04315a] cursor-pointer"
            >
              <option value="dia">Día</option>
              <option value="semana">Semana</option>
              <option value="mes">Mes</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
          <div className="flex items-center space-x-3 text-xs md:text-sm text-gray-500 dark:text-gray-400 flex-shrink-0">
            <Calendar className="w-4 h-4 flex-shrink-0" />
            <span className="hidden lg:inline">{new Date().toLocaleDateString('es-ES', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</span>
            <span className="lg:hidden">{new Date().toLocaleDateString('es-ES', { 
              day: '2-digit', 
              month: '2-digit', 
              year: 'numeric' 
            })}</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-5">
        {stats.map((stat) => (
          <div key={stat.name} className="card dark:bg-gray-800">
            <div className="card-body">
              <div className="flex items-center">
                <div className={`p-2 rounded-lg flex-shrink-0 ${stat.color}`}>
                  <stat.icon className="w-5 h-5 lg:w-6 lg:h-6" />
                </div>
                <div className="ml-3 lg:ml-4 flex-1 min-w-0">
                  <p className="text-xs lg:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">{stat.name}</p>
                  <div className="flex items-baseline">
                    <p className="text-xl lg:text-2xl font-semibold text-gray-900 dark:text-gray-100">{stat.value}</p>
                    <p className={`ml-2 text-xs lg:text-sm font-medium flex-shrink-0 ${
                      stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {stat.change}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4 lg:gap-5">
        {/* Recent Activity */}
        <div className="card dark:bg-gray-800">
          <div className="card-header">
            <h3 className="text-base lg:text-lg font-medium text-gray-900 dark:text-gray-100">Actividad Reciente</h3>
          </div>
          <div className="card-body">
            <div className="space-y-3 lg:space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-2 h-2 bg-primary-500 rounded-full mt-2"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs lg:text-sm font-medium text-gray-900 dark:text-gray-100 truncate leading-tight">
                      {activity.title}
                    </p>
                    <p className="text-xs lg:text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {activity.user} • {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card dark:bg-gray-800">
          <div className="card-header">
            <h3 className="text-base lg:text-lg font-medium text-gray-900 dark:text-gray-100">Acciones Rápidas</h3>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-2 md:gap-3 lg:gap-4">
              <button className="border border-gray-300 dark:border-gray-600 rounded-lg flex flex-col items-center p-3 lg:p-4 h-auto min-h-[80px] lg:min-h-[100px] bg-white dark:bg-gray-700 hover:bg-[#04315a] hover:text-[#3ff3f2] hover:border-[#04315a] transition-all duration-200 group">
                <Clock className="w-6 h-6 lg:w-8 lg:h-8 mb-2 text-[#04315a] dark:text-white group-hover:text-[#3ff3f2] flex-shrink-0" />
                <span className="text-xs lg:text-sm font-medium text-center leading-tight text-gray-900 dark:text-white group-hover:text-[#3ff3f2]">Revisar Documentos</span>
                <span className="text-xs text-gray-500 dark:text-white group-hover:text-[#3ff3f2] mt-1">42 pendientes</span>
              </button>
              
              <button className="border border-gray-300 dark:border-gray-600 rounded-lg flex flex-col items-center p-3 lg:p-4 h-auto min-h-[80px] lg:min-h-[100px] bg-white dark:bg-gray-700 hover:bg-[#04315a] hover:text-[#3ff3f2] hover:border-[#04315a] transition-all duration-200 group">
                <Edit3 className="w-6 h-6 lg:w-8 lg:h-8 mb-2 text-[#04315a] dark:text-white group-hover:text-[#3ff3f2] flex-shrink-0" />
                <span className="text-xs lg:text-sm font-medium text-center leading-tight text-gray-900 dark:text-white group-hover:text-[#3ff3f2]">Nuevo Artículo</span>
                <span className="text-xs text-gray-500 dark:text-white group-hover:text-[#3ff3f2] mt-1">Crear desde cero</span>
              </button>
              
              <button 
                onClick={() => {
                  console.log('Iniciando extracción manual de documentos...');
                  // TODO: Implementar lógica de extracción
                }}
                className="border border-gray-300 dark:border-gray-600 rounded-lg flex flex-col items-center p-3 lg:p-4 h-auto min-h-[80px] lg:min-h-[100px] bg-white dark:bg-gray-700 hover:bg-[#04315a] hover:text-[#3ff3f2] hover:border-[#04315a] transition-all duration-200 group"
              >
                <Download className="w-6 h-6 lg:w-8 lg:h-8 mb-2 text-[#04315a] dark:text-white group-hover:text-[#3ff3f2] flex-shrink-0" />
                <span className="text-xs lg:text-sm font-medium text-center leading-tight text-gray-900 dark:text-white group-hover:text-[#3ff3f2]">Extracción Documentos</span>
                <span className="text-xs text-gray-500 dark:text-white group-hover:text-[#3ff3f2] mt-1">Extracción manual</span>
              </button>
              
              <button className="border border-gray-300 dark:border-gray-600 rounded-lg flex flex-col items-center p-3 lg:p-4 h-auto min-h-[80px] lg:min-h-[100px] bg-white dark:bg-gray-700 hover:bg-[#04315a] hover:text-[#3ff3f2] hover:border-[#04315a] transition-all duration-200 group">
                <TrendingUp className="w-6 h-6 lg:w-8 lg:h-8 mb-2 text-[#04315a] dark:text-white group-hover:text-[#3ff3f2] flex-shrink-0" />
                <span className="text-xs lg:text-sm font-medium text-center leading-tight text-gray-900 dark:text-white group-hover:text-[#3ff3f2]">Ver Análisis</span>
                <span className="text-xs text-gray-500 dark:text-white group-hover:text-[#3ff3f2] mt-1">Métricas del mes</span>
              </button>
              
              <button className="border border-gray-300 dark:border-gray-600 rounded-lg flex flex-col items-center p-3 lg:p-4 h-auto min-h-[80px] lg:min-h-[100px] bg-white dark:bg-gray-700 hover:bg-[#04315a] hover:text-[#3ff3f2] hover:border-[#04315a] transition-all duration-200 group">
                <Users className="w-6 h-6 lg:w-8 lg:h-8 mb-2 text-[#04315a] dark:text-white group-hover:text-[#3ff3f2] flex-shrink-0" />
                <span className="text-xs lg:text-sm font-medium text-center leading-tight text-gray-900 dark:text-white group-hover:text-[#3ff3f2]">Configuración</span>
                <span className="text-xs text-gray-500 dark:text-white group-hover:text-[#3ff3f2] mt-1">Preferencias</span>
              </button>
              
              <button 
                onClick={() => setShowRejectedModal(true)}
                className="border border-gray-300 dark:border-gray-600 rounded-lg flex flex-col items-center p-3 lg:p-4 h-auto min-h-[80px] lg:min-h-[100px] bg-white dark:bg-gray-700 hover:bg-[#04315a] hover:text-[#3ff3f2] hover:border-[#04315a] transition-all duration-200 group"
              >
                <Trash2 className="w-6 h-6 lg:w-8 lg:h-8 mb-2 text-[#04315a] dark:text-white group-hover:text-[#3ff3f2] flex-shrink-0" />
                <span className="text-xs lg:text-sm font-medium text-center leading-tight text-gray-900 dark:text-white group-hover:text-[#3ff3f2]">Docs. Rechazados</span>
                <span className="text-xs text-gray-500 dark:text-white group-hover:text-[#3ff3f2] mt-1">{rejectedDocuments.length} documentos</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Chart Placeholder */}
      <div className="card dark:bg-gray-800">
        <div className="card-header">
          <h3 className="text-base lg:text-lg font-medium text-gray-900 dark:text-gray-100">Rendimiento Editorial</h3>
          <p className="text-xs lg:text-sm text-gray-500 dark:text-gray-400">Artículos publicados en los últimos 30 días</p>
        </div>
        <div className="card-body">
          <div className="h-48 md:h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-center px-4">
              <TrendingUp className="w-10 h-10 lg:w-12 lg:h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-sm lg:text-base text-gray-500 dark:text-gray-400">Gráfico de rendimiento</p>
              <p className="text-xs lg:text-sm text-gray-400 dark:text-gray-500">Próximamente con Chart.js</p>
            </div>
          </div>
        </div>
      </div>

      {/* Rejected Documents Modal */}
      {showRejectedModal && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowRejectedModal(false)} />
          <div className="fixed inset-0 overflow-hidden">
            <div className="flex items-center justify-center min-h-full p-2 md:p-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-xs sm:max-w-2xl lg:max-w-4xl max-h-[90vh] md:max-h-[80vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 lg:p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="p-2 bg-red-100 rounded-lg flex-shrink-0">
                      <Trash2 className="w-5 h-5 lg:w-6 lg:h-6 text-red-600" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-lg lg:text-xl font-semibold text-gray-900 dark:text-gray-100 truncate">Documentos Rechazados</h2>
                      <p className="text-xs lg:text-sm text-gray-600 dark:text-gray-400">{rejectedDocuments.length} documentos rechazados</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowRejectedModal(false)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-4 lg:p-6">
                  {rejectedDocuments.length > 0 ? (
                    <div className="space-y-4">
                      {rejectedDocuments.map((doc) => (
                        <div key={doc.id} className="border border-red-200 dark:border-red-800 rounded-lg p-4 bg-red-50 dark:bg-red-900/20">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">{doc.title}</h3>
                              <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                                <div><strong>ID:</strong> {doc.identifier}</div>
                                <div><strong>Fuente:</strong> {getEntityColors(doc.source).name}</div>
                                <div><strong>Área:</strong> {doc.area}</div>
                                <div><strong>Rechazado:</strong> {new Date(doc.rejectedAt!).toLocaleDateString('es-ES')}</div>
                              </div>
                              {doc.rejectedReason && (
                                <div className="text-sm text-gray-900 dark:text-gray-100">
                                  <strong>Motivo:</strong> {doc.rejectedReason}
                                </div>
                              )}
                            </div>
                            <button
                              onClick={() => {
                                if (window.confirm('¿Restaurar este documento a la lista de curación?')) {
                                  undoRejection(doc.id)
                                }
                              }}
                              className="ml-4 px-3 py-1 bg-blue-600 dark:bg-blue-700 text-white rounded hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors text-sm"
                            >
                              Restaurar
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Trash2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No hay documentos rechazados</h3>
                      <p className="text-gray-500 dark:text-gray-400">Los documentos rechazados aparecerán aquí</p>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="border-t border-gray-200 dark:border-gray-700 p-4 lg:p-6">
                  <button
                    onClick={() => setShowRejectedModal(false)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}