import { Router } from 'express';
import { prisma } from '../utils/prisma.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Get all customers for the current seller
router.get('/', authenticate, async (req: AuthRequest, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user!.userId },
            include: { sellerProfile: true },
        });

        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        let where: any = {};
        if (user.role === 'seller') {
            if (!user.sellerProfile) {
                return res.status(400).json({ error: 'Perfil de vendedor no encontrado' });
            }
            where.sellerId = user.sellerProfile.id;
        } else if (user.role !== 'superadmin') {
            return res.status(403).json({ error: 'Acceso denegado' });
        }

        const customers = await prisma.customer.findMany({
            where,
            orderBy: { fullName: 'asc' },
        });

        res.json(customers);
    } catch (error) {
        console.error('Get customers error:', error);
        res.status(500).json({ error: 'Error en el servidor', details: String(error) });
    }
});

// Create a new customer
router.post('/', authenticate, async (req: AuthRequest, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user!.userId },
            include: { sellerProfile: true },
        });

        if (!user || (user.role !== 'seller' && user.role !== 'superadmin')) {
            return res.status(403).json({ error: 'Acceso denegado' });
        }

        const sellerId = user.role === 'seller' ? user.sellerProfile?.id : req.body.sellerId;

        if (!sellerId) {
            return res.status(400).json({ error: 'ID de vendedor es obligatorio' });
        }

        const { fullName, address, phone, ruc, city, notes } = req.body;

        if (!fullName) {
            return res.status(400).json({ error: 'Nombre completo es obligatorio' });
        }

        const customer = await prisma.customer.create({
            data: {
                sellerId,
                fullName,
                address,
                phone,
                ruc,
                city,
                notes,
            },
        });

        res.status(201).json(customer);
    } catch (error) {
        console.error('Create customer error:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Update a customer
router.put('/:id', authenticate, async (req: AuthRequest, res) => {
    try {
        const id = req.params.id as string;
        const user = await prisma.user.findUnique({
            where: { id: req.user!.userId },
            include: { sellerProfile: true },
        });

        const customer = await prisma.customer.findUnique({
            where: { id },
        });

        if (!customer) {
            return res.status(404).json({ error: 'Cliente no encontrado' });
        }

        if (user?.role !== 'superadmin' && customer.sellerId !== user?.sellerProfile?.id) {
            return res.status(403).json({ error: 'Acceso denegado' });
        }

        const updatedCustomer = await prisma.customer.update({
            where: { id },
            data: req.body,
        });

        res.json(updatedCustomer);
    } catch (error) {
        console.error('Update customer error:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Delete a customer
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
    try {
        const id = req.params.id as string;
        const user = await prisma.user.findUnique({
            where: { id: req.user!.userId },
            include: { sellerProfile: true },
        });

        const customer = await prisma.customer.findUnique({
            where: { id },
        });

        if (!customer) {
            return res.status(404).json({ error: 'Cliente no encontrado' });
        }

        if (user?.role !== 'superadmin' && customer.sellerId !== user?.sellerProfile?.id) {
            return res.status(403).json({ error: 'Acceso denegado' });
        }

        await prisma.customer.delete({
            where: { id },
        });

        res.json({ message: 'Cliente eliminado correctamente' });
    } catch (error) {
        console.error('Delete customer error:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

export default router;
