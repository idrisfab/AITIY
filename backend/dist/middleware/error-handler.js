"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const errors_1 = require("../utils/errors");
const client_1 = require("@prisma/client");
const logger_1 = require("../utils/logger");
const logger = logger_1.Logger.getLogger('error-handler');
const errorHandler = (err, req, res, next) => {
    if (err instanceof errors_1.AppError) {
        logger.warn(`AppError: ${err.message}`, {
            statusCode: err.statusCode,
            type: err.type,
            path: req.path,
            method: req.method
        });
        return res.status(err.statusCode).json({
            status: err.status,
            type: err.type,
            message: err.message,
        });
    }
    if (err instanceof client_1.Prisma.PrismaClientKnownRequestError) {
        if (err.code === 'P2002') {
            logger.warn(`Database constraint error: ${err.message}`, {
                code: err.code,
                path: req.path,
                method: req.method
            });
            return res.status(409).json({
                status: 'fail',
                type: errors_1.ErrorType.CONFLICT,
                message: 'A record with this value already exists',
            });
        }
        if (err.code === 'P2025') {
            logger.warn(`Record not found: ${err.message}`, {
                code: err.code,
                path: req.path,
                method: req.method
            });
            return res.status(404).json({
                status: 'fail',
                type: errors_1.ErrorType.NOT_FOUND,
                message: 'The requested record does not exist',
            });
        }
        logger.error(`Database error: ${err.message}`, {
            code: err.code,
            path: req.path,
            method: req.method
        });
        return res.status(500).json({
            status: 'error',
            type: errors_1.ErrorType.DATABASE,
            message: 'A database error occurred',
        });
    }
    // Log unexpected errors
    logger.error('Unexpected error occurred', err);
    logger.debug('Request details', {
        path: req.path,
        method: req.method,
        body: req.body,
        params: req.params,
        query: req.query,
        ip: req.ip,
        headers: {
            ...req.headers,
            authorization: req.headers.authorization ? '***REDACTED***' : undefined
        }
    });
    // Include stack trace in development environment
    const isDev = process.env.NODE_ENV === 'development';
    return res.status(500).json({
        status: 'error',
        type: errors_1.ErrorType.INTERNAL,
        message: 'Something went wrong',
        ...(isDev && { stack: err.stack })
    });
};
exports.errorHandler = errorHandler;
