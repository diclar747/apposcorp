import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, UserRole } from '@/types';
import { authApi } from '@/lib/api';

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  city: string;
  role: UserRole;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (email: string, password: string) => Promise<boolean>;
  register: (data: RegisterData) => Promise<boolean>;
  logout: () => void;
  updateUser: (data: Partial<User>) => Promise<boolean>;
  clearError: () => void;
  hasRole: (roles: UserRole[]) => boolean;
  fetchCurrentUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await authApi.login(email, password);
          
          // Save token
          localStorage.setItem('oscorp-token', response.token);
          
          set({ 
            user: response.user, 
            isAuthenticated: true, 
            isLoading: false,
            error: null 
          });
          return true;
        } catch (error: any) {
          set({ 
            isLoading: false, 
            error: error.message || 'Erro ao fazer login' 
          });
          return false;
        }
      },

      register: async (data: RegisterData) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await authApi.register(data);
          
          // Save token
          localStorage.setItem('oscorp-token', response.token);
          
          set({ 
            user: response.user, 
            isAuthenticated: true, 
            isLoading: false,
            error: null 
          });
          return true;
        } catch (error: any) {
          set({ 
            isLoading: false, 
            error: error.message || 'Erro ao registrar' 
          });
          return false;
        }
      },

      logout: () => {
        localStorage.removeItem('oscorp-token');
        set({ 
          user: null, 
          isAuthenticated: false, 
          error: null 
        });
      },

      updateUser: async (data: Partial<User>) => {
        set({ isLoading: true, error: null });
        
        try {
          const user = await authApi.updateMe(data);
          
          set({ 
            user, 
            isLoading: false,
            error: null 
          });
          return true;
        } catch (error: any) {
          set({ 
            isLoading: false, 
            error: error.message || 'Erro ao atualizar usuário' 
          });
          return false;
        }
      },

      fetchCurrentUser: async () => {
        const token = localStorage.getItem('oscorp-token');
        if (!token) return;
        
        try {
          const user = await authApi.getMe();
          set({ 
            user, 
            isAuthenticated: true,
            error: null 
          });
        } catch (error) {
          // Token inválido, fazer logout
          localStorage.removeItem('oscorp-token');
          set({ 
            user: null, 
            isAuthenticated: false 
          });
        }
      },

      clearError: () => {
        set({ error: null });
      },

      hasRole: (roles: UserRole[]) => {
        const { user } = get();
        return user ? roles.includes(user.role) : false;
      },
    }),
    {
      name: 'oscorp-auth',
      partialize: (state) => ({ 
        user: state.user, 
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);
