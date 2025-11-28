"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const models_1 = require("../models");
const router = (0, express_1.Router)();
// Middleware to verify JWT
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: { message: 'Access token required' } });
        }
        // Verify the JWT token
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        // Find user in database
        const user = await models_1.UserModel.findById(decoded.userId);
        if (!user) {
            return res.status(403).json({ error: { message: 'User not found' } });
        }
        req.user = user;
        next();
    }
    catch (error) {
        console.error('Authentication error:', error);
        return res.status(403).json({ error: { message: 'Authentication failed' } });
    }
};
// Login route
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: { message: 'Email and password are required' } });
        }
        // Find user
        const user = await models_1.UserModel.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: { message: 'Invalid credentials' } });
        }
        // Check password
        const isValidPassword = await bcryptjs_1.default.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: { message: 'Invalid credentials' } });
        }
        // Generate JWT
        const token = jsonwebtoken_1.default.sign({ userId: user._id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.json({
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                },
                token
            }
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: { message: 'Login failed' } });
    }
});
// Signup route
router.post('/signup', async (req, res) => {
    try {
        const { name, email, password, role = 'patient' } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ error: { message: 'Name, email, and password are required' } });
        }
        // Check if user already exists
        const existingUser = await models_1.UserModel.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ error: { message: 'User already exists' } });
        }
        // Hash password
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        // Create user
        const user = new models_1.UserModel({
            name,
            email,
            password: hashedPassword,
            role
        });
        await user.save();
        // Create profile
        const profile = new models_1.ProfileModel({
            user: user._id,
            name,
            role
        });
        await profile.save();
        // Generate JWT
        const token = jsonwebtoken_1.default.sign({ userId: user._id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.status(201).json({
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                },
                token
            }
        });
    }
    catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: { message: 'Signup failed' } });
    }
});
// Get current user
router.get('/me', authenticateToken, async (req, res) => {
    try {
        res.json({
            data: {
                id: req.user._id,
                name: req.user.name,
                email: req.user.email,
                role: req.user.role
            }
        });
    }
    catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: { message: 'Failed to get user' } });
    }
});
exports.default = router;
