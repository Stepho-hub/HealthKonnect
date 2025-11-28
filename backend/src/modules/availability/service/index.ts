import { DoctorAvailabilityModel, PhysicalAppointmentModel, PaymentIntentModel, DoctorModel } from '../../../models';
import { DoctorAvailability, PhysicalAppointment, PaymentIntent, AvailabilitySearchResult } from '../../../types';

export class AvailabilityService {
  // Doctor Status Management
  static async updateDoctorStatus(
    doctorId: string,
    status: 'available' | 'busy' | 'offline',
    currentHospital?: string,
    location?: { latitude: number; longitude: number }
  ): Promise<DoctorAvailability> {
    const updateData: Partial<DoctorAvailability> = {
      status,
      lastUpdated: new Date()
    };

    if (currentHospital) updateData.currentHospital = currentHospital;
    if (location) updateData.location = location;

    const availability = await DoctorAvailabilityModel.findOneAndUpdate(
      { doctor: doctorId },
      updateData,
      { new: true, upsert: true, runValidators: true }
    );

    return availability;
  }

  static async getDoctorStatus(doctorId: string): Promise<DoctorAvailability | null> {
    return DoctorAvailabilityModel.findOne({ doctor: doctorId });
  }

  static async getAllDoctorStatuses(): Promise<DoctorAvailability[]> {
    return DoctorAvailabilityModel.find({}).populate('doctor', 'name email');
  }

  // Real-time Specialist Search
  static async searchAvailableSpecialists(
    specialty: string,
    userLat?: number,
    userLng?: number,
    radiusKm: number = 50
  ): Promise<AvailabilitySearchResult[]> {
    // Find doctors with matching specialty who are available
    const availableDoctors = await DoctorAvailabilityModel.find({
      status: 'available'
    }).populate({
      path: 'doctor',
      populate: {
        path: 'user',
        select: 'name email'
      }
    });

    const results: AvailabilitySearchResult[] = [];

    for (const availability of availableDoctors) {
      const doctor = await DoctorModel.findOne({ user: availability.doctor });

      if (doctor && doctor.specialization.toLowerCase().includes(specialty.toLowerCase())) {
        // Calculate distance if user location provided
        let distance: number | undefined;
        if (userLat && userLng && availability.location) {
          distance = this.calculateDistance(
            userLat, userLng,
            availability.location.latitude, availability.location.longitude
          );
        }

        // Only include if within radius or no location filtering
        if (!distance || distance <= radiusKm) {
          results.push({
            doctor: {
              _id: doctor._id,
              name: doctor.name,
              specialization: doctor.specialization,
              rating: doctor.rating || 0,
              reviewCount: doctor.reviewCount || 0,
              consultationFee: doctor.consultationFee || 0
            },
            hospital: availability.currentHospital || doctor.hospital || 'Not specified',
            distance,
            isAvailableNow: true,
            nextAvailableTime: undefined // Could be enhanced to show next available slot
          });
        }
      }
    }

    return results.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
  }

  // Physical Appointment Booking
  static async createPhysicalAppointment(
    patientId: string,
    doctorId: string,
    hospital: string,
    date: Date,
    time: string,
    symptoms?: string,
    notes?: string
  ): Promise<PhysicalAppointment> {
    // Check if slot is available (not already booked)
    const existingAppointment = await PhysicalAppointmentModel.findOne({
      doctor: doctorId,
      hospital,
      date,
      time,
      status: { $in: ['pending', 'confirmed', 'locked'] }
    });

    if (existingAppointment) {
      throw new Error('Time slot is not available');
    }

    // Get doctor's consultation fee
    const doctor = await DoctorModel.findOne({ user: doctorId });
    if (!doctor) {
      throw new Error('Doctor not found');
    }

    const appointment = new PhysicalAppointmentModel({
      patient: patientId,
      doctor: doctorId,
      hospital,
      date,
      time,
      symptoms,
      notes,
      consultationFee: doctor.consultationFee || 0
    });

    return appointment.save();
  }

