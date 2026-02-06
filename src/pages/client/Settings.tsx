import { useState, useEffect } from 'react';
import {
  Settings,
  Bell,
  BellOff,
  Shield,
  Lock,
  MapPin,
  Palette,
  Sun,
  Moon,
  Monitor,
  Smartphone,
  Wifi,
  WifiOff,
  Database,
  Trash2,
  Info,
  ChevronRight,
  Volume2,
  VolumeX,
  Vibrate,
  Eye,
  Fingerprint,
  Languages,
  Download,
  RefreshCw,
  FileText,
  ShieldCheck,
  MessageSquare,
  HardDrive,
  Package
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useThemeStore } from '@/stores/themeStore';
import { isPushSupported, isSubscribedToPush, subscribeToPush, unsubscribeFromPush } from '@/lib/pushNotifications';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// localStorage key for app settings
const SETTINGS_KEY = 'oscorp-app-settings';

interface AppSettings {
  // Notifications
  pushEnabled: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  promotionalNotifications: boolean;
  orderUpdates: boolean;
  securityAlerts: boolean;
  // Privacy & Security
  locationEnabled: boolean;
  biometricEnabled: boolean;
  screenLockEnabled: boolean;
  showBalanceOnHome: boolean;
  // General
  language: string;
  autoUpdate: boolean;
  dataSaver: boolean;
  // About (read-only, no need to save)
}

const defaultSettings: AppSettings = {
  pushEnabled: false,
  soundEnabled: true,
  vibrationEnabled: true,
  promotionalNotifications: true,
  orderUpdates: true,
  securityAlerts: true,
  locationEnabled: false,
  biometricEnabled: false,
  screenLockEnabled: false,
  showBalanceOnHome: true,
  language: 'es',
  autoUpdate: true,
  dataSaver: false,
};

function loadSettings(): AppSettings {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) {
      return { ...defaultSettings, ...JSON.parse(saved) };
    }
  } catch {
    // ignore
  }
  return { ...defaultSettings };
}

