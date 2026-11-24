import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeftRight, ChevronRight, Lock, Plus, Wallet, Archive } from 'lucide-react';
import { AccessDenied } from '@/components/ingenio/AccessDenied';
import { useIngenioSubscription } from '@/hooks/useIngenioSubscription';
import { usePaywallStore } from '@/stores';
import { financeAccountsApi } from '@/lib/api';
import { cn, formatCurrency } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AccountFormDialog, TransferDialog } from '@/components/ingenio/AccountDialogs';
import { accountSubtitle, isCard, kindMeta, type AccountsTotals, type FinanceAccount } from '@/lib/ingenioAccounts';

const EMPTY_TOTALS: AccountsTotals = { cash: 0, bank: 0, wallet: 0, unassigned: 0, available: 0, creditDebt: 0, net: 0 };

const GROUPS: { title: string; kinds: string[] }[] = [
  { title: 'Efectivo', kinds: ['cash'] },
  { title: 'Bancos', kinds: ['savings', 'checking'] },
  { title: 'Billeteras digitales', kinds: ['wallet'] },
  { title: 'Tarjetas de crédito', kinds: ['credit_card'] },
];

export default function IngenioAccounts() {
  const { status, isReadOnly } = useIngenioSubscription();
  const { openPaywall } = usePaywallStore();
  const [accounts, setAccounts] = useState<FinanceAccount[]>([]);
  const [totals, setTotals] = useState<AccountsTotals>(EMPTY_TOTALS);
  const [loading, setLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await financeAccountsApi.getOverview();
      setAccounts(data.accounts || []);
      setTotals(data.totals || EMPTY_TOTALS);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'ACTIVE') load();
    else setLoading(false);
  }, [status, load]);

  const guard = (fn: () => void) => () => (isReadOnly ? openPaywall() : fn());

  if (loading) return <div className="p-8 animate-pulse text-slate-500">Cargando tus cuentas...</div>;
  if (status !== 'ACTIVE') return <AccessDenied status={status} />;

  const visible = accounts.filter((a) => showArchived || !a.isArchived);
  const archivedCount = accounts.filter((a) => a.isArchived).length;

  // Solo los grupos que el usuario usa (o que tienen saldo)
  const has = (kinds: string[]) => accounts.some((a) => kinds.includes(a.kind));
  const breakdown = [
    { label: 'Efectivo', value: totals.cash, dot: 'bg-emerald-400', show: has(['cash']) || totals.cash !== 0 },
    { label: 'Bancos', value: totals.bank, dot: 'bg-sky-400', show: has(['savings', 'checking']) || totals.bank !== 0 },
    { label: 'Billeteras', value: totals.wallet, dot: 'bg-violet-400', show: has(['wallet']) || totals.wallet !== 0 },
    { label: 'Sin cuenta', value: totals.unassigned, dot: 'bg-slate-400', show: totals.unassigned !== 0 },
  ].filter((b) => b.show);

  return (
    <div className="space-y-5 sm:space-y-6 pb-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-[clamp(1.6rem,6vw,2rem)] font-black text-slate-900 dark:text-white tracking-tight leading-none">Mis Cuentas</h1>
          <p className="text-slate-500 font-medium text-sm sm:text-base mt-1">Efectivo, bancos, billeteras y tarjetas: todo tu dinero en un solo lugar.</p>
        </div>
        <div className="grid grid-cols-2 gap-3 md:flex">
          <Button onClick={guard(() => setFormOpen(true))} className="h-12 px-5 rounded-2xl font-bold bg-indigo-600 hover:bg-indigo-700">
            {isReadOnly ? <Lock className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
            Nueva cuenta
          </Button>
          <Button
            variant="outline"
            onClick={guard(() => setTransferOpen(true))}
            disabled={accounts.filter((a) => !a.isArchived).length < 2}
            className="h-12 px-5 rounded-2xl font-bold"
          >
            <ArrowLeftRight className="w-4 h-4 mr-2" />
            Transferir
          </Button>
        </div>
      </div>

      {/* Paneo total */}
      <Card className="bg-gradient-to-br from-[#0b1b3a] via-[#122a55] to-[#0a1120] text-white border-none shadow-2xl rounded-3xl sm:rounded-[2rem] overflow-hidden">
        <CardContent className="p-6 sm:p-8">
          <p className="text-amber-200/90 text-xs sm:text-sm font-bold uppercase tracking-[0.2em] mb-2">Dinero disponible</p>
          <p className="text-[clamp(2.1rem,10vw,3.25rem)] font-black tracking-tight tnum leading-none">{formatCurrency(totals.available)}</p>
          {breakdown.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-5 sm:pt-7 mt-6 border-t border-white/10">
            {breakdown.map((b) => (
              <div key={b.label} className="min-w-0">
                <div className="flex items-center gap-2 mb-1.5 opacity-80">
                  <div className={cn('w-2 h-2 rounded-full shrink-0', b.dot)} />
                  <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest truncate">{b.label}</span>
                </div>
                <p className="text-base sm:text-xl font-black tnum truncate">{formatCurrency(b.value)}</p>
              </div>
            ))}
          </div>
          )}
          {totals.creditDebt !== 0 && (
            <div className="flex flex-wrap items-baseline justify-between gap-2 mt-5 pt-5 border-t border-white/10">
              <span className="text-sm font-bold text-rose-300">Deuda en tarjetas: {formatCurrency(totals.creditDebt)}</span>
              <span className="text-sm font-bold text-white/80">Neto: <span className="tnum">{formatCurrency(totals.net)}</span></span>
            </div>
          )}
        </CardContent>
      </Card>

      {accounts.length === 0 ? (
        <Card className="border-dashed border-2 rounded-3xl">
          <CardContent className="p-8 text-center space-y-3">
            <Wallet className="w-10 h-10 mx-auto text-indigo-500" />
            <p className="text-lg font-black text-slate-900 dark:text-white">Todavía no cargaste cuentas</p>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              Agregá tu efectivo, tu caja de ahorro, tu cuenta corriente o tu tarjeta. Después, al registrar un ingreso o un gasto, elegís de qué cuenta sale y ves el saldo de cada una.
            </p>
            <Button onClick={guard(() => setFormOpen(true))} className="rounded-2xl font-bold bg-indigo-600 hover:bg-indigo-700">
              <Plus className="w-4 h-4 mr-2" /> Agregar mi primera cuenta
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-5">
          {GROUPS.map((group) => {
            const items = visible.filter((a) => group.kinds.includes(a.kind));
            if (!items.length) return null;
            return (
              <section key={group.title} className="space-y-2">
                <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">{group.title}</h2>
                <div className="grid gap-3 md:grid-cols-2">
                  {items.map((a) => {
                    const meta = kindMeta(a.kind);
                    const Icon = meta.icon;
                    const card = isCard(a.kind);
                    const shown = card ? -a.balance : a.balance;
                    return (
                      <Link key={a.id} to={`/ingenio/cuentas/${a.id}`}>
                        <Card className={cn('border-none shadow-lg rounded-2xl hover:shadow-xl transition-shadow active:scale-[0.99]', a.isArchived && 'opacity-60')}>
                          <CardContent className="p-4 sm:p-5 flex items-center gap-3">
                            <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center shrink-0', meta.tint)}>
                              <Icon className="w-5 h-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-black text-slate-900 dark:text-white truncate">
                                {a.name}
                                {a.isArchived && <span className="ml-2 text-[10px] font-bold uppercase text-slate-400">Archivada</span>}
                              </p>
                              <p className="text-xs text-slate-500 truncate">{accountSubtitle(a)}</p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className={cn('font-black tnum', card ? 'text-rose-600' : shown < 0 ? 'text-rose-600' : 'text-slate-900 dark:text-white')}>
                                {formatCurrency(shown)}
                              </p>
                              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                {card ? (a.creditLimit ? `Disp. ${formatCurrency(Math.max(0, a.creditLimit - shown))}` : 'Deuda') : 'Saldo'}
                              </p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                          </CardContent>
                        </Card>
                      </Link>
                    );
                  })}
                </div>
              </section>
            );
          })}
          {archivedCount > 0 && (
            <button
              type="button"
              onClick={() => setShowArchived((v) => !v)}
              className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-700 px-1"
            >
              <Archive className="w-3.5 h-3.5" />
              {showArchived ? 'Ocultar archivadas' : `Ver archivadas (${archivedCount})`}
            </button>
          )}
          {totals.unassigned !== 0 && (
            <p className="text-xs text-slate-500 px-1">
              "Sin cuenta asignada" son ingresos y gastos que registraste sin elegir cuenta ({formatCurrency(totals.unassigned)}). Podés asignarles una cuenta editándolos en Finanzas.
            </p>
          )}
        </div>
      )}

      <AccountFormDialog open={formOpen} onOpenChange={setFormOpen} onSaved={load} onPaywall={openPaywall} />
      <TransferDialog open={transferOpen} onOpenChange={setTransferOpen} accounts={accounts} onSaved={load} onPaywall={openPaywall} />
    </div>
  );
}
