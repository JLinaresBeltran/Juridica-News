/**
 * Extractor de Metadatos Estructurales para Sentencias de la Corte Constitucional
 * Extrae información específica como No. de Sentencia, Magistrado Ponente, Sala de Revisión
 */

import { logger } from '@/utils/logger';
import * as fs from 'fs';
import * as path from 'path';

// Interfaces para los metadatos extraídos
interface ExtractedMetadata {
  numeroSentencia: string | null;
  magistradoPonente: string | null;
  salaRevision: string | null;
  expediente: string | null;
  fechaSentencia: string | null;
  tipoSentencia: 'T' | 'C' | 'SU' | 'A' | null;
  rawText: string;
}

interface DocumentSource {
  url?: string;
  filePath?: string;
  content?: string;
}

export class DocumentMetadataExtractor {
  
  constructor() {
    logger.info('🔧 DocumentMetadataExtractor iniciado');
  }

  /**
   * Extraer metadatos de un documento desde diferentes fuentes
   */
  async extractMetadata(source: DocumentSource): Promise<ExtractedMetadata | null> {
    try {
      let content = '';

      // Obtener contenido según la fuente
      if (source.content) {
        content = source.content;
      } else if (source.filePath) {
        content = await this.readLocalFile(source.filePath);
      } else if (source.url) {
        content = await this.fetchFromUrl(source.url);
      } else {
        logger.warn('⚠️  No se proporcionó fuente válida para extraer metadatos');
        return null;
      }

      if (!content || content.length < 100) {
        logger.warn('⚠️  Contenido muy corto o vacío para análisis');
        return null;
      }

      // Procesar el contenido
      const metadata = await this.processContent(content);
      
      logger.info(`✅ Metadatos extraídos: ${metadata.numeroSentencia || 'N/A'} - ${metadata.magistradoPonente || 'N/A'}`);
      
      return metadata;

    } catch (error) {
      logger.error(`❌ Error extrayendo metadatos: ${error}`);
      return null;
    }
  }

  /**
   * Procesar contenido del documento para extraer metadatos
   */
  private async processContent(content: string): Promise<ExtractedMetadata> {
    // Limpiar y normalizar el contenido
    const normalizedContent = this.normalizeContent(content);
    
    const metadata: ExtractedMetadata = {
      numeroSentencia: null,
      magistradoPonente: null,
      salaRevision: null,
      expediente: null,
      fechaSentencia: null,
      tipoSentencia: null,
      rawText: normalizedContent
    };

    // Extraer cada metadato usando patrones específicos
    metadata.numeroSentencia = this.extractNumeroSentencia(normalizedContent);
    metadata.tipoSentencia = this.extractTipoSentencia(metadata.numeroSentencia);
    metadata.magistradoPonente = this.extractMagistradoPonente(normalizedContent);
    metadata.salaRevision = this.extractSalaRevision(normalizedContent);
    metadata.expediente = this.extractExpediente(normalizedContent);
    metadata.fechaSentencia = this.extractFechaSentencia(normalizedContent);

    return metadata;
  }

  /**
   * Normalizar contenido del documento
   */
  private normalizeContent(content: string): string {
    return content
      // Remover caracteres RTF
      .replace(/\\[a-z]+\d*\s?/g, ' ')
      .replace(/[\{\}]/g, ' ')
      // Normalizar espacios y saltos de línea
      .replace(/\s+/g, ' ')
      .replace(/\r\n|\r|\n/g, '\n')
      // Limpiar caracteres especiales
      .replace(/[^\w\s\náéíóúüñÁÉÍÓÚÜÑ.,;:()\-\/\n]/g, ' ')
      .trim();
  }

