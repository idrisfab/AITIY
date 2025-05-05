# Logger Utility Examples

This document provides examples of how to use the `Logger` utility in the ATTIY application.

## Basic Usage

### Create and Use a Logger

```typescript
import { Logger } from '../utils/logger';

// Create a named logger
const logger = Logger.getLogger('user-service');

// Use different log levels
logger.debug('Attempting to create user', { email: 'user@example.com' });
logger.info('User created successfully', { userId: 'abc123' });
logger.warn('User login with expired token', { userId: 'abc123' });
logger.error('Failed to create user', error);
```

## Logger Options

You can customize the logger behavior by passing options:

```typescript
import { Logger, LogLevel } from '../utils/logger';

// Create a logger with custom options
const logger = Logger.getLogger('payment-processor', {
  level: LogLevel.INFO,        // Only log INFO and above (INFO, WARN, ERROR)
  includeTimestamp: true,      // Include ISO timestamp in logs
  logToConsole: true,          // Output to console
});
```

## Logging with Context

Adding context helps with debugging and analysis:

```typescript
// Log with user context
logger.info('Password reset requested', { 
  userId: user.id,
  email: user.email,
  requestIp: req.ip,
});

// Log with performance metrics
logger.debug('Database query completed', {
  queryName: 'getUserByEmail',
  duration: `${endTime - startTime}ms`,
  resultCount: users.length
});

// Log with system context
logger.info('Application started', {
  version: process.env.APP_VERSION,
  environment: process.env.NODE_ENV,
  nodeVersion: process.version,
});
```

## Error Logging

The logger has special handling for Error objects:

```typescript
try {
  // Some operation that might fail
  await doSomethingRisky();
} catch (error) {
  // Log the error with context
  logger.error('Operation failed', error);
  
  // Additional context can be added
  logger.error('Payment processing failed', {
    error,
    paymentId: payment.id,
    amount: payment.amount,
    provider: payment.provider
  });
}
```

For `AppError` instances, additional properties are automatically captured:

```typescript
try {
  // Code that might throw an AppError
  if (amount <= 0) {
    throw AppError.badRequest('Payment amount must be positive');
  }
} catch (error) {
  // The logger will automatically capture statusCode, status, and type
  // from AppError instances
  logger.error('Payment validation failed', error);
}
```

## Log Levels Guide

Use the appropriate log level based on the information importance:

| Level | When to Use |
|-------|------------|
| ERROR | For errors that affect application functionality and require attention |
| WARN  | For potentially harmful situations that might lead to errors |
| INFO  | For general information about application operation |
| DEBUG | For detailed information useful during development and troubleshooting |

## Best Practices

1. **Create named loggers** for different modules/components
2. **Be consistent with log levels** across the application
3. **Include relevant context** but avoid sensitive information
4. **Keep messages concise** but descriptive
5. **Use structured logging** (objects as the second parameter) for better analysis
6. **Don't log sensitive data** like passwords, tokens, or personal information

## Performance Considerations

- Avoid expensive operations in DEBUG level logs when possible
- For complex objects, consider selective property logging instead of the entire object
- Use template strings only when necessary (they're evaluated even if the log level is filtered)

```typescript
// Avoid in production (if level is INFO):
logger.debug(`Complex calculation result: ${expensiveCalculation()}`);

// Better approach:
if (logger.isDebugEnabled()) {
  logger.debug('Complex calculation result', { result: expensiveCalculation() });
}
``` 