import { Router, Request, Response } from 'express';
import { DoctorModel } from '../models';

const router = Router();

// Get all doctors with filtering
router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      specialty,
      city,
      hospital,
      minRating,
      maxFee,
      sortBy = 'rating',
      sortOrder = 'desc',
      page = '1',
      limit = '20'
    } = req.query;

    // Build filter object
    const filter: any = {};

    if (specialty) {
      filter.specialization = new RegExp(specialty.toString(), 'i');
    }

    if (city) {
      filter.city = new RegExp(city.toString(), 'i');
    }

    if (hospital) {
      filter.hospital = new RegExp(hospital.toString(), 'i');
    }

    if (minRating) {
      filter.rating = { ...filter.rating, $gte: parseFloat(minRating.toString()) };
    }

    if (maxFee) {
      filter.consultationFee = { ...filter.consultationFee, $lte: parseFloat(maxFee.toString()) };
    }

    // Build sort object
    const sort: any = {};
    const validSortFields = ['name', 'rating', 'consultationFee', 'reviewCount'];
    const sortField = validSortFields.includes(sortBy.toString()) ? sortBy.toString() : 'rating';
    sort[sortField] = sortOrder.toString() === 'asc' ? 1 : -1;

    // Pagination
    const pageNum = parseInt(page.toString()) || 1;
    const limitNum = parseInt(limit.toString()) || 20;
    const skip = (pageNum - 1) * limitNum;

    // Execute query
    const doctors = await DoctorModel.find(filter)
      .populate('user', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    const total = await DoctorModel.countDocuments(filter);

    res.json({
      data: doctors,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
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

// Get filter options (unique values for dropdowns)
router.get('/filters', async (req: Request, res: Response) => {
  try {
    const specialties = await DoctorModel.distinct('specialization');
    const cities = await DoctorModel.distinct('city');
    const hospitals = await DoctorModel.distinct('hospital');

    // Get rating range
    const ratingStats = await DoctorModel.aggregate([
      {
        $group: {
          _id: null,
          minRating: { $min: '$rating' },
          maxRating: { $max: '$rating' },
          minFee: { $min: '$consultationFee' },
          maxFee: { $max: '$consultationFee' }
        }
      }
    ]);

    const stats = ratingStats[0] || { minRating: 0, maxRating: 5, minFee: 0, maxFee: 10000 };

    res.json({
      data: {
        specialties: specialties.sort(),
        cities: cities.sort(),
        hospitals: hospitals.sort(),
        ratingRange: {
          min: Math.floor(stats.minRating),
          max: Math.ceil(stats.maxRating)
        },
        feeRange: {
          min: stats.minFee,
          max: stats.maxFee
        }
      }
    });
  } catch (error) {
    console.error('Get filter options error:', error);
    res.status(500).json({ error: { message: 'Failed to get filter options' } });
  }
});

export default router;