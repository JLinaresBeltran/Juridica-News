/**
 * Script para extraer fechas web oficiales REALES desde metadatos existentes
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

// Función de parseo (copiada del ScrapingOrchestrator)
function parseWebOfficialDate(fechaString: string): Date | null {
  try {
    if (!fechaString || fechaString.trim() === '') {
      return null;
    }

    const fecha = fechaString.trim();

    // Formato ISO YYYY-MM-DD (más común en las tablas web)
    const isoMatch = fecha.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoMatch && isoMatch[1] && isoMatch[2] && isoMatch[3]) {
      const [, year, month, day] = isoMatch;
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }

    // Formato DD/MM/YYYY
    const ddmmyyyyMatch = fecha.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (ddmmyyyyMatch && ddmmyyyyMatch[1] && ddmmyyyyMatch[2] && ddmmyyyyMatch[3]) {
      const [, day, month, year] = ddmmyyyyMatch;
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }

    // Formato DD-MM-YYYY
    const ddmmyyyyDashMatch = fecha.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
    if (ddmmyyyyDashMatch && ddmmyyyyDashMatch[1] && ddmmyyyyDashMatch[2] && ddmmyyyyDashMatch[3]) {
      const [, day, month, year] = ddmmyyyyDashMatch;
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }

    logger.warn(`⚠️ No se pudo parsear fecha web oficial: "${fecha}"`);
    return null;

  } catch (error) {
    logger.error(`❌ Error parseando fecha web oficial "${fechaString}":`, error);
    return null;
  }
}

async function extractRealWebDatesFromMetadata() {
  try {
    logger.info('🔍 Buscando documentos con metadatos structuredData.fechaPublicacion');

    // Buscar todos los documentos con metadata
    const documentsWithMetadata = await prisma.document.findMany({
      select: {
        id: true,
        title: true,
        metadata: true,
        publicationDate: true,
        webOfficialDate: true
      }
    });

    logger.info(`📄 Encontrados ${documentsWithMetadata.length} documentos con metadatos para procesar`);

    if (documentsWithMetadata.length === 0) {
      logger.info('ℹ️ No hay documentos sin webOfficialDate que tengan metadatos');
      return [];
    }

    const updatedDocuments = [];

    for (const doc of documentsWithMetadata) {
      try {
        // Solo procesar documentos que no tienen webOfficialDate
        if (doc.webOfficialDate) {
          logger.debug(`   📄 ${doc.title}: Ya tiene webOfficialDate, omitiendo`);
          continue;
        }

        // Solo procesar documentos que tienen metadata
        if (!doc.metadata) {
          logger.debug(`   📄 ${doc.title}: Sin metadata, omitiendo`);
          continue;
        }

        // Parsear metadata JSON
        const metadata = typeof doc.metadata === 'string'
          ? JSON.parse(doc.metadata)
          : doc.metadata;

        // Buscar structuredData.fechaPublicacion
        const fechaPublicacion = metadata?.structuredData?.fechaPublicacion;

        if (fechaPublicacion) {
          logger.info(`📄 Documento: ${doc.title}`);
          logger.info(`   Fecha en metadatos: "${fechaPublicacion}"`);

          // Parsear la fecha
          const webOfficialDate = parseWebOfficialDate(fechaPublicacion);

          if (webOfficialDate) {
            // Actualizar el documento con la fecha web oficial real
            const updatedDoc = await prisma.document.update({
              where: { id: doc.id },
              data: {
                webOfficialDate: webOfficialDate
              }
            });

            logger.info(`   ✅ Actualizado: webOfficialDate = ${webOfficialDate.toISOString().split('T')[0]}`);
            updatedDocuments.push({
              id: updatedDoc.id,
              title: updatedDoc.title,
              originalDate: fechaPublicacion,
              webOfficialDate: webOfficialDate.toISOString().split('T')[0]
            });
          } else {
            logger.warn(`   ⚠️ No se pudo parsear fecha: "${fechaPublicacion}"`);
          }
        } else {
          logger.debug(`   📄 ${doc.title}: Sin fechaPublicacion en metadatos`);
        }

      } catch (error) {
        logger.error(`❌ Error procesando documento ${doc.id}:`, error);
      }
    }

    logger.info(`\n📊 Resumen:`);
    logger.info(`   Documentos procesados: ${documentsWithMetadata.length}`);
    logger.info(`   Documentos actualizados: ${updatedDocuments.length}`);

    if (updatedDocuments.length > 0) {
      logger.info(`\n✅ Documentos actualizados con fechas web oficiales REALES:`);
      updatedDocuments.forEach((doc, index) => {
        logger.info(`   ${index + 1}. ${doc.title}`);
        logger.info(`      Original: "${doc.originalDate}" -> Web oficial: ${doc.webOfficialDate}`);
      });
    }

    return updatedDocuments;

  } catch (error) {
    logger.error('❌ Error extrayendo fechas web oficiales:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  logger.info('🚀 Extrayendo fechas web oficiales REALES desde metadatos');

  try {
    const updatedDocs = await extractRealWebDatesFromMetadata();

    if (updatedDocs.length > 0) {
      logger.info('\n🎉 ¡Fechas web oficiales extraídas exitosamente!');
      logger.info('🌐 Ahora puedes verificar en el frontend: http://localhost:5174/');
      logger.info('📄 Los documentos mostrarán las fechas web oficiales reales en formato YYYY-MM-DD');
    } else {
      logger.warn('⚠️ No se encontraron fechas web oficiales para extraer');
      logger.info('💡 Sugerencia: Ejecutar una nueva extracción para obtener documentos con metadatos completos');
    }

  } catch (error) {
    logger.error('❌ Error en extracción de fechas reales:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}