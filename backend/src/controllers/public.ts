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
  legalArea: z.enum(['CIVIL', 'PENAL', 'MERCANTIL', 'LABORAL', 'ADMINISTRATIVO', 'FISCAL', 'CONSTITUCIONAL', 'REGULATORIO', 'SOCIETARIO']).optional(),
  entidad: z.enum([
    'CORTE_CONSTITUCIONAL',
    'CORTE_SUPREMA',
    'CONSEJO_ESTADO',
    'TRIBUNAL_SUPERIOR',
    'FISCALIA_GENERAL',
    'PROCURADURIA_GENERAL',
    'CONTRALORIA_GENERAL',
    'MINISTERIO_JUSTICIA'
  ]).optional(),
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
    if (filters.entidad) where.entidadSeleccionada = filters.entidad;
    
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
          views: true,
          publishedAt: true,
          imageUrl: true, // ✅ Agregar campo imageUrl
          author: {
            select: {
              firstName: true,
              lastName: true,
              department: true,
            }
          },
          generatedImages: {
            select: {
              id: true,
              filename: true,
              localPath: true,
              originalUrl: true,
              width: true,
              height: true,
              format: true,
              metaDescription: true,
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
        metaTitle: true,
        metaDescription: true,
        keywords: true,
        tags: true,
        legalArea: true,
        publicationSection: true,
        wordCount: true,
        readingTime: true,
        views: true,
        publishedAt: true,
        imageUrl: true, // ✅ FIX: Incluir imageUrl para mostrar imagen correcta
        author: {
          select: {
            firstName: true,
            lastName: true,
            department: true,
          }
        },
        sourceDocument: {
          select: {
            title: true,
            source: true,
            url: true,
            publicationDate: true,
            documentPath: true,
          }
        },
        generatedImages: {
          select: {
            id: true,
            filename: true,
            localPath: true,
            originalUrl: true,
            width: true,
            height: true,
            format: true,
            metaDescription: true,
            prompt: true,
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
        views: { increment: 1 }
      }
    });

    // imageUrl ya está disponible en el artículo
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

/**
 * @swagger
 * /api/public/portal-sections:
 *   get:
 *     summary: Get articles organized by portal sections
 *     tags: [Public]
 */
router.get('/portal-sections', async (req: Request, res: Response) => {
  try {
    // Obtener artículos para cada sección del portal
    const [generalAll, ultimasNoticias, entidades, destacados] = await Promise.all([
      // Sección General - 6 artículos distribuidos (posiciones 1-6)
      prisma.article.findMany({
        where: {
          status: 'PUBLISHED',
          isGeneral: true
        },
        orderBy: { posicionGeneral: 'asc' },
        take: 6,
        select: {
          id: true,
          title: true,
          slug: true,
          summary: true,
          publishedAt: true,
          readingTime: true,
          views: true,
          posicionGeneral: true,
          imageUrl: true, // ✅ Agregar campo imageUrl
          author: {
            select: {
              firstName: true,
              lastName: true,
            }
          },
          generatedImages: {
            select: {
              id: true,
              filename: true,
              localPath: true,
              originalUrl: true,
              width: true,
              height: true,
              format: true,
              metaDescription: true,
            }
          }
        }
      }),

      // Últimas Noticias (máximo 5)
      prisma.article.findMany({
        where: {
          status: 'PUBLISHED',
          isUltimasNoticias: true
        },
        orderBy: { posicionUltimasNoticias: 'asc' },
        take: 5,
        select: {
          id: true,
          title: true,
          slug: true,
          publishedAt: true,
          readingTime: true,
          imageUrl: true, // ✅ Agregar campo imageUrl
          generatedImages: {
            select: {
              id: true,
              filename: true,
              localPath: true,
              originalUrl: true,
              width: true,
              height: true,
              format: true,
              metaDescription: true,
            }
          }
        }
      }),

      // Artículos por Entidades
      prisma.article.findMany({
        where: {
          status: 'PUBLISHED',
          entidadSeleccionada: { not: null }
        },
        orderBy: { publishedAt: 'desc' },
        take: 10,
        select: {
          id: true,
          title: true,
          slug: true,
          summary: true,
          entidadSeleccionada: true,
          publishedAt: true,
          readingTime: true,
          imageUrl: true, // ✅ Agregar campo imageUrl
          generatedImages: {
            select: {
              id: true,
              filename: true,
              localPath: true,
              originalUrl: true,
              width: true,
              height: true,
              format: true,
              metaDescription: true,
            }
          }
        }
      }),

      // Destacados de la Semana (máximo 4)
      prisma.article.findMany({
        where: {
          status: 'PUBLISHED',
          isDestacadoSemana: true
        },
        orderBy: { publishedAt: 'desc' },
        take: 4,
        select: {
          id: true,
          title: true,
          slug: true,
          summary: true,
          publishedAt: true,
          readingTime: true,
          imageUrl: true, // ✅ Agregar campo imageUrl
          author: {
            select: {
              firstName: true,
              lastName: true,
            }
          },
          generatedImages: {
            select: {
              id: true,
              filename: true,
              localPath: true,
              originalUrl: true,
              width: true,
              height: true,
              format: true,
              metaDescription: true,
            }
          }
        }
      })
    ]);

    // Agrupar artículos por entidad
    const entidadesGrouped = entidades.reduce((acc, article) => {
      const entidad = article.entidadSeleccionada!;
      if (!acc[entidad]) {
        acc[entidad] = [];
      }
      acc[entidad].push(article);
      return acc;
    }, {} as Record<string, typeof entidades>);

    // ✅ ACTUALIZADO: Dividir General en 3 bloques visuales (mantiene sistema de empuje 1-6)
    // Bloque 1 (pos 1-2): Superior del portal
    // Bloque 2 (pos 3-4): Debajo de Últimas Noticias
    // Bloque 3 (pos 5-6): Debajo de Instituciones
    // imageUrl ya está disponible en cada artículo, no necesitamos post-procesamiento

    res.json({
      data: {
        generalTop: generalAll.slice(0, 2),      // Posiciones 1-2
        generalMiddle: generalAll.slice(2, 4),   // Posiciones 3-4
        generalBottom: generalAll.slice(4, 6),   // Posiciones 5-6
        ultimasNoticias: ultimasNoticias,
        entidades: entidadesGrouped,
        destacados: destacados
      }
    });

  } catch (error) {
    res.status(500).json({
      error: 'Failed to retrieve portal sections',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @swagger
 * /api/public/articles/by-legal-area/{legalArea}:
 *   get:
 *     summary: Get articles by legal area for section pages
 *     tags: [Public]
 */
router.get('/articles/by-legal-area/:legalArea', async (req: Request, res: Response) => {
  try {
    const { legalArea } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const where = {
      status: 'PUBLISHED',
      legalArea: legalArea.toUpperCase()
    };

    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        where,
        skip,
        take: limit,
        orderBy: { publishedAt: 'desc' },
        select: {
          id: true,
          title: true,
          slug: true,
          summary: true,
          publishedAt: true,
          readingTime: true,
          views: true,
          tags: true,
          imageUrl: true, // ✅ Agregar campo imageUrl
          author: {
            select: {
              firstName: true,
              lastName: true,
            }
          },
          generatedImages: {
            select: {
              id: true,
              filename: true,
              localPath: true,
              originalUrl: true,
              width: true,
              height: true,
              format: true,
              metaDescription: true,
            }
          }
        }
      }),
      prisma.article.count({ where })
    ]);

    const totalPages = Math.ceil(total / limit);

    // imageUrl ya está disponible en cada artículo
    res.json({
      data: articles,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      }
    });

  } catch (error) {
    res.status(500).json({
      error: 'Failed to retrieve articles by legal area',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;