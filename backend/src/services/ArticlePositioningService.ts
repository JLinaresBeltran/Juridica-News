import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export class ArticlePositioningService {
  /**
   * Ejecuta el empuje automático de artículos cuando se publica uno nuevo en General
   * La sección General tiene 6 posiciones distribuidas por el portal (1-2 al inicio, 3-4 al medio, 5-6 al final)
   *
   * ⚠️ CORRECCIÓN CRÍTICA #1 (Sep 2025):
   * Se corrigió un bug que eliminaba artículos del portal en lugar de empujarlos.
   * El error original buscaba solo artículos con isGeneral: true, pero al ejecutarse por primera vez
   * no existían artículos con este flag, causando que no se encontraran artículos para empujar.
   * SOLUCIÓN: Buscar por posicionGeneral != null en lugar de isGeneral: true
   *
   * ⚠️ CORRECCIÓN CRÍTICA #2 (Sep 2025):
   * Se corrigió bug de empuje no secuencial que dejaba gaps (ej: posición 2 vacía).
   * El algoritmo anterior usaba `i + 2` que asignaba posiciones basadas en índice, no en posición actual.
   * SOLUCIÓN: Empuje real usando `posicionActual + 1` para desplazar artículos secuencialmente.
   *
   * ⚠️ CORRECCIÓN CRÍTICA #3 (Sep 2025):
   * Se agregó validación para evitar que artículos excedan la posición 6 (máximo General).
   * Artículos que queden fuera del límite se archivan automáticamente.
   *
   * ⚠️ CORRECCIÓN CRÍTICA #4 (Sep 2025 - 29/09):
   * Se corrigió el algoritmo de empuje para usar posición actual + 1 en lugar de índice + 2.
   * PROBLEMA ORIGINAL: artículo pos 1 → pos 2, artículo pos 2 → pos 3 (saltaba), dejando pos 2 vacía.
   * SOLUCIÓN FINAL: Cada artículo se empuja +1 desde su posición actual (1→2, 2→3, 3→4, 4→5, 5→6).
   * RESULTADO: Empuje secuencial perfecto sin gaps.
   *
   * @param newArticleId ID del nuevo artículo a posicionar en General[1]
   */
  static async pushArticlesThroughPortal(newArticleId: string): Promise<void> {
    try {
      logger.info(`🔄 Iniciando empuje automático - Sección General 6 posiciones. Nuevo artículo: ${newArticleId}`);

      await prisma.$transaction(async (tx) => {
        // Paso 1: Obtener todos los artículos General actuales (posiciones 1-6)
        // CORREGIDO: Buscar por posicion_general no nula, no solo isGeneral: true
        const currentGeneral = await tx.article.findMany({
          where: {
            status: 'PUBLISHED',
            posicionGeneral: { not: null }
          },
          orderBy: { posicionGeneral: 'asc' },
          select: { id: true, posicionGeneral: true }
        });

        logger.info(`📊 Estado actual: General tiene ${currentGeneral.length} artículos en posiciones: ${currentGeneral.map(a => a.posicionGeneral).join(', ')}`);

        // Paso 2: ✅ EMPUJE SECUENCIAL CORRECTO - Mantener siempre 6 artículos
        // Ordenar artículos por posición actual (más nuevo = posición más baja)
        const articlesToReposition = currentGeneral.sort((a, b) => (a.posicionGeneral || 0) - (b.posicionGeneral || 0));

        logger.info(`🔄 Empujando ${articlesToReposition.length} artículos secuencialmente`);

        // Reasignar posiciones: cada artículo se mueve +1 posición
        // Si hay 6 artículos: [1,2,3,4,5,6] → [2,3,4,5,6,ARCHIVAR]
        // Si hay 5 artículos: [1,2,3,4,5] → [2,3,4,5,6]
        // Si hay 4 artículos: [1,2,3,4] → [2,3,4,5]

        for (let i = 0; i < articlesToReposition.length; i++) {
          const article = articlesToReposition[i];
          const currentPos = article.posicionGeneral || 0;
          const newPosition = i + 2; // índice 0→2, 1→3, 2→4, 3→5, 4→6

          // Si la nueva posición excede 6, archivar el artículo
          if (newPosition > 6) {
            logger.warn(`⚠️ Artículo ${article.id} excede posición 6, archivando...`);
            await tx.article.update({
              where: { id: article.id },
              data: {
                isGeneral: false,
                posicionGeneral: null
              }
            });
            logger.info(`📦 Artículo ${article.id} archivado (salió del portal por límite de 6)`);
            continue;
          }

          // Actualizar posición del artículo
          await tx.article.update({
            where: { id: article.id },
            data: { posicionGeneral: newPosition }
          });
          logger.info(`🔄 Artículo ${article.id} empujado: General[${currentPos}] → General[${newPosition}]`);
        }

        // Paso 3: Posicionar nuevo artículo en General[1]
        await tx.article.update({
          where: { id: newArticleId },
          data: {
            isGeneral: true,
            posicionGeneral: 1,
            // Limpiar otras secciones por si acaso
            isUltimasNoticias: false,
            posicionUltimasNoticias: null,
            isDestacadoSemana: false
          }
        });

        logger.info(`✅ Nuevo artículo ${newArticleId} posicionado en General[1]`);
      });

      logger.info(`🎉 Empuje automático completado exitosamente para artículo ${newArticleId}`);

    } catch (error) {
      logger.error(`❌ Error en empuje automático de artículos:`, error);
      throw new Error(`Error al reposicionar artículos: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Verifica la integridad de las posiciones en el portal
   */
  static async validatePortalIntegrity(): Promise<{ valid: boolean; issues: string[] }> {
    try {
      const issues: string[] = [];

      const [general, intermedia, inferior] = await Promise.all([
        prisma.article.findMany({
          where: { status: 'PUBLISHED', isGeneral: true },
          select: { id: true, posicionGeneral: true },
          orderBy: { posicionGeneral: 'asc' }
        }),
        prisma.article.findMany({
          where: { status: 'PUBLISHED', isSeccionIntermedia: true },
          select: { id: true, posicionSeccionIntermedia: true },
          orderBy: { posicionSeccionIntermedia: 'asc' }
        }),
        prisma.article.findMany({
          where: { status: 'PUBLISHED', isSeccionInferior: true },
          select: { id: true, posicionSeccionInferior: true },
          orderBy: { posicionSeccionInferior: 'asc' }
        })
      ]);

      // Verificar General (máximo 6, posiciones 1-6)
      if (general.length > 6) {
        issues.push(`General tiene ${general.length} artículos (máximo 6)`);
      }

      // Verificar Intermedia (máximo 2, posiciones 1 y 2)
      if (intermedia.length > 2) {
        issues.push(`Intermedia tiene ${intermedia.length} artículos (máximo 2)`);
      }

      // Verificar Inferior (máximo 2, posiciones 1 y 2)
      if (inferior.length > 2) {
        issues.push(`Inferior tiene ${inferior.length} artículos (máximo 2)`);
      }

      // Verificar secuencia de posiciones
      const sections = [
        { name: 'General', articles: general, posField: 'posicionGeneral' },
        { name: 'Intermedia', articles: intermedia, posField: 'posicionSeccionIntermedia' },
        { name: 'Inferior', articles: inferior, posField: 'posicionSeccionInferior' }
      ];

      sections.forEach(section => {
        if (section.articles.length > 0) {
          const positions = section.articles.map(a => {
            const fieldValue = a[section.posField as keyof typeof a];
            return Number(fieldValue);
          });
          const expectedPositions = Array.from({ length: section.articles.length }, (_, i) => i + 1);

          if (JSON.stringify(positions) !== JSON.stringify(expectedPositions)) {
            issues.push(`${section.name} tiene posiciones incorrectas: ${positions.join(', ')} (esperado: ${expectedPositions.join(', ')})`);
          }
        }
      });

      return {
        valid: issues.length === 0,
        issues
      };

    } catch (error) {
      logger.error('Error validando integridad del portal:', error);
      return {
        valid: false,
        issues: [`Error de validación: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  }

  /**
   * Obtiene estadísticas del estado actual del portal
   */
  static async getPortalStats(): Promise<{
    general: number;
    intermedia: number;
    inferior: number;
    ultimasNoticias: number;
    destacados: number;
    total: number;
  }> {
    try {
      const [general, intermedia, inferior, ultimasNoticias, destacados] = await Promise.all([
        prisma.article.count({ where: { status: 'PUBLISHED', isGeneral: true } }),
        prisma.article.count({ where: { status: 'PUBLISHED', isSeccionIntermedia: true } }),
        prisma.article.count({ where: { status: 'PUBLISHED', isSeccionInferior: true } }),
        prisma.article.count({ where: { status: 'PUBLISHED', isUltimasNoticias: true } }),
        prisma.article.count({ where: { status: 'PUBLISHED', isDestacadoSemana: true } })
      ]);

      return {
        general,
        intermedia,
        inferior,
        ultimasNoticias,
        destacados,
        total: general + intermedia + inferior + ultimasNoticias + destacados
      };

    } catch (error) {
      logger.error('Error obteniendo estadísticas del portal:', error);
      throw error;
    }
  }
}