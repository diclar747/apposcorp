import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User, Phone, MapPin, ArrowRight, Store, UserCircle, Check } from 'lucide-react';
import { useAuthStore, type RegisterData } from '@/stores';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const steps = [
  { id: 1, label: 'Datos personales' },
  { id: 2, label: 'Tipo de cuenta' },
  { id: 3, label: 'Confirmación' },
];

const accountTypes = [
  { id: 'client', label: 'Usuario', description: 'Accede a tu billetera digital, compra productos y realiza pagos', icon: UserCircle },
  { id: 'seller', label: 'Comerciante', description: 'Gestiona tu tienda, vende productos y accede al sistema comercial completo', icon: Store },
];

export default function RegisterPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Partial<RegisterData>>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    password: '',
    role: 'client',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const { register } = useAuthStore();

  const updateField = (field: keyof RegisterData, value: string) => {
    setFormData((prev: Partial<RegisterData>) => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
        toast.error('Por favor completa todos los campos obligatorios');
        return;
      }
      if (formData.password.length < 6) {
        toast.error('La contraseña debe tener al menos 6 caracteres');
        return;
      }
    }
    setCurrentStep(prev => Math.min(prev + 1, 3));
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    setIsLoading(true);

    const success = await register(formData as RegisterData);

    if (success) {
      toast.success('¡Cuenta creada exitosamente!');

      setTimeout(() => {
        const currentUser = useAuthStore.getState().user;
        if (currentUser?.role === 'seller') {
          navigate('/vendedor');
        } else {
          navigate('/app');
        }
      }, 1000);
    } else {
      toast.error('Error al crear la cuenta');
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
                      value={formData.firstName}
                      onChange={(e) => updateField('firstName', e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Apellido *</Label>
                  <Input
                    id="lastName"
                    placeholder="Pérez"
                    value={formData.lastName}
                    onChange={(e) => updateField('lastName', e.target.value)}
                  />
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
                    value={formData.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+595 981 123456"
                    value={formData.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
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
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => updateField('password', e.target.value)}
                    className="pl-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Mínimo 6 caracteres</p>
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
                    onClick={() => updateField('role', type.id as 'client' | 'seller')}
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
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">¡Todo listo!</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Revisa tus datos antes de crear tu cuenta
              </p>
              <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4 text-left space-y-2">
                <p className="text-gray-800 dark:text-gray-200"><span className="text-gray-500 dark:text-gray-400">Nombre:</span> {formData.firstName} {formData.lastName}</p>
                <p className="text-gray-800 dark:text-gray-200"><span className="text-gray-500 dark:text-gray-400">Email:</span> {formData.email}</p>
                <p className="text-gray-800 dark:text-gray-200"><span className="text-gray-500 dark:text-gray-400">Teléfono:</span> {formData.phone || 'No especificado'}</p>
                <p className="text-gray-800 dark:text-gray-200"><span className="text-gray-500 dark:text-gray-400">Tipo:</span> {formData.role === 'client' ? 'Usuario' : 'Comerciante'}</p>
              </div>
            </div>
          )}

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
                type="button"
                onClick={handleSubmit}
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
