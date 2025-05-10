"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const rateLimit_1 = require("./middleware/rateLimit");
const error_handler_1 = require("./middleware/error-handler");
const requestLogger_1 = require("./middleware/requestLogger");
const sanitization_1 = require("./middleware/sanitization");
const csrf_1 = require("./middleware/csrf");
const securityHeaders_1 = require("./middleware/securityHeaders");
const validateEnv_1 = require("./utils/validateEnv");
const swagger_1 = require("./swagger");
const auth_1 = __importDefault(require("./routes/auth"));
const user_1 = __importDefault(require("./routes/user"));
const team_1 = __importDefault(require("./routes/team"));
const apiKey_1 = __importDefault(require("./routes/apiKey"));
const embed_1 = __importDefault(require("./routes/embed"));
const models_1 = __importDefault(require("./routes/models"));
const chat_1 = __importDefault(require("./routes/chat"));
const proxy_1 = __importDefault(require("./routes/proxy"));
const analytics_1 = __importDefault(require("./routes/analytics"));
const embeds_1 = __importDefault(require("./routes/public/embeds"));
// Validate environment variables
(0, validateEnv_1.validateEnv)();
const app = (0, express_1.default)();
// Basic middleware
// Configure CORS to allow requests from multiple frontend domains
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin)
            return callback(null, true);
        // Define allowed origins
        const allowedOrigins = [
            process.env.FRONTEND_URL || 'http://localhost:3000', // Primary frontend URL
            process.env.ADDITIONAL_FRONTEND_URL, // Additional production frontend URL
            'http://localhost:3000', // Local development
            'http://localhost:8000' // Alternative local port
        ].filter(Boolean); // Filter out undefined/null values
        if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
            callback(null, true);
        }
        else {
            console.warn(`Origin ${origin} not allowed by CORS`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true, // Important for cookies and authentication
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'CSRF-Token', 'X-CSRF-Token', 'X-XSRF-TOKEN']
}));
app.use(securityHeaders_1.securityHeaders);
app.use((0, cookie_parser_1.default)()); // Required for CSRF cookies
app.use(express_1.default.json());
app.use(requestLogger_1.requestLogger);
app.use(rateLimit_1.apiLimiter);
app.use(sanitization_1.sanitizeInputs);
// CSRF protection (generate token for GET requests, validate for others)
app.use((req, res, next) => {
    // Skip CSRF protection for proxy routes (used by embeds)
    if (req.path.startsWith('/api/proxy')) {
        return next();
    }
    if (req.method === 'GET') {
        (0, csrf_1.generateCsrfToken)(req, res, next);
    }
    else {
        (0, csrf_1.csrfMiddleware)(req, res, next);
    }
});
// API Documentation
app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_1.swaggerSpec));
// Public routes - no authentication required
app.use('/api/public/embeds', embeds_1.default);
// Protected routes
app.use('/api/auth', auth_1.default);
app.use('/api/users', user_1.default);
app.use('/api/teams', team_1.default);
app.use('/api/teams', embed_1.default); // Register embed routes under /api/teams path
app.use('/api/keys', apiKey_1.default);
app.use('/api/models', models_1.default);
app.use('/api/chat', chat_1.default);
app.use('/api/proxy', proxy_1.default);
app.use('/api/analytics', analytics_1.default);
// Error handling
app.use(error_handler_1.errorHandler);
exports.default = app;
