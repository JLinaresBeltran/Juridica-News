// Common API response types
export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  errors?: ApiError[];
  meta?: ApiMeta;
}

export interface ApiError {
  code: string;
  message: string;
  field?: string;
  details?: Record<string, any>;
}

export interface ApiMeta {
  timestamp: string;
  requestId?: string;
  version?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

// Server-Sent Events types
export interface SSEEvent<T = any> {
  type: string;
  data: T;
  id?: string;
  retry?: number;
}

export interface SSEConnection {
  userId: string;
  sessionId: string;
  connectedAt: string;
}

// Common SSE event types
export type SSEEventType = 
  | 'document_scraped'
  | 'ai_generation_complete'
  | 'article_auto_saved'
  | 'system_notification'
  | 'error'
  | 'connected'
  | 'done'
  | 'heartbeat';

// Health check response
export interface HealthCheckResponse {
  status: 'ok' | 'degraded' | 'down';
  timestamp: string;
  uptime: number;
  services: {
    database: 'ok' | 'error';
    redis: 'ok' | 'error';
    elasticsearch: 'ok' | 'error';
    ai_services: 'ok' | 'degraded' | 'error';
  };
}