import { Clock, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCountdown } from '@/components/auction/useCountdown';

interface Offer {
  active: boolean;
  expired: boolean;
  endsAt: string | Date | null;
  discountPercent: number;
}

/** Cinta de una oferta: porcentaje y tiempo que falta, o "terminada". */
export function OfferCountdown({ offer, compact, className }: { offer: Offer; compact?: boolean; className?: string }) {
  const t = useCountdown(offer.active ? offer.endsAt : null);

  if (offer.expired || (offer.active && t.over)) {
    return (
      <span className={cn('inline-flex items-center gap-1.5 rounded-md bg-slate-200 px-2 py-1 text-[11px] font-bold text-slate-600 dark:bg-slate-700 dark:text-slate-300', className)}>
        <Clock className="h-3 w-3" aria-hidden /> Oferta terminada
      </span>
    );
  }
  if (!offer.active) return null;

  const left = t.days > 0 ? `${t.days} d ${t.hours} h` : t.hours > 0 ? `${t.hours} h ${t.minutes} min` : `${t.minutes}:${String(t.seconds).padStart(2, '0')}`;
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-md bg-[#D52B1E] px-2 py-1 text-[11px] font-bold tabular-nums text-white', className)}>
      <Tag className="h-3 w-3" aria-hidden />
      {offer.discountPercent > 0 && `-${offer.discountPercent}%`}
      {!compact && ` · termina en ${left}`}
      {compact && ` · ${left}`}
    </span>
  );
}
