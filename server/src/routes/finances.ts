import { Router } from 'express';
import { prisma } from '../utils/prisma.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Get all financial records
router.get('/', authenticate, async (req: AuthRequest, res) => {
    try {
        const userId = req.user!.userId;
        const { month, year, type } = req.query;

        const where: any = { userId };

        if (month && year) {
            const startDate = new Date(Number(year), Number(month) - 1, 1);
            const endDate = new Date(Number(year), Number(month), 0, 23, 59, 59);
            where.date = {
                gte: startDate,
                lte: endDate,
            };
        }

        if (type) {
            where.type = type;
        }

        const records = await prisma.financialRecord.findMany({
            where,
            orderBy: { date: 'desc' },
            include: {
                category: true,
            },
        });

        res.json(records);
    } catch (error) {
        console.error('Get records error:', error);
        res.status(500).json({ error: 'Erro no servidor' });
    }
});

// Get financial summary (Income vs Expenses, Net Worth)
router.get('/summary', authenticate, async (req: AuthRequest, res) => {
    try {
        const userId = req.user!.userId;
        const { month, year } = req.query;

        // Default to current month if not specified
        const currentYear = year ? Number(year) : new Date().getFullYear();
        const currentMonth = month ? Number(month) : new Date().getMonth() + 1;

        const startDate = new Date(currentYear, currentMonth - 1, 1);
        const endDate = new Date(currentYear, currentMonth, 0, 23, 59, 59);

        // Get all records for Net Worth calculation (all time)
        const allRecords = await prisma.financialRecord.findMany({
            where: { userId },
        });

        const assets = allRecords
            .filter(r => r.type === 'asset')
            .reduce((sum, r) => sum + r.amount, 0);

        const liabilities = allRecords
            .filter(r => r.type === 'liability')
            .reduce((sum, r) => sum + r.amount, 0);

        const netWorth = assets - liabilities;

        // Get monthly records for Income/Expense flow
        const monthlyRecords = allRecords.filter(r => {
            const d = new Date(r.date);
            return d >= startDate && d <= endDate;
        });

        const income = monthlyRecords
            .filter(r => r.type === 'income')
            .reduce((sum, r) => sum + r.amount, 0);

        const expenses = monthlyRecords
            .filter(r => r.type === 'expense')
            .reduce((sum, r) => sum + r.amount, 0);

        // Get previous month for comparison
        const prevMonthDate = new Date(startDate);
        prevMonthDate.setMonth(prevMonthDate.getMonth() - 1);
        const prevMonthEnd = new Date(prevMonthDate.getFullYear(), prevMonthDate.getMonth() + 1, 0);

        const prevMonthRecords = allRecords.filter(r => {
            const d = new Date(r.date);
            return d >= prevMonthDate && d <= prevMonthEnd;
        });

        const prevNetWorth =
            prevMonthRecords.filter(r => r.type === 'asset').reduce((sum, r) => sum + r.amount, 0) -
            prevMonthRecords.filter(r => r.type === 'liability').reduce((sum, r) => sum + r.amount, 0);

        const netWorthGrowth = prevNetWorth !== 0
            ? ((netWorth - prevNetWorth) / Math.abs(prevNetWorth)) * 100
            : 0;

        res.json({
            income,
            expenses,
            assets,
            liabilities,
            netWorth,
            netWorthGrowth,
            savingsRate: income > 0 ? ((income - expenses) / income) * 100 : 0
        });

    } catch (error) {
        console.error('Summary error:', error);
        res.status(500).json({ error: 'Erro no servidor' });
    }
});

