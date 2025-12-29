/**
 * Interfaz para proveedores de IA
 *
 * PRINCIPIO BLACK BOX:
 * - OpenAI, Gemini, Claude, Mistral, LLMs locales: todos implementan esta interfaz
 * - El servicio de análisis NO conoce qué proveedor usa
 * - Cambiar proveedor = cambiar 1 línea de config
 */

/**
 * Fragmentos estructurados de un documento
 */
export interface DocumentFragments {
  introduccion: string          // Encabezado + introducción
  considerandos: string         // Consideraciones jurídicas
  resuelve: string              // Parte resolutiva
  otros?: string[]              // Otros fragmentos relevantes
}

/**
 * Opciones de análisis
 */
export interface AnalysisOptions {
  temperature?: number          // 0-1, creatividad del modelo
  maxTokens?: number            // Límite de tokens de respuesta
  language?: string             // Idioma de respuesta (default: 'es')
}

/**
 * Opciones de generación de resumen
 */
export interface SummaryOptions {
  maxWords: number              // Máximo de palabras
  style: 'professional' | 'academic' | 'casual'
  focusOn?: string[]            // Aspectos a enfatizar
}

/**
 * Resultado del análisis de IA sobre un documento legal
 */
export interface AnalysisResult {
  // Análisis Conceptual
  temaPrincipal: string         // Tema central (≤20 palabras)
  resumenIA: string             // Resumen narrativo (≤150 palabras)
  decision: string              // Resumen de la parte resolutiva (≤120 palabras)

  // Metadatos Estructurados (Complementarios)
  numeroSentencia?: string      // Extraído por IA o regex
  magistradoPonente?: string    // Extraído por IA o regex
  salaRevision?: string         // Extraído por IA o regex
  expediente?: string           // Extraído por IA o regex

  // Metadata del Análisis
  fragmentosAnalizados: string[] // Fragmentos de texto enviados a IA
  modeloUsado: string           // 'gpt-4o-mini', 'gemini-2.5-flash', etc.
  confidencia: number           // 0-1 (confianza del modelo)

  // Timestamp
  analyzedAt: Date              // Cuándo se realizó el análisis
}

/**
 * Estado de salud del proveedor
 */
export interface ProviderHealth {
  available: boolean            // ¿Está disponible?
  latency: number               // Latencia en ms
  errorRate: number             // Tasa de error (0-1)
  lastCheck: Date               // Última verificación
  message?: string              // Mensaje de estado
}

/**
 * Información de uso del proveedor
 */
export interface ProviderUsage {
  requestsToday: number
  tokensUsedToday: number
  quotaRemaining: number        // -1 si no aplica
  costEstimate?: number         // Costo estimado en USD
}

/**
 * Errores personalizados
 */
export class AIProviderError extends Error {
  constructor(
    message: string,
    public provider: string,
    public override cause?: Error
  ) {
    super(message)
    this.name = 'AIProviderError'
  }
}

export class AIQuotaExceededError extends AIProviderError {
  constructor(provider: string) {
    super(`Quota exceeded for provider: ${provider}`, provider)
    this.name = 'AIQuotaExceededError'
  }
}

export class AIProviderUnavailableError extends AIProviderError {
  constructor(provider: string) {
    super(`Provider unavailable: ${provider}`, provider)
    this.name = 'AIProviderUnavailableError'
  }
}

export interface IAIProvider {
  /**
   * Nombre del proveedor
   */
  readonly name: string

  /**
   * Analizar un documento legal
   *
   * @param fragments - Fragmentos estructurados del documento
   * @param options - Opciones de análisis
   * @returns Resultado del análisis
   * @throws AIProviderError si falla el análisis
   */
  analyzeDocument(
    fragments: DocumentFragments,
    options?: AnalysisOptions
  ): Promise<AnalysisResult>

  /**
   * Generar resumen de texto
   *
   * @param content - Contenido a resumir
   * @param options - Opciones de resumen
   * @returns Resumen generado
   */
  generateSummary(
    content: string,
    options: SummaryOptions
  ): Promise<string>

  /**
   * Verificar disponibilidad del proveedor
   *
   * @returns Estado de salud del proveedor
   */
  checkHealth(): Promise<ProviderHealth>

  /**
   * Obtener uso de cuota (si aplica)
   *
   * @returns Información de uso
   */
  getUsage(): Promise<ProviderUsage>
}
