/**
 * Servicio de Análisis de IA para Sentencias Judiciales
 * Refactorizado con Black Box Architecture usando IAIProvider adapters
 */

import { logger } from '@/utils/logger';
import { AIProviderFactory, aiProviderFactory } from '@/adapters/ai/AIProviderFactory';
import { AnalysisResult, DocumentFragments } from '@/adapters/ai/IAIProvider';
import { IContentProcessor } from '@/adapters/content/IContentProcessor';
import * as fs from 'fs';
import * as path from 'path';

// Mantener interfaz DocumentAnalysis para compatibilidad con código existente
interface DocumentAnalysis {
  temaPrincipal: string;
  resumenIA: string;
  decision: string;
  numeroSentencia?: string;
  magistradoPonente?: string;
  salaRevision?: string;
  expediente?: string;
  fragmentosAnalizados: string[];
  modeloUsado: string;
  confidencia: number;
}

// Usar DocumentFragments de IAIProvider
interface FragmentSelection extends DocumentFragments {}

export class AiAnalysisService {
  private aiProviderFactory: AIProviderFactory;
  private contentProcessor: IContentProcessor;
  private analysisQueue: Array<() => Promise<void>> = []; // Cola de análisis pendientes
  private isProcessingQueue: boolean = false; // Flag para evitar procesamiento concurrente

  constructor(
    aiProviderFactory?: AIProviderFactory,
    contentProcessor?: IContentProcessor
  ) {
    // Inyección de dependencias - Black Box Architecture
    this.aiProviderFactory = aiProviderFactory || new AIProviderFactory();

    // Lazy loading del content processor si no se inyecta
    if (contentProcessor) {
      this.contentProcessor = contentProcessor;
    } else {
      // Default: usar MammothContentProcessor
      const { MammothContentProcessor } = require('@/adapters/content/MammothContentProcessor');
      this.contentProcessor = new MammothContentProcessor();
    }

    const availableProviders = this.aiProviderFactory.getAvailableProviders();

    if (availableProviders.length === 0) {
      logger.warn('⚠️  No se encontraron proveedores de IA disponibles');
    } else {
      logger.info(`🤖 AiAnalysisService iniciado con proveedores: ${availableProviders.join(', ')}`);
    }
  }

  /**
   * Obtener modelos disponibles
   */
  public getAvailableModels(): string[] {
    return this.aiProviderFactory.getAvailableProviders();
  }

