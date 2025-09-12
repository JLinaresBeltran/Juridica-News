/**
 * Controlador de scraping v2 - Nueva arquitectura modular
 * Sistema Editorial Jurídico Supervisado
 */

import express, { Request, Response, NextFunction } from 'express';
import { body, query, param, validationResult } from 'express-validator';
import { requireRole } from '@/middleware/auth';
import { ScrapingOrchestrator } from '@/services/ScrapingOrchestrator';
import { ScrapersFactory } from '@/scrapers';
import { logger } from '@/utils/logger';

// Interfaz para requests autenticados
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string;
    email: string;
  };
}

const router = express.Router();

// Instancia global del orquestador
let orchestrator: ScrapingOrchestrator;

// Inicializar orquestador y registrar scrapers
const initializeOrchestrator = () => {
  if (!orchestrator) {
    orchestrator = new ScrapingOrchestrator();
    
    // Registrar todos los scrapers disponibles
    const scrapers = ScrapersFactory.createAllScrapers();
    for (const scraper of scrapers) {
      orchestrator.registerScraper(scraper);
    }
    
    logger.info(`🎭 Orquestador inicializado con ${scrapers.length} scrapers`);
  }
  return orchestrator;
};

/**
 * @swagger
 * /api/scraping/v2/sources:
 *   get:
 *     tags: [Scraping V2]
 *     summary: Obtener todas las fuentes de scraping disponibles
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de fuentes disponibles con metadatos completos
 */
