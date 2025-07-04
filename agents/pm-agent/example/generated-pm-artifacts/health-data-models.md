# Data Models - Health Insight Assistant

## Core Domain Models

### Thread Management

```typescript
// TypeScript
interface Thread {
  id: string;                    // UUID v4
  title: string;                 // Auto-generated or custom
  createdAt: number;             // Unix timestamp
  updatedAt: number;             // Unix timestamp
  messages: Message[];           // All messages in thread
  results: QueryResult[];        // All analysis results
  metadata: ThreadMetadata;      // Additional thread info
}

interface ThreadMetadata {
  totalQueries: number;
  lastQueryComplexity: QueryComplexity;
  primaryHealthConcerns: string[];
  isArchived: boolean;
}

interface Message {
  id: string;                    // Message UUID
  threadId: string;              // Parent thread ID
  role: 'user' | 'assistant';   // Message sender
  content: string;               // Message text
  timestamp: number;             // Unix timestamp
  metadata?: MessageMetadata;    // Optional metadata
}

interface MessageMetadata {
  queryId?: string;              // Associated query ID
  complexity?: QueryComplexity;  // Query complexity
  specialists?: string[];        // Assigned specialists
  processingTime?: number;       // Time to process (seconds)
}
```

```python
# Python (Pydantic)
from pydantic import BaseModel
from typing import List, Optional, Literal
from datetime import datetime
from uuid import UUID

class Thread(BaseModel):
    id: UUID
    title: str
    created_at: datetime
    updated_at: datetime
    messages: List['Message']
    results: List['QueryResult']
    metadata: 'ThreadMetadata'

class ThreadMetadata(BaseModel):
    total_queries: int
    last_query_complexity: 'QueryComplexity'
    primary_health_concerns: List[str]
    is_archived: bool = False

class Message(BaseModel):
    id: UUID
    thread_id: UUID
    role: Literal['user', 'assistant']
    content: str
    timestamp: datetime
    metadata: Optional['MessageMetadata'] = None
```

### Health Query Models

```typescript
// TypeScript
type QueryComplexity = 'simple' | 'standard' | 'complex' | 'critical';

interface HealthQuery {
  id: string;                    // Query UUID
  threadId: string;              // Parent thread
  query: string;                 // User's question
  complexity: QueryComplexity;   // Assessed complexity
  timestamp: number;             // Submission time
  userId?: string;               // Optional user ID
}

interface QueryResult {
  queryId: string;               // Parent query ID
  query: string;                 // Original query text
  timestamp: number;             // Completion time
  complexity: QueryComplexity;   // Final complexity
  specialists: SpecialistResult[]; // Specialist findings
  synthesis: string;             // CMO synthesis
  recommendations: string[];     // Action items
  visualizations: Visualization[]; // Generated charts
  confidence: number;            // Overall confidence (0-100)
  metadata: ResultMetadata;      // Additional info
}

interface ResultMetadata {
  totalProcessingTime: number;   // Total time (seconds)
  dataPointsAnalyzed: number;    // Number of data points
  dateRangeAnalyzed: {
    start: string;               // ISO date
    end: string;                 // ISO date
  };
  criticalFindings: boolean;    // Any critical findings
}
```

```python
# Python
from enum import Enum

class QueryComplexity(str, Enum):
    SIMPLE = 'simple'
    STANDARD = 'standard'
    COMPLEX = 'complex'
    CRITICAL = 'critical'

class HealthQuery(BaseModel):
    id: UUID
    thread_id: UUID
    query: str
    complexity: QueryComplexity
    timestamp: datetime
    user_id: Optional[UUID] = None

class QueryResult(BaseModel):
    query_id: UUID
    query: str
    timestamp: datetime
    complexity: QueryComplexity
    specialists: List['SpecialistResult']
    synthesis: str
    recommendations: List[str]
    visualizations: List['Visualization']
    confidence: float  # 0-100
    metadata: 'ResultMetadata'
```

### Medical Specialist Models

```typescript
// TypeScript
type MedicalSpecialty = 
  | 'cardiology'
  | 'endocrinology'
  | 'laboratory_medicine'
  | 'data_analysis'
  | 'preventive_medicine'
  | 'pharmacy'
  | 'nutrition'
  | 'general_practice';

interface SpecialistTask {
  id: string;                    // Task UUID
  queryId: string;               // Parent query
  specialist: MedicalSpecialty;  // Assigned specialist
  taskDescription: string;       // What to analyze
  priority: 'high' | 'medium' | 'low';
  requiredData: string[];        // Data types needed
  estimatedDuration: number;     // Seconds
  status: SpecialistStatus;      // Current status
}

type SpecialistStatus = 
  | 'waiting'
  | 'active'
  | 'complete'
  | 'failed';

interface SpecialistResult {
  taskId: string;                // Parent task ID
  specialist: MedicalSpecialty;  // Specialist type
  name: string;                  // Display name (Dr. Heart)
  status: SpecialistStatus;      // Final status
  findings: string;              // Analysis findings
  confidence: number;            // Confidence (0-100)
  keyMetrics: HealthMetric[];    // Important metrics
  recommendations: string[];     // Specialist recommendations
  processingTime: number;        // Duration (seconds)
  toolCalls: number;             // Number of tool calls
  error?: string;                // Error message if failed
}

interface SpecialistInfo {
  type: MedicalSpecialty;
  name: string;                  // Display name
  color: string;                 // UI color (hex)
  icon: string;                  // Icon identifier
  description: string;           // Role description
}
```

