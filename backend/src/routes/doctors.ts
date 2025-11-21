import { Router, Request, Response } from 'express';
import { DoctorModel } from '../models';

const router = Router();

// Get all doctors
router.get('/', async (req: Request, res: Response) => {
  try {
    const doctors = await DoctorModel.find({}).populate('user', 'name email');
    res.json({ data: doctors });
  } catch (error) {
    console.error('Get doctors error:', error);
    res.status(500).json({ error: { message: 'Failed to get doctors' } });
  }
});

// Get doctors by city
router.get('/city/:city', async (req: Request, res: Response) => {
  try {
    const { city } = req.params;
    if (!city || city.trim().length === 0) {
      return res.status(400).json({ error: { message: 'City parameter is required' } });
    }

    const doctors = await DoctorModel.find({
      city: new RegExp(city.trim(), 'i')
    }).populate('user', 'name email');
    res.json({ data: doctors });
  } catch (error) {
    console.error('Get doctors by city error:', error);
    res.status(500).json({ error: { message: 'Failed to get doctors by city' } });
  }
});

// Get doctor appointments for a specific date
router.get('/:doctorId/appointments/:date', async (req: Request, res: Response) => {
  try {
    const { doctorId, date } = req.params;

    if (!doctorId || !date) {
      return res.status(400).json({ error: { message: 'Doctor ID and date are required' } });
    }

    // Parse the date and get start/end of day
    const appointmentDate = new Date(date);
    const startOfDay = new Date(appointmentDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(appointmentDate);
    endOfDay.setHours(23, 59, 59, 999);

    const { AppointmentModel } = await import('../models');

    const appointments = await AppointmentModel.find({
      doctor: doctorId,
      date: {
        $gte: startOfDay,
        $lte: endOfDay
      },
      status: { $in: ['pending', 'confirmed'] } // Only count booked slots
    }).select('time');

    res.json({ data: appointments });
  } catch (error) {
    console.error('Get doctor appointments error:', error);
    res.status(500).json({ error: { message: 'Failed to get doctor appointments' } });
  }
});

export default router;