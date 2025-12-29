/**
 * Script de Reprocesamiento de Documentos DOCX
 * Analiza documentos existentes que tienen archivos DOCX descargados
 * pero no tienen análisis de IA completo
 */

import { PrismaClient } from '@prisma/client';
import { aiAnalysisService } from '@/services/AiAnalysisService';
import { logger } from '@/utils/logger';
import * as fs from 'fs';
import * as path from 'path';
import mammoth from 'mammoth';

const prisma = new PrismaClient();

interface ReprocessingStats {
  total: number;
  processed: number;
  successful: number;
  errors: number;
  skipped: number;
}

export class DocumentReprocessor {
  private stats: ReprocessingStats = {
    total: 0,
    processed: 0,
    successful: 0,
    errors: 0,
    skipped: 0
  };

  /**
   * Reprocesar todos los documentos que necesitan análisis de IA
   */
  async reprocessAll(options: {
    forceReprocess?: boolean;
    limit?: number;
    filterByStatus?: string[];
    aiModel?: 'openai' | 'gemini';
  } = {}) {
    const { 
      forceReprocess = false, 
      limit = 100, 
      filterByStatus = ['PENDING', 'APPROVED', 'CURATED', 'ANALYZED'],
      aiModel = 'openai'
    } = options;

    try {
      logger.info('🚀 Iniciando reprocesamiento de documentos DOCX...');

      // 1. Obtener documentos candidatos para reprocesamiento
      const documents = await this.findDocumentsToReprocess(forceReprocess, limit, filterByStatus);
      this.stats.total = documents.length;

      logger.info(`📊 Encontrados ${documents.length} documentos para reprocesar`);

      if (documents.length === 0) {
        logger.info('✅ No hay documentos que requieran reprocesamiento');
        return this.stats;
      }

      // 2. Procesar documentos uno por uno con rate limiting
      for (let i = 0; i < documents.length; i++) {
        const document = documents[i];
        
        logger.info(`\n📄 Procesando documento ${i + 1}/${documents.length}: ${document.title}`);
        logger.info(`   ID: ${document.id}, URL: ${document.url}`);
        
        try {
          const success = await this.reprocessSingleDocument(document, aiModel);
          
          if (success) {
            this.stats.successful++;
            logger.info(`   ✅ Reprocesado exitosamente`);
          } else {
            this.stats.errors++;
            logger.warn(`   ❌ Error en reprocesamiento`);
          }

        } catch (error) {
          this.stats.errors++;
          logger.error(`   💥 Error procesando documento ${document.id}:`, error);
        }

        this.stats.processed++;

        // Rate limiting: esperar entre documentos
        if (i < documents.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000)); // 2 segundos entre análisis
        }

        // Log de progreso cada 10 documentos
        if ((i + 1) % 10 === 0) {
          this.logProgress();
        }
      }

      // 3. Reporte final
      this.logFinalStats();

