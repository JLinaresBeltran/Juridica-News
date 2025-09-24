/**
 * Servicio de Análisis de IA para Sentencias Judiciales
 * Integra OpenAI GPT-4 Mini y Google Gemini para análisis automático
 */

import { logger } from '@/utils/logger';
import { documentTextExtractor, DocumentTextExtractor } from '@/services/DocumentTextExtractor';
import * as fs from 'fs';
import * as path from 'path';

// Interfaces para el análisis
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

interface FragmentSelection {
  introduccion: string;
  considerandos: string;
  resuelve: string;
  otros: string[];
}

export class AiAnalysisService {
  private openAiApiKey?: string;
  private geminiApiKey?: string;
  private defaultModel: 'openai' | 'gemini' = 'openai';
  private openAiClient?: any; // Instancia singleton del cliente OpenAI
  private analysisQueue: Array<() => Promise<void>> = []; // Cola de análisis pendientes
  private isProcessingQueue: boolean = false; // Flag para evitar procesamiento concurrente

  constructor() {
    this.openAiApiKey = process.env.OPENAI_API_KEY;
    this.geminiApiKey = process.env.GEMINI_API_KEY;

    if (!this.openAiApiKey && !this.geminiApiKey) {
      logger.warn('⚠️  No se encontraron API keys para servicios de IA');
    }

    // Determinar modelo por defecto
    if (this.openAiApiKey) {
      this.defaultModel = 'openai';
    } else if (this.geminiApiKey) {
      this.defaultModel = 'gemini';
    }

    logger.info(`🤖 AiAnalysisService iniciado - Modelo por defecto: ${this.defaultModel}`);
  }

  /**
   * Obtener instancia singleton del cliente OpenAI
   */
  private async getOpenAIClient() {
    if (!this.openAiClient && this.openAiApiKey) {
      try {
        const OpenAI = (await import('openai')).default;
        this.openAiClient = new OpenAI({
          apiKey: this.openAiApiKey,
          timeout: 120000, // 2 minutos de timeout
          maxRetries: 2, // Máximo 2 reintentos
        });
        logger.info('✅ Cliente OpenAI singleton creado exitosamente');
      } catch (error) {
        logger.error('❌ Error creando cliente OpenAI:', error);
        throw error;
      }
    }
    return this.openAiClient;
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

      // 2. Realizar análisis con el modelo seleccionado
      logger.info(`🔍 DEBUG 5: Iniciando análisis con modelo: ${modelToUse}`);
      let analysis: DocumentAnalysis | null = null;
      
      if (modelToUse === 'openai' && this.openAiApiKey) {
        logger.info(`🔍 DEBUG 6: Llamando analyzeWithOpenAI...`);
        analysis = await this.analyzeWithOpenAI(fragments, documentTitle);
        logger.info(`🔍 DEBUG 7: analyzeWithOpenAI completado`);
      } else if (modelToUse === 'gemini' && this.geminiApiKey) {
        logger.info(`🔍 DEBUG 6: Llamando analyzeWithGemini...`);
        analysis = await this.analyzeWithGemini(fragments, documentTitle);
        logger.info(`🔍 DEBUG 7: analyzeWithGemini completado`);
      }

      if (!analysis) {
        // Intentar con el otro modelo como fallback
        const fallbackModel = modelToUse === 'openai' ? 'gemini' : 'openai';
        logger.info(`🔄 Intentando con modelo de respaldo: ${fallbackModel}`);
        
        if (fallbackModel === 'openai' && this.openAiApiKey) {
          analysis = await this.analyzeWithOpenAI(fragments, documentTitle);
        } else if (fallbackModel === 'gemini' && this.geminiApiKey) {
          analysis = await this.analyzeWithGemini(fragments, documentTitle);
        }
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
   * Análisis con OpenAI GPT-4 Mini usando cola para evitar concurrencia
   */
  private async analyzeWithOpenAI(
    fragments: FragmentSelection,
    documentTitle: string
  ): Promise<DocumentAnalysis | null> {
    logger.info(`🔄 Encolando análisis para: ${documentTitle}`);
    
    return new Promise((resolve, reject) => {
      // Encolar el análisis para procesamiento secuencial
      this.enqueueAnalysis(async () => {
        try {
          logger.info(`🔍 Ejecutando análisis desde cola para: ${documentTitle}`);
          const result = await this.executeOpenAIAnalysis(fragments, documentTitle);
          resolve(result);
        } catch (error) {
          logger.error(`❌ Error en análisis desde cola para ${documentTitle}:`, error);
          reject(error);
        }
      });
    });
  }

  /**
   * Ejecutar análisis con OpenAI GPT-4 Mini (método interno)
   */
  private async executeOpenAIAnalysis(
    fragments: FragmentSelection,
    documentTitle: string
  ): Promise<DocumentAnalysis | null> {
    try {
      const openai = await this.getOpenAIClient();
      
      if (!openai) {
        logger.error('❌ No se pudo obtener cliente OpenAI');
        return null;
      }

      const prompt = this.buildAnalysisPrompt(fragments, documentTitle);

      // Log del prompt completo para debugging
      logger.info('🔍 Enviando análisis a OpenAI GPT-4 Mini...');
      logger.info('📝 PROMPT COMPLETO ENVIADO A OPENAI:');
      logger.info('=' .repeat(80));
      logger.info(prompt);
      logger.info('=' .repeat(80));

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Eres un asistente de IA experto en el análisis y la síntesis de sentencias de la Corte Constitucional de Colombia. Tu tarea es procesar el documento legal que te proporcionaré y extraer sus componentes más importantes de manera clara y estructurada. No agregues opiniones ni información que no esté explícitamente en el texto.

El rol del asistente es ser un analista legal de documentos y un sintetizador de información.

El objetivo es identificar los componentes clave de una sentencia judicial de la Corte Constitucional, independientemente de su tipo (T, SU, C, etc.). Se debe extraer la siguiente información de forma precisa y estructurada: los hechos, el problema jurídico, las consideraciones principales de la corte (la ratio decidendi) y, finalmente, la decisión o las órdenes finales. El objetivo es que esta información sea comprensible para cualquier persona, sin necesidad de ser un experto en derecho.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1500,
        temperature: 0.3, // Baja temperatura para respuestas más consistentes
        response_format: { type: "json_object" }
      });

      const result = response.choices[0]?.message?.content;
      
      if (!result) {
        logger.error('❌ OpenAI no devolvió respuesta');
        return null;
      }

      // Log de la respuesta completa para debugging
      logger.info('🤖 RESPUESTA COMPLETA DE OPENAI:');
      logger.info('=' .repeat(80));
      logger.info(result);
      logger.info('=' .repeat(80));

      const parsedResult = JSON.parse(result);

      return {
        temaPrincipal: parsedResult.tema_principal || 'No identificado',
        resumenIA: parsedResult.resumen || 'No disponible',
        decision: parsedResult.decision || 'No identificada',
        numeroSentencia: null, // Los metadatos se extraen por código separado
        magistradoPonente: null, // Los metadatos se extraen por código separado
        salaRevision: null, // Los metadatos se extraen por código separado
        expediente: null, // Los metadatos se extraen por código separado
        fragmentosAnalizados: [
          fragments.introduccion.substring(0, 200),
          fragments.considerandos.substring(0, 300),
          fragments.resuelve.substring(0, 200)
        ],
        modeloUsado: 'gpt-4o-mini',
        confidencia: 0.9 // Alta confianza para análisis conceptual enfocado
      };

    } catch (error) {
      logger.error(`❌ Error con OpenAI: ${error}`);
      return null;
    }
  }

