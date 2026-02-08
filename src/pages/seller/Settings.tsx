import { useState, useEffect } from 'react';
import {
  Shield, Bell, Palette, Lock, Eye, EyeOff,
  Sun, Moon, Monitor, Check, AlertTriangle, KeyRound
} from 'lucide-react';
import { useAuthStore } from '@/stores';
import { useThemeStore } from '@/stores/themeStore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { authApi, usersApi, walletApi } from '@/lib/api';

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

  const handleChangePassword = async () => {
    if (!pwForm.currentPassword || !pwForm.newPassword) {
      toast.error('Completa todos los campos');
      return;
    }
    if (pwForm.newPassword.length < 6) {
      toast.error('La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    setPwLoading(true);
    try {
      await authApi.changePassword(pwForm.currentPassword, pwForm.newPassword);
      toast.success('Contraseña actualizada correctamente');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      toast.error(err.message || 'Error al cambiar contraseña');
    } finally {
      setPwLoading(false);
    }
  };

  const handlePinAction = async () => {
    if (!hasPin) {
      // Set new PIN
      if (pinForm.newPin.length !== 4 || !/^\d{4}$/.test(pinForm.newPin)) {
        toast.error('El PIN debe ser de 4 dígitos');
        return;
      }
      if (pinForm.newPin !== pinForm.confirmPin) {
        toast.error('Los PINs no coinciden');
        return;
      }
      setPinSaving(true);
      try {
        await walletApi.setPin(pinForm.newPin);
        toast.success('PIN de transacción configurado');
        setHasPin(true);
        setShowPinForm(false);
        setPinForm({ currentPin: '', newPin: '', confirmPin: '' });
      } catch (err: any) {
        toast.error(err.message || 'Error al configurar PIN');
      } finally {
        setPinSaving(false);
      }
    } else {
      // Change PIN
      if (!pinForm.currentPin || pinForm.currentPin.length !== 4) {
        toast.error('Ingresa tu PIN actual (4 dígitos)');
        return;
      }
      if (pinForm.newPin.length !== 4 || !/^\d{4}$/.test(pinForm.newPin)) {
        toast.error('El nuevo PIN debe ser de 4 dígitos');
        return;
      }
      if (pinForm.newPin !== pinForm.confirmPin) {
        toast.error('Los PINs no coinciden');
        return;
      }
      setPinSaving(true);
      try {
        await walletApi.changePin(pinForm.currentPin, pinForm.newPin);
        toast.success('PIN actualizado correctamente');
        setShowPinForm(false);
        setPinForm({ currentPin: '', newPin: '', confirmPin: '' });
      } catch (err: any) {
        toast.error(err.message || 'Error al cambiar PIN');
      } finally {
        setPinSaving(false);
      }
    }
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
                  placeholder="Mínimo 6 caracteres"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowNewPw(!showNewPw)}
                >
                  {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
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
            <div className="space-y-4 pt-2">
              <Separator />
              {hasPin && (
                <div className="space-y-2">
                  <Label>PIN actual</Label>
                  <Input
                    type="password"
                    maxLength={4}
                    value={pinForm.currentPin}
                    onChange={(e) => setPinForm({ ...pinForm, currentPin: e.target.value.replace(/\D/g, '') })}
                    placeholder="4 dígitos"
                    className="max-w-[200px]"
                  />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{hasPin ? 'Nuevo PIN' : 'PIN'}</Label>
                  <Input
                    type="password"
                    maxLength={4}
                    value={pinForm.newPin}
                    onChange={(e) => setPinForm({ ...pinForm, newPin: e.target.value.replace(/\D/g, '') })}
                    placeholder="4 dígitos"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Confirmar PIN</Label>
                  <Input
                    type="password"
                    maxLength={4}
                    value={pinForm.confirmPin}
                    onChange={(e) => setPinForm({ ...pinForm, confirmPin: e.target.value.replace(/\D/g, '') })}
                    placeholder="4 dígitos"
                  />
                </div>
              </div>
              <Button
                onClick={handlePinAction}
                disabled={pinSaving}
                className="bg-gradient-to-r from-purple-600 to-blue-600"
              >
                {pinSaving ? 'Guardando...' : hasPin ? 'Actualizar PIN' : 'Configurar PIN'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
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

  useEffect(() => {
    usersApi.getPreferences()
      .then((data: any) => setPrefs(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleToggle = async (key: string, value: boolean) => {
    const newPrefs = { ...prefs, [key]: value };
    setPrefs(newPrefs);
    setSaving(true);
    try {
      await usersApi.updatePreferences(newPrefs);
      toast.success('Preferencia actualizada');
    } catch {
      setPrefs(prefs); // revert
      toast.error('Error al guardar preferencia');
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
