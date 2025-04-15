import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from 'firebase/auth';

interface UserData {
  uid: string;
  name: string;
  email: string;
  profilePic: string;
}

interface AuthState {
  user: UserData | null;
  setUser: (user: UserData | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
    }),
    {
      name: 'auth-storage', // localStorage key
    }
  )
);
