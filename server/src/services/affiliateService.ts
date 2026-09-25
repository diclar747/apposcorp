import crypto from 'crypto';
import type { Prisma, PrismaClient } from '@prisma/client';
import { prisma } from '../utils/prisma.js';
import { ensureWallet } from './userService.js';
import { sendPushToUser } from './pushService.js';

type Tx = Prisma.TransactionClient | PrismaClient;

// ─── Configuración (SystemSetting, grupo "afiliados") ─────────────────────────

export interface AffiliateConfig {
  enabled: boolean;
  minRate: number;
  maxRate: number;
  cookieDays: number;
  holdDays: number;
  autoApprove: boolean;
  autoRelease: boolean;
  showRatePublic: boolean;
  codEnabled: boolean;
}

export const AFFILIATE_SETTINGS: {
  key: string;
  field: keyof AffiliateConfig;
  type: 'bool' | 'number';
  default: string;
  isPublic: boolean;
  description: string;
}[] = [
  { key: 'affiliate_enabled', field: 'enabled', type: 'bool', default: 'false', isPublic: true, description: 'Prende o apaga todo el programa de afiliados' },
  { key: 'affiliate_min_rate', field: 'minRate', type: 'number', default: '1', isPublic: true, description: 'Porcentaje mínimo de comisión de afiliado' },
  { key: 'affiliate_max_rate', field: 'maxRate', type: 'number', default: '50', isPublic: true, description: 'Porcentaje máximo de comisión de afiliado' },
  { key: 'affiliate_cookie_days', field: 'cookieDays', type: 'number', default: '30', isPublic: false, description: 'Ventana de atribución (días, último clic)' },
  { key: 'affiliate_hold_days', field: 'holdDays', type: 'number', default: '7', isPublic: false, description: 'Plazo de garantía después de la entrega antes de liberar la comisión (días)' },
  { key: 'affiliate_auto_approve', field: 'autoApprove', type: 'bool', default: 'true', isPublic: false, description: 'Los afiliados quedan activos al instante (si no, los aprueba el admin)' },
  { key: 'affiliate_auto_release', field: 'autoRelease', type: 'bool', default: 'true', isPublic: false, description: 'Acreditar solas las comisiones vencidas (si no, el admin las paga)' },
  { key: 'affiliate_show_rate_public', field: 'showRatePublic', type: 'bool', default: 'true', isPublic: true, description: 'Mostrar el % de comisión a todos (si no, solo a usuarios logueados)' },
  { key: 'affiliate_cod_enabled', field: 'codEnabled', type: 'bool', default: 'true', isPublic: false, description: 'El pago contra entrega genera comisión (se cobra a la tienda al entregar)' },
];

export const getAffiliateConfig = async (tx: Tx = prisma): Promise<AffiliateConfig> => {
  const rows = await tx.systemSetting.findMany({
    where: { key: { in: AFFILIATE_SETTINGS.map((s) => s.key) } },
  });
  const byKey = new Map(rows.map((r) => [r.key, r.value]));
  const cfg: any = {};
  for (const s of AFFILIATE_SETTINGS) {
    const raw = byKey.get(s.key) ?? s.default;
    cfg[s.field] = s.type === 'bool' ? raw === 'true' : Number(raw);
    if (s.type === 'number' && !Number.isFinite(cfg[s.field])) cfg[s.field] = Number(s.default);
  }
  return cfg as AffiliateConfig;
};

/** Crea las claves que falten con su valor por defecto. No pisa valores existentes. */
export const ensureAffiliateSettings = async () => {
  for (const s of AFFILIATE_SETTINGS) {
    await prisma.systemSetting.upsert({
      where: { key: s.key },
      update: {},
      create: { key: s.key, value: s.default, group: 'afiliados', isPublic: s.isPublic, description: s.description },
    });
  }
};

// ─── Participación y porcentaje ───────────────────────────────────────────────

interface SellerAffiliateFields {
  affiliateEnabled: boolean;
  affiliateDefaultRate: number | null;
  affiliateAllProducts: boolean;
  affiliateBlocked: boolean;
}
interface ProductAffiliateFields {
  affiliateEnabled: boolean | null;
  affiliateRate: number | null;
  affiliateBlocked: boolean;
  status?: string;
}

