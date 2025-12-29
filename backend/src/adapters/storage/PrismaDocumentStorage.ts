/**
 * Implementación de IDocumentStorage usando Prisma ORM
 *
 * PRINCIPIO BLACK BOX:
 * - Toda la lógica de Prisma está encapsulada aquí
 * - El resto del sistema solo conoce la interfaz IDocumentStorage
 * - Cambiar a otra BD = implementar otra clase con la misma interfaz
 */

import { PrismaClient } from '@prisma/client'
import {
  IDocumentStorage,
  Document,
  DocumentInput,
  DuplicateCriteria,
  DocumentFilters,
  PaginationOptions,
  PaginatedResult,
  DocumentStats,
  DocumentStorageError,
  DocumentNotFoundError,
  LegalArea,
  DocumentStatus,
  DocumentType
} from './IDocumentStorage'

export class PrismaDocumentStorage implements IDocumentStorage {
  constructor(private prisma: PrismaClient) {}

  /**
   * Guardar un documento en la base de datos
   */
  async save(document: DocumentInput): Promise<Document> {
    try {
      const saved = await this.prisma.document.create({
        data: this.buildPrismaData(document)
      })

      return this.mapPrismaToDocument(saved)
    } catch (error) {
      throw new DocumentStorageError(
        `Error al guardar documento: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        error instanceof Error ? error : undefined
      )
    }
  }

  /**
   * Guardar múltiples documentos en batch (transacción)
   */
  async saveMany(documents: DocumentInput[]): Promise<Document[]> {
    try {
      const results = await this.prisma.$transaction(
        documents.map(doc =>
          this.prisma.document.create({
            data: this.buildPrismaData(doc)
          })
        )
      )

      return results.map(this.mapPrismaToDocument)
    } catch (error) {
      throw new DocumentStorageError(
        `Error al guardar documentos en batch: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        error instanceof Error ? error : undefined
      )
    }
  }

  /**
   * Buscar documento por ID interno
   */
  async findById(id: string): Promise<Document | null> {
    const doc = await this.prisma.document.findUnique({
      where: { id }
    })

    return doc ? this.mapPrismaToDocument(doc) : null
  }

  /**
   * Buscar documento por ID externo
   */
  async findByExternalId(externalId: string): Promise<Document | null> {
    const doc = await this.prisma.document.findUnique({
      where: { externalId }
    })

    return doc ? this.mapPrismaToDocument(doc) : null
  }

  /**
   * Verificar si existe un duplicado
   */
  async findDuplicate(criteria: DuplicateCriteria): Promise<Document | null> {
    const conditions = []

    if (criteria.externalId) {
      conditions.push({ externalId: criteria.externalId })
    }
    if (criteria.url) {
      conditions.push({ url: criteria.url })
    }
    if (criteria.title) {
      conditions.push({ title: criteria.title })
    }

    if (conditions.length === 0) {
      return null
    }

    const doc = await this.prisma.document.findFirst({
      where: {
        OR: conditions
      }
    })

    return doc ? this.mapPrismaToDocument(doc) : null
  }

  /**
   * Actualizar metadatos de un documento
   */
  async updateMetadata(id: string, metadata: Record<string, any>): Promise<void> {
    try {
      // Obtener metadata actual
      const current = await this.prisma.document.findUnique({
        where: { id },
        select: { metadata: true }
      })

      if (!current) {
        throw new DocumentNotFoundError(id)
      }

      // Merge con metadata existente
      const currentMetadata = current.metadata ? JSON.parse(current.metadata) : {}
      const mergedMetadata = { ...currentMetadata, ...metadata }

      await this.prisma.document.update({
        where: { id },
        data: {
          metadata: JSON.stringify(mergedMetadata)
        }
      })
    } catch (error) {
      if (error instanceof DocumentNotFoundError) {
        throw error
      }
      throw new DocumentStorageError(
        `Error al actualizar metadata: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        error instanceof Error ? error : undefined
      )
    }
  }

  /**
   * Actualizar estado de un documento
   */
  async updateStatus(id: string, status: DocumentStatus): Promise<void> {
    try {
      await this.prisma.document.update({
        where: { id },
        data: { status }
      })
    } catch (error) {
      if ((error as any)?.code === 'P2025') {
        throw new DocumentNotFoundError(id)
      }
      throw new DocumentStorageError(
        `Error al actualizar estado: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        error instanceof Error ? error : undefined
      )
    }
  }

