// Frontend types for HealthKonnect

export interface User {
  _id: string;
  clerkId: string;
  name: string;
  email: string;
  role: 'patient' | 'doctor' | 'admin';
  createdAt: string;
  updatedAt: string;
}

export interface Profile {
  _id: string;
  user: string;
  fullName?: string;
  phone?: string;
  address?: string;
  dateOfBirth?: string;
  gender?: string;
  emergencyContact?: string;
  medicalHistory?: string[];
  allergies?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Doctor {
  _id: string;
  user: User;
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
  createdAt: string;
  updatedAt: string;
}

export interface Appointment {
  _id: string;
  patient: User;
  doctor: User;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  symptoms?: string;
  notes?: string;
  paymentRef?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  _id: string;
  appointmentRef?: string;
  threadRef?: string;
  sender: User;
  receiver: User;
  content: string;
  delivered: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Prescription {
  _id: string;
  doctor: User;
  patient: User;
  meds: Array<{
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
  }>;
  pdfUrl?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MedicalDocument {
  _id: string;
  patient: string;
  url: string;
  type: string;
  uploadedAt: string;
}

export interface Notification {
  _id: string;
  user: string;
  type: string;
  payload: any;
  sentStatus: 'pending' | 'sent' | 'failed';
  createdAt: string;
}

export interface Payment {
  _id: string;
  mpesaTransactionId?: string;
  status: 'pending' | 'completed' | 'failed';
  amount: number;
  reference: string;
  createdAt: string;
  updatedAt: string;
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: {
    message: string;
  };
}

// Form types
export interface LoginForm {
  email: string;
  password: string;
}

export interface SignupForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: 'patient' | 'doctor';
}

export interface AppointmentForm {
  doctorId: string;
  date: string;
  time: string;
  symptoms?: string;
  notes?: string;
}

export interface PrescriptionForm {
  appointmentId: string;
  medications: Array<{
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
  }>;
  notes?: string;
}