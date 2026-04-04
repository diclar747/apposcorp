import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, ArrowRight, Store, User, Shield } from 'lucide-react';
import { useAuthStore } from '@/stores';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

const quickLogins = [
  { email: 'admin@oscorp.com', password: '123456', role: 'superadmin', label: 'Admin', icon: Shield, color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' },
  { email: 'seller1@oscorp.com', password: '123456', role: 'seller', label: 'Vendedor', icon: Store, color: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' },
  { email: 'client1@oscorp.com', password: '123456', role: 'client', label: 'Cliente', icon: User, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
];

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const { login, user } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    setIsLoading(true);

    const success = await login(email, password);

    if (success) {
      toast.success('¡Bienvenido de vuelta!');

      // Redirect based on role
      setTimeout(() => {
        const currentUser = useAuthStore.getState().user;
        if (currentUser?.role === 'superadmin') {
          navigate('/admin');
        } else if (currentUser?.role === 'seller') {
          navigate('/vendedor');
        } else {
          navigate('/app');
        }
      }, 500);
    } else {
      toast.error('Credenciales incorrectas');
    }

    setIsLoading(false);
  };

  const handleQuickLogin = async (email: string, password: string) => {
    setEmail(email);
    setPassword(password);

    setIsLoading(true);

    const success = await login(email, password);

    if (success) {
      toast.success('¡Bienvenido de vuelta!');

      setTimeout(() => {
        const currentUser = useAuthStore.getState().user;
        if (currentUser?.role === 'superadmin') {
          navigate('/admin');
        } else if (currentUser?.role === 'seller') {
          navigate('/vendedor');
        } else {
          navigate('/app');
        }
      }, 500);
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center p-4 transition-colors duration-300">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="inline-flex items-center justify-center mb-4"
          >
            <img
              src="/oscorp-logo.png"
              alt="Oscorp"
              className="w-48 h-20 object-contain drop-shadow-md"
            />
          </motion.div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Bienvenido a Oscorp</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Inicia sesión para continuar</p>
        </div>

        {/* Quick Logins */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-slate-800/60 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 p-4 mb-4"
        >
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 text-center">Acceso rápido para demo</p>
          <div className="grid grid-cols-3 gap-2">
            {quickLogins.map((login) => (
              <button
                key={login.email}
                onClick={() => handleQuickLogin(login.email, login.password)}
                disabled={isLoading}
                className={cn(
                  'flex flex-col items-center gap-1 p-2 rounded-lg transition-all hover:scale-105',
                  login.color
                )}
              >
                <login.icon className="w-5 h-5" />
                <span className="text-xs font-medium">{login.label}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Login Form */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-slate-800/60 rounded-2xl shadow-lg border border-gray-200 dark:border-slate-700 p-6"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                />
                <Label htmlFor="remember" className="text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
                  Recordarme
                </Label>
              </div>
              <Link to="/forgot-password" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Iniciar Sesión
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              ¿No tienes una cuenta?{' '}
              <Link to="/register" className="text-blue-600 dark:text-blue-400 font-medium hover:underline">
                Regístrate
              </Link>
            </p>
          </div>
        </motion.div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-500 dark:text-gray-500 mt-6">
          Al iniciar sesión, aceptas nuestros{' '}
          <Link to="/terms" className="text-blue-600 dark:text-blue-400 hover:underline">Términos de servicio</Link>
          {' '}y{' '}
          <Link to="/privacy" className="text-blue-600 dark:text-blue-400 hover:underline">Política de privacidad</Link>
        </p>
      </motion.div>
    </div>
  );
}
