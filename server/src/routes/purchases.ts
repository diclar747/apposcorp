import { Router } from 'express';
import { prisma } from '../utils/prisma.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Get all purchases for the current seller
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

        const purchases = await prisma.purchase.findMany({
            where,
            include: {
                supplier: true,
                items: {
                    include: {
                        product: true
                    }
                }
            },
            orderBy: { purchaseDate: 'desc' },
        });

        res.json(purchases);
    } catch (error) {
        console.error('Get purchases error:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Create a new purchase
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

        const { supplierId, invoiceName, invoiceNumber, purchaseDate, notes, items } = req.body;

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'Se requiere al menos un producto' });
        }

        // Calculate total amount
        const totalAmount = items.reduce((sum: number, item: any) => sum + (item.quantity * item.unitCost), 0);

        // Use a transaction to create purchase and update stock
        const result = await prisma.$transaction(async (tx) => {
            const purchase = await tx.purchase.create({
                data: {
                    sellerId,
                    supplierId,
                    invoiceName,
                    invoiceNumber,
                    purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
                    totalAmount,
                    notes,
                    items: {
                        create: items.map((item: any) => ({
                            productId: item.productId,
                            quantity: item.quantity,
                            unitCost: item.unitCost,
                            totalCost: item.quantity * item.unitCost,
                        })),
                    },
                },
                include: {
                    items: true
                }
            });

            // Update products stock and stock movements
            for (const item of items) {
                await tx.product.update({
                    where: { id: item.productId },
                    data: {
                        stock: {
                            increment: item.quantity
                        },
                        cost: item.unitCost // Update last cost
                    }
                });

                await tx.stockMovement.create({
                    data: {
                        productId: item.productId,
                        type: 'purchase',
                        quantity: item.quantity,
                        reason: `Compra - Factura ${invoiceNumber}`,
                        reference: purchase.id,
                        supplierId: supplierId,
                        cost: item.unitCost
                    }
                });
            }

            return purchase;
        });

        res.status(201).json(result);
    } catch (error) {
        console.error('Create purchase error:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

export default router;
