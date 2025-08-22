import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authService, LoginDto, User } from '@/services/auth.service';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Actions
  login: (credentials: LoginDto) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      
      login: async (credentials) => {
        set({ isLoading: true });
        try {
          const response = await authService.login(credentials);
          
          // Store token in localStorage for API interceptor
          localStorage.setItem('auth-token', response.access_token);
          localStorage.setItem('auth-user', JSON.stringify(response.user));
          
          set({
            user: response.user,
            token: response.access_token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },
      
      logout: () => {
        localStorage.removeItem('auth-token');
        localStorage.removeItem('auth-user');
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },
      
      checkAuth: async () => {
        const token = get().token;
        if (!token) {
          set({ isAuthenticated: false });
          return;
        }
        
        try {
          const user = await authService.getProfile();
          set({ user, isAuthenticated: true });
        } catch {
          get().logout();
        }
      },

      setUser: (user) => {
        set({ user });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);