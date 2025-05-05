"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = exports.ErrorType = void 0;
var ErrorType;
(function (ErrorType) {
    ErrorType["VALIDATION"] = "ValidationError";
    ErrorType["AUTHENTICATION"] = "AuthenticationError";
    ErrorType["AUTHORIZATION"] = "AuthorizationError";
    ErrorType["NOT_FOUND"] = "NotFoundError";
    ErrorType["CONFLICT"] = "ConflictError";
    ErrorType["RATE_LIMIT"] = "RateLimitError";
    ErrorType["API_INTEGRATION"] = "ApiIntegrationError";
    ErrorType["DATABASE"] = "DatabaseError";
    ErrorType["INTERNAL"] = "InternalError";
})(ErrorType || (exports.ErrorType = ErrorType = {}));
class AppError extends Error {
    constructor(message, statusCode, type = ErrorType.INTERNAL) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;
        this.type = type;
        Error.captureStackTrace(this, this.constructor);
    }
    // Factory methods for common error types
    static badRequest(message) {
        return new AppError(message, 400, ErrorType.VALIDATION);
    }
    static unauthorized(message = 'Authentication required') {
        return new AppError(message, 401, ErrorType.AUTHENTICATION);
    }
    static forbidden(message = 'Access forbidden') {
        return new AppError(message, 403, ErrorType.AUTHORIZATION);
    }
    static notFound(resource = 'Resource') {
        return new AppError(`${resource} not found`, 404, ErrorType.NOT_FOUND);
    }
    static conflict(message) {
        return new AppError(message, 409, ErrorType.CONFLICT);
    }
    static rateLimit(message = 'Rate limit exceeded') {
        return new AppError(message, 429, ErrorType.RATE_LIMIT);
    }
    static apiIntegration(message, statusCode = 500) {
        return new AppError(message, statusCode, ErrorType.API_INTEGRATION);
    }
    static database(message) {
        return new AppError(message, 500, ErrorType.DATABASE);
    }
    static internal(message = 'Something went wrong') {
        return new AppError(message, 500, ErrorType.INTERNAL);
    }
}
exports.AppError = AppError;
