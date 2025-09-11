import { useState, useEffect } from 'react'
import { 
  Sparkles, 
  RefreshCw, 
  Check, 
  BookOpen,
  Zap,
  GraduationCap,
  AlertCircle
} from 'lucide-react'
import { clsx } from 'clsx'
import ModelSelector, { AIModel } from '../common/ModelSelector'
import aiService from '../../services/aiService'

interface TitleOption {
  id: string
  style: 'serious' | 'catchy' | 'educational'
  title: string
  description: string
}

interface TitleGeneratorProps {
  document: any
  onTitleSelected: (title: string, style: string) => void
  selectedTitle?: string
}

const TITLE_STYLES = {
  serious: {
    name: 'Serio y Profesional',
    description: 'Formal y directo para audiencia especializada',
    icon: BookOpen,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200'
  },
  catchy: {
    name: 'Capcioso',
    description: 'Atractivo y diseñado para generar clics',
    icon: Zap,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200'
  },
  educational: {
    name: 'Educativo',
    description: 'Informativo y claro para el público general',
    icon: GraduationCap,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200'
  }
}

export default function TitleGenerator({ 
  document, 
  onTitleSelected, 
  selectedTitle 
}: TitleGeneratorProps) {
  const [titleOptions, setTitleOptions] = useState<TitleOption[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null)
  const [generatedTitles, setGeneratedTitles] = useState<string[]>([])
  const [selectedModel, setSelectedModel] = useState<AIModel>('gpt4o-mini')
  const [generationError, setGenerationError] = useState<string | null>(null)
  const [showModelSelector, setShowModelSelector] = useState(false)

  // Función para guardar estado en localStorage
  const saveTitleState = (style: string, titles: string[], model: AIModel) => {
    if (document?.id) {
      const storageKey = `title-generator-${document.id}`
      const titleState = {
        selectedStyle: style,
        generatedTitles: titles,
        selectedModel: model,
        lastModified: new Date().toISOString()
      }
      localStorage.setItem(storageKey, JSON.stringify(titleState))
      console.log('Estado del generador de títulos guardado')
    }
  }

  // Cargar estado guardado al montar el componente
  useEffect(() => {
    if (document?.id) {
      const storageKey = `title-generator-${document.id}`
      const savedState = localStorage.getItem(storageKey)
      
      if (savedState) {
        try {
          const parsedState = JSON.parse(savedState)
          setSelectedStyle(parsedState.selectedStyle)
          setGeneratedTitles(parsedState.generatedTitles || [])
          setSelectedModel(parsedState.selectedModel || 'gpt4o-mini')
          console.log('Estado del generador de títulos cargado:', parsedState)
        } catch (error) {
          console.error('Error cargando estado del generador de títulos:', error)
        }
      }
    }
  }, [document?.id])

  const generateTitlesForStyle = async (styleKey: string) => {
    if (!selectedModel) {
      setShowModelSelector(true)
      return
    }

    // Si ya tenemos títulos para este estilo y no es una regeneración, no generar de nuevo
    if (selectedStyle === styleKey && generatedTitles.length > 0) {
      return
    }

    setIsGenerating(true)
    setSelectedStyle(styleKey)
    setGenerationError(null)
    
    try {
      console.log('Generando títulos para estilo:', styleKey, 'con modelo:', selectedModel)
      
      // Llamada real a la API para generar títulos
      const result = await aiService.generateTitles({
        documentId: document.id,
        model: selectedModel,
        style: styleKey as 'serious' | 'catchy' | 'educational',
        count: 3
      })
      
      setGeneratedTitles(result.titles)
      
      // Guardar estado después de generar títulos
      saveTitleState(styleKey, result.titles, selectedModel)

      console.log(`✅ Títulos generados exitosamente: ${result.titles.length} títulos con ${result.modelUsed}`)
      
    } catch (error) {
      console.error('Error generando títulos:', error)
      setGenerationError(error instanceof Error ? aiService.formatErrorMessage(error) : 'Error desconocido')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleTitleSelect = (title: string) => {
    if (selectedStyle) {
      onTitleSelected(title, selectedStyle)
    }
  }

  if (isGenerating) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#04315a] mx-auto mb-4"></div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          Generando títulos con IA...
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Creando opciones personalizadas para tu artículo
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8 flex flex-col items-center">
      {/* Selector de modelo */}
      <div className="w-full max-w-4xl">
        <ModelSelector
          selectedModel={selectedModel}
          onModelSelect={setSelectedModel}
          purpose="title"
          compact={true}
          className="justify-center"
        />
      </div>

      {/* Error de generación */}
      {generationError && (
        <div className="w-full max-w-4xl p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-red-700 dark:text-red-300">
              <p className="font-medium">Error al generar títulos</p>
              <p className="mt-1">{generationError}</p>
            </div>
          </div>
        </div>
      )}

      {/* Tarjetas de estilo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
        {Object.entries(TITLE_STYLES).map(([styleKey, style]) => {
          const isSelected = selectedStyle === styleKey
          
          return (
            <div
              key={styleKey}
              onClick={() => generateTitlesForStyle(styleKey)}
              className={clsx(
                'relative p-6 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-lg',
                isSelected 
                  ? `${style.borderColor} ${style.bgColor} shadow-md` 
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-800'
              )}
            >
              <div className="flex items-start space-x-3">
                <div className={clsx(
                  'p-2 rounded-lg',
                  isSelected ? style.bgColor : 'bg-gray-100 dark:bg-gray-700'
                )}>
                  <style.icon className={clsx(
                    'w-5 h-5',
                    isSelected ? style.color : 'text-gray-600 dark:text-gray-400'
                  )} />
                </div>
                <div className="flex-1">
                  <h4 className={clsx(
                    'font-medium mb-1',
                    isSelected ? style.color : 'text-gray-900 dark:text-gray-100'
                  )}>
                    {style.name}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {style.description}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Opciones de títulos generadas */}
      {generatedTitles.length > 0 && (
        <div className="space-y-4 w-full">
          <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 text-center">
            Opciones generadas para estilo {selectedStyle && TITLE_STYLES[selectedStyle as keyof typeof TITLE_STYLES].name}
          </h4>
          
          <div className="grid grid-cols-1 gap-4">
            {generatedTitles.map((title, index) => (
              <div
                key={index}
                onClick={() => handleTitleSelect(title)}
                className={clsx(
                  'p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-md',
                  selectedTitle === title
                    ? 'border-[#04315a] bg-[#3ff3f2] bg-opacity-10 shadow-md'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-800'
                )}
              >
                <div className="flex items-start justify-between">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 leading-relaxed flex-1 pr-4">
                    {title}
                  </p>
                  {selectedTitle === title && (
                    <div className="flex-shrink-0">
                      <div className="w-6 h-6 bg-[#04315a] rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-[#3ff3f2]" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center">
            <button
              onClick={() => {
                if (selectedStyle) {
                  // Force regeneration by clearing existing titles
                  setGeneratedTitles([])
                  generateTitlesForStyle(selectedStyle)
                }
              }}
              disabled={isGenerating || !selectedModel}
              className={clsx(
                'inline-flex items-center space-x-2 px-4 py-2 text-sm rounded-lg transition-colors',
                isGenerating || !selectedModel
                  ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                  : 'text-[#04315a] hover:text-[#3ff3f2] hover:bg-[#04315a] dark:text-[#3ff3f2] dark:hover:text-[#04315a] dark:hover:bg-[#3ff3f2]'
              )}
            >
              <RefreshCw className={clsx('w-4 h-4', isGenerating && 'animate-spin')} />
              <span>{isGenerating ? 'Regenerando...' : 'Regenerar títulos'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}