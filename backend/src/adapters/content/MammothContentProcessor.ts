/**
 * Implementación de IContentProcessor usando Mammoth.js
 *
 * PRINCIPIO BLACK BOX:
 * - Encapsula toda la lógica de extracción de texto DOCX
 * - Reemplaza DocumentTextExtractor con interfaz limpia
 * - Puede ser intercambiado por otro processor (PDF, RTF, etc.)
 */

import mammoth from 'mammoth'
import { logger } from '@/utils/logger'
import {
  IContentProcessor,
  ExtractedContent,
  DocumentStructure,
  ContentMetadata,
  ContentProcessingError,
  UnsupportedFormatError
} from './IContentProcessor'

export class MammothContentProcessor implements IContentProcessor {
  readonly supportedFormats = ['.docx', '.doc']

  /**
   * Extraer texto desde buffer binario DOCX
   */
  async extractText(buffer: Buffer, filename: string): Promise<ExtractedContent> {
    try {
      if (!this.canProcess(filename)) {
        throw new UnsupportedFormatError(this.getFileExtension(filename))
      }

      logger.info(`📄 Extrayendo texto con Mammoth: ${filename}`)

      // Extraer texto usando mammoth
      const result = await mammoth.extractRawText({ buffer })
      const fullText = result.value

      if (!fullText || fullText.length < 100) {
        throw new ContentProcessingError(
          `Texto extraído muy corto (${fullText?.length || 0} caracteres)`
        )
      }

      logger.info(`✅ Texto extraído exitosamente: ${fullText.length} caracteres`)

      // Extraer estructura del documento
      const structuredContent = await this.extractStructure(fullText)

      // Generar metadata
      const metadata: ContentMetadata = {
        hasStructure: this.hasJuridicalStructure(structuredContent),
        language: 'es',
        encoding: 'utf-8',
        warnings: []
      }

      const wordCount = this.countWords(fullText)

      logger.info(
        `📊 Extracción completada - Palabras: ${wordCount}, Estructura: ${metadata.hasStructure ? '✅' : '❌'}`
      )

      return {
        fullText,
        wordCount,
        extractionMethod: 'mammoth',
        structuredContent,
        metadata
      }
    } catch (error) {
      if (error instanceof ContentProcessingError) {
        throw error
      }
      throw new ContentProcessingError(
        `Error extrayendo texto de ${filename}`,
        error instanceof Error ? error : undefined
      )
    }
  }

  /**
   * Generar resumen inteligente optimizado para IA (≤10K caracteres)
   */
  async generateSummary(fullText: string, maxChars: number = 10000): Promise<string> {
    try {
      const structure = await this.extractStructure(fullText)

      // Estrategia de resumen inteligente con límites optimizados
      const summary = this.buildIntelligentSummary(structure, maxChars)

      logger.info(`📝 Resumen generado: ${summary.length}/${maxChars} caracteres`)

      return summary
    } catch (error) {
      throw new ContentProcessingError(
        'Error generando resumen',
        error instanceof Error ? error : undefined
      )
    }
  }

