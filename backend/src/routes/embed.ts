
import express from 'express';
import { protect } from '../middleware/auth';
import { prisma } from '../db';
import { z } from 'zod';
import crypto from 'crypto';
import { Logger } from '../utils/logger';
import { validateAndSanitize } from '../middleware/sanitization';
import { ResourceType, PermissionLevel, requireResourcePermission } from '../middleware/accessControl';
import { AppError } from '../utils/errors';
import { Prisma } from '@prisma/client';

const router = express.Router({ mergeParams: true });
const logger = Logger.getLogger('embed-routes');

// Define validation schemas
const EmbedThemeSchema = z.enum(['light', 'dark', 'system']).optional();
const EmbedPositionSchema = z.enum(['bottom-right', 'bottom-left', 'top-right', 'top-left']).optional();

const ChatEmbedSettingsSchema = z.object({
  allowAttachments: z.boolean().default(false).optional(),
  requireUserEmail: z.boolean().default(true).optional(),
  showBranding: z.boolean().default(true).optional(),
  customCss: z.string().max(2000).optional(),
  maxTokensPerMessage: z.number().min(100).max(4000).optional(),
  temperature: z.number().min(0).max(2).optional(),
  messageHistory: z.number().min(1).max(50).optional(),
  customFontFamily: z.string().max(100).optional(),
  customHeaderText: z.string().max(100).optional(),
  customPlaceholderText: z.string().max(100).optional(),
  showTypingIndicator: z.boolean().default(true).optional(),
  enableMarkdown: z.boolean().default(true).optional(),
  enableCodeHighlighting: z.boolean().default(true).optional(),
  enableEmoji: z.boolean().default(true).optional(),
  rateLimit: z.object({
    maxRequestsPerHour: z.number().min(1).max(1000),
    enabled: z.boolean()
  }).optional()
}).optional();

const ChatEmbedInputSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  welcomeMessage: z.string().max(500).optional(),
  systemPrompt: z.string().max(2000).optional(),
  theme: EmbedThemeSchema,
  position: EmbedPositionSchema,
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  isActive: z.boolean().optional(),
  apiKeyId: z.string().optional(),
  modelVendor: z.string().default('openai').optional(),
  modelName: z.string().default('gpt-4').optional(),
  width: z.number().min(200).max(1200).optional(),
  height: z.number().min(200).max(1200).optional(),
  responsive: z.boolean().default(true).optional(),
  settings: ChatEmbedSettingsSchema
});

const ChatEmbedUpdateSchema = ChatEmbedInputSchema.partial();

// All routes protected
router.use(protect);

// GET /api/teams/:teamId/embeds - List all embeds for a team
router.get('/:teamId/embeds', 
  requireResourcePermission(
    ResourceType.TEAM, 
    req => req.params.teamId, 
    PermissionLevel.READ
  ),
  async (req: any, res, next) => {
    try {
      const { teamId } = req.params;
      logger.debug(`Fetching embeds for team: ${teamId}`);
      
      const embeds = await prisma.chatEmbed.findMany({
        where: { teamId },
        orderBy: { createdAt: 'desc' },
      });
      
      res.json(embeds);
    } catch (error) {
      logger.error('Error fetching embeds', error);
      next(error);
    }
  }
);

// GET /api/teams/:teamId/embeds/:embedId - Get a specific embed
router.get('/:teamId/embeds/:embedId', 
  requireResourcePermission(
    ResourceType.CHAT_EMBED, 
    req => req.params.embedId, 
    PermissionLevel.READ
  ),
  async (req: any, res, next) => {
    try {
      const { teamId, embedId } = req.params;
      logger.debug(`Fetching embed ${embedId} for team ${teamId}`);
      
      const embed = await prisma.chatEmbed.findFirst({
        where: { id: embedId, teamId },
      });
      
      if (!embed) {
        throw AppError.notFound('Embed');
      }
      
      res.json(embed);
    } catch (error) {
      logger.error(`Error fetching embed: ${req.params.embedId}`, error);
      next(error);
    }
  }
);

