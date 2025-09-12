/**
 * Registro centralizado de fuentes de scraping
 * Sistema Editorial Jurídico Supervisado
 */

import { EventEmitter } from 'events';
import { logger } from '@/utils/logger';
import { BaseScrapingService } from './BaseScrapingService';
import { SourceMetadata, SourceHealth, ScrapingStats } from './types';

export class SourceRegistry extends EventEmitter {
  private sources: Map<string, BaseScrapingService> = new Map();
  private metadata: Map<string, SourceMetadata> = new Map();
  private stats: Map<string, ScrapingStats> = new Map();
  private healthCheckInterval?: NodeJS.Timeout;

  constructor() {
    super();
    this.startHealthMonitoring();
  }

  /**
   * Registrar una nueva fuente de scraping
   */
  register(scraper: BaseScrapingService): void {
    const sourceId = scraper.getMetadata().id;
    
    if (this.sources.has(sourceId)) {
      logger.warn(`⚠️ Fuente ${sourceId} ya está registrada, reemplazando...`);
      this.unregister(sourceId);
    }

    this.sources.set(sourceId, scraper);
    this.metadata.set(sourceId, scraper.getMetadata());
    
    // Inicializar estadísticas
    this.stats.set(sourceId, {
      sourceId,
      totalJobs: 0,
      successfulJobs: 0,
      failedJobs: 0,
      totalDocuments: 0,
      averageJobTime: 0,
      health: {
        sourceId,
        status: 'HEALTHY',
        lastCheck: new Date(),
        responseTime: 0,
        successRate: 100,
        errorRate: 0
      }
    });

    // Configurar listeners de eventos
    this.setupScraperListeners(scraper);

    logger.info(`✅ Fuente registrada: ${sourceId} - ${scraper.getMetadata().name}`);
    this.emit('source_registered', { sourceId, metadata: scraper.getMetadata() });
  }

  /**
   * Desregistrar una fuente
   */
  async unregister(sourceId: string): Promise<void> {
    const scraper = this.sources.get(sourceId);
    
    if (!scraper) {
      logger.warn(`⚠️ Intento de desregistrar fuente inexistente: ${sourceId}`);
      return;
    }

    try {
      await scraper.cleanup();
    } catch (error) {
      logger.error(`Error limpiando scraper ${sourceId}:`, error);
    }

    this.sources.delete(sourceId);
    this.metadata.delete(sourceId);
    this.stats.delete(sourceId);

    logger.info(`🗑️ Fuente desregistrada: ${sourceId}`);
    this.emit('source_unregistered', { sourceId });
  }

  /**
   * Obtener un scraper por ID
   */
  getScraper(sourceId: string): BaseScrapingService | undefined {
    return this.sources.get(sourceId);
  }

  /**
   * Obtener metadatos de una fuente
   */
  getSourceMetadata(sourceId: string): SourceMetadata | undefined {
    return this.metadata.get(sourceId);
  }

  /**
   * Obtener todas las fuentes registradas
   */
  getAllSources(): SourceMetadata[] {
    return Array.from(this.metadata.values());
  }

  /**
   * Obtener fuentes activas (funcionando correctamente)
   */
  getActiveSources(): SourceMetadata[] {
    return this.getAllSources().filter(source => {
      const stats = this.stats.get(source.id);
      return stats?.health.status === 'HEALTHY';
    });
  }

  /**
   * Obtener estadísticas de una fuente
   */
  getSourceStats(sourceId: string): ScrapingStats | undefined {
    return this.stats.get(sourceId);
  }

  /**
   * Obtener estadísticas de todas las fuentes
   */
  getAllStats(): ScrapingStats[] {
    return Array.from(this.stats.values());
  }

  /**
   * Verificar si una fuente existe y está disponible
   */
  isSourceAvailable(sourceId: string): boolean {
    const scraper = this.sources.get(sourceId);
    const stats = this.stats.get(sourceId);
    
    return !!(scraper && stats && stats.health.status !== 'DOWN');
  }

  /**
   * Obtener estado de salud consolidado
   */
  getSystemHealth(): {
    totalSources: number;
    healthySources: number;
    degradedSources: number;
    downSources: number;
    overallStatus: 'HEALTHY' | 'DEGRADED' | 'DOWN';
  } {
    const allStats = this.getAllStats();
    const totalSources = allStats.length;
    
    const healthySources = allStats.filter(s => s.health.status === 'HEALTHY').length;
    const degradedSources = allStats.filter(s => s.health.status === 'DEGRADED').length;
    const downSources = allStats.filter(s => s.health.status === 'DOWN').length;

    let overallStatus: 'HEALTHY' | 'DEGRADED' | 'DOWN' = 'HEALTHY';
    
    if (downSources > totalSources / 2) {
      overallStatus = 'DOWN';
    } else if (downSources > 0 || degradedSources > 0) {
      overallStatus = 'DEGRADED';
    }

    return {
      totalSources,
      healthySources,
      degradedSources,
      downSources,
      overallStatus
    };
  }

