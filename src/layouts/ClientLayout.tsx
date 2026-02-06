import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  Store,
  ShoppingBag,
  Wallet,
  GraduationCap,
  User,
  Bell,
  Menu,
  X,
  LogOut,
  Search,
  Sparkles,
  ChevronRight,
  CreditCard,
  QrCode,
  TrendingUp,
  Package,
  Settings,
  HelpCircle,
  Moon,
  Sun
} from 'lucide-react';
import { useAuthStore, useCartStore, useNotificationStore } from '@/stores';
import { useThemeStore } from '@/stores/themeStore';
import { cn, getInitials } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { BrandLogo } from '@/components/brand/BrandLogo';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { BottomNav } from '@/components/client/BottomNav';
import { QRPayment } from '@/components/client/QRPayment';
import { PushPermissionPrompt } from '@/components/push/PushPermissionPrompt';

interface MenuItem {
  icon: typeof Home;
  label: string;
  href: string;
  action?: string;
  premium?: boolean;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

const menuSections: MenuSection[] = [
  {
    title: 'Principal',
    items: [
      { icon: Home, label: 'Inicio', href: '/app' },
      { icon: Wallet, label: 'Mi Billetera', href: '/app/wallet' },
      { icon: CreditCard, label: 'Mi Tarjeta', href: '/app/tarjeta' },
      { icon: QrCode, label: 'Pago QR', href: '#', action: 'qr' },
    ]
  },
  {
    title: 'Compras',
    items: [
      { icon: Store, label: 'Tiendas', href: '/app/tiendas' },
      { icon: ShoppingBag, label: 'Productos', href: '/app/tienda' },
      { icon: Package, label: 'Mis Pedidos', href: '/app/pedidos' },
    ]
  },
  {
    title: 'Finanzas',
    items: [
      { icon: TrendingUp, label: 'Ingenio Millonario', href: '/app/ingenio', premium: true },
    ]
  },
  {
    title: 'Configuración',
    items: [
      { icon: Settings, label: 'Ajustes', href: '/app/ajustes' },
      { icon: HelpCircle, label: 'Ayuda', href: '/app/ayuda' },
    ]
  }
];

export default function ClientLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { itemCount } = useCartStore();
  const { unreadCount, fetchNotifications } = useNotificationStore();
  const { resolvedTheme, toggleTheme } = useThemeStore();
  const isDark = resolvedTheme === 'dark';

  useEffect(() => {
    if (user) {
      fetchNotifications(user.id);
    }
  }, [user, fetchNotifications]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (href: string) => {
    if (href === '/app') return location.pathname === '/app';
    return location.pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="flex items-center justify-between h-14 px-4 max-w-lg mx-auto">
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="w-9 h-9 rounded-full">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-0">
              <div className="h-full flex flex-col">
                {/* User Info Header */}
                <div className="relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-violet-600" />
                  <div className="relative p-6">
                    <div className="flex items-start justify-between">
                      <Avatar className="w-16 h-16 border-4 border-white/20">
                        <AvatarImage src={user?.avatar} />
                        <AvatarFallback className="bg-white/20 text-white text-xl font-semibold backdrop-blur-sm">
                          {user ? getInitials(user.firstName, user.lastName) : 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white"
                        onClick={toggleTheme}
                      >
                        {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                      </Button>
                    </div>
                    <div className="mt-4 text-white">
                      <p className="font-semibold text-lg">{user?.firstName} {user?.lastName}</p>
                      <p className="text-sm text-white/70">{user?.email}</p>
                    </div>
                    <div className="mt-4 flex gap-3">
                      <div className="bg-white/10 backdrop-blur-sm rounded-xl px-3 py-2">
                        <p className="text-xs text-white/60">Saldo</p>
                        <p className="font-semibold text-white">₲ 8,545,000</p>
                      </div>
                      <div className="bg-white/10 backdrop-blur-sm rounded-xl px-3 py-2">
                        <p className="text-xs text-white/60">Puntos</p>
                        <p className="font-semibold text-white">2,450</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="flex-1 overflow-y-auto py-4">
                  {menuSections.map((section, sectionIndex) => (
                    <div key={section.title} className="px-4 mb-4">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 px-3">
                        {section.title}
                      </p>
                      <nav className="space-y-0.5">
                        {section.items.map((item) => {
                          const active = isActive(item.href);
                          return (
                            <button
                              key={item.label}
                              onClick={() => {
                                if (item.action === 'qr') {
                                  setShowQR(true);
                                } else {
                                  navigate(item.href);
                                }
                                setMenuOpen(false);
                              }}
                              className={cn(
                                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left',
                                active
                                  ? 'bg-primary/10 text-primary'
                                  : 'hover:bg-muted text-foreground',
                                item.premium && 'text-violet-600 dark:text-violet-400'
                              )}
                            >
                              <item.icon className={cn(
                                'w-5 h-5',
                                active && 'stroke-[2.5px]',
                                item.premium && 'text-violet-500'
                              )} />
                              <span className="font-medium flex-1">{item.label}</span>
                              {item.premium && (
                                <Sparkles className="w-4 h-4 text-violet-500" />
                              )}
                              {active && <ChevronRight className="w-4 h-4 opacity-50" />}
                            </button>
                          );
                        })}
                      </nav>
                      {sectionIndex < menuSections.length - 1 && (
                        <Separator className="mt-4" />
                      )}
                    </div>
                  ))}
                </div>

                {/* Logout */}
                <div className="p-4 border-t border-border">
                  <Button
                    variant="ghost"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 transition-colors justify-start"
                  >
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium">Cerrar sesión</span>
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          {/* Center - Logo */}
          <Link to="/app">
            <BrandLogo size="sm" showText={true} />
          </Link>

          {/* Right - Actions */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="w-9 h-9 rounded-full"
              onClick={() => navigate('/app/tienda')}
            >
              <Search className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="w-9 h-9 rounded-full relative"
              onClick={() => navigate('/app/notificaciones')}
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center"
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </motion.span>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <BottomNav onQRClick={() => setShowQR(true)} />

      {/* QR Payment Modal */}
      <QRPayment
        isOpen={showQR}
        onClose={() => setShowQR(false)}
        userId={user?.id || 'guest'}
        userName={`${user?.firstName || 'Usuario'} ${user?.lastName || ''}`}
      />

      {/* Push Notification Permission Prompt */}
      <PushPermissionPrompt />
    </div>
  );
}
