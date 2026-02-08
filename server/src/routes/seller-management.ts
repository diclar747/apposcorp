import { Router } from 'express';
import { prisma } from '../utils/prisma.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Helper to get sellerId
async function getSellerId(userId: string): Promise<string | null> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { sellerProfile: true },
    });
    if (!user) return null;
    if (user.role === 'superadmin') return '__admin__';
    return user.sellerProfile?.id || null;
}

// ─── DASHBOARD SUMMARY ────────────────────────────────────────────────
router.get('/summary', authenticate, async (req: AuthRequest, res) => {
    try {
        const sellerId = await getSellerId(req.user!.userId);
        if (!sellerId) return res.status(403).json({ error: 'Acceso denegado' });

        const where = sellerId === '__admin__' ? {} : { sellerId };

        // Get all movements
        const movements = await prisma.sellerMovement.findMany({
            where,
            include: { category: true },
            orderBy: { date: 'desc' },
        });

        // Current month boundaries
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

        const thisMonthMovements = movements.filter(m => new Date(m.date) >= startOfMonth);
        const lastMonthMovements = movements.filter(m => {
            const d = new Date(m.date);
            return d >= startOfLastMonth && d <= endOfLastMonth;
        });

        const totalIncome = movements.filter(m => m.type === 'income').reduce((s, m) => s + m.amount, 0);
        const totalExpense = movements.filter(m => m.type === 'expense').reduce((s, m) => s + m.amount, 0);
        const monthIncome = thisMonthMovements.filter(m => m.type === 'income').reduce((s, m) => s + m.amount, 0);
        const monthExpense = thisMonthMovements.filter(m => m.type === 'expense').reduce((s, m) => s + m.amount, 0);
        const lastMonthIncome = lastMonthMovements.filter(m => m.type === 'income').reduce((s, m) => s + m.amount, 0);
        const lastMonthExpense = lastMonthMovements.filter(m => m.type === 'expense').reduce((s, m) => s + m.amount, 0);

        // Monthly chart data (last 6 months)
        const monthlyData = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
            const monthName = d.toLocaleDateString('es', { month: 'short' });
            const monthMovs = movements.filter(m => {
                const md = new Date(m.date);
                return md >= d && md <= monthEnd;
            });
            monthlyData.push({
                month: monthName.charAt(0).toUpperCase() + monthName.slice(1),
                income: monthMovs.filter(m => m.type === 'income').reduce((s, m) => s + m.amount, 0),
                expense: monthMovs.filter(m => m.type === 'expense').reduce((s, m) => s + m.amount, 0),
            });
        }

        // Category breakdown (this month)
        const categoryMap: Record<string, { name: string; color: string; type: string; total: number }> = {};
        for (const m of thisMonthMovements) {
            const key = m.categoryId;
            if (!categoryMap[key]) {
                categoryMap[key] = { name: m.category.name, color: m.category.color, type: m.type, total: 0 };
            }
            categoryMap[key].total += m.amount;
        }

        res.json({
            totalIncome,
            totalExpense,
            balance: totalIncome - totalExpense,
            monthIncome,
            monthExpense,
            monthBalance: monthIncome - monthExpense,
            lastMonthIncome,
            lastMonthExpense,
            monthlyData,
            categoryBreakdown: Object.values(categoryMap).sort((a, b) => b.total - a.total),
            recentMovements: movements.slice(0, 10),
            totalMovements: movements.length,
        });
    } catch (error) {
        console.error('Management summary error:', error);
        res.status(500).json({ error: 'Error en el servidor', details: String(error) });
    }
});

// ─── CATEGORIES ───────────────────────────────────────────────────────