router.get('/sources',
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const orchestrator = initializeOrchestrator();
      const sources = orchestrator.getAvailableSources();
      
      res.json({
        success: true,
        data: {
          sources,
          total: sources.length,
          active: orchestrator.getActiveSources().length
        }
      });

    } catch (error) {
      logger.error('❌ Error obteniendo fuentes:', error);
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/scraping/v2/sources/{sourceId}:
 *   get:
 *     tags: [Scraping V2]
 *     summary: Obtener información detallada de una fuente específica
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sourceId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Información de la fuente
 *       404:
 *         description: Fuente no encontrada
 */
router.get('/sources/:sourceId',
  [
    param('sourceId').isString().notEmpty().withMessage('sourceId es requerido')
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

      const { sourceId } = req.params;
      const orchestrator = initializeOrchestrator();
      
      if (!orchestrator.isSourceAvailable(sourceId)) {
        return res.status(404).json({
          success: false,
          message: `Fuente no encontrada: ${sourceId}`
        });
      }

      const sources = orchestrator.getAvailableSources();
      const source = sources.find(s => s.id === sourceId);
      const systemStats = await orchestrator.getSystemStats();
      const stats = systemStats.sources.find(s => s.sourceId === sourceId);

      res.json({
        success: true,
        data: {
          source,
          stats,
          isActive: orchestrator.isSourceAvailable(sourceId)
        }
      });

    } catch (error) {
      logger.error(`❌ Error obteniendo fuente ${req.params.sourceId}:`, error);
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/scraping/v2/extract:
 *   post:
 *     tags: [Scraping V2]
 *     summary: Extraer documentos de una fuente específica
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sourceId
 *             properties:
 *               sourceId:
 *                 type: string
 *                 description: ID de la fuente de extracción
 *               limit:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 50
 *                 default: 10
 *               downloadDocuments:
 *                 type: boolean
 *                 default: false
 *               dateRange:
 *                 type: object
 *                 properties:
 *                   from:
 *                     type: string
 *                     format: date
 *                   to:
 *                     type: string
 *                     format: date
 *               documentTypes:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       202:
 *         description: Trabajo de extracción iniciado
 *       400:
 *         description: Parámetros inválidos
 *       404:
 *         description: Fuente no disponible
 */
router.post('/extract',
  requireRole(['ADMIN', 'EDITOR']),
  [
    body('sourceId')
      .isString()
      .notEmpty()
      .withMessage('sourceId es requerido'),
    body('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('limit debe ser entre 1 y 50'),
    body('downloadDocuments')
      .optional()
      .isBoolean()
      .withMessage('downloadDocuments debe ser booleano'),
    body('dateRange.from')
      .optional()
      .isISO8601()
      .withMessage('dateRange.from debe ser una fecha válida'),
    body('dateRange.to')
      .optional()
      .isISO8601()
      .withMessage('dateRange.to debe ser una fecha válida'),
    body('documentTypes')
      .optional()
      .isArray()
      .withMessage('documentTypes debe ser un array')
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

      const { 
        sourceId, 
        limit = 10, 
        downloadDocuments = false, 
        dateRange, 
        documentTypes,
        customParams 
      } = req.body;
      
      const userId = req.user?.id;
      const orchestrator = initializeOrchestrator();

      // Verificar que la fuente esté disponible
      if (!orchestrator.isSourceAvailable(sourceId)) {
        return res.status(404).json({
          success: false,
          message: `Fuente no disponible: ${sourceId}`
        });
      }

      logger.info(`🔍 Iniciando extracción v2 - Fuente: ${sourceId}, Usuario: ${userId}`, {
        sourceId,
        limit,
        downloadDocuments,
        dateRange,
        documentTypes
      });

      // Preparar parámetros de extracción
      const extractionParams = {
        limit,
        downloadDocuments,
        dateRange: dateRange ? {
          from: new Date(dateRange.from),  // ✅ Usando interfaz oficial ExtractionParameters
          to: new Date(dateRange.to)       // ✅ Usando interfaz oficial ExtractionParameters
        } : undefined,
        documentTypes,
        customParams
      };

      // 🔍 DEBUG: Log completo de parámetros recibidos del dashboard
      logger.info('🛠️ DEBUG - Parámetros recibidos del dashboard:', {
        sourceId,
        limit,
        downloadDocuments,
        dateRange: dateRange ? {
          originalFrom: dateRange.from,
          originalTo: dateRange.to,
          parsedFrom: extractionParams.dateRange?.from,
          parsedTo: extractionParams.dateRange?.to
        } : 'No dateRange provided',
        documentTypes,
        customParams,
        userId
      });

      // Iniciar extracción
      const result = await orchestrator.extractDocuments(sourceId, extractionParams, userId);

      // Si hay resultado inmediato, devolverlo
      if (result.result) {
        res.json({
          success: true,
          message: `Extracción completada para ${sourceId}`,
          data: {
            jobId: result.jobId,
            documents: result.result.documents.map(doc => ({
              documentId: doc.documentId,
              title: doc.title,
              source: doc.source,
              url: doc.url,
              documentType: doc.documentType,
              legalArea: doc.legalArea,
              publicationDate: doc.publicationDate,
              extractionDate: doc.extractionDate
            })),
            totalFound: result.result.totalFound,
            extractionTime: result.result.extractionTime,
            downloadedCount: result.result.downloadedCount
          }
        });
      } else {
        // Trabajo agregado a la cola
        res.status(202).json({
          success: true,
          message: `Trabajo de extracción agregado a la cola para ${sourceId}`,
          data: {
            jobId: result.jobId,
            status: 'QUEUED',
            message: 'El trabajo será procesado en breve'
          }
        });
      }

    } catch (error) {
      logger.error('❌ Error en extracción v2:', error);
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/scraping/v2/jobs/{jobId}:
 *   get:
 *     tags: [Scraping V2]
 *     summary: Obtener estado de un trabajo de extracción
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
router.get('/jobs/:jobId',
  [
    param('jobId').isString().notEmpty().withMessage('jobId es requerido')
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

      const { jobId } = req.params;
      const orchestrator = initializeOrchestrator();
      
      const job = await orchestrator.getJobStatus(jobId);
      
      if (!job) {
        return res.status(404).json({
          success: false,
          message: 'Trabajo no encontrado'
        });
      }

      res.json({
        success: true,
        data: job
      });

    } catch (error) {
      logger.error(`❌ Error obteniendo estado del trabajo ${req.params.jobId}:`, error);
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/scraping/v2/jobs/{jobId}/cancel:
 *   post:
 *     tags: [Scraping V2]
 *     summary: Cancelar un trabajo de extracción
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
 *         description: Trabajo cancelado exitosamente
 *       404:
 *         description: Trabajo no encontrado o no cancelable
 */
router.post('/jobs/:jobId/cancel',
  requireRole(['ADMIN', 'EDITOR']),
  [
    param('jobId').isString().notEmpty().withMessage('jobId es requerido')
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

      const { jobId } = req.params;
      const orchestrator = initializeOrchestrator();
      
      const cancelled = await orchestrator.cancelJob(jobId);
      
      if (!cancelled) {
        return res.status(404).json({
          success: false,
          message: 'Trabajo no encontrado o no se puede cancelar'
        });
      }

      res.json({
        success: true,
        message: 'Trabajo cancelado exitosamente',
        data: { jobId, status: 'CANCELLED' }
      });

    } catch (error) {
      logger.error(`❌ Error cancelando trabajo ${req.params.jobId}:`, error);
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/scraping/v2/stats:
 *   get:
 *     tags: [Scraping V2]
 *     summary: Obtener estadísticas del sistema de scraping
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estadísticas del sistema
 */
router.get('/stats',
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const orchestrator = initializeOrchestrator();
      const stats = await orchestrator.getSystemStats();

      res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      logger.error('❌ Error obteniendo estadísticas:', error);
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/scraping/v2/health:
 *   get:
 *     tags: [Scraping V2]
 *     summary: Verificar estado de salud de todas las fuentes
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estado de salud del sistema
 */
router.get('/health',
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const orchestrator = initializeOrchestrator();
      const stats = await orchestrator.getSystemStats();

      res.json({
        success: true,
        data: {
          systemHealth: stats.systemHealth,
          sources: stats.sources.map(s => ({
            sourceId: s.sourceId,
            health: s.health,
            lastExtraction: s.lastExtraction
          }))
        }
      });

    } catch (error) {
      logger.error('❌ Error verificando salud del sistema:', error);
      next(error);
    }
  }
);

export default router;