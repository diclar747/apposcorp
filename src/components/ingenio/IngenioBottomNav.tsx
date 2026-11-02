import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface IngenioNavItem {
  icon: LucideIcon;
  short: string;
  href: string;
}

/**
 * Native-style bottom tab bar for the Ingenio (Finanzas Master) area.
 * Shown only on phones; desktop uses the sidebar. Sits above the device's
 * home indicator via pb-safe and stays legible over any content with an
 * opaque, blurred surface.
 */
export function IngenioBottomNav({ items }: { items: IngenioNavItem[] }) {
  const location = useLocation();
  const isActive = (href: string) =>
    href === '/ingenio'
      ? location.pathname === '/ingenio'
      : location.pathname.startsWith(href);

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 pb-safe pointer-events-none">
      <div className="mx-3 mb-2 rounded-2xl bg-white/90 dark:bg-slate-900/85 backdrop-blur-xl border border-slate-200/70 dark:border-slate-800 shadow-[0_8px_30px_rgba(2,6,23,0.12)] pointer-events-auto">
        <ul className="flex items-stretch justify-between px-1">
          {items.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <li key={item.href} className="flex-1">
                <Link
                  to={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex flex-col items-center justify-center gap-1 py-2.5 rounded-xl transition-colors',
                    active ? 'text-primary' : 'text-slate-400 dark:text-slate-500'
                  )}
                >
                  <motion.div whileTap={{ scale: 0.88 }} className="relative">
                    {active && (
                      <motion.span
                        layoutId="ingenio-tab-active"
                        className="absolute -inset-2 rounded-xl bg-primary/10"
                        transition={{ type: 'spring', stiffness: 500, damping: 34 }}
                      />
                    )}
                    <Icon className={cn('w-[22px] h-[22px] relative', active && 'stroke-[2.4px]')} />
                  </motion.div>
                  <span
                    className={cn(
                      'text-[10px] font-bold tracking-tight leading-none',
                      active ? 'opacity-100' : 'opacity-70'
                    )}
                  >
                    {item.short}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
