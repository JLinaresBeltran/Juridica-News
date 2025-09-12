/**
 * Servicio base abstracto para scrapers
 * Sistema Editorial Jurídico Supervisado
 */

import { EventEmitter } from 'events';
import { logger } from '@/utils/logger';
import {
  ExtractionParameters,
  ExtractionResult,
  ExtractedDocument,
  SourceMetadata,
  ScrapingProgress,
  JobStatus,
  SourceHealth
} from './types';

export abstract class BaseScrapingService extends EventEmitter {
  protected sourceId: string;
  protected metadata: SourceMetadata;
  protected isRunning: boolean = false;
  protected currentJobId?: string;
  protected lastHealth: SourceHealth;

  constructor(sourceId: string, metadata: SourceMetadata) {
    super();
    this.sourceId = sourceId;
    this.metadata = metadata;
    this.lastHealth = {
      sourceId,
      status: 'HEALTHY',
      lastCheck: new Date(),
      responseTime: 0,
      successRate: 100,
      errorRate: 0
    };
  }

  /**
   * Método principal para extraer documentos - debe ser implementado por cada scraper
   */
  abstract extractDocuments(parameters: ExtractionParameters): Promise<ExtractionResult>;

  /**
   * Validar un documento extraído - puede ser sobrescrito por implementaciones específicas
   */
  protected validateDocument(document: any): ExtractedDocument | null {
    if (!document.title || !document.url || !document.documentId) {
      logger.warn(`Documento inválido en ${this.sourceId}: faltan campos requeridos`, document);
      return null;
    }

    return {
      documentId: String(document.documentId),
      title: String(document.title),
      source: this.sourceId,
      url: String(document.url),
      content: document.content || '',
      summary: document.summary || '',
      documentType: document.documentType || 'DOCUMENT',
      legalArea: document.legalArea || 'GENERAL',
      publicationDate: document.publicationDate ? new Date(document.publicationDate) : new Date(),
      extractionDate: new Date(),
      metadata: document.metadata || {}
    };
  }

  /**
   * Verificar la salud del servicio
   */
  async checkHealth(): Promise<SourceHealth> {
    const startTime = Date.now();
    
    try {
      await this.performHealthCheck();
      const responseTime = Date.now() - startTime;
      
      this.lastHealth = {
        ...this.lastHealth,
        status: 'HEALTHY',
        lastCheck: new Date(),
        responseTime,
        lastError: undefined
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      this.lastHealth = {
        ...this.lastHealth,
        status: 'DOWN',
        lastCheck: new Date(),
        responseTime,
        lastError: errorMessage
      };
      
      logger.error(`Health check falló para ${this.sourceId}:`, error);
    }

    return this.lastHealth;
  }

  /**
   * Implementación específica del health check - puede ser sobrescrita
   */
  protected async performHealthCheck(): Promise<void> {
    // Verificación básica de conectividad - cada scraper puede implementar la suya
    try {
      const response = await fetch(this.metadata.baseUrl, {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      throw new Error(`No se puede conectar a ${this.metadata.baseUrl}: ${error}`);
    }
  }

  /**
   * Actualizar progreso del trabajo actual
   */
  protected updateProgress(progress: Partial<ScrapingProgress>): void {
    if (!this.currentJobId) return;

    const progressData: ScrapingProgress = {
      jobId: this.currentJobId,
      status: JobStatus.RUNNING,
      progress: 0,
      message: 'Procesando...',
      ...progress
    };

    this.emit('progress', progressData);
    logger.info(`Progreso ${this.sourceId} (${this.currentJobId}): ${progressData.progress}% - ${progressData.message}`);
  }

  /**
   * Ejecutar extracción con manejo de errores y progreso
   */
  async executeExtraction(jobId: string, parameters: ExtractionParameters): Promise<ExtractionResult> {
    if (this.isRunning) {
      throw new Error(`El scraper ${this.sourceId} ya está ejecutándose`);
    }

    this.isRunning = true;
    this.currentJobId = jobId;

    try {
      logger.info(`🚀 Iniciando extracción ${this.sourceId} - Job: ${jobId}`, parameters);
      
      this.updateProgress({
        status: JobStatus.RUNNING,
        progress: 0,
        message: 'Iniciando extracción...'
      });

      const result = await this.extractDocuments(parameters);
      
      this.updateProgress({
        status: JobStatus.COMPLETED,
        progress: 100,
        message: `Completado - ${result.documents.length} documentos extraídos`,
        documentsFound: result.totalFound,
        documentsProcessed: result.documents.length
      });

      logger.info(`✅ Extracción completada ${this.sourceId} - ${result.documents.length} documentos`);
      
      // Actualizar métricas de salud
      this.lastHealth.successRate = Math.min(100, this.lastHealth.successRate + 1);
      this.lastHealth.errorRate = Math.max(0, this.lastHealth.errorRate - 1);

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`❌ Error en extracción ${this.sourceId}:`, error);
      
      this.updateProgress({
        status: JobStatus.FAILED,
        progress: 0,
        message: `Error: ${errorMessage}`
      });

      // Actualizar métricas de salud
      this.lastHealth.errorRate = Math.min(100, this.lastHealth.errorRate + 1);
      this.lastHealth.successRate = Math.max(0, this.lastHealth.successRate - 1);
      
      throw error;
      
    } finally {
      this.isRunning = false;
      this.currentJobId = undefined;
    }
  }

  /**
   * Cancelar extracción en curso
   */
  async cancelExtraction(): Promise<void> {
    if (!this.isRunning || !this.currentJobId) {
      return;
    }

    logger.info(`⏹️ Cancelando extracción ${this.sourceId} - Job: ${this.currentJobId}`);
    
    this.updateProgress({
      status: JobStatus.CANCELLED,
      progress: 0,
      message: 'Cancelado por el usuario'
    });

    this.isRunning = false;
    this.currentJobId = undefined;
  }

  /**
   * Obtener metadatos del scraper
   */
  getMetadata(): SourceMetadata {
    return { ...this.metadata };
  }

  /**
   * Obtener estado actual
   */
  getStatus() {
    return {
      sourceId: this.sourceId,
      isRunning: this.isRunning,
      currentJobId: this.currentJobId,
      health: this.lastHealth,
      metadata: this.metadata
    };
  }

  /**
   * Configurar parámetros específicos del scraper
   */
  configure(config: Partial<SourceMetadata['configuration']>): void {
    this.metadata.configuration = {
      ...this.metadata.configuration,
      ...config
    };
    
    logger.info(`🔧 Configuración actualizada para ${this.sourceId}:`, config);
  }

  /**
   * Limpiar recursos del scraper
   */
  async cleanup(): Promise<void> {
    if (this.isRunning) {
      await this.cancelExtraction();
    }
    
    this.removeAllListeners();
    logger.info(`🧹 Recursos limpiados para ${this.sourceId}`);
  }
}