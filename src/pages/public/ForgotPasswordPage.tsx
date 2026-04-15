import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, Send, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ocurrió un error.');
      }

      setIsSent(true);
      toast.success('Correo enviado exitosamente.');
      
      if (data.demoToken) {
          console.log('DEMO MODE: Reset Token ->', data.demoToken);
          toast.info(`Modo Demo: El token es ${data.demoToken}`, { duration: 10000 });
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al procesar la solicitud.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
            <img src="/oscorp-logo.png" alt="Oscorp" className="w-32 mx-auto mb-6 grayscale opacity-50" />
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Recuperar Acceso</h1>
            <p className="text-slate-500 font-medium">Restablece tu contraseña de forma segura</p>
        </div>

        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2.5rem] shadow-2xl border border-white dark:border-slate-800 p-8">
          {!isSent ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="ml-1 text-xs font-black uppercase tracking-widest text-slate-400">Tu correo electrónico</Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="ejemplo@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-14 pl-12 rounded-2xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50 text-lg font-bold"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 rounded-2xl font-black text-lg shadow-xl shadow-indigo-600/20"
              >
                {isLoading ? (
                  <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Enviar Enlace
                    <Send className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
            </form>
          ) : (
            <div className="text-center py-6 space-y-6">
              <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">¡Revisa tu bandeja!</h3>
                <p className="text-slate-500 mt-2 font-medium">Si la cuenta existe, hemos enviado las instrucciones para restablecer tu contraseña.</p>
              </div>
              <Button 
                variant="outline" 
                className="w-full h-12 rounded-xl font-bold"
                onClick={() => setIsSent(false)}
              >
                Re-intentar con otro correo
              </Button>
            </div>
          )}

          <div className="mt-8 pt-8 border-t dark:border-slate-800">
            <Link to="/login" className="flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-black hover:gap-2 transition-all">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al inicio de sesión
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
