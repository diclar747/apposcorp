import { Router } from 'express';
import { prisma } from '../utils/prisma.js';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.js';
import { sendPushToUser } from '../services/pushService.js';

const router = Router();

// Get all credits for current user
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const credits = await prisma.credit.findMany({
      where: { userId: req.user!.userId },
      include: {
        documents: true,
        paymentSchedule: {
          orderBy: { installmentNumber: 'asc' },
        },
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(credits);
  } catch (error) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Get all credits (admin only) - MUST be before /:id to avoid route conflict
router.get('/admin/all', authenticate, authorize('superadmin'), async (req: AuthRequest, res) => {
  try {
    const credits = await prisma.credit.findMany({
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            address: true,
            city: true,
            avatar: true,
          },
        },
        documents: true,
        paymentSchedule: {
          orderBy: { installmentNumber: 'asc' },
        },
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(credits);
  } catch (error) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Get credit by ID
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const id = req.params.id as string;

    const credit = await prisma.credit.findUnique({
      where: { id },
      include: {
        documents: true,
        paymentSchedule: {
          orderBy: { installmentNumber: 'asc' },
        },
        payments: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            address: true,
            city: true,
            avatar: true,
          },
        },
      },
    });

    if (!credit) {
      return res.status(404).json({ error: 'Credito no encontrado' });
    }

    // Only owner or admin can view
    if (req.user!.role !== 'superadmin' && credit.userId !== req.user!.userId) {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    res.json(credit);
  } catch (error) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Create credit request
router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const { amount, concept, installments, interestRate = 0 } = req.body;

    if (amount <= 0 || installments <= 0) {
      return res.status(400).json({ error: 'Valores invalidos' });
    }

    // Calculate installment amount
    const totalInterest = (amount * interestRate * installments) / 100;
    const totalToPay = amount + totalInterest;
    const installmentAmount = totalToPay / installments;

    // Create payment schedule
    const paymentSchedule = [];
    const today = new Date();

    for (let i = 1; i <= installments; i++) {
      const dueDate = new Date(today);
      dueDate.setMonth(dueDate.getMonth() + i);

      const principal = amount / installments;
      const interest = totalInterest / installments;

      paymentSchedule.push({
        installmentNumber: i,
        dueDate,
        amount: installmentAmount,
        principal,
        interest,
      });
    }

    const credit = await prisma.credit.create({
      data: {
        userId: req.user!.userId,
        amount,
        concept,
        installments,
        installmentAmount,
        totalToPay,
        interestRate,
        status: 'pending',
        paymentSchedule: {
          create: paymentSchedule,
        },
      },
      include: {
        paymentSchedule: true,
        documents: true,
      },
    });

    res.status(201).json(credit);
  } catch (error) {
    console.error('Create credit error:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Upload document for a credit request
router.post('/:id/documents', authenticate, async (req: AuthRequest, res) => {
  try {
    const creditId = req.params.id as string;
    const { type, dataUrl } = req.body;

    if (!type || !dataUrl) {
      return res.status(400).json({ error: 'Tipo y archivo son requeridos' });
    }

    const validTypes = ['id_front', 'id_back', 'proof_income', 'other'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: 'Tipo de documento invalido' });
    }

    // Verify credit exists and belongs to user
    const credit = await prisma.credit.findUnique({
      where: { id: creditId },
    });

    if (!credit) {
      return res.status(404).json({ error: 'Credito no encontrado' });
    }

    if (req.user!.role !== 'superadmin' && credit.userId !== req.user!.userId) {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    // Check if document of this type already exists for this credit
    const existing = await prisma.creditDocument.findFirst({
      where: { creditId, type },
    });

    let document;
    if (existing) {
      // Update existing document
      document = await prisma.creditDocument.update({
        where: { id: existing.id },
        data: { url: dataUrl, uploadedAt: new Date() },
      });
    } else {
      // Create new document
      document = await prisma.creditDocument.create({
        data: {
          creditId,
          type,
          url: dataUrl,
        },
      });
    }

    res.status(201).json(document);
  } catch (error) {
    console.error('Upload document error:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Approve credit (admin only)
router.patch('/:id/approve', authenticate, authorize('superadmin'), async (req: AuthRequest, res) => {
  try {
    const id = req.params.id as string;

    const result = await prisma.$transaction(async (tx) => {
      const credit = await tx.credit.update({
        where: { id },
        data: {
          status: 'active',
          approvedBy: req.user!.userId,
          approvedAt: new Date(),
        },
        include: {
          user: true,
        },
      });

      // Add money to user's wallet
      const wallet = await tx.wallet.findUnique({
        where: { userId: credit.userId },
      });

      if (wallet) {
        await tx.wallet.update({
          where: { id: wallet.id },
          data: {
            balance: { increment: credit.amount },
            totalIn: { increment: credit.amount },
          },
        });

        await tx.transaction.create({
          data: {
            walletId: wallet.id,
            userId: credit.userId,
            type: 'credit',
            amount: credit.amount,
            description: `Credito aprobado: ${credit.concept}`,
            status: 'completed',
            relatedCreditId: credit.id,
          },
        });
      }

      return credit;
    });

    // Push notification: credit approved
    sendPushToUser(result.userId, {
      title: 'Credito aprobado',
      body: `Tu credito de ${result.amount.toLocaleString()} por "${result.concept}" fue aprobado`,
      url: '/app/creditos',
      tag: 'credit-approved',
    }).catch(() => {});

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Reject credit (admin only)
router.patch('/:id/reject', authenticate, authorize('superadmin'), async (req: AuthRequest, res) => {
  try {
    const id = req.params.id as string;

    const credit = await prisma.credit.update({
      where: { id },
      data: {
        status: 'rejected',
        approvedBy: req.user!.userId,
        approvedAt: new Date(),
      },
    });

    // Push notification: credit rejected
    sendPushToUser(credit.userId, {
      title: 'Credito rechazado',
      body: `Tu solicitud de credito por "${credit.concept}" fue rechazada`,
      url: '/app/creditos',
      tag: 'credit-rejected',
    }).catch(() => {});

    res.json(credit);
  } catch (error) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Pay installment
router.post('/:id/pay', authenticate, async (req: AuthRequest, res) => {
  try {
    const id = req.params.id as string;
    const { installmentId, paymentMethod } = req.body;

    const credit = await prisma.credit.findUnique({
      where: { id },
      include: {
        paymentSchedule: true,
      },
    });

    if (!credit) {
      return res.status(404).json({ error: 'Credito no encontrado' });
    }

    if (credit.userId !== req.user!.userId) {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    const installment = credit.paymentSchedule.find(p => p.id === installmentId);

    if (!installment) {
      return res.status(404).json({ error: 'Cuota no encontrada' });
    }

    if (installment.status === 'paid') {
      return res.status(400).json({ error: 'Cuota ya pagada' });
    }

    const wallet = await prisma.wallet.findUnique({
      where: { userId: req.user!.userId },
    });

    if (!wallet || wallet.balance < installment.amount) {
      return res.status(400).json({ error: 'Saldo insuficiente' });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Deduct from wallet
      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: { decrement: installment.amount },
          totalOut: { increment: installment.amount },
        },
      });

      // Create payment record
      await tx.creditPayment.create({
        data: {
          creditId: id,
          installmentId,
          amount: installment.amount,
          paymentMethod,
        },
      });

      // Update installment status
      await tx.paymentScheduleItem.update({
        where: { id: installmentId },
        data: {
          status: 'paid',
          paidAt: new Date(),
        },
      });

      // Check if all installments are paid
      const allInstallments = await tx.paymentScheduleItem.findMany({
        where: { creditId: id },
      });

      const allPaid = allInstallments.every((i: { status: string }) => i.status === 'paid');

      if (allPaid) {
        await tx.credit.update({
          where: { id },
          data: { status: 'completed' },
        });
      }

      // Create transaction record
      await tx.transaction.create({
        data: {
          walletId: wallet.id,
          userId: req.user!.userId,
          type: 'expense',
          amount: -installment.amount,
          description: `Pago de cuota ${installment.installmentNumber} - ${credit.concept}`,
          status: 'completed',
          relatedCreditId: id,
        },
      });

      return { message: 'Pago realizado exitosamente' };
    });

    res.json(result);
  } catch (error) {
    console.error('Pay installment error:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

export default router;
