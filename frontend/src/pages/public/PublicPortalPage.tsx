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
        {/* ✅ BLOQUE 1: GENERAL TOP (Posiciones 1-2) - Parte superior del portal */}
        {portalData?.generalTop && portalData.generalTop.length > 0 && (
          <section className="mb-12 sm:mb-16">
            <div className="grid sm:grid-cols-2 gap-6 sm:gap-8 max-w-6xl mx-auto">
              {portalData.generalTop.map((article) => {
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
                  <div className="space-y-1">
                    {portalData.ultimasNoticias.map((article, index) => {
                      const publicArticle = adaptApiToPublicArticle(article)
                      return (
                        <ArticleCard
                          key={article.id}
                          article={publicArticle}
                          layout="numbered"
                          index={index}
                        />
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ✅ BLOQUE 2: GENERAL MIDDLE (Posiciones 3-4) - Debajo de Últimas Noticias */}
        {portalData?.generalMiddle && portalData.generalMiddle.length > 0 && (
          <section className="mb-12 sm:mb-16">
            <div className="grid sm:grid-cols-2 gap-6 sm:gap-8 max-w-6xl mx-auto">
              {portalData.generalMiddle.map((article) => {
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

        {/* SECCIÓN INSTITUCIONES - Diseño minimalista y elegante */}
        {portalData?.entidades && Object.keys(portalData.entidades).length > 0 && (
          <section className="mb-16 sm:mb-20">
            <div className="flex items-center gap-3 mb-6 sm:mb-8">
              <h2 className="text-xl sm:text-2xl font-bold" style={{ color: '#04315a' }}>Instituciones</h2>
              <div className="flex-1 h-px" style={{ background: 'linear-gradient(to right, #04315a, transparent)' }}></div>
            </div>

            <div className="space-y-8 max-w-4xl mx-auto">
              {Object.entries(portalData.entidades).map(([entidad, articles]) => (
                <div key={entidad} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  {/* Header de la institución con diseño elegante */}
                  <div
                    className="px-6 py-4"
                    style={{
                      background: 'linear-gradient(135deg, #04315a 0%, #053d6f 100%)',
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <Building className="w-5 h-5" style={{ color: '#40f3f2' }} />
                      <h3 className="font-bold text-lg text-white">
                        {getEntityDisplayName(entidad)}
                      </h3>
                    </div>
                  </div>

                  {/* Lista de artículos con diseño minimalista */}
                  <div className="divide-y divide-gray-100">
                    {articles.slice(0, 3).map((article) => {
                      const publicArticle = adaptApiToPublicArticle(article)
                      return (
                        <ArticleCard
                          key={article.id}
                          article={publicArticle}
                          layout="institutional"
                          size="small"
                        />
                      )
                    })}
                  </div>

                  {/* Footer con botón de ver más */}
                  {articles.length > 3 && (
                    <div
                      className="px-6 py-3 text-center border-t border-gray-100"
                      style={{ backgroundColor: '#fafafa' }}
                    >
                      <button
                        className="text-sm font-medium transition-colors hover:underline"
                        style={{ color: '#04315a' }}
                      >
                        Ver todos los artículos de {getEntityDisplayName(entidad)}
                        <span className="ml-1" style={{ color: '#40f3f2' }}>→</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}


        {/* ✅ BLOQUE 3: GENERAL BOTTOM (Posiciones 5-6) - Debajo de Instituciones */}
        {portalData?.generalBottom && portalData.generalBottom.length > 0 && (
          <section className="mb-12 sm:mb-16">
            <div className="grid sm:grid-cols-2 gap-6 sm:gap-8 max-w-6xl mx-auto">
              {portalData.generalBottom.map((article) => {
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

        {/* SECCIÓN DESTACADOS DE LA SEMANA */}
        {portalData?.destacados && portalData.destacados.length > 0 && (
          <section className="mb-16 sm:mb-20">
            <div className="flex items-center gap-3 mb-4 sm:mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Destacados de la Semana</h2>
              <div className="flex-1 h-px bg-gradient-to-r from-blue-200 to-transparent"></div>
            </div>

            <div className="space-y-4 max-w-3xl mx-auto">
              {portalData.destacados.map((article) => {
                const publicArticle = adaptApiToPublicArticle(article)
                return (
                  <ArticleCard
                    key={article.id}
                    article={publicArticle}
                    layout="horizontal"
                    size="small"
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