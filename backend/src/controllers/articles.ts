import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { logger } from '@/utils/logger';
import { validateRequest } from '@/middleware/validation';
import {
  ArticleFilters,
  ArticleCreateRequest,
  ArticleUpdateRequest,
  ArticlePublicationSettings
} from '../../../shared/types/article.types';
import { generateSlug } from '@/utils/slug';
import { calculateReadingTime, countWords } from '@/utils/text';
import { PublicationPositionService } from '@/services/PublicationPositionService';
import { ArticlePositioningService } from '@/services/ArticlePositioningService';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const articleFiltersSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  status: z.enum(['DRAFT', 'IN_REVIEW', 'READY', 'READY_TO_PUBLISH', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED']).optional(),
  author: z.string().cuid().optional(),
  legalArea: z.enum(['CIVIL', 'PENAL', 'MERCANTIL', 'LABORAL', 'ADMINISTRATIVO', 'FISCAL', 'CONSTITUCIONAL']).optional(),
  publicationSection: z.enum(['ACTUALIZACIONES_NORMATIVAS', 'JURISPRUDENCIA', 'ANALISIS_PRACTICO', 'DOCTRINA', 'MAS_RECIENTES']).optional(),
  createdAfter: z.string().datetime().optional(),
  search: z.string().optional(),
});

const createArticleSchema = z.object({
  sourceDocumentId: z.string().cuid(),
  title: z.string().min(10).max(200),
  content: z.string().optional().default(''),
  summary: z.string().optional().default(''),
  targetLength: z.number().min(100).max(5000).default(1500),
  tone: z.enum(['PROFESSIONAL', 'ACADEMIC', 'ACCESSIBLE']).default('PROFESSIONAL'),
  focusAreas: z.array(z.string()).default([]),
});

const updateArticleSchema = z.object({
  title: z.string().min(10).max(200).optional(),
  content: z.string().optional(),
  summary: z.string().max(500).optional(),
  keywords: z.array(z.string()).optional(),
  seoTitle: z.string().max(60).optional(),
  metaDescription: z.string().max(160).optional(),
  legalArea: z.enum(['CIVIL', 'PENAL', 'MERCANTIL', 'LABORAL', 'ADMINISTRATIVO', 'FISCAL', 'CONSTITUCIONAL']).optional(),
  publicationSection: z.enum(['ACTUALIZACIONES_NORMATIVAS', 'JURISPRUDENCIA', 'ANALISIS_PRACTICO', 'DOCTRINA', 'MAS_RECIENTES']).optional(),
  tags: z.array(z.string()).optional(),
});

const publicationSettingsSchema = z.object({
  isGeneral: z.boolean().optional(),
  isUltimasNoticias: z.boolean().optional(),
  entidadSeleccionada: z.enum([
    'CORTE_CONSTITUCIONAL',
    'CORTE_SUPREMA',
    'CONSEJO_ESTADO',
    'TRIBUNAL_SUPERIOR',
    'FISCALIA_GENERAL',
    'PROCURADURIA_GENERAL',
    'CONTRALORIA_GENERAL',
    'MINISTERIO_JUSTICIA'
  ]).nullable().optional(),
  isDestacadoSemana: z.boolean().optional(),
});

/**
 * @swagger
 * /api/articles:
 *   get:
 *     summary: Get paginated list of articles
 *     tags: [Articles]
 *     security:
 *       - bearerAuth: []
 */
