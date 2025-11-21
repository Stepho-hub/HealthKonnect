import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, Plus, Calendar, User as UserIcon, Stethoscope } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getUserPrescriptions, createPrescription, downloadPrescriptionPDF, setClerkToken } from '../lib/mongodb';
import { Prescription, Appointment, User } from '../types';
import toast from 'react-hot-toast';

const Prescriptions: React.FC = () => {
  const navigate = useNavigate();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<string>('');
  const [medications, setMedications] = useState([{
    name: '',
    dosage: '',
    frequency: '',
    duration: ''
  }]);
  const [notes, setNotes] = useState('');

  // Check authentication - in real app this would come from auth context
  const isLoggedIn = localStorage.getItem('demo_session') !== null || localStorage.getItem('auth_token') !== null;

  const user = isLoggedIn ? {
    id: 'demo-user-123',
    fullName: 'Demo User',
    firstName: 'Demo',
    lastName: 'User',
    role: 'patient' // Change to 'doctor' to test doctor functionality
  } : null;

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoggedIn) {
      toast.error('Please log in to access prescriptions');
      navigate('/login');
      return;
    }
  }, [isLoggedIn, navigate]);

  useEffect(() => {
    if (user) {
      fetchPrescriptions();
      if (user.role === 'doctor') {
        fetchAppointments();
      }
    }
  }, [user]);

  const fetchPrescriptions = async () => {
    try {
      setClerkToken('demo-token');
      const { data, error } = await getUserPrescriptions();
      if (error) throw error;
      setPrescriptions(data || []);
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
      toast.error('Failed to load prescriptions');
    } finally {
      setLoading(false);
    }
  };

  const fetchAppointments = async () => {
    // Mock appointments for doctor - in real app this would come from API
    const mockUser: User = {
      _id: 'mock-user',
      clerkId: 'mock-clerk',
      name: 'Mock User',
      email: 'mock@example.com',
      role: 'patient',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setAppointments([
      {
        _id: 'mock-appointment-1',
        doctor: { ...mockUser, name: 'Dr. Demo' },
        patient: { ...mockUser, name: 'Demo Patient' },
        date: new Date().toISOString(),
        time: '10:00',
        status: 'confirmed',
        symptoms: 'Headache and fever',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]);
  };

  const handleDownloadPDF = async (prescriptionId: string) => {
    try {
      // In a real implementation, this would trigger a download
      window.open(`http://localhost:5001/api/prescriptions/${prescriptionId}/pdf`, '_blank');
      toast.success('Prescription PDF opened');
    } catch (error) {
      toast.error('Failed to download prescription');
    }
  };

  const handleCreatePrescription = async () => {
    if (!selectedAppointment || medications.some(med => !med.name || !med.dosage)) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setClerkToken('demo-token');
      const prescriptionData = {
        appointmentId: selectedAppointment,
        medications: medications.filter(med => med.name.trim()),
        notes
      };

      const { data, error } = await createPrescription(prescriptionData);
      if (error) throw error;

      toast.success('Prescription created successfully');
      setShowCreateForm(false);
      setSelectedAppointment('');
      setMedications([{
        name: '',
        dosage: '',
        frequency: '',
        duration: ''
      }]);
      setNotes('');
      fetchPrescriptions(); // Refresh the list
    } catch (error) {
      console.error('Error creating prescription:', error);
      toast.error('Failed to create prescription');
    }
  };

  const addMedication = () => {
    setMedications([...medications, {
      name: '',
      dosage: '',
      frequency: '',
      duration: ''
    }]);
  };

  const updateMedication = (index: number, field: string, value: string) => {
    const updated = [...medications];
    updated[index] = { ...updated[index], [field]: value };
    setMedications(updated);
  };

  const removeMedication = (index: number) => {
    if (medications.length > 1) {
      setMedications(medications.filter((_, i) => i !== index));
    }
  };

  // Don't render anything if not logged in (redirect is happening)
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <section className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Prescriptions</h1>
            <p className="text-gray-600 mt-2">
              {user?.role === 'doctor' ? 'Manage patient prescriptions' : 'View your prescriptions'}
            </p>
          </div>
          {user?.role === 'doctor' && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Create Prescription</span>
            </button>
          )}
        </div>

        {/* Create Prescription Form */}
        {showCreateForm && user?.role === 'doctor' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-md p-6 mb-8"
          >
            <h2 className="text-xl font-semibold mb-4">Create New Prescription</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Appointment
                </label>
                <select
                  value={selectedAppointment}
                  onChange={(e) => setSelectedAppointment(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Choose an appointment...</option>
                  {appointments.map(appointment => (
                    <option key={appointment._id} value={appointment._id}>
                      {appointment.patient.name} - {new Date(appointment.date).toLocaleDateString()}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Medications
                </label>
                {medications.map((med, index) => (
                  <div key={index} className="flex space-x-2 mb-2">
                    <input
                      type="text"
                      placeholder="Medication name"
                      value={med.name}
                      onChange={(e) => updateMedication(index, 'name', e.target.value)}
                      className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      placeholder="Dosage"
                      value={med.dosage}
                      onChange={(e) => updateMedication(index, 'dosage', e.target.value)}
                      className="w-24 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      placeholder="Frequency"
                      value={med.frequency}
                      onChange={(e) => updateMedication(index, 'frequency', e.target.value)}
                      className="w-24 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      placeholder="Duration"
                      value={med.duration}
                      onChange={(e) => updateMedication(index, 'duration', e.target.value)}
                      className="w-24 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {medications.length > 1 && (
                      <button
                        onClick={() => removeMedication(index)}
                        className="text-red-600 hover:text-red-800 px-2"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={addMedication}
                  className="text-blue-600 hover:text-blue-800 text-sm mt-2"
                >
                  + Add another medication
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Additional instructions or notes..."
                />
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={handleCreatePrescription}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
                >
                  Create Prescription
                </button>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Prescriptions List */}
        <div className="space-y-6">
          {prescriptions.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">No prescriptions yet</h3>
              <p className="text-gray-600">
                {user?.role === 'doctor'
                  ? 'Create prescriptions for your patients after appointments'
                  : 'Your prescriptions will appear here after doctor visits'
                }
              </p>
            </div>
          ) : (
            prescriptions.map((prescription) => (
              <motion.div
                key={prescription._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg shadow-md p-6"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Prescription #{prescription._id.slice(-8)}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {new Date(prescription.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDownloadPDF(prescription._id)}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download PDF</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center space-x-2">
                    <Stethoscope className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-600">Doctor</p>
                      <p className="font-medium">Dr. {prescription.doctor.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <UserIcon className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-sm text-gray-600">Patient</p>
                      <p className="font-medium">{prescription.patient.name}</p>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">Medications:</h4>
                  <div className="space-y-2">
                    {prescription.meds.map((med, index) => (
                      <div key={index} className="bg-gray-50 rounded p-3">
                        <div className="flex justify-between">
                          <span className="font-medium">{med.name}</span>
                          <span className="text-sm text-gray-600">
                            {med.dosage} - {med.frequency} - {med.duration}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {prescription.notes && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Notes:</h4>
                    <p className="text-gray-700 bg-gray-50 rounded p-3">{prescription.notes}</p>
                  </div>
                )}
              </motion.div>
            ))
          )}
        </div>
      </div>
    </section>
  );
};

export default Prescriptions;