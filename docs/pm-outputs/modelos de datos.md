# Modelos de Datos - Sistema Editorial Jurídico Supervisado

## Modelos Core del Dominio Jurídico

### Document (Documento Fuente)
```typescript
interface Document {
  id: string; // UUID
  title: string;
  source: DocumentSource;
  url: string;
  original_file_path?: string;
  publication_date: number; // timestamp
  legal_area: LegalArea;
  document_type: DocumentType;
  priority: Priority;
  status: DocumentStatus;
  
  // IA Generated Content
  ai_summary: string;
  confidence_score: number; // 0-1
  keywords: string[];
  relevance_tags: string[];
  
  // Curación
  curated_by?: string; // User ID
  curated_at?: number;
  curation_notes?: string;
  estimated_effort?: number; // minutos
  
  // Metadata
  created_at: number;
  updated_at: number;
  scraped_at: number;
  metadata: DocumentMetadata;
}

interface DocumentMetadata {
  pages: number;
  file_size: number; // bytes
  language: string;
  encoding?: string;
  ocr_processed?: boolean;
  text_confidence?: number;
  source_reliability: number; // 0-1
}

enum DocumentSource {
  BOE = 'boe',
  TRIBUNAL_SUPREMO = 'tribunal_supremo',
  TRIBUNAL_CONSTITUCIONAL = 'tribunal_constitucional',
  MINISTERIO_JUSTICIA = 'ministerio_justicia',
  COMUNIDADES_AUTONOMAS = 'ccaa',
  OTROS = 'otros'
}

enum LegalArea {
  CIVIL = 'civil',
  PENAL = 'penal',
  MERCANTIL = 'mercantil',
  LABORAL = 'laboral',
  ADMINISTRATIVO = 'administrativo',
  FISCAL = 'fiscal',
  CONSTITUCIONAL = 'constitucional'
}

enum DocumentType {
  LEY = 'ley',
  REAL_DECRETO = 'real_decreto',
  SENTENCIA = 'sentencia',
  RESOLUCION = 'resolucion',
  CIRCULAR = 'circular',
  INSTRUCCION = 'instruccion'
}

enum DocumentStatus {
  PENDING = 'pending',
  APPROVED = 'approved', 
  REJECTED = 'rejected',
  PROCESSING = 'processing',
  ERROR = 'error'
}

enum Priority {
  LOW = 'low',
  NORMAL = 'normal', 
  HIGH = 'high',
  URGENT = 'urgent'
}
```

### Article (Artículo Editorial)
```typescript
interface Article {
  id: string; // UUID
  source_document_id: string;
  
  // Contenido Principal
  title: string;
  slug: string; // URL-friendly
  content: string; // HTML
  summary: string;
  
  // SEO y Marketing
  seo_title?: string;
  meta_description?: string;
  keywords: string[];
  canonical_url?: string;
  
  // Categorización
  legal_area: LegalArea;
  publication_section: PublicationSection;
  tags: string[];
  
  // Estado Editorial
  status: ArticleStatus;
  author_id: string;
  editor_id?: string;
  
  // Configuración de Publicación
  scheduled_publication?: number;
  published_at?: number;
  
  // Métricas y Analytics
  word_count: number;
  reading_time: number; // minutos
  view_count?: number;
  engagement_score?: number;
  
  // Multimedia
  featured_image_id?: string;
  gallery_image_ids: string[];
  
  // Timestamps
  created_at: number;
  updated_at: number;
  last_edited_at: number;
  
  // AI Metadata
  ai_generated_sections: AIGenerationMetadata[];
  generation_parameters?: AIGenerationConfig;
}

interface AIGenerationMetadata {
  section: string;
  generated_at: number;
  model_used: string;
  confidence_score: number;
  prompt_used: string;
  user_edited: boolean;
}

interface AIGenerationConfig {
  target_length: number;
  tone: GenerationTone;
  focus_areas: string[];
  include_practical_examples: boolean;
  citation_style: CitationStyle;
}

enum ArticleStatus {
  DRAFT = 'draft',
  IN_REVIEW = 'in_review',
  READY_TO_PUBLISH = 'ready_to_publish',
  SCHEDULED = 'scheduled',
  PUBLISHED = 'published',
  ARCHIVED = 'archived'
}

enum PublicationSection {
  ACTUALIZACIONES_NORMATIVAS = 'actualizaciones_normativas',
  JURISPRUDENCIA = 'jurisprudencia', 
  ANALISIS_PRACTICO = 'analisis_practico',
  DOCTRINA = 'doctrina',
  MAS_RECIENTES = 'mas_recientes'
}

enum GenerationTone {
  PROFESSIONAL = 'professional',
  ACADEMIC = 'academic',
  ACCESSIBLE = 'accessible'
}

enum CitationStyle {
  ACADEMICA = 'academica',
  PROFESIONAL = 'profesional',
  SIMPLIFICADA = 'simplificada'
}
```

