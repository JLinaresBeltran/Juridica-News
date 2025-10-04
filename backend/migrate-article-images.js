/**
 * Script de migración para actualizar imageUrl en artículos existentes
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrateArticleImages() {
  console.log('Iniciando migracion de imagenes de articulos...\n');

  try {
    const articlesWithoutImage = await prisma.article.findMany({
      where: {
        OR: [
          { imageUrl: null },
          { imageUrl: '' }
        ]
      },
      include: {
        sourceDocument: {
          include: {
            generatedImages: {
              where: {
                savedToLibrary: true
              },
              orderBy: {
                createdAt: 'desc'
              },
              take: 1
            }
          }
        }
      }
    });

    console.log('Encontrados', articlesWithoutImage.length, 'articulos sin imagen\n');

    let updated = 0;
    let skipped = 0;

    for (const article of articlesWithoutImage) {
      const latestImage = article.sourceDocument?.generatedImages?.[0];

      if (latestImage) {
        const imageUrl = `/api/storage/images/${latestImage.filename}`;

        await prisma.article.update({
          where: { id: article.id },
          data: { imageUrl }
        });

        console.log('Actualizado:', article.title.substring(0, 60));
        console.log('   Imagen:', imageUrl, '\n');
        updated++;
      } else {
        console.log('Sin imagen:', article.title.substring(0, 60));
        skipped++;
      }
    }

    console.log('\nResumen:');
    console.log('   Actualizados:', updated);
    console.log('   Sin imagen:', skipped);
    console.log('   Total:', articlesWithoutImage.length);

  } catch (error) {
    console.error('Error durante la migracion:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

migrateArticleImages()
  .then(() => {
    console.log('\nMigracion completada exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nMigracion fallo:', error);
    process.exit(1);
  });