// Create new record
router.post('/', authenticate, async (req: AuthRequest, res) => {
    try {
        const userId = req.user!.userId;
        const { amount, description, type, categoryId, date } = req.body;

        // If categoryId is not provided, find or create "General" category for the type
        let finalCategoryId = categoryId;

        if (!finalCategoryId) {
            let generalCategory = await prisma.financialCategory.findFirst({
                where: { userId, name: 'General', type }
            });

            if (!generalCategory) {
                generalCategory = await prisma.financialCategory.create({
                    data: {
                        userId,
                        name: 'General',
                        type,
                        color: '#94a3b8',
                        icon: 'circle'
                    }
                });
            }
            finalCategoryId = generalCategory.id;
        }

        const record = await prisma.financialRecord.create({
            data: {
                userId,
                amount: Number(amount),
                description,
                type,
                categoryId: finalCategoryId,
                date: date ? new Date(date) : new Date(),
            },
            include: {
                category: true
            }
        });

        res.status(201).json(record);
    } catch (error) {
        console.error('Create record error:', error);
        res.status(500).json({ error: 'Erro no servidor' });
    }
});

// Get Categories
router.get('/categories', authenticate, async (req: AuthRequest, res) => {
    try {
        const userId = req.user!.userId;
        const { type } = req.query;

        const where: any = { userId };
        if (type) where.type = type;

        const categories = await prisma.financialCategory.findMany({
            where,
            orderBy: { name: 'asc' }
        });

        res.json(categories);
    } catch (error) {
        res.status(500).json({ error: 'Erro no servidor' });
    }
});

// Create Category
router.post('/categories', authenticate, async (req: AuthRequest, res) => {
    try {
        const userId = req.user!.userId;
        const { name, type, color, icon } = req.body;

        const category = await prisma.financialCategory.create({
            data: {
                userId,
                name,
                type,
                color: color || '#3b82f6',
                icon: icon || 'tag'
            }
        });

        res.status(201).json(category);
    } catch (error) {
        res.status(500).json({ error: 'Erro no servidor' });
    }
});

// Get Budget for a specific month
router.get('/budget', authenticate, async (req: AuthRequest, res) => {
    try {
        const userId = req.user!.userId;
        const { month, year } = req.query;

        if (!month || !year) {
            return res.status(400).json({ error: 'Mes y año requeridos' });
        }

        const budget = await prisma.budget.findUnique({
            where: {
                userId_month_year: {
                    userId,
                    month: Number(month),
                    year: Number(year)
                }
            }
        });

        // Calculate actuals
        const startDate = new Date(Number(year), Number(month) - 1, 1);
        const endDate = new Date(Number(year), Number(month), 0, 23, 59, 59);

        const records = await prisma.financialRecord.findMany({
            where: {
                userId,
                date: {
                    gte: startDate,
                    lte: endDate
                }
            }
        });

        const actualIncome = records
            .filter(r => r.type === 'income')
            .reduce((sum, r) => sum + r.amount, 0);

        const actualExpenses = records
            .filter(r => r.type === 'expense')
            .reduce((sum, r) => sum + r.amount, 0);

        res.json({
            budget: budget || { incomeGoal: 0, expenseLimit: 0, categoryLimits: {} },
            actuals: {
                income: actualIncome,
                expenses: actualExpenses
            }
        });

    } catch (error) {
        console.error('Get budget error:', error);
        res.status(500).json({ error: 'Erro no servidor' });
    }
});

// Upsert Budget
router.post('/budget', authenticate, async (req: AuthRequest, res) => {
    try {
        const userId = req.user!.userId;
        const { month, year, incomeGoal, expenseLimit, categoryLimits } = req.body;

        const budget = await prisma.budget.upsert({
            where: {
                userId_month_year: {
                    userId,
                    month: Number(month),
                    year: Number(year)
                }
            },
            update: {
                incomeGoal: Number(incomeGoal),
                expenseLimit: Number(expenseLimit),
                categoryLimits: categoryLimits || {}
            },
            create: {
                userId,
                month: Number(month),
                year: Number(year),
                incomeGoal: Number(incomeGoal),
                expenseLimit: Number(expenseLimit),
                categoryLimits: categoryLimits || {}
            }
        });

        res.json(budget);
    } catch (error) {
        console.error('Upsert budget error:', error);
        res.status(500).json({ error: 'Erro no servidor' });
    }
});

export default router;
