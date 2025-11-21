import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import { verifyToken } from '@clerk/backend';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { UserModel as User, MessageModel } from './models';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import appointmentRoutes from './routes/appointments';
import messageRoutes from './routes/messages';
import adminRoutes from './routes/admin';
import doctorRoutes from './routes/doctors';
import uploadRoutes from './routes/uploads';
import prescriptionRoutes from './routes/prescriptions';

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});
const PORT = process.env.PORT || 5000;

// Validate required environment variables
if (!process.env.MONGODB_URI) {
  console.error('MONGODB_URI environment variable is required');
  process.exit(1);
}

if (!process.env.CLERK_SECRET_KEY) {
  console.error('CLERK_SECRET_KEY environment variable is required');
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
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

// Middleware to verify Clerk JWT and get user
const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: { message: 'Access token required' } });
    }

    // Allow demo token for testing
    if (token === 'demo-token') {
      // Create or find demo user
      let user = await User.findOne({ clerkId: 'demo-user-123' });
      if (!user) {
        user = new User({
          clerkId: 'demo-user-123',
          name: 'Demo User',
          email: 'demo@example.com',
          role: 'patient'
        });
        await user.save();
        console.log('Created demo user');
      }
      req.user = user;
      return next();
    }

    // Verify the Clerk JWT token
    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY!
    });

    if (!payload || !payload.sub) {
      return res.status(403).json({ error: { message: 'Invalid token' } });
    }

    // Debug logging
    console.log('Clerk payload:', {
      sub: payload.sub,
      email: payload.email,
      name: payload.name,
      firstName: payload.firstName,
      lastName: payload.lastName
    });

    // Find or create user in database
    let user = await User.findOne({ clerkId: payload.sub });
    if (!user) {
      // Ensure we have required fields
      const email = ((payload as any).email_addresses?.[0]?.email_address) ||
                   ((payload as any).email) ||
                   `${payload.sub}@clerk.local`;

      const name = payload.name ||
                  (payload.firstName && payload.lastName ? `${payload.firstName} ${payload.lastName}` : null) ||
                  `User ${payload.sub.slice(0, 8)}`;

      if (!email) {
        return res.status(400).json({ error: { message: 'Email is required for registration' } });
      }

      // Set role to admin for specific admin user (development)
      const isAdmin = payload.sub === 'user_35dSLGQuem62uwUzlgDOw1Wu8Pf';
      user = new User({
        clerkId: payload.sub,
        name: name,
        email: email,
        role: isAdmin ? 'admin' : 'patient'
      });

      console.log('Creating new user:', { clerkId: user.clerkId, name: user.name, email: user.email });
      await user.save();
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