import React, { useState, useEffect } from 'react'
import { PublicHeader } from '@/components/public/PublicHeader'
import { PublicFooter } from '@/components/public/PublicFooter'
import { ArticleCard } from '@/components/public/ArticleCard'
import { JudicialEntitiesTimeline } from '@/components/public/JudicialEntitiesTimeline'
import { WeeklyHighlights } from '@/components/public/WeeklyHighlights'
import { publicPortalService, PortalSections, getEntityDisplayName } from '@/services/publicPortalService'
import { PublicArticle, adaptApiToPublicArticle } from '@/types/publicArticle.types'
import { Clock, Building } from 'lucide-react'

export default function PublicPortalPage() {
  const [portalData, setPortalData] = useState<PortalSections | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadPortalData()
  }, [])

  const loadPortalData = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await publicPortalService.getPortalSections()
      setPortalData(data)
    } catch (err) {
      setError('Error al cargar el contenido del portal')
      console.error('Error loading portal data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (query: string) => {
    // TODO: Implementar lógica de búsqueda
    console.log('Searching for:', query)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PublicHeader onSearch={handleSearch} />
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando contenido...</p>
          </div>
        </div>
        <PublicFooter />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PublicHeader onSearch={handleSearch} />
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={loadPortalData}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Reintentar
            </button>
          </div>
        </div>
        <PublicFooter />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PublicHeader onSearch={handleSearch} />

      <main className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-8 py-8">
        {/* DOS ARTÍCULOS SUPERIORES - SECCIÓN GENERAL */}
        {portalData?.general && portalData.general.length > 0 && (
          <section className="mb-12 sm:mb-16">
            <div className="grid sm:grid-cols-2 gap-6 sm:gap-8 max-w-6xl mx-auto">
              {portalData.general.slice(0, 2).map((article) => {
                const publicArticle = adaptApiToPublicArticle(article)
                return (
                  <ArticleCard
                    key={article.id}
                    article={publicArticle}
                    layout="featured"
                    size="large"
                    className="h-full"
                  />
                )
              })}
            </div>
          </section>
        )}

        {/* SECCIÓN Últimas Noticias */}
        {portalData?.ultimasNoticias && portalData.ultimasNoticias.length > 0 && (
          <section className="mb-20 sm:mb-24">
            {/* Tarjeta moderna centrada */}
            <div className="max-w-2xl mx-auto">
              <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
                {/* Header de la tarjeta */}
                <div className="bg-gradient-to-r px-6 py-4" style={{ background: 'linear-gradient(to right, #04315a, #04315a)' }}>
                  <h3 className="font-semibold text-lg" style={{ color: '#40f3f2' }}>Últimas Noticias</h3>
                </div>

                {/* Contenido de la tarjeta */}
                <div className="p-6">
                  <div className="grid gap-4">
                    {portalData.ultimasNoticias.map((article, index) => {
                      const publicArticle = adaptApiToPublicArticle(article)
                      return (
                        <ArticleCard
                          key={article.id}
                          article={publicArticle}
                          layout="minimal"
                          className="border-none shadow-none hover:bg-gray-50 rounded-lg p-2"
                        />
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* SECCIÓN INSTITUCIONES - Timeline con datos reales */}
        {portalData?.entidades && Object.keys(portalData.entidades).length > 0 && (
          <section className="mb-16 sm:mb-20">
            <div className="flex items-center gap-3 mb-4 sm:mb-6">
              <h2 className="text-xl sm:text-2xl font-bold" style={{ color: '#04315a' }}>Instituciones</h2>
              <div className="flex-1 h-px" style={{ background: 'linear-gradient(to right, #04315a, transparent)' }}></div>
            </div>

            <div className="space-y-8">
              {Object.entries(portalData.entidades).map(([entidad, articles]) => (
                <div key={entidad} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Building className="w-5 h-5 text-blue-600" />
                    <h3 className="font-semibold text-lg text-gray-900">
                      {getEntityDisplayName(entidad)}
                    </h3>
                    <span className="text-sm text-gray-500">({articles.length} artículos)</span>
                  </div>

                  <div className="grid gap-4">
                    {articles.slice(0, 3).map((article) => {
                      const publicArticle = adaptApiToPublicArticle(article)
                      return (
                        <ArticleCard
                          key={article.id}
                          article={publicArticle}
                          layout="horizontal"
                          size="small"
                          className="border-l-4 border-blue-600"
                        />
                      )
                    })}
                  </div>

                  {articles.length > 3 && (
                    <div className="mt-4 text-center">
                      <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                        Ver más artículos de {getEntityDisplayName(entidad)} →
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}


        {/* SECCIÓN DESTACADOS DE LA SEMANA */}
        {portalData?.destacados && portalData.destacados.length > 0 && (
          <section className="mb-16 sm:mb-20">
            <div className="flex items-center gap-3 mb-4 sm:mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Destacados de la Semana</h2>
              <div className="flex-1 h-px bg-gradient-to-r from-blue-200 to-transparent"></div>
            </div>

            <div className="space-y-6 max-w-4xl mx-auto">
              {portalData.destacados.map((article) => {
                const publicArticle = adaptApiToPublicArticle(article)
                return (
                  <ArticleCard
                    key={article.id}
                    article={publicArticle}
                    layout="featured"
                    size="medium"
                    className="shadow-sm"
                  />
                )
              })}
            </div>
          </section>
        )}

      </main>
      
      {/* Footer */}
      <PublicFooter />
    </div>
  )
}