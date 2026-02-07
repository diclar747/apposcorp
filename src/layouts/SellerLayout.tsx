import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Store,
  Package,
  ShoppingCart,
  TrendingUp,
  DollarSign,
  BarChart3,
  Settings,
  User,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Globe,
  Bell,
  Truck,
  FileText,
  Sun,
  Moon
} from 'lucide-react';
import { useAuthStore } from '@/stores';
import { useThemeStore } from '@/stores/themeStore';
import { cn, getInitials } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { BrandLogo } from '@/components/brand/BrandLogo';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const sidebarItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/vendedor' },
  { icon: ShoppingCart, label: 'Punto de Venta', href: '/vendedor/pos' },
  { icon: Store, label: 'Mi Tienda', href: '/vendedor/tienda' },
  { icon: Package, label: 'Productos', href: '/vendedor/productos' },
  { icon: Truck, label: 'Proveedores', href: '/vendedor/proveedores' },
  { icon: FileText, label: 'Compras', href: '/vendedor/compras' },
  { icon: ShoppingCart, label: 'Pedidos', href: '/vendedor/pedidos' },
  { icon: TrendingUp, label: 'Ventas', href: '/vendedor/ventas' },
  { icon: BarChart3, label: 'Reportes', href: '/vendedor/reportes' },
  { icon: Settings, label: 'Configuración', href: '/vendedor/configuracion' },
];

export default function SellerLayout() {
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

  const viewStore = () => {
    if (user?.sellerProfile?.storeSlug) {
      window.open(`/tienda/${user.sellerProfile.storeSlug}`, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex transition-colors duration-300">
      {/* Sidebar Desktop */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 260 : 72 }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        className={cn(
          'fixed left-0 top-0 h-full bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 z-40',
          'hidden lg:flex flex-col shadow-lg dark:shadow-none'
        )}
      >
        {/* Logo */}
        <div className="h-20 flex items-center px-6 border-b border-gray-100 dark:border-slate-800">
          <Link to="/vendedor">
            <BrandLogo
              variant="light"
              size="lg"
              showText={sidebarOpen}
              subtitle="Panel Vendedor"
              className="py-1"
            />
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {sidebarItems.map((item) => {
            const isActive = location.pathname === item.href ||
              (item.href !== '/vendedor' && location.pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                  'hover:bg-gray-100 dark:hover:bg-slate-800 group',
                  isActive
                    ? 'bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400'
                    : 'text-gray-600 dark:text-gray-400'
                )}
              >
                <item.icon className={cn(
                  'w-5 h-5 flex-shrink-0',
                  isActive ? 'text-green-600' : 'text-gray-400 group-hover:text-gray-600'
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
              </Link>
            );
          })}
        </nav>

        {/* Toggle Button */}
        <div className="p-3 border-t border-gray-200 dark:border-slate-800">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
          >
            <motion.div
              animate={{ rotate: sidebarOpen ? 0 : 180 }}
              transition={{ duration: 0.2 }}
            >
              <Menu className="w-5 h-5 text-gray-400" />
            </motion.div>
          </button>
        </div>
      </motion.aside>

      {/* Mobile Sidebar */}
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
              className="fixed left-0 top-0 h-full w-72 bg-white dark:bg-slate-900 z-50 lg:hidden"
            >
              <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-slate-800">
                <Link to="/vendedor" className="flex items-center gap-3">
                  <img src="/oscorp-logo.png" alt="Oscorp" className="w-10 h-10 object-contain rounded-xl" />
                  <div>
                    <span className="font-semibold text-gray-900 dark:text-white block">Oscorp</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Panel Vendedor</span>
                  </div>
                </Link>
                <button onClick={() => setMobileMenuOpen(false)}>
                  <X className="w-6 h-6 text-gray-400 dark:text-gray-500" />
                </button>
              </div>
              <nav className="p-4 space-y-1">
                {sidebarItems.map((item) => {
                  const isActive = location.pathname === item.href ||
                    (item.href !== '/vendedor' && location.pathname.startsWith(item.href));
                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        'flex items-center gap-3 px-3 py-3 rounded-lg transition-colors',
                        isActive ? 'bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-slate-800'
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
        'flex-1 flex flex-col min-h-screen transition-all duration-250',
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
                {user?.sellerProfile?.storeName || 'Mi Tienda'}
              </h1>
            </div>

            {/* Right */}
            <div className="flex items-center gap-3">
              {/* View Store */}
              <Button
                variant="outline"
                size="sm"
                onClick={viewStore}
                className="hidden sm:flex items-center gap-2 dark:border-slate-700 dark:text-gray-300 dark:hover:bg-slate-800"
              >
                <Globe className="w-4 h-4" />
                Ver Tienda
              </Button>

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
                      <AvatarFallback className="bg-gradient-to-br from-green-500 to-emerald-600 text-white text-sm">
                        {user ? getInitials(user.firstName, user.lastName) : 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden sm:block text-left">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                        {user?.firstName} {user?.lastName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Vendedor</p>
                    </div>
                    <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400 hidden sm:block" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800">
                  <DropdownMenuLabel className="dark:text-white">Mi Cuenta</DropdownMenuLabel>
                  <DropdownMenuSeparator className="dark:bg-slate-800" />
                  <DropdownMenuItem onClick={() => navigate('/vendedor/perfil')} className="dark:text-gray-300 dark:focus:bg-slate-800 cursor-pointer">
                    <User className="w-4 h-4 mr-2" />
                    Perfil
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/vendedor/configuracion')} className="dark:text-gray-300 dark:focus:bg-slate-800 cursor-pointer">
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
        <main className="flex-1 p-4 lg:p-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
}