const clampRate = (rate: number, cfg: AffiliateConfig) => Math.min(cfg.maxRate, Math.max(cfg.minRate, rate));

/**
 * Porcentaje de comisión de afiliado de un producto, o null si no participa.
 * Participa si la tienda tiene afiliados activos y el producto lo indica; si el producto no dice
 * nada (null), participa cuando la tienda marcó "todos". El % es el del producto o el general de la tienda.
 */
export const getEffectiveRate = (
  seller: SellerAffiliateFields,
  product: ProductAffiliateFields,
  cfg: AffiliateConfig,
): number | null => {
  if (!cfg.enabled) return null;
  if (!seller.affiliateEnabled || seller.affiliateBlocked || product.affiliateBlocked) return null;
  if (product.status && product.status !== 'active') return null;
  const participates = product.affiliateEnabled === true || (product.affiliateEnabled === null && seller.affiliateAllProducts);
  if (!participates) return null;
  const rate = product.affiliateRate ?? seller.affiliateDefaultRate;
  if (rate === null || rate === undefined || !(rate > 0)) return null;
  return clampRate(rate, cfg);
};

/**
 * Valida un % que manda una tienda. '' / null = sin % propio. Lanza RATE_OUT_OF_RANGE si no está en [min, max].
 */
export const parseRateInput = (value: unknown, cfg: AffiliateConfig): number | null => {
  if (value === null || value === undefined || value === '') return null;
  const rate = Number(value);
  if (!Number.isFinite(rate) || rate < cfg.minRate || rate > cfg.maxRate) throw new Error('RATE_OUT_OF_RANGE');
  return Math.round(rate * 100) / 100;
};

/** Valida el "participa" de un producto: true, false o null ("como la tienda"). */
export const parseTriState = (value: unknown): boolean | null => {
  if (value === true || value === 'true') return true;
  if (value === false || value === 'false') return false;
  return null;
};

/** La tienda acepta afiliados (para el enlace de tienda). */
export const storeParticipates = (seller: SellerAffiliateFields, cfg: AffiliateConfig) =>
  cfg.enabled && seller.affiliateEnabled && !seller.affiliateBlocked;

// ─── Perfil de afiliado ───────────────────────────────────────────────────────

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const randomCode = (n: number) =>
  Array.from(crypto.randomBytes(n), (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join('');

const buildCodePrefix = (firstName: string) =>
  (firstName || 'OSC')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z]/g, '')
    .toUpperCase()
    .slice(0, 4) || 'OSC';

export const joinAffiliateProgram = async (userId: string) => {
  const cfg = await getAffiliateConfig();
  if (!cfg.enabled) throw new Error('PROGRAM_DISABLED');

  const existing = await prisma.affiliateProfile.findUnique({ where: { userId } });
  if (existing) return existing;

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { firstName: true } });
  if (!user) throw new Error('USER_NOT_FOUND');

  const prefix = buildCodePrefix(user.firstName);
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = `${prefix}${randomCode(4)}`;
    try {
      return await prisma.$transaction(async (tx) => {
        await ensureWallet(userId, tx);
        return tx.affiliateProfile.create({
          data: {
            userId,
            code,
            status: cfg.autoApprove ? 'active' : 'pending',
            termsAcceptedAt: new Date(),
          },
        });
      });
    } catch (e: any) {
      // P2002: código repetido (o carrera con otro join del mismo usuario)
      if (e?.code !== 'P2002') throw e;
      const again = await prisma.affiliateProfile.findUnique({ where: { userId } });
      if (again) return again;
    }
  }
  throw new Error('CODE_GENERATION_FAILED');
};

// ─── Seguimiento de clics ─────────────────────────────────────────────────────

const CLICK_DEDUPE_MS = 30 * 60 * 1000;
const MAX_CLICKS_PER_VISITOR_PER_DAY = 100;

export const hashIp = (ip: string | undefined) =>
  ip ? crypto.createHash('sha256').update(`${ip}|${process.env.JWT_SECRET || 'oscorp'}`).digest('hex').slice(0, 32) : null;

