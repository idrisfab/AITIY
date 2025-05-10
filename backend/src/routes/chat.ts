import express from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import fetch from 'node-fetch';
import { decryptApiKey } from '../utils/encryption';
import { estimateChatCompletionTokens } from '../utils/tokenCounter';
import { chatCompletionLimiter } from '../middleware/rateLimit';
import { Logger } from '../utils/logger';
import { AppError } from '../utils/errors';

const router = express.Router();
const logger = Logger.getLogger('chat-routes');

// Define validation schemas
const MessageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant']),
  content: z.string()
});

const ChatCompletionRequestSchema = z.object({
  embedId: z.string().uuid(),
  sessionId: z.string(),
  messages: z.array(MessageSchema),
  stream: z.boolean().optional().default(false)
});

/**
 * Public API endpoint for chat completions
 * This does not require authentication but uses the embedId to look up
 * the appropriate configuration and API key
 */
router.post('/completions', chatCompletionLimiter, async (req, res, next) => {
  try {
    // Validate input
    const validation = ChatCompletionRequestSchema.safeParse(req.body);
    if (!validation.success) {
      logger.warn('Invalid chat completion request', {
        errors: validation.error.format(),
        ip: req.ip
      });
      
      return res.status(400).json({
        error: 'Invalid request data',
        details: validation.error.format()
      });
    }

    const { embedId, sessionId, messages, stream } = validation.data;
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';

    logger.debug('Processing chat completion request', {
      embedId,
      sessionId,
      messagesCount: messages.length,
      clientIp,
      stream
    });

    // Get the embed configuration
    const embed = await prisma.chatEmbed.findUnique({
      where: { id: embedId }
    });

    if (!embed) {
      logger.warn(`Embed not found: ${embedId}`, { sessionId, clientIp });
      throw AppError.notFound('Chat embed configuration');
    }

    // Check if embed is active
    if (!embed.isActive) {
      logger.info(`Attempt to use inactive embed: ${embedId}`, { sessionId, clientIp });
      throw AppError.forbidden('This chat widget is currently disabled');
    }

    // Check if API key is configured
    if (!embed.apiKeyId) {
      logger.error(`Missing API key for embed: ${embedId}`, { 
        teamId: embed.teamId,
        sessionId, 
        clientIp 
      });
      throw AppError.badRequest('API key not configured for this embed');
    }

    // Get API key details
    const apiKey = await prisma.apiKey.findUnique({
      where: { id: embed.apiKeyId as string }
    });

    if (!apiKey) {
      logger.error(`API key not found: ${embed.apiKeyId}`, {
        embedId,
        teamId: embed.teamId,
        sessionId, 
        clientIp
      });
      throw AppError.notFound('API key');
    }

    // Check and apply rate limits if configured in the embed settings
    if (embed.settings && typeof embed.settings === 'object') {
      const settings = embed.settings as any;
      if (settings.rateLimit && settings.rateLimit.enabled) {
        // Check if rate limit is reached for this session
        const hourAgo = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago
        const recentRequests = await prisma.chatUsage.count({
          where: {
            embedId,
            sessionId,
            createdAt: { gte: hourAgo }
          }
        });

        if (recentRequests >= settings.rateLimit.maxRequestsPerHour) {
          logger.info(`Rate limit exceeded for session: ${sessionId}`, {
            embedId,
            recentRequests,
            limit: settings.rateLimit.maxRequestsPerHour,
            clientIp
          });
          
          throw AppError.rateLimit('You have reached the maximum number of requests allowed. Please try again later.');
        }
      }
    }

    // Apply any system prompt from embed config if not already present
    const processedMessages = [...messages].map(m => ({ role: m.role, content: m.content }));
    if (embed.systemPrompt && !messages.some(m => m.role === 'system')) {
      processedMessages.unshift({
        role: 'system',
        content: embed.systemPrompt
      });
    }

    // Store all messages in chat history
    try {
      for (const message of messages) {
        await prisma.chatMessage.create({
          data: {
            embedId,
            sessionId,
            role: message.role,
            content: message.content,
            tokenCount: message.content.length // Simple approximation, will be updated later
          }
        });
      }
    } catch (error) {
      logger.error('Failed to store chat messages', error);
      // Continue processing even if message storage fails
    }

    // Estimate token usage before making the API call
    const { promptTokens, completionTokens, totalTokens } = estimateChatCompletionTokens(processedMessages);

    // Decrypt API key
    let decryptedKey;
    try {
      decryptedKey = decryptApiKey(apiKey.key);
    } catch (error) {
      logger.error('Failed to decrypt API key', error);
      throw AppError.internal('Failed to decrypt API key');
    }

    // Update API key last used time
    try {
      await prisma.apiKey.update({
        where: { id: apiKey.id },
        data: { lastUsedAt: new Date() }
      });
    } catch (error) {
      logger.warn('Failed to update API key last used time', error);
      // Continue processing even if this update fails
    }

    // Make the request to OpenAI API
    const modelName = embed.modelName || 'gpt-3.5-turbo';
    
    // Temperature from settings or default
    const temperature = embed.settings && (embed.settings as any).temperature
      ? (embed.settings as any).temperature
      : 0.7;

    // Max tokens from settings or default
    const maxTokens = embed.settings && (embed.settings as any).maxTokensPerMessage
      ? (embed.settings as any).maxTokensPerMessage
      : undefined;

    try {
      // Construct request based on vendor
      let apiResponse;
      logger.debug(`Sending request to ${apiKey.vendor} API`, {
        model: modelName,
        temperature,
        maxTokens,
        promptTokens
      });

      if (apiKey.vendor === 'openai') {
        const endpoint = 'https://api.openai.com/v1/chat/completions';
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${decryptedKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: modelName,
            messages: processedMessages,
            temperature,
            max_tokens: maxTokens,
            stream
          }),
        });

        apiResponse = await response.json();

        if (!response.ok) {
          throw AppError.apiIntegration(
            apiResponse.error?.message || `OpenAI API error: ${response.status}`, 
            response.status
          );
        }
      } else if (apiKey.vendor === 'anthropic') {
        const endpoint = 'https://api.anthropic.com/v1/messages';
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'x-api-key': decryptedKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            model: modelName,
            messages: processedMessages.map(msg => ({
              role: msg.role,
              content: msg.content
            })),
            max_tokens: maxTokens || 4000,
            temperature
          }),
        });

        apiResponse = await response.json();

        if (!response.ok) {
          throw AppError.apiIntegration(
            apiResponse.error?.message || `Anthropic API error: ${response.status}`, 
            response.status
          );
        }

        // Convert Anthropic response format to OpenAI-like format for consistent handling
        apiResponse = {
          id: apiResponse.id,
          choices: [
            {
              index: 0,
              message: {
                role: 'assistant',
                content: apiResponse.content[0].text
              },
              finish_reason: apiResponse.stop_reason
            }
          ]
        };
      } else if (apiKey.vendor === 'gemini') {
        const endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/' + modelName + ':generateContent';
        
        // Transform messages to Gemini format
        const geminiMessages = processedMessages.map(msg => ({
          role: msg.role === 'assistant' ? 'model' : msg.role,
          parts: [{ text: msg.content }]
        }));
        
        const response = await fetch(`${endpoint}?key=${decryptedKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: geminiMessages,
            generationConfig: {
              temperature,
              maxOutputTokens: maxTokens || 2048,
            }
          }),
        });

        apiResponse = await response.json();

        if (!response.ok) {
          throw AppError.apiIntegration(
            apiResponse.error?.message || `Gemini API error: ${response.status}`,
            response.status
          );
        }

        // Transform Gemini response to match OpenAI format for consistency
        apiResponse = {
          id: apiResponse.usageMetadata?.requestId || `gemini-${Date.now()}`,
          choices: [
            {
              index: 0,
              message: {
                role: 'assistant',
                content: apiResponse.candidates[0].content.parts[0].text
              },
              finish_reason: apiResponse.candidates[0].finishReason || 'stop'
            }
          ]
        };
      } else if (apiKey.vendor === 'grok') {
        // xAI's Grok API is compatible with OpenAI's API
        const endpoint = 'https://api.x.ai/v1/chat/completions';
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${decryptedKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: modelName,
            messages: processedMessages,
            temperature,
            max_tokens: maxTokens,
            stream
          }),
        });

        apiResponse = await response.json();

        if (!response.ok) {
          throw AppError.apiIntegration(
            apiResponse.error?.message || `Grok API error: ${response.status}`, 
            response.status
          );
        }
      } else {
        throw AppError.badRequest(`Unsupported API vendor: ${apiKey.vendor}`);
      }

      // Store the assistant's response in the chat history
      const assistantMessage = apiResponse.choices[0].message;
      await prisma.chatMessage.create({
        data: {
          embedId,
          sessionId,
          role: assistantMessage.role,
          content: assistantMessage.content,
          tokenCount: assistantMessage.content.length // Simple approximation
        }
      });

      // Record token usage
      try {
        await prisma.chatUsage.create({
          data: {
            embedId,
            teamId: embed.teamId,
            sessionId,
            promptTokens,
            completionTokens,
            totalTokens,
            model: modelName,
            ipAddress: clientIp
          }
        });
        
        // Increment API key usage count
        await prisma.apiKey.update({
          where: { id: apiKey.id },
          data: { usageCount: { increment: 1 } }
        });
        
      } catch (error) {
        logger.error('Failed to record chat usage or update API key count', error);
        // Continue processing even if usage recording fails
      }

      logger.info(`Chat completion successful for embed: ${embedId}`, {
        sessionId,
        model: modelName,
        promptTokens,
        completionTokens,
        totalTokens
      });

      // Return API response to client
      return res.json(apiResponse);
    } catch (error) {
      // Record failed attempt
      try {
        await prisma.chatUsage.create({
          data: {
            embedId,
            teamId: embed.teamId,
            sessionId,
            promptTokens,
            completionTokens: 0,
            totalTokens: promptTokens,
            model: modelName,
            success: false,
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            ipAddress: clientIp
          }
        });
      } catch (dbError) {
        logger.error('Failed to record failed chat usage', dbError);
      }

      logger.error('Chat completion failed', error);
      
      // Format the error response based on the error type
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          error: error.status,
          message: error.message
        });
      }
      
      // Pass unexpected errors to the global error handler
      next(error);
    }
  } catch (error) {
    logger.error('Unexpected error in chat completion endpoint', error);
    next(error);
  }
});

// Public endpoint to get embed configuration (without sensitive data)
router.get('/embed/:embedId', async (req, res) => {
  try {
    const { embedId } = req.params;

    const embed = await prisma.chatEmbed.findUnique({
      where: { id: embedId },
      select: {
        id: true,
        name: true,
        welcomeMessage: true,
        systemPrompt: true,
        theme: true,
        position: true,
        primaryColor: true,
        isActive: true,
        modelVendor: true,
        modelName: true,
        width: true,
        height: true,
        responsive: true,
        settings: true
      }
    });

    if (!embed) {
      return res.status(404).json({ error: 'Embed not found' });
    }

    // Ensure the embed is active
    if (!embed.isActive) {
      return res.status(403).json({ error: 'This chat widget is currently disabled' });
    }

    // Filter settings to remove any sensitive configuration
    const safeSettings = embed.settings ? { 
      ...(embed.settings as any),
      // Remove any sensitive fields
      rateLimit: undefined
    } : null;

    return res.json({
      ...embed,
      settings: safeSettings
    });
  } catch (error) {
    console.error('Error fetching embed:', error);
    return res.status(500).json({ error: 'Failed to fetch embed configuration' });
  }
});

export default router; 