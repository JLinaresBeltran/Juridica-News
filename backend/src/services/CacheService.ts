import NodeCache from 'node-cache';
import { logger } from '@/utils/logger';

/**
 * Servicio de caché con soporte in-memory
 * TTL por defecto: 5 minutos (300 segundos)
 *
 * Mejoras esperadas:
 * - Stats queries: 1-2s → 10-50ms (95-98% mejora)
 * - Reutilización de datos: >80% cache hit rate
 */
export class CacheService {
  private cache = new NodeCache({
    stdTTL: 300,      // Standard TTL: 5 minutos
    checkperiod: 60,  // Verificar expiración cada minuto
    useClones: false  // No clonar objetos (más rápido)
  });

  constructor() {
    // Estadísticas del caché
    this.cache.on('set', (key) => {
      logger.debug(`[Cache] Set: ${key}`);
    });

    this.cache.on('del', (key) => {
      logger.debug(`[Cache] Deleted: ${key}`);
    });

    this.cache.on('expired', (key) => {
      logger.debug(`[Cache] Expired: ${key}`);
    });
  }

  /**
   * Obtener valor del caché
   */
  async get<T>(key: string): Promise<T | null> {
    const value = this.cache.get<T>(key);
    if (value) {
      logger.debug(`[Cache] HIT: ${key}`);
    } else {
      logger.debug(`[Cache] MISS: ${key}`);
    }
    return value || null;
  }

  /**
   * Guardar valor en caché con TTL opciones
   */
  async set(key: string, value: any, ttlSeconds: number = 300): Promise<void> {
    this.cache.set(key, value, ttlSeconds);
    logger.info(`[Cache] Cached key: ${key} (TTL: ${ttlSeconds}s)`);
  }

  /**
   * Obtener o calcular (patrón común)
   */
  async getOrSet<T>(
    key: string,
    fn: () => Promise<T>,
    ttlSeconds: number = 300
  ): Promise<T> {
    // Intentar obtener del caché
    const cached = await this.get<T>(key);
    if (cached) {
      return cached;
    }

    // Calcular valor
    const value = await fn();

    // Guardar en caché
    await this.set(key, value, ttlSeconds);

    return value;
  }

  /**
   * Invalidar todas las claves que coincidan con un patrón
   */
  async invalidate(pattern: string): Promise<number> {
    const keys = this.cache.keys() as string[];
    let invalidated = 0;

    for (const key of keys) {
      if (key.includes(pattern)) {
        this.cache.del(key);
        invalidated++;
      }
    }

    logger.info(`[Cache] Invalidated ${invalidated} keys matching: ${pattern}`);
    return invalidated;
  }

  /**
   * Invalidar clave específica
   */
  async invalidateKey(key: string): Promise<void> {
    this.cache.del(key);
    logger.info(`[Cache] Invalidated key: ${key}`);
  }

  /**
   * Limpiar todo el caché
   */
  async flush(): Promise<void> {
    this.cache.flushAll();
    logger.info(`[Cache] Flushed all cache`);
  }

  /**
   * Obtener estadísticas del caché
   */
  getStats() {
    const keys = this.cache.keys();
    return {
      keys: keys.length,
      memory: this.cache.getStats()
    };
  }

  /**
   * Patrón para cachear estadísticas de documentos
   */
  async getCachedDocumentStats(forceRefresh = false) {
    const cacheKey = 'documents:stats';

    if (forceRefresh) {
      await this.invalidateKey(cacheKey);
    }

    // Retornar null para que el controller haga la query
    // El controller debe guardar el resultado
    const cached = await this.get(cacheKey);
    return cached || null;
  }

  /**
   * Patrón para cachear estadísticas de artículos
   */
  async getCachedArticleStats(forceRefresh = false) {
    const cacheKey = 'articles:stats';

    if (forceRefresh) {
      await this.invalidateKey(cacheKey);
    }

    const cached = await this.get(cacheKey);
    return cached || null;
  }
}

// Instancia singleton
export const cacheService = new CacheService();
