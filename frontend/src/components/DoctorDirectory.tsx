import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, MapPin, Star, Search, Filter, SlidersHorizontal, X, Lock, Crown, CreditCard } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppointmentStore, useAuthStore } from '../lib/store';
import toast from 'react-hot-toast';
import PaymentModal from './PaymentModal';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

interface Doctor {
  _id: string;
  name: string;
  specialization: string;
  city: string;
  hospital: string;
  rating: number;
  reviewCount: number;
  consultationFee: number;
  user: {
    name: string;
    email: string;
  };
}

interface FilterOptions {
  specialties: string[];
  cities: string[];
  hospitals: string[];
  ratingRange: { min: number; max: number };
  feeRange: { min: number; max: number };
}

interface Filters {
  specialty: string;
  city: string;
  hospital: string;
  minRating: number;
  maxRating: number;
  minFee: number;
  maxFee: number;
  sortBy: string;
  sortOrder: string;
}

const DoctorDirectory: React.FC = () => {
  const navigate = useNavigate();
  const { setSelectedDoctor } = useAppointmentStore();
  const { user, isAuthenticated } = useAuthStore();

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Payment and subscription states
  const [subscriptionStatus, setSubscriptionStatus] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentType, setPaymentType] = useState<'one_time' | 'subscription'>('one_time');
  const [hasAccess, setHasAccess] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);

  const [filters, setFilters] = useState<Filters>({
    specialty: '',
    city: '',
    hospital: '',
    minRating: 0,
    maxRating: 5,
    minFee: 0,
    maxFee: 10000,
    sortBy: 'rating',
    sortOrder: 'desc'
  });

  useEffect(() => {
    checkSubscriptionStatus();
    fetchFilterOptions();
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (hasAccess) {
      fetchDoctors();
    }
  }, [filters, currentPage, hasAccess]);

  const checkSubscriptionStatus = async () => {
    if (!isAuthenticated || !user) {
      setCheckingAccess(false);
      setHasAccess(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/payments/subscription-status`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSubscriptionStatus(data.data);
        setHasAccess(data.data?.features?.doctorSearch?.hasAccess || false);
      } else {
        setHasAccess(false);
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
      setHasAccess(false);
    } finally {
      setCheckingAccess(false);
    }
  };

  const fetchFilterOptions = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/doctors/filters`);
      if (response.ok) {
        const data = await response.json();
        setFilterOptions(data.data);
        // Update filter ranges
        setFilters(prev => ({
          ...prev,
          maxRating: data.data.ratingRange.max,
          maxFee: data.data.feeRange.max
        }));
      }
    } catch (error) {
      console.error('Error fetching filter options:', error);
    }
  };

  const fetchDoctors = async () => {
    if (!hasAccess) return;

    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: '12',
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) =>
            value !== '' && value !== 0 && value !== 5 && value !== 10000
          )
        )
      });

      const response = await fetch(`${API_BASE_URL}/doctors?${queryParams}`);
      if (response.ok) {
        const data = await response.json();
        setDoctors(data.data || []);
        setTotalPages(data.pagination?.pages || 1);

        // Track usage for one-time payments
        if (subscriptionStatus?.subscription?.type === 'one_time') {
          await trackUsage();
        }
      } else {
        toast.error('Failed to load doctors');
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
      toast.error('Failed to load doctors');
    } finally {
      setLoading(false);
    }
  };

  const trackUsage = async () => {
    try {
      await fetch(`${API_BASE_URL}/payments/track-usage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ feature: 'doctor_search' })
      });
    } catch (error) {
      console.error('Error tracking usage:', error);
    }
  };

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    checkSubscriptionStatus(); // Refresh subscription status
    toast.success('Payment successful! You now have access to doctor search.');
  };

  const handleUnlockAccess = (type: 'one_time' | 'subscription') => {
    if (!isAuthenticated) {
      toast.error('Please log in to access premium features');
      navigate('/login');
      return;
    }

    setPaymentType(type);
    setShowPaymentModal(true);
  };

  const handleFilterChange = (key: keyof Filters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  const clearFilters = () => {
    setFilters({
      specialty: '',
      city: '',
      hospital: '',
      minRating: 0,
      maxRating: filterOptions?.ratingRange.max || 5,
      minFee: 0,
      maxFee: filterOptions?.feeRange.max || 10000,
      sortBy: 'rating',
      sortOrder: 'desc'
    });
    setSearchTerm('');
    setCurrentPage(1);
  };

  const filteredDoctors = doctors.filter(doctor =>
    doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doctor.specialization.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doctor.hospital.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleBookAppointment = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    navigate('/appointments');
  };

  return (
    <section className="py-20 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-4xl md:text-5xl font-bold text-gray-900"
          >
            Find Your <span className="bg-gradient-to-r from-red-600 via-pink-500 to-orange-500 text-transparent bg-clip-text">Perfect Doctor</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-4 max-w-2xl mx-auto text-xl text-gray-600"
          >
            Browse our comprehensive directory of qualified healthcare professionals
          </motion.p>
        </div>

        {/* Payment Gate */}
        {checkingAccess ? (
          <div className="bg-white rounded-xl shadow-md p-8 mb-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Checking access...</p>
          </div>
        ) : !hasAccess ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl shadow-md p-8 mb-8 border-2 border-dashed border-blue-200"
          >
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Lock className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Unlock Doctor Search</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Get access to our comprehensive doctor directory with advanced search and filtering capabilities.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                {/* One-time Access */}
                <div className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="flex items-center mb-3">
                    <CreditCard className="w-5 h-5 text-blue-600 mr-2" />
                    <span className="font-semibold text-gray-900">One-Time Access</span>
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-2">KSh 50</div>
                  <p className="text-sm text-gray-600 mb-4">24-hour access to doctor search</p>
                  <button
                    onClick={() => handleUnlockAccess('one_time')}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors"
                  >
                    Pay KSh 50
                  </button>
                </div>

                {/* Monthly Subscription */}
                <div className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-md transition-shadow relative">
                  <div className="absolute -top-2 -right-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                    <Crown className="w-3 h-3 inline mr-1" />
                    BEST VALUE
                  </div>
                  <div className="flex items-center mb-3">
                    <Crown className="w-5 h-5 text-purple-600 mr-2" />
                    <span className="font-semibold text-gray-900">Monthly Subscription</span>
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-2">KSh 500</div>
                  <p className="text-sm text-gray-600 mb-4">30 days unlimited access</p>
                  <button
                    onClick={() => handleUnlockAccess('subscription')}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-2 px-4 rounded-lg transition-colors"
                  >
                    Subscribe Now
                  </button>
                </div>
              </div>

              {!isAuthenticated && (
                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> You need to be logged in to access premium features.
                    <Link to="/login" className="text-blue-600 hover:text-blue-800 ml-1 font-medium">
                      Sign in here
                    </Link>
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          /* Subscription Status Banner */
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Crown className="w-5 h-5 text-green-600 mr-2" />
                <div>
                  <p className="text-sm font-medium text-green-800">
                    {subscriptionStatus?.subscription?.type === 'monthly'
                      ? 'Premium Subscription Active'
                      : 'One-Time Access Active'
                    }
                  </p>
                  <p className="text-xs text-green-600">
                    {subscriptionStatus?.subscription?.type === 'monthly'
                      ? `Expires: ${new Date(subscriptionStatus.subscription.expiresAt).toLocaleDateString()}`
                      : `${subscriptionStatus?.features?.doctorSearch?.accessCount || 0} searches used`
                    }
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-green-800">
                  {subscriptionStatus?.subscription?.type === 'monthly' ? 'Unlimited' : 'Limited'} Access
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Search and Filters - Only show if user has access */}
        {hasAccess && (
          <>
            <div className="bg-white rounded-xl shadow-md p-6 mb-8">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Search Bar */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    placeholder="Search doctors by name, specialty, or hospital..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>

                {/* Filter Toggle */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <SlidersHorizontal className="h-5 w-5 mr-2" />
                  Filters
                  {(filters.specialty || filters.city || filters.hospital ||
                    filters.minRating > 0 || filters.maxFee < (filterOptions?.feeRange.max || 10000)) && (
                    <span className="ml-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">!</span>
                  )}
                </button>
              </div>

              {/* Advanced Filters */}
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-6 pt-6 border-t border-gray-200"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Specialty Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Specialty</label>
                      <select
                        value={filters.specialty}
                        onChange={(e) => handleFilterChange('specialty', e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      >
                        <option value="">All Specialties</option>
                        {filterOptions?.specialties.map(specialty => (
                          <option key={specialty} value={specialty}>{specialty}</option>
                        ))}
                      </select>
                    </div>

                    {/* City Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                      <select
                        value={filters.city}
                        onChange={(e) => handleFilterChange('city', e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      >
                        <option value="">All Cities</option>
                        {filterOptions?.cities.map(city => (
                          <option key={city} value={city}>{city}</option>
                        ))}
                      </select>
                    </div>

                    {/* Hospital Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Hospital</label>
                      <select
                        value={filters.hospital}
                        onChange={(e) => handleFilterChange('hospital', e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      >
                        <option value="">All Hospitals</option>
                        {filterOptions?.hospitals.map(hospital => (
                          <option key={hospital} value={hospital}>{hospital}</option>
                        ))}
                      </select>
                    </div>

                    {/* Sort Options */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                      <select
                        value={`${filters.sortBy}-${filters.sortOrder}`}
                        onChange={(e) => {
                          const [sortBy, sortOrder] = e.target.value.split('-');
                          handleFilterChange('sortBy', sortBy);
                          handleFilterChange('sortOrder', sortOrder);
                        }}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      >
                        <option value="rating-desc">Highest Rated</option>
                        <option value="rating-asc">Lowest Rated</option>
                        <option value="consultationFee-asc">Lowest Fee</option>
                        <option value="consultationFee-desc">Highest Fee</option>
                        <option value="name-asc">Name A-Z</option>
                        <option value="name-desc">Name Z-A</option>
                      </select>
                    </div>
                  </div>

                  {/* Rating and Fee Filters */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                    {/* Rating Range */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Minimum Rating: {filters.minRating} stars
                      </label>
                      <input
                        type="range"
                        min="0"
                        max={filterOptions?.ratingRange.max || 5}
                        value={filters.minRating}
                        onChange={(e) => handleFilterChange('minRating', parseFloat(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    {/* Fee Range */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Max Fee: KSH {filters.maxFee.toLocaleString()}
                      </label>
                      <input
                        type="range"
                        min={filterOptions?.feeRange.min || 0}
                        max={filterOptions?.feeRange.max || 10000}
                        step="500"
                        value={filters.maxFee}
                        onChange={(e) => handleFilterChange('maxFee', parseFloat(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Clear Filters */}
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={clearFilters}
                      className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Clear All Filters
                    </button>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Results Count */}
            <div className="flex justify-between items-center mb-6">
              <p className="text-gray-600">
                {loading ? 'Loading...' : `Found ${filteredDoctors.length} doctor${filteredDoctors.length !== 1 ? 's' : ''}`}
              </p>
            </div>

            {/* Doctors Grid */}
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-red-500 border-r-transparent"></div>
                <span className="ml-2 text-gray-600">Loading doctors...</span>
              </div>
            ) : (
              <>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
                >
                  {filteredDoctors.map((doctor) => (
                    <motion.div
                      key={doctor._id}
                      whileHover={{ y: -5 }}
                      className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                    >
                      <div className="p-6">
                        <div className="flex items-start">
                          <div className="flex-shrink-0 mr-4">
                            <div className="h-16 w-16 rounded-full bg-gradient-to-r from-red-600 via-pink-500 to-orange-500 flex items-center justify-center">
                              <Users className="h-8 w-8 text-white" />
                            </div>
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900">{doctor.name}</h3>
                            <p className="text-gray-600 font-medium">{doctor.specialization}</p>
                            <div className="mt-1 flex items-center">
                              <Star className="h-4 w-4 text-yellow-400" />
                              <span className="ml-1 text-sm text-gray-500">
                                {doctor.rating.toFixed(1)} ({doctor.reviewCount} reviews)
                              </span>
                            </div>
                            <div className="mt-1 flex items-center text-sm text-gray-500">
                              <MapPin className="h-4 w-4 text-gray-400 mr-1" />
                              {doctor.city}
                            </div>
                            <div className="mt-1 text-sm text-gray-600">
                              <span className="font-medium">{doctor.hospital}</span>
                            </div>
                            <div className="mt-2 text-sm text-gray-600">
                              <span className="font-medium text-green-600">KSH {doctor.consultationFee.toLocaleString()}</span> consultation fee
                            </div>
                          </div>
                        </div>
                        <div className="mt-4 flex gap-2">
                          <button
                            onClick={() => handleBookAppointment(doctor)}
                            className="flex-1 bg-gradient-to-r from-red-600 via-pink-500 to-orange-500 text-white text-sm font-medium py-2 px-4 rounded-md hover:opacity-90 transition-opacity"
                          >
                            Book Appointment
                          </button>
                          <Link
                            to={`/doctors/${doctor._id}`}
                            className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50 transition-colors"
                          >
                            View Profile
                          </Link>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        Previous
                      </button>

                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const pageNum = Math.max(1, currentPage - 2) + i;
                        if (pageNum > totalPages) return null;

                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`px-3 py-2 border rounded-md ${
                              pageNum === currentPage
                                ? 'bg-red-500 text-white border-red-500'
                                : 'border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}

                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}

                {/* No Results */}
                {filteredDoctors.length === 0 && !loading && (
                  <div className="text-center py-12">
                    <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-medium text-gray-900 mb-2">No doctors found</h3>
                    <p className="text-gray-600 mb-4">Try adjusting your search criteria or filters</p>
                    <button
                      onClick={clearFilters}
                      className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                    >
                      Clear Filters
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* Payment Modal */}
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          type={paymentType}
          onSuccess={handlePaymentSuccess}
        />
      </div>
    </section>
  );
};

export default DoctorDirectory;