  /**
   * Análisis con Google Gemini
   */
  private async analyzeWithGemini(
    fragments: FragmentSelection,
    documentTitle: string
  ): Promise<DocumentAnalysis | null> {
    try {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(this.geminiApiKey!);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

      const prompt = this.buildAnalysisPrompt(fragments, documentTitle);

      logger.info('🔍 Enviando análisis a Google Gemini...');

      const result = await model.generateContent([prompt]);
      const response = await result.response;
      const text = response.text();

      if (!text) {
        logger.error('❌ Gemini no devolvió respuesta');
        return null;
      }

      // Intentar parsear como JSON
      let parsedResult;
      try {
        // Limpiar la respuesta por si tiene caracteres extra
        const cleanedText = text.replace(/```json\s*|\s*```/g, '').trim();
        parsedResult = JSON.parse(cleanedText);
      } catch (parseError) {
        logger.warn('⚠️  Respuesta de Gemini no es JSON válido, parseando manualmente');
        
        // Fallback parsing manual simplificado
        parsedResult = {
          tema_principal: this.extractFromText(text, /tema principal:?\s*([^\n]+)/i),
          resumen: this.extractFromText(text, /resumen:?\s*([^\n]+)/i),
          decision: this.extractDecisionFromText(text)
        };
      }

      return {
        temaPrincipal: parsedResult.tema_principal || 'No identificado',
        resumenIA: parsedResult.resumen || 'No disponible',
        decision: parsedResult.decision || 'No identificada',
        numeroSentencia: null, // Los metadatos se extraen por código separado
        magistradoPonente: null, // Los metadatos se extraen por código separado
        salaRevision: null, // Los metadatos se extraen por código separado
        expediente: null, // Los metadatos se extraen por código separado
        fragmentosAnalizados: [
          fragments.introduccion.substring(0, 200),
          fragments.considerandos.substring(0, 300),
          fragments.resuelve.substring(0, 200)
        ],
        modeloUsado: 'gemini-2.5-flash',
        confidencia: 0.9 // Alta confianza para análisis conceptual enfocado
      };

    } catch (error) {
      logger.error(`❌ Error con Gemini: ${error}`);
      return null;
    }
  }

