import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, AlertCircle, Fingerprint } from 'lucide-react';
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
      <DialogContent className="sm:max-w-sm glass-premium border-white/10 rounded-[2rem]">
        <DialogHeader className="text-center items-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="relative mb-2"
          >
            <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20 shadow-lg">
              {mode === 'setup' ? (
                <Shield className="w-8 h-8 text-blue-500" />
              ) : (
                <Lock className="w-8 h-8 text-blue-500" />
              )}
            </div>
            {/* Decorative fingerprint */}
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-blue-600/20 flex items-center justify-center border border-blue-500/20">
              <Fingerprint className="w-3 h-3 text-blue-400" />
            </div>
          </motion.div>
          <DialogTitle className="text-center font-black tracking-tight text-lg">{getTitle()}</DialogTitle>
          <DialogDescription className="text-center text-xs text-muted-foreground/60">{getDescription()}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center space-y-5 py-4">
          {/* Step indicator for setup */}
          {mode === 'setup' && (
            <div className="flex gap-2">
              {['enter', 'confirm'].map((s, i) => (
                <div key={s} className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full transition-all ${s === step ? 'bg-blue-500 scale-125' : step === 'confirm' && i === 0 ? 'bg-blue-500' : 'bg-white/10'}`} />
                </div>
              ))}
            </div>
          )}

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
            <InputOTPGroup className="gap-3">
              <InputOTPSlot index={0} className="w-16 h-16 text-2xl font-black rounded-2xl border-white/10 bg-white/5" />
              <InputOTPSlot index={1} className="w-16 h-16 text-2xl font-black rounded-2xl border-white/10 bg-white/5" />
              <InputOTPSlot index={2} className="w-16 h-16 text-2xl font-black rounded-2xl border-white/10 bg-white/5" />
              <InputOTPSlot index={3} className="w-16 h-16 text-2xl font-black rounded-2xl border-white/10 bg-white/5" />
            </InputOTPGroup>
          </InputOTP>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 text-rose-500 text-xs font-bold bg-rose-500/10 px-4 py-2 rounded-xl border border-rose-500/20"
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{error}</span>
            </motion.div>
          )}

          {loading && (
            <p className="text-[10px] text-blue-500 font-black uppercase tracking-[0.2em] animate-pulse">Verificando...</p>
          )}
        </div>

        <div className="flex justify-center pb-2">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={loading}
            className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 hover:text-foreground rounded-xl"
          >
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
