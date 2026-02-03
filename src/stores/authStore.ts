import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, UserRole } from '@/types';
import { mockUsers, getUserByEmail } from '@/data/mockData';

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
  updateUser: (data: Partial<User>) => void;
  clearError: () => void;
  hasRole: (roles: UserRole[]) => boolean;
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
        
        // Simular delay de red
        await new Promise(resolve => setTimeout(resolve, 800));
        
        const user = getUserByEmail(email);
        
        if (!user) {
          set({ isLoading: false, error: 'Usuario no encontrado' });
          return false;
        }
        
        if (user.password !== password) {
          set({ isLoading: false, error: 'Contraseña incorrecta' });
          return false;
        }
        
        if (!user.isActive) {
          set({ isLoading: false, error: 'Cuenta desactivada' });
          return false;
        }
        
        set({ 
          user, 
          isAuthenticated: true, 
          isLoading: false,
          error: null 
        });
        return true;
      },

      register: async (data: RegisterData) => {
        set({ isLoading: true, error: null });
        
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Verificar si el email ya existe
        const existingUser = getUserByEmail(data.email);
        if (existingUser) {
          set({ isLoading: false, error: 'El email ya está registrado' });
          return false;
        }
        
        // Crear nuevo usuario (en producción iría a la API)
        const newUser: User = {
          id: `user-${Date.now()}`,
          email: data.email,
          password: data.password,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          address: data.address,
          city: data.city,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.email}`,
          role: data.role,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          walletId: `wallet-${Date.now()}`,
          cardQR: {
            id: `card-${Date.now()}`,
            userId: `user-${Date.now()}`,
            walletId: `wallet-${Date.now()}`,
            cardNumber: `OSC${String(mockUsers.length + 1).padStart(6, '0')}`,
            qrCode: '',
            qrData: JSON.stringify({ userId: `user-${Date.now()}`, cardNumber: `OSC${String(mockUsers.length + 1).padStart(6, '0')}` }),
            design: 'gradient-blue',
            isActive: true,
            createdAt: new Date(),
          },
          ingenioAccess: false,
        };
        
        // Agregar a mockUsers (en producción esto iría a la base de datos)
        mockUsers.push(newUser);
        
        set({ 
          user: newUser, 
          isAuthenticated: true, 
          isLoading: false,
          error: null 
        });
        return true;
      },

      logout: () => {
        set({ 
          user: null, 
          isAuthenticated: false, 
          error: null 
        });
      },

      updateUser: (data: Partial<User>) => {
        const { user } = get();
        if (user) {
          const updatedUser = { ...user, ...data, updatedAt: new Date() };
          set({ user: updatedUser });
          
          // Actualizar en mockUsers también
          const index = mockUsers.findIndex(u => u.id === user.id);
          if (index !== -1) {
            mockUsers[index] = updatedUser;
          }
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
