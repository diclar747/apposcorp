import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Store, MapPin, Phone, Mail, Globe, Instagram, Facebook, Edit, Camera, Check, Save, X, Loader2 } from 'lucide-react';
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

export default function SellerStore() {
  const { user, fetchCurrentUser } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(true); // This should ideally come from backend

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
    instagram: ''
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
      });
    }
  };

  if (!user?.sellerProfile) {
    return (
      <div className="text-center py-12">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-4" />
        <p className="text-gray-500">Cargando perfil de tienda...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mi Tienda</h1>
          <p className="text-gray-500">Gestiona la información pública de tu negocio</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch checked={isOnline} onCheckedChange={setIsOnline} />
            <span className="text-sm">{isOnline ? 'En línea' : 'Offline'}</span>
          </div>
          {!isEditing ? (
            <Button variant="outline" onClick={() => setIsEditing(true)}>
              <Edit className="w-4 h-4 mr-2" />
              Editar Tienda
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="ghost" onClick={handleCancel} disabled={loading}>
                <X className="w-4 h-4 mr-2" /> Cancelar
              </Button>
              <Button onClick={handleSave} disabled={loading} className="bg-green-600 hover:bg-green-700">
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Guardar Cambios
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Banner */}
      <div className="relative group rounded-2xl overflow-hidden h-48 md:h-64 bg-gray-100 border border-gray-200">
        {formData.banner ? (
          <img src={formData.banner} alt="Banner" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white/50">
            <span className="text-4xl font-black uppercase opacity-20">Banner</span>
          </div>
        )}

        {isEditing && (
          <div className="absolute inset-x-0 bottom-0 p-4 bg-black/60 backdrop-blur-sm flex items-center gap-3">
            <Camera className="w-5 h-5 text-white" />
            <Input
              name="banner"
              value={formData.banner}
              onChange={handleChange}
              placeholder="URL del Banner (https://...)"
              className="bg-white/10 border-white/20 text-white placeholder:text-white/50 h-9"
            />
          </div>
        )}
      </div>

      {/* Main Info Card */}
      <Card className="overflow-visible">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6 -mt-16 md:-mt-20">
            {/* Logo */}
            <div className="relative shrink-0">
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-2xl bg-white p-2 shadow-xl border border-gray-100">
                {formData.logo ? (
                  <img src={formData.logo} alt="Logo" className="w-full h-full rounded-xl object-cover" />
                ) : (
                  <div className="w-full h-full rounded-xl bg-gray-50 flex items-center justify-center">
                    <Store className="w-12 h-12 text-gray-300" />
                  </div>
                )}
              </div>
              {isEditing && (
                <div className="absolute -bottom-10 inset-x-0 pt-2 z-10">
                  <Input
                    name="logo"
                    value={formData.logo}
                    onChange={handleChange}
                    placeholder="URL Logo"
                    className="bg-white shadow-lg text-xs h-8"
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

        {/* Social and Config */}
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
      </div>
    </div>
  );
}
