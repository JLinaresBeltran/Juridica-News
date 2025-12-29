/**
 * Implementación en memoria de IDocumentStorage para testing
 *
 * PRINCIPIO BLACK BOX:
 * - Tests no necesitan base de datos real
 * - Misma interfaz que PrismaDocumentStorage
 * - Perfecto para tests unitarios rápidos
 */

import {
  IDocumentStorage,
  Document,
  DocumentInput,
  DuplicateCriteria,
  DocumentFilters,
  PaginationOptions,
  PaginatedResult,
  DocumentStats,
  DocumentNotFoundError,
  LegalArea,
  DocumentStatus
} from './IDocumentStorage'

export class InMemoryDocumentStorage implements IDocumentStorage {
  private documents: Map<string, Document> = new Map()
  private idCounter = 0

  /**
   * Guardar un documento
   */
  async save(document: DocumentInput): Promise<Document> {
    const id = this.generateId()
    const now = new Date()

    const saved: Document = {
      ...document,
      id,
      createdAt: now,
      updatedAt: now
    }

    this.documents.set(id, saved)
    return { ...saved } // Retornar copia para evitar mutaciones
  }

  /**
   * Guardar múltiples documentos
   */
  async saveMany(documents: DocumentInput[]): Promise<Document[]> {
    const saved: Document[] = []

    for (const doc of documents) {
      const result = await this.save(doc)
      saved.push(result)
    }

    return saved
  }

  /**
   * Buscar por ID
   */
  async findById(id: string): Promise<Document | null> {
    const doc = this.documents.get(id)
    return doc ? { ...doc } : null
  }

  /**
   * Buscar por ID externo
   */
  async findByExternalId(externalId: string): Promise<Document | null> {
    for (const doc of this.documents.values()) {
      if (doc.externalId === externalId) {
        return { ...doc }
      }
    }
    return null
  }

  /**
   * Buscar duplicado
   */
  async findDuplicate(criteria: DuplicateCriteria): Promise<Document | null> {
    for (const doc of this.documents.values()) {
      if (criteria.externalId && doc.externalId === criteria.externalId) {
        return { ...doc }
      }
      if (criteria.url && doc.url === criteria.url) {
        return { ...doc }
      }
      if (criteria.title && doc.title === criteria.title) {
        return { ...doc }
      }
    }
    return null
  }

  /**
   * Actualizar metadata
   */
  async updateMetadata(id: string, metadata: Record<string, any>): Promise<void> {
    const doc = this.documents.get(id)

    if (!doc) {
      throw new DocumentNotFoundError(id)
    }

    doc.metadata = { ...doc.metadata, ...metadata }
    doc.updatedAt = new Date()
  }

  /**
   * Actualizar estado
   */
  async updateStatus(id: string, status: DocumentStatus): Promise<void> {
    const doc = this.documents.get(id)

    if (!doc) {
      throw new DocumentNotFoundError(id)
    }

    doc.status = status
    doc.updatedAt = new Date()
  }

  /**
   * Buscar con filtros y paginación
   */
  async findMany(
    filters: DocumentFilters,
    pagination: PaginationOptions
  ): Promise<PaginatedResult<Document>> {
    // Filtrar documentos
    let filtered = Array.from(this.documents.values())

    if (filters.source) {
      filtered = filtered.filter(d => d.source === filters.source)
    }
    if (filters.legalArea) {
      filtered = filtered.filter(d => d.legalArea === filters.legalArea)
    }
    if (filters.documentType) {
      filtered = filtered.filter(d => d.documentType === filters.documentType)
    }
    if (filters.status) {
      filtered = filtered.filter(d => d.status === filters.status)
    }
    if (filters.userId) {
      filtered = filtered.filter(d => d.userId === filters.userId)
    }
    if (filters.dateFrom) {
      filtered = filtered.filter(d => d.publicationDate >= filters.dateFrom!)
    }
    if (filters.dateTo) {
      filtered = filtered.filter(d => d.publicationDate <= filters.dateTo!)
    }
    if (filters.search) {
      const search = filters.search.toLowerCase()
      filtered = filtered.filter(
        d =>
          d.title.toLowerCase().includes(search) ||
          d.content.toLowerCase().includes(search) ||
          d.summary.toLowerCase().includes(search)
      )
    }

    // Ordenar
    if (pagination.sortBy) {
      filtered.sort((a, b) => {
        const aVal = (a as any)[pagination.sortBy!]
        const bVal = (b as any)[pagination.sortBy!]

        if (pagination.sortOrder === 'asc') {
          return aVal > bVal ? 1 : -1
        } else {
          return aVal < bVal ? 1 : -1
        }
      })
    }

    // Paginar
    const total = filtered.length
    const start = (pagination.page - 1) * pagination.pageSize
    const end = start + pagination.pageSize
    const data = filtered.slice(start, end).map(d => ({ ...d }))

    return {
      data,
      total,
      page: pagination.page,
      pageSize: pagination.pageSize,
      totalPages: Math.ceil(total / pagination.pageSize)
    }
  }

