import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, ExternalLink, Info, AlertTriangle, XCircle, CheckCircle, Megaphone, Trash2 } from 'lucide-react';
import { useNotificationStore, useAuthStore } from '@/stores';
import { Button } from '@/components/ui/button';
import { cn, translateStatusInText } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import api from '@/lib/api';

export default function ClientNotifications() {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const {
        notifications,
        isLoading,
        fetchNotifications,
        markAsRead,
        markAllAsRead
    } = useNotificationStore();

    useEffect(() => {
        if (user) {
            fetchNotifications();
        }
    }, [user, fetchNotifications]);

    const handleNotificationClick = async (id: string, actionUrl?: string) => {
        // Track click stats
        try {
            await api.notifications.trackClick(id);
        } catch (e) {
            console.error(e);
        }

        await markAsRead(id);
        if (actionUrl) {
            // Si el usuario es vendedor y está en el panel de vendedor, redirigir pedidos a la vista de vendedor
            let finalUrl = actionUrl;
            const isSellerView = window.location.pathname.startsWith('/vendedor');
            const isOrderUrl = actionUrl.startsWith('/app/pedidos');
            
            if (isSellerView && isOrderUrl) {
                finalUrl = '/vendedor/pedidos';
            }

            if (finalUrl.startsWith('http')) {
                window.open(finalUrl, '_blank');
            } else {
                navigate(finalUrl);
            }
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />;
            case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
            case 'error': return <XCircle className="w-5 h-5 text-red-500" />;
            case 'campaign': return <Megaphone className="w-5 h-5 text-blue-500" />;
            default: return <Info className="w-5 h-5 text-blue-500" />;
        }
    };

    return (
        <div className="pb-20">
            <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border/50 px-4 py-3 flex items-center justify-between">
                <h1 className="text-lg font-semibold flex items-center gap-2">
                    <Bell className="w-5 h-5" /> Notificaciones
                </h1>
                {notifications.some(n => !n.isRead) && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs h-8"
                        onClick={() => markAllAsRead()}
                    >
                        Marcar todas leídas
                    </Button>
                )}
            </div>

            <div className="p-4 space-y-3">
                {isLoading && notifications.length === 0 ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-24 bg-gray-100 dark:bg-slate-800 rounded-xl animate-pulse" />
                        ))}
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                            <Bell className="w-8 h-8 text-gray-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Sin notificaciones</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                Te avisaremos cuando haya novedades importantes.
                            </p>
                        </div>
                    </div>
                ) : (
                    <AnimatePresence>
                        {notifications.map((notification) => (
                            <motion.div
                                key={notification.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                onClick={() => handleNotificationClick(notification.id, notification.actionUrl)}
                                className={cn(
                                    "relative bg-card border rounded-xl p-4 transition-all cursor-pointer hover:shadow-md",
                                    !notification.isRead ? "border-blue-500/50 bg-blue-50/50 dark:bg-blue-900/10" : "border-border shadow-sm",
                                    notification.actionUrl && "active:scale-[0.98]"
                                )}
                            >
                                {!notification.isRead && (
                                    <span className="absolute top-4 right-4 w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse" />
                                )}

                                <div className="flex gap-4">
                                    <div className={cn(
                                        "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                                        "bg-gray-100 dark:bg-slate-800"
                                    )}>
                                        {getIcon(notification.type)}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <h4 className={cn(
                                            "text-sm font-semibold mb-1 pr-4",
                                            !notification.isRead ? "text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-300"
                                        )}>
                                            {translateStatusInText(notification.title)}
                                        </h4>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-2">
                                            {translateStatusInText(notification.message)}
                                        </p>

                                        {notification.imageUrl && (
                                            <div className="mt-3 rounded-lg overflow-hidden border border-border">
                                                <img
                                                    src={notification.imageUrl}
                                                    alt="Contenido"
                                                    className="w-full h-32 object-cover"
                                                    onError={(e) => (e.currentTarget.style.display = 'none')}
                                                />
                                            </div>
                                        )}

                                        <div className="flex items-center gap-3 mt-3">
                                            <span className="text-xs text-gray-400">
                                                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: es })}
                                            </span>

                                            {notification.actionUrl && (
                                                <span className="flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400">
                                                    Ver detalles <ExternalLink className="w-3 h-3" />
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                )}
            </div>
        </div>
    );
}
