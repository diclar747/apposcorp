import { useState } from 'react';
import { User, Mail, Phone, MapPin, Store } from 'lucide-react';
import { useAuthStore } from '@/stores';
import { getInitials } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ImageUpload } from '@/components/shared/ImageUpload';

export default function SellerProfile() {
  const { user, updateUser } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    city: '',
    avatar: ''
  });

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

  const handleSave = async () => {
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

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mi Perfil</h1>
        <p className="text-gray-500">Datos personales del vendedor</p>
      </div>

      <Card>
        <CardContent className="p-6">
          {isEditing ? (
            <div className="space-y-4">
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
                <Button className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600" onClick={handleSave}>Guardar Cambios</Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 p-1">
                  <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                    {user?.avatar ? (
                      <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl font-bold text-gray-700">
                        {user ? getInitials(user.firstName, user.lastName) : 'V'}
                      </span>
                    )}
                  </div>
                </div>
                <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center border-2 border-white">
                  <Store className="w-3.5 h-3.5 text-white" />
                </div>
              </div>

              <h2 className="text-xl font-bold text-gray-900 mt-4">
                {user?.firstName} {user?.lastName}
              </h2>
              <p className="text-gray-500">{user?.email}</p>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full mt-1 font-medium">Vendedor</span>

              <Button variant="outline" size="sm" className="mt-4" onClick={initEdit}>
                Editar perfil
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Cards */}
      <div className="space-y-3">
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
    </div>
  );
}
