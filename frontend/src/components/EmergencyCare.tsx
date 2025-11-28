import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle, Phone, MapPin, Clock, User,
  Ambulance, Heart, Shield, Bell, BellOff,
  Plus, Edit, Trash2, CheckCircle, XCircle
} from 'lucide-react';
import { useAuthStore } from '../lib/store';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

interface EmergencyContact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  email?: string;
  isPrimary: boolean;
}

interface EmergencyAlert {
  id: string;
  type: 'medical' | 'accident' | 'fire' | 'security' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  location?: string;
  timestamp: string;
  status: 'active' | 'resolved' | 'false_alarm';
}

const EmergencyCare: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();

  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);
  const [emergencyAlerts, setEmergencyAlerts] = useState<EmergencyAlert[]>([]);
  const [showAddContact, setShowAddContact] = useState(false);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [emergencyType, setEmergencyType] = useState<EmergencyAlert['type']>('medical');
  const [emergencyMessage, setEmergencyMessage] = useState('');
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      toast.error('Please log in to access emergency care');
      navigate('/login');
      return;
    }
    loadEmergencyData();
    getCurrentLocation();
  }, [isAuthenticated, navigate]);

  const loadEmergencyData = () => {
    // Load from localStorage for demo (in production, this would be from API)
    const savedContacts = localStorage.getItem(`emergency_contacts_${user?.id}`);
    const savedAlerts = localStorage.getItem(`emergency_alerts_${user?.id}`);

    if (savedContacts) {
      setEmergencyContacts(JSON.parse(savedContacts));
    } else {
      // Add sample emergency contacts
      const sampleContacts: EmergencyContact[] = [
        {
          id: '1',
          name: 'John Doe',
          relationship: 'Spouse',
          phone: '+1234567890',
          email: 'john.doe@email.com',
          isPrimary: true
        },
        {
          id: '2',
          name: 'Jane Smith',
          relationship: 'Sister',
          phone: '+1234567891',
          email: 'jane.smith@email.com',
          isPrimary: false
        }
      ];
      setEmergencyContacts(sampleContacts);
      localStorage.setItem(`emergency_contacts_${user?.id}`, JSON.stringify(sampleContacts));
    }

    if (savedAlerts) {
      setEmergencyAlerts(JSON.parse(savedAlerts));
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  };

  const addEmergencyContact = (contact: Omit<EmergencyContact, 'id'>) => {
    const newContact: EmergencyContact = {
      ...contact,
      id: Date.now().toString()
    };

    const updatedContacts = [...emergencyContacts, newContact];
    setEmergencyContacts(updatedContacts);
    localStorage.setItem(`emergency_contacts_${user?.id}`, JSON.stringify(updatedContacts));
    setShowAddContact(false);
    toast.success('Emergency contact added');
  };

  const removeEmergencyContact = (id: string) => {
    const updatedContacts = emergencyContacts.filter(c => c.id !== id);
    setEmergencyContacts(updatedContacts);
    localStorage.setItem(`emergency_contacts_${user?.id}`, JSON.stringify(updatedContacts));
    toast.success('Emergency contact removed');
  };

  const triggerEmergency = async () => {
    if (!emergencyMessage.trim()) {
      toast.error('Please describe the emergency');
      return;
    }

    const emergencyAlert: EmergencyAlert = {
      id: Date.now().toString(),
      type: emergencyType,
      severity: 'critical',
      message: emergencyMessage,
      location: userLocation ? `${userLocation.lat}, ${userLocation.lng}` : undefined,
      timestamp: new Date().toISOString(),
      status: 'active'
    };

    // Add to alerts
    const updatedAlerts = [emergencyAlert, ...emergencyAlerts];
    setEmergencyAlerts(updatedAlerts);
    localStorage.setItem(`emergency_alerts_${user?.id}`, JSON.stringify(updatedAlerts));

    // Send emergency notifications to contacts
    await sendEmergencyNotifications(emergencyAlert);

    setShowEmergencyModal(false);
    setEmergencyMessage('');
    toast.success('Emergency alert sent! Help is on the way.');
  };

  const sendEmergencyNotifications = async (alert: EmergencyAlert) => {
    // In production, this would send SMS/email notifications
    console.log('Sending emergency notifications to contacts:', emergencyContacts);

    // Simulate sending notifications
    for (const contact of emergencyContacts) {
      console.log(`Sending emergency alert to ${contact.name} (${contact.phone}):`, alert);
    }

    // Also notify emergency services
    console.log('Notifying emergency services:', alert);
  };

  const callEmergency = (number: string) => {
    window.open(`tel:${number}`);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'medical': return <Heart className="w-5 h-5 text-red-500" />;
      case 'accident': return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case 'fire': return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'security': return <Shield className="w-5 h-5 text-blue-500" />;
      default: return <AlertTriangle className="w-5 h-5 text-gray-500" />;
    }
  };

  const activeAlerts = emergencyAlerts.filter(alert => alert.status === 'active');

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-red-100 rounded-full">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Emergency Care</h1>
          <p className="text-lg text-gray-600">
            Emergency contacts, alerts, and immediate assistance
          </p>
        </motion.div>

        {/* Emergency Alert Banner */}
        {activeAlerts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-600 text-white p-4 rounded-xl mb-8 flex items-center justify-between"
          >
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-6 h-6" />
              <div>
                <h3 className="font-semibold">Active Emergency Alert</h3>
                <p className="text-sm opacity-90">
                  {activeAlerts.length} active emergency alert{activeAlerts.length > 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <button
              onClick={() => setEmergencyAlerts(prev => prev.map(alert =>
                alert.status === 'active' ? { ...alert, status: 'resolved' } : alert
              ))}
              className="px-4 py-2 bg-white text-red-600 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Resolve All
            </button>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Emergency Actions */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* Quick Emergency Actions */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Ambulance className="w-5 h-5 mr-2 text-red-500" />
                Emergency Actions
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => setShowEmergencyModal(true)}
                  className="p-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex flex-col items-center"
                >
                  <AlertTriangle className="w-8 h-8 mb-2" />
                  <span className="font-semibold">Send Alert</span>
                  <span className="text-sm opacity-90">Emergency notification</span>
                </button>

                <button
                  onClick={() => callEmergency('911')}
                  className="p-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex flex-col items-center"
                >
                  <Phone className="w-8 h-8 mb-2" />
                  <span className="font-semibold">Call 911</span>
                  <span className="text-sm opacity-90">Emergency services</span>
                </button>

                <button
                  onClick={() => navigate('/symptom-checker')}
                  className="p-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex flex-col items-center"
                >
                  <Heart className="w-8 h-8 mb-2" />
                  <span className="font-semibold">AI Checker</span>
                  <span className="text-sm opacity-90">Symptom analysis</span>
                </button>

                <button
                  onClick={() => navigate('/video-consultation')}
                  className="p-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex flex-col items-center"
                >
                  <Phone className="w-8 h-8 mb-2" />
                  <span className="font-semibold">Video Call</span>
                  <span className="text-sm opacity-90">Doctor consultation</span>
                </button>
              </div>
            </div>

            {/* Emergency Contacts */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold flex items-center">
                  <User className="w-5 h-5 mr-2 text-blue-500" />
                  Emergency Contacts
                </h2>
                <button
                  onClick={() => setShowAddContact(true)}
                  className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center text-sm"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add
                </button>
              </div>

              <div className="space-y-3">
                {emergencyContacts.map((contact) => (
                  <div key={contact.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold text-gray-900">{contact.name}</h3>
                        {contact.isPrimary && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                            Primary
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{contact.relationship}</p>
                      <p className="text-sm text-gray-600">{contact.phone}</p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => callEmergency(contact.phone)}
                        className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                        title="Call contact"
                      >
                        <Phone className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => removeEmergencyContact(contact.id)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                        title="Remove contact"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {emergencyContacts.length === 0 && (
                  <div className="text-center py-8">
                    <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">No emergency contacts added</p>
                    <button
                      onClick={() => setShowAddContact(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Add Emergency Contact
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Emergency History & Settings */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* Emergency Alerts History */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Bell className="w-5 h-5 mr-2 text-orange-500" />
                Emergency History
              </h2>

              <div className="space-y-3">
                {emergencyAlerts.length === 0 ? (
                  <div className="text-center py-8">
                    <BellOff className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">No emergency alerts</p>
                  </div>
                ) : (
                  emergencyAlerts.slice(0, 5).map((alert) => (
                    <div key={alert.id} className="p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          {getTypeIcon(alert.type)}
                          <span className="font-medium text-gray-900 capitalize">
                            {alert.type} Emergency
                          </span>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getSeverityColor(alert.severity)}`}>
                          {alert.severity}
                        </span>
                      </div>

                      <p className="text-sm text-gray-700 mb-2">{alert.message}</p>

                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{new Date(alert.timestamp).toLocaleString()}</span>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          alert.status === 'active' ? 'bg-red-100 text-red-800' :
                          alert.status === 'resolved' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {alert.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Emergency Settings */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Shield className="w-5 h-5 mr-2 text-blue-500" />
                Emergency Settings
              </h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">Emergency Notifications</h3>
                    <p className="text-sm text-gray-600">Receive alerts for emergency situations</p>
                  </div>
                  <button
                    onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      notificationsEnabled ? 'bg-green-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        notificationsEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">Location Sharing</h3>
                    <p className="text-sm text-gray-600">Share location during emergencies</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {userLocation ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                    <span className="text-sm text-gray-600">
                      {userLocation ? 'Enabled' : 'Location access needed'}
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={getCurrentLocation}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Update Location
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Add Emergency Contact Modal */}
        {showAddContact && (
          <EmergencyContactModal
            onClose={() => setShowAddContact(false)}
            onAdd={addEmergencyContact}
          />
        )}

        {/* Emergency Alert Modal */}
        {showEmergencyModal && (
          <EmergencyAlertModal
            onClose={() => setShowEmergencyModal(false)}
            onSend={triggerEmergency}
            emergencyType={emergencyType}
            setEmergencyType={setEmergencyType}
            message={emergencyMessage}
            setMessage={setEmergencyMessage}
          />
        )}
      </div>
    </div>
  );
};

// Emergency Contact Modal Component
const EmergencyContactModal: React.FC<{
  onClose: () => void;
  onAdd: (contact: Omit<EmergencyContact, 'id'>) => void;
}> = ({ onClose, onAdd }) => {
  const [formData, setFormData] = useState({
    name: '',
    relationship: '',
    phone: '',
    email: '',
    isPrimary: false
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      toast.error('Name and phone number are required');
      return;
    }
    onAdd(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl p-6 w-full max-w-md"
      >
        <h3 className="text-xl font-semibold mb-4">Add Emergency Contact</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Relationship
            </label>
            <input
              type="text"
              value={formData.relationship}
              onChange={(e) => setFormData(prev => ({ ...prev, relationship: e.target.value }))}
              placeholder="e.g., Spouse, Parent, Friend"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number *
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email (Optional)
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isPrimary"
              checked={formData.isPrimary}
              onChange={(e) => setFormData(prev => ({ ...prev, isPrimary: e.target.checked }))}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="isPrimary" className="ml-2 text-sm text-gray-700">
              Set as primary emergency contact
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Contact
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

// Emergency Alert Modal Component
const EmergencyAlertModal: React.FC<{
  onClose: () => void;
  onSend: () => void;
  emergencyType: EmergencyAlert['type'];
  setEmergencyType: (type: EmergencyAlert['type']) => void;
  message: string;
  setMessage: (message: string) => void;
}> = ({ onClose, onSend, emergencyType, setEmergencyType, message, setMessage }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl p-6 w-full max-w-md"
      >
        <div className="flex items-center space-x-3 mb-4">
          <AlertTriangle className="w-6 h-6 text-red-500" />
          <h3 className="text-xl font-semibold text-red-600">Emergency Alert</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Emergency Type
            </label>
            <select
              value={emergencyType}
              onChange={(e) => setEmergencyType(e.target.value as EmergencyAlert['type'])}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="medical">Medical Emergency</option>
              <option value="accident">Accident</option>
              <option value="fire">Fire</option>
              <option value="security">Security Threat</option>
              <option value="other">Other Emergency</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Describe the Emergency
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Provide details about the emergency situation..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              required
            />
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-800">
              <strong>Warning:</strong> This will send emergency notifications to your emergency contacts and may alert emergency services. Only use in genuine emergency situations.
            </p>
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSend}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Send Emergency Alert
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default EmergencyCare;