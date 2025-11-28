import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

console.log('Frontend Debug - API Base URL:', API_BASE_URL);

// Type definitions
interface ProfileUpdate {
  fullName?: string;
  phone?: string;
  address?: string;
  dateOfBirth?: Date;
  gender?: string;
  emergencyContact?: string;
  medicalHistory?: string[];
  allergies?: string[];
}

interface AppointmentData {
  patientId: string;
  doctorId: string;
  date: Date;
  time: string;
  status: string;
}

interface MessageData {
  senderId: string;
  receiverId: string;
  content: string;
}

// Get JWT token from localStorage
const getToken = () => localStorage.getItem('auth_token');

// Set up axios interceptor to include JWT auth token
axios.interceptors.request.use((config) => {
  console.log('Frontend Debug - API Request:', config.method?.toUpperCase(), config.url);
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log('Frontend Debug - Using JWT token');
  } else {
    console.log('Frontend Debug - No JWT token available');
  }
  return config;
});

// Add response interceptor for debugging
axios.interceptors.response.use(
  (response) => {
    console.log('Frontend Debug - API Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('Frontend Debug - API Error:', error.response?.status, error.response?.data || error.message, error.config?.url);
    return Promise.reject(error);
  }
);

// Authentication Functions
export const signUp = async (name: string, email: string, password: string, role: string = 'patient') => {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/signup`, {
      name,
      email,
      password,
      role
    });

    const { user, token } = response.data.data;

    // Store auth data
    localStorage.setItem('auth_token', token);
    localStorage.setItem('user_info', JSON.stringify(user));

    return {
      data: {
        user,
        session: { access_token: token }
      },
      error: null
    };
  } catch (error: unknown) {
    const err = error as { response?: { data?: { error?: { message: string } } } };
    return { data: null, error: err.response?.data?.error || { message: 'Sign up failed' } };
  }
};

export const signIn = async (email: string, password: string) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      email,
      password
    });

    const { user, token } = response.data.data;

    // Store auth data
    localStorage.setItem('auth_token', token);
    localStorage.setItem('user_info', JSON.stringify(user));

    return {
      data: {
        user,
        session: { access_token: token }
      },
      error: null
    };
  } catch (error: unknown) {
    const err = error as { response?: { data?: { error?: { message: string } } } };
    return { data: null, error: err.response?.data?.error || { message: 'Sign in failed' } };
  }
};

export const signOut = async () => {
  // For JWT, sign out is handled on client side by removing token
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user_info');
  return { error: null };
};


export const resetPassword = async (email: string) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/forgot-password`, { email });
    return response.data;
  } catch (error: unknown) {
    const err = error as { response?: { data?: { error?: { message: string } } } };
    return { data: null, error: err.response?.data?.error || { message: 'Failed to send reset link' } };
  }
};

// Database Query Functions
export const getUserProfile = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/users/profile`);
    return response.data;
  } catch (error: unknown) {
    const err = error as { response?: { data?: { error?: { message: string } } } };
    return { data: null, error: err.response?.data?.error || { message: 'Failed to get profile' } };
  }
};

export const updateUserProfile = async (updates: any) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/users/profile`, updates);
    return response.data;
  } catch (error: unknown) {
    const err = error as { response?: { data?: { error?: { message: string } } } };
    return { data: null, error: err.response?.data?.error || { message: 'Failed to update profile' } };
  }
};

export const getDoctors = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/doctors`);
    return response.data;
  } catch (error: any) {
    return { data: null, error: error.response?.data?.error || { message: 'Failed to get doctors' } };
  }
};

export const getDoctorsByCity = async (city: string) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/doctors/city/${city}`);
    return response.data;
  } catch (error: any) {
    return { data: null, error: error.response?.data?.error || { message: 'Failed to get doctors by city' } };
  }
};

