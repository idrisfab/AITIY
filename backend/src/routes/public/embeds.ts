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
    const { messages, sessionId } = req.body;
    
    if (!Array.isArray(messages) || messages.length === 0) {
      throw AppError.badRequest('Valid messages array is required');
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
    
    // Get the API key for this embed
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
        // Decrypt the API key
        try {
          apiKeyValue = decryptApiKey(apiKey.key);
          apiKeyVendor = apiKey.vendor;
        } catch (decryptError) {
          logger.error(`Error decrypting API key for embed ${embedId}:`, decryptError);
          throw AppError.internal('Error processing API key');
        }
      }
    }
    
    if (!apiKeyValue) {
      throw AppError.badRequest('No valid API key configured for this embed');
    }
    
    // Messages have already been extracted and validated above
    
    // Log the incoming request
    logger.debug(`Processing chat request for embed ${embedId} with ${messages.length} messages`);
    
    // Extract the last user message for context
    const lastUserMessage = messages.length > 0 ? messages[messages.length - 1].content : '';
    
    // In a production environment, this would call the actual AI service with the API key
    // For now, return a contextual response based on the user's message
    let responseContent = `I received your message. This is a simulated response from the ${embed.modelName} model.`;
    
    // Add some context based on the user's message
    if (lastUserMessage) {
      if (lastUserMessage.toLowerCase().includes('hello') || lastUserMessage.toLowerCase().includes('hi')) {
        responseContent = `Hello! I'm here to help. This is a simulated response from the ${embed.modelName} model.`;
      } else if (lastUserMessage.toLowerCase().includes('help')) {
        responseContent = `I'd be happy to help with that. This is a simulated response from the ${embed.modelName} model.`;
      } else if (lastUserMessage.toLowerCase().includes('thank')) {
        responseContent = `You're welcome! Let me know if you need anything else. This is a simulated response from the ${embed.modelName} model.`;
      }
    }
    
    // Return the response in the format expected by the frontend
    res.json({
      id: 'msg_' + Date.now(),
      choices: [{
        index: 0,
        message: {
          role: 'assistant',
          content: responseContent
        },
        finish_reason: 'stop'
      }]
    });
    
  } catch (error) {
    logger.error(`Error in public chat for embed: ${req.params.embedId}`, error);
    next(error);
  }
});

export default router;
