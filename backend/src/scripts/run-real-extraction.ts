/**
 * Script para ejecutar una extracción real usando el scraper Python
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { logger } from '../utils/logger';
import { PrismaClient } from '@prisma/client';

const execAsync = promisify(exec);
const prisma = new PrismaClient();

async function runRealExtraction() {
  try {
    logger.info('🚀 Ejecutando extracción REAL con scraper Python');

    // Crear directorio de Python si no existe
    const pythonDir = '/Users/jhonathan/Desktop/Juridica-News/backend/services/scraping';
    const extractorScript = `${pythonDir}/corte_constitucional_extractor.py`;

    logger.info(`📁 Directorio Python: ${pythonDir}`);
    logger.info(`🐍 Script extractor: ${extractorScript}`);

    // Comando para ejecutar el extractor Python directamente
    const pythonCommand = `cd ${pythonDir} && python3 corte_constitucional_extractor.py --limit 2 --max-date-range 30`;

    logger.info(`💻 Ejecutando comando: ${pythonCommand}`);
    logger.info('⏳ Esto puede tomar 1-2 minutos...');

    const startTime = Date.now();

    try {
      const { stdout, stderr } = await execAsync(pythonCommand, {
        timeout: 120000, // 2 minutos timeout
        maxBuffer: 1024 * 1024 * 10 // 10MB buffer
      });

      const endTime = Date.now();
      const duration = Math.round((endTime - startTime) / 1000);

      if (stderr) {
        logger.warn('⚠️ Stderr output:', stderr);
      }

      logger.info('✅ Extracción completada');
      logger.info(`⏱️ Duración: ${duration} segundos`);

      if (stdout) {
        logger.info('📄 Output del extractor:');
        // Mostrar las últimas líneas del output
        const lines = stdout.split('\n').filter(line => line.trim());
        const lastLines = lines.slice(-20); // Últimas 20 líneas
        lastLines.forEach(line => logger.info(`   ${line}`));
      }

      return true;
    } catch (execError: any) {
      if (execError.killed && execError.signal === 'SIGTERM') {
        logger.error('❌ Extracción cancelada por timeout (2 minutos)');
      } else {
        logger.error('❌ Error ejecutando extractor Python:', execError.message);
        if (execError.stdout) logger.info('Stdout:', execError.stdout);
        if (execError.stderr) logger.error('Stderr:', execError.stderr);
      }
      return false;
    }

  } catch (error) {
    logger.error('❌ Error en extracción:', error);
    return false;
  }
}

async function verifyNewDocuments() {
  try {
    logger.info('🔍 Verificando documentos recién extraídos');

    // Buscar documentos creados en los últimos 5 minutos
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const recentDocuments = await prisma.document.findMany({
      where: {
        createdAt: {
          gte: fiveMinutesAgo
        }
      },
      select: {
        id: true,
        title: true,
        createdAt: true,
        webOfficialDate: true,
        publicationDate: true,
        metadata: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    logger.info(`📄 Encontrados ${recentDocuments.length} documentos recientes`);

    if (recentDocuments.length === 0) {
      logger.warn('⚠️ No se encontraron documentos recientes - la extracción podría haber fallado');
      return [];
    }

    recentDocuments.forEach((doc, index) => {
      logger.info(`\n📄 Documento ${index + 1}: ${doc.title}`);
      logger.info(`   ID: ${doc.id}`);
      logger.info(`   Creado: ${doc.createdAt.toISOString()}`);
      logger.info(`   Web Official Date: ${doc.webOfficialDate ? doc.webOfficialDate.toISOString().split('T')[0] : 'NULL'}`);
      logger.info(`   Publication Date: ${doc.publicationDate.toISOString().split('T')[0]}`);

      // Verificar si tiene structuredData
      if (doc.metadata) {
        try {
          const metadata = typeof doc.metadata === 'string' ? JSON.parse(doc.metadata) : doc.metadata;
          const fechaPublicacion = metadata?.structuredData?.fechaPublicacion;
          logger.info(`   Structured Data: ${fechaPublicacion ? `"${fechaPublicacion}"` : 'No disponible'}`);
        } catch (error) {
          logger.warn(`   Error parseando metadata: ${error}`);
        }
      }
    });

    return recentDocuments;

  } catch (error) {
    logger.error('❌ Error verificando documentos:', error);
    return [];
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  logger.info('🔥 Iniciando extracción REAL para obtener webOfficialDate');

  try {
    // Ejecutar extracción
    const success = await runRealExtraction();

    if (success) {
      logger.info('\n✅ Extracción ejecutada - verificando resultados...');

      // Esperar un poco para que se procesen los datos
      await new Promise(resolve => setTimeout(resolve, 2000));

      const newDocs = await verifyNewDocuments();

      if (newDocs.length > 0) {
        const docsWithWebDate = newDocs.filter(doc => doc.webOfficialDate);
        logger.info(`\n🎉 ¡Éxito! ${docsWithWebDate.length}/${newDocs.length} documentos tienen webOfficialDate`);

        if (docsWithWebDate.length > 0) {
          logger.info('🌐 Ahora puedes verificar en el frontend: http://localhost:5174/');
          logger.info('📄 Navega a la página de curación para ver las fechas web oficiales en formato YYYY-MM-DD');
        }
      } else {
        logger.warn('⚠️ No se crearon documentos nuevos - verificar logs de Python');
      }

    } else {
      logger.error('❌ La extracción falló - revisar configuración del scraper Python');
    }

  } catch (error) {
    logger.error('❌ Error en script principal:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}