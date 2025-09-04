# Arquitectura de Componentes - Sistema Editorial Jurídico Supervisado

## Organización General de la Arquitectura

### Estructura de Directorios
```
src/
├── components/
│   ├── layout/              # Componentes de estructura
│   ├── editorial/           # Componentes de edición
│   ├── curation/           # Componentes de curación
│   ├── multimedia/         # Componentes de media
│   ├── public-portal/      # Componentes del portal público
│   ├── ui/                 # Componentes de UI reutilizables
│   └── shared/             # Componentes compartidos
├── hooks/                  # Custom hooks
├── services/              # Servicios de datos
├── stores/                # Estado global (Zustand/Redux)
└── utils/                 # Utilidades
```

## Componentes de Layout Principal

### MainLayout
**Ubicación**: `components/layout/MainLayout.tsx`  
**Responsabilidades**:
- Estructura responsive de la aplicación completa
- Manejo del estado de navegación y sidebar
- Gestión de notificaciones globales
- Integración con el sistema de temas

```tsx
interface MainLayoutProps {
  children: React.ReactNode;
  sidebarCollapsed?: boolean;
  onSidebarToggle?: () => void;
}

// Estados Internos
- currentUser: User
- sidebarState: 'expanded' | 'collapsed'
- globalNotifications: Notification[]
- connectionStatus: 'online' | 'offline' | 'reconnecting'
```

### Header
**Ubicación**: `components/layout/Header.tsx`  
**Responsabilidades**:
- Branding y navegación principal
- Menú de usuario y perfil
- Indicadores de estado global (conexión, guardado, etc.)
- Acceso rápido a funcionalidades core

```tsx
interface HeaderProps {
  user: User;
  saveStatus: 'saved' | 'saving' | 'error';
  connectionStatus: ConnectionStatus;
  onProfileClick: () => void;
  onSettingsClick: () => void;
}
```

### Sidebar
**Ubicación**: `components/layout/Sidebar.tsx`  
**Responsabilidades**:
- Navegación principal del sistema
- Acceso rápido a documentos y artículos recientes
- Estado de progreso de tareas pendientes
- Filtros contextuales

```tsx
interface SidebarProps {
  collapsed: boolean;
  currentPath: string;
  pendingTasks: TaskSummary;
  recentItems: RecentItem[];
}
```

### ResizablePanel
**Ubicación**: `components/layout/ResizablePanel.tsx`  
**Responsabilidades**:
- Contenedores redimensionables para la interfaz de edición
- Persistencia de tamaños de panel entre sesiones
- Snap a tamaños predefinidos

```tsx
interface ResizablePanelProps {
  initialSize?: number;
  minSize: number;
  maxSize: number;
  onResize?: (size: number) => void;
  persistKey?: string; // Para guardar estado
  children: React.ReactNode;
}
```

## Componentes de Curación de Documentos

### CurationDashboard
**Ubicación**: `components/curation/CurationDashboard.tsx`  
**Responsabilidades**:
- Vista principal del dashboard de curación
- Lista de documentos pendientes con filtros
- Acciones masivas de aprobación/rechazo
- Métricas de productividad

```tsx
interface CurationDashboardProps {
  documents: Document[];
  filters: CurationFilters;
  onFilterChange: (filters: CurationFilters) => void;
  onBatchAction: (action: BatchAction) => void;
}

// Estados Internos
- selectedDocuments: string[]
- sortCriteria: SortCriteria
- viewMode: 'list' | 'grid' | 'detailed'
- loadingStates: { [documentId: string]: boolean }
```

### DocumentCard
**Ubicación**: `components/curation/DocumentCard.tsx`  
**Responsabilidades**:
- Tarjeta individual de documento con información esencial
- Preview rápido del contenido
- Acciones de curación (aprobar/rechazar/priorizar)
- Indicadores visuales de estado y prioridad

```tsx
interface DocumentCardProps {
  document: Document;
  selected: boolean;
  onSelect: (id: string) => void;
  onCurate: (id: string, action: CurationAction) => void;
  onPreview: (id: string) => void;
  loading?: boolean;
}
```

### DocumentPreviewModal
**Ubicación**: `components/curation/DocumentPreviewModal.tsx`  
**Responsabilidades**:
- Vista modal del documento completo
- Navegación entre páginas del PDF
- Herramientas de zoom y anotación básica
- Resumen automático y metadata

