/**
 * Orquestador principal del sistema de scraping modular
 * Sistema Editorial Jurídico Supervisado
 */

import { EventEmitter } from 'events';
import { PrismaClient } from '@prisma/client';
import { logger } from '@/utils/logger';
import { sseController } from '@/controllers/sse';
import { SourceRegistry } from '@/scrapers/base/SourceRegistry';
import { BaseScrapingService } from '@/scrapers/base/BaseScrapingService';
import { QueueManager } from './QueueManager';
import {
  ExtractionParameters,
  ExtractionResult,
  ScrapingJob,
  JobStatus,
  ScrapingProgress,
  SourceMetadata,
  ScrapingStats
} from '@/scrapers/base/types';

const prisma = new PrismaClient();

export class ScrapingOrchestrator extends EventEmitter {
  private registry: SourceRegistry;
  private queueManager: QueueManager;
  private activeJobs: Map<string, ScrapingJob> = new Map();
  private isInitialized = false;

  constructor() {
    super();
    this.registry = new SourceRegistry();
    this.queueManager = new QueueManager(this);
    this.setupRegistryListeners();
  }

  /**
   * Registrar un nuevo scraper en el sistema
   */
  registerScraper(scraper: BaseScrapingService): void {
    this.registry.register(scraper);
    logger.info(`🔗 Scraper registrado en orquestador: ${scraper.getMetadata().id}`);
  }

  /**
   * Obtener todas las fuentes disponibles
   */
  getAvailableSources(): SourceMetadata[] {
    return this.registry.getAllSources();
  }

  /**
   * Obtener fuentes activas
   */
  getActiveSources(): SourceMetadata[] {
    return this.registry.getActiveSources();
  }

  /**
   * Verificar si una fuente está disponible
   */
  isSourceAvailable(sourceId: string): boolean {
    return this.registry.isSourceAvailable(sourceId);
  }

  /**
   * Extraer documentos de una fuente específica
   */
  async extractDocuments(
    sourceId: string, 
    parameters: ExtractionParameters, 
    userId?: string
  ): Promise<{ jobId: string; result?: ExtractionResult }> {
    
    // Verificar que la fuente existe
    if (!this.registry.isSourceAvailable(sourceId)) {
      throw new Error(`Fuente no disponible: ${sourceId}`);
    }

    // Generar ID del trabajo
    const jobId = this.generateJobId(sourceId);

    // Guardar en base de datos
    try {
      await prisma.extractionHistory.create({
        data: {
          id: jobId,
          source: sourceId,
          userId: userId || null,
          status: 'running',
          parameters: JSON.stringify(parameters),
          startedAt: new Date()
        }
      });
    } catch (error) {
      logger.warn('⚠️ No se pudo crear registro en extractionHistory:', error);
    }

    // Ejecutar inmediatamente (para testing) - en producción usaría colas
    try {
      const scraper = this.registry.getScraper(sourceId);
      if (!scraper) {
        throw new Error(`Scraper no encontrado: ${sourceId}`);
      }

      logger.info(`🚀 Ejecutando trabajo directo: ${jobId} - Fuente: ${sourceId}`);
      
      // 🔍 DEBUG: Log de parámetros que llegan al orquestador
      logger.info('🛠️ DEBUG - Parámetros que llegan al orquestador:', {
        jobId,
        sourceId,
        parameters
      });
      
      const result = await scraper.executeExtraction(jobId, parameters);
      
      // Guardar documentos en la base de datos
      const savedDocuments = await this.saveDocumentsToDatabase(result.documents, userId);
      
      // Actualizar resultado con documentos guardados
      result.documents = savedDocuments;

      // Actualizar registro en base de datos
      await this.updateJobInDatabase({ 
        id: jobId, 
        sourceId, 
        userId, 
        parameters, 
        status: JobStatus.COMPLETED,
        createdAt: new Date(),
        updatedAt: new Date(),
        completedAt: new Date(),
        result 
      }, result);

      logger.info(`✅ Trabajo completado: ${jobId} - ${result.documents.length} documentos`);
      
      return { jobId, result };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      await this.updateJobInDatabase({ 
        id: jobId, 
        sourceId, 
        userId, 
        parameters, 
        status: JobStatus.FAILED,
        createdAt: new Date(),
        updatedAt: new Date(),
        completedAt: new Date(),
        error: errorMessage 
      });
      
      logger.error(`❌ Trabajo falló: ${jobId} -`, error);
      throw error;
    }
  }