  /**
   * Construir prompt de análisis optimizado
   */
  private buildAnalysisPrompt(fragments: FragmentSelection, documentTitle: string): string {
    return `
**Título del documento**: ${documentTitle}

**Fragmentos clave de la sentencia**:

**INTRODUCCIÓN Y DATOS BÁSICOS**:
${fragments.introduccion}

**CONSIDERACIONES Y FUNDAMENTOS**:
${fragments.considerandos}

**PARTE RESOLUTIVA**:
${fragments.resuelve}

---

**Instrucciones para el análisis:**

1. **Análisis del tema principal:** Identifica el tema central y la naturaleza del caso. El tema debe ser una descripción de no más de 20 palabras.
   * **Ejemplo de respuesta:** "Protección del derecho a la salud de un niño indígena en estado de abandono."

2. **Resumen concreto:** Crea un resumen narrativo y conciso de los hechos, las partes involucradas y las consideraciones de la corte. El resumen debe tener un máximo de 150 palabras.
   * **Puntos clave a incluir:**
     * Identidad de las partes (demandante y demandado).
     * Hechos relevantes que llevaron a la disputa.
     * Diagnóstico o situación de la persona afectada.
     * Razones de la corte para tomar su decisión.

3. **Resumen de la decisión y parte resolutiva:** Elabora un resumen concreto y detallado de la parte resolutiva de la sentencia. Debe incluir:
   * La decisión principal adoptada por la Corte (conceder, negar, declarar exequible, etc.)
   * Las órdenes específicas emitidas por la Corte a las entidades involucradas
   * Los plazos establecidos para el cumplimiento (si aplica)
   * Las medidas de seguimiento ordenadas (si aplica)
   * El alcance y limitaciones de la decisión
   
   **Formato requerido:** Resumen narrativo de máximo 120 palabras que explique QUÉ decidió la Corte y QUÉ órdenes específicas emitió. No uses solo palabras como "CONCEDE" o "NIEGA", sino explica detalladamente las resoluciones adoptadas.

**FORMATO DE RESPUESTA** (Solo JSON, sin comentarios):
{
  "tema_principal": "Tema central del caso en máximo 20 palabras",
  "resumen": "Resumen narrativo de máximo 150 palabras incluyendo hechos, partes y consideraciones de la corte",
  "decision": "Resumen detallado de la parte resolutiva en máximo 120 palabras explicando qué decidió la Corte y qué órdenes específicas emitió"
}

**IMPORTANTE**: 
- Responde ÚNICAMENTE el JSON, sin texto adicional
- No agregues campos que no se soliciten
- Mantén los límites de palabras especificados
`;
  }

  /**
   * Extraer texto usando regex (fallback para respuestas no JSON)
   */
  private extractFromText(text: string, regex: RegExp): string {
    const match = text.match(regex);
    return match ? match[1].trim() : 'No identificado';
  }

  /**
   * Extraer decisión con patrones específicos para Corte Constitucional
   */
  private extractDecisionFromText(text: string): string {
    const lowerText = text.toLowerCase();
    
    // Patrones para decisiones INHIBIDAS (más común en C-sentencias)
    if (lowerText.includes('inhibida') || lowerText.includes('se inhibe') || 
        lowerText.includes('declarar inhibida') || lowerText.includes('inhibirse')) {
      return 'INHIBIDA';
    }
    
    // Patrones para otras decisiones comunes
    if (lowerText.includes('exequible condicionado') || lowerText.includes('condicionalmente exequible')) {
      return 'EXEQUIBLE CONDICIONADO';
    }
    
    if (lowerText.includes('inexequible') || lowerText.includes('inconstitucional')) {
      return 'INEXEQUIBLE';
    }
    
    if (lowerText.includes('exequible')) {
      return 'EXEQUIBLE';
    }
    
    if (lowerText.includes('concede') && lowerText.includes('tutela')) {
      return 'CONCEDE LA TUTELA';
    }
    
    if (lowerText.includes('niega') && lowerText.includes('tutela')) {
      return 'NIEGA LA TUTELA';
    }
    
    if (lowerText.includes('inadmite')) {
      return 'INADMITE';
    }
    
    if (lowerText.includes('unifica')) {
      return 'UNIFICA JURISPRUDENCIA';
    }
    
    // Fallback con regex general
    const match = text.match(/decisión:?\s*([^\n]+)/i);
    return match ? match[1].trim() : 'No identificada';
  }

