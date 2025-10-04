import { api } from './api'

export interface Article {
  id: string
  title: string
  slug: string
  content: string
  summary: string
  imageUrl?: string | null
  status: string
  publicationSection: string
  keywords: string
  metaTitle?: string
  metaDescription?: string
  wordCount: number
  readingTime: number
  createdAt: string
  updatedAt: string
  author: {
    id: string
    firstName: string
    lastName: string
  }
}

export interface ArticlesResponse {
  success: boolean
  articles: Article[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export const articlesService = {
  /**
   * Obtener artículos listos para publicar (READY)
   */
  async getReadyArticles(): Promise<ArticlesResponse> {
    const response = await api.get<ArticlesResponse>('/articles', {
      params: {
        status: 'READY',
        limit: 100,
        page: 1
      }
    })
    return response.data
  },

  /**
   * Obtener un artículo por ID
   */
  async getArticleById(id: string): Promise<Article> {
    const response = await api.get<{ article: Article }>(`/articles/${id}`)
    return response.data.article
  }
}
