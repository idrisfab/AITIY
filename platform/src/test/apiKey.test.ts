import request from 'supertest';
import { app, prisma } from '../index';
import { createTestUser, loginTestUser, createAuthHeader } from './helpers';

describe('API Key Management', () => {
  let authToken: string;
  let userId: string;

  beforeEach(async () => {
    // Clear the database
    await prisma.apiKey.deleteMany();
    await prisma.user.deleteMany();

    // Create a test user - skip verification
    const { token, user } = await createTestUser();
    userId = user.id;
    
    // Directly set email as verified
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: new Date() }
    });
    
    authToken = token;
  });

  describe('POST /api/keys', () => {
    it('should create a new API key', async () => {
      const response = await request(app)
        .post('/api/keys')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          vendor: 'openai',
          apiKey: 'sk-test-key',
          name: 'My OpenAI Key'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.vendor).toBe('openai');
      expect(response.body.name).toBe('My OpenAI Key');
      expect(response.body).not.toHaveProperty('apiKey'); // Should not return the actual key
    });

    it('should not allow duplicate names for the same vendor', async () => {
      // Create first key
      await request(app)
        .post('/api/keys')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          vendor: 'openai',
          apiKey: 'sk-test-key-1',
          name: 'My OpenAI Key'
        });

      // Try to create second key with same name
      const response = await request(app)
        .post('/api/keys')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          vendor: 'openai',
          apiKey: 'sk-test-key-2',
          name: 'My OpenAI Key'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('An API key with this name already exists for this vendor');
    });
  });

  describe('GET /api/keys', () => {
    it('should list all API keys for the user', async () => {
      // Create two test keys
      await request(app)
        .post('/api/keys')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          vendor: 'openai',
          apiKey: 'sk-test-key-1',
          name: 'OpenAI Key 1'
        });

      await request(app)
        .post('/api/keys')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          vendor: 'anthropic',
          apiKey: 'sk-test-key-2',
          name: 'Anthropic Key 1'
        });

      const response = await request(app)
        .get('/api/keys')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('vendor');
      expect(response.body[0]).toHaveProperty('name');
      expect(response.body[0]).not.toHaveProperty('apiKey');
    });
  });

  describe('DELETE /api/keys/:id', () => {
    it('should delete an API key', async () => {
      // Create a test key
      const createResponse = await request(app)
        .post('/api/keys')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          vendor: 'openai',
          apiKey: 'sk-test-key',
          name: 'Test Key'
        });

      const keyId = createResponse.body.id;

      // Delete the key
      const deleteResponse = await request(app)
        .delete(`/api/keys/${keyId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(deleteResponse.status).toBe(200);

      // Verify key is deleted
      const getResponse = await request(app)
        .get('/api/keys')
        .set('Authorization', `Bearer ${authToken}`);

      expect(getResponse.body).toHaveLength(0);
    });

    it('should not allow deleting another user\'s key', async () => {
      // Create a test key
      const createResponse = await request(app)
        .post('/api/keys')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          vendor: 'openai',
          apiKey: 'sk-test-key',
          name: 'Test Key'
        });

      const keyId = createResponse.body.id;

      // Create another user
      const user2 = await createTestUser('user2@example.com');
      
      // Directly set email as verified
      await prisma.user.update({
        where: { id: user2.user.id },
        data: { emailVerified: new Date() }
      });
      
      // Try to delete the key with the second user
      const deleteResponse = await request(app)
        .delete(`/api/keys/${keyId}`)
        .set('Authorization', `Bearer ${user2.token}`);

      expect(deleteResponse.status).toBe(404);
    });
  });

  describe('PATCH /api/keys/:id', () => {
    it('should update an API key name', async () => {
      // Create a test key
      const createResponse = await request(app)
        .post('/api/keys')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          vendor: 'openai',
          apiKey: 'sk-test-key',
          name: 'Old Name'
        });

      const keyId = createResponse.body.id;

      // Update the key name
      const updateResponse = await request(app)
        .patch(`/api/keys/${keyId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'New Name'
        });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.name).toBe('New Name');
    });

    it('should not allow duplicate names for the same vendor when updating', async () => {
      // Create two test keys
      await request(app)
        .post('/api/keys')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          vendor: 'openai',
          apiKey: 'sk-test-key-1',
          name: 'Key 1'
        });

      const createResponse = await request(app)
        .post('/api/keys')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          vendor: 'openai',
          apiKey: 'sk-test-key-2',
          name: 'Key 2'
        });

      const keyId = createResponse.body.id;

      // Try to update second key with first key's name
      const updateResponse = await request(app)
        .patch(`/api/keys/${keyId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Key 1'
        });

      expect(updateResponse.status).toBe(400);
      expect(updateResponse.body.error).toBe('An API key with this name already exists for this vendor');
    });
  });
}); 