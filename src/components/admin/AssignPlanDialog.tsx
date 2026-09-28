import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { plansApi, usersApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { BillingCycle, SubscriptionPlan } from '@/types';

interface AssignPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  storeName: string;
  onAssigned: () => void;
}

// Misma regla que el servidor (planAllowsOnlineSales): "Tienda Online" y que no sea el Básico
const allowsOnlineSales = (plan: SubscriptionPlan) => {
  const name = plan.name.toLowerCase();
  if (name.includes('básico') || name.includes('basic')) return false;
  return (plan.features || []).some((f) => f.toLowerCase().includes('tienda online'));
};

/** El admin asigna o cambia el plan de una tienda sin que la tienda tenga que pedirlo ni pagarlo desde su panel. */
export function AssignPlanDialog({ open, onOpenChange, userId, storeName, onAssigned }: AssignPlanDialogProps) {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [planId, setPlanId] = useState('');
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [isCommissionBased, setIsCommissionBased] = useState(false);
  const [commission, setCommission] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setPlanId('');
    setBillingCycle('monthly');
    setIsCommissionBased(false);
    setCommission('');
    plansApi.getAll()
      .then((data: SubscriptionPlan[]) => setPlans(data.filter((p) => p.isActive !== false)))
      .catch(() => toast.error('No se pudieron cargar los planes'));
  }, [open]);

  const selected = plans.find((p) => p.id === planId);

  const handleSave = async () => {
    if (!isCommissionBased && !planId) {
      toast.error('Elegí un plan');
      return;
    }
    setSaving(true);
    try {
      await usersApi.assignPlan(userId, isCommissionBased
        ? { customCommission: Number(commission) || 0, isCommissionBased: true } as any
        : { planId, billingCycle });
      toast.success(`Plan asignado a ${storeName}`);
      onOpenChange(false);
      onAssigned();
    } catch (error: any) {
      toast.error(error.message || 'Error al asignar el plan');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] w-[calc(100%-2rem)] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Asignar plan</DialogTitle>
          <DialogDescription>
            Plan de <strong>{storeName}</strong>. Se activa al instante, sin que la tienda tenga que pagarlo desde su panel.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isCommissionBased}
              onChange={(e) => setIsCommissionBased(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300"
            />
            Cobrar por comisión (sin plan fijo)
          </label>

          {!isCommissionBased ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="assign-plan">Plan</Label>
                <Select value={planId} onValueChange={setPlanId}>
                  <SelectTrigger id="assign-plan"><SelectValue placeholder="Elegir un plan..." /></SelectTrigger>
                  <SelectContent>
                    {plans.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}{allowsOnlineSales(p) ? ' · con compra online' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selected && !allowsOnlineSales(selected) && (
                  <p className="text-xs text-amber-600">
                    Con este plan los clientes no pueden comprar online (solo consultar por WhatsApp).
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="assign-cycle">Duración</Label>
                <Select value={billingCycle} onValueChange={(v) => setBillingCycle(v as BillingCycle)}>
                  <SelectTrigger id="assign-cycle"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">1 mes</SelectItem>
                    <SelectItem value="quarterly">3 meses</SelectItem>
                    <SelectItem value="semi_annual">6 meses</SelectItem>
                    <SelectItem value="annual">12 meses</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="assign-commission">Comisión de la plataforma (%)</Label>
              <Input
                id="assign-commission"
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={commission}
                onChange={(e) => setCommission(e.target.value)}
                onWheel={(e) => (e.target as HTMLInputElement).blur()}
                placeholder="Ej: 5"
              />
              <p className="text-xs text-amber-600">
                Sin plan fijo los clientes no pueden comprar online (solo consultar por WhatsApp). Para vender con carrito elegí un plan.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Asignar plan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
