import rateLimit from 'express-rate-limit';
import { AppError } from '../utils/errors';

export const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // Limit each IP to 100 requests per windowMs
  message: {
    status: 'error',
    message: 'Too many requests from this IP, please try again later.',
  },
  // Skip trust proxy configuration as it's set globally in app.ts
  handler: (req, res, next, options) => {
    next(new AppError('Too many requests, please try again later', 429));
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

export const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    status: 'error',
    message: 'Too many attempts, please try again after an hour',
  },
  // Skip trust proxy configuration as it's set globally in app.ts
  handler: (req, res, next, options) => {
    next(new AppError('Too many attempts, please try again after an hour', 429));
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// More strict rate limiting for chat completions
export const chatCompletionLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // Limit each IP to 20 requests per minute
  message: {
    status: 'error',
    message: 'Too many chat requests, please slow down.',
  },
  // Skip trust proxy configuration as it's set globally in app.ts
  handler: (req, res, next, options) => {
    next(new AppError('Too many chat requests, please slow down.', 429));
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip if request includes valid API token
  skip: (req, res) => {
    // You can implement logic to bypass rate limiting for authenticated users
    // or based on specific conditions
    return false;
  },
}); 