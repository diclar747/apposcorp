import { useState } from 'react';
import { motion } from 'framer-motion';
import { Store, MapPin, Phone, Mail, Clock, Globe, Instagram, Facebook, Edit, Camera, Check } from 'lucide-react';
import { useAuthStore } from '@/stores';
import { mockStores } from '@/data/mockData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';

const daysOfWeek = [
  { key: 'monday', label: 'Lunes' },
  { key: 'tuesday', label: 'Martes' },
  { key: 'wednesday', label: 'Miércoles' },
  { key: 'thursday', label: 'Jueves' },
  { key: 'friday', label: 'Viernes' },
  { key: 'saturday', label: 'Sábado' },
  { key: 'sunday', label: 'Domingo' },
];

export default function SellerStore() {
  const { user } = useAuthStore();
  const store = mockStores.find(s => s.sellerId === user?.id);
  const [isEditing, setIsEditing] = useState(false);
  const [isOnline, setIsOnline] = useState(store?.isOnline ?? true);

  if (!store) {
    return (
      <div className="text-center py-12">
        <Store className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900">No tienes una tienda</h2>
        <p className="text-gray-500 mb-4">Crea tu tienda para comenzar a vender</p>
        <Button className="bg-green-600">Crear Tienda</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mi Tienda</h1>
          <p className="text-gray-500">Gestiona la información de tu tienda</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch checked={isOnline} onCheckedChange={setIsOnline} />
            <span className="text-sm">{isOnline ? 'En línea' : 'Offline'}</span>
          </div>
          <Button variant="outline" onClick={() => setIsEditing(!isEditing)}>
            <Edit className="w-4 h-4 mr-2" />
            {isEditing ? 'Guardar' : 'Editar'}
          </Button>
        </div>
      </div>

      {/* Banner */}
      <div className="relative h-48 rounded-2xl overflow-hidden">
        {store.banner ? (
          <img src={store.banner} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-green-400 to-emerald-600" />
        )}
        <button className="absolute bottom-4 right-4 p-2 bg-white/80 rounded-lg hover:bg-white transition-colors">
          <Camera className="w-5 h-5" />
        </button>
      </div>

      {/* Store Info */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-4 -mt-16 relative">
            <div className="w-32 h-32 rounded-2xl bg-white p-2 shadow-lg">
              {store.logo ? (
                <img src={store.logo} alt={store.name} className="w-full h-full rounded-xl object-cover" />
              ) : (
                <div className="w-full h-full rounded-xl bg-gray-100 flex items-center justify-center">
                  <Store className="w-12 h-12 text-gray-400" />
                </div>
              )}
            </div>
            <div className="pt-16 flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold text-gray-900">{store.name}</h2>
                <Badge className="bg-green-100 text-green-700">
                  <Check className="w-3 h-3 mr-1" />
                  Verificada
                </Badge>
              </div>
              <p className="text-gray-500 mt-1">{store.description}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Información de Contacto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-gray-400" />
              <span className="text-gray-700">{store.address}</span>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-gray-400" />
              <span className="text-gray-700">{store.phone}</span>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-gray-400" />
              <span className="text-gray-700">{store.email}</span>
            </div>
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-gray-400" />
              <span className="text-gray-700">WhatsApp: {store.whatsappNumber}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Redes Sociales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {store.socialLinks.facebook && (
              <div className="flex items-center gap-3">
                <Facebook className="w-5 h-5 text-blue-600" />
                <span className="text-gray-700">{store.socialLinks.facebook}</span>
              </div>
            )}
            {store.socialLinks.instagram && (
              <div className="flex items-center gap-3">
                <Instagram className="w-5 h-5 text-pink-600" />
                <span className="text-gray-700">{store.socialLinks.instagram}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Business Hours */}
      <Card>
        <CardHeader>
          <CardTitle>Horarios de Atención</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {daysOfWeek.map((day) => {
              const hours = store.businessHours[day.key as keyof typeof store.businessHours];
              return (
                <div key={day.key} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <span className="font-medium text-gray-700">{day.label}</span>
                  <span className="text-gray-600">
                    {hours.isOpen ? `${hours.open} - ${hours.close}` : 'Cerrado'}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
