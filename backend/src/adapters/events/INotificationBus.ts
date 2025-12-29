/**
 * Interfaz para bus de notificaciones
 *
 * PRINCIPIO BLACK BOX:
 * - SSE, WebSockets, Polling: implementaciones intercambiables
 * - Los servicios solo emiten eventos, no conocen el transporte
 */

/**
 * Tipos de eventos del sistema
 */
export enum EventType {
  SCRAPING_PROGRESS = 'scraping_progress',
  SCRAPING_COMPLETED = 'scraping_completed',
  SCRAPING_FAILED = 'scraping_failed',
  DOCUMENT_ANALYZED = 'document_analyzed',
  ARTICLE_PUBLISHED = 'article_published',
  SYSTEM_NOTIFICATION = 'system_notification'
}

export interface INotificationBus {
  /**
   * Publicar evento para un usuario
   *
   * @param userId - ID del usuario destinatario
   * @param eventType - Tipo de evento
   * @param payload - Datos del evento
   */
  publish(userId: string, eventType: string, payload: any): Promise<void>

  /**
   * Publicar evento global (broadcast)
   *
   * @param eventType - Tipo de evento
   * @param payload - Datos del evento
   */
  broadcast(eventType: string, payload: any): Promise<void>

  /**
   * Suscribirse a eventos de un usuario
   *
   * @param userId - ID del usuario
   * @param callback - Función a ejecutar cuando llega un evento
   * @returns Función para cancelar suscripción
   */
  subscribe(
    userId: string,
    callback: (eventType: string, payload: any) => void
  ): () => void

  /**
   * Obtener cantidad de suscriptores activos
   *
   * @returns Número de conexiones activas
   */
  getActiveConnections(): number
}
