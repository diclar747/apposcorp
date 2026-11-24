import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { usersApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface GrantTrialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  storeName: string;
  /** Fin de la prueba actual si la tienda ya está en prueba activa */
  trialEnd: string | null;
  onChanged: () => void;
}

const PRESETS = [3, 7, 15, 30];
const DAY_MS = 24 * 60 * 60 * 1000;

const formatDate = (d: Date) => d.toLocaleDateString('es-PY', { day: '2-digit', month: 'short', year: 'numeric' });

/** El admin da o extiende días de prueba gratis a una tienda (panel, POS y venta online). */
export function GrantTrialDialog({ open, onOpenChange, userId, storeName, trialEnd, onChanged }: GrantTrialDialogProps) {
  const [days, setDays] = useState(7);
  const [saving, setSaving] = useState(false);
  const [ending, setEnding] = useState(false);

  useEffect(() => {
    if (open) setDays(7);
  }, [open]);

  const currentEnd = trialEnd ? new Date(trialEnd) : null;
  const inTrial = !!currentEnd && currentEnd > new Date();
  const from = inTrial ? currentEnd! : new Date();
  const newEnd = new Date(from.getTime() + days * DAY_MS);

  const handleGrant = async () => {
    if (!Number.isFinite(days) || days < 1 || days > 365) {
      toast.error('Elegí entre 1 y 365 días');
      return;
    }
    setSaving(true);
    try {
      await usersApi.grantTrial(userId, days);
      toast.success(`${storeName}: prueba gratis hasta el ${formatDate(newEnd)}`);
      onOpenChange(false);
      onChanged();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al dar la prueba gratis');
    } finally {
      setSaving(false);
    }
  };

  const handleEnd = async () => {
    setEnding(true);
    try {
      await usersApi.endTrial(userId);
      toast.success(`Prueba gratis de ${storeName} finalizada`);
      onOpenChange(false);
      onChanged();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al finalizar la prueba');
    } finally {
      setEnding(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] w-[calc(100%-2rem)] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{inTrial ? 'Extender prueba gratis' : 'Dar días de prueba'}</DialogTitle>
          <DialogDescription>
            <strong>{storeName}</strong> podrá usar su panel, cargar productos, vender con el POS y vender online sin plan.
            {inTrial && <> Hoy su prueba vence el <strong>{formatDate(currentEnd!)}</strong>; los días se suman a esa fecha.</>}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((d) => (
              <Button
                key={d}
                type="button"
                size="sm"
                variant={days === d ? 'default' : 'outline'}
                onClick={() => setDays(d)}
              >
                {d} días
              </Button>
            ))}
          </div>
          <div className="space-y-2">
            <Label htmlFor="trial-days">Otra cantidad de días</Label>
            <Input
              id="trial-days"
              type="number"
              inputMode="numeric"
              min={1}
              max={365}
              className="w-28"
              value={days}
              onChange={(e) => setDays(parseInt(e.target.value, 10) || 0)}
              onWheel={(e) => (e.target as HTMLInputElement).blur()}
            />
          </div>
          {days >= 1 && days <= 365 && (
            <p className="text-sm text-muted-foreground">
              La prueba quedará activa hasta el <strong className="text-foreground">{formatDate(newEnd)}</strong>.
            </p>
          )}
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          {inTrial ? (
            <Button variant="outline" className="text-red-600" onClick={handleEnd} disabled={ending || saving}>
              {ending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Finalizar prueba
            </Button>
          ) : <span />}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={handleGrant} disabled={saving || ending} className="bg-emerald-600 hover:bg-emerald-700">
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {inTrial ? 'Extender' : 'Dar prueba'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
