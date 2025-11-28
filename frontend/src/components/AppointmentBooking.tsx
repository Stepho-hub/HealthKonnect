import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, addDays, isToday, isTomorrow } from 'date-fns';
import { Calendar, Clock, Users, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAppointmentStore, useAuthStore } from '../lib/store';
import { getDoctors, createAppointment, getDoctorAppointmentsForDate } from '../lib/mongodb';
import toast from 'react-hot-toast';

interface Doctor {
  _id: string;
  name: string;
  specialization: string;
  city: string;
  hospital: string;
  rating: number;
  reviewCount: number;
  consultationFee: number;
  latitude: number;
  longitude: number;
}

interface Appointment {
  date: string;
  time: string;
}

const AppointmentBooking: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const {
    selectedDoctor, setSelectedDoctor,
    selectedDate, setSelectedDate,
    selectedTime, setSelectedTime,
    duration, setDuration,
    resetAppointment
  } = useAppointmentStore();
  
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const { data, error } = await getDoctors();
        if (error) throw error;
        setDoctors(data || []);
      } catch (error) {
        console.error('Error fetching doctors:', error);
        toast.error('Failed to load doctors. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchDoctors();
  }, []);

  useEffect(() => {
    const fetchAvailableTimes = async () => {
      if (!selectedDoctor || !selectedDate) return;

      const {data: appointments, error} = await getDoctorAppointmentsForDate(selectedDoctor._id, selectedDate);
      if (error) {
        console.error('Failed to fetch appointments: ', error)
      }
      // Generate available time slots
      const takenSlots: {start: Date, end: Date}[] = (appointments as Appointment[])?.map((appt: Appointment) => {
        const [hours, minutes] = appt.time.split(':').map(Number);
        const start = new Date(appt.date);
        start.setHours(hours, minutes, 0, 0);
        const end = new Date(start);
        end.setMinutes(end.getMinutes() + 30); // Assuming 30 min duration
        return {start, end};
      }) || [];

      const startHour = 9;
      const endHour = 17;
      const slotDuration = 30;
      const slots: string[] = [];

      for (let hour = startHour; hour < endHour; hour++) {
        for (let minute = 0; minute < 60; minute += slotDuration) {
          const slot = new Date(selectedDate);
          slot.setHours(hour, minute, 0, 0);
          const slotEnd = new Date(slot);
          slotEnd.setMinutes(slotEnd.getMinutes() + slotDuration);
          console.log("start, end: ", takenSlots);
          const isTaken = takenSlots.some(({ start, end }) =>
            (slot >= start && slot < end) || (slotEnd > start && slotEnd < end)
          );
          console.log(slot, slotEnd, isTaken);
          if (!isTaken) {
            slots.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
          }
          // console.log(slots)
        }
      }

      setAvailableTimes(slots);
    };
    fetchAvailableTimes();
  }, [selectedDate, selectedDoctor]);

  const handleDoctorSelect = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setStep(2);
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedTime(null);
    setStep(3);
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setStep(4);
  };

  const handleDurationChange = (newDuration: number) => {
    setDuration(newDuration);
  };

  const handleBookAppointment = async () => {
    if (!user || !isAuthenticated) {
      toast.error('Please log in to book an appointment');
      navigate('/login');
      return;
    }

    if (!selectedDoctor || !selectedDate || !selectedTime) {
      toast.error('Please complete all appointment details');
      return;
    }

    try {
      const appointmentDate = new Date(selectedDate);
      const [hours, minutes] = selectedTime.split(':').map(Number);
      appointmentDate.setHours(hours, minutes);

      const appointmentData = {
        doctor: selectedDoctor._id,
        date: appointmentDate.toISOString(),
        time: selectedTime,
        symptoms: '',
        notes: `Consultation duration: ${duration} minutes`
      };

      // Cast to any to bypass type checking since we're using a different API structure
      const { error } = await createAppointment(appointmentData as any);

      if (error) throw error;

      toast.success('Appointment booked successfully!');
      resetAppointment();
      navigate('/appointments');

      // Log confirmation
      console.log(`Appointment booked for ${user?.name || 'User'} with ${selectedDoctor.name}`);

    } catch (error) {
      console.error('Error booking appointment:', error);
      toast.error('Failed to book appointment. Please try again.');
    }
  };

  const getDateLabel = (date: Date) => {
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'EEE, MMM d');
  };

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl md:text-4xl font-bold text-gray-900"
          >
            Book Your <span className="bg-gradient-to-r from-secondary-600 via-secondary-500 to-accent-500 text-transparent bg-clip-text">Doctor</span> Appointment
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-4 max-w-2xl mx-auto text-xl text-gray-600"
          >
            Schedule appointments with expert doctors
          </motion.p>
        </div>

        {/* Booking Steps */}
        <div className="mb-10">
          <div className="flex justify-between items-center max-w-3xl mx-auto">
            {[1, 2, 3, 4].map((stepNumber) => (
              <React.Fragment key={stepNumber}>
                <div className="flex flex-col items-center">
                  <div 
                    className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-medium ${
                      step >= stepNumber
                        ? 'bg-gradient-to-r from-secondary-500 to-secondary-600'
                        : 'bg-primary-300'
                    }`}
                  >
                    {stepNumber}
                  </div>
                  <div className="text-sm mt-2 text-gray-600">
                    {stepNumber === 1 && 'Select Doctor'}
                    {stepNumber === 2 && 'Choose Date'}
                    {stepNumber === 3 && 'Select Time'}
                    {stepNumber === 4 && 'Confirm'}
                  </div>
                </div>
                {stepNumber < 4 && (
                  <div className={`flex-1 h-1 mx-2 ${
                    step > stepNumber ? 'bg-gradient-to-r from-secondary-500 to-secondary-600' : 'bg-primary-300'
                  }`}></div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Step 1: Doctor Selection */}
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h3 className="text-xl font-semibold text-gray-800 mb-6">Select a Doctor</h3>
            
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-red-500 border-r-transparent"></div>
                <span className="ml-2 text-gray-600">Loading doctors...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {doctors.map((doctor) => (
                  <motion.div
                     key={doctor._id}
                     whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
                     className={`bg-white rounded-xl shadow-md overflow-hidden border ${
                       selectedDoctor?._id === doctor._id
                         ? 'border-red-500'
                         : 'border-gray-200'
                     }`}
                    onClick={() => handleDoctorSelect(doctor)}
                  >
                    <div className="p-6">
                      <div className="flex items-start">
                        <div className="flex-shrink-0 mr-4">
                          <div className="h-16 w-16 rounded-full bg-gradient-to-r from-red-600 via-pink-500 to-orange-500 flex items-center justify-center">
                            <Users className="h-8 w-8 text-white" />
                          </div>
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900">{doctor.name}</h4>
                          <p className="text-gray-600">{doctor.specialization}</p>
                          <div className="mt-1 flex items-center">
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <svg 
                                  key={i} 
                                  className={`h-4 w-4 ${i < doctor.rating ? 'text-yellow-400' : 'text-gray-300'}`} 
                                  fill="currentColor" 
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                              ))}
                            </div>
                            <span className="ml-1 text-sm text-gray-500">{doctor.rating.toFixed(1)}</span>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">{doctor.city}</p>
                        </div>
                      </div>
                      <div className="mt-4 flex justify-between items-center">
                        <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                          Available
                        </span>
                        <button 
                          className="text-red-600 hover:text-red-800 text-sm font-medium flex items-center"
                          onClick={() => handleDoctorSelect(doctor)}
                        >
                          Select <ArrowRight className="h-4 w-4 ml-1" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Step 2: Date Selection */}
        {step === 2 && selectedDoctor && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center mb-6">
              <button 
                onClick={() => setStep(1)}
                className="mr-4 text-gray-600 hover:text-gray-900"
              >
                ← Back
              </button>
              <h3 className="text-xl font-semibold text-gray-800">Select a Date</h3>
            </div>
            
            <div className="bg-white rounded-xl shadow-md p-6 max-w-3xl mx-auto">
              <div className="flex items-center mb-6">
                <div className="flex-shrink-0 mr-4">
                  <div className="h-16 w-16 rounded-full bg-gradient-to-r from-red-600 via-pink-500 to-orange-500 flex items-center justify-center">
                    <Users className="h-8 w-8 text-white" />
                  </div>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">{selectedDoctor.name}</h4>
                  <p className="text-gray-600">{selectedDoctor.specialty}</p>
                </div>
              </div>
              
              <div className="mt-6">
                <div className="flex items-center mb-4">
                  <Calendar className="h-5 w-5 text-red-500 mr-2" />
                  <h4 className="text-lg font-medium text-gray-800">Available Dates</h4>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {[...Array(10)].map((_, i) => {
                    const date = addDays(new Date(), i);
                    return (
                      <motion.button
                        key={i}
                        whileHover={{ y: -2 }}
                        onClick={() => handleDateSelect(date)}
                        className={`p-3 rounded-lg border text-center ${
                          selectedDate && format(selectedDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
                            ? 'bg-gradient-to-r from-red-600 via-pink-500 to-orange-500 text-white border-transparent'
                            : 'border-gray-200 hover:border-red-500 text-gray-700'
                        }`}
                      >
                        <div className="font-medium">{getDateLabel(date)}</div>
                        <div className="text-xs mt-1">{format(date, 'MMM d')}</div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 3: Time Selection */}
        {step === 3 && selectedDoctor && selectedDate && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center mb-6">
              <button 
                onClick={() => setStep(2)}
                className="mr-4 text-gray-600 hover:text-gray-900"
              >
                ← Back
              </button>
              <h3 className="text-xl font-semibold text-gray-800">Select a Time</h3>
            </div>
            
            <div className="bg-white rounded-xl shadow-md p-6 max-w-3xl mx-auto">
              <div className="flex items-center mb-6">
                <div className="flex-shrink-0 mr-4">
                  <div className="h-16 w-16 rounded-full bg-gradient-to-r from-red-600 via-pink-500 to-orange-500 flex items-center justify-center">
                    <Users className="h-8 w-8 text-white" />
                  </div>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">{selectedDoctor.name}</h4>
                  <p className="text-gray-600">{selectedDoctor.specialty}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    <span className="font-medium">{format(selectedDate, 'EEEE, MMMM d, yyyy')}</span>
                  </p>
                </div>
              </div>
              
              <div className="mt-6">
                <div className="flex items-center mb-4">
                  <Clock className="h-5 w-5 text-red-500 mr-2" />
                  <h4 className="text-lg font-medium text-gray-800">Available Time Slots</h4>
                </div>
                
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {availableTimes.map((time) => (
                    <motion.button
                      key={time}
                      whileHover={{ y: -2 }}
                      onClick={() => handleTimeSelect(time)}
                      className={`p-3 rounded-lg border text-center ${
                        selectedTime === time
                          ? 'bg-gradient-to-r from-secondary-500 to-secondary-600 text-white border-transparent'
                          : 'border-primary-300 hover:border-secondary-500 text-gray-700 bg-primary-50'
                      }`}
                    >
                      {time}
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 4: Confirmation */}
        {step === 4 && selectedDoctor && selectedDate && selectedTime && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center mb-6">
              <button 
                onClick={() => setStep(3)}
                className="mr-4 text-gray-600 hover:text-gray-900"
              >
                ← Back
              </button>
              <h3 className="text-xl font-semibold text-gray-800">Confirm Your Appointment</h3>
            </div>
            
            <div className="bg-white rounded-xl shadow-md p-6 max-w-3xl mx-auto">
              <div className="border-b border-gray-200 pb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Appointment Details</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="flex items-start">
                      <div className="flex-shrink-0 mr-4">
                        <div className="h-16 w-16 rounded-full bg-gradient-to-r from-red-600 via-pink-500 to-orange-500 flex items-center justify-center">
                          <Users className="h-8 w-8 text-white" />
                        </div>
                      </div>
                      <div>
                        <h5 className="font-medium text-gray-900">{selectedDoctor.name}</h5>
                        <p className="text-gray-600">{selectedDoctor.specialty}</p>
                        <div className="mt-1 flex items-center">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <svg 
                                key={i} 
                                className={`h-4 w-4 ${i < selectedDoctor.rating ? 'text-yellow-400' : 'text-gray-300'}`} 
                                fill="currentColor" 
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                          <span className="ml-1 text-sm text-gray-500">{selectedDoctor.rating.toFixed(1)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <Calendar className="h-5 w-5 text-red-500 mr-2" />
                        <div>
                          <p className="text-sm text-gray-600">Date</p>
                          <p className="font-medium text-gray-900">{format(selectedDate, 'EEEE, MMMM d, yyyy')}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        <Clock className="h-5 w-5 text-red-500 mr-2" />
                        <div>
                          <p className="text-sm text-gray-600">Time</p>
                          <p className="font-medium text-gray-900">{selectedTime}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Consultation Duration</h4>
                
                <div className="flex space-x-4 mb-6">
                  {[15, 30, 45, 60].map((mins) => (
                    <button
                      key={mins}
                      onClick={() => handleDurationChange(mins)}
                      className={`px-4 py-2 rounded-lg border ${
                        duration === mins
                          ? 'bg-gradient-to-r from-secondary-500 to-secondary-600 text-white border-transparent'
                          : 'border-primary-300 hover:border-secondary-500 text-gray-700 bg-primary-50'
                      }`}
                    >
                      {mins} min
                    </button>
                  ))}
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                  <h5 className="font-medium text-gray-900 mb-2">What to expect</h5>
                  <p className="text-gray-600 text-sm">
                    You'll receive a confirmation email with your appointment details.
                    Please arrive 10 minutes before your scheduled time. Bring any relevant
                    medical records or test results to your appointment.
                  </p>
                </div>
                
                <div className="flex justify-end">
                  <button
                    onClick={handleBookAppointment}
                    className="px-6 py-3 bg-gradient-to-r from-secondary-500 to-secondary-600 text-white font-medium rounded-lg hover:opacity-90 transition-opacity flex items-center"
                  >
                    Book Appointment <ArrowRight className="ml-2 h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default AppointmentBooking;