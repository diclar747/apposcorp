import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User, Phone, ArrowRight, Store, UserCircle, Check, BookOpen } from 'lucide-react';
import { useAuthStore, useSettingsStore, type RegisterData } from '@/stores';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { authApi } from '@/lib/api';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { GoogleSignInButton } from '@/components/shared/GoogleSignInButton';

const registerSchema = z.object({
  firstName: z.string().min(2, 'Debe tener al menos 2 caracteres'),
  lastName: z.string().min(2, 'Debe tener al menos 2 caracteres'),
  email: z.string().email('Formato de email inválido'),
  phone: z.string().optional(),
  password: z.string()
    .min(8, 'Debe tener al menos 8 caracteres')
    .regex(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]/, 'Debe incluir al menos una letra y un número'),
  confirmPassword: z.string().min(1, 'Debes confirmar tu contraseña'),
  role: z.enum(['client', 'seller', 'ingenio']),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

const steps = [
  { id: 1, label: 'Datos personales' },
  { id: 2, label: 'Tipo de cuenta' },
  { id: 3, label: 'Confirmación' },
];

const accountTypes = [
  { id: 'client', label: 'Usuarios', description: 'Accede a tu billetera digital, compra productos y realiza pagos', icon: UserCircle },
  { id: 'seller', label: 'Comerciante', description: 'Gestiona tu tienda, vende productos y accede al sistema comercial completo', icon: Store },
  { id: 'ingenio', label: 'Ingenio Millonario', description: 'Entorno de estudio diseñado para tu crecimiento financiero', icon: BookOpen },
];

export default function RegisterPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [registeredToken, setRegisteredToken] = useState<string | null>(null);
  const [googleRole, setGoogleRole] = useState<'client' | 'seller' | 'ingenio'>('client');

  const navigate = useNavigate();
  const { register: authRegister } = useAuthStore();
  const { settings } = useSettingsStore();

  const { register, handleSubmit, trigger, watch, setValue, formState: { errors } } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      role: 'client',
    },
    mode: 'onTouched'
  });

  const formData = watch();

  const handleNext = async () => {
    if (currentStep === 1) {
      const isValid = await trigger(['firstName', 'lastName', 'email', 'password', 'confirmPassword', 'phone']);
      if (!isValid) {
        toast.error('Revisa los alertas en rojo antes de continuar');
        return;
      }
    }
    setCurrentStep(prev => Math.min(prev + 1, 3));
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleGoogleSuccess = () => {
    toast.success('¡Cuenta creada con Google!');
    setTimeout(() => {
      const currentUser = useAuthStore.getState().user;
      if (currentUser?.roles.includes('seller')) {
        navigate('/vendedor');
      } else if (currentUser?.roles.includes('ingenio')) {
        navigate('/ingenio');
      } else {
        navigate('/app');
      }
    }, 300);
  };

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);

    const { confirmPassword, ...registerData } = data;

    const response = await authRegister({
      ...registerData,
      roles: [data.role],
      initialInterface: data.role === 'ingenio' ? 'INGENIO' : 'OSCORP',
      address: '',
      city: ''
    } as RegisterData);

    if (response) {
      if (response.demoToken) {
        setRegisteredToken(response.demoToken);
        toast.info(
          "¡Atención (Modo Demo)! Tu token de verificación es: " + response.demoToken,
          {
            duration: 15000,
            action: {
              label: "Verificar ahora",
              onClick: () => navigate(`/login?verify=${response.demoToken}`)
            },
          }
        );
      } else {
        toast.success('¡Registro exitoso! Revisa tu bandeja de entrada o spam para verificar tu correo.', {
          duration: 10000,
          action: {
            label: 'Reenviar correo',
            onClick: () => {
              authApi.resendVerification(registerData.email)
                .then(() => toast.success('Correo de verificación reenviado'))
                .catch(() => toast.error('Error al reenviar el correo'));
            }
          }
        });

        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    } else {
      const authError = useAuthStore.getState().error;
      toast.error(authError || 'Error al intentar crear la cuenta.');
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center p-4 transition-colors duration-300">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg"
      >
        {/* Logo */}
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center justify-center mb-3">
            <img src="/oscorp-logo.png" alt="Oscorp" className="h-16 w-auto object-contain" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Crear cuenta</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Únete a Oscorp y comienza tu viaje</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
                  currentStep >= step.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-500 dark:bg-slate-700 dark:text-gray-400'
                )}
              >
                {currentStep > step.id ? <Check className="w-4 h-4" /> : step.id}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'w-12 h-0.5 mx-1',
                    currentStep > step.id ? 'bg-blue-600' : 'bg-gray-200 dark:bg-slate-700'
                  )}
                />
              )}
            </div>
          ))}
        </div>

        {/* Form Card */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="bg-white dark:bg-slate-800/60 rounded-2xl shadow-lg border border-gray-200 dark:border-slate-700 p-6"
        >
          {currentStep === 1 && !!settings.google_client_id && (
            <>
              <div className="space-y-2 mb-4">
                <Label className="text-xs text-gray-500 dark:text-gray-400">¿Cómo querés usar Oscorp?</Label>
                <div className="grid grid-cols-3 gap-2">
                  {accountTypes.map((type) => {
                    const Icon = type.icon;
                    const isSelected = googleRole === type.id;
                    return (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setGoogleRole(type.id as 'client' | 'seller' | 'ingenio')}
                        className={cn(
                          'flex flex-col items-center gap-1.5 rounded-xl border-2 px-2 py-3 text-center transition-colors',
                          isSelected
                            ? 'border-blue-600 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400'
                            : 'border-gray-200 dark:border-slate-700 text-gray-500 dark:text-gray-400 hover:border-gray-300'
                        )}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="text-[11px] font-medium leading-tight">{type.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <GoogleSignInButton onSuccess={handleGoogleSuccess} role={googleRole} />

              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-200 dark:border-slate-700" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white dark:bg-slate-800 px-3 text-gray-400 dark:text-gray-500 uppercase tracking-wider">o completá tus datos</span>
                </div>
              </div>
            </>
          )}

          <form
            id="register-form"
            onSubmit={handleSubmit(onSubmit)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (currentStep < 3) {
                  e.preventDefault();
                  handleNext();
                }
                // If currentStep === 3, the default form submission will trigger onSubmit
              }
            }}
          >
            {currentStep === 1 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Datos personales</h2>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Nombre *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                      <Input
                        id="firstName"
                        placeholder="Juan"
                        {...register('firstName')}
                        className={cn("pl-10", errors.firstName && "border-red-500 focus-visible:ring-red-500")}
                      />
                    </div>
                    {errors.firstName && <p className="text-xs text-red-500">{errors.firstName.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Apellido *</Label>
                    <Input
                      id="lastName"
                      placeholder="Pérez"
                      {...register('lastName')}
                      className={errors.lastName && "border-red-500 focus-visible:ring-red-500"}
                    />
                    {errors.lastName && <p className="text-xs text-red-500">{errors.lastName.message}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Correo electrónico *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="tu@email.com"
                      {...register('email')}
                      className={cn("pl-10", errors.email && "border-red-500 focus-visible:ring-red-500")}
                    />
                  </div>
                  {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+595 981 123456"
                      {...register('phone')}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Contraseña"
                      {...register('password')}
                      className={cn("pl-10 pr-10", errors.password && "border-red-500 focus-visible:ring-red-500")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.password 
                    ? <p className="text-xs text-red-500">{errors.password.message}</p>
                    : <p className="text-xs text-gray-500 dark:text-gray-400">Mínimo 8 caracteres (1 Letra y 1 Número)</p>
                  }
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Contraseña *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                    <Input
                      id="confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Repetir contraseña"
                      {...register('confirmPassword')}
                      className={cn("pl-10 pr-10", errors.confirmPassword && "border-red-500 focus-visible:ring-red-500")}
                    />
                  </div>
                  {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword.message}</p>}
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">¿Qué tipo de cuenta necesitas?</h2>

                <div className="space-y-3">
                  {accountTypes.map((type) => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setValue('role', type.id as 'client' | 'seller' | 'ingenio')}
                      className={cn(
                        'w-full p-4 rounded-xl border-2 text-left transition-all',
                        formData.role === type.id
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10'
                          : 'border-gray-200 hover:border-gray-300 dark:border-slate-600 dark:hover:border-slate-500'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          'w-10 h-10 rounded-lg flex items-center justify-center',
                          formData.role === type.id ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-gray-300'
                        )}>
                          <type.icon className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">{type.label}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{type.description}</p>
                        </div>
                        {formData.role === type.id && (
                          <Check className="w-5 h-5 text-blue-500 ml-auto" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
                  <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {registeredToken ? '¡Token de Demo Generado!' : '¡Todo listo!'}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  {registeredToken 
                    ? 'Copia tu token o haz clic abajo para verificar tu cuenta:' 
                    : 'Revisa tus datos antes de crear tu cuenta'}
                </p>

                {registeredToken ? (
                  <div className="space-y-3">
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl p-4">
                      <code className="text-blue-700 dark:text-blue-300 font-mono text-sm break-all">
                        {registeredToken}
                      </code>
                    </div>
                    <Button 
                      onClick={() => navigate(`/login?verify=${registeredToken}`)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Verificar cuenta ahora
                    </Button>
                  </div>
                ) : (
                  <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4 text-left space-y-2">
                    <p className="text-gray-800 dark:text-gray-200"><span className="text-gray-500 dark:text-gray-400">Nombre:</span> {formData.firstName} {formData.lastName}</p>
                    <p className="text-gray-800 dark:text-gray-200"><span className="text-gray-500 dark:text-gray-400">Email:</span> {formData.email}</p>
                    <p className="text-gray-800 dark:text-gray-200"><span className="text-gray-500 dark:text-gray-400">Teléfono:</span> {formData.phone || 'No especificado'}</p>
                    <p className="text-gray-800 dark:text-gray-200"><span className="text-gray-500 dark:text-gray-400">Tipo:</span> {formData.role === 'client' ? 'Usuario' : formData.role === 'seller' ? 'Comerciante' : 'Estudiante Ingenio'}</p>
                  </div>
                )}
              </div>
            )}
          </form>

          {/* Navigation Buttons */}
          <div className="flex gap-3 mt-6">
            {currentStep > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                className="flex-1"
              >
                Atrás
              </Button>
            )}
            {currentStep < 3 ? (
              <Button
                type="button"
                onClick={handleNext}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600"
              >
                Continuar
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                type="submit"
                form="register-form"
                disabled={isLoading}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Crear cuenta
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            )}
          </div>
        </motion.div>

        {/* Login Link */}
        <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-6">
          ¿Ya tienes una cuenta?{' '}
          <Link to="/login" className="text-blue-600 dark:text-blue-400 font-medium hover:underline">
            Inicia sesión
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
