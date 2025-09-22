/**
 * ImageTagService - Servicio para generación automática de etiquetas temáticas
 *
 * Funcionalidades:
 * - Análisis automático de área legal y tema principal
 * - Extracción de conceptos del prompt
 * - Mapeo de etiquetas temáticas relevantes
 * - Gestión de biblioteca de etiquetas
 */

import { logger } from '../utils/logger';

export interface ImageTag {
  id: string;
  name: string;
  category: 'legal-area' | 'theme' | 'style' | 'concept' | 'custom';
  color: string;
  description?: string;
}

export interface TagGenerationOptions {
  legalArea?: string;
  temaPrincipal?: string;
  prompt: string;
  style: string;
  documentTitle?: string;
}

export class ImageTagService {

  // Mapeo de áreas legales a etiquetas temáticas
  private readonly legalAreaTags: Record<string, ImageTag[]> = {
    'Administrativo': [
      { id: 'gobierno', name: 'Gobierno', category: 'legal-area', color: '#3B82F6', description: 'Entidades gubernamentales' },
      { id: 'entidades-publicas', name: 'Entidades Públicas', category: 'legal-area', color: '#1E40AF', description: 'Organismos estatales' },
      { id: 'procedimientos', name: 'Procedimientos', category: 'legal-area', color: '#1D4ED8', description: 'Trámites administrativos' },
      { id: 'funcionarios', name: 'Funcionarios', category: 'legal-area', color: '#2563EB', description: 'Servidores públicos' }
    ],
    'Civil': [
      { id: 'contratos', name: 'Contratos', category: 'legal-area', color: '#10B981', description: 'Acuerdos contractuales' },
      { id: 'patrimonio', name: 'Patrimonio', category: 'legal-area', color: '#059669', description: 'Bienes y propiedades' },
      { id: 'responsabilidad', name: 'Responsabilidad', category: 'legal-area', color: '#047857', description: 'Responsabilidad civil' },
      { id: 'obligaciones', name: 'Obligaciones', category: 'legal-area', color: '#065F46', description: 'Deberes civiles' }
    ],
    'Comercial': [
      { id: 'empresas', name: 'Empresas', category: 'legal-area', color: '#F59E0B', description: 'Entidades comerciales' },
      { id: 'comercio', name: 'Comercio', category: 'legal-area', color: '#D97706', description: 'Actividad comercial' },
      { id: 'sociedades', name: 'Sociedades', category: 'legal-area', color: '#B45309', description: 'Formas societarias' },
      { id: 'mercantil', name: 'Mercantil', category: 'legal-area', color: '#92400E', description: 'Derecho mercantil' }
    ],
    'Digital': [
      { id: 'tecnologia', name: 'Tecnología', category: 'legal-area', color: '#8B5CF6', description: 'Aspectos tecnológicos' },
      { id: 'datos', name: 'Datos', category: 'legal-area', color: '#7C3AED', description: 'Protección de datos' },
      { id: 'internet', name: 'Internet', category: 'legal-area', color: '#6D28D9', description: 'Mundo digital' },
      { id: 'privacidad', name: 'Privacidad', category: 'legal-area', color: '#5B21B6', description: 'Privacidad digital' }
    ],
    'Familia': [
      { id: 'menores', name: 'Menores', category: 'legal-area', color: '#EC4899', description: 'Derechos de menores' },
      { id: 'matrimonio', name: 'Matrimonio', category: 'legal-area', color: '#DB2777', description: 'Unión matrimonial' },
      { id: 'alimentos', name: 'Alimentos', category: 'legal-area', color: '#BE185D', description: 'Obligación alimentaria' },
      { id: 'custodia', name: 'Custodia', category: 'legal-area', color: '#9D174D', description: 'Custodia de menores' }
    ],
    'Laboral': [
      { id: 'trabajo', name: 'Trabajo', category: 'legal-area', color: '#06B6D4', description: 'Relaciones laborales' },
      { id: 'empleados', name: 'Empleados', category: 'legal-area', color: '#0891B2', description: 'Trabajadores' },
      { id: 'sindicatos', name: 'Sindicatos', category: 'legal-area', color: '#0E7490', description: 'Organizaciones sindicales' },
      { id: 'seguridad-social', name: 'Seguridad Social', category: 'legal-area', color: '#155E75', description: 'Sistema de seguridad social' }
    ],
    'Penal': [
      { id: 'delitos', name: 'Delitos', category: 'legal-area', color: '#DC2626', description: 'Conductas delictivas' },
      { id: 'justicia', name: 'Justicia', category: 'legal-area', color: '#B91C1C', description: 'Sistema de justicia' },
      { id: 'victimas', name: 'Víctimas', category: 'legal-area', color: '#991B1B', description: 'Víctimas de delitos' },
      { id: 'investigacion', name: 'Investigación', category: 'legal-area', color: '#7F1D1D', description: 'Investigación penal' }
    ],
    'Tributario': [
      { id: 'impuestos', name: 'Impuestos', category: 'legal-area', color: '#7C2D12', description: 'Sistema tributario' },
      { id: 'hacienda', name: 'Hacienda', category: 'legal-area', color: '#92400E', description: 'Hacienda pública' },
      { id: 'contribuyentes', name: 'Contribuyentes', category: 'legal-area', color: '#A3590B', description: 'Sujetos tributarios' },
      { id: 'fiscalizacion', name: 'Fiscalización', category: 'legal-area', color: '#B45309', description: 'Control tributario' }
    ]
  };

