# API Key Management

This document describes the API endpoints for managing API keys in the platform. All endpoints require authentication using a JWT token in the Authorization header.

## Authentication

All requests must include an `Authorization` header with a valid JWT token:

```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### Create API Key
`POST /api/keys`

Creates a new API key for the authenticated user.

**Request Body:**
```json
{
  "vendor": "string",   // Required: The vendor name (e.g., "openai", "anthropic")
  "apiKey": "string",   // Required: The API key to store
  "name": "string"      // Optional: A friendly name for the key
}
```

**Response:** `201 Created`
```json
{
  "id": "string",
  "vendor": "string",
  "name": "string",
  "createdAt": "string"
}
```

**Possible Errors:**
- `400 Bad Request`: Missing required fields or duplicate name
- `401 Unauthorized`: Invalid or missing authentication token
- `500 Internal Server Error`: Server error

### List API Keys
`GET /api/keys`

Retrieves all API keys for the authenticated user.

**Response:** `200 OK`
```json
[
  {
    "id": "string",
    "vendor": "string",
    "name": "string",
    "createdAt": "string",
    "usageCount": "number"
  }
]
```

**Note:** The actual API key values are never returned in responses for security reasons.

**Possible Errors:**
- `401 Unauthorized`: Invalid or missing authentication token
- `500 Internal Server Error`: Server error

### Delete API Key
`DELETE /api/keys/:id`

Deletes an API key by its ID.

**Parameters:**
- `id`: The ID of the API key to delete

**Response:** `200 OK`
```json
{
  "message": "API key deleted successfully"
}
```

**Possible Errors:**
- `401 Unauthorized`: Invalid or missing authentication token
- `404 Not Found`: API key not found or belongs to another user
- `500 Internal Server Error`: Server error

### Update API Key Name
`PATCH /api/keys/:id`

Updates the name of an existing API key.

**Parameters:**
- `id`: The ID of the API key to update

**Request Body:**
```json
{
  "name": "string"  // Required: The new name for the key
}
```

**Response:** `200 OK`
```json
{
  "id": "string",
  "vendor": "string",
  "name": "string",
  "createdAt": "string"
}
```

**Possible Errors:**
- `400 Bad Request`: Missing name or duplicate name for vendor
- `401 Unauthorized`: Invalid or missing authentication token
- `404 Not Found`: API key not found or belongs to another user
- `500 Internal Server Error`: Server error

## Security Considerations

1. API keys are encrypted using AES-256-GCM before storage
2. Each API key is encrypted with:
   - A unique salt
   - A unique initialization vector (IV)
   - An authentication tag for integrity verification
3. The encryption key should be stored securely in environment variables
4. API key values are never returned in responses
5. Users can only access and manage their own API keys

## Example Usage

### Creating an API Key
```bash
curl -X POST http://localhost:3000/api/keys \
  -H "Authorization: Bearer <your-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "vendor": "openai",
    "apiKey": "sk-your-api-key",
    "name": "My OpenAI Key"
  }'
```

### Listing API Keys
```bash
curl http://localhost:3000/api/keys \
  -H "Authorization: Bearer <your-jwt-token>"
```

### Deleting an API Key
```bash
curl -X DELETE http://localhost:3000/api/keys/<key-id> \
  -H "Authorization: Bearer <your-jwt-token>"
```

### Updating an API Key Name
```bash
curl -X PATCH http://localhost:3000/api/keys/<key-id> \
  -H "Authorization: Bearer <your-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New Key Name"
  }'
``` 