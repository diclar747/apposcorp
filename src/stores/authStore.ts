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
  login: (email: string, password: string, remember?: boolean) => Promise<boolean>;
  loginWithGoogle: (credential: string, remember?: boolean, role?: 'client' | 'seller' | 'ingenio') => Promise<boolean>;
  register: (data: RegisterData) => Promise<any | false>;
  logout: () => void;
  updateUser: (data: Partial<User>) => Promise<boolean>;
  updateBankData: (data: any) => Promise<boolean>;
  clearError: () => void;
  hasRole: (roles: UserRole[]) => boolean;
  addRole: (role: UserRole) => Promise<boolean>;
  fetchCurrentUser: () => Promise<void>;
  changePassword: (current: string, newPass: string) => Promise<boolean>;
  // "Gestionar tienda": el superadmin entra al panel de una tienda y después vuelve al suyo
  startManagingStore: (sellerUserId: string, storeName: string) => Promise<boolean>;
  stopManagingStore: () => Promise<void>;
}

// Mientras el superadmin gestiona una tienda, su propio token queda guardado aparte para volver
const ADMIN_TOKEN_KEY = 'oscorp-admin-token';
const MANAGED_STORE_KEY = 'oscorp-managed-store';

const clearManagedStore = () => {
  for (const storage of [localStorage, sessionStorage]) {
    storage.removeItem(ADMIN_TOKEN_KEY);
    storage.removeItem(MANAGED_STORE_KEY);
  }
};

const tokenStorage = () => (localStorage.getItem('oscorp-token') ? localStorage : sessionStorage);

/** Nombre de la tienda que el superadmin está gestionando, o null si no está en ese modo. */
export const getManagedStore = (): string | null => {
  const storage = tokenStorage();
  return storage.getItem(ADMIN_TOKEN_KEY) ? storage.getItem(MANAGED_STORE_KEY) || 'la tienda' : null;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: !!(localStorage.getItem('oscorp-token') || sessionStorage.getItem('oscorp-token')),
      token: localStorage.getItem('oscorp-token') || sessionStorage.getItem('oscorp-token'),
      isLoading: false,
      error: null,
      interfaceMode: 'OSCORP',
      activeRole: null,
      isHydrated: false,

      setInterfaceMode: (mode: string) => set({ interfaceMode: mode }),
      setActiveRole: (role: UserRole) => set({ activeRole: role }),

      login: async (email: string, password: string, remember: boolean = false) => {
        set({ isLoading: true, error: null });

        try {
          const response = await authApi.login(email, password);
          clearManagedStore();

          // Save token based on remember preference
          if (remember) {
            localStorage.setItem('oscorp-token', response.token);
            sessionStorage.removeItem('oscorp-token');
          } else {
            sessionStorage.setItem('oscorp-token', response.token);
            localStorage.removeItem('oscorp-token');
          }

          // Determine initial active role
          const initialRole = response.user.roles.includes('superadmin') ? 'superadmin' :
            response.user.roles.includes('seller') ? 'seller' :
            response.user.roles.includes('client') ? 'client' :
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

      loginWithGoogle: async (credential: string, remember: boolean = true, role?: 'client' | 'seller' | 'ingenio') => {
        set({ isLoading: true, error: null });

        try {
          const response = await authApi.loginWithGoogle(credential, role);
          clearManagedStore();

          if (remember) {
            localStorage.setItem('oscorp-token', response.token);
            sessionStorage.removeItem('oscorp-token');
          } else {
            sessionStorage.setItem('oscorp-token', response.token);
            localStorage.removeItem('oscorp-token');
          }

          const initialRole = response.user.roles.includes('superadmin') ? 'superadmin' :
            response.user.roles.includes('seller') ? 'seller' :
            response.user.roles.includes('client') ? 'client' :
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
            error: error.message || 'Error al iniciar sesión con Google'
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
            response.user.roles.includes('client') ? 'client' :
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
        sessionStorage.removeItem('oscorp-token');
        clearManagedStore();
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
        const token = localStorage.getItem('oscorp-token') || sessionStorage.getItem('oscorp-token');
        if (!token) return;

        try {
          const user = await authApi.getMe();
          set({
            user,
            isAuthenticated: true,
            activeRole: get().activeRole || (user.roles.includes('superadmin') ? 'superadmin' :
              user.roles.includes('seller') ? 'seller' :
              user.roles.includes('client') ? 'client' :
              user.roles.includes('ingenio') ? 'ingenio' : 'client'),
            error: null
          });
        } catch (error: any) {
          const errorMessage = error.message || '';
          
          // Only clear session if it's explicitly an auth error
          if (errorMessage.includes('401') || errorMessage.includes('403') || errorMessage.includes('inválido') || errorMessage.includes('expirado')) {
            localStorage.removeItem('oscorp-token');
            sessionStorage.removeItem('oscorp-token');
            set({
              user: null,
              isAuthenticated: false,
              token: null,
              activeRole: null,
              isHydrated: true
            });
          } else {
            // For other errors (network, etc), we keep the current session
            set({ isHydrated: true });
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

      startManagingStore: async (sellerUserId: string, storeName: string) => {
        set({ isLoading: true, error: null });
        try {
          const storage = tokenStorage();
          const adminToken = storage.getItem('oscorp-token');
          if (!adminToken) throw new Error('Sesión no encontrada');
          const response = await authApi.impersonate(sellerUserId);

          storage.setItem(ADMIN_TOKEN_KEY, adminToken);
          storage.setItem(MANAGED_STORE_KEY, storeName);
          storage.setItem('oscorp-token', response.token);
          set({ user: response.user, token: response.token, activeRole: 'seller', isLoading: false });
          // Recarga completa: así ningún dato del admin queda en memoria dentro del panel de la tienda
          window.location.href = '/vendedor';
          return true;
        } catch (error: any) {
          set({ isLoading: false, error: error.message || 'No se pudo abrir la tienda' });
          return false;
        }
      },

      stopManagingStore: async () => {
        const storage = tokenStorage();
        const adminToken = storage.getItem(ADMIN_TOKEN_KEY);
        storage.removeItem(ADMIN_TOKEN_KEY);
        storage.removeItem(MANAGED_STORE_KEY);
        if (!adminToken) {
          get().logout();
          window.location.href = '/login';
          return;
        }
        storage.setItem('oscorp-token', adminToken);
        set({ token: adminToken, user: null, activeRole: 'superadmin' });
        await get().fetchCurrentUser();
        window.location.href = '/admin/tiendas';
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
          // Validate token presence after rehydration
          const token = localStorage.getItem('oscorp-token') || sessionStorage.getItem('oscorp-token');
          if (!token) {
            state.isAuthenticated = false;
            state.user = null;
            state.token = null;
            state.activeRole = null;
          } else {
            state.token = token;
          }
        }
      },
    }
  )
);
