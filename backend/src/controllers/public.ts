import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { validateRequest } from '@/middleware/validation';
import { logger } from '@/utils/logger';

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

/**
 * @swagger
 * /api/public/preview:
 *   get:
 *     summary: Proxy endpoint for document preview to avoid CORS issues
 *     tags: [Public]
 *     parameters:
 *       - in: query
 *         name: url
 *         required: true
 *         schema:
 *           type: string
 *         description: URL of the document to preview
 */
router.get('/preview', async (req: Request, res: Response) => {
  try {
    const { url } = req.query;
    
    if (!url || typeof url !== 'string') {
      return res.status(400).json({
        error: 'URL parameter is required'
      });
    }

    logger.info(`📄 Proxying document preview: ${url}`);

    // Verificar que la URL sea válida
    let targetUrl: URL;
    try {
      targetUrl = new URL(url);
    } catch (error) {
      return res.status(400).json({
        error: 'Invalid URL format'
      });
    }

    // Solo permitir URLs HTTPS para seguridad
    if (targetUrl.protocol !== 'https:') {
      return res.status(400).json({
        error: 'Only HTTPS URLs are allowed'
      });
    }

    // Fetch del documento
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; EditorialJuridico/1.0)',
        'Accept': 'application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword,application/rtf,*/*',
      },
      // Timeout de 15 segundos
      signal: AbortSignal.timeout(15000)
    });

    if (!response.ok) {
      logger.error(`❌ Error fetching document: ${response.status} ${response.statusText}`);
      return res.status(response.status).json({
        error: `Document fetch failed: ${response.statusText}`
      });
    }

    // Obtener el tipo de contenido
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const contentLength = response.headers.get('content-length');

    // Obtener el contenido como buffer
    const buffer = await response.arrayBuffer();
    const bufferData = Buffer.from(buffer);

    // Detectar tipo de archivo por magic bytes y extensión/content-type
    const urlLower = url.toLowerCase();
    const magicBytes = bufferData.toString('hex', 0, 4);
    
    // DOCX files start with PK (ZIP format): 504B0304
    const isDOCX = urlLower.includes('.docx') || 
                   contentType.includes('wordprocessingml') ||
                   magicBytes.startsWith('504b');
                   
    // RTF files start with {\rtf
    const isRTF = (urlLower.includes('.rtf') || contentType.includes('rtf')) &&
                  !isDOCX; // Evitar conflicto con DOCX mal etiquetados
    
    if (isRTF && !isDOCX) {
      try {
        // Solo procesar RTF reales, no DOCX mal etiquetados
        let textContent = bufferData.toString('utf8');
        
        // Verificar que realmente sea RTF (debe empezar con {\rtf)
        if (textContent.startsWith('{\\rtf')) {
          // Limpiar RTF básico (remover códigos de formato RTF)
          textContent = textContent
            .replace(/\\[a-z]+\d*\s?/g, '') // Remover comandos RTF
            .replace(/[{}]/g, '') // Remover llaves
            .replace(/\\\\/g, '\\') // Escapar backslashes
            .replace(/\n{3,}/g, '\n\n') // Normalizar saltos de línea
            .trim();

          // Si tenemos texto legible, devolverlo como texto plano
          if (textContent.length > 100 && /[a-zA-ZÁ-ú]/.test(textContent)) {
            res.set({
              'Content-Type': 'text/plain; charset=utf-8',
              'Content-Disposition': 'inline',
              'Cache-Control': 'public, max-age=300',
              'X-Proxied-From': url,
              'X-Content-Converted': 'RTF-to-text'
            });
            
            return res.send(textContent);
          }
        }
      } catch (extractError) {
        logger.warn(`⚠️ Could not extract text from RTF ${url}: ${extractError}`);
        // Continuar con la respuesta original
      }
    }
    
    // Para DOCX u otros archivos, devolver el contenido original
    if (isDOCX) {
      logger.info(`📄 Serving DOCX file for viewer: ${url}`);
      
      res.set({
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': 'inline',
        'Cache-Control': 'public, max-age=300',
        'X-Proxied-From': url,
        'X-Document-Type': 'DOCX'
      });
      
      if (contentLength) {
        res.set('Content-Length', contentLength);
      }

      return res.send(bufferData);
    }

    // Respuesta normal para otros tipos de archivo
    res.set({
      'Content-Type': contentType,
      'Content-Disposition': 'inline',
      'Cache-Control': 'public, max-age=300',
      'X-Proxied-From': url
    });

    if (contentLength) {
      res.set('Content-Length', contentLength);
    }

    res.send(bufferData);

    logger.info(`✅ Document preview proxied successfully: ${contentType}, ${contentLength || 'unknown size'} bytes`);

  } catch (error) {
    logger.error('❌ Error in document preview proxy:', error);
    
    if (error instanceof Error && error.name === 'TimeoutError') {
      return res.status(408).json({
        error: 'Document fetch timeout'
      });
    }
    
    res.status(500).json({
      error: 'Failed to fetch document preview',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;