```tsx
interface DocumentPreviewModalProps {
  document: Document;
  open: boolean;
  onClose: () => void;
  onCurate: (action: CurationAction) => void;
}
```

### BatchActionsPanel
**Ubicación**: `components/curation/BatchActionsPanel.tsx`  
**Responsabilidades**:
- Panel de acciones masivas
- Selección inteligente por filtros
- Confirmación de acciones batch
- Progreso de operaciones masivas

```tsx
interface BatchActionsPanelProps {
  selectedCount: number;
  availableActions: BatchAction[];
  onExecuteAction: (action: BatchAction) => void;
  processing: boolean;
}
```

## Componentes de Edición Editorial

### EditorialWorkspace
**Ubicación**: `components/editorial/EditorialWorkspace.tsx`  
**Responsabilidades**:
- Workspace principal de edición con vista dual
- Gestión de pestañas de artículos abiertos
- Auto-guardado y gestión de estado
- Integración con servicios de IA

```tsx
interface EditorialWorkspaceProps {
  articleId: string;
  sourceDocument?: Document;
  onSave: (content: ArticleContent) => void;
  onPublish: (article: Article) => void;
}

// Estados Críticos
- currentArticle: Article
- documentPanelState: DocumentPanelState
- editorState: EditorState
- aiOperations: AIOperationState[]
- autoSaveStatus: AutoSaveStatus
```

### DocumentViewer
**Ubicación**: `components/editorial/DocumentViewer.tsx`  
**Responsabilidades**:
- Visor de PDF/documentos fuente
- Herramientas de navegación y zoom
- Sincronización de scroll con editor
- Anotaciones y resaltado

```tsx
interface DocumentViewerProps {
  document: Document;
  currentPage: number;
  zoomLevel: number;
  onPageChange: (page: number) => void;
  onZoomChange: (zoom: number) => void;
  syncWithEditor?: boolean;
}
```

### ArticleEditor
**Ubicación**: `components/editorial/ArticleEditor.tsx`  
**Responsabilidades**:
- Editor de texto enriquecido para artículos
- Integración con funciones de IA
- Control de versiones inline
- Formato especializado jurídico

```tsx
interface ArticleEditorProps {
  article: Article;
  onChange: (content: string) => void;
  onAIRequest: (request: AIRequest) => void;
  readOnly?: boolean;
  showAIIndicators?: boolean;
}

// Funcionalidades Avanzadas
- aiSuggestions: AISuggestion[]
- selectionContext: SelectionContext
- formatCommands: FormatCommand[]
- citationManager: CitationManager
```

### AIAssistantPanel
**Ubicación**: `components/editorial/AIAssistantPanel.tsx`  
**Responsabilidades**:
- Panel de interacción con servicios de IA
- Configuración de parámetros de generación
- Preview de contenido generado
- Historial de operaciones de IA

```tsx
interface AIAssistantPanelProps {
  article: Article;
  onGenerateContent: (config: AIGenerationConfig) => void;
  onRegenerateSection: (section: string, params: RegenerationParams) => void;
  operations: AIOperation[];
}
```

### VersionHistoryPanel
**Ubicación**: `components/editorial/VersionHistoryPanel.tsx`  
**Responsabilidades**:
- Lista de versiones del artículo
- Comparación visual entre versiones
- Restauración de versiones anteriores
- Etiquetado de versiones

```tsx
interface VersionHistoryPanelProps {
  versions: ArticleVersion[];
  currentVersion: string;
  onCompare: (v1: string, v2: string) => void;
  onRestore: (versionId: string) => void;
  onCreateVersion: (label?: string) => void;
}
```

### ArticleTabsContainer
**Ubicación**: `components/editorial/ArticleTabsContainer.tsx`  
**Responsabilidades**:
- Gestión de múltiples artículos abiertos
- Persistencia de estado por pestaña
- Indicadores de cambios no guardados
- Navegación rápida entre artículos

```tsx
interface ArticleTabsContainerProps {
  openArticles: Article[];
  activeArticleId: string;
  onTabChange: (articleId: string) => void;
  onTabClose: (articleId: string) => void;
  onNewTab: () => void;
}
```

## Componentes de Multimedia

### MediaGallery
**Ubicación**: `components/multimedia/MediaGallery.tsx`  
**Responsabilidades**:
- Galería de imágenes generadas/disponibles
- Comparación visual lado a lado
- Filtrado por tipo y metadata
- Preview y selección de imágenes

