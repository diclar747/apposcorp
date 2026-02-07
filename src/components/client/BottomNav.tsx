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
    <nav className="bottom-nav pb-safe">
      <div className="max-w-lg mx-auto px-2 py-2">
        <ul className="flex items-center justify-around">
          {/* Left items */}
          {navItems.slice(0, 2).map((item) => {
            const active = isActive(item.path);
            const Icon = item.icon;

            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={cn(
                    'flex flex-col items-center gap-1 py-2 px-3 rounded-2xl transition-all duration-200',
                    active
                      ? 'text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <motion.div whileTap={{ scale: 0.9 }}>
                    <Icon className={cn(
                      'w-5 h-5 transition-all',
                      active && 'stroke-[2.5px]'
                    )} />
                  </motion.div>
                  <span className="text-[10px] font-medium">{item.label}</span>
                </Link>
              </li>
            );
          })}

          {/* QR Button - Center */}
          <li className="-mt-6">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={onQRClick}
              className="fab-qr"
            >
              <QrCode className="w-7 h-7 text-white" />
            </motion.button>
          </li>

          {/* Right items */}
          {navItems.slice(2).map((item) => {
            const active = isActive(item.path);
            const Icon = item.icon;

            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={cn(
                    'flex flex-col items-center gap-1 py-2 px-3 rounded-2xl transition-all duration-200',
                    active
                      ? 'text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <motion.div whileTap={{ scale: 0.9 }}>
                    <Icon className={cn(
                      'w-5 h-5 transition-all',
                      active && 'stroke-[2.5px]'
                    )} />
                  </motion.div>
                  <span className="text-[10px] font-medium">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
