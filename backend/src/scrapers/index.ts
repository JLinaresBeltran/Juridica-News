/**
 * Índice central de scrapers
 * Sistema Editorial Jurídico Supervisado
 */

// Exports de tipos y clases base
export * from './base/types';
export { BaseScrapingService } from './base/BaseScrapingService';
export { SourceRegistry } from './base/SourceRegistry';

// Exports de scrapers específicos
export { CorteConstitucionalScraper } from './corte-constitucional/CorteConstitucionalScraper';
export { ConsejoEstadoScraper } from './consejo-estado/ConsejoEstadoScraper';

// Función para obtener todos los scrapers disponibles
import { CorteConstitucionalScraper } from './corte-constitucional/CorteConstitucionalScraper';
import { ConsejoEstadoScraper } from './consejo-estado/ConsejoEstadoScraper';
import { BaseScrapingService } from './base/BaseScrapingService';

/**
 * Factory para crear instancias de scrapers
 */
export class ScrapersFactory {
  private static scrapers: Map<string, () => BaseScrapingService> = new Map([
    ['corte-constitucional', () => new CorteConstitucionalScraper()],
    ['consejo-estado', () => new ConsejoEstadoScraper()]
  ]);

  /**
   * Crear una instancia del scraper especificado
   */
  static createScraper(sourceId: string): BaseScrapingService | null {
    const scraperFactory = this.scrapers.get(sourceId);
    return scraperFactory ? scraperFactory() : null;
  }

  /**
   * Obtener lista de scrapers disponibles
   */
  static getAvailableScrapers(): string[] {
    return Array.from(this.scrapers.keys());
  }

  /**
   * Registrar un nuevo scraper
   */
  static registerScraper(sourceId: string, factory: () => BaseScrapingService): void {
    this.scrapers.set(sourceId, factory);
  }

  /**
   * Verificar si un scraper está disponible
   */
  static isScraperAvailable(sourceId: string): boolean {
    return this.scrapers.has(sourceId);
  }

  /**
   * Crear todas las instancias de scrapers disponibles
   */
  static createAllScrapers(): BaseScrapingService[] {
    const scrapers: BaseScrapingService[] = [];
    
    for (const [sourceId, factory] of this.scrapers.entries()) {
      try {
        const scraper = factory();
        scrapers.push(scraper);
      } catch (error) {
        console.error(`Error creando scraper ${sourceId}:`, error);
      }
    }
    
    return scrapers;
  }
}