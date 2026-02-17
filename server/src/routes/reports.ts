import { Router } from 'express';
import { prisma } from '../utils/prisma.js';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.js';

const router = Router();

// GET /api/reports/financial - Consolidated financial report (superadmin only)
router.get('/financial', authenticate, authorize('superadmin'), async (req: AuthRequest, res) => {
  try {
    const {
      startDate,
      endDate,
      type,
      status,
      search,
      page = '1',
      limit = '20',
    } = req.query;

    // Date range filter
    const dateFilter: any = {};
    if (startDate) {
      dateFilter.gte = new Date(startDate as string);
    }
    if (endDate) {
      const end = new Date(endDate as string);
      end.setHours(23, 59, 59, 999);
      dateFilter.lte = end;
    }

    // Transaction where clause
    const txWhere: any = {};
    if (Object.keys(dateFilter).length > 0) {
      txWhere.createdAt = dateFilter;
    }
    if (type) {
      txWhere.type = type as string;
    }
    if (status) {
      txWhere.status = status as string;
    }
    if (search) {
      txWhere.OR = [
        { description: { contains: search as string, mode: 'insensitive' } },
        { user: { firstName: { contains: search as string, mode: 'insensitive' } } },
        { user: { lastName: { contains: search as string, mode: 'insensitive' } } },
        { user: { email: { contains: search as string, mode: 'insensitive' } } },
      ];
    }

    // 1. All transactions for aggregations (within date/type/status filters, no search for aggregations)
    const aggWhere: any = {};
    if (Object.keys(dateFilter).length > 0) {
      aggWhere.createdAt = dateFilter;
    }
    if (type) {
      aggWhere.type = type as string;
    }
    if (status) {
      aggWhere.status = status as string;
    }

    const allTransactions = await prisma.transaction.findMany({
      where: aggWhere,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // --- Balance General ---
    const incomeTypes = ['deposit', 'sale', 'transfer_in', 'income', 'credit'];
    const expenseTypes = ['withdrawal', 'purchase', 'transfer_out', 'expense', 'fee'];

    const totalIncome = allTransactions
      .filter(t => incomeTypes.includes(t.type))
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const totalExpenses = allTransactions
      .filter(t => expenseTypes.includes(t.type))
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const totalCommissions = allTransactions
      .filter(t => t.type === 'commission')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const pendingAmounts = allTransactions
      .filter(t => t.status === 'pending')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const netBalance = totalIncome - totalExpenses - totalCommissions;

    const balanceGeneral = {
      totalIncome,
      totalExpenses,
      totalCommissions,
      netBalance,
      pendingAmounts,
    };

    // --- Desglose por Tipo ---
    const typeBreakdown: Record<string, { count: number; total: number }> = {};
    for (const tx of allTransactions) {
      if (!typeBreakdown[tx.type]) {
        typeBreakdown[tx.type] = { count: 0, total: 0 };
      }
      typeBreakdown[tx.type].count += 1;
      typeBreakdown[tx.type].total += Math.abs(tx.amount);
    }

    // --- Tendencia Diaria ---
    const dailyMap: Record<string, { date: string; income: number; expenses: number }> = {};
    for (const tx of allTransactions) {
      const dayKey = tx.createdAt.toISOString().split('T')[0];
      if (!dailyMap[dayKey]) {
        dailyMap[dayKey] = { date: dayKey, income: 0, expenses: 0 };
      }
      if (incomeTypes.includes(tx.type)) {
        dailyMap[dayKey].income += Math.abs(tx.amount);
      } else {
        dailyMap[dayKey].expenses += Math.abs(tx.amount);
      }
    }
    const dailyTrend = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));

    // --- Resumen de Ordenes ---
    const orderWhere: any = {};
    if (Object.keys(dateFilter).length > 0) {
      orderWhere.createdAt = dateFilter;
    }

    const orders = await prisma.order.findMany({
      where: orderWhere,
    });

    const orderSummary = {
      totalOrders: orders.length,
      totalSales: orders.reduce((sum, o) => sum + o.total, 0),
      totalCommissions: orders.reduce((sum, o) => sum + o.commissionAmount, 0),
      totalSellerEarnings: orders.reduce((sum, o) => sum + o.sellerEarnings, 0),
      byStatus: {} as Record<string, number>,
    };
    for (const order of orders) {
      orderSummary.byStatus[order.status] = (orderSummary.byStatus[order.status] || 0) + 1;
    }

    // --- Resumen de Retiros ---
    const withdrawalTxs = allTransactions.filter(t => t.type === 'withdrawal');
    const withdrawalSummary = {
      totalRequests: withdrawalTxs.length,
      totalAmount: withdrawalTxs.reduce((sum, t) => sum + Math.abs(t.amount), 0),
      approved: withdrawalTxs.filter(t => t.status === 'completed').length,
      approvedAmount: withdrawalTxs.filter(t => t.status === 'completed').reduce((s, t) => s + Math.abs(t.amount), 0),
      pending: withdrawalTxs.filter(t => t.status === 'pending').length,
      pendingAmount: withdrawalTxs.filter(t => t.status === 'pending').reduce((s, t) => s + Math.abs(t.amount), 0),
      rejected: withdrawalTxs.filter(t => t.status === 'rejected').length,
      rejectedAmount: withdrawalTxs.filter(t => t.status === 'rejected').reduce((s, t) => s + Math.abs(t.amount), 0),
    };

    // --- Transacciones paginadas (with search filter) ---
    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit as string)));
    const skip = (pageNum - 1) * limitNum;

    const [paginatedTransactions, totalCount] = await Promise.all([
      prisma.transaction.findMany({
        where: txWhere,
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          wallet: {
            select: {
              balance: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.transaction.count({ where: txWhere }),
    ]);

    const totalPages = Math.ceil(totalCount / limitNum);

    res.json({
      balanceGeneral,
      typeBreakdown,
      dailyTrend,
      orderSummary,
      withdrawalSummary,
      transactions: {
        data: paginatedTransactions,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalCount,
          totalPages,
        },
      },
    });
  } catch (error: any) {
    console.error('Report error:', error);
    res.status(500).json({ error: 'Error al generar reporte', details: error.message });
  }
});

