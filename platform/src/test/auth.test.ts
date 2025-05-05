import request from 'supertest';
import { app, prisma } from '../index';
import { EmailService } from '../services/email.service';
import { createTestUser, loginTestUser, verifyTestUserEmail, createAuthHeader } from './helpers';
import { generateToken } from '../middleware/auth.middleware';

describe('Authentication', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          name: 'Test User'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user.email).toBe('test@example.com');
      expect(EmailService.sendVerificationEmail).toHaveBeenCalled();
    });

    it('should not register a user with existing email', async () => {
      await createTestUser();

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          name: 'Test User'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('User already exists');
    });

    it('should not register with invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: 'password123',
          name: 'Test User'
        });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });

    it('should not register with short password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: '123',
          name: 'Test User'
        });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });

    it('should handle missing required fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User'
        });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await createTestUser();
    });

    it('should login successfully with correct credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body.user.email).toBe('test@example.com');
    });

    it('should not login with incorrect password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid credentials');
    });

    it('should not login with non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid credentials');
    });

    it('should handle missing credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('GET /api/auth/verify-email/:token', () => {
    it('should verify email with valid token', async () => {
      const { user } = await createTestUser();
      const token = await verifyTestUserEmail(user.id);

      const verifiedUser = await prisma.user.findUnique({
        where: { id: user.id }
      });

      expect(verifiedUser?.emailVerified).toBeTruthy();
      expect(verifiedUser?.verificationToken).toBeNull();
    });

    it('should not verify email with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/verify-email/invalid-token');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid verification token');
    });

    it('should not verify already verified email', async () => {
      const { user } = await createTestUser();
      const token = await verifyTestUserEmail(user.id);

      // Try to verify again with the same token
      const response = await request(app)
        .get(`/api/auth/verify-email/${token}`);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid verification token');
    });

    it('should handle expired verification token', async () => {
      const { user } = await createTestUser();
      
      // Update token to be expired
      await prisma.user.update({
        where: { id: user.id },
        data: {
          verificationToken: 'expired-token',
          emailVerified: null
        }
      });

      const response = await request(app)
        .get('/api/auth/verify-email/expired-token');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid verification token');
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    beforeEach(async () => {
      await createTestUser();
    });

    it('should send reset password email', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({
          email: 'test@example.com'
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Password reset email sent');
      expect(EmailService.sendPasswordResetEmail).toHaveBeenCalled();
    });

    it('should handle non-existent email gracefully', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({
          email: 'nonexistent@example.com'
        });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('User not found');
    });

    it('should handle invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({
          email: 'invalid-email'
        });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });

    it('should not expose user existence through timing', async () => {
      const startTime = Date.now();
      
      await request(app)
        .post('/api/auth/forgot-password')
        .send({
          email: 'nonexistent@example.com'
        });

      const nonExistentTime = Date.now() - startTime;

      const startTime2 = Date.now();
      await request(app)
        .post('/api/auth/forgot-password')
        .send({
          email: 'test@example.com'
        });

      const existentTime = Date.now() - startTime2;

      // Times should be roughly similar (within 100ms)
      expect(Math.abs(existentTime - nonExistentTime)).toBeLessThan(100);
    });
  });

  describe('POST /api/auth/reset-password', () => {
    let resetToken: string;
    let userId: string;

    beforeEach(async () => {
      const { user } = await createTestUser();
      userId = user.id;

      // Generate reset token
      resetToken = 'test-reset-token';
      await prisma.user.update({
        where: { id: userId },
        data: {
          resetPasswordToken: resetToken,
          resetPasswordExpires: new Date(Date.now() + 3600000)
        }
      });
    });

    it('should reset password with valid token', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: resetToken,
          newPassword: 'newpassword123'
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Password reset successfully');

      // Should be able to login with new password
      const loginResponse = await loginTestUser('test@example.com', 'newpassword123');
      expect(loginResponse).toHaveProperty('token');
    });

    it('should not reset password with invalid token', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: 'invalid-token',
          newPassword: 'newpassword123'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid or expired reset token');
    });

    it('should not reset password with expired token', async () => {
      const { user } = await createTestUser();
      
      // Set expired reset token
      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetPasswordToken: 'expired-token',
          resetPasswordExpires: new Date(Date.now() - 3600000) // 1 hour ago
        }
      });

      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: 'expired-token',
          newPassword: 'newpassword123'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid or expired reset token');
    });

    it('should not accept weak passwords', async () => {
      const { user } = await createTestUser();
      const resetToken = 'valid-token';
      
      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetPasswordToken: resetToken,
          resetPasswordExpires: new Date(Date.now() + 3600000)
        }
      });

      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: resetToken,
          newPassword: '123'
        });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('POST /api/auth/change-password', () => {
    let authToken: string;

    beforeEach(async () => {
      const { token } = await createTestUser();
      authToken = token;
    });

    it('should change password for authenticated user', async () => {
      const response = await request(app)
        .post('/api/auth/change-password')
        .set(createAuthHeader(authToken))
        .send({
          currentPassword: 'password123',
          newPassword: 'newpassword123'
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Password changed successfully');

      // Should be able to login with new password
      const loginResponse = await loginTestUser('test@example.com', 'newpassword123');
      expect(loginResponse).toHaveProperty('token');
    });

    it('should not change password with incorrect current password', async () => {
      const response = await request(app)
        .post('/api/auth/change-password')
        .set(createAuthHeader(authToken))
        .send({
          currentPassword: 'wrongpassword',
          newPassword: 'newpassword123'
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Current password is incorrect');
    });

    it('should not accept same password as current', async () => {
      const { token } = await createTestUser();

      const response = await request(app)
        .post('/api/auth/change-password')
        .set(createAuthHeader(token))
        .send({
          currentPassword: 'password123',
          newPassword: 'password123'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('New password must be different from current password');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/auth/change-password')
        .send({
          currentPassword: 'password123',
          newPassword: 'newpassword123'
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Authorization header missing');
    });

    it('should handle invalid JWT token', async () => {
      const response = await request(app)
        .post('/api/auth/change-password')
        .set(createAuthHeader('invalid-token'))
        .send({
          currentPassword: 'password123',
          newPassword: 'newpassword123'
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid token');
    });
  });

  describe('DELETE /api/auth/account', () => {
    let authToken: string;
    let userId: string;

    beforeEach(async () => {
      const { token, user } = await createTestUser();
      authToken = token;
      userId = user.id;
    });

    it('should delete account with correct password', async () => {
      const response = await request(app)
        .delete('/api/auth/account')
        .set(createAuthHeader(authToken))
        .send({
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Account deleted successfully');

      // Verify user is deleted
      const deletedUser = await prisma.user.findUnique({
        where: { id: userId }
      });
      expect(deletedUser).toBeNull();
    });

    it('should not delete account with incorrect password', async () => {
      const response = await request(app)
        .delete('/api/auth/account')
        .set(createAuthHeader(authToken))
        .send({
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid password');

      // Verify user still exists
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });
      expect(user).toBeTruthy();
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .delete('/api/auth/account')
        .send({
          password: 'password123'
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Authorization header missing');
    });

    it('should handle missing password', async () => {
      const { token } = await createTestUser();

      const response = await request(app)
        .delete('/api/auth/account')
        .set(createAuthHeader(token))
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });

    it('should delete associated data (cascade delete)', async () => {
      // Create user with API key and embed config
      const { token, user } = await createTestUser();

      // Add API key
      const apiKey = await prisma.apiKey.create({
        data: {
          userId: user.id,
          vendor: 'openai',
          apiKey: 'test-key',
          name: 'Test Key'
        }
      });

      // Add embed config
      await prisma.embedConfiguration.create({
        data: {
          userId: user.id,
          name: 'Test Config',
          apiKeyId: apiKey.id,
          modelVendor: 'openai',
          modelName: 'gpt-4'
        }
      });

      // Delete account
      await request(app)
        .delete('/api/auth/account')
        .set(createAuthHeader(token))
        .send({
          password: 'password123'
        });

      // Verify all associated data is deleted
      const deletedApiKey = await prisma.apiKey.findFirst({
        where: { userId: user.id }
      });
      const deletedConfig = await prisma.embedConfiguration.findFirst({
        where: { userId: user.id }
      });

      expect(deletedApiKey).toBeNull();
      expect(deletedConfig).toBeNull();
    });
  });

  describe('JWT Token Security', () => {
    it('should reject expired tokens', async () => {
      const { user } = await createTestUser();
      
      // Generate token that expires in -1 hour (already expired)
      const expiredToken = generateToken({ 
        userId: user.id, 
        email: user.email 
      }, '-1h');

      const response = await request(app)
        .get('/api/auth/me')
        .set(createAuthHeader(expiredToken));

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid token');
    });

    it('should reject modified tokens', async () => {
      const { token } = await createTestUser();
      
      // Modify the token by changing a character
      const modifiedToken = token.slice(0, -1) + 'X';

      const response = await request(app)
        .get('/api/auth/me')
        .set(createAuthHeader(modifiedToken));

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid token');
    });
  });
}); 