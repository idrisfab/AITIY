import express from 'express';
import { protect } from '../middleware/auth';
import { getProfile, updateProfile } from '../controllers/user.controller';
import { validate } from '../middleware/validation';
import { z } from 'zod';

const router = express.Router();

// Validation schema for profile update
const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
    email: z.string().email().optional(),
  }).refine(data => data.name || data.email, {
    message: "Either name or email must be provided",
    path: ["body"], // Optional: specify the path for the error
  }),
});

// Protected routes - ensure user is logged in for all user routes
router.use(protect);

// GET /api/users/profile - Get current user's profile
router.get('/profile', getProfile);

// PUT /api/users/profile - Update current user's profile
router.put('/profile', validate(updateProfileSchema), updateProfile);

// TODO: Add user routes
// router.get('/me', (req, res) => {
//   res.json({ message: 'User profile route' });
// });

export default router; 