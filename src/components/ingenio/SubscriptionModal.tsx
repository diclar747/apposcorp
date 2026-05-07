import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, Wallet, Landmark, ShieldCheck, AlertCircle, CheckCircle, CheckCircle2, Loader2, ArrowRight, Plus, Sparkles, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/stores';
import { useWalletStore } from '@/stores/walletStore';
import { ingenioApi, usersApi } from '@/lib/api';
import { formatCurrency, cn } from '@/lib/utils';
import { toast } from 'sonner';

interface SubscriptionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function SubscriptionModal({ open, onOpenChange, onSuccess }: SubscriptionModalProps) {
  const { user, hasRole, fetchCurrentUser } = useAuthStore();
  const { wallet, fetchWallet } = useWalletStore();
  const [loading, setLoading] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const [config, setConfig] = useState({ price: 700000, maxInstallments: 3, contactPhone: '' });
  const [installments, setInstallments] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<'WALLET' | 'BANK_TRANSFER'>('WALLET');
  const [step, setStep] = useState<'selection' | 'upgrade_benefits' | 'processing' | 'success'>('selection');

  const sub = user?.ingenioSubscription;
  const isRevoked = sub?.status === 'REVOKED';
  const isPayingNextQuota = !!(sub && (sub.status === 'ACTIVE' || isRevoked) && sub.paidAmount < sub.totalAmount);
  const remainingBalance = sub ? sub.totalAmount - sub.paidAmount : 0;

  // Professional Rounding Logic
  const getCleanAmount = (total: number, count: number, currentPaid: number) => {
    if (count <= 1) return total;
    const roundedBase = Math.ceil((total / count) / 1000) * 1000;
    const quotaIndex = Math.floor(currentPaid / (roundedBase - 50)); 
    const isLast = (quotaIndex + 1) >= count;
    const calculated = isLast ? Math.max(0, total - (roundedBase * (count - 1))) : roundedBase;
    return calculated;
  };

  const activeAmount = isPayingNextQuota 
    ? getCleanAmount(sub!.totalAmount, sub!.installments, sub!.paidAmount)
    : installments > 1 
      ? Math.ceil((config.price / installments) / 1000) * 1000 
      : config.price;

  const currentQuotaNumber = sub ? Math.floor(sub.paidAmount / (Math.ceil((sub.totalAmount / sub.installments) / 1000) * 1000 - 50)) + 1 : 1;

  const isClient = hasRole(['client']);
  const canPayWithWallet = isClient && wallet && wallet.balance >= activeAmount;

  useEffect(() => {
    if (open) {
      fetchConfig();
      if (user) fetchWallet(user.id);
      setStep('selection');
    }
  }, [open, user]);

  const fetchConfig = async () => {
    try {
      const data = await ingenioApi.getConfig();
      setConfig(data);
    } catch (error) {
      console.error('Error fetching ingenio config:', error);
    }
  };

