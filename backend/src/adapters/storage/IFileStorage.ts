/**
 * Interfaz para almacenamiento de archivos físicos
 *
 * PRINCIPIO BLACK BOX:
 * - La implementación (local, S3, MinIO) está oculta
 * - Garantiza que cualquier sistema de archivos puede ser usado
 */

export interface FileMetadata {
  contentType?: string
  size?: number
  originalFilename?: string
  tags?: Record<string, string>
}

export class FileStorageError extends Error {
  constructor(message: string, public override cause?: Error) {
    super(message)
    this.name = 'FileStorageError'
  }
}

export class FileNotFoundError extends FileStorageError {
  constructor(path: string) {
    super(`File not found: ${path}`)
    this.name = 'FileNotFoundError'
  }
}

export interface IFileStorage {
  /**
   * Guardar un archivo desde buffer
   *
   * @param filename - Nombre del archivo (debe incluir extensión)
   * @param buffer - Contenido binario del archivo
   * @param metadata - Metadata opcional del archivo
   * @returns Ruta o URL del archivo guardado
   */
  save(filename: string, buffer: Buffer, metadata?: FileMetadata): Promise<string>

  /**
   * Recuperar un archivo como buffer
   *
   * @param path - Ruta del archivo
   * @returns Buffer del archivo
   * @throws FileNotFoundError si el archivo no existe
   */
  get(path: string): Promise<Buffer>

  /**
   * Verificar si un archivo existe
   *
   * @param path - Ruta del archivo
   * @returns true si existe
   */
  exists(path: string): Promise<boolean>

  /**
   * Eliminar un archivo
   *
   * @param path - Ruta del archivo
   * @returns true si se eliminó, false si no existía
   */
  delete(path: string): Promise<boolean>

  /**
   * Obtener URL pública del archivo (si aplica)
   *
   * @param path - Ruta del archivo
   * @param expiresIn - Duración de la URL (en segundos)
   * @returns URL pública o firmada
   */
  getPublicUrl(path: string, expiresIn?: number): Promise<string>

  /**
   * Listar archivos en un directorio
   *
   * @param directory - Directorio a listar
   * @returns Lista de rutas de archivos
   */
  list(directory: string): Promise<string[]>
}
