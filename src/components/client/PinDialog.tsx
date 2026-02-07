import { useState, useEffect } from 'react';
import { Shield, Lock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface PinDialogProps {
  open: boolean;
  onClose: () => void;
  mode: 'setup' | 'verify';
  onPinSubmit: (pin: string) => Promise<boolean>;
  title?: string;
  description?: string;
}

export function PinDialog({ open, onClose, mode, onPinSubmit, title, description }: PinDialogProps) {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<'enter' | 'confirm'>('enter');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (open) {
      setPin('');
      setConfirmPin('');
      setStep('enter');
      setError('');
      setLoading(false);
    }
  }, [open]);

  const handleComplete = async (value: string) => {
    if (mode === 'verify') {
      setLoading(true);
      setError('');
      const result = await onPinSubmit(value);
      setLoading(false);
      if (!result) {
        setError('PIN incorrecto. Intenta de nuevo.');
        setPin('');
      }
    } else if (mode === 'setup') {
      if (step === 'enter') {
        setConfirmPin(value);
        setStep('confirm');
        setPin('');
        setError('');
      } else {
        // Confirm step
        if (value !== confirmPin) {
          setError('Los PINs no coinciden. Intenta de nuevo.');
          setPin('');
          setStep('enter');
          setConfirmPin('');
        } else {
          setLoading(true);
          setError('');
          const result = await onPinSubmit(value);
          setLoading(false);
          if (!result) {
            setError('Error al configurar PIN');
            setPin('');
            setStep('enter');
            setConfirmPin('');
          }
        }
      }
    }
  };

  const getTitle = () => {
    if (title) return title;
    if (mode === 'setup') {
      return step === 'enter' ? 'Crear PIN de Transacción' : 'Confirmar PIN';
    }
    return 'Ingresa tu PIN';
  };

  const getDescription = () => {
    if (description && mode === 'verify') return description;
    if (mode === 'setup') {
      return step === 'enter'
        ? 'Crea un PIN de 4 dígitos para proteger tus pagos'
        : 'Ingresa el mismo PIN para confirmar';
    }
    return 'Ingresa tu PIN de 4 dígitos para confirmar';
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader className="text-center items-center">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-2">
            {mode === 'setup' ? (
              <Shield className="w-8 h-8 text-blue-600" />
            ) : (
              <Lock className="w-8 h-8 text-blue-600" />
            )}
          </div>
          <DialogTitle className="text-center">{getTitle()}</DialogTitle>
          <DialogDescription className="text-center">{getDescription()}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center space-y-4 py-4">
          <InputOTP
            maxLength={4}
            value={pin}
            onChange={(val) => {
              setPin(val);
              setError('');
            }}
            onComplete={handleComplete}
            disabled={loading}
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} className="w-14 h-14 text-2xl font-bold" />
              <InputOTPSlot index={1} className="w-14 h-14 text-2xl font-bold" />
              <InputOTPSlot index={2} className="w-14 h-14 text-2xl font-bold" />
              <InputOTPSlot index={3} className="w-14 h-14 text-2xl font-bold" />
            </InputOTPGroup>
          </InputOTP>

          {error && (
            <div className="flex items-center gap-2 text-destructive text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          {loading && (
            <p className="text-sm text-muted-foreground animate-pulse">Verificando...</p>
          )}
        </div>

        <div className="flex justify-center">
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