  /**
   * Procesar cola de análisis secuencialmente
   */
  private async processAnalysisQueue(): Promise<void> {
    if (this.isProcessingQueue || this.analysisQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;
    logger.info(`📋 Procesando cola de análisis: ${this.analysisQueue.length} elementos pendientes`);

    while (this.analysisQueue.length > 0) {
      const task = this.analysisQueue.shift();
      if (task) {
        try {
          await task();
          // Esperar 2 segundos entre análisis para respetar rate limits
          if (this.analysisQueue.length > 0) {
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        } catch (error) {
          logger.error('❌ Error procesando tarea de análisis en cola:', error);
        }
      }
    }

    this.isProcessingQueue = false;
    logger.info('✅ Cola de análisis completada');
  }

  /**
   * Encolar análisis para procesamiento secuencial
   */
  private enqueueAnalysis(task: () => Promise<void>): void {
    this.analysisQueue.push(task);
    logger.info(`📋 Tarea encolada. Cola actual: ${this.analysisQueue.length} elementos. Procesando: ${this.isProcessingQueue}`);
    
    // Iniciar procesamiento de cola si no está en curso
    if (!this.isProcessingQueue) {
      logger.info(`🚀 Iniciando procesamiento de cola automáticamente`);
      setTimeout(() => {
        this.processAnalysisQueue().catch(error => {
          logger.error('❌ Error procesando cola automáticamente:', error);
        });
      }, 100);
    }
  }

  /**
   * Analizar documento completo con IA
   * NOTA: documentContent ahora contiene resumen inteligente optimizado para IA (≤10K caracteres)
   * generado por ScrapingOrchestrator usando DocumentTextExtractor
   */
  async analyzeDocument(
    documentContent: string,
    documentTitle: string,
    model?: 'openai' | 'gemini'
  ): Promise<DocumentAnalysis | null> {
    try {
      const modelToUse = model || this.defaultModel;

      logger.info(`🔍 Iniciando análisis de IA: "${documentTitle}" con ${modelToUse}`);
      logger.info(`🔍 DEBUG 1: Preparando contenido para análisis...`);

      // 1. Preparar contenido para análisis
      let processedContent = documentContent;
      let extractedContent: any = null; // Mantener referencia al contenido extraído
      logger.info(`🔍 DEBUG 2: Contenido procesado, longitud: ${processedContent.length} caracteres`);

      // Verificar si es contenido binario DOCX y extraer texto
      if (this.isLikelyDocxContent(documentContent)) {
        logger.info('📄 Detectado contenido DOCX binario, extrayendo texto...');

        extractedContent = await this.extractTextFromDocxContent(documentContent, documentTitle);
        if (extractedContent) {
          processedContent = this.buildTextFromExtractedContent(extractedContent);
          logger.info(`✅ Texto extraído exitosamente: ${processedContent.length} caracteres`);
          logger.info(`🔍 DEBUG: Secciones extraídas - Intro: ${extractedContent.structuredContent.introduccion.length}ch, Considerandos: ${extractedContent.structuredContent.considerandos.length}ch, Resuelve: ${extractedContent.structuredContent.resuelve.length}ch`);
        } else {
          logger.error('❌ No se pudo extraer texto del contenido DOCX');
          return null;
        }
      }

      // 🎯 STEP 1: Extraer metadatos estructurales con regex (pre-IA) - CON TIMEOUT
      logger.info(`🔍 DEBUG: Iniciando extracción regex...`);
      let regexMetadata: Partial<DocumentAnalysis> = {};

      try {
        // Ejecutar con timeout de 10 segundos
        const regexPromise = new Promise<Partial<DocumentAnalysis>>((resolve) => {
          const result = this.extractMetadataWithRegex(processedContent, documentTitle);
          resolve(result);
        });

        const timeoutPromise = new Promise<Partial<DocumentAnalysis>>((_, reject) => {
          setTimeout(() => reject(new Error('Timeout en extracción regex')), 10000);
        });

        regexMetadata = await Promise.race([regexPromise, timeoutPromise]);

      } catch (error) {
        logger.error(`❌ Error/Timeout en extracción regex: ${error}`);
        regexMetadata = {}; // Continuar con metadatos vacíos
      }

      logger.info(`📊 Metadatos regex extraídos: Magistrado: ${regexMetadata.magistradoPonente || 'N/A'}, Expediente: ${regexMetadata.expediente || 'N/A'}, Sentencia: ${regexMetadata.numeroSentencia || 'N/A'}`);

      // 2. Seleccionar fragmentos clave - NUEVA LÓGICA
      logger.info(`🔍 DEBUG 3: Seleccionando fragmentos clave...`);
      let fragments: FragmentSelection | null = null;

      // 🎯 CORRECCIÓN: Si tenemos extracción exitosa con DocumentTextExtractor, usar directamente esas secciones
      if (extractedContent && extractedContent.structuredContent) {
        logger.info(`✅ Usando secciones ya extraídas por DocumentTextExtractor (incluye RESUELVE completo)`);
        fragments = {
          introduccion: extractedContent.structuredContent.introduccion || '',
          considerandos: extractedContent.structuredContent.considerandos || '',
          resuelve: extractedContent.structuredContent.resuelve || '',
          otros: extractedContent.structuredContent.otros || []
        };
        logger.info(`🔍 RESUELVE directo del DocumentTextExtractor: ${fragments.resuelve.length} caracteres`);
      } else {
        // Solo usar selectKeyFragments() como fallback para contenido sin extracción previa
        logger.info(`📄 Fallback: usando selectKeyFragments() para contenido sin extracción previa`);
        fragments = await this.selectKeyFragments(processedContent);
      }

      if (!fragments) {
        logger.error('❌ No se pudieron extraer fragmentos del documento');
        return null;
      }
      logger.info(`🔍 DEBUG 4: Fragmentos seleccionados exitosamente`);
      logger.info(`📋 Fragmentos finales - Intro: ${fragments.introduccion.length}ch, Considerandos: ${fragments.considerandos.length}ch, Resuelve: ${fragments.resuelve.length}ch`);

      // 2. Realizar análisis con el modelo seleccionado usando Black Box Architecture
      logger.info(`🔍 DEBUG 5: Iniciando análisis con modelo: ${modelToUse || 'auto'}`);
      let analysis: DocumentAnalysis | null = null;

      try {
        // Usar analyzeWithFallback para intentar con múltiples proveedores automáticamente
        const result: AnalysisResult = await this.aiProviderFactory.analyzeWithFallback(
          fragments,
          modelToUse
        );

        // Convertir AnalysisResult a DocumentAnalysis (compatibilidad)
        analysis = {
          temaPrincipal: result.temaPrincipal,
          resumenIA: result.resumenIA,
          decision: result.decision,
          ...(result.numeroSentencia && { numeroSentencia: result.numeroSentencia }),
          ...(result.magistradoPonente && { magistradoPonente: result.magistradoPonente }),
          ...(result.salaRevision && { salaRevision: result.salaRevision }),
          ...(result.expediente && { expediente: result.expediente }),
          fragmentosAnalizados: result.fragmentosAnalizados,
          modeloUsado: result.modeloUsado,
          confidencia: result.confidencia
        };

        logger.info(`🔍 DEBUG 7: Análisis completado con ${result.modeloUsado}`);
      } catch (error) {
        logger.error(`❌ Error en análisis con providers: ${error}`);
        analysis = null;
      }

      if (analysis) {
        logger.info(`✅ Análisis completado exitosamente con ${analysis.modeloUsado}`);
        
        // 🎯 STEP 2: Combinar metadatos regex + IA (regex tiene prioridad para campos estructurales)
        analysis = this.combineMetadata(regexMetadata, analysis);
        
        logger.info(`🔍 Metadatos finales: Magistrado: ${analysis.magistradoPonente || 'N/A'}, Sala: ${analysis.salaRevision || 'N/A'}, Expediente: ${analysis.expediente || 'N/A'}`);
      }

      return analysis;

    } catch (error) {
      logger.error(`❌ Error en análisis de IA: ${error}`);
      return null;
    }
  }

  /**
   * Seleccionar fragmentos clave del documento para análisis optimizado
   */
  private async selectKeyFragments(content: string): Promise<FragmentSelection | null> {
    try {
      logger.info(`🔍 DEBUG selectKeyFragments: Inicio del método`);
      const normalizedContent = content.toLowerCase();
      logger.info(`🔍 DEBUG selectKeyFragments: Contenido normalizado, longitud: ${normalizedContent.length}`);

      // Patrones para identificar secciones importantes
      const patterns = {
        // Encabezado con información estructural
        encabezado: /(?:república\s+de\s+colombia|corte\s+constitucional|sentencia\s+[tc]-\d|expediente|(?:magistrado|magistrada)\s+ponente)/i,
        introduccion: /(?:en\s+la\s+ciudad\s+de|la\s+corte\s+constitucional|sala\s+plena)/i,
        antecedentes: /(?:antecedentes|i\.\s*antecedentes|1\.\s*antecedentes)/i,
        considerandos: /(?:consideraciones|considerandos|ii\.\s*consideraciones|2\.\s*consideraciones|fundamentos\s+jurídicos)/i,
        resuelve: /(?:^[\s]*(?:(?:III|3)\.?\s*)?RESUELVE\s*[:\.]?[\s]*$|^[\s]*RESUELVE\s*[:\.]?[\s]*$|resuelve|decide|falla|iii\.\s*decisión|3\.\s*decisión)/im,
        ratioDecidendi: /(?:ratio\s+decidendi|fundamento\s+central|tesis\s+principal)/i
      };

      const fragments: FragmentSelection = {
        introduccion: '',
        considerandos: '',
        resuelve: '',
        otros: []
      };

      // Dividir el contenido en líneas para capturar mejor el encabezado
      logger.info(`🔍 DEBUG selectKeyFragments: Dividiendo contenido en líneas...`);
      const lines = content.split('\n').map(line => line.trim()).filter(line => line.length > 0);
      logger.info(`🔍 DEBUG selectKeyFragments: ${lines.length} líneas procesadas`);
      const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 20);
      logger.info(`🔍 DEBUG selectKeyFragments: ${paragraphs.length} párrafos procesados`);

      // 1. PRIORIDAD: Capturar encabezado con datos estructurales
      const header = [];
      for (let i = 0; i < Math.min(lines.length, 30); i++) {
        const line = lines[i];
        if (line.length > 3) { // Evitar líneas muy cortas
          header.push(line);
        }
        if (header.length >= 20) break; // Limitar el encabezado
      }
      
      // El encabezado siempre debe incluirse en introducción
      fragments.introduccion = header.join('\n') + '\n\n';

      // 2. Buscar secciones adicionales
      logger.info(`🔍 DEBUG selectKeyFragments: Iniciando búsqueda de secciones en ${paragraphs.length} párrafos`);
      let considerandosFound = false;
      let resuelveFound = false;

      for (const paragraph of paragraphs) {
        const paragraphLower = paragraph.toLowerCase();

        // Agregar más contenido de introducción si es relevante
        if (fragments.introduccion.length < 2000 && patterns.introduccion.test(paragraphLower)) {
          fragments.introduccion += paragraph + '\n\n';
        }

        // Buscar considerandos (parte central de la sentencia)
        if (!considerandosFound && patterns.considerandos.test(paragraphLower)) {
          considerandosFound = true;
        }
        
        if (considerandosFound && !resuelveFound && fragments.considerandos.length < 3000) {
          fragments.considerandos += paragraph + '\n\n';
        }

        // Buscar parte resolutiva - MEJORADO para capturar RESUELVE completo
        if (!resuelveFound && patterns.resuelve.test(paragraphLower)) {
          resuelveFound = true;
        }

        // CAMBIO CRÍTICO: Capturar TODA la sección RESUELVE sin límite de 1000 caracteres
        if (resuelveFound) {
          fragments.resuelve += paragraph + '\n\n';
        }

        // Capturar otros fragmentos relevantes
        if (patterns.ratioDecidendi.test(paragraphLower) && paragraph.length > 100) {
          fragments.otros.push(paragraph);
        }
      }

      // 3. Validar y aplicar fallback si es necesario
      if (fragments.considerandos.length < 500) {
        logger.warn('⚠️  Pocos considerandos encontrados, usando contenido central');
        const middleStart = Math.floor(content.length * 0.3);
        const middleEnd = Math.floor(content.length * 0.7);
        fragments.considerandos = content.substring(middleStart, middleEnd);
      }

      if (fragments.resuelve.length < 200) {
        logger.warn('⚠️  Parte resolutiva corta, usando contenido final completo');
        // CAMBIO: Buscar "RESUELVE" en últimas páginas del documento completo
        const finalPortion = paragraphs.slice(-10); // Últimos 10 párrafos
        let resuelveContent = '';
        let foundResuelveTitle = false;

        for (const p of finalPortion) {
          // Buscar el título "RESUELVE" con cualquier puntuación (:", "." o sin puntos)
          if (/^[\s]*RESUELVE\s*[:\.]?[\s]*$/i.test(p.trim())) {
            foundResuelveTitle = true;
          }

          if (foundResuelveTitle) {
            resuelveContent += p + '\n\n';
          }
        }

        // Si encontró "RESUELVE", usar ese contenido, sino usar parte final completa
        fragments.resuelve = resuelveContent || finalPortion.join('\n\n');
      }

      logger.info(`📄 Fragmentos extraídos: ${fragments.introduccion.length + fragments.considerandos.length + fragments.resuelve.length} caracteres`);
      logger.info(`📋 RESUELVE extraído: ${fragments.resuelve.length} caracteres - Contenido: ${fragments.resuelve.substring(0, 100)}...`);

      // DEBUG EXTRA: Si RESUELVE está vacío, verificar por qué
      if (fragments.resuelve.length === 0) {
        logger.warn(`❌ DEBUG AiAnalysis: RESUELVE vacío. Resuelve encontrado: ${resuelveFound}`);
        logger.info(`🔍 DEBUG: Buscando "resuelve" manualmente en contenido de ${content.length} caracteres`);

        const manualFind = content.toLowerCase().indexOf('resuelve');
        if (manualFind !== -1) {
          const contextStart = Math.max(0, manualFind - 100);
          const contextEnd = Math.min(content.length, manualFind + 300);
          logger.info(`🔍 DEBUG: "resuelve" encontrado manualmente: "${content.substring(contextStart, contextEnd)}"`);
        } else {
          logger.warn(`❌ DEBUG: "resuelve" NO encontrado en el contenido completo`);
        }
      }

      return fragments;

    } catch (error) {
      logger.error(`❌ Error seleccionando fragmentos: ${error}`);
      return null;
    }
  }


  /**
   * Analizar múltiples documentos en lote (con límite de rate)
   */
  async analyzeBatch(
    documents: Array<{ id: string; content: string; title: string }>,
    model?: 'openai' | 'gemini'
  ): Promise<Array<{ id: string; analysis: DocumentAnalysis | null }>> {
    const results = [];
    
    logger.info(`📊 Iniciando análisis en lote: ${documents.length} documentos`);

    for (let i = 0; i < documents.length; i++) {
      const doc = documents[i];
      
      logger.info(`📄 Procesando documento ${i + 1}/${documents.length}: ${doc.title}`);
      
      const analysis = await this.analyzeDocument(doc.content, doc.title, model);
      results.push({ id: doc.id, analysis });

      // Rate limiting: esperar entre análisis
      if (i < documents.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2 segundos entre llamadas
      }
    }

    logger.info(`✅ Análisis en lote completado: ${results.filter(r => r.analysis).length}/${documents.length} exitosos`);

    return results;
  }

  /**
   * Detectar si el contenido es probablemente binario DOCX
   */
  private isLikelyDocxContent(content: string): boolean {
    // Verificar si contiene caracteres binarios típicos de DOCX
    const binaryPattern = /[\x00-\x08\x0B\x0C\x0E-\x1F]/;
    const hasNullBytes = content.includes('\x00');
    const hasDocxSignature = content.includes('PK') && (content.includes('word/') || content.includes('document.xml'));
    const isVeryShort = content.length < 100;
    const hasHighBinaryRatio = (content.match(binaryPattern) || []).length / content.length > 0.1;

    return hasNullBytes || hasDocxSignature || (isVeryShort && hasHighBinaryRatio);
  }

  /**
   * Extraer texto de contenido DOCX binario usando IContentProcessor
   */
  private async extractTextFromDocxContent(content: string, filename: string) {
    try {
      // Convertir string a buffer (asumiendo que es contenido binario)
      const buffer = Buffer.from(content, 'binary');

      // Verificar formato DOCX (ZIP signature)
      const isDocx = buffer.length > 4 && buffer.subarray(0, 4).equals(Buffer.from([0x50, 0x4B, 0x03, 0x04]));
      if (!isDocx) {
        logger.warn(`⚠️  Contenido de ${filename} no parece ser DOCX válido`);
        return null;
      }

      // Extraer texto usando el content processor
      const extracted = await this.contentProcessor.extractText(buffer, filename);

      // Convertir ExtractedContent a formato compatible con el código existente
      return {
        fullText: extracted.fullText,
        structuredContent: extracted.structuredContent,
        metadata: {
          wordCount: extracted.wordCount,
          extractionMethod: extracted.extractionMethod,
          hasStructure: extracted.metadata.hasStructure
        }
      };
    } catch (error) {
      logger.error(`❌ Error extrayendo texto de ${filename}:`, error);
      return null;
    }
  }

  /**
   * Construir texto unificado a partir del contenido extraído
   * INCLUYE el encabezado inicial para capturar expediente y metadatos
   */
  private buildTextFromExtractedContent(extractedContent: any): string {
    const { structuredContent, fullText } = extractedContent;

    // Extraer el encabezado (primeras 500 caracteres del texto completo)
    // que contiene: expediente, magistrado, sentencia, fecha, etc.
    const header = fullText ? fullText.substring(0, 500) : '';

    // Construir texto combinando encabezado + secciones estructuradas
    const sections = [];

    // Agregar encabezado primero (contiene expediente)
    if (header) {
      sections.push('=== ENCABEZADO ===\n' + header);
    }

    if (structuredContent.introduccion) {
      sections.push('=== INTRODUCCIÓN ===\n' + structuredContent.introduccion);
    }

    if (structuredContent.considerandos) {
      sections.push('=== CONSIDERANDOS ===\n' + structuredContent.considerandos);
    }

    if (structuredContent.resuelve) {
      sections.push('=== RESUELVE ===\n' + structuredContent.resuelve);
    }

    if (structuredContent.otros && structuredContent.otros.length > 0) {
      sections.push('=== OTROS ELEMENTOS RELEVANTES ===\n' + structuredContent.otros.join('\n\n'));
    }

    return sections.join('\n\n');
  }

  /**
   * 🎯 Extraer metadatos estructurales con regex (PRE-IA)
   * Funciona como sistema principal para campos estructurales específicos
   */
  private extractMetadataWithRegex(content: string, documentTitle: string): Partial<DocumentAnalysis> {
    logger.info(`🔍 DEBUG extractMetadataWithRegex: Iniciando extracción de metadatos, contenido: ${content.length} caracteres`);
    const metadata: Partial<DocumentAnalysis> = {};

    // Timeout para evitar bloqueos
    const startTime = Date.now();
    const TIMEOUT_MS = 15000; // 15 segundos máximo
    
    // 1. Magistrado Ponente - Patrones simplificados para evitar catastrophic backtracking
    logger.info(`🔍 DEBUG extractMetadataWithRegex: Extrayendo magistrado ponente...`);
    const magistradoPatterns = [
      // Patrones muy simplificados para evitar catastrophic backtracking
      /magistrado ponente[:\s]*([A-ZÁÉÍÓÚÑ][^\n]{5,40})/im,
      /magistrada ponente[:\s]*([A-ZÁÉÍÓÚÑ][^\n]{5,40})/im,
      /m\.p\.[:\s]*([A-ZÁÉÍÓÚÑ][^\n]{10,40})/im,
      /ponente[:\s]*([A-ZÁÉÍÓÚÑ][^\n]{10,40})/im
    ];
    
    for (let i = 0; i < magistradoPatterns.length; i++) {
      logger.info(`🔍 DEBUG: Probando patrón magistrado ${i + 1}/${magistradoPatterns.length}`);
      try {
        const pattern = magistradoPatterns[i];
        const match = content.match(pattern);
        if (match && match[1]) {
          logger.info(`🔍 DEBUG: Match encontrado con patrón ${i + 1}: "${match[1]}"`);
        } else {
          logger.info(`🔍 DEBUG: No match con patrón ${i + 1}`);
          continue;
        }
        let cleanName = match[1].trim()
          .replace(/\.$/, '') // Eliminar punto final
          .replace(/\s+/g, ' ') // Normalizar espacios
          .replace(/[^\w\sáéíóúñÁÉÍÓÚÑ]/g, '') // Solo letras, números, espacios y tildes
          .trim();

        logger.info(`🔍 DEBUG: Nombre limpiado: "${cleanName}"`);

        // Validación mejorada: debe tener al menos 2 palabras y formato de nombre
        const words = cleanName.split(' ').filter(w => w.length > 0);
        const isValidName = words.length >= 2 && words.length <= 5 &&
                           cleanName.length >= 10 && cleanName.length <= 60 &&
                           /^[A-ZÁÉÍÓÚÑ]/.test(cleanName) && // Comienza con mayúscula
                           !/\d{2,}/.test(cleanName); // No tiene secuencias largas de números

        logger.info(`🔍 DEBUG: Validación nombre - palabras: ${words.length}, longitud: ${cleanName.length}, válido: ${isValidName}`);

        if (isValidName) {
          // Capitalizar correctamente
          metadata.magistradoPonente = cleanName
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
          logger.info(`🔧 Regex extrajo magistrado: "${metadata.magistradoPonente}"`);
          break;
        } else {
          logger.warn(`⚠️ Regex descartó magistrado inválido: "${cleanName}" (palabras: ${words.length})`);
        }
      } catch (error) {
        logger.error(`❌ Error con patrón magistrado ${i + 1}:`, error);
      }

      // Verificar timeout
      if (Date.now() - startTime > TIMEOUT_MS) {
        logger.warn(`⚠️ Timeout en extracción de magistrado después de ${TIMEOUT_MS}ms`);
        break;
      }
    }

    logger.info(`🔍 DEBUG: Magistrado completado en ${Date.now() - startTime}ms`);

    // 2. Expediente - Patrones mejorados
    const expedientePatterns = [
      // Patrón MUY flexible que captura expedientes incluso sin espacios
      // Funciona con: "expediente T-10.123.456", "expedienteT-10.123", "Referencia: expediente T-10.938.839"
      /expediente[\s:]*([A-Z]-[\d.,]+)/im,
      // Variantes comunes
      /exp\.[\s:]*([A-Z]-[\d.,]+)/im,
      /radicaci[oó]n[\s:]*([A-Z]-[\d.,]+)/im,
      // Referencia: expediente (común en encabezados)
      /referencia[\s:]*expediente[\s:]*([A-Z]-[\d.,]+)/im
    ];

    for (const pattern of expedientePatterns) {
      const match = content.match(pattern);
      if (match) {
        let expediente = match[1].trim();

        // Limpiar el expediente: eliminar puntos/comas/espacios finales
        expediente = expediente.replace(/[.,\s]+$/, '');

        // Extraer solo la parte válida (letra-números con puntos/comas)
        // Detener en el primer carácter no válido
        const validMatch = expediente.match(/^([A-Z]-[\d.,]+)/);
        if (validMatch) {
          expediente = validMatch[1].replace(/[.,]+$/, ''); // Eliminar separadores finales
        }

        // Validar formato de expediente más flexible
        // Acepta: Letra + guion + números con puntos/comas opcionales
        // Longitud máxima de 20 caracteres para ser razonable
        if (/^[A-Z]-[\d.,]+$/.test(expediente) && expediente.length >= 4 && expediente.length <= 20) {
          metadata.expediente = expediente;
          logger.info(`🔧 Regex extrajo expediente: "${metadata.expediente}"`);
          break;
        } else {
          logger.warn(`⚠️ Regex descartó expediente inválido: "${expediente}" (longitud: ${expediente.length})`);
        }
      }
    }
    
    // 3. Número de Sentencia - PRIORIDAD: Extraer del título PRIMERO
    const sentenciaPatterns = [
      // Patrones para buscar en título y contenido
      /sentencia\s+([CT]-\d+(?:\s*\/\s*|\s*-\s*)\d{2,4})/im,
      /sentencia\s+(?:no\.?\s*|número\s*)?([CT]-\d+(?:\s+de\s+|\s*\/\s*|\s*-\s*)\d{2,4})/im,
      /(?:^|\n)\s*([CT]-\d+(?:\s*\/\s*|\s*-\s*)\d{2,4})(?:\s|$)/im,
      // Patrón directo para capturar formato estándar
      /([CT]-\d+(?:\s*\/\s*|\s*-\s*)\d{2,4})/im
    ];

    // 🎯 PASO 1: Buscar PRIMERO en el título del documento
    for (const pattern of sentenciaPatterns) {
      const titleMatch = documentTitle.match(pattern);
      
      if (titleMatch) {
        // Normalizar formato: C-223 DE 2025 → C-223/25
        const numeroNormalizado = titleMatch[1].toUpperCase()
          .replace(/\s+DE\s+/, '/').replace(/\s*-\s*/, '/').replace(/\s/g, '');
        
        // Validar año
        const yearMatch = numeroNormalizado.match(/\/(\d{2,4})$/);
        if (yearMatch) {
          const year = parseInt(yearMatch[1]);
          const fullYear = year < 100 ? (year < 50 ? 2000 + year : 1900 + year) : year;
          
          if (fullYear >= 2020) {
            metadata.numeroSentencia = numeroNormalizado;
            logger.info(`✅ Regex extrajo número del TÍTULO: "${metadata.numeroSentencia}" (año válido: ${fullYear})`);
            break;
          }
        } else {
          metadata.numeroSentencia = numeroNormalizado;
          logger.info(`✅ Regex extrajo número del TÍTULO: "${metadata.numeroSentencia}"`);
          break;
        }
      }
    }
    
    // 🎯 PASO 2: Solo si no se encontró en el título, buscar en el contenido (con más restricciones)
    if (!metadata.numeroSentencia) {
      const restrictivePatterns = [
        // Patrones muy específicos para evitar referencias cruzadas
        /sentencia\s+([CT]-\d+(?:\s*\/\s*|\s*-\s*)\d{2,4})/im,
        /(?:^|\n)\s*([CT]-\d+(?:\s*\/\s*|\s*-\s*)\d{2,4})(?:\s|$)/im
      ];
      
      for (const pattern of restrictivePatterns) {
        const match = content.match(pattern);
        
        if (match) {
          const numeroNormalizado = match[1].toUpperCase()
            .replace(/\s+DE\s+/, '/').replace(/\s*-\s*/, '/').replace(/\s/g, '');
          
          // Para contenido, ser más restrictivo con años (solo 2023-2025)
          const yearMatch = numeroNormalizado.match(/\/(\d{2,4})$/);
          if (yearMatch) {
            const year = parseInt(yearMatch[1]);
            const fullYear = year < 100 ? (year < 50 ? 2000 + year : 1900 + year) : year;
            
            if (fullYear >= 2023) {
              metadata.numeroSentencia = numeroNormalizado;
              logger.info(`⚠️ Regex extrajo número del CONTENIDO (fallback): "${metadata.numeroSentencia}" (año válido: ${fullYear})`);
              break;
            } else {
              logger.info(`🔧 Regex descartó número del contenido: "${numeroNormalizado}" (año muy antiguo: ${fullYear})`);
            }
          }
        }
      }
    }
    
    // 4. Sala de Revisión - Patrones mejorados y más específicos
    const salaPatterns = [
      // Patrones exactos para salas conocidas
      /\b(sala\s+plena)(?:\s|$|,|\.|\n)/im,
      /\b(sala\s+primera)(?:\s+de\s+revisi[óo]n)?(?:\s|$|,|\.|\n)/im,
      /\b(sala\s+segunda)(?:\s+de\s+revisi[óo]n)?(?:\s|$|,|\.|\n)/im,
      /\b(sala\s+tercera)(?:\s+de\s+revisi[óo]n)?(?:\s|$|,|\.|\n)/im,
      /\b(sala\s+cuarta)(?:\s+de\s+revisi[óo]n)?(?:\s|$|,|\.|\n)/im,
      /\b(sala\s+quinta)(?:\s+de\s+revisi[óo]n)?(?:\s|$|,|\.|\n)/im,
      /\b(sala\s+sexta)(?:\s+de\s+revisi[óo]n)?(?:\s|$|,|\.|\n)/im,
      /\b(sala\s+s[ée]ptima)(?:\s+de\s+revisi[óo]n)?(?:\s|$|,|\.|\n)/im,
      /\b(sala\s+octava)(?:\s+de\s+revisi[óo]n)?(?:\s|$|,|\.|\n)/im,
      /\b(sala\s+novena)(?:\s+de\s+revisi[óo]n)?(?:\s|$|,|\.|\n)/im,
      // Patrones con guiones
      /-\s*(sala\s+(?:plena|primera|segunda|tercera|cuarta|quinta|sexta|s[ée]ptima|octava|novena))\s*-/im,
      // Patrón más específico para evitar capturas largas
      /(?:^|\n|\.)\s*(sala\s+(?:plena|primera|segunda|tercera|cuarta|quinta|sexta|s[ée]ptima|octava|novena))(?:\s+de\s+revisi[óo]n)?\s*(?:$|,|\.|\n)/im
    ];
    
    for (const pattern of salaPatterns) {
      const match = content.match(pattern);
      if (match) {
        let sala = match[1].trim()
          .replace(/\s+/g, ' ') // Normalizar espacios
          .replace(/\b\w/g, l => l.toUpperCase()); // Title Case
        
        // Lista de salas válidas conocidas para validación
        const salasValidas = [
          'Sala Plena', 'Sala Primera', 'Sala Segunda', 'Sala Tercera', 
          'Sala Cuarta', 'Sala Quinta', 'Sala Sexta', 'Sala Séptima', 
          'Sala Septima', 'Sala Octava', 'Sala Novena'
        ];
        
        // Validar que la sala está en la lista o es una variación válida
        const salaValida = salasValidas.some(validSala => 
          validSala.toLowerCase() === sala.toLowerCase() ||
          (validSala + ' De Revisión').toLowerCase() === sala.toLowerCase()
        );
        
        if (salaValida && sala.length <= 30) {
          metadata.salaRevision = sala;
          logger.info(`🔧 Regex extrajo sala: "${metadata.salaRevision}"`);
          break;
        } else {
          logger.warn(`⚠️ Regex descartó sala inválida: "${sala}"`);
        }
      }
    }
    
    return metadata;
  }

  /**
   * 🎯 Combinar metadatos regex (prioritarios) + IA (complementarios)
   */
  private combineMetadata(regexData: Partial<DocumentAnalysis>, aiData: DocumentAnalysis): DocumentAnalysis {
    // Los metadatos de regex tienen prioridad para campos estructurales
    return {
      ...aiData, // Base de IA (tema, resumen, decisión)
      // Campos estructurales: regex tiene prioridad
      numeroSentencia: regexData.numeroSentencia || aiData.numeroSentencia,
      magistradoPonente: regexData.magistradoPonente || aiData.magistradoPonente,
      salaRevision: regexData.salaRevision || aiData.salaRevision,
      expediente: regexData.expediente || aiData.expediente,
      // Marcar que se usó sistema híbrido
      modeloUsado: aiData.modeloUsado + (
        (regexData.magistradoPonente || regexData.expediente || regexData.numeroSentencia)
          ? ' + regex-extractor'
          : ''
      )
    };
  }

  /**
   * Analizar documento desde archivo físico DOCX usando IContentProcessor
   */
  async analyzeDocumentFromFile(
    filePath: string,
    documentTitle: string,
    model?: 'openai' | 'gemini'
  ): Promise<DocumentAnalysis | null> {
    try {
      logger.info(`📁 Analizando documento desde archivo: ${filePath}`);

      // Verificar si es archivo DOCX
      const buffer = fs.readFileSync(filePath);
      const isDocx = buffer.length > 4 && buffer.subarray(0, 4).equals(Buffer.from([0x50, 0x4B, 0x03, 0x04]));

      if (!isDocx) {
        logger.warn(`⚠️  ${filePath} no parece ser un archivo DOCX válido`);

        // Intentar leer como texto plano
        const textContent = fs.readFileSync(filePath, 'utf8');
        return await this.analyzeDocument(textContent, documentTitle, model);
      }

      // Extraer texto del archivo DOCX usando content processor
      const extracted = await this.contentProcessor.extractText(buffer, path.basename(filePath));

      if (!extracted) {
        logger.error(`❌ No se pudo extraer contenido de ${filePath}`);
        return null;
      }

      // Convertir a formato compatible
      const extractedContent = {
        fullText: extracted.fullText,
        structuredContent: extracted.structuredContent,
        metadata: {
          wordCount: extracted.wordCount,
          extractionMethod: extracted.extractionMethod,
          hasStructure: extracted.metadata.hasStructure
        }
      };

      logger.info(`🔍 DEBUG: Secciones extraídas directamente - Intro: ${extractedContent.structuredContent.introduccion.length}ch, Considerandos: ${extractedContent.structuredContent.considerandos.length}ch, Resuelve: ${extractedContent.structuredContent.resuelve.length}ch`);

      // 🎯 CORRECCIÓN: Usar directamente las secciones extraídas SIN doble procesamiento
      const fragments: FragmentSelection = {
        introduccion: extractedContent.structuredContent.introduccion || '',
        considerandos: extractedContent.structuredContent.considerandos || '',
        resuelve: extractedContent.structuredContent.resuelve || '',
        otros: extractedContent.structuredContent.otros || []
      };

      logger.info(`✅ Usando secciones directas del archivo DOCX (evita duplicación)`);
      logger.info(`📋 Fragmentos directos - Intro: ${fragments.introduccion.length}ch, Considerandos: ${fragments.considerandos.length}ch, Resuelve: ${fragments.resuelve.length}ch`);

      // Extraer metadatos con regex directamente del texto estructurado
      const textContent = this.buildTextFromExtractedContent(extractedContent);
      const regexMetadata = this.extractMetadataWithRegex(textContent, documentTitle);

      // Realizar análisis directo con las secciones usando Black Box Architecture
      let analysis: DocumentAnalysis | null = null;

      try {
        const result: AnalysisResult = await this.aiProviderFactory.analyzeWithFallback(
          fragments,
          model
        );

        // Convertir AnalysisResult a DocumentAnalysis
        analysis = {
          temaPrincipal: result.temaPrincipal,
          resumenIA: result.resumenIA,
          decision: result.decision,
          ...(result.numeroSentencia && { numeroSentencia: result.numeroSentencia }),
          ...(result.magistradoPonente && { magistradoPonente: result.magistradoPonente }),
          ...(result.salaRevision && { salaRevision: result.salaRevision }),
          ...(result.expediente && { expediente: result.expediente }),
          fragmentosAnalizados: result.fragmentosAnalizados,
          modeloUsado: result.modeloUsado,
          confidencia: result.confidencia
        };
      } catch (error) {
        logger.error(`❌ Error en análisis con providers: ${error}`);
        analysis = null;
      }

      if (analysis) {
        // Combinar metadatos regex con análisis IA
        analysis = this.combineMetadata(regexMetadata, analysis);

        // Agregar metadata de extracción
        analysis.fragmentosAnalizados = [
          `Extraído con ${extractedContent.metadata.extractionMethod}`,
          `${extractedContent.metadata.wordCount} palabras`,
          `Estructura: ${extractedContent.metadata.hasStructure ? 'Detectada' : 'No detectada'}`
        ];
      }

      return analysis;

    } catch (error) {
      logger.error(`❌ Error analizando archivo ${filePath}:`, error);
      return null;
    }
  }

  /**
   * Genera un resumen conciso del contenido usando IA
   * @param content Contenido del texto a resumir
   * @param maxWords Máximo número de palabras (default: 150)
   * @param style Estilo del resumen ('professional', 'academic', 'casual')
   * @returns Resumen generado
   */
  async generateSummary(
    content: string,
    maxWords: number = 150,
    style: 'professional' | 'academic' | 'casual' = 'professional'
  ): Promise<{ summary: string; wordCount: number } | null> {
    try {
      if (!content || content.trim().length === 0) {
        return { summary: 'Contenido no disponible para resumir', wordCount: 5 };
      }

      let summary: string = '';

      try {
        // Usar provider factory para generar resumen
        const provider = this.aiProviderFactory.getProvider();
        summary = await provider.generateSummary(content, {
          maxWords,
          style,
          focusOn: [] // Opcional: aspectos a enfatizar
        });
      } catch (error) {
        logger.warn('Error con provider para generateSummary, usando fallback:', error);

        // Fallback final - resumen básico
        const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
        const firstSentences = sentences.slice(0, 3).join('. ').substring(0, maxWords * 7); // Aprox 7 chars por palabra
        summary = firstSentences + (firstSentences.length < content.length ? '...' : '');
      }

      const wordCount = summary.split(/\s+/).length;

      logger.info(`📝 Resumen generado: ${wordCount} palabras (max: ${maxWords})`);

      return {
        summary: summary.trim(),
        wordCount
      };

    } catch (error) {
      logger.error('Error generando resumen:', error);
      return {
        summary: 'Error al generar resumen automático',
        wordCount: 5
      };
    }
  }
}

// Instancia singleton del servicio con factory inyectado
export const aiAnalysisService = new AiAnalysisService(aiProviderFactory);