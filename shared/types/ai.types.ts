// AI service types
export interface AIGenerationRequest {
  sourceDocumentId: string;
  articleId?: string;
  generationType: 'full' | 'section' | 'summary';
  section?: string;
  parameters: AIGenerationParameters;
}

export interface AIGenerationParameters {
  targetLength: number;
  tone: 'professional' | 'academic' | 'accessible';
  includePracticalExamples?: boolean;
  focusAreas?: string[];
  customInstructions?: string;
}

export interface AIGenerationResponse {
  requestId: string;
  generatedContent: string;
  metadata: {
    wordCount: number;
    generationTime: number;
    confidenceScore: number;
    sourcesReferenced: number;
    modelUsed: string;
  };
}

export interface AIRegenerationRequest {
  articleId: string;
  sectionText: string;
  instruction: 'expandir' | 'resumir' | 'cambiar_tono' | 'aclarar';
  parameters?: Partial<AIGenerationParameters>;
}

export interface AIImageGenerationRequest {
  articleId: string;
  contentContext: string;
  imageType: 'hero' | 'illustration' | 'diagram';
  customPrompt?: string;
  style: 'professional' | 'academic' | 'modern';
  count?: number; // 1-6
}

export interface AIImageGenerationResponse {
  requestId: string;
  images: Array<{
    id: string;
    url: string;
    thumbnailUrl: string;
    prompt: string;
    style: string;
    dimensions: {
      width: number;
      height: number;
    };
  }>;
}

export interface AIServiceStatus {
  service: string;
  status: 'online' | 'degraded' | 'offline';
  responseTime?: number;
  lastCheck: string;
  errorRate?: number;
}

export interface AIRequestStatus {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress?: number;
  estimatedTimeRemaining?: number;
  result?: AIGenerationResponse | AIImageGenerationResponse;
  error?: string;
}