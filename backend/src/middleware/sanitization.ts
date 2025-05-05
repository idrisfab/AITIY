import { Request, Response, NextFunction } from 'express';
import { Logger } from '../utils/logger';
import { AppError } from '../utils/errors';
import DOMPurify from 'isomorphic-dompurify';
import { ZodError } from 'zod';

const logger = Logger.getLogger('sanitization');

/**
 * Sanitizes string values in request body to prevent XSS attacks
 */
export const sanitizeInputs = (req: Request, res: Response, next: NextFunction): void => {
  try {
    if (req.body && typeof req.body === 'object') {
      sanitizeObject(req.body);
    }
    
    if (req.query && typeof req.query === 'object') {
      sanitizeObject(req.query);
    }
    
    if (req.params && typeof req.params === 'object') {
      sanitizeObject(req.params);
    }
    
    next();
  } catch (error) {
    logger.error('Error sanitizing request data', error);
    next(AppError.badRequest('Invalid input data'));
  }
};

/**
 * Recursively sanitizes all string values in an object
 */
function sanitizeObject(obj: Record<string, any>): void {
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      
      if (typeof value === 'string') {
        // Sanitize string values
        obj[key] = DOMPurify.sanitize(value).trim();
      } else if (value !== null && typeof value === 'object') {
        // Recursively sanitize nested objects (including arrays)
        sanitizeObject(value);
      }
    }
  }
}

/**
 * Creates a validation middleware using a Zod schema
 * This combines our existing validation with the sanitization
 */
export const validateAndSanitize = (schema: any) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // First sanitize inputs
      sanitizeObject(req.body);
      
      // Then validate the body directly with the schema
      const result = await schema.parseAsync(req.body);
      
      // Replace the body with the validated result
      req.body = result;
      
      next();
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        logger.warn('Validation failed', { errors: error.format() });
        return res.status(400).json({
          status: 'fail',
          type: 'ValidationError',
          message: 'Validation failed',
          errors: error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        });
      }
      
      next(error);
    }
  };
}; 