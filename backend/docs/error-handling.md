# Error Handling in ATTIY

This document outlines the error handling approach used across the ATTIY application.

## Key Components

### 1. AppError Class

Located in `backend/src/utils/errors.ts`, this class serves as the foundation for all operational errors in the application. It provides:

- Standardized error structure with `statusCode`, `status`, and `isOperational` properties
- Error categorization via the `ErrorType` enum
- Factory methods for common error types (e.g., `notFound`, `badRequest`)

```typescript
// Example usage
throw AppError.notFound('User');
throw AppError.forbidden('You do not have permission to access this resource');
throw AppError.badRequest('Invalid input data');
```

### 2. Global Error Handler

Located in `backend/src/middleware/error-handler.ts`, this Express middleware catches all errors thrown within the application and formats them consistently for client responses.

Features:
- Handles `AppError` instances based on their status code and type
- Special handling for Prisma database errors
- Consistent JSON response format 
- Stack traces included in development mode only

### 3. Logger Utility

Located in `backend/src/utils/logger.ts`, this utility standardizes logging across the application:

- Multiple log levels (ERROR, WARN, INFO, DEBUG)
- Contextual metadata for each log
- Special handling for error objects
- Support for environment-based configuration

```typescript
// Example usage
const logger = Logger.getLogger('user-service');
logger.info('User created', { userId: user.id });
logger.error('Failed to update user', error);
```

## Error Response Format

All errors are returned to the client in a consistent JSON format:

```json
{
  "status": "fail",
  "type": "ValidationError",
  "message": "Email is required"
}
```

Where:
- `status`: Either "fail" (client error) or "error" (server error)
- `type`: The category of error (from ErrorType enum)
- `message`: Human-readable error description

## Error Types

| Type | Status Code | Description |
|------|------------|-------------|
| ValidationError | 400 | Invalid input data |
| AuthenticationError | 401 | Missing or invalid credentials |
| AuthorizationError | 403 | Insufficient permissions |
| NotFoundError | 404 | Resource not found |
| ConflictError | 409 | Resource conflict (e.g., duplicate entry) |
| RateLimitError | 429 | Too many requests |
| ApiIntegrationError | Varies | Error from external API |
| DatabaseError | 500 | Database-related error |
| InternalError | 500 | Unexpected server error |

## Best Practices

1. **Use AppError factory methods** for all operational errors
2. **Let the global error handler do its job** - avoid try/catch blocks that swallow errors
3. **Log appropriately** - use the correct log level for each situation
4. **Include context** - add relevant metadata to logs
5. **Be specific but cautious** - error messages should be helpful but not expose sensitive information
6. **Validate inputs** using Zod schemas before processing

## Handling Non-Operational Errors

For unexpected errors (bugs, network issues, etc.), the global error handler:

1. Logs the error with full context
2. Returns a generic error message to the client
3. Includes stack trace in development mode only

## Example: Complete Error Handling Flow

```typescript
// In a route handler
router.post('/users', async (req, res, next) => {
  try {
    const validation = UserSchema.safeParse(req.body);
    if (!validation.success) {
      logger.warn('Invalid user data', { errors: validation.error.format() });
      throw AppError.badRequest('Invalid user data');
    }
    
    const { email } = validation.data;
    const existingUser = await prisma.user.findUnique({ where: { email } });
    
    if (existingUser) {
      logger.info(`Duplicate user registration attempt: ${email}`);
      throw AppError.conflict('User with this email already exists');
    }
    
    // Process the request...
    
  } catch (error) {
    // Pass to global error handler
    next(error);
  }
});
``` 