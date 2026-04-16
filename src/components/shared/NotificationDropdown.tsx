import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, Check, ExternalLink, Info, AlertTriangle, 
  XCircle, CheckCircle, Megaphone, Trash2, 
  Settings, CheckCheck, Loader2
} from 'lucide-react';
import { useNotificationStore, useAuthStore } from '@/stores';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import api from '@/lib/api';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

interface NotificationDropdownProps {
  className?: string;
  align?: 'start' | 'center' | 'end';
}

export function NotificationDropdown({ className, align = 'end' }: NotificationDropdownProps) {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    notifications,
    isLoading,
    unreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead
  } = useNotificationStore();

  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (user && isOpen) {
      fetchNotifications();
    }
  }, [user, isOpen, fetchNotifications]);

  // Handle unread count badge in layout if needed (exposed via store anyway)
  // But we fetch it here when it opens

  const handleNotificationClick = async (id: string, actionUrl?: string) => {
    try {
      await api.notifications.trackClick(id);
    } catch (e) {
      console.error(e);
    }

    await markAsRead(id);
    setIsOpen(false);
    
    if (actionUrl) {
      if (actionUrl.startsWith('http')) {
        window.open(actionUrl, '_blank');
      } else {
        navigate(actionUrl);
      }
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case 'error': return <XCircle className="w-5 h-5 text-rose-500" />;
      case 'campaign': return <Megaphone className="w-5 h-5 text-blue-500" />;
      default: return <Info className="w-5 h-5 text-indigo-500" />;
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <button 
          className={cn(
            "relative p-2 rounded-xl transition-all duration-200",
            "text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10",
            className
          )}
          title="Notificaciones"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center animate-pulse">
              {unreadCount > 9 ? '+9' : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-80 md:w-96 p-0 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl">
        <div className="p-4 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white">Notificaciones</h3>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-0.5">Centro de Alertas</p>
          </div>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 text-[10px] font-bold uppercase tracking-wider text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-500/10"
              onClick={(e) => {
                e.stopPropagation();
                markAllAsRead();
              }}
            >
              <CheckCheck className="w-3.5 h-3.5 mr-1.5" />
              Marcar todo leido
            </Button>
          )}
        </div>

        <ScrollArea className="h-[400px]">
          <div className="p-2">
            {isLoading && notifications.length === 0 ? (
              <div className="p-8 flex flex-col items-center justify-center text-center space-y-3">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                <p className="text-sm text-slate-500 font-medium">Cargando alertas...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-12 flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center">
                  <Bell className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">Todo al día</h4>
                  <p className="text-xs text-slate-500 mt-1">No tienes notificaciones pendientes en este momento.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                {notifications.map((notification) => (
                  <button
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification.id, notification.actionUrl)}
                    className={cn(
                      "w-full text-left p-3 rounded-xl transition-all duration-200 group relative",
                      !notification.isRead 
                        ? "bg-indigo-50/50 dark:bg-indigo-500/5 hover:bg-indigo-50 dark:hover:bg-indigo-500/10" 
                        : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    )}
                  >
                    {!notification.isRead && (
                      <span className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-indigo-500 rounded-full" />
                    )}
                    <div className="flex gap-3">
                      <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center shrink-0 shadow-sm border border-slate-100 dark:border-slate-700">
                        {getIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <h4 className={cn(
                            "text-sm font-bold truncate pr-2",
                            !notification.isRead ? "text-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-400"
                          )}>
                            {notification.title}
                          </h4>
                          <span className="text-[10px] text-slate-400 whitespace-nowrap font-medium">
                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: false, locale: es })}
                          </span>
                        </div>
                        <p className={cn(
                          "text-xs leading-relaxed line-clamp-2",
                          !notification.isRead ? "text-slate-700 dark:text-slate-300 font-medium" : "text-slate-500 dark:text-slate-500"
                        )}>
                          {notification.message}
                        </p>
                        {notification.actionUrl && (
                          <div className="mt-2 flex items-center text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider group-hover:translate-x-1 transition-transform">
                            Ver detalles <ExternalLink className="w-3 h-3 ml-1" />
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>

        <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800" />
        <button
          onClick={() => {
            setIsOpen(false);
            const path = window.location.pathname.startsWith('/ingenio') ? '/ingenio/notificaciones' : '/app/notificaciones';
            navigate(path);
          }}
          className="w-full p-3 text-center text-xs font-bold text-slate-500 hover:text-indigo-600 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors uppercase tracking-widest"
        >
          Ver todas las notificaciones
        </button>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
