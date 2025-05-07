"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const client_1 = require("@prisma/client");
const node_fetch_1 = __importDefault(require("node-fetch"));
const encryption_1 = require("../utils/encryption");
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
// Protected routes
router.use(auth_1.protect);
// Get all available models from all vendors
router.get('/', async (req, res) => {
    try {
        // Get models from all vendors using hardcoded fallbacks
        const openaiModels = [
            {
                id: 'gpt-4',
                name: 'GPT-4',
                vendor: 'openai',
                capabilities: ['Text generation'],
                contextWindow: 8192,
                category: 'GPT-4',
                pricingTier: 'Premium',
                deprecated: false,
                defaultModel: false
            },
            {
                id: 'gpt-4-turbo',
                name: 'GPT-4 Turbo',
                vendor: 'openai',
                capabilities: ['Text generation'],
                contextWindow: 128000,
                category: 'GPT-4',
                pricingTier: 'Premium',
                deprecated: false,
                defaultModel: false
            },
            {
                id: 'gpt-3.5-turbo',
                name: 'GPT-3.5 Turbo',
                vendor: 'openai',
                capabilities: ['Text generation'],
                contextWindow: 16384,
                category: 'GPT-3.5',
                pricingTier: 'Standard',
                deprecated: false,
                defaultModel: true
            }
        ];
        const anthropicModels = [
            {
                id: 'claude-3-opus-20240229',
                name: 'Claude 3 Opus',
                vendor: 'anthropic',
                capabilities: ['Text generation'],
                contextWindow: 200000,
                category: 'Claude 3',
                pricingTier: 'Premium',
                deprecated: false,
                defaultModel: false
            },
            {
                id: 'claude-3-sonnet-20240229',
                name: 'Claude 3 Sonnet',
                vendor: 'anthropic',
                capabilities: ['Text generation'],
                contextWindow: 200000,
                category: 'Claude 3',
                pricingTier: 'Standard',
                deprecated: false,
                defaultModel: true
            },
            {
                id: 'claude-3-haiku-20240307',
                name: 'Claude 3 Haiku',
                vendor: 'anthropic',
                capabilities: ['Text generation'],
                contextWindow: 200000,
                category: 'Claude 3',
                pricingTier: 'Basic',
                deprecated: false,
                defaultModel: false
            }
        ];
        const geminiModels = [
            {
                id: 'gemini-1.5-pro',
                name: 'Gemini 1.5 Pro',
                vendor: 'gemini',
                capabilities: ['Text generation'],
                contextWindow: 1000000,
                category: 'Gemini 1.5',
                pricingTier: 'Premium',
                deprecated: false,
                defaultModel: true
            },
            {
                id: 'gemini-1.5-flash',
                name: 'Gemini 1.5 Flash',
                vendor: 'gemini',
                capabilities: ['Text generation'],
                contextWindow: 1000000,
                category: 'Gemini 1.5',
                pricingTier: 'Standard',
                deprecated: false,
                defaultModel: false
            },
            {
                id: 'gemini-1.0-pro',
                name: 'Gemini 1.0 Pro',
                vendor: 'gemini',
                capabilities: ['Text generation'],
                contextWindow: 32768,
                category: 'Gemini 1.0',
                pricingTier: 'Standard',
                deprecated: false,
                defaultModel: false
            }
        ];
        const grokModels = [
            {
                id: 'grok-3',
                name: 'Grok 3',
                vendor: 'grok',
                capabilities: ['Text generation'],
                contextWindow: 128000,
                category: 'Grok',
                pricingTier: 'Premium',
                deprecated: false,
                defaultModel: true
            },
            {
                id: 'grok-2',
                name: 'Grok 2',
                vendor: 'grok',
                capabilities: ['Text generation'],
                contextWindow: 128000,
                category: 'Grok',
                pricingTier: 'Standard',
                deprecated: false,
                defaultModel: false
            }
        ];
        // Combine all models
        const allModels = [...openaiModels, ...anthropicModels, ...geminiModels, ...grokModels];
        // Return the models
        res.json(allModels);
    }
    catch (error) {
        console.error('Error fetching all models:', error);
        res.status(500).json({ error: 'Failed to fetch models' });
    }
});
// Fetch available models for a specific API key
router.get('/:apiKeyId', async (req, res) => {
    try {
        const { apiKeyId } = req.params;
        // Fetch the API key
        const apiKey = await prisma.apiKey.findFirst({
            where: {
                id: apiKeyId,
                userId: req.user.id
            }
        });
        if (!apiKey) {
            return res.status(404).json({ error: 'API key not found' });
        }
        // Decrypt the API key
        const decryptedKey = (0, encryption_1.decryptApiKey)(apiKey.key);
        // Update last used timestamp
        await prisma.apiKey.update({
            where: { id: apiKeyId },
            data: { lastUsedAt: new Date() }
        });
        let models = [];
        // Fetch models based on vendor
        switch (apiKey.vendor) {
            case 'openai':
                models = await fetchOpenAIModels(decryptedKey);
                break;
            case 'anthropic':
                models = await fetchAnthropicModels(decryptedKey);
                break;
            case 'gemini':
                models = await fetchGeminiModels(decryptedKey);
                break;
            case 'grok':
                models = await fetchGrokModels(decryptedKey);
                break;
            default:
                return res.status(400).json({ error: 'Unsupported vendor' });
        }
        // Return the models
        res.json(models);
    }
    catch (error) {
        console.error('Error fetching models:', error);
        res.status(500).json({ error: 'Failed to fetch models' });
    }
});
// Fetch OpenAI models
async function fetchOpenAIModels(apiKey) {
    try {
        const response = await (0, node_fetch_1.default)('https://api.openai.com/v1/models', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error?.message || 'Failed to fetch OpenAI models');
        }
        const models = data.data;
        // Filter and transform models
        const filteredModels = models
            .filter(model => 
        // Only include chat models - those that can be used with chat/completions
        model.id.includes('gpt') ||
            model.id.includes('turbo') ||
            model.id.includes('instruct'));
        // Deduplicate models by their base ID (removing date suffixes)
        const modelMap = new Map();
        for (const model of filteredModels) {
            // Extract base model ID by removing date suffixes
            const baseModelId = model.id.replace(/-\d{6}$/, '');
            // If we haven't seen this base model ID yet, or if this is a newer version
            // of a model we've already seen, add/update it in our map
            if (!modelMap.has(baseModelId) || model.created > modelMap.get(baseModelId).created) {
                modelMap.set(baseModelId, model);
            }
        }
        // Convert the deduplicated map back to an array and transform
        return Array.from(modelMap.values()).map(model => {
            const modelId = model.id;
            const deprecated = modelId.includes('0301') ||
                modelId.includes('0613') ||
                modelId.includes('0314');
            // Determine category
            let category = 'Other';
            if (modelId.includes('gpt-4')) {
                category = 'GPT-4';
            }
            else if (modelId.includes('gpt-3.5')) {
                category = 'GPT-3.5';
            }
            // Determine context window
            let contextWindow = 4096; // Default
            if (modelId.includes('16k')) {
                contextWindow = 16384;
            }
            else if (modelId.includes('32k')) {
                contextWindow = 32768;
            }
            else if (modelId.includes('128k')) {
                contextWindow = 128000;
            }
            // List capabilities
            const capabilities = ['Text generation'];
            if (modelId.includes('vision')) {
                capabilities.push('Image understanding');
            }
            // Determine pricing tier
            let pricingTier = 'Standard';
            if (modelId.includes('gpt-4')) {
                pricingTier = 'Premium';
            }
            return {
                id: modelId,
                name: getPrettyModelName(modelId),
                vendor: 'openai',
                capabilities,
                contextWindow,
                category,
                pricingTier,
                deprecated,
                defaultModel: modelId === 'gpt-3.5-turbo'
            };
        })
            .sort((a, b) => {
            // Sort by category first, then by deprecated status
            if (a.category !== b.category) {
                return a.category === 'GPT-4' ? -1 : 1;
            }
            if (a.deprecated !== b.deprecated) {
                return a.deprecated ? 1 : -1;
            }
            return a.name.localeCompare(b.name);
        });
    }
    catch (error) {
        console.error('Error fetching OpenAI models:', error);
        // Return hardcoded fallback models if API fails
        return [
            {
                id: 'gpt-4',
                name: 'GPT-4',
                vendor: 'openai',
                capabilities: ['Text generation'],
                contextWindow: 8192,
                category: 'GPT-4',
                pricingTier: 'Premium',
                deprecated: false,
                defaultModel: false
            },
            {
                id: 'gpt-4-turbo',
                name: 'GPT-4 Turbo',
                vendor: 'openai',
                capabilities: ['Text generation'],
                contextWindow: 128000,
                category: 'GPT-4',
                pricingTier: 'Premium',
                deprecated: false,
                defaultModel: false
            },
            {
                id: 'gpt-3.5-turbo',
                name: 'GPT-3.5 Turbo',
                vendor: 'openai',
                capabilities: ['Text generation'],
                contextWindow: 16384,
                category: 'GPT-3.5',
                pricingTier: 'Standard',
                deprecated: false,
                defaultModel: true
            }
        ];
    }
}
// Fetch Anthropic models
async function fetchAnthropicModels(apiKey) {
    try {
        // Try to fetch models from Anthropic API
        try {
            const response = await (0, node_fetch_1.default)('https://api.anthropic.com/v1/models', {
                method: 'GET',
                headers: {
                    'x-api-key': apiKey,
                    'anthropic-version': '2023-06-01',
                    'Content-Type': 'application/json',
                },
            });
            if (response.ok) {
                const data = await response.json();
                if (data && data.models && Array.isArray(data.models)) {
                    return data.models.map((model) => {
                        // Parse the model info from the name
                        const parts = model.name.split('-');
                        const version = parts[1] || '';
                        const variant = parts[2] || '';
                        return {
                            id: model.name,
                            name: `Claude ${version.charAt(0).toUpperCase() + version.slice(1)} ${variant.charAt(0).toUpperCase() + variant.slice(1)}`,
                            vendor: 'anthropic',
                            capabilities: ['Text generation'],
                            contextWindow: model.context_window || 200000,
                            description: model.description || `Claude ${version} ${variant} model`,
                            category: `Claude ${version.charAt(0).toUpperCase() + version.slice(1)}`,
                            pricingTier: variant === 'opus' ? 'Premium' : variant === 'sonnet' ? 'Standard' : 'Basic',
                            deprecated: false,
                            defaultModel: model.name.includes('sonnet')
                        };
                    });
                }
            }
        }
        catch (apiError) {
            console.error('Error fetching from Anthropic API:', apiError);
            // Fall back to hardcoded values if API call fails
        }
        // Fallback to hardcoded values
        const anthropicModels = [
            {
                name: 'claude-3-opus-20240229',
                description: 'Most powerful model for highly complex tasks',
                context_window: 200000,
                default: false
            },
            {
                name: 'claude-3-sonnet-20240229',
                description: 'Ideal balance of intelligence and speed',
                context_window: 200000,
                default: true
            },
            {
                name: 'claude-3-haiku-20240307',
                description: 'Fastest and most compact model for near-instant responsiveness',
                context_window: 200000,
                default: false
            }
        ];
        return anthropicModels.map(model => {
            // Parse the model info from the name
            const parts = model.name.split('-');
            const version = parts[1];
            const variant = parts[2];
            return {
                id: model.name,
                name: `Claude ${version.charAt(0).toUpperCase() + version.slice(1)} ${variant.charAt(0).toUpperCase() + variant.slice(1)}`,
                vendor: 'anthropic',
                capabilities: ['Text generation'],
                contextWindow: model.context_window,
                description: model.description,
                category: `Claude ${version.charAt(0).toUpperCase() + version.slice(1)}`,
                pricingTier: variant === 'opus' ? 'Premium' : variant === 'sonnet' ? 'Standard' : 'Basic',
                deprecated: false,
                defaultModel: model.default
            };
        });
    }
    catch (error) {
        console.error('Error processing Anthropic models:', error);
        return [
            {
                id: 'claude-3-sonnet-20240229',
                name: 'Claude 3 Sonnet',
                vendor: 'anthropic',
                capabilities: ['Text generation'],
                contextWindow: 200000,
                description: 'Ideal balance of intelligence and speed',
                category: 'Claude 3',
                pricingTier: 'Standard',
                deprecated: false,
                defaultModel: true
            }
        ];
    }
}
// Fetch Google Gemini models
async function fetchGeminiModels(apiKey) {
    try {
        // Google Gemini API doesn't have a public models endpoint yet, so we use hardcoded values
        const geminiModels = [
            {
                name: 'gemini-1.5-pro',
                description: 'Most capable Gemini model for highly complex tasks',
                context_window: 1000000,
                default: true
            },
            {
                name: 'gemini-1.5-flash',
                description: 'Fastest Gemini model for efficient text generation',
                context_window: 1000000,
                default: false
            },
            {
                name: 'gemini-1.0-pro',
                description: 'Balanced performance for most use cases',
                context_window: 32768,
                default: false
            },
            {
                name: 'gemini-1.0-ultra',
                description: 'Most powerful Gemini 1.0 model',
                context_window: 32768,
                default: false
            }
        ];
        return geminiModels.map(model => {
            // Parse the model info from the name
            const parts = model.name.split('-');
            const version = parts[1];
            const variant = parts[2];
            return {
                id: model.name,
                name: `Gemini ${version} ${variant.charAt(0).toUpperCase() + variant.slice(1)}`,
                vendor: 'gemini',
                capabilities: ['Text generation'],
                contextWindow: model.context_window,
                description: model.description,
                category: `Gemini ${version}`,
                pricingTier: variant === 'ultra' || variant === 'pro' ? 'Premium' : 'Standard',
                deprecated: false,
                defaultModel: model.default
            };
        });
    }
    catch (error) {
        console.error('Error processing Gemini models:', error);
        return [
            {
                id: 'gemini-1.5-pro',
                name: 'Gemini 1.5 Pro',
                vendor: 'gemini',
                capabilities: ['Text generation'],
                contextWindow: 1000000,
                description: 'Most capable Gemini model for highly complex tasks',
                category: 'Gemini 1.5',
                pricingTier: 'Premium',
                deprecated: false,
                defaultModel: true
            }
        ];
    }
}
// Fetch Grok models
async function fetchGrokModels(apiKey) {
    try {
        // Try to fetch models from xAI API
        try {
            const response = await (0, node_fetch_1.default)('https://api.x.ai/v1/models', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
            });
            if (response.ok) {
                const data = await response.json();
                if (data && data.data && Array.isArray(data.data)) {
                    return data.data.map((model) => {
                        return {
                            id: model.id,
                            name: model.id.split('-').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' '),
                            vendor: 'grok',
                            capabilities: ['Text generation'],
                            contextWindow: model.context_window || 128000,
                            description: model.description || `Grok model`,
                            category: 'Grok',
                            pricingTier: 'Premium',
                            deprecated: false,
                            defaultModel: model.id.includes('grok-3')
                        };
                    });
                }
            }
        }
        catch (apiError) {
            console.error('Error fetching from xAI API:', apiError);
            // Fall back to hardcoded values if API call fails
        }
        // Fallback to hardcoded values
        const grokModels = [
            {
                name: 'grok-3',
                description: 'Most capable Grok model with advanced reasoning',
                context_window: 128000,
                default: true
            },
            {
                name: 'grok-2',
                description: 'Balanced performance for most use cases',
                context_window: 128000,
                default: false
            },
            {
                name: 'grok-1',
                description: 'Fast and efficient model',
                context_window: 8192,
                default: false
            }
        ];
        return grokModels.map(model => {
            return {
                id: model.name,
                name: `${model.name.charAt(0).toUpperCase() + model.name.slice(1).replace('-', ' ')}`,
                vendor: 'grok',
                capabilities: ['Text generation'],
                contextWindow: model.context_window,
                description: model.description,
                category: 'Grok',
                pricingTier: 'Premium',
                deprecated: false,
                defaultModel: model.default
            };
        });
    }
    catch (error) {
        console.error('Error processing Grok models:', error);
        return [
            {
                id: 'grok-3',
                name: 'Grok 3',
                vendor: 'grok',
                capabilities: ['Text generation'],
                contextWindow: 128000,
                description: 'Most capable Grok model with advanced reasoning',
                category: 'Grok',
                pricingTier: 'Premium',
                deprecated: false,
                defaultModel: true
            }
        ];
    }
}
// Helper to provide nicer model names
function getPrettyModelName(modelId) {
    // Remove any date suffixes
    const cleanId = modelId.replace(/-\d{6}$/, '');
    // Format GPT models
    if (cleanId.startsWith('gpt-')) {
        const parts = cleanId.split('-');
        const version = parts[1];
        // Build a nicer name
        let name = `GPT-${version}`;
        // Add any qualifiers
        if (cleanId.includes('turbo')) {
            name += ' Turbo';
        }
        if (cleanId.includes('vision')) {
            name += ' Vision';
        }
        if (cleanId.includes('16k')) {
            name += ' (16K)';
        }
        else if (cleanId.includes('32k')) {
            name += ' (32K)';
        }
        else if (cleanId.includes('128k')) {
            name += ' (128K)';
        }
        return name;
    }
    // Default to the original ID if we can't format it
    return modelId;
}
// GET all available models
router.get('/', async (req, res) => {
    try {
        // Fetch models from your provider(s)
        // This is an example implementation - you'll need to adjust based on your API providers
        const models = [
            { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'OpenAI', description: 'Fast and efficient model for most chat use cases', costPerToken: 0.0015 },
            { id: 'gpt-4', name: 'GPT-4', provider: 'OpenAI', description: 'Advanced capabilities for complex tasks', costPerToken: 0.03 },
            { id: 'claude-3-opus', name: 'Claude 3 Opus', provider: 'Anthropic', description: 'Most powerful model for highly complex tasks', costPerToken: 0.03 },
            { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet', provider: 'Anthropic', description: 'Balanced performance and efficiency', costPerToken: 0.015 },
            { id: 'claude-3-haiku', name: 'Claude 3 Haiku', provider: 'Anthropic', description: 'Fast responses with good capabilities', costPerToken: 0.0025 },
        ];
        res.json({ models });
    }
    catch (error) {
        console.error('Error fetching models:', error);
        res.status(500).json({ error: 'Failed to fetch models' });
    }
});
// GET model by ID
router.get('/:id', async (req, res) => {
    try {
        const modelId = req.params.id;
        // In a real implementation, you'd fetch this from your API provider
        // This is just a mockup implementation
        const models = {
            'gpt-3.5-turbo': { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'OpenAI', description: 'Fast and efficient model for most chat use cases', costPerToken: 0.0015 },
            'gpt-4': { id: 'gpt-4', name: 'GPT-4', provider: 'OpenAI', description: 'Advanced capabilities for complex tasks', costPerToken: 0.03 },
            'claude-3-opus': { id: 'claude-3-opus', name: 'Claude 3 Opus', provider: 'Anthropic', description: 'Most powerful model for highly complex tasks', costPerToken: 0.03 },
            'claude-3-sonnet': { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet', provider: 'Anthropic', description: 'Balanced performance and efficiency', costPerToken: 0.015 },
            'claude-3-haiku': { id: 'claude-3-haiku', name: 'Claude 3 Haiku', provider: 'Anthropic', description: 'Fast responses with good capabilities', costPerToken: 0.0025 },
        };
        const model = models[modelId];
        if (!model) {
            return res.status(404).json({ error: 'Model not found' });
        }
        res.json({ model });
    }
    catch (error) {
        console.error('Error fetching model:', error);
        res.status(500).json({ error: 'Failed to fetch model details' });
    }
});
exports.default = router;
