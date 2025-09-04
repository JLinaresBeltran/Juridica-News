import { Request, Response } from 'express';
import { logger } from '@/utils/logger';

class SSEController {
  private connections = new Map<string, Response>();

  connect = (req: Request, res: Response) => {
    const userId = req.user.id;
    
    // Set up SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    });

    // Store connection
    this.connections.set(userId, res);

    // Send initial connection event
    this.sendEvent(userId, 'connected', {
      sessionId: `session_${Date.now()}`,
      serverTime: new Date().toISOString(),
    });

    // Set up heartbeat
    const heartbeat = setInterval(() => {
      this.sendEvent(userId, 'heartbeat', { 
        timestamp: new Date().toISOString() 
      });
    }, 30000);

    // Clean up on disconnect
    req.on('close', () => {
      clearInterval(heartbeat);
      this.connections.delete(userId);
      logger.info('SSE connection closed', { userId });
    });

    logger.info('SSE connection established', { userId });
  };

  sendEvent(userId: string, type: string, data: any) {
    const connection = this.connections.get(userId);
    if (connection && !connection.destroyed) {
      try {
        connection.write(`event: ${type}\n`);
        connection.write(`data: ${JSON.stringify(data)}\n\n`);
      } catch (error) {
        logger.error('Error sending SSE event', { error, userId, type });
        this.connections.delete(userId);
      }
    }
  }

  broadcast(type: string, data: any) {
    this.connections.forEach((connection, userId) => {
      this.sendEvent(userId, type, data);
    });
  }

  getConnectionCount(): number {
    return this.connections.size;
  }
}

export const sseController = new SSEController();
export default sseController;