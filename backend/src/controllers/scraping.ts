/**
 * Controlador para el servicio de scraping
 */

import express, { Request, Response, NextFunction } from 'express';
import { body, query, validationResult } from 'express-validator';
import { requireRole } from '@/middleware/auth';
import { ScrapingService } from '@/services/ScrapingService';
import { logger } from '@/utils/logger';

// Extend Request interface to include user
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string;
    email: string;
  };
}

const router = express.Router();
const scrapingService = new ScrapingService();

/**
 * @swagger
 * /api/scraping/extract:
 *   post:
 *     tags: [Scraping]
 *     summary: Extraer documentos de fuentes jurídicas
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               source:
 *                 type: string
 *                 enum: [corte_constitucional, consejo_estado]
 *               limit:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 50
 *               downloadDocuments:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Documentos extraídos exitosamente
 *       400:
 *         description: Parámetros inválidos
 *       401:
 *         description: No autorizado
 */
router.post('/extract',
  requireRole(['ADMIN', 'EDITOR']),
  [
    body('source')
      .isIn(['corte_constitucional', 'consejo_estado'])
      .withMessage('Fuente inválida'),
    body('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('Límite debe ser entre 1 y 50'),
    body('downloadDocuments')
      .optional()
      .isBoolean()
      .withMessage('downloadDocuments debe ser booleano')
  ],
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Parámetros inválidos',
          errors: errors.array()
        });
      }

      const { source, limit = 10, downloadDocuments = false } = req.body;
      const userId = req.user?.id;
      
      logger.info(`🔍 Iniciando extracción de ${source} (límite: ${limit}, descarga: ${downloadDocuments})`, {
        userId,
        source,
        limit,
        downloadDocuments
      });

      const result = await scrapingService.extractDocuments(source, {
        limit,
        downloadDocuments,
        userId
      });

      // Mapear respuesta para coincidir con la interface del frontend
      res.json({
        success: true,
        message: `Extracción completada de ${source}`,
        documents: result.documents.map(doc => {
          let metadata = {};
          try {
            metadata = doc.metadata ? JSON.parse(doc.metadata) : {};
          } catch (error) {
            logger.warn('Error parsing document metadata:', error);
            metadata = {};
          }
          
          return {
            document_id: doc.externalId || doc.id,
            title: doc.title,
            source: doc.source,
            court: 'Corte Constitucional',
            document_type: (metadata as any).document_type || 'SENTENCE',
            pdf_url: doc.url,
            html_url: null,
            date: doc.publicationDate || new Date().toISOString(),
            extraction_date: doc.extractedAt || new Date().toISOString(),
            magistrate: (metadata as any).magistrate || ''
          };
        }),
        downloadedCount: result.downloadedCount || 0,
        extractionTime: result.extractionTime || 0,
        totalFound: result.documents.length
      });

    } catch (error) {
      logger.error('❌ Error en extracción:', error);
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/scraping/sources:
 *   get:
 *     tags: [Scraping]
 *     summary: Obtener fuentes disponibles para scraping
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de fuentes disponibles
 */
router.get('/sources',
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const sources = await scrapingService.getAvailableSources();
      
      res.json({
        success: true,
        data: { sources }
      });

    } catch (error) {
      logger.error('❌ Error obteniendo fuentes:', error);
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/scraping/status/{jobId}:
 *   get:
 *     tags: [Scraping]
 *     summary: Obtener estado de un trabajo de scraping
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Estado del trabajo
 *       404:
 *         description: Trabajo no encontrado
 */
router.get('/status/:jobId',
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { jobId } = req.params;
      
      const status = await scrapingService.getJobStatus(jobId);
      
      if (!status) {
        return res.status(404).json({
          success: false,
          message: 'Trabajo no encontrado'
        });
      }

      res.json({
        success: true,
        data: status
      });

    } catch (error) {
      logger.error('❌ Error obteniendo estado:', error);
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/scraping/history:
 *   get:
 *     tags: [Scraping]
 *     summary: Obtener historial de extracciones
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *     responses:
 *       200:
 *         description: Historial de extracciones
 */
router.get('/history',
  [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Página debe ser mayor a 0'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Límite debe ser entre 1 y 100')
  ],
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Parámetros inválidos',
          errors: errors.array()
        });
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const userId = req.user?.id;
      const userRole = req.user?.role;
      
      const history = await scrapingService.getExtractionHistory({
        page,
        limit,
        userId: userRole === 'admin' ? undefined : userId
      });

      res.json({
        success: true,
        data: history
      });

    } catch (error) {
      logger.error('❌ Error obteniendo historial:', error);
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/scraping/download:
 *   post:
 *     tags: [Scraping]
 *     summary: Descargar documentos específicos
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
 *     responses:
 *       200:
 *         description: Documentos descargados exitosamente
 */
router.post('/download',
  requireRole(['ADMIN', 'EDITOR']),
  [
    body('documentIds')
      .isArray({ min: 1 })
      .withMessage('documentIds debe ser un array no vacío')
  ],
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Parámetros inválidos',
          errors: errors.array()
        });
      }

      const { documentIds } = req.body;
      const userId = req.user?.id;
      
      const result = await scrapingService.downloadDocuments(documentIds, {
        userId
      });

      res.json({
        success: true,
        message: 'Descarga completada',
        data: {
          documentsDownloaded: result.successCount,
          documentsFailed: result.failureCount,
          results: result.results
        }
      });

    } catch (error) {
      logger.error('❌ Error en descarga:', error);
      next(error);
    }
  }
);

export default router;