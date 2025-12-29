/**
 * Proveedor de IA usando Anthropic Claude
 *
 * PRINCIPIO BLACK BOX:
 * - Implementa IAIProvider
 * - Encapsula toda la lógica específica de Claude
 * - El servicio de análisis no conoce estos detalles
 */

import Anthropic from '@anthropic-ai/sdk';
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

export class ClaudeProvider implements IAIProvider {
  readonly name = 'Claude';
  private client: Anthropic;
  private requestsToday: number = 0;
  private tokensUsedToday: number = 0;

  constructor(apiKey: string) {
    this.client = new Anthropic({
      apiKey,
      timeout: 120000, // 2 minutos de timeout
      maxRetries: 2
    });
  }

  async analyzeDocument(
    fragments: DocumentFragments,
    options?: AnalysisOptions
  ): Promise<AnalysisResult> {
    try {
      const prompt = this.buildAnalysisPrompt(fragments);

      logger.info('🔍 Enviando análisis a Anthropic Claude...');

      const response = await this.client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: options?.maxTokens || 1500,
        temperature: options?.temperature ?? 0.3,
        system: `Eres un asistente de IA experto en el análisis y la síntesis de sentencias de la Corte Constitucional de Colombia. Tu tarea es procesar el documento legal que te proporcionaré y extraer sus componentes más importantes de manera clara y estructurada. No agregues opiniones ni información que no esté explícitamente en el texto.

El rol del asistente es ser un analista legal de documentos y un sintetizador de información.

El objetivo es identificar los componentes clave de una sentencia judicial de la Corte Constitucional, independientemente de su tipo (T, SU, C, etc.). Se debe extraer la siguiente información de forma precisa y estructurada: los hechos, el problema jurídico, las consideraciones principales de la corte (la ratio decidendi) y, finalmente, la decisión o las órdenes finales. El objetivo es que esta información sea comprensible para cualquier persona, sin necesidad de ser un experto en derecho.`,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      const text = response.content[0]?.type === 'text' ? response.content[0].text : '';

      if (!text) {
        throw new AIProviderError('Claude no devolvió respuesta', this.name);
      }

      // Claude puede devolver texto o JSON, intentar parsear
      let parsedResult;
      try {
        const cleanedText = text.replace(/```json\s*|\s*```/g, '').trim();
        parsedResult = JSON.parse(cleanedText);
      } catch (parseError) {
        logger.warn('⚠️  Respuesta de Claude no es JSON válido, parseando manualmente');

        parsedResult = {
          tema_principal: this.extractFromText(text, /tema principal:?\s*([^\n]+)/i),
          resumen: this.extractFromText(text, /resumen:?\s*([^\n]+)/i),
          decision: this.extractDecisionFromText(text)
        };
      }

      // Actualizar estadísticas
      this.requestsToday++;
      this.tokensUsedToday += response.usage.input_tokens + response.usage.output_tokens;

      return {
        temaPrincipal: parsedResult.tema_principal || 'No identificado',
        resumenIA: parsedResult.resumen || 'No disponible',
        decision: parsedResult.decision || 'No identificada',
        fragmentosAnalizados: [
          fragments.introduccion.substring(0, 200),
          fragments.considerandos.substring(0, 300),
          fragments.resuelve.substring(0, 200)
        ],
        modeloUsado: 'claude-3-5-sonnet',
        confidencia: 0.95,
        analyzedAt: new Date()
      };

    } catch (error: any) {
      // Manejo de errores específicos de Claude
      if (error?.status === 429 || error?.message?.includes('quota')) {
        throw new AIQuotaExceededError(this.name);
      }
      if (error?.status === 503 || error?.message?.includes('unavailable')) {
        throw new AIProviderUnavailableError(this.name);
      }

      logger.error(`❌ Error con Claude: ${error}`);
      throw new AIProviderError(`Error en análisis: ${error.message}`, this.name, error);
    }
  }

  async generateSummary(content: string, options: SummaryOptions): Promise<string> {
    try {
      const stylePrompts = {
        professional: 'Genera un resumen profesional y formal',
        academic: 'Genera un resumen académico y técnico',
        casual: 'Genera un resumen claro y fácil de entender'
      };

      const prompt = `${stylePrompts[options.style]} del siguiente texto jurídico en máximo ${options.maxWords} palabras.
Mantén la precisión legal y los términos técnicos importantes:

${content.substring(0, 3000)}`;

      const response = await this.client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: Math.min(options.maxWords * 2, 500),
        temperature: 0.3,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      const textContent = response.content[0];
      const summary = (textContent?.type === 'text' ? textContent.text.trim() : '') || '';

      // Actualizar estadísticas
      this.requestsToday++;
      this.tokensUsedToday += response.usage.input_tokens + response.usage.output_tokens;

      return summary;

    } catch (error: any) {
      logger.error(`❌ Error generando resumen con Claude: ${error}`);
      throw new AIProviderError(`Error en resumen: ${error.message}`, this.name, error);
    }
  }

  async checkHealth(): Promise<ProviderHealth> {
    const start = Date.now();
    try {
      await this.client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 10,
        messages: [
          {
            role: 'user',
            content: 'test'
          }
        ]
      });

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
      quotaRemaining: -1 // No disponible directamente desde Claude API
    };
  }

  /**
   * Construir prompt de análisis optimizado
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
   * Extraer decisión con patrones específicos
   */
  private extractDecisionFromText(text: string): string {
    const lowerText = text.toLowerCase();

    if (lowerText.includes('inhibida') || lowerText.includes('se inhibe')) {
      return 'INHIBIDA';
    }
    if (lowerText.includes('exequible condicionado')) {
      return 'EXEQUIBLE CONDICIONADO';
    }
    if (lowerText.includes('inexequible')) {
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

    const match = text.match(/decisión:?\s*([^\n]+)/i);
    return (match && match[1]) ? match[1].trim() : 'No identificada';
  }
}
