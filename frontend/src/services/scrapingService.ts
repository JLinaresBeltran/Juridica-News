import { api } from './api'

export interface ScrapingSource {
  id: string
  name: string
  description: string
  enabled: boolean
}

export interface ExtractionRequest {
  sourceId: string
  limit?: number
  downloadDocuments?: boolean
  dateRange?: {
    from: string
    to: string
  }
  documentTypes?: string[]
}

export interface ExtractionResult {
  success: boolean
  message: string
  data: {
    jobId: string
    documents: Array<{
      documentId: string
      title: string
      source: string
      url: string
      documentType: string
      legalArea: string
      publicationDate: string
      extractionDate: string
    }>
    totalFound: number
    extractionTime: number
    downloadedCount: number
  }
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
      const response = await api.get('/scraping/v2/sources')
      return response.data.data?.sources || response.data.sources || response.data
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
      const response = await api.post('/scraping/v2/extract', request, {
        timeout: 600000, // 10 minutes timeout for scraping operations
      })
      return response.data
    } catch (error: any) {
      console.error('Error extracting documents:', error)
      throw new Error(error.response?.data?.message || 'Failed to extract documents')
    }
  },

  /**
   * Start extraction for Corte Constitucional (default source)
   */
  async extractCorteConstitucional(limit: number = 10, downloadDocuments: boolean = true): Promise<ExtractionResult> {
    return this.extractDocuments({
      sourceId: 'corte-constitucional',
      limit,
      downloadDocuments
    })
  },

  /**
   * Get extraction job status/progress
   */
  async getJobStatus(jobId: string): Promise<ExtractionProgress> {
    try {
      const response = await api.get(`/scraping/v2/jobs/${jobId}`)
      return response.data.data || response.data
    } catch (error: any) {
      console.error('Error fetching job status:', error)
      throw new Error(error.response?.data?.message || 'Failed to fetch job status')
    }
  },

  /**
   * Cancel ongoing extraction job
   */
  async cancelJob(jobId: string): Promise<void> {
    try {
      await api.post(`/scraping/v2/jobs/${jobId}/cancel`)
    } catch (error: any) {
      console.error('Error canceling job:', error)
      throw new Error(error.response?.data?.message || 'Failed to cancel job')
    }
  },

  /**
   * Get scraping system statistics
   */
  async getStats(): Promise<any> {
    try {
      const response = await api.get('/scraping/v2/stats')
      return response.data.data || response.data
    } catch (error: any) {
      console.error('Error fetching scraping stats:', error)
      throw new Error(error.response?.data?.message || 'Failed to fetch scraping stats')
    }
  }
}

export default scrapingService