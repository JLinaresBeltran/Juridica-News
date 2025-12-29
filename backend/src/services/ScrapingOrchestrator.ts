/**
 * Orquestador principal del sistema de scraping modular
 * Sistema Editorial Jurídico Supervisado
 *
 * REFACTORIZACIÓN BLACK BOX:
 * - Inyección de dependencias: IDocumentStorage + IFileStorage
 * - Desacoplamiento completo de Prisma (solo para ExtractionHistory temporal)
 * - Lógica de negocio simplificada usando adapters
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

// BLACK BOX ADAPTERS
import { IDocumentStorage, DocumentInput, DocumentStatus, LegalArea, DocumentType } from '@/adapters/storage/IDocumentStorage';
import { IFileStorage } from '@/adapters/storage/IFileStorage';
import { IContentProcessor } from '@/adapters/content/IContentProcessor';
import { IMetadataExtractor } from '@/adapters/metadata/IMetadataExtractor';

const prisma = new PrismaClient();

export class ScrapingOrchestrator extends EventEmitter {
  private registry: SourceRegistry;
  private queueManager: QueueManager;
  private activeJobs: Map<string, ScrapingJob> = new Map();
  private isInitialized = false;
  private jobQueue: ScrapingJob[] = [];
  private isProcessingQueue = false;
  private queueProcessorInterval?: NodeJS.Timeout;
  private maxConcurrentJobs = 3;

  constructor(
    private documentStorage: IDocumentStorage,
    private fileStorage: IFileStorage,
    private contentProcessor: IContentProcessor,
    private metadataExtractor: IMetadataExtractor
  ) {
    super();
    this.registry = SourceRegistry.getInstance();
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

      // ✅ Crear job y agregarlo a activeJobs para que los eventos SSE funcionen
      const job: ScrapingJob = {
        id: jobId,
        sourceId,
        userId,
        parameters,
        status: JobStatus.RUNNING,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.activeJobs.set(jobId, job);

      logger.info(`🚀 Ejecutando trabajo directo: ${jobId} - Fuente: ${sourceId}`);

      const result = await scraper.executeExtraction(jobId, parameters);
      
      // Guardar documentos en la base de datos
      const savedDocuments = await this.saveDocumentsToDatabase(result.documents, userId);
      
      // Actualizar resultado con documentos guardados
      result.documents = savedDocuments;

      // Actualizar registro en base de datos
      await this.updateJobInDatabase({
        id: jobId,
        sourceId,
        ...(userId && { userId }),
        parameters,
        status: JobStatus.COMPLETED,
        createdAt: new Date(),
        updatedAt: new Date(),
        completedAt: new Date(),
        result
      }, result);

      logger.info(`✅ Trabajo completado: ${jobId} - ${result.documents.length} documentos`);

      // ✅ Remover job de activeJobs
      this.activeJobs.delete(jobId);

      return { jobId, result };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      await this.updateJobInDatabase({
        id: jobId,
        sourceId,
        ...(userId && { userId }),
        parameters,
        status: JobStatus.FAILED,
        createdAt: new Date(),
        updatedAt: new Date(),
        completedAt: new Date(),
        error: errorMessage
      });

      logger.error(`❌ Trabajo falló: ${jobId} -`, error);

      // ✅ Remover job de activeJobs también en caso de error
      this.activeJobs.delete(jobId);

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
   *
   * REFACTORIZACIÓN BLACK BOX:
   * - Usa IDocumentStorage en lugar de Prisma directo
   * - Lógica de duplicados delegada al adapter
   * - Reducido de ~130 líneas a ~60 líneas
   */
  private async saveDocumentsToDatabase(documents: any[], userId?: string): Promise<any[]> {
    const savedDocuments: any[] = [];

    for (const doc of documents) {
      try {
        // BLACK BOX: Verificar duplicados usando adapter
        const existing = await this.documentStorage.findDuplicate({
          externalId: doc.documentId,
          url: doc.url
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
        const structuredData = doc.metadata?.structuredData;
        let magistradoPonente = null;
        let expediente = null;
        let salaRevision = null;
        let numeroSentencia = null;
        let webOfficialDate = null;

        if (extractedMetadata) {
          magistradoPonente = extractedMetadata.magistradoPonente || null;
          expediente = extractedMetadata.expediente || null;
          salaRevision = extractedMetadata.salaRevision || null;
          numeroSentencia = extractedMetadata.numeroSentencia || null;

          logger.info(`📋 Mapeando metadatos para ${doc.documentId}: Magistrado: ${magistradoPonente || 'N/A'}, Expediente: ${expediente || 'N/A'}, Sala: ${salaRevision || 'N/A'}`);
        } else {
          logger.warn(`⚠️ NO se encontraron extractedMetadata para ${doc.documentId}`);
        }

        // ✅ SOLUCIÓN ROBUSTA: Extraer fecha oficial de múltiples fuentes
        // 1. Primero intentar desde structuredData.fechaPublicacion
        if (structuredData?.fechaPublicacion) {
          try {
            webOfficialDate = this.parseWebOfficialDate(structuredData.fechaPublicacion);
            logger.info(`📅 Fecha web oficial extraída (structuredData) para ${doc.documentId}: ${structuredData.fechaPublicacion} -> ${webOfficialDate?.toISOString().split('T')[0] || 'N/A'}`);
          } catch (error) {
            logger.warn(`⚠️ Error parseando fecha web oficial "${structuredData.fechaPublicacion}" para ${doc.documentId}:`, error);
          }
        }

        // 2. Si no hay fecha en structuredData, intentar desde fechaPublicacion directa del documento
        if (!webOfficialDate && (doc as any).fechaPublicacion) {
          try {
            webOfficialDate = this.parseWebOfficialDate((doc as any).fechaPublicacion);
            logger.info(`📅 Fecha web oficial extraída (fallback directo) para ${doc.documentId}: ${(doc as any).fechaPublicacion} -> ${webOfficialDate?.toISOString().split('T')[0] || 'N/A'}`);
          } catch (error) {
            logger.warn(`⚠️ Error parseando fecha web oficial fallback "${(doc as any).fechaPublicacion}" para ${doc.documentId}:`, error);
          }
        }

        // 3. Si aún no hay fecha, intentar desde extractedMetadata.fechaPublicacion (extraída del RTF)
        if (!webOfficialDate && extractedMetadata?.fechaPublicacion) {
          try {
            // extractedMetadata.fechaPublicacion puede ser Date o string
            if (extractedMetadata.fechaPublicacion instanceof Date) {
              webOfficialDate = extractedMetadata.fechaPublicacion;
            } else {
              webOfficialDate = this.parseWebOfficialDate(String(extractedMetadata.fechaPublicacion));
            }
            logger.info(`📅 Fecha web oficial extraída (fallback RTF) para ${doc.documentId}: ${extractedMetadata.fechaPublicacion} -> ${webOfficialDate?.toISOString().split('T')[0] || 'N/A'}`);
          } catch (error) {
            logger.warn(`⚠️ Error parseando fecha desde RTF "${extractedMetadata.fechaPublicacion}" para ${doc.documentId}:`, error);
          }
        }

        // 4. Log final para debugging
        if (!webOfficialDate) {
          logger.warn(`⚠️ No se pudo extraer fecha web oficial para ${doc.documentId} - structuredData: ${structuredData?.fechaPublicacion || 'NULL'}, fechaPublicacion directa: ${(doc as any).fechaPublicacion || 'N/A'}, extractedMetadata: ${extractedMetadata?.fechaPublicacion || 'N/A'}`);
        }
        
        // ✅ IMPLEMENTACIÓN HÍBRIDA - Procesar contenido
        let intelligentSummary = doc.content || '';
        let fullTextContent = null;
        let documentPath = null;

        // Si el documento tiene texto completo, generar resumen inteligente
        if (doc.fullTextContent && doc.fullTextContent.length > 1000) {
          // Generando resumen inteligente (log removido)
          intelligentSummary = await this.generateIntelligentSummary(doc.fullTextContent);
          fullTextContent = doc.fullTextContent;
          
          logger.info(`📋 Resumen generado: ${intelligentSummary.length} caracteres (optimizado para IA)`);
        }

        // BLACK BOX: Guardar archivo original usando IFileStorage
        if (doc.documentBuffer && doc.documentBuffer.length > 0) {
          logger.info(`💾 Guardando archivo original para ${doc.documentId} (${doc.documentBuffer.length} bytes)`);
          const filename = `${doc.documentId}.docx`;
          documentPath = await this.fileStorage.save(filename, doc.documentBuffer, {
            contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            size: doc.documentBuffer.length,
            originalFilename: filename
          });
        }

        // BLACK BOX: Guardar documento usando IDocumentStorage
        const documentInput: DocumentInput = {
          documentId: doc.documentId,
          externalId: doc.documentId,
          title: doc.title,
          content: intelligentSummary,                    // ✅ Resumen inteligente para IA
          ...(fullTextContent && { fullTextContent }),    // ✅ Texto completo para referencia
          ...(documentPath && { documentPath }),          // ✅ Ruta al archivo original
          summary: doc.summary || `Documento ${doc.documentId} extraído de ${doc.source}`,
          source: doc.source,
          url: doc.url,
          legalArea: (doc.legalArea || 'GENERAL') as LegalArea,
          documentType: (doc.documentType || 'DOCUMENT') as DocumentType,
          ...(numeroSentencia && { numeroSentencia }),        // Convertir null a undefined
          ...(magistradoPonente && { magistradoPonente }),    // Convertir null a undefined
          ...(expediente && { expediente }),                  // Convertir null a undefined
          ...(salaRevision && { salaRevision }),              // Convertir null a undefined
          publicationDate: doc.publicationDate,
          ...(webOfficialDate && { webOfficialDate }),        // Convertir null a undefined
          extractedAt: doc.extractionDate,
          status: DocumentStatus.PENDING,
          ...(userId && { userId }),
          metadata: doc.metadata || {}
        };

        const savedDocument = await this.documentStorage.save(documentInput);

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
          ...(job.completedAt && { completedAt: job.completedAt }),
          ...(job.error && { error: job.error }),
          ...(result && {
            results: JSON.stringify({
              success: result.success,
              documents: result.documents.slice(0, 5).map((d: any) => ({
                id: d.id || d.documentId,
                title: d.title,
                url: d.url
              }))
            })
          })
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
      ...(job.result?.totalFound !== undefined && { documentsFound: job.result.totalFound }),
      ...(job.result?.documents.length !== undefined && { documentsProcessed: job.result.documents.length })
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
    if (this.queueProcessorInterval) {
      logger.warn('⚠️ Queue processor ya está iniciado, ignorando...');
      return;
    }

    this.isProcessingQueue = true;

    this.queueProcessorInterval = setInterval(() => {
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
        ...(extraction.userId && { userId: extraction.userId }),
        parameters: JSON.parse(extraction.parameters || '{}'),
        status: extraction.status.toUpperCase() as JobStatus,
        createdAt: extraction.startedAt,
        updatedAt: extraction.completedAt || extraction.startedAt,
        startedAt: extraction.startedAt,
        ...(extraction.completedAt && { completedAt: extraction.completedAt }),
        ...(extraction.error && { error: extraction.error })
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
  /**
   * Normalizar status del backend (uppercase) al formato esperado por frontend (lowercase)
   */
  private normalizeStatusForFrontend(status: JobStatus): string {
    const statusMap: Record<JobStatus, string> = {
      [JobStatus.PENDING]: 'pending',
      [JobStatus.RUNNING]: 'processing',
      [JobStatus.COMPLETED]: 'completed',
      [JobStatus.FAILED]: 'error',
      [JobStatus.CANCELLED]: 'error',
      [JobStatus.RETRYING]: 'processing'
    };
    
    return statusMap[status] || 'processing';
  }

  private setupRegistryListeners(): void {
    // Escuchar eventos de progreso del scraper y reenviarlos via SSE
    this.registry.on('scraping_progress', (progress: ScrapingProgress) => {
      this.emit('scraping_progress', progress);

      // Buscar el job activo para obtener el userId
      const job = this.activeJobs.get(progress.jobId) ||
                  Array.from(this.jobQueue).find(j => j.id === progress.jobId);

      if (job?.userId) {
        // Normalizar status para frontend (uppercase -> lowercase)
        const normalizedProgress = {
          ...progress,
          status: this.normalizeStatusForFrontend(progress.status)
        };

        // Enviar evento de progreso via SSE al usuario
        sseController.sendEvent(job.userId, 'scraping_progress', normalizedProgress);
      }
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
   * Generar resumen inteligente usando DocumentTextExtractor
   */
  /**
   * BLACK BOX: Generar resumen inteligente usando IContentProcessor
   */
  private async generateIntelligentSummary(fullText: string): Promise<string> {
    try {
      // Delegar generación de resumen al adapter
      const summary = await this.contentProcessor.generateSummary(fullText, 10000);

      logger.info(`📝 Resumen generado: ${summary.length} caracteres`);
      return summary;
    } catch (error) {
      logger.warn('⚠️ Error generando resumen inteligente, usando fallback', error);
      // Fallback: usar primeros 8K caracteres
      return fullText.substring(0, 8000);
    }
  }

  /**
   * ❌ DEPRECATED: Método eliminado - ahora usa this.fileStorage.save()
   *
   * REFACTORIZACIÓN BLACK BOX:
   * - Lógica de archivos delegada completamente a IFileStorage
   * - No más dependencia de fs/promises directa
   */

  /**
   * Parsear fecha web oficial desde string a Date
   */
  private parseWebOfficialDate(fechaString: string): Date | null {
    try {
      if (!fechaString || fechaString.trim() === '') {
        return null;
      }

      // ✅ FIX: Limpiar caracteres invisibles y espacios extra
      const fecha = fechaString.trim().replace(/\s+/g, ' ').replace(/[^\x20-\x7E\d\-\/áéíóúñÁÉÍÓÚÑ]/g, '');

      // ✅ Formato ISO YYYY-MM-DD (de la tabla web de la Corte: 2025-12-19)
      // Regex flexible: permite 1 o 2 dígitos para mes/día, sin requerir ^ y $
      const isoMatch = fecha.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
      if (isoMatch && isoMatch[1] && isoMatch[2] && isoMatch[3]) {
        const [, year, month, day] = isoMatch;
        const parsedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        logger.info(`✅ Fecha ISO parseada: "${fecha}" -> ${year}-${month}-${day}`);
        return parsedDate;
      }

      // Formato DD/MM/YYYY (flexible)
      const ddmmyyyyMatch = fecha.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
      if (ddmmyyyyMatch && ddmmyyyyMatch[1] && ddmmyyyyMatch[2] && ddmmyyyyMatch[3]) {
        const [, day, month, year] = ddmmyyyyMatch;
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      }

      // Formato DD-MM-YYYY (con año de 4 dígitos al final - diferente de ISO)
      const ddmmyyyyDashMatch = fecha.match(/(\d{1,2})-(\d{1,2})-(\d{4})$/);
      if (ddmmyyyyDashMatch && ddmmyyyyDashMatch[1] && ddmmyyyyDashMatch[2] && ddmmyyyyDashMatch[3]) {
        const [, day, month, year] = ddmmyyyyDashMatch;
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      }

      // Formato "DD de MMMM de YYYY" (español)
      const monthsSpanish: { [key: string]: number } = {
        'enero': 0, 'febrero': 1, 'marzo': 2, 'abril': 3, 'mayo': 4, 'junio': 5,
        'julio': 6, 'agosto': 7, 'septiembre': 8, 'octubre': 9, 'noviembre': 10, 'diciembre': 11
      };

      // ✅ FIX: Usar trim() y regex más flexible (sin ^ y $) para tolerar espacios extra
      const cleanFecha = fecha.trim();
      const spanishMatch = cleanFecha.match(/(\d{1,2})\s+de\s+(\w+)\s+de\s+(\d{4})/i);
      if (spanishMatch && spanishMatch[1] && spanishMatch[2] && spanishMatch[3]) {
        const [, day, monthName, year] = spanishMatch;
        const month = monthsSpanish[monthName.toLowerCase()];
        if (month !== undefined) {
          logger.info(`✅ Fecha parseada correctamente: "${cleanFecha}" -> ${year}-${month + 1}-${day}`);
          return new Date(parseInt(year), month, parseInt(day));
        }
      }

      // ✅ FIX: Solo usar Date.parse para formato ISO seguro (YYYY-MM-DD)
      // ELIMINADO el fallback peligroso que malinterpreta fechas en español
      const isoFormatCheck = /^\d{4}-\d{2}-\d{2}/.test(cleanFecha);
      if (isoFormatCheck) {
        const parsedDate = new Date(cleanFecha);
        if (!isNaN(parsedDate.getTime())) {
          return parsedDate;
        }
      }

      logger.warn(`⚠️ No se pudo parsear fecha web oficial: "${fecha}" (limpia: "${cleanFecha}")`);
      return null;

    } catch (error) {
      logger.error(`❌ Error parseando fecha web oficial "${fechaString}":`, error);
      return null;
    }
  }

  /**
   * Limpiar recursos del orquestador
   */
  async cleanup(): Promise<void> {
    this.isProcessingQueue = false;

    // Detener procesador de cola
    if (this.queueProcessorInterval) {
      clearInterval(this.queueProcessorInterval);
      this.queueProcessorInterval = undefined as any;
    }

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