function saveSettings(settings: AppSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export default function ClientSettings() {
  const [settings, setSettings] = useState<AppSettings>(loadSettings);
  const [pushLoading, setPushLoading] = useState(false);
  const [clearCacheDialogOpen, setClearCacheDialogOpen] = useState(false);
  const [clearingCache, setClearingCache] = useState(false);
  const { theme, setTheme, resolvedTheme } = useThemeStore();
  const pushSupported = isPushSupported();

  // Sync push state on mount
  useEffect(() => {
    if (pushSupported) {
      isSubscribedToPush().then((subscribed) => {
        if (subscribed !== settings.pushEnabled) {
          updateSetting('pushEnabled', subscribed);
        }
      });
    }
  }, []);

  // Check location permission on mount
  useEffect(() => {
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        const granted = result.state === 'granted';
        if (granted !== settings.locationEnabled) {
          updateSetting('locationEnabled', granted);
        }
      }).catch(() => {});
    }
  }, []);

  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings((prev) => {
      const updated = { ...prev, [key]: value };
      saveSettings(updated);
      return updated;
    });
  };

  const handlePushToggle = async (enabled: boolean) => {
    setPushLoading(true);
    try {
      if (enabled) {
        const success = await subscribeToPush();
        updateSetting('pushEnabled', success);
        if (success) {
          toast.success('Notificaciones push activadas');
        } else {
          toast.error('No se pudo activar las notificaciones. Verifica los permisos del navegador.');
        }
      } else {
        const success = await unsubscribeFromPush();
        if (success) {
          updateSetting('pushEnabled', false);
          toast.success('Notificaciones push desactivadas');
        }
      }
    } catch {
      toast.error('Error al cambiar la configuracion de notificaciones');
    } finally {
      setPushLoading(false);
    }
  };

  const handleLocationToggle = async (enabled: boolean) => {
    if (enabled) {
      try {
        const result = await new Promise<boolean>((resolve) => {
          navigator.geolocation.getCurrentPosition(
            () => resolve(true),
            () => resolve(false),
            { timeout: 10000 }
          );
        });
        updateSetting('locationEnabled', result);
        if (result) {
          toast.success('Permiso de ubicacion concedido');
        } else {
          toast.error('Permiso de ubicacion denegado. Activalo en la configuracion del navegador.');
        }
      } catch {
        toast.error('No se pudo acceder a la ubicacion');
      }
    } else {
      updateSetting('locationEnabled', false);
      toast.info('Ubicacion desactivada. Para revocar completamente, usa la configuracion del navegador.');
    }
  };

  const handleClearCache = async () => {
    setClearingCache(true);
    try {
      // Clear service worker caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((name) => caches.delete(name)));
      }
      // Clear specific app localStorage items (preserve auth and theme)
      const keysToPreserve = ['oscorp-token', 'oscorp-auth', 'oscorp-theme', SETTINGS_KEY];
      const allKeys = Object.keys(localStorage);
      allKeys.forEach((key) => {
        if (!keysToPreserve.includes(key)) {
          localStorage.removeItem(key);
        }
      });
      toast.success('Cache y datos temporales eliminados');
    } catch {
      toast.error('Error al limpiar la cache');
    } finally {
      setClearingCache(false);
      setClearCacheDialogOpen(false);
    }
  };

  const estimateCacheSize = () => {
    let total = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        total += (localStorage.getItem(key) || '').length;
      }
    }
    if (total < 1024) return `${total} B`;
    if (total < 1024 * 1024) return `${(total / 1024).toFixed(1)} KB`;
    return `${(total / (1024 * 1024)).toFixed(1)} MB`;
  };

  const themeOptions = [
    { value: 'light', label: 'Claro', icon: Sun },
    { value: 'dark', label: 'Oscuro', icon: Moon },
    { value: 'system', label: 'Sistema', icon: Monitor },
  ];

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="px-4 pt-2">
        <h1 className="text-xl font-bold text-foreground">Ajustes</h1>
        <p className="text-sm text-muted-foreground">Configura tu aplicacion</p>
      </div>

      {/* Appearance */}
      <div className="px-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <Palette className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              Apariencia
            </CardTitle>
            <CardDescription>Personaliza el aspecto de la aplicacion</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Label className="text-sm font-medium">Tema</Label>
              <div className="grid grid-cols-3 gap-2">
                {themeOptions.map((opt) => {
                  const active = theme === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setTheme(opt.value as 'light' | 'dark' | 'system')}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                        active
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/30'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        active ? 'bg-primary/10' : 'bg-muted'
                      }`}>
                        <opt.icon className={`w-5 h-5 ${active ? 'text-primary' : 'text-muted-foreground'}`} />
                      </div>
                      <span className={`text-xs font-medium ${active ? 'text-primary' : 'text-muted-foreground'}`}>
                        {opt.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Eye className="w-4 h-4 text-muted-foreground" />
                <div>
                  <Label className="text-sm">Mostrar saldo en inicio</Label>
                  <p className="text-xs text-muted-foreground">Ver tu saldo en la pantalla principal</p>
                </div>
              </div>
              <Switch
                checked={settings.showBalanceOnHome}
                onCheckedChange={(val) => updateSetting('showBalanceOnHome', val)}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notifications */}
      <div className="px-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Bell className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              Notificaciones
            </CardTitle>
            <CardDescription>Controla como recibes alertas y avisos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Push Notifications Master Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {settings.pushEnabled ? (
                  <Bell className="w-4 h-4 text-blue-600" />
                ) : (
                  <BellOff className="w-4 h-4 text-muted-foreground" />
                )}
                <div>
                  <Label className="text-sm">Notificaciones push</Label>
                  <p className="text-xs text-muted-foreground">
                    {pushSupported
                      ? 'Recibir alertas en tu dispositivo'
                      : 'No soportado en este navegador'}
                  </p>
                </div>
              </div>
              <Switch
                checked={settings.pushEnabled}
                onCheckedChange={handlePushToggle}
                disabled={!pushSupported || pushLoading}
              />
            </div>

            <Separator />

            {/* Sound */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {settings.soundEnabled ? (
                  <Volume2 className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <VolumeX className="w-4 h-4 text-muted-foreground" />
                )}
                <div>
                  <Label className="text-sm">Sonido de notificaciones</Label>
                  <p className="text-xs text-muted-foreground">Reproducir sonido al recibir notificaciones</p>
                </div>
              </div>
              <Switch
                checked={settings.soundEnabled}
                onCheckedChange={(val) => {
                  updateSetting('soundEnabled', val);
                  toast.success(val ? 'Sonido activado' : 'Sonido desactivado');
                }}
              />
            </div>

            {/* Vibration */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Vibrate className="w-4 h-4 text-muted-foreground" />
                <div>
                  <Label className="text-sm">Vibracion</Label>
                  <p className="text-xs text-muted-foreground">Vibrar al recibir notificaciones</p>
                </div>
              </div>
              <Switch
                checked={settings.vibrationEnabled}
                onCheckedChange={(val) => {
                  updateSetting('vibrationEnabled', val);
                  if (val && 'vibrate' in navigator) {
                    navigator.vibrate(100);
                  }
                  toast.success(val ? 'Vibracion activada' : 'Vibracion desactivada');
                }}
              />
            </div>

            <Separator />

            {/* Notification Types */}
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tipos de notificacion</p>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Package className="w-4 h-4 text-muted-foreground" />
                <div>
                  <Label className="text-sm">Actualizaciones de pedidos</Label>
                  <p className="text-xs text-muted-foreground">Estado de envio y entrega</p>
                </div>
              </div>
              <Switch
                checked={settings.orderUpdates}
                onCheckedChange={(val) => updateSetting('orderUpdates', val)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MessageSquare className="w-4 h-4 text-muted-foreground" />
                <div>
                  <Label className="text-sm">Promociones y ofertas</Label>
                  <p className="text-xs text-muted-foreground">Descuentos y ofertas especiales</p>
                </div>
              </div>
              <Switch
                checked={settings.promotionalNotifications}
                onCheckedChange={(val) => updateSetting('promotionalNotifications', val)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-4 h-4 text-muted-foreground" />
                <div>
                  <Label className="text-sm">Alertas de seguridad</Label>
                  <p className="text-xs text-muted-foreground">Inicio de sesion y actividad sospechosa</p>
                </div>
              </div>
              <Switch
                checked={settings.securityAlerts}
                onCheckedChange={(val) => updateSetting('securityAlerts', val)}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Privacy & Security */}
      <div className="px-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Shield className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              Privacidad y Seguridad
            </CardTitle>
            <CardDescription>Gestiona tus permisos y seguridad</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Location Permission */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <div>
                  <Label className="text-sm">Permiso de ubicacion</Label>
                  <p className="text-xs text-muted-foreground">Permitir acceso a tu ubicacion para entregas</p>
                </div>
              </div>
              <Switch
                checked={settings.locationEnabled}
                onCheckedChange={handleLocationToggle}
              />
            </div>

            <Separator />

            {/* Biometric Auth */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Fingerprint className="w-4 h-4 text-muted-foreground" />
                <div>
                  <Label className="text-sm">Autenticacion biometrica</Label>
                  <p className="text-xs text-muted-foreground">Usar huella digital o Face ID para acceder</p>
                </div>
              </div>
              <Switch
                checked={settings.biometricEnabled}
                onCheckedChange={(val) => {
                  updateSetting('biometricEnabled', val);
                  toast.success(val ? 'Autenticacion biometrica activada' : 'Autenticacion biometrica desactivada');
                }}
              />
            </div>

            {/* Screen Lock */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Lock className="w-4 h-4 text-muted-foreground" />
                <div>
                  <Label className="text-sm">Bloqueo de pantalla</Label>
                  <p className="text-xs text-muted-foreground">Bloquear la app al salir o minimizar</p>
                </div>
              </div>
              <Switch
                checked={settings.screenLockEnabled}
                onCheckedChange={(val) => {
                  updateSetting('screenLockEnabled', val);
                  toast.success(val ? 'Bloqueo de pantalla activado' : 'Bloqueo de pantalla desactivado');
                }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* General */}
      <div className="px-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <Settings className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              </div>
              General
            </CardTitle>
            <CardDescription>Preferencias generales de la aplicacion</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Language */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Languages className="w-4 h-4 text-muted-foreground" />
                <div>
                  <Label className="text-sm">Idioma</Label>
                  <p className="text-xs text-muted-foreground">Idioma de la aplicacion</p>
                </div>
              </div>
              <Select
                value={settings.language}
                onValueChange={(val) => {
                  updateSetting('language', val);
                  toast.success('Idioma actualizado');
                }}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="es">Espanol</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="pt">Portugues</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Auto Update */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Download className="w-4 h-4 text-muted-foreground" />
                <div>
                  <Label className="text-sm">Actualizacion automatica</Label>
                  <p className="text-xs text-muted-foreground">Actualizar la app automaticamente</p>
                </div>
              </div>
              <Switch
                checked={settings.autoUpdate}
                onCheckedChange={(val) => {
                  updateSetting('autoUpdate', val);
                  toast.success(val ? 'Actualizacion automatica activada' : 'Actualizacion automatica desactivada');
                }}
              />
            </div>

            {/* Data Saver */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {settings.dataSaver ? (
                  <WifiOff className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <Wifi className="w-4 h-4 text-muted-foreground" />
                )}
                <div>
                  <Label className="text-sm">Ahorro de datos</Label>
                  <p className="text-xs text-muted-foreground">Reducir el consumo de datos moviles</p>
                </div>
              </div>
              <Switch
                checked={settings.dataSaver}
                onCheckedChange={(val) => {
                  updateSetting('dataSaver', val);
                  toast.success(val ? 'Ahorro de datos activado' : 'Ahorro de datos desactivado');
                }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Storage & Cache */}
      <div className="px-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <HardDrive className="w-4 h-4 text-red-600 dark:text-red-400" />
              </div>
              Almacenamiento
            </CardTitle>
            <CardDescription>Gestiona el almacenamiento y la cache de la aplicacion</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <Database className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Datos en cache</p>
                  <p className="text-xs text-muted-foreground">Datos almacenados localmente</p>
                </div>
              </div>
              <Badge variant="secondary">{estimateCacheSize()}</Badge>
            </div>

            <Button
              variant="outline"
              className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 border-red-200 dark:border-red-900"
              onClick={() => setClearCacheDialogOpen(true)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Limpiar cache y datos temporales
            </Button>

            <Button
              variant="outline"
              className="w-full"
              onClick={async () => {
                if ('serviceWorker' in navigator) {
                  const registrations = await navigator.serviceWorker.getRegistrations();
                  for (const registration of registrations) {
                    await registration.update();
                  }
                  toast.success('Aplicacion actualizada');
                } else {
                  window.location.reload();
                }
              }}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Forzar actualizacion de la app
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* About */}
      <div className="px-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <Info className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </div>
              Acerca de
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <Smartphone className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">Version de la app</span>
              </div>
              <span className="text-sm text-muted-foreground">1.0.0</span>
            </div>
            <Separator />

            <button className="flex items-center justify-between py-3 w-full hover:bg-muted/50 rounded-lg px-1 transition-colors">
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">Terminos y condiciones</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
            <Separator />

            <button className="flex items-center justify-between py-3 w-full hover:bg-muted/50 rounded-lg px-1 transition-colors">
              <div className="flex items-center gap-3">
                <Shield className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">Politica de privacidad</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
            <Separator />

            <button className="flex items-center justify-between py-3 w-full hover:bg-muted/50 rounded-lg px-1 transition-colors">
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">Licencias de codigo abierto</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          </CardContent>
        </Card>
      </div>

      {/* App Info Footer */}
      <div className="px-4 pb-4">
        <div className="text-center space-y-1">
          <p className="text-xs text-muted-foreground">Oscorp App v1.0.0</p>
          <p className="text-xs text-muted-foreground">&copy; 2025 Oscorp. Todos los derechos reservados.</p>
        </div>
      </div>

      {/* Clear Cache Confirmation Dialog */}
      <Dialog open={clearCacheDialogOpen} onOpenChange={setClearCacheDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Limpiar cache</DialogTitle>
            <DialogDescription>
              Esto eliminara todos los datos temporales y la cache de la aplicacion. Tu sesion y configuracion se mantendran. La aplicacion podria tardar un poco mas en cargar despues de limpiar la cache.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setClearCacheDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleClearCache}
              disabled={clearingCache}
            >
              {clearingCache ? 'Limpiando...' : 'Limpiar cache'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
