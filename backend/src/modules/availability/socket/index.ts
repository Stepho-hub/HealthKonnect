import { Server, Socket } from 'socket.io';
import { AvailabilityService } from '../service';

export const setupAvailabilitySocketHandlers = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    console.log('User connected to availability module:', socket.id);

    // Doctor status updates
    socket.on('doctor-status-update', async (data: {
      doctorId: string;
      status: 'available' | 'busy' | 'offline';
      currentHospital?: string;
      location?: { latitude: number; longitude: number };
    }) => {
      try {
        const availability = await AvailabilityService.updateDoctorStatus(
          data.doctorId,
          data.status,
          data.currentHospital,
          data.location
        );

        // Broadcast to all connected clients
        io.emit('doctor-status-changed', {
          doctorId: data.doctorId,
          status: data.status,
          currentHospital: data.currentHospital,
          location: data.location,
          lastUpdated: availability.lastUpdated
        });

        socket.emit('doctor-status-update-success', availability);
      } catch (error) {
        console.error('Doctor status update error:', error);
        socket.emit('doctor-status-update-error', { message: 'Failed to update status' });
      }
    });

    // Real-time specialist search
    socket.on('search-specialists', async (data: {
      specialty: string;
      latitude?: number;
      longitude?: number;
      radius?: number;
    }) => {
      try {
        const results = await AvailabilityService.searchAvailableSpecialists(
          data.specialty,
          data.latitude,
          data.longitude,
          data.radius || 50
        );

        socket.emit('specialists-search-results', results);
      } catch (error) {
        console.error('Specialists search error:', error);
        socket.emit('specialists-search-error', { message: 'Search failed' });
      }
    });

    // Join hospital room for real-time updates
    socket.on('join-hospital-room', (hospitalName: string) => {
      socket.join(`hospital-${hospitalName}`);
      console.log(`User ${socket.id} joined hospital room: ${hospitalName}`);
    });

    // Leave hospital room
    socket.on('leave-hospital-room', (hospitalName: string) => {
      socket.leave(`hospital-${hospitalName}`);
      console.log(`User ${socket.id} left hospital room: ${hospitalName}`);
    });

    // Appointment booking notifications
    socket.on('appointment-booked', (data: {
      appointmentId: string;
      patientId: string;
      doctorId: string;
      hospital: string;
      date: string;
      time: string;
    }) => {
      // Notify hospital room
      io.to(`hospital-${data.hospital}`).emit('new-appointment', {
        appointmentId: data.appointmentId,
        patientId: data.patientId,
        doctorId: data.doctorId,
        date: data.date,
        time: data.time
      });
    });

    // Payment status updates
    socket.on('payment-status-update', (data: {
      appointmentId: string;
      status: string;
      paymentRef?: string;
    }) => {
      io.emit('appointment-payment-update', {
        appointmentId: data.appointmentId,
        status: data.status,
        paymentRef: data.paymentRef
      });
    });

    // Doctor availability subscription
    socket.on('subscribe-doctor-availability', (doctorId: string) => {
      socket.join(`doctor-${doctorId}`);
      console.log(`User ${socket.id} subscribed to doctor ${doctorId} availability`);
    });

    socket.on('unsubscribe-doctor-availability', (doctorId: string) => {
      socket.leave(`doctor-${doctorId}`);
      console.log(`User ${socket.id} unsubscribed from doctor ${doctorId} availability`);
    });

    // Real-time availability broadcasts
    socket.on('broadcast-availability', (data: {
      doctorId: string;
      availability: any;
    }) => {
      io.to(`doctor-${data.doctorId}`).emit('doctor-availability-update', data.availability);
    });

    socket.on('disconnect', () => {
      console.log('User disconnected from availability module:', socket.id);
    });
  });
};