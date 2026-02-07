import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { useThemeStore } from '@/stores/themeStore';
import { registerServiceWorker } from '@/lib/pushNotifications';

// Theme initializer + splash screen hider
function AppInitializer() {
  useEffect(() => {
    const { resolvedTheme } = useThemeStore.getState();
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(resolvedTheme);

    // Hide splash screen after app mounts
    const splash = document.getElementById('splash');
    if (splash) {
      splash.classList.add('hide');
      setTimeout(() => splash.remove(), 500);
    }
  }, []);

  return null;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppInitializer />
    <App />
  </StrictMode>,
);

// Register service worker for PWA + push notifications
if ('serviceWorker' in navigator) {
  registerServiceWorker();
}
