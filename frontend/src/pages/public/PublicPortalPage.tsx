import React from 'react'
import { PublicHeader } from '@/components/public/PublicHeader'
import { PublicFooter } from '@/components/public/PublicFooter'
import { ArticleCard } from '@/components/public/ArticleCard'
import { JudicialEntitiesTimeline } from '@/components/public/JudicialEntitiesTimeline'
import { WeeklyHighlights } from '@/components/public/WeeklyHighlights'
import { 
  mockArticles, 
  getLatestArticles, 
  getFeaturedArticles 
} from '@/data/mockArticles'
import { Clock } from 'lucide-react'

export default function PublicPortalPage() {
  const latestArticles = getLatestArticles(5)
  const featuredArticles = getFeaturedArticles()
  
  // Artículos individuales (después de actualidad) - empezamos desde el índice 2 ya que usamos 0 y 1 arriba
  const individualArticles = mockArticles.slice(2, 5)
  
  // Artículos después de expediente judicial
  const postExpedientArticles = mockArticles.slice(9, 11)

  const handleSearch = (query: string) => {
    console.log('Búsqueda:', query)
    // TODO: Implementar lógica de búsqueda
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PublicHeader onSearch={handleSearch} />

      <main className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-8 py-8">
        {/* DOS ARTÍCULOS SUPERIORES */}
        <section className="mb-12 sm:mb-16">
          <div className="grid sm:grid-cols-2 gap-6 sm:gap-8 max-w-6xl mx-auto">
            <ArticleCard 
              article={latestArticles[0]} 
              layout="vertical"
              size="large"
            />
            <ArticleCard 
              article={latestArticles[1]} 
              layout="vertical"
              size="large"
            />
          </div>
        </section>

        {/* SECCIÓN Últimas Noticias */}
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
                <div className="grid gap-6">
                  {latestArticles.slice(0, 5).map((article, index) => (
                    <div key={article.id} className="group flex items-start gap-0 transition-all duration-200 cursor-pointer">
                      {/* Número redondo a la izquierda */}
                      <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: '#04315a', color: '#40f3f2' }}>
                        {index + 1}
                      </div>
                      
                      {/* Línea separadora vertical */}
                      <div className="w-px bg-gray-200 mx-4 self-stretch"></div>
                      
                      {/* Contenido del artículo */}
                      <div className="flex-1 min-w-0 py-2">
                        <h4 className="text-base font-semibold text-gray-900 line-clamp-2 mb-2 group-hover:text-primary-600 transition-colors">
                          {article.title}
                        </h4>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock size={14} />
                            {new Date(article.publishedAt).toLocaleDateString('es-CO', { 
                              day: 'numeric', 
                              month: 'short',
                              year: 'numeric'
                            })}
                          </span>
                          <span>{article.readTime}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* DOS ARTÍCULOS DESPUÉS DE ACTUALIDAD */}
        <section className="mb-16 sm:mb-20">
          <div className="grid sm:grid-cols-2 gap-6 sm:gap-8 max-w-4xl mx-auto">
            {individualArticles.slice(0, 2).map((article) => (
              <ArticleCard 
                key={article.id} 
                article={article} 
                layout="vertical"
                size="large"
              />
            ))}
          </div>
        </section>

        {/* SECCIÓN EXPEDIENTE JUDICIAL - Timeline Minimalista */}
        <section className="mb-16 sm:mb-20">
          <div className="flex items-center gap-3 mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold" style={{ color: '#04315a' }}>Instituciones</h2>
            <div className="flex-1 h-px" style={{ background: 'linear-gradient(to right, #04315a, transparent)' }}></div>
          </div>
          
          <JudicialEntitiesTimeline />
        </section>

        {/* ARTÍCULOS ADICIONALES - 2 artículos después de expediente */}
        <section className="mb-16 sm:mb-20">
          <div className="grid sm:grid-cols-2 gap-6 sm:gap-8 max-w-4xl mx-auto">
            {postExpedientArticles.map((article) => (
              <ArticleCard 
                key={article.id} 
                article={article} 
                layout="vertical"
                size="large"
              />
            ))}
          </div>
        </section>

        {/* SECCIÓN DESTACADOS DE LA SEMANA - Igual que Actualidad */}
        <section className="mb-16 sm:mb-20">
          <div className="flex items-center gap-3 mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Destacados de la Semana</h2>
            <div className="flex-1 h-px bg-gradient-to-r from-accent-200 to-transparent"></div>
          </div>
          
          <div className="space-y-6 max-w-4xl mx-auto">
            {featuredArticles.map((article) => (
              <ArticleCard 
                key={article.id} 
                article={article} 
                layout="horizontal"
                className="hover:bg-gray-50 transition-colors"
              />
            ))}
          </div>
        </section>

      </main>
      
      {/* Footer */}
      <PublicFooter />
    </div>
  )
}