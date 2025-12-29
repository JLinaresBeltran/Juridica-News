/**
 * Implementación en memoria de IFileStorage para testing
 *
 * PRINCIPIO BLACK BOX:
 * - Tests no necesitan sistema de archivos real
 * - Misma interfaz que LocalFileStorage
 * - Perfecto para tests unitarios rápidos
 */

import {
  IFileStorage,
  FileMetadata,
  FileNotFoundError
} from './IFileStorage'

interface StoredFile {
  buffer: Buffer
  metadata?: FileMetadata
  createdAt: Date
}

export class InMemoryFileStorage implements IFileStorage {
  private files: Map<string, StoredFile> = new Map()

  /**
   * Guardar un archivo
   */
  async save(filename: string, buffer: Buffer, metadata?: FileMetadata): Promise<string> {
    const storedFile: StoredFile = {
      buffer: Buffer.from(buffer), // Copiar buffer
      createdAt: new Date()
    }

    if (metadata !== undefined) {
      storedFile.metadata = metadata
    }

    this.files.set(filename, storedFile)

    return filename
  }

  /**
   * Obtener un archivo
   */
  async get(path: string): Promise<Buffer> {
    const file = this.files.get(path)

    if (!file) {
      throw new FileNotFoundError(path)
    }

    return Buffer.from(file.buffer) // Retornar copia
  }

  /**
   * Verificar existencia
   */
  async exists(path: string): Promise<boolean> {
    return this.files.has(path)
  }

  /**
   * Eliminar archivo
   */
  async delete(path: string): Promise<boolean> {
    return this.files.delete(path)
  }

  /**
   * Obtener URL pública (simulada)
   */
  async getPublicUrl(path: string, expiresIn?: number): Promise<string> {
    if (!this.files.has(path)) {
      throw new FileNotFoundError(path)
    }

    return `memory://${path}`
  }

  /**
   * Listar archivos en directorio
   */
  async list(directory: string): Promise<string[]> {
    const files: string[] = []

    for (const [path] of this.files) {
      // Simular listado de directorio
      if (path.startsWith(directory)) {
        files.push(path)
      }
    }

    return files
  }

  /**
   * Métodos auxiliares para testing
   */

  /**
   * Limpiar todos los archivos
   */
  clear(): void {
    this.files.clear()
  }

  /**
   * Obtener cantidad de archivos
   */
  size(): number {
    return this.files.size
  }

  /**
   * Verificar si está vacío
   */
  isEmpty(): boolean {
    return this.files.size === 0
  }

  /**
   * Obtener metadata de un archivo
   */
  getMetadata(path: string): FileMetadata | undefined {
    return this.files.get(path)?.metadata
  }

  /**
   * Obtener todos los archivos (para debugging en tests)
   */
  getAllFiles(): Map<string, StoredFile> {
    return new Map(this.files)
  }
}
