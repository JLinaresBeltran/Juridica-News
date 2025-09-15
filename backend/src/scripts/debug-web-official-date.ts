/**
 * Debug para verificar qué está pasando con webOfficialDate
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

async function debugWebOfficialDate() {
  try {
    logger.info('🔍 Debugging webOfficialDate - verificando documentos recientes');

    // Buscar documentos de las últimas 2 horas
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

    const recentDocuments = await prisma.document.findMany({
      where: {
        createdAt: {
          gte: twoHoursAgo
        }
      },
      select: {
        id: true,
        title: true,
        createdAt: true,
        webOfficialDate: true,
        publicationDate: true,
        extractionDate: true,
        metadata: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    logger.info(`📄 Encontrados ${recentDocuments.length} documentos recientes (últimas 2 horas)`);

    if (recentDocuments.length === 0) {
      logger.warn('⚠️ No hay documentos recientes para debuggear');
      return;
    }

    recentDocuments.forEach((doc, index) => {
      logger.info(`\n🔍 === DOCUMENTO ${index + 1}: ${doc.title} ===`);
      logger.info(`ID: ${doc.id}`);
      logger.info(`Creado: ${doc.createdAt.toISOString()}`);
      logger.info(`Publication Date: ${doc.publicationDate.toISOString()}`);
      logger.info(`Extraction Date: ${doc.extractionDate ? doc.extractionDate.toISOString() : 'NULL'}`);

      logger.info(`🎯 Web Official Date: ${doc.webOfficialDate ? doc.webOfficialDate.toISOString().split('T')[0] : '❌ NULL'}`);

      // Analizar metadata
      if (doc.metadata) {
        try {
          const metadata = typeof doc.metadata === 'string' ? JSON.parse(doc.metadata) : doc.metadata;

          logger.info(`\n📋 METADATA ANALYSIS:`);
          logger.info(`   Has extractedMetadata: ${metadata.extractedMetadata ? '✅' : '❌'}`);
          logger.info(`   Has structuredData: ${metadata.structuredData ? '✅' : '❌'}`);

          if (metadata.structuredData) {
            const structured = metadata.structuredData;
            logger.info(`\n📊 STRUCTURED DATA:`);
            logger.info(`   fechaPublicacion: "${structured.fechaPublicacion || 'N/A'}"`);
            logger.info(`   numero: "${structured.numero || 'N/A'}"`);
            logger.info(`   expediente: "${structured.expediente || 'N/A'}"`);
            logger.info(`   tipo: "${structured.tipo || 'N/A'}"`);
            logger.info(`   tema: "${structured.tema || 'N/A'}"`);

            // ESTO ES LO CLAVE: verificar si fechaPublicacion está presente
            if (structured.fechaPublicacion) {
              logger.info(`\n✅ TIENE fechaPublicacion: "${structured.fechaPublicacion}"`);
              logger.info(`   Debería aparecer como webOfficialDate en la interfaz`);
            } else {
              logger.error(`\n❌ NO TIENE fechaPublicacion en structuredData`);
              logger.error(`   Por eso webOfficialDate es NULL`);
            }
          } else {
            logger.error(`\n❌ NO TIENE structuredData - documento extraído con fallback`);
            logger.error(`   Esto significa que no se encontró la tabla estructurada`);
            logger.error(`   El scraper usó el método de enlaces fallback (líneas 758-776)`);
          }

          // Verificar extractedMetadata
          if (metadata.extractedMetadata) {
            logger.info(`\n📝 EXTRACTED METADATA:`);
            const extracted = metadata.extractedMetadata;
            Object.keys(extracted).forEach(key => {
              logger.info(`   ${key}: "${extracted[key] || 'N/A'}"`);
            });
          }

        } catch (error) {
          logger.error(`❌ Error parseando metadata:`, error);
        }
      } else {
        logger.warn(`⚠️ No metadata disponible`);
      }

      logger.info(`\n--- FIN DOCUMENTO ${index + 1} ---\n`);
    });

    // Resumen
    const withWebDate = recentDocuments.filter(doc => doc.webOfficialDate).length;
    const withoutWebDate = recentDocuments.filter(doc => !doc.webOfficialDate).length;

    logger.info(`\n📊 RESUMEN FINAL:`);
    logger.info(`   ✅ Documentos CON webOfficialDate: ${withWebDate}`);
    logger.info(`   ❌ Documentos SIN webOfficialDate: ${withoutWebDate}`);

    if (withoutWebDate > 0) {
      logger.error(`\n🚨 PROBLEMA IDENTIFICADO:`);
      logger.error(`   ${withoutWebDate} documentos no tienen webOfficialDate`);
      logger.error(`   Esto indica que:`);
      logger.error(`   1. No se encontró la tabla estructurada en la página`);
      logger.error(`   2. Se usó el método fallback que no incluye structuredData`);
      logger.error(`   3. Por tanto, no hay fechaPublicacion para procesar`);
      logger.info(`\n💡 SOLUCIÓN:`);
      logger.info(`   Necesitas ajustar el scraper para:`);
      logger.info(`   - Asegurar que encuentra la tabla estructurada`);
      logger.info(`   - O incluir fechaPublicacion en el método fallback`);
    }

  } catch (error) {
    logger.error('❌ Error en debug:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  logger.info('🚀 Debug webOfficialDate - Estado actual tras extracción');

  try {
    await debugWebOfficialDate();
  } catch (error) {
    logger.error('❌ Error en debug:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}