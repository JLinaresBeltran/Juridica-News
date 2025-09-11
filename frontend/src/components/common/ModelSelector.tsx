import { useState, useEffect } from 'react'
import { ChevronDown, Brain, Sparkles, CheckCircle2, XCircle } from 'lucide-react'
import { clsx } from 'clsx'

export type AIModel = 'gpt4o-mini' | 'gemini'

interface ModelOption {
  id: AIModel
  name: string
  description: string
  strengths: string[]
  icon: typeof Brain
  available: boolean
}

interface ModelSelectorProps {
  selectedModel: AIModel | ''
  onModelSelect: (model: AIModel) => void
  purpose?: 'article' | 'title' | 'image'
  className?: string
  compact?: boolean
}

const AI_MODELS: ModelOption[] = [
  {
    id: 'gpt4o-mini',
    name: 'GPT-4o Mini',
    description: 'OpenAI - Rápido y eficiente para contenido jurídico',
    strengths: ['Análisis jurídico preciso', 'Escritura profesional', 'Contexto legal'],
    icon: Brain,
    available: true // Se validará dinámicamente
  },
  {
    id: 'gemini',
    name: 'Gemini',
    description: 'Google - Excelente para análisis de documentos extensos',
    strengths: ['Comprensión contextual', 'Análisis de documentos', 'Síntesis efectiva'],
    icon: Sparkles,
    available: true // Se validará dinámicamente
  }
]

const PURPOSE_LABELS = {
  article: 'artículos',
  title: 'títulos', 
  image: 'imágenes'
}

export default function ModelSelector({ 
  selectedModel, 
  onModelSelect, 
  purpose = 'article',
  className = '',
  compact = false 
}: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [modelAvailability, setModelAvailability] = useState<Record<AIModel, boolean>>({
    'gpt4o-mini': true,
    'gemini': true
  })

  // Verificar disponibilidad de modelos al montar
  useEffect(() => {
    checkModelAvailability()
  }, [])

  const checkModelAvailability = async () => {
    try {
      const accessToken = localStorage.getItem('accessToken')
      
      // Si no hay token, asumir que ambos modelos están disponibles
      if (!accessToken || accessToken === 'null') {
        console.warn('No hay token de acceso, asumiendo modelos disponibles')
        setModelAvailability({
          'gpt4o-mini': true,
          'gemini': true // Cambio: Asumir que Gemini está disponible
        })
        return
      }

      const response = await fetch('/api/ai/available-models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const { data } = await response.json()
        setModelAvailability({
          'gpt4o-mini': data['gpt4o-mini'] || false,
          'gemini': data['gemini'] || false
        })
      } else {
        // Fallback si falla la verificación - asumir ambos disponibles
        console.warn('Error en verificación de modelos, usando fallback')
        setModelAvailability({
          'gpt4o-mini': true,
          'gemini': true // Cambio: Asumir que Gemini está disponible en caso de error
        })
      }
    } catch (error) {
      console.warn('No se pudo verificar disponibilidad de modelos:', error)
      // Fallback en caso de error - asumir ambos disponibles
      setModelAvailability({
        'gpt4o-mini': true,
        'gemini': true // Cambio: Asumir que Gemini está disponible en caso de error
      })
    }
  }

  const selectedModelData = AI_MODELS.find(m => m.id === selectedModel)

  if (compact) {
    return (
      <div className={clsx('inline-flex items-center space-x-2', className)}>
        <span className="text-sm text-gray-600 dark:text-gray-400">Modelo:</span>
        <div className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={clsx(
              'inline-flex items-center space-x-2 px-3 py-1 rounded-lg border text-sm transition-all',
              selectedModel
                ? 'border-[#04315a] bg-[#3ff3f2] bg-opacity-10 text-[#04315a]'
                : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
            )}
          >
            <span>{selectedModelData?.name || 'Seleccionar modelo'}</span>
            <ChevronDown className={clsx('w-4 h-4 transition-transform', isOpen && 'rotate-180')} />
          </button>

          {isOpen && (
            <div className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 z-50">
              {AI_MODELS.map((model) => (
                <button
                  key={model.id}
                  onClick={() => {
                    if (modelAvailability[model.id]) {
                      onModelSelect(model.id)
                      setIsOpen(false)
                    }
                  }}
                  disabled={!modelAvailability[model.id]}
                  className={clsx(
                    'w-full p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 first:rounded-t-lg last:rounded-b-lg transition-colors',
                    !modelAvailability[model.id] && 'opacity-50 cursor-not-allowed',
                    selectedModel === model.id && 'bg-[#3ff3f2] bg-opacity-10'
                  )}
                >
                  <div className="flex items-start space-x-3">
                    <model.icon className="w-5 h-5 text-gray-600 dark:text-gray-400 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {model.name}
                        </span>
                        {modelAvailability[model.id] ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {model.description}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={clsx('space-y-4', className)}>
      <div className="text-center">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          Selecciona el modelo de IA
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Elige el modelo más adecuado para generar {PURPOSE_LABELS[purpose]}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {AI_MODELS.map((model) => {
          const isSelected = selectedModel === model.id
          const isAvailable = modelAvailability[model.id]
          
          return (
            <div
              key={model.id}
              onClick={() => isAvailable && onModelSelect(model.id)}
              className={clsx(
                'relative p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer',
                isSelected && isAvailable
                  ? 'border-[#04315a] bg-[#3ff3f2] bg-opacity-10 shadow-md'
                  : isAvailable
                  ? 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-800 hover:shadow-md'
                  : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 opacity-60 cursor-not-allowed'
              )}
            >
              {/* Indicador de selección */}
              {isSelected && (
                <div className="absolute top-3 right-3">
                  <div className="w-5 h-5 bg-[#04315a] rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-3 h-3 text-[#3ff3f2]" />
                  </div>
                </div>
              )}

              {/* Indicador de disponibilidad */}
              <div className="absolute top-3 left-3">
                {isAvailable ? (
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-500" />
                )}
              </div>

              <div className="flex items-start space-x-3 mt-2">
                <div className={clsx(
                  'p-2 rounded-lg',
                  isSelected ? 'bg-[#04315a] bg-opacity-20' : 'bg-gray-100 dark:bg-gray-700'
                )}>
                  <model.icon className={clsx(
                    'w-6 h-6',
                    isSelected ? 'text-[#04315a]' : 'text-gray-600 dark:text-gray-400'
                  )} />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className={clsx(
                      'font-medium',
                      isSelected ? 'text-[#04315a]' : 'text-gray-900 dark:text-gray-100'
                    )}>
                      {model.name}
                    </h4>
                    {!isAvailable && (
                      <span className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-full">
                        No disponible
                      </span>
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {model.description}
                  </p>
                  
                  {/* Fortalezas */}
                  <div className="space-y-1">
                    <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      Fortalezas:
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {model.strengths.map((strength, index) => (
                        <span
                          key={index}
                          className="inline-block text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full"
                        >
                          {strength}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Mensaje de ayuda */}
      {!selectedModel && (
        <div className="text-center py-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Selecciona un modelo para continuar con la generación
          </p>
        </div>
      )}
    </div>
  )
}