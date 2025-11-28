import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../lib/store';
import { AvailabilitySearchResult, SpecialistSearchForm } from '../types';
import { Search, MapPin, Clock, Star, DollarSign, User } from 'lucide-react';

const SpecialistSearch: React.FC = () => {
  const { user } = useAuthStore();
  const [searchResults, setSearchResults] = useState<AvailabilitySearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  const [formData, setFormData] = useState<SpecialistSearchForm>({
    specialty: '',
    latitude: undefined,
    longitude: undefined,
    radius: 50
  });

  useEffect(() => {
    // Get user's current location
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
  }, []);

  const searchSpecialists = async () => {
    if (!formData.specialty.trim()) {
      alert('Please enter a specialty to search');
      return;
    }

    setSearching(true);
    try {
      const params = new URLSearchParams({
        specialty: formData.specialty,
        ...(formData.latitude && { latitude: formData.latitude.toString() }),
        ...(formData.longitude && { longitude: formData.longitude.toString() }),
        ...(formData.radius && { radius: formData.radius.toString() })
      });

      const response = await fetch(`http://localhost:5001/api/availability/search/specialists?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.data || []);
      } else {
        alert('Failed to search specialists');
      }
    } catch (error) {
      console.error('Search error:', error);
      alert('Failed to search specialists');
    } finally {
      setSearching(false);
    }
  };

  const bookAppointment = (doctorId: string, hospital: string) => {
    // This would navigate to appointment booking with pre-filled data
    alert(`Booking appointment with doctor ${doctorId} at ${hospital}`);
    // You could implement navigation here
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <Search className="w-5 h-5" />
        Find Available Specialists
      </h2>

      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Specialty
          </label>
          <input
            type="text"
            value={formData.specialty}
            onChange={(e) => setFormData(prev => ({ ...prev, specialty: e.target.value }))}
            placeholder="e.g., Cardiology, Dermatology, Pediatrics"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search Radius (km)
            </label>
            <select
              value={formData.radius}
              onChange={(e) => setFormData(prev => ({ ...prev, radius: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={10}>10 km</option>
              <option value={25}>25 km</option>
              <option value={50}>50 km</option>
              <option value={100}>100 km</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={searchSpecialists}
              disabled={searching}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {searching ? 'Searching...' : 'Search Specialists'}
            </button>
          </div>
        </div>

        {formData.latitude && formData.longitude && (
          <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
            <MapPin className="w-4 h-4" />
            <span>Searching near: {formData.latitude.toFixed(4)}, {formData.longitude.toFixed(4)}</span>
          </div>
        )}
      </div>

      {searchResults.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">
            Found {searchResults.length} available specialist{searchResults.length !== 1 ? 's' : ''}
          </h3>

          {searchResults.map((result, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-5 h-5 text-blue-600" />
                    <h4 className="text-lg font-semibold text-gray-900">{result.doctor.name}</h4>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Available Now
                    </span>
                  </div>

                  <p className="text-blue-600 font-medium mb-2">{result.doctor.specialization}</p>

                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-400" />
                      <span>{result.doctor.rating.toFixed(1)} ({result.doctor.reviewCount} reviews)</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4" />
                      <span>KES {result.doctor.consultationFee}</span>
                    </div>

                    {result.distance && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span>{result.distance.toFixed(1)} km away</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span>{result.hospital}</span>
                  </div>
                </div>

                <button
                  onClick={() => bookAppointment(result.doctor._id, result.hospital)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
                >
                  Book Appointment
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {searchResults.length === 0 && !searching && formData.specialty && (
        <div className="text-center py-8">
          <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No available specialists found for "{formData.specialty}"</p>
          <p className="text-sm text-gray-400 mt-2">Try expanding your search radius or different specialty</p>
        </div>
      )}

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">Real-time Availability</h4>
        <p className="text-sm text-blue-800">
          This search shows doctors who are currently available for physical consultations.
          Results update in real-time based on doctor status and location.
        </p>
      </div>
    </div>
  );
};

export default SpecialistSearch;