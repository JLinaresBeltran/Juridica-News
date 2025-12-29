# CLAUDE.md - Frontend

Guía específica para Claude Code cuando trabaje con el frontend del **Sistema Editorial Jurídico Supervisado**.

---

## 📋 Índice

1. [Visión General](#-visión-general)
2. [Stack Tecnológico](#-stack-tecnológico)
3. [Estructura del Proyecto](#-estructura-del-proyecto)
4. [Comandos Esenciales](#-comandos-esenciales)
5. [Sistema de Estado (Zustand)](#-sistema-de-estado-zustand)
6. [Rutas y Navegación](#-rutas-y-navegación)
7. [Servicios y API](#-servicios-y-api)
8. [Componentes Principales](#-componentes-principales)
9. [Sistema de Generación de Contenido](#-sistema-de-generación-de-contenido)
10. [Portal Público](#-portal-público)
11. [Autenticación](#-autenticación)
12. [Estilos y UI](#-estilos-y-ui)
13. [Hooks Personalizados](#-hooks-personalizados)
14. [Sistema de Sincronización por Eventos](#-sistema-de-sincronización-por-eventos)
15. [Guías de Desarrollo](#-guías-de-desarrollo)
16. [Troubleshooting](#-troubleshooting)

---

## 🎯 Visión General

El frontend es una **Single Page Application (SPA)** construida con **React 18 + TypeScript + Vite** que proporciona:

- ✅ **Dashboard administrativo** - Gestión de documentos, artículos y contenido
- ✅ **Sistema de curación** - Aprobación y rechazo de documentos extraídos
- ✅ **Generación de contenido AI** - Artículos, títulos e imágenes con IA
- ✅ **Portal público** - 9 secciones legales con artículos publicados
- ✅ **Editor de artículos** - Editor WYSIWYG con Tiptap
- ✅ **Biblioteca de imágenes** - Gestión y reutilización de imágenes AI
- ✅ **Notificaciones en tiempo real** - SSE para progreso de extracción
- ✅ **Autenticación JWT** - Login con refresh tokens

**Estado actual**: Funcional al 82% - Sistema completo de curación, generación y publicación operativo.

---

## 🛠️ Stack Tecnológico

### Core
- **React 18.2** - Biblioteca UI con hooks y concurrent features
- **TypeScript 5.2** - Tipado estático
- **Vite 5.0** - Build tool ultra-rápido con HMR
- **React Router 6.20** - Enrutamiento SPA

### Estado y Data Fetching
- **Zustand 4.4** - State management minimalista y reactivo
- **TanStack Query 5.13** - Server state, caching, y sincronización
- **Axios 1.6** - Cliente HTTP con interceptores

### UI y Estilos
- **Tailwind CSS 3.3** - Utility-first CSS framework
- **Headless UI 1.7** - Componentes accesibles sin estilos
- **Lucide React 0.302** - Iconos modernos
- **Framer Motion 10.16** - Animaciones fluidas
- **clsx / tailwind-merge** - Composición de clases CSS

### Formularios y Validación
- **React Hook Form 7.48** - Formularios performantes
- **Zod 3.22** - Validación de schemas TypeScript-first
- **@hookform/resolvers** - Integración RHF + Zod

### Editores Rich Text
- **Tiptap 2.1** - Editor WYSIWYG headless
  - `@tiptap/react` - Core React
  - `@tiptap/starter-kit` - Extensiones básicas
  - `@tiptap/extension-link` - Links
  - `@tiptap/extension-image` - Imágenes
  - `@tiptap/extension-table` - Tablas

### Utilidades
- **date-fns 3.0** - Manipulación de fechas
- **react-hot-toast 2.4** - Notificaciones toast
- **react-dropzone 14.2** - Upload de archivos drag & drop
- **react-window 1.8** - Virtualización de listas largas

### Testing
- **Vitest 1.0** - Test runner compatible con Vite
- **@testing-library/react 14.1** - Testing centrado en usuario
- **@vitest/ui** - UI para tests
- **jsdom** - DOM en Node.js para tests

### Dev Tools
- **ESLint 8.55** - Linting de código
- **@tanstack/react-query-devtools** - Devtools para React Query
- **TypeScript ESLint** - Reglas de linting TypeScript

---

## 📁 Estructura del Proyecto

```
frontend/
├── src/
│   ├── components/                    # 🧩 Componentes React
│   │   ├── auth/                      # Autenticación
│   │   │   └── ProtectedRoute.tsx     # HOC para rutas protegidas
│   │   │
│   │   ├── layout/                    # Layout principal
│   │   │   ├── MainLayout.tsx         # Container principal con sidebar
│   │   │   ├── Header.tsx             # Header con usuario y notificaciones
│   │   │   └── Sidebar.tsx            # Navegación lateral
│   │   │
│   │   ├── curation/                  # Sistema de curación
│   │   │   └── DocumentPreviewModal.tsx  # Modal multi-paso para curación
│   │   │
│   │   ├── generator/                 # Generadores de contenido AI
│   │   │   ├── ArticleGenerator.tsx   # Generación de artículos
│   │   │   ├── TitleGenerator.tsx     # Generación de títulos
│   │   │   ├── ImageGenerator.tsx     # Generación de imágenes
│   │   │   ├── ImageLibraryModal.tsx  # Biblioteca de imágenes
│   │   │   ├── SaveToLibraryModal.tsx # Guardar imagen en biblioteca
│   │   │   ├── MetadataEditor.tsx     # Editor de metadata SEO
│   │   │   └── PublishingPreview.tsx  # Preview antes de publicar
│   │   │
│   │   ├── articles/                  # Gestión de artículos
│   │   │   └── PublicationControls.tsx # Controles de publicación
│   │   │
│   │   ├── public/                    # Portal público
│   │   │   ├── PublicHeader.tsx       # Header del portal
│   │   │   ├── PublicFooter.tsx       # Footer del portal
│   │   │   ├── ArticleCard.tsx        # Card de artículo
│   │   │   ├── SectionPage.tsx        # Template de sección
│   │   │   └── WeeklyHighlights.tsx   # Destacados de la semana
│   │   │
│   │   ├── scraping/                  # Sistema de extracción
│   │   │   └── ScrapingProgressModal.tsx # Modal de progreso con SSE
│   │   │
│   │   ├── seo/                       # Componentes SEO
│   │   │   ├── SEOHead.tsx            # Meta tags dinámicos
│   │   │   └── SEOImage.tsx           # Imágenes optimizadas SEO
│   │   │
│   │   ├── common/                    # Componentes compartidos
│   │   │   ├── ModelSelector.tsx      # Selector de modelo AI
│   │   │   └── ImageModelSelector.tsx # Selector de modelo de imagen
│   │   │
│   │   └── ui/                        # Componentes UI base
│   │       ├── LoadingSpinner.tsx     # Spinner de carga
│   │       └── ResponsiveImage.tsx    # Imagen responsive
│   │
│   ├── pages/                         # 📄 Páginas/Vistas
│   │   ├── auth/
│   │   │   └── LoginPage.tsx          # Página de login
│   │   │
│   │   ├── dashboard/
│   │   │   └── DashboardPage.tsx      # Dashboard principal
│   │   │
│   │   ├── curation/
│   │   │   ├── CurationPage.tsx       # Lista de documentos pendientes
│   │   │   └── ApprovedDocumentsPage.tsx # Documentos aprobados
│   │   │
│   │   ├── articles/
│   │   │   ├── ArticleRouter.tsx      # Router de artículos
│   │   │   ├── ArticlesPage.tsx       # Lista de artículos
│   │   │   ├── ArticleEditorPage.tsx  # Editor de artículos
│   │   │   ├── PublishedArticlesPage.tsx # Artículos publicados
│   │   │   └── ArchivedArticlesPage.tsx  # Artículos archivados
│   │   │
│   │   └── public/                    # Portal público
│   │       ├── PublicPortalPage.tsx   # Página principal del portal
│   │       ├── PublicArticlePage.tsx  # Detalle de artículo
│   │       ├── AdministrativoPage.tsx # Sección Derecho Administrativo
│   │       ├── CivilPage.tsx          # Sección Derecho Civil
│   │       ├── ComercialPage.tsx      # Sección Derecho Comercial
│   │       ├── DigitalPage.tsx        # Sección Derecho Digital
│   │       ├── FamiliaPage.tsx        # Sección Derecho de Familia
│   │       ├── LaboralPage.tsx        # Sección Derecho Laboral
│   │       ├── OpinionPage.tsx        # Sección Opinión
│   │       ├── PenalPage.tsx          # Sección Derecho Penal
│   │       └── TributarioPage.tsx     # Sección Derecho Tributario
│   │
│   ├── stores/                        # 🗂️ Estado global (Zustand)
│   │   ├── authStore.ts               # Estado de autenticación
│   │   ├── appStore.ts                # Estado de UI global
│   │   ├── curationStore.ts           # Estado de curación
│   │   └── eventStore.ts              # Estado de eventos SSE
│   │
│   ├── services/                      # 🔌 Servicios API
│   │   ├── api.ts                     # Cliente Axios configurado
│   │   ├── authService.ts             # Autenticación
│   │   ├── documentsService.ts        # CRUD de documentos
│   │   ├── articlesService.ts         # CRUD de artículos
│   │   ├── aiService.ts               # Servicios AI
│   │   ├── scrapingService.ts         # Sistema de extracción
│   │   ├── publicPortalService.ts     # Portal público
│   │   ├── adminService.ts            # Administración
│   │   └── syncService.ts             # Sincronización de estado
│   │
│   ├── hooks/                         # 🪝 Custom Hooks
│   │   ├── useScrapingProgress.ts     # SSE de progreso de scraping
│   │   ├── useSync.ts                 # Sincronización de datos
│   │   ├── useSmartPolling.ts         # Polling inteligente
│   │   ├── usePersistenceHealth.ts    # Salud de persistencia
│   │   └── useScrollPersistence.ts    # Persistir posición de scroll
│   │
│   ├── auth/                          # 🔐 Gestión de autenticación
│   │   ├── IAuthenticationManager.ts  # Interfaz de auth
│   │   ├── JWTAuthManager.ts          # Implementación JWT
│   │   └── MockAuthManager.ts         # Mock para testing
│   │
│   ├── types/                         # 📝 Tipos TypeScript
│   │   ├── publicArticle.types.ts     # Tipos del portal público
│   │   └── publication.types.ts       # Tipos de publicación
│   │
│   ├── utils/                         # 🔧 Utilidades
│   │   ├── seoUtils.ts                # Utilidades SEO
│   │   ├── imageProcessor.ts          # Procesamiento de imágenes
│   │   ├── imageCompression.ts        # Compresión de imágenes
│   │   ├── persistenceValidator.ts    # Validación de persistencia
│   │   ├── documentEvents.ts          # Eventos de documentos
│   │   └── clearStorage.ts            # Limpieza de storage
│   │
│   ├── constants/                     # 📊 Constantes
│   │   └── entityColors.ts            # Colores de entidades judiciales
│   │
│   ├── data/                          # 📦 Data mock y estática
│   │   ├── mockArticles.ts            # Artículos de ejemplo
│   │   └── judicialEntities.ts        # Entidades judiciales
│   │
│   ├── styles/                        # 🎨 Estilos globales
│   │   └── responsive-images.css      # CSS de imágenes responsive
│   │
│   ├── App.tsx                        # 🚀 Componente raíz
│   ├── main.tsx                       # Punto de entrada
│   └── index.css                      # Estilos globales Tailwind
│
├── public/                            # Archivos estáticos
├── dist/                              # Build de producción (generado)
├── .env                               # Variables de entorno
├── .env.example                       # Ejemplo de configuración
├── vite.config.ts                     # Configuración Vite
├── tailwind.config.js                 # Configuración Tailwind
├── tsconfig.json                      # Configuración TypeScript
├── package.json                       # Dependencias
└── CLAUDE.md                          # 📖 Esta guía
```

---

## ⚡ Comandos Esenciales

### Desarrollo

```bash
# Iniciar servidor dev con HMR
npm run dev
# → http://localhost:5173

# Verificar tipos sin compilar
npm run type-check

# Linting y auto-fix
npm run lint
npm run lint:fix
```

### Build y Preview

```bash
# Build de producción
npm run build
# → Genera /dist con chunks optimizados

# Preview de build local
npm run preview
# → http://localhost:4173
```

### Testing

```bash
# Ejecutar tests
npm run test

# Tests con UI interactiva
npm run test:ui

# Coverage
npm run test:coverage
```

---

## 🗂️ Sistema de Estado (Zustand)

El frontend usa **Zustand** para state management, con 3 stores principales.

### authStore - Autenticación

**Archivo**: `src/stores/authStore.ts`

**Responsabilidad**: Gestiona autenticación JWT con persistencia en localStorage.

**Estado**:
```typescript
interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean

  // Acciones
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  refreshAccessToken: () => Promise<void>
  setUser: (user: User) => void
  setTokens: (access: string, refresh: string) => void
}
```

**Persistencia**: Se sincroniza automáticamente con `localStorage` bajo la key `'auth-storage'`.

**Auto-refresh de tokens**:
```typescript
// Se configura automáticamente al inicializar
// Refresca access token 5 min antes de expirar
setupTokenRefresh()
```

**Uso**:
```typescript
import { useAuthStore } from '@/stores/authStore'

function MyComponent() {
  const { user, isAuthenticated, logout } = useAuthStore()

  return (
    <div>
      {isAuthenticated && <p>Hola, {user?.firstName}</p>}
      <button onClick={logout}>Cerrar sesión</button>
    </div>
  )
}
```

### appStore - UI Global

**Archivo**: `src/stores/appStore.ts`

**Responsabilidad**: Estado de UI global (sidebar, notificaciones, preferencias).

**Estado**:
```typescript
interface AppState {
  sidebarOpen: boolean
  notifications: Notification[]
  uiPreferences: UIPreferences
  editorState: EditorState

  // Acciones
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  addNotification: (notification: Notification) => void
  removeNotification: (id: string) => void
  setUIPreferences: (prefs: Partial<UIPreferences>) => void
}
```

**Persistencia**: Se sincroniza con `localStorage` bajo la key `'app-storage'`.

**Uso**:
```typescript
import { useAppStore } from '@/stores/appStore'

function Sidebar() {
  const { sidebarOpen, toggleSidebar } = useAppStore()

  return (
    <aside className={sidebarOpen ? 'open' : 'closed'}>
      <button onClick={toggleSidebar}>Toggle</button>
    </aside>
  )
}
```

### curationStore - Workflow de Curación

**Archivo**: `src/stores/curationStore.ts`

**Responsabilidad**: Gestiona selección de documentos y filtros de curación.

**Estado**:
```typescript
interface CurationState {
  selectedDocuments: Set<string>
  filters: DocumentFilters
  currentDocument: Document | null
  archivedDocuments: ArchivedDocument[]

  // Acciones
  selectDocument: (id: string) => void
  deselectDocument: (id: string) => void
  selectAll: (docs: Document[]) => void
  clearSelection: () => void
  approveDocument: (doc: Document, curatorName: string) => void
  rejectDocument: (doc: Document, reason: string) => void
  archiveDocument: (doc: Document, reason: string, userName: string) => void
  undoApproval: (docId: string) => void
}
```

**Uso**:
```typescript
import { useCurationStore } from '@/stores/curationStore'

function DocumentCard({ document }) {
  const { selectedDocuments, selectDocument, approveDocument } = useCurationStore()
  const isSelected = selectedDocuments.has(document.id)

  return (
    <div onClick={() => selectDocument(document.id)}>
      <input type="checkbox" checked={isSelected} />
      <button onClick={() => approveDocument(document, 'Juan Pérez')}>
        Aprobar
      </button>
    </div>
  )
}
```

### eventStore - Eventos SSE

**Archivo**: `src/stores/eventStore.ts`

**Responsabilidad**: Gestiona eventos en tiempo real (Server-Sent Events).

**Estado**:
```typescript
interface EventState {
  scrapingProgress: ScrapingProgress | null
  connected: boolean

  // Acciones
  updateScrapingProgress: (progress: ScrapingProgress) => void
  setConnected: (connected: boolean) => void
}
```

---

## 🛣️ Rutas y Navegación

### Estructura de Rutas

```typescript
// src/App.tsx
<Routes>
  {/* Rutas públicas (sin auth) */}
  <Route path="/login" element={<LoginPage />} />
  <Route path="/portal" element={<PublicPortalPage />} />
  <Route path="/portal/articles/:slug" element={<PublicArticlePage />} />

  {/* Secciones del portal (9 áreas legales) */}
  <Route path="/portal/administrativo" element={<AdministrativoPage />} />
  <Route path="/portal/civil" element={<CivilPage />} />
  <Route path="/portal/comercial" element={<ComercialPage />} />
  <Route path="/portal/digital" element={<DigitalPage />} />
  <Route path="/portal/familia" element={<FamiliaPage />} />
  <Route path="/portal/laboral" element={<LaboralPage />} />
  <Route path="/portal/opinion" element={<OpinionPage />} />
  <Route path="/portal/penal" element={<PenalPage />} />
  <Route path="/portal/tributario" element={<TributarioPage />} />

  {/* Rutas protegidas (requieren auth) */}
  <Route path="/*" element={
    <ProtectedRoute>
      <MainLayout>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/curation" element={<CurationPage />} />
          <Route path="/approved" element={<ApprovedDocumentsPage />} />
          <Route path="/articles" element={<ArticleRouter />} />
          <Route path="/articles/:id/edit" element={<ArticleEditorPage />} />
          <Route path="/articles/new" element={<ArticleEditorPage />} />
        </Routes>
      </MainLayout>
    </ProtectedRoute>
  } />
</Routes>
```

### ProtectedRoute Component

**Archivo**: `src/components/auth/ProtectedRoute.tsx`

**Responsabilidad**: HOC que protege rutas requiriendo autenticación.

**Lógica**:
```typescript
// Si no está autenticado → Redirige a /login
// Si está autenticado → Renderiza children
export function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuthStore()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return children
}
```

### Navegación Programática

```typescript
import { useNavigate } from 'react-router-dom'

function MyComponent() {
  const navigate = useNavigate()

  const handleSuccess = () => {
    navigate('/dashboard')
  }

  const handleBack = () => {
    navigate(-1) // Volver atrás
  }
}
```

---

## 🔌 Servicios y API

Todos los servicios usan **Axios** con interceptores configurados para autenticación.

### api.ts - Cliente Base

**Archivo**: `src/services/api.ts`

**Configuración**:
```typescript
const api = axios.create({
  baseURL: '/api', // Proxy a http://localhost:3001/api
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor - Agrega access token
api.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState()
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

// Response interceptor - Maneja 401 y refresh tokens
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Intentar refresh token
      const { refreshAccessToken } = useAuthStore.getState()
      await refreshAccessToken()
      // Reintentar request original
      return api(error.config)
    }
    throw error
  }
)
```

### documentsService

**Archivo**: `src/services/documentsService.ts`

**Métodos**:
```typescript
class DocumentsService {
  // Obtener documentos con filtros
  getDocuments(params: GetDocumentsParams): Promise<PaginatedResponse<Document>>

  // Obtener documento por ID
  getDocumentById(id: string): Promise<Document>

  // Aprobar documento
  approveDocument(id: string): Promise<Document>

  // Rechazar documento
  rejectDocument(id: string, reason: string): Promise<Document>

  // Archivar documento
  archiveDocument(id: string, reason: string): Promise<Document>
}
```

**Uso**:
```typescript
import documentsService from '@/services/documentsService'

// En componente
const { data, isLoading } = useQuery({
  queryKey: ['documents', 'pending'],
  queryFn: () => documentsService.getDocuments({ status: 'PENDING' })
})
```

### articlesService

**Archivo**: `src/services/articlesService.ts`

**Métodos**:
```typescript
class ArticlesService {
  // CRUD
  getArticles(params: GetArticlesParams): Promise<PaginatedResponse<Article>>
  getArticleById(id: string): Promise<Article>
  createArticle(data: CreateArticleData): Promise<Article>
  updateArticle(id: string, data: UpdateArticleData): Promise<Article>
  deleteArticle(id: string): Promise<void>

  // Publicación
  publishArticle(id: string): Promise<Article>
  scheduleArticle(id: string, date: Date): Promise<Article>
  unpublishArticle(id: string): Promise<Article>

  // Posicionamiento
  updateArticlePosition(id: string, position: PositionData): Promise<Article>
}
```

### aiService

**Archivo**: `src/services/aiService.ts`

**Métodos**:
```typescript
class AIService {
  // Análisis de documentos
  analyzeDocument(documentId: string): Promise<DocumentAnalysis>

  // Generación de artículos
  generateArticle(documentId: string, style: string): Promise<GeneratedArticle>

  // Generación de títulos
  generateTitles(documentId: string, count: number): Promise<TitleSet[]>

  // Generación de imágenes
  generateImages(request: GenerateImagesRequest): Promise<GeneratedImage[]>

  // Generación de prompts de imagen
  generateImagePrompt(context: ImageContext): Promise<ImagePrompt>
}
```

### publicPortalService

**Archivo**: `src/services/publicPortalService.ts`

**Métodos**:
```typescript
class PublicPortalService {
  // Obtener artículos de sección
  getArticlesBySection(section: string, params: QueryParams): Promise<Article[]>

  // Obtener artículo por slug
  getArticleBySlug(slug: string): Promise<Article>

  // Obtener destacados de la semana
  getWeeklyHighlights(): Promise<Article[]>

  // Obtener últimas noticias
  getLatestNews(limit: number): Promise<Article[]>
}
```

---

## 🧩 Componentes Principales

### DocumentPreviewModal

**Archivo**: `src/components/curation/DocumentPreviewModal.tsx`

**Responsabilidad**: Modal multi-paso para curación de documentos.

**Modos**:
1. **preview** - Vista rápida del documento
2. **generation** - Generación de contenido AI (artículo, títulos, imágenes)

**Pasos (modo generation)**:
1. Vista previa del documento
2. Generación de artículo
3. Generación de títulos
4. Generación de imagen
5. Metadata y SEO
6. Preview final y publicación

**Uso**:
```typescript
<DocumentPreviewModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  document={selectedDocument}
  mode="generation"
  currentStep={currentStep}
  onStepChange={(step) => setCurrentStep(step)}
/>
```

### ArticleGenerator

**Archivo**: `src/components/generator/ArticleGenerator.tsx`

**Responsabilidad**: Generación de artículos con IA.

**Características**:
- Selección de modelo AI (GPT-4o, Gemini 1.5, Claude 3.5)
- Selección de estilo (Periodístico, Académico, Divulgativo)
- Preview en tiempo real
- Editor de artículo post-generación
- Regeneración parcial

**Uso**:
```typescript
<ArticleGenerator
  document={document}
  onArticleGenerated={(article) => setGeneratedArticle(article)}
/>
```

### TitleGenerator

**Archivo**: `src/components/generator/TitleGenerator.tsx`

**Responsabilidad**: Generación de títulos SEO-optimizados.

**Características**:
- Genera 5-10 títulos alternativos
- Muestra longitud de caracteres
- Indica si es SEO-friendly
- Permite seleccionar y editar

**Uso**:
```typescript
<TitleGenerator
  document={document}
  onTitlesGenerated={(titles) => setTitles(titles)}
  onTitleSelected={(title) => setSelectedTitle(title)}
/>
```

### ImageGenerator

**Archivo**: `src/components/generator/ImageGenerator.tsx`

**Responsabilidad**: Generación de imágenes con DALL-E o Gemini Imagen.

**Características**:
- Generación de prompt inteligente
- Selección de estilo (Persona, Paisaje, Elemento)
- Selección de modelo (DALL-E 3, Gemini Imagen)
- Preview de imagen generada
- Guardar en biblioteca con tags
- Seleccionar imagen de biblioteca

**Flujo**:
1. Sistema genera prompt optimizado automáticamente
2. Usuario selecciona estilo y modelo
3. Genera imagen
4. Puede regenerar o guardar en biblioteca
5. O seleccionar imagen existente de biblioteca

**Uso**:
```typescript
<ImageGenerator
  document={document}
  onImageGenerated={(url, prompt, metaDescription) => {
    setImageUrl(url)
    setMetaDescription(metaDescription)
  }}
/>
```

### ImageLibraryModal

**Archivo**: `src/components/generator/ImageLibraryModal.tsx`

**Responsabilidad**: Biblioteca de imágenes AI reutilizables.

**Características**:
- Búsqueda por tags y texto
- Filtros por estilo, modelo, documento
- Vista de galería responsive
- Información de uso (contador)
- Asociación con documentos

**⚠️ IMPORTANTE - Cliente API (Corrección Oct 2025)**:

Este componente **DEBE usar el cliente `api` de axios** en lugar de `fetch` nativo para garantizar:
- Autenticación JWT automática mediante interceptores
- Manejo correcto de errores 401 y refresh de tokens
- Configuración del proxy de Vite para desarrollo
- Consistencia con el resto de la aplicación

```typescript
// ✅ CORRECTO - Usar cliente api de axios
import { api } from '@/services/api'

const response = await api.get(`/storage/images/library?${params.toString()}`)
setImages(response.data.data.images)

// ❌ INCORRECTO - NO usar fetch nativo
const response = await fetch(`/api/storage/images/library?${params.toString()}`)
const data = await response.json()
```

**Motivo**: El fetch nativo no incluye el token JWT en las cabeceras, causando errores 401 y biblioteca vacía.

**Uso**:
```typescript
<ImageLibraryModal
  isOpen={showLibrary}
  onClose={() => setShowLibrary(false)}
  onSelectImage={(url, prompt, imageId, metaDescription) => {
    setCurrentImage(url)
  }}
  currentDocumentId={document.id}
/>
```

### SaveToLibraryModal

**Archivo**: `src/components/generator/SaveToLibraryModal.tsx`

**Responsabilidad**: Guardar imagen en biblioteca con metadata.

**Características**:
- Pre-llenado de metaDescription
- Sistema de tags automático y manual
- Visibilidad (privada vs pública)
- Validación de longitud (metaDescription ≤ 125 chars)

**Uso**:
```typescript
<SaveToLibraryModal
  isOpen={showSaveModal}
  onClose={() => setShowSaveModal(false)}
  imageUrl={imageUrl}
  prompt={prompt}
  initialMetaDescription={metaDescription}
  onSave={async (tags, isPublic, metaDescription) => {
    await saveImageToLibrary(imageUrl, tags, isPublic, metaDescription)
    return true
  }}
/>
```

### MetadataEditor

**Archivo**: `src/components/generator/MetadataEditor.tsx`

**Responsabilidad**: Editor de metadata SEO (título, descripción, keywords, sección).

**Campos**:
- **SEO Title** (≤60 chars)
- **SEO Subtitle** (opcional, ≤100 chars)
- **Meta Description** (≤160 chars)
- **Keywords** (tags separados por coma)
- **Sección de publicación** (9 opciones)
- **Custom tags**

**Uso**:
```typescript
<MetadataEditor
  metadata={metadata}
  onChange={(updatedMetadata) => setMetadata(updatedMetadata)}
/>
```

### PublishingPreview

**Archivo**: `src/components/generator/PublishingPreview.tsx`

**Responsabilidad**: Preview final antes de publicar artículo.

**Muestra**:
- Título completo
- Imagen destacada
- Contenido del artículo (HTML renderizado)
- Metadata SEO
- Reading time estimado
- Word count

**Uso**:
```typescript
<PublishingPreview
  article={generatedArticle}
  metadata={metadata}
  imageUrl={selectedImage}
  onPublish={async () => {
    await publishArticle()
  }}
/>
```

---

## 🎨 Sistema de Generación de Contenido

El flujo completo de generación sigue este pipeline:

### Paso 1: Documento Aprobado

Usuario aprueba documento desde `CurationPage` → Estado cambia a `APPROVED` → Se habilita generación.

### Paso 2: Generar Artículo

```typescript
// 1. Usuario selecciona modelo y estilo
const model = 'gpt-4o' // o 'gemini-1.5-pro' o 'claude-3.5-sonnet'
const style = 'periodistico' // o 'academico' o 'divulgativo'

// 2. Se genera artículo
const article = await aiService.generateArticle(documentId, model, style)

// 3. Se puede editar con editor Tiptap
// 4. Se guarda en document.generatedArticle
```

### Paso 3: Generar Títulos

```typescript
// 1. Se generan múltiples títulos
const titles = await aiService.generateTitles(documentId, 10)

// 2. Usuario selecciona uno o lo edita
const selectedTitle = titles[2]

// 3. Se guarda en document.selectedTitle
```

### Paso 4: Generar Imagen

```typescript
// 1. Sistema genera prompt automáticamente
const promptData = await aiService.generateImagePrompt({
  documentId,
  imageType: 'paisaje',
  legalArea: 'CONSTITUTIONAL',
  temaPrincipal: 'Protección del medio ambiente'
})

// 2. Usuario genera imagen
const images = await aiService.generateImages({
  documentId,
  model: 'dalle',
  style: 'paisaje',
  prompt: promptData.prompt,
  count: 1
})

// 3. Imagen se muestra y puede guardarse en biblioteca
const imageUrl = images[0].url
const metaDescription = promptData.metaDescription
```

### Paso 5: Guardar en Biblioteca (Opcional)

```typescript
// Guardar imagen para reutilización
await fetch('/api/storage/images/save-from-url', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    imageUrl,
    prompt: promptData.prompt,
    metaDescription,
    model: 'dalle',
    style: 'paisaje',
    documentId,
    customTags: ['tribunal', 'justicia'],
    isPublic: false // Solo visible en este documento
  })
})
```

### Paso 6: Configurar Metadata SEO

```typescript
const metadata = {
  seoTitle: selectedTitle.title, // ≤60 chars
  seoSubtitle: selectedTitle.subtitle, // ≤100 chars
  metaTitle: 'Título real del artículo',
  metaDescription: 'Descripción breve...', // ≤160 chars
  keywords: ['constitucional', 'medio ambiente', 'tutela'],
  section: 'Derecho Constitucional',
  customTags: ['destacado']
}
```

### Paso 7: Publicar Artículo

```typescript
// Crear artículo en BD
const article = await articlesService.createArticle({
  title: metadata.seoTitle,
  content: generatedArticle.content,
  summary: generatedArticle.summary,
  metaTitle: metadata.metaTitle,
  metaDescription: metadata.metaDescription,
  keywords: metadata.keywords,
  legalArea: document.legalArea,
  publicationSection: metadata.section,
  imageUrl: selectedImage,
  sourceDocumentId: document.id
})

// Publicar inmediatamente
await articlesService.publishArticle(article.id)

// O programar publicación
await articlesService.scheduleArticle(article.id, new Date('2025-12-25'))
```

---

## 🌐 Portal Público

El portal público tiene 9 secciones legales, cada una con su propia página.

### Secciones

1. **Derecho Administrativo** - `/portal/administrativo`
2. **Derecho Civil** - `/portal/civil`
3. **Derecho Comercial** - `/portal/comercial`
4. **Derecho Digital** - `/portal/digital`
5. **Derecho de Familia** - `/portal/familia`
6. **Derecho Laboral** - `/portal/laboral`
7. **Opinión** - `/portal/opinion`
8. **Derecho Penal** - `/portal/penal`
9. **Derecho Tributario** - `/portal/tributario`

### Estructura de Página de Sección

Todas las páginas de sección siguen el mismo patrón:

```typescript
// Ejemplo: AdministrativoPage.tsx
export default function AdministrativoPage() {
  const { data: articles, isLoading } = useQuery({
    queryKey: ['articles', 'administrativo'],
    queryFn: () => publicPortalService.getArticlesBySection('administrativo')
  })

  return (
    <div>
      <PublicHeader />

      <section className="hero">
        <h1>Derecho Administrativo</h1>
        <p>Últimas noticias y análisis...</p>
      </section>

      <section className="articles-grid">
        {articles?.map(article => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </section>

      <PublicFooter />
    </div>
  )
}
```

### ArticleCard Component

**Archivo**: `src/components/public/ArticleCard.tsx`

**Muestra**:
- Imagen destacada (con lazy loading)
- Título
- Resumen
- Fecha de publicación
- Reading time
- Link al artículo completo

**Uso**:
```typescript
<ArticleCard
  article={{
    id: 'art123',
    title: 'Nueva sentencia sobre medio ambiente',
    slug: 'nueva-sentencia-medio-ambiente',
    summary: 'La Corte Constitucional...',
    imageUrl: '/api/storage/images/...',
    publishedAt: '2025-10-13T...',
    readingTime: 5
  }}
/>
```

### PublicArticlePage

**Archivo**: `src/pages/public/PublicArticlePage.tsx`

**Responsabilidad**: Página de detalle de artículo publicado.

**Características**:
- SEO optimizado con `<SEOHead>` component
- Open Graph tags para redes sociales
- Schema.org markup (Article schema)
- Imagen destacada responsive
- Contenido HTML renderizado
- Información del autor
- Fecha de publicación
- Share buttons

**Ruta**: `/portal/articles/:slug`

---

## 🔐 Autenticación

### Flujo de Login

```typescript
// 1. Usuario ingresa credenciales
const handleLogin = async (email: string, password: string) => {
  try {
    // 2. Se llama al servicio de auth
    const response = await authService.login(email, password)

    // 3. Se guardan tokens en authStore (auto-persiste en localStorage)
    const { login } = useAuthStore.getState()
    await login(email, password)

    // 4. Se redirige al dashboard
    navigate('/dashboard')
  } catch (error) {
    toast.error('Credenciales inválidas')
  }
}
```

### Interceptores de Axios

```typescript
// Request interceptor
api.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState()
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

// Response interceptor - Auto refresh en 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true

      try {
        // Refrescar access token
        const { refreshAccessToken } = useAuthStore.getState()
        await refreshAccessToken()

        // Reintentar request original con nuevo token
        return api(error.config)
      } catch (refreshError) {
        // Si falla refresh, logout
        const { logout } = useAuthStore.getState()
        logout()
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)
```

### Auto-refresh de Tokens

```typescript
// src/stores/authStore.ts

// Timer global para refresh automático
let refreshTimer: NodeJS.Timeout | null = null

function setupTokenRefresh() {
  const { accessToken, refreshAccessToken } = useAuthStore.getState()

  if (!accessToken) return

  // Decodificar token para obtener expiración
  const payload = JSON.parse(atob(accessToken.split('.')[1]))
  const expiresIn = payload.exp * 1000 - Date.now()

  // Programar refresh 5 minutos antes de expirar
  const refreshIn = expiresIn - 5 * 60 * 1000

  if (refreshTimer) clearTimeout(refreshTimer)

  refreshTimer = setTimeout(async () => {
    try {
      await refreshAccessToken()
      setupTokenRefresh() // Configurar siguiente refresh
    } catch (error) {
      console.error('Auto-refresh failed:', error)
    }
  }, refreshIn)
}

// Se inicializa automáticamente al cargar authStore
useAuthStore.subscribe(
  (state) => state.accessToken,
  (accessToken) => {
    if (accessToken) setupTokenRefresh()
  }
)
```

---

## 🎨 Estilos y UI

### Tailwind CSS

**Configuración**: `tailwind.config.js`

**Tema personalizado**:
```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          // ... hasta 900
        },
        accent: {
          // ...
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif']
      }
    }
  }
}
```

**Clases utilitarias custom**:
```css
/* src/index.css */
@layer components {
  .btn {
    @apply px-4 py-2 rounded-lg font-medium transition-colors;
  }

  .btn-primary {
    @apply btn bg-primary-600 text-white hover:bg-primary-700;
  }

  .card {
    @apply bg-white dark:bg-gray-800 rounded-xl shadow-sm;
  }
}
```

### Componentes UI Base

**LoadingSpinner**:
```typescript
<LoadingSpinner size="lg" color="primary" />
```

**ResponsiveImage**:
```typescript
<ResponsiveImage
  src="/api/storage/images/..."
  alt="Descripción"
  aspectRatio="16:9"
  loading="lazy"
/>
```

### Dark Mode

El sistema soporta dark mode con Tailwind:

```typescript
// Alternar modo oscuro
function toggleDarkMode() {
  document.documentElement.classList.toggle('dark')
  localStorage.setItem('theme', isDark ? 'dark' : 'light')
}

// CSS con dark mode
<div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
  Contenido
</div>
```

---

## 🪝 Hooks Personalizados

### useScrapingProgress

**Archivo**: `src/hooks/useScrapingProgress.ts`

**Responsabilidad**: Conecta a SSE para progreso de scraping en tiempo real.

**Uso**:
```typescript
import { useScrapingProgress } from '@/hooks/useScrapingProgress'

function ScrapingProgressModal() {
  const { progress, isConnected, error } = useScrapingProgress()

  return (
    <div>
      <p>Progreso: {progress?.progress}%</p>
      <p>{progress?.message}</p>
      <p>Estado: {isConnected ? 'Conectado' : 'Desconectado'}</p>
    </div>
  )
}
```

**Eventos escuchados**:
- `scraping:progress` - Actualización de progreso
- `scraping:complete` - Extracción completada
- `scraping:error` - Error en extracción

### useSync

**Archivo**: `src/hooks/useSync.ts`

**Responsabilidad**: Sincronización automática de datos con polling inteligente.

**Uso**:
```typescript
import { useSync } from '@/hooks/useSync'

function MyComponent() {
  const { data, isSyncing, lastSync } = useSync({
    queryKey: ['documents'],
    queryFn: () => documentsService.getDocuments(),
    interval: 30000, // Polling cada 30s
    enabled: isAuthenticated
  })

  return (
    <div>
      {isSyncing && <LoadingSpinner />}
      <p>Última sincronización: {lastSync}</p>
    </div>
  )
}
```

### useSmartPolling

**Archivo**: `src/hooks/useSmartPolling.ts`

**Responsabilidad**: Polling adaptativo que se ajusta según actividad del usuario.

**Lógica**:
- Usuario activo (haciendo scroll, clicks) → Polling rápido (10s)
- Usuario inactivo → Polling lento (60s)
- Tab en background → Polling muy lento (300s)

**Uso**:
```typescript
import { useSmartPolling } from '@/hooks/useSmartPolling'

function MyComponent() {
  useSmartPolling({
    queryKey: ['notifications'],
    queryFn: fetchNotifications,
    baseInterval: 30000
  })
}
```

### usePersistenceHealth

**Archivo**: `src/hooks/usePersistenceHealth.ts`

**Responsabilidad**: Monitorea salud de persistencia (localStorage, sessionStorage).

**Uso**:
```typescript
import { usePersistenceHealth } from '@/hooks/usePersistenceHealth'

function PersistenceMonitor() {
  const { isHealthy, issues, checkHealth } = usePersistenceHealth()

  return (
    <div>
      {!isHealthy && (
        <Alert>
          Problemas de persistencia: {issues.join(', ')}
          <button onClick={checkHealth}>Verificar</button>
        </Alert>
      )}
    </div>
  )
}
```

### useScrollPersistence

**Archivo**: `src/hooks/useScrollPersistence.ts`

**Responsabilidad**: Guarda y restaura posición de scroll al volver a una página.

**Uso**:
```typescript
import { useScrollPersistence } from '@/hooks/useScrollPersistence'

function ArticlesPage() {
  useScrollPersistence('articles-page')

  // Al volver a esta página, se restaura el scroll automáticamente
}
```

---

## 📡 Sistema de Sincronización por Eventos

El frontend utiliza un **EventBus** local para sincronizar componentes sin acoplamiento directo.

**Archivo**: `src/utils/documentEvents.ts`

### Eventos Disponibles

```typescript
// Eventos de ciclo de vida de documentos
'document:approved'   // Documento aprobado (con/sin artículo)
'document:rejected'   // Documento rechazado
'document:ready'      // Documento listo para artículo
'document:published'  // Artículo publicado
'document:updated'    // Cambios generales
```

### Uso Básico

**Emitir evento**:
```typescript
import { documentEvents } from '@/utils/documentEvents'

// Después de aprobar documento
await api.post(`/documents/${id}/curate`, { action: 'approve' })
documentEvents.emit('document:approved')
```

**Escuchar evento**:
```typescript
import { documentEvents } from '@/utils/documentEvents'

function MyComponent() {
  const loadData = useCallback(async () => {
    // Recargar datos
  }, [])

  useEffect(() => {
    // Suscribirse
    documentEvents.on('document:approved', loadData)

    // 🧹 Cleanup obligatorio (evitar memory leaks)
    return () => {
      documentEvents.off('document:approved', loadData)
    }
  }, [loadData])
}
```

### Casos de Uso

1. **Sidebar**: Actualiza contadores cuando cambia estado de documentos
2. **ArticlesPage**: Recarga lista cuando se aprueba documento con artículo READY
3. **PublishedArticlesPage**: Recarga lista cuando se publica artículo
4. **Dashboard**: Actualiza estadísticas en cualquier cambio

### Best Practices

✅ **Siempre hacer cleanup** en `useEffect`
✅ **Usar `useCallback`** para handlers estables
✅ **Emitir solo después de éxito** del backend
✅ **Sin payloads grandes** (listeners cargan desde API)

❌ **No emitir antes de persistir** en backend
❌ **No olvidar `off()` en cleanup**
❌ **No usar nombres genéricos** como 'update'

### Documentación Completa

Para arquitectura detallada, troubleshooting y patrones avanzados:
📖 **[Sistema de Sincronización por Eventos](/docs/architecture/EVENT_SYNCHRONIZATION_SYSTEM.md)**

---

## 📚 Guías de Desarrollo

### Agregar Nueva Página

```typescript
// 1. Crear archivo de página
// src/pages/mimodulo/MiPaginaPage.tsx
export default function MiPaginaPage() {
  return (
    <div className="p-6">
      <h1>Mi Página</h1>
    </div>
  )
}

// 2. Agregar ruta en App.tsx
import MiPaginaPage from '@/pages/mimodulo/MiPaginaPage'

<Route path="/mi-pagina" element={<MiPaginaPage />} />

// 3. Agregar link en Sidebar.tsx
<Link to="/mi-pagina" className="sidebar-link">
  Mi Página
</Link>
```

### Agregar Nuevo Servicio

```typescript
// 1. Crear archivo de servicio
// src/services/miServicio.ts
import api from './api'

class MiServicio {
  async getData() {
    const response = await api.get('/mi-endpoint')
    return response.data
  }
}

export default new MiServicio()

// 2. Usar en componente
import miServicio from '@/services/miServicio'

const { data } = useQuery({
  queryKey: ['mi-data'],
  queryFn: () => miServicio.getData()
})
```

### Agregar Nuevo Store

```typescript
// 1. Crear store
// src/stores/miStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface MiState {
  valor: string
  setValor: (valor: string) => void
}

export const useMiStore = create<MiState>()(
  persist(
    (set) => ({
      valor: '',
      setValor: (valor) => set({ valor })
    }),
    {
      name: 'mi-storage' // Key en localStorage
    }
  )
)

// 2. Usar en componente
import { useMiStore } from '@/stores/miStore'

function MyComponent() {
  const { valor, setValor } = useMiStore()

  return <input value={valor} onChange={(e) => setValor(e.target.value)} />
}
```

### Agregar Componente UI

```typescript
// 1. Crear componente
// src/components/ui/MyButton.tsx
interface MyButtonProps {
  children: React.ReactNode
  variant?: 'primary' | 'secondary'
  onClick?: () => void
}

export function MyButton({ children, variant = 'primary', onClick }: MyButtonProps) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'px-4 py-2 rounded-lg font-medium transition-colors',
        variant === 'primary' && 'bg-primary-600 text-white hover:bg-primary-700',
        variant === 'secondary' && 'bg-gray-200 text-gray-800 hover:bg-gray-300'
      )}
    >
      {children}
    </button>
  )
}

// 2. Usar componente
import { MyButton } from '@/components/ui/MyButton'

<MyButton variant="primary" onClick={handleClick}>
  Click me
</MyButton>
```

---

## 🔥 Troubleshooting

### Error: Module not found '@/*'

**Causa**: Path aliases no configurados correctamente.

**Solución**:
```bash
# Verificar vite.config.ts tiene resolve.alias
# Verificar tsconfig.json tiene paths
# Reiniciar dev server
npm run dev
```

### Error: useAuthStore is not a function

**Causa**: Import incorrecto del store.

**Solución**:
```typescript
// ❌ WRONG
import useAuthStore from '@/stores/authStore'

// ✅ CORRECT
import { useAuthStore } from '@/stores/authStore'
```

### Error: Network Error al hacer requests

**Causa**: Backend no está corriendo o proxy mal configurado.

**Solución**:
```bash
# 1. Verificar backend corriendo
cd backend && npm run dev

# 2. Verificar proxy en vite.config.ts
proxy: {
  '/api': {
    target: 'http://localhost:3001',
    changeOrigin: true
  }
}

# 3. Reiniciar frontend
npm run dev
```

### Error: localStorage.setItem failed (QuotaExceededError)

**Causa**: localStorage lleno (límite ~5-10MB).

**Solución**:
```typescript
// Limpiar storage manualmente
localStorage.clear()

// O usar utilidad
import { clearStorage } from '@/utils/clearStorage'
clearStorage()
```

### Imágenes no se muestran en biblioteca

**Diagnóstico**:
```bash
# 1. Verificar red en DevTools
# Network tab → Ver si requests a /api/storage/images/* retornan 200

# 2. Verificar consola de errores

# 3. Verificar datos en React Query Devtools
# Ver si queryKey ['images', 'library'] tiene datos
```

**Soluciones**:
- Si 404 → Verificar backend tiene imágenes físicas
- Si 401 → Verificar autenticación
- Si datos vacíos → Verificar filtros (`isPublic`, `documentId`)

### Build falla con TypeScript errors

```bash
# Verificar errores de tipos
npm run type-check

# Si hay muchos errores, compilar sin type-check
npm run build -- --mode production
```

### Dark mode no funciona

**Causa**: Clase `dark` no está en `<html>`.

**Solución**:
```typescript
// Verificar que se aplica al elemento raíz
document.documentElement.classList.add('dark')

// O usar toggle
document.documentElement.classList.toggle('dark')
```

---

## 📊 Performance Tips

### Code Splitting

El build ya está configurado para code splitting automático:

```typescript
// vite.config.ts
rollupOptions: {
  output: {
    manualChunks: {
      vendor: ['react', 'react-dom'],
      router: ['react-router-dom'],
      query: ['@tanstack/react-query'],
      ui: ['@headlessui/react', '@heroicons/react', 'lucide-react'],
      editor: ['@tiptap/react', '@tiptap/starter-kit']
    }
  }
}
```

### Lazy Loading de Rutas

```typescript
import { lazy, Suspense } from 'react'

const MiPagina = lazy(() => import('@/pages/MiPaginaPage'))

<Route
  path="/mi-pagina"
  element={
    <Suspense fallback={<LoadingSpinner />}>
      <MiPagina />
    </Suspense>
  }
/>
```

### Optimización de Imágenes

```typescript
// Usar ResponsiveImage component
<ResponsiveImage
  src="/api/storage/images/..."
  alt="..."
  loading="lazy"
  aspectRatio="16:9"
/>

// O lazy loading manual
<img
  src="..."
  alt="..."
  loading="lazy"
  decoding="async"
/>
```

### React Query Stale Time

```typescript
// Configurar stale time para evitar refetches innecesarios
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      cacheTime: 10 * 60 * 1000, // 10 minutos
      refetchOnWindowFocus: false
    }
  }
})
```

---

## 🎯 Próximos Pasos

### Testing

```bash
# Ejecutar tests
npm run test

# Con UI
npm run test:ui

# Coverage
npm run test:coverage
```

**Estado**: Framework configurado (Vitest + Testing Library), pendiente escribir test suites.

### Deploy a Producción

```bash
# 1. Build
npm run build

# 2. Preview local
npm run preview

# 3. Deploy a servidor
# Copiar /dist a servidor web (Nginx, Vercel, Netlify)
```

**Consideraciones**:
- Configurar variables de entorno en servidor
- Configurar redirecciones para SPA (todas las rutas → index.html)
- Configurar CORS en backend para dominio de producción

---

## 📖 Referencias

- **React**: https://react.dev/
- **Vite**: https://vitejs.dev/
- **Zustand**: https://zustand-demo.pmnd.rs/
- **TanStack Query**: https://tanstack.com/query/latest
- **React Router**: https://reactrouter.com/
- **Tailwind CSS**: https://tailwindcss.com/
- **Tiptap**: https://tiptap.dev/
- **React Hook Form**: https://react-hook-form.com/
- **Zod**: https://zod.dev/

---

**Última actualización**: Octubre 2025
**Versión**: 1.0
**Estado**: Sistema funcional 82% completo

---

Para más detalles técnicos, consulta:
- CLAUDE.md principal: `/CLAUDE.md` (raíz del proyecto)
- CLAUDE.md backend: `/backend/CLAUDE.md`
- Arquitectura de eventos: `/docs/architecture/EVENT_SYNCHRONIZATION_SYSTEM.md`
- Arquitectura de adapters: `/docs/architecture/BLACK_BOX_REFACTORING_SPEC.md`
- Documentación de componentes: Ver comentarios en archivos individuales
