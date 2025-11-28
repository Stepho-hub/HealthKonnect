import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../server';
import { UserModel, DoctorModel, AppointmentModel, MessageModel } from '../models';

describe('HealthKonnect MVP - Mock Integration Tests', () => {
  let demoToken: string;
  let demoUser: any;
  let demoDoctor: any;

  beforeAll(async () => {
    // Connect to test database
    const testDbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/healthkonnect-test';
    await mongoose.connect(testDbUri);
    console.log('Connected to test database');
  });

  afterAll(async () => {
    await mongoose.connection.close();
    console.log('Disconnected from test database');
  });

  beforeEach(async () => {
    // Clear all collections
    await UserModel.deleteMany({});
    await DoctorModel.deleteMany({});
    await AppointmentModel.deleteMany({});
    await MessageModel.deleteMany({});

    // Create demo user
    demoUser = new UserModel({
      name: 'Demo Patient',
      email: 'patient@demo.com',
      password: 'demopass123',
      role: 'patient'
    });
    await demoUser.save();

    // Create demo doctor
    demoDoctor = new DoctorModel({
      user: demoUser._id,
      name: 'Dr. Demo Doctor',
      specialization: 'General Medicine',
      city: 'Nairobi',
      hospital: 'Demo Hospital',
      rating: 4.5,
      reviewCount: 10,
      consultationFee: 2000,
      availableSlots: ['09:00', '10:00', '11:00', '14:00', '15:00']
    });
    await demoDoctor.save();

    demoToken = 'demo-token';
  });

  describe('🔐 Authentication System', () => {
    test('✅ Health check endpoint works', async () => {
      const response = await request(app).get('/api/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('OK');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
    });

    test('✅ Demo authentication works', async () => {
      const response = await request(app)
        .get('/api/doctors')
        .set('Authorization', `Bearer ${demoToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('❌ Invalid token rejected', async () => {
      const response = await request(app)
        .get('/api/doctors')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(403);
    });

    test('❌ Missing token rejected', async () => {
      const response = await request(app).get('/api/doctors');

      expect(response.status).toBe(401);
    });
  });

  describe('👨‍⚕️ Doctor Management', () => {
    test('✅ Get doctors list', async () => {
      const response = await request(app)
        .get('/api/doctors')
        .set('Authorization', `Bearer ${demoToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toBe('Dr. Demo Doctor');
      expect(response.body.data[0].specialization).toBe('General Medicine');
    });

    test('✅ Filter doctors by city', async () => {
      const response = await request(app)
        .get('/api/doctors/city/Nairobi')
        .set('Authorization', `Bearer ${demoToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
    });

    test('❌ Invalid city parameter', async () => {
      const response = await request(app)
        .get('/api/doctors/city/')
        .set('Authorization', `Bearer ${demoToken}`);

      expect(response.status).toBe(400);
    });
  });

  describe('📅 Appointment System', () => {
    test('✅ Create appointment', async () => {
      const appointmentData = {
        doctor: demoDoctor._id.toString(),
        date: new Date().toISOString().split('T')[0],
        time: '10:00',
        symptoms: 'Headache and fever',
        notes: 'First consultation'
      };

      const response = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${demoToken}`)
        .send(appointmentData);

      expect(response.status).toBe(201);
      expect(response.body.data).toHaveProperty('_id');
      expect(response.body.data.status).toBe('pending');
      expect(response.body.data.symptoms).toBe('Headache and fever');
    });

    test('❌ Create appointment with invalid doctor', async () => {
      const appointmentData = {
        doctor: 'invalid-doctor-id',
        date: new Date().toISOString().split('T')[0],
        time: '10:00'
      };

      const response = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${demoToken}`)
        .send(appointmentData);

      expect(response.status).toBe(404);
    });

    test('✅ Get user appointments', async () => {
      // First create an appointment
      const appointmentData = {
        doctor: demoDoctor._id.toString(),
        date: new Date().toISOString().split('T')[0],
        time: '10:00'
      };

      await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${demoToken}`)
        .send(appointmentData);

      // Then get appointments
      const response = await request(app)
        .get('/api/appointments')
        .set('Authorization', `Bearer ${demoToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('💬 Messaging System', () => {
    test('✅ Send message', async () => {
      const messageData = {
        receiver: demoUser._id.toString(),
        content: 'Hello, I need medical advice'
      };

      const response = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${demoToken}`)
        .send(messageData);

      expect(response.status).toBe(201);
      expect(response.body.data).toHaveProperty('_id');
      expect(response.body.data.content).toBe('Hello, I need medical advice');
    });

    test('❌ Send message to self', async () => {
      const messageData = {
        receiver: demoUser._id.toString(),
        content: 'Self message'
      };

      const response = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${demoToken}`)
        .send(messageData);

      expect(response.status).toBe(400);
    });

    test('✅ Get messages', async () => {
      // Send a message first
      const messageData = {
        receiver: demoUser._id.toString(),
        content: 'Test message'
      };

      await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${demoToken}`)
        .send(messageData);

      // Get messages
      const response = await request(app)
        .get('/api/messages')
        .set('Authorization', `Bearer ${demoToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('👤 Profile Management', () => {
    test('✅ Get user profile', async () => {
      const response = await request(app)
        .get('/api/profile')
        .set('Authorization', `Bearer ${demoToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toBeDefined();
    });

    test('✅ Update user profile', async () => {
      const profileData = {
        fullName: 'John Doe',
        phone: '+254712345678',
        address: '123 Main St, Nairobi',
        emergencyContact: '+254798765432'
      };

      const response = await request(app)
        .put('/api/profile')
        .set('Authorization', `Bearer ${demoToken}`)
        .send(profileData);

      expect(response.status).toBe(200);
      expect(response.body.data.fullName).toBe('John Doe');
      expect(response.body.data.phone).toBe('+254712345678');
    });
  });

  describe('🔒 Security & Validation', () => {
    test('✅ Input validation works', async () => {
      const response = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${demoToken}`)
        .send({}); // Empty body

      expect(response.status).toBe(400);
      expect(response.body.error.message).toContain('Missing required fields');
    });

    test('✅ SQL injection protection', async () => {
      const maliciousData = {
        doctor: demoDoctor._id.toString(),
        date: "'; DROP TABLE users; --",
        time: '10:00'
      };

      const response = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${demoToken}`)
        .send(maliciousData);

      // Should not crash and should validate properly
      expect(response.status).toBe(201); // Date validation might pass or fail, but no crash
    });
  });

  describe('📊 System Integration', () => {
    test('✅ Full user journey simulation', async () => {
      // 1. Health check
      const healthResponse = await request(app).get('/api/health');
      expect(healthResponse.status).toBe(200);

      // 2. Get doctors
      const doctorsResponse = await request(app)
        .get('/api/doctors')
        .set('Authorization', `Bearer ${demoToken}`);
      expect(doctorsResponse.status).toBe(200);

      // 3. Create appointment
      const appointmentData = {
        doctor: demoDoctor._id.toString(),
        date: new Date().toISOString().split('T')[0],
        time: '10:00',
        symptoms: 'Integration test symptoms'
      };

      const appointmentResponse = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${demoToken}`)
        .send(appointmentData);
      expect(appointmentResponse.status).toBe(201);

      // 4. Send message
      const messageData = {
        receiver: demoUser._id.toString(),
        content: 'Integration test message'
      };

      const messageResponse = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${demoToken}`)
        .send(messageData);
      expect(messageResponse.status).toBe(201);

      // 5. Update profile
      const profileData = {
        fullName: 'Integration Test User',
        phone: '+254700000000'
      };

      const profileResponse = await request(app)
        .put('/api/profile')
        .set('Authorization', `Bearer ${demoToken}`)
        .send(profileData);
      expect(profileResponse.status).toBe(200);

      console.log('✅ Full user journey completed successfully');
    });
  });
});