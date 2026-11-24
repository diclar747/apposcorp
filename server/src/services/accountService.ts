import { prisma } from '../utils/prisma.js';

// Cuentas de Ingenio Millonario.
// Saldo de una cuenta = saldo inicial + ingresos − gastos + transferencias recibidas − enviadas + ajustes.
// Las transferencias no son ingreso ni gasto: solo mueven plata entre cuentas (en el total se anulan).

export const ACCOUNT_KINDS = ['cash', 'savings', 'checking', 'wallet', 'credit_card'] as const;
export type AccountKind = (typeof ACCOUNT_KINDS)[number];

export const isAccountKind = (v: unknown): v is AccountKind =>
  typeof v === 'string' && (ACCOUNT_KINDS as readonly string[]).includes(v);

export interface AccountWithBalance {
  id: string;
  name: string;
  kind: string;
  bankName: string | null;
  accountNumber: string | null;
  openingBalance: number;
  creditLimit: number | null;
  color: string | null;
  isArchived: boolean;
  createdAt: Date;
  income: number;
  expenses: number;
  transfersIn: number;
  transfersOut: number;
  adjustments: number;
  balance: number;
  movementsCount: number;
}

export interface AccountsOverview {
  accounts: AccountWithBalance[];
  totals: {
    cash: number; // efectivo
    bank: number; // caja de ahorro + cuenta corriente
    wallet: number; // billeteras digitales
    unassigned: number; // ingresos − gastos sin cuenta asignada
    available: number; // todo lo anterior: plata disponible
    creditDebt: number; // lo que se debe en tarjetas (positivo)
    net: number; // disponible − deuda de tarjetas
  };
}

const round = (n: number) => Math.round(n * 100) / 100;

/** Cuentas del usuario con su saldo calculado y el paneo total. */
export const getAccountsOverview = async (userId: string): Promise<AccountsOverview> => {
  const [accounts, recordSums, movements, unassignedSums] = await Promise.all([
    prisma.financialAccount.findMany({ where: { userId }, orderBy: [{ isArchived: 'asc' }, { createdAt: 'asc' }] }),
    prisma.financialRecord.groupBy({
      by: ['accountId', 'type'],
      where: { userId, accountId: { not: null }, type: { in: ['income', 'expense'] } },
      _sum: { amount: true },
      _count: { _all: true },
    }),
    prisma.accountMovement.findMany({
      where: { userId },
      select: { type: true, fromAccountId: true, toAccountId: true, amount: true },
    }),
    prisma.financialRecord.groupBy({
      by: ['type'],
      where: { userId, accountId: null, type: { in: ['income', 'expense'] } },
      _sum: { amount: true },
    }),
  ]);

  const list: AccountWithBalance[] = accounts.map((a) => {
    const sum = (type: string) => recordSums.find((r) => r.accountId === a.id && r.type === type);
    const income = sum('income')?._sum.amount ?? 0;
    const expenses = sum('expense')?._sum.amount ?? 0;
    let transfersIn = 0;
    let transfersOut = 0;
    let adjustments = 0;
    let movementsCount = (sum('income')?._count._all ?? 0) + (sum('expense')?._count._all ?? 0);
    for (const m of movements) {
      if (m.type === 'adjustment') {
        if (m.toAccountId === a.id) { adjustments += m.amount; movementsCount++; }
        continue;
      }
      if (m.toAccountId === a.id) { transfersIn += m.amount; movementsCount++; }
      if (m.fromAccountId === a.id) { transfersOut += m.amount; movementsCount++; }
    }
    const balance = a.openingBalance + income - expenses + transfersIn - transfersOut + adjustments;
    return {
      id: a.id,
      name: a.name,
      kind: a.kind,
      bankName: a.bankName,
      accountNumber: a.accountNumber,
      openingBalance: a.openingBalance,
      creditLimit: a.creditLimit,
      color: a.color,
      isArchived: a.isArchived,
      createdAt: a.createdAt,
      income: round(income),
      expenses: round(expenses),
      transfersIn: round(transfersIn),
      transfersOut: round(transfersOut),
      adjustments: round(adjustments),
      balance: round(balance),
      movementsCount,
    };
  });

  const byKind = (kinds: string[]) => list.filter((a) => kinds.includes(a.kind)).reduce((s, a) => s + a.balance, 0);
  const unassignedIncome = unassignedSums.find((r) => r.type === 'income')?._sum.amount ?? 0;
  const unassignedExpense = unassignedSums.find((r) => r.type === 'expense')?._sum.amount ?? 0;
  const cash = byKind(['cash']);
  const bank = byKind(['savings', 'checking']);
  const wallet = byKind(['wallet']);
  const unassigned = unassignedIncome - unassignedExpense;
  const available = cash + bank + wallet + unassigned;
  // Saldo de tarjeta negativo = deuda. Un saldo a favor en la tarjeta suma como disponible negativo de deuda.
  const cardBalance = byKind(['credit_card']);
  const creditDebt = -cardBalance;

  return {
    accounts: list,
    totals: {
      cash: round(cash),
      bank: round(bank),
      wallet: round(wallet),
      unassigned: round(unassigned),
      available: round(available),
      creditDebt: round(creditDebt),
      net: round(available - creditDebt),
    },
  };
};

/**
 * Lo que las cuentas suman al saldo además de los ingresos/gastos: saldos iniciales y ajustes.
 * (Las transferencias se anulan entre cuentas.) Se usa para el Patrimonio Neto.
 */
export const getAccountsExtraBalance = async (userId: string): Promise<number> => {
  const [opening, adjustments] = await Promise.all([
    prisma.financialAccount.aggregate({ where: { userId }, _sum: { openingBalance: true } }),
    prisma.accountMovement.aggregate({ where: { userId, type: 'adjustment' }, _sum: { amount: true } }),
  ]);
  return (opening._sum.openingBalance ?? 0) + (adjustments._sum.amount ?? 0);
};

/** Verifica que la cuenta exista y sea del usuario. */
export const findOwnAccount = (userId: string, accountId: string) =>
  prisma.financialAccount.findFirst({ where: { id: accountId, userId } });
