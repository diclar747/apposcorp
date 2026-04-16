import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, UserRole } from '@/types';
import { authApi, usersApi } from '@/lib/api';

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  city: string;
  roles: UserRole[];
  initialInterface?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  interfaceMode?: string;
  activeRole: UserRole | null;
  isHydrated: boolean;

  setInterfaceMode: (mode: string) => void;
  setActiveRole: (role: UserRole) => void;

  // Actions
  login: (email: string, password: string) => Promise<boolean>;
  register: (data: RegisterData) => Promise<any | false>;
  logout: () => void;
  updateUser: (data: Partial<User>) => Promise<boolean>;
  updateBankData: (data: any) => Promise<boolean>;
  clearError: () => void;
  hasRole: (roles: UserRole[]) => boolean;
  addRole: (role: UserRole) => Promise<boolean>;
  fetchCurrentUser: () => Promise<void>;
  changePassword: (current: string, newPass: string) => Promise<boolean>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      token: localStorage.getItem('oscorp-token'),
      isLoading: false,
      error: null,
      interfaceMode: 'OSCORP',
      activeRole: null,
      isHydrated: false,

      setInterfaceMode: (mode: string) => set({ interfaceMode: mode }),
      setActiveRole: (role: UserRole) => set({ activeRole: role }),

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });

        try {
          const response = await authApi.login(email, password);

          // Save token
          localStorage.setItem('oscorp-token', response.token);

          // Determine initial active role
          const initialRole = response.user.roles.includes('superadmin') ? 'superadmin' :
            response.user.roles.includes('seller') ? 'seller' :
            response.user.roles.includes('ingenio') ? 'ingenio' : 'client';

          set({
            user: response.user,
            isAuthenticated: true,
            token: response.token,
            activeRole: initialRole,
            isLoading: false,
            error: null
          });
          return true;
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'Error al iniciar sesión'
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

          // Determine initial active role
          const initialRole = response.user.roles.includes('superadmin') ? 'superadmin' :
            response.user.roles.includes('seller') ? 'seller' :
            response.user.roles.includes('ingenio') ? 'ingenio' : 'client';

          set({
            user: response.user,
            isAuthenticated: true,
            token: response.token,
            activeRole: initialRole,
            isLoading: false,
            error: null
          });
          return response;
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'Error al registrar'
          });
          return false;
        }
      },

      logout: () => {
        localStorage.removeItem('oscorp-token');
        set({
          user: null,
          isAuthenticated: false,
          token: null,
          activeRole: null,
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
            error: error.message || 'Error al actualizar usuario'
          });
          return false;
        }
      },

      updateBankData: async (data: any) => {
        set({ isLoading: true, error: null });

        try {
          const bankData = await usersApi.updateBankData(data);

          const { user } = get();
          if (user) {
            set({ user: { ...user, bankData } });
          }

          set({
            isLoading: false,
            error: null
          });
          return true;
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'Error al actualizar datos bancarios'
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
            activeRole: get().activeRole || (user.roles.includes('superadmin') ? 'superadmin' :
              user.roles.includes('seller') ? 'seller' :
              user.roles.includes('ingenio') ? 'ingenio' : 'client'),
            error: null
          });
        } catch (error: any) {
          const errorMessage = error.message || '';
          localStorage.removeItem('oscorp-token');
          set({
            user: null,
            isAuthenticated: false,
            token: null,
            activeRole: null,
            error: errorMessage
          });
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
        }
      },

      clearError: () => {
        set({ error: null });
      },

      addRole: async (role: UserRole) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.addRole(role);
          if (response && response.user) {
            if (response.token) {
              localStorage.setItem('oscorp-token', response.token);
            }
            set({ 
              user: response.user, 
              token: response.token || get().token,
              isLoading: false, 
              error: null 
            });
            return true;
          }
          const { user } = get();
          if (user && !user.roles.includes(role)) {
            set({ user: { ...user, roles: [...user.roles, role] }, isLoading: false });
          } else {
             set({ isLoading: false });
          }
          return true;
        } catch (error: any) {
          set({ isLoading: false, error: error.message || 'Error al agregar rol' });
          return false;
        }
      },

      hasRole: (roles: UserRole[]) => {
        const { user } = get();
        return user?.roles ? user.roles.some((r: UserRole) => roles.includes(r)) : false;
      },

      changePassword: async (current: string, newPass: string) => {
        set({ isLoading: true, error: null });
        try {
          await authApi.changePassword(current, newPass);
          set({ isLoading: false });
          return true;
        } catch (error: any) {
          set({ isLoading: false, error: error.message || 'Error al cambiar contraseña' });
          return false;
        }
      },
    }),
    {
      name: 'oscorp-auth',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        interfaceMode: state.interfaceMode,
        activeRole: state.activeRole
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isHydrated = true;
        }
      },
    }
  )
);