  /**
   * Extraer estructura jurídica del documento
   */
  async extractStructure(text: string): Promise<DocumentStructure> {
    try {
      const sections = {
        introduccion: '',
        considerandos: '',
        resuelve: '',
        otros: [] as string[]
      }

      // Normalizar el contenido
      const normalizedContent = text
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .replace(/\n\s*\n\s*\n/g, '\n\n')

      // Dividir en párrafos
      const allParagraphs = normalizedContent
        .split(/\n\s*\n/)
        .map(p => p.trim())
        .filter(p => p.length > 0)

      // Encontrar posición de RESUELVE para aplicar filtro diferente
      const resuelvePosition = normalizedContent.toLowerCase().indexOf('resuelve')
      const isInResuelveSection = (index: number) => {
        if (resuelvePosition === -1) return false

        let currentPos = 0
        for (let i = 0; i < index; i++) {
          const paragraph = allParagraphs[i]
          if (paragraph) {
            currentPos += paragraph.length + 2
          }
        }

        return currentPos >= resuelvePosition - 1000
      }

      // Aplicar filtro: párrafos largos (>50) EXCEPTO en sección RESUELVE (>10)
      const paragraphs = allParagraphs.filter((p, index) => {
        const minLength = isInResuelveSection(index) ? 10 : 50
        return p.length >= minLength
      })

      // Patrones para identificar secciones jurídicas
      const patterns = {
        introduccion: /(?:en\s+la\s+ciudad\s+de|la\s+corte\s+constitucional|sala\s+plena|(?:magistrado|magistrada)\s+ponente|expediente|radicación|demandante|demandado)/i,
        antecedentes: /(?:antecedentes|i\.\s*antecedentes|1\.\s*antecedentes|hechos\s+probados|síntesis\s+de\s+la\s+demanda)/i,
        consideraciones: /(?:consideraciones|considerandos|ii\.\s*consideraciones|2\.\s*consideraciones|fundamentos\s+jurídicos|análisis\s+constitucional|problema\s+jurídico)/i,
        decision: /(?:^|\n)[\s]*(?:(?:III|3)\.?\s*)?RESUELVE\s*[:\.]?[\s]*(?:\n|$)/im,
        ratioDecidendi: /(?:ratio\s+decidendi|fundamento\s+central|tesis\s+principal|doctrina\s+constitucional)/i
      }

      let currentSection: 'introduccion' | 'considerandos' | 'resuelve' | null = null
      let introduccionFound = false
      let consideracionesFound = false
      let decisionFound = false

      // Procesar párrafos y detectar secciones
      for (const paragraph of paragraphs) {
        const paragraphLower = paragraph.toLowerCase()

        // Detectar introducción
        if (!introduccionFound && patterns.introduccion.test(paragraphLower)) {
          currentSection = 'introduccion'
          introduccionFound = true
          sections.introduccion += paragraph + '\n\n'
          continue
        }

        // Detectar consideraciones
        if (
          !consideracionesFound &&
          (patterns.antecedentes.test(paragraphLower) ||
            patterns.consideraciones.test(paragraphLower))
        ) {
          currentSection = 'considerandos'
          consideracionesFound = true
          sections.considerandos += paragraph + '\n\n'
          continue
        }

        // Detectar parte resolutiva
        const isResuelvePattern = patterns.decision.test(paragraph)
        const isResuelveManual = /^[\s]*RESUELVE\s*[:\.]?[\s]*$/i.test(paragraph.trim())
        const isResuelveInLine = /\bRESUELVE\s*[:\.]?\s*$/im.test(paragraph)
        const isResuelveWithContext = /(?:corte|sala)[\s\S]*RESUELVE\s*[:\.]?\s*$/im.test(paragraph)

        if (
          !decisionFound &&
          (isResuelvePattern || isResuelveManual || isResuelveInLine || isResuelveWithContext)
        ) {
          currentSection = 'resuelve'
          decisionFound = true
          sections.resuelve += paragraph + '\n\n'
          continue
        }

        // Continuar agregando contenido a la sección actual
        if (currentSection === 'introduccion' && !consideracionesFound) {
          sections.introduccion += paragraph + '\n\n'
          if (sections.introduccion.length > 2000) {
            introduccionFound = true
            currentSection = null
          }
        } else if (currentSection === 'considerandos' && !decisionFound) {
          sections.considerandos += paragraph + '\n\n'
          if (sections.considerandos.length > 4000) {
            currentSection = null
          }
        } else if (currentSection === 'resuelve') {
          sections.resuelve += paragraph + '\n\n'
        }

        // Capturar contenido relevante adicional
        if (patterns.ratioDecidendi.test(paragraphLower) && paragraph.length > 150) {
          sections.otros.push(paragraph)
        }
      }

      // Fallback: buscar RESUELVE manualmente si no se encontró
      if (!decisionFound) {
        const resuelveIndex = normalizedContent.toLowerCase().indexOf('resuelve')

        if (resuelveIndex !== -1) {
          const resuelveContent = normalizedContent.substring(resuelveIndex)
          sections.resuelve = resuelveContent
          logger.info(`✅ RESUELVE extraído directamente: ${sections.resuelve.length} caracteres`)
          decisionFound = true
        }
      }

      // Fallback final: distribución por posición si no hay estructura
      if (!introduccionFound && !consideracionesFound && !decisionFound) {
        logger.warn('⚠️  No se detectó estructura jurídica, usando distribución por posición')

        const firstPart = paragraphs.slice(0, Math.ceil(paragraphs.length * 0.2))
        const middlePart = paragraphs.slice(
          Math.ceil(paragraphs.length * 0.2),
          Math.ceil(paragraphs.length * 0.8)
        )
        const lastPart = paragraphs.slice(Math.ceil(paragraphs.length * 0.8))

        sections.introduccion = firstPart.join('\n\n').substring(0, 2000)
        sections.considerandos = middlePart.join('\n\n').substring(0, 4000)
        sections.resuelve = lastPart.join('\n\n')
      }

      // Limpiar secciones vacías
      sections.introduccion = sections.introduccion.trim()
      sections.considerandos = sections.considerandos.trim()
      sections.resuelve = sections.resuelve.trim()

      logger.info(
        `📋 Secciones extraídas - Intro: ${sections.introduccion.length}ch, Considerandos: ${sections.considerandos.length}ch, Resuelve: ${sections.resuelve.length}ch`
      )

      return sections
    } catch (error) {
      logger.error('❌ Error extrayendo estructura:', error)

      // Fallback: dividir en partes iguales
      const words = text.split(/\s+/)
      const third = Math.ceil(words.length / 3)

      return {
        introduccion: words.slice(0, third).join(' ').substring(0, 2000),
        considerandos: words.slice(third, third * 2).join(' ').substring(0, 4000),
        resuelve: words.slice(third * 2).join(' '),
        otros: []
      }
    }
  }

