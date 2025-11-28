import sgMail from '@sendgrid/mail';
import twilio from 'twilio';
import { Server } from 'socket.io';
import * as cron from 'node-cron';
import { PhysicalAppointmentModel, UserModel, ProfileModel } from '../../../models';

export class NotificationService {
  private io: Server;

  constructor(io: Server) {
    this.io = io;
    this.initializeServices();
    this.setupCronJobs();
  }

  private initializeServices() {
    // Initialize SendGrid
    if (process.env.SENDGRID_API_KEY) {
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    }

    // Initialize Twilio (if credentials provided)
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      // Twilio client will be initialized when needed
    }
  }

  private setupCronJobs() {
    // Send appointment reminders 1 hour before
    cron.schedule('0 * * * *', async () => {
      await this.sendAppointmentReminders();
    });

    // Send appointment reminders 24 hours before
    cron.schedule('0 9 * * *', async () => {
      await this.sendDailyAppointmentReminders();
    });
  }

  // Email Notifications
  async sendAppointmentConfirmationEmail(appointmentId: string): Promise<void> {
    try {
      const appointment = await PhysicalAppointmentModel.findById(appointmentId)
        .populate('patient', 'name email')
        .populate('doctor', 'name email');

      if (!appointment) return;

      const patient = appointment.patient as any;
      const doctor = appointment.doctor as any;

      const msg = {
        to: patient.email,
        from: process.env.FROM_EMAIL || 'noreply@healthkonnect.com',
        subject: 'Appointment Confirmed - HealthKonnect',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Appointment Confirmed</h2>
            <p>Dear ${patient.name},</p>
            <p>Your appointment has been successfully booked and confirmed.</p>

            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3>Appointment Details:</h3>
              <p><strong>Doctor:</strong> ${doctor.name}</p>
              <p><strong>Hospital:</strong> ${appointment.hospital}</p>
              <p><strong>Date:</strong> ${appointment.date.toDateString()}</p>
              <p><strong>Time:</strong> ${appointment.time}</p>
              <p><strong>Consultation Fee:</strong> KES ${appointment.consultationFee}</p>
            </div>

            <p>Please arrive 15 minutes before your appointment time.</p>
            <p>If you need to reschedule or cancel, please contact us at least 24 hours in advance.</p>

            <p>Best regards,<br>HealthKonnect Team</p>
          </div>
        `
      };

      if (process.env.SENDGRID_API_KEY) {
        await sgMail.send(msg);
        console.log('Appointment confirmation email sent to:', patient.email);
      }
    } catch (error) {
      console.error('Failed to send appointment confirmation email:', error);
    }
  }

  // SMS Notifications
  async sendAppointmentConfirmationSMS(appointmentId: string): Promise<void> {
    try {
      if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
        console.log('Twilio credentials not configured, skipping SMS');
        return;
      }

      const appointment = await PhysicalAppointmentModel.findById(appointmentId)
        .populate('patient', 'name')
        .populate('doctor', 'name');

      if (!appointment) return;

      const patient = appointment.patient as any;
      const doctor = appointment.doctor as any;

      // Get patient phone number from profile
      const profile = await ProfileModel.findOne({ user: patient._id });
      if (!profile?.phone) return;

      const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

      const message = await client.messages.create({
        body: `HealthKonnect: Your appointment with Dr. ${doctor.name} at ${appointment.hospital} on ${appointment.date.toDateString()} at ${appointment.time} has been confirmed.`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: profile.phone
      });

      console.log('Appointment confirmation SMS sent:', message.sid);
    } catch (error) {
      console.error('Failed to send appointment confirmation SMS:', error);
    }
  }

  // In-App Notifications via Socket.io
  async sendAppointmentConfirmationNotification(appointmentId: string): Promise<void> {
    try {
      const appointment = await PhysicalAppointmentModel.findById(appointmentId)
        .populate('patient', 'name')
        .populate('doctor', 'name');

      if (!appointment) return;

      const patient = appointment.patient as any;
      const doctor = appointment.doctor as any;

      const notification = {
        type: 'appointment_confirmed',
        title: 'Appointment Confirmed',
        message: `Your appointment with Dr. ${doctor.name} has been confirmed for ${appointment.date.toDateString()} at ${appointment.time}`,
        appointmentId: appointment._id,
        timestamp: new Date()
      };

      // Send to patient's socket room
      this.io.to(`user-${patient._id}`).emit('notification', notification);

      console.log('In-app notification sent for appointment:', appointmentId);
    } catch (error) {
      console.error('Failed to send in-app notification:', error);
    }
  }

  // Combined notification method
  async sendAppointmentConfirmation(appointmentId: string): Promise<void> {
    await Promise.allSettled([
      this.sendAppointmentConfirmationEmail(appointmentId),
      this.sendAppointmentConfirmationSMS(appointmentId),
      this.sendAppointmentConfirmationNotification(appointmentId)
    ]);
  }

  // Appointment Reminders
  private async sendAppointmentReminders(): Promise<void> {
    try {
      // Find appointments in the next hour
      const now = new Date();
      const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

      const upcomingAppointments = await PhysicalAppointmentModel.find({
        date: {
          $gte: now,
          $lte: oneHourFromNow
        },
        status: 'confirmed'
      }).populate('patient', 'name email');

      for (const appointment of upcomingAppointments) {
        const patient = appointment.patient as any;

        // Send reminder notification
        const reminder = {
          type: 'appointment_reminder',
          title: 'Appointment Reminder',
          message: `You have an appointment in 1 hour at ${appointment.hospital}`,
          appointmentId: appointment._id,
          timestamp: new Date()
        };

        this.io.to(`user-${patient._id}`).emit('notification', reminder);

        // Send SMS reminder if configured
        await this.sendAppointmentReminderSMS(appointment._id.toString());
      }
    } catch (error) {
      console.error('Failed to send appointment reminders:', error);
    }
  }

  private async sendDailyAppointmentReminders(): Promise<void> {
    try {
      // Find appointments for tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowEnd = new Date(tomorrow);
      tomorrowEnd.setHours(23, 59, 59, 999);

      const tomorrowAppointments = await PhysicalAppointmentModel.find({
        date: {
          $gte: tomorrow,
          $lte: tomorrowEnd
        },
        status: 'confirmed'
      }).populate('patient', 'name email');

      for (const appointment of tomorrowAppointments) {
        const patient = appointment.patient as any;

        // Send daily reminder
        const reminder = {
          type: 'daily_appointment_reminder',
          title: 'Tomorrow\'s Appointment',
          message: `Reminder: You have an appointment tomorrow at ${appointment.hospital} with your doctor`,
          appointmentId: appointment._id,
          timestamp: new Date()
        };

        this.io.to(`user-${patient._id}`).emit('notification', reminder);
      }
    } catch (error) {
      console.error('Failed to send daily appointment reminders:', error);
    }
  }

  private async sendAppointmentReminderSMS(appointmentId: string): Promise<void> {
    try {
      if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
        return;
      }

      const appointment = await PhysicalAppointmentModel.findById(appointmentId)
        .populate('patient', 'name')
        .populate('doctor', 'name');

      if (!appointment) return;

      const patient = appointment.patient as any;
      const doctor = appointment.doctor as any;

      const profile = await ProfileModel.findOne({ user: patient._id });
      if (!profile?.phone) return;

      const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

      const message = await client.messages.create({
        body: `HealthKonnect Reminder: Your appointment with Dr. ${doctor.name} at ${appointment.hospital} is in 1 hour (${appointment.time}).`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: profile.phone
      });

      console.log('Appointment reminder SMS sent:', message.sid);
    } catch (error) {
      console.error('Failed to send appointment reminder SMS:', error);
    }
  }

  // Payment notifications
  async sendPaymentSuccessNotification(appointmentId: string): Promise<void> {
    try {
      const appointment = await PhysicalAppointmentModel.findById(appointmentId)
        .populate('patient', 'name');

      if (!appointment) return;

      const patient = appointment.patient as any;

      const notification = {
        type: 'payment_success',
        title: 'Payment Successful',
        message: `Your payment of KES ${appointment.consultationFee} has been processed successfully.`,
        appointmentId: appointment._id,
        timestamp: new Date()
      };

      this.io.to(`user-${patient._id}`).emit('notification', notification);
    } catch (error) {
      console.error('Failed to send payment success notification:', error);
    }
  }

  // Doctor status change notifications
  async notifyPatientsOfDoctorStatusChange(doctorId: string, status: string): Promise<void> {
    try {
      // Find patients with upcoming appointments with this doctor
      const upcomingAppointments = await PhysicalAppointmentModel.find({
        doctor: doctorId,
        date: { $gte: new Date() },
        status: 'confirmed'
      }).distinct('patient');

      const notification = {
        type: 'doctor_status_change',
        title: 'Doctor Status Update',
        message: `Your doctor's availability status has changed to: ${status}`,
        doctorId,
        timestamp: new Date()
      };

      // Notify all affected patients
      upcomingAppointments.forEach(patientId => {
        this.io.to(`user-${patientId}`).emit('notification', notification);
      });
    } catch (error) {
      console.error('Failed to notify patients of doctor status change:', error);
    }
  }
}