import { useEffect, useState } from 'react';
import { Loader2, Trophy } from 'lucide-react';
import { auctionsApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Props {
  productId: string | null;
  onClose: () => void;
}

const STATUS: Record<string, string> = {
  open: 'En curso',
  ended: 'Adjudicado, esperando pago',
  sold: 'Vendido',
  unpaid: 'El ganador no pagó',
  unsold: 'Terminó sin ofertas',
};

/** Para el admin y la tienda: quién ofertó, cuánto y cómo contactarlo. */
export function AuctionBiddersDialog({ productId, onClose }: Props) {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setData(null);
    setError('');
    if (!productId) return;
    auctionsApi.bidders(productId).then(setData).catch((e) => setError(e?.message || 'No se pudo cargar'));
  }, [productId]);

  return (
    <Dialog open={!!productId} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{data ? `Ofertas: ${data.product.name}` : 'Ofertas del remate'}</DialogTitle>
        </DialogHeader>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {!data && !error && <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>}
        {data && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {STATUS[data.product.status] || data.product.status} · oferta más alta {formatCurrency(data.product.currentPrice)} · {data.bids.length} {data.bids.length === 1 ? 'oferta' : 'ofertas'}
            </p>
            {data.bids.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Todavía nadie ofertó.</p>
            ) : (
              <ul className="divide-y divide-border rounded-lg border border-border">
                {data.bids.map((b: any) => (
                  <li key={b.id} className="flex items-center justify-between gap-3 p-3">
                    <div className="min-w-0">
                      <p className="flex items-center gap-1.5 text-sm font-semibold">
                        {b.isWinner && <Trophy className="h-4 w-4 text-amber-500" aria-label="Ganador" />}
                        {b.name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {b.email}{b.phone ? ` · ${b.phone}` : ''} · {new Date(b.at).toLocaleString('es-PY')}
                      </p>
                    </div>
                    <span className="shrink-0 font-black tabular-nums">{formatCurrency(b.amount)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
