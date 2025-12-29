/**
 * Factory para gestionar proveedores de IA
 *
 * PRINCIPIO BLACK BOX:
 * - Registra proveedores disponibles
 * - Proporciona fallback automático entre proveedores
 * - El servicio de análisis solo conoce esta factory, no los providers individuales
 */

import { logger } from '@/utils/logger';
import {
  IAIProvider,
  DocumentFragments,
  AnalysisResult,
  AIProviderError
} from './IAIProvider';
import { OpenAIProvider } from './OpenAIProvider';
import { GeminiProvider } from './GeminiProvider';
import { ClaudeProvider } from './ClaudeProvider';
import { MockAIProvider } from './MockAIProvider';

export class AIProviderFactory {
  private providers: Map<string, IAIProvider> = new Map();
  private defaultProviderName?: string;

  constructor() {
    this.registerProviders();
  }

  /**
   * Registrar proveedores basados en API keys disponibles
   */
  private registerProviders(): void {
    // Claude (prioridad alta)
    if (process.env.ANTHROPIC_API_KEY) {
      try {
        this.providers.set('claude', new ClaudeProvider(process.env.ANTHROPIC_API_KEY));
        logger.info('✅ Claude provider registrado');
      } catch (error) {
        logger.warn('⚠️  Error registrando Claude provider:', error);
      }
    }

    // Gemini (prioridad media)
    if (process.env.GEMINI_API_KEY) {
      try {
        this.providers.set('gemini', new GeminiProvider(process.env.GEMINI_API_KEY));
        logger.info('✅ Gemini provider registrado');
      } catch (error) {
        logger.warn('⚠️  Error registrando Gemini provider:', error);
      }
    }

    // OpenAI (prioridad baja debido a cuota limitada)
    if (process.env.OPENAI_API_KEY) {
      try {
        this.providers.set('openai', new OpenAIProvider(process.env.OPENAI_API_KEY));
        logger.info('✅ OpenAI provider registrado');
      } catch (error) {
        logger.warn('⚠️  Error registrando OpenAI provider:', error);
      }
    }

    // Mock provider (solo en desarrollo/testing)
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
      this.providers.set('mock', new MockAIProvider());
      logger.info('✅ Mock provider registrado (dev/test)');
    }

    // Determinar proveedor por defecto
    const defaultProvider = this.determineDefaultProvider();
    if (defaultProvider) {
      this.defaultProviderName = defaultProvider;
    }

    if (this.providers.size === 0) {
      logger.warn('⚠️  No hay proveedores de IA disponibles');
    } else {
      logger.info(`🤖 Proveedores disponibles: ${Array.from(this.providers.keys()).join(', ')}`);
      logger.info(`🎯 Proveedor por defecto: ${this.defaultProviderName || 'ninguno'}`);
    }
  }

  /**
   * Determinar proveedor por defecto basado en prioridad
   */
  private determineDefaultProvider(): string | undefined {
    // Prioridad: Variable de entorno > Claude > Gemini > OpenAI > Mock
    if (process.env.AI_PROVIDER && this.providers.has(process.env.AI_PROVIDER)) {
      return process.env.AI_PROVIDER;
    }

    if (this.providers.has('claude')) return 'claude';
    if (this.providers.has('gemini')) return 'gemini';
    if (this.providers.has('openai')) return 'openai';
    if (this.providers.has('mock')) return 'mock';

    return undefined;
  }

  /**
   * Obtener proveedor por nombre
   */
  getProvider(name?: string): IAIProvider {
    const providerName = name || this.defaultProviderName;

    if (!providerName) {
      throw new Error('No hay proveedores de IA disponibles');
    }

    const provider = this.providers.get(providerName);

    if (!provider) {
      throw new Error(`Proveedor de IA no disponible: ${providerName}`);
    }

    return provider;
  }

  /**
   * Analizar con fallback automático entre proveedores
   */
  async analyzeWithFallback(
    fragments: DocumentFragments,
    preferredProvider?: string
  ): Promise<AnalysisResult> {
    const providerNames = this.getProviderPriorityList(preferredProvider);

    if (providerNames.length === 0) {
      throw new Error('No hay proveedores de IA disponibles para análisis');
    }

    let lastError: Error | undefined;

    for (const name of providerNames) {
      try {
        const provider = this.providers.get(name)!;
        logger.info(`🔄 Intentando análisis con ${provider.name}...`);

        const result = await provider.analyzeDocument(fragments);

        logger.info(`✅ Análisis exitoso con ${provider.name}`);
        return result;

      } catch (error: any) {
        logger.warn(`❌ Falló ${name}, intentando siguiente proveedor...`, error.message);
        lastError = error;
        continue;
      }
    }

    throw new AIProviderError(
      `Todos los proveedores fallaron. Último error: ${lastError?.message}`,
      'all'
    );
  }

  /**
   * Obtener lista de proveedores en orden de prioridad
   */
  private getProviderPriorityList(preferredProvider?: string): string[] {
    const names = Array.from(this.providers.keys());

    if (!preferredProvider) {
      return names;
    }

    // Colocar el proveedor preferido primero
    const filtered = names.filter(n => n !== preferredProvider);
    return [preferredProvider, ...filtered].filter(n => this.providers.has(n));
  }

  /**
   * Obtener todos los proveedores disponibles
   */
  getAvailableProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Verificar salud de todos los proveedores
   */
  async checkAllProvidersHealth(): Promise<Record<string, any>> {
    const results: Record<string, any> = {};

    for (const [name, provider] of this.providers.entries()) {
      try {
        results[name] = await provider.checkHealth();
      } catch (error: any) {
        results[name] = {
          available: false,
          error: error.message
        };
      }
    }

    return results;
  }

  /**
   * Obtener uso de todos los proveedores
   */
  async getAllProvidersUsage(): Promise<Record<string, any>> {
    const results: Record<string, any> = {};

    for (const [name, provider] of this.providers.entries()) {
      try {
        results[name] = await provider.getUsage();
      } catch (error: any) {
        results[name] = {
          error: error.message
        };
      }
    }

    return results;
  }

  /**
   * Registrar proveedor personalizado (útil para testing)
   */
  registerCustomProvider(name: string, provider: IAIProvider): void {
    this.providers.set(name, provider);
    logger.info(`✅ Proveedor personalizado registrado: ${name}`);
  }

  /**
   * Eliminar proveedor (útil para testing)
   */
  unregisterProvider(name: string): boolean {
    return this.providers.delete(name);
  }
}

// Instancia singleton
export const aiProviderFactory = new AIProviderFactory();
