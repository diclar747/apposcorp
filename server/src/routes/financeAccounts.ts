import { Router } from 'express';
import { prisma } from '../utils/prisma.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { requireActiveSubscription } from '../middleware/ingenio.js';
import { parseClientDate } from '../utils/clientDate.js';
import { findOwnAccount, getAccountsOverview, isAccountKind } from '../services/accountService.js';

// Ingenio Millonario: cuentas (efectivo, caja de ahorro, cuenta corriente, billetera, tarjeta),
// transferencias entre cuentas y ajustes de saldo. Leer es libre; escribir requiere suscripción activa.
const router = Router();

const MAX_AMOUNT = 1e13;
const isValidAmount = (n: number) => Number.isFinite(n) && Math.abs(n) <= MAX_AMOUNT;

const cleanText = (v: unknown, max = 80): string | null => {
  if (typeof v !== 'string') return null;
  const t = v.trim().slice(0, max);
  return t || null;
};

/** Campos editables de una cuenta a partir del body (solo los que vienen). */
const accountFields = (body: any) => {
  const data: Record<string, unknown> = {};
  if (body.name !== undefined) data.name = cleanText(body.name) ?? '';
  if (body.kind !== undefined) data.kind = body.kind;
  if (body.bankName !== undefined) data.bankName = cleanText(body.bankName);
  if (body.accountNumber !== undefined) data.accountNumber = cleanText(body.accountNumber, 40);
  if (body.openingBalance !== undefined) data.openingBalance = Number(body.openingBalance) || 0;
  if (body.creditLimit !== undefined) data.creditLimit = body.creditLimit === null || body.creditLimit === '' ? null : Number(body.creditLimit) || 0;
  if (body.color !== undefined) data.color = cleanText(body.color, 20);
  if (body.isArchived !== undefined) data.isArchived = !!body.isArchived;
  return data;
};

const validateAccountFields = (data: Record<string, unknown>, creating: boolean): string | null => {
  if (creating || data.name !== undefined) {
    if (!data.name) return 'Poné un nombre a la cuenta';
  }
  if (creating || data.kind !== undefined) {
    if (!isAccountKind(data.kind)) return 'Tipo de cuenta inválido';
  }
  if (data.openingBalance !== undefined && !isValidAmount(data.openingBalance as number)) return 'Saldo inicial inválido';
  if (data.creditLimit !== undefined && data.creditLimit !== null && !isValidAmount(data.creditLimit as number)) return 'Límite inválido';
  return null;
};

// Paneo: cuentas con saldo + totales (efectivo, bancos, billeteras, sin cuenta, deuda de tarjetas)
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    res.json(await getAccountsOverview(req.user!.userId));
  } catch (error) {
    console.error('Get accounts error:', error);
    res.status(500).json({ error: 'Error al cargar las cuentas' });
  }
});

router.post('/', authenticate, requireActiveSubscription, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const data = accountFields(req.body);
    const err = validateAccountFields(data, true);
    if (err) return res.status(400).json({ error: err });

    const count = await prisma.financialAccount.count({ where: { userId } });
    if (count >= 50) return res.status(400).json({ error: 'Llegaste al máximo de 50 cuentas' });

    const account = await prisma.financialAccount.create({
      data: { ...(data as any), userId, isArchived: false },
    });
    res.status(201).json(account);
  } catch (error) {
    console.error('Create account error:', error);
    res.status(500).json({ error: 'Error al crear la cuenta' });
  }
});

// Transferencia entre dos cuentas propias (retiro de cajero, depósito, pago de tarjeta...)
router.post('/transfer', authenticate, requireActiveSubscription, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const { fromAccountId, toAccountId, date, description } = req.body;
    const amount = Number(req.body.amount);
    if (!fromAccountId || !toAccountId || fromAccountId === toAccountId) {
      return res.status(400).json({ error: 'Elegí dos cuentas distintas' });
    }
    if (!isValidAmount(amount) || amount <= 0) {
      return res.status(400).json({ error: 'Monto inválido' });
    }
    const [from, to] = await Promise.all([findOwnAccount(userId, fromAccountId), findOwnAccount(userId, toAccountId)]);
    if (!from || !to) return res.status(400).json({ error: 'Cuenta no encontrada' });

    const movement = await prisma.accountMovement.create({
      data: {
        userId,
        type: 'transfer',
        fromAccountId,
        toAccountId,
        amount,
        date: parseClientDate(date),
        description: cleanText(description, 120),
      },
    });
    res.status(201).json(movement);
  } catch (error) {
    console.error('Transfer error:', error);
    res.status(500).json({ error: 'Error al registrar la transferencia' });
  }
});

// Borrar una transferencia o un ajuste
router.delete('/movements/:id', authenticate, requireActiveSubscription, async (req: AuthRequest, res) => {
  try {
    const result = await prisma.accountMovement.deleteMany({
      where: { id: req.params.id as string, userId: req.user!.userId },
    });
    if (!result.count) return res.status(404).json({ error: 'Movimiento no encontrado' });
    res.json({ success: true });
  } catch (error) {
    console.error('Delete movement error:', error);
    res.status(500).json({ error: 'Error al borrar el movimiento' });
  }
});

