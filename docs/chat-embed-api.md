# Chat Embed API Documentation

This document outlines the API endpoints for managing chat embeds in the ATTIY platform.

## Authentication

All API endpoints require authentication using a Bearer token:

```
Authorization: Bearer <your_token>
```

## API Base URL

```
http://localhost:3001/api
```

## Endpoints

### List Chat Embeds

Fetches all chat embeds for a specific team.

**Endpoint**: `GET /teams/{teamId}/embeds`

**Parameters**:
- `teamId` (path parameter): UUID of the team

**Response**:
```json
[
  {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "teamId": "123e4567-e89b-12d3-a456-426614174001",
    "name": "Website Chat Assistant",
    "description": "An AI assistant for our website visitors",
    "welcomeMessage": "👋 How can I help you today?",
    "systemPrompt": "You are a helpful, concise assistant for our website.",
    "theme": "light",
    "position": "bottom-right",
    "primaryColor": "#04AA6D",
    "isActive": true,
    "apiKeyId": "123e4567-e89b-12d3-a456-426614174002",
    "modelVendor": "openai",
    "modelName": "gpt-4",
    "width": 400,
    "height": 500,
    "responsive": true,
    "createdAt": "2023-05-25T10:30:00Z",
    "updatedAt": "2023-05-25T10:30:00Z"
  }
]
```

### Get Single Chat Embed

Fetches a specific chat embed by ID.

**Endpoint**: `GET /teams/{teamId}/embeds/{embedId}`

**Parameters**:
- `teamId` (path parameter): UUID of the team
- `embedId` (path parameter): UUID of the chat embed

**Response**:
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "teamId": "123e4567-e89b-12d3-a456-426614174001",
  "name": "Website Chat Assistant",
  "description": "An AI assistant for our website visitors",
  "welcomeMessage": "👋 How can I help you today?",
  "systemPrompt": "You are a helpful, concise assistant for our website.",
  "theme": "light",
  "position": "bottom-right",
  "primaryColor": "#04AA6D",
  "isActive": true,
  "apiKeyId": "123e4567-e89b-12d3-a456-426614174002",
  "modelVendor": "openai",
  "modelName": "gpt-4",
  "width": 400,
  "height": 500,
  "responsive": true,
  "createdAt": "2023-05-25T10:30:00Z",
  "updatedAt": "2023-05-25T10:30:00Z"
}
```

### Create Chat Embed

Creates a new chat embed for a team.

**Endpoint**: `POST /teams/{teamId}/embeds`

**Parameters**:
- `teamId` (path parameter): UUID of the team

**Request Body**:
```json
{
  "name": "Website Chat Assistant",
  "description": "An AI assistant for our website visitors",
  "welcomeMessage": "👋 How can I help you today?",
  "systemPrompt": "You are a helpful, concise assistant for our website.",
  "theme": "light",
  "position": "bottom-right",
  "primaryColor": "#04AA6D",
  "isActive": true,
  "apiKeyId": "123e4567-e89b-12d3-a456-426614174002",
  "modelVendor": "openai",
  "modelName": "gpt-4",
  "width": 400,
  "height": 500,
  "responsive": true
}
```

**Response**:
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "teamId": "123e4567-e89b-12d3-a456-426614174001",
  "name": "Website Chat Assistant",
  "description": "An AI assistant for our website visitors",
  "welcomeMessage": "👋 How can I help you today?",
  "systemPrompt": "You are a helpful, concise assistant for our website.",
  "theme": "light",
  "position": "bottom-right",
  "primaryColor": "#04AA6D",
  "isActive": true,
  "apiKeyId": "123e4567-e89b-12d3-a456-426614174002",
  "modelVendor": "openai",
  "modelName": "gpt-4",
  "width": 400,
  "height": 500,
  "responsive": true,
  "createdAt": "2023-05-25T10:30:00Z",
  "updatedAt": "2023-05-25T10:30:00Z"
}
```

### Update Chat Embed

Updates an existing chat embed.

**Endpoint**: `PATCH /teams/{teamId}/embeds/{embedId}`

**Parameters**:
- `teamId` (path parameter): UUID of the team
- `embedId` (path parameter): UUID of the chat embed

**Request Body**:
```json
{
  "name": "Updated Chat Assistant",
  "systemPrompt": "You are a helpful, concise assistant for our product.",
  "primaryColor": "#3a86ff",
  "isActive": true
}
```

**Response**:
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "teamId": "123e4567-e89b-12d3-a456-426614174001",
  "name": "Updated Chat Assistant",
  "description": "An AI assistant for our website visitors",
  "welcomeMessage": "👋 How can I help you today?",
  "systemPrompt": "You are a helpful, concise assistant for our product.",
  "theme": "light",
  "position": "bottom-right",
  "primaryColor": "#3a86ff",
  "isActive": true,
  "apiKeyId": "123e4567-e89b-12d3-a456-426614174002",
  "modelVendor": "openai",
  "modelName": "gpt-4",
  "width": 400,
  "height": 500,
  "responsive": true,
  "createdAt": "2023-05-25T10:30:00Z",
  "updatedAt": "2023-05-25T11:15:00Z"
}
```

### Delete Chat Embed

Deletes a chat embed.

**Endpoint**: `DELETE /teams/{teamId}/embeds/{embedId}`

**Parameters**:
- `teamId` (path parameter): UUID of the team
- `embedId` (path parameter): UUID of the chat embed

**Response**:
- Status Code: 204 (No Content)

## Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Name of the chat embed |
| description | string | No | Description of the chat embed |
| welcomeMessage | string | No | Initial message shown to users |
| systemPrompt | string | No | Instructions for the AI assistant |
| theme | string | No | UI theme (light, dark, system) |
| position | string | No | Widget position (bottom-right, bottom-left, top-right, top-left) |
| primaryColor | string | No | Primary color for the widget (hex code) |
| isActive | boolean | No | Whether the embed is active (default: true) |
| apiKeyId | string | No | ID of the API key to use |
| modelVendor | string | No | AI model vendor (default: openai) |
| modelName | string | No | AI model name (default: gpt-4) |
| width | integer | No | Widget width in pixels |
| height | integer | No | Widget height in pixels |
| responsive | boolean | No | Whether the widget should be responsive (default: true) |
| settings | object | No | Additional settings (JSON object) | 