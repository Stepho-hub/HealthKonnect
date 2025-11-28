import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './lib/store';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import ServiceCards from './components/ServiceCards';
import BestDoctors from './components/BestDoctors';
import DoctorDirectory from './components/DoctorDirectory';
import AppointmentBooking from './components/AppointmentBooking';
import Messaging from './components/Messaging';
import ContactUs from './components/ContactUs';
import Footer from './components/Footer';
import Login from './components/Login';
import Signup from './components/Signup';
import Profile from './components/Profile';
import VerifyEmail from './components/VerifyEmail';
import AdminPanel from './components/AdminPanel';
import DoctorRegistration from './components/DoctorRegistration';
import Prescriptions from './components/Prescriptions';
import DoctorAvailabilityStatus from './components/DoctorAvailabilityStatus';
import SpecialistSearch from './components/SpecialistSearch';
import PhysicalAppointmentBooking from './components/PhysicalAppointmentBooking';
import NotificationCenter from './components/NotificationCenter';
import AISymptomChecker from './components/AISymptomChecker';
import VideoConsultation, { VideoConsultationErrorBoundary } from './components/VideoConsultation';
import HealthMonitoring from './components/HealthMonitoring';
import EmergencyCare from './components/EmergencyCare';
import PaymentSuccess from './components/PaymentSuccess';

// JWT Authentication mode
const JWT_MODE = true;

console.log('Frontend Debug - Environment:', {
  JWT_MODE,
  VITE_API_URL: import.meta.env.VITE_API_URL || 'Using default localhost:5000'
});

function AppContent() {
  const { initializeAuth } = useAuthStore();

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);
  return (
    <Router>
      <div className="min-h-screen bg-white">
        <Toaster position="top-right" />

        {/* JWT Authentication banner */}
        <div className="bg-green-100 border-b border-green-200 px-4 py-2">
          <div className="max-w-7xl mx-auto">
            <p className="text-green-800 text-sm">
              🔐 <strong>JWT Authentication:</strong> Full authentication enabled.
              Sign up or log in to access all features.
            </p>
          </div>
        </div>

        <Navbar />

        <Routes>
          <Route path="/" element={
            <>
              <Hero />
              <ServiceCards />
              <BestDoctors />
              <ContactUs />
            </>
          } />
          <Route path="/login/*" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/appointments" element={<AppointmentBooking />} />
          <Route path="/doctors" element={<DoctorDirectory />} />
          <Route path="/messages" element={<Messaging />} />
          <Route path="/prescriptions" element={<Prescriptions />} />
          <Route path="/symptom-checker" element={<AISymptomChecker />} />
          <Route path="/video-consultation" element={
            <VideoConsultationErrorBoundary>
              <VideoConsultation />
            </VideoConsultationErrorBoundary>
          } />
          <Route path="/health-monitoring" element={<HealthMonitoring />} />
          <Route path="/emergency-care" element={<EmergencyCare />} />
          <Route path="/doctor-availability" element={<DoctorAvailabilityStatus />} />
          <Route path="/specialist-search" element={<SpecialistSearch />} />
          <Route path="/physical-appointments" element={<PhysicalAppointmentBooking />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/admin/add-doctor" element={<DoctorRegistration />} />
          <Route path="/payment-success" element={<PaymentSuccess />} />
        </Routes>

        <Footer />
      </div>
    </Router>
  );
}

function App() {
  return <AppContent />;
}

export default App;