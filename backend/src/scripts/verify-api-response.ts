/**
 * Script para verificar que la API devuelve webOfficialDate correctamente
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

async function verifyAPIResponse() {
  try {
    logger.info('🔍 Verificando respuesta que recibiría la API');

    // Simular lo que hace el endpoint de documentos
    const documents = await prisma.document.findMany({
      where: {
        status: 'PENDING'
      },
      select: {
        id: true,
        title: true,
        publicationDate: true,
        webOfficialDate: true,  // ✅ Nuevo campo
        extractedAt: true,
        createdAt: true,
        source: true,
        legalArea: true,
        documentType: true,
        externalId: true,
        summary: true,
        url: true,
        numeroSentencia: true,
        magistradoPonente: true,
        salaRevision: true,
        expediente: true,
        temaPrincipal: true,
        resumenIA: true,
        decision: true,
        aiAnalysisStatus: true,
        aiAnalysisDate: true,
        aiModel: true
      },
      take: 3,
      orderBy: {
        createdAt: 'desc'
      }
    });

    logger.info(`📄 Encontrados ${documents.length} documentos PENDING para la API`);

    documents.forEach((doc, index) => {
      logger.info(`\n📄 Documento ${index + 1}: ${doc.title}`);
      logger.info(`   ID: ${doc.id}`);
      logger.info(`   Publication Date: ${doc.publicationDate.toISOString()}`);
      logger.info(`   ✅ Web Official Date: ${doc.webOfficialDate ? doc.webOfficialDate.toISOString() : 'NULL'}`);
      logger.info(`   Extracted At: ${doc.extractedAt ? doc.extractedAt.toISOString() : 'NULL'}`);
      logger.info(`   Created At: ${doc.createdAt.toISOString()}`);

      // Simular el formato que recibiría el frontend
      const frontendFormat = {
        id: doc.id,
        title: doc.title,
        publicationDate: doc.publicationDate.toISOString(),
        webOfficialDate: doc.webOfficialDate ? doc.webOfficialDate.toISOString() : null,
        extractedAt: doc.extractedAt ? doc.extractedAt.toISOString() : doc.createdAt.toISOString(),
        // otros campos...
      };

      logger.info(`   Frontend Format:`, JSON.stringify(frontendFormat, null, 2));
    });

    // Verificar cuántos documentos tienen webOfficialDate
    const withWebDate = documents.filter(doc => doc.webOfficialDate !== null).length;
    const withoutWebDate = documents.filter(doc => doc.webOfficialDate === null).length;

    logger.info(`\n📊 Resumen:`);
    logger.info(`   Documentos con webOfficialDate: ${withWebDate}`);
    logger.info(`   Documentos sin webOfficialDate: ${withoutWebDate}`);

    if (withWebDate === 0) {
      logger.warn('⚠️ NINGÚN documento tiene webOfficialDate - necesitamos hacer una nueva extracción');
      return { needsNewExtraction: true, documents };
    } else {
      logger.info('✅ Algunos documentos tienen webOfficialDate - el frontend debería mostrarlos');
      return { needsNewExtraction: false, documents };
    }

  } catch (error) {
    logger.error('❌ Error verificando respuesta API:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  logger.info('🚀 Verificando formato de respuesta API para webOfficialDate');

  try {
    const result = await verifyAPIResponse();

    if (result.needsNewExtraction) {
      logger.info('\n🔄 Recomendación: Ejecutar nueva extracción para obtener documentos con webOfficialDate');
    } else {
      logger.info('\n✅ Los documentos están listos para mostrar en el frontend');
    }

  } catch (error) {
    logger.error('❌ Error en verificación:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}