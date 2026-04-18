import { useState, useEffect } from 'react';
import { User as UserIcon, Mail, Phone, MapPin, Store, Lock, Eye, EyeOff, Save, Loader2, MessageCircle, Link as LinkIcon, ExternalLink, Banknote, CreditCard, FileText } from 'lucide-react';
import { useAuthStore } from '@/stores';
import { getInitials } from '@/lib/utils';
import { authApi, usersApi } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { ImageUpload } from '@/components/shared/ImageUpload';

export default function SellerProfile() {
  const { user, updateUser, updateBankData, fetchCurrentUser } = useAuthStore();

  // Personal info form
  const [personalData, setPersonalData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    city: '',
    avatar: '',
  });
  const [bankData, setBankData] = useState({
    bankName: '',
    accountNumber: '',
    accountType: '',
    holderName: '',
    documentId: '',
  });
  const [editingPersonal, setEditingPersonal] = useState(false);
  const [savingPersonal, setSavingPersonal] = useState(false);

  // Store/seller profile form
  const [storeData, setStoreData] = useState({
    storeName: '',
    storeSlug: '',
    ruc: '',
    description: '',
    phone: '',
    email: '',
    address: '',
    whatsappNumber: '',
    logo: '',
    banner: '',
    facebook: '',
    instagram: '',
    website: '',
  });
  const [editingStore, setEditingStore] = useState(false);
  const [savingStore, setSavingStore] = useState(false);

  // Password form
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [savingPassword, setSavingPassword] = useState(false);
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);

  // Initialize personal data from user
  useEffect(() => {
    if (user) {
      setPersonalData({
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone || '',
        address: user.address || '',
        city: user.city || '',
        avatar: user.avatar || '',
      });
      
      if (user.bankData) {
        setBankData({
          bankName: user.bankData.bankName || '',
          accountNumber: user.bankData.accountNumber || '',
          accountType: user.bankData.accountType || '',
          holderName: user.bankData.holderName || '',
          documentId: user.bankData.documentId || '', // Correct property name
        });
      }

      if (user.sellerProfile) {
        const sp = user.sellerProfile;
        const sl = (sp.socialLinks || {}) as Record<string, string>;
        setStoreData({
          storeName: sp.storeName || '',
          storeSlug: sp.storeSlug || '',
          ruc: sp.ruc || '',
          description: sp.description || '',
          phone: sp.phone || '',
          email: sp.email || '',
          address: sp.address || '',
          whatsappNumber: sp.whatsappNumber || '',
          logo: sp.logo || '',
          banner: sp.banner || '',
          facebook: sl.facebook || '',
          instagram: sl.instagram || '',
          website: sl.website || '',
        });
      }
    }
  }, [user]);

  // Save personal info
  const handleSavePersonal = async () => {
    if (!personalData.firstName || !personalData.lastName) {
      toast.error('Nombre y apellido son requeridos');
      return;
    }
    setSavingPersonal(true);
    try {
      // Update basic info
      await updateUser({
        firstName: personalData.firstName,
        lastName: personalData.lastName,
        phone: personalData.phone,
        address: personalData.address,
        city: personalData.city,
        avatar: personalData.avatar
      });

      // Update bank data separately using its dedicated method
      await updateBankData(bankData);

      toast.success('Perfil actualizado correctamente');
      setEditingPersonal(false);
      await fetchCurrentUser();
    } catch (error) {
      toast.error('Error al actualizar el perfil');
    } finally {
      setSavingPersonal(false);
    }
  };

  // Save store info
  const handleSaveStore = async () => {
    if (!storeData.storeName) {
      toast.error('El nombre de la tienda es requerido');
      return;
    }
    setSavingStore(true);
    try {
      await usersApi.updateSellerProfile({
        storeName: storeData.storeName,
        storeSlug: storeData.storeSlug,
        ruc: storeData.ruc,
        description: storeData.description,
        phone: storeData.phone,
        email: storeData.email,
        address: storeData.address,
        whatsappNumber: storeData.whatsappNumber,
        logo: storeData.logo,
        banner: storeData.banner,
        socialLinks: {
          facebook: storeData.facebook,
          instagram: storeData.instagram,
          website: storeData.website,
        },
      });
      // Refresh user to get updated sellerProfile
      await fetchCurrentUser();
      toast.success('Datos de la tienda actualizados');
      setEditingStore(false);
    } catch (error: any) {
      toast.error(error.message || 'Error al actualizar datos de la tienda');
    } finally {
      setSavingStore(false);
    }
  };

  // Change password
  const handleChangePassword = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword) {
      toast.error('Todos los campos son requeridos');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast.error('La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    setSavingPassword(true);
    try {
      await authApi.changePassword(passwordData.currentPassword, passwordData.newPassword);
      toast.success('Contraseña actualizada correctamente');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      toast.error(error.message || 'Error al cambiar contraseña');
    } finally {
      setSavingPassword(false);
    }
  };

  const cancelPersonal = () => {
    if (user) {
      setPersonalData({
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone || '',
        address: user.address || '',
        city: user.city || '',
        avatar: user.avatar || '',
      });
      if (user.bankData) {
        setBankData({
          bankName: user.bankData.bankName || '',
          accountNumber: user.bankData.accountNumber || '',
          accountType: user.bankData.accountType || '',
          holderName: user.bankData.holderName || '',
          documentId: user.bankData.documentId || '', // Correct property name
        });
      }
    }
    setEditingPersonal(false);
  };

  const cancelStore = () => {
    if (user?.sellerProfile) {
      const sp = user.sellerProfile;
      const sl = (sp.socialLinks || {}) as Record<string, string>;
      setStoreData({
        storeName: sp.storeName || '',
        storeSlug: sp.storeSlug || '',
        ruc: sp.ruc || '',
        description: sp.description || '',
        phone: sp.phone || '',
        email: sp.email || '',
        address: sp.address || '',
        whatsappNumber: sp.whatsappNumber || '',
        logo: sp.logo || '',
        banner: sp.banner || '',
        facebook: sl.facebook || '',
        instagram: sl.instagram || '',
        website: sl.website || '',
      });
    }
    setEditingStore(false);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Mi Perfil</h1>
        <p className="text-muted-foreground">Administra tu información personal y de tienda</p>
      </div>

      {/* Profile Header Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-center gap-5">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 p-1">
                <div className="w-full h-full rounded-full bg-background flex items-center justify-center overflow-hidden">
                  {user?.avatar ? (
                    <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl font-bold text-muted-foreground">
                      {user ? getInitials(user.firstName, user.lastName) : 'V'}
                    </span>
                  )}
                </div>
              </div>
              <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center border-2 border-background">
                <Store className="w-3.5 h-3.5 text-white" />
              </div>
            </div>

            <div className="text-center sm:text-left flex-1">
              <h2 className="text-xl font-bold">
                {user?.firstName} {user?.lastName}
              </h2>
              <p className="text-muted-foreground">{user?.email}</p>
              <div className="flex items-center gap-2 mt-1 justify-center sm:justify-start">
                <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 px-2 py-0.5 rounded-full font-medium">
                  Vendedor
                </span>
                {user?.sellerProfile?.isVerified && (
                  <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 px-2 py-0.5 rounded-full font-medium">
                    Verificado
                  </span>
                )}
              </div>
            </div>

            {user?.sellerProfile && (
              <div className="text-center sm:text-right text-sm text-muted-foreground">
                <p>Tienda: <span className="font-medium text-foreground">{user.sellerProfile.storeName}</span></p>
                <p>{user.sellerProfile.totalSales} ventas</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Personal Info */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <UserIcon className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold">Datos Personales</h3>
            </div>
            {!editingPersonal && (
              <Button variant="outline" size="sm" onClick={() => setEditingPersonal(true)}>
                Editar
              </Button>
            )}
          </div>

          {editingPersonal ? (
            <div className="space-y-4">
              <div className="flex justify-center mb-2">
                <ImageUpload
                  value={personalData.avatar || null}
                  onChange={(val) => setPersonalData({ ...personalData, avatar: val || '' })}
                  shape="circle"
                  maxWidth={300}
                  maxHeight={300}
                  label="Foto de perfil"
                />
              </div>
              <p className="text-xs text-center text-muted-foreground -mt-2">Haz clic para subir una foto</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Nombre *</Label>
                  <Input
                    value={personalData.firstName}
                    onChange={(e) => setPersonalData({ ...personalData, firstName: e.target.value })}
                    placeholder="Tu nombre"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Apellido *</Label>
                  <Input
                    value={personalData.lastName}
                    onChange={(e) => setPersonalData({ ...personalData, lastName: e.target.value })}
                    placeholder="Tu apellido"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Teléfono</Label>
                <Input
                  value={personalData.phone}
                  onChange={(e) => setPersonalData({ ...personalData, phone: e.target.value })}
                  placeholder="+1 234 567 890"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Dirección</Label>
                <Input
                  value={personalData.address}
                  onChange={(e) => setPersonalData({ ...personalData, address: e.target.value })}
                  placeholder="Tu dirección"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Ciudad</Label>
                <Input
                  value={personalData.city}
                  onChange={(e) => setPersonalData({ ...personalData, city: e.target.value })}
                  placeholder="Tu ciudad"
                />
              </div>

              <Separator />
              <div className="flex items-center gap-2 mb-2">
                <Banknote className="w-5 h-5 text-green-600" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Datos Bancarios (Para Retiros)</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Banco *</Label>
                  <Input
                    value={bankData.bankName}
                    onChange={(e) => setBankData({ ...bankData, bankName: e.target.value })}
                    placeholder="Ej: Banco Nacional"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Número de Cuenta *</Label>
                  <Input
                    value={bankData.accountNumber}
                    onChange={(e) => setBankData({ ...bankData, accountNumber: e.target.value })}
                    placeholder="0000000000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Titular de la Cuenta *</Label>
                  <Input
                    value={bankData.holderName}
                    onChange={(e) => setBankData({ ...bankData, holderName: e.target.value })}
                    placeholder="Nombre completo"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Documento de Identidad (Titular)</Label>
                  <Input
                    value={bankData.documentId}
                    onChange={(e) => setBankData({ ...bankData, documentId: e.target.value })}
                    placeholder="C.I. / RUC"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={cancelPersonal} disabled={savingPersonal}>
                  Cancelar
                </Button>
                <Button className="flex-1" onClick={handleSavePersonal} disabled={savingPersonal}>
                  {savingPersonal ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  Guardar Perfil
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <InfoRow icon={<Mail className="w-4 h-4" />} label="Correo electrónico" value={user?.email} />
              <InfoRow icon={<Phone className="w-4 h-4" />} label="Teléfono" value={user?.phone} />
              <InfoRow icon={<MapPin className="w-4 h-4" />} label="Dirección" value={user?.address} />
              <InfoRow icon={<MapPin className="w-4 h-4" />} label="Ciudad" value={user?.city} />
              
              <Separator className="my-2" />
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Información de Retiro</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  <InfoRow icon={<Banknote className="w-4 h-4" />} label="Banco" value={user?.bankData?.bankName} />
                  <InfoRow icon={<CreditCard className="w-4 h-4" />} label="Cuenta" value={user?.bankData?.accountNumber} />
                  <InfoRow icon={<UserIcon className="w-4 h-4" />} label="Titular" value={user?.bankData?.holderName} />
                  <InfoRow icon={<FileText className="w-4 h-4" />} label="Doc. Identidad" value={user?.bankData?.documentId} />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Store Info */}
      {user?.sellerProfile && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Store className="w-5 h-5 text-purple-600" />
                <h3 className="text-lg font-semibold">Datos de la Tienda</h3>
              </div>
              {!editingStore && (
                <Button variant="outline" size="sm" onClick={() => setEditingStore(true)}>
                  Editar
                </Button>
              )}
            </div>

            {editingStore ? (
              <div className="space-y-4">
                {/* Logo & Banner */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Logo de la tienda</Label>
                    <ImageUpload
                      value={storeData.logo || null}
                      onChange={(val) => setStoreData({ ...storeData, logo: val || '' })}
                      shape="circle"
                      maxWidth={200}
                      maxHeight={200}
                      label="Logo"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Banner</Label>
                    <ImageUpload
                      value={storeData.banner || null}
                      onChange={(val) => setStoreData({ ...storeData, banner: val || '' })}
                      shape="rect"
                      maxWidth={800}
                      maxHeight={400}
                      label="Banner de la tienda"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Nombre de la tienda *</Label>
                  <Input
                    value={storeData.storeName}
                    onChange={(e) => setStoreData({ ...storeData, storeName: e.target.value })}
                    placeholder="Nombre de tu tienda"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>RUC de la tienda</Label>
                  <Input
                    value={storeData.ruc}
                    onChange={(e) => setStoreData({ ...storeData, ruc: e.target.value })}
                    placeholder="80000000-0"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>URL de la tienda (slug)</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground whitespace-nowrap">/tienda/</span>
                    <Input
                      value={storeData.storeSlug}
                      onChange={(e) => setStoreData({ ...storeData, storeSlug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                      placeholder="mi-tienda"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Solo letras minusculas, numeros y guiones. Este es el enlace publico de tu tienda.</p>
                </div>

                <div className="space-y-1.5">
                  <Label>Descripción</Label>
                  <Textarea
                    value={storeData.description}
                    onChange={(e) => setStoreData({ ...storeData, description: e.target.value })}
                    placeholder="Describe tu tienda..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Teléfono de la tienda</Label>
                    <Input
                      value={storeData.phone}
                      onChange={(e) => setStoreData({ ...storeData, phone: e.target.value })}
                      placeholder="+1 234 567 890"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Email de la tienda</Label>
                    <Input
                      type="email"
                      value={storeData.email}
                      onChange={(e) => setStoreData({ ...storeData, email: e.target.value })}
                      placeholder="tienda@email.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Dirección de la tienda</Label>
                    <Input
                      value={storeData.address}
                      onChange={(e) => setStoreData({ ...storeData, address: e.target.value })}
                      placeholder="Dirección de la tienda"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>WhatsApp</Label>
                    <Input
                      value={storeData.whatsappNumber}
                      onChange={(e) => setStoreData({ ...storeData, whatsappNumber: e.target.value })}
                      placeholder="+1 234 567 890"
                    />
                  </div>
                </div>

                <Separator />

                <p className="text-sm font-medium text-muted-foreground">Redes Sociales</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Facebook</Label>
                    <Input
                      value={storeData.facebook}
                      onChange={(e) => setStoreData({ ...storeData, facebook: e.target.value })}
                      placeholder="https://facebook.com/tu-tienda"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Instagram</Label>
                    <Input
                      value={storeData.instagram}
                      onChange={(e) => setStoreData({ ...storeData, instagram: e.target.value })}
                      placeholder="https://instagram.com/tu-tienda"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Sitio Web</Label>
                  <Input
                    value={storeData.website}
                    onChange={(e) => setStoreData({ ...storeData, website: e.target.value })}
                    placeholder="https://tu-tienda.com"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" className="flex-1" onClick={cancelStore} disabled={savingStore}>
                    Cancelar
                  </Button>
                  <Button className="flex-1" onClick={handleSaveStore} disabled={savingStore}>
                    {savingStore ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                    Guardar Tienda
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <InfoRow icon={<Store className="w-4 h-4" />} label="Nombre de la tienda" value={user.sellerProfile.storeName} />
                <div className="flex items-center gap-3 py-1.5">
                  <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center text-muted-foreground shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground">RUC</p>
                    <p className="text-sm font-medium truncate">{user.sellerProfile.ruc || 'No especificado'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 py-1.5">
                  <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center text-muted-foreground shrink-0">
                    <LinkIcon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground">URL de la tienda</p>
                    <a href={`/tienda/${user.sellerProfile.storeSlug}?from=vendedor`} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-blue-600 hover:underline flex items-center gap-1">
                      /tienda/{user.sellerProfile.storeSlug} <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
                <InfoRow icon={<Mail className="w-4 h-4" />} label="Email de la tienda" value={user.sellerProfile.email} />
                <InfoRow icon={<Phone className="w-4 h-4" />} label="Teléfono de la tienda" value={user.sellerProfile.phone} />
                <InfoRow icon={<MessageCircle className="w-4 h-4" />} label="WhatsApp" value={user.sellerProfile.whatsappNumber} />
                <InfoRow icon={<MapPin className="w-4 h-4" />} label="Dirección de la tienda" value={user.sellerProfile.address} />
                {user.sellerProfile.description && (
                  <div className="pt-1">
                    <p className="text-sm text-muted-foreground mb-1">Descripción</p>
                    <p className="text-sm">{user.sellerProfile.description}</p>
                  </div>
                )}
                {(storeData.facebook || storeData.instagram || storeData.website) && (
                  <div className="pt-1">
                    <p className="text-sm text-muted-foreground mb-1">Redes Sociales</p>
                    <div className="flex flex-wrap gap-2">
                      {storeData.facebook && (
                        <a href={storeData.facebook} target="_blank" rel="noopener noreferrer" className="text-xs bg-muted px-2 py-1 rounded-full hover:bg-muted/80">Facebook</a>
                      )}
                      {storeData.instagram && (
                        <a href={storeData.instagram} target="_blank" rel="noopener noreferrer" className="text-xs bg-muted px-2 py-1 rounded-full hover:bg-muted/80">Instagram</a>
                      )}
                      {storeData.website && (
                        <a href={storeData.website} target="_blank" rel="noopener noreferrer" className="text-xs bg-muted px-2 py-1 rounded-full hover:bg-muted/80">Web</a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}


    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string | null }) {
  return (
    <div className="flex items-center gap-3 py-1.5">
      <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center text-muted-foreground shrink-0">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium truncate">{value || 'No especificado'}</p>
      </div>
    </div>
  );
}
