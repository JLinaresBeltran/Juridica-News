/**
 * Implementación de IMetadataExtractor usando expresiones regulares
 *
 * PRINCIPIO BLACK BOX:
 * - Extrae metadatos jurídicos estructurados usando patrones regex
 * - Estrategia intercambiable (puede ser reemplazado por IA o híbrido)
 * - Validación automática de metadatos extraídos
 */

import { logger } from '@/utils/logger'
import {
  IMetadataExtractor,
  DocumentMetadata,
  ExtractionContext,
  ValidationResult,
  ValidationError,
  MergeStrategy
} from './IMetadataExtractor'

export class RegexMetadataExtractor implements IMetadataExtractor {
  readonly type = 'regex' as const

  /**
   * Extraer metadatos jurídicos usando expresiones regulares
   */
  async extract(content: string, context: ExtractionContext): Promise<DocumentMetadata> {
    try {
      logger.info(`🔍 Extrayendo metadatos con regex - Fuente: ${context.source}`)

      const metadata: DocumentMetadata = {}

      // Extraer número de sentencia
      const numeroSentencia = this.extractNumeroSentencia(content, context.documentTitle)
      if (numeroSentencia) metadata.numeroSentencia = numeroSentencia

      // Extraer magistrado ponente
      const magistradoPonente = this.extractMagistradoPonente(content)
      if (magistradoPonente) metadata.magistradoPonente = magistradoPonente

      // Extraer sala de revisión
      const salaRevision = this.extractSalaRevision(content)
      if (salaRevision) metadata.salaRevision = salaRevision

      // Extraer expediente
      const expediente = this.extractExpediente(content)
      if (expediente) metadata.expediente = expediente

      // Extraer fecha de publicación
      const fechaPublicacion = this.extractFechaPublicacion(content)
      if (fechaPublicacion) metadata.fechaPublicacion = fechaPublicacion

      // Log de extracción
      const extractedFields = Object.keys(metadata).filter(k => metadata[k] !== undefined)
      logger.info(`✅ Metadatos extraídos: ${extractedFields.join(', ')}`)

      return metadata
    } catch (error) {
      logger.error('❌ Error extrayendo metadatos:', error)
      return {}
    }
  }

  /**
   * Validar metadatos extraídos
   */
  validate(metadata: DocumentMetadata): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: string[] = []
    let confidence = 1.0

    // Validar número de sentencia
    if (metadata.numeroSentencia) {
      if (!this.isValidNumeroSentencia(metadata.numeroSentencia)) {
        errors.push({
          field: 'numeroSentencia',
          message: 'Formato de número de sentencia no reconocido',
          suggestion: 'Debe ser formato T-XXX/YY, C-XXX/YY, SU-XXX/YY o A-XXX/YY'
        })
        confidence -= 0.3
      }
    } else {
      warnings.push('Número de sentencia no encontrado')
      confidence -= 0.1
    }

    // Validar magistrado ponente
    if (metadata.magistradoPonente) {
      if (metadata.magistradoPonente.length < 5) {
        warnings.push('Nombre de magistrado ponente muy corto')
        confidence -= 0.05
      }
    } else {
      warnings.push('Magistrado ponente no encontrado')
      confidence -= 0.1
    }

    // Validar fecha de publicación
    if (metadata.fechaPublicacion) {
      const date = new Date(metadata.fechaPublicacion)
      const now = new Date()

      if (date > now) {
        errors.push({
          field: 'fechaPublicacion',
          message: 'Fecha de publicación en el futuro',
          suggestion: 'Verificar formato de fecha'
        })
        confidence -= 0.2
      }

      if (date < new Date('2000-01-01')) {
        warnings.push('Fecha de publicación anterior al año 2000')
        confidence -= 0.05
      }
    }

    const valid = errors.length === 0
    confidence = Math.max(0, Math.min(1, confidence))

