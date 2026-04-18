import { motion } from 'framer-motion';
import { Wrench, Clock, Mail, Phone } from 'lucide-react';
import { useSettingsStore } from '@/stores/settingsStore';
import { Button } from '@/components/ui/button';

export function MaintenanceOverlay() {
    const { settings } = useSettingsStore();

    return (
        <div className="fixed inset-0 z-[9999] bg-white dark:bg-slate-950 flex items-center justify-center p-6">
            {/* Background Decorations */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 dark:bg-blue-600/20 rounded-full blur-[120px]" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 dark:bg-purple-600/20 rounded-full blur-[120px]" />
            </div>

            <div className="max-w-2xl w-full text-center relative z-10">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mb-8 flex justify-center"
                >
                    <div className="w-24 h-24 rounded-3xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center border border-blue-100 dark:border-blue-800 shadow-xl shadow-blue-500/10">
                        <Wrench className="w-12 h-12 text-blue-600 dark:text-blue-400" />
                    </div>
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-6 tracking-tight"
                >
                    Sistema en <span className="text-blue-600 dark:text-blue-400 italic">Mantenimiento</span>
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-lg text-slate-600 dark:text-slate-400 mb-10 leading-relaxed font-light"
                >
                    Estamos realizando mejoras importantes para brindarte una mejor experiencia técnica. <br />
                    Volveremos a estar en línea muy pronto.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="grid sm:grid-cols-3 gap-6 mb-12"
                >
                    <div className="p-6 rounded-2xl bg-white/50 dark:bg-white/5 border border-slate-100 dark:border-white/10 backdrop-blur-md">
                        <Phone className="w-5 h-5 text-blue-600 dark:text-blue-400 mx-auto mb-3" />
                        <p className="text-[10px] uppercase font-black tracking-widest text-slate-500 dark:text-slate-500 mb-1">WhatsApp</p>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{settings.contact_phone}</p>
                    </div>
                    <div className="p-6 rounded-2xl bg-white/50 dark:bg-white/5 border border-slate-100 dark:border-white/10 backdrop-blur-md">
                        <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400 mx-auto mb-3" />
                        <p className="text-[10px] uppercase font-black tracking-widest text-slate-500 dark:text-slate-500 mb-1">Email</p>
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{settings.contact_email}</p>
                    </div>
                    <div className="p-6 rounded-2xl bg-white/50 dark:bg-white/5 border border-slate-100 dark:border-white/10 backdrop-blur-md">
                        <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400 mx-auto mb-3" />
                        <p className="text-[10px] uppercase font-black tracking-widest text-slate-500 dark:text-slate-500 mb-1">Estado</p>
                        <p className="text-sm font-bold text-blue-600 dark:text-blue-400 italic">Actualizando</p>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                >
                    <a href={`https://wa.me/${(settings.contact_phone || '').replace(/\D/g, '')}`}>
                        <Button size="lg" className="rounded-full px-8 bg-blue-600 hover:bg-blue-700 text-white font-bold h-12">
                            Contactar con Soporte
                        </Button>
                    </a>
                </motion.div>

                <div className="mt-20 flex flex-col items-center opacity-50">
                    <img src="/oscorp-logo.png" alt="Oscorp" className="h-8 object-contain mb-2" />
                    <p className="text-[10px] uppercase tracking-[0.3em] font-black text-slate-500">Ingenio Empresarial</p>
                </div>
            </div>
        </div>
    );
}
