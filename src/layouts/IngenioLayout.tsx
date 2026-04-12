import { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Target, User, BookOpen, Wallet, PieChart, Menu, X, LogOut, Bell, Sun, Moon, FileText
} from "lucide-react";
import { useAuthStore, useThemeStore } from "@/stores";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

const baseMenuItems = [
  { icon: Target, label: "Finanzas Master", href: "/ingenio" },
  { icon: PieChart, label: "Presupuesto", href: "/ingenio/presupuesto" },
  { icon: FileText, label: "Reportes", href: "/ingenio/reportes" },
  { icon: BookOpen, label: "Academia", href: "/ingenio/academia" },
  { icon: User, label: "Perfil", href: "/ingenio/profile" },
];

export default function IngenioLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showOscorpAlert, setShowOscorpAlert] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, hasRole, addRole, isLoading } = useAuthStore();
  const { resolvedTheme, toggleTheme } = useThemeStore();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleOscorpWallet = () => {
    if (hasRole(['client'])) {
      navigate("/app");
    } else {
      setShowOscorpAlert(true);
    }
  };

  const handleRegisterOscorp = async () => {
    const success = await addRole('client');
    if (success) {
      toast.success('¡Registro exitoso! Tu Billetera Oscorp ha sido activada.');
      setShowOscorpAlert(false);
      navigate("/app");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col md:flex-row font-sans">
      {/* Mobile Menu Button & Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white dark:bg-slate-900 border-b dark:border-slate-800">
        <Link to="/ingenio" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Target className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg text-slate-900 dark:text-white">Ingenio</span>
        </Link>
        <div className="flex items-center gap-2">
          <button 
            onClick={toggleTheme}
            className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
            title={resolvedTheme === 'light' ? 'Activar modo oscuro' : 'Activar modo claro'}
          >
            {resolvedTheme === 'light' ? <Moon className="w-6 h-6" /> : <Sun className="w-6 h-6" />}
          </button>
          <Link to="/ingenio/profile" className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white">
            <User className="w-6 h-6" />
          </Link>
          <button className="text-slate-500 hover:text-slate-900 dark:hover:text-white relative p-2">
            <Bell className="w-6 h-6" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2">
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Sidebar Navigation */}
      <AnimatePresence>
        {(isMobileMenuOpen || window.innerWidth >= 768) && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            className={`
              fixed md:sticky md:top-0 md:h-screen inset-y-0 left-0 z-50 w-64
              bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800
              flex flex-col transform md:transform-none transition-transform duration-300 ease-in-out
              ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
            `}
          >
            <div className="p-6 hidden md:flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-200 dark:shadow-none">
                <Target className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-xl text-slate-900 dark:text-white leading-none tracking-tight">Ingenio</h1>
                <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold tracking-widest uppercase mt-0.5">Millonario</p>
              </div>
            </div>

            <div className="flex-1 px-4 py-6 md:py-2 overflow-y-auto space-y-1">
              <p className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Principal</p>
              {baseMenuItems.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                      isActive
                        ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    <item.icon className={`w-5 h-5 ${isActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300"}`} />
                    <span className="font-medium text-sm">{item.label}</span>
                  </Link>
                );
              })}
              
              {(hasRole(['client']) || hasRole(['seller']) || hasRole(['superadmin'])) && (
                <button
                  onClick={handleOscorpWallet}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white"
                >
                  <Wallet className="w-5 h-5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300" />
                  <span className="font-medium text-sm flex-1 text-left">Billetera Oscorp</span>
                </button>
              )}
            </div>

            {/* Config & Logout */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
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
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Desktop Header */}
        <header className="hidden md:flex items-center justify-end px-8 py-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50 z-10 sticky top-0 gap-2">
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
          <button className="text-slate-400 hover:text-indigo-600 transition-colors relative p-2" title="Notificaciones">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
          </button>
        </header>

        {/* Dynamic Route Content */}
        <div className="flex-1 overflow-auto bg-slate-50/50 dark:bg-slate-950/50 p-4 md:p-8">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </div>
      </main>

      <AlertDialog open={showOscorpAlert} onOpenChange={setShowOscorpAlert}>
        <AlertDialogContent>
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
