import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Facebook, Instagram, X, Plus } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function FloatingSocialButtons() {
    const [isOpen, setIsOpen] = useState(false);

    const whatsappNumber = "595972540579";
    const whatsappLink = `https://wa.me/${whatsappNumber}`;
    const facebookLink = "https://facebook.com/oscorp";
    const instagramLink = "https://instagram.com/oscorp";

    const socialButtons = [
        {
            icon: Instagram,
            label: 'Instagram',
            href: instagramLink,
            color: 'bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7]',
            delay: 0.1
        },
        {
            icon: Facebook,
            label: 'Facebook',
            href: facebookLink,
            color: 'bg-[#1877F2]',
            delay: 0.2
        },
        {
            icon: MessageCircle,
            label: 'WhatsApp',
            href: whatsappLink,
            color: 'bg-[#25D366]',
            delay: 0.3
        }
    ];

    return (
        <div className="fixed bottom-24 right-6 z-50 flex flex-col items-end gap-4 md:bottom-10 md:right-10">
            {/* Tooltip Message */}
            <AnimatePresence>
                {!isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.8 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="bg-white dark:bg-slate-900 px-4 py-2 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-800 mb-2"
                    >
                        <p className="text-xs font-bold text-gray-600 dark:text-gray-300 whitespace-nowrap">
                            ¿Necesitas ayuda? 👋
                        </p>
                        <div className="absolute -bottom-1 right-6 w-2 h-2 bg-white dark:bg-slate-900 rotate-45 border-r border-b border-gray-100 dark:border-slate-800" />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Social Buttons List */}
            <AnimatePresence>
                {isOpen && (
                    <div className="flex flex-col gap-3 mb-2">
                        {socialButtons.map((btn) => (
                            <motion.a
                                key={btn.label}
                                href={btn.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                initial={{ opacity: 0, x: 20, scale: 0.5 }}
                                animate={{ opacity: 1, x: 0, scale: 1 }}
                                exit={{ opacity: 0, x: 20, scale: 0.5 }}
                                transition={{ delay: btn.delay }}
                                className={cn(
                                    "flex items-center gap-3 p-2 pr-4 rounded-2xl shadow-lg group transition-all hover:scale-110",
                                    "bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/20"
                                )}
                            >
                                <div className={cn(
                                    "w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-inner",
                                    btn.color
                                )}>
                                    <btn.icon className="w-5 h-5" />
                                </div>
                                <span className="text-sm font-black text-gray-700 dark:text-gray-200">
                                    {btn.label}
                                </span>
                            </motion.a>
                        ))}
                    </div>
                )}
            </AnimatePresence>

            {/* main FAB */}
            <motion.button
                onClick={() => setIsOpen(!isOpen)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={cn(
                    "w-16 h-16 rounded-[2rem] flex items-center justify-center shadow-2xl transition-all duration-300",
                    isOpen
                        ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 rotate-90"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                )}
            >
                {isOpen ? <X className="w-8 h-8" /> : <Plus className="w-8 h-8 stroke-[3]" />}

                {!isOpen && (
                    <span className="absolute inset-0 rounded-[2rem] bg-blue-600 animate-ping opacity-20" />
                )}
            </motion.button>
        </div>
    );
}
