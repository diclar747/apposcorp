import { Gavel } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCountdown } from './useCountdown';

interface Props {
  status: string | null | undefined;
  endsAt: string | null | undefined;
  className?: string;
}

/** Cinta de remate para las tarjetas del catálogo: tiempo que falta o estado final. */
export function AuctionCardBadge({ status, endsAt, className }: Props) {
  const t = useCountdown(status === 'open' ? endsAt : null);
  if (!status) return null;

  let text: string;
  if (status === 'open' && !t.over) {
    text = t.days > 0 ? `${t.days} d ${t.hours} h` : t.hours > 0 ? `${t.hours} h ${t.minutes} min` : `${t.minutes}:${String(t.seconds).padStart(2, '0')}`;
  } else if (status === 'sold' || status === 'ended') {
    text = 'Rematado';
  } else {
    text = 'Terminó';
  }
  const live = status === 'open' && !t.over;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-bold tabular-nums',
        live ? 'bg-[#0B1F4B] text-white' : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
        className,
      )}
    >
      <Gavel className="h-3 w-3" aria-hidden />
      Remate · {text}
    </span>
  );
}
