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
import { DocumentTextExtractor } from '@/services/DocumentTextExtractor';
import * as fs from 'fs/promises';
import * as path from 'path';
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
  private documentTextExtractor: DocumentTextExtractor;
  private storageBasePath: string;
  private jobQueue: ScrapingJob[] = [];
  private isProcessingQueue = false;
  private maxConcurrentJobs = 3;

  constructor() {
    super();
    this.registry = new SourceRegistry();
    this.queueManager = new QueueManager(this);
    this.documentTextExtractor = new DocumentTextExtractor();
    this.storageBasePath = path.join(process.cwd(), 'storage', 'documents');
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

        // Extraer fecha oficial de la web (structuredData.fechaPublicacion)
        if (structuredData?.fechaPublicacion) {
          try {
            webOfficialDate = this.parseWebOfficialDate(structuredData.fechaPublicacion);
            logger.info(`📅 Fecha web oficial extraída para ${doc.documentId}: ${structuredData.fechaPublicacion} -> ${webOfficialDate?.toISOString().split('T')[0] || 'N/A'}`);
          } catch (error) {
            logger.warn(`⚠️ Error parseando fecha web oficial "${structuredData.fechaPublicacion}" para ${doc.documentId}:`, error);
          }
        } else {
          logger.debug(`📅 No se encontró fechaPublicacion en structuredData para ${doc.documentId}`);
        }
        
        // ✅ IMPLEMENTACIÓN HÍBRIDA - Procesar contenido
        let intelligentSummary = doc.content || '';
        let fullTextContent = null;
        let documentPath = null;

        // Si el documento tiene texto completo, generar resumen inteligente
        if (doc.fullTextContent && doc.fullTextContent.length > 1000) {
          logger.info(`🧠 Generando resumen inteligente para ${doc.documentId} (${doc.fullTextContent.length} caracteres)`);
          intelligentSummary = await this.generateIntelligentSummary(doc.fullTextContent);
          fullTextContent = doc.fullTextContent;
          
          logger.info(`📋 Resumen generado: ${intelligentSummary.length} caracteres (optimizado para IA)`);
        }

        // Si el documento tiene buffer, guardar archivo original
        if (doc.documentBuffer && doc.documentBuffer.length > 0) {
          logger.info(`💾 Guardando archivo original para ${doc.documentId} (${doc.documentBuffer.length} bytes)`);
          documentPath = await this.saveDocumentFile(doc.documentId, doc.documentBuffer, 'docx');
        }

        // Crear nuevo documento con solución híbrida
        const savedDocument = await prisma.document.create({
          data: {
            title: doc.title,
            content: intelligentSummary,                    // ✅ Resumen inteligente para IA
            fullTextContent: fullTextContent,               // ✅ Texto completo para referencia
            documentPath: documentPath,                     // ✅ Ruta al archivo original
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
            webOfficialDate: webOfficialDate,               // ✅ Nueva fecha web oficial
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
   * Generar resumen inteligente usando DocumentTextExtractor
   */
  private async generateIntelligentSummary(fullText: string): Promise<string> {
    try {
      const structured = this.documentTextExtractor.extractStructuredSections(fullText);
      
      // Crear resumen inteligente limitado para análisis IA
      const summary = `${structured.introduccion}\n\n=== CONSIDERACIONES CLAVE ===\n${structured.considerandos.substring(0, 2000)}\n\n=== RESOLUCIÓN ===\n${structured.resuelve}`;
      
      // Limitar a 10K caracteres para optimización IA
      return summary.substring(0, 10000);
    } catch (error) {
      logger.warn('⚠️ Error generando resumen inteligente, usando fallback', error);
      // Fallback: usar primeros 8K caracteres
      return fullText.substring(0, 8000);
    }
  }

  /**
   * Guardar archivo RTF/DOCX original en storage
   */
  private async saveDocumentFile(documentId: string, buffer: Buffer, extension: string = 'docx'): Promise<string | null> {
    try {
      // Asegurar que el directorio existe
      await fs.mkdir(this.storageBasePath, { recursive: true });
      
      // Generar nombre de archivo único
      const filename = `${documentId}.${extension}`;
      const filePath = path.join(this.storageBasePath, filename);
      
      // Guardar archivo
      await fs.writeFile(filePath, buffer);
      
      logger.info(`💾 Archivo guardado: ${filename} (${buffer.length} bytes)`);
      return filePath;
    } catch (error) {
      logger.error(`❌ Error guardando archivo ${documentId}:`, error);
      return null;
    }
  }

  /**
   * Parsear fecha web oficial desde string a Date
   */
  private parseWebOfficialDate(fechaString: string): Date | null {
    try {
      if (!fechaString || fechaString.trim() === '') {
        return null;
      }

      const fecha = fechaString.trim();

      // Formato ISO YYYY-MM-DD (más común en las tablas web)
      const isoMatch = fecha.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (isoMatch && isoMatch[1] && isoMatch[2] && isoMatch[3]) {
        const [, year, month, day] = isoMatch;
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      }

      // Formato DD/MM/YYYY
      const ddmmyyyyMatch = fecha.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
      if (ddmmyyyyMatch && ddmmyyyyMatch[1] && ddmmyyyyMatch[2] && ddmmyyyyMatch[3]) {
        const [, day, month, year] = ddmmyyyyMatch;
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      }

      // Formato DD-MM-YYYY
      const ddmmyyyyDashMatch = fecha.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
      if (ddmmyyyyDashMatch && ddmmyyyyDashMatch[1] && ddmmyyyyDashMatch[2] && ddmmyyyyDashMatch[3]) {
        const [, day, month, year] = ddmmyyyyDashMatch;
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      }

      // Formato "DD de MMMM de YYYY" (español)
      const monthsSpanish: { [key: string]: number } = {
        'enero': 0, 'febrero': 1, 'marzo': 2, 'abril': 3, 'mayo': 4, 'junio': 5,
        'julio': 6, 'agosto': 7, 'septiembre': 8, 'octubre': 9, 'noviembre': 10, 'diciembre': 11
      };

      const spanishMatch = fecha.match(/^(\d{1,2})\s+de\s+(\w+)\s+de\s+(\d{4})$/i);
      if (spanishMatch && spanishMatch[1] && spanishMatch[2] && spanishMatch[3]) {
        const [, day, monthName, year] = spanishMatch;
        const month = monthsSpanish[monthName.toLowerCase()];
        if (month !== undefined) {
          return new Date(parseInt(year), month, parseInt(day));
        }
      }

      // Fallback: intentar Date.parse directamente
      const parsedDate = new Date(fecha);
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate;
      }

      logger.warn(`⚠️ No se pudo parsear fecha web oficial: "${fecha}"`);
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