      return this.stats;

    } catch (error) {
      logger.error('💥 Error crítico en reprocesamiento:', error);
      throw error;
    }
  }

  /**
   * Encontrar documentos que necesitan reprocesamiento
   */
  private async findDocumentsToReprocess(
    forceReprocess: boolean,
    limit: number,
    filterByStatus: string[]
  ) {
    const whereConditions: any = {
      status: { in: filterByStatus }
    };

    if (!forceReprocess) {
      // Solo documentos sin análisis completo o con problemas
      whereConditions.OR = [
        { 
          OR: [
            { aiAnalysisStatus: null },
            { aiAnalysisStatus: { in: ['PENDING', 'ERROR'] } }
          ]
        },
        { 
          OR: [
            { temaPrincipal: null },
            { temaPrincipal: { in: ['', 'No identificado', 'No disponible'] } }
          ]
        },
        { 
          OR: [
            { resumenIA: null },
            { resumenIA: { in: ['', 'No disponible', 'No identificado'] } }
          ]
        },
        { 
          OR: [
            { decision: null },
            { decision: { in: ['', 'No identificada', 'No disponible'] } }
          ]
        }
      ];
    }

    // Obtener documentos ordenados por fecha
    const documents = await prisma.document.findMany({
      where: whereConditions,
      orderBy: [
        { updatedAt: 'desc' } // Más recientes primero
      ],
      take: limit,
      select: {
        id: true,
        title: true,
        url: true,
        content: true,
        documentPath: true,
        status: true,
        aiAnalysisStatus: true,
        temaPrincipal: true,
        resumenIA: true,
        decision: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return documents;
  }

  /**
   * Reprocesar un documento individual
   */
  private async reprocessSingleDocument(document: any, aiModel: 'openai' | 'gemini') {
    try {
      let contentToAnalyze = document.content;
      let shouldUpdateContent = false;

      // 1. Si existe archivo DOCX, regenerar el resumen inteligente
      if (document.documentPath) {
        // Construir ruta absoluta si es relativa
        const absolutePath = path.isAbsolute(document.documentPath)
          ? document.documentPath
          : path.join(__dirname, '../../storage/documents', document.documentPath);

        if (fs.existsSync(absolutePath)) {
          logger.info(`   📄 Regenerando resumen inteligente desde archivo DOCX: ${absolutePath}`);

          try {
            const fileBuffer = fs.readFileSync(absolutePath);
            const result = await mammoth.extractRawText({ buffer: fileBuffer });
            const fullText = result.value;

            // Usar primeros 1500 caracteres del documento (incluye encabezado con expediente)
            // + el contenido existente (que ya tiene resumen de secciones)
            const header = fullText.substring(0, 1500);
            contentToAnalyze = '=== ENCABEZADO ===\n' + header + '\n\n' + document.content;

            shouldUpdateContent = true;
            logger.info(`   ✅ Resumen regenerado: ${contentToAnalyze.length} caracteres (con encabezado de 1500 chars)`);
          } catch (error: any) {
            logger.error(`   ❌ ERROR regenerando resumen:`, error?.message || error);
            logger.error(`   Stack trace:`, error?.stack);
            contentToAnalyze = document.content;
          }
        } else {
          logger.info(`   ⚠️  Archivo DOCX no encontrado en: ${absolutePath}`);
          contentToAnalyze = document.content;
        }
      } else {
        logger.info(`   📄 Analizando contenido desde base de datos (sin documentPath)`);
      }

      // Verificar que hay contenido suficiente
      if (!contentToAnalyze || contentToAnalyze.length < 100) {
        logger.warn(`   ⚠️  Documento sin contenido suficiente para análisis`);
        this.stats.skipped++;
        return false;
      }

      // 2. Realizar análisis de IA
      const aiAnalysis = await aiAnalysisService.analyzeDocument(
        contentToAnalyze,
        document.title,
        aiModel
      );

      // 3. Verificar resultado del análisis
      if (!aiAnalysis) {
        logger.error(`   ❌ Análisis de IA falló para documento ${document.id}`);
        
        // Actualizar estado como error
        await prisma.document.update({
          where: { id: document.id },
          data: {
            aiAnalysisStatus: 'ERROR',
            aiAnalysisDate: new Date()
          }
        });
        
        return false;
      }

      // 4. Actualizar documento con resultados
      const updateData: any = {
        aiAnalysisStatus: 'COMPLETED',
        aiAnalysisDate: new Date(),
        temaPrincipal: aiAnalysis.temaPrincipal,
        resumenIA: aiAnalysis.resumenIA,
        decision: aiAnalysis.decision,
        aiModel: aiAnalysis.modeloUsado
      };

      // Actualizar content si se regeneró el resumen
      if (shouldUpdateContent) {
        updateData.content = contentToAnalyze;
        logger.info(`   📝 Actualizando campo 'content' con resumen regenerado`);
      }

      // Agregar campos opcionales si están disponibles
      if (aiAnalysis.numeroSentencia) {
        updateData.numeroSentencia = aiAnalysis.numeroSentencia;
      }
      if (aiAnalysis.magistradoPonente) {
        updateData.magistradoPonente = aiAnalysis.magistradoPonente;
      }
      if (aiAnalysis.salaRevision) {
        updateData.salaRevision = aiAnalysis.salaRevision;
      }
      if (aiAnalysis.expediente) {
        updateData.expediente = aiAnalysis.expediente;
      }

      await prisma.document.update({
        where: { id: document.id },
        data: updateData
      });

      // 5. Log de resultados
      logger.info(`   📊 Análisis completado:`);
      logger.info(`       Tema: ${aiAnalysis.temaPrincipal.substring(0, 60)}...`);
      logger.info(`       Decisión: ${aiAnalysis.decision.substring(0, 40)}...`);
      logger.info(`       Modelo: ${aiAnalysis.modeloUsado}`);

      return true;

    } catch (error) {
      logger.error(`   💥 Error procesando documento individual:`, error);
      
      // Marcar como error en la base de datos
      try {
        await prisma.document.update({
          where: { id: document.id },
          data: {
            aiAnalysisStatus: 'ERROR',
            aiAnalysisDate: new Date()
          }
        });
      } catch (updateError) {
        logger.error(`   🔥 Error actualizando estado de error:`, updateError);
      }
      
      return false;
    }
  }

  /**
   * Log de progreso durante el procesamiento
   */
  private logProgress() {
    const successRate = this.stats.processed > 0 ? 
      ((this.stats.successful / this.stats.processed) * 100).toFixed(1) : '0';
    
    logger.info(`\n📊 Progreso: ${this.stats.processed}/${this.stats.total}`);
    logger.info(`   ✅ Exitosos: ${this.stats.successful}`);
    logger.info(`   ❌ Errores: ${this.stats.errors}`);
    logger.info(`   ⏭️  Omitidos: ${this.stats.skipped}`);
    logger.info(`   🎯 Tasa de éxito: ${successRate}%`);
  }

  /**
   * Estadísticas finales del reprocesamiento
   */
  private logFinalStats() {
    const successRate = this.stats.processed > 0 ? 
      ((this.stats.successful / this.stats.processed) * 100).toFixed(1) : '0';
    
    logger.info(`\n🏁 REPROCESAMIENTO COMPLETADO`);
    logger.info(`═══════════════════════════════`);
    logger.info(`📊 Documentos totales: ${this.stats.total}`);
    logger.info(`✅ Procesados exitosamente: ${this.stats.successful}`);
    logger.info(`❌ Errores: ${this.stats.errors}`);
    logger.info(`⏭️  Omitidos: ${this.stats.skipped}`);
    logger.info(`🎯 Tasa de éxito: ${successRate}%`);
    
    if (this.stats.errors > 0) {
      logger.warn(`⚠️  Se encontraron ${this.stats.errors} errores durante el procesamiento`);
    }
  }

  /**
   * Reprocesar documentos específicos por IDs
   */
  async reprocessSpecificDocuments(documentIds: string[], aiModel: 'openai' | 'gemini' = 'openai') {
    try {
      logger.info(`🎯 Reprocesando documentos específicos: [${documentIds.join(', ')}]`);

      const documents = await prisma.document.findMany({
        where: { id: { in: documentIds } },
        select: {
          id: true,
          title: true,
          url: true,
          content: true,
          status: true,
          aiAnalysisStatus: true
        }
      });

      this.stats.total = documents.length;

      for (const document of documents) {
        logger.info(`\n📄 Procesando: ${document.title}`);
        
        try {
          const success = await this.reprocessSingleDocument(document, aiModel);
          
          if (success) {
            this.stats.successful++;
          } else {
            this.stats.errors++;
          }
        } catch (error) {
          this.stats.errors++;
          logger.error(`💥 Error procesando ${document.id}:`, error);
        }
        
        this.stats.processed++;
      }

      this.logFinalStats();
      return this.stats;

    } catch (error) {
      logger.error('💥 Error en reprocesamiento específico:', error);
      throw error;
    }
  }
}

/**
 * Script principal - ejecutar desde línea de comandos
 */
async function main() {
  const args = process.argv.slice(2);
  const reprocessor = new DocumentReprocessor();

  try {
    // Parsear argumentos
    const options: any = {};
    
    if (args.includes('--force')) {
      options.forceReprocess = true;
      logger.info('🔄 Modo forzado activado - reprocesará todos los documentos');
    }
    
    if (args.includes('--gemini')) {
      options.aiModel = 'gemini';
      logger.info('🧠 Usando modelo Gemini para análisis');
    }
    
    const limitArg = args.find(arg => arg.startsWith('--limit='));
    if (limitArg) {
      options.limit = parseInt(limitArg.split('=')[1]);
      logger.info(`📏 Límite establecido: ${options.limit} documentos`);
    }

    // Verificar si se especifican IDs específicos
    const idsArg = args.find(arg => arg.startsWith('--ids='));
    if (idsArg) {
      const ids = idsArg.split('=')[1].split(',');
      logger.info(`🎯 Reprocesando documentos específicos: ${ids.length} documentos`);
      await reprocessor.reprocessSpecificDocuments(ids, options.aiModel);
    } else {
      // Reprocesamiento general
      await reprocessor.reprocessAll(options);
    }

  } catch (error) {
    logger.error('💥 Error ejecutando script de reprocesamiento:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  main();
}