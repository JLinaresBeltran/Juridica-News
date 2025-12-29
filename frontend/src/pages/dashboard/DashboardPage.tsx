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
  X,
  ChevronDown,
  Loader2,
  AlertCircle,
  CheckCheck,
  RotateCcw,
  ShieldAlert,
  AlertTriangle
} from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { useCurationStore } from '../../stores/curationStore'
import { getEntityColors } from '../../constants/entityColors'
import { clsx } from 'clsx'
import scrapingService, { type ExtractionResult } from '../../services/scrapingService'
import adminService, { type SystemResetResponse, type SystemInfo } from '../../services/adminService' // FUNCIÓN TEMPORAL
import documentsService, { type DocumentStatsResponse } from '../../services/documentsService' // FUNCIÓN TEMPORAL
import { useEventStore } from '../../stores/eventStore'
import { toast } from 'react-hot-toast'
import ScrapingProgressModal from '../../components/scraping/ScrapingProgressModal'
import { useScrapingProgress } from '../../hooks/useScrapingProgress'

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
  const [isExtracting, setIsExtracting] = useState(false)
  const [extractionResult, setExtractionResult] = useState<ExtractionResult | null>(null)
  const [showExtractionModal, setShowExtractionModal] = useState(false)
  const [showProgressModal, setShowProgressModal] = useState(false)
  // FUNCIÓN TEMPORAL - Estados para modal de reset del sistema
  const [showResetModal, setShowResetModal] = useState(false)
  const [resetConfirmation, setResetConfirmation] = useState('')
  const [resetReason, setResetReason] = useState('')
  const [isResetting, setIsResetting] = useState(false)
  const [resetResult, setResetResult] = useState<SystemResetResponse | null>(null)
  
  // Estado para estadísticas dinámicas (FUNCIÓN TEMPORAL)
  const [systemStats, setSystemStats] = useState<SystemInfo | null>(null)
  const [documentStats, setDocumentStats] = useState<DocumentStatsResponse['data'] | null>(null)
  const [, setIsLoadingStats] = useState(false)

  // Refs para control de requests y prevención de bucles infinitos
  const isLoadingRef = useRef(false)
  const abortControllerRef = useRef<AbortController | null>(null)
  const lastLoadTimeRef = useRef<number>(0)
  const isMountedRef = useRef(true)

  const { rejectedDocuments, undoRejection, resetSystemCompletely } = useCurationStore()
  const emit = useEventStore(state => state.emit)
  const { clearProgress } = useScrapingProgress()

  // FUNCIÓN TEMPORAL - Cargar estadísticas del sistema
  const loadSystemStats = async () => {
    // Protección 1: Verificar si ya hay una carga en progreso
    if (isLoadingRef.current) {
      return
    }

    // Protección 2: Throttling - mínimo 2 segundos entre cargas
    const now = Date.now()
    const timeSinceLastLoad = now - lastLoadTimeRef.current
    const MIN_INTERVAL = 2000 // 2 segundos

    if (timeSinceLastLoad < MIN_INTERVAL) {
      return
    }

    try {
      // Marcar como cargando
      isLoadingRef.current = true
      lastLoadTimeRef.current = now
      setIsLoadingStats(true)

      // Cancelar request anterior si existe
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      // Crear nuevo AbortController
      const abortController = new AbortController()
      abortControllerRef.current = abortController

      // Cargar ambas estadísticas en paralelo con señal de cancelación
      const [systemResponse, documentResponse] = await Promise.all([
        adminService.getSystemInfo(abortController.signal).catch((error) => {
          if (error.name !== 'CanceledError' && error.code !== 'ERR_CANCELED') {
            console.error('Failed to load system info:', error)
          }
          return null
        }),
        documentsService.getDocumentStats(abortController.signal).catch((error) => {
          if (error.name !== 'CanceledError' && error.code !== 'ERR_CANCELED') {
            console.error('Failed to load document stats:', error)
          }
          return null
        })
      ])

      // Protección 3: Solo actualizar state si el componente está montado
      if (!isMountedRef.current) {
        return
      }

      if (systemResponse) {
        setSystemStats(systemResponse.data)
      } else {
        // Valores por defecto para system stats
        setSystemStats({
          documents: 0,
          articles: 0,
          articleVersions: 0,
          mediaAssets: 0,
          auditLogs: 0,
          extractions: 0,
          users: 1,
          timestamp: new Date().toISOString(),
          environment: 'development',
          resetAvailable: true
        })
      }

      if (documentResponse) {
        setDocumentStats(documentResponse.data)
      } else {
        // Valores por defecto para document stats
        setDocumentStats({
          pending: 0,
          approved: 0,
          rejected: 0,
          processing: 0,
          total: 0,
          recentlyScraped: 0
        })
      }
    } catch (error: any) {
      // Solo loggear si no fue cancelación
      if (error.name !== 'CanceledError' && error.code !== 'ERR_CANCELED') {
        console.error('Error loading system stats:', error)
      }
    } finally {
      isLoadingRef.current = false
      if (isMountedRef.current) {
        setIsLoadingStats(false)
      }
    }
  }

  // FUNCIÓN TEMPORAL - Cargar estadísticas al montar el componente
  useEffect(() => {
    // Marcar componente como montado
    isMountedRef.current = true

    loadSystemStats()

    // Cleanup: cancelar requests pendientes al desmontar
    return () => {
      isMountedRef.current = false

      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
        abortControllerRef.current = null
      }
    }
  }, [])

  // FUNCIÓN TEMPORAL - Generar estadísticas dinámicas basadas en datos reales
  const generateDynamicStats = () => {
    if (!documentStats || !systemStats) {
      // Datos mock mientras carga
      return [
        {
          name: 'Pendientes',
          value: '...',
          change: '0%',
          changeType: 'neutral' as const,
          icon: Clock,
          color: 'text-[#3ff3f2] bg-[#04315a]',
        },
        {
          name: 'Aprobados',
          value: '...',
          change: '0%',
          changeType: 'neutral' as const,
          icon: Edit3,
          color: 'text-[#3ff3f2] bg-[#04315a]',
        },
        {
          name: 'Publicados',
          value: '...',
          change: '0%',
          changeType: 'neutral' as const,
          icon: CheckCircle,
          color: 'text-[#3ff3f2] bg-[#04315a]',
        },
        {
          name: 'Total Artículos',
          value: '...',
          change: '0%',
          changeType: 'neutral' as const,
          icon: FileText,
          color: 'text-[#3ff3f2] bg-[#04315a]',
        },
      ]
    }

    // FUNCIÓN TEMPORAL - Usar datos reales de documentos y sistema
    return [
      {
        name: 'Pendientes',
        value: String(documentStats.pending),
        change: documentStats.pending > 0 ? '+100%' : '0%',
        changeType: documentStats.pending > 0 ? 'increase' : 'neutral',
        icon: Clock,
        color: 'text-[#3ff3f2] bg-[#04315a]',
      },
      {
        name: 'Aprobados',
        value: String(documentStats.approved),
        change: documentStats.approved > 0 ? '+100%' : '0%',
        changeType: documentStats.approved > 0 ? 'increase' : 'neutral',
        icon: Edit3,
        color: 'text-[#3ff3f2] bg-[#04315a]',
      },
      {
        name: 'Publicados',
        value: String(systemStats.articles),
        change: systemStats.articles > 0 ? '+100%' : '0%',
        changeType: systemStats.articles > 0 ? 'increase' : 'neutral',
        icon: CheckCircle,
        color: 'text-[#3ff3f2] bg-[#04315a]',
      },
      {
        name: 'Total Artículos',
        value: String(systemStats.articles + systemStats.articleVersions),
        change: (systemStats.articles + systemStats.articleVersions) > 0 ? '+100%' : '0%',
        changeType: (systemStats.articles + systemStats.articleVersions) > 0 ? 'increase' : 'neutral',
        icon: FileText,
        color: 'text-[#3ff3f2] bg-[#04315a]',
      },
    ]
  }

  const handleStartExtraction = async () => {
    try {
      setIsExtracting(true)
      setShowProgressModal(true) // Mostrar modal de progreso inmediatamente
      clearProgress() // Limpiar progreso anterior

      const result = await scrapingService.extractCorteConstitucional(20, true) // Extraer hasta 20 documentos (todas las de HOY y AYER)
      
      // Validar respuesta antes de mostrar modal
      if (!result) {
        throw new Error('No se recibió respuesta del servicio de extracción')
      }
      
      // Validar estructura de datos básica
      if (typeof result !== 'object') {
        throw new Error('Formato de respuesta inválido: respuesta debe ser un objeto')
      }
      
      // Normalizar la respuesta para asegurar que tenga la estructura esperada
      const normalizedResult: ExtractionResult = {
        success: result.success !== false,
        message: result.message || '',
        data: {
          jobId: result.data?.jobId || '',
          documents: Array.isArray(result.data?.documents) ? result.data.documents : [],
          totalFound: result.data?.totalFound || 0,
          extractionTime: result.data?.extractionTime || 0,
          downloadedCount: result.data?.downloadedCount || 0
        }
      }
      
      setExtractionResult(normalizedResult)
      setShowExtractionModal(true)
      
      // ACTUALIZACIÓN: Emitir eventos y recargar estadísticas después de la extracción
      if (normalizedResult.success) {
        // Emitir evento de extracción completada para notificar a todos los componentes
        emit('DOCUMENTS_EXTRACTED', {
          source: 'dashboard',
          details: {
            totalFound: normalizedResult.data.totalFound,
            documentsProcessed: normalizedResult.data.documents.length,
            downloadedCount: normalizedResult.data.downloadedCount,
            extractionTime: normalizedResult.data.extractionTime
          }
        })
        
        // Si se procesaron documentos, recargar estadísticas locales
        if (normalizedResult.data.documents.length > 0) {
          await loadSystemStats() // Recargar las estadísticas para reflejar los nuevos documentos
        }
      }
      
      // El modal de progreso ya muestra el resultado, no necesitamos notificaciones toast adicionales
    } catch (error: any) {
      console.error('Error during extraction:', error)
      
      // Crear resultado de error para mostrar en el modal
      const errorResult: ExtractionResult = {
        success: false,
        documents: [],
        downloadedCount: 0,
        extractionTime: 0,
        totalFound: 0
      }
      
      setExtractionResult(errorResult)
      setShowExtractionModal(true)

      // El modal de progreso ya muestra el error, no necesitamos notificación toast adicional
    } finally {
      setIsExtracting(false)
      // Don't close progress modal here - let it handle completion automatically
    }
  }

  const handleProgressComplete = (success: boolean) => {
    setShowProgressModal(false)
    setIsExtracting(false)
    
    if (success) {
      // Reload stats after successful extraction
      loadSystemStats()
    }
  }

  // FUNCIÓN TEMPORAL - Manejar reset del sistema
  const handleSystemReset = async () => {
    if (resetConfirmation !== 'RESET' || resetReason.length < 10) {
      toast.error('Debes escribir "RESET" y proporcionar una razón válida')
      return
    }

    try {
      setIsResetting(true)
      toast.loading('Reseteando sistema...', { id: 'system-reset' })

      const result = await adminService.resetSystem({
        confirmation: 'RESET',
        reason: resetReason
      })

      // Limpiar stores locales
      resetSystemCompletely()

      setResetResult(result)
      toast.success('Sistema reseteado exitosamente', { id: 'system-reset' })
      
      // FUNCIÓN TEMPORAL - Recargar estadísticas después del reset
      await loadSystemStats()
      
      // Resetear form
      setResetConfirmation('')
      setResetReason('')

    } catch (error: any) {
      console.error('Error during system reset:', error)
      toast.error(error.message || 'Error durante el reset del sistema', { id: 'system-reset' })
    } finally {
      setIsResetting(false)
    }
  }

  // FUNCIÓN TEMPORAL - Resetear modal de reset
  const resetResetModal = () => {
    setShowResetModal(false)
    setResetConfirmation('')
    setResetReason('')
    setResetResult(null)
    setIsResetting(false)
  }
  const renderMainContent = () => {
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
        {generateDynamicStats().map((stat) => (
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
                      stat.changeType === 'increase' ? 'text-green-600' : 
                      stat.changeType === 'decrease' ? 'text-red-600' : 
                      'text-gray-500'
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
                <span className="text-xs text-gray-500 dark:text-white group-hover:text-[#3ff3f2] mt-1">{documentStats?.pending || 0} pendientes</span>
              </button>
              
              <button className="border border-gray-300 dark:border-gray-600 rounded-lg flex flex-col items-center p-3 lg:p-4 h-auto min-h-[80px] lg:min-h-[100px] bg-white dark:bg-gray-700 hover:bg-[#04315a] hover:text-[#3ff3f2] hover:border-[#04315a] transition-all duration-200 group">
                <Edit3 className="w-6 h-6 lg:w-8 lg:h-8 mb-2 text-[#04315a] dark:text-white group-hover:text-[#3ff3f2] flex-shrink-0" />
                <span className="text-xs lg:text-sm font-medium text-center leading-tight text-gray-900 dark:text-white group-hover:text-[#3ff3f2]">Nuevo Artículo</span>
                <span className="text-xs text-gray-500 dark:text-white group-hover:text-[#3ff3f2] mt-1">Crear desde cero</span>
              </button>
              
              <button 
                onClick={handleStartExtraction}
                disabled={isExtracting}
                className={clsx(
                  "border rounded-lg flex flex-col items-center p-3 lg:p-4 h-auto min-h-[80px] lg:min-h-[100px] transition-all duration-200 group",
                  {
                    "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 hover:bg-[#04315a] hover:text-[#3ff3f2] hover:border-[#04315a]": !isExtracting,
                    "border-blue-300 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/20 cursor-not-allowed": isExtracting
                  }
                )}
              >
                {isExtracting ? (
                  <Loader2 className="w-6 h-6 lg:w-8 lg:h-8 mb-2 text-blue-600 dark:text-blue-400 animate-spin flex-shrink-0" />
                ) : (
                  <Download className="w-6 h-6 lg:w-8 lg:h-8 mb-2 text-[#04315a] dark:text-white group-hover:text-[#3ff3f2] flex-shrink-0" />
                )}
                <span className={clsx(
                  "text-xs lg:text-sm font-medium text-center leading-tight",
                  {
                    "text-gray-900 dark:text-white group-hover:text-[#3ff3f2]": !isExtracting,
                    "text-blue-600 dark:text-blue-400": isExtracting
                  }
                )}>
                  {isExtracting ? 'Extrayendo...' : 'Extracción Documentos'}
                </span>
                <span className={clsx(
                  "text-xs mt-1",
                  {
                    "text-gray-500 dark:text-white group-hover:text-[#3ff3f2]": !isExtracting,
                    "text-blue-500 dark:text-blue-300": isExtracting
                  }
                )}>
                  {isExtracting ? 'Corte Constitucional' : 'Extracción manual'}
                </span>
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

              {/* FUNCIÓN TEMPORAL - Botón Reset del Sistema */}
              <button 
                onClick={() => setShowResetModal(true)}
                className="border border-red-300 dark:border-red-600 rounded-lg flex flex-col items-center p-3 lg:p-4 h-auto min-h-[80px] lg:min-h-[100px] bg-red-50 dark:bg-red-900/20 hover:bg-red-600 hover:text-white hover:border-red-600 transition-all duration-200 group"
              >
                <RotateCcw className="w-6 h-6 lg:w-8 lg:h-8 mb-2 text-red-600 dark:text-red-400 group-hover:text-white flex-shrink-0" />
                <span className="text-xs lg:text-sm font-medium text-center leading-tight text-red-800 dark:text-red-300 group-hover:text-white">Reset Sistema</span>
                <span className="text-xs text-red-600 dark:text-red-400 group-hover:text-white mt-1">TEMPORAL</span>
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
      </div>
    )
  }

  return (
    <div>
      {renderMainContent()}
      
      {/* Rejected Documents Modal - Properly placed outside renderMainContent */}
      {showRejectedModal && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowRejectedModal(false)} />
          <div className="fixed inset-0 overflow-hidden">
            <div className="flex items-center justify-center min-h-full p-2 md:p-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-xs sm:max-w-md lg:max-w-lg max-h-[90vh] md:max-h-[80vh] flex flex-col">
                {/* Modal content */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <XCircle className="w-5 h-5 text-red-500" />
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        Documentos Rechazados
                      </h2>
                    </div>
                    <button
                      onClick={() => setShowRejectedModal(false)}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="text-center py-8">
                    <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                      En Desarrollo
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">
                      La funcionalidad para ver documentos rechazados está en desarrollo.
                    </p>
                  </div>
                </div>
                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => setShowRejectedModal(false)}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      Cerrar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* FUNCIÓN TEMPORAL - Modal de Reset del Sistema */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={resetResetModal} />
          <div className="fixed inset-0 overflow-hidden">
            <div className="flex items-center justify-center min-h-full p-2 md:p-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-xs sm:max-w-md lg:max-w-lg max-h-[90vh] md:max-h-[80vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 lg:p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="p-2 bg-red-100 rounded-lg flex-shrink-0">
                      <ShieldAlert className="w-5 h-5 lg:w-6 lg:h-6 text-red-600" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-lg lg:text-xl font-semibold text-gray-900 dark:text-gray-100 truncate">Reset del Sistema</h2>
                      <p className="text-xs lg:text-sm text-red-600 dark:text-red-400 font-medium">⚠️ FUNCIÓN TEMPORAL</p>
                    </div>
                  </div>
                  <button
                    onClick={resetResetModal}
                    disabled={isResetting}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0 disabled:opacity-50"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-4 lg:p-6">
                  {resetResult ? (
                    /* Resultado del reset */
                    <div className="space-y-4">
                      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                        <div className="flex items-center mb-3">
                          <CheckCheck className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" />
                          <h3 className="font-medium text-green-800 dark:text-green-300">Sistema reseteado exitosamente</h3>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="bg-white dark:bg-gray-800 p-2 rounded">
                            <div className="font-medium text-blue-600 dark:text-blue-400">{resetResult.statistics.documentsDeleted}</div>
                            <div className="text-gray-600 dark:text-gray-400 text-xs">Documentos</div>
                          </div>
                          <div className="bg-white dark:bg-gray-800 p-2 rounded">
                            <div className="font-medium text-green-600 dark:text-green-400">{resetResult.statistics.articlesDeleted}</div>
                            <div className="text-gray-600 dark:text-gray-400 text-xs">Artículos</div>
                          </div>
                          <div className="bg-white dark:bg-gray-800 p-2 rounded">
                            <div className="font-medium text-purple-600 dark:text-purple-400">{resetResult.statistics.auditLogsDeleted}</div>
                            <div className="text-gray-600 dark:text-gray-400 text-xs">Logs</div>
                          </div>
                          <div className="bg-white dark:bg-gray-800 p-2 rounded">
                            <div className="font-medium text-orange-600 dark:text-orange-400">{resetResult.executionTime}</div>
                            <div className="text-gray-600 dark:text-gray-400 text-xs">Tiempo</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Formulario de confirmación */
                    <div className="space-y-4">
                      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                        <div className="flex items-start space-x-3">
                          <ShieldAlert className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <h3 className="font-medium text-red-800 dark:text-red-300 mb-2">¡ADVERTENCIA!</h3>
                            <p className="text-sm text-red-700 dark:text-red-300">
                              Esta acción eliminará <strong>permanentemente</strong>:
                            </p>
                            <ul className="text-sm text-red-700 dark:text-red-300 mt-2 space-y-1 ml-4">
                              <li>• Todos los documentos</li>
                              <li>• Todos los artículos y versiones</li>
                              <li>• Assets multimedia</li>
                              <li>• Logs de auditoría</li>
                              <li>• Historial de extracciones</li>
                            </ul>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Razón del reset (mínimo 10 caracteres)
                          </label>
                          <textarea
                            value={resetReason}
                            onChange={(e) => setResetReason(e.target.value)}
                            disabled={isResetting}
                            placeholder="Ej: Limpieza para testing con datos reales"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-none disabled:opacity-50"
                            rows={3}
                          />
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {resetReason.length}/500 caracteres
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Escribe "RESET" para confirmar
                          </label>
                          <input
                            type="text"
                            value={resetConfirmation}
                            onChange={(e) => setResetConfirmation(e.target.value)}
                            disabled={isResetting}
                            placeholder="RESET"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:opacity-50"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="border-t border-gray-200 dark:border-gray-700 p-4 lg:p-6">
                  {resetResult ? (
                    <button
                      onClick={resetResetModal}
                      className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Cerrar
                    </button>
                  ) : (
                    <div className="flex space-x-3">
                      <button
                        onClick={resetResetModal}
                        disabled={isResetting}
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleSystemReset}
                        disabled={isResetting || resetConfirmation !== 'RESET' || resetReason.length < 10}
                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {isResetting ? (
                          <span className="flex items-center justify-center">
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            Reseteando...
                          </span>
                        ) : (
                          'Resetear Sistema'
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Extraction Results Modal */}
      {showExtractionModal && extractionResult && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowExtractionModal(false)} />
          <div className="fixed inset-0 overflow-hidden">
            <div className="flex items-center justify-center min-h-full p-2 md:p-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-xs sm:max-w-md lg:max-w-2xl max-h-[90vh] md:max-h-[80vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 lg:p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className={`p-2 rounded-lg flex-shrink-0 ${extractionResult?.success ? 'bg-green-100' : 'bg-red-100'}`}>
                      {extractionResult?.success ? (
                        <CheckCircle className="w-5 h-5 lg:w-6 lg:h-6 text-green-600" />
                      ) : (
                        <AlertCircle className="w-5 h-5 lg:w-6 lg:h-6 text-red-600" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-lg lg:text-xl font-semibold text-gray-900 dark:text-gray-100 truncate">
                        Resultados de Extracción
                      </h2>
                      <p className="text-xs lg:text-sm text-gray-500 dark:text-gray-400">
                        Corte Constitucional de Colombia
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowExtractionModal(false)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0"
                  >
                    <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-4 lg:p-6">
                  {/* Summary Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-center">
                      <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                        {extractionResult?.data?.totalFound || 0}
                      </div>
                      <div className="text-xs text-blue-700 dark:text-blue-300">Encontrados</div>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg text-center">
                      <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                        {extractionResult?.data?.downloadedCount || 0}
                      </div>
                      <div className="text-xs text-green-700 dark:text-green-300">Descargados</div>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg text-center">
                      <div className="text-lg font-semibold text-purple-600 dark:text-purple-400">
                        {extractionResult?.data?.extractionTime || 0}s
                      </div>
                      <div className="text-xs text-purple-700 dark:text-purple-300">Tiempo</div>
                    </div>
                    <div className={`p-3 rounded-lg text-center ${extractionResult?.success 
                      ? 'bg-green-50 dark:bg-green-900/20' 
                      : 'bg-red-50 dark:bg-red-900/20'}`}>
                      <div className={`text-lg font-semibold ${extractionResult?.success 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-red-600 dark:text-red-400'}`}>
                        {extractionResult?.success ? 'OK' : 'ERROR'}
                      </div>
                      <div className={`text-xs ${extractionResult?.success 
                        ? 'text-green-700 dark:text-green-300' 
                        : 'text-red-700 dark:text-red-300'}`}>
                        Estado
                      </div>
                    </div>
                  </div>

                  {/* Documents List */}
                  {extractionResult?.data?.documents && extractionResult.data.documents.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="font-medium text-gray-900 dark:text-gray-100">
                        Documentos Extraídos ({extractionResult?.data?.documents?.length || 0})
                      </h3>
                      <div className="max-h-64 overflow-y-auto space-y-2">
                        {extractionResult?.data?.documents?.map((doc: any, index: number) => (
                          <div key={doc.document_id || index} className="border border-gray-200 dark:border-gray-600 rounded-lg p-3 bg-gray-50 dark:bg-gray-700">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                  {doc.title || 'Sin título'}
                                </h4>
                                <div className="flex items-center space-x-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
                                  <span>{doc.document_type || 'Documento'}</span>
                                  <span>•</span>
                                  <span>{doc.date || 'Sin fecha'}</span>
                                  {doc.magistrate && (
                                    <>
                                      <span>•</span>
                                      <span>{doc.magistrate}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center space-x-1 ml-2">
                                {doc.pdf_url && (
                                  <div className="w-2 h-2 bg-red-500 rounded-full" title="PDF disponible" />
                                )}
                                {doc.html_url && (
                                  <div className="w-2 h-2 bg-blue-500 rounded-full" title="HTML disponible" />
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* No Documents Message */}
                  {(!extractionResult?.data?.documents || extractionResult.data.documents.length === 0) && (
                    <div className="text-center py-8">
                      <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                        No se encontraron documentos
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400">
                        {extractionResult?.success 
                          ? 'La extracción fue exitosa pero no se encontraron documentos nuevos.'
                          : 'Ocurrió un error durante la extracción de documentos.'
                        }
                      </p>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="border-t border-gray-200 dark:border-gray-700 p-4 lg:p-6">
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => setShowExtractionModal(false)}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      Cerrar
                    </button>
                    {extractionResult?.success && extractionResult?.data?.downloadedCount > 0 && (
                      <button
                        onClick={() => {
                          setShowExtractionModal(false)
                          // Optional: navigate to curation page
                        }}
                        className="px-4 py-2 bg-[#04315a] text-[#3ff3f2] rounded-lg hover:bg-[#052143] transition-colors"
                      >
                        Ver Documentos
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Scraping Progress Modal */}
      <ScrapingProgressModal
        isOpen={showProgressModal}
        onClose={() => setShowProgressModal(false)}
        onComplete={handleProgressComplete}
        isExtracting={isExtracting}
      />
    </div>
  )
}
