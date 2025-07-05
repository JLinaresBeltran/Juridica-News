# Data Models - Multi-Agent Health Insight System

## Overview

This document defines all data models, interfaces, and type definitions for the Multi-Agent Health Insight System. All models are designed to handle health data securely while enabling comprehensive analysis.

## Core Thread Management Models

### Thread
Represents a health consultation conversation.

```typescript
interface Thread {
  id: string; // UUID v4
  title: string; // Auto-generated from first query
  createdAt: number; // Unix timestamp
  updatedAt: number; // Unix timestamp
  messages: Message[];
  results: ResultGroup[];
  metadata: ThreadMetadata;
  isDeleted: boolean;
  deletedAt?: number;
}

interface ThreadMetadata {
  source: 'web_app' | 'mobile_app' | 'api';
  sessionId: string;
  tags?: string[];
  starred?: boolean;
  lastViewedAt?: number;
}
```

### Message
Individual messages within a thread.

```typescript
interface Message {
  id: string; // msg_[uuid]
  threadId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  queryId?: string; // Links to query for user messages
  specialistResults?: string[]; // Result IDs for assistant messages
  metadata?: MessageMetadata;
}

interface MessageMetadata {
  edited?: boolean;
  editedAt?: number;
  tokensUsed?: number;
  modelUsed?: string;
}
```

## Query and Result Models

### HealthQuery
Represents a user's health question.

```typescript
interface HealthQuery {
  id: string; // qry_[uuid]
  threadId: string;
  query: string;
  timestamp: number;
  complexity: QueryComplexity;
  status: QueryStatus;
  specialistsAssigned: string[];
  estimatedDuration?: number;
  actualDuration?: number;
}

enum QueryComplexity {
  SIMPLE = 'simple',       // 1 specialist, < 5 seconds
  STANDARD = 'standard',   // 2-3 specialists, < 15 seconds
  COMPLEX = 'complex',     // 4-6 specialists, < 30 seconds
  CRITICAL = 'critical'    // Priority processing, all relevant specialists
}

enum QueryStatus {
  PENDING = 'pending',
  ANALYZING = 'analyzing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}
```

### ResultGroup
Groups all results for a specific query.

```typescript
interface ResultGroup {
  queryId: string;
  query: string;
  timestamp: number;
  complexity: QueryComplexity;
  results: AnalysisResult[];
  synthesis?: SynthesisResult;
  visualizations: string[]; // Visualization IDs
  metadata: ResultMetadata;
}

interface ResultMetadata {
  totalDataPoints: number;
  timeRangeAnalyzed: {
    start: string; // ISO date
    end: string;   // ISO date
  };
  confidence: number; // 0-1
  dataSources: string[];
}
```

### AnalysisResult
Individual specialist analysis result.

```typescript
interface AnalysisResult {
  id: string; // res_[uuid]
  queryId: string;
  specialist: MedicalSpecialty;
  status: SpecialistStatus;
  timestamp: number;
  confidence: number; // 0-1
  findings: SpecialistFindings;
  metadata: SpecialistMetadata;
}

interface SpecialistFindings {
  summary: string;
  details: string;
  keyMetrics: HealthMetric[];
  recommendations?: string[];
  warnings?: HealthWarning[];
  correlations?: Correlation[];
}

interface SpecialistMetadata {
  analysisTime: number; // milliseconds
  dataPointsAnalyzed: number;
  toolsUsed: string[];
  errorCount: number;
  retryCount: number;
}
```

### SynthesisResult
CMO's comprehensive synthesis of all specialist findings.

```typescript
interface SynthesisResult {
  summary: string;
  keyFindings: KeyFinding[];
  recommendations: Recommendation[];
  followUpSuggestions: string[];
  confidenceLevel: number;
  limitations?: string[];
}

interface KeyFinding {
  finding: string;
  severity: 'info' | 'warning' | 'critical';
  supportingSpecialists: MedicalSpecialty[];
  confidence: number;
}

interface Recommendation {
  action: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  rationale: string;
  timeframe?: string;
}
```

## Medical Domain Models

### Medical Specialties
```typescript
enum MedicalSpecialty {
  GENERAL_PRACTICE = 'general_practice',
  CARDIOLOGY = 'cardiology',
  ENDOCRINOLOGY = 'endocrinology',
  LABORATORY_MEDICINE = 'laboratory_medicine',
  DATA_ANALYSIS = 'data_analysis',
  PREVENTIVE_MEDICINE = 'preventive_medicine',
  PHARMACY = 'pharmacy',
  NUTRITION = 'nutrition'
}

interface SpecialistInfo {
  specialty: MedicalSpecialty;
  name: string;
  displayName: string; // e.g., "Dr. Heart"
  color: string; // Hex color
  icon: string; // Icon identifier
  description: string;
}
```

