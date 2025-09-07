/**
 * Servicio de Scraping para el Sistema Editorial Jurídico (TypeScript)
 */

import { PrismaClient } from '@prisma/client';
import { spawn } from 'child_process';
import path from 'path';
import { logger } from '@/utils/logger';
import { sseController } from '@/controllers/sse';

const prisma = new PrismaClient();

interface ExtractDocumentsOptions {
  limit?: number;
  downloadDocuments?: boolean;
  userId?: string;
}

interface ScrapingResult {
  jobId: string;
  documents: any[];
  downloadedCount: number;
  extractionTime: number;
}

interface DocumentExtractionResult {
  success: boolean;
  documents: any[];
  downloadedCount: number;
  extractionTime: number;
  totalFound: number;
}

export class ScrapingService {
  private pythonScriptPath: string;
  private jobs: Map<string, any>;

  constructor() {
    this.pythonScriptPath = path.join(__dirname, '..', '..', 'services', 'scraping', 'run_extractor.py');
    this.jobs = new Map();
  }

  /**
   * Extraer documentos de una fuente específica
   */
  async extractDocuments(source: string, options: ExtractDocumentsOptions = {}): Promise<ScrapingResult> {
    const {
      limit = 10,
      downloadDocuments = false,
      userId
    } = options;

    logger.info(`🔍 Iniciando extracción - Fuente: ${source}, Límite: ${limit}`, {
      source,
      limit,
      downloadDocuments,
      userId
    });
    
    const startTime = Date.now();
    const jobId = this._generateJobId();

    // Enviar evento de inicio a través de SSE
    if (userId) {
      sseController.sendEvent(userId, 'scraping_progress', {
        jobId,
        status: 'started',
        message: `Iniciando extracción de ${source} (límite: ${limit})`,
        progress: 0,
        source,
        limit
      });
    }
    
    // Crear registro de extracción (sin await para evitar bloqueo si falla)
    try {
      await prisma.extractionHistory.create({
        data: {
          id: jobId,
          source,
          userId: userId || null,
          status: 'running',
          parameters: JSON.stringify({ limit, downloadDocuments }),
          startedAt: new Date()
        }
      });
    } catch (error) {
      logger.warn('⚠️ No se pudo crear registro en extractionHistory (tabla posiblemente no existe)', error);
    }

    try {
      let extractedDocuments: any[] = [];
      let downloadedCount = 0;

      switch (source) {
        case 'corte_constitucional':
          // Enviar evento de procesamiento
          if (userId) {
            sseController.sendEvent(userId, 'scraping_progress', {
              jobId,
              status: 'processing',
              message: 'Conectando con la Corte Constitucional...',
              progress: 25
            });
          }
          
          // Intentar extracción con reintentos
          const result = await this._extractWithRetry(
            () => this._extractFromCorteConstitucional(limit, downloadDocuments, userId, jobId),
            3, // 3 reintentos
            userId,
            jobId,
            source
          );
          extractedDocuments = result.documents;
          downloadedCount = result.downloadedCount;
          break;
          
        case 'consejo_estado':
          throw new Error('Extractor del Consejo de Estado aún no implementado');
          
        default:
          throw new Error(`Fuente no soportada: ${source}`);
      }

      // Enviar evento de procesamiento de base de datos
      if (userId) {
        sseController.sendEvent(userId, 'scraping_progress', {
          jobId,
          status: 'processing',
          message: `Guardando ${extractedDocuments.length} documentos en la base de datos...`,
          progress: 95,
          documentsFound: extractedDocuments.length
        });
      }

      // Procesar y guardar documentos en la base de datos
      const savedDocuments: any[] = [];
      for (const doc of extractedDocuments) {
        try {
          const savedDoc = await this._saveDocumentToDatabase(doc, userId);
          savedDocuments.push(savedDoc);
        } catch (error) {
          logger.error(`❌ Error guardando documento ${doc.document_id}:`, error);
        }
      }

      const endTime = Date.now();
      const extractionTime = (endTime - startTime) / 1000; // en segundos

      // Actualizar registro de extracción (sin bloqueo si falla)
      try {
        await prisma.extractionHistory.update({
          where: { id: jobId },
          data: {
            status: 'completed',
            documentsFound: extractedDocuments.length,
            documentsProcessed: savedDocuments.length,
            executionTime: extractionTime,
            completedAt: new Date(),
            results: JSON.stringify({
              documents: extractedDocuments.map(d => ({
                id: d.document_id,
                title: d.title,
                url: d.pdf_url
              }))
            })
          }
        });
      } catch (error) {
        logger.warn('⚠️ No se pudo actualizar registro en extractionHistory', error);
      }

      logger.info(`✅ Extracción completada - ${savedDocuments.length} documentos procesados en ${extractionTime}s`);

      // Enviar evento de finalización exitosa
      if (userId) {
        sseController.sendEvent(userId, 'scraping_progress', {
          jobId,
          status: 'completed',
          message: `Extracción completada - ${savedDocuments.length} documentos procesados`,
          progress: 100,
          documentsFound: extractedDocuments.length,
          documentsProcessed: savedDocuments.length,
          downloadedCount,
          extractionTime
        });
      }

      return {
        jobId,
        documents: savedDocuments,
        downloadedCount,
        extractionTime
      };

    } catch (error) {
      logger.error('❌ Error en extracción:', error);
      
      // Enviar evento de error
      if (userId) {
        sseController.sendEvent(userId, 'scraping_progress', {
          jobId,
          status: 'error',
          message: `Error en extracción: ${error instanceof Error ? error.message : String(error)}`,
          progress: 0,
          error: error instanceof Error ? error.message : String(error)
        });
      }
      
      // Actualizar registro con error (sin bloqueo si falla)
      try {
        await prisma.extractionHistory.update({
          where: { id: jobId },
          data: {
            status: 'failed',
            error: error instanceof Error ? error.message : String(error),
            completedAt: new Date()
          }
        });
      } catch (updateError) {
        logger.warn('⚠️ No se pudo actualizar registro de error', updateError);
      }

      throw error;
    }
  }

