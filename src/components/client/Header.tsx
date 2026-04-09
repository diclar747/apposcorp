import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Bell,
  Moon,
  Sun,
  Menu,
  ChevronLeft,
  Search,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useThemeStore } from '@/stores/themeStore';
import { useNotificationStore } from '@/stores/notificationStore';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  showSearch?: boolean;
  onBack?: () => void;
  className?: string;
}

export function Header({
  title,
  showBack = false,
  showSearch = false,
  onBack,
  className
}: HeaderProps) {
  const { resolvedTheme, toggleTheme } = useThemeStore();
  const { unreadCount } = useNotificationStore();
  const isDark = resolvedTheme === 'dark';

  return (
    <header className={cn(
      'sticky top-0 z-40 w-full',
      'bg-background/80 backdrop-blur-xl',
      'border-b border-border/50',
      className
    )}>
      <div className="flex items-center justify-between h-14 px-4 max-w-lg mx-auto">
        {/* Left Section */}
        <div className="flex items-center gap-2">
          {showBack ? (
            <Button
              variant="ghost"
              size="icon"
              className="w-9 h-9 rounded-full bg-muted/30"
              onClick={onBack}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
          ) : (
            <Link to="/app">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2"
              >
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/20 relative">
                  <div className="absolute inset-0 rounded-xl bg-white/20 blur-[1px]" />
                  <span className="text-white font-black text-sm relative z-10">O</span>
                </div>
              </motion.div>
            </Link>
          )}

          <div className="flex flex-col -gap-1">
            <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest leading-none">Welcome Back</span>
            <h1 className="font-bold text-base tracking-tight leading-tight">Oscorp Platform</h1>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-1">
          {showSearch && (
            <Button
              variant="ghost"
              size="icon"
              className="w-9 h-9 rounded-full"
            >
              <Search className="w-5 h-5" />
            </Button>
          )}

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="w-9 h-9 rounded-full relative overflow-hidden"
            onClick={toggleTheme}
          >
            <motion.div
              initial={false}
              animate={{
                rotate: isDark ? 180 : 0,
                scale: isDark ? 0 : 1
              }}
              transition={{ duration: 0.3 }}
              className="absolute"
            >
              <Sun className="w-5 h-5" />
            </motion.div>
            <motion.div
              initial={false}
              animate={{
                rotate: isDark ? 0 : -180,
                scale: isDark ? 1 : 0
              }}
              transition={{ duration: 0.3 }}
              className="absolute"
            >
              <Moon className="w-5 h-5" />
            </motion.div>
          </Button>

          {/* User Profile */}
          <Link to="/app/perfil">
            <Button
              variant="ghost"
              size="icon"
              className="w-9 h-9 rounded-full"
              title="Mi Perfil"
            >
              <User className="w-5 h-5" />
            </Button>
          </Link>

          {/* Notifications */}
          <Link to="/app/notificaciones">
            <Button
              variant="ghost"
              size="icon"
              className="w-9 h-9 rounded-full relative"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center"
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </motion.span>
              )}
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}

// Compact header for sub-pages
export function CompactHeader({
  title,
  rightAction,
  className
}: {
  title: string;
  rightAction?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn(
      'sticky top-0 z-40 w-full',
      'bg-background/80 backdrop-blur-xl',
      'border-b border-border/50',
      className
    )}>
      <div className="flex items-center justify-between h-14 px-4 max-w-lg mx-auto">
        <div className="flex items-center gap-3">
          <Link to="/app">
            <Button
              variant="ghost"
              size="icon"
              className="w-9 h-9 rounded-full"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="font-semibold text-lg">{title}</h1>
        </div>
        {rightAction}
      </div>
    </header>
  );
}