### ArticleVersion (Control de Versiones)
```typescript
interface ArticleVersion {
  id: string; // UUID
  article_id: string;
  version_number: number;
  label?: string; // etiqueta descriptiva
  
  // Contenido de la Versión
  title: string;
  content: string;
  summary: string;
  seo_title?: string;
  meta_description?: string;
  
  // Metadata de Versión
  created_by: string;
  created_at: number;
  auto_generated: boolean;
  change_summary?: string;
  
  // Comparación
  diff_from_previous?: VersionDiff[];
  word_count_delta: number;
}

interface VersionDiff {
  type: 'addition' | 'deletion' | 'modification';
  section: string;
  content: string;
  position: number;
}
```

## Modelos de Gestión de Estado y Sesión

### UserSession (Sesión de Usuario)
```typescript
interface UserSession {
  id: string; // UUID
  user_id: string;
  
  // Estado de la Aplicación
  active_articles: string[]; // IDs de artículos abiertos
  current_article_id?: string;
  editor_state: EditorState;
  ui_preferences: UIPreferences;
  
  // Datos de Trabajo Temporal
  draft_changes: DraftChanges[];
  unsaved_content: { [articleId: string]: string };
  
  // Session Info
  created_at: number;
  last_access: number;
  expires_at: number;
  device_info: DeviceInfo;
  ip_address: string;
}

interface EditorState {
  split_view_ratio: number; // 0.5 = 50/50
  pdf_zoom_level: number;
  pdf_current_page: number;
  text_editor_cursor_position?: number;
  active_editor_tab: string;
  sidebar_collapsed: boolean;
}

interface UIPreferences {
  theme: 'light' | 'dark' | 'system';
  font_size: 'small' | 'medium' | 'large';
  auto_save_interval: number; // segundos
  show_ai_confidence: boolean;
  default_generation_tone: GenerationTone;
}

interface DraftChanges {
  article_id: string;
  field: string;
  old_value: string;
  new_value: string;
  timestamp: number;
  saved: boolean;
}

interface DeviceInfo {
  user_agent: string;
  screen_resolution: string;
  timezone: string;
  language: string;
}
```

### User (Usuario del Sistema)
```typescript
interface User {
  id: string; // UUID
  email: string;
  
  // Información Personal
  first_name: string;
  last_name: string;
  professional_title?: string;
  bar_association_number?: string;
  
  // Configuración de Cuenta
  role: UserRole;
  status: UserStatus;
  preferences: UserPreferences;
  
  // Especializaciones Jurídicas
  legal_specializations: LegalArea[];
  experience_level: ExperienceLevel;
  
  // Actividad
  last_login: number;
  login_count: number;
  articles_created: number;
  articles_published: number;
  
  // Timestamps
  created_at: number;
  updated_at: number;
  verified_at?: number;
}

interface UserPreferences {
  notification_settings: NotificationSettings;
  editor_preferences: EditorPreferences;
  content_preferences: ContentPreferences;
}

interface NotificationSettings {
  email_notifications: boolean;
  push_notifications: boolean;
  document_alerts: boolean;
  publication_reminders: boolean;
  system_updates: boolean;
}

interface EditorPreferences {
  auto_save_enabled: boolean;
  auto_save_interval: number;
  spell_check_enabled: boolean;
  grammar_suggestions: boolean;
  ai_assistance_level: 'minimal' | 'standard' | 'extensive';
}

interface ContentPreferences {
  default_legal_areas: LegalArea[];
  preferred_generation_tone: GenerationTone;
  default_article_length: number;
  include_practical_examples: boolean;
}

enum UserRole {
  ADMIN = 'admin',
  EDITOR_SENIOR = 'editor_senior',
  EDITOR = 'editor',
  REVIEWER = 'reviewer'
}

enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING_VERIFICATION = 'pending_verification'
}

enum ExperienceLevel {
  JUNIOR = 'junior',
  MIDDLE = 'middle', 
  SENIOR = 'senior',
  EXPERT = 'expert'
}
```

## Modelos de Auditoría y Historial

