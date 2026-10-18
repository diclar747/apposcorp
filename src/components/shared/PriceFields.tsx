import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatNumber, parseFormattedNumber } from '@/lib/utils';

export interface PriceValues {
  cost?: number;
  profitPercentage?: number;
  price?: number;
}

interface PriceFieldsProps extends PriceValues {
  onChange: (values: PriceValues) => void;
}

const round2 = (n: number) => Math.round(n * 100) / 100;
const marginOf = (cost: number, price: number) => (cost > 0 ? round2(((price - cost) / cost) * 100) : 0);
const shown = (n: number | undefined) => (n === undefined ? '' : formatNumber(n));

/**
 * Costo, ganancia (en Gs y en %) y precio de venta. Cualquiera de los campos se puede escribir
 * directamente y los demás se recalculan; nada se corrige mientras se escribe, así el precio
 * queda exacto (costo 5.000 + ganancia 2.000 = 7.000).
 */
export function PriceFields({ cost, profitPercentage, price, onChange }: PriceFieldsProps) {
  const c = cost ?? 0;
  const profitAmount = price !== undefined && cost !== undefined ? price - cost : undefined;

  const setCost = (raw: string) => {
    if (raw.trim() === '') return onChange({ cost: undefined, profitPercentage, price });
    const next = parseFormattedNumber(raw);
    // Con un % cargado se mantiene el %; si no, se mantiene el precio y se recalcula el %
    if (profitPercentage !== undefined && profitPercentage !== 0) {
      return onChange({ cost: next, profitPercentage, price: Math.round(next * (1 + profitPercentage / 100)) });
    }
    if (price !== undefined) return onChange({ cost: next, profitPercentage: marginOf(next, price), price });
    onChange({ cost: next, profitPercentage: 0, price: next });
  };

  const setProfitAmount = (raw: string) => {
    if (raw.trim() === '') return onChange({ cost, profitPercentage: 0, price: c });
    const amount = parseFormattedNumber(raw);
    onChange({ cost, profitPercentage: marginOf(c, c + amount), price: c + amount });
  };

  const setProfitPercentage = (raw: string) => {
    if (raw.trim() === '') return onChange({ cost, profitPercentage: undefined, price });
    const pct = parseFloat(raw.replace(',', '.'));
    if (!Number.isFinite(pct)) return;
    onChange({ cost, profitPercentage: pct, price: Math.round(c * (1 + pct / 100)) });
  };

  const setPrice = (raw: string) => {
    if (raw.trim() === '') return onChange({ cost, profitPercentage, price: undefined });
    const next = parseFormattedNumber(raw);
    onChange({ cost, profitPercentage: marginOf(c, next), price: next });
  };

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="space-y-2">
          <Label htmlFor="cost">Costo (compra)</Label>
          <Input id="cost" type="text" inputMode="numeric" placeholder="0" value={shown(cost)} onChange={(e) => setCost(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="profitAmount">Ganancia (Gs)</Label>
          <Input
            id="profitAmount"
            type="text"
            inputMode="numeric"
            placeholder="0"
            value={profitAmount === undefined || profitAmount < 0 ? '' : formatNumber(profitAmount)}
            onChange={(e) => setProfitAmount(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="profit">Ganancia (%)</Label>
          <Input
            id="profit"
            type="number"
            step="0.01"
            placeholder="0"
            onWheel={(e) => (e.target as HTMLElement).blur()}
            value={profitPercentage ?? ''}
            onChange={(e) => setProfitPercentage(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="price" className="text-green-600 dark:text-green-400 font-bold">Precio de venta</Label>
          <Input
            id="price"
            type="text"
            inputMode="numeric"
            placeholder="0"
            className="border-green-200 focus-visible:ring-green-500 font-bold"
            value={shown(price)}
            onChange={(e) => setPrice(e.target.value)}
          />
        </div>
      </div>
      {profitAmount !== undefined && profitAmount < 0 && (price ?? 0) > 0 ? (
        <p className="text-xs font-medium text-amber-600">
          El precio es menor que el costo: se pierden Gs {formatNumber(-profitAmount)} por unidad.
        </p>
      ) : (
        <p className="text-[10px] text-gray-400 dark:text-gray-500">
          Escribí el precio de venta o la ganancia en Gs y el % se calcula solo (o al revés).
        </p>
      )}
    </div>
  );
}