// Detalle de una cuenta: saldo y movimientos (ingresos, gastos, transferencias, ajustes).
// ?month=1..12&year=YYYY filtra los movimientos; el saldo siempre es el total.
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const id = req.params.id as string;
    const overview = await getAccountsOverview(userId);
    const account = overview.accounts.find((a) => a.id === id);
    if (!account) return res.status(404).json({ error: 'Cuenta no encontrada' });

    const month = Number(req.query.month);
    const year = Number(req.query.year);
    let dateFilter: { gte: Date; lt: Date } | undefined;
    if (month >= 1 && month <= 12 && year > 1900) {
      dateFilter = {
        gte: new Date(Date.UTC(year, month - 1, 1, 3)),
        lt: new Date(Date.UTC(year, month, 1, 3)),
      };
    }

    const [records, movements] = await Promise.all([
      prisma.financialRecord.findMany({
        where: { userId, accountId: id, type: { in: ['income', 'expense'] }, ...(dateFilter && { date: dateFilter }) },
        include: { category: { select: { name: true, color: true } } },
        orderBy: { date: 'desc' },
      }),
      prisma.accountMovement.findMany({
        where: { userId, OR: [{ fromAccountId: id }, { toAccountId: id }], ...(dateFilter && { date: dateFilter }) },
        include: {
          fromAccount: { select: { id: true, name: true } },
          toAccount: { select: { id: true, name: true } },
        },
        orderBy: { date: 'desc' },
      }),
    ]);

    // Lista unificada: amount con signo según el efecto en esta cuenta
    const items = [
      ...records.map((r) => ({
        id: r.id,
        source: 'record' as const,
        type: r.type,
        date: r.date,
        description: r.description,
        notes: r.notes,
        category: r.category?.name ?? null,
        amount: r.type === 'income' ? r.amount : -r.amount,
      })),
      ...movements.map((m) => {
        const isAdjustment = m.type === 'adjustment';
        const incoming = m.toAccountId === id;
        return {
          id: m.id,
          source: 'movement' as const,
          type: isAdjustment ? 'adjustment' : incoming ? 'transfer_in' : 'transfer_out',
          date: m.date,
          description: m.description
            || (isAdjustment ? 'Ajuste de saldo' : incoming ? `Desde ${m.fromAccount?.name ?? 'otra cuenta'}` : `Hacia ${m.toAccount?.name ?? 'otra cuenta'}`),
          notes: null,
          category: null,
          counterpart: isAdjustment ? null : incoming ? m.fromAccount?.name ?? null : m.toAccount?.name ?? null,
          amount: isAdjustment ? m.amount : incoming ? m.amount : -m.amount,
        };
      }),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const periodIn = items.filter((i) => i.amount > 0).reduce((s, i) => s + i.amount, 0);
    const periodOut = items.filter((i) => i.amount < 0).reduce((s, i) => s - i.amount, 0);

    res.json({ account, items, period: { in: periodIn, out: periodOut, net: periodIn - periodOut } });
  } catch (error) {
    console.error('Get account detail error:', error);
    res.status(500).json({ error: 'Error al cargar la cuenta' });
  }
});

router.put('/:id', authenticate, requireActiveSubscription, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const id = req.params.id as string;
    if (!(await findOwnAccount(userId, id))) return res.status(404).json({ error: 'Cuenta no encontrada' });
    const data = accountFields(req.body);
    const err = validateAccountFields(data, false);
    if (err) return res.status(400).json({ error: err });
    const account = await prisma.financialAccount.update({ where: { id }, data: data as any });
    res.json(account);
  } catch (error) {
    console.error('Update account error:', error);
    res.status(500).json({ error: 'Error al actualizar la cuenta' });
  }
});

// Ajuste de saldo: "mi banco dice X" → se registra la diferencia para que coincida
router.post('/:id/adjust', authenticate, requireActiveSubscription, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const id = req.params.id as string;
    const actualBalance = Number(req.body.actualBalance);
    if (!isValidAmount(actualBalance)) return res.status(400).json({ error: 'Saldo inválido' });

    const overview = await getAccountsOverview(userId);
    const account = overview.accounts.find((a) => a.id === id);
    if (!account) return res.status(404).json({ error: 'Cuenta no encontrada' });

    const diff = Math.round((actualBalance - account.balance) * 100) / 100;
    if (diff === 0) return res.json({ adjusted: false, diff: 0 });

    const movement = await prisma.accountMovement.create({
      data: {
        userId,
        type: 'adjustment',
        toAccountId: id,
        amount: diff,
        date: parseClientDate(req.body.date),
        description: cleanText(req.body.description, 120) || 'Ajuste de saldo',
      },
    });
    res.status(201).json({ adjusted: true, diff, movement });
  } catch (error) {
    console.error('Adjust account error:', error);
    res.status(500).json({ error: 'Error al ajustar el saldo' });
  }
});

// Borrar cuenta: solo si no tiene movimientos (si tiene, se archiva para no perder historial)
router.delete('/:id', authenticate, requireActiveSubscription, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const id = req.params.id as string;
    if (!(await findOwnAccount(userId, id))) return res.status(404).json({ error: 'Cuenta no encontrada' });
    const [records, movements] = await Promise.all([
      prisma.financialRecord.count({ where: { accountId: id } }),
      prisma.accountMovement.count({ where: { OR: [{ fromAccountId: id }, { toAccountId: id }] } }),
    ]);
    if (records + movements > 0) {
      return res.status(409).json({ error: 'La cuenta tiene movimientos. Archivala para ocultarla sin perder el historial.' });
    }
    await prisma.financialAccount.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'Error al borrar la cuenta' });
  }
});

export default router;
