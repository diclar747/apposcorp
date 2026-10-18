import { useCallback, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { commentsApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

/** Cola de comentarios por aprobar: la tienda ve los de sus productos, el superadmin todos. */
export function CommentsModerationDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [rows, setRows] = useState<any[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(() => {
    commentsApi.moderation().then(setRows).catch((e) => { toast.error(e?.message || 'No se pudo cargar'); setRows([]); });
  }, []);
  useEffect(() => { if (open) { setRows(null); load(); } }, [open, load]);

  const act = async (id: string, status: 'approved' | 'hidden') => {
    setBusy(id);
    try {
      await commentsApi.moderate(id, status);
      setRows((r) => (r || []).filter((x) => x.id !== id));
      toast.success(status === 'approved' ? 'Comentario publicado' : 'Comentario ocultado');
    } catch (e: any) {
      toast.error(e?.message || 'No se pudo actualizar');
    } finally {
      setBusy(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader><DialogTitle>Comentarios por aprobar</DialogTitle></DialogHeader>
        {!rows ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : rows.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No hay comentarios esperando aprobación.</p>
        ) : (
          <ul className="space-y-2">
            {rows.map((c) => (
              <li key={c.id} className="space-y-2 rounded-lg border border-border p-3">
                <p className="text-xs text-muted-foreground">{c.author} · {c.email} · sobre <strong className="text-foreground">{c.productName}</strong></p>
                <p className="whitespace-pre-line text-sm">{c.body}</p>
                <div className="flex gap-2">
                  <Button size="sm" disabled={busy === c.id} onClick={() => act(c.id, 'approved')}>Publicar</Button>
                  <Button size="sm" variant="outline" disabled={busy === c.id} onClick={() => act(c.id, 'hidden')}>Ocultar</Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
