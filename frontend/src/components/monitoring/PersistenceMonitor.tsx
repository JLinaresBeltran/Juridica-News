/**
 * 🩺 Componente de Monitoreo de Persistencia
 * 
 * Muestra el estado de salud de la persistencia del sistema
 * con métricas en tiempo real y acciones de recuperación.
 */

import React, { useState } from 'react'
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon, 
  XCircleIcon,
  ArrowPathIcon,
  ClockIcon,
  WifiIcon,
  DocumentDuplicateIcon
} from '@heroicons/react/24/outline'
import { usePersistenceHealth } from '@/hooks/usePersistenceHealth'
import { useSync } from '@/hooks/useSync'

interface PersistenceMonitorProps {
  showDetailed?: boolean
  compact?: boolean
  className?: string
}

export const PersistenceMonitor: React.FC<PersistenceMonitorProps> = ({
  showDetailed = false,
  compact = false,
  className = ''
}) => {
  const { health, actions: healthActions } = usePersistenceHealth()
  const { status: syncStatus, actions: syncActions, computed: syncComputed } = useSync()
  const [showDetails, setShowDetails] = useState(showDetailed)

  const overallHealth = health.isHealthy && syncComputed.isHealthy

  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="flex items-center gap-1">
          {overallHealth ? (
            <CheckCircleIcon className="h-4 w-4 text-green-500" />
          ) : health.criticalIssues > 0 ? (
            <XCircleIcon className="h-4 w-4 text-red-500" />
          ) : (
            <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500" />
          )}
          <span className="text-xs text-gray-500">
            Persistencia
          </span>
        </div>
        
        <div className="flex items-center gap-1">
          <WifiIcon className={`h-4 w-4 ${syncStatus.isActive ? 'text-blue-500' : 'text-gray-400'}`} />
          <span className="text-xs text-gray-500">
            Sync: {syncComputed.lastSyncAgo}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {overallHealth ? (
              <CheckCircleIcon className="h-5 w-5 text-green-500" />
            ) : health.criticalIssues > 0 ? (
              <XCircleIcon className="h-5 w-5 text-red-500" />
            ) : (
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
            )}
            <h3 className="text-sm font-medium text-gray-900">
              Estado de Persistencia
            </h3>
            <span className={`px-2 py-1 text-xs rounded-full ${
              overallHealth 
                ? 'bg-green-100 text-green-800'
                : health.criticalIssues > 0
                ? 'bg-red-100 text-red-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {overallHealth ? 'Saludable' : health.criticalIssues > 0 ? 'Crítico' : 'Advertencia'}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => healthActions.checkHealth()}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              title="Verificar salud"
            >
              <ArrowPathIcon className={`h-4 w-4 ${health.isChecking ? 'animate-spin' : ''}`} />
            </button>
            
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
            >
              {showDetails ? 'Menos' : 'Más'} detalles
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Errors */}
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {health.criticalIssues}
            </div>
            <div className="text-xs text-gray-500">Issues Críticos</div>
          </div>
          
          {/* Warnings */}
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {health.warningCount}
            </div>
            <div className="text-xs text-gray-500">Advertencias</div>
          </div>
          
          {/* Sync Status */}
          <div className="text-center">
            <div className={`text-2xl font-bold ${
              syncStatus.isActive ? 'text-blue-600' : 'text-gray-400'
            }`}>
              {syncComputed.successRate}%
            </div>
            <div className="text-xs text-gray-500">Tasa Éxito Sync</div>
          </div>
          
          {/* Last Check */}
          <div className="text-center">
            <div className="text-sm font-medium text-gray-900 flex items-center justify-center gap-1">
              <ClockIcon className="h-4 w-4" />
              {health.lastCheck 
                ? new Date(health.lastCheck).toLocaleTimeString('es-ES', { 
                    hour: '2-digit', minute: '2-digit' 
                  })
                : 'Nunca'
              }
            </div>
            <div className="text-xs text-gray-500">Última Verificación</div>
          </div>
        </div>

        {/* Sync Info */}
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <WifiIcon className={`h-4 w-4 ${syncStatus.isActive ? 'text-blue-500' : 'text-gray-400'}`} />
              <span className="text-sm font-medium text-gray-900">
                Sincronización Automática
              </span>
              <span className={`px-2 py-1 text-xs rounded ${
                syncStatus.isActive 
                  ? 'bg-blue-200 text-blue-800'
                  : 'bg-gray-200 text-gray-800'
              }`}>
                {syncStatus.isActive ? 'Activa' : 'Inactiva'}
              </span>
            </div>
            
            <button
              onClick={() => syncStatus.isActive ? syncActions.stop() : syncActions.start()}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                syncStatus.isActive 
                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
            >
              {syncStatus.isActive ? 'Detener' : 'Iniciar'}
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
            <div>
              <span className="font-medium">Última sync:</span> {syncComputed.lastSyncAgo}
            </div>
            <div>
              <span className="font-medium">Próxima sync:</span> {syncComputed.nextSyncIn}
            </div>
          </div>
        </div>

        {/* Detailed Information */}
        {showDetails && (
          <div className="space-y-3">
            {/* Errors */}
            {health.errors.length > 0 && (
              <div className="bg-red-50 rounded-lg p-3">
                <h4 className="text-sm font-medium text-red-800 mb-2 flex items-center gap-1">
                  <XCircleIcon className="h-4 w-4" />
                  Issues Críticos ({health.errors.length})
                </h4>
                <ul className="space-y-1">
                  {health.errors.map((error, index) => (
                    <li key={index} className="text-xs text-red-700">
                      • {error}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Warnings */}
            {health.warnings.length > 0 && (
              <div className="bg-yellow-50 rounded-lg p-3">
                <h4 className="text-sm font-medium text-yellow-800 mb-2 flex items-center gap-1">
                  <ExclamationTriangleIcon className="h-4 w-4" />
                  Advertencias ({health.warnings.length})
                </h4>
                <ul className="space-y-1">
                  {health.warnings.map((warning, index) => (
                    <li key={index} className="text-xs text-yellow-700">
                      • {warning}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Sync Errors */}
            {syncStatus.errors.length > 0 && (
              <div className="bg-orange-50 rounded-lg p-3">
                <h4 className="text-sm font-medium text-orange-800 mb-2 flex items-center gap-1">
                  <WifiIcon className="h-4 w-4" />
                  Errores de Sincronización ({syncStatus.errors.length})
                </h4>
                <ul className="space-y-1">
                  {syncStatus.errors.slice(-3).map((error, index) => (
                    <li key={index} className="text-xs text-orange-700">
                      • {error}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2 border-t border-gray-200">
              <button
                onClick={() => syncActions.syncNow()}
                disabled={health.isChecking}
                className="px-3 py-2 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Sincronizar Ahora
              </button>
              
              <button
                onClick={() => healthActions.forceSync()}
                disabled={health.isChecking}
                className="px-3 py-2 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Forzar Sync Completo
              </button>
              
              <button
                onClick={() => healthActions.cleanupData()}
                disabled={health.isChecking}
                className="px-3 py-2 text-xs bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Limpiar Datos Corruptos
              </button>
            </div>
          </div>
        )}

        {/* All Good Message */}
        {overallHealth && !showDetails && (
          <div className="text-center py-4 text-gray-500">
            <DocumentDuplicateIcon className="h-8 w-8 mx-auto mb-2 text-green-500" />
            <p className="text-sm">
              Todos los sistemas de persistencia funcionan correctamente
            </p>
            <p className="text-xs mt-1">
              Última verificación: {health.lastCheck 
                ? new Date(health.lastCheck).toLocaleString('es-ES')
                : 'Nunca'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * 🚨 Componente de alerta flotante para issues críticos
 */
export const PersistenceAlert: React.FC = () => {
  const { health } = usePersistenceHealth()
  const [dismissed, setDismissed] = useState(false)

  if (dismissed || health.criticalIssues === 0) {
    return null
  }

  return (
    <div className="fixed top-4 right-4 z-50 bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg max-w-sm">
      <div className="flex items-start gap-3">
        <XCircleIcon className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="text-sm font-medium text-red-800">
            Issues Críticos de Persistencia
          </h4>
          <p className="text-xs text-red-700 mt-1">
            Se detectaron {health.criticalIssues} problemas que pueden afectar 
            la integridad de tus datos.
          </p>
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => setDismissed(true)}
              className="text-xs text-red-600 hover:text-red-800 transition-colors"
            >
              Descartar
            </button>
            <button
              onClick={() => {/* Navigate to monitoring page */}}
              className="text-xs text-red-600 hover:text-red-800 transition-colors font-medium"
            >
              Ver Detalles
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PersistenceMonitor