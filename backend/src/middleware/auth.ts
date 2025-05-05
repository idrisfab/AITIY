import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { verifyToken } from '../utils/jwt';
import { prisma } from '../db';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
      };
    }
  }
}

export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new AppError('No token provided', 401);
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new AppError('No token provided', 401);
    }

    // Verify token
    const decoded = verifyToken(token);

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true },
    });

    if (!user) {
      throw new AppError('User not found', 401);
    }

    // Add user to request
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}; 