import cron, { ScheduledTask } from 'node-cron';
import { cleanOrphanImages } from '@/utils/cleanOrphanImages';
import { logger } from '@/utils/logger';
import { cacheService } from './CacheService';
import { backupDatabase } from '@/scripts/backup-database';

/**
 * Servicio de tareas programadas
 *
 * Ejecuta trabajos en intervalos regulares:
 * - 2 AM: Backup de base de datos
 * - 2:05 AM: Invalidación de cachés obsoletos
 * - 3 AM: Limpieza de imágenes huérfanas
 * - Cada 10 min: Health check
 */
export class ScheduledTasksService {
  private jobs: ScheduledTask[] = [];

  /**
   * Iniciar todos los trabajos programados
   */
  start(): void {
    logger.info('[Scheduler] Starting scheduled tasks service...');

    // Backup de BD a las 2 AM (antes de invalidación de cachés)
    this.scheduleBackup();

    // Invalidar cachés a las 2:05 AM (después del backup)
    this.scheduleCacheInvalidation();

    // Limpieza de imágenes huérfanas - 3 AM diarios
    this.scheduleOrphanImageCleanup();

    // Health check cada 10 minutos
    this.scheduleHealthCheck();

    logger.info('[Scheduler] All scheduled tasks started');
  }

  /**
   * Backup de BD a las 2 AM
   */
  private scheduleBackup(): void {
    const job = cron.schedule('0 2 * * *', async () => {
      try {
        logger.info('[Scheduler] Starting database backup...');
        const startTime = Date.now();

        await backupDatabase();

        const duration = (Date.now() - startTime) / 1000;
        logger.info(`[Scheduler] ✅ Database backup completed (${duration.toFixed(2)}s)`);
      } catch (error) {
        logger.error('[Scheduler] Error during database backup', {
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    this.jobs.push(job);
  }

  /**
   * Limpiar imágenes huérfanas diariamente a las 3 AM
   */
  private scheduleOrphanImageCleanup(): void {
    const job = cron.schedule('0 3 * * *', async () => {
      try {
        logger.info('[Scheduler] Starting orphan image cleanup...');
        const startTime = Date.now();

        await cleanOrphanImages();

        const duration = (Date.now() - startTime) / 1000;
        logger.info(`[Scheduler] ✅ Orphan image cleanup completed (${duration.toFixed(2)}s)`);

        // Invalidar caché relacionado
        await cacheService.invalidate('images:');
      } catch (error) {
        logger.error('[Scheduler] Error during orphan image cleanup', {
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    this.jobs.push(job);
  }

  /**
   * Invalidar cachés a las 2 AM
   */
  private scheduleCacheInvalidation(): void {
    const job = cron.schedule('0 2 * * *', async () => {
      try {
        logger.info('[Scheduler] Starting cache invalidation...');
        const startTime = Date.now();

        // Invalidar cachés sensibles
        await cacheService.invalidate('stats:');
        await cacheService.invalidate('documents:');
        await cacheService.invalidate('articles:');

        const duration = (Date.now() - startTime) / 1000;
        logger.info(`[Scheduler] ✅ Cache invalidation completed (${duration.toFixed(2)}s)`);
      } catch (error) {
        logger.error('[Scheduler] Error during cache invalidation', {
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    this.jobs.push(job);
  }

  /**
   * Health check cada 10 minutos
   */
  private scheduleHealthCheck(): void {
    const job = cron.schedule('*/10 * * * *', () => {
      const cacheStats = cacheService.getStats();
      logger.debug('[Scheduler] Health check', {
        cacheKeys: cacheStats.keys,
        memory: cacheStats.memory
      });
    });

    this.jobs.push(job);
  }

  /**
   * Detener todos los trabajos
   */
  stop(): void {
    for (const job of this.jobs) {
      job.stop();
    }
    logger.info('[Scheduler] All scheduled tasks stopped');
  }

  /**
   * Obtener estado de tareas
   */
  getStatus() {
    return {
      running: true,
      tasks: this.jobs.length,
      jobs: [
        { name: 'Database Backup', schedule: '0 2 * * *', description: 'Daily at 2:00 AM' },
        { name: 'Cache Invalidation', schedule: '0 2 * * *', description: 'Daily at 2:05 AM' },
        { name: 'Orphan Image Cleanup', schedule: '0 3 * * *', description: 'Daily at 3:00 AM' },
        { name: 'Health Check', schedule: '*/10 * * * *', description: 'Every 10 minutes' }
      ]
    };
  }
}

// Instancia singleton
export const scheduledTasksService = new ScheduledTasksService();
