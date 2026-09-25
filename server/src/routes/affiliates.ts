import { Router, Response } from 'express';
import { prisma } from '../utils/prisma.js';
import { authenticate, authorize, AuthRequest, getOptionalUser } from '../middleware/auth.js';
import {
  AFFILIATE_SETTINGS,
  getAffiliateConfig,
  getEffectiveRate,
  storeParticipates,
  joinAffiliateProgram,
  trackClick,
  claimVisitorClicks,
  approveCommissions,
  adminCancelCommissions,
  releaseDueCommissions,
  parseRateInput,
} from '../services/affiliateService.js';

const router = Router();

const DAY_MS = 24 * 60 * 60 * 1000;
const COMMISSION_STATUSES = ['pending', 'approved', 'paid', 'cancelled', 'reversed'] as const;

const serverError = (res: Response, error: unknown, label: string) => {
  console.error(`[afiliados] ${label}:`, error);
  res.status(500).json({ error: 'Error del servidor' });
};

const productPath = (p: { slug: string | null; id: string }) => `/producto/${p.slug || p.id}`;
const storePath = (s: { storeSlug: string }) => `/tienda/${s.storeSlug}`;

type StatusTotals = Record<(typeof COMMISSION_STATUSES)[number], { amount: number; count: number }> & { generated: number };

const sumByStatus = (rows: { status: string; _sum: { amount: number | null }; _count: { _all: number } }[]): StatusTotals => {
  const totals = {} as StatusTotals;
  for (const st of COMMISSION_STATUSES) totals[st] = { amount: 0, count: 0 };
  for (const r of rows) totals[r.status as (typeof COMMISSION_STATUSES)[number]] = { amount: r._sum.amount || 0, count: r._count._all };
  // Generado = todo lo que no se anuló (pendiente + aprobado + pagado)
  totals.generated = totals.pending.amount + totals.approved.amount + totals.paid.amount;
  return totals;
};

/** Participación de productos: filtro en la base (lo grueso) + cálculo del % efectivo en JS. */
const participatingProductWhere = {
  status: 'active',
  visibility: { not: 'local' as const },
  affiliateBlocked: false,
  seller: { affiliateEnabled: true, affiliateBlocked: false, user: { isActive: true } },
  OR: [{ affiliateEnabled: true }, { affiliateEnabled: null, seller: { affiliateAllProducts: true } }],
};

// ═══ Público ══════════════════════════════════════════════════════════════════

// Estado del programa (para mostrar u ocultar botones)
router.get('/program', async (_req, res) => {
  try {
    const cfg = await getAffiliateConfig();
    res.json({
      enabled: cfg.enabled,
      minRate: cfg.minRate,
      maxRate: cfg.maxRate,
      cookieDays: cfg.cookieDays,
      holdDays: cfg.holdDays,
      showRatePublic: cfg.showRatePublic,
      codEnabled: cfg.codEnabled,
    });
  } catch (error) {
    serverError(res, error, 'program');
  }
});

// Registrar la visita de un enlace ?ref=CODIGO
router.post('/track', async (req, res) => {
  try {
    const { code, visitorId, productSlug, storeSlug } = req.body || {};
    const viewer = await getOptionalUser(req);
    const click = await trackClick({
      code: String(code || ''),
      visitorId: String(visitorId || ''),
      productSlug: productSlug ? String(productSlug) : undefined,
      storeSlug: storeSlug ? String(storeSlug) : undefined,
      userId: viewer?.userId ?? null,
      ip: req.ip,
    });
    res.json({ tracked: !!click });
  } catch (error) {
    serverError(res, error, 'track');
  }
});

// ═══ Afiliado (usuario logueado) ══════════════════════════════════════════════

// Mi perfil de afiliado (null si todavía no se unió) y resumen de ganancias
router.get('/me', authenticate, async (req: AuthRequest, res) => {
  try {
    const profile = await prisma.affiliateProfile.findUnique({ where: { userId: req.user!.userId } });
    if (!profile) return res.json({ profile: null });
    const grouped = await prisma.affiliateCommission.groupBy({
      by: ['status'],
      where: { affiliateId: profile.id },
      _sum: { amount: true },
      _count: { _all: true },
    });
    const wallet = await prisma.wallet.findUnique({ where: { userId: req.user!.userId }, select: { balance: true } });
    res.json({ profile, earnings: sumByStatus(grouped as any), walletBalance: wallet?.balance ?? 0 });
  } catch (error) {
    serverError(res, error, 'me');
  }
});

