import { PrismaClient } from '@prisma/client';
import { promises as fs } from 'fs';
import path from 'path';
import { logger } from '@/utils/logger';

const prisma = new PrismaClient();

/**
 * Limpia imágenes huérfanas de la base de datos
 * (registros de imágenes cuyos archivos físicos no existen)
 */
export async function cleanOrphanImages() {
  try {
    logger.info('🧹 Iniciando limpieza de imágenes huérfanas...');

    // Obtener todas las imágenes de la base de datos
    const allImages = await prisma.generatedImage.findMany({
      select: {
        id: true,
        filename: true,
        imageId: true,
        savedToLibrary: true
      }
    });

    logger.info(`📊 Total de imágenes en BD: ${allImages.length}`);

    const orphanImages = [];
    const validImages = [];

    // Verificar cada imagen
    for (const image of allImages) {
      const imagePath = path.join(process.cwd(), 'storage', 'images', image.filename);

      try {
        await fs.access(imagePath);
        // El archivo existe
        const stats = await fs.stat(imagePath);
        if (stats.size > 0) {
          validImages.push(image);
        } else {
          // Archivo existe pero está vacío
          orphanImages.push({ ...image, reason: 'archivo vacío' });
        }
      } catch {
        // El archivo no existe
        orphanImages.push({ ...image, reason: 'archivo no existe' });
      }
    }

    logger.info(`✅ Imágenes válidas: ${validImages.length}`);
    logger.info(`🗑️ Imágenes huérfanas encontradas: ${orphanImages.length}`);

    if (orphanImages.length > 0) {
      logger.info('📋 Imágenes huérfanas:');
      orphanImages.forEach(img => {
        logger.info(`   - ${img.imageId} (${img.filename}) - ${img.reason}`);
      });

      // Eliminar registros huérfanos de la base de datos
      const orphanIds = orphanImages.map(img => img.id);
      const deletedCount = await prisma.generatedImage.deleteMany({
        where: {
          id: {
            in: orphanIds
          }
        }
      });

      logger.info(`🗑️ Eliminados ${deletedCount.count} registros huérfanos de la BD`);
    }

    // Estadísticas finales
    const finalCount = await prisma.generatedImage.count();
    logger.info(`📊 Imágenes restantes en BD: ${finalCount}`);

    return {
      total: allImages.length,
      valid: validImages.length,
      orphans: orphanImages.length,
      deleted: orphanImages.length,
      remaining: finalCount
    };

  } catch (error) {
    logger.error('❌ Error en limpieza de imágenes huérfanas:', error);
    throw error;
  }
}

/**
 * Verifica el estado de una imagen específica
 */
export async function checkImageStatus(imageId: string) {
  try {
    const image = await prisma.generatedImage.findFirst({
      where: { imageId },
      include: { document: true }
    });

    if (!image) {
      return { status: 'not_found', message: 'Imagen no encontrada en BD' };
    }

    const imagePath = path.join(process.cwd(), 'storage', 'images', image.filename);

    try {
      await fs.access(imagePath);
      const stats = await fs.stat(imagePath);

      return {
        status: stats.size > 0 ? 'valid' : 'empty',
        image: {
          id: image.imageId,
          filename: image.filename,
          size: stats.size,
          dbSize: image.size,
          path: imagePath,
          url: `/api/storage/images/${image.filename}`,
          savedToLibrary: image.savedToLibrary,
          isPublic: image.isPublic,
          document: image.document?.title || null
        }
      };
    } catch {
      return {
        status: 'missing_file',
        message: 'Archivo físico no existe',
        image: {
          id: image.imageId,
          filename: image.filename,
          expectedPath: imagePath
        }
      };
    }

  } catch (error) {
    logger.error('❌ Error verificando estado de imagen:', error);
    return { status: 'error', message: (error as Error).message };
  }
}