```python
# Python
class MedicalSpecialty(str, Enum):
    CARDIOLOGY = 'cardiology'
    ENDOCRINOLOGY = 'endocrinology'
    LABORATORY_MEDICINE = 'laboratory_medicine'
    DATA_ANALYSIS = 'data_analysis'
    PREVENTIVE_MEDICINE = 'preventive_medicine'
    PHARMACY = 'pharmacy'
    NUTRITION = 'nutrition'
    GENERAL_PRACTICE = 'general_practice'

class SpecialistStatus(str, Enum):
    WAITING = 'waiting'
    ACTIVE = 'active'
    COMPLETE = 'complete'
    FAILED = 'failed'

class SpecialistTask(BaseModel):
    id: UUID
    query_id: UUID
    specialist: MedicalSpecialty
    task_description: str
    priority: Literal['high', 'medium', 'low']
    required_data: List[str]
    estimated_duration: int
    status: SpecialistStatus = SpecialistStatus.WAITING
```

### Health Data Models

```typescript
// TypeScript
interface HealthMetric {
  id: string;                    // Metric UUID
  type: MetricType;              // Type of metric
  name: string;                  // Metric name
  value: number | string;        // Metric value
  unit?: string;                 // Unit of measurement
  date: string;                  // ISO date
  source: string;                // Data source
  referenceRange?: ReferenceRange; // Normal range
  status: MetricStatus;          // Interpretation
  metadata?: Record<string, any>; // Additional data
}

type MetricType = 
  | 'lab_result'
  | 'vital_sign'
  | 'medication'
  | 'symptom'
  | 'measurement';

type MetricStatus = 
  | 'normal'
  | 'borderline'
  | 'abnormal'
  | 'critical'
  | 'not_applicable';

interface ReferenceRange {
  min?: number;
  max?: number;
  optimal?: {
    min: number;
    max: number;
  };
  unit: string;
  ageAdjusted: boolean;
  source: string;                // Reference source
}

interface Medication {
  id: string;
  name: string;
  genericName?: string;
  dosage: string;
  frequency: string;
  startDate: string;             // ISO date
  endDate?: string;              // ISO date
  prescriber?: string;
  purpose: string;
  adherenceRate?: number;        // Percentage
  sideEffects?: string[];
}
```

```python
# Python
class MetricType(str, Enum):
    LAB_RESULT = 'lab_result'
    VITAL_SIGN = 'vital_sign'
    MEDICATION = 'medication'
    SYMPTOM = 'symptom'
    MEASUREMENT = 'measurement'

class MetricStatus(str, Enum):
    NORMAL = 'normal'
    BORDERLINE = 'borderline'
    ABNORMAL = 'abnormal'
    CRITICAL = 'critical'
    NOT_APPLICABLE = 'not_applicable'

class HealthMetric(BaseModel):
    id: UUID
    type: MetricType
    name: str
    value: Union[float, str]
    unit: Optional[str] = None
    date: datetime
    source: str
    reference_range: Optional['ReferenceRange'] = None
    status: MetricStatus
    metadata: Optional[Dict[str, Any]] = None
```

### Visualization Models

```typescript
// TypeScript
interface Visualization {
  id: string;                    // Visualization UUID
  queryId: string;               // Parent query
  type: VisualizationType;       // Chart type
  title: string;                 // Display title
  description?: string;          // Chart description
  component: string;             // React component code
  data?: any;                    // Embedded data
  createdAt: number;             // Creation timestamp
  config: VisualizationConfig;   // Chart configuration
}

type VisualizationType = 
  | 'line_chart'
  | 'bar_chart'
  | 'scatter_plot'
  | 'gauge'
  | 'comparison_chart'
  | 'distribution_chart'
  | 'correlation_matrix'
  | 'timeline';

interface VisualizationConfig {
  width?: number;
  height?: number;
  interactive: boolean;
  showLegend: boolean;
  showTooltips: boolean;
  colorScheme?: string;
  axes?: {
    x: AxisConfig;
    y: AxisConfig;
  };
}

interface AxisConfig {
  label: string;
  type: 'linear' | 'time' | 'category';
  min?: number | string;
  max?: number | string;
  format?: string;
}
```

### Error Models

```typescript
// TypeScript
interface ErrorState {
  code: string;                  // Error code
  message: string;               // User-friendly message
  details?: any;                 // Additional details
  timestamp: number;             // When error occurred
  retryable: boolean;            // Can retry operation
  retryCount?: number;           // Current retry attempt
  maxRetries?: number;           // Maximum retries allowed
  context?: {
    queryId?: string;
    specialist?: string;
    toolName?: string;
  };
}

interface RetryConfig {
  maxAttempts: number;
  initialDelay: number;          // Milliseconds
  backoffFactor: number;
  maxDelay: number;              // Milliseconds
}
```

