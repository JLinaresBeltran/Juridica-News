import { useState, useEffect } from 'react'
import { 
  Sparkles, 
  RefreshCw, 
  Check, 
  BookOpen,
  Zap,
  GraduationCap,
  FileText
} from 'lucide-react'
import { clsx } from 'clsx'

interface ArticleGeneratorProps {
  document: any
  onArticleGenerated: (article: string, style: string) => void
  onTitleSelected: (title: string, style: string) => void
  generatedArticle?: string
  selectedTitle?: string
}

const ARTICLE_STYLES = {
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

export default function ArticleGenerator({ 
  document, 
  onArticleGenerated, 
  onTitleSelected,
  generatedArticle = '',
  selectedTitle = ''
}: ArticleGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [isGeneratingTitles, setIsGeneratingTitles] = useState(false)
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null)
  const [articleText, setArticleText] = useState(generatedArticle)
  const [generatedTitles, setGeneratedTitles] = useState<string[]>([])

  // Actualizar el texto cuando cambie el artículo generado externamente
  useEffect(() => {
    setArticleText(generatedArticle)
  }, [generatedArticle])

  const generateArticle = async (styleKey: string) => {
    setIsGenerating(true)
    setSelectedStyle(styleKey)
    
    try {
      console.log('🚀 GENERANDO ARTÍCULO REAL CON AI - Estilo:', styleKey)
      console.log('📄 Documento para generación:', document)
      
      // LLAMADA REAL A LA API
      const { aiService } = await import('../../services/aiService')
      
      const result = await aiService.generateArticle({
        documentId: document.id,
        model: 'gpt4o-mini',
        maxWords: 500,
        tone: styleKey === 'serious' ? 'professional' : styleKey === 'educational' ? 'accessible' : 'professional',
        customInstructions: `Genera un artículo en estilo ${styleKey === 'serious' ? 'formal y profesional' : styleKey === 'catchy' ? 'atractivo y dinámico' : 'educativo y claro'}`
      })
      
      console.log('✅ ARTÍCULO GENERADO POR AI:', {
        wordCount: result.wordCount,
        modelUsed: result.modelUsed,
        contentLength: result.content.length
      })
      
      const generatedText = result.content
      setArticleText(generatedText)
      onArticleGenerated(generatedText, styleKey)
      
      // Backup con mock data solo si falla la API
      const mockArticles = {
        serious: `# Análisis Jurisprudencial: ${document.identifier || 'Sentencia'} sobre ${document.area?.toLowerCase() || 'derecho'}

La reciente decisión judicial ${document.numeroSentencia || document.identifier} constituye un precedente significativo en el desarrollo del derecho ${document.area?.toLowerCase() || 'constitucional'} colombiano. Esta sentencia, proferida por ${document.magistradoPonente ? `el Magistrado ${document.magistradoPonente}` : 'la autoridad competente'}, aborda cuestiones fundamentales que requieren análisis detallado.

## Antecedentes del Caso

${document.expediente ? `En el expediente ${document.expediente}, ` : ''}la controversia planteada se centra en ${document.temaPrincipal || 'aspectos relevantes del derecho constitucional'}. Las circunstancias fácticas del caso presentan características particulares que ameritan consideración especial.

## Consideraciones Jurídicas

${document.resumenIA || document.summary || 'La decisión analiza los fundamentos constitucionales y legales aplicables al caso, estableciendo criterios jurisprudenciales claros.'}

## Decisión Adoptada

${document.decision || 'La Corte adoptó una decisión fundamentada en los principios constitucionales aplicables, estableciendo precedente para casos similares.'}

## Implicaciones Jurídicas

Esta decisión tiene implicaciones significativas para la práctica jurídica y el desarrollo del derecho ${document.area?.toLowerCase() || 'constitucional'}, estableciendo criterios que orientarán futuras decisiones judiciales.`,

        catchy: `# 🚨 ¡DECISIÓN JUDICIAL QUE ESTÁ CAMBIANDO TODO EN COLOMBIA! 

¿Sabías que la reciente sentencia ${document.numeroSentencia || document.identifier} está revolucionando el panorama jurídico colombiano? ¡Te contamos todo lo que necesitas saber!

## 💥 Lo Que Está Pasando

${document.magistradoPonente ? `El Magistrado ${document.magistradoPonente} ` : 'La autoridad judicial '}acaba de tomar una decisión que tiene a todos los abogados hablando. Esta sentencia sobre ${document.temaPrincipal || 'temas constitucionales fundamentales'} está generando un impacto sin precedentes.

## 🔥 ¿Por Qué Es Tan Importante?

${document.resumenIA || document.summary || 'Esta decisión está redefiniendo conceptos fundamentales del derecho colombiano y estableciendo nuevos precedentes que afectarán miles de casos futuros.'}

## ⚖️ La Decisión Que Todos Esperaban

${document.decision || 'La Corte tomó una decisión contundente que marca un antes y un después en la jurisprudencia nacional.'}

## 🎯 Lo Que Esto Significa Para Ti

Si eres abogado, estudiante de derecho o simplemente te interesa la justicia en Colombia, esta sentencia cambiará tu perspectiva sobre ${document.area?.toLowerCase() || 'el derecho constitucional'}.

¡No te pierdas los detalles completos de esta decisión histórica!`,

        educational: `# Guía Completa: Entendiendo la Sentencia ${document.numeroSentencia || document.identifier}

¿Te has preguntado cómo interpretar las decisiones judiciales? Te explicamos paso a paso todo lo que necesitas saber sobre esta importante sentencia.

## ¿Qué Es Esta Sentencia?

La sentencia ${document.numeroSentencia || document.identifier} es una decisión judicial que aborda ${document.temaPrincipal || 'temas fundamentales del derecho'}. ${document.magistradoPonente ? `Fue redactada por el Magistrado ${document.magistradoPonente}` : 'Representa una decisión colegiada de la autoridad competente'}.

## ¿Por Qué Es Importante?

Esta decisión es relevante porque:
- Establece precedentes jurídicos claros
- Resuelve controversias importantes en ${document.area?.toLowerCase() || 'derecho constitucional'}
- Orienta futuras decisiones judiciales

## ¿Qué Decidió la Corte?

De manera sencilla, la decisión establece que: ${document.decision || 'se deben respetar los principios constitucionales fundamentales en casos similares'}.

## Contexto y Antecedentes

${document.resumenIA || document.summary || 'La sentencia surge de un caso particular que planteaba interrogantes importantes sobre la aplicación del derecho en situaciones específicas.'}

## ¿Cómo Nos Afecta?

Esta decisión tiene implicaciones prácticas para:
- La comunidad jurídica
- Los ciudadanos en general
- Casos futuros similares

## Conclusión

La sentencia ${document.numeroSentencia || document.identifier} representa un avance significativo en el desarrollo del derecho ${document.area?.toLowerCase() || 'constitucional'} colombiano, proporcionando claridad y orientación para situaciones similares.`
      }
      
    } catch (error) {
      console.error('❌ ERROR EN GENERACIÓN CON AI, usando mock data como respaldo:', error)
      
      // Fallback a mock data si falla la API
      const mockArticles = {
        serious: `# Análisis Jurisprudencial: ${document.identifier || 'Sentencia'} sobre ${document.area?.toLowerCase() || 'derecho'}

La reciente decisión judicial ${document.numeroSentencia || document.identifier} constituye un precedente significativo en el desarrollo del derecho ${document.area?.toLowerCase() || 'constitucional'} colombiano.`,
        catchy: `# 🚨 ¡DECISIÓN JUDICIAL QUE ESTÁ CAMBIANDO TODO EN COLOMBIA! 

¿Sabías que la reciente sentencia ${document.numeroSentencia || document.identifier} está revolucionando el panorama jurídico colombiano?`,
        educational: `# Guía Completa: Entendiendo la Sentencia ${document.numeroSentencia || document.identifier}

¿Te has preguntado cómo interpretar las decisiones judiciales? Te explicamos paso a paso todo lo que necesitas saber.`
      }
      
      const generatedText = mockArticles[styleKey as keyof typeof mockArticles] || ''
      setArticleText(generatedText)
      onArticleGenerated(generatedText, styleKey)
    } finally {
      setIsGenerating(false)
    }
  }

  const generateTitlesForStyle = async (styleKey: string) => {
    if (!articleText) {
      alert('Primero debes generar un artículo antes de crear títulos')
      return
    }

    setIsGeneratingTitles(true)
    setSelectedStyle(styleKey)
    
    try {
      console.log('🚀 GENERANDO TÍTULOS REALES CON AI - Estilo:', styleKey)
      
      // LLAMADA REAL A LA API PARA TÍTULOS
      const { aiService } = await import('../../services/aiService')
      
      const result = await aiService.generateTitles({
        documentId: document.id,
        model: 'gpt4o-mini',
        style: styleKey as 'serious' | 'catchy' | 'educational',
        count: 3
      })
      
      console.log('✅ TÍTULOS GENERADOS POR AI:', result.titles)
      setGeneratedTitles(result.titles)
      
    } catch (error) {
      console.error('❌ ERROR EN GENERACIÓN DE TÍTULOS CON AI, usando mock data:', error)
      
      // Fallback a mock data si falla la API  
      const mockTitles = {
        serious: [
          `Análisis jurisprudencial: ${document.numeroSentencia || document.identifier} sobre ${document.area?.toLowerCase() || 'derecho constitucional'}`,
          `Implicaciones del ${document.numeroSentencia || document.identifier} en el desarrollo del derecho ${document.area?.toLowerCase() || 'constitucional'}`,
          `Estudio técnico de la decisión judicial ${document.numeroSentencia || document.identifier} - ${document.area || 'Constitucional'}`
        ],
        catchy: [
          `🚨 La decisión que está revolucionando el ${document.area?.toLowerCase() || 'derecho constitucional'} en Colombia`,
          `¡Atención abogados! Esta sentencia cambia todo en ${document.area?.toLowerCase() || 'derecho constitucional'}`,
          `El fallo que todos están comentando: ${document.numeroSentencia || document.identifier} explicado`
        ],
        educational: [
          `¿Qué significa realmente ${document.numeroSentencia || document.identifier}? Todo lo que debes saber`,
          `Guía completa: Cómo entender el ${document.numeroSentencia || document.identifier} paso a paso`,
          `${document.numeroSentencia || document.identifier} explicado en términos simples para todos`
        ]
      }
      
      const titles = mockTitles[styleKey as keyof typeof mockTitles] || []
      setGeneratedTitles(titles)
    } finally {
      setIsGeneratingTitles(false)
    }
  }

  const handleTitleSelect = (title: string) => {
    if (selectedStyle) {
      onTitleSelected(title, selectedStyle)
    }
  }

  const handleArticleChange = (text: string) => {
    setArticleText(text)
    if (selectedStyle) {
      onArticleGenerated(text, selectedStyle)
    }
  }

  if (isGenerating) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#04315a] mx-auto mb-4"></div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          Generando artículo con IA...
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Creando contenido personalizado basado en la sentencia
        </p>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col space-y-6 w-full">
      <div className="text-center">
        <button
          onClick={() => generateArticle(selectedStyle || 'serious')}
          className="inline-flex items-center space-x-2 px-6 py-3 bg-[#04315a] text-white rounded-lg hover:bg-[#3ff3f2] hover:text-[#04315a] transition-colors text-sm font-medium"
        >
          <Sparkles className="w-5 h-5" />
          <span>Generar Artículo</span>
        </button>
      </div>

      {/* Una sola columna que ocupa todo el ancho */}
      <div className="flex-1 w-full space-y-6">
        {/* Textarea del artículo */}
        <div className="w-full">
          {articleText ? (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100">
                Artículo Generado (Editable)
              </label>
              <textarea
                value={articleText}
                onChange={(e) => handleArticleChange(e.target.value)}
                className="w-full min-w-full h-96 p-4 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-[#04315a] focus:border-[#04315a] bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                placeholder="El artículo generado aparecerá aquí..."
                style={{ width: '100%', minWidth: '100%' }}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                Puedes editar el contenido directamente en este campo
              </p>
            </div>
          ) : (
            <div className="h-96 flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
              <div className="text-center">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  Haz clic en "Generar Artículo" para comenzar
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Sección de estilos y títulos - Solo si hay artículo */}
        {articleText && (
          <div className="w-full space-y-6">
            <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 text-center">
              Ahora selecciona un estilo para generar títulos
            </h4>
            
            {/* Loading de títulos */}
            {isGeneratingTitles && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#04315a] mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">Generando títulos...</p>
              </div>
            )}

            {!isGeneratingTitles && (
              <div className="flex flex-col space-y-4 w-full">
                {Object.entries(ARTICLE_STYLES).map(([styleKey, style]) => {
                  const isSelected = selectedStyle === styleKey
                  
                  return (
                    <div
                      key={styleKey}
                      onClick={() => generateTitlesForStyle(styleKey)}
                      className={clsx(
                        'relative w-full min-w-full p-6 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-lg',
                        isSelected 
                          ? `${style.borderColor} ${style.bgColor} shadow-md` 
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-800'
                      )}
                      style={{ width: '100%', minWidth: '100%' }}
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
                      {isSelected && (
                        <div className="absolute top-2 right-2">
                          <div className="w-6 h-6 bg-[#04315a] rounded-full flex items-center justify-center">
                            <Check className="w-4 h-4 text-[#3ff3f2]" />
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* Títulos generados */}
            {generatedTitles.length > 0 && (
              <div className="space-y-4 w-full">
                <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 text-center">
                  Títulos generados para estilo {selectedStyle && ARTICLE_STYLES[selectedStyle as keyof typeof ARTICLE_STYLES].name}
                </h4>
                
                <div className="space-y-3">
                  {generatedTitles.map((title, index) => (
                    <div
                      key={index}
                      onClick={() => handleTitleSelect(title)}
                      className={clsx(
                        'w-full min-w-full p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-md',
                        selectedTitle === title
                          ? 'border-[#04315a] bg-[#3ff3f2] bg-opacity-10 shadow-md'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-800'
                      )}
                      style={{ width: '100%', minWidth: '100%' }}
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
                        generateTitlesForStyle(selectedStyle)
                      }
                    }}
                    className="inline-flex items-center space-x-2 px-4 py-2 text-sm text-[#04315a] hover:text-[#3ff3f2] hover:bg-[#04315a] rounded-lg transition-colors dark:text-[#3ff3f2] dark:hover:text-[#04315a] dark:hover:bg-[#3ff3f2]"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Regenerar títulos</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}