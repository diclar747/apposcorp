import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { isPushSupported, getPermissionStatus, subscribeToPush } from '@/lib/pushNotifications';

const PROMPT_KEY = 'oscorp-push-prompted';

export function PushPermissionPrompt() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      const alreadyPrompted = localStorage.getItem(PROMPT_KEY);
      const permission = getPermissionStatus();

      if (isPushSupported() && !alreadyPrompted && permission === 'default') {
        setIsOpen(true);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const handleAllow = async () => {
    localStorage.setItem(PROMPT_KEY, 'true');
    setIsOpen(false);
    await subscribeToPush();
  };

  const handleDismiss = () => {
    localStorage.setItem(PROMPT_KEY, 'true');
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
              <Bell className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <DialogTitle>Oscorp desea enviarte notificaciones</DialogTitle>
              <DialogDescription className="mt-1">
                Recibe alertas de transferencias, creditos y ofertas directamente en tu dispositivo.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="flex gap-3 mt-4">
          <Button variant="outline" className="flex-1" onClick={handleDismiss}>
            Ahora no
          </Button>
          <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white" onClick={handleAllow}>
            Permitir
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
