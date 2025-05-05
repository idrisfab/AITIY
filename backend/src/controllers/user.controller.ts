import { Request, Response, NextFunction } from 'express';
import { prisma } from '../db';
import { AppError } from '../utils/errors';
import { Logger } from '../utils/logger';

const logger = Logger.getLogger('user-controller');

// Extend the Express Request type to include the user object from 'protect' middleware
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
  };
}

export const updateProfile = async (
  req: AuthenticatedRequest, 
  res: Response, 
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    const { name, email } = req.body;

    if (!userId) {
      // This should technically not happen if 'protect' middleware is used correctly
      return next(new AppError('Authentication required', 401));
    }

    if (!name && !email) {
      return next(new AppError('No update data provided (name or email)', 400));
    }

    // Basic validation (more robust validation can be added via schemas)
    if (email && !/\S+@\S+\.\S+/.test(email)) {
       return next(new AppError('Invalid email format', 400));
    }
     if (name && typeof name !== 'string' || name.trim().length < 1) {
       return next(new AppError('Invalid name provided', 400));
    }

    // Prepare update data
    const updateData: { name?: string; email?: string } = {};
    if (name) updateData.name = name.trim();
    if (email) updateData.email = email.trim(); // Consider email verification flow if changing email

    logger.info(`Updating profile for user ${userId}`, { updateData });

    // Update user in database
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: { // Select only the fields needed for the response
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });

    logger.info(`Profile updated successfully for user ${userId}`);

    // Return the updated user data as expected by the frontend
    res.status(200).json({
      status: 'success',
      message: 'Profile updated successfully',
      user: updatedUser, 
    });

  } catch (error: any) {
     // Handle potential errors like unique constraint violation (email already exists)
     if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
       logger.warn(`Failed to update profile for user ${req.user?.id}: Email already exists`);
       return next(new AppError('Email address is already in use by another account', 409)); 
     }
    logger.error(`Error updating profile for user ${req.user?.id}`, error);
    next(error); // Pass error to global error handler
  }
};

// Placeholder for getProfile if needed later
export const getProfile = async (
  req: AuthenticatedRequest, 
  res: Response, 
  next: NextFunction
) => {
   try {
     const userId = req.user?.id;
     if (!userId) {
       return next(new AppError('Authentication required', 401));
     }

     const user = await prisma.user.findUnique({
       where: { id: userId },
       select: { 
         id: true, 
         email: true, 
         name: true, 
         createdAt: true 
       }
     });

     if (!user) {
       return next(AppError.notFound('User'));
     }

     res.status(200).json({
       status: 'success',
       user: user
     });

   } catch (error) {
      logger.error(`Error fetching profile for user ${req.user?.id}`, error);
      next(error);
   }
}; 