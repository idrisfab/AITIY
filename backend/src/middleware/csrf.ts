import { Request, Response, NextFunction } from 'express';
import csrf from 'csurf';
import { Logger } from '../utils/logger';
import { AppError } from '../utils/errors';

const logger = Logger.getLogger('csrf');

// Initialize CSRF protection middleware
const csrfProtection = csrf({
  cookie: {
    // These are secure defaults
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    httpOnly: true
  }
});

// The paths that should be exempt from CSRF protection
const csrfExemptPaths = [
  '/api/auth/login',        // Exempt login to allow initial CSRF token exchange
  '/api/auth/register',     // Exempt registration
  '/api/chat/completions',  // Public API for chat completions
  '/api/chat/embed',        // Public API for getting embed config
  '/api/public/embeds',     // Public embeds API endpoints
];

/**
 * CSRF protection middleware that checks if the request should be protected
 */
export const csrfMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Skip CSRF protection for exempt paths
  if (csrfExemptPaths.some(path => req.path.includes(path))) {
    return next();
  }

  // Also skip CSRF for OPTIONS requests (preflight)
  if (req.method === 'OPTIONS') {
    return next();
  }

  // Apply CSRF protection middleware for everything else
  csrfProtection(req, res, (err: any) => {
    if (err) {
      logger.warn('CSRF validation failed', { 
        path: req.path, 
        method: req.method,
        ip: req.ip
      });
      
      // Return a clear error response for CSRF failures
      return res.status(403).json({
        status: 'fail',
        type: 'CSRFError',
        message: 'CSRF token validation failed. Please refresh the page and try again.'
      });
    }
    next();
  });
};

/**
 * Generate a CSRF token and attach it to the response
 */
export const generateCsrfToken = (req: Request, res: Response, next: NextFunction) => {
  // Skip token generation for exempt paths
  if (csrfExemptPaths.some(path => req.path.includes(path))) {
    return next();
  }

  try {
    // Generate a token
    csrfProtection(req, res, (err: any) => {
      if (err) {
        logger.error('Failed to generate CSRF token', err);
        return next(AppError.internal('Failed to generate security token'));
      }
      
      // Add the token to the response
      const token = req.csrfToken();
      res.cookie('XSRF-TOKEN', token, {
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        httpOnly: false // Frontend needs to read this
      });
      
      next();
    });
  } catch (error) {
    logger.error('Error in CSRF token generation', error);
    next(AppError.internal('Failed to generate security token'));
  }
}; 