// Unirse al programa (acepta los términos)
router.post('/join', authenticate, async (req: AuthRequest, res) => {
  try {
    if (req.body?.acceptTerms !== true) {
      return res.status(400).json({ error: 'Debes aceptar los términos del programa de afiliados' });
    }
    const profile = await joinAffiliateProgram(req.user!.userId);
    if (typeof req.body.visitorId === 'string') await claimVisitorClicks(req.body.visitorId, req.user!.userId);
    res.status(201).json({ profile });
  } catch (error: any) {
    if (error.message === 'PROGRAM_DISABLED') return res.status(403).json({ error: 'El programa de afiliados no está activo' });
    serverError(res, error, 'join');
  }
});

// Asociar al usuario los clics hechos antes de iniciar sesión
router.post('/claim-visitor', authenticate, async (req: AuthRequest, res) => {
  try {
    if (typeof req.body?.visitorId === 'string') await claimVisitorClicks(req.body.visitorId, req.user!.userId);
    res.json({ ok: true });
  } catch (error) {
    serverError(res, error, 'claim-visitor');
  }
});

const requireAffiliate = async (req: AuthRequest, res: Response) => {
  const profile = await prisma.affiliateProfile.findUnique({ where: { userId: req.user!.userId } });
  if (!profile) {
    res.status(404).json({ error: 'Todavía no sos afiliado' });
    return null;
  }
  return profile;
};

// Obtener (o crear) el enlace de un producto o de una tienda
router.post('/links', authenticate, async (req: AuthRequest, res) => {
  try {
    const profile = await requireAffiliate(req, res);
    if (!profile) return;
    if (profile.status !== 'active') {
      return res.status(403).json({ error: profile.status === 'pending' ? 'Tu cuenta de afiliado está pendiente de aprobación' : 'Tu cuenta de afiliado está suspendida' });
    }
    const cfg = await getAffiliateConfig();
    if (!cfg.enabled) return res.status(403).json({ error: 'El programa de afiliados no está activo' });

    const { productId, storeSlug, sellerId } = req.body || {};
    let seller;
    let product = null;

    if (productId) {
      product = await prisma.product.findFirst({
        where: { OR: [{ id: String(productId) }, { slug: String(productId) }] },
        include: { seller: true },
      });
      if (!product) return res.status(404).json({ error: 'Producto no encontrado' });
      if (getEffectiveRate(product.seller, product, cfg) === null) {
        return res.status(400).json({ error: 'Este producto no participa del programa de afiliados' });
      }
      seller = product.seller;
    } else {
      seller = await prisma.sellerProfile.findFirst({
        where: storeSlug ? { storeSlug: String(storeSlug) } : { id: String(sellerId || '') },
      });
      if (!seller) return res.status(404).json({ error: 'Tienda no encontrada' });
      if (!storeParticipates(seller, cfg)) return res.status(400).json({ error: 'Esta tienda no participa del programa de afiliados' });
    }
    if (seller.userId === req.user!.userId) {
      return res.status(400).json({ error: 'No podés promocionar tu propia tienda como afiliado' });
    }

    const existing = await prisma.affiliateLink.findFirst({
      where: { affiliateId: profile.id, sellerId: seller.id, productId: product?.id ?? null },
    });
    const link = existing ?? await prisma.affiliateLink.create({
      data: { affiliateId: profile.id, sellerId: seller.id, productId: product?.id ?? null },
    });

    const path = product ? productPath(product) : storePath(seller);
    res.json({ link, path: `${path}?ref=${profile.code}`, code: profile.code });
  } catch (error) {
    serverError(res, error, 'links');
  }
});

