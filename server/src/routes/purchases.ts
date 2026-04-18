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
        if (user.roles.includes('seller')) {
            if (!user.sellerProfile) {
                return res.status(400).json({ error: 'Perfil de vendedor no encontrado' });
            }
            where.sellerId = user.sellerProfile.id;
        } else if (!user.roles.includes('superadmin')) {
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
        const { supplierId, invoiceName, invoiceNumber, purchaseDate, notes, items, sellerId: bodySellerId } = req.body;

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'Se requiere al menos un producto' });
        }

        const result = await prisma.$transaction(async (tx) => {
            // 1. Identify Seller and validate access
            const user = await tx.user.findUnique({
                where: { id: req.user!.userId },
                include: { sellerProfile: true },
            });

            if (!user || (!user.roles.includes('seller') && !user.roles.includes('superadmin'))) {
                throw new Error('UNAUTHORIZED_ACCESS');
            }

            const sellerId = user.roles.includes('seller') ? user.sellerProfile?.id : bodySellerId;

            if (!sellerId) {
                throw new Error('SELLER_ID_REQUIRED');
            }

            // 2. Calculate totals and validate products
            let totalAmount = 0;
            const itemsToCreate = [];
            const stockIncrements = [];

            for (const item of items) {
                const product = await tx.product.findUnique({
                    where: { id: item.productId }
                });

                if (!product) {
                    throw new Error(`PRODUCT_NOT_FOUND:${item.productId}`);
                }

                const itemTotal = item.quantity * item.unitCost;
                totalAmount += itemTotal;

                itemsToCreate.push({
                    productId: item.productId,
                    quantity: item.quantity,
                    unitCost: item.unitCost,
                    totalCost: itemTotal,
                });

                stockIncrements.push({
                    id: item.productId,
                    quantity: item.quantity,
                    unitCost: item.unitCost
                });
            }

            // 3. Create Purchase Record
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
                        create: itemsToCreate,
                    },
                },
                include: {
                    items: true
                }
            });

            // 4. Update Stock and create Movements
            for (const item of stockIncrements) {
                await tx.product.update({
                    where: { id: item.id },
                    data: {
                        stock: { increment: item.quantity },
                        cost: item.unitCost // Update cost to the latest purchase cost
                    }
                });

                await tx.stockMovement.create({
                    data: {
                        productId: item.id,
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
    } catch (error: any) {
        let status = 500;
        let message = 'Error interno en el servidor';

        if (error.message === 'UNAUTHORIZED_ACCESS') {
            status = 403;
            message = 'No tienes permisos para realizar esta operación.';
        } else if (error.message === 'SELLER_ID_REQUIRED') {
            status = 400;
            message = 'El ID del vendedor es obligatorio.';
        } else if (error.message.startsWith('PRODUCT_NOT_FOUND')) {
            status = 404;
            message = 'Uno de los productos especificados no fue encontrado.';
        }

        console.error('Create purchase error:', error);
        res.status(status).json({ error: message });
    }
});

// Delete a purchase and reverse stock
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
    try {
        const id = req.params.id as string;

        const result = await prisma.$transaction(async (tx) => {
            // 1. Find the purchase and check owner
            const purchase = await tx.purchase.findUnique({
                where: { id },
                include: { items: true }
            });

            if (!purchase) {
                throw new Error('PURCHASE_NOT_FOUND');
            }

            // Verify seller owns the purchase
            const user = await tx.user.findUnique({
                where: { id: req.user!.userId },
                include: { sellerProfile: true },
            });

            if (!user || (!user.roles.includes('seller') && !user.roles.includes('superadmin'))) {
                throw new Error('UNAUTHORIZED_ACCESS');
            }

            if (user.roles.includes('seller') && purchase.sellerId !== user.sellerProfile?.id) {
                throw new Error('UNAUTHORIZED_ACCESS');
            }

            // 2. Reverse stock for each item
            for (const item of purchase.items) {
                // Decrement stock
                await tx.product.update({
                    where: { id: item.productId },
                    data: {
                        stock: { decrement: item.quantity }
                    }
                });

                // Record stock correction movement
                await tx.stockMovement.deleteMany({
                    where: {
                        reference: purchase.id,
                        productId: item.productId,
                        type: 'purchase'
                    }
                });
            }

            // 3. Delete the purchase (items will cascade delete due to schema relation)
            await tx.purchase.delete({
                where: { id }
            });

            return { success: true, message: 'Registro de compra eliminado y stock revertido' };
        }, { timeout: 30000 });

        res.json(result);
    } catch (error: any) {
        let status = 500;
        let message = 'Error en el servidor al eliminar la compra';

        if (error.message === 'PURCHASE_NOT_FOUND') {
            status = 404;
            message = 'La compra no fue encontrada.';
        } else if (error.message === 'UNAUTHORIZED_ACCESS') {
            status = 403;
            message = 'No tienes permisos para realizar esta operación.';
        }

        console.error('Delete purchase error:', error);
        res.status(status).json({ error: message });
    }
});

export default router;
