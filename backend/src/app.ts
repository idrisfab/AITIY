import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import cookieParser from 'cookie-parser';
import { apiLimiter } from './middleware/rateLimit';
import { errorHandler } from './middleware/error-handler';
import { requestLogger } from './middleware/requestLogger';
import { sanitizeInputs } from './middleware/sanitization';
import { csrfMiddleware, generateCsrfToken } from './middleware/csrf';
import { securityHeaders } from './middleware/securityHeaders';
import { validateEnv } from './utils/validateEnv';
import { swaggerSpec } from './swagger';
import authRoutes from './routes/auth';
import userRoutes from './routes/user';
import teamRoutes from './routes/team';
import apiKeyRoutes from './routes/apiKey';
import embedRoutes from './routes/embed';
import modelRoutes from './routes/models';
import chatRoutes from './routes/chat';
import proxyRoutes from './routes/proxy';
import analyticsRoutes from './routes/analytics';
import publicEmbedsRoutes from './routes/public/embeds';

// Validate environment variables
validateEnv();

const app = express();

// Trust proxy - required when behind Nginx or other reverse proxies
// Use a more specific configuration to avoid ERR_ERL_PERMISSIVE_TRUST_PROXY error
app.set('trust proxy', '127.0.0.1');

// Basic middleware
// Configure CORS to allow requests from multiple frontend domains
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Define allowed origins
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:3000',  // Primary frontend URL
      process.env.ADDITIONAL_FRONTEND_URL,                  // Additional production frontend URL
      'https://aitiy.idro.co.uk',                          // Production domain
      'http://localhost:3000',                             // Local development
      'http://localhost:8000'                              // Alternative local port
    ].filter(Boolean); // Filter out undefined/null values
    
    // In production, be more permissive with CORS
    if (process.env.NODE_ENV === 'production') {
      callback(null, true); // Allow all origins in production
    } else if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      console.warn(`Origin ${origin} not allowed by CORS`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Important for cookies and authentication
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'CSRF-Token', 'X-CSRF-Token', 'X-XSRF-TOKEN', 'X-Requested-With']
}));
app.use(securityHeaders);
app.use(cookieParser()); // Required for CSRF cookies
app.use(express.json());
app.use(requestLogger);
// Temporarily disable rate limiter to troubleshoot
// app.use(apiLimiter);
app.use(sanitizeInputs);

// CSRF protection (generate token for GET requests, validate for others)
app.use((req, res, next) => {
  // Skip CSRF protection for proxy routes (used by embeds)
  if (req.path.startsWith('/api/proxy')) {
    return next();
  }
  
  // Skip CSRF protection for auth routes
  if (req.path.includes('/auth/login') || req.path.includes('/auth/register')) {
    return next();
  }
  
  if (req.method === 'GET') {
    generateCsrfToken(req, res, next);
  } else {
    csrfMiddleware(req, res, next);
  }
});

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Public routes - no authentication required
app.use('/api/public/embeds', publicEmbedsRoutes);

// Protected routes
// Only register auth routes under /api/auth as per the nginx configuration
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/teams', embedRoutes); // Register embed routes under /api/teams path
app.use('/api/keys', apiKeyRoutes);
app.use('/api/models', modelRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/proxy', proxyRoutes);
app.use('/api/analytics', analyticsRoutes);

// Error handling
app.use(errorHandler);

export default app; 