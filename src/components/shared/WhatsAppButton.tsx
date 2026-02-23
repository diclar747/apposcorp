import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WhatsAppButtonProps {
    phoneNumber?: string;
    message?: string;
    className?: string;
}

export const WhatsAppButton = ({
    phoneNumber = '595975855585',
    message = 'Gracias por llegar hasta aquí, ¿en qué te podemos ayudar?',
    className
}: WhatsAppButtonProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [showGreeting, setShowGreeting] = useState(false);

    useEffect(() => {
        // Show greeting bubble after 3 seconds
        const timer = setTimeout(() => {
            setShowGreeting(true);
        }, 3000);
        return () => clearTimeout(timer);
    }, []);

    const handleWhatsAppClick = () => {
        const encodedMessage = encodeURIComponent(message);
        window.open(`https://wa.me/${phoneNumber}?text=${encodedMessage}`, '_blank');
        setShowGreeting(false);
    };

    return (
        <div className={cn("fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-4", className)}>
            {/* Greeting Pop-up */}
            <AnimatePresence>
                {showGreeting && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 20, x: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 20, x: 20 }}
                        className="relative bg-white dark:bg-slate-900 shadow-2xl rounded-2xl p-4 max-w-[250px] border border-slate-100 dark:border-white/10"
                    >
                        <button
                            onClick={() => setShowGreeting(false)}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-700 dark:hover:text-white transition-colors border border-slate-200 dark:border-white/10 shadow-sm"
                        >
                            <X className="w-3 h-3" />
                        </button>
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                                <MessageCircle className="w-4 h-4 text-white" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-900 dark:text-white mb-1">Oscorp Soporte</p>
                                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-tight">
                                    {message}
                                </p>
                            </div>
                        </div>
                        <div className="absolute bottom-[-8px] right-6 w-4 h-4 bg-white dark:bg-slate-900 border-r border-b border-slate-100 dark:border-white/10 rotate-45" />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Floating Button */}
            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleWhatsAppClick}
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-[0_8px_32px_rgba(16,185,129,0.4)] hover:bg-emerald-600 transition-colors relative group overflow-hidden"
            >
                <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                <MessageCircle className="w-7 h-7 sm:w-8 sm:h-8" />

                {/* Ping Animation */}
                {!showGreeting && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-white dark:border-slate-900"></span>
                    </span>
                )}
            </motion.button>
        </div>
    );
};
