import { Router } from 'express';
import { prisma } from '../utils/prisma.js';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.js';
import { 
  startOfMonth, 
  endOfMonth, 
  subMonths, 
  startOfDay, 
  endOfDay, 
  subDays 
} from 'date-fns';

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
      .filter(t => incomeTypes.includes(t.type) && t.status === 'completed')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const totalExpenses = allTransactions
      .filter(t => expenseTypes.includes(t.type) && t.status === 'completed')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const totalCommissions = allTransactions
      .filter(t => t.type === 'commission' && t.status === 'completed')
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
      if (tx.status !== 'completed' && tx.type !== 'withdrawal') {
        // We might want to keep withdrawals even if pending for some stats, 
        // but the user asked for completed. Let's stick to completed.
        if (tx.status !== 'completed') continue;
      }
      if (tx.status !== 'completed') continue;

      if (!typeBreakdown[tx.type]) {
        typeBreakdown[tx.type] = { count: 0, total: 0 };
      }
      typeBreakdown[tx.type].count += 1;
      typeBreakdown[tx.type].total += Math.abs(tx.amount);
    }

    // --- Tendencia Diaria ---
    const dailyMap: Record<string, { date: string; income: number; expenses: number }> = {};
    for (const tx of allTransactions) {
      if (tx.status !== 'completed') continue;
      
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

// GET /api/reports/seller-stats - Real data for the seller dashboard
router.get('/seller-stats', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;

    // 1. Get Seller Profile and Wallet
    const [sellerProfile, wallet] = await Promise.all([
      prisma.sellerProfile.findUnique({
        where: { userId },
        select: { id: true, storeName: true }
      }),
      prisma.wallet.findUnique({
        where: { userId },
        select: { balance: true }
      })
    ]);

    if (!sellerProfile) {
      return res.status(403).json({ error: 'Perfil de vendedor no encontrado' });
    }

    // 2. Aggregate Metrics (Total Revenue, Sales Count)
    const [orders, purchases] = await Promise.all([
      prisma.order.findMany({
        where: { sellerId: userId }
      }),
      prisma.purchase.findMany({
        where: { sellerId: sellerProfile.id }
      })
    ]);

    const totalSales = orders.length;
    const totalRevenue = orders
      .filter(o => o.paymentStatus === 'paid')
      .reduce((sum, o) => sum + o.total, 0);

    const totalPurchases = purchases.reduce((sum, p) => sum + p.totalAmount, 0);

    const pendingOrdersCount = orders.filter(o => o.status === 'pending').length;

    // 3. Last 5 Orders
    const recentOrders = await prisma.order.findMany({
      where: { sellerId: userId },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        buyer: {
          select: { firstName: true, lastName: true, email: true }
        }
      }
    });

    // 4. Sales Chart (Last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const dailySales = await prisma.order.findMany({
      where: {
        sellerId: userId,
        paymentStatus: 'paid',
        createdAt: { gte: thirtyDaysAgo }
      },
      select: {
        total: true,
        createdAt: true
      }
    });

    // Process chart data
    const chartData = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayTotal = dailySales
        .filter(s => s.createdAt.toISOString().split('T')[0] === dateStr)
        .reduce((sum, s) => sum + s.total, 0);
      
      chartData.push({
        date: dateStr,
        revenue: dayTotal
      });
    }

    res.json({
      stats: {
        totalRevenue,
        totalSales,
        totalPurchases,
        pendingOrders: pendingOrdersCount,
        currentBalance: wallet?.balance || 0,
        storeName: sellerProfile.storeName
      },
      recentOrders: recentOrders.map(o => ({
        id: o.id,
        orderNumber: o.orderNumber,
        buyer: `${o.buyer.firstName} ${o.buyer.lastName}`,
        total: o.total,
        status: o.status,
        date: o.createdAt
      })),
      chartData
    });

  } catch (error: any) {
    console.error('Seller stats error:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas del vendedor' });
  }
});

// GET /api/reports/client-stats - Real data for the client dashboard (Home)
router.get('/client-stats', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;

    // 1. Basic User info, Wallet and Ingenio Access
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        wallet: {
          select: { balance: true, rewardPoints: true }
        },
        ingenioStudent: {
          select: { 
            isActive: true,
            ingenio_student_assignments: {
              orderBy: { assignedAt: 'desc' },
              take: 1,
              select: { stage: true, progress: true, status: true }
            }
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // 2. Credits info
    const lastCredit = await prisma.credit.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { status: true, amount: true, createdAt: true }
    });

    // 3. Orders info
    const ordersCount = await prisma.order.count({
      where: { buyerId: userId }
    });

    const lastOrder = await prisma.order.findFirst({
      where: { buyerId: userId },
      orderBy: { createdAt: 'desc' },
      select: { orderNumber: true, status: true, total: true, createdAt: true }
    });

    // 4. Academy (Ingenio) Progress
    let academyStats = null;
    if (user.ingenioAccess || user.roles.includes('ingenio')) {
      const courses = await prisma.userCourse.findMany({
        where: { userId }
      });
      
      const avgProgress = courses.length > 0 
        ? courses.reduce((sum, c) => sum + c.progress, 0) / courses.length 
        : 0;

      const lastAssignment = user.ingenioStudent?.ingenio_student_assignments[0] || null;

      academyStats = {
        hasAccess: true,
        overallProgress: Math.round(avgProgress),
        coursesCount: courses.length,
        currentStage: lastAssignment?.stage || 'Fase Inicial',
        wheelProgress: lastAssignment?.progress || 0
      };
    } else {
      academyStats = { hasAccess: false };
    }

    res.json({
      finances: {
        balance: user.wallet?.balance || 0,
        rewardPoints: user.wallet?.rewardPoints || 0,
        lastCredit: lastCredit ? {
          status: lastCredit.status,
          amount: lastCredit.amount,
          date: lastCredit.createdAt
        } : null
      },
      orders: {
        totalCount: ordersCount,
        lastOrder: lastOrder ? {
          orderNumber: lastOrder.orderNumber,
          status: lastOrder.status,
          total: lastOrder.total,
          date: lastOrder.createdAt
        } : null
      },
      academy: academyStats
    });

  } catch (error: any) {
    console.error('Client stats error:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas del cliente' });
  }
});

