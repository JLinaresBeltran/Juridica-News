import { create } from 'zustand'
import { persist, subscribeWithSelector } from 'zustand/middleware'

interface UIPreferences {
  theme: 'light' | 'dark' | 'system'
  sidebarCollapsed: boolean
  splitViewRatio: number
  fontSize: 'small' | 'medium' | 'large'
  autoSaveInterval: number
  showAiConfidence: boolean
}

interface EditorState {
  activeArticleId: string | null
  openArticles: string[]
  pdfZoomLevel: number
  pdfCurrentPage: number
  textEditorCursorPosition?: number
  activeEditorTab: string
}

interface AppState {
  // UI State
  uiPreferences: UIPreferences
  editorState: EditorState
  
  // Loading states
  isLoading: { [key: string]: boolean }
  
  // Actions
  updateUIPreferences: (updates: Partial<UIPreferences>) => void
  updateEditorState: (updates: Partial<EditorState>) => void
  setLoading: (key: string, loading: boolean) => void
  openArticle: (articleId: string) => void
  closeArticle: (articleId: string) => void
  setActiveArticle: (articleId: string) => void
  toggleSidebar: () => void
  setSplitRatio: (ratio: number) => void
}

export const useAppStore = create<AppState>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // Initial state
        uiPreferences: {
          theme: 'system',
          sidebarCollapsed: false,
          splitViewRatio: 0.5,
          fontSize: 'medium',
          autoSaveInterval: 30,
          showAiConfidence: true,
        },
        
        editorState: {
          activeArticleId: null,
          openArticles: [],
          pdfZoomLevel: 1.0,
          pdfCurrentPage: 1,
          activeEditorTab: 'content',
        },
        
        isLoading: {},
        
        // Actions
        updateUIPreferences: (updates) => {
          set(state => ({
            uiPreferences: { ...state.uiPreferences, ...updates }
          }))
        },
        
        updateEditorState: (updates) => {
          set(state => ({
            editorState: { ...state.editorState, ...updates }
          }))
        },
        
        setLoading: (key, loading) => {
          set(state => ({
            isLoading: { ...state.isLoading, [key]: loading }
          }))
        },
        
        openArticle: (articleId) => {
          set(state => {
            const openArticles = state.editorState.openArticles
            if (!openArticles.includes(articleId)) {
              return {
                editorState: {
                  ...state.editorState,
                  openArticles: [...openArticles, articleId],
                  activeArticleId: articleId,
                }
              }
            }
            return {
              editorState: {
                ...state.editorState,
                activeArticleId: articleId,
              }
            }
          })
        },
        
        closeArticle: (articleId) => {
          set(state => {
            const openArticles = state.editorState.openArticles.filter(id => id !== articleId)
            const activeArticleId = state.editorState.activeArticleId === articleId 
              ? openArticles[openArticles.length - 1] || null
              : state.editorState.activeArticleId
            
            return {
              editorState: {
                ...state.editorState,
                openArticles,
                activeArticleId,
              }
            }
          })
        },
        
        setActiveArticle: (articleId) => {
          set(state => ({
            editorState: {
              ...state.editorState,
              activeArticleId: articleId,
            }
          }))
        },
        
        toggleSidebar: () => {
          set(state => ({
            uiPreferences: {
              ...state.uiPreferences,
              sidebarCollapsed: !state.uiPreferences.sidebarCollapsed,
            }
          }))
        },
        
        setSplitRatio: (ratio) => {
          set(state => ({
            uiPreferences: {
              ...state.uiPreferences,
              splitViewRatio: Math.max(0.2, Math.min(0.8, ratio)),
            }
          }))
        },
      }),
      {
        name: 'app-storage',
        partialize: (state) => ({
          uiPreferences: state.uiPreferences,
          editorState: {
            pdfZoomLevel: state.editorState.pdfZoomLevel,
            activeEditorTab: state.editorState.activeEditorTab,
          },
        }),
        version: 1,
      }
    )
  )
)

// Subscribe to theme changes to update document class
useAppStore.subscribe(
  (state) => state.uiPreferences.theme,
  (theme) => {
    const root = document.documentElement
    
    if (theme === 'dark') {
      root.classList.add('dark')
    } else if (theme === 'light') {
      root.classList.remove('dark')
    } else {
      // System theme
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      if (prefersDark) {
        root.classList.add('dark')
      } else {
        root.classList.remove('dark')
      }
    }
  },
  { fireImmediately: true }
)