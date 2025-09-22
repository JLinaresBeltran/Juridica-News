/**
 * ImageStorageService - Servicio para el guardado automático de imágenes
 *
 * Funcionalidades:
 * - Descarga automática de imágenes desde URLs de APIs (DALL-E, Gemini)
 * - Optimización de calidad (150-300 KB)
 * - Guardado local en backend/storage/images/
 * - Asociación con documentos/artículos
 * - Generación de URLs locales para uso en frontend
 */

import { promises as fs } from 'fs';
import path from 'path';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import sharp from 'sharp';
import { logger } from '../utils/logger';

interface ImageMetadata {
  id: string;
  documentId: string;
  originalUrl: string;
  localPath: string;
  filename: string;
  size: number;
  width: number;
  height: number;
  format: string;
  model: string;
  style: string;
  prompt: string;
  createdAt: Date;
}

interface ImageSaveOptions {
  documentId: string;
  imageUrl: string;
  imageId: string;
  model: string;
  style: string;
  prompt: string;
  targetSizeMin?: number; // 150 KB por defecto
  targetSizeMax?: number; // 300 KB por defecto
}

export class ImageStorageService {
  private readonly storageDir: string;
  private readonly baseUrl: string;

  constructor() {
    this.storageDir = path.join(process.cwd(), 'storage', 'images');
    this.baseUrl = '/api/storage/images'; // URL base para servir imágenes
    this.initializeStorage();
  }

  /**
   * Inicializa el directorio de almacenamiento
   */
  private async initializeStorage(): Promise<void> {
    try {
      await fs.mkdir(this.storageDir, { recursive: true });
      logger.info('📁 Directorio de imágenes inicializado', {
        storageDir: this.storageDir
      });
    } catch (error) {
      logger.error('❌ Error inicializando storage de imágenes:', error);
    }
  }

  /**
   * Guarda una imagen automáticamente con optimización de calidad
   */
  async saveImage(options: ImageSaveOptions): Promise<ImageMetadata | null> {
    const {
      documentId,
      imageUrl,
      imageId,
      model,
      style,
      prompt,
      targetSizeMin = 150 * 1024, // 150 KB
      targetSizeMax = 300 * 1024  // 300 KB
    } = options;

    try {
      logger.info('💾 Iniciando guardado automático de imagen', {
        documentId,
        imageId,
        model,
        style,
        targetSizeRange: `${targetSizeMin / 1024}-${targetSizeMax / 1024} KB`
      });

      // 1. Descargar imagen desde URL
      const imageBuffer = await this.downloadImage(imageUrl);
      if (!imageBuffer) {
        throw new Error('No se pudo descargar la imagen');
      }

      // 2. Optimizar calidad y tamaño
      const optimizedBuffer = await this.optimizeImage(imageBuffer, targetSizeMin, targetSizeMax);

      // 3. Generar filename único
      const filename = this.generateFilename(documentId, imageId, style);
      const localPath = path.join(this.storageDir, filename);

      // 4. Guardar archivo optimizado
      await fs.writeFile(localPath, optimizedBuffer);

      // 5. Obtener metadatos de la imagen optimizada
      const metadata = await this.getImageMetadata(optimizedBuffer);

      // 6. Verificar tamaño final
      const finalSize = optimizedBuffer.length;
      logger.info('✅ Imagen guardada exitosamente', {
        filename,
        finalSize: `${(finalSize / 1024).toFixed(1)} KB`,
        dimensions: `${metadata.width}x${metadata.height}`,
        format: metadata.format,
        withinTargetRange: finalSize >= targetSizeMin && finalSize <= targetSizeMax
      });

      // 7. Crear objeto de metadatos completo
      const imageMetadata: ImageMetadata = {
        id: imageId,
        documentId,
        originalUrl: imageUrl,
        localPath,
        filename,
        size: finalSize,
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        model,
        style,
        prompt,
        createdAt: new Date()
      };

      return imageMetadata;

    } catch (error) {
      logger.error('❌ Error guardando imagen automáticamente:', error);
      return null;
    }
  }

