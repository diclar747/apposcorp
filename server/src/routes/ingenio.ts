import { Router } from 'express';
import { prisma } from '../utils/prisma.js';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.js';
import { sendPushToUser } from '../services/pushService.js';

const router = Router();

const INGENIO_PRICE = 700000; // 700.000 Gs

// Get program info (public description of what's included)
router.get('/program', authenticate, async (req: AuthRequest, res) => {
  try {
    // Get courses count for the program
    const coursesCount = await prisma.course.count({ where: { isPublished: true } });

    res.json({
      name: 'Ingenio Millonario',
      price: INGENIO_PRICE,
      currency: 'PYG',
      installmentOptions: [
        { installments: 1, amount: INGENIO_PRICE, label: 'Pago único' },
        { installments: 2, amount: Math.ceil(INGENIO_PRICE / 2), label: '2 cuotas' },
        { installments: 3, amount: Math.ceil(INGENIO_PRICE / 3), label: '3 cuotas' },
      ],
      includes: [
        'Acceso completo al programa Ingenio Millonario',
        'Todos los cursos de Educación Financiera',
        'Módulo de Gestión de Ingresos y Egresos',
        'Módulo de Presupuestos (gastos y ganancias)',
        'Metodología 5S aplicada a finanzas personales',
        'Matriz Financiera personalizada',
        'Certificación al completar el programa',
      ],
      coursesCount,
      description:
        'Programa integral de Educación Financiera con metodología de Aula Invertida. ' +
        'Incluye acceso a todos los cursos, herramientas de gestión financiera personal ' +
        '(ingresos, egresos, presupuestos) y acompañamiento con la aplicación para ' +
        'administrar tu economía personal.',
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener información del programa' });
  }
});

// Get current user's subscription status
router.get('/subscription', authenticate, async (req: AuthRequest, res) => {
  try {
    const subscription = await prisma.ingenioSubscription.findUnique({
      where: { userId: req.user!.userId },
      include: {
        payments: {
          orderBy: { paymentNumber: 'asc' },
        },
      },
    });

    res.json(subscription);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener suscripción' });
  }
});

// Create subscription (request access) with first payment
router.post('/subscribe', authenticate, async (req: AuthRequest, res) => {
  try {
    const { installments = 1 } = req.body;

    // Validate installments
    if (![1, 2, 3].includes(installments)) {
      return res.status(400).json({ error: 'Opción de cuotas no válida. Opciones: 1, 2 o 3' });
    }

    // Check if already has access
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
    });

    if (user?.ingenioAccess) {
      return res.status(400).json({ error: 'Ya tienes acceso a Ingenio Millonario' });
    }

    // Check if already has a subscription
    const existingSub = await prisma.ingenioSubscription.findUnique({
      where: { userId: req.user!.userId },
    });

    if (existingSub && existingSub.status !== 'cancelled') {
      return res.status(400).json({
        error: 'Ya tienes una suscripción activa',
        subscription: existingSub,
      });
    }

    // Calculate first payment
    const paymentAmount = installments === 1
      ? INGENIO_PRICE
      : Math.ceil(INGENIO_PRICE / installments);

    // Check wallet balance
    const wallet = await prisma.wallet.findUnique({
      where: { userId: req.user!.userId },
    });

    if (!wallet || wallet.balance < paymentAmount) {
      return res.status(400).json({
        error: 'Saldo insuficiente en tu billetera',
        required: paymentAmount,
        available: wallet?.balance || 0,
      });
    }

    // Process subscription + first payment in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Delete cancelled subscription if exists
      if (existingSub?.status === 'cancelled') {
        await tx.ingenioPayment.deleteMany({ where: { subscriptionId: existingSub.id } });
        await tx.ingenioSubscription.delete({ where: { id: existingSub.id } });
      }

      // Create subscription
      const subscription = await tx.ingenioSubscription.create({
        data: {
          userId: req.user!.userId,
          totalAmount: INGENIO_PRICE,
          amountPaid: paymentAmount,
          installments,
          status: installments === 1 ? 'completed' : 'partial',
        },
      });

      // Create first payment record
      await tx.ingenioPayment.create({
        data: {
          subscriptionId: subscription.id,
          amount: paymentAmount,
          paymentNumber: 1,
        },
      });

      // Deduct from wallet
      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: { decrement: paymentAmount },
          totalOut: { increment: paymentAmount },
        },
      });

      // Create wallet transaction
      await tx.transaction.create({
        data: {
          walletId: wallet.id,
          userId: req.user!.userId,
          type: 'purchase',
          amount: -paymentAmount,
          description: installments === 1
            ? 'Ingenio Millonario - Pago completo'
            : `Ingenio Millonario - Cuota 1/${installments}`,
          status: 'completed',
          category: 'ingenio',
        },
      });

      // If single payment, activate access immediately
      if (installments === 1) {
        await tx.user.update({
          where: { id: req.user!.userId },
          data: { ingenioAccess: true },
        });

        await tx.ingenioSubscription.update({
          where: { id: subscription.id },
          data: { activatedAt: new Date() },
        });
      }

      return subscription;
    });

    // Send notification
    sendPushToUser(req.user!.userId, {
      title: 'Ingenio Millonario',
      body: installments === 1
        ? 'Tu acceso a Ingenio Millonario ha sido activado'
        : `Primer pago registrado. Cuota 1/${installments}`,
      url: '/app/ingenio',
      tag: 'ingenio-subscription',
    }).catch(() => {});

    const fullSub = await prisma.ingenioSubscription.findUnique({
      where: { id: result.id },
      include: { payments: true },
    });

    res.status(201).json(fullSub);
  } catch (error) {
    console.error('Subscribe error:', error);
    res.status(500).json({ error: 'Error al procesar la suscripción' });
  }
});

