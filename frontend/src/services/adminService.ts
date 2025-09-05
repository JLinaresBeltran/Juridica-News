// FUNCIÓN TEMPORAL - Servicio para operaciones administrativas de desarrollo
import api from './api';

export interface SystemResetRequest {
  confirmation: 'RESET';
  reason: string;
}

export interface SystemResetResponse {
  success: boolean;
  message: string;
  statistics: {
    documentsDeleted: number;
    articlesDeleted: number;
    articleVersionsDeleted: number;
    mediaAssetsDeleted: number;
    auditLogsDeleted: number;
    extractionHistoryDeleted: number;
    refreshTokensDeleted: number;
  };
  executionTime: string;
  timestamp: string;
  warning: string;
}

export interface SystemInfo {
  documents: number;
  articles: number;
  articleVersions: number;
  mediaAssets: number;
  auditLogs: number;
  extractions: number;
  users: number;
  timestamp: string;
  environment: string;
  resetAvailable: boolean;
}

export interface SystemInfoResponse {
  success: boolean;
  data: SystemInfo;
}

class AdminService {
  /**
   * FUNCIÓN TEMPORAL - Resetea completamente el sistema de datos
   * Elimina todos los documentos, artículos y datos relacionados
   * SOLO para desarrollo y testing
   */
  async resetSystem(data: SystemResetRequest): Promise<SystemResetResponse> {
    try {
      const response = await api.post<SystemResetResponse>('/admin/reset', data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error resetting system:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to reset system');
    }
  }

  /**
   * FUNCIÓN TEMPORAL - Obtiene información actual del sistema
   * Muestra estadísticas de documentos, artículos y otros datos
   */
  async getSystemInfo(): Promise<SystemInfoResponse> {
    try {
      const response = await api.get<SystemInfoResponse>('/admin/system-info');
      return response.data;
    } catch (error: any) {
      console.error('❌ Error getting system info:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to get system information');
    }
  }

  /**
   * FUNCIÓN TEMPORAL - Validación de confirmación de reset
   * Verifica que el usuario entiende las consecuencias del reset
   */
  validateResetConfirmation(confirmation: string): boolean {
    return confirmation === 'RESET';
  }

  /**
   * FUNCIÓN TEMPORAL - Genera reporte de reset para logging
   * Crea un resumen de las operaciones realizadas durante el reset
   */
  generateResetReport(statistics: SystemResetResponse['statistics'], executionTime: string): string {
    return `
Sistema reseteado exitosamente:
- Documentos eliminados: ${statistics.documentsDeleted}
- Artículos eliminados: ${statistics.articlesDeleted}
- Versiones de artículos eliminadas: ${statistics.articleVersionsDeleted}
- Assets multimedia eliminados: ${statistics.mediaAssetsDeleted}
- Logs de auditoría eliminados: ${statistics.auditLogsDeleted}
- Historial de extracciones eliminado: ${statistics.extractionHistoryDeleted}
- Tokens de refresco eliminados: ${statistics.refreshTokensDeleted}
- Tiempo de ejecución: ${executionTime}

⚠️  FUNCIÓN TEMPORAL - Solo para desarrollo
    `.trim();
  }

  /**
   * FUNCIÓN TEMPORAL - Verifica si el reset está disponible
   * Validaciones de seguridad antes de mostrar la opción de reset
   */
  async isResetAvailable(): Promise<boolean> {
    try {
      const systemInfo = await this.getSystemInfo();
      return systemInfo.data.resetAvailable && systemInfo.data.environment === 'development';
    } catch (error) {
      console.warn('Could not verify reset availability:', error);
      return false;
    }
  }
}

// FUNCIÓN TEMPORAL - Exportar instancia única del servicio
const adminService = new AdminService();
export default adminService;