// Mis promociones: cada enlace con sus clics y ventas
router.get('/links', authenticate, async (req: AuthRequest, res) => {
  try {
    const profile = await requireAffiliate(req, res);
    if (!profile) return;
    const cfg = await getAffiliateConfig();

    const links = await prisma.affiliateLink.findMany({ where: { affiliateId: profile.id }, orderBy: { createdAt: 'desc' } });
    const sellerIds = [...new Set(links.map((l) => l.sellerId))];
    const productIds = links.map((l) => l.productId).filter((x): x is string => !!x);

    const [sellers, products, clicks, commissions] = await Promise.all([
      prisma.sellerProfile.findMany({ where: { id: { in: sellerIds } } }),
      prisma.product.findMany({ where: { id: { in: productIds } } }),
      prisma.affiliateClick.groupBy({ by: ['sellerId', 'productId'], where: { affiliateId: profile.id }, _count: { _all: true } }),
      prisma.affiliateCommission.findMany({
        where: { affiliateId: profile.id },
        select: { sellerId: true, productId: true, source: true, amount: true, status: true, orderId: true, clickId: true },
      }),
    ]);
    const clickRows = await prisma.affiliateClick.findMany({
      where: { id: { in: commissions.map((c) => c.clickId).filter((x): x is string => !!x) } },
      select: { id: true, productId: true },
    });
    const clickProduct = new Map(clickRows.map((c) => [c.id, c.productId]));

    const result = links.map((l) => {
      const seller = sellers.find((s) => s.id === l.sellerId);
      const product = l.productId ? products.find((p) => p.id === l.productId) : null;
      const linkClicks = clicks.find((c) => c.sellerId === l.sellerId && c.productId === l.productId)?._count._all || 0;
      // Ventas atribuidas a este enlace: comisiones cuyo clic fue de este mismo producto / tienda
      const sales = commissions.filter((c) => c.sellerId === l.sellerId && c.clickId && clickProduct.get(c.clickId) === l.productId);
      const valid = sales.filter((c) => c.status !== 'cancelled' && c.status !== 'reversed');
      const rate = product && seller ? getEffectiveRate(seller, product, cfg) : null;
      return {
        id: l.id,
        type: l.productId ? 'product' : 'store',
        createdAt: l.createdAt,
        name: product ? product.name : seller?.storeName,
        image: product ? product.images[0] || null : seller?.logo || null,
        storeName: seller?.storeName,
        path: `${product ? productPath(product) : seller ? storePath(seller) : '/'}?ref=${profile.code}`,
        active: product ? rate !== null : !!seller && storeParticipates(seller, cfg),
        rate,
        clicks: linkClicks,
        sales: new Set(valid.map((c) => c.orderId)).size,
        earned: valid.reduce((a, c) => a + c.amount, 0),
      };
    });

    res.json(result);
  } catch (error) {
    serverError(res, error, 'links list');
  }
});

// Explorar: productos y tiendas que participan, ordenados por %
router.get('/explore', authenticate, async (req: AuthRequest, res) => {
  try {
    const cfg = await getAffiliateConfig();
    if (!cfg.enabled) return res.json({ products: [], stores: [] });
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';

    const products = await prisma.product.findMany({
      where: {
        ...participatingProductWhere,
        ...(search ? { name: { contains: search, mode: 'insensitive' as const } } : {}),
      },
      include: { seller: true },
      take: 300,
    });

    const productList = products
      .map((p) => ({
        id: p.id,
        slug: p.slug,
        name: p.name,
        price: p.price,
        image: p.images[0] || null,
        category: p.category,
        storeName: p.seller.storeName,
        storeSlug: p.seller.storeSlug,
        rate: getEffectiveRate(p.seller, p, cfg),
      }))
      .filter((p) => p.rate !== null)
      .map((p) => ({ ...p, commission: Math.floor((p.price * p.rate!) / 100) }))
      .sort((a, b) => b.rate! - a.rate! || b.commission - a.commission);

    const storeMap = new Map<string, any>();
    for (const p of products) {
      const rate = getEffectiveRate(p.seller, p, cfg);
      if (rate === null) continue;
      const s = storeMap.get(p.seller.id) || {
        id: p.seller.id,
        name: p.seller.storeName,
        slug: p.seller.storeSlug,
        logo: p.seller.logo,
        productCount: 0,
        maxRate: 0,
      };
      s.productCount += 1;
      s.maxRate = Math.max(s.maxRate, rate);
      storeMap.set(p.seller.id, s);
    }
    const storeList = [...storeMap.values()].sort((a, b) => b.maxRate - a.maxRate);

    res.json({ products: productList, stores: storeList });
  } catch (error) {
    serverError(res, error, 'explore');
  }
});