export interface TrackInput {
  code: string;
  visitorId: string;
  productSlug?: string;
  productId?: string;
  storeSlug?: string;
  userId?: string | null;
  ip?: string;
}

/** Registra la visita de un enlace de afiliado. Devuelve null si el clic no aplica (se ignora sin error). */
export const trackClick = async (input: TrackInput) => {
  const cfg = await getAffiliateConfig();
  if (!cfg.enabled) return null;
  if (!input.code || !input.visitorId || input.visitorId.length > 64) return null;

  const affiliate = await prisma.affiliateProfile.findUnique({ where: { code: input.code.toUpperCase() } });
  if (!affiliate || affiliate.status !== 'active') return null;
  if (input.userId && input.userId === affiliate.userId) return null; // el afiliado visitando su propio enlace

  let sellerId: string;
  let productId: string | null = null;

  if (input.productSlug || input.productId) {
    const product = await prisma.product.findFirst({
      where: input.productSlug ? { OR: [{ slug: input.productSlug }, { id: input.productSlug }] } : { id: input.productId },
      include: { seller: true },
    });
    if (!product || getEffectiveRate(product.seller, product, cfg) === null) return null;
    if (product.seller.userId === affiliate.userId) return null;
    sellerId = product.sellerId;
    productId = product.id;
  } else if (input.storeSlug) {
    const seller = await prisma.sellerProfile.findUnique({ where: { storeSlug: input.storeSlug } });
    if (!seller || !storeParticipates(seller, cfg)) return null;
    if (seller.userId === affiliate.userId) return null;
    sellerId = seller.id;
  } else {
    return null;
  }

  const now = Date.now();
  const recent = await prisma.affiliateClick.findFirst({
    where: {
      visitorId: input.visitorId,
      affiliateId: affiliate.id,
      sellerId,
      productId,
      createdAt: { gte: new Date(now - CLICK_DEDUPE_MS) },
    },
    orderBy: { createdAt: 'desc' },
  });
  if (recent) {
    if (input.userId && !recent.userId) {
      await prisma.affiliateClick.update({ where: { id: recent.id }, data: { userId: input.userId } });
    }
    return recent;
  }

  const clicksToday = await prisma.affiliateClick.count({
    where: { visitorId: input.visitorId, createdAt: { gte: new Date(now - 24 * 60 * 60 * 1000) } },
  });
  if (clicksToday >= MAX_CLICKS_PER_VISITOR_PER_DAY) return null;

  const link = await prisma.affiliateLink.findFirst({
    where: { affiliateId: affiliate.id, sellerId, productId },
    select: { id: true },
  });

  return prisma.affiliateClick.create({
    data: {
      affiliateId: affiliate.id,
      linkId: link?.id ?? null,
      sellerId,
      productId,
      visitorId: input.visitorId,
      userId: input.userId ?? null,
      ipHash: hashIp(input.ip),
    },
  });
};

/** Asocia al usuario los clics hechos antes de iniciar sesión en este navegador. */
export const claimVisitorClicks = async (visitorId: string, userId: string) => {
  if (!visitorId) return;
  await prisma.affiliateClick.updateMany({ where: { visitorId, userId: null }, data: { userId } });
};

// ─── Comisiones al crear el pedido ────────────────────────────────────────────

export interface CommissionItem {
  orderItemId: string;
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  product: ProductAffiliateFields;
}

interface CreateCommissionsInput {
  orderId: string;
  orderNumber: string;
  buyerId: string;
  visitorId?: string | null;
  seller: SellerAffiliateFields & { id: string; userId: string; storeName: string };
  items: CommissionItem[];
  paidWithWallet: boolean;
  cfg: AffiliateConfig;
}

/**
 * Busca el último clic válido para cada producto, calcula y registra la comisión, y crea el
 * movimiento "Pendiente" en la billetera del afiliado. Corre dentro de la transacción del pedido.
 * Devuelve el total de comisiones (a descontar de lo que cobra la tienda).
 */
