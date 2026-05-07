import { Router } from 'express';
import { prisma } from '../utils/prisma.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { sendPushToUser } from '../services/pushService.js';

const router = Router();

// Get current user's seller subscription
router.get('/my-subscription', authenticate, async (req: AuthRequest, res) => {
  try {
    let sub = await prisma.sellerSubscription.findUnique({
      where: { userId: req.user!.userId },
      include: { plan: true }
    });

    // Check for expiration
    if (sub && (sub as any).status === 'ACTIVE' && (sub as any).expiresAt && new Date((sub as any).expiresAt) < new Date()) {
      sub = await prisma.sellerSubscription.update({
        where: { id: sub.id },
        data: { status: 'EXPIRED' },
        include: { plan: true }
      });

      if (sub) {
        // Update SellerProfile
        await prisma.sellerProfile.updateMany({
          where: { userId: sub.userId },
          data: { planActive: false }
        });
        
        // Notify Seller
        await prisma.notification.create({
          data: {
            userId: sub.userId,
            title: 'Suscripción Vencida',
            message: `Tu plan ${sub.plan?.name || ''} ha vencido. Por favor, renueva para seguir operando.`,
            type: 'warning',
            actionUrl: '/vendedor/planes'
          }
        });
      }
    }

    res.json(sub);
  } catch (error) {
    console.error('Error fetching seller subscription:', error);
    res.status(500).json({ error: 'Error al obtener la suscripción' });
  }
});

// Subscribe to a seller plan
router.post('/subscribe', authenticate, async (req: AuthRequest, res) => {
  try {
    const { planId, paymentMethod, receiptUrl, billingCycle } = req.body;
    const userId = req.user!.userId;

    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId }
    });

    if (!plan) {
      return res.status(404).json({ error: 'Plan no encontrado' });
    }

    const price = (plan.prices as any)?.[billingCycle] || plan.price;

    let status: 'PENDING_APPROVAL' | 'ACTIVE' | 'PENDING_PAYMENT' = 'PENDING_PAYMENT';
    const receipts: any[] = [];
    
    if (paymentMethod === 'BANK_TRANSFER' && receiptUrl) {
      status = 'PENDING_APPROVAL';
      receipts.push({
        url: receiptUrl,
        date: new Date().toISOString()
      });
    } else if (paymentMethod === 'WALLET') {
      status = 'ACTIVE';
      // Here you would deduct from wallet
    }

    const sub = await prisma.sellerSubscription.upsert({
      where: { userId },
      update: {
        planId,
        paymentMethod,
        billingCycle,
        totalAmount: price,
        status,
        receiptUrl: receiptUrl || null,
        receipts: receipts.length > 0 ? receipts : undefined,
      },
      create: {
        userId,
        planId,
        paymentMethod,
        billingCycle,
        totalAmount: price,
        status,
        receiptUrl: receiptUrl || null,
        receipts: receipts,
      }
    });

    // Notify Admins
    if (status === 'PENDING_APPROVAL') {
      try {
        const client = await prisma.user.findUnique({
          where: { id: userId },
          select: { firstName: true, lastName: true }
        });
        const clientName = client ? `${client.firstName} ${client.lastName}` : 'Un vendedor';

        const admins = await prisma.user.findMany({
          where: { roles: { has: 'superadmin' } },
          select: { id: true }
        });

          // Notify Admins via Push and DB
          for (const admin of admins) {
            sendPushToUser(admin.id, {
              title: 'Nueva Suscripción Vendedor',
              body: `${clientName} ha subido su comprobante para el plan ${plan?.name || ''}.`,
              url: '/admin/planes/suscripciones',
              tag: 'info'
            }).catch(() => {});
          }
      } catch (notifyError) {
        console.error('Failed to notify admins about seller subscription:', notifyError);
      }
    }

    res.json(sub);
  } catch (error) {
    console.error('Error subscribing to seller plan:', error);
    res.status(500).json({ error: 'Error al procesar la suscripción' });
  }
});

