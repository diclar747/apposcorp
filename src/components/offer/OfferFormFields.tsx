import { Tag } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toLocalInput } from '@/components/auction/AuctionFormFields';
import { formatCurrency } from '@/lib/utils';

interface Props {
  price: number;
  comparePrice: string; // monto con puntos de miles
  endsAt: string; // datetime-local
  blocked: boolean;
  isAdmin: boolean;
  onChange: (v: { comparePrice?: string; offerEndsAt?: string; offerBlocked?: boolean }) => void;
}

/** Datos de una oferta dentro del formulario de producto (categoría "Ofertas"). */
export function OfferFormFields({ price, comparePrice, endsAt, blocked, isAdmin, onChange }: Props) {
  const compare = Number(comparePrice.replace(/\D/g, '')) || 0;
  const discount = compare > price && price > 0 ? Math.round(((compare - price) / compare) * 100) : 0;
  const problem =
    compare > 0 && compare <= price ? 'El precio anterior debe ser mayor que el precio de oferta.' :
    discount > 0 && discount < 5 ? 'El descuento tiene que ser de al menos 5%.' :
    discount > 90 ? 'Un descuento de más de 90% parece un precio anterior inflado.' : '';

  return (
    <div className="space-y-3 rounded-lg border border-[#D52B1E]/30 bg-[#D52B1E]/5 p-3">
      <p className="flex items-center gap-2 text-sm font-semibold"><Tag className="h-4 w-4" aria-hidden /> Datos de la oferta</p>
      <p className="text-xs text-muted-foreground">El precio de arriba es el precio de oferta. Indicá el precio anterior real: el comprador lo ve tachado mientras la oferta está vigente.</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="offerCompare">Precio anterior (Gs.)</Label>
          <Input
            id="offerCompare"
            type="text"
            inputMode="numeric"
            value={comparePrice}
            onChange={(e) => {
              const raw = e.target.value.replace(/\D/g, '');
              onChange({ comparePrice: raw ? Number(raw).toLocaleString('es-PY') : '' });
            }}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="offerEndsAt">La oferta vence el</Label>
          <Input
            id="offerEndsAt"
            type="datetime-local"
            value={endsAt}
            min={toLocalInput(new Date(Date.now() + 60 * 60_000))}
            onChange={(e) => onChange({ offerEndsAt: e.target.value })}
          />
        </div>
      </div>
      {discount > 0 && !problem && <p className="text-sm font-semibold">Descuento: {discount}% ({formatCurrency(compare - price)} menos)</p>}
      {problem && <p role="alert" className="text-sm font-semibold text-[#D52B1E]">{problem}</p>}
      {isAdmin && (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={blocked} onChange={(e) => onChange({ offerBlocked: e.target.checked })} />
          Ocultar el precio anterior (referencia no verificable)
        </label>
      )}
    </div>
  );
}
