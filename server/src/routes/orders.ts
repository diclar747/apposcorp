import { Router } from 'express';
import { prisma } from '../utils/prisma.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { sendPushToUser } from '../services/pushService.js';

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
    res.status(500).json({ error: 'Error del servidor', details: String(error) });
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
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    // Check if user is buyer, seller, or admin
    if (
      req.user!.role !== 'superadmin' &&
      order.buyerId !== req.user!.userId &&
      order.sellerId !== req.user!.userId
    ) {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Error del servidor', details: String(error) });
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
        return res.status(404).json({ error: `Producto ${item.productId} no encontrado` });
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
        return res.status(400).json({ error: 'Saldo insuficiente en la billetera' });
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
              description: 'Pedido creado',
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
              description: `Venta - ${orderNumber}`,
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

    // Create notifications + Web Push (after response, non-blocking)
    const itemSummary = orderItems.length === 1
      ? orderItems[0].productName
      : `${orderItems[0].productName} y ${orderItems.length - 1} más`;

    // Fetch store name and buyer info for rich notifications
    Promise.all([
      prisma.user.findUnique({
        where: { id: req.user!.userId },
        select: { firstName: true, lastName: true },
      }),
      prisma.sellerProfile.findFirst({
        where: { userId: sellerId },
        select: { storeName: true },
      }),
    ]).then(async ([buyer, sellerProfile]) => {
      const buyerName = buyer ? `${buyer.firstName} ${buyer.lastName}` : 'Un cliente';
      const storeName = sellerProfile?.storeName || 'una tienda';

      // Notify buyer (DB + Push)
      const buyerMsg = `Tu compra en ${storeName} por ₲ ${total.toLocaleString()} fue procesada exitosamente. Pedido ${orderNumber}.`;
      prisma.notification.create({
        data: {
          userId: req.user!.userId,
          title: `Compra en ${storeName}`,
          message: buyerMsg,
          type: 'success',
          actionUrl: `/app/pedidos`,
        },
      }).catch(() => {});

      sendPushToUser(req.user!.userId, {
        title: `Compra en ${storeName}`,
        body: buyerMsg,
        url: '/app/pedidos',
        tag: `order-${orderNumber}`,
      }).catch(() => {});

      // Notify seller (DB + Push)
      const sellerMsg = `${buyerName} compró ${itemSummary} por ₲ ${total.toLocaleString()} en ${storeName}. Pedido ${orderNumber}.`;
      prisma.notification.create({
        data: {
          userId: sellerId,
          title: 'Nueva venta',
          message: sellerMsg,
          type: 'success',
          actionUrl: `/vendedor/pedidos`,
        },
      }).catch(() => {});

      sendPushToUser(sellerId, {
        title: `Nueva venta - ${storeName}`,
        body: sellerMsg,
        url: '/vendedor/pedidos',
        tag: `sale-${orderNumber}`,
      }).catch(() => {});
    }).catch(() => {});
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Error del servidor', details: String(error) });
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
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    // Only seller or admin can update status
    if (req.user!.role !== 'superadmin' && order.sellerId !== req.user!.userId) {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    const statusLabels: Record<string, string> = {
      pending: 'Pendiente',
      confirmed: 'Confirmado',
      preparing: 'En preparación',
      shipped: 'Enviado',
      delivered: 'Entregado',
      cancelled: 'Cancelado',
    };

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
          description: description || `Estado actualizado a ${statusLabels[status] || status}`,
        },
      });

      return updatedOrder;
    });

    // Notify buyer about status change (DB + Push)
    if (order.buyerId) {
      const statusMsg = `Tu pedido ${order.orderNumber} fue actualizado a: ${statusLabels[status] || status}.`;
      prisma.notification.create({
        data: {
          userId: order.buyerId,
          title: `Pedido ${statusLabels[status] || status}`,
          message: statusMsg,
          type: status === 'cancelled' ? 'warning' : 'info',
          actionUrl: `/app/pedidos`,
        },
      }).catch(() => {});

      sendPushToUser(order.buyerId, {
        title: `Pedido ${statusLabels[status] || status}`,
        body: statusMsg,
        url: '/app/pedidos',
        tag: `order-status-${order.orderNumber}`,
      }).catch(() => {});
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Error del servidor', details: String(error) });
  }
});

export default router;
