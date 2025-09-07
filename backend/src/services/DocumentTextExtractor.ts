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
  private extractStructuredSections(content: string) {
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

      // Dividir en párrafos
      const paragraphs = normalizedContent
        .split(/\n\s*\n/)
        .filter(p => p.trim().length > 50)
        .map(p => p.trim());

      // Patrones mejorados para identificar secciones
      const patterns = {
        // Introducción: datos básicos de la sentencia
        introduccion: /(?:en\s+la\s+ciudad\s+de|la\s+corte\s+constitucional|sala\s+plena|magistrado\s+ponente|expediente|radicación|demandante|demandado)/i,
        
        // Antecedentes: contexto del caso
        antecedentes: /(?:antecedentes|i\.\s*antecedentes|1\.\s*antecedentes|hechos\s+probados|síntesis\s+de\s+la\s+demanda)/i,
        
        // Consideraciones: argumentación jurídica principal
        consideraciones: /(?:consideraciones|considerandos|ii\.\s*consideraciones|2\.\s*consideraciones|fundamentos\s+jurídicos|análisis\s+constitucional|problema\s+jurídico)/i,
        
        // Decisión: parte resolutiva
        decision: /(?:resuelve|decide|falla|iii\.\s*decisión|3\.\s*decisión|parte\s+resolutiva|por\s+tanto|en\s+mérito\s+de\s+lo\s+expuesto)/i,
        
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

        // Detectar inicio de parte resolutiva
        if (!decisionFound && patterns.decision.test(paragraphLower)) {
          currentSection = 'resuelve';
          decisionFound = true;
          sections.resuelve += paragraph + '\n\n';
          continue;
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
          // Limitar parte resolutiva
          if (sections.resuelve.length > 1500) {
            break;
          }
        }

        // Capturar contenido relevante adicional
        if (patterns.ratioDecidendi.test(paragraphLower) && paragraph.length > 150) {
          sections.otros.push(paragraph);
        }
      }

      // Fallback: si no se encontró estructura, usar distribución por posición
      if (!introduccionFound && !consideracionesFound && !decisionFound) {
        logger.warn('⚠️  No se detectó estructura jurídica, usando distribución por posición');
        
        const firstPart = paragraphs.slice(0, Math.ceil(paragraphs.length * 0.2));
        const middlePart = paragraphs.slice(Math.ceil(paragraphs.length * 0.2), Math.ceil(paragraphs.length * 0.8));
        const lastPart = paragraphs.slice(Math.ceil(paragraphs.length * 0.8));

        sections.introduccion = firstPart.join('\n\n').substring(0, 2000);
        sections.considerandos = middlePart.join('\n\n').substring(0, 4000);
        sections.resuelve = lastPart.join('\n\n').substring(0, 1500);
      }

      // Limpiar secciones vacías
      Object.keys(sections).forEach(key => {
        if (key !== 'otros' && typeof sections[key as keyof typeof sections] === 'string') {
          sections[key as keyof typeof sections] = (sections[key as keyof typeof sections] as string).trim();
        }
      });

      logger.info(`📋 Secciones extraídas - Intro: ${sections.introduccion.length}ch, Considerandos: ${sections.considerandos.length}ch, Resuelve: ${sections.resuelve.length}ch`);

      return sections;

    } catch (error) {
      logger.error('❌ Error extrayendo secciones estructuradas:', error);
      
      // Fallback: dividir el contenido en partes iguales
      const words = content.split(/\s+/);
      const third = Math.ceil(words.length / 3);
      
      return {
        introduccion: words.slice(0, third).join(' ').substring(0, 2000),
        considerandos: words.slice(third, third * 2).join(' ').substring(0, 4000),
        resuelve: words.slice(third * 2).join(' ').substring(0, 1500),
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