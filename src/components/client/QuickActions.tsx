import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ArrowUp,
  ArrowDown,
  QrCode,
  Wallet,
  ScanLine,
  ShoppingBag,
  GraduationCap
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickAction {
  icon: typeof ArrowUp;
  label: string;
  href: string;
  color: string;
}

const actions = [
  { icon: ArrowUp, label: 'Enviar', href: '/app/wallet/transferir', bgColor: 'bg-blue-50', iconColor: 'text-blue-500' },
  { icon: ArrowDown, label: 'Recibir', href: '/app/tarjeta', bgColor: 'bg-teal-50', iconColor: 'text-teal-500' },
  { icon: Wallet, label: 'Préstamos', href: '/app/creditos', bgColor: 'bg-indigo-50', iconColor: 'text-indigo-500' },
  { icon: ScanLine, label: 'Recargar', bgColor: 'bg-orange-50', iconColor: 'text-orange-500' },
  { icon: ShoppingBag, label: 'E-Commerce', href: '/app/tiendas', bgColor: 'bg-purple-50', iconColor: 'text-purple-500' },
  { icon: GraduationCap, label: 'Cursos', href: '/app/cursos', bgColor: 'bg-amber-50', iconColor: 'text-amber-500' },
  { icon: QrCode, label: 'Historial', href: '/app/wallet', bgColor: 'bg-blue-50', iconColor: 'text-blue-600' },
  { icon: ScanLine, label: 'Ajustes', href: '/app/ajustes', bgColor: 'bg-slate-50', iconColor: 'text-slate-500' },
];

export function QuickActions({ className }: { className?: string }) {
  return (
    <div className={cn('grid grid-cols-4 gap-y-6 gap-x-4', className)}>
      {actions.map((action, index) => {
        const Icon = action.icon;
        return (
          <Link key={action.label + index} to={action.href || '#'}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex flex-col items-center gap-2"
            >
              <div className={cn(
                'w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300',
                'bg-white dark:bg-slate-900 shadow-[0_8px_20px_-6px_rgba(0,0,0,0.1)] dark:shadow-none border border-gray-100 dark:border-white/5',
                'hover:shadow-xl hover:-translate-y-1'
              )}>
                <div className={cn('w-10 h-10 rounded-full flex items-center justify-center', action.bgColor)}>
                  <Icon className={cn('w-5 h-5', action.iconColor)} />
                </div>
              </div>
              <span className="text-[10px] font-bold text-muted-foreground/80 text-center leading-tight">
                {action.label}
              </span>
            </motion.div>
          </Link>
        );
      })}
    </div>
  );
}
