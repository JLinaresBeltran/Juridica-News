import { api } from './api'

export interface ScrapingSource {
  id: string
  name: string
  description: string
  enabled: boolean
}

export interface ExtractionRequest {
  source: string
  limit?: number
}

export interface ExtractionResult {
  success: boolean
  documents: Array<{
    document_id: string
    title: string
    source: string
    court: string
    document_type: string
    pdf_url: string
    html_url: string
    date: string
    extraction_date: string
    magistrate: string
  }>
  downloadedCount: number
  extractionTime: number
  totalFound: number
}

export interface ExtractionProgress {
  status: 'started' | 'processing' | 'completed' | 'error'
  message: string
  progress?: number
  documentsFound?: number
  documentsProcessed?: number
  error?: string
}

export const scrapingService = {
  /**
   * Get available scraping sources
   */
  async getSources(): Promise<ScrapingSource[]> {
    try {
      const response = await api.get('/scraping/sources')
      return response.data.data || response.data
    } catch (error: any) {
      console.error('Error fetching scraping sources:', error)
      throw new Error(error.response?.data?.message || 'Failed to fetch scraping sources')
    }
  },

  /**
   * Start document extraction from a specific source
   */
  async extractDocuments(request: ExtractionRequest): Promise<ExtractionResult> {
    try {
      const response = await api.post('/scraping/extract', request, {
        timeout: 120000, // 2 minutes timeout for scraping operations
      })
      return response.data.data || response.data
    } catch (error: any) {
      console.error('Error extracting documents:', error)
      throw new Error(error.response?.data?.message || 'Failed to extract documents')
    }
  },

  /**
   * Start extraction for Corte Constitucional (default source)
   */
  async extractCorteConstitucional(limit: number = 10): Promise<ExtractionResult> {
    return this.extractDocuments({
      source: 'corte_constitucional',
      limit
    })
  },

  /**
   * Get extraction status/progress (if implemented)
   */
  async getExtractionStatus(extractionId: string): Promise<ExtractionProgress> {
    try {
      const response = await api.get(`/scraping/status/${extractionId}`)
      return response.data.data || response.data
    } catch (error: any) {
      console.error('Error fetching extraction status:', error)
      throw new Error(error.response?.data?.message || 'Failed to fetch extraction status')
    }
  },

  /**
   * Cancel ongoing extraction (if implemented)
   */
  async cancelExtraction(extractionId: string): Promise<void> {
    try {
      await api.delete(`/scraping/extract/${extractionId}`)
    } catch (error: any) {
      console.error('Error canceling extraction:', error)
      throw new Error(error.response?.data?.message || 'Failed to cancel extraction')
    }
  }
}

export default scrapingService