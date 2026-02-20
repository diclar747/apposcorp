import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Home,
  Wallet,
  ShoppingBag,
  GraduationCap,
  User,
  QrCode,
  ScanLine
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  icon: typeof Home;
  label: string;
  path: string;
}

const navItems: NavItem[] = [
  { icon: Home, label: 'Inicio', path: '/app' },
  { icon: Wallet, label: 'Billetera', path: '/app/wallet' },
  { icon: ShoppingBag, label: 'Tienda', path: '/app/tiendas' },
  { icon: User, label: 'Perfil', path: '/app/perfil' },
];

interface BottomNavProps {
  onQRClick?: () => void;
}

export function BottomNav({ onQRClick }: BottomNavProps) {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/app') return location.pathname === '/app';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 pb-safe pointer-events-none">
      <div className="max-w-lg mx-auto relative h-20 bottom-nav-mask">
        {/* The SVG/Path background for the notch */}
        <div className="absolute inset-x-4 bottom-2 h-16 glass-premium rounded-[2rem] notch-path pointer-events-auto border-t border-white/10" />

        <ul className="absolute inset-x-8 bottom-2 h-16 flex items-center justify-between pointer-events-auto">
          {/* Left items */}
          {navItems.slice(0, 2).map((item) => {
            const active = isActive(item.path);
            const Icon = item.icon;

            return (
              <li key={item.path} className="flex-1">
                <Link
                  to={item.path}
                  className={cn(
                    'flex flex-col items-center gap-1.5 transition-all duration-300',
                    active
                      ? 'text-primary scale-110'
                      : 'text-muted-foreground/60 hover:text-foreground'
                  )}
                >
                  <motion.div whileTap={{ scale: 0.9 }}>
                    <Icon className={cn(
                      'w-5 h-5 transition-all',
                      active && 'stroke-[2.5px] drop-shadow-[0_0_8px_rgba(59,130,246,0.3)]'
                    )} />
                  </motion.div>
                  <span className={cn(
                    "text-[10px] font-bold tracking-tight uppercase",
                    active ? "opacity-100" : "opacity-40"
                  )}>{item.label}</span>
                </Link>
              </li>
            );
          })}

          {/* QR Button - Elevated Center */}
          <li className="flex-1 flex justify-center -translate-y-6">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.9 }}
              onClick={onQRClick}
              className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-[0_10px_30px_-5px_rgba(37,99,235,0.5)] flex items-center justify-center border border-white/20 relative"
            >
              <div className="absolute inset-0 rounded-2xl bg-white/10 blur-[1px]" />
              <QrCode className="w-7 h-7 relative z-10" />
            </motion.button>
          </li>

          {/* Right items */}
          {navItems.slice(2).map((item) => {
            const active = isActive(item.path);
            const Icon = item.icon;

            return (
              <li key={item.path} className="flex-1">
                <Link
                  to={item.path}
                  className={cn(
                    'flex flex-col items-center gap-1.5 transition-all duration-300',
                    active
                      ? 'text-primary scale-110'
                      : 'text-muted-foreground/60 hover:text-foreground'
                  )}
                >
                  <motion.div whileTap={{ scale: 0.9 }}>
                    <Icon className={cn(
                      'w-5 h-5 transition-all',
                      active && 'stroke-[2.5px] drop-shadow-[0_0_8px_rgba(59,130,246,0.3)]'
                    )} />
                  </motion.div>
                  <span className={cn(
                    "text-[10px] font-bold tracking-tight uppercase",
                    active ? "opacity-100" : "opacity-40"
                  )}>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
