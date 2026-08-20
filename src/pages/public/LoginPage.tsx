import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, ArrowRight, Store, User, Shield, BookOpen } from 'lucide-react';
import { useAuthStore, useSettingsStore } from '@/stores';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { authApi } from '@/lib/api';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { GoogleSignInButton } from '@/components/shared/GoogleSignInButton';

const loginSchema = z.object({
  email: z.string().email('Formato de email inválido'),
  password: z.string().min(1, 'La contraseña es obligatoria')
});

type LoginFormValues = z.infer<typeof loginSchema>;

const quickLogins = [
  { email: 'admin@oscorp.com', password: 'admin123', roles: ['superadmin'], label: 'Admin', icon: Shield, color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' },
  { email: 'vendedor1@oscorp.com', password: 'seller123', roles: ['seller'], label: 'Comerciante', icon: Store, color: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' },
  { email: 'cliente1@oscorp.com', password: 'client123', roles: ['client'], label: 'Usuarios', icon: User, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  { email: 'estudiante1@oscorp.com', password: 'student123', roles: ['ingenio'], label: 'Ingenio Millonario', icon: BookOpen, color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300' },
];

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [resendingVerification, setResendingVerification] = useState(false);

  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
   const { login } = useAuthStore();
   const { settings } = useSettingsStore();
  const hasVerified = useRef(false);

  const { register, handleSubmit, formState: { errors }, setValue } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' }
  });

  useEffect(() => {
    const verifyToken = searchParams.get('verify');
    if (verifyToken && !hasVerified.current) {
      hasVerified.current = true;
      const verifyAccount = async () => {
        try {
          const response = await fetch(`/api/auth/verify?token=${verifyToken}`);
          const data = await response.json();
          
          if (!response.ok) {
            throw new Error(data.error || 'Token inválido o expirado.');
          }
          
          toast.success('Cuenta verificada exitosamente. Ya puedes iniciar sesión.');
        } catch (error: any) {
          toast.error(error.message || 'Ocurrió un error en la verificación.');
        } finally {
          searchParams.delete('verify');
          setSearchParams(searchParams);
        }
      };

      verifyAccount();
    }
  }, [searchParams, setSearchParams]);

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    setUnverifiedEmail(null);

    const success = await login(data.email, data.password, rememberMe);

    if (success) {
      toast.success('¡Bienvenido de vuelta!');

      // Redirect based on role
      setTimeout(() => {
        const currentUser = useAuthStore.getState().user;
        if (currentUser?.roles.includes('superadmin')) {
          navigate('/admin');
        } else if (currentUser?.roles.includes('seller')) {
          navigate('/vendedor');
        } else if (currentUser?.roles.includes('client')) {
          navigate('/app');
        } else if (currentUser?.roles.includes('ingenio')) {
          navigate('/ingenio');
        } else {
          navigate('/app');
        }
      }, 500);
    } else {
      // Atrapar el error descriptivo que guardó Zustand al fallar la petición
      const authError = useAuthStore.getState().error;
      toast.error(authError || 'Credenciales incorrectas');
      if (authError?.toLowerCase().includes('no verificada')) {
        setUnverifiedEmail(data.email);
      }
    }

    setIsLoading(false);
  };

  const handleGoogleSuccess = () => {
    toast.success('¡Bienvenido!');
    setTimeout(() => {
      const currentUser = useAuthStore.getState().user;
      if (currentUser?.roles.includes('superadmin')) {
        navigate('/admin');
      } else if (currentUser?.roles.includes('seller')) {
        navigate('/vendedor');
      } else if (currentUser?.roles.includes('client')) {
        navigate('/app');
      } else if (currentUser?.roles.includes('ingenio')) {
        navigate('/ingenio');
      } else {
        navigate('/app');
      }
    }, 300);
  };

  const handleResendVerification = async () => {
    if (!unverifiedEmail) return;
    setResendingVerification(true);
    try {
      await authApi.resendVerification(unverifiedEmail);
      toast.success('Si tu correo está pendiente de verificación, te reenviamos el enlace.');
    } catch (error: any) {
      toast.error(error.message || 'Error al reenviar el correo de verificación');
    } finally {
      setResendingVerification(false);
    }
  };

  const handleQuickLogin = async (email: string, password: string) => {
    setValue('email', email);
    setValue('password', password);
    
    setIsLoading(true);
    const success = await login(email, password, rememberMe);

    if (success) {
      toast.success('¡Bienvenido de vuelta!');
      setTimeout(() => {
        const currentUser = useAuthStore.getState().user;
        if (currentUser?.roles.includes('superadmin')) {
          navigate('/admin');
        } else if (currentUser?.roles.includes('seller')) {
          navigate('/vendedor');
        } else if (currentUser?.roles.includes('client')) {
          navigate('/app');
        } else if (currentUser?.roles.includes('ingenio')) {
          navigate('/ingenio');
        } else {
          navigate('/app');
        }
      }, 500);
    } else {
      const authError = useAuthStore.getState().error;
      toast.error(authError || 'Error con el acceso rápido');
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



        {/* Login Form */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-slate-800/60 rounded-2xl shadow-lg border border-gray-200 dark:border-slate-700 p-6"
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  {...register('email')}
                  className={cn("pl-10", errors.email && "border-red-500 focus-visible:ring-red-500")}
                  disabled={isLoading}
                />
              </div>
              {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  {...register('password')}
                  className={cn("pl-10 pr-10", errors.password && "border-red-500 focus-visible:ring-red-500")}
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
              {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
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
              className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
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

            {!!settings.google_client_id && (
              <>
                <div className="relative my-1">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-200 dark:border-slate-700" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-white dark:bg-slate-800 px-3 text-gray-400 dark:text-gray-500 uppercase tracking-wider">o</span>
                  </div>
                </div>
                <div className="h-12 flex items-center [&>div]:w-full">
                  <GoogleSignInButton onSuccess={handleGoogleSuccess} remember={rememberMe} />
                </div>
              </>
            )}

            {unverifiedEmail && (
              <div className="text-center mt-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
                <p className="text-xs text-amber-700 dark:text-amber-400 mb-2">
                  Tu cuenta todavía no fue verificada. Revisá tu correo (incluida la carpeta de spam).
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs h-8"
                  disabled={resendingVerification}
                  onClick={handleResendVerification}
                >
                  {resendingVerification ? 'Enviando...' : 'Reenviar correo de verificación'}
                </Button>
              </div>
            )}
          </form>

          {settings.maintenance_mode !== 'true' && (
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                ¿No tienes una cuenta?{' '}
                <Link to="/register" className="text-blue-600 dark:text-blue-400 font-medium hover:underline">
                  Regístrate
                </Link>
              </p>
            </div>
          )}
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
