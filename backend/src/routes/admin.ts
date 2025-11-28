import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { DoctorModel, UserModel, ProfileModel, AppointmentModel, PrescriptionModel } from '../models';

const router = Router();

// Get system statistics
router.get('/stats', async (req: Request, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: { message: 'Admin access required' } });
    }

    // Get counts for all entities
    const [totalUsers, totalDoctors, totalAppointments, totalPrescriptions] = await Promise.all([
      UserModel.countDocuments(),
      DoctorModel.countDocuments(),
      AppointmentModel.countDocuments(),
      PrescriptionModel.countDocuments()
    ]);

    // Get active users (users who have logged in recently - simplified)
    const activeUsers = totalUsers; // For now, consider all users active

    res.json({
      data: {
        totalUsers,
        totalDoctors,
        totalAppointments,
        totalPrescriptions,
        activeUsers,
        systemHealth: 'operational'
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: { message: 'Failed to get system statistics' } });
  }
});

// Get all users for admin management
router.get('/users', async (req: Request, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: { message: 'Admin access required' } });
    }

    const users = await UserModel.find({})
      .select('name email role createdAt updatedAt')
      .sort({ createdAt: -1 });

    res.json({ data: users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: { message: 'Failed to get users' } });
  }
});

// Update user role/status
router.put('/users/:id', async (req: Request, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: { message: 'Admin access required' } });
    }

    const { id } = req.params;
    const { name, email, role } = req.body;

    // Validate role
    if (role && !['patient', 'doctor', 'admin'].includes(role)) {
      return res.status(400).json({ error: { message: 'Invalid role' } });
    }

    const updatedUser = await UserModel.findByIdAndUpdate(
      id,
      { name, email, role },
      { new: true, runValidators: true }
    ).select('name email role createdAt updatedAt');

    if (!updatedUser) {
      return res.status(404).json({ error: { message: 'User not found' } });
    }

    res.json({ data: updatedUser });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: { message: 'Failed to update user' } });
  }
});

// Delete user (admin cannot delete themselves)
router.delete('/users/:id', async (req: Request, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: { message: 'Admin access required' } });
    }

    const { id } = req.params;

    // Prevent admin from deleting themselves
    if (req.user._id.toString() === id) {
      return res.status(400).json({ error: { message: 'Cannot delete your own admin account' } });
    }

    // Check if user exists
    const user = await UserModel.findById(id);
    if (!user) {
      return res.status(404).json({ error: { message: 'User not found' } });
    }

    // Delete associated profile if exists
    await ProfileModel.findOneAndDelete({ user: id });

    // Delete the user
    await UserModel.findByIdAndDelete(id);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: { message: 'Failed to delete user' } });
  }
});

// Get all doctors for admin
router.get('/doctors', async (req: Request, res: Response) => {
  try {
    // Allow demo access or admin role
    if (!req.user || (req.user.role !== 'admin' && req.user.email !== 'demo@example.com')) {
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
    if (!req.user || (req.user.role !== 'admin' && req.user.email !== 'demo@example.com')) {
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
      name: name.trim(),
      email: email.trim(),
      password: await bcrypt.hash('defaultpass123', 10),
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
      user: placeholderUser._id,
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
    if (!req.user || (req.user.role !== 'admin' && req.user.email !== 'demo@example.com')) {
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
    if (!req.user || (req.user.role !== 'admin' && req.user.email !== 'demo@example.com')) {
      return res.status(403).json({ error: { message: 'Admin access required' } });
    }

    const { id } = req.params;

    // Find the doctor first to get the user ID
    const doctor = await DoctorModel.findById(id).populate('user', '_id');
    if (!doctor) {
      return res.status(404).json({ error: { message: 'Doctor not found' } });
    }

    // Delete the doctor profile
    await DoctorModel.findByIdAndDelete(id);

    // Delete the associated user profile
    await ProfileModel.findOneAndDelete({ user: (doctor.user as any)._id });

    // Note: We don't delete the User document as it might be referenced elsewhere
    // In a production system, you might want to mark it as inactive instead

    res.json({ message: 'Doctor deleted successfully' });
  } catch (error) {
    console.error('Delete doctor error:', error);
    res.status(500).json({ error: { message: 'Failed to delete doctor' } });
  }
});


export default router;