  static async lockAppointmentSlot(appointmentId: string, lockDurationMinutes: number = 2): Promise<PhysicalAppointment> {
    const lockUntil = new Date();
    lockUntil.setMinutes(lockUntil.getMinutes() + lockDurationMinutes);

    const appointment = await PhysicalAppointmentModel.findByIdAndUpdate(
      appointmentId,
      {
        status: 'locked',
        lockedUntil: lockUntil
      },
      { new: true }
    );

    if (!appointment) {
      throw new Error('Appointment not found');
    }

    return appointment;
  }

  static async confirmAppointmentPayment(appointmentId: string, paymentRef: string): Promise<PhysicalAppointment> {
    const appointment = await PhysicalAppointmentModel.findByIdAndUpdate(
      appointmentId,
      {
        status: 'confirmed',
        paymentRef
      },
      { new: true }
    );

    if (!appointment) {
      throw new Error('Appointment not found');
    }

    return appointment;
  }

  static async releaseLockedAppointment(appointmentId: string): Promise<PhysicalAppointment> {
    const appointment = await PhysicalAppointmentModel.findByIdAndUpdate(
      appointmentId,
      {
        status: 'pending',
        $unset: { lockedUntil: 1 }
      },
      { new: true }
    );

    if (!appointment) {
      throw new Error('Appointment not found');
    }

    return appointment;
  }

  // Payment Integration
  static async createPaymentIntent(appointmentId: string, amount: number): Promise<PaymentIntent> {
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15); // 15 minutes to complete payment

    const paymentIntent = new PaymentIntentModel({
      appointment: appointmentId,
      amount,
      expiresAt
    });

    return paymentIntent.save();
  }

  static async updatePaymentIntent(
    paymentIntentId: string,
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled',
    intasendRef?: string,
    paymentUrl?: string
  ): Promise<PaymentIntent> {
    const paymentIntent = await PaymentIntentModel.findByIdAndUpdate(
      paymentIntentId,
      { status, intasendRef, paymentUrl },
      { new: true }
    ) as PaymentIntent | null;

    if (!paymentIntent) {
      throw new Error('Payment intent not found');
    }

    return paymentIntent;
  }

  static async getPaymentIntent(paymentIntentId: string): Promise<PaymentIntent | null> {
    return PaymentIntentModel.findById(paymentIntentId);
  }

  // Utility Methods
  private static calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  // Cleanup expired locks (should be called by cron job)
  static async cleanupExpiredLocks(): Promise<void> {
    const now = new Date();
    await PhysicalAppointmentModel.updateMany(
      {
        status: 'locked',
        lockedUntil: { $lt: now }
      },
      {
        status: 'pending',
        $unset: { lockedUntil: 1 }
      }
    );
  }

  // Get appointments for user
  static async getUserAppointments(userId: string, userRole: string): Promise<PhysicalAppointment[]> {
    const query = userRole === 'doctor'
      ? { doctor: userId }
      : { patient: userId };

    return PhysicalAppointmentModel.find(query)
      .populate('patient', 'name email')
      .populate('doctor', 'name email')
      .sort({ date: -1, time: -1 });
  }

  // Admin methods
  static async getHospitalStats(hospitalName: string): Promise<any> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      activeDoctors,
      todayAppointments,
      pendingAppointments
    ] = await Promise.all([
      DoctorAvailabilityModel.countDocuments({
        currentHospital: hospitalName,
        status: 'available'
      }),
      PhysicalAppointmentModel.countDocuments({
        hospital: hospitalName,
        date: { $gte: today },
        status: { $in: ['confirmed', 'completed'] }
      }),
      PhysicalAppointmentModel.countDocuments({
        hospital: hospitalName,
        status: 'pending'
      })
    ]);

    return {
      hospital: hospitalName,
      activeDoctors,
      todayAppointments,
      pendingAppointments
    };
  }
}