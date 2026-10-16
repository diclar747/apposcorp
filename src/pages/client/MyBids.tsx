import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Gavel, Loader2, Package } from 'lucide-react';
import { auctionsApi } from '@/lib/api';
import { formatCurrency, cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AuctionCardBadge } from '@/components/auction/AuctionCardBadge';

const fmt = (d: string) => new Date(d).toLocaleString('es-PY', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

export default function ClientMyBids() {
  const [items, setItems] = useState<any[] | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    auctionsApi.mine().then(setItems).catch(() => setItems([]));
  }, []);

  if (!items) return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  const state = (b: any) => {
    if (b.status === 'open') return b.iAmWinning ? { text: 'Vas ganando', cls: 'bg-emerald-100 text-emerald-700' } : { text: 'Te superaron', cls: 'bg-red-100 text-red-700' };
    if (b.canPay) return { text: `Ganaste: pagá antes del ${b.payBy ? fmt(b.payBy) : 'plazo'}`, cls: 'bg-emerald-100 text-emerald-700' };
    if (b.iWon) return { text: 'Ganaste y ya lo pagaste', cls: 'bg-emerald-100 text-emerald-700' };
    if (b.status === 'unpaid') return { text: 'Venció el plazo de pago', cls: 'bg-red-100 text-red-700' };
    return { text: 'No ganaste', cls: 'bg-slate-100 text-slate-600' };
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <h1 className="text-2xl font-black">Mis ofertas</h1>
        <p className="text-sm text-muted-foreground">Los remates donde ofertaste y cómo te va en cada uno.</p>
      </div>

      {items.length === 0 ? (
        <div className="space-y-3 rounded-xl border border-dashed border-border p-8 text-center">
          <Gavel className="mx-auto h-8 w-8 text-muted-foreground" aria-hidden />
          <p className="text-sm text-muted-foreground">Todavía no ofertaste en ningún remate. Buscá la categoría Remates en una tienda.</p>
          <Button asChild><Link to="/app/tienda">Ver productos</Link></Button>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((b) => {
            const st = state(b);
            return (
              <Card key={b.id}>
                <CardContent className="space-y-2 p-3">
                  <Link to={`/producto/${b.slug || b.id}`} className="flex items-center gap-3">
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                      {b.image ? <img src={b.image} alt="" className="h-full w-full object-cover" /> : <Package className="m-4 h-6 w-6 text-muted-foreground" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 text-sm font-semibold">{b.name}</p>
                      <p className="text-xs text-muted-foreground">Tu mejor oferta {formatCurrency(b.myBest)} · precio actual {formatCurrency(b.currentPrice)}</p>
                    </div>
                  </Link>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-bold', st.cls)}>{st.text}</span>
                    <AuctionCardBadge status={b.status} endsAt={b.endsAt} />
                  </div>
                  {b.canPay && <Button className="w-full" onClick={() => navigate(`/producto/${b.slug || b.id}`)}>Ir a pagar</Button>}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
