import { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Target, User, BookOpen, Wallet, PieChart, Menu, X, LogOut, Bell
} from "lucide-react";
import { useAuthStore } from "@/stores";

const menuItems = [
  { icon: Target, label: "Finanzas Master", href: "/ingenio" },
  { icon: PieChart, label: "Presupuesto", href: "/ingenio/presupuesto" },
  { icon: BookOpen, label: "Academia", href: "/ingenio/academia" },
  { icon: Wallet, label: "Billetera", href: "/ingenio/wallet" },
];

export default function IngenioLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate("/login");
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
        <div className="flex items-center gap-4">
          <button className="text-slate-500 hover:text-slate-900 dark:hover:text-white relative">
            <Bell className="w-6 h-6" />
            <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
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
              fixed md:static inset-y-0 left-0 z-50 w-64
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
              {menuItems.map((item) => {
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
            </div>

            {/* Config & Logout */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3 px-4 py-3 mb-2 rounded-xl text-slate-600 dark:text-slate-400">
                <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{user?.firstName}</p>
                  <p className="text-xs text-slate-500 truncate">Estudiante</p>
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
        <header className="hidden md:flex items-center justify-end px-8 py-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50 z-10 sticky top-0">
          <button className="text-slate-400 hover:text-indigo-600 transition-colors relative p-2">
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
    </div>
  );
}
