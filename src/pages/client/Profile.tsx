import { useState } from 'react';
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
import { useAuthStore } from '@/stores';
import { getInitials } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const menuItems = [
  { icon: User, label: 'Editar perfil', href: '#' },
  { icon: Shield, label: 'Seguridad', href: '#' },
  { icon: CreditCard, label: 'Métodos de pago', href: '#' },
  { icon: Bell, label: 'Notificaciones', href: '#' },
  { icon: HelpCircle, label: 'Ayuda y soporte', href: '#' },
  { icon: FileText, label: 'Términos y condiciones', href: '#' },
];

export default function ClientProfile() {
  const { user, logout } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);

  const handleLogout = () => {
    logout();
    toast.success('Sesión cerrada');
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
                <button className="absolute bottom-0 right-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
                  <Camera className="w-4 h-4 text-white" />
                </button>
              </div>
              
              <h2 className="text-xl font-bold text-gray-900 mt-4">
                {user?.firstName} {user?.lastName}
              </h2>
              <p className="text-gray-500">{user?.email}</p>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-4"
                onClick={() => setIsEditing(!isEditing)}
              >
                <Edit className="w-4 h-4 mr-2" />
                Editar perfil
              </Button>
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

      {/* Menu */}
      <div className="px-4">
        <Card>
          <CardContent className="p-0">
            {menuItems.map((item, index) => (
              <button
                key={item.label}
                className={`w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors ${
                  index !== menuItems.length - 1 ? 'border-b border-gray-100' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon className="w-5 h-5 text-gray-500" />
                  <span className="text-gray-700">{item.label}</span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
            ))}
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
