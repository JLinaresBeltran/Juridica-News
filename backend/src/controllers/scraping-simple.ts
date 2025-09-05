/**
 * Controlador simplificado para el servicio de scraping
 */

import express, { Request, Response, NextFunction } from 'express';
import { body, query, validationResult } from 'express-validator';
import { requireRole } from '@/middleware/auth';
import { logger } from '@/utils/logger';
import { spawn } from 'child_process';
import path from 'path';

// Extend Request interface to include user
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string;
    email: string;
  };
}

const router = express.Router();

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
 *                 enum: [corte_constitucional]
 *               limit:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 20
 *     responses:
 *       200:
 *         description: Documentos extraídos exitosamente
 */
router.post('/extract',
  requireRole(['ADMIN', 'EDITOR']),
  [
    body('source')
      .isIn(['corte_constitucional'])
      .withMessage('Fuente inválida'),
    body('limit')
      .optional()
      .isInt({ min: 1, max: 20 })
      .withMessage('Límite debe ser entre 1 y 20')
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

      const { source, limit = 5 } = req.body;
      const userId = req.user?.id;
      
      logger.info(`🔍 Iniciando extracción de ${source} (límite: ${limit})`, {
        userId,
        source,
        limit
      });

      // Ejecutar script Python directamente
      const result = await executeScrapingScript(source, limit);

      if (result.success) {
        res.json({
          success: true,
          message: `Extracción completada de ${source}`,
          data: {
            documentsFound: result.documents.length,
            extractionTime: result.extractionTime,
            documents: result.documents.map((doc: any) => ({
              id: doc.document_id,
              title: doc.title,
              type: doc.document_type,
              source: doc.source,
              url: doc.pdf_url,
              date: doc.extraction_date
            }))
          }
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Error en la extracción',
          error: result.error
        });
      }

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
 */
router.get('/sources',
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const sources = [
        {
          id: 'corte_constitucional',
          name: 'Corte Constitucional',
          description: 'Sentencias de la Corte Constitucional de Colombia',
          status: 'available'
        }
      ];
      
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
 * Ejecutar script de scraping Python
 */
async function executeScrapingScript(source: string, limit: number): Promise<any> {
  return new Promise((resolve, reject) => {
    const pythonInterpreter = path.join(__dirname, '..', '..', 'services', 'scraping', 'venv', 'bin', 'python');
    const scriptPath = path.join(__dirname, '..', '..', 'services', 'scraping', 'run_extractor.py');
    
    const args = [
      scriptPath,
      '--source', source,
      '--limit', limit.toString()
    ];

    const pythonProcess = spawn(pythonInterpreter, args, {
      cwd: path.join(__dirname, '..', '..', 'services', 'scraping'),
      env: { ...process.env, PYTHONUNBUFFERED: '1' }
    });

    let stdout = '';
    let stderr = '';

    pythonProcess.stdout.on('data', (data) => {
      const output = data.toString();
      logger.info('🐍 Python: ' + output.trim());
      stdout += output;
    });

    pythonProcess.stderr.on('data', (data) => {
      const output = data.toString();
      logger.error('🐍 Python Error: ' + output.trim());
      stderr += output;
    });

    pythonProcess.on('close', (code) => {
      if (code === 0) {
        try {
          const lines = stdout.split('\n');
          
          // Buscar el inicio del JSON
          const startIndex = lines.findIndex(line => line.trim().startsWith('{'));
          
          if (startIndex === -1) {
            resolve({
              success: false,
              error: 'No se encontró inicio de JSON en la salida del script'
            });
            return;
          }
          
          // Reconstruir JSON (puede estar en múltiples líneas)
          let jsonString = '';
          let braceCount = 0;
          
          for (let i = startIndex; i < lines.length; i++) {
            const line = lines[i].trim();
            jsonString += line;
            
            // Contar llaves
            for (const char of line) {
              if (char === '{') braceCount++;
              if (char === '}') braceCount--;
            }
            
            // Si llegamos a 0, el JSON está completo
            if (braceCount === 0 && jsonString.trim().endsWith('}')) {
              break;
            }
          }
          
          logger.info('📝 JSON reconstruido:', jsonString.substring(0, 100) + '...');
          
          const result = JSON.parse(jsonString);
          resolve({
            success: true,
            documents: result.documents || [],
            extractionTime: result.extractionTime || 0
          });
        } catch (error) {
          resolve({
            success: false,
            error: `Error parseando resultados: ${(error as Error).message}`
          });
        }
      } else {
        resolve({
          success: false,
          error: `Script falló con código: ${code} - ${stderr}`
        });
      }
    });

    pythonProcess.on('error', (error) => {
      resolve({
        success: false,
        error: `Error ejecutando Python: ${error.message}`
      });
    });
  });
}

export default router;