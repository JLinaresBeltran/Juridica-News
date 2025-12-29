/**
 * Proveedor de IA usando Google Gemini
 *
 * PRINCIPIO BLACK BOX:
 * - Implementa IAIProvider
 * - Encapsula toda la lógica específica de Gemini
 * - El servicio de análisis no conoce estos detalles
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger } from '@/utils/logger';
import {
  IAIProvider,
  DocumentFragments,
  AnalysisOptions,
  SummaryOptions,
  AnalysisResult,
  ProviderHealth,
  ProviderUsage,
  AIProviderError,
  AIQuotaExceededError,
  AIProviderUnavailableError
} from './IAIProvider';

export class GeminiProvider implements IAIProvider {
  readonly name = 'Gemini';
  private genAI: GoogleGenerativeAI;
  private requestsToday: number = 0;
  private tokensUsedToday: number = 0;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async analyzeDocument(
    fragments: DocumentFragments,
    options?: AnalysisOptions
  ): Promise<AnalysisResult> {
    try {
      const model = this.genAI.getGenerativeModel({
        model: 'gemini-2.0-flash-exp',
        generationConfig: {
          temperature: options?.temperature ?? 0.3,
          maxOutputTokens: options?.maxTokens || 1500,
        }
      });

      const prompt = this.buildAnalysisPrompt(fragments);

      logger.info('🔍 Enviando análisis a Google Gemini...');

      const result = await model.generateContent([prompt]);
      const response = await result.response;
      const text = response.text();

      if (!text) {
        throw new AIProviderError('Gemini no devolvió respuesta', this.name);
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

      // Actualizar estadísticas
      this.requestsToday++;

      return {
        temaPrincipal: parsedResult.tema_principal || 'No identificado',
        resumenIA: parsedResult.resumen || 'No disponible',
        decision: parsedResult.decision || 'No identificada',
        fragmentosAnalizados: [
          fragments.introduccion.substring(0, 200),
          fragments.considerandos.substring(0, 300),
          fragments.resuelve.substring(0, 200)
        ],
        modeloUsado: 'gemini-2.0-flash-exp',
        confidencia: 0.9,
        analyzedAt: new Date()
      };

    } catch (error: any) {
      // Manejo de errores específicos de Gemini
      if (error?.status === 429 || error?.message?.includes('quota')) {
        throw new AIQuotaExceededError(this.name);
      }
      if (error?.status === 503 || error?.message?.includes('unavailable')) {
        throw new AIProviderUnavailableError(this.name);
      }

      logger.error(`❌ Error con Gemini: ${error}`);
      throw new AIProviderError(`Error en análisis: ${error.message}`, this.name, error);
    }
  }

  async generateSummary(content: string, options: SummaryOptions): Promise<string> {
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

      const stylePrompts = {
        professional: 'Genera un resumen profesional y formal',
        academic: 'Genera un resumen académico y técnico',
        casual: 'Genera un resumen claro y fácil de entender'
      };

      const prompt = `${stylePrompts[options.style]} del siguiente texto jurídico en máximo ${options.maxWords} palabras.
Mantén la precisión legal y los términos técnicos importantes:

${content.substring(0, 3000)}`;

      const result = await model.generateContent([prompt]);
      const response = await result.response;
      const summary = response.text().trim();

      // Actualizar estadísticas
      this.requestsToday++;

      return summary;

    } catch (error: any) {
      logger.error(`❌ Error generando resumen con Gemini: ${error}`);
      throw new AIProviderError(`Error en resumen: ${error.message}`, this.name, error);
    }
  }

  async checkHealth(): Promise<ProviderHealth> {
    const start = Date.now();
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
      await model.generateContent(['test']);

      return {
        available: true,
        latency: Date.now() - start,
        errorRate: 0,
        lastCheck: new Date()
      };
    } catch (error: any) {
      return {
        available: false,
        latency: Date.now() - start,
        errorRate: 1,
        lastCheck: new Date(),
        message: error.message
      };
    }
  }

  async getUsage(): Promise<ProviderUsage> {
    return {
      requestsToday: this.requestsToday,
      tokensUsedToday: this.tokensUsedToday,
      quotaRemaining: -1 // No disponible directamente desde Gemini API
    };
  }

  /**
   * Construir prompt de análisis optimizado (mismo que OpenAI)
   */
  private buildAnalysisPrompt(fragments: DocumentFragments): string {
    return `
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
    return (match && match[1]) ? match[1].trim() : 'No identificado';
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
    return (match && match[1]) ? match[1].trim() : 'No identificada';
  }
}
