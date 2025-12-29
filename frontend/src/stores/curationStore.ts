import { create } from 'zustand'
import { persist, subscribeWithSelector } from 'zustand/middleware'
import { api } from '@/services/api' // ✅ FIX: Importar API client
import { documentEvents } from '@/utils/documentEvents' // ✅ Event emitter para notificaciones

interface Document {
  id: string
  source: string
  title: string
  type: string
  publicationDate: string
  identifier: string
  status: 'available' | 'unavailable'
  area: string
  summary?: string
  url?: string
  extractionDate: string
  approvedAt?: string
  rejectedAt?: string
  rejectedReason?: string
  magistradoPonente?: string
  readyAt?: string
  publishedAt?: string
  // ✅ Campos de análisis IA
  numeroSentencia?: string
  salaRevision?: string
  expediente?: string
  temaPrincipal?: string
  resumenIA?: string
  decision?: string
  aiAnalysisStatus?: string
  aiAnalysisDate?: string
  aiModel?: string
  fragmentosAnalisis?: string
  articleData?: {
    title: string
    content: string
    image?: string
    metadata: {
      description: string
      keywords: string[]
      section: string
      customTags?: string[]
      seoTitle?: string
      readingTime?: number
    }
  }
}

interface ArchivedDocument extends Document {
  archivedAt: string
  archivedBy: string
  reason: string
}

interface CurationState {
  // ✅ FIX: Agregar estado de sincronización
  approvedDocuments: Document[]
  rejectedDocuments: Document[]
  readyDocuments: Document[]
  publishedDocuments: Document[]
  archivedDocuments: ArchivedDocument[]
  
  // ✅ FIX: Estados de sincronización
  isLoading: boolean
  lastSync: string | null
  syncError: string | null
  
  // ✅ FIX: Actions híbridas (local + backend)
  approveDocument: (document: Document, syncToBackend?: boolean, articleData?: any) => Promise<void>
  rejectDocument: (document: Document, reason?: string, syncToBackend?: boolean) => Promise<void>
  archiveDocument: (document: Document, reason: string, archivedBy: string, syncToBackend?: boolean) => Promise<void>
  moveToReady: (document: Document, articleData: any, syncToBackend?: boolean) => Promise<void>
  publishDocument: (docId: string, syncToBackend?: boolean) => Promise<void>
  
  // ✅ FIX: Métodos de sincronización
  syncWithBackend: () => Promise<void>
  loadFromBackend: () => Promise<void>
  
  // Original actions (mantener compatibilidad)
  undoApproval: (docId: string) => void
  undoReady: (docId: string) => void
  undoRejection: (docId: string) => void
  restoreFromArchive: (docId: string) => void
  isDocumentApproved: (docId: string) => boolean
  isDocumentRejected: (docId: string) => boolean
  isDocumentArchived: (docId: string) => boolean
  isDocumentReady: (docId: string) => boolean
  isDocumentPublished: (docId: string) => boolean
  clearAll: () => void
  resetToInitialState: () => void
  resetSystemCompletely: () => void
  
  // Refresh methods for event system
  triggerRefresh: () => void
  forceUpdate: () => void
}

