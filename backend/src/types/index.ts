// Shared types for HealthKonnect Backend

export interface User {
  _id: string;
  clerkId: string;
  name: string;
  email: string;
  role: 'patient' | 'doctor' | 'admin';
  createdAt: Date;
  updatedAt: Date;
}

export interface Profile {
  _id: string;
  user: string;
  fullName?: string;
  phone?: string;
  address?: string;
  dateOfBirth?: Date;
  gender?: string;
  emergencyContact?: string;
  medicalHistory?: string[];
  allergies?: string[];
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
  mpesaTransactionId?: string;
  status: 'pending' | 'completed' | 'failed';
  amount: number;
  reference: string;
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