import { Router } from 'express';
import { body } from 'express-validator';
import { AuthController } from '../controllers/auth.controller';
import { authenticateJWT } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';

const router = Router();

// Validation middleware
const registerValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('name').optional().trim().notEmpty(),
  validateRequest
];

const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
  validateRequest
];

const passwordResetRequestValidation = [
  body('email').isEmail().normalizeEmail(),
  validateRequest
];

const passwordResetValidation = [
  body('token').notEmpty(),
  body('newPassword').isLength({ min: 6 }),
  validateRequest
];

const changePasswordValidation = [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 6 }),
  validateRequest
];

const deleteAccountValidation = [
  body('password').notEmpty(),
  validateRequest
];

// Authentication routes
router.post('/register', registerValidation, AuthController.register);
router.post('/login', loginValidation, AuthController.login);
router.get('/me', authenticateJWT, AuthController.me);

// Email verification
router.get('/verify-email/:token', AuthController.verifyEmail);

// Password management
router.post('/forgot-password', passwordResetRequestValidation, AuthController.requestPasswordReset);
router.post('/reset-password', passwordResetValidation, AuthController.resetPassword);
router.post('/change-password', authenticateJWT, changePasswordValidation, AuthController.changePassword);

// Account management
router.delete('/account', authenticateJWT, deleteAccountValidation, AuthController.deleteAccount);

export default router; 