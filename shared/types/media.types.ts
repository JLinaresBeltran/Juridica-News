export enum MediaType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  DOCUMENT = 'DOCUMENT',
  AUDIO = 'AUDIO'
}

export enum UsageType {
  HERO_IMAGE = 'HERO_IMAGE',
  ILLUSTRATION = 'ILLUSTRATION',
  DIAGRAM = 'DIAGRAM',
  SCREENSHOT = 'SCREENSHOT',
  LOGO = 'LOGO',
  ICON = 'ICON'
}

export interface ImageDimensions {
  width: number;
  height: number;
  aspectRatio: number;
  orientation: 'portrait' | 'landscape' | 'square';
}

export interface OptimizedVariant {
  id: string;
  variantType: 'thumbnail' | 'small' | 'medium' | 'large' | 'original';
  filePath: string;
  dimensions: ImageDimensions;
  fileSize: number;
  quality: number;
}

export interface ImageSEOData {
  altText: string;
  title: string;
  caption?: string;
  description?: string;
}

export interface MediaAsset {
  id: string;
  filename: string;
  originalFilename: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  assetType: MediaType;
  usageType?: UsageType;
  tags: string[];
  
  // Visual metadata
  dimensions?: ImageDimensions;
  colorPalette?: string[];
  
  // AI Generation
  aiGenerated: boolean;
  generationPrompt?: string;
  generationModel?: string;
  generationParameters?: Record<string, any>;
  
  // SEO
  seoData?: ImageSEOData;
  
  // Usage
  downloadCount: number;
  
  // Timestamps
  createdAt: string;
  uploadedAt: string;
  lastUsed?: string;
  
  // Relations
  createdById: string;
}

export interface MediaUploadRequest {
  file: File;
  altText?: string;
  title?: string;
  tags?: string[];
  usageType?: UsageType;
}

export interface MediaEditRequest {
  operations: MediaEditOperation[];
}

export interface MediaEditOperation {
  type: 'crop' | 'resize' | 'rotate' | 'filter' | 'compress';
  parameters: Record<string, any>;
}

export interface MediaSearchFilters {
  page?: number;
  limit?: number;
  assetType?: MediaType;
  usageType?: UsageType;
  aiGenerated?: boolean;
  tags?: string[];
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}