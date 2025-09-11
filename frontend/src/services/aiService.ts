import apiClient from './api'
import type { AIModel } from '../components/common/ModelSelector'

// Response types
interface GeneratedArticle {
  content: string
  wordCount: number
  modelUsed: string
  generationTime: number
  metadata: {
    tone: string
    maxWords: number
    hasCustomInstructions: boolean
  }
}

interface GeneratedTitles {
  titles: string[]
  style: string
  modelUsed: string
  generationTime: number
}

interface GeneratedImages {
  requestId: string
  images: Array<{
    id: string
    url: string
    thumbnailUrl: string
    prompt: string
    style: string
    model: string
    dimensions: { width: number; height: number }
  }>
  modelUsed: string
  generationTime: number
  totalCount: number
  error?: string
}

interface ModelAvailability {
  'gpt4o-mini': boolean
  'gemini': boolean
  'dalle': boolean
}

// Request types
interface GenerateArticleRequest {
  documentId: string
  model?: AIModel
  maxWords?: number
  tone?: 'professional' | 'academic' | 'accessible'
  customInstructions?: string
}

interface GenerateTitlesRequest {
  documentId: string
  model?: AIModel
  style: 'serious' | 'catchy' | 'educational'
  count?: number
}

interface GenerateImagesRequest {
  documentId: string
  model?: 'dalle' | 'gemini'
  prompt?: string
  style?: 'professional' | 'conceptual' | 'abstract'
  count?: number
}

class AIService {
  private baseUrl = '/ai'

  /**
   * Check which AI models are available based on API keys
   */
  async checkAvailableModels(): Promise<ModelAvailability> {
    try {
      const response = await apiClient.get<{ data: ModelAvailability }>(`${this.baseUrl}/available-models`)
      return response.data.data
    } catch (error) {
      console.error('Error checking available models:', error)
      // Return default availability if check fails
      return {
        'gpt4o-mini': true,
        'gemini': true,
        'dalle': true
      }
    }
  }

  /**
   * Generate a complete article from a legal document
   */
  async generateArticle(request: GenerateArticleRequest): Promise<GeneratedArticle> {
    console.log('🔧 aiService.generateArticle() llamado')
    console.log('📋 Request completo:', request)
    
    try {
      const payload = {
        documentId: request.documentId,
        model: request.model,
        maxWords: request.maxWords || 500,
        tone: request.tone || 'professional',
        customInstructions: request.customInstructions
      }

      console.log('📤 Payload que se enviará:', payload)
      console.log('🎯 URL destino:', `${this.baseUrl}/generate-article`)

      const response = await apiClient.post<{ data: GeneratedArticle; message: string }>(
        `${this.baseUrl}/generate-article`,
        payload
      )

      console.log('📥 Respuesta recibida del servidor:', response.data)
      return response.data.data
    } catch (error: any) {
      console.error('Error generating article:', error)
      
      // Provide user-friendly error messages
      if (error.response?.status === 404) {
        throw new Error('Documento no encontrado')
      } else if (error.response?.status === 400) {
        throw new Error(error.response.data?.message || 'Parámetros de solicitud inválidos')
      } else if (error.response?.status === 500) {
        throw new Error('Error interno del servidor. Por favor intenta de nuevo.')
      } else {
        throw new Error('Error al generar artículo. Verifica tu conexión e intenta de nuevo.')
      }
    }
  }

  /**
   * Generate article titles with different styles
   */
  async generateTitles(request: GenerateTitlesRequest): Promise<GeneratedTitles> {
    try {
      const payload = {
        documentId: request.documentId,
        model: request.model,
        style: request.style,
        count: request.count || 3
      }

      const response = await apiClient.post<{ data: GeneratedTitles; message: string }>(
        `${this.baseUrl}/generate-titles`,
        payload
      )

      return response.data.data
    } catch (error: any) {
      console.error('Error generating titles:', error)
      
      if (error.response?.status === 404) {
        throw new Error('Documento no encontrado')
      } else if (error.response?.status === 400) {
        throw new Error(error.response.data?.message || 'Parámetros de solicitud inválidos')
      } else if (error.response?.status === 500) {
        throw new Error('Error interno del servidor. Por favor intenta de nuevo.')
      } else {
        throw new Error('Error al generar títulos. Verifica tu conexión e intenta de nuevo.')
      }
    }
  }

