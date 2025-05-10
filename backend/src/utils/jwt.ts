import jwt, { SignOptions } from 'jsonwebtoken';
import { AppError } from './errors';

export const generateToken = (userId: string): string => {
  if (!process.env.JWT_SECRET) {
    throw new AppError('JWT_SECRET is not defined', 500);
  }

  // Create a properly typed options object
  const options: SignOptions = {};
  
  // Set the expiresIn property with the correct type
  if (process.env.JWT_EXPIRES_IN) {
    // The expiresIn value can be a string like '1h', '2d', or a number in seconds
    // Use type assertion to tell TypeScript this string is compatible with the expected type
    options.expiresIn = process.env.JWT_EXPIRES_IN as any;
  } else {
    options.expiresIn = '30d';
  }

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