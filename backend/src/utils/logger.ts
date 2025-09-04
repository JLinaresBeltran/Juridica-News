import winston from 'winston';
import path from 'path';

const logDir = process.env.LOG_DIR || './logs';
const logLevel = process.env.LOG_LEVEL || 'info';

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss.SSS'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint()
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'HH:mm:ss'
  }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let log = `${timestamp} [${level}]: ${message}`;
    
    if (Object.keys(meta).length > 0) {
      log += `\n${JSON.stringify(meta, null, 2)}`;
    }
    
    return log;
  })
);

// Create logger instance
export const logger = winston.createLogger({
  level: logLevel,
  format: logFormat,
  defaultMeta: {
    service: 'editorial-juridico-api'
  },
  transports: [
    // Write to all logs file
    new winston.transports.File({
      filename: path.join(logDir, 'app.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 10,
    }),
    
    // Write error logs to separate file
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// Add console transport for development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat
  }));
}

// Create a stream object for Morgan HTTP request logging
export const morganStream = {
  write: (message: string) => {
    logger.info(message.trim());
  }
};

// Helper functions for structured logging
export const loggers = {
  request: (req: any, res: any, responseTime: number) => {
    logger.info('HTTP Request', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      userId: req.user?.id,
    });
  },
  
  error: (error: Error, context?: any) => {
    logger.error('Application Error', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      ...context,
    });
  },
  
  database: (query: string, duration?: number) => {
    logger.debug('Database Query', {
      query,
      duration: duration ? `${duration}ms` : undefined,
    });
  },
  
  ai: (operation: string, model: string, duration: number, success: boolean) => {
    logger.info('AI Operation', {
      operation,
      model,
      duration: `${duration}ms`,
      success,
    });
  },
  
  auth: (action: string, userId?: string, email?: string, success: boolean = true) => {
    logger.info('Authentication', {
      action,
      userId,
      email,
      success,
    });
  },
  
  security: (event: string, severity: 'low' | 'medium' | 'high' | 'critical', details: any) => {
    logger.warn('Security Event', {
      event,
      severity,
      ...details,
    });
  }
};