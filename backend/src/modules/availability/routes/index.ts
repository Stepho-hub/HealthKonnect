import { Router } from 'express';
import { AvailabilityController } from '../controller';

const router = Router();

// Doctor Status Management
router.put('/doctor/status', AvailabilityController.updateDoctorStatus);
router.get('/doctor/status/:doctorId', AvailabilityController.getDoctorStatus);
router.get('/doctor/statuses', AvailabilityController.getAllDoctorStatuses);

// Real-time Specialist Search (Public - no authentication required)
router.get('/search/specialists', (req, res, next) => {
  // Skip authentication for this endpoint
  AvailabilityController.searchAvailableSpecialists(req, res);
});

// Physical Appointment Booking
router.post('/appointments/physical', AvailabilityController.createPhysicalAppointment);
router.get('/appointments', AvailabilityController.getUserAppointments);

// Payment Integration
router.post('/payments/initiate', AvailabilityController.initiatePayment);
router.post('/payments/callback', AvailabilityController.handlePaymentCallback);

// Admin Panel Support
router.get('/admin/hospital/:hospital/stats', AvailabilityController.getHospitalStats);
router.get('/admin/hospitals/stats', AvailabilityController.getAllHospitalStats);

export default router;