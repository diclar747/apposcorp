import { create } from 'zustand';
import { settingsApi } from '@/lib/api';

interface PublicSettings {
    site_name: string;
    site_description: string;
    contact_email: string;
    contact_phone: string;
    contact_address: string;
    maintenance_mode: string;
    [key: string]: string;
}

interface SettingsState {
    settings: PublicSettings;
    isLoading: boolean;
    error: string | null;
    fetchSettings: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
    settings: {
        site_name: 'Oscorp System',
        site_description: 'Sistema de Gestión Integrado',
        contact_email: 'soporte@oscorp.com',
        contact_phone: '+595 900 000 000',
        contact_address: 'Asunción, Paraguay',
        maintenance_mode: 'false',
    },
    isLoading: false,
    error: null,
    fetchSettings: async () => {
        try {
            set({ isLoading: true, error: null });
            const data: Record<string, string> = await settingsApi.getPublic();
            set((state) => ({ 
                settings: { ...state.settings, ...data } as PublicSettings, 
                isLoading: false 
            }));
        } catch (error) {
            console.error('Error fetching public settings:', error);
            set({ error: 'Error al cargar configuraciones', isLoading: false });
        }
    },
}));
