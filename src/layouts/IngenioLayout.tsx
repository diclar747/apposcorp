import { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Target, User, BookOpen, Wallet, PieChart, LogOut, Sun, Moon, FileText, ChevronRight
} from "lucide-react";
import { useAuthStore, useThemeStore } from "@/stores";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn, getInitials } from "@/lib/utils";

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { toast } from 'sonner';
import { RoleSelector } from "@/components/shared/RoleSelector";
import { NotificationDropdown } from "@/components/shared/NotificationDropdown";
import { IngenioBottomNav, type IngenioNavItem } from "@/components/ingenio/IngenioBottomNav";

const menuItems: (IngenioNavItem & { label: string })[] = [
  { icon: Target, label: "Finanzas Master", short: "Finanzas", href: "/ingenio" },
  { icon: PieChart, label: "Presupuesto", short: "Presupuesto", href: "/ingenio/presupuesto" },
  { icon: FileText, label: "Reportes", short: "Reportes", href: "/ingenio/reportes" },
  { icon: BookOpen, label: "Academia", short: "Academia", href: "/ingenio/academia" },
  { icon: User, label: "Perfil", short: "Perfil", href: "/ingenio/profile" },
];

export default function IngenioLayout() {
  const [showOscorpAlert, setShowOscorpAlert] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, hasRole, addRole, isLoading, setActiveRole } = useAuthStore();
  const { resolvedTheme, toggleTheme } = useThemeStore();

  const canUseOscorpWallet = hasRole(['client']) || hasRole(['seller']) || hasRole(['superadmin']);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleOscorpWallet = () => {
    setAccountOpen(false);
    if (hasRole(['client'])) {
      setActiveRole('client');
      navigate("/app/wallet");
    } else {
      setShowOscorpAlert(true);
    }
  };

  const handleRegisterOscorp = async () => {
    const success = await addRole('client');
    if (success) {
      toast.success('¡Registro exitoso! Tu Billetera Oscorp ha sido activada.');
      setShowOscorpAlert(false);
      setActiveRole('client');
      navigate("/app");
    }
  };

  const isActive = (href: string) =>
    href === '/ingenio' ? location.pathname === '/ingenio' : location.pathname.startsWith(href);

  return (
    <div className="min-h-screen-safe bg-slate-50 dark:bg-slate-950 flex flex-col md:flex-row font-sans">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:sticky md:top-0 md:h-screen w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex-col shrink-0">
        <div className="p-5 flex items-center gap-3 border-b border-slate-200 dark:border-slate-800">
          <img src="/icons/icon-192x192.png" alt="Oscorp" className="w-10 h-10 rounded-xl object-cover shadow-lg shadow-indigo-200 dark:shadow-none" />
          <div>
            <h1 className="font-bold text-xl text-slate-900 dark:text-white leading-none tracking-tight">Ingenio</h1>
            <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold tracking-widest uppercase mt-0.5">Millonario</p>
          </div>
        </div>

        <div className="flex-1 px-4 py-4 overflow-y-auto space-y-1">
          <p className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Principal</p>
          {menuItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                isActive(item.href)
                  ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              <item.icon className={cn("w-5 h-5", isActive(item.href) ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300")} />
              <span className="font-medium text-sm">{item.label}</span>
            </Link>
          ))}

          {canUseOscorpWallet && (
            <button
              onClick={handleOscorpWallet}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white"
            >
              <Wallet className="w-5 h-5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300" />
              <span className="font-medium text-sm flex-1 text-left">Billetera Oscorp</span>
            </button>
          )}
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3 px-4 py-3 mb-2 rounded-xl text-slate-600 dark:text-slate-400">
            <Avatar className="w-9 h-9 border border-indigo-100 dark:border-indigo-900/50">
              <AvatarImage src={user?.avatar} />
              <AvatarFallback className="bg-indigo-600 text-white text-xs font-bold">
                {user ? getInitials(user.firstName, user.lastName || '') : 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{user?.firstName}</p>
              <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Estudiante</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium text-sm">Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden sticky top-0 z-30 pt-safe bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl border-b border-slate-200/70 dark:border-slate-800">
        <div className="flex items-center justify-between px-4 h-14">
          <Link to="/ingenio" className="flex items-center gap-2">
            <img src="/icons/icon-192x192.png" alt="Oscorp" className="w-8 h-8 rounded-lg object-cover" />
            <span className="font-bold text-lg text-slate-900 dark:text-white tracking-tight">Ingenio</span>
          </Link>
          <div className="flex items-center gap-0.5">
            <button
              onClick={toggleTheme}
              className="p-2 text-slate-500 dark:text-slate-400 active:scale-90 transition-transform"
              title={resolvedTheme === 'light' ? 'Modo oscuro' : 'Modo claro'}
            >
              {resolvedTheme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>
            <NotificationDropdown />
            <button onClick={() => setAccountOpen(true)} className="pl-1 active:scale-90 transition-transform" title="Cuenta">
              <Avatar className="w-8 h-8 border border-indigo-100 dark:border-indigo-900/50">
                <AvatarImage src={user?.avatar} />
                <AvatarFallback className="bg-indigo-600 text-white text-[11px] font-bold">
                  {user ? getInitials(user.firstName, user.lastName || '') : 'U'}
                </AvatarFallback>
              </Avatar>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Desktop Header */}
        <header className="hidden md:flex items-center justify-end px-8 py-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50 z-10 sticky top-0 gap-2">
          <RoleSelector />
          <button
            onClick={toggleTheme}
            className="text-slate-400 hover:text-indigo-600 transition-colors p-2"
            title={resolvedTheme === 'light' ? 'Modo Oscuro' : 'Modo Claro'}
          >
            {resolvedTheme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </button>
          <Link to="/ingenio/profile" className="text-slate-400 hover:text-indigo-600 transition-colors p-2" title="Mi Perfil">
            <User className="w-5 h-5" />
          </Link>
          <NotificationDropdown />
        </header>

        <div className="flex-1 p-4 sm:p-6 md:p-8 pb-navbar md:pb-10">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </div>
      </main>

      {/* Mobile Bottom Tab Bar */}
      <IngenioBottomNav items={menuItems} />

      {/* Account Sheet (mobile) */}
      <Sheet open={accountOpen} onOpenChange={setAccountOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl border-none p-0 pb-safe">
          <SheetHeader className="px-5 pt-5 pb-3 text-left">
            <SheetTitle className="sr-only">Cuenta</SheetTitle>
            <div className="flex items-center gap-3">
              <Avatar className="w-12 h-12 border border-indigo-100 dark:border-indigo-900/50">
                <AvatarImage src={user?.avatar} />
                <AvatarFallback className="bg-indigo-600 text-white text-sm font-bold">
                  {user ? getInitials(user.firstName, user.lastName || '') : 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-base font-bold text-slate-900 dark:text-white truncate">{user?.firstName} {user?.lastName}</p>
                <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">Estudiante</p>
              </div>
            </div>
          </SheetHeader>

          <div className="px-5 pb-5 space-y-2">
            <div className="flex items-center justify-between gap-3 py-2">
              <span className="text-sm font-medium text-slate-500">Cambiar rol</span>
              <RoleSelector />
            </div>

            <button
              onClick={() => { setAccountOpen(false); navigate('/ingenio/profile'); }}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 active:scale-[0.98] transition-transform"
            >
              <User className="w-5 h-5 text-slate-400" />
              <span className="font-semibold text-sm flex-1 text-left">Mi Perfil</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>

            {canUseOscorpWallet && (
              <button
                onClick={handleOscorpWallet}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 active:scale-[0.98] transition-transform"
              >
                <Wallet className="w-5 h-5 text-slate-400" />
                <span className="font-semibold text-sm flex-1 text-left">Billetera Oscorp</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            )}

            <button
              onClick={() => { toggleTheme(); }}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 active:scale-[0.98] transition-transform"
            >
              {resolvedTheme === 'light' ? <Moon className="w-5 h-5 text-slate-400" /> : <Sun className="w-5 h-5 text-slate-400" />}
              <span className="font-semibold text-sm flex-1 text-left">{resolvedTheme === 'light' ? 'Modo oscuro' : 'Modo claro'}</span>
            </button>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-red-600 bg-red-50 dark:bg-red-500/10 active:scale-[0.98] transition-transform"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-semibold text-sm flex-1 text-left">Cerrar Sesión</span>
            </button>
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={showOscorpAlert} onOpenChange={setShowOscorpAlert}>
        <AlertDialogContent className="w-[calc(100%-2rem)] sm:w-full mx-auto rounded-xl sm:rounded-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Habilita tu Billetera Oscorp</AlertDialogTitle>
            <AlertDialogDescription>
              Aún no tienes una billetera activa.
              <br /><br />
              Regístrate gratis como Usuario Normal de Oscorp para activar tu billetera y aprovechar todos sus beneficios.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); handleRegisterOscorp(); }} disabled={isLoading}>
              {isLoading ? 'Activando...' : 'Sí, crear Billetera'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