// List categories
router.get('/categories', authenticate, async (req: AuthRequest, res) => {
    try {
        const sellerId = await getSellerId(req.user!.userId);
        if (!sellerId) return res.status(403).json({ error: 'Acceso denegado' });

        const where = sellerId === '__admin__' ? {} : { sellerId };
        const categories = await prisma.sellerCategory.findMany({
            where,
            orderBy: { name: 'asc' },
            include: { _count: { select: { movements: true } } },
        });

        res.json(categories);
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Create category
router.post('/categories', authenticate, async (req: AuthRequest, res) => {
    try {
        const sellerId = await getSellerId(req.user!.userId);
        if (!sellerId || sellerId === '__admin__') return res.status(403).json({ error: 'Acceso denegado' });

        const { name, type, color, icon } = req.body;
        if (!name || !type) return res.status(400).json({ error: 'Nombre y tipo son obligatorios' });

        const category = await prisma.sellerCategory.create({
            data: { sellerId, name, type, color: color || '#3B82F6', icon: icon || 'wallet' },
        });

        res.status(201).json(category);
    } catch (error) {
        console.error('Create category error:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Update category
router.put('/categories/:id', authenticate, async (req: AuthRequest, res) => {
    try {
        const sellerId = await getSellerId(req.user!.userId);
        if (!sellerId) return res.status(403).json({ error: 'Acceso denegado' });

        const category = await prisma.sellerCategory.findUnique({ where: { id: req.params.id as string } });
        if (!category) return res.status(404).json({ error: 'Categoría no encontrada' });
        if (sellerId !== '__admin__' && category.sellerId !== sellerId) return res.status(403).json({ error: 'Acceso denegado' });

        const updated = await prisma.sellerCategory.update({
            where: { id: req.params.id as string },
            data: req.body,
        });
        res.json(updated);
    } catch (error) {
        console.error('Update category error:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Delete category
router.delete('/categories/:id', authenticate, async (req: AuthRequest, res) => {
    try {
        const sellerId = await getSellerId(req.user!.userId);
        if (!sellerId) return res.status(403).json({ error: 'Acceso denegado' });

        const category = await prisma.sellerCategory.findUnique({ where: { id: req.params.id as string } });
        if (!category) return res.status(404).json({ error: 'Categoría no encontrada' });
        if (sellerId !== '__admin__' && category.sellerId !== sellerId) return res.status(403).json({ error: 'Acceso denegado' });
        if (category.isSystem) return res.status(400).json({ error: 'No se puede eliminar una categoría del sistema' });

        await prisma.sellerMovement.deleteMany({ where: { categoryId: category.id } });
        await prisma.sellerCategory.delete({ where: { id: req.params.id as string } });
        res.json({ message: 'Categoría eliminada' });
    } catch (error) {
        console.error('Delete category error:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// ─── MOVEMENTS ────────────────────────────────────────────────────────

// List movements (with pagination)
router.get('/movements', authenticate, async (req: AuthRequest, res) => {
    try {
        const sellerId = await getSellerId(req.user!.userId);
        if (!sellerId) return res.status(403).json({ error: 'Acceso denegado' });

        const where: any = sellerId === '__admin__' ? {} : { sellerId };
        if (req.query.type) where.type = req.query.type;
        if (req.query.categoryId) where.categoryId = req.query.categoryId;

        const movements = await prisma.sellerMovement.findMany({
            where,
            include: { category: true },
            orderBy: { date: 'desc' },
            take: Number(req.query.limit) || 50,
            skip: Number(req.query.offset) || 0,
        });

        const total = await prisma.sellerMovement.count({ where });
        res.json({ movements, total });
    } catch (error) {
        console.error('Get movements error:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Create movement
router.post('/movements', authenticate, async (req: AuthRequest, res) => {
    try {
        const sellerId = await getSellerId(req.user!.userId);
        if (!sellerId || sellerId === '__admin__') return res.status(403).json({ error: 'Acceso denegado' });

        const { categoryId, type, amount, description, voucherNumber, date, reference } = req.body;
        if (!categoryId || !type || !amount || !description) {
            return res.status(400).json({ error: 'Categoría, tipo, monto y descripción son obligatorios' });
        }

        // Verify category belongs to seller
        const cat = await prisma.sellerCategory.findUnique({ where: { id: categoryId } });
        if (!cat || cat.sellerId !== sellerId) return res.status(400).json({ error: 'Categoría no válida' });

        const movement = await prisma.sellerMovement.create({
            data: {
                sellerId,
                categoryId,
                type,
                amount: Number(amount),
                description,
                voucherNumber: voucherNumber || null,
                date: date ? new Date(date) : new Date(),
                reference: reference || null,
            },
            include: { category: true },
        });

        res.status(201).json(movement);
    } catch (error) {
        console.error('Create movement error:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Delete movement
router.delete('/movements/:id', authenticate, async (req: AuthRequest, res) => {
    try {
        const sellerId = await getSellerId(req.user!.userId);
        if (!sellerId) return res.status(403).json({ error: 'Acceso denegado' });

        const movement = await prisma.sellerMovement.findUnique({ where: { id: req.params.id as string } });
        if (!movement) return res.status(404).json({ error: 'Movimiento no encontrado' });
        if (sellerId !== '__admin__' && movement.sellerId !== sellerId) return res.status(403).json({ error: 'Acceso denegado' });

        await prisma.sellerMovement.delete({ where: { id: req.params.id as string } });
        res.json({ message: 'Movimiento eliminado' });
    } catch (error) {
        console.error('Delete movement error:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// ─── SEED DEFAULT CATEGORIES ──────────────────────────────────────────
router.post('/seed-categories', authenticate, async (req: AuthRequest, res) => {
    try {
        const sellerId = await getSellerId(req.user!.userId);
        if (!sellerId || sellerId === '__admin__') return res.status(403).json({ error: 'Acceso denegado' });

        const existing = await prisma.sellerCategory.count({ where: { sellerId } });
        if (existing > 0) return res.json({ message: 'Categorías ya existen', seeded: false });

        const defaults = [
            { name: 'Ventas POS', type: 'income', color: '#10b981', icon: 'shopping-cart', isSystem: true },
            { name: 'Ventas Online', type: 'income', color: '#3b82f6', icon: 'globe', isSystem: true },
            { name: 'Otros Ingresos', type: 'income', color: '#8b5cf6', icon: 'plus-circle', isSystem: false },
            { name: 'Compras / Mercadería', type: 'expense', color: '#ef4444', icon: 'package', isSystem: false },
            { name: 'Alquiler', type: 'expense', color: '#f59e0b', icon: 'home', isSystem: false },
            { name: 'Servicios (Luz, Agua)', type: 'expense', color: '#06b6d4', icon: 'zap', isSystem: false },
            { name: 'Salarios', type: 'expense', color: '#ec4899', icon: 'users', isSystem: false },
            { name: 'Transporte', type: 'expense', color: '#f97316', icon: 'truck', isSystem: false },
            { name: 'Otros Gastos', type: 'expense', color: '#6b7280', icon: 'minus-circle', isSystem: false },
        ];

        await prisma.sellerCategory.createMany({
            data: defaults.map(d => ({ ...d, sellerId })),
        });

        const categories = await prisma.sellerCategory.findMany({ where: { sellerId }, orderBy: { name: 'asc' } });
        res.json({ message: 'Categorías creadas', seeded: true, categories });
    } catch (error) {
        console.error('Seed categories error:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

export default router;
