/**
 * Servicio de Extracción de Texto DOCX para Análisis de IA
 * Convierte documentos DOCX binarios en texto estructurado para análisis jurídico
 */

import * as fs from 'fs';
import * as path from 'path';
import mammoth from 'mammoth';
import { logger } from '@/utils/logger';

export interface ExtractedDocumentContent {
  fullText: string;
  structuredContent: {
    introduccion: string;
    considerandos: string;
    resuelve: string;
    otros: string[];
  };
  metadata: {
    wordCount: number;
    extractionMethod: 'mammoth' | 'fallback';
    hasStructure: boolean;
  };
}

export class DocumentTextExtractor {
  
  /**
   * Extraer texto completo y estructurado de archivo DOCX
   */
  async extractFromDocxFile(filePath: string): Promise<ExtractedDocumentContent | null> {
    try {
      logger.info(`📄 Iniciando extracción de texto: ${path.basename(filePath)}`);

      // Verificar que el archivo existe
      if (!fs.existsSync(filePath)) {
        logger.error(`❌ Archivo no encontrado: ${filePath}`);
        return null;
      }

      // Extraer texto usando mammoth
      const result = await mammoth.extractRawText({ path: filePath });
      const fullText = result.value;

      if (!fullText || fullText.length < 100) {
        logger.warn(`⚠️  Texto extraído muy corto (${fullText.length} caracteres)`);
        return null;
      }

      logger.info(`✅ Texto extraído exitosamente: ${fullText.length} caracteres`);

      // Estructurar el contenido
      const structuredContent = this.extractStructuredSections(fullText);
      
      // Generar metadata
      const metadata = {
        wordCount: fullText.split(/\s+/).length,
        extractionMethod: 'mammoth' as const,
        hasStructure: this.hasJuridicalStructure(structuredContent)
      };

      logger.info(`📊 Extracción completada - Palabras: ${metadata.wordCount}, Estructura: ${metadata.hasStructure ? '✅' : '❌'}`);

      return {
        fullText,
        structuredContent,
        metadata
      };

    } catch (error) {
      logger.error(`❌ Error extrayendo texto de ${filePath}:`, error);
      return null;
    }
  }

  /**
   * Extraer texto de buffer DOCX (para archivos en memoria)
   */
  async extractFromBuffer(buffer: Buffer, filename: string): Promise<ExtractedDocumentContent | null> {
    try {
      logger.info(`📄 Extrayendo texto de buffer: ${filename}`);

      const result = await mammoth.extractRawText({ buffer });
      const fullText = result.value;

      if (!fullText || fullText.length < 100) {
        logger.warn(`⚠️  Texto extraído muy corto (${fullText.length} caracteres)`);
        return null;
      }

      const structuredContent = this.extractStructuredSections(fullText);
      
      const metadata = {
        wordCount: fullText.split(/\s+/).length,
        extractionMethod: 'mammoth' as const,
        hasStructure: this.hasJuridicalStructure(structuredContent)
      };

      return {
        fullText,
        structuredContent,
        metadata
      };

    } catch (error) {
      logger.error(`❌ Error extrayendo texto de buffer ${filename}:`, error);
      return null;
    }
  }

