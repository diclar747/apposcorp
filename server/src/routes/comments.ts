import { Router } from 'express';
import { prisma } from '../utils/prisma.js';
import { authenticate, AuthRequest, getOptionalUser } from '../middleware/auth.js';
import { sendPushToUser } from '../services/pushService.js';

const router = Router();

const MIN_LEN = 3;
const MAX_LEN = 500;
const MAX_PER_DAY = 5;
const LINK = /(https?:\/\/|www\.|\.com\b|\.py\b|wa\.me)/i; // sin enlaces: es lo que más usa el spam

const mask = (u?: { firstName: string; lastName: string } | null) => (u ? `${u.firstName.split(' ')[0]} ${u.lastName.charAt(0)}.` : 'Usuario');

// Comentarios aprobados de un producto (y, si hay sesión, los míos que esperan aprobación)
router.get('/product/:productId', async (req, res) => {
  try {
    const productId = String(req.params.productId);
    const viewer = await getOptionalUser(req);
    const rows = await prisma.productComment.findMany({
      where: { productId, OR: [{ status: 'approved' }, ...(viewer ? [{ userId: viewer.userId, status: 'pending' }] : [])] },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    const users = await prisma.user.findMany({ where: { id: { in: [...new Set(rows.map((r) => r.userId))] } }, select: { id: true, firstName: true, lastName: true } });
    res.json(rows.map((r) => ({
      id: r.id,
      body: r.body,
      createdAt: r.createdAt,
      name: mask(users.find((u) => u.id === r.userId)),
      pending: r.status === 'pending',
      mine: r.userId === viewer?.userId,
    })));
  } catch {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Comentar: queda pendiente hasta que la tienda o el administrador lo apruebe
router.post('/product/:productId', authenticate, async (req: AuthRequest, res) => {
  try {
    const productId = String(req.params.productId);
    const userId = req.user!.userId;
    const body = String(req.body?.body ?? '').trim();
    if (body.length < MIN_LEN) return res.status(400).json({ error: 'Escribí un comentario un poco más largo' });
    if (body.length > MAX_LEN) return res.status(400).json({ error: `El comentario puede tener hasta ${MAX_LEN} caracteres` });
    if (LINK.test(body)) return res.status(400).json({ error: 'Los comentarios no pueden incluir enlaces' });

    const product = await prisma.product.findUnique({ where: { id: productId }, include: { seller: { select: { userId: true } } } });
    if (!product || product.status !== 'active') return res.status(404).json({ error: 'Producto no encontrado' });
    if (product.seller.userId === userId) return res.status(400).json({ error: 'No podés comentar tu propio producto' });

    const since = new Date(Date.now() - 24 * 3600_000);
    if ((await prisma.productComment.count({ where: { userId, createdAt: { gte: since } } })) >= MAX_PER_DAY) {
      return res.status(429).json({ error: 'Llegaste al límite de comentarios por hoy' });
    }
    const comment = await prisma.productComment.create({ data: { productId, userId, body } });
    sendPushToUser(product.seller.userId, {
      title: 'Nuevo comentario para aprobar',
      body: `Alguien comentó "${product.name}". Revisalo antes de que se publique.`,
      url: '/vendedor/productos',
      tag: 'comment',
    }).catch(() => {});
    res.status(201).json({ id: comment.id, pending: true });
  } catch {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Cola de moderación: la tienda ve los de sus productos; el superadmin, todos
router.get('/moderation', authenticate, async (req: AuthRequest, res) => {
  try {
    const isAdmin = req.user!.roles.includes('superadmin');
    const seller = isAdmin ? null : await prisma.sellerProfile.findUnique({ where: { userId: req.user!.userId }, select: { id: true } });
    if (!isAdmin && !seller) return res.status(403).json({ error: 'Acceso denegado' });
    const rows = await prisma.productComment.findMany({
      where: { status: 'pending', ...(isAdmin ? {} : { product: { sellerId: seller!.id } }) },
      orderBy: { createdAt: 'asc' },
      include: { product: { select: { id: true, name: true, slug: true } } },
      take: 200,
    });
    const users = await prisma.user.findMany({ where: { id: { in: [...new Set(rows.map((r) => r.userId))] } }, select: { id: true, firstName: true, lastName: true, email: true } });
    res.json(rows.map((r) => ({
      id: r.id,
      body: r.body,
      createdAt: r.createdAt,
      productId: r.product.id,
      productName: r.product.name,
      author: (() => { const u = users.find((x) => x.id === r.userId); return u ? `${u.firstName} ${u.lastName}` : r.userId; })(),
      email: users.find((x) => x.id === r.userId)?.email ?? '',
    })));
  } catch {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

router.patch('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const status = req.body?.status;
    if (!['approved', 'hidden'].includes(status)) return res.status(400).json({ error: 'Estado inválido' });
    const c = await prisma.productComment.findUnique({ where: { id: String(req.params.id) }, include: { product: { include: { seller: { select: { userId: true } } } } } });
    if (!c) return res.status(404).json({ error: 'Comentario no encontrado' });
    if (!req.user!.roles.includes('superadmin') && c.product.seller.userId !== req.user!.userId) return res.status(403).json({ error: 'Acceso denegado' });
    await prisma.productComment.update({ where: { id: c.id }, data: { status, moderatedBy: req.user!.userId } });
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

export default router;
