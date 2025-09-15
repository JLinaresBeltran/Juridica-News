/**
 * Script para actualizar un documento existente con webOfficialDate
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

async function updateExistingDocumentWithWebOfficialDate() {
  try {
    logger.info('🔍 Actualizando documento existente con webOfficialDate');

    // Buscar el primer documento sin webOfficialDate
    const documentToUpdate = await prisma.document.findFirst({
      where: {
        webOfficialDate: null
      },
      select: {
        id: true,
        title: true,
        publicationDate: true,
        extractionDate: true,
        webOfficialDate: true,
        metadata: true
      }
    });

    if (!documentToUpdate) {
      logger.info('ℹ️ No hay documentos sin webOfficialDate para actualizar');
      return;
    }

    logger.info(`📄 Actualizando documento: ${documentToUpdate.title}`);

    // Simular fecha web oficial (2025-09-12 para esta prueba)
    const webOfficialDate = new Date('2025-09-12');

    // Actualizar el documento con la nueva fecha
    const updatedDocument = await prisma.document.update({
      where: { id: documentToUpdate.id },
      data: {
        webOfficialDate: webOfficialDate
      }
    });

    logger.info('✅ Documento actualizado exitosamente:', {
      id: updatedDocument.id,
      title: updatedDocument.title,
      webOfficialDate: updatedDocument.webOfficialDate?.toISOString().split('T')[0],
      publicationDate: updatedDocument.publicationDate.toISOString().split('T')[0]
    });

    // Verificar la actualización
    const verifiedDocument = await prisma.document.findUnique({
      where: { id: documentToUpdate.id },
      select: {
        id: true,
        title: true,
        publicationDate: true,
        webOfficialDate: true,
        extractionDate: true
      }
    });

    if (verifiedDocument?.webOfficialDate) {
      logger.info('🎉 Verificación exitosa - el campo webOfficialDate está funcionando correctamente');

      logger.info('📊 Comparación de fechas:');
      logger.info(`   Web oficial: ${verifiedDocument.webOfficialDate.toISOString().split('T')[0]} (formato YYYY-MM-DD)`);
      logger.info(`   Publicación: ${verifiedDocument.publicationDate.toISOString().split('T')[0]}`);
      logger.info(`   Extracción:  ${verifiedDocument.extractionDate.toISOString().split('T')[0]}`);

    } else {
      logger.error('❌ Error - el campo webOfficialDate no se actualizó correctamente');
    }

    return verifiedDocument;

  } catch (error) {
    logger.error('❌ Error actualizando documento:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  logger.info('🚀 Iniciando actualización de documento con webOfficialDate');

  try {
    await updateExistingDocumentWithWebOfficialDate();
    logger.info('✅ Actualización completada exitosamente');

  } catch (error) {
    logger.error('❌ Error en la actualización:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}