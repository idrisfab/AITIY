import express from 'express';
import { validate } from '../middleware/validation';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../schemas/auth.schema';
import {
  register,
  login,
  forgotPassword,
  resetPassword,
} from '../controllers/auth.controller';
import { authLimiter } from '../middleware/rateLimit';

const router = express.Router();

// POST routes for actual authentication
router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);

// GET routes to serve the login/register pages (for Next.js frontend)
// These routes are needed because the frontend is making GET requests to these endpoints
// They should return a success response to avoid 404 errors
router.get('/login', (req, res) => {
  console.log('GET /auth/login route hit');
  res.status(200).json({ message: 'Login page endpoint', success: true });
});

router.get('/login/', (req, res) => {
  console.log('GET /auth/login/ route hit');
  res.status(200).json({ message: 'Login page endpoint', success: true });
});

router.get('/register', (req, res) => {
  console.log('GET /auth/register route hit');
  res.status(200).json({ message: 'Register page endpoint', success: true });
});

router.get('/register/', (req, res) => {
  console.log('GET /auth/register/ route hit');
  res.status(200).json({ message: 'Register page endpoint', success: true });
});

// Add routes for forgot-password and reset-password
router.get('/forgot-password', (req, res) => {
  console.log('GET /auth/forgot-password route hit');
  res.status(200).json({ message: 'Forgot password endpoint', success: true });
});

router.get('/forgot-password/', (req, res) => {
  console.log('GET /auth/forgot-password/ route hit');
  res.status(200).json({ message: 'Forgot password endpoint', success: true });
});

router.get('/reset-password', (req, res) => {
  console.log('GET /auth/reset-password route hit');
  res.status(200).json({ message: 'Reset password endpoint', success: true });
});

router.get('/reset-password/', (req, res) => {
  console.log('GET /auth/reset-password/ route hit');
  res.status(200).json({ message: 'Reset password endpoint', success: true });
});
router.post(
  '/forgot-password',
  authLimiter,
  validate(forgotPasswordSchema),
  forgotPassword
);
router.post(
  '/reset-password',
  authLimiter,
  validate(resetPasswordSchema),
  resetPassword
);

export default router; 