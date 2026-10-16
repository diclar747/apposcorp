import { prisma } from '../utils/prisma.js';
import { sendPushToUser } from './pushService.js';

// ─── Reglas del remate ────────────────────────────────────────────────────────

export const AUCTION_CATEGORY = 'Remates';
const MIN_DURATION_MS = 10 * 60 * 1000; // un remate dura al menos 10 minutos
const MAX_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // y como máximo 30 días
const SNIPE_WINDOW_MS = 2 * 60 * 1000; // una oferta en los últimos 2 minutos...
const SNIPE_EXTENSION_MS = 2 * 60 * 1000; // ...alarga el remate 2 minutos (evita ofertas "de último segundo")
const PAY_WINDOW_MS = 48 * 60 * 60 * 1000; // el ganador tiene 48 h para pagar
const MIN_BID_GAP_MS = 2000; // mismo usuario: una oferta cada 2 segundos
const MAX_JUMP_FACTOR = 10; // una oferta no puede superar 10 veces el precio actual (errores de tipeo)
const MAX_UNPAID_STRIKES = 2; // quien deja 2 remates ganados sin pagar ya no puede ofertar
const DEFAULT_MIN_INCREMENT = 10000;

export class AuctionError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export const isAuctionCategory = (category: unknown) => category === AUCTION_CATEGORY;

export interface AuctionInput {
  price: number;
  endsAt: unknown;
  minIncrement: unknown;
}

/** Valida los datos del remate al publicarlo o convertir un producto en remate. */
export const parseAuctionInput = (input: AuctionInput) => {
  const startPrice = Math.round(Number(input.price));
  if (!Number.isFinite(startPrice) || startPrice <= 0) throw new AuctionError(400, 'El precio inicial del remate debe ser mayor a 0');
  const endsAt = new Date(String(input.endsAt ?? ''));
  if (Number.isNaN(endsAt.getTime())) throw new AuctionError(400, 'Indicá cuándo termina el remate');
  const duration = endsAt.getTime() - Date.now();
  if (duration < MIN_DURATION_MS) throw new AuctionError(400, 'El remate debe durar al menos 10 minutos');
  if (duration > MAX_DURATION_MS) throw new AuctionError(400, 'El remate puede durar como máximo 30 días');
  const inc = input.minIncrement === undefined || input.minIncrement === null || input.minIncrement === ''
    ? DEFAULT_MIN_INCREMENT
    : Math.round(Number(input.minIncrement));
  if (!Number.isFinite(inc) || inc < 1000) throw new AuctionError(400, 'El incremento mínimo debe ser de al menos Gs. 1.000');
  return {
    price: startPrice,
    stock: 1, // un remate es una sola unidad
    auctionStatus: 'open' as const,
    auctionEndsAt: endsAt,
    auctionStartPrice: startPrice,
    auctionMinIncrement: inc,
    auctionWinnerId: null,
    auctionPayBy: null,
  };
};

/** "Ana M." — nunca se muestran nombres completos en el historial público de ofertas. */
const maskName = (u?: { firstName: string; lastName: string } | null) =>
  u ? `${(u.firstName || 'Usuario').split(' ')[0]} ${(u.lastName || '').charAt(0)}.`.trim() : 'Usuario';

const notify = (userId: string, title: string, message: string, slug: string | null, id: string) => {
  const url = `/producto/${slug || id}`;
  // sendPushToUser también guarda el aviso dentro de la app
  sendPushToUser(userId, { title, body: message, url, tag: `auction-${id}` }).catch(() => {});
};

// ─── Ofertar ──────────────────────────────────────────────────────────────────

