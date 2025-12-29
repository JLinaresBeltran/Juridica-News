#!/usr/bin/env tsx
/**
 * Script de prueba para la nueva arquitectura de scraping
 * Sistema Editorial Jurídico Supervisado
 *
 * REFACTORIZACIÓN BLACK BOX:
 * - Usa InMemoryDocumentStorage e InMemoryFileStorage para tests
 * - No requiere base de datos real
 */

import { logger } from '@/utils/logger';
import { ScrapingOrchestrator } from '@/services/ScrapingOrchestrator';
import { ScrapersFactory } from '@/scrapers';
import { InMemoryDocumentStorage } from '@/adapters/storage/InMemoryDocumentStorage';
import { InMemoryFileStorage } from '@/adapters/storage/InMemoryFileStorage';
import { InMemoryContentProcessor } from '@/adapters/content/InMemoryContentProcessor';
import { RegexMetadataExtractor } from '@/adapters/metadata/RegexMetadataExtractor';

async function main() {
  logger.info('🧪 Iniciando pruebas de la arquitectura de scraping');

  try {
    // 1. Crear orquestador con adapters en memoria
    logger.info('1️⃣ Creando orquestador con BLACK BOX adapters...');
    const documentStorage = new InMemoryDocumentStorage();
    const fileStorage = new InMemoryFileStorage();
    const contentProcessor = new InMemoryContentProcessor();
    const metadataExtractor = new RegexMetadataExtractor();
    const orchestrator = new ScrapingOrchestrator(
      documentStorage,
      fileStorage,
      contentProcessor,
      metadataExtractor
    );
    logger.info('   📦 4 Adapters en memoria inicializados (sin BD real)');

    // 2. Registrar scrapers
    logger.info('2️⃣ Registrando scrapers...');
    const scrapers = ScrapersFactory.createAllScrapers();
    
    for (const scraper of scrapers) {
      orchestrator.registerScraper(scraper);
      logger.info(`   ✅ Registrado: ${scraper.getMetadata().name}`);
    }

    // 3. Verificar fuentes disponibles
    logger.info('3️⃣ Verificando fuentes disponibles...');
    const sources = orchestrator.getAvailableSources();
    
    logger.info(`   📋 Total de fuentes: ${sources.length}`);
    for (const source of sources) {
      logger.info(`   - ${source.id}: ${source.name}`);
      logger.info(`     Capacidades: ${JSON.stringify(source.capabilities)}`);
      logger.info(`     Tipos doc: ${source.supportedDocumentTypes.join(', ')}`);
      logger.info(`     Áreas legales: ${source.supportedLegalAreas.join(', ')}`);
    }

    // 4. Verificar fuentes activas
    logger.info('4️⃣ Verificando fuentes activas...');
    const activeSources = orchestrator.getActiveSources();
    logger.info(`   🟢 Fuentes activas: ${activeSources.length}/${sources.length}`);

    // 5. Probar health checks
    logger.info('5️⃣ Probando health checks...');
    for (const source of sources) {
      try {
        const isAvailable = orchestrator.isSourceAvailable(source.id);
        logger.info(`   ${isAvailable ? '✅' : '❌'} ${source.name}: ${isAvailable ? 'Disponible' : 'No disponible'}`);
      } catch (error) {
        logger.error(`   ❌ Error verificando ${source.name}:`, error);
      }
    }

    // 6. Obtener estadísticas del sistema
    logger.info('6️⃣ Obteniendo estadísticas del sistema...');
    const stats = await orchestrator.getSystemStats();
    
    logger.info('   📊 Estadísticas:');
    logger.info(`     - Fuentes totales: ${stats.sources.length}`);
    logger.info(`     - Trabajos activos: ${stats.activeJobs}`);
    logger.info(`     - Trabajos en cola: ${stats.queuedJobs}`);
    logger.info(`     - Estado del sistema: ${stats.systemHealth.overallStatus}`);
    logger.info(`     - Fuentes saludables: ${stats.systemHealth.healthySources}/${stats.systemHealth.totalSources}`);

    // 7. Probar extracción mock (solo Consejo de Estado que tiene implementación mock)
    if (orchestrator.isSourceAvailable('consejo_estado')) {
      logger.info('7️⃣ Probando extracción mock...');
      
      try {
        const result = await orchestrator.extractDocuments('consejo_estado', {
          limit: 3,
          downloadDocuments: false
        });

        if (result.result) {
          logger.info(`   ✅ Extracción exitosa:`);
          logger.info(`     - Documentos extraídos: ${result.result.documents.length}`);
          logger.info(`     - Tiempo de extracción: ${result.result.extractionTime}s`);
          logger.info(`     - Total encontrados: ${result.result.totalFound}`);
          
          // Mostrar primer documento como ejemplo
          if (result.result.documents.length > 0) {
            const doc = result.result.documents[0];
            logger.info(`     - Ejemplo documento:`);
            logger.info(`       ID: ${doc.documentId}`);
            logger.info(`       Título: ${doc.title}`);
            logger.info(`       Fuente: ${doc.source}`);
            logger.info(`       Tipo: ${doc.documentType}`);
            logger.info(`       Área legal: ${doc.legalArea}`);
          }
        } else {
          logger.info(`   ⏳ Trabajo agregado a la cola: ${result.jobId}`);
        }

      } catch (error) {
        logger.error('   ❌ Error en extracción mock:', error);
      }
    }

    // 8. Limpiar recursos
    logger.info('8️⃣ Limpiando recursos...');
    await orchestrator.cleanup();

    logger.info('✅ Todas las pruebas completadas exitosamente');

  } catch (error) {
    logger.error('❌ Error durante las pruebas:', error);
    process.exit(1);
  }
}

// Ejecutar pruebas si el script se ejecuta directamente
if (require.main === module) {
  main().catch((error) => {
    logger.error('💥 Error fatal en las pruebas:', error);
    process.exit(1);
  });
}