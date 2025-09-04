# Servicios Internos y Dependencias - Sistema Editorial Jurídico Supervisado

## Servicios de Datos y APIs

### ApiClient
**Ubicación**: `services/api/ApiClient.ts`  
**Responsabilidades**: Cliente HTTP centralizado con interceptors, retry logic y manejo de errores.

```typescript
class ApiClient {
  private axiosInstance: AxiosInstance;
  
  // Configuración de reintentos automáticos
  setupRetryLogic(config: RetryConfig): void;
  
  // Interceptors para autenticación y logging
  setupInterceptors(): void;
  
  // Métodos principales
  get<T>(url: string, config?: RequestConfig): Promise<T>;
  post<T>(url: string, data?: any, config?: RequestConfig): Promise<T>;
  put<T>(url: string, data?: any, config?: RequestConfig): Promise<T>;
  delete<T>(url: string, config?: RequestConfig): Promise<T>;
  
  // Específico para uploads de archivos
  uploadFile(url: string, file: File, onProgress?: (progress: number) => void): Promise<any>;
}

interface RetryConfig {
  attempts: number;
  delayMs: number;
  backoffFactor: number;
  retryCondition: (error: AxiosError) => boolean;
}
```

**Ejemplo de uso**:
```typescript
const apiClient = new ApiClient({
  baseURL: process.env.REACT_APP_API_URL,
  timeout: 10000,
  retryConfig: {
    attempts: 3,
    delayMs: 1000,
    backoffFactor: 2,
    retryCondition: (error) => error.response?.status >= 500
  }
});
```

### DocumentService
**Ubicación**: `services/api/DocumentService.ts`  
**Responsabilidades**: Operaciones CRUD para documentos fuente y curación.

```typescript
class DocumentService {
  // Obtener documentos con filtros y paginación
  async getDocuments(filters: DocumentFilters): Promise<PaginatedResponse<Document>>;
  
  // Curación individual y masiva
  async curateDocument(id: string, action: CurationAction): Promise<Document>;
  async batchCurate(actions: BatchCurationAction[]): Promise<BatchResult>;
  
  // Preview y descarga de documentos
  async getDocumentPreview(id: string): Promise<DocumentPreview>;
  async downloadDocument(id: string): Promise<Blob>;
  
  // Búsqueda y filtrado avanzado
  async searchDocuments(query: SearchQuery): Promise<SearchResult<Document>>;
}
```

### ArticleService
**Ubicación**: `services/api/ArticleService.ts`  
**Responsabilidades**: Gestión completa del ciclo de vida de artículos.

```typescript
class ArticleService {
  // CRUD básico
  async createArticle(data: CreateArticleData): Promise<Article>;
  async getArticle(id: string): Promise<Article>;
  async updateArticle(id: string, data: UpdateArticleData): Promise<Article>;
  async deleteArticle(id: string): Promise<void>;
  
  // Gestión de versiones
  async createVersion(articleId: string, label?: string): Promise<ArticleVersion>;
  async getVersions(articleId: string): Promise<ArticleVersion[]>;
  async restoreVersion(articleId: string, versionId: string): Promise<Article>;
  async compareVersions(v1: string, v2: string): Promise<VersionComparison>;
  
  // Auto-guardado con debounce
  async autoSave(articleId: string, changes: Partial<Article>): Promise<AutoSaveResult>;
  
  // Publicación y programación
  async publishArticle(id: string, config: PublishConfig): Promise<Article>;
  async schedulePublication(id: string, scheduledDate: Date): Promise<Article>;
}
```

### AIService
**Ubicación**: `services/api/AIService.ts`  
**Responsabilidades**: Interfaz unificada para todos los servicios de IA.

```typescript
class AIService {
  // Generación de contenido
  async generateContent(config: ContentGenerationConfig): Promise<GenerationResult>;
  async regenerateSection(params: RegenerationParams): Promise<RegenerationResult>;
  
  // Generación de imágenes
  async generateImages(config: ImageGenerationConfig): Promise<ImageGenerationResult>;
  async refineImagePrompt(originalPrompt: string, feedback: string): Promise<string>;
  
  // Operaciones de procesamiento
  async summarizeDocument(documentId: string): Promise<DocumentSummary>;
  async extractKeywords(content: string): Promise<string[]>;
  async optimizeSEO(article: Article): Promise<SEOSuggestions>;
  
  // Gestión de queue y estado
  async getOperationStatus(operationId: string): Promise<OperationStatus>;
  async cancelOperation(operationId: string): Promise<void>;
}
```

