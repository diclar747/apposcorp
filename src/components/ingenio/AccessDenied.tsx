import { motion } from 'framer-motion';
import { Target, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { usePaywallStore } from '@/stores/paywallStore';

interface AccessDeniedProps {
  status: string;
}

export function AccessDenied({ status }: AccessDeniedProps) {
  const { openPaywall } = usePaywallStore();
  const isRevoked = status === 'REVOKED';
  const isPending = status === 'PENDING_APPROVAL';

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-24 h-24 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-slate-100 dark:shadow-none"
      >
        {isRevoked ? (
          <AlertCircle className="w-12 h-12 text-rose-600" />
        ) : isPending ? (
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }}>
             <Target className="w-12 h-12 text-amber-500" />
          </motion.div>
        ) : (
          <Target className="w-12 h-12 text-indigo-600" />
        )}
      </motion.div>
      
      <Badge className={cn(
        "mb-4 px-4 py-1 font-bold uppercase tracking-widest border-none",
        isRevoked ? "bg-rose-600 text-white" : 
        isPending ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
        "bg-indigo-600 text-white"
      )}>
        {isRevoked ? 'Acceso Revocado' : 
         isPending ? 'Suscripción en Trámite' : 
         'Acceso VIP Requerido'}
      </Badge>

      <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">
        {isRevoked ? 'Sistema Bloqueado' : 
         isPending ? 'Validando tu Pago' : 
         'Ingenio Millonario'}
      </h2>

      <p className="text-slate-500 max-w-md mx-auto mb-8 font-medium">
        {isRevoked 
          ? 'Tu acceso ha sido suspendido temporalmente por falta de pago. Regulariza tu situación para recuperar el control de tus finanzas.'
          : isPending
          ? 'Hemos recibido tu solicitud de acceso. Un administrador está validando tu transferencia. Este proceso suele tardar menos de 24 horas.'
          : 'Toma el control total de tu libertad financiera. Adquiere tu acceso para desbloquear el tablero maestro y la academia premium.'}
      </p>

      <Button 
        onClick={openPaywall}
        className={cn(
          "h-14 px-10 rounded-full shadow-lg font-bold text-lg",
          isRevoked ? "bg-rose-600 hover:bg-rose-700 shadow-rose-200 dark:shadow-none" : 
          isPending ? "bg-slate-800 hover:bg-slate-900 shadow-slate-200 dark:shadow-none" :
          "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200 dark:shadow-none"
        )}
      >
        {isRevoked ? 'Re-activar Acceso' : 
         isPending ? 'Verificar Estado' : 
         'Solicitar Acceso Full'}
      </Button>
    </div>
  );
}
