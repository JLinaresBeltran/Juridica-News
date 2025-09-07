import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { logger } from '@/utils/logger';
import { validateRequest } from '@/middleware/validation';
import { DocumentFilters, DocumentCurationAction, BatchCurationRequest } from '../../../shared/types/document.types';
import { documentTextExtractor, DocumentTextExtractor } from '@/services/DocumentTextExtractor';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const documentFiltersSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'PROCESSING', 'ERROR']).optional(),
  source: z.enum(['BOE', 'TRIBUNAL_SUPREMO', 'TRIBUNAL_CONSTITUCIONAL', 'MINISTERIO_JUSTICIA', 'CCAA', 'OTROS']).optional(),
  legalArea: z.enum(['CIVIL', 'PENAL', 'MERCANTIL', 'LABORAL', 'ADMINISTRATIVO', 'FISCAL', 'CONSTITUCIONAL']).optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  search: z.string().optional(),
});

const curationActionSchema = z.object({
  action: z.enum(['approve', 'reject']),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional(),
  notes: z.string().optional(),
  estimatedEffort: z.number().min(0).optional(),
});

const batchCurationSchema = z.object({
  documents: z.array(z.object({
    id: z.string().cuid(),
    action: z.enum(['approve', 'reject']),
    priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional(),
    notes: z.string().optional(),
  })).min(1).max(50),
});

/**
 * @swagger
 * /api/documents:
 *   get:
 *     summary: Get paginated list of documents
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED, PROCESSING, ERROR]
 *       - in: query
 *         name: source
 *         schema:
 *           type: string
 *           enum: [BOE, TRIBUNAL_SUPREMO, TRIBUNAL_CONSTITUCIONAL, MINISTERIO_JUSTICIA, CCAA, OTROS]
 *     responses:
 *       200:
 *         description: List of documents with pagination
 */
