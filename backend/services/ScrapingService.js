/**
 * Servicio de Scraping para el Sistema Editorial Jurídico
 */

const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs').promises;
const { spawn } = require('child_process');
const prisma = new PrismaClient();

class ScrapingService {
  constructor() {
    this.pythonScriptPath = path.join(__dirname, 'scraping', 'run_extractor.py');
    this.jobs = new Map(); // Cache de trabajos activos
  }

  /**
   * Extraer documentos de una fuente específica
   */
  async extractDocuments(source, options = {}) {
    const {
      limit = 10,
      downloadDocuments = false,
      userId
    } = options;

    console.log(`🔍 Iniciando extracción - Fuente: ${source}, Límite: ${limit}`);
    
    const startTime = Date.now();
    const jobId = this._generateJobId();
    
    // Crear registro de extracción
    const extractionRecord = await prisma.extractionHistory.create({
      data: {
        id: jobId,
        source,
        userId,
        status: 'running',
        parameters: JSON.stringify({ limit, downloadDocuments }),
        startedAt: new Date()
      }
    });

    try {
      let extractedDocuments = [];
      let downloadedCount = 0;

      switch (source) {
        case 'corte_constitucional':
          const result = await this._extractFromCorteConstitucional(limit, downloadDocuments);
          extractedDocuments = result.documents;
          downloadedCount = result.downloadedCount;
          break;
          
        case 'consejo_estado':
          // TODO: Implementar extractor del Consejo de Estado
          throw new Error('Extractor del Consejo de Estado aún no implementado');
          
        default:
          throw new Error(`Fuente no soportada: ${source}`);
      }

      // Procesar y guardar documentos en la base de datos
      const savedDocuments = [];
      for (const doc of extractedDocuments) {
        try {
          const savedDoc = await this._saveDocumentToDatabase(doc, userId);
          savedDocuments.push(savedDoc);
        } catch (error) {
          console.error(`❌ Error guardando documento ${doc.document_id}:`, error);
        }
      }

      const endTime = Date.now();
      const extractionTime = (endTime - startTime) / 1000; // en segundos

      // Actualizar registro de extracción
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

      console.log(`✅ Extracción completada - ${savedDocuments.length} documentos procesados en ${extractionTime}s`);

      return {
        jobId,
        documents: savedDocuments,
        downloadedCount,
        extractionTime
      };

    } catch (error) {
      console.error('❌ Error en extracción:', error);
      
      // Actualizar registro con error
      await prisma.extractionHistory.update({
        where: { id: jobId },
        data: {
          status: 'failed',
          error: error.message,
          completedAt: new Date()
        }
      });

      throw error;
    }
  }

  /**
   * Extraer documentos de la Corte Constitucional usando el script Python
   */
  async _extractFromCorteConstitucional(limit, downloadDocuments) {
    return new Promise((resolve, reject) => {
      console.log('🐍 Ejecutando script Python de extracción...');
      
      // Preparar argumentos para el script Python
      const args = [
        this.pythonScriptPath,
        '--source', 'corte_constitucional',
        '--limit', limit.toString()
      ];

      if (downloadDocuments) {
        args.push('--download');
      }

      // Ejecutar script Python
      const pythonProcess = spawn('python3', args, {
        cwd: path.join(__dirname, 'scraping'),
        env: { ...process.env, PYTHONUNBUFFERED: '1' }
      });

      let stdout = '';
      let stderr = '';

      pythonProcess.stdout.on('data', (data) => {
        const output = data.toString();
        console.log('🐍 Python:', output.trim());
        stdout += output;
      });

      pythonProcess.stderr.on('data', (data) => {
        const output = data.toString();
        console.error('🐍 Python Error:', output.trim());
        stderr += output;
      });

      pythonProcess.on('close', (code) => {
        if (code === 0) {
          try {
            // Parsear salida JSON del script Python
            const results = this._parseExtractorOutput(stdout);
            console.log(`✅ Script Python completado - ${results.documents.length} documentos extraídos`);
            resolve(results);
          } catch (error) {
            console.error('❌ Error parseando salida del script Python:', error);
            reject(new Error(`Error parseando resultados: ${error.message}`));
          }
        } else {
          console.error(`❌ Script Python falló con código: ${code}`);
          reject(new Error(`Script Python falló: ${stderr || 'Error desconocido'}`));
        }
      });

      pythonProcess.on('error', (error) => {
        console.error('❌ Error ejecutando script Python:', error);
        reject(new Error(`Error ejecutando Python: ${error.message}`));
      });
    });
  }