    return {
      valid,
      errors,
      warnings,
      confidence
    }
  }

  /**
   * Combinar metadatos de múltiples fuentes
   */
  merge(metadataList: DocumentMetadata[], strategy: MergeStrategy): DocumentMetadata {
    if (metadataList.length === 0) {
      return {}
    }

    if (metadataList.length === 1) {
      return metadataList[0] || {}
    }

    switch (strategy) {
      case 'first-wins':
        return this.mergeFirstWins(metadataList)

      case 'most-confident':
        return this.mergeMostConfident(metadataList)

      case 'majority-vote':
        return this.mergeMajorityVote(metadataList)

      default:
        return this.mergeFirstWins(metadataList)
    }
  }

  // --- Métodos privados de extracción ---

  /**
   * Extraer número de sentencia (T-XXX/YY, C-XXX/YY, SU-XXX/YY, A-XXX/YY)
   */
  private extractNumeroSentencia(content: string, title: string): string | undefined {
    // Intentar extraer del título primero (más confiable)
    const titlePatterns = [
      /(?:Sentencia\s+)?([TCSA]U?-\d{1,4}\/\d{2,4})/i,
      /(?:AUTO|SENTENCIA)\s+No\.\s*([A-Z]+-\d{1,4}\/\d{2,4})/i
    ]

    for (const pattern of titlePatterns) {
      const match = title.match(pattern)
      if (match && match[1]) {
        return match[1].toUpperCase()
      }
    }

    // Intentar extraer del contenido
    const contentPatterns = [
      /(?:Sentencia|Auto)\s+([TCSA]U?-\d{1,4}\/\d{2,4})/i,
      /(?:Radicación|Expediente)\s+No\.\s*([A-Z]+-\d{1,4}\/\d{2,4})/i,
      /([TCSA]U?-\d{1,4}\/\d{2,4})/
    ]

    // Buscar en los primeros 2000 caracteres
    const firstPart = content.substring(0, 2000)

    for (const pattern of contentPatterns) {
      const match = firstPart.match(pattern)
      if (match && match[1]) {
        return match[1].toUpperCase()
      }
    }

    return undefined
  }

  /**
   * Extraer magistrado ponente
   */
  private extractMagistradoPonente(content: string): string | undefined {
    const patterns = [
      /(?:Magistrado|Magistrada)\s+Ponente\s*:?\s*([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)+)/i,
      /M\.\s*P\.\s*:?\s*([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)+)/i,
      /Ponente\s*:?\s*(?:Dr\.|Dra\.)?\s*([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)+)/i
    ]

    // Buscar en los primeros 3000 caracteres
    const firstPart = content.substring(0, 3000)

    for (const pattern of patterns) {
      const match = firstPart.match(pattern)
      if (match && match[1]) {
        return this.cleanName(match[1])
      }
    }

    return undefined
  }

  /**
   * Extraer sala de revisión
   */
  private extractSalaRevision(content: string): string | undefined {
    const patterns = [
      /Sala\s+(Primera|Segunda|Tercera|Cuarta|Quinta|Sexta|Séptima|Octava|Novena|Plena)\s+de\s+Revisión/i,
      /Sala\s+(Plena|de\s+Revisión)/i,
      /Sala\s+([A-Za-z\s]+)/i
    ]

    // Buscar en los primeros 3000 caracteres
    const firstPart = content.substring(0, 3000)

    for (const pattern of patterns) {
      const match = firstPart.match(pattern)
      if (match) {
        return match[0].trim()
      }
    }

    return undefined
  }

  /**
   * Extraer número de expediente
   *
   * Formatos colombianos comunes:
   * - Con puntos: T-10.543.253, 1.234.567
   * - Con guiones largos: AC-1234567, T-1234567890
   * - Alfanuméricos: ICC-123456
   *
   * IMPORTANTE: Excluir formatos de número de sentencia (T-XXX/YY)
   */
  private extractExpediente(content: string): string | undefined {
    // Buscar en los primeros 5000 caracteres para mayor cobertura
    const firstPart = content.substring(0, 5000)

    // Patrones ordenados de más específico a menos específico
    const patterns = [
      // 1. Expediente con puntos como separadores de miles (ej: T-10.543.253, 1.234.567.890)
      /Expediente\s+(?:No\.|Número|N[°º])?\s*:?\s*([A-Z]?-?\d{1,3}(?:\.\d{3})+)/i,

      // 2. Radicación con puntos (ej: 11001-02-03-000-2024-00001-00)
      /Radicación\s+(?:No\.|Número|N[°º])?\s*:?\s*(\d{5,}-\d{2}-\d{2}-\d{3}-\d{4}-\d{5}-\d{2})/i,

      // 3. Formato con múltiples guiones (ej: 11001-02-03-000-2024-00001)
      /Expediente\s+(?:No\.|Número|N[°º])?\s*:?\s*(\d{5,}(?:-\d{2,5}){3,})/i,

      // 4. Expediente largo sin puntos (ej: T10543253, 1234567890) - mínimo 7 dígitos
      /Expediente\s+(?:No\.|Número|N[°º])?\s*:?\s*([A-Z]?\d{7,})/i,

      // 5. Formato con prefijo y guión largo (ej: AC-1234567, ICC-123456)
      /Expediente\s+(?:No\.|Número|N[°º])?\s*:?\s*([A-Z]{1,3}-\d{5,})/i,

      // 6. Radicación con formato largo
      /Radicación\s+(?:No\.|Número|N[°º])?\s*:?\s*([A-Z]?-?\d{1,3}(?:\.\d{3})+)/i,

      // 7. Referencia con expediente
      /Referencia\s*:?\s+Expediente\s+([A-Z]?-?\d{1,3}(?:\.\d{3})+)/i,
    ]

    for (const pattern of patterns) {
      const match = firstPart.match(pattern)
      if (match && match[1]) {
        const expediente = match[1].trim()

        // Validar que NO sea un número de sentencia (formato T-XXX/YY o similar)
        if (/^[TCSA]U?-\d{1,4}\/\d{2,4}$/i.test(expediente)) {
          continue // Saltar este match, es un número de sentencia
        }

        // Validar que tenga longitud mínima razonable para un expediente
        if (expediente.replace(/[^0-9]/g, '').length >= 5) {
          return expediente
        }
      }
    }

    return undefined
  }

  /**
   * Extraer fecha de publicación
   */
  private extractFechaPublicacion(content: string): Date | undefined {
    const patterns = [
      // Formato: "Bogotá D.C., veintinueve (29) de enero de dos mil veinticinco (2025)"
      /\d{1,2}\s+de\s+(?:enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\s+de\s+(\d{4})/i,
      // Formato: "29 de enero de 2025"
      /(\d{1,2})\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\s+de\s+(\d{4})/i,
      // Formato: "2025-01-29"
      /(\d{4})-(\d{2})-(\d{2})/,
      // Formato: "29/01/2025"
      /(\d{1,2})\/(\d{1,2})\/(\d{4})/
    ]

    const monthNames: Record<string, number> = {
      enero: 0,
      febrero: 1,
      marzo: 2,
      abril: 3,
      mayo: 4,
      junio: 5,
      julio: 6,
      agosto: 7,
      septiembre: 8,
      octubre: 9,
      noviembre: 10,
      diciembre: 11
    }

    // Buscar en los primeros 2000 caracteres
    const firstPart = content.substring(0, 2000)

    for (const pattern of patterns) {
      const match = firstPart.match(pattern)
      if (match) {
        try {
          // Formato con mes en texto
          if (match[1] && match[2] && match[3]) {
            const monthIndex = monthNames[match[2].toLowerCase()]
            if (monthIndex !== undefined) {
              const day = parseInt(match[1])
              const year = parseInt(match[3])
              return new Date(year, monthIndex, day)
            }
          }

          // Formato ISO (YYYY-MM-DD)
          if (match[0] && match[0].includes('-')) {
            return new Date(match[0])
          }

          // Formato DD/MM/YYYY
          if (match[0] && match[0].includes('/') && match[1] && match[2] && match[3]) {
            const day = parseInt(match[1])
            const month = parseInt(match[2]) - 1
            const year = parseInt(match[3])
            return new Date(year, month, day)
          }
        } catch (error) {
          continue
        }
      }
    }

    return undefined
  }

  // --- Métodos privados de validación ---

  /**
   * Validar formato de número de sentencia
   */
  private isValidNumeroSentencia(numero: string): boolean {
    const pattern = /^[TCSA]U?-\d{1,4}\/\d{2,4}$/
    return pattern.test(numero)
  }

  /**
   * Limpiar nombre (eliminar espacios extras, etc.)
   */
  private cleanName(name: string): string {
    return name
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/\.$/, '')
  }

  // --- Métodos privados de merge ---

  /**
   * Estrategia: primer valor no nulo gana
   */
  private mergeFirstWins(metadataList: DocumentMetadata[]): DocumentMetadata {
    const merged: DocumentMetadata = {}

    for (const metadata of metadataList) {
      for (const key of Object.keys(metadata)) {
        const value = metadata[key]
        if (merged[key] === undefined && value !== undefined) {
          merged[key] = value
        }
      }
    }

    return merged
  }

  /**
   * Estrategia: valor con mayor confianza
   * (Requiere que cada metadata tenga un campo _confidence)
   */
  private mergeMostConfident(metadataList: DocumentMetadata[]): DocumentMetadata {
    const merged: DocumentMetadata = {}
    const confidenceMap: Record<string, number> = {}

    for (const metadata of metadataList) {
      const confidence = (metadata._confidence as number) || 0.5

      for (const key of Object.keys(metadata)) {
        if (key === '_confidence') continue

        const value = metadata[key]
        if (value !== undefined) {
          if (
            merged[key] === undefined ||
            (confidenceMap[key] || 0) < confidence
          ) {
            merged[key] = value
            confidenceMap[key] = confidence
          }
        }
      }
    }

    return merged
  }

  /**
   * Estrategia: votación mayoritaria
   */
  private mergeMajorityVote(metadataList: DocumentMetadata[]): DocumentMetadata {
    const merged: DocumentMetadata = {}
    const votes: Record<string, Record<string, number>> = {}

    // Contar votos para cada campo
    for (const metadata of metadataList) {
      for (const key of Object.keys(metadata)) {
        const value = metadata[key]
        if (value === undefined) continue

        if (!votes[key]) {
          votes[key] = {}
        }

        const valueStr = String(value)
        votes[key][valueStr] = (votes[key][valueStr] || 0) + 1
      }
    }

    // Seleccionar el valor con más votos
    for (const key of Object.keys(votes)) {
      const keyVotes = votes[key]
      if (!keyVotes) continue

      let maxVotes = 0
      let winner: any = undefined

      for (const [value, count] of Object.entries(keyVotes)) {
        if (count > maxVotes) {
          maxVotes = count
          winner = value
        }
      }

      if (winner !== undefined) {
        merged[key] = winner
      }
    }

    return merged
  }
}
