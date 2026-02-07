import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle, Smartphone, Loader2 } from 'lucide-react';
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
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6"
        >
          <CheckCircle className="w-12 h-12 text-green-600" />
        </motion.div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">¡Pago Exitoso!</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-8">
          Has pagado {formatCurrency(parseFloat(amount))} a {paymentData?.recipientName}
        </p>
        <Button onClick={() => navigate('/app/wallet')} className="w-full max-w-xs font-bold">
          VOLVER A LA BILLETERA
        </Button>
      </div>
    );
  }

  // Processing screen
  if (step === 'processing') {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-6">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Procesando pago...</h2>
        <p className="text-slate-500 dark:text-slate-400">Espera un momento</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-xl font-bold">
          {step === 'scanning' ? 'Escanear QR' : 'Confirmar Pago'}
        </h1>
      </div>

      {step === 'scanning' && (
        <QRCameraScanner onScan={handleQRScan} active={step === 'scanning'} />
      )}

      {step === 'details' && paymentData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="bg-card rounded-2xl border shadow-xl overflow-hidden">
            <div className="bg-muted p-6 text-center border-b">
              <div className="w-16 h-16 bg-background rounded-xl mx-auto shadow-sm flex items-center justify-center mb-3">
                <Smartphone className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="font-bold text-lg">{paymentData.recipientName}</h3>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                Confirmar Pago
              </p>
            </div>
            <div className="p-6 space-y-4">
              {paymentData.amount ? (
                <div className="text-center">
                  <p className="text-sm text-muted-foreground font-medium uppercase mb-1">Total a Pagar</p>
                  <p className="text-4xl font-black tracking-tighter">
                    {formatCurrency(paymentData.amount)}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    Monto a enviar
                  </label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="text-center text-3xl font-black h-16"
                    min="1"
                    autoFocus
                  />
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <Button
              className="w-full h-14 text-lg font-black bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-500/20"
              onClick={handleConfirmDetails}
              disabled={!amount || parseFloat(amount) <= 0}
            >
              CONFIRMAR PAGO
            </Button>
            <Button
              variant="ghost"
              className="w-full font-bold text-muted-foreground"
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
