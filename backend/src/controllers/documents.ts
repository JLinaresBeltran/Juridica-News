import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { logger } from '@/utils/logger';
import { validateRequest } from '@/middleware/validation';
import { DocumentFilters, DocumentCurationAction, BatchCurationRequest } from '../../../shared/types/document.types';

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


export default router;