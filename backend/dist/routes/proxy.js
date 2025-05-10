"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const errors_1 = require("../utils/errors");
const logger_1 = require("../utils/logger");
const router = express_1.default.Router();
/**
 * Proxy endpoint for chat completions to avoid CORS issues with direct API calls
 * This endpoint is public and doesn't require authentication or CSRF protection
 * It's used by the embed widget for direct API calls
 */
router.post('/chat-completion', async (req, res) => {
    try {
        // Track if we're using a fallback model due to quota limits
        let usingFallback = false;
        let fallbackReason = '';
        const { apiKey, modelName, messages, vendor: requestedVendor = 'openai', temperature = 0.7, maxTokens } = req.body;
        // Determine the actual vendor based on the API key format
        let vendor = requestedVendor;
        // Auto-detect vendor from API key format
        if (apiKey) {
            if (apiKey.startsWith('sk-ant-')) {
                vendor = 'anthropic';
            }
            else if (apiKey.startsWith('AIza')) {
                vendor = 'gemini';
            }
            else if (apiKey.startsWith('sk-')) {
                vendor = 'openai';
            }
        }
        // Check if we have a fallback API key available in environment variables
        const fallbackApiKey = process.env.FALLBACK_API_KEY;
        const fallbackVendor = process.env.FALLBACK_VENDOR || 'anthropic';
        const fallbackModel = process.env.FALLBACK_MODEL || 'claude-3-haiku-20240307';
        logger_1.logger.debug(`Auto-detected vendor: ${vendor} based on API key format`);
        if (!apiKey) {
            throw errors_1.AppError.badRequest('API key is required');
        }
        if (!modelName) {
            throw errors_1.AppError.badRequest('Model name is required');
        }
        if (!messages || !Array.isArray(messages)) {
            throw errors_1.AppError.badRequest('Messages are required and must be an array');
        }
        // Use the API key directly (no need to decrypt in this proxy endpoint)
        const decryptedKey = apiKey;
        let apiResponse;
        logger_1.logger.debug(`Proxying request to ${vendor} API`, {
            model: modelName,
            temperature,
            maxTokens,
            detectedVendor: vendor
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
                    throw errors_1.AppError.apiIntegration(apiResponse.error?.message || `OpenAI API error: ${openaiResponse.status}`, openaiResponse.status);
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
                const anthropicResult = await anthropicResponse.json();
                if (!anthropicResponse.ok) {
                    throw errors_1.AppError.apiIntegration(anthropicResult.error?.message || `Anthropic API error: ${anthropicResponse.status}`, anthropicResponse.status);
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
                // Normalize Gemini model name format
                let geminiModelName = modelName;
                // If the model name is in the format 'gemini-1.5-pro', convert it to 'gemini-1.5-pro-latest'
                if (modelName === 'gemini-1.5-pro') {
                    geminiModelName = 'gemini-1.5-pro-latest';
                }
                // If the model doesn't include the full path, add it
                if (!geminiModelName.includes('/')) {
                    geminiModelName = geminiModelName;
                }
                logger_1.logger.debug(`Using Gemini model: ${geminiModelName}`);
                const geminiEndpoint = 'https://generativelanguage.googleapis.com/v1beta/models/' + geminiModelName + ':generateContent';
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
                const geminiResult = await geminiResponse.json();
                if (!geminiResponse.ok) {
                    throw errors_1.AppError.apiIntegration(geminiResult.error?.message || `Gemini API error: ${geminiResponse.status}`, geminiResponse.status);
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
                    throw errors_1.AppError.apiIntegration(apiResponse.error?.message || `Grok API error: ${grokResponse.status}`, grokResponse.status);
                }
                break;
            default:
                throw errors_1.AppError.badRequest(`Unsupported API vendor: ${vendor}`);
        }
        // Return the response
        return res.json(apiResponse);
    }
    catch (error) {
        logger_1.logger.error('Error in proxy chat completion:', error);
        // Check if this is a quota exceeded error and we have a fallback API key
        const isQuotaError = error.statusCode === 429 ||
            (error.message && (error.message.includes('quota') ||
                error.message.includes('rate limit') ||
                error.message.includes('exceeded')));
        const fallbackApiKey = process.env.FALLBACK_API_KEY;
        const fallbackVendor = process.env.FALLBACK_VENDOR || 'anthropic';
        const fallbackModel = process.env.FALLBACK_MODEL || 'claude-3-haiku-20240307';
        if (isQuotaError && fallbackApiKey) {
            logger_1.logger.warn(`API quota exceeded. Attempting fallback to ${fallbackVendor} model ${fallbackModel}`);
            try {
                // Create a new request with the fallback configuration
                const fallbackReq = {
                    body: {
                        apiKey: fallbackApiKey,
                        modelName: fallbackModel,
                        messages: req.body.messages,
                        vendor: fallbackVendor,
                        temperature: req.body.temperature,
                        maxTokens: req.body.maxTokens
                    }
                };
                // Recursive call to the same handler with fallback configuration
                const fallbackRes = {
                    status: (code) => ({
                        json: (data) => {
                            // Add a note about using fallback
                            if (data.choices && data.choices.length > 0) {
                                const fallbackNote = '\n\n[Note: This response was generated using a fallback model due to quota limits on the primary model.]';
                                data.choices[0].message.content += fallbackNote;
                                data.usingFallback = true;
                                data.fallbackReason = 'API quota exceeded';
                            }
                            res.status(code).json(data);
                        }
                    })
                };
                // Process with fallback
                await router.stack[0].handle(fallbackReq, fallbackRes, () => { });
                return;
            }
            catch (fallbackError) {
                logger_1.logger.error('Fallback also failed:', fallbackError);
                // Continue to normal error handling if fallback fails
            }
        }
        // Return appropriate error response
        const statusCode = error.statusCode || 500;
        const message = error.message || 'Internal server error';
        res.status(statusCode).json({
            status: 'error',
            message
        });
    }
});
exports.default = router;
