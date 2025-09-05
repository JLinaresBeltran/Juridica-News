import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import rateLimit from 'express-rate-limit';

import { logger } from '@/utils/logger';
import { errorHandler } from '@/middleware/errorHandler';
import { authMiddleware } from '@/middleware/auth';
import { requestLogger } from '@/middleware/requestLogger';
import { setupSwagger } from '@/utils/swagger';

// Route imports
import documentRoutes from '@/controllers/documents';
import articleRoutes from '@/controllers/articles';
import aiRoutes from '@/controllers/ai';
import mediaRoutes from '@/controllers/media';
import authRoutes from '@/controllers/auth';
import publicRoutes from '@/controllers/public';
import auditRoutes from '@/controllers/audit';
import scrapingRoutes from '@/controllers/scraping';
import adminRoutes from '@/controllers/admin'; // FUNCIÓN TEMPORAL
import { sseController } from '@/controllers/sse';
import healthRoutes from '@/controllers/health';

// Load environment variables
config();

const app = express();
const port = process.env.PORT || 3001;

// Initialize Prisma and Redis
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: {
    error: 'Too many requests from this IP, please try again later',
    retryAfter: Math.ceil(parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000') / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "ws:", "wss:"],
    },
  },
}));

app.use(cors({
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true,
}));

app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(requestLogger);
app.use(limiter);

// Swagger documentation
setupSwagger(app);

// Health check endpoint (no auth required)
app.use('/api/health', healthRoutes);

// Public routes (no auth required)
app.use('/api/public', publicRoutes);

// Auth routes (no auth required for login/register)
app.use('/api/auth', authRoutes);

// SSE endpoint (auth required)
app.get('/api/events/stream', authMiddleware, sseController.connect);

// Protected routes
app.use('/api/documents', authMiddleware, documentRoutes);
app.use('/api/articles', authMiddleware, articleRoutes);
app.use('/api/ai', authMiddleware, aiRoutes);
app.use('/api/media', authMiddleware, mediaRoutes);
app.use('/api/audit', authMiddleware, auditRoutes);
app.use('/api/scraping', authMiddleware, scrapingRoutes);
app.use('/api/admin', authMiddleware, adminRoutes); // FUNCIÓN TEMPORAL - Solo para desarrollo

// Static files serving (if needed)
app.use('/uploads', express.static(process.env.UPLOAD_DIR || './uploads'));

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Editorial Jurídico API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      documentation: '/api-docs',
      auth: '/api/auth',
      public: '/api/public'
    }
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method,
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  
  // Close database connections
  await prisma.$disconnect();
  await redis.quit();
  
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  
  // Close database connections
  await prisma.$disconnect();
  await redis.quit();
  
  process.exit(0);
});

// Start server
const server = app.listen(port, () => {
  logger.info(`🚀 Editorial Jurídico API running on port ${port}`);
  logger.info(`📚 API Documentation: http://localhost:${port}/api-docs`);
  logger.info(`🔍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Export for testing
export { app, prisma, redis };
export default server;