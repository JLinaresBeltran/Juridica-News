/**
 * Interfaz para procesamiento de contenido
 *
 * PRINCIPIO BLACK BOX:
 * - DOCX, PDF, RTF: cada formato tiene su processor
 * - El orquestador solo conoce la interfaz, no la implementación
 */

/**
 * Estructura identificada del documento
 */
export interface DocumentStructure {
  introduccion: string          // Sección de introducción
  considerandos: string         // Consideraciones jurídicas
  resuelve: string              // Parte resolutiva
  otros: string[]               // Otros elementos relevantes
}

/**
 * Metadata del contenido extraído
 */
export interface ContentMetadata {
  hasStructure: boolean         // ¿Se detectó estructura legal?
  language: string              // Idioma detectado
  encoding?: string             // Codificación del texto
  warnings: string[]            // Advertencias durante extracción
}

/**
 * Contenido extraído de un documento
 */
export interface ExtractedContent {
  fullText: string              // Texto completo
  wordCount: number             // Cantidad de palabras
  extractionMethod: string      // Método usado (mammoth, pdf-parse, etc.)
  structuredContent: DocumentStructure
  metadata: ContentMetadata
}

export class ContentProcessingError extends Error {
  constructor(message: string, public override cause?: Error) {
    super(message)
    this.name = 'ContentProcessingError'
  }
}

export class UnsupportedFormatError extends ContentProcessingError {
  constructor(format: string) {
    super(`Unsupported format: ${format}`)
    this.name = 'UnsupportedFormatError'
  }
}

export interface IContentProcessor {
  /**
   * Formatos soportados por este processor
   */
  readonly supportedFormats: string[]

  /**
   * Extraer texto desde buffer binario
   *
   * @param buffer - Contenido binario del documento
   * @param filename - Nombre del archivo (para detectar formato)
   * @returns Contenido extraído
   * @throws ContentProcessingError si falla la extracción
   */
  extractText(buffer: Buffer, filename: string): Promise<ExtractedContent>

  /**
   * Generar resumen inteligente (optimizado para IA)
   *
   * @param fullText - Texto completo del documento
   * @param maxChars - Máximo de caracteres (default: 10000)
   * @returns Resumen optimizado
   */
  generateSummary(fullText: string, maxChars?: number): Promise<string>

  /**
   * Extraer estructura del documento
   *
   * @param text - Texto del documento
   * @returns Estructura identificada
   */
  extractStructure(text: string): Promise<DocumentStructure>

  /**
   * Verificar si puede procesar un archivo
   *
   * @param filename - Nombre del archivo
   * @returns true si puede procesar
   */
  canProcess(filename: string): boolean
}
