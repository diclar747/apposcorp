import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Home, 
  ArrowLeft, 
  Search, 
  AlertCircle,
  LayoutDashboard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores';

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, activeRole } = useAuthStore();

  const getDashboardPath = () => {
    switch (activeRole) {
      case 'superadmin': return '/admin';
      case 'seller': return '/vendedor';
      case 'ingenio': return '/ingenio';
      case 'client': return '/app';
      default: return '/';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-2xl w-full text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Animated 404 Icon */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ 
                  duration: 4, 
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="text-9xl font-black text-slate-200 dark:text-slate-800 select-none"
              >
                404
              </motion.div>
              <div className="absolute inset-0 flex items-center justify-center">
                <AlertCircle className="w-24 h-24 text-blue-600 dark:text-blue-500 drop-shadow-2xl" />
              </div>
            </div>
          </div>

          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
            Parece que te has perdido en el ecosistema
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-lg mb-10 max-w-md mx-auto">
            La página que buscas ha sido movida, eliminada o nunca existió. No te preocupes, ¡te ayudamos a volver!
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate(-1)}
              className="w-full sm:w-auto rounded-2xl gap-2 h-12 border-slate-200 dark:border-slate-800"
            >
              <ArrowLeft className="w-4 h-4" /> Volver atrás
            </Button>

            {isAuthenticated ? (
              <Button
                size="lg"
                asChild
                className="w-full sm:w-auto rounded-2xl gap-2 h-12 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20"
              >
                <Link to={getDashboardPath()}>
                  <LayoutDashboard className="w-4 h-4" /> Ir a mi Panel Principal
                </Link>
              </Button>
            ) : (
              <Button
                size="lg"
                asChild
                className="w-full sm:w-auto rounded-2xl gap-2 h-12 bg-slate-900 dark:bg-white dark:text-slate-900 shadow-lg"
              >
                <Link to="/login">
                  <Home className="w-4 h-4" /> Iniciar Sesión
                </Link>
              </Button>
            )}
          </div>

          <div className="mt-16 pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-wrap justify-center gap-8 opacity-60">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Search className="w-4 h-4" />
              <span>Verificar ortografía</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <AlertCircle className="w-4 h-4" />
              <span>Reportar error</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default NotFoundPage;