export const createCommissionsForOrder = async (tx: Prisma.TransactionClient, input: CreateCommissionsInput) => {
  const { cfg, seller } = input;
  if (!cfg.enabled || !storeParticipates(seller, cfg)) return { total: 0, commissions: [] as any[] };
  if (!input.paidWithWallet && !cfg.codEnabled) return { total: 0, commissions: [] as any[] };

  const since = new Date(Date.now() - cfg.cookieDays * 24 * 60 * 60 * 1000);
  const visitorFilter: Prisma.AffiliateClickWhereInput[] = [{ userId: input.buyerId }];
  if (input.visitorId) visitorFilter.push({ visitorId: input.visitorId });

  // Clics de esta tienda en la ventana, del más nuevo al más viejo (gana el último clic)
  const clicks = await tx.affiliateClick.findMany({
    where: { sellerId: seller.id, createdAt: { gte: since }, OR: visitorFilter },
    orderBy: { createdAt: 'desc' },
    include: { affiliate: true },
    take: 200,
  });
  if (clicks.length === 0) return { total: 0, commissions: [] as any[] };

  const created: any[] = [];
  let total = 0;

  for (const item of input.items) {
    const rate = getEffectiveRate(seller, item.product, cfg);
    if (rate === null) continue;

    // Un enlace de producto cubre solo ese producto; uno de tienda cubre todos los que participan
    const click = clicks.find(
      (c) =>
        (c.productId === item.productId || c.productId === null) &&
        c.affiliate.status === 'active' &&
        c.affiliate.userId !== input.buyerId && // compra propia
        c.affiliate.userId !== seller.userId, // la tienda promocionándose a sí misma
    );
    if (!click) continue;

    const baseAmount = item.unitPrice * item.quantity;
    const amount = Math.floor((baseAmount * rate) / 100);
    if (amount <= 0) continue;

    const affiliateWallet = await ensureWallet(click.affiliate.userId, tx);
    const walletTx = await tx.transaction.create({
      data: {
        walletId: affiliateWallet.id,
        userId: click.affiliate.userId,
        type: 'affiliate_commission',
        amount,
        description: `Comisión de afiliado - ${item.productName} (${seller.storeName}) - ${input.orderNumber}`,
        status: 'pending',
        relatedOrderId: input.orderId,
        metadata: { source: 'affiliate', rate },
      },
    });

    const commission = await tx.affiliateCommission.create({
      data: {
        affiliateId: click.affiliateId,
        orderId: input.orderId,
        orderItemId: item.orderItemId,
        sellerId: seller.id,
        productId: item.productId,
        productName: item.productName,
        buyerId: input.buyerId,
        clickId: click.id,
        source: click.productId ? 'product' : 'store',
        baseAmount,
        rate,
        amount,
        status: 'pending',
        funded: input.paidWithWallet, // contra entrega: se cobra a la tienda al entregar
        walletTxId: walletTx.id,
      },
    });

    total += amount;
    created.push({ ...commission, affiliateUserId: click.affiliate.userId });
  }

  return { total, commissions: created };
};

export const notifyNewCommissions = (commissions: { affiliateUserId: string; amount: number; productName: string }[]) => {
  for (const c of commissions) {
    const body = `Vendiste ${c.productName}. Tu comisión de ₲ ${c.amount.toLocaleString('es-PY')} queda pendiente hasta la entrega.`;
    prisma.notification
      .create({ data: { userId: c.affiliateUserId, title: '¡Nueva comisión!', message: body, type: 'success', actionUrl: '/app/afiliados' } })
      .catch(() => {});
    sendPushToUser(c.affiliateUserId, { title: '¡Nueva comisión!', body, url: '/app/afiliados', tag: 'affiliate-commission' }).catch(() => {});
  }
};

// ─── Entrega, liberación y cancelación ────────────────────────────────────────

const addDays = (date: Date, days: number) => new Date(date.getTime() + days * 24 * 60 * 60 * 1000);

/**
 * Contra entrega: descuenta la comisión de la billetera de la tienda. Si no alcanza el saldo, queda retenida
 * (se reintenta en cada corrida del proceso de liberación). Devuelve true si quedó cubierta.
 */
