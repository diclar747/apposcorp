import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Edit,
  Save,
  X,
  Lock,
  Camera,
  Loader2,
  Eye,
  EyeOff,
  Store,
  Building
} from 'lucide-react';
import { useAuthStore } from '@/stores';
import { getInitials } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { authApi } from '@/lib/api';

export default function SellerProfile() {
  const { user, updateUser, fetchCurrentUser } = useAuthStore();

  // Profile editing state
  const [isEditing, setIsEditing] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    city: '',
    avatar: '',
  });

  // Password change state
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone || '',
        address: user.address || '',
        city: user.city || '',
        avatar: user.avatar || '',
      });
    }
  }, [user]);

  const initEdit = () => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone || '',
        address: user.address || '',
        city: user.city || '',
        avatar: user.avatar || '',
      });
      setIsEditing(true);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone || '',
        address: user.address || '',
        city: user.city || '',
        avatar: user.avatar || '',
      });
    }
  };

  const handleSaveProfile = async () => {
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      toast.error('Nombre y apellido son requeridos');
      return;
    }

    setProfileLoading(true);
    try {
      const success = await updateUser(formData);
      if (success) {
        toast.success('Perfil actualizado correctamente');
        setIsEditing(false);
        await fetchCurrentUser();
      } else {
        toast.error('Error al actualizar perfil');
      }
    } catch {
      toast.error('Error al actualizar perfil');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordData.currentPassword) {
      toast.error('Ingresa tu contraseña actual');
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

    setPasswordLoading(true);
    try {
      await authApi.changePassword(passwordData.currentPassword, passwordData.newPassword);
      toast.success('Contraseña actualizada correctamente');
      setIsChangingPassword(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      toast.error(error.message || 'Error al cambiar contraseña');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleCancelPassword = () => {
    setIsChangingPassword(false);
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  if (!user) {
    return (
      <div className="text-center py-12">
        <Loader2 className="w-10 h-10 animate-spin text-green-600 mx-auto mb-4" />
        <p className="text-gray-500">Cargando perfil...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mi Perfil</h1>
          <p className="text-gray-500 dark:text-gray-400">Gestiona tu información personal y seguridad</p>
        </div>
      </div>

      {/* Profile Card - Avatar + Basic Info */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              {/* Avatar */}
              <div className="relative">
                <Avatar className="w-28 h-28 ring-4 ring-green-100 dark:ring-green-900">
                  <AvatarImage src={isEditing ? formData.avatar : user.avatar} />
                  <AvatarFallback className="bg-gradient-to-br from-green-500 to-emerald-600 text-white text-2xl font-bold">
                    {getInitials(user.firstName, user.lastName)}
                  </AvatarFallback>
                </Avatar>
                {!isEditing && (
                  <button
                    onClick={initEdit}
                    className="absolute -bottom-1 -right-1 w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white hover:bg-green-700 transition-colors shadow-lg"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Name and Info */}
              {!isEditing ? (
                <div className="flex-1 text-center sm:text-left">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {user.firstName} {user.lastName}
                  </h2>
                  <p className="text-gray-500 dark:text-gray-400 mt-1">{user.email}</p>
                  {user.sellerProfile?.storeName && (
                    <div className="flex items-center gap-2 mt-2 justify-center sm:justify-start">
                      <Store className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-green-700 dark:text-green-400 font-medium">
                        {user.sellerProfile.storeName}
                      </span>
                    </div>
                  )}
                  <Button variant="outline" size="sm" className="mt-4" onClick={initEdit}>
                    <Edit className="w-4 h-4 mr-2" />
                    Editar Perfil
                  </Button>
                </div>
              ) : (
                <div className="flex-1 w-full">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Editando Perfil</h3>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={handleCancelEdit} disabled={profileLoading}>
                        <X className="w-4 h-4 mr-1" /> Cancelar
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSaveProfile}
                        disabled={profileLoading}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {profileLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-1" />
                        ) : (
                          <Save className="w-4 h-4 mr-1" />
                        )}
                        Guardar
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Avatar URL */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">URL del Avatar</Label>
                      <div className="relative">
                        <Camera className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                        <Input
                          value={formData.avatar}
                          onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                          placeholder="https://ejemplo.com/mi-foto.jpg"
                          className="pl-9"
                        />
                      </div>
                    </div>

                    {/* Name fields */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Nombre</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                          <Input
                            value={formData.firstName}
                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                            placeholder="Tu nombre"
                            className="pl-9"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Apellido</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                          <Input
                            value={formData.lastName}
                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                            placeholder="Tu apellido"
                            className="pl-9"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Phone */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Telefono</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                        <Input
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="+595 981 123456"
                          className="pl-9"
                        />
                      </div>
                    </div>

                    {/* Address */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Direccion</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                        <Input
                          value={formData.address}
                          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                          placeholder="Tu direccion"
                          className="pl-9"
                        />
                      </div>
                    </div>

                    {/* City */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Ciudad</Label>
                      <div className="relative">
                        <Building className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                        <Input
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                          placeholder="Tu ciudad"
                          className="pl-9"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Info Display Cards (when not editing) */}
      {!isEditing && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Correo electronico</p>
                  <p className="font-medium text-gray-900 dark:text-white truncate">{user.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                  <Phone className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Telefono</p>
                  <p className="font-medium text-gray-900 dark:text-white">{user.phone || 'No especificado'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Direccion</p>
                  <p className="font-medium text-gray-900 dark:text-white">{user.address || 'No especificada'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                  <Building className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Ciudad</p>
                  <p className="font-medium text-gray-900 dark:text-white">{user.city || 'No especificada'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Password Change Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Lock className="w-5 h-5 text-gray-400" />
              Seguridad
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!isChangingPassword ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Contraseña</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Cambia tu contraseña de acceso al sistema</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setIsChangingPassword(true)}>
                  <Lock className="w-4 h-4 mr-2" />
                  Cambiar Contraseña
                </Button>
              </div>
            ) : (
              <div className="space-y-4 max-w-md">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Contraseña Actual</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <Input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      placeholder="Tu contraseña actual"
                      className="pl-9 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Nueva Contraseña</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <Input
                      type={showNewPassword ? 'text' : 'password'}
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      placeholder="Minimo 6 caracteres"
                      className="pl-9 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Confirmar Nueva Contraseña</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <Input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      placeholder="Repite la nueva contraseña"
                      className="pl-9 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button variant="ghost" onClick={handleCancelPassword} disabled={passwordLoading}>
                    <X className="w-4 h-4 mr-1" /> Cancelar
                  </Button>
                  <Button
                    onClick={handleChangePassword}
                    disabled={passwordLoading}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {passwordLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-1" />
                    ) : (
                      <Save className="w-4 h-4 mr-1" />
                    )}
                    Guardar Contraseña
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
