import { Request, Response, NextFunction } from 'express';
import { PrismaClientKnownRequestError, PrismaClientValidationError } from '@prisma/client/runtime/library';
import { logger } from '@/utils/logger';

interface CustomError extends Error {
  statusCode?: number;
  code?: string;
  field?: string;
}

export const errorHandler = (
  error: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log the error
  logger.error('Error handler caught error', {
    error: error.message,
    stack: error.stack,
    name: error.name,
    statusCode: error.statusCode,
    code: error.code,
    path: req.path,
    method: req.method,
    userId: req.user?.id,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Handle Prisma errors
  if (error instanceof PrismaClientKnownRequestError) {
    return handlePrismaError(error, res);
  }

  if (error instanceof PrismaClientValidationError) {
    return res.status(400).json({
      error: 'Database validation error',
      code: 'DATABASE_VALIDATION_ERROR',
      message: 'Invalid data provided to database'
    });
  }

  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Invalid token',
      code: 'INVALID_TOKEN'
    });
  }

  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Token expired',
      code: 'TOKEN_EXPIRED'
    });
  }

  // Handle custom application errors
  if (error.statusCode) {
    return res.status(error.statusCode).json({
      error: error.message,
      code: error.code || 'APPLICATION_ERROR'
    });
  }

  // Handle validation errors (if not caught by validation middleware)
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      message: error.message
    });
  }

  // Handle syntax errors (malformed JSON, etc.)
  if (error instanceof SyntaxError && 'body' in error) {
    return res.status(400).json({
      error: 'Invalid JSON in request body',
      code: 'INVALID_JSON'
    });
  }

  // Default error response
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(500).json({
    error: 'Internal server error',
    code: 'INTERNAL_SERVER_ERROR',
    message: isDevelopment ? error.message : 'An unexpected error occurred',
    ...(isDevelopment && { stack: error.stack })
  });
};

const handlePrismaError = (error: PrismaClientKnownRequestError, res: Response) => {
  switch (error.code) {
    case 'P2002':
      // Unique constraint violation
      const field = error.meta?.target as string[] || [];
      return res.status(409).json({
        error: 'Resource already exists',
        code: 'DUPLICATE_RESOURCE',
        field: field[0],
        message: `A record with this ${field[0]} already exists`
      });

    case 'P2025':
      // Record not found
      return res.status(404).json({
        error: 'Resource not found',
        code: 'RESOURCE_NOT_FOUND',
        message: 'The requested resource could not be found'
      });

    case 'P2003':
      // Foreign key constraint violation
      return res.status(400).json({
        error: 'Invalid reference',
        code: 'FOREIGN_KEY_VIOLATION',
        message: 'Referenced resource does not exist'
      });

    case 'P2014':
      // Required relation missing
      return res.status(400).json({
        error: 'Missing required relation',
        code: 'REQUIRED_RELATION_MISSING',
        message: 'A required related resource is missing'
      });

    case 'P2016':
      // Query interpretation error
      return res.status(400).json({
        error: 'Query error',
        code: 'QUERY_INTERPRETATION_ERROR',
        message: 'Invalid query parameters'
      });

    case 'P2021':
      // Table does not exist
      return res.status(500).json({
        error: 'Database schema error',
        code: 'TABLE_NOT_FOUND',
        message: 'Database table not found'
      });

    case 'P2022':
      // Column does not exist
      return res.status(500).json({
        error: 'Database schema error',
        code: 'COLUMN_NOT_FOUND',
        message: 'Database column not found'
      });

    default:
      // Generic Prisma error
      return res.status(500).json({
        error: 'Database error',
        code: 'DATABASE_ERROR',
        message: 'An error occurred while accessing the database',
        prismaCode: error.code
      });
  }
};

// Custom error classes for application-specific errors
export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500, code: string = 'APPLICATION_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, 'RESOURCE_NOT_FOUND');
  }
}

export class ValidationError extends AppError {
  constructor(message: string, field?: string) {
    super(message, 400, 'VALIDATION_ERROR');
    if (field) {
      (this as any).field = field;
    }
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class ConflictError extends AppError {
  constructor(message: string, field?: string) {
    super(message, 409, 'CONFLICT');
    if (field) {
      (this as any).field = field;
    }
  }
}