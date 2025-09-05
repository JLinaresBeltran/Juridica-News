/**
 * Servicio de Análisis de IA para Sentencias Judiciales
 * Integra OpenAI GPT-4 Mini y Google Gemini para análisis automático
 */

import { logger } from '@/utils/logger';

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
   * Analizar documento completo con IA
   */
  async analyzeDocument(
    documentContent: string,
    documentTitle: string,
    model?: 'openai' | 'gemini'
  ): Promise<DocumentAnalysis | null> {
    try {
      const modelToUse = model || this.defaultModel;
      
      logger.info(`🔍 Iniciando análisis de IA: "${documentTitle}" con ${modelToUse}`);

      // 1. Seleccionar fragmentos clave
      const fragments = await this.selectKeyFragments(documentContent);
      
      if (!fragments) {
        logger.error('❌ No se pudieron extraer fragmentos del documento');
        return null;
      }

      // 2. Realizar análisis con el modelo seleccionado
      let analysis: DocumentAnalysis | null = null;
      
      if (modelToUse === 'openai' && this.openAiApiKey) {
        analysis = await this.analyzeWithOpenAI(fragments, documentTitle);
      } else if (modelToUse === 'gemini' && this.geminiApiKey) {
        analysis = await this.analyzeWithGemini(fragments, documentTitle);
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
      const normalizedContent = content.toLowerCase();

      // Patrones para identificar secciones importantes
      const patterns = {
        introduccion: /(?:en\s+la\s+ciudad\s+de|la\s+corte\s+constitucional|sala\s+plena|magistrado\s+ponente|expediente)/i,
        antecedentes: /(?:antecedentes|i\.\s*antecedentes|1\.\s*antecedentes)/i,
        considerandos: /(?:consideraciones|considerandos|ii\.\s*consideraciones|2\.\s*consideraciones|fundamentos\s+jurídicos)/i,
        resuelve: /(?:resuelve|decide|falla|iii\.\s*decisión|3\.\s*decisión)/i,
        ratioDecidendi: /(?:ratio\s+decidendi|fundamento\s+central|tesis\s+principal)/i
      };

      const fragments: FragmentSelection = {
        introduccion: '',
        considerandos: '',
        resuelve: '',
        otros: []
      };

      // Dividir el contenido en párrafos
      const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 50);

      let introduccionFound = false;
      let considerandosFound = false;
      let resuelveFound = false;

      for (const paragraph of paragraphs) {
        const paragraphLower = paragraph.toLowerCase();

        // Buscar introducción (primeros párrafos relevantes)
        if (!introduccionFound && patterns.introduccion.test(paragraphLower)) {
          fragments.introduccion += paragraph + '\n\n';
          if (fragments.introduccion.length > 1500) introduccionFound = true;
        }

        // Buscar considerandos (parte central de la sentencia)
        if (!considerandosFound && patterns.considerandos.test(paragraphLower)) {
          considerandosFound = true;
        }
        
        if (considerandosFound && !resuelveFound) {
          fragments.considerandos += paragraph + '\n\n';
          if (fragments.considerandos.length > 3000) considerandosFound = false; // Limitar tamaño
        }

        // Buscar parte resolutiva
        if (!resuelveFound && patterns.resuelve.test(paragraphLower)) {
          resuelveFound = true;
        }

        if (resuelveFound) {
          fragments.resuelve += paragraph + '\n\n';
          if (fragments.resuelve.length > 1000) break; // Limitar la parte resolutiva
        }

        // Capturar otros fragmentos relevantes
        if (patterns.ratioDecidendi.test(paragraphLower) && paragraph.length > 100) {
          fragments.otros.push(paragraph);
        }
      }

      // Validar que se extrajeron fragmentos mínimos
      const totalContent = fragments.introduccion + fragments.considerandos + fragments.resuelve;
      if (totalContent.length < 500) {
        logger.warn('⚠️  Fragmentos extraídos muy cortos, usando contenido completo truncado');
        
        // Fallback: usar primeros y últimos párrafos
        const firstPart = paragraphs.slice(0, 5).join('\n\n');
        const lastPart = paragraphs.slice(-3).join('\n\n');
        
        fragments.introduccion = firstPart.substring(0, 1500);
        fragments.resuelve = lastPart.substring(0, 1000);
        fragments.considerandos = content.substring(1500, 4000);
      }

      logger.info(`📄 Fragmentos extraídos: ${fragments.introduccion.length + fragments.considerandos.length + fragments.resuelve.length} caracteres`);

      return fragments;

    } catch (error) {
      logger.error(`❌ Error seleccionando fragmentos: ${error}`);
      return null;
    }
  }

  /**
   * Análisis con OpenAI GPT-4 Mini
   */
  private async analyzeWithOpenAI(
    fragments: FragmentSelection,
    documentTitle: string
  ): Promise<DocumentAnalysis | null> {
    try {
      const OpenAI = (await import('openai')).default;
      const openai = new OpenAI({
        apiKey: this.openAiApiKey
      });

      const prompt = this.buildAnalysisPrompt(fragments, documentTitle);

      logger.info('🔍 Enviando análisis a OpenAI GPT-4 Mini...');

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Eres un experto jurista especializado en análisis de sentencias judiciales colombianas. 
                     Tu tarea es analizar sentencias de la Corte Constitucional y extraer información clave.
                     Responde siempre en español y mantén un tono profesional y preciso.`
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

      const parsedResult = JSON.parse(result);

      // Función helper para limpiar respuestas "no disponible" 
      const cleanField = (value: string | null | undefined): string | null => {
        if (!value || value.toLowerCase().includes('no disponible') || 
            value.toLowerCase().includes('no identificado') ||
            value.toLowerCase().includes('no especificado') ||
            value.toLowerCase().includes('no se encuentra') ||
            value.trim().length < 3) {
          return null;
        }
        return value.trim();
      };

      return {
        temaPrincipal: parsedResult.tema_principal || 'No identificado',
        resumenIA: parsedResult.resumen || 'No disponible',
        decision: parsedResult.decision || 'No identificada',
        numeroSentencia: cleanField(parsedResult.numero_sentencia),
        magistradoPonente: cleanField(parsedResult.magistrado_ponente),
        salaRevision: cleanField(parsedResult.sala_revision),
        expediente: cleanField(parsedResult.expediente),
        fragmentosAnalizados: [
          fragments.introduccion.substring(0, 200),
          fragments.considerandos.substring(0, 300),
          fragments.resuelve.substring(0, 200)
        ],
        modeloUsado: 'gpt-4o-mini',
        confidencia: parsedResult.confidencia || 0.8
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
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

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
        
        // Fallback parsing manual
        parsedResult = {
          tema_principal: this.extractFromText(text, /tema principal:?\s*([^\n]+)/i),
          resumen: this.extractFromText(text, /resumen:?\s*([^\n]+)/i),
          decision: this.extractFromText(text, /decisión:?\s*([^\n]+)/i),
          numero_sentencia: this.extractFromText(text, /número.*sentencia:?\s*([^\n]+)/i),
          magistrado_ponente: this.extractFromText(text, /magistrado.*ponente:?\s*([^\n]+)/i),
          sala_revision: this.extractFromText(text, /sala.*revisión:?\s*([^\n]+)/i),
          expediente: this.extractFromText(text, /expediente:?\s*([^\n]+)/i),
          confidencia: 0.7
        };
      }

      return {
        temaPrincipal: parsedResult.tema_principal || 'No identificado',
        resumenIA: parsedResult.resumen || 'No disponible',
        decision: parsedResult.decision || 'No identificada',
        numeroSentencia: parsedResult.numero_sentencia || null,
        magistradoPonente: parsedResult.magistrado_ponente || null,
        salaRevision: parsedResult.sala_revision || null,
        expediente: parsedResult.expediente || null,
        fragmentosAnalizados: [
          fragments.introduccion.substring(0, 200),
          fragments.considerandos.substring(0, 300),
          fragments.resuelve.substring(0, 200)
        ],
        modeloUsado: 'gemini-1.5-flash',
        confidencia: parsedResult.confidencia || 0.7
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
Analiza la siguiente sentencia judicial y extrae la información solicitada. Responde en formato JSON válido.

**Título del documento**: ${documentTitle}

**Fragmentos clave de la sentencia**:

**INTRODUCCIÓN Y DATOS BÁSICOS**:
${fragments.introduccion}

**CONSIDERACIONES Y FUNDAMENTOS**:
${fragments.considerandos}

**PARTE RESOLUTIVA**:
${fragments.resuelve}

**INSTRUCCIONES**:
1. Identifica el TEMA PRINCIPAL de la sentencia (materia jurídica central)
2. Redacta un RESUMEN conciso de máximo 200 palabras
3. Identifica la DECISIÓN final del tribunal (estimatoria, desestimatoria, etc.)
4. Extrae INFORMACIÓN ESTRUCTURAL específica:
   - NÚMERO DE SENTENCIA: Busca patrones como "T-123/24", "C-456/25", etc.
   - MAGISTRADO PONENTE: Busca "Magistrado Ponente:", "M.P.:" o nombres después de estos términos
   - SALA DE REVISIÓN: Busca "Sala Primera", "Sala Segunda", "Sala Plena", etc.
   - EXPEDIENTE: Busca "Expediente", "Exp.", números de radicación
5. Si NO encuentras un campo específico, responde con null (no con texto explicativo)
6. Asigna un nivel de CONFIDENCIA del análisis (0.1 a 1.0)

**FORMATO DE RESPUESTA** (JSON):
{
  "tema_principal": "Tema o materia principal de la sentencia",
  "resumen": "Resumen conciso de los hechos, argumentos y conclusiones",
  "decision": "Decisión final del tribunal con el sentido del fallo",
  "numero_sentencia": "T-353/25 (o null si no se encuentra)",
  "magistrado_ponente": "Dr. Juan Carlos Henao Pérez (o null si no se encuentra)",
  "sala_revision": "Sala Segunda de Revisión (o null si no se encuentra)",
  "expediente": "T-1234567 (o null si no se encuentra)",
  "confidencia": 0.8
}

IMPORTANTE: Si no encuentras información específica, usa null en lugar de texto explicativo.

Importante: Responde únicamente el JSON solicitado, sin comentarios adicionales.
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
}

// Instancia singleton del servicio
export const aiAnalysisService = new AiAnalysisService();