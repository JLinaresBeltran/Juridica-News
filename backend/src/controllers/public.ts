import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { validateRequest } from '@/middleware/validation';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const publicFiltersSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20),
  section: z.enum(['ACTUALIZACIONES_NORMATIVAS', 'JURISPRUDENCIA', 'ANALISIS_PRACTICO', 'DOCTRINA', 'MAS_RECIENTES']).optional(),
  legalArea: z.enum(['CIVIL', 'PENAL', 'MERCANTIL', 'LABORAL', 'ADMINISTRATIVO', 'FISCAL', 'CONSTITUCIONAL']).optional(),
  search: z.string().optional(),
});

/**
 * @swagger
 * /api/public/articles:
 *   get:
 *     summary: Get published articles for public consumption
 *     tags: [Public]
 */
router.get('/articles', validateRequest(publicFiltersSchema, 'query'), async (req: Request, res: Response) => {
  try {
    const filters = req.query;
    const skip = (filters.page! - 1) * filters.limit!;
    
    const where: any = {
      status: 'PUBLISHED',
      publishedAt: { not: null }
    };
    
    if (filters.section) where.publicationSection = filters.section;
    if (filters.legalArea) where.legalArea = filters.legalArea;
    
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { summary: { contains: filters.search, mode: 'insensitive' } },
        { keywords: { hasSome: [filters.search] } },
      ];
    }

    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        where,
        skip,
        take: filters.limit!,
        orderBy: [
          { publishedAt: 'desc' }
        ],
        select: {
          id: true,
          title: true,
          slug: true,
          summary: true,
          legalArea: true,
          publicationSection: true,
          keywords: true,
          tags: true,
          wordCount: true,
          readingTime: true,
          viewCount: true,
          publishedAt: true,
          author: {
            select: {
              firstName: true,
              lastName: true,
              department: true,
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
    res.status(500).json({
      error: 'Failed to retrieve articles',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @swagger
 * /api/public/articles/{slug}:
 *   get:
 *     summary: Get published article by slug
 *     tags: [Public]
 */
router.get('/articles/:slug', async (req: Request, res: Response) => {
  try {
    const article = await prisma.article.findFirst({
      where: {
        slug: req.params.slug,
        status: 'PUBLISHED'
      },
      select: {
        id: true,
        title: true,
        slug: true,
        content: true,
        summary: true,
        seoTitle: true,
        metaDescription: true,
        keywords: true,
        tags: true,
        legalArea: true,
        publicationSection: true,
        wordCount: true,
        readingTime: true,
        viewCount: true,
        publishedAt: true,
        author: {
          select: {
            firstName: true,
            lastName: true,
            professionalTitle: true,
          }
        },
        sourceDocument: {
          select: {
            title: true,
            source: true,
            url: true,
            publicationDate: true,
          }
        }
      }
    });

    if (!article) {
      return res.status(404).json({
        error: 'Article not found'
      });
    }

    // Increment view count
    await prisma.article.update({
      where: { id: article.id },
      data: {
        viewCount: { increment: 1 }
      }
    });

    res.json({ data: article });

  } catch (error) {
    res.status(500).json({
      error: 'Failed to retrieve article',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;