import { useState, useEffect } from "react";
import { useAuthStore } from "@/stores";
import { usersApi } from "@/lib/api";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ImageUpload } from "@/components/shared/ImageUpload";
import { User, Shield, Save, Key, Eye, EyeOff } from "lucide-react";

export default function IngenioProfile() {
  const { user, fetchCurrentUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [passLoading, setPassLoading] = useState(false);

  // Personal Info State
  const [profileData, setProfileData] = useState({
    name: "",
    phone: "",
    city: "",
    avatar: "" as string | null,
  });

  // Password State
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPassRaw, setShowPassRaw] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        name: `${user.firstName}${user.lastName ? " " + user.lastName : ""}`,
        phone: user.phone || "",
        city: user.city || "",
        avatar: user.avatar || "",
      });
    }
  }, [user]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await usersApi.updateProfile(profileData);
      await fetchCurrentUser();
      toast.success("Perfil actualizado con éxito");
    } catch (error: any) {
      toast.error(error.message || "Error al actualizar el perfil");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwords.newPassword !== passwords.confirmPassword) {
      return toast.error("La nueva contraseña y su confirmación no coinciden");
    }

    if (passwords.newPassword === passwords.currentPassword) {
      return toast.error("La nueva contraseña no puede ser igual a la actual");
    }

    const hasLetter = /[a-zA-Z]/.test(passwords.newPassword);
    const hasNumber = /[0-9]/.test(passwords.newPassword);

    if (passwords.newPassword.length < 8) {
      return toast.error("La nueva contraseña debe tener al menos 8 caracteres");
    }

    if (!hasLetter || !hasNumber) {
      return toast.error("La contraseña debe incluir al menos una letra y un número");
    }

    setPassLoading(true);
    try {
      await usersApi.updatePassword({
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      setPasswords({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      toast.success("Contraseña actualizada con éxito");
    } catch (error: any) {
      toast.error(error.message || "Error al cambiar la contraseña");
    } finally {
      setPassLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Mi Perfil</h1>
        <p className="text-slate-500 dark:text-slate-400">Gestiona tu información personal y configuración de seguridad</p>
      </div>

      <Tabs defaultValue="personal" className="w-full">
        <TabsList className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <TabsTrigger value="personal" className="rounded-lg gap-2">
            <User className="w-4 h-4" />
            Información Personal
          </TabsTrigger>
          <TabsTrigger value="security" className="rounded-lg gap-2">
            <Shield className="w-4 h-4" />
            Seguridad
          </TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Información Personal</CardTitle>
              <CardDescription>
                Actualiza tu nombre, datos de contacto y foto de perfil.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileSubmit} className="space-y-6">
                <div className="flex flex-col items-center sm:items-start gap-4">
                  <Label>Foto de Perfil</Label>
                  <ImageUpload
                    value={profileData.avatar}
                    onChange={(val) => setProfileData({ ...profileData, avatar: val })}
                    className="w-24 h-24"
                  />
                  <p className="text-xs text-slate-500">Haz clic en la imagen para cambiar tu avatar</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre Completo</Label>
                    <Input
                      id="name"
                      placeholder="Tu nombre completo"
                      value={profileData.name}
                      onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input
                      id="phone"
                      placeholder="Tu número telefónico"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="city">Ciudad</Label>
                    <Input
                      id="city"
                      placeholder="Tu ciudad de residencia"
                      value={profileData.city}
                      onChange={(e) => setProfileData({ ...profileData, city: e.target.value })}
                    />
                  </div>
                </div>

                <Button type="submit" disabled={loading} className="gap-2">
                  <Save className="w-4 h-4" />
                  {loading ? "Guardando..." : "Guardar Cambios"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Seguridad</CardTitle>
              <CardDescription>
                Cambia tu contraseña para mantener tu cuenta segura.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordSubmit} className="max-w-md space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Contraseña Actual</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showPassRaw.current ? "text" : "password"}
                      value={passwords.currentPassword}
                      onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                      required
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassRaw({ ...showPassRaw, current: !showPassRaw.current })}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showPassRaw.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nueva Contraseña</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showPassRaw.new ? "text" : "password"}
                      value={passwords.newPassword}
                      onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                      required
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassRaw({ ...showPassRaw, new: !showPassRaw.new })}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showPassRaw.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500">Mínimo 8 caracteres, al menos una letra y un número.</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showPassRaw.confirm ? "text" : "password"}
                      value={passwords.confirmPassword}
                      onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                      required
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassRaw({ ...showPassRaw, confirm: !showPassRaw.confirm })}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showPassRaw.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button type="submit" variant="secondary" disabled={passLoading} className="gap-2 bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200">
                  <Key className="w-4 h-4" />
                  {passLoading ? "Actualizando..." : "Cambiar Contraseña"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