const fundFromSeller = async (tx: Prisma.TransactionClient, commission: { id: string; amount: number; orderId: string; productName: string }, sellerUserId: string) => {
  const charged = await tx.wallet.updateMany({
    where: { userId: sellerUserId, balance: { gte: commission.amount } },
    data: { balance: { decrement: commission.amount }, totalOut: { increment: commission.amount } },
  });
  if (charged.count === 0) {
    await tx.affiliateCommission.update({
      where: { id: commission.id },
      data: { note: 'Retenida: la tienda no tiene saldo suficiente para cubrir la comisión' },
    });
    return false;
  }
  const sellerWallet = await tx.wallet.findUnique({ where: { userId: sellerUserId } });
  await tx.transaction.create({
    data: {
      walletId: sellerWallet!.id,
      userId: sellerUserId,
      type: 'affiliate_commission',
      amount: -commission.amount,
      description: `Comisión de afiliado (contra entrega) - ${commission.productName}`,
      status: 'completed',
      relatedOrderId: commission.orderId,
      metadata: { source: 'affiliate', commissionId: commission.id },
    },
  });
  await tx.affiliateCommission.update({ where: { id: commission.id }, data: { funded: true, note: null } });
  return true;
};

/** Al marcar "Entregado": fija la fecha de liberación y, en contra entrega, cobra la comisión a la tienda. */
export const onOrderDelivered = async (tx: Prisma.TransactionClient, order: { id: string; sellerId: string }) => {
  const cfg = await getAffiliateConfig(tx);
  const commissions = await tx.affiliateCommission.findMany({ where: { orderId: order.id, status: 'pending' } });
  const availableAt = addDays(new Date(), cfg.holdDays);
  for (const c of commissions) {
    await tx.affiliateCommission.update({ where: { id: c.id }, data: { availableAt } });
    if (!c.funded) await fundFromSeller(tx, c, order.sellerId);
  }
};

/** Acredita una comisión en la billetera del afiliado. Idempotente: si ya se pagó, no hace nada. */
export const payCommission = async (commissionId: string) => {
  return prisma.$transaction(async (tx) => {
    const c = await tx.affiliateCommission.findUnique({ where: { id: commissionId }, include: { affiliate: true } });
    if (!c || !c.funded || (c.status !== 'pending' && c.status !== 'approved')) return null;

    // El cambio de estado condicionado es el candado: dos corridas simultáneas no acreditan dos veces
    const claimed = await tx.affiliateCommission.updateMany({
      where: { id: c.id, status: { in: ['pending', 'approved'] } },
      data: { status: 'paid', paidAt: new Date(), approvedAt: c.approvedAt ?? new Date() },
    });
    if (claimed.count === 0) return null;

    const wallet = await ensureWallet(c.affiliate.userId, tx);
    await tx.wallet.update({
      where: { id: wallet.id },
      data: { balance: { increment: c.amount }, totalIn: { increment: c.amount } },
    });
    if (c.walletTxId) {
      await tx.transaction.update({ where: { id: c.walletTxId }, data: { status: 'completed' } });
    } else {
      const t = await tx.transaction.create({
        data: {
          walletId: wallet.id,
          userId: c.affiliate.userId,
          type: 'affiliate_commission',
          amount: c.amount,
          description: `Comisión de afiliado - ${c.productName}`,
          status: 'completed',
          relatedOrderId: c.orderId,
        },
      });
      await tx.affiliateCommission.update({ where: { id: c.id }, data: { walletTxId: t.id } });
    }
    return { ...c, affiliateUserId: c.affiliate.userId };
  });
};

const notifyPaid = (paid: { affiliateUserId: string; amount: number; productName: string }) => {
  const body = `Se acreditaron ₲ ${paid.amount.toLocaleString('es-PY')} por la venta de ${paid.productName}. Ya podés retirarlos.`;
  prisma.notification
    .create({ data: { userId: paid.affiliateUserId, title: 'Comisión disponible', message: body, type: 'success', actionUrl: '/app/afiliados' } })
    .catch(() => {});
  sendPushToUser(paid.affiliateUserId, { title: 'Comisión disponible', body, url: '/app/afiliados', tag: 'affiliate-paid' }).catch(() => {});
};

/**
 * Proceso periódico: reintenta cobrar comisiones contra entrega retenidas y libera las vencidas.
 * Seguro de correr dos veces a la vez: payCommission es idempotente.
 */
