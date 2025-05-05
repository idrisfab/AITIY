"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateAndSanitize = exports.sanitizeInputs = void 0;
const logger_1 = require("../utils/logger");
const errors_1 = require("../utils/errors");
const isomorphic_dompurify_1 = __importDefault(require("isomorphic-dompurify"));
const zod_1 = require("zod");
const logger = logger_1.Logger.getLogger('sanitization');
/**
 * Sanitizes string values in request body to prevent XSS attacks
 */
const sanitizeInputs = (req, res, next) => {
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
    }
    catch (error) {
        logger.error('Error sanitizing request data', error);
        next(errors_1.AppError.badRequest('Invalid input data'));
    }
};
exports.sanitizeInputs = sanitizeInputs;
/**
 * Recursively sanitizes all string values in an object
 */
function sanitizeObject(obj) {
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const value = obj[key];
            if (typeof value === 'string') {
                // Sanitize string values
                obj[key] = isomorphic_dompurify_1.default.sanitize(value).trim();
            }
            else if (value !== null && typeof value === 'object') {
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
const validateAndSanitize = (schema) => {
    return async (req, res, next) => {
        try {
            // First sanitize inputs
            sanitizeObject(req.body);
            // Then validate the body directly with the schema
            const result = await schema.parseAsync(req.body);
            // Replace the body with the validated result
            req.body = result;
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
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
exports.validateAndSanitize = validateAndSanitize;
