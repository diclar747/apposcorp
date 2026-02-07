import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  ArrowUp, 
  ArrowDown, 
  QrCode, 
  Wallet,
  ScanLine
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickAction {
  icon: typeof ArrowUp;
  label: string;
  href: string;
  color: string;
}

const actions: QuickAction[] = [
  {
    icon: ArrowUp,
    label: 'Enviar',
    href: '/app/wallet/transferir',
    color: 'from-blue-500 to-blue-600',
  },
  {
    icon: ArrowDown,
    label: 'Recibir',
    href: '/app/tarjeta',
    color: 'from-emerald-500 to-emerald-600',
  },
  {
    icon: Wallet,
    label: 'Préstamos',
    href: '/app/creditos',
    color: 'from-violet-500 to-violet-600',
  },
  {
    icon: ScanLine,
    label: 'Recargar',
    href: '/app/escanear',
    color: 'from-orange-500 to-orange-600',
  },
];

export function QuickActions({ className }: { className?: string }) {
  return (
    <div className={cn('grid grid-cols-4 gap-3', className)}>
      {actions.map((action, index) => {
        const Icon = action.icon;
        return (
          <Link key={action.label} to={action.href}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex flex-col items-center gap-2"
            >
              <div className={cn(
                'w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg',
                'bg-gradient-to-br',
                action.color
              )}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">
                {action.label}
              </span>
            </motion.div>
          </Link>
        );
      })}
    </div>
  );
}
