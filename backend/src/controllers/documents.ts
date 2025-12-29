import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { logger } from '@/utils/logger';
import { validateRequest } from '@/middleware/validation';
import { DocumentFilters, DocumentCurationAction, BatchCurationRequest } from '../../../shared/types/document.types';
import { AiAnalysisService } from '@/services/AiAnalysisService';

// Black Box Adapters
import { MammothContentProcessor } from '@/adapters/content/MammothContentProcessor';
import { RegexMetadataExtractor } from '@/adapters/metadata/RegexMetadataExtractor';

const router = Router();
const prisma = new PrismaClient();

// Instancias de adapters Black Box
const contentProcessor = new MammothContentProcessor();
const metadataExtractor = new RegexMetadataExtractor();

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
  // ✅ FIX: Agregar campo aiData para datos de análisis IA
  aiData: z.object({
    numeroSentencia: z.string().optional(),
    magistradoPonente: z.string().optional(),
    salaRevision: z.string().optional(),
    expediente: z.string().optional(),
    temaPrincipal: z.string().optional(),
    resumenIA: z.string().optional(),
    decision: z.string().optional(),
    aiAnalysisStatus: z.string().optional(),
    aiAnalysisDate: z.string().optional(),
    aiModel: z.string().optional(),
    fragmentosAnalisis: z.string().optional(),
  }).optional(),
  // ✅ NEW: Agregar campo articleData para artículos generados
  articleData: z.object({
    title: z.string().optional(),
    content: z.string().optional(),
    image: z.string().optional(),
    keywords: z.string().optional(),
    metaTitle: z.string().optional(),
    publicationSection: z.string().optional()
  }).optional()
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
        // ✅ LAZY LOADING: Solo metadatos ligeros (~2-5KB/doc vs 113KB/doc)
        select: {
          // Identifiers
          id: true,
          externalId: true,

          // Minimal content
          title: true,
          summary: true,  // ✅ Use summary, NOT content

          // URLs y rutas de documentos (necesario para previsualización)
          url: true,
          documentPath: true,

          // Metadata
          source: true,
          legalArea: true,
          documentType: true,
          status: true,
          priority: true,
          publicationDate: true,
          webOfficialDate: true,

          // AI Analysis (metadata only)
          numeroSentencia: true,
          magistradoPonente: true,
          salaRevision: true,
          expediente: true,
          temaPrincipal: true,
          decision: true,
          aiAnalysisStatus: true,

          // Extraction info
          extractionDate: true,
          createdAt: true,
          confidenceScore: true,

          // Relations
          curator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            }
          },

          // ❌ EXCLUDED (heavy content):
          // content: false
          // fullTextContent: false
          // resumenIA: false
          // generatedArticle: false
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
    const { action, priority, notes, estimatedEffort, aiData, articleData } = req.body as DocumentCurationAction & { aiData?: any; articleData?: any };
    const documentId = req.params.id;

    // ✅ DEBUG: Log del request recibido
    console.log('🔍 DEBUG Backend - Curating document:')
    console.log('   documentId:', documentId)
    console.log('   action:', action)
    console.log('   hasAiData:', !!aiData)
    console.log('   hasArticleData:', !!articleData)
    if (aiData) {
      console.log('   aiData keys:', Object.keys(aiData))
      console.log('   numeroSentencia:', aiData.numeroSentencia)
      console.log('   magistradoPonente:', aiData.magistradoPonente)
      console.log('   temaPrincipal:', aiData.temaPrincipal)
      console.log('   resumenIA length:', aiData.resumenIA ? aiData.resumenIA.length : 0)
    }
    if (articleData) {
      console.log('   articleData keys:', Object.keys(articleData))
      console.log('   title:', articleData.title?.substring(0, 50))
      console.log('   content length:', articleData.content?.length || 0)
      console.log('   hasImage:', !!articleData.image)
      console.log('   publicationSection:', articleData.publicationSection)
    }

    // Check if document exists and is not already curated
    const existingDocument = await prisma.document.findUnique({
      where: { id: documentId }
    });

    if (!existingDocument) {
      return res.status(404).json({
        error: 'Document not found'
      });
    }

    // ✅ FIX: Permitir re-procesamiento de documentos APPROVED para marcarlos como READY
    if (existingDocument.status !== 'PENDING' && existingDocument.status !== 'APPROVED') {
      return res.status(409).json({
        error: 'Document cannot be curated in current status',
        currentStatus: existingDocument.status
      });
    }

    // ✅ FIX: Determinar el estado correcto basado en el estado actual y datos de artículo
    let newStatus = action === 'approve' ? 'APPROVED' : 'REJECTED';

    // Si el documento ya está APPROVED y se está procesando con datos de artículo, marcarlo como READY
    if (existingDocument.status === 'APPROVED' && action === 'approve' && articleData && articleData.content) {
      newStatus = 'READY';
    }

    // Update document with curation decision
    const updateData: any = {
      status: newStatus,
      priority: priority || existingDocument.priority,
      curatorId: req.user.id,
    }

    // ✅ FIX: Incluir datos de IA si están disponibles (para approve y reject)
    if (aiData) {
      if (aiData.numeroSentencia) updateData.numeroSentencia = aiData.numeroSentencia
      if (aiData.magistradoPonente) updateData.magistradoPonente = aiData.magistradoPonente
      if (aiData.salaRevision) updateData.salaRevision = aiData.salaRevision
      if (aiData.expediente) updateData.expediente = aiData.expediente
      if (aiData.temaPrincipal) updateData.temaPrincipal = aiData.temaPrincipal
      if (aiData.resumenIA) updateData.resumenIA = aiData.resumenIA
      if (aiData.decision) updateData.decision = aiData.decision
      if (aiData.aiAnalysisStatus) updateData.aiAnalysisStatus = aiData.aiAnalysisStatus
      if (aiData.aiAnalysisDate) updateData.aiAnalysisDate = new Date(aiData.aiAnalysisDate)
      if (aiData.aiModel) updateData.aiModel = aiData.aiModel
      if (aiData.fragmentosAnalisis) updateData.fragmentosAnalisis = aiData.fragmentosAnalisis
    }

    // ✅ DEBUG: Log de los datos que se van a actualizar
    console.log('💾 DEBUG Backend - Update data:')
    console.log('   documentId:', documentId)
    console.log('   updateData keys:', Object.keys(updateData))
    console.log('   numeroSentencia:', updateData.numeroSentencia || 'NO')
    console.log('   magistradoPonente:', updateData.magistradoPonente || 'NO') 
    console.log('   temaPrincipal:', updateData.temaPrincipal || 'NO')
    console.log('   resumenIA:', updateData.resumenIA ? 'YES' : 'NO')

    const updatedDocument = await prisma.document.update({
      where: { id: documentId },
      data: updateData,
      include: {
        curator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          }
        }
      }
    });

    // ✅ NEW: Si se aprueba y hay datos de artículo, crear artículo automáticamente y marcar como READY
    let createdArticle = null;
    if (action === 'approve' && articleData && articleData.content && articleData.title) {
      try {
        console.log('🎯 Creando artículo automáticamente...');
        
        // 1. Generar descripción/summary automáticamente usando AI
        const aiService = new AiAnalysisService();
        let summary = '';
        
        try {
          console.log('📝 Generando descripción automática...');
          const summaryResult = await aiService.generateSummary(
            articleData.content,
            150, // máximo 150 palabras
            'professional'
          );
          summary = summaryResult.summary || 'Resumen del artículo jurídico';
          console.log('✅ Descripción generada:', summary.substring(0, 100) + '...');
        } catch (summaryError) {
          console.warn('⚠️ Error generando descripción, usando fallback:', summaryError);
          // Fallback: usar primeras líneas del contenido sin markdown
          const contentText = articleData.content.replace(/[#*\[\]()]/g, '').trim();
          summary = contentText.substring(0, 200) + '...';
        }

        // 2. Generar slug único
        const baseSlug = articleData.title
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-')
          .substring(0, 50);
        
        let slug = baseSlug;
        let slugCounter = 1;
        while (await prisma.article.findUnique({ where: { slug } })) {
          slug = `${baseSlug}-${slugCounter}`;
          slugCounter++;
        }

        // 3. Calcular métricas del artículo
        const wordCount = articleData.content.split(/\s+/).length;
        const readingTime = Math.ceil(wordCount / 200); // ~200 palabras por minuto

        // 4. Crear el artículo
        createdArticle = await prisma.article.create({
          data: {
            title: articleData.title,
            slug,
            content: articleData.content,
            summary,
            status: 'READY', // Marcar como listo para publicar
            publicationSection: articleData.publicationSection || 'general',
            keywords: articleData.keywords || '',
            metaTitle: articleData.metaTitle || articleData.title,
            metaDescription: summary.substring(0, 160),
            imageUrl: articleData.image || null, // 🔥 GUARDAR imagen
            wordCount,
            readingTime,
            authorId: req.user.id,
            sourceDocumentId: documentId // ✅ FIX: Vincular artículo con documento fuente
          }
        });

        console.log('✅ Artículo creado exitosamente:', {
          id: createdArticle.id,
          title: createdArticle.title,
          slug: createdArticle.slug,
          status: createdArticle.status,
          wordCount: createdArticle.wordCount
        });

        // 4.5. Asociar imagen de biblioteca con artículo si existe
        if (articleData.image) {
          try {
            let libraryImage = null;

            // Si tenemos imageId específico, buscarlo directamente
            if (articleData.imageId) {
              libraryImage = await prisma.generatedImage.findFirst({
                where: {
                  imageId: articleData.imageId,
                  savedToLibrary: true
                }
              });

              if (libraryImage) {
                logger.info('🎯 Imagen encontrada por imageId específico', {
                  imageId: articleData.imageId
                });
              }
            }

            // Si no hay imageId o no se encontró, buscar por documentId (fallback)
            if (!libraryImage) {
              libraryImage = await prisma.generatedImage.findFirst({
                where: {
                  documentId: documentId,
                  savedToLibrary: true
                },
                orderBy: {
                  createdAt: 'desc'
                }
              });

              if (libraryImage) {
                logger.info('📁 Imagen encontrada por documentId (fallback)', {
                  imageId: libraryImage.imageId
                });
              }
            }

            if (libraryImage) {
              // Asociar imagen con artículo
              await prisma.generatedImage.update({
                where: { id: libraryImage.id },
                data: { articleId: createdArticle.id }
              });

              logger.info('🔗 Imagen de biblioteca asociada con artículo', {
                imageId: libraryImage.imageId,
                articleId: createdArticle.id,
                filename: libraryImage.filename,
                method: articleData.imageId ? 'specific' : 'fallback'
              });
            } else {
              logger.warn('⚠️ No se encontró imagen en biblioteca para asociar', {
                imageId: articleData.imageId,
                documentId
              });
            }
          } catch (imageError) {
            logger.warn('⚠️ No se pudo asociar imagen de biblioteca', imageError);
          }
        }

        // 5. Actualizar documento para cambiar estado a READY y guardar el contenido editado
        await prisma.document.update({
          where: { id: documentId },
          data: {
            status: 'READY', // Cambiar estado a READY en lugar de APPROVED
            generated_article: articleData.content // 🔥 GUARDAR contenido editado
          }
        });

      } catch (articleError) {
        console.error('❌ Error creando artículo automático:', articleError);
        // No fallar el proceso de aprobación por esto
      }
    }

    // Log audit trail
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: action === 'approve' ? 'DOCUMENT_CURATED' : 'DOCUMENT_REJECTED',
        description: `Document ${documentId} ${action}d with priority ${priority}${notes ? ` - ${notes}` : ''}`,
        ipAddress: req.ip || null,
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
            curatorId: req.user.id,
          }
        });

        // Log audit trail
        await prisma.auditLog.create({
          data: {
            userId: req.user.id,
            action: doc.action === 'approve' ? 'DOCUMENT_CURATED' : 'DOCUMENT_REJECTED',
            description: `Batch operation: Document ${doc.id} ${doc.action}d${doc.notes ? ` - ${doc.notes}` : ''}`,
            ipAddress: req.ip || null,
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

    // Verificar que el documento existe - INCLUIR fullTextContent
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      select: {
        id: true,
        title: true,
        content: true,
        fullTextContent: true,  // ✅ CRÍTICO: Incluir contenido completo
        url: true,
        status: true,
        aiAnalysisStatus: true,
        source: true,
        numeroSentencia: true,
        magistradoPonente: true,
        salaRevision: true,
        expediente: true,
        documentPath: true
      }
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

    // Importar servicio de análisis
    const { aiAnalysisService } = await import('@/services/AiAnalysisService');

    try {
      // 1. Extraer metadatos estructurales usando Black Box Adapter
      const metadata = await metadataExtractor.extract(
        document.content || document.fullTextContent || '',
        {
          documentTitle: document.title,
          source: document.source
        }
      );

      // 2. Obtener contenido para análisis de IA - PRIORIZAR fullTextContent
      logger.info(`🔍 DEBUG: document.fullTextContent length: ${document.fullTextContent?.length || 0}`);
      logger.info(`🔍 DEBUG: document.content length: ${document.content?.length || 0}`);
      let contentForAnalysis = document.fullTextContent || document.content;
      
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
                  // Extraer texto usando Content Processor Black Box Adapter
                  const extractedContent = await contentProcessor.extractText(
                    Buffer.from(buffer),
                    document.title
                  );

                  if (extractedContent) {
                    // Usar texto completo para asegurar que se incluya el encabezado con magistrado ponente
                    contentForAnalysis = extractedContent.fullText;
                    
                    // También incluir secciones estructuradas si están disponibles
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
                    
                    // Si hay secciones estructuradas, combinar con texto completo para análisis más rico
                    if (sections.length > 0) {
                      contentForAnalysis = extractedContent.fullText + '\n\n' + sections.join('\n\n');
                    }
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
        const contentSource = document.fullTextContent ? 'fullTextContent' : 'content';
        logger.info(`📄 Usando contenido almacenado (${contentSource}): ${contentForAnalysis.length} caracteres`);
      }

      // 3. Análisis de IA con soporte para archivos DOCX
      let aiAnalysis;
      
      // Si el documento tiene archivo físico DOCX, analizar desde el archivo
      if (document.documentPath && require('fs').existsSync(document.documentPath)) {
        logger.info(`📁 Analizando desde archivo físico: ${document.documentPath}`);
        aiAnalysis = await aiAnalysisService.analyzeDocumentFromFile(
          document.documentPath,
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

      // 4. Actualizar documento con resultados - LÓGICA MEJORADA
      const updateData: any = {
        aiAnalysisStatus: 'COMPLETED',
        aiAnalysisDate: new Date()
      };

      // ✅ STEP 1: Preservar datos originales del documento
      const originalData = {
        numeroSentencia: document.numeroSentencia,
        magistradoPonente: document.magistradoPonente,
        salaRevision: document.salaRevision,
        expediente: document.expediente
      };

      // ✅ STEP 2: Agregar metadatos estructurales (prioridad media)
      let extractedData = { ...originalData };
      if (metadata) {
        extractedData.numeroSentencia = metadata.numeroSentencia || originalData.numeroSentencia;
        extractedData.magistradoPonente = metadata.magistradoPonente || originalData.magistradoPonente;
        extractedData.salaRevision = metadata.salaRevision || originalData.salaRevision;
        extractedData.expediente = metadata.expediente || originalData.expediente;
        updateData.fragmentosAnalisis = metadata.rawText ? metadata.rawText.substring(0, 500) : '';
      }

      // ✅ STEP 3: Aplicar análisis IA solo si mejora los datos existentes
      if (aiAnalysis) {
        updateData.temaPrincipal = aiAnalysis.temaPrincipal;
        updateData.resumenIA = aiAnalysis.resumenIA;
        updateData.decision = aiAnalysis.decision;
        updateData.aiModel = aiAnalysis.modeloUsado;

        // Solo aplicar campos estructurales de IA si son más completos que los existentes
        updateData.numeroSentencia = chooseBestValue(
          [originalData.numeroSentencia, extractedData.numeroSentencia, aiAnalysis.numeroSentencia],
          'numeroSentencia'
        );
        
        updateData.magistradoPonente = chooseBestValue(
          [originalData.magistradoPonente, extractedData.magistradoPonente, aiAnalysis.magistradoPonente],
          'magistradoPonente'
        );
        
        updateData.salaRevision = chooseBestValue(
          [originalData.salaRevision, extractedData.salaRevision, aiAnalysis.salaRevision],
          'salaRevision'
        );
        
        updateData.expediente = chooseBestValue(
          [originalData.expediente, extractedData.expediente, aiAnalysis.expediente],
          'expediente'
        );
      } else {
        // Si no hay análisis IA, usar los metadatos extraídos
        updateData.numeroSentencia = extractedData.numeroSentencia;
        updateData.magistradoPonente = extractedData.magistradoPonente;
        updateData.salaRevision = extractedData.salaRevision;
        updateData.expediente = extractedData.expediente;
      }

      logger.info(`🔄 Actualizando documento ${documentId}:`, {
        magistrado: `${originalData.magistradoPonente || 'N/A'} → ${updateData.magistradoPonente || 'N/A'}`,
        sala: `${originalData.salaRevision || 'N/A'} → ${updateData.salaRevision || 'N/A'}`,
        expediente: `${originalData.expediente || 'N/A'} → ${updateData.expediente || 'N/A'}`
      });

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

    // Importar servicio
    const { aiAnalysisService } = await import('@/services/AiAnalysisService');

    const results = [];
    const errors = [];

    // Procesar cada documento
    for (let i = 0; i < documents.length; i++) {
      const document = documents[i];

      try {
        logger.info(`🔍 Procesando ${i + 1}/${documents.length}: ${document.title}`);

        // Extraer metadatos usando Black Box Adapter
        const metadata = await metadataExtractor.extract(
          document.content || document.fullTextContent || '',
          {
            documentTitle: document.title,
            source: document.source
          }
        );

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
          updateData.fragmentosAnalisis = metadata.rawText ? metadata.rawText.substring(0, 500) : '';
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

/**
 * Función helper para elegir el mejor valor entre múltiples opciones
 * Prioriza valores no nulos, más completos y sin truncamiento
 */
function chooseBestValue(values: (string | null | undefined)[], fieldType: string): string | null {
  // Filtrar valores válidos (no nulos, no vacíos)
  const validValues = values.filter(v => v && v.trim().length > 0);
  
  if (validValues.length === 0) return null;
  if (validValues.length === 1) return validValues[0];

  // Criterios específicos por tipo de campo
  switch (fieldType) {
    case 'magistradoPonente':
      // Para magistrados, preferir nombres completos sin truncamiento
      return validValues.find(v => {
        const clean = v!.trim();
        return clean.length > 10 && 
               clean.length < 60 && 
               !clean.includes('Bogotá') && 
               !clean.includes('D.C.') &&
               /^[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+){1,3}$/.test(clean);
      }) || validValues[0];

    case 'salaRevision':
      // Para salas, preferir nombres completos conocidos
      const knownSalas = ['Sala Plena', 'Sala Primera', 'Sala Segunda', 'Sala Tercera', 'Sala Cuarta', 'Sala Quinta', 'Sala Sexta', 'Sala Séptima', 'Sala Octava', 'Sala Novena'];
      return validValues.find(v => {
        const clean = v!.trim();
        return knownSalas.some(sala => clean.toLowerCase().includes(sala.toLowerCase()));
      }) || validValues[0];

    case 'expediente':
      // Para expedientes, preferir formatos válidos
      return validValues.find(v => {
        const clean = v!.trim();
        return /^[A-Z]-[\d.,]{1,10}$/.test(clean) && clean.length <= 15;
      }) || validValues[0];

    case 'numeroSentencia':
      // Para números de sentencia, preferir formato estándar
      return validValues.find(v => {
        const clean = v!.trim();
        return /^[TCASU]-\d{1,4}\/\d{2,4}$/.test(clean);
      }) || validValues[0];

    default:
      // Para otros campos, tomar el más largo que no esté truncado
      return validValues.sort((a, b) => {
        const aLen = a!.trim().length;
        const bLen = b!.trim().length;
        
        // Evitar valores que parezcan truncados
        const aTruncated = a!.includes('...') || a!.endsWith(' D') || a!.endsWith(' No');
        const bTruncated = b!.includes('...') || b!.endsWith(' D') || b!.endsWith(' No');
        
        if (aTruncated && !bTruncated) return 1;
        if (!aTruncated && bTruncated) return -1;
        
        return bLen - aLen; // Más largo primero
      })[0];
  }
}

export default router;