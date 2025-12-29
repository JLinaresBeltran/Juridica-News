/**
 * Script para corregir URLs de DALL-E expiradas en artículos
 * Actualiza article.image_url para usar rutas locales desde generated_images
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixDalleUrls() {
  console.log('🔧 Iniciando corrección de URLs de DALL-E expiradas...\n');

  try {
    // 1. Encontrar artículos con URLs de DALL-E
    const articlesWithDalleUrls = await prisma.article.findMany({
      where: {
        imageUrl: {
          contains: 'oaidalleapiprodscus.blob.core.windows.net'
        }
      },
      select: {
        id: true,
        title: true,
        imageUrl: true,
        generatedImages: {
          select: {
            id: true,
            imageId: true,
            filename: true,
            originalUrl: true,
            savedToLibrary: true
          }
        }
      }
    });

    console.log(`📊 Encontrados ${articlesWithDalleUrls.length} artículos con URLs de DALL-E\n`);

    if (articlesWithDalleUrls.length === 0) {
      console.log('✅ No hay artículos que necesiten corrección');
      return;
    }

    // 2. Actualizar cada artículo
    let fixed = 0;
    let skipped = 0;

    for (const article of articlesWithDalleUrls) {
      console.log(`\n📄 Procesando: ${article.title.substring(0, 60)}...`);
      console.log(`   ID: ${article.id}`);
      console.log(`   URL actual: ${article.imageUrl?.substring(0, 80)}...`);

      // Buscar imagen en biblioteca asociada al artículo
      let targetImage = article.generatedImages.find(img => img.savedToLibrary);

      if (!targetImage && article.generatedImages.length > 0) {
        // Si no hay imagen en biblioteca, usar la primera disponible
        targetImage = article.generatedImages[0];
        console.log(`   ⚠️  No hay imagen en biblioteca, usando primera disponible`);
      }

      if (!targetImage) {
        console.log(`   ❌ Sin imágenes asociadas, omitiendo...`);
        skipped++;
        continue;
      }

      // Construir nueva URL local
      const newImageUrl = `/api/storage/images/${targetImage.filename}`;
      console.log(`   ✅ Nueva URL: ${newImageUrl}`);

      // Actualizar artículo
      await prisma.article.update({
        where: { id: article.id },
        data: { imageUrl: newImageUrl }
      });

      // Actualizar articleId en la imagen si no está asociada
      if (!targetImage.savedToLibrary) {
        await prisma.generatedImage.update({
          where: { id: targetImage.id },
          data: {
            articleId: article.id,
            savedToLibrary: true
          }
        });
        console.log(`   🔗 Imagen asociada y guardada en biblioteca`);
      }

      fixed++;
    }

    console.log(`\n\n🎉 Migración completada!`);
    console.log(`   ✅ Corregidos: ${fixed}`);
    console.log(`   ⚠️  Omitidos: ${skipped}`);
    console.log(`   📊 Total: ${articlesWithDalleUrls.length}`);

  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar
fixDalleUrls()
  .then(() => {
    console.log('\n✅ Script finalizado exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script finalizado con errores:', error);
    process.exit(1);
  });
