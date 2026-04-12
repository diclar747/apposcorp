import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { useThemeStore } from '@/stores/themeStore';
import { registerServiceWorker } from '@/lib/pushNotifications';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Register service worker for PWA + push notifications
if ('serviceWorker' in navigator) {
  registerServiceWorker();
}
