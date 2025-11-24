import { Router } from 'express';
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { UserModel, ProfileModel } from '../models';

const router = Router();

// Login route
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: { message: 'Email and password are required' } });
    }

    // Find user
    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: { message: 'Invalid credentials' } });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: { message: 'Invalid credentials' } });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

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
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: { message: 'Login failed' } });
  }
});

// Signup route
router.post('/signup', async (req: Request, res: Response) => {
  try {
    const { name, email, password, role = 'patient' } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: { message: 'Name, email, and password are required' } });
    }

    // Check if user already exists
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ error: { message: 'User already exists' } });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = new UserModel({
      name,
      email,
      password: hashedPassword,
      role
    });
    await user.save();

    // Create profile
    const profile = new ProfileModel({
      user: user._id,
      name,
      role
    });
    await profile.save();

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

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
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: { message: 'Signup failed' } });
  }
});

// Get current user
router.get('/me', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: { message: 'Not authenticated' } });
    }

    res.json({
      data: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: { message: 'Failed to get user' } });
  }
});

export default router;