// Mis ganancias: comisiones con su estado
router.get('/commissions', authenticate, async (req: AuthRequest, res) => {
  try {
    const profile = await requireAffiliate(req, res);
    if (!profile) return;
    const commissions = await prisma.affiliateCommission.findMany({
      where: { affiliateId: profile.id },
      include: { order: { select: { orderNumber: true, status: true, createdAt: true } } },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });
    const sellers = await prisma.sellerProfile.findMany({
      where: { id: { in: [...new Set(commissions.map((c) => c.sellerId))] } },
      select: { id: true, storeName: true },
    });
    res.json(commissions.map(({ buyerId: _b, clickId: _c, walletTxId: _w, ...c }) => ({
      ...c,
      storeName: sellers.find((s) => s.id === c.sellerId)?.storeName || '',
    })));
  } catch (error) {
    serverError(res, error, 'commissions');
  }
});

// Estadísticas: clics, visitantes, ventas y conversión (últimos N días)
router.get('/stats', authenticate, async (req: AuthRequest, res) => {
  try {
    const profile = await requireAffiliate(req, res);
    if (!profile) return;
    const days = Math.min(365, Math.max(1, Number(req.query.days) || 30));
    const since = new Date(Date.now() - days * DAY_MS);

    const [clicks, commissions] = await Promise.all([
      prisma.affiliateClick.findMany({ where: { affiliateId: profile.id, createdAt: { gte: since } }, select: { visitorId: true, createdAt: true } }),
      prisma.affiliateCommission.findMany({
        where: { affiliateId: profile.id, createdAt: { gte: since }, status: { notIn: ['cancelled', 'reversed'] } },
        select: { orderId: true, amount: true, createdAt: true },
      }),
    ]);

    const visitors = new Set(clicks.map((c) => c.visitorId)).size;
    const orders = new Set(commissions.map((c) => c.orderId)).size;

    const series: Record<string, { date: string; clicks: number; sales: number; earned: number }> = {};
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * DAY_MS).toISOString().slice(0, 10);
      series[d] = { date: d, clicks: 0, sales: 0, earned: 0 };
    }
    for (const c of clicks) {
      const d = c.createdAt.toISOString().slice(0, 10);
      if (series[d]) series[d].clicks++;
    }
    const seenOrders = new Set<string>();
    for (const c of commissions) {
      const d = c.createdAt.toISOString().slice(0, 10);
      if (!series[d]) continue;
      series[d].earned += c.amount;
      if (!seenOrders.has(c.orderId)) { seenOrders.add(c.orderId); series[d].sales++; }
    }

    res.json({
      days,
      clicks: clicks.length,
      visitors,
      sales: orders,
      earned: commissions.reduce((a, c) => a + c.amount, 0),
      conversion: visitors ? Math.round((orders / visitors) * 10000) / 100 : 0,
      series: Object.values(series),
    });
  } catch (error) {
    serverError(res, error, 'stats');
  }
});

// ═══ Vendedor ═════════════════════════════════════════════════════════════════

const getSellerProfile = async (req: AuthRequest, res: Response) => {
  const seller = await prisma.sellerProfile.findUnique({ where: { userId: req.user!.userId } });
  if (!seller) {
    res.status(404).json({ error: 'No tienes una tienda' });
    return null;
  }
  return seller;
};

