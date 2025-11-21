import { Router, Request, Response } from 'express';
import { ProfileModel } from '../models';

const router = Router();

// Get user profile
router.get('/profile', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: { message: 'Unauthorized' } });
    }

    const profile = await ProfileModel.findOne({ clerkId: req.user.clerkId });
    res.json({ data: profile });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: { message: 'Failed to get profile' } });
  }
});

// Update user profile
router.put('/profile', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: { message: 'Unauthorized' } });
    }

    const allowedFields = ['name', 'phone', 'role', 'location', 'age', 'gender', 'medicalConditions'];
    const updates: any = {};

    Object.keys(req.body).forEach(key => {
      if (allowedFields.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const profile = await ProfileModel.findOneAndUpdate(
      { clerkId: req.user.clerkId },
      {
        ...updates,
        clerkId: req.user.clerkId, // Ensure clerkId is set
        role: req.user.role // Ensure role matches user role
      },
      { new: true, upsert: true, runValidators: true }
    );
    res.json({ data: profile });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: { message: 'Failed to update profile' } });
  }
});

export default router;