// Make installment payment
router.post('/pay', authenticate, async (req: AuthRequest, res) => {
  try {
    const subscription = await prisma.ingenioSubscription.findUnique({
      where: { userId: req.user!.userId },
      include: { payments: true },
    });

    if (!subscription) {
      return res.status(404).json({ error: 'No se encontró suscripción activa' });
    }

    if (subscription.status === 'completed') {
      return res.status(400).json({ error: 'La suscripción ya está pagada en su totalidad' });
    }

    if (subscription.status === 'cancelled') {
      return res.status(400).json({ error: 'La suscripción fue cancelada' });
    }

    // Calculate remaining and next payment
    const remaining = subscription.totalAmount - subscription.amountPaid;
    const remainingInstallments = subscription.installments - subscription.payments.length;
    const paymentAmount = remainingInstallments === 1
      ? remaining // Last payment: pay exact remaining
      : Math.ceil(remaining / remainingInstallments);
    const paymentNumber = subscription.payments.length + 1;

    // Check wallet
    const wallet = await prisma.wallet.findUnique({
      where: { userId: req.user!.userId },
    });

    if (!wallet || wallet.balance < paymentAmount) {
      return res.status(400).json({
        error: 'Saldo insuficiente en tu billetera',
        required: paymentAmount,
        available: wallet?.balance || 0,
      });
    }

    const newAmountPaid = subscription.amountPaid + paymentAmount;
    const isFullyPaid = newAmountPaid >= subscription.totalAmount;

    const result = await prisma.$transaction(async (tx) => {
      // Create payment record
      await tx.ingenioPayment.create({
        data: {
          subscriptionId: subscription.id,
          amount: paymentAmount,
          paymentNumber,
        },
      });

      // Update subscription
      const updatedSub = await tx.ingenioSubscription.update({
        where: { id: subscription.id },
        data: {
          amountPaid: newAmountPaid,
          status: isFullyPaid ? 'completed' : 'partial',
          activatedAt: isFullyPaid ? new Date() : undefined,
        },
      });

      // Deduct from wallet
      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: { decrement: paymentAmount },
          totalOut: { increment: paymentAmount },
        },
      });

      // Create wallet transaction
      await tx.transaction.create({
        data: {
          walletId: wallet.id,
          userId: req.user!.userId,
          type: 'purchase',
          amount: -paymentAmount,
          description: `Ingenio Millonario - Cuota ${paymentNumber}/${subscription.installments}`,
          status: 'completed',
          category: 'ingenio',
        },
      });

      // If fully paid, activate access
      if (isFullyPaid) {
        await tx.user.update({
          where: { id: req.user!.userId },
          data: { ingenioAccess: true },
        });
      }

      return updatedSub;
    });

    // Send notification
    sendPushToUser(req.user!.userId, {
      title: 'Ingenio Millonario',
      body: isFullyPaid
        ? 'Pago completado. Tu acceso ha sido activado'
        : `Cuota ${paymentNumber}/${subscription.installments} registrada`,
      url: '/app/ingenio',
      tag: 'ingenio-payment',
    }).catch(() => {});

    const fullSub = await prisma.ingenioSubscription.findUnique({
      where: { id: result.id },
      include: { payments: { orderBy: { paymentNumber: 'asc' } } },
    });

    res.json(fullSub);
  } catch (error) {
    console.error('Pay error:', error);
    res.status(500).json({ error: 'Error al procesar el pago' });
  }
});

// ============ ADMIN ROUTES ============

// Get all subscriptions (admin only)
router.get('/subscriptions', authenticate, authorize('superadmin'), async (req: AuthRequest, res) => {
  try {
    const subscriptions = await prisma.ingenioSubscription.findMany({
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
            ingenioAccess: true,
          },
        },
        payments: {
          orderBy: { paymentNumber: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(subscriptions);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener suscripciones' });
  }
});

// Admin: manually activate access for a user
router.patch('/subscriptions/:id/activate', authenticate, authorize('superadmin'), async (req: AuthRequest, res) => {
  try {
    const id = req.params.id as string;

    const subscription = await prisma.ingenioSubscription.findUnique({
      where: { id },
    });

    if (!subscription) {
      return res.status(404).json({ error: 'Suscripción no encontrada' });
    }

    await prisma.$transaction(async (tx) => {
      await tx.ingenioSubscription.update({
        where: { id },
        data: {
          status: 'completed',
          activatedAt: new Date(),
        },
      });

      await tx.user.update({
        where: { id: subscription.userId },
        data: { ingenioAccess: true },
      });
    });

    // Send notification
    sendPushToUser(subscription.userId, {
      title: 'Ingenio Millonario',
      body: 'Tu acceso a Ingenio Millonario ha sido activado por el administrador',
      url: '/app/ingenio',
      tag: 'ingenio-activated',
    }).catch(() => {});

    res.json({ message: 'Acceso activado correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al activar acceso' });
  }
});

// Admin: cancel subscription
router.patch('/subscriptions/:id/cancel', authenticate, authorize('superadmin'), async (req: AuthRequest, res) => {
  try {
    const id = req.params.id as string;

    const subscription = await prisma.ingenioSubscription.findUnique({
      where: { id },
    });

    if (!subscription) {
      return res.status(404).json({ error: 'Suscripción no encontrada' });
    }

    await prisma.$transaction(async (tx) => {
      await tx.ingenioSubscription.update({
        where: { id },
        data: { status: 'cancelled' },
      });

      await tx.user.update({
        where: { id: subscription.userId },
        data: { ingenioAccess: false },
      });
    });

    res.json({ message: 'Suscripción cancelada' });
  } catch (error) {
    res.status(500).json({ error: 'Error al cancelar suscripción' });
  }
});

export default router;
