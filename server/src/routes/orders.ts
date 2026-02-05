import { Router } from 'express';
import { prisma } from '../utils/prisma.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Get all orders for current user
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const { as = 'buyer' } = req.query;

    const where = as === 'seller'
      ? { sellerId: req.user!.userId }
      : { buyerId: req.user!.userId };

    const orders = await prisma.order.findMany({
      where,
      include: {
        items: true,
        buyer: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        seller: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        trackingHistory: {
          orderBy: { timestamp: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

// Get order by ID
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const id = req.params.id as string;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        buyer: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        seller: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        trackingHistory: {
          orderBy: { timestamp: 'desc' },
        },
      },
    });

    if (!order) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }

    // Check if user is buyer, seller, or admin
    if (
      req.user!.role !== 'superadmin' &&
      order.buyerId !== req.user!.userId &&
      order.sellerId !== req.user!.userId
    ) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

// Create order
router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const {
      sellerId,
      items,
      deliveryType,
      deliveryAddress,
      deliveryNotes,
      paymentMethod,
    } = req.body;

    // Calculate totals
    let subtotal = 0;
    const orderItems: { productId: string; productName: string; productImage: string | null; quantity: number; unitPrice: number; total: number; variant: string | null; }[] = [];

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
      });

      if (!product) {
        return res.status(404).json({ error: `Produto ${item.productId} não encontrado` });
      }

      const total = product.price * item.quantity;
      subtotal += total;

      orderItems.push({
        productId: product.id,
        productName: product.name,
        productImage: product.images[0] || null,
        quantity: item.quantity,
        unitPrice: product.price,
        total,
        variant: item.variant || null,
      });
    }

    const tax = subtotal * 0.1; // 10% tax
    const shippingCost = deliveryType === 'delivery' ? 15000 : 0;
    const total = subtotal + tax + shippingCost;
    const commissionAmount = subtotal * 0.05; // 5% commission
    const sellerEarnings = subtotal - commissionAmount;

    const orderNumber = `ORD-${Date.now()}`;

    // Check wallet balance if paying with wallet
    if (paymentMethod === 'wallet') {
      const wallet = await prisma.wallet.findUnique({
        where: { userId: req.user!.userId },
      });

      if (!wallet || wallet.balance < total) {
        return res.status(400).json({ error: 'Saldo insuficiente na carteira' });
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      // Create order
      const order = await tx.order.create({
        data: {
          orderNumber,
          buyerId: req.user!.userId,
          sellerId,
          subtotal,
          tax,
          shippingCost,
          total,
          deliveryType,
          deliveryAddress,
          deliveryNotes,
          paymentMethod,
          commissionAmount,
          sellerEarnings,
          items: {
            create: orderItems,
          },
          trackingHistory: {
            create: {
              status: 'pending',
              description: 'Pedido criado',
            },
          },
        },
        include: {
          items: true,
          trackingHistory: true,
        },
      });

      // If paying with wallet, process payment
      if (paymentMethod === 'wallet') {
        const buyerWallet = await tx.wallet.findUnique({
          where: { userId: req.user!.userId },
        });

        const sellerWallet = await tx.wallet.findUnique({
          where: { userId: sellerId },
        });

        if (buyerWallet && sellerWallet) {
          // Deduct from buyer
          await tx.wallet.update({
            where: { id: buyerWallet.id },
            data: {
              balance: { decrement: total },
              totalOut: { increment: total },
            },
          });

          // Add to seller (minus commission)
          await tx.wallet.update({
            where: { id: sellerWallet.id },
            data: {
              balance: { increment: sellerEarnings },
              totalIn: { increment: sellerEarnings },
            },
          });

          // Create transactions
          await tx.transaction.create({
            data: {
              walletId: buyerWallet.id,
              userId: req.user!.userId,
              type: 'purchase',
              amount: -total,
              description: `Compra - ${orderNumber}`,
              status: 'completed',
              relatedOrderId: order.id,
            },
          });

          await tx.transaction.create({
            data: {
              walletId: sellerWallet.id,
              userId: sellerId,
              type: 'sale',
              amount: sellerEarnings,
              description: `Venda - ${orderNumber}`,
              status: 'completed',
              relatedOrderId: order.id,
            },
          });

          // Update order payment status
          await tx.order.update({
            where: { id: order.id },
            data: { paymentStatus: 'paid' },
          });
        }
      }

      // Update product stock
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: { decrement: item.quantity },
          },
        });
      }

      return order;
    });

    res.status(201).json(result);
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

// Update order status
router.patch('/:id/status', authenticate, async (req: AuthRequest, res) => {
  try {
    const id = req.params.id as string;
    const { status, description } = req.body;

    const order = await prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }

    // Only seller or admin can update status
    if (req.user!.role !== 'superadmin' && order.sellerId !== req.user!.userId) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Update order status
      const updatedOrder = await tx.order.update({
        where: { id },
        data: {
          status,
          updatedAt: new Date(),
        },
      });

      // Add tracking event
      await tx.trackingEvent.create({
        data: {
          orderId: id,
          status,
          description: description || `Status atualizado para ${status}`,
        },
      });

      return updatedOrder;
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

export default router;
