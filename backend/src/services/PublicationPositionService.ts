import { PrismaClient } from '@prisma/client';
import { logger } from '@/utils/logger';

const prisma = new PrismaClient();

export class PublicationPositionService {

  /**
   * Maneja el desplazamiento automático para la sección General
   * Máximo 2 artículos visibles, FIFO (First In, First Out)
   */
  static async handleGeneralPositioning(articleId: string, isGeneral: boolean): Promise<void> {
    try {
      if (!isGeneral) {
        // Si se desmarca General, quitar posición
        await prisma.article.update({
          where: { id: articleId },
          data: {
            isGeneral: false,
            posicionGeneral: null
          }
        });

        // Reordenar posiciones de los artículos restantes
        await this.reorderGeneralPositions();
        return;
      }

      // Contar artículos actuales en General
      const currentGeneralArticles = await prisma.article.findMany({
        where: {
          isGeneral: true,
          id: { not: articleId } // Excluir el artículo actual
        },
        orderBy: { posicionGeneral: 'asc' }
      });

      // El nuevo artículo toma la posición 1
      await prisma.article.update({
        where: { id: articleId },
        data: {
          isGeneral: true,
          posicionGeneral: 1
        }
      });

      // Desplazar otros artículos
      if (currentGeneralArticles.length >= 2) {
        // Si ya hay 2 o más, el último se desmarca de General
        const lastArticle = currentGeneralArticles[currentGeneralArticles.length - 1];
        if (lastArticle) {
          await prisma.article.update({
            where: { id: lastArticle.id },
            data: {
              isGeneral: false,
              posicionGeneral: null
            }
          });
        }

        // Reordenar solo el primero para la posición 2
        if (currentGeneralArticles.length > 0) {
          const firstArticle = currentGeneralArticles[0];
          if (firstArticle) {
            await prisma.article.update({
              where: { id: firstArticle.id },
              data: { posicionGeneral: 2 }
            });
          }
        }
      } else if (currentGeneralArticles.length === 1) {
        // Si hay solo 1, se mueve a posición 2
        const firstArticle = currentGeneralArticles[0];
        if (firstArticle) {
          await prisma.article.update({
            where: { id: firstArticle.id },
            data: { posicionGeneral: 2 }
          });
        }
      }

      logger.info('General positioning updated', {
        articleId,
        currentCount: currentGeneralArticles.length + 1
      });

    } catch (error) {
      logger.error('Error handling general positioning', { error, articleId });
      throw new Error('Failed to update general positioning');
    }
  }

  /**
   * Maneja el desplazamiento automático para Últimas Noticias
   * Máximo 5 artículos, ordenados por fecha de publicación
   */
  static async handleUltimasNoticiasPositioning(articleId: string, isUltimasNoticias: boolean): Promise<void> {
    try {
      if (!isUltimasNoticias) {
        await prisma.article.update({
          where: { id: articleId },
          data: {
            isUltimasNoticias: false,
            posicionUltimasNoticias: null
          }
        });
        await this.reorderUltimasNoticiasPositions();
        return;
      }

      // Contar artículos actuales en Últimas Noticias
      const currentCount = await prisma.article.count({
        where: {
          isUltimasNoticias: true,
          id: { not: articleId }
        }
      });

      if (currentCount >= 5) {
        // Si ya hay 5, quitar el más antiguo
        const oldestArticle = await prisma.article.findFirst({
          where: {
            isUltimasNoticias: true,
            id: { not: articleId }
          },
          orderBy: { publishedAt: 'asc' }
        });

        if (oldestArticle) {
          await prisma.article.update({
            where: { id: oldestArticle.id },
            data: {
              isUltimasNoticias: false,
              posicionUltimasNoticias: null
            }
          });
        }
      }

      // Marcar el artículo actual
      await prisma.article.update({
        where: { id: articleId },
        data: { isUltimasNoticias: true }
      });

      // Reordenar todas las posiciones por fecha
      await this.reorderUltimasNoticiasPositions();

      logger.info('Últimas Noticias positioning updated', {
        articleId,
        previousCount: currentCount
      });

    } catch (error) {
      logger.error('Error handling últimas noticias positioning', { error, articleId });
      throw new Error('Failed to update últimas noticias positioning');
    }
  }