  /**
   * Ejecutar un trabajo de scraping
   */
  private async executeJob(job: ScrapingJob): Promise<{ jobId: string; result: ExtractionResult }> {
    const scraper = this.registry.getScraper(job.sourceId);
    if (!scraper) {
      throw new Error(`Scraper no encontrado: ${job.sourceId}`);
    }

    this.activeJobs.set(job.id, job);
    job.status = JobStatus.RUNNING;
    job.startedAt = new Date();
    job.updatedAt = new Date();

    try {
      logger.info(`🚀 Ejecutando trabajo: ${job.id} - Fuente: ${job.sourceId}`);
      
      this.sendJobUpdate(job, 'Iniciando extracción...');

      const result = await scraper.executeExtraction(job.id, job.parameters);
      
      // Guardar documentos en la base de datos
      const savedDocuments = await this.saveDocumentsToDatabase(result.documents, job.userId);
      
      // Actualizar resultado con documentos guardados
      result.documents = savedDocuments;
      
      job.status = JobStatus.COMPLETED;
      job.completedAt = new Date();
      job.updatedAt = new Date();
      job.result = result;

      // Actualizar registro en base de datos
      await this.updateJobInDatabase(job, result);

      this.sendJobUpdate(job, `Completado - ${result.documents.length} documentos procesados`);
      
      logger.info(`✅ Trabajo completado: ${job.id} - ${result.documents.length} documentos`);
      
      this.emit('job_completed', { job, result });
      
      return { jobId: job.id, result };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      job.status = JobStatus.FAILED;
      job.completedAt = new Date();
      job.updatedAt = new Date();
      job.error = errorMessage;

      await this.updateJobInDatabase(job);
      
      this.sendJobUpdate(job, `Error: ${errorMessage}`);
      
      logger.error(`❌ Trabajo falló: ${job.id} -`, error);
      
      this.emit('job_failed', { job, error });
      
      throw error;
      
    } finally {
      this.activeJobs.delete(job.id);
      this.processNextInQueue();
    }
  }

