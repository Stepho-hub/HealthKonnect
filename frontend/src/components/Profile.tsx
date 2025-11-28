import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Edit, User, Mail, Phone, MapPin, Calendar, Clock, Save, X, CheckCircle, AlertCircle } from 'lucide-react';
import { getUserProfile, updateUserProfile, getUserAppointments } from '../lib/mongodb';
import { useAuthStore } from '../lib/store';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface ProfileData {
  _id?: string;
  clerkId?: string;
  name?: string;
  phone?: string;
  role?: string;
  location?: string;
  age?: number;
  gender?: string;
  medicalConditions?: string[];
  createdAt?: string;
  updatedAt?: string;
}

interface Appointment {
  _id: string;
  patientId?: {
    name: string;
    email: string;
  };
  doctorId?: {
    name: string;
    email: string;
  };
  date: string;
  time: string;
  status: string;
}

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<ProfileData>({});
  const [isDoctor, setIsDoctor] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [updateSuccess, setUpdateSuccess] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchProfile();
    }
  }, [isAuthenticated, user]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (profile?._id) {
      fetchAppointments();
    }
  }, [profile?._id, isDoctor]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchProfile = async () => {
    try {
      if (!user) {
        navigate('/login');
        return;
      }

      // First try to get existing profile
      console.log('Fetching existing profile...');
      const { data: existingProfile, error: getError } = await getUserProfile();

      if (getError) {
        console.log('Profile not found, creating new profile...');
        // Profile doesn't exist, create it
        const profileData = {
          name: user?.name || 'User',
          phone: '',
          location: '',
          age: undefined,
          gender: '',
          medicalConditions: []
        };

        console.log('Creating profile with data:', profileData);
        const { data: createdProfile, error: createError } = await updateUserProfile(profileData);

        if (createError) {
          console.error('Failed to create profile:', createError);
          // Set a default profile locally as last resort
          setProfile(profileData);
          setEditedProfile(profileData);
          setIsDoctor(false);
          toast.error('Failed to create profile. Please try refreshing the page.');
        } else {
          console.log('Profile created successfully:', createdProfile);
          setProfile(createdProfile);
          setEditedProfile(createdProfile);
          setIsDoctor(createdProfile?.role === 'doctor');
        }
      } else {
        console.log('Loaded existing profile:', existingProfile);
        setProfile(existingProfile);
        setEditedProfile(existingProfile);
        setIsDoctor(existingProfile?.role === 'doctor');
      }
    } catch (error) {
      console.error('Error in fetchProfile:', error);
      // Set a default profile on error
      const defaultProfile = {
        name: user?.name || 'User',
        phone: '',
        location: '',
        age: undefined,
        gender: '',
        medicalConditions: []
      };
      setProfile(defaultProfile);
      setEditedProfile(defaultProfile);
      setIsDoctor(false);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchAppointments = async () => {
    try {
      if (!user) return;

      const { data, error } = await getUserAppointments();
      if (error) throw error;

      setAppointments(data || []);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast.error('Failed to load appointments');
    }
  };

  const validateProfile = (profile: ProfileData): Record<string, string> => {
    const errors: Record<string, string> = {};

    if (!profile.name?.trim()) {
      errors.name = 'Name is required';
    }

    if (profile.phone && !/^[\+]?[1-9][\d]{0,15}$/.test(profile.phone.replace(/[\s\-\(\)]/g, ''))) {
      errors.phone = 'Please enter a valid phone number';
    }

    if (profile.age && (profile.age < 0 || profile.age > 150)) {
      errors.age = 'Please enter a valid age (0-150)';
    }

    return errors;
  };

  const handleUpdate = async () => {
    console.log('Starting profile update...');
    // Validate form
    const errors = validateProfile(editedProfile);
    console.log('Validation errors:', errors);
    setValidationErrors(errors);

    if (Object.keys(errors).length > 0) {
      toast.error('Please fix the validation errors');
      return;
    }

    setUpdating(true);
    try {
      const updates = {
        name: editedProfile.name?.trim(),
        phone: editedProfile.phone?.trim(),
        location: editedProfile.location?.trim(),
        age: editedProfile.age,
        gender: editedProfile.gender,
        medicalConditions: editedProfile.medicalConditions || []
      };

      console.log('Sending updates:', updates);
      const { data, error } = await updateUserProfile(updates);
      console.log('Update response:', { data, error });

      if (error) throw error;

      setProfile({ ...profile!, ...updates });
      setIsEditing(false);
      setValidationErrors({});
      setUpdateSuccess(true);

      // Hide success message after 3 seconds
      setTimeout(() => setUpdateSuccess(false), 3000);

      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const handleCancel = () => {
    setEditedProfile(profile || {});
    setValidationErrors({});
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleUpdate();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };


  if (!isAuthenticated || loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-2xl text-gray-600">Loading profile...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl text-gray-600 mb-4">Profile not found</div>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Profile Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg p-8"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">My Profile</h2>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="text-red-600 hover:text-red-700 flex items-center"
            >
              <Edit className="h-5 w-5 mr-1" />
              {isEditing ? 'Cancel' : 'Edit'}
            </button>
          </div>

          {updateSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-3"
            >
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-green-800 font-medium">Profile updated successfully!</span>
            </motion.div>
          )}

          {isEditing ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
              onKeyDown={handleKeyDown}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={editedProfile.name || ''}
                    onChange={(e) => setEditedProfile({...editedProfile, name: e.target.value})}
                    className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      validationErrors.name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter your full name"
                  />
                  {validationErrors.name && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {validationErrors.name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={editedProfile.phone || ''}
                    onChange={(e) => setEditedProfile({...editedProfile, phone: e.target.value})}
                    className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      validationErrors.phone ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="+1234567890"
                  />
                  {validationErrors.phone && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {validationErrors.phone}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    value={editedProfile.location || ''}
                    onChange={(e) => setEditedProfile({...editedProfile, location: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="City, Country"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Age
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="150"
                    value={editedProfile.age || ''}
                    onChange={(e) => setEditedProfile({...editedProfile, age: parseInt(e.target.value) || undefined})}
                    className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      validationErrors.age ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter your age"
                  />
                  {validationErrors.age && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {validationErrors.age}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gender
                  </label>
                  <select
                    value={editedProfile.gender || ''}
                    onChange={(e) => setEditedProfile({...editedProfile, gender: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer-not-to-say">Prefer not to say</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Medical Conditions
                </label>
                <textarea
                  value={editedProfile.medicalConditions?.join('\n') || ''}
                  onChange={(e) => setEditedProfile({...editedProfile, medicalConditions: e.target.value.split('\n').map(s => s.trim()).filter(s => s)})}
                  placeholder="Enter each medical condition on a new line (e.g. Diabetes, Hypertension)"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                />
                <p className="mt-1 text-sm text-gray-500">
                  Enter each condition on a separate line for better organization
                </p>
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  onClick={handleUpdate}
                  disabled={updating}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-6 rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transition-all"
                >
                  {updating ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-5 w-5" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleCancel}
                  disabled={updating}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-all"
                >
                  <X className="h-5 w-5" />
                  <span>Cancel</span>
                </button>
              </div>

              <div className="text-sm text-gray-500 text-center pt-2">
                <span>💡 Tip: Press </span>
                <kbd className="px-1.5 py-0.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-300 rounded">Ctrl</kbd>
                <span> + </span>
                <kbd className="px-1.5 py-0.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-300 rounded">Enter</kbd>
                <span> to save, </span>
                <kbd className="px-1.5 py-0.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-300 rounded">Esc</kbd>
                <span> to cancel</span>
              </div>
            </motion.div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center">
                <User className="h-6 w-6 mr-3 text-gray-500" />
                <span className="text-gray-900">{profile.name || 'Not set'}</span>
              </div>
              <div className="flex items-center">
                <Phone className="h-6 w-6 mr-3 text-gray-500" />
                <span className="text-gray-900">{profile.phone || 'Not set'}</span>
              </div>
              <div className="flex items-center">
                <MapPin className="h-6 w-6 mr-3 text-gray-500" />
                <span className="text-gray-900">{profile.location || 'Not set'}</span>
              </div>
              <div className="flex items-center">
                <Calendar className="h-6 w-6 mr-3 text-gray-500" />
                <span className="text-gray-900">{profile.age ? `${profile.age} years old` : 'Age not set'}</span>
              </div>
              <div className="flex items-center">
                <User className="h-6 w-6 mr-3 text-gray-500" />
                <span className="text-gray-900">{profile.gender || 'Gender not set'}</span>
              </div>
              <div className="flex items-start">
                <User className="h-6 w-6 mr-3 text-gray-500 mt-1" />
                <div className="flex-1">
                  <span className="text-gray-900 font-medium">Medical Conditions:</span>
                  <div className="text-gray-700 mt-1">
                    {profile.medicalConditions && profile.medicalConditions.length > 0 ? (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {profile.medicalConditions.map((condition, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {condition}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-500 italic">None specified</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Appointments Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-lg p-8"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6">My Appointments</h2>
          
          {appointments.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No appointments scheduled</p>
            </div>
          ) : (
            <div className="space-y-4">
              {appointments.map((appointment) => (
                <div
                  key={appointment._id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {isDoctor ? `${appointment.patientId?.name}` : `Dr. ${appointment.doctorId?.name}`}
                      </h3>
                      <p className="text-gray-600">{isDoctor ? appointment.patientId?.email : appointment.doctorId?.email}</p>
                      <div className="flex items-center mt-2 text-sm text-gray-500">
                        <Calendar className="h-4 w-4 mr-1" />
                        {format(new Date(appointment.date), 'PPP')}
                        <Clock className="h-4 w-4 ml-4 mr-1" />
                        {appointment.time}
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      appointment.status === 'completed' ? 'bg-green-100 text-green-800' :
                      appointment.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {appointment.status}
                    </span>
                  </div>

                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Profile;