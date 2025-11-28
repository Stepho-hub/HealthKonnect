import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { UserModel as User } from './models';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import appointmentRoutes from './routes/appointments';
import messageRoutes from './routes/messages';
import adminRoutes from './routes/admin';
import doctorRoutes from './routes/doctors';
import uploadRoutes from './routes/uploads';
import prescriptionRoutes from './routes/prescriptions';
import availabilityRoutes from './modules/availability/routes';
import { setupAvailabilitySocketHandlers } from './modules/availability/socket';
import { NotificationService } from './modules/availability/service/notifications';
import aiRoutes from './routes/ai';
import paymentRoutes from './routes/payments';
import { DoctorModel, UserModel, ProfileModel, AppointmentModel, MessageModel, PrescriptionModel, NotificationModel, PaymentModel } from './models';

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || ["http://localhost:3000", "http://localhost:5173"],
    methods: ["GET", "POST"]
  }
});
const PORT = process.env.PORT || 5001;

// Validate required environment variables
if (!process.env.MONGODB_URI) {
  console.error('MONGODB_URI environment variable is required');
  process.exit(1);
}

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET environment variable is required');
  process.exit(1);
}

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI!)
  .then(async () => {
    console.log('Connected to MongoDB');

    // Auto-seed database if empty
    const doctorCount = await DoctorModel.countDocuments();
    if (doctorCount === 0) {
      console.log('Database is empty, seeding with mock data...');
      await seedDatabase();
    } else {
      console.log(`Database already has ${doctorCount} doctors`);
    }

    // Initialize notification service
    const notificationService = new NotificationService(io);
    console.log('Notification service initialized');

    // Setup availability socket handlers
    setupAvailabilitySocketHandlers(io);
    console.log('Availability socket handlers initialized');
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Auto-seed function
async function seedDatabase() {
  try {
    // Sample doctors data
    const doctorsData = [
      {
        name: 'Dr. Sarah Njeri',
        specialization: 'Cardiology',
        city: 'Nairobi',
        hospital: 'Kenyatta National Hospital',
        rating: 4.8,
        reviewCount: 127,
        consultationFee: 5000,
        latitude: -1.2864,
        longitude: 36.8172,
        availableSlots: ['09:00', '10:00', '14:00', '15:00', '16:00']
      },
      {
        name: 'Dr. Michael Wanyoike',
        specialization: 'Dermatology',
        city: 'Nairobi',
        hospital: 'Nairobi Hospital',
        rating: 4.6,
        reviewCount: 89,
        consultationFee: 4500,
        latitude: -1.2864,
        longitude: 36.8172,
        availableSlots: ['08:00', '11:00', '13:00', '15:00', '17:00']
      },
      {
        name: 'Dr. Grace Wanjiku',
        specialization: 'Pediatrics',
        city: 'Nairobi',
        hospital: 'Mater Hospital',
        rating: 4.9,
        reviewCount: 156,
        consultationFee: 4000,
        latitude: -1.2864,
        longitude: 36.8172,
        availableSlots: ['09:00', '10:00', '11:00', '14:00', '16:00']
      }
    ];

    // Sample patients data
    const patientsData = [
      { name: 'Alice Wanjiku', email: 'alice.wanjiku@email.com', phone: '+254712345678', age: 28, gender: 'Female', location: 'Nairobi', medicalConditions: ['Hypertension'] },
      { name: 'Bob Kiprop', email: 'bob.kiprop@email.com', phone: '+254723456789', age: 35, gender: 'Male', location: 'Eldoret', medicalConditions: ['Diabetes'] },
      { name: 'James Mwangi', email: 'jamesmwangi@test.com', phone: '+254700000001', age: 30, gender: 'Male', location: 'Nairobi', medicalConditions: ['Flu'] },
      { name: 'Josephine Mokaya', email: 'josephine@test.com', phone: '+254700000002', age: 25, gender: 'Female', location: 'Nairobi', medicalConditions: ['Headache'] }
    ];

    // Create doctors
    for (const doctorData of doctorsData) {
      const placeholderUser = new UserModel({
        name: doctorData.name,
        email: `${doctorData.name.toLowerCase().replace(/\s+/g, '.')}@h-konnect.com`,
        password: await bcrypt.hash('defaultpass123', 10),
        role: 'doctor'
      });
      await placeholderUser.save();

      const doctor = new DoctorModel({
        user: placeholderUser._id,
        ...doctorData
      });
      await doctor.save();
      console.log(`Created doctor: ${doctorData.name}`);
    }

    // Create patients
    for (const patientData of patientsData) {
      const patientUser = new UserModel({
        name: patientData.name,
        email: patientData.email,
        password: await bcrypt.hash('defaultpass123', 10),
        role: 'patient'
      });
      await patientUser.save();

      const profile = new ProfileModel({
        user: patientUser._id,
        name: patientData.name,
        phone: patientData.phone,
        role: 'patient',
        location: patientData.location,
        age: patientData.age,
        gender: patientData.gender,
        medicalConditions: patientData.medicalConditions || []
      });
      await profile.save();

      console.log(`Created patient: ${patientData.name}`);
    }

    // Create admin
    const adminUser = new UserModel({
      name: 'Admin User',
      email: 'admin@healthkonnect.com',
      password: await bcrypt.hash('admin123', 10),
      role: 'admin'
    });
    await adminUser.save();

    const adminProfile = new ProfileModel({
      user: adminUser._id,
      name: 'Admin User',
      phone: '+254711111111',
      role: 'admin',
      location: 'Nairobi',
      age: 35,
      gender: 'Male',
      medicalConditions: []
    });
    await adminProfile.save();

    console.log('Auto-seeding completed successfully!');
  } catch (error) {
    console.error('Auto-seeding failed:', error);
  }
}

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

// Middleware to verify JWT and get user
const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: { message: 'Access token required' } });
    }

    // Verify the JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

    // Find user in database
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(403).json({ error: { message: 'User not found' } });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(403).json({ error: { message: 'Authentication failed' } });
  }
};