export const getDoctorById = async (id: string) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/doctors/${id}`);
    return response.data;
  } catch (error: any) {
    return { data: null, error: error.response?.data?.error || { message: 'Failed to get doctor' } };
  }
};

export const createAppointment = async (appointmentData: any) => {
  try {
    // Transform the data to match backend expectations
    const transformedData = {
      doctor: appointmentData.doctor,
      date: appointmentData.date,
      time: appointmentData.time,
      symptoms: appointmentData.symptoms || '',
      notes: appointmentData.notes || ''
    };
    const response = await axios.post(`${API_BASE_URL}/appointments`, transformedData);
    return response.data;
  } catch (error: any) {
    return { data: null, error: error.response?.data?.error || { message: 'Failed to create appointment' } };
  }
};

export const getUserAppointments = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/appointments`);
    return response.data;
  } catch (error: any) {
    return { data: null, error: error.response?.data?.error || { message: 'Failed to get appointments' } };
  }
};

export const getDoctorAppointmentsForDate = async (doctorId: string, date: Date) => {
  try {
    const dateString = date.toISOString().split('T')[0]; // Get YYYY-MM-DD format
    const response = await axios.get(`${API_BASE_URL}/doctors/${doctorId}/appointments/${dateString}`);
    return response.data;
  } catch (error: any) {
    return { data: null, error: error.response?.data?.error || { message: 'Failed to get appointments for date' } };
  }
};

export const searchMedicines = async (query: string) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/medicines/search?q=${encodeURIComponent(query)}`);
    return response.data;
  } catch (error: any) {
    return { data: null, error: error.response?.data?.error || { message: 'Failed to search medicines' } };
  }
};

export const sendMessage = async (messageData: MessageData) => {
  try {
    // Transform field names to match backend expectations
    const transformedData = {
      receiver: messageData.receiverId,
      content: messageData.content
    };
    const response = await axios.post(`${API_BASE_URL}/messages`, transformedData);
    return response.data;
  } catch (error: any) {
    return { data: null, error: error.response?.data?.error || { message: 'Failed to send message' } };
  }
};

export const getUserMessages = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/messages`);
    return response.data;
  } catch (error: any) {
    return { data: null, error: error.response?.data?.error || { message: 'Failed to get messages' } };
  }
};

export const getNews = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/news`);
    return response.data;
  } catch (error: any) {
    return { data: null, error: error.response?.data?.error || { message: 'Failed to get news' } };
  }
};

// Prescription Functions
export const getUserPrescriptions = async () => {
  try {
    // Get user role from localStorage to determine which endpoint to call
    const userInfo = localStorage.getItem('user_info');
    const user = userInfo ? JSON.parse(userInfo) : null;
    const endpoint = user?.role === 'doctor' ? 'doctor' : 'patient';

    const response = await axios.get(`${API_BASE_URL}/prescriptions/${endpoint}`);
    return response.data;
  } catch (error: any) {
    return { data: null, error: error.response?.data?.error || { message: 'Failed to get prescriptions' } };
  }
};

export const createPrescription = async (prescriptionData: any) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/prescriptions`, prescriptionData);
    return response.data;
  } catch (error: any) {
    return { data: null, error: error.response?.data?.error || { message: 'Failed to create prescription' } };
  }
};

export const downloadPrescriptionPDF = async (prescriptionId: string) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/prescriptions/${prescriptionId}/pdf`, {
      responseType: 'blob'
    });
    return response.data;
  } catch (error: any) {
    return { data: null, error: error.response?.data?.error || { message: 'Failed to download PDF' } };
  }
};

// File Upload Functions
export const uploadMedicalDocument = async (file: File, type: string, description?: string) => {
  try {
    const formData = new FormData();
    formData.append('document', file);
    formData.append('type', type);
    if (description) {
      formData.append('description', description);
    }

    const response = await axios.post(`${API_BASE_URL}/uploads/medical-document`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error: any) {
    return { data: null, error: error.response?.data?.error || { message: 'Failed to upload document' } };
  }
};

export const getMedicalDocuments = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/uploads/medical-documents`);
    return response.data;
  } catch (error: any) {
    return { data: null, error: error.response?.data?.error || { message: 'Failed to get documents' } };
  }
};

// Doctor-specific functions
export const getDoctorPatients = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/users/doctor/patients`);
    return response.data;
  } catch (error: any) {
    return { data: null, error: error.response?.data?.error || { message: 'Failed to get patients' } };
  }
};

export const getPatientProfile = async (patientId: string) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/users/patient/${patientId}`);
    return response.data;
  } catch (error: any) {
    return { data: null, error: error.response?.data?.error || { message: 'Failed to get patient profile' } };
  }
};