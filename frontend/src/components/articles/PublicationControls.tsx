import { useState } from 'react'
import { CheckCircle, Globe, Building, Users } from 'lucide-react'
import { ArticlePublicationSettings, JudicialEntity } from '@/types/publication.types'

interface PublicationControlsProps {
  articleId: string
  initialSettings?: Partial<ArticlePublicationSettings>
  onSettingsChange?: (settings: ArticlePublicationSettings) => void
  isPublishing?: boolean
}

export default function PublicationControls({
  articleId,
  initialSettings = {},
  onSettingsChange,
  isPublishing = false
}: PublicationControlsProps) {

  const [settings, setSettings] = useState<ArticlePublicationSettings>({
    isGeneral: initialSettings.isGeneral || false,
    isUltimasNoticias: initialSettings.isUltimasNoticias || false,
    entidadSeleccionada: initialSettings.entidadSeleccionada || undefined,
    isDestacadoSemana: initialSettings.isDestacadoSemana || false
  })

  const handleSettingChange = (key: keyof ArticlePublicationSettings, value: any) => {
    const newSettings = { ...settings, [key]: value }
    setSettings(newSettings)
    onSettingsChange?.(newSettings)
  }

  const entidadOptions = [
    { value: 'CORTE_CONSTITUCIONAL', label: 'Corte Constitucional' },
    { value: 'CORTE_SUPREMA', label: 'Corte Suprema de Justicia' },
    { value: 'CONSEJO_ESTADO', label: 'Consejo de Estado' },
    { value: 'TRIBUNAL_SUPERIOR', label: 'Tribunal Superior' },
    { value: 'FISCALIA_GENERAL', label: 'Fiscalía General' },
    { value: 'PROCURADURIA_GENERAL', label: 'Procuraduría General' },
    { value: 'CONTRALORIA_GENERAL', label: 'Contraloría General' },
    { value: 'MINISTERIO_JUSTICIA', label: 'Ministerio de Justicia' }
  ]

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
      <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center space-x-2">
        <Globe className="w-4 h-4" />
        <span>Configuración de Publicación en Portal</span>
      </h4>

      <div className="space-y-4">
        {/* Checkbox General */}
        <div className="flex items-start space-x-3">
          <input
            type="checkbox"
            id={`general-${articleId}`}
            checked={settings.isGeneral}
            onChange={(e) => handleSettingChange('isGeneral', e.target.checked)}
            disabled={isPublishing}
            className="mt-1 w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
          />
          <div className="flex-1">
            <label htmlFor={`general-${articleId}`} className="text-sm font-medium text-gray-900 dark:text-gray-100 cursor-pointer">
              General (Sección Superior)
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Aparece en la sección principal del home. Máximo 2 artículos. El más nuevo desplaza al anterior.
            </p>
          </div>
        </div>

        {/* Checkbox Últimas Noticias */}
        <div className="flex items-start space-x-3">
          <input
            type="checkbox"
            id={`ultimas-${articleId}`}
            checked={settings.isUltimasNoticias}
            onChange={(e) => handleSettingChange('isUltimasNoticias', e.target.checked)}
            disabled={isPublishing}
            className="mt-1 w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
          />
          <div className="flex-1">
            <label htmlFor={`ultimas-${articleId}`} className="text-sm font-medium text-gray-900 dark:text-gray-100 cursor-pointer">
              Últimas Noticias
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Aparece en la tarjeta "Últimas Noticias" del home. Máximo 5 artículos ordenados por fecha.
            </p>
          </div>
        </div>

        {/* Dropdown Entidades */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center space-x-2">
            <Building className="w-4 h-4" />
            <span>Entidad (Timeline Instituciones)</span>
          </label>
          <select
            value={settings.entidadSeleccionada || ''}
            onChange={(e) => handleSettingChange('entidadSeleccionada', e.target.value || undefined)}
            disabled={isPublishing}
            className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="">Seleccionar entidad...</option>
            {entidadOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Aparece en el timeline de instituciones del home, agrupado por entidad.
          </p>
        </div>

        {/* Checkbox Destacados de la Semana */}
        <div className="flex items-start space-x-3">
          <input
            type="checkbox"
            id={`destacado-${articleId}`}
            checked={settings.isDestacadoSemana}
            onChange={(e) => handleSettingChange('isDestacadoSemana', e.target.checked)}
            disabled={isPublishing}
            className="mt-1 w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
          />
          <div className="flex-1">
            <label htmlFor={`destacado-${articleId}`} className="text-sm font-medium text-gray-900 dark:text-gray-100 cursor-pointer">
              Destacados de la Semana
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Aparece en la sección "Destacados de la Semana" al final del home. Máximo 4 artículos.
            </p>
          </div>
        </div>

        {/* Validación: Al menos una opción seleccionada */}
        {!settings.isGeneral &&
         !settings.isUltimasNoticias &&
         !settings.entidadSeleccionada &&
         !settings.isDestacadoSemana && (
          <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <p className="text-sm text-amber-700 dark:text-amber-300 flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>Selecciona al menos una sección donde aparecerá el artículo en el portal público.</span>
            </p>
          </div>
        )}

        {/* Indicador de posicionamiento */}
        {(settings.isGeneral || settings.isUltimasNoticias || settings.isDestacadoSemana) && (
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300 flex items-center space-x-2">
              <CheckCircle className="w-4 h-4" />
              <span>El artículo aparecerá automáticamente en las secciones seleccionadas al publicarse.</span>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}