  // Etiquetas por estilo de imagen
  private readonly styleTags: Record<string, ImageTag[]> = {
    'persona': [
      { id: 'profesional', name: 'Profesional', category: 'style', color: '#374151', description: 'Persona en entorno profesional' },
      { id: 'abogado', name: 'Abogado', category: 'style', color: '#1F2937', description: 'Profesional del derecho' },
      { id: 'ciudadano', name: 'Ciudadano', category: 'style', color: '#111827', description: 'Persona común' }
    ],
    'paisaje': [
      { id: 'tribunal', name: 'Tribunal', category: 'style', color: '#065F46', description: 'Salas de audiencia' },
      { id: 'oficina', name: 'Oficina', category: 'style', color: '#047857', description: 'Entorno de oficina' },
      { id: 'institucional', name: 'Institucional', category: 'style', color: '#059669', description: 'Edificios institucionales' }
    ],
    'elemento': [
      { id: 'documentos', name: 'Documentos', category: 'style', color: '#7C2D12', description: 'Documentos legales' },
      { id: 'simbolos', name: 'Símbolos', category: 'style', color: '#92400E', description: 'Símbolos jurídicos' },
      { id: 'objetos', name: 'Objetos', category: 'style', color: '#A3590B', description: 'Objetos relevantes' }
    ]
  };

  // Conceptos temáticos frecuentes
  private readonly thematicConcepts: Record<string, ImageTag[]> = {
    'salud': [
      { id: 'medicina', name: 'Medicina', category: 'theme', color: '#DC2626', description: 'Ámbito médico' },
      { id: 'pacientes', name: 'Pacientes', category: 'theme', color: '#B91C1C', description: 'Personas enfermas' },
      { id: 'hospitales', name: 'Hospitales', category: 'theme', color: '#991B1B', description: 'Centros de salud' },
      { id: 'tratamiento', name: 'Tratamiento', category: 'theme', color: '#7F1D1D', description: 'Atención médica' }
    ],
    'educacion': [
      { id: 'estudiantes', name: 'Estudiantes', category: 'theme', color: '#2563EB', description: 'Personas en formación' },
      { id: 'universidades', name: 'Universidades', category: 'theme', color: '#1D4ED8', description: 'Instituciones educativas' },
      { id: 'academico', name: 'Académico', category: 'theme', color: '#1E40AF', description: 'Entorno académico' },
      { id: 'colegios', name: 'Colegios', category: 'theme', color: '#3B82F6', description: 'Centros educativos' }
    ],
    'vivienda': [
      { id: 'hogar', name: 'Hogar', category: 'theme', color: '#059669', description: 'Espacio doméstico' },
      { id: 'arrendamiento', name: 'Arrendamiento', category: 'theme', color: '#047857', description: 'Alquiler de vivienda' },
      { id: 'propiedad', name: 'Propiedad', category: 'theme', color: '#065F46', description: 'Bienes inmuebles' }
    ],
    'ambiente': [
      { id: 'naturaleza', name: 'Naturaleza', category: 'theme', color: '#16A34A', description: 'Medio ambiente' },
      { id: 'sostenibilidad', name: 'Sostenibilidad', category: 'theme', color: '#15803D', description: 'Desarrollo sostenible' },
      { id: 'contaminacion', name: 'Contaminación', category: 'theme', color: '#166534', description: 'Daño ambiental' }
    ]
  };

