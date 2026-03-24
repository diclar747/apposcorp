import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const INSTALL_DISMISSED_KEY = 'oscorp-install-dismissed';

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed as PWA
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Check if user dismissed recently (don't show for 3 days)
    const dismissed = localStorage.getItem(INSTALL_DISMISSED_KEY);
    if (dismissed) {
      const dismissedAt = parseInt(dismissed, 10);
      if (Date.now() - dismissedAt < 3 * 24 * 60 * 60 * 1000) {
        return;
      }
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show banner after a short delay
      setTimeout(() => setShowBanner(true), 2000);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Listen for successful install
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowBanner(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem(INSTALL_DISMISSED_KEY, Date.now().toString());
  };

  if (isInstalled || !showBanner) return null;

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed top-20 left-4 right-4 z-50 sm:top-6 sm:left-auto sm:right-6 sm:max-w-sm"
        >
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl shadow-black/20 border border-slate-200 dark:border-slate-700 p-4 flex items-start gap-4">
            <img
              src="/icons/icon-192x192.png"
              alt="Oscorp"
              className="w-12 h-12 rounded-full shrink-0 object-cover"
            />

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-bold text-slate-900 dark:text-white text-sm">
                    Instalar Oscorp
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Agrega la app a tu pantalla de inicio para acceso rapido
                  </p>
                </div>
                <button
                  onClick={handleDismiss}
                  className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs h-8"
                  onClick={handleDismiss}
                >
                  Ahora no
                </Button>
                <Button
                  size="sm"
                  className="text-xs h-8 bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={handleInstall}
                >
                  <Download className="w-3.5 h-3.5 mr-1.5" />
                  Instalar
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
