import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowLeftRight, ChevronLeft, ChevronRight, Pencil, Scale, Trash2, Archive, ArchiveRestore, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { toast } from 'sonner';
import { AccessDenied } from '@/components/ingenio/AccessDenied';
import { useIngenioSubscription } from '@/hooks/useIngenioSubscription';
import { usePaywallStore } from '@/stores';
import { financeAccountsApi } from '@/lib/api';
import { cn, formatCurrency } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AccountFormDialog, AdjustBalanceDialog, TransferDialog } from '@/components/ingenio/AccountDialogs';
import { accountSubtitle, isCard, kindMeta, type FinanceAccount } from '@/lib/ingenioAccounts';

interface DetailItem {
  id: string;
  source: 'record' | 'movement';
  type: 'income' | 'expense' | 'transfer_in' | 'transfer_out' | 'adjustment';
  date: string;
  description: string;
  notes: string | null;
  category: string | null;
  amount: number;
}

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

const TYPE_LABEL: Record<DetailItem['type'], string> = {
  income: 'Ingreso',
  expense: 'Gasto',
  transfer_in: 'Transferencia recibida',
  transfer_out: 'Transferencia enviada',
  adjustment: 'Ajuste',
};

export default function IngenioAccountDetail() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { status, isReadOnly } = useIngenioSubscription();
  const { openPaywall } = usePaywallStore();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [allTime, setAllTime] = useState(false);
  const [account, setAccount] = useState<FinanceAccount | null>(null);
  const [accounts, setAccounts] = useState<FinanceAccount[]>([]);
  const [items, setItems] = useState<DetailItem[]>([]);
  const [period, setPeriod] = useState({ in: 0, out: 0, net: 0 });
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [movementToDelete, setMovementToDelete] = useState<DetailItem | null>(null);

  const load = useCallback(async () => {
    try {
      const [detail, overview] = await Promise.all([
        financeAccountsApi.getDetail(id, allTime ? undefined : { month, year }),
        financeAccountsApi.getOverview(),
      ]);
      setAccount(detail.account);
      setItems(detail.items || []);
      setPeriod(detail.period || { in: 0, out: 0, net: 0 });
      setAccounts(overview.accounts || []);
    } catch (error) {
      console.error(error);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [id, month, year, allTime]);

  useEffect(() => {
    if (status === 'ACTIVE') load();
    else setLoading(false);
  }, [status, load]);

  const guard = (fn: () => void) => () => (isReadOnly ? openPaywall() : fn());

  const shiftMonth = (delta: number) => {
    const d = new Date(year, month - 1 + delta, 1);
    setMonth(d.getMonth() + 1);
    setYear(d.getFullYear());
  };

  const toggleArchive = async () => {
    if (!account) return;
    try {
      await financeAccountsApi.update(account.id, { isArchived: !account.isArchived });
      toast.success(account.isArchived ? 'Cuenta reactivada' : 'Cuenta archivada');
      load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo actualizar');
    }
  };

  const handleDelete = async () => {
    if (!account) return;
    try {
      await financeAccountsApi.remove(account.id);
      toast.success('Cuenta eliminada');
      navigate('/ingenio/cuentas');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo eliminar');
    }
  };

  const handleDeleteMovement = async () => {
    if (!movementToDelete) return;
    try {
      await financeAccountsApi.removeMovement(movementToDelete.id);
      toast.success('Movimiento eliminado');
      setMovementToDelete(null);
      load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo eliminar');
    }
  };

  if (loading) return <div className="p-8 animate-pulse text-slate-500">Cargando la cuenta...</div>;
  if (status !== 'ACTIVE') return <AccessDenied status={status} />;
  if (notFound || !account) {
    return (
      <div className="p-8 text-center space-y-3">
        <p className="font-bold text-slate-700 dark:text-slate-200">No encontramos esta cuenta.</p>
        <Button variant="outline" onClick={() => navigate('/ingenio/cuentas')}>Volver a Mis Cuentas</Button>
      </div>
    );
  }

  const meta = kindMeta(account.kind);
  const Icon = meta.icon;
  const card = isCard(account.kind);
  const shownBalance = card ? -account.balance : account.balance;

  return (
    <div className="space-y-5 sm:space-y-6 pb-4">
      <Link to="/ingenio/cuentas" className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">
        <ArrowLeft className="w-4 h-4" /> Mis Cuentas
      </Link>

      <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
        <CardContent className="p-5 sm:p-7 space-y-5">
          <div className="flex items-start gap-3">
            <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center shrink-0', meta.tint)}>
              <Icon className="w-6 h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white truncate">{account.name}</h1>
              <p className="text-sm text-slate-500 truncate">{meta.label} · {accountSubtitle(account)}</p>
            </div>
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">{card ? 'Deuda actual' : 'Saldo actual'}</p>
            <p className={cn('text-[clamp(2rem,9vw,2.75rem)] font-black tnum leading-none', card || shownBalance < 0 ? 'text-rose-600' : 'text-slate-900 dark:text-white')}>
              {formatCurrency(shownBalance)}
            </p>
            {card && account.creditLimit ? (
              <p className="text-sm text-slate-500 mt-2">
                Límite {formatCurrency(account.creditLimit)} · Disponible {formatCurrency(Math.max(0, account.creditLimit - shownBalance))}
              </p>
            ) : null}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Button variant="outline" className="rounded-xl font-bold" onClick={guard(() => setAdjustOpen(true))}>
              <Scale className="w-4 h-4 mr-1.5" /> Ajustar saldo
            </Button>
            <Button variant="outline" className="rounded-xl font-bold" onClick={guard(() => setTransferOpen(true))} disabled={accounts.filter((a) => !a.isArchived).length < 2}>
              <ArrowLeftRight className="w-4 h-4 mr-1.5" /> Transferir
            </Button>
            <Button variant="outline" className="rounded-xl font-bold" onClick={guard(() => setEditOpen(true))}>
              <Pencil className="w-4 h-4 mr-1.5" /> Editar
            </Button>
            {account.movementsCount > 0 ? (
              <Button variant="outline" className="rounded-xl font-bold" onClick={guard(toggleArchive)}>
                {account.isArchived ? <ArchiveRestore className="w-4 h-4 mr-1.5" /> : <Archive className="w-4 h-4 mr-1.5" />}
                {account.isArchived ? 'Reactivar' : 'Archivar'}
              </Button>
            ) : (
              <Button variant="outline" className="rounded-xl font-bold text-rose-600" onClick={guard(() => setDeleteOpen(true))}>
                <Trash2 className="w-4 h-4 mr-1.5" /> Eliminar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
        <div className="p-4 sm:p-6 border-b dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-9 w-9" disabled={allTime} onClick={() => shiftMonth(-1)} aria-label="Mes anterior">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="font-black text-slate-900 dark:text-white min-w-[9.5rem] text-center">
              {allTime ? 'Todo el historial' : `${MONTHS[month - 1]} ${year}`}
            </span>
            <Button variant="ghost" size="icon" className="h-9 w-9" disabled={allTime} onClick={() => shiftMonth(1)} aria-label="Mes siguiente">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <button
            type="button"
            onClick={() => setAllTime((v) => !v)}
            className="text-xs font-bold px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
          >
            {allTime ? 'Ver por mes' : 'Ver todo'}
          </button>
        </div>
        <div className="grid grid-cols-3 divide-x dark:divide-slate-800 border-b dark:border-slate-800 text-center">
          <div className="p-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Entró</p>
            <p className="font-black text-emerald-600 tnum text-xs sm:text-base whitespace-nowrap">{formatCurrency(period.in)}</p>
          </div>
          <div className="p-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Salió</p>
            <p className="font-black text-rose-600 tnum text-xs sm:text-base whitespace-nowrap">{formatCurrency(period.out)}</p>
          </div>
          <div className="p-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Neto</p>
            <p className={cn('font-black tnum text-xs sm:text-base whitespace-nowrap', period.net >= 0 ? 'text-slate-900 dark:text-white' : 'text-rose-600')}>{formatCurrency(period.net)}</p>
          </div>
        </div>
        <CardContent className="p-0">
          {items.length === 0 ? (
            <p className="p-8 text-center text-sm text-slate-500">
              Sin movimientos {allTime ? 'todavía' : 'en este mes'}. Al cargar un ingreso o gasto en Finanzas, elegí esta cuenta.
            </p>
          ) : (
            <ul className="divide-y dark:divide-slate-800">
              {items.map((item) => {
                const positive = item.amount >= 0;
                return (
                  <li key={`${item.source}-${item.id}`} className="flex items-center gap-2.5 sm:gap-3 p-3 sm:p-4">
                    <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0',
                      item.type.startsWith('transfer') || item.type === 'adjustment'
                        ? 'bg-slate-100 text-slate-500 dark:bg-slate-800'
                        : positive ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10' : 'bg-rose-50 text-rose-600 dark:bg-rose-500/10')}>
                      {item.type.startsWith('transfer') ? <ArrowLeftRight className="w-4 h-4" />
                        : item.type === 'adjustment' ? <Scale className="w-4 h-4" />
                          : positive ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-slate-900 dark:text-white truncate">{item.description}</p>
                      <p className="text-xs text-slate-500 truncate">
                        {new Date(item.date).toLocaleDateString('es-PY', { day: '2-digit', month: 'short', year: 'numeric' })}
                        {' · '}{TYPE_LABEL[item.type]}{item.category ? ` · ${item.category}` : ''}
                      </p>
                    </div>
                    <p className={cn('font-black tnum shrink-0 text-sm sm:text-base', positive ? 'text-emerald-600' : 'text-rose-600')}>
                      {positive ? '+' : ''}{formatCurrency(item.amount)}
                    </p>
                    {item.source === 'movement' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-400 hover:text-rose-600 shrink-0"
                        onClick={guard(() => setMovementToDelete(item))}
                        aria-label="Eliminar movimiento"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <AccountFormDialog open={editOpen} onOpenChange={setEditOpen} account={account} onSaved={load} onPaywall={openPaywall} />
      <AdjustBalanceDialog open={adjustOpen} onOpenChange={setAdjustOpen} account={account} onSaved={load} onPaywall={openPaywall} />
      <TransferDialog open={transferOpen} onOpenChange={setTransferOpen} accounts={accounts} defaultFromId={account.id} onSaved={load} onPaywall={openPaywall} />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar {account.name}?</AlertDialogTitle>
            <AlertDialogDescription>La cuenta no tiene movimientos. Se borra junto con su saldo inicial.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-rose-600 hover:bg-rose-700" onClick={handleDelete}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!movementToDelete} onOpenChange={(open) => !open && setMovementToDelete(null)}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este movimiento?</AlertDialogTitle>
            <AlertDialogDescription>
              {movementToDelete?.type === 'adjustment'
                ? 'Se deshace el ajuste y el saldo vuelve al calculado.'
                : 'Se deshace la transferencia en las dos cuentas.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-rose-600 hover:bg-rose-700" onClick={handleDeleteMovement}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
