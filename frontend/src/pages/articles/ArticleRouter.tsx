import { useSearchParams } from 'react-router-dom'
import ArticlesPage from './ArticlesPage'
import PublishedArticlesPage from './PublishedArticlesPage'
import ArchivedArticlesPage from './ArchivedArticlesPage'

export default function ArticleRouter() {
  const [searchParams] = useSearchParams()
  const status = searchParams.get('status')

  // Determinar qué página mostrar basado en el parámetro status
  switch (status) {
    case 'published':
      return <PublishedArticlesPage />
    case 'ready':
      return <ArticlesPage />
    case 'archived':
      return <ArchivedArticlesPage />
    default:
      // Si no hay status o es desconocido, mostrar "Listos" por defecto
      return <ArticlesPage />
  }
}