  /**
   * Guardar documentos extraídos en la base de datos
   */
  private async saveDocumentsToDatabase(documents: any[], userId?: string): Promise<any[]> {
    const savedDocuments: any[] = [];

    for (const doc of documents) {
      try {
        // Verificar si ya existe
        const existing = await prisma.document.findFirst({
          where: {
            OR: [
              { externalId: doc.documentId },
              { url: doc.url }
            ]
          }
        });

        if (existing) {
          logger.info(`📄 Documento ya existe: ${doc.documentId}`);
          savedDocuments.push(existing);
          continue;
        }

        // 🔍 DEBUG: Verificar estructura completa de metadatos recibidos
        logger.info(`🔍 DEBUG - Estructura de metadatos recibidos para ${doc.documentId}:`, {
          hasMetadata: !!doc.metadata,
          metadataKeys: doc.metadata ? Object.keys(doc.metadata) : [],
          hasExtractedMetadata: !!(doc.metadata?.extractedMetadata),
          extractedMetadata: doc.metadata?.extractedMetadata
        });
        
        // Extraer metadatos específicos si están disponibles
        const extractedMetadata = doc.metadata?.extractedMetadata;
        let magistradoPonente = null;
        let expediente = null;
        let salaRevision = null;
        let numeroSentencia = null;
        
        if (extractedMetadata) {
          magistradoPonente = extractedMetadata.magistradoPonente || null;
          expediente = extractedMetadata.expediente || null;
          salaRevision = extractedMetadata.salaRevision || null;
          numeroSentencia = extractedMetadata.numeroSentencia || null;
          
          logger.info(`📋 Mapeando metadatos para ${doc.documentId}: Magistrado: ${magistradoPonente || 'N/A'}, Expediente: ${expediente || 'N/A'}, Sala: ${salaRevision || 'N/A'}`);
        } else {
          logger.warn(`⚠️ NO se encontraron extractedMetadata para ${doc.documentId}`);
        }
        
        // Crear nuevo documento
        const savedDocument = await prisma.document.create({
          data: {
            title: doc.title,
            content: doc.content || '',
            summary: doc.summary || `Documento ${doc.documentId} extraído de ${doc.source}`,
            source: doc.source,
            url: doc.url,
            externalId: doc.documentId,
            metadata: JSON.stringify(doc.metadata),
            status: 'PENDING',
            extractedAt: doc.extractionDate,
            userId: userId || null,
            legalArea: doc.legalArea || 'GENERAL',
            documentType: doc.documentType || 'DOCUMENT',
            publicationDate: doc.publicationDate,
            // Mapear metadatos extraídos a campos específicos
            magistradoPonente: magistradoPonente,
            expediente: expediente,
            salaRevision: salaRevision,
            numeroSentencia: numeroSentencia
          }
        });

        savedDocuments.push(savedDocument);
        logger.info(`✅ Documento guardado: ${doc.documentId} -> ID: ${savedDocument.id}`);

      } catch (error) {
        logger.error(`❌ Error guardando documento ${doc.documentId}:`, error);
      }
    }

    return savedDocuments;
  }

  /**
   * Actualizar trabajo en la base de datos
   */
  private async updateJobInDatabase(job: ScrapingJob, result?: ExtractionResult): Promise<void> {
    try {
      await prisma.extractionHistory.update({
        where: { id: job.id },
        data: {
          status: job.status.toLowerCase(),
          documentsFound: result?.totalFound || 0,
          documentsProcessed: result?.documents.length || 0,
          executionTime: result?.extractionTime || 0,
          completedAt: job.completedAt,
          error: job.error || null,
          results: result ? JSON.stringify({
            success: result.success,
            documents: result.documents.slice(0, 5).map(d => ({
              id: d.documentId || d.id,
              title: d.title,
              url: d.url
            }))
          }) : null
        }
      });
    } catch (error) {
      logger.warn('⚠️ No se pudo actualizar registro en extractionHistory:', error);
    }
  }

  /**
   * Enviar actualización del trabajo vía SSE
   */
  private sendJobUpdate(job: ScrapingJob, message: string): void {
    if (!job.userId) return;

    const progress: ScrapingProgress = {
      jobId: job.id,
      status: job.status,
      progress: job.status === JobStatus.COMPLETED ? 100 : 
               job.status === JobStatus.RUNNING ? 50 : 0,
      message,
      documentsFound: job.result?.totalFound,
      documentsProcessed: job.result?.documents.length
    };

    sseController.sendEvent(job.userId, 'scraping_progress', progress);
  }

  /**
   * Procesar siguiente trabajo en la cola
   */
  private processNextInQueue(): void {
    if (this.jobQueue.length === 0 || this.activeJobs.size >= this.maxConcurrentJobs) {
      return;
    }

    const nextJob = this.jobQueue.shift();
    if (nextJob) {
      this.executeJob(nextJob).catch(error => {
        logger.error(`Error procesando trabajo de la cola: ${nextJob.id}`, error);
      });
    }
  }

