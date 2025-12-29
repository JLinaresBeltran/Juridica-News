/**
 * Interfaz para adaptadores de almacenamiento de documentos
 *
 * PRINCIPIO BLACK BOX:
 * - La implementación (Prisma, MongoDB, etc.) está completamente oculta
 * - Cualquier BD puede implementar esta interfaz
 * - El orquestador NO debe conocer detalles de persistencia
 */

/**
 * Tipo de entrada para crear un documento (sin ID generado)
 */
export type DocumentInput = {
  documentId: string
  externalId: string
  title: string
  content: string
  fullTextContent?: string
  documentPath?: string
  summary: string
  source: string
  url: string
  legalArea: LegalArea
  documentType: DocumentType
  numeroSentencia?: string
  magistradoPonente?: string
  expediente?: string
  salaRevision?: string
  publicationDate: Date
  webOfficialDate?: Date
  extractedAt: Date
  status: DocumentStatus
  userId?: string
  metadata: Record<string, any>
}

/**
 * Documento jurídico completo (con campos generados)
 */
export type Document = DocumentInput & {
  id: string
  createdAt?: Date
  updatedAt?: Date
}

export enum LegalArea {
  CONSTITUCIONAL = 'CONSTITUCIONAL',
  CIVIL = 'CIVIL',
  PENAL = 'PENAL',
  LABORAL = 'LABORAL',
  ADMINISTRATIVO = 'ADMINISTRATIVO',
  COMERCIAL = 'COMERCIAL',
  FAMILIA = 'FAMILIA',
  TRIBUTARIO = 'TRIBUTARIO',
  DIGITAL = 'DIGITAL',
  GENERAL = 'GENERAL'
}

export enum DocumentType {
  SENTENCIA_T = 'SENTENCIA_T',      // Tutela
  SENTENCIA_C = 'SENTENCIA_C',      // Constitucionalidad
  SENTENCIA_SU = 'SENTENCIA_SU',    // Sala Unificada
  AUTO_A = 'AUTO_A',                // Auto
  DOCUMENT = 'DOCUMENT'              // Genérico
}

export enum DocumentStatus {
  PENDING = 'PENDING',       // Esperando curación
  APPROVED = 'APPROVED',     // Aprobado para artículo
  REJECTED = 'REJECTED',     // Rechazado
  ARCHIVED = 'ARCHIVED'      // Archivado
}

/**
 * Criterios para detectar documentos duplicados
 */
export interface DuplicateCriteria {
  externalId?: string
  url?: string
  title?: string
  // Búsqueda OR: Si cualquiera coincide, es duplicado
}

/**
 * Filtros de búsqueda de documentos
 */
export interface DocumentFilters {
  source?: string
  legalArea?: LegalArea
  documentType?: DocumentType
  status?: DocumentStatus
  userId?: string
  dateFrom?: Date
  dateTo?: Date
  search?: string              // Búsqueda full-text
}

/**
 * Opciones de paginación
 */
export interface PaginationOptions {
  page: number                 // Página actual (1-indexed)
  pageSize: number             // Documentos por página
  sortBy?: string              // Campo para ordenar
  sortOrder?: 'asc' | 'desc'   // Orden ascendente/descendente
}

/**
 * Resultado paginado genérico
 */
export interface PaginatedResult<T> {
  data: T[]
  total: number                // Total de elementos
  page: number                 // Página actual
  pageSize: number             // Tamaño de página
  totalPages: number           // Total de páginas
}

/**
 * Estadísticas de documentos
 */
export interface DocumentStats {
  total: number
  byStatus: Record<DocumentStatus, number>
  byLegalArea: Record<LegalArea, number>
  bySource: Record<string, number>
  recentExtractions: number    // Últimos 7 días
}

/**
 * Errores personalizados
 */
export class DocumentStorageError extends Error {
  constructor(message: string, public override cause?: Error) {
    super(message)
    this.name = 'DocumentStorageError'
  }
}

export class DocumentNotFoundError extends DocumentStorageError {
  constructor(id: string) {
    super(`Document not found: ${id}`)
    this.name = 'DocumentNotFoundError'
  }
}

export interface IDocumentStorage {
  /**
   * Guardar un documento en el almacenamiento
   *
   * @param document - Documento a guardar
   * @returns Documento guardado con ID generado
   * @throws DocumentStorageError si falla la persistencia
   */
  save(document: DocumentInput): Promise<Document>

  /**
   * Guardar múltiples documentos en batch
   *
   * @param documents - Array de documentos a guardar
   * @returns Array de documentos guardados
   * @throws DocumentStorageError si falla alguna inserción
   */
  saveMany(documents: DocumentInput[]): Promise<Document[]>

  /**
   * Buscar documento por ID interno
   *
   * @param id - UUID del documento
   * @returns Documento o null si no existe
   */
  findById(id: string): Promise<Document | null>

  /**
   * Buscar documento por ID externo
   *
   * @param externalId - ID de la fuente original
   * @returns Documento o null si no existe
   */
  findByExternalId(externalId: string): Promise<Document | null>

  /**
   * Verificar si existe un duplicado usando criterios específicos
   *
   * @param criteria - Criterios de búsqueda de duplicados
   * @returns Documento duplicado o null
   */
  findDuplicate(criteria: DuplicateCriteria): Promise<Document | null>

  /**
   * Actualizar metadatos de un documento
   *
   * @param id - UUID del documento
   * @param metadata - Metadatos a actualizar (merge con existentes)
   * @throws DocumentNotFoundError si el documento no existe
   */
  updateMetadata(id: string, metadata: Record<string, any>): Promise<void>

  /**
   * Actualizar estado de un documento
   *
   * @param id - UUID del documento
   * @param status - Nuevo estado
   * @throws DocumentNotFoundError si el documento no existe
   */
  updateStatus(id: string, status: DocumentStatus): Promise<void>

  /**
   * Buscar documentos con filtros y paginación
   *
   * @param filters - Filtros de búsqueda
   * @param pagination - Opciones de paginación
   * @returns Resultado paginado
   */
  findMany(
    filters: DocumentFilters,
    pagination: PaginationOptions
  ): Promise<PaginatedResult<Document>>

  /**
   * Obtener estadísticas de documentos
   *
   * @param filters - Filtros opcionales
   * @returns Estadísticas agregadas
   */
  getStats(filters?: DocumentFilters): Promise<DocumentStats>

  /**
   * Eliminar documento por ID
   *
   * @param id - UUID del documento
   * @returns true si se eliminó, false si no existía
   */
  delete(id: string): Promise<boolean>
}