  /**
   * Genera etiquetas automáticamente basadas en el contexto del documento y prompt
   */
  async generateAutoTags(options: TagGenerationOptions): Promise<ImageTag[]> {
    try {
      logger.info('🏷️ Generando etiquetas automáticas', {
        legalArea: options.legalArea,
        temaPrincipal: options.temaPrincipal,
        style: options.style,
        promptLength: options.prompt.length
      });

      const tags: ImageTag[] = [];

      // 1. Etiquetas por área legal
      if (options.legalArea && this.legalAreaTags[options.legalArea]) {
        tags.push(...this.legalAreaTags[options.legalArea]);
      }

      // 2. Etiquetas por estilo
      if (this.styleTags[options.style]) {
        tags.push(...this.styleTags[options.style]);
      }

      // 3. Análisis del tema principal
      if (options.temaPrincipal) {
        const thematicTags = this.extractThematicTags(options.temaPrincipal);
        tags.push(...thematicTags);
      }

      // 4. Análisis del prompt
      const promptTags = this.extractPromptConcepts(options.prompt);
      tags.push(...promptTags);

      // 5. Análisis del título del documento
      if (options.documentTitle) {
        const titleTags = this.extractTitleConcepts(options.documentTitle);
        tags.push(...titleTags);
      }

      // Eliminar duplicados por ID
      const uniqueTags = this.removeDuplicateTags(tags);

      logger.info('✅ Etiquetas generadas automáticamente', {
        totalTags: uniqueTags.length,
        categories: this.groupTagsByCategory(uniqueTags)
      });

      return uniqueTags;

    } catch (error) {
      logger.error('❌ Error generando etiquetas automáticas:', error);
      return this.getDefaultTags(options.style);
    }
  }

  /**
   * Extrae conceptos temáticos del tema principal
   */
  private extractThematicTags(temaPrincipal: string): ImageTag[] {
    const tema = temaPrincipal.toLowerCase();
    const tags: ImageTag[] = [];

    // Buscar conceptos clave
    Object.entries(this.thematicConcepts).forEach(([key, conceptTags]) => {
      if (tema.includes(key) || this.containsRelatedTerms(tema, key)) {
        tags.push(...conceptTags);
      }
    });

    return tags;
  }

  /**
   * Extrae conceptos del prompt generado
   */
  private extractPromptConcepts(prompt: string): ImageTag[] {
    const promptLower = prompt.toLowerCase();
    const tags: ImageTag[] = [];

    // Conceptos médicos
    if (this.containsTerms(promptLower, ['médico', 'hospital', 'salud', 'paciente', 'doctor', 'clínica'])) {
      tags.push(...(this.thematicConcepts['salud'] || []));
    }

    // Conceptos educativos
    if (this.containsTerms(promptLower, ['estudiante', 'universidad', 'colegio', 'educación', 'académico', 'escuela'])) {
      tags.push(...(this.thematicConcepts['educacion'] || []));
    }

    // Conceptos de vivienda
    if (this.containsTerms(promptLower, ['casa', 'vivienda', 'hogar', 'arrendamiento', 'alquiler', 'inmueble'])) {
      tags.push(...(this.thematicConcepts['vivienda'] || []));
    }

    // Conceptos ambientales
    if (this.containsTerms(promptLower, ['ambiente', 'naturaleza', 'contaminación', 'sostenible', 'ecológico'])) {
      tags.push(...(this.thematicConcepts['ambiente'] || []));
    }

    return tags;
  }

