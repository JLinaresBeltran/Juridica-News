import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { logger } from '@/utils/logger';

type ValidationTarget = 'body' | 'query' | 'params';

export const validateRequest = (
  schema: ZodSchema,
  target: ValidationTarget = 'body'
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = target === 'body' ? req.body : 
                  target === 'query' ? req.query : 
                  req.params;

      const validatedData = schema.parse(data);
      
      // Replace the original data with validated data
      if (target === 'body') {
        req.body = validatedData;
      } else if (target === 'query') {
        req.query = validatedData;
      } else {
        req.params = validatedData;
      }

      next();
      
    } catch (error) {
      if (error instanceof ZodError) {
        const validationErrors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
          received: err.received,
        }));

        logger.warn('Validation error', {
          target,
          errors: validationErrors,
          userId: req.user?.id,
          path: req.path,
          method: req.method
        });

        return res.status(400).json({
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: validationErrors
        });
      }

      logger.error('Validation middleware error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        target,
        path: req.path
      });

      res.status(500).json({
        error: 'Validation service error',
        code: 'VALIDATION_SERVICE_ERROR'
      });
    }
  };
};