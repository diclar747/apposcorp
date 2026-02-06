import { Router } from 'express';
import { prisma } from '../utils/prisma.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Get all suppliers for the current seller
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

        const suppliers = await prisma.supplier.findMany({
            where,
            orderBy: { name: 'asc' },
        });

        res.json(suppliers);
    } catch (error) {
        console.error('Get suppliers error:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Create a new supplier
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

        const { name, contactName, email, phone, address, taxId, paymentTerms, notes } = req.body;

        const supplier = await prisma.supplier.create({
            data: {
                sellerId,
                name,
                contactName,
                email,
                phone,
                address,
                taxId,
                paymentTerms,
                notes,
            },
        });

        res.status(201).json(supplier);
    } catch (error) {
        console.error('Create supplier error:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Update a supplier
router.put('/:id', authenticate, async (req: AuthRequest, res) => {
    try {
        const { id } = req.params;
        const user = await prisma.user.findUnique({
            where: { id: req.user!.userId },
            include: { sellerProfile: true },
        });

        const supplier = await prisma.supplier.findUnique({
            where: { id },
        });

        if (!supplier) {
            return res.status(404).json({ error: 'Proveedor no encontrado' });
        }

        // Authorization
        if (user?.role !== 'superadmin' && supplier.sellerId !== user?.sellerProfile?.id) {
            return res.status(403).json({ error: 'Acceso denegado' });
        }

        const updatedSupplier = await prisma.supplier.update({
            where: { id },
            data: req.body,
        });

        res.json(updatedSupplier);
    } catch (error) {
        console.error('Update supplier error:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Delete a supplier
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
    try {
        const { id } = req.params;
        const user = await prisma.user.findUnique({
            where: { id: req.user!.userId },
            include: { sellerProfile: true },
        });

        const supplier = await prisma.supplier.findUnique({
            where: { id },
        });

        if (!supplier) {
            return res.status(404).json({ error: 'Proveedor no encontrado' });
        }

        // Authorization
        if (user?.role !== 'superadmin' && supplier.sellerId !== user?.sellerProfile?.id) {
            return res.status(403).json({ error: 'Acceso denegado' });
        }

        await prisma.supplier.delete({
            where: { id },
        });

        res.json({ message: 'Proveedor eliminado correctamente' });
    } catch (error) {
        console.error('Delete supplier error:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

export default router;
