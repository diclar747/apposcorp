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
import { 
  User, Shield, Key, Eye, EyeOff, CreditCard, Clock, 
  ShieldCheck, CheckCircle, Landmark, Sparkles, AlertCircle
} from "lucide-react";
import { useIngenioSubscription } from "@/hooks/useIngenioSubscription";
import { usePaywallStore } from "@/stores/paywallStore";
import { Badge } from "@/components/ui/badge";
import { cn, formatCurrency } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export default function IngenioProfile() {
  const { user, fetchCurrentUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [passLoading, setPassLoading] = useState(false);
  const { isOpen, openPaywall, closePaywall } = usePaywallStore();
  const { status, isActive, subscription } = useIngenioSubscription();

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
        name: `${user.firstName || ''}${user.lastName ? " " + user.lastName : ""}`,
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
      toast.success("Información personal actualizada");
    } catch (error: any) {
      toast.error(error.message || "Error al actualizar el perfil");
    } finally {
      setLoading(false);
    }
  };


  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwords.newPassword !== passwords.confirmPassword) {
      return toast.error("La nueva contraseña no coincide");
    }
    if (passwords.newPassword.length < 8) {
      return toast.error("La contraseña debe tener al menos 8 caracteres");
    }

    setPassLoading(true);
    try {
      await usersApi.updatePassword({
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
      toast.success("Contraseña actualizada");
    } catch (error: any) {
      toast.error(error.message || "Error al cambiar la contraseña");
    } finally {
      setPassLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center p-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Mi Perfil</h1>
          <p className="text-slate-500 font-medium tracking-tight">Gestiona tu identidad y seguridad en la plataforma</p>
        </div>
        <div className="flex items-center gap-2">
            <Badge className={cn(
                "h-10 px-4 rounded-full font-black border-none text-white",
                isActive ? "bg-emerald-500" : "bg-indigo-600"
            )}>
                {isActive ? <ShieldCheck className="w-4 h-4 mr-2" /> : <Clock className="w-4 h-4 mr-2" />}
                {isActive ? 'Acceso Full' : 'Modo Lectura'}
            </Badge>
        </div>
      </div>

      <Tabs defaultValue="personal" className="w-full">
        <TabsList className="bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl h-auto flex flex-wrap gap-1">
          <TabsTrigger value="personal" className="rounded-xl px-6 py-2.5 font-black text-sm data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-md">
            <User className="w-3.5 h-3.5 mr-2" /> Datos Personales
          </TabsTrigger>
          <TabsTrigger value="security" className="rounded-xl px-6 py-2.5 font-black text-sm data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-md">
            <Shield className="w-3.5 h-3.5 mr-2" /> Seguridad
          </TabsTrigger>
          <TabsTrigger value="subscription" className="rounded-xl px-6 py-2.5 font-black text-sm data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-md">
            <CreditCard className="w-3.5 h-3.5 mr-2" /> Suscripción
          </TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="mt-8">
          <Card className="border-none shadow-xl bg-white dark:bg-slate-950 rounded-[2.5rem] overflow-hidden">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-2xl font-black">Información Básica</CardTitle>
              <CardDescription className="font-medium">Tu identidad pública en Ingenio Millonario.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-4">
              <form onSubmit={handleProfileSubmit} className="space-y-8">
                <div className="flex flex-col sm:flex-row items-center gap-8 p-6 rounded-3xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                  <ImageUpload
                    value={profileData.avatar}
                    onChange={(val) => setProfileData({ ...profileData, avatar: val })}
                    className="w-24 h-24 rounded-full shadow-xl border-4 border-white dark:border-slate-800"
                  />
                  <div className="text-center sm:text-left">
                     <p className="font-black text-lg mb-1">Avatar de Usuario</p>
                     <p className="text-sm text-slate-500 font-medium">Sube una imagen para reconocerte en la comunidad.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="font-black text-xs ml-1 uppercase tracking-widest text-slate-400">Nombre Completo</Label>
                    <Input
                      placeholder="Tu nombre completo"
                      value={profileData.name}
                      onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                      className="h-12 rounded-xl text-lg font-bold border-slate-200"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-black text-xs ml-1 uppercase tracking-widest text-slate-400">Teléfono</Label>
                    <Input
                      placeholder="Tu número telefónico"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                      className="h-12 rounded-xl text-lg font-bold border-slate-200"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label className="font-black text-xs ml-1 uppercase tracking-widest text-slate-400">Ciudad de Residencia</Label>
                    <Input
                      placeholder="Ej: Asunción, Paraguay"
                      value={profileData.city}
                      onChange={(e) => setProfileData({ ...profileData, city: e.target.value })}
                      className="h-12 rounded-xl text-lg font-bold border-slate-200"
                    />
                  </div>
                </div>

                <Button type="submit" disabled={loading} className="w-full md:w-auto px-10 h-12 bg-indigo-600 hover:bg-indigo-700 rounded-xl font-black text-lg shadow-lg">
                  {loading ? "Guardando..." : "Actualizar Datos"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>


        <TabsContent value="security" className="mt-8">
          <Card className="border-none shadow-xl bg-white dark:bg-slate-950 rounded-[2.5rem] overflow-hidden">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-2xl font-black flex items-center gap-2">
                <Shield className="w-7 h-7 text-indigo-600" /> Seguridad
              </CardTitle>
              <CardDescription className="font-medium">
                Mantén tu cuenta protegida cambiando tu contraseña regularmente.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-4">
              <form onSubmit={handlePasswordSubmit} className="max-w-md space-y-6">
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/50 font-black">Contraseña Actual</Label>
                  <div className="relative">
                    <Input
                      type={showPassRaw.current ? "text" : "password"}
                      value={passwords.currentPassword}
                      onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                      required
                      className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl h-12 pr-12 transition-all focus:border-indigo-500/50"
                      placeholder="Tu contraseña actual"
                    />
                    <button type="button" onClick={() => setShowPassRaw({...showPassRaw, current: !showPassRaw.current})} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                      {showPassRaw.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/50 font-black">Nueva Contraseña</Label>
                  <div className="relative">
                    <Input
                      type={showPassRaw.new ? "text" : "password"}
                      value={passwords.newPassword}
                      onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                      required
                      className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl h-12 pr-12 transition-all focus:border-indigo-500/50"
                      placeholder="Ingresa la contraseña nueva"
                    />
                    <button type="button" onClick={() => setShowPassRaw({...showPassRaw, new: !showPassRaw.new})} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                      {showPassRaw.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  
                  {/* Requirements List */}
                  <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 flex items-start gap-3 mt-2">
                    <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-amber-500/80">Requisitos de Seguridad:</p>
                      <ul className="text-[10px] font-bold text-slate-500 space-y-1 mt-1">
                        <li className="flex items-center gap-2">
                          <div className={cn("w-1.5 h-1.5 rounded-full", passwords.newPassword.length >= 8 ? "bg-emerald-500" : "bg-slate-300")} />
                          Mínimo 8 caracteres
                        </li>
                        <li className="flex items-center gap-2">
                          <div className={cn("w-1.5 h-1.5 rounded-full", /[A-Za-z]/.test(passwords.newPassword) ? "bg-emerald-500" : "bg-slate-300")} />
                          Al menos una letra
                        </li>
                        <li className="flex items-center gap-2">
                          <div className={cn("w-1.5 h-1.5 rounded-full", /\d/.test(passwords.newPassword) ? "bg-emerald-500" : "bg-slate-300")} />
                          Al menos un número
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/50 font-black">Confirmar Nueva Contraseña</Label>
                  <div className="relative">
                    <Input
                      type={showPassRaw.confirm ? "text" : "password"}
                      value={passwords.confirmPassword}
                      onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                      required
                      className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl h-12 pr-12 transition-all focus:border-indigo-500/50"
                      placeholder="Repite la nueva contraseña"
                    />
                    <button type="button" onClick={() => setShowPassRaw({...showPassRaw, confirm: !showPassRaw.confirm})} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                      {showPassRaw.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <Button type="submit" disabled={passLoading} className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-indigo-500/20">
                  {passLoading ? "Procesando..." : "Actualizar Contraseña"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscription" className="mt-8">
          <Card className="border-none shadow-xl bg-white dark:bg-slate-950 rounded-[2.5rem] overflow-hidden">
            <CardHeader className="p-8 pb-4 border-b dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
              <CardTitle className="text-2xl font-black uppercase tracking-tighter flex items-center gap-2">
                 <Sparkles className="w-6 h-6 text-indigo-500" /> Pase de Acceso Global
              </CardTitle>
              <CardDescription className="font-bold text-slate-500">Gestiona tu vinculación con el ecosistema Ingenio Millonario.</CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row items-center gap-10 p-10 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 rounded-[3rem] border border-white dark:border-slate-800">
                <div className={cn(
                  "w-24 h-24 rounded-[2rem] flex items-center justify-center shadow-2xl shrink-0",
                  isActive ? "bg-emerald-500 text-white" : "bg-indigo-600 text-white"
                )}>
                  {isActive ? <ShieldCheck className="w-12 h-12" /> : <CreditCard className="w-12 h-12" />}
                </div>
                
                <div className="flex-1 text-center md:text-left space-y-6">
                  <div>
                    <h3 className="text-3xl font-black dark:text-white uppercase tracking-tighter mb-2">Estado: <span className={isActive ? "text-emerald-600" : "text-indigo-600"}>{status === 'PENDING_APPROVAL' ? 'Validando' : (isActive ? 'Activo' : 'Inactivo')}</span></h3>
                    <p className="text-slate-500 font-bold text-lg leading-snug">
                       {isActive 
                        ? "Tu cuenta cuenta con todos los permisos habilitados para la gestión financiera y académica." 
                        : (status === 'PENDING_APPROVAL' 
                            ? "Estamos procesando tu pago. Si pagaste por transferencia, el equipo validará tu comprobante en breve."
                            : "Para desbloquear el Registro de Finanzas y la Academia, necesitas adquirir tu Pase de Acceso.")}
                    </p>
                  </div>

                  {subscription && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-8 py-8 border-t border-dashed border-indigo-200 dark:border-indigo-900/50">
                      <div>
                        <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-1">Monto de Acceso</p>
                        <p className="text-2xl font-black dark:text-white">{formatCurrency(subscription.totalAmount)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-1">Total Abonado</p>
                        <p className="text-2xl font-black text-emerald-600">{formatCurrency(subscription.paidAmount)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-1">Plan</p>
                        <p className="text-xl font-black dark:text-white">{subscription.installments === 1 ? 'Pago Único' : `${subscription.installments} Cuotas`}</p>
                      </div>
                    </div>
                  )}

                  {!isActive && (
                    <Button 
                      onClick={openPaywall}
                      className="bg-indigo-600 hover:bg-indigo-700 h-16 px-12 rounded-2xl text-xl font-black shadow-2xl shadow-indigo-600/30 w-full md:w-auto"
                    >
                      {status === 'PENDING_APPROVAL' ? 'Ver Detalles de Solicitud' : 'Solicitar Acceso Full'}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
