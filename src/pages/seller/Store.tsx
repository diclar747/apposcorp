import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Store, MapPin, Phone, Mail, Globe, Instagram, Facebook, Edit, Camera, Check, Save, X, Loader2, Clock } from 'lucide-react';
import { useAuthStore } from '@/stores';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { usersApi } from '@/lib/api';
import { ImageUpload } from '@/components/shared/ImageUpload';

export default function SellerStore() {
  const { user, fetchCurrentUser } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  // Ensure we have fresh user data with sellerProfile
  useEffect(() => {
    if (!user?.sellerProfile) {
      fetchCurrentUser();
    }
  }, []);

  // Form State
  const [formData, setFormData] = useState({
    storeName: '',
    description: '',
    address: '',
    phone: '',
    email: '',
    whatsappNumber: '',
    logo: '',
    banner: '',
    facebook: '',
    instagram: '',
    businessHours: {
      monday: { isOpen: true, open: '08:00', close: '18:00' },
      tuesday: { isOpen: true, open: '08:00', close: '18:00' },
      wednesday: { isOpen: true, open: '08:00', close: '18:00' },
      thursday: { isOpen: true, open: '08:00', close: '18:00' },
      friday: { isOpen: true, open: '08:00', close: '18:00' },
      saturday: { isOpen: true, open: '08:00', close: '13:00' },
      sunday: { isOpen: false, open: '00:00', close: '00:00' },
    }
  });

  // Load user data into form
  useEffect(() => {
    if (user?.sellerProfile) {
      const p = user.sellerProfile;
      setFormData({
        storeName: p.storeName || '',
        description: p.description || '',
        address: p.address || '',
        phone: p.phone || '',
        email: p.email || '',
        whatsappNumber: p.whatsappNumber || '',
        logo: p.logo || '',
        banner: p.banner || '',
        facebook: (p.socialLinks as any)?.facebook || '',
        instagram: (p.socialLinks as any)?.instagram || '',
        businessHours: (p.businessHours as any) || {
          monday: { isOpen: true, open: '08:00', close: '18:00' },
          tuesday: { isOpen: true, open: '08:00', close: '18:00' },
          wednesday: { isOpen: true, open: '08:00', close: '18:00' },
          thursday: { isOpen: true, open: '08:00', close: '18:00' },
          friday: { isOpen: true, open: '08:00', close: '18:00' },
          saturday: { isOpen: true, open: '08:00', close: '13:00' },
          sunday: { isOpen: false, open: '00:00', close: '00:00' },
        },
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await usersApi.updateSellerProfile({
        ...formData,
        socialLinks: {
          facebook: formData.facebook,
          instagram: formData.instagram
        }
      });
      await fetchCurrentUser(); // Refresh global user state
      toast.success('Tienda actualizada con éxito');
      setIsEditing(false);
    } catch (error) {
      console.error(error);
      toast.error('Error al guardar cambios');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset form to current user data
    if (user?.sellerProfile) {
      const p = user.sellerProfile;
      setFormData({
        storeName: p.storeName || '',
        description: p.description || '',
        address: p.address || '',
        phone: p.phone || '',
        email: p.email || '',
        whatsappNumber: p.whatsappNumber || '',
        logo: p.logo || '',
        banner: p.banner || '',
        facebook: (p.socialLinks as any)?.facebook || '',
        instagram: (p.socialLinks as any)?.instagram || '',
        businessHours: (p.businessHours as any) || formData.businessHours,
      });
    }
  };

  // Initial setup form when sellerProfile is not loaded yet
  const handleInitialSetup = async () => {
    setLoading(true);
    try {
      await usersApi.updateSellerProfile({
        ...formData,
        socialLinks: {
          facebook: formData.facebook,
          instagram: formData.instagram
        }
      });
      await fetchCurrentUser();
      toast.success('¡Tienda configurada con éxito! Ya puedes comenzar a vender.');
    } catch (error) {
      console.error(error);
      toast.error('Error al configurar la tienda');
    } finally {
      setLoading(false);
    }
  };

  if (!user?.sellerProfile) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 pb-20">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center mx-auto mb-4">
            <Store className="w-10 h-10 text-blue-600" />
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Configura tu Tienda</h1>
          <p className="text-gray-500 mt-2">Completa los datos de tu negocio para comenzar a vender. Tienes 7 días de prueba gratis.</p>
        </div>

        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="storeName">Nombre de la Tienda *</Label>
                <Input id="storeName" name="storeName" value={formData.storeName} onChange={handleChange} placeholder="Mi Tienda" />
              </div>
              <div>
                <Label htmlFor="email">Email de la Tienda</Label>
                <Input id="email" name="email" value={formData.email} onChange={handleChange} placeholder="tienda@email.com" />
              </div>
            </div>
            <div>
              <Label htmlFor="description">Descripción</Label>
              <Textarea id="description" name="description" value={formData.description} onChange={handleChange} placeholder="Describe tu negocio..." rows={3} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="address">Dirección</Label>
                <Input id="address" name="address" value={formData.address} onChange={handleChange} placeholder="Calle, Ciudad" />
              </div>
              <div>
                <Label htmlFor="phone">Teléfono</Label>
                <Input id="phone" name="phone" value={formData.phone} onChange={handleChange} placeholder="+595 ..." />
              </div>
            </div>
            <div>
              <Label htmlFor="whatsappNumber">WhatsApp Business</Label>
              <Input id="whatsappNumber" name="whatsappNumber" value={formData.whatsappNumber} onChange={handleChange} placeholder="+595 ..." />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Logo de la Tienda</Label>
                <ImageUpload
                  value={formData.logo || null}
                  onChange={(val) => setFormData({ ...formData, logo: val || '' })}
                  shape="circle"
                  maxWidth={300}
                  maxHeight={300}
                  label="Logo"
                />
              </div>
              <div>
                <Label>Banner de la Tienda</Label>
                <ImageUpload
                  value={formData.banner || null}
                  onChange={(val) => setFormData({ ...formData, banner: val || '' })}
                  shape="rect"
                  maxWidth={800}
                  maxHeight={400}
                  label="Banner"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="facebook">Facebook</Label>
                <Input id="facebook" name="facebook" value={formData.facebook} onChange={handleChange} placeholder="facebook.com/mitienda" />
              </div>
              <div>
                <Label htmlFor="instagram">Instagram</Label>
                <Input id="instagram" name="instagram" value={formData.instagram} onChange={handleChange} placeholder="@mitienda" />
              </div>
            </div>

            <Button onClick={handleInitialSetup} disabled={loading || !formData.storeName} className="w-full h-12 bg-blue-600 hover:bg-blue-700 font-bold text-lg mt-4">
              {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
              Crear Mi Tienda
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Mi Tienda</h1>
          <p className="text-sm text-gray-500">Gestiona la información pública de tu negocio</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-2">
            <Switch checked={isOnline} onCheckedChange={setIsOnline} />
            <span className="text-sm">{isOnline ? 'En línea' : 'Offline'}</span>
          </div>
          {!isEditing ? (
            <Button variant="outline" onClick={() => setIsEditing(true)} size="sm" className="sm:text-base">
              <Edit className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Editar Tienda</span>
              <span className="sm:hidden">Editar</span>
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="ghost" onClick={handleCancel} disabled={loading} size="sm">
                <X className="w-4 h-4 mr-2" /> <span className="hidden sm:inline">Cancelar</span>
              </Button>
              <Button onClick={handleSave} disabled={loading} className="bg-green-600 hover:bg-green-700" size="sm">
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                <span className="hidden sm:inline">Guardar</span>
                <span className="sm:hidden">OK</span>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Banner */}
      <div className="relative group rounded-xl sm:rounded-2xl overflow-hidden h-32 sm:h-48 md:h-64 bg-gray-100 border border-gray-200">
        {formData.banner ? (
          <img src={formData.banner} alt="Banner" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white/50">
            <span className="text-4xl font-black uppercase opacity-20">Banner</span>
          </div>
        )}

        {isEditing && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <ImageUpload
              value={formData.banner || null}
              onChange={(val) => setFormData({ ...formData, banner: val || '' })}
              shape="rect"
              maxWidth={800}
              maxHeight={400}
              label="Cambiar Banner"
            />
          </div>
        )}
      </div>

      {/* Main Info Card */}
      <Card className="overflow-visible">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 sm:gap-6 -mt-12 sm:-mt-16 md:-mt-20">
            {/* Logo */}
            <div className="relative shrink-0">
              <div className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-xl sm:rounded-2xl bg-white p-1.5 sm:p-2 shadow-xl border border-gray-100 mx-auto md:mx-0">
                {formData.logo ? (
                  <img src={formData.logo} alt="Logo" className="w-full h-full rounded-xl object-cover" />
                ) : (
                  <div className="w-full h-full rounded-xl bg-gray-50 flex items-center justify-center">
                    <Store className="w-12 h-12 text-gray-300" />
                  </div>
                )}
              </div>
              {isEditing && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-2xl">
                  <ImageUpload
                    value={formData.logo || null}
                    onChange={(val) => setFormData({ ...formData, logo: val || '' })}
                    shape="circle"
                    maxWidth={300}
                    maxHeight={300}
                    label="Logo"
                  />
                </div>
              )}
            </div>

            {/* Main Text Info */}
            <div className="flex-1 pt-4 md:pt-16 space-y-4">
              {isEditing ? (
                <div className="space-y-4 max-w-2xl">
                  <div>
                    <Label>Nombre de la Tienda</Label>
                    <Input
                      name="storeName"
                      value={formData.storeName}
                      onChange={handleChange}
                      className="text-lg font-bold"
                    />
                  </div>
                  <div>
                    <Label>Descripción Corta</Label>
                    <Textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows={2}
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h2 className="text-3xl font-bold text-gray-900">{formData.storeName || 'Nombre de Tienda'}</h2>
                    <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-0">
                      <Check className="w-3 h-3 mr-1" /> Verificada
                    </Badge>
                  </div>
                  <p className="text-gray-600 text-lg leading-relaxed">{formData.description || 'Sin descripción'}</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Contact Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-gray-400" />
              Información de Contacto
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing ? (
              <>
                <div className="space-y-1">
                  <Label className="text-xs">Dirección</Label>
                  <Input name="address" value={formData.address} onChange={handleChange} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Teléfono</Label>
                  <Input name="phone" value={formData.phone} onChange={handleChange} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Email de Contacto</Label>
                  <Input name="email" value={formData.email} onChange={handleChange} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">WhatsApp Business</Label>
                  <Input name="whatsappNumber" value={formData.whatsappNumber} onChange={handleChange} placeholder="+595..." />
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-700">{formData.address || 'No especificada'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-700">{formData.phone || 'No especificado'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-700">{formData.email || 'No especificado'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Globe className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-700">WA: {formData.whatsappNumber || 'No especificado'}</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Social Meta */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-gray-400" />
              Redes y Enlaces
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing ? (
              <>
                <div className="space-y-1">
                  <Label className="text-xs">Facebook (Usuario/Link)</Label>
                  <div className="relative">
                    <Facebook className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <Input name="facebook" value={formData.facebook} onChange={handleChange} className="pl-9" placeholder="facebook.com/..." />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Instagram (Usuario)</Label>
                  <div className="relative">
                    <Instagram className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <Input name="instagram" value={formData.instagram} onChange={handleChange} className="pl-9" placeholder="@usuario" />
                  </div>
                </div>
              </>
            ) : (
              <>
                {formData.facebook ? (
                  <div className="flex items-center gap-3 text-sm p-3 bg-blue-50 text-blue-700 rounded-lg">
                    <Facebook className="w-5 h-5" />
                    <span className="font-medium">{formData.facebook}</span>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 italic">Facebook no configurado</p>
                )}

                {formData.instagram ? (
                  <div className="flex items-center gap-3 text-sm p-3 bg-pink-50 text-pink-700 rounded-lg">
                    <Instagram className="w-5 h-5" />
                    <span className="font-medium">{formData.instagram}</span>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 italic">Instagram no configurado</p>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Business Hours */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-400" />
              Horarios de Atención
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => {
                const hours = (formData.businessHours as any)[day];
                if (!hours) return null;
                
                return (
                  <div key={day} className="space-y-3 p-4 bg-gray-50 dark:bg-slate-900 border border-gray-100 rounded-2xl">
                    <div className="flex items-center justify-between">
                      <span className="font-bold capitalize text-sm">{
                        day === 'monday' ? 'Lunes' :
                        day === 'tuesday' ? 'Martes' :
                        day === 'wednesday' ? 'Miércoles' :
                        day === 'thursday' ? 'Jueves' :
                        day === 'friday' ? 'Viernes' :
                        day === 'saturday' ? 'Sábado' : 'Domingo'
                      }</span>
                      <Switch 
                        disabled={!isEditing}
                        checked={hours.isOpen}
                        onCheckedChange={(checked) => {
                          setFormData({
                            ...formData,
                            businessHours: {
                              ...formData.businessHours,
                              [day]: { ...hours, isOpen: checked }
                            }
                          });
                        }}
                      />
                    </div>
                    
                    {hours.isOpen && (
                      <div className="flex items-center gap-2">
                        <Input
                          type="time"
                          disabled={!isEditing}
                          value={hours.open}
                          onChange={(e) => {
                            setFormData({
                              ...formData,
                              businessHours: {
                                ...formData.businessHours,
                                [day]: { ...hours, open: e.target.value }
                              }
                            });
                          }}
                          className="h-9 px-2 text-xs"
                        />
                        <span className="text-gray-400">-</span>
                        <Input
                          type="time"
                          disabled={!isEditing}
                          value={hours.close}
                          onChange={(e) => {
                            setFormData({
                              ...formData,
                              businessHours: {
                                ...formData.businessHours,
                                [day]: { ...hours, close: e.target.value }
                              }
                            });
                          }}
                          className="h-9 px-2 text-xs"
                        />
                      </div>
                    )}
                    {!hours.isOpen && (
                      <div className="h-9 flex items-center justify-center text-xs text-red-400 font-bold italic bg-white rounded-lg">
                        Cerrado
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
