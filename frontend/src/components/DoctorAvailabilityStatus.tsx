import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../lib/store';
import { DoctorAvailability, DoctorStatusUpdateForm } from '../types';
import { MapPin, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const DoctorAvailabilityStatus: React.FC = () => {
  const { user } = useAuthStore();
  const [availability, setAvailability] = useState<DoctorAvailability | null>(null);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);

  const [formData, setFormData] = useState<DoctorStatusUpdateForm>({
    status: 'offline',
    currentHospital: '',
    latitude: undefined,
    longitude: undefined
  });

  useEffect(() => {
    if (user?.role === 'doctor') {
      fetchAvailabilityStatus();
      getCurrentLocation();
    }
  }, [user]);

  const fetchAvailabilityStatus = async () => {
    try {
      const response = await fetch(`http://localhost:5001/api/availability/doctor/status/${user?._id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAvailability(data.data);
        setFormData({
          status: data.data.status,
          currentHospital: data.data.currentHospital || '',
          latitude: data.data.location?.latitude,
          longitude: data.data.location?.longitude
        });
      }
    } catch (error) {
      console.error('Failed to fetch availability status:', error);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          }));
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  };

  const updateStatus = async () => {
    setUpdating(true);
    try {
      const response = await fetch('http://localhost:5001/api/availability/doctor/status', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const data = await response.json();
        setAvailability(data.data);
        alert('Status updated successfully!');
      } else {
        alert('Failed to update status');
      }
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'busy':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'offline':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'busy':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'offline':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (user?.role !== 'doctor') {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <MapPin className="w-5 h-5" />
        Doctor Availability Status
      </h2>

      {availability && (
        <div className="mb-4 p-3 rounded-lg border flex items-center gap-3">
          {getStatusIcon(availability.status)}
          <div>
            <p className="font-medium">Current Status</p>
            <p className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(availability.status)}`}>
              {availability.status.toUpperCase()}
            </p>
            {availability.currentHospital && (
              <p className="text-sm text-gray-600 mt-1">At: {availability.currentHospital}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Last updated: {new Date(availability.lastUpdated).toLocaleString()}
            </p>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            value={formData.status}
            onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="available">Available</option>
            <option value="busy">Busy</option>
            <option value="offline">Offline</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Current Hospital (Optional)
          </label>
          <input
            type="text"
            value={formData.currentHospital}
            onChange={(e) => setFormData(prev => ({ ...prev, currentHospital: e.target.value }))}
            placeholder="Enter hospital name"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-600">
          <MapPin className="w-4 h-4" />
          <span>
            Location: {formData.latitude && formData.longitude
              ? `${formData.latitude.toFixed(4)}, ${formData.longitude.toFixed(4)}`
              : 'Not available'
            }
          </span>
        </div>

        <button
          onClick={updateStatus}
          disabled={updating}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {updating ? 'Updating...' : 'Update Status'}
        </button>
      </div>

      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> Updating your status helps patients find available doctors in real-time.
          Your location is automatically detected for better matching.
        </p>
      </div>
    </div>
  );
};

export default DoctorAvailabilityStatus;