### AuditLog (Registro de Auditoría)
```typescript
interface AuditLog {
  id: string; // UUID
  user_id: string;
  session_id: string;
  
  // Acción Realizada
  action_type: ActionType;
  resource_type: ResourceType;
  resource_id: string;
  
  // Detalles de la Acción
  details: ActionDetails;
  result: ActionResult;
  
  // Contexto Técnico
  timestamp: number;
  ip_address: string;
  user_agent: string;
  request_id?: string;
  
  // Metadata Adicional
  severity: LogSeverity;
  category: LogCategory;
}

interface ActionDetails {
  changes?: FieldChanges[];
  previous_state?: any;
  new_state?: any;
  ai_parameters?: AIGenerationConfig;
  custom_data?: { [key: string]: any };
}

interface FieldChanges {
  field_name: string;
  old_value: any;
  new_value: any;
  change_type: 'create' | 'update' | 'delete';
}

interface ActionResult {
  success: boolean;
  error_code?: string;
  error_message?: string;
  execution_time?: number; // ms
  resources_affected?: string[];
}

enum ActionType {
  // Document Actions
  DOCUMENT_CURATED = 'document_curated',
  DOCUMENT_REJECTED = 'document_rejected',
  
  // Article Actions  
  ARTICLE_CREATED = 'article_created',
  ARTICLE_UPDATED = 'article_updated',
  ARTICLE_PUBLISHED = 'article_published',
  ARTICLE_ARCHIVED = 'article_archived',
  
  // AI Actions
  CONTENT_GENERATED = 'content_generated',
  CONTENT_REGENERATED = 'content_regenerated',
  IMAGE_GENERATED = 'image_generated',
  
  // User Actions
  USER_LOGIN = 'user_login',
  USER_LOGOUT = 'user_logout',
  PREFERENCES_UPDATED = 'preferences_updated',
  
  // System Actions
  AUTO_SAVE_PERFORMED = 'auto_save_performed',
  BACKUP_CREATED = 'backup_created',
  ERROR_OCCURRED = 'error_occurred'
}

enum ResourceType {
  DOCUMENT = 'document',
  ARTICLE = 'article', 
  USER = 'user',
  SESSION = 'session',
  MEDIA = 'media',
  SYSTEM = 'system'
}

enum LogSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

enum LogCategory {
  EDITORIAL = 'editorial',
  AI_OPERATIONS = 'ai_operations',
  USER_ACTIVITY = 'user_activity',
  SYSTEM = 'system',
  SECURITY = 'security'
}
```

## Modelos de Multimedia y Assets

### MediaAsset (Recurso Multimedia)
```typescript
interface MediaAsset {
  id: string; // UUID
  
  // Información del Archivo
  filename: string;
  original_filename: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  
  // Categorización
  asset_type: MediaType;
  usage_type: UsageType;
  tags: string[];
  
  // Metadata Visual (para imágenes)
  dimensions?: ImageDimensions;
  color_palette?: string[];
  
  // Generación IA (si aplica)
  ai_generated: boolean;
  generation_prompt?: string;
  generation_model?: string;
  generation_parameters?: ImageGenerationConfig;
  
  // Optimización
  optimized_variants: OptimizedVariant[];
  seo_data?: ImageSEOData;
  
  // Uso y Referencias
  used_in_articles: string[];
  download_count: number;
  
  // Timestamps
  created_at: number;
  uploaded_at: number;
  last_used: number;
  
  // Metadata del Creador
  created_by: string;
  license?: LicenseInfo;
}

interface ImageDimensions {
  width: number;
  height: number;
  aspect_ratio: number;
  orientation: 'portrait' | 'landscape' | 'square';
}

interface OptimizedVariant {
  id: string;
  variant_type: 'thumbnail' | 'small' | 'medium' | 'large' | 'original';
  file_path: string;
  dimensions: ImageDimensions;
  file_size: number;
  quality: number;
}

interface ImageSEOData {
  alt_text: string;
  title: string;
  caption?: string;
  description?: string;
}

interface ImageGenerationConfig {
  style: string;
  color_scheme: string[];
  composition: string;
  mood: string;
  technical_specs: string;
}

interface LicenseInfo {
  type: 'public_domain' | 'cc_by' | 'cc_by_sa' | 'proprietary' | 'ai_generated';
  attribution_required: boolean;
  commercial_use_allowed: boolean;
  source_url?: string;
}

enum MediaType {
  IMAGE = 'image',
  VIDEO = 'video', 
  DOCUMENT = 'document',
  AUDIO = 'audio'
}

enum UsageType {
  HERO_IMAGE = 'hero_image',
  ILLUSTRATION = 'illustration',
  DIAGRAM = 'diagram',
  SCREENSHOT = 'screenshot',
  LOGO = 'logo',
  ICON = 'icon'
}
```