### Storage Models

```typescript
// TypeScript
interface LocalStorageSchema {
  version: number;               // Schema version
  threads: Thread[];             // All threads
  activeThreadId: string | null; // Current thread
  preferences: UserPreferences;  // User settings
  cache: QueryCache;             // Cached results
  lastUpdated: number;           // Last save timestamp
}

interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  defaultComplexity: QueryComplexity;
  autoExport: boolean;
  notifications: boolean;
  dataRetentionDays: number;
}

interface QueryCache {
  queries: Map<string, CachedQuery>;
  maxSize: number;
  evictionPolicy: 'lru' | 'fifo';
}

interface CachedQuery {
  queryHash: string;             // Hash of query text
  result: QueryResult;           // Cached result
  timestamp: number;             // Cache time
  hits: number;                  // Access count
}
```

### API Models

```typescript
// TypeScript
interface ChatRequest {
  message: string;
  threadId?: string;
  options?: {
    includeVisualizations?: boolean;
    specialists?: MedicalSpecialty[];
    maxProcessingTime?: number;
  };
}

interface ChatResponse {
  success: boolean;
  data?: {
    queryId: string;
    threadId: string;
    complexity: QueryComplexity;
    specialistsAssigned: SpecialistInfo[];
    estimatedTime: number;
  };
  error?: ErrorState;
}

interface StreamEvent {
  event: StreamEventType;
  data: any;
  timestamp: number;
  id?: string;
}

type StreamEventType = 
  | 'connected'
  | 'message'
  | 'agent_activated'
  | 'agent_progress'
  | 'agent_complete'
  | 'visualization_ready'
  | 'error'
  | 'done';
```

### Tool Integration Models

```typescript
// TypeScript
interface ToolCall {
  toolName: string;
  parameters: Record<string, any>;
  timestamp: number;
  duration?: number;
  success: boolean;
  result?: any;
  error?: string;
}

interface HealthQueryToolInput {
  query: string;
  timeRange?: {
    start: string;
    end: string;
  };
  dataTypes?: string[];
}

interface HealthQueryToolOutput {
  querySuccessful: boolean;
  result: {
    data: HealthMetric[];
    summary: string;
    visualizationHints?: {
      chartType: VisualizationType;
      xAxis: string;
      yAxis: string;
      title: string;
    };
  };
  metadata: {
    queryConfidence: number;
    dataSources: string[];
    recordCount: number;
  };
}
```

## Constants and Enums

```typescript
// TypeScript
const SPECIALIST_CONFIG: Record<MedicalSpecialty, SpecialistInfo> = {
  cardiology: {
    type: 'cardiology',
    name: 'Dr. Heart',
    color: '#EF4444',
    icon: 'heart',
    description: 'Cardiovascular health specialist'
  },
  endocrinology: {
    type: 'endocrinology',
    name: 'Dr. Hormone',
    color: '#8B5CF6',
    icon: 'activity',
    description: 'Hormonal and metabolic health specialist'
  },
  // ... other specialists
};

const COMPLEXITY_THRESHOLDS = {
  simple: {
    maxSpecialists: 1,
    maxDuration: 5,
    maxToolCalls: 3
  },
  standard: {
    maxSpecialists: 3,
    maxDuration: 15,
    maxToolCalls: 10
  },
  complex: {
    maxSpecialists: 6,
    maxDuration: 30,
    maxToolCalls: 20
  },
  critical: {
    maxSpecialists: 8,
    maxDuration: 45,
    maxToolCalls: 30
  }
};
```

## Database Schema (Conceptual)

While the system uses tools for data access, this represents the conceptual health data structure:

```sql
-- Conceptual health data structure
CREATE TABLE health_metrics (
  id UUID PRIMARY KEY,
  patient_id UUID NOT NULL,
  type VARCHAR(50) NOT NULL,
  name VARCHAR(200) NOT NULL,
  value JSONB NOT NULL,
  unit VARCHAR(50),
  collection_date TIMESTAMP NOT NULL,
  source VARCHAR(100) NOT NULL,
  reference_range JSONB,
  status VARCHAR(20),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE medications (
  id UUID PRIMARY KEY,
  patient_id UUID NOT NULL,
  name VARCHAR(200) NOT NULL,
  generic_name VARCHAR(200),
  dosage VARCHAR(100) NOT NULL,
  frequency VARCHAR(100) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  prescriber VARCHAR(200),
  purpose TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_health_metrics_patient_date ON health_metrics(patient_id, collection_date DESC);
CREATE INDEX idx_health_metrics_type ON health_metrics(type, name);
CREATE INDEX idx_medications_patient_active ON medications(patient_id, active);
```

These data models provide a comprehensive type-safe foundation for the Health Insight Assistant, ensuring consistency across the frontend and backend while maintaining flexibility for future enhancements.