  /**
   * Obtener estadísticas
   */
  async getStats(filters?: DocumentFilters): Promise<DocumentStats> {
    let docs = Array.from(this.documents.values())

    // Aplicar filtros si existen
    if (filters) {
      if (filters.source) {
        docs = docs.filter(d => d.source === filters.source)
      }
      if (filters.legalArea) {
        docs = docs.filter(d => d.legalArea === filters.legalArea)
      }
      if (filters.documentType) {
        docs = docs.filter(d => d.documentType === filters.documentType)
      }
      if (filters.status) {
        docs = docs.filter(d => d.status === filters.status)
      }
      if (filters.userId) {
        docs = docs.filter(d => d.userId === filters.userId)
      }
      if (filters.dateFrom) {
        docs = docs.filter(d => d.publicationDate >= filters.dateFrom!)
      }
      if (filters.dateTo) {
        docs = docs.filter(d => d.publicationDate <= filters.dateTo!)
      }
    }

    // Calcular estadísticas
    const total = docs.length

    const byStatus: Record<DocumentStatus, number> = {
      [DocumentStatus.PENDING]: 0,
      [DocumentStatus.APPROVED]: 0,
      [DocumentStatus.REJECTED]: 0,
      [DocumentStatus.ARCHIVED]: 0
    }

    docs.forEach(d => {
      byStatus[d.status]++
    })

    const byLegalArea: Record<LegalArea, number> = {
      [LegalArea.CONSTITUCIONAL]: 0,
      [LegalArea.CIVIL]: 0,
      [LegalArea.PENAL]: 0,
      [LegalArea.LABORAL]: 0,
      [LegalArea.ADMINISTRATIVO]: 0,
      [LegalArea.COMERCIAL]: 0,
      [LegalArea.FAMILIA]: 0,
      [LegalArea.TRIBUTARIO]: 0,
      [LegalArea.DIGITAL]: 0,
      [LegalArea.GENERAL]: 0
    }

    docs.forEach(d => {
      byLegalArea[d.legalArea]++
    })

    const bySource: Record<string, number> = {}
    docs.forEach(d => {
      bySource[d.source] = (bySource[d.source] || 0) + 1
    })

    // Extracciones recientes (últimos 7 días)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const recentExtractions = docs.filter(d => d.extractedAt >= sevenDaysAgo).length

    return {
      total,
      byStatus,
      byLegalArea,
      bySource,
      recentExtractions
    }
  }

  /**
   * Eliminar documento
   */
  async delete(id: string): Promise<boolean> {
    return this.documents.delete(id)
  }

  /**
   * Métodos auxiliares para testing
   */

  /**
   * Limpiar todos los documentos (útil para beforeEach en tests)
   */
  clear(): void {
    this.documents.clear()
    this.idCounter = 0
  }

  /**
   * Obtener cantidad de documentos
   */
  size(): number {
    return this.documents.size
  }

  /**
   * Verificar si está vacío
   */
  isEmpty(): boolean {
    return this.documents.size === 0
  }

  /**
   * Generar ID único
   */
  private generateId(): string {
    return `doc-${++this.idCounter}`
  }
}
