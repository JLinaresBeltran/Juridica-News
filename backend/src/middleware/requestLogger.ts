import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '@/utils/logger';

declare global {
  namespace Express {
    interface Request {
      requestId: string;
      startTime: number;
    }
  }
}

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  // Generate unique request ID
  req.requestId = uuidv4();
  req.startTime = Date.now();

  // Add request ID to response headers for debugging
  res.setHeader('X-Request-ID', req.requestId);

  // Filtrar endpoints ruidosos que no necesitan logging
  const noisyEndpoints = [
    '/api/events/stream',     // SSE - mantiene conexión abierta
    '/api/health',            // Health checks
    '/favicon.ico',           // Browser favicon requests
    '/api/health/detailed',   // Detailed health
    '/images/',               // Static image requests (404s repetitivos)
    '/api/storage/images/'    // Storage image requests
  ];

  const shouldSkipLogging = noisyEndpoints.some(endpoint =>
    req.originalUrl.startsWith(endpoint)
  );

  // Log incoming request (skip si es ruidoso)
  if (!shouldSkipLogging) {
    logger.info('Incoming request', {
      requestId: req.requestId,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      contentType: req.get('Content-Type'),
      contentLength: req.get('Content-Length'),
      userId: req.user?.id,
    });
  }

  // Hook into response to log completion
  const originalSend = res.send;

  res.send = function(data) {
    const responseTime = Date.now() - req.startTime;

    // Skip logging para endpoints ruidosos
    if (!shouldSkipLogging) {
      logger.info('Request completed', {
        requestId: req.requestId,
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        responseTime: `${responseTime}ms`,
        contentLength: res.get('Content-Length'),
        userId: req.user?.id,
      });
    }

    return originalSend.call(this, data);
  };

  next();
};