### MediaService
**Ubicación**: `services/api/MediaService.ts`  
**Responsabilidades**: Gestión de archivos multimedia y optimización.

```typescript
class MediaService {
  // Upload y gestión básica
  async uploadMedia(file: File, metadata: MediaMetadata): Promise<MediaAsset>;
  async getMediaAsset(id: string): Promise<MediaAsset>;
  async deleteMediaAsset(id: string): Promise<void>;
  
  // Edición y optimización
  async editImage(id: string, operations: ImageOperation[]): Promise<MediaAsset>;
  async optimizeForWeb(id: string, quality: number): Promise<OptimizedVariant[]>;
  async generateThumbnails(id: string): Promise<ThumbnailSet>;
  
  // Biblioteca y búsqueda
  async searchMedia(filters: MediaFilters): Promise<PaginatedResponse<MediaAsset>>;
  async getMediaLibrary(userId: string): Promise<MediaLibrary>;
}
```

## Utilidades Compartidas

### DateUtils
**Ubicación**: `utils/dateUtils.ts`  
**Funcionalidades**:
- Formateo consistente de fechas en todo el sistema
- Conversión entre timezones
- Cálculo de rangos y diferencias

```typescript
export const DateUtils = {
  // Formateo estándar para la aplicación
  formatDate(timestamp: number, format: DateFormat = 'standard'): string;
  formatRelativeTime(timestamp: number): string; // "hace 2 horas"
  
  // Conversiones y cálculos
  toUserTimezone(timestamp: number, timezone: string): Date;
  getDateRange(type: 'today' | 'week' | 'month' | 'year'): DateRange;
  
  // Validaciones
  isValidDate(date: any): boolean;
  isWorkingDay(date: Date, locale: string = 'es-ES'): boolean;
  
  // Constantes útiles
  FORMATS: {
    STANDARD: 'DD/MM/YYYY HH:mm',
    SHORT: 'DD/MM/YY',
    ISO: 'YYYY-MM-DDTHH:mm:ssZ',
    LEGAL: 'D de MMMM de YYYY' // "15 de marzo de 2024"
  }
};
```

### ValidationUtils
**Ubicación**: `utils/validationUtils.ts`  
**Funcionalidades**:
- Validaciones de formularios y datos
- Sanitización de contenido
- Validaciones específicas del dominio jurídico

```typescript
export const ValidationUtils = {
  // Validaciones básicas
  isValidEmail(email: string): boolean;
  isValidURL(url: string): boolean;
  isValidUUID(uuid: string): boolean;
  
  // Validaciones de contenido
  validateArticleContent(content: string): ValidationResult;
  sanitizeHTML(html: string): string;
  extractPlainText(html: string): string;
  
  // Validaciones jurídicas específicas
  validateLegalCitation(citation: string): boolean;
  validateBarAssociationNumber(number: string): boolean;
  
  // Helpers para formularios
  createValidator(rules: ValidationRule[]): (value: any) => ValidationResult;
  combineValidators(...validators: Validator[]): Validator;
};
```

### StorageUtils
**Ubicación**: `utils/storageUtils.ts`  
**Funcionalidades**:
- Abstracción sobre localStorage/sessionStorage
- Gestión de quota y cleanup
- Encriptación de datos sensibles

```typescript
export const StorageUtils = {
  // Operaciones básicas con try/catch automático
  setItem(key: string, value: any, storage: 'local' | 'session' = 'local'): boolean;
  getItem<T>(key: string, defaultValue?: T, storage: 'local' | 'session' = 'local'): T;
  removeItem(key: string, storage: 'local' | 'session' = 'local'): boolean;
  
  // Gestión de datos con TTL
  setItemWithExpiry(key: string, value: any, ttlMs: number): boolean;
  getItemWithExpiry<T>(key: string, defaultValue?: T): T | null;
  
  // Limpieza y gestión de quota
  clearExpiredItems(): number; // retorna cantidad eliminada
  getStorageUsage(): StorageUsage;
  cleanupOldData(maxAgeMs: number): number;
  
  // Datos del editor específicamente
  saveEditorState(articleId: string, state: EditorState): boolean;
  getEditorState(articleId: string): EditorState | null;
  clearEditorState(articleId: string): boolean;
};
```

