import { useState, useEffect, useRef } from 'react';
import {
  Shield, Bell, Palette, Lock, Eye, EyeOff,
  Sun, Moon, Monitor, Check, AlertTriangle, KeyRound, AlertCircle
} from 'lucide-react';
import { useAuthStore } from '@/stores';
import { cn } from '@/lib/utils';
import { useThemeStore } from '@/stores/themeStore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { authApi, usersApi, walletApi } from '@/lib/api';
import { isPushSupported, isSubscribedToPush, subscribeToPush, unsubscribeFromPush } from '@/lib/pushNotifications';

// --- Security Tab ---
function SecuritySection() {
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwLoading, setPwLoading] = useState(false);

  // PIN state
  const [hasPin, setHasPin] = useState(false);
  const [pinLoading, setPinLoading] = useState(true);
  const [pinForm, setPinForm] = useState({ currentPin: '', newPin: '', confirmPin: '' });
  const [showPinForm, setShowPinForm] = useState(false);
  const [pinSaving, setPinSaving] = useState(false);

  useEffect(() => {
    walletApi.getPinStatus()
      .then((data: any) => setHasPin(data.hasPin))
      .catch(() => {})
      .finally(() => setPinLoading(false));
  }, []);

  const { changePassword } = useAuthStore();

  const handleChangePassword = async () => {
    if (!pwForm.currentPassword || !pwForm.newPassword || !pwForm.confirmPassword) {
      toast.error('Todos los campos son obligatorios');
      return;
    }

    // Requirements validation
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]/;
    if (pwForm.newPassword.length < 8 || !passwordRegex.test(pwForm.newPassword)) {
      toast.error('La nueva contraseña debe tener al menos 8 caracteres, incluir una letra y un número');
      return;
    }

    if (pwForm.newPassword === pwForm.currentPassword) {
      toast.error('La nueva contraseña no puede ser igual a la contraseña actual');
      return;
    }

    if (pwForm.newPassword !== pwForm.confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    setPwLoading(true);
    try {
      const success = await changePassword(pwForm.currentPassword, pwForm.newPassword);
      if (success) {
        toast.success('Contraseña actualizada correctamente');
        setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        const authError = useAuthStore.getState().error;
        toast.error(authError || 'Error al cambiar contraseña');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error al cambiar contraseña');
    } finally {
      setPwLoading(false);
    }
  };

  const handlePinAction = async () => {
    // This is now handled by the new Dialog flow
  };

  return (
    <div className="space-y-6">
      {/* Change Password */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <Lock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Cambiar Contraseña</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Actualiza tu contraseña de acceso</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Contraseña actual</Label>
              <div className="relative">
                <Input
                  type={showCurrentPw ? 'text' : 'password'}
                  value={pwForm.currentPassword}
                  onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                  placeholder="Ingresa tu contraseña actual"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowCurrentPw(!showCurrentPw)}
                >
                  {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Nueva contraseña</Label>
              <div className="relative">
                <Input
                  type={showNewPw ? 'text' : 'password'}
                  value={pwForm.newPassword}
                  onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
                  placeholder="Mínimo 8 caracteres"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowNewPw(!showNewPw)}
                >
                  {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Requirements Hints */}
              <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/10 flex items-start gap-3 mt-2">
                <AlertCircle className="w-3.5 h-3.5 text-amber-500 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-amber-500/80">Requisitos:</p>
                  <ul className="text-[9px] font-medium text-gray-500 space-y-1">
                    <li className="flex items-center gap-1.5">
                      <div className={cn("w-1 h-1 rounded-full", pwForm.newPassword.length >= 8 ? "bg-emerald-500" : "bg-gray-300")} />
                      Mínimo 8 caracteres
                    </li>
                    <li className="flex items-center gap-1.5">
                      <div className={cn("w-1 h-1 rounded-full", /[A-Za-z]/.test(pwForm.newPassword) ? "bg-emerald-500" : "bg-gray-300")} />
                      Al menos una letra
                    </li>
                    <li className="flex items-center gap-1.5">
                      <div className={cn("w-1 h-1 rounded-full", /\d/.test(pwForm.newPassword) ? "bg-emerald-500" : "bg-gray-300")} />
                      Al menos un número
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Confirmar nueva contraseña</Label>
              <div className="relative">
                <Input
                  type={showConfirmPw ? 'text' : 'password'}
                  value={pwForm.confirmPassword}
                  onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
                  placeholder="Repite la nueva contraseña"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowConfirmPw(!showConfirmPw)}
                >
                  {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              onClick={handleChangePassword}
              disabled={pwLoading || !pwForm.currentPassword || !pwForm.newPassword || !pwForm.confirmPassword}
              className="bg-gradient-to-r from-blue-600 to-purple-600"
            >
              {pwLoading ? 'Actualizando...' : 'Cambiar Contraseña'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transaction PIN */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <KeyRound className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">PIN de Transacción</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {pinLoading ? 'Cargando...' : hasPin ? 'PIN configurado' : 'Sin PIN configurado'}
                </p>
              </div>
            </div>
            {!pinLoading && (
              <div className="flex items-center gap-2">
                {hasPin && (
                  <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-1 rounded-full flex items-center gap-1">
                    <Check className="w-3 h-3" /> Activo
                  </span>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPinForm(!showPinForm)}
                >
                  {showPinForm ? 'Cancelar' : hasPin ? 'Cambiar PIN' : 'Configurar PIN'}
                </Button>
              </div>
            )}
          </div>

          {showPinForm && (
            <PinManagementDialog 
              isOpen={showPinForm} 
              onClose={() => setShowPinForm(false)} 
              hasPin={hasPin}
              onSuccess={() => {
                setHasPin(true);
                setShowPinForm(false);
              }}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// --- PIN Components ---

function PinInput({ value, onChange, length = 4, disabled = false }: { value: string, onChange: (val: string) => void, length?: number, disabled?: boolean }) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const newVal = e.target.value.replace(/\D/g, '');
    if (!newVal && e.target.value !== '') return;

    const currentPin = value.split('');
    currentPin[index] = newVal.slice(-1);
    const updatedValue = currentPin.join('');
    onChange(updatedValue);

    if (newVal && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <div className="flex justify-center gap-3">
      {Array.from({ length }).map((_, i) => (
        <div key={i} className="relative">
          <input
            ref={el => { inputRefs.current[i] = el; }}
            type="password"
            inputMode="numeric"
            maxLength={1}
            value={value[i] || ''}
            onChange={(e) => handleChange(e, i)}
            onKeyDown={(e) => handleKeyDown(e, i)}
            disabled={disabled}
            className={cn(
              "w-12 h-14 text-center text-2xl font-black rounded-2xl border-2 transition-all outline-none",
              value[i] 
                ? "bg-blue-500/10 border-blue-500 text-blue-600" 
                : "bg-gray-50 dark:bg-slate-800 border-gray-100 dark:border-slate-800 focus:border-blue-400 dark:focus:border-blue-500"
            )}
          />
          {!value[i] && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
              <div className="w-1.5 h-1.5 rounded-full bg-foreground" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function PinManagementDialog({ isOpen, onClose, hasPin, onSuccess }: { isOpen: boolean, onClose: () => void, hasPin: boolean, onSuccess: () => void }) {
  const [step, setStep] = useState<'current' | 'new' | 'confirm'>(hasPin ? 'current' : 'new');
  const [pins, setPins] = useState({ current: '', new: '', confirm: '' });
  const [loading, setLoading] = useState(false);

  const handleAction = async () => {
    if (step === 'current') {
      if (pins.current.length === 4) setStep('new');
      else toast.error('Ingresa tu PIN actual');
      return;
    }

    if (step === 'new') {
      if (pins.new.length === 4) setStep('confirm');
      else toast.error('Ingresa el nuevo PIN');
      return;
    }

    if (step === 'confirm') {
      if (pins.new !== pins.confirm) {
        toast.error('Los PINs no coinciden');
        setPins({ ...pins, confirm: '' });
        return;
      }

      setLoading(true);
      try {
        if (hasPin) {
          await walletApi.changePin(pins.current, pins.new);
          toast.success('PIN actualizado correctamente');
        } else {
          await walletApi.setPin(pins.new);
          toast.success('PIN configurado correctamente');
        }
        onSuccess();
      } catch (err: any) {
        toast.error(err.message || 'Error al procesar PIN');
      } finally {
        setLoading(false);
      }
    }
  };

  const currentPinLength = step === 'current' ? pins.current.length : step === 'new' ? pins.new.length : pins.confirm.length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[400px] rounded-[2.5rem] p-8 border-none dark:bg-slate-900 shadow-3xl">
        <div className="text-center space-y-6">
          <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-3xl flex items-center justify-center">
            <KeyRound className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-2xl font-black tracking-tight">
              {step === 'current' ? 'Verificar PIN' : step === 'new' ? (hasPin ? 'Nuevo PIN' : 'Configurar PIN') : 'Confirmar PIN'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {step === 'current' ? 'Por favor ingresa tu PIN de seguridad actual' : step === 'new' ? 'Ingresa los 4 dígitos para tu PIN de transacción' : 'Vuelve a ingresar el PIN para confirmar'}
            </p>
          </div>

          <div className="py-2">
            <PinInput 
              value={step === 'current' ? pins.current : step === 'new' ? pins.new : pins.confirm}
              onChange={(val) => setPins({ ...pins, [step]: val })}
              disabled={loading}
            />
          </div>

          <div className="flex flex-col gap-3 pt-4">
            <Button 
              className="h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-100 dark:shadow-none transition-all active:scale-95"
              disabled={currentPinLength < 4 || loading}
              onClick={handleAction}
            >
              {loading ? 'Procesando...' : step === 'confirm' ? 'FINALIZAR' : 'CONTINUAR'}
            </Button>
            {step === 'confirm' && (
              <Button variant="ghost" className="font-bold text-gray-400" onClick={() => setStep('new')}>
                Volver a empezar
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// --- Notifications Tab ---
function NotificationsSection() {
  const [prefs, setPrefs] = useState({
    pushNotifications: true,
    emailNotifications: true,
    orderAlerts: true,
    lowStockAlerts: true,
    promotionAlerts: false,
    securityAlerts: true,
    newReviewAlerts: true,
    weeklyReport: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pushSupported] = useState(isPushSupported());

  useEffect(() => {
    const init = async () => {
      try {
        const data = await usersApi.getPreferences();
        
        // Sync push status if supported
        if (pushSupported) {
          const isSubscribed = await isSubscribedToPush();
          setPrefs({ ...data, pushNotifications: isSubscribed });
        } else {
          setPrefs(data);
        }
      } catch (err) {
        console.error('Error loading preferences:', err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [pushSupported]);

  const handleToggle = async (key: string, value: boolean) => {
    setSaving(true);
    
    // Special case for Push Notifications (Browser Integration)
    if (key === 'pushNotifications' && pushSupported) {
      try {
        if (value) {
          const success = await subscribeToPush();
          if (!success) {
            toast.error('No se pudo activar las notificaciones en este navegador');
            setSaving(false);
            return;
          }
        } else {
          await unsubscribeFromPush();
        }
      } catch (err) {
        toast.error('Error al configurar notificaciones en el navegador');
        setSaving(false);
        return;
      }
    }

    const newPrefs = { ...prefs, [key]: value };
    const oldPrefs = { ...prefs };
    setPrefs(newPrefs);

    try {
      await usersApi.updatePreferences(newPrefs);
      toast.success('Preferencia actualizada');
    } catch {
      setPrefs(oldPrefs); // revert
      toast.error('Error al guardar preferencia en el servidor');
    } finally {
      setSaving(false);
    }
  };

  const notifItems = [
    { key: 'pushNotifications', label: 'Notificaciones push', desc: 'Recibir notificaciones en el navegador', icon: Bell },
    { key: 'emailNotifications', label: 'Notificaciones por email', desc: 'Recibir resúmenes y alertas por correo', icon: Bell },
  ];

  const alertItems = [
    { key: 'orderAlerts', label: 'Alertas de pedidos', desc: 'Nuevos pedidos, cambios de estado, cancelaciones' },
    { key: 'lowStockAlerts', label: 'Alertas de stock bajo', desc: 'Cuando un producto tiene pocas unidades' },
    { key: 'newReviewAlerts', label: 'Nuevas reseñas', desc: 'Cuando un cliente deja una reseña' },
    { key: 'securityAlerts', label: 'Alertas de seguridad', desc: 'Inicios de sesión, cambios de contraseña' },
    { key: 'promotionAlerts', label: 'Promociones y novedades', desc: 'Ofertas de la plataforma y actualizaciones' },
    { key: 'weeklyReport', label: 'Reporte semanal', desc: 'Resumen de ventas y actividad de la semana' },
  ];

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Channels */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Canales de notificación</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Elige cómo quieres recibir notificaciones</p>
          <div className="space-y-4">
            {notifItems.map((item) => (
              <div key={item.key} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <item.icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{item.label}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{item.desc}</p>
                  </div>
                </div>
                <Switch
                  checked={(prefs as any)[item.key]}
                  onCheckedChange={(val) => handleToggle(item.key, val)}
                  disabled={saving}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Alert types */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Tipos de alertas</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Selecciona las alertas que deseas recibir</p>
          <div className="space-y-4">
            {alertItems.map((item) => (
              <div key={item.key} className="flex items-center justify-between py-1">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{item.label}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{item.desc}</p>
                </div>
                <Switch
                  checked={(prefs as any)[item.key]}
                  onCheckedChange={(val) => handleToggle(item.key, val)}
                  disabled={saving}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// --- Appearance Tab ---
function AppearanceSection() {
  const { theme, setTheme } = useThemeStore();

  const themes = [
    { value: 'light' as const, label: 'Claro', icon: Sun, desc: 'Tema claro para uso diurno' },
    { value: 'dark' as const, label: 'Oscuro', icon: Moon, desc: 'Tema oscuro para reducir fatiga visual' },
    { value: 'system' as const, label: 'Sistema', icon: Monitor, desc: 'Seguir la configuración del sistema' },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Tema de la aplicación</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Elige cómo se ve tu panel de vendedor</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {themes.map((t) => {
              const isActive = theme === t.value;
              return (
                <button
                  key={t.value}
                  onClick={() => setTheme(t.value)}
                  className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                    isActive
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  {isActive && (
                    <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${
                    isActive
                      ? 'bg-blue-100 dark:bg-blue-900/40'
                      : 'bg-gray-100 dark:bg-gray-800'
                  }`}>
                    <t.icon className={`w-5 h-5 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500'}`} />
                  </div>
                  <p className={`font-medium ${isActive ? 'text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-white'}`}>
                    {t.label}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{t.desc}</p>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// --- Account Tab ---
function AccountSection() {
  const { user, logout } = useAuthStore();
  const [showDeactivate, setShowDeactivate] = useState(false);

  return (
    <div className="space-y-6">
      {/* Account Info */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Información de la cuenta</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Detalles de tu cuenta en Oscorp</p>

          <div className="space-y-3">
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-500 dark:text-gray-400">Email</span>
              <span className="font-medium text-gray-900 dark:text-white">{user?.email}</span>
            </div>
            <Separator />
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-500 dark:text-gray-400">Rol</span>
              <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-0.5 rounded-full font-medium">
                Vendedor
              </span>
            </div>
            <Separator />
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-500 dark:text-gray-400">Estado de la cuenta</span>
              <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                <Check className="w-3 h-3" /> Activa
              </span>
            </div>
            <Separator />
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-500 dark:text-gray-400">Plan</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {user?.sellerProfile?.planActive ? 'Activo' : 'Inactivo'}
              </span>
            </div>
            {user?.sellerProfile?.planExpiryDate && (
              <>
                <Separator />
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-500 dark:text-gray-400">Vencimiento del plan</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {new Date(user.sellerProfile.planExpiryDate).toLocaleDateString('es-ES', {
                      day: 'numeric', month: 'long', year: 'numeric'
                    })}
                  </span>
                </div>
              </>
            )}
            <Separator />
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-500 dark:text-gray-400">Miembro desde</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {user?.createdAt
                  ? new Date(user.createdAt).toLocaleDateString('es-ES', {
                      day: 'numeric', month: 'long', year: 'numeric'
                    })
                  : '-'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Sessions */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Sesión activa</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Gestiona tu sesión actual</p>

          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div>
              <p className="font-medium text-gray-900 dark:text-white text-sm">Navegador actual</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Sesión iniciada ahora</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                logout();
                toast.success('Sesión cerrada');
              }}
              className="text-red-600 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/20"
            >
              Cerrar sesión
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200 dark:border-red-900/50">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h3 className="font-semibold text-red-600 dark:text-red-400">Zona de peligro</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Acciones irreversibles de tu cuenta</p>
            </div>
          </div>

          {!showDeactivate ? (
            <Button
              variant="outline"
              onClick={() => setShowDeactivate(true)}
              className="text-red-600 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/20"
            >
              Desactivar mi tienda
            </Button>
          ) : (
            <div className="space-y-3 p-4 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-900/30">
              <p className="text-sm text-red-700 dark:text-red-300">
                Al desactivar tu tienda, tus productos dejarán de ser visibles en el marketplace.
                Puedes reactivarla contactando al administrador.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeactivate(false)}
                >
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    toast.info('Para desactivar tu tienda, contacta al administrador');
                    setShowDeactivate(false);
                  }}
                >
                  Solicitar desactivación
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// --- Main Settings Page ---
export default function SellerSettings() {
  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Configuración</h1>
        <p className="text-gray-500 dark:text-gray-400">Administra tu cuenta, seguridad y preferencias</p>
      </div>

      <Tabs defaultValue="security" className="w-full">
        <TabsList className="w-full grid grid-cols-4">
          <TabsTrigger value="security" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <Shield className="w-4 h-4" />
            <span className="hidden sm:inline">Seguridad</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <Bell className="w-4 h-4" />
            <span className="hidden sm:inline">Notificaciones</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <Palette className="w-4 h-4" />
            <span className="hidden sm:inline">Apariencia</span>
          </TabsTrigger>
          <TabsTrigger value="account" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <Lock className="w-4 h-4" />
            <span className="hidden sm:inline">Cuenta</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="security" className="mt-6">
          <SecuritySection />
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          <NotificationsSection />
        </TabsContent>

        <TabsContent value="appearance" className="mt-6">
          <AppearanceSection />
        </TabsContent>

        <TabsContent value="account" className="mt-6">
          <AccountSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}
