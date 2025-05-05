import { Router, Request, Response } from 'express';
import { body } from 'express-validator';
import { prisma } from '../index';
import { validateRequest } from '../middleware/validate.middleware';
import { authenticateJWT } from '../middleware/auth.middleware';
import { encryptApiKey, decryptApiKey } from '../utils/encryption';
import { JwtPayload } from '../types/auth';

interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

const router = Router();

// Create a new API key
router.post(
  '/',
  authenticateJWT,
  [
    body('vendor').trim().notEmpty().withMessage('Vendor is required'),
    body('apiKey').trim().notEmpty().withMessage('API key is required'),
    body('name').trim().optional(),
  ],
  validateRequest,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { vendor, apiKey, name } = req.body;
      const userId = req.user!.userId;

      // Check if a key with the same name already exists for this user and vendor
      if (name) {
        const existingKey = await prisma.apiKey.findFirst({
          where: { userId, vendor, name },
        });
        if (existingKey) {
          return res.status(400).json({
            error: 'An API key with this name already exists for this vendor',
          });
        }
      }

      // Encrypt the API key before storing
      const encryptedKey = encryptApiKey(apiKey);

      const newApiKey = await prisma.apiKey.create({
        data: {
          vendor,
          apiKey: encryptedKey,
          name,
          user: {
            connect: {
              id: userId
            }
          }
        },
        select: {
          id: true,
          vendor: true,
          name: true,
          createdAt: true,
        },
      });

      res.status(201).json(newApiKey);
    } catch (error) {
      console.error('Error creating API key:', error);
      res.status(500).json({ error: 'Failed to create API key' });
    }
  }
);

// Get all API keys for a user
router.get('/', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    const apiKeys = await prisma.apiKey.findMany({
      where: { userId },
      select: {
        id: true,
        vendor: true,
        name: true,
        createdAt: true,
      },
    });

    res.json(apiKeys);
  } catch (error) {
    console.error('Error fetching API keys:', error);
    res.status(500).json({ error: 'Failed to fetch API keys' });
  }
});

// Delete an API key
router.delete('/:id', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const keyId = req.params.id;

    const apiKey = await prisma.apiKey.findFirst({
      where: { id: keyId, userId },
    });

    if (!apiKey) {
      return res.status(404).json({ error: 'API key not found' });
    }

    await prisma.apiKey.delete({
      where: { id: keyId },
    });

    res.json({ message: 'API key deleted successfully' });
  } catch (error) {
    console.error('Error deleting API key:', error);
    res.status(500).json({ error: 'Failed to delete API key' });
  }
});

// Update API key name
router.patch(
  '/:id',
  authenticateJWT,
  [body('name').trim().notEmpty().withMessage('Name is required')],
  validateRequest,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.userId;
      const keyId = req.params.id;
      const { name } = req.body;

      // Check if the API key exists and belongs to the user
      const existingKey = await prisma.apiKey.findFirst({
        where: { id: keyId, userId },
      });

      if (!existingKey) {
        return res.status(404).json({ error: 'API key not found' });
      }

      // Check if another key with the same name exists for this user and vendor
      const duplicateKey = await prisma.apiKey.findFirst({
        where: {
          userId,
          vendor: existingKey.vendor,
          name,
          id: { not: keyId }, // Exclude current key from check
        },
      });

      if (duplicateKey) {
        return res.status(400).json({
          error: 'An API key with this name already exists for this vendor',
        });
      }

      const updatedKey = await prisma.apiKey.update({
        where: { id: keyId },
        data: { name },
        select: {
          id: true,
          vendor: true,
          name: true,
          createdAt: true,
        },
      });

      res.json(updatedKey);
    } catch (error) {
      console.error('Error updating API key:', error);
      res.status(500).json({ error: 'Failed to update API key' });
    }
  }
);

export default router; 