### TextUtils
**Ubicación**: `utils/textUtils.ts`  
**Funcionalidades**:
- Procesamiento y análisis de texto
- Utilidades específicas para contenido jurídico
- Extracción de metadata

```typescript
export const TextUtils = {
  // Análisis básico
  wordCount(text: string): number;
  readingTime(text: string, wpm: number = 200): number; // minutos
  extractKeywords(text: string, limit: number = 10): string[];
  
  // Formateo para contenido jurídico
  formatLegalCitation(citation: Citation): string;
  extractLegalReferences(text: string): LegalReference[];
  highlightLegalTerms(text: string, terms: string[]): string;
  
  // Utilidades para SEO
  generateSlug(title: string): string;
  truncateForMetaDescription(text: string, maxLength: number = 155): string;
  
  // Limpieza y sanitización
  removeHTMLTags(html: string): string;
  normalizeWhitespace(text: string): string;
  escapeForRegex(text: string): string;
};
```

### ErrorUtils
**Ubicación**: `utils/errorUtils.ts`  
**Funcionalidades**:
- Manejo centralizado de errores
- Logging y reporting
- Mensajes user-friendly

```typescript
export const ErrorUtils = {
  // Clasificación de errores
  classifyError(error: Error): ErrorClassification;
  isRecoverable(error: Error): boolean;
  getRecoveryActions(error: Error): RecoveryAction[];
  
  // Logging estructurado
  logError(error: Error, context: ErrorContext): void;
  logWarning(message: string, context?: any): void;
  
  // Mensajes para usuario
  getUserFriendlyMessage(error: Error): string;
  getActionableMessage(error: Error): ActionableMessage;
  
  // Retry logic
  withRetry<T>(
    operation: () => Promise<T>,
    config: RetryConfig
  ): Promise<T>;
  
  createRetryConfig(maxAttempts: number, baseDelay: number): RetryConfig;
};
```

## Hooks Personalizados Avanzados

### useApiQuery
**Ubicación**: `hooks/useApiQuery.ts`  
**Funcionalidades**:
- Query management con cache y revalidación
- Estado de loading y error unificado
- Optimistic updates

```typescript
interface UseApiQueryOptions<T> {
  enabled?: boolean;
  refetchOnWindowFocus?: boolean;
  staleTime?: number;
  cacheTime?: number;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  retry?: number | ((failureCount: number, error: Error) => boolean);
}

export function useApiQuery<T>(
  key: QueryKey,
  queryFn: () => Promise<T>,
  options?: UseApiQueryOptions<T>
) {
  return {
    data: T | undefined,
    isLoading: boolean,
    error: Error | null,
    refetch: () => Promise<void>,
    isStale: boolean,
    invalidate: () => void
  };
}
```

### useRealtimeSync
**Ubicación**: `hooks/useRealtimeSync.ts`  
**Funcionalidades**:
- Sincronización en tiempo real via SSE/WebSocket
- Reconexión automática
- Estado de conexión

```typescript
export function useRealtimeSync(endpoint: string, options?: RealtimeSyncOptions) {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [lastMessage, setLastMessage] = useState<RealtimeMessage | null>(null);
  
  // Métodos expuestos
  return {
    connectionStatus,
    lastMessage,
    subscribe: (eventType: string, handler: MessageHandler) => void,
    unsubscribe: (eventType: string) => void,
    reconnect: () => void,
    disconnect: () => void
  };
}
```

### useOptimisticUpdate
**Ubicación**: `hooks/useOptimisticUpdate.ts`  
**Funcionalidades**:
- Updates optimistas con rollback automático
- Manejo de conflictos
- UI state management

```typescript
export function useOptimisticUpdate<T>(
  currentData: T,
  updateFn: (data: T) => Promise<T>,
  options?: OptimisticUpdateOptions<T>
) {
  return {
    data: T,
    isUpdating: boolean,
    error: Error | null,
    optimisticUpdate: (updater: (data: T) => T) => void,
    rollback: () => void,
    retry: () => void
  };
}
```

### useDebounceCallback
**Ubicación**: `hooks/useDebounceCallback.ts`  
**Funcionalidades**:
- Debouncing avanzado con cancelación
- Diferentes estrategias de delay
- Estado de pendiente

```typescript
export function useDebounceCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  options?: DebounceOptions
) {
  return {
    debouncedCallback: T,
    isPending: boolean,
    cancel: () => void,
    flush: () => void
  };
}
```

