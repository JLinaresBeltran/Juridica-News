import React from 'react'
import { ArticleCard } from './ArticleCard'
import { 
  getArticlesByCategory, 
  getArticleCountByCategory, 
  getSectionDisplayName 
} from '@/data/mockArticles'

interface SectionPageProps {
  sectionKey: string // 'civil', 'penal', etc.
  className?: string
}

export const SectionPage: React.FC<SectionPageProps> = ({ 
  sectionKey, 
  className = '' 
}) => {
  const sectionName = getSectionDisplayName(sectionKey)
  const articles = getArticlesByCategory(sectionKey, 10) // Máximo 10 artículos
  const totalCount = getArticleCountByCategory(sectionKey)
  const hasMore = totalCount > 10

  const getSectionDescription = (key: string): string => {
    const descriptions: Record<string, string> = {
      'digital': 'Noticias sobre transformación digital del sector jurídico, tecnología legal y innovación.',
      'civil': 'Actualidad en derecho civil, contratos, responsabilidad civil y derecho de las personas.',
      'penal': 'Jurisprudencia penal, política criminal y desarrollo del sistema penal acusatorio.',
      'familia': 'Derecho de familia, adopción, régimen patrimonial y protección de menores.',
      'laboral': 'Legislación laboral, derechos de los trabajadores y relaciones laborales.',
      'tributario': 'Normativa fiscal, jurisprudencia tributaria y política fiscal.',
      'comercial': 'Derecho mercantil, sociedades, títulos valores y derecho de la competencia.',
      'administrativo': 'Contratación estatal, función pública y control fiscal.',
      'opinion': 'Análisis y opiniones de expertos sobre temas jurídicos de actualidad.'
    }
    return descriptions[key] || 'Contenido especializado en esta área del derecho.'
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
                  <span 
                    className="ml-2 px-2 py-1 rounded-full text-sm font-semibold"
                    style={{ 
                      backgroundColor: '#40f3f2',
                      color: '#04315a'
                    }}
                  >
                    {totalCount}
                  </span>
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