  /**
   * Extraer número de sentencia usando múltiples patrones
   */
  private extractNumeroSentencia(content: string): string | null {
    const patterns = [
      // Patrones principales para sentencias T, C, SU, A
      /(?:sentencia\s+)?(T-\d{1,4}\/\d{2,4})/gi,
      /(?:sentencia\s+)?(C-\d{1,4}\/\d{2,4})/gi,
      /(?:sentencia\s+)?(SU-\d{1,4}\/\d{2,4})/gi,
      /(?:sentencia\s+)?(A-\d{1,4}\/\d{2,4})/gi,
      
      // Patrones con punto en lugar de guión
      /(?:sentencia\s+)?(T\.\d{1,4}\/\d{2,4})/gi,
      /(?:sentencia\s+)?(C\.\d{1,4}\/\d{2,4})/gi,
      /(?:sentencia\s+)?(SU\.\d{1,4}\/\d{2,4})/gi,
      
      // Patrones en headers o títulos
      /(?:^|\n)\s*(T-\d{1,4}\/\d{2,4})/gi,
      /(?:^|\n)\s*(C-\d{1,4}\/\d{2,4})/gi,
      /(?:^|\n)\s*(SU-\d{1,4}\/\d{2,4})/gi,
      
      // Patrones con "No." o "Número"
      /(?:n[úu]mero|no\.?)\s*(\w-\d{1,4}\/\d{2,4})/gi,
      
      // Patrones de radicación
      /(?:radicaci[óo]n)\s*(?:n[úu]mero|no\.?)?\s*(\w-\d{1,4}\/\d{2,4})/gi
    ];

    for (const pattern of patterns) {
      const matches = content.match(pattern);
      if (matches && matches.length > 0) {
        // Tomar la primera coincidencia válida
        const match = matches[0].replace(/sentencia\s+/gi, '').trim().toUpperCase();
        
        // Validar formato
        if (/^[TCASU]\.?-?\d{1,4}\/\d{2,4}$/i.test(match)) {
          logger.debug(`📝 Número de sentencia encontrado: ${match}`);
          return this.normalizeNumeroSentencia(match);
        }
      }
    }

    logger.warn('⚠️  No se pudo extraer número de sentencia');
    return null;
  }

  /**
   * Normalizar formato del número de sentencia
   */
  private normalizeNumeroSentencia(numero: string): string {
    return numero
      .toUpperCase()
      .replace(/\./g, '')  // Remover puntos
      .replace(/^([TCASU])(\d)/g, '$1-$2'); // Asegurar guión después del tipo
  }

  /**
   * Extraer tipo de sentencia del número
   */
  private extractTipoSentencia(numeroSentencia: string | null): 'T' | 'C' | 'SU' | 'A' | null {
    if (!numeroSentencia) return null;
    
    const match = numeroSentencia.match(/^([TCASU])/);
    return match ? (match[1] as 'T' | 'C' | 'SU' | 'A') : null;
  }

  /**
   * Extraer magistrado ponente usando patrones específicos
   */
  private extractMagistradoPonente(content: string): string | null {
    const patterns = [
      // Patrón principal: "MAGISTRADO PONENTE:" seguido del nombre
      /magistrado\s+ponente\s*:?\s*([a-záéíóúüñ\s\.]+)/gi,
      
      // Variantes con DR./DRA.
      /magistrado\s+ponente\s*:?\s*dr\.?a?\s+([a-záéíóúüñ\s\.]+)/gi,
      
      // Con "M.P." o "MP:"
      /m\.?p\.?\s*:?\s*([a-záéíóúüñ\s\.]+)/gi,
      
      // En encabezados o líneas separadas
      /(?:^|\n)\s*magistrado\s+ponente\s*:?\s*([a-záéíóúüñ\s\.]+)/gim,
      
      // Patrón con "Ponente:"
      /ponente\s*:?\s*([a-záéíóúüñ\s\.]+)/gi,
      
      // Buscar después de "Corte Constitucional"
      /corte\s+constitucional[\s\S]{0,200}magistrado\s+ponente\s*:?\s*([a-záéíóúüñ\s\.]+)/gi
    ];

    for (const pattern of patterns) {
      const matches = content.match(pattern);
      if (matches && matches.length > 0) {
        for (const match of matches) {
          const nameMatch = pattern.exec(content);
          if (nameMatch && nameMatch[1]) {
            const name = this.cleanMagistrateName(nameMatch[1]);
            if (name && name.length > 5 && name.length < 100) {
              logger.debug(`👨‍⚖️ Magistrado ponente encontrado: ${name}`);
              return name;
            }
          }
          pattern.lastIndex = 0; // Reset regex
        }
      }
    }

    logger.warn('⚠️  No se pudo extraer magistrado ponente');
    return null;
  }

  /**
   * Limpiar nombre del magistrado
   */
  private cleanMagistrateName(name: string): string {
    return name
      .trim()
      .replace(/^dr\.?a?\s+/gi, '') // Remover Dr./Dra.
      .replace(/\s+/g, ' ') // Normalizar espacios
      .replace(/[^\w\s\.áéíóúüñÁÉÍÓÚÜÑ]/g, '') // Solo letras, espacios y puntos
      .split(/\n/)[0] // Tomar solo la primera línea
      .split(/\s{3,}/)[0] // Cortar en espacios grandes
      .substring(0, 80) // Limitar longitud
      .trim();
  }

