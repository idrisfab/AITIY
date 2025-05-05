export enum ErrorType {
  VALIDATION = 'ValidationError',
  AUTHENTICATION = 'AuthenticationError',
  AUTHORIZATION = 'AuthorizationError',
  NOT_FOUND = 'NotFoundError',
  CONFLICT = 'ConflictError',
  RATE_LIMIT = 'RateLimitError',
  API_INTEGRATION = 'ApiIntegrationError',
  DATABASE = 'DatabaseError',
  INTERNAL = 'InternalError'
}

export class AppError extends Error {
  statusCode: number;
  status: string;
  isOperational: boolean;
  type: ErrorType;

  constructor(message: string, statusCode: number, type: ErrorType = ErrorType.INTERNAL) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    this.type = type;

    Error.captureStackTrace(this, this.constructor);
  }

  // Factory methods for common error types
  static badRequest(message: string): AppError {
    return new AppError(message, 400, ErrorType.VALIDATION);
  }

  static unauthorized(message: string = 'Authentication required'): AppError {
    return new AppError(message, 401, ErrorType.AUTHENTICATION);
  }

  static forbidden(message: string = 'Access forbidden'): AppError {
    return new AppError(message, 403, ErrorType.AUTHORIZATION);
  }

  static notFound(resource: string = 'Resource'): AppError {
    return new AppError(`${resource} not found`, 404, ErrorType.NOT_FOUND);
  }

  static conflict(message: string): AppError {
    return new AppError(message, 409, ErrorType.CONFLICT);
  }

  static rateLimit(message: string = 'Rate limit exceeded'): AppError {
    return new AppError(message, 429, ErrorType.RATE_LIMIT);
  }

  static apiIntegration(message: string, statusCode: number = 500): AppError {
    return new AppError(message, statusCode, ErrorType.API_INTEGRATION);
  }

  static database(message: string): AppError {
    return new AppError(message, 500, ErrorType.DATABASE);
  }

  static internal(message: string = 'Something went wrong'): AppError {
    return new AppError(message, 500, ErrorType.INTERNAL);
  }
} 