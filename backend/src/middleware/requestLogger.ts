import { Request, Response, NextFunction } from 'express';
import { Logger } from '../utils/logger';

const logger = Logger.getLogger('http');

export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const start = Date.now();
  const { method, originalUrl, ip } = req;
  
  // Log request start in debug mode
  logger.debug(`Request started: ${method} ${originalUrl}`, { ip });
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;
    
    // Choose log level based on status code
    if (statusCode >= 500) {
      logger.error(`${method} ${originalUrl} ${statusCode} - ${duration}ms`);
    } else if (statusCode >= 400) {
      logger.warn(`${method} ${originalUrl} ${statusCode} - ${duration}ms`);
    } else {
      logger.info(`${method} ${originalUrl} ${statusCode} - ${duration}ms`);
    }
  });

  next();
}; 