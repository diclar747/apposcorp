import { Router } from 'express';
import { prisma } from '../utils/prisma.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { requireActiveSubscription } from '../middleware/ingenio.js';

const router = Router();

// Get all financial records
router.get('/', authenticate, async (req: AuthRequest, res) => {
    try {
        const userId = req.user!.userId;
        const month = req.query.month as string;
        const year = req.query.year as string;
        const type = req.query.type as string;
        const startDate = req.query.startDate as string;
        const endDate = req.query.endDate as string;
        const query = req.query.query as string;
        const where: any = { userId };

        if (startDate && endDate) {
            where.date = {
                gte: new Date(startDate as string),
                lte: new Date(endDate as string),
            };
        } else if (month && year) {
            const start = new Date(Number(year), Number(month) - 1, 1);
            const end = new Date(Number(year), Number(month), 0, 23, 59, 59);
            where.date = {
                gte: start,
                lte: end,
            };
        }

        if (type) {
            where.type = type as string;
        }

        if (query) {
            where.OR = [
                { description: { contains: query as string, mode: 'insensitive' } },
                { notes: { contains: query as string, mode: 'insensitive' } },
            ];
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

        // Get all records for historical calculation
        const allRecords = await prisma.financialRecord.findMany({
            where: { userId },
        });

        // 1. Total (All Time)
        const totalIncome = allRecords.filter(r => r.type === 'income').reduce((sum, r) => sum + r.amount, 0);
        const totalExpenses = allRecords.filter(r => r.type === 'expense').reduce((sum, r) => sum + r.amount, 0);
        const totalAssets = allRecords.filter(r => r.type === 'asset').reduce((sum, r) => sum + r.amount, 0);
        const totalLiabilities = allRecords.filter(r => r.type === 'liability').reduce((sum, r) => sum + r.amount, 0);
        
        // Balance is Income - Expenses
        const balance = totalIncome - totalExpenses;
        const netWorth = totalAssets - totalLiabilities;

        // 2. Today's stats
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const todayRecords = allRecords.filter(r => {
            const d = new Date(r.date);
            return d >= today && d < tomorrow;
        });

        const todayIncome = todayRecords.filter(r => r.type === 'income').reduce((sum, r) => sum + r.amount, 0);
        const todayExpenses = todayRecords.filter(r => r.type === 'expense').reduce((sum, r) => sum + r.amount, 0);

        // 3. Current Month Stats (for growth calculation)
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth() + 1;
        const startOfMonth = new Date(currentYear, currentMonth - 1, 1);

        const monthlyRecords = allRecords.filter(r => new Date(r.date) >= startOfMonth);
        const monthIncome = monthlyRecords.filter(r => r.type === 'income').reduce((sum, r) => sum + r.amount, 0);
        const monthExpenses = monthlyRecords.filter(r => r.type === 'expense').reduce((sum, r) => sum + r.amount, 0);

        res.json({
            totalIncome,
            totalExpenses,
            totalAssets,
            totalLiabilities,
            balance,
            netWorth,
            todayIncome,
            todayExpenses,
            monthIncome,
            monthExpenses,
            savingsRate: totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0
        });

    } catch (error) {
        console.error('Summary error:', error);
        res.status(500).json({ error: 'Erro no servidor' });
    }
});

// Create new record
router.post('/', authenticate, requireActiveSubscription, async (req: AuthRequest, res) => {
    try {
        const userId = req.user!.userId;
        const { amount, description, type, categoryId, date, notes } = req.body;

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
                notes,
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

// Delete record
router.delete('/:id', authenticate, requireActiveSubscription, async (req: AuthRequest, res) => {
    try {
        const userId = req.user!.userId;
        const id = req.params.id as string;

        await prisma.financialRecord.delete({
            where: { id, userId }
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Delete record error:', error);
        res.status(500).json({ error: 'Erro no servidor' });
    }
});

// Get Categories
router.get('/categories', authenticate, async (req: AuthRequest, res) => {
    try {
        const userId = req.user!.userId;
        const type = req.query.type as string;

        const where: any = { userId };
        if (type) where.type = type as string;

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
router.post('/categories', authenticate, requireActiveSubscription, async (req: AuthRequest, res) => {
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
        const month = req.query.month as string;
        const year = req.query.year as string;

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
            budget: budget || { 
                incomeGoal: 0, 
                expenseLimit: 0, 
                durationMonths: 1, 
                startDate: new Date(), 
                categoryLimits: {} 
            },
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
router.post('/budget', authenticate, requireActiveSubscription, async (req: AuthRequest, res) => {
    try {
        const userId = req.user!.userId;
        const { month, year, incomeGoal, expenseLimit, durationMonths, startDate, categoryLimits } = req.body;

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
                durationMonths: Number(durationMonths || 1),
                startDate: startDate ? new Date(startDate) : new Date(),
                categoryLimits: categoryLimits || {}
            },
            create: {
                userId,
                month: Number(month),
                year: Number(year),
                incomeGoal: Number(incomeGoal),
                expenseLimit: Number(expenseLimit),
                durationMonths: Number(durationMonths || 1),
                startDate: startDate ? new Date(startDate) : new Date(),
                categoryLimits: categoryLimits || {}
            }
        });

        res.json(budget);
    } catch (error) {
        console.error('Upsert budget error:', error);
        res.status(500).json({ error: 'Erro no servidor' });
    }
});

// Get budget items
router.get('/budget/items', authenticate, async (req: AuthRequest, res) => {
    try {
        const userId = req.user!.userId;
        const month = req.query.month as string;
        const year = req.query.year as string;

        const { startDate, endDate, query } = req.query;

        const where: any = { userId };

        if (startDate && endDate) {
            where.startDate = {
                gte: new Date(startDate as string),
                lte: new Date(endDate as string)
            };
        }

        if (query) {
            where.OR = [
                { name: { contains: query as string, mode: 'insensitive' } },
                { description: { contains: query as string, mode: 'insensitive' } }
            ];
        }

        const items = await prisma.budgetItem.findMany({
            where,
            orderBy: { startDate: 'desc' }
        });

        res.json(items);
    } catch (error) {
        console.error('Get budget items error:', error);
        res.status(500).json({ error: 'Erro no servidor' });
    }
});

// Create budget item
router.post('/budget/items', authenticate, requireActiveSubscription, async (req: AuthRequest, res) => {
    try {
        const userId = req.user!.userId;
        const { month, year, type, name, description, amount, durationMonths } = req.body;

        const item = await prisma.budgetItem.create({
            data: {
                userId,
                month: Number(month),
                year: Number(year),
                type,
                name,
                description,
                amount: Number(amount),
                durationMonths: durationMonths ? Number(durationMonths) : 1,
                startDate: new Date(), // Always current date
                actualAmount: 0,
                status: 'ACTIVE'
            }
        });

        res.status(201).json(item);
    } catch (error) {
        console.error('Create budget item error:', error);
        res.status(500).json({ error: 'Erro no servidor' });
    }
});

// Update budget item
router.put('/budget/items/:id', authenticate, requireActiveSubscription, async (req: AuthRequest, res) => {
    try {
        const userId = req.user!.userId;
        const id = req.params.id as string;
        const { type, name, description, amount, durationMonths } = req.body;

        const item = await prisma.budgetItem.update({
            where: { id, userId },
            data: {
                type,
                name,
                description,
                amount: Number(amount),
                durationMonths: durationMonths ? Number(durationMonths) : undefined
            }
        });

        res.json(item);
    } catch (error) {
        console.error('Update budget item error:', error);
        res.status(500).json({ error: 'Erro no servidor' });
    }
});

// Log progress to budget item manually
router.post('/budget/items/:id/log', authenticate, async (req: AuthRequest, res) => {
    try {
        const userId = req.user!.userId;
        const id = req.params.id as string;
        const { amount } = req.body; // Positive for increase, negative for decrease

        const currentItem = await prisma.budgetItem.findUnique({
             where: { id, userId }
        });

        if (!currentItem) return res.status(404).json({ error: 'Presupuesto no encontrado' });

        const projectedAmount = currentItem.actualAmount + Number(amount);

        if (projectedAmount < 0) {
            return res.status(400).json({ error: 'El monto no puede quedar en negativo' });
        }

        if (projectedAmount > currentItem.amount) {
            return res.status(400).json({ error: 'El monto no puede superar la meta establecida' });
        }

        const item = await prisma.budgetItem.update({
            where: { id, userId },
            data: {
                actualAmount: projectedAmount
            }
        });

        res.json(item);
    } catch (error) {
        console.error('Log budget progress error:', error);
        res.status(500).json({ error: 'Erro no servidor' });
    }
});

// Reactivate/Reset budget item cycle
router.post('/budget/items/:id/reactivate', authenticate, async (req: AuthRequest, res) => {
    try {
        const userId = req.user!.userId;
        const id = req.params.id as string;
        const { durationMonths } = req.body;

        const currentItem = await prisma.budgetItem.findUnique({
            where: { id, userId }
        });

        if (!currentItem) return res.status(404).json({ error: 'Not found' });

        const item = await prisma.budgetItem.update({
            where: { id, userId },
            data: {
                startDate: new Date(),
                durationMonths: Number(durationMonths) || currentItem.durationMonths
            }
        });

        res.json(item);
    } catch (error) {
        console.error('Reactivate budget item error:', error);
        res.status(500).json({ error: 'Erro no servidor' });
    }
});

// Delete budget item
router.delete('/budget/items/:id', authenticate, requireActiveSubscription, async (req: AuthRequest, res) => {
    try {
        const userId = req.user!.userId;
        const id = req.params.id as string;

        await prisma.budgetItem.delete({
            where: { id, userId }
        });

        res.json({ message: 'Eliminado con éxito' });
    } catch (error) {
        console.error('Delete budget item error:', error);
        res.status(500).json({ error: 'Erro no servidor' });
    }
});

export default router;
