import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../lib/store';
import { PhysicalAppointment, PhysicalAppointmentForm, Doctor } from '../types';
import { Calendar, Clock, MapPin, DollarSign, User, CheckCircle } from 'lucide-react';

const PhysicalAppointmentBooking: React.FC = () => {
  const { user } = useAuthStore();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState(false);

  const [formData, setFormData] = useState<PhysicalAppointmentForm>({
    doctor: '',
    hospital: '',
    date: '',
    time: '',
    symptoms: '',
    notes: ''
  });

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5001/api/doctors', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setDoctors(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch doctors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDoctorSelect = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setFormData(prev => ({
      ...prev,
      doctor: doctor._id,
      hospital: doctor.hospital || ''
    }));
  };

  const bookAppointment = async () => {
    if (!formData.doctor || !formData.hospital || !formData.date || !formData.time) {
      alert('Please fill in all required fields');
      return;
    }

    setBooking(true);
    try {
      const response = await fetch('http://localhost:5001/api/availability/appointments/physical', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const data = await response.json();
        alert('Appointment booked successfully! You will receive a confirmation notification.');
        // Reset form
        setFormData({
          doctor: '',
          hospital: '',
          date: '',
          time: '',
          symptoms: '',
          notes: ''
        });
        setSelectedDoctor(null);
      } else {
        const error = await response.json();
        alert(error.error?.message || 'Failed to book appointment');
      }
    } catch (error) {
      console.error('Booking error:', error);
      alert('Failed to book appointment');
    } finally {
      setBooking(false);
    }
  };

  const getAvailableTimeSlots = () => {
    // This would ideally come from the doctor's availability
    // For now, return some default slots
    return ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'];
  };

  if (user?.role !== 'patient') {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-gray-600">This feature is only available for patients.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <Calendar className="w-5 h-5" />
        Book Physical Appointment
      </h2>

      <div className="space-y-6">
        {/* Doctor Selection */}
        <div>
          <h3 className="text-lg font-medium mb-3">Select Doctor</h3>
          {loading ? (
            <p>Loading doctors...</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {doctors.map((doctor) => (
                <div
                  key={doctor._id}
                  onClick={() => handleDoctorSelect(doctor)}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedDoctor?._id === doctor._id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <User className="w-8 h-8 text-blue-600" />
                    <div>
                      <h4 className="font-semibold">{doctor.name}</h4>
                      <p className="text-sm text-blue-600">{doctor.specialization}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-gray-600">⭐ {doctor.rating}</span>
                        <span className="text-sm text-gray-600">({doctor.reviewCount} reviews)</span>
                      </div>
                      <p className="text-sm font-medium text-green-600 mt-1">
                        KES {doctor.consultationFee}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 mt-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span>{doctor.hospital}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Appointment Details */}
        {selectedDoctor && (
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium mb-4">Appointment Details</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hospital/Clinic
                </label>
                <input
                  type="text"
                  value={formData.hospital}
                  onChange={(e) => setFormData(prev => ({ ...prev, hospital: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter hospital name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Preferred Date
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Preferred Time
                </label>
                <select
                  value={formData.time}
                  onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select time</option>
                  {getAvailableTimeSlots().map((slot) => (
                    <option key={slot} value={slot}>{slot}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Symptoms/Reason for Visit (Optional)
                </label>
                <textarea
                  value={formData.symptoms}
                  onChange={(e) => setFormData(prev => ({ ...prev, symptoms: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe your symptoms or reason for the appointment"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Additional Notes (Optional)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Any additional information"
                />
              </div>
            </div>

            {/* Summary */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-2">Appointment Summary</h4>
              <div className="space-y-1 text-sm">
                <p><strong>Doctor:</strong> {selectedDoctor.name}</p>
                <p><strong>Specialty:</strong> {selectedDoctor.specialization}</p>
                <p><strong>Hospital:</strong> {formData.hospital || 'Not specified'}</p>
                <p><strong>Date:</strong> {formData.date || 'Not selected'}</p>
                <p><strong>Time:</strong> {formData.time || 'Not selected'}</p>
                <p><strong>Consultation Fee:</strong> KES {selectedDoctor.consultationFee}</p>
              </div>
            </div>

            <button
              onClick={bookAppointment}
              disabled={booking}
              className="w-full mt-4 bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {booking ? 'Booking Appointment...' : 'Book Physical Appointment'}
            </button>
          </div>
        )}
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">Physical Appointment Process</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Select your preferred doctor and hospital</li>
          <li>• Choose a convenient date and time</li>
          <li>• Payment will be processed after booking confirmation</li>
          <li>• You will receive SMS and email confirmations</li>
          <li>• Arrive 15 minutes before your appointment time</li>
        </ul>
      </div>
    </div>
  );
};

export default PhysicalAppointmentBooking;