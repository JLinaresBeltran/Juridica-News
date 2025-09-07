#!/usr/bin/env ts-node

/**
 * Script para limpiar documentos de prueba de la base de datos
 * Ejecutar: npx ts-node src/scripts/clean-test-data.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanTestData() {
  console.log('🧹 Iniciando limpieza de datos de prueba...');
  
  try {
    // 1. Eliminar documentos con source = 'test_local' (del script load-test-documents)
    console.log('\n📂 Eliminando documentos test_local...');
    const testLocalResult = await prisma.document.deleteMany({
      where: {
        source: 'test_local'
      }
    });
    console.log(`   ✅ Eliminados ${testLocalResult.count} documentos test_local`);

    // 2. Eliminar documentos de seed con URLs de ejemplo
    console.log('\n📂 Eliminando documentos de seed con URLs de ejemplo...');
    const seedResult = await prisma.document.deleteMany({
      where: {
        OR: [
          { url: { contains: 'example.com' } },
          { url: { contains: 'boe.es' } },
          { url: { startsWith: 'file://' } },
          // Documentos muy antiguos (anteriores a 2020 probablemente sean de prueba)
          { 
            publicationDate: {
              lt: new Date('2020-01-01')
            }
          }
        ]
      }
    });
    console.log(`   ✅ Eliminados ${seedResult.count} documentos de seed/ejemplo`);

    // 3. Eliminar artículos de prueba relacionados
    console.log('\n📄 Eliminando artículos de prueba...');
    const articlesResult = await prisma.article.deleteMany({
      where: {
        OR: [
          { slug: { contains: 'test' } },
          { slug: { contains: 'prueba' } },
          { slug: 'nueva-ley-proteccion-datos-2024' }, // Del seed
          { title: { contains: 'Análisis de la nueva Ley' } } // Del seed
        ]
      }
    });
    console.log(`   ✅ Eliminados ${articlesResult.count} artículos de prueba`);

    // 4. Mostrar estadísticas finales
    console.log('\n📊 Estadísticas después de la limpieza:');
    const remainingDocs = await prisma.document.count();
    const remainingArticles = await prisma.article.count();
    
    console.log(`   📄 Documentos restantes: ${remainingDocs}`);
    console.log(`   📰 Artículos restantes: ${remainingArticles}`);

    // 5. Mostrar documentos restantes por fuente
    const docsBySource = await prisma.document.groupBy({
      by: ['source'],
      _count: {
        id: true
      }
    });

    if (docsBySource.length > 0) {
      console.log('\n📊 Documentos por fuente:');
      docsBySource.forEach(group => {
        console.log(`   - ${group.source}: ${group._count.id} documentos`);
      });
    }

    // 6. Mostrar algunos documentos recientes para verificar
    const recentDocs = await prisma.document.findMany({
      select: {
        id: true,
        title: true,
        source: true,
        publicationDate: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    });

    if (recentDocs.length > 0) {
      console.log('\n📋 Últimos 5 documentos en la BD:');
      recentDocs.forEach((doc, index) => {
        console.log(`   ${index + 1}. ${doc.title.substring(0, 60)}...`);
        console.log(`      Fuente: ${doc.source} | Fecha: ${doc.publicationDate?.toISOString().split('T')[0]}`);
      });
    }

    console.log('\n🎉 ¡Limpieza completada exitosamente!');
    
  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  cleanTestData()
    .then(() => {
      console.log('\n✨ Datos de prueba eliminados correctamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Error fatal:', error);
      process.exit(1);
    });
}

export { cleanTestData };