  const handleSubscribe = async () => {
    if (paymentMethod === 'WALLET' && !canPayWithWallet) {
      toast.error('Saldo insuficiente en tu Billetera Oscorp');
      return;
    }

    try {
      setLoading(true);

      await ingenioApi.subscribe({
        installments: isPayingNextQuota ? sub!.installments : installments,
        paymentMethod
      });
      
      if (paymentMethod === 'BANK_TRANSFER') {
        const adminPhone = config.contactPhone.replace(/\D/g, '') || "595975855585";
        const userName = `${user?.firstName} ${user?.lastName || ''}`;
        
        let message = '';
        if (isPayingNextQuota) {
          if (sub?.installments === 1) {
            message = `INGENIO MILLONARIO - ${isRevoked ? 'REACTIVACIÓN' : 'PAGO DE ACCESO'}\n` +
                      `Hola! Me gustaría registrar el pago de mi saldo pendiente para volver a activar mi acceso.\n` +
                      `Usuario: ${userName}\n` +
                      `Monto a Abonar: ${formatCurrency(activeAmount)}`;
          } else {
            message = `INGENIO MILLONARIO - ${isRevoked ? 'REACTIVACIÓN' : 'PAGO DE CUOTA'}\n` +
                      `Hola! Me gustaría volver a activar mi acceso de Ingenio Millonario.\n` +
                      `Usuario: ${userName}\n` +
                      `Monto de Cuota Pendiente: ${formatCurrency(activeAmount)}\n` +
                      `Cuota Nro: ${currentQuotaNumber} de ${sub?.installments}\n` +
                      `Deuda Total: ${formatCurrency(remainingBalance)}`;
          }
        } else {
          message = `INGENIO MILLONARIO - NUEVA SOLICITUD\n` +
                    `Hola! Acabo de registrar mi solicitud de acceso full a Ingenio Millonario.\n` +
                    `Usuario: ${userName}\n` +
                    `Plan: ${installments} ${installments === 1 ? 'pago único' : 'cuotas'}\n` +
                    `Monto Total: ${formatCurrency(config.price)}\n` +
                    `Método: Transferencia Bancaria.`;
        }
        
        window.open(`https://wa.me/${adminPhone}?text=${encodeURIComponent(message)}`, '_blank');
      }
      
      setStep('success');
      await fetchCurrentUser();
      if (paymentMethod === 'WALLET' && user?.id) {
        await fetchWallet(user.id);
      }
      if (onSuccess) onSuccess();
    } catch (error: any) {
      toast.error(error.message || 'Error al procesar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgradeToClient = async () => {
    try {
      setUpgrading(true);
      await usersApi.upgradeToClient();
      await fetchCurrentUser();
      if (user) await fetchWallet(user.id);
      toast.success('¡Ahora eres Cliente! Billetera Oscorp activada.');
      setStep('selection');
    } catch (error: any) {
      toast.error(error.message || 'Error al activar perfil de cliente');
    } finally {
      setUpgrading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="sm:max-w-[500px] p-0 overflow-hidden border-none shadow-2xl max-h-[95vh] flex flex-col">
        <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 p-8 pt-16 sm:p-10 sm:pt-20 text-white relative overflow-hidden shrink-0">
          {/* Custom Close Button for visibility on dark background */}
          <button 
            onClick={() => onOpenChange(false)}
            className="absolute top-5 right-5 z-50 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="absolute -top-10 -right-10 opacity-10 pointer-events-none">
            <ShieldCheck className="w-64 h-64" />
          </div>
          <div className="relative z-10">
            <Badge className="bg-white/20 hover:bg-white/30 text-white border-none mb-4 backdrop-blur-md px-3 py-1 font-bold text-[10px] tracking-widest">
              INGENIO MILLONARIO PASS
            </Badge>
            <DialogTitle className="text-3xl sm:text-4xl font-black mb-3 tracking-tighter leading-none uppercase">
              Acceso Ilimitado
            </DialogTitle>
            <DialogDescription className="text-indigo-100 text-xs sm:text-sm font-medium leading-relaxed max-w-[340px]">
              Obtén el pase completo al ecosistema: Metodología 5S, Academia Master y gestión financiera avanzada.
            </DialogDescription>
          </div>
        </div>

        <div className="p-6 sm:p-8 bg-white dark:bg-slate-950 overflow-y-auto flex-1 custom-scrollbar">
          <AnimatePresence mode="wait">
            {step === 'selection' && (
              <motion.div
                key="selection"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {/* Revoked Access Warning */}
                {isRevoked && (
                  <div className="bg-rose-50 dark:bg-rose-900/20 border-2 border-rose-200 dark:border-rose-900/30 p-5 rounded-[2rem] flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-rose-200 dark:shadow-none">
                      <AlertCircle className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest mb-1">Acceso Revocado</p>
                      <p className="text-[13px] text-rose-700 dark:text-rose-300 font-bold leading-tight">
                        Tu acceso ha sido suspendido por falta de pago. Regulariza tu saldo para continuar.
                      </p>
                    </div>
                  </div>
                )}

                {/* Price Display / Debt Summary */}
                <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-[2rem] border-2 border-slate-100 dark:border-slate-800 shadow-inner">
                  {isPayingNextQuota ? (
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Saldo Pendiente</p>
                        <p className="text-3xl font-black text-rose-500 tracking-tighter">
                          {formatCurrency(remainingBalance)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Monto de Cuota</p>
                        <Badge className="bg-indigo-600 text-white border-none font-black text-xs px-3 py-1">
                          {formatCurrency(activeAmount)}
                        </Badge>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Costo de Acceso</p>
                        <p className="text-4xl font-black text-indigo-600 dark:text-indigo-400 tracking-tighter">
                          {formatCurrency(config.price)}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 border-none font-black text-[10px] px-3 py-1 rounded-lg">
                          PAGO ÚNICO
                        </Badge>
                      </div>
                    </div>
                  )}
                </div>

                {/* Installments selector - HIDDEN IF NEXT QUOTA */}
                {!isPayingNextQuota && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <Label className="text-sm font-bold text-slate-700 dark:text-slate-300">Plan de Pagos</Label>
                      <span className="text-xs text-slate-500 font-medium">Hasta {config.maxInstallments} meses</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {Array.from({ length: config.maxInstallments }, (_, i) => i + 1).map((num) => (
                        <button
                          key={num}
                          onClick={() => setInstallments(num)}
                          className={cn(
                            "py-2 rounded-xl text-sm font-bold border transition-all",
                            installments === num 
                              ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100 dark:shadow-none" 
                              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-indigo-300"
                          )}
                        >
                          {num}x
                        </button>
                      ))}
                    </div>
                    {installments > 1 && (() => {
                      const lastInstAmount = config.price - (activeAmount * (installments - 1));
                      const isEquitable = lastInstAmount === activeAmount;
                      
                      return (
                        <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                          {isEquitable ? (
                            <p className="text-xs text-center text-slate-500">
                              Pagarás <span className="font-bold text-slate-900 dark:text-slate-200">{installments}</span> cuotas mensuales de <span className="font-bold text-slate-900 dark:text-slate-200">{formatCurrency(activeAmount)}</span>
                            </p>
                          ) : (
                            <>
                              <p className="text-xs text-center text-slate-500 mb-1">
                                Pagarás <span className="font-bold text-slate-900 dark:text-slate-200">{installments - 1}</span> cuotas de <span className="font-bold text-slate-900 dark:text-slate-200">{formatCurrency(activeAmount)}</span>
                              </p>
                              <p className="text-[10px] text-center text-slate-400 italic">
                                Y una cuota final de ajuste de <span className="font-bold">{formatCurrency(lastInstAmount)}</span>
                              </p>
                            </>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}

                <Separator className="opacity-50" />

                {/* Payment Method */}
                <div className="space-y-4">
                  <Label className="text-sm font-bold text-slate-700 dark:text-slate-300">Método de Pago</Label>
                  <RadioGroup value={paymentMethod} onValueChange={(val: any) => setPaymentMethod(val)} className="grid grid-cols-1 gap-3">
                      <div 
                        className={cn(
                          "flex items-center space-x-4 p-5 rounded-2xl border-2 cursor-pointer transition-all",
                          paymentMethod === 'WALLET' ? "border-indigo-600 bg-indigo-50/30 dark:bg-indigo-500/5" : "border-slate-100 dark:border-slate-800 hover:border-slate-200"
                        )}
                        onClick={() => setPaymentMethod('WALLET')}
                      >
                        <RadioGroupItem value="WALLET" id="wallet" className="sr-only" />
                        <div className="flex-1 flex items-center gap-4">
                          <div className={cn(
                            "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors",
                            paymentMethod === 'WALLET' ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                          )}>
                            <Wallet className="w-6 h-6" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-black dark:text-white uppercase tracking-tight">Billetera OSCORP</p>
                            {!isClient ? (
                              <p className="text-[10px] text-amber-600 font-extrabold uppercase tracking-widest">Inactiva</p>
                            ) : (
                              <div className="flex flex-col">
                                <p className="text-[11px] text-slate-500 font-bold">Saldo: {formatCurrency(wallet?.balance || 0)}</p>
                                {isPayingNextQuota && (
                                  <Badge className="w-fit mt-1 h-5 text-[9px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-none font-black uppercase">
                                    Cuota #{currentQuotaNumber}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                          {paymentMethod === 'WALLET' && isClient && (
                            <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center">
                                <CheckCircle className="w-4 h-4 text-white" />
                            </div>
                          )}
                        </div>
                      </div>

                      <div 
                        className={cn(
                          "flex items-center space-x-4 p-5 rounded-2xl border-2 cursor-pointer transition-all",
                          paymentMethod === 'BANK_TRANSFER' ? "border-indigo-600 bg-indigo-50/30 dark:bg-indigo-500/5" : "border-slate-100 dark:border-slate-800 hover:border-slate-200"
                        )}
                        onClick={() => setPaymentMethod('BANK_TRANSFER')}
                      >
                        <RadioGroupItem value="BANK_TRANSFER" id="bank" className="sr-only" />
                        <div className="flex-1 flex items-center gap-4">
                          <div className={cn(
                            "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors",
                            paymentMethod === 'BANK_TRANSFER' ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                          )}>
                            <Landmark className="w-6 h-6" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-black dark:text-white uppercase tracking-tight">Transferencia Bancaria</p>
                            <p className="text-[11px] text-slate-500 font-bold">Validación manual en 24h</p>
                          </div>
                          {paymentMethod === 'BANK_TRANSFER' && (
                            <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center">
                                <CheckCircle className="w-4 h-4 text-white" />
                            </div>
                          )}
                        </div>
                      </div>
                  </RadioGroup>
                </div>

                  {!isClient && paymentMethod === 'WALLET' && (
                    <div className="p-5 bg-amber-50 dark:bg-amber-900/10 rounded-2xl border-2 border-amber-100 dark:border-amber-900/20 flex flex-col items-center text-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                        <AlertCircle className="w-5 h-5 text-amber-600" />
                      </div>
                      <p className="text-xs text-amber-800 dark:text-amber-400 font-bold leading-tight">
                        Primero debes activar tu Billetera Oscorp registrándote como Cliente Oficial.
                      </p>
                      <Button 
                        size="sm" 
                        onClick={() => setStep('upgrade_benefits')}
                        className="bg-amber-600 hover:bg-amber-700 text-white font-black h-9 rounded-xl px-6 w-full shadow-lg shadow-amber-200/50"
                      >
                        Activar Perfil Cliente
                      </Button>
                    </div>
                  )}
              </motion.div>
            )}

            {step === 'upgrade_benefits' && (
              <motion.div
                key="upgrade_benefits"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center space-y-2">
                  <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-8 h-8 text-indigo-600" />
                  </div>
                  <h3 className="text-xl font-black dark:text-white uppercase tracking-tight">Activa tu Billetera Oscorp</h3>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    Al convertirte en Cliente Oscorp oficial, desbloqueas el motor financiero de la plataforma.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {[
                    { title: "Pagos Inmediatos", desc: "Compra productos y cursos al instante sin esperas.", icon: <CheckCircle className="w-4 h-4 text-emerald-500" /> },
                    { title: "Tarjeta Virtual", desc: "Accede a tu propia Tarjeta Virtual Oscorp prepaga.", icon: <CheckCircle className="w-4 h-4 text-emerald-500" /> },
                    { title: "Gestión Centralizada", desc: "Control total de tus ingresos y retiros en un solo lugar.", icon: <CheckCircle className="w-4 h-4 text-emerald-500" /> },
                  ].map((benefit, i) => (
                    <div key={i} className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                      <div className="mt-0.5">{benefit.icon}</div>
                      <div>
                        <p className="text-[13px] font-black dark:text-white leading-none mb-1">{benefit.title}</p>
                        <p className="text-[11px] text-slate-500 leading-tight">{benefit.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col gap-3 pt-2">
                  <Button 
                    onClick={handleUpgradeToClient} 
                    disabled={upgrading}
                    className="h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl shadow-lg"
                  >
                    {upgrading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Entendido, Activar Ahora"}
                  </Button>
                  <Button 
                    variant="ghost" 
                    onClick={() => setStep('selection')}
                    disabled={upgrading}
                    className="font-bold text-slate-500"
                  >
                    Volver Atrás
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-10 text-center space-y-4"
              >
                <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-12 h-12 text-green-600" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">¡Solicitud Enviada!</h3>
                <p className="text-slate-500 max-w-xs mx-auto">
                  {paymentMethod === 'WALLET' 
                    ? (isRevoked 
                        ? "¡Excelente! Tu pago ha sido procesado y tu acceso a Ingenio Millonario ha sido restaurado automáticamente."
                        : "Tu pago ha sido procesado con éxito. Un administrador validará tu acceso en breve.")
                    : "Hemos recibido tu solicitud. Por favor envía el comprobante de transferencia al soporte vía WhatsApp para reactivar tu cuenta."}
                </p>
                <Button 
                  onClick={() => onOpenChange(false)} 
                  className="mt-6 bg-slate-900 dark:bg-slate-100 dark:text-slate-900"
                >
                  Entendido
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {step === 'selection' && (
          <div className="p-6 bg-slate-50 dark:bg-slate-900 border-t dark:border-slate-800 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-end shrink-0">
            <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={loading} className="font-bold sm:order-1">
              Cerrar
            </Button>
            <Button 
              onClick={handleSubscribe} 
              disabled={loading || (paymentMethod === 'WALLET' && !isClient)}
              className="bg-indigo-600 hover:bg-indigo-700 font-extrabold px-8 h-12 shadow-lg shadow-indigo-200 dark:shadow-none sm:order-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  {isPayingNextQuota ? 'Pagar Cuota Ahora' : 'Confirmar suscripción'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