### Health Metrics
```typescript
interface HealthMetric {
  id: string;
  type: MetricType;
  name: string;
  value: number | string;
  unit: string;
  referenceRange?: ReferenceRange;
  status: MetricStatus;
  date: string; // ISO date
  source: DataSource;
  trend?: TrendInfo;
}

enum MetricType {
  LAB_RESULT = 'lab_result',
  VITAL_SIGN = 'vital_sign',
  MEDICATION = 'medication',
  SYMPTOM = 'symptom',
  RISK_SCORE = 'risk_score'
}

enum MetricStatus {
  NORMAL = 'normal',
  BORDERLINE = 'borderline',
  ABNORMAL_LOW = 'abnormal_low',
  ABNORMAL_HIGH = 'abnormal_high',
  CRITICAL = 'critical'
}

interface ReferenceRange {
  min?: number;
  max?: number;
  optimal?: {
    min: number;
    max: number;
  };
  unit: string;
  ageAdjusted?: boolean;
  genderSpecific?: boolean;
}

interface TrendInfo {
  direction: 'increasing' | 'decreasing' | 'stable';
  changePercent?: number;
  changePeriod?: string; // e.g., "3 months"
  significance: 'not_significant' | 'significant' | 'highly_significant';
}
```

### Medications
```typescript
interface Medication {
  id: string;
  name: string;
  genericName?: string;
  dosage: string;
  frequency: string;
  route: string; // oral, injection, etc.
  startDate: string;
  endDate?: string;
  prescriber?: string;
  indication: string;
  adherence?: AdherenceInfo;
  sideEffects?: string[];
  interactions?: DrugInteraction[];
}

interface AdherenceInfo {
  percentage: number; // 0-100
  missedDoses: number;
  lastMissed?: string;
  pattern: 'consistent' | 'improving' | 'declining' | 'erratic';
}

interface DrugInteraction {
  drug: string;
  severity: 'minor' | 'moderate' | 'major';
  description: string;
  recommendation: string;
}
```

## Visualization Models

### VisualizationComponent
```typescript
interface VisualizationComponent {
  id: string; // viz_[uuid]
  queryId: string;
  title: string;
  type: VisualizationType;
  componentCode: string; // Self-contained React component
  metadata: VisualizationMetadata;
  createdAt: number;
}

enum VisualizationType {
  TIME_SERIES = 'time_series',
  COMPARISON = 'comparison',
  DISTRIBUTION = 'distribution',
  CORRELATION = 'correlation',
  RISK_GAUGE = 'risk_gauge',
  MEDICATION_TIMELINE = 'medication_timeline'
}

interface VisualizationMetadata {
  chartType: string;
  dataPoints: number;
  metrics: string[];
  dateRange?: {
    start: string;
    end: string;
  };
  interactiveFeatures: string[];
  exportFormats: ('png' | 'svg' | 'csv')[];
}
```

## Agent System Models

### MedicalTeam
```typescript
interface MedicalTeam {
  queryId: string;
  specialists: SpecialistAgent[];
  createdAt: number;
  status: TeamStatus;
}

interface SpecialistAgent {
  id: string;
  specialty: MedicalSpecialty;
  status: SpecialistStatus;
  tasks: SpecialistTask[];
  progress: number; // 0-100
  startedAt?: number;
  completedAt?: number;
  error?: AgentError;
}

enum SpecialistStatus {
  WAITING = 'waiting',
  THINKING = 'thinking',
  ACTIVE = 'active',
  COMPLETE = 'complete',
  FAILED = 'failed'
}

enum TeamStatus {
  ASSEMBLING = 'assembling',
  ANALYZING = 'analyzing',
  SYNTHESIZING = 'synthesizing',
  COMPLETED = 'completed',
  PARTIAL_FAILURE = 'partial_failure'
}

interface SpecialistTask {
  id: string;
  description: string;
  priority: TaskPriority;
  dataRequired: string[];
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  estimatedDuration?: number;
}

enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}
```

## Error Handling Models

### ErrorState
```typescript
interface ErrorState {
  code: ErrorCode;
  message: string;
  retryCount: number;
  maxRetries: number;
  canRetry: boolean;
  context?: ErrorContext;
  timestamp: number;
  requestId?: string;
}

enum ErrorCode {
  NETWORK_ERROR = 'NETWORK_ERROR',
  SPECIALIST_TIMEOUT = 'SPECIALIST_TIMEOUT',
  TOOL_FAILURE = 'TOOL_FAILURE',
  INVALID_HEALTH_DATA = 'INVALID_HEALTH_DATA',
  RATE_LIMIT = 'RATE_LIMIT',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR'
}

interface ErrorContext {
  specialist?: MedicalSpecialty;
  tool?: string;
  phase?: 'initialization' | 'analysis' | 'synthesis' | 'visualization';
  healthDataType?: string;
}

interface AgentError {
  code: ErrorCode;
  message: string;
  details?: string;
  recoverable: boolean;
  suggestedAction?: string;
}
```

