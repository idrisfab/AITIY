import express from 'express';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

const router = express.Router();

/**
 * Proxy endpoint for chat completions to avoid CORS issues with direct API calls
 * This endpoint is public and doesn't require authentication or CSRF protection
 * It's used by the embed widget for direct API calls
 */
router.post('/chat-completion', async (req, res) => {
  try {
    const { 
      apiKey, 
      modelName, 
      messages, 
      vendor = 'openai',
      temperature = 0.7,
      maxTokens
    } = req.body;

    if (!apiKey) {
      throw AppError.badRequest('API key is required');
    }

    if (!modelName) {
      throw AppError.badRequest('Model name is required');
    }

    if (!messages || !Array.isArray(messages)) {
      throw AppError.badRequest('Messages are required and must be an array');
    }

    // Use the API key directly (no need to decrypt in this proxy endpoint)
    const decryptedKey = apiKey;
    let apiResponse: any;

    logger.debug(`Proxying request to ${vendor} API`, {
      model: modelName,
      temperature,
      maxTokens
    });

    // Handle different vendor APIs
    switch (vendor) {
      case 'openai':
        const openaiEndpoint = 'https://api.openai.com/v1/chat/completions';
        const openaiResponse = await fetch(openaiEndpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${decryptedKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: modelName,
            messages,
            temperature,
            max_tokens: maxTokens,
          }),
        });

        apiResponse = await openaiResponse.json();

        if (!openaiResponse.ok) {
          throw AppError.apiIntegration(
            apiResponse.error?.message || `OpenAI API error: ${openaiResponse.status}`, 
            openaiResponse.status
          );
        }
        break;

      case 'anthropic':
        const anthropicEndpoint = 'https://api.anthropic.com/v1/messages';
        
        // Extract system message if present
        let systemPrompt = '';
        const userAssistantMessages = messages.filter(msg => {
          if (msg.role === 'system') {
            systemPrompt = msg.content;
            return false;
          }
          return true;
        });
        
        const anthropicResponse = await fetch(anthropicEndpoint, {
          method: 'POST',
          headers: {
            'x-api-key': decryptedKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            model: modelName,
            messages: userAssistantMessages.map(msg => ({
              role: msg.role,
              content: msg.content
            })),
            system: systemPrompt,
            max_tokens: maxTokens || 4000,
            temperature
          }),
        });

        const anthropicResult: any = await anthropicResponse.json();

        if (!anthropicResponse.ok) {
          throw AppError.apiIntegration(
            anthropicResult.error?.message || `Anthropic API error: ${anthropicResponse.status}`, 
            anthropicResponse.status
          );
        }

        // Convert Anthropic response format to OpenAI-like format for consistent handling
        apiResponse = {
          id: anthropicResult.id,
          choices: [
            {
              index: 0,
              message: {
                role: 'assistant',
                content: anthropicResult.content[0].text
              },
              finish_reason: anthropicResult.stop_reason
            }
          ]
        };
        break;

      case 'gemini':
        const geminiEndpoint = 'https://generativelanguage.googleapis.com/v1beta/models/' + modelName + ':generateContent';
        
        // Extract system message if present
        let geminiSystemPrompt = '';
        const geminiUserAssistantMessages = messages.filter(msg => {
          if (msg.role === 'system') {
            geminiSystemPrompt = msg.content;
            return false;
          }
          return true;
        });
        
        // Transform messages to Gemini format
        const geminiMessages = geminiUserAssistantMessages.map(msg => ({
          role: msg.role === 'assistant' ? 'model' : msg.role,
          parts: [{ text: msg.content }]
        }));
        
        // If we have a system prompt, add it as a user message at the beginning with a special prefix
        if (geminiSystemPrompt) {
          geminiMessages.unshift({
            role: 'user',
            parts: [{ text: `System Instructions: ${geminiSystemPrompt}\n\nPlease follow the above instructions for this conversation.` }]
          });
          
          // Add a model response acknowledging the system instructions
          geminiMessages.push({
            role: 'model',
            parts: [{ text: "I will follow these instructions for our conversation." }]
          });
        }
        
        const geminiResponse = await fetch(`${geminiEndpoint}?key=${decryptedKey}`, {
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

        const geminiResult: any = await geminiResponse.json();

        if (!geminiResponse.ok) {
          throw AppError.apiIntegration(
            geminiResult.error?.message || `Gemini API error: ${geminiResponse.status}`,
            geminiResponse.status
          );
        }

        // Transform Gemini response to match OpenAI format for consistency
        apiResponse = {
          id: geminiResult.usageMetadata?.requestId || `gemini-${Date.now()}`,
          choices: [
            {
              index: 0,
              message: {
                role: 'assistant',
                content: geminiResult.candidates[0].content.parts[0].text
              },
              finish_reason: geminiResult.candidates[0].finishReason || 'stop'
            }
          ]
        };
        break;

      case 'grok':
        // xAI's Grok API is compatible with OpenAI's API
        const grokEndpoint = 'https://api.x.ai/v1/chat/completions';
        const grokResponse = await fetch(grokEndpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${decryptedKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: modelName,
            messages,
            temperature,
            max_tokens: maxTokens,
          }),
        });

        apiResponse = await grokResponse.json();

        if (!grokResponse.ok) {
          throw AppError.apiIntegration(
            apiResponse.error?.message || `Grok API error: ${grokResponse.status}`, 
            grokResponse.status
          );
        }
        break;

      default:
        throw AppError.badRequest(`Unsupported API vendor: ${vendor}`);
    }

    // Return the response
    return res.json(apiResponse);
  } catch (error) {
    logger.error('Error in proxy chat completion:', error);
    
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