export const useCurationStore = create<CurationState>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // Initial state
        approvedDocuments: [],
        rejectedDocuments: [],
        readyDocuments: [],
        publishedDocuments: [],
        archivedDocuments: [],
        
        // ✅ FIX: Estados de sincronización
        isLoading: false,
        lastSync: null,
        syncError: null,

        // ✅ FIX: Nuevo método híbrido approveDocument
        approveDocument: async (document: Document, syncToBackend = true, articleData?: any) => {
          const now = new Date().toISOString()
          const approvedDoc = {
            ...document,
            approvedAt: now,
          }

          // ✅ Actualizar estado local inmediatamente
          set((state) => ({
            approvedDocuments: [
              ...state.approvedDocuments.filter(doc => doc.id !== document.id),
              approvedDoc
            ],
            rejectedDocuments: state.rejectedDocuments.filter(doc => doc.id !== document.id),
            readyDocuments: state.readyDocuments.filter(doc => doc.id !== document.id)
          }))

          // ✅ Sincronizar con backend si está habilitado
          if (syncToBackend) {
            try {
              set({ isLoading: true, syncError: null })

              // Helper function to filter out null/undefined values
              const filterNullValues = (obj: Record<string, any>) => {
                return Object.fromEntries(
                  Object.entries(obj).filter(([_, value]) => value != null && value !== '')
                )
              }

              // ✅ FIX: Incluir datos de IA en la aprobación (filtrar nulls)
              const requestData = {
                action: 'approve',
                // Incluir datos de análisis IA
                aiData: filterNullValues({
                  numeroSentencia: document.numeroSentencia,
                  magistradoPonente: document.magistradoPonente,
                  salaRevision: document.salaRevision,
                  expediente: document.expediente,
                  temaPrincipal: document.temaPrincipal,
                  resumenIA: document.resumenIA,
                  decision: document.decision,
                  aiAnalysisStatus: document.aiAnalysisStatus,
                  aiAnalysisDate: document.aiAnalysisDate,
                  aiModel: document.aiModel,
                  fragmentosAnalisis: document.fragmentosAnalisis
                }),
                // ✅ NEW: Incluir datos del artículo generado si existen (filtrar nulls)
                ...(articleData && {
                  articleData: filterNullValues({
                    title: articleData.title,
                    content: articleData.content,
                    image: articleData.image,
                    keywords: articleData.keywords,
                    metaTitle: articleData.metaTitle,
                    publicationSection: articleData.publicationSection
                  })
                })
              }
              
              
              await api.post(`/documents/${document.id}/curate`, requestData)
              set({
                isLoading: false,
                lastSync: now,
                syncError: null
              })

              // ✅ Emitir evento de aprobación para actualizar contadores
              documentEvents.emit('document:approved')
            } catch (error) {
              console.error('Failed to sync approval with backend:', error)
              set({ 
                isLoading: false,
                syncError: error instanceof Error ? error.message : 'Sync failed'
              })
              // No revertir el estado local - mantener optimistic update
            }
          }
        },

        // ✅ FIX: Métodos de sincronización con backend
        syncWithBackend: async () => {
          try {
            set({ isLoading: true, syncError: null })
            
            // Sincronizar todos los documentos locales con el backend
            const state = get()
            const allLocalDocuments = [
              ...state.approvedDocuments,
              ...state.rejectedDocuments,
              ...state.readyDocuments,
              ...state.publishedDocuments,
            ]
            
            // Enviar actualizaciones batch al backend
            const syncPromises = allLocalDocuments.map(async (doc) => {
              const status = state.approvedDocuments.includes(doc) ? 'APPROVED' :
                            state.rejectedDocuments.includes(doc) ? 'REJECTED' :
                            state.readyDocuments.includes(doc) ? 'READY' :
                            'PUBLISHED'
              
              const action = status === 'APPROVED' ? 'approve' : 'reject'
              return api.post(`/documents/${doc.id}/curate`, {
                action
              })
            })
            
            await Promise.allSettled(syncPromises)
            
            set({ 
              isLoading: false, 
              lastSync: new Date().toISOString(),
              syncError: null
            })
          } catch (error) {
            console.error('Sync with backend failed:', error)
            set({ 
              isLoading: false,
              syncError: error instanceof Error ? error.message : 'Sync failed'
            })
          }
        },

        loadFromBackend: async () => {
          try {
            set({ isLoading: true, syncError: null })
            
            // Cargar documentos por estado desde el backend
            const [approved, rejected, ready, published] = await Promise.all([
              api.get('/documents?status=APPROVED'),
              api.get('/documents?status=REJECTED'),
              api.get('/documents?status=READY'),
              api.get('/documents?status=PUBLISHED'),
            ])
            
            set({
              approvedDocuments: approved.data.data || [],
              rejectedDocuments: rejected.data.data || [],
              readyDocuments: ready.data.data || [],
              publishedDocuments: published.data.data || [],
              isLoading: false,
              lastSync: new Date().toISOString(),
              syncError: null
            })
          } catch (error) {
            console.error('Load from backend failed:', error)
            set({ 
              isLoading: false,
              syncError: error instanceof Error ? error.message : 'Load failed'
            })
          }
        },

        rejectDocument: async (document: Document, reason?: string, syncToBackend = true) => {
          const now = new Date().toISOString()
          const rejectedDoc = {
            ...document,
            rejectedAt: now,
            rejectedReason: reason || 'No se especificó razón'
          }

          set((state) => ({
            rejectedDocuments: [
              ...state.rejectedDocuments.filter(doc => doc.id !== document.id),
              rejectedDoc
            ],
            approvedDocuments: state.approvedDocuments.filter(doc => doc.id !== document.id),
            readyDocuments: state.readyDocuments.filter(doc => doc.id !== document.id)
          }))

          if (syncToBackend) {
            try {
              set({ isLoading: true, syncError: null })

              // Helper function to filter out null/undefined values
              const filterNullValues = (obj: Record<string, any>) => {
                return Object.fromEntries(
                  Object.entries(obj).filter(([_, value]) => value != null && value !== '')
                )
              }

              await api.post(`/documents/${document.id}/curate`, {
                action: 'reject',
                notes: reason,
                // ✅ FIX: Incluir datos de IA también en el rechazo (filtrar nulls)
                aiData: filterNullValues({
                  numeroSentencia: document.numeroSentencia,
                  magistradoPonente: document.magistradoPonente,
                  salaRevision: document.salaRevision,
                  expediente: document.expediente,
                  temaPrincipal: document.temaPrincipal,
                  resumenIA: document.resumenIA,
                  decision: document.decision,
                  aiAnalysisStatus: document.aiAnalysisStatus,
                  aiAnalysisDate: document.aiAnalysisDate,
                  aiModel: document.aiModel,
                  fragmentosAnalisis: document.fragmentosAnalisis
                })
              })
              set({
                isLoading: false,
                lastSync: now,
                syncError: null
              })

              // ✅ Emitir evento de rechazo para actualizar contadores
              documentEvents.emit('document:rejected')
            } catch (error) {
              console.error('Failed to sync rejection with backend:', error)
              set({ 
                isLoading: false,
                syncError: error instanceof Error ? error.message : 'Sync failed'
              })
            }
          }
        },

        archiveDocument: async (document: Document, reason: string, archivedBy: string, syncToBackend = true) => {
          const now = new Date().toISOString()
          const archivedDoc = {
            ...document,
            archivedAt: now,
            archivedBy,
            reason
          }

          set((state) => ({
            archivedDocuments: [
              ...state.archivedDocuments.filter(doc => doc.id !== document.id),
              archivedDoc
            ],
            approvedDocuments: state.approvedDocuments.filter(doc => doc.id !== document.id),
            rejectedDocuments: state.rejectedDocuments.filter(doc => doc.id !== document.id),
            readyDocuments: state.readyDocuments.filter(doc => doc.id !== document.id)
          }))

          if (syncToBackend) {
            try {
              set({ isLoading: true, syncError: null })
              await api.put(`/documents/${document.id}`, {
                status: 'ARCHIVED',
                lastReviewDate: now,
                archiveReason: reason
              })
              set({ 
                isLoading: false, 
                lastSync: now,
                syncError: null
              })
            } catch (error) {
              console.error('Failed to sync archive with backend:', error)
              set({ 
                isLoading: false,
                syncError: error instanceof Error ? error.message : 'Sync failed'
              })
            }
          }
        },

        moveToReady: async (document: Document, articleData: any, syncToBackend = true) => {
          const now = new Date().toISOString()

          // Helper function to filter out null/undefined values
          const filterNullValues = (obj: Record<string, any>) => {
            return Object.fromEntries(
              Object.entries(obj).filter(([_, value]) => value != null && value !== '')
            )
          }

          // ✅ FIX: Hacer la llamada API PRIMERO (esto es lo importante)
          if (syncToBackend) {
            try {
              set({ isLoading: true, syncError: null })

              await api.post(`/documents/${document.id}/curate`, {
                action: 'approve',
                // Incluir datos de análisis IA del documento (filtrar nulls)
                aiData: filterNullValues({
                  numeroSentencia: document.numeroSentencia,
                  magistradoPonente: document.magistradoPonente,
                  salaRevision: document.salaRevision,
                  expediente: document.expediente,
                  temaPrincipal: document.temaPrincipal,
                  resumenIA: document.resumenIA,
                  decision: document.decision,
                  aiAnalysisStatus: document.aiAnalysisStatus,
                  aiAnalysisDate: document.aiAnalysisDate,
                  aiModel: document.aiModel,
                  fragmentosAnalisis: document.fragmentosAnalisis
                }),
                // Incluir datos del artículo generado para que se cree automáticamente
                articleData: filterNullValues({
                  title: articleData?.title || document.title,
                  content: articleData?.content || '',
                  image: articleData?.image,
                  imageId: articleData?.imageId,
                  keywords: articleData?.metadata?.keywords?.join(', ') || '',
                  metaTitle: articleData?.metadata?.seoTitle || articleData?.title || document.title,
                  publicationSection: articleData?.metadata?.section?.toLowerCase() || 'constitucional'
                })
              })

              console.log('✅ Backend actualizado correctamente')

              // ✅ FIX: LUEGO actualizar estado local (con manejo de QuotaExceeded)
              // Crear versión ligera del documento para localStorage
              const lightArticleData = {
                title: articleData?.title,
                contentPreview: articleData?.content?.substring(0, 200) || '',
                // NO guardar imagen completa en localStorage (muy grande)
                hasImage: !!articleData?.image,
                metadata: articleData?.metadata ? {
                  section: articleData.metadata.section,
                  keywords: articleData.metadata.keywords?.slice(0, 5) // Solo primeras 5 keywords
                } : undefined
              }

              // Crear documento listo sin campos pesados
              const { fragmentosAnalisis, ...documentWithoutFragmentos } = document
              const readyDoc: Document = {
                ...documentWithoutFragmentos,
                readyAt: now,
                articleData: lightArticleData as any, // Versión ligera para localStorage
                // Truncar resumenIA si es muy largo
                resumenIA: document.resumenIA?.substring(0, 500)
              }

              try {
                set((state) => ({
                  readyDocuments: [
                    ...state.readyDocuments.filter(doc => doc.id !== document.id),
                    readyDoc
                  ],
                  approvedDocuments: state.approvedDocuments.filter(doc => doc.id !== document.id),
                  isLoading: false,
                  lastSync: now,
                  syncError: null
                }))
              } catch (storageError) {
                // Si falla por QuotaExceeded, limpiar localStorage y reintentar
                if (storageError instanceof Error && storageError.name === 'QuotaExceededError') {
                  console.warn('⚠️ localStorage lleno, limpiando datos antiguos...')

                  // Limpiar drafts de artículos
                  Object.keys(localStorage).forEach(key => {
                    if (key.startsWith('article-draft-')) {
                      localStorage.removeItem(key)
                    }
                  })

                  // Reintentar con datos mínimos
                  set((state) => ({
                    readyDocuments: [], // Limpiar readyDocuments (se cargarán de la API)
                    approvedDocuments: state.approvedDocuments.filter(doc => doc.id !== document.id),
                    isLoading: false,
                    lastSync: now,
                    syncError: null
                  }))
                } else {
                  throw storageError
                }
              }

              // Emitir evento de artículo listo para actualizar contadores
              setTimeout(() => {
                console.debug('📡 Emitiendo evento document:ready después de crear artículo')
                documentEvents.emit('document:ready')
              }, 500)

            } catch (error) {
              console.error('Failed to sync ready status with backend:', error)
              set({
                isLoading: false,
                syncError: error instanceof Error ? error.message : 'Sync failed'
              })
              throw error // Re-lanzar para que el caller lo maneje
            }
          }
        },

        publishDocument: async (docId: string, syncToBackend = true) => {
          const readyDoc = get().readyDocuments.find(doc => doc.id === docId)
          if (readyDoc) {
            const now = new Date().toISOString()
            const publishedDoc = {
              ...readyDoc,
              publishedAt: now
            }

            set((state) => ({
              publishedDocuments: [
                ...state.publishedDocuments.filter(doc => doc.id !== docId),
                publishedDoc
              ],
              readyDocuments: state.readyDocuments.filter(doc => doc.id !== docId)
            }))

            if (syncToBackend) {
              try {
                set({ isLoading: true, syncError: null })
                await api.put(`/documents/${docId}`, {
                  status: 'PUBLISHED',
                  publishedAt: now
                })
                set({
                  isLoading: false,
                  lastSync: now,
                  syncError: null
                })

                // ✅ Emitir evento de publicación para actualizar contadores
                documentEvents.emit('document:published')
              } catch (error) {
                console.error('Failed to sync publish with backend:', error)
                set({ 
                  isLoading: false,
                  syncError: error instanceof Error ? error.message : 'Sync failed'
                })
              }
            }
          }
        },

        // Original methods (maintaining compatibility)
        undoApproval: (docId: string) => {
          set((state) => ({
            approvedDocuments: state.approvedDocuments.filter(doc => doc.id !== docId)
          }))
        },

        undoReady: (docId: string) => {
          const readyDoc = get().readyDocuments.find(doc => doc.id === docId)
          if (readyDoc) {
            // Restaurar a documentos aprobados
            const { readyAt, articleData, ...restoredDoc } = readyDoc
            set((state) => ({
              readyDocuments: state.readyDocuments.filter(doc => doc.id !== docId),
              approvedDocuments: [...state.approvedDocuments, restoredDoc]
            }))
          }
        },

        undoRejection: (docId: string) => {
          set((state) => ({
            rejectedDocuments: state.rejectedDocuments.filter(doc => doc.id !== docId)
          }))
        },

        restoreFromArchive: (docId: string) => {
          const archivedDoc = get().archivedDocuments.find(doc => doc.id === docId)
          if (archivedDoc) {
            // Restaurar a documentos aprobados
            const restoredDoc = {
              id: archivedDoc.id,
              source: archivedDoc.source,
              title: archivedDoc.title,
              type: archivedDoc.type,
              publicationDate: archivedDoc.publicationDate,
              identifier: archivedDoc.identifier,
              status: archivedDoc.status,
              area: archivedDoc.area,
              summary: archivedDoc.summary,
              url: archivedDoc.url,
              extractionDate: archivedDoc.extractionDate,
              approvedAt: archivedDoc.approvedAt,
              magistradoPonente: archivedDoc.magistradoPonente
            }

            set((state) => ({
              archivedDocuments: state.archivedDocuments.filter(doc => doc.id !== docId),
              approvedDocuments: [...state.approvedDocuments, restoredDoc]
            }))
          }
        },

        isDocumentApproved: (docId: string) => {
          return get().approvedDocuments.some(doc => doc.id === docId)
        },

        isDocumentRejected: (docId: string) => {
          return get().rejectedDocuments.some(doc => doc.id === docId)
        },

        isDocumentArchived: (docId: string) => {
          return get().archivedDocuments.some(doc => doc.id === docId)
        },

        isDocumentReady: (docId: string) => {
          return get().readyDocuments.some(doc => doc.id === docId)
        },

        isDocumentPublished: (docId: string) => {
          return get().publishedDocuments.some(doc => doc.id === docId)
        },

        clearAll: () => {
          set({
            approvedDocuments: [],
            rejectedDocuments: [],
            readyDocuments: [],
            publishedDocuments: [],
            archivedDocuments: []
          })
        },

        resetToInitialState: () => {
          // Limpiar localStorage
          localStorage.removeItem('curation-storage')
          // Resetear estado
          set({
            approvedDocuments: [],
            rejectedDocuments: [],
            readyDocuments: [],
            publishedDocuments: [],
            archivedDocuments: []
          })
        },

        // FUNCIÓN TEMPORAL - Reset completo del sistema
        resetSystemCompletely: () => {
          // Limpiar todos los datos persistentes relacionados con curación
          localStorage.removeItem('curation-storage')
          
          // Limpiar otros posibles datos en localStorage relacionados al sistema
          const keysToRemove = [
            'auth-storage',      // Datos de autenticación (excepto token actual)
            'app-storage',       // Estado general de la aplicación
            'preferences-storage', // Preferencias de usuario
            'temp-data-storage'  // Datos temporales
          ]
          
          keysToRemove.forEach(key => {
            try {
              localStorage.removeItem(key)
            } catch (error) {
              console.warn(`Failed to remove ${key} from localStorage:`, error)
            }
          })
          
          // Resetear completamente el estado de curación
          set({
            approvedDocuments: [],
            rejectedDocuments: [],
            readyDocuments: [],
            publishedDocuments: [],
            archivedDocuments: []
          })
          
        },

        // Refresh methods for event system
        triggerRefresh: () => {
          // Force a re-render by updating a timestamp
          set((state) => ({ ...state }))
        },

        forceUpdate: () => {
          // Force update all components using this store
          set((state) => ({ 
            ...state,
            // Add a timestamp to ensure state change is detected
            _lastUpdate: Date.now() 
          }))
        }
      }),
      {
        name: 'curation-storage',
        partialize: (state) => {
          // ✅ FIX: Función helper para eliminar campos pesados y evitar QuotaExceeded
          const stripHeavyFields = (docs: Document[]) => {
            return docs.map(doc => {
              // Crear una copia limpia del documento
              const cleanDoc = { ...doc }

              // Eliminar campos pesados directamente del documento
              if (cleanDoc.resumenIA && cleanDoc.resumenIA.length > 500) {
                cleanDoc.resumenIA = cleanDoc.resumenIA.substring(0, 500)
              }
              delete (cleanDoc as any).fragmentosAnalisis

              // Si tiene articleData, limpiar campos pesados
              if (cleanDoc.articleData) {
                const { content, image, ...restArticleData } = cleanDoc.articleData as any
                cleanDoc.articleData = {
                  ...restArticleData,
                  // Solo guardar preview del contenido
                  contentPreview: content?.substring?.(0, 200) || restArticleData.contentPreview,
                  // NO guardar imagen (muy grande, especialmente base64)
                  hasImage: !!image || restArticleData.hasImage
                }
              }

              return cleanDoc
            })
          }

          // Limitar cantidad de documentos en cada categoría para evitar overflow
          const MAX_DOCS_PER_CATEGORY = 20

          return {
            approvedDocuments: stripHeavyFields(state.approvedDocuments).slice(0, MAX_DOCS_PER_CATEGORY),
            rejectedDocuments: stripHeavyFields(state.rejectedDocuments).slice(0, MAX_DOCS_PER_CATEGORY),
            readyDocuments: stripHeavyFields(state.readyDocuments).slice(0, MAX_DOCS_PER_CATEGORY),
            publishedDocuments: stripHeavyFields(state.publishedDocuments).slice(0, MAX_DOCS_PER_CATEGORY),
            archivedDocuments: stripHeavyFields(state.archivedDocuments as Document[]).slice(0, MAX_DOCS_PER_CATEGORY) as ArchivedDocument[],
            // Persistir información de sincronización
            lastSync: state.lastSync,
            // No persistir isLoading ni syncError (son estados temporales)
          }
        },
        version: 4, // ✅ Increment version to trigger aggressive cleanup
        migrate: (persistedState: any, version) => {
          if (version === 0 || version === 1 || version === 2 || version === 3) {
            // ✅ Migración AGRESIVA: limpiar campos pesados y resetear si es necesario
            console.warn('🔄 Migrando curationStore a v4 - LIMPIEZA AGRESIVA de campos pesados...')

            // Si el estado es muy grande, resetearlo completamente
            try {
              const stateSize = JSON.stringify(persistedState).length
              console.log(`📊 Tamaño del estado anterior: ${(stateSize / 1024).toFixed(2)} KB`)

              if (stateSize > 500000) { // Si es mayor a 500KB, resetear
                console.warn('⚠️ Estado demasiado grande (>500KB), reseteando completamente...')
                return {
                  approvedDocuments: [],
                  rejectedDocuments: [],
                  readyDocuments: [],
                  publishedDocuments: [],
                  archivedDocuments: [],
                  lastSync: null,
                  isLoading: false,
                  syncError: null,
                }
              }
            } catch (e) {
              console.error('Error calculando tamaño del estado, reseteando...', e)
              return {
                approvedDocuments: [],
                rejectedDocuments: [],
                readyDocuments: [],
                publishedDocuments: [],
                archivedDocuments: [],
                lastSync: null,
                isLoading: false,
                syncError: null,
              }
            }

            const stripHeavyFields = (docs: any[]) => {
              if (!Array.isArray(docs)) return []
              return docs.map(doc => {
                if (doc.articleData?.content) {
                  const { content, ...restArticleData } = doc.articleData
                  return {
                    ...doc,
                    articleData: {
                      ...restArticleData,
                      contentPreview: content.substring(0, 200)
                    }
                  }
                }
                return doc
              })
            }

            return {
              approvedDocuments: stripHeavyFields(persistedState.approvedDocuments || []),
              rejectedDocuments: stripHeavyFields(persistedState.rejectedDocuments || []),
              readyDocuments: stripHeavyFields(persistedState.readyDocuments || []),
              publishedDocuments: stripHeavyFields(persistedState.publishedDocuments || []),
              archivedDocuments: stripHeavyFields(persistedState.archivedDocuments || []),
              lastSync: persistedState.lastSync || null,
              isLoading: false,
              syncError: null,
            }
          }
          return persistedState
        },
      }
    )
  )
)