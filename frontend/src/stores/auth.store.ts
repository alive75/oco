import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authService } from '@/services/auth.service';
import { User, LoginDto } from '@/types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (credentials: LoginDto) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: async (credentials) => {
        const response = await authService.login(credentials);
        set({ 
          user: response.user, 
          token: response.access_token,
          isAuthenticated: true 
        });
      },
      logout: () => set({ user: null, token: null, isAuthenticated: false })
    }),
    { 
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token })
    }
  )
);