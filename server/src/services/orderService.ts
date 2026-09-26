import crypto from 'crypto';
import type { OrderStatus, Prisma } from '@prisma/client';
import { prisma } from '../utils/prisma.js';
import { ensureWallet } from './userService.js';
import { planAllowsOnlineSales } from '../utils/plans.js';
import {
  getAffiliateConfig,
  createCommissionsForOrder,
  cancelCommissionsForOrder,
  onOrderDelivered,
  notifyNewCommissions,
} from './affiliateService.js';

export class OrderError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

const MAX_QTY_PER_ITEM = 1000;
const ONLINE_PAYMENT_METHODS = ['wallet', 'cash'] as const;

export const parseQuantity = (raw: unknown): number => {
  const qty = Number(raw);
  if (!Number.isInteger(qty) || qty < 1 || qty > MAX_QTY_PER_ITEM) {
    throw new OrderError(400, 'Cantidad inválida: debe ser un número entero entre 1 y 1000');
  }
  return qty;
};

const newOrderNumber = () => `ORD-${Date.now()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

/** Descuenta stock solo si alcanza (atómico: evita vender de más con compras simultáneas). */
const decrementStock = async (tx: Prisma.TransactionClient, productId: string, qty: number, name: string) => {
  const r = await tx.product.updateMany({ where: { id: productId, stock: { gte: qty } }, data: { stock: { decrement: qty } } });
  if (r.count === 0) throw new OrderError(400, `Stock insuficiente: ${name}`);
};

// ─── Compra online (checkout) ─────────────────────────────────────────────────

export interface CheckoutInput {
  items: { productId: string; quantity: unknown }[];
  paymentMethod: string;
  deliveryType?: string;
  deliveryAddress?: any;
  deliveryNotes?: string;
  visitorId?: string | null;
}

/**
 * Crea un pedido por tienda en una sola transacción. Precios, comisiones y estado de pago se calculan
 * en el servidor; lo que mande el navegador para esos campos se ignora.
 */
export const createCheckoutOrders = async (buyerId: string, input: CheckoutInput) => {
  if (!Array.isArray(input.items) || input.items.length === 0) {
    throw new OrderError(400, 'El pedido debe tener al menos un producto');
  }
  if (!ONLINE_PAYMENT_METHODS.includes(input.paymentMethod as any)) {
    throw new OrderError(400, 'Método de pago inválido');
  }
  const paidWithWallet = input.paymentMethod === 'wallet';

  // Unifica cantidades del mismo producto
  const qtyByProduct = new Map<string, number>();
  for (const it of input.items) {
    if (!it || typeof it.productId !== 'string') throw new OrderError(400, 'Producto inválido');
    const qty = parseQuantity(it.quantity);
    qtyByProduct.set(it.productId, (qtyByProduct.get(it.productId) || 0) + qty);
  }
  for (const qty of qtyByProduct.values()) if (qty > MAX_QTY_PER_ITEM) throw new OrderError(400, 'Cantidad inválida');

  const cfg = await getAffiliateConfig();
  const checkoutGroup = crypto.randomUUID();

  const result = await prisma.$transaction(async (tx) => {
    const products = await tx.product.findMany({
      where: { id: { in: [...qtyByProduct.keys()] } },
      include: { seller: { include: { user: { select: { isActive: true } }, plan: { select: { name: true, features: true } } } } },
    });
    if (products.length !== qtyByProduct.size) throw new OrderError(404, 'Uno de los productos ya no está disponible.');

    for (const p of products) {
      if (p.status !== 'active' || p.visibility === 'local' || !p.seller.user.isActive) {
        throw new OrderError(400, `El producto "${p.name}" no está disponible para compra online.`);
      }
      if (p.seller.userId === buyerId) throw new OrderError(400, 'No puedes comprar productos de tu propia tienda.');
      if (!planAllowsOnlineSales(p.seller.plan)) {
        throw new OrderError(400, `La tienda "${p.seller.storeName}" no tiene habilitada la venta online.`);
      }
      if (!(p.price > 0)) throw new OrderError(400, `El producto "${p.name}" no tiene un precio válido.`);
    }

    // Agrupa por tienda (Product.sellerId = SellerProfile.id)
    const byStore = new Map<string, typeof products>();
    for (const p of products) {
      const list = byStore.get(p.sellerId) || [];
      list.push(p);
      byStore.set(p.sellerId, list);
    }

    const grandTotal = products.reduce((sum, p) => sum + p.price * qtyByProduct.get(p.id)!, 0);

    let buyerWalletId: string | null = null;
    if (paidWithWallet) {
      // Descuento atómico: falla si el saldo no alcanza, aun con compras simultáneas
      const charged = await tx.wallet.updateMany({
        where: { userId: buyerId, balance: { gte: grandTotal } },
        data: { balance: { decrement: grandTotal }, totalOut: { increment: grandTotal } },
      });
      if (charged.count === 0) throw new OrderError(400, 'No tienes saldo suficiente en tu billetera Oscorp.');
      buyerWalletId = (await tx.wallet.findUnique({ where: { userId: buyerId } }))!.id;
    }

    const orders = [];
    const newCommissions: any[] = [];

    for (const [, storeProducts] of byStore) {
      const seller = storeProducts[0].seller;
      const sellerUserId = seller.userId;

      let subtotal = 0;
      const itemsData = storeProducts.map((p) => {
        const quantity = qtyByProduct.get(p.id)!;
        const total = p.price * quantity;
        subtotal += total;
        return {
          productId: p.id,
          productName: p.name,
          productImage: p.images[0] || null,
          quantity,
          unitPrice: p.price,
          total,
          variant: null,
        };
      });

      for (const it of itemsData) await decrementStock(tx, it.productId, it.quantity, it.productName);

      // Comisión de plataforma: igual que antes, solo para tiendas sin plan fijo
      const platformRate = seller.planId ? 0 : (seller.commissionRate ? seller.commissionRate / 100 : 0.05);
      const commissionAmount = subtotal * platformRate;
      const orderNumber = newOrderNumber();

      const order = await tx.order.create({
        data: {
          orderNumber,
          buyerId,
          sellerId: sellerUserId,
          subtotal,
          tax: 0,
          shippingCost: 0,
          total: subtotal,
          deliveryType: input.deliveryType || 'delivery',
          deliveryAddress: input.deliveryAddress ?? undefined,
          deliveryNotes: input.deliveryNotes || null,
          paymentMethod: input.paymentMethod as any,
          paymentStatus: paidWithWallet ? 'paid' : 'pending',
          commissionAmount,
          sellerEarnings: subtotal - commissionAmount,
          isPosSale: false,
          checkoutGroup,
          items: { create: itemsData },
          trackingHistory: { create: { status: 'pending', description: 'Pedido creado exitosamente' } },
        },
        include: { items: true },
      });

      const { total: affiliateAmount, commissions } = await createCommissionsForOrder(tx, {
        orderId: order.id,
        orderNumber,
        buyerId,
        visitorId: input.visitorId,
        seller,
        items: order.items.map((oi) => {
          const p = storeProducts.find((sp) => sp.id === oi.productId)!;
          return { orderItemId: oi.id, productId: p.id, productName: p.name, unitPrice: oi.unitPrice, quantity: oi.quantity, product: p };
        }),
        paidWithWallet,
        cfg,
      });
      newCommissions.push(...commissions);

      const sellerEarnings = subtotal - commissionAmount - affiliateAmount;
      const finalOrder = affiliateAmount > 0
        ? await tx.order.update({ where: { id: order.id }, data: { affiliateAmount, sellerEarnings }, include: { items: true } })
        : order;

      if (paidWithWallet) {
        await tx.transaction.create({
          data: {
            walletId: buyerWalletId!,
            userId: buyerId,
            type: 'purchase',
            amount: -subtotal,
            description: `Compra en ${seller.storeName} - ${orderNumber}`,
            status: 'completed',
            relatedOrderId: order.id,
          },
        });
        const sellerWallet = await ensureWallet(sellerUserId, tx);
        await tx.wallet.update({
          where: { id: sellerWallet.id },
          data: { balance: { increment: sellerEarnings }, totalIn: { increment: sellerEarnings } },
        });
        await tx.transaction.create({
          data: {
            walletId: sellerWallet.id,
            userId: sellerUserId,
            type: 'sale',
            amount: sellerEarnings,
            description: `Venta - Pedido ${orderNumber}`,
            status: 'completed',
            relatedOrderId: order.id,
            metadata: affiliateAmount > 0 ? { affiliateAmount, platformCommission: commissionAmount } : undefined,
          },
        });
      }

      orders.push({ order: finalOrder, storeName: seller.storeName });
    }

    return { orders, newCommissions };
  }, { timeout: 20_000 });

  notifyNewCommissions(result.newCommissions);
  return result.orders;
};

// ─── Venta POS ────────────────────────────────────────────────────────────────

export interface PosInput {
  sellerId: string; // SellerProfile.id
  items: { productId: string; quantity: unknown; variant?: string | null }[];
  paymentMethod?: string;
  paymentStatus?: string;
  orderNumber?: string;
  deliveryType?: string;
  deliveryAddress?: any;
  deliveryNotes?: string;
}

/**
 * Venta de mostrador. Mismo comportamiento que antes, pero solo la puede registrar la dueña de la tienda
 * (o un superadmin), con cantidades válidas. El POS nunca genera comisión de afiliado.
 */
export const createPosOrder = async (userId: string, isSuperadmin: boolean, input: PosInput) => {
  if (!Array.isArray(input.items) || input.items.length === 0) {
    throw new OrderError(400, 'El pedido debe tener al menos un producto');
  }
  const sellerProfile = await prisma.sellerProfile.findUnique({
    where: { id: input.sellerId || '' },
    select: { id: true, userId: true, commissionRate: true, storeName: true, planId: true },
  });
  if (!sellerProfile) throw new OrderError(404, 'El vendedor no está disponible.');
  if (sellerProfile.userId !== userId && !isSuperadmin) {
    throw new OrderError(403, 'Solo la tienda puede registrar ventas POS');
  }

  const allowedMethods = ['cash', 'card', 'wallet', 'transfer', 'credito'];
  const paymentMethod = allowedMethods.includes(input.paymentMethod || '') ? input.paymentMethod! : 'cash';
  const paymentStatus = input.paymentStatus === 'paid' ? 'paid' : 'pending';
  const sellerUserId = sellerProfile.userId;

  // Número de venta único: si el que manda el POS ya existe, se le agrega un sufijo
  let orderNumber = (input.orderNumber || '').trim().slice(0, 40) || `POS-${Date.now()}`;
  if (await prisma.order.findUnique({ where: { orderNumber } })) {
    orderNumber = `${orderNumber}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
  }

  const order = await prisma.$transaction(async (tx) => {
    let subtotal = 0;
    const itemsData = [];
    for (const item of input.items) {
      const quantity = parseQuantity(item.quantity);
      const product = await tx.product.findUnique({ where: { id: item.productId } });
      if (!product || product.sellerId !== sellerProfile.id) throw new OrderError(404, 'Uno de los productos ya no está disponible.');
      await decrementStock(tx, product.id, quantity, product.name);
      const total = product.price * quantity;
      subtotal += total;
      itemsData.push({
        productId: product.id,
        productName: product.name,
        productImage: product.images[0] || null,
        quantity,
        unitPrice: product.price,
        total,
        variant: item.variant || null,
      });
    }

    const platformRate = sellerProfile.planId ? 0 : (sellerProfile.commissionRate ? sellerProfile.commissionRate / 100 : 0.05);
    const commissionAmount = subtotal * platformRate;
    const sellerEarnings = subtotal - commissionAmount;

    // Se mantiene el comportamiento previo del POS con "wallet" (cobra la billetera de quien registra)
    if (paymentMethod === 'wallet') {
      const charged = await tx.wallet.updateMany({
        where: { userId, balance: { gte: subtotal } },
        data: { balance: { decrement: subtotal }, totalOut: { increment: subtotal } },
      });
      if (charged.count === 0) throw new OrderError(400, 'No tienes saldo suficiente en tu billetera Oscorp.');
      const sellerWallet = await ensureWallet(sellerUserId, tx);
      await tx.wallet.update({
        where: { id: sellerWallet.id },
        data: { balance: { increment: sellerEarnings }, totalIn: { increment: sellerEarnings } },
      });
    }

    const created = await tx.order.create({
      data: {
        orderNumber,
        buyerId: userId,
        sellerId: sellerUserId,
        subtotal,
        total: subtotal,
        deliveryType: input.deliveryType || 'presencial',
        deliveryAddress: input.deliveryAddress ?? undefined,
        deliveryNotes: input.deliveryNotes || null,
        paymentMethod: paymentMethod as any,
        paymentStatus: paymentMethod === 'wallet' ? 'paid' : paymentStatus,
        commissionAmount,
        sellerEarnings,
        isPosSale: true,
        items: { create: itemsData },
        trackingHistory: { create: { status: 'pending', description: 'Venta registrada en POS' } },
      },
      include: { items: true },
    });

    if (paymentMethod === 'wallet') {
      const buyerWallet = await tx.wallet.findUnique({ where: { userId } });
      const sellerWallet = await tx.wallet.findUnique({ where: { userId: sellerUserId } });
      await tx.transaction.create({
        data: { walletId: buyerWallet!.id, userId, type: 'purchase', amount: -subtotal, description: `Compra en ${sellerProfile.storeName} - ${orderNumber}`, status: 'completed', relatedOrderId: created.id },
      });
      await tx.transaction.create({
        data: { walletId: sellerWallet!.id, userId: sellerUserId, type: 'sale', amount: sellerEarnings, description: `Venta - Pedido ${orderNumber}`, status: 'completed', relatedOrderId: created.id },
      });
    }
    return created;
  });

  return { order, storeName: sellerProfile.storeName };
};

