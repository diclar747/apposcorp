import { Router } from 'express';
import { prisma } from '../utils/prisma.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { sendPushToUser } from '../services/pushService.js';

const router = Router();

// Get all orders for current user (superadmin sees all)
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const { as = 'buyer' } = req.query;

    let where: any;
    if (req.user!.roles.includes('superadmin') && as === 'admin') {
      where = {}; // superadmin sees all orders
    } else if (as === 'seller') {
      where = { sellerId: req.user!.userId };
    } else {
      where = { buyerId: req.user!.userId };
    }

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
      !req.user!.roles.includes('superadmin') &&
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
      sellerId, // This is expected to be the SellerProfile.id
      items,
      deliveryType,
      deliveryAddress,
      deliveryNotes,
      paymentMethod,
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'El pedido debe tener al menos un producto' });
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Get Seller Profile and Commission Rate
      const sellerProfile = await tx.sellerProfile.findUnique({
        where: { id: sellerId },
        select: { userId: true, commissionRate: true, storeName: true, planId: true },
      });

      if (!sellerProfile) {
        throw new Error('SELLER_NOT_FOUND');
      }

      const resolvedSellerUserId = sellerProfile.userId;
      
      // Determine commission rate based on whether they are using the "Por Comisión" model (no fixed plan)
      let commissionRateMultiplier = 0;
      if (!sellerProfile.planId) {
        // If they are on the commission model, convert the whole number percentage (e.g., 5) to a decimal (0.05)
        commissionRateMultiplier = sellerProfile.commissionRate ? (sellerProfile.commissionRate / 100) : 0.05;
      }

      // 2. Load products and validate stock/prices inside transaction
      let subtotal = 0;
      const orderItemsData = [];
      const stockUpdates = [];

      for (const item of items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });

        if (!product) {
          throw new Error(`PRODUCT_NOT_FOUND:${item.productId}`);
        }

        if (product.stock < item.quantity) {
          throw new Error(`INSUFFICIENT_STOCK:${product.name}`);
        }

        const totalItemPrice = product.price * item.quantity;
        subtotal += totalItemPrice;

        orderItemsData.push({
          productId: product.id,
          productName: product.name,
          productImage: product.images[0] || null,
          quantity: item.quantity,
          unitPrice: product.price,
          total: totalItemPrice,
          variant: item.variant || null,
        });

        stockUpdates.push({
          id: product.id,
          quantity: item.quantity
        });
      }

      const tax = 0; 
      const shippingCost = 0; 
      const total = subtotal + tax + shippingCost;
      
      // Dynamic Commission Calculation
      const commissionAmount = subtotal * commissionRateMultiplier;
      const sellerEarnings = subtotal - commissionAmount;
      const orderNumber = `ORD-${Date.now()}`;

      // 3. Handle Wallet Payment
      if (paymentMethod === 'wallet') {
        const buyerWallet = await tx.wallet.findUnique({
          where: { userId: req.user!.userId },
        });

        if (!buyerWallet || buyerWallet.balance < total) {
          throw new Error('INSUFFICIENT_WALLET_BALANCE');
        }

        const sellerWallet = await tx.wallet.findUnique({
          where: { userId: resolvedSellerUserId },
        });

        if (!sellerWallet) {
          throw new Error('SELLER_WALLET_NOT_FOUND');
        }

        // Deduct from buyer
        await tx.wallet.update({
          where: { id: buyerWallet.id },
          data: {
            balance: { decrement: total },
            totalOut: { increment: total },
          },
        });

        // Add to seller (net)
        await tx.wallet.update({
          where: { id: sellerWallet.id },
          data: {
            balance: { increment: sellerEarnings },
            totalIn: { increment: sellerEarnings },
          },
        });
      }

      // 4. Create Order
      const order = await tx.order.create({
        data: {
          orderNumber,
          buyerId: req.user!.userId,
          sellerId: resolvedSellerUserId,
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
          paymentStatus: paymentMethod === 'wallet' ? 'paid' : 'pending',
          items: {
            create: orderItemsData,
          },
          trackingHistory: {
            create: {
              status: 'pending',
              description: 'Pedido creado exitosamente',
            },
          },
        },
        include: {
          items: true,
        }
      });

      // 5. Create Transaction Records (if paid with wallet)
      if (paymentMethod === 'wallet') {
        const buyerWallet = await tx.wallet.findUnique({ where: { userId: req.user!.userId } });
        const sellerWallet = await tx.wallet.findUnique({ where: { userId: resolvedSellerUserId } });

        await tx.transaction.create({
          data: {
            walletId: buyerWallet!.id,
            userId: req.user!.userId,
            type: 'purchase',
            amount: -total,
            description: `Compra en ${sellerProfile.storeName} - ${orderNumber}`,
            status: 'completed',
            relatedOrderId: order.id,
          },
        });

        await tx.transaction.create({
          data: {
            walletId: sellerWallet!.id,
            userId: resolvedSellerUserId,
            type: 'sale',
            amount: sellerEarnings,
            description: `Venta - Pedido ${orderNumber}`,
            status: 'completed',
            relatedOrderId: order.id,
          },
        });
      }

      // 6. Update Stocks
      for (const update of stockUpdates) {
        await tx.product.update({
          where: { id: update.id },
          data: {
            stock: { decrement: update.quantity },
          },
        });
      }

      return { order, sellerProfile };
    });

    res.status(201).json(result.order);

    // 7. Post-Processing: Notifications (Non-blocking)
    const { order, sellerProfile } = result;
    const itemSummary = order.items.length === 1
      ? order.items[0].productName
      : `${order.items[0].productName} y ${order.items.length - 1} más`;

    prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { firstName: true, lastName: true },
    }).then(async (buyer) => {
      const buyerName = buyer ? `${buyer.firstName} ${buyer.lastName}` : 'Un cliente';
      
      // Notify Buyer
      const buyerMsg = `Tu compra en ${sellerProfile.storeName} por ₲ ${order.total.toLocaleString()} fue procesada. Pedido ${order.orderNumber}.`;
      await prisma.notification.create({
        data: {
          userId: req.user!.userId,
          title: `Pedido Confirmado`,
          message: buyerMsg,
          type: 'success',
          actionUrl: `/app/pedidos`,
        },
      }).catch(() => {});

      sendPushToUser(req.user!.userId, {
        title: `Compra exitosa`,
        body: buyerMsg,
        url: '/app/pedidos',
        tag: `order-${order.orderNumber}`,
      }).catch(() => {});

      // Notify Seller
      const sellerMsg = `${buyerName} compró ${itemSummary} por ₲ ${order.total.toLocaleString()}. Pedido ${order.orderNumber}.`;
      await prisma.notification.create({
        data: {
          userId: order.sellerId,
          title: 'Nueva Venta Recibida',
          message: sellerMsg,
          type: 'success',
          actionUrl: `/vendedor/pedidos`,
        },
      }).catch(() => {});

      sendPushToUser(order.sellerId, {
        title: `Nueva Venta - ${sellerProfile.storeName}`,
        body: sellerMsg,
        url: '/vendedor/pedidos',
        tag: `sale-${order.orderNumber}`,
      }).catch(() => {});
    }).catch(console.error);

  } catch (error: any) {
    let status = 500;
    let message = 'Error interno del servidor';

    if (error.message === 'SELLER_NOT_FOUND') {
      status = 404;
      message = 'El vendedor no está disponible.';
    } else if (error.message.startsWith('PRODUCT_NOT_FOUND')) {
      status = 404;
      message = 'Uno de los productos ya no está disponible.';
    } else if (error.message.startsWith('INSUFFICIENT_STOCK')) {
      status = 400;
      message = `Stock insuficiente: ${error.message.split(':')[1]}`;
    } else if (error.message === 'INSUFFICIENT_WALLET_BALANCE') {
      status = 400;
      message = 'No tienes saldo suficiente en tu billetera Oscorp.';
    } else if (error.message === 'SELLER_WALLET_NOT_FOUND') {
      status = 400;
      message = 'La billetera del vendedor no está activa.';
    }

    console.error('Order creation error:', error);
    res.status(status).json({ error: message });
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
    if (!req.user!.roles.includes('superadmin') && order.sellerId !== req.user!.userId) {
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
