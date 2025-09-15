/**
 * Script de prueba para verificar el nuevo campo webOfficialDate
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

async function testWebOfficialDateFeature() {
  try {
    logger.info('🔍 Iniciando prueba del campo webOfficialDate');

    // Verificar que el campo existe en el schema
    logger.info('📋 Verificando schema de base de datos...');

    // Buscar documentos existentes
    const existingDocs = await prisma.document.findMany({
      select: {
        id: true,
        title: true,
        publicationDate: true,
        webOfficialDate: true,
        extractionDate: true,
        source: true
      },
      take: 5
    });

    logger.info(`📄 Encontrados ${existingDocs.length} documentos en la base de datos`);

    if (existingDocs.length === 0) {
      logger.warn('⚠️ No hay documentos en la base de datos para probar');

      // Crear un documento de prueba
      logger.info('🧪 Creando documento de prueba...');

      const testDocument = await prisma.document.create({
        data: {
          title: 'T-001/25 - Documento de prueba webOfficialDate',
          content: 'Contenido de prueba para verificar el campo webOfficialDate',
          source: 'corte-constitucional',
          url: 'https://test.url/documento-prueba',
          legalArea: 'CONSTITUTIONAL',
          documentType: 'SENTENCE',
          publicationDate: new Date(),
          webOfficialDate: new Date('2025-09-12'), // Fecha específica de prueba
          externalId: 'test-web-official-date-001'
        }
      });

      logger.info('✅ Documento de prueba creado:', {
        id: testDocument.id,
        title: testDocument.title,
        webOfficialDate: testDocument.webOfficialDate,
        publicationDate: testDocument.publicationDate
      });

      return testDocument;
    } else {
      logger.info('📊 Documentos existentes:');
      existingDocs.forEach((doc, index) => {
        logger.info(`   ${index + 1}. ${doc.title}`);
        logger.info(`      Web oficial: ${doc.webOfficialDate ? doc.webOfficialDate.toISOString().split('T')[0] : 'N/A'}`);
        logger.info(`      Publicación: ${doc.publicationDate.toISOString().split('T')[0]}`);
        logger.info(`      Extracción: ${doc.extractionDate.toISOString()}`);
        logger.info(`      ---`);
      });

      return existingDocs[0];
    }

  } catch (error) {
    logger.error('❌ Error en prueba de webOfficialDate:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Función para simular el parseWebOfficialDate
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

    logger.warn(`⚠️ No se pudo parsear fecha web oficial: "${fecha}"`);
    return null;

  } catch (error) {
    logger.error(`❌ Error parseando fecha web oficial "${fechaString}":`, error);
    return null;
  }
}

async function testDateParsing() {
  logger.info('🔍 Probando función parseWebOfficialDate');

  const testDates = [
    '2025-09-12',
    '2025-01-15',
    '12/09/2025',
    '15/01/2025',
    'invalid-date',
    '',
    null
  ];

  testDates.forEach((testDate, index) => {
    if (testDate === null) {
      logger.info(`   ${index + 1}. null -> null`);
      return;
    }

    const parsed = parseWebOfficialDate(testDate);
    logger.info(`   ${index + 1}. "${testDate}" -> ${parsed ? parsed.toISOString().split('T')[0] : 'null'}`);
  });
}

// Ejecutar las pruebas
async function main() {
  logger.info('🚀 Iniciando pruebas del sistema webOfficialDate');

  try {
    await testDateParsing();
    logger.info('');

    await testWebOfficialDateFeature();

    logger.info('✅ Todas las pruebas completadas exitosamente');

  } catch (error) {
    logger.error('❌ Error en las pruebas:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}