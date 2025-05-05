"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = exports.Logger = exports.LogLevel = void 0;
const errors_1 = require("./errors");
// Define different log levels
var LogLevel;
(function (LogLevel) {
    LogLevel["ERROR"] = "error";
    LogLevel["WARN"] = "warn";
    LogLevel["INFO"] = "info";
    LogLevel["DEBUG"] = "debug";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
class Logger {
    constructor(name, options = {}) {
        this.name = name;
        this.options = { ...Logger.defaultOptions, ...options };
    }
    log(level, message, meta) {
        // Skip logging if the current log level is higher than the one being logged
        const levels = Object.values(LogLevel);
        if (levels.indexOf(level) > levels.indexOf(this.options.level)) {
            return;
        }
        const timestamp = this.options.includeTimestamp ? new Date().toISOString() : '';
        const prefix = `[${level.toUpperCase()}]${timestamp ? ` ${timestamp}` : ''}${this.name ? ` [${this.name}]` : ''}`;
        const logMessage = `${prefix}: ${message}`;
        if (this.options.logToConsole) {
            if (level === LogLevel.ERROR) {
                console.error(logMessage, meta || '');
            }
            else if (level === LogLevel.WARN) {
                console.warn(logMessage, meta || '');
            }
            else if (level === LogLevel.INFO) {
                console.info(logMessage, meta || '');
            }
            else {
                console.log(logMessage, meta || '');
            }
        }
        // In the future, additional logging targets could be added here
        // e.g., write to file, send to logging service, etc.
    }
    error(message, error) {
        let errorDetails = {};
        if (error) {
            if (error instanceof Error) {
                errorDetails = {
                    message: error.message,
                    stack: error.stack,
                    ...(error instanceof errors_1.AppError && {
                        statusCode: error.statusCode,
                        status: error.status,
                        isOperational: error.isOperational,
                    }),
                };
            }
            else {
                errorDetails = { unknownError: error };
            }
        }
        this.log(LogLevel.ERROR, message, errorDetails);
    }
    warn(message, meta) {
        this.log(LogLevel.WARN, message, meta);
    }
    info(message, meta) {
        this.log(LogLevel.INFO, message, meta);
    }
    debug(message, meta) {
        this.log(LogLevel.DEBUG, message, meta);
    }
    // Check if a specific log level is enabled
    isLevelEnabled(level) {
        const levels = Object.values(LogLevel);
        return levels.indexOf(level) <= levels.indexOf(this.options.level);
    }
    // Convenience methods to check specific log levels
    isErrorEnabled() {
        return this.isLevelEnabled(LogLevel.ERROR);
    }
    isWarnEnabled() {
        return this.isLevelEnabled(LogLevel.WARN);
    }
    isInfoEnabled() {
        return this.isLevelEnabled(LogLevel.INFO);
    }
    isDebugEnabled() {
        return this.isLevelEnabled(LogLevel.DEBUG);
    }
    // Helper method to create loggers with consistent naming pattern
    static getLogger(name, options = {}) {
        return new Logger(name, options);
    }
}
exports.Logger = Logger;
Logger.defaultOptions = {
    level: process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG,
    includeTimestamp: true,
    logToConsole: true,
};
// Create default logger instance for quick import and use
exports.logger = new Logger('app');
