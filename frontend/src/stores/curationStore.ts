import { create } from 'zustand'
import { persist } from 'zustand/middleware'

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
  approvedDocuments: Document[]
  rejectedDocuments: Document[]
  readyDocuments: Document[]
  publishedDocuments: Document[]
  archivedDocuments: ArchivedDocument[]
  
  // Actions
  approveDocument: (document: Document) => void
  rejectDocument: (document: Document, reason?: string) => void
  archiveDocument: (document: Document, reason: string, archivedBy: string) => void
  moveToReady: (document: Document, articleData: any) => void
  publishDocument: (docId: string) => void
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
}

export const useCurationStore = create<CurationState>()(
  persist(
    (set, get) => ({
      approvedDocuments: [],
      rejectedDocuments: [],
      readyDocuments: [],
      publishedDocuments: [],
      archivedDocuments: [],

      approveDocument: (document: Document) => {
        const now = new Date().toISOString()
        const approvedDoc = {
          ...document,
          approvedAt: now,
        }

        set((state) => ({
          approvedDocuments: [
            ...state.approvedDocuments.filter(doc => doc.id !== document.id),
            approvedDoc
          ],
          rejectedDocuments: state.rejectedDocuments.filter(doc => doc.id !== document.id),
          readyDocuments: state.readyDocuments.filter(doc => doc.id !== document.id)
        }))
      },

      rejectDocument: (document: Document, reason?: string) => {
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
      },

      archiveDocument: (document: Document, reason: string, archivedBy: string) => {
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
      },

      moveToReady: (document: Document, articleData: any) => {
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
      },

      publishDocument: (docId: string) => {
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
        }
      },

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
      }
    }),
    {
      name: 'curation-storage', // unique name for localStorage key
      // Optionally, you can specify which parts to persist
      partialize: (state) => ({
        approvedDocuments: state.approvedDocuments,
        rejectedDocuments: state.rejectedDocuments,
        readyDocuments: state.readyDocuments,
        publishedDocuments: state.publishedDocuments,
        archivedDocuments: state.archivedDocuments,
      }),
    }
  )
)