router.get('/', validateRequest(articleFiltersSchema, 'query'), async (req: Request, res: Response) => {
  try {
    const filters = req.query as ArticleFilters;
    const skip = (filters.page! - 1) * filters.limit!;
    
    // Build where clause
    const where: any = {};
    
    if (filters.status) where.status = filters.status;
    if (filters.author) where.authorId = filters.author;
    if (filters.legalArea) where.legalArea = filters.legalArea;
    if (filters.publicationSection) where.publicationSection = filters.publicationSection;
    
    if (filters.createdAfter) {
      where.createdAt = { gte: new Date(filters.createdAfter) };
    }
    
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { summary: { contains: filters.search, mode: 'insensitive' } },
        { content: { contains: filters.search, mode: 'insensitive' } },
        { keywords: { hasSome: [filters.search] } },
        { tags: { hasSome: [filters.search] } },
      ];
    }

    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        where,
        skip,
        take: filters.limit!,
        orderBy: [
          { updatedAt: 'desc' }
        ],
        // ✅ LAZY LOADING: Solo metadatos ligeros, sin content (que puede ser >100KB)
        select: {
          // Identifiers
          id: true,
          slug: true,

          // Minimal content
          title: true,
          summary: true,  // ✅ Use summary, NOT content

          // Metadata
          legalArea: true,
          publicationSection: true,
          status: true,
          keywords: true,
          tags: true,
          metaTitle: true,
          metaDescription: true,

          // Stats
          views: true,
          likes: true,
          wordCount: true,
          readingTime: true,

          // Publication status
          publishedAt: true,
          scheduledAt: true,
          isGeneral: true,
          isUltimasNoticias: true,
          isDestacadoSemana: true,
          isSeccionIntermedia: true,
          isSeccionInferior: true,
          posicionGeneral: true,
          posicionUltimasNoticias: true,
          posicionSeccionIntermedia: true,
          posicionSeccionInferior: true,

          // Relations
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            }
          },
          sourceDocument: {
            select: {
              id: true,
              title: true,
              source: true,
              legalArea: true,
              publicationDate: true, // ✅ FIX: Incluir fecha de publicación
            }
          },

          // Timestamps
          createdAt: true,
          updatedAt: true,

          // ✅ FIX: Incluir imageUrl y content para la vista de artículos
          imageUrl: true,
          content: true,

          // ❌ EXCLUDED (heavy relations):
          // generatedImages: false
          // mediaAssets: false
        }
      }),
      prisma.article.count({ where })
    ]);

    const totalPages = Math.ceil(total / filters.limit!);

    res.json({
      data: articles,
      pagination: {
        page: filters.page!,
        limit: filters.limit!,
        total,
        totalPages,
        hasNext: filters.page! < totalPages,
        hasPrev: filters.page! > 1,
      }
    });

  } catch (error) {
    logger.error('Error retrieving articles', { error, userId: req.user.id });
    res.status(500).json({
      error: 'Failed to retrieve articles',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @swagger
 * /api/articles:
 *   post:
 *     summary: Create new article from approved document
 *     tags: [Articles]
 *     security:
 *       - bearerAuth: []
 */
router.post('/', validateRequest(createArticleSchema), async (req: Request, res: Response) => {
  try {
    // Verificar que el usuario esté autenticado
    if (!req.user || !req.user.id) {
      logger.warn('Attempt to create article without authenticated user', {
        headers: req.headers.authorization ? 'Bearer token present' : 'No authorization header',
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      return res.status(401).json({
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    const data = req.body as ArticleCreateRequest;

    console.log('🔥 DEBUGGING ARTICLE CREATION');
    console.log('🔥 Raw req.body:', JSON.stringify(req.body, null, 2));
    console.log('🔥 Data after casting:', JSON.stringify(data, null, 2));
    console.log('🔥 All keys in data:', Object.keys(data));

    // Verify source document exists and is approved
    console.log('🔍 Looking for source document:', data.sourceDocumentId);
    const sourceDocument = await prisma.document.findUnique({
      where: { id: data.sourceDocumentId }
    });

    console.log('📄 Source document found:', sourceDocument ? { id: sourceDocument.id, status: sourceDocument.status, legalArea: sourceDocument.legalArea } : 'NOT FOUND');

    if (!sourceDocument) {
      console.log('❌ Source document not found:', data.sourceDocumentId);
      return res.status(404).json({
        error: 'Source document not found'
      });
    }

    // Documents can be APPROVED (old system) or READY (new system)
    if (sourceDocument.status !== 'APPROVED' && sourceDocument.status !== 'READY') {
      console.log('❌ Source document not ready for article creation:', sourceDocument.status);
      return res.status(400).json({
        error: 'Source document must be approved or ready before creating article',
        currentStatus: sourceDocument.status
      });
    }

    // Generate unique slug
    const baseSlug = generateSlug(data.title);
    let slug = baseSlug;
    let counter = 1;
    
    while (await prisma.article.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Create article - ONLY with valid schema fields (no extra parameters)
    const articleData = {
      sourceDocumentId: data.sourceDocumentId,
      title: data.title,
      slug,
      content: data.content || '',
      summary: data.summary || '',
      legalArea: sourceDocument.legalArea as any, // Cast to match enum
      publicationSection: 'MAS_RECIENTES' as any, // Cast to match enum
      authorId: req.user.id,
      wordCount: data.content ? countWords(data.content) : 0,
      readingTime: data.content ? calculateReadingTime(data.content) : 0,
    };

    console.log('🔨 Creating article with data:', JSON.stringify(articleData, null, 2));
    console.log('🔨 Keys in articleData:', Object.keys(articleData));
    console.log('🔨 articleData has generationParameters?', 'generationParameters' in articleData);

    const article = await prisma.article.create({
      data: articleData,
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          }
        },
        sourceDocument: {
          select: {
            id: true,
            title: true,
            source: true,
          }
        }
      }
    });

    // ✅ TRANSFERIR IMÁGENES GENERADAS del documento al artículo
    console.log('🖼️ Transfiriendo imágenes generadas del documento al artículo...');

    // Buscar todas las imágenes asociadas al documento fuente
    const documentImages = await prisma.generatedImage.findMany({
      where: {
        documentId: data.sourceDocumentId
      }
    });

    console.log(`📸 Encontradas ${documentImages.length} imágenes en el documento ${data.sourceDocumentId}`);

    if (documentImages.length > 0) {
      // Asociar las imágenes al artículo recién creado
      await prisma.generatedImage.updateMany({
        where: {
          documentId: data.sourceDocumentId
        },
        data: {
          articleId: article.id
        }
      });

      console.log(`✅ ${documentImages.length} imágenes transferidas al artículo ${article.id}`);
    } else {
      console.log('⚠️ No se encontraron imágenes en el documento para transferir');
    }

    // Create initial version
    await prisma.articleVersion.create({
      data: {
        articleId: article.id,
        title: article.title,
        content: article.content,
        summary: article.summary,
        versionNumber: 1,
        changeDescription: 'Initial version created',
      }
    });

    // Log audit trail
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'ARTICLE_CREATED',
        description: `Article created: ${article.title} (ID: ${article.id})`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent') || '',
      }
    });

    res.status(201).json({
      data: article,
      message: 'Article created successfully'
    });

    logger.info('Article created', {
      articleId: article.id,
      title: article.title,
      userId: req.user.id
    });

  } catch (error) {
    const errorDetails = {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      userId: req.user?.id || 'No user ID',
      sourceDocumentId: req.body?.sourceDocumentId,
      requestBody: req.body,
      ip: req.ip,
      fullError: error
    };

    logger.error('Error creating article - DETAILED DEBUG', errorDetails);

    // También log a console para debugging inmediato
    console.error('🚨 ARTICLE CREATION ERROR:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      sourceDocumentId: req.body?.sourceDocumentId,
      userId: req.user?.id,
      stack: error instanceof Error ? error.stack?.split('\n').slice(0, 5) : undefined
    });

    res.status(500).json({
      error: 'Failed to create article',
      message: error instanceof Error ? error.message : 'Unknown error',
      code: 'ARTICLE_CREATION_ERROR'
    });
  }
});

/**
 * @swagger
 * /api/articles/{id}:
 *   get:
 *     summary: Get article by ID
 *     tags: [Articles]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const article = await prisma.article.findUnique({
      where: { id: req.params.id },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          }
        },
        sourceDocument: {
          select: {
            id: true,
            title: true,
            source: true,
            url: true,
            legalArea: true,
          }
        },
        versions: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            versionNumber: true,
            label: true,
            createdAt: true,
            autoGenerated: true,
            createdBy: {
              select: {
                firstName: true,
                lastName: true,
              }
            }
          }
        },
        mediaAssets: {
          include: {
            mediaAsset: true,
          }
        }
      }
    });

    if (!article) {
      return res.status(404).json({
        error: 'Article not found'
      });
    }

    res.json({ data: article });

  } catch (error) {
    logger.error('Error retrieving article', { 
      error, 
      articleId: req.params.id, 
      userId: req.user.id 
    });
    res.status(500).json({
      error: 'Failed to retrieve article',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @swagger
 * /api/articles/{id}:
 *   put:
 *     summary: Update article
 *     tags: [Articles]
 *     security:
 *       - bearerAuth: []
 */
router.put('/:id', validateRequest(updateArticleSchema), async (req: Request, res: Response) => {
  try {
    const articleId = req.params.id;
    const updates = req.body as ArticleUpdateRequest;
    
    // Check if article exists and user has permission
    const existingArticle = await prisma.article.findUnique({
      where: { id: articleId },
      include: { author: true }
    });

    if (!existingArticle) {
      return res.status(404).json({
        error: 'Article not found'
      });
    }

    // Check permissions (author, editor, or admin)
    if (existingArticle.authorId !== req.user.id && 
        !['ADMIN', 'EDITOR_SENIOR'].includes(req.user.role)) {
      return res.status(403).json({
        error: 'Insufficient permissions to edit this article'
      });
    }

    // Prepare update data
    const updateData: any = {
      ...updates,
      lastEditedAt: new Date(),
    };

    // Update slug if title changed
    if (updates.title && updates.title !== existingArticle.title) {
      let newSlug = generateSlug(updates.title);
      let counter = 1;
      
      while (await prisma.article.findFirst({ 
        where: { 
          slug: newSlug, 
          id: { not: articleId } 
        } 
      })) {
        newSlug = `${generateSlug(updates.title)}-${counter}`;
        counter++;
      }
      
      updateData.slug = newSlug;
    }

    // Update word count and reading time if content changed
    if (updates.content) {
      updateData.wordCount = countWords(updates.content);
      updateData.readingTime = calculateReadingTime(updates.content);
    }

    // Update article
    const updatedArticle = await prisma.article.update({
      where: { id: articleId },
      data: updateData,
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          }
        }
      }
    });

    // Create new version if significant changes
    if (updates.content || updates.title) {
      const latestVersion = await prisma.articleVersion.findFirst({
        where: { articleId },
        orderBy: { versionNumber: 'desc' }
      });

      await prisma.articleVersion.create({
        data: {
          articleId,
          versionNumber: (latestVersion?.versionNumber || 0) + 1,
          title: updatedArticle.title,
          content: updatedArticle.content,
          summary: updatedArticle.summary,
          seoTitle: updatedArticle.seoTitle,
          metaDescription: updatedArticle.metaDescription,
          createdById: req.user.id,
          autoGenerated: false,
          changeSummary: Object.keys(updates).join(', '),
        }
      });
    }

    // Log audit trail
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        actionType: 'ARTICLE_UPDATED',
        resourceType: 'article',
        resourceId: articleId,
        details: {
          updatedFields: Object.keys(updates),
          changes: updates,
        },
        result: { success: true },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent') || '',
      }
    });

    res.json({
      data: updatedArticle,
      message: 'Article updated successfully'
    });

    logger.info('Article updated', {
      articleId,
      updatedFields: Object.keys(updates),
      userId: req.user.id
    });

  } catch (error) {
    logger.error('Error updating article', { 
      error, 
      articleId: req.params.id, 
      userId: req.user.id 
    });
    res.status(500).json({
      error: 'Failed to update article',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @swagger
 * /api/articles/{id}/publish:
 *   post:
 *     summary: Publish article
 *     tags: [Articles]
 *     security:
 *       - bearerAuth: []
 */
router.post('/:id/publish', async (req: Request, res: Response) => {
  try {
    const articleId = req.params.id;
    
    const article = await prisma.article.findUnique({
      where: { id: articleId }
    });

    if (!article) {
      return res.status(404).json({
        error: 'Article not found'
      });
    }

    if (article.status === 'PUBLISHED') {
      return res.status(400).json({
        error: 'Article is already published'
      });
    }

    // Check if article is ready for publication
    if (!article.content.trim() || !article.summary.trim()) {
      logger.warn('Article cannot be published - missing content or summary', {
        articleId,
        hasContent: !!article.content.trim(),
        hasSummary: !!article.summary.trim(),
        contentLength: article.content.length,
        summaryLength: article.summary.length
      });

      return res.status(400).json({
        error: 'Article must have content and summary before publishing'
      });
    }

    const updatedArticle = await prisma.article.update({
      where: { id: articleId },
      data: {
        status: 'PUBLISHED',
        publishedAt: new Date(),
      }
    });

    // Log audit trail
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'ARTICLE_PUBLISHED',
        description: `Article "${updatedArticle.title}" published`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent') || '',
      }
    });

    // NUEVO: Detectar automáticamente si debe ejecutarse el empuje
    // Verificar si el artículo se está publicando en la sección General
    const publicationSettings = req.body as { isGeneral?: boolean } | undefined;
    const shouldExecutePush = publicationSettings?.isGeneral === true;

    // SOLUCIÓN: Ejecutar empuje automático SIEMPRE que se detecte publicación en General
    if (shouldExecutePush) {
      try {
        logger.info(`🚀 EMPUJE AUTOMÁTICO DETECTADO - Iniciando para artículo: ${articleId}`);

        // Ejecutar el empuje automático a través de todas las secciones
        await ArticlePositioningService.pushArticlesThroughPortal(articleId);

        logger.info(`✅ Empuje automático completado exitosamente para artículo: ${articleId}`);

        res.json({
          data: updatedArticle,
          message: 'Article published successfully and positioned in General section with automatic push completed',
          pushExecuted: true
        });
      } catch (pushError) {
        logger.error(`❌ Error en empuje automático para artículo ${articleId}:`, pushError);

        // Artículo se publicó exitosamente, pero hubo error en el empuje
        res.json({
          data: updatedArticle,
          message: 'Article published successfully, but there was an issue with automatic positioning',
          warning: pushError instanceof Error ? pushError.message : 'Unknown positioning error',
          pushExecuted: false
        });
      }
    } else {
      logger.info(`📰 Artículo publicado sin empuje automático: ${articleId}`);
      res.json({
        data: updatedArticle,
        message: 'Article published successfully',
        pushExecuted: false
      });
    }

    logger.info('Article published', {
      articleId,
      userId: req.user.id
    });

  } catch (error) {
    logger.error('Error publishing article', { 
      error, 
      articleId: req.params.id, 
      userId: req.user.id 
    });
    res.status(500).json({
      error: 'Failed to publish article',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @swagger
 * /api/articles/{id}/publication-settings:
 *   put:
 *     summary: Update article publication settings
 *     tags: [Articles]
 *     security:
 *       - bearerAuth: []
 */
router.put('/:id/publication-settings', validateRequest(publicationSettingsSchema), async (req: Request, res: Response) => {
  try {
    const articleId = req.params.id;
    const settings = req.body as ArticlePublicationSettings;

    // Check if article exists and is published
    const article = await prisma.article.findUnique({
      where: { id: articleId }
    });

    if (!article) {
      return res.status(404).json({
        error: 'Article not found'
      });
    }

    if (article.status !== 'PUBLISHED') {
      return res.status(400).json({
        error: 'Only published articles can have publication settings updated'
      });
    }

    // Update publication settings using the service
    // Note: For General section specifically, we use ArticlePositioningService for consistency with 6-article system
    if (settings.isGeneral !== undefined) {
      if (settings.isGeneral) {
        // Use ArticlePositioningService for General section to ensure consistency with 6-article system
        await ArticlePositioningService.pushArticlesThroughPortal(articleId);
      } else {
        // Remove from General section manually
        await prisma.article.update({
          where: { id: articleId },
          data: {
            isGeneral: false,
            posicionGeneral: null
          }
        });
      }
    }

    // For other settings, use PublicationPositionService
    const otherSettings = { ...settings };
    delete otherSettings.isGeneral;
    if (Object.keys(otherSettings).length > 0) {
      await PublicationPositionService.updatePublicationSettings(articleId, otherSettings);
    }

    // Get updated article
    const updatedArticle = await prisma.article.findUnique({
      where: { id: articleId },
      include: {
        author: {
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
        action: 'PUBLICATION_SETTINGS_UPDATED',
        description: `Publication settings updated for article "${updatedArticle?.title}"`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent') || '',
      }
    });

    res.json({
      data: updatedArticle,
      message: 'Publication settings updated successfully'
    });

    logger.info('Publication settings updated', {
      articleId,
      settings,
      userId: req.user.id
    });

  } catch (error) {
    logger.error('Error updating publication settings', {
      error,
      articleId: req.params.id,
      userId: req.user.id
    });
    res.status(500).json({
      error: 'Failed to update publication settings',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @swagger
 * /api/articles/publication-stats:
 *   get:
 *     summary: Get publication statistics
 *     tags: [Articles]
 *     security:
 *       - bearerAuth: []
 */
router.get('/publication-stats', async (req: Request, res: Response) => {
  try {
    // Use ArticlePositioningService for comprehensive portal stats including 6-article General section
    const stats = await ArticlePositioningService.getPortalStats();

    res.json({
      data: stats,
      message: 'Publication statistics retrieved successfully'
    });

  } catch (error) {
    logger.error('Error getting publication stats', { error, userId: req.user.id });
    res.status(500).json({
      error: 'Failed to retrieve publication statistics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @swagger
 * /api/articles/{id}/publish-general:
 *   post:
 *     summary: Publish article in General section with automatic push
 *     tags: [Articles]
 *     security:
 *       - bearerAuth: []
 */
router.post('/:id/publish-general', async (req: Request, res: Response) => {
  try {
    const articleId = req.params.id;

    const article = await prisma.article.findUnique({
      where: { id: articleId }
    });

    if (!article) {
      return res.status(404).json({
        error: 'Article not found'
      });
    }

    if (article.status === 'PUBLISHED') {
      return res.status(400).json({
        error: 'Article is already published'
      });
    }

    // Check if article is ready for publication
    if (!article.content.trim() || !article.summary.trim()) {
      return res.status(400).json({
        error: 'Article must have content and summary before publishing'
      });
    }

    // Publicar el artículo
    // ⚠️ CRÍTICO: Establecer isGeneral: true ANTES del empuje para evitar conflictos
    const updatedArticle = await prisma.article.update({
      where: { id: articleId },
      data: {
        status: 'PUBLISHED',
        publishedAt: new Date(),
        isGeneral: true,
        posicionGeneral: null, // El servicio asignará la posición 1
      }
    });

    // Log audit trail
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'ARTICLE_PUBLISHED_GENERAL',
        description: `Article "${updatedArticle.title}" published in General section with auto-push`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent') || '',
      }
    });

    // Ejecutar empuje automático
    try {
      logger.info(`🚀 Ejecutando empuje automático en General para artículo: ${articleId}`);

      await ArticlePositioningService.pushArticlesThroughPortal(articleId);

      logger.info(`✅ Empuje automático completado para artículo: ${articleId}`);

      // Obtener estadísticas del portal después del empuje
      const portalStats = await ArticlePositioningService.getPortalStats();

      res.json({
        data: updatedArticle,
        message: 'Article published successfully in General section with automatic positioning',
        portalStats,
        pushCompleted: true
      });

    } catch (pushError) {
      logger.error(`❌ Error en empuje automático:`, pushError);

      res.json({
        data: updatedArticle,
        message: 'Article published but automatic positioning failed',
        error: pushError instanceof Error ? pushError.message : 'Unknown positioning error',
        pushCompleted: false
      });
    }

  } catch (error) {
    logger.error('Error publishing article in General section:', error);
    res.status(500).json({
      error: 'Failed to publish article in General section',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @swagger
 * /api/articles/portal-stats:
 *   get:
 *     summary: Get portal positioning statistics
 *     tags: [Articles]
 *     security:
 *       - bearerAuth: []
 */
router.get('/portal-stats', async (req: Request, res: Response) => {
  try {
    const stats = await ArticlePositioningService.getPortalStats();
    const integrity = await ArticlePositioningService.validatePortalIntegrity();

    res.json({
      data: {
        stats,
        integrity
      }
    });

  } catch (error) {
    logger.error('Error getting portal stats:', error);
    res.status(500).json({
      error: 'Failed to get portal stats',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;