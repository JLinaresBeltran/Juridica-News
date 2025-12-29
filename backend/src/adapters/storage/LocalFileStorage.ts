/**
 * Implementación de IFileStorage para almacenamiento local
 *
 * PRINCIPIO BLACK BOX:
 * - Toda la lógica del sistema de archivos está encapsulada aquí
 * - El resto del sistema solo conoce la interfaz IFileStorage
 * - Cambiar a S3/MinIO = implementar otra clase con la misma interfaz
 */

import * as fs from 'fs/promises'
import * as path from 'path'
import {
  IFileStorage,
  FileMetadata,
  FileStorageError,
  FileNotFoundError
} from './IFileStorage'

export class LocalFileStorage implements IFileStorage {
  constructor(private basePath: string) {
    // Crear directorio base si no existe (se hará en init)
  }

  /**
   * Inicializar el storage (crear directorio base)
   */
  async init(): Promise<void> {
    try {
      await fs.mkdir(this.basePath, { recursive: true })
    } catch (error) {
      throw new FileStorageError(
        `Error al crear directorio base: ${this.basePath}`,
        error instanceof Error ? error : undefined
      )
    }
  }

  /**
   * Guardar un archivo desde buffer
   */
  async save(filename: string, buffer: Buffer, metadata?: FileMetadata): Promise<string> {
    try {
      // Asegurar que el directorio base existe
      await fs.mkdir(this.basePath, { recursive: true })

      // Generar ruta completa
      const filePath = path.join(this.basePath, filename)

      // Crear subdirectorios si es necesario
      const directory = path.dirname(filePath)
      await fs.mkdir(directory, { recursive: true })

      // Guardar archivo
      await fs.writeFile(filePath, buffer)

      // Si hay metadata, guardarla en archivo JSON separado
      if (metadata) {
        const metadataPath = `${filePath}.meta.json`
        await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2))
      }

      // Retornar ruta relativa al basePath
      return path.relative(this.basePath, filePath)
    } catch (error) {
      throw new FileStorageError(
        `Error al guardar archivo ${filename}: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        error instanceof Error ? error : undefined
      )
    }
  }

  /**
   * Recuperar un archivo como buffer
   */
  async get(filePath: string): Promise<Buffer> {
    try {
      const fullPath = this.resolveFullPath(filePath)

      // Verificar que el archivo existe
      await fs.access(fullPath)

      // Leer y retornar buffer
      return await fs.readFile(fullPath)
    } catch (error) {
      if ((error as any)?.code === 'ENOENT') {
        throw new FileNotFoundError(filePath)
      }
      throw new FileStorageError(
        `Error al leer archivo ${filePath}: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        error instanceof Error ? error : undefined
      )
    }
  }

  /**
   * Verificar si un archivo existe
   */
  async exists(filePath: string): Promise<boolean> {
    try {
      const fullPath = this.resolveFullPath(filePath)
      await fs.access(fullPath)
      return true
    } catch {
      return false
    }
  }

  /**
   * Eliminar un archivo
   */
  async delete(filePath: string): Promise<boolean> {
    try {
      const fullPath = this.resolveFullPath(filePath)

      // Eliminar archivo
      await fs.unlink(fullPath)

      // Eliminar metadata si existe
      const metadataPath = `${fullPath}.meta.json`
      try {
        await fs.unlink(metadataPath)
      } catch {
        // Ignorar si no existe metadata
      }

      return true
    } catch (error) {
      if ((error as any)?.code === 'ENOENT') {
        return false // No existía
      }
      throw new FileStorageError(
        `Error al eliminar archivo ${filePath}: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        error instanceof Error ? error : undefined
      )
    }
  }

  /**
   * Obtener URL pública del archivo
   * Para almacenamiento local, retorna la ruta del archivo
   */
  async getPublicUrl(filePath: string, expiresIn?: number): Promise<string> {
    const fullPath = this.resolveFullPath(filePath)

    // Verificar que existe
    if (!(await this.exists(filePath))) {
      throw new FileNotFoundError(filePath)
    }

    // Para almacenamiento local, retornar la ruta absoluta
    // En producción con S3/MinIO, aquí se generaría una URL firmada
    return `file://${fullPath}`
  }

  /**
   * Listar archivos en un directorio
   */
  async list(directory: string): Promise<string[]> {
    try {
      const fullPath = this.resolveFullPath(directory)

      // Verificar que el directorio existe
      const stats = await fs.stat(fullPath)
      if (!stats.isDirectory()) {
        throw new FileStorageError(`La ruta ${directory} no es un directorio`)
      }

      // Leer contenido del directorio
      const entries = await fs.readdir(fullPath, { withFileTypes: true })

      // Filtrar solo archivos (excluir .meta.json)
      const files = entries
        .filter(entry => entry.isFile() && !entry.name.endsWith('.meta.json'))
        .map(entry => path.join(directory, entry.name))

      return files
    } catch (error) {
      if ((error as any)?.code === 'ENOENT') {
        return [] // Directorio no existe, retornar array vacío
      }
      throw new FileStorageError(
        `Error al listar archivos en ${directory}: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        error instanceof Error ? error : undefined
      )
    }
  }

  /**
   * Obtener metadata de un archivo
   */
  async getMetadata(filePath: string): Promise<FileMetadata | null> {
    try {
      const fullPath = this.resolveFullPath(filePath)
      const metadataPath = `${fullPath}.meta.json`

      const metadataContent = await fs.readFile(metadataPath, 'utf-8')
      return JSON.parse(metadataContent)
    } catch {
      return null // No hay metadata
    }
  }

  /**
   * Resolver ruta completa desde ruta relativa
   */
  private resolveFullPath(filePath: string): string {
    // Si ya es una ruta absoluta dentro de basePath, retornarla
    if (path.isAbsolute(filePath) && filePath.startsWith(this.basePath)) {
      return filePath
    }

    // Si es relativa, combinar con basePath
    return path.join(this.basePath, filePath)
  }

  /**
   * Obtener información del archivo (size, tipo, etc)
   */
  async getFileInfo(filePath: string): Promise<{
    size: number
    created: Date
    modified: Date
    isFile: boolean
    isDirectory: boolean
  }> {
    try {
      const fullPath = this.resolveFullPath(filePath)
      const stats = await fs.stat(fullPath)

      return {
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        isFile: stats.isFile(),
        isDirectory: stats.isDirectory()
      }
    } catch (error) {
      if ((error as any)?.code === 'ENOENT') {
        throw new FileNotFoundError(filePath)
      }
      throw new FileStorageError(
        `Error al obtener información del archivo ${filePath}`,
        error instanceof Error ? error : undefined
      )
    }
  }
}
