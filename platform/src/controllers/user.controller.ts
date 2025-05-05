import { Request, Response } from 'express';
import { prisma } from '../index';
import { UpdateProfileDto } from '../types/user';

export class UserController {
  /**
   * Get the current user's profile
   */
  static async getProfile(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({ user });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({ error: 'Failed to get user profile' });
    }
  }

  /**
   * Update the current user's profile
   */
  static async updateProfile(req: Request<{}, {}, UpdateProfileDto>, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      const { name, email } = req.body;

      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!existingUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      // If email is being updated, check if it's already in use
      if (email && email !== existingUser.email) {
        const emailExists = await prisma.user.findUnique({
          where: { email },
        });

        if (emailExists) {
          return res.status(400).json({ error: 'Email is already in use' });
        }

        // Email verification handling
        // If changing email, we should set emailVerified to null and send a verification email
        // This is simplified for the demo
        await prisma.user.update({
          where: { id: userId },
          data: {
            email,
            emailVerified: null,
            name: name || existingUser.name,
          },
        });

        // In a real implementation, we would send a verification email here
        // await EmailService.sendVerificationEmail(user, verificationToken);

        return res.json({ 
          message: 'Profile updated. Please verify your new email address.',
          user: {
            id: userId,
            name: name || existingUser.name,
            email,
            emailVerified: null
          }
        });
      }

      // Just updating the name
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          name: name || existingUser.name,
        },
        select: {
          id: true,
          email: true,
          name: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      res.json({ 
        message: 'Profile updated successfully',
        user: updatedUser
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  }
} 