import { create } from 'zustand';
import { getUserProfile } from './mongodb';

interface UserState {
  profile: any | null;
  setProfile: (profile: any | null) => void;
  loadProfile: () => Promise<void>;
}

export const useUserStore = create<UserState>((set) => ({
  profile: null,
  setProfile: (profile) => set({ profile }),
  loadProfile: async () => {
    try {
      // Load user profile from MongoDB using Clerk user ID
      const { data: profileData, error } = await getUserProfile();
      if (profileData && !error) {
        set({ profile: profileData });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  }
}));

interface AppointmentState {
  selectedDoctor: any | null;
  selectedDate: Date | null;
  selectedTime: string | null;
  duration: number;
  setSelectedDoctor: (doctor: any | null) => void;
  setSelectedDate: (date: Date | null) => void;
  setSelectedTime: (time: string | null) => void;
  setDuration: (duration: number) => void;
  resetAppointment: () => void;
}

export const useAppointmentStore = create<AppointmentState>((set) => ({
  selectedDoctor: null,
  selectedDate: null,
  selectedTime: null,
  duration: 30,
  setSelectedDoctor: (doctor) => set({ selectedDoctor: doctor }),
  setSelectedDate: (date) => set({ selectedDate: date }),
  setSelectedTime: (time) => set({ selectedTime: time }),
  setDuration: (duration) => set({ duration }),
  resetAppointment: () => set({
    selectedDoctor: null,
    selectedDate: null,
    selectedTime: null,
    duration: 30
  })
}));