  /**
   * Extraer sala de revisión
   */
  private extractSalaRevision(content: string): string | null {
    const patterns = [
      // Patrones principales para salas
      /sala\s+(?:de\s+)?revisi[óo]n\s*(?:n[úu]mero|no\.?)?\s*([a-z\d\s]+)/gi,
      /sala\s+(?:primera|segunda|tercera|cuarta|quinta|sexta|s[éo]ptima|octava|novena|plena)/gi,
      
      // Salas específicas de la Corte Constitucional
      /sala\s+plena/gi,
      /sala\s+de\s+selecci[óo]n/gi,
      
      // Patrones con números romanos
      /sala\s+(?:de\s+)?revisi[óo]n\s+([ivx]+)/gi,
      
      // En contexto de decisión
      /(?:en\s+)?sala\s+(?:de\s+)?revisi[óo]n\s*(?:integrada\s+por|conformada\s+por)?[^\n]{0,100}/gi
    ];

    for (const pattern of patterns) {
      const matches = content.match(pattern);
      if (matches && matches.length > 0) {
        const sala = matches[0].trim();
        
        // Validar que tenga sentido
        if (sala.length > 4 && sala.length < 100) {
          logger.debug(`🏛️  Sala de revisión encontrada: ${sala}`);
          return this.normalizeSalaRevision(sala);
        }
      }
    }

    logger.warn('⚠️  No se pudo extraer sala de revisión');
    return null;
  }

  /**
   * Normalizar nombre de sala de revisión
   */
  private normalizeSalaRevision(sala: string): string {
    return sala
      .trim()
      .toLowerCase()
      .replace(/\b\w/g, l => l.toUpperCase()) // Title case
      .replace(/\s+/g, ' ');
  }

  /**
   * Extraer número de expediente
   */
  private extractExpediente(content: string): string | null {
    const patterns = [
      /expediente\s*(?:n[úu]mero|no\.?)?\s*([a-z\d\-\/\s]+)/gi,
      /radicaci[óo]n\s*(?:n[úu]mero|no\.?)?\s*([a-z\d\-\/\s]+)/gi,
      /exp\.?\s*(?:n[úu]mero|no\.?)?\s*([a-z\d\-\/\s]+)/gi
    ];

    for (const pattern of patterns) {
      const matches = pattern.exec(content);
      if (matches && matches[1]) {
        const expediente = matches[1].trim();
        
        // Validar formato razonable
        if (expediente.length > 3 && expediente.length < 50) {
          logger.debug(`📁 Expediente encontrado: ${expediente}`);
          return expediente;
        }
      }
      pattern.lastIndex = 0;
    }

    return null;
  }

  /**
   * Extraer fecha de la sentencia
   */
  private extractFechaSentencia(content: string): string | null {
    const patterns = [
      // Fecha completa en español
      /(\d{1,2})\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\s+de\s+(\d{4})/gi,
      
      // Fecha en formato corto
      /(\d{1,2})\/(\d{1,2})\/(\d{4})/g,
      /(\d{1,2})-(\d{1,2})-(\d{4})/g,
      
      // En contexto específico
      /(?:fecha|ciudad|bogot[áa])\s*[:\-,]\s*([^.\n]{10,50})/gi
    ];

    for (const pattern of patterns) {
      const matches = content.match(pattern);
      if (matches && matches.length > 0) {
        const fecha = matches[0].trim();
        
        if (fecha.length > 8 && fecha.length < 50) {
          logger.debug(`📅 Fecha de sentencia encontrada: ${fecha}`);
          return fecha;
        }
      }
    }

    return null;
  }

  /**
   * Leer archivo local
   */
  private async readLocalFile(filePath: string): Promise<string> {
    try {
      return fs.readFileSync(filePath, 'utf-8');
    } catch (error) {
      logger.error(`❌ Error leyendo archivo local: ${error}`);
      return '';
    }
  }

  /**
   * Obtener contenido desde URL
   */
  private async fetchFromUrl(url: string): Promise<string> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const content = await response.text();
      return content;
      
    } catch (error) {
      logger.error(`❌ Error obteniendo contenido desde URL: ${error}`);
      return '';
    }
  }

  /**
   * Extraer metadatos en lote para múltiples documentos
   */
  async extractBatchMetadata(
    sources: Array<{ id: string; source: DocumentSource }>
  ): Promise<Array<{ id: string; metadata: ExtractedMetadata | null }>> {
    const results = [];
    
    logger.info(`📊 Iniciando extracción de metadatos en lote: ${sources.length} documentos`);

    for (let i = 0; i < sources.length; i++) {
      const { id, source } = sources[i];
      
      logger.info(`🔍 Procesando documento ${i + 1}/${sources.length}: ${id}`);
      
      const metadata = await this.extractMetadata(source);
      results.push({ id, metadata });

      // Pequeña pausa entre procesamientos
      if (i < sources.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    const successful = results.filter(r => r.metadata).length;
    logger.info(`✅ Extracción en lote completada: ${successful}/${sources.length} exitosos`);

    return results;
  }
}

// Instancia singleton del extractor
export const documentMetadataExtractor = new DocumentMetadataExtractor();