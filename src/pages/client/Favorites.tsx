import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Loader2, Package } from 'lucide-react';
import { favoritesApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FavoriteButton } from '@/components/shared/FavoriteButton';
import { OfferCountdown } from '@/components/offer/OfferCountdown';
import { AuctionCardBadge } from '@/components/auction/AuctionCardBadge';

export default function ClientFavorites() {
  const [items, setItems] = useState<any[] | null>(null);

  useEffect(() => {
    favoritesApi.list().then(setItems).catch(() => setItems([]));
  }, []);

  if (!items) return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <h1 className="text-2xl font-black">Favoritos</h1>
        <p className="text-sm text-muted-foreground">Te avisamos si uno baja de precio o si una oferta está por terminar.</p>
      </div>

      {items.length === 0 ? (
        <div className="space-y-3 rounded-xl border border-dashed border-border p-8 text-center">
          <Heart className="mx-auto h-8 w-8 text-muted-foreground" aria-hidden />
          <p className="text-sm text-muted-foreground">Todavía no guardaste nada. Tocá el corazón de un producto para seguirlo.</p>
          <Button asChild><Link to="/app/tienda">Ver productos</Link></Button>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((p) => (
            <Card key={p.id}>
              <CardContent className="flex items-center gap-3 p-3">
                <Link to={`/producto/${p.slug || p.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                    {p.images?.[0] ? <img src={p.images[0]} alt="" className="h-full w-full object-cover" /> : <Package className="m-5 h-6 w-6 text-muted-foreground" />}
                  </div>
                  <div className="min-w-0">
                    <p className="line-clamp-1 text-sm font-semibold">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.seller?.storeName}</p>
                    <p className="flex flex-wrap items-baseline gap-2">
                      <span className="font-black tabular-nums">{formatCurrency(p.price)}</span>
                      {p.comparePrice && <span className="text-xs text-muted-foreground line-through">{formatCurrency(p.comparePrice)}</span>}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {p.offer && <OfferCountdown offer={p.offer} compact />}
                      {p.auctionStatus && <AuctionCardBadge status={p.auctionStatus} endsAt={p.auctionEndsAt} />}
                    </div>
                  </div>
                </Link>
                <FavoriteButton productId={p.id} className="border border-border" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
