import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, 
  Store, 
  User as UserIcon, 
  Sparkles,
  ChevronDown,
  RefreshCcw
} from 'lucide-react';
import { useAuthStore } from '@/stores';
import type { UserRole } from '@/types';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

const ROLE_CONFIG = {
  superadmin: {
    label: 'Administrador',
    icon: ShieldCheck,
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    path: '/admin'
  },
  seller: {
    label: 'Vendedor',
    icon: Store,
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    path: '/vendedor'
  },
  ingenio: {
    label: 'Ingenio',
    icon: Sparkles,
    color: 'text-violet-600 dark:text-violet-400',
    bg: 'bg-violet-50 dark:bg-violet-900/20',
    path: '/ingenio'
  },
  client: {
    label: 'Cliente',
    icon: UserIcon,
    color: 'text-slate-600 dark:text-slate-400',
    bg: 'bg-slate-50 dark:bg-slate-900/20',
    path: '/app'
  }
};

export const RoleSelector: React.FC = () => {
  const navigate = useNavigate();
  const { user, activeRole, setActiveRole } = useAuthStore();

  if (!user) return null;

  const roles = user.roles || [];
  const hasClient = roles.includes('client');
  const hasIngenio = roles.includes('ingenio');

  // Si tiene 0 o 1 rol, no mostrar
  if (roles.length <= 1) return null;

  // Si tiene client e ingenio (y posiblemente solo esos dos según el pedido), ocultar el selector
  // El usuario pidió quitar el botón si tiene los dos roles.
  if (hasClient && hasIngenio && roles.length === 2) return null;

  const currentRole = activeRole || 'client';
  const config = ROLE_CONFIG[currentRole as keyof typeof ROLE_CONFIG];
  const Icon = config.icon;

  const handleRoleChange = (role: UserRole) => {
    setActiveRole(role);
    navigate(ROLE_CONFIG[role].path);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className={cn(
            "flex items-center gap-2 px-3 h-9 rounded-full transition-all duration-300 border border-transparent hover:shadow-md",
            config.bg
          )}
        >
          <div className={cn("p-1 rounded-full bg-white dark:bg-slate-800 shadow-sm", config.color)}>
            <Icon className="w-3.5 h-3.5" />
          </div>
          <span className={cn("text-xs font-bold uppercase tracking-wider hidden md:inline-block", config.color)}>
            {config.label}
          </span>
          <ChevronDown className="w-4 h-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 p-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl">
        <DropdownMenuLabel className="px-3 py-2">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Cambiar Contexto</span>
            <span className="text-[10px] text-slate-400 font-medium">Selecciona una vista diferente</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="my-1 opacity-50" />
        
        {user.roles.map((role) => {
          const roleConfig = ROLE_CONFIG[role as keyof typeof ROLE_CONFIG];
          const RoleIcon = roleConfig.icon;
          const isSelected = activeRole === role;

          return (
            <DropdownMenuItem
              key={role}
              onClick={() => handleRoleChange(role)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 mb-1",
                isSelected 
                  ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white" 
                  : "hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400"
              )}
            >
              <div className={cn(
                "p-1.5 rounded-lg transition-colors",
                isSelected ? roleConfig.bg : "bg-slate-100 dark:bg-slate-800"
              )}>
                <RoleIcon className={cn("w-4 h-4", isSelected ? roleConfig.color : "text-slate-400")} />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold">{roleConfig.label}</span>
                {isSelected && (
                  <motion.span 
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-[10px] font-medium text-slate-400 flex items-center gap-1"
                  >
                    <RefreshCcw className="w-2.5 h-2.5" /> Activo ahora
                  </motion.span>
                )}
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