```tsx
interface MediaGalleryProps {
  images: MediaAsset[];
  selectedImages: string[];
  onImageSelect: (ids: string[]) => void;
  onImageGenerate: (prompt: string) => void;
  generationInProgress?: boolean;
}
```

### ImageEditor
**Ubicación**: `components/multimedia/ImageEditor.tsx`  
**Responsabilidades**:
- Editor básico de imágenes (crop, resize, filtros)
- Preview de cambios en tiempo real
- Optimización automática para web
- Exportación en diferentes formatos

```tsx
interface ImageEditorProps {
  image: MediaAsset;
  onSave: (editedImage: EditedImageData) => void;
  onCancel: () => void;
  availableTools: EditorTool[];
}
```

### AIImageGenerator
**Ubicación**: `components/multimedia/AIImageGenerator.tsx`  
**Responsabilidades**:
- Interfaz para generación de imágenes con IA
- Configuración avanzada de parámetros
- Queue de generación con progreso
- Refinamiento iterativo de prompts

```tsx
interface AIImageGeneratorProps {
  articleContext: Article;
  onGenerate: (config: ImageGenerationConfig) => void;
  onRefinePrompt: (prompt: string) => void;
  generationQueue: GenerationRequest[];
}
```

### MediaLibrary
**Ubicación**: `components/multimedia/MediaLibrary.tsx`  
**Responsabilidades**:
- Biblioteca completa de assets multimedia
- Búsqueda y filtrado avanzado
- Gestión de metadatos y tags
- Reutilización de assets existentes

```tsx
interface MediaLibraryProps {
  assets: MediaAsset[];
  onAssetSelect: (asset: MediaAsset) => void;
  onAssetUpload: (files: File[]) => void;
  onAssetDelete: (id: string) => void;
  filters: MediaFilters;
}
```

## Componentes de Visualización de Estado

### ActivityHistoryPanel
**Ubicación**: `components/shared/ActivityHistoryPanel.tsx`  
**Responsabilidades**:
- Timeline de actividad del usuario
- Filtrado por tipo de acción y fechas
- Exportación del historial
- Navegación a recursos relacionados

```tsx
interface ActivityHistoryPanelProps {
  activities: AuditLog[];
  filters: ActivityFilters;
  onFilterChange: (filters: ActivityFilters) => void;
  onExport: (format: ExportFormat) => void;
  onActivityClick: (activity: AuditLog) => void;
}

// Estados Internos
- groupedActivities: GroupedActivities
- selectedDateRange: DateRange
- expandedActivities: Set<string>
```

### StatusIndicator
**Ubicación**: `components/ui/StatusIndicator.tsx`  
**Responsabilidades**:
- Indicador visual de estados del sistema
- Animaciones y transiciones suaves
- Soporte para múltiples tipos de estado
- Tooltip con información detallada

```tsx
interface StatusIndicatorProps {
  status: 'online' | 'offline' | 'saving' | 'saved' | 'error' | 'loading';
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
  tooltip?: string;
  pulse?: boolean;
}
```

### ProgressIndicator
**Ubicación**: `components/ui/ProgressIndicator.tsx`  
**Responsabilidades**:
- Barras y círculos de progreso
- Soporte para operaciones indeterminadas
- Estimación de tiempo restante
- Estados de error y éxito

```tsx
interface ProgressIndicatorProps {
  value?: number; // 0-100, undefined para indeterminate
  type: 'linear' | 'circular';
  status?: 'in-progress' | 'error' | 'success';
  estimatedTime?: number;
  label?: string;
}
```

### ConnectionStatusBar
**Ubicación**: `components/shared/ConnectionStatusBar.tsx`  
**Responsabilidades**:
- Barra de estado de conectividad
- Indicación de modo offline
- Reintentos de conexión automáticos
- Cola de operaciones pendientes

```tsx
interface ConnectionStatusBarProps {
  status: ConnectionStatus;
  pendingOperations?: number;
  onRetryConnection: () => void;
  onViewPendingOperations: () => void;
}
```

## Componentes de Utilidad y UI

### ErrorBoundary
**Ubicación**: `components/ui/ErrorBoundary.tsx`  
**Responsabilidades**:
- Captura errores de JavaScript en componentes hijos
- UI de respaldo para errores
- Reporte de errores al sistema de logging
- Opciones de recuperación para el usuario

```tsx
interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallbackComponent?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetOnPropsChange?: any[];
}
```

