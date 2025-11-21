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
const models_1 = require("./models");
const auth_1 = __importDefault(require("./routes/auth"));
const users_1 = __importDefault(require("./routes/users"));
const appointments_1 = __importDefault(require("./routes/appointments"));
const messages_1 = __importDefault(require("./routes/messages"));
const admin_1 = __importDefault(require("./routes/admin"));
const doctors_1 = __importDefault(require("./routes/doctors"));
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
// MongoDB connection
mongoose_1.default.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
});
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
app.use('/api/users', users_1.default);
app.use('/api/appointments', appointments_1.default);
app.use('/api/messages', messages_1.default);
app.use('/api/admin', admin_1.default);
app.use('/api/doctors', doctors_1.default);
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
            const message = new models_1.MessageModel(data.message);
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
// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: { message: 'Route not found' } });
});
if (require.main === module) {
    server.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        console.log(`Health check available at http://localhost:${PORT}/api/health`);
    });
}