## Modelos de Estado de Error y Recuperación

### ErrorState (Estado de Error del Sistema)
```typescript
interface ErrorState {
  id: string; // UUID
  
  // Clasificación del Error
  error_code: string;
  error_type: ErrorType;
  severity: ErrorSeverity;
  
  // Información del Error
  message: string;
  technical_details: string;
  stack_trace?: string;
  
  // Contexto
  context: ErrorContext;
  user_id?: string;
  session_id?: string;
  
  // Estado de Recuperación
  recoverable: boolean;
  recovery_actions: RecoveryAction[];
  retry_count: number;
  max_retries: number;
  
  // Timing
  occurred_at: number;
  resolved_at?: number;
  next_retry_at?: number;
  
  // Metadata
  affected_features: string[];
  user_notified: boolean;
  escalated: boolean;
}

interface ErrorContext {
  component: string;
  operation: string;
  request_id?: string;
  resource_id?: string;
  parameters?: { [key: string]: any };
  browser_info?: BrowserInfo;
  network_status?: NetworkStatus;
}

interface BrowserInfo {
  user_agent: string;
  viewport_size: string;
  connection_type?: string;
  memory_usage?: number;
  cpu_usage?: number;
}

interface NetworkStatus {
  online: boolean;
  connection_speed?: string;
  last_successful_request?: number;
  failed_requests_count: number;
}

interface RecoveryAction {
  action_type: RecoveryActionType;
  description: string;
  auto_executed: boolean;
  executed_at?: number;
  success: boolean;
  details?: string;
}

enum ErrorType {
  NETWORK_ERROR = 'network_error',
  API_ERROR = 'api_error',
  AI_SERVICE_ERROR = 'ai_service_error',
  VALIDATION_ERROR = 'validation_error',
  AUTHENTICATION_ERROR = 'authentication_error',
  PERMISSION_ERROR = 'permission_error',
  DATA_CORRUPTION = 'data_corruption',
  SYSTEM_ERROR = 'system_error'
}

enum ErrorSeverity {
  LOW = 'low',           // No afecta funcionalidad core
  MEDIUM = 'medium',     // Funcionalidad reducida
  HIGH = 'high',         // Funcionalidad core afectada
  CRITICAL = 'critical'  // Sistema no funcional
}

enum RecoveryActionType {
  RETRY_REQUEST = 'retry_request',
  FALLBACK_SERVICE = 'fallback_service',
  RESTORE_BACKUP = 'restore_backup',
  CLEAR_CACHE = 'clear_cache',
  REFRESH_TOKEN = 'refresh_token',
  USER_INTERVENTION = 'user_intervention'
}
```

## Modelos de Configuración del Sistema

### SystemConfig (Configuración del Sistema)
```typescript
interface SystemConfig {
  id: string;
  
  // Configuración de IA
  ai_config: AIServiceConfig;
  
  // Configuración de Scraping
  scraping_config: ScrapingConfig;
  
  // Configuración Editorial
  editorial_config: EditorialConfig;
  
  // Configuración de Performance
  performance_config: PerformanceConfig;
  
  // Timestamps
  created_at: number;
  updated_at: number;
  active_from: number;
}

interface AIServiceConfig {
  primary_service: string;
  fallback_services: string[];
  timeout_seconds: number;
  retry_attempts: number;
  rate_limits: { [service: string]: number };
  quality_thresholds: QualityThresholds;
}

interface QualityThresholds {
  min_confidence_score: number;
  max_generation_time: number;
  min_content_length: number;
  max_content_length: number;
}

interface ScrapingConfig {
  enabled_sources: DocumentSource[];
  scraping_intervals: { [source: string]: number };
  content_filters: ContentFilter[];
  quality_checks: QualityCheck[];
}

interface ContentFilter {
  type: 'keyword' | 'regex' | 'date_range' | 'size';
  criteria: string;
  action: 'include' | 'exclude';
}

interface QualityCheck {
  name: string;
  enabled: boolean;
  threshold: number;
  action: 'warn' | 'reject' | 'flag';
}

interface EditorialConfig {
  auto_save_interval: number;
  max_article_versions: number;
  default_publication_section: PublicationSection;
  approval_workflow_enabled: boolean;
  ai_assistance_level: 'minimal' | 'standard' | 'extensive';
}

interface PerformanceConfig {
  max_concurrent_ai_requests: number;
  cache_duration_seconds: number;
  max_file_upload_size: number;
  image_optimization_quality: number;
  database_query_timeout: number;
}
```