// GET /api/reports/admin-stats - Real-time global view for superadmins
router.get('/admin-stats', authenticate, authorize('superadmin'), async (req: AuthRequest, res) => {
  try {
    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const lastMonthEnd = endOfMonth(subMonths(now, 1));
    const thirtyDaysAgo = subDays(now, 30);

    // Everything inside a transaction for data consistency
    const stats = await prisma.$transaction(async (tx) => {
      // 1. Comparative Metrics (Current vs End of Last Month)
      const currentMetrics = await Promise.all([
        tx.user.count(),
        tx.sellerProfile.count({ where: { planActive: true } }),
        tx.product.count({ where: { status: 'active' } }),
        tx.credit.count({ where: { status: 'active' } }),
      ]);

      const prevMonthMetrics = await Promise.all([
        tx.user.count({ where: { createdAt: { lte: lastMonthEnd } } }),
        tx.sellerProfile.count({ 
          where: { 
            user: { createdAt: { lte: lastMonthEnd } }, 
            planActive: true 
          } 
        }),
        tx.product.count({ where: { createdAt: { lte: lastMonthEnd }, status: 'active' } }),
        tx.credit.count({ where: { createdAt: { lte: lastMonthEnd }, status: 'active' } }),
      ]);

      // 2. Real-time Finances
      const salesToday = await tx.order.aggregate({
        _sum: { total: true },
        where: {
          paymentStatus: 'paid',
          createdAt: { gte: todayStart, lte: todayEnd }
        }
      });

      const income30Days = await tx.transaction.aggregate({
        _sum: { amount: true },
        where: {
          status: 'completed',
          type: { in: ['sale', 'deposit', 'transfer_in', 'income', 'credit'] },
          createdAt: { gte: thirtyDaysAgo }
        }
      });

      // 3. Order Distribution (Pie Chart)
      const orderDistribution = await tx.order.groupBy({
        by: ['status'],
        _count: { id: true }
      });

      // 4. Historical Series (Last 6 Months)
      const salesSeries = [];
      const userSeries = [];

      for (let i = 5; i >= 0; i--) {
        const monthStart = startOfMonth(subMonths(now, i));
        const monthEnd = endOfMonth(subMonths(now, i));
        const monthLabel = monthStart.toLocaleString('es-ES', { month: 'short' });

        // Sales and Commissions in current month
        const monthlySales = await tx.order.aggregate({
          _sum: { total: true, commissionAmount: true },
          where: {
            paymentStatus: 'paid',
            createdAt: { gte: monthStart, lte: monthEnd }
          }
        });

        // User Growth in current month (total count at that point in time)
        const [monthClients, monthSellers] = await Promise.all([
          tx.user.count({
            where: {
              createdAt: { lte: monthEnd },
              roles: { has: 'client' }
            }
          }),
          tx.sellerProfile.count({
            where: {
              user: { createdAt: { lte: monthEnd } },
              planActive: true
            }
          })
        ]);

        salesSeries.push({
          name: monthLabel,
          ventas: monthlySales._sum.total || 0,
          comisiones: monthlySales._sum.commissionAmount || 0
        });

        userSeries.push({
          name: monthLabel,
          clientes: monthClients,
          vendedores: monthSellers
        });
      }

      // 5. Recent Activity (10 Items)
      const [recentOrders, recentTransactions] = await Promise.all([
        tx.order.findMany({
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            buyer: { select: { firstName: true, lastName: true } },
            seller: { select: { sellerProfile: { select: { storeName: true } } } }
          }
        }),
        tx.transaction.findMany({
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { firstName: true, lastName: true, email: true } }
          }
        })
      ]);

      return {
        metrics: {
          users: { current: currentMetrics[0], previous: prevMonthMetrics[0] },
          sellers: { current: currentMetrics[1], previous: prevMonthMetrics[1] },
          products: { current: currentMetrics[2], previous: prevMonthMetrics[2] },
          credits: { current: currentMetrics[3], previous: prevMonthMetrics[3] },
        },
        finances: {
          salesToday: salesToday._sum.total || 0,
          income30Days: income30Days._sum.amount || 0,
        },
        orderDistribution: orderDistribution.map(d => ({
          status: d.status,
          count: d._count.id
        })),
        salesSeries,
        userSeries,
        recentActivity: {
          orders: recentOrders.map(o => ({
            id: o.id,
            orderNumber: o.orderNumber,
            buyer: `${o.buyer.firstName} ${o.buyer.lastName}`,
            store: o.seller.sellerProfile?.storeName || 'Tienda Oscorp',
            total: o.total,
            status: o.status,
            date: o.createdAt
          })),
          transactions: recentTransactions.map(t => ({
            id: t.id,
            type: t.type,
            user: `${t.user.firstName} ${t.user.lastName}`,
            email: t.user.email,
            amount: t.amount,
            status: t.status,
            date: t.createdAt
          }))
        }
      };
    }, {
      maxWait: 5000,
      timeout: 30000
    });

    res.json(stats);

  } catch (error: any) {
    console.error('Admin stats complex error:', error);
    res.status(500).json({ 
      error: 'Error al generar estadísticas maestras',
      details: error.message 
    });
  }
});

export default router;
