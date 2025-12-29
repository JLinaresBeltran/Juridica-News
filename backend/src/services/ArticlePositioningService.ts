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
   * ⚠️ CORRECCIÓN CRÍTICA #5 (Oct 2025 - 15/10):
   * Se corrigió bug que archivaba artículos incorrectamente al buscar posicionGeneral != null sin isGeneral: true.
   * PROBLEMA: Si había artículos "fantasma" con posicionGeneral pero isGeneral=false (de operaciones previas),
   * el algoritmo los encontraba y causaba inconsistencias, archivando artículos válidos.
   * SOLUCIÓN: Agregar isGeneral: true a la consulta + limpieza preventiva de estados inconsistentes.
   * RESULTADO: Solo artículos legítimos se empujan, sin pérdidas inesperadas.
   *
   * ⚠️ CORRECCIÓN CRÍTICA #6 (Oct 2025 - 15/10):
   * Se corrigió bug que incluía el artículo nuevo en la lista de artículos a empujar, causando gaps y archivados incorrectos.
   * PROBLEMA: Si el artículo ya tenía isGeneral: true al llamar pushArticlesThroughPortal, se incluía en currentGeneral,
   * causando que se empujara a sí mismo y creara conflictos de posiciones (gaps y artículos archivados incorrectamente).
   * SOLUCIÓN: Excluir explícitamente el newArticleId de la consulta con id: { not: newArticleId }.
   * RESULTADO: El artículo nuevo nunca se empuja a sí mismo, empuje limpio sin gaps ni pérdidas.
   *
   * ⚠️ CORRECCIÓN CRÍTICA #7 (Oct 2025 - 16/10):
   * Se corrigió bug que perpetuaba gaps al empujar desde posiciones no secuenciales.
   * PROBLEMA: Si había gaps existentes (ej: [1,❌,3,4,5,6]), el empuje usaba posiciones actuales y perpetuaba el gap.
   * Ejemplo: 6→ARCH, 5→6, 4→5, 3→4, 1→2, nuevo→1 = [1,2,❌,4,5,6] (gap en pos 3).
   * SOLUCIÓN: Algoritmo en 3 pasos:
   *   1. Si hay 6 artículos, archivar el último
   *   2. NORMALIZAR artículos restantes a posiciones [2,3,4,5,6] secuenciales (sin gaps)
   *   3. Insertar nuevo artículo en posición 1
   * RESULTADO: Siempre posiciones secuenciales [1,2,3,4,5,6] sin gaps, independiente del estado inicial.
   *
   * @param newArticleId ID del nuevo artículo a posicionar en General[1]
   */
  static async pushArticlesThroughPortal(newArticleId: string): Promise<void> {
    try {
      logger.info(`🔄 Iniciando empuje automático - Sección General 6 posiciones. Nuevo artículo: ${newArticleId}`);

      await prisma.$transaction(async (tx) => {
        // Paso 0: Limpieza preventiva - Eliminar artículos "fantasma" con posicionGeneral pero sin isGeneral
        // Esto previene inconsistencias de operaciones previas fallidas
        const cleanedGhosts = await tx.article.updateMany({
          where: {
            status: 'PUBLISHED',
            posicionGeneral: { not: null },
            isGeneral: false
          },
          data: { posicionGeneral: null }
        });

        if (cleanedGhosts.count > 0) {
          logger.warn(`🧹 Limpiados ${cleanedGhosts.count} artículos "fantasma" con posicionGeneral inconsistente`);
        }

        // Paso 1: Obtener todos los artículos General actuales
        // ✅ CORREGIDO: Buscar por isGeneral: true Y posicionGeneral no nula
        // ⚠️ CRÍTICO: Excluir el artículo que se está posicionando para evitar conflictos
        const currentGeneral = await tx.article.findMany({
          where: {
            status: 'PUBLISHED',
            isGeneral: true,                // ✅ CRÍTICO: Validar que sea realmente General
            posicionGeneral: { not: null },
            id: { not: newArticleId }        // ✅ CRÍTICO: Excluir el artículo nuevo
          },
          orderBy: { posicionGeneral: 'asc' },
          select: { id: true, posicionGeneral: true, title: true }
        });

        logger.info(`📊 Estado ANTES del empuje: ${currentGeneral.length} artículos en posiciones: ${currentGeneral.map(a => a.posicionGeneral).join(', ')}`);
        logger.info(`🆕 Artículo nuevo a insertar: ${newArticleId}`);

        // Paso 2: Si hay 6 artículos, archivar el último (saldrá del portal)
        if (currentGeneral.length >= 6) {
          // Ordenar por posición descendente y tomar el último
          const sortedDesc = currentGeneral.sort((a, b) => (b.posicionGeneral || 0) - (a.posicionGeneral || 0));
          const articleToArchive = sortedDesc[0];

          logger.warn(`📦 Portal lleno (6 artículos). Archivando artículo en posición ${articleToArchive.posicionGeneral}: ${articleToArchive.title?.substring(0, 50)}...`);

          await tx.article.update({
            where: { id: articleToArchive.id },
            data: {
              isGeneral: false,
              posicionGeneral: null
            }
          });

          // Remover el artículo archivado de la lista
          currentGeneral.splice(0, 1);
          logger.info(`✅ Artículo archivado. Ahora hay ${currentGeneral.length} artículos activos en General`);
        }

        // Paso 3: NORMALIZAR - Reasignar todos los artículos restantes a posiciones [2,3,4,5,6] secuenciales
        // Esto garantiza que SIEMPRE las posiciones sean consecutivas sin gaps
        logger.info(`🔄 NORMALIZANDO posiciones: Reasignando ${currentGeneral.length} artículos a posiciones [2,3,4,5,6]`);

        // Ordenar artículos por posición actual (ascendente)
        const sortedAsc = currentGeneral.sort((a, b) => (a.posicionGeneral || 0) - (b.posicionGeneral || 0));

        // Reasignar posiciones secuenciales empezando desde 2
        for (let i = 0; i < sortedAsc.length; i++) {
          const article = sortedAsc[i];
          const newPosition = i + 2; // Posiciones [2, 3, 4, 5, 6]
          const oldPosition = article.posicionGeneral;

          if (oldPosition !== newPosition) {
            await tx.article.update({
              where: { id: article.id },
              data: { posicionGeneral: newPosition }
            });
            logger.info(`  📍 Artículo ${article.id.substring(0, 8)}... normalizado: pos ${oldPosition} → pos ${newPosition}`);
          } else {
            logger.info(`  ✓ Artículo ${article.id.substring(0, 8)}... ya en posición correcta: ${newPosition}`);
          }
        }

        // Paso 4: Insertar el nuevo artículo en posición 1
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

        logger.info(`✅ Nuevo artículo ${newArticleId} insertado en General[1]`);
        logger.info(`🎯 Estado FINAL: ${sortedAsc.length + 1} artículos en posiciones [1,2,3,4,5,6] (sin gaps garantizado)`);
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