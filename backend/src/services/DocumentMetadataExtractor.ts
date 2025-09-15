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
   * Extraer magistrado ponente usando patrones específicos - MEJORADO
   */
  private extractMagistradoPonente(content: string): string | null {
    const patterns = [
      // Patrón mejorado: solo nombres válidos (2-4 palabras con letras y espacios)
      /(?:magistrado|magistrada)\s+ponente\s*:?\s*([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+){1,3})\s*(?:[\.,\n]|$|Bogotá|D\.C\.)/gi,
      
      // Variantes con DR./DRA. mejoradas
      /(?:magistrado|magistrada)\s+ponente\s*:?\s*dr\.?a?\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+){1,3})\s*(?:[\.,\n]|$|Bogotá|D\.C\.)/gi,
      
      // Con "M.P." o "MP:" mejorado
      /m\.?p\.?\s*:?\s*([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+){1,3})\s*(?:[\.,\n]|$|Bogotá|D\.C\.)/gi,
      
      // Patrón con "Ponente:" mejorado
      /ponente\s*:?\s*([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+){1,3})\s*(?:[\.,\n]|$|Bogotá|D\.C\.)/gi,
      
      // Patrón de respaldo más flexible pero limitado
      /(?:magistrado|magistrada)\s+ponente\s*:?\s*([^\n.]{10,40}?)(?:\s*[.,]|\s*\n|\s*Bogotá|\s*D\.C\.|\s*$)/gi
    ];

    for (const pattern of patterns) {
      // Usar exec() correctamente en un bucle
      let match;
      pattern.lastIndex = 0; // Reset regex
      
      while ((match = pattern.exec(content)) !== null) {
        if (match && match[1]) {
          const name = this.cleanMagistrateName(match[1]);
          if (this.isValidMagistrateName(name)) {
            logger.debug(`👨‍⚖️ Magistrado ponente encontrado: ${name}`);
            return name;
          }
        }
        
        // Evitar loop infinito con regex global
        if (!pattern.global) break;
      }
      
      pattern.lastIndex = 0; // Reset para el próximo patrón
    }

    logger.warn('⚠️  No se pudo extraer magistrado ponente');
    return null;
  }

  /**
   * Limpiar nombre del magistrado - MEJORADO
   */
  private cleanMagistrateName(name: string): string {
    return name
      .trim()
      .replace(/^dr\.?a?\s+/gi, '') // Remover Dr./Dra.
      .replace(/\s+/g, ' ') // Normalizar espacios
      .replace(/[^a-záéíóúüñA-ZÁÉÍÓÚÜÑ\s]/g, '') // Solo letras y espacios
      .split(/\n/)[0] // Tomar solo la primera línea
      .split(/\s{3,}/)[0] // Cortar en espacios grandes
      .split(/\s+Bogotá/i)[0] // Cortar antes de "Bogotá"
      .split(/\s+D\.?C\.?/i)[0] // Cortar antes de "D.C."
      .substring(0, 50) // Limitar longitud a 50 caracteres
      .trim();
  }

  /**
   * Validar que el nombre del magistrado sea válido
   */
  private isValidMagistrateName(name: string): boolean {
    if (!name || name.length < 5 || name.length > 50) {
      return false;
    }

    // Debe contener solo letras y espacios
    if (!/^[a-záéíóúüñA-ZÁÉÍÓÚÜÑ\s]+$/.test(name)) {
      return false;
    }

    // Debe tener entre 2 y 4 palabras (nombre y apellidos)
    const words = name.split(/\s+/).filter(word => word.length > 1);
    if (words.length < 2 || words.length > 4) {
      return false;
    }

    // Cada palabra debe empezar con mayúscula
    const hasValidFormat = words.every(word => /^[A-ZÁÉÍÓÚÜÑ]/.test(word));
    if (!hasValidFormat) {
      return false;
    }

    return true;
  }

  /**
   * Extraer sala de revisión - MEJORADO
   */
  private extractSalaRevision(content: string): string | null {
    const patterns = [
      // Patrones específicos para salas conocidas (más restrictivos)
      /\b(sala\s+plena)(?:\s|$|,|\.|\n)/gi,
      /\b(sala\s+primera)(?:\s+de\s+revisi[óo]n)?(?:\s|$|,|\.|\n)/gi,
      /\b(sala\s+segunda)(?:\s+de\s+revisi[óo]n)?(?:\s|$|,|\.|\n)/gi,
      /\b(sala\s+tercera)(?:\s+de\s+revisi[óo]n)?(?:\s|$|,|\.|\n)/gi,
      /\b(sala\s+cuarta)(?:\s+de\s+revisi[óo]n)?(?:\s|$|,|\.|\n)/gi,
      /\b(sala\s+quinta)(?:\s+de\s+revisi[óo]n)?(?:\s|$|,|\.|\n)/gi,
      /\b(sala\s+sexta)(?:\s+de\s+revisi[óo]n)?(?:\s|$|,|\.|\n)/gi,
      /\b(sala\s+s[ée]ptima)(?:\s+de\s+revisi[óo]n)?(?:\s|$|,|\.|\n)/gi,
      /\b(sala\s+octava)(?:\s+de\s+revisi[óo]n)?(?:\s|$|,|\.|\n)/gi,
      /\b(sala\s+novena)(?:\s+de\s+revisi[óo]n)?(?:\s|$|,|\.|\n)/gi,
      
      // Patrones con guiones (formato común en encabezados)
      /-\s*(sala\s+(?:plena|primera|segunda|tercera|cuarta|quinta|sexta|s[ée]ptima|octava|novena))\s*-/gi,
      
      // Patrón más específico para evitar capturas largas
      /(?:^|\n|\.)\s*(sala\s+(?:plena|primera|segunda|tercera|cuarta|quinta|sexta|s[ée]ptima|octava|novena))(?:\s+de\s+revisi[óo]n)?\s*(?:$|,|\.|\n)/gi
    ];

    for (const pattern of patterns) {
      let match;
      pattern.lastIndex = 0;
      
      while ((match = pattern.exec(content)) !== null) {
        if (match && match[1]) {
          const sala = this.cleanSalaName(match[1]);
          if (this.isValidSalaName(sala)) {
            logger.debug(`🏛️  Sala de revisión encontrada: ${sala}`);
            return this.normalizeSalaRevision(sala);
          }
        }
        
        if (!pattern.global) break;
      }
      
      pattern.lastIndex = 0;
    }

    logger.warn('⚠️  No se pudo extraer sala de revisión');
    return null;
  }

  /**
   * Limpiar nombre de sala - AÑADIDO
   */
  private cleanSalaName(sala: string): string {
    return sala
      .trim()
      .replace(/\s+/g, ' ') // Normalizar espacios
      .replace(/[^a-záéíóúüñA-ZÁÉÍÓÚÜÑ\s]/g, '') // Solo letras y espacios
      .substring(0, 30) // Limitar longitud
      .trim();
  }

  /**
   * Validar nombre de sala - AÑADIDO
   */
  private isValidSalaName(sala: string): boolean {
    if (!sala || sala.length < 4 || sala.length > 30) {
      return false;
    }

    // Lista de salas válidas conocidas
    const salasValidas = [
      'sala plena', 'sala primera', 'sala segunda', 'sala tercera', 
      'sala cuarta', 'sala quinta', 'sala sexta', 'sala séptima', 
      'sala septima', 'sala octava', 'sala novena'
    ];

    const salaLower = sala.toLowerCase();
    return salasValidas.some(validSala => 
      salaLower === validSala ||
      salaLower === (validSala + ' de revisión')
    );
  }

  /**
   * Normalizar nombre de sala de revisión - MEJORADO
   */
  private normalizeSalaRevision(sala: string): string {
    return sala
      .trim()
      .toLowerCase()
      .replace(/\b\w/g, l => l.toUpperCase()) // Title case
      .replace(/\s+/g, ' ')
      .replace(/Séptima/g, 'Séptima'); // Corregir acentos específicos
  }

  /**
   * Extraer número de expediente - MEJORADO
   */
  private extractExpediente(content: string): string | null {
    const patterns = [
      // Patrones específicos para expedientes válidos con límites claros
      /expediente\s*(?:n[úu]mero|no\.?)?\s*:?\s*([A-Z]-\d{1,2}[.,]?\d{3,4})\s*(?:[\.,\n]|$)/gi,
      /exp\.?\s*(?:n[úu]mero|no\.?)?\s*:?\s*([A-Z]-\d{1,2}[.,]?\d{3,4})\s*(?:[\.,\n]|$)/gi,
      /radicaci[óo]n\s*(?:n[úu]mero|no\.?)?\s*:?\s*([A-Z]-\d{1,2}[.,]?\d{3,4})\s*(?:[\.,\n]|$)/gi,
      
      // Patrón para expedientes T con números largos
      /expediente\s*(?:n[úu]mero|no\.?)?\s*:?\s*([T]-\d{6,8})\s*(?:[\.,\n]|$)/gi,
      
      // Patrón más general pero limitado a formatos conocidos
      /expediente\s*(?:n[úu]mero|no\.?)?\s*:?\s*([A-Z]{1,3}-[\d.,]{3,10})\s*(?:[\.,\n]|$|[A-Z])/gi,
    ];

    for (const pattern of patterns) {
      let match;
      pattern.lastIndex = 0;
      
      while ((match = pattern.exec(content)) !== null) {
        if (match && match[1]) {
          const expediente = this.cleanExpedienteNumber(match[1]);
          if (this.isValidExpedienteNumber(expediente)) {
            logger.debug(`📁 Expediente encontrado: ${expediente}`);
            return expediente;
          }
        }
        
        if (!pattern.global) break;
      }
      
      pattern.lastIndex = 0;
    }

    logger.warn('⚠️  No se pudo extraer número de expediente válido');
    return null;
  }

  /**
   * Limpiar número de expediente - AÑADIDO
   */
  private cleanExpedienteNumber(expediente: string): string {
    return expediente
      .trim()
      .toUpperCase()
      .replace(/\.$/, '') // Remover punto final
      .replace(/[^A-Z0-9\-.,]/g, '') // Solo letras, números, guiones, puntos y comas
      .substring(0, 15); // Limitar longitud
  }

  /**
   * Validar número de expediente - AÑADIDO
   */
  private isValidExpedienteNumber(expediente: string): boolean {
    if (!expediente || expediente.length < 3 || expediente.length > 15) {
      return false;
    }

    // Patrones de expedientes válidos conocidos
    const validPatterns = [
      /^[A-Z]-\d{1,2}[.,]?\d{3,4}$/, // D-15.479, T-11, etc.
      /^T-\d{6,8}$/,                  // T-1234567
      /^[A-Z]{1,3}-[\d.,]{3,10}$/     // Otros formatos
    ];

    return validPatterns.some(pattern => pattern.test(expediente));
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