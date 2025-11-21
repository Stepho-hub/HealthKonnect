import { Router, Request, Response } from 'express';
import { DoctorModel, UserModel, ProfileModel } from '../models';

const router = Router();

// Get all doctors for admin
router.get('/doctors', async (req: Request, res: Response) => {
  try {
    // Allow demo access or admin role
    if (!req.user || (req.user.role !== 'admin' && req.user.clerkId !== 'demo-user-123')) {
      return res.status(403).json({ error: { message: 'Admin access required' } });
    }

    const doctors = await DoctorModel.find({})
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    res.json({ data: doctors });
  } catch (error) {
    console.error('Get admin doctors error:', error);
    res.status(500).json({ error: { message: 'Failed to get doctors' } });
  }
});

// Add doctor
router.post('/doctors', async (req: Request, res: Response) => {
  try {
    if (!req.user || (req.user.role !== 'admin' && req.user.clerkId !== 'demo-user-123')) {
      return res.status(403).json({ error: { message: 'Admin access required' } });
    }

    const {
      name, email, phone, address, specialization, licenseNumber,
      experience, hospital, bio, consultationFee, city
    } = req.body;

    // Validate required fields
    if (!name || !email || !specialization || !licenseNumber || !hospital || !city) {
      return res.status(400).json({
        error: { message: 'Name, email, specialization, license number, hospital, and city are required' }
      });
    }

    // Check if doctor already exists
    const existingDoctor = await DoctorModel.findOne({
      $or: [
        { 'user.email': email },
        { licenseNumber: licenseNumber }
      ]
    });

    if (existingDoctor) {
      return res.status(400).json({ error: { message: 'Doctor with this email or license number already exists' } });
    }

    // Create a placeholder user for the doctor
    const placeholderUser = await UserModel.create({
      clerkId: `placeholder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: name.trim(),
      email: email.trim(),
      role: 'doctor'
    });

    // Create doctor profile
    const doctor = await DoctorModel.create({
      user: placeholderUser._id,
      name: name.trim(),
      specialization: specialization.trim(),
      city: city.trim(),
      hospital: hospital.trim(),
      rating: 0,
      reviewCount: 0,
      consultationFee: consultationFee || 0,
      latitude: 0, // Will be updated later
      longitude: 0  // Will be updated later
    });

    // Create doctor profile details
    await ProfileModel.create({
      clerkId: placeholderUser.clerkId,
      name: name.trim(),
      phone: phone?.trim() || '',
      location: address?.trim() || '',
      role: 'doctor'
    });

    res.status(201).json({
      data: {
        doctor: doctor,
        message: 'Doctor added successfully. They can now sign up using their email.'
      }
    });
  } catch (error) {
    console.error('Add doctor error:', error);
    res.status(500).json({ error: { message: 'Failed to add doctor' } });
  }
});

// Update doctor
router.put('/doctors/:id', async (req: Request, res: Response) => {
  try {
    if (!req.user || (req.user.role !== 'admin' && req.user.clerkId !== 'demo-user-123')) {
      return res.status(403).json({ error: { message: 'Admin access required' } });
    }

    const { id } = req.params;
    const { name, specialization, city, hospital, consultationFee } = req.body;

    const updatedDoctor = await DoctorModel.findByIdAndUpdate(
      id,
      {
        name: name?.trim(),
        specialization: specialization?.trim(),
        city: city?.trim(),
        hospital: hospital?.trim(),
        consultationFee: consultationFee || 0
      },
      { new: true }
    ).populate('user', 'name email');

    if (!updatedDoctor) {
      return res.status(404).json({ error: { message: 'Doctor not found' } });
    }

    res.json({ data: updatedDoctor });
  } catch (error) {
    console.error('Update doctor error:', error);
    res.status(500).json({ error: { message: 'Failed to update doctor' } });
  }
});

// Delete doctor
router.delete('/doctors/:id', async (req: Request, res: Response) => {
  try {
    if (!req.user || (req.user.role !== 'admin' && req.user.clerkId !== 'demo-user-123')) {
      return res.status(403).json({ error: { message: 'Admin access required' } });
    }

    const { id } = req.params;

    // Find the doctor first to get the user ID
    const doctor = await DoctorModel.findById(id).populate('user', 'clerkId');
    if (!doctor) {
      return res.status(404).json({ error: { message: 'Doctor not found' } });
    }

    // Delete the doctor profile
    await DoctorModel.findByIdAndDelete(id);

    // Delete the associated user profile
    await ProfileModel.findOneAndDelete({ clerkId: (doctor.user as any).clerkId });

    // Note: We don't delete the User document as it might be referenced elsewhere
    // In a production system, you might want to mark it as inactive instead

    res.json({ message: 'Doctor deleted successfully' });
  } catch (error) {
    console.error('Delete doctor error:', error);
    res.status(500).json({ error: { message: 'Failed to delete doctor' } });
  }
});

export default router;