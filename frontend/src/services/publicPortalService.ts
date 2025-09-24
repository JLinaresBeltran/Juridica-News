import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export interface PortalSections {
  general: Array<{
    id: string
    title: string
    slug: string
    summary: string
    publishedAt: string
    readingTime: number
    viewCount: number
    author: {
      firstName: string
      lastName: string
    }
  }>
  ultimasNoticias: Array<{
    id: string
    title: string
    slug: string
    publishedAt: string
    readingTime: number
  }>
  entidades: Record<string, Array<{
    id: string
    title: string
    slug: string
    summary: string
    entidadSeleccionada: string
    publishedAt: string
    readingTime: number
  }>>
  destacados: Array<{
    id: string
    title: string
    slug: string
    summary: string
    publishedAt: string
    readingTime: number
    author: {
      firstName: string
      lastName: string
    }
  }>
}

export interface ArticlesByArea {
  data: Array<{
    id: string
    title: string
    slug: string
    summary: string
    publishedAt: string
    readingTime: number
    viewCount: number
    tags: string[]
    author: {
      firstName: string
      lastName: string
    }
  }>
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export const publicPortalService = {
  /**
   * Obtiene todas las secciones del portal organizadas
   */
  async getPortalSections(): Promise<PortalSections> {
    try {
      const response = await axios.get(`${API_URL}/api/public/portal-sections`)
      return response.data.data
    } catch (error) {
      console.error('Error fetching portal sections:', error)
      // Fallback a datos vacíos en caso de error
      return {
        general: [],
        ultimasNoticias: [],
        entidades: {},
        destacados: []
      }
    }
  },

  /**
   * Obtiene artículos por área legal para las páginas de sección
   */
  async getArticlesByLegalArea(
    legalArea: string,
    page: number = 1,
    limit: number = 10
  ): Promise<ArticlesByArea> {
    try {
      const response = await axios.get(
        `${API_URL}/api/public/articles/by-legal-area/${legalArea}`,
        {
          params: { page, limit }
        }
      )
      return response.data
    } catch (error) {
      console.error(`Error fetching articles for ${legalArea}:`, error)
      return {
        data: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false
        }
      }
    }
  },

  /**
   * Obtiene un artículo específico por slug
   */
  async getArticleBySlug(slug: string) {
    try {
      const response = await axios.get(`${API_URL}/api/public/articles/${slug}`)
      return response.data.data
    } catch (error) {
      console.error(`Error fetching article ${slug}:`, error)
      return null
    }
  }
}

// Mapeo de entidades para mostrar nombres amigables
export const getEntityDisplayName = (entity: string): string => {
  const entityNames: Record<string, string> = {
    'CORTE_CONSTITUCIONAL': 'Corte Constitucional',
    'CORTE_SUPREMA': 'Corte Suprema de Justicia',
    'CONSEJO_ESTADO': 'Consejo de Estado',
    'TRIBUNAL_SUPERIOR': 'Tribunal Superior',
    'FISCALIA_GENERAL': 'Fiscalía General',
    'PROCURADURIA_GENERAL': 'Procuraduría General',
    'CONTRALORIA_GENERAL': 'Contraloría General',
    'MINISTERIO_JUSTICIA': 'Ministerio de Justicia'
  }
  return entityNames[entity] || entity
}

// Mapeo de áreas legales
export const getLegalAreaDisplayName = (area: string): string => {
  const areaNames: Record<string, string> = {
    'CIVIL': 'Derecho Civil',
    'PENAL': 'Derecho Penal',
    'MERCANTIL': 'Derecho Comercial',
    'LABORAL': 'Derecho Laboral',
    'ADMINISTRATIVO': 'Derecho Administrativo',
    'FISCAL': 'Derecho Tributario',
    'CONSTITUCIONAL': 'Derecho Constitucional'
  }
  return areaNames[area] || area
}