// Configuración de afiliados de mi tienda + productos que participan
router.get('/seller/settings', authenticate, authorize('seller', 'superadmin'), async (req: AuthRequest, res) => {
  try {
    const seller = await getSellerProfile(req, res);
    if (!seller) return;
    const cfg = await getAffiliateConfig();
    const products = await prisma.product.findMany({
      where: { sellerId: seller.id },
      select: {
        id: true, name: true, price: true, cost: true, images: true, status: true, slug: true,
        affiliateEnabled: true, affiliateRate: true, affiliateBlocked: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({
      program: { enabled: cfg.enabled, minRate: cfg.minRate, maxRate: cfg.maxRate, holdDays: cfg.holdDays, codEnabled: cfg.codEnabled },
      store: {
        storeSlug: seller.storeSlug,
        affiliateEnabled: seller.affiliateEnabled,
        affiliateDefaultRate: seller.affiliateDefaultRate,
        affiliateAllProducts: seller.affiliateAllProducts,
        affiliateBlocked: seller.affiliateBlocked,
        platformCommissionRate: seller.planId ? 0 : seller.commissionRate || 5,
      },
      products: products.map((p) => ({ ...p, effectiveRate: getEffectiveRate(seller, p, cfg) })),
    });
  } catch (error) {
    serverError(res, error, 'seller settings');
  }
});

router.put('/seller/settings', authenticate, authorize('seller', 'superadmin'), async (req: AuthRequest, res) => {
  try {
    const seller = await getSellerProfile(req, res);
    if (!seller) return;
    const cfg = await getAffiliateConfig();
    const { affiliateEnabled, affiliateDefaultRate, affiliateAllProducts } = req.body || {};

    const data: any = {};
    if (affiliateEnabled !== undefined) data.affiliateEnabled = !!affiliateEnabled;
    if (affiliateAllProducts !== undefined) data.affiliateAllProducts = !!affiliateAllProducts;
    if (affiliateDefaultRate !== undefined) {
      try {
        data.affiliateDefaultRate = parseRateInput(affiliateDefaultRate, cfg);
      } catch {
        return res.status(400).json({ error: `El % de afiliado debe estar entre ${cfg.minRate}% y ${cfg.maxRate}%` });
      }
    }
    const enabling = data.affiliateEnabled ?? seller.affiliateEnabled;
    const rate = data.affiliateDefaultRate !== undefined ? data.affiliateDefaultRate : seller.affiliateDefaultRate;
    const allProducts = data.affiliateAllProducts ?? seller.affiliateAllProducts;
    if (enabling && allProducts && rate === null) {
      return res.status(400).json({ error: 'Para incluir todos los productos, fija un % general' });
    }

    const updated = await prisma.sellerProfile.update({ where: { id: seller.id }, data });
    res.json({
      affiliateEnabled: updated.affiliateEnabled,
      affiliateDefaultRate: updated.affiliateDefaultRate,
      affiliateAllProducts: updated.affiliateAllProducts,
      affiliateBlocked: updated.affiliateBlocked,
    });
  } catch (error) {
    serverError(res, error, 'seller settings update');
  }
});

// Reporte de ventas por afiliado
router.get('/seller/report', authenticate, authorize('seller', 'superadmin'), async (req: AuthRequest, res) => {
  try {
    const seller = await getSellerProfile(req, res);
    if (!seller) return;
    const commissions = await prisma.affiliateCommission.findMany({
      where: { sellerId: seller.id },
      include: {
        affiliate: { select: { code: true, user: { select: { firstName: true, lastName: true } } } },
        order: { select: { orderNumber: true, status: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 1000,
    });

    const byAffiliate = new Map<string, any>();
    for (const c of commissions) {
      const row = byAffiliate.get(c.affiliateId) || {
        affiliateId: c.affiliateId,
        code: c.affiliate.code,
        name: `${c.affiliate.user.firstName} ${c.affiliate.user.lastName}`,
        orders: new Set<string>(),
        sales: 0,
        commission: 0,
      };
      if (c.status !== 'cancelled' && c.status !== 'reversed') {
        row.orders.add(c.orderId);
        row.sales += c.baseAmount;
        row.commission += c.amount;
      }
      byAffiliate.set(c.affiliateId, row);
    }

    res.json({
      affiliates: [...byAffiliate.values()]
        .map((r) => ({ ...r, orders: r.orders.size }))
        .sort((a, b) => b.sales - a.sales),
      commissions: commissions.map((c) => ({
        id: c.id,
        createdAt: c.createdAt,
        orderNumber: c.order.orderNumber,
        orderStatus: c.order.status,
        productName: c.productName,
        affiliateCode: c.affiliate.code,
        affiliateName: `${c.affiliate.user.firstName} ${c.affiliate.user.lastName}`,
        baseAmount: c.baseAmount,
        rate: c.rate,
        amount: c.amount,
        status: c.status,
        note: c.note,
      })),
    });
  } catch (error) {
    serverError(res, error, 'seller report');
  }
});

// ═══ Super admin ══════════════════════════════════════════════════════════════

const admin = [authenticate, authorize('superadmin')];

router.get('/admin/affiliates', ...admin, async (_req: AuthRequest, res) => {
  try {
    const profiles = await prisma.affiliateProfile.findMany({
      include: { user: { select: { firstName: true, lastName: true, email: true, phone: true, isActive: true } } },
      orderBy: { createdAt: 'desc' },
    });
    const [grouped, clicks] = await Promise.all([
      prisma.affiliateCommission.groupBy({ by: ['affiliateId', 'status'], _sum: { amount: true }, _count: { _all: true } }),
      prisma.affiliateClick.groupBy({ by: ['affiliateId'], _count: { _all: true } }),
    ]);
    res.json(profiles.map((p) => ({
      ...p,
      clicks: clicks.find((c) => c.affiliateId === p.id)?._count._all || 0,
      earnings: sumByStatus(grouped.filter((g) => g.affiliateId === p.id) as any),
    })));
  } catch (error) {
    serverError(res, error, 'admin affiliates');
  }
});

router.patch('/admin/affiliates/:id', ...admin, async (req: AuthRequest, res) => {
  try {
    const { status } = req.body || {};
    if (!['pending', 'active', 'suspended'].includes(status)) return res.status(400).json({ error: 'Estado inválido' });
    const profile = await prisma.affiliateProfile.update({ where: { id: req.params.id as string }, data: { status } });
    res.json(profile);
  } catch (error) {
    serverError(res, error, 'admin affiliate status');
  }
});

router.get('/admin/commissions', ...admin, async (req: AuthRequest, res) => {
  try {
    const status = typeof req.query.status === 'string' && COMMISSION_STATUSES.includes(req.query.status as any)
      ? (req.query.status as any)
      : undefined;
    const commissions = await prisma.affiliateCommission.findMany({
      where: status ? { status } : {},
      include: {
        affiliate: { select: { code: true, user: { select: { firstName: true, lastName: true, email: true } } } },
        order: { select: { orderNumber: true, status: true, paymentMethod: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 1000,
    });
    const sellers = await prisma.sellerProfile.findMany({
      where: { id: { in: [...new Set(commissions.map((c) => c.sellerId))] } },
      select: { id: true, storeName: true },
    });
    res.json(commissions.map((c) => ({ ...c, storeName: sellers.find((s) => s.id === c.sellerId)?.storeName || '' })));
  } catch (error) {
    serverError(res, error, 'admin commissions');
  }
});

const parseIds = (body: any): string[] | null =>
  Array.isArray(body?.ids) && body.ids.length > 0 && body.ids.length <= 500 && body.ids.every((x: unknown) => typeof x === 'string')
    ? [...new Set(body.ids as string[])]
    : null;

router.post('/admin/commissions/approve', ...admin, async (req: AuthRequest, res) => {
  try {
    const ids = parseIds(req.body);
    if (!ids) return res.status(400).json({ error: 'Lista de comisiones inválida' });
    res.json({ results: await approveCommissions(ids) });
  } catch (error) {
    serverError(res, error, 'admin approve');
  }
});

router.post('/admin/commissions/cancel', ...admin, async (req: AuthRequest, res) => {
  try {
    const ids = parseIds(req.body);
    if (!ids) return res.status(400).json({ error: 'Lista de comisiones inválida' });
    const reason = typeof req.body.reason === 'string' && req.body.reason.trim() ? req.body.reason.trim().slice(0, 200) : 'Cancelada por el administrador';
    res.json({ results: await adminCancelCommissions(ids, reason) });
  } catch (error) {
    serverError(res, error, 'admin cancel');
  }
});

// Ejecuta ya el proceso de liberación (el mismo que corre cada 15 minutos)
router.post('/admin/release-now', ...admin, async (_req: AuthRequest, res) => {
  try {
    res.json(await releaseDueCommissions());
  } catch (error) {
    serverError(res, error, 'admin release');
  }
});

// Pagos: por afiliado, cuánto generó, cuánto se le pagó y cuánto le queda por cobrar
const buildPayouts = async () => {
  const profiles = await prisma.affiliateProfile.findMany({
    include: { user: { select: { id: true, firstName: true, lastName: true, email: true, bankData: true, wallet: { select: { balance: true } } } } },
  });
  const grouped = await prisma.affiliateCommission.groupBy({ by: ['affiliateId', 'status'], _sum: { amount: true }, _count: { _all: true } });
  return profiles.map((p) => {
    const e = sumByStatus(grouped.filter((g) => g.affiliateId === p.id) as any);
    return {
      affiliateId: p.id,
      code: p.code,
      status: p.status,
      name: `${p.user.firstName} ${p.user.lastName}`,
      email: p.user.email,
      bank: p.user.bankData ? `${p.user.bankData.bankName} ${p.user.bankData.accountNumber} (${p.user.bankData.holderName})` : '',
      generated: e.generated,
      pending: e.pending.amount + e.approved.amount,
      paid: e.paid.amount,
      cancelled: e.cancelled.amount + e.reversed.amount,
      walletBalance: p.user.wallet?.balance ?? 0,
    };
  }).sort((a, b) => b.generated - a.generated);
};

router.get('/admin/payouts', ...admin, async (_req: AuthRequest, res) => {
  try {
    res.json(await buildPayouts());
  } catch (error) {
    serverError(res, error, 'admin payouts');
  }
});

router.get('/admin/payouts/export', ...admin, async (_req: AuthRequest, res) => {
  try {
    const rows = await buildPayouts();
    const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const header = ['Código', 'Afiliado', 'Email', 'Estado', 'Generado', 'Pendiente', 'Pagado', 'Cancelado', 'Saldo billetera', 'Datos bancarios'];
    const lines = rows.map((r) => [r.code, r.name, r.email, r.status, r.generated, r.pending, r.paid, r.cancelled, r.walletBalance, r.bank].map(esc).join(','));
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="pagos-afiliados-${new Date().toISOString().slice(0, 10)}.csv"`);
    res.send('﻿' + [header.map(esc).join(','), ...lines].join('\n'));
  } catch (error) {
    serverError(res, error, 'admin payouts export');
  }
});

// Reportes: mejores afiliados, tiendas y productos
router.get('/admin/reports', ...admin, async (req: AuthRequest, res) => {
  try {
    const days = Math.min(3650, Math.max(1, Number(req.query.days) || 30));
    const since = new Date(Date.now() - days * DAY_MS);
    const where = { createdAt: { gte: since }, status: { notIn: ['cancelled', 'reversed'] as any } };

    const [byAffiliate, bySeller, byProduct, totals, clicks] = await Promise.all([
      prisma.affiliateCommission.groupBy({ by: ['affiliateId'], where, _sum: { amount: true, baseAmount: true }, _count: { _all: true }, orderBy: { _sum: { baseAmount: 'desc' } }, take: 10 }),
      prisma.affiliateCommission.groupBy({ by: ['sellerId'], where, _sum: { amount: true, baseAmount: true }, _count: { _all: true }, orderBy: { _sum: { baseAmount: 'desc' } }, take: 10 }),
      prisma.affiliateCommission.groupBy({ by: ['productId', 'productName'], where, _sum: { amount: true, baseAmount: true }, _count: { _all: true }, orderBy: { _sum: { baseAmount: 'desc' } }, take: 10 }),
      prisma.affiliateCommission.aggregate({ where, _sum: { amount: true, baseAmount: true }, _count: { _all: true } }),
      prisma.affiliateClick.count({ where: { createdAt: { gte: since } } }),
    ]);
    const [affiliates, sellers] = await Promise.all([
      prisma.affiliateProfile.findMany({ where: { id: { in: byAffiliate.map((a) => a.affiliateId) } }, include: { user: { select: { firstName: true, lastName: true } } } }),
      prisma.sellerProfile.findMany({ where: { id: { in: bySeller.map((s) => s.sellerId) } }, select: { id: true, storeName: true } }),
    ]);

    res.json({
      days,
      totals: { sales: totals._sum.baseAmount || 0, commissions: totals._sum.amount || 0, items: totals._count._all, clicks },
      topAffiliates: byAffiliate.map((a) => {
        const p = affiliates.find((x) => x.id === a.affiliateId);
        return { id: a.affiliateId, name: p ? `${p.user.firstName} ${p.user.lastName}` : '—', code: p?.code, sales: a._sum.baseAmount || 0, commission: a._sum.amount || 0, items: a._count._all };
      }),
      topStores: bySeller.map((s) => ({ id: s.sellerId, name: sellers.find((x) => x.id === s.sellerId)?.storeName || '—', sales: s._sum.baseAmount || 0, commission: s._sum.amount || 0, items: s._count._all })),
      topProducts: byProduct.map((p) => ({ id: p.productId, name: p.productName, sales: p._sum.baseAmount || 0, commission: p._sum.amount || 0, items: p._count._all })),
    });
  } catch (error) {
    serverError(res, error, 'admin reports');
  }
});

// Tiendas y productos: el admin puede apagar afiliados en cualquiera
router.get('/admin/stores', ...admin, async (_req: AuthRequest, res) => {
  try {
    const cfg = await getAffiliateConfig();
    const sellers = await prisma.sellerProfile.findMany({
      select: {
        id: true, storeName: true, storeSlug: true, affiliateEnabled: true, affiliateDefaultRate: true,
        affiliateAllProducts: true, affiliateBlocked: true,
        products: { select: { id: true, name: true, status: true, affiliateEnabled: true, affiliateRate: true, affiliateBlocked: true } },
      },
      orderBy: { storeName: 'asc' },
    });
    res.json(sellers.map(({ products, ...s }) => ({
      ...s,
      products: products.map((p) => ({ ...p, effectiveRate: getEffectiveRate(s, p, cfg) })),
    })));
  } catch (error) {
    serverError(res, error, 'admin stores');
  }
});

router.patch('/admin/stores/:id', ...admin, async (req: AuthRequest, res) => {
  try {
    const updated = await prisma.sellerProfile.update({
      where: { id: req.params.id as string },
      data: { affiliateBlocked: !!req.body?.affiliateBlocked },
      select: { id: true, affiliateBlocked: true },
    });
    res.json(updated);
  } catch (error) {
    serverError(res, error, 'admin store block');
  }
});

router.patch('/admin/products/:id', ...admin, async (req: AuthRequest, res) => {
  try {
    const updated = await prisma.product.update({
      where: { id: req.params.id as string },
      data: { affiliateBlocked: !!req.body?.affiliateBlocked },
      select: { id: true, affiliateBlocked: true },
    });
    res.json(updated);
  } catch (error) {
    serverError(res, error, 'admin product block');
  }
});

// Configuración del programa
router.get('/admin/config', ...admin, async (_req: AuthRequest, res) => {
  try {
    const cfg = await getAffiliateConfig();
    res.json({ config: cfg, settings: AFFILIATE_SETTINGS.map(({ key, field, type, description }) => ({ key, field, type, description })) });
  } catch (error) {
    serverError(res, error, 'admin config');
  }
});

router.put('/admin/config', ...admin, async (req: AuthRequest, res) => {
  try {
    const body = req.body || {};
    const current = await getAffiliateConfig();
    const next: any = { ...current };
    for (const s of AFFILIATE_SETTINGS) {
      if (body[s.field] === undefined) continue;
      if (s.type === 'bool') next[s.field] = !!body[s.field];
      else {
        const n = Number(body[s.field]);
        if (!Number.isFinite(n) || n < 0) return res.status(400).json({ error: `Valor inválido para ${s.description}` });
        next[s.field] = n;
      }
    }
    if (next.minRate <= 0 || next.maxRate > 100 || next.minRate > next.maxRate) {
      return res.status(400).json({ error: 'El rango de % debe cumplir 0 < mínimo ≤ máximo ≤ 100' });
    }
    if (next.cookieDays < 1 || next.cookieDays > 365) return res.status(400).json({ error: 'La ventana de atribución debe ser de 1 a 365 días' });
    if (next.holdDays > 365) return res.status(400).json({ error: 'El plazo de garantía no puede superar 365 días' });

    await prisma.$transaction(AFFILIATE_SETTINGS.map((s) =>
      prisma.systemSetting.upsert({
        where: { key: s.key },
        update: { value: String(next[s.field]) },
        create: { key: s.key, value: String(next[s.field]), group: 'afiliados', isPublic: s.isPublic, description: s.description },
      }),
    ));
    res.json({ config: await getAffiliateConfig() });
  } catch (error) {
    serverError(res, error, 'admin config update');
  }
});

export default router;
