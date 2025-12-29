/**
 * Interfaz para extracción de metadatos
 *
 * PRINCIPIO BLACK BOX:
 * - Regex, IA, híbrido: todas son estrategias intercambiables
 * - El servicio de análisis no conoce la estrategia usada
 */

import { DocumentType } from '../storage/IDocumentStorage'

/**
 * Contexto para extracción de metadatos
 */
export interface ExtractionContext {
  documentTitle: string         // Título del documento
  source: string                // Fuente del documento
  documentType?: DocumentType   // Tipo de documento si se conoce
  hints?: Record<string, any>   // Pistas adicionales
}

/**
 * Metadatos legales estructurados
 */
export interface DocumentMetadata {
  numeroSentencia?: string
  magistradoPonente?: string
  salaRevision?: string
  expediente?: string
  fechaPublicacion?: Date
  // Metadata adicional flexible
  [key: string]: any
}

/**
 * Resultado de validación
 */
export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
  warnings: string[]
  confidence: number            // 0-1
}

export interface ValidationError {
  field: string
  message: string
  suggestion?: string
}

/**
 * Estrategia de combinación de metadatos
 */
export type MergeStrategy =
  | 'first-wins'                // Primer valor no nulo gana
  | 'most-confident'            // Valor con mayor confianza
  | 'majority-vote'             // Votación mayoritaria
  | 'custom'                    // Lógica personalizada

export interface IMetadataExtractor {
  /**
   * Tipo de extractor
   */
  readonly type: 'regex' | 'ai' | 'hybrid'

  /**
   * Extraer metadatos de un documento
   *
   * @param content - Contenido del documento
   * @param context - Contexto adicional (título, etc.)
   * @returns Metadatos extraídos
   */
  extract(
    content: string,
    context: ExtractionContext
  ): Promise<DocumentMetadata>

  /**
   * Validar metadatos extraídos
   *
   * @param metadata - Metadatos a validar
   * @returns Resultado de validación
   */
  validate(metadata: DocumentMetadata): ValidationResult

  /**
   * Combinar metadatos de múltiples fuentes
   *
   * @param metadataList - Lista de metadatos a combinar
   * @param strategy - Estrategia de combinación
   * @returns Metadatos combinados
   */
  merge(
    metadataList: DocumentMetadata[],
    strategy: MergeStrategy
  ): DocumentMetadata
}
