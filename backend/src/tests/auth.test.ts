import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../server';
import { UserModel } from '../models';

describe('Authentication API', () => {
  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/healthkonnect-test');
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clear users collection
    await UserModel.deleteMany({});
  });

  describe('POST /api/auth/login', () => {
    it('should authenticate with demo token', async () => {
      const response = await request(app)
        .get('/api/doctors')
        .set('Authorization', 'Bearer demo-token');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should reject invalid token', async () => {
      const response = await request(app)
        .get('/api/doctors')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(403);
    });

    it('should reject missing token', async () => {
      const response = await request(app)
        .get('/api/doctors');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/api/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'OK');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
    });
  });
});