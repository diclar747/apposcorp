import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { financeAccountsApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ACCOUNT_KINDS, formatGsInput, isCard, parseGs, type AccountKind, type FinanceAccount } from '@/lib/ingenioAccounts';

const todayISO = () => new Date().toLocaleDateString('en-CA');

function MoneyInput({ id, value, onChange, placeholder = '0' }: { id: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">Gs.</span>
      <Input
        id={id}
        inputMode="numeric"
        className="h-12 rounded-xl pl-11 font-bold tnum"
        value={value}
        onChange={(e) => onChange(formatGsInput(e.target.value))}
        placeholder={placeholder}
      />
    </div>
  );
}

const handleError = (error: unknown, onPaywall?: () => void, fallback = 'No se pudo guardar') => {
  const msg = error instanceof Error ? error.message : '';
  if (onPaywall && (msg.includes('Suscripción requerida') || msg.includes('REQUIRES_SUBSCRIPTION'))) {
    onPaywall();
    return;
  }
  toast.error(msg || fallback);
};

// ─── Crear / editar cuenta ───────────────────────────────────────────────────

export function AccountFormDialog({ open, onOpenChange, account, onSaved, onPaywall }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account?: FinanceAccount | null;
  onSaved: () => void;
  onPaywall?: () => void;
}) {
  const editing = !!account;
  const [name, setName] = useState('');
  const [kind, setKind] = useState<AccountKind>('savings');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [opening, setOpening] = useState('');
  const [limit, setLimit] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(account?.name ?? '');
    setKind((account?.kind as AccountKind) ?? 'savings');
    setBankName(account?.bankName ?? '');
    setAccountNumber(account?.accountNumber ?? '');
    // Tarjeta: el saldo inicial se guarda negativo (deuda) y se muestra positivo
    const ob = account ? Math.abs(account.openingBalance) : 0;
    setOpening(ob ? ob.toLocaleString('es-PY') : '');
    setLimit(account?.creditLimit ? account.creditLimit.toLocaleString('es-PY') : '');
  }, [open, account]);

  const card = isCard(kind);
  const needsBank = kind === 'savings' || kind === 'checking' || kind === 'credit_card' || kind === 'wallet';

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Poné un nombre a la cuenta');
      return;
    }
    const amount = parseGs(opening);
    const payload = {
      name: name.trim(),
      kind,
      bankName: needsBank ? bankName : '',
      accountNumber: needsBank ? accountNumber : '',
      openingBalance: card ? -amount : amount,
      creditLimit: card ? (parseGs(limit) || null) : null,
    };
    setSaving(true);
    try {
      if (editing) await financeAccountsApi.update(account!.id, payload);
      else await financeAccountsApi.create(payload);
      toast.success(editing ? 'Cuenta actualizada' : 'Cuenta creada');
      onOpenChange(false);
      onSaved();
    } catch (error) {
      handleError(error, onPaywall);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-3xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black">{editing ? 'Editar cuenta' : 'Nueva cuenta'}</DialogTitle>
          <DialogDescription>Registrá dónde tenés tu plata: efectivo, bancos, billeteras o tarjetas.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSave} className="space-y-4 pt-1">
          <div className="space-y-2">
            <Label htmlFor="acc-kind" className="font-bold">Tipo</Label>
            <Select value={kind} onValueChange={(v) => setKind(v as AccountKind)}>
              <SelectTrigger id="acc-kind" className="h-12 rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(ACCOUNT_KINDS) as AccountKind[]).map((k) => (
                  <SelectItem key={k} value={k}>{ACCOUNT_KINDS[k].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="acc-name" className="font-bold">Nombre</Label>
            <Input
              id="acc-name"
              className="h-12 rounded-xl"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={card ? 'Ej: Visa Itaú' : kind === 'cash' ? 'Ej: Billetera / Caja chica' : 'Ej: Ahorro Familia'}
              maxLength={80}
            />
          </div>
          {needsBank && (
            <div className="grid grid-cols-[1fr_7rem] gap-3">
              <div className="space-y-2 min-w-0">
                <Label htmlFor="acc-bank" className="font-bold">{kind === 'wallet' ? 'Proveedor' : 'Banco'}</Label>
                <Input
                  id="acc-bank"
                  className="h-12 rounded-xl"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder={kind === 'wallet' ? 'Ej: Tigo Money' : 'Ej: Itaú, Ueno, Continental'}
                  maxLength={80}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="acc-number" className="font-bold">Últimos 4</Label>
                <Input
                  id="acc-number"
                  inputMode="numeric"
                  className="h-12 rounded-xl"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, '').slice(-4))}
                  placeholder="1234"
                />
              </div>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="acc-opening" className="font-bold">{card ? 'Deuda actual de la tarjeta' : 'Saldo actual'}</Label>
            <MoneyInput id="acc-opening" value={opening} onChange={setOpening} />
            <p className="text-xs text-slate-500">
              {editing
                ? 'Es el saldo con el que arrancó la cuenta. Para corregir el saldo de hoy usá "Ajustar saldo".'
                : 'Lo que tiene hoy. Desde acá se suman los ingresos y se restan los gastos que registres en esta cuenta.'}
              {!editing && !card && ' Si ya la cargaste como Activo en Patrimonio, borrá ese activo para no contarla dos veces.'}
            </p>
          </div>
          {card && (
            <div className="space-y-2">
              <Label htmlFor="acc-limit" className="font-bold">Límite de la tarjeta (opcional)</Label>
              <MoneyInput id="acc-limit" value={limit} onChange={setLimit} />
            </div>
          )}
          <Button type="submit" disabled={saving} className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-black text-base">
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {editing ? 'Guardar cambios' : 'Crear cuenta'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Transferencia entre cuentas ─────────────────────────────────────────────

export function TransferDialog({ open, onOpenChange, accounts, defaultFromId, onSaved, onPaywall }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accounts: FinanceAccount[];
  defaultFromId?: string;
  onSaved: () => void;
  onPaywall?: () => void;
}) {
  const active = accounts.filter((a) => !a.isArchived);
  const [fromId, setFromId] = useState('');
  const [toId, setToId] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(todayISO());
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    const from = defaultFromId || active[0]?.id || '';
    setFromId(from);
    setToId(active.find((a) => a.id !== from)?.id || '');
    setAmount('');
    setDate(todayISO());
    setDescription('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, defaultFromId]);

  const to = active.find((a) => a.id === toId);
  const from = active.find((a) => a.id === fromId);
  const hint = to && isCard(to.kind) ? 'Pago de tarjeta: baja la deuda sin contar como gasto.'
    : from && from.kind !== 'cash' && to?.kind === 'cash' ? 'Retiro de cajero: pasa del banco a tu efectivo.'
      : from?.kind === 'cash' && to && to.kind !== 'cash' ? 'Depósito: pasa de tu efectivo a la cuenta.'
        : 'No cuenta como ingreso ni gasto: solo mueve plata entre tus cuentas.';

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = parseGs(amount);
    if (!fromId || !toId || fromId === toId) {
      toast.error('Elegí dos cuentas distintas');
      return;
    }
    if (value <= 0) {
      toast.error('Ingresá un monto');
      return;
    }
    setSaving(true);
    try {
      await financeAccountsApi.transfer({ fromAccountId: fromId, toAccountId: toId, amount: value, date, description });
      toast.success(`Transferencia de ${formatCurrency(value)} registrada`);
      onOpenChange(false);
      onSaved();
    } catch (error) {
      handleError(error, onPaywall);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-3xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black">Transferir entre cuentas</DialogTitle>
          <DialogDescription>{hint}</DialogDescription>
        </DialogHeader>
        {active.length < 2 ? (
          <p className="text-sm text-slate-500 py-4">Necesitás al menos dos cuentas activas para transferir.</p>
        ) : (
          <form onSubmit={handleSave} className="space-y-4 pt-1">
            <div className="space-y-2">
              <Label htmlFor="tr-from" className="font-bold">Desde</Label>
              <Select value={fromId} onValueChange={(v) => { setFromId(v); if (v === toId) setToId(active.find((a) => a.id !== v)?.id || ''); }}>
                <SelectTrigger id="tr-from" className="h-12 rounded-xl"><SelectValue placeholder="Elegir cuenta" /></SelectTrigger>
                <SelectContent>
                  {active.map((a) => <SelectItem key={a.id} value={a.id}>{a.name} · {formatCurrency(a.balance)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tr-to" className="font-bold">Hacia</Label>
              <Select value={toId} onValueChange={setToId}>
                <SelectTrigger id="tr-to" className="h-12 rounded-xl"><SelectValue placeholder="Elegir cuenta" /></SelectTrigger>
                <SelectContent>
                  {active.filter((a) => a.id !== fromId).map((a) => <SelectItem key={a.id} value={a.id}>{a.name} · {formatCurrency(a.balance)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tr-amount" className="font-bold">Monto</Label>
              <MoneyInput id="tr-amount" value={amount} onChange={setAmount} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="tr-date" className="font-bold">Fecha</Label>
                <Input id="tr-date" type="date" className="h-12 rounded-xl" value={date} onChange={(e) => setDate(e.target.value)} required />
              </div>
              <div className="space-y-2 min-w-0">
                <Label htmlFor="tr-desc" className="font-bold">Nota</Label>
                <Input id="tr-desc" className="h-12 rounded-xl" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Opcional" maxLength={120} />
              </div>
            </div>
            <Button type="submit" disabled={saving} className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-black text-base">
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Transferir
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Ajuste de saldo (conciliación) ──────────────────────────────────────────

export function AdjustBalanceDialog({ open, onOpenChange, account, onSaved, onPaywall }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account: FinanceAccount | null;
  onSaved: () => void;
  onPaywall?: () => void;
}) {
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);
  const card = !!account && isCard(account.kind);

  useEffect(() => {
    if (open && account) {
      const v = Math.abs(account.balance);
      setValue(v ? Math.round(v).toLocaleString('es-PY') : '');
    }
  }, [open, account]);

  if (!account) return null;
  const actual = card ? -parseGs(value) : parseGs(value);
  const diff = actual - account.balance;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await financeAccountsApi.adjust(account.id, { actualBalance: actual, date: todayISO() });
      toast.success(res?.adjusted ? `Saldo ajustado (${diff > 0 ? '+' : ''}${formatCurrency(diff)})` : 'El saldo ya coincidía');
      onOpenChange(false);
      onSaved();
    } catch (error) {
      handleError(error, onPaywall);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black">Ajustar saldo</DialogTitle>
          <DialogDescription>
            {card
              ? `¿Cuánto debés hoy en ${account.name} según tu extracto? Registramos la diferencia para que coincida.`
              : `¿Cuánto tiene hoy ${account.name} según tu banco o tu conteo? Registramos la diferencia para que coincida.`}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSave} className="space-y-4 pt-1">
          <p className="text-sm text-slate-500">
            {card ? 'Deuda en el sistema' : 'Saldo en el sistema'}: <strong className="text-slate-900 dark:text-white tnum">{formatCurrency(Math.abs(account.balance))}</strong>
          </p>
          <div className="space-y-2">
            <Label htmlFor="adj-value" className="font-bold">{card ? 'Deuda real' : 'Saldo real'}</Label>
            <MoneyInput id="adj-value" value={value} onChange={setValue} />
          </div>
          {diff !== 0 && (
            <p className={diff > 0 ? 'text-sm font-bold text-emerald-600' : 'text-sm font-bold text-rose-600'}>
              Diferencia a registrar: {diff > 0 ? '+' : ''}{formatCurrency(diff)}
            </p>
          )}
          <Button type="submit" disabled={saving} className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-black text-base">
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Ajustar
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
