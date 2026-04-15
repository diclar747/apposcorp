import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle, Smartphone, Loader2, Zap, ScanLine, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useAuthStore, useWalletStore } from '@/stores';
import { formatCurrency } from '@/lib/utils';
import { walletApi } from '@/lib/api';
import { parseQRCode, type QRPaymentData } from '@/lib/qr';
import { QRCameraScanner } from '@/components/client/QRCameraScanner';
import { PinDialog } from '@/components/client/PinDialog';

type ScanStep = 'scanning' | 'details' | 'processing' | 'success';

export default function ClientScan() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  const { fetchWallet, fetchTransactions } = useWalletStore();

  const [step, setStep] = useState<ScanStep>('scanning');
  const [paymentData, setPaymentData] = useState<QRPaymentData | null>(null);
  const [amount, setAmount] = useState('');
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [pinMode, setPinMode] = useState<'setup' | 'verify'>('verify');
  const [hasPin, setHasPin] = useState<boolean | null>(null);

  // Check PIN status on mount
  useEffect(() => {
    walletApi.getPinStatus().then((r) => setHasPin(r.hasPin)).catch(() => setHasPin(false));
  }, []);

  // Check for pre-scanned data from QRPayment modal navigation
  useEffect(() => {
    const state = location.state as { scannedData?: string } | null;
    if (state?.scannedData) {
      handleQRScan(state.scannedData);
      // Clear the state so it doesn't re-trigger
      window.history.replaceState({}, document.title);
    }
  }, []);

  const handleQRScan = (decodedText: string) => {
    const parsed = parseQRCode(decodedText);
    if (!parsed) {
      toast.error('Código QR inválido');
      return;
    }
    if (parsed.toUserId === user?.id) {
      toast.error('No puedes pagarte a ti mismo');
      return;
    }
    setPaymentData(parsed);
    if (parsed.amount) setAmount(parsed.amount.toString());
    setStep('details');
  };

  const handleConfirmDetails = () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      toast.error('Ingresa un monto válido');
      return;
    }
    // Start PIN flow
    if (hasPin === false) {
      setPinMode('setup');
    } else {
      setPinMode('verify');
    }
    setShowPinDialog(true);
  };

  const handlePinSubmit = async (pin: string): Promise<boolean> => {
    if (pinMode === 'setup') {
      try {
        await walletApi.setPin(pin);
        setHasPin(true);
        toast.success('PIN configurado correctamente');
        // After setup, switch to verify mode
        setPinMode('verify');
        return true;
      } catch (e: any) {
        toast.error(e.message || 'Error al configurar PIN');
        return false;
      }
    }

    // Verify mode — process the actual payment
    setShowPinDialog(false);
    return await processPayment(pin);
  };

  const processPayment = async (pin: string): Promise<boolean> => {
    if (!paymentData || !user) return false;
    setStep('processing');
    try {
      await walletApi.transfer(
        paymentData.toUserId,
        parseFloat(amount),
        `Pago a ${paymentData.recipientName}`,
        pin
      );
      await fetchWallet(user.id);
      if (user.walletId) await fetchTransactions(user.walletId);
      setStep('success');
      toast.success('¡Pago realizado con éxito!');
      setTimeout(() => navigate('/app/wallet'), 3000);
      return true;
    } catch (error: any) {
      setStep('details');
      toast.error(error.message || 'Error al procesar el pago');
      return false;
    }
  };

  // Success screen
  if (step === 'success') {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center px-6 text-center max-w-lg mx-auto">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="relative mb-8"
        >
          <div className="w-24 h-24 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-2xl">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 300 }}
            >
              <CheckCircle className="w-12 h-12 text-emerald-500" />
            </motion.div>
          </div>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1.3, opacity: 0 }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="absolute inset-0 rounded-full border-2 border-emerald-500/20"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-2 mb-8"
        >
          <h2 className="text-2xl font-black tracking-tight">¡Pago Exitoso!</h2>
          <p className="text-muted-foreground/60 text-sm font-medium">
            Has pagado <span className="font-black text-foreground">{formatCurrency(parseFloat(amount))}</span> a{' '}
            <span className="font-black text-foreground">{paymentData?.recipientName}</span>
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="w-full"
        >
          <Button
            onClick={() => navigate('/app/wallet')}
            className="w-full h-14 font-black text-xs uppercase tracking-[0.15em] bg-blue-600 hover:bg-blue-700 rounded-2xl shadow-lg shadow-blue-500/20"
          >
            VOLVER A LA BILLETERA
          </Button>
        </motion.div>
      </div>
    );
  }

  // Processing screen
  if (step === 'processing') {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center px-6 text-center max-w-lg mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-6"
        >
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20 mx-auto shadow-2xl">
              <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
            </div>
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1.3, opacity: 0 }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="absolute inset-0 rounded-full border-2 border-blue-500/20 mx-auto w-24 h-24"
              style={{ left: '50%', transform: 'translateX(-50%)' }}
            />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight mb-1">Procesando pago...</h2>
            <p className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-[0.2em]">Espera un momento</p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="pt-6 pb-20 space-y-6 max-w-lg mx-auto px-4">
      {/* Header */}
      <div className="flex items-center gap-4">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate(-1)}
          className="w-11 h-11 rounded-2xl glass-premium border border-white/10 flex items-center justify-center shadow-lg active:scale-95 transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </motion.button>
        <div className="flex-1">
          <h1 className="text-xl font-black tracking-tight">
            {step === 'scanning' ? 'Escanear QR' : 'Confirmar Pago'}
          </h1>
          <p className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-[0.15em]">
            {step === 'scanning' ? 'Apunta al código QR' : 'Revisa los detalles'}
          </p>
        </div>
        {step === 'scanning' && (
          <div className="w-11 h-11 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
            <ScanLine className="w-5 h-5 text-blue-500" />
          </div>
        )}
      </div>

      {step === 'scanning' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="rounded-[2rem] overflow-hidden shadow-2xl border border-white/10">
            <QRCameraScanner onScan={handleQRScan} active={step === 'scanning'} />
          </div>
        </motion.div>
      )}

      {step === 'details' && paymentData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Payment Card */}
          <div className="glass-premium rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden">
            {/* Recipient Header */}
            <div className="p-6 border-b border-white/5 flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shadow-lg">
                <Smartphone className="w-8 h-8 text-blue-500" />
              </div>
              <div className="text-center">
                <h3 className="font-black text-lg tracking-tight">{paymentData.recipientName}</h3>
                <p className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-[0.2em]">
                  Confirmar Pago
                </p>
              </div>
            </div>

            {/* Amount Section */}
            <div className="p-6 space-y-4">
              {paymentData.amount ? (
                <div className="text-center py-2">
                  <p className="text-[10px] text-muted-foreground/40 font-black uppercase tracking-[0.2em] mb-2">Total a Pagar</p>
                  <p className="text-4xl font-black tracking-tighter">
                    {formatCurrency(paymentData.amount)}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 px-1">
                    Monto a enviar
                  </label>
                  <Input
                    type="text"
                    placeholder="0"
                    value={amount ? Number(amount).toLocaleString('es-PY') : ''}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setAmount(val);
                    }}
                    className="text-center text-3xl font-black h-16 rounded-2xl glass-premium border-white/10 focus-visible:ring-blue-500/30"
                    autoFocus
                  />
                </div>
              )}
            </div>

            {/* Security Badge */}
            <div className="px-6 pb-6">
              <div className="flex items-center gap-2 justify-center text-[10px] text-muted-foreground/40 font-bold uppercase tracking-[0.15em]">
                <Shield className="w-3 h-3" />
                Protegido con PIN de seguridad
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <motion.div whileTap={{ scale: 0.98 }}>
              <Button
                className="w-full h-16 text-sm font-black uppercase tracking-[0.15em] bg-blue-600 hover:bg-blue-700 rounded-[2rem] shadow-xl shadow-blue-500/20"
                onClick={handleConfirmDetails}
                disabled={!amount || parseFloat(amount) <= 0}
              >
                <Zap className="w-5 h-5 mr-2" />
                CONFIRMAR PAGO
              </Button>
            </motion.div>
            <Button
              variant="ghost"
              className="w-full h-12 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 hover:text-foreground"
              onClick={() => {
                setPaymentData(null);
                setAmount('');
                setStep('scanning');
              }}
            >
              CANCELAR
            </Button>
          </div>
        </motion.div>
      )}

      {/* PIN Dialog */}
      <PinDialog
        open={showPinDialog}
        onClose={() => setShowPinDialog(false)}
        mode={pinMode}
        onPinSubmit={handlePinSubmit}
      />
    </div>
  );
}
