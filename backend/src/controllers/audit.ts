import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireRole } from '@/middleware/auth';

const router = Router();
const prisma = new PrismaClient();

/**
 * @swagger
 * /api/audit/activity:
 *   get:
 *     summary: Get audit logs
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 */
router.get('/activity', requireRole(['ADMIN', 'EDITOR_SENIOR']), async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 50, userId, actionType, resourceType } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    
    const where: any = {};
    if (userId) where.userId = userId;
    if (actionType) where.actionType = actionType;
    if (resourceType) where.resourceType = resourceType;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { timestamp: 'desc' },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            }
          }
        }
      }),
      prisma.auditLog.count({ where })
    ]);

    res.json({
      data: logs,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      }
    });

  } catch (error) {
    res.status(500).json({
      error: 'Failed to retrieve audit logs',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;