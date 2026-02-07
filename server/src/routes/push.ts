import { Router } from 'express';
import { prisma } from '../utils/prisma.js';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.js';

const router = Router();

// GET /api/push/vapid-public-key - Public key for client subscription
router.get('/vapid-public-key', (_req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY || '' });
});

// POST /api/push/subscribe - Register push subscription
router.post('/subscribe', authenticate, async (req: AuthRequest, res) => {
  try {
    const { endpoint, p256dh, auth } = req.body;
    const userId = req.user!.userId;

    if (!endpoint || !p256dh || !auth) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    await prisma.pushSubscription.upsert({
      where: { endpoint },
      update: { userId, p256dh, auth, isActive: true },
      create: { userId, endpoint, p256dh, auth },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error subscribing to push:', error);
    res.status(500).json({ error: 'Error al registrar suscripcion' });
  }
});

// POST /api/push/unsubscribe - Remove push subscription
router.post('/unsubscribe', authenticate, async (req: AuthRequest, res) => {
  try {
    const { endpoint } = req.body;

    if (!endpoint) {
      return res.status(400).json({ error: 'Endpoint requerido' });
    }

    await prisma.pushSubscription.updateMany({
      where: { endpoint },
      data: { isActive: false },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error unsubscribing from push:', error);
    res.status(500).json({ error: 'Error al desregistrar suscripcion' });
  }
});

// GET /api/push/status - Check if current user is subscribed
router.get('/status', authenticate, async (req: AuthRequest, res) => {
  try {
    const count = await prisma.pushSubscription.count({
      where: { userId: req.user!.userId, isActive: true },
    });

    res.json({ isSubscribed: count > 0 });
  } catch (error) {
    res.status(500).json({ error: 'Error al verificar estado' });
  }
});

// GET /api/push/stats - Admin: get subscription stats
router.get('/stats', authenticate, authorize('superadmin'), async (_req: AuthRequest, res) => {
  try {
    const total = await prisma.pushSubscription.count({
      where: { isActive: true },
    });

    const byRole = await prisma.$queryRaw`
      SELECT u.role, COUNT(ps.id)::int as count
      FROM push_subscriptions ps
      JOIN users u ON u.id = ps."userId"
      WHERE ps."isActive" = true
      GROUP BY u.role
    ` as { role: string; count: number }[];

    const roleMap: Record<string, number> = {};
    byRole.forEach((r) => {
      roleMap[r.role] = r.count;
    });

    res.json({ totalSubscriptions: total, byRole: roleMap });
  } catch (error) {
    console.error('Error getting push stats:', error);
    res.status(500).json({ error: 'Error al obtener estadisticas' });
  }
});

export default router;
