#!/usr/bin/env ts-node

/**
 * Script de debugging para probar el scraping y verificar por qué fullTextContent está NULL
 */

import { scrapingOrchestrator } from '@/services/ScrapingOrchestrator';
import { prisma } from '@/lib/prisma';
import { logger } from '@/utils/logger';

async function debugScraping() {
  try {
    console.log('🔍 INICIANDO DEBUG DE SCRAPING...\n');

    // 1. Ejecutar scraping con límite de 1 documento
    console.log('📡 Ejecutando scraping...');
    const result = await scrapingOrchestrator.startJob(
      'corte_constitucional',
      { limit: 1 },
      'debug-user'
    );

    console.log(`✅ Job iniciado: ${result.jobId}\n`);

    // 2. Esperar un poco para que termine
    await new Promise(resolve => setTimeout(resolve, 10000)); // 10 segundos

    // 3. Verificar el documento más reciente
    console.log('🔍 Verificando documento más reciente...');
    const latestDoc = await prisma.document.findFirst({
      orderBy: { extractedAt: 'desc' }
    });

    if (latestDoc) {
      console.log('\n📋 ANÁLISIS DEL DOCUMENTO:');
      console.log(`- ID: ${latestDoc.id}`);
      console.log(`- Título: ${latestDoc.title}`);
      console.log(`- URL: ${latestDoc.url}`);
      console.log(`- Contenido (length): ${latestDoc.content?.length || 0} caracteres`);
      console.log(`- FullTextContent (length): ${latestDoc.fullTextContent?.length || 0} caracteres`);
      console.log(`- DocumentPath: ${latestDoc.documentPath || 'NULL'}`);
      console.log(`- Extracted at: ${latestDoc.extractedAt}`);
      
      // Mostrar muestra del contenido
      if (latestDoc.content && latestDoc.content.length > 0) {
        console.log(`\n📄 MUESTRA DEL CONTENT (primeros 300 caracteres):`);
        console.log(latestDoc.content.substring(0, 300) + '...');
      }
      
      if (latestDoc.fullTextContent && latestDoc.fullTextContent.length > 0) {
        console.log(`\n📄 MUESTRA DEL FULL TEXT CONTENT (primeros 300 caracteres):`);
        console.log(latestDoc.fullTextContent.substring(0, 300) + '...');
      } else {
        console.log(`\n❌ PROBLEMA: fullTextContent está vacío o es NULL`);
      }
    } else {
      console.log('❌ No se encontraron documentos');
    }

  } catch (error) {
    console.error('❌ Error en debug:', error);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

// Ejecutar el debug
debugScraping();