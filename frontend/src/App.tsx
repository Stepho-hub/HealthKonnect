import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ClerkProvider } from '@clerk/clerk-react';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import ServiceCards from './components/ServiceCards';
import BestDoctors from './components/BestDoctors';
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

// Check if Clerk is available
const CLERK_AVAILABLE = !!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

console.log('Frontend Debug - Environment:', {
  CLERK_AVAILABLE,
  DEMO_MODE,
  VITE_CLERK_PUBLISHABLE_KEY: import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ? 'Present' : 'Missing',
  VITE_API_URL: import.meta.env.VITE_API_URL || 'Using default localhost:5001'
});

function AppContent() {
  return (
    <Router>
      <div className="min-h-screen bg-white">
        <Toaster position="top-right" />

        {/* Demo banner */}
        {DEMO_MODE && (
          <div className="bg-yellow-100 border-b border-yellow-200 px-4 py-2">
            <div className="max-w-7xl mx-auto">
              <p className="text-yellow-800 text-sm">
                🚀 <strong>Demo Mode:</strong> Authentication disabled for testing.
                You can browse doctors, book appointments, and explore all features.
              </p>
            </div>
          </div>
        )}

        {/* Clerk banner */}
        {CLERK_AVAILABLE && !DEMO_MODE && (
          <div className="bg-blue-100 border-b border-blue-200 px-4 py-2">
            <div className="max-w-7xl mx-auto">
              <p className="text-blue-800 text-sm">
                🔐 <strong>Clerk Authentication:</strong> Full authentication enabled.
                Sign up or log in to access all features.
              </p>
            </div>
          </div>
        )}

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
          <Route path="/doctors" element={<BestDoctors />} />
          <Route path="/messages" element={<Messaging />} />
          <Route path="/prescriptions" element={<Prescriptions />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/admin/add-doctor" element={<DoctorRegistration />} />
        </Routes>

        <Footer />
      </div>
    </Router>
  );
}

function App() {
  // Use ClerkProvider if Clerk is available
  if (CLERK_AVAILABLE) {
    return (
      <ClerkProvider
        publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}
        appearance={{
          baseTheme: undefined,
          variables: {
            colorPrimary: '#2563eb',
            colorBackground: '#ffffff',
            colorInputBackground: '#f8fafc',
            colorInputText: '#1e293b',
          },
        }}
      >
        <AppContent />
      </ClerkProvider>
    );
  }

  // No Clerk - use without ClerkProvider
  return <AppContent />;
}

export default App;