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
        return models
            .filter(model => 
        // Only include chat models - those that can be used with chat/completions
        model.id.includes('gpt') ||
            model.id.includes('turbo') ||
            model.id.includes('instruct'))
            .map(model => {
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
        // Anthropic doesn't have a models endpoint, so we use hardcoded values
        // but could be updated when they provide an API
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
