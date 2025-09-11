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

      // 1. Preparar contenido para análisis
      let processedContent = documentContent;
      
      // Verificar si es contenido binario DOCX y extraer texto
      if (this.isLikelyDocxContent(documentContent)) {
        logger.info('📄 Detectado contenido DOCX binario, extrayendo texto...');
        
        const extractedContent = await this.extractTextFromDocxContent(documentContent, documentTitle);
        if (extractedContent) {
          processedContent = this.buildTextFromExtractedContent(extractedContent);
          logger.info(`✅ Texto extraído exitosamente: ${processedContent.length} caracteres`);
        } else {
          logger.error('❌ No se pudo extraer texto del contenido DOCX');
          return null;
        }
      }

      // 🎯 STEP 1: Extraer metadatos estructurales con regex (pre-IA)
      const regexMetadata = this.extractMetadataWithRegex(processedContent, documentTitle);
      logger.info(`📊 Metadatos regex extraídos: Magistrado: ${regexMetadata.magistradoPonente || 'N/A'}, Expediente: ${regexMetadata.expediente || 'N/A'}, Sentencia: ${regexMetadata.numeroSentencia || 'N/A'}`);

      // 2. Seleccionar fragmentos clave
      const fragments = await this.selectKeyFragments(processedContent);
      
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
      const normalizedContent = content.toLowerCase();

      // Patrones para identificar secciones importantes
      const patterns = {
        // Encabezado con información estructural
        encabezado: /(?:república\s+de\s+colombia|corte\s+constitucional|sentencia\s+[tc]-\d|expediente|(?:magistrado|magistrada)\s+ponente)/i,
        introduccion: /(?:en\s+la\s+ciudad\s+de|la\s+corte\s+constitucional|sala\s+plena)/i,
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

      // Dividir el contenido en líneas para capturar mejor el encabezado
      const lines = content.split('\n').map(line => line.trim()).filter(line => line.length > 0);
      const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 20);

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

        // Buscar parte resolutiva
        if (!resuelveFound && patterns.resuelve.test(paragraphLower)) {
          resuelveFound = true;
        }

        if (resuelveFound && fragments.resuelve.length < 1000) {
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
        logger.warn('⚠️  Parte resolutiva corta, usando contenido final');
        const finalPart = paragraphs.slice(-3).join('\n\n');
        fragments.resuelve = finalPart.substring(0, 1000);
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

      // Función helper para limpiar respuestas "no disponible" - Mejorada para C-223/2025
      const cleanField = (value: string | null | undefined): string | null => {
        if (!value) return null;
        
        const trimmed = value.trim();
        const lower = trimmed.toLowerCase();
        
        // Patrones que indican "no encontrado"
        if (lower === 'no disponible' || 
            lower === 'no identificado' ||
            lower === 'no especificado' ||
            lower === 'no se encuentra' ||
            lower === 'n/a' ||
            lower === 'null' ||
            lower === 'undefined' ||
            trimmed.length < 2) {
          return null;
        }
        
        // Limpiar puntos finales innecesarios pero conservar el contenido
        return trimmed.replace(/\.$/, '');
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
          magistrado_ponente: this.extractFromText(text, /(?:magistrado|magistrada).*ponente:?\s*([^\n.,]+?)(?:[.,\n]|$)/i),
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
Analiza la siguiente sentencia judicial colombiana y extrae la información solicitada. Responde en formato JSON válido.

**Título del documento**: ${documentTitle}

**Fragmentos clave de la sentencia**:

**INTRODUCCIÓN Y DATOS BÁSICOS**:
${fragments.introduccion}

**CONSIDERACIONES Y FUNDAMENTOS**:
${fragments.considerandos}

**PARTE RESOLUTIVA**:
${fragments.resuelve}

**INSTRUCCIONES DE EXTRACCIÓN**:
1. Identifica el TEMA PRINCIPAL de la sentencia (materia jurídica central)
2. Redacta un RESUMEN conciso de máximo 200 palabras
3. Identifica la DECISIÓN final del tribunal (estimatoria, desestimatoria, exequibilidad, etc.)

4. **EXTRACCIÓN ESTRUCTURAL ESPECÍFICA** - Busca estos campos exactos en el documento:

   **NÚMERO DE SENTENCIA**: 
   - Busca patrones como: "SENTENCIA T-123/2025", "C-456/2025", "SU-789/2025"
   - También: "Sentencia T-123 de 2025", "C-456 de 2025"
   - Extrae solo el código: "T-123/2025", "C-456/2025", etc.

   **MAGISTRADO PONENTE**:
   - Busca líneas como: "Magistrado ponente: [NOMBRE]", "Magistrada ponente: [NOMBRE]", "M.P.: [NOMBRE]"
   - También: "Magistrado Sustanciador:", "Magistrada Sustanciadora:", "Ponente:", "Magistrado(a) Ponente"
   - IMPORTANTE: Puede ser masculino O femenino (Magistrado/Magistrada)
   - Extrae el nombre completo exactamente como aparece, incluyendo puntos finales

   **SALA DE REVISIÓN**:
   - Busca: "Sala Primera", "Sala Segunda", "Sala Tercera", "Sala Plena"
   - También: "-Sala Primera-", "Sala Primera de Revisión", "Sala Plena de la Corte"
   - Mantén el formato encontrado: "Sala Primera", "Sala Plena", etc.

   **EXPEDIENTE**:
   - Busca: "Expediente: [CÓDIGO]", "Exp.: [CÓDIGO]", "Expediente No. [CÓDIGO]"
   - Patrones típicos: "D-15.479", "D-15.207", "T-1234567", "E-123", etc.
   - IMPORTANTE: Los códigos pueden tener múltiples números y puntos (D-15.207)
   - Puede tener punto final (ej: "Expediente: D-15.207.")
   - Extrae el código COMPLETO del expediente, SIN el punto final
   - EJEMPLO: "Expediente: D-15.207." → expediente: "D-15.207"

5. **REGLAS IMPORTANTES**:
   - Si encuentras la información, extráela exactamente como aparece en el documento
   - Si NO encuentras un campo específico, usa null (sin comillas en JSON)
   - NO inventes o deduzcas información que no esté explícita
   - Prioriza la información que aparece al inicio del documento (encabezado)

6. Asigna un nivel de CONFIDENCIA del análisis (0.1 a 1.0)

**FORMATO DE RESPUESTA** (JSON estricto):
{
  "tema_principal": "Tema o materia principal de la sentencia",
  "resumen": "Resumen conciso de los hechos, argumentos y conclusiones",
  "decision": "Decisión final del tribunal con el sentido del fallo",
  "numero_sentencia": "T-353/2025",
  "magistrado_ponente": "Jorge Enrique Ibáñez Najar",
  "sala_revision": "Sala Plena",
  "expediente": "D-15.479",
  "confidencia": 0.9
}

**EJEMPLOS DE EXTRACCIÓN CORRECTA**:
- Si ves "SENTENCIA C-278 de 2025" → numero_sentencia: "C-278/2025"
- Si ves "Magistrado ponente: Jorge Enrique Ibáñez Najar" → magistrado_ponente: "Jorge Enrique Ibáñez Najar"
- Si ves "Magistrada ponente: Natalia Ángel Cabo." → magistrado_ponente: "Natalia Ángel Cabo"
- Si ves "-Sala Plena-" → sala_revision: "Sala Plena"
- Si ves "Expediente: D-15.479" → expediente: "D-15.479"
- Si ves "Expediente: D-15.207." → expediente: "D-15.207"
- Si ves líneas múltiples como "Expediente:\n\nD-15.207." → expediente: "D-15.207"

CRÍTICO: Responde únicamente el JSON solicitado, sin comentarios adicionales.
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
    const metadata: Partial<DocumentAnalysis> = {};
    
    // 1. Magistrado Ponente
    const magistradoPatterns = [
      /(?:magistrado|magistrada)\s+ponente[:\s]*\n?\s*([^\n.,]+?)(?:[.,\n]|$)/im,
      /(?:magistrado|magistrada)\s+sustanciador[ao]?[:\s]*\n?\s*([^\n.,]+?)(?:[.,\n]|$)/im,
      /m\.p\.[\s:]*([^\n.,]+?)(?:[.,\n]|$)/im,
      // Mejorado: evitar "componente" y ser más específico
      /(?:^|\s)ponente[:\s]+([^\n.,]+?)(?:[.,\n]|$)/im
    ];
    
    for (const pattern of magistradoPatterns) {
      const match = content.match(pattern);
      if (match && match[1].trim().length > 2) {
        metadata.magistradoPonente = match[1].trim().replace(/\.$/, '');
        logger.info(`🔧 Regex extrajo magistrado: "${metadata.magistradoPonente}"`);
        break;
      }
    }
    
    // 2. Expediente
    const expedientePatterns = [
      /expediente[:\s]*\n?\s*([A-Z]-[\d.]+)(?:\.|$)/im,
      /exp\.[\s:]*([A-Z]-[\d.]+)(?:\.|$)/im,
      /radicaci[oó]n[:\s]*([A-Z]-[\d.]+)(?:\.|$)/im
    ];
    
    for (const pattern of expedientePatterns) {
      const match = content.match(pattern);
      if (match) {
        metadata.expediente = match[1].trim().replace(/\.$/, ''); // Eliminar punto final
        logger.info(`🔧 Regex extrajo expediente: "${metadata.expediente}"`);
        break;
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
    
    // 4. Sala de Revisión
    const salaPatterns = [
      /\b(sala\s+plena)\b/im,
      /\b(sala\s+primera)\b/im,
      /\b(sala\s+segunda)\b/im,
      /\b(sala\s+tercera)\b/im,
      /-\s*(sala\s+(?:plena|primera|segunda|tercera))\s*-/im
    ];
    
    for (const pattern of salaPatterns) {
      const match = content.match(pattern);
      if (match) {
        metadata.salaRevision = match[1].replace(/\b\w/g, l => l.toUpperCase()); // Title Case
        logger.info(`🔧 Regex extrajo sala: "${metadata.salaRevision}"`);
        break;
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

      // Construir texto para análisis
      const textContent = this.buildTextFromExtractedContent(extractedContent);
      
      // Realizar análisis de IA
      const analysis = await this.analyzeDocument(textContent, documentTitle, model);
      
      if (analysis) {
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