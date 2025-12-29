import { createHash } from 'crypto';
import { readFile, access } from 'fs/promises';
import { PrismaClient } from '@prisma/client';
import { logger } from '@/utils/logger';

const prisma = new PrismaClient();

interface IntegrityReport {
  documentId: string;
  title: string;
  integrityStatus: string;
  issues: string[];
  checksums: {
    file?: string;
    content?: string;
    fullText?: string;
  };
  verifiedAt: Date;
}

/**
 * Calcular checksum SHA-256 de un buffer
 */
function calculateChecksum(data: string | Buffer): string {
  const hash = createHash('sha256');
  if (typeof data === 'string') {
    hash.update(data, 'utf-8');
  } else {
    hash.update(data);
  }
  return hash.digest('hex');
}

/**
 * Verificar integridad de un documento individual
 */
async function verifyDocumentIntegrity(documentId: string): Promise<IntegrityReport> {
  try {
    const doc = await prisma.document.findUnique({
      where: { id: documentId },
      select: {
        id: true,
        title: true,
        documentPath: true,
        content: true,
        fullTextContent: true,
        documentChecksum: true,
        contentChecksum: true,
        fullTextChecksum: true,
      }
    });

    if (!doc) {
      return {
        documentId,
        title: 'UNKNOWN',
        integrityStatus: 'NOT_FOUND',
        issues: ['Document not found in database'],
        checksums: {},
        verifiedAt: new Date(),
      };
    }

    const issues: string[] = [];
    const checksums: any = {};

    // 1️⃣ Verificar archivo original
    if (doc.documentPath) {
      try {
        const fileBuffer = await readFile(doc.documentPath);
        const currentChecksum = calculateChecksum(fileBuffer);
        checksums.file = currentChecksum;

        if (doc.documentChecksum && currentChecksum !== doc.documentChecksum) {
          issues.push(`CORRUPTED: Archivo modificado (esperado: ${doc.documentChecksum.slice(0, 8)}..., actual: ${currentChecksum.slice(0, 8)}...)`);
        } else if (!doc.documentChecksum) {
          logger.info(`[Integrity] Generando checksum inicial para documento ${documentId}`);
          // Guardar checksum inicial
          await prisma.document.update({
            where: { id: documentId },
            data: { documentChecksum: currentChecksum }
          });
        }
      } catch (error) {
        issues.push(`MISSING_FILE: Archivo no encontrado en ${doc.documentPath}`);
      }
    }

    // 2️⃣ Verificar content checksum
    if (doc.content) {
      const currentChecksum = calculateChecksum(doc.content);
      checksums.content = currentChecksum;

      if (doc.contentChecksum && currentChecksum !== doc.contentChecksum) {
        issues.push(`CORRUPTED: Campo content modificado (esperado: ${doc.contentChecksum.slice(0, 8)}..., actual: ${currentChecksum.slice(0, 8)}...)`);
      } else if (!doc.contentChecksum) {
        await prisma.document.update({
          where: { id: documentId },
          data: { contentChecksum: currentChecksum }
        });
      }
    }

    // 3️⃣ Verificar fullTextContent checksum
    if (doc.fullTextContent) {
      const currentChecksum = calculateChecksum(doc.fullTextContent);
      checksums.fullText = currentChecksum;

      if (doc.fullTextChecksum && currentChecksum !== doc.fullTextChecksum) {
        issues.push(`CORRUPTED: Campo fullTextContent modificado (esperado: ${doc.fullTextChecksum.slice(0, 8)}..., actual: ${currentChecksum.slice(0, 8)}...)`);
      } else if (!doc.fullTextChecksum) {
        await prisma.document.update({
          where: { id: documentId },
          data: { fullTextChecksum: currentChecksum }
        });
      }
    }

    // 4️⃣ Determinar status final
    const status = issues.length > 0 ? 'CORRUPTED' : 'VERIFIED';

    // 5️⃣ Actualizar documento
    await prisma.document.update({
      where: { id: documentId },
      data: {
        integrityStatus: status,
        checksumVerifiedAt: new Date(),
      }
    });

    return {
      documentId,
      title: doc.title,
      integrityStatus: status,
      issues,
      checksums,
      verifiedAt: new Date(),
    };

  } catch (error) {
    logger.error(`[Integrity] Error verifying document ${documentId}`, { error });
    return {
      documentId,
      title: 'ERROR',
      integrityStatus: 'ERROR',
      issues: [error instanceof Error ? error.message : 'Unknown error'],
      checksums: {},
      verifiedAt: new Date(),
    };
  }
}

