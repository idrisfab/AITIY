"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const db_1 = require("../db");
const zod_1 = require("zod");
const logger_1 = require("../utils/logger");
const sanitization_1 = require("../middleware/sanitization");
const accessControl_1 = require("../middleware/accessControl");
const errors_1 = require("../utils/errors");
const client_1 = require("@prisma/client");
const router = express_1.default.Router({ mergeParams: true });
const logger = logger_1.Logger.getLogger('embed-routes');
// Define validation schemas
const EmbedThemeSchema = zod_1.z.enum(['light', 'dark', 'system']).optional();
const EmbedPositionSchema = zod_1.z.enum(['bottom-right', 'bottom-left', 'top-right', 'top-left']).optional();
const ChatEmbedSettingsSchema = zod_1.z.object({
    allowAttachments: zod_1.z.boolean().default(false).optional(),
    requireUserEmail: zod_1.z.boolean().default(true).optional(),
    showBranding: zod_1.z.boolean().default(true).optional(),
    customCss: zod_1.z.string().max(2000).optional(),
    maxTokensPerMessage: zod_1.z.number().min(100).max(4000).optional(),
    temperature: zod_1.z.number().min(0).max(2).optional(),
    messageHistory: zod_1.z.number().min(1).max(50).optional(),
    customFontFamily: zod_1.z.string().max(100).optional(),
    customHeaderText: zod_1.z.string().max(100).optional(),
    customPlaceholderText: zod_1.z.string().max(100).optional(),
    showTypingIndicator: zod_1.z.boolean().default(true).optional(),
    enableMarkdown: zod_1.z.boolean().default(true).optional(),
    enableCodeHighlighting: zod_1.z.boolean().default(true).optional(),
    enableEmoji: zod_1.z.boolean().default(true).optional(),
    rateLimit: zod_1.z.object({
        maxRequestsPerHour: zod_1.z.number().min(1).max(1000),
        enabled: zod_1.z.boolean()
    }).optional()
}).optional();
const ChatEmbedInputSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100),
    description: zod_1.z.string().max(500).optional(),
    welcomeMessage: zod_1.z.string().max(500).optional(),
    systemPrompt: zod_1.z.string().max(2000).optional(),
    theme: EmbedThemeSchema,
    position: EmbedPositionSchema,
    primaryColor: zod_1.z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    isActive: zod_1.z.boolean().optional(),
    apiKeyId: zod_1.z.string().optional(),
    modelVendor: zod_1.z.string().default('openai').optional(),
    modelName: zod_1.z.string().default('gpt-4').optional(),
    width: zod_1.z.number().min(200).max(1200).optional(),
    height: zod_1.z.number().min(200).max(1200).optional(),
    responsive: zod_1.z.boolean().default(true).optional(),
    settings: ChatEmbedSettingsSchema
});
const ChatEmbedUpdateSchema = ChatEmbedInputSchema.partial();
// All routes protected
router.use(auth_1.protect);
// GET /api/teams/:teamId/embeds - List all embeds for a team
router.get('/:teamId/embeds', (0, accessControl_1.requireResourcePermission)(accessControl_1.ResourceType.TEAM, req => req.params.teamId, accessControl_1.PermissionLevel.READ), async (req, res, next) => {
    try {
        const { teamId } = req.params;
        logger.debug(`Fetching embeds for team: ${teamId}`);
        const embeds = await db_1.prisma.chatEmbed.findMany({
            where: { teamId },
            orderBy: { createdAt: 'desc' },
        });
        res.json(embeds);
    }
    catch (error) {
        logger.error('Error fetching embeds', error);
        next(error);
    }
});
// GET /api/teams/:teamId/embeds/:embedId - Get a specific embed
router.get('/:teamId/embeds/:embedId', (0, accessControl_1.requireResourcePermission)(accessControl_1.ResourceType.CHAT_EMBED, req => req.params.embedId, accessControl_1.PermissionLevel.READ), async (req, res, next) => {
    try {
        const { teamId, embedId } = req.params;
        logger.debug(`Fetching embed ${embedId} for team ${teamId}`);
        const embed = await db_1.prisma.chatEmbed.findFirst({
            where: { id: embedId, teamId },
        });
        if (!embed) {
            throw errors_1.AppError.notFound('Embed');
        }
        res.json(embed);
    }
    catch (error) {
        logger.error(`Error fetching embed: ${req.params.embedId}`, error);
        next(error);
    }
});
// POST /api/teams/:teamId/embeds - Create a new embed
router.post('/:teamId/embeds', (0, accessControl_1.requireResourcePermission)(accessControl_1.ResourceType.TEAM, req => req.params.teamId, accessControl_1.PermissionLevel.WRITE), (0, sanitization_1.validateAndSanitize)(ChatEmbedInputSchema), async (req, res, next) => {
    const { teamId } = req.params;
    try {
        const validatedData = req.body; // Type assertion for safety
        // Ensure name is provided (double-check after validation)
        if (!validatedData.name) {
            logger.warn('Embed creation attempt without name after validation', { teamId, userId: req.user.id });
            throw errors_1.AppError.badRequest('Embed name is required.');
        }
        // Create embed using Prisma Client
        const newEmbed = await db_1.prisma.chatEmbed.create({
            data: {
                teamId: teamId,
                name: validatedData.name,
                description: validatedData.description,
                welcomeMessage: validatedData.welcomeMessage,
                systemPrompt: validatedData.systemPrompt,
                theme: validatedData.theme,
                position: validatedData.position,
                primaryColor: validatedData.primaryColor,
                isActive: validatedData.isActive ?? true,
                apiKeyId: validatedData.apiKeyId,
                modelVendor: validatedData.modelVendor || 'openai',
                modelName: validatedData.modelName || 'gpt-4',
                width: validatedData.width,
                height: validatedData.height,
                responsive: validatedData.responsive ?? true,
                settings: validatedData.settings ? validatedData.settings : undefined, // Pass settings object or undefined
            }
        });
        logger.info(`New embed created: ${newEmbed.id}`, {
            teamId,
            userId: req.user.id,
            embedName: newEmbed.name
        });
        res.status(201).json(newEmbed);
    }
    catch (error) {
        // Handle potential Prisma unique constraint errors (e.g., duplicate name for team)
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            logger.warn('Failed to create embed due to unique constraint', {
                teamId,
                userId: req.user.id,
                target: error.meta?.target
            });
            // Assuming the constraint is on name + teamId
            if (Array.isArray(error.meta?.target) && error.meta.target.includes('name')) {
                return next(errors_1.AppError.conflict('An embed with this name already exists for this team.'));
            }
        }
        logger.error('Error creating embed', { error, teamId, userId: req.user.id });
        next(error);
    }
});
// PATCH /api/teams/:teamId/embeds/:embedId - Update an embed
router.patch('/:teamId/embeds/:embedId', (0, accessControl_1.requireResourcePermission)(accessControl_1.ResourceType.CHAT_EMBED, req => req.params.embedId, accessControl_1.PermissionLevel.WRITE), (0, sanitization_1.validateAndSanitize)(ChatEmbedUpdateSchema), async (req, res, next) => {
    try {
        const { teamId, embedId } = req.params;
        const validatedData = req.body;
        // Check if embed exists and belongs to the team
        const existingEmbed = await db_1.prisma.chatEmbed.findFirst({
            where: { id: embedId, teamId },
        });
        if (!existingEmbed) {
            throw errors_1.AppError.notFound('Embed');
        }
        // If apiKeyId is provided, verify the user has permission to use it
        if (validatedData.apiKeyId) {
            const hasKeyPermission = await db_1.prisma.apiKey.findFirst({
                where: {
                    id: validatedData.apiKeyId,
                    userId: req.user.id
                }
            });
            if (!hasKeyPermission) {
                throw errors_1.AppError.forbidden('You do not have permission to use this API key');
            }
        }
        // with keys from validatedData
        const updateData = {};
        // Add validated fields to the update data
        Object.keys(validatedData).forEach(key => {
            if (key === 'settings' && typeof validatedData.settings === 'object' && validatedData.settings !== null) {
                // Merge incoming settings with existing settings
                updateData[key] = {
                    ...(existingEmbed.settings || {}),
                    ...validatedData.settings
                };
            }
            else if (validatedData[key] !== undefined) {
                // Only include defined fields to avoid overwriting with undefined
                // @ts-ignore - we know these fields exist on ChatEmbed
                updateData[key] = validatedData[key];
            }
        });
        // Ensure settings is valid JSON if present
        if (updateData.settings && typeof updateData.settings !== 'object') {
            try {
                updateData.settings = JSON.parse(updateData.settings);
            }
            catch (e) {
                throw errors_1.AppError.badRequest('Invalid format for settings field.');
            }
        }
        // Update the embed with the validated data
        const embed = await db_1.prisma.chatEmbed.update({
            where: { id: embedId },
            data: updateData
        });
        logger.info(`Embed updated: ${embedId}`, {
            teamId,
            userId: req.user.id,
            fieldsUpdated: Object.keys(validatedData)
        });
        res.json(embed);
    }
    catch (error) {
        logger.error(`Error updating embed: ${req.params.embedId}`, error);
        next(error);
    }
});
// DELETE /api/teams/:teamId/embeds/:embedId - Delete an embed
router.delete('/:teamId/embeds/:embedId', (0, accessControl_1.requireResourcePermission)(accessControl_1.ResourceType.CHAT_EMBED, req => req.params.embedId, accessControl_1.PermissionLevel.ADMIN), async (req, res, next) => {
    try {
        const { teamId, embedId } = req.params;
        await db_1.prisma.chatEmbed.delete({
            where: { id: embedId },
        });
        logger.info(`Embed deleted: ${embedId}`, {
            teamId,
            userId: req.user.id
        });
        res.status(204).send();
    }
    catch (error) {
        logger.error(`Error deleting embed: ${req.params.embedId}`, error);
        next(error);
    }
});
exports.default = router;
