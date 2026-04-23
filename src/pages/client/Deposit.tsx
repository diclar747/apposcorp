import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Wallet, 
  CreditCard, 
  Banknote, 
  Building2, 
  ChevronRight,
  Zap,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore, useWalletStore } from '@/stores';
import { formatCurrency, cn } from '@/lib/utils';
import { toast } from 'sonner';

const PRESET_AMOUNTS = [100000, 250000, 500000, 1000000, 2000000, 5000000];

const PAYMENT_METHODS = [
  { id: 'transfer', name: 'Transferencia Bancaria', icon: Building2, desc: 'Realiza el giro y envía el comprobante' },
];

export default function DepositPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { deposit, isLoading } = useWalletStore();
  
  const [amount, setAmount] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('transfer');
  const [step, setStep] = useState<'amount' | 'method' | 'success'>('amount');

  const handleDeposit = async () => {
    if (!user) return;
    const numAmount = parseFloat(amount);
    
    if (!numAmount || numAmount <= 1000) {
      toast.error('Monto mínimo de recarga: ₲ 1.000');
      return;
    }

    const success = await deposit(user.id, numAmount, `Recarga vía Transferencia Bancaria`);
    
    if (success) {
      setStep('success');
      toast.success('Solicitud enviada para validación');
      
      // WhatsApp Integration
      const adminPhone = '595975855585'; 
      const message = `¡Hola Oscorp! 👋 Quisiera realizar una recarga de saldo en mi billetera.\n\n*Monto:* ₲ ${numAmount.toLocaleString('es-PY')}\n*Usuario:* ${user.firstName} ${user.lastName}\n*Email:* ${user.email}\n*ID:* ${user.id}\n\nAdjunto el comprobante de transferencia bancaria. Quedo atento a la validación. ¡Gracias!`;
      const whatsappUrl = `https://wa.me/${adminPhone}?text=${encodeURIComponent(message)}`;
      
      // Open WhatsApp automatically
      window.open(whatsappUrl, '_blank');
    } else {
      toast.error('Hubo un problema al procesar la solicitud.');
    }
  };

  if (step === 'success') {
    return (
      <div className="pt-20 pb-20 space-y-8 max-w-lg mx-auto px-6 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-24 h-24 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto border border-blue-500/20"
        >
          <CheckCircle className="w-12 h-12 text-blue-500" />
        </motion.div>
        
        <div className="space-y-4">
          <h1 className="text-3xl font-black tracking-tight">Recarga en Proceso</h1>
          <p className="text-muted-foreground/60 font-medium leading-relaxed">
            Tu solicitud de recarga por <span className="text-foreground font-black">{formatCurrency(parseFloat(amount))}</span> está siendo validada por nuestro equipo administrativo.
          </p>
          <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-amber-600">
            Asegúrate de haber enviado el comprobante vía WhatsApp
          </div>
        </div>

        <div className="p-6 glass-premium rounded-[2.5rem] border border-white/5 space-y-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground uppercase font-bold text-[10px]">Estado</span>
            <span className="font-bold text-blue-500 text-[10px] uppercase">PENDIENTE DE VALIDACIÓN</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground uppercase font-bold text-[10px]">Usuario</span>
            <span className="font-bold text-[10px] uppercase">{user?.firstName}</span>
          </div>
        </div>

        <Button 
          onClick={() => navigate('/app/wallet')}
          className="w-full h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 font-black uppercase tracking-widest"
        >
          VOLVER AL INICIO
        </Button>
      </div>
    );
  }

  return (
    <div className="pt-6 pb-28 space-y-8 max-w-lg mx-auto px-4">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => step === 'method' ? setStep('amount') : navigate(-1)}
          className="w-11 h-11 rounded-2xl glass-premium border border-white/10 flex items-center justify-center shadow-lg active:scale-95 transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-black tracking-tight">Recargar Saldo</h1>
          <p className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-[0.15em]">
            {step === 'amount' ? 'PASO 1: MONTO A CARGAR' : 'PASO 2: CONFIRMAR MÉTODO'}
          </p>
        </div>
      </div>

      {step === 'amount' ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Amount Input */}
          <div className="glass-premium p-8 rounded-[3rem] border border-white/10 shadow-2xl text-center space-y-4">
            <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto border border-blue-500/20 mb-2">
              <Wallet className="w-8 h-8 text-blue-500" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">Ingresa el monto</p>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-black text-muted-foreground/20">₲</span>
              <Input
                type="text"
                value={amount ? Number(amount).toLocaleString('es-PY') : ''}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  setAmount(val);
                }}
                className="h-20 text-4xl font-black text-center border-none bg-transparent focus-visible:ring-0"
                placeholder="0"
              />
            </div>
          </div>

          {/* Preset Buttons */}
          <div className="grid grid-cols-3 gap-3">
            {PRESET_AMOUNTS.map((val) => (
              <Button
                key={val}
                variant="outline"
                onClick={() => setAmount(val.toString())}
                className={cn(
                  "h-14 rounded-2xl font-bold transition-all",
                  amount === val.toString() ? "bg-blue-600 border-blue-600 text-white" : "glass-premium border-white/5"
                )}
              >
                + ₲ {val.toLocaleString()}
              </Button>
            ))}
          </div>

          <Button 
            onClick={() => setStep('method')}
            disabled={!amount || parseFloat(amount) < 1000}
            className="w-full h-16 rounded-[2rem] bg-blue-600 hover:bg-blue-700 font-black uppercase tracking-widest shadow-xl shadow-blue-500/20"
          >
            CONTINUAR
            <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="space-y-3">
            {PAYMENT_METHODS.map((method) => {
              const Icon = method.icon;
              const isSelected = selectedMethod === method.id;
              return (
                <button
                  key={method.id}
                  onClick={() => setSelectedMethod(method.id)}
                  className={cn(
                    "w-full glass-premium p-5 rounded-[2rem] border transition-all text-left flex items-center gap-4 group",
                    isSelected ? "border-blue-500 bg-blue-500/5" : "border-white/5 hover:border-white/10"
                  )}
                >
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center transition-all",
                    isSelected ? "bg-blue-500 text-white" : "bg-white/5 text-muted-foreground/60 group-hover:text-foreground"
                  )}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-sm uppercase tracking-tight">{method.name}</p>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground/40 mt-0.5 tracking-widest">{method.desc}</p>
                  </div>
                  <div className={cn(
                    "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                    isSelected ? "border-blue-500 bg-blue-500" : "border-white/10"
                  )}>
                    {isSelected && <Zap className="w-3 h-3 text-white fill-current" />}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Bank Transfer Info */}
          <div className="glass-premium p-6 rounded-[2.5rem] border border-white/10 space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-20">
              <img 
                src="/images/logos/ueno-logo.png" 
                alt="ueno bank" 
                className="h-8 object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://ueno.com.py/wp-content/uploads/2021/11/logo-ueno-footer.png';
                }}
              />
            </div>
            
            <div className="space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500">Datos para Transferencia</h3>
              
              <div className="grid grid-cols-2 gap-y-4 gap-x-2">
                <div>
                  <p className="text-[9px] font-black uppercase text-muted-foreground/40 tracking-widest mb-0.5">Titular</p>
                  <p className="text-xs font-bold uppercase">OSCORP E.A.S.</p>
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase text-muted-foreground/40 tracking-widest mb-0.5">RUC / CI</p>
                  <p className="text-xs font-bold">80128841-0 / 3718400</p>
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase text-muted-foreground/40 tracking-widest mb-0.5">Entidad</p>
                  <div className="flex items-center gap-1.5">
                    <img 
                      src="https://ueno.com.py/wp-content/uploads/2021/11/logo-ueno-footer.png" 
                      alt="" 
                      className="w-4 h-4 object-contain" 
                      onError={(e) => e.currentTarget.style.display = 'none'}
                    />
                    <p className="text-xs font-bold uppercase">ueno bank S.A.</p>
                  </div>
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase text-muted-foreground/40 tracking-widest mb-0.5">N° de cuenta</p>
                  <p className="text-xs font-bold tracking-tight">6192654055</p>
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase text-muted-foreground/40 tracking-widest mb-0.5">Moneda</p>
                  <p className="text-xs font-bold uppercase">Guaraníes</p>
                </div>
              </div>
            </div>

            <div className="p-3 bg-blue-500/5 rounded-2xl border border-blue-500/10">
              <p className="text-[8px] font-bold text-blue-500/60 uppercase text-center leading-relaxed">
                Una vez realizada la transferencia, dale al botón de abajo para enviar el comprobante.
              </p>
            </div>
          </div>

          <div className="p-6 glass-premium rounded-[2.5rem] border border-white/5 space-y-4">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 mb-1">Monto a Recargar</p>
                <p className="text-2xl font-black tracking-tight">{formatCurrency(parseFloat(amount))}</p>
              </div>
              <p className="text-[10px] font-black uppercase text-emerald-500 mb-1">COMISIÓN ₲ 0</p>
            </div>
            <div className="h-px bg-white/5" />
            <div className="flex justify-between font-black">
              <span className="text-xs uppercase tracking-widest text-muted-foreground/60">Total a pagar</span>
              <span className="text-xl tracking-tight">{formatCurrency(parseFloat(amount))}</span>
            </div>
          </div>

          <Button 
            onClick={handleDeposit}
            disabled={isLoading}
            className="w-full h-20 rounded-[2.5rem] bg-blue-600 hover:bg-blue-700 font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 px-8"
          >
            {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
              <div className="flex flex-col items-center gap-1">
                <span className="text-xs">CONFIRMAR RECARGA</span>
                <span className="text-[8px] opacity-60">Y ENVIAR COMPROBANTE</span>
              </div>
            )}
          </Button>
        </motion.div>
      )}
    </div>
  );
}
