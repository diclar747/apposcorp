import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface BrandLogoProps {
    className?: string;
    showText?: boolean;
    subtitle?: string;
    variant?: 'dark' | 'light' | 'auto';
    size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function BrandLogo({
    className,
    showText = true,
    subtitle,
    variant = 'auto',
    size = 'md'
}: BrandLogoProps) {
    const sizes = {
        sm: 'w-6 h-6 text-sm',
        md: 'w-10 h-10 text-lg',
        lg: 'w-12 h-12 text-2xl',
        xl: 'w-16 h-16 text-3xl'
    };

    const logoUrl = "/oscorp-logo.png";

    return (
        <div className={cn("flex items-center gap-3", className)}>
            <div className={cn(
                "relative flex items-center justify-center shrink-0",
                sizes[size].split(' ')[0],
                sizes[size].split(' ')[1]
            )}>
                <img
                    src={logoUrl}
                    alt="Oscorp Logo"
                    className="w-full h-full object-contain rounded-lg"
                />
            </div>

            {showText && (
                <div className="flex flex-col">
                    <span className={cn(
                        "font-black tracking-tighter leading-none uppercase",
                        variant === 'dark' ? "text-white" : variant === 'light' ? "text-slate-900" : "text-slate-900 dark:text-white",
                        sizes[size].split(' ')[2]
                    )}>
                        Oscorp
                    </span>
                    {subtitle && (
                        <span className={cn(
                            "text-[10px] uppercase tracking-widest font-bold leading-tight mt-1",
                            variant === 'dark' ? "text-slate-400" : "text-slate-500"
                        )}>
                            {subtitle}
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}
