"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCsrfToken = exports.csrfMiddleware = void 0;
const csurf_1 = __importDefault(require("csurf"));
const logger_1 = require("../utils/logger");
const errors_1 = require("../utils/errors");
const logger = logger_1.Logger.getLogger('csrf');
// Initialize CSRF protection middleware
const csrfProtection = (0, csurf_1.default)({
    cookie: {
        // These are secure defaults
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        httpOnly: true
    }
});
// The paths that should be exempt from CSRF protection
const csrfExemptPaths = [
    '/api/auth/login', // Exempt login to allow initial CSRF token exchange
    '/api/auth/register', // Exempt registration
    '/api/chat/completions', // Public API for chat completions
    '/api/chat/embed', // Public API for getting embed config
];
/**
 * CSRF protection middleware that checks if the request should be protected
 */
const csrfMiddleware = (req, res, next) => {
    // Skip CSRF protection for exempt paths
    if (csrfExemptPaths.some(path => req.path.includes(path))) {
        return next();
    }
    // Also skip CSRF for OPTIONS requests (preflight)
    if (req.method === 'OPTIONS') {
        return next();
    }
    // Apply CSRF protection middleware for everything else
    csrfProtection(req, res, (err) => {
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
exports.csrfMiddleware = csrfMiddleware;
/**
 * Generate a CSRF token and attach it to the response
 */
const generateCsrfToken = (req, res, next) => {
    // Skip token generation for exempt paths
    if (csrfExemptPaths.some(path => req.path.includes(path))) {
        return next();
    }
    try {
        // Generate a token
        csrfProtection(req, res, (err) => {
            if (err) {
                logger.error('Failed to generate CSRF token', err);
                return next(errors_1.AppError.internal('Failed to generate security token'));
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
    }
    catch (error) {
        logger.error('Error in CSRF token generation', error);
        next(errors_1.AppError.internal('Failed to generate security token'));
    }
};
exports.generateCsrfToken = generateCsrfToken;