// Routes
app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'HealthKonnect API is running', version: '1.0.0' });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', authenticateToken, userRoutes);
app.use('/api/appointments', authenticateToken, appointmentRoutes);
app.use('/api/messages', authenticateToken, messageRoutes);
app.use('/api/admin', authenticateToken, adminRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/uploads', authenticateToken, uploadRoutes);
app.use('/api/prescriptions', authenticateToken, prescriptionRoutes);
app.use('/api/availability', authenticateToken, availabilityRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/payments', authenticateToken, paymentRoutes);

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Error handling middleware
app.use((error: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ error: { message: 'Internal server error' } });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-room', (roomId: string) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room ${roomId}`);
  });

  socket.on('send-message', async (data: { roomId: string; message: any }) => {
    try {
      // Save message to database
      const message = new MessageModel(data.message);
      await message.save();

      // Emit to room
      io.to(data.roomId).emit('receive-message', message);
    } catch (error) {
      console.error('Socket message error:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });

  // Video consultation handlers
  socket.on('join-consultation-room', (data: { appointmentId: string; userId: string; userType: string }) => {
    const roomId = `consultation-${data.appointmentId}`;
    socket.join(roomId);
    console.log(`User ${socket.id} joined consultation room ${roomId}`);

    // Notify others in the room that someone joined
    socket.to(roomId).emit('consultation-started');
  });

  socket.on('offer', (data: { offer: any; appointmentId: string }) => {
    const roomId = `consultation-${data.appointmentId}`;
    console.log(`Received offer for room ${roomId}`);
    socket.to(roomId).emit('offer', data);
  });

  socket.on('answer', (data: { answer: any; appointmentId: string }) => {
    const roomId = `consultation-${data.appointmentId}`;
    console.log(`Received answer for room ${roomId}`);
    socket.to(roomId).emit('answer', data);
  });

  socket.on('ice-candidate', (data: { candidate: any; appointmentId: string }) => {
    const roomId = `consultation-${data.appointmentId}`;
    console.log(`Received ICE candidate for room ${roomId}`);
    socket.to(roomId).emit('ice-candidate', data);
  });

  socket.on('end-call', (data: { appointmentId: string }) => {
    const roomId = `consultation-${data.appointmentId}`;
    console.log(`Call ended for room ${roomId}`);
    socket.to(roomId).emit('call-ended');
  });

  socket.on('chat-message', (data: { appointmentId: string; message: string; sender: string }) => {
    const roomId = `consultation-${data.appointmentId}`;
    console.log(`Chat message in room ${roomId} from ${data.sender}`);
    socket.to(roomId).emit('chat-message', {
      sender: data.sender,
      message: data.message,
      timestamp: new Date()
    });
  });
});


// 404 handler for API routes
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: { message: 'Route not found' } });
});

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Health check available at http://localhost:${PORT}/api/health`);
  });
}

// Export app for testing
export { app, server, io };