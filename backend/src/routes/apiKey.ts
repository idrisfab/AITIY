import express from 'express';
import { protect } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';
import { encryptApiKey, decryptApiKey } from '../utils/encryption';
import fetch from 'node-fetch';
import { validateAndSanitize } from '../middleware/sanitization';
import { ResourceType, PermissionLevel, requireResourcePermission } from '../middleware/accessControl';
import { Logger } from '../utils/logger';
import { AppError } from '../utils/errors';
import { z } from 'zod';

const router = express.Router();
const prisma = new PrismaClient();
const logger = Logger.getLogger('apikey-routes');

// Protected routes
router.use(protect);

// Define schema for API key updates
const ApiKeyUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  vendor: z.string().optional()
});

// Get all API keys for the current user
router.get('/', async (req: any, res) => {
  try {
    const apiKeys = await prisma.apiKey.findMany({
      where: {
        userId: req.user.id
      },
      select: {
        id: true,
        name: true,
        vendor: true,
        createdAt: true,
        lastUsedAt: true,
        usageCount: true
      }
    });
    res.json(apiKeys);
  } catch (error) {
    console.error('Error fetching API keys:', error);
    res.status(500).json({ error: 'Failed to fetch API keys' });
  }
});

// Create a new API key
router.post('/', async (req: any, res) => {
  const { name, key, vendor = 'openai' } = req.body;
  
  try {
    // Encrypt the API key before storing
    const encryptedKey = encryptApiKey(key);
    
    const apiKey = await prisma.apiKey.create({
      data: {
        name,
        key: encryptedKey,
        vendor,
        userId: req.user.id
      }
    });
    
    res.status(201).json({
      id: apiKey.id,
      name: apiKey.name,
      vendor: apiKey.vendor,
      createdAt: apiKey.createdAt
    });
  } catch (error) {
    console.error('Error creating API key:', error);
    res.status(500).json({ error: 'Failed to create API key' });
  }
});

// Delete an API key
router.delete('/:id', protect, 
  requireResourcePermission(
    ResourceType.API_KEY,
    req => req.params.id,
    PermissionLevel.WRITE
  ),
  async (req: any, res, next) => {
    try {
      await prisma.apiKey.delete({
        where: { id: req.params.id }
      });
      
      logger.info(`API key deleted: ${req.params.id}`, {
        userId: req.user.id
      });
      
      res.status(204).send();
    } catch (error) {
      logger.error(`Error deleting API key: ${req.params.id}`, error);
      next(error);
    }
  }
);

// Update an API key
router.patch('/:id', protect, 
  requireResourcePermission(
    ResourceType.API_KEY,
    req => req.params.id,
    PermissionLevel.WRITE
  ),
  validateAndSanitize(ApiKeyUpdateSchema),
  async (req: any, res, next) => {
    try {
      const updatedKey = await prisma.apiKey.update({
        where: { id: req.params.id },
        data: req.body
      });
      
      logger.info(`API key updated: ${req.params.id}`, {
        userId: req.user.id,
        fieldsUpdated: Object.keys(req.body)
      });
      
      res.json(updatedKey);
    } catch (error) {
      logger.error(`Error updating API key: ${req.params.id}`, error);
      next(error);
    }
  }
);

// Validate an API key
router.post('/validate', async (req: any, res) => {
  const { key, vendor } = req.body;

  try {
    let isValid = false;
    let error = null;

    switch (vendor) {
      case 'anthropic':
        try {
          const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'x-api-key': key,
              'anthropic-version': '2023-06-01',
              'content-type': 'application/json',
            },
            body: JSON.stringify({
              model: 'claude-3-haiku-20240307',
              messages: [{ role: 'user', content: 'Hi' }],
              max_tokens: 1,
            }),
          });

          const data = await response.json();
          isValid = response.ok;
          if (!isValid) {
            error = data.error?.message || 'Invalid API key';
          }
        } catch (err: any) {
          error = err.message || 'Failed to validate API key';
        }
        break;

      case 'openai':
        try {
          const response = await fetch('https://api.openai.com/v1/models', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${key}`,
              'Content-Type': 'application/json',
            },
          });

          const data = await response.json();
          if (response.ok) {
            isValid = true;
          } else {
            const errorMessage = data.error?.message;
            if (errorMessage?.includes('exceeded your current quota')) {
              isValid = true; // Key is valid but has no credits
              error = 'Your API key is valid but has no available credits. Please check your billing status.';
            } else {
              error = errorMessage || 'Invalid API key';
            }
          }
        } catch (err: any) {
          error = err.message || 'Failed to validate API key';
        }
        break;
        
      case 'gemini':
        try {
          // Validate Google Gemini API key by making a simple request
          const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [{
                parts: [{
                  text: 'Hello'
                }]
              }],
              generationConfig: {
                maxOutputTokens: 1,
              }
            }),
          });

          const data = await response.json();
          isValid = response.ok;
          if (!isValid) {
            error = data.error?.message || 'Invalid Gemini API key';
          }
        } catch (err: any) {
          error = err.message || 'Failed to validate Gemini API key';
        }
        break;
        
      case 'grok':
        try {
          // xAI's Grok API is compatible with OpenAI's API
          const response = await fetch('https://api.x.ai/v1/models', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${key}`,
              'Content-Type': 'application/json',
            },
          });

          const data = await response.json();
          isValid = response.ok;
          if (!isValid) {
            error = data.error?.message || 'Invalid Grok API key';
          }
        } catch (err: any) {
          error = err.message || 'Failed to validate Grok API key';
        }
        break;

      default:
        error = 'Unsupported vendor';
    }

    res.json({ isValid, error });
  } catch (error: any) {
    console.error('Error validating API key:', error);
    res.status(500).json({ error: 'Failed to validate API key' });
  }
});

// Get a single API key with the decrypted key (for test/preview purposes only)
// SECURITY NOTE: This endpoint should only be used for preview/testing.
// In production, this endpoint should either be disabled or have additional safeguards
// such as rate limiting, time-limited access tokens, etc.
router.get('/:id/value', async (req: any, res) => {
  try {
    const apiKey = await prisma.apiKey.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!apiKey) {
      return res.status(404).json({ error: 'API key not found' });
    }

    // Update last used timestamp
    await prisma.apiKey.update({
      where: { id: req.params.id },
      data: { lastUsedAt: new Date() }
    });

    // Decrypt the API key for use in the preview
    const decryptedKey = decryptApiKey(apiKey.key);

    res.json({
      id: apiKey.id,
      name: apiKey.name,
      vendor: apiKey.vendor,
      key: decryptedKey,
      createdAt: apiKey.createdAt,
      lastUsedAt: apiKey.lastUsedAt
    });
  } catch (error) {
    console.error('Error retrieving API key:', error);
    res.status(500).json({ error: 'Failed to retrieve API key' });
  }
});

// Modify the route that gets a specific API key
router.get('/:id', protect, 
  requireResourcePermission(
    ResourceType.API_KEY,
    req => req.params.id,
    PermissionLevel.READ
  ),
  async (req: any, res, next) => {
    try {
      const apiKey = await prisma.apiKey.findUnique({
        where: { id: req.params.id }
      });
      
      if (!apiKey) {
        throw AppError.notFound('API key');
      }
      
      res.json(apiKey);
    } catch (error) {
      logger.error(`Error fetching API key: ${req.params.id}`, error);
      next(error);
    }
  }
);

export default router; 