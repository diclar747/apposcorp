import { Gavel } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Props {
  endsAt: string; // valor de <input type="datetime-local">
  minIncrement: string;
  locked: boolean; // con ofertas o ya cerrado no se puede cambiar
  onChange: (v: { auctionEndsAt?: string; auctionMinIncrement?: string }) => void;
}

/** Convierte un ISO a lo que espera <input type="datetime-local"> (hora local). */
export const toLocalInput = (iso: string | Date | null | undefined) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/** Mañana a esta hora: fecha de cierre por defecto de un remate nuevo. */
export const defaultAuctionEnd = () => toLocalInput(new Date(Date.now() + 24 * 3600_000));

/** Datos del remate dentro del formulario de producto (categoría "Remates"). */
export function AuctionFormFields({ endsAt, minIncrement, locked, onChange }: Props) {
  return (
    <div className="space-y-3 rounded-lg border border-[#0B1F4B]/30 bg-[#0B1F4B]/5 p-3">
      <p className="flex items-center gap-2 text-sm font-semibold">
        <Gavel className="h-4 w-4" aria-hidden /> Datos del remate
      </p>
      <p className="text-xs text-muted-foreground">
        El precio de arriba es el precio inicial. Se vende una sola unidad al que más ofrezca, y el ganador paga desde la tienda online dentro de 48 horas.
        {locked && ' Ya tiene ofertas o terminó: solo se pueden editar la descripción y las fotos.'}
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="auctionEndsAt">Termina el</Label>
          <Input
            id="auctionEndsAt"
            type="datetime-local"
            value={endsAt}
            min={toLocalInput(new Date(Date.now() + 10 * 60_000))}
            disabled={locked}
            onChange={(e) => onChange({ auctionEndsAt: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="auctionMinIncrement">Cada oferta suma como mínimo (Gs.)</Label>
          <Input
            id="auctionMinIncrement"
            type="text"
            inputMode="numeric"
            value={minIncrement}
            disabled={locked}
            onChange={(e) => {
              const raw = e.target.value.replace(/\D/g, '');
              onChange({ auctionMinIncrement: raw ? Number(raw).toLocaleString('es-PY') : '' });
            }}
          />
        </div>
      </div>
    </div>
  );
}