  /**
   * Parsear la salida del script Python extractor
   */
  _parseExtractorOutput(output) {
    try {
      // Buscar línea JSON en la salida
      const lines = output.split('\n');
      const jsonLine = lines.find(line => line.trim().startsWith('{') || line.trim().startsWith('['));
      
      if (!jsonLine) {
        // Si no hay JSON, crear estructura básica desde logs
        const documents = [];
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
        
        return { documents, downloadedCount };
      }
      
      const parsed = JSON.parse(jsonLine);
      return {
        documents: parsed.documents || [],
        downloadedCount: parsed.downloadedCount || 0
      };
      
    } catch (error) {
      console.error('❌ Error parseando salida:', error);
      throw new Error(`Error parseando salida del extractor: ${error.message}`);
    }
  }

  /**
   * Guardar documento en la base de datos
   */
  async _saveDocumentToDatabase(document, userId) {
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
        console.log(`📄 Documento ya existe: ${document.document_id}`);
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
          status: 'pending_review',
          extractedAt: new Date(document.extraction_date),
          userId: userId
        }
      });

      console.log(`✅ Documento guardado: ${document.document_id} -> ID: ${savedDocument.id}`);
      return savedDocument;

    } catch (error) {
      console.error(`❌ Error guardando documento ${document.document_id}:`, error);
      throw error;
    }
  }

  /**
   * Obtener fuentes disponibles
   */
  async getAvailableSources() {
    return [
      {
        id: 'corte_constitucional',
        name: 'Corte Constitucional',
        description: 'Sentencias de la Corte Constitucional de Colombia',
        status: 'available',
        lastExtraction: await this._getLastExtractionDate('corte_constitucional')
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
  async _getLastExtractionDate(source) {
    const lastExtraction = await prisma.extractionHistory.findFirst({
      where: { 
        source,
        status: 'completed'
      },
      orderBy: { completedAt: 'desc' }
    });

    return lastExtraction ? lastExtraction.completedAt : null;
  }

  /**
   * Obtener estado de un trabajo
   */
  async getJobStatus(jobId) {
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
  }

  /**
   * Obtener historial de extracciones
   */
  async getExtractionHistory(options = {}) {
    const {
      page = 1,
      limit = 10,
      userId
    } = options;

    const where = userId ? { userId } : {};
    
    const [extractions, total] = await Promise.all([
      prisma.extractionHistory.findMany({
        where,
        orderBy: { startedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: {
            select: { id: true, name: true, email: true }
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
  }

  /**
   * Descargar documentos específicos
   */
  async downloadDocuments(documentIds, options = {}) {
    const { userId } = options;
    
    console.log(`📥 Descargando ${documentIds.length} documentos específicos`);
    
    const results = [];
    let successCount = 0;
    let failureCount = 0;

    for (const documentId of documentIds) {
      try {
        // Buscar documento en la base de datos
        const document = await prisma.document.findFirst({
          where: {
            OR: [
              { id: parseInt(documentId) },
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
          await prisma.document.update({
            where: { id: document.id },
            data: {
              metadata: JSON.stringify({
                ...JSON.parse(document.metadata || '{}'),
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
        console.error(`❌ Error descargando documento ${documentId}:`, error);
        results.push({
          documentId,
          success: false,
          error: error.message
        });
        failureCount++;
      }
    }

    console.log(`✅ Descarga completada - Éxito: ${successCount}, Fallo: ${failureCount}`);

    return {
      successCount,
      failureCount,
      results
    };
  }

  /**
   * Descargar un documento individual
   */
  async _downloadSingleDocument(document) {
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

      console.log(`📥 Descargando: ${document.externalId}`);

      // Ejecutar script Python para descarga individual
      const pythonProcess = spawn('python3', [
        path.join(__dirname, 'scraping', 'download_single.py'),
        '--url', documentUrl,
        '--id', document.externalId
      ], {
        cwd: path.join(__dirname, 'scraping')
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
          const localPath = match ? match[1].trim() : null;
          
          resolve({
            success: true,
            localPath
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
  _generateJobId() {
    return `scraping_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

module.exports = ScrapingService;