  /**
   * Verificar disponibilidad de servicios de IA
   */
  public getAvailableModels(): string[] {
    const models = [];
    if (this.openAiApiKey) models.push('openai');
    if (this.geminiApiKey) models.push('gemini');
    return models;
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
   * Extraer texto de contenido DOCX binario
   */
  private async extractTextFromDocxContent(content: string, filename: string) {
    try {
      // Convertir string a buffer (asumiendo que es contenido binario)
      const buffer = Buffer.from(content, 'binary');
      
      // Verificar que sea realmente un archivo DOCX
      if (!DocumentTextExtractor.isDocxBuffer(buffer)) {
        logger.warn(`⚠️  Contenido de ${filename} no parece ser DOCX válido`);
        return null;
      }

      // Extraer texto usando el DocumentTextExtractor
      return await documentTextExtractor.extractFromBuffer(buffer, filename);
    } catch (error) {
      logger.error(`❌ Error extrayendo texto de ${filename}:`, error);
      return null;
    }
  }

  /**
   * Construir texto unificado a partir del contenido extraído
   */
  private buildTextFromExtractedContent(extractedContent: any): string {
    const { structuredContent } = extractedContent;
    
    // Construir texto combinando las secciones estructuradas
    const sections = [];
    
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
      // Patrones más específicos para expedientes válidos
      /expediente[:\s]*\n?\s*([A-Z]-\d{1,2}[.,]?\d{3,4})\s*\.?(?:\s|$|,|\n)/im,
      /exp\.[\s:]*([A-Z]-\d{1,2}[.,]?\d{3,4})\s*\.?(?:\s|$|,|\n)/im,
      /radicaci[oó]n[:\s]*([A-Z]-\d{1,2}[.,]?\d{3,4})\s*\.?(?:\s|$|,|\n)/im,
      // Patrón para expedientes con formato T-########
      /expediente[:\s]*\n?\s*([T]-\d{6,8})\s*\.?(?:\s|$|,|\n)/im,
      // Patrón de respaldo más general
      /expediente[:\s]*\n?\s*([A-Z]-[\d.]{3,10})\s*\.?(?:\s|$|,|\n)/im
    ];
    
    for (const pattern of expedientePatterns) {
      const match = content.match(pattern);
      if (match) {
        let expediente = match[1].trim().replace(/\.$/, ''); // Eliminar punto final
        // Normalizar separadores de miles (punto a coma si es necesario)
        if (expediente.includes('.') && expediente.match(/\d\.\d{3}/)) {
          // Solo si parece ser separador de miles, no punto decimal
          // Ejemplo: D-15.479 -> mantener; D-15.4 -> mantener
        }
        
        // Validar formato de expediente (letra-números con posibles puntos/comas)
        if (/^[A-Z]-[\d.,]{1,10}$/.test(expediente) && expediente.length <= 15) {
          metadata.expediente = expediente;
          logger.info(`🔧 Regex extrajo expediente: "${metadata.expediente}"`);
          break;
        } else {
          logger.warn(`⚠️ Regex descartó expediente inválido: "${expediente}"`);
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
   * Analizar documento desde archivo físico DOCX
   */
  async analyzeDocumentFromFile(
    filePath: string,
    documentTitle: string,
    model?: 'openai' | 'gemini'
  ): Promise<DocumentAnalysis | null> {
    try {
      logger.info(`📁 Analizando documento desde archivo: ${filePath}`);

      // Verificar si es archivo DOCX
      if (!DocumentTextExtractor.isDocxFile(filePath)) {
        logger.warn(`⚠️  ${filePath} no parece ser un archivo DOCX válido`);
        
        // Intentar leer como texto plano
        const textContent = fs.readFileSync(filePath, 'utf8');
        return await this.analyzeDocument(textContent, documentTitle, model);
      }

      // Extraer texto del archivo DOCX
      const extractedContent = await documentTextExtractor.extractFromDocxFile(filePath);

      if (!extractedContent) {
        logger.error(`❌ No se pudo extraer contenido de ${filePath}`);
        return null;
      }

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

      // Realizar análisis directo con las secciones sin doble extracción
      let analysis: DocumentAnalysis | null = null;

      if (model === 'openai' && this.openAiApiKey) {
        analysis = await this.analyzeWithOpenAI(fragments, documentTitle);
      } else if (model === 'gemini' && this.geminiApiKey) {
        analysis = await this.analyzeWithGemini(fragments, documentTitle);
      } else {
        // Usar modelo por defecto
        if (this.defaultModel === 'openai' && this.openAiApiKey) {
          analysis = await this.analyzeWithOpenAI(fragments, documentTitle);
        } else if (this.defaultModel === 'gemini' && this.geminiApiKey) {
          analysis = await this.analyzeWithGemini(fragments, documentTitle);
        }
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
}

// Instancia singleton del servicio
export const aiAnalysisService = new AiAnalysisService();