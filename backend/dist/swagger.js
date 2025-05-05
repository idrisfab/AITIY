"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.swaggerSpec = void 0;
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'ATTIY API Documentation',
            version: '1.0.0',
            description: 'API documentation for the ATTIY platform',
        },
        servers: [
            {
                url: process.env.API_URL || 'http://localhost:3001',
                description: 'Development server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
            schemas: {
                User: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        email: { type: 'string', format: 'email' },
                        name: { type: 'string' },
                    },
                },
                Team: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        name: { type: 'string' },
                        description: { type: 'string', nullable: true },
                    },
                },
                ApiKey: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        name: { type: 'string' },
                        key: { type: 'string' },
                        lastUsedAt: { type: 'string', format: 'date-time', nullable: true },
                    },
                },
                ChatEmbed: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        teamId: { type: 'string', format: 'uuid' },
                        name: { type: 'string' },
                        description: { type: 'string', nullable: true },
                        welcomeMessage: { type: 'string', nullable: true },
                        systemPrompt: { type: 'string', nullable: true },
                        theme: { type: 'string', enum: ['light', 'dark', 'system'], nullable: true },
                        position: {
                            type: 'string',
                            enum: ['bottom-right', 'bottom-left', 'top-right', 'top-left'],
                            nullable: true
                        },
                        primaryColor: { type: 'string', nullable: true },
                        isActive: { type: 'boolean', default: true },
                        apiKeyId: { type: 'string', nullable: true },
                        modelVendor: { type: 'string', default: 'openai', nullable: true },
                        modelName: { type: 'string', default: 'gpt-4', nullable: true },
                        width: { type: 'integer', nullable: true },
                        height: { type: 'integer', nullable: true },
                        responsive: { type: 'boolean', default: true, nullable: true },
                        settings: { type: 'object', nullable: true },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                    },
                },
                ChatEmbedInput: {
                    type: 'object',
                    required: ['name'],
                    properties: {
                        name: { type: 'string' },
                        description: { type: 'string' },
                        welcomeMessage: { type: 'string' },
                        systemPrompt: { type: 'string' },
                        theme: { type: 'string', enum: ['light', 'dark', 'system'] },
                        position: {
                            type: 'string',
                            enum: ['bottom-right', 'bottom-left', 'top-right', 'top-left']
                        },
                        primaryColor: { type: 'string' },
                        isActive: { type: 'boolean' },
                        apiKeyId: { type: 'string' },
                        modelVendor: { type: 'string' },
                        modelName: { type: 'string' },
                        width: { type: 'integer' },
                        height: { type: 'integer' },
                        responsive: { type: 'boolean' },
                        settings: { type: 'object' },
                    },
                },
            },
        },
        paths: {
            '/api/auth/register': {
                post: {
                    tags: ['Authentication'],
                    summary: 'Register a new user',
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['email', 'password', 'name'],
                                    properties: {
                                        email: { type: 'string', format: 'email' },
                                        password: { type: 'string', minLength: 8 },
                                        name: { type: 'string', minLength: 2 },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        201: {
                            description: 'User registered successfully',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            status: { type: 'string', example: 'success' },
                                            data: {
                                                type: 'object',
                                                properties: {
                                                    user: { $ref: '#/components/schemas/User' },
                                                    token: { type: 'string' },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                        409: { description: 'Email already in use' },
                    },
                },
            },
            '/api/auth/login': {
                post: {
                    tags: ['Authentication'],
                    summary: 'Login user',
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['email', 'password'],
                                    properties: {
                                        email: { type: 'string', format: 'email' },
                                        password: { type: 'string' },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        200: {
                            description: 'Login successful',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            status: { type: 'string', example: 'success' },
                                            data: {
                                                type: 'object',
                                                properties: {
                                                    user: { $ref: '#/components/schemas/User' },
                                                    token: { type: 'string' },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                        401: { description: 'Invalid credentials' },
                    },
                },
            },
            '/api/auth/forgot-password': {
                post: {
                    tags: ['Authentication'],
                    summary: 'Request password reset',
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['email'],
                                    properties: {
                                        email: { type: 'string', format: 'email' },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        200: {
                            description: 'Password reset email sent (if account exists)',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            status: { type: 'string', example: 'success' },
                                            message: { type: 'string' },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
            '/api/auth/reset-password': {
                post: {
                    tags: ['Authentication'],
                    summary: 'Reset password with token',
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['token', 'password'],
                                    properties: {
                                        token: { type: 'string' },
                                        password: { type: 'string', minLength: 8 },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        200: {
                            description: 'Password reset successful',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            status: { type: 'string', example: 'success' },
                                            message: { type: 'string' },
                                        },
                                    },
                                },
                            },
                        },
                        400: { description: 'Invalid or expired reset token' },
                    },
                },
            },
            '/api/users/me': {
                get: {
                    tags: ['Users'],
                    summary: 'Get current user profile',
                    security: [{ bearerAuth: [] }],
                    responses: {
                        200: {
                            description: 'User profile retrieved successfully',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/User' },
                                },
                            },
                        },
                        401: { description: 'Unauthorized - Invalid or missing token' },
                    },
                },
            },
            '/api/teams': {
                get: {
                    tags: ['Teams'],
                    summary: 'Get teams list',
                    security: [{ bearerAuth: [] }],
                    responses: {
                        200: {
                            description: 'Teams list retrieved successfully',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'array',
                                        items: { $ref: '#/components/schemas/Team' },
                                    },
                                },
                            },
                        },
                        401: { description: 'Unauthorized - Invalid or missing token' },
                    },
                },
            },
            '/api/api-keys': {
                get: {
                    tags: ['API Keys'],
                    summary: 'Get API keys list',
                    security: [{ bearerAuth: [] }],
                    responses: {
                        200: {
                            description: 'API keys list retrieved successfully',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'array',
                                        items: { $ref: '#/components/schemas/ApiKey' },
                                    },
                                },
                            },
                        },
                        401: { description: 'Unauthorized - Invalid or missing token' },
                    },
                },
            },
            '/api/teams/{teamId}/embeds': {
                get: {
                    tags: ['Embeds'],
                    summary: 'Get all embeds for a team',
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        {
                            name: 'teamId',
                            in: 'path',
                            required: true,
                            schema: {
                                type: 'string',
                                format: 'uuid',
                            },
                            description: 'Team ID',
                        },
                    ],
                    responses: {
                        200: {
                            description: 'List of embeds retrieved successfully',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'array',
                                        items: { $ref: '#/components/schemas/ChatEmbed' },
                                    },
                                },
                            },
                        },
                        401: { description: 'Unauthorized - Invalid or missing token' },
                        403: { description: 'Forbidden - User is not a member of the team' },
                    },
                },
                post: {
                    tags: ['Embeds'],
                    summary: 'Create a new chat embed for a team',
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        {
                            name: 'teamId',
                            in: 'path',
                            required: true,
                            schema: {
                                type: 'string',
                                format: 'uuid',
                            },
                            description: 'Team ID',
                        },
                    ],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/ChatEmbedInput' },
                            },
                        },
                    },
                    responses: {
                        201: {
                            description: 'Chat embed created successfully',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/ChatEmbed' },
                                },
                            },
                        },
                        400: { description: 'Invalid input - Name is required' },
                        401: { description: 'Unauthorized - Invalid or missing token' },
                        403: { description: 'Forbidden - User is not a member of the team' },
                    },
                },
            },
            '/api/teams/{teamId}/embeds/{embedId}': {
                get: {
                    tags: ['Embeds'],
                    summary: 'Get a specific chat embed',
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        {
                            name: 'teamId',
                            in: 'path',
                            required: true,
                            schema: {
                                type: 'string',
                                format: 'uuid',
                            },
                            description: 'Team ID',
                        },
                        {
                            name: 'embedId',
                            in: 'path',
                            required: true,
                            schema: {
                                type: 'string',
                                format: 'uuid',
                            },
                            description: 'Embed ID',
                        },
                    ],
                    responses: {
                        200: {
                            description: 'Chat embed retrieved successfully',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/ChatEmbed' },
                                },
                            },
                        },
                        401: { description: 'Unauthorized - Invalid or missing token' },
                        403: { description: 'Forbidden - User is not a member of the team' },
                        404: { description: 'Embed not found' },
                    },
                },
                patch: {
                    tags: ['Embeds'],
                    summary: 'Update a chat embed',
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        {
                            name: 'teamId',
                            in: 'path',
                            required: true,
                            schema: {
                                type: 'string',
                                format: 'uuid',
                            },
                            description: 'Team ID',
                        },
                        {
                            name: 'embedId',
                            in: 'path',
                            required: true,
                            schema: {
                                type: 'string',
                                format: 'uuid',
                            },
                            description: 'Embed ID',
                        },
                    ],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/ChatEmbedInput' },
                            },
                        },
                    },
                    responses: {
                        200: {
                            description: 'Chat embed updated successfully',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/ChatEmbed' },
                                },
                            },
                        },
                        401: { description: 'Unauthorized - Invalid or missing token' },
                        403: { description: 'Forbidden - User is not a member of the team' },
                        404: { description: 'Embed not found' },
                    },
                },
                delete: {
                    tags: ['Embeds'],
                    summary: 'Delete a chat embed',
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        {
                            name: 'teamId',
                            in: 'path',
                            required: true,
                            schema: {
                                type: 'string',
                                format: 'uuid',
                            },
                            description: 'Team ID',
                        },
                        {
                            name: 'embedId',
                            in: 'path',
                            required: true,
                            schema: {
                                type: 'string',
                                format: 'uuid',
                            },
                            description: 'Embed ID',
                        },
                    ],
                    responses: {
                        204: { description: 'Chat embed deleted successfully' },
                        401: { description: 'Unauthorized - Invalid or missing token' },
                        403: { description: 'Forbidden - User is not a member of the team' },
                        404: { description: 'Embed not found' },
                    },
                },
            },
        },
    },
    apis: ['./src/routes/*.ts'], // Path to the API routes
};
exports.swaggerSpec = (0, swagger_jsdoc_1.default)(options);
