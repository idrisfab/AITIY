"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatCompletionLimiter = exports.authLimiter = exports.apiLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const errors_1 = require("../utils/errors");
exports.apiLimiter = (0, express_rate_limit_1.default)({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // Limit each IP to 100 requests per windowMs
    message: {
        status: 'error',
        message: 'Too many requests from this IP, please try again later.',
    },
    handler: (req, res, next, options) => {
        next(new errors_1.AppError('Too many requests, please try again later', 429));
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
exports.authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // Limit each IP to 5 requests per windowMs
    message: {
        status: 'error',
        message: 'Too many attempts, please try again after an hour',
    },
    handler: (req, res, next, options) => {
        next(new errors_1.AppError('Too many attempts, please try again after an hour', 429));
    },
    standardHeaders: true,
    legacyHeaders: false,
});
// More strict rate limiting for chat completions
exports.chatCompletionLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000, // 1 minute
    max: 20, // Limit each IP to 20 requests per minute
    message: {
        status: 'error',
        message: 'Too many chat requests, please slow down.',
    },
    handler: (req, res, next, options) => {
        next(new errors_1.AppError('Too many chat requests, please slow down.', 429));
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
