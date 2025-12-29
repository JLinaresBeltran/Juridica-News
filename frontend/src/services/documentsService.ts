// FUNCIÓN TEMPORAL - Servicio para obtener documentos reales del backend
import api from './api';

// ⚡ OPTIMIZACIÓN: Sistema de caché con TTL
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class MemoryCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutos

  set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > entry.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  clear(): void {
    this.cache.clear();
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  // Limpiar entradas expiradas
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

// Instancia global del cache
const documentCache = new MemoryCache();

// Ejecutar limpieza cada 1 minuto
setInterval(() => documentCache.cleanup(), 60 * 1000);

export interface DocumentFilters {
  page?: number;
  limit?: number;
  status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PROCESSING' | 'ERROR';
  source?: string;
  legalArea?: string;
  priority?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface Document {
  id: string;
  title: string;
  url: string;
  documentPath?: string; // Ruta al archivo local descargado (DOCX/RTF)
  content: string;
  summary?: string;
  source: string;
  legalArea: string;
  documentType: string;
  status: string;
  priority: string;
  publicationDate: string;
  internalId?: string;
  extractionDate: string;
  lastReviewDate?: string;
  confidenceScore: number;
  keywords: string;
  relevanceTags: string;
  externalId?: string;
  metadata: string;
  extractedAt?: string;
  userId?: string;
  curatorId?: string;
  createdAt: string;
  updatedAt: string;
  
  // AI Analysis Fields
  numeroSentencia?: string;
  magistradoPonente?: string;
  salaRevision?: string;
  temaPrincipal?: string;
  resumenIA?: string;
  decision?: string;
  aiAnalysisStatus?: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  aiAnalysisDate?: string;
  aiModel?: string;
  fragmentosAnalisis?: string;
}

export interface DocumentsResponse {
  data: Document[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface DocumentStatsResponse {
  data: {
    pending: number;
    approved: number;
    rejected: number;
    processing: number;
    total: number;
    recentlyScraped: number;
  };
}

class DocumentsService {
  /**
   * FUNCIÓN TEMPORAL - Obtener documentos con filtros
   */
  async getDocuments(filters: DocumentFilters = {}): Promise<DocumentsResponse> {
    try {
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });

      const queryString = params.toString();
      const url = queryString ? `/documents?${queryString}` : '/documents';
      
      const response = await api.get<DocumentsResponse>(url);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error fetching documents:', error.response?.data || error.message);
      // En caso de error, retornar estructura vacía
      return {
        data: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        }
      };
    }
  }

  /**
   * FUNCIÓN TEMPORAL - Obtener estadísticas de documentos
   */
  async getDocumentStats(signal?: AbortSignal): Promise<DocumentStatsResponse> {
    try {
      const response = await api.get<DocumentStatsResponse>('/documents/stats', {
        signal
      });
      return response.data;
    } catch (error: any) {
      // No loggear ni retornar datos si fue cancelado
      if (error.name === 'CanceledError' || error.code === 'ERR_CANCELED') {
        throw error;
      }
      console.error('❌ Error fetching document stats:', error.response?.data || error.message);
      // En caso de error, retornar estadísticas en cero
      return {
        data: {
          pending: 0,
          approved: 0,
          rejected: 0,
          processing: 0,
          total: 0,
          recentlyScraped: 0,
        }
      };
    }
  }

  /**
   * FUNCIÓN TEMPORAL - Obtener un documento por ID (con caché)
   */
  async getDocument(id: string): Promise<Document | null> {
    try {
      // ⚡ OPTIMIZACIÓN: Intentar obtener del caché primero
      const cacheKey = `document:${id}`;
      const cached = documentCache.get<Document>(cacheKey);

      if (cached) {
        console.log(`✅ Cache HIT: Documento ${id} obtenido del caché`);
        return cached;
      }

      console.log(`❌ Cache MISS: Descargando documento ${id} del backend`);
      const response = await api.get<{ data: Document }>(`/documents/${id}`);
      const document = response.data.data;

      // ⚡ Guardar en caché
      documentCache.set(cacheKey, document);

      return document;
    } catch (error: any) {
      console.error('❌ Error fetching document:', error.response?.data || error.message);
      return null;
    }
  }

  /**
   * FUNCIÓN TEMPORAL - Curar documento (aprobar/rechazar)
   */
  async curateDocument(id: string, action: 'approve' | 'reject', data: {
    priority?: string;
    notes?: string;
    estimatedEffort?: number;
  } = {}): Promise<Document | null> {
    try {
      const response = await api.post<{ data: Document }>(`/documents/${id}/curate`, {
        action,
        ...data
      });
      return response.data.data;
    } catch (error: any) {
      console.error('❌ Error curating document:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || `Failed to ${action} document`);
    }
  }

  /**
   * FUNCIÓN TEMPORAL - Curación en lote
   */
  async batchCurate(documents: Array<{
    id: string;
    action: 'approve' | 'reject';
    priority?: string;
    notes?: string;
  }>): Promise<{
    processed: number;
    failed: number;
    results: Array<{ id: string; status: string; action: string }>;
    errors: Array<{ id: string; error: string }>;
  }> {
    try {
      const response = await api.post('/documents/batch-curate', { documents });
      return response.data.data;
    } catch (error: any) {
      console.error('❌ Error in batch curation:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to process batch curation');
    }
  }

  /**
   * Analizar documento con IA para extraer metadatos y generar resumen
   */
  async analyzeDocument(id: string, model?: 'openai' | 'gemini'): Promise<{
    success: boolean;
    message?: string;
    data?: {
      document: Document;
      analysis: {
        metadata: any;
        aiAnalysis: any;
      };
    };
  }> {
    try {
      const queryParams = model ? `?model=${model}` : '';
      const response = await api.post(`/documents/${id}/analyze${queryParams}`);
      
      return {
        success: true,
        data: response.data.data
      };
    } catch (error: any) {
      console.error('❌ Error analyzing document:', error.response?.data || error.message);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to analyze document'
      };
    }
  }

  /**
   * Analizar múltiples documentos en lote con IA
   */
  async batchAnalyze(documentIds: string[], model?: 'openai' | 'gemini'): Promise<{
    success: boolean;
    message?: string;
    data?: {
      successful: number;
      failed: number;
      results: Array<{ id: string; title: string; success: boolean; analysis: any }>;
      errors: Array<{ id: string; title: string; error: string }>;
    };
  }> {
    try {
      const response = await api.post('/documents/batch-analyze', {
        documentIds,
        model
      });
      
      return {
        success: true,
        data: response.data.data
      };
    } catch (error: any) {
      console.error('❌ Error in batch analysis:', error.response?.data || error.message);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to process batch analysis'
      };
    }
  }

  /**
   * Obtener un documento específico por ID (con caché)
   */
  async getDocumentById(id: string): Promise<{ data: Document }> {
    try {
      // ⚡ OPTIMIZACIÓN: Intentar obtener del caché primero
      const cacheKey = `document:${id}`;
      const cached = documentCache.get<Document>(cacheKey);

      if (cached) {
        console.log(`✅ Cache HIT: Documento ${id} obtenido del caché`);
        return { data: cached };
      }

      console.log(`❌ Cache MISS: Descargando documento ${id} del backend`);
      const response = await api.get<{ data: Document }>(`/documents/${id}`);
      const document = response.data.data;

      // ⚡ Guardar en caché
      documentCache.set(cacheKey, document);

      return { data: document };
    } catch (error: any) {
      console.error('❌ Error fetching document by ID:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * ⚡ OPTIMIZACIÓN: Invalidar caché de un documento específico
   */
  invalidateCache(id: string): void {
    documentCache.delete(`document:${id}`);
    console.log(`🗑️ Caché invalidado para documento ${id}`);
  }

  /**
   * ⚡ OPTIMIZACIÓN: Limpiar todo el caché
   */
  clearCache(): void {
    documentCache.clear();
    console.log('🗑️ Caché completo limpiado');
  }
}

// FUNCIÓN TEMPORAL - Exportar instancia única del servicio
const documentsService = new DocumentsService();
export default documentsService;