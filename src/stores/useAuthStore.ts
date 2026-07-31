import { create } from 'zustand';
import { User } from '@/types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, accessToken: string) => void;
  setToken: (accessToken: string) => void;
  loadAuthFromStorage: () => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,

  setAuth: (user: User, accessToken: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('user', JSON.stringify(user));
    }
    set({ user, accessToken, isAuthenticated: true });
  },

  setToken: (accessToken: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', accessToken);
    }
    set({ accessToken });
  },

  loadAuthFromStorage: () => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      const userStr = localStorage.getItem('user');
      if (token && userStr) {
        try {
          const user = JSON.parse(userStr);
          set({ user, accessToken: token, isAuthenticated: true });
        } catch (e) {
          console.error("Failed to parse user from localStorage", e);
        }
      }
    }
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
    set({ user: null, accessToken: null, isAuthenticated: false });
  },
}));