export const placeBid = async (productId: string, userId: string, rawAmount: unknown) => {
  const amount = Math.round(Number(rawAmount));
  if (!Number.isFinite(amount) || amount <= 0) throw new AuctionError(400, 'Monto de oferta inválido');

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { isActive: true } });
  if (!user?.isActive) throw new AuctionError(403, 'Tu cuenta no puede ofertar');

  const strikes = await prisma.product.count({ where: { auctionWinnerId: userId, auctionStatus: 'unpaid' } });
  if (strikes >= MAX_UNPAID_STRIKES) {
    throw new AuctionError(403, 'No podés ofertar: ganaste remates anteriores y no los pagaste');
  }

  let outbid: { userId: string } | null = null;
  const result = await prisma.$transaction(async (tx) => {
    const p = await tx.product.findUnique({ where: { id: productId }, include: { seller: { select: { userId: true } } } });
    if (!p || p.auctionStatus === null || p.category !== AUCTION_CATEGORY) throw new AuctionError(404, 'Remate no encontrado');
    const now = new Date();
    if (p.status !== 'active' || p.auctionStatus !== 'open' || !p.auctionEndsAt || p.auctionEndsAt <= now) {
      throw new AuctionError(400, 'Este remate ya terminó');
    }
    if (p.seller.userId === userId) throw new AuctionError(400, 'No podés ofertar en tu propio remate');

    const top = await tx.auctionBid.findFirst({ where: { productId }, orderBy: { amount: 'desc' } });
    if (top?.userId === userId) throw new AuctionError(400, 'Ya tenés la oferta más alta');

    const last = await tx.auctionBid.findFirst({ where: { userId }, orderBy: { createdAt: 'desc' } });
    if (last && now.getTime() - last.createdAt.getTime() < MIN_BID_GAP_MS) {
      throw new AuctionError(429, 'Esperá un momento antes de volver a ofertar');
    }

    const increment = p.auctionMinIncrement ?? DEFAULT_MIN_INCREMENT;
    const minNext = top ? top.amount + increment : (p.auctionStartPrice ?? p.price);
    if (amount < minNext) throw new AuctionError(400, `La oferta mínima es Gs. ${minNext.toLocaleString('es-PY')}`);
    if (amount > Math.max(p.price, p.auctionStartPrice ?? 0) * MAX_JUMP_FACTOR) {
      throw new AuctionError(400, 'La oferta es demasiado alta respecto al precio actual. Revisá el monto.');
    }

    const inSnipeWindow = p.auctionEndsAt.getTime() - now.getTime() <= SNIPE_WINDOW_MS;
    const newEnd = inSnipeWindow ? new Date(p.auctionEndsAt.getTime() + SNIPE_EXTENSION_MS) : p.auctionEndsAt;

    // Candado optimista: si otra oferta entró primero, el precio ya no coincide y esta no se aplica
    const claimed = await tx.product.updateMany({
      where: { id: productId, auctionStatus: 'open', price: p.price, auctionEndsAt: { gt: now } },
      data: { price: amount, auctionEndsAt: newEnd },
    });
    if (claimed.count === 0) throw new AuctionError(409, 'Otra oferta se adelantó. Mirá el nuevo precio y ofertá de nuevo.');

    const bid = await tx.auctionBid.create({ data: { productId, userId, amount } });
    outbid = top ? { userId: top.userId } : null;
    return { bid, endsAt: newEnd, extended: inSnipeWindow, product: p };
  });

  if (outbid) {
    notify(
      (outbid as { userId: string }).userId,
      'Te superaron en un remate',
      `Alguien ofertó Gs. ${amount.toLocaleString('es-PY')} por "${result.product.name}". Todavía podés ofertar.`,
      result.product.slug,
      result.product.id,
    );
  }
  return result;
};

// ─── Cierre de remates ────────────────────────────────────────────────────────

/** Cierra los remates vencidos: con ofertas → hay ganador con plazo para pagar; sin ofertas → sin vender. */
export const closeDueAuctions = async (onlyProductId?: string) => {
  const now = new Date();
  const due = await prisma.product.findMany({
    where: { auctionStatus: 'open', auctionEndsAt: { lte: now }, ...(onlyProductId ? { id: onlyProductId } : {}) },
    include: { seller: { select: { userId: true } } },
    take: 200,
  });
  for (const p of due) {
    const top = await prisma.auctionBid.findFirst({ where: { productId: p.id }, orderBy: { amount: 'desc' } });
    if (!top) {
      await prisma.product.updateMany({ where: { id: p.id, auctionStatus: 'open' }, data: { auctionStatus: 'unsold' } });
      notify(p.seller.userId, 'Tu remate terminó sin ofertas', `"${p.name}" no recibió ofertas. Podés publicarlo de nuevo.`, p.slug, p.id);
      continue;
    }
    const claimed = await prisma.product.updateMany({
      where: { id: p.id, auctionStatus: 'open' },
      data: { auctionStatus: 'ended', auctionWinnerId: top.userId, auctionPayBy: new Date(now.getTime() + PAY_WINDOW_MS), price: top.amount },
    });
    if (claimed.count === 0) continue; // otro proceso ya lo cerró
    notify(top.userId, '¡Ganaste el remate!', `Ganaste "${p.name}" por Gs. ${top.amount.toLocaleString('es-PY')}. Tenés 48 horas para pagarlo.`, p.slug, p.id);
    notify(p.seller.userId, 'Tu remate terminó', `"${p.name}" se remató en Gs. ${top.amount.toLocaleString('es-PY')}. El ganador tiene 48 horas para pagar.`, p.slug, p.id);
  }

  // Ganadores que no pagaron a tiempo
  const expired = await prisma.product.findMany({
    where: { auctionStatus: 'ended', auctionPayBy: { lte: now }, ...(onlyProductId ? { id: onlyProductId } : {}) },
    include: { seller: { select: { userId: true } } },
    take: 200,
  });
  for (const p of expired) {
    const claimed = await prisma.product.updateMany({ where: { id: p.id, auctionStatus: 'ended' }, data: { auctionStatus: 'unpaid' } });
    if (claimed.count === 0) continue;
    notify(p.seller.userId, 'El ganador no pagó', `El ganador de "${p.name}" no pagó a tiempo. Podés publicar el remate de nuevo.`, p.slug, p.id);
    if (p.auctionWinnerId) notify(p.auctionWinnerId, 'Se venció el plazo de pago', `Venció el plazo para pagar "${p.name}". Dos remates sin pagar bloquean tu cuenta para ofertar.`, p.slug, p.id);
  }
  return { closed: due.length, expired: expired.length };
};

