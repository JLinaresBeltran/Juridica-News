/**
 * Proveedor de IA simulado para testing
 *
 * PRINCIPIO BLACK BOX:
 * - Implementa IAIProvider
 * - Respuestas predecibles para tests
 * - Puede simular delays y errores
 */

import {
  IAIProvider,
  DocumentFragments,
  AnalysisOptions,
  SummaryOptions,
  AnalysisResult,
  ProviderHealth,
  ProviderUsage,
  AIProviderError
} from './IAIProvider';

interface MockAIProviderConfig {
  failOnAnalyze?: boolean;
  failOnSummary?: boolean;
  unavailable?: boolean;
  delay?: number; // ms de delay simulado
}

export class MockAIProvider implements IAIProvider {
  readonly name = 'MockAI';
  private config: MockAIProviderConfig;
  private requestsToday: number = 0;

  constructor(config: MockAIProviderConfig = {}) {
    this.config = config;
  }

  async analyzeDocument(
    fragments: DocumentFragments,
    options?: AnalysisOptions
  ): Promise<AnalysisResult> {
    // Simular delay si está configurado
    if (this.config.delay) {
      await new Promise(resolve => setTimeout(resolve, this.config.delay));
    }

    // Simular error si está configurado
    if (this.config.failOnAnalyze) {
      throw new AIProviderError('Mock analysis failed', this.name);
    }

    this.requestsToday++;

    // Respuesta predecible basada en los fragmentos
    return {
      temaPrincipal: 'Tema de prueba extraído del documento mock',
      resumenIA: 'Este es un resumen de prueba generado por el proveedor mock. El caso involucra a partes simuladas en una disputa ficticia sobre derechos fundamentales.',
      decision: 'La Corte resuelve CONCEDER la acción de tutela y ordena a la entidad demandada cumplir con las obligaciones establecidas en el presente fallo.',
      numeroSentencia: 'T-001/25',
      magistradoPonente: 'Magistrado Mock de Prueba',
      salaRevision: 'Sala Primera',
      expediente: 'T-12345',
      fragmentosAnalizados: [
        fragments.introduccion.substring(0, 200),
        fragments.considerandos.substring(0, 300),
        fragments.resuelve.substring(0, 200)
      ],
      modeloUsado: 'mock-ai-v1',
      confidencia: 1.0,
      analyzedAt: new Date()
    };
  }

  async generateSummary(content: string, options: SummaryOptions): Promise<string> {
    // Simular delay si está configurado
    if (this.config.delay) {
      await new Promise(resolve => setTimeout(resolve, this.config.delay));
    }

    // Simular error si está configurado
    if (this.config.failOnSummary) {
      throw new AIProviderError('Mock summary failed', this.name);
    }

    this.requestsToday++;

    // Generar resumen mock basado en el estilo
    const summaries = {
      professional: 'Resumen profesional generado por MockAI. El documento trata sobre aspectos legales importantes que requieren análisis detallado.',
      academic: 'Resumen académico generado por MockAI. Se identifican elementos jurídicos relevantes para el estudio del caso.',
      casual: 'Resumen casual generado por MockAI. Este documento habla sobre temas legales de forma clara y entendible.'
    };

    return summaries[options.style];
  }

  async checkHealth(): Promise<ProviderHealth> {
    if (this.config.unavailable) {
      return {
        available: false,
        latency: 0,
        errorRate: 1,
        lastCheck: new Date(),
        message: 'Mock provider configured as unavailable'
      };
    }

    return {
      available: true,
      latency: this.config.delay || 0,
      errorRate: 0,
      lastCheck: new Date(),
      message: 'Mock provider is healthy'
    };
  }

  async getUsage(): Promise<ProviderUsage> {
    return {
      requestsToday: this.requestsToday,
      tokensUsedToday: this.requestsToday * 100, // Mock tokens
      quotaRemaining: 1000,
      costEstimate: this.requestsToday * 0.001 // $0.001 por request
    };
  }

  /**
   * Resetear estadísticas (útil para tests)
   */
  resetStats(): void {
    this.requestsToday = 0;
  }

  /**
   * Actualizar configuración (útil para tests)
   */
  updateConfig(config: Partial<MockAIProviderConfig>): void {
    this.config = { ...this.config, ...config };
  }
}
