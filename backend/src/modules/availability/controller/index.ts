import { Request, Response } from 'express';
import { AvailabilityService } from '../service';
import { DoctorAvailability, PhysicalAppointment, PaymentIntent } from '../../../types';

export class AvailabilityController {
  // Doctor Status Management
  static async updateDoctorStatus(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: { message: 'Unauthorized' } });
      }

      if (req.user.role !== 'doctor') {
        return res.status(403).json({ error: { message: 'Only doctors can update availability status' } });
      }

      const { status, currentHospital, latitude, longitude } = req.body;

      if (!['available', 'busy', 'offline'].includes(status)) {
        return res.status(400).json({ error: { message: 'Invalid status. Must be available, busy, or offline' } });
      }

      const location = latitude && longitude ? { latitude, longitude } : undefined;

      const availability = await AvailabilityService.updateDoctorStatus(
        req.user._id,
        status,
        currentHospital,
        location
      );

      // Emit real-time update via Socket.io
      if (req.io) {
        req.io.emit('doctor-status-update', {
          doctorId: req.user._id,
          status,
          currentHospital,
          location,
          lastUpdated: availability.lastUpdated
        });
      }

      res.json({ data: availability });
    } catch (error) {
      console.error('Update doctor status error:', error);
      res.status(500).json({ error: { message: 'Failed to update doctor status' } });
    }
  }

  static async getDoctorStatus(req: Request, res: Response) {
    try {
      const { doctorId } = req.params;
      const availability = await AvailabilityService.getDoctorStatus(doctorId);

      if (!availability) {
        return res.status(404).json({ error: { message: 'Doctor availability not found' } });
      }

      res.json({ data: availability });
    } catch (error) {
      console.error('Get doctor status error:', error);
      res.status(500).json({ error: { message: 'Failed to get doctor status' } });
    }
  }

  static async getAllDoctorStatuses(req: Request, res: Response) {
    try {
      const availabilities = await AvailabilityService.getAllDoctorStatuses();
      res.json({ data: availabilities });
    } catch (error) {
      console.error('Get all doctor statuses error:', error);
      res.status(500).json({ error: { message: 'Failed to get doctor statuses' } });
    }
  }

  // Real-time Specialist Search
  static async searchAvailableSpecialists(req: Request, res: Response) {
    try {
      const { specialty, latitude, longitude, radius } = req.query;

      if (!specialty || typeof specialty !== 'string') {
        return res.status(400).json({ error: { message: 'Specialty is required' } });
      }

      const userLat = latitude ? parseFloat(latitude as string) : undefined;
      const userLng = longitude ? parseFloat(longitude as string) : undefined;
      const searchRadius = radius ? parseFloat(radius as string) : 50;

      const results = await AvailabilityService.searchAvailableSpecialists(
        specialty,
        userLat,
        userLng,
        searchRadius
      );

      res.json({ data: results });
    } catch (error) {
      console.error('Search specialists error:', error);
      res.status(500).json({ error: { message: 'Failed to search specialists' } });
    }
  }

  // Physical Appointment Booking
  static async createPhysicalAppointment(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: { message: 'Unauthorized' } });
      }

      const { doctor, hospital, date, time, symptoms, notes } = req.body;

      if (!doctor || !hospital || !date || !time) {
        return res.status(400).json({
          error: { message: 'Doctor, hospital, date, and time are required' }
        });
      }

      const appointment = await AvailabilityService.createPhysicalAppointment(
        req.user._id,
        doctor,
        hospital,
        new Date(date),
        time,
        symptoms,
        notes
      );

      // Emit real-time update
      if (req.io) {
        req.io.emit('appointment-created', {
          appointmentId: appointment._id,
          patientId: req.user._id,
          doctorId: doctor,
          hospital,
          date,
          time
        });
      }

      res.status(201).json({ data: appointment });
    } catch (error: any) {
      console.error('Create physical appointment error:', error);
      res.status(500).json({ error: { message: error.message || 'Failed to create appointment' } });
    }
  }

  static async getUserAppointments(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: { message: 'Unauthorized' } });
      }

      const appointments = await AvailabilityService.getUserAppointments(
        req.user._id,
        req.user.role
      );

      res.json({ data: appointments });
    } catch (error) {
      console.error('Get user appointments error:', error);
      res.status(500).json({ error: { message: 'Failed to get appointments' } });
    }
  }

  // Payment Integration
  static async initiatePayment(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: { message: 'Unauthorized' } });
      }

      const { appointmentId } = req.body;

      if (!appointmentId) {
        return res.status(400).json({ error: { message: 'Appointment ID is required' } });
      }

      // Get appointment details
      const appointment = await AvailabilityService.lockAppointmentSlot(appointmentId);

      // Create payment intent
      const paymentIntent = await AvailabilityService.createPaymentIntent(
        appointmentId,
        appointment.consultationFee
      );

      // Here you would integrate with IntaSend API
      // For now, we'll simulate the payment URL
      const paymentUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment/${paymentIntent._id}`;

      await AvailabilityService.updatePaymentIntent(
        paymentIntent._id,
        'pending',
        undefined,
        paymentUrl
      );

      res.json({
        data: {
          paymentIntentId: paymentIntent._id,
          paymentUrl,
          amount: appointment.consultationFee,
          expiresAt: paymentIntent.expiresAt
        }
      });
    } catch (error: any) {
      console.error('Initiate payment error:', error);
      res.status(500).json({ error: { message: error.message || 'Failed to initiate payment' } });
    }
  }

  static async handlePaymentCallback(req: Request, res: Response) {
    try {
      const { paymentIntentId, status, intasendRef } = req.body;

      if (!paymentIntentId || !status) {
        return res.status(400).json({ error: { message: 'Payment intent ID and status are required' } });
      }

      const paymentIntent = await AvailabilityService.getPaymentIntent(paymentIntentId);
      if (!paymentIntent) {
        return res.status(404).json({ error: { message: 'Payment intent not found' } });
      }

      // Update payment intent
      await AvailabilityService.updatePaymentIntent(
        paymentIntentId,
        status,
        intasendRef
      );

      if (status === 'completed') {
        // Confirm the appointment
        await AvailabilityService.confirmAppointmentPayment(
          paymentIntent.appointment.toString(),
          intasendRef || paymentIntentId
        );

        // Emit real-time update
        if (req.io) {
          req.io.emit('payment-completed', {
            appointmentId: paymentIntent.appointment,
            paymentRef: intasendRef || paymentIntentId
          });
        }
      } else if (status === 'failed' || status === 'cancelled') {
        // Release the locked appointment
        await AvailabilityService.releaseLockedAppointment(
          paymentIntent.appointment.toString()
        );
      }

      res.json({ data: { success: true } });
    } catch (error) {
      console.error('Payment callback error:', error);
      res.status(500).json({ error: { message: 'Payment callback processing failed' } });
    }
  }

  // Admin Panel Support
  static async getHospitalStats(req: Request, res: Response) {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ error: { message: 'Admin access required' } });
      }

      const { hospital } = req.params;

      if (!hospital) {
        return res.status(400).json({ error: { message: 'Hospital name is required' } });
      }

      const stats = await AvailabilityService.getHospitalStats(hospital);
      res.json({ data: stats });
    } catch (error) {
      console.error('Get hospital stats error:', error);
      res.status(500).json({ error: { message: 'Failed to get hospital stats' } });
    }
  }

  static async getAllHospitalStats(req: Request, res: Response) {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ error: { message: 'Admin access required' } });
      }

      // Get unique hospitals from doctor availabilities
      const hospitals = await AvailabilityService.getAllDoctorStatuses();
      const hospitalNames = [...new Set(hospitals.map(h => h.currentHospital).filter(Boolean))] as string[];

      const stats = await Promise.all(
        hospitalNames.map(hospital => AvailabilityService.getHospitalStats(hospital))
      );

      res.json({ data: stats });
    } catch (error) {
      console.error('Get all hospital stats error:', error);
      res.status(500).json({ error: { message: 'Failed to get hospital stats' } });
    }
  }
}