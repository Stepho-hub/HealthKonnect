import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Stethoscope, UserPlus, AlertCircle, CheckCircle } from 'lucide-react';
// import { useAuth } from '@clerk/clerk-react';
import toast from 'react-hot-toast';

interface DoctorFormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  specialization: string;
  licenseNumber: string;
  experience: string;
  hospital: string;
  bio: string;
  consultationFee: string;
  city: string;
}

const DoctorRegistration: React.FC = () => {
  // Mock auth for demo purposes
  const getToken = async () => 'demo-token';
  const isSignedIn = true;

  const [formData, setFormData] = useState<DoctorFormData>({
    name: '',
    email: '',
    phone: '',
    address: '',
    specialization: '',
    licenseNumber: '',
    experience: '',
    hospital: '',
    bio: '',
    consultationFee: '',
    city: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const requiredFields = ['name', 'email', 'specialization', 'licenseNumber', 'hospital', 'city'];
    const missingFields = requiredFields.filter(field => !formData[field as keyof DoctorFormData]?.trim());

    if (missingFields.length > 0) {
      toast.error(`Please fill in: ${missingFields.join(', ')}`);
      return false;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Please enter a valid email address');
      return false;
    }

    // Experience validation
    if (formData.experience && (isNaN(Number(formData.experience)) || Number(formData.experience) < 0)) {
      toast.error('Please enter a valid number for years of experience');
      return false;
    }

    // Consultation fee validation
    if (formData.consultationFee && (isNaN(Number(formData.consultationFee)) || Number(formData.consultationFee) < 0)) {
      toast.error('Please enter a valid consultation fee');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      // Check if user is signed in
      if (!isSignedIn) {
        toast.error('You must be logged in as an admin to add doctors');
        setIsLoading(false);
        return;
      }

      // Get Clerk JWT token
      const token = await getToken();

      if (!token) {
        toast.error('Authentication token not available. Please try logging in again.');
        setIsLoading(false);
        return;
      }

      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
      const response = await fetch(`${API_BASE_URL}/admin/doctors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          address: formData.address.trim(),
          specialization: formData.specialization.trim(),
          licenseNumber: formData.licenseNumber.trim(),
          experience: formData.experience ? parseInt(formData.experience) : 0,
          hospital: formData.hospital.trim(),
          bio: formData.bio.trim(),
          consultationFee: formData.consultationFee ? parseFloat(formData.consultationFee) : 0,
          city: formData.city.trim()
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Doctor added successfully!');
        setIsSuccess(true);

        // Reset form
        setFormData({
          name: '',
          email: '',
          phone: '',
          address: '',
          specialization: '',
          licenseNumber: '',
          experience: '',
          hospital: '',
          bio: '',
          consultationFee: '',
          city: ''
        });

        // Reset success state after 3 seconds
        setTimeout(() => setIsSuccess(false), 3000);
      } else {
        toast.error(data.error?.message || 'Failed to add doctor');
      }
    } catch (error) {
      console.error('Doctor registration error:', error);
      toast.error('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const specializations = [
    'General Medicine',
    'Cardiology',
    'Dermatology',
    'Endocrinology',
    'Gastroenterology',
    'Neurology',
    'Obstetrics & Gynecology',
    'Ophthalmology',
    'Orthopedics',
    'Pediatrics',
    'Psychiatry',
    'Radiology',
    'Surgery',
    'Urology',
    'Dentistry',
    'Other'
  ];

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center"
        >
          <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Doctor Added Successfully!</h2>
          <p className="text-gray-600 mb-6">
            The doctor has been added to the system. They can now sign up using their email address.
          </p>
          <button
            onClick={() => setIsSuccess(false)}
            className="w-full bg-gradient-to-r from-red-600 via-pink-500 to-orange-500 hover:opacity-90 text-white py-2 px-4 rounded-md font-medium transition-opacity"
          >
            Add Another Doctor
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-xl shadow-lg p-8"
        >
          <div className="text-center mb-8">
            <Stethoscope className="mx-auto h-12 w-12 text-red-600 mb-4" />
            <h2 className="text-3xl font-bold text-gray-900">Add New Doctor</h2>
            <p className="mt-2 text-sm text-gray-600">
              Register a new medical professional to join the HealthKonnect platform
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-red-500 focus:border-red-500"
                    placeholder="Dr. John Smith"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-red-500 focus:border-red-500"
                    placeholder="doctor@example.com"
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-red-500 focus:border-red-500"
                    placeholder="+1234567890"
                  />
                </div>
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                    City *
                  </label>
                  <input
                    id="city"
                    name="city"
                    type="text"
                    required
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-red-500 focus:border-red-500"
                    placeholder="New York"
                  />
                </div>
              </div>
              <div className="mt-4">
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <input
                  id="address"
                  name="address"
                  type="text"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-red-500 focus:border-red-500"
                  placeholder="123 Medical Center Dr, City, State"
                />
              </div>
            </div>

            {/* Professional Information */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Professional Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="specialization" className="block text-sm font-medium text-gray-700 mb-1">
                    Specialization *
                  </label>
                  <select
                    id="specialization"
                    name="specialization"
                    required
                    value={formData.specialization}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-red-500 focus:border-red-500"
                  >
                    <option value="">Select specialization</option>
                    {specializations.map(spec => (
                      <option key={spec} value={spec}>{spec}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="licenseNumber" className="block text-sm font-medium text-gray-700 mb-1">
                    License Number *
                  </label>
                  <input
                    id="licenseNumber"
                    name="licenseNumber"
                    type="text"
                    required
                    value={formData.licenseNumber}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-red-500 focus:border-red-500"
                    placeholder="MD123456"
                  />
                </div>
                <div>
                  <label htmlFor="experience" className="block text-sm font-medium text-gray-700 mb-1">
                    Years of Experience
                  </label>
                  <input
                    id="experience"
                    name="experience"
                    type="number"
                    min="0"
                    value={formData.experience}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-red-500 focus:border-red-500"
                    placeholder="5"
                  />
                </div>
                <div>
                  <label htmlFor="consultationFee" className="block text-sm font-medium text-gray-700 mb-1">
                    Consultation Fee ($)
                  </label>
                  <input
                    id="consultationFee"
                    name="consultationFee"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.consultationFee}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-red-500 focus:border-red-500"
                    placeholder="100.00"
                  />
                </div>
              </div>
              <div className="mt-4">
                <label htmlFor="hospital" className="block text-sm font-medium text-gray-700 mb-1">
                  Hospital/Clinic *
                </label>
                <input
                  id="hospital"
                  name="hospital"
                  type="text"
                  required
                  value={formData.hospital}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-red-500 focus:border-red-500"
                  placeholder="General Hospital"
                />
              </div>
              <div className="mt-4">
                <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
                  Professional Bio
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  rows={4}
                  value={formData.bio}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-red-500 focus:border-red-500"
                  placeholder="Brief professional biography, qualifications, and areas of expertise..."
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex items-center justify-between pt-6 border-t">
              <div className="text-sm text-gray-600">
                <AlertCircle className="inline h-4 w-4 mr-1" />
                Fields marked with * are required
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="bg-gradient-to-r from-red-600 via-pink-500 to-orange-500 hover:opacity-90 disabled:opacity-50 text-white py-2 px-6 rounded-md font-medium transition-opacity focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 flex items-center"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Adding Doctor...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-5 w-5" />
                    Add Doctor
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default DoctorRegistration;