  /**
   * Identificar y extraer secciones estructurales de sentencias judiciales
   */
  public extractStructuredSections(content: string) {
    const sections = {
      introduccion: '',
      considerandos: '',
      resuelve: '',
      otros: [] as string[]
    };

    try {
      // Normalizar el contenido
      const normalizedContent = content
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .replace(/\n\s*\n\s*\n/g, '\n\n'); // Reducir múltiples saltos de línea

      // Dividir en párrafos - FILTRO MEJORADO para preservar párrafos cortos de RESUELVE
      const allParagraphs = normalizedContent
        .split(/\n\s*\n/)
        .map(p => p.trim())
        .filter(p => p.length > 0);

      // Encontrar posición de RESUELVE para aplicar filtro diferente
      const resuelvePosition = normalizedContent.toLowerCase().indexOf('resuelve');
      const isInResuelveSection = (paragraph: string, index: number) => {
        if (resuelvePosition === -1) return false;

        // Calcular posición aproximada del párrafo
        let currentPos = 0;
        for (let i = 0; i < index; i++) {
          currentPos += allParagraphs[i].length + 2; // +2 por \n\n
        }

        return currentPos >= resuelvePosition - 1000; // 1000 caracteres antes de RESUELVE
      };

      // Aplicar filtro: párrafos largos (>50) EXCEPTO en sección RESUELVE (>10)
      const paragraphs = allParagraphs.filter((p, index) => {
        const minLength = isInResuelveSection(p, index) ? 10 : 50;
        return p.length >= minLength;
      });

      // Debug párrafos procesados (log removido)

      // Patrones mejorados para identificar secciones
      const patterns = {
        // Introducción: datos básicos de la sentencia
        introduccion: /(?:en\s+la\s+ciudad\s+de|la\s+corte\s+constitucional|sala\s+plena|(?:magistrado|magistrada)\s+ponente|expediente|radicación|demandante|demandado)/i,
        
        // Antecedentes: contexto del caso
        antecedentes: /(?:antecedentes|i\.\s*antecedentes|1\.\s*antecedentes|hechos\s+probados|síntesis\s+de\s+la\s+demanda)/i,
        
        // Consideraciones: argumentación jurídica principal
        consideraciones: /(?:consideraciones|considerandos|ii\.\s*consideraciones|2\.\s*consideraciones|fundamentos\s+jurídicos|análisis\s+constitucional|problema\s+jurídico)/i,
        
        // Decisión: parte resolutiva - Patrones más flexibles para detectar RESUELVE
        decision: /(?:^|\n)[\s]*(?:(?:III|3)\.?\s*)?RESUELVE\s*[:\.]?[\s]*(?:\n|$)/im,
        
        // Contenido relevante adicional
        ratioDecidendi: /(?:ratio\s+decidendi|fundamento\s+central|tesis\s+principal|doctrina\s+constitucional)/i
      };

      let currentSection: 'introduccion' | 'considerandos' | 'resuelve' | null = null;
      let introduccionFound = false;
      let consideracionesFound = false;
      let decisionFound = false;

      for (const paragraph of paragraphs) {
        const paragraphLower = paragraph.toLowerCase();

        // Detectar introducción (primeros párrafos con datos básicos)
        if (!introduccionFound && patterns.introduccion.test(paragraphLower)) {
          currentSection = 'introduccion';
          introduccionFound = true;
          sections.introduccion += paragraph + '\n\n';
          continue;
        }

        // Detectar inicio de antecedentes/consideraciones
        if (!consideracionesFound && (patterns.antecedentes.test(paragraphLower) || patterns.consideraciones.test(paragraphLower))) {
          currentSection = 'considerandos';
          consideracionesFound = true;
          sections.considerandos += paragraph + '\n\n';
          continue;
        }

        // Detectar inicio de parte resolutiva - Múltiples patrones más flexibles
        const isResuelvePattern = patterns.decision.test(paragraph);
        const isResuelveManual = /^[\s]*RESUELVE\s*[:\.]?[\s]*$/i.test(paragraph.trim());
        const isResuelveInLine = /\bRESUELVE\s*[:\.]?\s*$/im.test(paragraph);
        const isResuelveWithContext = /(?:corte|sala)[\s\S]*RESUELVE\s*[:\.]?\s*$/im.test(paragraph);

        if (!decisionFound && (isResuelvePattern || isResuelveManual || isResuelveInLine || isResuelveWithContext)) {
          logger.info(`🎯 RESUELVE DETECTADO! Párrafo: "${paragraph.trim()}" | Pattern: ${isResuelvePattern} | Manual: ${isResuelveManual} | InLine: ${isResuelveInLine} | Context: ${isResuelveWithContext}`);
          currentSection = 'resuelve';
          decisionFound = true;
          sections.resuelve += paragraph + '\n\n';
          continue;
        }

        // DEBUG: Log paragraphs cerca del final para detectar por qué no encuentra RESUELVE
        if (paragraph.toLowerCase().includes('resuelve')) {
          logger.info(`🔍 DEBUG: Párrafo con "resuelve" encontrado: "${paragraph.trim()}"`);
          logger.info(`🔍 DEBUG: Pattern test: ${patterns.decision.test(paragraph)}`);
          logger.info(`🔍 DEBUG: Manual test: ${/^[\s]*RESUELVE\s*[:\.]?[\s]*$/i.test(paragraph.trim())}`);
        }

        // Continuar agregando contenido a la sección actual
        if (currentSection === 'introduccion' && !consideracionesFound) {
          sections.introduccion += paragraph + '\n\n';
          // Limitar tamaño de introducción
          if (sections.introduccion.length > 2000) {
            introduccionFound = true;
            currentSection = null;
          }
        } else if (currentSection === 'considerandos' && !decisionFound) {
          sections.considerandos += paragraph + '\n\n';
          // Limitar tamaño de considerandos
          if (sections.considerandos.length > 4000) {
            currentSection = null;
          }
        } else if (currentSection === 'resuelve') {
          sections.resuelve += paragraph + '\n\n';
          // CAMBIO CRÍTICO: Capturar TODA la sección RESUELVE sin límites
          // Ya no limitamos a 4000 caracteres para análisis completo
        }

        // Capturar contenido relevante adicional
        if (patterns.ratioDecidendi.test(paragraphLower) && paragraph.length > 150) {
          sections.otros.push(paragraph);
        }
      }

      // Fallback mejorado: buscar RESUELVE manualmente si no se encontró estructura
      if (!decisionFound) {
        // RESUELVE no detectado con patrones, buscando manualmente (log removido)

        // 🎯 CORRECCIÓN: Buscar RESUELVE en el contenido ORIGINAL completo, no en párrafos filtrados
        const resuelveIndex = normalizedContent.toLowerCase().indexOf('resuelve');

        if (resuelveIndex !== -1) {
          // RESUELVE encontrado en contenido original (log removido)

          // Capturar desde RESUELVE hasta el final del documento completo
          const resuelveContent = normalizedContent.substring(resuelveIndex);
          sections.resuelve = resuelveContent;

          logger.info(`✅ RESUELVE extraído directamente del contenido original: ${sections.resuelve.length} caracteres`);
          // Contenido RESUELVE extraído (log removido)
          decisionFound = true;
        } else {
          logger.error('❌ RESUELVE no encontrado ni siquiera en búsqueda manual');
        }
      }

      // Fallback final: si no se encontró estructura, usar distribución por posición
      if (!introduccionFound && !consideracionesFound && !decisionFound) {
        logger.warn('⚠️  No se detectó estructura jurídica, usando distribución por posición');

        const firstPart = paragraphs.slice(0, Math.ceil(paragraphs.length * 0.2));
        const middlePart = paragraphs.slice(Math.ceil(paragraphs.length * 0.2), Math.ceil(paragraphs.length * 0.8));
        const lastPart = paragraphs.slice(Math.ceil(paragraphs.length * 0.8));

        sections.introduccion = firstPart.join('\n\n').substring(0, 2000);
        sections.considerandos = middlePart.join('\n\n').substring(0, 4000);
        // CAMBIO: Capturar TODA la parte final como RESUELVE sin límites
        sections.resuelve = lastPart.join('\n\n');
      }

      // Limpiar secciones vacías
      Object.keys(sections).forEach(key => {
        if (key !== 'otros' && typeof sections[key as keyof typeof sections] === 'string') {
          sections[key as keyof typeof sections] = (sections[key as keyof typeof sections] as string).trim();
        }
      });

      logger.info(`📋 Secciones extraídas - Intro: ${sections.introduccion.length}ch, Considerandos: ${sections.considerandos.length}ch, Resuelve: ${sections.resuelve.length}ch`);

      // DEBUG: Log final de la sección RESUELVE
      if (sections.resuelve.length > 0) {
        logger.info(`✅ RESUELVE encontrado: ${sections.resuelve.length} caracteres`);
      } else {
        logger.warn(`❌ RESUELVE NO encontrado. Contenido total: ${content.length} caracteres`);
        // Buscar manualmente en todo el contenido
        const manualSearch = content.toLowerCase().indexOf('resuelve');
        if (manualSearch !== -1) {
          const contextStart = Math.max(0, manualSearch - 50);
          const contextEnd = Math.min(content.length, manualSearch + 200);
          logger.info(`🔍 RESUELVE encontrado manualmente en posición ${manualSearch}: "${content.substring(contextStart, contextEnd)}"`);
        }
      }

      return sections;

    } catch (error) {
      logger.error('❌ Error extrayendo secciones estructuradas:', error);
      
      // Fallback: dividir el contenido en partes iguales
      const words = content.split(/\s+/);
      const third = Math.ceil(words.length / 3);
      
      return {
        introduccion: words.slice(0, third).join(' ').substring(0, 2000),
        considerandos: words.slice(third, third * 2).join(' ').substring(0, 4000),
        // CAMBIO: Fallback también captura RESUELVE completo sin límites
        resuelve: words.slice(third * 2).join(' '),
        otros: []
      };
    }
  }

