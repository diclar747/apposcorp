import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Loader2, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { commentsApi } from '@/lib/api';
import { loginUrlFor } from '@/lib/redirect';
import { useAuthStore } from '@/stores';
import { Button } from '@/components/ui/button';

const when = (d: string) => new Date(d).toLocaleDateString('es-PY', { day: 'numeric', month: 'short', year: 'numeric' });

/** Comentarios de un producto. Cada comentario nuevo espera la aprobación de la tienda antes de publicarse. */
export function ProductComments({ productId }: { productId: string }) {
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [items, setItems] = useState<any[] | null>(null);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    commentsApi.list(productId).then(setItems).catch(() => setItems([]));
  }, [productId]);
  useEffect(load, [load, isAuthenticated]);

  const send = async () => {
    setError('');
    if (!isAuthenticated) {
      navigate(loginUrlFor(location.pathname + location.search));
      return;
    }
    setSending(true);
    try {
      await commentsApi.create(productId, text.trim());
      setText('');
      toast.success('Recibimos tu comentario. Se publica cuando la tienda lo apruebe.');
      load();
    } catch (e: any) {
      setError(e?.message || 'No se pudo enviar el comentario');
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="space-y-3" aria-label="Comentarios">
      <h2 className="flex items-center gap-2 text-lg font-black"><MessageSquare className="h-5 w-5" aria-hidden /> Comentarios</h2>

      {!items ? (
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Todavía no hay comentarios. Sé la primera persona en opinar.</p>
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border">
          {items.map((c) => (
            <li key={c.id} className="space-y-1 p-3">
              <p className="text-sm font-semibold">
                {c.mine ? 'Vos' : c.name}
                <span className="ml-2 text-xs font-normal text-muted-foreground">{when(c.createdAt)}</span>
                {c.pending && <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[11px] font-bold text-amber-700">Esperando aprobación</span>}
              </p>
              <p className="whitespace-pre-line text-sm text-muted-foreground">{c.body}</p>
            </li>
          ))}
        </ul>
      )}

      <div className="space-y-2">
        <textarea
          value={text}
          onChange={(e) => { setText(e.target.value); setError(''); }}
          maxLength={500}
          rows={3}
          placeholder={isAuthenticated ? 'Escribí tu comentario' : 'Iniciá sesión para comentar'}
          aria-label="Tu comentario"
          className="w-full rounded-xl border border-input bg-background p-3 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"
        />
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">Sin enlaces. La tienda revisa cada comentario antes de publicarlo.</p>
          <Button onClick={send} disabled={sending || (isAuthenticated && text.trim().length < 3)}>
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : isAuthenticated ? 'Enviar comentario' : 'Iniciar sesión'}
          </Button>
        </div>
        {error && <p role="alert" className="text-sm font-semibold text-red-600">{error}</p>}
      </div>
    </section>
  );
}
