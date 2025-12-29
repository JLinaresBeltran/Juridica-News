import React, { useState, useEffect } from 'react'
import { ArticleCard } from './ArticleCard'
import { publicPortalService } from '@/services/publicPortalService'
import { adaptApiToPublicArticle, PublicArticle } from '@/types/publicArticle.types'

interface SectionPageProps {
  sectionKey: string // 'constitucional', 'civil', 'penal', etc.
  className?: string
}

// Mapeo de section keys a legal areas del backend
const sectionToLegalAreaMap: Record<string, string> = {
  'constitucional': 'CONSTITUCIONAL',
  'administrativo': 'ADMINISTRATIVO',
  'fiscal': 'FISCAL',
  'societario': 'SOCIETARIO',
  'penal': 'PENAL',
  'civil': 'CIVIL',
  'digital': 'CIVIL', // Digital es un subconjunto de civil por ahora
  'laboral': 'LABORAL',
  'regulatorio': 'REGULATORIO',
  'opinion': 'CONSTITUCIONAL', // Opinión por defecto a constitucional
  'comercial': 'MERCANTIL',
  'familia': 'CIVIL',
  'tributario': 'FISCAL'
}

const getSectionDisplayName = (sectionKey: string): string => {
  const displayNames: Record<string, string> = {
    'constitucional': 'Derecho Constitucional',
    'administrativo': 'Derecho Administrativo',
    'fiscal': 'Derecho Fiscal y Aduanero',
    'societario': 'Derecho Societario',
    'penal': 'Derecho Penal',
    'civil': 'Derecho Civil',
    'digital': 'Derecho Digital',
    'laboral': 'Derecho Laboral',
    'regulatorio': 'Derecho Regulatorio',
    'opinion': 'Opinión',
    'comercial': 'Derecho Comercial',
    'familia': 'Derecho de Familia',
    'tributario': 'Derecho Tributario'
  }
  return displayNames[sectionKey] || sectionKey
}

export const SectionPage: React.FC<SectionPageProps> = ({
  sectionKey,
  className = ''
}) => {
  const [articles, setArticles] = useState<PublicArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)

  const sectionName = getSectionDisplayName(sectionKey)
  const legalArea = sectionToLegalAreaMap[sectionKey] || 'CONSTITUCIONAL'
  const hasMore = totalCount > 10

  useEffect(() => {
    loadArticles()
  }, [sectionKey])

  const loadArticles = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await publicPortalService.getArticlesByLegalArea(legalArea, 1, 10)
      const adaptedArticles = response.data.map(adaptApiToPublicArticle)
      setArticles(adaptedArticles)
      setTotalCount(response.pagination.total)
    } catch (err) {
      setError('Error al cargar los artículos')
      console.error('Error loading articles:', err)
    } finally {
      setLoading(false)
    }
  }

  const getSectionDescription = (key: string): string => {
    const descriptions: Record<string, string> = {
      'constitucional': 'Sentencias, análisis y noticias sobre jurisprudencia constitucional, derechos fundamentales y control de constitucionalidad.',
      'administrativo': 'Contratación estatal, función pública, control fiscal y derecho administrativo general.',
      'fiscal': 'Normativa fiscal, jurisprudencia tributaria, aduanas y política fiscal.',
      'societario': 'Derecho de sociedades, gobierno corporativo, fusiones y adquisiciones.',
      'penal': 'Jurisprudencia penal, política criminal y desarrollo del sistema penal acusatorio.',
      'civil': 'Actualidad en derecho civil, contratos, responsabilidad civil y derecho de las personas.',
      'digital': 'Noticias sobre transformación digital del sector jurídico, tecnología legal e innovación.',
      'laboral': 'Legislación laboral, derechos de los trabajadores y relaciones laborales.',
      'regulatorio': 'Regulación sectorial, compliance, supervisión y derecho regulatorio.',
      'opinion': 'Análisis y opiniones de expertos sobre temas jurídicos de actualidad.',
      'comercial': 'Derecho mercantil, títulos valores y derecho de la competencia.',
      'familia': 'Derecho de familia, adopción, régimen patrimonial y protección de menores.',
      'tributario': 'Normativa fiscal, jurisprudencia tributaria y política fiscal.'
    }
    return descriptions[key] || 'Contenido especializado en esta área del derecho.'
  }

  if (loading) {
    return (
      <div className={`min-h-screen bg-gray-50 ${className}`}>
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-8 py-8 sm:py-12">
            <div className="text-center">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4" style={{ color: '#04315a' }}>
                {sectionName}
              </h1>
            </div>
          </div>
        </div>
        <main className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-8 py-8 sm:py-12">
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: '#04315a' }}></div>
              <p className="text-gray-600">Cargando artículos...</p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`min-h-screen bg-gray-50 ${className}`}>
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-8 py-8 sm:py-12">
            <div className="text-center">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4" style={{ color: '#04315a' }}>
                {sectionName}
              </h1>
            </div>
          </div>
        </div>
        <main className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-8 py-8 sm:py-12">
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={loadArticles}
                className="px-4 py-2 rounded text-white transition-colors"
                style={{ backgroundColor: '#04315a' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#032a4d'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#04315a'}
              >
                Reintentar
              </button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      {/* Header de la sección */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-8 py-8 sm:py-12">
          <div className="text-center">
            <h1 
              className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4"
              style={{ color: '#04315a' }}
            >
              {sectionName}
            </h1>
            <p className="text-base sm:text-lg text-gray-600 max-w-3xl mx-auto">
              {getSectionDescription(sectionKey)}
            </p>
            
            {/* Línea decorativa */}
            <div className="mt-6 flex justify-center">
              <div 
                className="h-1 w-24 rounded-full"
                style={{ background: 'linear-gradient(to right, #04315a, #40f3f2)' }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <main className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-8 py-8 sm:py-12">
        
        {/* Grid de artículos */}
        {articles.length > 0 ? (
          <>
            <div className="grid gap-6 sm:gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mb-12">
              {articles.map((article) => (
                <ArticleCard 
                  key={article.id}
                  article={article}
                  layout="vertical"
                  size="medium"
                  className="h-full"
                />
              ))}
            </div>

            {/* Botón Ver todas las noticias */}
            {hasMore && (
              <div className="text-center">
                <button 
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white transition-all duration-200 hover:scale-105 transform"
                  style={{ 
                    backgroundColor: '#04315a',
                    boxShadow: '0 4px 6px -1px rgba(4, 49, 90, 0.1), 0 2px 4px -1px rgba(4, 49, 90, 0.06)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#032a4d'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#04315a'
                  }}
                  onClick={() => {
                    // TODO: Implementar navegación a página con todos los artículos
                    console.log(`Ver todas las noticias de ${sectionKey}`)
                  }}
                >
                  <span>Ver todas las noticias</span>
                  <svg
                    className="ml-2 w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </div>
            )}
          </>
        ) : (
          /* Estado vacío */
          <div className="text-center py-12">
            <div 
              className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
              style={{ backgroundColor: '#04315a' }}
            >
              <svg 
                className="w-8 h-8" 
                style={{ color: '#40f3f2' }}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
                />
              </svg>
            </div>
            <h3 
              className="text-lg font-semibold mb-2"
              style={{ color: '#04315a' }}
            >
              No hay artículos disponibles
            </h3>
            <p className="text-gray-600">
              Aún no hay artículos publicados en esta sección. Vuelve pronto para ver las últimas novedades.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}