## User Interface Models

### UIState
```typescript
interface UIState {
  activeThreadId?: string;
  activeQueryId?: string;
  selectedSpecialist?: MedicalSpecialty;
  viewMode: ViewMode;
  panels: PanelState;
  notifications: Notification[];
}

enum ViewMode {
  CHAT = 'chat',
  MEDICAL_TEAM = 'medical_team',
  VISUALIZATIONS = 'visualizations',
  EXPORT = 'export'
}

interface PanelState {
  threadSidebar: {
    isOpen: boolean;
    width: number;
    searchQuery?: string;
    categoryFilter?: string;
  };
  rightPanel: {
    activeTab: 'team' | 'visualizations' | 'export';
    isOpen: boolean;
    width: number;
  };
}

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  duration?: number;
  action?: {
    label: string;
    handler: () => void;
  };
}
```

## Export Models

### ExportRequest
```typescript
interface ExportRequest {
  id: string;
  threadId: string;
  queryIds?: string[];
  format: ExportFormat;
  options: ExportOptions;
  status: ExportStatus;
  createdAt: number;
  completedAt?: number;
  downloadUrl?: string;
  expiresAt?: number;
}

enum ExportFormat {
  PDF = 'pdf',
  CSV = 'csv',
  JSON = 'json',
  FHIR = 'fhir' // Future: HL7 FHIR format
}

enum ExportStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

interface ExportOptions {
  includeVisualizations: boolean;
  includeRawData: boolean;
  physicianFormat: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
  anonymize?: boolean;
}
```

## Security & Compliance Models

### AuditLog
```typescript
interface AuditLog {
  id: string;
  timestamp: number;
  action: AuditAction;
  userId: string;
  sessionId: string;
  resourceType: string;
  resourceId: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
}

enum AuditAction {
  THREAD_CREATED = 'thread_created',
  QUERY_SUBMITTED = 'query_submitted',
  DATA_ACCESSED = 'data_accessed',
  EXPORT_GENERATED = 'export_generated',
  THREAD_DELETED = 'thread_deleted',
  ERROR_OCCURRED = 'error_occurred'
}
```

## Local Storage Schema

### PersistedState
```typescript
interface PersistedState {
  version: number; // Schema version for migrations
  threads: Thread[];
  preferences: UserPreferences;
  cache: {
    visualizations: Map<string, VisualizationComponent>;
    results: Map<string, AnalysisResult>;
  };
  lastSyncedAt: number;
}

interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  fontSize: 'small' | 'medium' | 'large';
  simplifiedTerms: boolean;
  autoExport: boolean;
  defaultExportFormat: ExportFormat;
  notificationSettings: {
    analysisComplete: boolean;
    errorAlerts: boolean;
    healthReminders: boolean;
  };
}
```

## Constants and Enums

### System Constants
```typescript
const CONSTANTS = {
  MAX_THREAD_TITLE_LENGTH: 100,
  MAX_QUERY_LENGTH: 1000,
  THREAD_RETENTION_DAYS: 90,
  EXPORT_EXPIRY_HOURS: 24,
  MAX_SPECIALISTS_PER_QUERY: 8,
  RETRY_DELAYS: [2000, 4000, 8000], // milliseconds
  SSE_HEARTBEAT_INTERVAL: 30000,
  CACHE_VERSION: 1
};

const SPECIALIST_COLORS = {
  [MedicalSpecialty.CARDIOLOGY]: '#EF4444',
  [MedicalSpecialty.LABORATORY_MEDICINE]: '#10B981',
  [MedicalSpecialty.ENDOCRINOLOGY]: '#8B5CF6',
  [MedicalSpecialty.DATA_ANALYSIS]: '#F59E0B',
  [MedicalSpecialty.PREVENTIVE_MEDICINE]: '#F97316',
  [MedicalSpecialty.PHARMACY]: '#FB923C',
  [MedicalSpecialty.NUTRITION]: '#84CC16',
  [MedicalSpecialty.GENERAL_PRACTICE]: '#06B6D4'
};
```

### Health Warnings
```typescript
interface HealthWarning {
  id: string;
  type: WarningType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  affectedMetrics: string[];
  recommendedAction: string;
}

enum WarningType {
  ABNORMAL_VALUE = 'abnormal_value',
  NEGATIVE_TREND = 'negative_trend',
  DRUG_INTERACTION = 'drug_interaction',
  MISSING_DATA = 'missing_data',
  RISK_FACTOR = 'risk_factor'
}
```