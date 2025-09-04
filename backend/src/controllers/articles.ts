import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { logger } from '@/utils/logger';
import { validateRequest } from '@/middleware/validation';
import { 
  ArticleFilters, 
  ArticleCreateRequest, 
  ArticleUpdateRequest 
} from '../../../shared/types/article.types';
import { generateSlug } from '@/utils/slug';
import { calculateReadingTime, countWords } from '@/utils/text';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const articleFiltersSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  status: z.enum(['DRAFT', 'IN_REVIEW', 'READY_TO_PUBLISH', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED']).optional(),
  author: z.string().cuid().optional(),
  legalArea: z.enum(['CIVIL', 'PENAL', 'MERCANTIL', 'LABORAL', 'ADMINISTRATIVO', 'FISCAL', 'CONSTITUCIONAL']).optional(),
  publicationSection: z.enum(['ACTUALIZACIONES_NORMATIVAS', 'JURISPRUDENCIA', 'ANALISIS_PRACTICO', 'DOCTRINA', 'MAS_RECIENTES']).optional(),
  createdAfter: z.string().datetime().optional(),
  search: z.string().optional(),
});

const createArticleSchema = z.object({
  sourceDocumentId: z.string().cuid(),
  title: z.string().min(10).max(200),
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
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            }
          },
          editor: {
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
            }
          },
          _count: {
            select: {
              versions: true,
            }
          }
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
    const data = req.body as ArticleCreateRequest;
    
    // Verify source document exists and is approved
    const sourceDocument = await prisma.document.findUnique({
      where: { id: data.sourceDocumentId }
    });

    if (!sourceDocument) {
      return res.status(404).json({
        error: 'Source document not found'
      });
    }

    if (sourceDocument.status !== 'APPROVED') {
      return res.status(400).json({
        error: 'Source document must be approved before creating article',
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

    // Create article
    const article = await prisma.article.create({
      data: {
        sourceDocumentId: data.sourceDocumentId,
        title: data.title,
        slug,
        content: '', // Will be populated by AI generation
        summary: '',
        legalArea: sourceDocument.legalArea,
        publicationSection: 'MAS_RECIENTES', // Default section
        authorId: req.user.id,
        wordCount: 0,
        readingTime: 0,
        generationParameters: {
          targetLength: data.targetLength,
          tone: data.tone,
          focusAreas: data.focusAreas,
        },
      },
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

    // Create initial version
    await prisma.articleVersion.create({
      data: {
        articleId: article.id,
        versionNumber: 1,
        label: 'Initial version',
        title: article.title,
        content: article.content,
        summary: article.summary,
        createdById: req.user.id,
        autoGenerated: true,
      }
    });

    // Log audit trail
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        actionType: 'ARTICLE_CREATED',
        resourceType: 'article',
        resourceId: article.id,
        details: {
          sourceDocumentId: data.sourceDocumentId,
          generationParameters: data,
        },
        result: { success: true },
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
    logger.error('Error creating article', { error, userId: req.user.id });
    res.status(500).json({
      error: 'Failed to create article',
      message: error instanceof Error ? error.message : 'Unknown error'
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
        editor: {
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
        },
        editor: {
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
      return res.status(400).json({
        error: 'Article must have content and summary before publishing'
      });
    }

    const updatedArticle = await prisma.article.update({
      where: { id: articleId },
      data: {
        status: 'PUBLISHED',
        publishedAt: new Date(),
        editorId: req.user.id,
      }
    });

    // Log audit trail
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        actionType: 'ARTICLE_PUBLISHED',
        resourceType: 'article',
        resourceId: articleId,
        details: {
          publishedAt: updatedArticle.publishedAt,
        },
        result: { success: true },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent') || '',
      }
    });

    res.json({
      data: updatedArticle,
      message: 'Article published successfully'
    });

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

export default router;