import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Edit,
  LogOut,
  ChevronRight,
  Shield,
  CreditCard,
  Bell,
  HelpCircle,
  FileText,
  Sparkles
} from 'lucide-react';
import { useAuthStore, useWalletStore } from '@/stores';
import { getInitials, cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { VirtualCard } from '@/components/client/VirtualCard';
import { Switch } from '@/components/ui/switch';
import { isPushSupported, isSubscribedToPush, subscribeToPush, unsubscribeFromPush } from '@/lib/pushNotifications';
import { generateQRValue } from '@/lib/qr';
import { ImageUpload } from '@/components/shared/ImageUpload';

const menuItems = [
  { icon: User, label: 'Editar perfil', href: '#', color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { icon: Shield, label: 'Seguridad', href: '#', color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
  { icon: CreditCard, label: 'Métodos de pago', href: '#', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  { icon: Bell, label: 'Notificaciones', href: '#', color: 'text-amber-500', bg: 'bg-amber-500/10' },
  { icon: HelpCircle, label: 'Ayuda y soporte', href: '#', color: 'text-purple-500', bg: 'bg-purple-500/10' },
  { icon: FileText, label: 'Términos y condiciones', href: '#', color: 'text-rose-500', bg: 'bg-rose-500/10' },
];

export default function ClientProfile() {
  const { user, logout, updateUser, updateBankData } = useAuthStore();
  const { wallet, fetchWallet } = useWalletStore();
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (user) {
      fetchWallet(user.id);
    }
  }, [user]);
  const [formData, setFormData] = useState<any>({});

  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  const pushSupported = isPushSupported();

  useEffect(() => {
    if (pushSupported) {
      isSubscribedToPush().then(setPushEnabled);
    }
  }, [pushSupported]);

  const handlePushToggle = async (enabled: boolean) => {
    setPushLoading(true);
    try {
      if (enabled) {
        const success = await subscribeToPush();
        setPushEnabled(success);
        if (success) toast.success('Notificaciones push activadas');
        else toast.error('No se pudo activar las notificaciones');
      } else {
        const success = await unsubscribeFromPush();
        if (success) {
          setPushEnabled(false);
          toast.success('Notificaciones push desactivadas');
        }
      }
    } catch {
      toast.error('Error al cambiar configuracion');
    } finally {
      setPushLoading(false);
    }
  };

  const [isBankOpen, setIsBankOpen] = useState(false);
  const [bankFormData, setBankFormData] = useState({
    bankName: '',
    accountNumber: '',
    accountType: 'savings',
    holderName: '',
    documentId: ''
  });

  const handleLogout = () => {
    logout();
    toast.success('Sesión cerrada');
  };

  const initEdit = () => {
    if (user) {
      setFormData({
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone || '',
        address: user.address || '',
        city: user.city || '',
        avatar: user.avatar || ''
      });
      setIsEditing(true);
    }
  };

  const handleSaveProfile = async () => {
    if (!formData.firstName || !formData.lastName) {
      toast.error('Nombre y apellido son requeridos');
      return;
    }

    const success = await updateUser(formData);
    if (success) {
      toast.success('Perfil actualizado correctamente');
      setIsEditing(false);
    } else {
      toast.error('Error al actualizar perfil');
    }
  };

  const initBankData = () => {
    if (user && user.bankData) {
      setBankFormData({
        bankName: user.bankData.bankName,
        accountNumber: user.bankData.accountNumber,
        accountType: user.bankData.accountType,
        holderName: user.bankData.holderName,
        documentId: user.bankData.documentId
      });
    } else if (user) {
      // Pre-fill holder name with user name if empty
      setBankFormData(prev => ({ ...prev, holderName: `${user.firstName} ${user.lastName}` }));
    }
    setIsBankOpen(true);
  };

  const handleSaveBankData = async () => {
    if (!bankFormData.bankName || !bankFormData.accountNumber || !bankFormData.holderName || !bankFormData.documentId) {
      toast.error('Todos los campos son obligatorios');
      return;
    }

    const success = await updateBankData(bankFormData);
    if (success) {
      toast.success('Datos bancarios guardados');
      setIsBankOpen(false);
    } else {
      toast.error('Error al guardar datos bancarios');
    }
  };

  return (
    <div className="pt-6 pb-20 space-y-6 max-w-lg mx-auto px-4">
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <h1 className="text-2xl font-black tracking-tight">Mi Perfil</h1>
          <p className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-[0.15em]">Gestiona tu cuenta</p>
        </div>
        <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
          <Sparkles className="w-5 h-5 text-blue-500" />
        </div>
      </div>

      {/* Profile Card */}
      <div className="glass-premium overflow-hidden rounded-[2.5rem] border border-white/10 shadow-2xl">
        <div className="p-6">
          <div className="flex flex-col items-center">
            {isEditing ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full space-y-4"
              >
                <div className="flex justify-center mb-4">
                  <ImageUpload
                    value={formData.avatar || null}
                    onChange={(val) => setFormData({ ...formData, avatar: val || '' })}
                    shape="circle"
                    maxWidth={300}
                    maxHeight={300}
                    label="Foto de perfil"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/50">Nombre</Label>
                    <Input
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="bg-white/5 border-white/10 rounded-xl h-12 font-medium"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/50">Apellido</Label>
                    <Input
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="bg-white/5 border-white/10 rounded-xl h-12 font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/50">Teléfono</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="bg-white/5 border-white/10 rounded-xl h-12 font-medium"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" className="flex-1 rounded-xl h-12 font-black text-xs uppercase tracking-widest border-white/10" onClick={() => setIsEditing(false)}>Cancelar</Button>
                  <Button className="flex-1 rounded-xl h-12 bg-blue-600 hover:bg-blue-700 font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-500/20" onClick={handleSaveProfile}>Guardar</Button>
                </div>
              </motion.div>
            ) : (
              <>
                <div className="relative group">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 p-[3px] shadow-2xl group-hover:scale-105 transition-transform duration-500">
                    <div className="w-full h-full rounded-full bg-background flex items-center justify-center overflow-hidden">
                      {user?.avatar ? (
                        <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-2xl font-black text-foreground/60">
                          {user ? getInitials(user.firstName, user.lastName) : 'U'}
                        </span>
                      )}
                    </div>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={initEdit}
                    className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-blue-600 border-2 border-background flex items-center justify-center text-white shadow-lg"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </motion.button>
                </div>

                <h2 className="text-xl font-black mt-4 tracking-tight leading-none text-center">
                  {user?.firstName} {user?.lastName}
                </h2>
                <p className="text-[10px] text-muted-foreground/60 mt-1.5 font-bold uppercase tracking-[0.15em]">{user?.email}</p>

                {/* Member Badge */}
                <div className="mt-3 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20">
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-500">Miembro Premium</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="space-y-2">
        {[
          { icon: Mail, label: 'Correo electrónico', value: user?.email, color: 'text-blue-500', bg: 'bg-blue-500/10', borderColor: 'border-blue-500/10' },
          { icon: Phone, label: 'Teléfono', value: user?.phone || 'No especificado', color: 'text-emerald-500', bg: 'bg-emerald-500/10', borderColor: 'border-emerald-500/10' },
          { icon: MapPin, label: 'Dirección', value: user?.address || 'No especificada', color: 'text-purple-500', bg: 'bg-purple-500/10', borderColor: 'border-purple-500/10' },
        ].map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={cn("glass-premium p-4 rounded-2xl border flex items-center gap-4", item.borderColor)}
          >
            <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center shadow-lg", item.bg)}>
              <item.icon className={cn("w-5 h-5", item.color)} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground/40 font-black">{item.label}</p>
              <p className="font-bold text-sm truncate">{item.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Virtual Card Section */}
      <div className="space-y-4">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 px-1">Mi Tarjeta Oscorp</h3>
        <VirtualCard
          balance={wallet?.balance || 0}
          cardNumber={user?.virtualCard?.cardNumber || 'OSC-0000-0000'}
          cardHolder={`${user?.firstName || 'USUARIO'} ${user?.lastName || 'OSCORP'}`}
          expiryDate="12/28"
          cvv="***"
          qrValue={generateQRValue(user?.id || '', user?.firstName || 'Usuario')}
        />
      </div>

      {/* Menu Options */}
      <div className="glass-premium overflow-hidden rounded-[2.5rem] border border-white/10 shadow-xl">
        <div className="divide-y divide-white/5">
          {menuItems.map((item, index) => {
            if (item.label === 'Métodos de pago') {
              return (
                <Dialog key={item.label} open={isBankOpen} onOpenChange={setIsBankOpen}>
                  <DialogTrigger asChild>
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={initBankData}
                      className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors group"
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center shadow-lg transition-all", item.bg)}>
                          <item.icon className={cn("w-5 h-5", item.color)} />
                        </div>
                        <span className="font-bold text-sm">Datos Bancarios</span>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-all">
                        <ChevronRight className="w-4 h-4 text-muted-foreground/30" />
                      </div>
                    </motion.button>
                  </DialogTrigger>
                  <DialogContent className="glass-premium border-white/10 rounded-[2rem]">
                    <DialogHeader>
                      <DialogTitle className="font-black tracking-tight text-lg">Datos Bancarios</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/50 font-black">Banco</Label>
                        <Input
                          value={bankFormData.bankName}
                          onChange={(e) => setBankFormData({ ...bankFormData, bankName: e.target.value })}
                          className="bg-white/5 border-white/10 rounded-xl h-12 font-medium"
                          placeholder="Ej: Banco Familiar"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/50 font-black">Nro. de Cuenta</Label>
                        <Input
                          value={bankFormData.accountNumber}
                          onChange={(e) => setBankFormData({ ...bankFormData, accountNumber: e.target.value })}
                          className="bg-white/5 border-white/10 rounded-xl h-12 font-medium"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/50 font-black">Tipo de Cuenta</Label>
                        <Select
                          value={bankFormData.accountType}
                          onValueChange={(val) => setBankFormData({ ...bankFormData, accountType: val })}
                        >
                          <SelectTrigger className="bg-white/5 border-white/10 rounded-xl h-12">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="savings">Caja de Ahorro</SelectItem>
                            <SelectItem value="checking">Cuenta Corriente</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button className="w-full bg-blue-600 hover:bg-blue-700 h-14 rounded-2xl font-black text-xs uppercase tracking-[0.15em] mt-4 shadow-lg shadow-blue-500/20" onClick={handleSaveBankData}>
                        Guardar Información
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              );
            }
            if (item.label === 'Notificaciones' && pushSupported) {
              return (
                <div key={item.label} className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center shadow-lg", item.bg)}>
                      <Bell className={cn("w-5 h-5", item.color)} />
                    </div>
                    <div>
                      <p className="font-bold text-sm leading-none">Notificaciones Push</p>
                      <p className="text-[9px] text-muted-foreground/40 font-bold uppercase tracking-[0.15em] mt-1">Alertas en tiempo real</p>
                    </div>
                  </div>
                  <Switch
                    checked={pushEnabled}
                    onCheckedChange={handlePushToggle}
                    disabled={pushLoading}
                    className="data-[state=checked]:bg-blue-600"
                  />
                </div>
              );
            }
            return (
              <motion.button
                key={item.label}
                whileTap={{ scale: 0.98 }}
                className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors group text-left"
              >
                <div className="flex items-center gap-4">
                  <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center shadow-lg transition-all", item.bg)}>
                    <item.icon className={cn("w-5 h-5", item.color)} />
                  </div>
                  <span className="font-bold text-sm">{item.label}</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-all">
                  <ChevronRight className="w-4 h-4 text-muted-foreground/30" />
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Logout */}
      <motion.div whileTap={{ scale: 0.98 }}>
        <Button
          variant="ghost"
          className="w-full h-16 rounded-[2rem] bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 font-black text-xs uppercase tracking-[0.15em] border border-rose-500/20 shadow-lg"
          onClick={handleLogout}
        >
          <LogOut className="w-5 h-5 mr-3" />
          CERRAR SESIÓN
        </Button>
      </motion.div>
    </div>
  );
}
