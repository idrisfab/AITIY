import { Router } from 'express';
import { body } from 'express-validator';
import { UserController } from '../controllers/user.controller';
import { authenticateJWT } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';

const router = Router();

// Validation middleware
const updateProfileValidation = [
  body('name').optional().trim().notEmpty(),
  body('email').optional().isEmail().normalizeEmail(),
  validateRequest
];

// Get current user profile
router.get('/profile', authenticateJWT, UserController.getProfile);

// Update user profile
router.put(
  '/profile',
  authenticateJWT,
  updateProfileValidation,
  UserController.updateProfile
);

export default router; 