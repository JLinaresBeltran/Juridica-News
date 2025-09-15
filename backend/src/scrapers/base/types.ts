/**
 * Tipos base para el sistema de scraping modular
 * Sistema Editorial Jurídico Supervisado
 */

export interface ScrapingJob {
  id: string;
  sourceId: string;
  userId?: string;
  parameters: ExtractionParameters;
  status: JobStatus;
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  result?: ExtractionResult;
}

export interface ExtractionParameters {
  limit?: number;
  downloadDocuments?: boolean;
  dateRange?: {
    from: Date;
    to: Date;
  };
  documentTypes?: string[];
  customParams?: Record<string, any>;
}

export interface ExtractionResult {
  success: boolean;
  documents: ExtractedDocument[];
  downloadedCount: number;
  extractionTime: number;
  totalFound: number;
  errors?: string[];
  metadata?: Record<string, any>;
}

export interface ExtractedDocument {
  documentId: string;
  title: string;
  source: string;
  url: string;
  content?: string;
  fullTextContent?: string;
  documentBuffer?: Buffer;
  summary?: string;
  documentType: string;
  legalArea: string;
  publicationDate: Date;
  extractionDate: Date;
  metadata: Record<string, any>;
}

export interface SourceMetadata {
  id: string;
  name: string;
  description: string;
  baseUrl: string;
  supportedDocumentTypes: string[];
  supportedLegalAreas: string[];
  rateLimit: {
    requestsPerMinute: number;
    requestsPerHour: number;
  };
  capabilities: SourceCapabilities;
  configuration: SourceConfiguration;
}

export interface SourceCapabilities {
  supportsDownload: boolean;
  supportsSearch: boolean;
  supportsDateRange: boolean;
  supportsFullText: boolean;
  requiresAuthentication: boolean;
  hasRateLimiting: boolean;
}

export interface SourceConfiguration {
  timeout: number;
  retries: number;
  concurrent: boolean;
  maxConcurrency: number;
  headers?: Record<string, string>;
  cookies?: Record<string, string>;
  proxies?: string[];
}

export interface ScrapingProgress {
  jobId: string;
  status: JobStatus;
  progress: number;
  message: string;
  documentsFound?: number;
  documentsProcessed?: number;
  estimatedTimeRemaining?: number;
  currentDocument?: string;
}

export enum JobStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  RETRYING = 'RETRYING'
}

export enum DocumentType {
  SENTENCE = 'SENTENCE',
  RULING = 'RULING',
  DECISION = 'DECISION',
  ORDINANCE = 'ORDINANCE',
  RESOLUTION = 'RESOLUTION',
  CONCEPT = 'CONCEPT',
  CIRCULAR = 'CIRCULAR'
}

export enum LegalArea {
  CONSTITUTIONAL = 'CONSTITUTIONAL',
  ADMINISTRATIVE = 'ADMINISTRATIVE',
  CIVIL = 'CIVIL',
  COMMERCIAL = 'COMMERCIAL',
  CRIMINAL = 'CRIMINAL',
  LABOR = 'LABOR',
  FAMILY = 'FAMILY',
  TAX = 'TAX',
  DIGITAL = 'DIGITAL'
}

export interface ScrapingEvent {
  type: 'JOB_STARTED' | 'JOB_PROGRESS' | 'JOB_COMPLETED' | 'JOB_FAILED' | 'DOCUMENT_EXTRACTED';
  jobId: string;
  sourceId: string;
  timestamp: Date;
  data: any;
}

export interface SourceHealth {
  sourceId: string;
  status: 'HEALTHY' | 'DEGRADED' | 'DOWN';
  lastCheck: Date;
  responseTime: number;
  successRate: number;
  errorRate: number;
  lastError?: string;
}

export interface ScrapingStats {
  sourceId: string;
  totalJobs: number;
  successfulJobs: number;
  failedJobs: number;
  totalDocuments: number;
  averageJobTime: number;
  lastExtraction?: Date;
  health: SourceHealth;
}