export const releaseDueCommissions = async () => {
  const cfg = await getAffiliateConfig();
  const now = new Date();

  // 1. Contra entrega retenidas por falta de saldo de la tienda
  const unfunded = await prisma.affiliateCommission.findMany({
    where: { status: 'pending', funded: false, availableAt: { not: null } },
    include: { order: { select: { sellerId: true } } },
    take: 200,
  });
  for (const c of unfunded) {
    await prisma.$transaction((tx) => fundFromSeller(tx, c, c.order.sellerId)).catch((e) => console.error('[afiliados] cobro retenido', c.id, e));
  }

  // 2. Vencidas: pasan a aprobadas y, si la liberación automática está activa, se acreditan
  const due = await prisma.affiliateCommission.findMany({
    where: { status: 'pending', funded: true, availableAt: { lte: now }, affiliate: { status: 'active' } },
    select: { id: true },
    take: 500,
  });
  let paidCount = 0;
  for (const { id } of due) {
    if (cfg.autoRelease) {
      const paid = await payCommission(id).catch((e) => { console.error('[afiliados] pago', id, e); return null; });
      if (paid) { paidCount++; notifyPaid(paid); }
    } else {
      await prisma.affiliateCommission.updateMany({ where: { id, status: 'pending' }, data: { status: 'approved', approvedAt: now } });
    }
  }
  return { checkedUnfunded: unfunded.length, due: due.length, paid: paidCount };
};

/** Aprobación manual del admin: acredita ya (sin esperar el plazo) si el pedido fue entregado y está cubierta. */
export const approveCommissions = async (ids: string[]) => {
  const results: { id: string; ok: boolean; reason?: string }[] = [];
  for (const id of ids) {
    const c = await prisma.affiliateCommission.findUnique({ where: { id }, include: { order: { select: { status: true } } } });
    if (!c) { results.push({ id, ok: false, reason: 'No existe' }); continue; }
    if (c.status === 'paid') { results.push({ id, ok: true, reason: 'Ya estaba pagada' }); continue; }
    if (c.status !== 'pending' && c.status !== 'approved') { results.push({ id, ok: false, reason: `Estado ${c.status}` }); continue; }
    if (c.order.status !== 'delivered') { results.push({ id, ok: false, reason: 'El pedido todavía no se entregó' }); continue; }
    if (!c.funded) { results.push({ id, ok: false, reason: 'Retenida: la tienda no cubrió la comisión' }); continue; }
    const paid = await payCommission(id);
    if (paid) notifyPaid(paid);
    results.push({ id, ok: !!paid });
  }
  return results;
};

/**
 * Anula o revierte las comisiones de un pedido cancelado. Corre dentro de la transacción de cancelación.
 * - pendiente/aprobada: se anula y el movimiento pendiente del afiliado queda fallido.
 * - pagada: se registra una reversión que descuenta la comisión de la billetera del afiliado.
 * En contra entrega, lo que se le cobró a la tienda se le devuelve.
 */
export const cancelCommissionsForOrder = async (
  tx: Prisma.TransactionClient,
  order: { id: string; orderNumber: string; sellerId: string; paymentMethod: string },
  reason: string,
) => {
  const commissions = await tx.affiliateCommission.findMany({
    where: { orderId: order.id, status: { in: ['pending', 'approved', 'paid'] } },
    include: { affiliate: true },
  });
  for (const c of commissions) {
    await cancelOneCommission(tx, c, order, reason);
  }
  return commissions.length;
};