// GET /api/reports/financial/export - Export all filtered transactions as CSV
router.get('/financial/export', authenticate, authorize('superadmin'), async (req: AuthRequest, res) => {
  try {
    const { startDate, endDate, type, status, search } = req.query;

    const dateFilter: any = {};
    if (startDate) {
      dateFilter.gte = new Date(startDate as string);
    }
    if (endDate) {
      const end = new Date(endDate as string);
      end.setHours(23, 59, 59, 999);
      dateFilter.lte = end;
    }

    const txWhere: any = {};
    if (Object.keys(dateFilter).length > 0) {
      txWhere.createdAt = dateFilter;
    }
    if (type) {
      txWhere.type = type as string;
    }
    if (status) {
      txWhere.status = status as string;
    }
    if (search) {
      txWhere.OR = [
        { description: { contains: search as string, mode: 'insensitive' } },
        { user: { firstName: { contains: search as string, mode: 'insensitive' } } },
        { user: { lastName: { contains: search as string, mode: 'insensitive' } } },
      ];
    }

    const transactions = await prisma.transaction.findMany({
      where: txWhere,
      include: {
        user: {
          select: { firstName: true, lastName: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const typeLabels: Record<string, string> = {
      deposit: 'Deposito',
      withdrawal: 'Retiro',
      purchase: 'Compra',
      sale: 'Venta',
      transfer_in: 'Transferencia Recibida',
      transfer_out: 'Transferencia Enviada',
      commission: 'Comision',
      income: 'Ingreso',
      expense: 'Egreso',
      credit: 'Credito',
      fee: 'Tarifa',
    };

    // Build CSV
    const headers = [
      'Fecha',
      'Tipo',
      'Usuario',
      'Email',
      'Descripcion',
      'Monto',
      'Estado',
      'Referencia',
    ];

    const rows = transactions.map(tx => {
      const userName = `${tx.user.firstName} ${tx.user.lastName}`;
      return [
        tx.createdAt.toISOString().split('T')[0],
        typeLabels[tx.type] || tx.type,
        userName,
        tx.user.email,
        tx.description,
        tx.amount.toString(),
        tx.status,
        tx.relatedOrderId || tx.relatedCreditId || '',
      ].map(val => `"${String(val).replace(/"/g, '""')}"`).join(',');
    });

    const csv = '\uFEFF' + [headers.join(','), ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=reporte-financiero-${new Date().toISOString().split('T')[0]}.csv`);
    res.send(csv);
  } catch (error: any) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Error al exportar', details: error.message });
  }
});

export default router;
