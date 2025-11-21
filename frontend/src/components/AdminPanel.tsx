import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users, Calendar, MessageSquare, Settings, Search,
  UserPlus, Stethoscope, Shield, BarChart3, Eye,
  Edit, Trash2, CheckCircle, XCircle, AlertCircle
} from 'lucide-react';
// import { useAuth } from '@clerk/clerk-react';
import toast from 'react-hot-toast';
import DoctorRegistration from './DoctorRegistration';
import { getUserAppointments, setClerkToken } from '../lib/mongodb';

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
  createdAt: string;
}

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

interface Appointment {
  _id: string;
  patient: { name: string; email: string };
  doctor: { name: string; email: string };
  date: string;
  time: string;
  status: string;
  createdAt: string;
}

const AdminPanel: React.FC = () => {
  // Mock auth for demo purposes
  const getToken = async () => 'demo-token';
  const isSignedIn = true;

  const [activeTab, setActiveTab] = useState('overview');
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Doctor CRUD states
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);

  useEffect(() => {
    if (activeTab === 'doctors') {
      fetchDoctors();
    } else if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'appointments') {
      fetchAppointments();
    }
  }, [activeTab]);

  const fetchDoctors = async () => {
    try {
      if (!isSignedIn) return;

      const token = await getToken();
      setClerkToken(token);

      // For admin panel, we'll use a direct fetch to the admin endpoint
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
      const response = await fetch(`${API_BASE_URL}/admin/doctors`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setDoctors(data.data || []);
      } else {
        console.error('Failed to fetch doctors:', response.status);
        toast.error('Failed to load doctors');
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
      toast.error('Failed to load doctors');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    // This would need a backend endpoint for user management
    // For now, we'll show a placeholder
    setUsers([]);
    setLoading(false);
  };

  const fetchAppointments = async () => {
    try {
      if (!isSignedIn) return;

      const token = await getToken();
      setClerkToken(token);

      const { data, error } = await getUserAppointments();
      if (error) {
        console.error('Error fetching appointments:', error);
        toast.error('Failed to load appointments');
      } else {
        setAppointments(data || []);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const filteredDoctors = doctors.filter(doctor =>
    doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doctor.specialization.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doctor.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'completed': return 'text-blue-600 bg-blue-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Doctor CRUD handlers
  const handleViewDoctor = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setShowViewModal(true);
  };

  const handleEditDoctor = (doctor: Doctor) => {
    setEditingDoctor(doctor);
    setShowEditModal(true);
  };

  const handleDeleteDoctor = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setShowDeleteModal(true);
  };

  const confirmDeleteDoctor = async () => {
    if (!selectedDoctor) return;

    try {
      const token = await getToken();
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

      const response = await fetch(`${API_BASE_URL}/admin/doctors/${selectedDoctor._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        toast.success('Doctor deleted successfully');
        setDoctors(doctors.filter(d => d._id !== selectedDoctor._id));
        setShowDeleteModal(false);
        setSelectedDoctor(null);
      } else {
        toast.error('Failed to delete doctor');
      }
    } catch (error) {
      console.error('Error deleting doctor:', error);
      toast.error('Failed to delete doctor');
    }
  };

  const handleUpdateDoctor = async () => {
    if (!editingDoctor) return;

    try {
      const token = await getToken();
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

      const response = await fetch(`${API_BASE_URL}/admin/doctors/${editingDoctor._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: editingDoctor.name,
          specialization: editingDoctor.specialization,
          city: editingDoctor.city,
          hospital: editingDoctor.hospital,
          consultationFee: editingDoctor.consultationFee
        })
      });

      if (response.ok) {
        const updatedDoctor = await response.json();
        setDoctors(doctors.map(d => d._id === editingDoctor._id ? updatedDoctor.data : d));
        toast.success('Doctor updated successfully');
        setShowEditModal(false);
        setEditingDoctor(null);
      } else {
        toast.error('Failed to update doctor');
      }
    } catch (error) {
      console.error('Error updating doctor:', error);
      toast.error('Failed to update doctor');
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'doctors', label: 'Doctors', icon: Stethoscope },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'appointments', label: 'Appointments', icon: Calendar },
    { id: 'add-doctor', label: 'Add Doctor', icon: UserPlus }
  ];

  if (activeTab === 'add-doctor') {
    return <DoctorRegistration />;
  }

  return (
    <div className="min-h-screen bg-gray-100 pt-16">
      <div className="bg-white shadow fixed top-16 left-0 right-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-red-600 mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">Admin Panel</h1>
            </div>
            <div className="text-sm text-gray-600">
              HealthKonnect Management System
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-64">
            <div className="bg-white rounded-lg shadow p-6">
              <nav className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                        activeTab === tab.id
                          ? 'bg-red-100 text-red-700'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <Icon className="mr-3 h-5 w-5" />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="bg-white rounded-lg shadow p-6">
              {activeTab === 'overview' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-6"
                >
                  <h2 className="text-2xl font-bold text-gray-900">System Overview</h2>

                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
                      <Users className="h-8 w-8 mb-2" />
                      <div className="text-2xl font-bold">{users.length}</div>
                      <div className="text-blue-100">Total Users</div>
                    </div>
                    <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
                      <Stethoscope className="h-8 w-8 mb-2" />
                      <div className="text-2xl font-bold">{doctors.length}</div>
                      <div className="text-green-100">Doctors</div>
                    </div>
                    <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
                      <Calendar className="h-8 w-8 mb-2" />
                      <div className="text-2xl font-bold">{appointments.length}</div>
                      <div className="text-purple-100">Appointments</div>
                    </div>
                    <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-6 text-white">
                      <MessageSquare className="h-8 w-8 mb-2" />
                      <div className="text-2xl font-bold">0</div>
                      <div className="text-orange-100">Messages</div>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
                    <div className="space-y-3">
                      <div className="flex items-center text-sm text-gray-600">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        System initialized successfully
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        Database connection established
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <AlertCircle className="h-4 w-4 text-yellow-500 mr-2" />
                        Awaiting user registrations
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'doctors' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-900">Doctor Management</h2>
                    <button
                      onClick={() => setActiveTab('add-doctor')}
                      className="bg-gradient-to-r from-red-600 via-pink-500 to-orange-500 hover:opacity-90 text-white px-4 py-2 rounded-md font-medium transition-opacity flex items-center"
                    >
                      <UserPlus className="mr-2 h-5 w-5" />
                      Add Doctor
                    </button>
                  </div>

                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search doctors..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                    />
                  </div>

                  {/* Doctors List */}
                  <div className="space-y-4">
                    {loading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
                        <p className="mt-2 text-gray-600">Loading doctors...</p>
                      </div>
                    ) : filteredDoctors.length === 0 ? (
                      <div className="text-center py-8">
                        <Stethoscope className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">No doctors found</p>
                        <button
                          onClick={() => setActiveTab('add-doctor')}
                          className="mt-4 text-red-600 hover:text-red-500 font-medium"
                        >
                          Add your first doctor
                        </button>
                      </div>
                    ) : (
                      filteredDoctors.map((doctor) => (
                        <div key={doctor._id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-gray-900">{doctor.name}</h3>
                              <p className="text-red-600 font-medium">{doctor.specialization}</p>
                              <p className="text-gray-600">{doctor.hospital} • {doctor.city}</p>
                              <div className="flex items-center mt-2 text-sm text-gray-500">
                                <span className="mr-4">Rating: {doctor.rating.toFixed(1)} ⭐</span>
                                <span className="mr-4">Reviews: {doctor.reviewCount}</span>
                                <span>Fee: KSh{doctor.consultationFee}</span>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleViewDoctor(doctor)}
                                className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                                title="View Doctor Details"
                              >
                                <Eye className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => handleEditDoctor(doctor)}
                                className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                                title="Edit Doctor"
                              >
                                <Edit className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => handleDeleteDoctor(doctor)}
                                className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                                title="Delete Doctor"
                              >
                                <Trash2 className="h-5 w-5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === 'users' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-6"
                >
                  <h2 className="text-2xl font-bold text-gray-900">User Management</h2>

                  {loading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
                      <p className="mt-2 text-gray-600">Loading users...</p>
                    </div>
                  ) : users.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No users registered yet</p>
                      <p className="text-sm text-gray-500 mt-2">Users will appear here once they sign up</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {users.map((user) => (
                        <div key={user._id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-medium text-gray-900">{user.name}</h3>
                              <p className="text-gray-600">{user.email}</p>
                              <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                                user.role === 'admin' ? 'bg-red-100 text-red-800' :
                                user.role === 'doctor' ? 'bg-blue-100 text-blue-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {user.role}
                              </span>
                            </div>
                            <div className="text-sm text-gray-500">
                              Joined {new Date(user.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'appointments' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-6"
                >
                  <h2 className="text-2xl font-bold text-gray-900">Appointment Management</h2>

                  {loading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
                      <p className="mt-2 text-gray-600">Loading appointments...</p>
                    </div>
                  ) : appointments.length === 0 ? (
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No appointments scheduled</p>
                      <p className="text-sm text-gray-500 mt-2">Appointments will appear here once booked</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {appointments.map((appointment) => (
                        <div key={appointment._id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-4">
                                <div>
                                  <h3 className="font-medium text-gray-900">{appointment.patient?.name || 'Unknown Patient'}</h3>
                                  <p className="text-sm text-gray-600">Patient</p>
                                </div>
                                <div className="text-center">
                                  <div className="text-sm text-gray-500">with</div>
                                </div>
                                <div>
                                  <h3 className="font-medium text-gray-900">{appointment.doctor?.name || 'Unassigned Doctor'}</h3>
                                  <p className="text-sm text-gray-600">Doctor</p>
                                </div>
                              </div>
                              <div className="mt-2 flex items-center space-x-4 text-sm text-gray-600">
                                <span>{new Date(appointment.date).toLocaleDateString()}</span>
                                <span>{appointment.time}</span>
                                <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(appointment.status)}`}>
                                  {appointment.status}
                                </span>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <button className="p-2 text-gray-400 hover:text-blue-600 transition-colors">
                                <Eye className="h-5 w-5" />
                              </button>
                              <button className="p-2 text-gray-400 hover:text-green-600 transition-colors">
                                <Edit className="h-5 w-5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* View Doctor Modal */}
      {showViewModal && selectedDoctor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">Doctor Details</h3>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <p className="text-gray-900">{selectedDoctor.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <p className="text-gray-900">{selectedDoctor.user.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Specialization</label>
                  <p className="text-gray-900">{selectedDoctor.specialization}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">City</label>
                  <p className="text-gray-900">{selectedDoctor.city}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Hospital</label>
                  <p className="text-gray-900">{selectedDoctor.hospital}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Consultation Fee</label>
                  <p className="text-gray-900">KSh{selectedDoctor.consultationFee}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Rating</label>
                  <p className="text-gray-900">{selectedDoctor.rating.toFixed(1)} ⭐ ({selectedDoctor.reviewCount} reviews)</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Joined</label>
                  <p className="text-gray-900">{new Date(selectedDoctor.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowViewModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Doctor Modal */}
      {showEditModal && editingDoctor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">Edit Doctor</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={editingDoctor.name}
                    onChange={(e) => setEditingDoctor({...editingDoctor, name: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Specialization</label>
                  <input
                    type="text"
                    value={editingDoctor.specialization}
                    onChange={(e) => setEditingDoctor({...editingDoctor, specialization: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input
                    type="text"
                    value={editingDoctor.city}
                    onChange={(e) => setEditingDoctor({...editingDoctor, city: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hospital</label>
                  <input
                    type="text"
                    value={editingDoctor.hospital}
                    onChange={(e) => setEditingDoctor({...editingDoctor, hospital: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Consultation Fee (KSh)</label>
                  <input
                    type="number"
                    value={editingDoctor.consultationFee}
                    onChange={(e) => setEditingDoctor({...editingDoctor, consultationFee: parseFloat(e.target.value) || 0})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateDoctor}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Update Doctor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Doctor Modal */}
      {showDeleteModal && selectedDoctor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">Delete Doctor</h3>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="mb-6">
              <p className="text-gray-700">
                Are you sure you want to delete <strong>{selectedDoctor.name}</strong>?
              </p>
              <p className="text-sm text-gray-500 mt-2">
                This action cannot be undone. The doctor will be permanently removed from the system.
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteDoctor}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Delete Doctor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;