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
  sourceDocument?: {
    id: string
    title: string
    source: string
    legalArea?: string
    publicationDate?: string
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
   * Obtener artículos con filtros opcionales
   */
  async getArticles(params?: { status?: string; limit?: number; page?: number }): Promise<ArticlesResponse> {
    const response = await api.get<any>('/articles', {
      params: {
        limit: 100,
        page: 1,
        ...params
      }
    })

    // ✅ FIX: Mapear respuesta del backend al formato esperado
    const backendResponse = response.data

    return {
      success: true,
      articles: backendResponse.data || [],
      total: backendResponse.pagination?.total || 0,
      page: backendResponse.pagination?.page || 1,
      limit: backendResponse.pagination?.limit || 20,
      totalPages: backendResponse.pagination?.totalPages || 0
    }
  },

  /**
   * Obtener artículos listos para publicar (READY)
   */
  async getReadyArticles(): Promise<ArticlesResponse> {
    return this.getArticles({ status: 'READY' })
  },

  /**
   * Obtener un artículo por ID
   */
  async getArticleById(id: string): Promise<Article> {
    const response = await api.get<{ article: Article }>(`/articles/${id}`)
    return response.data.article
  }
}