  /**
   * Generate images for articles
   */
  async generateImages(request: GenerateImagesRequest): Promise<GeneratedImages | null> {
    try {
      const payload = {
        documentId: request.documentId,
        model: request.model,
        prompt: request.prompt,
        style: request.style || 'professional',
        count: request.count || 1
      }

      const response = await apiClient.post<{ data: GeneratedImages; message: string }>(
        `${this.baseUrl}/generate-images`,
        payload
      )

      return response.data.data
    } catch (error: any) {
      console.error('Error generating images:', error)
      
      // Return null instead of throwing, let the frontend handle the error display
      return null
    }
  }

  /**
   * Utility method to validate if a model is available for a specific purpose
   */
  async validateModelForPurpose(model: AIModel | 'dalle', purpose: 'article' | 'title' | 'image'): Promise<boolean> {
    const availability = await this.checkAvailableModels()
    
    switch (purpose) {
      case 'article':
      case 'title':
        return model === 'gpt4o-mini' ? availability['gpt4o-mini'] : availability['gemini']
      case 'image':
        return model === 'dalle' ? availability['dalle'] : availability['gemini']
      default:
        return false
    }
  }

  /**
   * Get recommended model for a specific purpose
   */
  async getRecommendedModel(purpose: 'article' | 'title' | 'image'): Promise<AIModel | 'dalle' | null> {
    const availability = await this.checkAvailableModels()
    
    switch (purpose) {
      case 'article':
        // Prefer GPT-4o mini for articles
        if (availability['gpt4o-mini']) return 'gpt4o-mini'
        if (availability['gemini']) return 'gemini'
        return null
      
      case 'title':
        // GPT-4o mini is good for creative titles
        if (availability['gpt4o-mini']) return 'gpt4o-mini'
        if (availability['gemini']) return 'gemini'
        return null
      
      case 'image':
        // Prefer DALL-E for images
        if (availability['dalle']) return 'dalle'
        if (availability['gemini']) return 'gemini'
        return null
      
      default:
        return null
    }
  }

  /**
   * Estimate generation time based on model and task
   */
  estimateGenerationTime(model: AIModel | 'dalle', purpose: 'article' | 'title' | 'image'): number {
    // Return estimated time in seconds
    const baseTimes = {
      'gpt4o-mini': { article: 15, title: 8, image: 0 },
      'gemini': { article: 12, title: 6, image: 20 },
      'dalle': { article: 0, title: 0, image: 30 }
    }

    return baseTimes[model]?.[purpose] || 10
  }

  /**
   * Format error messages for UI display
   */
  formatErrorMessage(error: Error): string {
    const message = error.message.toLowerCase()
    
    if (message.includes('network') || message.includes('connection')) {
      return 'Problema de conexión. Verifica tu internet e intenta de nuevo.'
    } else if (message.includes('timeout')) {
      return 'La solicitud tomó demasiado tiempo. Por favor intenta de nuevo.'
    } else if (message.includes('api key') || message.includes('unauthorized')) {
      return 'Error de autenticación. Contacta al administrador.'
    } else if (message.includes('rate limit') || message.includes('quota')) {
      return 'Límite de uso alcanzado. Por favor espera unos minutos e intenta de nuevo.'
    } else {
      return error.message || 'Error desconocido al procesar la solicitud.'
    }
  }
}

// Export singleton instance
export const aiService = new AIService()
export default aiService

// Export types for use in components
export type {
  GeneratedArticle,
  GeneratedTitles,
  GeneratedImages,
  ModelAvailability,
  GenerateArticleRequest,
  GenerateTitlesRequest,
  GenerateImagesRequest
}