  /**
   * Extrae conceptos del título del documento
   */
  private extractTitleConcepts(title: string): ImageTag[] {
    const titleLower = title.toLowerCase();
    const tags: ImageTag[] = [];

    // Buscar números de sentencia y tipos
    if (titleLower.includes('tutela') || titleLower.includes('t-')) {
      tags.push({
        id: 'tutela',
        name: 'Tutela',
        category: 'concept',
        color: '#DC2626',
        description: 'Acción de tutela'
      });
    }

    if (titleLower.includes('constitucionalidad') || titleLower.includes('c-')) {
      tags.push({
        id: 'constitucionalidad',
        name: 'Constitucionalidad',
        category: 'concept',
        color: '#1D4ED8',
        description: 'Control de constitucionalidad'
      });
    }

    return tags;
  }

  /**
   * Obtiene todas las etiquetas disponibles por categoría
   */
  getAllAvailableTags(): Record<string, ImageTag[]> {
    const allTags: Record<string, ImageTag[]> = {
      'legal-areas': [],
      'themes': [],
      'styles': [],
      'concepts': []
    };

    // Recopilar todas las etiquetas
    Object.values(this.legalAreaTags).forEach(tags => {
      allTags['legal-areas'].push(...tags);
    });

    Object.values(this.thematicConcepts).forEach(tags => {
      allTags['themes'].push(...tags);
    });

    Object.values(this.styleTags).forEach(tags => {
      allTags['styles'].push(...tags);
    });

    return allTags;
  }

  /**
   * Convierte etiquetas a formato JSON para almacenamiento
   */
  tagsToJson(tags: ImageTag[]): string {
    try {
      return JSON.stringify(tags.map(tag => tag.id));
    } catch (error) {
      logger.error('❌ Error convirtiendo etiquetas a JSON:', error);
      return '[]';
    }
  }

  /**
   * Convierte JSON a etiquetas con metadatos completos
   */
  jsonToTags(jsonString: string): ImageTag[] {
    try {
      const tagIds: string[] = JSON.parse(jsonString || '[]');
      const allTags = this.getAllAvailableTags();
      const result: ImageTag[] = [];

      tagIds.forEach(tagId => {
        Object.values(allTags).forEach(categoryTags => {
          const tag = categoryTags.find(t => t.id === tagId);
          if (tag) {
            result.push(tag);
          }
        });
      });

      return result;
    } catch (error) {
      logger.error('❌ Error convirtiendo JSON a etiquetas:', error);
      return [];
    }
  }

  // Métodos auxiliares privados

  private containsRelatedTerms(text: string, concept: string): boolean {
    const relatedTerms: Record<string, string[]> = {
      'salud': ['enfermedad', 'medicamento', 'tratamiento', 'EPS', 'sistema de salud'],
      'educacion': ['enseñanza', 'formación', 'pedagogía', 'curriculum', 'matrícula'],
      'vivienda': ['habitación', 'residencia', 'domicilio', 'habitabilidad'],
      'ambiente': ['ecología', 'recursos naturales', 'biodiversidad', 'cambio climático']
    };

    const terms = relatedTerms[concept] || [];
    return terms.some(term => text.includes(term));
  }

  private containsTerms(text: string, terms: string[]): boolean {
    return terms.some(term => text.includes(term));
  }

  private removeDuplicateTags(tags: ImageTag[]): ImageTag[] {
    const seen = new Set<string>();
    return tags.filter(tag => {
      if (seen.has(tag.id)) {
        return false;
      }
      seen.add(tag.id);
      return true;
    });
  }

  private groupTagsByCategory(tags: ImageTag[]): Record<string, number> {
    const groups: Record<string, number> = {};
    tags.forEach(tag => {
      groups[tag.category] = (groups[tag.category] || 0) + 1;
    });
    return groups;
  }

  private getDefaultTags(style: string): ImageTag[] {
    return this.styleTags[style] || [];
  }
}

// Instancia singleton
export const imageTagService = new ImageTagService();
export default imageTagService;