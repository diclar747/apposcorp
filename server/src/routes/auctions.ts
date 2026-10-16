import { Router } from 'express';
import { prisma } from '../utils/prisma.js';
import { authenticate, AuthRequest, getOptionalUser } from '../middleware/auth.js';
import { AuctionError, closeDueAuctions, getAuctionView, placeBid } from '../services/auctionService.js';

const router = Router();

const fail = (res: any, error: unknown, label: string) => {
  if (error instanceof AuctionError) return res.status(error.status).json({ error: error.message });
  console.error(`[remates] ${label}:`, error);
  res.status(500).json({ error: 'Error del servidor' });
};

// Mis ofertas: remates donde ofertué, con mi situación en cada uno
router.get('/mine', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const mine = await prisma.auctionBid.groupBy({ by: ['productId'], where: { userId }, _max: { amount: true } });
    const products = await prisma.product.findMany({
      where: { id: { in: mine.map((m) => m.productId) } },
      select: { id: true, name: true, slug: true, images: true, price: true, auctionStatus: true, auctionEndsAt: true, auctionWinnerId: true, auctionPayBy: true, auctionStartPrice: true, auctionMinIncrement: true },
    });
    const out = [];
    for (const p of products) {
      const view = await getAuctionView(p, userId);
      out.push({
        id: p.id,
        name: p.name,
        slug: p.slug,
        image: p.images[0] ?? null,
        status: p.auctionStatus,
        endsAt: p.auctionEndsAt,
        currentPrice: p.price,
        myBest: mine.find((m) => m.productId === p.id)?._max.amount ?? 0,
        iAmWinning: view?.iAmWinning ?? false,
        iWon: view?.iWon ?? false,
        canPay: view?.canPay ?? false,
        payBy: view?.payBy ?? null,
      });
    }
    res.json(out.sort((a, b) => new Date(a.endsAt ?? 0).getTime() - new Date(b.endsAt ?? 0).getTime()));
  } catch (error) {
    fail(res, error, 'mine');
  }
});

// Estado del remate (público; si hay sesión, incluye mi situación)
router.get('/:productId', async (req, res) => {
  try {
    const id = String(req.params.productId);
    await closeDueAuctions(id);
    const p = await prisma.product.findUnique({ where: { id } });
    if (!p || p.auctionStatus === null) return res.status(404).json({ error: 'Remate no encontrado' });
    const viewer = await getOptionalUser(req);
    res.json(await getAuctionView(p, viewer?.userId));
  } catch (error) {
    fail(res, error, 'view');
  }
});

// Quién ofertó y cuánto: lo ve el superadmin y la tienda dueña del remate (con datos de contacto)
router.get('/:productId/bidders', authenticate, async (req: AuthRequest, res) => {
  try {
    const id = String(req.params.productId);
    const p = await prisma.product.findUnique({ where: { id }, include: { seller: { select: { userId: true, storeName: true } } } });
    if (!p || p.auctionStatus === null) return res.status(404).json({ error: 'Remate no encontrado' });
    const isAdmin = req.user!.roles.includes('superadmin');
    if (!isAdmin && p.seller.userId !== req.user!.userId) return res.status(403).json({ error: 'Acceso denegado' });
    const bids = await prisma.auctionBid.findMany({ where: { productId: id }, orderBy: { createdAt: 'desc' }, take: 500 });
    const users = await prisma.user.findMany({
      where: { id: { in: [...new Set(bids.map((b) => b.userId))] } },
      select: { id: true, firstName: true, lastName: true, email: true, phone: true },
    });
    res.json({
      product: { id: p.id, name: p.name, status: p.auctionStatus, endsAt: p.auctionEndsAt, currentPrice: p.price, winnerId: p.auctionWinnerId, payBy: p.auctionPayBy, store: p.seller.storeName },
      bids: bids.map((b) => {
        const u = users.find((x) => x.id === b.userId);
        return {
          id: b.id,
          amount: b.amount,
          at: b.createdAt,
          userId: b.userId,
          name: u ? `${u.firstName} ${u.lastName}` : b.userId,
          email: u?.email ?? '',
          phone: u?.phone ?? '',
          isWinner: p.auctionWinnerId === b.userId && b.amount === p.price,
        };
      }),
    });
  } catch (error) {
    fail(res, error, 'bidders');
  }
});

// Todos los remates (panel del superadmin)
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.user!.roles.includes('superadmin')) return res.status(403).json({ error: 'Acceso denegado' });
    await closeDueAuctions();
    const products = await prisma.product.findMany({
      where: { auctionStatus: { not: null } },
      select: { id: true, name: true, slug: true, images: true, price: true, auctionStatus: true, auctionEndsAt: true, auctionWinnerId: true, auctionStartPrice: true, seller: { select: { storeName: true } }, _count: { select: { auctionBids: true } } },
      orderBy: { auctionEndsAt: 'desc' },
      take: 300,
    });
    res.json(products.map((p) => ({ id: p.id, name: p.name, slug: p.slug, image: p.images[0] ?? null, store: p.seller.storeName, status: p.auctionStatus, endsAt: p.auctionEndsAt, startPrice: p.auctionStartPrice, currentPrice: p.price, bids: p._count.auctionBids })));
  } catch (error) {
    fail(res, error, 'list');
  }
});

// Ofertar
router.post('/:productId/bids', authenticate, async (req: AuthRequest, res) => {
  try {
    const id = String(req.params.productId);
    await closeDueAuctions(id); // si ya venció, se cierra antes de aceptar nada
    const result = await placeBid(id, req.user!.userId, req.body?.amount);
    const p = await prisma.product.findUnique({ where: { id } });
    res.status(201).json({ extended: result.extended, auction: p ? await getAuctionView(p, req.user!.userId) : null });
  } catch (error) {
    fail(res, error, 'bid');
  }
});

export default router;
