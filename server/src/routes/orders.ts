import { Router } from 'express';
import { prisma } from '../utils/prisma.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { sendPushToUser } from '../services/pushService.js';
import { createCheckoutOrders, createPosOrder, updateOrderStatus, OrderError, STATUS_LABELS } from '../services/orderService.js';

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

const sendOrderError = (res: any, error: any, fallback: string) => {
  if (error instanceof OrderError) return res.status(error.status).json({ error: error.message });
  console.error(fallback, error);
  return res.status(500).json({ error: 'Error interno del servidor' });
};

// Notifications (non-blocking)
const notifyNewOrder = (
  buyerId: string,
  order: { total: number; orderNumber: string; sellerId: string; items: { productName: string }[] },
  storeName: string,
) => {
  const itemSummary = order.items.length === 1
    ? order.items[0].productName
    : `${order.items[0].productName} y ${order.items.length - 1} más`;

  prisma.user.findUnique({
    where: { id: buyerId },
    select: { firstName: true, lastName: true },
  }).then(async (buyer) => {
    const buyerName = buyer ? `${buyer.firstName} ${buyer.lastName}` : 'Un cliente';

    // Notify Buyer
    const buyerMsg = `Tu compra en ${storeName} por ₲ ${order.total.toLocaleString()} fue procesada. Pedido ${order.orderNumber}.`;
    await prisma.notification.create({
      data: { userId: buyerId, title: 'Pedido Confirmado', message: buyerMsg, type: 'success', actionUrl: '/app/pedidos' },
    }).catch(() => {});
    sendPushToUser(buyerId, {
      title: 'Compra exitosa',
      body: buyerMsg,
      url: '/app/pedidos',
      tag: `order-${order.orderNumber}`,
    }).catch(() => {});

    // Notify Seller
    const sellerMsg = `${buyerName} compró ${itemSummary} por ₲ ${order.total.toLocaleString()}. Pedido ${order.orderNumber}.`;
    await prisma.notification.create({
      data: { userId: order.sellerId, title: 'Nueva Venta Recibida', message: sellerMsg, type: 'success', actionUrl: '/vendedor/pedidos' },
    }).catch(() => {});
    sendPushToUser(order.sellerId, {
      title: `Nueva Venta - ${storeName}`,
      body: sellerMsg,
      url: '/vendedor/pedidos',
      tag: `sale-${order.orderNumber}`,
    }).catch(() => {});
  }).catch(console.error);
};

// Checkout online: un pedido por tienda. Responde { orders: [...] }
router.post('/checkout', authenticate, async (req: AuthRequest, res) => {
  try {
    const { items, paymentMethod, deliveryType, deliveryAddress, deliveryNotes, visitorId } = req.body;
    const created = await createCheckoutOrders(req.user!.userId, {
      items, paymentMethod, deliveryType, deliveryAddress, deliveryNotes,
      visitorId: typeof visitorId === 'string' ? visitorId : null,
    });
    res.status(201).json({ orders: created.map((c) => c.order) });
    for (const c of created) notifyNewOrder(req.user!.userId, c.order, c.storeName);
  } catch (error: any) {
    sendOrderError(res, error, 'Checkout error:');
  }
});

// Create order. Las ventas POS (isPosSale) las registra la tienda; cualquier otro pedido pasa por el
// checkout, así ni el estado de pago ni los montos que mande el navegador se usan.
router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const {
      isPosSale, sellerId, items, paymentMethod, paymentStatus, orderNumber,
      deliveryType, deliveryAddress, deliveryNotes, visitorId,
    } = req.body;

    if (isPosSale) {
      const { order, storeName } = await createPosOrder(req.user!.userId, req.user!.roles.includes('superadmin'), {
        sellerId, items, paymentMethod, paymentStatus, orderNumber, deliveryType, deliveryAddress, deliveryNotes,
      });
      res.status(201).json(order);
      notifyNewOrder(req.user!.userId, order, storeName);
      return;
    }

    const created = await createCheckoutOrders(req.user!.userId, {
      items, paymentMethod, deliveryType, deliveryAddress, deliveryNotes,
      visitorId: typeof visitorId === 'string' ? visitorId : null,
    });
    // Compatibilidad: la respuesta vieja era un solo pedido
    res.status(201).json(created.length === 1 ? created[0].order : { orders: created.map((c) => c.order) });
    for (const c of created) notifyNewOrder(req.user!.userId, c.order, c.storeName);
  } catch (error: any) {
    sendOrderError(res, error, 'Order creation error:');
  }
});

// Update order status
router.patch('/:id/status', authenticate, async (req: AuthRequest, res) => {
  try {
    const id = req.params.id as string;
    const { status, description } = req.body;

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    // Only seller or admin can update status
    if (!req.user!.roles.includes('superadmin') && order.sellerId !== req.user!.userId) {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    const result = await updateOrderStatus(id, status, description);
    const finalStatus = result?.status || status;
    const label = STATUS_LABELS[finalStatus] || finalStatus;

    // Notify buyer about status change (DB + Push)
    if (order.buyerId && order.buyerId !== order.sellerId && order.status !== finalStatus) {
      const refunded = finalStatus === 'cancelled' && order.paymentMethod === 'wallet' && order.paymentStatus === 'paid' && !order.isPosSale;
      const statusMsg = refunded
        ? `Tu pedido ${order.orderNumber} fue cancelado y te devolvimos ₲ ${order.total.toLocaleString()} a tu billetera.`
        : `Tu pedido ${order.orderNumber} fue actualizado a: ${label}.`;
      prisma.notification.create({
        data: {
          userId: order.buyerId,
          title: `Pedido ${label}`,
          message: statusMsg,
          type: finalStatus === 'cancelled' ? 'warning' : 'info',
          actionUrl: '/app/pedidos',
        },
      }).catch(() => {});

      sendPushToUser(order.buyerId, {
        title: `Pedido ${label}`,
        body: statusMsg,
        url: '/app/pedidos',
        tag: `order-status-${order.orderNumber}`,
      }).catch(() => {});
    }

    res.json(result);
  } catch (error) {
    sendOrderError(res, error, 'Order status error:');
  }
});

export default router;