let timer: NodeJS.Timeout | null = null;
let running = false;
export const startAuctionScheduler = (intervalMs = 30 * 1000) => {
  if (timer) return;
  const run = async () => {
    if (running) return;
    running = true;
    try {
      await closeDueAuctions();
    } catch (e) {
      console.error('[remates] error al cerrar remates', e);
    } finally {
      running = false;
    }
  };
  setTimeout(run, 15_000);
  timer = setInterval(run, intervalMs);
};

// ─── Lo que ve el público ─────────────────────────────────────────────────────

export interface AuctionProductFields {
  id: string;
  price: number;
  auctionStatus: string | null;
  auctionEndsAt: Date | null;
  auctionStartPrice: number | null;
  auctionMinIncrement: number | null;
  auctionWinnerId: string | null;
  auctionPayBy: Date | null;
}

/** Estado público del remate. Quién gana se muestra solo a esa persona; el resto ve nombres abreviados. */
export const getAuctionView = async (p: AuctionProductFields, viewerId?: string | null) => {
  if (p.auctionStatus === null) return null;
  const bids = await prisma.auctionBid.findMany({
    where: { productId: p.id },
    orderBy: { amount: 'desc' },
    take: 15,
  });
  const total = await prisma.auctionBid.count({ where: { productId: p.id } });
  const users = await prisma.user.findMany({
    where: { id: { in: [...new Set(bids.map((b) => b.userId))] } },
    select: { id: true, firstName: true, lastName: true },
  });
  const increment = p.auctionMinIncrement ?? DEFAULT_MIN_INCREMENT;
  const top = bids[0];
  const myBest = viewerId ? bids.find((b) => b.userId === viewerId) : undefined;
  return {
    status: p.auctionStatus,
    endsAt: p.auctionEndsAt,
    startPrice: p.auctionStartPrice ?? p.price,
    currentPrice: p.price,
    minIncrement: increment,
    minNextBid: top ? top.amount + increment : (p.auctionStartPrice ?? p.price),
    bidCount: total,
    bids: bids.map((b) => ({
      id: b.id,
      amount: b.amount,
      at: b.createdAt,
      name: maskName(users.find((u) => u.id === b.userId)),
      mine: b.userId === viewerId,
    })),
    iAmWinning: !!viewerId && p.auctionStatus === 'open' && top?.userId === viewerId,
    iWasOutbid: !!viewerId && p.auctionStatus === 'open' && !!myBest && top?.userId !== viewerId,
    iWon: !!viewerId && p.auctionWinnerId === viewerId && (p.auctionStatus === 'ended' || p.auctionStatus === 'sold'),
    canPay: !!viewerId && p.auctionWinnerId === viewerId && p.auctionStatus === 'ended',
    payBy: p.auctionWinnerId === viewerId ? p.auctionPayBy : null,
  };
};

/** Saca de la respuesta pública el id del ganador (se informa solo a esa persona dentro de `auction`). */
export const stripAuctionPrivate = <T extends Record<string, any>>(p: T, isOwner: boolean): T => {
  if (isOwner) return p;
  const { auctionWinnerId: _w, auctionPayBy: _p, ...rest } = p;
  return rest as T;
};