### LoadingSpinner
**Ubicación**: `components/ui/LoadingSpinner.tsx`  
**Responsabilidades**:
- Indicadores de carga uniformes
- Múltiples variaciones visuales
- Soporte para overlay y inline
- Texto descriptivo opcional

```tsx
interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  overlay?: boolean;
  text?: string;
  color?: 'primary' | 'secondary' | 'neutral';
}
```

### EmptyState
**Ubicación**: `components/ui/EmptyState.tsx`  
**Responsabilidades**:
- Estados vacíos informativos
- Call-to-action contextual
- Ilustraciones y iconografía
- Mensajes personalizables

```tsx
interface EmptyStateProps {
  title: string;
  description?: string;
  illustration?: React.ReactNode;
  primaryAction?: ActionButton;
  secondaryAction?: ActionButton;
}
```

### ConfirmDialog
**Ubicación**: `components/ui/ConfirmDialog.tsx`  
**Responsabilidades**:
- Diálogos de confirmación consistentes
- Soporte para acciones destructivas
- Personalización de mensajes y botones
- Keyboard navigation

```tsx
interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}
```

### ToastNotification
**Ubicación**: `components/ui/ToastNotification.tsx`  
**Responsabilidades**:
- Notificaciones emergentes temporales
- Queue de notificaciones múltiples
- Diferentes niveles de severidad
- Acciones inline opcionales

```tsx
interface ToastNotificationProps {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  action?: NotificationAction;
  onDismiss: (id: string) => void;
}
```

### SearchBox
**Ubicación**: `components/ui/SearchBox.tsx`  
**Responsabilidades**:
- Búsqueda con autocompletado
- Filtros contextuales
- Historial de búsquedas
- Shortcuts de teclado

```tsx
interface SearchBoxProps {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onSearch: (query: string) => void;
  suggestions?: SearchSuggestion[];
  filters?: SearchFilter[];
  loading?: boolean;
}
```

## Componentes del Portal Público

### PublicArticleList
**Ubicación**: `components/public-portal/PublicArticleList.tsx`  
**Responsabilidades**:
- Lista pública de artículos publicados
- Paginación y filtros públicos
- SEO optimization
- Responsive design

```tsx
interface PublicArticleListProps {
  articles: PublicArticle[];
  pagination: PaginationInfo;
  filters: PublicFilters;
  onFilterChange: (filters: PublicFilters) => void;
  onPageChange: (page: number) => void;
}
```

### PublicArticleView
**Ubicación**: `components/public-portal/PublicArticleView.tsx`  
**Responsabilidades**:
- Vista completa de artículo público
- Descarga de documentos fuente
- Compartir en redes sociales
- Navegación relacionada

```tsx
interface PublicArticleViewProps {
  article: PublicArticle;
  sourceDocument?: Document;
  relatedArticles: PublicArticle[];
  onDownloadSource: () => void;
  onShare: (platform: SocialPlatform) => void;
}
```

### PublicSearchInterface
**Ubicación**: `components/public-portal/PublicSearchInterface.tsx`  
**Responsabilidades**:
- Búsqueda pública avanzada
- Filtros por categoría jurídica
- Resultados con highlighting
- Guardado de búsquedas favoritas

```tsx
interface PublicSearchInterfaceProps {
  onSearch: (query: SearchQuery) => void;
  results: SearchResult[];
  loading: boolean;
  facets: SearchFacet[];
}
```

## Hooks Personalizados Críticos

### useAutoSave
**Ubicación**: `hooks/useAutoSave.ts`  
**Responsabilidades**:
- Auto-guardado configurable con debounce
- Manejo de errores y reintentos
- Estado visual del guardado
- Sincronización offline

### useAIOperations
**Ubicación**: `hooks/useAIOperations.ts`  
**Responsabilidades**:
- Gestión de operaciones de IA
- Queue de requests y rate limiting
- Fallback para servicios offline
- Cache de resultados

### useSessionState
**Ubicación**: `hooks/useSessionState.ts`  
**Responsabilidades**:
- Persistencia de estado entre sesiones
- Sincronización con localStorage
- Gestión de múltiples pestañas
- Limpieza automática de datos obsoletos

### useErrorRecovery
**Ubicación**: `hooks/useErrorRecovery.ts`  
**Responsabilidades**:
- Manejo centralizado de errores
- Estrategias de recuperación automática
- Notificación al usuario
- Logging y telemetría