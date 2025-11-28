// Shared types for HealthKonnect Backend

export interface User {
  _id: string;
  name: string;
  email: string;
  password: string;
  role: 'patient' | 'doctor' | 'admin';
  createdAt: Date;
  updatedAt: Date;
}

export interface Profile {
  _id: string;
  user: string;
  name: string;
  phone?: string;
  role: 'patient' | 'doctor' | 'admin';
  location?: string;
  age?: number;
  gender?: string;
  medicalConditions?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Doctor {
  _id: string;
  user: string;
  name: string;
  specialization: string;
  city?: string;
  hospital?: string;
  rating?: number;
  reviewCount?: number;
  consultationFee?: number;
  latitude?: number;
  longitude?: number;
  availableSlots?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface DoctorProfile {
  _id: string;
  user: string;
  name: string;
  specialization: string;
  city: string;
  hospital: string;
  rating: number;
  reviewCount: number;
  consultationFee: number;
  latitude?: number;
  longitude?: number;
  availableSlots?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Appointment {
  _id: string;
  patient: string;
  doctor: string;
  date: Date;
  time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  symptoms?: string;
  notes?: string;
  paymentRef?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  _id: string;
  appointmentRef?: string;
  threadRef?: string;
  sender: string;
  receiver: string;
  content: string;
  delivered: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Prescription {
  _id: string;
  doctor: string;
  patient: string;
  appointment?: string;
  meds: Array<{
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
  }>;
  pdfUrl?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MedicalDocument {
  _id: string;
  patient: string;
  url: string;
  type: string;
  uploadedAt: Date;
}

export interface Notification {
  _id: string;
  user: string;
  type: string;
  payload: any;
  sentStatus: 'pending' | 'sent' | 'failed';
  createdAt: Date;
}

export interface Payment {
  _id: string;
  user: string;
  amount: number;
  phoneNumber: string;
  type: 'one_time' | 'subscription';
  feature: string;
  status: 'pending' | 'completed' | 'failed';
  transactionId?: string;
  description?: string;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuditLog {
  _id: string;
  user: string;
  action: string;
  resource: string;
  before?: any;
  after?: any;
  timestamp: Date;
}

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      io?: any; // Socket.io instance
    }
  }
}

// Utility functions
export const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export const formatTime = (date: Date): string => {
  return date.toTimeString().split(' ')[0].substring(0, 5);
};

export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
  return phoneRegex.test(phone);
};

export const sanitizeInput = (input: string): string => {
  return input.replace(/[<>]/g, '');
};

// Availability Module Types
export interface DoctorAvailability {
  _id: string;
  doctor: string;
  status: 'available' | 'busy' | 'offline';
  currentHospital?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  lastUpdated: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface PhysicalAppointment {
  _id: string;
  patient: string;
  doctor: string;
  hospital: string;
  date: Date;
  time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'locked';
  symptoms?: string;
  notes?: string;
  paymentRef?: string;
  lockedUntil?: Date;
  consultationFee: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentIntent {
  _id: string;
  appointment: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  intasendRef?: string;
  paymentUrl?: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AvailabilitySearchResult {
  doctor: {
    _id: string;
    name: string;
    specialization: string;
    rating: number;
    reviewCount: number;
    consultationFee: number;
  };
  hospital: string;
  distance?: number;
  nextAvailableTime?: string;
  isAvailableNow: boolean;
}

// Subscription and Payment Types
export interface Subscription {
  _id: string;
  user: string;
  type: 'one_time' | 'monthly';
  status: 'active' | 'expired' | 'cancelled';
  expiresAt: Date;
  paymentRef: string;
  amount: number;
  features: Array<{
    name: string;
    accessCount: number;
    maxAccess: number | null;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentTransaction {
  _id: string;
  user: string;
  intasendRef: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  type: 'one_time_search' | 'monthly_subscription';
  metadata?: any;
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}