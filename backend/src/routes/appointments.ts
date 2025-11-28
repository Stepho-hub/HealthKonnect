import { Router, Request, Response } from 'express';
import { AppointmentModel, DoctorModel } from '../models';

const router = Router();

// Create appointment
router.post('/', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: { message: 'Unauthorized' } });
    }

    const { doctor, date, time, symptoms, notes } = req.body;

    if (!doctor || !date || !time) {
      return res.status(400).json({ error: { message: 'Doctor, date, and time are required' } });
    }

    const doctorDoc = await DoctorModel.findById(doctor);
    if (!doctorDoc) {
      return res.status(404).json({ error: { message: 'Doctor not found' } });
    }

    const appointment = new AppointmentModel({
      patient: req.user._id,
      doctor: doctorDoc.user, // Reference the doctor's user ID
      date: new Date(date),
      time: time.trim(),
      symptoms: symptoms?.trim(),
      notes: notes?.trim()
    });

    await appointment.save();
    await appointment.populate('patient', 'name email');
    await appointment.populate('doctor', 'name email');

    res.status(201).json({ data: appointment });
  } catch (error) {
    console.error('Create appointment error:', error);
    res.status(500).json({ error: { message: 'Failed to create appointment' } });
  }
});

// Get user appointments
router.get('/', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: { message: 'Unauthorized' } });
    }

    const appointments = await AppointmentModel.find({
      $or: [{ patient: req.user._id }, { doctor: req.user._id }]
    })
    .populate('patient', 'name email')
    .populate('doctor', 'name email specialization')
    .sort({ date: -1, time: -1 });

    res.json({ data: appointments });
  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({ error: { message: 'Failed to get appointments' } });
  }
});

export default router;