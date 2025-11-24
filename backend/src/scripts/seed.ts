import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import {
  DoctorModel,
  UserModel,
  ProfileModel,
  AppointmentModel,
  MessageModel,
  PrescriptionModel,
  NotificationModel,
  PaymentModel
} from '../models';
import dotenv from 'dotenv';

dotenv.config();

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('Connected to MongoDB');

    // Note: Not clearing existing data to preserve current database content
    console.log('Adding additional mock data without clearing existing data');

    // Sample doctors data
    const doctorsData = [
      {
        name: 'Dr. Sarah Johnson',
        specialization: 'Cardiology',
        city: 'Nairobi',
        hospital: 'Kenyatta National Hospital',
        rating: 4.8,
        reviewCount: 127,
        consultationFee: 5000,
        latitude: -1.2864,
        longitude: 36.8172,
        availableSlots: ['09:00', '10:00', '14:00', '15:00', '16:00']
      },
      {
        name: 'Dr. Michael Chen',
        specialization: 'Dermatology',
        city: 'Nairobi',
        hospital: 'Nairobi Hospital',
        rating: 4.6,
        reviewCount: 89,
        consultationFee: 4500,
        latitude: -1.2864,
        longitude: 36.8172,
        availableSlots: ['08:00', '11:00', '13:00', '15:00', '17:00']
      },
      {
        name: 'Dr. Grace Wanjiku',
        specialization: 'Pediatrics',
        city: 'Nairobi',
        hospital: 'Mater Hospital',
        rating: 4.9,
        reviewCount: 156,
        consultationFee: 4000,
        latitude: -1.2864,
        longitude: 36.8172,
        availableSlots: ['09:00', '10:00', '11:00', '14:00', '16:00']
      },
      {
        name: 'Dr. David Kiprop',
        specialization: 'Orthopedics',
        city: 'Eldoret',
        hospital: 'Moi Teaching and Referral Hospital',
        rating: 4.7,
        reviewCount: 98,
        consultationFee: 5500,
        latitude: 0.5143,
        longitude: 35.2698,
        availableSlots: ['08:00', '10:00', '14:00', '15:00']
      },
      {
        name: 'Dr. Ann Nyambura',
        specialization: 'Gynecology',
        city: 'Nairobi',
        hospital: 'Aga Khan Hospital',
        rating: 4.8,
        reviewCount: 134,
        consultationFee: 4800,
        latitude: -1.2864,
        longitude: 36.8172,
        availableSlots: ['09:00', '11:00', '13:00', '15:00', '17:00']
      },
      {
        name: 'Dr. James Oduya',
        specialization: 'General Medicine',
        city: 'Kisumu',
        hospital: 'Jaramogi Oginga Odinga Teaching and Referral Hospital',
        rating: 4.5,
        reviewCount: 76,
        consultationFee: 3500,
        latitude: -0.0917,
        longitude: 34.7679,
        availableSlots: ['08:00', '09:00', '10:00', '14:00', '16:00']
      },
      {
        name: 'Dr. Elizabeth Muthoni',
        specialization: 'Dentistry',
        city: 'Nairobi',
        hospital: 'Nairobi Dental Clinic',
        rating: 4.7,
        reviewCount: 92,
        consultationFee: 3000,
        latitude: -1.2864,
        longitude: 36.8172,
        availableSlots: ['08:00', '09:00', '11:00', '14:00', '16:00']
      },
      {
        name: 'Dr. Peter Kamau',
        specialization: 'Psychiatry',
        city: 'Nairobi',
        hospital: 'Mathari Mental Hospital',
        rating: 4.6,
        reviewCount: 68,
        consultationFee: 6000,
        latitude: -1.2864,
        longitude: 36.8172,
        availableSlots: ['10:00', '11:00', '13:00', '15:00']
      },
      {
        name: 'Dr. Mary Wairimu',
        specialization: 'Ophthalmology',
        city: 'Nairobi',
        hospital: 'Kenyatta Eye Hospital',
        rating: 4.8,
        reviewCount: 145,
        consultationFee: 4200,
        latitude: -1.2864,
        longitude: 36.8172,
        availableSlots: ['09:00', '10:00', '14:00', '15:00', '16:00']
      },
      {
        name: 'Dr. Susan Kiprop',
        specialization: 'Internal Medicine',
        city: 'Nakuru',
        hospital: 'Nakuru Level 5 Hospital',
        rating: 4.5,
        reviewCount: 87,
        consultationFee: 3800,
        latitude: -0.3031,
        longitude: 36.0800,
        availableSlots: ['09:00', '10:00', '14:00', '16:00']
      }
    ];

    // Sample patients data
    const patientsData = [
      { name: 'Alice Wanjiku', email: 'alice.wanjiku@email.com', phone: '+254712345678', age: 28, gender: 'Female', location: 'Nairobi', medicalConditions: ['Hypertension'] },
      { name: 'Bob Kiprop', email: 'bob.kiprop@email.com', phone: '+254723456789', age: 35, gender: 'Male', location: 'Eldoret', medicalConditions: ['Diabetes'] },
      { name: 'Catherine Nyambura', email: 'catherine.nyambura@email.com', phone: '+254734567890', age: 42, gender: 'Female', location: 'Nairobi', medicalConditions: ['Asthma'] },
      { name: 'David Oduya', email: 'david.oduya@email.com', phone: '+254745678901', age: 29, gender: 'Male', location: 'Kisumu', medicalConditions: [] },
      { name: 'Eva Muthoni', email: 'eva.muthoni@email.com', phone: '+254756789012', age: 31, gender: 'Female', location: 'Nairobi', medicalConditions: ['Migraine'] },
      { name: 'Frank Kamau', email: 'frank.kamau@email.com', phone: '+254767890123', age: 38, gender: 'Male', location: 'Nakuru', medicalConditions: ['Back pain'] },
      { name: 'Grace Wairimu', email: 'grace.wairimu@email.com', phone: '+254778901234', age: 25, gender: 'Female', location: 'Nairobi', medicalConditions: [] },
      { name: 'Henry Mwangi', email: 'henry.mwangi@email.com', phone: '+254789012345', age: 45, gender: 'Male', location: 'Mombasa', medicalConditions: ['Arthritis'] },
      { name: 'Irene Kiprop', email: 'irene.kiprop@email.com', phone: '+254790123456', age: 33, gender: 'Female', location: 'Nairobi', medicalConditions: ['Thyroid issues'] },
      { name: 'James Ochieng', email: 'james.ochieng@email.com', phone: '+254701234567', age: 27, gender: 'Male', location: 'Kisumu', medicalConditions: [] }
    ];

    // Admin data
    const adminData = [
      { name: 'Admin User 1', email: 'admin1@healthkonnect.com', phone: '+254711111111' },
      { name: 'Admin User 2', email: 'admin2@healthkonnect.com', phone: '+254722222222' }
    ];

    // Create doctors
    const createdDoctors = [];
    for (const doctorData of doctorsData) {
      const hashedPassword = await bcrypt.hash('doctor123', 10);
      const doctorUser = new UserModel({
        name: doctorData.name,
        email: `${doctorData.name.toLowerCase().replace(/\s+/g, '.')}@h-konnect.com`,
        password: hashedPassword,
        role: 'doctor'
      });
      await doctorUser.save();

      const doctor = new DoctorModel({
        user: doctorUser._id,
        ...doctorData
      });
      await doctor.save();
      createdDoctors.push({ user: doctorUser, doctor });
      console.log(`Created doctor: ${doctorData.name}`);
    }

    // Create patients
    const createdPatients = [];
    for (const patientData of patientsData) {
      const hashedPassword = await bcrypt.hash('patient123', 10);
      const patientUser = new UserModel({
        name: patientData.name,
        email: patientData.email,
        password: hashedPassword,
        role: 'patient'
      });
      await patientUser.save();

      const profile = new ProfileModel({
        user: patientUser._id,
        name: patientData.name,
        phone: patientData.phone,
        role: 'patient',
        location: patientData.location,
        age: patientData.age,
        gender: patientData.gender,
        medicalConditions: patientData.medicalConditions || []
      });
      await profile.save();

      createdPatients.push({ user: patientUser, profile });
      console.log(`Created patient: ${patientData.name}`);
    }

    // Create admins
    for (const admin of adminData) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const adminUser = new UserModel({
        name: admin.name,
        email: admin.email,
        password: hashedPassword,
        role: 'admin'
      });
      await adminUser.save();

      const adminProfile = new ProfileModel({
        user: adminUser._id,
        name: admin.name,
        phone: admin.phone,
        role: 'admin',
        location: 'Nairobi',
        age: 35,
        gender: 'Male',
        medicalConditions: []
      });
      await adminProfile.save();

      console.log(`Created admin: ${admin.name}`);
    }

    // Create appointments
    const appointmentStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
    const symptoms = [
      'Fever and headache',
      'Chest pain',
      'Skin rash',
      'Stomach pain',
      'Back pain',
      'Cough and cold',
      'Joint pain',
      'High blood pressure',
      'Diabetes checkup',
      'Mental health consultation',
      'Allergy symptoms',
      'Dizziness',
      'Fatigue',
      'Nausea',
      'Shortness of breath',
      'Sore throat',
      'Head injury',
      'Burn injury',
      'Eye irritation',
      'Ear pain'
    ];

    const createdAppointments = [];
    for (let i = 0; i < 50; i++) {
      const patient = createdPatients[Math.floor(Math.random() * createdPatients.length)];
      const doctor = createdDoctors[Math.floor(Math.random() * createdDoctors.length)];
      const daysFromNow = Math.floor(Math.random() * 60); // Extended to 60 days
      const date = new Date();
      date.setDate(date.getDate() + daysFromNow);

      const appointment = new AppointmentModel({
        patient: patient.user._id,
        doctor: doctor.user._id,
        date,
        time: doctor.doctor.availableSlots ? doctor.doctor.availableSlots[Math.floor(Math.random() * doctor.doctor.availableSlots.length)] : '09:00',
        status: appointmentStatuses[Math.floor(Math.random() * appointmentStatuses.length)],
        symptoms: symptoms[Math.floor(Math.random() * symptoms.length)],
        notes: `Consultation for ${(patient.profile.medicalConditions && patient.profile.medicalConditions.length > 0) ? patient.profile.medicalConditions.join(', ') : 'general checkup'}`
      });
      await appointment.save();
      createdAppointments.push(appointment);
    }
    console.log(`Created ${createdAppointments.length} appointments`);

    // Create messages for some appointments
    const messageTemplates = [
      'Hello doctor, I have been experiencing persistent headaches.',
      'Thank you for seeing me today.',
      'When should I take the prescribed medication?',
      'I have some questions about my test results.',
      'Can we schedule a follow-up appointment?',
      'Thank you for your help.',
      'I feel much better now.',
      'Please advise on the dosage.',
      'Is this medication safe during pregnancy?',
      'How long will the treatment take?'
    ];

    for (const appointment of createdAppointments.slice(0, 15)) {
      const numMessages = Math.floor(Math.random() * 5) + 1;
      for (let i = 0; i < numMessages; i++) {
        const isFromPatient = Math.random() > 0.5;
        const message = new MessageModel({
          appointmentRef: appointment._id,
          sender: isFromPatient ? appointment.patient : appointment.doctor,
          receiver: isFromPatient ? appointment.doctor : appointment.patient,
          content: messageTemplates[Math.floor(Math.random() * messageTemplates.length)],
          delivered: true
        });
        await message.save();
      }
    }
    console.log('Created messages for appointments');

    // Create prescriptions
    const medications = [
      { name: 'Paracetamol', dosage: '500mg', frequency: '3 times daily', duration: '5 days' },
      { name: 'Amoxicillin', dosage: '500mg', frequency: '3 times daily', duration: '7 days' },
      { name: 'Ibuprofen', dosage: '400mg', frequency: '3 times daily', duration: '3 days' },
      { name: 'Omeprazole', dosage: '20mg', frequency: 'Once daily', duration: '14 days' },
      { name: 'Metformin', dosage: '500mg', frequency: 'Twice daily', duration: '30 days' },
      { name: 'Amlodipine', dosage: '5mg', frequency: 'Once daily', duration: '30 days' },
      { name: 'Salbutamol Inhaler', dosage: '2 puffs', frequency: 'As needed', duration: 'Ongoing' },
      { name: 'Cetirizine', dosage: '10mg', frequency: 'Once daily', duration: '7 days' },
      { name: 'Vitamin D3', dosage: '1000 IU', frequency: 'Once daily', duration: '30 days' },
      { name: 'Folic Acid', dosage: '5mg', frequency: 'Once daily', duration: '30 days' }
    ];

    for (let i = 0; i < 30; i++) {
      const appointment = createdAppointments[i];
      const numMeds = Math.floor(Math.random() * 4) + 1;
      const meds = [];
      for (let j = 0; j < numMeds; j++) {
        meds.push(medications[Math.floor(Math.random() * medications.length)]);
      }

      const prescription = new PrescriptionModel({
        doctor: appointment.doctor,
        patient: appointment.patient,
        meds,
        pdfUrl: `https://example.com/prescription-${appointment._id}.pdf`
      });
      await prescription.save();
    }
    console.log('Created prescriptions');

    // Create notifications
    const notificationTypes = ['appointment_reminder', 'message_received', 'prescription_ready'];
    for (const user of [...createdPatients.map(p => p.user), ...createdDoctors.map(d => d.user)]) {
      const numNotifications = Math.floor(Math.random() * 3);
      for (let i = 0; i < numNotifications; i++) {
        const notification = new NotificationModel({
          user: user._id,
          type: notificationTypes[Math.floor(Math.random() * notificationTypes.length)],
          payload: { message: 'Sample notification' },
          sentStatus: 'sent'
        });
        await notification.save();
      }
    }
    console.log('Created notifications');

    // Create sample payments
    for (const appointment of createdAppointments.filter(a => a.status === 'completed')) {
      const payment = new PaymentModel({
        mpesaTransactionId: `TXN${Date.now()}${Math.random().toString(36).substr(2, 5)}`,
        status: 'completed',
        amount: 5000,
        reference: appointment._id.toString()
      });
      await payment.save();
    }
    console.log('Created payments');

    console.log('Seeding completed successfully!');
    console.log(`Created ${doctorsData.length} doctors`);
    console.log(`Created ${patientsData.length} patients`);
    console.log(`Created ${adminData.length} admins`);
    console.log(`Created ${createdAppointments.length} appointments`);
    console.log('Created messages, prescriptions, notifications, and payments');

  } catch (error) {
    console.error('Seeding failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the seed function
seedDatabase();