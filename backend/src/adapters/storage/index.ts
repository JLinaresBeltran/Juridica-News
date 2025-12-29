/**
 * Barrel file para exportar todos los adapters de storage
 *
 * PRINCIPIO BLACK BOX:
 * - Facilita imports: import { PrismaDocumentStorage } from '@/adapters/storage'
 * - Punto central de exportación para todos los adapters
 */

// Interfaces
export * from './IDocumentStorage';
export * from './IFileStorage';

// Implementaciones de producción
export { PrismaDocumentStorage } from './PrismaDocumentStorage';
export { LocalFileStorage } from './LocalFileStorage';

// Implementaciones para testing
export { InMemoryDocumentStorage } from './InMemoryDocumentStorage';
export { InMemoryFileStorage } from './InMemoryFileStorage';
