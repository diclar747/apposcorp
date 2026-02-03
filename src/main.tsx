import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { useThemeStore } from '@/stores/themeStore';

// Theme initializer component
function ThemeInitializer() {
  useEffect(() => {
    const { resolvedTheme } = useThemeStore.getState();
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(resolvedTheme);
  }, []);

  return null;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeInitializer />
    <App />
  </StrictMode>,
);
