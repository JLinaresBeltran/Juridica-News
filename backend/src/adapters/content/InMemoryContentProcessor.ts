/**
 * Implementación en memoria de IContentProcessor para testing
 *
 * PRINCIPIO BLACK BOX:
 * - Permite tests sin archivos reales ni dependencias de mammoth
 * - Respuestas predecibles y configurables
 * - Simula extracción de texto y estructura
 */

import {
  IContentProcessor,
  ExtractedContent,
  DocumentStructure,
  ContentMetadata,
  ContentProcessingError
} from './IContentProcessor'

export interface InMemoryContentProcessorConfig {
  shouldFail?: boolean
  customContent?: string
  customStructure?: DocumentStructure
  processingDelay?: number
}

export class InMemoryContentProcessor implements IContentProcessor {
  readonly supportedFormats = ['.docx', '.doc', '.txt']

  private config: InMemoryContentProcessorConfig

  constructor(config: InMemoryContentProcessorConfig = {}) {
    this.config = config
  }

  async extractText(buffer: Buffer, filename: string): Promise<ExtractedContent> {
    if (this.config.shouldFail) {
      throw new ContentProcessingError('Simulated extraction failure')
    }

    // Simular delay de procesamiento
    if (this.config.processingDelay) {
      await this.delay(this.config.processingDelay)
    }

    const fullText =
      this.config.customContent ||
      `Sentencia de prueba T-123/25

Magistrado Ponente: Juan Pérez García

ANTECEDENTES

La accionante solicita protección de sus derechos fundamentales...

CONSIDERACIONES

La Corte encuentra que...

RESUELVE

PRIMERO: Conceder el amparo solicitado.
SEGUNDO: Ordenar a la entidad demandada...`

    const structuredContent =
      this.config.customStructure || (await this.extractStructure(fullText))

    const metadata: ContentMetadata = {
      hasStructure: true,
      language: 'es',
      encoding: 'utf-8',
      warnings: []
    }

    return {
      fullText,
      wordCount: fullText.split(/\s+/).length,
      extractionMethod: 'in-memory-mock',
      structuredContent,
      metadata
    }
  }

  async generateSummary(fullText: string, maxChars: number = 10000): Promise<string> {
    if (this.config.shouldFail) {
      throw new ContentProcessingError('Simulated summary generation failure')
    }

    // Simular delay
    if (this.config.processingDelay) {
      await this.delay(this.config.processingDelay)
    }

    // Resumen simple: primeros N caracteres
    return fullText.substring(0, Math.min(maxChars, fullText.length))
  }

  async extractStructure(text: string): Promise<DocumentStructure> {
    if (this.config.shouldFail) {
      throw new ContentProcessingError('Simulated structure extraction failure')
    }

    // Simular delay
    if (this.config.processingDelay) {
      await this.delay(this.config.processingDelay)
    }

    // Si hay estructura personalizada, usarla
    if (this.config.customStructure) {
      return this.config.customStructure
    }

    // Estructura simulada básica
    const sections = text.split(/\n\n/)

    return {
      introduccion: sections[0] || 'Introducción de prueba',
      considerandos: sections.slice(1, -1).join('\n\n') || 'Consideraciones de prueba',
      resuelve: sections[sections.length - 1] || 'RESUELVE: Conceder tutela',
      otros: []
    }
  }

  canProcess(filename: string): boolean {
    const ext = filename.match(/\.[^.]+$/)?.[0]?.toLowerCase()
    return ext ? this.supportedFormats.includes(ext) : false
  }

  // --- Métodos de configuración para tests ---

  /**
   * Configurar el processor para simular fallo
   */
  setShouldFail(shouldFail: boolean): void {
    this.config.shouldFail = shouldFail
  }

  /**
   * Configurar contenido personalizado
   */
  setCustomContent(content: string): void {
    this.config.customContent = content
  }

  /**
   * Configurar estructura personalizada
   */
  setCustomStructure(structure: DocumentStructure): void {
    this.config.customStructure = structure
  }

  /**
   * Configurar delay de procesamiento
   */
  setProcessingDelay(delay: number): void {
    this.config.processingDelay = delay
  }

  // --- Métodos auxiliares ---

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// --- Factory functions para tests ---

export const createInMemoryContentProcessor = {
  /**
   * Processor normal que funciona correctamente
   */
  working: () => new InMemoryContentProcessor(),

  /**
   * Processor que falla al procesar
   */
  failing: () => new InMemoryContentProcessor({ shouldFail: true }),

  /**
   * Processor con contenido personalizado
   */
  withContent: (content: string) => new InMemoryContentProcessor({ customContent: content }),

  /**
   * Processor con estructura personalizada
   */
  withStructure: (structure: DocumentStructure) =>
    new InMemoryContentProcessor({ customStructure: structure }),

  /**
   * Processor con delay (para simular procesamiento lento)
   */
  withDelay: (delayMs: number) => new InMemoryContentProcessor({ processingDelay: delayMs }),

  /**
   * Processor con documento jurídico realista
   */
  realistic: () =>
    new InMemoryContentProcessor({
      customContent: `SENTENCIA T-123/25

En la ciudad de Bogotá D.C., a los veintinueve (29) días del mes de enero de dos mil veinticinco (2025)

Magistrado Ponente: JOSÉ FERNANDO REYES CUARTAS

Expediente T-9.876.543

La Sala Plena de la Corte Constitucional, integrada por los Magistrados...

I. ANTECEDENTES

El señor Juan Pérez García, actuando en nombre propio, interpuso acción de tutela contra la EPS Salud Total S.A., con el fin de obtener la protección de sus derechos fundamentales a la salud, la vida digna y la seguridad social.

Manifiesta el accionante que padece de diabetes tipo 2 desde hace cinco años y que requiere insulina de forma permanente. Sin embargo, la EPS ha negado de manera reiterada la autorización del medicamento prescrito por su médico tratante.

II. CONSIDERACIONES Y FUNDAMENTOS

La Corte Constitucional encuentra que el caso sometido a su consideración plantea el problema jurídico de determinar si la entidad demandada vulneró los derechos fundamentales del accionante al negar la autorización de un medicamento esencial para su tratamiento.

En primer lugar, es necesario recordar que el derecho a la salud tiene una doble connotación: como derecho fundamental autónomo y como derecho fundamental por conexidad. En el presente caso, la negación del medicamento afecta directamente el núcleo esencial del derecho a la salud.

En segundo lugar, la jurisprudencia constitucional ha sido clara en señalar que las EPS no pueden negar servicios o medicamentos prescritos por el médico tratante cuando estos son necesarios para garantizar una vida digna.

Por lo tanto, la Corte encuentra que la EPS Salud Total S.A. vulneró los derechos fundamentales del accionante al negar injustificadamente la autorización del medicamento prescrito.

III. RESUELVE

PRIMERO: CONCEDER el amparo de los derechos fundamentales a la salud, la vida digna y la seguridad social del señor Juan Pérez García.

SEGUNDO: ORDENAR a la EPS Salud Total S.A. que, dentro de las cuarenta y ocho (48) horas siguientes a la notificación de esta providencia, autorice y suministre el medicamento prescrito por el médico tratante.

TERCERO: Por Secretaría General, LÍBRESE la comunicación de que trata el artículo 36 del Decreto 2591 de 1991.

Notifíquese, comuníquese y cúmplase.

JOSÉ FERNANDO REYES CUARTAS
Magistrado Ponente`
    })
}