const cancelOneCommission = async (
  tx: Prisma.TransactionClient,
  c: { id: string; status: string; amount: number; funded: boolean; walletTxId: string | null; productName: string; orderId: string; affiliate: { userId: string } },
  order: { orderNumber: string; sellerId: string; paymentMethod: string },
  reason: string,
) => {
  const now = new Date();
  const wasPaid = c.status === 'paid';
  const moved = await tx.affiliateCommission.updateMany({
    where: { id: c.id, status: c.status as any },
    data: { status: wasPaid ? 'reversed' : 'cancelled', cancelledAt: now, note: reason },
  });
  if (moved.count === 0) return;

  if (wasPaid) {
    const wallet = await ensureWallet(c.affiliate.userId, tx);
    await tx.wallet.update({
      where: { id: wallet.id },
      data: { balance: { decrement: c.amount }, totalOut: { increment: c.amount } },
    });
    await tx.transaction.create({
      data: {
        walletId: wallet.id,
        userId: c.affiliate.userId,
        type: 'affiliate_reversal',
        amount: -c.amount,
        description: `Reversión de comisión - ${c.productName} - ${order.orderNumber}`,
        status: 'completed',
        relatedOrderId: c.orderId,
        metadata: { commissionId: c.id, reason },
      },
    });
  } else if (c.walletTxId) {
    await tx.transaction.updateMany({ where: { id: c.walletTxId, status: 'pending' }, data: { status: 'failed' } });
  }

  // Contra entrega ya cobrada a la tienda: se le devuelve
  if (c.funded && order.paymentMethod !== 'wallet') {
    const sellerWallet = await ensureWallet(order.sellerId, tx);
    await tx.wallet.update({
      where: { id: sellerWallet.id },
      data: { balance: { increment: c.amount }, totalIn: { increment: c.amount } },
    });
    await tx.transaction.create({
      data: {
        walletId: sellerWallet.id,
        userId: order.sellerId,
        type: 'affiliate_reversal',
        amount: c.amount,
        description: `Devolución de comisión de afiliado - ${c.productName} - ${order.orderNumber}`,
        status: 'completed',
        relatedOrderId: c.orderId,
        metadata: { commissionId: c.id },
      },
    });
  }
};

/** Cancelación manual del admin (una o varias). */
export const adminCancelCommissions = async (ids: string[], reason: string) => {
  const results: { id: string; ok: boolean; reason?: string }[] = [];
  for (const id of ids) {
    try {
      const ok = await prisma.$transaction(async (tx) => {
        const c = await tx.affiliateCommission.findUnique({
          where: { id },
          include: { affiliate: true, order: { select: { orderNumber: true, sellerId: true, paymentMethod: true } } },
        });
        if (!c || !['pending', 'approved', 'paid'].includes(c.status)) return false;
        await cancelOneCommission(tx, c, c.order, reason);
        // La comisión deja de descontarse a la tienda en pedidos con billetera: se le devuelve
        if (c.order.paymentMethod === 'wallet') {
          const sellerWallet = await ensureWallet(c.order.sellerId, tx);
          await tx.wallet.update({
            where: { id: sellerWallet.id },
            data: { balance: { increment: c.amount }, totalIn: { increment: c.amount } },
          });
          await tx.transaction.create({
            data: {
              walletId: sellerWallet.id,
              userId: c.order.sellerId,
              type: 'affiliate_reversal',
              amount: c.amount,
              description: `Comisión de afiliado anulada - ${c.productName} - ${c.order.orderNumber}`,
              status: 'completed',
              relatedOrderId: c.orderId,
              metadata: { commissionId: c.id },
            },
          });
          await tx.order.update({
            where: { id: c.orderId },
            data: { affiliateAmount: { decrement: c.amount }, sellerEarnings: { increment: c.amount } },
          });
        }
        return true;
      });
      results.push({ id, ok });
    } catch (e: any) {
      results.push({ id, ok: false, reason: e.message });
    }
  }
  return results;
};

// ─── Proceso periódico ────────────────────────────────────────────────────────

let releaseTimer: NodeJS.Timeout | null = null;
let releaseRunning = false;

export const startAffiliateScheduler = (intervalMs = 15 * 60 * 1000) => {
  if (releaseTimer) return;
  const run = async () => {
    if (releaseRunning) return; // no solapar corridas en el mismo proceso
    releaseRunning = true;
    try {
      const r = await releaseDueCommissions();
      if (r.paid || r.due) console.log(`[afiliados] liberación: ${r.paid} pagadas de ${r.due} vencidas`);
    } catch (e) {
      console.error('[afiliados] error en la liberación de comisiones', e);
    } finally {
      releaseRunning = false;
    }
  };
  setTimeout(run, 30_000);
  releaseTimer = setInterval(run, intervalMs);
};
