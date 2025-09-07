import { create } from 'zustand'
import { persist, subscribeWithSelector } from 'zustand/middleware'
import { api } from '@/services/api' // ✅ FIX: Importar API client

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
  approveDocument: (document: Document, syncToBackend?: boolean) => Promise<void>
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
        approveDocument: async (document: Document, syncToBackend = true) => {
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
              await api.put(`/documents/${document.id}`, {
                status: 'APPROVED',
                lastReviewDate: now,
              })
              set({ 
                isLoading: false, 
                lastSync: now,
                syncError: null
              })
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
              
              return api.put(`/documents/${doc.id}`, {
                status,
                lastReviewDate: new Date().toISOString(),
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
              await api.put(`/documents/${document.id}`, {
                status: 'REJECTED',
                lastReviewDate: now,
                rejectionReason: reason
              })
              set({ 
                isLoading: false, 
                lastSync: now,
                syncError: null
              })
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
          const readyDoc = {
            ...document,
            readyAt: now,
            articleData
          }

          set((state) => ({
            readyDocuments: [
              ...state.readyDocuments.filter(doc => doc.id !== document.id),
              readyDoc
            ],
            approvedDocuments: state.approvedDocuments.filter(doc => doc.id !== document.id)
          }))

          if (syncToBackend) {
            try {
              set({ isLoading: true, syncError: null })
              await api.put(`/documents/${document.id}`, {
                status: 'READY',
                lastReviewDate: now,
                articleData
              })
              set({ 
                isLoading: false, 
                lastSync: now,
                syncError: null
              })
            } catch (error) {
              console.error('Failed to sync ready status with backend:', error)
              set({ 
                isLoading: false,
                syncError: error instanceof Error ? error.message : 'Sync failed'
              })
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
          
          console.warn('🧹 FUNCIÓN TEMPORAL: Store de curación reseteado completamente')
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
        partialize: (state) => ({
          approvedDocuments: state.approvedDocuments,
          rejectedDocuments: state.rejectedDocuments,
          readyDocuments: state.readyDocuments,
          publishedDocuments: state.publishedDocuments,
          archivedDocuments: state.archivedDocuments,
          // ✅ FIX: Persistir información de sincronización
          lastSync: state.lastSync,
          // No persistir isLoading ni syncError (son estados temporales)
        }),
        version: 2, // ✅ Increment version for migration
        migrate: (persistedState: any, version) => {
          if (version === 0 || version === 1) {
            return {
              ...persistedState,
              lastSync: null,
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