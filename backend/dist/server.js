"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = exports.server = exports.app = void 0;
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const backend_1 = require("@clerk/backend");
const dotenv_1 = __importDefault(require("dotenv"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const path_1 = __importDefault(require("path"));
const models_1 = require("./models");
const auth_1 = __importDefault(require("./routes/auth"));
const users_1 = __importDefault(require("./routes/users"));
const appointments_1 = __importDefault(require("./routes/appointments"));
const messages_1 = __importDefault(require("./routes/messages"));
const admin_1 = __importDefault(require("./routes/admin"));
const doctors_1 = __importDefault(require("./routes/doctors"));
const uploads_1 = __importDefault(require("./routes/uploads"));
const prescriptions_1 = __importDefault(require("./routes/prescriptions"));
const models_2 = require("./models");
dotenv_1.default.config();
const app = (0, express_1.default)();
exports.app = app;
const server = (0, http_1.createServer)(app);
exports.server = server;
const io = new socket_io_1.Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});
exports.io = io;
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
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Serve static files from uploads directory
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../uploads')));
// MongoDB connection
mongoose_1.default.connect(process.env.MONGODB_URI)
    .then(async () => {
    console.log('Connected to MongoDB');
    // Auto-seed database if empty
    const doctorCount = await models_2.DoctorModel.countDocuments();
    if (doctorCount === 0) {
        console.log('Database is empty, seeding with mock data...');
        await seedDatabase();
    }
    else {
        console.log(`Database already has ${doctorCount} doctors`);
    }
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
                name: 'Dr. Sarah Johnson',
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
                name: 'Dr. Michael Chen',
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
            { name: 'Test Patient 1', email: 'patient1@test.com', phone: '+254700000001', age: 30, gender: 'Male', location: 'Nairobi', medicalConditions: ['Flu'] },
            { name: 'Test Patient 2', email: 'patient2@test.com', phone: '+254700000002', age: 25, gender: 'Female', location: 'Nairobi', medicalConditions: ['Headache'] }
        ];
        // Create doctors
        for (const doctorData of doctorsData) {
            const placeholderUser = new models_2.UserModel({
                clerkId: `doctor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                name: doctorData.name,
                email: `${doctorData.name.toLowerCase().replace(/\s+/g, '.')}@h-konnect.com`,
                role: 'doctor'
            });
            await placeholderUser.save();
            const doctor = new models_2.DoctorModel({
                user: placeholderUser._id,
                ...doctorData
            });
            await doctor.save();
            console.log(`Created doctor: ${doctorData.name}`);
        }
        // Create patients
        for (const patientData of patientsData) {
            const patientUser = new models_2.UserModel({
                clerkId: `patient_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                name: patientData.name,
                email: patientData.email,
                role: 'patient'
            });
            await patientUser.save();
            const profile = new models_2.ProfileModel({
                clerkId: patientUser.clerkId,
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
        const adminUser = new models_2.UserModel({
            clerkId: `admin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: 'Admin User',
            email: 'admin@healthkonnect.com',
            role: 'admin'
        });
        await adminUser.save();
        const adminProfile = new models_2.ProfileModel({
            clerkId: adminUser.clerkId,
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
    }
    catch (error) {
        console.error('Auto-seeding failed:', error);
    }
}
// Middleware to verify Clerk JWT and get user
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: { message: 'Access token required' } });
        }
        // Allow demo token for testing
        if (token === 'demo-token') {
            // Create or find demo user
            let user = await models_1.UserModel.findOne({ clerkId: 'demo-user-123' });
            if (!user) {
                user = new models_1.UserModel({
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
        const payload = await (0, backend_1.verifyToken)(token, {
            secretKey: process.env.CLERK_SECRET_KEY
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
        let user = await models_1.UserModel.findOne({ clerkId: payload.sub });
        if (!user) {
            // Ensure we have required fields
            const email = (payload.email_addresses?.[0]?.email_address) ||
                (payload.email) ||
                `${payload.sub}@clerk.local`;
            const name = payload.name ||
                (payload.firstName && payload.lastName ? `${payload.firstName} ${payload.lastName}` : null) ||
                `User ${payload.sub.slice(0, 8)}`;
            if (!email) {
                return res.status(400).json({ error: { message: 'Email is required for registration' } });
            }
            // Set role to admin for specific admin user (development)
            const isAdmin = payload.sub === 'user_35dSLGQuem62uwUzlgDOw1Wu8Pf';
            user = new models_1.UserModel({
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
    }
    catch (error) {
        console.error('Authentication error:', error);
        return res.status(403).json({ error: { message: 'Authentication failed' } });
    }
};
// Routes
app.get('/', (req, res) => {
    res.json({ message: 'HealthKonnect API is running', version: '1.0.0' });
});
app.use('/api/auth', auth_1.default);
app.use('/api/users', authenticateToken, users_1.default);
app.use('/api/appointments', authenticateToken, appointments_1.default);
app.use('/api/messages', authenticateToken, messages_1.default);
app.use('/api/admin', authenticateToken, admin_1.default);
app.use('/api/doctors', doctors_1.default);
app.use('/api/uploads', authenticateToken, uploads_1.default);
app.use('/api/prescriptions', authenticateToken, prescriptions_1.default);
// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});
// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    res.status(500).json({ error: { message: 'Internal server error' } });
});
// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    socket.on('join-room', (roomId) => {
        socket.join(roomId);
        console.log(`User ${socket.id} joined room ${roomId}`);
    });
    socket.on('send-message', async (data) => {
        try {
            // Save message to database
            const message = new models_2.MessageModel(data.message);
            await message.save();
            // Emit to room
            io.to(data.roomId).emit('receive-message', message);
        }
        catch (error) {
            console.error('Socket message error:', error);
        }
    });
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});
// 404 handler for API routes
app.use((req, res) => {
    res.status(404).json({ error: { message: 'Route not found' } });
});
if (require.main === module) {
    server.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        console.log(`Health check available at http://localhost:${PORT}/api/health`);
    });
}
