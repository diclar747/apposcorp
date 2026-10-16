import { prisma } from '../utils/prisma.js';
import { sendPushToUser } from './pushService.js';

// ─── Reglas de las ofertas (categoría "Ofertas") ──────────────────────────────

export const OFFER_CATEGORY = 'Ofertas';
const MIN_DISCOUNT = 5; // % mínimo: una "oferta" de 1% engaña
const MAX_DISCOUNT = 90; // % máximo: por encima casi siempre es un precio de referencia inflado
const MIN_DURATION_MS = 60 * 60 * 1000;
const MAX_DURATION_MS = 60 * 24 * 60 * 60 * 1000;

export class OfferError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export const isOfferCategory = (category: unknown) => category === OFFER_CATEGORY;

/** Valida precio anterior y vencimiento al publicar una oferta. */
export const parseOfferInput = (input: { price: number; comparePrice: unknown; offerEndsAt: unknown }) => {
  const price = Number(input.price);
  const compare = Math.round(Number(input.comparePrice));
  if (!Number.isFinite(price) || price <= 0) throw new OfferError(400, 'Indicá el precio de oferta');
  if (!Number.isFinite(compare) || compare <= price) throw new OfferError(400, 'El precio anterior debe ser mayor que el precio de oferta');
  const discount = ((compare - price) / compare) * 100;
  if (discount < MIN_DISCOUNT) throw new OfferError(400, `El descuento debe ser de al menos ${MIN_DISCOUNT}%`);
  if (discount > MAX_DISCOUNT) throw new OfferError(400, `Un descuento de más de ${MAX_DISCOUNT}% parece un precio anterior inflado. Revisá el precio anterior.`);
  const ends = new Date(String(input.offerEndsAt ?? ''));
  if (Number.isNaN(ends.getTime())) throw new OfferError(400, 'Indicá cuándo vence la oferta');
  const duration = ends.getTime() - Date.now();
  if (duration < MIN_DURATION_MS) throw new OfferError(400, 'La oferta debe durar al menos 1 hora');
  if (duration > MAX_DURATION_MS) throw new OfferError(400, 'La oferta puede durar como máximo 60 días');
  return { comparePrice: compare, offerEndsAt: ends, offerAlertSent: false };
};

interface OfferFields {
  category: string;
  price: number;
  comparePrice?: number | null;
  offerEndsAt?: Date | string | null;
  offerBlocked?: boolean;
}

/** La oferta está vigente si es de la categoría, no venció, no está bloqueada y tiene un descuento real. */
export const isOfferActive = (p: OfferFields) =>
  isOfferCategory(p.category) &&
  !p.offerBlocked &&
  !!p.offerEndsAt &&
  new Date(p.offerEndsAt).getTime() > Date.now() &&
  !!p.comparePrice &&
  p.comparePrice > p.price;

/**
 * Lo que ve el público: el precio anterior solo aparece mientras la oferta está vigente y verificada.
 * Vencida o bloqueada, no se muestra un descuento que ya no existe.
 */
export const decorateOffer = <T extends OfferFields>(p: T): T & { offer: { active: boolean; expired: boolean; endsAt: Date | string | null; discountPercent: number } | null } => {
  if (!isOfferCategory(p.category)) return { ...p, offer: null };
  const active = isOfferActive(p);
  const expired = !!p.offerEndsAt && new Date(p.offerEndsAt).getTime() <= Date.now();
  return {
    ...p,
    comparePrice: active ? p.comparePrice : null,
    offer: {
      active,
      expired,
      endsAt: p.offerEndsAt ?? null,
      discountPercent: active && p.comparePrice ? Math.round(((p.comparePrice - p.price) / p.comparePrice) * 100) : 0,
    },
  };
};

/** Una oferta vencida no se puede comprar hasta que la tienda la renueve. */
export const offerExpired = (p: { category: string; offerEndsAt?: Date | null }) =>
  isOfferCategory(p.category) && !!p.offerEndsAt && p.offerEndsAt.getTime() <= Date.now();

// ─── Alertas a quienes guardaron el producto en favoritos ─────────────────────

const alert = (userId: string, title: string, body: string, slug: string | null, id: string) =>
  // sendPushToUser también guarda el aviso dentro de la app
  sendPushToUser(userId, { title, body, url: `/producto/${slug || id}`, tag: `fav-${id}` }).catch(() => {});

export const notifyFavoritesPriceDrop = async (productId: string, name: string, slug: string | null, oldPrice: number, newPrice: number) => {
  const favs = await prisma.productFavorite.findMany({ where: { productId }, select: { userId: true }, take: 1000 });
  for (const f of favs) {
    alert(f.userId, 'Bajó el precio de un favorito', `"${name}" pasó de Gs. ${oldPrice.toLocaleString('es-PY')} a Gs. ${newPrice.toLocaleString('es-PY')}.`, slug, productId);
  }
};

/** Avisa una sola vez, cuando faltan menos de 24 h, que una oferta favorita está por vencer. */
export const sendEndingSoonAlerts = async () => {
  const now = new Date();
  const soon = new Date(now.getTime() + 24 * 3600_000);
  const offers = await prisma.product.findMany({
    where: { category: OFFER_CATEGORY, status: 'active', offerBlocked: false, offerAlertSent: false, offerEndsAt: { gt: now, lte: soon } },
    select: { id: true, name: true, slug: true, offerEndsAt: true },
    take: 200,
  });
  for (const o of offers) {
    const claimed = await prisma.product.updateMany({ where: { id: o.id, offerAlertSent: false }, data: { offerAlertSent: true } });
    if (claimed.count === 0) continue;
    const favs = await prisma.productFavorite.findMany({ where: { productId: o.id }, select: { userId: true }, take: 1000 });
    const when = o.offerEndsAt!.toLocaleString('es-PY', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    for (const f of favs) alert(f.userId, 'Una oferta tuya está por terminar', `"${o.name}" vence el ${when}.`, o.slug, o.id);
  }
  return offers.length;
};

let timer: NodeJS.Timeout | null = null;
export const startOfferScheduler = (intervalMs = 15 * 60 * 1000) => {
  if (timer) return;
  const run = () => sendEndingSoonAlerts().catch((e) => console.error('[ofertas] alertas', e));
  setTimeout(run, 45_000);
  timer = setInterval(run, intervalMs);
};
