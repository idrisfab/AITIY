"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.securityHeaders = void 0;
const logger_1 = require("../utils/logger");
const logger = logger_1.Logger.getLogger('security-headers');
/**
 * Middleware that adds important security headers to all responses
 * to protect against common web vulnerabilities
 */
const securityHeaders = (req, res, next) => {
    // X-XSS-Protection
    // Prevents reflected XSS attacks by instructing browser to block the response 
    // if it detects an attack
    res.setHeader('X-XSS-Protection', '1; mode=block');
    // X-Content-Type-Options 
    // Prevents MIME type sniffing which can cause security vulnerabilities
    res.setHeader('X-Content-Type-Options', 'nosniff');
    // X-Frame-Options
    // Protects against clickjacking attacks by preventing the page from being
    // displayed in an iframe
    res.setHeader('X-Frame-Options', 'DENY');
    // Strict-Transport-Security
    // Ensures browser only connects to the server via HTTPS for the specified time
    // Only applied in production environments
    if (process.env.NODE_ENV === 'production') {
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    // Content-Security-Policy
    // Restricts sources from which content can be loaded
    // This is a comprehensive policy for modern web applications
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; connect-src 'self' https://api.openai.com; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'; font-src 'self' data:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'");
    // Referrer-Policy
    // Controls how much referrer information should be included with requests
    res.setHeader('Referrer-Policy', 'same-origin');
    // Permissions-Policy (formerly Feature-Policy)
    // Controls which browser features can be used
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    next();
};
exports.securityHeaders = securityHeaders;
