import { Router, Request, Response } from 'express';
import { ProfileModel, AppointmentModel } from '../models';

const router = Router();

// Get user profile
router.get('/profile', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: { message: 'Unauthorized' } });
    }

    const profile = await ProfileModel.findOne({ user: req.user._id });
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
      { user: req.user._id },
      {
        ...updates,
        user: req.user._id, // Ensure user is set
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

// Get patient profile (for doctors)
router.get('/patient/:patientId', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: { message: 'Unauthorized' } });
    }

    // Only doctors can access patient profiles
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ error: { message: 'Access denied. Doctor role required.' } });
    }

    const { patientId } = req.params;

    // Check if doctor has an appointment with this patient
    const hasAppointment = await AppointmentModel.findOne({
      doctor: req.user._id,
      patient: patientId
    });

    if (!hasAppointment) {
      return res.status(403).json({ error: { message: 'Access denied. No appointment relationship found.' } });
    }

    const profile = await ProfileModel.findOne({ user: patientId });
    if (!profile) {
      return res.status(404).json({ error: { message: 'Patient profile not found' } });
    }

    res.json({ data: profile });
  } catch (error) {
    console.error('Get patient profile error:', error);
    res.status(500).json({ error: { message: 'Failed to get patient profile' } });
  }
});

// Get all patients for a doctor (patients they've had appointments with)
router.get('/doctor/patients', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: { message: 'Unauthorized' } });
    }

    // Only doctors can access this endpoint
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ error: { message: 'Access denied. Doctor role required.' } });
    }

    // Find all unique patients the doctor has had appointments with
    const patientIds = await AppointmentModel.distinct('patient', { doctor: req.user._id });

    // Get profiles for these patients
    const profiles = await ProfileModel.find({ user: { $in: patientIds } })
      .populate('user', 'name email');

    res.json({ data: profiles });
  } catch (error) {
    console.error('Get doctor patients error:', error);
    res.status(500).json({ error: { message: 'Failed to get patients' } });
  }
});

export default router;