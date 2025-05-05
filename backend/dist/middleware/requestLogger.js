"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestLogger = void 0;
const logger_1 = require("../utils/logger");
const logger = logger_1.Logger.getLogger('http');
const requestLogger = (req, res, next) => {
    const start = Date.now();
    const { method, originalUrl, ip } = req;
    // Log request start in debug mode
    logger.debug(`Request started: ${method} ${originalUrl}`, { ip });
    res.on('finish', () => {
        const duration = Date.now() - start;
        const statusCode = res.statusCode;
        // Choose log level based on status code
        if (statusCode >= 500) {
            logger.error(`${method} ${originalUrl} ${statusCode} - ${duration}ms`);
        }
        else if (statusCode >= 400) {
            logger.warn(`${method} ${originalUrl} ${statusCode} - ${duration}ms`);
        }
        else {
            logger.info(`${method} ${originalUrl} ${statusCode} - ${duration}ms`);
        }
    });
    next();
};
exports.requestLogger = requestLogger;