  /**
   * Maneja el checkbox de Destacados de la Semana
   * Máximo 4 artículos
   */
  static async handleDestacadosPositioning(articleId: string, isDestacadoSemana: boolean): Promise<void> {
    try {
      if (!isDestacadoSemana) {
        await prisma.article.update({
          where: { id: articleId },
          data: { isDestacadoSemana: false }
        });
        return;
      }

      const currentCount = await prisma.article.count({
        where: {
          isDestacadoSemana: true,
          id: { not: articleId }
        }
      });

      if (currentCount >= 4) {
        // Si ya hay 4, quitar el más antiguo
        const oldestDestacado = await prisma.article.findFirst({
          where: {
            isDestacadoSemana: true,
            id: { not: articleId }
          },
          orderBy: { publishedAt: 'asc' }
        });

        if (oldestDestacado) {
          await prisma.article.update({
            where: { id: oldestDestacado.id },
            data: { isDestacadoSemana: false }
          });
        }
      }

      await prisma.article.update({
        where: { id: articleId },
        data: { isDestacadoSemana: true }
      });

      logger.info('Destacados positioning updated', { articleId });

    } catch (error) {
      logger.error('Error handling destacados positioning', { error, articleId });
      throw new Error('Failed to update destacados positioning');
    }
  }

  /**
   * Reordena las posiciones de General después de cambios
   */
  private static async reorderGeneralPositions(): Promise<void> {
    const generalArticles = await prisma.article.findMany({
      where: { isGeneral: true },
      orderBy: { publishedAt: 'desc' }
    });

    for (let i = 0; i < generalArticles.length; i++) {
      await prisma.article.update({
        where: { id: generalArticles[i].id },
        data: { posicionGeneral: i + 1 }
      });
    }
  }

  /**
   * Reordena las posiciones de Últimas Noticias por fecha
   */
  private static async reorderUltimasNoticiasPositions(): Promise<void> {
    const ultiasNoticiasArticles = await prisma.article.findMany({
      where: { isUltimasNoticias: true },
      orderBy: { publishedAt: 'desc' }
    });

    for (let i = 0; i < ultiasNoticiasArticles.length; i++) {
      await prisma.article.update({
        where: { id: ultiasNoticiasArticles[i].id },
        data: { posicionUltimasNoticias: i + 1 }
      });
    }
  }

  /**
   * Actualiza todos los controles de publicación de un artículo
   */
  static async updatePublicationSettings(
    articleId: string,
    settings: {
      isGeneral?: boolean;
      isUltimasNoticias?: boolean;
      entidadSeleccionada?: string | null;
      isDestacadoSemana?: boolean;
    }
  ): Promise<void> {
    try {
      // Procesar cada configuración
      if (settings.isGeneral !== undefined) {
        await this.handleGeneralPositioning(articleId, settings.isGeneral);
      }

      if (settings.isUltimasNoticias !== undefined) {
        await this.handleUltimasNoticiasPositioning(articleId, settings.isUltimasNoticias);
      }

      if (settings.isDestacadoSemana !== undefined) {
        await this.handleDestacadosPositioning(articleId, settings.isDestacadoSemana);
      }

      // Actualizar entidad seleccionada directamente
      if (settings.entidadSeleccionada !== undefined) {
        await prisma.article.update({
          where: { id: articleId },
          data: { entidadSeleccionada: settings.entidadSeleccionada }
        });
      }

      logger.info('Publication settings updated successfully', {
        articleId,
        settings
      });

    } catch (error) {
      logger.error('Error updating publication settings', { error, articleId, settings });
      throw new Error('Failed to update publication settings');
    }
  }

  /**
   * Obtiene estadísticas de uso de cada sección
   */
  static async getPublicationStats(): Promise<{
    general: number;
    ultimasNoticias: number;
    destacados: number;
    entidades: Record<string, number>;
  }> {
    try {
      const [general, ultimasNoticias, destacados, entidadesRaw] = await Promise.all([
        prisma.article.count({ where: { isGeneral: true } }),
        prisma.article.count({ where: { isUltimasNoticias: true } }),
        prisma.article.count({ where: { isDestacadoSemana: true } }),
        prisma.article.groupBy({
          by: ['entidadSeleccionada'],
          _count: true,
          where: { entidadSeleccionada: { not: null } }
        })
      ]);

      const entidades: Record<string, number> = {};
      entidadesRaw.forEach(item => {
        if (item.entidadSeleccionada) {
          entidades[item.entidadSeleccionada] = item._count;
        }
      });

      return {
        general,
        ultimasNoticias,
        destacados,
        entidades
      };
    } catch (error) {
      logger.error('Error getting publication stats', { error });
      throw new Error('Failed to get publication stats');
    }
  }
}