  /**
   * Descarga una imagen desde una URL
   */
  private async downloadImage(imageUrl: string): Promise<Buffer | null> {
    try {
      logger.info('⬇️ Descargando imagen desde URL...');

      // Determinar si es base64 o URL externa
      if (imageUrl.startsWith('data:image/')) {
        // Imagen en base64
        const base64Data = imageUrl.split(',')[1];
        return Buffer.from(base64Data, 'base64');
      } else {
        // URL externa - usar fetch
        const response = await fetch(imageUrl);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer);
      }
    } catch (error) {
      logger.error('❌ Error descargando imagen:', error);
      return null;
    }
  }

  /**
   * Optimiza una imagen para que esté entre 150-300 KB manteniendo calidad
   */
  private async optimizeImage(
    imageBuffer: Buffer,
    targetSizeMin: number,
    targetSizeMax: number
  ): Promise<Buffer> {
    try {
      logger.info('🎨 Optimizando imagen para tamaño objetivo...');

      // Primer intento con calidad 85%
      let quality = 85;
      let optimizedBuffer = await sharp(imageBuffer)
        .jpeg({ quality, progressive: true })
        .toBuffer();

      // Ajustar calidad iterativamente para llegar al rango objetivo
      let attempts = 0;
      const maxAttempts = 5;

      while (attempts < maxAttempts) {
        const currentSize = optimizedBuffer.length;

        logger.info(`📏 Intento ${attempts + 1}: Tamaño actual ${(currentSize / 1024).toFixed(1)} KB (calidad ${quality}%)`);

        // Si está en el rango objetivo, terminar
        if (currentSize >= targetSizeMin && currentSize <= targetSizeMax) {
          logger.info('✅ Tamaño objetivo alcanzado');
          break;
        }

        // Si es muy grande, reducir calidad
        if (currentSize > targetSizeMax) {
          quality = Math.max(quality - 10, 60); // No bajar de 60%
        }
        // Si es muy pequeño, aumentar calidad o cambiar a PNG
        else if (currentSize < targetSizeMin) {
          if (quality < 95) {
            quality = Math.min(quality + 5, 95);
          } else {
            // Cambiar a PNG para mayor calidad
            optimizedBuffer = await sharp(imageBuffer)
              .png({ quality: 90, progressive: true })
              .toBuffer();
            break;
          }
        }

        // Aplicar nueva configuración
        optimizedBuffer = await sharp(imageBuffer)
          .jpeg({ quality, progressive: true })
          .toBuffer();

        attempts++;
      }

      const finalSize = optimizedBuffer.length;
      logger.info('🎯 Optimización completada', {
        finalSize: `${(finalSize / 1024).toFixed(1)} KB`,
        finalQuality: `${quality}%`,
        attempts: attempts + 1
      });

      return optimizedBuffer;

    } catch (error) {
      logger.error('❌ Error optimizando imagen:', error);
      // Fallback: intentar con configuración básica
      return await sharp(imageBuffer)
        .jpeg({ quality: 80 })
        .toBuffer();
    }
  }

  /**
   * Obtiene metadatos de una imagen
   */
  private async getImageMetadata(imageBuffer: Buffer): Promise<{ width: number; height: number; format: string }> {
    try {
      const metadata = await sharp(imageBuffer).metadata();
      return {
        width: metadata.width || 0,
        height: metadata.height || 0,
        format: metadata.format || 'jpeg'
      };
    } catch (error) {
      logger.error('❌ Error obteniendo metadatos de imagen:', error);
      return { width: 0, height: 0, format: 'jpeg' };
    }
  }

  /**
   * Genera un filename único para la imagen
   */
  private generateFilename(documentId: string, imageId: string, style: string): string {
    const timestamp = Date.now();
    const sanitizedStyle = style.replace(/[^a-zA-Z0-9]/g, '');
    return `${documentId}_${sanitizedStyle}_${imageId}_${timestamp}.jpg`;
  }

  /**
   * Obtiene la URL pública para una imagen guardada
   */
  getImageUrl(filename: string): string {
    return `${this.baseUrl}/${filename}`;
  }

  /**
   * Verifica si una imagen existe localmente
   */
  async imageExists(filename: string): Promise<boolean> {
    try {
      const localPath = path.join(this.storageDir, filename);
      await fs.access(localPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Elimina una imagen del almacenamiento
   */
  async deleteImage(filename: string): Promise<boolean> {
    try {
      const localPath = path.join(this.storageDir, filename);
      await fs.unlink(localPath);
      logger.info('🗑️ Imagen eliminada', { filename });
      return true;
    } catch (error) {
      logger.error('❌ Error eliminando imagen:', error);
      return false;
    }
  }

  /**
   * Obtiene información de almacenamiento
   */
  async getStorageInfo(): Promise<{ totalImages: number; totalSize: number }> {
    try {
      const files = await fs.readdir(this.storageDir);
      const imageFiles = files.filter(file => /\.(jpg|jpeg|png|webp)$/i.test(file));

      let totalSize = 0;
      for (const file of imageFiles) {
        const filePath = path.join(this.storageDir, file);
        const stats = await fs.stat(filePath);
        totalSize += stats.size;
      }

      return {
        totalImages: imageFiles.length,
        totalSize
      };
    } catch (error) {
      logger.error('❌ Error obteniendo info de almacenamiento:', error);
      return { totalImages: 0, totalSize: 0 };
    }
  }
}

// Instancia singleton
export const imageStorageService = new ImageStorageService();
export default imageStorageService;