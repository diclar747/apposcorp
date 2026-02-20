import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      resolvedTheme: 'dark',

      setTheme: (theme) => {
        const resolved = theme === 'system'
          ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
          : theme;

        set({ theme, resolvedTheme: resolved });

        // Apply to document
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(resolved);
      },

      toggleTheme: () => {
        const current = get().resolvedTheme;
        const newTheme = current === 'light' ? 'dark' : 'light';
        get().setTheme(newTheme);
      },
    }),
    {
      name: 'oscorp-theme',
      onRehydrateStorage: () => (state) => {
        if (state) {
          const resolved = state.theme === 'system'
            ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
            : state.theme;

          const root = window.document.documentElement;
          root.classList.remove('light', 'dark');
          root.classList.add(resolved);
          state.resolvedTheme = resolved;
        }
      },
    }
  )
);
