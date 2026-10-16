import { Router } from 'express';
import { prisma } from '../utils/prisma.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { decorateOffer } from '../services/offerService.js';

const router = Router();

// Solo los ids (para pintar los corazones en el catálogo)
router.get('/ids', authenticate, async (req: AuthRequest, res) => {
  try {
    const favs = await prisma.productFavorite.findMany({ where: { userId: req.user!.userId }, select: { productId: true } });
    res.json(favs.map((f) => f.productId));
  } catch {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Mis favoritos con lo necesario para mostrarlos
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const favs = await prisma.productFavorite.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: 'desc' },
      include: { product: { select: { id: true, name: true, slug: true, images: true, price: true, comparePrice: true, category: true, status: true, stock: true, offerEndsAt: true, offerBlocked: true, auctionStatus: true, auctionEndsAt: true, seller: { select: { storeName: true, storeSlug: true } } } } },
      take: 200,
    });
    res.json(favs.filter((f) => f.product.status === 'active').map((f) => decorateOffer(f.product)));
  } catch {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

router.post('/:productId', authenticate, async (req: AuthRequest, res) => {
  try {
    const productId = String(req.params.productId);
    const product = await prisma.product.findUnique({ where: { id: productId }, select: { id: true, status: true } });
    if (!product || product.status !== 'active') return res.status(404).json({ error: 'Producto no encontrado' });
    await prisma.productFavorite.upsert({
      where: { userId_productId: { userId: req.user!.userId, productId } },
      update: {},
      create: { userId: req.user!.userId, productId },
    });
    res.status(201).json({ favorite: true });
  } catch {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

router.delete('/:productId', authenticate, async (req: AuthRequest, res) => {
  try {
    await prisma.productFavorite.deleteMany({ where: { userId: req.user!.userId, productId: String(req.params.productId) } });
    res.json({ favorite: false });
  } catch {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

export default router;
