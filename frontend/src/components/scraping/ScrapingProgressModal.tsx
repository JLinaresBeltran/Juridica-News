import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { 
  X, 
  Loader2, 
  CheckCircle, 
  AlertCircle, 
  RotateCcw,
  Clock,
  FileText,
  Download
} from 'lucide-react'
import { useScrapingProgress, type ScrapingProgressEvent } from '../../hooks/useScrapingProgress'
import { clsx } from 'clsx'

interface ScrapingProgressModalProps {
  isOpen: boolean
  onClose: () => void
  onComplete?: (success: boolean) => void
}

const getProgressColor = (progress: number, status: string) => {
  if (status === 'error') return 'bg-red-500'
  if (status === 'completed') return 'bg-green-500'
  if (progress > 75) return 'bg-blue-500'
  if (progress > 50) return 'bg-yellow-500'
  return 'bg-gray-500'
}

const getStatusIcon = (status: string, retry?: boolean) => {
  if (retry) return <RotateCcw className="w-5 h-5 animate-spin" />
  
  switch (status) {
    case 'started':
    case 'processing':
      return <Loader2 className="w-5 h-5 animate-spin" />
    case 'completed':
      return <CheckCircle className="w-5 h-5 text-green-500" />
    case 'error':
      return <AlertCircle className="w-5 h-5 text-red-500" />
    default:
      return <Clock className="w-5 h-5" />
  }
}

export default function ScrapingProgressModal({
  isOpen,
  onClose,
  onComplete
}: ScrapingProgressModalProps) {
  const { currentProgress, isConnected, connectionError } = useScrapingProgress()

  // Auto-close modal after successful completion
  if (currentProgress?.status === 'completed' && onComplete) {
    setTimeout(() => {
      onComplete(true)
    }, 2000) // Wait 2 seconds to show completion message
  }

  // Handle error completion
  if (currentProgress?.status === 'error' && onComplete) {
    setTimeout(() => {
      onComplete(false)
    }, 3000) // Wait 3 seconds to show error message
  }

  const renderProgressContent = () => {
    if (!isConnected && !currentProgress) {
      return (
        <div className="text-center py-8">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500">Conectando con el servidor...</p>
          {connectionError && (
            <p className="text-red-500 text-sm mt-2">{connectionError}</p>
          )}
        </div>
      )
    }

    if (!currentProgress) {
      return (
        <div className="text-center py-8">
          <Clock className="w-8 h-8 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500">Iniciando proceso de extracción...</p>
        </div>
      )
    }

    const progress = currentProgress
    const progressPercentage = Math.min(100, Math.max(0, progress.progress))

    return (
      <div className="space-y-6">
        {/* Header with status */}
        <div className="flex items-center space-x-3">
          {getStatusIcon(progress.status, progress.retry)}
          <div className="flex-1">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              {progress.status === 'completed' ? 'Extracción Completada' :
               progress.status === 'error' ? 'Error en Extracción' :
               progress.retry ? 'Reintentando...' : 'Extrayendo Documentos'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {progress.source && `Fuente: ${progress.source}`}
              {progress.limit && ` (límite: ${progress.limit})`}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Progreso</span>
            <span className="text-gray-900 dark:text-gray-100">{progressPercentage.toFixed(0)}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className={clsx(
                'h-2 rounded-full transition-all duration-300',
                getProgressColor(progressPercentage, progress.status)
              )}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Status message */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {progress.message}
          </p>
          
          {progress.retry && progress.attempt && progress.maxRetries && (
            <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
              Intento {progress.attempt} de {progress.maxRetries}
              {progress.waitTime && ` - Reintentando en ${progress.waitTime}s`}
            </p>
          )}
        </div>

        {/* Statistics */}
        {(progress.documentsFound !== undefined || 
          progress.documentsProcessed !== undefined || 
          progress.downloadedCount !== undefined) && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {progress.documentsFound !== undefined && (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    Encontrados
                  </span>
                </div>
                <p className="text-lg font-bold text-blue-700 dark:text-blue-300">
                  {progress.documentsFound}
                </p>
              </div>
            )}

            {progress.documentsProcessed !== undefined && (
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <span className="text-sm font-medium text-green-900 dark:text-green-100">
                    Procesados
                  </span>
                </div>
                <p className="text-lg font-bold text-green-700 dark:text-green-300">
                  {progress.documentsProcessed}
                </p>
              </div>
            )}

            {progress.downloadedCount !== undefined && progress.downloadedCount > 0 && (
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <Download className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span className="text-sm font-medium text-purple-900 dark:text-purple-100">
                    Descargados
                  </span>
                </div>
                <p className="text-lg font-bold text-purple-700 dark:text-purple-300">
                  {progress.downloadedCount}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Error details */}
        {progress.status === 'error' && progress.error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
            <h4 className="text-sm font-medium text-red-900 dark:text-red-100 mb-2">
              Detalles del Error:
            </h4>
            <p className="text-xs text-red-700 dark:text-red-300 font-mono">
              {progress.error}
            </p>
          </div>
        )}

        {/* Extraction time */}
        {progress.extractionTime !== undefined && progress.extractionTime > 0 && (
          <div className="text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Tiempo de extracción: {progress.extractionTime.toFixed(1)} segundos
            </p>
          </div>
        )}
      </div>
    )
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={() => {
        // Only allow closing if extraction is completed or errored
        if (!currentProgress || 
            currentProgress.status === 'completed' || 
            currentProgress.status === 'error') {
          onClose()
        }
      }}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25 dark:bg-opacity-50" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                {/* Close button - only show if extraction is done */}
                {currentProgress && 
                 (currentProgress.status === 'completed' || currentProgress.status === 'error') && (
                  <button
                    type="button"
                    className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    onClick={onClose}
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                )}

                {renderProgressContent()}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}