import { Heart } from 'lucide-react';
import { useFavorite } from '@/lib/favorites';
import { cn } from '@/lib/utils';

/** Corazón para guardar un producto en favoritos. Sin sesión lleva a iniciar sesión y vuelve. */
export function FavoriteButton({ productId, className }: { productId: string; className?: string }) {
  const { isFav, toggle } = useFavorite(productId);
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); toggle(); }}
      aria-pressed={isFav}
      aria-label={isFav ? 'Quitar de favoritos' : 'Guardar en favoritos'}
      className={cn(
        'flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-md backdrop-blur transition-colors hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0B1F4B]',
        isFav ? 'text-[#D52B1E]' : 'text-slate-500',
        className,
      )}
    >
      <Heart className={cn('h-5 w-5', isFav && 'fill-current')} aria-hidden />
    </button>
  );
}