// ─── Cambios de estado ────────────────────────────────────────────────────────

export const ORDER_STATUSES: OrderStatus[] = ['pending', 'confirmed', 'preparing', 'ready', 'in_transit', 'delivered', 'cancelled', 'refunded'];

export const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  preparing: 'En preparación',
  ready: 'Listo',
  in_transit: 'En camino',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
  refunded: 'Reembolsado',
};

/**
 * Cambia el estado de un pedido. Al entregar libera el reloj de las comisiones (y cobra la de contra entrega);
 * al cancelar reembolsa al comprador, descuenta a la tienda lo que cobró, repone stock y anula o revierte comisiones.
 */
export const updateOrderStatus = async (orderId: string, rawStatus: string, description?: string) => {
  const status = (rawStatus === 'shipped' ? 'in_transit' : rawStatus) as OrderStatus; // 'shipped' lo mandaba el panel admin
  if (!ORDER_STATUSES.includes(status)) throw new OrderError(400, 'Estado inválido');
  if (status === 'refunded') throw new OrderError(400, 'Para devolver el dinero, cancela el pedido');

  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId }, include: { items: true } });
    if (!order) throw new OrderError(404, 'Pedido no encontrado');
    if (order.status === 'cancelled' || order.status === 'refunded') {
      throw new OrderError(400, 'El pedido ya está cancelado');
    }
    if (order.status === status) return order;

    // Candado optimista: si otro request cambió el estado en el medio, este no hace nada
    const claimed = await tx.order.updateMany({
      where: { id: orderId, status: order.status },
      data: {
        status,
        ...(status === 'delivered' ? { actualDelivery: new Date() } : {}),
        ...(status === 'delivered' && order.paymentMethod === 'cash' && order.paymentStatus === 'pending' ? { paymentStatus: 'paid' as const } : {}),
      },
    });
    if (claimed.count === 0) throw new OrderError(409, 'El pedido cambió mientras se actualizaba. Intenta de nuevo.');

    await tx.trackingEvent.create({
      data: { orderId, status, description: description || `Estado actualizado a ${STATUS_LABELS[status] || status}` },
    });

    if (status === 'delivered') {
      await onOrderDelivered(tx, order);
    }

    if (status === 'cancelled') {
      // 1. Reponer stock
      for (const item of order.items) {
        await tx.product.updateMany({ where: { id: item.productId }, data: { stock: { increment: item.quantity } } });
      }

      // 2. Comisiones de afiliado: anular o revertir
      await cancelCommissionsForOrder(tx, order, 'Pedido cancelado');

      // 3. Reembolso de pedidos pagados con billetera (online; el POS se cobra por fuera)
      if (order.paymentMethod === 'wallet' && order.paymentStatus === 'paid' && !order.isPosSale) {
        const buyerWallet = await ensureWallet(order.buyerId, tx);
        await tx.wallet.update({
          where: { id: buyerWallet.id },
          data: { balance: { increment: order.total }, totalIn: { increment: order.total } },
        });
        await tx.transaction.create({
          data: {
            walletId: buyerWallet.id,
            userId: order.buyerId,
            type: 'refund',
            amount: order.total,
            description: `Reembolso - Pedido ${order.orderNumber} cancelado`,
            status: 'completed',
            relatedOrderId: order.id,
          },
        });

        // A la tienda se le descuenta lo que cobró (puede quedar en negativo: es deuda con la plataforma)
        const sellerWallet = await ensureWallet(order.sellerId, tx);
        await tx.wallet.update({
          where: { id: sellerWallet.id },
          data: { balance: { decrement: order.sellerEarnings }, totalOut: { increment: order.sellerEarnings } },
        });
        await tx.transaction.create({
          data: {
            walletId: sellerWallet.id,
            userId: order.sellerId,
            type: 'refund',
            amount: -order.sellerEarnings,
            description: `Devolución por cancelación - Pedido ${order.orderNumber}`,
            status: 'completed',
            relatedOrderId: order.id,
          },
        });

        await tx.order.update({ where: { id: orderId }, data: { paymentStatus: 'refunded' } });
      }
    }

    return tx.order.findUnique({ where: { id: orderId } });
  }, { timeout: 20_000 });
};