### useFormValidation
**Ubicación**: `hooks/useFormValidation.ts`  
**Funcionalidades**:
- Validación de formularios con rules engine
- Validación asíncrona
- Estado de validación por campo

```typescript
export function useFormValidation<T extends Record<string, any>>(
  initialValues: T,
  validationRules: ValidationRules<T>,
  options?: FormValidationOptions
) {
  return {
    values: T,
    errors: ValidationErrors<T>,
    isValid: boolean,
    isSubmitting: boolean,
    setValue: (field: keyof T, value: any) => void,
    validateField: (field: keyof T) => Promise<boolean>,
    validateAll: () => Promise<boolean>,
    reset: (newValues?: Partial<T>) => void,
    submit: (onSubmit: (values: T) => Promise<void>) => Promise<void>
  };
}
```

## Servicios de Estado Global

### EditorStore
**Ubicación**: `stores/editorStore.ts`  
**Responsabilidades**: Estado global del editor y artículos abiertos.

```typescript
interface EditorState {
  // Artículos y pestañas
  openArticles: Article[];
  activeArticleId: string | null;
  
  // Estado del editor
  editorSettings: EditorSettings;
  autoSaveEnabled: boolean;
  
  // Operaciones de IA en progreso
  aiOperations: Map<string, AIOperation>;
  
  // Estado de sincronización
  unsavedChanges: Map<string, UnsavedChanges>;
  lastAutoSave: Map<string, number>;
}

export const useEditorStore = create<EditorState & EditorActions>((set, get) => ({
  // Estado inicial
  openArticles: [],
  activeArticleId: null,
  editorSettings: DEFAULT_EDITOR_SETTINGS,
  // ... más estado
  
  // Acciones
  openArticle: (article: Article) => { /* implementación */ },
  closeArticle: (articleId: string) => { /* implementación */ },
  updateArticleContent: (articleId: string, content: string) => { /* implementación */ },
  triggerAutoSave: (articleId: string) => { /* implementación */ },
  // ... más acciones
}));
```

### UserStore
**Ubicación**: `stores/userStore.ts`  
**Responsabilidades**: Estado de usuario, autenticación y preferencias.

```typescript
interface UserState {
  currentUser: User | null;
  isAuthenticated: boolean;
  permissions: Permission[];
  preferences: UserPreferences;
  session: UserSession | null;
}

export const useUserStore = create<UserState & UserActions>()(
  persist(
    (set, get) => ({
      // Estado y acciones
    }),
    {
      name: 'user-storage',
      partialize: (state) => ({
        preferences: state.preferences,
        // Solo persistir datos no sensibles
      }),
    }
  )
);
```

### NotificationStore
**Ubicación**: `stores/notificationStore.ts`  
**Responsabilidades**: Gestión centralizada de notificaciones y toasts.

```typescript
interface NotificationState {
  notifications: Notification[];
  toasts: Toast[];
  unreadCount: number;
}

export const useNotificationStore = create<NotificationState & NotificationActions>((set, get) => ({
  notifications: [],
  toasts: [],
  unreadCount: 0,
  
  addNotification: (notification: CreateNotificationData) => {
    const newNotification = {
      id: generateId(),
      createdAt: Date.now(),
      read: false,
      ...notification
    };
    set(state => ({
      notifications: [newNotification, ...state.notifications],
      unreadCount: state.unreadCount + 1
    }));
  },
  
  addToast: (toast: CreateToastData) => {
    const newToast = {
      id: generateId(),
      createdAt: Date.now(),
      duration: 5000,
      ...toast
    };
    set(state => ({
      toasts: [...state.toasts, newToast]
    }));
    
    // Auto-remove después del duration
    setTimeout(() => {
      get().removeToast(newToast.id);
    }, newToast.duration);
  }
}));
```

## Servicios de Configuración y Ambiente

### ConfigService
**Ubicación**: `services/config/ConfigService.ts`  
**Responsabilidades**: Gestión centralizada de configuración.