  /**
   * Configurar listeners para eventos del scraper
   */
  private setupScraperListeners(scraper: BaseScrapingService): void {
    const sourceId = scraper.getMetadata().id;

    scraper.on('progress', (progress) => {
      this.emit('scraping_progress', { sourceId, ...progress });
    });

    scraper.on('job_completed', (result) => {
      this.updateJobStats(sourceId, true, result.extractionTime, result.documents.length);
      this.emit('job_completed', { sourceId, ...result });
    });

    scraper.on('job_failed', (error) => {
      this.updateJobStats(sourceId, false, 0, 0);
      this.emit('job_failed', { sourceId, error });
    });
  }

  /**
   * Actualizar estadísticas de trabajos
   */
  private updateJobStats(sourceId: string, success: boolean, executionTime: number, documentsCount: number): void {
    const stats = this.stats.get(sourceId);
    if (!stats) return;

    stats.totalJobs++;
    
    if (success) {
      stats.successfulJobs++;
      stats.totalDocuments += documentsCount;
      
      // Calcular tiempo promedio (moving average)
      const totalTime = stats.averageJobTime * (stats.successfulJobs - 1) + executionTime;
      stats.averageJobTime = totalTime / stats.successfulJobs;
      
      stats.lastExtraction = new Date();
    } else {
      stats.failedJobs++;
    }

    // Actualizar métricas de salud
    stats.health.successRate = (stats.successfulJobs / stats.totalJobs) * 100;
    stats.health.errorRate = (stats.failedJobs / stats.totalJobs) * 100;

    this.stats.set(sourceId, stats);
  }

  /**
   * Iniciar monitoreo automático de salud
   */
  private startHealthMonitoring(): void {
    this.healthCheckInterval = setInterval(async () => {
      for (const [sourceId, scraper] of this.sources.entries()) {
        try {
          const health = await scraper.checkHealth();
          const stats = this.stats.get(sourceId);
          
          if (stats) {
            stats.health = health;
            this.stats.set(sourceId, stats);
          }

          this.emit('health_check', { sourceId, health });
          
        } catch (error) {
          logger.error(`Error en health check para ${sourceId}:`, error);
        }
      }
    }, 300000); // Cada 5 minutos

    logger.info('🏥 Monitoreo de salud iniciado (cada 5 minutos)');
  }

  /**
   * Detener monitoreo y limpiar recursos
   */
  async cleanup(): Promise<void> {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    // Limpiar todos los scrapers
    for (const [sourceId] of this.sources.entries()) {
      await this.unregister(sourceId);
    }

    this.removeAllListeners();
    logger.info('🧹 SourceRegistry limpiado');
  }

  /**
   * Buscar fuentes por capacidades
   */
  findSourcesByCapabilities(capabilities: Partial<SourceMetadata['capabilities']>): SourceMetadata[] {
    return this.getAllSources().filter(source => {
      return Object.entries(capabilities).every(([key, value]) => {
        return source.capabilities[key as keyof typeof source.capabilities] === value;
      });
    });
  }

  /**
   * Buscar fuentes por área legal
   */
  findSourcesByLegalArea(legalArea: string): SourceMetadata[] {
    return this.getAllSources().filter(source => {
      return source.supportedLegalAreas.includes(legalArea);
    });
  }

  /**
   * Obtener estadísticas consolidadas del sistema
   */
  getSystemStats(): {
    totalSources: number;
    totalJobs: number;
    totalDocuments: number;
    averageSuccessRate: number;
    activeSources: number;
  } {
    const allStats = this.getAllStats();
    
    return {
      totalSources: allStats.length,
      totalJobs: allStats.reduce((sum, s) => sum + s.totalJobs, 0),
      totalDocuments: allStats.reduce((sum, s) => sum + s.totalDocuments, 0),
      averageSuccessRate: allStats.length > 0 
        ? allStats.reduce((sum, s) => sum + s.health.successRate, 0) / allStats.length 
        : 0,
      activeSources: allStats.filter(s => s.health.status === 'HEALTHY').length
    };
  }
}