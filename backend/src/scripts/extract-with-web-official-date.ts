/**
 * Script para hacer extracción directa con webOfficialDate
 */

import { ScrapingOrchestrator } from '../services/ScrapingOrchestrator';
import { CorteConstitucionalScraper } from '../scrapers/corte-constitucional/CorteConstitucionalScraper';
import { logger } from '../utils/logger';

async function extractWithWebOfficialDate() {
  try {
    logger.info('🚀 Iniciando extracción con webOfficialDate');

    // Inicializar orquestador y scraper
    const orchestrator = new ScrapingOrchestrator();
    const scraper = new CorteConstitucionalScraper();

    // Registrar el scraper
    orchestrator.registerScraper(scraper);

    // Ejecutar extracción con límite pequeño para prueba
    const result = await orchestrator.extractDocuments(
      'corte-constitucional',
      {
        limit: 2,
        downloadDocuments: true
      },
      'test-user'
    );

    if (result.result?.success) {
      logger.info('✅ Extracción exitosa');
      logger.info(`📄 Documentos extraídos: ${result.result.documents.length}`);

      // Verificar que los documentos tengan webOfficialDate
      result.result.documents.forEach((doc, index) => {
        logger.info(`\n📄 Documento ${index + 1}:`);
        logger.info(`   ID: ${doc.id}`);
        logger.info(`   Título: ${doc.title}`);
        logger.info(`   Web Official Date: ${(doc as any).webOfficialDate || 'NULL'}`);
        logger.info(`   Publication Date: ${doc.publicationDate}`);
        logger.info(`   Extraction Date: ${doc.extractionDate}`);
      });

      return result.result.documents;
    } else {
      logger.error('❌ Extracción falló:', result.result?.errors);
      return [];
    }

  } catch (error) {
    logger.error('❌ Error en extracción:', error);
    throw error;
  }
}

async function main() {
  logger.info('🔍 Ejecutando extracción de prueba con webOfficialDate');

  try {
    const documents = await extractWithWebOfficialDate();

    if (documents.length > 0) {
      logger.info('\n✅ Extracción completada - documentos disponibles para verificar en frontend');
      logger.info('🌐 Frontend: http://localhost:5174/');
      logger.info('📄 Navega a la página de curación para ver los nuevos documentos');
    } else {
      logger.warn('⚠️ No se extrajeron documentos nuevos');
    }

  } catch (error) {
    logger.error('❌ Error en script de extracción:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}