import { AppError } from './errors';

// Define different log levels
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
}

// Define options for the logger
interface LoggerOptions {
  level: LogLevel;
  includeTimestamp: boolean;
  logToConsole: boolean;
  // Could be extended for other options like file logging, etc.
}

export class Logger {
  private static defaultOptions: LoggerOptions = {
    level: process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG,
    includeTimestamp: true,
    logToConsole: true,
  };

  private name: string;
  private options: LoggerOptions;

  constructor(name: string, options: Partial<LoggerOptions> = {}) {
    this.name = name;
    this.options = { ...Logger.defaultOptions, ...options };
  }

  private log(level: LogLevel, message: string, meta?: any): void {
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
      } else if (level === LogLevel.WARN) {
        console.warn(logMessage, meta || '');
      } else if (level === LogLevel.INFO) {
        console.info(logMessage, meta || '');
      } else {
        console.log(logMessage, meta || '');
      }
    }

    // In the future, additional logging targets could be added here
    // e.g., write to file, send to logging service, etc.
  }

  error(message: string, error?: Error | unknown): void {
    let errorDetails: any = {};
    
    if (error) {
      if (error instanceof Error) {
        errorDetails = {
          message: error.message,
          stack: error.stack,
          ...(error instanceof AppError && {
            statusCode: error.statusCode,
            status: error.status,
            isOperational: error.isOperational,
          }),
        };
      } else {
        errorDetails = { unknownError: error };
      }
    }
    
    this.log(LogLevel.ERROR, message, errorDetails);
  }

  warn(message: string, meta?: any): void {
    this.log(LogLevel.WARN, message, meta);
  }

  info(message: string, meta?: any): void {
    this.log(LogLevel.INFO, message, meta);
  }

  debug(message: string, meta?: any): void {
    this.log(LogLevel.DEBUG, message, meta);
  }

  // Check if a specific log level is enabled
  isLevelEnabled(level: LogLevel): boolean {
    const levels = Object.values(LogLevel);
    return levels.indexOf(level) <= levels.indexOf(this.options.level);
  }

  // Convenience methods to check specific log levels
  isErrorEnabled(): boolean {
    return this.isLevelEnabled(LogLevel.ERROR);
  }

  isWarnEnabled(): boolean {
    return this.isLevelEnabled(LogLevel.WARN);
  }

  isInfoEnabled(): boolean {
    return this.isLevelEnabled(LogLevel.INFO);
  }

  isDebugEnabled(): boolean {
    return this.isLevelEnabled(LogLevel.DEBUG);
  }

  // Helper method to create loggers with consistent naming pattern
  static getLogger(name: string, options: Partial<LoggerOptions> = {}): Logger {
    return new Logger(name, options);
  }
}

// Create default logger instance for quick import and use
export const logger = new Logger('app'); 