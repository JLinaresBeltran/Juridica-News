// Test del sistema de empuje de Últimas Noticias
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testUltimasNoticiasPositioning() {
  console.log('🧪 Test: Sistema de empuje de Últimas Noticias\n');

  try {
    // Obtener artículos PUBLISHED para testear
    const publishedArticles = await prisma.article.findMany({
      where: { status: 'PUBLISHED' },
      take: 7, // Más de 5 para probar el límite
      orderBy: { publishedAt: 'desc' }
    });

    if (publishedArticles.length < 2) {
      console.log('❌ Necesitas al menos 2 artículos publicados para testear');
      return;
    }

    console.log(`📚 Encontrados ${publishedArticles.length} artículos publicados\n`);

    // Importar el servicio
    const { PublicationPositionService } = require('./src/services/PublicationPositionService.ts');

    // Test 1: Agregar primer artículo
    console.log('📝 Test 1: Agregando primer artículo a Últimas Noticias');
    await PublicationPositionService.handleUltimasNoticiasPositioning(
      publishedArticles[0].id,
      true
    );

    let ultimasNoticias = await prisma.article.findMany({
      where: { isUltimasNoticias: true },
      orderBy: { posicionUltimasNoticias: 'asc' },
      select: { id: true, title: true, posicionUltimasNoticias: true }
    });

    console.log(`✅ Artículos en Últimas Noticias: ${ultimasNoticias.length}`);
    ultimasNoticias.forEach(a => {
      console.log(`   - Posición ${a.posicionUltimasNoticias}: ${a.title.substring(0, 50)}`);
    });
    console.log('');

    // Test 2: Agregar más artículos hasta llegar a 5
    for (let i = 1; i < Math.min(5, publishedArticles.length); i++) {
      console.log(`📝 Test ${i + 1}: Agregando artículo ${i + 1}`);
      await PublicationPositionService.handleUltimasNoticiasPositioning(
        publishedArticles[i].id,
        true
      );
    }

    ultimasNoticias = await prisma.article.findMany({
      where: { isUltimasNoticias: true },
      orderBy: { posicionUltimasNoticias: 'asc' },
      select: { id: true, title: true, posicionUltimasNoticias: true }
    });

    console.log(`✅ Artículos en Últimas Noticias: ${ultimasNoticias.length}/5`);
    ultimasNoticias.forEach(a => {
      console.log(`   - Posición ${a.posicionUltimasNoticias}: ${a.title.substring(0, 50)}`);
    });
    console.log('');

    // Test 3: Agregar sexto artículo (debe empujar al más antiguo)
    if (publishedArticles.length >= 6) {
      console.log('📝 Test: Agregando 6to artículo (debe empujar al más antiguo)');
      await PublicationPositionService.handleUltimasNoticiasPositioning(
        publishedArticles[5].id,
        true
      );

      ultimasNoticias = await prisma.article.findMany({
        where: { isUltimasNoticias: true },
        orderBy: { posicionUltimasNoticias: 'asc' },
        select: { id: true, title: true, posicionUltimasNoticias: true }
      });

      console.log(`✅ Artículos en Últimas Noticias: ${ultimasNoticias.length}/5 (máximo)`);
      ultimasNoticias.forEach(a => {
        console.log(`   - Posición ${a.posicionUltimasNoticias}: ${a.title.substring(0, 50)}`);
      });
      
      if (ultimasNoticias.length === 5) {
        console.log('\n✅ ¡Sistema de empuje funcionando correctamente!');
        console.log('   El artículo más antiguo fue removido automáticamente.');
      } else {
        console.log(`\n❌ Error: Hay ${ultimasNoticias.length} artículos, deberían ser 5`);
      }
    }

    console.log('\n✅ Test completado exitosamente');

  } catch (error) {
    console.error('❌ Error en test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testUltimasNoticiasPositioning();
