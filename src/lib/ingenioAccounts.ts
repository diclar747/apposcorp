import { Banknote, Landmark, PiggyBank, Smartphone, CreditCard, type LucideIcon } from 'lucide-react';

// Cuentas de Ingenio Millonario: tipos, metadatos y helpers de montos (sin componentes).

// ─── Tipos y metadatos ───────────────────────────────────────────────────────

export type AccountKind = 'cash' | 'savings' | 'checking' | 'wallet' | 'credit_card';

export interface FinanceAccount {
  id: string;
  name: string;
  kind: AccountKind;
  bankName: string | null;
  accountNumber: string | null;
  openingBalance: number;
  creditLimit: number | null;
  color: string | null;
  isArchived: boolean;
  income: number;
  expenses: number;
  transfersIn: number;
  transfersOut: number;
  adjustments: number;
  balance: number;
  movementsCount: number;
}

export interface AccountsTotals {
  cash: number;
  bank: number;
  wallet: number;
  unassigned: number;
  available: number;
  creditDebt: number;
  net: number;
}

export const ACCOUNT_KINDS: Record<AccountKind, { label: string; short: string; icon: LucideIcon; tint: string }> = {
  cash: { label: 'Efectivo', short: 'Efectivo', icon: Banknote, tint: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400' },
  savings: { label: 'Caja de ahorro', short: 'Ahorro', icon: PiggyBank, tint: 'text-sky-600 bg-sky-50 dark:bg-sky-500/10 dark:text-sky-400' },
  checking: { label: 'Cuenta corriente', short: 'Corriente', icon: Landmark, tint: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 dark:text-indigo-400' },
  wallet: { label: 'Billetera digital', short: 'Billetera', icon: Smartphone, tint: 'text-violet-600 bg-violet-50 dark:bg-violet-500/10 dark:text-violet-400' },
  credit_card: { label: 'Tarjeta de crédito', short: 'Tarjeta', icon: CreditCard, tint: 'text-rose-600 bg-rose-50 dark:bg-rose-500/10 dark:text-rose-400' },
};

export const kindMeta = (kind: string) => ACCOUNT_KINDS[(kind as AccountKind)] ?? ACCOUNT_KINDS.savings;
export const isCard = (kind: string) => kind === 'credit_card';

/** Texto secundario: banco y últimos dígitos */
export const accountSubtitle = (a: Pick<FinanceAccount, 'kind' | 'bankName' | 'accountNumber'>) =>
  [a.bankName || kindMeta(a.kind).label, a.accountNumber ? `••${a.accountNumber.slice(-4)}` : null].filter(Boolean).join(' · ');

// ─── Monto en guaraníes (solo dígitos, con puntos de miles) ──────────────────

export const parseGs = (v: string) => Number((v || '').replace(/\D/g, '')) || 0;
export const formatGsInput = (v: string) => {
  const digits = (v || '').replace(/\D/g, '');
  return digits ? Number(digits).toLocaleString('es-PY') : '';
};