router.get('/', validateRequest(documentFiltersSchema, 'query'), async (req: Request, res: Response) => {
  try {
    const filters = req.query as DocumentFilters;
    const skip = (filters.page! - 1) * filters.limit!;
    
    // Build where clause
    const where: any = {};
    
    if (filters.status) where.status = filters.status;
    if (filters.source) where.source = filters.source;
    if (filters.legalArea) where.legalArea = filters.legalArea;
    if (filters.priority) where.priority = filters.priority;
    
    if (filters.dateFrom || filters.dateTo) {
      where.publicationDate = {};
      if (filters.dateFrom) where.publicationDate.gte = new Date(filters.dateFrom);
      if (filters.dateTo) where.publicationDate.lte = new Date(filters.dateTo);
    }
    
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { aiSummary: { contains: filters.search, mode: 'insensitive' } },
        { keywords: { hasSome: [filters.search] } },
      ];
    }

    // Execute queries in parallel
    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where,
        skip,
        take: filters.limit!,
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' }
        ],
        include: {
          curator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            }
          }
        }
      }),
      prisma.document.count({ where })
    ]);

    const totalPages = Math.ceil(total / filters.limit!);

    res.json({
      data: documents,
      pagination: {
        page: filters.page!,
        limit: filters.limit!,
        total,
        totalPages,
        hasNext: filters.page! < totalPages,
        hasPrev: filters.page! > 1,
      }
    });

    logger.info('Documents retrieved', {
      userId: req.user.id,
      count: documents.length,
      filters
    });

  } catch (error) {
    logger.error('Error retrieving documents', { error, userId: req.user.id });
    res.status(500).json({
      error: 'Failed to retrieve documents',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @swagger
 * /api/documents/stats:
 *   get:
 *     summary: Get document statistics
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const [
      totalPending,
      totalApproved,
      totalRejected,
      totalProcessing,
      recentlyScraped
    ] = await Promise.all([
      prisma.document.count({ where: { status: 'PENDING' } }),
      prisma.document.count({ where: { status: 'APPROVED' } }),
      prisma.document.count({ where: { status: 'REJECTED' } }),
      prisma.document.count({ where: { status: 'PROCESSING' } }),
      prisma.document.count({
        where: {
          extractedAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        }
      })
    ]);

    const stats = {
      pending: totalPending,
      approved: totalApproved,
      rejected: totalRejected,
      processing: totalProcessing,
      total: totalPending + totalApproved + totalRejected + totalProcessing,
      recentlyScraped
    };

    res.json({ data: stats });

  } catch (error) {
    logger.error('Error retrieving document stats', { error, userId: req.user.id });
    res.status(500).json({
      error: 'Failed to retrieve document statistics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @swagger
 * /api/documents/{id}:
 *   get:
 *     summary: Get document by ID
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const document = await prisma.document.findUnique({
      where: { id: req.params.id },
      include: {
        curator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          }
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          }
        }
      }
    });

    if (!document) {
      return res.status(404).json({
        error: 'Document not found'
      });
    }

    res.json({ data: document });

  } catch (error) {
    logger.error('Error retrieving document', { error, documentId: req.params.id });
    res.status(500).json({
      error: 'Failed to retrieve document',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @swagger
 * /api/documents/{id}/curate:
 *   post:
 *     summary: Curate document (approve/reject)
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.post('/:id/curate', validateRequest(curationActionSchema), async (req: Request, res: Response) => {
  try {
    const { action, priority, notes, estimatedEffort } = req.body as DocumentCurationAction;
    const documentId = req.params.id;

    // Check if document exists and is not already curated
    const existingDocument = await prisma.document.findUnique({
      where: { id: documentId }
    });

    if (!existingDocument) {
      return res.status(404).json({
        error: 'Document not found'
      });
    }

    if (existingDocument.status !== 'PENDING') {
      return res.status(409).json({
        error: 'Document has already been curated',
        currentStatus: existingDocument.status
      });
    }

    // Update document with curation decision
    const updatedDocument = await prisma.document.update({
      where: { id: documentId },
      data: {
        status: action === 'approve' ? 'APPROVED' : 'REJECTED',
        priority: priority || existingDocument.priority,
        curatedById: req.user.id,
        curatedAt: new Date(),
        curationNotes: notes,
        estimatedEffort,
      },
      include: {
        curatedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          }
        }
      }
    });

    // Log audit trail
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        actionType: action === 'approve' ? 'DOCUMENT_CURATED' : 'DOCUMENT_REJECTED',
        resourceType: 'document',
        resourceId: documentId,
        details: {
          action,
          priority,
          notes,
          estimatedEffort,
        },
        result: { success: true },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent') || '',
      }
    });

    res.json({
      data: updatedDocument,
      message: `Document ${action}d successfully`
    });

    logger.info('Document curated', {
      documentId,
      action,
      userId: req.user.id,
      priority
    });

  } catch (error) {
    logger.error('Error curating document', { 
      error, 
      documentId: req.params.id, 
      userId: req.user.id 
    });
    
    res.status(500).json({
      error: 'Failed to curate document',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @swagger
 * /api/documents/batch-curate:
 *   post:
 *     summary: Curate multiple documents at once
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 */
router.post('/batch-curate', validateRequest(batchCurationSchema), async (req: Request, res: Response) => {
  try {
    const { documents } = req.body as BatchCurationRequest;
    const results = [];
    const errors = [];

    // Process each document in the batch
    for (const doc of documents) {
      try {
        const existingDocument = await prisma.document.findUnique({
          where: { id: doc.id }
        });

        if (!existingDocument) {
          errors.push({ id: doc.id, error: 'Document not found' });
          continue;
        }

        if (existingDocument.status !== 'PENDING') {
          errors.push({ 
            id: doc.id, 
            error: 'Document already curated', 
            currentStatus: existingDocument.status 
          });
          continue;
        }

        const updatedDocument = await prisma.document.update({
          where: { id: doc.id },
          data: {
            status: doc.action === 'approve' ? 'APPROVED' : 'REJECTED',
            priority: doc.priority || existingDocument.priority,
            curatedById: req.user.id,
            curatedAt: new Date(),
            curationNotes: doc.notes,
          }
        });

        // Log audit trail
        await prisma.auditLog.create({
          data: {
            userId: req.user.id,
            actionType: doc.action === 'approve' ? 'DOCUMENT_CURATED' : 'DOCUMENT_REJECTED',
            resourceType: 'document',
            resourceId: doc.id,
            details: {
              action: doc.action,
              priority: doc.priority,
              notes: doc.notes,
              batchOperation: true,
            },
            result: { success: true },
            ipAddress: req.ip,
            userAgent: req.get('User-Agent') || '',
          }
        });

        results.push({
          id: doc.id,
          status: updatedDocument.status,
          action: doc.action
        });

      } catch (docError) {
        errors.push({
          id: doc.id,
          error: docError instanceof Error ? docError.message : 'Unknown error'
        });
      }
    }

    res.json({
      data: {
        processed: results.length,
        failed: errors.length,
        results,
        errors
      },
      message: `Batch curation completed: ${results.length} processed, ${errors.length} failed`
    });

    logger.info('Batch curation completed', {
      userId: req.user.id,
      totalRequested: documents.length,
      processed: results.length,
      failed: errors.length
    });

  } catch (error) {
    logger.error('Error in batch curation', { error, userId: req.user.id });
    res.status(500).json({
      error: 'Failed to process batch curation',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @swagger
 * /api/documents/{id}/analyze:
 *   post:
 *     summary: Analyze document with AI for legal content extraction
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: model
 *         schema:
 *           type: string
 *           enum: [openai, gemini]
 *         description: AI model to use for analysis
 */
router.post('/:id/analyze', async (req: Request, res: Response) => {
  try {
    const documentId = req.params.id;
    const model = req.query.model as 'openai' | 'gemini' | undefined;

    // Verificar que el documento existe
    const document = await prisma.document.findUnique({
      where: { id: documentId }
    });

    if (!document) {
      return res.status(404).json({
        error: 'Document not found'
      });
    }

    // Actualizar estado a PROCESSING
    await prisma.document.update({
      where: { id: documentId },
      data: {
        aiAnalysisStatus: 'PROCESSING'
      }
    });

    logger.info(`🔍 Iniciando análisis de documento: ${documentId}`);

    // Importar servicios de análisis
    const { aiAnalysisService } = await import('@/services/AiAnalysisService');
    const { documentMetadataExtractor } = await import('@/services/DocumentMetadataExtractor');

    try {
      // 1. Extraer metadatos estructurales
      const metadata = await documentMetadataExtractor.extractMetadata({
        url: document.url,
        content: document.content || undefined
      });

      // 2. Obtener contenido para análisis de IA
      let contentForAnalysis = document.content;
      
      // Verificar si tenemos contenido válido almacenado
      if (!contentForAnalysis || contentForAnalysis.length < 100) {
        logger.warn(`⚠️  Documento ${documentId} no tiene contenido almacenado suficiente. Longitud: ${contentForAnalysis?.length || 0}`);
        
        // Solo intentar fetch como último recurso y con mejor manejo de errores
        if (document.url) {
          try {
            logger.info(`📡 Intentando obtener contenido desde URL: ${document.url}`);
            const response = await fetch(document.url, {
              timeout: 10000, // 10 segundos timeout
              headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; EditorialJuridico/1.0)'
              }
            });
            
            if (response.ok) {
              // Obtener el buffer para verificar el tipo de contenido
              const buffer = await response.arrayBuffer();
              const uint8Array = new Uint8Array(buffer);
              
              // Verificar si es contenido DOCX (comienza con PK para ZIP)
              const isDOCX = uint8Array[0] === 0x50 && uint8Array[1] === 0x4B;
              
              if (isDOCX) {
                logger.info(`📄 Detectado contenido DOCX desde URL, extrayendo texto...`);
                
                try {
                  // Extraer texto usando DocumentTextExtractor
                  const extractedContent = await documentTextExtractor.extractFromBuffer(
                    Buffer.from(buffer), 
                    document.title
                  );
                  
                  if (extractedContent) {
                    // Construir texto estructurado para análisis
                    const sections = [];
                    if (extractedContent.structuredContent.introduccion) {
                      sections.push('=== INTRODUCCIÓN ===\n' + extractedContent.structuredContent.introduccion);
                    }
                    if (extractedContent.structuredContent.considerandos) {
                      sections.push('=== CONSIDERANDOS ===\n' + extractedContent.structuredContent.considerandos);
                    }
                    if (extractedContent.structuredContent.resuelve) {
                      sections.push('=== RESUELVE ===\n' + extractedContent.structuredContent.resuelve);
                    }
                    if (extractedContent.structuredContent.otros.length > 0) {
                      sections.push('=== OTROS ELEMENTOS ===\n' + extractedContent.structuredContent.otros.join('\n\n'));
                    }
                    
                    contentForAnalysis = sections.join('\n\n');
                    logger.info(`✅ Texto extraído de DOCX desde URL: ${contentForAnalysis.length} caracteres, ${extractedContent.metadata.wordCount} palabras`);
                  } else {
                    logger.error(`❌ No se pudo extraer texto del DOCX desde URL`);
                  }
                } catch (extractError) {
                  logger.error(`❌ Error extrayendo texto de DOCX: ${extractError}`);
                  // Fallback: intentar como texto plano
                  contentForAnalysis = Buffer.from(buffer).toString('utf-8');
                }
              } else {
                // Contenido no binario, procesar como texto
                contentForAnalysis = Buffer.from(buffer).toString('utf-8');
                logger.info(`✅ Contenido de texto obtenido desde URL: ${contentForAnalysis.length} caracteres`);
              }
            } else {
              logger.error(`❌ Error HTTP ${response.status} al obtener contenido desde URL`);
            }
          } catch (fetchError) {
            logger.error(`❌ Error obteniendo contenido desde URL: ${fetchError}`);
          }
        }
        
        // Si aún no hay contenido, no podemos hacer análisis de IA
        if (!contentForAnalysis || contentForAnalysis.length < 100) {
          logger.error(`❌ No hay contenido suficiente para analizar el documento ${documentId}`);
          
          // Actualizar estado como FAILED
          await prisma.document.update({
            where: { id: documentId },
            data: {
              aiAnalysisStatus: 'FAILED'
            }
          });
          
          return res.status(400).json({
            error: 'Insufficient content for analysis',
            message: 'Document does not have enough content stored and cannot fetch from URL'
          });
        }
      } else {
        logger.info(`📄 Usando contenido almacenado: ${contentForAnalysis.length} caracteres`);
      }

      // 3. Análisis de IA con soporte para archivos DOCX
      let aiAnalysis;
      
      // Si el documento tiene archivo físico DOCX, analizar desde el archivo
      if (document.filePath && require('fs').existsSync(document.filePath)) {
        logger.info(`📁 Analizando desde archivo físico: ${document.filePath}`);
        aiAnalysis = await aiAnalysisService.analyzeDocumentFromFile(
          document.filePath, 
          document.title,
          model
        );
      } else {
        // Fallback: analizar desde contenido en BD
        logger.info(`📄 Analizando desde contenido almacenado`);
        aiAnalysis = await aiAnalysisService.analyzeDocument(
          contentForAnalysis,
          document.title,
          model
        );
      }

      // 4. Actualizar documento con resultados
      const updateData: any = {
        aiAnalysisStatus: 'COMPLETED',
        aiAnalysisDate: new Date()
      };

      // Agregar metadatos estructurales si se extrajeron
      if (metadata) {
        updateData.numeroSentencia = metadata.numeroSentencia;
        updateData.magistradoPonente = metadata.magistradoPonente;
        updateData.salaRevision = metadata.salaRevision;
        updateData.fragmentosAnalisis = metadata.rawText.substring(0, 500);
      }

      // Agregar análisis de IA si se completó
      if (aiAnalysis) {
        updateData.temaPrincipal = aiAnalysis.temaPrincipal;
        updateData.resumenIA = aiAnalysis.resumenIA;
        updateData.decision = aiAnalysis.decision;
        updateData.aiModel = aiAnalysis.modeloUsado;
        // Agregar metadatos específicos del análisis IA
        if (aiAnalysis.numeroSentencia) updateData.numeroSentencia = aiAnalysis.numeroSentencia;
        if (aiAnalysis.magistradoPonente) updateData.magistradoPonente = aiAnalysis.magistradoPonente;
        if (aiAnalysis.salaRevision) updateData.salaRevision = aiAnalysis.salaRevision;
        if (aiAnalysis.expediente) updateData.expediente = aiAnalysis.expediente;
      }

      const updatedDocument = await prisma.document.update({
        where: { id: documentId },
        data: updateData
      });

      res.json({
        data: {
          document: updatedDocument,
          analysis: {
            metadata,
            aiAnalysis
          }
        },
        message: 'Document analysis completed successfully'
      });

      logger.info(`✅ Análisis completado para documento: ${documentId}`);

    } catch (analysisError) {
      // Marcar como fallido en caso de error
      await prisma.document.update({
        where: { id: documentId },
        data: {
          aiAnalysisStatus: 'FAILED'
        }
      });

      logger.error(`❌ Error en análisis: ${analysisError}`);
      throw analysisError;
    }

  } catch (error) {
    logger.error('Error analyzing document', { 
      error, 
      documentId: req.params.id, 
      userId: req.user.id 
    });
    
    res.status(500).json({
      error: 'Failed to analyze document',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @swagger
 * /api/documents/batch-analyze:
 *   post:
 *     summary: Analyze multiple documents in batch with AI
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               documentIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 maxItems: 20
 *               model:
 *                 type: string
 *                 enum: [openai, gemini]
 */
router.post('/batch-analyze', async (req: Request, res: Response) => {
  try {
    const { documentIds, model } = req.body;

    // Validación básica
    if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
      return res.status(400).json({
        error: 'documentIds array is required and cannot be empty'
      });
    }

    if (documentIds.length > 20) {
      return res.status(400).json({
        error: 'Maximum 20 documents can be analyzed in batch'
      });
    }

    logger.info(`📊 Iniciando análisis en lote: ${documentIds.length} documentos`);

    // Verificar que todos los documentos existen
    const documents = await prisma.document.findMany({
      where: {
        id: { in: documentIds }
      }
    });

    const foundIds = documents.map(d => d.id);
    const notFoundIds = documentIds.filter((id: string) => !foundIds.includes(id));

    if (notFoundIds.length > 0) {
      return res.status(404).json({
        error: 'Some documents not found',
        notFoundIds
      });
    }

    // Marcar todos los documentos como PROCESSING
    await prisma.document.updateMany({
      where: {
        id: { in: documentIds }
      },
      data: {
        aiAnalysisStatus: 'PROCESSING'
      }
    });

    // Importar servicios
    const { aiAnalysisService } = await import('@/services/AiAnalysisService');
    const { documentMetadataExtractor } = await import('@/services/DocumentMetadataExtractor');

    const results = [];
    const errors = [];

    // Procesar cada documento
    for (let i = 0; i < documents.length; i++) {
      const document = documents[i];
      
      try {
        logger.info(`🔍 Procesando ${i + 1}/${documents.length}: ${document.title}`);

        // Extraer metadatos
        const metadata = await documentMetadataExtractor.extractMetadata({
          url: document.url,
          content: document.content || undefined
        });

        // Obtener contenido
        let contentForAnalysis = document.content;
        if (!contentForAnalysis || contentForAnalysis.length < 100) {
          try {
            const response = await fetch(document.url);
            if (response.ok) {
              contentForAnalysis = await response.text();
            }
          } catch (fetchError) {
            logger.warn(`⚠️  Error obteniendo contenido: ${fetchError}`);
          }
        }

        // Análisis de IA
        let aiAnalysis = null;
        if (contentForAnalysis && contentForAnalysis.length > 100) {
          aiAnalysis = await aiAnalysisService.analyzeDocument(
            contentForAnalysis,
            document.title,
            model
          );
        }

        // Actualizar documento
        const updateData: any = {
          aiAnalysisStatus: 'COMPLETED',
          aiAnalysisDate: new Date()
        };

        if (metadata) {
          updateData.numeroSentencia = metadata.numeroSentencia;
          updateData.magistradoPonente = metadata.magistradoPonente;
          updateData.salaRevision = metadata.salaRevision;
          updateData.fragmentosAnalisis = metadata.rawText.substring(0, 500);
        }

        if (aiAnalysis) {
          updateData.temaPrincipal = aiAnalysis.temaPrincipal;
          updateData.resumenIA = aiAnalysis.resumenIA;
          updateData.decision = aiAnalysis.decision;
          updateData.aiModel = aiAnalysis.modeloUsado;
          // Agregar metadatos específicos del análisis IA
          if (aiAnalysis.numeroSentencia) updateData.numeroSentencia = aiAnalysis.numeroSentencia;
          if (aiAnalysis.magistradoPonente) updateData.magistradoPonente = aiAnalysis.magistradoPonente;
          if (aiAnalysis.salaRevision) updateData.salaRevision = aiAnalysis.salaRevision;
          if (aiAnalysis.expediente) updateData.expediente = aiAnalysis.expediente;
        }

        await prisma.document.update({
          where: { id: document.id },
          data: updateData
        });

        results.push({
          id: document.id,
          title: document.title,
          success: true,
          analysis: {
            metadata,
            aiAnalysis
          }
        });

        // Rate limiting entre documentos
        if (i < documents.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

      } catch (docError) {
        // Marcar documento como fallido
        await prisma.document.update({
          where: { id: document.id },
          data: {
            aiAnalysisStatus: 'FAILED'
          }
        });

        errors.push({
          id: document.id,
          title: document.title,
          error: docError instanceof Error ? docError.message : 'Unknown error'
        });

        logger.error(`❌ Error procesando ${document.id}: ${docError}`);
      }
    }

    const successful = results.length;
    const failed = errors.length;

    res.json({
      data: {
        successful,
        failed,
        results,
        errors
      },
      message: `Batch analysis completed: ${successful} successful, ${failed} failed`
    });

    logger.info(`✅ Análisis en lote completado: ${successful}/${documents.length} exitosos`);

  } catch (error) {
    logger.error('Error in batch analysis', { error, userId: req.user.id });
    res.status(500).json({
      error: 'Failed to process batch analysis',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});


export default router;