import express from 'express';
import { prisma } from '../../db';
import { Logger } from '../../utils/logger';
import { AppError } from '../../utils/errors';
import { decryptApiKey } from '../../utils/encryption';

const router = express.Router();
const logger = Logger.getLogger('public-embed-routes');

// GET /api/public/embeds/:embedId - Get a specific embed for public access
router.get('/:embedId', async (req, res, next) => {
  try {
    const { embedId } = req.params;
    logger.debug(`Fetching public embed ${embedId}`);
    
    // First get the embed with basic info
    const embed = await prisma.chatEmbed.findFirst({
      where: { 
        id: embedId,
        isActive: true 
      }
    });
    
    if (!embed) {
      throw AppError.notFound('Embed not found or not active');
    }
    
    // Then get the associated API key if it exists
    let apiKeyValue = null;
    let apiKeyVendor = null;
    
    if (embed.apiKeyId) {
      const apiKey = await prisma.apiKey.findUnique({
        where: { id: embed.apiKeyId },
        select: {
          key: true,
          vendor: true
        }
      });
      
      if (apiKey) {
        // Decrypt the API key before sending it to the frontend
        try {
          apiKeyValue = decryptApiKey(apiKey.key);
          apiKeyVendor = apiKey.vendor;
        } catch (decryptError) {
          logger.error(`Error decrypting API key for embed ${embedId}:`, decryptError);
          // Don't throw the error, just don't provide the API key
          apiKeyValue = null;
        }
      }
    }
    
    // Create a sanitized version of the embed without sensitive data
    const sanitizedEmbed = {
      id: embed.id,
      name: embed.name,
      description: embed.description,
      welcomeMessage: embed.welcomeMessage,
      theme: embed.theme,
      position: embed.position,
      primaryColor: embed.primaryColor,
      width: embed.width,
      height: embed.height,
      responsive: embed.responsive,
      modelVendor: apiKeyVendor || embed.modelVendor,
      modelName: embed.modelName,
      settings: embed.settings,
      systemPrompt: embed.systemPrompt,
      // Include API key value but not the full API key object
      apiKeyValue: apiKeyValue
    };
    
    res.json(sanitizedEmbed);
  } catch (error) {
    logger.error(`Error fetching public embed: ${req.params.embedId}`, error);
    next(error);
  }
});

// POST /api/public/embeds/:embedId/chat - Send a message to the embed chat
router.post('/:embedId/chat', async (req, res, next) => {
  try {
    const { embedId } = req.params;
    const { message, sessionId } = req.body;
    
    if (!message) {
      throw AppError.badRequest('Message is required');
    }
    
    // Check if embed exists and is active
    const embed = await prisma.chatEmbed.findFirst({
      where: { 
        id: embedId,
        isActive: true 
      },
      include: {
        team: {
          select: {
            id: true
          }
        }
      }
    });
    
    if (!embed) {
      throw AppError.notFound('Embed not found or not active');
    }
    
    // In a real implementation, this would:
    // 1. Process the message using the appropriate AI model
    // 2. Store the conversation history
    // 3. Return the AI response
    
    // For now, just return a placeholder response
    res.json({
      id: 'msg_' + Date.now(),
      content: 'This is a placeholder response. The actual implementation would process your message using the configured AI model.',
      role: 'assistant',
      createdAt: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error(`Error in public chat for embed: ${req.params.embedId}`, error);
    next(error);
  }
});

export default router;
