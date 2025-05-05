import jwt, { SignOptions } from 'jsonwebtoken';
import { AppError } from './errors';

export const generateToken = (userId: string): string => {
  if (!process.env.JWT_SECRET) {
    throw new AppError('JWT_SECRET is not defined', 500);
  }

  const options: SignOptions = {
    expiresIn: process.env.JWT_EXPIRES_IN || '30d' as string | number,
  };

  return jwt.sign({ userId }, process.env.JWT_SECRET, options);
};

export const verifyToken = (token: string): { userId: string } => {
  if (!process.env.JWT_SECRET) {
    throw new AppError('JWT_SECRET is not defined', 500);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as { userId: string };
    return decoded;
  } catch (error) {
    throw new AppError('Invalid or expired token', 401);
  }
}; 