  /**
   * Verificar si el contenido tiene estructura jurídica reconocible
   */
  private hasJuridicalStructure(sections: { introduccion: string; considerandos: string; resuelve: string; otros: string[] }): boolean {
    const minLengthIntro = 200;
    const minLengthConsiderandos = 500;
    const minLengthResuelve = 100;

    return (
      sections.introduccion.length >= minLengthIntro &&
      sections.considerandos.length >= minLengthConsiderandos &&
      sections.resuelve.length >= minLengthResuelve
    );
  }

  /**
   * Limpiar y normalizar texto extraído
   */
  private cleanExtractedText(text: string): string {
    return text
      // Remover caracteres de control
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      // Normalizar espacios en blanco
      .replace(/\s+/g, ' ')
      // Remover espacios al inicio y final
      .trim()
      // Remover líneas muy cortas que pueden ser ruido
      .split('\n')
      .filter(line => line.trim().length > 10)
      .join('\n');
  }

  /**
   * Verificar si un archivo es DOCX basado en su contenido
   */
  static isDocxFile(filePath: string): boolean {
    try {
      const buffer = fs.readFileSync(filePath);
      return DocumentTextExtractor.isDocxBuffer(buffer);
    } catch {
      return false;
    }
  }

  /**
   * Verificar si un buffer contiene un archivo DOCX
   */
  static isDocxBuffer(buffer: Buffer): boolean {
    // Verificar signature de archivo DOCX (ZIP con estructura específica)
    return buffer.length > 4 && buffer.subarray(0, 4).equals(Buffer.from([0x50, 0x4B, 0x03, 0x04]));
  }

  /**
   * Obtener información básica del archivo
   */
  async getFileInfo(filePath: string) {
    try {
      const stats = fs.statSync(filePath);
      const isDocx = DocumentTextExtractor.isDocxFile(filePath);
      
      return {
        exists: true,
        size: stats.size,
        isDocx,
        modified: stats.mtime,
        filename: path.basename(filePath)
      };
    } catch (error) {
      return {
        exists: false,
        size: 0,
        isDocx: false,
        modified: null,
        filename: path.basename(filePath),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// Instancia singleton del extractor
export const documentTextExtractor = new DocumentTextExtractor();