// POST /api/teams/:teamId/embeds - Create a new embed
router.post('/:teamId/embeds', 
  requireResourcePermission(
    ResourceType.TEAM, 
    req => req.params.teamId, 
    PermissionLevel.WRITE
  ),
  validateAndSanitize(ChatEmbedInputSchema),
  async (req: any, res, next) => {
    const { teamId } = req.params;
    try {
      const validatedData = req.body as z.infer<typeof ChatEmbedInputSchema>; // Type assertion for safety
      
      // Ensure name is provided (double-check after validation)
      if (!validatedData.name) {
         logger.warn('Embed creation attempt without name after validation', { teamId, userId: req.user.id });
         throw AppError.badRequest('Embed name is required.');
      }

      // Create embed using Prisma Client
      const newEmbed = await prisma.chatEmbed.create({
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
    } catch (error) {
      // Handle potential Prisma unique constraint errors (e.g., duplicate name for team)
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        logger.warn('Failed to create embed due to unique constraint', {
          teamId,
          userId: req.user.id,
          target: error.meta?.target
        });
        // Assuming the constraint is on name + teamId
        if (Array.isArray(error.meta?.target) && error.meta.target.includes('name')) {
           return next(AppError.conflict('An embed with this name already exists for this team.'));
        }
      }
      logger.error('Error creating embed', { error, teamId, userId: req.user.id });
      next(error);
    }
  }
);

// PATCH /api/teams/:teamId/embeds/:embedId - Update an embed
router.patch('/:teamId/embeds/:embedId', 
  requireResourcePermission(
    ResourceType.CHAT_EMBED, 
    req => req.params.embedId, 
    PermissionLevel.WRITE
  ),
  validateAndSanitize(ChatEmbedUpdateSchema),
  async (req: any, res, next) => {
    try {
      const { teamId, embedId } = req.params;
      const validatedData = req.body;

      // Check if embed exists and belongs to the team
      const existingEmbed = await prisma.chatEmbed.findFirst({
        where: { id: embedId, teamId },
      });
      
      if (!existingEmbed) {
        throw AppError.notFound('Embed');
      }

      // If apiKeyId is provided, verify the user has permission to use it
      if (validatedData.apiKeyId) {
        const hasKeyPermission = await prisma.apiKey.findFirst({
          where: {
            id: validatedData.apiKeyId,
            userId: req.user.id
          }
        });
        
        if (!hasKeyPermission) {
          throw AppError.forbidden('You do not have permission to use this API key');
        }
      }

      // with keys from validatedData
      const updateData: Record<string, any> = {};
      
      // Add validated fields to the update data
      Object.keys(validatedData).forEach(key => {
        if (key === 'settings' && typeof validatedData.settings === 'object' && validatedData.settings !== null) {
          // Merge incoming settings with existing settings
          updateData[key] = { 
            ...(existingEmbed.settings as object || {}), 
            ...validatedData.settings 
          };
        } else if (validatedData[key] !== undefined) {
          // Only include defined fields to avoid overwriting with undefined
          // @ts-ignore - we know these fields exist on ChatEmbed
          updateData[key] = validatedData[key];
        }
      });

      // Ensure settings is valid JSON if present
      if (updateData.settings && typeof updateData.settings !== 'object') {
        try {
          updateData.settings = JSON.parse(updateData.settings);
        } catch (e) {
          throw AppError.badRequest('Invalid format for settings field.');
        }
      }

      // Update the embed with the validated data
      const embed = await prisma.chatEmbed.update({
        where: { id: embedId },
        data: updateData as any
      });
      
      logger.info(`Embed updated: ${embedId}`, {
        teamId,
        userId: req.user.id,
        fieldsUpdated: Object.keys(validatedData)
      });
      
      res.json(embed);
    } catch (error) {
      logger.error(`Error updating embed: ${req.params.embedId}`, error);
      next(error);
    }
  }
);

// DELETE /api/teams/:teamId/embeds/:embedId - Delete an embed
router.delete('/:teamId/embeds/:embedId', 
  requireResourcePermission(
    ResourceType.CHAT_EMBED, 
    req => req.params.embedId, 
    PermissionLevel.ADMIN
  ),
  async (req: any, res, next) => {
    try {
      const { teamId, embedId } = req.params;

      await prisma.chatEmbed.delete({
        where: { id: embedId },
      });
      
      logger.info(`Embed deleted: ${embedId}`, {
        teamId,
        userId: req.user.id
      });
      
      res.status(204).send();
    } catch (error) {
      logger.error(`Error deleting embed: ${req.params.embedId}`, error);
      next(error);
    }
  }
);

export default router; 