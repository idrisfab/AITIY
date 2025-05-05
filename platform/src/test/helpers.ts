import { Express } from 'express';
import request from 'supertest';
import { prisma } from '../index';
import { generateToken } from '../middleware/auth.middleware';
import { app } from '../index';
import { JwtPayload } from '../types/auth';

// Add type declaration for global
declare global {
  namespace NodeJS {
    interface Global {
      app: Express;
    }
  }
}

export const createTestUser = async (email: string = 'test@example.com', password: string = 'password123') => {
  const response = await request(app)
    .post('/api/auth/register')
    .send({
      email,
      password,
      name: 'Test User'
    });

  // Find the created user
  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    throw new Error('Failed to create test user');
  }

  // Generate token with correct payload structure
  const token = generateToken({ 
    userId: user.id, 
    email: user.email
  });

  return {
    user,
    token,
    ...response.body // Include original response data
  };
};

export const loginTestUser = async (email: string = 'test@example.com', password: string = 'password123') => {
  const response = await request(app)
    .post('/api/auth/login')
    .send({
      email,
      password
    });

  return response.body;
};

export const verifyTestUserEmail = async (userId: string) => {
  const user = await prisma.user.findUnique({ 
    where: { id: userId } 
  });
  
  if (!user) {
    throw new Error('User not found');
  }
  
  if (!user.verificationToken) {
    throw new Error('No verification token found');
  }

  await request(app)
    .get(`/api/auth/verify-email/${user.verificationToken}`);

  return user.verificationToken;
};

export const createAuthHeader = (token: string) => ({
  Authorization: `Bearer ${token}`
}); 