```typescript
class ConfigService {
  private config: AppConfig;
  
  constructor() {
    this.config = this.loadConfig();
  }
  
  // Getters tipados para diferentes secciones
  get api(): ApiConfig { return this.config.api; }
  get ai(): AIConfig { return this.config.ai; }
  get editor(): EditorConfig { return this.config.editor; }
  get storage(): StorageConfig { return this.config.storage; }
  
  // Métodos de configuración
  isFeatureEnabled(feature: FeatureFlag): boolean;
  getEnvironment(): 'development' | 'staging' | 'production';
  
  // Configuración dinámica
  async updateRemoteConfig(): Promise<void>;
  
  private loadConfig(): AppConfig {
    return {
      api: {
        baseURL: process.env.REACT_APP_API_URL!,
        timeout: parseInt(process.env.REACT_APP_API_TIMEOUT!) || 10000,
        retryAttempts: 3
      },
      ai: {
        primaryService: 'openai',
        fallbackServices: ['anthropic', 'local'],
        timeout: 30000,
        maxConcurrentRequests: 3
      },
      // ... más configuración
    };
  }
}

export const configService = new ConfigService();
```

### FeatureFlags
**Ubicación**: `services/config/FeatureFlags.ts`  
**Responsabilidades**: Sistema de feature flags para desarrollo incremental.

```typescript
export enum FeatureFlag {
  AI_IMAGE_GENERATION = 'ai_image_generation',
  ADVANCED_EDITOR = 'advanced_editor', 
  REALTIME_COLLABORATION = 'realtime_collaboration',
  BETA_FEATURES = 'beta_features',
  EXPERIMENTAL_AI = 'experimental_ai'
}

export const FeatureFlags = {
  isEnabled(flag: FeatureFlag, user?: User): boolean {
    // Lógica para determinar si una feature está habilitada
    // Puede depender del usuario, ambiente, configuración remota, etc.
    const config = configService.get('featureFlags');
    return config[flag]?.enabled || false;
  },
  
  getConfig(flag: FeatureFlag): FeatureFlagConfig | null {
    const config = configService.get('featureFlags');
    return config[flag] || null;
  },
  
  // Hook para usar en componentes
  useFeatureFlag(flag: FeatureFlag): boolean {
    const user = useUserStore(state => state.currentUser);
    return this.isEnabled(flag, user);
  }
};
```

## Herramientas de Desarrollo y Testing

### MockServices
**Ubicación**: `services/mock/index.ts`  
**Funcionalidades**:
- Mocks para desarrollo y testing
- Simulación de latencia de red
- Datos de prueba realistas

```typescript
export const MockServices = {
  document: new MockDocumentService(),
  article: new MockArticleService(),
  ai: new MockAIService(),
  media: new MockMediaService(),
  
  // Control global de mocking
  enableMocking: (enabled: boolean) => void,
  setLatency: (min: number, max: number) => void,
  simulateErrors: (errorRate: number) => void
};
```

### DevTools
**Ubicación**: `utils/devTools.ts`  
**Funcionalidades**:
- Herramientas de debugging específicas del dominio
- Inspección de estado en desarrollo
- Profiling de performance

```typescript
export const DevTools = {
  // Inspector de estado
  inspectEditorState: () => console.table(useEditorStore.getState()),
  inspectAIOperations: () => /* logging detallado */,
  
  // Performance monitoring
  measureRenderTime: (componentName: string) => /* HOC decorator */,
  profileAIOperations: () => /* timing y métricas */,
  
  // Utilidades de testing
  generateTestData: {
    documents: (count: number) => Document[],
    articles: (count: number) => Article[],
    users: (count: number) => User[]
  },
  
  // Solo disponible en desarrollo
  enabled: process.env.NODE_ENV === 'development'
};
```

## Patrones de Integración Recomendados

### Service Locator Pattern
Para evitar import hell y facilitar testing:

```typescript
// services/ServiceLocator.ts
export class ServiceLocator {
  private static services = new Map<string, any>();
  
  static register<T>(name: string, service: T): void {
    this.services.set(name, service);
  }
  
  static get<T>(name: string): T {
    const service = this.services.get(name);
    if (!service) {
      throw new Error(`Service ${name} not found`);
    }
    return service;
  }
}

// Registro en index.tsx
ServiceLocator.register('documentService', new DocumentService(apiClient));
ServiceLocator.register('articleService', new ArticleService(apiClient));
// ... otros servicios
```

### Dependency Injection para Hooks
```typescript
// hooks/useServiceContext.ts
const ServiceContext = React.createContext<Services | null>(null);

export function useServices() {
  const services = useContext(ServiceContext);
  if (!services) {
    throw new Error('useServices must be used within ServiceProvider');
  }
  return services;
}
```

**CRÍTICO**: Todos los servicios deben usar estas utilidades compartidas para evitar duplicación de código y mantener consistencia en el manejo de errores, logging y estado.