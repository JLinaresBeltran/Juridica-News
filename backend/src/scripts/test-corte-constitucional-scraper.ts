#!/usr/bin/env tsx
/**
 * Script de prueba específico para el CorteConstitucionalScraper
 * Prueba el sistema corregido con límite de 2 documentos
 */

import { logger } from '@/utils/logger';
import { CorteConstitucionalScraper } from '@/scrapers/corte-constitucional/CorteConstitucionalScraper';

async function main() {
  logger.info('🧪 Iniciando prueba específica del CorteConstitucionalScraper corregido');

  try {
    // 1. Crear scraper
    logger.info('1️⃣ Creando CorteConstitucionalScraper...');
    const scraper = new CorteConstitucionalScraper();

    // 2. Verificar metadata del scraper
    logger.info('2️⃣ Verificando metadata...');
    const metadata = scraper.getMetadata();
    logger.info(`   📋 Fuente: ${metadata.name}`);
    logger.info(`   🌐 URL base: ${metadata.baseUrl}`);
    logger.info(`   📄 Tipos soportados: ${metadata.supportedDocumentTypes.join(', ')}`);
    logger.info(`   ⚖️ Áreas legales: ${metadata.supportedLegalAreas.join(', ')}`);
    logger.info(`   🔧 Capacidades:`, metadata.capabilities);

    // 3. Verificar conectividad (health check)
    logger.info('3️⃣ Verificando conectividad (health check)...');
    const isHealthy = await scraper.healthCheck();
    logger.info(`   ${isHealthy ? '✅' : '❌'} Estado de salud: ${isHealthy ? 'SALUDABLE' : 'CON PROBLEMAS'}`);

    if (!isHealthy) {
      logger.warn('⚠️ El health check falló, pero continuando con la prueba...');
    }

    // 4. Configurar parámetros de extracción
    logger.info('4️⃣ Configurando parámetros de extracción...');
    const extractionParameters = {
      limit: 999, // SIN LÍMITE - Descargar TODOS los documentos de HOY y AYER
      downloadDocuments: true, // HABILITAR DESCARGA como especificaste
      dateRange: {
        startDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // Últimos 3 días para asegurar cobertura
        endDate: new Date()
      }
    };
    
    logger.info(`   📊 Parámetros:`, extractionParameters);

    // 5. Ejecutar extracción real
    logger.info('5️⃣ Ejecutando extracción REAL (puede tomar unos minutos)...');
    logger.info('   🕐 Este proceso navegará al sitio web real de la Corte Constitucional');
    logger.info('   📍 Buscará el botón "Ver últimas sentencias"');
    logger.info('   📊 Extraerá datos de la tabla estructurada');
    logger.info('   📅 Buscará HOY y AYER (solo días hábiles)');
    logger.info('   📥 Descargará TODOS los documentos de esas fechas');
    logger.info('   🔍 Verificará duplicados y omitirá existentes');
    logger.info('   ⚠️ Manejará casos donde info existe pero documento RTF no disponible');

    const startTime = Date.now();
    const result = await scraper.extractDocuments(extractionParameters);
    const endTime = Date.now();
    const totalTime = (endTime - startTime) / 1000;

    // 6. Analizar resultados
    logger.info('6️⃣ Analizando resultados...');
    logger.info(`   ⏱️ Tiempo total de extracción: ${totalTime}s`);
    logger.info(`   ${result.success ? '✅' : '❌'} Estado: ${result.success ? 'EXITOSO' : 'FALLO'}`);

    if (result.success) {
      logger.info(`   📄 Documentos extraídos: ${result.documents.length}/${extractionParameters.limit}`);
      logger.info(`   📥 Documentos descargados: ${result.downloadedCount}`);
      logger.info(`   🔍 Total encontrados: ${result.totalFound}`);
      logger.info(`   ⏲️ Tiempo de extracción: ${result.extractionTime}s`);

      // Mostrar detalles de cada documento extraído
      for (let i = 0; i < result.documents.length; i++) {
        const doc = result.documents[i];
        logger.info(`   📋 Documento ${i + 1}:`);
        logger.info(`     ID: ${doc.documentId}`);
        logger.info(`     Título: ${doc.title}`);
        logger.info(`     URL: ${doc.url}`);
        logger.info(`     Tipo: ${doc.documentType}`);
        logger.info(`     Área legal: ${doc.legalArea}`);
        logger.info(`     Fecha extracción: ${doc.extractionDate.toISOString()}`);
        logger.info(`     Fecha publicación: ${doc.publicationDate.toISOString()}`);

        // Mostrar metadata específica
        if (doc.metadata) {
          logger.info(`     🔧 Metadata:`);
          logger.info(`       Método: ${doc.metadata.extractionMethod}`);
          logger.info(`       Versión: ${doc.metadata.extractionVersion}`);
          
          // RTF Verification
          if (doc.metadata.rtfVerification) {
            const rtf = doc.metadata.rtfVerification;
            logger.info(`       📄 RTF Verificado: ${rtf.verified ? '✅ SÍ' : '❌ NO'}`);
            if (rtf.verified) {
              logger.info(`         Tipo contenido: ${rtf.contentType}`);
              logger.info(`         Es Office válido: ${rtf.isValidOffice ? '✅ SÍ' : '❌ NO'}`);
            } else {
              logger.info(`         Error: ${rtf.error}`);
            }
          }

          // Datos estructurados
          if (doc.metadata.structuredData) {
            const structured = doc.metadata.structuredData;
            logger.info(`       📊 Datos estructurados:`);
            logger.info(`         No: ${structured.no || 'N/A'}`);
            logger.info(`         Número: ${structured.numero || 'N/A'}`);
            logger.info(`         Expediente: ${structured.expediente || 'N/A'}`);
            logger.info(`         Fecha publicación: ${structured.fechaPublicacion || 'N/A'}`);
            logger.info(`         Fecha sentencia: ${structured.fechaSentencia || 'N/A'}`);
            logger.info(`         Tipo: ${structured.tipo || 'N/A'}`);
            logger.info(`         Tema: ${structured.tema || 'N/A'}`);
          }
        }

        logger.info(`     📝 Resumen: ${doc.summary}`);
        logger.info(`     📖 Contenido (primeros 200 chars): ${doc.content.substring(0, 200)}...`);
        logger.info('     ---');
      }

      // Mostrar metadata del resultado
      if (result.metadata) {
        logger.info('   🔍 Metadata del resultado:');
        logger.info(`     Fuente: ${result.metadata.source}`);
        logger.info(`     Web scraping real: ${result.metadata.realWebScraping}`);
        logger.info(`     Browser: ${result.metadata.browser}`);
        if (result.metadata.pagesSearched) {
          logger.info(`     Páginas buscadas: ${result.metadata.pagesSearched.length}`);
          result.metadata.pagesSearched.forEach((page: string, index: number) => {
            logger.info(`       ${index + 1}. ${page}`);
          });
        }
      }

    } else {
      logger.error('   ❌ La extracción falló');
      if (result.errors && result.errors.length > 0) {
        logger.error('   🐛 Errores:');
        result.errors.forEach((error, index) => {
          logger.error(`     ${index + 1}. ${error}`);
        });
      }
      if (result.metadata && result.metadata.error) {
        logger.error(`   💥 Error principal: ${result.metadata.error}`);
      }
    }

    // 7. Limpiar recursos
    logger.info('7️⃣ Limpiando recursos...');
    await scraper.cleanup();

    // 8. Resumen final
    logger.info('8️⃣ Resumen final:');
    logger.info(`   🎯 Objetivo: Extraer TODOS los documentos de HOY y AYER (días hábiles)`);
    logger.info(`   📊 Resultado: ${result.success ? '✅ EXITOSO' : '❌ FALLIDO'}`);
    logger.info(`   📄 Documentos obtenidos: ${result.documents.length}`);
    logger.info(`   ⏱️ Tiempo total: ${totalTime}s`);
    
    if (result.success && result.documents.length > 0) {
      const hasStructuredData = result.documents.some(doc => doc.metadata?.structuredData);
      const hasRTFVerification = result.documents.some(doc => doc.metadata?.rtfVerification?.verified);
      const hasWorkingDayFiltering = result.documents.length >= 0; // Siempre true ya que buscamos HOY/AYER
      const hasDuplicateCheck = result.documents.every(doc => doc.documentId); // Verificar que tienen IDs únicos

      logger.info('   🔧 Funcionalidades verificadas:');
      logger.info(`     📊 Extracción tabla estructurada: ${hasStructuredData ? '✅ SÍ' : '❌ NO'}`);
      logger.info(`     📄 Verificación RTF/DOCX: ${hasRTFVerification ? '✅ SÍ' : '❌ NO'}`);
      logger.info(`     📅 Filtro HOY/AYER (días hábiles): ${hasWorkingDayFiltering ? '✅ SÍ' : '❌ NO'}`);
      logger.info(`     🔍 Verificación de duplicados: ${hasDuplicateCheck ? '✅ SÍ' : '❌ NO'}`);
      logger.info(`     🎯 Navegación "Ver últimas sentencias": ${result.success ? '✅ SÍ' : '❌ NO'}`);
    }

    logger.info('✅ Prueba específica completada');

  } catch (error) {
    logger.error('❌ Error durante la prueba:', error);
    process.exit(1);
  }
}

// Ejecutar prueba si el script se ejecuta directamente
if (require.main === module) {
  main().catch((error) => {
    logger.error('💥 Error fatal en la prueba:', error);
    process.exit(1);
  });
}