  /**
   * Ejecutar extracción con reintentos automáticos
   */
  private async _extractWithRetry<T>(
    extractionFunction: () => Promise<T>,
    maxRetries: number,
    userId?: string,
    jobId?: string,
    source?: string
  ): Promise<T> {
    let lastError: any;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Enviar evento de reintento si no es el primer intento
        if (attempt > 1 && userId && jobId) {
          sseController.sendEvent(userId, 'scraping_progress', {
            jobId,
            status: 'processing',
            message: `Reintentando extracción... (intento ${attempt}/${maxRetries})`,
            progress: 25 + (attempt - 1) * 5,
            retry: true,
            attempt,
            maxRetries
          });
        }
        
        const result = await extractionFunction();
        
        // Si llegamos aquí, la extracción fue exitosa
        if (attempt > 1 && userId && jobId) {
          sseController.sendEvent(userId, 'scraping_progress', {
            jobId,
            status: 'processing',
            message: `Extracción exitosa en el intento ${attempt}`,
            progress: 50,
            retry: false
          });
        }
        
        return result;
        
      } catch (error) {
        lastError = error;
        logger.warn(`❌ Intento ${attempt}/${maxRetries} falló:`, error);
        
        // Si no es el último intento, esperar antes del siguiente
        if (attempt < maxRetries) {
          const waitTime = attempt * 2; // Espera incremental: 2s, 4s, 6s...
          logger.info(`⏳ Esperando ${waitTime}s antes del siguiente intento...`);
          
          if (userId && jobId) {
            sseController.sendEvent(userId, 'scraping_progress', {
              jobId,
              status: 'processing',
              message: `Error temporal. Reintentando en ${waitTime}s...`,
              progress: 25 + (attempt - 1) * 5,
              retry: true,
              waitTime
            });
          }
          
          await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
        }
      }
    }
    
    // Si llegamos aquí, todos los reintentos fallaron
    logger.error(`❌ Todos los reintentos fallaron para ${source}. Último error:`, lastError);
    throw lastError;
  }

  /**
   * Extraer documentos de la Corte Constitucional usando el script Python
   */
  private async _extractFromCorteConstitucional(limit: number, downloadDocuments: boolean, userId?: string, jobId?: string): Promise<DocumentExtractionResult> {
    return new Promise((resolve, reject) => {
      logger.info('🐍 Ejecutando script Python de extracción...');
      
      // Preparar argumentos para el script Python
      const args = [
        this.pythonScriptPath,
        '--source', 'corte_constitucional',
        '--limit', limit.toString()
      ];

      if (downloadDocuments) {
        args.push('--download');
      }

      // Ejecutar script Python usando el entorno virtual
      const pythonInterpreter = path.join(__dirname, '..', '..', 'services', 'scraping', 'venv', 'bin', 'python');
      const pythonProcess = spawn(pythonInterpreter, args, {
        cwd: path.join(__dirname, '..', '..', 'services', 'scraping'),
        env: { ...process.env, PYTHONUNBUFFERED: '1' }
      });

      // Configurar timeout para el proceso Python (10 minutos)
      const timeout = setTimeout(() => {
        logger.error('❌ Timeout del proceso Python después de 10 minutos');
        pythonProcess.kill('SIGTERM');
        reject(new Error('El proceso de extracción excedió el tiempo límite de 10 minutos'));
      }, 600000); // 10 minutos

      let stdout = '';
      let stderr = '';

      pythonProcess.stdout.on('data', (data) => {
        const output = data.toString();
        logger.info('🐍 Python: ' + output.trim());
        stdout += output;

        // Enviar eventos de progreso basados en la salida del script Python
        if (userId && jobId) {
          if (output.includes('Conectando a')) {
            sseController.sendEvent(userId, 'scraping_progress', {
              jobId,
              status: 'processing',
              message: 'Conectando al sitio web...',
              progress: 40
            });
          } else if (output.includes('Sentencia encontrada:')) {
            const matches = stdout.match(/Sentencia encontrada:/g);
            const foundCount = matches ? matches.length : 0;
            sseController.sendEvent(userId, 'scraping_progress', {
              jobId,
              status: 'processing',
              message: `Encontrados ${foundCount} documentos...`,
              progress: 60 + (foundCount / limit * 30), // Progress from 60% to 90%
              documentsFound: foundCount
            });
          } else if (output.includes('Documento descargado:')) {
            const downloadMatches = stdout.match(/Documento descargado:/g);
            const downloadCount = downloadMatches ? downloadMatches.length : 0;
            sseController.sendEvent(userId, 'scraping_progress', {
              jobId,
              status: 'processing',
              message: `Descargados ${downloadCount} documentos...`,
              progress: 90 + (downloadCount / limit * 10),
              documentsProcessed: downloadCount
            });
          }
        }
      });

      pythonProcess.stderr.on('data', (data) => {
        const output = data.toString();
        logger.error('🐍 Python Error: ' + output.trim());
        stderr += output;
      });

      pythonProcess.on('close', (code) => {
        clearTimeout(timeout); // Limpiar el timeout si el proceso termina normalmente
        
        if (code === 0) {
          try {
            // Parsear salida JSON del script Python
            const results = this._parseExtractorOutput(stdout);
            logger.info(`✅ Script Python completado - ${results.documents.length} documentos extraídos`);
            resolve(results);
          } catch (error) {
            logger.error('❌ Error parseando salida del script Python:', error);
            reject(new Error(`Error parseando resultados: ${error instanceof Error ? error.message : String(error)}`));
          }
        } else {
          logger.error(`❌ Script Python falló con código: ${code}`);
          reject(new Error(`Script Python falló: ${stderr || 'Error desconocido'}`));
        }
      });

      pythonProcess.on('error', (error) => {
        clearTimeout(timeout);
        logger.error('❌ Error ejecutando script Python:', error);
        
        // Cleanup del proceso si es posible
        try {
          pythonProcess.kill('SIGTERM');
        } catch (cleanupError) {
          logger.warn('⚠️ Error en cleanup del proceso:', cleanupError);
        }
        
        reject(new Error(`Error ejecutando Python: ${error.message}`));
      });
    });
  }

  /**
   * Parsear la salida del script Python extractor
   */
  private _parseExtractorOutput(output: string): DocumentExtractionResult {
    try {
      // Buscar líneas JSON válidas en la salida
      const lines = output.split('\n');
      
      // Buscar línea que comience con '{' y construir JSON válido
      let jsonContent = '';
      let braceCount = 0;
      let jsonStarted = false;
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        
        if (!jsonStarted && trimmedLine.startsWith('{')) {
          jsonStarted = true;
          jsonContent = trimmedLine;
          
          // Contar llaves en esta línea
          for (const char of trimmedLine) {
            if (char === '{') braceCount++;
            if (char === '}') braceCount--;
          }
          
          // Si ya está balanceado en una línea, terminar
          if (braceCount === 0) {
            break;
          }
        } else if (jsonStarted) {
          jsonContent += trimmedLine;
          
          // Contar llaves
          for (const char of trimmedLine) {
            if (char === '{') braceCount++;
            if (char === '}') braceCount--;
          }
          
          // Si llegamos a 0, el JSON está completo
          if (braceCount === 0) {
            break;
          }
        }
      }
      
      if (!jsonContent) {
        logger.warn('No se encontró JSON válido en la salida, intentando parsear desde logs');
        // Si no hay JSON, crear estructura básica desde logs
        const documents: any[] = [];
        let downloadedCount = 0;
        
        // Buscar patrones en los logs
        const sentenceMatches = output.match(/Sentencia encontrada: ([A-Z]+-\d+\/\d+)/g);
        const downloadMatches = output.match(/Documento descargado:/g);
        
        if (sentenceMatches) {
          sentenceMatches.forEach((match, index) => {
            const sentenceId = match.replace('Sentencia encontrada: ', '');
            documents.push({
              document_id: sentenceId,
              title: `Sentencia ${sentenceId} de la Corte Constitucional`,
              source: 'corte_constitucional',
              court: 'Corte Constitucional',
              document_type: sentenceId.split('-')[0],
              pdf_url: `https://www.corteconstitucional.gov.co/sentencias/${new Date().getFullYear()}/${sentenceId.toLowerCase().replace('/', '-')}.rtf`,
              html_url: null,
              date: new Date().toISOString(),
              extraction_date: new Date().toISOString()
            });
          });
        }
        
        if (downloadMatches) {
          downloadedCount = downloadMatches.length;
        }
        
        return { 
          success: true,
          documents, 
          downloadedCount,
          extractionTime: 0,
          totalFound: documents.length
        };
      }
      
      logger.info('📝 JSON extraído exitosamente:', jsonContent.substring(0, 100) + '...');
      
      const parsed = JSON.parse(jsonContent);
      return {
        success: parsed.success || true,
        documents: parsed.documents || [],
        downloadedCount: parsed.downloadedCount || 0,
        extractionTime: parsed.extractionTime || 0,
        totalFound: parsed.totalFound || (parsed.documents || []).length
      };
      
    } catch (error) {
      logger.error('❌ Error parseando salida:', error);
      throw new Error(`Error parseando salida del extractor: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Guardar documento en la base de datos
   */
  private async _saveDocumentToDatabase(document: any, userId?: string): Promise<any> {
    try {
      // Verificar si ya existe
      const existing = await prisma.document.findFirst({
        where: {
          OR: [
            { externalId: document.document_id },
            { url: document.pdf_url }
          ]
        }
      });

      if (existing) {
        logger.info(`📄 Documento ya existe: ${document.document_id}`);
        return existing;
      }

      // Crear nuevo documento
      const savedDocument = await prisma.document.create({
        data: {
          title: document.title,
          content: '', // Se llenará después con el contenido extraído
          summary: `Sentencia ${document.document_id} de la ${document.court}`,
          source: document.source,
          url: document.pdf_url,
          externalId: document.document_id,
          metadata: JSON.stringify({
            court: document.court,
            document_type: document.document_type,
            pdf_url: document.pdf_url,
            html_url: document.html_url,
            extraction_date: document.extraction_date,
            sentence_type: document.document_type
          }),
          status: 'PENDING',
          extractedAt: new Date(document.extraction_date),
          userId: userId || null,
          // Campos requeridos por el schema
          legalArea: 'CONSTITUTIONAL',
          documentType: 'SENTENCE',
          publicationDate: new Date(document.date)
        }
      });

      logger.info(`✅ Documento guardado: ${document.document_id} -> ID: ${savedDocument.id}`);
      return savedDocument;

    } catch (error) {
      logger.error(`❌ Error guardando documento ${document.document_id}:`, error);
      throw error;
    }
  }

  /**
   * Obtener fuentes disponibles
   */
  async getAvailableSources(): Promise<any[]> {
    const lastExtractionCC = await this._getLastExtractionDate('corte_constitucional');
    
    return [
      {
        id: 'corte_constitucional',
        name: 'Corte Constitucional',
        description: 'Sentencias de la Corte Constitucional de Colombia',
        status: 'available',
        lastExtraction: lastExtractionCC
      },
      {
        id: 'consejo_estado',
        name: 'Consejo de Estado',
        description: 'Sentencias del Consejo de Estado de Colombia',
        status: 'not_implemented',
        lastExtraction: null
      }
    ];
  }

  /**
   * Obtener fecha de última extracción
   */
  private async _getLastExtractionDate(source: string): Promise<Date | null> {
    try {
      const lastExtraction = await prisma.extractionHistory.findFirst({
        where: { 
          source,
          status: 'completed'
        },
        orderBy: { completedAt: 'desc' }
      });

      return lastExtraction ? lastExtraction.completedAt : null;
    } catch (error) {
      // Si la tabla no existe, retornar null
      return null;
    }
  }

  /**
   * Obtener estado de un trabajo
   */
  async getJobStatus(jobId: string): Promise<any | null> {
    try {
      const extraction = await prisma.extractionHistory.findUnique({
        where: { id: jobId }
      });

      if (!extraction) {
        return null;
      }

      return {
        id: extraction.id,
        source: extraction.source,
        status: extraction.status,
        documentsFound: extraction.documentsFound,
        documentsProcessed: extraction.documentsProcessed,
        executionTime: extraction.executionTime,
        startedAt: extraction.startedAt,
        completedAt: extraction.completedAt,
        error: extraction.error
      };
    } catch (error) {
      logger.error('Error obteniendo estado del trabajo:', error);
      return null;
    }
  }

  /**
   * Obtener historial de extracciones
   */
  async getExtractionHistory(options: { page?: number; limit?: number; userId?: string } = {}): Promise<any> {
    const {
      page = 1,
      limit = 10,
      userId
    } = options;

    try {
      const where = userId ? { userId } : {};
      
      const [extractions, total] = await Promise.all([
        prisma.extractionHistory.findMany({
          where,
          orderBy: { startedAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
          include: {
            user: {
              select: { id: true, email: true }
            }
          }
        }),
        prisma.extractionHistory.count({ where })
      ]);

      return {
        extractions,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error obteniendo historial:', error);
      return {
        extractions: [],
        pagination: { page, limit, total: 0, pages: 0 }
      };
    }
  }

  /**
   * Descargar documentos específicos
   */
  async downloadDocuments(documentIds: string[], options: { userId?: string } = {}): Promise<any> {
    const { userId } = options;
    
    logger.info(`📥 Descargando ${documentIds.length} documentos específicos`);
    
    const results: any[] = [];
    let successCount = 0;
    let failureCount = 0;

    for (const documentId of documentIds) {
      try {
        // Buscar documento en la base de datos
        const document = await prisma.document.findFirst({
          where: {
            OR: [
              { id: documentId },
              { externalId: documentId }
            ]
          }
        });

        if (!document) {
          results.push({
            documentId,
            success: false,
            error: 'Documento no encontrado'
          });
          failureCount++;
          continue;
        }

        // Intentar descarga usando el script Python
        const downloadResult = await this._downloadSingleDocument(document);
        
        if (downloadResult.success) {
          successCount++;
          // Actualizar documento con ruta local
          const currentMetadata = JSON.parse(document.metadata || '{}');
          await prisma.document.update({
            where: { id: document.id },
            data: {
              metadata: JSON.stringify({
                ...currentMetadata,
                localPath: downloadResult.localPath,
                downloadedAt: new Date().toISOString()
              })
            }
          });
        } else {
          failureCount++;
        }

        results.push({
          documentId,
          success: downloadResult.success,
          localPath: downloadResult.localPath,
          error: downloadResult.error
        });

      } catch (error) {
        logger.error(`❌ Error descargando documento ${documentId}:`, error);
        results.push({
          documentId,
          success: false,
          error: error instanceof Error ? error.message : String(error)
        });
        failureCount++;
      }
    }

    logger.info(`✅ Descarga completada - Éxito: ${successCount}, Fallo: ${failureCount}`);

    return {
      successCount,
      failureCount,
      results
    };
  }

  /**
   * Descargar un documento individual
   */
  private async _downloadSingleDocument(document: any): Promise<{ success: boolean; localPath?: string; error?: string }> {
    return new Promise((resolve) => {
      const metadata = JSON.parse(document.metadata || '{}');
      const documentUrl = metadata.pdf_url || document.url;
      
      if (!documentUrl) {
        resolve({
          success: false,
          error: 'No se encontró URL de descarga'
        });
        return;
      }

      logger.info(`📥 Descargando: ${document.externalId}`);

      // Ejecutar script Python para descarga individual usando entorno virtual
      const pythonInterpreter = path.join(__dirname, '..', '..', 'services', 'scraping', 'venv', 'bin', 'python');
      const pythonProcess = spawn(pythonInterpreter, [
        path.join(__dirname, '..', '..', 'services', 'scraping', 'download_single.py'),
        '--url', documentUrl,
        '--id', document.externalId
      ], {
        cwd: path.join(__dirname, '..', '..', 'services', 'scraping')
      });

      let stdout = '';
      let stderr = '';

      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code === 0) {
          const match = stdout.match(/LOCAL_PATH:(.+)/);
          const localPath = match ? match[1].trim() : undefined;
          
          resolve({
            success: true,
            localPath: localPath || undefined
          });
        } else {
          resolve({
            success: false,
            error: stderr || 'Error descargando documento'
          });
        }
      });
    });
  }

  /**
   * Generar ID único para trabajos
   */
  private _generateJobId(): string {
    return `scraping_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}