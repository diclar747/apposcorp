import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, Wallet, Landmark, ShieldCheck, CheckCircle2, Loader2, ArrowRight, X, Clock } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/stores';
import { useWalletStore } from '@/stores/walletStore';
import { sellerSubscriptionsApi } from '@/lib/api';
import { formatCurrency, cn } from '@/lib/utils';
import { toast } from 'sonner';
import { ImageUpload } from '@/components/shared/ImageUpload';
import type { SubscriptionPlan } from '@/types';

interface SellerSubscriptionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: SubscriptionPlan | null;
  billingCycle: 'monthly' | 'quarterly' | 'semi_annual' | 'annual';
  onSuccess?: () => void;
}

export function SellerSubscriptionModal({ open, onOpenChange, plan, billingCycle, onSuccess }: SellerSubscriptionModalProps) {
  const { user } = useAuthStore();
  const { wallet, fetchWallet } = useWalletStore();
  const [loading, setLoading] = useState(false);
  const [paymentMethod] = useState<'BANK_TRANSFER'>('BANK_TRANSFER');
  const [step, setStep] = useState<'selection' | 'upload_receipt' | 'pending_approval'>('selection');
  const [receipt, setReceipt] = useState<string | null>(null);

  const price = plan ? ((plan.prices as any)?.[billingCycle] || plan.price) : 0;

  useEffect(() => {
    if (open && user) {
      fetchWallet(user.id);
      checkExistingSubscription();
    }
  }, [open]); // Only run when 'open' changes to true

  const checkExistingSubscription = async () => {
    try {
      const sub = await sellerSubscriptionsApi.getMySubscription();
      if (sub && sub.status === 'PENDING_APPROVAL') {
        setStep('pending_approval');
      } else {
        setStep('selection');
      }
    } catch (error) {
      console.error('Error checking seller subscription:', error);
    }
  };

  const handleSubscribe = async () => {
    if (!plan) return;

    if (paymentMethod === 'BANK_TRANSFER' && step === 'selection') {
      setStep('upload_receipt');
      return;
    }

    if (paymentMethod === 'BANK_TRANSFER' && !receipt) {
      toast.error('Por favor, sube el comprobante de transferencia');
      return;
    }

    try {
      setLoading(true);
      await sellerSubscriptionsApi.subscribe({
        planId: plan.id,
        paymentMethod,
        receiptUrl: receipt || undefined,
        billingCycle
      });

      if (paymentMethod === 'BANK_TRANSFER') {
        setStep('pending_approval');
      } else {
        toast.success('Suscripción activada exitosamente');
        onSuccess?.();
        onOpenChange(false);
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al procesar la suscripción');
    } finally {
      setLoading(false);
    }
  };

  if (!plan) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        showCloseButton={false}
        className="sm:max-w-[480px] p-0 overflow-hidden border-none shadow-2xl bg-slate-950 max-h-[95vh] flex flex-col"
      >
        <div className="absolute top-4 right-4 z-[100]">
          <DialogClose asChild>
            <button className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-md transition-all border border-white/10 group">
              <X className="w-4 h-4 group-hover:scale-110 transition-transform" />
            </button>
          </DialogClose>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <AnimatePresence mode="wait">
            {step === 'pending_approval' ? (
            <motion.div
              key="pending_approval"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-8 text-center space-y-6"
            >
              <div className="w-24 h-24 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Clock className="w-12 h-12 text-amber-500" />
              </div>
              
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-white uppercase tracking-tight">Verificación en Proceso</h2>
                <p className="text-slate-400">
                  Hemos recibido tu comprobante de pago. Un administrador verificará la transferencia y activará tu plan en breve.
                </p>
              </div>

              <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 text-left space-y-3">
                 <div className="flex justify-between text-sm">
                   <span className="text-slate-400">Plan Seleccionado:</span>
                   <span className="text-white font-bold">{plan.name}</span>
                 </div>
                 <div className="flex justify-between text-sm">
                   <span className="text-slate-400">Ciclo:</span>
                   <span className="text-white font-bold capitalize">{billingCycle === 'monthly' ? 'Mensual' : billingCycle === 'quarterly' ? 'Trimestral' : billingCycle === 'semi_annual' ? 'Semestral' : 'Anual'}</span>
                 </div>
                 <div className="flex justify-between text-sm">
                   <span className="text-slate-400">Monto:</span>
                   <span className="text-amber-500 font-bold">{formatCurrency(price)}</span>
                 </div>
              </div>

              <Button 
                onClick={() => onOpenChange(false)}
                className="w-full bg-slate-800 hover:bg-slate-700 text-white"
              >
                Entendido
              </Button>
            </motion.div>
          ) : step === 'upload_receipt' ? (
            <motion.div
              key="upload_receipt"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-6"
            >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setStep('selection')}
                      className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400"
                    >
                      <ArrowRight className="w-5 h-5 rotate-180" />
                    </button>
                    <DialogTitle className="text-xl font-black text-white">Transferencia Bancaria</DialogTitle>
                  </div>
                </div>

              <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 mb-6 space-y-3">
                <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-2">Datos para Transferencia</p>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <span className="text-slate-500 font-bold uppercase tracking-tighter">Entidad</span>
                    <p className="text-white font-black">ueno bank S.A.</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-500 font-bold uppercase tracking-tighter">N° Cuenta</span>
                    <p className="text-white font-black">6192654055</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-500 font-bold uppercase tracking-tighter">Titular</span>
                    <p className="text-white font-black text-[10px]">OSCORP S.A.</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-500 font-bold uppercase tracking-tighter">RUC</span>
                    <p className="text-white font-black">80128841-0</p>
                  </div>
                </div>
                <Separator className="my-2 border-slate-800" />
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-400">Monto a Transferir:</span>
                  <span className="text-lg font-black text-white">{formatCurrency(price)}</span>
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-sm font-bold text-slate-300">Sube tu Comprobante</Label>
                <ImageUpload
                  value={receipt || ''}
                  onChange={setReceipt}
                  shape="rect"
                  label="Adjuntar Comprobante"
                />
              </div>

              <Button
                className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-bold h-12"
                disabled={!receipt || loading}
                onClick={handleSubscribe}
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirmar Pago y Enviar'}
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="selection"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="bg-gradient-to-br from-blue-900 to-slate-900 p-6 pb-8 relative overflow-hidden">
                <div className="relative z-10">
                  <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 mb-4 tracking-widest uppercase text-[10px]">
                    Suscripción Vendedor
                  </Badge>
                  <h2 className="text-2xl font-black text-white mb-2 leading-tight">
                    Adquirir Plan <span className="text-blue-400">{plan.name}</span>
                  </h2>
                  <p className="text-blue-200/80 text-sm">Estás a un paso de potenciar tu tienda.</p>
                </div>

                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-500 rounded-full blur-3xl opacity-20 pointer-events-none" />
              </div>

              <div className="p-6">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-6 flex justify-between items-center shadow-inner">
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Total a Pagar</p>
                    <p className="text-2xl font-black text-white">
                      {formatCurrency(price)}
                    </p>
                  </div>
                  <Badge variant="outline" className="border-slate-700 text-slate-300 bg-slate-800/50">
                    Ciclo: {billingCycle === 'monthly' ? 'Mensual' : billingCycle === 'quarterly' ? 'Trimestral' : billingCycle === 'semi_annual' ? 'Semestral' : 'Anual'}
                  </Badge>
                </div>

                <div className="space-y-4">
                  <Label className="text-sm font-bold text-slate-300">Método de Pago</Label>
                  <div className="grid gap-3">
                    <div
                      className={cn(
                        "flex items-center justify-between p-4 rounded-xl border-2 transition-all border-blue-500 bg-blue-500/10"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/20 rounded-lg">
                          <Landmark className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                          <p className="font-bold text-white text-sm">Transferencia Bancaria</p>
                          <p className="text-xs text-slate-400 mt-0.5">Aprobación en 24hs</p>
                        </div>
                      </div>
                      <div className="w-5 h-5 rounded-full border-2 border-blue-500 flex items-center justify-center">
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8">
                  <Button 
                    className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white font-black text-sm uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-blue-900/20"
                    onClick={handleSubscribe}
                    disabled={loading}
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                      <>
                        Continuar
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