/**
 * Verificar integridad de todos los documentos
 */
async function verifyAllDocuments(limit?: number): Promise<{ report: IntegrityReport[]; summary: any }> {
  try {
    logger.info('[Integrity] Starting full document integrity verification...');
    const startTime = Date.now();

    // Obtener documentos
    const documents = await prisma.document.findMany({
      select: { id: true },
      ...(limit ? { take: limit } : {}),
    });

    logger.info(`[Integrity] Verifying ${documents.length} documents...`);

    // Verificar cada uno
    const report: IntegrityReport[] = [];
    for (const doc of documents) {
      const result = await verifyDocumentIntegrity(doc.id);
      report.push(result);

      // Log cada resultado
      if (result.integrityStatus === 'VERIFIED') {
        logger.info(`[Integrity] ✅ ${result.title}`);
      } else if (result.integrityStatus === 'CORRUPTED') {
        logger.warn(`[Integrity] ⚠️ CORRUPTED: ${result.title}`);
      } else {
        logger.error(`[Integrity] ❌ ${result.integrityStatus}: ${result.title}`);
      }
    }

    // Calcular resumen
    const duration = (Date.now() - startTime) / 1000;
    const summary = {
      total: report.length,
      verified: report.filter(r => r.integrityStatus === 'VERIFIED').length,
      corrupted: report.filter(r => r.integrityStatus === 'CORRUPTED').length,
      missing: report.filter(r => r.integrityStatus === 'MISSING_FILE').length,
      errors: report.filter(r => r.integrityStatus === 'ERROR').length,
      durationSeconds: duration.toFixed(2),
    };

    logger.info('[Integrity] Verification complete', summary);

    return { report, summary };

  } catch (error) {
    logger.error('[Integrity] Error during full verification', { error });
    throw error;
  }
}

// Ejecutar si es script directo
if (require.main === module) {
  const args = process.argv.slice(2);
  const limit = args[0] ? parseInt(args[0]) : undefined;

  (async () => {
    try {
      const { report, summary } = await verifyAllDocuments(limit);

      console.log('\n📊 INTEGRITY VERIFICATION REPORT');
      console.log('================================');
      console.log(`Total:     ${summary.total}`);
      console.log(`Verified:  ${summary.verified} ✅`);
      console.log(`Corrupted: ${summary.corrupted} ⚠️`);
      console.log(`Missing:   ${summary.missing} ❌`);
      console.log(`Errors:    ${summary.errors} 🔥`);
      console.log(`Duration:  ${summary.durationSeconds}s`);

      // Mostrar detalles de corrupciones
      const corrupted = report.filter(r => r.integrityStatus === 'CORRUPTED');
      if (corrupted.length > 0) {
        console.log('\n⚠️  CORRUPTED DOCUMENTS:');
        for (const doc of corrupted) {
          console.log(`\n  📄 ${doc.title} (${doc.documentId})`);
          for (const issue of doc.issues) {
            console.log(`     - ${issue}`);
          }
        }
      }

      process.exit(summary.errors > 0 || summary.corrupted > 0 ? 1 : 0);
    } catch (error) {
      logger.error('[Integrity] Fatal error', { error });
      process.exit(1);
    } finally {
      await prisma.$disconnect();
    }
  })();
}

export { verifyDocumentIntegrity, verifyAllDocuments };