  /**
   * Buscar documentos con filtros y paginación
   */
  async findMany(
    filters: DocumentFilters,
    pagination: PaginationOptions
  ): Promise<PaginatedResult<Document>> {
    const where: any = {}

    // Aplicar filtros
    if (filters.source) where.source = filters.source
    if (filters.legalArea) where.legalArea = filters.legalArea
    if (filters.documentType) where.documentType = filters.documentType
    if (filters.status) where.status = filters.status
    if (filters.userId) where.userId = filters.userId

    if (filters.dateFrom || filters.dateTo) {
      where.publicationDate = {}
      if (filters.dateFrom) where.publicationDate.gte = filters.dateFrom
      if (filters.dateTo) where.publicationDate.lte = filters.dateTo
    }

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search } },
        { content: { contains: filters.search } },
        { summary: { contains: filters.search } }
      ]
    }

    // Calcular offset
    const skip = (pagination.page - 1) * pagination.pageSize

    // Ordenamiento
    const orderBy: any = {}
    if (pagination.sortBy) {
      orderBy[pagination.sortBy] = pagination.sortOrder || 'desc'
    } else {
      orderBy.createdAt = 'desc' // Default: ordenar por fecha de creación
    }

    // Ejecutar queries en paralelo
    const [documents, total] = await Promise.all([
      this.prisma.document.findMany({
        where,
        skip,
        take: pagination.pageSize,
        orderBy
      }),
      this.prisma.document.count({ where })
    ])

    return {
      data: documents.map(this.mapPrismaToDocument),
      total,
      page: pagination.page,
      pageSize: pagination.pageSize,
      totalPages: Math.ceil(total / pagination.pageSize)
    }
  }

  /**
   * Obtener estadísticas de documentos
   */
  async getStats(filters?: DocumentFilters): Promise<DocumentStats> {
    const where: any = {}

    if (filters) {
      if (filters.source) where.source = filters.source
      if (filters.legalArea) where.legalArea = filters.legalArea
      if (filters.documentType) where.documentType = filters.documentType
      if (filters.status) where.status = filters.status
      if (filters.userId) where.userId = filters.userId

      if (filters.dateFrom || filters.dateTo) {
        where.publicationDate = {}
        if (filters.dateFrom) where.publicationDate.gte = filters.dateFrom
        if (filters.dateTo) where.publicationDate.lte = filters.dateTo
      }
    }

    // Total de documentos
    const total = await this.prisma.document.count({ where })

    // Por estado
    const statusGroups = await this.prisma.document.groupBy({
      by: ['status'],
      where,
      _count: { id: true }
    })

    const byStatus: Record<DocumentStatus, number> = {
      [DocumentStatus.PENDING]: 0,
      [DocumentStatus.APPROVED]: 0,
      [DocumentStatus.REJECTED]: 0,
      [DocumentStatus.ARCHIVED]: 0
    }

    statusGroups.forEach(group => {
      byStatus[group.status as DocumentStatus] = group._count.id
    })

    // Por área legal
    const areaGroups = await this.prisma.document.groupBy({
      by: ['legalArea'],
      where,
      _count: { id: true }
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

    areaGroups.forEach(group => {
      byLegalArea[group.legalArea as LegalArea] = group._count.id
    })

    // Por fuente
    const sourceGroups = await this.prisma.document.groupBy({
      by: ['source'],
      where,
      _count: { id: true }
    })

    const bySource: Record<string, number> = {}
    sourceGroups.forEach(group => {
      bySource[group.source] = group._count.id
    })

    // Extracciones recientes (últimos 7 días)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const recentExtractions = await this.prisma.document.count({
      where: {
        ...where,
        extractedAt: {
          gte: sevenDaysAgo
        }
      }
    })

    return {
      total,
      byStatus,
      byLegalArea,
      bySource,
      recentExtractions
    }
  }

  /**
   * Eliminar documento por ID
   */
  async delete(id: string): Promise<boolean> {
    try {
      await this.prisma.document.delete({
        where: { id }
      })
      return true
    } catch (error) {
      if ((error as any)?.code === 'P2025') {
        return false // No existía
      }
      throw new DocumentStorageError(
        `Error al eliminar documento: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        error instanceof Error ? error : undefined
      )
    }
  }

  /**
   * Construir objeto data de Prisma sin valores undefined
   * (Para compatibilidad con exactOptionalPropertyTypes: true)
   */
  private buildPrismaData(document: DocumentInput): any {
    const data: any = {
      // IDs
      externalId: document.externalId,
      internalId: document.documentId, // Mapeo: documentId -> internalId

      // Contenido
      title: document.title,
      content: document.content,
      summary: document.summary,

      // Metadata Legal
      source: document.source,
      url: document.url,
      legalArea: document.legalArea,
      documentType: document.documentType,

      // Fechas
      publicationDate: document.publicationDate,
      extractedAt: document.extractedAt,

      // Estado
      status: document.status,

      // Metadata flexible (JSON serializado)
      metadata: JSON.stringify(document.metadata || {})
    }

    // Campos opcionales - solo agregar si existen
    if (document.fullTextContent !== undefined) data.fullTextContent = document.fullTextContent
    if (document.documentPath !== undefined) data.documentPath = document.documentPath
    if (document.numeroSentencia !== undefined) data.numeroSentencia = document.numeroSentencia
    if (document.magistradoPonente !== undefined) data.magistradoPonente = document.magistradoPonente
    if (document.expediente !== undefined) data.expediente = document.expediente
    if (document.salaRevision !== undefined) data.salaRevision = document.salaRevision
    if (document.webOfficialDate !== undefined) data.webOfficialDate = document.webOfficialDate
    if (document.userId !== undefined) data.userId = document.userId

    return data
  }

  /**
   * Mapear modelo de Prisma a tipo Document de la interfaz
   */
  private mapPrismaToDocument(prismaDoc: any): Document {
    return {
      id: prismaDoc.id,
      documentId: prismaDoc.internalId || prismaDoc.externalId, // Mapeo inverso
      externalId: prismaDoc.externalId || '',
      title: prismaDoc.title,
      content: prismaDoc.content,
      fullTextContent: prismaDoc.fullTextContent,
      documentPath: prismaDoc.documentPath,
      summary: prismaDoc.summary || '',
      source: prismaDoc.source,
      url: prismaDoc.url,
      legalArea: prismaDoc.legalArea as LegalArea,
      documentType: prismaDoc.documentType as DocumentType,
      numeroSentencia: prismaDoc.numeroSentencia,
      magistradoPonente: prismaDoc.magistradoPonente,
      expediente: prismaDoc.expediente,
      salaRevision: prismaDoc.salaRevision,
      publicationDate: prismaDoc.publicationDate,
      webOfficialDate: prismaDoc.webOfficialDate,
      extractedAt: prismaDoc.extractedAt || prismaDoc.createdAt,
      status: prismaDoc.status as DocumentStatus,
      userId: prismaDoc.userId,
      metadata: prismaDoc.metadata ? JSON.parse(prismaDoc.metadata) : {},
      createdAt: prismaDoc.createdAt,
      updatedAt: prismaDoc.updatedAt
    }
  }
}
