import { Request, Response, NextFunction } from 'express';
import { AppError, ErrorType } from '../utils/errors';
import { Prisma } from '@prisma/client';
import { Logger } from '../utils/logger';

const logger = Logger.getLogger('error-handler');

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof AppError) {
    logger.warn(`AppError: ${err.message}`, { 
      statusCode: err.statusCode, 
      type: err.type,
      path: req.path,
      method: req.method
    });
    
    return res.status(err.statusCode).json({
      status: err.status,
      type: err.type,
      message: err.message,
    });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      logger.warn(`Database constraint error: ${err.message}`, {
        code: err.code,
        path: req.path,
        method: req.method
      });
      
      return res.status(409).json({
        status: 'fail',
        type: ErrorType.CONFLICT,
        message: 'A record with this value already exists',
      });
    }

    if (err.code === 'P2025') {
      logger.warn(`Record not found: ${err.message}`, {
        code: err.code,
        path: req.path,
        method: req.method
      });
      
      return res.status(404).json({
        status: 'fail',
        type: ErrorType.NOT_FOUND,
        message: 'The requested record does not exist',
      });
    }
    
    logger.error(`Database error: ${err.message}`, {
      code: err.code,
      path: req.path,
      method: req.method
    });
    
    return res.status(500).json({
      status: 'error',
      type: ErrorType.DATABASE,
      message: 'A database error occurred',
    });
  }

  // Log unexpected errors
  logger.error('Unexpected error occurred', err);
  logger.debug('Request details', {
    path: req.path,
    method: req.method,
    body: req.body,
    params: req.params,
    query: req.query,
    ip: req.ip,
    headers: {
      ...req.headers,
      authorization: req.headers.authorization ? '***REDACTED***' : undefined
    }
  });

  // Include stack trace in development environment
  const isDev = process.env.NODE_ENV === 'development';
  
  return res.status(500).json({
    status: 'error',
    type: ErrorType.INTERNAL,
    message: 'Something went wrong',
    ...(isDev && { stack: err.stack })
  });
}; 