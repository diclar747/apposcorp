import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  LayoutDashboard,
  Store,
  Users,
  Package,
  ShoppingCart,
  Wallet,
  CreditCard,
  BookOpen,
  FileText,
  Settings,
  Bell,
  User,
  LogOut,
  Menu,
  X,
  ChevronDown,
  TrendingUp,
  DollarSign,
  Send,
  Sun,
  Moon,
  Sparkles
} from 'lucide-react';
import { useAuthStore } from '@/stores';
import { useThemeStore } from '@/stores/themeStore';
import { cn, getInitials } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

const sidebarItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/admin' },
  { icon: Store, label: 'Tiendas', href: '/admin/tiendas' },
  { icon: Users, label: 'Usuarios', href: '/admin/usuarios' },
  { icon: Package, label: 'Productos', href: '/admin/productos' },
  { icon: ShoppingCart, label: 'Pedidos', href: '/admin/pedidos' },
  { icon: TrendingUp, label: 'Finanzas', href: '/admin/finanzas' },
  { icon: Wallet, label: 'Transacciones', href: '/admin/transacciones' },
  { icon: DollarSign, label: 'Retiros', href: '/admin/retiros' },
  { icon: CreditCard, label: 'Créditos', href: '/admin/creditos' },
  { icon: FileText, label: 'Reportes', href: '/admin/reportes' },
  { icon: Sparkles, label: 'Ingenio Millonario', href: '/admin/ingenio' },
  { icon: ShieldCheck, label: 'Suscripciones Ingenio', href: '/admin/ingenio/suscripciones' },
  { icon: BookOpen, label: 'Materiales Ingenio', href: '/admin/ingenio/materiales' },
  { icon: Send, label: 'Campañas', href: '/admin/campanas' },
  { icon: ShieldCheck, label: 'Planes', href: '/admin/planes' },
  { icon: Settings, label: 'Configuración', href: '/admin/configuracion' },
];

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex transition-colors duration-300">
      {/* Sidebar Desktop */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 260 : 72 }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        className={cn(
          'fixed left-0 top-0 h-full bg-slate-900 dark:bg-slate-900 border-r border-slate-800 text-white z-40',
          'hidden lg:flex flex-col shadow-xl'
        )}
      >
        {/* Logo */}
        <div className="h-28 flex flex-col items-center justify-center border-b border-slate-800 px-4">
          <Link to="/admin" className="flex flex-col items-center gap-2 group">
            <motion.div
              layout
              className="relative flex items-center justify-center"
            >
              <img
                src={sidebarOpen ? "/oscorp-logo.png" : "/images/oscorp-round.png"}
                alt="Oscorp"
                className={cn(
                  "transition-all duration-300 object-contain",
                  sidebarOpen ? "h-14 w-auto" : "h-10 w-10"
                )}
              />
            </motion.div>
            {sidebarOpen && (
              <motion.span
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] text-center"
              >
                Panel Admin
              </motion.span>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {sidebarItems.map((item) => {
            const isActive = location.pathname === item.href ||
              (item.href !== '/admin' && location.pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                  'hover:bg-slate-800 group',
                  isActive ? 'bg-blue-600 text-white' : 'text-slate-400'
                )}
              >
                <item.icon className={cn(
                  'w-5 h-5 flex-shrink-0',
                  isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'
                )} />
                <AnimatePresence>
                  {sidebarOpen && (
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="text-sm font-medium whitespace-nowrap"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
                {isActive && sidebarOpen && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="ml-auto w-1.5 h-1.5 rounded-full bg-white"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Toggle Button */}
        <div className="p-3 border-t border-slate-800">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <motion.div
              animate={{ rotate: sidebarOpen ? 0 : 180 }}
              transition={{ duration: 0.2 }}
            >
              <Menu className="w-5 h-5 text-slate-400" />
            </motion.div>
          </button>
        </div>
      </motion.aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 h-full w-72 bg-slate-900 text-white z-50 lg:hidden"
            >
              <div className="h-20 flex items-center justify-between px-4 border-b border-slate-800">
                <Link to="/admin" className="flex items-center gap-3">
                  <img src="/oscorp-logo.png" alt="Oscorp" className="h-10 w-auto object-contain" />
                  <div className="flex flex-col text-left">
                    <span className="font-black text-white text-lg tracking-tighter uppercase leading-none">Oscorp</span>
                    <span className="text-[9px] text-slate-400 uppercase tracking-widest font-bold mt-1">Panel Admin</span>
                  </div>
                </Link>
                <button onClick={() => setMobileMenuOpen(false)}>
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>
              <nav className="p-4 space-y-1">
                {sidebarItems.map((item) => {
                  const isActive = location.pathname === item.href ||
                    (item.href !== '/admin' && location.pathname.startsWith(item.href));
                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        'flex items-center gap-3 px-3 py-3 rounded-lg transition-colors',
                        isActive ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'
                      )}
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="text-sm font-medium">{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className={cn(
        'flex-1 flex flex-col min-h-screen transition-all duration-250 w-full',
        'lg:ml-[260px]',
        !sidebarOpen && 'lg:ml-[72px]'
      )}>
        {/* Header */}
        <header className="h-16 bg-white dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-200 dark:border-slate-800 sticky top-0 z-30 transition-colors duration-300">
          <div className="h-full px-4 flex items-center justify-between">
            {/* Left */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg text-gray-600 dark:text-gray-300"
              >
                <Menu className="w-5 h-5" />
              </button>
              <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-100 hidden sm:block">
                Panel de Administración
              </h1>
            </div>

            {/* Right */}
            <div className="flex items-center gap-3">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
              >
                {theme === 'dark' ? (
                  <Sun className="w-5 h-5 text-yellow-400" />
                ) : (
                  <Moon className="w-5 h-5 text-gray-600" />
                )}
              </button>

              {/* Notifications */}
              <button className="relative p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
              </button>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 px-2 hover:bg-gray-100 dark:hover:bg-slate-800">
                    <Avatar className="w-8 h-8 ring-2 ring-white dark:ring-slate-700">
                      <AvatarImage src={user?.avatar} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm">
                        {user ? getInitials(user.firstName, user.lastName) : 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden sm:block text-left">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                        {user?.firstName} {user?.lastName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Administrador</p>
                    </div>
                    <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400 hidden sm:block" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800">
                  <DropdownMenuLabel className="dark:text-white">Mi Cuenta</DropdownMenuLabel>
                  <DropdownMenuSeparator className="dark:bg-slate-800" />
                  <DropdownMenuItem onClick={() => navigate('/admin/perfil')} className="dark:text-gray-300 dark:focus:bg-slate-800 cursor-pointer">
                    <User className="w-4 h-4 mr-2" />
                    Perfil
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/admin/configuracion')} className="dark:text-gray-300 dark:focus:bg-slate-800 cursor-pointer">
                    <Settings className="w-4 h-4 mr-2" />
                    Configuración
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="dark:bg-slate-800" />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600 dark:text-red-400 dark:focus:bg-slate-800 cursor-pointer">
                    <LogOut className="w-4 h-4 mr-2" />
                    Cerrar Sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-3 sm:p-4 lg:p-6 overflow-x-hidden">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-full"
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
}
