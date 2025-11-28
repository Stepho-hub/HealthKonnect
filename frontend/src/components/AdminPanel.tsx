import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users, Calendar, MessageSquare, Settings, Search,
  UserPlus, Stethoscope, Shield, BarChart3, Eye,
  Edit, Trash2, CheckCircle, XCircle, AlertCircle, FileText
} from 'lucide-react';
import toast from 'react-hot-toast';
import DoctorRegistration from './DoctorRegistration';
import { getUserAppointments } from '../lib/mongodb';
import { useAuthStore } from '../lib/store';
import { useNavigate } from 'react-router-dom';

interface Doctor {
  _id: string;
  name: string;
  specialization: string;
  city?: string;
  hospital?: string;
  rating: number;
  reviewCount: number;
  consultationFee?: number;
  latitude?: number;
  longitude?: number;
  availableSlots?: string[];
  user: {
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
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
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();

  const [activeTab, setActiveTab] = useState('overview');
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [userSearchTerm, setUserSearchTerm] = useState('');

  // Doctor CRUD states
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);

  // User CRUD states
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserViewModal, setShowUserViewModal] = useState(false);
  const [showUserEditModal, setShowUserEditModal] = useState(false);
  const [showUserDeleteModal, setShowUserDeleteModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // System stats
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDoctors: 0,
    totalAppointments: 0,
    totalPrescriptions: 0,
    activeUsers: 0,
    systemHealth: 'operational'
  });

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (!isAuthenticated) {
      toast.error('Please log in to access admin panel');
      navigate('/login');
      return;
    }

    if (user?.role !== 'admin') {
      toast.error('Admin access required');
      navigate('/');
      return;
    }
  }, [isAuthenticated, user, navigate]);

  const fetchStats = async () => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
      const response = await fetch(`${API_BASE_URL}/admin/stats`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.data || stats);
      } else {
        console.error('Failed to fetch stats:', response.status);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'overview') {
      fetchStats();
    } else if (activeTab === 'doctors') {
      fetchDoctors();
    } else if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'appointments') {
      fetchAppointments();
    }
  }, [activeTab, isAuthenticated, user]);

  const fetchDoctors = async () => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
      const response = await fetch(`${API_BASE_URL}/admin/doctors`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
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
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
      const response = await fetch(`${API_BASE_URL}/admin/users`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.data || []);
      } else {
        console.error('Failed to fetch users:', response.status);
        toast.error('Failed to load users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const fetchAppointments = async () => {
    try {
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
    (doctor.city && doctor.city.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (doctor.hospital && doctor.hospital.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(userSearchTerm.toLowerCase())
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

  // User CRUD handlers
  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setShowUserViewModal(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setShowUserEditModal(true);
  };

  const handleDeleteUser = async (user: User) => {
    setSelectedUser(user);
    setShowUserDeleteModal(true);
  };

  const confirmDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

      const response = await fetch(`${API_BASE_URL}/admin/users/${selectedUser._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (response.ok) {
        toast.success('User deleted successfully');
        setUsers(users.filter(u => u._id !== selectedUser._id));
        setShowUserDeleteModal(false);
        setSelectedUser(null);
        // Refresh stats
        fetchStats();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error?.message || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;

    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

      const response = await fetch(`${API_BASE_URL}/admin/users/${editingUser._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          name: editingUser.name,
          email: editingUser.email,
          role: editingUser.role
        })
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setUsers(users.map(u => u._id === editingUser._id ? updatedUser.data : u));
        toast.success('User updated successfully');
        setShowUserEditModal(false);
        setEditingUser(null);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error?.message || 'Failed to update user');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Failed to update user');
    }
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
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

      const response = await fetch(`${API_BASE_URL}/admin/doctors/${selectedDoctor._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
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
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

      const response = await fetch(`${API_BASE_URL}/admin/doctors/${editingDoctor._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
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
              HealthKonnect Management System • Administrator Access Only
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
                  <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center">
                      <Shield className="h-6 w-6 text-blue-600 mr-3" />
                      <div>
                        <h3 className="text-lg font-semibold text-blue-900">Administrator Access</h3>
                        <p className="text-blue-700 text-sm">
                          Welcome, {user?.name}! You have full administrative privileges to manage the HealthKonnect platform.
                        </p>
                      </div>
                    </div>
                  </div>

                  <h2 className="text-2xl font-bold text-gray-900">System Overview</h2>

                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
                      <Users className="h-8 w-8 mb-2" />
                      <div className="text-2xl font-bold">{stats.totalUsers}</div>
                      <div className="text-blue-100">Total Users</div>
                    </div>
                    <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
                      <Stethoscope className="h-8 w-8 mb-2" />
                      <div className="text-2xl font-bold">{stats.totalDoctors}</div>
                      <div className="text-green-100">Doctors</div>
                    </div>
                    <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
                      <Calendar className="h-8 w-8 mb-2" />
                      <div className="text-2xl font-bold">{stats.totalAppointments}</div>
                      <div className="text-purple-100">Appointments</div>
                    </div>
                    <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-6 text-white">
                      <FileText className="h-8 w-8 mb-2" />
                      <div className="text-2xl font-bold">{stats.totalPrescriptions}</div>
                      <div className="text-orange-100">Prescriptions</div>
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
                              <div className="flex items-center justify-between mb-2">
                                <h3 className="text-lg font-semibold text-gray-900">{doctor.name}</h3>
                                <div className="flex items-center space-x-2 text-sm">
                                  <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
                                    {doctor.specialization}
                                  </span>
                                  {doctor.latitude && doctor.longitude && (
                                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                                      📍 Located
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 mb-3">
                                <div>
                                  <span className="font-medium">🏥</span> {doctor.hospital || 'Hospital not set'}
                                </div>
                                <div>
                                  <span className="font-medium">📍</span> {doctor.city || 'City not set'}
                                </div>
                              </div>

                              <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center space-x-4">
                                  <span className="flex items-center">
                                    <span className="text-yellow-500 mr-1">⭐</span>
                                    {doctor.rating.toFixed(1)} ({doctor.reviewCount} reviews)
                                  </span>
                                  <span className="text-green-600 font-medium">
                                    KSh {doctor.consultationFee?.toLocaleString() || 'Not set'}
                                  </span>
                                </div>
                                <div className="text-gray-500 text-xs">
                                  🕐 {doctor.availableSlots?.length || 0} slots
                                </div>
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
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
                    <div className="text-sm text-gray-600">
                      Total Users: {users.length}
                    </div>
                  </div>

                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search users by name, email, or role..."
                      value={userSearchTerm}
                      onChange={(e) => setUserSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                    />
                  </div>

                  {loading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
                      <p className="mt-2 text-gray-600">Loading users...</p>
                    </div>
                  ) : filteredUsers.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">
                        {userSearchTerm ? 'No users match your search' : 'No users registered yet'}
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        {userSearchTerm ? 'Try a different search term' : 'Users will appear here once they sign up'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredUsers.map((user) => (
                        <div key={user._id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <h3 className="text-lg font-semibold text-gray-900">{user.name}</h3>
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                  user.role === 'admin' ? 'bg-red-100 text-red-800' :
                                  user.role === 'doctor' ? 'bg-blue-100 text-blue-800' :
                                  'bg-green-100 text-green-800'
                                }`}>
                                  {user.role === 'admin' && '👑'}
                                  {user.role === 'doctor' && '👨‍⚕️'}
                                  {user.role === 'patient' && '👤'}
                                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                                </span>
                              </div>
                              <p className="text-gray-600 mb-2">📧 {user.email}</p>
                              <div className="flex items-center justify-between text-sm text-gray-500">
                                <span>Joined {new Date(user.createdAt).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })}</span>
                                <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                                  ID: {user._id.slice(-8)}
                                </span>
                              </div>
                            </div>
                            <div className="flex space-x-2 ml-4">
                              <button
                                onClick={() => handleViewUser(user)}
                                className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                                title="View User Details"
                              >
                                <Eye className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => handleEditUser(user)}
                                className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                                title="Edit User"
                              >
                                <Edit className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => handleDeleteUser(user)}
                                className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                                title="Delete User"
                              >
                                <Trash2 className="h-5 w-5" />
                              </button>
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
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Complete Doctor Profile</h3>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6">
              {/* Basic Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Basic Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Full Name</label>
                    <p className="text-gray-900 text-lg">{selectedDoctor.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email Address</label>
                    <p className="text-gray-900">{selectedDoctor.user.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Specialization</label>
                    <p className="text-gray-900 font-medium text-red-600">{selectedDoctor.specialization}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Registration Date</label>
                    <p className="text-gray-900">{new Date(selectedDoctor.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}</p>
                  </div>
                </div>
              </div>

              {/* Professional Information */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Professional Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Hospital/Clinic</label>
                    <p className="text-gray-900">{selectedDoctor.hospital || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">City</label>
                    <p className="text-gray-900">{selectedDoctor.city || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Consultation Fee</label>
                    <p className="text-gray-900 text-lg font-semibold text-green-600">
                      {selectedDoctor.consultationFee ? `KSh ${selectedDoctor.consultationFee.toLocaleString()}` : 'Not set'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Performance Rating</label>
                    <p className="text-gray-900">
                      <span className="text-lg font-semibold">{selectedDoctor.rating.toFixed(1)}</span>
                      <span className="text-yellow-500 ml-1">⭐</span>
                      <span className="text-sm text-gray-600 ml-2">({selectedDoctor.reviewCount} reviews)</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Location & Contact */}
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Location & Contact</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Geographic Coordinates</label>
                    <p className="text-gray-900 font-mono text-sm">
                      {selectedDoctor.latitude && selectedDoctor.longitude
                        ? `${selectedDoctor.latitude.toFixed(6)}, ${selectedDoctor.longitude.toFixed(6)}`
                        : 'Coordinates not set'
                      }
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Location Status</label>
                    <p className="text-gray-900">
                      {selectedDoctor.latitude && selectedDoctor.longitude
                        ? '📍 Geolocation enabled'
                        : '📍 Location coordinates needed'
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Available Time Slots */}
              <div className="bg-purple-50 p-4 rounded-lg">
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Available Time Slots</h4>
                {selectedDoctor.availableSlots && selectedDoctor.availableSlots.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {selectedDoctor.availableSlots.map((slot, index) => (
                      <div key={index} className="bg-white p-2 rounded border text-center text-sm font-medium text-gray-700">
                        🕐 {slot}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600 italic">No time slots configured</p>
                )}
              </div>

              {/* System Information */}
              <div className="bg-gray-100 p-4 rounded-lg">
                <h4 className="text-lg font-semibold text-gray-900 mb-3">System Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 uppercase">Database ID</label>
                    <p className="text-gray-900 font-mono text-xs">{selectedDoctor._id}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 uppercase">User ID</label>
                    <p className="text-gray-900 font-mono text-xs">{selectedDoctor.user ? 'Linked' : 'Not linked'}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 uppercase">Last Updated</label>
                    <p className="text-gray-900">{new Date(selectedDoctor.updatedAt).toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 uppercase">Account Status</label>
                    <p className="text-green-600 font-medium">Active</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
              <button
                onClick={() => setShowViewModal(false)}
                className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  handleEditDoctor(selectedDoctor);
                }}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Edit Doctor
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

      {/* View User Modal */}
      {showUserViewModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900">User Details</h3>
              <button
                onClick={() => setShowUserViewModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Basic Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Full Name</label>
                    <p className="text-gray-900 text-lg">{selectedUser.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email Address</label>
                    <p className="text-gray-900">{selectedUser.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Role</label>
                    <p className="text-gray-900 font-medium text-blue-600 capitalize">{selectedUser.role}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Registration Date</label>
                    <p className="text-gray-900">{new Date(selectedUser.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-100 p-4 rounded-lg">
                <h4 className="text-lg font-semibold text-gray-900 mb-3">System Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 uppercase">Database ID</label>
                    <p className="text-gray-900 font-mono text-xs">{selectedUser._id}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 uppercase">Account Status</label>
                    <p className="text-green-600 font-medium">Active</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
              <button
                onClick={() => setShowUserViewModal(false)}
                className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowUserViewModal(false);
                  handleEditUser(selectedUser);
                }}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Edit User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showUserEditModal && editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">Edit User</h3>
              <button
                onClick={() => setShowUserEditModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={editingUser.name}
                    onChange={(e) => setEditingUser({...editingUser, name: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={editingUser.email}
                    onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select
                    value={editingUser.role}
                    onChange={(e) => setEditingUser({...editingUser, role: e.target.value as 'patient' | 'doctor' | 'admin'})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="patient">Patient</option>
                    <option value="doctor">Doctor</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowUserEditModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateUser}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Update User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Modal */}
      {showUserDeleteModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">Delete User</h3>
              <button
                onClick={() => setShowUserDeleteModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="mb-6">
              <p className="text-gray-700">
                Are you sure you want to delete <strong>{selectedUser.name}</strong>?
              </p>
              <p className="text-sm text-gray-500 mt-2">
                This action cannot be undone. The user will be permanently removed from the system along with all associated data.
              </p>
              {selectedUser.role === 'admin' && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-700 font-medium">
                    ⚠️ Warning: Deleting an admin user may affect system administration capabilities.
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowUserDeleteModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteUser}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;