// Admin: Get all seller subscriptions
router.get('/all', authenticate, async (req: AuthRequest, res) => {
  try {
    // Before returning, check for expirations
    const now = new Date();
    const expiredSubs = await prisma.sellerSubscription.findMany({
      where: {
        status: 'ACTIVE',
        expiresAt: { lt: now } as any
      },
      include: { user: true, plan: true }
    });

    if (expiredSubs.length > 0) {
      for (const sub of expiredSubs) {
        await prisma.sellerSubscription.update({
          where: { id: sub.id },
          data: { status: 'EXPIRED' }
        });

        // Update SellerProfile
        await prisma.sellerProfile.updateMany({
          where: { userId: sub.userId },
          data: { planActive: false }
        });

        // Notify Seller via Push and DB
        sendPushToUser(sub.userId, {
          title: 'Suscripción Vencida',
          body: `Tu plan ${sub.plan?.name || ''} ha vencido. Por favor, renueva para seguir operando.`,
          url: '/vendedor/planes',
          tag: 'warning'
        }).catch(() => {});

        // Notify Admin
        const admins = await prisma.user.findMany({
          where: { roles: { has: 'superadmin' } },
          select: { id: true }
        });

        // Notify Admins
        if (admins.length > 0) {
          for (const admin of admins) {
            sendPushToUser(admin.id, {
              title: 'Suscripción Vencida',
              body: `El plan de ${sub.user?.firstName || ''} ${sub.user?.lastName || ''} ha vencido.`,
              url: '/admin/planes/suscripciones',
              tag: 'info'
            }).catch(() => {});
          }
        }
      }
    }

    const subs = await prisma.sellerSubscription.findMany({
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        plan: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(subs);
  } catch (error) {
    console.error('Error fetching all seller subscriptions:', error);
    res.status(500).json({ error: 'Error al obtener las suscripciones' });
  }
});

// Admin: Approve subscription
router.post('/:id/approve', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { amountPaid } = req.body;

    const currentSub = await prisma.sellerSubscription.findUnique({
      where: { id: id as string }
    });

    if (!currentSub) {
      return res.status(404).json({ error: 'Suscripción no encontrada' });
    }

    const expiresAt = new Date();
    switch (currentSub.billingCycle) {
      case 'annual': expiresAt.setFullYear(expiresAt.getFullYear() + 1); break;
      case 'semi_annual': expiresAt.setMonth(expiresAt.getMonth() + 6); break;
      case 'quarterly': expiresAt.setMonth(expiresAt.getMonth() + 3); break;
      default: expiresAt.setMonth(expiresAt.getMonth() + 1); break;
    }

    const sub = await prisma.sellerSubscription.update({
      where: { id: id as string },
      data: {
        status: 'ACTIVE',
        paidAmount: { increment: amountPaid || 0 },
        approvedAt: new Date(),
        expiresAt: expiresAt as any
      },
      include: { user: true, plan: true }
    });

    // Also update SellerProfile planActive if exists
    const sellerProfile = await prisma.sellerProfile.findUnique({
      where: { userId: sub.userId }
    });

    if (sellerProfile) {
      await prisma.sellerProfile.update({
        where: { userId: sub.userId },
        data: { planActive: true, planId: sub.planId }
      });
    }

    // Notify Seller
    try {
      sendPushToUser(sub.userId, {
        title: 'Suscripción Aprobada',
        body: `¡Felicidades! Tu acceso al plan ${sub.plan?.name || ''} ya está activo.`,
        url: '/vendedor',
        tag: 'success'
      }).catch(() => {});
    } catch (notifyError) {
      console.error('Failed to notify seller about approval:', notifyError);
    }

    res.json(sub);
  } catch (error) {
    console.error('Error approving seller subscription:', error);
    res.status(500).json({ error: 'Error al aprobar la suscripción' });
  }
});

// Admin: Revoke subscription
router.post('/:id/revoke', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const sub = await prisma.sellerSubscription.update({
      where: { id: id as string },
      data: { status: 'REVOKED' }
    });

    // Also update SellerProfile planActive if exists
    await prisma.sellerProfile.updateMany({
      where: { userId: sub.userId },
      data: { planActive: false }
    });

    // Notify Seller
    try {
      const fullSub = await prisma.sellerSubscription.findUnique({
        where: { id: id as string },
        include: { plan: true }
      });

      if (fullSub) {
        sendPushToUser(sub.userId, {
          title: 'Suscripción Revocada',
          body: `Tu acceso al plan ${fullSub.plan?.name || ''} ha sido revocado. Contacta con soporte si crees que es un error.`,
          url: '/vendedor',
          tag: 'warning'
        }).catch(() => {});
      }
    } catch (notifyError) {
      console.error('Failed to notify seller about revocation:', notifyError);
    }

    res.json(sub);
  } catch (error) {
    console.error('Error revoking seller subscription:', error);
    res.status(500).json({ error: 'Error al revocar la suscripción' });
  }
});

// Admin: Delete subscription
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    
    const sub = await prisma.sellerSubscription.findUnique({ where: { id: id as string } });
    if (sub) {
      await prisma.sellerProfile.updateMany({
        where: { userId: sub.userId },
        data: { planActive: false }
      });
      await prisma.sellerSubscription.delete({ where: { id: id as string } });
    }

    res.json({ message: 'Suscripción eliminada' });
  } catch (error) {
    console.error('Error deleting seller subscription:', error);
    res.status(500).json({ error: 'Error al eliminar la suscripción' });
  }
});

export default router;
