"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const db_1 = require("../../db");
const logger_1 = require("../../utils/logger");
const errors_1 = require("../../utils/errors");
const encryption_1 = require("../../utils/encryption");
const router = express_1.default.Router();
const logger = logger_1.Logger.getLogger('public-embed-routes');
// GET /api/public/embeds/:embedId - Get a specific embed for public access
router.get('/:embedId', async (req, res, next) => {
    try {
        const { embedId } = req.params;
        logger.debug(`Fetching public embed ${embedId}`);
        // First get the embed with basic info
        const embed = await db_1.prisma.chatEmbed.findFirst({
            where: {
                id: embedId,
                isActive: true
            }
        });
        if (!embed) {
            throw errors_1.AppError.notFound('Embed not found or not active');
        }
        // Then get the associated API key if it exists
        let apiKeyValue = null;
        let apiKeyVendor = null;
        if (embed.apiKeyId) {
            const apiKey = await db_1.prisma.apiKey.findUnique({
                where: { id: embed.apiKeyId },
                select: {
                    key: true,
                    vendor: true
                }
            });
            if (apiKey) {
                // Decrypt the API key before sending it to the frontend
                try {
                    apiKeyValue = (0, encryption_1.decryptApiKey)(apiKey.key);
                    apiKeyVendor = apiKey.vendor;
                }
                catch (decryptError) {
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
    }
    catch (error) {
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
            throw errors_1.AppError.badRequest('Valid messages array is required');
        }
        // Check if embed exists and is active
        const embed = await db_1.prisma.chatEmbed.findFirst({
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
            throw errors_1.AppError.notFound('Embed not found or not active');
        }
        // Get the API key for this embed
        let apiKeyValue = null;
        let apiKeyVendor = null;
        if (embed.apiKeyId) {
            const apiKey = await db_1.prisma.apiKey.findUnique({
                where: { id: embed.apiKeyId },
                select: {
                    key: true,
                    vendor: true
                }
            });
            if (apiKey) {
                // Decrypt the API key
                try {
                    apiKeyValue = (0, encryption_1.decryptApiKey)(apiKey.key);
                    apiKeyVendor = apiKey.vendor;
                }
                catch (decryptError) {
                    logger.error(`Error decrypting API key for embed ${embedId}:`, decryptError);
                    throw errors_1.AppError.internal('Error processing API key');
                }
            }
        }
        if (!apiKeyValue) {
            throw errors_1.AppError.badRequest('No valid API key configured for this embed');
        }
        // Messages have already been extracted and validated above
        // Log the incoming request
        logger.debug(`Processing chat request for embed ${embedId} with ${messages.length} messages`);
        // Now we'll actually call the AI model API with the provided API key
        logger.debug(`Calling ${apiKeyVendor} API for embed ${embedId} with model ${embed.modelName}`);
        try {
            let apiResponse;
            // Handle different vendor APIs
            switch (apiKeyVendor) {
                case 'openai':
                    const openaiEndpoint = 'https://api.openai.com/v1/chat/completions';
                    const openaiResponse = await fetch(openaiEndpoint, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${apiKeyValue}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            model: embed.modelName || 'gpt-3.5-turbo',
                            messages,
                            temperature: 0.7,
                            max_tokens: 1024,
                        }),
                    });
                    apiResponse = await openaiResponse.json();
                    if (!openaiResponse.ok) {
                        throw new Error(apiResponse.error?.message || `OpenAI API error: ${openaiResponse.status}`);
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
                            'x-api-key': apiKeyValue,
                            'anthropic-version': '2023-06-01',
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            model: embed.modelName || 'claude-3-haiku-20240307',
                            messages: userAssistantMessages,
                            system: systemPrompt,
                            max_tokens: 1024,
                            temperature: 0.7,
                        }),
                    });
                    const anthropicData = await anthropicResponse.json();
                    if (!anthropicResponse.ok) {
                        throw new Error(anthropicData.error?.message || `Anthropic API error: ${anthropicResponse.status}`);
                    }
                    // Convert Anthropic response format to OpenAI-like format for consistent handling
                    apiResponse = {
                        id: anthropicData.id,
                        choices: [{
                                index: 0,
                                message: {
                                    role: 'assistant',
                                    content: anthropicData.content[0].text
                                },
                                finish_reason: anthropicData.stop_reason || 'stop'
                            }]
                    };
                    break;
                case 'gemini':
                    // Normalize Gemini model name format
                    let geminiModelName = embed.modelName || 'gemini-1.5-pro';
                    // If the model name is in the format 'gemini-1.5-pro', convert it to 'gemini-1.5-pro-latest'
                    if (geminiModelName === 'gemini-1.5-pro') {
                        geminiModelName = 'gemini-1.5-pro-latest';
                    }
                    // Make sure we have a valid model name format
                    if (!geminiModelName.includes('/')) {
                        geminiModelName = geminiModelName;
                    }
                    logger.debug(`Using Gemini model: ${geminiModelName}`);
                    const geminiEndpoint = 'https://generativelanguage.googleapis.com/v1beta/models/' + geminiModelName + ':generateContent';
                    // Extract system prompt if present
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
                        role: msg.role === 'user' ? 'user' : 'model',
                        parts: [{ text: msg.content }]
                    }));
                    // Add system prompt as a user message if present
                    if (geminiSystemPrompt) {
                        geminiMessages.unshift({
                            role: 'user',
                            parts: [{ text: `System Instructions: ${geminiSystemPrompt}\n\nPlease follow the above instructions for this conversation.` }]
                        });
                        // Add a model response to acknowledge the system instructions
                        geminiMessages.push({
                            role: 'model',
                            parts: [{ text: 'I will follow these instructions for our conversation.' }]
                        });
                    }
                    const geminiResponse = await fetch(`${geminiEndpoint}?key=${apiKeyValue}`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            contents: geminiMessages,
                            generationConfig: {
                                temperature: 0.7,
                                maxOutputTokens: 1024,
                                topP: 0.95,
                            }
                        }),
                    });
                    const geminiResult = await geminiResponse.json();
                    if (!geminiResponse.ok) {
                        throw new Error(geminiResult.error?.message || `Gemini API error: ${geminiResponse.status}`);
                    }
                    // Transform Gemini response to match OpenAI format for consistency
                    apiResponse = {
                        id: geminiResult.usageMetadata?.requestId || `gemini-${Date.now()}`,
                        choices: [{
                                index: 0,
                                message: {
                                    role: 'assistant',
                                    content: geminiResult.candidates[0].content.parts[0].text
                                },
                                finish_reason: geminiResult.candidates[0].finishReason || 'stop'
                            }]
                    };
                    break;
                case 'grok':
                    // Implement Grok API call if needed
                    throw new Error('Grok API not implemented for embed chat');
                default:
                    throw new Error(`Unsupported vendor: ${apiKeyVendor}`);
            }
            // Return the API response to the client
            res.json(apiResponse);
        }
        catch (apiError) {
            logger.error(`Error calling AI API for embed ${embedId}:`, apiError);
            // Return a graceful error response
            res.status(500).json({
                id: 'error_' + Date.now(),
                choices: [{
                        index: 0,
                        message: {
                            role: 'assistant',
                            content: 'I apologize, but I encountered an error processing your request. Please try again later.'
                        },
                        finish_reason: 'error'
                    }]
            });
        }
    }
    catch (error) {
        logger.error(`Error in public chat for embed: ${req.params.embedId}`, error);
        next(error);
    }
});
exports.default = router;
