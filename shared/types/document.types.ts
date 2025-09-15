// Document-related types
export enum DocumentSource {
  BOE = 'BOE',
  TRIBUNAL_SUPREMO = 'TRIBUNAL_SUPREMO',
  TRIBUNAL_CONSTITUCIONAL = 'TRIBUNAL_CONSTITUCIONAL',
  MINISTERIO_JUSTICIA = 'MINISTERIO_JUSTICIA',
  CCAA = 'CCAA',
  OTROS = 'OTROS'
}

export enum LegalArea {
  CIVIL = 'CIVIL',
  PENAL = 'PENAL',
  MERCANTIL = 'MERCANTIL',
  LABORAL = 'LABORAL',
  ADMINISTRATIVO = 'ADMINISTRATIVO',
  FISCAL = 'FISCAL',
  CONSTITUCIONAL = 'CONSTITUCIONAL'
}

export enum DocumentType {
  LEY = 'LEY',
  REAL_DECRETO = 'REAL_DECRETO',
  SENTENCIA = 'SENTENCIA',
  RESOLUCION = 'RESOLUCION',
  CIRCULAR = 'CIRCULAR',
  INSTRUCCION = 'INSTRUCCION'
}

export enum DocumentStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  PROCESSING = 'PROCESSING',
  ERROR = 'ERROR'
}

export enum Priority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

export interface DocumentMetadata {
  pages: number;
  fileSize: number;
  language: string;
  encoding?: string;
  ocrProcessed?: boolean;
  textConfidence?: number;
  sourceReliability: number;
}

export enum AIAnalysisStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

export interface Document {
  id: string;
  title: string;
  source: DocumentSource;
  url: string;
  originalFilePath?: string;
  publicationDate: string; // ISO string
  webOfficialDate?: string; // ISO string - Fecha oficial de la web
  legalArea: LegalArea;
  documentType: DocumentType;
  priority: Priority;
  status: DocumentStatus;
  
  // AI Generated Content
  aiSummary: string;
  confidenceScore: number;
  keywords: string[];
  relevanceTags: string[];
  
  // Curation
  curatedById?: string;
  curatedAt?: string;
  curationNotes?: string;
  estimatedEffort?: number;
  
  // AI Analysis Fields (New)
  numeroSentencia?: string;
  magistradoPonente?: string;
  salaRevision?: string;
  temaPrincipal?: string;
  resumenIA?: string;
  decision?: string;
  aiAnalysisStatus?: AIAnalysisStatus;
  aiAnalysisDate?: string;
  aiModel?: string;
  fragmentosAnalisis?: string;
  
  // Metadata
  metadata: DocumentMetadata;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  scrapedAt: string;
}

export interface DocumentFilters {
  page?: number;
  limit?: number;
  status?: DocumentStatus;
  source?: DocumentSource;
  legalArea?: LegalArea;
  dateFrom?: string;
  dateTo?: string;
  priority?: Priority;
  search?: string;
}

export interface DocumentCurationAction {
  action: 'approve' | 'reject';
  priority?: Priority;
  notes?: string;
  estimatedEffort?: number;
}

export interface BatchCurationRequest {
  documents: Array<{
    id: string;
    action: 'approve' | 'reject';
    priority?: Priority;
    notes?: string;
  }>;
}