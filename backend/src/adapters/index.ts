/**
 * Black Box Architecture - Adapters Index
 *
 * Exportación centralizada de todas las interfaces y tipos de adapters
 */

// Storage Adapters
export * from './storage/IDocumentStorage'
export * from './storage/IFileStorage'

// AI Adapters
export * from './ai/IAIProvider'

// Content Adapters
export * from './content/IContentProcessor'

// Metadata Adapters
export * from './metadata/IMetadataExtractor'

// Event Adapters
export * from './events/INotificationBus'
