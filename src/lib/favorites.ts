import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { favoritesApi } from '@/lib/api';
import { loginUrlFor } from '@/lib/redirect';
import { useAuthStore } from '@/stores';

// Una sola lista de favoritos por navegador, compartida por todos los corazones de la pantalla.
let ids: Set<string> | null = null;
let loading: Promise<void> | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

const load = () => {
  if (ids) return Promise.resolve();
  if (!loading) {
    loading = favoritesApi
      .ids()
      .then((r: string[]) => { ids = new Set(r); })
      .catch(() => { ids = new Set(); })
      .finally(() => { loading = null; emit(); });
  }
  return loading;
};

export function useFavorite(productId: string) {
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [, force] = useState(0);

  useEffect(() => {
    const l = () => force((n) => n + 1);
    listeners.add(l);
    if (isAuthenticated) load();
    else ids = null; // cerró sesión: no se arrastran favoritos de otra cuenta
    return () => { listeners.delete(l); };
  }, [isAuthenticated]);

  const isFav = !!ids?.has(productId);

  const toggle = useCallback(async () => {
    if (!isAuthenticated) {
      // Guardar favoritos necesita cuenta: se inicia sesión y se vuelve acá
      navigate(loginUrlFor(location.pathname + location.search));
      return;
    }
    await load();
    const had = ids!.has(productId);
    // Se actualiza al instante y se deshace si el servidor falla
    if (had) ids!.delete(productId); else ids!.add(productId);
    emit();
    try {
      if (had) await favoritesApi.remove(productId);
      else {
        await favoritesApi.add(productId);
        toast.success('Guardado en favoritos. Te avisamos si baja de precio o la oferta está por terminar.');
      }
    } catch (e: any) {
      if (had) ids!.add(productId); else ids!.delete(productId);
      emit();
      toast.error(e?.message || 'No se pudo actualizar favoritos');
    }
  }, [isAuthenticated, productId, navigate, location]);

  return { isFav, toggle };
}