  /**
   * Iniciar procesador de cola
   */
  private startQueueProcessor(): void {
    this.isProcessingQueue = true;
    
    setInterval(() => {
      this.processNextInQueue();
    }, 5000); // Revisar cola cada 5 segundos

    logger.info('🔄 Procesador de cola iniciado');
  }

  /**
   * Obtener estado de un trabajo
   */
  async getJobStatus(jobId: string): Promise<ScrapingJob | null> {
    // Primero verificar trabajos activos en memoria
    const activeJob = this.activeJobs.get(jobId);
    if (activeJob) {
      return activeJob;
    }

    // Verificar en la cola
    const queuedJob = this.jobQueue.find(job => job.id === jobId);
    if (queuedJob) {
      return queuedJob;
    }

    // Buscar en la base de datos
    try {
      const extraction = await prisma.extractionHistory.findUnique({
        where: { id: jobId }
      });

      if (!extraction) {
        return null;
      }

      return {
        id: extraction.id,
        sourceId: extraction.source,
        userId: extraction.userId || undefined,
        parameters: JSON.parse(extraction.parameters || '{}'),
        status: extraction.status.toUpperCase() as JobStatus,
        createdAt: extraction.startedAt,
        updatedAt: extraction.completedAt || extraction.startedAt,
        startedAt: extraction.startedAt,
        completedAt: extraction.completedAt || undefined,
        error: extraction.error || undefined
      };
    } catch (error) {
      logger.error('Error obteniendo estado del trabajo:', error);
      return null;
    }
  }

  /**
   * Cancelar un trabajo
   */
  async cancelJob(jobId: string): Promise<boolean> {
    // Verificar si está activo
    const activeJob = this.activeJobs.get(jobId);
    if (activeJob) {
      const scraper = this.registry.getScraper(activeJob.sourceId);
      if (scraper) {
        await scraper.cancelExtraction();
        this.activeJobs.delete(jobId);
        logger.info(`⏹️ Trabajo cancelado: ${jobId}`);
        return true;
      }
    }

    logger.warn(`⚠️ Trabajo no encontrado para cancelar: ${jobId}`);
    return false;
  }

  /**
   * Obtener estadísticas del sistema
   */
  async getSystemStats(): Promise<{
    sources: ScrapingStats[];
    activeJobs: number;
    queuedJobs: number;
    systemHealth: any;
  }> {
    let queuedJobs = 0;
    
    try {
      if (this.queueManager) {
        const queueStats = await this.queueManager.getQueueStats();
        queuedJobs = Object.values(queueStats).reduce((total: number, stats: any) => {
          return total + (stats.waiting || 0) + (stats.active || 0);
        }, 0);
      }
    } catch (error) {
      // Si hay error con queue stats, continuar con 0
      queuedJobs = 0;
    }
    
    return {
      sources: this.registry.getAllStats(),
      activeJobs: this.activeJobs.size,
      queuedJobs,
      systemHealth: this.registry.getSystemHealth()
    };
  }

  /**
   * Configurar listeners del registro
   */
  private setupRegistryListeners(): void {
    this.registry.on('scraping_progress', (progress) => {
      this.emit('scraping_progress', progress);
    });

    this.registry.on('job_completed', (data) => {
      this.emit('source_job_completed', data);
    });

    this.registry.on('job_failed', (data) => {
      this.emit('source_job_failed', data);
    });

    this.registry.on('health_check', (data) => {
      this.emit('health_check', data);
    });
  }

  /**
   * Generar ID único para trabajos
   */
  private generateJobId(sourceId: string): string {
    return `scraping_${sourceId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Limpiar recursos del orquestador
   */
  async cleanup(): Promise<void> {
    this.isProcessingQueue = false;
    
    // Cancelar trabajos activos
    for (const [jobId] of this.activeJobs.entries()) {
      await this.cancelJob(jobId);
    }

    // Limpiar registro
    await this.registry.cleanup();
    
    this.removeAllListeners();
    logger.info('🧹 ScrapingOrchestrator limpiado');
  }
}