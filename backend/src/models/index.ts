import mongoose from 'mongoose';
import { User, Profile, Doctor, Appointment, Message, Prescription, MedicalDocument, Notification, Payment, AuditLog, DoctorAvailability, PhysicalAppointment, PaymentIntent, Subscription, PaymentTransaction } from '../types';

// User Schema
const userSchema = new mongoose.Schema<User>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['patient', 'doctor', 'admin'], default: 'patient' }
}, { timestamps: true });

// Profile Schema
const profileSchema = new mongoose.Schema<Profile>({
  user: { type: mongoose.Schema.Types.ObjectId as any, ref: 'User', required: true, unique: true },
  name: { type: String, required: true },
  phone: String,
  role: { type: String, enum: ['patient', 'doctor', 'admin'], default: 'patient' },
  location: String,
  age: Number,
  gender: String,
  medicalConditions: [String]
}, { timestamps: true });

// Doctor Schema
const doctorSchema = new mongoose.Schema<Doctor>({
  user: { type: mongoose.Schema.Types.ObjectId as any, ref: 'User', required: true },
  name: { type: String, required: true },
  specialization: { type: String, required: true },
  city: String,
  hospital: String,
  rating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
  consultationFee: Number,
  latitude: Number,
  longitude: Number,
  availableSlots: [String]
}, { timestamps: true });

// Appointment Schema
const appointmentSchema = new mongoose.Schema<Appointment>({
  patient: { type: mongoose.Schema.Types.ObjectId as any, ref: 'User', required: true },
  doctor: { type: mongoose.Schema.Types.ObjectId as any, ref: 'User', required: true },
  date: { type: Date, required: true },
  time: { type: String, required: true },
  status: { type: String, enum: ['pending', 'confirmed', 'completed', 'cancelled'], default: 'pending' },
  symptoms: String,
  notes: String,
  paymentRef: String
}, { timestamps: true });

// Message Schema
const messageSchema = new mongoose.Schema<Message>({
  appointmentRef: { type: mongoose.Schema.Types.ObjectId as any, ref: 'Appointment' },
  threadRef: { type: mongoose.Schema.Types.ObjectId as any, ref: 'Message' },
  sender: { type: mongoose.Schema.Types.ObjectId as any, ref: 'User', required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId as any, ref: 'User', required: true },
  content: { type: String, required: true, trim: true },
  delivered: { type: Boolean, default: false }
}, { timestamps: true });

// Prescription Schema
const prescriptionSchema = new mongoose.Schema<Prescription>({
  doctor: { type: mongoose.Schema.Types.ObjectId as any, ref: 'User', required: true },
  patient: { type: mongoose.Schema.Types.ObjectId as any, ref: 'User', required: true },
  appointment: { type: mongoose.Schema.Types.ObjectId as any, ref: 'Appointment' },
  meds: [{
    name: String,
    dosage: String,
    frequency: String,
    duration: String
  }],
  notes: String,
  pdfUrl: String
}, { timestamps: true });

// Medical Document Schema
const medicalDocumentSchema = new mongoose.Schema<MedicalDocument>({
  patient: { type: mongoose.Schema.Types.ObjectId as any, ref: 'User', required: true },
  url: { type: String, required: true },
  type: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now }
});

// Notification Schema
const notificationSchema = new mongoose.Schema<Notification>({
  user: { type: mongoose.Schema.Types.ObjectId as any, ref: 'User', required: true },
  type: { type: String, required: true },
  payload: { type: mongoose.Schema.Types.Mixed, required: true },
  sentStatus: { type: String, enum: ['pending', 'sent', 'failed'], default: 'pending' }
}, { timestamps: true });

// Payment Schema
const paymentSchema = new mongoose.Schema<Payment>({
  user: { type: mongoose.Schema.Types.ObjectId as any, ref: 'User', required: true },
  amount: { type: Number, required: true },
  phoneNumber: { type: String, required: true },
  type: { type: String, enum: ['one_time', 'subscription'], required: true },
  feature: { type: String, required: true },
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
  transactionId: String,
  description: String,
  completedAt: Date
}, { timestamps: true });

// Audit Log Schema
const auditLogSchema = new mongoose.Schema<AuditLog>({
  user: { type: mongoose.Schema.Types.ObjectId as any, ref: 'User', required: true },
  action: { type: String, required: true },
  resource: { type: String, required: true },
  before: mongoose.Schema.Types.Mixed,
  after: mongoose.Schema.Types.Mixed,
  timestamp: { type: Date, default: Date.now }
});

