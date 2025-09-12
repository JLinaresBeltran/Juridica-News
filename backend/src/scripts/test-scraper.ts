#!/usr/bin/env tsx

/**
 * Script de prueba directa del CorteConstitucionalScraper
 * Para debuggear el problema de "no se encuentran documentos"
 */

import { CorteConstitucionalScraper } from '@/scrapers/corte-constitucional/CorteConstitucionalScraper';
import { logger } from '@/utils/logger';

async function testScraper() {
  logger.info('🧪 Iniciando prueba directa del CorteConstitucionalScraper...');

  const scraper = new CorteConstitucionalScraper();

  try {
    // Parámetros de prueba
    const parameters = {
      limit: 5,
      downloadDocuments: false
    };

    logger.info('📋 Parámetros de extracción:', parameters);

    // Ejecutar extracción
    const result = await scraper.extractDocuments(parameters);

    logger.info('✅ Resultado de extracción:');
    logger.info(`   - Éxito: ${result.success}`);
    logger.info(`   - Documentos encontrados: ${result.documents.length}`);
    logger.info(`   - Tiempo de extracción: ${result.extractionTime}s`);

    if (result.documents.length > 0) {
      logger.info('📄 Primeros documentos encontrados:');
      result.documents.slice(0, 3).forEach((doc, index) => {
        logger.info(`   ${index + 1}. ${doc.documentId}: ${doc.title}`);
        logger.info(`      URL: ${doc.url}`);
      });
    } else {
      logger.warn('❌ No se encontraron documentos');
      if (result.errors) {
        logger.error('🔥 Errores:', result.errors);
      }
    }

    logger.info('📊 Metadata:', JSON.stringify(result.metadata, null, 2));

  } catch (error) {
    logger.error('❌ Error en la prueba:', error);
  } finally {
    // Cleanup
    await scraper.cleanup();
    logger.info('🔒 Cleanup completado');
  }
}

// Ejecutar la prueba
testScraper().catch(console.error);