  /**
   * Verificar si puede procesar un archivo
   */
  canProcess(filename: string): boolean {
    const ext = this.getFileExtension(filename)
    return this.supportedFormats.includes(ext)
  }

  // --- Métodos privados auxiliares ---

  /**
   * Construir resumen inteligente optimizado para IA
   */
  private buildIntelligentSummary(structure: DocumentStructure, maxChars: number): string {
    const parts: string[] = []
    let currentLength = 0

    // Distribución de espacio optimizada
    const limits = {
      introduccion: Math.min(2000, Math.floor(maxChars * 0.2)),
      considerandos: Math.min(4000, Math.floor(maxChars * 0.5)),
      resuelve: Math.min(2000, Math.floor(maxChars * 0.25))
    }

    // Agregar introducción
    if (structure.introduccion) {
      const intro = this.truncateText(structure.introduccion, limits.introduccion)
      parts.push(`=== INTRODUCCIÓN ===\n${intro}`)
      currentLength += intro.length
    }

    // Agregar considerandos (más importante para análisis)
    if (structure.considerandos) {
      const considerandos = this.truncateText(structure.considerandos, limits.considerandos)
      parts.push(`\n\n=== CONSIDERACIONES ===\n${considerandos}`)
      currentLength += considerandos.length
    }

    // Agregar parte resolutiva
    if (structure.resuelve) {
      const resuelve = this.truncateText(structure.resuelve, limits.resuelve)
      parts.push(`\n\n=== RESUELVE ===\n${resuelve}`)
      currentLength += resuelve.length
    }

    const summary = parts.join('')

    // Si excede el límite, truncar proporcionalmente
    if (summary.length > maxChars) {
      return this.truncateText(summary, maxChars)
    }

    return summary
  }

  /**
   * Truncar texto inteligentemente (por oraciones completas)
   */
  private truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) {
      return text
    }

    const truncated = text.substring(0, maxLength)
    const lastPeriod = truncated.lastIndexOf('.')
    const lastNewline = truncated.lastIndexOf('\n')

    const cutPoint = Math.max(lastPeriod, lastNewline)

    return cutPoint > maxLength * 0.8 ? truncated.substring(0, cutPoint + 1) : truncated + '...'
  }

  /**
   * Verificar si tiene estructura jurídica reconocible
   */
  private hasJuridicalStructure(sections: DocumentStructure): boolean {
    const minLengthIntro = 200
    const minLengthConsiderandos = 500
    const minLengthResuelve = 100

    return (
      sections.introduccion.length >= minLengthIntro &&
      sections.considerandos.length >= minLengthConsiderandos &&
      sections.resuelve.length >= minLengthResuelve
    )
  }

  /**
   * Contar palabras en un texto
   */
  private countWords(text: string): number {
    return text.split(/\s+/).filter(word => word.length > 0).length
  }

  /**
   * Obtener extensión del archivo
   */
  private getFileExtension(filename: string): string {
    const match = filename.match(/\.[^.]+$/)
    return match?.[0]?.toLowerCase() || ''
  }
}