// Doctor Availability Schema (for physical appointments)
const doctorAvailabilitySchema = new mongoose.Schema<DoctorAvailability>({
  doctor: { type: mongoose.Schema.Types.ObjectId as any, ref: 'User', required: true, unique: true },
  status: { type: String, enum: ['available', 'busy', 'offline'], default: 'offline' },
  currentHospital: String,
  location: {
    latitude: Number,
    longitude: Number
  },
  lastUpdated: { type: Date, default: Date.now }
}, { timestamps: true });

// Physical Appointment Schema (separate from teleconsultation appointments)
const physicalAppointmentSchema = new mongoose.Schema<PhysicalAppointment>({
  patient: { type: mongoose.Schema.Types.ObjectId as any, ref: 'User', required: true },
  doctor: { type: mongoose.Schema.Types.ObjectId as any, ref: 'User', required: true },
  hospital: { type: String, required: true },
  date: { type: Date, required: true },
  time: { type: String, required: true },
  status: { type: String, enum: ['pending', 'confirmed', 'completed', 'cancelled', 'locked'], default: 'pending' },
  symptoms: String,
  notes: String,
  paymentRef: String,
  lockedUntil: Date,
  consultationFee: { type: Number, required: true }
}, { timestamps: true });

// Payment Intent Schema (for IntaSend integration)
const paymentIntentSchema = new mongoose.Schema<PaymentIntent>({
  appointment: { type: mongoose.Schema.Types.ObjectId as any, ref: 'PhysicalAppointment', required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'KES' },
  status: { type: String, enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'], default: 'pending' },
  intasendRef: String,
  paymentUrl: String,
  expiresAt: { type: Date, required: true }
}, { timestamps: true });

// Subscription Schema
const subscriptionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId as any, ref: 'User', required: true },
  type: { type: String, enum: ['one_time', 'monthly'], required: true },
  status: { type: String, enum: ['active', 'expired', 'cancelled'], default: 'active' },
  amount: { type: Number, required: true },
  expiresAt: { type: Date, required: true },
  payment: { type: mongoose.Schema.Types.ObjectId as any, ref: 'Payment' }
}, { timestamps: true });

// Payment Transaction Schema
const paymentTransactionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId as any, ref: 'User', required: true },
  intasendRef: { type: String, required: true, unique: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'KES' },
  status: { type: String, enum: ['pending', 'completed', 'failed', 'cancelled'], default: 'pending' },
  type: { type: String, enum: ['one_time_search', 'monthly_subscription'], required: true },
  metadata: mongoose.Schema.Types.Mixed,
  processedAt: Date
}, { timestamps: true });

// Models
export const UserModel = mongoose.model<User>('User', userSchema);
export const ProfileModel = mongoose.model<Profile>('Profile', profileSchema);
export const DoctorModel = mongoose.model<Doctor>('Doctor', doctorSchema);
export const AppointmentModel = mongoose.model<Appointment>('Appointment', appointmentSchema);
export const MessageModel = mongoose.model<Message>('Message', messageSchema);
export const PrescriptionModel = mongoose.model<Prescription>('Prescription', prescriptionSchema);
export const MedicalDocumentModel = mongoose.model<MedicalDocument>('MedicalDocument', medicalDocumentSchema);
export const NotificationModel = mongoose.model<Notification>('Notification', notificationSchema);
export const PaymentModel = mongoose.model<Payment>('Payment', paymentSchema);
export const AuditLogModel = mongoose.model<AuditLog>('AuditLog', auditLogSchema);

// Availability Module Models
export const DoctorAvailabilityModel = mongoose.model<DoctorAvailability>('DoctorAvailability', doctorAvailabilitySchema);
export const PhysicalAppointmentModel = mongoose.model<PhysicalAppointment>('PhysicalAppointment', physicalAppointmentSchema);
export const PaymentIntentModel = mongoose.model<PaymentIntent>('PaymentIntent', paymentIntentSchema);

// Subscription and Payment Models
export const SubscriptionModel = mongoose.model<Subscription>('Subscription', subscriptionSchema);
export const PaymentTransactionModel = mongoose.model<PaymentTransaction>('PaymentTransaction', paymentTransactionSchema);

// Export types
export { User, Profile, Doctor, Appointment, Message, Prescription, MedicalDocument, Notification, Payment, AuditLog, DoctorAvailability, PhysicalAppointment, PaymentIntent, Subscription, PaymentTransaction };