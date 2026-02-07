import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Edit,
  Camera,
  LogOut,
  ChevronRight,
  Shield,
  CreditCard,
  Bell,
  HelpCircle,
  FileText
} from 'lucide-react';
import { useAuthStore, useWalletStore } from '@/stores';
import { getInitials } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
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
  { icon: User, label: 'Editar perfil', href: '#' },
  { icon: Shield, label: 'Seguridad', href: '#' },
  { icon: CreditCard, label: 'Métodos de pago', href: '#' },
  { icon: Bell, label: 'Notificaciones', href: '#' },
  { icon: HelpCircle, label: 'Ayuda y soporte', href: '#' },
  { icon: FileText, label: 'Términos y condiciones', href: '#' },
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
    <div className="space-y-6 pb-6">
      {/* Header */}
      <div className="px-4 pt-2">
        <h1 className="text-xl font-bold text-gray-900">Mi Perfil</h1>
        <p className="text-sm text-gray-500">Gestiona tu cuenta</p>
      </div>

      {/* Profile Card */}
      <div className="px-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center">
              {isEditing ? (
                <div className="w-full space-y-4">
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
                      <Label>Nombre</Label>
                      <Input
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Apellido</Label>
                      <Input
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Teléfono</Label>
                    <Input
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Dirección</Label>
                    <Input
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Ciudad</Label>
                    <Input
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" className="flex-1" onClick={() => setIsEditing(false)}>Cancelar</Button>
                    <Button className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600" onClick={handleSaveProfile}>Guardar Cambios</Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 p-1">
                      <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                        {user?.avatar ? (
                          <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-2xl font-bold text-gray-700">
                            {user ? getInitials(user.firstName, user.lastName) : 'U'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <h2 className="text-xl font-bold text-gray-900 mt-4">
                    {user?.firstName} {user?.lastName}
                  </h2>
                  <p className="text-gray-500">{user?.email}</p>

                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={initEdit}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Editar perfil
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info Cards */}
      <div className="px-4 space-y-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Mail className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500">Correo electrónico</p>
                <p className="font-medium">{user?.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Phone className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500">Teléfono</p>
                <p className="font-medium">{user?.phone || 'No especificado'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <MapPin className="w-5 h-5 text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500">Dirección</p>
                <p className="font-medium">{user?.address || 'No especificada'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Virtual Card */}
      <div className="px-4">
        <h3 className="text-sm font-medium text-gray-500 mb-3 px-1">Mis Productos</h3>
        <div className="transform scale-[0.98] origin-center">
          <VirtualCard
            balance={wallet?.balance || 0}
            cardNumber={user?.virtualCard?.cardNumber || 'OSC000000'}
            cardHolder={`${user?.firstName || 'USUARIO'} ${user?.lastName || 'OSCORP'}`}
            expiryDate="12/28"
            cvv="***"
            qrValue={generateQRValue(user?.id || '', user?.firstName || 'Usuario')}
          />
        </div>
      </div>

      {/* Menu */}
      <div className="px-4">
        <Card>
          <CardContent className="p-0">
            {menuItems.map((item, index) => {
              if (item.label === 'Métodos de pago') {
                return (
                  <Dialog key={item.label} open={isBankOpen} onOpenChange={setIsBankOpen}>
                    <DialogTrigger asChild>
                      <button
                        onClick={initBankData}
                        className={`w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors ${index !== menuItems.length - 1 ? 'border-b border-gray-100' : ''
                          }`}
                      >
                        <div className="flex items-center gap-3">
                          <item.icon className="w-5 h-5 text-gray-500" />
                          <span className="text-gray-700">Datos Bancarios (Retiros)</span>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Datos Bancarios</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-2">
                        <div className="space-y-2">
                          <Label>Banco</Label>
                          <Input
                            value={bankFormData.bankName}
                            onChange={(e) => setBankFormData({ ...bankFormData, bankName: e.target.value })}
                            placeholder="Ej: Banco Familiar"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Nro. de Cuenta</Label>
                          <Input
                            value={bankFormData.accountNumber}
                            onChange={(e) => setBankFormData({ ...bankFormData, accountNumber: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Tipo de Cuenta</Label>
                          <Select
                            value={bankFormData.accountType}
                            onValueChange={(val) => setBankFormData({ ...bankFormData, accountType: val })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="savings">Caja de Ahorro</SelectItem>
                              <SelectItem value="checking">Cuenta Corriente</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Titular de la Cuenta</Label>
                          <Input
                            value={bankFormData.holderName}
                            onChange={(e) => setBankFormData({ ...bankFormData, holderName: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Documento de Identidad (CI)</Label>
                          <Input
                            value={bankFormData.documentId}
                            onChange={(e) => setBankFormData({ ...bankFormData, documentId: e.target.value })}
                          />
                        </div>
                        <Button className="w-full bg-purple-600" onClick={handleSaveBankData}>
                          Guardar Datos
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                );
              }
              if (item.label === 'Notificaciones' && pushSupported) {
                return (
                  <div
                    key={item.label}
                    className={`w-full flex items-center justify-between p-4 ${index !== menuItems.length - 1 ? 'border-b border-gray-100' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <Bell className="w-5 h-5 text-gray-500" />
                      <div>
                        <span className="text-gray-700">Notificaciones Push</span>
                        <p className="text-xs text-gray-400">Recibir alertas en tu dispositivo</p>
                      </div>
                    </div>
                    <Switch
                      checked={pushEnabled}
                      onCheckedChange={handlePushToggle}
                      disabled={pushLoading}
                    />
                  </div>
                );
              }
              return (
                <button
                  key={item.label}
                  className={`w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors ${index !== menuItems.length - 1 ? 'border-b border-gray-100' : ''
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-5 h-5 text-gray-500" />
                    <span className="text-gray-700">{item.label}</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>
              )
            })}
          </CardContent>
        </Card>
      </div>

      {/* Logout */}
      <div className="px-4">
        <Button variant="destructive" className="w-full" onClick={handleLogout}>
          <LogOut className="w-5 h-5 mr-2" />
          Cerrar sesión
        </Button>
      </div>
    </div>
  );
}
