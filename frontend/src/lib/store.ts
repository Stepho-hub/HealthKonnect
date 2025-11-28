import { create } from 'zustand';
import { getUserProfile } from './mongodb';

interface AuthState {
  user: any | null;
  token: string | null;
  isAuthenticated: boolean;
  setUser: (user: any | null) => void;
  setToken: (token: string | null) => void;
  login: (user: any, token: string) => void;
  logout: () => void;
  initializeAuth: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  setToken: (token) => {
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
    set({ token });
  },

  login: (user, token) => {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('user_info', JSON.stringify(user));
    set({ user, token, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_info');
    set({ user: null, token: null, isAuthenticated: false });
  },

  initializeAuth: () => {
    const token = localStorage.getItem('auth_token');
    const userInfo = localStorage.getItem('user_info');

    if (token && userInfo) {
      try {
        const user = JSON.parse(userInfo);
        set({ user, token, isAuthenticated: true });
      } catch (error) {
        console.error('Error parsing user info:', error);
        get().logout();
      }
    }
  }
}));

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